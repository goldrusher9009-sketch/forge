const assert = require('node:assert/strict');
const test = require('node:test');
const { createRequire } = require('node:module');
const { join, resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const http = require('node:http');
const requireWorker = createRequire(resolve(__dirname, '../../forge-pi-worker/package.json'));
requireWorker('tsx/cjs');
const { registerPiModelGateway, runPiAgent } = require('../src/pi-runtime.ts');

const nativeFetch = globalThis.fetch;
const outgoing = [];
const incoming = [];
const savedEnv = new Map();
let platform, worker;
let expected;

function openaiFixture(model, toolCall = false) {
  const chunk = (delta, finish_reason = null, usage) => 'data: ' + JSON.stringify({ id: 'provider-fixture', object: 'chat.completion.chunk', created: 1, model, choices: [{ index: 0, delta, finish_reason }], ...(usage ? { usage } : {}) }) + '\n\n';
  if (toolCall) return chunk({ role: 'assistant', tool_calls: [{ index: 0, id: 'A1b2C3d4E', type: 'function', function: { name: 'fixture_read', arguments: '{"key":"fixture"}' } }] }) + chunk({}, 'tool_calls', { prompt_tokens: 13, completion_tokens: 5, total_tokens: 18 }) + 'data: [DONE]\n\n';
  return chunk({ role: 'assistant', content: 'provider-gateway-ok' }) + chunk({}, 'stop', { prompt_tokens: 13, completion_tokens: 5, total_tokens: 18 }) + 'data: [DONE]\n\n';
}
function anthropicFixture(model) {
  const event = (type, data) => 'event: ' + type + '\ndata: ' + JSON.stringify({ type, ...data }) + '\n\n';
  return event('message_start', { message: { id: 'provider-fixture', type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 13, output_tokens: 0 } } })
    + event('content_block_start', { index: 0, content_block: { type: 'text', text: '' } })
    + event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'provider-gateway-ok' } })
    + event('content_block_stop', { index: 0 })
    + event('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 5 } })
    + event('message_stop', {});
}
function googleFixture(model) {
  return 'data: ' + JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: 'provider-gateway-ok' }] }, finishReason: 'STOP', index: 0 }], usageMetadata: { promptTokenCount: 13, candidatesTokenCount: 5, totalTokenCount: 18 }, modelVersion: model, responseId: 'provider-fixture' }) + '\n\n';
}

test.before(async () => {
  // All non-loopback fetches are intercepted before they reach the network.
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return nativeFetch(input, init);
    if (!expected || url.hostname !== new URL(expected.url).hostname) throw new Error('Unexpected external request was blocked: ' + url.hostname);
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : {};
    const headers = Object.fromEntries(new Headers(init.headers));
    outgoing.push({ url: url.href, body, headers });
    const text = expected.provider === 'anthropic' ? anthropicFixture(expected.resolved) : ['google', 'gemini'].includes(expected.provider) ? googleFixture(expected.resolved) : openaiFixture(expected.resolved, expected.toolCall && !body.messages.some(message => message.role === 'tool'));
    return new Response(text, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  };
  // Adapt native HTTP to the narrow Express request/response surface used by the
  // real gateway handler, so this fixture does not need platform production deps.
  let route;
  registerPiModelGateway({ post(path, handler) { assert.equal(path, '/api/internal/pi/models/:grant/*'); route = handler; } });
  platform = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://fixture');
    const match = /^\/api\/internal\/pi\/models\/([^/]+)\/(.*)$/.exec(url.pathname);
    if (!match) { response.writeHead(404); response.end(); return; }
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    request.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    request.params = { grant: match[1], 0: decodeURIComponent(match[2]) };
    request.query = Object.fromEntries(url.searchParams);
    response.status = code => { response.statusCode = code; return response; };
    response.set = (name, value) => { response.setHeader(name, value); return response; };
    response.json = value => { response.setHeader('content-type', 'application/json'); response.end(JSON.stringify(value)); return response; };
    incoming.push({ url: request.url, body: request.body, headers: request.headers });
    await route(request, response);
  });
  await new Promise(resolve => platform.listen(0, '127.0.0.1', resolve));
  const { createWorkerServer } = await import(pathToFileURL(resolve(__dirname, '../../forge-pi-worker/src/server.mjs')).href);
  worker = createWorkerServer({ token: 'fixture-worker-token-32-characters-long' });
  await new Promise(resolve => worker.listen(0, '127.0.0.1', resolve));
  const overrides = {
    FORGE_PI_PLATFORM_URL: 'http://127.0.0.1:' + platform.address().port,
    FORGE_PI_WORKER_URL: 'http://127.0.0.1:' + worker.address().port,
    FORGE_PI_WORKER_TOKEN: 'fixture-worker-token-32-characters-long',
    FORGE_PI_TEST_MODEL_URL: '', FORGE_SANDBOX_TEST_OPENAI_CHAT_URL: '',
  };
  for (const [key, value] of Object.entries(overrides)) { savedEnv.set(key, process.env[key]); process.env[key] = value; }
});
test.after(async () => {
  for (const server of [worker, platform]) if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  globalThis.fetch = nativeFetch;
  for (const [key, value] of savedEnv) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
});

