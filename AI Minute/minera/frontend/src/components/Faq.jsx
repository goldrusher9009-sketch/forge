import { useEffect, useState , memo} from "react";
import { api } from "../api.js";
import { Loading } from "./States.jsx";
function Faq() {
  const [faq, setFaq] = useState([]);
  const [open, setOpen] = useState(0);
  useEffect(()=>{ api.faq().then(setFaq).catch(()=>{}); },[]);
  if(faq.length===0) return <Loading label="Loading help…"/>;
  return (
    <div>
      {faq.map((f,i)=>(
        <div key={i} style={{border:"3px solid var(--ink)",marginBottom:10}}>
          <button onClick={()=>setOpen(open===i?-1:i)} style={{width:"100%",textAlign:"left",background:open===i?"var(--ink)":"var(--paper)",color:open===i?"var(--paper)":"var(--ink)",border:"none",padding:"12px 14px",fontFamily:"'Anton',sans-serif",textTransform:"uppercase",fontSize:15,cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
            <span>{f.q}</span><span>{open===i?"−":"+"}</span>
          </button>
          {open===i && <div style={{padding:"12px 14px",fontSize:14.5,fontWeight:500,lineHeight:1.5}}>{f.a}</div>}
        </div>
      ))}
    </div>
  );
}
export default memo(Faq);
