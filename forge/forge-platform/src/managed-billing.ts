import crypto from 'node:crypto';
import { getOpenRouterModel, isFreeOpenRouterModel, OPENROUTER_RETAIL_MULTIPLIER } from './openrouter-catalog';

type Database = { exec(sql: string): unknown; prepare(sql: string): any; transaction<T extends (...args: any[]) => any>(fn: T): T };
export const MANAGED_BILLING_VERSION = 'openrouter-cost-plus-2026-09-14';
export const RETAIL_MULTIPLIER = OPENROUTER_RETAIL_MULTIPLIER;
export const RETAIL_MULTIPLIER_BPS = RETAIL_MULTIPLIER * 10_000;
if (!Number.isSafeInteger(RETAIL_MULTIPLIER_BPS) || RETAIL_MULTIPLIER_BPS <= 0 || RETAIL_MULTIPLIER_BPS > 100_000) throw new Error('BILLING_MULTIPLIER_INVALID');
export const MANAGED_MIN_TOPUP_USD = 20;
export const MANAGED_PLANS = Object.freeze({
  free: { monthlyUsd: 0, includedUsd: 0, trialUsd: 0.10 },
  starter: { monthlyUsd: 29, includedUsd: 20, trialUsd: 0 },
  pro: { monthlyUsd: 99, includedUsd: 75, trialUsd: 0 },
  agency: { monthlyUsd: 299, includedUsd: 200, trialUsd: 0 },
});
const SCALE = 1_000_000_000;
function scaledMoney(value: number | string, multiplierBps: number): number {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) ||
    (typeof value === 'string' && !/^\d+(?:\.\d+)?$/.test(value)) || String(value).length > 128 ||
    !Number.isSafeInteger(multiplierBps) || multiplierBps < 0 || multiplierBps > 100_000) {
    throw new ManagedBillingError('BILLING_AMOUNT_INVALID', 400);
  }
  // Decimal strings and JS numbers' decimal serialization avoid a binary float
  // making an exact cent one nanodollar larger. Round once, after the markup.
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(value));
  if (!match) throw new ManagedBillingError('BILLING_AMOUNT_INVALID', 400);
  const digits = BigInt(match[1] + (match[2] || ''));
  const exponent = Number(match[3] || 0) - (match[2] || '').length;
  const numerator = digits * (exponent > 0 ? 10n ** BigInt(exponent) : 1n);
  const denominator = exponent < 0 ? 10n ** BigInt(-exponent) : 1n;
  if (numerator > 1_000_000n * denominator) throw new ManagedBillingError('BILLING_AMOUNT_INVALID', 400);
  const scaledNumerator = numerator * BigInt(SCALE) * BigInt(multiplierBps);
  const scaledDenominator = denominator * 10_000n;
  return Number((scaledNumerator + scaledDenominator - 1n) / scaledDenominator);
}
export const moneyUnits = (value: number | string) => scaledMoney(value, 10_000);
export const moneyUsd = (units: number) => units / SCALE;
export const retailUnits = (providerUsd: number | string) => scaledMoney(providerUsd, RETAIL_MULTIPLIER_BPS);
export class ManagedBillingError extends Error {
  constructor(public code: string, public statusCode = 409) { super(code); }
}
const fail = (code: string, status = 409): never => { throw new ManagedBillingError(code, status); };
type Allocation = { grantId: string; units: number };
type Deps = { db: Database; getCredits(userId: string): number; adjustCredits(userId: string, delta: number, reason: string, source?: string): unknown; now?: () => number; trialDailyBudgetUsd?: number; verifyPaymentHold?: (hold: any) => Promise<any> };

/** Monetary admission and settlement. Existing purchased credits are preserved;
 * monthly usage allowances are separate expiring grants, never free raw tokens.
 * Every reservation is durable and charged only from a provider cost receipt. */
