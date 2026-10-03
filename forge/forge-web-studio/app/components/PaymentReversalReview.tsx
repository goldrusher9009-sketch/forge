'use client';
import React from 'react';
import styles from './PaymentReversalReview.module.css';

type Preview = {paidUsd:number;returnedUsd:number;originalCreditUsd:number;targetReversalUsd:number;alreadyRecoveredUsd:number;alreadyWaivedUsd:number;recoverNowUsd:number;shortfallUsd:number;availableAfterUsd:number;previewHash:string;checkedAt:string;sourceKind:string;subscriptionExpired:boolean};
type Request = {requestId:string;previewHash:string;decision:'recover_only'|'waive_shortfall';evidence:string};
type Props = {holdId:string;token:string;apiFetch:(path:string,opts?:RequestInit,token?:string)=>Promise<any>;onComplete:(message:string)=>void};
const usd=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:9}).format(value);

export function PaymentReversalReview({holdId,token,apiFetch,onComplete}:Props){
 const [preview,setPreview]=React.useState<Preview|null>(null),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
 const [evidence,setEvidence]=React.useState(''),[decision,setDecision]=React.useState<Request['decision']>('recover_only'),[confirmed,setConfirmed]=React.useState(false),[pending,setPending]=React.useState<Request|null>(null);
 const route=`/admin/billing/holds/${encodeURIComponent(holdId)}/reversal`;
 const refresh=async()=>{setBusy(true);setError('');setPreview(null);setConfirmed(false);setPending(null);try{const r=await apiFetch(route,{},token);setPreview(r.data);}catch(e:any){setError(e?.message||'Unable to verify payment. The hold is unchanged.');}finally{setBusy(false);}};
 const apply=async()=>{if(!preview||busy)return;const input=pending||{requestId:crypto.randomUUID(),previewHash:preview.previewHash,decision,evidence:evidence.trim()};setPending(input);setBusy(true);setError('');try{
   const {data:r}=await apiFetch(route,{method:'POST',body:JSON.stringify(input)},token);
   setPending(null);setPreview(null);setConfirmed(false);setEvidence('');
   onComplete(`Credits recovered: ${usd(r.recoveredUsd)}. Loss accepted by Forge: ${usd(r.waivedUsd)}. Remaining shortfall: ${usd(r.remainingExposureUsd)}. ${r.spendingRestricted?'Spending remains on hold.':'Spending hold released.'} Receipt: ${r.requestId}`);
 }catch(e:any){setError(e?.message||'No confirmation received. Retry the same request to retrieve its receipt.');}finally{setBusy(false);}};
 const lock=busy||Boolean(pending);
 return <section className={styles.root} aria-label="Reconcile refunded credits">
  <div className={styles.heading}><div><span className={styles.eyebrow}>PAYMENT RECONCILIATION</span><h4>Match the loss. Review the credits.</h4><p>Verify completed refunds or a lost dispute before adjusting issued credits.</p></div><button type="button" disabled={busy} onClick={refresh}>{busy?'Checking…':preview?'Refresh preview':'Preview credit recovery'}</button></div>
  {error&&<p className={styles.error} role="alert">{error}{pending&&' You can retry this exact request, or refresh to check the latest state.'}</p>}
  {preview&&<div>
   <dl className={styles.figures}>
    <div><dt>Original payment</dt><dd>{usd(preview.paidUsd)}</dd></div><div><dt>Verified payment loss</dt><dd>{usd(preview.returnedUsd)}</dd></div><div><dt>Original credits</dt><dd>{usd(preview.originalCreditUsd)}</dd></div>
    <div><dt>Credits to reverse, total</dt><dd>{usd(preview.targetReversalUsd)}</dd></div><div><dt>Previously recovered</dt><dd>{usd(preview.alreadyRecoveredUsd)}</dd></div><div><dt>Previously accepted loss</dt><dd>{usd(preview.alreadyWaivedUsd)}</dd></div>
   </dl>
   <div className={styles.impact}><div><span>Recover now</span><strong>{usd(preview.recoverNowUsd)}</strong></div><div><span>Unrecoverable shortfall</span><strong>{usd(preview.shortfallUsd)}</strong></div></div>
   <p className={styles.explanation}>{preview.sourceKind==='subscription'?'Recovery uses only unused credits from the original subscription period. Future periods and the prepaid balance are unaffected.':'Recovery uses the current prepaid balance, up to the verified refunded credits.'} {preview.subscriptionExpired&&'This subscription period has expired; the adjustment records revoked credits from that period.'} Remaining {preview.sourceKind==='subscription'?'period credits':'prepaid balance'}: {usd(preview.availableAfterUsd)}.</p>
   <fieldset className={styles.choices} disabled={lock}><legend>Choose how to handle the result</legend>
    <label><input type="radio" name={`reversal-${holdId}`} checked={decision==='recover_only'} onChange={()=>{setDecision('recover_only');setConfirmed(false);}}/><span><b>Recover available credits</b><small>{preview.shortfallUsd>0?'Keep this hold active until the shortfall is addressed.':'Resolve this hold once the credits are recovered.'}</small></span></label>
    {preview.shortfallUsd>0&&<label><input type="radio" name={`reversal-${holdId}`} checked={decision==='waive_shortfall'} onChange={()=>{setDecision('waive_shortfall');setConfirmed(false);}}/><span><b>Recover credits and accept the shortfall</b><small>Forge absorbs {usd(preview.shortfallUsd)}. Resolve this hold and record your decision.</small></span></label>}
   </fieldset>
   <label className={styles.evidence}>Review evidence<textarea value={evidence} disabled={lock} maxLength={4000} onChange={e=>{setEvidence(e.target.value);setConfirmed(false);}} placeholder="Record the payment case, checks performed and reason for this decision." rows={3}/><small>At least 8 characters. Your administrator identity and this evidence are saved with the receipt.</small></label>
   <label className={styles.confirm}><input type="checkbox" checked={confirmed} disabled={lock} onChange={e=>setConfirmed(e.target.checked)}/><span>I confirm the credit adjustment{decision==='waive_shortfall'?` and accept the ${usd(preview.shortfallUsd)} loss for Forge`:''}. Other active holds will remain in force.</span></label>
   <div className={styles.footer}><small>Verified {new Date(preview.checkedAt).toLocaleString()}. This action adjusts credits; it does not send a refund.</small><button className={styles.primary} type="button" disabled={busy||(!pending&&(!confirmed||evidence.trim().length<8))} onClick={apply}>{busy?'Confirming…':pending?'Retry same request':'Confirm credit adjustment'}</button></div>
  </div>}
 </section>;
}
