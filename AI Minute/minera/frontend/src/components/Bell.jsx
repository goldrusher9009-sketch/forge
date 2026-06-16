import { useEffect, useState } from "react";
import { api } from "../api.js";
export default function Bell({ address }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  function load(){ if(address) api.notifications(address).then(setItems).catch(()=>{}); }
  useEffect(()=>{ load(); const t=setInterval(load,6000); return ()=>clearInterval(t); },[address]);
  const unread = items.filter((i)=>!i.read).length;
  function toggle(){ const n=!open; setOpen(n); if(n && unread) api.markRead(address).then(load).catch(()=>{}); }
  return (
    <div style={{position:"relative"}}>
      <button aria-label="Notifications" onClick={toggle} style={{background:"transparent",border:"none",color:"var(--paper)",cursor:"pointer",fontSize:15,position:"relative"}}>
        🔔{unread>0 && <span style={{position:"absolute",top:-6,right:-8,background:"var(--red)",color:"var(--paper)",
          fontSize:9,fontWeight:700,borderRadius:8,padding:"1px 5px",fontFamily:"'Space Mono',monospace"}}>{unread}</span>}
      </button>
      {open && (
        <div style={{position:"absolute",right:0,top:30,width:280,maxHeight:320,overflow:"auto",
          background:"var(--paper)",border:"3px solid var(--ink)",boxShadow:"6px 6px 0 var(--red)",zIndex:80}}>
          <div style={{background:"var(--ink)",color:"var(--paper)",padding:"8px 12px",fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700}}>NOTIFICATIONS</div>
          {items.length===0 && <div style={{padding:12,fontSize:12,opacity:.6}}>No notifications yet.</div>}
          {items.map((n)=>(
            <div key={n.id} style={{padding:"10px 12px",borderTop:"2px dashed var(--ink)",fontSize:12.5,fontWeight:500}}>{n.text}</div>
          ))}
        </div>
      )}
    </div>
  );
}
