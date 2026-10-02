import { createHash, randomUUID } from 'node:crypto';
import type { BrainDatabase } from './brain-service';
import type { createTaskDeliveryChecks } from './task-delivery-checks';

type Status = 'awaiting_approval' | 'dispatching' | 'accepted' | 'unknown' | 'rejected' | 'cancelled';
type DeliveryStatus = 'unconfirmed' | 'delivered' | 'delayed' | 'bounced' | 'complained' | 'failed';
export type MailEnvelope = { from: string; to: string; subject: string; text: string };
export type MailInput = MailEnvelope & { clientRequestId: string; artifactId: string; artifactVersion: number };
type Source = { runId: string; requestId: string; reportId: string; reportInputHash: string; artifactSha256: string; filename: string; releaseId: string | null };
export type BusinessMailReceipt = {
  id: string; threadId: string; artifactId: string; artifactVersion: number; clientRequestId: string;
  contentHash: string; status: Status; deliveryStatus: DeliveryStatus; envelope: MailEnvelope; source: Source;
  providerMessageId: string | null; providerLastEvent: string | null; modelChargeUsd: 0; providerChargeUsd: null;
  errorCode: string | null; approvedAt: number | null; acceptedAt: number | null; firstDispatchAt: number | null; createdAt: number; updatedAt: number;
};
export type MailFollowUp = {
  mailDeliveryId: string; version: number; recordedBy: 'owner'; updatedAt: number | null;
  nextStep: string | null; followUpOn: string | null; result: 'pending' | 'replied' | 'won' | 'lost' | null;
  notes: string | null; evidenceReference: string | null;
  reportedRevenueMinor: number | null; reportedRevenueCurrency: 'CNY' | 'USD' | null;
};
type FollowUpInput = Omit<MailFollowUp, 'mailDeliveryId' | 'version' | 'recordedBy' | 'updatedAt'> & { expectedVersion: number };
export class BusinessMailError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
type Dependencies = {
  db: BrainDatabase; deliveryChecks: ReturnType<typeof createTaskDeliveryChecks>;
  getCredential(userId: string): string | null; fetcher?: typeof fetch; now?: () => number;
};
const fail = (code: string, status = 400): never => { throw new BusinessMailError(code, status); };
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const object = (value: any) => value !== null && typeof value === 'object' && !Array.isArray(value);
function exact(value: any, fields: string[]) {
  if (!object(value) || Object.keys(value).some(key => !fields.includes(key))) fail('MAIL_INVALID_FIELDS');
}
function text(value: unknown, maximum: number, code: string): string {
  if (typeof value !== 'string' || !value.trim() || value.includes('\0') || Buffer.byteLength(value, 'utf8') > maximum) fail(code);
  return value as string;
}
function address(value: unknown): string {
  const input = text(value, 254, 'MAIL_INVALID_ADDRESS');
  const parts = input.split('@');
  if (parts.length !== 2 || parts[0].length > 64 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(parts[0])
    || parts[0].startsWith('.') || parts[0].endsWith('.') || parts[0].includes('..') || !parts[1].includes('.')
    || parts[1].split('.').some(label => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label))) fail('MAIL_INVALID_ADDRESS');
  return input;
}
function inputValue(input: MailInput) {
  exact(input, ['clientRequestId', 'artifactId', 'artifactVersion', 'from', 'to', 'subject', 'text']);
  if (Buffer.byteLength(JSON.stringify(input), 'utf8') > 64 * 1024) fail('MAIL_INPUT_TOO_LARGE', 413);
  const clientRequestId = text(input.clientRequestId, 128, 'MAIL_INVALID_REQUEST_ID');
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(clientRequestId)) fail('MAIL_INVALID_REQUEST_ID');
  const artifactId = text(input.artifactId, 128, 'MAIL_INVALID_ARTIFACT');
  if (!Number.isSafeInteger(input.artifactVersion) || input.artifactVersion < 1) fail('MAIL_INVALID_ARTIFACT_VERSION');
  const subject = text(input.subject, 500, 'MAIL_INVALID_SUBJECT');
  if (/[\r\n\x00-\x1f\x7f]/.test(subject)) fail('MAIL_INVALID_SUBJECT');
  const envelope = { from: address(input.from), to: address(input.to), subject, text: text(input.text, 60 * 1024, 'MAIL_INVALID_TEXT') };
  return { clientRequestId, artifactId, artifactVersion: input.artifactVersion, envelope };
}

