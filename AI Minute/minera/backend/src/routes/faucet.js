import { Router } from "express";
import { db, getUser, credit } from "../database/db.js";
const r = Router();
const DAY = 86400000, AMOUNT = 25;

r.get("/:address", (req, res) => {
  const u = getUser(req.params.address);
  if (!u) return res.status(404).json({ error: "not found" });
  const next = (u.last_faucet || 0) + DAY;
  res.json({ canClaim: Date.now() >= next, nextClaimAt: next, amount: AMOUNT });
});

r.post("/:address/claim", (req, res) => {
  const u = getUser(req.params.address);
  if (!u) return res.status(404).json({ error: "not found" });
  if (Date.now() < (u.last_faucet || 0) + DAY)
    return res.status(429).json({ error: "already claimed today", nextClaimAt: (u.last_faucet || 0) + DAY });
  db.prepare("UPDATE users SET last_faucet = ? WHERE address = ?").run(Date.now(), req.params.address);
  const bal = credit(req.params.address, AMOUNT, "faucet", "daily faucet");
  res.json({ ok: true, claimed: AMOUNT, balance: bal });
});
export default r;