export function createManagedBilling({ db, getCredits, adjustCredits, verifyPaymentHold, now = Date.now, trialDailyBudgetUsd = Number(process.env.FORGE_DAILY_TRIAL_BUDGET_USD ?? 10) }: Deps) {
  const trialDailyBudgetUnits = moneyUnits(trialDailyBudgetUsd);
  db.exec(`
    CREATE TABLE IF NOT EXISTS managed_billing_accounts (user_id TEXT PRIMARY KEY, policy_version TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS managed_billing_grants (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, plan TEXT NOT NULL, amount_units INTEGER NOT NULL, spent_units INTEGER NOT NULL DEFAULT 0, held_units INTEGER NOT NULL DEFAULT 0, starts_at INTEGER NOT NULL, expires_at INTEGER, source_id TEXT NOT NULL UNIQUE);
    CREATE INDEX IF NOT EXISTS managed_grants_owner ON managed_billing_grants(user_id,expires_at);
    CREATE INDEX IF NOT EXISTS managed_grants_daily ON managed_billing_grants(kind,starts_at);
    CREATE TABLE IF NOT EXISTS managed_billing_requests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, model TEXT NOT NULL, tariff_version TEXT NOT NULL, retail_multiplier_bps INTEGER NOT NULL DEFAULT 12500, state TEXT NOT NULL, reserved_units INTEGER NOT NULL, prepaid_units INTEGER NOT NULL, allocations TEXT NOT NULL, provider_cost_units INTEGER, charged_units INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS managed_requests_owner ON managed_billing_requests(user_id,state);
    CREATE TABLE IF NOT EXISTS managed_billing_circuits (model TEXT PRIMARY KEY, reason TEXT NOT NULL, request_id TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS managed_billing_reviews (id TEXT PRIMARY KEY, kind TEXT NOT NULL, subject TEXT NOT NULL, decision TEXT NOT NULL, actor TEXT NOT NULL, evidence TEXT NOT NULL, created_at INTEGER NOT NULL);
  `);
  if (!db.prepare('PRAGMA table_info(managed_billing_requests)').all().some((column: any) => column.name === 'retail_multiplier_bps')) {
    db.exec('ALTER TABLE managed_billing_requests ADD COLUMN retail_multiplier_bps INTEGER NOT NULL DEFAULT 12500');
  }
  // Acquire SQLite's writer reservation before reading balances. Concurrent
  // processes then re-read the committed holds instead of upgrading stale reads.
  const atomic = <T extends (...args: any[]) => any>(fn: T): T => {
    const transaction = db.transaction(fn) as T & { immediate?: T };
    return transaction.immediate || transaction;
  };
  const owner = (userId: string) => {
    if (!db.prepare('SELECT id FROM users WHERE id=?').get(userId)) fail('AUTHENTICATION_REQUIRED', 401);
    return db.prepare('SELECT plan,status,period_end FROM subscriptions WHERE user_id=?').get(userId) || { plan: 'free', status: 'active' };
  };
  const initialize = (userId: string) => {
    const sub = owner(userId);
    const inserted = db.prepare('INSERT OR IGNORE INTO managed_billing_accounts(user_id,policy_version,created_at) VALUES(?,?,?)').run(userId, MANAGED_BILLING_VERSION, now());
    // One bounded acquisition allowance, not an automatically recurring grant.
    // Paid legacy accounts receive no invented invoice or new monthly grant.
    const trialUnits = moneyUnits(MANAGED_PLANS.free.trialUsd);
    const dayStart = Math.floor(now() / 86400000) * 86400000;
    const grantedToday = Number(db.prepare("SELECT COALESCE(SUM(amount_units),0) n FROM managed_billing_grants WHERE kind='trial' AND starts_at>=? AND starts_at<?").get(dayStart, dayStart + 86400000).n);
    // A persistent global acquisition budget bounds losses from mass signups.
    // This is not proof of a unique person; unavailable trials are not promised.
    if (inserted.changes && sub.plan === 'free' && grantedToday + trialUnits <= trialDailyBudgetUnits) {
      db.prepare('INSERT OR IGNORE INTO managed_billing_grants(id,user_id,kind,plan,amount_units,starts_at,expires_at,source_id) VALUES(?,?,?,?,?,?,?,?)')
        .run(`trial:${userId}`, userId, 'trial', 'free', moneyUnits(MANAGED_PLANS.free.trialUsd), now(), now() + 30 * 86400000, `trial:${userId}`);
    }
    return sub;
  };
  const activeGrants = (userId: string) => db.prepare('SELECT * FROM managed_billing_grants WHERE user_id=? AND starts_at<=? AND (expires_at IS NULL OR expires_at>?) ORDER BY CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END,expires_at,id').all(userId, now(), now());
  const heldPrepaid = (userId: string) => Number(db.prepare("SELECT COALESCE(SUM(prepaid_units),0) n FROM managed_billing_requests WHERE user_id=? AND state IN ('pending','unknown','review_required')").get(userId).n);
  const paymentReview = (userId: string) => Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='billing_account_holds'").get()
    && db.prepare("SELECT 1 FROM billing_account_holds WHERE user_id=? AND state='active' LIMIT 1").get(userId));
  const legacyExposure = (userId: string) => {
    // Pre-upgrade pending requests still reserve money; their absence from the
    // new request table must not turn an old unsettled request into free credit.
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pi_provider_receipts'").get();
    if (!exists) return 0;
    const rows = db.prepare("SELECT p.held_cost_usd,p.effective_receipt FROM pi_provider_receipts p LEFT JOIN managed_billing_requests m ON m.id=p.request_id WHERE p.user_id=? AND p.usage_status IN ('pending','unknown') AND m.id IS NULL").all(userId);
    let total = 0;
    for (const row of rows) {
      let receipt: any;
      try { receipt = JSON.parse(row.effective_receipt); } catch { fail('BILLING_LEGACY_USAGE_REVIEW_REQUIRED'); }
      if (receipt?.reservation?.costUsd === undefined || !Number.isFinite(row.held_cost_usd) || row.held_cost_usd < 0) fail('BILLING_LEGACY_USAGE_REVIEW_REQUIRED');
      // Old receipts mixed native and retail estimates. The conservative 1.25x
      // hold is deliberate; only an audited legacy settlement can remove it.
      total += retailUnits(row.held_cost_usd);
    }
    return total;
  };
  const snapshot = atomic((userId: string) => {
    const sub = initialize(userId), grants = activeGrants(userId);
    const prepaid = moneyUnits(Math.max(0, getCredits(userId)));
    const legacyHeld = legacyExposure(userId), prepaidHeld = heldPrepaid(userId);
    const included = grants.reduce((sum: number, row: any) => sum + Math.max(0, row.amount_units - row.spent_units - row.held_units), 0);
    const pending = Number(db.prepare("SELECT COALESCE(SUM(reserved_units),0) n FROM managed_billing_requests WHERE user_id=? AND state IN ('pending','unknown','review_required')").get(userId).n);
    const spent = grants.reduce((sum: number, row: any) => sum + row.spent_units, 0);
    const hasPaidAllowance = grants.some((row: any) => row.kind === 'subscription' && row.amount_units > row.spent_units + row.held_units);
    const available = Math.max(0, included + prepaid - prepaidHeld - legacyHeld);
    const spendingRestricted = paymentReview(userId);
    return { policyVersion: MANAGED_BILLING_VERSION, currency: 'USD' as const, markupMultiplier: RETAIL_MULTIPLIER,
      spendingRestricted, ...(spendingRestricted ? { restrictionReason: 'payment_review' as const } : {}),
      availableUsd: moneyUsd(available), includedRemainingUsd: moneyUsd(included), includedUsedUsd: moneyUsd(spent), prepaidBalanceUsd: moneyUsd(prepaid),
      pendingUsd: moneyUsd(pending + legacyHeld), trialOnly: !hasPaidAllowance && prepaid <= prepaidHeld + legacyHeld,
      legacyPlanReviewRequired: sub.plan !== 'free' && !grants.some((row: any) => row.kind === 'subscription'),
      grants: grants.map((row: any) => ({ kind: row.kind, plan: row.plan, allowanceUsd: moneyUsd(row.amount_units), usedUsd: moneyUsd(row.spent_units), pendingUsd: moneyUsd(row.held_units), expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null })) };
  });
  const grantSubscription = atomic((userId: string, plan: string, sourceId: string, startsAt: number, expiresAt: number) => {
    owner(userId);
    const policy = MANAGED_PLANS[plan as keyof typeof MANAGED_PLANS];
    if (!policy?.includedUsd || !sourceId || !Number.isSafeInteger(startsAt) || !Number.isSafeInteger(expiresAt) || expiresAt <= startsAt) fail('BILLING_GRANT_INVALID', 400);
    db.prepare('INSERT OR IGNORE INTO managed_billing_accounts(user_id,policy_version,created_at) VALUES(?,?,?)').run(userId, MANAGED_BILLING_VERSION, now());
    const existing = db.prepare('SELECT * FROM managed_billing_grants WHERE source_id=?').get(sourceId);
    if (existing) {
      if (existing.user_id !== userId || existing.plan !== plan || existing.starts_at !== startsAt || existing.expires_at !== expiresAt) fail('BILLING_GRANT_CONFLICT');
      return false;
    }
    const period = db.prepare("SELECT * FROM managed_billing_grants WHERE user_id=? AND kind='subscription' AND starts_at<? AND expires_at>?").all(userId, expiresAt, startsAt);
    if (period.length) {
      const reversal = period.length === 1 && db.prepare("SELECT name FROM sqlite_master WHERE name='billing_credit_reversals'").get()
        ? db.prepare("SELECT original_units FROM billing_credit_reversals WHERE source_kind='subscription' AND source_id=?").get(period[0].id) : null;
      if (period.length === 1 && period[0].plan === plan && period[0].starts_at === startsAt && period[0].expires_at === expiresAt && (reversal?.original_units ?? period[0].amount_units) === moneyUnits(policy.includedUsd)) return false;
      // An upgrade needs an explicitly computed prorated allowance, not a second
      // full monthly allowance triggered by another payment event identifier.
      fail('BILLING_GRANT_PERIOD_CONFLICT');
    }
    db.prepare('INSERT INTO managed_billing_grants(id,user_id,kind,plan,amount_units,starts_at,expires_at,source_id) VALUES(?,?,?,?,?,?,?,?)')
      .run(crypto.randomUUID(), userId, 'subscription', plan, moneyUnits(policy.includedUsd), startsAt, expiresAt, sourceId);
    return true;
  });
  const reserve = atomic((userId: string, requestId: string, model: string, providerMaximumUsd: number, tariffVersion: string) => {
    const existing = db.prepare('SELECT * FROM managed_billing_requests WHERE id=?').get(requestId);
    const units = retailUnits(providerMaximumUsd);
    // A zero hold is valid only for a catalogued zero-price model. If its supplier
    // later reports a cost, settlement trips the existing price-review circuit.
    if ((!units && !isFreeOpenRouterModel(model)) || !requestId || !model || !tariffVersion) fail('BILLING_RESERVATION_INVALID', 400);
    if (existing) {
      if (existing.user_id !== userId || existing.model !== model || existing.reserved_units !== units || existing.tariff_version !== tariffVersion) fail('BILLING_REQUEST_CONFLICT');
      return existing;
    }
    if (db.prepare('SELECT model FROM managed_billing_circuits WHERE model=?').get(model)) fail('BILLING_MODEL_PRICE_REVIEW_REQUIRED', 503);
    const state = snapshot(userId);
    if (state.spendingRestricted) fail('BILLING_ACCOUNT_REVIEW_REQUIRED', 403);
    if (state.trialOnly && getOpenRouterModel(model)?.tier !== 'lightweight') fail('BILLING_TRIAL_MODEL_RESTRICTED', 403);
    if (moneyUnits(state.availableUsd) < units) fail('BILLING_INSUFFICIENT_FUNDS', 402);
    let remaining = units; const allocations: Allocation[] = [];
    for (const row of activeGrants(userId)) {
      const amount = Math.min(remaining, Math.max(0, row.amount_units - row.spent_units - row.held_units));
      if (amount) {
        allocations.push({ grantId: row.id, units: amount });
        db.prepare('UPDATE managed_billing_grants SET held_units=held_units+? WHERE id=?').run(amount, row.id);
        remaining -= amount;
      }
      if (!remaining) break;
    }
    db.prepare('INSERT INTO managed_billing_requests(id,user_id,model,tariff_version,retail_multiplier_bps,state,reserved_units,prepaid_units,allocations,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .run(requestId, userId, model, tariffVersion, RETAIL_MULTIPLIER_BPS, 'pending', units, remaining, JSON.stringify(allocations), now(), now());
    return db.prepare('SELECT * FROM managed_billing_requests WHERE id=?').get(requestId);
  });
  const applyCharge = (userId: string, requestId: string, row: any, finalCharge: number) => {
    let remaining = finalCharge;
    for (const allocation of JSON.parse(row.allocations) as Allocation[]) {
      const spent = Math.min(remaining, allocation.units);
      db.prepare('UPDATE managed_billing_grants SET held_units=held_units-?,spent_units=spent_units+? WHERE id=? AND user_id=?').run(allocation.units, spent, allocation.grantId, userId);
      remaining -= spent;
    }
    if (remaining) {
      if (moneyUnits(Math.max(0, getCredits(userId))) < remaining) fail('BILLING_PREPAID_RECONCILIATION_REQUIRED');
      adjustCredits(userId, -moneyUsd(remaining), `managed_usage_${requestId}`, `managed:${requestId}`);
    }
  };
  const settle = atomic((userId: string, requestId: string, result: { providerCostUsd?: number; notCharged?: boolean }) => {
    owner(userId);
    const row = db.prepare('SELECT * FROM managed_billing_requests WHERE id=? AND user_id=?').get(requestId, userId);
    if (!row) fail('BILLING_REQUEST_NOT_FOUND', 404);
    if (!result || typeof result !== 'object' || (result.notCharged !== undefined && typeof result.notCharged !== 'boolean')) fail('BILLING_SETTLEMENT_INVALID', 400);
    if (result.notCharged && result.providerCostUsd !== undefined && moneyUnits(result.providerCostUsd) !== 0) fail('BILLING_SETTLEMENT_CONFLICT');
    const cost = result.notCharged ? 0 : result.providerCostUsd;
    const charged = cost === undefined ? undefined : scaledMoney(cost, row.retail_multiplier_bps);
    if (row.state === 'settled' || row.state === 'released') {
      // An operator may have closed an overrun at the approved ceiling; the same
      // supplier receipt arriving again is then a duplicate, not a conflict.
      const cappedByOperator = charged !== undefined && charged > row.reserved_units && row.charged_units === row.reserved_units;
      if (cost !== undefined && (moneyUnits(cost) !== row.provider_cost_units || (charged !== row.charged_units && !cappedByOperator))) fail('BILLING_SETTLEMENT_CONFLICT');
      return { chargedUsd: moneyUsd(row.charged_units), providerCostUsd: moneyUsd(row.provider_cost_units), reused: true, state: row.state };
    }
    if (row.state === 'review_required') {
      if (cost !== undefined && moneyUnits(cost) !== row.provider_cost_units) fail('BILLING_SETTLEMENT_CONFLICT');
      return { chargedUsd: 0, providerCostUsd: moneyUsd(row.provider_cost_units), state: 'review_required', reused: true };
    }
    if (cost === undefined) {
      db.prepare("UPDATE managed_billing_requests SET state='unknown',updated_at=? WHERE id=?").run(now(), requestId);
      return { chargedUsd: 0, state: 'unknown', reused: false };
    }
    const providerUnits = moneyUnits(cost), finalCharge = charged!;
    if (finalCharge > row.reserved_units) {
      // Never charge more than the approved ceiling or silently discard a
      // supplier overrun. Stop this route until its tariff is reviewed.
      db.prepare("UPDATE managed_billing_requests SET state='review_required',provider_cost_units=?,updated_at=? WHERE id=?").run(providerUnits, now(), requestId);
      db.prepare('INSERT OR IGNORE INTO managed_billing_circuits(model,reason,request_id,created_at) VALUES(?,?,?,?)').run(row.model, 'provider_cost_exceeded_reservation', requestId, now());
      return { chargedUsd: 0, state: 'review_required', reused: false };
    }
    applyCharge(userId, requestId, row, finalCharge);
    const state = result.notCharged ? 'released' : 'settled';
    db.prepare('UPDATE managed_billing_requests SET state=?,provider_cost_units=?,charged_units=?,updated_at=? WHERE id=?').run(state, providerUnits, finalCharge, now(), requestId);
    return { chargedUsd: moneyUsd(finalCharge), providerCostUsd: moneyUsd(providerUnits), state, reused: false };
  });
  const history = (userId: string) => { owner(userId); return db.prepare('SELECT id,model,state,tariff_version,provider_cost_units,charged_units,reserved_units,created_at FROM managed_billing_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(userId).map((row: any) => ({ requestId: row.id, model: row.model, state: row.state, tariffVersion: row.tariff_version, providerCostUsd: row.provider_cost_units == null ? null : moneyUsd(row.provider_cost_units), chargeUsd: row.charged_units == null ? null : moneyUsd(row.charged_units), reservedUsd: moneyUsd(row.reserved_units), createdAt: new Date(row.created_at).toISOString() })); };
  // ── Operator review ──────────────────────────────────────────────────────
  // Payment holds, tripped model circuits and over-reservation requests stop
  // money movement until a named operator records a decision with evidence.
  // Nothing here creates a charge above the customer's approved ceiling.
  const evidenceText = (evidence: unknown) => {
    if (typeof evidence !== 'string' || evidence.trim().length < 8 || evidence.length > 4000) fail('BILLING_REVIEW_EVIDENCE_REQUIRED', 400);
    return evidence.trim();
  };
  const actorId = (actor: unknown) => {
    if (typeof actor !== 'string' || !actor.trim()) fail('BILLING_REVIEW_ACTOR_REQUIRED', 400);
    return actor.trim();
  };
  const audit = (kind: string, subject: string, decision: string, actor: string, evidence: string) =>
    db.prepare('INSERT INTO managed_billing_reviews(id,kind,subject,decision,actor,evidence,created_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(), kind, subject, decision, actor, evidence, now());
  const holdsTable = () => Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='billing_account_holds'").get());
  const requestView = (row: any) => ({ requestId: row.id, userId: row.user_id, model: row.model, state: row.state, reservedUsd: moneyUsd(row.reserved_units),
    providerCostUsd: row.provider_cost_units == null ? null : moneyUsd(row.provider_cost_units), chargeUsd: row.charged_units == null ? null : moneyUsd(row.charged_units),
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString() });
  const operations = () => {
    const holds = holdsTable() ? db.prepare("SELECT id,user_id,kind,provider_object_id,evidence_json,created_at FROM billing_account_holds WHERE state='active' ORDER BY created_at").all()
      .map((row: any) => ({ id: row.id, userId: row.user_id, kind: row.kind, providerObjectId: row.provider_object_id, evidence: JSON.parse(row.evidence_json), createdAt: row.created_at })) : [];
    const circuits = db.prepare('SELECT c.*, (SELECT COUNT(*) FROM managed_billing_requests r WHERE r.model=c.model AND r.state=\'review_required\') unresolved FROM managed_billing_circuits c ORDER BY created_at').all()
      .map((row: any) => ({ model: row.model, reason: row.reason, requestId: row.request_id, unresolvedRequests: Number(row.unresolved), createdAt: new Date(row.created_at).toISOString() }));
    const reviewRequests = db.prepare("SELECT * FROM managed_billing_requests WHERE state='review_required' ORDER BY created_at").all().map(requestView);
    // Unknown requests wait for the supplier receipt; only stale ones need a person.
    const staleUnknown = db.prepare("SELECT * FROM managed_billing_requests WHERE state='unknown' AND updated_at<? ORDER BY created_at").all(now() - 6 * 3600000).map(requestView);
    const recentDecisions = db.prepare('SELECT * FROM managed_billing_reviews ORDER BY created_at DESC, rowid DESC LIMIT 50').all()
      .map((row: any) => ({ id: row.id, kind: row.kind, subject: row.subject, decision: row.decision, actor: row.actor, evidence: row.evidence, createdAt: new Date(row.created_at).toISOString() }));
    return { holds, circuits, reviewRequests, staleUnknownRequests: staleUnknown, recentDecisions, openItems: holds.length + circuits.length + reviewRequests.length + staleUnknown.length };
  };
  const resolveHold = async (holdId: string, actor: unknown, evidence: unknown) => {
    if (!holdsTable()) fail('BILLING_HOLD_NOT_FOUND', 404);
    const admin = actorId(actor), text = evidenceText(evidence);
    const row = db.prepare('SELECT * FROM billing_account_holds WHERE id=?').get(holdId);
    if (!row) fail('BILLING_HOLD_NOT_FOUND', 404);
    if (row.state !== 'active') fail('BILLING_HOLD_ALREADY_RESOLVED');
    if (!verifyPaymentHold) fail('BILLING_HOLD_VERIFICATION_REQUIRED');
    const verification = await verifyPaymentHold({...row});
    if (verification?.decision !== 'payment_retained' || verification.holdId !== row.id || verification.userId !== row.user_id || !Number.isSafeInteger(verification.checkedAt) || verification.checkedAt > now() || now() - verification.checkedAt > 30000) fail('BILLING_HOLD_VERIFICATION_REQUIRED');
    return atomic(() => {
      const current = db.prepare('SELECT * FROM billing_account_holds WHERE id=?').get(holdId);
      if (!current || current.state !== 'active') fail('BILLING_HOLD_ALREADY_RESOLVED');
      for (const field of ['user_id','kind','provider_object_id','source_event_id','evidence_json']) if (current[field] !== row[field]) fail('BILLING_HOLD_CHANGED');
      const recorded = text + '\nStripe verification: ' + JSON.stringify(verification);
      db.prepare("UPDATE billing_account_holds SET state='resolved',resolved_at=datetime('now'),resolved_by=?,resolution_evidence=? WHERE id=? AND state='active'").run(admin, recorded, holdId);
      audit('hold', holdId, 'payment_retained', admin, recorded);
      return { id: holdId, userId: row.user_id, state: 'resolved', spendingRestricted: paymentReview(row.user_id), verification };
    })();
  };
  const resolveReview = atomic((requestId: string, decision: unknown, actor: unknown, evidence: unknown) => {
    const admin = actorId(actor), text = evidenceText(evidence);
    if (decision !== 'charge_ceiling' && decision !== 'waive') fail('BILLING_REVIEW_DECISION_INVALID', 400);
    const row = db.prepare('SELECT * FROM managed_billing_requests WHERE id=?').get(requestId);
    if (!row) fail('BILLING_REQUEST_NOT_FOUND', 404);
    if (row.state !== 'review_required') fail('BILLING_REQUEST_NOT_REVIEWABLE');
    // The customer approved at most the reservation; a supplier overrun is
    // Forge's loss to absorb or a tariff to fix, never a surprise charge.
    const finalCharge = decision === 'charge_ceiling' ? row.reserved_units : 0;
    applyCharge(row.user_id, requestId, row, finalCharge);
    const state = finalCharge ? 'settled' : 'released';
    db.prepare('UPDATE managed_billing_requests SET state=?,charged_units=?,updated_at=? WHERE id=?').run(state, finalCharge, now(), requestId);
    audit('request', requestId, decision, admin, text);
    return { ...requestView(db.prepare('SELECT * FROM managed_billing_requests WHERE id=?').get(requestId)), decision };
  });
  const clearCircuit = atomic((model: string, actor: unknown, evidence: unknown) => {
    const admin = actorId(actor), text = evidenceText(evidence);
    const row = db.prepare('SELECT * FROM managed_billing_circuits WHERE model=?').get(model);
    if (!row) fail('BILLING_CIRCUIT_NOT_FOUND', 404);
    const unresolved = Number(db.prepare("SELECT COUNT(*) n FROM managed_billing_requests WHERE model=? AND state='review_required'").get(model).n);
    if (unresolved) fail('BILLING_CIRCUIT_REQUESTS_UNRESOLVED');
    db.prepare('DELETE FROM managed_billing_circuits WHERE model=?').run(model);
    audit('circuit', model, 'cleared', admin, text);
    return { model, cleared: true };
  });
  return { snapshot, reserve, settle, grantSubscription, history, operations, resolveHold, resolveReview, clearCircuit };
}
