import { Router } from "express";
const r = Router();
const online = new Map(); // address -> last seen ts
const TTL = 30000;

r.post("/heartbeat", (req, res) => {
  const a = req.body?.address || req.ip;
  online.set(a, Date.now());
  res.json({ ok: true });
});
r.get("/", (_req, res) => {
  const now = Date.now();
  for (const [a, t] of online) if (now - t > TTL) online.delete(a);
  // blend with a baseline so the network never looks empty
  res.json({ online: online.size, total: 3847 + online.size });
});
export default r;
