import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createAgentSession, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager } from '@earendil-works/pi-coding-agent';
import { createForgeEcosystem } from '../ecosystem.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const zeroUsage = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } });
const asText = content => typeof content === 'string' ? content : JSON.stringify(content ?? null);
const textContent = content => [{ type: 'text', text: asText(content).slice(0, 100000) }];

export function pendingTools(messages) {
  const completed = new Set(messages.filter(m => m.role === 'toolResult').map(m => m.toolCallId));
  return messages.flatMap(m => m.role === 'assistant' && Array.isArray(m.content) ? m.content.filter(c => c.type === 'toolCall' && !completed.has(c.id)).map(c => ({ toolCallId: c.id, name: c.name, args: c.arguments })) : []);
}

/** Each invocation owns a fresh SDK runtime, credentials, resources and transcript.
 * Forge persists checkpoints and business state; no ~/.pi or repository resources are loaded.
 */
export async function runAgent(request, { emit = () => {}, executeTool = async () => ({ content: 'Tool broker unavailable', isError: true }), signal, operatorMcpConfig, depth = 0, sharedBudget } = {}) {
  if (!request?.model?.id || !request.model.baseUrl || !request.model.token) throw new Error('PI_MODEL_CONFIG_REQUIRED');
  if (!['openai-completions', 'anthropic-messages', 'google-generative-ai'].includes(request.model.api)) throw new Error('PI_MODEL_API_UNSUPPORTED');
  const tools = Array.isArray(request.tools) ? request.tools : [];
  if (tools.length > 128 || tools.some(t => !/^[A-Za-z_][A-Za-z0-9_.:-]{0,127}$/.test(t.name) || !t.parameters || typeof t.parameters !== 'object')) throw new Error('PI_TOOLS_INVALID');
  const budget = sharedBudget || { calls: 0, spawns: 0, tokens: 0, maxCalls: Math.max(1, Math.min(request.maxTurns || 16, 64)), maxTokens: Math.max(128, Math.min(request.maxTokens || 128000, 1000000)) };
  const workRoot = resolve(tmpdir());
  const cwd = await mkdtemp(join(workRoot, 'forge-pi-run-'));
  let session;
  let pausedMessages;
  let promptTokens = 0, completionTokens = 0, providerCalls = 0;
  let fatal;
  let abortPromise;
  let plan = Array.isArray(request.plan) ? clone(request.plan) : [];
  const mcpAuthorizations = [];
  const stop = () => {
    session?.agent.clearAllQueues();
    if (session) abortPromise = session.abort();
  };
  const send = event => {
    if (event.type === 'plan_updated') plan = clone(event.steps);
    emit(event.type === 'checkpoint' ? { ...event, plan: clone(plan) } : event);
  };
  const getSnapshot = () => clone(session?.agent.state.messages || []);
  const completeMcpCalls = (result, isError = false) => {
    for (const call of mcpAuthorizations.splice(0)) send({ type: 'tool_end', name: 'mcp_call', toolCallId: call.requestId,
      args: { serverName: call.serverName, toolName: call.toolName, arguments: call.args },
      result: { content: result?.content, isError: Boolean(isError || result?.isError || result?.details?.error) } });
  };
  const execute = async (name, args, toolCallId) => {
    if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
    if (pausedMessages) return { content: 'Execution paused for approval', isError: true };
    const before = getSnapshot();
    send({ type: 'checkpoint', messages: before });
    send({ type: 'tool_call', name, args, toolCallId });
    let output;
    if (name === 'spawn_agent') {
      if (depth >= 1 || ++budget.spawns > 4) return { content: 'PI_SUBAGENT_LIMIT_REACHED', isError: true };
      const task = String(args.task || args.prompt || args.description || '').trim();
      if (!task) return { content: 'A concrete delegated task is required.', isError: true };
      const childId = `${request.runId}:child:${budget.spawns}`;
      send({ type: 'subagent_start', childId, task: task.slice(0, 1000) });
      // Child tools inherit the same broker and budgets. No recursive spawning, local
      // filesystem tools, ambient credentials or unbounded background processes.
      const childTools = tools.filter(t => t.name !== 'spawn_agent' && ['http_request', 'sandbox_browser', 'sandbox_file'].includes(t.name));
      const childBudget = { calls: 0, spawns: budget.spawns, tokens: 0,
        maxCalls: Math.max(2, Math.floor(budget.maxCalls / 4)),
        maxTokens: Math.max(4096, Math.floor((budget.maxTokens - budget.tokens) / 4)) };
      const child = await runAgent({ ...request, runId: childId, input: task, messages: [], piMessages: undefined, tools: childTools,
        systemPrompt: `${request.systemPrompt}\nYou are a delegated research assistant. Only read existing data. Do not mutate files or external systems. Return evidence to the parent.` }, {
        signal, depth: depth + 1, sharedBudget: childBudget,
        emit: event => { if (event.type === 'usage') { promptTokens += event.promptTokens; completionTokens += event.completionTokens; send(event); } else send({ type: 'subagent_event', childId, event }); },
        executeTool: (toolName, toolArgs, id) => {
          if (toolName === 'http_request' && !['GET', 'HEAD'].includes(String(toolArgs.method || 'GET').toUpperCase())) return Promise.resolve({ content: 'Delegated HTTP is read-only', isError: true });
          if (toolName === 'sandbox_file' && !['read', 'list', 'stat'].includes(String(toolArgs.operation))) return Promise.resolve({ content: 'Delegated tools are read-only', isError: true });
          if (toolName === 'sandbox_browser' && (toolArgs.actions || []).some(action => !['navigate', 'extract', 'wait'].includes(action.action))) return Promise.resolve({ content: 'Delegated browser is read-only', isError: true });
          return executeTool(toolName, toolArgs, `${toolCallId}:${id}`);
        },
      });
      budget.tokens += Number(child.promptTokens || 0) + Number(child.completionTokens || 0);
      budget.calls += Number(child.providerCalls || 0);
      send({ type: 'subagent_end', childId, promptTokens: child.promptTokens, completionTokens: child.completionTokens });
      output = { content: { childId, content: child.content, promptTokens: child.promptTokens, completionTokens: child.completionTokens } };
      send({ type: 'tool_end', name, args, toolCallId, result: output });
    } else output = await executeTool(name, args, toolCallId);
    if (output?.pause) { pausedMessages = before; stop(); }
    return output || { content: null };
  };
  try {
    const credential = { type: 'api_key', key: request.model.token };
    const credentials = { async read(id) { return id === 'forge-runtime' ? credential : undefined; }, async list() { return [{ providerId: 'forge-runtime', type: 'api_key' }]; }, async modify(_id, fn) { return fn(credential); }, async delete() {} };
    const modelRuntime = await ModelRuntime.create({ credentials, modelsPath: null, modelsStorePath: join(cwd, 'model-cache.json'), allowModelNetwork: false, refreshOnCreate: false });
    modelRuntime.registerProvider('forge-runtime', {
      baseUrl: request.model.baseUrl, api: request.model.api, apiKey: request.model.token, authHeader: true,
      models: [{ id: request.model.id, name: request.model.id, reasoning: false, input: ['text'], cost: zeroUsage().cost,
        contextWindow: request.model.contextWindow || 128000, maxTokens: request.model.maxTokens || 4096, compat: request.model.compat }],
    });
    const originalStream = modelRuntime.streamSimple.bind(modelRuntime);
    modelRuntime.streamSimple = (model, context, options) => {
      if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
      // budget.calls counts settled model turns (incremented on message_end), so a
      // transport retry of the same turn cannot burn the turn budget.
      if (budget.calls >= budget.maxCalls || budget.tokens >= budget.maxTokens) { fatal = new Error('PI_RUN_BUDGET_EXHAUSTED'); throw fatal; }
      return originalStream(model, context, { ...options, maxRetries: 2, maxTokens: Math.max(1, Math.min(request.model.maxTokens || 4096, budget.maxTokens - budget.tokens)) });
    };
    const settingsManager = SettingsManager.inMemory({ compaction: { enabled: true, reserveTokens: 8192, keepRecentTokens: 12000 }, retry: { enabled: true, maxRetries: 2, baseDelayMs: 500, maxDelayMs: 2000, provider: { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 2000 } }, defaultProjectTrust: 'never' });
    const ecosystem = await createForgeEcosystem({ tools: tools.map(t => t.name), operatorMcpConfig: depth ? undefined : operatorMcpConfig, onEvent: send,
      approveMcpTool: async call => {
        if (signal?.aborted) return 'deny';
        // MCP is restricted to operator-reviewed read-only capabilities. External
        // writes and durable approval workflows remain on the Forge sandbox broker.
        const output = await executeTool('mcp_call', { serverName: call.serverName, toolName: call.toolName, arguments: call.args }, call.requestId);
        if (output?.pause) return 'deny';
        const allowed = output?.content?.decision === 'allow_once';
        if (allowed) mcpAuthorizations.push(call);
        return allowed ? 'allow_once' : 'deny';
      },
    });
    const resourceOptions = request.ecosystem === false ? { ...ecosystem.resourceLoaderOptions, extensionFactories: [], skillsOverride: () => ({ skills: [], diagnostics: [] }), promptsOverride: () => ({ prompts: [], diagnostics: [] }) } : ecosystem.resourceLoaderOptions;
    const loader = new DefaultResourceLoader({ ...resourceOptions, cwd, agentDir: cwd, settingsManager, systemPromptOverride: () => String(request.systemPrompt || 'Complete the task using the available Forge tools. Report only verified results.') });
    await loader.reload();
    if (loader.getExtensions().errors.length) throw new Error('PI_EXTENSION_LOAD_FAILED:' + loader.getExtensions().errors.map(e => e.error).join(';').slice(0, 1500));
    let history = Array.isArray(request.piMessages) ? clone(request.piMessages) : (request.messages || []).filter(m => ['user', 'assistant'].includes(m.role)).map(m => ({ ...m, content: Array.isArray(m.content) ? m.content : textContent(m.content), timestamp: Date.now(), ...(m.role === 'assistant' ? { api: request.model.api, provider: 'forge-runtime', model: request.model.id, usage: zeroUsage(), stopReason: 'stop' } : {}) }));
    const unresolved = pendingTools(history);
    // Resume the exact tool-use IDs through Forge's durable approval/idempotency path.
    // Never ask the model to invent a replacement tool call after approval.
    let input = request.input;
    if (!request.piMessages && !input && history.at(-1)?.role === 'user') input = history.pop().content.map(c => c.text || '').join('\n');
    input ||= request.piMessages ? 'Continue the task using the recorded tool results. Do not repeat completed actions.' : 'Complete the task described in the conversation.';
    const sessionManager = SessionManager.inMemory(cwd);
    for (const message of history) sessionManager.appendMessage(message);
    if (plan.length) sessionManager.appendCustomEntry('forge-plan', { steps: plan });
    ({ session } = await createAgentSession({ cwd, agentDir: cwd, modelRuntime, model: modelRuntime.getModel('forge-runtime', request.model.id), thinkingLevel: 'off', noTools: 'builtin',
      customTools: tools.map(tool => ({ ...tool, label: tool.name, execute: async (id, args) => {
        const output = await execute(tool.name, args, id);
        if (output.isError && !output.pause) throw new Error(asText(output.content));
        return { content: textContent(output.content), details: {} };
      } })),
      resourceLoader: loader, sessionManager, settingsManager,
    }));
    session.agent.toolExecution = 'sequential';
    await session.bindExtensions({ mode: 'json', abortHandler: stop, onError: error => send({ type: 'extension_error', error: String(error.message || error).slice(0, 1000) }) });
    session.subscribe(event => {
      if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') send({ type: 'text_delta', delta: event.assistantMessageEvent.delta });
      if (event.type === 'message_end') {
        if (event.message.role === 'assistant') {
          const usage = event.message.usage || {};
          const inputTokens = Number(usage.input || 0) + Number(usage.cacheRead || 0) + Number(usage.cacheWrite || 0);
          const outputTokens = Number(usage.output || 0);
          promptTokens += inputTokens; completionTokens += outputTokens; budget.tokens += inputTokens + outputTokens;
          budget.calls++; providerCalls++;
          send({ type: 'usage', promptTokens: inputTokens, completionTokens: outputTokens, providerCalls: 1 });
        }
        if (!pausedMessages) send({ type: 'checkpoint', messages: getSnapshot() });
      }
      if (event.type === 'agent_settled') send({ type: 'agent_settled' });
      if (event.type === 'tool_execution_end' && event.toolName === 'mcp') {
        completeMcpCalls(event.result, event.isError);
      }
      if (event.type === 'compaction_start') send({ type: 'auto_compaction_start', reason: event.reason });
      if (event.type === 'compaction_end') {
        const usage = event.result?.usage;
        if (usage) {
          const inputTokens = Number(usage.input || 0) + Number(usage.cacheRead || 0) + Number(usage.cacheWrite || 0);
          const outputTokens = Number(usage.output || 0);
          promptTokens += inputTokens; completionTokens += outputTokens; budget.tokens += inputTokens + outputTokens;
          send({ type: 'usage', promptTokens: inputTokens, completionTokens: outputTokens, source: 'compaction' });
        }
        send({ type: 'auto_compaction_end', aborted: event.aborted });
        send({ type: 'checkpoint', messages: getSnapshot() });
      }
    });
    if (signal?.aborted) stop(); else signal?.addEventListener('abort', stop, { once: true });
    if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
    for (const call of unresolved) {
      if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
      const tool = session.agent.state.tools.find(tool => tool.name === call.name);
      if (!tool) throw new Error('PI_RESUME_TOOL_NOT_ALLOWED');
      send({ type: 'checkpoint', messages: getSnapshot() });
      let output;
      try { output = await tool.execute(call.toolCallId, call.args, signal); }
      catch (error) { output = { content: textContent(error.message), isError: true }; }
      if (pausedMessages) return { content: '', promptTokens, completionTokens, messages: pausedMessages, paused: true, pendingToolCalls: pendingTools(pausedMessages), plan };
      // Replayed calls run outside the SDK loop, so explicitly publish the same receipt.
      if (call.name === 'mcp') completeMcpCalls(output);
      const result = { role: 'toolResult', toolCallId: call.toolCallId, toolName: call.name, content: output.content,
        isError: Boolean(output.isError || (call.name === 'mcp' && output.details?.error)),
        ...(output.details === undefined ? {} : { details: output.details }), timestamp: Date.now() };
      session.agent.state.messages.push(result); sessionManager.appendMessage(result);
      send({ type: 'checkpoint', messages: getSnapshot() });
    }
    await session.prompt(String(input));
    if (abortPromise) await abortPromise;
    if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
    if (fatal) throw fatal;
    const messages = pausedMessages || getSnapshot();
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!pausedMessages && last?.stopReason === 'error') throw new Error(last.errorMessage || 'PI_MODEL_FAILED');
    return { content: pausedMessages ? '' : (last?.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n'), promptTokens, completionTokens, providerCalls,
      messages, paused: Boolean(pausedMessages), pendingToolCalls: pendingTools(messages), plan, engine: 'pi', engineVersion: '0.85.1' };
  } finally {
    signal?.removeEventListener('abort', stop);
    if (session) { session.agent.clearAllQueues(); await session.abort(); await session.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' }); session.dispose(); }
    // Only remove the directory created for this invocation, never a caller path.
    if (resolve(cwd).startsWith(workRoot + sep) && cwd.split(sep).at(-1).startsWith('forge-pi-run-')) await rm(cwd, { recursive: true, force: true });
  }
}
