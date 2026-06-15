import { useState } from "react";
import { api } from "../api.js";
import { TOKEN } from "../brand.js";

export default function Explorer({ address, onInsight, notify }) {
  const [prompt, setPrompt] = useState("What enzyme could break down PET plastic at room temperature?");
  const [resp, setResp] = useState(null);
  const [ual, setUal] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true); setResp(null);
    try { setResp(await api.generate(prompt)); }
    catch { notify("Backend offline — start the API (npm run dev:backend)"); }
    setBusy(false);
  }
  async function submit() {
    if(!resp) return;
    try {
      const ins = await api.submitInsight(prompt, resp.response, address);
      onInsight(ins); setUal(ins.ual||null);
      notify(ins.status==="verified" ? `Verified! +${ins.reward} ${TOKEN}` : "Rejected — not novel");
    } catch { notify("Submit failed — backend offline?"); }
  }
  return (
    <div className="explorer">
      <label className="mono" style={{fontSize:12,fontWeight:700}}>PROMPT</label>
      <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} />
      <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
        <button className="btn" onClick={run} disabled={busy}>{busy?"SWARM THINKING…":"► RUN ON SWARM"}</button>
        <button className="btn ghost" onClick={submit} disabled={!resp}>⛏ SUBMIT INSIGHT (stake 10 {TOKEN})</button>
      </div>
      <div className="out">{resp ? resp.response : "Swarm output appears here…"}</div>
      {resp && <div className="meta">SWARM: {resp.swarm||resp.mode||"mock"} · NODES: {resp.nodesUsed??"—"} · LATENCY: {resp.latencyMs??"—"}ms</div>}
      {ual && <div className="meta" style={{color:"var(--green)"}}>📜 KNOWLEDGE ASSET: {ual}</div>}
    </div>
  );
}
