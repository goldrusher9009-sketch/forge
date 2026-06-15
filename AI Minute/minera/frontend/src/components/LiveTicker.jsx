import { useEffect, useState } from "react";

const LABEL = {
  insight: (d) => `🧠 INSIGHT #${d.id} ${d.status?.toUpperCase()}${d.reward?` +${d.reward} MINE`:""}`,
  license: (d) => `💰 LICENSED #${d.id} · $${d.amount?.toLocaleString()}`,
  bond: (d) => `💎 NEW BOND "${(d.title||"").slice(0,28)}" $${d.reward?.toLocaleString()}`,
  "bond-award": (d) => `🏆 BOND #${d.id} AWARDED · ${d.payout?.toLocaleString()} MINE`,
  "predict-settle": (d) => `🎲 MARKET #${d.insightId} → ${d.outcome?.toUpperCase()}`,
  burn: (d) => `🔥 BURN ${Math.round(d.amount).toLocaleString()} (${d.source})`,
};

export default function LiveTicker() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    let es;
    try {
      es = new EventSource(base + "/api/events");
      es.onmessage = (e) => {
        try { const m = JSON.parse(e.data); if (LABEL[m.type])
          setItems((l) => [LABEL[m.type](m.data), ...l].slice(0, 12)); } catch {}
      };
    } catch {}
    return () => es && es.close();
  }, []);
  const text = items.length ? items.join("   ◆   ") : "LIVE NETWORK FEED · waiting for events…";
  return (
    <div style={{borderTop:"3px solid var(--ink)",borderBottom:"3px solid var(--ink)",background:"var(--ink)",
      color:"var(--paper)",overflow:"hidden",whiteSpace:"nowrap",fontFamily:"'Space Mono',monospace",
      fontSize:12,fontWeight:700,padding:"8px 0",marginTop:12}}>
      <div style={{display:"inline-block",paddingLeft:"100%",animation:"tk 30s linear infinite"}}>{text}</div>
      <style>{`@keyframes tk{from{transform:translateX(0)}to{transform:translateX(-100%)}}`}</style>
    </div>
  );
}
