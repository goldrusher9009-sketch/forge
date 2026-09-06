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

function spawnForge(dbPath, port, env) {
  let logs = '';
  const child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: { ...process.env, DB_PATH: dbPath, PORT: String(port), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  return { child, getLogs: () => logs };
}

async function waitForHealth(child, port, getLogs) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.fail(`Forge did not become healthy:\n${getLogs()}`);
}

async function stopForge(child) {
  if (child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
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

async function startStripeMock() {
  const requests = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      requests.push({ method: req.method, url: req.url, headers: req.headers, params: Object.fromEntries(new URLSearchParams(body)) });
      res.setHeader('content-type', 'application/json');
      if (req.method === 'POST' && req.url === '/v1/checkout/sessions') {
        res.end(JSON.stringify({ id: `cs_test_${requests.length}`, url: `https://checkout.stripe.test/session/${requests.length}` }));
        return;
      }
      if (req.method === 'POST' && req.url === '/v1/billing_portal/sessions') {
        res.end(JSON.stringify({ id: `bps_test_${requests.length}`, url: `https://billing.stripe.test/session/${requests.length}` }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'not_found' }));
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    requests,
    baseUrl: `http://127.0.0.1:${port}/v1`,
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

async function startOpenAIMock() {
  const requests = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let payload = {};
      try { payload = JSON.parse(body || '{}'); } catch {}
      requests.push({ method: req.method, url: req.url, authorization: req.headers.authorization, payload });
      res.setHeader('content-type', 'application/json');
      if (req.method === 'POST' && req.url === '/v1/chat/completions') {
        if (JSON.stringify(payload.messages || []).includes('Trigger provider log safety failure')) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: { message: 'provider-secret-must-not-leak' } }));
          return;
        }
        const content = '{"businessName":"Metered Pilot","businessType":"other","cities":[],"services":["verification"],"pain":"commercial control"}';
        if (payload.stream === true) {
          // The Pi engine always streams; emit an OpenAI-compatible SSE body with usage.
          res.setHeader('content-type', 'text/event-stream');
          const SEP = String.fromCharCode(10, 10);
          const chunk = (delta, finish_reason = null, usage) => res.write('data: ' + JSON.stringify({ id: 'mock', object: 'chat.completion.chunk', created: 1, model: payload.model, choices: [{ index: 0, delta, finish_reason }], ...(usage ? { usage } : {}) }) + SEP);
          chunk({ role: 'assistant', content });
          chunk({}, 'stop', { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 });
          res.end('data: [DONE]' + SEP);
          return;
        }
        res.end(JSON.stringify({
          choices: [{ message: { content } }],
          usage: { prompt_tokens: 100, completion_tokens: 50, cost: 0.000045 },
        }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'not_found' }));
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    requests,
    baseUrl: `http://127.0.0.1:${port}/v1`,
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

function signStripeEvent(event, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const body = JSON.stringify(event);
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return { body, signature: `t=${timestamp},v1=${signature}` };
}

