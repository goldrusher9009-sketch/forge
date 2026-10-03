import { clearAccountLocalCredentials, invalidateAccountLocalState } from './account-local-state';
import { clearAccountChatDrafts } from './chat-draft-store';
// One refresh and logout coordinator for the workspace, settings and login page.
let revision=0;
let refreshing:Promise<string|null>|null=null;
let signingOut:Promise<boolean>|null=null;
const readUser=()=>{try{return JSON.parse(localStorage.getItem('forge_user')||'null');}catch{return null;}};
export const sessionRevision=()=>revision;
export const advanceSession=()=>{revision++;refreshing=null;invalidateAccountLocalState();};
export function clearSession(){const previous=readUser();clearAccountLocalCredentials(previous?.id);const account=previous?.email;if(account)void clearAccountChatDrafts(account).catch(()=>{});advanceSession();for(const key of ['forge_user','forge_token','forge_access_token'])localStorage.removeItem(key);}
export function assertAccountToken(token?:string|null){
  if(!token)return;
  try{const user=readUser(),claims=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(user?.id&&claims.sub===user.id)return;}catch{}
  throw new Error('ACCOUNT_SESSION_CHANGED');
}
export async function refreshAccountToken(apiBase:string):Promise<string|null>{
  if(refreshing)return refreshing;
  const generation=revision,account=readUser();
  if(!account?.id)return null;
  const operation=(async()=>{
    try{
      const response=await fetch(`${apiBase}/auth/refresh`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});
      if(!response.ok)return null;
      const body=await response.json(),token=body.data?.accessToken;
      if(typeof token!=='string'||body.data?.userId!==account.id)return null;
      // Return late tokens to the logout coordinator for revocation, never to storage.
      if(generation===revision&&readUser()?.id===account.id){
        localStorage.setItem('forge_user',JSON.stringify({...readUser(),token}));
        localStorage.setItem('forge_token',token);localStorage.setItem('forge_access_token',token);
        window.dispatchEvent(new CustomEvent('forge:token-refreshed',{detail:{token,userId:account.id}}));
      }
      return token;
    }catch{return null;}
  })();
  refreshing=operation;
  void operation.finally(()=>{if(refreshing===operation)refreshing=null;});
  return operation;
}
export async function waitForSignOut(){await signingOut;}
export function endAccountSession(apiBase:string):Promise<boolean>{
  const user=readUser(),pending=refreshing;
  let token=user?.token||localStorage.getItem('forge_token')||localStorage.getItem('forge_access_token')||'';
  clearSession();
  if(!token)return signingOut||Promise.resolve(true);
  signingOut=(async()=>{
    try{
      token=(await pending)||token;
      const signal=AbortSignal.timeout(8000);
      const send=(path:string)=>fetch(`${apiBase}${path}`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:'{}',signal});
      let response=await send('/auth/logout');
      if(response.status===401){
        const refreshed=await send('/auth/refresh');
        if(refreshed.status===401)return true;
        if(!refreshed.ok)return false;
        const body=await refreshed.json();
        if(!user?.id||body.data?.userId!==user.id||!body.data?.accessToken)return false;
        token=body.data.accessToken;response=await send('/auth/logout');
      }
      return response.ok;
    }catch{return false;}
  })();
  return signingOut;
}

/** Invalidate late work and clear the previous account's view in other tabs.
 * Never clear storage here: it may already contain a newly signed-in account. */
export function observeAccountSession(onChanged:()=>void){
  const account=readUser();
  const changed=(event:StorageEvent)=>{
    if(event.storageArea!==localStorage||(event.key!==null&&event.key!=='forge_user'))return;
    if(readUser()?.id===account?.id)return;
    advanceSession();
    if(account?.email)void clearAccountChatDrafts(account.email).catch(()=>{});
    onChanged();
  };
  window.addEventListener('storage',changed);
  return()=>window.removeEventListener('storage',changed);
}
