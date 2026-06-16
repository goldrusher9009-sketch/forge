import { useEffect, useState, useRef } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { api } from "./api.js";
import { BRAND } from "./brand.js";
import { t, setLang, getLang, LANGS } from "./i18n.js";
import StatsBanner from "./components/StatsBanner.jsx";
import LiveTicker from "./components/LiveTicker.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Explorer from "./components/Explorer.jsx";
import DataUpload from "./components/DataUpload.jsx";
import Roles from "./components/Roles.jsx";
import Bonds from "./components/Bonds.jsx";
import Market from "./components/Market.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Wallet from "./components/Wallet.jsx";
import CashOut from "./components/CashOut.jsx";
import Admin from "./components/Admin.jsx";
import Bell from "./components/Bell.jsx";
import Analytics from "./components/Analytics.jsx";
import Subnets from "./components/Subnets.jsx";
import Settings from "./components/Settings.jsx";
import Govern from "./components/Govern.jsx";
import Stake from "./components/Stake.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Search from "./components/Search.jsx";
import Help from "./components/Help.jsx";
import Profile from "./components/Profile.jsx";
import Activity from "./components/Activity.jsx";
import NetworkMap from "./components/NetworkMap.jsx";
import Treasury from "./components/Treasury.jsx";
import News from "./components/News.jsx";
import Faq from "./components/Faq.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import Toasts from "./components/Toasts.jsx";
import { setSound, getSound, blip } from "./sound.js";

const TABS = [
  ["dash","▦ DASH"],["explore","💡 EXPLORE"],["market","◆ MARKET"],["bonds","💎 BONDS"],
  ["data","📡 DATA"],["roles","◎ ROLES"],["board","🏆 BOARD"],["activity","🌐 ACTIVITY"],["map","🛰 MAP"],["wallet","📜 WALLET"],["cash","$ CASH"],["subnets","🌐 SUBNETS"],["stats","📊 STATS"],["treasury","🏦 TREASURY"],["stake","🔒 STAKE"],["govern","🗳 GOVERN"],["keys","🔑 API"],["profile","👤 PROFILE"],["news","📰 NEWS"],["faq","❓ FAQ"],["admin","⚙ ADMIN"],
];

