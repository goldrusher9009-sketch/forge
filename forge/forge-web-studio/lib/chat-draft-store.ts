type RecordValue={scope:string;version:number;value:any;updatedAt:number};
let opening:Promise<IDBDatabase>|undefined;
const epochs=new Map<string,number>();
export const chatDraftEpoch=(account:string)=>epochs.get(account)||0;
function database():Promise<IDBDatabase>{
 if(!opening)opening=new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open('forge-chat-drafts',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'scope'});
  request.onerror=()=>reject(Error('CHAT_DRAFT_STORAGE_UNAVAILABLE'));
  request.onblocked=()=>reject(Error('CHAT_DRAFT_STORAGE_UNAVAILABLE'));
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opening=undefined;};resolve(db);};
 }).catch(error=>{opening=undefined;throw error;});
 return opening!;
}
export async function readChatDraft(scope:string):Promise<RecordValue|undefined>{
 const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readonly'),request=tx.objectStore('drafts').get(scope);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('CHAT_DRAFT_STORAGE_UNAVAILABLE'));});
}
/** Optimistic revision prevents another tab from silently replacing this draft. */
export async function writeChatDraft(scope:string,value:any,expectedVersion:number,expectedEpoch=chatDraftEpoch(scope.split('\n')[0])):Promise<number>{
 const db=await database();return new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts');let error='CHAT_DRAFT_STORAGE_UNAVAILABLE',version=expectedVersion+1;
  const request=store.get(scope);request.onsuccess=()=>{
   if(chatDraftEpoch(scope.split('\n')[0])!==expectedEpoch){error='ACCOUNT_SESSION_CHANGED';tx.abort();return;}
   if((request.result?.version||0)!==expectedVersion){error='CHAT_DRAFT_CONFLICT';tx.abort();return;}
   store.put({scope,version,value,updatedAt:Date.now()});
  };
  tx.oncomplete=()=>resolve(version);tx.onerror=()=>reject(Error(error));tx.onabort=()=>reject(Error(error));
 });
}
/** Move a new-task draft and clear its old scope in one IndexedDB transaction. */
export async function moveChatDraft(previous:string,next:string,value:any,previousVersion:number,nextVersion:number,expectedEpoch:number):Promise<number>{
 const db=await database();return new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts');let error='CHAT_DRAFT_STORAGE_UNAVAILABLE';
  const source=store.get(previous),destination=store.get(next);let remaining=2,sourceVersion=0,destinationVersion=0;
  const check=()=>{if(--remaining)return;
   if(chatDraftEpoch(previous.split('\n')[0])!==expectedEpoch){error='ACCOUNT_SESSION_CHANGED';tx.abort();return;}
   if(sourceVersion!==previousVersion||destinationVersion!==nextVersion){error='CHAT_DRAFT_CONFLICT';tx.abort();return;}
   store.put({scope:next,version:nextVersion+1,value,updatedAt:Date.now()});store.delete(previous);
  };
  source.onsuccess=()=>{sourceVersion=source.result?.version||0;check();};
  destination.onsuccess=()=>{destinationVersion=destination.result?.version||0;check();};
  tx.oncomplete=()=>resolve(nextVersion+1);tx.onerror=()=>reject(Error(error));tx.onabort=()=>reject(Error(error));
 });
}
export async function clearAccountChatDrafts(account:string):Promise<void>{
 if(!account||typeof indexedDB==='undefined')return;
 epochs.set(account,chatDraftEpoch(account)+1);
 const db=await database();return new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts','readwrite'),cursor=tx.objectStore('drafts').openCursor();
  cursor.onsuccess=()=>{const row=cursor.result;if(!row)return;if(String(row.key).startsWith(account+'\n'))row.delete();row.continue();};
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(Error('CHAT_DRAFT_STORAGE_UNAVAILABLE'));tx.onabort=()=>reject(Error('CHAT_DRAFT_STORAGE_UNAVAILABLE'));
 });
}
