import type { PiProviderReceipt } from './pi-runtime';

type LedgerDatabase = { exec(sql: string): unknown; prepare(sql: string): any; transaction<T extends (...args: any[]) => any>(fn: T): T };
type Usage = NonNullable<PiProviderReceipt['usage']>;
export type PiProviderReconciliation = { usage?: Usage; not_sent?: boolean; evidence: string };
export class PiProviderLedgerError extends Error {
  constructor(public code: string, public statusCode = 409) { super(code); this.name = 'PiProviderLedgerError'; }
}

const fail = (code: string, status = 400): never => { throw new PiProviderLedgerError(code, status); };
const identifier = (value: any, limit = 512): string => typeof value === 'string' && value.length > 0 && value.length <= limit && !/[\x00-\x1f]/.test(value)
  ? value : fail('PI_PROVIDER_RECEIPT_ID_INVALID');
const tokens = (value: any): number => Number.isSafeInteger(value) && value >= 0 && value <= 1000000000 ? value : fail('PI_PROVIDER_USAGE_INVALID');
const usageValue = (value: any): Usage => {
  if (!value || typeof value !== 'object') return fail('PI_PROVIDER_USAGE_INVALID');
  const promptTokens = tokens(value.promptTokens), completionTokens = tokens(value.completionTokens), totalTokens = tokens(value.totalTokens);
  if (totalTokens !== promptTokens + completionTokens) return fail('PI_PROVIDER_USAGE_INVALID');
  const result: Usage = { promptTokens, completionTokens, totalTokens };
  if (value.providerCostUsd !== undefined) {
    if (typeof value.providerCostUsd !== 'number' || !Number.isFinite(value.providerCostUsd) || value.providerCostUsd < 0) return fail('PI_PROVIDER_COST_INVALID');
    result.providerCostUsd = value.providerCostUsd;
  }
  if (value.generationId !== undefined) {
    if (typeof value.generationId !== 'string' || !/^gen-[a-zA-Z0-9_-]{1,240}$/.test(value.generationId)) return fail('PI_PROVIDER_GENERATION_INVALID');
    result.generationId = value.generationId;
  }
  if (value.costSource !== undefined) {
    if (!['openrouter_usage', 'openrouter_generation'].includes(value.costSource) || value.providerCostUsd === undefined) return fail('PI_PROVIDER_COST_SOURCE_INVALID');
    result.costSource = value.costSource;
  }
  for (const key of ['cachedInputTokens', 'cacheWriteTokens', 'reasoningTokens'] as const) if (value[key] !== undefined) {
    const amount = tokens(value[key]);
    if (amount > (key === 'reasoningTokens' ? completionTokens : promptTokens)) return fail('PI_PROVIDER_USAGE_INVALID');
    result[key] = amount;
  }
  return result;
};
const timestamp = (value: any): string => {
  if (typeof value !== 'string' || value.length > 40 || !Number.isFinite(Date.parse(value))) return fail('PI_PROVIDER_RECEIPT_TIMESTAMP_INVALID');
  return new Date(value).toISOString();
};

