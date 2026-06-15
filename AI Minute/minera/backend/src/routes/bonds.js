import { Router } from "express";
import { db, getUser, debit, credit, addBurn, audit } from "../database/db.js";
import { emit } from "../lib/bus.js";
const r = Router();

const CREATION_FEE = 0.02; // 2%
const SUCCESS_FEE = 0.05;  // 5%

function shape(b) {
  return { id: b.id, category: b.category, title: b.title, reward: b.reward,
    daysLeft: b.days_left, miners: b.miners, submissions: b.submissions,
    status: b.status, creator: b.creator, winner: b.winner };
}

r.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM bonds ORDER BY id DESC").all().map(shape));
});

// Create a bond — creator pays reward + 2% fee (fee → burn)
r.post("/", (req, res) => {
  const { category, title, reward, durationDays, address } = req.body || {};
  if (!title || !reward) return res.status(400).json({ error: "title+reward required" });
  const amt = Number(reward);
  if (address) {
    const fee = amt * CREATION_FEE;
    const next = debit(address, amt + fee, "bond", `create bond: ${title}`);
    if (next == null) return res.status(400).json({ error: "insufficient balance for reward + 2% fee" });
    addBurn(fee, "bond-creation");
  }
  const info = db.prepare(
    "INSERT INTO bonds (category,title,reward,days_left,creator,status) VALUES (?,?,?,?,?, 'open')"
  ).run(category || "GENERAL", title, amt, Number(durationDays) || 30, address || null);
  const b = db.prepare("SELECT * FROM bonds WHERE id = ?").get(info.lastInsertRowid);
  emit("bond", { id: b.id, title: b.title, reward: b.reward });
  res.status(201).json(shape(b));
});

// Submit work to a bond
r.post("/:id/submit", (req, res) => {
  const { address, insight } = req.body || {};
  const b = db.prepare("SELECT * FROM bonds WHERE id = ?").get(req.params.id);
  if (!b) return res.status(404).json({ error: "bond not found" });
  if (b.status !== "open") return res.status(400).json({ error: "bond closed" });
  db.prepare("INSERT INTO bond_submissions (bond_id,address,insight,ts) VALUES (?,?,?,?)")
    .run(b.id, address || "anon", insight || "(insight)", Date.now());
  db.prepare("UPDATE bonds SET submissions = submissions + 1 WHERE id = ?").run(b.id);
  res.json({ ok: true, submissions: b.submissions + 1 });
});

// Award a bond — winner gets reward minus 5% success fee (fee → burn)
r.post("/:id/award", (req, res) => {
  const { winner } = req.body || {};
  const b = db.prepare("SELECT * FROM bonds WHERE id = ?").get(req.params.id);
  if (!b) return res.status(404).json({ error: "bond not found" });
  if (b.status !== "open") return res.status(400).json({ error: "already resolved" });
  if (!winner) return res.status(400).json({ error: "winner required" });
  const fee = b.reward * SUCCESS_FEE;
  const payout = b.reward - fee;
  const next = getUser(winner) ? credit(winner, payout, "bond", `won bond #${b.id}`) : null;
  addBurn(fee, "bond-success");
  db.prepare("UPDATE bonds SET status='awarded', winner=? WHERE id=?").run(winner, b.id);
  audit(winner, "award-bond", `#${b.id} ${payout}`);
  emit("bond-award", { id: b.id, winner, payout });
  emit("burn", { amount: fee, source: "bond-success" });
  res.json({ ok: true, payout, fee, winnerBalance: next });
});

r.get("/:id/submissions", (req, res) => {
  res.json(db.prepare("SELECT * FROM bond_submissions WHERE bond_id = ? ORDER BY ts DESC").all(req.params.id));
});
export default r;
