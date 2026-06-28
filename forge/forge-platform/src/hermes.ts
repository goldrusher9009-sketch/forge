// ─── HERMES — Forge Autonomous Agent ─────────────────────────────────────────
// A real agentic loop: Plan → Execute Tools → Reflect → Repeat until DONE.
// Modeled after OpenClaw/Claude computer-use patterns but runs server-side.
// Each run streams step-by-step events via SSE so the UI shows live progress.

import { Express } from 'express';
import Database from 'better-sqlite3';

// ─── Tool definitions ─────────────────────────────────────────────────────────
export const HERMES_TOOLS: HeresTool[] = [
  {
    name: 'web_search',
    description: 'Search the web for current information. Returns top results with titles, URLs, and snippets.',
    params: { query: 'string — what to search for', num_results: 'number (optional, default 5)' },
  },
  {
    name: 'write_file',
    description: 'Write content to a named file in the run workspace. Use for drafts, reports, emails.',
    params: { filename: 'string', content: 'string' },
  },
  {
    name: 'read_file',
    description: 'Read a previously written file from the run workspace.',
    params: { filename: 'string' },
  },
  {
    name: 'save_to_brain',
    description: 'Save an important fact or insight to Forge Brain (persistent memory) for future recall.',
    params: { key: 'string', value: 'string', category: 'string (optional)' },
  },
  {
    name: 'send_approval',
    description: 'Queue an action for human approval before it executes (email, publish, payment, etc.).',
    params: { action_type: 'string', subject: 'string', body: 'string', metadata: 'object (optional)' },
  },
  {
    name: 'run_agent',
    description: 'Spawn a specialist sub-agent to handle a specific task (content, legal, finance, etc.).',
    params: { agent_type: 'string', task: 'string', context: 'string (optional)' },
  },
  {
    name: 'http_get',
    description: 'Fetch data from a public URL (RSS feed, API, webpage). Returns raw text.',
    params: { url: 'string' },
  },
  {
    name: 'calculate',
    description: 'Evaluate a mathematical expression and return the result.',
    params: { expression: 'string' },
  },
  {
    name: 'list_files',
    description: 'List all files written in this run workspace.',
    params: {},
  },
  {
    name: 'done',
    description: 'Signal that the goal is fully complete. Provide a final summary of all work done.',
    params: { summary: 'string', files_produced: 'array of filenames (optional)' },
  },
];

type HeresTool = {
  name: string;
  description: string;
  params: Record<string, string>;
};

type HermesStep = {
  step: number;
  type: 'plan' | 'tool_call' | 'tool_result' | 'reflect' | 'done' | 'error';
  content: string;
  tool?: string;
  tool_input?: any;
  tool_output?: any;
  tokens?: number;
  elapsed_ms?: number;
};

type HermesRun = {
  id: string;
  user_id: string;
  goal: string;
  model: string;
  status: 'running' | 'done' | 'error' | 'cancelled';
  steps: HermesStep[];
  files: Record<string, string>;
  final_summary?: string;
  total_tokens: number;
  started_at: string;
  ended_at?: string;
};

// In-memory run store (also persisted to DB)
const activeRuns = new Map<string, HermesRun>();
const runClients = new Map<string, Set<any>>(); // SSE clients per run

function broadcast(runId: string, event: string, data: any) {
  const clients = runClients.get(runId);
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => { try { res.write(payload); } catch {} });
}

