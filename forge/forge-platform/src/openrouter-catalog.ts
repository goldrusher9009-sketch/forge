/** Managed model catalogue verified against OpenRouter's public model and endpoint APIs.
 * Base prices are display/authorization estimates; settle with usage.cost or generation.total_cost.
 * Research evidence: .local/openrouter-research-20260914/RESEARCH.md.
 */
export const OPENROUTER_CATALOG_VERIFIED_AT = '2026-09-14T09:31:56.781107Z';
export const OPENROUTER_CATALOG_SOURCE = 'https://openrouter.ai/api/v1/models';
export const OPENROUTER_RETAIL_MULTIPLIER = 1.25;
export const DEFAULT_OPENROUTER_MODEL = 'stealth/space-bunny-alpha';

/** Token prices in USD per million; request is USD per request. Cache-write
 * prices are complete input costs, including Gemini's additional storage cost. */
export interface OpenRouterPriceBounds {
  prompt: number;
  completion: number;
  cacheRead?: number;
  cacheWrite: number;
  cacheWrite1h?: number;
  request: number;
}

export interface OpenRouterCatalogModel {
  id: string;
  name: string;
  tier: 'flagship' | 'balanced' | 'lightweight';
  contextLength: number;
  maxOutputTokens: number;
  supportedParameters: readonly string[];
  reasoning: {
    mandatory?: boolean;
    default_enabled?: boolean;
    supported_efforts?: readonly string[];
    default_effort?: string;
    supports_max_tokens?: boolean;
  };
  pricing: OpenRouterPriceBounds;
  longContextOverrides: readonly { minPromptTokensExclusive: number; pricing: Partial<OpenRouterPriceBounds> }[];
  /** Original API rates in USD per token, including unmodified temporal overrides. */
  upstreamPricing: Readonly<Record<string, unknown>>;
  standardProviders: readonly string[];
  sourceEndpoints: string;
}

