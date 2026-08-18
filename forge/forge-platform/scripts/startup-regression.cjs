const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const crypto = require('node:crypto');
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
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
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

  const state = new Database(dbPath, { readonly: true });
  const subscription = state.prepare('SELECT plan FROM subscriptions WHERE user_id=?').get(auth.data.user.id);
  const connectors = state.prepare("SELECT COUNT(*) AS count FROM api_keys WHERE user_id=? AND provider LIKE 'connector_%'").get(auth.data.user.id);
  state.close();
  assert.equal(subscription.plan, 'free');
  assert.equal(connectors.count, 0);
});

test('production accepts only a correctly signed Stripe webhook', { timeout: 120_000 }, async t => {
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
    STRIPE_SECRET_KEY: 'sk_test_forge_regression',
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    STRIPE_PRICE_STARTER: '',
    STRIPE_PRICE_PRO: '',
    STRIPE_PRICE_ENTERPRISE: '',
  });
  t.after(async () => {
    await stopForge(child);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  await waitForHealth(child, port, getLogs);
  const auth = await login(port, email, password);
  await fetch(`http://127.0.0.1:${port}/api/billing/subscription`, { headers: { authorization: `Bearer ${auth.accessToken}` } });

  const event = JSON.stringify({
    type: 'checkout.session.completed',
    data: { object: {
      client_reference_id: auth.data.user.id,
      customer: 'cus_regression',
      subscription: 'sub_regression',
      metadata: { userId: auth.data.user.id, plan: 'pro' },
    } },
  });
  const unsigned = await fetch(`http://127.0.0.1:${port}/api/billing/webhook`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: event,
  });
  assert.equal(unsigned.status, 400);

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac('sha256', webhookSecret).update(`${timestamp}.${event}`).digest('hex');
  const signed = await fetch(`http://127.0.0.1:${port}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${timestamp},v1=${signature}` },
    body: event,
  });
  assert.equal(signed.status, 200, await signed.text());

  const state = new Database(dbPath, { readonly: true });
  const subscription = state.prepare('SELECT plan, stripe_customer_id, stripe_subscription_id FROM subscriptions WHERE user_id=?').get(auth.data.user.id);
  state.close();
  assert.deepEqual(subscription, { plan: 'pro', stripe_customer_id: 'cus_regression', stripe_subscription_id: 'sub_regression' });
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
