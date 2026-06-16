import { useState, useEffect } from "react";
import { api } from "../api.js";
import ConnectWallet from "./ConnectWallet.jsx";
import AnimatedNumber from "./AnimatedNumber.jsx";
import Checklist from "./Checklist.jsx";
import Tip from "./Tip.jsx";
import { TOKEN, PRICE_USD } from "../brand.js";

export default function Dashboard({ balance, miners, toggleMiner, insights, address, notify, onChange }) {
  const [badges, setBadges] = useState([]);
  const [faucet, setFaucet] = useState(null);
  useEffect(()=>{ if(address){ api.achievements(address).then(setBadges).catch(()=>{}); api.faucet(address).then(setFaucet).catch(()=>{}); } },[address,insights.length]);
  async function claim(){ try{ await api.claimFaucet(address); notify&&notify("Claimed 25 MINE from faucet"); onChange&&onChange(); api.faucet(address).then(setFaucet); }catch{ notify&&notify("Already claimed today"); } }
  return (
    <div>
      <div className="balbox">
        <div className="l">YOUR <Tip text="MINE is the network token. It gets scarcer over time as fees buy and burn it.">BALANCE</Tip></div>
        <div className="amt"><AnimatedNumber value={balance}/> {TOKEN}</div>
        <div className="usd">≈ ${(balance*PRICE_USD).toFixed(2)} USD</div>
        <div className="sub"><span>PRICE <b>${PRICE_USD}</b></span><span>ROLES ACTIVE <b>{Object.values(miners).filter(Boolean).length}/4</b></span></div>
      </div>
      <ConnectWallet notify={notify}/>
      <Checklist address={address} insights={insights} balance={balance}/>
      {badges.length>0 && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          {badges.map((b)=>(<span key={b.code} className="mono" style={{fontSize:11,fontWeight:700,border:"3px solid var(--ink)",padding:"6px 10px",background:"var(--paper2)"}}>{b.name}</span>))}
        </div>
      )}
      {faucet && (
        <button className="btn" style={{width:"100%",marginBottom:14,justifyContent:"center",opacity:faucet.canClaim?1:.5}}
          disabled={!faucet.canClaim} onClick={claim}>
          {faucet.canClaim ? "🚰 CLAIM DAILY FAUCET (+25 MINE)" : "🚰 FAUCET CLAIMED · COME BACK TOMORROW"}
        </button>
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
