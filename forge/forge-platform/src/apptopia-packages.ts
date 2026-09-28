import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { createAgentLifecycle } from './agent-lifecycle';
import { ApptopiaRuntimeError, verifyApptopiaServiceRequest } from './apptopia-runtime';

type Database = { exec(sql: string): unknown; prepare(sql: string): any; transaction<T extends (...args: any[]) => any>(fn: T): T };
const fail = (code: string, status = 400): never => { throw new ApptopiaRuntimeError(code, status); };
const digest = (input: string | Buffer) => createHash('sha256').update(input).digest('hex');
const text = (value: unknown, min: number, max: number) => {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail('MARKETPLACE_PACKAGE_TERMS_INVALID');
  return (value as string).trim();
};

export const PORTABLE_AGENT_TOOLS: Record<string,string> = {
  create_artifact:'Create downloadable files',web_search:'Search the public web',web_scrape:'Read public webpages',
  http_request:'Read public API data',knowledge_search:'Search attached documents',tool_result_recall:'Read this task’s tool receipts',
};
export function portableToolNames(agent: any): string[] {
  if (![3,4].includes(agent?.schemaVersion)) return [];
  const tools = agent.configuration?.tools;
  if (!Array.isArray(tools) || (agent.schemaVersion === 3 && !tools.length) || tools.length > 6 || new Set(tools).size !== tools.length
    || tools.some(name => typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(PORTABLE_AGENT_TOOLS,name)))
    throw new Error('AGENT_PACKAGE_TOOL_SETUP_INVALID');
  return [...tools].sort();
}
// Schema 4 packages carry the seller's frozen text documents as inspectable
// archive entries. The manifest below is the only trusted index of those entries.
export const PORTABLE_SOURCE_LIMITS = { files: 12, fileBytes: 131072, totalBytes: 409600 };
export type PortableIncludedFile = { path: string; filename: string; sha256: string; bytes: number };
// Mirrors the marketplace's portable path rules so a prepared package is never rejected later.
export const portableSourceName = (value: unknown) =>
  typeof value === 'string' && !!value.trim() && value.length <= 120 && value === value.trim() && !/[\x00-\x1f\x7f/\\:<>"|?*]/.test(value)
  && !/[. ]$/.test(value) && !['.','..'].includes(value) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(value) && !/^\.env(?:$|\.)/i.test(value);
export function portableIncludedFiles(agent: any): PortableIncludedFile[] {
  if (agent?.schemaVersion !== 4) return [];
  const files = agent.knowledge?.includedFiles;
  if (agent.knowledge?.requiresRebinding !== false || !Array.isArray(files) || !files.length || files.length > PORTABLE_SOURCE_LIMITS.files) throw new Error('AGENT_PACKAGE_SOURCE_FILES_INVALID');
  let total = 0;
  const seen = new Set<string>();
  const parsed = (files as any[]).map((file: any, index: number) => {
    if (!file || typeof file !== 'object' || !portableSourceName(file.filename) || typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(file.sha256)
      || !Number.isInteger(file.bytes) || file.bytes < 1 || file.bytes > PORTABLE_SOURCE_LIMITS.fileBytes || file.path !== `sources/${index + 1}-${file.filename}`
      || Object.keys(file).sort().join() !== 'bytes,filename,path,sha256') throw new Error('AGENT_PACKAGE_SOURCE_FILES_INVALID');
    total += file.bytes;
    if (seen.has(file.filename.toLowerCase())) throw new Error('AGENT_PACKAGE_SOURCE_FILES_INVALID');
    seen.add(file.filename.toLowerCase());
    return { path: file.path, filename: file.filename, sha256: file.sha256, bytes: file.bytes };
  });
  if (total > PORTABLE_SOURCE_LIMITS.totalBytes) throw new Error('AGENT_PACKAGE_SOURCE_FILES_INVALID');
  return parsed;
}
export function portableSourceInstructions(agent: any): string | null {
  if (agent?.schemaVersion === 4) {
    portableToolNames(agent); portableIncludedFiles(agent);
    if (agent.knowledge.setupInstructions !== undefined) throw new Error('AGENT_PACKAGE_SOURCE_SETUP_INVALID');
    return null;
  }
  if (agent?.schemaVersion === 3) {
    portableToolNames(agent);
    if (agent.knowledge?.requiresRebinding === false && agent.knowledge.setupInstructions === undefined) return null;
  }
  if (![2,3].includes(agent?.schemaVersion)) return null;
  const instructions = agent.knowledge?.setupInstructions;
  if (agent.knowledge?.requiresRebinding !== true || typeof instructions !== 'string'
    || instructions.trim().length < 80 || instructions.length > 4000
    || !Array.isArray(agent.configuration?.tools) || (agent.schemaVersion === 2 && agent.configuration.tools.length))
    throw new Error('AGENT_PACKAGE_SOURCE_SETUP_INVALID');
  return instructions.trim();
}

// This writer accepts four fixed, application-owned filenames and bounded text.
// It never reads a user path or archives the creator's workspace.
export function portableZip(files: Record<string, string>) {
  const local: Buffer[] = [], central: Buffer[] = []; let offset = 0;
  for (const [filename, value] of Object.entries(files)) {
    const name = Buffer.from(filename), bytes = Buffer.from(value);
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
    crc = (crc ^ 0xffffffff) >>> 0;
    const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(33, 12); header.writeUInt32LE(crc, 14); header.writeUInt32LE(bytes.length, 18); header.writeUInt32LE(bytes.length, 22); header.writeUInt16LE(name.length, 26);
    const entry = Buffer.alloc(46); entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20, 4); header.copy(entry, 6, 4, 30); entry.writeUInt32LE(offset, 42);
    local.push(header, name, bytes); central.push(entry, name); offset += header.length + name.length + bytes.length;
  }
  const index = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(local.length / 3, 8); end.writeUInt16LE(local.length / 3, 10); end.writeUInt32LE(index.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, index, end]);
}

