import { useEffect, useState } from "react";
import { api, download } from "../api.js";
import { Loading } from "./States.jsx";

function Bars({ data, color="var(--blue)", label }) {
  const max = Math.max(1, ...data.map((d)=>d.value));
  return (
    <div style={{border:"3px solid var(--ink)",padding:14,marginBottom:14}}>
      <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:10}}>{label}</div>
      <svg viewBox={`0 0 ${data.length*22} 80`} style={{width:"100%",height:90}}>
        {data.map((d,i)=>{
          const h=(d.value/max)*70;
          return <rect key={i} x={i*22+3} y={78-h} width={16} height={h||1} fill={color} stroke="var(--ink)" strokeWidth="2"/>;
        })}
      </svg>
      <div className="mono" style={{fontSize:9,opacity:.6,marginTop:4}}>last {data.length} days · max {max}</div>
    </div>
  );
}

export default function Analytics({ notify }) {
  const [d, setD] = useState(null);
  useEffect(()=>{ api.analytics().then(setD).catch(()=>notify&&notify("Backend offline")); },[]);
  if(!d) return <Loading label="Loading analytics…"/>;
  const earn = Object.entries(d.earningsByType||{});
  const emax = Math.max(1, ...earn.map(([,v])=>v));
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:0,border:"3px solid var(--ink)",marginBottom:16}}>
        {[["INSIGHTS",d.totals.insights],["VERIFIED",d.totals.verified],
          ["🔥 BURNED",Math.round(d.totals.burned).toLocaleString()],
          ["LICENSE $",d.totals.licenseRevenue.toLocaleString()]].map(([l,v],i)=>(
          <div key={i} style={{flex:"1 0 auto",padding:"10px 16px",borderRight:"3px solid var(--ink)"}}>
            <div className="mono" style={{fontSize:9,opacity:.6}}>{l}</div>
            <div className="anton" style={{fontSize:24}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <button className="btn ghost" style={{fontSize:11,padding:"8px 12px"}} onClick={()=>download("/api/export/insights","insights.csv")}>⬇ INSIGHTS CSV</button>
        <button className="btn ghost" style={{fontSize:11,padding:"8px 12px"}} onClick={()=>download("/api/export/leaderboard","leaderboard.csv")}>⬇ LEADERBOARD CSV</button>
      </div>
      <Bars data={d.insightsDaily} label="📈 INSIGHTS SUBMITTED / DAY" color="var(--blue)"/>
      <Bars data={d.burnsDaily} label="🔥 MINE BURNED / DAY" color="var(--red)"/>
      <Bars data={d.licensesDaily} label="💰 LICENSE REVENUE / DAY" color="var(--green)"/>
      <div style={{border:"3px solid var(--ink)",padding:14}}>
        <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:10}}>💼 EARNINGS BY SOURCE</div>
        {earn.length===0 && <div style={{fontSize:12,opacity:.6}}>No earnings yet.</div>}
        {earn.map(([k,v])=>(
          <div key={k} style={{display:"grid",gridTemplateColumns:"90px 1fr 70px",alignItems:"center",gap:8,padding:"5px 0"}}>
            <span className="mono" style={{fontSize:11,fontWeight:700}}>{k.toUpperCase()}</span>
            <span style={{height:12,border:"2px solid var(--ink)"}}><i style={{display:"block",height:"100%",width:`${v/emax*100}%`,background:"var(--green)"}}/></span>
            <span className="mono" style={{fontSize:11,textAlign:"right"}}>{Math.round(v).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
