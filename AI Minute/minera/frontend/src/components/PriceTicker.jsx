import { useEffect, useState } from "react";
import { api } from "../api.js";
export default function PriceTicker() {
  const [d, setD] = useState(null);
  useEffect(()=>{ let on=true; const load=()=>api.price().then(x=>on&&setD(x)).catch(()=>{});
    load(); const t=setInterval(load,5000); return ()=>{on=false;clearInterval(t);}; },[]);
  if(!d) return null;
  const h=(d.history||[]).slice(-30).map(x=>x.price);
  const min=Math.min(...h,d.price), max=Math.max(...h,d.price)||1, range=max-min||1;
  const up = h.length>1 ? d.price>=h[0] : true;
  const pts = h.map((p,i)=>`${i/(h.length-1||1)*100},${30-((p-min)/range)*28}`).join(" ");
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRight:"3px solid var(--paper)"}}>
      <div>
        <div className="mono" style={{fontSize:9,opacity:.7}}>MINE PRICE</div>
        <div className="anton" style={{fontSize:18,color:up?"var(--green)":"var(--red)"}}>${d.price.toFixed(4)}</div>
      </div>
      <svg viewBox="0 0 100 30" style={{width:80,height:30}} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={up?"var(--green)":"var(--red)"} strokeWidth="2"/>
      </svg>
    </div>
  );
}
