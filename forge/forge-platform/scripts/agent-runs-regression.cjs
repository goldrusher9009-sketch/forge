const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const crypto = require('node:crypto');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');

const appRoot = path.join(__dirname, '..');
const hashText = value => crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitFor(port, pathName, predicate, timeoutMs = 180_000, options = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${pathName}`, options);
      if (await predicate(response)) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.fail(`Timed out waiting for ${pathName}`);
}

test('agent runs persist direct no-tools evidence, cost, and failures across restart', {
  timeout: 240_000,
  skip: !process.env.OPENROUTER_API_KEY,
}, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-agent-runs-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const port = await getFreePort();
  let logs = '';
  let child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(port),
      NODE_ENV: 'test',
      JWT_SECRET: 'agent-run-regression-only',
      FRONTEND_URL: `http://127.0.0.1:${port}`,
      MORPH_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await waitFor(port, '/health', response => response.ok, 90_000);
  const login = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@forge.local', password: 'Admin1234!' }),
  });
  assert.equal(login.status, 200, logs);
  const auth = await login.json();
  const headers = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  const passportResponse = await fetch(`http://127.0.0.1:${port}/api/passport`, { headers });
  assert.equal(passportResponse.status, 200);
  const passport = (await passportResponse.json()).data;
  const mapping = await fetch(`http://127.0.0.1:${port}/api/passport`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      apptopia_agent_id: 'risk-brief-agent',
      apptopia_agent_version_id: 'version-1',
      apptopia_agent_version: '1.0.0',
    }),
  });
  assert.equal(mapping.status, 200);

  const prompt = '\uFEFFReply with exactly:\r\nFORGE_AGENT_RUN_OK';
  const started = await fetch(`http://127.0.0.1:${port}/api/agent-runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'real direct run',
      prompt,
      model: 'openrouter/openai/gpt-4.1-mini',
    }),
  });
  assert.equal(started.status, 200);
  const startedRun = await started.json();
  assert.equal(startedRun.status, 'running');
  assert.equal(startedRun.model, 'openai/gpt-4.1-mini');
  assert.equal(startedRun.provider, 'openrouter');
  assert.equal(startedRun.tool_calls, 0);
  assert.equal(startedRun.forge_agent_id, passport.id);
  assert.equal(startedRun.apptopia_agent_id, 'risk-brief-agent');
  assert.equal(startedRun.apptopia_agent_version_id, 'version-1');
  assert.equal(startedRun.apptopia_agent_version, '1.0.0');
  assert.match(startedRun.routing_reason, /deterministic no-tool pilot/);
  assert.equal(startedRun.request_hash, hashText(prompt));

  let completedRun;
  await waitFor(port, '/api/agent-runs', async response => {
    const rows = await response.json();
    completedRun = rows.find(row => row.id === startedRun.id);
    return completedRun?.status === 'done' || completedRun?.status === 'error';
  }, 180_000, { headers });
  assert.equal(completedRun.status, 'done', completedRun.error || logs);
  assert.match(completedRun.result, /FORGE_AGENT_RUN_OK/);
  assert.doesNotMatch(completedRun.result, /^Completed:/);
  assert.equal(completedRun.tool_calls, 0);
  assert.equal(completedRun.request_hash, hashText(prompt));
  assert.equal(completedRun.result_hash, hashText(completedRun.result));
  assert.ok(completedRun.prompt_tokens > 0);
  assert.ok(completedRun.completion_tokens > 0);
  assert.equal(completedRun.total_tokens, completedRun.prompt_tokens + completedRun.completion_tokens);
  assert.ok(completedRun.cost_usd > 0);
  assert.ok(completedRun.duration_ms > 0);
  assert.ok(completedRun.completed_at);
  assert.equal(completedRun.approval_status, 'pending');
  assert.ok(completedRun.approval_id);
  assert.equal(completedRun.sync_status, 'not_started');
  assert.equal(completedRun.protocol_call_id, null);
  assert.equal(completedRun.error, null);
  const pendingSync = await fetch(`http://127.0.0.1:${port}/api/agent-runs/${completedRun.id}/sync`, {
    method: 'POST', headers,
  });
  assert.equal(pendingSync.status, 409);
  assert.equal((await pendingSync.json()).sync_status, 'not_started');
  const pendingApprovals = await fetch(`http://127.0.0.1:${port}/api/approvals?status=pending`, { headers });
  const approvalRows = (await pendingApprovals.json()).data;
  assert.equal(approvalRows.some(row => row.id === completedRun.approval_id && row.type === 'agent_run'), true);

  const failed = await fetch(`http://127.0.0.1:${port}/api/agent-runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'missing key run', prompt: 'This must fail closed.', model: 'morph-regression-no-key' }),
  });
  assert.equal(failed.status, 200);
  const failedRun = await failed.json();
  let persistedFailure;
  await waitFor(port, '/api/agent-runs', async response => {
    const rows = await response.json();
    persistedFailure = rows.find(row => row.id === failedRun.id);
    return persistedFailure?.status === 'error';
  }, 30_000, { headers });
  assert.equal(persistedFailure.status, 'error');
  assert.match(persistedFailure.error, /No morph API key configured/);
  assert.notEqual(persistedFailure.status, 'done');
  const invalidFailureSync = await fetch(`http://127.0.0.1:${port}/api/agent-runs/${failedRun.id}/sync`, {
    method: 'POST', headers,
  });
  assert.equal(invalidFailureSync.status, 409);

  const state = new Database(dbPath, { readonly: true });
  const rows = state.prepare('SELECT id,status,result,error,model,provider,routing_reason,forge_agent_id,apptopia_agent_id,apptopia_agent_version_id,apptopia_agent_version,tool_calls,trace_id,request_hash,result_hash,prompt_tokens,completion_tokens,total_tokens,cost_usd,duration_ms,approval_id,approval_status,sync_status,protocol_call_id FROM agent_runs WHERE id IN (?,?) ORDER BY id').all(startedRun.id, failedRun.id);
  const usage = state.prepare('SELECT model,provider,prompt_tokens,completion_tokens,total_tokens,provider_cost FROM usage_logs WHERE user_id=? AND model=? ORDER BY created_at DESC LIMIT 1').get(auth.data.user.id, completedRun.model);
  state.close();
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.status), ['done', 'error']);
  assert.equal(rows[0].tool_calls, 0);
  assert.ok(rows[0].trace_id);
  assert.equal(rows[0].request_hash, completedRun.request_hash);
  assert.equal(rows[0].result_hash, completedRun.result_hash);
  assert.equal(rows[0].total_tokens, completedRun.total_tokens);
  assert.equal(rows[0].cost_usd, completedRun.cost_usd);
  assert.equal(rows[0].forge_agent_id, passport.id);
  assert.equal(rows[0].apptopia_agent_id, 'risk-brief-agent');
  assert.equal(rows[0].apptopia_agent_version_id, 'version-1');
  assert.equal(rows[0].apptopia_agent_version, '1.0.0');
  assert.ok(rows[0].approval_id);
  assert.equal(rows[0].approval_status, 'pending');
  assert.equal(rows[0].sync_status, 'not_started');
  assert.equal(rows[0].protocol_call_id, null);
  assert.ok(rows[1].error);
  assert.equal(rows[1].result_hash, null);
  assert.ok(rows[1].request_hash);
  assert.ok(rows[1].duration_ms >= 0);
  assert.deepEqual(usage, {
    model: completedRun.model,
    provider: completedRun.provider,
    prompt_tokens: completedRun.prompt_tokens,
    completion_tokens: completedRun.completion_tokens,
    total_tokens: completedRun.total_tokens,
    provider_cost: completedRun.cost_usd,
  });

  const firstExited = once(child, 'exit');
  child.kill();
  await firstExited;
  const restartedPort = await getFreePort();
  child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(restartedPort),
      NODE_ENV: 'test',
      JWT_SECRET: 'agent-run-regression-only',
      FRONTEND_URL: `http://127.0.0.1:${restartedPort}`,
      MORPH_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  await waitFor(restartedPort, '/health', response => response.ok, 90_000);
  const restartedLogin = await fetch(`http://127.0.0.1:${restartedPort}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@forge.local', password: 'Admin1234!' }),
  });
  assert.equal(restartedLogin.status, 200, logs);
  const restartedAuth = await restartedLogin.json();
  const afterRestart = await fetch(`http://127.0.0.1:${restartedPort}/api/agent-runs`, {
    headers: { authorization: `Bearer ${restartedAuth.accessToken}` },
  });
  const restartedRun = (await afterRestart.json()).find(row => row.id === startedRun.id);
  assert.equal(restartedRun.status, 'done');
  assert.equal(restartedRun.request_hash, completedRun.request_hash);
  assert.equal(restartedRun.result_hash, completedRun.result_hash);
  assert.equal(restartedRun.total_tokens, completedRun.total_tokens);
  assert.equal(restartedRun.cost_usd, completedRun.cost_usd);
  assert.equal(restartedRun.approval_status, 'pending');
  assert.equal(restartedRun.approval_id, completedRun.approval_id);
  assert.equal(restartedRun.sync_status, 'not_started');
  assert.equal(restartedRun.protocol_call_id, null);
});

