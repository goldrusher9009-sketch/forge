import { useEffect, useRef, useState } from "react";

export default function CommandPalette({ commands, onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const ref = useRef();
  useEffect(()=>{ ref.current?.focus(); },[]);
  const filtered = commands.filter((c)=> c.label.toLowerCase().includes(q.toLowerCase()));
  function key(e){
    if(e.key==="ArrowDown"){ setSel((s)=>Math.min(s+1,filtered.length-1)); e.preventDefault(); }
    else if(e.key==="ArrowUp"){ setSel((s)=>Math.max(s-1,0)); e.preventDefault(); }
    else if(e.key==="Enter"){ filtered[sel]?.run(); onClose(); }
    else if(e.key==="Escape"){ onClose(); }
  }
  return (
    <div className="mbg show" onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="mw" style={{maxWidth:480,marginTop:"10vh",alignSelf:"flex-start"}}>
        <div style={{padding:0}}>
          <input ref={ref} value={q} onChange={(e)=>{setQ(e.target.value);setSel(0);}} onKeyDown={key}
            placeholder="Type a command…" aria-label="Command palette"
            style={{width:"100%",border:"none",borderBottom:"3px solid var(--ink)",background:"var(--paper)",color:"var(--ink)",padding:14,fontFamily:"'Space Mono',monospace",fontSize:15,outline:"none"}}/>
          <div style={{maxHeight:340,overflow:"auto"}}>
            {filtered.map((c,i)=>(
              <div key={c.label} onMouseEnter={()=>setSel(i)} onClick={()=>{ c.run(); onClose(); }}
                style={{padding:"11px 14px",cursor:"pointer",background:i===sel?"var(--ink)":"var(--paper)",color:i===sel?"var(--paper)":"var(--ink)",
                  fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,borderBottom:"2px dashed var(--ink)",display:"flex",justifyContent:"space-between"}}>
                <span>{c.label}</span>{c.hint && <span style={{opacity:.5}}>{c.hint}</span>}
              </div>
            ))}
            {filtered.length===0 && <div style={{padding:14,fontSize:13,opacity:.6}} className="mono">No commands.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
