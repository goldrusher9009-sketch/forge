import { Router } from "express";
import { runInference } from "../services/swarm.js";
import { db, getUser, debit, addBurn } from "../database/db.js";
const r = Router();
// OpenAI-compatible: POST /v1/chat/completions
r.post("/chat/completions", async (req, res) => {
  // optional metering via x-api-key
  const apiKey = req.headers["x-api-key"];
  if (apiKey) {
    const k = db.prepare("SELECT * FROM api_keys WHERE key = ?").get(apiKey);
    if (k) {
      const DAY = 86400000, CAP = 1000;
      let dayStart = k.day_start || 0, dayCalls = k.day_calls || 0;
      if (Date.now() - dayStart > DAY) { dayStart = Date.now(); dayCalls = 0; }
      if (dayCalls >= CAP) return res.status(429).json({ error: "daily API cap reached", cap: CAP, resetsAt: dayStart + DAY });
      db.prepare("UPDATE api_keys SET day_calls = ?, day_start = ? WHERE id = ?").run(dayCalls + 1, dayStart, k.id);
      const fee = 0.05, protocolFee = fee * 0.20;
      db.prepare("UPDATE api_keys SET calls = calls + 1, spent = spent + ? WHERE id = ?").run(fee, k.id);
      if (getUser(k.address)) debit(k.address, fee, "api", "inference call");
      addBurn(protocolFee, "api-fee");
    }
  }
  const msgs = req.body?.messages || [];
  const prompt = msgs.map((m) => m.content).join("\n").slice(-2000) || "hello";
  const out = await runInference(prompt);
  res.json({
    id: "chatcmpl-" + Math.random().toString(36).slice(2),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "minera-swarm/Fable-5",
    choices: [{ index: 0, message: { role: "assistant", content: out.response }, finish_reason: "stop" }],
    usage: { swarm_nodes: out.nodesUsed, latency_ms: out.latencyMs },
  });
});
export default r;
