const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const IMAGES = {
  forge: process.env.PILOT_FORGE_IMAGE || 'forge-commercial-rc-autonomous-20260823:test',
  apptopia: process.env.PILOT_APPTOPIA_IMAGE || 'apptopia-commercial-rc-20260823-versioned:test',
  minera: process.env.PILOT_MINERA_IMAGE || 'minera-commercial-rc-20260823:test',
  postgres: process.env.PILOT_POSTGRES_IMAGE
    || 'swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/postgres:16-alpine',
};

const suffix = `${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
const prefix = `forge3pilot_${suffix}`;
const names = {
  network: `${prefix}_net`,
  postgres: `${prefix}_postgres`,
  minera: `${prefix}_minera`,
  apptopia: `${prefix}_apptopia`,
  forge: `${prefix}_forge`,
  pgVolume: `${prefix}_pgdata`,
  mineraVolume: `${prefix}_mineradata`,
  forgeVolume: `${prefix}_forgedata`,
};
const created = { containers: [], volumes: [], network: false };

const randomSecret = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
const redact = (value) => String(value || '')
  .replace(/mk_live_[a-f0-9]+/gi, '[REDACTED_API_KEY]')
  .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]');

function docker(args, { allowFailure = false, quiet = false } = {}) {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (!allowFailure && result.status !== 0) {
    const safeArgs = args.map((arg, index) => {
      const previous = args[index - 1];
      return previous === '-e' || previous === '--env' ? '[REDACTED_ENV]' : arg;
    });
    throw new Error(
      `docker ${safeArgs.join(' ')} failed (${result.status}): ${redact(result.stderr || result.stdout)}`,
    );
  }
  if (!quiet && result.stderr && result.status === 0) process.stderr.write(redact(result.stderr));
  return result;
}

function dockerOutput(args, options) {
  return docker(args, { ...options, quiet: true }).stdout.trim();
}

function assertFreshResource(kind, name) {
  const args = kind === 'network' ? ['network', 'inspect', name] : ['volume', 'inspect', name];
  const result = docker(args, { allowFailure: true, quiet: true });
  assert.notEqual(result.status, 0, `${kind} ${name} already exists`);
}

function createVolume(name) {
  assertFreshResource('volume', name);
  docker(['volume', 'create', name], { quiet: true });
  created.volumes.push(name);
}

function startContainer(name, args) {
  docker(['run', '-d', '--name', name, ...args], { quiet: true });
  created.containers.push(name);
}

function publishedPort(container, containerPort) {
  const output = dockerOutput(['port', container, `${containerPort}/tcp`]);
  const match = output.match(/:(\d+)\s*$/m);
  assert.ok(match, `No published port found for ${container}:${containerPort}`);
  return Number(match[1]);
}

async function waitForHttp(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error(`Timed out waiting for ${url}: ${redact(lastError)}`);
}

async function waitForPostgres() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const result = docker(
      ['exec', names.postgres, 'pg_isready', '-U', 'pilot', '-d', 'pilot'],
      { allowFailure: true, quiet: true },
    );
    if (result.status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error('Timed out waiting for isolated PostgreSQL');
}

async function request(url, { method = 'GET', token, apiKey, body, expected = [200] } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (apiKey) headers['X-API-Key'] = apiKey;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${new URL(url).pathname} returned ${response.status}: ${redact(text).slice(0, 800)}`);
  }
  return { status: response.status, body: payload };
}

