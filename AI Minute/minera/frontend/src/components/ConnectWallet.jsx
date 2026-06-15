import { useState } from "react";
import { hasWallet, connectWallet, onchainBalance } from "../wallet.js";
export default function ConnectWallet({ notify }) {
  const [addr, setAddr] = useState(null);
  const [bal, setBal] = useState(null);
  async function go() {
    try {
      const a = await connectWallet(); setAddr(a);
      const b = await onchainBalance(a); setBal(b);
      notify && notify(b==null ? "Connected (no on-chain token configured)" : `On-chain: ${b} MINE`);
    } catch (e) { notify && notify(e.message); }
  }
  if (!hasWallet()) {
    return <div className="mono" style={{fontSize:11,opacity:.6,border:"3px dashed var(--ink)",padding:12,marginBottom:14}}>
      🦊 No browser wallet detected. Install MetaMask to connect on-chain (optional — the app works fully without it).
    </div>;
  }
  return (
    <div style={{border:"3px solid var(--ink)",padding:12,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div className="mono" style={{fontSize:12,fontWeight:700}}>
        {addr ? `🦊 ${addr.slice(0,6)}…${addr.slice(-4)}${bal!=null?` · ${bal} MINE on-chain`:""}` : "🦊 Connect a wallet for on-chain mode"}
      </div>
      <button className="btn" style={{padding:"8px 14px",fontSize:12}} onClick={go}>{addr?"REFRESH":"CONNECT WALLET"}</button>
    </div>
  );
}
