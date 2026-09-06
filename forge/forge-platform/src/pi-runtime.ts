import crypto from 'node:crypto';
import type { Express } from 'express';

export type PiTool = { name: string; description: string; parameters: Record<string, any> };
export type PiToolResult = { content: any; isError?: boolean; pause?: boolean };
export type PiRunOptions = {
  userId: string; runId: string; provider: string; model: string; apiKey: string;
  systemPrompt: string; messages?: any[]; piMessages?: any[]; input?: string; plan?: any[]; ecosystem?: boolean; enableMcp?: boolean;
  tools: PiTool[]; maxTurns?: number; maxTokens?: number; signal?: AbortSignal;
  onEvent?: (event: any) => void | Promise<void>;
  executeTool: (name: string, args: any, toolCallId: string) => Promise<PiToolResult>;
};
type GatewayGrant = {
  token: string; upstream: URL; api: string; model: string; apiKey: string;
  headers: Record<string, string>; controller: AbortController; expires: number;
  requests: number; maxRequests: number; remaining: number; chargedInput: number;
};
const grants = new Map<string, GatewayGrant>();
const ANTHROPIC_BETA_ALLOWED = new Set([
  'prompt-caching-2024-07-31', 'extended-cache-ttl-2025-04-11', 'interleaved-thinking-2025-05-14',
  'output-128k-2025-02-19', 'context-1m-2025-08-07', 'fine-grained-tool-streaming-2025-05-14',
]);

function mcpReadOnlyPolicy(): Record<string, Record<string, string[]>> {
  const raw = process.env.FORGE_PI_MCP_READ_ONLY_TOOLS;
  if (!raw) return {};
  try {
    const policy = JSON.parse(raw);
    if (!policy || typeof policy !== 'object' || Array.isArray(policy)) return {};
    return policy;
  } catch { return {}; }
}
export function authorizePiMcpTool(userId: string, args: any): PiToolResult {
  const policy = mcpReadOnlyPolicy();
  const servers = Object.prototype.hasOwnProperty.call(policy, userId) ? policy[userId] : null;
  const names = servers && Object.prototype.hasOwnProperty.call(servers, String(args?.serverName)) ? servers[String(args.serverName)] : null;
  const allowed = Array.isArray(names) && names.includes(String(args?.toolName)) && !names.includes('*');
  return { content: { decision: allowed ? 'allow_once' : 'deny', reason: allowed ? 'Operator-authorized read-only MCP capability' : 'MCP tool is not authorized for this user; use Forge approvals for external writes.' }, isError: !allowed };
}

export function piEngineEnabled(): boolean {
  const engine = (process.env.FORGE_AGENT_ENGINE || 'pi').trim().toLowerCase();
  if (!['pi', 'legacy'].includes(engine)) throw new Error('FORGE_AGENT_ENGINE_INVALID');
  return engine === 'pi';
}
function unavailable(message = 'PI_RUNTIME_UNAVAILABLE'): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode: 503 });
}
function workerConfig() {
  const base = process.env.FORGE_PI_WORKER_URL?.trim();
  const token = process.env.FORGE_PI_WORKER_TOKEN?.trim();
  if (!base || !token || token.length < 32) throw unavailable('PI_RUNTIME_NOT_CONFIGURED');
  const url = new URL(base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw unavailable('PI_RUNTIME_URL_INVALID');
  return { base: url.origin, token };
}
export async function assertPiRuntimeAvailable(): Promise<void> {
  const { base, token } = workerConfig();
  try {
    const response = await fetch(`${base}/health`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(4000),
    });
    const data: any = await response.json();
    if (!response.ok || data.engine !== 'pi' || data.ready !== true) throw unavailable();
  } catch (error: any) { throw unavailable(error?.message?.startsWith('PI_') ? error.message : undefined); }
}

