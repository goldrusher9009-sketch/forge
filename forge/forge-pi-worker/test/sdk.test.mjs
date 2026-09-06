import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runAgent } from '../src/runtime.mjs';

async function mockProvider(t, respond) {
  const requests = [];
  const sockets = new Set();
  const server = http.createServer(async (request, response) => {
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      requests.push({ body, path: request.url, auth: request.headers.authorization });
      await respond(body, response, requests.length);
    } catch (error) {
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: { message: error.message } }));
    }
  });
  server.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => server.close(resolve));
  });
  return { requests, baseUrl: `http://127.0.0.1:${server.address().port}/v1` };
}

function begin(response) {
  response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
}

function chunk(response, delta, finishReason = null, usage) {
  response.write(`data: ${JSON.stringify({
    id: 'forge-sdk-fixture', object: 'chat.completion.chunk', created: 1, model: 'forge-sdk-fixture',
    choices: [{ index: 0, delta, finish_reason: finishReason }], ...(usage ? { usage } : {}),
  })}\n\n`);
}

function finish(response, text = 'sdk-local-ok', promptTokens = 13, completionTokens = 5) {
  begin(response);
  chunk(response, { role: 'assistant', content: text });
  chunk(response, {}, 'stop', { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens });
  response.end('data: [DONE]\n\n');
}

function requestFor(provider, overrides = {}) {
  return {
    userId: 'sdk-test-user', runId: 'sdk-test-run',
    model: { id: 'forge-sdk-fixture', api: 'openai-completions', baseUrl: provider.baseUrl, token: 'local-test-key-only', contextWindow: 32000, maxTokens: 512 },
    systemPrompt: 'You are a local integration test assistant.',
    messages: [], input: 'Perform the requested local test.', tools: [], maxTurns: 4, maxTokens: 2048,
    ...overrides,
  };
}

const sumTool = {
  name: 'forge_sum', description: 'Add two integers using a Forge controlled tool.',
  parameters: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'], additionalProperties: false },
};

function requestTool(response) {
  begin(response);
  chunk(response, { role: 'assistant', tool_calls: [{ index: 0, id: 'call-forge-sum', type: 'function', function: { name: 'forge_sum', arguments: '{"a":2,"b":3}' } }] });
  chunk(response, {}, 'tool_calls', { prompt_tokens: 11, completion_tokens: 4, total_tokens: 15 });
  response.end('data: [DONE]\n\n');
}

function requestToolBatch(response, calls) {
  begin(response);
  chunk(response, { role: 'assistant', tool_calls: calls.map((call, index) => ({ index, id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.args) } })) });
  chunk(response, {}, 'tool_calls', { prompt_tokens: 11, completion_tokens: 4, total_tokens: 15 });
  response.end('data: [DONE]\n\n');
}

test('real Pi SDK streams local provider output and usage without default tools or global resources', { timeout: 30000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'forge-sdk-global-'));
  const marker = join(directory, 'global-extension-was-loaded');
  await mkdir(join(directory, 'extensions'));
  await writeFile(join(directory, 'extensions', 'forbidden.ts'), `import { writeFileSync } from 'node:fs'; export default () => { writeFileSync(${JSON.stringify(marker)}, 'unexpected'); throw new Error('Global extension must not load'); };`);
  await writeFile(join(directory, 'SYSTEM.md'), 'FORBIDDEN_GLOBAL_SYSTEM_PROMPT');
  const prior = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = directory;
  t.after(async () => {
    if (prior === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = prior;
    await rm(directory, { recursive: true, force: true });
  });
  const provider = await mockProvider(t, (_body, response) => finish(response));
  const events = [];
  const result = await runAgent(requestFor(provider), { emit: event => events.push(event) });
  assert.equal(result.content, 'sdk-local-ok');
  assert.equal(result.promptTokens, 13);
  assert.equal(result.completionTokens, 5);
  assert.equal(provider.requests.length, 1);
  assert.equal(provider.requests[0].path, '/v1/chat/completions');
  assert.equal(provider.requests[0].auth, 'Bearer local-test-key-only');
  const toolNames = provider.requests[0].body.tools?.map(tool => tool.function.name) || [];
  for (const name of ['read', 'write', 'edit', 'bash', 'powershell']) assert.ok(!toolNames.includes(name));
  assert.ok(toolNames.includes('forge_skill') && toolNames.includes('forge_plan'));
  assert.ok(!JSON.stringify(provider.requests[0].body).includes('FORBIDDEN_GLOBAL_SYSTEM_PROMPT'));
  assert.ok(events.some(event => event.type === 'text_delta'));
  assert.ok(events.some(event => event.type === 'usage'));
  assert.ok(Array.isArray(result.messages) && result.messages.some(message => message.role === 'assistant'));
  await assert.rejects(access(marker));
});

