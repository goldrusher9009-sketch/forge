'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const NODE_IMAGE = 'docker.m.daocloud.io/library/node:20-bullseye-slim@sha256:65ef49f7d24aefd012a7fc6f9a2b734bcc19e424976a81f60c86b47266ef5b28';
const CADDY_IMAGE = 'docker.m.daocloud.io/library/caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d';
const caddyfile = path.resolve(__dirname, '..', 'forge-control-plane-tunnel.Caddyfile');
const suffix = `${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
const network = `forge-tunnel-regression-${suffix}`;
const backend = `forge-tunnel-regression-backend-${suffix}`;
const gateway = `forge-tunnel-regression-gateway-${suffix}`;
const client = `forge-tunnel-regression-client-${suffix}`;
const secret = `regression-${crypto.randomBytes(32).toString('hex')}`;

function run(args, options = {}) {
  const { allowFailure = false, ...spawnOptions } = options;
  const result = spawnSync(args[0], args.slice(1), {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    ...spawnOptions,
  });
  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) {
    throw new Error([
      `COMMAND_FAILED: ${args.slice(0, 3).join(' ')}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return result;
}

function docker(...args) {
  return run(['docker', ...args]);
}

function removeResources() {
  run(['docker', 'rm', '-f', client, gateway, backend], { allowFailure: true });
  run(['docker', 'network', 'rm', network], { allowFailure: true });
}

function waitForGateway() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const inspected = run([
      'docker', 'inspect', gateway,
      '--format', '{{.State.Status}}',
    ], { allowFailure: true });
    if (inspected.status === 0 && inspected.stdout.trim() === 'running') return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }
  const logs = run(['docker', 'logs', gateway], { allowFailure: true });
  throw new Error(`GATEWAY_NOT_RUNNING\n${logs.stdout}\n${logs.stderr}`);
}

const backendProgram = `
  require('node:http').createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      ok: true,
      path: req.url,
      gatewayHeaderPresent: Boolean(req.headers['x-forge-gateway-secret']),
    }));
  }).listen(3000, '0.0.0.0');
`;

const clientProgram = `
  const base = 'http://forge-control-plane-gateway:8080';
  const secret = process.env.GATEWAY_SECRET;
  const request = (requestPath, suppliedSecret) => fetch(base + requestPath, {
    headers: suppliedSecret === undefined ? {} : { 'X-Forge-Gateway-Secret': suppliedSecret },
  });
  (async () => {
    const [correct, missing, wrong, nonApi] = await Promise.all([
      request('/api/health', secret),
      request('/api/health'),
      request('/api/health', 'wrong'),
      request('/', secret),
    ]);
    const upstream = await correct.json();
    if (correct.status !== 200 || missing.status !== 404 || wrong.status !== 404 || nonApi.status !== 404) {
      throw new Error(JSON.stringify({
        correct: correct.status,
        missing: missing.status,
        wrong: wrong.status,
        nonApi: nonApi.status,
      }));
    }
    if (!upstream.ok || upstream.gatewayHeaderPresent || upstream.path !== '/api/health') {
      throw new Error('UPSTREAM_FORWARDING_OR_SECRET_STRIPPING_FAILED');
    }
    process.stdout.write(JSON.stringify({
      correctSecretHttp: correct.status,
      missingSecretHttp: missing.status,
      wrongSecretHttp: wrong.status,
      nonApiHttp: nonApi.status,
      secretStrippedUpstream: !upstream.gatewayHeaderPresent,
    }));
  })().catch(error => {
    process.stderr.write(String(error && error.stack || error));
    process.exit(1);
  });
`;

removeResources();
try {
  docker('network', 'create', network);
  docker(
    'run', '-d', '--name', backend,
    '--network', network,
    '--network-alias', 'forge-platform',
    '--read-only',
    '--tmpfs', '/tmp:rw,nosuid,nodev,size=16m',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    NODE_IMAGE,
    'node', '-e', backendProgram,
  );
  docker(
    'run', '-d', '--name', gateway,
    '--network', network,
    '--network-alias', 'forge-control-plane-gateway',
    '--read-only',
    '--tmpfs', '/tmp:rw,nosuid,nodev,size=32m',
    '--tmpfs', '/data:rw,nosuid,nodev,size=16m',
    '--tmpfs', '/config:rw,nosuid,nodev,size=16m',
    '--cap-drop', 'ALL',
    '--cap-add', 'NET_BIND_SERVICE',
    '--security-opt', 'no-new-privileges',
    '-e', `FORGE_CONTROL_PLANE_GATEWAY_SECRET=${secret}`,
    '--mount', `type=bind,source=${caddyfile},target=/etc/caddy/Caddyfile,readonly`,
    CADDY_IMAGE,
  );
  waitForGateway();

  const clientResult = docker(
    'run', '--rm', '--name', client,
    '--network', network,
    '--read-only',
    '--tmpfs', '/tmp:rw,nosuid,nodev,size=16m',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    '-e', `GATEWAY_SECRET=${secret}`,
    NODE_IMAGE,
    'node', '-e', clientProgram,
  );
  const acceptance = JSON.parse(clientResult.stdout);

  const inspection = JSON.parse(docker('inspect', gateway).stdout)[0];
  assert.equal(inspection.HostConfig.ReadonlyRootfs, true);
  assert.deepEqual(inspection.HostConfig.CapDrop, ['ALL']);
  assert.deepEqual(inspection.HostConfig.CapAdd, ['CAP_NET_BIND_SERVICE']);
  assert.ok(inspection.HostConfig.SecurityOpt.includes('no-new-privileges'));
  assert.deepEqual(inspection.HostConfig.PortBindings, {});
  assert.ok(Object.values(inspection.NetworkSettings.Ports || {}).every(value => value === null));
  assert.equal(docker('port', gateway).stdout.trim(), '');

  process.stdout.write(`cloudflare tunnel gateway regression: PASS ${JSON.stringify({
    ...acceptance,
    readOnlyRoot: true,
    capabilities: ['NET_BIND_SERVICE'],
    hostPortsPublished: false,
  })}\n`);
} finally {
  removeResources();
}
