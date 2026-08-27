import path from 'path';

export const SANDBOX_RUN_STATES = [
  'requested',
  'provisioning',
  'ready',
  'hydrating_workspace',
  'running',
  'waiting_approval',
  'paused',
  'retrying',
  'checkpointing',
  'artifact_committing',
  'completed',
  'failed',
  'cancelled',
  'destroying',
  'destroyed',
] as const;

export type SandboxRunState = typeof SANDBOX_RUN_STATES[number];
export type SandboxApprovalClass = 'A' | 'B' | 'C';

export const SANDBOX_TERMINAL_STATES = new Set<SandboxRunState>(['completed', 'failed', 'cancelled']);

export const SANDBOX_STATE_TRANSITIONS: Record<SandboxRunState, SandboxRunState[]> = {
  requested: ['provisioning', 'cancelled', 'failed'],
  provisioning: ['ready', 'cancelled', 'failed'],
  ready: ['hydrating_workspace', 'cancelled', 'failed'],
  hydrating_workspace: ['running', 'cancelled', 'failed'],
  running: ['waiting_approval', 'paused', 'retrying', 'checkpointing', 'artifact_committing', 'cancelled', 'failed'],
  waiting_approval: ['running', 'cancelled', 'failed'],
  paused: ['running', 'cancelled', 'failed'],
  retrying: ['running', 'cancelled', 'failed'],
  checkpointing: ['running', 'artifact_committing', 'cancelled', 'failed'],
  artifact_committing: ['completed', 'cancelled', 'failed'],
  completed: ['destroying'],
  failed: ['destroying'],
  cancelled: ['destroying'],
  destroying: ['destroyed'],
  destroyed: [],
};

export function canTransitionSandboxState(from: string, to: string): boolean {
  if (!SANDBOX_RUN_STATES.includes(from as SandboxRunState) || !SANDBOX_RUN_STATES.includes(to as SandboxRunState)) return false;
  return SANDBOX_STATE_TRANSITIONS[from as SandboxRunState].includes(to as SandboxRunState);
}

export function normalizeSandboxPath(input: unknown): string {
  if (typeof input !== 'string' || !input.trim() || input.includes('\0')) throw new Error('SANDBOX_PATH_REQUIRED');
  const value = input.trim().replace(/\\/g, '/');
  if (value.startsWith('/') || /^[A-Za-z]:\//.test(value)) throw new Error('SANDBOX_ABSOLUTE_PATH_REJECTED');
  const normalized = path.posix.normalize(value);
  if (normalized === '..' || normalized.startsWith('../')) throw new Error('SANDBOX_PATH_ESCAPE_REJECTED');
  if (normalized.length > 512) throw new Error('SANDBOX_PATH_TOO_LONG');
  return normalized;
}

const CLASS_C_PATTERN = /\b(payment|pay\b|transfer|wire\b|bank\b|credit\s*card|password|passcode|mfa|2fa|captcha|security\s+control|create\s+admin|administrator|production\s+deploy|deploy\s+to\s+prod|bypass|disable\s+security)\b/i;
const DESTRUCTIVE_SHELL_PATTERN = /(^|[;&|]\s*|\s)(rm|rmdir|unlink|truncate|shred|mkfs|dd)\b|\bgit\s+push\b|\bnpm\s+publish\b|\bdocker\b|\/var\/run\/docker\.sock/i;
const FORBIDDEN_SHELL_PATTERN = /\bsudo\b|\bmount\b|\bumount\b|\bshutdown\b|\breboot\b|:\(\)\s*\{\s*:\|:\s*&\s*\}/i;

export function classifySandboxTool(toolName: string, args: Record<string, any>): { approvalClass: SandboxApprovalClass; reason: string } {
  const serialized = JSON.stringify(args || {});
  if (CLASS_C_PATTERN.test(serialized)) {
    return { approvalClass: 'C', reason: 'Blocked first-beta action: payment, credentials, security, administration, or production deployment' };
  }

  if (toolName === 'sandbox_browser') {
    const actions = Array.isArray(args?.actions) ? args.actions : [];
    const mutations = new Set(['fill', 'click', 'submit', 'upload', 'login']);
    if (actions.some((action: any) => mutations.has(String(action?.action || '').toLowerCase()))) {
      return { approvalClass: 'B', reason: 'Browser action can authenticate, upload, submit, click, or mutate an external system' };
    }
    return { approvalClass: 'A', reason: 'Read-only public browsing or screenshot' };
  }

  if (toolName === 'sandbox_shell') {
    const command = String(args?.command || '');
    if (FORBIDDEN_SHELL_PATTERN.test(command)) {
      return { approvalClass: 'C', reason: 'Privileged, host-control, or denial-of-service shell command is blocked' };
    }
    if (DESTRUCTIVE_SHELL_PATTERN.test(command)) {
      return { approvalClass: 'B', reason: 'Shell command may delete persistent workspace data or publish an external change' };
    }
    return { approvalClass: 'A', reason: 'Network-isolated sandbox-local shell operation' };
  }

  return { approvalClass: 'A', reason: 'Sandbox-local file, document, or artifact operation' };
}

function requireObject(value: unknown, code: string): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(code);
  return value as Record<string, any>;
}

