type Result = {success?:boolean;data?:any;error?:string;[key:string]:any};
type Submission = {id:string;wireHash:string};
const prefix='forge:pending-chat:v1:';
const stable=(value:any):string=>Array.isArray(value)?'['+value.map(stable).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stable(value[key])).join(',')+'}':JSON.stringify(value);
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
const fail=(code:string):never=>{throw Object.assign(new Error(code),{code});};

/** Keep only random IDs and hashes in browser storage. Never persist prompts,
 * attachment bytes, credentials or provider keys in this recovery index.
 * The unchanged draft retains its ID across a lost response and page reload. */
export async function sendChatSubmission(options:{account:string;thread:string;body:any;send:(body:any)=>Promise<Result>;lookup:(id:string)=>Promise<Result>;storage?:Storage;isCurrent?:()=>boolean}):Promise<Result> {
 const body=JSON.parse(JSON.stringify(options.body)),wireHash=await digest(stable(body));
 const key=prefix+await digest(stable([options.account,options.thread,body.content,body.attachments||[]]));
 const storage=options.storage||localStorage;
 const current=()=>{if(options.isCurrent&&!options.isCurrent())fail('ACCOUNT_SESSION_CHANGED');};
 current();
 const load=()=>{
  current();let existing=false,intent:Submission;
  try{
   const raw=storage.getItem(key);
   if(raw){intent=JSON.parse(raw);if(typeof intent.id!=='string'||!/^[a-f0-9-]{36}$/.test(intent.id)||!/^[a-f0-9]{64}$/.test(intent.wireHash))fail('CHAT_RECOVERY_STORAGE_INVALID');existing=true;}
   else{intent={id:crypto.randomUUID(),wireHash};storage.setItem(key,JSON.stringify(intent));if(storage.getItem(key)!==JSON.stringify(intent))fail('CHAT_RECOVERY_STORAGE_UNAVAILABLE');}
   return {intent,existing};
  }catch{return fail('CHAT_RECOVERY_STORAGE_UNAVAILABLE');}
 };
 const {intent,existing}=typeof navigator!=='undefined'&&navigator.locks?await navigator.locks.request(key,load):load();
 const receipt={key,id:intent.id};
 const finish=(result:Result)=>{if(result.success===false)confirmChatSubmission(receipt,storage);return {...result,localReceipt:receipt};};
 const recover=async():Promise<Result|null>=>{
  let response:Result;
  try{response=await options.lookup(intent!.id);}catch(error:any){if(error?.message==='THREAD_REQUEST_NOT_FOUND'||error?.code==='THREAD_REQUEST_NOT_FOUND')return null;throw error;}
  current();const record=response?.data;
  if(response?.success===false&&response.error==='THREAD_REQUEST_NOT_FOUND')return null;
  if(!record||!['running','completed','failed','cancelled','interrupted'].includes(record.status))fail('CHAT_REQUEST_UNCONFIRMED');
  if(record.status==='running')fail('THREAD_REQUEST_IN_PROGRESS');
  const result=record.result||{success:false,error:record.error||'THREAD_REQUEST_INTERRUPTED'};
  return finish({...result,recovered:true});
 };
 current();
 if(existing){const recovered=await recover();if(recovered)return recovered;if(intent.wireHash!==wireHash)fail('CHAT_RETRY_CONFIGURATION_CHANGED');}
 current();
 let result:Result;
 try{result=await options.send({...body,client_message_id:intent.id});}
 catch(error:any){
  if(error?.code==='ACCOUNT_SESSION_CHANGED'||error?.message==='ACCOUNT_SESSION_CHANGED')throw error;
  // A transport failure is not proof that the task failed. Read its durable
  // receipt before permitting another invocation with the same request ID.
  try{
   const recovered=await recover();if(recovered)return recovered;
   // A retry can be throttled even when its earlier request completed. Only
   // clear the intent after the authoritative lookup confirms no saved run.
   if(error?.status===429&&error?.code==='RATE_LIMIT_EXCEEDED'&&error?.requestAccepted===false){
    return finish({success:false,error:'RATE_LIMIT_EXCEEDED',retryAfter:error.retryAfter,requestAccepted:false});
   }
  }catch(recoveryError:any){if(['THREAD_REQUEST_IN_PROGRESS','ACCOUNT_SESSION_CHANGED'].includes(recoveryError?.code||recoveryError?.message))throw recoveryError;}
  if(['THREAD_NOT_FOUND','CLIENT_MESSAGE_ID_INVALID'].includes(error?.code||error?.message))throw error;
  return fail('CHAT_REQUEST_UNCONFIRMED');
 }
 current();
 if(result?.success===false||result?.success===true&&result.data?.id){return finish(result);}
 return fail('CHAT_REQUEST_UNCONFIRMED');
}

/** Call only after the acknowledged draft has been durably cleared. */
export function confirmChatSubmission(receipt:{key:string;id:string}|undefined,storage?:Storage){
 if(!receipt)return;
 try{const target=storage||localStorage;if(JSON.parse(target.getItem(receipt.key)||'null')?.id===receipt.id)target.removeItem(receipt.key);}catch{/* Preserve the recoverable receipt when storage is unavailable. */}
}