async function postStripeEvent(port, event, secret, timestamp) {
  const signed = signStripeEvent(event, secret, timestamp);
  return fetch(`http://127.0.0.1:${port}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': signed.signature },
    body: signed.body,
  });
}

test('cold start migrates legacy Hermes and agent runs, then binds once after late routes', { timeout: 180_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-startup-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const legacy = new Database(dbPath);
  legacy.exec(`
    CREATE TABLE hermes_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goal TEXT,
      status TEXT DEFAULT 'pending',
      output TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO hermes_runs (id, user_id, goal, status, output)
    VALUES ('legacy-run', 'legacy-user', 'legacy goal', 'complete', 'legacy output');
    CREATE TABLE agent_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      prompt TEXT,
      result TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO agent_runs (user_id, name, prompt, result, status)
    VALUES (7, 'legacy agent run', 'legacy prompt', 'legacy result', 'done');
  `);
  legacy.close();

  const port = await getFreePort();
  let logs = '';
  let child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(port),
      NODE_ENV: 'test',
      JWT_SECRET: 'startup-regression-only',
      FRONTEND_URL: 'http://127.0.0.1',
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

  const deadline = Date.now() + 90_000;
  let ready = false;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      ready = (await fetch(`http://127.0.0.1:${port}/health`)).ok;
      if (ready) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.equal(ready, true, `Forge did not become healthy:\n${logs}`);

  const [readyRoute, modelRoute, hermesRoute, brandStoryRoute, brandNarrativesRoute, sslCertsRoute] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/ready`),
    fetch(`http://127.0.0.1:${port}/api/user/model`),
    fetch(`http://127.0.0.1:${port}/api/hermes/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }),
    fetch(`http://127.0.0.1:${port}/api/brand-story`),
    fetch(`http://127.0.0.1:${port}/api/brand-narratives`),
    fetch(`http://127.0.0.1:${port}/api/ssl-certs`),
  ]);
  assert.equal(readyRoute.status, 200);
  assert.equal((await readyRoute.json()).status, 'ready');
  assert.equal(modelRoute.status, 401);
  assert.equal(hermesRoute.status, 401);
  assert.equal(brandStoryRoute.status, 401);
  assert.equal(brandNarrativesRoute.status, 401);
  assert.equal(sslCertsRoute.status, 401);

  let migrated = new Database(dbPath);
  const columns = new Set(migrated.prepare('PRAGMA table_info(hermes_runs)').all().map(column => column.name));
  const row = migrated.prepare('SELECT summary, created_at, updated_at FROM hermes_runs WHERE id=?').get('legacy-run');
  const index = migrated.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_hermes_user'").get();
  const agentRunColumns = new Set(migrated.prepare('PRAGMA table_info(agent_runs)').all().map(column => column.name));
  const passportColumns = new Set(migrated.prepare('PRAGMA table_info(agent_passports)').all().map(column => column.name));
  const legacyAgentRun = migrated.prepare("SELECT name,prompt,result,status,agent_version,prompt_tokens,completion_tokens,total_tokens,cost_usd,tool_calls,approval_status,sync_status,updated_at FROM agent_runs WHERE name='legacy agent run'").get();
  const traceIndex = migrated.prepare("SELECT name,sql FROM sqlite_master WHERE type='index' AND name='idx_agent_runs_trace_id'").get();
  const approvalIndex = migrated.prepare("SELECT name,sql FROM sqlite_master WHERE type='index' AND name='idx_agent_runs_approval_id'").get();
  for (const table of ['ai_brand_stories', 'brand_narratives', 'ssl_certs']) {
    assert.equal(migrated.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name=?").get(table).count, 1);
  }
  migrated.prepare('INSERT INTO ai_brand_stories (user_id,brand_name,"values") VALUES (7,?,?)').run('Regression Brand', 'reliable');
  migrated.prepare('INSERT INTO brand_narratives (user_id,brand_name,"values") VALUES (7,?,?)').run('Regression Narrative', 'traceable');
  const sslCert = migrated.prepare('INSERT INTO ssl_certs (user_id,domain) VALUES (7,?) RETURNING provider').get('forge.test');
  assert.equal(sslCert.provider, "Let's Encrypt");
  migrated.prepare("INSERT INTO agent_runs (user_id,name,prompt,trace_id) VALUES (7,'trace one','prompt','trace-regression')").run();
  assert.throws(
    () => migrated.prepare("INSERT INTO agent_runs (user_id,name,prompt,trace_id) VALUES (7,'trace two','prompt','trace-regression')").run(),
    /UNIQUE constraint failed: agent_runs\.trace_id/,
  );
  migrated.close();

  for (const column of ['steps', 'summary', 'files', 'total_tokens', 'created_at', 'updated_at']) assert.equal(columns.has(column), true);
  assert.equal(row.summary, 'legacy output');
  assert.ok(row.created_at);
  assert.ok(row.updated_at);
  assert.equal(index.name, 'idx_hermes_user');
  for (const column of ['agent_id', 'agent_version', 'forge_agent_id', 'apptopia_agent_id', 'apptopia_agent_version_id', 'apptopia_agent_version', 'trace_id', 'request_hash', 'result_hash', 'model', 'provider', 'routing_reason', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'cost_usd', 'duration_ms', 'tool_calls', 'approval_id', 'approval_status', 'sync_status', 'protocol_call_id', 'error', 'updated_at', 'completed_at']) assert.equal(agentRunColumns.has(column), true);
  for (const column of ['apptopia_agent_id', 'apptopia_agent_version_id', 'apptopia_agent_version']) assert.equal(passportColumns.has(column), true);
  assert.deepEqual(legacyAgentRun, {
    name: 'legacy agent run', prompt: 'legacy prompt', result: 'legacy result', status: 'done',
    agent_version: '1.0.0', prompt_tokens: 0, completion_tokens: 0, total_tokens: 0,
    cost_usd: 0, tool_calls: 0, approval_status: 'pending', sync_status: 'not_started',
    updated_at: legacyAgentRun.updated_at,
  });
  assert.ok(legacyAgentRun.updated_at);
  assert.equal(traceIndex.name, 'idx_agent_runs_trace_id');
  assert.match(traceIndex.sql, /UNIQUE INDEX/);
  assert.equal(approvalIndex.name, 'idx_agent_runs_approval_id');
  assert.match(approvalIndex.sql, /UNIQUE INDEX/);
  assert.equal((logs.match(/running on port/g) || []).length, 1);
  assert.doesNotMatch(logs, /EADDRINUSE/);
  assert.doesNotMatch(logs, /Seeded default admin: .*\//);
  assert.doesNotMatch(logs, /near "values"/);
  assert.doesNotMatch(logs, /near "s"/);

  await stopForge(child);
  const secondPort = await getFreePort();
  const second = spawnForge(dbPath, secondPort, {
    NODE_ENV: 'test',
    JWT_SECRET: 'startup-regression-only',
    FRONTEND_URL: 'http://127.0.0.1',
  });
  child = second.child;
  await waitForHealth(child, secondPort, second.getLogs);
  const repeated = new Database(dbPath, { readonly: true });
  assert.equal(repeated.prepare("SELECT COUNT(*) AS count FROM agent_runs WHERE name='legacy agent run'").get().count, 1);
  assert.equal(repeated.prepare("SELECT COUNT(*) AS count FROM agent_runs WHERE trace_id='trace-regression'").get().count, 1);
  repeated.close();

  const broken = new Database(dbPath);
  broken.exec('DROP TABLE forge_model');
  broken.close();
  const [liveAfterBreak, readyAfterBreak] = await Promise.all([
    fetch(`http://127.0.0.1:${secondPort}/health`),
    fetch(`http://127.0.0.1:${secondPort}/ready`),
  ]);
  assert.equal(liveAfterBreak.status, 200);
  assert.equal(readyAfterBreak.status, 503);
  assert.equal((await readyAfterBreak.json()).status, 'not_ready');
});

test('production refuses missing JWT, admin, and frontend configuration before opening the database', { timeout: 30_000 }, async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-production-config-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const port = await getFreePort();
  const { child, getLogs } = spawnForge(dbPath, port, {
    NODE_ENV: 'production',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: '',
    ADMIN_EMAIL: '',
    ADMIN_PASSWORD: '',
    FRONTEND_URL: '',
    CREDENTIAL_ENCRYPTION_KEY: '',
    BILLING_REQUIRED: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
  });
  const [code] = await Promise.race([
    once(child, 'exit'),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Forge did not fail closed:\n${getLogs()}`)), 20_000)),
  ]);
  try {
    assert.equal(code, 1);
    assert.match(getLogs(), /Missing required production configuration: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, FRONTEND_URL, CREDENTIAL_ENCRYPTION_KEY/);
    assert.doesNotMatch(getLogs(), /running on port/);
    assert.equal(fs.existsSync(dbPath), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('same-second production logins mint distinct refresh tokens', { timeout: 120_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-refresh-token-regression-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const port = await getFreePort();
  const email = 'refresh-token-regression@forge.test';
  const password = 'refresh-token-regression-password';
  const { child, getLogs } = spawnForge(dbPath, port, {
    NODE_ENV: 'production',
    JWT_SECRET: 'refresh-token-regression-jwt-secret',
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
    FRONTEND_URL: `http://127.0.0.1:${port}`,
    CREDENTIAL_ENCRYPTION_KEY: 'refresh-token-regression-encryption-key',
    BILLING_REQUIRED: 'false',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    STRIPE_PRICE_STARTER: '',
    STRIPE_PRICE_PRO: '',
    STRIPE_PRICE_AGENCY: '',
  });
  t.after(async () => {
    await stopForge(child);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await waitForHealth(child, port, getLogs);
  const responses = await Promise.all(Array.from({ length: 4 }, () => fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })));
  assert.deepEqual(responses.map(response => response.status), [200, 200, 200, 200]);

  const database = new Database(dbPath, { readonly: true });
  const tokenCounts = database.prepare('SELECT COUNT(*) AS total, COUNT(DISTINCT token) AS unique_tokens FROM refresh_tokens').get();
  database.close();
  assert.deepEqual(tokenCounts, { total: 4, unique_tokens: 4 });
});

