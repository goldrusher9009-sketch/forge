import { createHash, randomUUID } from 'node:crypto';
import type { BrainDatabase } from './brain-service';
import { artifactFilename } from './artifact-store';

type Kind = 'file_exists' | 'text_contains' | 'json_value' | 'csv_rows' | 'csv_sum';
export type DeliveryRule = { kind:Kind; filename:string; field?:string; expected?:string|number|boolean|null };
class DeliveryError extends Error { constructor(public code:string,public status=400){super(code);} }
const fail=(code:string,status=400):never=>{throw new DeliveryError(code,status);};
const hash=(value:any)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text=(value:any,max:number):string=>{if(typeof value!=='string'||!value.trim()||value.length>max||value.includes('\0'))fail('DELIVERY_RULE_INVALID');return value.trim();};
function decimalUnits(raw:string):bigint{
  const match=/^(-?)(\d{1,13})(?:\.(\d{1,6}))?$/.exec(raw);if(!match)throw Error('NUMBER');
  return(match[1]?-1n:1n)*(BigInt(match[2])*1000000n+BigInt((match[3]||'').padEnd(6,'0')));
}
export function deliveryRules(input:any):DeliveryRule[]{
  if(!Array.isArray(input)||input.length<1||input.length>10)fail('DELIVERY_RULES_REQUIRED');
  return input.map((rule:any)=>{
    if(!rule||!['file_exists','text_contains','json_value','csv_rows','csv_sum'].includes(rule.kind))fail('DELIVERY_RULE_INVALID');
    const result:DeliveryRule={kind:rule.kind,filename:text(rule.filename,200)};
    if(/[\\/]/.test(result.filename)||['.','..'].includes(result.filename))fail('DELIVERY_RULE_INVALID');
    if(rule.kind==='text_contains')result.expected=text(rule.expected,2000);
    if(rule.kind==='json_value'){
      result.field=text(rule.field,300);
      if(!result.field.startsWith('/')||/~(?![01])/.test(result.field))fail('DELIVERY_RULE_INVALID');
      if(rule.expected!==null&&!['string','number','boolean'].includes(typeof rule.expected))fail('DELIVERY_RULE_INVALID');
      if(typeof rule.expected==='number'&&(!Number.isFinite(rule.expected)||Math.abs(rule.expected)>1e12))fail('DELIVERY_RULE_INVALID');
      if(typeof rule.expected==='string'&&rule.expected.length>2000)fail('DELIVERY_RULE_INVALID');
      result.expected=rule.expected;
    }
    if(rule.kind==='csv_sum'||rule.kind==='csv_rows'){
      if(typeof rule.expected!=='number'||!Number.isFinite(rule.expected)||Math.abs(rule.expected)>1e12)fail('DELIVERY_RULE_INVALID');
      if(rule.kind==='csv_rows'&&(!Number.isSafeInteger(rule.expected)||rule.expected<0||rule.expected>10000))fail('DELIVERY_RULE_INVALID');
      result.expected=rule.expected;
      if(rule.kind==='csv_sum'){try{decimalUnits(String(rule.expected));}catch{fail('DELIVERY_RULE_INVALID');}result.field=text(rule.field,200);}
    }
    return result;
  });
}

/** Bounded RFC-style CSV parser. Quoted commas/newlines and escaped quotes count
 * as one field. Ragged rows, duplicate headers and malformed quotes fail closed. */
