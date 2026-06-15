import { Router } from "express";
import { db, addBurn } from "../database/db.js";
const r = Router();

function p(k){ return db.prepare("SELECT v FROM protocol WHERE k = ?").get(k)?.v ?? 0; }

// GET /api/stats -> live protocol snapshot
r.get("/", (_req, res) => {
  const insights = db.prepare("SELECT COUNT(*) c FROM insights").get().c;
  const verified = db.prepare("SELECT COUNT(*) c FROM insights WHERE status IN ('verified','licensed')").get().c;
  const licenses = db.prepare("SELECT COUNT(*) c FROM licenses").get().c;
  const users = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  const burns = db.prepare("SELECT COUNT(*) c FROM burn_events").get().c;
  res.json({
    totalSupply: p("total_supply"),
    totalBurned: p("total_burned"),
    treasuryUsd: p("treasury_usd"),
    nodesOnline: p("nodes_online"),
    insights, verified, licenses, users, burnEvents: burns,
  });
});

// GET /api/stats/burns -> burn history
r.get("/burns", (_req, res) => {
  res.json(db.prepare("SELECT * FROM burn_events ORDER BY ts DESC LIMIT 50").all());
});

// POST /api/stats/burn { amount, source } -> manual/triggered burn (treasury → burn)
r.post("/burn", (req, res) => {
  const amt = Number(req.body?.amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: "amount > 0" });
  addBurn(amt, req.body?.source || "manual");
  res.json({ ok: true, totalBurned: db.prepare("SELECT v FROM protocol WHERE k='total_burned'").get().v });
});
export default r;
