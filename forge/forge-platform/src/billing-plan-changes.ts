import { randomUUID } from 'node:crypto';
import { MANAGED_PLANS } from './managed-billing';
import { BillingCheckoutError } from './billing-error';

type Db = { exec(sql: string): unknown; prepare(sql: string): any; transaction<T extends (...args: any[]) => any>(fn: T): T };
type Config = {
  db: Db; now: () => number; enabled: boolean; priceIds: Record<string, string>;
  stripe(path: string, body?: URLSearchParams, idempotencyKey?: string): Promise<any>;
  planFor(subscription: any): string;
  validatePrice(input: URLSearchParams): Promise<void>;
};
const id = (v: any): string => typeof v === 'string' ? v : typeof v?.id === 'string' ? v.id : '';
const fail = (code: string, status = 409, retryable = false): never => { throw new BillingCheckoutError(code, status, retryable); };
const iso = (seconds: number) => new Date(seconds * 1000).toISOString();
const activeStates = "('preparing','scheduled','withdrawing','review_required')";

/** Next-cycle changes only. No subscription creation, invoice, charge or credit
 * grant happens here. Stripe owns phase transitions; invoice.paid owns funding. */
export function createBillingPlanChanges(config: Config) {
  const { db, stripe, now } = config;
  const seconds = () => Math.floor(now() / 1000);
  db.exec(`
    CREATE TABLE IF NOT EXISTS billing_plan_change_previews (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), subscription_id TEXT NOT NULL,
      from_plan TEXT NOT NULL, to_plan TEXT NOT NULL, period_start INTEGER NOT NULL, effective_at INTEGER NOT NULL,
      monthly_cents INTEGER NOT NULL, included_usd REAL NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS billing_plan_changes (
      id TEXT PRIMARY KEY, preview_id TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL REFERENCES users(id), subscription_id TEXT NOT NULL,
      from_plan TEXT NOT NULL, to_plan TEXT NOT NULL, period_start INTEGER NOT NULL, effective_at INTEGER NOT NULL,
      state TEXT NOT NULL, schedule_id TEXT UNIQUE, update_body TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      lease_token TEXT, lease_until INTEGER NOT NULL DEFAULT 0, failure_code TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS billing_plan_change_active ON billing_plan_changes(subscription_id) WHERE state IN ${activeStates};
    CREATE INDEX IF NOT EXISTS billing_plan_change_owner ON billing_plan_changes(user_id,created_at);
  `);
  const current = (userId: string) => db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(userId);
  const operation = (userId: string, changeId: string) => {
    const row = db.prepare('SELECT * FROM billing_plan_changes WHERE user_id=? AND id=?').get(userId, changeId);
    if (!row) fail('PLAN_CHANGE_NOT_FOUND', 404);
    return row;
  };
  const latest = (userId: string, subscriptionId: string) => db.prepare('SELECT * FROM billing_plan_changes WHERE user_id=? AND subscription_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1').get(userId, subscriptionId);
  const policy = (plan: string) => {
    if (!['starter', 'pro', 'agency'].includes(plan) || !config.priceIds[plan]) fail('INVALID_PLAN', 400);
    return MANAGED_PLANS[plan as 'starter' | 'pro' | 'agency'];
  };
  const purchaseAllowed = (userId: string) => {
    if (!config.enabled) fail('PLAN_CHANGE_NOT_ENABLED', 503);
    if (db.prepare("SELECT 1 FROM billing_account_holds WHERE user_id=? AND state='active'").get(userId)) fail('BILLING_ACCOUNT_REVIEW_REQUIRED', 403);
  };
  const view = (row: any) => row ? { id: row.id, previewId: row.preview_id, fromPlan: row.from_plan, toPlan: row.to_plan, status: row.state,
    effectiveAt: iso(row.effective_at), monthlyUsd: policy(row.to_plan).monthlyUsd, includedUsd: policy(row.to_plan).includedUsd,
    canWithdraw: ['preparing', 'scheduled', 'withdrawing', 'review_required'].includes(row.state), retryable: row.state === 'preparing' } : null;
  const price = (plan: string) => config.validatePrice(new URLSearchParams({mode:'subscription', 'metadata[plan]':plan,
    'line_items[0][price]':config.priceIds[plan], 'line_items[0][quantity]':'1'}));
  async function subscription(userId: string) {
    const local = current(userId);
    if (!local?.stripe_subscription_id || !local.stripe_customer_id) fail('BILLING_SUBSCRIPTION_NOT_LINKED');
    const sub = await stripe(`/subscriptions/${encodeURIComponent(local.stripe_subscription_id)}`);
    if (id(sub) !== local.stripe_subscription_id || id(sub.customer) !== local.stripe_customer_id
      || (sub.metadata?.userId && sub.metadata.userId !== userId)) fail('STRIPE_SUBSCRIPTION_OWNER_MISMATCH');
    config.planFor(sub);
    return sub;
  }
  function period(sub: any) {
    const start = Number(sub.current_period_start || sub.items?.data?.[0]?.current_period_start);
    const end = Number(sub.current_period_end || sub.items?.data?.[0]?.current_period_end);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start <= 0 || end <= start) fail('INVOICE_PERIOD_INVALID');
    return { start, end };
  }
  async function eligible(userId: string, sub: any) {
    if (sub.status !== 'active' || sub.cancel_at_period_end || sub.cancel_at || sub.pause_collection || sub.pending_update) fail('PLAN_CHANGE_SUBSCRIPTION_INELIGIBLE');
    const p = period(sub), fromPlan = config.planFor(sub);
    if (p.end - seconds() <= 300) fail('PLAN_CHANGE_RENEWAL_IN_PROGRESS');
    // The current commercial product is one un-discounted USD monthly item.
    // Do not silently erase taxes, coupons, usage or marketplace routing.
    const item = sub.items.data[0];
    if (sub.collection_method !== 'charge_automatically' || sub.currency !== 'usd' || sub.automatic_tax?.enabled
      || sub.discount || sub.discounts?.length || sub.default_tax_rates?.length || item.discounts?.length || item.tax_rates?.length
      || sub.application_fee_percent || sub.transfer_data || sub.on_behalf_of || sub.trial_end && sub.trial_end > seconds()) fail('PLAN_CHANGE_CUSTOM_BILLING_UNSUPPORTED');
    const paid = db.prepare('SELECT paid_period_start,paid_plan FROM billing_subscription_state WHERE subscription_id=? AND user_id=?').get(sub.id, userId);
    if (paid?.paid_period_start !== p.start || paid.paid_plan !== fromPlan) fail('PLAN_CHANGE_PAYMENT_NOT_CONFIRMED');
    const invoiceId = id(sub.latest_invoice);
    if (!invoiceId) fail('PLAN_CHANGE_PAYMENT_NOT_CONFIRMED');
    const invoice = await stripe(`/invoices/${encodeURIComponent(invoiceId)}`);
    if (id(invoice) !== invoiceId || id(invoice.subscription || invoice.parent?.subscription_details?.subscription) !== sub.id
      || id(invoice.customer) !== id(sub.customer) || invoice.status !== 'paid' || invoice.currency !== 'usd'
      || !Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid < policy(fromPlan).monthlyUsd * 100) fail('PLAN_CHANGE_PAYMENT_NOT_CONFIRMED');
    return { ...p, fromPlan };
  }
  function checkSchedule(row: any, schedule: any) {
    const local = current(row.user_id);
    if (id(schedule) !== row.schedule_id || id(schedule.customer) !== local?.stripe_customer_id
      || id(schedule.subscription || schedule.released_subscription) !== row.subscription_id) fail('PLAN_CHANGE_SCHEDULE_MISMATCH');
    if (schedule.metadata?.forgePlanChangeId && schedule.metadata.forgePlanChangeId !== row.id) fail('PLAN_CHANGE_SCHEDULE_MISMATCH');
  }
  function matchesPhases(row: any, schedule: any) {
    const phases = schedule.phases;
    return schedule.metadata?.application === 'forge' && schedule.metadata?.forgePlanChangeId === row.id
      && schedule.end_behavior === 'release' && Array.isArray(phases) && phases.length === 2
      && phases[0].start_date === row.period_start && phases[0].end_date === row.effective_at && phases[1].start_date === row.effective_at
      && [0, 1].every(i => simplePhase(phases[i]) && phases[i].items?.length === 1 && id(phases[i].items[0].price) === config.priceIds[i ? row.to_plan : row.from_plan]
        && Number(phases[i].items[0].quantity) === 1 && phases[i].proration_behavior === 'none');
  }
  function simplePhase(phase: any) {
    return !phase.automatic_tax?.enabled && !phase.discounts?.length && !phase.default_tax_rates?.length && !phase.add_invoice_items?.length
      && !phase.application_fee_percent && !phase.transfer_data && !phase.on_behalf_of && !phase.billing_thresholds
      && (!phase.collection_method || phase.collection_method === 'charge_automatically')
      && !(phase.items || []).some((item: any) => item.discounts?.length || item.tax_rates?.length || item.billing_thresholds);
  }
  async function readSchedule(row: any) {
    const schedule = await stripe(`/subscription_schedules/${encodeURIComponent(row.schedule_id)}`);
    checkSchedule(row, schedule); return schedule;
  }
  function setState(row: any, state: string, lease?: string) {
    const result = db.prepare(`UPDATE billing_plan_changes SET state=?,updated_at=? WHERE id=? ${lease ? 'AND lease_token=?' : ''}`)
      .run(...[state, seconds(), row.id, ...(lease ? [lease] : [])]);
    if (result.changes !== 1) fail('PLAN_CHANGE_BUSY', 409, true);
    return operation(row.user_id, row.id);
  }
  async function leased<T>(row: any, work: (token: string) => Promise<T>): Promise<T> {
    const token = randomUUID();
    if (db.prepare('UPDATE billing_plan_changes SET lease_token=?,lease_until=? WHERE id=? AND lease_until<=?')
      .run(token, seconds()+300, row.id, seconds()).changes !== 1) fail('PLAN_CHANGE_BUSY', 409, true);
    try { return await work(token); }
    catch (error) {
      db.prepare('UPDATE billing_plan_changes SET failure_code=?,updated_at=? WHERE id=? AND lease_token=?')
        .run(error instanceof BillingCheckoutError ? error.code : 'PLAN_CHANGE_UNAVAILABLE', seconds(), row.id, token);
      throw error;
    } finally { db.prepare('UPDATE billing_plan_changes SET lease_token=NULL,lease_until=0 WHERE id=? AND lease_token=?').run(row.id, token); }
  }
  function fence(row: any, token: string) {
    if (db.prepare('UPDATE billing_plan_changes SET lease_until=? WHERE id=? AND lease_token=? AND lease_until>?')
      .run(seconds()+300, row.id, token, seconds()).changes !== 1) fail('PLAN_CHANGE_BUSY', 409, true);
  }
  async function recoverSchedule(row: any, token: string) {
    if (row.schedule_id) return readSchedule(row);
    if (seconds()-row.created_at >= 23*3600) fail('PLAN_CHANGE_RECONCILIATION_REQUIRED', 409, true);
    fence(row, token);
    const created = await stripe('/subscription_schedules', new URLSearchParams({from_subscription:row.subscription_id}), `forge-plan-create-${row.id}`);
    if (!/^sub_sched_[A-Za-z0-9]+$/.test(id(created))) fail('PLAN_CHANGE_SCHEDULE_MISMATCH');
    checkSchedule({...row, schedule_id:created.id}, created);
    fence(row, token);
    db.prepare('UPDATE billing_plan_changes SET schedule_id=? WHERE id=? AND lease_token=? AND schedule_id IS NULL').run(created.id,row.id,token);
    row.schedule_id=created.id;
    return readSchedule(row);
  }
  async function status(userId: string) {
    const local = current(userId);
    if (!local?.stripe_subscription_id) return { enabled:config.enabled, hasSubscription:false, change:null };
    let sub = await subscription(userId), p = period(sub);
    let row = latest(userId, sub.id);
    if (row?.schedule_id && ['preparing','scheduled','withdrawing','review_required'].includes(row.state) && row.lease_until <= seconds()) {
      // Reconciliation is a local write too. Serialize it with apply/withdraw so
      // an earlier provider read cannot resurrect a successfully withdrawn change.
      try {
        row = await leased(row, async token => {
          const currentRow = operation(userId,row.id);
          if (!['preparing','scheduled','withdrawing','review_required'].includes(currentRow.state)) return currentRow;
          const schedule = await readSchedule(currentRow);
          sub = await subscription(userId); p = period(sub);
          if (['released','completed','canceled'].includes(schedule.status)) {
            return setState(currentRow, schedule.status === 'canceled' ? 'cancelled' : config.planFor(sub) === currentRow.to_plan && p.start >= currentRow.effective_at ? 'applied' : 'withdrawn', token);
          }
          if (matchesPhases(currentRow,schedule)) return setState(currentRow, p.start >= currentRow.effective_at && config.planFor(sub) === currentRow.to_plan ? 'applied' : currentRow.state === 'withdrawing' ? 'withdrawing' : 'scheduled', token);
          return currentRow;
        });
      } catch (error) {
        if (!(error instanceof BillingCheckoutError) || error.code !== 'PLAN_CHANGE_BUSY') throw error;
        row = operation(userId,row.id);
      }
    }
    return { enabled:config.enabled, hasSubscription:true, currentPlan:local.plan, providerPlan:config.planFor(sub), periodEnd:iso(p.end),
      cancelAtPeriodEnd:Boolean(sub.cancel_at_period_end || sub.cancel_at), change:view(row) };
  }
  async function preview(userId: string, toPlan: string) {
    purchaseAllowed(userId); const target = policy(toPlan);
    const sub = await subscription(userId), p = await eligible(userId,sub);
    if (p.fromPlan === toPlan) fail('PLAN_CHANGE_ALREADY_CURRENT');
    const busy = db.prepare(`SELECT id FROM billing_plan_changes WHERE subscription_id=? AND state IN ${activeStates}`).get(sub.id);
    if (busy) fail('PLAN_CHANGE_ALREADY_PENDING');
    if (id(sub.schedule)) {
      const previous = latest(userId,sub.id);
      if (!previous || previous.schedule_id !== id(sub.schedule) || p.start < previous.effective_at || !matchesPhases(previous,await readSchedule(previous))) fail('PLAN_CHANGE_EXTERNAL_SCHEDULE');
    }
    await Promise.all([price(p.fromPlan),price(toPlan)]);
    const previewId = randomUUID(), expires = Math.min(seconds()+300,p.end-300);
    db.prepare('INSERT INTO billing_plan_change_previews VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .run(previewId,userId,sub.id,p.fromPlan,toPlan,p.start,p.end,target.monthlyUsd*100,target.includedUsd,expires,seconds());
    return { previewId, fromPlan:p.fromPlan, toPlan, effectiveAt:iso(p.end), expiresAt:iso(expires), monthlyUsd:target.monthlyUsd,
      includedUsd:target.includedUsd, chargeNowUsd:0, currentCreditsUnchanged:true, effectiveAfterPayment:true };
  }
  async function release(row: any, token: string) {
    const schedule = await recoverSchedule(row,token);
    if (schedule.status === 'released' || schedule.status === 'completed') return schedule;
    if (schedule.status !== 'active') fail('PLAN_CHANGE_SCHEDULE_MISMATCH');
    // Own the exact created schedule; never cancel a subscription to withdraw a change.
    if (schedule.metadata?.forgePlanChangeId && !matchesPhases(row,schedule)) fail('PLAN_CHANGE_SCHEDULE_MISMATCH');
    fence(row,token);
    try { await stripe(`/subscription_schedules/${encodeURIComponent(row.schedule_id)}/release`,new URLSearchParams({preserve_cancel_date:'true'}),`forge-plan-release-${row.id}`); }
    catch { /* Resolve a lost response or a concurrent provider transition by reading it back. */ }
    const closed = await readSchedule(row);
    if (!['released','completed'].includes(closed.status)) fail('PLAN_CHANGE_WITHDRAWAL_UNCONFIRMED',409,true);
    return closed;
  }
  async function preparePortal(userId: string) {
    const sub=await subscription(userId);
    if (!id(sub.schedule)) return;
    const row=latest(userId,sub.id);
    if (!row || row.schedule_id!==id(sub.schedule)) fail('PLAN_CHANGE_EXTERNAL_SCHEDULE');
    if (period(sub).start < row.effective_at) fail('PLAN_CHANGE_WITHDRAW_BEFORE_MANAGING');
    await leased(row,async token=>{const schedule=await readSchedule(row);if(!matchesPhases(row,schedule))fail('PLAN_CHANGE_SCHEDULE_MISMATCH');await release(row,token);setState(row,'applied',token);});
  }
  async function apply(userId: string, previewId: string) {
    purchaseAllowed(userId);
    let row=db.prepare('SELECT * FROM billing_plan_changes WHERE user_id=? AND preview_id=?').get(userId,previewId);
    if (!row) {
      const quote=db.prepare('SELECT * FROM billing_plan_change_previews WHERE user_id=? AND id=?').get(userId,previewId);
      if(!quote)fail('PLAN_CHANGE_PREVIEW_NOT_FOUND',404);
      if(quote.expires_at<=seconds())fail('PLAN_CHANGE_PREVIEW_EXPIRED');
      const sub=await subscription(userId),p=await eligible(userId,sub),target=policy(quote.to_plan);
      if(sub.id!==quote.subscription_id || p.start!==quote.period_start || p.end!==quote.effective_at || p.fromPlan!==quote.from_plan
        || target.monthlyUsd*100!==quote.monthly_cents || target.includedUsd!==quote.included_usd)fail('PLAN_CHANGE_PREVIEW_STALE');
      if(id(sub.schedule))await preparePortal(userId);
      row=db.transaction(()=>{
        const existing=db.prepare('SELECT * FROM billing_plan_changes WHERE user_id=? AND preview_id=?').get(userId,previewId);
        if(existing)return existing;
        if(db.prepare(`SELECT id FROM billing_plan_changes WHERE subscription_id=? AND state IN ${activeStates}`).get(sub.id))fail('PLAN_CHANGE_ALREADY_PENDING');
        const changeId=randomUUID();
        db.prepare("INSERT INTO billing_plan_changes(id,preview_id,user_id,subscription_id,from_plan,to_plan,period_start,effective_at,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'preparing',?,?)")
          .run(changeId,previewId,userId,sub.id,quote.from_plan,quote.to_plan,p.start,p.end,seconds(),seconds());
        return operation(userId,changeId);
      })();
    }
    if(['withdrawn','applied','cancelled','withdrawing'].includes(row.state))fail('PLAN_CHANGE_ALREADY_CLOSED');
    return leased(row,async token=>{
      row=operation(userId,row.id);
      let sub=await subscription(userId);
      if(row.state==='scheduled'){
        const existing=await readSchedule(row);
        if(existing.status!=='active' || !matchesPhases(row,existing) || period(sub).start>=row.effective_at)fail('PLAN_CHANGE_ALREADY_CLOSED');
        return view(row);
      }
      const p=await eligible(userId,sub);
      if(sub.id!==row.subscription_id || p.start!==row.period_start || p.end!==row.effective_at || p.fromPlan!==row.from_plan)fail('PLAN_CHANGE_PREVIEW_STALE');
      await Promise.all([price(row.from_plan),price(row.to_plan)]);
      if(id(sub.schedule) && row.schedule_id && id(sub.schedule)!==row.schedule_id)fail('PLAN_CHANGE_EXTERNAL_SCHEDULE');
      let schedule=await recoverSchedule(row,token);
      if(matchesPhases(row,schedule))return view(setState(row,'scheduled',token));
      if(schedule.status!=='active' || schedule.phases?.length!==1 || !simplePhase(schedule.phases[0]) || schedule.current_phase?.start_date!==row.period_start
        || schedule.phases[0]?.items?.length!==1 || id(schedule.phases[0].items[0].price)!==config.priceIds[row.from_plan])fail('PLAN_CHANGE_SCHEDULE_MISMATCH');
      sub=await subscription(userId);
      if(sub.cancel_at_period_end || sub.cancel_at || sub.status!=='active' || period(sub).end!==row.effective_at)fail('PLAN_CHANGE_SUBSCRIPTION_INELIGIBLE');
      if(!row.update_body){
        const body=new URLSearchParams({end_behavior:'release',proration_behavior:'none','metadata[application]':'forge','metadata[forgePlanChangeId]':row.id,
          'phases[0][start_date]':String(row.period_start),'phases[0][end_date]':String(row.effective_at),'phases[0][items][0][price]':config.priceIds[row.from_plan],
          'phases[0][items][0][quantity]':'1','phases[0][proration_behavior]':'none','phases[1][start_date]':String(row.effective_at),
          'phases[1][duration][interval]':'month','phases[1][duration][interval_count]':'1','phases[1][items][0][price]':config.priceIds[row.to_plan],
          'phases[1][items][0][quantity]':'1','phases[1][proration_behavior]':'none','phases[1][metadata][plan]':row.to_plan,'phases[1][metadata][userId]':userId});
        fence(row,token);db.prepare('UPDATE billing_plan_changes SET update_body=? WHERE id=? AND lease_token=?').run(body.toString(),row.id,token);row.update_body=body.toString();
      }
      fence(row,token);
      try {await stripe(`/subscription_schedules/${encodeURIComponent(row.schedule_id)}`,new URLSearchParams(row.update_body),`forge-plan-update-${row.id}`);}
      catch { /* Read back before claiming either failure or success. */ }
      schedule=await readSchedule(row);
      if(!matchesPhases(row,schedule))fail('PLAN_CHANGE_CONFIRMATION_PENDING',409,true);
      return view(setState(row,'scheduled',token));
    });
  }
  async function withdraw(userId: string, changeId: string) {
    // Withdrawing a future change remains available during payment review or feature suspension.
    let row=operation(userId,changeId);
    if(row.state==='withdrawn')return view(row);
    return leased(row,async token=>{
      row=operation(userId,changeId);
      const before=await subscription(userId);
      if(before.id!==row.subscription_id)fail('PLAN_CHANGE_SCHEDULE_MISMATCH');
      if(id(before.schedule) && row.schedule_id && id(before.schedule)!==row.schedule_id)fail('PLAN_CHANGE_EXTERNAL_SCHEDULE');
      setState(row,'withdrawing',token);await release(row,token);
      const after=await subscription(userId),p=period(after);
      if(id(after.schedule))fail('PLAN_CHANGE_WITHDRAWAL_UNCONFIRMED',409,true);
      return view(setState(row,p.start>=row.effective_at && config.planFor(after)===row.to_plan?'applied':'withdrawn',token));
    });
  }
  /** Local read for lightweight clients (desktop account panel). No provider call;
   * reconciliation still happens through status(). */
  const scheduled = (userId: string) => {
    const local = current(userId);
    if (!config.enabled || !local?.stripe_subscription_id) return null;
    return view(db.prepare(`SELECT * FROM billing_plan_changes WHERE user_id=? AND subscription_id=? AND state IN ${activeStates} ORDER BY created_at DESC,rowid DESC LIMIT 1`).get(userId, local.stripe_subscription_id));
  };
  return { status, preview, apply, withdraw, preparePortal, scheduled };
}
