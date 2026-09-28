'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './ConnectorSettings.module.css';

const providers = [
  ['anthropic','Anthropic / Claude','https://console.anthropic.com/settings/keys'],
  ['openai','OpenAI','https://platform.openai.com/api-keys'],
  ['openrouter','OpenRouter','https://openrouter.ai/keys'],
  ['gemini','Google Gemini','https://aistudio.google.com/app/apikey'],
  ['groq','Groq','https://console.groq.com/keys'],
  ['mistral','Mistral AI','https://console.mistral.ai/api-keys/'],
  ['together','Together AI','https://api.together.xyz/settings/api-keys'],
  ['perplexity','Perplexity','https://www.perplexity.ai/settings/api'],
  ['cohere','Cohere','https://dashboard.cohere.com/api-keys'],
  ['morph','Morph','https://morphllm.com'],
];
const checkable = new Set(['anthropic','openai','openrouter','gemini','groq','mistral','morph']);
type Row = { provider:string; key_preview:string; key_status:string };
type Editor = { id:string; name:string; mode:'save'|'delete' };
export function ProviderSettings({ zh, request, onBilling, onChange }: { zh:boolean; request:(path:string,options?:RequestInit)=>Promise<any>; onBilling:()=>void; onChange?:(provider:string,configured:boolean)=>void }) {
  const t=(cn:string,en:string)=>zh?cn:en, api=useRef(request);api.current=request;
  const alive=useRef(false),revision=useRef(0),pending=useRef(false),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null),input=useRef<HTMLInputElement>(null),cancel=useRef<HTMLButtonElement>(null);
  const [rows,setRows]=useState<Row[]>([]),[state,setState]=useState<'loading'|'ready'|'error'>('loading'),[busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState(''),[editor,setEditor]=useState<Editor|null>(null),[secret,setSecret]=useState(''),[visible,setVisible]=useState(false),[checks,setChecks]=useState<Record<string,string>>({});
  const load=async()=>{const version=++revision.current;setState('loading');try{const r=await api.current('/keys/vault',{signal:AbortSignal.timeout(15000)});if(!r?.success||!Array.isArray(r.data))throw Error('LIST_UNCONFIRMED');if(alive.current&&version===revision.current){setRows(r.data);setState('ready');setChecks({});}}catch{if(alive.current&&version===revision.current)setState('error')}};
  useEffect(()=>{alive.current=true;void load();return()=>{alive.current=false;revision.current++}},[]);
  useEffect(()=>{if(editor){dialog.current?.showModal();(editor.mode==='save'?input:cancel).current?.focus()}},[editor]);
  const close=()=>{if(pending.current)return;dialog.current?.close();setEditor(null);setSecret('');setVisible(false);setError('');opener.current?.focus()};
  const open=(entry:Editor,button:HTMLButtonElement)=>{if(state!=='ready'||pending.current)return;opener.current=button;setError('');setNotice('');setSecret('');setVisible(false);setEditor(entry)};
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(!editor||pending.current||state!=='ready'||(editor.mode==='save'&&(!secret.trim()||secret.trim().length>8192)))return;const target=editor;pending.current=true;setBusy(target.id);setError('');try{
    const r=await api.current('/keys/'+encodeURIComponent(target.id),{method:target.mode==='save'?'PATCH':'DELETE',signal:AbortSignal.timeout(15000),...(target.mode==='save'?{body:JSON.stringify({key:secret.trim()})}:{})});if(!r?.success)throw Error('MUTATION_UNCONFIRMED');if(!alive.current)return;
    setChecks(values=>{const next={...values};delete next[target.id];return next});
    setRows(values=>target.mode==='delete'?values.filter(row=>row.provider!==target.id):[...values.filter(row=>row.provider!==target.id),{provider:target.id,key_preview:'••••••••',key_status:'unverified'}]);
    onChange?.(target.id,target.mode==='save');
    setNotice(target.mode==='delete'?t('已删除此账号保存的凭据。','Saved credentials deleted from this account.'):t('API 密钥已保存。尚未检查凭据，也没有执行模型调用。','API key saved. Credentials have not been checked and no model call was made.'));pending.current=false;close();
  }catch{if(alive.current)setError(t('未能确认操作结果。输入已保留，请重试，或关闭后重新加载保存状态。','The result could not be confirmed. Your input is kept. Retry, or close and reload the saved status.'));}finally{if(alive.current){pending.current=false;setBusy('')}}};
  const check=async(id:string)=>{if(pending.current||state!=='ready')return;pending.current=true;setBusy(id);setNotice('');try{
    const r=await api.current('/keys/'+encodeURIComponent(id)+'/validate',{method:'POST',signal:AbortSignal.timeout(15000)});if(!alive.current)return;
    setChecks(values=>({...values,[id]:r?.valid===true&&r.verification_scope==='credential_metadata'?'accepted':r?.status==='rejected'?'rejected':'inconclusive'}));
  }catch{if(alive.current)setChecks(values=>({...values,[id]:'inconclusive'}))}finally{if(alive.current){pending.current=false;setBusy('')}}};
  const status=(id:string,saved:boolean)=>state!=='ready'?t('状态未确认','Status unconfirmed'):!saved?t('未保存个人密钥','No personal API key'):checks[id]==='accepted'?t('凭据检查通过 · 未验证模型调用','Credential check passed · model call unverified'):checks[id]==='rejected'?t('服务拒绝凭据 · 请更新密钥','Service rejected credentials · update key'):checks[id]==='inconclusive'?t('暂时无法验证 · 已保存的密钥保留','Check unavailable · saved key retained'):t('已保存 · 尚未检查','Saved · not checked');
  const legacyProviders=new Set([...providers.map(([id])=>id+'_account'),'cursor_account']);
  const legacy=rows.filter(row=>legacyProviders.has(row.provider));
  const docs=providers.find(row=>row[0]===editor?.id)?.[2];
  return <section className={styles.root} aria-label={t('模型服务与 API 密钥','Model services and API keys')}>
    <header className={styles.header}><div><span className={styles.eyebrow}>FORGE / MODEL SERVICES</span><h2>{t('模型服务与 API 密钥','Model services & API keys')}</h2></div><button type="button" onClick={onBilling}>{t('用量与套餐','Usage & plan')} ↗</button></header>
    <p className={styles.intro}>{t('日常任务使用 Forge 提供的模型与额度，无需填写第三方账号密码。个人 API 密钥供明确支持自带密钥的工具使用，由对应服务商计费。','Everyday tasks use Forge models and credit; no third-party account password is needed. Personal API keys serve tools that explicitly support your own key, with usage billed by that provider.')}</p>
    <p className={styles.feedback}>{t('ChatGPT、Claude 和 Cursor 的网页订阅不等于 API 额度。Forge 不支持通过保存这些服务的账号密码登录；旧版此类本机记录已清理。','ChatGPT, Claude and Cursor web subscriptions are separate from API credit. Forge does not support signing in by saving their account passwords. Old local records for these unsupported sign-ins have been removed.')}</p>
    <div className={styles.toolbar}><button type="button" disabled={!!busy||state==='loading'} onClick={()=>void load()}>{t('重新加载密钥','Reload keys')}</button><span className={styles.intro}>{t('检查仅验证服务的凭据或模型目录接口，不运行模型。','Checks use credential or model-list endpoints and do not run a model.')}</span></div>
    {state==='loading'&&<p role="status" className={styles.feedback}>{t('正在读取个人密钥…','Loading personal keys…')}</p>}
    {state==='error'&&<p role="alert" className={styles.error}>{t('无法确认个人密钥状态。请重新加载后再操作。','Personal key status is unavailable. Reload before making changes.')}</p>}
    {notice&&<p role="status" className={styles.feedback}>{notice}</p>}
    <div className={styles.list}>{providers.map(([id,name])=>{const saved=rows.some(row=>row.provider===id);return <article key={id} aria-label={name} className={styles.row}><span className={styles.monogram} aria-hidden="true">{name.slice(0,2).toUpperCase()}</span><div className={styles.identity}><h3>{name}</h3><span role={checks[id]?'status':undefined}>{status(id,saved)}</span></div><div className={styles.actions}>
      <button type="button" disabled={state!=='ready'||!!busy} onClick={e=>open({id,name,mode:'save'},e.currentTarget)}>{saved?t('更新密钥','Update key'):t('添加密钥','Add key')}</button>
      {saved&&checkable.has(id)&&<button type="button" disabled={state!=='ready'||!!busy} onClick={()=>void check(id)}>{busy===id?t('正在处理…','Working…'):t('检查凭据','Check credentials')}</button>}
      {saved&&!checkable.has(id)&&<span className={styles.intro}>{t('暂不支持在线检查','Online check unavailable')}</span>}
      {saved&&<button type="button" aria-label={t('删除 '+name+' 密钥','Delete '+name+' key')} disabled={state!=='ready'||!!busy} onClick={e=>open({id,name,mode:'delete'},e.currentTarget)}>{t('删除','Delete')}</button>}
    </div></article>})}</div>
    {!!legacy.length&&<div className={styles.feedback}><h3>{t('旧版账号密码记录','Legacy account-password records')}</h3><p>{t('这些记录不能用于登录。可以删除此前保存在 Forge 的记录。','These records cannot sign you in. You can delete records previously saved in Forge.')}</p>{legacy.map(row=><div key={row.provider} className={styles.row}><span>{row.provider}</span><button type="button" disabled={state!=='ready'||!!busy} onClick={e=>open({id:row.provider,name:row.provider,mode:'delete'},e.currentTarget)}>{t('删除旧记录','Delete legacy record')}</button></div>)}</div>}
    {editor&&<dialog ref={dialog} className={styles.dialog} aria-labelledby="provider-editor-title" aria-describedby="provider-editor-help" aria-busy={!!busy} onCancel={event=>{event.preventDefault();close()}}>
      <form onSubmit={submit}><div className={styles.dialogHeader}><span className={styles.eyebrow}>PERSONAL API KEY</span><button type="button" disabled={!!busy} aria-label={t('关闭密钥编辑','Close key editor')} onClick={close}>×</button></div><h2 id="provider-editor-title">{editor.mode==='save'?editor.name:t('删除 '+editor.name+'？','Delete '+editor.name+'?')}</h2>
      <p id="provider-editor-help">{editor.mode==='save'?t('只保存此服务提供的 API 密钥。不要填写登录密码。保存不会自动验证或运行模型。','Use only an API key issued by this provider. Do not enter a login password. Saving does not automatically verify credentials or run a model.'):t('删除后，使用此个人密钥的工具将需要重新配置。Forge 托管模型与额度不受影响。','Tools using this personal key will need to be configured again. Forge managed models and credit are unaffected.')}</p>
      {editor.mode==='save'&&<>{docs&&<a href={docs} target="_blank" rel="noopener noreferrer">{t('前往服务商获取 API 密钥 ↗','Get an API key from the provider ↗')}</a>}<label className={styles.label} htmlFor="provider-api-key">API key</label><div className={styles.secret}><input id="provider-api-key" ref={input} type={visible?'text':'password'} value={secret} onChange={e=>setSecret(e.target.value)} autoComplete="new-password" spellCheck={false} disabled={!!busy}/><button type="button" disabled={!!busy} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?t('隐藏','Hide'):t('显示','Show')}</button></div>{secret.trim().length>8192&&<p role="alert" className={styles.error}>{t('密钥超过 8,192 字符，没有截断或发送。','Key exceeds 8,192 characters. Nothing was truncated or sent.')}</p>}</>}
      {error&&<p role="alert" className={styles.error}>{error}</p>}<div className={styles.footer}><button ref={cancel} type="button" disabled={!!busy} onClick={close}>{t('取消','Cancel')}</button><button type="submit" className={styles.primary} disabled={!!busy||(editor.mode==='save'&&(!secret.trim()||secret.trim().length>8192))}>{busy?t('正在处理…','Working…'):editor.mode==='save'?t('保存密钥','Save key'):t('确认删除','Delete key')}</button></div></form>
    </dialog>}
  </section>;
}
