'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const Database = require('better-sqlite3');

const appRoot = path.join(__dirname, '..');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function spawnForge(dbPath, port, extraEnv = {}) {
  let logs = '';
  const child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(port),
      NODE_ENV: 'test',
      JWT_SECRET: 'sandbox-recovery-regression',
      FRONTEND_URL: `http://127.0.0.1:${port}`,
      MORPH_API_KEY: '',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  return { child, logs: () => logs };
}

async function waitFor(predicate, timeoutMs, message) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.fail(message());
}

async function waitForHealth(port, child, logs) {
  await waitFor(async () => {
    if (child.exitCode !== null) return false;
    try { return (await fetch(`http://127.0.0.1:${port}/health`)).ok; } catch { return false; }
  }, 90_000, () => `Forge did not become healthy:\n${logs()}`);
}

async function stop(child) {
  if (child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}

function verifySignature(secret, req, rawBody) {
  const timestamp = String(req.headers['x-forge-timestamp'] || '');
  const nonce = String(req.headers['x-forge-nonce'] || '');
  const supplied = String(req.headers['x-forge-signature'] || '');
  const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const canonical = [req.method, req.url, timestamp, nonce, bodyHash].join('\n');
  const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  return /^[A-Za-z0-9_-]{16,128}$/.test(nonce)
    && /^\d{13}$/.test(timestamp)
    && Math.abs(Date.now() - Number(timestamp)) < 60_000
    && supplied.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

test('startup preserves approvals, resumes requested work, fails interrupted work, and cleans terminal sandboxes', { timeout: 180_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-sandbox-recovery-'));
  const dbPath = path.join(tempDir, 'forge.db');
  let activeChild = null;
  let orchestrator = null;
  t.after(async () => {
    if (activeChild) await stop(activeChild);
    if (orchestrator) await new Promise(resolve => orchestrator.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const initialPort = await freePort();
  const initial = spawnForge(dbPath, initialPort);
  activeChild = initial.child;
  await waitForHealth(initialPort, initial.child, initial.logs);
  const login = await fetch(`http://127.0.0.1:${initialPort}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@forge.local', password: 'Admin1234!' }),
  });
  assert.equal(login.status, 200, initial.logs());
  const auth = await login.json();
  const userId = String(auth.data.user.id);
  await stop(initial.child);
  activeChild = null;

  const state = new Database(dbPath);
  const insertRun = state.prepare(`INSERT INTO agent_runs
    (user_id,name,prompt,status,model,provider,execution_mode,tenant_id,workspace_id,run_key,sandbox_id,attempt_id,idempotency_key,agent_version_id,sandbox_state,sandbox_context,current_tool_call_id,approval_status)
    VALUES (@userId,@name,@prompt,@status,'morph-regression-no-key','morph','sandbox',@userId,@workspaceId,@runKey,@sandboxId,@attemptId,@idempotencyKey,'agent-version-recovery',@sandboxState,@context,@currentToolCallId,'not_required')`);
  const seed = (name, status, sandboxState, currentToolCallId = null) => Number(insertRun.run({
    userId,
    name,
    prompt: `prompt for ${name}`,
    status,
    workspaceId: 'workspace-recovery',
    runKey: `run-${name}`,
    sandboxId: `sandbox-${name}`,
    attemptId: `attempt-${name}`,
    idempotencyKey: `idempotency-${name}`,
    sandboxState,
    context: JSON.stringify({ messages: [{ role: 'system', content: 'system' }, { role: 'user', content: `prompt for ${name}` }], iterations: 0, pendingToolCalls: [] }),
    currentToolCallId,
  }).lastInsertRowid);

  const waitingToolId = 'tool-waiting-recovery';
  const waitingId = seed('waiting-recovery', 'waiting_approval', 'waiting_approval', waitingToolId);
  state.prepare(`INSERT INTO sandbox_tool_calls (id,run_id,user_id,attempt_id,idempotency_key,tool_name,input,approval_class,approval_status,status)
    VALUES (?,?,?,?,?,'sandbox_browser','{}','B','pending','requested')`).run(waitingToolId, waitingId, userId, 'attempt-waiting-recovery', 'idempotency-waiting-tool');
  state.prepare(`INSERT INTO sandbox_approvals (id,tool_call_id,run_id,user_id,approval_class,status,reason,request_summary)
    VALUES ('approval-waiting-recovery',?,?,?,'B','pending','external mutation','browser click')`).run(waitingToolId, waitingId, userId);
  const requestedId = seed('requested-recovery', 'requested', 'requested');
  const runningId = seed('running-recovery', 'running', 'running');
  const completedId = seed('completed-recovery', 'completed', 'completed');
  state.close();

  const secret = 'sandbox-recovery-hmac-secret';
  const calls = [];
  const orchestratorPort = await freePort();
  orchestrator = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks);
      calls.push({ method: req.method, url: req.url, validSignature: verifySignature(secret, req, rawBody) });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { state: 'destroyed' } }));
    });
  });
  await new Promise(resolve => orchestrator.listen(orchestratorPort, '127.0.0.1', resolve));

  const recoveryPort = await freePort();
  const recovery = spawnForge(dbPath, recoveryPort, {
    FORGE_SANDBOX_ORCHESTRATOR_URL: `http://127.0.0.1:${orchestratorPort}`,
    FORGE_SANDBOX_HMAC_SECRET: secret,
  });
  activeChild = recovery.child;
  await waitForHealth(recoveryPort, recovery.child, recovery.logs);
  await waitFor(() => {
    const db = new Database(dbPath, { readonly: true });
    try {
      const rows = db.prepare('SELECT id,status,sandbox_state FROM agent_runs WHERE id IN (?,?,?)').all(requestedId, runningId, completedId);
      return rows.length === 3 && rows.every(row => row.sandbox_state === 'destroyed');
    } finally { db.close(); }
  }, 30_000, () => `Sandbox recovery did not settle:\n${recovery.logs()}`);

  const recovered = new Database(dbPath, { readonly: true });
  const waiting = recovered.prepare('SELECT status,sandbox_state,current_tool_call_id FROM agent_runs WHERE id=?').get(waitingId);
  const requested = recovered.prepare('SELECT status,sandbox_state,error FROM agent_runs WHERE id=?').get(requestedId);
  const running = recovered.prepare('SELECT status,sandbox_state,error FROM agent_runs WHERE id=?').get(runningId);
  const completed = recovered.prepare('SELECT status,sandbox_state FROM agent_runs WHERE id=?').get(completedId);
  const waitingApproval = recovered.prepare('SELECT status FROM sandbox_approvals WHERE run_id=?').get(waitingId);
  const eventTypes = id => recovered.prepare('SELECT type FROM sandbox_events WHERE run_id=? ORDER BY seq').all(id).map(row => row.type);

  assert.deepEqual(waiting, { status: 'waiting_approval', sandbox_state: 'waiting_approval', current_tool_call_id: waitingToolId });
  assert.equal(waitingApproval.status, 'pending');
  assert.ok(eventTypes(waitingId).includes('run_recovery_preserved'));
  assert.equal(requested.status, 'failed');
  assert.equal(requested.sandbox_state, 'destroyed');
  assert.match(requested.error, /No morph API key configured/);
  assert.ok(eventTypes(requestedId).includes('run_recovery_resumed'));
  assert.equal(running.status, 'failed');
  assert.equal(running.sandbox_state, 'destroyed');
  assert.equal(running.error, 'SANDBOX_RUN_INTERRUPTED_BY_FORGE_RESTART');
  assert.ok(eventTypes(runningId).includes('run_recovery_failed'));
  assert.deepEqual(completed, { status: 'completed', sandbox_state: 'destroyed' });
  recovered.close();

  const destroyedUrls = new Set(calls.filter(call => call.method === 'DELETE').map(call => call.url));
  assert.deepEqual(destroyedUrls, new Set([
    '/v1/sandboxes/sandbox-requested-recovery',
    '/v1/sandboxes/sandbox-running-recovery',
    '/v1/sandboxes/sandbox-completed-recovery',
  ]));
  assert.equal(calls.every(call => call.validSignature), true);
  assert.doesNotMatch(recovery.logs(), /sandbox-waiting-recovery.*destroy/i);
});