// ─── Tool executor ────────────────────────────────────────────────────────────
async function executeTool(
  toolName: string,
  toolInput: any,
  run: HermesRun,
  db: Database.Database,
  callLLM: Function,
  getUserLLMKey: Function
): Promise<string> {
  switch (toolName) {

    case 'web_search': {
      const q = encodeURIComponent(toolInput.query || '');
      const n = toolInput.num_results || 5;
      try {
        // Use DuckDuckGo instant answer API (no key required)
        const r = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1&skip_disambig=1`, {
          headers: { 'User-Agent': 'ForgeHermes/1.0' },
          signal: AbortSignal.timeout(10000),
        });
        const d: any = await r.json();
        const results: string[] = [];
        if (d.AbstractText) results.push(`Summary: ${d.AbstractText}`);
        (d.RelatedTopics || []).slice(0, n).forEach((t: any) => {
          if (t.Text) results.push(`• ${t.Text}${t.FirstURL ? ` (${t.FirstURL})` : ''}`);
        });
        return results.length ? results.join('\n') : `No results found for: ${toolInput.query}`;
      } catch {
        return `Search failed. Proceeding with knowledge available.`;
      }
    }

    case 'write_file': {
      const { filename, content } = toolInput;
      run.files[filename] = content;
      // Persist to DB
      db.prepare("UPDATE hermes_runs SET files=?,updated_at=datetime('now') WHERE id=?")
        .run(JSON.stringify(run.files), run.id);
      return `File "${filename}" written (${content.length} chars).`;
    }

    case 'read_file': {
      const content = run.files[toolInput.filename];
      return content ? content : `File "${toolInput.filename}" not found. Available: ${Object.keys(run.files).join(', ') || 'none'}`;
    }

    case 'list_files': {
      const files = Object.keys(run.files);
      if (!files.length) return 'No files written yet.';
      return files.map(f => `• ${f} (${run.files[f].length} chars)`).join('\n');
    }

    case 'save_to_brain': {
      const { key, value, category = 'hermes' } = toolInput;
      try {
        db.prepare('INSERT OR REPLACE INTO forge_memory (id,user_id,key,value,category) VALUES (?,?,?,?,?)')
          .run(`${run.user_id}_${key}`, run.user_id, key, value, category);
        return `Saved to Forge Brain: "${key}"`;
      } catch {
        return `Brain save failed for key: ${key}`;
      }
    }

    case 'send_approval': {
      const { action_type, subject, body, metadata = {} } = toolInput;
      try {
        const id = Math.random().toString(36).slice(2);
        db.prepare('INSERT INTO pending_approvals (id,user_id,agent_type,action_type,subject,body,metadata,status) VALUES (?,?,?,?,?,?,?,?)')
          .run(id, run.user_id, 'hermes', action_type, subject, body, JSON.stringify(metadata), 'pending');
        return `Approval queued (ID: ${id}). Subject: "${subject}"`;
      } catch (e: any) {
        return `Approval queue failed: ${e.message}`;
      }
    }

    case 'run_agent': {
      const { agent_type, task, context = '' } = toolInput;
      const llm = getUserLLMKey(run.user_id);
      if (!llm.apiKey) return 'No LLM key configured — cannot run sub-agent.';
      const agentPrompts: Record<string, string> = {
        content: 'You are a world-class content writer. Write compelling, specific, actionable content.',
        legal: 'You are a business legal assistant. Draft clear, professional documents.',
        finance: 'You are a financial analyst. Provide precise calculations and clear recommendations.',
        sales: 'You are an expert sales professional. Write persuasive, personalized outreach.',
        seo: 'You are an SEO specialist. Optimize for search intent and ranking factors.',
        email: 'You are an email marketing expert. Write high-converting email copy.',
        research: 'You are a research analyst. Find patterns, cite specifics, be comprehensive.',
      };
      const systemPrompt = agentPrompts[agent_type] || `You are a specialist ${agent_type} agent.`;
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context ? `Context:\n${context}\n\nTask:\n${task}` : task },
      ];
      try {
        const result = await callLLM(llm.provider, llm.apiKey, llm.model, messages, undefined, { maxTokens: 2000 });
        return result.content;
      } catch (e: any) {
        return `Sub-agent error: ${e.message}`;
      }
    }

    case 'http_get': {
      try {
        const r = await fetch(toolInput.url, {
          headers: { 'User-Agent': 'ForgeHermes/1.0' },
          signal: AbortSignal.timeout(10000),
        });
        const text = await r.text();
        // Strip HTML tags roughly, limit length
        const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
        return clean || 'Empty response.';
      } catch (e: any) {
        return `HTTP GET failed: ${e.message}`;
      }
    }

    case 'calculate': {
      try {
        // Safe math eval — only allow numbers and operators
        const expr = (toolInput.expression || '').replace(/[^0-9+\-*/.()%^ ]/g, '');
        if (!expr) return 'Invalid expression.';
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict"; return (${expr})`)();
        return `${toolInput.expression} = ${result}`;
      } catch {
        return `Could not evaluate: ${toolInput.expression}`;
      }
    }

    case 'done': {
      return toolInput.summary || 'Task complete.';
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

// ─── Parse tool call from LLM response ───────────────────────────────────────
function parseToolCall(text: string): { tool: string; input: any } | null {
  // Expect JSON block like: ```json\n{"tool":"...","input":{...}}\n```
  const jsonMatch = text.match(/```(?:json)?\s*\n?(\{[\s\S]*?\})\s*\n?```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.tool && typeof parsed.tool === 'string') return { tool: parsed.tool, input: parsed.input || {} };
    } catch {}
  }
  // Also try bare JSON
  const bareMatch = text.match(/\{[\s\S]*"tool"\s*:\s*"([^"]+)"[\s\S]*\}/);
  if (bareMatch) {
    try {
      const parsed = JSON.parse(bareMatch[0]);
      if (parsed.tool) return { tool: parsed.tool, input: parsed.input || {} };
    } catch {}
  }
  return null;
}

