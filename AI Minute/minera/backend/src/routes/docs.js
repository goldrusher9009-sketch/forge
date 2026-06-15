import { Router } from "express";
const r = Router();

const spec = {
  openapi: "3.0.0",
  info: { title: "Minera API", version: "0.1.0", description: "Decentralized AI mining network API." },
  servers: [{ url: "http://localhost:4000" }],
  paths: {
    "/health": { get: { summary: "Health check" } },
    "/api/auth/login": { post: { summary: "Login / create user", requestBody: body({ email: "string", ref: "string?" }) } },
    "/api/users/{address}": { get: { summary: "Get user" } },
    "/api/users/{address}/transactions": { get: { summary: "Transaction ledger" } },
    "/api/users/{address}/profile": { get: { summary: "Get profile" }, put: { summary: "Update profile" } },
    "/api/generate": { post: { summary: "Swarm inference", requestBody: body({ prompt: "string" }) } },
    "/api/insights": { get: { summary: "List insights" }, post: { summary: "Submit insight (auto-verify)" } },
    "/api/insights/{id}/asset": { get: { summary: "Knowledge asset (UAL)" } },
    "/api/market": { get: { summary: "Licensable assets" } },
    "/api/market/{id}/license": { post: { summary: "License insight (40/35/20/5 split)" } },
    "/api/bonds": { get: { summary: "List bonds" }, post: { summary: "Create bond" } },
    "/api/bonds/{id}/award": { post: { summary: "Award bond" } },
    "/api/predictions/{insightId}": { get: { summary: "Market pools" } },
    "/api/predictions/{insightId}/settle": { post: { summary: "Settle market" } },
    "/api/subnets": { get: { summary: "List subnets" }, post: { summary: "Create subnet" } },
    "/api/staking/{address}": { get: { summary: "Active stakes" }, post: { summary: "Stake" } },
    "/api/governance": { get: { summary: "Proposals" }, post: { summary: "Create proposal" } },
    "/api/stats": { get: { summary: "Protocol stats" } },
    "/api/price": { get: { summary: "MINE price + history" } },
    "/api/leaderboard": { get: { summary: "Top operators" } },
    "/api/activity": { get: { summary: "Global activity feed" } },
    "/api/achievements/{address}": { get: { summary: "User badges" } },
    "/api/referrals/{address}": { get: { summary: "Referral stats" } },
    "/api/export/insights": { get: { summary: "Export CSV/JSON" } },
    "/v1/chat/completions": { post: { summary: "OpenAI-compatible inference" } },
  },
};
function body(props) {
  const p = {}; for (const [k, v] of Object.entries(props)) p[k] = { type: v.replace("?", "") };
  return { content: { "application/json": { schema: { type: "object", properties: p } } } };
}

r.get("/openapi.json", (_req, res) => res.json(spec));
r.get("/", (_req, res) => {
  const rows = Object.entries(spec.paths).map(([path, ops]) =>
    Object.entries(ops).map(([m, o]) =>
      `<tr><td class="m m-${m}">${m.toUpperCase()}</td><td class="p">${path}</td><td>${o.summary}</td></tr>`).join("")).join("");
  res.set("Content-Type", "text/html").send(`<!doctype html><html><head><meta charset="utf-8"><title>Minera API</title>
  <style>body{font-family:'Courier New',monospace;background:#EDE8DC;color:#14110C;padding:30px;max-width:900px;margin:auto}
  h1{font-size:34px;text-transform:uppercase;border-bottom:4px solid #14110C;padding-bottom:8px}
  table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:9px 12px;border-bottom:2px dashed #14110C;font-size:13px}
  .m{font-weight:700;width:70px}.m-get{color:#1B3A8F}.m-post{color:#0B7A3B}.m-put{color:#C77B0A}.p{font-weight:700}
  .b{background:#14110C;color:#EDE8DC;padding:3px 8px;font-size:11px}</style></head>
  <body><h1>✦ Minera API <span class="b">v${spec.info.version}</span></h1>
  <p>${spec.info.description} Base: <b>${spec.servers[0].url}</b></p>
  <table>${rows}</table></body></html>`);
});
export default r;
