import { Router } from "express";
import { db } from "../database/db.js";
import { swarmMode } from "../services/swarm.js";
import { dkgMode } from "../services/dkg.js";
import { chainStatus } from "../services/chain.js";
import { metricsJson } from "../middleware/metrics.js";
const r = Router();

r.get("/", (_req, res) => {
  const p = (k) => db.prepare("SELECT v FROM protocol WHERE k = ?").get(k)?.v || 0;
  const burns = db.prepare("SELECT amount,source,ts FROM burn_events ORDER BY ts DESC LIMIT 5").all();
  const m = metricsJson();
  const okClass = (b) => b ? "ok" : "warn";
  const chain = chainStatus();
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="15">
  <title>Minera Status</title><style>
  body{font-family:'Courier New',monospace;background:#EDE8DC;color:#14110C;max-width:760px;margin:30px auto;padding:0 20px}
  h1{font-size:32px;text-transform:uppercase;border-bottom:4px solid #14110C;padding-bottom:8px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:3px solid #14110C;margin:20px 0}
  .cell{padding:12px 16px;border-right:3px solid #14110C;border-bottom:3px solid #14110C}
  .l{font-size:11px;opacity:.6;text-transform:uppercase}.v{font-size:22px;font-weight:700}
  .dot{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:6px}
  .ok{background:#0B7A3B}.warn{background:#C77B0A}
  table{width:100%;border-collapse:collapse;margin-top:14px}td{padding:7px 10px;border-bottom:2px dashed #14110C;font-size:13px}
  </style></head><body>
  <h1>✦ Minera — System Status</h1>
  <p><span class="dot ok"></span> All systems operational · auto-refresh 15s · uptime ${m.uptime_sec}s</p>
  <div class="grid">
    <div class="cell"><div class="l">Requests served</div><div class="v">${m.requests_total.toLocaleString()}</div></div>
    <div class="cell"><div class="l">Avg latency</div><div class="v">${m.avg_latency_ms}ms</div></div>
    <div class="cell"><div class="l">Errors</div><div class="v">${m.errors_total}</div></div>
    <div class="cell"><div class="l">Nodes online</div><div class="v">${p("nodes_online").toLocaleString()}</div></div>
    <div class="cell"><div class="l">Swarm</div><div class="v"><span class="dot ${okClass(true)}"></span>${swarmMode()}</div></div>
    <div class="cell"><div class="l">DKG</div><div class="v"><span class="dot ${okClass(true)}"></span>${dkgMode()}</div></div>
    <div class="cell"><div class="l">Chain</div><div class="v"><span class="dot ${okClass(chain.active)}"></span>${chain.active?"on":"db-only"}</div></div>
    <div class="cell"><div class="l">Total burned</div><div class="v">${Math.round(p("total_burned")).toLocaleString()}</div></div>
  </div>
  <h3>Recent burns</h3>
  <table>${burns.map(b=>`<tr><td>🔥 ${Math.round(b.amount).toLocaleString()} MINE</td><td>${b.source}</td><td>${new Date(b.ts).toLocaleString()}</td></tr>`).join("")||"<tr><td>None yet</td></tr>"}</table>
  </body></html>`;
  res.set("Content-Type", "text/html").send(html);
});
export default r;
