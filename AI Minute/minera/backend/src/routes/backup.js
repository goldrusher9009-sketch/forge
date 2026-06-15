import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();

const TABLES = ["users","insights","bonds","transactions","subnets","stakes","proposals",
  "knowledge_assets","royalty_payouts","licenses","burn_events","achievements","referrals","protocol"];

// GET /api/admin/backup -> downloadable JSON snapshot
r.get("/backup", (_req, res) => {
  const snap = { version: 1, ts: Date.now(), tables: {} };
  for (const t of TABLES) {
    try { snap.tables[t] = db.prepare(`SELECT * FROM ${t}`).all(); } catch { snap.tables[t] = []; }
  }
  res.set("Content-Disposition", "attachment; filename=minera-backup.json");
  res.json(snap);
});

// POST /api/admin/restore { snapshot } -> wipe + reload (DANGEROUS; demo only)
r.post("/restore", (req, res) => {
  const snap = req.body?.snapshot;
  if (!snap?.tables) return res.status(400).json({ error: "invalid snapshot" });
  const tx = db.transaction(() => {
    for (const [t, rows] of Object.entries(snap.tables)) {
      if (!TABLES.includes(t)) continue;
      db.prepare(`DELETE FROM ${t}`).run();
      for (const row of rows) {
        const cols = Object.keys(row);
        const ph = cols.map(() => "?").join(",");
        try { db.prepare(`INSERT INTO ${t} (${cols.join(",")}) VALUES (${ph})`).run(...cols.map((c) => row[c])); } catch {}
      }
    }
  });
  tx();
  res.json({ ok: true, restored: Object.keys(snap.tables).length });
});
export default r;
