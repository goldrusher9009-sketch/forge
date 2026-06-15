import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();

// GET /api/leaderboard -> top earners by balance
r.get("/", (_req, res) => {
  const rows = db.prepare("SELECT address,email,balance,display_name FROM users ORDER BY balance DESC LIMIT 20").all();
  res.json(rows.map((u, i) => ({
    rank: i + 1,
    address: u.address,
    handle: u.display_name || (u.email || "operator").split("@")[0],
    balance: u.balance,
  })));
});
export default r;
