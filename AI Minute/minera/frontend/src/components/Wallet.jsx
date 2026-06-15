import { useEffect, useState } from "react";
import { api, download } from "../api.js";
import { TOKEN, PRICE_USD } from "../brand.js";
export default function Wallet({ address, balance }){
  const [tx,setTx]=useState([]);
  useEffect(()=>{ if(address) api.transactions(address).then(setTx).catch(()=>{}); },[address,balance]);
  return (
    <div>
      <div className="balbox">
        <div className="l">WALLET · {address}</div>
        <div className="amt">{balance.toLocaleString(undefined,{maximumFractionDigits:2})} {TOKEN}</div>
        <div className="usd">≈ ${(balance*PRICE_USD).toFixed(2)} USD</div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button className="btn ghost" style={{fontSize:11,padding:"8px 12px"}} onClick={()=>download(`/api/export/transactions/${address}`,"transactions.csv")}>⬇ CSV</button>
        <button className="btn ghost" style={{fontSize:11,padding:"8px 12px"}} onClick={()=>download(`/api/export/transactions/${address}?format=json`,"transactions.json")}>⬇ JSON</button>
      </div>
      <div className="feed">
        <div className="fh"><span>📜 TRANSACTION LEDGER</span><span>{tx.length}</span></div>
        {tx.map((t)=>(
          <div className="row" key={t.id}>
            <span><b className="mono" style={{color:"var(--blue)"}}>{t.type.toUpperCase()}</b> {t.note}</span>
            <b className="mono" style={{color:t.amount>=0?"var(--green)":"var(--red)"}}>{t.amount>=0?"+":""}{t.amount.toFixed(2)}</b>
          </div>
        ))}
        {tx.length===0 && <div className="row"><span style={{opacity:.6}}>No transactions yet.</span></div>}
      </div>
    </div>
  );
}
