import { Router } from "express";
import { db } from "../database/db.js";
import { randomBytes } from "crypto";
const r = Router();

r.get("/:address", (req, res) => {
  res.json(db.prepare("SELECT id,key,calls,spent,day_calls,ts FROM api_keys WHERE address = ? ORDER BY ts DESC").all(req.params.address));
});
r.post("/:address", (req, res) => {
  const key = "mk_live_" + randomBytes(16).toString("hex");
  db.prepare("INSERT INTO api_keys (address,key,ts) VALUES (?,?,?)").run(req.params.address, key, Date.now());
  res.status(201).json({ key });
});
export default r;