export function validateSandboxToolInput(toolName: string, rawArgs: unknown): Record<string, any> {
  const args = requireObject(rawArgs, 'SANDBOX_TOOL_ARGS_REQUIRED');
  if (toolName === 'sandbox_file') {
    const operation = String(args.operation || '');
    if (!['list', 'read', 'write', 'stat', 'mkdir'].includes(operation)) throw new Error('SANDBOX_FILE_OPERATION_INVALID');
    const normalized: Record<string, any> = { ...args, operation, path: normalizeSandboxPath(args.path || '.') };
    if (operation === 'write') {
      if (typeof args.content !== 'string') throw new Error('SANDBOX_FILE_CONTENT_REQUIRED');
      if (Buffer.byteLength(args.content, 'utf8') > 2 * 1024 * 1024) throw new Error('SANDBOX_FILE_CONTENT_TOO_LARGE');
    }
    return normalized;
  }
  if (toolName === 'sandbox_shell') {
    if (typeof args.command !== 'string' || !args.command.trim()) throw new Error('SANDBOX_SHELL_COMMAND_REQUIRED');
    if (args.command.length > 20_000) throw new Error('SANDBOX_SHELL_COMMAND_TOO_LONG');
    return {
      command: args.command,
      cwd: normalizeSandboxPath(args.cwd || '.'),
      timeoutMs: Math.max(1000, Math.min(Number(args.timeoutMs) || 30_000, 120_000)),
    };
  }
  if (toolName === 'sandbox_browser') {
    if (!Array.isArray(args.actions) || args.actions.length < 1 || args.actions.length > 20) throw new Error('SANDBOX_BROWSER_ACTIONS_INVALID');
    const allowed = new Set(['navigate', 'extract', 'screenshot', 'fill', 'click', 'submit', 'upload', 'wait']);
    const actions = args.actions.map((raw: unknown) => {
      const action = requireObject(raw, 'SANDBOX_BROWSER_ACTION_INVALID');
      const name = String(action.action || '').toLowerCase();
      if (!allowed.has(name)) throw new Error('SANDBOX_BROWSER_ACTION_INVALID');
      const output: Record<string, any> = { ...action, action: name };
      if (name === 'navigate') {
        if (typeof action.url !== 'string' || !/^https?:\/\//i.test(action.url)) throw new Error('SANDBOX_BROWSER_URL_INVALID');
        output.url = action.url.slice(0, 4096);
      }
      if (['fill', 'click', 'submit', 'upload', 'extract'].includes(name) && action.selector != null) output.selector = String(action.selector).slice(0, 1000);
      if (name === 'fill') output.value = String(action.value ?? '').slice(0, 20_000);
      if (name === 'upload') output.path = normalizeSandboxPath(action.path);
      if (name === 'screenshot') output.path = normalizeSandboxPath(action.path || `screenshots/${Date.now()}.png`);
      if (name === 'wait') output.timeoutMs = Math.max(0, Math.min(Number(action.timeoutMs) || 1000, 10_000));
      return output;
    });
    return { actions };
  }
  if (toolName === 'sandbox_document') {
    const operation = String(args.operation || '');
    if (!['render_markdown_pdf', 'inspect_spreadsheet', 'create_spreadsheet'].includes(operation)) throw new Error('SANDBOX_DOCUMENT_OPERATION_INVALID');
    const output: Record<string, any> = { ...args, operation };
    if (operation === 'render_markdown_pdf') {
      output.sourcePath = normalizeSandboxPath(args.sourcePath);
      output.outputPath = normalizeSandboxPath(args.outputPath || 'output.pdf');
      output.title = String(args.title || 'Forge artifact').slice(0, 200);
    } else if (operation === 'inspect_spreadsheet') {
      output.path = normalizeSandboxPath(args.path);
    } else {
      output.path = normalizeSandboxPath(args.path);
      if (!Array.isArray(args.rows) || args.rows.length > 10_000) throw new Error('SANDBOX_SPREADSHEET_ROWS_INVALID');
      output.rows = args.rows;
      output.sheetName = String(args.sheetName || 'Sheet1').slice(0, 31);
    }
    return output;
  }
  if (toolName === 'sandbox_artifact') {
    if (String(args.operation || 'commit') !== 'commit') throw new Error('SANDBOX_ARTIFACT_OPERATION_INVALID');
    return {
      operation: 'commit',
      path: normalizeSandboxPath(args.path),
      title: String(args.title || path.posix.basename(String(args.path || 'artifact'))).slice(0, 200),
      mimeType: String(args.mimeType || 'application/octet-stream').slice(0, 200),
    };
  }
  throw new Error('SANDBOX_TOOL_NOT_ALLOWED');
}

export const SANDBOX_TOOLS_ANTHROPIC = [
  {
    name: 'sandbox_browser',
    description: 'Use the isolated browser for public research or an explicitly approved external interaction. Send an ordered action list. Read-only navigation/extraction is automatic; fill/click/submit/upload requires user approval.',
    input_schema: {
      type: 'object',
      properties: {
        actions: {
          type: 'array', minItems: 1, maxItems: 20,
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['navigate', 'extract', 'screenshot', 'fill', 'click', 'submit', 'upload', 'wait'] },
              url: { type: 'string' }, selector: { type: 'string' }, value: { type: 'string' }, path: { type: 'string' }, timeoutMs: { type: 'number' },
            },
            required: ['action'],
          },
        },
      },
      required: ['actions'],
    },
  },
  {
    name: 'sandbox_file',
    description: 'Read, write, list, stat, or create a directory inside the persistent logical workspace. Paths are always relative to /workspace.',
    input_schema: {
      type: 'object',
      properties: { operation: { type: 'string', enum: ['list', 'read', 'write', 'stat', 'mkdir'] }, path: { type: 'string' }, content: { type: 'string' } },
      required: ['operation', 'path'],
    },
  },
  {
    name: 'sandbox_shell',
    description: 'Run a command inside the network-isolated non-root sandbox. Use relative workspace paths. Destructive commands require approval; privileged/host-control commands are blocked.',
    input_schema: {
      type: 'object',
      properties: { command: { type: 'string' }, cwd: { type: 'string' }, timeoutMs: { type: 'number' } },
      required: ['command'],
    },
  },
  {
    name: 'sandbox_document',
    description: 'Render Markdown to PDF, inspect CSV/XLSX, or create a validated XLSX file inside the workspace.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['render_markdown_pdf', 'inspect_spreadsheet', 'create_spreadsheet'] },
        sourcePath: { type: 'string' }, outputPath: { type: 'string' }, title: { type: 'string' }, path: { type: 'string' }, rows: { type: 'array', items: { type: 'object' } }, sheetName: { type: 'string' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'sandbox_artifact',
    description: 'Commit a finished workspace file to persistent artifact storage. A Run cannot complete until at least one artifact is committed.',
    input_schema: {
      type: 'object',
      properties: { operation: { type: 'string', enum: ['commit'] }, path: { type: 'string' }, title: { type: 'string' }, mimeType: { type: 'string' } },
      required: ['operation', 'path'],
    },
  },
] as const;

export const SANDBOX_TOOLS_OPENAI = SANDBOX_TOOLS_ANTHROPIC.map(tool => ({
  type: 'function' as const,
  function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
}));
