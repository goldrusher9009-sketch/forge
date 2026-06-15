import { useState, useEffect } from "react";
import { api } from "../api.js";
import { TOKEN, PRICE_USD } from "../brand.js";

export default function Dashboard({ balance, miners, toggleMiner, insights, address }) {
  const [badges, setBadges] = useState([]);
  useEffect(()=>{ if(address) api.achievements(address).then(setBadges).catch(()=>{}); },[address,insights.length]);
  return (
    <div>
      <div className="balbox">
        <div className="l">YOUR BALANCE</div>
        <div className="amt">{balance.toLocaleString(undefined,{maximumFractionDigits:2})} {TOKEN}</div>
        <div className="usd">≈ ${(balance*PRICE_USD).toFixed(2)} USD</div>
        <div className="sub"><span>PRICE <b>${PRICE_USD}</b></span><span>ROLES ACTIVE <b>{Object.values(miners).filter(Boolean).length}/4</b></span></div>
      </div>
      {badges.length>0 && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          {badges.map((b)=>(<span key={b.code} className="mono" style={{fontSize:11,fontWeight:700,border:"3px solid var(--ink)",padding:"6px 10px",background:"var(--paper2)"}}>{b.name}</span>))}
        </div>
      )}
      <div className="tiles">
        <MinerTile k="compute" label="🖥 COMPUTE" gain="+1.2/HR" on={miners.compute} toggle={toggleMiner}/>
        <MinerTile k="explore" label="💡 EXPLORE" gain="per insight" on={miners.explore} toggle={toggleMiner}/>
        <MinerTile k="data" label="📡 DATA" gain="+0.5" on={miners.data} toggle={toggleMiner}/>
        <MinerTile k="validate" label="⚖ VALIDATE" gain="+2.0" on={miners.validate} toggle={toggleMiner}/>
      </div>
      <div className="feed">
        <div className="fh"><span>🧠 RECENT DISCOVERIES</span><span style={{color:"var(--red)"}}>● LIVE</span></div>
        {insights.slice(0,6).map((i)=>(
          <div className="row" key={i.id}>
            <span>{i.status==="verified"?"✅":i.status==="rejected"?"✕":"⏳"} #{i.id} "{i.prompt.slice(0,42)}…"</span>
            <b style={{color:i.reward?"var(--green)":"var(--amber)"}}>{i.reward?`+${i.reward} ${TOKEN}`:i.status.toUpperCase()}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
function MinerTile({k,label,gain,on,toggle}){
  return (
    <div className={"atile"+(on?" on":"")}>
      <div className="th">{label}<span className={"stt "+(on?"live":"idle")}>{on?"● ACTIVE":"○ IDLE"}</span></div>
      <div className="g">{on?gain:"—"}</div>
      <button onClick={()=>toggle(k)}>{on?"STOP":"START"}</button>
    </div>
  );
}
