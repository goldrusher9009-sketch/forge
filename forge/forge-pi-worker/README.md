# Forge Pi worker

Forge's isolated Agent execution worker embeds the official `@earendil-works/pi-coding-agent` SDK. Forge remains responsible for task ownership, credentials, authorization, approvals, and persistent business records. The worker runs the model/tool loop and returns Pi history for continuation.

For the complete platform setup, migration scope, ecosystem configuration, and rollback, see [the Forge Pi migration runbook](../FORGE_PI_MIGRATION.md).

## Runtime and dependencies

- Node.js 24 or newer.
- `@earendil-works/pi-coding-agent` is pinned to **0.85.1**.
- `pi-mcp-adapter` is pinned to **2.32.1**. Installing this package does not automatically load host MCP settings or grant a connector access to a run.
- `tsx` is pinned to **4.22.1** and loaded by the start/test commands because the MCP adapter publishes a TypeScript entry point. The adapter's optional `pi-ai` peer is pinned to **0.84.1**; the coding-agent package retains its own **0.85.1** copy. This normal npm dependency arrangement avoids overriding the adapter's declared compatibility range.
- `.npmrc` uses `https://registry.npmmirror.com`, fixes exact direct versions, and disables dependency lifecycle scripts. `package-lock.json` records the resolved dependency tree.
- The Docker base image defaults to `docker.m.daocloud.io/library/node:24-bookworm-slim`. The image runs as the non-root `node` user.

```sh
npm ci --ignore-scripts
npm test
npm start
```

The worker listens on port `8791` by default. Direct local startup binds loopback; the container sets `HOST=0.0.0.0` for its private network. Set `FORGE_PI_WORKER_TOKEN` to an operator-generated value of at least 32 characters before startup. Configure its internal authentication and model credentials through the Forge deployment, rather than copying a developer's `~/.pi/agent`, `.env`, or OAuth cache into the image.

## Execution contract

`src/runtime.mjs` exports `runAgent(request, { emit, executeTool, signal, operatorMcpConfig })`.

The request identifies the Forge user/run and supplies an explicit model, system prompt, history/input, and the authorized tool definitions. `executeTool(name, args, toolCallId)` delegates each tool invocation back to Forge. A result with `pause: true` stops execution at the approval boundary. The return value contains generated content, token usage, native Pi messages, and any paused tool calls.

The model loop uses the actual Pi `createAgentSession()` API. It uses an isolated resource loader and in-memory credentials/settings/session state. Pi's built-in shell and filesystem tools are not enabled by default. The default ecosystem supplies the controlled `forge_skill` and `forge_plan` tools; skills are filtered by the run's available Forge tools. Operator-approved integrations are provided explicitly; a run does not discover arbitrary global or project extensions.

The Pi session in this process is not the durable system of record. Forge must persist the returned native messages/checkpoints with the run, preserve ownership on continuation, and apply its approval/idempotency rules before performing a tool side effect. Cancellation must propagate through the supplied `AbortSignal`; a tool implementation must honor its own cancellation and resource limits.

## Verification

`test/sdk.test.mjs` sends actual Pi SDK requests to an HTTP server bound to loopback. The fixtures implement OpenAI-compatible streaming responses without external model calls, real credentials, or billing. The checks cover:

- Text streaming and usage, with no default tools or global resource discovery.
- A real SDK tool-call round trip and accumulated usage across model turns.
- Tool failure remains an error in the native transcript.
- Approval pause before another model request.
- Continuation with the original approval tool-call ID, without repeating a previously completed tool.
- Cancellation of an unfinished provider stream.
- Actual child Pi SDK requests, parent/child usage aggregation, and rejection of recursive spawning by a child.

These checks validate the adapter and installed SDK together. A real model provider and production MCP connector still need acceptance tests using their configured credentials and network policy before rollout.

## Isolation boundary

Pi and its TypeScript extensions execute with the worker process's permissions. Loading an extension is a code execution decision; package installation alone is not sandboxing. Run this service behind Forge's private network/authentication boundary, restrict its mounts and egress, and keep customer code/tool execution inside the appropriate workspace sandbox. Do not mount the host Docker socket or a shared developer home directory into this worker.

For a container build, use this directory as the build context:

```sh
docker build -t forge-pi-worker:local .
```

The Pi upstream license is MIT. Keep upstream notices when redistributing the package; the dependency lock retains the individual packages and their licenses.
