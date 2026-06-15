import { useEffect, useState } from "react";
import { api, BASE } from "../api.js";
import { useEffect as _ue } from "react";
export default function Settings({ address, notify }) {
  const [keys, setKeys] = useState([]);
  const [ref, setRef] = useState(null);
  const load = () => api.apiKeys(address).then(setKeys).catch(()=>{});
  useEffect(()=>{ load(); api.referrals(address).then(setRef).catch(()=>{}); },[]);
  async function gen(){ const r=await api.newKey(address); notify("New API key created"); load();
    try{ navigator.clipboard?.writeText(r.key);}catch{} }
  return (
    <div>
      <p className="mono" style={{fontSize:12,fontWeight:700,marginBottom:10,color:"var(--blue)"}}>
        OPENAI-COMPATIBLE ENDPOINT · POST /v1/chat/completions · header x-api-key
      </p>
      <div style={{border:"3px solid var(--ink)",padding:14,marginBottom:14,background:"var(--paper2)"}}>
        <div className="mono" style={{fontSize:11}}>curl http://localhost:4000/v1/chat/completions \<br/>
        &nbsp;&nbsp;-H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \<br/>
        &nbsp;&nbsp;-d '{`{"messages":[{"role":"user","content":"hi"}]}`}'</div>
      </div>
      <a className="btn ghost" href={(BASE||"")+"/api/docs"} target="_blank" rel="noreferrer" style={{textDecoration:"none",marginRight:8}}>📖 API DOCS</a>
      <button className="btn" onClick={gen}>＋ GENERATE API KEY</button>
      <div style={{border:"3px solid var(--ink)",padding:14,margin:"14px 0",background:"var(--paper2)"}}>
        <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:6,color:"var(--blue)"}}>🎁 REFERRAL — EARN 50 MINE PER INVITE</div>
        <div className="mono" style={{fontSize:11,wordBreak:"break-all"}}>{location.origin}/?ref={address}</div>
        <div className="mono" style={{fontSize:11,marginTop:8}}>INVITED: <b>{ref?ref.count:0}</b> · EARNED: <b style={{color:"var(--green)"}}>{ref?ref.earned:0} MINE</b></div>
      </div>
      <div className="feed" style={{marginTop:14}}>
        <div className="fh"><span>🔑 YOUR KEYS</span><span>{keys.length}</span></div>
        {keys.map((k)=>(
          <div className="row" key={k.id}>
            <span className="mono" style={{fontSize:11}}>{k.key.slice(0,18)}…</span>
            <b className="mono" style={{fontSize:11}}>{k.calls} calls · ${k.spent.toFixed(2)}</b>
          </div>
        ))}
        {keys.length===0 && <div className="row"><span style={{opacity:.6}}>No keys yet.</span></div>}
      </div>
    </div>
  );
}
