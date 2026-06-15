import { useEffect, useState } from "react";
import { api } from "../api.js";
import { TOKEN } from "../brand.js";
export default function Stake({ address, balance, onChange, notify }) {
  const [stakes, setStakes] = useState([]);
  const [amt, setAmt] = useState(100);
  const load = () => api.stakes(address).then(setStakes).catch(()=>{});
  useEffect(()=>{ load(); const t=setInterval(load,4000); return ()=>clearInterval(t); },[]);
  async function stake(){ if(amt<=0) return; try{ await api.stake(address,amt); notify(`Staked ${amt} ${TOKEN} @ 18% APR`); onChange&&onChange(); load(); }catch{ notify("Insufficient balance"); } }
  async function unstake(id){ const r=await api.unstake(address,id); notify(`Unstaked — +${r.yield.toFixed(2)} yield`); onChange&&onChange(); load(); }
  const totalStaked = stakes.reduce((s,x)=>s+x.amount,0);
  const totalYield = stakes.reduce((s,x)=>s+x.yield,0);
  return (
    <div>
      <div className="balbox">
        <div className="l">STAKED · EARNING 18% APR</div>
        <div className="amt">{totalStaked.toLocaleString(undefined,{maximumFractionDigits:2})} {TOKEN}</div>
        <div className="usd">+{totalYield.toFixed(4)} {TOKEN} yield accrued</div>
      </div>
      <label className="mono" style={{fontSize:11,fontWeight:700,display:"block",margin:"10px 0 6px"}}>AMOUNT TO STAKE</label>
      <div style={{display:"flex",gap:8}}>
        <input type="number" value={amt} onChange={(e)=>setAmt(+e.target.value||0)}
          style={{flex:1,border:"3px solid var(--ink)",background:"var(--paper)",padding:12,fontFamily:"'Anton',sans-serif",fontSize:22}}/>
        <button className="btn" onClick={stake}>► STAKE</button>
      </div>
      <div className="feed" style={{marginTop:16}}>
        <div className="fh"><span>🔒 ACTIVE STAKES</span><span>{stakes.length}</span></div>
        {stakes.map((s)=>(
          <div className="row" key={s.id}>
            <span>{s.amount.toLocaleString()} {TOKEN} · +{s.yield.toFixed(4)} yield</span>
            <button className="btn ghost" style={{padding:"5px 10px",fontSize:10}} onClick={()=>unstake(s.id)}>UNSTAKE</button>
          </div>
        ))}
        {stakes.length===0 && <div className="row"><span style={{opacity:.6}}>No active stakes.</span></div>}
      </div>
    </div>
  );
}
