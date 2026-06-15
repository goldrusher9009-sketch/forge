import { useEffect, useState } from "react";
import { api, download, BASE } from "../api.js";

export default function Admin({ address, notify }) {
  const [pending, setPending] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [ov, setOv] = useState(null);
  const [hl, setHl] = useState(null);
  const [acts, setActs] = useState([]);
  const [audit, setAudit] = useState([]);
  function load() {
    api.pending().then(setPending).catch(()=>{});
    api.openBonds().then(setBonds).catch(()=>{});
    api.openMarkets().then(setMarkets).catch(()=>{});
    api.adminOverview().then(setOv).catch(()=>{});
    api.adminHealth().then(setHl).catch(()=>{});
    api.treasuryActions().then(setActs).catch(()=>{});
    api.adminAudit().then(setAudit).catch(()=>{});
  }
  useEffect(()=>{ load(); },[]);

  async function verify(id, ok){ await api.verify(id, ok, address); notify(ok?"Approved":"Rejected"); load(); }
  async function award(id){ await api.awardBond(id, address); notify(`Bond #${id} awarded to you`); load(); }
  async function settle(insightId, outcome){ await api.settle(insightId, outcome); notify(`Market #${insightId} settled ${outcome.toUpperCase()}`); load(); }

  return (
    <div>
      <div style={{marginBottom:14}}>
        <a className="btn ghost" href={(BASE||"")+"/api/admin/backup"} target="_blank" rel="noreferrer" style={{textDecoration:"none",fontSize:11,padding:"8px 12px"}}>⬇ DB BACKUP (JSON)</a>
      </div>
      {hl && (
        <div style={{border:"3px solid var(--ink)",padding:12,marginBottom:16,fontFamily:"'Space Mono',monospace",fontSize:12}}>
          <div style={{fontWeight:700,marginBottom:6}}>🩺 SYSTEM HEALTH</div>
          UPTIME {hl.uptimeSec}s · NODE {hl.node} · RSS {hl.rssMb}MB · HEAP {hl.heapMb}MB<br/>
          SWARM <b>{hl.swarm}</b> · DKG <b>{hl.dkg}</b> · CHAIN <b>{hl.chain.active?"on":"db-only"}</b> · ACTIVITY {hl.counts.activity}
        </div>
      )}
      {ov && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:0,border:"3px solid var(--ink)",marginBottom:16}}>
          {[["USERS",ov.users],["BALANCE",Math.round(ov.totalBalance).toLocaleString()],["STAKED",Math.round(ov.totalStaked).toLocaleString()],
            ["🔥 BURNED",Math.round(ov.totalBurned).toLocaleString()],["LICENSED",ov.licensed],["LICENSE $",Math.round(ov.licenseRevenue).toLocaleString()],
            ["SUBNETS",ov.subnets],["PROPOSALS",ov.proposals]].map(([l,v],i)=>(
            <div key={i} style={{padding:"10px 12px",borderRight:"3px solid var(--ink)",borderBottom:"3px solid var(--ink)"}}>
              <div className="mono" style={{fontSize:9,opacity:.6}}>{l}</div>
              <div className="anton" style={{fontSize:20}}>{v}</div>
            </div>
          ))}
        </div>
      )}
      <div className="feed">
        <div className="fh"><span>⚖ VERIFIER QUEUE · PENDING INSIGHTS</span><span>{pending.length}</span></div>
        {pending.map((i)=>(
          <div className="row" key={i.id}>
            <span>#{i.id} {i.prompt.slice(0,40)}…</span>
            <span style={{display:"flex",gap:6}}>
              <button className="btn" style={{padding:"5px 10px",fontSize:10,background:"var(--green)",borderColor:"var(--green)"}} onClick={()=>verify(i.id,true)}>✓</button>
              <button className="btn" style={{padding:"5px 10px",fontSize:10,background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>verify(i.id,false)}>✕</button>
            </span>
          </div>
        ))}
        {pending.length===0 && <div className="row"><span style={{opacity:.6}}>Queue empty.</span></div>}
      </div>

      <div className="feed" style={{marginTop:14}}>
        <div className="fh"><span>💎 OPEN BONDS · AWARD</span><span>{bonds.length}</span></div>
        {bonds.map((b)=>(
          <div className="row" key={b.id}>
            <span>#{b.id} {b.title.slice(0,34)}… <b className="mono" style={{color:"var(--green)"}}>${b.reward.toLocaleString()}</b></span>
            <button className="btn ghost" style={{padding:"5px 10px",fontSize:10}} onClick={()=>award(b.id)}>AWARD→ME</button>
          </div>
        ))}
        {bonds.length===0 && <div className="row"><span style={{opacity:.6}}>No open bonds.</span></div>}
      </div>

      <div className="feed" style={{marginTop:14}}>
        <div className="fh"><span>🎲 OPEN MARKETS · SETTLE</span><span>{markets.length}</span></div>
        {markets.map((m)=>(
          <div className="row" key={m.insight_id}>
            <span>INSIGHT #{m.insight_id} · POOL {Math.round(m.pool)} · {m.bets} BETS</span>
            <span style={{display:"flex",gap:6}}>
              <button className="btn" style={{padding:"5px 10px",fontSize:10}} onClick={()=>settle(m.insight_id,"yes")}>YES</button>
              <button className="btn ghost" style={{padding:"5px 10px",fontSize:10}} onClick={()=>settle(m.insight_id,"no")}>NO</button>
            </span>
          </div>
        ))}
        {markets.length===0 && <div className="row"><span style={{opacity:.6}}>No open markets.</span></div>}
      </div>

      <div className="feed" style={{marginTop:14}}>
        <div className="fh"><span>🔐 MULTI-SIG TREASURY (M-of-N)</span>
          <button className="btn" style={{padding:"4px 8px",fontSize:9}} onClick={async()=>{ await api.proposeAction({kind:"burn",amount:1000,detail:"manual burn",proposer:address,threshold:2}); api.treasuryActions().then(setActs); notify("Burn action proposed (needs 2 approvals)"); }}>+ PROPOSE BURN</button>
        </div>
        {acts.map((a)=>(
          <div className="row" key={a.id}>
            <span><b className="mono" style={{color:"var(--red)"}}>{a.kind.toUpperCase()}</b> {a.amount?Math.round(a.amount).toLocaleString():""} · {a.approvals.length}/{a.threshold} · {a.status}</span>
            {a.status==="pending" && <button className="btn ghost" style={{padding:"5px 10px",fontSize:10}} onClick={async()=>{ const r=await api.approveAction(a.id,address); notify(r.executed?"Executed!":`Approved ${r.approvals}/${r.threshold}`); api.treasuryActions().then(setActs); }}>APPROVE</button>}
          </div>
        ))}
        {acts.length===0 && <div className="row"><span style={{opacity:.6}}>No treasury actions.</span></div>}
      </div>

      <div className="feed" style={{marginTop:14}}>
        <div className="fh"><span>📋 AUDIT LOG</span><span>{audit.length}</span></div>
        {audit.map((a)=>(
          <div className="row" key={a.id}>
            <span><b className="mono" style={{color:"var(--blue)"}}>{a.action.toUpperCase()}</b> {a.detail}</span>
            <b className="mono" style={{fontSize:10,opacity:.5}}>{new Date(a.ts).toLocaleTimeString()}</b>
          </div>
        ))}
        {audit.length===0 && <div className="row"><span style={{opacity:.6}}>No actions logged.</span></div>}
      </div>
    </div>
  );
}
