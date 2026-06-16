import { useEffect, useState } from "react";
export default function InstallPrompt() {
  const [evt, setEvt] = useState(null);
  const [hide, setHide] = useState(false);
  useEffect(()=>{
    const h=(e)=>{ e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return ()=>window.removeEventListener("beforeinstallprompt", h);
  },[]);
  if(!evt || hide) return null;
  return (
    <div style={{position:"fixed",bottom:18,right:18,zIndex:115,border:"3px solid var(--ink)",background:"var(--paper)",
      boxShadow:"6px 6px 0 var(--red)",padding:"12px 14px",maxWidth:280,display:"flex",gap:10,alignItems:"center"}}>
      <span style={{fontSize:22}}>📲</span>
      <div style={{flex:1}}>
        <div className="mono" style={{fontSize:12,fontWeight:700}}>Install Minera</div>
        <div className="mono" style={{fontSize:10,opacity:.6}}>Use it like a native app</div>
      </div>
      <button className="btn" style={{padding:"7px 12px",fontSize:11}} onClick={async()=>{ evt.prompt(); await evt.userChoice; setEvt(null); }}>ADD</button>
      <button onClick={()=>setHide(true)} aria-label="Dismiss" style={{background:"transparent",border:"none",cursor:"pointer",fontSize:14}}>✕</button>
    </div>
  );
}
