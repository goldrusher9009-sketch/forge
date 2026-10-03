import { createHash, randomUUID } from 'node:crypto';
import type { BrainDatabase } from './brain-service';

export class ArtifactError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
const fail = (code: string, status = 400): never => { throw new ArtifactError(code,status); };
const MAX_BYTES = 1024 * 1024;
const ACCOUNT_BYTES = 50 * MAX_BYTES;
const extensions: Record<string,string> = { html:'html',svg:'svg',markdown:'md',md:'md',json:'json',csv:'csv',javascript:'js',js:'js',typescript:'ts',ts:'ts',python:'py',py:'py',css:'css',sql:'sql',yaml:'yaml',text:'txt',plaintext:'txt' };
const string = (value: unknown, max: number, code: string, empty = false): string => {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim()) || value.includes('\0')) fail(code);
  return value as string;
};
export function artifactFilename(title: string, language: string) {
  const extension = extensions[language.toLowerCase()] || 'txt';
  let base = Array.from(title.replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g,'-').replace(/^[.\s]+|[.\s]+$/g,'')).slice(0,100).join('') || 'artifact';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base)) base = 'forge-'+base;
  return base.toLowerCase().endsWith('.'+extension) ? base : base+'.'+extension;
}

/** Pure text validation shared by private and isolated marketplace storage. */
export function normalizeArtifactValues(input: any) {
  const title = string(input?.title ?? 'Untitled',200,'ARTIFACT_INVALID_TITLE').trim();
  const language = string(input?.language ?? '',40,'ARTIFACT_INVALID_LANGUAGE',true).trim().toLowerCase();
  const type = string(input?.type ?? (['html','svg'].includes(language)?language:'code'),40,'ARTIFACT_INVALID_TYPE');
  const content = string(input?.content ?? '',MAX_BYTES,'ARTIFACT_INVALID_CONTENT',true);
  if (Buffer.byteLength(content,'utf8') > MAX_BYTES) fail('ARTIFACT_TOO_LARGE',413);
  return {title,language,type,content};
}

/** The saved artifact and tool receipt commit together, before reporting success.
 * Receipts survive user deletion so a retried tool cannot recreate deleted work. */
