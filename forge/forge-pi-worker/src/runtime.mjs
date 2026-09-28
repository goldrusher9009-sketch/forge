import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createAgentSession, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager } from '@earendil-works/pi-coding-agent';
import { createForgeEcosystem } from '../ecosystem.mjs';
import { snapshotSession, restoreSession, appendLegacyMessage, sessionPlan } from './session-state.mjs';
import { modelBudget, assertPromptBudget, estimatePromptTokens } from './context-budget.mjs';
import { runIsolatedAgent } from './isolated-runtime.mjs';

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
export async function runAgent(request, { emit = () => {}, executeTool = async () => ({ content: 'Tool broker unavailable', isError: true }), signal, operatorMcpConfig, depth = 0, sharedBudget, onControlReady, isolated = false } = {}) {
  if (operatorMcpConfig && !isolated && depth === 0) {
    return runIsolatedAgent(request, { emit, executeTool, signal, operatorMcpConfig, onControlReady });
  }
  if (!request?.model?.id || !request.model.baseUrl || !request.model.token) throw new Error('PI_MODEL_CONFIG_REQUIRED');
  if (!['openai-completions', 'anthropic-messages', 'google-generative-ai'].includes(request.model.api)) throw new Error('PI_MODEL_API_UNSUPPORTED');
  if(request.images!==undefined){
    if(!Array.isArray(request.images)||request.images.length>4)throw new Error('PI_IMAGES_INVALID');
    let bytes=0;
    for(const image of request.images){
      if(image?.type!=='image'||!['image/png','image/jpeg','image/webp','image/gif'].includes(image.mimeType)||typeof image.data!=='string'||image.data.length>2800000||image.data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(image.data))throw new Error('PI_IMAGES_INVALID');
      const decoded=Buffer.from(image.data,'base64');bytes+=decoded.length;
      if(!decoded.length||decoded.toString('base64')!==image.data||bytes>2*1024*1024)throw new Error('PI_IMAGES_INVALID');
    }
  }

  const limits = modelBudget(request.model);
  if (request.recoveredControls !== undefined && (!Array.isArray(request.recoveredControls) || request.recoveredControls.length > 16)) throw new Error('PI_RECOVERED_CONTROLS_INVALID');
  const tools = Array.isArray(request.tools) ? request.tools : [];
  if (request.allowedTools !== undefined && (!Array.isArray(request.allowedTools) || request.allowedTools.length > 128 || request.allowedTools.some(name => typeof name !== 'string' || !/^[A-Za-z_][A-Za-z0-9_.:-]{0,127}$/.test(name)))) throw new Error('PI_TOOL_SCOPE_INVALID');
  const allowedTools = request.allowedTools === undefined ? undefined : new Set(request.allowedTools);
  if (tools.length > 128 || tools.some(t => !/^[A-Za-z_][A-Za-z0-9_.:-]{0,127}$/.test(t.name) || !t.parameters || typeof t.parameters !== 'object')) throw new Error('PI_TOOLS_INVALID');
  const budget = sharedBudget || { calls: 0, spawns: 0, tokens: 0, maxCalls: Math.max(1, Math.min(request.maxTurns || 16, 64)), maxTokens: Math.max(128, Math.min(request.maxTokens || 128000, 1000000)) };
  const workRoot = resolve(tmpdir());
  const cwd = await mkdtemp(join(workRoot, 'forge-pi-run-'));
  let session;
  let sessionManager;
  let pausedMessages;
  let pausedSession;
  let inFlight;
  let interruptedState;
  let acceptingControl = false;
  let controlCount = 0;
  let contextBudget;
  const queuedControls = [];
  const deliveredControls = [];
  let promptTokens = 0, completionTokens = 0, providerCalls = 0;
  let fatal;
  let abortPromise;
  let plan = Array.isArray(request.plan) ? clone(request.plan) : [];
  const mcpAuthorizations = [];
  const stop = () => {
    // An aborted broker call has no trustworthy completion receipt. Preserve
    // its original ID for Forge's idempotent reconciliation on continuation.
    if (signal?.aborted && inFlight) interruptedState ||= inFlight;
    session?.agent.clearAllQueues();
    if (session) abortPromise = session.abort();
  };
  const send = event => {
    if (event.type === 'plan_updated') plan = clone(event.steps);
    emit(event.type === 'checkpoint' ? { ...event, pendingToolCalls: pendingTools(event.messages || []), piSession: pausedSession || interruptedState?.piSession || (sessionManager && snapshotSession(sessionManager)), plan: clone(interruptedState?.plan || plan) } : event);
  };
  const getSnapshot = () => clone(session?.agent.state.messages || []);
  const completeMcpCalls = (result, isError = false) => {
    for (const call of mcpAuthorizations.splice(0)) send({ type: 'tool_end', name: 'mcp_call', toolCallId: call.requestId,
      args: { serverName: call.serverName, toolName: call.toolName, arguments: call.args },
      result: { content: result?.content, isError: Boolean(isError || result?.isError || result?.details?.error) } });
    if (inFlight?.kind === 'mcp') inFlight = undefined;
  };
  const execute = async (name, args, toolCallId) => {
    if (allowedTools && !allowedTools.has(name)) return { content: 'PI_TOOL_NOT_ALLOWED', isError: true };
    if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
    if (pausedMessages) return { content: 'Execution paused for approval', isError: true };
    const before = getSnapshot();
    const beforeSession = snapshotSession(sessionManager);
    send({ type: 'checkpoint', messages: before });
    send({ type: 'tool_call', name, args, toolCallId });
    inFlight = { messages: before, piSession: beforeSession, plan: clone(plan) };
    let output;
    try {
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
      const child = await runAgent({ ...request, runId: childId, input: task, images: undefined, messages: [], piMessages: undefined, piSession: undefined, plan: [], recoveredControls: undefined, tools: childTools,
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
    if (output?.pause) { pausedMessages = before; pausedSession = beforeSession; stop(); }
    return output || { content: null };
    } finally { inFlight = undefined; }
  };
  try {
    const credential = { type: 'api_key', key: request.model.token };
    const credentials = { async read(id) { return id === 'forge-runtime' ? credential : undefined; }, async list() { return [{ providerId: 'forge-runtime', type: 'api_key' }]; }, async modify(_id, fn) { return fn(credential); }, async delete() {} };
    const modelRuntime = await ModelRuntime.create({ credentials, modelsPath: null, modelsStorePath: join(cwd, 'model-cache.json'), allowModelNetwork: false, refreshOnCreate: false });
    modelRuntime.registerProvider('forge-runtime', {
      baseUrl: request.model.baseUrl, api: request.model.api, apiKey: request.model.token, authHeader: true,
      models: [{ id: request.model.id, name: request.model.id, reasoning: false, input: ['text','image'], cost: zeroUsage().cost,
        contextWindow: limits.contextWindow, maxTokens: limits.maxTokens, compat: request.model.compat }],
    });
    const originalStream = modelRuntime.streamSimple.bind(modelRuntime);
    modelRuntime.streamSimple = (model, context, options) => {
      if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
      // budget.calls counts settled model turns (incremented on message_end), so a
      // transport retry of the same turn cannot burn the turn budget.
      if (budget.calls >= budget.maxCalls || budget.tokens >= budget.maxTokens) { fatal = new Error('PI_RUN_BUDGET_EXHAUSTED'); throw fatal; }
      // Account for the final extension-adjusted system text and tool schemas.
      // Summarization uses a separate prompt; keep the main run's larger reserve.
      if (contextBudget) {
        const actual = assertPromptBudget(limits, context.systemPrompt || '', context.tools || [], request.images?.length?[{type:'text',text:request.input||''},...request.images]:request.input||'');
        if (actual.reserveTokens > contextBudget.reserveTokens) updateContextBudget(actual);
      }
      if (Array.isArray(context.tools)) {
        const fixed = assertPromptBudget(limits, context.systemPrompt || '', context.tools, '');
        const messages = (context.messages || []).reduce((sum, message) => sum + estimatePromptTokens(message.content ?? ''), 0);
        if (messages > fixed.availableHistoryTokens) throw new Error('PI_CONTEXT_HISTORY_TOO_LARGE');
      }
      return originalStream(model, context, { ...options, maxRetries: 0, maxTokens: Math.max(1, Math.min(limits.maxTokens, options?.maxTokens ?? limits.maxTokens, budget.maxTokens - budget.tokens)) });
    };
    // A failed gateway request can already have incurred supplier cost. Keep
    // retry an explicit user operation after its receipt has been inspected.
    const settingsManager = SettingsManager.inMemory({ compaction: { enabled: true, reserveTokens: limits.reserveTokens, keepRecentTokens: limits.keepRecentTokens }, retry: { enabled: false, maxRetries: 0, provider: { maxRetries: 0 } }, defaultProjectTrust: 'never' });
    const updateContextBudget = value => {
      contextBudget = value;
      settingsManager.applyOverrides({ compaction: { enabled: true, reserveTokens: value.reserveTokens, keepRecentTokens: value.keepRecentTokens } });
      send({ type: 'context_budget', ...value });
    };
    const ecosystem = await createForgeEcosystem({ tools: tools.map(t => t.name), operatorMcpConfig: depth ? undefined : operatorMcpConfig, onEvent: send,
      approveMcpTool: async call => {
        if (signal?.aborted) return 'deny';
        // Keep the original native call while approval/transport is pending.
        // An abort must not turn the adapter's synthetic denial into completed work.
        inFlight = { kind: 'mcp', messages: getSnapshot(), piSession: snapshotSession(sessionManager), plan: clone(plan) };
        send({ type: 'checkpoint', messages: inFlight.messages });
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
    const scopeGuard = pi => pi.on('tool_call', event => allowedTools && !allowedTools.has(event.toolName) ? { block: true, reason: 'PI_TOOL_NOT_ALLOWED' } : undefined);
    const loader = new DefaultResourceLoader({ ...resourceOptions, extensionFactories: [...resourceOptions.extensionFactories, scopeGuard], cwd, agentDir: cwd, settingsManager, systemPromptOverride: () => String(request.systemPrompt || 'Complete the task using the available Forge tools. Report only verified results.') });
    await loader.reload();
    if (loader.getExtensions().errors.length) throw new Error('PI_EXTENSION_LOAD_FAILED:' + loader.getExtensions().errors.map(e => e.error).join(';').slice(0, 1500));
    sessionManager = request.piSession !== undefined ? restoreSession(cwd, request.piSession) : SessionManager.inMemory(cwd);
    let history = request.piSession !== undefined ? sessionManager.buildSessionContext().messages : Array.isArray(request.piMessages) ? clone(request.piMessages) : (request.messages || []).filter(m => ['user', 'assistant'].includes(m.role)).map(m => ({ ...m, content: Array.isArray(m.content) ? m.content : textContent(m.content), timestamp: Date.now(), ...(m.role === 'assistant' ? { api: request.model.api, provider: 'forge-runtime', model: request.model.id, usage: zeroUsage(), stopReason: 'stop' } : {}) }));
    // Native snapshots have a 7 MiB storage limit in Forge. Reject an image
    // turn before provider dispatch if it cannot leave a durable checkpoint.
    if(Buffer.byteLength(JSON.stringify(request.piSession||history))+Buffer.byteLength(JSON.stringify(request.images||[]))>6*1024*1024)throw new Error('PI_IMAGE_HISTORY_LIMIT');
    const unresolved = pendingTools(history);
    // Resume the exact tool-use IDs through Forge's durable approval/idempotency path.
    // Never ask the model to invent a replacement tool call after approval.
    let input = request.input;
    if (!request.piSession && !request.piMessages && !input && history.at(-1)?.role === 'user') input = history.pop().content.map(c => c.text || '').join('\n');
    input ||= request.piSession || request.piMessages ? 'Continue the task using the recorded tool results. Do not repeat completed actions.' : 'Complete the task described in the conversation.';
    if (!request.piSession) {
      for (const message of history) appendLegacyMessage(sessionManager, message);
      if (plan.length) sessionManager.appendCustomEntry('forge-plan', { steps: plan });
    } else plan = sessionPlan(sessionManager);
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
    if (allowedTools) session.setActiveToolsByName([...allowedTools]);
    session.subscribe(event => {
      if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') send({ type: 'text_delta', delta: event.assistantMessageEvent.delta });
      if (event.type === 'message_end') {
        let delivered;
        if (event.message.role === 'user') {
          const text = typeof event.message.content === 'string' ? event.message.content : event.message.content.filter(part => part.type === 'text').map(part => part.text).join('\n');
          const index = queuedControls.findIndex(control => (control.expandedMessage || control.message) === text);
          if (index >= 0) delivered = queuedControls.splice(index, 1)[0];
        }
        if (event.message.role === 'assistant') {
          const usage = event.message.usage || {};
          const inputTokens = Number(usage.input || 0) + Number(usage.cacheRead || 0) + Number(usage.cacheWrite || 0);
          const outputTokens = Number(usage.output || 0);
          promptTokens += inputTokens; completionTokens += outputTokens; budget.tokens += inputTokens + outputTokens;
          budget.calls++; providerCalls++;
          send({ type: 'usage', promptTokens: inputTokens, completionTokens: outputTokens, providerCalls: 1 });
        }
        // SDK subscribers are notified before this message is appended to the
        // native manager. Defer so the tree and projected messages agree.
        queueMicrotask(() => {
          if (pausedMessages || interruptedState) return;
          if (delivered) {
            const receipt = { clientMessageId: delivered.clientMessageId, mode: delivered.mode, message: delivered.message, deliveredAt: new Date().toISOString() };
            sessionManager.appendCustomEntry('forge-control-delivery', receipt);
            controlReceipts.set(receipt.clientMessageId, receipt);
            deliveredControls.push(receipt);
          }
          send({ type: 'checkpoint', messages: getSnapshot() });
          if (delivered) send({ type: 'control_delivered', clientMessageId: delivered.clientMessageId, mode: delivered.mode, message: delivered.message });
        });
      }
      if (event.type === 'agent_settled') { acceptingControl = false; send({ type: 'agent_settled' }); }
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
    updateContextBudget(assertPromptBudget(limits, session.agent.state.systemPrompt, session.agent.state.tools, input));
    const controlReceipts = new Map(sessionManager.getEntries().filter(entry => entry.type === 'custom' && entry.customType === 'forge-control-delivery' && entry.data?.clientMessageId).map(entry => [entry.data.clientMessageId, entry.data]));
    const queueControl = async body => {
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['mode', 'message', 'clientMessageId'].includes(key))) throw new Error('PI_CONTROL_INVALID');
      const { mode, message, clientMessageId } = body;
      if (!['steer', 'follow_up'].includes(mode) || typeof message !== 'string' || !message.trim() || message.length > 16000 || typeof clientMessageId !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(clientMessageId)) throw new Error('PI_CONTROL_INVALID');
      const receipt = controlReceipts.get(clientMessageId) || queuedControls.find(control => control.clientMessageId === clientMessageId);
      if (receipt) {
        if (receipt.mode !== mode || receipt.message !== message) throw new Error('PI_CONTROL_ID_REUSED');
        return;
      }
      if (++controlCount > 16) throw new Error('PI_CONTROL_LIMIT_REACHED');
      const controlBudget = assertPromptBudget(limits, session.agent.state.systemPrompt, session.agent.state.tools, message);
      if (controlBudget.reserveTokens > contextBudget.reserveTokens) updateContextBudget(controlBudget);
      const control = { mode, message, clientMessageId };
      queuedControls.push(control);
      // Control messages are literal text. Do not expand /skill, templates or
      // extension commands when recovering an accepted user instruction.
      const native = { role: 'user', content: [{ type: 'text', text: message }], timestamp: Date.now() };
      if (mode === 'steer') session.agent.steer(native); else session.agent.followUp(native);
      send({ type: 'control_queued', mode, clientMessageId });
    };
    onControlReady?.(async body => {
      if (!acceptingControl || pausedMessages || signal?.aborted || !session.isStreaming) throw new Error('PI_RUN_NOT_ACCEPTING_CONTROL');
      await queueControl(body);
    });
    for (const call of unresolved) {
      if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
      const tool = session.agent.state.tools.find(tool => tool.name === call.name);
      if (!tool) throw new Error('PI_RESUME_TOOL_NOT_ALLOWED');
      send({ type: 'checkpoint', messages: getSnapshot() });
      let output;
      try { output = await tool.execute(call.toolCallId, call.args, signal); }
      catch (error) { if (signal?.aborted) throw error; output = { content: textContent(error.message), isError: true }; }
      if (pausedMessages) return { content: '', promptTokens, completionTokens, providerCalls, messages: pausedMessages, piSession: pausedSession, paused: true, pendingToolCalls: pendingTools(pausedMessages), plan };
      // Replayed calls run outside the SDK loop, so explicitly publish the same receipt.
      if (call.name === 'mcp') completeMcpCalls(output);
      const result = { role: 'toolResult', toolCallId: call.toolCallId, toolName: call.name, content: output.content,
        isError: Boolean(output.isError || (call.name === 'mcp' && output.details?.error)),
        ...(output.details === undefined ? {} : { details: output.details }), timestamp: Date.now() };
      session.agent.state.messages.push(result); sessionManager.appendMessage(result);
      send({ type: 'checkpoint', messages: getSnapshot() });
    }
    for (const control of request.recoveredControls || []) await queueControl(control);
    // Native usage fallback counts messages only. Legacy histories can have zero
    // provider usage, and freshly selected tools/system text were absent from the
    // previous call. Compact before adding the current prompt if they no longer fit.
    const historyEstimate = session.agent.state.messages.reduce((sum, message) => sum + estimatePromptTokens(message.content ?? message.summary ?? ''), 0);
    if (historyEstimate > limits.contextWindow - contextBudget.reserveTokens) {
      try { await session.compact(); }
      catch (error) {
        if (/Nothing to compact|Already compacted/.test(error.message)) throw new Error('PI_CONTEXT_HISTORY_TOO_LARGE');
        throw error;
      }
    }
    acceptingControl = true;
    await session.prompt(String(input), {images:request.images});
    acceptingControl = false;
    if (abortPromise) await abortPromise;
    if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
    if (fatal) throw fatal;
    const messages = pausedMessages || getSnapshot();
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!pausedMessages && last?.stopReason === 'error') throw new Error(last.errorMessage || 'PI_MODEL_FAILED');
    return { content: pausedMessages ? '' : (last?.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n'), promptTokens, completionTokens, providerCalls,
      messages, piSession: pausedSession || snapshotSession(sessionManager), paused: Boolean(pausedMessages), pendingToolCalls: pendingTools(messages), plan, contextBudget, deliveredControls, engine: 'pi', engineVersion: '0.85.1' };
  } catch (error) {
    acceptingControl = false;
    if (sessionManager) {
      const messages = pausedMessages || interruptedState?.messages || getSnapshot();
      const checkpoint = { messages, piSession: pausedSession || interruptedState?.piSession || snapshotSession(sessionManager), plan: clone(interruptedState?.plan || plan), pendingToolCalls: pendingTools(messages) };
      send({ type: 'checkpoint', ...checkpoint });
      error.checkpoint = checkpoint;
    }
    throw error;
  } finally {
    acceptingControl = false;
    onControlReady?.(undefined);
    signal?.removeEventListener('abort', stop);
    if (session) { session.agent.clearAllQueues(); await session.abort(); await session.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' }); session.dispose(); }
    // Only remove the directory created for this invocation, never a caller path.
    if (resolve(cwd).startsWith(workRoot + sep) && cwd.split(sep).at(-1).startsWith('forge-pi-run-')) await rm(cwd, { recursive: true, force: true });
  }
}