/** Read only the original four-file, stored ZIP emitted above. Comparing the
 * complete archive to its canonical encoding validates CRCs and both indexes
 * without extracting files or accepting general-purpose executable archives. */
export function readPortableArchive(bytes: Buffer): { agent: any; sources: Array<PortableIncludedFile & { content: string }> } {
  const invalid = (): never => { throw new Error('AGENT_PACKAGE_ZIP_INVALID'); };
  if (!Buffer.isBuffer(bytes) || bytes.length > 1048576) invalid();
  const names = ['apptopia-package.json','agent.forge-agent.json','INSTALL.md','LICENSE.txt'];
  const files: Record<string,string> = {}; let offset = 0;
  const readEntry = (name: string) => {
    if (offset + 30 > bytes.length || bytes.readUInt32LE(offset) !== 0x04034b50) invalid();
    const size = bytes.readUInt32LE(offset+18), length = bytes.readUInt16LE(offset+26), extra = bytes.readUInt16LE(offset+28);
    const start = offset+30+length+extra, end = start+size;
    if (size > 131072 || end > bytes.length || extra !== 0 || bytes.subarray(offset+30,offset+30+length).toString('utf8') !== name) invalid();
    const raw = bytes.subarray(start,end);
    files[name] = new TextDecoder('utf-8',{fatal:true}).decode(raw); offset = end;
    return raw;
  };
  try {
    for (const name of names) readEntry(name);
    const descriptor = JSON.parse(files['apptopia-package.json']), agent = JSON.parse(files['agent.forge-agent.json']);
    const tools = portableToolNames(agent), sources = portableSourceInstructions(agent), included = portableIncludedFiles(agent);
    const contents = included.map((file: PortableIncludedFile) => {
      const raw = readEntry(file.path);
      if (raw.length !== file.bytes || digest(raw) !== file.sha256) invalid();
      return { ...file, content: files[file.path] };
    });
    if (!portableZip(files).equals(bytes) || !files['INSTALL.md'].trim() || !files['LICENSE.txt'].trim()) invalid();
    if (descriptor.schemaVersion !== 'apptopia.package/v1' || descriptor.runtime?.name !== 'Forge'
      || descriptor.entrypoint !== names[1] || descriptor.instructions !== names[2] || descriptor.license !== names[3]
      || descriptor.modelCosts !== 'buyer_provider_account' || descriptor.name !== agent.configuration?.name
      || descriptor.version !== `${agent.version}.0.0`
      || !((agent.schemaVersion === 1 && agent.knowledge?.requiresRebinding === false)
        || (agent.schemaVersion === 2 && sources) || (agent.schemaVersion === 3 && tools.length) || (agent.schemaVersion === 4 && included.length))
      || !Array.isArray(agent.configuration?.tools) || (![3,4].includes(agent.schemaVersion) && agent.configuration.tools.length)) invalid();
    return { agent, sources: contents };
  } catch { return invalid(); }
}
export function readPortableZip(bytes: Buffer) { return readPortableArchive(bytes).agent; }

