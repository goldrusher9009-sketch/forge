'use strict';

const crypto = require('node:crypto');
const http = require('node:http');

if (process.env.NODE_ENV !== 'test') {
  throw new Error('SANDBOX_MODEL_MOCK_TEST_ONLY');
}

const port = Number(process.env.MOCK_MODEL_PORT || 4010);

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function respond(res, message) {
  const payload = JSON.stringify({
    id: `mock-${crypto.randomUUID()}`,
    object: 'chat.completion',
    choices: [{ index: 0, finish_reason: message.tool_calls?.length ? 'tool_calls' : 'stop', message }],
    usage: { prompt_tokens: 14, completion_tokens: 8, total_tokens: 22, cost: 0.000022 },
  });
  res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) });
  res.end(payload);
}

function tool(name, args) {
  return {
    role: 'assistant', content: '',
    tool_calls: [{ id: `call_${crypto.randomUUID().replace(/-/g, '')}`, type: 'function', function: { name, arguments: JSON.stringify(args) } }],
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end('{"error":"mock route not found"}');
    return;
  }
  const request = await body(req);
  const text = (request.messages || []).map(message => String(message.content || '')).join('\n');
  if (text.includes('browser acceptance hold model')) {
    const timer = setTimeout(() => respond(res, { role: 'assistant', content: 'The held response completed.' }), 60_000);
    req.once('close', () => clearTimeout(timer));
    return;
  }
  if (text.includes('browser acceptance approval') && !text.includes('The user rejected this external action') && !text.includes('Forge tool result for')) {
    respond(res, tool('sandbox_browser', { actions: [{ action: 'navigate', url: 'https://example.com' }, { action: 'click', selector: 'a' }] }));
    return;
  }
  if (text.includes('browser acceptance file') && !text.includes('Forge tool result for')) {
    respond(res, tool('sandbox_file', { operation: 'write', path: 'browser-acceptance.txt', content: 'Browser acceptance evidence.\n' }));
    return;
  }
  respond(res, { role: 'assistant', content: 'Browser acceptance task completed with a durable result Artifact.' });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Forge sandbox mock model listening on 127.0.0.1:${port}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
