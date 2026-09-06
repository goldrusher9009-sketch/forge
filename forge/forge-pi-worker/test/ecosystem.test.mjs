import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { DefaultResourceLoader, SettingsManager } from '@earendil-works/pi-coding-agent';
import { createForgeEcosystem, validateOperatorMcpConfig } from '../ecosystem.mjs';

const SANDBOX_TOOLS = ['sandbox_browser', 'sandbox_file', 'sandbox_shell', 'sandbox_document', 'sandbox_artifact'];
const MCP_EVENT = 'pi-mcp-adapter:tool-approval-request';

async function withScratch(fn) {
  const parent = resolve(tmpdir());
  const scratch = await mkdtemp(join(parent, 'forge-ecosystem-test-'));
  try { return await fn(scratch); }
  finally {
    const target = resolve(scratch);
    assert(target.startsWith(`${parent}${sep}forge-ecosystem-test-`));
    await rm(target, { recursive: true, force: true });
  }
}

function installBuiltin(ecosystem) {
  const tools = new Map();
  const handlers = new Map();
  const entries = [];
  ecosystem.extensionFactories[0].factory({
    registerTool: tool => tools.set(tool.name, tool),
    on: (name, handler) => handlers.set(name, handler),
    appendEntry: (customType, data) => entries.push({ type: 'custom', customType, data }),
  });
  return { tools, handlers, entries };
}

test('SDK loads only the bundled resources, including working headless extension tools', async () => {
  await withScratch(async scratch => {
    const ecosystem = await createForgeEcosystem({ tools: SANDBOX_TOOLS });
    const loader = new DefaultResourceLoader({
      ...ecosystem.resourceLoaderOptions,
      cwd: scratch, agentDir: join(scratch, 'agent'), settingsManager: SettingsManager.inMemory({}),
    });
    await loader.reload();
    assert.equal(loader.getSkills().skills.length, 4);
    assert.equal(loader.getPrompts().prompts.length, 4);
    assert.deepEqual(loader.getExtensions().errors, []);
    const tools = loader.getExtensions().extensions.flatMap(extension => [...extension.tools.values()].map(tool => tool.definition));
    assert.deepEqual(tools.map(tool => tool.name).sort(), ['forge_plan', 'forge_skill']);
    const loaded = await tools.find(tool => tool.name === 'forge_skill').execute('load', { name: 'forge-documents' });
    assert.equal(loaded.details.source, 'forge-bundled');
    assert.match(loaded.content[0].text, /render_markdown_pdf/);
  });
});

test('skills and prompts are filtered against the tools actually supplied', async () => {
  const sandbox = await createForgeEcosystem({ tools: SANDBOX_TOOLS.map(name => ({ function: { name } })) });
  assert.equal(sandbox.skills.length, 4);
  const legacy = await createForgeEcosystem({ tools: [{ name: 'web_search' }] });
  assert.deepEqual(legacy.skills.map(skill => skill.name), ['forge-planning']);
  assert.deepEqual(legacy.prompts.map(prompt => prompt.name), ['forge-plan']);
  const builtin = installBuiltin(legacy);
  await assert.rejects(builtin.tools.get('forge_skill').execute('load', { name: 'forge-documents' }), /NOT_AVAILABLE/);
  await assert.rejects(builtin.tools.get('forge_skill').execute('load', { name: '../../.env' }), /NOT_AVAILABLE/);
});

test('plan completion requires evidence and the declared plan survives session restoration', async () => {
  const events = [];
  const ecosystem = await createForgeEcosystem({ onEvent: event => events.push(event) });
  const first = installBuiltin(ecosystem);
  const plan = first.tools.get('forge_plan');
  await plan.execute('plan', { operation: 'replace', steps: [
    { id: 'inspect', title: 'Inspect the supplied input', status: 'in_progress' },
    { id: 'deliver', title: 'Commit the requested output', status: 'pending' },
  ] });
  await assert.rejects(plan.execute('plan', { operation: 'update', id: 'inspect', status: 'completed' }), /EVIDENCE_REQUIRED/);
  await assert.rejects(plan.execute('plan', { operation: 'update', id: 'deliver', status: 'in_progress' }), /MULTIPLE_ACTIVE/);
  await plan.execute('plan', { operation: 'update', id: 'inspect', status: 'completed', evidence: 'Tool returned the input rows.' });
  assert.equal(first.entries.length, 2);
  const restored = installBuiltin(ecosystem);
  restored.handlers.get('session_start')({}, { sessionManager: { getBranch: () => first.entries } });
  const state = await restored.tools.get('forge_plan').execute('get', { operation: 'get' });
  assert.equal(state.details.steps[0].status, 'completed');
  assert.equal(state.details.declaredProgress, true);
  assert.equal(events.length, 2);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(plan.execute('get', { operation: 'get' }, abort.signal), /CANCELLED/);
});

