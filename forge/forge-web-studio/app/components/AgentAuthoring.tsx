'use client';
import React, {useEffect,useRef,useState} from 'react';
import styles from './AgentAuthoring.module.css';

type Draft={name:string;system_prompt:string;model:string};
type Turn={id:string;description:string;draft:Draft|null;status:string;error:string|null;chargeUsd:number|null;billingState:string;createdAt:string;locallyActive:boolean};
type Conversation={id:string;title:string;turns?:Turn[]};
type Pending={id:string;key:string;body:{description:string;currentDraft:Draft;model:string;maximumUsd:number}};
type Props={api:(path:string,options?:RequestInit)=>Promise<any>;zh:boolean;draft:Draft;disabled:boolean;onApply:(draft:Draft)=>void;onBusy:(busy:boolean)=>void};

export function AgentAuthoring({api,zh,draft,disabled,onApply,onBusy}:Props){
 const t=(en:string,cn:string)=>zh?cn:en;
 const [history,setHistory]=useState<Conversation[]>([]),[id,setId]=useState(''),[turns,setTurns]=useState<Turn[]>([]);
 const [brief,setBrief]=useState(''),[budget,setBudget]=useState('0.50'),[working,setWorking]=useState(false),[reading,setReading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [pending,setPending]=useState<Pending|null>(null),[applyId,setApplyId]=useState('');
 const apiRef=useRef(api);apiRef.current=api;
 const lock=useRef(false),sequence=useRef(0),mounted=useRef(true);
 const list=async()=>{const result=await apiRef.current('/workspace-agent-drafts');if(mounted.current)setHistory(result.data);};
 useEffect(()=>{mounted.current=true;void list().catch(()=>{if(mounted.current)setError('LOAD_FAILED');});return()=>{mounted.current=false;sequence.current++;};},[]);
 const messages:Record<string,string>={
  LOAD_FAILED:t('Creation history could not load. Refresh to try again.','创作记录暂时无法加载，请刷新重试。'),
  UNCONFIRMED:t('The response was interrupted. Recover this same request before starting another. Recovery will not repeat an accepted model call.','响应已中断。请先恢复原请求，再发起新的修改。恢复不会重复派发已接受的模型请求。'),
  AGENT_DRAFT_PREVIOUS_UNRESOLVED:t('The previous request or its cost is unresolved. Refresh its status before continuing.','上次请求或其费用尚未确认，请先刷新状态。'),
  AGENT_EVALUATION_BUDGET_EXCEEDED:t('The maximum reservation exceeds this budget. Increase it or choose a lighter model below.','最大预占金额超过本轮预算，请提高上限或在下方选择轻量模型。'),
  BILLING_INSUFFICIENT_FUNDS:t('There is not enough Forge credit. Open Usage & plan to review your balance.','Forge 额度不足，请在“用量与套餐”查看余额。'),
  BILLING_PAID_CREDITS_REQUIRED:t('Choose a lightweight model, or purchase credit to use this model.','请选择轻量模型，或购买额度后使用此模型。'),
  AGENT_DRAFT_FORMAT_INVALID:t('The model did not return a usable draft. The recorded cost still applies; your editable instructions were preserved.','模型未返回可用草稿，已记录的费用仍可能产生；当前工作说明已保留。'),
  AGENT_DRAFT_TURN_LIMIT:t('This conversation has 30 revisions. Start a new conversation with the current draft.','本次创作已有 30 轮修改，请以当前草稿开始新对话。'),
  AGENT_DRAFT_HISTORY_LIMIT:t('Your creation history has reached its account limit. Contact support.','创作记录已达到账号上限，请联系支持。'),
  DESKTOP_MODEL_UNAVAILABLE:t('Choose an available Forge model below.','请在下方选择可用的 Forge 模型。'),
 };
 const open=async(next:string)=>{
  if(lock.current||pending)return;
  const current=++sequence.current;setError('');setApplyId('');
  if(!next){setId('');setTurns([]);setBrief('');return;}
  lock.current=true;setReading(true);onBusy(true);
  try{const result=await apiRef.current('/workspace-agent-drafts/'+encodeURIComponent(next));if(current!==sequence.current||!mounted.current)return;setId(next);setTurns(result.data.turns);setBrief('');setNotice(t('History opened. Choose a draft to use it; your editable instructions have not changed.','已打开历史记录。选择草稿后可采用它，当前工作说明保持不变。'));}
  catch{if(current===sequence.current)setError('LOAD_FAILED');}
  finally{lock.current=false;if(mounted.current)setReading(false);onBusy(false);}
 };
 const send=async(recover?:Pending)=>{
  if(lock.current||(!recover&&disabled))return;
  const operation=recover||{id:id||crypto.randomUUID(),key:crypto.randomUUID(),body:{description:brief,currentDraft:{...draft},model:draft.model,maximumUsd:Number(budget)}};
  lock.current=true;setWorking(true);onBusy(true);setError('');setNotice('');setPending(operation);setId(operation.id);
  try{
   const result=await apiRef.current('/workspace-agent-drafts/'+encodeURIComponent(operation.id)+'/turns',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':operation.key},body:JSON.stringify(operation.body)});
   if(result.success===false)throw new Error(result.error);
   if(!mounted.current)return;
   const turn=result.data as Turn;
   setTurns(current=>[...current.filter(item=>item.id!==turn.id),turn]);
   if(turn.status!=='running')setPending(null);
   if(turn.status==='completed'&&turn.draft){onApply(turn.draft);setBrief('');setNotice(t('Revision saved to your history and placed in the editor. Review and save the Agent when ready.','修改结果已保存到创作记录并放入编辑区。检查后再保存 Agent。'));}
   else if(turn.error)setError(turn.error);
   else if(turn.status==='running')setNotice(t('This request has already been accepted. Refresh to recover its result.','此请求已被接受，请刷新恢复结果。'));
   void list().catch(()=>{});
  }catch(caught:any){if(mounted.current){const code=caught.message||'';const rejected=['INVALID_AGENT_BRIEF','AGENT_DRAFT_BUDGET_INVALID','AGENT_DRAFT_PREVIOUS_UNRESOLVED','AGENT_DRAFT_CONVERSATION_NOT_FOUND','AGENT_DRAFT_TURN_LIMIT','AGENT_DRAFT_HISTORY_LIMIT','AGENT_DRAFT_REQUEST_CONFLICT','DESKTOP_IDEMPOTENCY_KEY_INVALID'].includes(code);if(rejected)setPending(null);setError(rejected?code:'UNCONFIRMED');}}
  finally{lock.current=false;if(mounted.current)setWorking(false);onBusy(false);}
 };
 const refresh=async()=>{if(pending){await send(pending);return;}if(id)await open(id);else await list().catch(()=>setError('LOAD_FAILED'));};
 const running=turns.some(turn=>turn.status==='running'||['pending','unknown','review_required'].includes(turn.billingState));
 const inactive=disabled||working||reading||!!pending;
 return <section className={styles.root} aria-label={t('Creation conversation','创作对话')}>
  <div className={styles.toolbar}><div><span className={styles.eyebrow}>{t('CREATION HISTORY','创作记录')}</span><p>{t('A conversation you can return to.','每一步修改，都可以回看。')}</p></div><button disabled={inactive} onClick={()=>void open('')}>{t('+ New conversation','+ 新对话')}</button></div>
  <div className={styles.history}><select aria-label={t('Saved creation conversations','已保存的创作对话')} value={history.some(row=>row.id===id)?id:''} disabled={inactive} onChange={event=>void open(event.target.value)}><option value="">{t('New creation conversation','新的创作对话')}</option>{history.map(row=><option key={row.id} value={row.id}>{row.title}</option>)}</select><button disabled={disabled||working} onClick={()=>void refresh()}>{t('Refresh history','刷新记录')}</button></div>
  {!turns.length&&<div className={styles.empty}><strong>{t('Start with the work you want done.','从想完成的工作开始。')}</strong><p>{t('Describe the outcome, then refine the instructions together. Your requests and generated drafts stay in your Forge account.','描述目标，再逐步完善工作说明。修改要求与生成的草稿都会保存在你的 Forge 账号中。')}</p><div className={styles.examples}>{[t('Compare supplier quotes and flag missing evidence.','比较供应商报价，并标出缺失的依据。'),t('Turn monthly data into a decision brief.','把月度数据整理成决策简报。')].map(example=><button key={example} disabled={inactive} onClick={()=>setBrief(example)}>{example} ↗</button>)}</div></div>}
  <div className={styles.timeline} aria-live="polite">{turns.map((turn,index)=><article key={turn.id} className={styles.turn}>
   <div className={styles.turnMeta}><span>{t('REVISION','修改')} {String(index+1).padStart(2,'0')}</span><span>{turn.chargeUsd===null?(turn.billingState==='not_recorded'&&turn.status==='failed'?t('No billing record','无计费记录'):t('Cost pending','费用待核对')):`$${turn.chargeUsd.toFixed(6)}`}</span></div>
   <p className={styles.prompt}>{turn.description}</p>
   {turn.draft?<div className={styles.result}><div className={styles.resultHeading}><strong>{turn.draft.name}</strong><span>{turn.draft.model}</span></div><details><summary>{t('Review working instructions','查看工作说明')}</summary><pre>{turn.draft.system_prompt}</pre></details><button disabled={inactive} onClick={()=>{if((draft.name||draft.system_prompt)&&(draft.name!==turn.draft!.name||draft.system_prompt!==turn.draft!.system_prompt||draft.model!==turn.draft!.model)&&applyId!==turn.id){setApplyId(turn.id);return;}onApply(turn.draft!);setApplyId('');setNotice(t('This revision is now in the editor. Save the Agent to keep using it.','此轮草稿已放入编辑区，请保存 Agent 以采用它。'));}}>{applyId===turn.id?t('Confirm replacing editable draft','确认替换编辑区草稿'):t('Use this draft','采用此草稿')}</button>{applyId===turn.id&&<button onClick={()=>setApplyId('')}>{t('Keep current draft','保留当前草稿')}</button>}</div>:<p className={styles.status}>{turn.status==='running'?(turn.locallyActive?t('Forge is preparing this revision…','Forge 正在起草…'):t('This request has no confirmed completion. It will not restart automatically.','此请求尚无已确认的完成结果，系统不会自动重发。')):(messages[turn.error||'']||t('This revision did not finish. Your earlier drafts remain available.','本轮修改未完成，之前的草稿仍可使用。'))}</p>}
  </article>)}</div>
  {error&&<p className={styles.error} role="alert">{messages[error]||t('The operation could not finish. Review the saved result and usage before retrying.','操作未完成，请先核对已保存结果和用量再重试。')}</p>}
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  {pending&&<button disabled={disabled||working} onClick={()=>void send(pending)}>{t('Recover saved result','恢复已保存结果')}</button>}
  <label className={styles.composer}>{t('What should this Agent do next?','希望这个 Agent 如何工作或改进？')}<textarea rows={3} maxLength={4000} value={brief} disabled={inactive} onChange={event=>setBrief(event.target.value)} placeholder={t('Define its job, or describe the next change…','描述它的工作，或提出下一步修改…')}/></label>
  <div className={styles.sendRow}><label>{t('Budget for this revision (USD)','本轮预算上限（美元）')}<input type="number" min="0.01" max="5" step="0.01" value={budget} disabled={inactive} onChange={event=>setBudget(event.target.value)}/></label><button className={styles.send} disabled={inactive||running||!brief.trim()||!draft.model||!Number.isFinite(Number(budget))||Number(budget)<0.01||Number(budget)>5} onClick={()=>void send()}>{working?t('Preparing revision…','正在起草…'):t('Draft with Forge ↗','让 Forge 起草 ↗')}</button></div>
  <p className={styles.footnote}>{t('Uses the model and editable instructions below. Each new revision uses Forge credit; reopening history and applying a saved draft are free. Saving an Agent and publishing an evaluated version remain separate steps.','使用下方所选模型和当前工作说明。新修改会消耗 Forge 额度；查看记录、采用已保存草稿不调用模型。保存 Agent 和发布通过测评的版本仍需分别完成。')}</p>
 </section>;
}
