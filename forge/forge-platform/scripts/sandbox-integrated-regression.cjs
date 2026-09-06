'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const test = require('node:test');

const appRoot = path.resolve(__dirname, '..');

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server.address().port;
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 5000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function waitForHealth(port, child, logs) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Forge exited before health check (${child.exitCode})\n${logs()}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Forge health timeout\n${logs()}`);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function openAIResponse(res, message) {
  const payload = JSON.stringify({
    id: `mock-${crypto.randomUUID()}`,
    object: 'chat.completion',
    choices: [{ index: 0, finish_reason: message.tool_calls?.length ? 'tool_calls' : 'stop', message }],
    usage: { prompt_tokens: 17, completion_tokens: 9, total_tokens: 26, cost: 0.000026 },
  });
  res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) });
  res.end(payload);
}

function toolMessage(name, args) {
  return {
    role: 'assistant',
    content: '',
    tool_calls: [{
      id: `call_${crypto.randomUUID().replace(/-/g, '')}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(args) },
    }],
  };
}

function createMockModel() {
  const calls = new Map();
  const pendingTimers = new Set();
  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end('{"error":"mock route not found"}');
      return;
    }
    const body = await readRequestBody(req);
    const text = (body.messages || []).map(message => String(message.content || '')).join('\n');
    const scenario = ['complete-file', 'reject-approval', 'cancel-waiting', 'cancel-model', 'cancel-shell', 'cancel-browser']
      .find(name => text.includes(name)) || 'unknown';
    calls.set(scenario, Number(calls.get(scenario) || 0) + 1);
    const hasToolResult = text.includes('Forge tool result for');
    const hasRejected = text.includes('The user rejected this external action');

    if (scenario === 'cancel-model') {
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);
        openAIResponse(res, { role: 'assistant', content: 'This delayed response should have been cancelled.' });
      }, 60_000);
      pendingTimers.add(timer);
      req.once('close', () => { clearTimeout(timer); pendingTimers.delete(timer); });
      return;
    }
    if (scenario === 'complete-file' && !hasToolResult) {
      openAIResponse(res, toolMessage('sandbox_file', { operation: 'write', path: 'deliverable.txt', content: 'Forge integrated sandbox evidence.\n' }));
      return;
    }
    if (scenario === 'reject-approval' && !hasRejected) {
      openAIResponse(res, toolMessage('sandbox_browser', {
        actions: [{ action: 'navigate', url: 'https://example.com' }, { action: 'click', selector: 'a' }],
      }));
      return;
    }
    if (scenario === 'cancel-waiting') {
      openAIResponse(res, toolMessage('sandbox_browser', {
        actions: [{ action: 'navigate', url: 'https://example.com' }, { action: 'click', selector: 'a' }],
      }));
      return;
    }
    if (scenario === 'cancel-shell' && !hasToolResult) {
      openAIResponse(res, toolMessage('sandbox_shell', { command: 'sleep 30', cwd: '.', timeoutMs: 60_000 }));
      return;
    }
    if (scenario === 'cancel-browser' && !hasToolResult) {
      openAIResponse(res, toolMessage('sandbox_browser', {
        actions: [{ action: 'navigate', url: 'https://example.com' }, { action: 'wait', timeoutMs: 60_000 }],
      }));
      return;
    }
    openAIResponse(res, { role: 'assistant', content: `Completed ${scenario} with durable Forge evidence.` });
  });
  return { server, calls, clearPending: () => { for (const timer of pendingTimers) clearTimeout(timer); pendingTimers.clear(); } };
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test('Forge API drives real Orchestrator Runs, approvals, SSE, artifacts, and four cancellation paths', { timeout: 240_000 }, async t => {
  const orchestratorUrl = String(process.env.FORGE_SANDBOX_ORCHESTRATOR_URL || '').trim();
  const hmacSecret = String(process.env.FORGE_SANDBOX_HMAC_SECRET || '');
  assert.ok(orchestratorUrl, 'FORGE_SANDBOX_ORCHESTRATOR_URL is required');
  assert.ok(hmacSecret, 'FORGE_SANDBOX_HMAC_SECRET is required');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-sandbox-integrated-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const mock = createMockModel();
  const mockPort = await listen(mock.server);
  const probeServer = http.createServer();
  const forgePort = await listen(probeServer);
  await new Promise(resolve => probeServer.close(resolve));
  let logs = '';
  const child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(forgePort),
      NODE_ENV: 'test',
      JWT_SECRET: 'sandbox-integrated-regression-jwt',
      ENCRYPTION_KEY: 'sandbox-integrated-regression-encryption-key-32bytes',
      FRONTEND_URL: `http://127.0.0.1:${forgePort}`,
      MORPH_API_KEY: '',
      FORGE_SANDBOX_ORCHESTRATOR_URL: orchestratorUrl,
      FORGE_SANDBOX_HMAC_SECRET: hmacSecret,
      FORGE_SANDBOX_TEST_OPENAI_CHAT_URL: `http://127.0.0.1:${mockPort}/v1/chat/completions`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk.toString(); });
  child.stderr.on('data', chunk => { logs += chunk.toString(); });

  t.after(async () => {
    await stopChild(child);
    mock.clearPending();
    mock.server.closeAllConnections?.();
    await new Promise(resolve => mock.server.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await waitForHealth(forgePort, child, () => logs);
  const origin = `http://127.0.0.1:${forgePort}`;
  const login = await jsonFetch(`${origin}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@forge.local', password: 'Admin1234!' }),
  });
  assert.equal(login.response.status, 200, logs);
  const token = login.body.accessToken;
  assert.ok(token);
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  const saveKey = await jsonFetch(`${origin}/api/keys`, {
    method: 'POST', headers, body: JSON.stringify({ openai_key: 'sk-mock-integrated-only' }),
  });
  assert.equal(saveKey.response.status, 200, JSON.stringify(saveKey.body));

  const workspaceResponse = await jsonFetch(`${origin}/api/sandbox-workspaces`, {
    method: 'POST', headers, body: JSON.stringify({ name: 'Integrated Regression Workspace' }),
  });
  assert.equal(workspaceResponse.response.status, 201, JSON.stringify(workspaceResponse.body));
  const workspaceId = workspaceResponse.body.data.id;

  const uploadContent = Buffer.from('input evidence\n');
  const upload = await jsonFetch(`${origin}/api/sandbox-workspaces/${workspaceId}/files`, {
    method: 'POST', headers,
    body: JSON.stringify({ path: 'inputs/evidence.txt', contentBase64: uploadContent.toString('base64') }),
  });
  assert.equal(upload.response.status, 201, JSON.stringify(upload.body));
  assert.equal(upload.body.data.bytes, uploadContent.length);
  assert.equal(upload.body.data.sha256, crypto.createHash('sha256').update(uploadContent).digest('hex'));

  async function startRun(scenario) {
    const created = await jsonFetch(`${origin}/api/agent-runs`, {
      method: 'POST', headers: { ...headers, 'idempotency-key': `integrated-${scenario}-${crypto.randomUUID()}` },
      body: JSON.stringify({
        name: `Integrated ${scenario}`,
        prompt: `Execute the ${scenario} regression scenario.`,
        model: 'gpt-4o-mini',
        executionMode: 'sandbox',
        workspaceId,
        maxCostUsd: 2,
        maxToolCalls: 10,
      }),
    });
    assert.equal(created.response.status, 202, JSON.stringify(created.body));
    return created.body;
  }

  async function details(runId) {
    const result = await jsonFetch(`${origin}/api/agent-runs/${runId}/details`, { headers });
    assert.equal(result.response.status, 200, JSON.stringify(result.body));
    return result.body;
  }

  async function waitRun(runId, predicate, label, timeout = 90_000) {
    const deadline = Date.now() + timeout;
    let last = null;
    while (Date.now() < deadline) {
      last = await details(runId);
      if (predicate(last)) return last;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error(`${label} timeout\n${JSON.stringify(last, null, 2)}\n${logs}`);
  }

  async function cancelAndAssert(run, waitForPredicate, label) {
    await waitRun(run.id, waitForPredicate, `${label} did not reach cancellable state`);
    const cancelled = await jsonFetch(`${origin}/api/agent-runs/${run.id}/cancel`, { method: 'PUT', headers });
    assert.equal(cancelled.response.status, 200, JSON.stringify(cancelled.body));
    const terminal = await waitRun(run.id, value => value.run.status === 'cancelled' && value.run.sandbox_state === 'destroyed', `${label} did not cancel and destroy`);
    assert.equal(terminal.run.status, 'cancelled');
    assert.equal(terminal.run.sandbox_state, 'destroyed');
    return terminal;
  }

  const completedRun = await startRun('complete-file');
  const completed = await waitRun(completedRun.id, value => value.run.status === 'completed' && value.run.sandbox_state === 'destroyed', 'complete-file Run');
  assert.ok(completed.tools.some(tool => tool.tool_name === 'sandbox_file' && tool.status === 'completed'));
  assert.ok(completed.artifacts.length >= 1);
  assert.ok(completed.events.some(event => event.type === 'sandbox_destroyed'));
  const artifact = completed.artifacts[0];
  const artifactResponse = await fetch(`${origin}/api/agent-runs/${completedRun.id}/artifacts/${artifact.id}/download`, { headers });
  assert.equal(artifactResponse.status, 200);
  const artifactBytes = Buffer.from(await artifactResponse.arrayBuffer());
  assert.equal(artifactBytes.length, Number(artifact.bytes));
  assert.equal(crypto.createHash('sha256').update(artifactBytes).digest('hex'), artifact.sha256);

  const unauthenticatedSse = await fetch(`${origin}/api/agent-runs/${completedRun.id}/events`);
  assert.equal(unauthenticatedSse.status, 401);
  const authenticatedSse = await fetch(`${origin}/api/agent-runs/${completedRun.id}/events`, { headers });
  assert.equal(authenticatedSse.status, 200);
  const sseText = await authenticatedSse.text();
  assert.ok(sseText.includes('event: stream_complete'));
  assert.ok(sseText.indexOf('sandbox_destroyed') < sseText.indexOf('event: stream_complete'));

  const rejectedRun = await startRun('reject-approval');
  const waiting = await waitRun(rejectedRun.id, value => value.run.status === 'waiting_approval' && value.approval, 'approval wait');
  const rejected = await jsonFetch(`${origin}/api/agent-runs/${rejectedRun.id}/approvals/${waiting.approval.id}/reject`, { method: 'POST', headers, body: '{}' });
  assert.equal(rejected.response.status, 200, JSON.stringify(rejected.body));
  const rejectedCompleted = await waitRun(rejectedRun.id, value => value.run.status === 'completed' && value.run.sandbox_state === 'destroyed', 'rejected approval continuation');
  assert.ok(rejectedCompleted.tools.some(tool => tool.tool_name === 'sandbox_browser' && tool.approval_status === 'rejected' && tool.status === 'rejected'));

  const waitingCancelRun = await startRun('cancel-waiting');
  const waitingCancelled = await cancelAndAssert(waitingCancelRun, value => value.run.status === 'waiting_approval' && value.approval, 'waiting approval cancellation');
  assert.ok(waitingCancelled.tools.some(tool => tool.approval_status === 'cancelled' && tool.status === 'cancelled'));

  const modelCancelRun = await startRun('cancel-model');
  await cancelAndAssert(modelCancelRun, value => value.run.status === 'running' && Number(mock.calls.get('cancel-model') || 0) > 0, 'model request cancellation');

  const shellCancelRun = await startRun('cancel-shell');
  const shellCancelled = await cancelAndAssert(shellCancelRun, value => value.tools.some(tool => tool.tool_name === 'sandbox_shell' && tool.status === 'running'), 'Shell cancellation');
  assert.ok(shellCancelled.tools.some(tool => tool.tool_name === 'sandbox_shell' && tool.status === 'cancelled'));

  const browserCancelRun = await startRun('cancel-browser');
  const browserCancelled = await cancelAndAssert(browserCancelRun, value => value.tools.some(tool => tool.tool_name === 'sandbox_browser' && tool.status === 'running'), 'Browser cancellation');
  assert.ok(browserCancelled.tools.some(tool => tool.tool_name === 'sandbox_browser' && tool.status === 'cancelled'));

  process.stdout.write(`${JSON.stringify({
    passed: true,
    completedRunId: completedRun.id,
    artifactSha256: artifact.sha256,
    cancellationPaths: ['model request', 'Shell execution', 'Browser operation', 'waiting approval'],
    sseOrdering: 'sandbox_destroyed before stream_complete',
  }, null, 2)}\n`);
});