export function createApptopiaPackages(db: Database, lifecycle: Pick<ReturnType<typeof createAgentLifecycle>, 'exportRelease' | 'releaseSourceFiles'>) {
  db.exec(`CREATE TABLE IF NOT EXISTS apptopia_portable_packages (
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL,agent_id TEXT NOT NULL,release_id TEXT NOT NULL,input_hash TEXT NOT NULL,
    manifest_json TEXT NOT NULL,package_bytes BLOB NOT NULL,package_digest TEXT NOT NULL,version INTEGER NOT NULL,
    marketplace_seller_id TEXT,revoked_at INTEGER,created_at INTEGER NOT NULL,UNIQUE(user_id,release_id,input_hash));
    CREATE TRIGGER IF NOT EXISTS apptopia_portable_package_immutable BEFORE UPDATE ON apptopia_portable_packages
    WHEN NEW.id<>OLD.id OR NEW.user_id<>OLD.user_id OR NEW.agent_id<>OLD.agent_id OR NEW.release_id<>OLD.release_id
      OR NEW.input_hash<>OLD.input_hash OR NEW.manifest_json<>OLD.manifest_json OR NEW.package_bytes<>OLD.package_bytes
      OR NEW.package_digest<>OLD.package_digest OR NEW.version<>OLD.version OR NEW.created_at<>OLD.created_at
      OR (OLD.marketplace_seller_id IS NOT NULL AND NEW.marketplace_seller_id IS NOT OLD.marketplace_seller_id)
      OR (OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS NOT OLD.revoked_at)
    BEGIN SELECT RAISE(ABORT,'Marketplace portable package is immutable'); END;`);
  const prepare = db.transaction((user: string, agentId: string, releaseId: string, input: any) => {
    if (input?.acceptConfigurationSharing !== true || input?.acceptRedistributionRights !== true) fail('MARKETPLACE_PACKAGE_CONSENT_REQUIRED');
    let exported = lifecycle.exportRelease(user, agentId, releaseId);
    const includeSources = input.includeSourceFiles === true;
    if (includeSources && !exported.knowledge.requiresRebinding) fail('MARKETPLACE_PACKAGE_SOURCE_FILES_UNAVAILABLE', 409);
    if (includeSources && input.buyerSourceInstructions !== undefined) fail('MARKETPLACE_PACKAGE_TERMS_INVALID');
    if (includeSources && input.acceptSourceFileRedistribution !== true) fail('MARKETPLACE_PACKAGE_SOURCE_FILES_CONSENT_REQUIRED', 409);
    const includedSources = includeSources ? lifecycle.releaseSourceFiles(user, agentId, releaseId) : [];
    const sourceInstructions = exported.knowledge.requiresRebinding && !includeSources ? text(input.buyerSourceInstructions, 80, 4000) : null;
    if (sourceInstructions && input.acceptBuyerSourceSetup !== true) fail('MARKETPLACE_PACKAGE_SOURCE_SETUP_CONSENT_REQUIRED', 409);
    const tools: string[] = exported.configuration.tools;
    if (tools.some(name => !Object.prototype.hasOwnProperty.call(PORTABLE_AGENT_TOOLS,name))) fail('MARKETPLACE_PACKAGE_TOOLS_UNSUPPORTED', 409);
    if (tools.length && input.acceptToolCapabilities !== true) fail('MARKETPLACE_PACKAGE_TOOL_CONSENT_REQUIRED',409);
    if (sourceInstructions) {
      const { sha256: _originalChecksum, ...configuration } = exported;
      const data = { ...configuration, schemaVersion: 2, knowledge: { requiresRebinding: true, setupInstructions: sourceInstructions } };
      exported = { ...data, sha256: digest(JSON.stringify(data)) };
    }
    if (tools.length) {
      const { sha256: _sourceChecksum,...data } = exported;
      const withTools = {...data,schemaVersion:3};
      exported = {...withTools,sha256:digest(JSON.stringify(withTools))};
    }
    const includedFiles: PortableIncludedFile[] = includedSources.map((file: { filename: string; sha256: string; bytes: number }, index: number) => ({ path: `sources/${index + 1}-${file.filename}`, filename: file.filename, sha256: file.sha256, bytes: file.bytes }));
    if (includeSources) {
      const { sha256: _toolChecksum, ...data } = exported;
      const withFiles = { ...data, schemaVersion: 4, knowledge: { requiresRebinding: false, includedFiles } };
      exported = { ...withFiles, sha256: digest(JSON.stringify(withFiles)) };
      portableIncludedFiles(exported);
    }
    if (!Number.isInteger(input.amountCents) || input.amountCents < 100 || input.amountCents > 10000000
      || !Number.isInteger(input.downloadDays) || input.downloadDays < 1 || input.downloadDays > 3650
      || !['individual', 'organization'].includes(input.licenseScope)) fail('MARKETPLACE_PACKAGE_TERMS_INVALID');
    const summary = text(input.summary, 20, 280), license = text(input.license, 80, 16000), licenseSummary = text(input.licenseSummary, 30, 2000);
    const instructions = text(input.instructions, 40, 8000), outcome = text(input.outcome, 3, 180), supportEmail = text(input.supportEmail, 5, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) fail('MARKETPLACE_PACKAGE_TERMS_INVALID');
    const version = `${exported.version}.0.0`, name = text(exported.configuration.name, 3, 100);
    let dataPolicy = 'Agent configuration runs in the buyer\'s Forge workspace. Prompts and answers are processed by Forge and its configured model provider under the buyer\'s account. Seller documents, account credentials and prior conversations are not included.';
    if (includeSources) dataPolicy += ' The seller’s included documents are copied into the buyer’s Forge personal library and attached to the imported agent. They are licensed under the package license, not for further redistribution.';
    if (tools.length) dataPolicy += ' Declared tools run under the buyer’s Forge account. Created files are stored in that buyer’s task. Declared web tools send requested URLs and queries to public websites. Workspace memory, account integrations, subagents and host commands are unavailable.';
    const descriptor = { schemaVersion: 'apptopia.package/v1', name, version, runtime: { name: 'Forge', version: '6.92 or later with agent package import and a configured model gateway' }, platforms: ['windows', 'linux', 'macos'], entrypoint: 'agent.forge-agent.json', instructions: 'INSTALL.md', license: 'LICENSE.txt', requirements: ['A Forge workspace and funded model usage under your own account', `Model availability: ${exported.configuration.model}`], modelCosts: 'buyer_provider_account', dataPolicy };
    if (sourceInstructions) {
      descriptor.runtime.version = 'forge.agent/v2 import, buyer source setup and a configured model gateway';
      descriptor.requirements.push('Provide and bind your own readable source documents before evaluating and publishing this agent');
    }
    const includedBytes = includedFiles.reduce((sum: number, file: PortableIncludedFile) => sum + file.bytes, 0);
    const sourceDescription = includedFiles.map((file: PortableIncludedFile) => file.filename).join('; ');
    if (includeSources) {
      descriptor.runtime.version = tools.length ? 'forge.agent/v4 import with included documents, declared-tool Pi runtime and a configured model gateway' : 'forge.agent/v4 import with included documents and a configured model gateway';
      descriptor.requirements.push(`Included source documents: ${includedFiles.length} text file(s), ${Math.ceil(includedBytes / 1024)} KB, imported into your own Forge library`);
    }
    const toolDescription = tools.map(name => PORTABLE_AGENT_TOOLS[name]).join('; ');
    if (tools.length) {
      descriptor.runtime.version = 'forge.agent/v3 import, declared-tool Pi runtime and a configured model gateway';
      descriptor.requirements.push('A connected Forge Pi execution worker with fixed-version tool enforcement',`Built-in capabilities: ${toolDescription}`);
    }
    let install = `# Install ${name}\n\n1. Extract this ZIP.\n2. Sign in to your own Forge workspace, open Personal workspace, choose Import agent and select agent.forge-agent.json.\n3. Review the imported system prompt and model. Configure and fund your own model access. No seller documents or credentials are included.\n4. Create your own evaluation checks, set a budget, run evaluation and publish your own tested version.\n5. Choose Use this version to open a new task with that fixed release.\n\n## Seller installation check\n${instructions}\n\nThe included evaluation metadata describes the creator's original answer checks. It does not transfer trust or prove future outputs. A new model call may cost money.\n`;
    if (sourceInstructions) install += `\n## Your source documents are required\n${sourceInstructions}\n\nBefore step 4, upload your own documents to Personal library, attach the relevant files or folders to the imported agent, and save. At least one readable document must be bound before evaluation and publication. Check that your documents satisfy the seller's instructions. Seller files, filenames, bindings and credentials are not included. Existing Forge builds without forge.agent/v2 support must be updated before importing this package.\n`;
    if (includeSources) install += `\n## Included source documents\n${includedFiles.map((file: PortableIncludedFile) => `- ${file.filename} (${file.bytes} bytes, sha256 ${file.sha256})`).join('\n')}\n\nImporting the original ZIP copies these documents into a new folder in your Personal library and attaches them to the imported agent. Inspect them before relying on their contents. They are licensed to you under LICENSE.txt for use with this agent; do not redistribute them. You may attach additional documents of your own.\n`;
    if (tools.length) install += `\n## Declared tool capabilities\n${toolDescription}\n\nThis package requires Forge with forge.agent/v3 import and a connected Pi worker that enforces the published version’s tool list. No executable tool code or seller credentials are bundled. Review the imported tools, run your own answer evaluation, then publish and use that fixed version. Perform the seller’s installation check and inspect actual saved files or tool receipts; an answer check alone does not prove execution. Public web requests are read-only and unauthenticated. Document search is limited to attached sources, and receipt lookup to the current task. Imported tools do not run during import or evaluation. Workspace memory, account integrations, subagents and host commands are unavailable.\n`;
    const archive: Record<string, string> = { 'apptopia-package.json': JSON.stringify(descriptor, null, 2), 'agent.forge-agent.json': JSON.stringify(exported, null, 2), 'INSTALL.md': install, 'LICENSE.txt': license };
    includedSources.forEach((file: { content: string }, index: number) => { archive[includedFiles[index].path] = file.content; });
    const bytes = portableZip(archive);
    if (includeSources) readPortableArchive(bytes);
    const packageDigest = digest(bytes);
    const manifest = { schemaVersion: 'apptopia.product/v1', name, summary, description: '', category: 'productivity', version, outcomes: [outcome], requirements: descriptor.requirements, limitations: 'Configuration package for a buyer-owned Forge workspace. No seller sources or tools are included. The purchased version is fixed; future versions are separate.', dataPolicy, supportEmail, delivery: ['download', 'self_host'], pricing: { model: 'one_time', amountCents: input.amountCents, currency: 'USD', modelCosts: 'buyer_key' } };
    if (sourceInstructions) {
      manifest.description = `Buyer-provided source documents are required.\n\n${sourceInstructions}`;
      manifest.limitations += ' Buyers must provide suitable readable documents and independently evaluate answers before publishing.';
    }
    if (includeSources) {
      manifest.description += `${manifest.description ? '\n\n' : ''}Includes ${includedFiles.length} seller-provided source document(s): ${sourceDescription}. They are imported into your own Forge library with the agent.`;
      manifest.limitations = 'Configuration package with the seller’s included text documents for the buyer’s Forge workspace. Documents are licensed for use with this agent under the package license. No credentials or executable tool code are included. The purchased version is fixed; future versions and document updates are separate.';
    }
    if (tools.length) {
      manifest.description += `${manifest.description ? '\n\n' : ''}Declared built-in capabilities: ${toolDescription}. Review the imported tools and verify actual task outputs before relying on this agent.`;
      manifest.limitations = includeSources
        ? 'Configuration package with the seller’s included text documents for the buyer’s Forge account and Pi runtime. Documents are licensed for use with this agent under the package license. No credentials or executable tool code are included. Only declared built-in tools are available; external writes and account integrations are unsupported. Answer evaluation does not prove tool execution. The purchased version is fixed; future versions and document updates are separate.'
        : 'Configuration package for the buyer’s Forge account and Pi runtime. No seller files, credentials or executable tool code are included. Only declared built-in tools are available; external writes and account integrations are unsupported. Answer evaluation does not prove tool execution. The purchased version is fixed; future versions are separate.';
      if (sourceInstructions) manifest.limitations += ' Buyers must provide suitable readable documents and independently evaluate answers.';
    }
    const terms = { downloadDays: input.downloadDays, usageRights: 'perpetual_purchased_version', licenseScope: input.licenseScope, licenseSummary };
    const content = { manifest, terms }, inputHash = digest(JSON.stringify({ content, packageDigest }));
    const existing = db.prepare('SELECT * FROM apptopia_portable_packages WHERE user_id=? AND release_id=? AND input_hash=?').get(user, releaseId, inputHash);
    if (existing) { if (existing.revoked_at != null) fail('MARKETPLACE_PACKAGE_REVOKED', 409); return view(existing); }
    if (db.prepare('SELECT count(*) n FROM apptopia_portable_packages WHERE user_id=?').get(user).n >= 50) fail('MARKETPLACE_PACKAGE_STORAGE_LIMIT', 409);
    const id = randomUUID();
    db.prepare('INSERT INTO apptopia_portable_packages(id,user_id,agent_id,release_id,input_hash,manifest_json,package_bytes,package_digest,version,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id, user, agentId, releaseId, inputHash, JSON.stringify(content), bytes, packageDigest, exported.version, Date.now());
    return view(db.prepare('SELECT * FROM apptopia_portable_packages WHERE id=?').get(id));
  });
  const view = (row: any) => ({ id: row.id, sourceAgentId: row.agent_id, releaseId: row.release_id, sha256: row.package_digest, version: row.version, bytes: row.package_bytes.length, ...JSON.parse(row.manifest_json) });
  const transfer = db.transaction((input: any) => {
    const row = db.prepare('SELECT * FROM apptopia_portable_packages WHERE id=? AND user_id=?').get(input.packageId, input.sourceUserId);
    if (!row || row.revoked_at != null) fail('MARKETPLACE_PACKAGE_NOT_FOUND', 404);
    if (row.package_digest !== input.packageDigest || row.release_id !== input.releaseId || !input.sellerId
      || (row.marketplace_seller_id && row.marketplace_seller_id !== input.sellerId)) fail('MARKETPLACE_PACKAGE_BINDING_MISMATCH', 409);
    // The source agent has one marketplace creator across all package versions.
    if (db.prepare('SELECT 1 FROM apptopia_portable_packages WHERE user_id=? AND agent_id=? AND marketplace_seller_id IS NOT NULL AND marketplace_seller_id<>?').get(row.user_id, row.agent_id, input.sellerId))
      fail('MARKETPLACE_PACKAGE_BINDING_MISMATCH', 409);
    db.prepare('UPDATE apptopia_portable_packages SET marketplace_seller_id=? WHERE id=?').run(input.sellerId, row.id);
    const lineagePackageIds = db.prepare('SELECT id FROM apptopia_portable_packages WHERE user_id=? AND agent_id=? AND marketplace_seller_id=? ORDER BY created_at,id').all(row.user_id, row.agent_id, input.sellerId).map((item: any) => item.id);
    return { ...view(row), lineagePackageIds, base64: Buffer.from(row.package_bytes).toString('base64') };
  });
  return { prepare, transfer };
}

export function portableHandoff(ownerId: string, saved: any, env = process.env) {
  const key = env.FORGE_PUBLISH_SECRET || '';
  if (key.length < 32 || !env.APPTOPIA_PUBLISH_URL) fail('MARKETPLACE_PACKAGE_NOT_CONFIGURED', 503);
  const url = new URL(env.APPTOPIA_PUBLISH_URL);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) fail('MARKETPLACE_PACKAGE_NOT_CONFIGURED', 503);
  url.pathname = '/sell';
  const portable = { packageId: saved.id, releaseId: saved.releaseId, packageDigest: saved.sha256, version: saved.version, terms: saved.terms, sourceAgentId: saved.sourceAgentId };
  const token = jwt.sign({ agentId: `portable:${saved.id}`, manifest: saved.manifest, portable }, key, { algorithm: 'HS256', issuer: 'forge', audience: 'apptopia:publish', subject: ownerId, jwtid: randomUUID(), expiresIn: '10m' });
  url.hash = new URLSearchParams({ forge: token }).toString();
  return { url: url.href, expiresInSeconds: 600, package: { id: saved.id, sha256: saved.sha256, bytes: saved.bytes, version: saved.version } };
}
export function registerApptopiaPackageRoutes(app: any, auth: any, service: ReturnType<typeof createApptopiaPackages>) {
  const handler = (fn: (req: any) => any) => async (req: any, res: any) => {
    res.set('Cache-Control', 'private, no-store');
    try { res.json({ success: true, data: await fn(req) }); }
    catch (error: any) { res.status(error instanceof ApptopiaRuntimeError ? error.status : error.status || 503).json({ success: false, error: error instanceof ApptopiaRuntimeError ? error.code : 'MARKETPLACE_PACKAGE_UNAVAILABLE' }); }
  };
  app.post('/api/workspace-agents/:id/releases/:releaseId/apptopia-package', auth, handler(req => portableHandoff(req.user.sub, service.prepare(req.user.sub, req.params.id, req.params.releaseId, req.body))));
  app.post('/api/internal/apptopia/package', handler(req => {
    const claims = verifyApptopiaServiceRequest(String(req.get('Authorization') || '').replace(/^Bearer /, ''), 'package', req.body);
    if (claims.sub !== req.body.sellerId) fail('MARKETPLACE_SERVICE_AUTH_REQUIRED', 401);
    return service.transfer(req.body);
  }));
}
