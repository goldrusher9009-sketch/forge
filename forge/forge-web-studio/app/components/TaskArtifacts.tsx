'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './TaskArtifacts.module.css';
import { previewDocument } from '../../lib/html-preview';

type Artifact = { id:string; thread_id:string; title:string; language:string; content:string; filename:string; sizeBytes:number; version:number };
type Props = { threadId:string; accountId:string; locale:string; refreshKey:string; request:(path:string)=>Promise<any> };
const previewable = (item:Artifact) => ['html','svg'].includes(item.language);
const sizeLabel = (item:Artifact) => {const bytes=item.sizeBytes??new TextEncoder().encode(item.content).length;return bytes<1024?`${bytes} B`:`${(bytes/1024).toFixed(1)} KB`;};

/** Always load from the authenticated task. Tool text is never an artifact. */
export function TaskArtifacts({threadId,accountId,locale,refreshKey,request}:Props) {
  const zh=locale.startsWith('zh'), t=(en:string,cn:string)=>zh?cn:en;
  const [items,setItems]=useState<Artifact[]>([]),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
  const [selected,setSelected]=useState<Artifact|null>(null),[source,setSource]=useState(false),[expanded,setExpanded]=useState(false);
  const requestRef=useRef(request);requestRef.current=request;
  const dialog=useRef<HTMLDialogElement>(null),previousScope=useRef('');
  useEffect(()=>{
    const scope=accountId+':'+threadId;
    if(previousScope.current!==scope){setItems([]);setSelected(null);setExpanded(false);previousScope.current=scope;}
    let current=true;setFailed(false);
    requestRef.current('/artifacts?thread_id='+encodeURIComponent(threadId)).then(response=>{
      if(!current)return;
      if(response?.success===false)throw new Error('ARTIFACT_LOAD_FAILED');
      const rows=Array.isArray(response?.data)?response.data:Array.isArray(response)?response:null;
      if(!rows)throw new Error('ARTIFACT_LOAD_FAILED');
      setItems(rows.filter((row:Artifact)=>row.thread_id===threadId));
      setSelected(previous=>previous?rows.find((row:Artifact)=>row.id===previous.id)||null:null);
    }).catch(()=>{if(current)setFailed(true);});
    return()=>{current=false;};
  },[accountId,threadId,refreshKey,retry]);
  useEffect(()=>{
    if(selected&&!dialog.current?.open)dialog.current?.showModal();
    if(!selected&&dialog.current?.open)dialog.current?.close();
  },[selected]);
  const download=(item:Artifact)=>{
    const url=URL.createObjectURL(new Blob([item.content],{type:'application/octet-stream'}));
    const link=document.createElement('a');link.href=url;link.download=item.filename||'forge-artifact.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  if(!items.length&&!failed)return null;
  return <section className={styles.shelf} aria-label={t('Task deliverables','任务产物')} data-testid="task-artifacts">
    <div className={styles.heading}><div><span className={styles.eyebrow}>FORGE / OUTPUT</span><h3>{t('Ready to take with you.','把成果，带到下一步。')}</h3></div><span className={styles.count}>{String(items.length).padStart(2,'0')}</span></div>
    <p className={styles.caption}>{t('Saved to this task. Preview or download the original file.','已保存到当前任务，可预览或下载原始文件。')}</p>
    {failed&&<div className={styles.error} role="status">{t('Could not refresh the saved files.','未能刷新已保存的文件。')} <button type="button" onClick={()=>setRetry(n=>n+1)}>{t('Try again','重试')}</button></div>}
    <div className={styles.list}>{(expanded?items:items.slice(0,3)).map(item=><article className={styles.card} key={item.id}>
      <span className={styles.format} aria-hidden="true">{item.language==='svg'?'SVG':item.language==='html'?'HTML':(item.filename?.split('.').pop()||'TXT').toUpperCase().slice(0,5)}</span>
      <div className={styles.details}><button type="button" className={styles.title} onClick={()=>{setSource(!previewable(item));setSelected(item);}}>{item.title}</button><span className={styles.meta}>{item.filename} <span>·</span> {sizeLabel(item)} <span>·</span> v{item.version}</span></div>
      <button type="button" className={styles.download} onClick={()=>download(item)} aria-label={t('Download ','下载 ')+item.title}><span aria-hidden="true">↓</span><span>{t('Download','下载')}</span></button>
    </article>)}</div>
    {items.length>3&&<button type="button" className={styles.more} onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded}>{expanded?t('Show less','收起'):t(`Show all ${items.length} files`,`查看全部 ${items.length} 个文件`)}</button>}
    <dialog ref={dialog} className={styles.dialog} onCancel={()=>setSelected(null)} onClose={()=>setSelected(null)} aria-label={selected?t('Preview: ','预览：')+selected.title:t('File preview','文件预览')}>
      {selected&&<><header className={styles.toolbar}><div><span className={styles.eyebrow}>{selected.language||'TEXT'} / v{selected.version}</span><h3>{selected.title}</h3></div><button type="button" className={styles.close} onClick={()=>setSelected(null)} aria-label={t('Close preview','关闭预览')}>×</button></header>
      <div className={styles.previewActions}><div role="group" aria-label={t('View mode','查看方式')}>
        {previewable(selected)&&<button type="button" aria-pressed={!source} onClick={()=>setSource(false)}>{t('Preview','预览')}</button>}
        <button type="button" aria-pressed={source} onClick={()=>setSource(true)}>{t('Source','原文')}</button></div><button type="button" onClick={()=>download(selected)}>{t('Download original','下载原文件')} ↓</button></div>
      {!source&&previewable(selected)?<iframe className={styles.frame} title={t('File preview','文件预览')} sandbox="" referrerPolicy="no-referrer" srcDoc={previewDocument(selected)}/>:<pre className={styles.source}>{selected.content}</pre>}
      <footer className={styles.footer}>{t('Preview shows saved content. Scripts and external resources stay off; download to use the full file.','预览展示已保存内容，不运行脚本或加载外部资源；下载后可使用完整文件。')}</footer></>}
    </dialog>
  </section>;
}
