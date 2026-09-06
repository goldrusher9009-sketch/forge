import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { createWorkerServer } from '../src/server.mjs';

const TOKEN = 'forge-server-test-token-32-characters-only';
const HEADERS = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const TOOL = { name: 'forge_sum', description: 'A controlled test tool.', parameters: {
  type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'], additionalProperties: false,
} };

async function listen(t, server) {
  const sockets = new Set();
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

function event(response, delta, finish_reason = null, usage) {
  response.write(`data: ${JSON.stringify({ id: 'server-mock', object: 'chat.completion.chunk', created: 1, model: 'server-mock',
    choices: [{ index: 0, delta, finish_reason }], ...(usage ? { usage } : {}),
  })}\n\n`);
}
function openStream(response) { response.writeHead(200, { 'Content-Type': 'text/event-stream' }); }
function answer(response, text = 'The sum is 5.') {
  openStream(response); event(response, { role: 'assistant', content: text });
  event(response, {}, 'stop', { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 });
  response.end('data: [DONE]\n\n');
}
function askTool(response) {
  openStream(response);
  event(response, { role: 'assistant', tool_calls: [{ index: 0, id: 'call-server-sum', type: 'function', function: { name: TOOL.name, arguments: '{"a":2,"b":3}' } }] });
  event(response, {}, 'tool_calls', { prompt_tokens: 9, completion_tokens: 3, total_tokens: 12 });
  response.end('data: [DONE]\n\n');
}
async function provider(t, respond) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      requests.push(body);
      await respond(body, res, requests.length);
    } catch (error) { if (!res.headersSent) res.writeHead(500); res.end(String(error.message)); }
  });
  return { baseUrl: `${await listen(t, server)}/v1`, requests };
}
function requestFor(mock, overrides = {}) {
  return { userId: 'server-test-user', runId: 'server-test-run', input: 'Compute the sum through the controlled tool.', messages: [],
    model: { id: 'server-mock', api: 'openai-completions', baseUrl: mock.baseUrl, token: 'local-model-test-only', maxTokens: 512, contextWindow: 32000 },
    tools: [TOOL], maxTurns: 4, maxTokens: 2048, ...overrides,
  };
}
async function post(base, path, body, headers = HEADERS) {
  return fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
}
async function readEvents(response, onEvent = async () => {}) {
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/x-ndjson/);
  const events = []; const decoder = new TextDecoder(); let buffer = '';
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
      if (!line.trim()) continue;
      const value = JSON.parse(line); events.push(value); await onEvent(value);
    }
  }
  buffer += decoder.decode(); assert.equal(buffer.trim(), '');
  return events;
}

test('worker rejects missing/wrong service tokens and incomplete identities before provider execution', { timeout: 30000 }, async t => {
  assert.throws(() => createWorkerServer({ token: 'short' }), /32_CHARACTERS/);
  const base = await listen(t, createWorkerServer({ token: TOKEN }));
  assert.equal((await fetch(`${base}/health`)).status, 401);
  assert.equal((await fetch(`${base}/health`, { headers: { Authorization: `Bearer ${'x'.repeat(TOKEN.length)}` } })).status, 401);
  assert.equal((await post(base, '/v1/runs', {}, HEADERS)).status, 400);
  assert.equal((await post(base, '/v1/runs', { userId: 'user', runId: 1 }, HEADERS)).status, 400);
  assert.equal((await post(base, '/v1/runs/missing/abort', {}, HEADERS)).status, 404);
  const health = await fetch(`${base}/health`, { headers: HEADERS });
  assert.equal(health.status, 200); assert.equal((await health.json()).active, 0);
});