const cases = [
  { provider: 'anthropic', model: 'claude-sonnet-4-6', resolved: 'claude-sonnet-4-6', url: 'https://api.anthropic.com/v1/messages', suffix: '/v1/messages' },
  { provider: 'google', model: 'gemini-2.0-flash', resolved: 'gemini-2.0-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse', suffix: '/v1beta/models/gemini-2.0-flash:streamGenerateContent' },
  { provider: 'gemini', model: 'gemini-2.5-flash', resolved: 'gemini-2.5-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse', suffix: '/v1beta/models/gemini-2.5-flash:streamGenerateContent' },
  { provider: 'openai', model: 'gpt-4o', resolved: 'gpt-4o', url: 'https://api.openai.com/v1/chat/completions', suffix: '/v1/chat/completions' },
  { provider: 'groq', model: 'llama-3.3-70b', resolved: 'llama-3.3-70b-versatile', url: 'https://api.groq.com/openai/v1/chat/completions', suffix: '/v1/chat/completions' },
  { provider: 'mistral', model: 'mistral-large', resolved: 'mistral-large-latest', url: 'https://api.mistral.ai/v1/chat/completions', suffix: '/v1/chat/completions' },
  { provider: 'openrouter', model: '~openrouter/anthropic/claude-sonnet-4.6', resolved: 'anthropic/claude-sonnet-4.6', url: 'https://openrouter.ai/api/v1/chat/completions', suffix: '/v1/chat/completions' },
  { provider: 'groq', model: 'mixtral-8x7b', resolved: 'mixtral-8x7b-32768', url: 'https://api.groq.com/openai/v1/chat/completions', suffix: '/v1/chat/completions' },
  { provider: 'groq', model: 'gemma2-9b', resolved: 'gemma2-9b-it', url: 'https://api.groq.com/openai/v1/chat/completions', suffix: '/v1/chat/completions' },
  { provider: 'mistral', model: 'codestral', resolved: 'codestral-latest', url: 'https://api.mistral.ai/v1/chat/completions', suffix: '/v1/chat/completions' },
];

function assertPayloadShape(provider, body) {
  if (provider === 'anthropic') {
    assert.ok(body.max_tokens > 0);
    assert.equal(body.stream, true);
    assert.ok(Array.isArray(body.system));
    assert.equal(body.messages[0].role, 'user');
    return;
  }
  if (['google', 'gemini'].includes(provider)) {
    assert.ok(body.generationConfig.maxOutputTokens > 0);
    assert.ok(Array.isArray(body.contents));
    assert.equal(body.contents[0].role, 'user');
    return;
  }
  assert.equal(body.stream, true);
  assert.equal(body.messages[0].role, 'system');
  if (provider === 'mistral') {
    assert.ok(body.max_tokens > 0, 'Mistral Chat REST uses max_tokens');
    assert.equal(body.max_completion_tokens, undefined);
    assert.equal(body.stream_options, undefined, 'Mistral streams usage without OpenAI stream_options');
  } else {
    assert.ok(body.max_completion_tokens > 0);
    assert.equal(body.max_tokens, undefined);
    assert.deepEqual(body.stream_options, { include_usage: true });
  }
  assert.equal(body.store, provider === 'openai' ? false : undefined, 'Only the OpenAI gateway sends the OpenAI store option');
}

