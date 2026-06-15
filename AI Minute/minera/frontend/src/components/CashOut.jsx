import { useState } from "react";
import { PRICE_USD, TOKEN } from "../brand.js";
export default function CashOut({ balance, onWithdraw, notify }){
  const [amt,setAmt]=useState(1000);
  const capped=Math.min(amt,balance);
  const recv=(capped*PRICE_USD*0.985);
  function go(){
    if(capped<=0) return notify("Enter an amount");
    onWithdraw(capped);
    notify(`Withdrawal of ${capped.toFixed(2)} ${TOKEN} queued`);
  }
  return (
    <div className="cashout">
      <div className="balbox" style={{textAlign:"center"}}>
        <div className="l">AVAILABLE</div>
        <div className="amt">{balance.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
        <div className="usd">≈ ${(balance*PRICE_USD).toFixed(2)} USD</div>
      </div>
      <label>WITHDRAW AMOUNT ({TOKEN})</label>
      <input type="number" value={amt} min="0" max={balance} onChange={(e)=>setAmt(+e.target.value||0)} />
      <div className="recv">YOU RECEIVE APPROX.<b>${recv.toFixed(2)}</b></div>
      <div className="mono" style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700}}>
        <span>FEE 1.5%</span><span>ETA 1–2 BIZ DAYS</span>
      </div>
      <button className="btn" style={{width:"100%",marginTop:16,justifyContent:"center"}} onClick={go}>► WITHDRAW TO BANK</button>
    </div>
  );
}
