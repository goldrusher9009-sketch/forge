import { Router } from "express";
import { db, getUser } from "../database/db.js";
import { emit } from "../lib/bus.js";
const r = Router();
const DAY = 86400000;

r.get("/", (_req, res) => res.json(db.prepare("SELECT * FROM proposals ORDER BY id DESC").all()));

r.post("/", (req, res) => {
  const { title, body, creator, durationDays } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });
  const ends = Date.now() + (Number(durationDays) || 5) * DAY;
  const info = db.prepare("INSERT INTO proposals (title,body,creator,ends,ts) VALUES (?,?,?,?,?)")
    .run(title, body || "", creator || null, ends, Date.now());
  const p = db.prepare("SELECT * FROM proposals WHERE id = ?").get(info.lastInsertRowid);
  emit("proposal", { id: p.id, title });
  res.status(201).json(p);
});

// vote weighted by current balance; one vote per address
r.post("/:id/vote", (req, res) => {
  const { address, side } = req.body || {};
  if (!["yes","no"].includes(side)) return res.status(400).json({ error: "side yes|no" });
  const p = db.prepare("SELECT * FROM proposals WHERE id = ?").get(req.params.id);
  if (!p || p.status !== "open") return res.status(400).json({ error: "proposal closed" });
  const u = getUser(address);
  const weight = u ? u.balance : 1;
  try {
    db.prepare("INSERT INTO votes (proposal_id,address,side,weight,ts) VALUES (?,?,?,?,?)")
      .run(p.id, address, side, weight, Date.now());
  } catch { return res.status(400).json({ error: "already voted" }); }
  db.prepare(`UPDATE proposals SET ${side} = ${side} + ? WHERE id = ?`).run(weight, p.id);
  const np = db.prepare("SELECT yes,no FROM proposals WHERE id = ?").get(p.id);
  res.json({ ok: true, yes: np.yes, no: np.no });
});

// tally/close
r.post("/:id/close", (req, res) => {
  const p = db.prepare("SELECT * FROM proposals WHERE id = ?").get(req.params.id);
  if (!p) return res.status(404).json({ error: "not found" });
  const status = p.yes >= p.no ? "passed" : "rejected";
  db.prepare("UPDATE proposals SET status = ? WHERE id = ?").run(status, p.id);
  emit("proposal-result", { id: p.id, status });
  res.json({ id: p.id, status, yes: p.yes, no: p.no });
});
export default r;