// Explicit projection prevents accidental persistence of request bodies, prompts,
// generated content or API keys carried as extra callback properties.
function normalize(receipt: PiProviderReceipt): PiProviderReceipt {
  if (!receipt || receipt.version !== 1) return fail('PI_PROVIDER_RECEIPT_VERSION_INVALID');
  const states = ['started', 'completed', 'failed', 'cancelled', 'not_sent', 'rejected'];
  const statuses = ['pending', 'reported', 'unknown', 'not_sent', 'not_charged'];
  if (!states.includes(receipt.state) || !statuses.includes(receipt.usageStatus)) return fail('PI_PROVIDER_RECEIPT_STATE_INVALID');
  if ((receipt.state === 'started') !== (receipt.usageStatus === 'pending') || (receipt.state === 'not_sent') !== (receipt.usageStatus === 'not_sent')) return fail('PI_PROVIDER_RECEIPT_STATE_INVALID');
  if ((receipt.state === 'rejected') !== (receipt.usageStatus === 'not_charged')) return fail('PI_PROVIDER_RECEIPT_STATE_INVALID');
  if (receipt.usageStatus === 'not_charged') {
    const evidence = receipt.zeroChargeEvidence;
    if (receipt.provider !== 'openrouter' || receipt.httpStatus !== 402 || evidence?.source !== 'openrouter_http_status'
      || evidence?.policy !== 'openrouter_pre_admission_402_v1' || evidence?.httpStatus !== 402) return fail('PI_PROVIDER_ZERO_CHARGE_EVIDENCE_INVALID');
  } else if (receipt.zeroChargeEvidence !== undefined) return fail('PI_PROVIDER_ZERO_CHARGE_EVIDENCE_INVALID');
  const reservation = receipt.reservation;
  if (!reservation || reservation.basis !== 'utf8_bytes_plus_output_limit') return fail('PI_PROVIDER_RESERVATION_INVALID');
  const inputTokens = tokens(reservation.inputTokens), outputTokens = tokens(reservation.outputTokens), totalTokens = tokens(reservation.totalTokens);
  if (!totalTokens || totalTokens !== inputTokens + outputTokens || (reservation.costUsd !== undefined && (!Number.isFinite(reservation.costUsd) || reservation.costUsd < 0))) return fail('PI_PROVIDER_RESERVATION_INVALID');
  const startedAt = timestamp(receipt.startedAt);
  const endedAt = receipt.endedAt === undefined ? undefined : timestamp(receipt.endedAt);
  if ((receipt.state === 'started' && endedAt !== undefined) || (receipt.state !== 'started' && endedAt === undefined) || (endedAt !== undefined && endedAt < startedAt)) return fail('PI_PROVIDER_RECEIPT_TIMESTAMP_INVALID');
  const usage = receipt.usageStatus === 'reported' ? usageValue(receipt.usage) : undefined;
  if (usage?.costSource && receipt.provider !== 'openrouter') return fail('PI_PROVIDER_COST_SOURCE_INVALID');
  if (receipt.generationId !== undefined && (typeof receipt.generationId !== 'string' || !/^gen-[a-zA-Z0-9_-]{1,240}$/.test(receipt.generationId))) return fail('PI_PROVIDER_GENERATION_INVALID');
  if (receipt.generationId && usage?.generationId && receipt.generationId !== usage.generationId) return fail('PI_PROVIDER_GENERATION_INVALID');
  if (receipt.usageStatus !== 'reported' && receipt.usage !== undefined) return fail('PI_PROVIDER_USAGE_STATE_INVALID');
  if (receipt.httpStatus !== undefined && (!Number.isInteger(receipt.httpStatus) || receipt.httpStatus < 100 || receipt.httpStatus > 599)) return fail('PI_PROVIDER_HTTP_STATUS_INVALID');
  return {
    version: 1, requestId: identifier(receipt.requestId), userId: identifier(receipt.userId, 200), runId: identifier(receipt.runId),
    provider: identifier(receipt.provider, 100), model: identifier(receipt.model, 300), state: receipt.state, usageStatus: receipt.usageStatus,
    startedAt, ...(endedAt === undefined ? {} : { endedAt }), ...(receipt.httpStatus === undefined ? {} : { httpStatus: receipt.httpStatus }),
    reservation: { inputTokens, outputTokens, totalTokens, ...(reservation.costUsd === undefined ? {} : { costUsd: reservation.costUsd }), basis: 'utf8_bytes_plus_output_limit' },
    ...(usage ? { usage } : {}),
    ...(receipt.generationId ? { generationId: receipt.generationId } : {}),
    ...(receipt.zeroChargeEvidence ? { zeroChargeEvidence: { source: 'openrouter_http_status' as const, policy: 'openrouter_pre_admission_402_v1' as const, httpStatus: 402 as const } } : {}),
  };
}

/** Provider evidence is separate from the exact usage/credit ledger. Unknown or
 * pending exposure never expires automatically and is released only by a final
 * provider receipt or an administrator's externally evidenced reconciliation. */