test('production migrates the historical default admin without changing its identity', { timeout: 120_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-production-admin-migration-'));
  const dbPath = path.join(tempDir, 'forge.db');
  let activeChild = null;
  t.after(async () => {
    if (activeChild) await stopForge(activeChild);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const developmentPort = await getFreePort();
  const development = spawnForge(dbPath, developmentPort, {
    NODE_ENV: 'test',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: 'admin-migration-development-jwt-secret',
    ADMIN_EMAIL: '',
    ADMIN_PASSWORD: '',
    FRONTEND_URL: `http://127.0.0.1:${developmentPort}`,
    CREDENTIAL_ENCRYPTION_KEY: 'admin-migration-development-credential-key',
    BILLING_REQUIRED: '',
  });
  activeChild = development.child;
  await waitForHealth(development.child, developmentPort, development.getLogs);
  const legacyAuth = await login(developmentPort, 'admin@forge.local', 'Admin1234!');
  const legacyId = legacyAuth.data.user.id;
  await stopForge(development.child);
  activeChild = null;

  const legacyProviderSecret = 'legacy-plaintext-custom-provider-secret';
  const legacyState = new Database(dbPath);
  legacyState.exec(`
    DROP TABLE custom_providers;
    CREATE TABLE custom_providers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key TEXT NOT NULL DEFAULT '',
      markup_multiplier REAL NOT NULL DEFAULT 1.3,
      model_prefix TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );
  `);
  legacyState.prepare('INSERT INTO custom_providers (id,user_id,name,base_url,api_key) VALUES (?,?,?,?,?)')
    .run('legacy-provider', legacyId, 'Legacy Provider', 'https://provider.invalid', legacyProviderSecret);
  legacyState.close();

  const productionPort = await getFreePort();
  const productionEmail = 'configured-owner@forge.test';
  const productionPassword = 'configured-production-admin-password';
  const production = spawnForge(dbPath, productionPort, {
    NODE_ENV: 'production',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: 'admin-migration-production-jwt-secret-32-bytes',
    ADMIN_EMAIL: productionEmail,
    ADMIN_PASSWORD: productionPassword,
    FRONTEND_URL: `http://127.0.0.1:${productionPort}`,
    CREDENTIAL_ENCRYPTION_KEY: 'admin-migration-production-credential-key',
    BILLING_REQUIRED: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
  });
  activeChild = production.child;
  await waitForHealth(production.child, productionPort, production.getLogs);
  assert.match(production.getLogs(), /Migrated historical development admin to configured production admin/);

  const productionAuth = await login(productionPort, productionEmail, productionPassword);
  assert.equal(productionAuth.data.user.id, legacyId);
  assert.equal(productionAuth.data.user.role, 'admin');

  const oldLogin = await fetch(`http://127.0.0.1:${productionPort}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@forge.local', password: 'Admin1234!' }),
  });
  assert.equal(oldLogin.status, 401);

  const state = new Database(dbPath, { readonly: true });
  const adminRows = state.prepare("SELECT id,email,role,verified FROM users WHERE role='admin'").all();
  const providerColumns = state.prepare('PRAGMA table_info(custom_providers)').all().map(column => column.name);
  const migratedProvider = state.prepare("SELECT api_key,api_key_encrypted FROM custom_providers WHERE id='legacy-provider'").get();
  state.close();
  assert.deepEqual(adminRows, [{ id: legacyId, email: productionEmail, role: 'admin', verified: 1 }]);
  assert.equal(providerColumns.includes('api_key_encrypted'), true);
  assert.equal(migratedProvider.api_key, '');
  assert.match(migratedProvider.api_key_encrypted, /^v1:/);
  assert.equal(migratedProvider.api_key_encrypted.includes(legacyProviderSecret), false);
});

test('commercial billing mode refuses partial Stripe configuration before opening the database', { timeout: 30_000 }, async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-production-billing-config-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const port = await getFreePort();
  const { child, getLogs } = spawnForge(dbPath, port, {
    NODE_ENV: 'production',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: 'production-billing-gate-jwt-secret-32-bytes',
    ADMIN_EMAIL: 'billing-gate@forge.test',
    ADMIN_PASSWORD: 'production-billing-gate-password',
    FRONTEND_URL: `http://127.0.0.1:${port}`,
    CREDENTIAL_ENCRYPTION_KEY: 'production-billing-gate-encryption-key',
    BILLING_REQUIRED: 'true',
    STRIPE_SECRET_KEY: 'sk_test_partial',
    STRIPE_WEBHOOK_SECRET: '',
    STRIPE_PRICE_STARTER: '',
    STRIPE_PRICE_PRO: '',
    STRIPE_PRICE_AGENCY: '',
  });
  const [code] = await Promise.race([
    once(child, 'exit'),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Forge did not fail closed:\n${getLogs()}`)), 20_000)),
  ]);
  try {
    assert.equal(code, 1);
    assert.match(getLogs(), /Missing required production configuration: STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_AGENCY/);
    assert.doesNotMatch(getLogs(), /running on port/);
    assert.equal(fs.existsSync(dbPath), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('production rejects unapproved origins and dangerous routes without changing state', { timeout: 120_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-production-routes-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const port = await getFreePort();
  const email = 'admin@forge.test';
  const password = 'production-admin-regression';
  const { child, getLogs } = spawnForge(dbPath, port, {
    NODE_ENV: 'production',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: 'production-regression-jwt-secret-32-bytes',
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
    FRONTEND_URL: `http://127.0.0.1:${port}`,
    CREDENTIAL_ENCRYPTION_KEY: 'production-route-credential-encryption-key',
    BILLING_REQUIRED: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    OPENAI_API_KEY: 'test-only-billing-gate-key',
    RESET_SECRET: '',
  });
  t.after(async () => {
    await stopForge(child);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  await waitForHealth(child, port, getLogs);

  const allowedOrigin = await fetch(`http://127.0.0.1:${port}/api/version`, { headers: { origin: `http://127.0.0.1:${port}` } });
  assert.equal(allowedOrigin.status, 200);
  assert.equal(allowedOrigin.headers.get('access-control-allow-origin'), `http://127.0.0.1:${port}`);
  const approvedForgeOrigin = await fetch(`http://127.0.0.1:${port}/api/version`, { headers: { origin: 'https://forge-sand-two.vercel.app' } });
  assert.equal(approvedForgeOrigin.status, 200);
  const deniedOrigin = await fetch(`http://127.0.0.1:${port}/api/version`, { headers: { origin: 'https://unapproved.example' } });
  assert.equal(deniedOrigin.status, 403);
  assert.equal((await deniedOrigin.json()).error, 'CORS_ORIGIN_DENIED');

  const auth = await login(port, email, password);
  const headers = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  const upgrade = await fetch(`http://127.0.0.1:${port}/api/billing/upgrade`, {
    method: 'POST', headers, body: JSON.stringify({ plan: 'pro' }),
  });
  assert.equal(upgrade.status, 503);
  assert.equal((await upgrade.json()).error, 'BILLING_NOT_CONFIGURED');

  const connector = await fetch(`http://127.0.0.1:${port}/api/connectors`, {
    method: 'POST', headers, body: JSON.stringify({ id: 'apptopia' }),
  });
  assert.equal(connector.status, 400);
  assert.equal((await connector.json()).error, 'CONNECTOR_CREDENTIAL_REQUIRED');

  const webhook = await fetch(`http://127.0.0.1:${port}/api/billing/webhook`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(webhook.status, 503);

  const reset = await fetch(`http://127.0.0.1:${port}/api/auth/reset-password`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, newPassword: 'changed-password', secret: 'anything' }),
  });
  assert.equal(reset.status, 404);

  const userEmail = 'commercial-user@forge.test';
  const userPassword = 'commercial-user-regression';
  const registered = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: userEmail, password: userPassword }),
  });
  assert.equal(registered.status, 201, await registered.clone().text());
  const userAuth = await login(port, userEmail, userPassword);
  const userHeaders = { authorization: `Bearer ${userAuth.accessToken}`, 'content-type': 'application/json' };
  const onboarded = await fetch(`http://127.0.0.1:${port}/api/onboarding`, {
    method: 'POST', headers: userHeaders, body: JSON.stringify({ businessName: 'Commercial Test', businessType: 'other', cities: [], services: [] }),
  });
  assert.equal(onboarded.status, 200, await onboarded.clone().text());

  let writable = new Database(dbPath);
  const freeEntitlement = writable.prepare('SELECT plan,tokens_limit FROM subscriptions WHERE user_id=?').get(userAuth.data.user.id);
  assert.deepEqual(freeEntitlement, { plan: 'free', tokens_limit: 10000 });
  writable.prepare('UPDATE subscriptions SET tokens_used=tokens_limit WHERE user_id=?').run(userAuth.data.user.id);
  writable.close();

  const thread = await fetch(`http://127.0.0.1:${port}/api/threads`, {
    method: 'POST', headers: userHeaders, body: JSON.stringify({ title: 'Billing gate regression', model: 'gpt-4o-mini' }),
  });
  assert.equal(thread.status, 201, await thread.clone().text());
  const threadId = (await thread.json()).data.id;
  const blockedThread = await fetch(`http://127.0.0.1:${port}/api/threads/${threadId}/messages`, {
    method: 'POST', headers: userHeaders, body: JSON.stringify({ content: 'This must not reach a model.', model: 'gpt-4o-mini' }),
  });
  assert.equal(blockedThread.status, 200);
  assert.match(await blockedThread.text(), /TOKEN_LIMIT_EXCEEDED/);

  const blockedChat = await fetch(`http://127.0.0.1:${port}/api/chat`, {
    method: 'POST', headers: userHeaders, body: JSON.stringify({ messages: [{ role: 'user', content: 'This must not reach a model.' }], model: 'gpt-4o-mini' }),
  });
  assert.equal(blockedChat.status, 402, await blockedChat.clone().text());
  assert.equal((await blockedChat.json()).error, 'TOKEN_LIMIT_EXCEEDED');

  const state = new Database(dbPath, { readonly: true });
  const subscription = state.prepare('SELECT plan FROM subscriptions WHERE user_id=?').get(auth.data.user.id);
  const connectors = state.prepare("SELECT COUNT(*) AS count FROM api_keys WHERE user_id=? AND provider LIKE 'connector_%'").get(auth.data.user.id);
  const blockedMessages = state.prepare('SELECT COUNT(*) AS count FROM messages WHERE thread_id=?').get(threadId);
  state.close();
  assert.equal(subscription.plan, 'free');
  assert.equal(connectors.count, 0);
  assert.equal(blockedMessages.count, 0);
});