export const OPENROUTER_CATALOG: readonly OpenRouterCatalogModel[] = [
  // Free endpoint prices and routing tags checked against the public API on 2026-09-30.
  {
    id: 'stealth/space-bunny-alpha',
    name: 'Space Bunny Alpha',
    tier: 'lightweight',
    contextLength: 1000000,
    maxOutputTokens: 524288,
    supportedParameters: ['include_reasoning', 'max_tokens', 'reasoning', 'reasoning_effort', 'response_format', 'temperature', 'tool_choice', 'tools', 'top_p'],
    reasoning: { mandatory: true, supported_efforts: ['max', 'xhigh', 'high', 'medium', 'low'], default_effort: 'max' },
    pricing: { prompt: 0, completion: 0, cacheWrite: 0, request: 0 },
    longContextOverrides: [],
    upstreamPricing: { prompt: '0', completion: '0' },
    standardProviders: ['stealth'],
    sourceEndpoints: 'https://openrouter.ai/api/v1/models/stealth/space-bunny-alpha/endpoints',
  },
  {
    id: 'qwen/qwen3.8-27b:free',
    name: 'Qwen3.8 27B (free)',
    tier: 'lightweight',
    contextLength: 262144,
    maxOutputTokens: 235929,
    supportedParameters: ['reasoning', 'include_reasoning', 'max_tokens', 'temperature', 'presence_penalty', 'repetition_penalty', 'frequency_penalty', 'stop', 'top_p', 'structured_outputs', 'tools', 'tool_choice', 'reasoning_effort'],
    reasoning: { mandatory: false, default_enabled: true, supported_efforts: ['xhigh', 'medium', 'low'], default_effort: 'xhigh' },
    pricing: { prompt: 0, completion: 0, cacheWrite: 0, request: 0 },
    longContextOverrides: [],
    upstreamPricing: { prompt: '0', completion: '0' },
    standardProviders: ['modelrun/fp4'],
    sourceEndpoints: 'https://openrouter.ai/api/v1/models/qwen/qwen3.8-27b:free/endpoints',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Nemotron 3 Ultra (free)',
    tier: 'lightweight',
    contextLength: 1000000,
    maxOutputTokens: 65536,
    supportedParameters: ['reasoning', 'include_reasoning', 'temperature', 'max_tokens', 'seed', 'top_p', 'tools', 'tool_choice', 'reasoning_effort'],
    reasoning: { mandatory: false, default_enabled: true, supports_max_tokens: true, supported_efforts: ['high', 'medium'], default_effort: 'high' },
    pricing: { prompt: 0, completion: 0, cacheWrite: 0, request: 0 },
    longContextOverrides: [],
    upstreamPricing: { prompt: '0', completion: '0' },
    standardProviders: ['nvidia'],
    sourceEndpoints: 'https://openrouter.ai/api/v1/models/nvidia/nemotron-3-ultra-550b-a55b:free/endpoints',
  },
  {
    id: "openai/gpt-6-astra",
    name: "GPT-6 Astra",
    tier: "flagship",
    contextLength: 1050000,
    maxOutputTokens: 128000,
    supportedParameters: ["include_reasoning","max_completion_tokens","max_tokens","reasoning","reasoning_effort","response_format","seed","structured_outputs","tool_choice","tools"],
    reasoning: {"mandatory": true,"default_enabled": true,"supported_efforts": ["max","xhigh","high","medium","low"],"default_effort": "medium"},
    pricing: {"prompt": 10.0,"completion": 50.0,"cacheRead": 1.0,"cacheWrite": 12.5,"request": 0.0},
    longContextOverrides: [{"minPromptTokensExclusive": 272000,"pricing": {"prompt": 20.0,"completion": 75.0,"cacheRead": 2.0,"cacheWrite": 25.0}}],
    upstreamPricing: {"prompt": "0.00001","completion": "0.00005","web_search": "0.01","input_cache_read": "0.000001","input_cache_write": "0.0000125","overrides": [{"min_prompt_tokens": 272000,"prompt": "0.00002","completion": "0.000075","input_cache_read": "0.000002","input_cache_write": "0.000025"}]},
    standardProviders: ["openai"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/openai/gpt-6-astra-20260903/endpoints",
  },
  {
    id: "anthropic/claude-fable-5.1",
    name: "Claude Fable 5.1",
    tier: "flagship",
    contextLength: 1000000,
    maxOutputTokens: 128000,
    supportedParameters: ["include_reasoning","max_completion_tokens","max_tokens","reasoning","reasoning_effort","response_format","stop","structured_outputs","tools","verbosity"],
    reasoning: {"mandatory": true,"supported_efforts": ["max","xhigh","high","medium","low"],"default_effort": "high"},
    pricing: {"prompt": 10.0,"completion": 50.0,"cacheRead": 0.25,"cacheWrite": 12.5,"cacheWrite1h": 20.0,"request": 0.0},
    longContextOverrides: [],
    upstreamPricing: {"prompt": "0.00001","completion": "0.00005","web_search": "0.01","input_cache_read": "0.00000025","input_cache_write": "0.0000125","input_cache_write_1h": "0.00002"},
    standardProviders: ["anthropic","azure","google-vertex/global","amazon-bedrock"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/anthropic/claude-fable-5.1-20260831/endpoints",
  },
  {
    id: "anthropic/claude-opus-5",
    name: "Claude Opus 5",
    tier: "flagship",
    contextLength: 1000000,
    maxOutputTokens: 128000,
    supportedParameters: ["include_reasoning","max_completion_tokens","max_tokens","reasoning","reasoning_effort","response_format","stop","structured_outputs","temperature","tool_choice","tools","verbosity"],
    reasoning: {"mandatory": false,"default_enabled": true,"supported_efforts": ["max","xhigh","high","medium","low"],"default_effort": "high"},
    pricing: {"prompt": 5.0,"completion": 25.0,"cacheRead": 0.5,"cacheWrite": 6.25,"cacheWrite1h": 10.0,"request": 0.0},
    longContextOverrides: [],
    upstreamPricing: {"prompt": "0.000005","completion": "0.000025","web_search": "0.01","input_cache_read": "0.0000005","input_cache_write": "0.00000625","input_cache_write_1h": "0.00001"},
    standardProviders: ["anthropic","claude-on-aws","google-vertex/global","amazon-bedrock","azure"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/anthropic/claude-opus-5-20260723/endpoints",
  },
  {
    id: "openai/gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    tier: "balanced",
    contextLength: 1050000,
    maxOutputTokens: 128000,
    supportedParameters: ["include_reasoning","max_completion_tokens","max_tokens","reasoning","reasoning_effort","response_format","seed","structured_outputs","tool_choice","tools"],
    reasoning: {"mandatory": false,"default_enabled": true,"supported_efforts": ["max","xhigh","high","medium","low","none"],"default_effort": "medium"},
    pricing: {"prompt": 2.0,"completion": 10.0,"cacheRead": 0.2,"cacheWrite": 2.5,"request": 0.0},
    longContextOverrides: [{"minPromptTokensExclusive": 272000,"pricing": {"prompt": 4.0,"completion": 15.0,"cacheRead": 0.39999999999999997,"cacheWrite": 5.0}}],
    upstreamPricing: {"prompt": "0.000002","completion": "0.00001","web_search": "0.01","input_cache_read": "0.0000002","input_cache_write": "0.0000025","overrides": [{"min_prompt_tokens": 272000,"prompt": "0.000004","completion": "0.000015","input_cache_read": "0.0000004","input_cache_write": "0.000005"}]},
    standardProviders: ["openai"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/openai/gpt-5.6-sol-20260709/endpoints",
  },
  {
    id: "anthropic/claude-sonnet-5",
    name: "Claude Sonnet 5",
    tier: "balanced",
    contextLength: 1000000,
    maxOutputTokens: 128000,
    supportedParameters: ["include_reasoning","max_completion_tokens","max_tokens","reasoning","reasoning_effort","response_format","stop","structured_outputs","tool_choice","tools","verbosity"],
    reasoning: {"mandatory": false,"default_enabled": true,"supported_efforts": ["max","xhigh","high","medium","low"],"default_effort": "high"},
    pricing: {"prompt": 2.0,"completion": 10.0,"cacheRead": 0.2,"cacheWrite": 2.5,"cacheWrite1h": 4.0,"request": 0.0},
    longContextOverrides: [],
    upstreamPricing: {"prompt": "0.000002","completion": "0.00001","web_search": "0.01","input_cache_read": "0.0000002","input_cache_write": "0.0000025","input_cache_write_1h": "0.000004"},
    standardProviders: ["anthropic","claude-on-aws","google-vertex/global","amazon-bedrock/global","azure"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/anthropic/claude-sonnet-5-20260630/endpoints",
  },
  {
    id: "google/gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tier: "balanced",
    contextLength: 1048576,
    maxOutputTokens: 65536,
    supportedParameters: ["include_reasoning","max_tokens","reasoning","reasoning_effort","response_format","seed","stop","structured_outputs","temperature","tool_choice","tools","top_p"],
    reasoning: {"mandatory": true,"default_enabled": true,"supported_efforts": ["high","medium","low"],"default_effort": "medium"},
    pricing: {"prompt": 0.75,"completion": 3.75,"cacheRead": 0.075,"cacheWrite": 0.791666666667,"request": 0.0},
    longContextOverrides: [],
    upstreamPricing: {"prompt": "0.00000075","completion": "0.00000375","image": "0.00000075","audio": "0.00000075","input_audio_cache": "0.000000075","web_search": "0.014","internal_reasoning": "0.00000375","input_cache_read": "0.000000075","input_cache_write": "0.0000000416666666666667"},
    standardProviders: ["google-ai-studio","google-vertex/global"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/google/gemini-3.8-flash-20260902/endpoints",
  },
  {
    id: "qwen/qwen3.8-max-0902",
    name: "Qwen3.8 Max (0902)",
    tier: "balanced",
    contextLength: 1000000,
    maxOutputTokens: 131072,
    supportedParameters: ["frequency_penalty","include_reasoning","logprobs","max_tokens","presence_penalty","reasoning","reasoning_effort","response_format","seed","stop","structured_outputs","temperature","tool_choice","tools","top_k","top_logprobs","top_p"],
    reasoning: {"mandatory": true,"default_enabled": true,"supported_efforts": ["xhigh","high","medium","low","minimal"],"default_effort": "xhigh"},
    pricing: {"prompt": 2.0,"completion": 6.0,"cacheRead": 0.25,"cacheWrite": 2.5,"request": 0.0},
    longContextOverrides: [],
    upstreamPricing: {"prompt": "0.000002","completion": "0.000006","input_cache_read": "0.00000025","input_cache_write": "0.0000025"},
    standardProviders: ["alibaba"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/qwen/qwen3.8-max-20260902/endpoints",
  },
  {
    id: "openai/gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    tier: "lightweight",
    contextLength: 1050000,
    maxOutputTokens: 128000,
    supportedParameters: ["include_reasoning","max_completion_tokens","max_tokens","reasoning","reasoning_effort","response_format","seed","structured_outputs","tool_choice","tools"],
    reasoning: {"mandatory": false,"default_enabled": true,"supported_efforts": ["max","xhigh","high","medium","low","none"],"default_effort": "medium"},
    pricing: {"prompt": 0.2,"completion": 1.2,"cacheRead": 0.02,"cacheWrite": 0.25,"request": 0.0},
    longContextOverrides: [{"minPromptTokensExclusive": 272000,"pricing": {"prompt": 0.39999999999999997,"completion": 1.7999999999999998,"cacheRead": 0.04,"cacheWrite": 0.5}}],
    upstreamPricing: {"prompt": "0.0000002","completion": "0.0000012","web_search": "0.01","input_cache_read": "0.00000002","input_cache_write": "0.00000025","overrides": [{"min_prompt_tokens": 272000,"prompt": "0.0000004","completion": "0.0000018","input_cache_read": "0.00000004","input_cache_write": "0.0000005"}]},
    standardProviders: ["openai"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/openai/gpt-5.6-luna-20260709/endpoints",
  },
  {
    id: "qwen/qwen3.8-flash",
    name: "Qwen3.8 Flash",
    tier: "lightweight",
    contextLength: 1000000,
    maxOutputTokens: 131072,
    supportedParameters: ["frequency_penalty","include_reasoning","logit_bias","logprobs","max_tokens","min_p","presence_penalty","reasoning","repetition_penalty","response_format","seed","stop","structured_outputs","temperature","tool_choice","tools","top_k","top_logprobs","top_p"],
    reasoning: {"mandatory": false,"default_enabled": true,"supports_max_tokens": true},
    pricing: {"prompt": 0.15,"completion": 0.47,"cacheRead": 0.016,"cacheWrite": 0.2,"request": 0.0},
    longContextOverrides: [],
    upstreamPricing: {"prompt": "0.00000015","completion": "0.00000047","input_cache_read": "0.000000016","input_cache_write": "0.0000002"},
    standardProviders: ["alibaba"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/qwen/qwen3.8-flash-20260826/endpoints",
  },
  {
    id: "deepseek/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    tier: "lightweight",
    contextLength: 1048576,
    maxOutputTokens: 384000,
    supportedParameters: ["frequency_penalty","include_reasoning","logit_bias","logprobs","max_tokens","min_p","presence_penalty","reasoning","reasoning_effort","repetition_penalty","response_format","seed","stop","structured_outputs","temperature","tool_choice","tools","top_k","top_logprobs","top_p"],
    reasoning: {"mandatory": false,"default_enabled": true,"supported_efforts": ["max","high","low"],"default_effort": "high"},
    pricing: {"prompt": 0.3,"completion": 1.2,"cacheRead": 0.006,"request": 0.0,"cacheWrite": 0.3},
    longContextOverrides: [],
    upstreamPricing: {"prompt": "0.0000003","completion": "0.0000012","input_cache_read": "0.000000006","overrides": [{"utc_days": ["saturday","sunday"],"prompt": "0.00000015","completion": "0.0000006","input_cache_read": "0.000000003"},{"utc_days": ["monday","tuesday","wednesday","thursday","friday"],"utc_start": 0,"utc_end": 100,"prompt": "0.00000015","completion": "0.0000006","input_cache_read": "0.000000003"},{"utc_days": ["monday","tuesday","wednesday","thursday","friday"],"utc_start": 100,"utc_end": 400,"prompt": "0.0000003","completion": "0.0000012","input_cache_read": "0.000000006"},{"utc_days": ["monday","tuesday","wednesday","thursday","friday"],"utc_start": 400,"utc_end": 600,"prompt": "0.00000015","completion": "0.0000006","input_cache_read": "0.000000003"},{"utc_days": ["monday","tuesday","wednesday","thursday","friday"],"utc_start": 600,"utc_end": 1000,"prompt": "0.0000003","completion": "0.0000012","input_cache_read": "0.000000006"},{"utc_days": ["monday","tuesday","wednesday","thursday","friday"],"utc_start": 1000,"utc_end": 0,"prompt": "0.00000015","completion": "0.0000006","input_cache_read": "0.000000003"}]},
    standardProviders: ["deepseek"],
    sourceEndpoints: "https://openrouter.ai/api/v1/models/deepseek/deepseek-v4.1-flash-20260910/endpoints",
  },
];

function catalogError(code: string): never {
  throw Object.assign(new Error(code), { code, statusCode: 400 });
}

export function getOpenRouterModel(id: string): OpenRouterCatalogModel | undefined {
  return OPENROUTER_CATALOG.find(model => model.id === id);
}

export function isFreeOpenRouterModel(id: string): boolean {
  const model = getOpenRouterModel(id);
  return Boolean(model && !model.longContextOverrides.length && model.pricing.prompt === 0
    && model.pricing.completion === 0 && model.pricing.cacheWrite === 0
    && (model.pricing.cacheRead ?? 0) === 0 && (model.pricing.cacheWrite1h ?? 0) === 0
    && model.pricing.request === 0);
}

function requireModel(id: string): OpenRouterCatalogModel {
  return getOpenRouterModel(id) ?? catalogError('OPENROUTER_MODEL_NOT_MANAGED');
}

/** OpenRouter may return the official dated slug for an undated catalog alias.
 * Only this exact verified pair is equivalent; model families/prefixes are not. */
export function matchesOpenRouterModel(expected: string, actual: unknown): boolean {
  if (actual === expected) return true;
  const model = getOpenRouterModel(expected);
  if (!model || typeof actual !== 'string') return false;
  const canonical = new URL(model.sourceEndpoints).pathname.replace(/^\/api\/v1\/models\//, '').replace(/\/endpoints$/, '');
  return actual === canonical;
}

/** Conservative standard-capacity prices. Never reserve against temporary discounts.
 * Omit promptTokens to cover the model's entire context, including long-input surcharges. */
export function getOpenRouterPriceBounds(id: string, promptTokens?: number): OpenRouterPriceBounds {
  const model = requireModel(id);
  if (promptTokens !== undefined && (!Number.isSafeInteger(promptTokens) || promptTokens < 0)) {
    catalogError('OPENROUTER_PROMPT_TOKENS_INVALID');
  }
  let prices = { ...model.pricing };
  for (const override of model.longContextOverrides) {
    // OpenRouter's min_prompt_tokens condition is strictly greater, not >=.
    if (promptTokens === undefined || promptTokens > override.minPromptTokensExclusive) {
      prices = { ...prices, ...override.pricing };
    }
  }
  return prices;
}

export function buildOpenRouterRouting(id: string, promptTokens?: number) {
  const model = requireModel(id);
  const prices = getOpenRouterPriceBounds(id, promptTokens);
  const free = isFreeOpenRouterModel(id);
  return {
    only: [...model.standardProviders],
    ignore: ['openai/fast', 'openai/flex', 'anthropic/fast', 'google-ai-studio/priority',
      'google-ai-studio/flex', 'google-vertex/global/priority', 'google-vertex/global/flex'],
    require_parameters: true,
    allow_fallbacks: !free,
    max_price: { prompt: prices.prompt, completion: prices.completion, request: prices.request,
      ...(free ? { image: 0 } : {}) },
  };
}

const SAMPLING_PARAMETERS = ['temperature', 'top_p', 'top_k', 'min_p', 'frequency_penalty',
  'presence_penalty', 'repetition_penalty', 'seed', 'stop', 'logprobs', 'top_logprobs', 'logit_bias'];

/** Normalize an already validated Chat Completions body. This is not a replacement
 * for gateway content/tool-schema validation or authorization/reservation.
 * Routing, paid plugins, service tiers and provider-native options remain server owned. */
export function normalizeOpenRouterRequest(
  id: string,
  body: Record<string, any>,
  options: { promptTokens?: number; maxOutputTokens?: number } = {},
): Record<string, any> {
  const model = requireModel(id);
  const supported = new Set(model.supportedParameters);
  const normalized: Record<string, any> = { ...body, model: id };
  for (const key of ['provider', 'models', 'route', 'service_tier', 'speed', 'plugins',
    'transforms', 'web_search_options', 'prediction', 'extra_body', 'modalities', 'audio']) {
    delete normalized[key];
  }
  for (const key of SAMPLING_PARAMETERS) if (!supported.has(key)) delete normalized[key];
  if (!supported.has('parallel_tool_calls')) delete normalized.parallel_tool_calls;
  if (normalized.tool_choice !== undefined && !supported.has('tool_choice')) {
    if (normalized.tool_choice !== 'auto') catalogError('OPENROUTER_TOOL_CHOICE_UNSUPPORTED');
    delete normalized.tool_choice;
  }
  for (const key of ['tools', 'response_format']) {
    if (normalized[key] !== undefined && !supported.has(key)) catalogError('OPENROUTER_PARAMETER_UNSUPPORTED');
  }
  if (body.max_tokens !== undefined && body.max_completion_tokens !== undefined) {
    catalogError('OPENROUTER_OUTPUT_LIMIT_INVALID');
  }
  const requested = body.max_completion_tokens ?? body.max_tokens ?? options.maxOutputTokens ?? 8192;
  for (const limit of [requested, options.maxOutputTokens]) {
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) catalogError('OPENROUTER_OUTPUT_LIMIT_INVALID');
  }
  // Validate before using the token estimate for both routing and remaining context.
  const routing = buildOpenRouterRouting(id, options.promptTokens);
  const available = model.contextLength - (options.promptTokens ?? 0);
  if (available < 1) catalogError('OPENROUTER_CONTEXT_LIMIT_EXCEEDED');
  const maxOutput = Math.min(requested, options.maxOutputTokens ?? model.maxOutputTokens,
    model.maxOutputTokens, available);
  delete normalized.max_tokens;
  delete normalized.max_completion_tokens;
  // max_tokens is supported by every selected standard endpoint, while the model-level
  // max_completion_tokens flag can be a superset from only one provider (e.g. Azure).
  normalized.max_tokens = maxOutput;

  if (body.reasoning !== undefined && (!body.reasoning || typeof body.reasoning !== 'object' || Array.isArray(body.reasoning))) {
    catalogError('OPENROUTER_REASONING_INVALID');
  }
  const reasoning = { ...(body.reasoning ?? {}) };
  // Pro/tournament modes may invoke extra inference; expose only standard single-model reasoning.
  for (const key of ['mode', 'context']) delete reasoning[key];
  const effort = reasoning.effort ?? body.reasoning_effort;
  delete normalized.reasoning_effort;
  if (effort !== undefined && typeof effort !== 'string') catalogError('OPENROUTER_REASONING_INVALID');
  if (model.reasoning.mandatory && (effort === 'none' || reasoning.enabled === false)) {
    catalogError('OPENROUTER_REASONING_REQUIRED');
  }
  if (effort !== undefined) {
    if (model.reasoning.supported_efforts) {
      if (!model.reasoning.supported_efforts.includes(effort)) catalogError('OPENROUTER_REASONING_EFFORT_UNSUPPORTED');
      reasoning.effort = effort;
    } else if (model.reasoning.supports_max_tokens) {
      const ratios: Record<string, number> = { minimal: 0.05, low: 0.1, medium: 0.25, high: 0.5, xhigh: 0.7, max: 0.8 };
      if (effort === 'none') reasoning.enabled = false;
      else if (ratios[effort] !== undefined) reasoning.max_tokens = Math.max(1, Math.floor(maxOutput * ratios[effort]));
      else catalogError('OPENROUTER_REASONING_EFFORT_UNSUPPORTED');
      delete reasoning.effort;
    } else catalogError('OPENROUTER_REASONING_EFFORT_UNSUPPORTED');
  }
  if (reasoning.max_tokens !== undefined) {
    if (!Number.isSafeInteger(reasoning.max_tokens) || reasoning.max_tokens < 1) catalogError('OPENROUTER_REASONING_INVALID');
    if (!model.reasoning.supports_max_tokens) catalogError('OPENROUTER_REASONING_BUDGET_UNSUPPORTED');
    reasoning.max_tokens = Math.min(reasoning.max_tokens, maxOutput);
  }
  if (Object.keys(reasoning).length) normalized.reasoning = reasoning;
  else delete normalized.reasoning;
  normalized.provider = routing;
  return normalized;
}
