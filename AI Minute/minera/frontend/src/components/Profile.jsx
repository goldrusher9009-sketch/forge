import { useEffect, useState } from "react";
import { api } from "../api.js";

function Avatar({ seed, size=64 }) {
  // deterministic 5x5 identicon
  let h = 0; for (const c of (seed||"x")) h = (h*31 + c.charCodeAt(0)) | 0;
  const cells = [];
  for (let i=0;i<15;i++){ h = (h*1103515245 + 12345) & 0x7fffffff; cells.push((h>>3)&1); }
  const g = []; // mirror to 5 wide
  for (let y=0;y<5;y++) for (let x=0;x<5;x++){ const xx = x<3?x:4-x; g.push(cells[y*3+xx]); }
  const cs = size/5;
  return (
    <svg width={size} height={size} style={{border:"3px solid var(--ink)"}}>
      <rect width={size} height={size} fill="var(--paper2)"/>
      {g.map((on,i)=> on ? <rect key={i} x={(i%5)*cs} y={Math.floor(i/5)*cs} width={cs} height={cs} fill="var(--red)"/> : null)}
    </svg>
  );
}

export default function Profile({ address, notify }) {
  const [p, setP] = useState({ display_name:"", bio:"", avatar_seed:address });
  useEffect(()=>{ api.profile(address).then((x)=>setP({ display_name:x.display_name||"", bio:x.bio||"", avatar_seed:x.avatar_seed||address })).catch(()=>{}); },[]);
  async function save(){ await api.saveProfile(address, p); notify("Profile saved"); }
  return (
    <div>
      <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:16}}>
        <Avatar seed={p.avatar_seed}/>
        <div>
          <div className="anton" style={{fontSize:24}}>{p.display_name||"UNNAMED OPERATOR"}</div>
          <div className="mono" style={{fontSize:11,opacity:.6}}>{address}</div>
        </div>
      </div>
      <label className="mono" style={{fontSize:11,fontWeight:700,display:"block",margin:"10px 0 6px"}}>DISPLAY NAME</label>
      <input value={p.display_name} onChange={(e)=>setP({...p,display_name:e.target.value})}
        style={{width:"100%",border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace"}}/>
      <label className="mono" style={{fontSize:11,fontWeight:700,display:"block",margin:"10px 0 6px"}}>BIO</label>
      <textarea value={p.bio} onChange={(e)=>setP({...p,bio:e.target.value})}
        style={{width:"100%",border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace",minHeight:60}}/>
      <label className="mono" style={{fontSize:11,fontWeight:700,display:"block",margin:"10px 0 6px"}}>AVATAR SEED (changes identicon)</label>
      <input value={p.avatar_seed} onChange={(e)=>setP({...p,avatar_seed:e.target.value})}
        style={{width:"100%",border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace"}}/>
      <button className="btn" style={{marginTop:14,width:"100%",justifyContent:"center"}} onClick={save}>► SAVE PROFILE</button>
    </div>
  );
}
