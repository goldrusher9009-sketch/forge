'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { DockerApi } = require('../src/docker-api');

const baseUrl = String(process.env.FORGE_SANDBOX_ORCHESTRATOR_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const secret = String(process.env.FORGE_SANDBOX_HMAC_SECRET || '');
const parallel = Math.max(2, Math.min(Number(process.env.FORGE_E2E_PARALLEL) || 3, 3));
const dataDir = path.resolve(process.env.FORGE_SANDBOX_DATA_DIR || '/var/lib/forge-sandbox');
const docker = new DockerApi(process.env.DOCKER_SOCKET || '/var/run/docker.sock');

if (!secret) throw new Error('FORGE_SANDBOX_HMAC_SECRET_REQUIRED');

function assert(value, message) {
  if (!value) throw new Error(message);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function signedHeaders(method, requestPath, rawBody) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(18).toString('base64url');
  const canonical = [method.toUpperCase(), requestPath, timestamp, nonce, sha256(rawBody)].join('\n');
  return {
    'Content-Type': 'application/json',
    'X-Forge-Timestamp': timestamp,
    'X-Forge-Nonce': nonce,
    'X-Forge-Signature': crypto.createHmac('sha256', secret).update(canonical).digest('hex'),
  };
}

async function request(method, requestPath, body) {
  const rawBody = body === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(body));
  const response = await fetch(`${baseUrl}${requestPath}`, {
    method,
    headers: signedHeaders(method, requestPath, rawBody),
    body: rawBody.length ? rawBody : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

function runE2e(index) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(__dirname, 'e2e.cjs')], {
      env: { ...process.env, FORGE_E2E_HOLD_AFTER_PROVISION_MS: '8000' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout = `${stdout}${chunk}`.slice(-200_000); });
    child.stderr.on('data', chunk => { stderr = `${stderr}${chunk}`.slice(-200_000); });
    child.on('error', error => resolve({ index, exitCode: -1, stdout, stderr: `${stderr}${error.stack || error}` }));
    child.on('close', exitCode => resolve({ index, exitCode, stdout, stderr }));
  });
}

async function managedContainerCount() {
  const filters = encodeURIComponent(JSON.stringify({ label: ['com.forge.managed=sandbox-v1'] }));
  const response = await docker.request('GET', `/containers/json?all=1&filters=${filters}`, null);
  assert(Array.isArray(response.data), 'CONCURRENCY_E2E_CONTAINER_STATE_INVALID');
  return response.data.length;
}

async function managedVolumeCount() {
  const filters = encodeURIComponent(JSON.stringify({ label: ['com.forge.managed=sandbox-volume-v1'] }));
  const response = await docker.request('GET', `/volumes?filters=${filters}`, null);
  return Array.isArray(response.data && response.data.Volumes) ? response.data.Volumes.length : 0;
}

function idempotencyCount() {
  const directory = path.join(dataDir, 'idempotency');
  return fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isFile()).length : 0;
}

function capacityIdentity() {
  const seed = `${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
  return {
    tenantId: `tenant_capacity_${seed}`,
    userId: `user_capacity_${seed}`,
    workspaceId: `workspace_capacity_${seed}`,
    runId: `run_capacity_${seed}`,
    attemptId: `attempt_capacity_${seed}`,
    sandboxId: `sandbox_capacity_${seed}`,
  };
}

async function main() {
  const baselineContainers = await managedContainerCount();
  const baselineVolumes = await managedVolumeCount();
  const baselineIdempotency = idempotencyCount();
  assert(baselineContainers === 0, `CONCURRENCY_E2E_REQUIRES_IDLE_RUNTIME_CONTAINERS_${baselineContainers}`);
  assert(baselineVolumes === 0, `CONCURRENCY_E2E_REQUIRES_NO_MANAGED_VOLUMES_${baselineVolumes}`);
  const runs = Array.from({ length: parallel }, (_, index) => runE2e(index + 1));
  const expectedPeak = parallel * 2;
  let peak = 0;
  for (let sample = 0; sample < 60 && peak < expectedPeak; sample += 1) {
    peak = Math.max(peak, await managedContainerCount());
    if (peak < expectedPeak) await new Promise(resolve => setTimeout(resolve, 500));
  }

  const capacityIds = capacityIdentity();
  const capacity = await request('POST', '/v1/sandboxes/provision', capacityIds);
  if (capacity.status === 201) await request('DELETE', `/v1/sandboxes/${encodeURIComponent(capacityIds.sandboxId)}`);

  const results = await Promise.all(runs);
  for (const result of results) {
    assert(result.exitCode === 0, `CONCURRENCY_E2E_CHILD_${result.index}_FAILED: ${(result.stderr || result.stdout).replace(/\s+/g, ' ').slice(-1000)}`);
    assert(/"success":true/.test(result.stdout), `CONCURRENCY_E2E_CHILD_${result.index}_MISSING_SUCCESS`);
  }

  const remainingContainers = await managedContainerCount();
  const remainingVolumes = await managedVolumeCount();
  const finalIdempotency = idempotencyCount();
  assert(peak >= expectedPeak, `CONCURRENCY_E2E_PEAK_${peak}_EXPECTED_${expectedPeak}`);
  assert(capacity.status === 429 && capacity.payload && capacity.payload.error === 'SANDBOX_CAPACITY_EXCEEDED', `CONCURRENCY_E2E_CAPACITY_GATE_FAILED: ${capacity.status}`);
  assert(remainingContainers === 0, `CONCURRENCY_E2E_CONTAINER_LEAK_${remainingContainers}`);
  assert(remainingVolumes === 0, `CONCURRENCY_E2E_VOLUME_LEAK_${remainingVolumes}`);
  assert(finalIdempotency === baselineIdempotency, `CONCURRENCY_E2E_IDEMPOTENCY_LEAK_${baselineIdempotency}_${finalIdempotency}`);

  process.stdout.write(`${JSON.stringify({
    success: true,
    parallel,
    peakRuntimeContainers: peak,
    capacityHttp: capacity.status,
    capacityError: capacity.payload.error,
    remainingContainers,
    remainingVolumes,
    baselineContainers,
    baselineVolumes,
    baselineIdempotency,
    finalIdempotency,
  })}\n`);
}

main().catch(error => {
  process.stderr.write(`${String(error && error.stack || error)}\n`);
  process.exitCode = 1;
});