test('commercial model access isolates legacy BYOK from metered platform usage and debits prepaid overage once', { timeout: 120_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-commercial-model-access-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const openAIMock = await startOpenAIMock();
  const port = await getFreePort();
  const email = 'commercial-model-user@forge.test';
  const password = 'commercial-model-user-regression';
  const { child, getLogs } = spawnForge(dbPath, port, {
    NODE_ENV: 'test',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: 'commercial-model-access-jwt-secret-32-bytes',
    ADMIN_EMAIL: 'commercial-model-admin@forge.test',
    ADMIN_PASSWORD: 'commercial-model-admin-regression',
    FRONTEND_URL: `http://127.0.0.1:${port}`,
    CREDENTIAL_ENCRYPTION_KEY: 'commercial-model-access-encryption-key',
    BILLING_REQUIRED: 'true',
    STRIPE_SECRET_KEY: 'sk_test_commercial_model_access',
    STRIPE_WEBHOOK_SECRET: 'whsec_commercial_model_access',
    STRIPE_PRICE_STARTER: 'price_starter_commercial_model_access',
    STRIPE_PRICE_PRO: 'price_pro_commercial_model_access',
    STRIPE_PRICE_AGENCY: 'price_agency_commercial_model_access',
    ANTHROPIC_API_KEY: '',
    OPENROUTER_API_KEY: '',
    GEMINI_API_KEY: '',
    GROQ_API_KEY: '',
    MISTRAL_API_KEY: '',
    OPENAI_API_KEY: 'sk-platform-openai-regression',
    FORGE_OPENAI_TEST_API_BASE_URL: openAIMock.baseUrl,
  });
  t.after(async () => {
    await stopForge(child);
    await openAIMock.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  await waitForHealth(child, port, getLogs);

  const querySecret = `query-secret-${Date.now()}`;
  const unmatched = await fetch(`http://127.0.0.1:${port}/api/log-safety-probe?token=${querySecret}`);
  assert.equal(unmatched.status, 404);
  const unmatchedRequestId = unmatched.headers.get('x-request-id');
  assert.match(unmatchedRequestId || '', /^[0-9a-f-]{36}$/);
  const pathSecret = `path-secret-${Date.now()}`;
  const secretPath = await fetch(`http://127.0.0.1:${port}/api/webhooks/trigger/missing/${pathSecret}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(secretPath.status, 404);
  const secretPathRequestId = secretPath.headers.get('x-request-id');
  assert.match(secretPathRequestId || '', /^[0-9a-f-]{36}$/);
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.match(getLogs(), new RegExp(unmatchedRequestId));
  assert.match(getLogs(), new RegExp(secretPathRequestId));
  assert.doesNotMatch(getLogs(), new RegExp(querySecret));
  assert.doesNotMatch(getLogs(), new RegExp(pathSecret));
  assert.match(getLogs(), /POST \/api\/webhooks\/trigger\/:id\/:secret 404/);

  const registered = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  assert.equal(registered.status, 201, await registered.clone().text());
  const auth = await login(port, email, password);
  const userId = auth.data.user.id;
  const headers = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  const savedKey = await fetch(`http://127.0.0.1:${port}/api/keys`, {
    method: 'POST', headers, body: JSON.stringify({ openai_key: 'sk-user-openai-regression' }),
  });
  assert.equal(savedKey.status, 200, await savedKey.clone().text());
  const freeLegacy = await fetch(`http://127.0.0.1:${port}/api/onboarding/from-sentence`, {
    method: 'POST', headers, body: JSON.stringify({ sentence: 'I run a verification business in Austin.' }),
  });
  assert.equal(freeLegacy.status, 402, await freeLegacy.clone().text());
  assert.equal((await freeLegacy.json()).error, 'PAID_PLAN_AND_BYOK_REQUIRED');
  assert.equal(openAIMock.requests.length, 0);

  const subscriptionResponse = await fetch(`http://127.0.0.1:${port}/api/billing/subscription`, { headers });
  assert.equal(subscriptionResponse.status, 200, await subscriptionResponse.clone().text());
  let writable = new Database(dbPath);
  writable.prepare("UPDATE subscriptions SET plan='starter',status='active',tokens_limit=500000,tokens_used=0 WHERE user_id=?").run(userId);
  writable.close();

  const paidLegacy = await fetch(`http://127.0.0.1:${port}/api/onboarding/from-sentence`, {
    method: 'POST', headers, body: JSON.stringify({ sentence: 'I run a verification business in Austin.' }),
  });
  assert.equal(paidLegacy.status, 200, await paidLegacy.clone().text());
  assert.equal((await paidLegacy.json()).data.preview, true);
  assert.equal(openAIMock.requests.length, 1);
  assert.equal(openAIMock.requests[0].authorization, 'Bearer sk-user-openai-regression');

  const deletedKey = await fetch(`http://127.0.0.1:${port}/api/keys/openai`, { method: 'DELETE', headers });
  assert.equal(deletedKey.status, 200, await deletedKey.clone().text());
  const paidWithoutByok = await fetch(`http://127.0.0.1:${port}/api/onboarding/from-sentence`, {
    method: 'POST', headers, body: JSON.stringify({ sentence: 'I run a verification business in Austin.' }),
  });
  assert.equal(paidWithoutByok.status, 402, await paidWithoutByok.clone().text());
  assert.equal((await paidWithoutByok.json()).error, 'PAID_PLAN_AND_BYOK_REQUIRED');
  assert.equal(openAIMock.requests.length, 1);

  const compactThreadResponse = await fetch(`http://127.0.0.1:${port}/api/threads`, {
    method: 'POST', headers, body: JSON.stringify({ title: 'Compaction safety', model: 'gpt-4o-mini' }),
  });
  assert.equal(compactThreadResponse.status, 201, await compactThreadResponse.clone().text());
  const compactThreadId = (await compactThreadResponse.json()).data.id;
  writable = new Database(dbPath);
  const insertMessage = writable.prepare('INSERT INTO messages (id,thread_id,role,content) VALUES (?,?,?,?)');
  for (let index = 0; index < 8; index += 1) insertMessage.run(`compact-message-${index}`, compactThreadId, index % 2 ? 'assistant' : 'user', `Preserve message ${index}`);
  writable.close();
  const blockedCompact = await fetch(`http://127.0.0.1:${port}/api/threads/${compactThreadId}/compact`, {
    method: 'POST', headers, body: JSON.stringify({ keep_recent: 2 }),
  });
  assert.equal(blockedCompact.status, 402, await blockedCompact.clone().text());
  assert.equal((await blockedCompact.json()).error, 'PAID_PLAN_AND_BYOK_REQUIRED');
  const compactState = new Database(dbPath, { readonly: true });
  assert.equal(compactState.prepare('SELECT COUNT(*) AS count FROM messages WHERE thread_id=?').get(compactThreadId).count, 8);
  compactState.close();
  assert.equal(openAIMock.requests.length, 1);

  const passportResponse = await fetch(`http://127.0.0.1:${port}/api/passport`, { headers });
  assert.equal(passportResponse.status, 200, await passportResponse.clone().text());
  writable = new Database(dbPath);
  writable.prepare('UPDATE subscriptions SET tokens_used=tokens_limit WHERE user_id=?').run(userId);
  writable.prepare('UPDATE users SET credits=0.000001 WHERE id=?').run(userId);
  writable.prepare("UPDATE agent_passports SET apptopia_agent_id='budget-agent',apptopia_agent_version_id='budget-version-id',apptopia_agent_version='1.0.0' WHERE user_id=?").run(userId);
  writable.close();
  const underfundedAgentRun = await fetch(`http://127.0.0.1:${port}/api/agent-runs`, {
    method: 'POST', headers, body: JSON.stringify({ name: 'Budget gate', prompt: 'This run must not reach a model.', model: 'gpt-4o-mini', max_tokens: 4096 }),
  });
  assert.equal(underfundedAgentRun.status, 402, await underfundedAgentRun.clone().text());
  assert.equal((await underfundedAgentRun.json()).error, 'TOKEN_LIMIT_EXCEEDED');
  assert.equal(openAIMock.requests.length, 1);

  const underfundedChat = await fetch(`http://127.0.0.1:${port}/api/chat`, {
    method: 'POST', headers, body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 4096, messages: [{ role: 'user', content: 'This balance must not unlock a large request.' }] }),
  });
  assert.equal(underfundedChat.status, 402, await underfundedChat.clone().text());
  assert.equal((await underfundedChat.json()).error, 'TOKEN_LIMIT_EXCEEDED');
  assert.equal(openAIMock.requests.length, 1);

  writable = new Database(dbPath);
  writable.prepare('UPDATE users SET credits=1 WHERE id=?').run(userId);
  writable.close();
  const meteredChat = await fetch(`http://127.0.0.1:${port}/api/forge/chat`, {
    method: 'POST', headers, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Prove prepaid metering.' }] }),
  });
  assert.equal(meteredChat.status, 200, await meteredChat.clone().text());
  assert.equal(meteredChat.redirected, true);
  assert.equal(new URL(meteredChat.url).pathname, '/api/chat');
  assert.equal((await meteredChat.json()).data.tokensUsed, 150);
  assert.equal(openAIMock.requests.length, 2);
  assert.equal(openAIMock.requests[1].authorization, 'Bearer sk-platform-openai-regression');

  const state = new Database(dbPath, { readonly: true });
  const subscription = state.prepare('SELECT tokens_used,tokens_limit FROM subscriptions WHERE user_id=?').get(userId);
  const credits = state.prepare('SELECT credits FROM users WHERE id=?').get(userId).credits;
  const usageLogs = state.prepare('SELECT COUNT(*) AS count,SUM(total_tokens) AS tokens FROM usage_logs WHERE user_id=?').get(userId);
  const tokenUsage = state.prepare("SELECT COUNT(*) AS count,SUM(total_tokens) AS tokens FROM token_usage WHERE user_id=? AND endpoint='/api/chat'").get(userId);
  const overageLedger = state.prepare("SELECT COUNT(*) AS count,SUM(delta) AS delta FROM credit_ledger WHERE user_id=? AND reason LIKE 'token_overage_%'").get(userId);
  state.close();
  assert.deepEqual(subscription, { tokens_used: 500150, tokens_limit: 500000 });
  assert.ok(Math.abs(credits - 0.999775) < 1e-9);
  assert.deepEqual(usageLogs, { count: 1, tokens: 150 });
  assert.deepEqual(tokenUsage, { count: 1, tokens: 150 });
  assert.equal(overageLedger.count, 1);
  assert.ok(Math.abs(overageLedger.delta + 0.000225) < 1e-9);

  const budgetThreadResponse = await fetch(`http://127.0.0.1:${port}/api/threads`, {
    method: 'POST', headers, body: JSON.stringify({ title: 'Funded thread budget', model: 'gpt-4o-mini' }),
  });
  assert.equal(budgetThreadResponse.status, 201, await budgetThreadResponse.clone().text());
  const budgetThreadId = (await budgetThreadResponse.json()).data.id;
  const fundedThread = await fetch(`http://127.0.0.1:${port}/api/threads/${budgetThreadId}/messages`, {
    method: 'POST', headers, body: JSON.stringify({ content: 'Use the bounded thread budget.', model: 'gpt-4o-mini', token_budget: 10000 }),
  });
  assert.equal(fundedThread.status, 200);
  assert.match(await fundedThread.text(), /"success":true/);
  assert.equal(openAIMock.requests.length, 3);
  // The Pi engine sends the OpenAI output cap as max_completion_tokens; the legacy path sends max_tokens.
  const threadOutputCap = Number(openAIMock.requests[2].payload.max_tokens ?? openAIMock.requests[2].payload.max_completion_tokens);
  assert.ok(threadOutputCap > 0);
  assert.ok(threadOutputCap <= 4096);

  const failedProviderChat = await fetch(`http://127.0.0.1:${port}/api/chat`, {
    method: 'POST', headers, body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 32, messages: [{ role: 'user', content: 'Trigger provider log safety failure' }] }),
  });
  assert.equal(failedProviderChat.status, 500, await failedProviderChat.clone().text());
  const failedProviderBody = await failedProviderChat.json();
  assert.equal(failedProviderBody.error, 'LLM_ERROR');
  assert.equal(failedProviderBody.message, 'The model request failed. Retry or choose another model.');
  assert.doesNotMatch(JSON.stringify(failedProviderBody), /provider-secret-must-not-leak/);
  const failedProviderRequestId = failedProviderChat.headers.get('x-request-id');
  assert.match(failedProviderRequestId || '', /^[0-9a-f-]{36}$/);
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.match(getLogs(), new RegExp(failedProviderRequestId));
  assert.doesNotMatch(getLogs(), /provider-secret-must-not-leak/);
  assert.equal(openAIMock.requests.length, 4);

  const failedThreadResponse = await fetch(`http://127.0.0.1:${port}/api/threads`, {
    method: 'POST', headers, body: JSON.stringify({ title: 'Thread log safety', model: 'gpt-4o-mini' }),
  });
  assert.equal(failedThreadResponse.status, 201, await failedThreadResponse.clone().text());
  const failedThreadId = (await failedThreadResponse.json()).data.id;
  const failedThread = await fetch(`http://127.0.0.1:${port}/api/threads/${failedThreadId}/messages`, {
    method: 'POST', headers, body: JSON.stringify({ content: 'Trigger provider log safety failure', model: 'gpt-4o-mini', token_budget: 10000 }),
  });
  assert.equal(failedThread.status, 200);
  const failedThreadText = await failedThread.text();
  assert.match(failedThreadText, /All configured models failed\. Retry or choose another model\./);
  assert.doesNotMatch(failedThreadText, /provider-secret-must-not-leak/);
  const failedThreadRequestId = failedThread.headers.get('x-request-id');
  assert.match(failedThreadRequestId || '', /^[0-9a-f-]{36}$/);
  const liveEvents = await fetch(`http://127.0.0.1:${port}/api/live/events`, { headers });
  assert.equal(liveEvents.status, 200, await liveEvents.clone().text());
  const liveEventBody = await liveEvents.text();
  assert.match(liveEventBody, /All configured models failed\. Retry or choose another model\./);
  assert.doesNotMatch(liveEventBody, /provider-secret-must-not-leak/);
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.match(getLogs(), new RegExp(failedThreadRequestId));
  assert.doesNotMatch(getLogs(), /provider-secret-must-not-leak/);
  const requestsAfterFailedThread = openAIMock.requests.length;
  assert.ok(requestsAfterFailedThread > 4);

  const failedAgentRun = await fetch(`http://127.0.0.1:${port}/api/agent-runs`, {
    method: 'POST', headers, body: JSON.stringify({ name: 'Agent Run log safety', prompt: 'Trigger provider log safety failure', model: 'gpt-4o-mini', max_tokens: 32 }),
  });
  assert.equal(failedAgentRun.status, 200, await failedAgentRun.clone().text());
  const failedAgentRunId = (await failedAgentRun.json()).id;
  let persistedFailedRun;
  // The Pi engine retries transient provider failures with bounded backoff before failing the run.
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const runRows = await fetch(`http://127.0.0.1:${port}/api/agent-runs`, { headers });
    assert.equal(runRows.status, 200, await runRows.clone().text());
    persistedFailedRun = (await runRows.json()).find(row => row.id === failedAgentRunId);
    if (persistedFailedRun?.status === 'error') break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(persistedFailedRun?.status, 'error');
  assert.equal(persistedFailedRun.error, 'AGENT_RUN_PROVIDER_FAILED');
  assert.doesNotMatch(JSON.stringify(persistedFailedRun), /provider-secret-must-not-leak/);
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.doesNotMatch(getLogs(), /provider-secret-must-not-leak/);
  assert.equal(openAIMock.requests.length, requestsAfterFailedThread + 1);
});

