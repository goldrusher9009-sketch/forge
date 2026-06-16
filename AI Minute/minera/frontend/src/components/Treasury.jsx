import { useEffect, useState , memo} from "react";
import { api } from "../api.js";
import { Loading } from "./States.jsx";
function Treasury({ notify }) {
  const [d, setD] = useState(null);
  useEffect(()=>{ const l=()=>api.treasury().then(setD).catch(()=>notify&&notify("Backend offline")); l(); const t=setInterval(l,6000); return ()=>clearInterval(t); },[]);
  if(!d) return <Loading label="Loading treasury…"/>;
  const s=d.series||[]; const max=Math.max(1,...s.map(x=>x.cumulative));
  const pts=s.map((x,i)=>`${i/(s.length-1||1)*100},${40-(x.cumulative/max)*38}`).join(" ");
  const bmax=Math.max(1,...d.bySource.map(b=>b.total));
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:0,border:"3px solid var(--ink)",marginBottom:16}}>
        {[["MAX SUPPLY",(d.maxSupply/1e6)+"M"],["CIRCULATING",(d.circulating/1e6).toFixed(2)+"M"],
          ["🔥 BURNED",Math.round(d.burned).toLocaleString()],["BURNED %",d.burnedPct+"%"],["TREASURY","$"+Math.round(d.treasuryUsd).toLocaleString()]].map(([l,v],i)=>(
          <div key={i} style={{flex:"1 0 auto",padding:"10px 14px",borderRight:"3px solid var(--ink)"}}>
            <div className="mono" style={{fontSize:9,opacity:.6}}>{l}</div><div className="anton" style={{fontSize:22}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{border:"3px solid var(--ink)",padding:14,marginBottom:14}}>
        <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:8}}>🔥 CUMULATIVE BURN</div>
        <svg viewBox="0 0 100 40" style={{width:"100%",height:120}} preserveAspectRatio="none">
          <polyline points={pts} fill="none" stroke="var(--red)" strokeWidth="2"/>
        </svg>
      </div>
      <div style={{border:"3px solid var(--ink)",padding:14}}>
        <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:10}}>BURN BY SOURCE</div>
        {d.bySource.map((b)=>(
          <div key={b.source} style={{display:"grid",gridTemplateColumns:"130px 1fr 70px",alignItems:"center",gap:8,padding:"5px 0"}}>
            <span className="mono" style={{fontSize:11,fontWeight:700}}>{b.source}</span>
            <span style={{height:12,border:"2px solid var(--ink)"}}><i style={{display:"block",height:"100%",width:`${b.total/bmax*100}%`,background:"var(--red)"}}/></span>
            <span className="mono" style={{fontSize:11,textAlign:"right"}}>{Math.round(b.total).toLocaleString()}</span>
          </div>
        ))}
        {d.bySource.length===0 && <div style={{fontSize:12,opacity:.6}}>No burns yet.</div>}
      </div>
    </div>
  );
}
export default memo(Treasury);
