import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();

r.post("/", (req, res) => {
  const { name, sizeBytes } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const cid = "bafy" + Math.random().toString(36).slice(2, 12);
  const ts = Date.now();
  const info = db.prepare(
    "INSERT INTO data_uploads (name,size_bytes,cid,ts) VALUES (?,?,?,?)"
  ).run(name, sizeBytes || 0, cid, ts);
  res.status(201).json({ id: info.lastInsertRowid, name, sizeBytes: sizeBytes || 0, cid, ts });
});

r.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM data_uploads ORDER BY ts DESC").all());
});
export default r;