function resolveModel(provider: string, model: string) {
  const endpoints: Record<string, string> = {
    openai: 'https://api.openai.com/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    morph: 'https://api.morphllm.com/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/chat/completions',
    xai: 'https://api.x.ai/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    google: 'https://generativelanguage.googleapis.com',
    gemini: 'https://generativelanguage.googleapis.com',
  };
  if (!endpoints[provider]) throw new Error(`PI_PROVIDER_UNSUPPORTED:${provider}`);
  let resolved = model;
  if (provider === 'openrouter') resolved = model.replace(/^~/, '').replace(/^openrouter\//, '');
  if (provider === 'groq') resolved = ({ 'llama-3.3-70b': 'llama-3.3-70b-versatile', 'llama-3.1-70b': 'llama-3.1-70b-versatile', 'llama-3.1-8b': 'llama-3.1-8b-instant', 'mixtral-8x7b': 'mixtral-8x7b-32768', 'gemma2-9b': 'gemma2-9b-it' } as any)[model] || model;
  if (provider === 'mistral') resolved = ({ 'mistral-large': 'mistral-large-latest', 'mistral-small': 'mistral-small-latest', 'mistral-medium': 'mistral-medium-latest', codestral: 'codestral-latest' } as any)[model] || model;
  let upstream = new URL(endpoints[provider]);
  const legacyOpenAIBase = process.env.FORGE_OPENAI_TEST_API_BASE_URL ? process.env.FORGE_OPENAI_TEST_API_BASE_URL.replace(/\/$/, '') + '/chat/completions' : undefined;
  const testUrl = process.env.FORGE_PI_TEST_MODEL_URL || process.env.FORGE_SANDBOX_TEST_OPENAI_CHAT_URL || legacyOpenAIBase;
  if (process.env.NODE_ENV === 'test' && provider === 'openai' && testUrl) {
    upstream = new URL(testUrl);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(upstream.hostname)) throw new Error('PI_TEST_MODEL_URL_MUST_BE_LOOPBACK');
  }
  // Pi cannot detect the real provider from our private gateway URL. Preserve the
  // provider's wire quirks explicitly instead of silently treating every host as OpenAI.
  const compat: Record<string, any> | undefined = provider === 'mistral'
    ? { maxTokensField: 'max_tokens', supportsStore: false, supportsUsageInStreaming: false, supportsDeveloperRole: false, requiresToolResultName: true }
    : provider === 'groq' ? { supportsStore: false }
    : provider === 'openrouter' ? { supportsStore: false, thinkingFormat: 'openrouter', sessionAffinityFormat: 'openrouter',
        supportsDeveloperRole: /^(anthropic|openai)\//.test(resolved), ...(resolved.startsWith('anthropic/') ? { cacheControlFormat: 'anthropic' } : {}) }
    : provider === 'deepseek' ? { maxTokensField: 'max_tokens', supportsStore: false, supportsDeveloperRole: false, requiresReasoningContentOnAssistantMessages: true, thinkingFormat: 'deepseek' }
    : provider === 'xai' ? { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false }
    : provider === 'morph' ? { maxTokensField: 'max_tokens', supportsStore: false, supportsDeveloperRole: false }
    : undefined;
  return { upstream, model: resolved, compat, api: provider === 'anthropic' ? 'anthropic-messages' : ['google', 'gemini'].includes(provider) ? 'google-generative-ai' : 'openai-completions' };
}

/** The worker gets an expiring, single-run model capability, never the customer's key. */
export function registerPiModelGateway(app: Express): void {
  app.post('/api/internal/pi/models/:grant/*', async (req, res) => {
    const grant = grants.get(String(req.params.grant));
    const authorization = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || String(req.headers['x-api-key'] || req.headers['x-goog-api-key'] || '');
    if (!grant || Buffer.byteLength(authorization) !== Buffer.byteLength(grant.token) || !crypto.timingSafeEqual(Buffer.from(authorization), Buffer.from(grant.token)) || grant.expires < Date.now() || grant.controller.signal.aborted) {
      res.status(403).json({ error: { message: 'PI_MODEL_CAPABILITY_INVALID' } }); return;
    }
    const suffix = '/' + String(req.params[0] || '');
    if (/[\\%]|\.\./.test(suffix)) {
      res.status(400).json({ error: { message: 'PI_MODEL_REQUEST_REJECTED' } }); return;
    }
    const allowed = grant.api === 'anthropic-messages' ? suffix === '/v1/messages' : grant.api === 'openai-completions' ? suffix === '/v1/chat/completions' : /^\/v1beta\/models\/[^/]+:(streamGenerateContent|generateContent)$/.test(suffix);
    const body: any = req.body;
    if (!allowed || !body || typeof body !== 'object' || (grant.api !== 'google-generative-ai' && body.model !== grant.model)) {
      res.status(400).json({ error: { message: 'PI_MODEL_REQUEST_REJECTED' } }); return;
    }
    if (grant.api === 'google-generative-ai' && !suffix.startsWith(`/v1beta/models/${encodeURIComponent(grant.model)}:`)) {
      res.status(400).json({ error: { message: 'PI_MODEL_MISMATCH' } }); return;
    }
    // Reserve a conservative per-call allowance at the credential boundary. This also
    // bounds extension-initiated calls, retries, compaction and delegated sessions.
    // Reserve by serialized UTF-8 bytes, including system instructions and tool schemas.
    // This intentionally overestimates ordinary text tokens instead of undercounting CJK
    // or letting an extension hide unbudgeted input in non-message fields.
    const inputEstimate = Math.ceil(Buffer.byteLength(JSON.stringify(body), 'utf8') / 3.5);
    // History is resent on every turn. Charge only the growth over the largest input
    // already billed to this grant so a long conversation is not re-billed each call.
    const inputCharge = Math.max(0, inputEstimate - grant.chargedInput);
    const available = Math.floor(grant.remaining - inputCharge);
    if (++grant.requests > grant.maxRequests || available < 64) {
      res.status(429).json({ error: { message: 'PI_RUN_MODEL_BUDGET_EXHAUSTED' } }); return;
    }
    const requested = Number(body.max_tokens || body.max_completion_tokens || body.generationConfig?.maxOutputTokens || 4096);
    const outputLimit = Math.max(1, Math.floor(Math.min(Number.isFinite(requested) ? requested : 4096, available, 16384)));
    if (grant.api === 'google-generative-ai') body.generationConfig = { ...body.generationConfig, maxOutputTokens: outputLimit };
    else if ('max_completion_tokens' in body) body.max_completion_tokens = outputLimit;
    else body.max_tokens = outputLimit;
    grant.remaining -= inputCharge + outputLimit;
    grant.chargedInput = Math.max(grant.chargedInput, inputEstimate);
    const verb = /:(streamGenerateContent|generateContent)$/.exec(suffix)?.[1];
    const target = grant.api === 'google-generative-ai'
      ? (() => { const u = new URL(grant.upstream); u.pathname = '/v1beta/models/' + encodeURIComponent(grant.model) + ':' + verb; u.search = 'alt=sse'; return u; })()
      : grant.upstream;
    const headers: Record<string, string> = { 'content-type': 'application/json', ...grant.headers };
    if (grant.api === 'anthropic-messages') {
      headers['x-api-key'] = grant.apiKey; headers['anthropic-version'] = '2023-06-01';
      const beta = String(req.headers['anthropic-beta'] || '');
      if (beta && /^[a-z0-9-]+(,[a-z0-9-]+)*$/i.test(beta) && beta.split(',').every(flag => ANTHROPIC_BETA_ALLOWED.has(flag))) headers['anthropic-beta'] = beta;
    } else if (grant.api === 'google-generative-ai') headers['x-goog-api-key'] = grant.apiKey;
    else headers.Authorization = `Bearer ${grant.apiKey}`;
    const controller = new AbortController();
    const abort = () => controller.abort();
    grant.controller.signal.addEventListener('abort', abort, { once: true });
    res.once('close', abort);
    const timer = setTimeout(abort, 180000);
    try {
      const response = await fetch(target, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal, redirect: 'error' });
      res.status(response.status).set('Content-Type', response.headers.get('content-type') || 'application/json').set('Cache-Control', 'no-store');
      if (!response.ok) { res.json({ error: { message: `PI_PROVIDER_HTTP_${response.status}` } }); return; }
      if (!response.body) throw new Error('PI_PROVIDER_EMPTY_BODY');
      for await (const chunk of response.body as any) {
        if (res.destroyed) break;
        if (!res.write(chunk)) await new Promise<void>(resolve => { res.once('drain', resolve); res.once('close', resolve); });
      }
      res.end();
    } catch {
      if (!res.headersSent) res.status(502).json({ error: { message: 'PI_PROVIDER_TRANSPORT_FAILED' } });
      else res.end();
    } finally { clearTimeout(timer); grant.controller.signal.removeEventListener('abort', abort); res.removeListener('close', abort); }
  });
}