test('non-ASCII invalid tokens and null JSON requests are rejected without crashing the worker process', { timeout: 30000 }, async t => {
  const source = `import {createWorkerServer} from './src/server.mjs';const server=createWorkerServer({token:${JSON.stringify(TOKEN)}});server.listen(0,'127.0.0.1',()=>console.log(server.address().port));`;
  const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', source], {
    cwd: new URL('..', import.meta.url), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const errors = []; child.stderr.on('data', chunk => errors.push(chunk.toString()));
  t.after(() => { if (child.exitCode === null) child.kill(); });
  const [chunk] = await once(child.stdout, 'data'); const port = Number(String(chunk).trim());
  assert(Number.isInteger(port) && port > 0);
  let response;
  try { response = await fetch(`http://127.0.0.1:${port}/health`, { headers: { Authorization: `Bearer ${'é'.repeat(TOKEN.length)}` }, signal: AbortSignal.timeout(10000) }); }
  catch (error) { assert.fail(`Invalid token terminated the worker: ${errors.join('')} ${error.message}`); }
  assert.equal(response.status, 401);
  assert.equal((await fetch(`http://127.0.0.1:${port}/health`, { headers: HEADERS })).status, 200);
  let invalidBody;
  try { invalidBody = await fetch(`http://127.0.0.1:${port}/v1/runs`, { method: 'POST', headers: HEADERS, body: 'null', signal: AbortSignal.timeout(10000) }); }
  catch (error) { assert.fail(`A null JSON body terminated the worker: ${errors.join('')} ${error.message}`); }
  assert.equal(invalidBody.status, 400);
  assert.equal((await fetch(`http://127.0.0.1:${port}/health`, { headers: HEADERS })).status, 200);
});

