import fs from 'fs';
import os from 'os';
import path from 'path';
import { createHash, createHmac, randomUUID } from 'crypto';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

export type SqliteBackupDatabase = {
  backup(destination: string): Promise<unknown>;
};

export async function createCompressedSqliteSnapshot(
  database: SqliteBackupDatabase,
  snapshotPath: string,
  gzipPath: string,
): Promise<Buffer> {
  if (!snapshotPath || !gzipPath || snapshotPath === gzipPath) {
    throw new Error('SQLITE_BACKUP_PATHS_INVALID');
  }

  fs.rmSync(snapshotPath, { force: true });
  fs.rmSync(gzipPath, { force: true });

  try {
    await database.backup(snapshotPath);
    await pipeline(
      fs.createReadStream(snapshotPath),
      createGzip({ level: 9 }),
      fs.createWriteStream(gzipPath),
    );
    return fs.readFileSync(gzipPath);
  } catch (error) {
    fs.rmSync(snapshotPath, { force: true });
    fs.rmSync(gzipPath, { force: true });
    throw error;
  }
}

/** A backup destination is explicit: incomplete remote configuration never falls
 * back to a local disk. R2 retention belongs to the bucket lifecycle policy. */
export async function createDatabaseBackup(database: SqliteBackupDatabase, options: {
  databasePath: string;
  env?: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
  now?: Date;
}) {
  const env = options.env || process.env;
  const remote = [env.R2_ACCOUNT_ID, env.R2_ACCESS_KEY_ID, env.R2_SECRET_ACCESS_KEY];
  if (remote.some(Boolean) && !remote.every(Boolean)) throw new Error('R2_BACKUP_CONFIGURATION_INCOMPLETE');
  const bucket = env.R2_BUCKET || 'forge-backups', region = env.R2_REGION || 'auto';
  if (remote.every(Boolean) && (!/^[a-f0-9]{32}$/.test(env.R2_ACCOUNT_ID!)
    || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || !/^[a-z0-9-]{1,32}$/.test(region))) {
    throw new Error('R2_BACKUP_CONFIGURATION_INVALID');
  }
  const now = options.now || new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const filename = `forge-${stamp}-${randomUUID()}.db.gz`;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-backup-'));
  try {
    const bytes = await createCompressedSqliteSnapshot(database, path.join(temporary, 'snapshot.db'), path.join(temporary, 'snapshot.db.gz'));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (remote.every(Boolean)) {
      const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const key = `forge-db/${filename}`, uri = `/${bucket}/${key}`;
      const amzDate = (options.now || new Date()).toISOString().replace(/[:-]|\.\d{3}/g, '');
      const headers: Record<string, string> = { host, 'content-type':'application/gzip', 'content-length':String(bytes.length),
        'x-amz-content-sha256':sha256, 'x-amz-date':amzDate };
      const names = Object.keys(headers).sort(), signedHeaders = names.join(';');
      const canonical = ['PUT',uri,'',names.map(name => `${name}:${headers[name]}\n`).join(''),signedHeaders,sha256].join('\n');
      const date = amzDate.slice(0,8), scope = `${date}/${region}/s3/aws4_request`;
      const sign = (key: string | Buffer, value: string) => createHmac('sha256',key).update(value).digest();
      const signingKey = sign(sign(sign(sign('AWS4'+env.R2_SECRET_ACCESS_KEY,date),region),'s3'),'aws4_request');
      const signature = createHmac('sha256',signingKey).update(['AWS4-HMAC-SHA256',amzDate,scope,createHash('sha256').update(canonical).digest('hex')].join('\n')).digest('hex');
      headers.Authorization = `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
      let response: Response;
      try {
        response = await (options.fetch || fetch)(`https://${host}${uri}`, {method:'PUT',headers,body:bytes,
          redirect:'error',signal:AbortSignal.timeout(30000)});
      } catch { throw new Error('R2_BACKUP_NETWORK_FAILED'); }
      if (!response.ok) throw new Error(`R2_BACKUP_UPLOAD_FAILED_${response.status}`);
      return {ok:true,destination:'r2',sizeBytes:bytes.length,key,sha256};
    }
    const directory = env.FORGE_BACKUP_DIR || path.join(path.dirname(path.resolve(options.databasePath)), 'backups');
    fs.mkdirSync(directory,{recursive:true,mode:0o700});
    fs.writeFileSync(path.join(directory,filename),bytes,{flag:'wx',mode:0o600});
    return {ok:true,destination:'local',sizeBytes:bytes.length,key:filename,sha256};
  } finally {
    // This directory was exclusively created by mkdtemp above.
    fs.rmSync(temporary,{recursive:true,force:true});
  }
}