function csv(content:string):string[][]{
  const source=content.replace(/^\uFEFF/,'');const rows:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false;
  const cell=()=>{row.push(field);field='';closed=false;if(row.length>200)throw Error('CSV_LIMIT');};
  const line=()=>{cell();rows.push(row);row=[];if(rows.length>10001)throw Error('CSV_LIMIT');};
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(quoted){if(c==='"'){if(source[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c===','){cell();continue;}
    if(c==='\r'||c==='\n'){if(c==='\r'&&source[i+1]==='\n')i++;line();continue;}
    if(c==='"'&&!field&&!closed){quoted=true;continue;}
    if(closed||c==='"')throw Error('CSV_SYNTAX');field+=c;
  }
  if(quoted)throw Error('CSV_SYNTAX');if(field||row.length||closed)line();
  if(!rows.length||rows[0].some(c=>!c)||new Set(rows[0]).size!==rows[0].length||rows.some(r=>r.length!==rows[0].length))throw Error('CSV_SYNTAX');
  return rows;
}
export function checkDeliveryRule(rule:DeliveryRule,files:any[]){
  const matches=files.filter(f=>f.filename===rule.filename);
  if(matches.length!==1)return{rule,passed:false,reason:matches.length?'FILE_AMBIGUOUS':'FILE_MISSING'};
  const file=matches[0];
  if(!file.original)return{rule,passed:false,reason:'FILE_CHANGED',artifactId:file.id};
  let passed=false,actual:any,reason='VALUE_MISMATCH';
  try{
    if(rule.kind==='file_exists'){passed=file.content.trim().length>0;reason='FILE_EMPTY';}
    if(rule.kind==='text_contains'){passed=file.content.includes(rule.expected as string);reason='TEXT_MISSING';}
    if(rule.kind==='json_value'){
      if(file.language!=='json')throw Error('FORMAT');
      let value:any=JSON.parse(file.content);let found=true;
      for(const part of rule.field!.slice(1).split('/').map(p=>p.replace(/~1/g,'/').replace(/~0/g,'~'))){
        if(value===null||typeof value!=='object'||!Object.prototype.hasOwnProperty.call(value,part)){found=false;break;}value=value[part];
      }
      actual=found&&['string','number','boolean'].includes(typeof value)?typeof value==='string'?value.slice(0,2000):value:found&&value===null?null:undefined;
      passed=found&&value===rule.expected;reason=found?'VALUE_MISMATCH':'FIELD_MISSING';
    }
    if(rule.kind==='csv_rows'||rule.kind==='csv_sum'){
      if(file.language!=='csv')throw Error('FORMAT');const rows=csv(file.content);
      if(rule.kind==='csv_rows'){actual=rows.length-1;passed=actual===rule.expected;}
      else{
        const column=rows[0].indexOf(rule.field!);if(column<0)return{rule,passed:false,reason:'FIELD_MISSING',artifactId:file.id};
        // Decimal arithmetic to six places; never silently coerce blanks, currency
        // symbols, booleans or non-finite values into a plausible financial sum.
        let total=0n;
        for(const row of rows.slice(1)){
          total+=decimalUnits(row[column].trim());
        }
        if(total>1000000000000000000n||total< -1000000000000000000n)throw Error('NUMBER');actual=Number(total)/1e6;
        passed=total===decimalUnits(String(rule.expected));
        // Keep the displayed value exact too when Number cannot represent it.
        if(decimalUnits(String(actual))!==total){const absolute=total<0n?-total:total;actual=(total<0n?'-':'')+String(absolute/1000000n)+'.'+String(absolute%1000000n).padStart(6,'0');}
      }
    }
  }catch{reason='INVALID_CONTENT';passed=false;}
  return{rule,passed,reason:passed?'MATCH':reason,artifactId:file.id,...(actual===undefined?{}:{actual})};
}

export function createTaskDeliveryChecks(db:BrainDatabase){
  db.exec(`CREATE TABLE IF NOT EXISTS delivery_checklists (
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,rules_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),UNIQUE(user_id,name));
    CREATE TABLE IF NOT EXISTS task_delivery_checks (
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,input_hash TEXT NOT NULL,report_json TEXT NOT NULL,
    last_used_at INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),UNIQUE(user_id,thread_id,input_hash));
    CREATE INDEX IF NOT EXISTS task_delivery_checks_owner ON task_delivery_checks(user_id,thread_id);`);
  const owner=(user:string,thread:string)=>{
    const row=db.prepare('SELECT id,model,agent_release_id FROM threads WHERE id=? AND user_id=?').get(thread,user);
    if(!row)fail('THREAD_NOT_FOUND',404);return row;
  };
  const snapshot=(user:string,threadId:string)=>{
    const thread=owner(user,threadId);
    const run=db.prepare('SELECT id,status FROM pi_thread_runs WHERE user_id=? AND thread_id=? ORDER BY rowid DESC LIMIT 1').get(user,threadId);
    if(!run)return{thread,run:null,files:[],receipts:[]};
    const files=db.prepare(`SELECT a.*,r.input_hash FROM artifact_tool_receipts r JOIN artifacts a ON a.id=r.artifact_id AND a.user_id=r.user_id AND a.thread_id=r.thread_id
      WHERE r.user_id=? AND r.thread_id=? AND r.run_id=? ORDER BY a.id`).all(user,threadId,run.id).map(row=>({
        id:row.id,filename:artifactFilename(row.title,row.language),version:row.version,language:row.language,content:row.content,
        original:hash({title:row.title,language:row.language,type:row.type,content:row.content})===row.input_hash,sha256:createHash('sha256').update(row.content).digest('hex'),
      }));
    const receipts=db.prepare(`SELECT p.request_id id,p.usage_status usageStatus,b.state,b.charged_units FROM pi_provider_receipts p
      LEFT JOIN managed_billing_requests b ON b.id=p.request_id AND b.user_id=p.user_id WHERE p.user_id=? AND p.run_id=? ORDER BY p.request_id`).all(user,`thread:${threadId}:${run.id}`);
    return{thread,run,files,receipts};
  };
  const fingerprint=(snap:ReturnType<typeof snapshot>,rules:DeliveryRule[])=>hash({checkerVersion:2,thread:snap.thread,run:snap.run,files:snap.files.map(({content,...file})=>file),receipts:snap.receipts,rules});
  const list=(user:string)=>db.prepare('SELECT id,name,rules_json,created_at FROM delivery_checklists WHERE user_id=? ORDER BY created_at DESC,rowid DESC').all(user).map(row=>({id:row.id,name:row.name,rules:JSON.parse(row.rules_json),createdAt:row.created_at}));
  const save=db.transaction((user:string,input:any)=>{
    const name=text(input?.name,80),rules=deliveryRules(input?.rules),encoded=JSON.stringify(rules);
    const prior=db.prepare('SELECT id,rules_json FROM delivery_checklists WHERE user_id=? AND name=?').get(user,name);
    if(prior){if(prior.rules_json!==encoded)fail('DELIVERY_CHECKLIST_NAME_EXISTS',409);return list(user).find(row=>row.id===prior.id);}
    if(list(user).length>=30)fail('DELIVERY_CHECKLIST_LIMIT',409);
    const id=randomUUID();db.prepare('INSERT INTO delivery_checklists(id,user_id,name,rules_json) VALUES(?,?,?,?)').run(id,user,name,encoded);
    return list(user).find(row=>row.id===id);
  });
  const remove=(user:string,id:string)=>{if(!db.prepare('DELETE FROM delivery_checklists WHERE user_id=? AND id=?').run(user,id).changes)fail('DELIVERY_CHECKLIST_NOT_FOUND',404);};
  const verify=db.transaction((user:string,threadId:string,input:any)=>{
    const rules=deliveryRules(input?.rules),snap=snapshot(user,threadId);
    if(!snap.run)fail('DELIVERY_RUN_REQUIRED',409);
    if(snap.run.status==='running')fail('DELIVERY_RUN_ACTIVE',409);
    const digest=fingerprint(snap,rules),prior=db.prepare('SELECT report_json FROM task_delivery_checks WHERE user_id=? AND thread_id=? AND input_hash=?').get(user,threadId,digest);
    const usedAt=Math.max(Date.now(),Number(db.prepare('SELECT COALESCE(MAX(last_used_at),0)+1 n FROM task_delivery_checks WHERE user_id=? AND thread_id=?').get(user,threadId).n));
    if(prior){const report=JSON.parse(prior.report_json);db.prepare('UPDATE task_delivery_checks SET last_used_at=? WHERE id=? AND user_id=?').run(usedAt,report.id,user);return{...report,current:true};}
    const results=rules.map(rule=>checkDeliveryRule(rule,snap.files));
    const accountingComplete=snap.receipts.length>0&&snap.receipts.every(row=>['settled','released'].includes(row.state)&&row.charged_units!==null);
    const chargeUsd=accountingComplete?snap.receipts.reduce((sum,row)=>sum+row.charged_units,0)/1e9:null;
    const report={id:randomUUID(),threadId,runId:snap.run.id,runStatus:snap.run.status,model:snap.thread.model,releaseId:snap.thread.agent_release_id,
      checkedAt:new Date().toISOString(),rules,results,files:snap.files.map(({content,...file})=>file),accountingComplete,chargeUsd,
      checksPassed:results.every(row=>row.passed),passed:snap.run.status==='completed'&&accountingComplete&&results.every(row=>row.passed),
      scope:'saved-files-from-latest-run',inputHash:digest};
    db.prepare('INSERT INTO task_delivery_checks(id,user_id,thread_id,input_hash,report_json,last_used_at) VALUES(?,?,?,?,?,?)').run(report.id,user,threadId,digest,JSON.stringify(report),usedAt);
    db.prepare('DELETE FROM task_delivery_checks WHERE user_id=? AND thread_id=? AND id NOT IN (SELECT id FROM task_delivery_checks WHERE user_id=? AND thread_id=? ORDER BY last_used_at DESC,rowid DESC LIMIT 50)').run(user,threadId,user,threadId);
    return{...report,current:true};
  });
  const latest=db.transaction((user:string,threadId:string)=>{
    const snap=snapshot(user,threadId),row=db.prepare('SELECT report_json FROM task_delivery_checks WHERE user_id=? AND thread_id=? ORDER BY last_used_at DESC,rowid DESC LIMIT 1').get(user,threadId);
    const report=row?JSON.parse(row.report_json):null;
    return{files:snap.files.map(({content,...file})=>file),runStatus:snap.run?.status||null,report:report?{...report,current:report.inputHash===fingerprint(snap,report.rules)}:null};
  });
  return{list,save,remove,verify,latest};
}

export function registerTaskDeliveryRoutes(app:any,auth:any,service:ReturnType<typeof createTaskDeliveryChecks>){
  const route=(fn:(user:string,req:any)=>any)=>(req:any,res:any)=>{
    try{const user=req.user?.sub;if(!user)fail('AUTHENTICATION_REQUIRED',401);res.set('Cache-Control','private, no-store').json({success:true,data:fn(user,req)});}
    catch(error){res.status(error instanceof DeliveryError?error.status:500).json({success:false,error:error instanceof DeliveryError?error.code:'DELIVERY_CHECK_FAILED'});}
  };
  app.get('/api/delivery-checklists',auth,route(user=>service.list(user)));
  app.post('/api/delivery-checklists',auth,route((user,req)=>service.save(user,req.body)));
  app.delete('/api/delivery-checklists/:id',auth,route((user,req)=>{service.remove(user,req.params.id);return{deleted:true};}));
  app.get('/api/threads/:id/delivery-checks',auth,route((user,req)=>service.latest(user,req.params.id)));
  app.post('/api/threads/:id/delivery-checks',auth,route((user,req)=>service.verify(user,req.params.id,req.body)));
}
