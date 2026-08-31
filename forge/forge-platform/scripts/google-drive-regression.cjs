const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');

const appRoot = path.join(__dirname, '..');
const driveScope = 'https://www.googleapis.com/auth/drive.file';
const folderMime = 'application/vnd.google-apps.folder';
const clientId = 'forge-drive-regression.apps.googleusercontent.com';
const clientSecret = 'forge-drive-regression-client-secret';
const developerKey = 'AIzaForgeDriveRegressionOnly';
const appId = '864291765788';
const hmacSecret = 'forge-drive-regression-hmac-secret';
const inputFileId = 'input-file-123';
const inputResourceKey = 'input-resource-key';
const blockedFileId = 'blocked-file-123';
const blockedResourceKey = 'blocked-resource-key';
const outputFolderId = 'output-folder-123';
const outputResourceKey = 'folder-resource-key';
const inputContent = Buffer.from('Forge Google Drive regression input\n', 'utf8');
const blockedContent = Buffer.from('blocked executable extension', 'utf8');
const artifactContent = Buffer.from('Forge approved artifact write-back\n', 'utf8');
const artifactSha256 = crypto.createHash('sha256').update(artifactContent).digest('hex');

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

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  const content = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': String(content.length),
  });
  res.end(content);
}

function sendBytes(res, status, body, contentType = 'application/octet-stream') {
  res.writeHead(status, {
    'content-type': contentType,
    'content-length': String(body.length),
  });
  res.end(body);
}

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function closeServer(server) {
  if (!server?.listening) return;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}

async function waitForHealth(port, child, getLogs) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.fail(`Forge did not become healthy:\n${getLogs()}`);
}

async function api(baseUrl, requestPath, token, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.authorization = `Bearer ${token}`;
  if (options.body !== undefined && !headers['content-type']) headers['content-type'] = 'application/json';
  const response = await fetch(`${baseUrl}${requestPath}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, body };
}

function inputMetadata() {
  return {
    id: inputFileId,
    name: 'Verified Input.txt',
    mimeType: 'text/plain',
    parents: ['source-folder-123'],
    size: String(inputContent.length),
    md5Checksum: crypto.createHash('md5').update(inputContent).digest('hex'),
    modifiedTime: '2026-08-31T00:00:00.000Z',
    version: '7',
    webViewLink: `https://drive.google.test/open?id=${inputFileId}`,
    trashed: false,
    capabilities: { canDownload: true, canEdit: true },
  };
}

function blockedInputMetadata() {
  return {
    id: blockedFileId,
    name: 'Invoice.pdf.exe',
    mimeType: 'application/octet-stream',
    parents: ['source-folder-123'],
    size: String(blockedContent.length),
    md5Checksum: crypto.createHash('md5').update(blockedContent).digest('hex'),
    modifiedTime: '2026-08-31T00:01:00.000Z',
    version: '9',
    webViewLink: `https://drive.google.test/open?id=${blockedFileId}`,
    trashed: false,
    capabilities: { canDownload: true, canEdit: false },
  };
}

function outputFolderMetadata() {
  return {
    id: outputFolderId,
    name: 'Verified Output Folder',
    mimeType: folderMime,
    parents: ['drive-root-123'],
    modifiedTime: '2026-08-31T00:00:00.000Z',
    version: '3',
    webViewLink: `https://drive.google.test/drive/folders/${outputFolderId}`,
    trashed: false,
    capabilities: { canDownload: false, canEdit: true },
  };
}

