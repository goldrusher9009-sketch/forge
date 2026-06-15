// Petals swarm client. Uses a real endpoint if PETALS_URL is set, else a local mock.
// Real mode expects an OpenAI-style or Petals HTTP API returning { text } / { choices }.
const SEEDS = [
  "suggests a previously unreported catalytic pathway",
  "predicts a stable crystalline structure at ambient pressure",
  "identifies a compression scheme with ~18% lower entropy loss",
  "proposes a binding motif with high selectivity",
  "reveals a gene-regulatory interaction under heat stress",
];
function hash(s){ let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))|0; return h; }

export function swarmMode() { return process.env.PETALS_URL ? "petals" : "mock"; }

export async function swarmHealth() {
  const url = process.env.PETALS_URL;
  if (!url) return { mode: "mock", online: true, nodes: 3 + Math.floor(Math.random()*6) };
  try {
    const res = await fetch(url.replace(/\/$/, "") + "/health", { signal: AbortSignal.timeout(2500) });
    return { mode: "petals", online: res.ok, nodes: null };
  } catch { return { mode: "petals", online: false, nodes: null }; }
}

export async function runInference(prompt) {
  const url = process.env.PETALS_URL;
  if (url) {
    try {
      const res = await fetch(url.replace(/\/$/, "") + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, max_new_tokens: 120 }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      const text = data.text || data.choices?.[0]?.text || data.choices?.[0]?.message?.content || "";
      return { response: text || "(empty swarm response)", nodesUsed: data.nodes || null, latencyMs: data.latency_ms || null, mode: "petals" };
    } catch (e) {
      // fall back to mock so the app never hard-fails
      return { ...mock(prompt), mode: "petals-fallback", error: e.message };
    }
  }
  return { ...mock(prompt), mode: "mock" };
}

function mock(prompt) {
  const seed = SEEDS[Math.abs(hash(prompt)) % SEEDS.length];
  return {
    response: `Candidate insight: the model ${seed} in response to "${String(prompt).slice(0,80)}".`,
    nodesUsed: 3 + (Math.abs(hash(prompt)) % 6),
    latencyMs: 350,
  };
}
