import { fork } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** The pinned MCP adapter uses process-wide cache paths. A dedicated process
 * gives each invocation its own environment, adapter globals and cache lifetime.
 * It remains inside the worker container; this is not a customer-code sandbox.
 */
export async function runIsolatedAgent(request, { emit = () => {}, executeTool, signal, operatorMcpConfig, onControlReady } = {}) {
  if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
  const directory = await mkdtemp(join(tmpdir(), 'forge-pi-mcp-'));
  const env = { PI_CODING_AGENT_DIR: directory, TMPDIR: directory, TMP: directory, TEMP: directory };
  // Do not inherit provider keys, MCP discovery overrides, NODE_OPTIONS or the
  // service token. Only platform runtime paths and operator TLS trust are needed.
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'LANG', 'LC_ALL', 'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'SSL_CERT_DIR']) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  let child, abortTimer, latestCheckpoint, closed = false;
  const controls = new Map();
  let sequence = 0;
  const send = message => { if (child?.connected) child.send(message, () => {}); };
  const abort = () => {
    send({ type: 'abort' });
    abortTimer ||= setTimeout(() => child?.kill('SIGKILL'), 5000);
  };
  try {
    child = fork(new URL('./isolated-runner.mjs', import.meta.url), [], {
      env, execArgv: ['--import', import.meta.resolve('tsx')],
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'], serialization: 'advanced',
      windowsHide: true,
    });
    const exit = new Promise(resolve => child.once('close', resolve));
    signal?.addEventListener('abort', abort, { once: true });
    try {
      return await new Promise((resolve, reject) => {
        const fail = error => { if (latestCheckpoint && !error.checkpoint) error.checkpoint = latestCheckpoint; reject(error); };
        child.once('error', () => fail(new Error('PI_ISOLATED_RUNTIME_START_FAILED')));
        child.once('exit', () => { closed = true; fail(new Error(signal?.aborted ? 'PI_RUN_CANCELLED' : 'PI_ISOLATED_RUNTIME_EXITED')); });
        child.on('message', message => {
          if (closed) return;
          if (message.type === 'event') {
            if (message.event.type === 'checkpoint') {
              const { type, ...checkpoint } = message.event; latestCheckpoint = checkpoint;
            }
            try { emit(message.event); } catch (error) { fail(error); }
          } else if (message.type === 'tool') {
            Promise.resolve().then(() => {
              if (signal?.aborted) throw new Error('PI_RUN_CANCELLED');
              return executeTool(message.name, message.args, message.toolCallId);
            }).then(output => send({ type: 'tool_result', id: message.id, output }),
              error => send({ type: 'tool_result', id: message.id, error: String(error?.message || 'PI_TOOL_FAILED') }));
          } else if (message.type === 'control_ready') {
            onControlReady?.(message.available ? control => new Promise((resolveControl, rejectControl) => {
              if (closed || signal?.aborted) return rejectControl(new Error('PI_RUN_CANCELLED'));
              const id = ++sequence; controls.set(id, { resolve: resolveControl, reject: rejectControl });
              send({ type: 'control', id, control });
            }) : undefined);
          } else if (message.type === 'control_result') {
            const pending = controls.get(message.id); controls.delete(message.id);
            if (message.error) pending?.reject(new Error(message.error)); else pending?.resolve(message.result);
          } else if (message.type === 'result') resolve(message.result);
          else if (message.type === 'error') {
            const error = new Error(message.error); error.checkpoint = message.checkpoint; fail(error);
          }
        });
        send({ type: 'start', request, operatorMcpConfig });
        if (signal?.aborted) abort();
      });
    } finally {
      closed = true;
      for (const pending of controls.values()) pending.reject(new Error('PI_RUN_NOT_ACCEPTING_CONTROL'));
      // The runner sends its terminal message only after native session disposal.
      // Terminate remaining adapter timers before deleting this run's cache.
      child.kill('SIGKILL');
      await exit;
    }
  } finally {
    clearTimeout(abortTimer); signal?.removeEventListener('abort', abort);
    await rm(directory, { recursive: true, force: true });
  }
}
