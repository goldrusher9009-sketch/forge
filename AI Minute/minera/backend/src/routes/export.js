import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();

function toCsv(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((row) => cols.map((c) => esc(row[c])).join(","))].join("\n");
}
function send(res, rows, name, fmt) {
  if (fmt === "json") { res.set("Content-Disposition", `attachment; filename=${name}.json`); return res.json(rows); }
  res.set({ "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=${name}.csv` });
  res.send(toCsv(rows));
}

r.get("/transactions/:address", (req, res) => {
  const rows = db.prepare("SELECT * FROM transactions WHERE address = ? ORDER BY ts DESC").all(req.params.address);
  send(res, rows, "transactions", req.query.format);
});
r.get("/insights", (req, res) => {
  const rows = db.prepare("SELECT id,prompt,status,reward,confidence,ts FROM insights ORDER BY ts DESC").all();
  send(res, rows, "insights", req.query.format);
});
r.get("/leaderboard", (req, res) => {
  const rows = db.prepare("SELECT address,email,balance FROM users ORDER BY balance DESC").all();
  send(res, rows, "leaderboard", req.query.format);
});
export default r;
