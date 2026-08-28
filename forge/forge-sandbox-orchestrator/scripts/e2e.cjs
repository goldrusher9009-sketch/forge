'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const packagedDockerApi = path.resolve(__dirname, '../src/docker-api.js');
const { DockerApi } = require(fs.existsSync(packagedDockerApi) ? packagedDockerApi : path.resolve(process.cwd(), 'src/docker-api.js'));

const baseUrl = String(process.env.FORGE_SANDBOX_ORCHESTRATOR_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const secret = String(process.env.FORGE_SANDBOX_HMAC_SECRET || '');
const holdAfterProvisionMs = Math.max(0, Math.min(Number(process.env.FORGE_E2E_HOLD_AFTER_PROVISION_MS) || 0, 120_000));
const retainData = process.env.FORGE_E2E_RETAIN_DATA === '1';
const dataDir = path.resolve(process.env.FORGE_SANDBOX_DATA_DIR || '/var/lib/forge-sandbox');
const docker = new DockerApi(process.env.DOCKER_SOCKET || '/var/run/docker.sock');
const idempotencyKeys = new Set();

if (!secret) throw new Error('FORGE_SANDBOX_HMAC_SECRET_REQUIRED');

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

async function request(method, requestPath, body, expectedStatus) {
  const rawBody = body === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(body));
  const response = await fetch(`${baseUrl}${requestPath}`, {
    method,
    headers: signedHeaders(method, requestPath, rawBody),
    body: rawBody.length ? rawBody : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status !== expectedStatus) {
    throw new Error(`E2E_HTTP_${response.status}_EXPECTED_${expectedStatus}: ${String(payload.error || 'unknown').slice(0, 500)}`);
  }
  return payload;
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

function identity(seed, overrides = {}) {
  return {
    tenantId: `tenant_${seed}`,
    userId: `user_${seed}`,
    workspaceId: `workspace_${seed}`,
    runId: `run_${seed}`,
    attemptId: `attempt_${seed}`,
    sandboxId: `sandbox_${seed}`,
    ...overrides,
  };
}

async function execute(ids, seed, suffix, toolName, args) {
  const idempotencyKey = `idem_${seed}_${suffix}`;
  idempotencyKeys.add(idempotencyKey);
  const response = await request('POST', '/v1/tools/execute', {
    ...ids,
    toolCallId: `tool_${seed}_${suffix}`,
    idempotencyKey,
    toolName,
    args,
  }, 200);
  assert(response.success === true && response.data && response.data.ok === true, `E2E_${suffix.toUpperCase()}_FAILED`);
  return response.data.data;
}

async function expectBlockedBrowser(ids, seed, suffix, url) {
  const idempotencyKey = `idem_${seed}_${suffix}`;
  idempotencyKeys.add(idempotencyKey);
  const response = await request('POST', '/v1/tools/execute', {
    ...ids,
    toolCallId: `tool_${seed}_${suffix}`,
    idempotencyKey,
    toolName: 'sandbox_browser',
    args: { actions: [{ action: 'navigate', url }] },
  }, 400);
  const error = String(response.error || '');
  assert(response.success === false, `E2E_${suffix.toUpperCase()}_UNEXPECTED_SUCCESS`);
  assert(
    /SANDBOX_EGRESS|PRIVATE_IP|HOST_REJECTED|ERR_TUNNEL_CONNECTION_FAILED|ERR_FAILED/i.test(error),
    `E2E_${suffix.toUpperCase()}_WRONG_ERROR: ${error.slice(0, 300)}`,
  );
  return error.replace(/\s+/g, ' ').slice(0, 160);
}

async function destroy(sandboxId) {
  return request('DELETE', `/v1/sandboxes/${encodeURIComponent(sandboxId)}`, undefined, 200);
}

function volumeNames(userId, workspaceId) {
  const key = sha256(`${userId}:${workspaceId}`).slice(0, 32);
  return [`forge-ws-${key}`, `forge-artifacts-${key}`];
}

async function cleanupTestData(ids) {
  for (const name of volumeNames(ids.userId, ids.workspaceId)) {
    const inspected = await docker.inspectVolume(name, true);
    if (inspected.statusCode === 404) continue;
    const labels = inspected.data && inspected.data.Labels || {};
    assert(labels['com.forge.managed'] === 'sandbox-volume-v1', `E2E_CLEANUP_VOLUME_NOT_MANAGED: ${name}`);
    assert(labels['com.forge.user.id'] === ids.userId, `E2E_CLEANUP_VOLUME_USER_MISMATCH: ${name}`);
    assert(labels['com.forge.workspace.id'] === ids.workspaceId, `E2E_CLEANUP_VOLUME_WORKSPACE_MISMATCH: ${name}`);
    await docker.request('DELETE', `/volumes/${encodeURIComponent(name)}`, null, { allow404: true });
  }
  for (const key of idempotencyKeys) {
    const file = path.join(dataDir, 'idempotency', `${sha256(key)}.json`);
    await fs.promises.unlink(file).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function main() {
  const seed = `${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
  const first = identity(seed);
  const second = identity(seed, {
    runId: `run2_${seed}`,
    attemptId: `attempt2_${seed}`,
    sandboxId: `sandbox2_${seed}`,
  });
  const liveSandboxes = new Set();
  const sourceContent = `forge-e2e-source:${seed}\n`;
  const resultContent = `forge-e2e-result:${seed}\n`;
  const sourceSha256 = sha256(sourceContent);
  const resultSha256 = sha256(resultContent);
  let artifactPath = '';
  let completion;

  try {
    const provisioned = await request('POST', '/v1/sandboxes/provision', first, 201);
    assert(provisioned.data && provisioned.data.state === 'ready', 'E2E_FIRST_SANDBOX_NOT_READY');
    liveSandboxes.add(first.sandboxId);
    process.stdout.write(`${JSON.stringify({ phase: 'provisioned', sandboxId: first.sandboxId, runId: first.runId })}\n`);

    if (holdAfterProvisionMs) await new Promise(resolve => setTimeout(resolve, holdAfterProvisionMs));

    const uploaded = await request('POST', '/v1/workspaces/files', {
      ...first,
      path: 'input/source.txt',
      contentBase64: Buffer.from(sourceContent).toString('base64'),
    }, 201);
    assert(uploaded.data && uploaded.data.sha256 === sourceSha256, 'E2E_WORKSPACE_UPLOAD_INTEGRITY_FAILED');

    const written = await execute(first, seed, 'write', 'sandbox_file', {
      operation: 'write', path: 'output/result.txt', content: resultContent,
    });
    assert(written.sha256 === resultSha256, 'E2E_WORKSPACE_WRITE_INTEGRITY_FAILED');

    const shell = await execute(first, seed, 'shell', 'sandbox_shell', {
      command: 'sha256sum input/source.txt output/result.txt',
    });
    assert(
      shell.exitCode === 0 && String(shell.stdout).includes(sourceSha256) && String(shell.stdout).includes(resultSha256),
      `E2E_SHELL_EXECUTION_FAILED: ${JSON.stringify({ exitCode: shell.exitCode, stdout: shell.stdout, stderr: shell.stderr })}`,
    );

    const publicBrowser = await execute(first, seed, 'browser_public', 'sandbox_browser', {
      actions: [
        { action: 'navigate', url: 'https://example.com/' },
        { action: 'extract', selector: 'h1' },
      ],
    });
    assert(publicBrowser.results && publicBrowser.results[0].status === 200, 'E2E_PUBLIC_EGRESS_FAILED');
    assert(String(publicBrowser.results[1].text).includes('Example Domain'), 'E2E_PUBLIC_BROWSER_CONTENT_FAILED');

    const metadataBlock = await expectBlockedBrowser(first, seed, 'browser_metadata', 'http://169.254.169.254/latest/meta-data/');
    const privateBlock = await expectBlockedBrowser(first, seed, 'browser_private', 'http://10.0.0.1/');

    const artifact = await execute(first, seed, 'artifact', 'sandbox_artifact', {
      operation: 'commit', path: 'output/result.txt', title: 'Forge E2E result', mimeType: 'text/plain',
    });
    artifactPath = artifact.artifactPath;
    assert(artifact.sha256 === resultSha256 && artifact.bytes === Buffer.byteLength(resultContent), 'E2E_ARTIFACT_COMMIT_INTEGRITY_FAILED');

    await destroy(first.sandboxId);
    liveSandboxes.delete(first.sandboxId);

    const readAfterDestroy = await request('POST', '/v1/artifacts/read', {
      ...first, path: artifactPath,
    }, 200);
    assert(readAfterDestroy.data && readAfterDestroy.data.sha256 === resultSha256, 'E2E_ARTIFACT_PERSISTENCE_FAILED');
    assert(Buffer.from(readAfterDestroy.data.contentBase64, 'base64').toString('utf8') === resultContent, 'E2E_ARTIFACT_CONTENT_FAILED');

    const reprovisioned = await request('POST', '/v1/sandboxes/provision', second, 201);
    assert(reprovisioned.data && reprovisioned.data.state === 'ready', 'E2E_SECOND_SANDBOX_NOT_READY');
    liveSandboxes.add(second.sandboxId);

    const persistedSource = await execute(second, seed, 'persisted_source', 'sandbox_file', {
      operation: 'read', path: 'input/source.txt',
    });
    const persistedResult = await execute(second, seed, 'persisted_result', 'sandbox_file', {
      operation: 'read', path: 'output/result.txt',
    });
    assert(persistedSource.content === sourceContent, 'E2E_WORKSPACE_SOURCE_PERSISTENCE_FAILED');
    assert(persistedResult.content === resultContent, 'E2E_WORKSPACE_RESULT_PERSISTENCE_FAILED');

    await destroy(second.sandboxId);
    liveSandboxes.delete(second.sandboxId);

    completion = {
      phase: 'complete',
      success: true,
      firstSandboxId: first.sandboxId,
      secondSandboxId: second.sandboxId,
      workspaceId: first.workspaceId,
      artifactPath,
      artifactSha256: resultSha256,
      publicEgressStatus: publicBrowser.results[0].status,
      metadataBlock,
      privateBlock,
      retainedData: retainData,
    };
  } finally {
    for (const sandboxId of liveSandboxes) await destroy(sandboxId).catch(() => {});
    if (!retainData) await cleanupTestData(first);
  }
  process.stdout.write(`${JSON.stringify(completion)}\n`);
}

main().catch(error => {
  process.stderr.write(`${String(error && error.stack || error)}\n`);
  process.exitCode = 1;
});
