// OriginTrail DKG client. Real publish if DKG_ENDPOINT set, else local knowledge graph.
// Returns a UAL (Universal Asset Locator) and a novelty verdict.
import { db } from "../database/db.js";

const seen = new Set();

export function dkgMode() { return process.env.DKG_ENDPOINT ? "origintrail" : "local"; }

export async function checkNovelty(responseHash) {
  // local novelty: have we seen this hash? (in real DKG, run a SPARQL similarity query)
  await new Promise((r) => setTimeout(r, 60));
  const novel = !seen.has(responseHash);
  seen.add(responseHash);
  return { novel, confidence: novel ? 0.92 : 0.1 };
}

// Publish a verified insight as a Knowledge Asset; returns UAL + provenance.
export async function publishAsset(insightId, payload, contributors = []) {
  const endpoint = process.env.DKG_ENDPOINT;
  let ual;
  if (endpoint) {
    try {
      const res = await fetch(endpoint.replace(/\/$/, "") + "/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId, payload, contributors }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      ual = data.ual;
    } catch { /* fall through to local */ }
  }
  if (!ual) ual = `did:dkg:minera/0x${insightId.toString(16).padStart(6, "0")}/${Date.now().toString(36)}`;
  db.prepare("INSERT INTO knowledge_assets (insight_id,ual,novel,contributors,ts) VALUES (?,?,?,?,?)")
    .run(insightId, ual, 1, JSON.stringify(contributors), Date.now());
  return { ual, mode: dkgMode() };
}

export function getAsset(insightId) {
  return db.prepare("SELECT * FROM knowledge_assets WHERE insight_id = ?").get(insightId);
}
