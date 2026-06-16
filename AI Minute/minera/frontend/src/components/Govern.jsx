import { useEffect, useState } from "react";
import { api } from "../api.js";
export default function Govern({ address, notify }) {
  const [props, setProps] = useState([]);
  const [f, setF] = useState({ title:"", body:"" });
  const [show, setShow] = useState(false);
  const load = () => api.proposals().then(setProps).catch(()=>notify("Backend offline"));
  useEffect(()=>{ load(); },[]);
  async function create(){ if(!f.title.trim()) return notify("Title required");
    await api.createProposal({ ...f, creator:address }); notify("Proposal submitted"); setShow(false); setF({title:"",body:""}); load(); }
  async function vote(id,side){ try{ await api.vote(id,address,side); notify(`Voted ${side.toUpperCase()}`); load(); }catch{ notify("Already voted"); } }
  async function close(id){ const r=await api.closeProposal(id); notify(`Proposal ${r.status.toUpperCase()}`); load(); }
  return (
    <div>
      <button className="btn" style={{marginBottom:14}} onClick={()=>setShow(s=>!s)}>{show?"✕ CANCEL":"＋ NEW PROPOSAL"}</button>
      {show && (
        <div className="bondc" style={{borderColor:"var(--red)"}}>
          <div className="cat">NEW DAO PROPOSAL · VOTES WEIGHTED BY BALANCE</div>
          <input placeholder="Proposal title" value={f.title} onChange={(e)=>setF({...f,title:e.target.value})}
            style={{width:"100%",border:"3px solid var(--ink)",background:"var(--paper)",padding:10,margin:"8px 0",fontFamily:"'Space Mono',monospace"}}/>
          <textarea placeholder="Details…" value={f.body} onChange={(e)=>setF({...f,body:e.target.value})}
            style={{width:"100%",border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace",minHeight:60}}/>
          <button className="btn" style={{marginTop:10,width:"100%",justifyContent:"center"}} onClick={create}>► SUBMIT</button>
        </div>
      )}
      {props.map((p)=>{
        const total=p.yes+p.no||1, yp=Math.round(p.yes/total*100);
        return (
          <div className="bondc" key={p.id}>
            <div className="cat">🗳 PROPOSAL #{p.id} · {p.status.toUpperCase()}</div>
            <h4>{p.title}</h4>
            {p.body && <p style={{fontSize:13,marginBottom:10}}>{p.body}</p>}
            <div style={{height:16,border:"2px solid var(--ink)",display:"flex",marginBottom:8}}>
              <div style={{width:`${yp}%`,background:"var(--green)"}}/><div style={{flex:1,background:"var(--red)"}}/>
            </div>
            <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:10}}>YES {Math.round(p.yes).toLocaleString()} · NO {Math.round(p.no).toLocaleString()}</div>
            {p.status==="open" && <div style={{display:"flex",gap:8}}>
              <button className="btn" style={{padding:"8px 14px",fontSize:11,background:"var(--green)",borderColor:"var(--green)"}} onClick={()=>vote(p.id,"yes")}>▲ YES</button>
              <button className="btn" style={{padding:"8px 14px",fontSize:11,background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>vote(p.id,"no")}>▼ NO</button>
              <button className="btn ghost" style={{padding:"8px 14px",fontSize:11}} onClick={()=>close(p.id)}>TALLY</button>
            </div>}
          </div>
        );
      })}
      {props.length===0 && <p className="mono" style={{fontSize:12}}>No proposals yet — start one to shape the network.</p>}
    </div>
  );
}
