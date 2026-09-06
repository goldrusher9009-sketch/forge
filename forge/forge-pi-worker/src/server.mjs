import http from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { runAgent } from './runtime.mjs';
import { validateOperatorMcpConfig } from '../ecosystem.mjs';

async function readJson(request) {
  const chunks = []; let length = 0;
  for await (const chunk of request) { length += chunk.length; if (length > 8 * 1024 * 1024) throw new Error('PI_REQUEST_TOO_LARGE'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
export function createWorkerServer({ token, maxConcurrent = 4, operatorMcpConfig } = {}) {
  if (!token || token.length < 32) throw new Error('FORGE_PI_WORKER_TOKEN_MUST_HAVE_32_CHARACTERS');
  validateOperatorMcpConfig(operatorMcpConfig);
  const active = new Map();
  const server = http.createServer(async (req, res) => {
    const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const authorized = Buffer.byteLength(supplied) === Buffer.byteLength(token) && timingSafeEqual(Buffer.from(supplied), Buffer.from(token));
    const json = (status, value) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(value)); };
    if (!authorized) return json(401, { error: 'PI_WORKER_AUTH_REQUIRED' });
    const url = new URL(req.url, 'http://worker');
    if (req.method === 'GET' && url.pathname === '/health') return json(200, { ready: true, engine: 'pi', version: '0.85.1', active: active.size });
    const control = /^\/v1\/runs\/([^/]+)\/(abort|tools\/([^/]+))$/.exec(url.pathname);
    if (req.method === 'POST' && control) {
      const run = active.get(control[1]);
      if (!run) return json(404, { error: 'PI_RUN_NOT_FOUND' });
      if (control[2] === 'abort') { run.controller.abort(); return json(200, { aborted: true }); }
      let requestId;
      try { requestId = decodeURIComponent(control[3]); } catch { return json(400, { error: 'PI_TOOL_REQUEST_ID_INVALID' }); }
      const pending = run.pending.get(requestId);
      if (!pending) return json(409, { error: 'PI_TOOL_REQUEST_NOT_PENDING' });
      try {
        const output = await readJson(req);
        if (!output || typeof output !== 'object' || Array.isArray(output)) return json(400, { error: 'PI_TOOL_RESULT_INVALID' });
        run.pending.delete(requestId); pending.resolve(output); return json(200, { accepted: true });
      }
      catch { return json(400, { error: 'PI_TOOL_RESULT_INVALID' }); }
    }
    if (req.method !== 'POST' || url.pathname !== '/v1/runs') return json(404, { error: 'NOT_FOUND' });
    if (active.size >= maxConcurrent) return json(429, { error: 'PI_WORKER_CAPACITY' });
    let request;
    try { request = await readJson(req); } catch { return json(400, { error: 'PI_REQUEST_INVALID' }); }
    if (!request || typeof request !== 'object' || Array.isArray(request) || typeof request.userId !== 'string' || !request.userId || typeof request.runId !== 'string' || !request.runId) return json(400, { error: 'PI_RUN_IDENTITY_REQUIRED' });
    if (active.size >= maxConcurrent) return json(429, { error: 'PI_WORKER_CAPACITY' });
    const workerRunId = randomUUID(); const controller = new AbortController(); const pending = new Map();
    active.set(workerRunId, { controller, pending });
    res.writeHead(200, { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
    const emit = event => { if (!res.destroyed) { if (res.writableLength > 16 * 1024 * 1024) controller.abort(); else res.write(JSON.stringify(event) + '\n'); } };
    emit({ type: 'started', workerRunId });
    const abort = () => { controller.abort(); for (const entry of pending.values()) entry.reject(new Error('PI_RUN_CANCELLED')); pending.clear(); };
    res.once('close', abort); controller.signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 30 * 60000);
    const heartbeat = setInterval(() => emit({ type: 'heartbeat' }), 15000);
    try {
      const result = await runAgent(request, {
        signal: controller.signal, emit, operatorMcpConfig: request.enableMcp === true ? operatorMcpConfig : undefined,
        executeTool: (name, args, toolCallId) => new Promise((resolve, reject) => {
          if (controller.signal.aborted) return reject(new Error('PI_RUN_CANCELLED'));
          const requestId = randomUUID(); pending.set(requestId, { resolve, reject });
          emit({ type: 'tool_request', requestId, name, args, toolCallId });
        }),
      });
      emit({ type: 'result', result });
    } catch (error) { emit({ type: 'error', error: String(error?.message || 'PI_RUN_FAILED').replace(/(?:Bearer\s+)[^\s]+/ig, 'Bearer [REDACTED]').slice(0, 2000) }); }
    finally { clearInterval(heartbeat); clearTimeout(timeout); active.delete(workerRunId); res.removeListener('close', abort); controller.signal.removeEventListener('abort', abort); abort(); res.end(); }
  });
  server.requestTimeout = 120000;
  server.headersTimeout = 30000;
  server.on('close', () => { for (const run of active.values()) run.controller.abort(); });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const operatorMcpConfig = process.env.FORGE_PI_MCP_CONFIG ? JSON.parse(await readFile(process.env.FORGE_PI_MCP_CONFIG, 'utf8')) : undefined;
  const server = createWorkerServer({ token: process.env.FORGE_PI_WORKER_TOKEN, operatorMcpConfig, maxConcurrent: Math.max(1, Math.min(Number(process.env.FORGE_PI_MAX_CONCURRENT) || 4, 32)) });
  server.listen(Number(process.env.PORT) || 8791, process.env.HOST || '127.0.0.1', () => process.stdout.write('Forge Pi worker ready\n'));
  const stop = () => { server.close(); server.closeAllConnections(); };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
}
