import { getBuiltinModel } from '@earendil-works/pi-ai/providers/all';

/** This is a conservative text estimate, not provider tokenization or billing. */
export function estimatePromptTokens(value) {
  // Images are not base64 text tokens. The supported managed patch models
  // admit at most 30,000 patches × 1.2, plus one rounding token per image.
  // This is context planning only; Forge's credential gateway reserves money
  // using validated dimensions and settles the provider's actual receipt.
  if(Array.isArray(value))return value.reduce((sum,part)=>sum+estimatePromptTokens(part),0);
  if(value?.type==='image')return 36001;
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  let ascii = 0, other = 0;
  for (const char of text) { if (char.codePointAt(0) < 128) ascii++; else other++; }
  return Math.ceil(ascii / 3) + other;
}

export function modelBudget(model) {
  const provider = model.sourceProvider === 'gemini' ? 'google' : model.sourceProvider;
  const catalog = provider ? getBuiltinModel(provider, model.id) : undefined;
  const contextWindow = model.contextWindow ?? catalog?.contextWindow ?? 32000;
  const maxTokens = model.maxTokens ?? Math.min(4096, catalog?.maxTokens ?? 4096, Math.floor(contextWindow / 4));
  if (!Number.isSafeInteger(contextWindow) || contextWindow < 2048 || contextWindow > 2000000 ||
      !Number.isSafeInteger(maxTokens) || maxTokens < 1 || maxTokens >= contextWindow) throw new Error('PI_MODEL_LIMITS_INVALID');
  const reserveTokens = Math.min(contextWindow - 256, Math.max(maxTokens + 256, Math.ceil(contextWindow * 0.12)));
  const keepRecentTokens = Math.max(256, Math.min(12000, Math.floor((contextWindow - reserveTokens) * 0.2)));
  return { contextWindow, maxTokens, reserveTokens, keepRecentTokens,
    metadataSource: model.contextWindow !== undefined ? 'configured' : catalog ? 'pi_model_catalog' : 'conservative_fallback', estimator: 'ascii_chars_per_3_non_ascii_per_1' };
}

export function assertPromptBudget(limits, systemPrompt, tools, input) {
  const fixedPromptTokens = estimatePromptTokens(systemPrompt) + estimatePromptTokens(tools) + 768;
  const inputTokens = estimatePromptTokens(input);
  const availableHistoryTokens = limits.contextWindow - limits.maxTokens - fixedPromptTokens - inputTokens;
  if (availableHistoryTokens < 256) throw new Error('PI_CONTEXT_FIXED_PROMPT_TOO_LARGE');
  const reserveTokens = Math.max(limits.reserveTokens, fixedPromptTokens + inputTokens + limits.maxTokens);
  const keepRecentTokens = Math.max(64, Math.min(limits.keepRecentTokens, Math.floor((limits.contextWindow - reserveTokens) * 0.2)));
  return { ...limits, reserveTokens, keepRecentTokens, fixedPromptTokens, inputTokens, availableHistoryTokens };
}
