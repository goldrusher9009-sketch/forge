import { useEffect, useState } from "react";
import { api, download } from "../api.js";
import { TOKEN, PRICE_USD } from "../brand.js";

const TYPES = ["all","mining","insight","license","stake","predict","withdraw","referral"];

export default function Wallet({ address, balance }) {
  const [type, setType] = useState("all");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  function load(t, off, append) {
    api.transactions(address, t==="all"?null:t, off).then((d)=>{
      setRows((prev)=> append ? [...prev, ...d.rows] : d.rows);
      setTotal(d.total);
    }).catch(()=>{});
  }
  useEffect(()=>{ setOffset(0); load(type, 0, false); },[type,balance]);

  return (
    <div>
      <div className="balbox">
        <div className="l">WALLET · {address}</div>
        <div className="amt">{balance.toLocaleString(undefined,{maximumFractionDigits:2})} {TOKEN}</div>
        <div className="usd">≈ ${(balance*PRICE_USD).toFixed(2)} USD</div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <button className="btn ghost" style={{fontSize:11,padding:"8px 12px"}} onClick={()=>download(`/api/export/transactions/${address}`,"transactions.csv")}>⬇ CSV</button>
        <button className="btn ghost" style={{fontSize:11,padding:"8px 12px"}} onClick={()=>download(`/api/export/transactions/${address}?format=json`,"transactions.json")}>⬇ JSON</button>
      </div>
      <div className="filterbar" style={{marginBottom:12}}>
        {TYPES.map((x)=>(<button key={x} className={type===x?"on":""} onClick={()=>setType(x)}>{x.toUpperCase()}</button>))}
      </div>
      <div className="feed">
        <div className="fh"><span>📜 LEDGER</span><span>{rows.length}/{total}</span></div>
        {rows.map((t)=>(
          <div className="row" key={t.id}>
            <span><b className="mono" style={{color:"var(--blue)"}}>{t.type.toUpperCase()}</b> {t.note}</span>
            <b className="mono" style={{color:t.amount>=0?"var(--green)":"var(--red)"}}>{t.amount>=0?"+":""}{t.amount.toFixed(2)}</b>
          </div>
        ))}
        {rows.length===0 && <div className="row"><span style={{opacity:.6}}>No transactions.</span></div>}
      </div>
      {rows.length<total && (
        <button className="btn ghost" style={{marginTop:12,width:"100%",justifyContent:"center"}}
          onClick={()=>{ const o=offset+25; setOffset(o); load(type,o,true); }}>LOAD MORE ({total-rows.length})</button>
      )}
    </div>
  );
}