test('real Pi SDK executes only the Forge registered tool and feeds its result into the next model turn', { timeout: 30000 }, async t => {
  const provider = await mockProvider(t, (body, response, index) => {
    if (index === 1) return requestTool(response);
    assert.ok(body.messages.some(message => message.role === 'tool' && message.tool_call_id === 'call-forge-sum' && JSON.stringify(message.content).includes('5')));
    finish(response, 'The result is 5.', 17, 6);
  });
  const calls = [];
  const result = await runAgent(requestFor(provider, { tools: [sumTool] }), {
    executeTool: async (name, args, id) => {
      calls.push({ name, args, id });
      return { content: { result: args.a + args.b } };
    },
  });
  assert.equal(result.content, 'The result is 5.');
  assert.deepEqual(calls, [{ name: 'forge_sum', args: { a: 2, b: 3 }, id: 'call-forge-sum' }]);
  assert.equal(provider.requests.length, 2);
  const toolNames = provider.requests[0].body.tools.map(tool => tool.function.name);
  assert.ok(toolNames.includes('forge_sum'));
  for (const name of ['read', 'write', 'edit', 'bash', 'powershell']) assert.ok(!toolNames.includes(name));
  assert.equal(result.promptTokens, 28);
  assert.equal(result.completionTokens, 10);
  assert.ok(result.messages.some(message => message.role === 'toolResult'));
});

test('a Forge approval pause ends execution before any follow-up model request', { timeout: 30000 }, async t => {
  const provider = await mockProvider(t, (_body, response) => requestTool(response));
  let calls = 0;
  const result = await runAgent(requestFor(provider, { tools: [sumTool] }), {
    executeTool: async () => {
      calls += 1;
      return { pause: true, content: { approvalRequired: true } };
    },
  });
  assert.equal(calls, 1);
  assert.equal(provider.requests.length, 1);
  assert.equal(result.paused, true);
  assert.ok(Array.isArray(result.pendingToolCalls) && result.pendingToolCalls.length > 0);
});

test('a failed Forge tool is retained as an error in native Pi history', { timeout: 30000 }, async t => {
  const provider = await mockProvider(t, (_body, response, index) => {
    if (index === 1) return requestTool(response);
    finish(response, 'The tool failed; no result was produced.');
  });
  const result = await runAgent(requestFor(provider, { tools: [sumTool] }), {
    executeTool: async () => ({ isError: true, content: 'FORGE_CONTROLLED_TOOL_FAILED' }),
  });
  assert.equal(provider.requests.length, 2);
  const toolResult = result.messages.find(message => message.role === 'toolResult' && message.toolCallId === 'call-forge-sum');
  assert.ok(toolResult);
  assert.equal(toolResult.isError, true);
  assert.ok(JSON.stringify(toolResult.content).includes('FORGE_CONTROLLED_TOOL_FAILED'));
});

test('AbortSignal interrupts an unfinished real Pi provider stream', { timeout: 30000 }, async t => {
  const provider = await mockProvider(t, (_body, response) => {
    begin(response);
    chunk(response, { role: 'assistant', content: 'started' });
  });
  const controller = new AbortController();
  let sawText = false;
  let result;
  let failure;
  try {
    result = await runAgent(requestFor(provider), {
      signal: controller.signal,
      emit: event => {
        if (event.type === 'text_delta') {
          sawText = true;
          controller.abort(new Error('local test cancellation'));
        }
      },
    });
  } catch (error) {
    failure = error;
  }
  assert.equal(sawText, true);
  assert.equal(provider.requests.length, 1);
  assert.ok(failure || result?.aborted === true || result?.messages?.some(message => message.stopReason === 'aborted'), 'Cancellation must be observable to the caller');
});