test('Stripe Checkout uses canonical nested fields, trusted return URLs, and the hosted cancellation portal', { timeout: 120_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-stripe-checkout-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const stripeMock = await startStripeMock();
  const port = await getFreePort();
  const email = 'checkout-admin@forge.test';
  const password = 'checkout-admin-regression';
  const { child, getLogs } = spawnForge(dbPath, port, {
    NODE_ENV: 'test',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: 'checkout-regression-jwt-secret-32-bytes',
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
    FRONTEND_URL: `http://127.0.0.1:${port}`,
    CREDENTIAL_ENCRYPTION_KEY: 'checkout-regression-encryption-key',
    BILLING_REQUIRED: '',
    STRIPE_SECRET_KEY: 'sk_test_checkout_regression',
    STRIPE_WEBHOOK_SECRET: 'whsec_checkout_regression',
    STRIPE_PRICE_STARTER: 'price_starter_checkout',
    STRIPE_PRICE_PRO: 'price_pro_checkout',
    STRIPE_PRICE_AGENCY: 'price_agency_checkout',
    FORGE_STRIPE_TEST_API_BASE_URL: stripeMock.baseUrl,
  });
  t.after(async () => {
    await stopForge(child);
    await stripeMock.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  await waitForHealth(child, port, getLogs);
  const auth = await login(port, email, password);
  const headers = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  const upgrade = await fetch(`http://127.0.0.1:${port}/api/billing/upgrade`, {
    method: 'POST', headers, body: JSON.stringify({ plan: 'starter' }),
  });
  assert.equal(upgrade.status, 200, await upgrade.clone().text());
  assert.match((await upgrade.json()).checkoutUrl, /^https:\/\/checkout\.stripe\.test\//);
  const upgradeRequest = stripeMock.requests[0];
  assert.equal(upgradeRequest.url, '/v1/checkout/sessions');
  assert.equal(upgradeRequest.params['line_items[0][price]'], 'price_starter_checkout');
  assert.equal(upgradeRequest.params['line_items[0][quantity]'], '1');
  assert.equal(upgradeRequest.params['payment_method_types[0]'], 'card');
  assert.equal(upgradeRequest.params['metadata[plan]'], 'starter');
  assert.equal(upgradeRequest.params['subscription_data[metadata][plan]'], 'starter');
  assert.equal(Object.values(upgradeRequest.params).includes('[object Object]'), false);

  const topup = await fetch(`http://127.0.0.1:${port}/api/billing/topup`, {
    method: 'POST', headers, body: JSON.stringify({ amount: 50, successUrl: 'https://evil.example/success', cancelUrl: 'https://evil.example/cancel' }),
  });
  assert.equal(topup.status, 200, await topup.clone().text());
  assert.match((await topup.json()).data.checkoutUrl, /^https:\/\/checkout\.stripe\.test\//);
  const topupRequest = stripeMock.requests[1];
  assert.equal(topupRequest.params['line_items[0][price_data][unit_amount]'], '5000');
  assert.equal(topupRequest.params['metadata[kind]'], 'forge_topup');
  assert.equal(topupRequest.params['metadata[creditAmountCents]'], '5000');
  assert.equal(new URL(topupRequest.params.success_url).origin, `http://127.0.0.1:${port}`);
  assert.equal(new URL(topupRequest.params.cancel_url).origin, `http://127.0.0.1:${port}`);
  assert.equal(topupRequest.params.success_url.includes('evil.example'), false);
  assert.equal(topupRequest.params.cancel_url.includes('evil.example'), false);

  const writable = new Database(dbPath);
  writable.prepare("UPDATE subscriptions SET plan='pro',stripe_customer_id='cus_checkout',stripe_subscription_id='sub_checkout' WHERE user_id=?").run(auth.data.user.id);
  writable.close();
  const paidSwitch = await fetch(`http://127.0.0.1:${port}/api/billing/upgrade`, {
    method: 'POST', headers, body: JSON.stringify({ plan: 'agency' }),
  });
  assert.equal(paidSwitch.status, 200, await paidSwitch.clone().text());
  assert.equal((await paidSwitch.json()).action, 'manage_subscription');
  const paidSwitchPortalRequest = stripeMock.requests[2];
  assert.equal(paidSwitchPortalRequest.url, '/v1/billing_portal/sessions');
  assert.equal(paidSwitchPortalRequest.params.customer, 'cus_checkout');

  const downgrade = await fetch(`http://127.0.0.1:${port}/api/billing/upgrade`, {
    method: 'POST', headers, body: JSON.stringify({ plan: 'free' }),
  });
  assert.equal(downgrade.status, 200, await downgrade.clone().text());
  assert.equal((await downgrade.json()).action, 'manage_subscription');
  const portalRequest = stripeMock.requests[3];
  assert.equal(portalRequest.url, '/v1/billing_portal/sessions');
  assert.equal(portalRequest.params.customer, 'cus_checkout');
  assert.equal(new URL(portalRequest.params.return_url).origin, `http://127.0.0.1:${port}`);

  const state = new Database(dbPath, { readonly: true });
  assert.equal(state.prepare('SELECT plan FROM subscriptions WHERE user_id=?').get(auth.data.user.id).plan, 'pro');
  state.close();
});

test('production Stripe billing is paid-only, idempotent, and atomic across subscription and credit events', { timeout: 120_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-stripe-webhook-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const port = await getFreePort();
  const email = 'billing-admin@forge.test';
  const password = 'production-billing-regression';
  const webhookSecret = 'whsec_forge_regression';
  const { child, getLogs } = spawnForge(dbPath, port, {
    NODE_ENV: 'production',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: 'production-billing-jwt-secret-32-bytes',
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
    FRONTEND_URL: `http://127.0.0.1:${port}`,
    CREDENTIAL_ENCRYPTION_KEY: 'production-billing-credential-encryption-key',
    BILLING_REQUIRED: 'true',
    STRIPE_SECRET_KEY: 'sk_test_forge_regression',
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    STRIPE_PRICE_STARTER: 'price_starter_regression',
    STRIPE_PRICE_PRO: 'price_pro_regression',
    STRIPE_PRICE_AGENCY: 'price_agency_regression',
  });
  t.after(async () => {
    await stopForge(child);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  await waitForHealth(child, port, getLogs);
  const ready = await fetch(`http://127.0.0.1:${port}/ready`);
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).checks.billing, 'ok');
  const auth = await login(port, email, password);
  await fetch(`http://127.0.0.1:${port}/api/billing/subscription`, { headers: { authorization: `Bearer ${auth.accessToken}` } });
  const userId = auth.data.user.id;

  const unpaidEvent = {
    id: 'evt_checkout_unpaid',
    type: 'checkout.session.completed',
    data: { object: {
      mode: 'subscription', status: 'complete', payment_status: 'unpaid',
      client_reference_id: userId,
      customer: 'cus_regression',
      subscription: 'sub_regression',
      metadata: { userId, plan: 'pro' },
    } },
  };
  const unsignedBody = JSON.stringify(unpaidEvent);
  const unsigned = await fetch(`http://127.0.0.1:${port}/api/billing/webhook`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: unsignedBody,
  });
  assert.equal(unsigned.status, 400);

  const badSignature = await fetch(`http://127.0.0.1:${port}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${Math.floor(Date.now()/1000)},v1=${'0'.repeat(64)}` },
    body: unsignedBody,
  });
  assert.equal(badSignature.status, 400);

  const stale = await postStripeEvent(port, unpaidEvent, webhookSecret, Math.floor(Date.now()/1000) - 600);
  assert.equal(stale.status, 400);

  const unpaid = await postStripeEvent(port, unpaidEvent, webhookSecret);
  assert.equal(unpaid.status, 200, await unpaid.clone().text());
  assert.equal((await unpaid.json()).action, 'ignored_unpaid_checkout');

  const paidCheckout = {
    ...unpaidEvent,
    id: 'evt_checkout_paid',
    data: { object: { ...unpaidEvent.data.object, payment_status: 'paid' } },
  };
  const paid = await postStripeEvent(port, paidCheckout, webhookSecret);
  assert.equal(paid.status, 200, await paid.clone().text());
  assert.equal((await paid.json()).action, 'subscription_activated');
  const replay = await postStripeEvent(port, paidCheckout, webhookSecret);
  assert.equal(replay.status, 200, await replay.clone().text());
  assert.equal((await replay.json()).reused, true);

  let state = new Database(dbPath);
  let subscription = state.prepare('SELECT plan,tokens_used,tokens_limit,status,stripe_customer_id,stripe_subscription_id FROM subscriptions WHERE user_id=?').get(userId);
  let credits = state.prepare('SELECT credits FROM users WHERE id=?').get(userId).credits;
  let creditRows = state.prepare('SELECT COUNT(*) AS count FROM credit_ledger WHERE user_id=?').get(userId).count;
  assert.deepEqual(subscription, { plan: 'pro', tokens_used: 0, tokens_limit: 2000000, status: 'active', stripe_customer_id: 'cus_regression', stripe_subscription_id: 'sub_regression' });
  assert.equal(credits, 75);
  assert.equal(creditRows, 1);
  state.prepare("UPDATE subscriptions SET tokens_used=123456,period_end='2000-01-01T00:00:00.000Z' WHERE user_id=?").run(userId);
  state.close();

  const elapsedPaidPeriod = await fetch(`http://127.0.0.1:${port}/api/billing/subscription`, { headers: { authorization: `Bearer ${auth.accessToken}` } });
  assert.equal(elapsedPaidPeriod.status, 200);
  const elapsedPaidState = await elapsedPaidPeriod.json();
  assert.equal(elapsedPaidState.tokensUsed, 123456);
  assert.equal(elapsedPaidState.periodEnd, '2000-01-01T00:00:00.000Z');

  const initialInvoice = {
    id: 'evt_invoice_subscription_create',
    type: 'invoice.paid',
    data: { object: { customer: 'cus_regression', subscription: 'sub_regression', paid: true, status: 'paid', billing_reason: 'subscription_create' } },
  };
  const initialInvoiceResponse = await postStripeEvent(port, initialInvoice, webhookSecret);
  assert.equal(initialInvoiceResponse.status, 200, await initialInvoiceResponse.clone().text());
  assert.equal((await initialInvoiceResponse.json()).action, 'initial_invoice_covered_by_checkout');

  state = new Database(dbPath, { readonly: true });
  assert.equal(state.prepare('SELECT tokens_used FROM subscriptions WHERE user_id=?').get(userId).tokens_used, 123456);
  assert.equal(state.prepare('SELECT credits FROM users WHERE id=?').get(userId).credits, 75);
  assert.equal(state.prepare('SELECT COUNT(*) AS count FROM credit_ledger WHERE user_id=?').get(userId).count, 1);
  state.close();

  const periodStart = Math.floor(Date.now()/1000);
  const renewalInvoice = {
    id: 'evt_invoice_renewal',
    type: 'invoice.paid',
    data: { object: {
      customer: 'cus_regression', subscription: 'sub_regression', paid: true, status: 'paid', billing_reason: 'subscription_cycle',
      lines: { data: [{ price: { id: 'price_agency_regression' }, period: { start: periodStart, end: periodStart + 30 * 86400 } }] },
    } },
  };
  const renewal = await postStripeEvent(port, renewalInvoice, webhookSecret);
  assert.equal(renewal.status, 200, await renewal.clone().text());
  assert.equal((await renewal.json()).action, 'subscription_renewed');
  const renewalReplay = await postStripeEvent(port, renewalInvoice, webhookSecret);
  assert.equal((await renewalReplay.json()).reused, true);

  state = new Database(dbPath);
  assert.deepEqual(
    state.prepare('SELECT plan,tokens_used,tokens_limit FROM subscriptions WHERE user_id=?').get(userId),
    { plan: 'agency', tokens_used: 0, tokens_limit: 10000000 },
  );
  assert.equal(state.prepare('SELECT credits FROM users WHERE id=?').get(userId).credits, 275);
  state.prepare("UPDATE subscriptions SET tokens_limit=2000000,tokens_used=2005000 WHERE user_id=?").run(userId);
  state.close();

  const overage = {
    id: 'evt_overage_paid',
    type: 'checkout.session.completed',
    data: { object: {
      mode: 'payment', status: 'complete', payment_status: 'paid', client_reference_id: userId,
      customer: 'cus_regression', amount_total: 100, currency: 'usd',
      metadata: { userId, kind: 'forge_overage', overage_tokens: '5000', chargeAmountCents: '100' },
    } },
  };
  const overageResponse = await postStripeEvent(port, overage, webhookSecret);
  assert.equal(overageResponse.status, 200, await overageResponse.clone().text());
  assert.equal((await overageResponse.json()).action, 'overage_settled');
  const overageReplay = await postStripeEvent(port, overage, webhookSecret);
  assert.equal((await overageReplay.json()).reused, true);
  state = new Database(dbPath, { readonly: true });
  assert.equal(state.prepare('SELECT tokens_used FROM subscriptions WHERE user_id=?').get(userId).tokens_used, 2000000);
  state.close();

  const paymentFailed = {
    id: 'evt_invoice_failed',
    type: 'invoice.payment_failed',
    data: { object: { customer: 'cus_regression', subscription: 'sub_regression', paid: false, status: 'open' } },
  };
  const failed = await postStripeEvent(port, paymentFailed, webhookSecret);
  assert.equal(failed.status, 200, await failed.text());

  const topup = {
    id: 'evt_topup_paid',
    type: 'checkout.session.completed',
    data: { object: {
      mode: 'payment', status: 'complete', payment_status: 'paid', client_reference_id: userId,
      customer: 'cus_regression', amount_total: 5000, currency: 'usd',
      metadata: { userId, kind: 'forge_topup', creditAmountCents: '5000' },
    } },
  };
  const tamperedTopup = {
    ...topup,
    id: 'evt_topup_amount_mismatch',
    data: { object: { ...topup.data.object, amount_total: 1000 } },
  };
  const tamperedTopupResponse = await postStripeEvent(port, tamperedTopup, webhookSecret);
  assert.equal(tamperedTopupResponse.status, 400);

  const topupResponse = await postStripeEvent(port, topup, webhookSecret);
  assert.equal(topupResponse.status, 200, await topupResponse.clone().text());
  assert.equal((await topupResponse.json()).action, 'topup_credited');
  const topupReplay = await postStripeEvent(port, topup, webhookSecret);
  assert.equal((await topupReplay.json()).reused, true);

  const deleted = {
    id: 'evt_subscription_deleted',
    type: 'customer.subscription.deleted',
    data: { object: { id: 'sub_regression', customer: 'cus_regression', status: 'canceled' } },
  };
  const deletedResponse = await postStripeEvent(port, deleted, webhookSecret);
  assert.equal(deletedResponse.status, 200, await deletedResponse.text());

  const invalidUserTopup = {
    ...topup,
    id: 'evt_topup_invalid_user',
    data: { object: { ...topup.data.object, client_reference_id: 'missing-user', metadata: { ...topup.data.object.metadata, userId: 'missing-user' } } },
  };
  const invalidUserResponse = await postStripeEvent(port, invalidUserTopup, webhookSecret);
  assert.equal(invalidUserResponse.status, 400);

  state = new Database(dbPath, { readonly: true });
  subscription = state.prepare('SELECT plan,tokens_used,tokens_limit,status,stripe_customer_id,stripe_subscription_id FROM subscriptions WHERE user_id=?').get(userId);
  credits = state.prepare('SELECT credits FROM users WHERE id=?').get(userId).credits;
  creditRows = state.prepare('SELECT COUNT(*) AS count FROM credit_ledger WHERE user_id=?').get(userId).count;
  const events = state.prepare('SELECT COUNT(*) AS count FROM stripe_webhook_events').get().count;
  const invalidEvent = state.prepare("SELECT COUNT(*) AS count FROM stripe_webhook_events WHERE event_id='evt_topup_invalid_user'").get().count;
  state.close();
  assert.deepEqual(subscription, { plan: 'free', tokens_used: 0, tokens_limit: 10000, status: 'cancelled', stripe_customer_id: 'cus_regression', stripe_subscription_id: null });
  assert.equal(credits, 325);
  assert.equal(creditRows, 3);
  assert.equal(events, 8);
  assert.equal(invalidEvent, 0);
});

test('legacy Base64 credentials migrate transactionally to authenticated encryption', { timeout: 180_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-credential-migration-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const email = 'credential-admin@forge.test';
  const password = 'production-credential-regression';
  const encryptionKey = 'stable-production-credential-encryption-key';
  let activeChild = null;
  t.after(async () => {
    if (activeChild) await stopForge(activeChild);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const firstPort = await getFreePort();
  const commonEnv = {
    NODE_ENV: 'production',
    RAILWAY_ENVIRONMENT: '',
    JWT_SECRET: 'production-credential-jwt-secret-32-bytes',
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
    CREDENTIAL_ENCRYPTION_KEY: encryptionKey,
    BILLING_REQUIRED: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
  };
  const first = spawnForge(dbPath, firstPort, { ...commonEnv, FRONTEND_URL: `http://127.0.0.1:${firstPort}` });
  activeChild = first.child;
  await waitForHealth(first.child, firstPort, first.getLogs);
  const firstAuth = await login(firstPort, email, password);
  await stopForge(first.child);
  activeChild = null;

  const legacyUserKey = 'legacy-user-key';
  const legacyPlatformKey = 'legacy-platform-key';
  const legacyCustomKey = 'legacy-custom-key';
  const legacyStorage = JSON.stringify({ token: 'legacy-storage-token' });
  const legacyDb = new Database(dbPath);
  legacyDb.prepare("INSERT INTO api_keys (id,user_id,provider,key_encrypted,key_preview,key_status) VALUES (?,?,?,?,?,'active')")
    .run('legacy-user-key-id', firstAuth.data.user.id, 'legacy', Buffer.from(legacyUserKey).toString('base64'), 'lega…-key');
  legacyDb.prepare('INSERT INTO platform_api_keys (provider,key_encrypted,enabled) VALUES (?,?,1)')
    .run('legacy-platform', Buffer.from(legacyPlatformKey).toString('base64'));
  legacyDb.prepare('INSERT INTO custom_providers (id,user_id,name,base_url,api_key_encrypted) VALUES (?,?,?,?,?)')
    .run('legacy-custom-provider', firstAuth.data.user.id, 'Legacy Provider', 'https://provider.invalid', Buffer.from(legacyCustomKey).toString('base64'));
  legacyDb.prepare('INSERT INTO user_storage_configs (id,user_id,provider,label,credentials_encrypted) VALUES (?,?,?,?,?)')
    .run('legacy-storage-config', firstAuth.data.user.id, 'github', 'Legacy Storage', Buffer.from(legacyStorage).toString('base64'));
  legacyDb.close();

  const secondPort = await getFreePort();
  const second = spawnForge(dbPath, secondPort, { ...commonEnv, FRONTEND_URL: `http://127.0.0.1:${secondPort}` });
  activeChild = second.child;
  await waitForHealth(second.child, secondPort, second.getLogs);
  assert.match(second.getLogs(), /Migrated 4 legacy credential records to authenticated encryption/);
  const secondAuth = await login(secondPort, email, password);
  const headers = { authorization: `Bearer ${secondAuth.accessToken}`, 'content-type': 'application/json' };

  const migratedDb = new Database(dbPath);
  const encryptedValues = [
    migratedDb.prepare("SELECT key_encrypted AS value FROM api_keys WHERE id='legacy-user-key-id'").get().value,
    migratedDb.prepare("SELECT key_encrypted AS value FROM platform_api_keys WHERE provider='legacy-platform'").get().value,
    migratedDb.prepare("SELECT api_key_encrypted AS value FROM custom_providers WHERE id='legacy-custom-provider'").get().value,
    migratedDb.prepare("SELECT credentials_encrypted AS value FROM user_storage_configs WHERE id='legacy-storage-config'").get().value,
  ];
  for (const value of encryptedValues) {
    assert.match(value, /^v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);
    assert.doesNotMatch(value, /legacy/);
  }

  const validConnector = await fetch(`http://127.0.0.1:${secondPort}/api/connectors`, {
    method: 'POST', headers, body: JSON.stringify({ id: 'apptopia', key: 'new-connector-secret' }),
  });
  assert.equal(validConnector.status, 200);
  const newCiphertext = migratedDb.prepare("SELECT key_encrypted AS value FROM api_keys WHERE user_id=? AND provider='connector_apptopia'").get(secondAuth.data.user.id).value;
  assert.match(newCiphertext, /^v1:/);
  assert.notEqual(newCiphertext, Buffer.from('new-connector-secret').toString('base64'));

  const vault = await fetch(`http://127.0.0.1:${secondPort}/api/keys/vault`, { headers });
  const legacyVault = (await vault.json()).data.find(row => row.provider === 'legacy');
  assert.equal(legacyVault.key_preview, 'lega••••-key');
  const providers = await fetch(`http://127.0.0.1:${secondPort}/api/providers/custom`, { headers });
  assert.equal(JSON.stringify(await providers.json()).includes('api_key_encrypted'), false);

  const tampered = encryptedValues[0].slice(0, -1) + (encryptedValues[0].endsWith('A') ? 'B' : 'A');
  migratedDb.prepare("UPDATE api_keys SET key_encrypted=? WHERE id='legacy-user-key-id'").run(tampered);
  migratedDb.close();
  const tamperedVault = await fetch(`http://127.0.0.1:${secondPort}/api/keys/vault`, { headers });
  const tamperedLegacy = (await tamperedVault.json()).data.find(row => row.provider === 'legacy');
  assert.equal(tamperedLegacy.key_preview, '••••••••');
});
