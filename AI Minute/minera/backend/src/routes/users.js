import { Router } from "express";
import { db, getUser, credit, debit } from "../database/db.js";
const r = Router();

r.get("/:address", (req, res) => {
  const u = db.prepare("SELECT address,email,balance FROM users WHERE address = ?").get(req.params.address);
  if (!u) return res.status(404).json({ error: "not found" });
  res.json(u);
});

r.get("/:address/transactions", (req, res) => {
  const type = req.query.type;
  const limit = Math.min(100, Number(req.query.limit) || 25);
  const offset = Number(req.query.offset) || 0;
  let rows, total;
  if (type) {
    rows = db.prepare("SELECT * FROM transactions WHERE address = ? AND type = ? ORDER BY ts DESC LIMIT ? OFFSET ?").all(req.params.address, type, limit, offset);
    total = db.prepare("SELECT COUNT(*) n FROM transactions WHERE address = ? AND type = ?").get(req.params.address, type).n;
  } else {
    rows = db.prepare("SELECT * FROM transactions WHERE address = ? ORDER BY ts DESC LIMIT ? OFFSET ?").all(req.params.address, limit, offset);
    total = db.prepare("SELECT COUNT(*) n FROM transactions WHERE address = ?").get(req.params.address).n;
  }
  res.json({ rows, total, limit, offset });
});

r.post("/:address/credit", (req, res) => {
  const amt = Number(req.body?.amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: "amount > 0 required" });
  const next = credit(req.params.address, amt, req.body?.type || "mining", req.body?.note || "");
  if (next == null) return res.status(404).json({ error: "not found" });
  res.json({ address: req.params.address, balance: next });
});

r.post("/:address/withdraw", (req, res) => {
  const amt = Number(req.body?.amount);
  const u = getUser(req.params.address);
  if (!u) return res.status(404).json({ error: "not found" });
  if (!amt || amt <= 0 || amt > u.balance) return res.status(400).json({ error: "invalid amount" });
  const next = debit(req.params.address, amt, "withdraw", "cash out");
  res.json({ address: req.params.address, balance: next, withdrew: amt });
});
r.get("/:address/profile", (req, res) => {
  const u = db.prepare("SELECT address,email,balance,display_name,bio,avatar_seed FROM users WHERE address = ?").get(req.params.address);
  if (!u) return res.status(404).json({ error: "not found" });
  res.json(u);
});
r.put("/:address/profile", (req, res) => {
  const { display_name, bio, avatar_seed } = req.body || {};
  const u = getUser(req.params.address);
  if (!u) return res.status(404).json({ error: "not found" });
  db.prepare("UPDATE users SET display_name = COALESCE(?,display_name), bio = COALESCE(?,bio), avatar_seed = COALESCE(?,avatar_seed) WHERE address = ?")
    .run(display_name ?? null, bio ?? null, avatar_seed ?? null, req.params.address);
  res.json({ ok: true });
});
export default r;