export function createPiProviderLedger(db: LedgerDatabase) {
  db.exec(`CREATE TABLE IF NOT EXISTS pi_provider_receipts (
    request_id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    run_id TEXT NOT NULL,original_receipt TEXT NOT NULL,provider_receipt TEXT NOT NULL,effective_receipt TEXT NOT NULL,
    usage_status TEXT NOT NULL,held_tokens INTEGER NOT NULL DEFAULT 0,held_cost_usd REAL NOT NULL DEFAULT 0,
    reconciled INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS pi_provider_receipts_owner ON pi_provider_receipts(user_id,run_id,usage_status);
  CREATE TABLE IF NOT EXISTS pi_provider_reconciliations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,request_id TEXT NOT NULL REFERENCES pi_provider_receipts(request_id) ON DELETE CASCADE,
    actor_user_id TEXT NOT NULL,evidence TEXT NOT NULL,decision TEXT NOT NULL,previous_receipt TEXT NOT NULL,result_receipt TEXT NOT NULL,created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS pi_provider_reconciliations_request ON pi_provider_reconciliations(request_id,id);`);
  const owner = (userId: string) => {
    identifier(userId, 200);
    if (!db.prepare('SELECT id FROM users WHERE id=?').get(userId)) fail('USER_NOT_FOUND', 404);
  };
  const exposure = (receipt: PiProviderReceipt) => ['pending', 'unknown'].includes(receipt.usageStatus)
    ? { tokens: receipt.reservation.totalTokens, costUsd: receipt.reservation.costUsd || 0 }
    : { tokens: 0, costUsd: 0 };
  const effective = (row: any): PiProviderReceipt => JSON.parse(row.effective_receipt);
  const record = db.transaction((input: PiProviderReceipt): PiProviderReceipt => {
    const receipt = normalize(input); owner(receipt.userId);
    const encoded = JSON.stringify(receipt), time = new Date().toISOString();
    const row = db.prepare('SELECT * FROM pi_provider_receipts WHERE request_id=?').get(receipt.requestId);
    if (row) {
      const previous: PiProviderReceipt = JSON.parse(row.provider_receipt);
      if (previous.userId !== receipt.userId || previous.runId !== receipt.runId || previous.provider !== receipt.provider || previous.model !== receipt.model || previous.startedAt !== receipt.startedAt || JSON.stringify(previous.reservation) !== JSON.stringify(receipt.reservation)) fail('PI_PROVIDER_RECEIPT_CONFLICT', 409);
      if (encoded === row.provider_receipt || (previous.state !== 'started' && receipt.state === 'started')) return effective(row);
      if (previous.state !== 'started' || receipt.state === 'started') fail('PI_PROVIDER_RECEIPT_CONFLICT', 409);
      if (row.reconciled) {
        // Preserve late supplier evidence without silently overriding an audited
        // operator decision or changing an already settled reconciliation.
        db.prepare('UPDATE pi_provider_receipts SET provider_receipt=?,updated_at=? WHERE request_id=?').run(encoded, time, receipt.requestId);
        return effective(row);
      }
      const held = exposure(receipt);
      db.prepare('UPDATE pi_provider_receipts SET provider_receipt=?,effective_receipt=?,usage_status=?,held_tokens=?,held_cost_usd=?,updated_at=? WHERE request_id=?')
        .run(encoded, encoded, receipt.usageStatus, held.tokens, held.costUsd, time, receipt.requestId);
    } else {
      const held = exposure(receipt);
      db.prepare('INSERT INTO pi_provider_receipts(request_id,user_id,run_id,original_receipt,provider_receipt,effective_receipt,usage_status,held_tokens,held_cost_usd,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
        .run(receipt.requestId, receipt.userId, receipt.runId, encoded, encoded, encoded, receipt.usageStatus, held.tokens, held.costUsd, time, time);
    }
    return receipt;
  });
  const summary = (userId: string, runId?: string) => {
    owner(userId); if (runId !== undefined) identifier(runId);
    const rows = runId === undefined
      ? db.prepare('SELECT * FROM pi_provider_receipts WHERE user_id=? ORDER BY created_at,request_id').all(userId)
      : db.prepare('SELECT * FROM pi_provider_receipts WHERE user_id=? AND run_id=? ORDER BY created_at,request_id').all(userId, runId);
    const result = {
      reported: { promptTokens: 0, completionTokens: 0, totalTokens: 0, requestIds: [] as string[] },
      pending: { heldTokens: 0, costUsd: 0, requestIds: [] as string[] }, unknown: { heldTokens: 0, costUsd: 0, requestIds: [] as string[] },
      // heldCostUsd sums configured reservation estimates. Missing tariffs are
      // listed explicitly, so a numeric zero is never mistaken for no exposure.
      heldTokens: 0, heldCostUsd: 0, unpricedRequestIds: [] as string[], requests: rows.map(effective) as PiProviderReceipt[],
    };
    for (const receipt of result.requests) {
      if (receipt.usageStatus === 'reported') {
        result.reported.promptTokens += receipt.usage!.promptTokens; result.reported.completionTokens += receipt.usage!.completionTokens;
        result.reported.totalTokens += receipt.usage!.totalTokens; result.reported.requestIds.push(receipt.requestId);
      } else if (receipt.usageStatus === 'pending' || receipt.usageStatus === 'unknown') {
        const group = result[receipt.usageStatus], held = exposure(receipt);
        group.heldTokens += held.tokens; group.costUsd += held.costUsd; group.requestIds.push(receipt.requestId);
        result.heldTokens += held.tokens; result.heldCostUsd += held.costUsd;
        if (receipt.reservation.costUsd === undefined) result.unpricedRequestIds.push(receipt.requestId);
      }
    }
    return result;
  };
  const pendingTokens = (userId: string, excludeRunId?: string): number => {
    owner(userId); if (excludeRunId !== undefined) identifier(excludeRunId);
    const row = excludeRunId === undefined
      ? db.prepare("SELECT COALESCE(SUM(held_tokens),0) tokens FROM pi_provider_receipts WHERE user_id=? AND usage_status IN ('pending','unknown')").get(userId)
      : db.prepare("SELECT COALESCE(SUM(held_tokens),0) tokens FROM pi_provider_receipts WHERE user_id=? AND run_id!=? AND usage_status IN ('pending','unknown')").get(userId, excludeRunId);
    return Number(row.tokens);
  };
  const reconcile = db.transaction((requestId: string, actorUserId: string, input: PiProviderReconciliation): PiProviderReceipt => {
    identifier(requestId); identifier(actorUserId, 200);
    if (db.prepare('SELECT role FROM users WHERE id=?').get(actorUserId)?.role !== 'admin') fail('PI_PROVIDER_RECONCILIATION_ADMIN_REQUIRED', 403);
    if (!input || typeof input.evidence !== 'string' || input.evidence.trim().length < 8 || input.evidence.length > 4000) fail('PI_PROVIDER_RECONCILIATION_EVIDENCE_REQUIRED');
    if ((input.not_sent === true) === (input.usage !== undefined) || (input.not_sent !== undefined && typeof input.not_sent !== 'boolean')) fail('PI_PROVIDER_RECONCILIATION_DECISION_INVALID');
    const decision = input.not_sent === true ? { not_sent: true } : { usage: usageValue(input.usage) };
    const evidence = input.evidence.trim(), encodedDecision = JSON.stringify(decision);
    const row = db.prepare('SELECT * FROM pi_provider_receipts WHERE request_id=?').get(requestId);
    if (!row) fail('PI_PROVIDER_RECEIPT_NOT_FOUND', 404);
    const last = db.prepare('SELECT actor_user_id,evidence,decision FROM pi_provider_reconciliations WHERE request_id=? ORDER BY id DESC LIMIT 1').get(requestId);
    if (last?.actor_user_id === actorUserId && last.evidence === evidence && last.decision === encodedDecision) return effective(row);
    const current = effective(row), time = new Date().toISOString();
    const updated = normalize({ ...current, endedAt: current.endedAt || time,
      state: input.not_sent === true ? 'not_sent' : ['started', 'not_sent', 'rejected'].includes(current.state) ? 'completed' : current.state,
      usageStatus: input.not_sent === true ? 'not_sent' : 'reported', usage: 'usage' in decision ? decision.usage : undefined,
      zeroChargeEvidence: undefined,
    });
    const encoded = JSON.stringify(updated);
    db.prepare('INSERT INTO pi_provider_reconciliations(request_id,actor_user_id,evidence,decision,previous_receipt,result_receipt,created_at) VALUES(?,?,?,?,?,?,?)')
      .run(requestId, actorUserId, evidence, encodedDecision, row.effective_receipt, encoded, time);
    db.prepare('UPDATE pi_provider_receipts SET effective_receipt=?,usage_status=?,held_tokens=0,held_cost_usd=0,reconciled=1,updated_at=? WHERE request_id=?')
      .run(encoded, updated.usageStatus, time, requestId);
    return updated;
  });
  const get = (userId: string, requestId: string) => {
    owner(userId); identifier(requestId);
    const row = db.prepare('SELECT * FROM pi_provider_receipts WHERE request_id=? AND user_id=?').get(requestId, userId);
    if (!row) return null;
    return { receipt: effective(row), originalReceipt: JSON.parse(row.original_receipt) as PiProviderReceipt, providerReceipt: JSON.parse(row.provider_receipt) as PiProviderReceipt, reconciled: Boolean(row.reconciled),
      audits: db.prepare('SELECT * FROM pi_provider_reconciliations WHERE request_id=? ORDER BY id').all(requestId).map((audit: any) => ({
        id: audit.id, actorUserId: audit.actor_user_id, evidence: audit.evidence, decision: JSON.parse(audit.decision), previousReceipt: JSON.parse(audit.previous_receipt), resultReceipt: JSON.parse(audit.result_receipt), createdAt: audit.created_at,
      })),
    };
  };
  return { record, summary, pendingTokens, reconcile, get };
}
