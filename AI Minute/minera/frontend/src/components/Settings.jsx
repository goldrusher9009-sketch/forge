import { useEffect, useState } from "react";
import { api, BASE } from "../api.js";
import { useEffect as _ue } from "react";
export default function Settings({ address, notify }) {
  const [keys, setKeys] = useState([]);
  const [ref, setRef] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [preset, setPresetState] = useState(document.body.dataset.preset||"blueprint");
  const [hooks, setHooks] = useState([]);
  const [hurl, setHurl] = useState("");
  function pick(p){ setPresetState(p); if(p==="blueprint") delete document.body.dataset.preset; else document.body.dataset.preset=p; }
  const load = () => api.apiKeys(address).then(setKeys).catch(()=>{});
  function loadHooks(){ api.webhooks(address).then(setHooks).catch(()=>{}); }
  useEffect(()=>{ load(); api.referrals(address).then(setRef).catch(()=>{}); api.prefs(address).then(setPrefs).catch(()=>{}); loadHooks(); },[]);
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
      <div style={{border:"3px solid var(--ink)",padding:14,marginBottom:14}}>
        <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:8,color:"var(--blue)"}}>⚙ SETTINGS BACKUP</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn ghost" style={{fontSize:11,padding:"8px 12px"}} onClick={()=>{
            const data={theme:document.body.dataset.theme||"light",preset:document.body.dataset.preset||"blueprint"};
            const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
            const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="minera-settings.json"; a.click();
            notify("Settings exported");
          }}>⬇ EXPORT</button>
          <label className="btn ghost" style={{fontSize:11,padding:"8px 12px",cursor:"pointer"}}>⬆ IMPORT
            <input type="file" accept="application/json" style={{display:"none"}} onChange={(e)=>{
              const file=e.target.files?.[0]; if(!file)return; const rd=new FileReader();
              rd.onload=()=>{ try{ const d=JSON.parse(rd.result);
                if(d.theme){document.body.dataset.theme=d.theme;}
                if(d.preset && d.preset!=="blueprint"){document.body.dataset.preset=d.preset;} else delete document.body.dataset.preset;
                pick(d.preset||"blueprint"); notify("Settings imported"); }catch{ notify("Invalid settings file"); } };
              rd.readAsText(file); e.target.value="";
            }}/>
          </label>
        </div>
      </div>
      <div style={{border:"3px solid var(--ink)",padding:14,marginBottom:14}}>
        <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:8,color:"var(--blue)"}}>🎨 THEME PRESET</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["blueprint","terminal","riso"].map((p)=>(
            <button key={p} onClick={()=>pick(p)} className="mono" style={{border:"3px solid var(--ink)",background:preset===p?"var(--ink)":"transparent",color:preset===p?"var(--paper)":"var(--ink)",padding:"7px 14px",fontWeight:700,fontSize:11,cursor:"pointer",textTransform:"uppercase"}}>{p}</button>
          ))}
        </div>
      </div>
      {prefs && (
        <div style={{border:"3px solid var(--ink)",padding:14,marginBottom:14}}>
          <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:8,color:"var(--blue)"}}>🔔 NOTIFICATION PREFERENCES</div>
          {["insight","license","referral","achievement"].map((k)=>(
            <label key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>
              {k.toUpperCase()}
              <input type="checkbox" checked={!!prefs[k]} onChange={(e)=>{ const np={...prefs,[k]:e.target.checked?1:0}; setPrefs(np); api.savePrefs(address,np).catch(()=>{}); }}/>
            </label>
          ))}
        </div>
      )}
      <a className="btn ghost" href={(BASE||"")+"/api/docs"} target="_blank" rel="noreferrer" style={{textDecoration:"none",marginRight:8}}>📖 API DOCS</a>
      <button className="btn" onClick={gen}>＋ GENERATE API KEY</button>
      <div style={{border:"3px solid var(--ink)",padding:14,margin:"14px 0"}}>
        <div className="mono" style={{fontSize:11,fontWeight:700,marginBottom:8,color:"var(--blue)"}}>🪝 WEBHOOKS — POST events to your URL</div>
        <div style={{display:"flex",gap:8}}>
          <input value={hurl} onChange={(e)=>setHurl(e.target.value)} placeholder="https://your-server/hook"
            style={{flex:1,border:"3px solid var(--ink)",background:"var(--paper)",padding:9,fontFamily:"'Space Mono',monospace",fontSize:12}}/>
          <button className="btn" onClick={async()=>{ if(!hurl)return; await api.addWebhook(address,hurl,"*").catch(()=>notify("Bad URL")); setHurl(""); loadHooks(); notify("Webhook added"); }}>ADD</button>
        </div>
        {hooks.map((h)=>(
          <div key={h.id} className="mono" style={{fontSize:11,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderTop:"2px dashed var(--ink)",marginTop:6}}>
            <span style={{wordBreak:"break-all"}}>{h.url}</span>
            <button onClick={async()=>{ await api.delWebhook(address,h.id); loadHooks(); }} style={{border:"2px solid var(--ink)",background:"var(--red)",color:"var(--paper)",fontWeight:700,cursor:"pointer",padding:"2px 8px"}}>✕</button>
          </div>
        ))}
      </div>
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
            <b className="mono" style={{fontSize:11}}>{k.calls} calls · {k.day_calls||0}/1000 today · ${k.spent.toFixed(2)}</b>
          </div>
        ))}
        {keys.length===0 && <div className="row"><span style={{opacity:.6}}>No keys yet.</span></div>}
      </div>
    </div>
  );
}
