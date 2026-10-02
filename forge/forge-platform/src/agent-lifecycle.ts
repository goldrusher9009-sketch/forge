import { createHash, randomUUID } from 'node:crypto';
import { BrainDatabase } from './brain-service';
import { createPersonalLibrary, LibraryError } from './personal-library';
import { getOpenRouterModel, isFreeOpenRouterModel } from './openrouter-catalog';
import { moneyUnits } from './managed-billing';
import { readPortableArchive, portableSourceInstructions, portableIncludedFiles, portableSourceName, PORTABLE_AGENT_TOOLS, PORTABLE_SOURCE_LIMITS } from './apptopia-packages';
import { isLibraryText } from './personal-library';
const { raw } = require('express');

type Rule = { kind: 'contains' | 'excludes' | 'json_keys' | 'citation'; value: string };
type Case = { name: string; prompt: string; rules: Rule[] };
type Configuration = { name: string; system_prompt: string; model: string; tools: string[] };
type Library = ReturnType<typeof createPersonalLibrary>;
type Complete = (user: string, body: any, key: string, signal?: AbortSignal, maximumUsd?: number) => Promise<{ content: string; requestId: string }>;
const fail = (code: string, status = 400): never => { throw new LibraryError(code, status); };
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text = (value: any, max: number): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail('AGENT_RELEASE_INVALID_INPUT');
  return value.trim();
};
function configuration(value: any): Configuration {
  if (!value || !getOpenRouterModel(value.model) || !Array.isArray(value.tools) || value.tools.length > 32
    || value.tools.some((tool: any) => typeof tool !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(tool))) fail('AGENT_RELEASE_INVALID_CONFIGURATION');
  return { name:text(value.name,200), system_prompt:text(value.system_prompt,16000), model:value.model, tools:[...new Set<string>(value.tools)].sort() };
}
// A fixed published version must not inherit the workspace's ambient tools.
// Source lookup and receipt recall are scoped to that version and its task.
export function publishedChatToolNames(value: unknown): string[] {
  const supported = Object.keys(PORTABLE_AGENT_TOOLS);
  if (!Array.isArray(value) || value.some(name => typeof name !== 'string' || !supported.includes(name)))
    fail('AGENT_RELEASE_CHAT_TOOLS_UNAVAILABLE',409);
  return [...new Set([...(value as string[]),'knowledge_search','tool_result_recall'])].sort();
}
export function validateCases(value: any): Case[] {
  if (!Array.isArray(value) || !value.length || value.length > 5) fail('AGENT_EVALUATION_CASES_REQUIRED');
  return value.map((item: any) => {
    if (!item || !Array.isArray(item.rules) || !item.rules.length || item.rules.length > 8) fail('AGENT_EVALUATION_RULES_REQUIRED');
    return { name:text(item.name,100), prompt:text(item.prompt,4000), rules:item.rules.map((rule: any) => {
      if (!rule || !['contains','excludes','json_keys','citation'].includes(rule.kind)) fail('AGENT_EVALUATION_RULE_INVALID');
      const value = rule.kind === 'citation' ? '' : text(rule.value,500);
      if (rule.kind === 'json_keys' && value.split(',').some((key: string) => !key.trim())) fail('AGENT_EVALUATION_RULE_INVALID');
      return { kind:rule.kind, value };
    }) };
  });
}
/** Deterministic checks measure explicit answer properties, not factual quality
 * or successful execution. No arbitrary regular expressions or executable code. */
export function scoreAnswer(answer: string, rules: Rule[], sources: { id: string }[]) {
  return rules.map(rule => {
    let passed = false;
    if (rule.kind === 'contains') passed = answer.toLocaleLowerCase().includes(rule.value.toLocaleLowerCase());
    if (rule.kind === 'excludes') passed = !answer.toLocaleLowerCase().includes(rule.value.toLocaleLowerCase());
    if (rule.kind === 'json_keys') {
      try { const parsed = JSON.parse(answer.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
        passed = !!parsed && !Array.isArray(parsed) && typeof parsed === 'object' && rule.value.split(',').every(key => Object.hasOwn(parsed,key.trim()));
      } catch {}
    }
    if (rule.kind === 'citation') {
      const references = [...answer.matchAll(/\[file:([^\]]+)\]/g)].map(match => match[1]);
      passed = references.length > 0 && references.every(id => sources.some(source => source.id === id));
    }
    return { ...rule, passed:!!answer.trim() && passed };
  });
}

