'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { DockerApi } = require('./docker-api');
const { pruneNonces, sha256, verifySignedRequest } = require('./security');
const { firstFileFromTar, singleFileTar } = require('./tar');

const PORT = Number(process.env.PORT || 3001);
const HMAC_SECRET = String(process.env.FORGE_SANDBOX_HMAC_SECRET || '');
const RUNTIME_IMAGE = String(process.env.FORGE_SANDBOX_RUNTIME_IMAGE || 'forge-sandbox-runtime:local');
const SANDBOX_NETWORK = String(process.env.FORGE_SANDBOX_NETWORK || 'forge-sandbox-internal');
const PROXY_URL = String(process.env.FORGE_SANDBOX_PROXY_URL || 'http://forge-sandbox-egress:8787');
const DATA_DIR = path.resolve(process.env.FORGE_SANDBOX_DATA_DIR || '/var/lib/forge-sandbox');
const MAX_BODY_BYTES = Math.max(1024, Math.min(Number(process.env.FORGE_SANDBOX_MAX_BODY_BYTES) || 16 * 1024 * 1024, 32 * 1024 * 1024));
const MEMORY_BYTES = Math.max(128 * 1024 * 1024, Math.min(Number(process.env.FORGE_SANDBOX_MEMORY_BYTES) || 768 * 1024 * 1024, 4 * 1024 * 1024 * 1024));
const CPU_NANOS = Math.max(100_000_000, Math.min(Number(process.env.FORGE_SANDBOX_CPU_NANOS) || 1_000_000_000, 4_000_000_000));
const PIDS_LIMIT = Math.max(32, Math.min(Number(process.env.FORGE_SANDBOX_PIDS_LIMIT) || 128, 512));
const BROWSER_PIDS_LIMIT = Math.max(PIDS_LIMIT, Math.min(Number(process.env.FORGE_SANDBOX_BROWSER_PIDS_LIMIT) || 256, 512));
const docker = new DockerApi(process.env.DOCKER_SOCKET || '/var/run/docker.sock');
const nonces = new Map();

fs.mkdirSync(path.join(DATA_DIR, 'idempotency'), { recursive: true, mode: 0o700 });

function json(res, statusCode, body) {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Content-Length': String(payload.length), 'Cache-Control': 'no-store' });
  res.end(payload);
}

function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value);
}

function requireIdentities(body, includeSandbox = true) {
  for (const field of ['tenantId', 'userId', 'workspaceId', 'runId', 'attemptId']) {
    if (!validId(body[field])) throw new Error(`SANDBOX_${field.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}_INVALID`);
  }
  if (includeSandbox && !validId(body.sandboxId)) throw new Error('SANDBOX_ID_INVALID');
}

function volumeNames(userId, workspaceId) {
  const key = sha256(`${userId}:${workspaceId}`).slice(0, 32);
  return { workspace: `forge-ws-${key}`, artifacts: `forge-artifacts-${key}` };
}

function containerNames(sandboxId) {
  const key = sandboxId.replace(/[^A-Za-z0-9]/g, '').slice(0, 40).toLowerCase();
  return { shell: `forge-sbx-${key}`, browser: `forge-browser-${key}` };
}

function labels(body, role) {
  return {
    'com.forge.managed': 'sandbox-v1',
    'com.forge.sandbox.id': body.sandboxId,
    'com.forge.tenant.id': body.tenantId,
    'com.forge.user.id': body.userId,
    'com.forge.workspace.id': body.workspaceId,
    'com.forge.run.id': body.runId,
    'com.forge.attempt.id': body.attemptId,
    'com.forge.role': role,
  };
}

function mountSpec(volumes) {
  return [
    { Type: 'volume', Source: volumes.workspace, Target: '/workspace', ReadOnly: false },
    { Type: 'volume', Source: volumes.artifacts, Target: '/artifacts', ReadOnly: false },
  ];
}

function hardenedHostConfig(volumes, networkMode, pidsLimit = PIDS_LIMIT) {
  return {
    AutoRemove: false,
    NetworkMode: networkMode,
    ReadonlyRootfs: true,
    CapDrop: ['ALL'],
    SecurityOpt: ['no-new-privileges:true'],
    Memory: MEMORY_BYTES,
    MemorySwap: MEMORY_BYTES,
    NanoCpus: CPU_NANOS,
    PidsLimit: pidsLimit,
    OomKillDisable: false,
    Mounts: mountSpec(volumes),
    Tmpfs: {
      '/tmp': 'rw,nosuid,nodev,size=134217728,mode=1777',
      '/home/sandbox': 'rw,nosuid,nodev,size=67108864,mode=0700,uid=10001,gid=10001',
    },
    Ulimits: [
      { Name: 'nofile', Soft: 1024, Hard: 2048 },
      { Name: 'nproc', Soft: pidsLimit, Hard: pidsLimit },
    ],
  };
}

