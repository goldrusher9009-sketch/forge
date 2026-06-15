import { useState } from "react";

const ROLES = [
  ["C-01","🖥","Compute Miner","CORE","~0.5 MINE/hr + 25–35% royalties","Rent your GPU to the swarm."],
  ["E-02","💡","Prompt Explorer","CORE","100 MINE/insight + 40% royalties","Generate prompts that mine insights."],
  ["D-03","📡","Data Provider","CORE","15–20% of each license","Upload datasets, earn royalties."],
  ["V-04","⚖","Validator","CORE","staking yield + slashes","Stake to confirm insights."],
  ["T-05","🧠","Model Trainer","NEW","10% of licenses using it","Fine-tune the shared brain."],
  ["K-06","🔮","Curator","NEW","3% of early-bet licenses","Stake on future commercial value."],
  ["X-07","🥊","Challenge Miner","NEW","share of slashed stakes","Dispute false insights."],
  ["O-08","🛡","Oracle Node","NEW","fee/verify + 5% share","Run a trustless TEE verifier."],
  ["L-09","💧","Liquidity Provider","NEW","0.3% swap fees + rewards","Provide PROTO/USDC liquidity."],
  ["S-10","🌐","Subnet Operator","NEW","20–30% of subnet revenue","Launch a specialized sub-network."],
];

export default function Roles({ notify }) {
  const [active, setActive] = useState({ "C-01": true, "D-03": true, "V-04": true });
  function toggle(id, name) {
    setActive((a) => ({ ...a, [id]: !a[id] }));
    notify && notify(`${active[id] ? "Stopped" : "Activated"} ${name}`);
  }
  return (
    <div>
      <p className="mono" style={{fontSize:12,fontWeight:700,marginBottom:12,color:"var(--blue)"}}>
        DETECTED RIG ► RTX 3060 · 16GB RAM · 500GB SSD · RUN MULTIPLE ROLES AT ONCE
      </p>
      {ROLES.map(([id,ico,name,tag,earn,desc])=>(
        <div className="wzrow" key={id}>
          <div className="nm">{ico} {name}</div>
          <span className="mono" style={{fontSize:10,fontWeight:700,padding:"3px 7px",border:"2px solid var(--ink)",
            background:tag==="CORE"?"var(--green)":"transparent",color:tag==="CORE"?"var(--paper)":"var(--ink)"}}>{id} · {tag}</span>
          <div className="er">{earn} — {desc}</div>
          <button className="btn" style={{padding:"8px 14px",fontSize:11,background:active[id]?"var(--green)":"var(--ink)",borderColor:active[id]?"var(--green)":"var(--ink)"}}
            onClick={()=>toggle(id,name)}>{active[id]?"● ACTIVE":"ACTIVATE"}</button>
        </div>
      ))}
    </div>
  );
}