// ─── Main agent loop ──────────────────────────────────────────────────────────
async function hermesLoop(
  run: HermesRun,
  db: Database.Database,
  callLLM: Function,
  getUserLLMKey: Function
) {
  const llm = getUserLLMKey(run.user_id);
  const MAX_STEPS = 30;
  const messages: any[] = [];
  let stepNum = 0;

  const toolDocs = HERMES_TOOLS.map(t =>
    `**${t.name}**: ${t.description}\n  Params: ${JSON.stringify(t.params)}`
  ).join('\n\n');

  const systemPrompt = `You are Hermes, an autonomous AI agent built into Forge. You run non-stop until the user's goal is fully achieved.

## Your loop
1. Think about what needs to be done next
2. Call exactly ONE tool using this JSON format inside a code block:
\`\`\`json
{"tool": "tool_name", "input": {"param": "value"}}
\`\`\`
3. Receive the tool result
4. Reflect and decide what to do next
5. Repeat until the goal is 100% complete, then call the "done" tool

## Available tools
${toolDocs}

## Rules
- ALWAYS output a tool call — never just explain without acting
- Be specific and thorough — don't produce generic filler
- Use write_file to save work products (reports, emails, drafts)
- Use send_approval before taking irreversible actions (send email, publish)
- Use save_to_brain for insights worth remembering across sessions
- When you run_agent, give it full context — it has no memory
- Call done ONLY when every deliverable is complete and saved
- Never call done early — users expect thorough work`;

  messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: `GOAL: ${run.goal}\n\nBegin. Think step by step and use tools non-stop until this goal is fully achieved.` });

  while (stepNum < MAX_STEPS && run.status === 'running') {
    stepNum++;
    const t0 = Date.now();

    // Check if cancelled
    const freshRun = db.prepare('SELECT status FROM hermes_runs WHERE id=?').get(run.id) as any;
    if (freshRun?.status === 'cancelled') { run.status = 'cancelled'; break; }

    broadcast(run.id, 'thinking', { step: stepNum, message: `Step ${stepNum}: thinking…` });

    let llmResponse: any;
    try {
      llmResponse = await callLLM(llm.provider, llm.apiKey, llm.model, messages, undefined, { maxTokens: 2000 });
    } catch (e: any) {
      const errStep: HermesStep = { step: stepNum, type: 'error', content: `LLM error: ${e.message}`, elapsed_ms: Date.now() - t0 };
      run.steps.push(errStep);
      broadcast(run.id, 'step', errStep);
      run.status = 'error';
      break;
    }

    const responseText = llmResponse.content;
    run.total_tokens += (llmResponse.promptTokens || 0) + (llmResponse.completionTokens || 0);

    // Parse tool call
    const toolCall = parseToolCall(responseText);

    if (!toolCall) {
      // LLM gave text but no tool call — treat as reflection, prompt again
      const reflectStep: HermesStep = { step: stepNum, type: 'reflect', content: responseText, elapsed_ms: Date.now() - t0 };
      run.steps.push(reflectStep);
      broadcast(run.id, 'step', reflectStep);
      messages.push({ role: 'assistant', content: responseText });
      messages.push({ role: 'user', content: 'You must call a tool now. Use the JSON format shown. What tool do you call next?' });
      continue;
    }

    // Log the tool call step
    const callStep: HermesStep = {
      step: stepNum, type: 'tool_call', content: responseText,
      tool: toolCall.tool, tool_input: toolCall.input, elapsed_ms: Date.now() - t0,
      tokens: llmResponse.completionTokens,
    };
    run.steps.push(callStep);
    broadcast(run.id, 'step', callStep);
    messages.push({ role: 'assistant', content: responseText });

    // Execute the tool
    broadcast(run.id, 'executing', { step: stepNum, tool: toolCall.tool });
    let toolOutput: string;
    try {
      toolOutput = await executeTool(toolCall.tool, toolCall.input, run, db, callLLM, getUserLLMKey);
    } catch (e: any) {
      toolOutput = `Tool execution error: ${e.message}`;
    }

    const resultStep: HermesStep = {
      step: stepNum, type: 'tool_result', content: toolOutput,
      tool: toolCall.tool, tool_output: toolOutput, elapsed_ms: Date.now() - t0,
    };
    run.steps.push(resultStep);
    broadcast(run.id, 'step', resultStep);
    messages.push({ role: 'user', content: `Tool result for ${toolCall.tool}:\n${toolOutput}\n\nContinue toward the goal.` });

    // Persist progress
    db.prepare("UPDATE hermes_runs SET steps=?,total_tokens=?,files=?,updated_at=datetime('now') WHERE id=?")
      .run(JSON.stringify(run.steps), run.total_tokens, JSON.stringify(run.files), run.id);

    // Check if done
    if (toolCall.tool === 'done') {
      run.status = 'done';
      run.final_summary = toolCall.input?.summary || toolOutput;
      break;
    }
  }

  if (stepNum >= MAX_STEPS && run.status === 'running') {
    run.status = 'done';
    run.final_summary = `Reached ${MAX_STEPS} steps. Work produced: ${Object.keys(run.files).join(', ') || 'none'}`;
  }

  // Final DB update
  run.ended_at = new Date().toISOString();
  db.prepare("UPDATE hermes_runs SET status=?,steps=?,files=?,final_summary=?,total_tokens=?,ended_at=datetime('now'),updated_at=datetime('now') WHERE id=?")
    .run(run.status, JSON.stringify(run.steps), JSON.stringify(run.files), run.final_summary || '', run.total_tokens, run.id);

  broadcast(run.id, 'done', { status: run.status, summary: run.final_summary, files: Object.keys(run.files), total_tokens: run.total_tokens, steps: run.steps.length });

  // Close SSE clients
  const clients = runClients.get(run.id);
  if (clients) {
    clients.forEach(res => { try { res.write('event: close\ndata: {}\n\n'); res.end(); } catch {} });
    runClients.delete(run.id);
  }
  activeRuns.delete(run.id);
}

