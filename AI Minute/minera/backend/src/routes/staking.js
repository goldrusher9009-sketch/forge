import { Router } from "express";
import { db, getUser, debit, credit, award } from "../database/db.js";
const r = Router();
const YEAR = 365 * 86400000;

function accrued(s) {
  const elapsed = Date.now() - s.start_ts;
  return s.amount * s.apr * (elapsed / YEAR);
}

r.get("/:address", (req, res) => {
  const stakes = db.prepare("SELECT * FROM stakes WHERE address = ? AND active = 1").all(req.params.address);
  res.json(stakes.map((s) => ({ id: s.id, amount: s.amount, apr: s.apr, start: s.start_ts, yield: accrued(s) })));
});

// stake — locks balance
r.post("/:address", (req, res) => {
  const amt = Number(req.body?.amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: "amount > 0" });
  const next = debit(req.params.address, amt, "stake", "locked stake");
  if (next == null) return res.status(400).json({ error: "insufficient balance" });
  db.prepare("INSERT INTO stakes (address,amount,start_ts) VALUES (?,?,?)").run(req.params.address, amt, Date.now());
  award(req.params.address, "staker");
  res.status(201).json({ ok: true, staked: amt, balance: next });
});

// unstake — returns principal + accrued yield
r.post("/:address/unstake/:id", (req, res) => {
  const s = db.prepare("SELECT * FROM stakes WHERE id = ? AND address = ? AND active = 1").get(req.params.id, req.params.address);
  if (!s) return res.status(404).json({ error: "stake not found" });
  const y = accrued(s);
  const total = s.amount + y;
  db.prepare("UPDATE stakes SET active = 0 WHERE id = ?").run(s.id);
  const bal = credit(req.params.address, total, "unstake", `principal + ${y.toFixed(2)} yield`);
  res.json({ ok: true, principal: s.amount, yield: y, returned: total, balance: bal });
});
export default r;
