import { useEffect, useState , memo} from "react";
import { api } from "../api.js";
import { Empty, Skeleton } from "./States.jsx";

function Market({ address, onBalance, notify }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const load = () => api.market().then((d)=>{setItems(d);setLoaded(true);}).catch(() => { setLoaded(true); notify("Backend offline"); });
  useEffect(() => { load(); }, []);

  async function license(id) {
    try { const r = await api.license(id, "DemoBuyer", address);
      notify(`Licensed for $${r.amount.toLocaleString()} — submitter +$${r.split.submitter.toLocaleString()}, 5% burned`);
      load();
    } catch { notify("License failed"); }
  }
  async function bet(id, side) {
    try { await api.predict(id, address, side, 10);
      notify(`Staked 10 MINE ${side.toUpperCase()} on #${id}`);
    } catch { notify("Stake failed — balance?"); }
  }
  return (
    <div>
      <p className="mono" style={{fontSize:12,fontWeight:700,marginBottom:12,color:"var(--blue)"}}>
        VERIFIED INSIGHTS FOR LICENSE · 40/35/20/5 SPLIT · 5% BURNED
      </p>
      {!loaded && <Skeleton rows={3}/>}
      {items.map((i)=>(
        <div className="bondc" key={i.id}>
          <div className="cat">◆ ASSET #{i.id} {i.licensed && "· LICENSED"}</div>
          <h4>{i.prompt}</h4>
          <div className="st" style={{marginBottom:10}}>
            <span className="rw">${i.priceUsd.toLocaleString()}</span>
            <span>CONF {(i.confidence*100||50).toFixed(0)}%</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn" disabled={i.licensed} onClick={()=>license(i.id)}>{i.licensed?"LICENSED":"► LICENSE"}</button>
            <button className="btn ghost" onClick={()=>bet(i.id,"yes")}>▲ PREDICT YES (10)</button>
            <button className="btn ghost" onClick={()=>bet(i.id,"no")}>▼ PREDICT NO (10)</button>
          </div>
        </div>
      ))}
      {items.length===0 && <Empty icon="◆" label="No verified assets to license yet"/>}
    </div>
  );
}
export default memo(Market);
