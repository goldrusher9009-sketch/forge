import { useEffect, useState } from "react";
import { api } from "../api.js";
export default function Checklist({ address, insights, balance }) {
  const [done, setDone] = useState({ insight:false, faucet:false, stake:false, profile:false, key:false });
  const [dismissed, setDismissed] = useState(false);
  useEffect(()=>{
    if(!address) return;
    Promise.allSettled([
      api.transactions(address,null,0),
      api.stakes(address),
      api.profile(address),
      api.apiKeys(address),
    ]).then(([tx,st,pf,ks])=>{
      const txr = tx.value?.rows || [];
      setDone({
        insight: insights.some(i=>i.status==="verified") || txr.some(t=>t.type==="insight"),
        faucet: txr.some(t=>t.type==="faucet"),
        stake: (st.value||[]).length>0,
        profile: !!(pf.value?.display_name),
        key: (ks.value||[]).length>0,
      });
    });
  },[address,insights.length,balance]);
  const items=[
    ["insight","🧠 Mine your first insight (Explore tab)"],
    ["faucet","🚰 Claim the daily faucet"],
    ["stake","🔒 Stake some MINE"],
    ["profile","👤 Set your display name"],
    ["key","🔑 Generate an API key"],
  ];
  const total=items.length, doneCount=items.filter(([k])=>done[k]).length;
  if(dismissed || doneCount===total) return null;
  return (
    <div style={{border:"3px solid var(--ink)",padding:14,marginBottom:14,background:"var(--paper2)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div className="mono" style={{fontSize:11,fontWeight:700,color:"var(--blue)"}}>🚀 GET STARTED · {doneCount}/{total}</div>
        <button onClick={()=>setDismissed(true)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:14,color:"var(--ink)"}} aria-label="Dismiss">✕</button>
      </div>
      <div style={{height:8,border:"2px solid var(--ink)",marginBottom:10}}><i style={{display:"block",height:"100%",width:`${doneCount/total*100}%`,background:"var(--green)"}}/></div>
      {items.map(([k,label])=>(
        <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:13,fontWeight:500,opacity:done[k]?.5:1}}>
          <span>{done[k]?"✅":"⬜"}</span><span style={{textDecoration:done[k]?"line-through":"none"}}>{label}</span>
        </div>
      ))}
    </div>
  );
}
