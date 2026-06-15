import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
r.get("/", (req, res) => {
  const type = req.query.type;
  const rows = type
    ? db.prepare("SELECT * FROM activity WHERE type = ? ORDER BY ts DESC LIMIT 60").all(type)
    : db.prepare("SELECT * FROM activity ORDER BY ts DESC LIMIT 60").all();
  res.json(rows.map((a) => ({ id: a.id, type: a.type, data: JSON.parse(a.data || "{}"), ts: a.ts })));
});
export default r;
