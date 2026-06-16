import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Empty } from "./States.jsx";

export default function Bonds({ address, onBalance, notify }) {
  const [bonds, setBonds] = useState([]);
  const [form, setForm] = useState({ title:"", reward:50000, category:"PHARMA", durationDays:60 });
  const [show, setShow] = useState(false);
  const load = () => api.bonds().then(setBonds).catch(()=>notify("Backend offline"));
  useEffect(()=>{ load(); },[]);

  async function create() {
    if(!form.title.trim()) return notify("Title required");
    try {
      await api.createBond({ ...form, address });
      notify(`Bond posted — ${form.reward.toLocaleString()} escrowed + 2% fee burned`);
      setShow(false); setForm({...form,title:""}); load();
    } catch(e){ notify("Create failed — insufficient balance for reward + 2% fee?"); }
  }
  async function mine(id){
    try { await api.submitBond(id, address, "candidate insight"); notify("Submission sent to bond"); load(); }
    catch { notify("Submit failed"); }
  }

  return (
    <div>
      <button className="btn" style={{marginBottom:14}} onClick={()=>setShow(s=>!s)}>{show?"✕ CANCEL":"＋ CREATE BOND"}</button>
      {show && (
        <div className="bondc" style={{borderColor:"var(--red)"}}>
          <div className="cat">NEW EUREKA BOND</div>
          <input placeholder="Discovery criteria / title" value={form.title}
            onChange={(e)=>setForm({...form,title:e.target.value})}
            style={{width:"100%",border:"3px solid var(--ink)",background:"var(--paper)",padding:10,margin:"8px 0",fontFamily:"'Space Mono',monospace"}}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input type="number" value={form.reward} onChange={(e)=>setForm({...form,reward:+e.target.value})}
              style={{flex:1,border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace"}} placeholder="Reward $"/>
            <input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value.toUpperCase()})}
              style={{flex:1,border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace"}} placeholder="Category"/>
          </div>
          <button className="btn" style={{marginTop:10,width:"100%",justifyContent:"center"}} onClick={create}>► POST BOND (reward + 2% fee)</button>
        </div>
      )}
      {bonds.length===0 && <Empty icon="💎" label="No active bounties yet"/>}
      {bonds.map((b)=>(
        <div className="bondc" key={b.id}>
          <div className="cat">◆ {b.category} {b.status!=="open" && `· ${b.status.toUpperCase()}`}</div>
          <h4>{b.title}</h4>
          <div className="st" style={{marginBottom:10}}>
            <span className="rw">${b.reward.toLocaleString()}</span>
            <span>{b.daysLeft} DAYS</span><span>{b.miners} MINING</span><span>{b.submissions} SUBS</span>
          </div>
          {b.status==="open" && <button className="btn ghost" onClick={()=>mine(b.id)}>⛏ MINE THIS BOND</button>}
        </div>
      ))}
    </div>
  );
}
