'use strict';

// Uses a real Pi SDK worker and the real Forge API/SQLite/gateway. Only the model
// provider and the external sandbox broker are deterministic local fixtures.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const Database = require('better-sqlite3');

const appRoot = process.env.FORGE_PLATFORM_ROOT || path.resolve(__dirname, '..');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
async function listen(server) {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return server.address().port;
}
async function freePort() { const server = http.createServer(); const port = await listen(server); await new Promise(resolve => server.close(resolve)); return port; }
async function jsonBody(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
function json(res, status, data) { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); }
async function until(fn, label, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) { const value = await fn(); if (value) return value; await pause(80); }
  throw new Error(`Timed out: ${label}`);
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit'); child.kill('SIGTERM');
  await Promise.race([exited, pause(4000)]);
  if (child.exitCode === null) { child.kill('SIGKILL'); await exited; }
}
async function request(origin, route, headers, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(origin + route, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

function mockModel() {
  const calls = [];
  const cancelled = new Set();
  const server = http.createServer(async (req, res) => {
    try {
      const body = await jsonBody(req);
      const all = JSON.stringify(body.messages || []);
      const scenario = /PI_CASE:([a-z-]+)/.exec(all)?.[1] || 'unknown';
      calls.push({ scenario, body });
      if (body.stream !== true) return json(res, 400, { error: { message: 'This fixture requires the real streaming Pi model path.' } });
      if (['cancel-active', 'chat-cancel-active'].includes(scenario)) {
        res.writeHead(200, { 'content-type': 'text/event-stream' }); res.flushHeaders();
        res.once('close', () => cancelled.add(scenario));
        return;
      }
      const previousResults = (body.messages || []).filter(message => message.role === 'tool');
      let name; let args; let text;
      if (scenario === 'chat-unsafe' && !previousResults.length) { name = 'shell'; args = { command: 'echo HOST_SHOULD_NEVER_EXECUTE' }; }
      else if (['approve', 'reject', 'cancel-waiting'].includes(scenario) && !previousResults.length) {
        name = 'sandbox_browser'; args = { actions: [{ action: 'navigate', url: 'https://example.com' }, { action: 'click', selector: '#approved-action' }] };
      } else if (scenario === 'tool-budget') {
        name = 'sandbox_file'; args = { operation: 'write', path: `budget-${previousResults.length}.txt`, content: 'budget evidence' };
      } else if (scenario === 'chat-unsafe') text = all.includes('HOST_EXECUTION_DISABLED') ? 'Host execution was correctly denied.' : 'UNSAFE_TOOL_RESULT_MISSING';
      else if (scenario === 'reject') text = all.includes('rejected') ? 'The user rejected the action; it was not executed.' : 'REJECTION_MISSING';
      else text = `Pi stream verified for ${scenario}.`;
      const id = `chatcmpl-${crypto.randomUUID()}`;
      const chunk = (delta, finish = null, usage) => res.write(`data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: body.model, choices: [{ index: 0, delta, finish_reason: finish }], ...(usage ? { usage } : {}) })}\n\n`);
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      chunk({ role: 'assistant', content: '' });
      if (name) {
        chunk({ tool_calls: [{ index: 0, id: `call_${scenario}_${previousResults.length}`, type: 'function', function: { name, arguments: JSON.stringify(args) } }] });
      } else {
        chunk({ content: text.slice(0, 10) }); await pause(12); chunk({ content: text.slice(10) });
      }
      chunk({}, name ? 'tool_calls' : 'stop', { prompt_tokens: 17, completion_tokens: 9, total_tokens: 26 });
      res.end('data: [DONE]\n\n');
    } catch (error) { if (!res.headersSent) json(res, 500, { error: { message: error.message } }); else res.end(); }
  });
  return { server, calls, cancelled };
}

function mockBroker(secret) {
  const executions = [];
  const files = new Map();
  const replay = new Map();
  const server = http.createServer(async (req, res) => {
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      const canonical = [req.method, req.url, req.headers['x-forge-timestamp'], req.headers['x-forge-nonce'], digest(raw)].join('\n');
      const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
      assert.equal(req.headers['x-forge-signature'], expected, 'Broker requests retain the real Forge HMAC contract');
      const body = JSON.parse(raw || '{}');
      if (req.url === '/v1/sandboxes/provision' || req.method === 'DELETE') return json(res, 200, { success: true, data: { ready: true, destroyed: req.method === 'DELETE' } });
      if (req.url === '/v1/artifacts/read') return json(res, 200, { success: true, data: { contentBase64: files.get(`${body.workspaceId}:${body.path}`).toString('base64') } });
      assert.equal(req.url, '/v1/tools/execute');
      if (replay.has(body.idempotencyKey)) return json(res, 200, { success: true, data: { data: replay.get(body.idempotencyKey), replayed: true } });
      executions.push(body);
      let output;
      const key = `${body.workspaceId}:${body.args.path}`;
      if (body.toolName === 'sandbox_file') {
        assert.equal(body.args.operation, 'write');
        const content = Buffer.from(body.args.content, 'utf8'); files.set(key, content);
        output = { path: body.args.path, bytes: content.length, sha256: digest(content) };
      } else if (body.toolName === 'sandbox_artifact') {
        const content = files.get(key); assert.ok(content, 'Artifact is backed by concrete bytes');
        output = { artifactPath: body.args.path, title: body.args.title, mimeType: body.args.mimeType || 'text/markdown', bytes: content.length, sha256: digest(content) };
      } else if (body.toolName === 'sandbox_browser') output = { completed: true, evidence: 'The previously approved browser action executed once.' };
      else throw new Error(`Unexpected broker tool ${body.toolName}`);
      replay.set(body.idempotencyKey, output);
      return json(res, 200, { success: true, data: { data: output, replayed: false } });
    } catch (error) { json(res, 500, { success: false, error: error.message }); }
  });
  return { server, executions, files };
}

test('real Pi SDK integrates with Forge chat, durable approvals, isolation, budgets and billing', { timeout: 300000 }, async t => {
  assert.ok(process.env.FORGE_PI_WORKER_URL, 'FORGE_PI_WORKER_URL must target a real Pi SDK worker');
  assert.ok(process.env.FORGE_PI_WORKER_TOKEN, 'Use a dedicated dummy worker token');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-pi-integration-'));
  const dbPath = path.join(temp, 'forge.db');
  const secret = 'forge-pi-broker-regression-only';
  const model = mockModel(); const modelPort = await listen(model.server);
  const broker = mockBroker(secret); const brokerPort = await listen(broker.server);
  let child; let logs = ''; let state;
  t.after(async () => {
    await stop(child); if (state) state.close();
    for (const server of [model.server, broker.server]) { server.closeAllConnections?.(); await new Promise(resolve => server.close(resolve)); }
    fs.rmSync(temp, { recursive: true, force: true });
  });
  async function start(workerEnabled) {
    const port = await freePort(); logs = '';
    const env = { ...process.env, NODE_ENV: 'test', DB_PATH: dbPath, PORT: String(port),
      FRONTEND_URL: `http://127.0.0.1:${port}`, JWT_SECRET: 'forge-pi-integration-test-jwt',
      CREDENTIAL_ENCRYPTION_KEY: 'ab'.repeat(32), OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '', OPENROUTER_API_KEY: '', MORPH_API_KEY: '',
      FORGE_PI_WORKER_URL: workerEnabled ? process.env.FORGE_PI_WORKER_URL : '',
      FORGE_PI_PLATFORM_URL: `http://${process.env.FORGE_PI_PLATFORM_TEST_HOST || 'forge-pi-platform-test'}:${port}`,
      FORGE_PI_TEST_MODEL_URL: `http://127.0.0.1:${modelPort}/v1/chat/completions`,
      FORGE_SANDBOX_ORCHESTRATOR_URL: `http://127.0.0.1:${brokerPort}`, FORGE_SANDBOX_HMAC_SECRET: secret,
    };
    delete env.FORGE_AGENT_ENGINE; // Prove that the default itself is Pi.
    child = spawn(process.execPath, [path.join(appRoot, 'dist/index.js')], { cwd: appRoot, env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', chunk => { logs += chunk; }); child.stderr.on('data', chunk => { logs += chunk; });
    const origin = `http://127.0.0.1:${port}`;
    await until(async () => {
      if (child.exitCode !== null) throw new Error(`Platform exited ${child.exitCode}: ${logs.slice(-5000)}`);
      try { return (await fetch(origin + '/ready')).ok; } catch { return false; }
    }, 'platform startup', 90000);
    const login = await request(origin, '/api/auth/login', { 'content-type': 'application/json' }, { email: 'admin@forge.local', password: 'Admin1234!' });
    assert.equal(login.status, 200, JSON.stringify(login.body));
    return { origin, headers: { 'content-type': 'application/json', authorization: `Bearer ${login.body.accessToken}` }, userId: String(login.body.data.user.id) };
  }
  let app;
  await t.test('default engine refuses a missing worker with HTTP 503 and makes no model call', async () => {
    app = await start(false);
    const thread = await request(app.origin, '/api/threads', app.headers, { title: 'Unavailable worker', model: 'gpt-4o-mini' });
    assert.equal(thread.status, 201);
    const denied = await request(app.origin, `/api/threads/${thread.body.data.id}/messages`, app.headers, { content: 'PI_CASE:missing-worker' });
    assert.equal(denied.status, 503); assert.equal(denied.body.error, 'PI_RUNTIME_UNAVAILABLE'); assert.equal(model.calls.length, 0);
    await stop(child);
  });
  app = await start(true);
  state = new Database(dbPath);
  assert.equal((await request(app.origin, '/api/keys', app.headers, { openai_key: 'sk-pi-regression-dummy-only' })).status, 200);
  async function chat(scenario) {
    const thread = await request(app.origin, '/api/threads', app.headers, { title: scenario, model: 'gpt-4o-mini' });
    assert.equal(thread.status, 201);
    const response = await fetch(`${app.origin}/api/threads/${thread.body.data.id}/messages`, { method: 'POST', headers: app.headers, body: JSON.stringify({ content: `PI_CASE:${scenario}`, model: 'gpt-4o-mini' }) });
    assert.equal(response.status, 200);
    const text = await response.text();
    const events = text.split(/\r?\n/).filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)));
    const result = events.find(event => event.type === 'result')?.payload;
    assert.equal(result?.success, true, text);
    return { result, events };
  }
  await t.test('primary chat streams through Pi and denies a native host shell tool call', async () => {
    const stream = await chat('chat-stream');
    assert.ok(stream.events.some(event => event.type === 'token' && event.delta));
    assert.equal(stream.result.data.content, 'Pi stream verified for chat-stream.');
    const unsafe = await chat('chat-unsafe');
    assert.equal(unsafe.result.data.content, 'Host execution was correctly denied.');
    assert.ok(unsafe.events.some(event => event.type === 'tool_call' && event.result.includes('HOST_EXECUTION_DISABLED')));
    assert.equal(model.calls.filter(call => call.scenario === 'chat-unsafe').length, 2);
    assert.ok(state.prepare("SELECT output FROM tool_history WHERE user_id=? AND tool_name='shell'").all(app.userId).some(row => row.output.includes('HOST_EXECUTION_DISABLED')));
    assert.equal(broker.executions.length, 0);
  });
  await t.test('the default simple Agent Run also uses Pi while preserving its no-tool evidence contract', async () => {
    assert.equal((await request(app.origin, '/api/passport', app.headers)).status, 200);
    assert.equal((await request(app.origin, '/api/passport', app.headers, { apptopia_agent_id: 'pi-test-agent', apptopia_agent_version_id: 'pi-test-version', apptopia_agent_version: '1.0.0' }, 'PATCH')).status, 200);
    const started = await request(app.origin, '/api/agent-runs', app.headers, { name: 'Pi direct proof', prompt: 'PI_CASE:direct', model: 'gpt-4o-mini' });
    assert.equal(started.status, 200, JSON.stringify(started.body));
    const run = await until(() => { const row = state.prepare('SELECT * FROM agent_runs WHERE id=?').get(started.body.id); return ['done', 'error'].includes(row.status) && row; }, 'direct Pi completion');
    assert.equal(run.status, 'done', run.error); assert.match(run.result, /Pi stream verified for direct/);
    assert.equal(JSON.parse(run.sandbox_context).engine, 'pi'); assert.equal(run.tool_calls, 0); assert.ok(run.total_tokens > 0); assert.ok(run.cost_usd > 0);
    assert.equal(run.approval_status, 'pending'); assert.ok(run.request_hash && run.result_hash);
    assert.equal((model.calls.find(call => call.scenario === 'direct').body.tools || []).length, 0);
  });
  async function startRun(scenario, extra = {}) {
    const result = await request(app.origin, '/api/agent-runs', app.headers, { name: scenario, prompt: `PI_CASE:${scenario}`, model: 'gpt-4o-mini', executionMode: 'sandbox', idempotencyKey: `pi-${scenario}-${crypto.randomUUID()}`, ...extra });
    assert.equal(result.status, 202, JSON.stringify(result.body)); return result.body;
  }
  async function waitRun(id, statuses) {
    return until(() => { const row = state.prepare('SELECT * FROM agent_runs WHERE id=?').get(id); if (row.status === 'failed' && !statuses.includes('failed')) throw new Error(`${row.error}\n${logs.slice(-2000)}`); return statuses.includes(row.status) && row; }, `run ${id}: ${statuses.join('/')}`);
  }
  const executionRunKey = id => state.prepare('SELECT run_key FROM agent_runs WHERE id=?').get(id).run_key;
  const externalExecutions = id => broker.executions.filter(call => call.runId === executionRunKey(id) && call.toolName === 'sandbox_browser');
  let approvedRun;
  await t.test('sandbox persists native Pi pause, approves exactly once, commits and downloads hashed artifact bytes', async () => {
    const started = await startRun('approve'); approvedRun = started.id;
    const waiting = await waitRun(started.id, ['waiting_approval']);
    await until(() => Array.isArray(JSON.parse(state.prepare('SELECT sandbox_context FROM agent_runs WHERE id=?').get(started.id).sandbox_context).piMessages), 'native Pi pause checkpoint');
    const approval = state.prepare("SELECT * FROM sandbox_approvals WHERE run_id=? AND status='pending'").get(started.id);
    assert.ok(approval); assert.equal(externalExecutions(started.id).length, 0);
    const approved = await request(app.origin, `/api/agent-runs/${started.id}/approvals/${approval.id}/approve`, app.headers, {});
    assert.equal(approved.status, 200, JSON.stringify(approved.body));
    const done = await waitRun(started.id, ['completed']);
    assert.equal(externalExecutions(started.id).length, 1); assert.equal(externalExecutions(started.id)[0].toolCallId, waiting.current_tool_call_id);
    assert.equal((await request(app.origin, `/api/agent-runs/${started.id}/approvals/${approval.id}/approve`, app.headers, {})).status, 200);
    assert.equal(externalExecutions(started.id).length, 1);
    const native = JSON.parse(done.sandbox_context).piMessages;
    assert.ok(native.some(message => message.role === 'toolResult'), 'Pi native tool results survive in SQLite');
    const artifact = state.prepare('SELECT * FROM sandbox_artifacts WHERE run_id=?').get(started.id); assert.ok(artifact);
    const response = await fetch(`${app.origin}/api/agent-runs/${started.id}/artifacts/${artifact.id}/download`, { headers: app.headers });
    assert.equal(response.status, 200); const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, artifact.bytes); assert.equal(digest(bytes), artifact.sha256); assert.ok(bytes.includes(Buffer.from('Pi stream verified for approve')));
    assert.ok(done.cost_usd > 0 && done.total_tokens > 0);
  });
  await t.test('another user cannot read artifacts or approve; rejection resumes Pi without executing the action', async () => {
    const registered = await request(app.origin, '/api/auth/register', { 'content-type': 'application/json' }, { email: 'pi-other@example.test', password: 'PiOtherTest123!', firstName: 'Pi', lastName: 'Other' });
    assert.ok([200, 201].includes(registered.status), JSON.stringify(registered.body));
    const otherLogin = await request(app.origin, '/api/auth/login', { 'content-type': 'application/json' }, { email: 'pi-other@example.test', password: 'PiOtherTest123!' });
    assert.equal(otherLogin.status, 200, JSON.stringify(otherLogin.body));
    const otherToken = otherLogin.body.accessToken;
    assert.ok(otherToken, JSON.stringify(otherLogin.body));
    const otherHeaders = { 'content-type': 'application/json', authorization: `Bearer ${otherToken}` };
    const started = await startRun('reject'); await waitRun(started.id, ['waiting_approval']);
    const approval = state.prepare("SELECT * FROM sandbox_approvals WHERE run_id=? AND status='pending'").get(started.id);
    assert.equal((await request(app.origin, `/api/agent-runs/${started.id}/approvals/${approval.id}/approve`, otherHeaders, {})).status, 404);
    const artifact = state.prepare('SELECT * FROM sandbox_artifacts WHERE run_id=?').get(approvedRun);
    assert.equal((await request(app.origin, `/api/agent-runs/${approvedRun}/artifacts/${artifact.id}/download`, otherHeaders)).status, 404);
    assert.equal((await request(app.origin, `/api/agent-runs/${started.id}/approvals/${approval.id}/reject`, app.headers, {})).status, 200);
    const rejected = await waitRun(started.id, ['completed']);
    assert.match(rejected.result, /user rejected/); assert.equal(externalExecutions(started.id).length, 0);
  });
  await t.test('chat disconnect plus waiting and active cancellation stop work and abort upstream streams', async () => {
    const waiting = await startRun('cancel-waiting'); await waitRun(waiting.id, ['waiting_approval']);
    const approval = state.prepare("SELECT * FROM sandbox_approvals WHERE run_id=? AND status='pending'").get(waiting.id);
    assert.equal((await request(app.origin, `/api/agent-runs/${waiting.id}/cancel`, app.headers, {}, 'PUT')).status, 200);
    assert.equal((await request(app.origin, `/api/agent-runs/${waiting.id}/approvals/${approval.id}/approve`, app.headers, {})).status, 409);
    assert.equal(externalExecutions(waiting.id).length, 0);
    const active = await startRun('cancel-active');
    await until(() => model.calls.some(call => call.scenario === 'cancel-active'), 'active model stream');
    assert.equal((await request(app.origin, `/api/agent-runs/${active.id}/cancel`, app.headers, {}, 'PUT')).status, 200);
    await waitRun(active.id, ['cancelled']);
    await until(() => model.cancelled.has('cancel-active'), 'gateway abort reaches provider socket', 8000);
    assert.equal(state.prepare('SELECT COUNT(*) AS n FROM sandbox_artifacts WHERE run_id=?').get(active.id).n, 0);
    const thread = await request(app.origin, '/api/threads', app.headers, { title: 'Cancel chat', model: 'gpt-4o-mini' });
    assert.equal(thread.status, 201);
    const controller = new AbortController();
    const stream = await fetch(`${app.origin}/api/threads/${thread.body.data.id}/messages`, {
      method: 'POST', headers: app.headers, signal: controller.signal,
      body: JSON.stringify({ content: 'PI_CASE:chat-cancel-active', model: 'gpt-4o-mini' }),
    });
    await until(() => model.calls.some(call => call.scenario === 'chat-cancel-active'), 'chat model stream');
    controller.abort();
    await assert.rejects(() => stream.arrayBuffer(), /abort/i);
    await until(() => model.cancelled.has('chat-cancel-active'), 'chat disconnect abort reaches provider socket', 8000);
    assert.equal(model.calls.filter(call => call.scenario === 'chat-cancel-active').length, 1);
    assert.equal(state.prepare("SELECT COUNT(*) AS n FROM messages WHERE thread_id=? AND role='assistant'").get(thread.body.data.id).n, 0);
  });
  await t.test('tool budget aborts Pi before a second side effect; successful usage is billed exactly once', async () => {
    const started = await startRun('tool-budget', { maxToolCalls: 1 });
    const failed = await waitRun(started.id, ['failed']);
    assert.equal(failed.error, 'SANDBOX_TOOL_BUDGET_EXCEEDED');
    assert.equal(broker.executions.filter(call => call.runId === executionRunKey(started.id) && call.toolName === 'sandbox_file').length, 1);
    assert.ok(model.calls.every(call => call.body.stream === true), 'Every tested model call went through Pi streaming');
    const usage = state.prepare('SELECT SUM(total_tokens) AS tokens,COUNT(*) AS rows FROM usage_logs WHERE user_id=?').get(app.userId);
    const subscription = state.prepare('SELECT tokens_used FROM subscriptions WHERE user_id=?').get(app.userId);
    assert.ok(usage.rows >= 5); assert.equal(subscription.tokens_used, usage.tokens);
    const run = state.prepare('SELECT total_tokens,cost_usd FROM agent_runs WHERE id=?').get(approvedRun);
    assert.ok(state.prepare('SELECT * FROM usage_logs WHERE user_id=? AND total_tokens=? AND provider_cost=?').get(app.userId, run.total_tokens, run.cost_usd));
  });
});
