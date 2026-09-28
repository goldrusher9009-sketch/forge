'use client';

import React,{useEffect,useRef,useState} from 'react';
import styles from './TaskDeliveryChecks.module.css';

type Rule={kind:string;filename:string;field?:string;expected?:string|number|boolean|null;expectedText?:string};
type Checklist={id:string;name:string;rules:Rule[]};
type Props={threadId:string;accountId:string;locale:string;refreshKey:string;request:(path:string,options?:RequestInit)=>Promise<any>};
const blank=():Rule=>({kind:'file_exists',filename:''});
export function TaskDeliveryChecks({threadId,accountId,locale,refreshKey,request}:Props){
  const zh=locale.startsWith('zh'),t=(en:string,cn:string)=>zh?cn:en;
  const [open,setOpen]=useState(false),[rules,setRules]=useState<Rule[]>([blank()]),[templates,setTemplates]=useState<Checklist[]>([]);
  const [report,setReport]=useState<any>(null),[files,setFiles]=useState<any[]>([]),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [name,setName]=useState(''),[chosen,setChosen]=useState(''),[confirmDelete,setConfirmDelete]=useState(false),[dirty,setDirty]=useState(false),[loaded,setLoaded]=useState(false);
  const ref=useRef(request);ref.current=request;const initialized=useRef(false);
  const base='/threads/'+encodeURIComponent(threadId)+'/delivery-checks';
  const labels:Record<string,string>={file_exists:t('File exists','文件已生成'),text_contains:t('Text contains','包含指定文字'),json_value:t('JSON field equals','JSON 字段值'),csv_rows:t('CSV data rows','CSV 数据行数'),csv_sum:t('CSV column total','CSV 数值列合计')};
  const reasons:Record<string,string>={MATCH:t('Matches','符合要求'),FILE_MISSING:t('Not saved by the latest task run','最近一次执行未保存此文件'),FILE_AMBIGUOUS:t('More than one file has this name','同名文件不止一个'),FILE_CHANGED:t('Changed since the tool saved it','工具保存后文件已被修改'),FILE_EMPTY:t('File is empty','文件为空'),TEXT_MISSING:t('Required text was not found','未找到指定文字'),FIELD_MISSING:t('Field or column was not found','未找到字段或列'),VALUE_MISMATCH:t('Value differs from the requirement','数值与要求不一致'),INVALID_CONTENT:t('File format or numeric data could not be checked','文件格式或数值数据无法检查')};
  const errors:Record<string,string>={DELIVERY_RUN_REQUIRED:t('Run this task first, then check its saved files.','请先执行任务，再检查它保存的文件。'),DELIVERY_RUN_ACTIVE:t('This task is still running. Check its files after it finishes.','任务仍在执行，请在结束后检查文件。'),DELIVERY_RULE_INVALID:t('Check the file names, field paths and expected values.','请检查文件名、字段路径和预期值。'),DELIVERY_RULES_REQUIRED:t('Add between 1 and 10 requirements.','请添加 1 至 10 条要求。'),DELIVERY_CHECKLIST_NAME_EXISTS:t('That name is already in use. Choose a new name to keep both checklists.','此名称已使用，请换一个名称保留两份清单。'),DELIVERY_CHECKLIST_LIMIT:t('You have 30 saved checklists. Remove one before saving another.','已有 30 份检查清单，请先删除一份。')};
  const api=async(path:string,options?:RequestInit)=>{const r=await ref.current(path,options);if(r?.success===false)throw Error(r.error);return r?.data??r;};
  useEffect(()=>{
    let alive=true;
    api(base).then(data=>{if(!alive)return;setFiles(data.files||[]);setReport(data.report);setLoaded(true);if(!initialized.current){if(data.report)setRules(data.report.rules);initialized.current=true;}}).catch(()=>{if(alive){setLoaded(false);setError(t('Saved checks could not be refreshed. Open this panel to retry.','未能刷新已保存的验收结果，展开面板可重试。'));}});
    return()=>{alive=false;};
  // The parent remounts this component when the task/account changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[threadId,accountId,refreshKey]);
  const act=async(kind:string,fn:()=>Promise<void>)=>{if(busy)return;setBusy(kind);setError('');setNotice('');try{await fn();}catch(e:any){setError(errors[e.message]||t('The operation could not be completed. Please try again.','未能完成操作，请重试。'));}finally{setBusy('');}};
  const edit=(index:number,patch:Partial<Rule>)=>{initialized.current=true;setRules(rows=>rows.map((row,n)=>n===index?{...row,...patch}:row));setDirty(true);setNotice('');};
  const valid=rules.length>0&&rules.every(r=>r.filename.trim()&&(r.kind==='file_exists'||r.expected!==undefined)&&(!['json_value','csv_sum'].includes(r.kind)||r.field?.trim()));
  const status=report&&!dirty&&loaded?(report.current?(report.passed?'passed':'failed'):'changed'):'ready';
  const saveReport=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='Forge-delivery-check-'+report.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return <section className={styles.panel} data-testid="task-delivery-checks" aria-label={t('Delivery checks','交付验收')}>
    <button type="button" className={styles.toggle} aria-expanded={open} onClick={()=>{setOpen(!open);if(!open)void act('load',async()=>{const [saved,current]=await Promise.all([api('/delivery-checklists'),api(base)]);setTemplates(saved);setReport(current.report);setFiles(current.files||[]);setLoaded(true);});}}>
      <span><span className={styles.eyebrow}>{t('FORGE / ACCEPTANCE','FORGE / 交付验收')}</span><strong>{t('Define what done looks like.','让完成，有据可验。')}</strong></span>
      <span className={styles.badge} data-state={status}>{status==='passed'?t('Checks passed','验收通过'):status==='failed'?t('Needs review','需要检查'):status==='changed'?t('Files or task changed','文件或任务已变化'):t('Delivery checks','交付验收')} <span aria-hidden="true">{open?'−':'+'}</span></span>
    </button>
    {open&&<div className={styles.body}>
      <p className={styles.intro}>{t('Check the files saved by the latest task run against your requirements. No model calls or credit charge.','按你的要求检查任务最近一次执行保存的文件，不调用模型、不消耗模型额度。')}</p>
      <div className={styles.reuse}><label>{t('Reuse a checklist','复用检查清单')}<select aria-label={t('Reuse a checklist','复用检查清单')} value={chosen} disabled={!!busy} onChange={e=>{setChosen(e.target.value);setConfirmDelete(false);}}><option value="">{t('Choose a saved checklist','选择已保存的清单')}</option>{templates.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <button type="button" disabled={!chosen||!!busy} onClick={()=>{const selected=templates.find(row=>row.id===chosen);if(selected){setRules(selected.rules.map(row=>({...row})));setDirty(true);setNotice(t('Checklist applied. Review the file names before checking.','清单已应用，请核对文件名后再验收。'));}}}>{t('Apply','应用')}</button>
        {chosen&&<button type="button" disabled={!!busy} className={styles.quiet} onClick={()=>{if(!confirmDelete){setConfirmDelete(true);return;}void act('delete',async()=>{await api('/delivery-checklists/'+encodeURIComponent(chosen),{method:'DELETE'});setTemplates(rows=>rows.filter(row=>row.id!==chosen));setChosen('');setConfirmDelete(false);});}}>{confirmDelete?t('Confirm delete','确认删除'):t('Delete checklist','删除清单')}</button>}
      </div>
      <fieldset disabled={!!busy} className={styles.rules}>
        <legend className={styles.legend}>{t('Your requirements','你的验收要求')} <span>{rules.length}/10</span></legend>
        <datalist id={'delivery-files-'+threadId}>{files.map(file=><option value={file.filename} key={file.id}/>)}</datalist>
        {rules.map((rule,index)=><div className={styles.rule} key={index}>
          <span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
          <label>{t('File name','文件名')}<input aria-label={t(`File name ${index+1}`,`文件名 ${index+1}`)} list={'delivery-files-'+threadId} maxLength={200} value={rule.filename} placeholder="Revenue data.csv" onChange={e=>edit(index,{filename:e.target.value})}/></label>
          <label>{t('Requirement','检查方式')}<select aria-label={t(`Requirement ${index+1}`,`检查方式 ${index+1}`)} value={rule.kind} onChange={e=>{setRules(rows=>rows.map((row,n)=>n===index?{filename:row.filename,kind:e.target.value}:row));setDirty(true);}}>{Object.entries(labels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
          {['json_value','csv_sum'].includes(rule.kind)&&<label className={styles.extra}>{rule.kind==='json_value'?t('Field path','字段路径'):t('Column name','列名')}<input aria-label={t(`Field ${index+1}`,`字段 ${index+1}`)} value={rule.field||''} maxLength={300} placeholder={rule.kind==='json_value'?'/totalNetUsd':'Net_USD'} onChange={e=>edit(index,{field:e.target.value})}/></label>}
          {rule.kind!=='file_exists'&&<label className={styles.extra}>{t('Expected value','预期值')}<input aria-label={t(`Expected value ${index+1}`,`预期值 ${index+1}`)} type={rule.kind.startsWith('csv_')?'number':'text'} step="any" maxLength={2000} value={rule.expectedText??(rule.expected===undefined?'':typeof rule.expected==='string'?rule.expected:JSON.stringify(rule.expected))} placeholder={rule.kind==='text_contains'?t('Required text','必须出现的文字'):'730'} onChange={e=>{let value:any=e.target.value;if(rule.kind.startsWith('csv_'))value=value===''?undefined:Number(value);else if(rule.kind==='json_value'){try{value=JSON.parse(value);}catch{}}edit(index,{expected:value,expectedText:e.target.value});}}/></label>}
          <button type="button" className={styles.remove} aria-label={t(`Remove requirement ${index+1}`,`删除要求 ${index+1}`)} onClick={()=>{setRules(rows=>rows.filter((_,n)=>n!==index));setDirty(true);}}>×</button>
        </div>)}
        <button type="button" className={styles.add} disabled={rules.length>=10} onClick={()=>{setRules(rows=>[...rows,blank()]);setDirty(true);}}>+ {t('Add requirement','添加验收要求')}</button>
      </fieldset>
      <p className={styles.hint}>{t('File names are exact. JSON paths use /field or /nested/field. CSV totals accept plain decimals with up to 6 places; rows exclude the header.','文件名需完全一致。JSON 路径使用 /字段 或 /上层/字段。CSV 合计支持最多 6 位小数的纯数字；数据行数不含表头。')}</p>
      <div className={styles.actions}><button type="button" className={styles.primary} disabled={!valid||!!busy} onClick={()=>void act('check',async()=>{const result=await api(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules})});setReport(result);setDirty(false);setLoaded(true);})}>{busy==='check'?t('Checking…','检查中…'):t('Check saved files','验收已保存文件')} <span aria-hidden="true">↗</span></button>
        <div className={styles.save}><input aria-label={t('Checklist name','清单名称')} placeholder={t('Name this checklist','给清单起个名称')} value={name} maxLength={80} disabled={!!busy} onChange={e=>setName(e.target.value)}/><button type="button" disabled={!valid||!name.trim()||!!busy} onClick={()=>void act('save',async()=>{const saved=await api('/delivery-checklists',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.trim(),rules})});setTemplates(rows=>[saved,...rows.filter(row=>row.id!==saved.id)]);setChosen(saved.id);setNotice(t('Saved to your account for future tasks.','已保存到你的账号，可用于其他任务。'));})}>{t('Save for reuse','保存以便复用')}</button></div>
      </div>
      {error&&<p role="alert" className={styles.error}>{error}</p>}{notice&&<p role="status" className={styles.notice}>{notice}</p>}
      {report&&!dirty&&loaded&&<div className={styles.report} data-state={status} role="status">
        <div className={styles.reportHeading}><div><span className={styles.eyebrow}>{t('SAVED EVIDENCE','已保存的验收证据')}</span><h4>{status==='changed'?t('Run the checks again.','请重新验收。'):report.passed?t('Your requirements are met.','交付物符合你的要求。'):t('This delivery needs a review.','这次交付还需要检查。')}</h4></div><strong>{report.results.filter((row:any)=>row.passed).length}<span>/{report.results.length}</span></strong></div>
        {!report.current&&<p>{t('The task, files or settlement changed after this report. The previous result is historical.','任务、文件或结算在验收后发生变化，原结果仅作为历史记录。')}</p>}
        {report.runStatus!=='completed'&&<p>{t('The latest task did not complete successfully. Passing file checks alone cannot confirm delivery.','最近一次任务未成功完成，仅文件检查通过不能确认交付完成。')}</p>}
        {!report.accountingComplete&&<p>{t('Task cost settlement has not been confirmed.','任务费用结算尚未确认。')}</p>}
        <ol className={styles.results}>{report.results.map((row:any,index:number)=><li key={index}><span className={styles.resultIcon} data-pass={row.passed}>{row.passed?'✓':'×'}</span><div><strong>{row.rule.filename}</strong><span>{labels[row.rule.kind]} · {reasons[row.reason]||row.reason}{row.actual!==undefined?' · '+t('Actual: ','实际值：')+JSON.stringify(row.actual):''}</span></div></li>)}</ol>
        <div className={styles.reportFooter}><span>{new Date(report.checkedAt).toLocaleString(zh?'zh-CN':'en-US')} · {report.chargeUsd===null?t('Cost pending','费用待核对'):t('Task cost ','任务费用 ')+'$'+report.chargeUsd.toFixed(6)}</span><button type="button" onClick={saveReport}>{t('Download report','下载验收报告')} ↓</button></div>
      </div>}
      <p className={styles.boundary}>{t('These checks verify saved file content and task completion. They do not certify factual accuracy, chart appearance or behavior when code is executed. Preview important deliverables before using them.','这些检查验证已保存的文件内容和任务完成状态，不证明事实准确性、图表视觉效果或代码运行行为。使用重要交付物前，请先预览核对。')}</p>
    </div>}
  </section>;
}
