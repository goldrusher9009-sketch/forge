import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MCP_APPROVAL_EVENT = 'pi-mcp-adapter:tool-approval-request';
const NAME = /^[a-z][a-z0-9-]{0,63}$/;
const STATUS = new Set(['pending', 'in_progress', 'completed']);
const clone = value => JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function requireCondition(condition, code) {
  if (!condition) throw new Error(code);
}

function sourceInfo(filePath, baseDir) {
  return { path: filePath, source: 'forge-bundled', scope: 'temporary', origin: 'package', baseDir };
}

function result(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data) }], details: data };
}

/** Validates operator configuration, never reading environment variables or ambient MCP files.
 * The supported surface deliberately excludes stdio commands, imports, OAuth, and package paths.
 * Network isolation and tenant/run binding remain the worker host's responsibility.
 */
export function validateOperatorMcpConfig(input) {
  if (input === undefined || input === null) return null;
  requireCondition(object(input) && Object.keys(input).every(key => key === 'mcpServers'), 'FORGE_MCP_CONFIG_FIELDS_INVALID');
  requireCondition(object(input.mcpServers), 'FORGE_MCP_SERVERS_REQUIRED');
  const entries = Object.entries(input.mcpServers);
  requireCondition(entries.length <= 8, 'FORGE_MCP_SERVER_LIMIT');
  const mcpServers = Object.create(null);
  const allowedFields = new Set(['url', 'headers', 'includeTools', 'disabled', 'requestTimeoutMs']);
  for (const [name, definition] of entries) {
    requireCondition(NAME.test(name) && name !== '__proto__', 'FORGE_MCP_SERVER_NAME_INVALID');
    requireCondition(object(definition) && Object.keys(definition).every(key => allowedFields.has(key)), 'FORGE_MCP_SERVER_FIELDS_INVALID');
    let url;
    try { url = new URL(definition.url); } catch { throw new Error('FORGE_MCP_URL_INVALID'); }
    requireCondition(url.protocol === 'https:' && !url.username && !url.password && !url.hash, 'FORGE_MCP_HTTPS_URL_REQUIRED');
    requireCondition(Array.isArray(definition.includeTools) && definition.includeTools.length > 0 && definition.includeTools.length <= 32, 'FORGE_MCP_EXACT_TOOL_ALLOWLIST_REQUIRED');
    requireCondition(definition.includeTools.every(tool => typeof tool === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(tool)), 'FORGE_MCP_TOOL_NAME_INVALID');
    const headers = {};
    if (definition.headers !== undefined) {
      requireCondition(object(definition.headers) && Object.keys(definition.headers).length <= 16, 'FORGE_MCP_HEADERS_INVALID');
      for (const [key, value] of Object.entries(definition.headers)) {
        requireCondition(/^[A-Za-z0-9-]{1,100}$/.test(key) && typeof value === 'string' && value.length <= 8192 && !/[\r\n]/.test(value) && !value.includes('${'), 'FORGE_MCP_HEADER_INVALID');
        requireCondition(!['host', 'connection', 'proxy-authorization', 'content-length'].includes(key.toLowerCase()), 'FORGE_MCP_HEADER_FORBIDDEN');
        headers[key] = value;
      }
    }
    requireCondition(definition.disabled === undefined || typeof definition.disabled === 'boolean', 'FORGE_MCP_DISABLED_INVALID');
    const timeout = definition.requestTimeoutMs ?? 30_000;
    requireCondition(Number.isInteger(timeout) && timeout >= 1000 && timeout <= 120_000, 'FORGE_MCP_TIMEOUT_INVALID');
    mcpServers[name] = {
      url: url.href, headers, includeTools: [...new Set(definition.includeTools)],
      disabled: definition.disabled === true, requestTimeoutMs: timeout,
      auth: false, oauth: false, directTools: false, exposeResources: false,
      approveTools: true, lifecycle: 'lazy', httpTransport: 'streamable-http',
    };
  }
  if (!entries.length) return null;
  return {
    mcpServers,
    settings: {
      hostConfigDiscovery: 'off', agentPluginPaths: [], autoAuth: false,
      sampling: false, samplingAutoApprove: false, elicitation: false,
      scriptMode: false, directTools: false, approveTools: true,
      showStatusIcon: false, mcpFooterStatus: 'off', notifyOnStartupConnect: false,
      warnOnLargeDirectTools: false, outputGuard: true,
      authRequiredMessage: 'MCP credentials must be configured by the Forge operator.',
    },
  };
}

