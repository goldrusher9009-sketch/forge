import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
r.get("/:address", (req, res) => {
  const refs = db.prepare("SELECT * FROM referrals WHERE referrer = ? ORDER BY ts DESC").all(req.params.address);
  const earned = refs.filter((x) => x.rewarded).length * 50;
  res.json({ count: refs.length, rewarded: refs.filter((x)=>x.rewarded).length, earned, referrals: refs });
});
export default r;
