import { runAgent } from './runtime.mjs';

const controller = new AbortController();
const pending = new Map();
let started = false, sequence = 0, control;
const send = message => { if (process.connected) process.send(message, () => {}); };
const abort = () => {
  controller.abort();
  for (const entry of pending.values()) entry.reject(new Error('PI_RUN_CANCELLED'));
  pending.clear();
};
process.once('disconnect', () => { abort(); process.exit(1); });
process.on('message', async message => {
  if (message.type === 'abort') return abort();
  if (message.type === 'tool_result') {
    const entry = pending.get(message.id); pending.delete(message.id);
    if (message.error) entry?.reject(new Error(message.error)); else entry?.resolve(message.output);
    return;
  }
  if (message.type === 'control') {
    try {
      if (!control) throw new Error('PI_RUN_NOT_ACCEPTING_CONTROL');
      send({ type: 'control_result', id: message.id, result: await control(message.control) });
    } catch (error) { send({ type: 'control_result', id: message.id, error: error.message }); }
    return;
  }
  if (message.type !== 'start' || started) return;
  started = true;
  try {
    const result = await runAgent(message.request, {
      isolated: true, signal: controller.signal, operatorMcpConfig: message.operatorMcpConfig,
      emit: event => send({ type: 'event', event }),
      onControlReady: ready => { control = ready; send({ type: 'control_ready', available: Boolean(ready) }); },
      executeTool: (name, args, toolCallId) => new Promise((resolve, reject) => {
        if (controller.signal.aborted) return reject(new Error('PI_RUN_CANCELLED'));
        const id = ++sequence; pending.set(id, { resolve, reject });
        send({ type: 'tool', id, name, args, toolCallId });
      }),
    });
    send({ type: 'result', result });
  } catch (error) { send({ type: 'error', error: String(error?.message || 'PI_RUN_FAILED'), checkpoint: error.checkpoint }); }
});
