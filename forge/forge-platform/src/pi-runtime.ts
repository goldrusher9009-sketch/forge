import { estimateManagedInput } from './image-budget';
import crypto from 'node:crypto';
import type { Express } from 'express';
import { getOpenRouterModel, isFreeOpenRouterModel, matchesOpenRouterModel, getOpenRouterPriceBounds, normalizeOpenRouterRequest, OPENROUTER_RETAIL_MULTIPLIER } from './openrouter-catalog';

export type PiTool = { name: string; description: string; parameters: Record<string, any> };
/** Pi SDK may wrap our gateway's structured budget rejection in an HTTP label. */
export function piRuntimeFailure(message: unknown): string {
  const text = typeof message === 'string' ? message : 'PI_RUN_FAILED';
  const wrapped = /^(?:400|402):\s*(\{.*\})$/s.exec(text);
  if (!wrapped) return text;
  try {
    const body = JSON.parse(wrapped[1]), code = body.error?.message ?? body.message;
    if (['PI_RUN_COST_BUDGET_EXHAUSTED','PI_RUN_TOKEN_BUDGET_EXCEEDED','PI_RUN_BUDGET_EXHAUSTED'].includes(code)) return code;
  } catch { /* Preserve non-gateway errors verbatim. */ }
  return text;
}
export type PiToolResult = { content: any; isError?: boolean; pause?: boolean };
export type PiProviderUsage = {
  promptTokens: number; completionTokens: number; totalTokens: number;
  providerCostUsd?: number; generationId?: string; cachedInputTokens?: number; cacheWriteTokens?: number; reasoningTokens?: number;
  costSource?: 'openrouter_usage' | 'openrouter_generation';
};
export type PiZeroChargeEvidence = { source: 'openrouter_http_status'; policy: 'openrouter_pre_admission_402_v1'; httpStatus: 402 };
export type PiProviderReceipt = {
  version: 1; requestId: string; userId: string; runId: string; provider: string; model: string;
  state: 'started' | 'completed' | 'failed' | 'cancelled' | 'not_sent' | 'rejected';
  usageStatus: 'pending' | 'reported' | 'unknown' | 'not_sent' | 'not_charged';
  startedAt: string; endedAt?: string; httpStatus?: number; generationId?: string; zeroChargeEvidence?: PiZeroChargeEvidence;
  reservation: { inputTokens: number; outputTokens: number; totalTokens: number; costUsd?: number; basis: 'utf8_bytes_plus_output_limit' };
  usage?: PiProviderUsage;
};
const openRouterGenerationId = (value: any): string | undefined => typeof value === 'string' && /^gen-[a-zA-Z0-9_-]{1,240}$/.test(value) ? value : undefined;

/** HTTP 402 before OpenRouter admits a generation is a sent, rejected request.
 * Never generalize this to HTTP 200 error chunks, other providers, or transport loss. */
export function classifyOpenRouterFailure(provider: string, httpStatus: number | undefined, upstreamUrl: URL | string) {
  if (provider !== 'openrouter' || httpStatus !== 402) return undefined;
  let url: URL; try { url = new URL(upstreamUrl); } catch { return undefined; }
  if (url.origin !== 'https://openrouter.ai' || url.pathname !== '/api/v1/chat/completions' || url.username || url.password) return undefined;
  return { state: 'rejected' as const, usageStatus: 'not_charged' as const,
    zeroChargeEvidence: { source: 'openrouter_http_status', policy: 'openrouter_pre_admission_402_v1', httpStatus: 402 } as PiZeroChargeEvidence };
}

/** Read only a generation actually observed on this credential's request. A model
 * mismatch, unavailable cost or incomplete record remains unknown, never zero. */
