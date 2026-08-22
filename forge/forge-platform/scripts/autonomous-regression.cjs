const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');

const appRoot = path.join(__dirname, '..');
const hashValue = value => crypto.createHash('sha256').update(JSON.stringify(value) ?? 'null', 'utf8').digest('hex');

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

function spawnForge(dbPath, port) {
  let logs = '';
  const child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(port),
      NODE_ENV: 'test',
      JWT_SECRET: 'autonomous-regression-jwt-only',
      CREDENTIAL_ENCRYPTION_KEY: 'autonomous-regression-credential-only',
      FRONTEND_URL: `http://127.0.0.1:${port}`,
      ANTHROPIC_API_KEY: '',
      OPENAI_API_KEY: '',
      OPENROUTER_API_KEY: 'autonomous-regression-placeholder-key',
      BRAVE_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  return { child, getLogs: () => logs };
}

async function stopForge(child) {
  if (child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}

async function waitFor(port, pathName, predicate, timeoutMs = 90_000, options = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${pathName}`, options);
      if (await predicate(response)) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.fail(`Timed out waiting for ${pathName}`);
}

async function login(port, email, password) {
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  return response.json();
}

const authHeaders = token => ({ authorization: `Bearer ${token}`, 'content-type': 'application/json' });

async function postJson(port, pathName, token, body) {
  return fetch(`http://127.0.0.1:${port}${pathName}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

function parseSse(text) {
  return text.split('\n\n').map(block => block.split('\n').find(line => line.startsWith('data: '))).filter(Boolean).map(line => JSON.parse(line.slice(6)));
}

test('autonomous tasks enforce identity, budgets, ownership, evidence, cancellation, and approval state', { timeout: 180_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-autonomous-'));
  const dbPath = path.join(tempDir, 'forge.db');
  let port = await getFreePort();
  let runtime = spawnForge(dbPath, port);
  let child = runtime.child;
  let logs = '';
  t.after(async () => {
    await stopForge(child);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await waitFor(port, '/ready', response => response.status === 200);
  const admin = await login(port, 'admin@forge.local', 'Admin1234!');
  const adminToken = admin.accessToken;
  const adminId = admin.data.user.id;
  const adminHeaders = authHeaders(adminToken);
  const passportResponse = await fetch(`http://127.0.0.1:${port}/api/passport`, { headers: adminHeaders });
  assert.equal(passportResponse.status, 200);
  const passport = (await passportResponse.json()).data;

  for (const [body, code] of [
    [{ goal: 'invalid token budget', token_budget: 499 }, 'AUTONOMOUS_TOKEN_BUDGET_INVALID'],
    [{ goal: 'invalid cost budget', cost_budget_usd: 0.001 }, 'AUTONOMOUS_COST_BUDGET_INVALID'],
    [{ goal: 'invalid step count', max_steps: 13 }, 'AUTONOMOUS_MAX_STEPS_INVALID'],
    [{ goal: 'invalid tool boundary', allowed_tools: ['not_a_forge_tool'] }, 'AUTONOMOUS_ALLOWED_TOOLS_INVALID'],
  ]) {
    const response = await postJson(port, '/api/autonomous', adminToken, body);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, code);
  }
  let state = new Database(dbPath);
  assert.equal(state.prepare('SELECT COUNT(*) AS count FROM autonomous_tasks').get().count, 0);
  const autonomousColumns = new Set(state.prepare('PRAGMA table_info(autonomous_tasks)').all().map(column => column.name));
  for (const column of ['passport_id', 'provider', 'model', 'max_steps', 'allowed_tools', 'policy_snapshot', 'request_hash', 'result_hash', 'tool_events', 'tool_calls', 'token_budget', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'cost_budget_usd', 'cost_usd', 'approval_id', 'approval_status', 'cancel_requested', 'error', 'updated_at']) {
    assert.equal(autonomousColumns.has(column), true, `missing autonomous_tasks.${column}`);
  }

  const active = state.prepare("INSERT INTO autonomous_tasks (user_id,goal,status,passport_id,provider,model,request_hash) VALUES (?,?,'running',?,'openrouter','meta-llama/llama-3.1-8b-instruct',?)")
    .run(adminId, 'deterministic active task', passport.id, hashValue('deterministic active task'));
  assert.throws(
    () => state.prepare("INSERT INTO autonomous_tasks (user_id,goal,status) VALUES (?,?,'running')").run(adminId, 'duplicate active task'),
    /UNIQUE constraint failed: autonomous_tasks\.user_id/,
  );
  state.close();

  const blocked = await postJson(port, '/api/autonomous', adminToken, { goal: 'must not start twice' });
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).error, 'AUTONOMOUS_TASK_ACTIVE');

  const register = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'autonomous-owner-test@forge.local', password: 'OwnerTest1234!' }),
  });
  assert.equal(register.status, 201);
  const other = await login(port, 'autonomous-owner-test@forge.local', 'OwnerTest1234!');
  const otherToken = other.accessToken;
  const otherHeaders = authHeaders(otherToken);
  const otherPassportResponse = await fetch(`http://127.0.0.1:${port}/api/passport`, { headers: otherHeaders });
  assert.equal(otherPassportResponse.status, 200);

  const forbiddenStatus = await fetch(`http://127.0.0.1:${port}/api/autonomous/${active.lastInsertRowid}`, { headers: otherHeaders });
  assert.equal(forbiddenStatus.status, 404);
  const forbiddenCancel = await postJson(port, `/api/autonomous/${active.lastInsertRowid}/cancel`, otherToken, {});
  assert.equal(forbiddenCancel.status, 404);

  const cancelled = await postJson(port, `/api/autonomous/${active.lastInsertRowid}/cancel`, adminToken, {});
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).data.status, 'cancelled');
  const cancelReplay = await postJson(port, `/api/autonomous/${active.lastInsertRowid}/cancel`, adminToken, {});
  assert.equal(cancelReplay.status, 200);
  assert.equal((await cancelReplay.json()).data.status, 'cancelled');

  const policy = await postJson(port, '/api/workspace-policies', otherToken, { name: 'Large deterministic policy', rule: 'P'.repeat(4000) });
  assert.equal(policy.status, 200);
  const budgetResponse = await postJson(port, '/api/autonomous', otherToken, {
    goal: 'Prove the task budget fails closed before any model request.',
    max_steps: 1,
    token_budget: 500,
    cost_budget_usd: 0.01,
    allowed_tools: ['final_answer'],
  });
  assert.equal(budgetResponse.status, 200);
  const budgetEvents = parseSse(await budgetResponse.text());
  const budgetStart = budgetEvents.find(event => event.type === 'start');
  assert.ok(budgetStart?.task_id);
  const budgetTaskResponse = await fetch(`http://127.0.0.1:${port}/api/autonomous/${budgetStart.task_id}`, { headers: otherHeaders });
  assert.equal(budgetTaskResponse.status, 200);
  const budgetTask = (await budgetTaskResponse.json()).data;
  assert.equal(budgetTask.status, 'budget_exhausted');
  assert.equal(budgetTask.approval_id, null);
  assert.equal(budgetTask.approval_status, 'not_required');
  assert.equal(budgetTask.total_tokens, 0);

  state = new Database(dbPath);
  assert.equal(state.prepare("SELECT COUNT(*) AS count FROM pending_approvals WHERE user_id=? AND type='autonomous_task'").get(other.data.user.id).count, 0);
  assert.equal(state.prepare("SELECT COUNT(*) AS count FROM usage_logs WHERE user_id=? AND provider='openrouter'").get(other.data.user.id).count, 0);

  const insertCompleted = ({ goal, result, approvalId }) => {
    const requestHash = hashValue({ goal, passportId: passport.id });
    const resultHash = hashValue(result);
    const toolEvents = [{ step: 1, tool: 'final_answer', description: 'fixture output', argument_hash: hashValue({ answer: result }), result_hash: resultHash, latency_ms: 2, success: true }];
    const row = state.prepare(`INSERT INTO autonomous_tasks
      (user_id,goal,plan,steps_completed,status,result,passport_id,provider,model,max_steps,allowed_tools,policy_snapshot,request_hash,result_hash,tool_events,tool_calls,token_budget,prompt_tokens,completion_tokens,total_tokens,cost_budget_usd,cost_usd,approval_id,approval_status,cancel_requested,updated_at,completed_at)
      VALUES (?,?,?,1,'completed',? ,?,'openrouter','openai/gpt-4.1-mini',1,'["final_answer"]','[]',?,?,?,1,8000,10,5,15,0.25,0.001,?,'pending',0,datetime('now'),datetime('now'))`)
      .run(adminId, goal, JSON.stringify([{ step: 1, tool: 'final_answer' }]), result, passport.id, requestHash, resultHash, JSON.stringify(toolEvents), approvalId);
    state.prepare(`INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,status) VALUES (?,?, 'autonomous_task', ?,?,?, 'forge','pending')`)
      .run(approvalId, adminId, `Autonomous Task: ${goal}`, JSON.stringify({ taskId: Number(row.lastInsertRowid), passportId: passport.id, requestHash, resultHash }), result);
    state.prepare('INSERT INTO usage_logs (id,user_id,model,provider,prompt_tokens,completion_tokens,total_tokens,provider_cost,forge_revenue,markup_multiplier) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(crypto.randomUUID(), adminId, 'openai/gpt-4.1-mini', 'openrouter', 10, 5, 15, 0.001, 0.0013, 1.3);
    state.prepare('INSERT INTO token_usage (user_id,model,input_tokens,output_tokens,total_tokens,cost_usd,endpoint) VALUES (?,?,?,?,?,?,?)')
      .run(adminId, 'openai/gpt-4.1-mini', 10, 5, 15, 0.001, '/api/autonomous');
    return { id: Number(row.lastInsertRowid), requestHash, resultHash, toolEvents };
  };

  const approvedFixture = insertCompleted({ goal: 'approved fixture', result: 'APPROVED_FIXTURE_RESULT', approvalId: 'appr_autonomous_approved' });
  const rejectedFixture = insertCompleted({ goal: 'rejected fixture', result: 'REJECTED_FIXTURE_RESULT', approvalId: 'appr_autonomous_rejected' });
  state.prepare("INSERT INTO autonomous_tasks (user_id,goal,status,passport_id,request_hash,approval_status,error,completed_at) VALUES (?,?,'failed',?,?,'not_required','fixture failure',datetime('now'))")
    .run(adminId, 'failed fixture', passport.id, hashValue('failed fixture'));

  const persistedFixture = state.prepare('SELECT * FROM autonomous_tasks WHERE id=?').get(approvedFixture.id);
  assert.equal(persistedFixture.passport_id, passport.id);
  assert.equal(persistedFixture.request_hash, approvedFixture.requestHash);
  assert.equal(persistedFixture.result_hash, approvedFixture.resultHash);
  assert.deepEqual(JSON.parse(persistedFixture.tool_events), approvedFixture.toolEvents);
  assert.equal(persistedFixture.approval_status, 'pending');
  assert.equal(state.prepare("SELECT COUNT(*) AS count FROM usage_logs WHERE user_id=? AND provider='openrouter'").get(adminId).count, 2);
  assert.equal(state.prepare("SELECT COUNT(*) AS count FROM token_usage WHERE user_id=? AND endpoint='/api/autonomous'").get(adminId).count, 2);
  assert.equal(state.prepare("SELECT COUNT(*) AS count FROM pending_approvals p JOIN autonomous_tasks a ON a.approval_id=p.id WHERE a.status IN ('failed','budget_exhausted')").get().count, 0);
  state.close();

  const pendingDelete = await fetch(`http://127.0.0.1:${port}/api/approvals/appr_autonomous_approved`, { method: 'DELETE', headers: adminHeaders });
  assert.equal(pendingDelete.status, 409);
  assert.equal((await pendingDelete.json()).error, 'AUTONOMOUS_TASK_APPROVAL_REQUIRED');
  const approve = await postJson(port, '/api/approvals/appr_autonomous_approved/approve', adminToken, {});
  assert.equal(approve.status, 200);
  assert.equal((await approve.json()).data.approval_status, 'approved');
  const approveReplay = await postJson(port, '/api/approvals/appr_autonomous_approved/approve', adminToken, {});
  assert.equal(approveReplay.status, 200);
  const lockedReject = await postJson(port, '/api/approvals/appr_autonomous_approved/reject', adminToken, {});
  assert.equal(lockedReject.status, 409);

  const reject = await postJson(port, '/api/approvals/appr_autonomous_rejected/reject', adminToken, {});
  assert.equal(reject.status, 200);
  assert.equal((await reject.json()).data.approval_status, 'rejected');
  const rejectReplay = await postJson(port, '/api/approvals/appr_autonomous_rejected/reject', adminToken, {});
  assert.equal(rejectReplay.status, 200);
  const lockedApprove = await postJson(port, '/api/approvals/appr_autonomous_rejected/approve', adminToken, {});
  assert.equal(lockedApprove.status, 409);

  state = new Database(dbPath);
  assert.equal(state.prepare("SELECT COUNT(*) AS count FROM pending_approvals WHERE id='appr_autonomous_approved'").get().count, 1);
  assert.equal(state.prepare("SELECT COUNT(*) AS count FROM pending_approvals WHERE id='appr_autonomous_rejected'").get().count, 1);
  assert.equal(state.prepare("SELECT approval_status FROM autonomous_tasks WHERE id=?").get(approvedFixture.id).approval_status, 'approved');
  assert.equal(state.prepare("SELECT approval_status FROM autonomous_tasks WHERE id=?").get(rejectedFixture.id).approval_status, 'rejected');
  state.prepare("INSERT INTO pending_approvals (id,user_id,type,title,status) VALUES ('appr_autonomous_orphan',?,'autonomous_task','orphan','pending')").run(adminId);
  state.close();

  const orphanApproveAll = await postJson(port, '/api/approvals/approve-all', adminToken, {});
  assert.equal(orphanApproveAll.status, 409);
  assert.equal((await orphanApproveAll.json()).error, 'AUTONOMOUS_TASK_APPROVAL_ORPHANED');
  state = new Database(dbPath);
  assert.equal(state.prepare("SELECT status FROM pending_approvals WHERE id='appr_autonomous_orphan'").get().status, 'pending');
  state.prepare("DELETE FROM pending_approvals WHERE id='appr_autonomous_orphan'").run();
  const interrupted = state.prepare("INSERT INTO autonomous_tasks (user_id,goal,status,passport_id,request_hash) VALUES (?,?,'running',?,?)")
    .run(adminId, 'restart interruption fixture', passport.id, hashValue('restart interruption fixture'));
  state.close();

  logs += runtime.getLogs();
  await stopForge(child);
  port = await getFreePort();
  runtime = spawnForge(dbPath, port);
  child = runtime.child;
  await waitFor(port, '/ready', response => response.status === 200);
  const restarted = await login(port, 'admin@forge.local', 'Admin1234!');
  const interruptedResponse = await fetch(`http://127.0.0.1:${port}/api/autonomous/${interrupted.lastInsertRowid}`, { headers: authHeaders(restarted.accessToken) });
  assert.equal(interruptedResponse.status, 200);
  const interruptedTask = (await interruptedResponse.json()).data;
  assert.equal(interruptedTask.status, 'failed');
  assert.equal(interruptedTask.error, 'AUTONOMOUS_TASK_INTERRUPTED');
  assert.equal(interruptedTask.approval_status, 'not_required');
  assert.ok(interruptedTask.completed_at);

  logs += runtime.getLogs();
  assert.doesNotMatch(logs, /autonomous-regression-placeholder-key/);
  assert.doesNotMatch(logs, new RegExp(adminToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(logs, new RegExp(otherToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