export async function runPiAgent(options: PiRunOptions): Promise<any> {
  const { base, token } = workerConfig();
  const resolved = resolveModel(options.provider, options.model);
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort(); else options.signal?.addEventListener('abort', abort, { once: true });
  const id = crypto.randomUUID();
  const grantToken = crypto.randomBytes(32).toString('base64url');
  const grant: GatewayGrant = {
    ...resolved, token: grantToken, apiKey: options.apiKey, headers: {}, controller,
    expires: Date.now() + 30 * 60000, requests: 0, chargedInput: 0,
    maxRequests: Math.max(1, Math.min(options.maxTurns || 16, 64)) + 4,
    remaining: Math.max(1024, Math.min(options.maxTokens || 200000, 1000000)),
  };
  if (options.provider === 'openrouter') grant.headers = { 'HTTP-Referer': 'https://forge-sand-two.vercel.app', 'X-Title': 'Forge Pi' };
  grants.set(id, grant);
  const platformUrl = (process.env.FORGE_PI_PLATFORM_URL || `http://127.0.0.1:${process.env.PORT || 3000}`).replace(/\/$/, '');
  const proxyBase = `${platformUrl}/api/internal/pi/models/${id}`;
  let workerRunId: string | undefined;
  const timer = setTimeout(() => controller.abort(new Error('PI_RUN_DEADLINE')), 30 * 60000);
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    const response = await fetch(`${base}/v1/runs`, {
      method: 'POST', headers: authHeaders, signal: controller.signal,
      body: JSON.stringify({
        userId: options.userId, runId: options.runId, systemPrompt: options.systemPrompt,
        messages: options.messages, piMessages: options.piMessages, input: options.input,
        plan: options.plan, ecosystem: options.ecosystem,
        tools: options.tools, maxTurns: options.maxTurns, maxTokens: options.maxTokens,
        enableMcp: options.enableMcp !== false && options.ecosystem !== false && Object.prototype.hasOwnProperty.call(mcpReadOnlyPolicy(), options.userId),
        model: { id: resolved.model, api: resolved.api,
          baseUrl: proxyBase + (resolved.api === 'openai-completions' ? '/v1' : resolved.api === 'google-generative-ai' ? '/v1beta' : ''),
          compat: resolved.compat, token: grantToken },
      }),
    });
    if (!response.ok || !response.body) throw unavailable(`PI_RUNTIME_HTTP_${response.status}`);
    let buffer = ''; const decoder = new TextDecoder(); let result: any;
    const handle = async (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (event.type === 'started') workerRunId = event.workerRunId;
      else if (event.type === 'tool_request') {
        if (!workerRunId) throw new Error('PI_PROTOCOL_RUN_REQUIRED');
        let output: PiToolResult;
        try { output = await options.executeTool(event.name, event.args, event.toolCallId); }
        catch (error: any) {
          if (controller.signal.aborted) throw error;
          output = { content: { error: String(error?.message || 'FORGE_TOOL_FAILED').slice(0, 2000) }, isError: true };
        }
        const ack = await fetch(`${base}/v1/runs/${encodeURIComponent(workerRunId)}/tools/${encodeURIComponent(event.requestId)}`, {
          method: 'POST', headers: authHeaders, body: JSON.stringify(output), signal: controller.signal,
        });
        if (!ack.ok) throw new Error('PI_TOOL_RESPONSE_REJECTED');
      } else if (event.type === 'result') result = event.result;
      else if (event.type === 'error') throw new Error(event.error || 'PI_RUN_FAILED');
      else await options.onEvent?.(event);
    };
    for await (const chunk of response.body as any) {
      buffer += decoder.decode(chunk, { stream: true });
      if (buffer.length > 16 * 1024 * 1024) throw new Error('PI_EVENT_TOO_LARGE');
      let index: number;
      while ((index = buffer.indexOf('\n')) >= 0) { const line = buffer.slice(0, index); buffer = buffer.slice(index + 1); await handle(line); }
    }
    buffer += decoder.decode(); if (buffer.trim()) await handle(buffer);
    if (!result) throw new Error('PI_RUN_INCOMPLETE');
    if (controller.signal.aborted) throw new Error('PI_RUN_CANCELLED');
    return result;
  } finally {
    clearTimeout(timer); grants.delete(id); controller.abort();
    options.signal?.removeEventListener('abort', abort);
    if (workerRunId) {
      await fetch(`${base}/v1/runs/${encodeURIComponent(workerRunId)}/abort`, {
        method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(3000),
      }).catch(() => undefined);
    }
  }
}
