import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
const DAY = 86400000;

// per-user 24h summary
r.get("/:address", (req, res) => {
  const since = Date.now() - DAY;
  const txs = db.prepare("SELECT type,amount FROM transactions WHERE address = ? AND ts >= ?").all(req.params.address, since);
  const earned = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = txs.filter((t) => t.amount < 0).reduce((s, t) => s + (-t.amount), 0);
  const byType = {};
  for (const t of txs) byType[t.type] = (byType[t.type] || 0) + t.amount;
  const u = db.prepare("SELECT balance FROM users WHERE address = ?").get(req.params.address);
  res.json({ window: "24h", earned, spent, net: earned - spent, balance: u?.balance ?? 0, byType, txCount: txs.length });
});

// network-wide 24h digest
r.get("/", (_req, res) => {
  const since = Date.now() - DAY;
  const num = (q) => db.prepare(q).get(since).n;
  res.json({
    window: "24h",
    insights: num("SELECT COUNT(*) n FROM insights WHERE ts >= ?"),
    licenses: num("SELECT COUNT(*) n FROM licenses WHERE ts >= ?"),
    bonds: db.prepare("SELECT COUNT(*) n FROM bonds").get().n,
    burned: db.prepare("SELECT COALESCE(SUM(amount),0) s FROM burn_events WHERE ts >= ?").get(since).s,
    newUsers: num("SELECT COUNT(*) n FROM users WHERE created >= ?"),
  });
});
export default r;
