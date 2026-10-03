import { createHash, createHmac, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { BrainDatabase } from './brain-service';

export type AccountIdentity = { sub:string; id:string; userId:string; email:string; role:string; sid?:string; av?:number };
const invalid = (): never => { throw new Error('INVALID_TOKEN'); };

/** A refresh-token row is the session. Rotation keeps its ID; logout removes it. */
export function createAccountSessions(db:BrainDatabase,secret:string,accessLifetime:string,refreshLifetime:string) {
  if(!db.prepare('PRAGMA table_info(users)').all().some(row=>row.name==='auth_version')) db.exec('ALTER TABLE users ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0');
  if(!db.prepare('PRAGMA table_info(refresh_tokens)').all().some(row=>row.name==='credential_hash')) db.exec('ALTER TABLE refresh_tokens ADD COLUMN credential_hash TEXT');
  db.exec(`CREATE TABLE IF NOT EXISTS revoked_legacy_access_tokens (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);`);
  const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
  const credential=(user:any)=>createHmac('sha256',secret).update(user.password).digest('hex');
  const identity=(user:any,sid?:string):AccountIdentity=>({sub:user.id,id:user.id,userId:user.id,email:user.email,role:user.role,av:user.auth_version,...(sid?{sid}:{})});
  const decode=(token:unknown):any=>{
    if(typeof token!=='string'||token.length>16384)invalid();
    const claims=jwt.verify(token as string,secret,{algorithms:['HS256']});
    if(typeof claims==='string'||typeof claims.sub!=='string'||!claims.sub||!Number.isFinite(claims.exp))invalid();
    return claims;
  };
  const owner=(claims:any)=>{
    const user=db.prepare('SELECT id,email,role,password,auth_version FROM users WHERE id=?').get(claims.sub);
    if(!user||(claims.av??0)!==user.auth_version)invalid();
    return user;
  };
  const validSession=(user:any,sid:unknown)=>{
    if(typeof sid!=='string')invalid();
    const row=db.prepare('SELECT * FROM refresh_tokens WHERE id=? AND user_id=?').get(sid,user.id);
    if(!row||!Number.isFinite(Date.parse(row.expires_at))||Date.parse(row.expires_at)<=Date.now()||row.credential_hash!==credential(user))invalid();
    return row;
  };
  const verifyAccess=(token:string):AccountIdentity=>{
    const claims=decode(token),user=owner(claims);
    if(claims.token_use==='access'){
      validSession(user,claims.sid);
      return identity(user,claims.sid);
    }
    // Existing access JWTs had neither sid nor jti. Existing refresh JWTs had jti.
    // Preserve those access sessions on upgrade, but never accept a refresh JWT.
    if(claims.token_use!==undefined||claims.sid!==undefined||claims.jti!==undefined||claims.av!==undefined)invalid();
    if(db.prepare('SELECT 1 FROM revoked_legacy_access_tokens WHERE token_hash=?').get(hash(token)))invalid();
    return identity(user);
  };
  const pair=(user:any,sid:string)=>{
    const base=identity(user,sid);
    const accessToken=jwt.sign({...base,token_use:'access'},secret,{algorithm:'HS256',expiresIn:accessLifetime} as jwt.SignOptions);
    const refreshToken=jwt.sign({...base,token_use:'refresh',jti:randomUUID()},secret,{algorithm:'HS256',expiresIn:refreshLifetime} as jwt.SignOptions);
    const expiresAt=new Date((jwt.decode(refreshToken) as jwt.JwtPayload).exp!*1000).toISOString();
    return {accessToken,refreshToken,expiresAt,userId:user.id};
  };
  const issue=db.transaction((userId:string)=>{
    const user=db.prepare('SELECT id,email,role,password,auth_version FROM users WHERE id=?').get(userId);if(!user)invalid();
    const sid=randomUUID(),tokens=pair(user,sid);
    db.prepare('DELETE FROM revoked_legacy_access_tokens WHERE expires_at<=?').run(Date.now());
    db.prepare('INSERT INTO refresh_tokens(id,user_id,token,expires_at,credential_hash) VALUES(?,?,?,?,?)').run(sid,user.id,tokens.refreshToken,tokens.expiresAt,credential(user));
    return tokens;
  });
  const refresh=db.transaction((token:string)=>{
    const claims=decode(token),user=owner(claims);
    if(claims.token_use!=='refresh'&&!(claims.token_use===undefined&&typeof claims.jti==='string'&&claims.sid===undefined))invalid();
    const row=db.prepare('SELECT * FROM refresh_tokens WHERE token=? AND user_id=?').get(token,user.id);
    if(!row||!Number.isFinite(Date.parse(row.expires_at))||Date.parse(row.expires_at)<=Date.now())invalid();
    if(claims.token_use==='refresh'){
      if(claims.sid!==row.id)invalid();
      validSession(user,row.id);
    } else if(row.credential_hash)invalid();
    const tokens=pair(user,row.id);
    const changed=db.prepare('UPDATE refresh_tokens SET token=?,expires_at=?,credential_hash=? WHERE id=? AND token=?').run(tokens.refreshToken,tokens.expiresAt,credential(user),row.id,token);
    if(changed.changes!==1)invalid();
    return tokens;
  });
  const revoke=db.transaction((accessToken:string,refreshToken?:string)=>{
    const actor=verifyAccess(accessToken);
    if(actor.sid)db.prepare('DELETE FROM refresh_tokens WHERE id=? AND user_id=?').run(actor.sid,actor.sub);
    else {
      const claims=decode(accessToken);
      db.prepare('INSERT OR IGNORE INTO revoked_legacy_access_tokens(token_hash,user_id,expires_at) VALUES(?,?,?)').run(hash(accessToken),actor.sub,claims.exp*1000);
      if(typeof refreshToken==='string')db.prepare('DELETE FROM refresh_tokens WHERE token=? AND user_id=?').run(refreshToken,actor.sub);
    }
    return actor;
  });
  const revokeAll=db.transaction((userId:string)=>{
    db.prepare('UPDATE users SET auth_version=auth_version+1 WHERE id=?').run(userId);
    db.prepare('DELETE FROM refresh_tokens WHERE user_id=?').run(userId);
  });
  return {verifyAccess,issue,refresh,revoke,revokeAll};
}
