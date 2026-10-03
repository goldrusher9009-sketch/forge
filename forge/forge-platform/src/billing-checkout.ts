import { createHash, randomUUID } from 'node:crypto';
import { MANAGED_PLANS, moneyUnits } from './managed-billing';
import { BillingCheckoutError } from './billing-error';
import { createBillingPlanChanges } from './billing-plan-changes';
export { BillingCheckoutError } from './billing-error';

type Db = { exec(sql: string): unknown; prepare(sql: string): any; transaction<T extends (...args: any[]) => any>(fn: T): T };
type CheckoutKind = 'subscription' | 'topup' | 'overage';
type Config = {
  db: Db;
  stripeSecret: string;
  stripeApiBaseUrl: string;
  stripePriceIds: Record<string, string>;
  portalConfigurationId?: string;
  frontendUrl?: string;
  purchasesEnabled: boolean;
  planChangesEnabled?: boolean;
  planLimits: Record<string, number>;
  monthlyCredits: Record<string, number>;
  minimumInvoiceCents?: Record<string, number>;
  ensureSubscription(userId: string): void;
  adjustCredits(userId: string, delta: number, reason: string, sourceEventId?: string): number;
  grantSubscription?(input: {
    userId: string; plan: string; cycleKey: string; subscriptionId: string; invoiceId: string;
    periodStart: string; periodEnd: string; amountUsd: number; paidAmountUsd: number; eventId: string;
  }): void;
  fetcher?: typeof fetch;
  now?: () => number;
};

const identifier = (value: any): string => typeof value === 'string' ? value : typeof value?.id === 'string' ? value.id : '';
const required = (condition: unknown, code: string) => { if (!condition) throw new BillingCheckoutError(code, 400); };
const retry = (code: string): never => { throw new BillingCheckoutError(code, 503, true); };
const iso = (seconds: number) => new Date(seconds * 1000).toISOString();
const subscriptionId = (invoice: any) => identifier(invoice.subscription || invoice.parent?.subscription_details?.subscription);
const priceId = (line: any) => identifier(line.price || line.pricing?.price_details?.price);

/** Stripe remains payment authority; only locally fulfilled receipts report success.
 * No fetch runs inside a SQLite transaction. Failures leave retryable intents/events.
 */
