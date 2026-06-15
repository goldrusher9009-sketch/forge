import { Router } from "express";
import { runInference, swarmHealth, swarmMode } from "../services/swarm.js";
const r = Router();
r.get("/health", async (_req, res) => res.json(await swarmHealth()));
r.post("/", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "prompt required" });
  const out = await runInference(prompt);
  res.json({ ...out, swarm: swarmMode() });
});
export default r;
