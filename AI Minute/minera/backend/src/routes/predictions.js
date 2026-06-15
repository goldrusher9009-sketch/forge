import { Router } from "express";
import { db, getUser, debit, credit, addBurn } from "../database/db.js";
import { emit } from "../lib/bus.js";
const r = Router();
const FEE = 0.03; // 3% protocol fee → burn

// GET /api/predictions/:insightId  -> current pools
r.get("/:insightId", (req, res) => {
  const rows = db.prepare("SELECT side, SUM(stake) total, COUNT(*) n FROM predictions WHERE insight_id = ? AND settled = 0 GROUP BY side").all(req.params.insightId);
  const pools = { yes: 0, no: 0 };
  rows.forEach((x) => (pools[x.side] = x.total));
  res.json({ insightId: Number(req.params.insightId), pools });
});

// POST /api/predictions  { insightId, address, side, stake }  -> stake locked (debit)
r.post("/", (req, res) => {
  const { insightId, address, side, stake } = req.body || {};
  const amt = Number(stake);
  if (!["yes", "no"].includes(side)) return res.status(400).json({ error: "side must be yes|no" });
  if (!amt || amt <= 0) return res.status(400).json({ error: "stake > 0 required" });
  if (address) {
    const next = debit(address, amt, "predict", `stake ${side} on #${insightId}`);
    if (next == null) return res.status(400).json({ error: "insufficient balance" });
  }
  db.prepare("INSERT INTO predictions (insight_id,address,side,stake,ts) VALUES (?,?,?,?,?)")
    .run(insightId, address || "anon", side, amt, Date.now());
  res.status(201).json({ ok: true });
});

// POST /api/predictions/:insightId/settle { outcome: yes|no }
r.post("/:insightId/settle", (req, res) => {
  const { outcome } = req.body || {};
  if (!["yes", "no"].includes(outcome)) return res.status(400).json({ error: "outcome must be yes|no" });
  const bets = db.prepare("SELECT * FROM predictions WHERE insight_id = ? AND settled = 0").all(req.params.insightId);
  if (bets.length === 0) return res.status(400).json({ error: "no open bets" });

  const winners = bets.filter((b) => b.side === outcome);
  const losers = bets.filter((b) => b.side !== outcome);
  const losePool = losers.reduce((s, b) => s + b.stake, 0);
  const winPool = winners.reduce((s, b) => s + b.stake, 0);
  const fee = losePool * FEE;
  const distributable = losePool - fee;
  addBurn(fee, "prediction-fee");

  const settle = db.prepare("UPDATE predictions SET settled = 1, payout = ? WHERE id = ?");
  let paid = 0;
  for (const w of winners) {
    const share = winPool > 0 ? (w.stake / winPool) * distributable : 0;
    const payout = w.stake + share;                 // stake back + winnings
    if (getUser(w.address)) credit(w.address, payout, "predict", `won prediction #${req.params.insightId}`);
    settle.run(payout, w.id);
    paid += payout;
  }
  for (const l of losers) settle.run(0, l.id);       // stake already debited
  emit("predict-settle", { insightId: Number(req.params.insightId), outcome, distributed: paid });
  emit("burn", { amount: fee, source: "prediction-fee" });
  res.json({ outcome, winners: winners.length, losers: losers.length, distributed: paid, burnedFee: fee });
});
export default r;