export function createBillingCheckout(config: Config) {
  const { db } = config;
  const now = config.now || Date.now;
  const fetcher = config.fetcher || fetch;
  db.exec(`
    CREATE TABLE IF NOT EXISTS billing_schema_versions (
      component TEXT PRIMARY KEY, version INTEGER NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO billing_schema_versions(component,version) VALUES('checkout_receipts',1);
    CREATE TABLE IF NOT EXISTS billing_checkout_intents (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL,
      request_hash TEXT NOT NULL, request_body TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'creating',
      session_id TEXT UNIQUE, checkout_url TEXT, expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL, fulfilled_at INTEGER, failure_code TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS billing_checkout_pending ON billing_checkout_intents(user_id,kind)
      WHERE state IN ('creating','open','pending');
    CREATE TABLE IF NOT EXISTS billing_business_receipts (
      business_key TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), event_id TEXT NOT NULL,
      object_id TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS billing_subscription_state (
      subscription_id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      event_created INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0,
      paid_period_start INTEGER NOT NULL DEFAULT 0, last_invoice_id TEXT, paid_plan TEXT
    );
    CREATE TABLE IF NOT EXISTS billing_payment_links (
      payment_intent TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      checkout_session_id TEXT NOT NULL, customer_id TEXT
    );
    CREATE TABLE IF NOT EXISTS billing_account_holds (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), source_event_id TEXT UNIQUE NOT NULL,
      kind TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'active', provider_object_id TEXT NOT NULL,
      evidence_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT, resolved_by TEXT, resolution_evidence TEXT
    );
  `);
  if (!db.prepare('PRAGMA table_info(billing_subscription_state)').all().some((column: any) => column.name === 'paid_plan')) {
    db.exec('ALTER TABLE billing_subscription_state ADD COLUMN paid_plan TEXT');
  }
  // Restore the paid plan only from an existing invoice-funded monetary grant,
  // never from mutable subscription metadata or the latest advertised price.
  if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='managed_billing_grants'").get()) {
    db.exec(`UPDATE billing_subscription_state SET paid_plan=(SELECT g.plan FROM managed_billing_grants g
      WHERE g.user_id=billing_subscription_state.user_id AND g.kind='subscription'
      AND g.source_id='cycle:' || billing_subscription_state.subscription_id || ':' || billing_subscription_state.paid_period_start
      AND g.starts_at=billing_subscription_state.paid_period_start*1000)
      WHERE paid_plan IS NULL AND paid_period_start>0 AND last_invoice_id IS NOT NULL`);
  }
  db.prepare("UPDATE billing_schema_versions SET version=2,applied_at=datetime('now') WHERE component='checkout_receipts' AND version<2").run();

  async function stripe(path: string, body?: URLSearchParams, idempotencyKey?: string): Promise<any> {
    if (!config.stripeSecret) throw new BillingCheckoutError('BILLING_NOT_CONFIGURED', 503);
    let response: Response;
    try {
      response = await fetcher(`${config.stripeApiBaseUrl}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${config.stripeSecret}`,
          ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        ...(body ? { body } : {}), signal: AbortSignal.timeout(20000), redirect: 'error', cache: 'no-store',
      });
    } catch { return retry('STRIPE_TEMPORARILY_UNAVAILABLE'); }
    if (!response.ok) {
      // Never log response bodies: provider errors can echo identity or payment data.
      const rejected = response.status < 500 && ![408, 409, 429].includes(response.status);
      throw new BillingCheckoutError(rejected ? 'STRIPE_REQUEST_REJECTED' : 'STRIPE_REQUEST_FAILED', 502, !rejected);
    }
    try { return await response.json(); } catch { return retry('STRIPE_RESPONSE_INVALID'); }
  }

  function getIntent(userId: string, sessionId: string) {
    return db.prepare('SELECT * FROM billing_checkout_intents WHERE user_id=? AND session_id=?').get(userId, sessionId);
  }
  function recordSession(intent: any, session: any) {
    required(identifier(session) && (!intent.session_id || intent.session_id === session.id), 'STRIPE_SESSION_MISMATCH');
    required(!session.client_reference_id || session.client_reference_id === intent.user_id, 'STRIPE_SESSION_OWNER_MISMATCH');
    required(!session.metadata?.userId || session.metadata.userId === intent.user_id, 'STRIPE_SESSION_OWNER_MISMATCH');
    required(!session.metadata?.forgeCheckoutIntentId || session.metadata.forgeCheckoutIntentId === intent.id, 'STRIPE_SESSION_MISMATCH');
    required(['open', 'complete', 'expired'].includes(session.status), 'STRIPE_RESPONSE_INVALID');
    required(session.status !== 'expired' || session.payment_status !== 'paid', 'STRIPE_RESPONSE_INVALID');
    let state = 'open';
    if (session.status === 'expired') state = 'expired';
    else if (session.status === 'complete' || session.payment_status === 'paid') state = 'pending';
    db.prepare(`UPDATE billing_checkout_intents SET session_id=?,checkout_url=?,expires_at=?,
      state=CASE WHEN state IN ('fulfilled','expired','failed','pending') THEN state ELSE ? END WHERE id=?`)
      .run(session.id, session.url || intent.checkout_url || null, Number(session.expires_at) || intent.expires_at, state, intent.id);
    return db.prepare('SELECT * FROM billing_checkout_intents WHERE id=?').get(intent.id);
  }

  async function validateSubscriptionPrice(input: URLSearchParams) {
    const configuredId = input.get('line_items[0][price]') || '';
    const plan = Object.entries(config.stripePriceIds).find(([, id]) => id && id === configuredId)?.[0];
    const policy = MANAGED_PLANS[plan as keyof typeof MANAGED_PLANS];
    const expectedCents = policy?.monthlyUsd * 100;
    const invalid = () => { throw new BillingCheckoutError('BILLING_PRICE_CONFIGURATION_INVALID', 503); };
    if (!plan || !policy || !Number.isSafeInteger(expectedCents) || expectedCents <= 0
      || input.get('metadata[plan]') !== plan || input.get('mode') !== 'subscription'
      || Number(input.get('line_items[0][quantity]') ?? 1) !== 1) invalid();
    // Prices are checked even for retries and open-session reuse. Do not cache
    // an active flag or silently return an old URL after a price is disabled.
    // This server-owned API path cannot be replaced by request-supplied URLs.
    const price = await stripe(`/prices/${encodeURIComponent(configuredId)}`);
    if (identifier(price) !== configuredId || price.active !== true || price.type !== 'recurring'
      || price.currency !== 'usd' || price.billing_scheme !== 'per_unit' || price.transform_quantity != null
      || price.recurring?.interval !== 'month' || price.recurring?.interval_count !== 1 || price.recurring?.usage_type !== 'licensed'
      || !Number.isSafeInteger(price.unit_amount) || price.unit_amount !== expectedCents
      || (price.unit_amount_decimal != null && Number(price.unit_amount_decimal) !== expectedCents)) invalid();
  }

  async function createCheckout(userId: string, kind: CheckoutKind, input: URLSearchParams) {
    if (!config.purchasesEnabled) throw new BillingCheckoutError('BILLING_PURCHASES_PAUSED', 503);
    if (db.prepare("SELECT id FROM billing_account_holds WHERE user_id=? AND state='active' LIMIT 1").get(userId)) {
      throw new BillingCheckoutError('BILLING_ACCOUNT_REVIEW_REQUIRED', 403);
    }
    required(['subscription', 'topup', 'overage'].includes(kind), 'INVALID_CHECKOUT_KIND');
    required(input.get('client_reference_id') === userId && input.get('metadata[userId]') === userId, 'CHECKOUT_OWNER_REQUIRED');
    if (kind === 'subscription') await validateSubscriptionPrice(input);
    const requestBody = new URLSearchParams(input);
    const returnUrl = requestBody.get('success_url');
    required(returnUrl, 'CHECKOUT_RETURN_URL_REQUIRED');
    const success = new URL(returnUrl!);
    success.searchParams.set('account', userId);
    success.searchParams.set('checkout_session_id', '{CHECKOUT_SESSION_ID}');
    requestBody.set('success_url', success.toString().replace('%7BCHECKOUT_SESSION_ID%7D', '{CHECKOUT_SESSION_ID}'));
    if (requestBody.get('cancel_url')) {
      const cancel = new URL(requestBody.get('cancel_url')!); cancel.searchParams.set('account', userId);
      requestBody.set('cancel_url', cancel.toString());
    }
    requestBody.sort();
    const hash = createHash('sha256').update(requestBody.toString()).digest('hex');
    let pending = db.prepare("SELECT * FROM billing_checkout_intents WHERE user_id=? AND kind=? AND state IN ('creating','open','pending')").get(userId, kind);
    if (pending?.session_id) pending = recordSession(pending, await stripe(`/checkout/sessions/${encodeURIComponent(pending.session_id)}`));
    if (pending && ['expired', 'fulfilled', 'failed'].includes(pending.state)) pending = undefined;
    if (pending && pending.request_hash !== hash) throw new BillingCheckoutError('CHECKOUT_ALREADY_PENDING', 409);
    if (pending?.state === 'pending') throw new BillingCheckoutError('CHECKOUT_PAYMENT_CONFIRMING', 409, true);
    if (pending?.state === 'open' && pending.checkout_url) return { checkoutUrl: pending.checkout_url, sessionId: pending.session_id, reused: true };

    const intent = db.transaction(() => {
      const existing = db.prepare("SELECT * FROM billing_checkout_intents WHERE user_id=? AND kind=? AND state IN ('creating','open','pending')").get(userId, kind);
      if (existing) {
        if (existing.request_hash !== hash) throw new BillingCheckoutError('CHECKOUT_ALREADY_PENDING', 409);
        return existing;
      }
      if (kind === 'subscription') {
        const sub = db.prepare('SELECT stripe_subscription_id FROM subscriptions WHERE user_id=?').get(userId);
        if (sub?.stripe_subscription_id) throw new BillingCheckoutError('SUBSCRIPTION_ALREADY_LINKED', 409);
      }
      const id = randomUUID(), created = Math.floor(now() / 1000);
      requestBody.set('expires_at', String(created + 1800));
      requestBody.set('metadata[forgeCheckoutIntentId]', id);
      db.prepare('INSERT INTO billing_checkout_intents(id,user_id,kind,request_hash,request_body,expires_at,created_at) VALUES(?,?,?,?,?,?,?)')
        .run(id, userId, kind, hash, requestBody.toString(), created + 1800, created);
      return db.prepare('SELECT * FROM billing_checkout_intents WHERE id=?').get(id);
    })();
    // A lost response must reuse the exact body and key, including its original expiry.
    // Beyond Stripe's key retention window, reconciliation is required, never a new charge.
    if (Math.floor(now() / 1000) - intent.created_at >= 23 * 3600) return retry('CHECKOUT_RECONCILIATION_REQUIRED');
    let session: any;
    try {
      session = await stripe('/checkout/sessions', new URLSearchParams(intent.request_body), `forge-checkout-${intent.id}`);
    } catch (error) {
      if (error instanceof BillingCheckoutError && error.code === 'STRIPE_REQUEST_REJECTED') {
        db.prepare("UPDATE billing_checkout_intents SET state='failed',failure_code=? WHERE id=? AND state='creating'").run(error.code, intent.id);
      }
      throw error;
    }
    const saved = recordSession(intent, session);
    if (saved.state === 'expired') throw new BillingCheckoutError('CHECKOUT_EXPIRED', 409);
    if (saved.state === 'pending' || saved.state === 'fulfilled') throw new BillingCheckoutError('CHECKOUT_PAYMENT_CONFIRMING', 409, true);
    required(session.url, 'STRIPE_CHECKOUT_URL_MISSING');
    return { checkoutUrl: session.url, sessionId: session.id, reused: Boolean(pending) };
  }

  async function checkoutStatus(userId: string, sessionId: string) {
    let row = getIntent(userId, sessionId);
    if (!row) throw new BillingCheckoutError('CHECKOUT_NOT_FOUND', 404);
    if (!['fulfilled', 'expired', 'failed'].includes(row.state)) row = recordSession(row, await stripe(`/checkout/sessions/${encodeURIComponent(sessionId)}`));
    const subscription = db.prepare('SELECT plan,status,period_end FROM subscriptions WHERE user_id=?').get(userId);
    return {
      sessionId, kind: row.kind, status: row.state === 'fulfilled' ? 'confirmed' : row.state === 'pending' ? 'confirming' : row.state,
      paid: row.state === 'fulfilled', retryable: ['creating', 'open', 'pending'].includes(row.state),
      plan: subscription?.plan || 'free', subscriptionStatus: subscription?.status || 'active', periodEnd: subscription?.period_end || null,
    };
  }

  function ownedIntent(userId: string, intentId: string) {
    const row = db.prepare('SELECT * FROM billing_checkout_intents WHERE user_id=? AND id=?').get(userId, intentId);
    if (!row) throw new BillingCheckoutError('CHECKOUT_NOT_FOUND', 404);
    return row;
  }
  function intentView(row: any) {
    const input = new URLSearchParams(row.request_body);
    const plan = row.kind === 'subscription' ? input.get('metadata[plan]') : null;
    const policy = MANAGED_PLANS[plan as keyof typeof MANAGED_PLANS];
    const cents = Number(input.get('metadata[creditAmountCents]'));
    return { id: row.id, sessionId: row.session_id || null, kind: row.kind, plan,
      amountUsd: row.kind === 'subscription' ? policy?.monthlyUsd ?? null : row.kind === 'topup' && cents > 0 ? cents / 100 : null,
      status: row.state === 'fulfilled' ? 'confirmed' : row.state === 'pending' ? 'confirming' : row.state,
      expiresAt: iso(row.expires_at), createdAt: iso(row.created_at) };
  }
  async function pendingCheckouts(userId: string) {
    const rows = db.prepare("SELECT * FROM billing_checkout_intents WHERE user_id=? AND state IN ('creating','open','pending') ORDER BY created_at DESC").all(userId);
    // At most one outstanding intent per purchase kind. GET never creates a provider session.
    return (await Promise.all(rows.map(async (row: any) => {
      try {
        if (row.session_id) row = recordSession(row, await stripe(`/checkout/sessions/${encodeURIComponent(row.session_id)}`));
        return { ...intentView(row), refreshRequired: false };
      } catch { return { ...intentView(ownedIntent(userId, row.id)), refreshRequired: true }; }
    }))).filter(row => ['creating', 'open', 'confirming'].includes(row.status));
  }
  async function recoverSession(row: any) {
    if (row.session_id) return stripe(`/checkout/sessions/${encodeURIComponent(row.session_id)}`);
    if (Math.floor(now() / 1000) - row.created_at >= 23 * 3600) return retry('CHECKOUT_RECONCILIATION_REQUIRED');
    // Recovery replays the original creation, including expiry, with the original key.
    // A rejected replay is not proof that an earlier attempt never created a session.
    return stripe('/checkout/sessions', new URLSearchParams(row.request_body), `forge-checkout-${row.id}`);
  }
  async function resumeCheckout(userId: string, intentId: string) {
    if (!config.purchasesEnabled) throw new BillingCheckoutError('BILLING_PURCHASES_PAUSED', 503);
    if (db.prepare("SELECT id FROM billing_account_holds WHERE user_id=? AND state='active' LIMIT 1").get(userId)) {
      throw new BillingCheckoutError('BILLING_ACCOUNT_REVIEW_REQUIRED', 403);
    }
    let row = ownedIntent(userId, intentId);
    if (['expired', 'failed'].includes(row.state)) throw new BillingCheckoutError('CHECKOUT_EXPIRED', 409);
    if (['pending', 'fulfilled'].includes(row.state)) throw new BillingCheckoutError('CHECKOUT_PAYMENT_CONFIRMING', 409, true);
    if (row.kind === 'subscription') await validateSubscriptionPrice(new URLSearchParams(row.request_body));
    const session = await recoverSession(row);
    row = recordSession(row, session);
    if (row.state !== 'open' || session.payment_status !== 'unpaid') throw new BillingCheckoutError(row.state === 'expired' ? 'CHECKOUT_EXPIRED' : 'CHECKOUT_PAYMENT_CONFIRMING', 409);
    let destination: URL;
    try { destination = new URL(session.url); } catch { return retry('STRIPE_CHECKOUT_URL_MISSING'); }
    if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com' || destination.username || destination.password || destination.port) return retry('STRIPE_CHECKOUT_URL_MISSING');
    return { checkoutUrl: destination.toString(), sessionId: row.session_id };
  }
  async function cancelCheckout(userId: string, intentId: string) {
    let row = ownedIntent(userId, intentId);
    if (row.state === 'expired') return { ...intentView(row), cancelled: true };
    if (['pending', 'fulfilled', 'failed'].includes(row.state)) throw new BillingCheckoutError('CHECKOUT_NOT_CANCELLABLE', 409);
    const session = await recoverSession(row);
    row = recordSession(row, session);
    if (row.state === 'expired' && session.payment_status === 'unpaid') return { ...intentView(row), cancelled: true };
    if (row.state !== 'open' || session.status !== 'open' || session.payment_status !== 'unpaid') throw new BillingCheckoutError('CHECKOUT_NOT_CANCELLABLE', 409);
    let closed: any;
    try {
      closed = await stripe(`/checkout/sessions/${encodeURIComponent(row.session_id)}/expire`, new URLSearchParams(), `forge-expire-${row.id}`);
    } catch {
      // Payment can win the race; a lost expiry response must be read back before releasing the slot.
      closed = await stripe(`/checkout/sessions/${encodeURIComponent(row.session_id)}`);
    }
    row = recordSession(row, closed);
    if (row.state !== 'expired' || closed.status !== 'expired' || closed.payment_status !== 'unpaid') {
      throw new BillingCheckoutError(row.state === 'open' ? 'CHECKOUT_CANCELLATION_UNCONFIRMED' : 'CHECKOUT_NOT_CANCELLABLE', 409, row.state === 'open');
    }
    return { ...intentView(row), cancelled: true };
  }

  const planFor = (subscription: any) => {
    const items = subscription.items?.data || [];
    const plans = items.map((item: any) => Object.entries(config.stripePriceIds).find(([, id]) => id && id === priceId(item))?.[0]).filter(Boolean);
    required(items.length === 1 && plans.length === 1 && Number(items[0]?.quantity ?? 1) === 1, 'UNSUPPORTED_SUBSCRIPTION_PRICE');
    return plans[0] as string;
  };
  async function createPortal(userId: string) {
    // Cancellation and payment-method maintenance remain available during a
    // payment review. A review blocks purchases, not stopping future renewals.
    const current = db.prepare('SELECT stripe_customer_id,stripe_subscription_id FROM subscriptions WHERE user_id=?').get(userId);
    if (!current?.stripe_customer_id || !current.stripe_subscription_id) throw new BillingCheckoutError('BILLING_SUBSCRIPTION_NOT_LINKED', 409);
    const configurationId = config.portalConfigurationId || '';
    if (!/^bpc_[A-Za-z0-9]+$/.test(configurationId) || !config.frontendUrl) throw new BillingCheckoutError('BILLING_PORTAL_NOT_CONFIGURED', 503);
    const configuration = await stripe(`/billing_portal/configurations/${encodeURIComponent(configurationId)}`);
    const features = configuration.features;
    // Do not inherit the shared merchant account's default, expose other
    // products, or enable prorated changes before their allowance policy exists.
    if (configuration.id !== configurationId || configuration.active !== true || configuration.metadata?.application !== 'forge'
      || features?.subscription_cancel?.enabled !== true || features.subscription_cancel.mode !== 'at_period_end'
      || features.subscription_cancel.proration_behavior !== 'none' || features?.subscription_update?.enabled !== false
      || features?.subscription_pause?.enabled === true || features?.invoice_history?.enabled !== true
      || features?.payment_method_update?.enabled !== true) throw new BillingCheckoutError('BILLING_PORTAL_CONFIGURATION_INVALID', 503);
    let subscription = await stripe(`/subscriptions/${encodeURIComponent(current.stripe_subscription_id)}`);
    required(subscription.id === current.stripe_subscription_id && identifier(subscription.customer) === current.stripe_customer_id
      && (!subscription.metadata?.userId || subscription.metadata.userId === userId), 'STRIPE_SUBSCRIPTION_OWNER_MISMATCH');
    planFor(subscription);
    if (['canceled', 'incomplete_expired'].includes(subscription.status)) throw new BillingCheckoutError('BILLING_SUBSCRIPTION_NOT_ACTIVE', 409);
    if (identifier(subscription.schedule)) {
      await planChanges.preparePortal(userId);
      subscription = await stripe(`/subscriptions/${encodeURIComponent(current.stripe_subscription_id)}`);
      required(identifier(subscription.customer) === current.stripe_customer_id && !identifier(subscription.schedule), 'PLAN_CHANGE_SCHEDULE_MISMATCH');
    }
    const returnUrl = new URL('/', config.frontendUrl);
    returnUrl.searchParams.set('billing', 'portal_return'); returnUrl.searchParams.set('account', userId);
    const session = await stripe('/billing_portal/sessions', new URLSearchParams({
      customer: current.stripe_customer_id, configuration: configurationId, return_url: returnUrl.toString(),
    }));
    let destination: URL;
    try { destination = new URL(session.url); } catch { return retry('STRIPE_PORTAL_RESPONSE_INVALID'); }
    if (!/^bps_[A-Za-z0-9]+$/.test(session.id || '') || destination.protocol !== 'https:' || destination.hostname !== 'billing.stripe.com'
      || destination.username || destination.password || destination.port) return retry('STRIPE_PORTAL_RESPONSE_INVALID');
    return { checkoutUrl: destination.toString(), sessionId: session.id, action: 'manage_subscription' };
  }
  function ownerFor(object: any, providerSubscription?: any) {
    const id = identifier(providerSubscription);
    const linked = id ? db.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id=?').get(id) : null;
    const known = id ? db.prepare('SELECT user_id FROM billing_subscription_state WHERE subscription_id=?').get(id) : null;
    const candidates = [object.client_reference_id, object.metadata?.userId, providerSubscription?.metadata?.userId, linked?.user_id, known?.user_id].filter(Boolean);
    if (!candidates.length) return retry('BILLING_EVENT_OWNER_NOT_LINKED');
    required(candidates.every(userId => userId === candidates[0]), 'BILLING_EVENT_OWNER_MISMATCH');
    const userId = String(candidates[0]);
    if (!db.prepare('SELECT id FROM users WHERE id=?').get(userId)) return retry('BILLING_EVENT_OWNER_NOT_FOUND');
    return userId;
  }
  function receipt(key: string, userId: string, event: any, objectId: string, action: string): boolean {
    const result = db.prepare('INSERT OR IGNORE INTO billing_business_receipts(business_key,user_id,event_id,object_id,action) VALUES(?,?,?,?,?)')
      .run(key, userId, event.id, objectId, action);
    return result.changes === 1;
  }
  function fulfill(sessionId: string) {
    db.prepare("UPDATE billing_checkout_intents SET state='fulfilled',fulfilled_at=? WHERE session_id=?").run(Math.floor(now() / 1000), sessionId);
  }
  function stateFor(id: string, userId: string) {
    db.prepare('INSERT OR IGNORE INTO billing_subscription_state(subscription_id,user_id) VALUES(?,?)').run(id, userId);
    return db.prepare('SELECT * FROM billing_subscription_state WHERE subscription_id=?').get(id);
  }
  function linkSubscription(userId: string, sub: any) {
    const customer = identifier(sub.customer);
    required(customer && sub.id, 'STRIPE_SUBSCRIPTION_IDENTIFIERS_MISSING');
    config.ensureSubscription(userId);
    const current = db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(userId);
    if (current.stripe_subscription_id && current.stripe_subscription_id !== sub.id) throw new BillingCheckoutError('DUPLICATE_PAID_SUBSCRIPTION', 409, true);
    const other = db.prepare('SELECT user_id FROM subscriptions WHERE (stripe_customer_id=? OR stripe_subscription_id=?) AND user_id<>?').get(customer, sub.id, userId);
    required(!other, 'STRIPE_CUSTOMER_ALREADY_LINKED');
    db.prepare("UPDATE subscriptions SET stripe_customer_id=?,stripe_subscription_id=?,updated_at=datetime('now') WHERE user_id=?").run(customer, sub.id, userId);
  }
  function syncSubscription(userId: string, sub: any, event: any) {
    const saved = stateFor(sub.id, userId);
    if (saved.deleted) return false;
    if (event.type !== 'customer.subscription.deleted' && Number(event.created || 0) < saved.event_created) return true;
    linkSubscription(userId, sub);
    const deleted = sub.status === 'canceled' || sub.status === 'incomplete_expired' || event.type === 'customer.subscription.deleted';
    if (deleted) {
      db.prepare("UPDATE subscriptions SET plan='free',tokens_limit=?,tokens_used=0,stripe_subscription_id=NULL,status='cancelled',updated_at=datetime('now') WHERE user_id=? AND stripe_subscription_id=?")
        .run(config.planLimits.free, userId, sub.id);
      db.prepare('UPDATE billing_subscription_state SET deleted=1,event_created=MAX(event_created,?) WHERE subscription_id=?').run(event.created || 0, sub.id);
      return false;
    }
    planFor(sub);
    const active = sub.status === 'active';
    const currentStart = Number(sub.current_period_start || sub.items?.data?.[0]?.current_period_start || 0);
    // A scheduled price transition is not proof of payment. Keep the last
    // invoice-funded plan only for its paid cycle, including past-due recovery.
    const paid = saved.paid_period_start > 0 && currentStart > 0 && saved.paid_period_start === currentStart
      && Object.prototype.hasOwnProperty.call(config.planLimits, saved.paid_plan || '') && saved.paid_plan !== 'free';
    db.prepare("UPDATE subscriptions SET plan=?,tokens_limit=?,status=?,updated_at=datetime('now') WHERE user_id=?")
      .run(paid && active ? saved.paid_plan : 'free', paid && active ? config.planLimits[saved.paid_plan] : config.planLimits.free, sub.status || 'incomplete', userId);
    db.prepare('UPDATE billing_subscription_state SET event_created=MAX(event_created,?) WHERE subscription_id=?').run(event.created || 0, sub.id);
    return true;
  }

  async function applyEvent(event: any) {
    required(typeof event?.id === 'string' && typeof event?.type === 'string' && event?.data?.object, 'INVALID_BILLING_EVENT');
    if (db.prepare('SELECT event_id FROM stripe_webhook_events WHERE event_id=?').get(event.id)) return { reused: true, action: 'already_processed' };
    const object = event.data.object;
    const isInvoice = ['invoice.paid', 'invoice.payment_failed'].includes(event.type);
    const isSubscription = ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type);
    const isCheckout = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired', 'checkout.session.async_payment_failed'].includes(event.type);
    const isPaymentRisk = ['charge.refunded', 'charge.dispute.created'].includes(event.type);
    let sub: any = null, invoice = object;
    let charge: any = object;
    if (event.type === 'charge.dispute.created') {
      // Disputes carry a payment_intent but normally no customer. Subscription
      // payments have no Checkout payment link, so their charge supplies the
      // customer needed to identify and freeze the billed Forge account.
      const chargeId = identifier(object.charge);
      if (!chargeId) return retry('BILLING_DISPUTE_CHARGE_NOT_LINKED');
      charge = await stripe(`/charges/${encodeURIComponent(chargeId)}`);
      required(identifier(charge) === chargeId, 'BILLING_DISPUTE_CHARGE_MISMATCH');
      required(!identifier(object.payment_intent) || identifier(object.payment_intent) === identifier(charge.payment_intent), 'BILLING_DISPUTE_PAYMENT_MISMATCH');
      required(!identifier(object.customer) || identifier(object.customer) === identifier(charge.customer), 'BILLING_DISPUTE_CUSTOMER_MISMATCH');
    }
    if (isSubscription) sub = event.type === 'customer.subscription.deleted' ? object : await stripe(`/subscriptions/${encodeURIComponent(object.id)}`);
    if (isInvoice && subscriptionId(object)) {
      sub = await stripe(`/subscriptions/${encodeURIComponent(subscriptionId(object))}`);
      if (event.type === 'invoice.paid') invoice = await stripe(`/invoices/${encodeURIComponent(object.id)}`);
    }
    if (isCheckout && object.mode === 'subscription' && identifier(object.subscription)) sub = await stripe(`/subscriptions/${encodeURIComponent(identifier(object.subscription))}`);

    return db.transaction(() => {
      const claimed = db.prepare('INSERT OR IGNORE INTO stripe_webhook_events(event_id,event_type) VALUES(?,?)').run(event.id, event.type);
      if (!claimed.changes) return { reused: true, action: 'already_processed' };
      const outcome = (action: string) => ({ reused: false, action });
      if (isPaymentRisk) {
        const paymentIntent = identifier(charge.payment_intent), customer = identifier(charge.customer);
        const payment = paymentIntent ? db.prepare('SELECT user_id FROM billing_payment_links WHERE payment_intent=?').get(paymentIntent) : null;
        const subscriptions = customer ? db.prepare('SELECT user_id FROM subscriptions WHERE stripe_customer_id=?').all(customer) : [];
        const candidates = [...new Set([payment?.user_id, ...subscriptions.map((row: any) => row.user_id)].filter(Boolean))];
        if (!candidates.length) return retry('BILLING_PAYMENT_RISK_OWNER_NOT_LINKED');
        required(candidates.length === 1, 'BILLING_PAYMENT_RISK_OWNER_AMBIGUOUS');
        const userId = String(candidates[0]), objectId = identifier(object);
        required(objectId, 'BILLING_PAYMENT_RISK_OBJECT_REQUIRED');
        const kind = event.type === 'charge.refunded' ? 'refund_review' : 'dispute_review';
        const evidence = JSON.stringify({ eventId: event.id, eventType: event.type, objectId, paymentIntentId: paymentIntent || null,
          customerId: customer || null, amountRefundedCents: Number.isSafeInteger(object.amount_refunded) ? object.amount_refunded : null,
          disputedAmountCents: event.type === 'charge.dispute.created' && Number.isSafeInteger(object.amount) ? object.amount : null,
          currency: typeof object.currency === 'string' ? object.currency : null });
        db.prepare('INSERT OR IGNORE INTO billing_account_holds(id,user_id,source_event_id,kind,provider_object_id,evidence_json) VALUES(?,?,?,?,?,?)')
          .run(`stripe-risk:${event.id}`, userId, event.id, kind, objectId, evidence);
        receipt(`risk:${event.id}`, userId, event, objectId, 'payment_risk_review');
        return outcome('payment_risk_review_required');
      }
      if (!isInvoice && !isSubscription && !isCheckout) return outcome('ignored_event_type');
      if (isCheckout) {
        const userId = ownerFor(object, sub);
        const sessionId = identifier(object);
        required(sessionId, 'CHECKOUT_SESSION_ID_REQUIRED');
        // Fast webhooks can arrive before the checkout POST response is persisted.
        if (object.metadata?.forgeCheckoutIntentId) {
          const intent = db.prepare('SELECT * FROM billing_checkout_intents WHERE id=?').get(object.metadata.forgeCheckoutIntentId);
          required(intent?.user_id === userId, 'CHECKOUT_INTENT_OWNER_MISMATCH');
          recordSession(intent, object);
        }
        if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
          db.prepare("UPDATE billing_checkout_intents SET state=? WHERE session_id=? AND state<>'fulfilled'")
            .run(event.type.endsWith('expired') ? 'expired' : 'failed', sessionId);
          return outcome('checkout_closed');
        }
        if (object.status !== 'complete' || object.payment_status !== 'paid') return outcome('checkout_awaiting_payment');
        const paymentIntent = identifier(object.payment_intent);
        if (paymentIntent) {
          const previous = db.prepare('SELECT user_id,checkout_session_id FROM billing_payment_links WHERE payment_intent=?').get(paymentIntent);
          required(!previous || (previous.user_id === userId && previous.checkout_session_id === sessionId), 'CHECKOUT_PAYMENT_OWNER_MISMATCH');
          db.prepare('INSERT OR IGNORE INTO billing_payment_links(payment_intent,user_id,checkout_session_id,customer_id) VALUES(?,?,?,?)')
            .run(paymentIntent, userId, sessionId, identifier(object.customer) || null);
        }
        if (object.mode === 'subscription' && !object.metadata?.kind) {
          if (!sub) return retry('CHECKOUT_SUBSCRIPTION_NOT_LINKED');
          const state = stateFor(sub.id, userId);
          if (!state.deleted) syncSubscription(userId, sub, event);
          const paid = db.prepare("SELECT 1 FROM billing_business_receipts WHERE user_id=? AND business_key LIKE ?").get(userId, `cycle:${sub.id}:%`);
          if (paid) fulfill(sessionId);
          return outcome(paid ? 'subscription_confirmed' : 'subscription_awaiting_invoice');
        }
        const kind = object.metadata?.kind;
        if (object.mode === 'payment' && kind === 'forge_topup') {
          const cents = Number(object.metadata?.creditAmountCents);
          required(Number.isSafeInteger(cents) && cents >= 1000 && cents <= 100000, 'INVALID_TOPUP_METADATA');
          required(Number(object.amount_total) === cents && String(object.currency).toLowerCase() === 'usd', 'TOPUP_PAYMENT_MISMATCH');
          if (receipt(`checkout:${sessionId}`, userId, event, sessionId, 'topup_credited')) config.adjustCredits(userId, cents / 100, 'topup_paid', event.id);
          fulfill(sessionId);
          return outcome('topup_credited');
        }
        if (object.mode === 'payment' && kind === 'forge_overage') {
          const tokens = Number(object.metadata?.overage_tokens), cents = Math.max(Math.ceil(tokens / 1000 * 0.30), 100);
          required(Number.isSafeInteger(tokens) && tokens >= 1000 && Number(object.amount_total) === cents && String(object.currency).toLowerCase() === 'usd', 'OVERAGE_PAYMENT_MISMATCH');
          config.ensureSubscription(userId);
          if (receipt(`checkout:${sessionId}`, userId, event, sessionId, 'legacy_overage_settled')) {
            const current = db.prepare('SELECT tokens_used,tokens_limit,period_start,period_end FROM subscriptions WHERE user_id=?').get(userId);
            const periodStart = Date.parse(String(current.period_start || '').replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(current.period_start || '') ? '' : 'Z')) / 1000;
            const periodEnd = Date.parse(String(current.period_end || '').replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(current.period_end || '') ? '' : 'Z')) / 1000;
            const checkoutCreated = Number(object.created);
            if (!Number.isFinite(periodStart) || !Number.isFinite(periodEnd) || !Number.isSafeInteger(checkoutCreated)
              || checkoutCreated < periodStart || checkoutCreated >= periodEnd) {
              throw new BillingCheckoutError('LEGACY_OVERAGE_RECONCILIATION_REQUIRED', 409, true);
            }
            const settled = Math.min(tokens, Math.max(0, current.tokens_used - current.tokens_limit));
            // Legacy duplicate payments must not erase new-period usage or silently lose money.
            if (settled < tokens) throw new BillingCheckoutError('LEGACY_OVERAGE_RECONCILIATION_REQUIRED', 409, true);
            db.prepare("UPDATE subscriptions SET tokens_used=tokens_used-?,updated_at=datetime('now') WHERE user_id=?").run(settled, userId);
          }
          fulfill(sessionId);
          return outcome('overage_settled');
        }
        return outcome('ignored_checkout_kind');
      }
      if (!sub) {
        if (String(object.billing_reason || '').startsWith('subscription')) return retry('INVOICE_SUBSCRIPTION_NOT_LINKED');
        return outcome('ignored_non_subscription_invoice');
      }
      const userId = ownerFor({}, sub);
      if (isSubscription) {
        const live = syncSubscription(userId, sub, event);
        return outcome(live ? 'subscription_state_synced' : 'subscription_cancelled');
      }
      const live = syncSubscription(userId, sub, event);
      if (!live) return outcome('ignored_deleted_subscription_invoice');
      if (event.type === 'invoice.payment_failed') return outcome('subscription_state_synced');
      required(identifier(invoice) === identifier(object) && subscriptionId(invoice) === sub.id, 'INVOICE_SUBSCRIPTION_MISMATCH');
      required(identifier(invoice.customer) === identifier(sub.customer), 'INVOICE_CUSTOMER_MISMATCH');
      if (!(invoice.paid === true || invoice.status === 'paid')) return retry('INVOICE_PAYMENT_NOT_CONFIRMED');
      if (!['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason)) return outcome('invoice_without_cycle_grant');
      const lines = invoice.lines?.data || [];
      if (invoice.lines?.has_more) return retry('INVOICE_LINES_REQUIRE_RECONCILIATION');
      const fullLines = lines.filter((line: any) => !line.proration && !line.parent?.subscription_item_details?.proration && Object.values(config.stripePriceIds).includes(priceId(line)));
      required(fullLines.length === 1, 'INVOICE_PLAN_LINE_AMBIGUOUS');
      const line = fullLines[0], paidPlan = Object.entries(config.stripePriceIds).find(([, id]) => id && id === priceId(line))![0];
      required(Number(line.quantity ?? 1) === 1, 'INVOICE_QUANTITY_UNSUPPORTED');
      required(String(invoice.currency).toLowerCase() === 'usd', 'INVOICE_CURRENCY_UNSUPPORTED');
      const minimum = config.minimumInvoiceCents?.[paidPlan] || 0;
      required(Number(invoice.amount_paid) >= minimum, 'INVOICE_PAYMENT_BELOW_PLAN_MINIMUM');
      const start = Number(line.period?.start), end = Number(line.period?.end);
      required(Number.isSafeInteger(start) && start > 0 && Number.isSafeInteger(end) && end > start, 'INVOICE_PERIOD_INVALID');
      const currentStart = Number(sub.current_period_start || sub.items?.data?.[0]?.current_period_start || 0);
      if (start === currentStart) required(paidPlan === planFor(sub), 'INVOICE_CURRENT_PLAN_MISMATCH');
      const priorState = stateFor(sub.id, userId);
      if (priorState.paid_period_start === start && priorState.paid_plan) required(priorState.paid_plan === paidPlan, 'INVOICE_PAID_PLAN_CONFLICT');
      const key = `cycle:${sub.id}:${start}`;
      if (receipt(key, userId, event, invoice.id, 'subscription_cycle_credited')) {
        const credits = config.monthlyCredits[paidPlan];
        required(Number.isFinite(credits) && credits > 0, 'PLAN_CREDITS_NOT_CONFIGURED');
        if (config.grantSubscription) config.grantSubscription({
          userId, plan: paidPlan, cycleKey: key, subscriptionId: sub.id, invoiceId: invoice.id,
          periodStart: iso(start), periodEnd: iso(end), amountUsd: credits,
          paidAmountUsd: Number(invoice.amount_paid) / 100, eventId: event.id,
        });
        else config.adjustCredits(userId, credits, `subscription_cycle_${paidPlan}`, event.id);
      }
      const state = stateFor(sub.id, userId);
      if (start > state.paid_period_start) {
        // Never roll a newer period or plan backwards on delayed invoice delivery.
        const currentStart = Number(sub.current_period_start || sub.items?.data?.[0]?.current_period_start || 0);
        if (start >= currentStart && sub.status === 'active') {
          db.prepare("UPDATE subscriptions SET plan=?,tokens_limit=?,tokens_used=0,period_start=?,period_end=?,status='active',updated_at=datetime('now') WHERE user_id=?")
            .run(planFor(sub), config.planLimits[planFor(sub)], iso(start), iso(end), userId);
        }
        db.prepare('UPDATE billing_subscription_state SET paid_period_start=?,last_invoice_id=?,paid_plan=? WHERE subscription_id=?').run(start, invoice.id, paidPlan, sub.id);
      }
      db.prepare("UPDATE billing_checkout_intents SET state='fulfilled',fulfilled_at=? WHERE user_id=? AND kind='subscription' AND state='pending'")
        .run(Math.floor(now() / 1000), userId);
      return outcome('subscription_cycle_credited');
    })();
  }
  async function inspectPaymentHold(hold: any) {
    required(hold?.state === 'active' && ['refund_review','dispute_review'].includes(hold.kind), 'BILLING_HOLD_VERIFICATION_REQUIRED');
    let evidence: any;
    try { evidence = JSON.parse(hold.evidence_json); } catch { throw new BillingCheckoutError('BILLING_HOLD_VERIFICATION_REQUIRED',409); }
    required(evidence?.eventId === hold.source_event_id && evidence.objectId === hold.provider_object_id, 'BILLING_HOLD_EVIDENCE_MISMATCH');
    let dispute: any;
    let chargeId = hold.provider_object_id;
    if (hold.kind === 'dispute_review') {
      dispute = await stripe(`/disputes/${encodeURIComponent(hold.provider_object_id)}`);
      required(identifier(dispute) === hold.provider_object_id, 'BILLING_HOLD_PROVIDER_MISMATCH');
      chargeId = identifier(dispute.charge);
      required(chargeId, 'BILLING_DISPUTE_CHARGE_NOT_LINKED');
    }
    const charge = await stripe(`/charges/${encodeURIComponent(chargeId)}`);
    required(identifier(charge) === chargeId && charge.paid === true && charge.status === 'succeeded', 'BILLING_HOLD_PAYMENT_NOT_VERIFIED');
    const paymentIntent = identifier(charge.payment_intent), customer = identifier(charge.customer);
    required(!evidence.paymentIntentId || evidence.paymentIntentId === paymentIntent, 'BILLING_HOLD_PROVIDER_MISMATCH');
    required(!evidence.customerId || evidence.customerId === customer, 'BILLING_HOLD_PROVIDER_MISMATCH');
    required(!dispute || !identifier(dispute.payment_intent) || identifier(dispute.payment_intent) === paymentIntent, 'BILLING_HOLD_PROVIDER_MISMATCH');
    const payment = paymentIntent ? db.prepare('SELECT user_id FROM billing_payment_links WHERE payment_intent=?').get(paymentIntent) : null;
    const subscriptions = customer ? db.prepare('SELECT user_id FROM subscriptions WHERE stripe_customer_id=?').all(customer) : [];
    const owners = [...new Set([payment?.user_id,...subscriptions.map((row: any)=>row.user_id)].filter(Boolean))];
    required(owners.length === 1 && String(owners[0]) === hold.user_id, 'BILLING_HOLD_OWNER_MISMATCH');
    required(Number.isSafeInteger(charge.amount_refunded) && charge.amount_refunded >= 0, 'BILLING_HOLD_PAYMENT_NOT_VERIFIED');
    return {charge,dispute,chargeId,paymentIntent,customer};
  }
  async function verifyPaymentHold(hold: any) {
    const {charge,dispute,chargeId,paymentIntent,customer} = await inspectPaymentHold(hold);
    // Refunds/lost disputes require an entitlement reconciliation, not a text-only unlock.
    // This path never initiates a refund, changes credit balances, or waives a loss.
    if (hold.kind === 'refund_review' || charge.amount_refunded > 0 || charge.refunded === true) throw new BillingCheckoutError('BILLING_REFUND_RECONCILIATION_REQUIRED',409);
    if (dispute?.status !== 'won') throw new BillingCheckoutError('BILLING_DISPUTE_NOT_WON',409);
    return {decision:'payment_retained',holdId:hold.id,userId:hold.user_id,checkedAt:now(),chargeId,disputeId:dispute.id,disputeStatus:dispute.status,paymentIntentId:paymentIntent,customerId:customer,amountRefundedCents:0};
  }
  async function paymentReversalProof(hold: any) {
    const {charge,dispute,chargeId,paymentIntent,customer} = await inspectPaymentHold(hold);
    required(charge.currency === 'usd' && Number.isSafeInteger(charge.amount) && charge.amount > 0 && charge.amount_refunded <= charge.amount, 'BILLING_REVERSAL_PAYMENT_UNSUPPORTED');
    let lossCents = charge.amount_refunded;
    if (!dispute && charge.disputed === true) throw new BillingCheckoutError('BILLING_DISPUTE_REVIEW_REQUIRED',409);
    const refunds: Array<{id:string;amount:number}> = [];
    if (dispute && !['won','lost'].includes(dispute.status)) throw new BillingCheckoutError('BILLING_DISPUTE_NOT_FINAL',409);
    if (dispute?.status === 'lost') {
      if (charge.amount_refunded) throw new BillingCheckoutError('BILLING_OVERLAPPING_LOSS_REVIEW_REQUIRED',409);
      required(Number.isSafeInteger(dispute.amount) && dispute.amount > 0 && dispute.amount <= charge.amount && dispute.currency === 'usd', 'BILLING_REVERSAL_PAYMENT_UNSUPPORTED');
      lossCents = dispute.amount;
    } else if (lossCents > 0) {
      let cursor = '', complete = false;
      const seen = new Set<string>();
      for (let page=0;page<10;page++) {
        const result = await stripe(`/refunds?charge=${encodeURIComponent(chargeId)}&limit=100${cursor ? `&starting_after=${encodeURIComponent(cursor)}` : ''}`);
        required(Array.isArray(result.data) && typeof result.has_more === 'boolean','BILLING_REFUND_PROOF_INCOMPLETE');
        for (const refund of result.data) {
          required(identifier(refund.charge) === chargeId && refund.currency === 'usd' && typeof refund.id === 'string' && !seen.has(refund.id) && Number.isSafeInteger(refund.amount) && refund.amount > 0, 'BILLING_REFUND_PROOF_INCOMPLETE');
          seen.add(refund.id);
          if (['pending','requires_action'].includes(refund.status)) throw new BillingCheckoutError('BILLING_REFUND_NOT_FINAL',409);
          required(['succeeded','failed','canceled'].includes(refund.status),'BILLING_REFUND_PROOF_INCOMPLETE');
          if (refund.status === 'succeeded') refunds.push({id:refund.id,amount:refund.amount});
        }
        if (!result.has_more) {complete=true;break;}
        required(result.data.length > 0,'BILLING_REFUND_PROOF_INCOMPLETE');cursor=result.data.at(-1).id;
      }
      required(complete && refunds.reduce((sum,r)=>sum+r.amount,0) === lossCents,'BILLING_REFUND_PROOF_INCOMPLETE');
    }
    if (!lossCents) throw new BillingCheckoutError('BILLING_NO_PAYMENT_LOSS',409);
    const link = db.prepare('SELECT * FROM billing_payment_links WHERE payment_intent=? AND user_id=?').get(paymentIntent,hold.user_id);
    const topup = link && db.prepare("SELECT * FROM billing_business_receipts WHERE business_key=? AND user_id=? AND action='topup_credited'").get(`checkout:${link.checkout_session_id}`,hold.user_id);
    let source: {kind:string;sourceId:string;sourceKey:string;originalUnits:number};
    if (topup) {
      const session = await stripe(`/checkout/sessions/${encodeURIComponent(link.checkout_session_id)}`);
      required(identifier(session) === link.checkout_session_id && identifier(session.payment_intent) === paymentIntent && session.mode === 'payment' && session.payment_status === 'paid' && session.currency === 'usd' && session.amount_total === charge.amount,'BILLING_REVERSAL_FUNDING_MISMATCH');
      const entries = db.prepare("SELECT delta FROM credit_ledger WHERE user_id=? AND source_event_id=? AND reason='topup_paid'").all(hold.user_id,topup.event_id);
      required(entries.length === 1 && entries[0].delta > 0,'BILLING_REVERSAL_FUNDING_MISSING');
      const originalUnits = moneyUnits(entries[0].delta);
      required(originalUnits === moneyUnits(charge.amount/100),'BILLING_REVERSAL_FUNDING_MISMATCH');
      source = {kind:'topup',sourceId:link.checkout_session_id,sourceKey:topup.business_key,originalUnits};
    } else {
      const invoiceId = identifier(charge.invoice);
      if (!invoiceId) throw new BillingCheckoutError('BILLING_REVERSAL_FUNDING_MISSING',409);
      const invoice = await stripe(`/invoices/${encodeURIComponent(invoiceId)}`);
      required(identifier(invoice) === invoiceId && identifier(invoice.customer) === customer && (invoice.paid === true || invoice.status === 'paid') && invoice.currency === 'usd' && invoice.amount_paid === charge.amount && (!identifier(invoice.payment_intent) || identifier(invoice.payment_intent) === paymentIntent),'BILLING_REVERSAL_FUNDING_MISMATCH');
      const receipts = db.prepare("SELECT * FROM billing_business_receipts WHERE user_id=? AND object_id=? AND action='subscription_cycle_credited'").all(hold.user_id,invoiceId);
      required(receipts.length === 1,'BILLING_REVERSAL_FUNDING_MISSING');
      const grant = db.prepare("SELECT * FROM managed_billing_grants WHERE user_id=? AND source_id=? AND kind='subscription'").get(hold.user_id,receipts[0].business_key);
      required(grant && Number.isSafeInteger(grant.amount_units) && grant.amount_units >= 0,'BILLING_REVERSAL_FUNDING_MISSING');
      const prior = db.prepare("SELECT name FROM sqlite_master WHERE name='billing_credit_reversals'").get()
        ? db.prepare('SELECT * FROM billing_credit_reversals WHERE charge_id=?').get(chargeId) : null;
      if (prior) required(prior.user_id === hold.user_id && prior.source_kind === 'subscription' && prior.source_id === grant.id && prior.source_key === receipts[0].business_key && prior.principal_cents === charge.amount && grant.amount_units === prior.original_units-prior.grant_recovered_units,'BILLING_REVERSAL_FUNDING_MISMATCH');
      const originalUnits = prior?.original_units ?? grant.amount_units;
      required(Number.isSafeInteger(originalUnits) && originalUnits > 0,'BILLING_REVERSAL_FUNDING_MISSING');
      source = {kind:'subscription',sourceId:grant.id,sourceKey:receipts[0].business_key,originalUnits};
    }
    return {holdId:hold.id,userId:hold.user_id,chargeId,paymentIntentId:paymentIntent,customerId:customer,principalCents:charge.amount,lossCents,currency:'usd',...source,refunds:refunds.sort((a,b)=>a.id.localeCompare(b.id)),dispute:dispute ? {id:dispute.id,status:dispute.status,amount:dispute.amount} : null,checkedAt:now()};
  }
  const planChanges = createBillingPlanChanges({ db, stripe, now, enabled: config.purchasesEnabled && config.planChangesEnabled === true,
    priceIds: config.stripePriceIds, planFor, validatePrice: validateSubscriptionPrice });
  return { createCheckout, checkoutStatus, pendingCheckouts, resumeCheckout, cancelCheckout, createPortal, applyEvent, planChanges, verifyPaymentHold, paymentReversalProof };
}
