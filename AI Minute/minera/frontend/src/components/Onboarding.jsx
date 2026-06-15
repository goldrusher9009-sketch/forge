import { useState } from "react";

const STEPS = [
  { t:"WELCOME, OPERATOR", b:"Minera turns your computer into an income stream. Three quick steps and you're earning." },
  { t:"PICK YOUR ROLES", b:"We detected your rig and recommend Compute + Explore. You can run all 10 roles at once.", roles:true },
  { t:"YOU'RE LIVE", b:"Your wallet is funded with a starter balance. Mine insights, license discoveries, stake, govern. Welcome aboard." },
];

export default function Onboarding({ onClose }) {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  return (
    <div className="mbg show">
      <div className="mw" style={{maxWidth:480}}>
        <div className="mh"><span>SETUP · {i+1}/{STEPS.length}</span><button className="x" onClick={onClose}>✕</button></div>
        <div className="mc">
          <h2 style={{fontSize:30}}>{s.t}</h2>
          <p style={{margin:"10px 0 16px"}}>{s.b}</p>
          {s.roles && (
            <div>
              {[["🖥","Compute Miner","✓"],["💡","Prompt Explorer","✓"],["⚖","Validator","+"],["🧠","Model Trainer","+"]].map(([ic,n,m])=>(
                <div className="wzrow" key={n} style={{marginBottom:8}}>
                  <div className="nm" style={{fontSize:16}}>{ic} {n}</div>
                  <span className="mono" style={{fontSize:11,fontWeight:700,color:m==="✓"?"var(--green)":"var(--blue)"}}>{m==="✓"?"ON":"OPTIONAL"}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:10,marginTop:18}}>
            {i>0 && <button className="btn ghost" onClick={()=>setI(i-1)}>BACK</button>}
            {i<STEPS.length-1
              ? <button className="btn" style={{flex:1,justifyContent:"center"}} onClick={()=>setI(i+1)}>NEXT ►</button>
              : <button className="btn" style={{flex:1,justifyContent:"center"}} onClick={onClose}>► START EARNING</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
