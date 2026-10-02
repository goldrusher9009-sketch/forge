import crypto from 'node:crypto';
import type { Express, RequestHandler } from 'express';
import { operatorModelLimits, providerUsageObserver, resolveModel, classifyOpenRouterFailure, queryOpenRouterGeneration, type PiProviderReceipt, type PiProviderUsage } from './pi-runtime';
import type { createPiProviderLedger } from './pi-provider-ledger';
import type { createManagedBilling } from './managed-billing';
import { MANAGED_BILLING_VERSION } from './managed-billing';
import { OPENROUTER_CATALOG, OPENROUTER_CATALOG_VERIFIED_AT, OPENROUTER_RETAIL_MULTIPLIER, DEFAULT_OPENROUTER_MODEL, getOpenRouterPriceBounds, isFreeOpenRouterModel, normalizeOpenRouterRequest } from './openrouter-catalog';
import { estimateManagedInput } from './image-budget';

type Database = { prepare(sql: string): any; transaction<T extends (...args: any[]) => any>(fn: T): T };
type Dependencies = {
  db: Database;
  ledger: ReturnType<typeof createPiProviderLedger>;
  billing: ReturnType<typeof createManagedBilling>;
  ensureSubscription(userId: string): void;
  getManagedKey(): string | null;
  settleReceipt(receipt: PiProviderReceipt): void;
  frontendUrl: string;
  /** Scheduled next-cycle plan change, if any. Optional so tests and older wiring keep working. */
  scheduledPlanChange?(userId: string): { toPlan: string; fromPlan: string; status: string; effectiveAt: string; monthlyUsd: number } | null;
};
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_CONCURRENT_REQUESTS = 4;
const REQUEST_FIELDS = new Set(['model', 'messages', 'tools', 'tool_choice', 'parallel_tool_calls', 'stream', 'stream_options', 'max_tokens', 'max_completion_tokens', 'temperature', 'top_p', 'stop', 'reasoning_effort', 'reasoning', 'n', 'store']);
const MESSAGE_FIELDS = new Set(['role', 'content', 'name', 'tool_call_id', 'tool_calls', 'reasoning_content', 'reasoning', 'reasoning_text', 'reasoning_details', 'refusal', 'cache_control']);
const record = (value: any): value is Record<string, any> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
function fail(code: string, statusCode = 400): never { throw Object.assign(new Error(code), { code, statusCode }); }
const errorResponse = (res: any, code: string, status = 400) => res.status(status).json({ error: { message: code, code, type: status === 402 ? 'insufficient_quota' : status === 401 ? 'authentication_error' : 'invalid_request_error' } });