function verifyOrchestratorSignature(req, rawBody) {
  const timestamp = String(req.headers['x-forge-timestamp'] || '');
  const nonce = String(req.headers['x-forge-nonce'] || '');
  const signature = String(req.headers['x-forge-signature'] || '');
  if (!/^\d{13}$/.test(timestamp) || !/^[A-Za-z0-9_-]{20,}$/.test(nonce) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const canonical = [req.method, req.url, timestamp, nonce, bodyHash].join('\n');
  const expected = crypto.createHmac('sha256', hmacSecret).update(canonical).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

test('Google Drive OAuth, verified selection, import, approved write-back, revocation, and ledger', { timeout: 240_000 }, async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-google-drive-regression-'));
  const dbPath = path.join(tempDir, 'forge.db');
  const googleState = {
    errors: [],
    codeExchange: null,
    refreshExchange: null,
    aboutTokens: [],
    metadataRequests: [],
    downloads: 0,
    uploads: [],
    revocations: [],
  };
  const orchestratorState = { errors: [], fileWrites: [], contentPolicyBlocks: [], artifactReads: [] };
  let child = null;

  const googleServer = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'POST' && requestUrl.pathname === '/oauth/token') {
        const rawBody = await readRequestBody(req);
        const form = new URLSearchParams(rawBody.toString('utf8'));
        const commonValid = form.get('client_id') === clientId && form.get('client_secret') === clientSecret;
        if (form.get('grant_type') === 'authorization_code') {
          googleState.codeExchange = {
            commonValid,
            codeValid: form.get('code') === 'regression-authorization-code',
            redirectValid: form.get('redirect_uri')?.endsWith('/api/google-drive/oauth/callback') === true,
            verifierPresent: /^[A-Za-z0-9_-]{40,}$/.test(form.get('code_verifier') || ''),
          };
          return sendJson(res, 200, {
            access_token: 'initial-regression-access-token',
            refresh_token: 'regression-refresh-token',
            expires_in: 1,
            token_type: 'Bearer',
            scope: driveScope,
          });
        }
        if (form.get('grant_type') === 'refresh_token') {
          googleState.refreshExchange = {
            commonValid,
            refreshTokenValid: form.get('refresh_token') === 'regression-refresh-token',
          };
          return sendJson(res, 200, {
            access_token: 'refreshed-regression-access-token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: driveScope,
          });
        }
        return sendJson(res, 400, { error: 'unsupported_grant_type' });
      }

      if (req.method === 'POST' && requestUrl.pathname === '/oauth/revoke') {
        googleState.revocations.push(requestUrl.searchParams.get('token'));
        return sendJson(res, 200, {});
      }

      if (req.method === 'GET' && requestUrl.pathname === '/drive/v3/about') {
        googleState.aboutTokens.push(req.headers.authorization || '');
        return sendJson(res, 200, { user: { emailAddress: 'drive-regression@example.test', displayName: 'Drive Regression User' } });
      }

      const fileMatch = requestUrl.pathname.match(/^\/drive\/v3\/files\/([^/]+)$/);
      if (req.method === 'GET' && fileMatch) {
        const driveFileId = decodeURIComponent(fileMatch[1]);
        const resourceHeader = String(req.headers['x-goog-drive-resource-keys'] || '');
        if (requestUrl.searchParams.get('alt') === 'media' && driveFileId === inputFileId) {
          googleState.downloads += 1;
          googleState.metadataRequests.push({ driveFileId, resourceHeader, media: true });
          return sendBytes(res, 200, inputContent, 'text/plain');
        }
        if (requestUrl.searchParams.get('alt') === 'media' && driveFileId === blockedFileId) {
          googleState.downloads += 1;
          googleState.metadataRequests.push({ driveFileId, resourceHeader, media: true });
          return sendBytes(res, 200, blockedContent);
        }
        googleState.metadataRequests.push({ driveFileId, resourceHeader, media: false });
        if (driveFileId === inputFileId) return sendJson(res, 200, inputMetadata());
        if (driveFileId === blockedFileId) return sendJson(res, 200, blockedInputMetadata());
        if (driveFileId === outputFolderId) return sendJson(res, 200, outputFolderMetadata());
        return sendJson(res, 404, { error: { message: 'file not found' } });
      }

      if (req.method === 'POST' && requestUrl.pathname === '/upload/drive/v3/files') {
        const rawBody = await readRequestBody(req);
        googleState.uploads.push({
          authorization: req.headers.authorization || '',
          resourceHeader: req.headers['x-goog-drive-resource-keys'] || '',
          contentType: req.headers['content-type'] || '',
          body: rawBody.toString('utf8'),
        });
        return sendJson(res, 200, {
          id: 'created-drive-file-123',
          name: 'final.txt',
          mimeType: 'text/plain',
          parents: [outputFolderId],
          size: String(artifactContent.length),
          modifiedTime: '2026-08-31T00:05:00.000Z',
          version: '8',
          webViewLink: 'https://drive.google.test/open?id=created-drive-file-123',
          trashed: false,
          capabilities: { canDownload: true, canEdit: true },
        });
      }

      return sendJson(res, 404, { error: 'google_mock_route_not_found' });
    } catch (error) {
      googleState.errors.push(error.message);
      return sendJson(res, 500, { error: 'google_mock_failure' });
    }
  });

  const orchestratorServer = http.createServer(async (req, res) => {
    try {
      const rawBody = await readRequestBody(req);
      if (!verifyOrchestratorSignature(req, rawBody)) return sendJson(res, 401, { success: false, error: 'INVALID_SIGNATURE' });
      const body = JSON.parse(rawBody.toString('utf8') || '{}');
      if (req.method === 'POST' && req.url === '/v1/workspaces/files') {
        const content = Buffer.from(String(body.contentBase64 || ''), 'base64');
        if (/\.exe$/i.test(String(body.path || ''))) {
          orchestratorState.contentPolicyBlocks.push({ body, content });
          return sendJson(res, 422, {
            success: false,
            error: 'SANDBOX_UPLOAD_CONTENT_BLOCKED_EXECUTABLE_OR_ACTIVE_CONTENT_EXTENSION',
          });
        }
        orchestratorState.fileWrites.push({ body, content });
        return sendJson(res, 201, {
          success: true,
          data: {
            path: body.path,
            bytes: content.length,
            sha256: crypto.createHash('sha256').update(content).digest('hex'),
          },
        });
      }
      if (req.method === 'POST' && req.url === '/v1/artifacts/read') {
        orchestratorState.artifactReads.push(body);
        return sendJson(res, 200, {
          success: true,
          data: {
            contentBase64: artifactContent.toString('base64'),
            bytes: artifactContent.length,
            sha256: artifactSha256,
          },
        });
      }
      return sendJson(res, 404, { success: false, error: 'ORCHESTRATOR_MOCK_ROUTE_NOT_FOUND' });
    } catch (error) {
      orchestratorState.errors.push(error.message);
      return sendJson(res, 500, { success: false, error: 'ORCHESTRATOR_MOCK_FAILURE' });
    }
  });

  const googlePort = await listen(googleServer);
  const orchestratorPort = await listen(orchestratorServer);
  const forgePort = await getFreePort();
  const googleBase = `http://127.0.0.1:${googlePort}`;
  const orchestratorBase = `http://127.0.0.1:${orchestratorPort}`;
  const forgeBase = `http://127.0.0.1:${forgePort}`;
  let logs = '';

  t.after(async () => {
    await stopChild(child);
    await Promise.all([closeServer(googleServer), closeServer(orchestratorServer)]);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  child = spawn(process.execPath, [path.join(appRoot, 'dist', 'index.js')], {
    cwd: appRoot,
    env: {
      ...process.env,
      DB_PATH: dbPath,
      PORT: String(forgePort),
      NODE_ENV: 'test',
      JWT_SECRET: 'forge-google-drive-regression-jwt-secret',
      CREDENTIAL_ENCRYPTION_KEY: '2f3990c8f81281cd493c6b3369dbd050575630c7c387bbaa449fc59126e1ab08',
      FRONTEND_URL: forgeBase,
      GOOGLE_DRIVE_CLIENT_ID: clientId,
      GOOGLE_DRIVE_CLIENT_SECRET: clientSecret,
      GOOGLE_DRIVE_REDIRECT_URI: `${forgeBase}/api/google-drive/oauth/callback`,
      GOOGLE_DRIVE_DEVELOPER_KEY: developerKey,
      GOOGLE_DRIVE_APP_ID: appId,
      GOOGLE_OAUTH_AUTHORIZE_URL: `${googleBase}/oauth/authorize`,
      GOOGLE_OAUTH_TOKEN_URL: `${googleBase}/oauth/token`,
      GOOGLE_OAUTH_REVOKE_URL: `${googleBase}/oauth/revoke`,
      GOOGLE_DRIVE_API_BASE_URL: googleBase,
      GOOGLE_DRIVE_UPLOAD_BASE_URL: googleBase,
      FORGE_SANDBOX_ORCHESTRATOR_URL: orchestratorBase,
      FORGE_SANDBOX_HMAC_SECRET: hmacSecret,
      ANTHROPIC_API_KEY: '',
      OPENAI_API_KEY: '',
      OPENROUTER_API_KEY: '',
      MORPH_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });

  await waitForHealth(forgePort, child, () => logs);

  const unauthenticated = await api(forgeBase, '/api/google-drive/config', null);
  assert.equal(unauthenticated.response.status, 401);

  const login = await api(forgeBase, '/api/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@forge.local', password: 'Admin1234!' }),
  });
  assert.equal(login.response.status, 200, logs);
  const token = login.body.accessToken;
  const userId = login.body.data.user.id;
  assert.ok(token);
  assert.ok(userId);

  const initialConfig = await api(forgeBase, '/api/google-drive/config', token);
  assert.equal(initialConfig.response.status, 200);
  assert.equal(initialConfig.body.configured, true);
  assert.equal(initialConfig.body.pickerConfigured, true);
  assert.equal(initialConfig.body.connected, false);
  assert.equal(initialConfig.body.picker.clientId, clientId);
  assert.equal(initialConfig.body.picker.developerKey, developerKey);
  assert.equal(initialConfig.body.picker.appId, appId);
  assert.equal(initialConfig.body.picker.scope, driveScope);
  assert.equal(JSON.stringify(initialConfig.body).includes(clientSecret), false);

  const oauthStart = await api(forgeBase, '/api/google-drive/oauth/start', token, {
    method: 'POST',
    body: JSON.stringify({ returnPath: '/settings/integrations' }),
  });
  assert.equal(oauthStart.response.status, 200);
  const authorizationUrl = new URL(oauthStart.body.authorizationUrl);
  assert.equal(authorizationUrl.origin, googleBase);
  assert.equal(authorizationUrl.pathname, '/oauth/authorize');
  assert.equal(authorizationUrl.searchParams.get('client_id'), clientId);
  assert.equal(authorizationUrl.searchParams.get('redirect_uri'), `${forgeBase}/api/google-drive/oauth/callback`);
  assert.equal(authorizationUrl.searchParams.get('scope'), driveScope);
  assert.equal(authorizationUrl.searchParams.get('access_type'), 'offline');
  assert.equal(authorizationUrl.searchParams.get('prompt'), 'consent');
  assert.equal(authorizationUrl.searchParams.get('code_challenge_method'), 'S256');
  assert.match(authorizationUrl.searchParams.get('code_challenge') || '', /^[A-Za-z0-9_-]{40,}$/);
  const oauthState = authorizationUrl.searchParams.get('state');
  assert.match(oauthState || '', /^[A-Za-z0-9_-]{40,}$/);

  const beforeCallbackDb = new Database(dbPath, { readonly: true });
  const storedState = beforeCallbackDb.prepare('SELECT state_hash,code_verifier_encrypted,consumed_at FROM google_drive_oauth_states WHERE user_id=?').get(userId);
  beforeCallbackDb.close();
  assert.equal(storedState.state_hash, crypto.createHash('sha256').update(oauthState).digest('hex'));
  assert.match(storedState.code_verifier_encrypted, /^v1:/);
  assert.equal(storedState.code_verifier_encrypted.includes(authorizationUrl.searchParams.get('code_challenge')), false);
  assert.equal(storedState.consumed_at, null);

  const callback = await fetch(`${forgeBase}/api/google-drive/oauth/callback?state=${encodeURIComponent(oauthState)}&code=regression-authorization-code`, {
    redirect: 'manual',
  });
  assert.equal(callback.status, 303);
  const callbackLocation = new URL(callback.headers.get('location'));
  assert.equal(callbackLocation.origin, forgeBase);
  assert.equal(callbackLocation.pathname, '/settings/integrations');
  assert.equal(callbackLocation.searchParams.get('googleDrive'), 'connected');
  assert.deepEqual(googleState.codeExchange, { commonValid: true, codeValid: true, redirectValid: true, verifierPresent: true });
  assert.deepEqual(googleState.aboutTokens, ['Bearer initial-regression-access-token']);

  const replay = await fetch(`${forgeBase}/api/google-drive/oauth/callback?state=${encodeURIComponent(oauthState)}&code=regression-authorization-code`, {
    redirect: 'manual',
  });
  assert.equal(replay.status, 400);
  assert.equal(await replay.text(), 'GOOGLE_DRIVE_OAUTH_STATE_INVALID');

  const connectedConfig = await api(forgeBase, '/api/google-drive/config', token);
  assert.equal(connectedConfig.response.status, 200);
  assert.equal(connectedConfig.body.connected, true);
  assert.equal(connectedConfig.body.reauthorizationRequired, false);
  assert.deepEqual(connectedConfig.body.account, {
    email: 'drive-regression@example.test',
    displayName: 'Drive Regression User',
  });

  const encryptedDb = new Database(dbPath, { readonly: true });
  const storedConnection = encryptedDb.prepare("SELECT credentials_encrypted FROM user_storage_configs WHERE user_id=? AND provider='gdrive'").get(userId);
  encryptedDb.close();
  assert.match(storedConnection.credentials_encrypted, /^v1:/);
  assert.equal(storedConnection.credentials_encrypted.includes('regression-refresh-token'), false);
  assert.equal(storedConnection.credentials_encrypted.includes('initial-regression-access-token'), false);

  const inputSelection = await api(forgeBase, '/api/google-drive/selections', token, {
    method: 'POST',
    body: JSON.stringify({ role: 'input', items: [{ id: inputFileId, name: 'Picker name must not be trusted', resourceKey: inputResourceKey }] }),
  });
  assert.equal(inputSelection.response.status, 201, JSON.stringify(inputSelection.body));
  assert.equal(inputSelection.body.data.length, 1);
  assert.equal(inputSelection.body.data[0].name, 'Verified Input.txt');
  assert.equal(inputSelection.body.data[0].driveFileId, inputFileId);
  assert.deepEqual(googleState.refreshExchange, { commonValid: true, refreshTokenValid: true });

  const folderSelection = await api(forgeBase, '/api/google-drive/selections', token, {
    method: 'POST',
    body: JSON.stringify({ role: 'output_folder', items: [{ id: outputFolderId, resourceKey: outputResourceKey }] }),
  });
  assert.equal(folderSelection.response.status, 201, JSON.stringify(folderSelection.body));
  assert.equal(folderSelection.body.data[0].name, 'Verified Output Folder');
  assert.equal(folderSelection.body.data[0].mimeType, folderMime);

  const workspace = await api(forgeBase, '/api/sandbox-workspaces', token, {
    method: 'POST',
    body: JSON.stringify({ name: 'Drive Regression Workspace' }),
  });
  assert.equal(workspace.response.status, 201);
  const workspaceId = workspace.body.data.id;

  const firstImport = await api(forgeBase, `/api/google-drive/selections/${inputSelection.body.data[0].id}/import`, token, {
    method: 'POST',
    body: JSON.stringify({ workspaceId }),
  });
  assert.equal(firstImport.response.status, 201, JSON.stringify(firstImport.body));
  assert.equal(firstImport.body.deduplicated, false);
  assert.equal(firstImport.body.data.status, 'completed');
  assert.equal(firstImport.body.data.bytes, inputContent.length);
  assert.equal(firstImport.body.data.sha256, crypto.createHash('sha256').update(inputContent).digest('hex'));
  assert.match(firstImport.body.data.workspace_path, /^google-drive\//);
  assert.equal(orchestratorState.fileWrites.length, 1);
  assert.deepEqual(orchestratorState.fileWrites[0].content, inputContent);
  assert.equal(googleState.downloads, 1);

  const duplicateImport = await api(forgeBase, `/api/google-drive/selections/${inputSelection.body.data[0].id}/import`, token, {
    method: 'POST',
    body: JSON.stringify({ workspaceId }),
  });
  assert.equal(duplicateImport.response.status, 200);
  assert.equal(duplicateImport.body.deduplicated, true);
  assert.equal(orchestratorState.fileWrites.length, 1);
  assert.equal(googleState.downloads, 1);

  const blockedSelection = await api(forgeBase, '/api/google-drive/selections', token, {
    method: 'POST',
    body: JSON.stringify({ role: 'input', items: [{ id: blockedFileId, name: 'Harmless name.txt', resourceKey: blockedResourceKey }] }),
  });
  assert.equal(blockedSelection.response.status, 201, JSON.stringify(blockedSelection.body));
  assert.equal(blockedSelection.body.data.length, 1);
  assert.equal(blockedSelection.body.data[0].name, 'Invoice.pdf.exe');
  assert.equal(blockedSelection.body.data[0].driveFileId, blockedFileId);

  const successfulWritesBeforeBlockedImport = orchestratorState.fileWrites.length;
  const blockedImport = await api(forgeBase, `/api/google-drive/selections/${blockedSelection.body.data[0].id}/import`, token, {
    method: 'POST',
    body: JSON.stringify({ workspaceId }),
  });
  assert.equal(blockedImport.response.status, 422, JSON.stringify(blockedImport.body));
  assert.equal(blockedImport.body.error, 'SANDBOX_UPLOAD_CONTENT_BLOCKED_EXECUTABLE_OR_ACTIVE_CONTENT_EXTENSION');
  assert.match(blockedImport.body.transferId, /^drivetransfer_/);
  assert.equal(orchestratorState.fileWrites.length, successfulWritesBeforeBlockedImport);
  assert.equal(orchestratorState.contentPolicyBlocks.length, 1);
  assert.match(orchestratorState.contentPolicyBlocks[0].body.path, /Invoice\.pdf\.exe$/);
  assert.deepEqual(orchestratorState.contentPolicyBlocks[0].content, blockedContent);
  assert.equal(googleState.downloads, 2);

  const blockedLedgerDb = new Database(dbPath, { readonly: true });
  const blockedTransfer = blockedLedgerDb.prepare('SELECT status,error,completed_at FROM google_drive_transfers WHERE id=?').get(blockedImport.body.transferId);
  blockedLedgerDb.close();
  assert.equal(blockedTransfer.status, 'failed');
  assert.equal(blockedTransfer.error, 'SANDBOX_UPLOAD_CONTENT_BLOCKED_EXECUTABLE_OR_ACTIVE_CONTENT_EXTENSION');
  assert.ok(blockedTransfer.completed_at);

  const writer = new Database(dbPath);
  const insertedRun = writer.prepare(`INSERT INTO agent_runs
    (user_id,name,prompt,result,status,execution_mode,tenant_id,workspace_id,run_key,sandbox_id,attempt_id,sandbox_state,completed_at)
    VALUES (?,?,?,?, 'completed','sandbox',?,?,?,?,?,'destroyed',datetime('now'))`)
    .run(userId, 'Drive write-back regression', 'Create an artifact', 'Artifact created', userId, workspaceId, 'run-drive-regression', 'sandbox-drive-regression', 'attempt-drive-regression');
  const runId = Number(insertedRun.lastInsertRowid);
  const artifactId = 'artifact-drive-regression';
  writer.prepare(`INSERT INTO sandbox_artifacts (id,run_id,user_id,workspace_id,path,title,mime_type,bytes,sha256)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(artifactId, runId, userId, workspaceId, 'artifacts/final.txt', 'final.txt', 'text/plain', artifactContent.length, artifactSha256);
  writer.close();

  const requestWriteback = await api(forgeBase, `/api/agent-runs/${runId}/artifacts/${artifactId}/google-drive/writebacks`, token, {
    method: 'POST',
    body: JSON.stringify({ targetSelectionId: folderSelection.body.data[0].id }),
  });
  assert.equal(requestWriteback.response.status, 202, JSON.stringify(requestWriteback.body));
  assert.equal(requestWriteback.body.data.status, 'pending');
  assert.equal(requestWriteback.body.data.action, 'create');
  assert.match(requestWriteback.body.data.request_summary, /No existing Drive file will be overwritten, moved, shared, or deleted/);
  assert.equal(googleState.uploads.length, 0);

  const duplicateWritebackRequest = await api(forgeBase, `/api/agent-runs/${runId}/artifacts/${artifactId}/google-drive/writebacks`, token, {
    method: 'POST',
    body: JSON.stringify({ targetSelectionId: folderSelection.body.data[0].id }),
  });
  assert.equal(duplicateWritebackRequest.response.status, 200);
  assert.equal(duplicateWritebackRequest.body.idempotent, true);
  assert.equal(duplicateWritebackRequest.body.data.id, requestWriteback.body.data.id);

  const approveWriteback = await api(forgeBase, `/api/google-drive/writebacks/${requestWriteback.body.data.id}/approve`, token, {
    method: 'POST',
    body: '{}',
  });
  assert.equal(approveWriteback.response.status, 200, JSON.stringify(approveWriteback.body));
  assert.equal(approveWriteback.body.data.status, 'completed');
  assert.equal(approveWriteback.body.data.drive_file_id, 'created-drive-file-123');
  assert.equal(orchestratorState.artifactReads.length, 1);
  assert.equal(googleState.uploads.length, 1);
  assert.equal(googleState.uploads[0].authorization, 'Bearer refreshed-regression-access-token');
  assert.equal(googleState.uploads[0].resourceHeader, `${outputFolderId}/${outputResourceKey}`);
  assert.match(googleState.uploads[0].contentType, /^multipart\/related; boundary=/);
  assert.match(googleState.uploads[0].body, /"name":"final.txt"/);
  assert.match(googleState.uploads[0].body, new RegExp(`"parents":\\["${outputFolderId}"\\]`));
  assert.match(googleState.uploads[0].body, /"forgeArtifactSha256":"[0-9a-f]{64}"/);
  assert.ok(googleState.uploads[0].body.includes(artifactContent.toString('utf8')));

  const duplicateApproval = await api(forgeBase, `/api/google-drive/writebacks/${requestWriteback.body.data.id}/approve`, token, {
    method: 'POST',
    body: '{}',
  });
  assert.equal(duplicateApproval.response.status, 200);
  assert.equal(duplicateApproval.body.idempotent, true);
  assert.equal(googleState.uploads.length, 1);

  const transfers = await api(forgeBase, `/api/google-drive/transfers?workspaceId=${encodeURIComponent(workspaceId)}`, token);
  assert.equal(transfers.response.status, 200);
  assert.equal(transfers.body.data.length, 4);
  assert.deepEqual(new Set(transfers.body.data.map(row => row.status)), new Set(['completed', 'deduplicated', 'failed']));
  assert.deepEqual(new Set(transfers.body.data.map(row => row.direction)), new Set(['import', 'writeback']));
  assert.equal(transfers.body.data.find(row => row.direction === 'writeback').sha256, artifactSha256);

  const writebacks = await api(forgeBase, `/api/google-drive/writebacks?runId=${runId}`, token);
  assert.equal(writebacks.response.status, 200);
  assert.equal(writebacks.body.data.length, 1);
  assert.equal(writebacks.body.data[0].status, 'completed');

  const registerOther = await api(forgeBase, '/api/auth/register', null, {
    method: 'POST',
    body: JSON.stringify({ email: 'other-drive-user@example.test', password: 'OtherDrive123!' }),
  });
  assert.equal(registerOther.response.status, 201);
  const loginOther = await api(forgeBase, '/api/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ email: 'other-drive-user@example.test', password: 'OtherDrive123!' }),
  });
  assert.equal(loginOther.response.status, 200);
  const otherTransfers = await api(forgeBase, '/api/google-drive/transfers', loginOther.body.accessToken);
  assert.equal(otherTransfers.response.status, 200);
  assert.deepEqual(otherTransfers.body.data, []);

  const disconnect = await api(forgeBase, '/api/google-drive/connection', token, { method: 'DELETE' });
  assert.equal(disconnect.response.status, 200);
  assert.equal(disconnect.body.revoked, true);
  assert.deepEqual(googleState.revocations, ['regression-refresh-token']);

  const disconnectedConfig = await api(forgeBase, '/api/google-drive/config', token);
  assert.equal(disconnectedConfig.response.status, 200);
  assert.equal(disconnectedConfig.body.configured, true);
  assert.equal(disconnectedConfig.body.pickerConfigured, true);
  assert.equal(disconnectedConfig.body.connected, false);
  const activeSelections = await api(forgeBase, '/api/google-drive/selections', token);
  assert.equal(activeSelections.response.status, 200);
  assert.deepEqual(activeSelections.body.data, []);
  const retainedTransfers = await api(forgeBase, '/api/google-drive/transfers', token);
  assert.equal(retainedTransfers.response.status, 200);
  assert.equal(retainedTransfers.body.data.length, 4);

  const finalDb = new Database(dbPath, { readonly: true });
  assert.equal(finalDb.prepare("SELECT COUNT(*) AS count FROM user_storage_configs WHERE user_id=? AND provider='gdrive'").get(userId).count, 0);
  assert.equal(finalDb.prepare('SELECT COUNT(*) AS count FROM google_drive_oauth_states WHERE user_id=?').get(userId).count, 0);
  assert.equal(finalDb.prepare("SELECT COUNT(*) AS count FROM google_drive_selections WHERE user_id=? AND status='revoked'").get(userId).count, 3);
  assert.equal(finalDb.prepare("SELECT COUNT(*) AS count FROM google_drive_writebacks WHERE user_id=? AND status='completed'").get(userId).count, 1);
  assert.equal(finalDb.prepare("SELECT COUNT(*) AS count FROM sandbox_events WHERE run_id=? AND type='drive_writeback_approval_required'").get(runId).count, 1);
  assert.equal(finalDb.prepare("SELECT COUNT(*) AS count FROM sandbox_events WHERE run_id=? AND type='drive_writeback_completed'").get(runId).count, 1);
  finalDb.close();

  assert.ok(googleState.metadataRequests.some(row => row.driveFileId === inputFileId && row.resourceHeader === `${inputFileId}/${inputResourceKey}`));
  assert.ok(googleState.metadataRequests.some(row => row.driveFileId === blockedFileId && row.resourceHeader === `${blockedFileId}/${blockedResourceKey}`));
  assert.ok(googleState.metadataRequests.some(row => row.driveFileId === outputFolderId && row.resourceHeader === `${outputFolderId}/${outputResourceKey}`));
  assert.deepEqual(googleState.errors, []);
  assert.deepEqual(orchestratorState.errors, []);
});