export default function App() {
  const { user, offline, signIn, signOut, setBalance } = useAuth();
  const [tab, setTabRaw] = useState(() => (location.hash||"").replace("#","") || "dash");
  function setTab(t){ setTabRaw(t); if(location.hash!=="#"+t) location.hash = t; }
  useEffect(()=>{ const onHash=()=>{ const h=(location.hash||"").replace("#",""); if(h) setTabRaw(h); };
    window.addEventListener("hashchange",onHash); return ()=>window.removeEventListener("hashchange",onHash); },[]);
  const [miners, setMiners] = useState({ compute:true, explore:false, data:true, validate:true });
  const [insights, setInsights] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastT = useRef(); const accrued = useRef(0);
  const [theme, setTheme] = useState("light");
  const [onboard, setOnboard] = useState(false);
  const [online, setOnline] = useState(0);
  const [lang, setLangState] = useState(getLang());
  const [help, setHelp] = useState(false);
  const [palette, setPalette] = useState(false);
  const [sound, setSoundState] = useState(false);
  const [preset, setPreset] = useState("blueprint");
  useEffect(()=>{ if(preset==="blueprint") delete document.body.dataset.preset; else document.body.dataset.preset = preset; },[preset]);
  useEffect(()=>{ document.body.dataset.theme = theme; },[theme]);
  function notify(m, kind){ const id=Date.now()+Math.random();
    if(kind==="error") blip.error(); else if(/claim|faucet/i.test(m)) blip.claim(); else if(/\+|earn|verified|reward/i.test(m)) blip.earn();
    setToasts((t)=>[...t,{id,msg:m,kind}].slice(-4));
    setTimeout(()=>setToasts((t)=>t.filter(x=>x.id!==id)),2800); }
  const balance = user?.balance ?? 0;

  useEffect(()=>{ if(user){ api.insights().then(setInsights).catch(()=>{}); setOnboard(true);} },[user]);
  useEffect(()=>{ if(!user) return;
    const beat=()=>{ api.heartbeat(user.address).catch(()=>{}); api.presence().then(p=>setOnline(p.total)).catch(()=>{}); };
    beat(); const t=setInterval(beat,15000); return ()=>clearInterval(t); },[user]);
  useEffect(()=>{
    if(!user) return;
    const tick=setInterval(()=>{ const rate=(miners.compute?0.02:0)+(miners.data?0.004:0)+(miners.validate?0.01:0);
      if(rate){ accrued.current+=rate; setBalance(balance+accrued.current); } },1000);
    const flush=setInterval(()=>{ if(accrued.current>0 && !offline && user.address){ const a=accrued.current; accrued.current=0;
      api.credit(user.address,a).then(r=>setBalance(r.balance)).catch(()=>{}); } },5000);
    return ()=>{ clearInterval(tick); clearInterval(flush); };
  },[user,miners,offline,balance,setBalance]);

  useEffect(()=>{
    if(!user) return;
    const onKey=(e)=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); setPalette(true); return; }
      if(e.key==="?"){ setHelp(true); return; }
      if(e.key==="Escape"){ setHelp(false); return; }
      const n=parseInt(e.key,10);
      if(n>=1 && n<=TABS.length){ setTab(TABS[n-1][0]); }
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[user]);
  function toggleMiner(k){ setMiners(m=>({...m,[k]:!m[k]})); }
  function onInsight(ins){ setInsights(l=>[ins,...l]);
    if(ins.balance!=null) setBalance(ins.balance); else if(ins.reward) setBalance(balance+ins.reward); }
  async function refreshBalance(){ if(!offline && user?.address){ try{ const u=await api.user(user.address); setBalance(u.balance);}catch{} } }
  async function onWithdraw(amount){ if(offline||!user.address){ setBalance(balance-amount); return; }
    try{ const r=await api.withdraw(user.address,amount); setBalance(r.balance);}catch{ notify("Withdraw failed"); } }

  if(!user){
    return (<div className="app"><div className="signin">
      <h1>{BRAND.slice(0,4)}<span className="o">{BRAND.slice(4)}</span></h1>
      <p>{t("tagline")}</p>
      <button className="btn" onClick={()=>signIn("scott@minera.ai")}>► {t("signin")}</button>
      <div className="mono" style={{fontSize:11,opacity:.7}}>🔒 {t("wallet_note")}</div>
          <div style={{display:"flex",gap:6,marginTop:14}}>{LANGS.map(l=>(<button key={l} onClick={()=>{setLang(l);setLangState(l);}} className="mono" style={{border:"2px solid var(--ink)",background:l===lang?"var(--ink)":"transparent",color:l===lang?"var(--paper)":"var(--ink)",padding:"4px 10px",fontWeight:700,fontSize:11,cursor:"pointer"}}>{l.toUpperCase()}</button>))}</div>
    </div></div>);
  }

  return (
    <div className="app">
      <div className="tb">
        <div><span className="sq"></span>{BRAND.toUpperCase()} // OPERATOR TERMINAL{offline && " · OFFLINE (demo mode)"}{online>0 && ` · ${online.toLocaleString()} ONLINE`}</div>
        <div className="u"><Search onGo={setTab}/><button aria-label="Toggle sound" onClick={()=>{ const v=!sound; setSoundState(v); setSound(v); if(v) blip.earn(); }} style={{background:"transparent",border:"none",color:"var(--paper)",cursor:"pointer",fontSize:15}}>{sound?"🔊":"🔇"}</button><button aria-label="Toggle theme" onClick={()=>setTheme(t=>t==="light"?"dark":"light")} style={{background:"transparent",border:"none",color:"var(--paper)",cursor:"pointer",fontSize:15}}>{theme==="light"?"🌙":"☀️"}</button><Bell address={user.address}/><span>{user.address}</span><button onClick={signOut}>{t("signout")}</button></div>
      </div>
      <StatsBanner/>
      <LiveTicker/>
      <div className="tabs">
        {TABS.map(([k,l])=>(<button key={k} className={tab===k?"on":""} onClick={()=>{setTab(k); if(["wallet","board"].includes(k)) refreshBalance();}}>{l}</button>))}
      </div>
      <div className="panel">
        {tab==="dash" && <Dashboard balance={balance} miners={miners} toggleMiner={toggleMiner} insights={insights} address={user.address} notify={notify} onChange={refreshBalance}/>}
        {tab==="explore" && <Explorer address={user.address} onInsight={onInsight} notify={notify}/>}
        {tab==="market" && <Market address={user.address} onBalance={refreshBalance} notify={(m)=>{notify(m); refreshBalance();}}/>}
        {tab==="bonds" && <Bonds address={user.address} notify={(m)=>{notify(m); refreshBalance();}}/>}
        {tab==="data" && <DataUpload notify={notify}/>}
        {tab==="roles" && <Roles notify={notify}/>}
        {tab==="board" && <Leaderboard notify={notify}/>}
        {tab==="activity" && <Activity notify={notify}/>}
        {tab==="map" && <NetworkMap/>}
        {tab==="wallet" && <Wallet address={user.address} balance={balance}/>}
        {tab==="cash" && <CashOut balance={balance} onWithdraw={onWithdraw} notify={notify}/>}
        {tab==="subnets" && <Subnets address={user.address} notify={(m)=>{notify(m); refreshBalance();}}/>}
        {tab==="stats" && <Analytics notify={notify}/>}
        {tab==="treasury" && <Treasury notify={notify}/>}
        {tab==="stake" && <Stake address={user.address} balance={balance} onChange={refreshBalance} notify={(m)=>{notify(m);refreshBalance();}}/>}
        {tab==="govern" && <Govern address={user.address} notify={notify}/>}
        {tab==="keys" && <Settings address={user.address} notify={notify}/>}
        {tab==="profile" && <Profile address={user.address} notify={notify}/>}
        {tab==="news" && <News/>}
        {tab==="faq" && <Faq/>}
        {tab==="admin" && <Admin address={user.address} notify={(m)=>{notify(m); refreshBalance();}}/>}
      </div>
      <Toasts items={toasts}/>
      {onboard && <Onboarding onClose={()=>setOnboard(false)}/>}
      {help && <Help tabs={TABS} onClose={()=>setHelp(false)}/>}
      {palette && <CommandPalette onClose={()=>setPalette(false)} commands={[
        ...TABS.map(([k,l])=>({label:"Go to "+l.replace(/^[^ ]+ /,""),hint:k,run:()=>setTab(k)})),
        {label:"Toggle theme",hint:"theme",run:()=>setTheme(t=>t==="light"?"dark":"light")},
        {label:"Sign out",hint:"auth",run:signOut},
        {label:"Open help",hint:"?",run:()=>setHelp(true)},
      ]}/>}
    </div>
  );
}