// ─── Express routes ───────────────────────────────────────────────────────────
export function setupHermes(app: Express, db: Database.Database, deps: {
  requireAuth: any;
  getUserLLMKey: (userId: string) => { provider: string; apiKey: string; model: string };
  callLLM: Function;
  uuidv4: () => string;
}) {
  const { requireAuth, getUserLLMKey, callLLM, uuidv4 } = deps;

  // Create tables
  db.exec(`CREATE TABLE IF NOT EXISTS hermes_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    goal TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    status TEXT NOT NULL DEFAULT 'running',
    steps TEXT NOT NULL DEFAULT '[]',
    files TEXT NOT NULL DEFAULT '{}',
    final_summary TEXT DEFAULT '',
    total_tokens INTEGER DEFAULT 0,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  // POST /api/hermes/run — start a new autonomous run
  app.post('/api/hermes/run', requireAuth, async (req: any, res: any) => {
    const uid = req.user.sub || req.user.id;
    const { goal, model } = req.body;
    if (!goal?.trim()) return res.status(400).json({ error: 'goal required' });

    const llm = getUserLLMKey(uid);
    if (!llm.apiKey) return res.status(400).json({ error: 'No LLM API key configured. Add one in Settings.' });

    const id = uuidv4();
    const run: HermesRun = {
      id, user_id: uid, goal: goal.trim(),
      model: model || llm.model,
      status: 'running', steps: [], files: {},
      total_tokens: 0, started_at: new Date().toISOString(),
    };

    db.prepare('INSERT INTO hermes_runs (id,user_id,goal,model,status,steps,files) VALUES (?,?,?,?,?,?,?)')
      .run(id, uid, run.goal, run.model, 'running', '[]', '{}');
    activeRuns.set(id, run);

    // Run async — don't await
    hermesLoop(run, db, callLLM, getUserLLMKey).catch(e => {
      console.error('Hermes loop error:', e);
      run.status = 'error';
      db.prepare("UPDATE hermes_runs SET status='error',updated_at=datetime('now') WHERE id=?").run(id);
      broadcast(id, 'done', { status: 'error', summary: e.message });
    });

    res.json({ id, status: 'running' });
  });

  // GET /api/hermes/stream/:id — SSE stream of steps
  app.get('/api/hermes/stream/:id', (req: any, res: any) => {
    const { id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    // If run already done, send final state
    const dbRun = db.prepare('SELECT * FROM hermes_runs WHERE id=?').get(id) as any;
    if (dbRun && (dbRun.status === 'done' || dbRun.status === 'error')) {
      const steps = JSON.parse(dbRun.steps || '[]');
      steps.forEach((s: any) => res.write(`event: step\ndata: ${JSON.stringify(s)}\n\n`));
      res.write(`event: done\ndata: ${JSON.stringify({ status: dbRun.status, summary: dbRun.final_summary, files: Object.keys(JSON.parse(dbRun.files || '{}')) })}\n\n`);
      res.end();
      return;
    }

    // Register SSE client
    if (!runClients.has(id)) runClients.set(id, new Set());
    runClients.get(id)!.add(res);
    res.write('event: connected\ndata: {"status":"streaming"}\n\n');

    // Send existing steps so far
    const run = activeRuns.get(id);
    if (run?.steps.length) {
      run.steps.forEach(s => res.write(`event: step\ndata: ${JSON.stringify(s)}\n\n`));
    }

    req.on('close', () => { runClients.get(id)?.delete(res); });
  });

  // POST /api/hermes/cancel/:id
  app.post('/api/hermes/cancel/:id', requireAuth, (req: any, res: any) => {
    const { id } = req.params;
    db.prepare("UPDATE hermes_runs SET status='cancelled',updated_at=datetime('now') WHERE id=?").run(id);
    const run = activeRuns.get(id);
    if (run) run.status = 'cancelled';
    broadcast(id, 'done', { status: 'cancelled', summary: 'Run cancelled by user.' });
    res.json({ ok: true });
  });

  // GET /api/hermes/runs — list recent runs
  app.get('/api/hermes/runs', requireAuth, (req: any, res: any) => {
    const uid = req.user.sub || req.user.id;
    const rows = db.prepare('SELECT id,goal,model,status,final_summary,total_tokens,started_at,ended_at FROM hermes_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 30').all(uid);
    res.json({ runs: rows });
  });

  // GET /api/hermes/run/:id — full run detail
  app.get('/api/hermes/run/:id', requireAuth, (req: any, res: any) => {
    const uid = req.user.sub || req.user.id;
    const row = db.prepare('SELECT * FROM hermes_runs WHERE id=? AND user_id=?').get(req.params.id, uid) as any;
    if (!row) return res.status(404).json({ error: 'Not found' });
    row.steps = JSON.parse(row.steps || '[]');
    row.files = JSON.parse(row.files || '{}');
    res.json(row);
  });

  // GET /api/hermes/file/:id/:filename — download a file from a run
  app.get('/api/hermes/file/:id/:filename', requireAuth, (req: any, res: any) => {
    const uid = req.user.sub || req.user.id;
    const row = db.prepare('SELECT files FROM hermes_runs WHERE id=? AND user_id=?').get(req.params.id, uid) as any;
    if (!row) return res.status(404).json({ error: 'Not found' });
    const files = JSON.parse(row.files || '{}');
    const content = files[req.params.filename];
    if (!content) return res.status(404).json({ error: 'File not found' });
    res.setHeader('Content-Type', 'text/plain');
    res.send(content);
  });

  console.log('✅ Hermes autonomous agent mounted');
}
