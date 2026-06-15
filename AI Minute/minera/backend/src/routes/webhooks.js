import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
r.get("/:address", (req, res) => res.json(db.prepare("SELECT * FROM webhooks WHERE address = ? ORDER BY id DESC").all(req.params.address)));
r.post("/:address", (req, res) => {
  const { url, events } = req.body || {};
  if (!url || !/^https?:\/\//.test(url)) return res.status(400).json({ error: "valid url required" });
  const info = db.prepare("INSERT INTO webhooks (address,url,events,ts) VALUES (?,?,?,?)")
    .run(req.params.address, url, events || "*", Date.now());
  res.status(201).json({ id: info.lastInsertRowid });
});
r.delete("/:address/:id", (req, res) => {
  db.prepare("DELETE FROM webhooks WHERE id = ? AND address = ?").run(req.params.id, req.params.address);
  res.json({ ok: true });
});
export default r;
