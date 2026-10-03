import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { PiRunOptions } from './pi-runtime';
import { artifactFilename, normalizeArtifactValues } from './artifact-store';
import { savedArtifactReply, validateArtifactSources } from './chat-delivery';

type Database = { exec(sql: string): unknown; prepare(sql: string): any; transaction<T extends (...args: any[]) => any>(fn: T): T };
type Release = { agentId: string; releaseId: string; version: number; configurationHash: string;
  configuration: { name: string; model: string; system_prompt: string; tools: string[] }; sourceFiles: any[] };
type Policy = { maximumUsdPerRun: number; dailyBudgetUsd: number; maximumConcurrentRuns: number; shareReleaseSources: boolean };
type Accounting = { chargedUsd: number | null; tokensUsed: number | null; pending: boolean; requestIds: string[] };
type Dependencies = {
  db: Database; release(user: string, id: string): Release;
  recall(user: string, input: { frozenFiles: any[]; query: string }): { context: string };
  run(options: PiRunOptions): Promise<any>;
  prepare(user: string, model: string, maximumUsd: number): Pick<PiRunOptions, 'apiKey' | 'managedBilling' | 'modelLimits' | 'costBudget'>;
  recordReceipt: NonNullable<PiRunOptions['onProviderReceipt']>;
  accounting(user: string, runId: string): Accounting;
  probe?: () => Promise<void>;
  now?: () => number;
};
export class ApptopiaRuntimeError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
const fail = (code: string, status = 400): never => { throw new ApptopiaRuntimeError(code, status); };
const hash = (input: unknown) => createHash('sha256').update(JSON.stringify(input)).digest('hex');
const contentHash = (content: string) => createHash('sha256').update(content, 'utf8').digest('hex');
const ARTIFACT_BYTES = 1024 * 1024;
const RUN_ARTIFACT_COUNT = 20, RUN_ARTIFACT_BYTES = 8 * ARTIFACT_BYTES;
const STORED_ARTIFACT_COUNT = 1000, STORED_ARTIFACT_BYTES = 50 * ARTIFACT_BYTES;
const identifier = (input: unknown): string => {
  if (typeof input !== 'string' || !/^[a-zA-Z0-9_.:-]{1,200}$/.test(input)) fail('MARKETPLACE_ID_INVALID');
  return input as string;
};
function policy(input: any): Policy {
  if (input?.acceptCreatorCosts !== true) fail('MARKETPLACE_COST_CONSENT_REQUIRED');
  if (!Number.isFinite(input.maximumUsdPerRun) || input.maximumUsdPerRun < 0.01 || input.maximumUsdPerRun > 25
    || !Number.isFinite(input.dailyBudgetUsd) || input.dailyBudgetUsd < input.maximumUsdPerRun || input.dailyBudgetUsd > 1000
    || !Number.isInteger(input.maximumConcurrentRuns) || input.maximumConcurrentRuns < 1 || input.maximumConcurrentRuns > 10
    || typeof input.shareReleaseSources !== 'boolean') fail('MARKETPLACE_POLICY_INVALID');
  return { maximumUsdPerRun: input.maximumUsdPerRun, dailyBudgetUsd: input.dailyBudgetUsd,
    maximumConcurrentRuns: input.maximumConcurrentRuns, shareReleaseSources: input.shareReleaseSources };
}

/** This module never acquires a creator's personal thread, Brain or general MCP
 * permissions. A publication grants a fixed evaluated release and explicit caps. */
