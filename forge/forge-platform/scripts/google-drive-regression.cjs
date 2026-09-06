'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const Database = require('better-sqlite3');

const appRoot = path.join(__dirname, '..');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForHealth(port, child, logs) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline && child.exitCode === null) {
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.fail(`Forge did not become healthy:\n${logs()}`);
}

async function stop(child) {
  if (child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}

function verifyForgeSignature(secret, req, body) {
  const timestamp = String(req.headers['x-forge-timestamp'] || '');
  const nonce = String(req.headers['x-forge-nonce'] || '');
  const actual = String(req.headers['x-forge-signature'] || '');
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  const canonical = [req.method, req.url, timestamp, nonce, bodyHash].join('\n');
  const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

test('Google Drive OAuth, Picker selections, import, approved write-back, and revocation are evidence-bound', { timeout: 180_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-google-drive-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const forgePort = await freePort();
  const mockPort = await freePort();
  const mockBase = `http://127.0.0.1:${mockPort}`;
  const hmacSecret = 'google-drive-orchestrator-regression';
  const importedContent = Buffer.from('DOCX-E2E-CONTENT');
  const artifactContent = Buffer.from('%PDF-Forge-Google-Drive-E2E');
  const artifactSha256 = crypto.createHash('sha256').update(artifactContent).digest('hex');
  const calls = {
    token: [],
    metadata: [],
    imports: [],
    artifactReads: [],
    uploads: [],
    revokes: [],
  };

  const mock = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      const url = new URL(req.url, mockBase);
      const json = (status, value, headers = {}) => {
        res.writeHead(status, { 'content-type': 'application/json', ...headers });
        res.end(JSON.stringify(value));
      };
      if (url.pathname === '/token' && req.method === 'POST') {
        const form = new URLSearchParams(raw.toString('utf8'));
        calls.token.push(Object.fromEntries(form));
        if (form.get('grant_type') === 'authorization_code') {
          json(200, { access_token: 'access-initial-secret', refresh_token: 'refresh-secret', expires_in: 1, token_type: 'Bearer', scope: 'https://www.googleapis.com/auth/drive.file' });
        } else if (form.get('grant_type') === 'refresh_token' && form.get('refresh_token') === 'refresh-secret') {
          json(200, { access_token: 'access-refreshed-secret', expires_in: 3600, token_type: 'Bearer', scope: 'https://www.googleapis.com/auth/drive.file' });
        } else json(400, { error: 'invalid_grant' });
        return;
      }
      if (url.pathname === '/revoke' && req.method === 'POST') {
        calls.revokes.push(url.searchParams.get('token'));
        res.writeHead(200); res.end(); return;
      }
      if (url.pathname === '/drive/v3/about') {
        json(200, { user: { displayName: 'Forge Drive Tester', emailAddress: 'drive@example.test' } });
        return;
      }
      const fileMatch = url.pathname.match(/^\/drive\/v3\/files\/([^/]+)$/);
      if (fileMatch && !url.searchParams.has('alt')) {
        const id = decodeURIComponent(fileMatch[1]);
        calls.metadata.push({ id, resourceKeys: req.headers['x-goog-drive-resource-keys'] || null });
        if (id === 'gdoc-file-123') {
          json(200, { id, name: 'Quarterly Plan', mimeType: 'application/vnd.google-apps.document', parents: ['source-folder'], driveId: 'shared-drive-1', modifiedTime: '2026-08-26T00:00:00.000Z', version: '7', webViewLink: 'https://drive.example/gdoc', trashed: false, capabilities: { canDownload: true, canEdit: true } });
        } else if (id === 'folder-file-123') {
          json(200, { id, name: 'Forge Outputs', mimeType: 'application/vnd.google-apps.folder', parents: ['root'], driveId: 'shared-drive-1', modifiedTime: '2026-08-26T00:00:00.000Z', version: '3', webViewLink: 'https://drive.example/folder', trashed: false, capabilities: { canDownload: false, canEdit: true } });
        } else json(404, { error: { message: 'not found' } });
        return;
      }
      if (url.pathname === '/drive/v3/files/gdoc-file-123/export') {
        assert.equal(url.searchParams.get('mimeType'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.writeHead(200, { 'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        res.end(importedContent);
        return;
      }
      if (url.pathname === '/upload/drive/v3/files' && req.method === 'POST') {
        calls.uploads.push({ contentType: req.headers['content-type'], body: raw, resourceKeys: req.headers['x-goog-drive-resource-keys'] || null });
        json(200, { id: 'created-drive-789', name: 'Forge Result.pdf', mimeType: 'application/pdf', parents: ['folder-file-123'], driveId: 'shared-drive-1', size: String(artifactContent.length), md5Checksum: 'mock-md5', modifiedTime: '2026-08-26T01:00:00.000Z', version: '8', webViewLink: 'https://drive.example/created', trashed: false, capabilities: { canDownload: true, canEdit: true } });
        return;
      }
      if (url.pathname === '/v1/workspaces/files' && req.method === 'POST') {
        assert.equal(verifyForgeSignature(hmacSecret, req, raw), true);
        const body = JSON.parse(raw.toString('utf8'));
        const content = Buffer.from(body.contentBase64, 'base64');
        calls.imports.push({ body, content });
        json(201, { success: true, data: { path: body.path, bytes: content.length, sha256: crypto.createHash('sha256').update(content).digest('hex') } });
        return;
      }
      if (url.pathname === '/v1/artifacts/read' && req.method === 'POST') {
        assert.equal(verifyForgeSignature(hmacSecret, req, raw), true);
        calls.artifactReads.push(JSON.parse(raw.toString('utf8')));
        json(200, { success: true, data: { path: 'run-google/attempt-google/result.pdf', bytes: artifactContent.length, sha256: artifactSha256, contentBase64: artifactContent.toString('base64') } });
        return;
      }
      json(404, { error: 'mock route not found', path: url.pathname });
    });
  });
  await new Promise(resolve => mock.listen(mockPort, '127.0.0.1', resolve));

  let logs = '';
  const child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(forgePort),
      NODE_ENV: 'test',
      JWT_SECRET: 'google-drive-regression-jwt',
      FRONTEND_URL: `http://127.0.0.1:${forgePort}`,
      MORPH_API_KEY: '',
      GOOGLE_DRIVE_CLIENT_ID: 'google-client-id.apps.test',
      GOOGLE_DRIVE_CLIENT_SECRET: 'google-client-secret',
      GOOGLE_DRIVE_REDIRECT_URI: `http://127.0.0.1:${forgePort}/api/google-drive/oauth/callback`,
      GOOGLE_DRIVE_DEVELOPER_KEY: 'picker-developer-key',
      GOOGLE_DRIVE_APP_ID: '123456789',
      GOOGLE_OAUTH_AUTHORIZE_URL: `${mockBase}/auth`,
      GOOGLE_OAUTH_TOKEN_URL: `${mockBase}/token`,
      GOOGLE_OAUTH_REVOKE_URL: `${mockBase}/revoke`,
      GOOGLE_DRIVE_API_BASE_URL: mockBase,
      GOOGLE_DRIVE_UPLOAD_BASE_URL: mockBase,
      FORGE_SANDBOX_ORCHESTRATOR_URL: mockBase,
      FORGE_SANDBOX_HMAC_SECRET: hmacSecret,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  t.after(async () => {
    await stop(child);
    await new Promise(resolve => mock.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  await waitForHealth(forgePort, child, () => logs);

  const login = await fetch(`http://127.0.0.1:${forgePort}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@forge.local', password: 'Admin1234!' }),
  });
  assert.equal(login.status, 200, logs);
  const auth = await login.json();
  const userId = String(auth.data.user.id);
  const headers = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  const initialConfig = await (await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/config`, { headers })).json();
  assert.equal(initialConfig.configured, true);
  assert.equal(initialConfig.pickerConfigured, true);
  assert.equal(initialConfig.connected, false);

  const manualToken = await fetch(`http://127.0.0.1:${forgePort}/api/user/storage`, {
    method: 'POST', headers, body: JSON.stringify({ provider: 'gdrive', credentials: { accessToken: 'must-not-be-accepted' } }),
  });
  assert.equal(manualToken.status, 400);
  assert.equal((await manualToken.json()).error, 'GOOGLE_DRIVE_OAUTH_REQUIRED');

  const oauthStart = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/oauth/start`, {
    method: 'POST', headers, body: JSON.stringify({ returnPath: '/?tab=agent-runs' }),
  });
  assert.equal(oauthStart.status, 200, await oauthStart.clone().text());
  const oauthBody = await oauthStart.json();
  const authorizationUrl = new URL(oauthBody.authorizationUrl);
  assert.equal(authorizationUrl.origin, mockBase);
  assert.equal(authorizationUrl.searchParams.get('scope'), 'https://www.googleapis.com/auth/drive.file');
  assert.equal(authorizationUrl.searchParams.get('access_type'), 'offline');
  assert.equal(authorizationUrl.searchParams.get('prompt'), 'consent');
  assert.equal(authorizationUrl.searchParams.get('code_challenge_method'), 'S256');
  const stateValue = authorizationUrl.searchParams.get('state');
  const expectedChallenge = authorizationUrl.searchParams.get('code_challenge');
  const callback = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/oauth/callback?state=${encodeURIComponent(stateValue)}&code=oauth-code`, { redirect: 'manual' });
  assert.equal(callback.status, 303);
  assert.match(callback.headers.get('location'), /googleDrive=connected/);
  assert.equal(calls.token.length, 1);
  assert.equal(crypto.createHash('sha256').update(calls.token[0].code_verifier).digest('base64url'), expectedChallenge);

  const replay = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/oauth/callback?state=${encodeURIComponent(stateValue)}&code=oauth-code`, { redirect: 'manual' });
  assert.equal(replay.status, 400);

  const connectedConfig = await (await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/config`, { headers })).json();
  assert.equal(connectedConfig.connected, true);
  assert.deepEqual(connectedConfig.account, { email: 'drive@example.test', displayName: 'Forge Drive Tester' });
  assert.equal(JSON.stringify(connectedConfig).includes('access-initial-secret'), false);
  assert.equal(JSON.stringify(connectedConfig).includes('refresh-secret'), false);

  const workspaceResponse = await fetch(`http://127.0.0.1:${forgePort}/api/sandbox-workspaces`, {
    method: 'POST', headers, body: JSON.stringify({ name: 'Drive E2E Workspace' }),
  });
  assert.equal(workspaceResponse.status, 201);
  const workspace = (await workspaceResponse.json()).data;

  const inputSelectionResponse = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/selections`, {
    method: 'POST', headers, body: JSON.stringify({ role: 'input', items: [{ id: 'gdoc-file-123', resourceKey: 'resource-key-123' }] }),
  });
  assert.equal(inputSelectionResponse.status, 201, await inputSelectionResponse.clone().text());
  const inputSelection = (await inputSelectionResponse.json()).data[0];
  assert.equal(inputSelection.mimeType, 'application/vnd.google-apps.document');
  assert.equal(calls.token.length, 2, 'expired access token must refresh inside Forge');

  const folderSelectionResponse = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/selections`, {
    method: 'POST', headers, body: JSON.stringify({ role: 'output_folder', items: [{ id: 'folder-file-123', resourceKey: 'folder-resource-key' }] }),
  });
  assert.equal(folderSelectionResponse.status, 201, await folderSelectionResponse.clone().text());
  const folderSelection = (await folderSelectionResponse.json()).data[0];
  assert.equal(folderSelection.mimeType, 'application/vnd.google-apps.folder');

  const imported = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/selections/${inputSelection.id}/import`, {
    method: 'POST', headers, body: JSON.stringify({ workspaceId: workspace.id }),
  });
  assert.equal(imported.status, 201, await imported.clone().text());
  const importedBody = await imported.json();
  assert.equal(importedBody.deduplicated, false);
  assert.equal(calls.imports.length, 1);
  assert.deepEqual(calls.imports[0].content, importedContent);
  assert.match(calls.imports[0].body.path, /^google-drive\/drivesel_[a-f0-9]+\/7-Quarterly Plan\.docx$/);
  assert.equal(Object.values(calls.imports[0].body).includes('access-refreshed-secret'), false);

  const duplicateImport = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/selections/${inputSelection.id}/import`, {
    method: 'POST', headers, body: JSON.stringify({ workspaceId: workspace.id }),
  });
  assert.equal(duplicateImport.status, 200);
  assert.equal((await duplicateImport.json()).deduplicated, true);
  assert.equal(calls.imports.length, 1);

  const db = new Database(dbPath);
  const runInsert = db.prepare(`INSERT INTO agent_runs (user_id,name,prompt,result,status,model,provider,execution_mode,tenant_id,workspace_id,run_key,sandbox_id,attempt_id,idempotency_key,agent_version_id,sandbox_state,result_hash,approval_status)
    VALUES (?,?,?,?, 'completed','morph-regression','morph','sandbox',?,?,?,?,?,?,?,'destroyed',?,'not_required')`).run(
      userId, 'Drive Write-back Run', 'Create a result', 'Done', userId, workspace.id, 'run-google', 'sandbox-google', 'attempt-google', 'idempotency-google', 'agent-version-google', crypto.createHash('sha256').update('Done').digest('hex'),
    );
  const runId = Number(runInsert.lastInsertRowid);
  db.prepare(`INSERT INTO sandbox_artifacts (id,run_id,user_id,workspace_id,path,title,mime_type,bytes,sha256) VALUES ('artifact-google',?,?,?,?,?,?,?,?)`)
    .run(runId, userId, workspace.id, 'run-google/attempt-google/result.pdf', 'Forge Result.pdf', 'application/pdf', artifactContent.length, artifactSha256);
  db.close();

  const requestWriteback = await fetch(`http://127.0.0.1:${forgePort}/api/agent-runs/${runId}/artifacts/artifact-google/google-drive/writebacks`, {
    method: 'POST', headers, body: JSON.stringify({ targetSelectionId: folderSelection.id }),
  });
  assert.equal(requestWriteback.status, 202, await requestWriteback.clone().text());
  const writeback = (await requestWriteback.json()).data;
  assert.equal(writeback.status, 'pending');
  assert.match(writeback.request_summary, /No existing Drive file will be overwritten/);
  assert.equal(calls.uploads.length, 0, 'requesting approval must not write to Drive');

  const approve = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/writebacks/${writeback.id}/approve`, { method: 'POST', headers, body: '{}' });
  assert.equal(approve.status, 200, await approve.clone().text());
  const approved = await approve.json();
  assert.equal(approved.data.status, 'completed');
  assert.equal(approved.data.drive_file_id, 'created-drive-789');
  assert.equal(calls.artifactReads.length, 1);
  assert.equal(calls.uploads.length, 1);
  assert.match(calls.uploads[0].contentType, /^multipart\/related/);
  assert.ok(calls.uploads[0].body.includes(artifactContent));
  assert.equal(calls.uploads[0].resourceKeys, 'folder-file-123/folder-resource-key');

  const approveReplay = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/writebacks/${writeback.id}/approve`, { method: 'POST', headers, body: '{}' });
  assert.equal(approveReplay.status, 200);
  assert.equal((await approveReplay.json()).idempotent, true);
  assert.equal(calls.uploads.length, 1);

  const transfersResponse = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/transfers?workspaceId=${encodeURIComponent(workspace.id)}`, { headers });
  assert.equal(transfersResponse.status, 200, await transfersResponse.clone().text());
  const transfersBody = await transfersResponse.json();
  assert.equal(transfersBody.success, true);
  assert.equal(transfersBody.data.length, 3);
  assert.deepEqual(new Set(transfersBody.data.map(row => row.direction)), new Set(['import', 'writeback']));
  assert.equal(transfersBody.data.every(row => row.workspace_id === workspace.id), true);
  assert.deepEqual(new Set(transfersBody.data.map(row => row.status)), new Set(['completed', 'deduplicated']));
  assert.equal(transfersBody.data.some(row => row.direction === 'import' && row.status === 'completed' && row.workspace_path && row.sha256), true);
  assert.equal(transfersBody.data.some(row => row.direction === 'import' && row.status === 'deduplicated' && row.workspace_path && row.sha256), true);
  assert.equal(transfersBody.data.some(row => row.direction === 'writeback' && row.drive_file_id === 'created-drive-789' && row.sha256 === artifactSha256), true);
  const transferEvidence = JSON.stringify(transfersBody);
  assert.doesNotMatch(transferEvidence, /access-initial-secret|access-refreshed-secret|refresh-secret|google-client-secret|picker-developer-key/);
  for (const row of transfersBody.data) {
    assert.deepEqual(Object.keys(row).sort(), [
      'artifact_id', 'bytes', 'completed_at', 'created_at', 'direction', 'drive_file_id',
      'drive_modified_time', 'drive_version', 'error', 'id', 'mime_type', 'run_id',
      'selection_id', 'sha256', 'status', 'target_folder_id', 'workspace_id', 'workspace_path',
    ].sort());
  }

  const importTransfers = await (await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/transfers?direction=import`, { headers })).json();
  assert.equal(importTransfers.data.length, 2);
  assert.equal(importTransfers.data.every(row => row.direction === 'import'), true);
  assert.deepEqual(new Set(importTransfers.data.map(row => row.status)), new Set(['completed', 'deduplicated']));
  const invalidTransferDirection = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/transfers?direction=delete`, { headers });
  assert.equal(invalidTransferDirection.status, 400);
  assert.equal((await invalidTransferDirection.json()).error, 'GOOGLE_DRIVE_TRANSFER_DIRECTION_INVALID');

  const disconnect = await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/connection`, { method: 'DELETE', headers });
  assert.equal(disconnect.status, 200);
  assert.equal((await disconnect.json()).revoked, true);
  assert.deepEqual(calls.revokes, ['refresh-secret']);
  const disconnectedConfig = await (await fetch(`http://127.0.0.1:${forgePort}/api/google-drive/config`, { headers })).json();
  assert.equal(disconnectedConfig.connected, false);

  const audit = new Database(dbPath, { readonly: true });
  assert.equal(audit.prepare("SELECT COUNT(*) AS count FROM user_storage_configs WHERE user_id=? AND provider='gdrive'").get(userId).count, 0);
  assert.equal(audit.prepare("SELECT COUNT(*) AS count FROM google_drive_selections WHERE user_id=? AND status='revoked'").get(userId).count, 2);
  assert.equal(audit.prepare("SELECT COUNT(*) AS count FROM google_drive_transfers WHERE user_id=? AND direction='import' AND status='completed'").get(userId).count, 1);
  assert.equal(audit.prepare("SELECT COUNT(*) AS count FROM google_drive_transfers WHERE user_id=? AND direction='writeback' AND status='completed'").get(userId).count, 1);
  assert.equal(audit.prepare("SELECT COUNT(*) AS count FROM sandbox_events WHERE run_id=? AND type='drive_writeback_completed'").get(runId).count, 1);
  audit.close();

  assert.doesNotMatch(logs, /access-initial-secret|access-refreshed-secret|refresh-secret|google-client-secret|picker-developer-key/);
});
