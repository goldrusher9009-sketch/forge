import { useEffect, useState } from "react";
import { api } from "../api.js";

const FMT = {
  insight:(d)=>`🧠 Insight #${d.id} ${d.status||""} ${d.reward?`+${d.reward}`:""}`,
  license:(d)=>`💰 Licensed #${d.id} for $${(d.amount||0).toLocaleString()}`,
  bond:(d)=>`💎 Bond "${(d.title||"").slice(0,30)}" $${(d.reward||0).toLocaleString()}`,
  "bond-award":(d)=>`🏆 Bond #${d.id} awarded ${(d.payout||0).toLocaleString()} MINE`,
  "predict-settle":(d)=>`🎲 Market #${d.insightId} → ${d.outcome}`,
  burn:(d)=>`🔥 Burned ${Math.round(d.amount||0).toLocaleString()} (${d.source})`,
  subnet:(d)=>`🌐 Subnet "${d.name}" launched`,
  proposal:(d)=>`🗳 Proposal "${(d.title||"").slice(0,30)}"`,
};
const TYPES = ["all","insight","license","bond","burn","subnet","proposal"];

export default function Activity({ notify }) {
  const [type, setType] = useState("all");
  const [rows, setRows] = useState([]);
  const load = () => api.activity(type==="all"?null:type).then(setRows).catch(()=>notify&&notify("Backend offline"));
  useEffect(()=>{ load(); const t=setInterval(load,5000); return ()=>clearInterval(t); },[type]);
  return (
    <div>
      <div className="filterbar" style={{marginBottom:16}}>
        {TYPES.map((x)=>(<button key={x} className={type===x?"on":""} onClick={()=>setType(x)}>{x.toUpperCase()}</button>))}
      </div>
      <div className="feed">
        <div className="fh"><span>🌐 GLOBAL ACTIVITY</span><span style={{color:"var(--red)"}}>● LIVE</span></div>
        {rows.map((a)=>(
          <div className="row" key={a.id}>
            <span>{FMT[a.type]?FMT[a.type](a.data):`${a.type}`}</span>
            <b className="mono" style={{fontSize:10,opacity:.5}}>{new Date(a.ts).toLocaleTimeString()}</b>
          </div>
        ))}
        {rows.length===0 && <div className="row"><span style={{opacity:.6}}>Quiet for now — events appear here in real time.</span></div>}
      </div>
    </div>
  );
}
