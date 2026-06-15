import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();

const DAY = 86400000;
function buckets(rows, n = 14) {
  const now = Date.now(); const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = now - (i + 1) * DAY, end = now - i * DAY;
    out.push({ day: n - i, value: rows.filter((x) => x.ts >= start && x.ts < end).length });
  }
  return out;
}
function bucketsSum(rows, key, n = 14) {
  const now = Date.now(); const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = now - (i + 1) * DAY, end = now - i * DAY;
    out.push({ day: n - i, value: rows.filter((x)=>x.ts>=start&&x.ts<end).reduce((s,x)=>s+x[key],0) });
  }
  return out;
}

r.get("/", (_req, res) => {
  const insights = db.prepare("SELECT ts,status FROM insights").all();
  const burns = db.prepare("SELECT ts,amount FROM burn_events").all();
  const licenses = db.prepare("SELECT ts,amount FROM licenses").all();
  const txs = db.prepare("SELECT ts,type,amount FROM transactions").all();

  const earningsByType = {};
  for (const t of txs) if (t.amount > 0) earningsByType[t.type] = (earningsByType[t.type]||0)+t.amount;

  res.json({
    insightsDaily: buckets(insights),
    burnsDaily: bucketsSum(burns, "amount"),
    licensesDaily: bucketsSum(licenses, "amount"),
    earningsByType,
    totals: {
      insights: insights.length,
      verified: insights.filter((i)=>i.status==='verified'||i.status==='licensed').length,
      burned: burns.reduce((s,b)=>s+b.amount,0),
      licenseRevenue: licenses.reduce((s,l)=>s+l.amount,0),
    },
  });
});
export default r;