export function createAgentLifecycle(db: BrainDatabase, library: Library, complete: Complete) {
  if (!db.prepare('PRAGMA table_info(threads)').all().some((row: any) => row.name === 'agent_release_id')) db.exec('ALTER TABLE threads ADD COLUMN agent_release_id TEXT');
  db.exec(`CREATE TABLE IF NOT EXISTS agent_evaluation_suites(user_id TEXT NOT NULL,agent_id TEXT NOT NULL,cases_json TEXT NOT NULL,PRIMARY KEY(user_id,agent_id));
    CREATE TABLE IF NOT EXISTS agent_evaluations(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,agent_id TEXT NOT NULL,idempotency_key TEXT NOT NULL,input_hash TEXT NOT NULL,snapshot_json TEXT NOT NULL,suite_json TEXT NOT NULL,status TEXT NOT NULL,results_json TEXT NOT NULL DEFAULT '[]',error TEXT,maximum_usd REAL NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),finished_at TEXT,UNIQUE(user_id,idempotency_key));
    CREATE INDEX IF NOT EXISTS agent_evaluations_owner ON agent_evaluations(user_id,agent_id);
    CREATE TABLE IF NOT EXISTS agent_releases(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,agent_id TEXT NOT NULL,version INTEGER NOT NULL,evaluation_id TEXT NOT NULL,snapshot_json TEXT NOT NULL,content_hash TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),UNIQUE(user_id,agent_id,version),UNIQUE(user_id,agent_id,evaluation_id));`);
  db.exec(`CREATE TABLE IF NOT EXISTS agent_package_imports(
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,input_hash TEXT NOT NULL,agent_id TEXT NOT NULL,
    requires_rebinding INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY(user_id,idempotency_key));`);
  db.exec(`CREATE TABLE IF NOT EXISTS agent_package_source_requirements (
    agent_id TEXT PRIMARY KEY REFERENCES workspace_agents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_hash TEXT NOT NULL,instructions TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS agent_package_source_requirements_immutable BEFORE UPDATE ON agent_package_source_requirements
    BEGIN SELECT RAISE(ABORT,'Imported source requirements are immutable'); END;`);
  const sourceRequirement = (user: string,id: string) => db.prepare('SELECT instructions FROM agent_package_source_requirements WHERE user_id=? AND agent_id=?').get(user,id) as {instructions:string} | undefined;
  const snapshot = (user: string, id: string) => {
    const row = library.agent(user,id);
    if (!row.active) fail('AGENT_DISABLED',409);
    const config = configuration({ ...row, tools:JSON.parse(row.tools || '[]') });
    const bindings = library.getSources(user,id), knowledge = library.recall(user,{agentIds:[id],query:'configuration revision',includeManifest:true});
    const sourceSetup = sourceRequirement(user,id);
    if (sourceSetup && !knowledge.sources.some(source => source.excerpt.trim())) fail('AGENT_PACKAGE_SOURCES_REQUIRED',409);
    const content = { configuration:config, bindings, knowledgeRevision:knowledge.revision, sourceFiles:knowledge.sourceFiles!,
      ...(sourceSetup ? { buyerSourceInstructions:sourceSetup.instructions } : {}) };
    return { ...content, hash:hash(content) };
  };
  const suite = (user: string, id: string): Case[] => {
    library.agent(user,id);
    return JSON.parse(db.prepare('SELECT cases_json FROM agent_evaluation_suites WHERE user_id=? AND agent_id=?').get(user,id)?.cases_json || '[]');
  };
  const saveSuite = (user: string, id: string, input: any) => {
    library.agent(user,id); const cases = validateCases(input);
    db.prepare('INSERT INTO agent_evaluation_suites(user_id,agent_id,cases_json) VALUES(?,?,?) ON CONFLICT(user_id,agent_id) DO UPDATE SET cases_json=excluded.cases_json').run(user,id,JSON.stringify(cases));
    return cases;
  };
  const confirmedZeroCost = (user: string,requestId: string,model: string) => {
    const cost = db.prepare('SELECT state,charged_units,provider_cost_units FROM managed_billing_requests WHERE id=? AND user_id=?').get(requestId,user);
    if (cost?.state !== 'settled' || cost.charged_units !== 0 || cost.provider_cost_units !== 0) return false;
    try {
      const row = db.prepare('SELECT effective_receipt FROM pi_provider_receipts WHERE request_id=? AND user_id=?').get(requestId,user);
      const receipt = JSON.parse(row?.effective_receipt || 'null');
      return receipt?.requestId === requestId && receipt.userId === user && receipt.model === model && receipt.provider === 'openrouter'
        && receipt.state === 'completed' && receipt.usageStatus === 'reported' && receipt.usage?.providerCostUsd === 0;
    } catch { return false; }
  };
  const confirmedEvaluationCost = (user: string,result: any,model: string,zeroBudget: boolean) => {
    if (typeof result.requestId !== 'string' || !Number.isFinite(result.chargeUsd) || result.chargeUsd < 0) return false;
    const cost = db.prepare('SELECT * FROM managed_billing_requests WHERE id=?').get(result.requestId);
    const row = db.prepare('SELECT user_id,effective_receipt FROM pi_provider_receipts WHERE request_id=?').get(result.requestId);
    // The gateway reserves money and records admission in one transaction. Only
    // an explicit unsent attempt may be confirmed when neither record exists.
    if (!cost && !row) return result.status === 'not_sent' && result.chargeUsd === 0;
    if (cost?.user_id !== user || cost.model !== model || row?.user_id !== user
      || !Number.isSafeInteger(cost.charged_units) || cost.charged_units < 0
      || !Number.isSafeInteger(cost.provider_cost_units) || cost.provider_cost_units < 0
      || result.chargeUsd !== cost.charged_units / 1e9) return false;
    try {
      const receipt = JSON.parse(row.effective_receipt);
      if (receipt?.requestId !== result.requestId || receipt.userId !== user || receipt.model !== model || receipt.provider !== 'openrouter') return false;
      if (cost.state === 'released') {
        const rejected = receipt.state === 'rejected' && receipt.usageStatus === 'not_charged' && receipt.httpStatus === 402
          && receipt.zeroChargeEvidence?.source === 'openrouter_http_status'
          && receipt.zeroChargeEvidence.policy === 'openrouter_pre_admission_402_v1' && receipt.zeroChargeEvidence.httpStatus === 402;
        return cost.charged_units === 0 && cost.provider_cost_units === 0
          && (receipt.state === 'not_sent' && receipt.usageStatus === 'not_sent' || rejected);
      }
      const providerCost = receipt.usage?.providerCostUsd;
      return cost.state === 'settled' && ['completed','failed','cancelled'].includes(receipt.state) && receipt.usageStatus === 'reported'
        && typeof providerCost === 'number' && Number.isFinite(providerCost) && providerCost >= 0 && moneyUnits(providerCost) === cost.provider_cost_units
        && (!zeroBudget || providerCost === 0 && cost.charged_units === 0 && cost.provider_cost_units === 0);
    } catch { return false; }
  };
  const evaluation = (user: string, id: string) => {
    const row = db.prepare('SELECT * FROM agent_evaluations WHERE id=? AND user_id=?').get(id,user);
    if (!row) fail('AGENT_EVALUATION_NOT_FOUND',404);
    const results = JSON.parse(row.results_json).map((result: any) => {
      if (result.chargeUsd != null) return result;
      const receipt = db.prepare('SELECT state,charged_units FROM managed_billing_requests WHERE id=? AND user_id=?').get(result.requestId,user);
      if (receipt && ['settled','released'].includes(receipt.state) && receipt.charged_units != null) {
        // Financial reconciliation does not manufacture a missing answer or turn
        // an interrupted evaluation into a passing release check.
        return { ...result,chargeUsd:receipt.charged_units / 1e9,accountingReconciled:true };
      }
      return result;
    }), cases = JSON.parse(row.suite_json), snap = JSON.parse(row.snapshot_json);
    const costPending = results.some((result: any) => !confirmedEvaluationCost(user,result,snap.configuration.model,row.maximum_usd === 0));
    const zeroCostConfirmed = row.maximum_usd === 0 && ['completed','failed','interrupted'].includes(row.status) && !costPending;
    const financialErrors = ['AGENT_EVALUATION_COST_PENDING','AGENT_EVALUATION_ZERO_COST_UNCONFIRMED'];
    let error = row.error;
    if (!costPending && financialErrors.includes(error)) error = null;
    if (costPending && row.status !== 'running' && (!error || financialErrors.includes(error)))
      error = row.maximum_usd === 0 ? 'AGENT_EVALUATION_ZERO_COST_UNCONFIRMED' : 'AGENT_EVALUATION_COST_PENDING';
    return { id:row.id, agentId:row.agent_id, status:row.status, error, createdAt:row.created_at, maximumUsd:row.maximum_usd,
      configurationHash:snap.hash, cases, results, passed:row.status === 'completed' && !costPending && results.length === cases.length && results.every((r: any) => r.status === 'completed' && Number.isFinite(r.chargeUsd) && r.chargeUsd >= 0
        && (row.maximum_usd !== 0 || r.chargeUsd === 0 && confirmedZeroCost(user,r.requestId,snap.configuration.model)) && r.checks.every((check: any) => check.passed)),
      chargeUsd:results.reduce((sum: number,r: any) => sum + (r.chargeUsd ?? 0),0), costPending, zeroCostConfirmed, model:snap.configuration.model };
  };
  const evaluationGate = (user: string,id: string) => {
    let runningCount = 0, costPendingCount = 0;
    // ponytail: scan this agent's full history; index a durable accounting flag
    // only if history size makes this measured admission check too expensive.
    for (const row of db.prepare('SELECT id,status FROM agent_evaluations WHERE user_id=? AND agent_id=?').all(user,id)) {
      if (row.status === 'running') runningCount++;
      else if (evaluation(user,row.id).costPending) costPendingCount++;
    }
    return { blocked:runningCount > 0 || costPendingCount > 0,runningCount,costPendingCount };
  };
  const active = new Set<string>();
  const run = async (user: string, id: string, input: any, key: any, signal?: AbortSignal) => {
    if (typeof key !== 'string' || !/^[A-Za-z0-9_.:-]{8,128}$/.test(key)) fail('AGENT_EVALUATION_KEY_REQUIRED');
    if (!Number.isFinite(input?.maximumUsd) || input.maximumUsd < 0 || input.maximumUsd > 25 || input.maximumUsd > 0 && input.maximumUsd < 0.01) fail('AGENT_EVALUATION_BUDGET_INVALID');
    const operation = db.transaction(() => {
      library.agent(user,id);
      const prior = db.prepare('SELECT * FROM agent_evaluations WHERE user_id=? AND idempotency_key=?').get(user,key);
      if (prior) {
        if (prior.agent_id !== id || prior.maximum_usd !== input.maximumUsd) fail('AGENT_EVALUATION_KEY_CONFLICT',409);
        return { prior:evaluation(user,prior.id) }; // Recovery never redispatches or inherits today's admission gate.
      }
      const gate = evaluationGate(user,id);
      if (gate.runningCount) fail('AGENT_EVALUATION_RUNNING',409);
      if (gate.costPendingCount) fail('AGENT_EVALUATION_COST_UNCONFIRMED',409);
      const cases = validateCases(suite(user,id)), snap = snapshot(user,id), runId = randomUUID();
      if (input.maximumUsd === 0 && !isFreeOpenRouterModel(snap.configuration.model)) fail('AGENT_EVALUATION_ZERO_BUDGET_REQUIRES_FREE_MODEL');
      const contexts = cases.map(item => library.recall(user,{agentIds:[id],query:item.prompt}));
      db.prepare('INSERT INTO agent_evaluations(id,user_id,agent_id,idempotency_key,input_hash,snapshot_json,suite_json,status,maximum_usd) VALUES(?,?,?,?,?,?,?,?,?)')
        .run(runId,user,id,key,hash({ snapshot:snap.hash,cases,maximumUsd:input.maximumUsd }),JSON.stringify(snap),JSON.stringify(cases),'running',input.maximumUsd);
      return { cases,snap,runId,contexts };
    })();
    if ('prior' in operation) return operation.prior;
    const { cases,snap,runId,contexts } = operation;
    active.add(runId); const results: any[] = []; let chargeUsd = 0;
    try {
      for (let index = 0; index < cases.length; index++) {
        if (signal?.aborted) fail('AGENT_EVALUATION_INTERRUPTED',409);
        if (snapshot(user,id).hash !== snap.hash) fail('AGENT_EVALUATION_CONFIGURATION_CHANGED',409);
        const item = cases[index], knowledge = contexts[index], start = Date.now();
        const callKey = `agent-eval:${runId}:${index}`;
        const attempt: any = { name:item.name,prompt:item.prompt,response:'',status:'pending',chargeUsd:null,
          requestId:`managed-${createHash('sha256').update(`${user}\0${callKey}`).digest('hex')}`,sources:knowledge.sources,checks:[] };
        results.push(attempt);
        db.prepare('UPDATE agent_evaluations SET results_json=? WHERE id=?').run(JSON.stringify(results),runId);
        const result = await complete(user,{ model:snap.configuration.model,max_tokens:2048,messages:[
          { role:'system',content:`${snap.configuration.system_prompt}\n\n${knowledge.context}\nThis is an answer evaluation. No execution tools are available. Do not claim to have performed actions.` },
          { role:'user',content:item.prompt },
        ] },callKey,signal,Math.max(0,input.maximumUsd-chargeUsd));
        const cost = db.prepare('SELECT state,charged_units FROM managed_billing_requests WHERE user_id=? AND id=?').get(user,result.requestId);
        if (cost?.state !== 'settled' || cost.charged_units == null) fail('AGENT_EVALUATION_COST_PENDING',409);
        if (!Number.isSafeInteger(cost.charged_units) || cost.charged_units < 0) fail('AGENT_EVALUATION_COST_INVALID',409);
        if (input.maximumUsd === 0 && (result.requestId !== attempt.requestId || !confirmedZeroCost(user,result.requestId,snap.configuration.model))) fail('AGENT_EVALUATION_ZERO_COST_UNCONFIRMED',409);
        const charged = cost.charged_units / 1e9; chargeUsd += charged;
        Object.assign(attempt,{ response:result.content,requestId:result.requestId,status:'completed',chargeUsd:charged,durationMs:Date.now()-start,
          checks:scoreAnswer(result.content,item.rules,knowledge.sources) });
        db.prepare('UPDATE agent_evaluations SET results_json=? WHERE id=?').run(JSON.stringify(results),runId);
      }
      if (snapshot(user,id).hash !== snap.hash) fail('AGENT_EVALUATION_CONFIGURATION_CHANGED',409);
      db.prepare("UPDATE agent_evaluations SET status='completed',finished_at=datetime('now') WHERE id=?").run(runId);
    } catch (error: any) {
      for (const attempt of results.filter(result => result.status === 'pending')) {
        const receipt = db.prepare('SELECT state,charged_units FROM managed_billing_requests WHERE user_id=? AND id=?').get(user,attempt.requestId);
        if (!receipt) { attempt.status = 'not_sent'; attempt.chargeUsd = 0; }
        else if (['settled','released'].includes(receipt.state) && receipt.charged_units != null) { attempt.status = 'failed'; attempt.chargeUsd = receipt.charged_units / 1e9; }
        else attempt.status = 'cost_pending';
      }
      db.prepare('UPDATE agent_evaluations SET results_json=? WHERE id=?').run(JSON.stringify(results),runId);
      db.prepare("UPDATE agent_evaluations SET status=?,error=?,finished_at=datetime('now') WHERE id=?")
        .run(signal?.aborted ? 'interrupted':'failed',error.code || 'AGENT_EVALUATION_FAILED',runId);
    } finally { active.delete(runId); }
    return evaluation(user,runId);
  };
  const releases = (user: string,id: string) => {
    library.agent(user,id);
    return db.prepare('SELECT id,version,evaluation_id,content_hash,created_at FROM agent_releases WHERE user_id=? AND agent_id=? ORDER BY version DESC LIMIT 50').all(user,id);
  };
  const release = (user: string,agentId: string,id: string) => {
    library.agent(user,agentId);
    const row = db.prepare('SELECT * FROM agent_releases WHERE user_id=? AND agent_id=? AND id=?').get(user,agentId,id);
    if (!row) fail('AGENT_RELEASE_NOT_FOUND',404);
    return row;
  };
  const publish = db.transaction((user: string,id: string,evaluationId: string) => {
    const snap = snapshot(user,id), tested = evaluation(user,evaluationId);
    if (tested.agentId !== id || !tested.passed) fail('AGENT_RELEASE_PASS_REQUIRED',409);
    if (tested.configurationHash !== snap.hash || hash(tested.cases) !== hash(suite(user,id))) fail('AGENT_RELEASE_STALE_EVALUATION',409);
    const existing = db.prepare('SELECT id FROM agent_releases WHERE user_id=? AND agent_id=? AND evaluation_id=?').get(user,id,evaluationId);
    if (existing) return release(user,id,existing.id);
    const version = Number(db.prepare('SELECT COALESCE(MAX(version),0)+1 n FROM agent_releases WHERE user_id=? AND agent_id=?').get(user,id).n);
    const releaseId = randomUUID();
    db.prepare('INSERT INTO agent_releases(id,user_id,agent_id,version,evaluation_id,snapshot_json,content_hash) VALUES(?,?,?,?,?,?,?)')
      .run(releaseId,user,id,version,evaluationId,JSON.stringify(snap),snap.hash);
    return release(user,id,releaseId);
  });
  const restore = db.transaction((user: string,id: string,releaseId: string) => {
    const snap = JSON.parse(release(user,id,releaseId).snapshot_json), config = configuration(snap.configuration);
    library.setSources(user,id,snap.bindings); // Revalidates ownership and existence atomically.
    db.prepare("UPDATE workspace_agents SET name=?,system_prompt=?,model=?,tools=?,updated_at=datetime('now') WHERE user_id=? AND id=?")
      .run(config.name,config.system_prompt,config.model,JSON.stringify(config.tools),user,id);
    return snapshot(user,id);
  });
  const exportRelease = (user: string,id: string,releaseId: string) => {
    const row = release(user,id,releaseId), snap = JSON.parse(row.snapshot_json), tested = evaluation(user,row.evaluation_id);
    const data = { format:'forge.agent',schemaVersion:1,configuration:snap.configuration,
      knowledge:{ requiresRebinding:!!(snap.bindings.fileIds.length || snap.bindings.folderIds.length) },
      evaluation:{ kind:'deterministic-answer-checks',caseCount:tested.cases.length,passed:tested.passed },version:row.version };
    return { ...data,sha256:hash(data) }; // Integrity only, not a signature or transferable trust.
  };
  // Seller documents leave Forge only as the frozen, text-extracted files pinned
  // by the release manifest, each rechecked against its recorded hashes.
  const releaseSourceFiles = (user: string,id: string,releaseId: string) => {
    const snap = JSON.parse(release(user,id,releaseId).snapshot_json);
    if (!Array.isArray(snap.sourceFiles) || !snap.sourceFiles.length) fail('AGENT_RELEASE_SOURCES_UNAVAILABLE',409);
    library.recall(user,{query:'',frozenFiles:snap.sourceFiles});
    if (snap.sourceFiles.length > PORTABLE_SOURCE_LIMITS.files) fail('AGENT_RELEASE_SOURCES_TOO_LARGE',409);
    let total = 0;
    return (snap.sourceFiles as any[]).map((expected: any) => {
      const row = library.file(user,expected.id);
      if (!isLibraryText(row.filename,row.mime_type) || row.extraction_status === 'failed' || !row.content || (row.sha256 && row.sha256 !== expected.sha256) || !portableSourceName(row.filename)) fail('AGENT_RELEASE_SOURCES_UNSUPPORTED',409);
      const bytes = Buffer.from(row.content,'utf8');
      if (bytes.length > PORTABLE_SOURCE_LIMITS.fileBytes || (total += bytes.length) > PORTABLE_SOURCE_LIMITS.totalBytes) fail('AGENT_RELEASE_SOURCES_TOO_LARGE',409);
      return { id:row.id, filename:row.filename, content:row.content, sha256:createHash('sha256').update(bytes).digest('hex'), bytes:bytes.length };
    });
  };
  const importPackage = db.transaction((user: string,input: any,key?: string) => {
    if (!db.prepare('SELECT id FROM users WHERE id=?').get(user)) fail('AUTHENTICATION_REQUIRED',401);
    let includedSources: Array<{ path: string; filename: string; sha256: string; bytes: number; content: string }> = [];
    if (Buffer.isBuffer(input)) {
      try { const archive = readPortableArchive(input); input = archive.agent; includedSources = archive.sources; } catch { fail('AGENT_PACKAGE_ZIP_INVALID'); }
      // ZIP and its contained JSON recover the same ordinary workspace import.
      key ??= `package-import:${input.sha256}`;
    }
    if (key !== undefined && (typeof key !== 'string' || !/^[A-Za-z0-9_.:-]{8,128}$/.test(key))) fail('AGENT_IMPORT_KEY_INVALID');
    if (!input || Buffer.byteLength(JSON.stringify(input)) > 64000 || input.format !== 'forge.agent' || ![1,2,3,4].includes(input.schemaVersion)) fail('AGENT_PACKAGE_INVALID');
    const { sha256,...content } = input;
    if (sha256 !== hash(content)) fail('AGENT_PACKAGE_INTEGRITY_FAILED');
    let sourceInstructions: string | null = null, includedFiles: ReturnType<typeof portableIncludedFiles> = [];
    try { sourceInstructions = portableSourceInstructions(input); includedFiles = portableIncludedFiles(input); }
    catch (error: any) { fail(['AGENT_PACKAGE_TOOL_SETUP_INVALID','AGENT_PACKAGE_SOURCE_FILES_INVALID'].includes(error.message) ? error.message : 'AGENT_PACKAGE_SOURCE_SETUP_INVALID'); }
    // The JSON entry alone cannot carry included documents: the original ZIP is required.
    if (includedFiles.length && (includedSources.length !== includedFiles.length || includedFiles.some((file: { sha256: string },index: number) => includedSources[index].sha256 !== file.sha256))) fail('AGENT_PACKAGE_ZIP_REQUIRED');
    const prior = key === undefined ? null : db.prepare('SELECT * FROM agent_package_imports WHERE user_id=? AND idempotency_key=?').get(user,key);
    if (prior) {
      if (prior.input_hash !== sha256) fail('AGENT_IMPORT_KEY_CONFLICT',409);
      const saved = db.prepare('SELECT id,active FROM workspace_agents WHERE id=? AND user_id=?').get(prior.agent_id,user);
      if (!saved) fail('AGENT_IMPORT_DRAFT_REMOVED',410);
      if (!saved.active) fail('AGENT_DISABLED',409);
      // Return the original identity without resetting edits, sources or evaluation.
      return { id:saved.id,requiresRebinding:!!prior.requires_rebinding,requiresEvaluation:true,replayed:true };
    }
    const config = configuration(input.configuration), id = randomUUID();
    db.prepare('INSERT INTO workspace_agents(id,user_id,name,system_prompt,model,tools) VALUES(?,?,?,?,?,?)')
      .run(id,user,config.name,config.system_prompt,config.model,JSON.stringify(config.tools));
    if (includedSources.length) {
      // Included documents become ordinary buyer-owned library files in a new
      // folder, subject to the buyer's own storage quota, and are attached as sources.
      let folder: any;
      for (let attempt = 0; !folder; attempt++) {
        try { folder = library.createFolder(user,{ name:`${config.name.slice(0,120)} · ${sha256.slice(0,8)}${attempt ? ` (${attempt})` : ''}` }); }
        catch (error: any) { if (error.code !== 'LIBRARY_FOLDER_EXISTS' || attempt >= 20) throw error; }
      }
      const fileIds = includedSources.map((file: { filename: string; content: string }) => library.storeFile(user,{ filename:file.filename, content:file.content, mime_type:'text/plain', folder_id:folder.id },
        file.content.slice(0,50000), file.content.length > 50000 ? 'partial' : 'ready').id);
      library.setSources(user,id,{ fileIds, folderIds:[] });
    }
    if (sourceInstructions) db.prepare('INSERT INTO agent_package_source_requirements(agent_id,user_id,package_hash,instructions) VALUES(?,?,?,?)')
      .run(id,user,sha256,sourceInstructions);
    if (key !== undefined) db.prepare('INSERT INTO agent_package_imports(user_id,idempotency_key,input_hash,agent_id,requires_rebinding) VALUES(?,?,?,?,?)')
      .run(user,key,sha256,id,input.knowledge?.requiresRebinding === true ? 1 : 0);
    // Source bindings, historical answers and release trust are never imported.
    return { id,requiresRebinding:input.knowledge?.requiresRebinding === true,requiresEvaluation:true,replayed:false,importedSourceFiles:includedSources.length };
  });
  const status = (user: string,id: string) => {
    library.agent(user,id);
    const evaluations = db.prepare('SELECT id FROM agent_evaluations WHERE user_id=? AND agent_id=? ORDER BY rowid DESC LIMIT 20').all(user,id).map(row => {
      const value = evaluation(user,row.id);
      return { ...value,locallyActive:active.has(row.id) };
    });
    let currentHash: string | null = null;
    try { currentHash = snapshot(user,id).hash; } catch {}
    const required = sourceRequirement(user,id);
    const knowledge = required ? library.recall(user,{agentIds:[id],query:'source setup'}) : null;
    return { cases:suite(user,id),evaluations,evaluationGate:evaluationGate(user,id),releases:releases(user,id),currentHash,
      buyerSourceSetup: required ? { instructions:required.instructions, ready:!!knowledge?.sources.some(source => source.excerpt.trim()), readableFiles:knowledge ? knowledge.selectedFiles-knowledge.unreadableFiles : 0 } : null,
      scope:'Deterministic answer checks only; tool execution and factual correctness are not certified.' };
  };
  const published = (user: string) => {
    if (!db.prepare('SELECT id FROM users WHERE id=?').get(user)) fail('AUTHENTICATION_REQUIRED',401);
    return db.prepare(`SELECT r.* FROM agent_releases r JOIN workspace_agents a ON a.id=r.agent_id AND a.user_id=r.user_id
      WHERE r.user_id=? AND a.active=1 AND r.version=(SELECT MAX(v.version) FROM agent_releases v WHERE v.user_id=r.user_id AND v.agent_id=r.agent_id)
      ORDER BY r.rowid DESC LIMIT 100`).all(user).map(row => {
      const snap = JSON.parse(row.snapshot_json);
      return { agentId:row.agent_id,releaseId:row.id,version:row.version,name:snap.configuration.name,model:snap.configuration.model,
        configurationHash:row.content_hash,requiresSourceBinding:!!(snap.bindings.fileIds.length || snap.bindings.folderIds.length),
        evaluationScope:'deterministic-answer-checks',publishedAt:row.created_at };
    });
  };
  const executionRelease = (user: string, releaseId: string) => {
    const row = db.prepare('SELECT * FROM agent_releases WHERE id=? AND user_id=?').get(releaseId,user);
    if (!row) fail('AGENT_RELEASE_NOT_FOUND',404);
    if (!library.agent(user,row.agent_id).active) fail('AGENT_DISABLED',409);
    const snap = JSON.parse(row.snapshot_json);
    let sourceFiles = snap.sourceFiles;
    if (!sourceFiles) {
      // Migrate old snapshots only if all legacy configuration and source
      // evidence still matches. Never infer an old source set from a new draft.
      const {sourceFiles:files,...legacy} = snapshot(user,row.agent_id); delete (legacy as any).hash;
      if (hash(legacy) !== row.content_hash) fail('AGENT_RELEASE_REPUBLISH_REQUIRED',409);
      sourceFiles = files;
      // Add the verified manifest once, retaining the original published hash
      // and configuration. Subsequent draft changes must not affect this pin.
      db.prepare('UPDATE agent_releases SET snapshot_json=? WHERE id=? AND user_id=?').run(JSON.stringify({...snap,sourceFiles}),row.id,user);
    }
    library.recall(user,{query:'',frozenFiles:sourceFiles});
    return {agentId:row.agent_id,releaseId:row.id,version:row.version,configurationHash:row.content_hash,configuration:configuration(snap.configuration),sourceFiles};
  };
  const releaseSummary = (user: string,id: string) => {
    const row = db.prepare('SELECT * FROM agent_releases WHERE user_id=? AND id=?').get(user,id);
    if (!row) return null;
    const config = JSON.parse(row.snapshot_json).configuration;
    return {agentId:row.agent_id,releaseId:row.id,version:row.version,name:config.name,model:config.model,configurationHash:row.content_hash};
  };
  return { status,suite,saveSuite,run,evaluation,publish,restore,exportRelease,releaseSourceFiles,importPackage,snapshot,published,executionRelease,releaseSummary };
}

