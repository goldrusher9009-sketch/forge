import { useEffect, useState } from "react";
import PriceTicker from "./PriceTicker.jsx";
export default function StatsBanner() {
  const [s, setS] = useState(null);
  useEffect(() => {
    let on = true;
    const load = () => import("../api.js").then(({ api }) => api.stats().then((d)=>on&&setS(d)).catch(()=>{}));
    load(); const t = setInterval(load, 6000);
    return () => { on = false; clearInterval(t); };
  }, []);
  if (!s) return null;
  const cell = (l, v, c) => (
    <div style={{flex:"1 0 auto",padding:"8px 14px",borderRight:"3px solid var(--paper)"}}>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,opacity:.7}}>{l}</div>
      <div style={{fontFamily:"'Anton',sans-serif",fontSize:18,color:c||"var(--paper)"}}>{v}</div>
    </div>
  );
  return (
    <div style={{display:"flex",flexWrap:"wrap",background:"var(--ink)",color:"var(--paper)",border:"3px solid var(--ink)",marginTop:12,overflow:"hidden"}}>
      <PriceTicker/>
      {cell("SUPPLY", (s.totalSupply/1e6).toFixed(2)+"M")}
      {cell("🔥 BURNED", s.totalBurned.toLocaleString(undefined,{maximumFractionDigits:0}), "var(--red)")}
      {cell("TREASURY", "$"+s.treasuryUsd.toLocaleString(undefined,{maximumFractionDigits:0}), "var(--green)")}
      {cell("NODES", s.nodesOnline.toLocaleString())}
      {cell("INSIGHTS", s.insights)}
      {cell("LICENSES", s.licenses, "var(--green)")}
    </div>
  );
}
