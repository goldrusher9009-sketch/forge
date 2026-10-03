'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ContextUsage.module.css';

type Stats = {scope:string;total_tokens:number;prompt_tokens:number;completion_tokens:number;reported_requests:number;pending_requests:number;context:{mode:string;model:string|null;contextWindow:number|null;lastInputTokens:number|null;lastInputAt:string|null;outputReserve:number|null;compactions:number;metadataSource:string|null};model_breakdown:{model:string;provider?:string;requests:number;total_tokens:number}[]};
export function MobileContextUsage(props:Parameters<typeof ContextUsage>[0]) {
  const [open,setOpen]=useState(false);
  return <div className={styles.mobile}><button className={styles.toggle} type="button" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><span>{props.zh?'上下文与用量':'Context & usage'}</span><span aria-hidden="true">{open?'−':'+'}</span></button>{open&&<ContextUsage {...props}/>}</div>;
}
export function ContextUsage({threadId,api,zh,sending}:{threadId:string;api:(path:string)=>Promise<any>;zh:boolean;sending:boolean}) {
  const request = useRef(api);request.current=api;
  const [stats,setStats]=useState<Stats|null>(null),[error,setError]=useState(false),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(0);
  const t=(en:string,cn:string)=>zh?cn:en;
  useEffect(()=>{let current=true;setLoading(true);setError(false);request.current(`/threads/${encodeURIComponent(threadId)}/stats`).then(result=>{if(!result?.success)throw Error('STATS_UNAVAILABLE');if(current)setStats(result.data);}).catch(()=>{if(current){setStats(null);setError(true);}}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[threadId,sending,refresh]);
  const context=stats?.context,known=context?.lastInputTokens!=null&&context?.contextWindow!=null&&context.contextWindow>0;
  const pct=known?Math.min(100,context!.lastInputTokens!/context!.contextWindow!*100):null;
  const number=(value:number|null|undefined)=>value==null?'—':value.toLocaleString(zh?'zh-CN':'en-US');
  return <section className={styles.panel} aria-label={t('Context and usage','上下文与用量')} aria-busy={loading}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>{t('TASK INSIGHTS','任务用量')}</span><h2>{t('Context & usage','上下文与用量')}</h2></div><button type="button" disabled={loading} onClick={()=>setRefresh(value=>value+1)}>{loading?t('Loading…','读取中…'):t('Refresh','刷新')}</button></div>
    {error?<p role="alert" className={styles.note}>{t('Usage could not be loaded. Refresh to try again.','暂时无法读取用量，请刷新重试。')}</p>:!stats?<p role="status" className={styles.note}>{t('Reading this task’s usage…','正在读取当前任务用量…')}</p>:<>
      <div className={styles.card}>
        <div className={styles.row}><h3>{t('Last model input','最近一次模型输入')}</h3><span className={styles.badge}>{context?.mode==='automatic'?t('Auto context','自动管理'):t('Measurement','输入测量')}</span></div>
        <p className={styles.model}>{context?.model||t('Available after the first run','首次执行后显示')}</p>
        <div className={styles.metric}><strong>{number(context?.lastInputTokens)}</strong><span>tokens</span><span className={styles.percent}>{pct==null?t('Not measured','暂无测量'):pct.toFixed(1)+'%'}</span></div>
        {known&&<div className={styles.track} role="meter" aria-label={t('Last input as a share of model capacity','最近一次输入占模型容量的比例')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(pct!.toFixed(1))}><div style={{width:`${pct}%`}} /></div>}
        <dl className={styles.details}><div><dt>{t('Runtime capacity','运行时模型容量')}</dt><dd>{number(context?.contextWindow)}</dd></div><div><dt>{t('Reply allowance','回复预留上限')}</dt><dd>{number(context?.outputReserve)}</dd></div></dl>
        <p className={styles.note}>{t('The last measured input includes cached tokens. It is a past request, not the current context or cumulative usage.','最近一次输入包含缓存 token，反映上一请求；不代表当前上下文占用或累计用量。')}</p>
        {context?.metadataSource==='conservative_fallback'&&<p className={styles.note}>{t('Capacity uses a conservative fallback because model metadata is unavailable.','模型元数据暂缺，容量采用保守默认值。')}</p>}
      </div>
      {context?.mode==='automatic'&&<div className={styles.automatic}><span aria-hidden="true">↻</span><div><strong>{t('Context is managed automatically','上下文自动管理')}</strong><p>{t('Forge compacts model context when needed. Your conversation, original images and saved files remain available.','Forge 会在需要时自动压缩模型上下文，对话记录、原图和已保存文件仍然保留。')}</p><small>{t('Compactions on this branch: ','当前分支已记录压缩：')}{number(context.compactions)}</small></div></div>}
      {stats.scope==='thread'?<div className={styles.card}><h3>{t('This task’s cumulative usage','本任务累计用量')}</h3><p className={styles.note}>{t('Includes measured calls and retries in this task. Inherited branch history does not count as new usage.','统计本任务已计量的调用及重试；继承的分支历史不计为新的用量。')}</p><dl className={styles.totals}><div><dt>{t('Input','输入')}</dt><dd>{number(stats.prompt_tokens)}</dd></div><div><dt>{t('Output','输出')}</dt><dd>{number(stats.completion_tokens)}</dd></div><div><dt>{t('Total tokens','累计 token')}</dt><dd>{number(stats.total_tokens)}</dd></div><div><dt>{t('Measured calls','已计量调用')}</dt><dd>{number(stats.reported_requests)}</dd></div></dl>{stats.pending_requests>0&&<p role="status" className={styles.pending}>{t(`${stats.pending_requests} call(s) still await usage confirmation and are excluded from these totals.`,`${stats.pending_requests} 次调用用量待确认，尚未计入以上总量。`)}</p>}{stats.model_breakdown.length>0&&<ul className={styles.models}>{stats.model_breakdown.map(item=><li key={`${item.provider}:${item.model}`}><span>{item.model.replace(/^openrouter\//,'')}</span><strong>{number(item.total_tokens)}</strong></li>)}</ul>}</div>:<p className={styles.note}>{t('Task-level measurements are unavailable for this older execution mode.','此旧执行模式暂未提供任务级用量测量。')}</p>}
    </>}
  </section>;
}
