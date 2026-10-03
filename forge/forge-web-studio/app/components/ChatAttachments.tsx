'use client';
import {attachmentError,chatDocumentDisplay,chatImageDisplay,type ComposerFile} from '../../lib/chat-composer';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import styles from './ChatAttachments.module.css';

export function ChatAttachments({files,remove,zh}:{files:ComposerFile[];remove:(id:string)=>void;zh:boolean}) {
 if(!files.length)return null;
 return <section className={styles.root} aria-label={zh?'任务附件':'Task attachments'}>
  <div className={styles.heading}><span>{zh?'任务附件':'Task attachments'} <b>{files.length}</b></span><span>{zh?'发送失败会保留':'Kept if sending fails'}</span></div>
  <ul className={styles.list}>{files.map(file=><li key={file.id} className={styles.file} data-status={file.status}>
   <div className={styles.icon}>{file.image?<img src={file.image.preview} alt=""/>:<span aria-hidden="true">{file.name.toLowerCase().endsWith('.pdf')?'PDF':'TXT'}</span>}</div>
   <div className={styles.description}><strong title={file.name}>{file.name}</strong><span aria-live="polite">{file.status==='reading'?(zh?'正在读取，扫描件将识别文字…':'Reading; scans may need text recognition…'):file.status==='error'?attachmentError(file.error||'',zh):file.image?(zh?'图片 · 将随消息发送':'Image · included with your message'):file.notice==='PDF_OCR'?(zh?`${(file.content?.length||0).toLocaleString()} 字符 · 扫描识别完成`:`${(file.content?.length||0).toLocaleString()} characters · OCR complete`):(zh?`${(file.content?.length||0).toLocaleString()} 字符 · 已读取全文`:`${(file.content?.length||0).toLocaleString()} characters · full text ready`)}</span>{file.notice==='PDF_OCR'&&<small>{zh?'含文字识别结果，可能有错漏。金额、日期和姓名请核对原件；图片与版式未发送。':'Includes OCR, which may contain errors or omissions. Verify amounts, dates and names against the original; images and layout are not sent.'}</small>}{file.notice==='PDF_TEXT_ONLY'&&<small>{zh?'仅读取 PDF 文字层，不含图片或扫描文字。':'PDF text layer only; images and scanned text are not included.'}</small>}</div>
   <button type="button" onClick={()=>remove(file.id)} aria-label={(zh?'移除附件：':'Remove attachment: ')+file.name}>×</button>
  </li>)}</ul>
 </section>;
}

type LoadImage=(hash:string,signal:AbortSignal)=>Promise<any>;
function SentImage({file,zh,loadImage}:{file:{filename:string;sha256:string};zh:boolean;loadImage?:LoadImage}) {
 const [open,setOpen]=useState(false),[attempt,setAttempt]=useState(0),[url,setUrl]=useState(''),[error,setError]=useState(''),[dimensions,setDimensions]=useState(''),[zoom,setZoom]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),loader=useRef(loadImage);loader.current=loadImage;
 useEffect(()=>{
  if(!open)return;
  const node=dialog.current!;node.showModal();
  return()=>node.close();
 },[open]);
 useEffect(()=>{
  if(!open||!loader.current)return;
  let live=true,objectUrl='';const controller=new AbortController();setUrl('');setError('');setDimensions('');setZoom(false);
  void loader.current(file.sha256,controller.signal).then(response=>{
   if(!live)return;const data=response?.data;
   if(response.success===false)throw Error(response.error);
   if(!data||data.sha256!==file.sha256||typeof data.data!=='string'||data.data.length>3*1024*1024||!['image/png','image/jpeg','image/webp','image/gif'].includes(data.mediaType))throw Error('CHAT_IMAGE_READ_FAILED');
   const bytes=Uint8Array.from(atob(data.data),c=>c.charCodeAt(0));objectUrl=URL.createObjectURL(new Blob([bytes],{type:data.mediaType}));setUrl(objectUrl);
  }).catch(e=>{if(live)setError(e?.message==='CHAT_IMAGE_ORIGINAL_UNAVAILABLE'?'missing':'failed');});
  return()=>{live=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[open,attempt,file.sha256]);
 const close=()=>{if(dialog.current?.open)dialog.current.close();trigger.current?.focus();setOpen(false);};
 return <><button type="button" className={styles.imageCard} ref={trigger} onClick={()=>setOpen(true)} disabled={!loadImage} aria-label={(zh?'查看图片：':'View image: ')+file.filename}>
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m4 18 5-5 4 3 4-6 4 6"/></svg>
  <span><strong>{file.filename}</strong><small>{zh?'图片 · 点击查看原图':'Image · view original'}</small></span><span aria-hidden="true">↗</span>
 </button>{open&&<dialog ref={dialog} className={styles.imageDialog} aria-label={(zh?'图片预览：':'Image preview: ')+file.filename} onCancel={event=>{event.preventDefault();close();}} onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget){const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();}}}>
  <header><div><strong>{file.filename}</strong><small>{dimensions|| (zh?'原始附件':'Original attachment')}</small></div><button type="button" onClick={close} autoFocus aria-label={zh?'关闭图片预览':'Close image preview'}>×</button></header>
  <div className={styles.imageViewport} data-zoom={zoom}>
   {error?<div className={styles.imageState} role="alert"><strong>{error==='missing'?(zh?'原图暂不可用':'Original image unavailable'):(zh?'图片加载失败':'Could not load image')}</strong><p>{error==='missing'?(zh?'这份历史记录未保留原图。文件名和对话仍然保留。':'This older conversation has no retained original. Its filename and conversation remain available.'):(zh?'请检查连接后重试。':'Check your connection and try again.')}</p>{error!=='missing'&&<button type="button" onClick={()=>setAttempt(n=>n+1)}>{zh?'重新加载':'Try again'}</button>}</div>:url?<img src={url} alt={file.filename} onLoad={event=>setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}`)} onError={()=>setError('failed')}/>:<div className={styles.imageState} role="status">{zh?'正在加载原图…':'Loading original…'}</div>}
  </div>
  <footer><span>{zh?'Esc 关闭':'Esc to close'}</span>{url&&!error&&<div><button type="button" onClick={()=>setZoom(v=>!v)} aria-pressed={zoom}>{zoom?(zh?'适应窗口':'Fit to window'):(zh?'实际尺寸':'Actual size')}</button><a href={url} download={file.filename.split(/[/\\]/).pop()||'image'}>{zh?'下载原图':'Download original'}</a></div>}</footer>
 </dialog>}</>;
}

export function ChatSourceMessage({content,renderText,zh,loadImage}:{content:string;renderText:(text:string)=>ReactNode;zh:boolean;loadImage?:LoadImage}) {
 const value=chatDocumentDisplay(content),visuals=chatImageDisplay(value.text);
 return <>{renderText(visuals.text)}{visuals.images.length>0&&<div className={styles.sent} aria-label={zh?'已发送的图片':'Sent images'}>{visuals.images.map((file,index)=><SentImage key={file.sha256+':'+index} file={file} zh={zh} loadImage={loadImage}/>)}</div>}{value.documents.length>0&&<div className={styles.sent}>{value.documents.map((file,index)=><details key={index}><summary><span>{file.filename}</span><small>{file.text.length.toLocaleString()} {zh?'字符':'characters'}</small></summary>{file.notice==='PDF_OCR'&&<p>{zh?'包含扫描识别文字，请核对原件中的重要信息。':'Contains OCR text. Verify important details against the original.'}</p>}<pre>{file.text}</pre></details>)}</div>}</>;
}