function validatePlanStep(step) {
  requireCondition(object(step) && NAME.test(step.id || ''), 'FORGE_PLAN_STEP_ID_INVALID');
  requireCondition(typeof step.title === 'string' && step.title.trim().length > 0 && step.title.length <= 240, 'FORGE_PLAN_STEP_TITLE_INVALID');
  requireCondition(STATUS.has(step.status), 'FORGE_PLAN_STEP_STATUS_INVALID');
  requireCondition(step.evidence === undefined || (typeof step.evidence === 'string' && step.evidence.length <= 2000), 'FORGE_PLAN_EVIDENCE_INVALID');
  requireCondition(step.status !== 'completed' || step.evidence?.trim(), 'FORGE_PLAN_COMPLETION_EVIDENCE_REQUIRED');
  return { id: step.id, title: step.title.trim(), status: step.status, ...(step.evidence ? { evidence: step.evidence.trim() } : {}) };
}

/** Original headless implementation using the official plan-mode extension's registerTool/
 * appendEntry pattern. Declared plan progress is never a Forge execution receipt.
 */
export function createForgeBuiltinExtension({ skills, onEvent = () => {} }) {
  const availableSkills = new Map(skills.map(skill => [skill.name, skill]));
  return function forgeBuiltinResources(pi) {
    let steps = [];
    pi.on('session_start', (_event, ctx) => {
      const entries = ctx.sessionManager?.getBranch?.() || [];
      const saved = [...entries].reverse().find(entry => entry.type === 'custom' && entry.customType === 'forge-plan');
      if (saved?.data?.steps) {
        try { steps = saved.data.steps.map(validatePlanStep); } catch { steps = []; }
      }
    });
    pi.on('before_agent_start', event => ({
      systemPrompt: `${event.systemPrompt}\n\nForge bundled skills are loaded with forge_skill, not by opening worker-local paths with workspace tools. Available skills: ${[...availableSkills.keys()].join(', ')}. Load a relevant skill before using its workflow. forge_plan records declared progress; only Forge tool receipts establish that an external action or artifact exists.`,
    }));
    pi.registerTool({
      name: 'forge_skill', label: 'Load Forge skill',
      description: `Load the complete, operator-bundled instructions for one skill. Available: ${[...availableSkills.keys()].join(', ')}. This cannot load arbitrary paths or install code.`,
      parameters: { type: 'object', properties: { name: { type: 'string', enum: [...availableSkills.keys()] } }, required: ['name'], additionalProperties: false },
      async execute(_toolCallId, args, signal) {
        if (signal?.aborted) throw new Error('FORGE_SKILL_CANCELLED');
        const skill = availableSkills.get(args?.name);
        requireCondition(Boolean(skill), 'FORGE_SKILL_NOT_AVAILABLE');
        onEvent({ type: 'skill_loaded', name: skill.name });
        return { content: [{ type: 'text', text: skill.body }], details: { name: skill.name, source: 'forge-bundled' } };
      },
    });
    pi.registerTool({
      name: 'forge_plan', label: 'Track task plan',
      description: 'Record or update a bounded plan. Completed steps require evidence. Plan progress does not mark the Forge run completed.',
      parameters: {
        type: 'object', properties: {
          operation: { type: 'string', enum: ['get', 'replace', 'update'] },
          steps: { type: 'array', maxItems: 12, items: { type: 'object', properties: {
            id: { type: 'string' }, title: { type: 'string' }, status: { type: 'string', enum: [...STATUS] }, evidence: { type: 'string' },
          }, required: ['id', 'title', 'status'], additionalProperties: false } },
          id: { type: 'string' }, status: { type: 'string', enum: [...STATUS] }, evidence: { type: 'string' },
        }, required: ['operation'], additionalProperties: false,
      },
      async execute(_toolCallId, args, signal) {
        if (signal?.aborted) throw new Error('FORGE_PLAN_CANCELLED');
        requireCondition(['get', 'replace', 'update'].includes(args?.operation), 'FORGE_PLAN_OPERATION_INVALID');
        if (args.operation === 'get') return result({ steps: clone(steps), declaredProgress: true });
        let next;
        if (args.operation === 'replace') {
          requireCondition(Array.isArray(args.steps) && args.steps.length > 0 && args.steps.length <= 12, 'FORGE_PLAN_STEPS_INVALID');
          next = args.steps.map(validatePlanStep);
        } else {
          requireCondition(steps.some(step => step.id === args.id), 'FORGE_PLAN_STEP_NOT_FOUND');
          next = steps.map(step => step.id === args.id ? validatePlanStep({ ...step, status: args.status, evidence: args.evidence }) : step);
        }
        requireCondition(new Set(next.map(step => step.id)).size === next.length, 'FORGE_PLAN_DUPLICATE_ID');
        requireCondition(next.filter(step => step.status === 'in_progress').length <= 1, 'FORGE_PLAN_MULTIPLE_ACTIVE_STEPS');
        pi.appendEntry('forge-plan', { steps: clone(next) });
        steps = next;
        onEvent({ type: 'plan_updated', steps: clone(steps), declaredProgress: true });
        return result({ steps: clone(steps), declaredProgress: true });
      },
    });
  };
}