export function createArtifactStore(db: BrainDatabase) {
  db.exec(`CREATE TABLE IF NOT EXISTS artifact_tool_receipts (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    run_id TEXT NOT NULL, tool_call_id TEXT NOT NULL, input_hash TEXT NOT NULL, artifact_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY(user_id,thread_id,run_id,tool_call_id));
    CREATE TABLE IF NOT EXISTS artifact_run_outputs (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    run_id TEXT NOT NULL, filename TEXT NOT NULL, artifact_id TEXT NOT NULL, input_hash TEXT NOT NULL,
    PRIMARY KEY(user_id,thread_id,run_id,filename));`);
  const atomic = <T extends (...args: any[]) => any>(fn: T): T => {
    const transaction = db.transaction(fn) as T & { immediate?: T }; return transaction.immediate || transaction;
  };
  const get = (user: string, id: string) => {
    const row = db.prepare('SELECT * FROM artifacts WHERE user_id=? AND id=?').get(user,id);
    if (!row) fail('ARTIFACT_NOT_FOUND',404);
    return {...row,filename:artifactFilename(row.title,row.language),sizeBytes:Buffer.byteLength(row.content,'utf8')};
  };
  const thread = (user: string, id: string) => {
    const row = db.prepare('SELECT * FROM threads WHERE user_id=? AND id=?').get(user,string(id,128,'ARTIFACT_INVALID_THREAD'));
    if (!row) fail('THREAD_NOT_FOUND',404); return row;
  };
  const values = normalizeArtifactValues;
  const quota = (user: string, nextBytes: number, replacedId?: string) => {
    const state = db.prepare("SELECT COUNT(*) n,COALESCE(SUM(length(CAST(content AS BLOB))),0) bytes FROM artifacts WHERE user_id=? AND id<>?").get(user,replacedId || '');
    if (state.n >= 1000 || state.bytes+nextBytes > ACCOUNT_BYTES) fail('ARTIFACT_STORAGE_LIMIT',413);
  };
  const create = atomic((user: string, input: any) => {
    const value = values(input);
    let projectId = input?.project_id || null;
    if (projectId && !db.prepare('SELECT id FROM projects WHERE id=? AND user_id=?').get(string(projectId,128,'ARTIFACT_INVALID_PROJECT'),user)) fail('PROJECT_NOT_FOUND',404);
    if (input?.thread_id) {
      const ownerThread = thread(user,input.thread_id);
      if (projectId && projectId !== ownerThread.project_id) fail('ARTIFACT_PROJECT_MISMATCH',409);
      projectId = ownerThread.project_id;
    }
    if (input?.message_id) {
      const message = db.prepare('SELECT m.thread_id FROM messages m JOIN threads t ON t.id=m.thread_id WHERE m.id=? AND t.user_id=?').get(string(input.message_id,128,'ARTIFACT_INVALID_MESSAGE'),user);
      if (!message || !input.thread_id || message.thread_id !== input.thread_id) fail('ARTIFACT_MESSAGE_MISMATCH',404);
    }
    quota(user,Buffer.byteLength(value.content,'utf8'));
    const id = randomUUID();
    db.prepare('INSERT INTO artifacts(id,user_id,project_id,thread_id,message_id,type,title,content,language) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(id,user,projectId,input?.thread_id || null,input?.message_id || null,value.type,value.title,value.content,value.language);
    return get(user,id);
  });
  const fromTool = atomic((user: string, threadId: string, runId: string, toolCallId: string, input: any) => {
    thread(user,threadId); string(runId,256,'ARTIFACT_INVALID_RUN'); string(toolCallId,256,'ARTIFACT_INVALID_TOOL_CALL');
    const value = values(input);
    if (!value.content.trim()) fail('ARTIFACT_EMPTY_CONTENT');
    const fingerprint = createHash('sha256').update(JSON.stringify(value)).digest('hex');
    const prior = db.prepare('SELECT * FROM artifact_tool_receipts WHERE user_id=? AND thread_id=? AND run_id=? AND tool_call_id=?').get(user,threadId,runId,toolCallId);
    if (prior) {
      if (prior.input_hash !== fingerprint) fail('ARTIFACT_TOOL_CALL_CONFLICT',409);
      return get(user,prior.artifact_id);
    }
    const filename = artifactFilename(value.title,value.language).toLowerCase();
    const output = db.prepare('SELECT * FROM artifact_run_outputs WHERE user_id=? AND thread_id=? AND run_id=? AND filename=?').get(user,threadId,runId,filename);
    let saved;
    if (output) {
      saved = get(user,output.artifact_id);
      const currentHash = createHash('sha256').update(JSON.stringify(values(saved))).digest('hex');
      if (currentHash !== output.input_hash) fail('ARTIFACT_EDIT_CONFLICT',409);
      if (fingerprint !== currentHash) {
        quota(user,Buffer.byteLength(value.content,'utf8'),saved.id);
        db.prepare("UPDATE artifacts SET title=?,content=?,language=?,type=?,version=version+1,updated_at=datetime('now') WHERE id=? AND user_id=?")
          .run(value.title,value.content,value.language,value.type,saved.id,user);
        db.prepare('UPDATE artifact_run_outputs SET input_hash=? WHERE user_id=? AND thread_id=? AND run_id=? AND filename=?').run(fingerprint,user,threadId,runId,filename);
        saved = get(user,saved.id);
      }
    } else {
      saved = create(user,{...value,thread_id:threadId});
      db.prepare('INSERT INTO artifact_run_outputs(user_id,thread_id,run_id,filename,artifact_id,input_hash) VALUES(?,?,?,?,?,?)').run(user,threadId,runId,filename,saved.id,fingerprint);
    }
    db.prepare('INSERT INTO artifact_tool_receipts(user_id,thread_id,run_id,tool_call_id,input_hash,artifact_id) VALUES(?,?,?,?,?,?)').run(user,threadId,runId,toolCallId,fingerprint,saved.id);
    return saved;
  });
  const forRun = (user: string, threadId: string, runId: string) => {
    thread(user,threadId);
    return db.prepare('SELECT DISTINCT a.id FROM artifact_tool_receipts r JOIN artifacts a ON a.id=r.artifact_id AND a.user_id=r.user_id WHERE r.user_id=? AND r.thread_id=? AND r.run_id=?').all(user,threadId,runId).map(row=>get(user,row.id));
  };
  const attach = atomic((user: string, threadId: string, runId: string, messageId: string) => {
    thread(user,threadId);
    if (!db.prepare('SELECT id FROM messages WHERE id=? AND thread_id=?').get(messageId,threadId)) fail('ARTIFACT_MESSAGE_MISMATCH',404);
    const rows = forRun(user,threadId,runId);
    for (const row of rows) db.prepare('UPDATE artifacts SET message_id=? WHERE id=? AND user_id=? AND message_id IS NULL').run(messageId,row.id,user);
    db.prepare('UPDATE messages SET artifact_ids=? WHERE id=? AND thread_id=?').run(JSON.stringify(rows.map(row=>row.id)),messageId,threadId);
    return rows.map(row=>get(user,row.id));
  });
  const update = atomic((user: string,id: string,input: any) => {
    const old = get(user,id), value = values({...old,...input});
    if (input.pinned !== undefined && ![true,false,0,1].includes(input.pinned)) fail('ARTIFACT_INVALID_PIN');
    quota(user,Buffer.byteLength(value.content,'utf8'),id);
    db.prepare("UPDATE artifacts SET title=?,content=?,language=?,type=?,pinned=?,version=version+1,updated_at=datetime('now') WHERE id=? AND user_id=?")
      .run(value.title,value.content,value.language,value.type,input.pinned === undefined ? old.pinned : Number(Boolean(input.pinned)),id,user);
    return get(user,id);
  });
  const list = (user: string,filter: any = {}) => {
    let sql = 'SELECT id FROM artifacts WHERE user_id=?'; const params: any[] = [user];
    if (filter.thread_id) { thread(user,filter.thread_id);sql+=' AND thread_id=?';params.push(filter.thread_id); }
    if (filter.project_id) { string(filter.project_id,128,'ARTIFACT_INVALID_PROJECT');sql+=' AND project_id=?';params.push(filter.project_id); }
    if (filter.pinned === 'true') sql+=' AND pinned=1';
    return db.prepare(sql+' ORDER BY updated_at DESC,rowid DESC LIMIT 50').all(...params).map(row=>get(user,row.id));
  };
  return {get,create,fromTool,forRun,attach,update,list};
}

export function registerArtifactRoutes(app: any,auth: any,store: ReturnType<typeof createArtifactStore>,db: BrainDatabase) {
  const route = (work: (req: any,res: any)=>void) => (req: any,res: any) => {
    try { work(req,res); } catch (error) { res.status(error instanceof ArtifactError?error.status:500).json({success:false,error:error instanceof ArtifactError?error.code:'ARTIFACT_OPERATION_FAILED'}); }
  };
  app.get('/api/artifacts',auth,route((req,res)=>res.json({success:true,data:store.list(req.user.sub,req.query)})));
  app.post('/api/artifacts',auth,route((req,res)=>res.status(201).json({success:true,data:store.create(req.user.sub,req.body)})));
  app.get('/api/artifacts/:id',auth,route((req,res)=>res.json({success:true,data:store.get(req.user.sub,req.params.id)})));
  app.get('/api/artifacts/:id/download',auth,route((req,res)=>{
    const saved=store.get(req.user.sub,req.params.id);
    res.set({'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="forge-artifact.${saved.filename.split('.').pop()}"; filename*=UTF-8''${encodeURIComponent(saved.filename).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase())}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    res.send(Buffer.from(saved.content,'utf8'));
  }));
  app.patch('/api/artifacts/:id',auth,route((req,res)=>res.json({success:true,data:store.update(req.user.sub,req.params.id,req.body)})));
  app.delete('/api/artifacts/:id',auth,route((req,res)=>{
    store.get(req.user.sub,req.params.id);db.prepare('DELETE FROM artifacts WHERE id=? AND user_id=?').run(req.params.id,req.user.sub);
    res.json({success:true,message:'Artifact deleted'});
  }));
}