test('approval continuation uses the original pending tool ID and does not repeat a completed tool', { timeout: 30000 }, async t => {
  const approvalTool = { name: 'forge_approved_write', description: 'A write requiring Forge approval.', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } };
  const provider = await mockProvider(t, (body, response, index) => {
    if (index === 1) return requestToolBatch(response, [
      { id: 'call-completed-read', name: 'forge_sum', args: { a: 2, b: 3 } },
      { id: 'call-original-approval', name: 'forge_approved_write', args: { text: 'approved-content' } },
    ]);
    const results = body.messages.filter(message => message.role === 'tool');
    assert.equal(results.filter(message => message.tool_call_id === 'call-completed-read').length, 1);
    assert.equal(results.filter(message => message.tool_call_id === 'call-original-approval').length, 1);
    finish(response, 'The approved write completed.');
  });
  const calls = [];
  const initial = await runAgent(requestFor(provider, { tools: [sumTool, approvalTool] }), {
    executeTool: async (name, args, id) => {
      calls.push({ phase: 'initial', name, args, id });
      return name === 'forge_sum' ? { content: 5 } : { pause: true, content: { approvalRequired: true } };
    },
  });
  assert.equal(initial.paused, true);
  assert.equal(initial.pendingToolCalls.length, 1);
  const resumed = await runAgent(requestFor(provider, { tools: [sumTool, approvalTool], piMessages: initial.messages, input: undefined }), {
    executeTool: async (name, args, id) => {
      calls.push({ phase: 'resumed', name, args, id });
      return { content: { committed: true } };
    },
  });
  assert.equal(resumed.paused, false);
  assert.equal(resumed.content, 'The approved write completed.');
  assert.equal(provider.requests.length, 2);
  assert.equal(calls.filter(call => call.name === 'forge_sum').length, 1);
  assert.deepEqual(calls.filter(call => call.phase === 'resumed'), [{ phase: 'resumed', name: 'forge_approved_write', args: { text: 'approved-content' }, id: 'call-original-approval' }]);
  assert.equal(resumed.pendingToolCalls.length, 0);
});

const spawnTool = { name: 'spawn_agent', description: 'Delegate one bounded research task.', parameters: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] } };

test('spawn_agent creates an actual child Pi SDK request and aggregates parent and child usage', { timeout: 30000 }, async t => {
  const provider = await mockProvider(t, (body, response, index) => {
    if (index === 1) return requestToolBatch(response, [{ id: 'call-spawn-child', name: 'spawn_agent', args: { task: 'Read and summarize a local fixture.' } }]);
    if (index === 2) {
      assert.ok(JSON.stringify(body.messages).includes('Read and summarize a local fixture.'));
      assert.ok(!(body.tools || []).some(tool => tool.function.name === 'spawn_agent'));
      return finish(response, 'Child evidence from the local fixture.', 7, 3);
    }
    assert.ok(body.messages.some(message => message.role === 'tool' && message.tool_call_id === 'call-spawn-child' && JSON.stringify(message.content).includes('Child evidence from the local fixture.')));
    finish(response, 'Parent report includes the child evidence.', 17, 6);
  });
  const events = [];
  let brokerCalls = 0;
  const result = await runAgent(requestFor(provider, { tools: [spawnTool] }), {
    emit: event => events.push(event),
    executeTool: async () => { brokerCalls += 1; return { content: 'Unexpected broker call' }; },
  });
  assert.equal(provider.requests.length, 3);
  assert.equal(result.content, 'Parent report includes the child evidence.');
  assert.equal(result.promptTokens, 35);
  assert.equal(result.completionTokens, 13);
  assert.equal(events.filter(event => event.type === 'subagent_start').length, 1);
  assert.equal(events.filter(event => event.type === 'subagent_end').length, 1);
  assert.equal(brokerCalls, 0);
});

test('a child model cannot recursively invoke spawn_agent even when it emits that tool name', { timeout: 30000 }, async t => {
  const provider = await mockProvider(t, (body, response, index) => {
    if (index === 1) return requestToolBatch(response, [{ id: 'call-first-child', name: 'spawn_agent', args: { task: 'Complete the child fixture.' } }]);
    if (index === 2) {
      assert.ok(!(body.tools || []).some(tool => tool.function.name === 'spawn_agent'));
      return requestToolBatch(response, [{ id: 'call-forbidden-grandchild', name: 'spawn_agent', args: { task: 'A recursive task that must never start.' } }]);
    }
    if (index === 3) {
      assert.ok(body.messages.some(message => message.role === 'tool' && message.tool_call_id === 'call-forbidden-grandchild'));
      return finish(response, 'Child completed without recursion.', 7, 3);
    }
    finish(response, 'Parent completed safely.', 17, 6);
  });
  const events = [];
  let brokerCalls = 0;
  const result = await runAgent(requestFor(provider, { tools: [spawnTool] }), {
    emit: event => events.push(event),
    executeTool: async () => { brokerCalls += 1; return { content: 'Unexpected broker call' }; },
  });
  assert.equal(provider.requests.length, 4);
  assert.equal(events.filter(event => event.type === 'subagent_start').length, 1);
  assert.equal(events.filter(event => event.type === 'subagent_end').length, 1);
  assert.equal(brokerCalls, 0);
  assert.equal(result.content, 'Parent completed safely.');
});