for (const entry of cases) test('actual Pi SDK and gateway preserve ' + entry.provider + ' / ' + entry.model + ' routing and credential boundaries', { timeout: 20000 }, async () => {
  expected = entry; outgoing.length = 0; incoming.length = 0;
  const result = await runPiAgent({
    userId: 'provider-fixture-user', runId: 'provider-fixture-run', provider: entry.provider, model: entry.model,
    apiKey: 'fake-customer-key-' + entry.provider, systemPrompt: 'Reply with the local fixture response.', input: 'Test the configured provider path.',
    tools: [], ecosystem: false, maxTurns: 2, maxTokens: 32000, executeTool: async () => { throw new Error('Unexpected tool execution'); },
  });
  assert.equal(result.content, 'provider-gateway-ok');
  assert.equal(result.promptTokens, 13); assert.equal(result.completionTokens, 5);
  assert.equal(outgoing.length, 1);
  assert.equal(outgoing[0].url, entry.url);
  assert.ok(incoming[0].url.split('?')[0].endsWith(entry.suffix));
  assert.ok(!JSON.stringify(incoming[0].headers).includes('fake-customer-key'), 'The worker must only receive a scoped grant token');
  if (entry.provider === 'anthropic') {
    assert.equal(outgoing[0].headers['x-api-key'], 'fake-customer-key-anthropic');
    assert.equal(outgoing[0].headers['anthropic-version'], '2023-06-01');
  } else if (['google', 'gemini'].includes(entry.provider)) {
    assert.equal(outgoing[0].headers['x-goog-api-key'], 'fake-customer-key-' + entry.provider);
  } else {
    assert.equal(outgoing[0].headers.authorization, 'Bearer fake-customer-key-' + entry.provider);
    if (entry.provider === 'openrouter') {
      assert.equal(outgoing[0].headers['http-referer'], 'https://forge-sand-two.vercel.app');
      assert.equal(outgoing[0].headers['x-title'], 'Forge Pi');
    }
  }
  if (!['google', 'gemini'].includes(entry.provider)) assert.equal(outgoing[0].body.model, entry.resolved);
  assertPayloadShape(entry.provider, outgoing[0].body);
});

test('Mistral tool roundtrip preserves the provider tool ID and includes the tool result name', { timeout: 20000 }, async () => {
  expected = { ...cases.find(entry => entry.provider === 'mistral'), toolCall: true };
  outgoing.length = 0; incoming.length = 0;
  const executions = [];
  const result = await runPiAgent({
    userId: 'provider-fixture-user', runId: 'provider-tool-run', provider: expected.provider, model: expected.model,
    apiKey: 'fake-customer-key-mistral', systemPrompt: 'Read the fixture tool and then answer.', input: 'Read the fixture.',
    tools: [{ name: 'fixture_read', description: 'Read a fixture value.', parameters: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'], additionalProperties: false } }],
    ecosystem: false, maxTurns: 3, maxTokens: 128000,
    executeTool: async (name, args, toolCallId) => { executions.push({ name, args, toolCallId }); return { content: 'fixture-value' }; },
  });
  assert.equal(result.content, 'provider-gateway-ok');
  assert.equal(result.promptTokens, 26); assert.equal(result.completionTokens, 10);
  assert.deepEqual(executions, [{ name: 'fixture_read', args: { key: 'fixture' }, toolCallId: 'A1b2C3d4E' }]);
  assert.equal(outgoing.length, 2);
  for (const request of outgoing) assertPayloadShape('mistral', request.body);
  const replay = outgoing[1].body.messages;
  assert.equal(replay.find(message => message.tool_calls)?.tool_calls[0].id, 'A1b2C3d4E');
  const toolResult = replay.find(message => message.role === 'tool');
  assert.equal(toolResult.tool_call_id, 'A1b2C3d4E');
  assert.equal(toolResult.name, 'fixture_read');
  assert.match(toolResult.content, /fixture-value/);
});
