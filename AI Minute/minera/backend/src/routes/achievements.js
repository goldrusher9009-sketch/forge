import { Router } from "express";
import { db } from "../database/db.js";
import { badgeName } from "../database/db.js";
const r = Router();
r.get("/:address", (req, res) => {
  const rows = db.prepare("SELECT * FROM achievements WHERE address = ? ORDER BY ts DESC").all(req.params.address);
  res.json(rows.map((a) => ({ code: a.code, name: badgeName(a.code), ts: a.ts })));
});
export default r;
