'use client';
import { useRef, useState } from 'react';
export type PublishedAgentRef = {agentId:string;releaseId:string};
export type PublishedAgentSummary = PublishedAgentRef & {name:string;version:number;model:string};
export function PublishedAgentPicker({api,onUse,active,zh,disabled}:{api:(path:string)=>Promise<any>;onUse:(value:PublishedAgentRef)=>Promise<void>;active?:PublishedAgentSummary|null;zh:boolean;disabled:boolean}) {
  const [open,setOpen]=useState(false),[rows,setRows]=useState<PublishedAgentSummary[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const button=useRef<HTMLButtonElement>(null);
  const [placement,setPlacement]=useState({above:false,left:0,height:400});
  const t=(en:string,cn:string)=>zh?cn:en;
  const load=async()=>{const rect=button.current?.getBoundingClientRect();if(rect){const above=rect.top>innerHeight/2;setPlacement({above,left:Math.min(0,innerWidth-16-rect.left-Math.min(360,innerWidth*.8)),height:Math.max(80,Math.min(400,above?rect.top-26:innerHeight-rect.bottom-26))});}setOpen(true);setBusy(true);setError('');try{const r=await api('/published-agents');setRows(r.data||[]);}catch{setError(t('Could not load your published agents. Try again.','暂时无法读取已发布的 Agent，请重试。'));}finally{setBusy(false);}};
  const use=async(row:PublishedAgentSummary)=>{setBusy(true);setError('');try{await onUse(row);setOpen(false);}catch{setError(t('This version cannot start. Its sources may have changed or been removed. Review it in Agent studio.','此版本暂时无法启动，资料可能已变化或删除，请在 Agent 工作台检查。'));}finally{setBusy(false);}};
  return <div style={{position:'relative',flexShrink:0}} data-testid="published-agent-picker">
    <button ref={button} disabled={disabled||busy} onClick={()=>open?setOpen(false):void load()} style={{padding:'7px 12px',border:'1px solid var(--fg-border2)',borderRadius:8,background:'var(--fg-bg4)',color:'var(--fg-text)',cursor:'pointer',maxWidth:'min(280px,75vw)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{active?`${active.name} · v${active.version}`:t('Use published Agent','使用已发布 Agent')}</button>
    {open&&<div role="dialog" aria-label={t('Published agents','已发布的 Agent')} style={{position:'absolute',...(placement.above?{bottom:'calc(100% + 10px)'}:{top:'calc(100% + 10px)'}),left:placement.left,zIndex:60,width:'min(360px,80vw)',boxSizing:'border-box',maxHeight:placement.height,overflowY:'auto',padding:18,border:'1px solid var(--fg-border)',borderRadius:14,background:'var(--fg-bg)',boxShadow:'0 12px 40px #0003'}}>
      <strong>{t('Start with a version you published.','从已发布的版本开始。')}</strong>
      <p style={{fontSize:12,lineHeight:1.6,color:'var(--fg-text2)'}}>{t('Opens a new conversation with fixed instructions, model and reference files. Later draft edits do not replace this version. Currently free models use no Forge credit; paid models charge by usage.','新建对话并固定说明、模型和参考资料。后续草稿修改不会覆盖此版本。当前免费模型不扣 Forge 额度；付费模型按用量扣减。')}</p>
      {error&&<p role="alert" style={{color:'var(--fg-orange2)',fontSize:12}}>{error}</p>}
      {busy&&<p>{t('Working…','处理中…')}</p>}
      {!busy&&!rows.length&&!error&&<p style={{fontSize:12}}>{t('Publish an Agent in your personal workspace first.','请先在个人工作区发布一个 Agent。')}</p>}
      {rows.map(row=><button key={row.releaseId} disabled={busy} onClick={()=>void use(row)} style={{display:'block',width:'100%',textAlign:'left',padding:12,marginTop:8,border:'1px solid var(--fg-border)',borderRadius:9,background:'var(--fg-bg4)',color:'var(--fg-text)',cursor:'pointer'}}><strong>{row.name} · v{row.version}</strong><span style={{display:'block',fontSize:11,marginTop:4,color:'var(--fg-text2)'}}>{row.model}</span></button>)}
      <button onClick={()=>setOpen(false)} style={{marginTop:12,background:'none',border:0,color:'var(--fg-text2)',cursor:'pointer'}}>{t('Close','关闭')}</button>
    </div>}
  </div>;
}