async function ensureVolumes(body) {
  const volumes = volumeNames(body.userId, body.workspaceId);
  const volumeLabels = {
    'com.forge.managed': 'sandbox-volume-v1',
    'com.forge.user.id': body.userId,
    'com.forge.workspace.id': body.workspaceId,
  };
  const existing = {
    workspace: (await docker.inspectVolume(volumes.workspace, true)).statusCode === 200,
    artifacts: (await docker.inspectVolume(volumes.artifacts, true)).statusCode === 200,
  };
  for (const kind of ['workspace', 'artifacts']) {
    if (existing[kind]) continue;
    await docker.createVolume(volumes[kind], { ...volumeLabels, 'com.forge.kind': kind });
    const target = kind === 'workspace' ? '/workspace' : '/artifacts';
    const initName = `forge-volume-init-${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
    try {
      await docker.createContainer(initName, {
        Image: RUNTIME_IMAGE,
        User: '0:0',
        Cmd: ['/bin/chown', '10001:10001', target],
        Labels: { ...volumeLabels, 'com.forge.role': 'volume-init', 'com.forge.kind': kind },
        HostConfig: {
          AutoRemove: false,
          NetworkMode: 'none',
          ReadonlyRootfs: true,
          CapDrop: ['ALL'],
          CapAdd: ['CHOWN'],
          SecurityOpt: ['no-new-privileges:true'],
          Mounts: [{ Type: 'volume', Source: volumes[kind], Target: target, ReadOnly: false }],
        },
      });
      await docker.startContainer(initName);
      const waited = await docker.waitContainer(initName);
      if (waited.data && waited.data.StatusCode !== 0) throw new Error('SANDBOX_VOLUME_INIT_FAILED');
    } finally {
      await docker.removeContainer(initName, true, true).catch(() => {});
    }
  }
  return volumes;
}

async function provision(body) {
  requireIdentities(body);
  const names = containerNames(body.sandboxId);
  const existing = await docker.inspectContainer(names.shell, true);
  if (existing.statusCode === 200) {
    const found = existing.data && existing.data.Config && existing.data.Config.Labels;
    if (found && found['com.forge.run.id'] === body.runId && found['com.forge.user.id'] === body.userId) {
      return { sandboxId: body.sandboxId, state: existing.data.State && existing.data.State.Running ? 'ready' : 'provisioned' };
    }
    throw new Error('SANDBOX_IDENTITY_CONFLICT');
  }
  const volumes = await ensureVolumes(body);
  const commonEnv = [
    `FORGE_TENANT_ID=${body.tenantId}`,
    `FORGE_USER_ID=${body.userId}`,
    `FORGE_WORKSPACE_ID=${body.workspaceId}`,
    `FORGE_RUN_ID=${body.runId}`,
    `FORGE_ATTEMPT_ID=${body.attemptId}`,
    `FORGE_SANDBOX_ID=${body.sandboxId}`,
    `FORGE_MAX_WORKSPACE_BYTES=${Number(body.maxWorkspaceBytes) || 268435456}`,
    'HOME=/home/sandbox',
  ];
  const shellSpec = {
    Image: RUNTIME_IMAGE,
    User: '10001:10001',
    WorkingDir: '/workspace',
    Cmd: ['node', '/opt/forge-sandbox/idle.js'],
    Env: commonEnv,
    Labels: labels(body, 'shell'),
    HostConfig: hardenedHostConfig(volumes, 'none'),
  };
  const browserSpec = {
    Image: RUNTIME_IMAGE,
    User: '10001:10001',
    WorkingDir: '/workspace',
    Cmd: ['node', '/opt/forge-sandbox/idle.js'],
    Env: [...commonEnv, `HTTP_PROXY=${PROXY_URL}`, `HTTPS_PROXY=${PROXY_URL}`, `FORGE_BROWSER_PROXY=${PROXY_URL}`, 'NO_PROXY=localhost,127.0.0.1'],
    Labels: labels(body, 'browser'),
    HostConfig: hardenedHostConfig(volumes, SANDBOX_NETWORK, BROWSER_PIDS_LIMIT),
  };
  try {
    await docker.createContainer(names.shell, shellSpec);
    await docker.createContainer(names.browser, browserSpec);
    await docker.startContainer(names.shell);
    await docker.startContainer(names.browser);
    return { sandboxId: body.sandboxId, state: 'ready' };
  } catch (error) {
    await destroy(body.sandboxId).catch(() => {});
    throw error;
  }
}

function idempotencyPath(value) {
  return path.join(DATA_DIR, 'idempotency', `${sha256(value)}.json`);
}

function readIdempotent(value) {
  const file = idempotencyPath(value);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeIdempotent(value, payload) {
  const file = idempotencyPath(value);
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(payload), { mode: 0o600 });
  fs.renameSync(temp, file);
}

async function executeTool(body) {
  requireIdentities(body);
  if (!validId(body.toolCallId) || !validId(body.idempotencyKey)) throw new Error('SANDBOX_TOOL_IDENTITY_INVALID');
  const cached = readIdempotent(body.idempotencyKey);
  if (cached) {
    if (cached.toolCallId !== body.toolCallId || cached.runId !== body.runId) throw new Error('SANDBOX_IDEMPOTENCY_CONFLICT');
    return { ...cached.result, replayed: true };
  }
  const allowedTools = new Set(['sandbox_browser', 'sandbox_file', 'sandbox_shell', 'sandbox_document', 'sandbox_artifact']);
  if (!allowedTools.has(body.toolName)) throw new Error('SANDBOX_TOOL_NOT_ALLOWED');
  const names = containerNames(body.sandboxId);
  const container = body.toolName === 'sandbox_browser' || (body.toolName === 'sandbox_document' && body.args && body.args.operation === 'render_markdown_pdf') ? names.browser : names.shell;
  const inspected = await docker.inspectContainer(container, true);
  if (inspected.statusCode !== 200 || !inspected.data.State || !inspected.data.State.Running) throw new Error('SANDBOX_NOT_RUNNING');
  const request = Buffer.from(JSON.stringify({ toolName: body.toolName, args: body.args || {} })).toString('base64url');
  const result = await docker.exec(container, ['node', '/opt/forge-sandbox/tool.js', request], [], Math.max(10_000, Math.min(Number(body.timeoutMs) || 150_000, 180_000)));
  if (result.stdout.length + result.stderr.length > 2 * 1024 * 1024) throw new Error('SANDBOX_TOOL_OUTPUT_TOO_LARGE');
  if (result.exitCode !== 0) throw new Error(`SANDBOX_TOOL_EXIT_${result.exitCode}: ${(result.stderr || result.stdout).slice(0, 1000)}`);
  let parsed;
  try { parsed = JSON.parse(result.stdout.trim()); }
  catch { throw new Error(`SANDBOX_TOOL_RESPONSE_INVALID: ${result.stdout.slice(0, 1000)}`); }
  if (!parsed.ok) throw new Error(String(parsed.error || 'SANDBOX_TOOL_FAILED'));
  writeIdempotent(body.idempotencyKey, { toolCallId: body.toolCallId, runId: body.runId, result: parsed });
  return parsed;
}

async function destroy(sandboxId) {
  if (!validId(sandboxId)) throw new Error('SANDBOX_ID_INVALID');
  const names = containerNames(sandboxId);
  for (const name of [names.browser, names.shell]) {
    await docker.stopContainer(name, 1, true).catch(() => {});
    await docker.removeContainer(name, true, true).catch(() => {});
  }
  return { sandboxId, state: 'destroyed' };
}

function normalizeRelativePath(input) {
  if (typeof input !== 'string' || !input.trim() || input.includes('\0')) throw new Error('SANDBOX_PATH_REQUIRED');
  const value = input.trim().replace(/\\/g, '/');
  if (value.startsWith('/') || /^[A-Za-z]:\//.test(value)) throw new Error('SANDBOX_ABSOLUTE_PATH_REJECTED');
  const normalized = path.posix.normalize(value);
  if (normalized === '..' || normalized.startsWith('../') || normalized === '.') throw new Error('SANDBOX_PATH_ESCAPE_REJECTED');
  return normalized;
}

async function withVolumeHelper(body, kind, fn) {
  requireIdentities(body, false);
  const volumes = await ensureVolumes(body);
  const helper = `forge-helper-${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
  try {
    await docker.createContainer(helper, {
      Image: RUNTIME_IMAGE,
      User: '10001:10001',
      WorkingDir: kind === 'workspace' ? '/workspace' : '/artifacts',
      Cmd: ['node', '/opt/forge-sandbox/idle.js'],
      Env: ['HOME=/home/sandbox'],
      Labels: { 'com.forge.managed': 'sandbox-helper-v1', 'com.forge.user.id': body.userId, 'com.forge.workspace.id': body.workspaceId },
      HostConfig: {
        ...hardenedHostConfig(volumes, 'none'),
        Mounts: [{ Type: 'volume', Source: volumes[kind], Target: kind === 'workspace' ? '/workspace' : '/artifacts', ReadOnly: kind === 'artifacts' }],
      },
    });
    await docker.startContainer(helper);
    return await fn(helper);
  } finally {
    await docker.stopContainer(helper, 1, true).catch(() => {});
    await docker.removeContainer(helper, true, true).catch(() => {});
  }
}

async function writeWorkspaceFile(body) {
  const relativePath = normalizeRelativePath(body.path);
  const content = Buffer.from(String(body.contentBase64 || ''), 'base64');
  if (!content.length && body.contentBase64) throw new Error('SANDBOX_UPLOAD_BASE64_INVALID');
  if (content.length > 10 * 1024 * 1024) throw new Error('SANDBOX_UPLOAD_TOO_LARGE');
  return withVolumeHelper(body, 'workspace', async helper => {
    const directory = path.posix.dirname(relativePath);
    if (directory !== '.') {
      const mkdirRequest = Buffer.from(JSON.stringify({ toolName: 'sandbox_file', args: { operation: 'mkdir', path: directory } })).toString('base64url');
      const created = await docker.exec(helper, ['node', '/opt/forge-sandbox/tool.js', mkdirRequest]);
      if (created.exitCode !== 0) throw new Error(`SANDBOX_UPLOAD_MKDIR_FAILED: ${created.stderr.slice(0, 500)}`);
    }
    await docker.putArchive(helper, path.posix.join('/workspace', directory === '.' ? '' : directory), singleFileTar(path.posix.basename(relativePath), content));
    return { path: relativePath, bytes: content.length, sha256: sha256(content) };
  });
}

async function readArtifact(body) {
  const relativePath = normalizeRelativePath(body.path);
  return withVolumeHelper(body, 'artifacts', async helper => {
    const tar = await docker.getArchive(helper, path.posix.join('/artifacts', relativePath));
    const file = firstFileFromTar(tar);
    if (file.content.length > 20 * 1024 * 1024) throw new Error('SANDBOX_ARTIFACT_TOO_LARGE');
    return { path: relativePath, bytes: file.content.length, sha256: sha256(file.content), contentBase64: file.content.toString('base64') };
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) { reject(new Error('REQUEST_BODY_TOO_LARGE')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      if (!raw.length) { resolve({ raw, body: {} }); return; }
      try { resolve({ raw, body: JSON.parse(raw.toString('utf8')) }); }
      catch { reject(new Error('REQUEST_JSON_INVALID')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requestPath = `${requestUrl.pathname}${requestUrl.search}`;
  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    try {
      await docker.ping();
      json(res, 200, { status: 'ok', runtimeImage: RUNTIME_IMAGE, isolation: 'per-run-containers' });
    } catch (error) {
      json(res, 503, { status: 'not_ready', error: error.message });
    }
    return;
  }
  try {
    const { raw, body } = await parseBody(req);
    pruneNonces(nonces);
    verifySignedRequest({ secret: HMAC_SECRET, method: req.method, requestPath, headers: req.headers, rawBody: raw, nonces });
    if (req.method === 'POST' && requestUrl.pathname === '/v1/sandboxes/provision') {
      json(res, 201, { success: true, data: await provision(body) }); return;
    }
    if (req.method === 'POST' && requestUrl.pathname === '/v1/tools/execute') {
      json(res, 200, { success: true, data: await executeTool(body) }); return;
    }
    if (req.method === 'DELETE' && requestUrl.pathname.startsWith('/v1/sandboxes/')) {
      const sandboxId = decodeURIComponent(requestUrl.pathname.slice('/v1/sandboxes/'.length));
      json(res, 200, { success: true, data: await destroy(sandboxId) }); return;
    }
    if (req.method === 'POST' && requestUrl.pathname === '/v1/workspaces/files') {
      json(res, 201, { success: true, data: await writeWorkspaceFile(body) }); return;
    }
    if (req.method === 'POST' && requestUrl.pathname === '/v1/artifacts/read') {
      json(res, 200, { success: true, data: await readArtifact(body) }); return;
    }
    json(res, 404, { success: false, error: 'NOT_FOUND' });
  } catch (error) {
    const code = String(error && error.message || 'SANDBOX_ORCHESTRATOR_ERROR');
    const status = code.includes('SIGNATURE') ? 401 : code.includes('NOT_FOUND') ? 404 : code.includes('CONFLICT') ? 409 : code.includes('TOO_LARGE') ? 413 : 400;
    json(res, status, { success: false, error: code.slice(0, 2000) });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Forge Sandbox Orchestrator listening on ${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
