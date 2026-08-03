"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var operator_exports = {};
__export(operator_exports, {
  setupOperator: () => setupOperator
});
module.exports = __toCommonJS(operator_exports);
var https = __toESM(require("https"));
var http = __toESM(require("http"));
var import_url = require("url");
const operatorClients = /* @__PURE__ */ new Map();
function broadcast(sessionId, event, data) {
  const clients = operatorClients.get(sessionId) || [];
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
function fetchPage(rawUrl) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new import_url.URL(rawUrl);
    } catch {
      return reject(new Error("Invalid URL"));
    }
    const mod = target.protocol === "https:" ? https : http;
    const req = mod.get(rawUrl, { headers: { "User-Agent": "ForgeOperator/1.0 (+https://forge-sand-two.vercel.app)" }, timeout: 12e3 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => {
        if (body.length < 4e5)
          body += c;
      });
      res.on("end", () => {
        const titleMatch = body.match(/<title[^>]*>([^<]{0,200})<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : target.hostname;
        const noScript = body.replace(/<script[\s\S]*?<\/script>/gi, "");
        const noStyle = noScript.replace(/<style[\s\S]*?<\/style>/gi, "");
        const noTags = noStyle.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
        const text = noTags.slice(0, 8e3);
        const linkRe = /href=["']([^"'#]{4,200})["']/gi;
        const links = [];
        let m;
        while ((m = linkRe.exec(body)) !== null && links.length < 20) {
          try {
            const abs = new import_url.URL(m[1], rawUrl).href;
            if (abs.startsWith("http"))
              links.push(abs);
          } catch {
          }
        }
        resolve({ html: body.slice(0, 5e4), title, links: [...new Set(links)].slice(0, 15), text });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}
async function planGoal(goal, callLLM, key) {
  const { content } = await callLLM(key.provider, key.apiKey, key.model, [
    {
      role: "user",
      content: `You are Forge Operator \u2014 an autonomous AI browser agent. A user gave you this goal:
"${goal}"

Plan a sequence of up to 8 concrete browser-based steps to accomplish this goal. Each step is one of:
- navigate: go to a URL
- read: extract information from the current page
- search: perform a web search (use https://www.google.com/search?q=... or https://duckduckgo.com/?q=...)
- analyze: analyze gathered data and produce insight
- write: compose a document, email, report, or content based on findings
- summarize: synthesize everything into a final deliverable

Respond ONLY with valid JSON: { "steps": [ { "action": "navigate|read|search|analyze|write|summarize", "url": "...", "instruction": "exactly what to do in this step" } ], "summary": "one sentence describing what you will deliver" }`
    }
  ]);
  try {
    const cleaned = content.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      steps: [
        { action: "search", url: `https://duckduckgo.com/?q=${encodeURIComponent(goal)}`, instruction: `Search for: ${goal}` },
        { action: "read", instruction: "Extract key information from search results" },
        { action: "summarize", instruction: "Synthesize findings into a comprehensive answer" }
      ],
      summary: `Researching: ${goal}`
    };
  }
}
async function executeStep(step, context, callLLM, key) {
  if (step.action === "navigate" || step.action === "search") {
    const url = step.url || `https://duckduckgo.com/?q=${encodeURIComponent(step.instruction)}`;
    try {
      const page = await fetchPage(url);
      return { result: `Navigated to ${page.title} (${url}). Found ${page.text.length} chars of content.`, url, text: page.text, links: page.links };
    } catch (e) {
      return { result: `Could not fetch ${url}: ${e.message}` };
    }
  }
  if (step.action === "read") {
    const url = context.currentUrl || "unknown page";
    const { content } = await callLLM(key.provider, key.apiKey, key.model, [{
      role: "user",
      content: `You are reading a web page to accomplish this goal: "${context.goal}"
Page content (truncated): ${context.currentText?.slice(0, 4e3) || "No content available"}
Instruction: ${step.instruction}
Extract and return the most relevant information clearly and concisely.`
    }]);
    return { result: content };
  }
  if (step.action === "analyze" || step.action === "write" || step.action === "summarize") {
    const historyText = context.history.slice(-5).join("\n\n");
    const { content } = await callLLM(key.provider, key.apiKey, key.model, [{
      role: "user",
      content: `You are Forge Operator completing a task.
Goal: "${context.goal}"
What you've gathered so far:
${historyText}
Current instruction: ${step.instruction}
${step.action === "summarize" ? "Produce the final deliverable \u2014 complete, detailed, and ready to use." : "Complete this step thoroughly."}`
    }]);
    return { result: content };
  }
  return { result: `Completed: ${step.instruction}` };
}
async function runOperatorSession(sessionId, goal, deps, userId) {
  const { callLLM, getUserLLMKey, db } = deps;
  const key = getUserLLMKey(userId);
  try {
    broadcast(sessionId, "thinking", { message: "\u{1F9E0} Planning how to accomplish your goal..." });
    const plan = await planGoal(goal, callLLM, key);
    db.prepare(`UPDATE operator_sessions SET status='running', plan=?, summary_preview=? WHERE id=?`).run(JSON.stringify(plan.steps), plan.summary, sessionId);
    broadcast(sessionId, "plan", { steps: plan.steps, summary: plan.summary });
    const history = [];
    let currentUrl;
    let currentText;
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const stepId = deps.uuidv4();
      broadcast(sessionId, "step_start", {
        index: i,
        total: plan.steps.length,
        action: step.action,
        instruction: step.instruction,
        url: step.url,
        stepId
      });
      db.prepare(`INSERT INTO operator_steps (id, session_id, step_index, action, instruction, url, status, created_at) VALUES (?,?,?,?,?,?,'running',datetime('now'))`).run(stepId, sessionId, i, step.action, step.instruction, step.url || null);
      try {
        const result = await executeStep(step, { goal, history, currentUrl, currentText }, callLLM, key);
        if (result.url)
          currentUrl = result.url;
        if (result.text)
          currentText = result.text;
        history.push(`Step ${i + 1} (${step.action}): ${result.result.slice(0, 1e3)}`);
        db.prepare(`UPDATE operator_steps SET status='done', result=?, result_url=? WHERE id=?`).run(result.result.slice(0, 4e3), result.url || null, stepId);
        broadcast(sessionId, "step_done", {
          index: i,
          stepId,
          action: step.action,
          result: result.result,
          url: result.url,
          links: result.links
        });
      } catch (e) {
        db.prepare(`UPDATE operator_steps SET status='error', result=? WHERE id=?`).run(e.message, stepId);
        broadcast(sessionId, "step_error", { index: i, stepId, error: e.message });
        history.push(`Step ${i + 1} failed: ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    broadcast(sessionId, "thinking", { message: "\u270D\uFE0F Composing final deliverable..." });
    const { content: finalResult } = await callLLM(key.provider, key.apiKey, key.model, [{
      role: "user",
      content: `You are Forge Operator. You just completed an autonomous task.
Goal: "${goal}"
Steps completed and results:
${history.join("\n\n")}
Write the final comprehensive deliverable. Be thorough, structured, and immediately useful. Use markdown formatting.`
    }]);
    db.prepare(`UPDATE operator_sessions SET status='done', final_result=?, completed_at=datetime('now') WHERE id=?`).run(finalResult, sessionId);
    broadcast(sessionId, "complete", { result: finalResult, sessionId });
  } catch (e) {
    db.prepare(`UPDATE operator_sessions SET status='error', final_result=? WHERE id=?`).run(e.message, sessionId);
    broadcast(sessionId, "error", { error: e.message });
  } finally {
    operatorClients.delete(sessionId);
  }
}
function setupOperator(app, deps) {
  const { db, requireAuth, uuidv4 } = deps;
  db.exec(`
    CREATE TABLE IF NOT EXISTS operator_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goal TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      plan TEXT DEFAULT '[]',
      summary_preview TEXT DEFAULT '',
      final_result TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS operator_steps (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      step_index INTEGER NOT NULL,
      action TEXT NOT NULL,
      instruction TEXT NOT NULL,
      url TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT DEFAULT '',
      result_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  app.post("/api/operator/run", requireAuth, (req, res) => {
    const { goal } = req.body;
    if (!goal?.trim())
      return res.status(400).json({ error: "goal required" });
    const sessionId = uuidv4();
    db.prepare(`INSERT INTO operator_sessions (id, user_id, goal) VALUES (?,?,?)`).run(sessionId, req.user.id, goal.trim());
    runOperatorSession(sessionId, goal.trim(), deps, req.user.id).catch(console.error);
    res.json({ sessionId });
  });
  app.get("/api/operator/stream/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    if (!operatorClients.has(id))
      operatorClients.set(id, []);
    operatorClients.get(id).push(res);
    const session = db.prepare(`SELECT * FROM operator_sessions WHERE id=?`).get(id);
    if (session) {
      res.write(`event: session
data: ${JSON.stringify(session)}

`);
      if (session.status === "done") {
        const steps = db.prepare(`SELECT * FROM operator_steps WHERE session_id=? ORDER BY step_index`).all(id);
        res.write(`event: steps
data: ${JSON.stringify(steps)}

`);
        res.write(`event: complete
data: ${JSON.stringify({ result: session.final_result, sessionId: id })}

`);
      }
    }
    const keepalive = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
      }
    }, 2e4);
    req.on("close", () => {
      clearInterval(keepalive);
      const list = operatorClients.get(id) || [];
      const idx = list.indexOf(res);
      if (idx > -1)
        list.splice(idx, 1);
    });
  });
  app.get("/api/operator/sessions", requireAuth, (req, res) => {
    const sessions = db.prepare(`SELECT id, goal, status, summary_preview, created_at, completed_at FROM operator_sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 30`).all(req.user.id);
    res.json({ sessions });
  });
  app.get("/api/operator/session/:id", requireAuth, (req, res) => {
    const session = db.prepare(`SELECT * FROM operator_sessions WHERE id=? AND user_id=?`).get(req.params.id, req.user.id);
    if (!session)
      return res.status(404).json({ error: "not found" });
    const steps = db.prepare(`SELECT * FROM operator_steps WHERE session_id=? ORDER BY step_index`).all(req.params.id);
    res.json({ session, steps });
  });
  app.delete("/api/operator/session/:id", requireAuth, (req, res) => {
    db.prepare(`DELETE FROM operator_steps WHERE session_id=?`).run(req.params.id);
    db.prepare(`DELETE FROM operator_sessions WHERE id=? AND user_id=?`).run(req.params.id, req.user.id);
    res.json({ ok: true });
  });
  app.post("/api/operator/cancel/:id", requireAuth, (req, res) => {
    db.prepare(`UPDATE operator_sessions SET status='cancelled' WHERE id=? AND user_id=?`).run(req.params.id, req.user.id);
    operatorClients.delete(req.params.id);
    res.json({ ok: true });
  });
  console.log("\u2705 Forge Operator mounted");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  setupOperator
});