/** Create isolated SDK resources. Pass resourceLoaderOptions to DefaultResourceLoader;
 * callers still supply cwd, a per-run agentDir, in-memory settings and systemPrompt.
 * tools accepts tool names or definitions with name / function.name.
 * operatorMcpConfig MUST come from operator configuration, never a tenant request body.
 * approveMcpTool must return the literal 'allow_once' for an approved individual call.
 */
export async function createForgeEcosystem({ tools = [], operatorMcpConfig, approveMcpTool, onEvent = () => {}, createMcpAdapter } = {}) {
  requireCondition(Array.isArray(tools), 'FORGE_ECOSYSTEM_TOOLS_INVALID');
  const toolNames = new Set(tools.map(tool => typeof tool === 'string' ? tool : tool?.name || tool?.function?.name));
  const manifest = JSON.parse(await readFile(join(ROOT, 'ecosystem.json'), 'utf8'));
  const enabledSkills = [];
  for (const entry of manifest.skills) {
    if (!entry.requiresTools.every(name => toolNames.has(name))) continue;
    requireCondition(NAME.test(entry.name), 'FORGE_BUNDLED_SKILL_NAME_INVALID');
    const baseDir = join(ROOT, 'skills', entry.name);
    const filePath = join(baseDir, 'SKILL.md');
    const text = await readFile(filePath, 'utf8');
    requireCondition(/^---\r?\n/.test(text) && text.length <= 24_000, 'FORGE_BUNDLED_SKILL_INVALID');
    const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
    enabledSkills.push({ ...entry, filePath, baseDir, body, sourceInfo: sourceInfo(filePath, baseDir), disableModelInvocation: false });
  }
  const skills = enabledSkills.map(({ name, description, filePath, baseDir, sourceInfo, disableModelInvocation }) => ({ name, description, filePath, baseDir, sourceInfo, disableModelInvocation }));
  const prompts = enabledSkills.map(skill => ({
    name: skill.promptName, description: skill.description, argumentHint: '<task>',
    content: `Load forge_skill with name "${skill.name}" and apply its workflow to this task:\n\n$ARGUMENTS`,
    sourceInfo: skill.sourceInfo, filePath: skill.filePath,
  }));
  const extensionFactories = [{ name: 'forge-bundled-resources', factory: createForgeBuiltinExtension({ skills: enabledSkills, onEvent }) }];
  const config = validateOperatorMcpConfig(operatorMcpConfig);
  if (config) {
    requireCondition(typeof approveMcpTool === 'function', 'FORGE_MCP_APPROVAL_BROKER_REQUIRED');
    const adapterFactory = createMcpAdapter || (await import('pi-mcp-adapter')).createMcpAdapter;
    requireCondition(typeof adapterFactory === 'function', 'FORGE_MCP_ADAPTER_FACTORY_INVALID');
    extensionFactories.push({ name: 'forge-mcp-approval', factory: pi => {
      const unsubscribe = pi.events.on(MCP_APPROVAL_EVENT, request => {
        request.claim(async () => {
          if (request.signal?.aborted) return 'deny';
          const definition = config.mcpServers[request.serverName];
          if (!definition || definition.disabled || !definition.includeTools.includes(request.originalToolName)) return 'deny';
          const decision = await approveMcpTool({
            requestId: request.requestId, serverName: request.serverName,
            toolName: request.originalToolName, args: clone(request.args),
            origin: request.origin, signal: request.signal,
          });
          return !request.signal?.aborted && decision === 'allow_once' ? 'allow_once' : 'deny';
        });
      });
      pi.on('session_shutdown', () => { if (typeof unsubscribe === 'function') unsubscribe(); });
    } });
    extensionFactories.push({ name: 'pi-mcp-adapter', factory: adapterFactory({ config }) });
  }
  return {
    skills, prompts, extensionFactories,
    catalog: {
      schemaVersion: manifest.schemaVersion, piVersion: manifest.piVersion,
      skills: enabledSkills.map(({ name, description, requiresTools, promptName }) => ({ name, description, requiresTools, promptName })),
      extensions: manifest.extensions.map(entry => ({ ...entry, enabled: entry.name === 'pi-mcp-adapter' ? Boolean(config) : true })),
      mcpServers: config ? Object.entries(config.mcpServers).map(([name, definition]) => ({ name, enabled: !definition.disabled, tools: [...definition.includeTools] })) : [],
      resourcePolicy: clone(manifest.resourcePolicy),
    },
    resourceLoaderOptions: {
      noExtensions: true, noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true,
      additionalExtensionPaths: [], additionalSkillPaths: [], additionalPromptTemplatePaths: [], additionalThemePaths: [],
      extensionFactories,
      skillsOverride: () => ({ skills, diagnostics: [] }),
      promptsOverride: () => ({ prompts, diagnostics: [] }),
      agentsFilesOverride: () => ({ agentsFiles: [] }),
      systemPrompt: '',
      appendSystemPrompt: [],
    },
  };
}
