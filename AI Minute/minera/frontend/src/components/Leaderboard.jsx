import { useEffect, useState } from "react";
import { api } from "../api.js";
import { TOKEN } from "../brand.js";
export default function Leaderboard({ notify }){
  const [rows,setRows]=useState([]);
  useEffect(()=>{ api.leaderboard().then(setRows).catch(()=>notify&&notify("Backend offline")); },[]);
  return (
    <div className="feed">
      <div className="fh"><span>🏆 TOP OPERATORS</span><span>BY BALANCE</span></div>
      {rows.map((u)=>(
        <div className="row" key={u.address}>
          <span><b className="mono" style={{color:"var(--red)"}}>#{u.rank}</b> {u.handle} <span style={{opacity:.5,fontSize:11}}>{u.address}</span></span>
          <b className="mono" style={{color:"var(--green)"}}>{u.balance.toLocaleString(undefined,{maximumFractionDigits:0})} {TOKEN}</b>
        </div>
      ))}
      {rows.length===0 && <div className="row"><span style={{opacity:.6}}>No operators yet.</span></div>}
    </div>
  );
}