test('NDJSON broker preserves tool identities and sends accepted results into the next real SDK model turn', { timeout: 30000 }, async t => {
  const mock = await provider(t, (body, res) => {
    if (!body.messages.some(message => message.role === 'tool')) return askTool(res);
    const tool = body.messages.find(message => message.role === 'tool');
    assert.equal(tool.tool_call_id, 'call-server-sum'); assert.match(JSON.stringify(tool.content), /5/);
    answer(res);
  });
  const base = await listen(t, createWorkerServer({ token: TOKEN }));
  let workerRunId; const calls = [];
  const events = await readEvents(await post(base, '/v1/runs', requestFor(mock)), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'tool_request') {
      calls.push(event);
      assert.equal((await post(base, `/v1/runs/${workerRunId}/tools/%invalid-encoding`, {})).status, 400);
      assert.equal((await post(base, `/v1/runs/${workerRunId}/tools/unknown-request`, {})).status, 409);
      assert.equal((await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`, null)).status, 400);
      assert.equal((await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`, [])).status, 400);
      assert.equal((await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`, { content: { sum: 5 } })).status, 200);
    }
  });
  assert.equal(calls.length, 1); assert.equal(calls[0].toolCallId, 'call-server-sum');
  assert.deepEqual(calls[0].args, { a: 2, b: 3 });
  assert.equal(events.find(event => event.type === 'result').result.content, 'The sum is 5.');
  assert(events.some(event => event.type === 'checkpoint' && event.messages.some(message => message.role === 'toolResult')));
  assert.equal(mock.requests.length, 2);
  assert.equal((await fetch(`${base}/health`, { headers: HEADERS }).then(res => res.json())).active, 0);
  assert.equal((await post(base, `/v1/runs/${workerRunId}/tools/${calls[0].requestId}`, { content: { sum: 5 } })).status, 404);
});

test('approval pause checkpoints the original tool call and resume executes it once before the next model call', { timeout: 30000 }, async t => {
  const mock = await provider(t, (body, res) => body.messages.some(message => message.role === 'tool') ? answer(res) : askTool(res));
  const base = await listen(t, createWorkerServer({ token: TOKEN }));
  let workerRunId; let asked = 0;
  const first = await readEvents(await post(base, '/v1/runs', requestFor(mock)), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'tool_request') {
      asked += 1;
      await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`, { pause: true, content: { approvalRequired: true } });
    }
  });
  const paused = first.find(event => event.type === 'result').result;
  assert.equal(paused.paused, true); assert.equal(asked, 1); assert.equal(mock.requests.length, 1);
  assert.equal(paused.pendingToolCalls[0].toolCallId, 'call-server-sum');
  assert(!paused.messages.some(message => message.role === 'toolResult'));
  let executed = 0;
  const second = await readEvents(await post(base, '/v1/runs', requestFor(mock, { piMessages: paused.messages, input: undefined })), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'tool_request') {
      executed += 1; assert.equal(event.toolCallId, 'call-server-sum'); assert.equal(mock.requests.length, 1);
      await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`, { content: { sum: 5 } });
    }
  });
  const completed = second.find(event => event.type === 'result').result;
  assert.equal(executed, 1); assert.equal(mock.requests.length, 2); assert.equal(completed.paused, false);
  assert.equal(completed.messages.filter(message => message.role === 'toolResult' && message.toolCallId === 'call-server-sum').length, 1);
});

test('abort endpoint interrupts an unfinished stream and releases capacity', { timeout: 30000 }, async t => {
  const mock = await provider(t, (_body, res) => { openStream(res); event(res, { role: 'assistant', content: 'running' }); });
  const base = await listen(t, createWorkerServer({ token: TOKEN, maxConcurrent: 1 }));
  let workerRunId; let aborted = false;
  const events = await readEvents(await post(base, '/v1/runs', requestFor(mock, { tools: [] })), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'text_delta' && !aborted) {
      aborted = true;
      assert.equal((await post(base, '/v1/runs', requestFor(mock))).status, 429);
      assert.equal((await post(base, `/v1/runs/${workerRunId}/abort`, {})).status, 200);
    }
  });
  assert.equal(aborted, true);
  assert(events.some(event => event.type === 'error' && /CANCELLED/.test(event.error)));
  assert(!events.some(event => event.type === 'result'));
  assert.equal((await fetch(`${base}/health`, { headers: HEADERS }).then(res => res.json())).active, 0);
});

test('abort rejects a pending tool request without feeding a fabricated tool result to the model', { timeout: 30000 }, async t => {
  const mock = await provider(t, (_body, res) => askTool(res));
  const base = await listen(t, createWorkerServer({ token: TOKEN }));
  let workerRunId;
  const events = await readEvents(await post(base, '/v1/runs', requestFor(mock)), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'tool_request') assert.equal((await post(base, `/v1/runs/${workerRunId}/abort`, {})).status, 200);
  });
  assert.equal(mock.requests.length, 1);
  assert(events.some(event => event.type === 'error' && /CANCELLED/.test(event.error)));
  assert(!events.some(event => event.type === 'result'));
});

test('actual SDK plan tool restores the supplied persisted plan after extension binding', { timeout: 30000 }, async t => {
  const plan = [
    { id: 'inspect', title: 'Inspect the supplied input', status: 'completed', evidence: 'Input receipt verified.' },
    { id: 'deliver', title: 'Deliver the reviewed artifact', status: 'pending' },
  ];
  const mock = await provider(t, (body, res) => {
    const tool = body.messages.find(message => message.role === 'tool');
    if (tool) {
      const returned = JSON.parse(tool.content);
      assert.deepEqual(returned.steps, plan);
      return answer(res, 'The previous plan is available.');
    }
    openStream(res);
    event(res, { role: 'assistant', tool_calls: [{ index: 0, id: 'call-plan-get', type: 'function', function: { name: 'forge_plan', arguments: '{"operation":"get"}' } }] });
    event(res, {}, 'tool_calls', { prompt_tokens: 9, completion_tokens: 3, total_tokens: 12 });
    res.end('data: [DONE]\n\n');
  });
  const base = await listen(t, createWorkerServer({ token: TOKEN }));
  const events = await readEvents(await post(base, '/v1/runs', requestFor(mock, { tools: [], plan })));
  const result = events.find(event => event.type === 'result').result;
  assert.equal(result.content, 'The previous plan is available.');
  assert.deepEqual(result.plan, plan);
  assert(!events.some(event => event.type === 'tool_request'), 'The native plan tool must not become an external broker action');
});

test('native SDK compaction emits lifecycle events and includes summary usage in run totals', { timeout: 30000 }, async t => {
  const mock = await provider(t, (_body, res, count) => {
    assert(count <= 5, 'The compaction fixture must remain bounded');
    openStream(res); event(res, { role: 'assistant', content: 'A compact summary of verified prior work.' });
    event(res, {}, 'stop', { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 });
    res.end('data: [DONE]\n\n');
  });
  const usage = { input: 45000, output: 15000, cacheRead: 0, cacheWrite: 0, totalTokens: 60000,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
  const piMessages = [];
  for (let i = 0; i < 3; i += 1) {
    piMessages.push({ role: 'user', content: [{ type: 'text', text: `Earlier request ${i}: ${'historical evidence '.repeat(3000)}` }], timestamp: 1000 + i * 2 });
    piMessages.push({ role: 'assistant', content: [{ type: 'text', text: `Earlier result ${i}: ${'verified observation '.repeat(3000)}` }],
      api: 'openai-completions', provider: 'forge-runtime', model: 'server-mock', usage,
      stopReason: 'stop', timestamp: 1001 + i * 2 });
  }
  const base = await listen(t, createWorkerServer({ token: TOKEN }));
  const input = requestFor(mock, { tools: [], piMessages, maxTurns: 5, maxTokens: 128000, input: 'Summarize the prior work briefly.' });
  input.model.contextWindow = 32768;
  const events = await readEvents(await post(base, '/v1/runs', input));
  const completed = events.find(event => event.type === 'result')?.result;
  assert(completed, JSON.stringify(events.filter(event => event.type === 'error')));
  assert(events.some(event => event.type === 'auto_compaction_start'));
  assert(events.some(event => event.type === 'auto_compaction_end' && event.aborted !== true));
  assert(events.some(event => event.type === 'usage' && event.source === 'compaction'));
  assert(mock.requests.length >= 2 && mock.requests.length <= 5);
  assert.equal(completed.promptTokens, mock.requests.length * 10);
  assert.equal(completed.completionTokens, mock.requests.length * 4);
});

test('real MCP adapter sends exact call arguments to Forge and executes only after allow_once', { timeout: 30000 }, async t => {
  const nativeFetch = globalThis.fetch;
  const executed = [];
  // Only the configured fake HTTPS endpoint is intercepted. The model and worker
  // still use actual loopback HTTP; the real community adapter owns MCP protocol,
  // schema validation, tool registration, authorization, and result conversion.
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (!url.startsWith('https://forge-mcp-server-test.invalid/')) return nativeFetch(input, init);
    const request = new Request(input, init);
    if (request.method === 'GET') return new Response(null, { status: 405 });
    if (request.method === 'DELETE') return new Response(null, { status: 200 });
    const rpc = await request.json();
    if (rpc.id === undefined) return new Response(null, { status: 202 });
    let result;
    if (rpc.method === 'initialize') result = { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'forge-test-docs', version: '1.0.0' } };
    else if (rpc.method === 'tools/list') result = { tools: [{ name: 'read_note', description: 'Read the named fixture document.',
      inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false },
    }] };
    else if (rpc.method === 'tools/call') { executed.push(rpc.params); result = { content: [{ type: 'text', text: 'MCP fixture evidence: report has three findings.' }] }; }
    else if (rpc.method === 'ping') result = {};
    else return new Response(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, error: { code: -32601, message: 'Unknown test method' } }), { headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result }), { headers: { 'content-type': 'application/json' } });
  };
  t.after(() => { globalThis.fetch = nativeFetch; });
  let toolMode = 'mcp';
  const mock = await provider(t, (body, res) => {
    if (body.messages.some(message => message.role === 'tool')) return answer(res, 'MCP fixture handled.');
    assert(body.tools.some(tool => tool.function.name === 'mcp'));
    openStream(res);
    const nativeMcpCall = { index: toolMode === 'mixed' ? 1 : 0, id: 'call-native-mcp', type: 'function', function: { name: 'mcp',
      arguments: JSON.stringify({ server: 'docs', tool: 'read_note', args: { path: 'report.md' } }),
    } };
    const calls = toolMode === 'mixed' ? [{ index: 0, id: 'call-server-sum', type: 'function', function: { name: TOOL.name, arguments: '{"a":2,"b":3}' } }, nativeMcpCall] : [nativeMcpCall];
    event(res, { role: 'assistant', tool_calls: calls });
    event(res, {}, 'tool_calls', { prompt_tokens: 9, completion_tokens: 3, total_tokens: 12 });
    res.end('data: [DONE]\n\n');
  });
  const base = await listen(t, createWorkerServer({ token: TOKEN, operatorMcpConfig: { mcpServers: {
    docs: { url: 'https://forge-mcp-server-test.invalid/mcp', includeTools: ['read_note'] },
  } } }));
  let workerRunId; const approvalRequests = [];
  const events = await readEvents(await post(base, '/v1/runs', requestFor(mock, { tools: [], enableMcp: true })), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'tool_request') {
      approvalRequests.push(event); assert.equal(event.name, 'mcp_call');
      assert.deepEqual(event.args, { serverName: 'docs', toolName: 'read_note', arguments: { path: 'report.md' } });
      assert.equal(executed.length, 0);
      await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`, { content: { decision: 'allow_once' } });
    }
  });
  assert.equal(approvalRequests.length, 1, JSON.stringify(events.filter(event => ['result', 'error'].includes(event.type))));
  assert.deepEqual(executed, [{ name: 'read_note', arguments: { path: 'report.md' } }]);
  const completed = events.find(event => event.type === 'result').result;
  assert.equal(completed.paused, false);
  assert(completed.messages.some(message => message.role === 'toolResult' && JSON.stringify(message.content).includes('MCP fixture evidence')));
  const receipt = events.find(event => event.type === 'tool_end' && event.name === 'mcp_call');
  assert(receipt && JSON.stringify(receipt.result.content).includes('MCP fixture evidence'));
  assert.deepEqual(receipt.args.arguments, { path: 'report.md' });

  // Returning a durable-approval pause is unsupported for MCP and must deny the
  // operation, rather than running it or producing an unrecoverable paused mcp call.
  const denied = await readEvents(await post(base, '/v1/runs', requestFor(mock, { tools: [], enableMcp: true })), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'tool_request') await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`, { pause: true, content: { decision: 'allow_once' } });
  });
  assert.equal(executed.length, 1);
  const rejected = denied.find(event => event.type === 'result').result;
  assert.equal(rejected.paused, false);
  // The upstream adapter encodes approval denial in details.error even when the
  // Pi message's isError flag is false; the unchanged call count proves no action.
  assert(rejected.messages.some(message => message.role === 'toolResult' && message.details?.error === 'approval_denied'));

  // A native MCP call can follow a Forge approval tool in the same assistant
  // batch. Resuming the original batch must still emit its real execution receipt.
  toolMode = 'mixed';
  const mixed = await readEvents(await post(base, '/v1/runs', requestFor(mock, { enableMcp: true })), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'tool_request') {
      assert.equal(event.name, TOOL.name);
      await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`, { pause: true, content: { approvalRequired: true } });
    }
  });
  const pausedBatch = mixed.find(event => event.type === 'result').result;
  assert.equal(pausedBatch.paused, true);
  assert.deepEqual(pausedBatch.pendingToolCalls.map(call => call.name), [TOOL.name, 'mcp']);
  const resumed = await readEvents(await post(base, '/v1/runs', requestFor(mock, { enableMcp: true, piMessages: pausedBatch.messages, input: undefined })), async event => {
    if (event.type === 'started') workerRunId = event.workerRunId;
    if (event.type === 'tool_request') await post(base, `/v1/runs/${workerRunId}/tools/${event.requestId}`,
      event.name === 'mcp_call' ? { content: { decision: 'allow_once' } } : { content: { sum: 5 } });
  });
  assert.equal(executed.length, 2);
  const resumedReceipt = resumed.find(event => event.type === 'tool_end' && event.name === 'mcp_call');
  assert(resumedReceipt && JSON.stringify(resumedReceipt.result.content).includes('MCP fixture evidence'), 'Resumed native MCP calls need the same Forge execution receipt as an ordinary call');
});
