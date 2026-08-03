"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var hermes_exports = {};
__export(hermes_exports, {
  HERMES_TOOLS: () => HERMES_TOOLS,
  setupHermes: () => setupHermes
});
module.exports = __toCommonJS(hermes_exports);
const HERMES_TOOLS = [
  {
    name: "web_search",
    description: "Search the web for current information. Returns top results with titles, URLs, and snippets.",
    params: { query: "string \u2014 what to search for", num_results: "number (optional, default 5)" }
  },
  {
    name: "write_file",
    description: "Write content to a named file in the run workspace. Use for drafts, reports, emails.",
    params: { filename: "string", content: "string" }
  },
  {
    name: "read_file",
    description: "Read a previously written file from the run workspace.",
    params: { filename: "string" }
  },
  {
    name: "save_to_brain",
    description: "Save an important fact or insight to Forge Brain (persistent memory) for future recall.",
    params: { key: "string", value: "string", category: "string (optional)" }
  },
  {
    name: "send_approval",
    description: "Queue an action for human approval before it executes (email, publish, payment, etc.).",
    params: { action_type: "string", subject: "string", body: "string", metadata: "object (optional)" }
  },
  {
    name: "run_agent",
    description: "Spawn a specialist sub-agent to handle a specific task (content, legal, finance, etc.).",
    params: { agent_type: "string", task: "string", context: "string (optional)" }
  },
  {
    name: "http_get",
    description: "Fetch data from a public URL (RSS feed, API, webpage). Returns raw text.",
    params: { url: "string" }
  },
  {
    name: "calculate",
    description: "Evaluate a mathematical expression and return the result.",
    params: { expression: "string" }
  },
  {
    name: "list_files",
    description: "List all files written in this run workspace.",
    params: {}
  },
  {
    name: "done",
    description: "Signal that the goal is fully complete. Provide a final summary of all work done.",
    params: { summary: "string", files_produced: "array of filenames (optional)" }
  }
];
const activeRuns = /* @__PURE__ */ new Map();
const runClients = /* @__PURE__ */ new Map();
function broadcast(runId, event, data) {
  const clients = runClients.get(runId);
  if (!clients)
    return;
  const payload = `event: ${event}
data: ${JSON.stringify(data)}

`;
  clients.forEach((res) => {
    try {
      res.write(payload);
    } catch {
    }
  });
}
async function executeTool(toolName, toolInput, run, db, callLLM, getUserLLMKey) {
  switch (toolName) {
    case "web_search": {
      const q = encodeURIComponent(toolInput.query || "");
      const n = toolInput.num_results || 5;
      try {
        const r = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1&skip_disambig=1`, {
          headers: { "User-Agent": "ForgeHermes/1.0" },
          signal: AbortSignal.timeout(1e4)
        });
        const d = await r.json();
        const results = [];
        if (d.AbstractText)
          results.push(`Summary: ${d.AbstractText}`);
        (d.RelatedTopics || []).slice(0, n).forEach((t) => {
          if (t.Text)
            results.push(`\u2022 ${t.Text}${t.FirstURL ? ` (${t.FirstURL})` : ""}`);
        });
        return results.length ? results.join("\n") : `No results found for: ${toolInput.query}`;
      } catch {
        return `Search failed. Proceeding with knowledge available.`;
      }
    }
    case "write_file": {
      const { filename, content } = toolInput;
      run.files[filename] = content;
      db.prepare("UPDATE hermes_runs SET files=?,updated_at=datetime('now') WHERE id=?").run(JSON.stringify(run.files), run.id);
      return `File "${filename}" written (${content.length} chars).`;
    }
    case "read_file": {
      const content = run.files[toolInput.filename];
      return content ? content : `File "${toolInput.filename}" not found. Available: ${Object.keys(run.files).join(", ") || "none"}`;
    }
    case "list_files": {
      const files = Object.keys(run.files);
      if (!files.length)
        return "No files written yet.";
      return files.map((f) => `\u2022 ${f} (${run.files[f].length} chars)`).join("\n");
    }
    case "save_to_brain": {
      const { key, value, category = "hermes" } = toolInput;
      try {
        db.prepare("INSERT OR REPLACE INTO forge_memory (id,user_id,key,value,category) VALUES (?,?,?,?,?)").run(`${run.user_id}_${key}`, run.user_id, key, value, category);
        return `Saved to Forge Brain: "${key}"`;
      } catch {
        return `Brain save failed for key: ${key}`;
      }
    }
    case "send_approval": {
      const { action_type, subject, body, metadata = {} } = toolInput;
      try {
        const id = Math.random().toString(36).slice(2);
        db.prepare("INSERT INTO pending_approvals (id,user_id,agent_type,action_type,subject,body,metadata,status) VALUES (?,?,?,?,?,?,?,?)").run(id, run.user_id, "hermes", action_type, subject, body, JSON.stringify(metadata), "pending");
        return `Approval queued (ID: ${id}). Subject: "${subject}"`;
      } catch (e) {
        return `Approval queue failed: ${e.message}`;
      }
    }
    case "run_agent": {
      const { agent_type, task, context = "" } = toolInput;
      const llm = getUserLLMKey(run.user_id);
      if (!llm.apiKey)
        return "No LLM key configured \u2014 cannot run sub-agent.";
      const agentPrompts = {
        content: "You are a world-class content writer. Write compelling, specific, actionable content.",
        legal: "You are a business legal assistant. Draft clear, professional documents.",
        finance: "You are a financial analyst. Provide precise calculations and clear recommendations.",
        sales: "You are an expert sales professional. Write persuasive, personalized outreach.",
        seo: "You are an SEO specialist. Optimize for search intent and ranking factors.",
        email: "You are an email marketing expert. Write high-converting email copy.",
        research: "You are a research analyst. Find patterns, cite specifics, be comprehensive."
      };
      const systemPrompt = agentPrompts[agent_type] || `You are a specialist ${agent_type} agent.`;
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: context ? `Context:
${context}

Task:
${task}` : task }
      ];
      try {
        const result = await callLLM(llm.provider, llm.apiKey, llm.model, messages, void 0, { maxTokens: 2e3 });
        return result.content;
      } catch (e) {
        return `Sub-agent error: ${e.message}`;
      }
    }
    case "http_get": {
      try {
        const r = await fetch(toolInput.url, {
          headers: { "User-Agent": "ForgeHermes/1.0" },
          signal: AbortSignal.timeout(1e4)
        });
        const text = await r.text();
        const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3e3);
        return clean || "Empty response.";
      } catch (e) {
        return `HTTP GET failed: ${e.message}`;
      }
    }
    case "calculate": {
      try {
        const expr = (toolInput.expression || "").replace(/[^0-9+\-*/.()%^ ]/g, "");
        if (!expr)
          return "Invalid expression.";
        const result = Function(`"use strict"; return (${expr})`)();
        return `${toolInput.expression} = ${result}`;
      } catch {
        return `Could not evaluate: ${toolInput.expression}`;
      }
    }
    case "done": {
      return toolInput.summary || "Task complete.";
    }
    default:
      return `Unknown tool: ${toolName}`;
  }
}
function parseToolCall(text) {
  const jsonMatch = text.match(/```(?:json)?\s*\n?(\{[\s\S]*?\})\s*\n?```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.tool && typeof parsed.tool === "string")
        return { tool: parsed.tool, input: parsed.input || {} };
    } catch {
    }
  }
  const bareMatch = text.match(/\{[\s\S]*"tool"\s*:\s*"([^"]+)"[\s\S]*\}/);
  if (bareMatch) {
    try {
      const parsed = JSON.parse(bareMatch[0]);
      if (parsed.tool)
        return { tool: parsed.tool, input: parsed.input || {} };
    } catch {
    }
  }
  return null;
}
async function hermesLoop(run, db, callLLM, getUserLLMKey) {
  const llm = getUserLLMKey(run.user_id);
  const MAX_STEPS = 30;
  const messages = [];
  let stepNum = 0;
  const toolDocs = HERMES_TOOLS.map(
    (t) => `**${t.name}**: ${t.description}
  Params: ${JSON.stringify(t.params)}`
  ).join("\n\n");
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
- ALWAYS output a tool call \u2014 never just explain without acting
- Be specific and thorough \u2014 don't produce generic filler
- Use write_file to save work products (reports, emails, drafts)
- Use send_approval before taking irreversible actions (send email, publish)
- Use save_to_brain for insights worth remembering across sessions
- When you run_agent, give it full context \u2014 it has no memory
- Call done ONLY when every deliverable is complete and saved
- Never call done early \u2014 users expect thorough work`;
  messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: `GOAL: ${run.goal}

Begin. Think step by step and use tools non-stop until this goal is fully achieved.` });
  while (stepNum < MAX_STEPS && run.status === "running") {
    stepNum++;
    const t0 = Date.now();
    const freshRun = db.prepare("SELECT status FROM hermes_runs WHERE id=?").get(run.id);
    if (freshRun?.status === "cancelled") {
      run.status = "cancelled";
      break;
    }
    broadcast(run.id, "thinking", { step: stepNum, message: `Step ${stepNum}: thinking\u2026` });
    let llmResponse;
    try {
      llmResponse = await callLLM(llm.provider, llm.apiKey, llm.model, messages, void 0, { maxTokens: 2e3 });
    } catch (e) {
      const errStep = { step: stepNum, type: "error", content: `LLM error: ${e.message}`, elapsed_ms: Date.now() - t0 };
      run.steps.push(errStep);
      broadcast(run.id, "step", errStep);
      run.status = "error";
      break;
    }
    const responseText = llmResponse.content;
    run.total_tokens += (llmResponse.promptTokens || 0) + (llmResponse.completionTokens || 0);
    const toolCall = parseToolCall(responseText);
    if (!toolCall) {
      const reflectStep = { step: stepNum, type: "reflect", content: responseText, elapsed_ms: Date.now() - t0 };
      run.steps.push(reflectStep);
      broadcast(run.id, "step", reflectStep);
      messages.push({ role: "assistant", content: responseText });
      messages.push({ role: "user", content: "You must call a tool now. Use the JSON format shown. What tool do you call next?" });
      continue;
    }
    const callStep = {
      step: stepNum,
      type: "tool_call",
      content: responseText,
      tool: toolCall.tool,
      tool_input: toolCall.input,
      elapsed_ms: Date.now() - t0,
      tokens: llmResponse.completionTokens
    };
    run.steps.push(callStep);
    broadcast(run.id, "step", callStep);
    messages.push({ role: "assistant", content: responseText });
    broadcast(run.id, "executing", { step: stepNum, tool: toolCall.tool });
    let toolOutput;
    try {
      toolOutput = await executeTool(toolCall.tool, toolCall.input, run, db, callLLM, getUserLLMKey);
    } catch (e) {
      toolOutput = `Tool execution error: ${e.message}`;
    }
    const resultStep = {
      step: stepNum,
      type: "tool_result",
      content: toolOutput,
      tool: toolCall.tool,
      tool_output: toolOutput,
      elapsed_ms: Date.now() - t0
    };
    run.steps.push(resultStep);
    broadcast(run.id, "step", resultStep);
    messages.push({ role: "user", content: `Tool result for ${toolCall.tool}:
${toolOutput}

Continue toward the goal.` });
    db.prepare("UPDATE hermes_runs SET steps=?,total_tokens=?,files=?,updated_at=datetime('now') WHERE id=?").run(JSON.stringify(run.steps), run.total_tokens, JSON.stringify(run.files), run.id);
    if (toolCall.tool === "done") {
      run.status = "done";
      run.final_summary = toolCall.input?.summary || toolOutput;
      break;
    }
  }
  if (stepNum >= MAX_STEPS && run.status === "running") {
    run.status = "done";
    run.final_summary = `Reached ${MAX_STEPS} steps. Work produced: ${Object.keys(run.files).join(", ") || "none"}`;
  }
  run.ended_at = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare("UPDATE hermes_runs SET status=?,steps=?,files=?,final_summary=?,total_tokens=?,ended_at=datetime('now'),updated_at=datetime('now') WHERE id=?").run(run.status, JSON.stringify(run.steps), JSON.stringify(run.files), run.final_summary || "", run.total_tokens, run.id);
  broadcast(run.id, "done", { status: run.status, summary: run.final_summary, files: Object.keys(run.files), total_tokens: run.total_tokens, steps: run.steps.length });
  const clients = runClients.get(run.id);
  if (clients) {
    clients.forEach((res) => {
      try {
        res.write("event: close\ndata: {}\n\n");
        res.end();
      } catch {
      }
    });
    runClients.delete(run.id);
  }
  activeRuns.delete(run.id);
}
function setupHermes(app, db, deps) {
  const { requireAuth, getUserLLMKey, callLLM, uuidv4 } = deps;
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
  app.post("/api/hermes/run", requireAuth, async (req, res) => {
    const uid = req.user.sub || req.user.id;
    const { goal, model } = req.body;
    if (!goal?.trim())
      return res.status(400).json({ error: "goal required" });
    const llm = getUserLLMKey(uid);
    if (!llm.apiKey)
      return res.status(400).json({ error: "No LLM API key configured. Add one in Settings." });
    const id = uuidv4();
    const run = {
      id,
      user_id: uid,
      goal: goal.trim(),
      model: model || llm.model,
      status: "running",
      steps: [],
      files: {},
      total_tokens: 0,
      started_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.prepare("INSERT INTO hermes_runs (id,user_id,goal,model,status,steps,files) VALUES (?,?,?,?,?,?,?)").run(id, uid, run.goal, run.model, "running", "[]", "{}");
    activeRuns.set(id, run);
    hermesLoop(run, db, callLLM, getUserLLMKey).catch((e) => {
      console.error("Hermes loop error:", e);
      run.status = "error";
      db.prepare("UPDATE hermes_runs SET status='error',updated_at=datetime('now') WHERE id=?").run(id);
      broadcast(id, "done", { status: "error", summary: e.message });
    });
    res.json({ id, status: "running" });
  });
  app.get("/api/hermes/stream/:id", (req, res) => {
    const { id } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders?.();
    const dbRun = db.prepare("SELECT * FROM hermes_runs WHERE id=?").get(id);
    if (dbRun && (dbRun.status === "done" || dbRun.status === "error")) {
      const steps = JSON.parse(dbRun.steps || "[]");
      steps.forEach((s) => res.write(`event: step
data: ${JSON.stringify(s)}

`));
      res.write(`event: done
data: ${JSON.stringify({ status: dbRun.status, summary: dbRun.final_summary, files: Object.keys(JSON.parse(dbRun.files || "{}")) })}

`);
      res.end();
      return;
    }
    if (!runClients.has(id))
      runClients.set(id, /* @__PURE__ */ new Set());
    runClients.get(id).add(res);
    res.write('event: connected\ndata: {"status":"streaming"}\n\n');
    const run = activeRuns.get(id);
    if (run?.steps.length) {
      run.steps.forEach((s) => res.write(`event: step
data: ${JSON.stringify(s)}

`));
    }
    req.on("close", () => {
      runClients.get(id)?.delete(res);
    });
  });
  app.post("/api/hermes/cancel/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE hermes_runs SET status='cancelled',updated_at=datetime('now') WHERE id=?").run(id);
    const run = activeRuns.get(id);
    if (run)
      run.status = "cancelled";
    broadcast(id, "done", { status: "cancelled", summary: "Run cancelled by user." });
    res.json({ ok: true });
  });
  app.get("/api/hermes/runs", requireAuth, (req, res) => {
    const uid = req.user.sub || req.user.id;
    const rows = db.prepare("SELECT id,goal,model,status,final_summary,total_tokens,started_at,ended_at FROM hermes_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 30").all(uid);
    res.json({ runs: rows });
  });
  app.get("/api/hermes/run/:id", requireAuth, (req, res) => {
    const uid = req.user.sub || req.user.id;
    const row = db.prepare("SELECT * FROM hermes_runs WHERE id=? AND user_id=?").get(req.params.id, uid);
    if (!row)
      return res.status(404).json({ error: "Not found" });
    row.steps = JSON.parse(row.steps || "[]");
    row.files = JSON.parse(row.files || "{}");
    res.json(row);
  });
  app.get("/api/hermes/file/:id/:filename", requireAuth, (req, res) => {
    const uid = req.user.sub || req.user.id;
    const row = db.prepare("SELECT files FROM hermes_runs WHERE id=? AND user_id=?").get(req.params.id, uid);
    if (!row)
      return res.status(404).json({ error: "Not found" });
    const files = JSON.parse(row.files || "{}");
    const content = files[req.params.filename];
    if (!content)
      return res.status(404).json({ error: "File not found" });
    res.setHeader("Content-Type", "text/plain");
    res.send(content);
  });
  console.log("\u2705 Hermes autonomous agent mounted");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HERMES_TOOLS,
  setupHermes
});