function sha256JsonString(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function inspectExistingContainers() {
  return new Set(
    dockerOutput(['ps', '--format', '{{.Names}}'])
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function configureForgeFixture({ userId, credential, passportId, agent, runs }) {
  const code = String.raw`
    const crypto = require('node:crypto');
    const Database = require('better-sqlite3');
    const db = new Database(process.env.DB_PATH || '/data/forge.db');
    const aad = Buffer.from('forge:credentials:v1');
    const encryptionKey = crypto.createHash('sha256')
      .update(process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.JWT_SECRET)
      .digest();
    const encrypt = (plain) => {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
      cipher.setAAD(aad);
      const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      return 'v1:' + iv.toString('base64url') + ':' + cipher.getAuthTag().toString('base64url')
        + ':' + encrypted.toString('base64url');
    };
    const userId = process.env.PILOT_USER_ID;
    const rawCredential = process.env.PILOT_CONNECTOR_CREDENTIAL;
    const passport = JSON.parse(process.env.PILOT_PASSPORT_JSON);
    const agent = JSON.parse(process.env.PILOT_AGENT_JSON);
    const runs = JSON.parse(process.env.PILOT_RUNS_JSON);
    const existingKey = db.prepare('SELECT id FROM api_keys WHERE user_id=? AND provider=?')
      .get(userId, 'connector_apptopia');
    const encrypted = encrypt(rawCredential);
    if (existingKey) {
      db.prepare('UPDATE api_keys SET key_encrypted=?,key_preview=? WHERE id=?')
        .run(encrypted, 'connector', existingKey.id);
    } else {
      db.prepare('INSERT INTO api_keys (id,user_id,provider,key_encrypted,key_preview) VALUES (?,?,?,?,?)')
        .run(crypto.randomUUID(), userId, 'connector_apptopia', encrypted, 'connector');
    }
    const inserted = db.transaction(() => runs.map((run) => {
      const requestHash = crypto.createHash('sha256').update(JSON.stringify(run.prompt), 'utf8').digest('hex');
      const resultHash = crypto.createHash('sha256').update(JSON.stringify(run.result), 'utf8').digest('hex');
      const out = db.prepare(
        'INSERT INTO agent_runs '
        + '(user_id,name,prompt,result,status,agent_id,agent_version,forge_agent_id,'
        + 'apptopia_agent_id,apptopia_agent_version_id,apptopia_agent_version,'
        + 'trace_id,request_hash,result_hash,model,provider,routing_reason,'
        + 'prompt_tokens,completion_tokens,total_tokens,cost_usd,duration_ms,tool_calls,'
        + 'approval_status,sync_status,approval_id,error,updated_at,completed_at) '
        + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,datetime('now'),datetime('now'))"
      )
        .run(userId, run.name, run.prompt, run.result, 'done', passport.id, '1.0.0', passport.id,
          agent.id, agent.versionId, agent.version, run.traceId, requestHash, resultHash,
          'openai/gpt-4.1-mini', 'openrouter', 'deterministic acceptance fixture; no provider call',
          19, 8, 27, 0.0042, 321, 0, 'pending', 'not_started', run.approvalId);
      db.prepare(
        'INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,status) '
        + "VALUES (?,?,?,?,?,?,?,'pending')"
      )
        .run(run.approvalId, userId, 'agent_run', 'Agent Run: ' + run.name,
          JSON.stringify({ runId: Number(out.lastInsertRowid), traceId: run.traceId,
            forgeAgentId: passport.id, apptopiaAgentId: agent.id,
            agentVersionId: agent.versionId, agentVersion: agent.version,
            requestHash, resultHash, model: 'openai/gpt-4.1-mini', provider: 'openrouter',
            costUsd: 0.0042, durationMs: 321, totalTokens: 27, toolCalls: [] }),
          run.result, 'forge');
      return { id: Number(out.lastInsertRowid), approvalId: run.approvalId, traceId: run.traceId,
        requestHash, resultHash };
    }))();
    process.stdout.write(JSON.stringify(inserted));
  `;
  const result = docker([
    'exec',
    '-e', `PILOT_USER_ID=${userId}`,
    '-e', `PILOT_CONNECTOR_CREDENTIAL=${credential}`,
    '-e', `PILOT_PASSPORT_JSON=${JSON.stringify({ id: passportId })}`,
    '-e', `PILOT_AGENT_JSON=${JSON.stringify(agent)}`,
    '-e', `PILOT_RUNS_JSON=${JSON.stringify(runs)}`,
    names.forge,
    'node', '-e', code,
  ], { quiet: true });
  return JSON.parse(result.stdout);
}

function postgresEvidence(agentId, tracePrefix) {
  const sql = `
    SELECT json_build_object(
      'protocolCalls', (SELECT COUNT(*) FROM "AgentProtocolCall" WHERE "traceId" LIKE '${tracePrefix}%'),
      'agentRuns', (SELECT COUNT(*) FROM "AgentRun" WHERE "agentId"='${agentId}'),
      'agentVersions', (SELECT COUNT(*) FROM "AgentVersion" WHERE "agentId"='${agentId}'),
      'versionEvents', (SELECT COUNT(*) FROM "ProtocolAuditEvent" WHERE "agentId"='${agentId}' AND "eventType"='AGENT_VERSION_BOUND'),
      'reviewEvents', (SELECT COUNT(*) FROM "ProtocolAuditEvent" WHERE "agentId"='${agentId}' AND "eventType"='PILOT_RUBRIC_REVIEW'),
      'publishEvents', (SELECT COUNT(*) FROM "ProtocolAuditEvent" WHERE "agentId"='${agentId}' AND "eventType"='MINERA_PUBLISH'),
      'runCount', (SELECT "runCount" FROM "Agent" WHERE id='${agentId}')
    );`;
  const output = dockerOutput([
    'exec', names.postgres, 'psql', '-U', 'pilot', '-d', 'pilot', '-tA', '-c', sql,
  ]);
  return JSON.parse(output);
}

function mineraEvidence(tracePrefix) {
  const code = String.raw`
    import { db } from './src/database/db.js';
    const prefix = process.env.PILOT_TRACE_PREFIX + '%';
    const result = {
      insights: db.prepare('SELECT COUNT(*) AS count FROM insights WHERE source_trace_id LIKE ?').get(prefix).count,
      verified: db.prepare("SELECT COUNT(*) AS count FROM insights WHERE source_trace_id LIKE ? AND status='verified'").get(prefix).count,
      rejected: db.prepare("SELECT COUNT(*) AS count FROM insights WHERE source_trace_id LIKE ? AND status='rejected'").get(prefix).count,
      pending: db.prepare("SELECT COUNT(*) AS count FROM insights WHERE source_trace_id LIKE ? AND status='pending'").get(prefix).count,
      assets: db.prepare('SELECT COUNT(*) AS count FROM knowledge_assets WHERE insight_id IN (SELECT id FROM insights WHERE source_trace_id LIKE ?)').get(prefix).count,
    };
    process.stdout.write('\nPILOT_EVIDENCE=' + JSON.stringify(result));
  `;
  const result = docker([
    'exec', '-e', `PILOT_TRACE_PREFIX=${tracePrefix}`, names.minera,
    'node', '--input-type=module', '-e', code,
  ], { quiet: true });
  const marker = 'PILOT_EVIDENCE=';
  const offset = result.stdout.lastIndexOf(marker);
  assert.ok(offset >= 0, 'Minera evidence query did not return its result marker');
  return JSON.parse(result.stdout.slice(offset + marker.length).trim());
}

function assertLogsClean(secrets) {
  for (const container of [names.minera, names.apptopia, names.forge]) {
    const logs = dockerOutput(['logs', container]);
    for (const secret of secrets) {
      if (secret && secret.length >= 8) assert.equal(logs.includes(secret), false, `${container} logs contain a credential`);
    }
    assert.equal(/mk_live_[a-f0-9]{20,}/i.test(logs), false, `${container} logs expose an API key`);
  }
}

function cleanup() {
  assert.match(prefix, /^forge3pilot_[a-z0-9_]+$/);
  for (const container of [...created.containers].reverse()) {
    docker(['rm', '-f', container], { allowFailure: true, quiet: true });
  }
  for (const volume of [...created.volumes].reverse()) {
    docker(['volume', 'rm', volume], { allowFailure: true, quiet: true });
  }
  if (created.network) docker(['network', 'rm', names.network], { allowFailure: true, quiet: true });
}

async function main() {
  const beforeContainers = inspectExistingContainers();
  const postgresPassword = randomSecret();
  const mineraAuthSecret = randomSecret();
  const mineraOwnerEmail = `owner-${suffix}@pilot.local`;
  const mineraOwnerPassword = randomSecret(18);
  const apptopiaJwtSecret = randomSecret();
  const apptopiaAdminSecret = randomSecret();
  const apptopiaEmail = `owner-${suffix}@apptopia.local`;
  const apptopiaPassword = randomSecret(18);
  const forgeJwtSecret = randomSecret();
  const forgeRefreshSecret = randomSecret();
  const forgeCredentialSecret = randomSecret();
  const forgeEmail = `owner-${suffix}@forge.local`;
  const forgePassword = randomSecret(18);
  const tracePrefix = `pilot-${suffix}-`;
  const secrets = [
    postgresPassword, mineraAuthSecret, mineraOwnerPassword, apptopiaJwtSecret,
    apptopiaAdminSecret, apptopiaPassword, forgeJwtSecret, forgeRefreshSecret,
    forgeCredentialSecret, forgePassword,
  ];

  assertFreshResource('network', names.network);
  docker(['network', 'create', names.network], { quiet: true });
  created.network = true;
  createVolume(names.pgVolume);
  createVolume(names.mineraVolume);
  createVolume(names.forgeVolume);

  startContainer(names.postgres, [
    '--network', names.network,
    '--network-alias', 'postgres',
    '-e', 'POSTGRES_USER=pilot',
    '-e', `POSTGRES_PASSWORD=${postgresPassword}`,
    '-e', 'POSTGRES_DB=pilot',
    '-v', `${names.pgVolume}:/var/lib/postgresql/data`,
    IMAGES.postgres,
  ]);
  await waitForPostgres();

  startContainer(names.minera, [
    '--network', names.network,
    '--network-alias', 'minera',
    '-p', '127.0.0.1::4000',
    '-e', 'NODE_ENV=development',
    '-e', 'PORT=4000',
    '-e', 'DATA_DIR=/app/data',
    '-e', `AUTH_SECRET=${mineraAuthSecret}`,
    '-e', `OWNER_EMAILS=${mineraOwnerEmail}`,
    '-e', 'ECONOMY_MODE=demo',
    '-e', 'PAYOUTS_ENABLED=false',
    '-e', 'EXTERNAL_REVENUE_CONNECTED=false',
    '-v', `${names.mineraVolume}:/app/data`,
    IMAGES.minera,
  ]);
  const mineraPort = publishedPort(names.minera, 4000);
  const mineraBase = `http://127.0.0.1:${mineraPort}`;
  await waitForHttp(`${mineraBase}/health`);
  await waitForHttp(`${mineraBase}/health/ready`);
  const mineraSignup = await request(`${mineraBase}/api/auth/signup`, {
    method: 'POST', expected: [201], body: { email: mineraOwnerEmail, password: mineraOwnerPassword },
  });
  assert.equal(mineraSignup.body.owner, true);
  const mineraLogin = await request(`${mineraBase}/api/auth/login`, {
    method: 'POST', expected: [200], body: { email: mineraOwnerEmail, password: mineraOwnerPassword },
  });
  const mineraToken = mineraLogin.body.token;
  const mineraAddress = mineraLogin.body.address;
  assert.equal(mineraLogin.body.owner, true);
  secrets.push(mineraToken);
  const mineraKeyResponse = await request(`${mineraBase}/api/keys/${encodeURIComponent(mineraAddress)}`, {
    method: 'POST', token: mineraToken, expected: [201], body: { scopes: ['insights:submit'] },
  });
  const mineraApiKey = mineraKeyResponse.body.key;
  assert.deepEqual(mineraKeyResponse.body.scopes, ['insights:submit']);
  secrets.push(mineraApiKey);

  const databaseUrl = `postgresql://pilot:${encodeURIComponent(postgresPassword)}@postgres:5432/pilot?schema=public`;
  startContainer(names.apptopia, [
    '--network', names.network,
    '--network-alias', 'apptopia',
    '-p', '127.0.0.1::8080',
    '-e', 'NODE_ENV=development',
    '-e', 'PORT=8080',
    '-e', `DATABASE_URL=${databaseUrl}`,
    '-e', `JWT_SECRET=${apptopiaJwtSecret}`,
    '-e', 'DB_INIT_MODE=push',
    '-e', 'SEED_ON_BOOT=false',
    '-e', `MINERA_BASE_URL=http://minera:4000`,
    '-e', `MINERA_API_KEY=${mineraApiKey}`,
    '-e', `ADMIN_SETUP_KEY=${apptopiaAdminSecret}`,
    '-e', 'TRANSFER_BRIDGE_DRY_RUN=true',
    '-e', 'SETTLEMENT_TRANSFER_SCHEDULE_ENABLED=false',
    '-e', 'SETTLEMENT_RECONCILIATION_AUTOHEAL_ENABLED=false',
    IMAGES.apptopia,
  ]);
  const apptopiaPort = publishedPort(names.apptopia, 8080);
  const apptopiaBase = `http://127.0.0.1:${apptopiaPort}`;
  await waitForHttp(`${apptopiaBase}/health`, 180_000);
  await waitForHttp(`${apptopiaBase}/ready`, 180_000);
  const apptopiaRegistration = await request(`${apptopiaBase}/api/auth/register`, {
    method: 'POST', expected: [201], body: {
      email: apptopiaEmail,
      username: `pilot_${crypto.randomBytes(5).toString('hex')}`,
      password: apptopiaPassword,
      name: 'Forge Commercial Pilot Owner',
    },
  });
  const apptopiaUserToken = apptopiaRegistration.body.token;
  secrets.push(apptopiaUserToken);
  const agentResponse = await request(`${apptopiaBase}/api/agents`, {
    method: 'POST', token: apptopiaUserToken, expected: [201], body: {
      name: `Forge Evidence Pilot ${suffix.slice(-8)}`,
      slug: `forge-evidence-${suffix.replace(/_/g, '-').slice(-20)}`,
      description: 'Creator-owned Forge execution evidence for the controlled commercial pilot.',
      category: 'Productivity',
      tags: ['forge', 'verified-evidence'],
      features: ['Creator ownership', 'Immutable run evidence'],
      pricingType: 'FREE',
      price: 0,
    },
  });
  const agent = {
    id: agentResponse.body.agent.id,
    slug: agentResponse.body.agent.slug,
    versionId: agentResponse.body.agentVersion.id,
    version: agentResponse.body.agentVersion.version,
  };
  assert.ok(agent.id && agent.slug && agent.versionId && agent.version);
  await request(`${apptopiaBase}/api/admin/bootstrap`, {
    method: 'POST', expected: [200], body: { email: apptopiaEmail, secret: apptopiaAdminSecret },
  });
  const apptopiaLogin = await request(`${apptopiaBase}/api/auth/login`, {
    method: 'POST', expected: [200], body: { email: apptopiaEmail, password: apptopiaPassword },
  });
  const apptopiaAdminToken = apptopiaLogin.body.token;
  assert.equal(String(apptopiaLogin.body.user.role).toUpperCase(), 'ADMIN');
  secrets.push(apptopiaAdminToken);

  startContainer(names.forge, [
    '--network', names.network,
    '--network-alias', 'forge',
    '-p', '127.0.0.1::3000',
    '-e', 'NODE_ENV=development',
    '-e', 'PORT=3000',
    '-e', 'DB_PATH=/data/forge.db',
    '-e', `JWT_SECRET=${forgeJwtSecret}`,
    '-e', `JWT_REFRESH_SECRET=${forgeRefreshSecret}`,
    '-e', `CREDENTIAL_ENCRYPTION_KEY=${forgeCredentialSecret}`,
    '-e', 'APPTOPIA_BASE_URL=http://apptopia:8080',
    '-e', 'APPTOPIA_SYNC_TIMEOUT_MS=15000',
    '-v', `${names.forgeVolume}:/data`,
    IMAGES.forge,
  ]);
  const forgePort = publishedPort(names.forge, 3000);
  const forgeBase = `http://127.0.0.1:${forgePort}`;
  await waitForHttp(`${forgeBase}/health`, 180_000);
  await waitForHttp(`${forgeBase}/ready`, 180_000);
  await request(`${forgeBase}/api/auth/register`, {
    method: 'POST', expected: [201], body: {
      email: forgeEmail, password: forgePassword, firstName: 'Pilot', lastName: 'Owner',
    },
  });
  const forgeLogin = await request(`${forgeBase}/api/auth/login`, {
    method: 'POST', expected: [200], body: { email: forgeEmail, password: forgePassword },
  });
  const forgeToken = forgeLogin.body.accessToken;
  const forgeUserId = forgeLogin.body.data.user.id;
  secrets.push(forgeToken);
  const passportResponse = await request(`${forgeBase}/api/passport`, { token: forgeToken, expected: [200] });
  const passportId = passportResponse.body.data.id;
  await request(`${forgeBase}/api/passport`, {
    method: 'PATCH', token: forgeToken, expected: [200], body: {
      apptopia_agent_id: agent.id,
      apptopia_agent_version_id: agent.versionId,
      apptopia_agent_version: agent.version,
    },
  });
  const mappedPassport = await request(`${forgeBase}/api/passport`, { token: forgeToken, expected: [200] });
  assert.equal(mappedPassport.body.data.id, passportId);
  assert.equal(mappedPassport.body.data.apptopia_agent_id, agent.id);
  assert.equal(mappedPassport.body.data.apptopia_agent_version_id, agent.versionId);
  assert.equal(mappedPassport.body.data.apptopia_agent_version, agent.version);

  const runSpecs = [
    { key: 'approved', name: 'Approved knowledge candidate', prompt: 'Create the approved internal pilot brief.', result: '# Approved Pilot Brief\n\nVerified, traceable internal result.' },
    { key: 'mineraRejected', name: 'Owner rejected knowledge candidate', prompt: 'Create the candidate that Minera will reject.', result: '# Rejected Knowledge Candidate\n\nValid execution evidence, rejected by the knowledge owner.' },
    { key: 'rubricFailed', name: 'Rubric failed candidate', prompt: 'Create a deliberately incomplete pilot output.', result: 'Incomplete output without the required evidence section.' },
    { key: 'forgeRejected', name: 'Forge owner rejected candidate', prompt: 'Create a result the Forge owner will reject.', result: 'Private result that must never leave Forge.' },
  ].map((run) => ({
    ...run,
    traceId: `${tracePrefix}${run.key}`,
    approvalId: `appr_${crypto.randomUUID()}`,
  }));
  const fixtures = configureForgeFixture({
    userId: forgeUserId,
    credential: apptopiaAdminToken,
    passportId,
    agent,
    runs: runSpecs,
  });
  assert.equal(fixtures.length, 4);

  const fixtureByKey = Object.fromEntries(runSpecs.map((run, index) => [run.key, fixtures[index]]));
  for (const key of ['approved', 'mineraRejected', 'rubricFailed']) {
    const approval = await request(`${forgeBase}/api/approvals/${fixtureByKey[key].approvalId}/approve`, {
      method: 'POST', token: forgeToken, expected: [200],
    });
    assert.equal(approval.body.data.run.sync_status, 'synced');
    assert.equal(approval.body.data.run.approval_status, 'approved');
  }
  const approvalReplay = await request(`${forgeBase}/api/approvals/${fixtureByKey.approved.approvalId}/approve`, {
    method: 'POST', token: forgeToken, expected: [200],
  });
  assert.equal(approvalReplay.body.data.run.sync_status, 'synced');
  const forgeReject = await request(`${forgeBase}/api/approvals/${fixtureByKey.forgeRejected.approvalId}/reject`, {
    method: 'POST', token: forgeToken, expected: [200],
  });
  assert.equal(forgeReject.body.data.approval_status, 'rejected');
  const forgeRejectReplay = await request(`${forgeBase}/api/approvals/${fixtureByKey.forgeRejected.approvalId}/reject`, {
    method: 'POST', token: forgeToken, expected: [200],
  });
  assert.equal(forgeRejectReplay.body.data.approval_status, 'rejected');
  await request(`${forgeBase}/api/approvals/${fixtureByKey.forgeRejected.approvalId}/approve`, {
    method: 'POST', token: forgeToken, expected: [409],
  });

  const callsResponse = await request(`${apptopiaBase}/api/admin/protocol/calls?limit=100`, {
    token: apptopiaAdminToken, expected: [200],
  });
  let pilotCalls = callsResponse.body.calls.filter((call) => call.traceId.startsWith(tracePrefix));
  assert.equal(pilotCalls.length, 3);
  const callsByTrace = Object.fromEntries(pilotCalls.map((call) => [call.traceId, call]));
  for (const key of ['approved', 'mineraRejected', 'rubricFailed']) {
    const spec = runSpecs.find((run) => run.key === key);
    const call = callsByTrace[spec.traceId];
    assert.ok(call);
    assert.equal(call.agent.id, agent.id);
    assert.equal(call.agentVersion.id, agent.versionId);
    assert.equal(call.agentVersion.version, agent.version);
    assert.equal(call.metadata.forgeAgentId, passportId);
    assert.equal(call.requestHash, sha256JsonString(spec.prompt));
    assert.equal(call.resultHash, sha256JsonString(spec.result));
  }
  const approvedSpec = runSpecs.find((run) => run.key === 'approved');
  await request(`${apptopiaBase}/api/protocol/agents/${encodeURIComponent(agent.id)}/runs`, {
    method: 'POST', token: apptopiaAdminToken, expected: [409], body: {
      traceId: approvedSpec.traceId,
      input: approvedSpec.prompt,
      output: `${approvedSpec.result} tampered`,
      agentVersionId: agent.versionId,
      agentVersion: agent.version,
      status: 'COMPLETED',
      success: true,
    },
  });

  const perfectScores = {
    factualConsistency: 35,
    sourceTraceability: 25,
    requiredContent: 20,
    actionability: 15,
    formatCompliance: 5,
  };
  for (const key of ['approved', 'mineraRejected']) {
    const spec = runSpecs.find((run) => run.key === key);
    const review = await request(
      `${apptopiaBase}/api/admin/protocol/calls/${callsByTrace[spec.traceId].id}/pilot-review`,
      {
        method: 'POST', token: apptopiaAdminToken, expected: [201], body: {
          rubricVersion: 'pilot-v1', scores: perfectScores, hardFailures: [],
          notes: `100/100 PASS for isolated ${key} lifecycle acceptance.`,
        },
      },
    );
    assert.equal(review.body.review.totalScore, 100);
    assert.equal(review.body.review.decision, 'PASS');
  }
  const failedSpec = runSpecs.find((run) => run.key === 'rubricFailed');
  const failedReview = await request(
    `${apptopiaBase}/api/admin/protocol/calls/${callsByTrace[failedSpec.traceId].id}/pilot-review`,
    {
      method: 'POST', token: apptopiaAdminToken, expected: [201], body: {
        rubricVersion: 'pilot-v1',
        scores: { factualConsistency: 20, sourceTraceability: 10, requiredContent: 5, actionability: 5, formatCompliance: 5 },
        hardFailures: ['MISSING_REQUIRED_SECTION'],
        notes: 'FAIL fixture proves unqualified evidence cannot enter Minera.',
      },
    },
  );
  assert.equal(failedReview.body.review.decision, 'FAIL');
  await request(
    `${apptopiaBase}/api/admin/protocol/calls/${callsByTrace[failedSpec.traceId].id}/minera-publish`,
    { method: 'POST', token: apptopiaAdminToken, expected: [409] },
  );

  const publishResults = {};
  for (const key of ['approved', 'mineraRejected']) {
    const spec = runSpecs.find((run) => run.key === key);
    const published = await request(
      `${apptopiaBase}/api/admin/protocol/calls/${callsByTrace[spec.traceId].id}/minera-publish`,
      { method: 'POST', token: apptopiaAdminToken, expected: [201] },
    );
    assert.equal(published.body.mineraStatus, 'pending');
    assert.equal(published.body.reward, 0);
    assert.equal(published.body.ual, null);
    publishResults[key] = published.body;
  }
  const publishReplay = await request(
    `${apptopiaBase}/api/admin/protocol/calls/${callsByTrace[approvedSpec.traceId].id}/minera-publish`,
    { method: 'POST', token: apptopiaAdminToken, expected: [200] },
  );
  assert.equal(publishReplay.body.reused, true);
  assert.equal(publishReplay.body.mineraInsightId, publishResults.approved.mineraInsightId);
  assert.equal(publishReplay.body.mineraStatus, 'pending');

  const pending = await request(`${mineraBase}/api/admin/pending`, { token: mineraToken, expected: [200] });
  const pilotPending = pending.body.filter((item) => [
    publishResults.approved.mineraInsightId,
    publishResults.mineraRejected.mineraInsightId,
  ].map(String).includes(String(item.id)));
  assert.equal(pilotPending.length, 2);
  assert.ok(pilotPending.every((item) => item.status === 'pending' && item.reward === 0));

  const approvedResolution = await request(
    `${mineraBase}/api/admin/insights/${publishResults.approved.mineraInsightId}/verify`,
    { method: 'POST', token: mineraToken, expected: [200], body: { approved: true } },
  );
  assert.equal(approvedResolution.body.status, 'verified');
  assert.equal(approvedResolution.body.reward, 100);
  assert.ok(typeof approvedResolution.body.ual === 'string' && approvedResolution.body.ual.length > 0);
  const approvedResolutionReplay = await request(
    `${mineraBase}/api/admin/insights/${publishResults.approved.mineraInsightId}/verify`,
    { method: 'POST', token: mineraToken, expected: [200], body: { approved: true } },
  );
  assert.equal(approvedResolutionReplay.body.reused, true);
  assert.equal(approvedResolutionReplay.body.reward, 100);
  assert.equal(approvedResolutionReplay.body.ual, approvedResolution.body.ual);

  const rejectedResolution = await request(
    `${mineraBase}/api/admin/insights/${publishResults.mineraRejected.mineraInsightId}/verify`,
    { method: 'POST', token: mineraToken, expected: [200], body: { approved: false } },
  );
  assert.equal(rejectedResolution.body.status, 'rejected');
  assert.equal(rejectedResolution.body.reward, 0);
  assert.equal(rejectedResolution.body.ual, null);
  const rejectedResolutionReplay = await request(
    `${mineraBase}/api/admin/insights/${publishResults.mineraRejected.mineraInsightId}/verify`,
    { method: 'POST', token: mineraToken, expected: [200], body: { approved: false } },
  );
  assert.equal(rejectedResolutionReplay.body.reused, true);
  assert.equal(rejectedResolutionReplay.body.reward, 0);
  assert.equal(rejectedResolutionReplay.body.ual, null);

  const asset = await request(
    `${mineraBase}/api/insights/${publishResults.approved.mineraInsightId}/asset`,
    { expected: [200] },
  );
  assert.equal(asset.body.ual, approvedResolution.body.ual);
  await request(
    `${mineraBase}/api/insights/${publishResults.mineraRejected.mineraInsightId}/asset`,
    { expected: [404] },
  );
  const balanceAfter = await request(`${mineraBase}/api/auth/me`, { token: mineraToken, expected: [200] });
  assert.equal(Number((balanceAfter.body.balance - mineraLogin.body.balance).toFixed(2)), 100);

  const approvedReconciliation = await request(
    `${apptopiaBase}/api/admin/protocol/calls/${callsByTrace[approvedSpec.traceId].id}/minera-publish`,
    { method: 'POST', token: apptopiaAdminToken, expected: [200] },
  );
  assert.equal(approvedReconciliation.body.reused, true);
  assert.equal(approvedReconciliation.body.mineraStatus, 'verified');
  assert.equal(approvedReconciliation.body.reward, 100);
  assert.equal(approvedReconciliation.body.ual, approvedResolution.body.ual);
  const rejectedSpec = runSpecs.find((run) => run.key === 'mineraRejected');
  const rejectedReconciliation = await request(
    `${apptopiaBase}/api/admin/protocol/calls/${callsByTrace[rejectedSpec.traceId].id}/minera-publish`,
    { method: 'POST', token: apptopiaAdminToken, expected: [200] },
  );
  assert.equal(rejectedReconciliation.body.reused, true);
  assert.equal(rejectedReconciliation.body.mineraStatus, 'rejected');
  assert.equal(rejectedReconciliation.body.reward, 0);
  assert.equal(rejectedReconciliation.body.ual, null);

  const forgeRuns = await request(`${forgeBase}/api/agent-runs`, { token: forgeToken, expected: [200] });
  const currentForgeRuns = forgeRuns.body.filter((run) => run.trace_id?.startsWith(tracePrefix));
  assert.equal(currentForgeRuns.length, 4);
  assert.equal(currentForgeRuns.filter((run) => run.sync_status === 'synced').length, 3);
  assert.equal(currentForgeRuns.filter((run) => run.approval_status === 'rejected').length, 1);
  assert.equal(currentForgeRuns.find((run) => run.trace_id === `${tracePrefix}forgeRejected`).protocol_call_id, null);

  const apptopiaDb = postgresEvidence(agent.id, tracePrefix);
  assert.deepEqual(apptopiaDb, {
    protocolCalls: 3,
    agentRuns: 3,
    agentVersions: 1,
    versionEvents: 3,
    reviewEvents: 3,
    publishEvents: 3,
    runCount: 3,
  });
  const mineraDb = mineraEvidence(tracePrefix);
  assert.deepEqual(mineraDb, { insights: 2, verified: 1, rejected: 1, pending: 0, assets: 1 });

  const finalCallsResponse = await request(`${apptopiaBase}/api/admin/protocol/calls?limit=100`, {
    token: apptopiaAdminToken, expected: [200],
  });
  pilotCalls = finalCallsResponse.body.calls.filter((call) => call.traceId.startsWith(tracePrefix));
  assert.equal(pilotCalls.length, 3);
  const approvedCall = pilotCalls.find((call) => call.traceId === approvedSpec.traceId);
  const approvedPublishEvent = approvedCall.auditEvents.find((event) => event.eventType === 'MINERA_PUBLISH');
  assert.equal(approvedPublishEvent.decision, 'VERIFIED');
  assert.equal(approvedPublishEvent.details.ual, approvedResolution.body.ual);
  const rejectedCall = pilotCalls.find((call) => call.traceId === rejectedSpec.traceId);
  const rejectedPublishEvent = rejectedCall.auditEvents.find((event) => event.eventType === 'MINERA_PUBLISH');
  assert.equal(rejectedPublishEvent.decision, 'REJECTED');
  assert.equal(rejectedPublishEvent.details.reward, 0);

  assertLogsClean(secrets);
  const duringContainers = inspectExistingContainers();
  for (const container of beforeContainers) assert.ok(duringContainers.has(container), `Unrelated container stopped: ${container}`);

  return {
    ok: true,
    forge: {
      passportBound: true,
      ownerApprovedAndSynced: 3,
      ownerRejectedAndPrivate: 1,
      approvalReplaySafe: true,
    },
    apptopia: {
      canonicalAgentVersions: 1,
      immutableProtocolCalls: 3,
      rubricPasses: 2,
      rubricFailuresBlocked: 1,
      tamperRejected: true,
      duplicateEvents: 0,
    },
    minera: {
      submittedPending: 2,
      verified: 1,
      rejected: 1,
      assets: 1,
      totalDemoReward: 100,
      duplicateRewards: 0,
    },
    security: {
      credentialLogsClean: true,
      productionResourcesTouched: false,
      payoutsEnabled: false,
      externalRevenueConnected: false,
    },
  };
}

(async () => {
  let result;
  let failure;
  try {
    result = await main();
  } catch (error) {
    failure = error;
    for (const container of created.containers) {
      const logs = docker(['logs', '--tail', '100', container], { allowFailure: true, quiet: true });
      if (logs.stdout || logs.stderr) {
        process.stderr.write(`\n[${container}]\n${redact(logs.stdout || logs.stderr)}\n`);
      }
    }
  } finally {
    cleanup();
  }
  if (failure) {
    console.error(redact(failure.stack || failure.message));
    process.exit(1);
  }
  console.log(JSON.stringify({ ...result, cleanup: { containers: true, volumes: true, network: true } }, null, 2));
})();
