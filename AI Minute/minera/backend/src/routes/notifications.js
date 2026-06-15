import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
r.get("/:address", (req, res) => {
  res.json(db.prepare("SELECT * FROM notifications WHERE address = ? ORDER BY ts DESC LIMIT 30").all(req.params.address));
});
r.post("/:address/read", (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE address = ?").run(req.params.address);
  res.json({ ok: true });
});
export default r;
