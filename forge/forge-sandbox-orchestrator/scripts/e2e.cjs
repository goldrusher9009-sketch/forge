'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const baseUrl = String(process.env.FORGE_SANDBOX_ORCHESTRATOR_URL || 'http://127.0.0.1:3301').replace(/\/$/, '');
const secret = String(process.env.FORGE_SANDBOX_HMAC_SECRET || '');

if (!secret) {
  throw new Error('FORGE_SANDBOX_HMAC_SECRET is required');
}

const suffix = crypto.randomBytes(6).toString('hex');
const identity = {
  tenantId: 'tenant-e2e',
  userId: 'user-e2e',
  workspaceId: `workspace-${suffix}`,
  runId: `run-${suffix}`,
  attemptId: `attempt-${suffix}`,
  sandboxId: `sandbox-${suffix}`,
};

let toolSequence = 0;
let primaryProvisioned = false;
let recoveryProvisioned = false;
let recoverySandboxId = '';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sign(method, requestPath, timestamp, nonce, rawBody) {
  const canonical = [method.toUpperCase(), requestPath, timestamp, nonce, sha256(rawBody)].join('\n');
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

async function api(method, requestPath, body = {}, { allowError = false } = {}) {
  const rawBody = Buffer.from(JSON.stringify(body));
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(24).toString('base64url');
  const response = await fetch(`${baseUrl}${requestPath}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forge-timestamp': timestamp,
      'x-forge-nonce': nonce,
      'x-forge-signature': sign(method, requestPath, timestamp, nonce, rawBody),
    },
    body: rawBody,
  });
  const payload = await response.json();
  if (!response.ok && !allowError) {
    throw new Error(`${method} ${requestPath} failed (${response.status}): ${payload.error || JSON.stringify(payload)}`);
  }
  return { status: response.status, payload };
}

async function execute(toolName, args, overrides = {}) {
  toolSequence += 1;
  const toolCallId = `toolcall-${suffix}-${toolSequence}`;
  const idempotencyKey = `idempotency-${suffix}-${toolSequence}`;
  const body = {
    ...identity,
    toolCallId,
    idempotencyKey,
    toolName,
    args,
    timeoutMs: 150_000,
    ...overrides,
  };
  const response = await api('POST', '/v1/tools/execute', body);
  assert.equal(response.payload.success, true);
  assert.equal(response.payload.data.ok, true);
  return { body, result: response.payload.data };
}

function inspectContainer(name) {
  return JSON.parse(execFileSync('docker', ['inspect', name], { encoding: 'utf8' }))[0];
}

function assertContainerPolicy(name, role, expectedPidsLimit) {
  const inspected = inspectContainer(name);
  assert.equal(inspected.Config.User, '10001:10001', `${role} must run as the sandbox UID`);
  assert.equal(inspected.HostConfig.ReadonlyRootfs, true, `${role} root filesystem must be read-only`);
  assert.deepEqual(inspected.HostConfig.CapDrop, ['ALL'], `${role} must drop all capabilities`);
  assert.ok(inspected.HostConfig.SecurityOpt.includes('no-new-privileges:true'), `${role} must disable privilege escalation`);
  assert.equal(inspected.HostConfig.Memory, 805_306_368, `${role} memory limit mismatch`);
  assert.equal(inspected.HostConfig.MemorySwap, 805_306_368, `${role} swap limit mismatch`);
  assert.equal(inspected.HostConfig.NanoCpus, 1_000_000_000, `${role} CPU limit mismatch`);
  assert.equal(inspected.HostConfig.PidsLimit, expectedPidsLimit, `${role} PID limit mismatch`);
  assert.equal(inspected.HostConfig.PidMode, '', `${role} must not share host PID namespace`);
  assert.ok(inspected.Mounts.every(mount => mount.Type === 'volume'), `${role} must only receive managed volumes`);
  assert.ok(inspected.Mounts.every(mount => mount.Destination !== '/var/run/docker.sock'), `${role} must never receive the Docker socket`);
  return inspected;
}

async function destroy(sandboxId) {
  return api('DELETE', `/v1/sandboxes/${encodeURIComponent(sandboxId)}`, {});
}

async function main() {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  const healthBody = await health.json();
  assert.equal(healthBody.isolation, 'per-run-containers');

  const provisioned = await api('POST', '/v1/sandboxes/provision', { ...identity, maxWorkspaceBytes: 64 * 1024 * 1024 });
  assert.equal(provisioned.status, 201);
  assert.equal(provisioned.payload.data.state, 'ready');
  primaryProvisioned = true;

  const shellName = `forge-sbx-${identity.sandboxId.replace(/[^A-Za-z0-9]/g, '').slice(0, 40).toLowerCase()}`;
  const browserName = `forge-browser-${identity.sandboxId.replace(/[^A-Za-z0-9]/g, '').slice(0, 40).toLowerCase()}`;
  const shellInspect = assertContainerPolicy(shellName, 'shell', 128);
  const browserInspect = assertContainerPolicy(browserName, 'browser', 256);
  assert.equal(shellInspect.HostConfig.NetworkMode, 'none', 'shell must have no network');
  assert.equal(browserInspect.HostConfig.NetworkMode, 'forge-sandbox-internal', 'browser must use only the internal network');

  const binary = Buffer.from([0, 1, 2, 3, 254, 255]);
  const uploaded = await api('POST', '/v1/workspaces/files', {
    tenantId: identity.tenantId,
    userId: identity.userId,
    workspaceId: identity.workspaceId,
    runId: identity.runId,
    attemptId: identity.attemptId,
    path: 'inputs/upload.bin',
    contentBase64: binary.toString('base64'),
  });
  assert.equal(uploaded.payload.data.sha256, sha256(binary));

  const written = await execute('sandbox_file', {
    operation: 'write',
    path: 'work/report.md',
    content: '# Forge sandbox E2E\n\nPersistent workspace and artifact verification.\n',
  });
  assert.equal(written.result.data.path, 'work/report.md');
  const replayed = await api('POST', '/v1/tools/execute', written.body);
  assert.equal(replayed.payload.data.replayed, true, 'idempotent replay must be explicit');

  const read = await execute('sandbox_file', { operation: 'read', path: 'work/report.md' });
  assert.match(read.result.data.content, /Persistent workspace/);

  const shell = await execute('sandbox_shell', {
    command: "sha256sum inputs/upload.bin && printf 'shell-ok' > work/shell.txt",
    cwd: '.',
  });
  assert.equal(shell.result.data.exitCode, 0);
  assert.match(shell.result.data.stdout, new RegExp(sha256(binary)));

  const shellNetwork = await execute('sandbox_shell', {
    command: "node -e \"fetch('https://example.com').then(()=>process.exit(9)).catch(()=>process.exit(0))\"",
    cwd: '.',
    timeoutMs: 15_000,
  });
  assert.equal(shellNetwork.result.data.exitCode, 0, 'network-disabled shell unexpectedly reached the internet');

  const browser = await execute('sandbox_browser', {
    actions: [
      { action: 'navigate', url: 'https://example.com' },
      { action: 'extract', selector: 'body' },
      { action: 'screenshot', path: 'work/example.png' },
    ],
  });
  assert.equal(browser.result.data.results[0].status, 200);
  assert.match(browser.result.data.results[1].text, /Example Domain/i);

  toolSequence += 1;
  const privateAttempt = await api('POST', '/v1/tools/execute', {
    ...identity,
    toolCallId: `toolcall-${suffix}-${toolSequence}`,
    idempotencyKey: `idempotency-${suffix}-${toolSequence}`,
    toolName: 'sandbox_browser',
    args: { actions: [{ action: 'navigate', url: 'http://127.0.0.1' }] },
    timeoutMs: 30_000,
  }, { allowError: true });
  assert.notEqual(privateAttempt.status, 200, 'private browser target must be rejected');
  assert.match(String(privateAttempt.payload.error), /PRIVATE_IP_REJECTED|ERR_PROXY_CONNECTION_FAILED|ERR_CONNECTION_REFUSED/);

  const spreadsheet = await execute('sandbox_document', {
    operation: 'create_spreadsheet',
    path: 'work/evidence.xlsx',
    sheetName: 'Evidence',
    rows: [{ check: 'sandbox', status: 'passed' }, { check: 'artifact', status: 'pending' }],
  });
  assert.deepEqual(spreadsheet.result.data.sheets, ['Evidence']);
  const inspectedSpreadsheet = await execute('sandbox_document', { operation: 'inspect_spreadsheet', path: 'work/evidence.xlsx' });
  assert.equal(inspectedSpreadsheet.result.data.sheets[0].previewRows[0].status, 'passed');

  const rendered = await execute('sandbox_document', {
    operation: 'render_markdown_pdf',
    sourcePath: 'work/report.md',
    outputPath: 'work/report.pdf',
    title: 'Forge Sandbox E2E',
  });
  assert.ok(rendered.result.data.bytes > 1000, 'rendered PDF is unexpectedly small');

  const committed = await execute('sandbox_artifact', {
    operation: 'commit',
    path: 'work/report.pdf',
    title: 'Forge Sandbox E2E Report',
    mimeType: 'application/pdf',
  });
  assert.match(committed.result.data.artifactPath, new RegExp(`^${identity.runId}/${identity.attemptId}/report\\.pdf$`));

  const artifact = await api('POST', '/v1/artifacts/read', {
    tenantId: identity.tenantId,
    userId: identity.userId,
    workspaceId: identity.workspaceId,
    runId: identity.runId,
    attemptId: identity.attemptId,
    path: committed.result.data.artifactPath,
  });
  assert.equal(artifact.payload.data.sha256, committed.result.data.sha256);
  assert.equal(artifact.payload.data.bytes, committed.result.data.bytes);

  toolSequence += 1;
  const longTool = api('POST', '/v1/tools/execute', {
    ...identity,
    toolCallId: `toolcall-${suffix}-${toolSequence}`,
    idempotencyKey: `idempotency-${suffix}-${toolSequence}`,
    toolName: 'sandbox_shell',
    args: { command: 'sleep 120', timeoutMs: 120_000 },
    timeoutMs: 150_000,
  }, { allowError: true });
  await new Promise(resolve => setTimeout(resolve, 1_000));
  await destroy(identity.sandboxId);
  primaryProvisioned = false;
  const cancelled = await Promise.race([
    longTool,
    new Promise((_, reject) => setTimeout(() => reject(new Error('destroy did not terminate the active tool promptly')), 15_000)),
  ]);
  assert.notEqual(cancelled.status, 200, 'destroyed shell command must not complete successfully');

  assert.throws(() => inspectContainer(shellName), /No such object|No such container/i);
  assert.throws(() => inspectContainer(browserName), /No such object|No such container/i);

  const artifactAfterDestroy = await api('POST', '/v1/artifacts/read', {
    tenantId: identity.tenantId,
    userId: identity.userId,
    workspaceId: identity.workspaceId,
    runId: identity.runId,
    attemptId: identity.attemptId,
    path: committed.result.data.artifactPath,
  });
  assert.equal(artifactAfterDestroy.payload.data.sha256, committed.result.data.sha256, 'artifact must survive sandbox teardown');

  recoverySandboxId = `recovery-${suffix}`;
  const recoveryIdentity = {
    ...identity,
    runId: `recovery-run-${suffix}`,
    attemptId: `recovery-attempt-${suffix}`,
    sandboxId: recoverySandboxId,
  };
  const recovery = await api('POST', '/v1/sandboxes/provision', recoveryIdentity);
  assert.equal(recovery.payload.data.state, 'ready');
  recoveryProvisioned = true;
  const persisted = await execute('sandbox_file', { operation: 'read', path: 'work/report.md' }, recoveryIdentity);
  assert.match(persisted.result.data.content, /Persistent workspace/, 'workspace must survive sandbox teardown');
  await destroy(recoverySandboxId);
  recoveryProvisioned = false;

  process.stdout.write(JSON.stringify({
    passed: true,
    checks: [
      'orchestrator health and HMAC API',
      'per-run container policy',
      'binary workspace upload',
      'file and idempotent replay',
      'network-disabled shell',
      'proxied public browser and private-target rejection',
      'spreadsheet and Markdown-to-PDF document tools',
      'artifact integrity',
      'active tool cancellation through container destroy',
      'workspace and artifact persistence after teardown',
    ],
    workspaceId: identity.workspaceId,
    artifactPath: committed.result.data.artifactPath,
    artifactSha256: committed.result.data.sha256,
  }, null, 2) + '\n');
}

main().catch(async error => {
  if (primaryProvisioned) await destroy(identity.sandboxId).catch(() => {});
  if (recoveryProvisioned && recoverySandboxId) await destroy(recoverySandboxId).catch(() => {});
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
