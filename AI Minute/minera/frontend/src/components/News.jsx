import { useEffect, useState } from "react";
import { api } from "../api.js";
export default function News() {
  const [news, setNews] = useState([]);
  useEffect(()=>{ api.news().then(setNews).catch(()=>{}); },[]);
  return (
    <div>
      {news.map((rel)=>(
        <div key={rel.v} style={{border:"3px solid var(--ink)",marginBottom:14}}>
          <div style={{background:"var(--ink)",color:"var(--paper)",padding:"10px 14px",display:"flex",justifyContent:"space-between",fontFamily:"'Space Mono',monospace",fontWeight:700}}>
            <span>RELEASE v{rel.v}</span><span>{rel.date}</span>
          </div>
          <div style={{padding:14}}>
            {rel.items.map((it,i)=>(
              <div key={i} style={{padding:"6px 0",borderBottom:i<rel.items.length-1?"2px dashed var(--ink)":"none",fontSize:14,fontWeight:500}}>✦ {it}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