export async function queryOpenRouterGeneration(apiKey: string, id: string, options: {
  model: string; signal?: AbortSignal; fetcher?: typeof fetch;
}): Promise<PiProviderUsage | undefined> {
  if (!apiKey || !openRouterGenerationId(id) || typeof options?.model !== 'string' || !options.model || options.signal?.aborted) return undefined;
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 5000);
  try {
    const url = new URL('https://openrouter.ai/api/v1/generation'); url.searchParams.set('id', id);
    const response = await (options.fetcher || fetch)(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }, signal: controller.signal, redirect: 'error',
    });
    if (!response.ok || !response.body) return undefined;
    const chunks: Uint8Array[] = []; let bytes = 0;
    for await (const chunk of response.body as any) {
      bytes += chunk.byteLength;
      if (bytes > 256 * 1024) { controller.abort(); return undefined; }
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))?.data;
    if (!data || data.id !== id || !matchesOpenRouterModel(options.model, data.model)) return undefined;
    const count = (value: any) => Number.isSafeInteger(value) && value >= 0 && value <= 1000000000;
    const promptTokens = data.native_tokens_prompt ?? data.tokens_prompt;
    const completionTokens = data.native_tokens_completion ?? data.tokens_completion;
    if (!count(promptTokens) || !count(completionTokens) || !Number.isSafeInteger(promptTokens + completionTokens)
      || typeof data.total_cost !== 'number' || !Number.isFinite(data.total_cost) || data.total_cost < 0) return undefined;
    const result: PiProviderUsage = { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens,
      providerCostUsd: data.total_cost, generationId: id, costSource: 'openrouter_generation' };
    for (const [source, key, maximum] of [
      ['native_tokens_cached', 'cachedInputTokens', promptTokens], ['native_tokens_cache_write', 'cacheWriteTokens', promptTokens],
      ['native_tokens_reasoning', 'reasoningTokens', completionTokens],
    ] as const) if (count(data[source]) && data[source] <= maximum) result[key] = data[source];
    return result;
  } catch { return undefined; }
  finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort); }
}
export type PiRunOptions = {
  userId: string; runId: string; provider: string; model: string; apiKey: string;
  images?: Array<{type:'image';data:string;mimeType:string}>;
  managedBilling?: boolean;
  systemPrompt: string; messages?: any[]; piMessages?: any[]; piSession?: any; input?: string; plan?: any[]; ecosystem?: boolean; enableMcp?: boolean; allowedTools?: string[];
  modelLimits?: { contextWindow: number; maxTokens: number }; onStarted?: (workerRunId: string) => void;
  recoveredControls?: Array<{ mode: string; message: string; clientMessageId: string }>;
  costBudget?: { maxUsd: number; inputPerMillion: number; outputPerMillion: number };
  tools: PiTool[]; maxTurns?: number; maxTokens?: number; signal?: AbortSignal;
  onEvent?: (event: any) => void | Promise<void>;
  // Persist by requestId. Started receipts are awaited before external dispatch;
  // terminal receipts are drained before this run returns, including cancellation.
  // Unknown reservations are pending exposure, never a precise customer charge.
  onProviderReceipt?: (receipt: PiProviderReceipt) => void | Promise<void>;
  executeTool: (name: string, args: any, toolCallId: string) => Promise<PiToolResult>;
};
type GatewayGrant = {
  token: string; upstream: URL; api: string; model: string; apiKey: string;
  headers: Record<string, string>; controller: AbortController; expires: number;
  requests: number; maxRequests: number; remaining: number; chargedInput: number;
  remainingUsd?: number; inputPerMillion?: number; outputPerMillion?: number;
  userId: string; runId: string; provider: string; onProviderReceipt?: PiRunOptions['onProviderReceipt'];
  inFlight: Set<Promise<void>>; receiptError?: Error;
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

export async function controlPiRun(workerRunId: string, body: { mode: string; message?: string; clientMessageId?: string }) {
  const { base, token } = workerConfig();
  const response = await fetch(`${base}/v1/runs/${encodeURIComponent(workerRunId)}/${body.mode === 'cancel' ? 'abort' : 'control'}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
  });
  const data: any = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'PI_CONTROL_FAILED'), { statusCode: response.status });
  return data;
}

// Operator limits are trusted deployment configuration. Browser-supplied model
// capacity is never accepted. Missing entries use the worker's pinned Pi catalog.
export function operatorModelLimits(provider: string, model: string) {
  const raw = process.env.FORGE_PI_MODEL_LIMITS;
  if (!raw) return undefined;
  let config: any;
  try { config = JSON.parse(raw); } catch { throw new Error('PI_MODEL_LIMITS_CONFIG_INVALID'); }
  const limits = config?.[`${provider}/${model}`];
  if (!limits) return undefined;
  if (!Number.isInteger(limits.contextWindow) || limits.contextWindow < 4096 || limits.contextWindow > 2000000 || !Number.isInteger(limits.maxTokens) || limits.maxTokens < 128 || limits.maxTokens >= limits.contextWindow) throw new Error('PI_MODEL_LIMITS_CONFIG_INVALID');
  return { contextWindow: limits.contextWindow, maxTokens: limits.maxTokens };
}

export function resolveModel(provider: string, model: string) {
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

// Observe only the public provider's usage fields. Never retain response text,
// request bodies or credentials in a billing receipt. Incomplete/malformed usage
// stays unknown; the reservation remains available for explicit reconciliation.
export function providerUsageObserver(api: string, options: { provider?: string; model?: string } = {}) {
  const decoder = new TextDecoder();
  let buffer = '', invalid = false, finalUsage = false, stopped = false;
  let prompt: number | undefined, completion: number | undefined;
  let anthropicInput: number | undefined, cacheRead = 0, cacheWrite = 0;
  let generationId: string | undefined;
  let providerCostUsd: number | undefined, cachedInputTokens: number | undefined, cacheWriteTokens: number | undefined, reasoningTokens: number | undefined;
  const count = (value: any): number | undefined => Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  const parse = (record: string) => {
    const data = record.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data) return;
    if (data.trim() === '[DONE]') { if (prompt !== undefined && completion !== undefined) finalUsage = true; return; }
    let event: any;
    try { event = JSON.parse(data); } catch { invalid = true; return; }
    if (options.provider === 'openrouter') {
      if (options.model && event.model && !matchesOpenRouterModel(options.model, event.model)) { invalid = true; return; }
      const observedId = openRouterGenerationId(event.id);
      if (generationId && observedId && generationId !== observedId) { invalid = true; return; }
      if (observedId) generationId = observedId;
    }
    if (api === 'anthropic-messages') {
      const usage = event.type === 'message_start' ? event.message?.usage : event.type === 'message_delta' ? event.usage : undefined;
      if (usage) {
        if (count(usage.input_tokens) !== undefined) anthropicInput = count(usage.input_tokens);
        if (count(usage.cache_read_input_tokens) !== undefined) cacheRead = usage.cache_read_input_tokens;
        if (count(usage.cache_creation_input_tokens) !== undefined) cacheWrite = usage.cache_creation_input_tokens;
        if (anthropicInput !== undefined) prompt = anthropicInput + cacheRead + cacheWrite;
        if (count(usage.output_tokens) !== undefined) completion = count(usage.output_tokens);
      }
      if (event.type === 'message_delta' && event.delta?.stop_reason && count(usage?.output_tokens) !== undefined) finalUsage = true;
      if (event.type === 'message_stop' && prompt !== undefined && completion !== undefined) finalUsage = true;
    } else if (api === 'google-generative-ai') {
      if (event.candidates?.some((candidate: any) => candidate.finishReason)) stopped = true;
      const usage = event.usageMetadata;
      if (count(usage?.promptTokenCount) !== undefined && count(usage?.candidatesTokenCount) !== undefined) {
        prompt = usage.promptTokenCount;
        completion = usage.candidatesTokenCount + (count(usage.thoughtsTokenCount) || 0);
        if (stopped) finalUsage = true;
      }
    } else {
      if (event.choices?.some((choice: any) => choice.finish_reason)) stopped = true;
      const usage = event.usage;
      if (count(usage?.prompt_tokens) !== undefined && count(usage?.completion_tokens) !== undefined) {
        if (usage.total_tokens !== undefined && (count(usage.total_tokens) === undefined || usage.total_tokens !== usage.prompt_tokens + usage.completion_tokens)) { invalid = true; return; }
        prompt = usage.prompt_tokens; completion = usage.completion_tokens;
        if (options.provider === 'openrouter') {
          if (usage.cost !== undefined) {
            if (typeof usage.cost !== 'number' || !Number.isFinite(usage.cost) || usage.cost < 0) { invalid = true; return; }
            providerCostUsd = usage.cost;
          }
          const cached = count(usage.prompt_tokens_details?.cached_tokens);
          const written = count(usage.prompt_tokens_details?.cache_write_tokens);
          const reasoning = count(usage.completion_tokens_details?.reasoning_tokens);
          if ((cached !== undefined && cached > prompt!) || (written !== undefined && written > prompt!) || (reasoning !== undefined && reasoning > completion!)) { invalid = true; return; }
          cachedInputTokens = cached; cacheWriteTokens = written; reasoningTokens = reasoning;
        }
        if (stopped) finalUsage = true;
      }
    }
  };
  return {
    write(chunk: Uint8Array) {
      if (invalid) return;
      buffer += decoder.decode(chunk, { stream: true });
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        if (boundary.index > 1024 * 1024) { invalid = true; buffer = ''; return; }
        parse(buffer.slice(0, boundary.index));
        buffer = buffer.slice(boundary.index + boundary[0].length);
      }
      if (buffer.length > 1024 * 1024) { invalid = true; buffer = ''; }
    },
    result() {
      if (invalid || !finalUsage || prompt === undefined || completion === undefined || !Number.isSafeInteger(prompt + completion)) return undefined;
      return { promptTokens: prompt, completionTokens: completion, totalTokens: prompt + completion,
        ...(generationId ? { generationId } : {}),
        ...(providerCostUsd === undefined ? {} : { providerCostUsd, costSource: 'openrouter_usage' as const }),
        ...(cachedInputTokens === undefined ? {} : { cachedInputTokens }), ...(cacheWriteTokens === undefined ? {} : { cacheWriteTokens }),
        ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
      };
    },
    generationId: () => invalid ? undefined : generationId,
  };
}

/** The worker gets an expiring, single-run model capability, never the customer's key. */
export function registerPiModelGateway(app: Express): void {
  app.post('/api/internal/pi/models/:grant/*', async (req, res) => {
    const grant = grants.get(String(req.params.grant));
    const authorization = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || String(req.headers['x-api-key'] || req.headers['x-goog-api-key'] || '');
    if (!grant || Buffer.byteLength(authorization) !== Buffer.byteLength(grant.token) || !crypto.timingSafeEqual(Buffer.from(authorization), Buffer.from(grant.token)) || grant.expires < Date.now() || grant.controller.signal.aborted) {
      res.status(403).json({ error: { message: 'PI_MODEL_CAPABILITY_INVALID' } }); return;
    }
    // The SDK can start its next tool turn as soon as the response stream ends,
    // before the previous durable receipt finishes. Wait before budget admission.
    await Promise.all([...grant.inFlight]);
    if (grant.controller.signal.aborted || grant.receiptError || grant.expires < Date.now()) {
      res.status(403).json({ error: { message: grant.receiptError?.message || 'PI_MODEL_CAPABILITY_INVALID' } }); return;
    }
    const suffix = '/' + String((req.params as Record<string, string>)[0] || '');
    if (/[\\%]|\.\./.test(suffix)) {
      res.status(400).json({ error: { message: 'PI_MODEL_REQUEST_REJECTED' } }); return;
    }
    const allowed = grant.api === 'anthropic-messages' ? suffix === '/v1/messages' : grant.api === 'openai-completions' ? suffix === '/v1/chat/completions' : /^\/v1beta\/models\/[^/]+:(streamGenerateContent|generateContent)$/.test(suffix);
    let body: any = req.body;
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
    const managedModel = grant.provider === 'openrouter' ? getOpenRouterModel(grant.model) : undefined;
    if (managedModel) {
      try { body = normalizeOpenRouterRequest(grant.model, body); }
      catch (error: any) { res.status(400).json({ error: { message: error.code || 'PI_MODEL_REQUEST_REJECTED' } }); return; }
    }
    let inputEstimate:number;
    try { inputEstimate=managedModel?estimateManagedInput(grant.model,body).inputTokens:Buffer.byteLength(JSON.stringify(body),'utf8'); }
    catch(error:any){res.status(400).json({error:{message:error.code||'PI_MODEL_REQUEST_REJECTED'}});return;}

    // Every provider call consumes input allowance, including repeated history,
    // cache reads, retries, compaction and extensions. This is a reservation, not
    // the usage ledger; settled provider usage is billed separately by Forge.
    const inputCharge = inputEstimate;
    const available = Math.floor(grant.remaining - inputCharge);
    if (++grant.requests > grant.maxRequests || available < 64) {
      res.status(429).json({ error: { message: 'PI_RUN_MODEL_BUDGET_EXHAUSTED' } }); return;
    }
    const requested = Number(body.max_tokens || body.max_completion_tokens || body.generationConfig?.maxOutputTokens || 4096);
    let outputLimit = Math.max(1, Math.floor(Math.min(Number.isFinite(requested) ? requested : 4096, available, 16384)));
    let reservedUsd: number | undefined;
    const nativeBounds = managedModel ? getOpenRouterPriceBounds(grant.model, inputEstimate) : undefined;
    // Reservations are retail USD; usage.providerCostUsd is always native USD.
    const inputRate = Math.max(grant.inputPerMillion || 0, nativeBounds ? Math.max(nativeBounds.prompt, nativeBounds.cacheWrite, nativeBounds.cacheWrite1h || 0) * OPENROUTER_RETAIL_MULTIPLIER : 0);
    const outputRate = Math.max(grant.outputPerMillion || 0, nativeBounds ? nativeBounds.completion * OPENROUTER_RETAIL_MULTIPLIER : 0);
    const requestUsd = nativeBounds ? nativeBounds.request * OPENROUTER_RETAIL_MULTIPLIER : 0;
    if (grant.remainingUsd !== undefined) {
      // UTF-8 bytes deliberately over-reserve text input at the configured tariff.
      // Cache discounts are not assumed, and no speculative usage refund can fund
      // a second request after a transport failure with unknown provider usage.
      const inputUsd = inputCharge * inputRate / 1000000 + requestUsd;
      const afterInputUsd = grant.remainingUsd - inputUsd;
      const affordableOutput = outputRate === 0 && afterInputUsd >= 0 ? outputLimit : Math.floor(afterInputUsd * 1000000 / outputRate);
      if (affordableOutput < 1) { res.status(402).json({ error: { message: 'PI_RUN_COST_BUDGET_EXHAUSTED' } }); return; }
      outputLimit = Math.min(outputLimit, affordableOutput);
      reservedUsd = inputUsd + outputLimit * outputRate / 1000000;
    }
    if (managedModel) {
      try { body = normalizeOpenRouterRequest(grant.model, body, { promptTokens: inputEstimate, maxOutputTokens: outputLimit }); }
      catch (error: any) { res.status(400).json({ error: { message: error.code || 'PI_MODEL_REQUEST_REJECTED' } }); return; }
      outputLimit = body.max_tokens;
      reservedUsd = inputCharge * inputRate / 1000000 + outputLimit * outputRate / 1000000 + requestUsd;
    }
    if (grant.remainingUsd !== undefined && reservedUsd !== undefined) grant.remainingUsd -= reservedUsd;
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
    let finishReceipt!: () => void;
    const pendingReceipt = new Promise<void>(resolve => { finishReceipt = resolve; });
    grant.inFlight.add(pendingReceipt);
    const receipt: PiProviderReceipt = {
      version: 1, requestId: crypto.randomUUID(), userId: grant.userId, runId: grant.runId, provider: grant.provider, model: grant.model,
      state: 'started', usageStatus: 'pending', startedAt: new Date().toISOString(),
      reservation: { inputTokens: inputCharge, outputTokens: outputLimit, totalTokens: inputCharge + outputLimit,
        ...(reservedUsd === undefined ? {} : { costUsd: reservedUsd }), basis: 'utf8_bytes_plus_output_limit' },
    };
    const persist = async (next: PiProviderReceipt) => {
      try { await grant.onProviderReceipt?.(next); }
      catch (error: any) {
        grant.receiptError = /^BILLING_[A-Z_]+$/.test(String(error?.code || error?.message || ''))
          ? Object.assign(new Error(error.code || error.message), { statusCode: error.statusCode || 402, code: error.code || error.message })
          : unavailable('PI_PROVIDER_RECEIPT_PERSIST_FAILED');
        grant.controller.abort(grant.receiptError);
        throw grant.receiptError;
      }
    };
    const usage = providerUsageObserver(grant.api, { provider: grant.provider, model: grant.model });
    let dispatched = false, completed = false, httpStatus: number | undefined;
    try {
      await persist(receipt);
      if (controller.signal.aborted) throw new Error('PI_PROVIDER_CANCELLED_BEFORE_DISPATCH');
      dispatched = true;
      const response = await fetch(target, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal, redirect: 'error' });
      httpStatus = response.status;
      res.status(response.status).set('Content-Type', response.headers.get('content-type') || 'application/json').set('Cache-Control', 'no-store');
      if (!response.ok) { res.json({ error: { message: `PI_PROVIDER_HTTP_${response.status}` } }); return; }
      if (!response.body) throw new Error('PI_PROVIDER_EMPTY_BODY');
      for await (const chunk of response.body as any) {
        usage.write(chunk);
        if (res.destroyed) break;
        if (!res.write(chunk)) await new Promise<void>(resolve => { res.once('drain', resolve); res.once('close', resolve); });
      }
      completed = !controller.signal.aborted && !res.destroyed;
      res.end();
    } catch {
      if (!res.headersSent) res.status(502).json({ error: { message: 'PI_PROVIDER_TRANSPORT_FAILED' } });
      else res.end();
    } finally {
      clearTimeout(timer); grant.controller.signal.removeEventListener('abort', abort); res.removeListener('close', abort);
      let reported: PiProviderUsage | undefined = usage.result();
      const generationId = usage.generationId();
      if (grant.provider === 'openrouter' && reported?.providerCostUsd === undefined && generationId && httpStatus === 200) {
        reported = await queryOpenRouterGeneration(grant.apiKey, generationId, { model: grant.model }) || reported;
      }
      if (grant.provider === 'openrouter' && reported?.providerCostUsd === undefined) reported = undefined;
      const rejection = dispatched ? classifyOpenRouterFailure(grant.provider, httpStatus, target) : undefined;
      try {
        await persist({ ...receipt, endedAt: new Date().toISOString(), ...(httpStatus === undefined ? {} : { httpStatus }),
          state: !dispatched ? 'not_sent' : completed ? 'completed' : controller.signal.aborted ? 'cancelled' : 'failed',
          usageStatus: !dispatched ? 'not_sent' : reported ? 'reported' : 'unknown', ...(reported ? { usage: reported } : {}),
          ...(generationId ? { generationId } : {}), ...(rejection || {}),
        });
        // Release an unused token reservation only after a completed supplier
        // receipt is durably saved. The next call still reserves its entire input,
        // including repeated history. Unknown usage and failed writes retain the
        // original hold; actual usage above the estimate reduces the allowance.
        if (completed && grant.onProviderReceipt && reported && Number.isSafeInteger(reported.totalTokens) && reported.totalTokens >= 0) {
          grant.remaining += receipt.reservation.totalTokens - reported.totalTokens;
        }
        // Retail money follows its own supplier cost settlement, not token counts.
        if (completed && grant.provider === 'openrouter' && grant.onProviderReceipt &&
            reported?.providerCostUsd !== undefined && Number.isFinite(reported.providerCostUsd) && reported.providerCostUsd >= 0 &&
            grant.remainingUsd !== undefined && reservedUsd !== undefined) {
          const chargedUsd = Math.ceil(reported.providerCostUsd * OPENROUTER_RETAIL_MULTIPLIER * 1e9) / 1e9;
          grant.remainingUsd += reservedUsd - chargedUsd;
        }
      } catch { /* runPiAgent propagates receipt failure after all callbacks drain. */ }
      finally { grant.inFlight.delete(pendingReceipt); finishReceipt(); }
    }
  });
}

export async function runPiAgent(options: PiRunOptions): Promise<any> {
  const { base, token } = workerConfig();
  const resolved = resolveModel(options.provider, options.model);
  if (options.managedBilling && (options.provider !== 'openrouter' || !getOpenRouterModel(resolved.model))) throw new Error('PI_MANAGED_MODEL_NOT_ALLOWED');
  const limits = options.modelLimits || operatorModelLimits(options.provider, resolved.model);
  const freeBudget = options.managedBilling && isFreeOpenRouterModel(resolved.model)
    && options.costBudget?.maxUsd === 0 && options.costBudget.inputPerMillion === 0 && options.costBudget.outputPerMillion === 0;
  if (options.costBudget && !freeBudget && (!Number.isFinite(options.costBudget.maxUsd) || options.costBudget.maxUsd <= 0 || !Number.isFinite(options.costBudget.inputPerMillion) || options.costBudget.inputPerMillion <= 0 || !Number.isFinite(options.costBudget.outputPerMillion) || options.costBudget.outputPerMillion <= 0)) throw new Error('PI_COST_BUDGET_INVALID');
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort(); else options.signal?.addEventListener('abort', abort, { once: true });
  const id = crypto.randomUUID();
  const grantToken = crypto.randomBytes(32).toString('base64url');
  const grant: GatewayGrant = {
    ...resolved, token: grantToken, apiKey: options.apiKey, headers: {}, controller,
    userId: options.userId, runId: options.runId, provider: options.provider, onProviderReceipt: options.onProviderReceipt, inFlight: new Set(),
    expires: Date.now() + 30 * 60000, requests: 0, chargedInput: 0,
    maxRequests: Math.max(1, Math.min(options.maxTurns || 16, 64)) + 4,
    remaining: Math.max(1024, Math.min(options.maxTokens || 200000, 1000000)),
    ...(options.costBudget ? { remainingUsd: options.costBudget.maxUsd, inputPerMillion: options.costBudget.inputPerMillion, outputPerMillion: options.costBudget.outputPerMillion } : {}),
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
        messages: options.messages, piMessages: options.piMessages, piSession: options.piSession, input: options.input, images: options.images,
        plan: options.plan, ecosystem: options.ecosystem, recoveredControls: options.recoveredControls,
        tools: options.tools, allowedTools: options.allowedTools, maxTurns: options.maxTurns, maxTokens: options.maxTokens,
        enableMcp: options.enableMcp !== false && options.ecosystem !== false && Object.prototype.hasOwnProperty.call(mcpReadOnlyPolicy(), options.userId),
        model: { id: resolved.model, api: resolved.api, sourceProvider: options.provider, ...limits,
          baseUrl: proxyBase + (resolved.api === 'openai-completions' ? '/v1' : resolved.api === 'google-generative-ai' ? '/v1beta' : ''),
          compat: resolved.compat, token: grantToken },
      }),
    });
    if (response.status === 429) {
      // Only the worker's explicit pre-admission rejection proves no run started.
      // Provider throttling, proxy errors and lost streams carry no such guarantee.
      const rejection = await response.json().catch(() => null) as any;
      if (['PI_WORKER_CAPACITY', 'PI_WORKER_MCP_CAPACITY'].includes(rejection?.error)) {
        throw Object.assign(new Error('PI_RUNTIME_BUSY'), { code: 'PI_RUNTIME_BUSY', statusCode: 503, beforeAdmission: true });
      }
    }
    if (!response.ok || !response.body) throw unavailable(`PI_RUNTIME_HTTP_${response.status}`);
    let buffer = ''; const decoder = new TextDecoder(); let result: any;
    const handle = async (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (event.type === 'started') { workerRunId = event.workerRunId; options.onStarted?.(event.workerRunId); }
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
      else if (event.type === 'error') {
        if (event.piSession) await options.onEvent?.({ type: 'checkpoint', piSession: event.piSession, messages: event.messages, plan: event.plan });
        throw Object.assign(new Error(piRuntimeFailure(event.error)), { piSession: event.piSession });
      }
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
    // A cancelled NDJSON reader can finish before the provider gateway unwinds.
    // Do not let the caller release its reservation before terminal receipts are
    // persisted. These callbacks are independent of the worker response stream.
    await Promise.allSettled([...grant.inFlight]);
    if (grant.receiptError) throw grant.receiptError;
  }
}