export function createApptopiaRuntime(deps: Dependencies) {
  const { db } = deps, now = deps.now || Date.now;
  const active = new Map<string, { publicationId: string; controller: AbortController; done: Promise<void> }>();
  // Older installations allowed only one publication per storefront product.
  // Preserve every grant and run while enabling independently pinned releases.
  const legacyProductIndex = db.prepare("PRAGMA index_list('apptopia_publications')").all().some((index: any) => {
    const columns = db.prepare('SELECT name FROM pragma_index_info(?)').all(index.name);
    return index.unique && columns.length === 1 && columns[0].name === 'marketplace_product_id';
  });
  if (legacyProductIndex) {
    const foreignKeys = db.prepare('PRAGMA foreign_keys').get().foreign_keys;
    db.exec('PRAGMA foreign_keys=OFF');
    try {
      db.transaction(() => {
        db.exec(`CREATE TABLE apptopia_publications_next(
          id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),agent_id TEXT NOT NULL,release_id TEXT NOT NULL,
          content_hash TEXT NOT NULL,release_version INTEGER NOT NULL,policy_json TEXT NOT NULL,idempotency_key TEXT NOT NULL,input_hash TEXT NOT NULL,
          marketplace_seller_id TEXT,marketplace_product_id TEXT,revoked_at INTEGER,created_at INTEGER NOT NULL,
          UNIQUE(user_id,idempotency_key));
          INSERT INTO apptopia_publications_next SELECT * FROM apptopia_publications;
          DROP TABLE apptopia_publications;
          ALTER TABLE apptopia_publications_next RENAME TO apptopia_publications;`);
        if (db.prepare('PRAGMA foreign_key_check(apptopia_runs)').all().length) throw new Error('MARKETPLACE_MIGRATION_REFERENCE_INVALID');
      })();
    } finally { db.exec(`PRAGMA foreign_keys=${foreignKeys ? 'ON' : 'OFF'}`); }
  }
  db.exec(`CREATE TABLE IF NOT EXISTS apptopia_publications(
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),agent_id TEXT NOT NULL,release_id TEXT NOT NULL,
    content_hash TEXT NOT NULL,release_version INTEGER NOT NULL,policy_json TEXT NOT NULL,idempotency_key TEXT NOT NULL,input_hash TEXT NOT NULL,
    marketplace_seller_id TEXT,marketplace_product_id TEXT,revoked_at INTEGER,created_at INTEGER NOT NULL,
    UNIQUE(user_id,idempotency_key));
    CREATE TABLE IF NOT EXISTS apptopia_runs(
    id TEXT PRIMARY KEY,publication_id TEXT NOT NULL REFERENCES apptopia_publications(id),buyer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,input_hash TEXT NOT NULL,status TEXT NOT NULL,output TEXT,error TEXT,
    reserved_units INTEGER NOT NULL,charged_units INTEGER,tokens_used INTEGER,cost_pending INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,deadline_at INTEGER NOT NULL,finished_at INTEGER,cancel_requested INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS apptopia_runs_publication ON apptopia_runs(publication_id,created_at);
    CREATE INDEX IF NOT EXISTS apptopia_publications_product ON apptopia_publications(marketplace_product_id);
    CREATE TABLE IF NOT EXISTS apptopia_run_artifacts(
    id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES apptopia_runs(id),tool_call_id TEXT NOT NULL,input_hash TEXT NOT NULL,
    title TEXT NOT NULL,language TEXT NOT NULL,type TEXT NOT NULL,filename TEXT NOT NULL,content TEXT NOT NULL,
    content_sha256 TEXT NOT NULL,size_bytes INTEGER NOT NULL,created_at INTEGER NOT NULL,UNIQUE(run_id,tool_call_id));
    CREATE TRIGGER IF NOT EXISTS apptopia_artifact_immutable BEFORE UPDATE ON apptopia_run_artifacts
    BEGIN SELECT RAISE(ABORT,'MARKETPLACE_ARTIFACT_IMMUTABLE'); END;
    CREATE TRIGGER IF NOT EXISTS apptopia_artifact_receipt_retained BEFORE DELETE ON apptopia_run_artifacts
    BEGIN SELECT RAISE(ABORT,'MARKETPLACE_ARTIFACT_IMMUTABLE'); END;
    CREATE TRIGGER IF NOT EXISTS apptopia_publication_immutable BEFORE UPDATE ON apptopia_publications
    WHEN NEW.user_id!=OLD.user_id OR NEW.agent_id!=OLD.agent_id OR NEW.release_id!=OLD.release_id
      OR NEW.content_hash!=OLD.content_hash OR NEW.release_version!=OLD.release_version OR NEW.policy_json!=OLD.policy_json
      OR (OLD.marketplace_product_id IS NOT NULL AND (NEW.marketplace_product_id IS NOT OLD.marketplace_product_id OR NEW.marketplace_seller_id IS NOT OLD.marketplace_seller_id))
      OR (OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS NOT OLD.revoked_at)
    BEGIN SELECT RAISE(ABORT,'MARKETPLACE_PUBLICATION_IMMUTABLE'); END;
    CREATE TRIGGER IF NOT EXISTS apptopia_run_identity BEFORE UPDATE ON apptopia_runs
    WHEN NEW.publication_id!=OLD.publication_id OR NEW.buyer_id!=OLD.buyer_id OR NEW.product_id!=OLD.product_id OR NEW.input_hash!=OLD.input_hash
      OR NEW.reserved_units!=OLD.reserved_units OR NEW.created_at!=OLD.created_at OR NEW.deadline_at!=OLD.deadline_at
      OR (OLD.status IN ('succeeded','failed','cancelled') AND (NEW.status!=OLD.status OR NEW.output IS NOT OLD.output))
    BEGIN SELECT RAISE(ABORT,'MARKETPLACE_RUN_IMMUTABLE'); END;`);
  const supportedRelease = (user: string, releaseId: string, settings: Policy) => {
    const release = deps.release(user, releaseId);
    // Adding tools requires a corresponding marketplace execution adapter. Reject
    // unsupported capabilities instead of silently selling reduced behavior.
    if (release.configuration.tools.some(tool => !['knowledge_search', 'create_artifact'].includes(tool))) fail('MARKETPLACE_TOOL_ADAPTER_REQUIRED', 409);
    if (release.sourceFiles.length && !settings.shareReleaseSources) fail('MARKETPLACE_SOURCE_CONSENT_REQUIRED', 409);
    return release;
  };
  const publication = (id: string) => {
    const row = db.prepare('SELECT * FROM apptopia_publications WHERE id=?').get(identifier(id));
    if (!row) fail('MARKETPLACE_PUBLICATION_NOT_FOUND', 404);
    return row;
  };
  const viewPublication = (row: any) => ({ id: row.id, agentId: row.agent_id, releaseId: row.release_id,
    contentHash: row.content_hash, version: row.release_version, policy: JSON.parse(row.policy_json), productId: row.marketplace_product_id,
    revoked: row.revoked_at != null, createdAt: row.created_at });
  const publish = db.transaction((user: string, agentId: string, releaseId: string, input: any, key: string) => {
    identifier(user); identifier(agentId); identifier(releaseId); identifier(key);
    const settings = policy(input), digest = hash({ agentId, releaseId, settings });
    const prior = db.prepare('SELECT * FROM apptopia_publications WHERE user_id=? AND idempotency_key=?').get(user, key);
    if (prior) {
      if (prior.input_hash !== digest) fail('MARKETPLACE_KEY_CONFLICT', 409);
      if (prior.revoked_at != null) fail('MARKETPLACE_PUBLICATION_REVOKED', 409);
      return viewPublication(prior);
    }
    const release = supportedRelease(user, releaseId, settings);
    if (release.agentId !== agentId) fail('MARKETPLACE_RELEASE_MISMATCH', 409);
    const id = randomUUID();
    db.prepare('INSERT INTO apptopia_publications(id,user_id,agent_id,release_id,content_hash,release_version,policy_json,idempotency_key,input_hash,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .run(id, user, agentId, releaseId, release.configurationHash, release.version, JSON.stringify(settings), key, digest, now());
    return viewPublication(publication(id));
  });
  const list = (user: string, agentId: string) => db.prepare('SELECT * FROM apptopia_publications WHERE user_id=? AND agent_id=? ORDER BY created_at DESC LIMIT 50').all(identifier(user), identifier(agentId)).map(viewPublication);
  const bind = db.transaction((input: any) => {
    const row = publication(input.publicationId);
    identifier(input.sellerId); identifier(input.productId);
    if (row.user_id !== input.forgeOwnerId || row.content_hash !== input.contentHash || row.release_id !== input.releaseId) fail('MARKETPLACE_BINDING_MISMATCH', 409);
    if (row.revoked_at != null) fail('MARKETPLACE_PUBLICATION_REVOKED', 409);
    if (row.marketplace_product_id && (row.marketplace_product_id !== input.productId || row.marketplace_seller_id !== input.sellerId)) fail('MARKETPLACE_ALREADY_BOUND', 409);
    if (db.prepare(`SELECT id FROM apptopia_publications WHERE marketplace_product_id=?
      AND (marketplace_seller_id<>? OR user_id<>? OR agent_id<>?) LIMIT 1`).get(input.productId, input.sellerId, row.user_id, row.agent_id))
      fail('MARKETPLACE_PRODUCT_OWNER_MISMATCH', 409);
    db.prepare('UPDATE apptopia_publications SET marketplace_product_id=?,marketplace_seller_id=? WHERE id=?').run(input.productId, input.sellerId, row.id);
    return viewPublication(publication(row.id));
  });
  const updateAccounting = (row: any) => {
    const pub = publication(row.publication_id), value = deps.accounting(pub.user_id, `apptopia:${row.id}`);
    // No recorded provider request after a crashed process does not establish that
    // a worker never ran; preserve the full publication hold in that case.
    const pending = value.pending || row.status === 'running' || (['unknown', 'succeeded'].includes(row.status) && !value.requestIds.length);
    db.prepare('UPDATE apptopia_runs SET charged_units=?,tokens_used=?,cost_pending=? WHERE id=?')
      .run(value.chargedUsd == null ? null : Math.ceil(value.chargedUsd * 1e9), value.tokensUsed, pending ? 1 : 0, row.id);
  };
  const savedRun = (buyer: string, product: string, id: string) => {
    const row = db.prepare('SELECT * FROM apptopia_runs WHERE id=? AND buyer_id=? AND product_id=?').get(identifier(id), identifier(buyer), identifier(product));
    if (!row) fail('MARKETPLACE_RUN_NOT_FOUND', 404);
    if (row.status === 'running' && row.deadline_at <= now()) {
      active.get(row.id)?.controller.abort();
      db.prepare("UPDATE apptopia_runs SET status='unknown',error='MARKETPLACE_RESULT_UNCONFIRMED' WHERE id=? AND status='running'").run(row.id);
    }
    if (!active.has(row.id)) updateAccounting(db.prepare('SELECT * FROM apptopia_runs WHERE id=?').get(row.id));
    return db.prepare('SELECT * FROM apptopia_runs WHERE id=?').get(row.id);
  };
  const artifactMetadata = (row: any) => {
    if (!Number.isSafeInteger(row.size_bytes) || row.size_bytes < 1 || row.size_bytes > ARTIFACT_BYTES
      || !/^[a-f0-9]{64}$/.test(row.content_sha256) || row.filename !== artifactFilename(row.title, row.language))
      fail('MARKETPLACE_ARTIFACT_INTEGRITY_FAILED', 409);
    return { id: row.id, title: row.title, filename: row.filename, language: row.language, type: row.type,
      sizeBytes: row.size_bytes, sha256: row.content_sha256, createdAt: row.created_at };
  };
  const artifactsForRun = (id: string) => {
    const rows = db.prepare(`SELECT id,title,filename,language,type,size_bytes,content_sha256,created_at FROM apptopia_run_artifacts
      WHERE run_id=? ORDER BY created_at,id LIMIT ${RUN_ARTIFACT_COUNT + 1}`).all(id);
    if (rows.length > RUN_ARTIFACT_COUNT) fail('MARKETPLACE_ARTIFACT_INTEGRITY_FAILED', 409);
    return rows.map(artifactMetadata);
  };
  const verifiedArtifact = (row: any) => {
    const metadata = artifactMetadata(row);
    if (Buffer.byteLength(row.content, 'utf8') !== row.size_bytes || contentHash(row.content) !== row.content_sha256
      || hash(normalizeArtifactValues(row)) !== row.input_hash) fail('MARKETPLACE_ARTIFACT_INTEGRITY_FAILED', 409);
    return metadata;
  };
  const viewRun = (row: any) => ({ id: row.id, publicationId: row.publication_id, productId: row.product_id, buyerId: row.buyer_id,
    status: row.status, output: row.output, error: row.error, costPending: !!row.cost_pending,
    chargedUsd: row.charged_units == null ? null : row.charged_units / 1e9, tokensUsed: row.tokens_used,
    createdAt: row.created_at, finishedAt: row.finished_at, cancelRequested: !!row.cancel_requested, artifacts: artifactsForRun(row.id) });
  const get = (buyer: string, product: string, id: string) => viewRun(savedRun(buyer, product, id));
  const artifact = (buyer: string, product: string, id: string, artifactId: string) => {
    const run = savedRun(buyer, product, id);
    const row = db.prepare('SELECT * FROM apptopia_run_artifacts WHERE run_id=? AND id=?').get(run.id, identifier(artifactId));
    if (!row) fail('MARKETPLACE_ARTIFACT_NOT_FOUND', 404);
    return { runId: run.id, publicationId: run.publication_id, productId: run.product_id, buyerId: run.buyer_id,
      ...verifiedArtifact(row), contentBase64: Buffer.from(row.content, 'utf8').toString('base64') };
  };
  const toolRelease = (runId: string, pub: any, release: Release, signal: AbortSignal, name: string) => {
    const row = db.prepare('SELECT * FROM apptopia_runs WHERE id=?').get(runId);
    if (signal.aborted || !row || row.status !== 'running' || row.cancel_requested || row.deadline_at <= now()) fail('MARKETPLACE_RUN_NOT_WRITABLE', 409);
    const currentPub = publication(row.publication_id);
    if (currentPub.revoked_at != null) fail('MARKETPLACE_PUBLICATION_REVOKED', 409);
    if (currentPub.id !== pub.id || currentPub.user_id !== pub.user_id || currentPub.marketplace_product_id !== row.product_id)
      fail('MARKETPLACE_BINDING_MISMATCH', 409);
    const current = supportedRelease(currentPub.user_id, currentPub.release_id, JSON.parse(currentPub.policy_json));
    if (current.releaseId !== pub.release_id || current.agentId !== pub.agent_id || current.version !== pub.release_version
      || current.configurationHash !== pub.content_hash || hash(current.sourceFiles) !== hash(release.sourceFiles)) fail('MARKETPLACE_RELEASE_CHANGED', 409);
    if (!release.configuration.tools.includes(name) || !current.configuration.tools.includes(name)) fail('MARKETPLACE_TOOL_NOT_GRANTED', 403);
    return current;
  };
  const saveArtifact = db.transaction((runId: string, pub: any, release: Release, signal: AbortSignal, toolCallId: string, input: any) => {
    if (typeof toolCallId !== 'string' || !toolCallId.trim() || toolCallId.length > 256 || toolCallId.includes('\0')) fail('MARKETPLACE_ARTIFACT_TOOL_CALL_REQUIRED');
    if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.title !== 'string'
      || Object.keys(input).some(key => !['title', 'language', 'type', 'content'].includes(key))) fail('MARKETPLACE_ARTIFACT_INPUT_INVALID');
    const value = normalizeArtifactValues(input);
    if (!value.content.trim()) fail('ARTIFACT_EMPTY_CONTENT');
    const fingerprint = hash(value);
    const run = db.prepare('SELECT * FROM apptopia_runs WHERE id=? AND publication_id=? AND product_id=?').get(runId, pub.id, pub.marketplace_product_id);
    if (!run) fail('MARKETPLACE_BINDING_MISMATCH', 409);
    const prior = db.prepare('SELECT * FROM apptopia_run_artifacts WHERE run_id=? AND tool_call_id=?').get(run.id, toolCallId);
    // A committed receipt remains readable after cancellation/revocation. Only
    // a new insert needs current write authority; an identical replay writes zero.
    if (prior) {
      if (prior.input_hash !== fingerprint) fail('ARTIFACT_TOOL_CALL_CONFLICT', 409);
      return { saved: true, artifactId: prior.id, ...verifiedArtifact(prior) };
    }
    const current = toolRelease(run.id, pub, release, signal, 'create_artifact');
    validateArtifactSources(value, id => {
      const source = current.sourceFiles.find(file => file.id === id);
      if (!source) fail('MARKETPLACE_SOURCE_NOT_GRANTED', 403);
      deps.recall(pub.user_id, { frozenFiles: [source], query: '' });
    });
    const size = Buffer.byteLength(value.content, 'utf8');
    const runUsage = db.prepare('SELECT COUNT(*) count,COALESCE(SUM(size_bytes),0) bytes FROM apptopia_run_artifacts WHERE run_id=?').get(run.id);
    if (runUsage.count >= RUN_ARTIFACT_COUNT || runUsage.bytes + size > RUN_ARTIFACT_BYTES) fail('MARKETPLACE_ARTIFACT_RUN_LIMIT', 413);
    // Hosted storage is independently capped for both the paying creator and
    // the external buyer, without borrowing a private Forge user/thread quota.
    for (const [field, owner] of [['p.user_id', pub.user_id], ['r.buyer_id', run.buyer_id]]) {
      const usage = db.prepare(`SELECT COUNT(*) count,COALESCE(SUM(a.size_bytes),0) bytes FROM apptopia_run_artifacts a
        JOIN apptopia_runs r ON r.id=a.run_id JOIN apptopia_publications p ON p.id=r.publication_id WHERE ${field}=?`).get(owner);
      if (usage.count >= STORED_ARTIFACT_COUNT || usage.bytes + size > STORED_ARTIFACT_BYTES) fail('MARKETPLACE_ARTIFACT_STORAGE_LIMIT', 413);
    }
    const id = randomUUID();
    db.prepare(`INSERT INTO apptopia_run_artifacts(id,run_id,tool_call_id,input_hash,title,language,type,filename,content,content_sha256,size_bytes,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, run.id, toolCallId, fingerprint, value.title, value.language, value.type,
      artifactFilename(value.title, value.language), value.content, contentHash(value.content), size, now());
    const saved = db.prepare('SELECT * FROM apptopia_run_artifacts WHERE id=? AND run_id=?').get(id, run.id);
    return { saved: true, artifactId: id, ...verifiedArtifact(saved) };
  });
  const fromTool = (saveArtifact as typeof saveArtifact & { immediate?: typeof saveArtifact }).immediate || saveArtifact;
  const admit = db.transaction((input: any) => {
    for (const key of ['runId', 'buyerId', 'productId', 'publicationId']) identifier(input[key]);
    if (typeof input.input !== 'string' || !input.input.trim() || Buffer.byteLength(input.input) > 64000) fail('MARKETPLACE_INPUT_INVALID');
    const digest = hash({ publicationId: input.publicationId, buyerId: input.buyerId, productId: input.productId, input: input.input });
    const prior = db.prepare('SELECT * FROM apptopia_runs WHERE id=?').get(input.runId);
    if (prior) {
      if (prior.input_hash !== digest) fail('MARKETPLACE_RUN_CONFLICT', 409);
      return { row: prior, created: false as const };
    }
    const pub = publication(input.publicationId);
    if (pub.revoked_at != null) fail('MARKETPLACE_PUBLICATION_REVOKED', 409);
    if (pub.marketplace_product_id !== input.productId) fail('MARKETPLACE_BINDING_REQUIRED', 403);
    const settings: Policy = JSON.parse(pub.policy_json), release = supportedRelease(pub.user_id, pub.release_id, settings);
    if (release.configurationHash !== pub.content_hash) fail('MARKETPLACE_RELEASE_CHANGED', 409);
    const runs = db.prepare('SELECT * FROM apptopia_runs WHERE publication_id=?').all(pub.id);
    const unresolved = runs.filter((r: any) => ['running', 'unknown'].includes(r.status));
    if (unresolved.some((r: any) => r.buyer_id === input.buyerId)) fail('MARKETPLACE_BUYER_RUN_OPEN', 409);
    if (unresolved.length >= settings.maximumConcurrentRuns) fail('MARKETPLACE_CONCURRENCY_LIMIT', 429);
    const dayStart = Math.floor(now() / 86400000) * 86400000;
    const used = runs.filter((r: any) => r.created_at >= dayStart || r.cost_pending || r.status === 'running')
      .reduce((sum: number, r: any) => sum + (r.cost_pending || r.status === 'running' ? Math.max(r.reserved_units, r.charged_units || 0) : r.charged_units || 0), 0);
    const maximum = Math.ceil(settings.maximumUsdPerRun * 1e9);
    if (used + maximum > Math.floor(settings.dailyBudgetUsd * 1e9)) fail('MARKETPLACE_DAILY_BUDGET_EXHAUSTED', 402);
    // This checks current managed account funds/model availability before admission.
    const prepared = deps.prepare(pub.user_id, release.configuration.model, settings.maximumUsdPerRun);
    if (!prepared.managedBilling || !prepared.apiKey || !prepared.costBudget || prepared.costBudget.maxUsd > settings.maximumUsdPerRun) fail('MARKETPLACE_MANAGED_BUDGET_REQUIRED', 503);
    db.prepare("INSERT INTO apptopia_runs(id,publication_id,buyer_id,product_id,input_hash,status,reserved_units,created_at,deadline_at) VALUES(?,?,?,?,?,'running',?,?,?)")
      .run(input.runId, pub.id, input.buyerId, input.productId, digest, maximum, now(), now() + 10 * 60000);
    return { row: db.prepare('SELECT * FROM apptopia_runs WHERE id=?').get(input.runId), created: true as const, pub, release, prepared };
  });
  const start = (input: any) => {
    const admitted = admit(input);
    if (!admitted.created) return get(input.buyerId, input.productId, input.runId);
    const { row, pub, release, prepared } = admitted;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1, row.deadline_at - now()));
    // Admission is persisted before this task starts. Replays and process restarts
    // only read its saved state; they never create another worker operation.
    const done = Promise.resolve().then(async () => {
      try {
        const knowledge = release.sourceFiles.length ? deps.recall(pub.user_id, { frozenFiles: release.sourceFiles, query: input.input }).context : '';
        const result = await deps.run({ userId: pub.user_id, runId: `apptopia:${row.id}`, provider: 'openrouter', model: release.configuration.model,
          ...prepared, systemPrompt: `${release.configuration.system_prompt}\n\n${knowledge}\nOnly the explicitly supplied marketplace tools and sources are available. Do not claim actions that have not occurred.`,
          input: input.input, messages: [], ecosystem: false, enableMcp: false, maxTurns: 8, maxTokens: 32000, signal: controller.signal,
          tools: [
            { name: 'knowledge_search', description: 'Search only the published source files authorized for this product.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false } },
            { name: 'create_artifact', description: 'Save one immutable downloadable text file for this buyer run. Use only published source IDs; do not supply owner, thread, project or path fields.', parameters: { type: 'object', properties: {
              title: { type: 'string', maxLength: 200 }, language: { type: 'string', maxLength: 40 }, type: { type: 'string', maxLength: 40 },
              content: { type: 'string', minLength: 1, maxLength: ARTIFACT_BYTES },
            }, required: ['title', 'content'], additionalProperties: false } },
          ].filter(tool => release.configuration.tools.includes(tool.name)),
          onProviderReceipt: deps.recordReceipt,
          executeTool: async (name, args, toolCallId) => {
            if (!['knowledge_search', 'create_artifact'].includes(name) || !release.configuration.tools.includes(name)) return { content: { error: 'MARKETPLACE_TOOL_NOT_GRANTED' }, isError: true };
            if (name === 'create_artifact') return { content: fromTool(row.id, pub, release, controller.signal, toolCallId, args) };
            if (typeof args?.query !== 'string' || args.query.length > 4000) return { content: { error: 'MARKETPLACE_QUERY_INVALID' }, isError: true };
            const current = toolRelease(row.id, pub, release, controller.signal, name);
            return { content: deps.recall(pub.user_id, { frozenFiles: current.sourceFiles, query: args.query }).context };
          } });
        if (controller.signal.aborted) throw new Error('MARKETPLACE_CANCELLED');
        const output = result?.content?.trim() ? result.content : savedArtifactReply(result || {}, artifactsForRun(row.id), input.input);
        if (result?.paused || result?.pendingToolCalls?.length || typeof output !== 'string' || !output.trim() || Buffer.byteLength(output) > ARTIFACT_BYTES) throw new Error('MARKETPLACE_RESULT_INCOMPLETE');
        db.prepare("UPDATE apptopia_runs SET status='succeeded',output=?,finished_at=? WHERE id=? AND status IN ('running','unknown')").run(output, now(), row.id);
      } catch {
        // Pi drains receipts and aborts its worker before rejecting. Cancellation
        // terminates local execution, but provider cost may still be pending.
        const status = controller.signal.aborted ? 'cancelled' : 'failed';
        db.prepare("UPDATE apptopia_runs SET status=?,error=?,finished_at=? WHERE id=? AND status IN ('running','unknown')")
          .run(status, status === 'cancelled' ? 'MARKETPLACE_RUN_CANCELLED' : 'MARKETPLACE_EXECUTION_FAILED', now(), row.id);
      } finally { clearTimeout(timer); active.delete(row.id); updateAccounting(db.prepare('SELECT * FROM apptopia_runs WHERE id=?').get(row.id)); }
    }).catch(() => { active.delete(row.id); });
    active.set(row.id, { publicationId: pub.id, controller, done });
    return viewRun(row);
  };
  const cancel = (buyer: string, product: string, id: string) => {
    const row = savedRun(buyer, product, id);
    if (['running', 'unknown'].includes(row.status)) {
      db.prepare('UPDATE apptopia_runs SET cancel_requested=1 WHERE id=?').run(row.id);
      active.get(row.id)?.controller.abort();
    }
    return get(buyer, product, id);
  };
  const revoke = (user: string, id: string) => {
    const row = publication(id);
    if (row.user_id !== user) fail('MARKETPLACE_PUBLICATION_NOT_FOUND', 404);
    db.prepare('UPDATE apptopia_publications SET revoked_at=COALESCE(revoked_at,?) WHERE id=?').run(now(), id);
    for (const task of active.values()) if (task.publicationId === id) task.controller.abort();
    return viewPublication(publication(id));
  };
  const inspect = async (input: any) => {
    const row = publication(input.publicationId);
    if (row.marketplace_seller_id !== input.sellerId || row.marketplace_product_id !== input.productId) fail('MARKETPLACE_BINDING_MISMATCH', 403);
    let ready = false;
    try {
      if (row.revoked_at != null || !deps.probe) throw new Error();
      const release = supportedRelease(row.user_id, row.release_id, JSON.parse(row.policy_json));
      if (release.configurationHash !== row.content_hash) throw new Error();
      const options = deps.prepare(row.user_id, release.configuration.model, JSON.parse(row.policy_json).maximumUsdPerRun);
      if (!options.managedBilling || !options.apiKey || !options.costBudget) throw new Error();
      await deps.probe(); ready = true;
    } catch { /* Explicitly unavailable, never substitute a different runtime. */ }
    return { ...viewPublication(row), ready };
  };
  return { publish, list, bind, start, get, artifact, cancel, revoke, inspect, drain: async () => { await Promise.all([...active.values()].map(task => task.done)); } };
}

export function verifyApptopiaServiceRequest(token: string, operation: string, body: unknown, secret = process.env.FORGE_MARKETPLACE_SECRET || '') {
  if (secret.length < 32) fail('MARKETPLACE_SERVICE_NOT_CONFIGURED', 503);
  let claims: any;
  try { claims = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'apptopia', audience: 'forge:marketplace', maxAge: '60s', clockTolerance: 3 }); }
  catch { fail('MARKETPLACE_SERVICE_AUTH_REQUIRED', 401); }
  if (!claims.exp || typeof claims.iat !== 'number' || claims.iat > Date.now() / 1000 + 3 || claims.exp - claims.iat > 60 || typeof claims.sub !== 'string'
    || !claims.jti || claims.operation !== operation || claims.bodyHash !== hash(body)) fail('MARKETPLACE_SERVICE_AUTH_REQUIRED', 401);
  return claims;
}

export function registerApptopiaRuntimeRoutes(app: any, auth: any, service: ReturnType<typeof createApptopiaRuntime>) {
  const handler = (fn: (req: any) => any) => async (req: any, res: any) => {
    res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    try { res.json({ success: true, data: await fn(req) }); }
    catch (error: any) { res.status(error instanceof ApptopiaRuntimeError ? error.status : 503).json({ success: false, error: error instanceof ApptopiaRuntimeError ? error.code : 'MARKETPLACE_RUNTIME_UNAVAILABLE' }); }
  };
  const signed = (operation: string, fn: (body: any) => any) => handler(req => {
    const claims = verifyApptopiaServiceRequest(String(req.get('Authorization') || '').replace(/^Bearer /, ''), operation, req.body);
    if (claims.sub !== (['bind', 'inspect'].includes(operation) ? req.body.sellerId : req.body.buyerId)) fail('MARKETPLACE_SERVICE_AUTH_REQUIRED', 401);
    return fn(req.body);
  });
  app.get('/api/workspace/agents/:id/apptopia-runtime', auth, handler(req => service.list(req.user.sub, req.params.id)));
  app.post('/api/workspace/agents/:id/apptopia-runtime', auth, handler(req => service.publish(req.user.sub, req.params.id, req.body.releaseId, req.body.policy, req.get('Idempotency-Key'))));
  app.delete('/api/workspace/apptopia-runtime/:id', auth, handler(req => service.revoke(req.user.sub, req.params.id)));
  app.post('/api/internal/apptopia/bind', signed('bind', body => service.bind(body)));
  app.post('/api/internal/apptopia/inspect', signed('inspect', body => service.inspect(body)));
  app.post('/api/internal/apptopia/runs', signed('start', body => service.start(body)));
  app.post('/api/internal/apptopia/result', signed('result', body => service.get(body.buyerId, body.productId, body.runId)));
  app.post('/api/internal/apptopia/artifact', signed('artifact', body => service.artifact(body.buyerId, body.productId, body.runId, body.artifactId)));
  app.post('/api/internal/apptopia/cancel', signed('cancel', body => service.cancel(body.buyerId, body.productId, body.runId)));
}
