import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
const MAX_SUPPLY = 1_000_000_000;
r.get("/", (_req, res) => {
  const p = (k) => db.prepare("SELECT v FROM protocol WHERE k = ?").get(k)?.v || 0;
  const burned = p("total_burned");
  const circulating = p("total_supply");
  const burns = db.prepare("SELECT amount,ts FROM burn_events ORDER BY ts ASC").all();
  // cumulative burn series (last 30 events)
  let cum = 0;
  const series = burns.slice(-30).map((b) => { cum += b.amount; return { ts: b.ts, cumulative: cum }; });
  res.json({
    maxSupply: MAX_SUPPLY,
    circulating,
    burned,
    treasuryUsd: p("treasury_usd"),
    burnedPct: +((burned / MAX_SUPPLY) * 100).toFixed(4),
    bySource: db.prepare("SELECT source, SUM(amount) total, COUNT(*) n FROM burn_events GROUP BY source ORDER BY total DESC").all(),
    series,
  });
});
export default r;
