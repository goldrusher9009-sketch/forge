import { createHash, randomUUID } from 'node:crypto';
import { moneyUnits, moneyUsd } from './managed-billing';
import { BillingCheckoutError } from './billing-error';

const fail = (code: string, status=409): never => { throw new BillingCheckoutError(code,status); };
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
type Deps = {db:any; proof:(hold:any)=>Promise<any>; getCredits:(id:string)=>number; adjustCredits:(id:string,delta:number,reason:string,source:string)=>unknown; now?:()=>number};

/** Reconcile verified payment losses with issued credits. No payment-provider writes.
 * A shortfall stays frozen unless a named operator explicitly accepts that loss. */
export function createPaymentReversals({db,proof,getCredits,adjustCredits,now=Date.now}:Deps) {
  db.exec(`CREATE TABLE IF NOT EXISTS billing_credit_reversals (
    charge_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,source_kind TEXT NOT NULL,source_id TEXT NOT NULL,source_key TEXT NOT NULL,
    original_units INTEGER NOT NULL,principal_cents INTEGER NOT NULL,loss_cents INTEGER NOT NULL,target_units INTEGER NOT NULL,
    grant_recovered_units INTEGER NOT NULL DEFAULT 0,prepaid_recovered_units INTEGER NOT NULL DEFAULT 0,
    unrecovered_units INTEGER NOT NULL DEFAULT 0,waived_units INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS billing_credit_reversal_reviews (
    request_id TEXT PRIMARY KEY,hold_id TEXT NOT NULL,user_id TEXT NOT NULL,actor TEXT NOT NULL,input_hash TEXT NOT NULL,
    decision TEXT NOT NULL,evidence TEXT NOT NULL,proof_json TEXT NOT NULL,result_json TEXT NOT NULL,created_at INTEGER NOT NULL);`);
  const atomic = (fn:()=>any) => {const tx=db.transaction(fn);return (tx.immediate||tx)();};
  const getHold = (id:string) => {
    const hold=db.prepare('SELECT * FROM billing_account_holds WHERE id=?').get(id);
    if(!hold)fail('BILLING_HOLD_NOT_FOUND',404);
    if(hold.state!=='active')fail('BILLING_HOLD_ALREADY_RESOLVED');
    return hold;
  };
  const idle = (user:string) => {
    if(db.prepare("SELECT 1 FROM managed_billing_requests WHERE user_id=? AND state NOT IN ('settled','released') LIMIT 1").get(user))fail('BILLING_REVERSAL_PENDING_USAGE');
    if(db.prepare("SELECT name FROM sqlite_master WHERE name='pi_provider_receipts'").get() && db.prepare("SELECT 1 FROM pi_provider_receipts WHERE user_id=? AND usage_status IN ('pending','unknown') LIMIT 1").get(user))fail('BILLING_REVERSAL_PENDING_USAGE');
    if(db.prepare('SELECT 1 FROM managed_billing_grants WHERE user_id=? AND held_units<>0 LIMIT 1').get(user))fail('BILLING_REVERSAL_PENDING_USAGE');
  };
  const calculate = (hold:any,p:any,originalHold:any) => {
    if(hash(hold)!==hash(originalHold))fail('BILLING_REVERSAL_PREVIEW_CHANGED');
    if(p.holdId!==hold.id || p.userId!==hold.user_id || p.currency!=='usd' || !['topup','subscription'].includes(p.kind) || !Number.isSafeInteger(p.originalUnits) || p.originalUnits<=0 || !Number.isSafeInteger(p.principalCents) || p.principalCents<=0 || !Number.isSafeInteger(p.lossCents) || p.lossCents<=0 || p.lossCents>p.principalCents || !Number.isSafeInteger(p.checkedAt) || p.checkedAt>now() || now()-p.checkedAt>30000)fail('BILLING_REVERSAL_PROOF_INVALID');
    idle(hold.user_id);
    const prior=db.prepare('SELECT * FROM billing_credit_reversals WHERE charge_id=?').get(p.chargeId);
    if(db.prepare('SELECT 1 FROM billing_credit_reversals WHERE source_kind=? AND source_id=? AND charge_id<>? LIMIT 1').get(p.kind,p.sourceId,p.chargeId))fail('BILLING_REVERSAL_FUNDING_MISMATCH');
    if(prior && (prior.user_id!==hold.user_id || prior.source_kind!==p.kind || prior.source_id!==p.sourceId || prior.source_key!==p.sourceKey || prior.original_units!==p.originalUnits || prior.principal_cents!==p.principalCents || prior.loss_cents>p.lossCents))fail('BILLING_REVERSAL_FUNDING_MISMATCH');
    const target=Number((BigInt(p.originalUnits)*BigInt(p.lossCents)+BigInt(p.principalCents)-1n)/BigInt(p.principalCents));
    const recovered=(prior?.grant_recovered_units||0)+(prior?.prepaid_recovered_units||0),waived=prior?.waived_units||0;
    const outstanding=target-recovered-waived;
    if(outstanding<0)fail('BILLING_REVERSAL_FUNDING_MISMATCH');
    let available:number,grant:any=null;
    if(p.kind==='subscription') {
      grant=db.prepare("SELECT * FROM managed_billing_grants WHERE id=? AND user_id=? AND source_id=? AND kind='subscription'").get(p.sourceId,hold.user_id,p.sourceKey);
      if(!grant || grant.amount_units!==p.originalUnits-(prior?.grant_recovered_units||0))fail('BILLING_REVERSAL_FUNDING_MISMATCH');
      available=Math.max(0,grant.amount_units-grant.spent_units);
    } else available=Math.floor(Math.max(0,getCredits(hold.user_id))*1_000_000_000);
    const recoverNow=Math.min(available,outstanding),shortfall=outstanding-recoverNow;
    const stableProof={...p};delete stableProof.checkedAt;
    const previewHash=hash({hold:[hold.id,hold.user_id,hold.kind,hold.provider_object_id,hold.source_event_id,hold.evidence_json],proof:stableProof,prior,available,grant:grant&&[grant.id,grant.amount_units,grant.spent_units,grant.held_units,grant.expires_at]});
    return {p,prior,grant,target,recoverNow,shortfall,available,previewHash,public:{holdId:hold.id,userId:hold.user_id,chargeId:p.chargeId,sourceKind:p.kind,sourceKey:p.sourceKey,currency:'USD',paidUsd:p.principalCents/100,returnedUsd:p.lossCents/100,originalCreditUsd:moneyUsd(p.originalUnits),targetReversalUsd:moneyUsd(target),alreadyRecoveredUsd:moneyUsd(recovered),alreadyWaivedUsd:moneyUsd(waived),recoverNowUsd:moneyUsd(recoverNow),shortfallUsd:moneyUsd(shortfall),availableAfterUsd:moneyUsd(available-recoverNow),previewHash,checkedAt:new Date(p.checkedAt).toISOString(),subscriptionExpired:Boolean(grant?.expires_at && grant.expires_at<=now()),policy:'proportional_credit_reversal_v1'}};
  };
  const preview = async (holdId:string) => {
    const hold=getHold(holdId),verified=await proof(hold);
    return atomic(()=>calculate(getHold(holdId),verified,hold).public);
  };
  const apply = async (holdId:string,actor:unknown,input:any) => {
    if(typeof actor!=='string'||!actor.trim())fail('BILLING_REVIEW_ACTOR_REQUIRED',400);
    if(typeof input?.evidence!=='string'||input.evidence.trim().length<8||input.evidence.length>4000)fail('BILLING_REVIEW_EVIDENCE_REQUIRED',400);
    if(!['recover_only','waive_shortfall'].includes(input.decision))fail('BILLING_REVIEW_DECISION_INVALID',400);
    if(typeof input.requestId!=='string'||!/^[a-zA-Z0-9_-]{16,128}$/.test(input.requestId)||typeof input.previewHash!=='string'||!/^[a-f0-9]{64}$/.test(input.previewHash))fail('BILLING_REVERSAL_REQUEST_INVALID',400);
    const inputHash=hash({holdId,actor,decision:input.decision,evidence:input.evidence.trim(),previewHash:input.previewHash});
    const reused=()=>{const r=db.prepare('SELECT * FROM billing_credit_reversal_reviews WHERE request_id=?').get(input.requestId);if(!r)return null;if(r.input_hash!==inputHash)fail('BILLING_REVERSAL_REQUEST_CONFLICT');return {...JSON.parse(r.result_json),reused:true};};
    const previous=reused();if(previous)return previous;
    const hold=getHold(holdId),verified=await proof(hold);
    return atomic(()=>{
      const duplicate=reused();if(duplicate)return duplicate;
      const current=getHold(holdId),calculated=calculate(current,verified,hold);
      if(calculated.previewHash!==input.previewHash)fail('BILLING_REVERSAL_PREVIEW_CHANGED');
      const {p,prior,target,recoverNow,shortfall}=calculated,waive=input.decision==='waive_shortfall'?shortfall:0;
      if(p.kind==='subscription' && recoverNow)db.prepare('UPDATE managed_billing_grants SET amount_units=amount_units-? WHERE id=? AND user_id=?').run(recoverNow,p.sourceId,current.user_id);
      if(p.kind==='topup' && recoverNow) {
        const before=getCredits(current.user_id);
        adjustCredits(current.user_id,-moneyUsd(recoverNow),'payment_reversal',`reversal:${input.requestId}`);
        if(Math.abs(before-getCredits(current.user_id)-moneyUsd(recoverNow))>0.0000000001)fail('BILLING_REVERSAL_DEBIT_MISMATCH');
      }
      db.prepare(`INSERT INTO billing_credit_reversals(charge_id,user_id,source_kind,source_id,source_key,original_units,principal_cents,loss_cents,target_units,grant_recovered_units,prepaid_recovered_units,unrecovered_units,waived_units,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(charge_id) DO UPDATE SET loss_cents=excluded.loss_cents,target_units=excluded.target_units,grant_recovered_units=excluded.grant_recovered_units,prepaid_recovered_units=excluded.prepaid_recovered_units,unrecovered_units=excluded.unrecovered_units,waived_units=excluded.waived_units,updated_at=excluded.updated_at`)
        .run(p.chargeId,current.user_id,p.kind,p.sourceId,p.sourceKey,p.originalUnits,p.principalCents,p.lossCents,target,(prior?.grant_recovered_units||0)+(p.kind==='subscription'?recoverNow:0),(prior?.prepaid_recovered_units||0)+(p.kind==='topup'?recoverNow:0),shortfall-waive,(prior?.waived_units||0)+waive,now());
      const resolved=shortfall===waive;
      if(resolved)db.prepare("UPDATE billing_account_holds SET state='resolved',resolved_at=datetime('now'),resolved_by=?,resolution_evidence=? WHERE id=? AND state='active'").run(actor,input.evidence.trim(),holdId);
      const restricted=Boolean(db.prepare("SELECT 1 FROM billing_account_holds WHERE user_id=? AND state='active' LIMIT 1").get(current.user_id));
      const result={...calculated.public,requestId:input.requestId,reused:false,decision:input.decision,recoveredUsd:moneyUsd(recoverNow),waivedUsd:moneyUsd(waive),remainingExposureUsd:moneyUsd(shortfall-waive),state:resolved?'resolved':'active',spendingRestricted:restricted};
      db.prepare('INSERT INTO billing_credit_reversal_reviews(request_id,hold_id,user_id,actor,input_hash,decision,evidence,proof_json,result_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(input.requestId,holdId,current.user_id,actor,inputHash,input.decision,input.evidence.trim(),JSON.stringify(p),JSON.stringify(result),now());
      db.prepare('INSERT INTO managed_billing_reviews(id,kind,subject,decision,actor,evidence,created_at) VALUES(?,?,?,?,?,?,?)').run(randomUUID(),'payment_reversal',holdId,input.decision,actor,input.evidence.trim()+`\nRecovered $${result.recoveredUsd}; waived $${result.waivedUsd}; remaining $${result.remainingExposureUsd}; receipt ${input.requestId}`,now());
      return result;
    });
  };
  return {preview,apply};
}