test('MCP is absent by default and cannot import commands, ambient config, or wildcard tools', async () => {
  const ecosystem = await createForgeEcosystem({
    createMcpAdapter: () => { throw new Error('Default resources must not import or instantiate MCP'); },
  });
  assert.equal(ecosystem.extensionFactories.length, 1);
  assert.deepEqual(ecosystem.catalog.mcpServers, []);
  assert.equal(validateOperatorMcpConfig({ mcpServers: {} }), null);
  for (const config of [
    { mcpServers: {}, imports: ['claude'] },
    { mcpServers: {}, settings: { hostConfigDiscovery: 'on' } },
    { mcpServers: { bad: { command: 'npx', args: ['arbitrary-package'] } } },
    { mcpServers: { bad: { url: 'http://example.invalid/mcp', includeTools: ['read'] } } },
    { mcpServers: { bad: { url: 'https://example.invalid/mcp', includeTools: ['*'] } } },
    { mcpServers: { bad: { url: 'https://example.invalid/mcp', includeTools: ['read'], headers: { Authorization: '${HOME}' } } } },
  ]) assert.throws(() => validateOperatorMcpConfig(config), /FORGE_MCP_/);
});

test('explicit MCP configuration is isolated and public metadata excludes endpoint credentials', async () => {
  let received;
  const config = { mcpServers: { docs: {
    url: 'https://example.invalid/mcp', includeTools: ['read'], headers: { Authorization: 'Bearer test-sentinel-only' },
  } } };
  await assert.rejects(createForgeEcosystem({ operatorMcpConfig: config }), /APPROVAL_BROKER_REQUIRED/);
  const ecosystem = await createForgeEcosystem({
    operatorMcpConfig: config, approveMcpTool: async () => 'deny',
    createMcpAdapter: options => { received = options.config; return () => {}; },
  });
  config.mcpServers.docs.includeTools.push('write');
  assert.deepEqual(received.mcpServers.docs.includeTools, ['read']);
  assert.equal(received.settings.hostConfigDiscovery, 'off');
  assert.equal(received.settings.autoAuth, false);
  assert.equal(received.settings.scriptMode, false);
  assert.equal(received.settings.sampling, false);
  assert.equal(received.settings.elicitation, false);
  assert.equal(received.mcpServers.docs.approveTools, true);
  assert.equal(received.mcpServers.docs.auth, false);
  assert.equal(received.mcpServers.docs.oauth, false);
  assert(!JSON.stringify(ecosystem.catalog).includes('test-sentinel-only'));
  assert(!JSON.stringify(ecosystem.catalog).includes('example.invalid'));
});

test('MCP calls require a per-call Forge approval and reject undeclared tools or session grants', async () => {
  let approval = 'allow_once';
  let calls = 0;
  const ecosystem = await createForgeEcosystem({
    operatorMcpConfig: { mcpServers: { docs: { url: 'https://example.invalid/mcp', includeTools: ['read'] } } },
    approveMcpTool: async () => { calls += 1; return approval; },
    createMcpAdapter: () => () => {},
  });
  let handler;
  ecosystem.extensionFactories.find(extension => extension.name === 'forge-mcp-approval').factory({
    events: { on: (event, callback) => { assert.equal(event, MCP_EVENT); handler = callback; return () => {}; } },
    on: () => {},
  });
  async function decide(toolName = 'read', signal) {
    let pending;
    handler({ requestId: 'test-request', serverName: 'docs', originalToolName: toolName, args: {}, origin: 'proxy', signal,
      claim: callback => { pending = callback(); return true; },
    });
    return pending;
  }
  assert.equal(await decide(), 'allow_once');
  assert.equal(await decide(), 'allow_once');
  assert.equal(calls, 2);
  assert.equal(await decide('write'), 'deny');
  assert.equal(calls, 2);
  approval = 'allow_for_session';
  assert.equal(await decide(), 'deny');
  const abort = new AbortController(); abort.abort();
  assert.equal(await decide('read', abort.signal), 'deny');
});

test('real pi-mcp-adapter factory loads through the worker TypeScript loader without network servers', async () => {
  await withScratch(async scratch => {
    const ecosystem = await createForgeEcosystem({
      operatorMcpConfig: { mcpServers: { docs: {
        url: 'https://example.invalid/mcp', includeTools: ['read'], disabled: true,
      } } },
      approveMcpTool: async () => 'deny',
    });
    assert.equal(ecosystem.catalog.extensions.find(extension => extension.name === 'pi-mcp-adapter').enabled, true);
    const loader = new DefaultResourceLoader({
      ...ecosystem.resourceLoaderOptions,
      cwd: scratch, agentDir: join(scratch, 'agent'), settingsManager: SettingsManager.inMemory({}),
    });
    await loader.reload();
    assert.deepEqual(loader.getExtensions().errors, []);
    const adapter = loader.getExtensions().extensions.find(extension => extension.path === '<inline:pi-mcp-adapter>');
    assert(adapter);
    assert.deepEqual([...adapter.tools.keys()], ['mcp']);
  });
});