function validateRequest(body: any): void {
  if (!record(body) || Object.keys(body).some(key => !REQUEST_FIELDS.has(key))) fail('DESKTOP_MODEL_REQUEST_INVALID');
  if (body.stream !== true || typeof body.model !== 'string' || !body.model || body.model.length > 300) fail('DESKTOP_MODEL_REQUEST_INVALID');
  if (body.n !== undefined && body.n !== 1) fail('DESKTOP_MODEL_SINGLE_COMPLETION_REQUIRED');
  if (body.store !== undefined && body.store !== false) fail('DESKTOP_MODEL_STORAGE_DISABLED');
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 1000) fail('DESKTOP_MODEL_MESSAGES_INVALID');
  for (const message of body.messages) {
    if (!record(message) || Object.keys(message).some(key => !MESSAGE_FIELDS.has(key)) || !['system', 'developer', 'user', 'assistant', 'tool'].includes(message.role)) fail('DESKTOP_MODEL_MESSAGES_INVALID');
    if (message.content != null && typeof message.content !== 'string') {
      if (!Array.isArray(message.content) || !message.content.length) fail('DESKTOP_MODEL_CONTENT_INVALID');
      for (const part of message.content) {
        if (!record(part)) fail('DESKTOP_MODEL_CONTENT_INVALID');
        if (part.type === 'text' && typeof part.text === 'string') continue;
        // Remote URLs have provider-dependent, unbounded fetch/image costs.
        if (part.type === 'image_url' && record(part.image_url) && typeof part.image_url.url === 'string' && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(part.image_url.url)) continue;
        fail('DESKTOP_MODEL_CONTENT_INVALID');
      }
    }
    if (message.content == null && (message.role !== 'assistant' || !Array.isArray(message.tool_calls))) fail('DESKTOP_MODEL_CONTENT_INVALID');
    if (message.role === 'tool' && (typeof message.tool_call_id !== 'string' || !message.tool_call_id)) fail('DESKTOP_MODEL_TOOL_RESULT_INVALID');
    if (message.tool_calls !== undefined && (!Array.isArray(message.tool_calls) || message.tool_calls.some((call: any) => !record(call) || call.type !== 'function' || typeof call.id !== 'string' || !record(call.function) || typeof call.function.name !== 'string' || typeof call.function.arguments !== 'string'))) fail('DESKTOP_MODEL_TOOL_CALL_INVALID');
  }
  if (body.tools !== undefined && (!Array.isArray(body.tools) || body.tools.length > 128 || body.tools.some((tool: any) => !record(tool) || tool.type !== 'function' || !record(tool.function) || typeof tool.function.name !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(tool.function.name) || !record(tool.function.parameters)))) fail('DESKTOP_MODEL_TOOLS_INVALID');
  for (const field of ['max_tokens', 'max_completion_tokens']) if (body[field] !== undefined && (!Number.isSafeInteger(body[field]) || body[field] < 1)) fail('DESKTOP_MODEL_OUTPUT_LIMIT_INVALID');
  if (body.max_tokens !== undefined && body.max_completion_tokens !== undefined) fail('DESKTOP_MODEL_OUTPUT_LIMIT_INVALID');
  for (const [field, max] of [['temperature', 2], ['top_p', 1]] as const) if (body[field] !== undefined && (!Number.isFinite(body[field]) || body[field] < 0 || body[field] > max)) fail('DESKTOP_MODEL_SAMPLING_INVALID');
  if (body.parallel_tool_calls !== undefined && typeof body.parallel_tool_calls !== 'boolean') fail('DESKTOP_MODEL_TOOLS_INVALID');
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) fail('DESKTOP_MODEL_REQUEST_TOO_LARGE', 413);
}

/** One authenticated spend rail for desktop and website chat. Neither local
 * prompts nor model responses are persisted by this credential gateway. */
