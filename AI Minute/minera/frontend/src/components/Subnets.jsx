import { useEffect, useState } from "react";
import { api } from "../api.js";
export default function Subnets({ address, notify }) {
  const [subs, setSubs] = useState([]);
  const [f, setF] = useState({ name:"", domain:"Medical", cut:0.25 });
  const [show, setShow] = useState(false);
  const load = () => api.subnets().then(setSubs).catch(()=>notify("Backend offline"));
  useEffect(()=>{ load(); },[]);
  async function create(){ if(!f.name.trim()) return notify("Name required");
    await api.createSubnet({ ...f, operator:address }); notify(`Subnet "${f.name}" launched`); setShow(false); setF({...f,name:""}); load(); }
  async function query(id){ const r=await api.querySubnet(id,"diagnose patient X"); notify(`Call billed $${r.fee} · you +$${r.operatorCut}`); load(); }
  return (
    <div>
      <button className="btn" style={{marginBottom:14}} onClick={()=>setShow(s=>!s)}>{show?"✕ CANCEL":"＋ LAUNCH SUBNET"}</button>
      {show && (
        <div className="bondc" style={{borderColor:"var(--red)"}}>
          <div className="cat">NEW VERTICAL SUBNET · OPERATOR KEEPS 20–30%</div>
          <input placeholder="Subnet name (e.g. MedMind)" value={f.name} onChange={(e)=>setF({...f,name:e.target.value})}
            style={{width:"100%",border:"3px solid var(--ink)",background:"var(--paper)",padding:10,margin:"8px 0",fontFamily:"'Space Mono',monospace"}}/>
          <div style={{display:"flex",gap:8}}>
            <input value={f.domain} onChange={(e)=>setF({...f,domain:e.target.value})} placeholder="Domain"
              style={{flex:1,border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace"}}/>
            <select value={f.cut} onChange={(e)=>setF({...f,cut:+e.target.value})}
              style={{border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace"}}>
              <option value={0.20}>20% cut</option><option value={0.25}>25% cut</option><option value={0.30}>30% cut</option>
            </select>
          </div>
          <button className="btn" style={{marginTop:10,width:"100%",justifyContent:"center"}} onClick={create}>► LAUNCH</button>
        </div>
      )}
      {subs.map((s)=>(
        <div className="bondc" key={s.id}>
          <div className="cat">🌐 {s.domain.toUpperCase()} · {Math.round(s.cut*100)}% OPERATOR CUT</div>
          <h4>{s.name}</h4>
          <div className="st" style={{marginBottom:10}}>
            <span className="rw">${s.revenue.toLocaleString()}</span><span>{s.calls} CALLS</span>
            <span style={{opacity:.6}}>{s.operator||"—"}</span>
          </div>
          <button className="btn ghost" onClick={()=>query(s.id)}>► SEND TEST QUERY ($10)</button>
        </div>
      ))}
      {subs.length===0 && <p className="mono" style={{fontSize:12}}>No subnets yet — launch one.</p>}
    </div>
  );
}
