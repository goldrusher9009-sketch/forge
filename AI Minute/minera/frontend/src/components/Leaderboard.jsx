import { useEffect, useState , memo} from "react";
import { api } from "../api.js";
import { Skeleton } from "./States.jsx";
import { TOKEN } from "../brand.js";
function Leaderboard({ notify }){
  const [rows,setRows]=useState([]);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{ api.leaderboard().then((d)=>{setRows(d);setLoaded(true);}).catch(()=>{setLoaded(true);}); },[]);
  return (
    <div className="feed">
      <div className="fh"><span>🏆 TOP OPERATORS</span><span>BY BALANCE</span></div>
      {!loaded && <Skeleton rows={5}/>}
      {rows.map((u)=>(
        <div className="row" key={u.address}>
          <span><b className="mono" style={{color:"var(--red)"}}>#{u.rank}</b> {u.handle} <span style={{opacity:.5,fontSize:11}}>{u.address}</span></span>
          <b className="mono" style={{color:"var(--green)"}}>{u.balance.toLocaleString(undefined,{maximumFractionDigits:0})} {TOKEN}</b>
        </div>
      ))}
      {rows.length===0 && <div className="row"><span style={{opacity:.6}}>Be the first on the board — start mining!</span></div>}
    </div>
  );
}
export default memo(Leaderboard);