export function createDesktopModelGateway(deps: Dependencies) {
  const { db, ledger, billing } = deps;
  const active = new Set<string>();
  const website = new URL(deps.frontendUrl);
  if (!['https:', 'http:'].includes(website.protocol) || website.username || website.password) throw new Error('DESKTOP_FRONTEND_URL_INVALID');
  const websiteUrl = website.origin;
  const planChange = (userId: string) => {
    const change = deps.scheduledPlanChange?.(userId);
    return change ? { fromPlan: change.fromPlan, toPlan: change.toPlan, status: change.status, effectiveAt: change.effectiveAt, monthlyUsd: change.monthlyUsd } : null;
  };
  const account = (userId: string) => db.transaction(() => {
    const user = db.prepare('SELECT id,email,first_name,last_name FROM users WHERE id=?').get(userId);
    if (!user) fail('AUTHENTICATION_REQUIRED', 401);
    deps.ensureSubscription(userId);
    const subscription = db.prepare('SELECT plan,status,tokens_used,tokens_limit FROM subscriptions WHERE user_id=?').get(userId);
    const money = billing.snapshot(userId);
    return { user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
      plan: subscription.plan, status: subscription.status, tokensUsed: Number(subscription.tokens_used), tokensLimit: Number(subscription.tokens_limit),
      // Kept for old clients, but tokens no longer authorize managed spending.
      creditBalance: money.prepaidBalanceUsd, remainingTokens: 0, pendingTokens: ledger.pendingTokens(userId), billing: money,
      planChange: planChange(userId), websiteUrl, billingUrl: new URL(`/?tab=billing&account=${encodeURIComponent(userId)}`, websiteUrl).toString() };
  })();
  const models = (userId: string) => {
    const state = account(userId);
    if (!deps.getManagedKey()) return [];
    const enabled = new Set(db.prepare("SELECT id FROM platform_models WHERE enabled=1 AND provider='openrouter'").all().map((row: any) => row.id));
    const visible = OPENROUTER_CATALOG.filter(model => enabled.has(model.id));
    const preferred = DEFAULT_OPENROUTER_MODEL;
    const fallback = visible.find(model => model.id === preferred)?.id
      ?? visible.find(model => model.tier === (state.billing.trialOnly ? 'lightweight' : 'balanced'))?.id
      ?? visible.find(model => !state.billing.trialOnly || model.tier === 'lightweight')?.id;
    return visible.map(model => {
      const configured = operatorModelLimits('openrouter', model.id);
      const contextWindow = Math.min(model.contextLength, configured?.contextWindow ?? model.contextLength);
      return { id: model.id, name: model.name, provider: 'openrouter', api: 'openai-completions' as const,
        contextWindow, maxTokens: Math.min(model.maxOutputTokens, configured?.maxTokens ?? model.maxOutputTokens, contextWindow - 1),
        tier: model.tier, reasoning: model.supportedParameters.includes('reasoning'), reasoningEfforts: model.reasoning.supported_efforts ?? [],
        defaultReasoningEffort: model.reasoning.default_effort, mandatoryReasoning: Boolean(model.reasoning.mandatory),
        isDefault: model.id === fallback, isFree: isFreeOpenRouterModel(model.id),
        available: !state.billing.trialOnly || model.tier === 'lightweight', requiresPaidCredits: model.tier !== 'lightweight',
        pricingVerifiedAt: OPENROUTER_CATALOG_VERIFIED_AT,
        pricing: { currency: 'USD' as const, unit: 'million_tokens' as const, input: model.pricing.prompt * OPENROUTER_RETAIL_MULTIPLIER,
          output: model.pricing.completion * OPENROUTER_RETAIL_MULTIPLIER, cacheRead: model.pricing.cacheRead === undefined ? undefined : model.pricing.cacheRead * OPENROUTER_RETAIL_MULTIPLIER,
          cacheWrite: model.pricing.cacheWrite * OPENROUTER_RETAIL_MULTIPLIER } };
    });
  };

  const prepare = (userId: string, rawBody: any) => {
    validateRequest(rawBody);
    const model = models(userId).find(value => value.id === rawBody.model);
    if (!model) fail('DESKTOP_MODEL_UNAVAILABLE', 403);
    if (!model.available) fail('BILLING_PAID_CREDITS_REQUIRED', 402);
    const outputLimit = rawBody.max_tokens ?? rawBody.max_completion_tokens ?? Math.min(8192, model.maxTokens);
    if (outputLimit > model.maxTokens) fail('DESKTOP_MODEL_OUTPUT_LIMIT_INVALID');
    let body = normalizeOpenRouterRequest(model.id, { ...rawBody, n: 1 }, { maxOutputTokens: outputLimit });
    delete body.store; delete body.stream_options;
    const input = estimateManagedInput(model.id, body, { contextWindow: model.contextWindow, outputTokens: outputLimit });
    const inputTokens = input.inputTokens;
    if (inputTokens + outputLimit > model.contextWindow) fail('DESKTOP_MODEL_CONTEXT_LIMIT_EXCEEDED');
    body = normalizeOpenRouterRequest(model.id, body, { promptTokens: inputTokens, maxOutputTokens: outputLimit });
    const prices = getOpenRouterPriceBounds(model.id, inputTokens);
    const maximumCost = inputTokens * Math.max(prices.prompt, prices.cacheWrite, prices.cacheWrite1h ?? 0) / 1e6 + outputLimit * prices.completion / 1e6 + prices.request;
    return { model, body, inputTokens, outputLimit, maximumCost, policy: input.policy };
  };
  const estimate = (userId: string, body: any) => {
    const value = prepare(userId, { ...body, stream: true });
    return { inputTokens: value.inputTokens, outputTokens: value.outputLimit, totalTokens: value.inputTokens + value.outputLimit,
      maximumUsd: value.maximumCost * OPENROUTER_RETAIL_MULTIPLIER, policy: value.policy };
  };
  const execute = async (userId: string, rawBody: any, idempotencyKey: unknown, options: {
    signal?: AbortSignal; onStarted?(requestId: string): void; onChunk?(chunk: Uint8Array): Promise<void>; endpoint?: 'chat' | 'desktop' | 'phone'; maximumUsd?: number;
  } = {}) => {
    const { model, body, inputTokens, outputLimit, maximumCost, policy } = prepare(userId, rawBody);
    const apiKey = deps.getManagedKey();
    if (!apiKey) fail('DESKTOP_PROVIDER_NOT_CONFIGURED', 503);
    const resolved = resolveModel('openrouter', model.id);
    if (idempotencyKey !== undefined && (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_.:-]{8,128}$/.test(idempotencyKey))) fail('DESKTOP_IDEMPOTENCY_KEY_INVALID');
    const requestId = idempotencyKey ? `managed-${crypto.createHash('sha256').update(`${userId}\0${idempotencyKey}`).digest('hex')}` : `managed-${crypto.randomUUID()}`;
    if (options.maximumUsd !== undefined && (!Number.isFinite(options.maximumUsd) || options.maximumUsd < 0
      || maximumCost * OPENROUTER_RETAIL_MULTIPLIER > options.maximumUsd)) fail('AGENT_EVALUATION_BUDGET_EXCEEDED', 402);
    const receipt: PiProviderReceipt = { version: 1, requestId, userId, runId: `${options.endpoint ?? 'desktop'}:${requestId}`,
      provider: 'openrouter', model: model.id, state: 'started', usageStatus: 'pending', startedAt: new Date().toISOString(),
      reservation: { inputTokens, outputTokens: outputLimit, totalTokens: inputTokens + outputLimit, costUsd: maximumCost * OPENROUTER_RETAIL_MULTIPLIER,
        basis: policy === 'free_context_ceiling' ? 'free_context_ceiling' : 'utf8_bytes_plus_output_limit' } };
    db.transaction(() => {
      if (ledger.get(userId, requestId)) fail('DESKTOP_REQUEST_ALREADY_ACCEPTED', 409);
      const pending = Number(db.prepare("SELECT COUNT(*) n FROM managed_billing_requests WHERE user_id=? AND state='pending'").get(userId).n);
      if (pending >= MAX_CONCURRENT_REQUESTS) fail('DESKTOP_MODEL_CONCURRENCY_LIMIT', 429);
      billing.reserve(userId, requestId, model.id, maximumCost, MANAGED_BILLING_VERSION);
      ledger.record(receipt);
    })();
    active.add(requestId);
    let content = '';
    const observer = providerUsageObserver('openai-completions', { provider: 'openrouter', model: model.id,
      onText: options.onChunk ? undefined : delta => { content += delta; } });
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 180000);
    let dispatched = false, completed = false, httpStatus: number | undefined, error: any;
    let finalUsage: PiProviderUsage | undefined;
    try {
      options.onStarted?.(requestId);
      if (options.signal?.aborted) abort();
      if (controller.signal.aborted) fail('DESKTOP_REQUEST_CANCELLED', 499);
      dispatched = true;
      const response = await fetch(resolved.upstream, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream',
        Authorization: `Bearer ${apiKey}`, 'HTTP-Referer': websiteUrl, 'X-Title': 'Forge' }, body: JSON.stringify(body), signal: controller.signal, redirect: 'error' });
      httpStatus = response.status;
      if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
        await response.body?.cancel();
        fail(httpStatus === 402 ? 'DESKTOP_PROVIDER_FUNDING_UNAVAILABLE' : `DESKTOP_PROVIDER_HTTP_${httpStatus}`, httpStatus === 429 ? 429 : 502);
      }
      for await (const chunk of response.body as any) {
        observer.write(chunk);
        if (options.onChunk) await options.onChunk(chunk);
      }
      completed = !observer.failed() && !controller.signal.aborted;
    } catch (caught: any) { error = caught; }
    finally {
      clearTimeout(timer); options.signal?.removeEventListener('abort', abort);
      observer.finish();
      if (observer.failed()) error = Object.assign(new Error('DESKTOP_PROVIDER_STREAM_FAILED'), { code: 'DESKTOP_PROVIDER_STREAM_FAILED', statusCode: 502 });
      let reported: PiProviderUsage | undefined = observer.result();
      const generationId = observer.generationId();
      if (reported?.providerCostUsd === undefined && generationId && httpStatus === 200) reported = await queryOpenRouterGeneration(apiKey, generationId, { model: model.id }) || reported;
      const authoritative = reported?.providerCostUsd !== undefined;
      finalUsage = authoritative ? reported : undefined;
      const rejection = dispatched ? classifyOpenRouterFailure('openrouter', httpStatus, resolved.upstream) : undefined;
      try {
        db.transaction(() => {
          const effective = ledger.record({ ...receipt, endedAt: new Date().toISOString(), ...(httpStatus === undefined ? {} : { httpStatus }),
            state: !dispatched ? 'not_sent' : observer.failed() ? 'failed' : completed ? 'completed' : controller.signal.aborted ? 'cancelled' : 'failed',
            usageStatus: !dispatched ? 'not_sent' : authoritative ? 'reported' : 'unknown',
            ...(authoritative ? { usage: reported } : {}), ...(generationId ? { generationId } : {}), ...(rejection ?? {}) });
          deps.settleReceipt(effective);
        })();
        const settlement = db.prepare('SELECT state FROM managed_billing_requests WHERE id=? AND user_id=?').get(requestId, userId);
        if (settlement?.state === 'review_required') error = Object.assign(new Error('BILLING_USAGE_REVIEW_REQUIRED'), { code: 'BILLING_USAGE_REVIEW_REQUIRED', statusCode: 503 });
      } catch { error = Object.assign(new Error('DESKTOP_USAGE_SETTLEMENT_PENDING'), { code: 'DESKTOP_USAGE_SETTLEMENT_PENDING', statusCode: 503 }); }
      finally { active.delete(requestId); }
      if (!options.onChunk && !authoritative && !error) error = Object.assign(new Error('DESKTOP_USAGE_SETTLEMENT_PENDING'), { code: 'DESKTOP_USAGE_SETTLEMENT_PENDING', statusCode: 503 });
    }
    if (error) throw error;
    return { requestId, content, usage: finalUsage };
  };
  const chat = async (req: any, res: any) => {
    const controller = new AbortController(), abort = () => controller.abort();
    req.once('aborted', abort); res.once('close', abort);
    if (req.aborted || res.destroyed) abort();
    try {
      await execute(String(req.user?.sub || req.user?.id || ''), req.body, req.headers['idempotency-key'], {
        signal: controller.signal, onStarted: id => res.set('X-Forge-Request-Id', id),
        onChunk: async chunk => {
          if (res.destroyed) { abort(); return; }
          if (!res.headersSent) res.status(200).set('Content-Type', 'text/event-stream').set('Cache-Control', 'no-store').set('X-Accel-Buffering', 'no');
          if (!res.write(chunk)) await new Promise<void>(resolve => {
            const done = () => { res.removeListener('drain', done); res.removeListener('close', done); resolve(); };
            res.once('drain', done); res.once('close', done);
          });
        },
      });
    } catch (error: any) {
      const code = typeof error.code === 'string' && /^(DESKTOP_|BILLING_|AUTHENTICATION_|OPENROUTER_|CHAT_|PI_MANAGED_)/.test(error.code) ? error.code : 'DESKTOP_PROVIDER_TRANSPORT_FAILED';
      if (!res.destroyed && !res.headersSent) errorResponse(res, code, Number(error.statusCode) || 502);
      else if (!res.destroyed) res.write(`data: ${JSON.stringify({ error: { message: code, code } })}\n\n`);
    } finally {
      req.removeListener('aborted', abort); res.removeListener('close', abort);
      if (!res.destroyed && !res.writableEnded) res.end();
    }
  };
  return { account, models, chat, estimate, complete: (userId: string, body: any, key?: string, signal?: AbortSignal, maximumUsd?: number, endpoint: 'chat' | 'phone' = 'chat') => execute(userId, { ...body, stream: true }, key, { signal, endpoint, maximumUsd }),
    isActive: (requestId: string) => active.has(requestId) };
}

export function registerDesktopModelRoutes(app: Express, requireAuth: RequestHandler, gateway: ReturnType<typeof createDesktopModelGateway>): void {
  const read = (fn: (userId: string) => unknown): RequestHandler => (req: any, res: any) => {
    try { res.set('Cache-Control', 'no-store').json({ success: true, data: fn(String(req.user?.sub || req.user?.id || '')) }); }
    catch (error: any) { errorResponse(res, error.code || 'DESKTOP_ACCOUNT_UNAVAILABLE', error.statusCode || 503); }
  };
  app.get('/api/desktop/account', requireAuth, read(gateway.account));
  app.get('/api/desktop/models', requireAuth, read(gateway.models));
  app.post('/api/desktop/chat/completions', requireAuth, gateway.chat);
}
