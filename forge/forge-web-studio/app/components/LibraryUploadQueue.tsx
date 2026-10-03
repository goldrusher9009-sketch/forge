'use client';
import React from 'react';
import {prepareLibraryUpload,sendLibraryUpload,type UploadIntent} from '../../lib/library-upload';
import styles from './LibraryUploadQueue.module.css';
type Item={id:string;file:File;folderId:string|null;destination:string;state:'queued'|'uploading'|'saved'|'failed';error?:string;intent?:UploadIntent};
type Props={api:(path:string,options?:RequestInit)=>Promise<any>;accountKey:string;folderId:string|null;destination:string;zh:boolean;disabled:boolean;maxFileBytes:number;onSaved:()=>Promise<void>;onBusy:(busy:boolean)=>void};
const textFile=(name:string,mime:string)=>/^text\//.test(mime)||/\.(txt|md|csv|json|js|ts|tsx|jsx|html|css|py|yml|yaml|xml|sql|sh|log)$/i.test(name);
export function LibraryUploadQueue({api,accountKey,folderId,destination,zh,disabled,maxFileBytes,onSaved,onBusy}:Props){
 const t=(en:string,cn:string)=>zh?cn:en,input=React.useRef<HTMLInputElement>(null),locked=React.useRef(false),active=React.useRef(true);
 const [items,setItems]=React.useState<Item[]>([]),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
 React.useEffect(()=>{active.current=true;return()=>{active.current=false;onBusy(false);};},[]);
 const update=(item:Item,patch:Partial<Item>)=>{Object.assign(item,patch);if(active.current)setItems(rows=>rows.map(row=>row.id===item.id?{...item}:row));};
 const run=async(batch:Item[])=>{
  if(locked.current||disabled)return;locked.current=true;setBusy(true);onBusy(true);setError('');
  try{for(const item of batch){
   if(!active.current)break;update(item,{state:'uploading',error:undefined});
   try{
    if(item.file.size>maxFileBytes)throw new Error('LIBRARY_FILE_TOO_LARGE');
    if(!item.intent){const content=textFile(item.file.name,item.file.type)?await item.file.text():await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('LIBRARY_READ_FAILED'));reader.readAsDataURL(item.file);});
     item.intent=await prepareLibraryUpload({filename:item.file.name,content,mime_type:item.file.type||'application/octet-stream',folder_id:item.folderId},accountKey);
    }
    // Do not begin another upload after leaving this workspace. An in-flight
    // response may still arrive; its persisted request ID remains recoverable.
    if(!active.current)break;
    await sendLibraryUpload(api,item.intent,()=>active.current);update(item,{state:'saved',intent:undefined});
   }catch(e:any){update(item,{state:'failed',error:e?.message||'LIBRARY_UPLOAD_UNCONFIRMED'});}
  }
  }finally{locked.current=false;if(active.current){setBusy(false);onBusy(false);await onSaved();}}
 };
 const choose=(files:FileList|File[])=>{
  if(locked.current||disabled)return;
  const selected=Array.from(files);if(!selected.length)return;
  if(selected.length>50||selected.reduce((sum,file)=>sum+file.size,0)>50*1024*1024){setError(t('Choose up to 50 files and 50 MB per batch.','每批最多选择 50 个文件，总大小不超过 50 MB。'));return;}
  const batch:Item[]=selected.map(file=>({id:crypto.randomUUID(),file,folderId,destination,state:'queued'}));setItems(batch);void run(batch);
 };
 const messages:Record<string,string>={
  CHAT_ATTACHMENT_BUSY:t('Document processing is busy. Retry this upload shortly.','文档解析繁忙，请稍后重试这次上传。'),
  CHAT_ATTACHMENT_TIMEOUT:t('Document recognition timed out. Split the PDF and upload again.','文档识别超时，请拆分 PDF 后重新上传。'),
  CHAT_ATTACHMENT_OCR_UNAVAILABLE:t('Scan recognition is temporarily unavailable. Retry this upload later.','扫描文字识别暂不可用，请稍后重试这次上传。'),
  LIBRARY_FILE_TOO_LARGE:t('Over the 5 MB file limit.','超过单文件 5 MB 上限。'),
  LIBRARY_STORAGE_LIMIT:t('Your library is full. Free some space, then retry.','资料库容量已满，请腾出空间后重试。'),
  LIBRARY_FOLDER_NOT_FOUND:t('The destination folder was removed. Select the file again in another folder.','目标文件夹已删除，请进入其他文件夹后重新选择文件。'),
  LIBRARY_UPLOAD_REMOVED:t('This upload was previously saved, then deleted. Select the file again if you want a new copy.','这次上传曾成功保存，但文件之后已被删除。如需新副本，请重新选择文件。'),
  LIBRARY_UPLOAD_KEY_CONFLICT:t('The saved request does not match this file. Select the file again.','原上传请求与此文件不一致，请重新选择文件。'),
  LIBRARY_READ_FAILED:t('Could not read this file. Select it again.','无法读取本机文件，请重新选择。'),
 };
 const message=(code?:string)=>messages[code||'']||t('Could not confirm saving. Retry safely without creating another copy.','暂未确认保存结果。可安全重试，不会重复创建文件。');
 const retryable=items.filter(item=>item.state==='failed'&&!['LIBRARY_FILE_TOO_LARGE','LIBRARY_FOLDER_NOT_FOUND','LIBRARY_UPLOAD_REMOVED','LIBRARY_UPLOAD_KEY_CONFLICT','LIBRARY_READ_FAILED'].includes(item.error||''));
 return <section className={styles.root} aria-label={t('File uploads','文件上传')}>
  <input ref={input} type="file" multiple hidden accept=".txt,.md,.csv,.json,.pdf" onChange={event=>{if(event.target.files)choose(event.target.files);event.target.value='';}}/>
  <div className={styles.drop} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();choose(event.dataTransfer.files);}}><div><strong>{t('Bring your source material.','把工作资料放在这里。')}</strong><p>{t('Text, Markdown, CSV, JSON or PDF · up to 5 MB each','文本、Markdown、CSV、JSON 或 PDF · 每份最多 5 MB')}</p></div><button className="pw-primary" type="button" disabled={busy||disabled} onClick={()=>input.current?.click()}>{t('Upload files','上传文件')}</button></div>
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  {!!items.length&&<div className={styles.queue}><div className={styles.heading}><span role="status" aria-live="polite">{t(`${items.filter(item=>item.state==='saved').length} of ${items.length} saved`,`${items.length} 份中已保存 ${items.filter(item=>item.state==='saved').length} 份`)}</span>{busy&&<span>{t('Uploading…','正在上传…')}</span>}</div>
   <ul>{items.map(item=><li key={item.id}><span className={styles.mark} aria-hidden="true">{item.state==='saved'?'✓':item.state==='failed'?'!':item.state==='uploading'?'↑':'·'}</span><div><strong>{item.file.name}</strong><small>{item.destination} · {item.file.size<1024?`${item.file.size} B`:`${(item.file.size/1024).toFixed(1)} KB`}</small>{item.error&&<p className={styles.error}>{message(item.error)}</p>}</div><span className={styles.state}>{({queued:t('Waiting','等待上传'),uploading:t('Uploading','正在上传'),saved:t('Saved','已保存'),failed:t('Needs attention','需要处理')})[item.state]}</span></li>)}</ul>
   <div className={styles.actions}>{retryable.length>0&&<button type="button" disabled={busy||disabled} onClick={()=>void run(retryable)}>{t(`Retry ${retryable.length} file(s)`,`重试 ${retryable.length} 份文件`)}</button>}{!busy&&items.every(item=>item.state==='saved')&&<button type="button" onClick={()=>setItems([])}>{t('Dismiss completed uploads','收起已完成上传')}</button>}</div>
   {items.some(item=>item.state==='failed')&&<p className={styles.help}>{t('Saved files are already in your library. If you leave this page, select the same unconfirmed files in the same folder to recover them.','已保存的文件已进入资料库。离开页面后，可在同一文件夹重新选择未确认的文件，找回上传结果。')}</p>}
  </div>}
 </section>;
}