/** Forge freezes owner-reviewed content and claims a send before any network I/O.
 * Only explicit recovery reuses the original provider key inside its safe window. */
export function createBusinessMail({ db, deliveryChecks, getCredential, fetcher = fetch, now = Date.now }: Dependencies) {
  db.exec(`CREATE TABLE IF NOT EXISTS business_mail_deliveries (
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL,artifact_id TEXT NOT NULL,artifact_version INTEGER NOT NULL,client_request_id TEXT NOT NULL,
    input_hash TEXT NOT NULL,source_json TEXT NOT NULL,source_hash TEXT NOT NULL,envelope_json TEXT NOT NULL,payload_json TEXT NOT NULL,
    content_hash TEXT NOT NULL,credential_hash TEXT NOT NULL,provider_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'awaiting_approval',delivery_status TEXT NOT NULL DEFAULT 'unconfirmed',
    provider_message_id TEXT,provider_last_event TEXT,provider_receipt_json TEXT,error_code TEXT,
    approved_at INTEGER,accepted_at INTEGER,first_dispatch_at INTEGER,dispatch_started_at INTEGER,attempt_id TEXT,
    created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(user_id,client_request_id));
    CREATE INDEX IF NOT EXISTS business_mail_owner_thread ON business_mail_deliveries(user_id,thread_id,created_at DESC);
    CREATE INDEX IF NOT EXISTS business_mail_unresolved ON business_mail_deliveries(user_id,input_hash,status);
    CREATE TABLE IF NOT EXISTS business_mail_followups (
      mail_delivery_id TEXT PRIMARY KEY REFERENCES business_mail_deliveries(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,fields_json TEXT NOT NULL,updated_at INTEGER NOT NULL);`);
  if (!db.prepare('PRAGMA table_info(business_mail_deliveries)').all().some(column => column.name === 'accepted_at')) db.exec('ALTER TABLE business_mail_deliveries ADD COLUMN accepted_at INTEGER');
  const atomic = <T extends (...args: any[]) => any>(fn: T): T => {
    const transaction = db.transaction(fn) as T & { immediate?: T }; return transaction.immediate || transaction;
  };
  const credential = (user: string) => {
    const value = getCredential(user);
    if (typeof value !== 'string' || !value.trim()) fail('MAIL_CREDENTIAL_REQUIRED', 409);
    return value;
  };
  function view(row: any): BusinessMailReceipt {
    return { id: row.id, threadId: row.thread_id, artifactId: row.artifact_id, artifactVersion: row.artifact_version,
      clientRequestId: row.client_request_id, contentHash: row.content_hash, status: row.status, deliveryStatus: row.delivery_status,
      envelope: JSON.parse(row.envelope_json), source: JSON.parse(row.source_json), providerMessageId: row.provider_message_id,
      providerLastEvent: row.provider_last_event, modelChargeUsd: 0, providerChargeUsd: null, errorCode: row.error_code,
      approvedAt: row.approved_at, acceptedAt: row.accepted_at, firstDispatchAt: row.first_dispatch_at, createdAt: row.created_at, updatedAt: row.updated_at };
  }
  function ownedRow(user: string, id: string) {
    const row = db.prepare('SELECT * FROM business_mail_deliveries WHERE id=? AND user_id=?').get(id, user);
    if (!row) return fail('MAIL_DELIVERY_NOT_FOUND', 404);
    return row;
  }
  function owned(user: string, id: string) {
    const row = ownedRow(user, id);
    if (row.status === 'dispatching' && now() - row.dispatch_started_at > 30000) {
      db.prepare("UPDATE business_mail_deliveries SET status='unknown',error_code='MAIL_DISPATCH_INTERRUPTED',updated_at=? WHERE id=? AND user_id=? AND status='dispatching' AND attempt_id=?")
        .run(now(), id, user, row.attempt_id);
      return db.prepare('SELECT * FROM business_mail_deliveries WHERE id=? AND user_id=?').get(id, user);
    }
    return row;
  }
  function source(user: string, threadId: string, artifactId: string, version: number): Source {
    if (!db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(threadId, user)) fail('MAIL_THREAD_NOT_FOUND', 404);
    const artifact = db.prepare('SELECT * FROM artifacts WHERE id=? AND user_id=? AND thread_id=?').get(artifactId, user, threadId);
    if (!artifact) fail('MAIL_ARTIFACT_NOT_FOUND', 404);
    const latest = deliveryChecks.latest(user, threadId), report = latest.report;
    if (!report || report.current !== true || report.passed !== true || report.accountingComplete !== true || report.chargeUsd !== 0
      || latest.runStatus !== 'completed') fail('MAIL_SOURCE_UNVERIFIED', 409);
    const run = db.prepare('SELECT id,request_id,status FROM pi_thread_runs WHERE user_id=? AND thread_id=? ORDER BY rowid DESC LIMIT 1').get(user, threadId);
    const files = latest.files.filter((file: any) => file.id === artifactId);
    if (!run || run.id !== report.runId || run.status !== 'completed' || !artifact || artifact.version !== version || artifact.language !== 'json'
      || files.length !== 1 || files[0].original !== true || files[0].version !== version
      || !report.files.some((file: any) => file.id === artifactId && file.original === true && file.sha256 === files[0].sha256 && file.version === version)) fail('MAIL_SOURCE_UNVERIFIED', 409);
    let draft: any;
    try { draft = JSON.parse(artifact.content); } catch { fail('MAIL_SOURCE_UNVERIFIED', 409); }
    const filename = files[0].filename;
    if (!object(draft) || draft.schemaVersion !== 1 || draft.status !== 'draft' || draft.ownerReviewRequired !== true
      || typeof draft.requestId !== 'string' || !draft.requestId || draft.requestId !== run.request_id
      || (filename === 'reply-draft.json' ? draft.sent !== false || typeof draft.subject !== 'string' || !draft.subject.trim() || typeof draft.body !== 'string' || !draft.body.trim()
        : filename === 'marketing-pack.json' ? draft.published !== false || !object(draft.emailDraft) || typeof draft.emailDraft.subject !== 'string' || !draft.emailDraft.subject.trim() || typeof draft.emailDraft.body !== 'string' || !draft.emailDraft.body.trim()
          : true)) fail('MAIL_SOURCE_UNVERIFIED', 409);
    return { runId: run.id, requestId: run.request_id, reportId: report.id, reportInputHash: report.inputHash,
      artifactSha256: files[0].sha256, filename, releaseId: report.releaseId || null };
  }
  const prepare = atomic((user: string, threadId: string, raw: MailInput) => {
    text(threadId, 128, 'MAIL_INVALID_THREAD');
    const input = inputValue(raw), fingerprint = hash({ threadId, artifactId: input.artifactId, artifactVersion: input.artifactVersion, envelope: input.envelope });
    const prior = db.prepare('SELECT * FROM business_mail_deliveries WHERE user_id=? AND client_request_id=?').get(user, input.clientRequestId);
    if (prior) {
      if (prior.input_hash !== fingerprint) fail('MAIL_IDEMPOTENCY_CONFLICT', 409);
      return view(owned(user, prior.id));
    }
    if (db.prepare("SELECT id FROM business_mail_deliveries WHERE user_id=? AND input_hash=? AND status IN ('awaiting_approval','dispatching','unknown') LIMIT 1").get(user, fingerprint)) fail('MAIL_EXISTING_DELIVERY_REQUIRED', 409);
    const pinned = source(user, threadId, input.artifactId, input.artifactVersion), keyHash = hash(credential(user));
    const id = randomUUID(), at = now(), contentHash = hash({ source: pinned, envelope: input.envelope, credentialHash: keyHash });
    const payload = JSON.stringify({ from: input.envelope.from, to: [input.envelope.to], subject: input.envelope.subject, text: input.envelope.text });
    db.prepare(`INSERT INTO business_mail_deliveries(id,user_id,thread_id,artifact_id,artifact_version,client_request_id,input_hash,source_json,source_hash,envelope_json,payload_json,content_hash,credential_hash,provider_key,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, user, threadId, input.artifactId, input.artifactVersion, input.clientRequestId,
      fingerprint, JSON.stringify(pinned), hash(pinned), JSON.stringify(input.envelope), payload, contentHash, keyHash, 'forge-mail-' + id, at, at);
    return view(owned(user, id));
  });
  const get = (user: string, id: string) => view(owned(user, id));
  const list = (user: string, threadId: string) => {
    if (!db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(threadId, user)) fail('MAIL_THREAD_NOT_FOUND', 404);
    return db.prepare('SELECT id FROM business_mail_deliveries WHERE user_id=? AND thread_id=? ORDER BY created_at DESC,rowid DESC LIMIT 100').all(user, threadId).map(row => get(user, row.id));
  };
  const followUpFields = (input: FollowUpInput) => {
    exact(input, ['expectedVersion', 'nextStep', 'followUpOn', 'result', 'notes', 'evidenceReference', 'reportedRevenueMinor', 'reportedRevenueCurrency']);
    if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) fail('MAIL_FOLLOWUP_INVALID');
    const optional = (value: unknown, maximum: number) => value === null ? null : text(value, maximum, 'MAIL_FOLLOWUP_INVALID').trim();
    const nextStep = optional(input.nextStep, 1000), notes = optional(input.notes, 8000), evidenceReference = optional(input.evidenceReference, 2000);
    const followUpOn = input.followUpOn;
    if (followUpOn !== null) {
      if (typeof followUpOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(followUpOn) || !nextStep) fail('MAIL_FOLLOWUP_INVALID');
      const day = new Date(followUpOn + 'T00:00:00.000Z');
      if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== followUpOn) fail('MAIL_FOLLOWUP_INVALID');
    }
    if (input.result !== null && !['pending', 'replied', 'won', 'lost'].includes(input.result)) fail('MAIL_FOLLOWUP_INVALID');
    const amount = input.reportedRevenueMinor, currency = input.reportedRevenueCurrency;
    if (amount === null ? currency !== null : !Number.isSafeInteger(amount) || amount < 0 || !['CNY', 'USD'].includes(currency as string)) fail('MAIL_FOLLOWUP_INVALID');
    return { nextStep, followUpOn, result: input.result, notes, evidenceReference, reportedRevenueMinor: amount, reportedRevenueCurrency: currency };
  };
  const getFollowUp = (user: string, id: string): MailFollowUp => {
    ownedRow(user, id);
    const row = db.prepare('SELECT * FROM business_mail_followups WHERE mail_delivery_id=? AND user_id=?').get(id, user);
    return { mailDeliveryId: id, version: row?.version || 0, recordedBy: 'owner', updatedAt: row?.updated_at ?? null,
      ...(row ? JSON.parse(row.fields_json) : { nextStep: null, followUpOn: null, result: null, notes: null, evidenceReference: null, reportedRevenueMinor: null, reportedRevenueCurrency: null }) };
  };
  const saveFollowUp = atomic((user: string, id: string, input: FollowUpInput): MailFollowUp => {
    ownedRow(user, id);
    const fields = followUpFields(input), current = getFollowUp(user, id);
    if (current.version !== input.expectedVersion) fail('MAIL_FOLLOWUP_CHANGED', 409);
    db.prepare(`INSERT INTO business_mail_followups(mail_delivery_id,user_id,version,fields_json,updated_at) VALUES(?,?,?,?,?)
      ON CONFLICT(mail_delivery_id) DO UPDATE SET version=excluded.version,fields_json=excluded.fields_json,updated_at=excluded.updated_at`)
      .run(id, user, current.version + 1, JSON.stringify(fields), now());
    return getFollowUp(user, id);
  });
  function checkKey(user: string, row: any) {
    const key = credential(user);
    if (hash(key) !== row.credential_hash) fail('MAIL_CREDENTIAL_CHANGED', 409);
    return key;
  }
  function checkSource(user: string, row: any) {
    let current: Source;
    try { current = source(user, row.thread_id, row.artifact_id, row.artifact_version); }
    catch { return fail('MAIL_SOURCE_CHANGED', 409); }
    if (hash(current) !== row.source_hash) fail('MAIL_SOURCE_CHANGED', 409);
  }
  const claim = atomic((user: string, id: string, input: any, recover: boolean) => {
    exact(input, ['expectedContentHash']);
    const row = owned(user, id);
    if (typeof input.expectedContentHash !== 'string' || input.expectedContentHash !== row.content_hash) fail('MAIL_CONTENT_CHANGED', 409);
    if (!recover && ['accepted', 'dispatching'].includes(row.status)) return { row, key: null as string | null };
    if (recover) {
      if (row.status !== 'unknown' || row.approved_at === null || row.first_dispatch_at === null) fail('MAIL_RECOVERY_NOT_AVAILABLE', 409);
      if (now() < row.first_dispatch_at || now() - row.first_dispatch_at >= 23 * 3600000) fail('MAIL_RECOVERY_WINDOW_EXPIRED', 409);
    } else if (row.status !== 'awaiting_approval') fail('MAIL_APPROVAL_NOT_AVAILABLE', 409);
    checkSource(user, row); const key = checkKey(user, row), at = now(), attempt = randomUUID();
    const changed = db.prepare(`UPDATE business_mail_deliveries SET status='dispatching',approved_at=COALESCE(approved_at,?),first_dispatch_at=COALESCE(first_dispatch_at,?),dispatch_started_at=?,attempt_id=?,error_code=NULL,updated_at=? WHERE id=? AND user_id=? AND status=?`)
      .run(at, at, at, attempt, at, id, user, row.status);
    if (!changed.changes) fail('MAIL_STATE_CONFLICT', 409);
    return { row: owned(user, id), key };
  });
  async function send(user: string, id: string, input: any, recovery = false): Promise<BusinessMailReceipt> {
    // Persist a stale dispatch's uncertainty even when a later preflight rejects.
    owned(user, id);
    const claimed = claim(user, id, input, recovery), row = claimed.row;
    if (!claimed.key) return view(row);
    let status: Status = 'unknown', providerId: string | null = null, errorCode: string | null = 'MAIL_DISPATCH_UNCONFIRMED';
    let providerReceipt: string | null = null;
    try {
      const response = await fetcher('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { Authorization: 'Bearer ' + claimed.key, 'Content-Type': 'application/json', 'Idempotency-Key': row.provider_key }, body: row.payload_json });
      if (response.ok) {
        const data: any = await response.json().catch(() => null);
        if (object(data) && uuid(data.id)) { status = 'accepted'; providerId = data.id; providerReceipt = JSON.stringify({ id: data.id, httpStatus: response.status }); errorCode = null; }
        else errorCode = 'MAIL_PROVIDER_RECEIPT_INVALID';
      } else if (response.status >= 400 && response.status < 500 && ![408, 409, 425, 429].includes(response.status)) {
        status = recovery ? 'unknown' : 'rejected'; errorCode = (recovery ? 'MAIL_RECOVERY_UNCONFIRMED_' : 'MAIL_PROVIDER_REJECTED_') + response.status;
      } else errorCode = 'MAIL_PROVIDER_UNCONFIRMED_' + response.status;
    } catch { errorCode = 'MAIL_DISPATCH_UNCONFIRMED'; }
    const at = now();
    db.prepare(`UPDATE business_mail_deliveries SET status=?,provider_message_id=?,provider_receipt_json=?,error_code=?,accepted_at=COALESCE(accepted_at,?),updated_at=? WHERE id=? AND user_id=? AND attempt_id=? AND status IN ('dispatching','unknown')`)
      .run(status, providerId, providerReceipt, errorCode, status === 'accepted' ? at : null, at, id, user, row.attempt_id);
    return get(user, id);
  }
  const approve = (user: string, id: string, input: { expectedContentHash: string }) => send(user, id, input);
  const recover = (user: string, id: string, input: { expectedContentHash: string }) => send(user, id, input, true);
  const cancel = atomic((user: string, id: string) => {
    const row = owned(user, id);
    if (row.status === 'cancelled') return view(row);
    if (row.status !== 'awaiting_approval') fail('MAIL_CANCELLATION_NOT_AVAILABLE', 409);
    if (!db.prepare("UPDATE business_mail_deliveries SET status='cancelled',updated_at=? WHERE id=? AND user_id=? AND status='awaiting_approval'").run(now(), id, user).changes) fail('MAIL_STATE_CONFLICT', 409);
    return get(user, id);
  });
  async function refresh(user: string, id: string): Promise<BusinessMailReceipt> {
    const row = owned(user, id), key = checkKey(user, row);
    if (!row.provider_message_id) return view(row);
    let data: any;
    try {
      const response = await fetcher('https://api.resend.com/emails/' + encodeURIComponent(row.provider_message_id), {
        method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Authorization: 'Bearer ' + key } });
      if (!response.ok) throw Error('receipt');
      data = await response.json();
    } catch {
      db.prepare("UPDATE business_mail_deliveries SET error_code='MAIL_RECEIPT_QUERY_UNCONFIRMED',updated_at=? WHERE id=? AND user_id=?").run(now(), id, user);
      return get(user, id);
    }
    const envelope: MailEnvelope = JSON.parse(row.envelope_json);
    if (!object(data) || data.id !== row.provider_message_id || data.from !== envelope.from || !Array.isArray(data.to) || data.to.length !== 1
      || data.to[0] !== envelope.to || data.subject !== envelope.subject || data.text !== envelope.text || typeof data.last_event !== 'string') {
      db.prepare("UPDATE business_mail_deliveries SET error_code='MAIL_PROVIDER_RECEIPT_MISMATCH',updated_at=? WHERE id=? AND user_id=?").run(now(), id, user);
      return get(user, id);
    }
    const events: Record<string, DeliveryStatus> = { sent: 'unconfirmed', queued: 'unconfirmed', scheduled: 'unconfirmed', delivered: 'delivered', delivery_delayed: 'delayed', bounced: 'bounced', complained: 'complained', failed: 'failed' };
    if (!Object.prototype.hasOwnProperty.call(events, data.last_event)) {
      db.prepare("UPDATE business_mail_deliveries SET error_code='MAIL_PROVIDER_EVENT_UNRECOGNIZED',updated_at=? WHERE id=? AND user_id=?").run(now(), id, user);
      return get(user, id);
    }
    atomic(() => {
      const current = owned(user, id), incoming = events[data.last_event];
      const preserve = ['delivered', 'bounced', 'complained', 'failed'].includes(current.delivery_status) && ['unconfirmed', 'delayed'].includes(incoming);
      db.prepare("UPDATE business_mail_deliveries SET delivery_status=?,provider_last_event=?,provider_receipt_json=?,error_code=NULL,updated_at=? WHERE id=? AND user_id=? AND provider_message_id=?")
        .run(preserve ? current.delivery_status : incoming, preserve ? current.provider_last_event : data.last_event,
          JSON.stringify({ id: data.id, from: data.from, to: data.to, subject: data.subject, text: data.text, last_event: data.last_event }), now(), id, user, row.provider_message_id);
    })();
    return get(user, id);
  }
  return { prepare, get, list, approve, cancel, refresh, recover, getFollowUp, saveFollowUp };
}

export function registerBusinessMailRoutes(app: any, requireAuth: any, service: ReturnType<typeof createBusinessMail>) {
  const route = (operation: (user: string, req: any) => unknown, status = 200) => async (req: any, res: any) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const user = req.user?.sub || req.user?.id;
      if (!user) fail('MAIL_AUTHENTICATION_REQUIRED', 401);
      res.status(status).json({ success: true, data: await operation(user, req) });
    } catch (error) {
      res.status(error instanceof BusinessMailError ? error.status : 500).json({ success: false, error: error instanceof BusinessMailError ? error.code : 'MAIL_OPERATION_FAILED' });
    }
  };
  app.post('/api/threads/:id/mail-deliveries', requireAuth, route((user, req) => service.prepare(user, req.params.id, req.body), 201));
  app.get('/api/threads/:id/mail-deliveries', requireAuth, route((user, req) => service.list(user, req.params.id)));
  app.get('/api/mail-deliveries/:id', requireAuth, route((user, req) => service.get(user, req.params.id)));
  app.get('/api/mail-deliveries/:id/follow-up', requireAuth, route((user, req) => service.getFollowUp(user, req.params.id)));
  app.put('/api/mail-deliveries/:id/follow-up', requireAuth, route((user, req) => service.saveFollowUp(user, req.params.id, req.body)));
  app.post('/api/mail-deliveries/:id/approve', requireAuth, route((user, req) => service.approve(user, req.params.id, req.body)));
  app.post('/api/mail-deliveries/:id/cancel', requireAuth, route((user, req) => { exact(req.body || {}, []); return service.cancel(user, req.params.id); }));
  app.post('/api/mail-deliveries/:id/refresh', requireAuth, route((user, req) => { exact(req.body || {}, []); return service.refresh(user, req.params.id); }));
  app.post('/api/mail-deliveries/:id/recover', requireAuth, route((user, req) => service.recover(user, req.params.id, req.body)));
}
