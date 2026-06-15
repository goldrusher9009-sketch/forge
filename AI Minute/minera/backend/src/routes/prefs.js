import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
const KEYS = ["insight", "license", "referral", "achievement"];
r.get("/:address", (req, res) => {
  let p = db.prepare("SELECT * FROM notif_prefs WHERE address = ?").get(req.params.address);
  if (!p) { db.prepare("INSERT INTO notif_prefs (address) VALUES (?)").run(req.params.address); p = db.prepare("SELECT * FROM notif_prefs WHERE address = ?").get(req.params.address); }
  res.json(p);
});
r.put("/:address", (req, res) => {
  db.prepare("INSERT OR IGNORE INTO notif_prefs (address) VALUES (?)").run(req.params.address);
  for (const k of KEYS) if (k in (req.body || {}))
    db.prepare(`UPDATE notif_prefs SET ${k} = ? WHERE address = ?`).run(req.body[k] ? 1 : 0, req.params.address);
  res.json(db.prepare("SELECT * FROM notif_prefs WHERE address = ?").get(req.params.address));
});
export default r;