test('Forge syncs completed agent runs to Apptopia with fail-closed, retry, and idempotent states', { timeout: 120_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-apptopia-sync-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const forgePort = await getFreePort();
  const apptopiaPort = await getFreePort();
  const connectorToken = 'apptopia-regression-token';
  const requests = [];
  const committed = new Set();
  let logs = '';
  const apptopia = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      requests.push({ url: req.url, authorization: req.headers.authorization, body });
      if (body.traceId === 'trace-401') {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ payload: { code: 'INVALID_TOKEN' } }));
        return;
      }
      if (body.traceId === 'trace-500') {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ payload: { code: 'UPSTREAM_FAILURE' } }));
        return;
      }
      if (body.traceId === 'trace-timeout') return;
      if (body.traceId === 'trace-lost-response' && !committed.has(body.traceId)) {
        committed.add(body.traceId);
        res.destroy();
        return;
      }
      const idempotent = body.traceId === 'trace-repeat' || committed.has(body.traceId);
      res.writeHead(idempotent ? 200 : 201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ payload: {
        protocolCallId: `protocol-${body.traceId}`,
        traceId: body.traceId,
        requestHash: hashText(body.input),
        resultHash: hashText(body.output),
        agentVersionId: body.traceId === 'trace-version-mismatch' ? 'wrong-version-id' : body.agentVersionId,
        agentVersion: body.agentVersion,
        idempotent,
      } }));
    });
  });
  await new Promise(resolve => apptopia.listen(apptopiaPort, '127.0.0.1', resolve));

  const child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(forgePort),
      NODE_ENV: 'test',
      JWT_SECRET: 'apptopia-sync-regression-only',
      FRONTEND_URL: `http://127.0.0.1:${forgePort}`,
      APPTOPIA_BASE_URL: `http://127.0.0.1:${apptopiaPort}`,
      APPTOPIA_SYNC_TIMEOUT_MS: '200',
      MORPH_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  let writer;
  t.after(async () => {
    try { writer?.close(); } catch {}
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    apptopia.closeAllConnections?.();
    await new Promise(resolve => apptopia.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await waitFor(forgePort, '/health', response => response.ok, 90_000);
  const login = await fetch(`http://127.0.0.1:${forgePort}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@forge.local', password: 'Admin1234!' }),
  });
  assert.equal(login.status, 200, logs);
  const auth = await login.json();
  const userId = auth.data.user.id;
  const headers = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  const passportResponse = await fetch(`http://127.0.0.1:${forgePort}/api/passport`, { headers });
  assert.equal(passportResponse.status, 200);
  const passport = (await passportResponse.json()).data;
  assert.equal(passport.apptopia_agent_id, null);
  const unmappedRun = await fetch(`http://127.0.0.1:${forgePort}/api/agent-runs`, {
    method: 'POST', headers, body: JSON.stringify({ name: 'unmapped run', prompt: 'must not execute', model: 'morph-regression-no-key' }),
  });
  assert.equal(unmappedRun.status, 409);
  assert.equal((await unmappedRun.json()).error, 'APPTOPIA_MAPPING_REQUIRED');
  const incompleteMapping = await fetch(`http://127.0.0.1:${forgePort}/api/passport`, {
    method: 'PATCH', headers, body: JSON.stringify({ apptopia_agent_id: 'risk-brief-agent' }),
  });
  assert.equal(incompleteMapping.status, 400);
  assert.equal((await incompleteMapping.json()).error, 'APPTOPIA_MAPPING_INCOMPLETE');
  const completeMapping = await fetch(`http://127.0.0.1:${forgePort}/api/passport`, {
    method: 'PATCH', headers, body: JSON.stringify({
      apptopia_agent_id: 'risk-brief-agent',
      apptopia_agent_version_id: 'version-1',
      apptopia_agent_version: '1.0.0',
    }),
  });
  assert.equal(completeMapping.status, 200);
  const mappedPassport = (await (await fetch(`http://127.0.0.1:${forgePort}/api/passport`, { headers })).json()).data;
  assert.equal(mappedPassport.apptopia_agent_id, 'risk-brief-agent');
  assert.equal(mappedPassport.apptopia_agent_version_id, 'version-1');
  assert.equal(mappedPassport.apptopia_agent_version, '1.0.0');

  writer = new Database(dbPath);
  const insert = writer.prepare(`INSERT INTO agent_runs
    (user_id,name,prompt,result,status,agent_id,agent_version,forge_agent_id,apptopia_agent_id,apptopia_agent_version_id,apptopia_agent_version,trace_id,request_hash,result_hash,model,provider,routing_reason,total_tokens,cost_usd,duration_ms,tool_calls,approval_status,sync_status,approval_id,completed_at,updated_at)
    VALUES (@user_id,@name,@prompt,@result,@status,@agent_id,@agent_version,@forge_agent_id,@apptopia_agent_id,@apptopia_agent_version_id,@apptopia_agent_version,@trace_id,@request_hash,@result_hash,@model,@provider,@routing_reason,@total_tokens,@cost_usd,@duration_ms,@tool_calls,@approval_status,@sync_status,@approval_id,datetime('now'),datetime('now'))`);
  const seed = (traceId, overrides = {}) => {
    const prompt = `prompt-${traceId}`;
    const result = `result-${traceId}`;
    return insert.run({
      user_id: userId,
      name: 'Apptopia sync regression',
      prompt,
      result,
      status: 'done',
      agent_id: 'risk-brief-agent',
      agent_version: '1.0.0',
      forge_agent_id: passport.id,
      apptopia_agent_id: 'risk-brief-agent',
      apptopia_agent_version_id: 'version-1',
      apptopia_agent_version: '1.0.0',
      trace_id: traceId,
      request_hash: hashText(prompt),
      result_hash: hashText(result),
      model: 'openai/gpt-4.1-mini',
      provider: 'openrouter',
      routing_reason: 'Explicit model selected for deterministic no-tool pilot: openai/gpt-4.1-mini',
      total_tokens: 12,
      cost_usd: 0.0042,
      duration_ms: 5,
      tool_calls: 0,
      approval_status: 'approved',
      sync_status: 'not_started',
      approval_id: null,
      ...overrides,
    }).lastInsertRowid;
  };
  const sync = id => fetch(`http://127.0.0.1:${forgePort}/api/agent-runs/${id}/sync`, { method: 'POST', headers });

  const pending = await sync(seed('trace-pending-approval', { approval_status: 'pending' }));
  assert.equal(pending.status, 409);
  assert.equal((await pending.json()).sync_status, 'not_started');
  const rejected = await sync(seed('trace-rejected-approval', { approval_status: 'rejected' }));
  assert.equal(rejected.status, 409);
  assert.equal((await rejected.json()).sync_status, 'not_started');
  assert.equal(requests.length, 0);

  for (const [traceId, override, expectedError] of [
    ['trace-missing-forge-agent', { forge_agent_id: null }, 'FORGE_AGENT_ID_REQUIRED'],
    ['trace-missing-apptopia-agent', { apptopia_agent_id: null }, 'APPTOPIA_AGENT_ID_REQUIRED'],
    ['trace-missing-version-id', { apptopia_agent_version_id: null }, 'APPTOPIA_AGENT_VERSION_ID_REQUIRED'],
    ['trace-missing-version', { apptopia_agent_version: null }, 'APPTOPIA_AGENT_VERSION_REQUIRED'],
  ]) {
    const response = await sync(seed(traceId, override));
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, expectedError);
  }
  assert.equal(requests.length, 0);

  const missingCredential = await sync(seed('trace-missing-credential'));
  assert.equal(missingCredential.status, 503);
  assert.equal((await missingCredential.json()).error, 'APPTOPIA_CREDENTIAL_REQUIRED');
  assert.equal(requests.length, 0);

  const connector = await fetch(`http://127.0.0.1:${forgePort}/api/connectors`, {
    method: 'POST', headers, body: JSON.stringify({ id: 'apptopia', key: connectorToken }),
  });
  assert.equal(connector.status, 200);

  const success = await sync(seed('trace-success'));
  assert.equal(success.status, 200);
  const successRun = await success.json();
  assert.equal(successRun.sync_status, 'synced');
  assert.equal(successRun.protocol_call_id, 'protocol-trace-success');

  const repeat = await sync(seed('trace-repeat'));
  assert.equal(repeat.status, 200);
  const repeatRun = await repeat.json();
  assert.equal(repeatRun.sync_status, 'synced');
  assert.equal(repeatRun.protocol_call_id, 'protocol-trace-repeat');

  const versionMismatch = await sync(seed('trace-version-mismatch'));
  assert.equal(versionMismatch.status, 502);
  const versionMismatchRun = await versionMismatch.json();
  assert.equal(versionMismatchRun.sync_status, 'error');
  assert.equal(versionMismatchRun.error, 'APPTOPIA_SYNC_AGENT_VERSION_MISMATCH');

  const unauthorized = await sync(seed('trace-401'));
  assert.equal(unauthorized.status, 502);
  const unauthorizedRun = await unauthorized.json();
  assert.equal(unauthorizedRun.sync_status, 'error');
  assert.equal(unauthorizedRun.error, 'APPTOPIA_SYNC_HTTP_401');

  const upstreamError = await sync(seed('trace-500'));
  assert.equal(upstreamError.status, 502);
  const upstreamErrorRun = await upstreamError.json();
  assert.equal(upstreamErrorRun.sync_status, 'error');
  assert.equal(upstreamErrorRun.error, 'APPTOPIA_SYNC_HTTP_500');

  const timeout = await sync(seed('trace-timeout'));
  assert.equal(timeout.status, 504);
  const timeoutRun = await timeout.json();
  assert.equal(timeoutRun.sync_status, 'error');
  assert.equal(timeoutRun.error, 'APPTOPIA_SYNC_TIMEOUT');

  const lostResponseId = seed('trace-lost-response');
  const lostResponse = await sync(lostResponseId);
  assert.equal(lostResponse.status, 502);
  const lostResponseRun = await lostResponse.json();
  assert.equal(lostResponseRun.status, 'done');
  assert.equal(lostResponseRun.sync_status, 'error');
  assert.equal(lostResponseRun.error, 'APPTOPIA_SYNC_NETWORK_ERROR');
  assert.equal(lostResponseRun.protocol_call_id, null);

  const recovered = await sync(lostResponseId);
  assert.equal(recovered.status, 200);
  const recoveredRun = await recovered.json();
  assert.equal(recoveredRun.status, 'done');
  assert.equal(recoveredRun.sync_status, 'synced');
  assert.equal(recoveredRun.protocol_call_id, 'protocol-trace-lost-response');

  const approvalId = 'appr_agent_run_regression';
  const approvalRunId = seed('trace-owner-approved', { approval_status: 'pending', approval_id: approvalId });
  writer.prepare(`INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,status)
    VALUES (?,?,?,?,?,?,?,'pending')`).run(approvalId, userId, 'agent_run', 'Approve pilot evidence', '{}', 'result-trace-owner-approved', 'apptopia');
  const requestsBeforeApproval = requests.length;
  const blockedBeforeApproval = await sync(approvalRunId);
  assert.equal(blockedBeforeApproval.status, 409);
  assert.equal(requests.length, requestsBeforeApproval);
  const approve = await fetch(`http://127.0.0.1:${forgePort}/api/approvals/${approvalId}/approve`, { method: 'POST', headers });
  assert.equal(approve.status, 200);
  const approvedBody = await approve.json();
  assert.equal(approvedBody.success, true);
  assert.equal(approvedBody.data.syncAttemptStatus, 200);
  assert.equal(approvedBody.data.run.approval_status, 'approved');
  assert.equal(approvedBody.data.run.sync_status, 'synced');
  assert.equal(requests.length, requestsBeforeApproval + 1);
  const approveReplay = await fetch(`http://127.0.0.1:${forgePort}/api/approvals/${approvalId}/approve`, { method: 'POST', headers });
  assert.equal(approveReplay.status, 200);
  assert.equal((await approveReplay.json()).data.run.protocol_call_id, 'protocol-trace-owner-approved');
  assert.equal(requests.length, requestsBeforeApproval + 1);
  const lockedReject = await fetch(`http://127.0.0.1:${forgePort}/api/approvals/${approvalId}/reject`, { method: 'POST', headers });
  assert.equal(lockedReject.status, 409);
  assert.equal((await lockedReject.json()).error, 'AGENT_RUN_APPROVAL_LOCKED');
  const lockedDelete = await fetch(`http://127.0.0.1:${forgePort}/api/approvals/${approvalId}`, { method: 'DELETE', headers });
  assert.equal(lockedDelete.status, 409);
  assert.equal((await lockedDelete.json()).error, 'AGENT_RUN_APPROVAL_REQUIRED');

  const rejectionId = 'appr_agent_run_rejection';
  const rejectionRunId = seed('trace-owner-rejected', { approval_status: 'pending', approval_id: rejectionId });
  writer.prepare(`INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,status)
    VALUES (?,?,?,?,?,?,?,'pending')`).run(rejectionId, userId, 'agent_run', 'Reject pilot evidence', '{}', 'result-trace-owner-rejected', 'apptopia');
  const reject = await fetch(`http://127.0.0.1:${forgePort}/api/approvals/${rejectionId}/reject`, { method: 'POST', headers });
  assert.equal(reject.status, 200);
  assert.equal((await reject.json()).data.approval_status, 'rejected');
  const rejectedSync = await sync(rejectionRunId);
  assert.equal(rejectedSync.status, 409);
  assert.equal((await rejectedSync.json()).approval_status, 'rejected');
  assert.equal(requests.length, requestsBeforeApproval + 1);

  const approveAllId = 'appr_agent_run_approve_all';
  seed('trace-owner-approve-all', { approval_status: 'pending', approval_id: approveAllId });
  writer.prepare(`INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,status)
    VALUES (?,?,?,?,?,?,?,'pending')`).run(approveAllId, userId, 'agent_run', 'Approve all pilot evidence', '{}', 'result-trace-owner-approve-all', 'apptopia');
  writer.prepare(`INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,status)
    VALUES (?,?,?,?,?,?,?,'pending')`).run('appr_generic_regression', userId, 'social_post', 'Generic approval', '{}', 'generic', 'social');
  const approveAll = await fetch(`http://127.0.0.1:${forgePort}/api/approvals/approve-all`, { method: 'POST', headers });
  assert.equal(approveAll.status, 200);
  const approveAllBody = await approveAll.json();
  assert.equal(approveAllBody.updated, 2);
  assert.deepEqual(approveAllBody.agentRuns.map(row => row.syncStatus), ['synced']);
  assert.equal(requests.length, requestsBeforeApproval + 2);

  const tamperedId = seed('trace-hash-tamper');
  writer.prepare('UPDATE agent_runs SET result_hash=? WHERE id=?').run('0'.repeat(64), tamperedId);
  const tampered = await sync(tamperedId);
  assert.equal(tampered.status, 409);
  const tamperedRun = await tampered.json();
  assert.equal(tamperedRun.sync_status, 'error');
  assert.equal(tamperedRun.error, 'APPTOPIA_LOCAL_HASH_MISMATCH');
  assert.equal(tamperedRun.protocol_call_id, null);

  const revoked = await fetch(`http://127.0.0.1:${forgePort}/api/connectors/apptopia`, {
    method: 'DELETE', headers,
  });
  assert.equal(revoked.status, 200);
  const revokedCredential = await sync(seed('trace-revoked-credential'));
  assert.equal(revokedCredential.status, 503);
  const revokedCredentialRun = await revokedCredential.json();
  assert.equal(revokedCredentialRun.sync_status, 'error');
  assert.equal(revokedCredentialRun.error, 'APPTOPIA_CREDENTIAL_REQUIRED');
  assert.equal(revokedCredentialRun.protocol_call_id, null);

  assert.equal(requests.length, 10);
  assert.equal(requests.every(row => row.url === '/api/protocol/agents/risk-brief-agent/runs'), true);
  assert.equal(requests.every(row => row.authorization === `Bearer ${connectorToken}`), true);
  assert.equal(requests.every(row => Array.isArray(row.body.toolCalls) && row.body.toolCalls.length === 0 && row.body.status === 'COMPLETED'), true);
  assert.equal(requests.every(row => row.body.forgeAgentId === passport.id), true);
  assert.equal(requests.every(row => row.body.agentVersionId === 'version-1' && row.body.agentVersion === '1.0.0'), true);
  assert.equal(requests.every(row => row.body.model === 'openai/gpt-4.1-mini' && row.body.provider === 'openrouter'), true);
  assert.equal(requests.every(row => row.body.routingReason.includes('deterministic no-tool pilot') && row.body.costUsd === 0.0042), true);
  assert.doesNotMatch(logs, new RegExp(connectorToken));
});