export function registerAgentLifecycleRoutes(app: any,auth: any,service: ReturnType<typeof createAgentLifecycle>) {
  const handler = (fn: (user: string,req: any,signal: AbortSignal) => any) => async (req: any,res: any) => {
    const controller = new AbortController(), abort = () => controller.abort();
    req.once('aborted',abort); res.once('close',abort);
    try { const user = req.user?.sub || req.user?.id; if (!user) fail('AUTHENTICATION_REQUIRED',401);
      const data = await fn(user,req,controller.signal);
      res.set('Cache-Control','no-store').json({ success:true,data });
    } catch (error: any) { res.status(error instanceof LibraryError ? error.status : error.statusCode || 500).json({ success:false,error:error.code || 'AGENT_LIFECYCLE_FAILED' }); }
    finally { req.removeListener('aborted',abort); res.removeListener('close',abort); }
  };
  app.post('/api/agent-packages/import',auth,handler((u,r) => service.importPackage(u,r.body,r.get('Idempotency-Key'))));
  app.post('/api/agent-packages/import-zip',auth,raw({type:'application/zip',limit:1048576,inflate:false}),handler((u,r) => {
    if (!Buffer.isBuffer(r.body)) fail('AGENT_PACKAGE_ZIP_INVALID');
    return service.importPackage(u,r.body,r.get('Idempotency-Key'));
  }), (error: any,_req: any,res: any,_next: any) => res.status(error.status === 413 ? 413 : 400).json({success:false,error:error.status === 413 ? 'AGENT_PACKAGE_ZIP_TOO_LARGE' : 'AGENT_PACKAGE_ZIP_INVALID'}));
  app.get('/api/desktop/agents',auth,handler(u => service.published(u)));
  app.get('/api/desktop/agents/:id/releases/:releaseId/package',auth,handler((u,r) => service.exportRelease(u,r.params.id,r.params.releaseId)));
  app.get('/api/workspace-agents/:id/lifecycle',auth,handler((u,r) => service.status(u,r.params.id)));
  app.put('/api/workspace-agents/:id/evaluation-suite',auth,handler((u,r) => service.saveSuite(u,r.params.id,r.body.cases)));
  app.post('/api/workspace-agents/:id/evaluations',auth,handler((u,r,s) => service.run(u,r.params.id,r.body,r.get('Idempotency-Key'),s)));
  app.post('/api/workspace-agents/:id/releases',auth,handler((u,r) => service.publish(u,r.params.id,r.body.evaluationId)));
  app.post('/api/workspace-agents/:id/releases/:releaseId/restore',auth,handler((u,r) => service.restore(u,r.params.id,r.params.releaseId)));
  app.get('/api/workspace-agents/:id/releases/:releaseId/package',auth,handler((u,r) => service.exportRelease(u,r.params.id,r.params.releaseId)));
}
