import { useState, useRef } from "react";
import { api } from "../api.js";
export default function Search({ onGo }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState([]);
  const [open, setOpen] = useState(false);
  const t = useRef();
  function change(v){ setQ(v); clearTimeout(t.current);
    t.current=setTimeout(()=>{ if(v.trim()) api.search(v).then(d=>{setRes(d.results);setOpen(true);}).catch(()=>{}); else setOpen(false); },250); }
  const TAB = { insight:"market", bond:"bonds", subnet:"subnets" };
  return (
    <div style={{position:"relative"}}>
      <input value={q} onChange={(e)=>change(e.target.value)} placeholder="search…" aria-label="Search" onFocus={()=>q&&setOpen(true)}
        style={{background:"var(--paper)",border:"2px solid var(--paper)",color:"var(--ink)",padding:"5px 10px",
          fontFamily:"'Space Mono',monospace",fontSize:11,width:130}}/>
      {open && res.length>0 && (
        <div style={{position:"absolute",right:0,top:30,width:280,maxHeight:300,overflow:"auto",background:"var(--paper)",
          border:"3px solid var(--ink)",boxShadow:"6px 6px 0 var(--red)",zIndex:90}}>
          {res.map((x,i)=>(
            <div key={i} onClick={()=>{ onGo&&onGo(TAB[x.type]); setOpen(false); }}
              style={{padding:"9px 12px",borderTop:i?"2px dashed var(--ink)":"none",fontSize:12.5,cursor:"pointer"}}>
              <b className="mono" style={{fontSize:10,color:"var(--red)"}}>{x.type.toUpperCase()}</b> {x.label.slice(0,40)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
