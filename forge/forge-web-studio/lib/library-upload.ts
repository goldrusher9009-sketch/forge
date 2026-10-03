type Api = (path:string,options?:RequestInit)=>Promise<any>;
export type UploadBody={filename:string;content:string;mime_type:string;folder_id?:string|null;thread_id?:string|null};
export type UploadIntent={body:UploadBody;requestId:string;storageKey:string};
const pending=new Map<string,string>();
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const clear=(intent:UploadIntent)=>{if(pending.get(intent.storageKey)===intent.requestId)pending.delete(intent.storageKey);try{if(sessionStorage.getItem(intent.storageKey)===intent.requestId)sessionStorage.removeItem(intent.storageKey);}catch{}};

/** Only unresolved request IDs and hashes survive navigation. File contents and
 * names remain in memory; reselecting the same file can recover a lost response. */
export async function prepareLibraryUpload(body:UploadBody,accountKey:string):Promise<UploadIntent>{
 const storageKey='forge:pending-upload:v1:'+await digest(JSON.stringify([accountKey,body.filename,body.mime_type,body.folder_id||null,body.thread_id||null,body.content]));
 let requestId=pending.get(storageKey);try{requestId=requestId||sessionStorage.getItem(storageKey)||undefined;}catch{}
 if(!requestId||!/^[a-zA-Z0-9_-]{16,128}$/.test(requestId))requestId=crypto.randomUUID();
 pending.set(storageKey,requestId);try{sessionStorage.setItem(storageKey,requestId);}catch{}
 return{body,requestId,storageKey};
}
export async function sendLibraryUpload(api:Api,intent:UploadIntent,acknowledge:()=>boolean=()=>true){
 try{
  const result=await api('/userfiles',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':intent.requestId},body:JSON.stringify(intent.body)});
  if(result?.success===false)throw new Error(result.error||'LIBRARY_UPLOAD_FAILED');
  if(!result?.data?.id)throw new Error('LIBRARY_UPLOAD_UNCONFIRMED');
  if(acknowledge())clear(intent);return result;
 }catch(error:any){if(['LIBRARY_UPLOAD_REMOVED','LIBRARY_UPLOAD_KEY_CONFLICT'].includes(error?.message))clear(intent);throw error;}
}
