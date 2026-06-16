import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function DataUpload({ notify }) {
  const [files, setFiles] = useState([]);
  const [name, setName] = useState("");
  useEffect(() => { api.dataList().then(setFiles).catch(() => {}); }, []);

  function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    api.uploadData(f.name, f.size)
      .then((rec) => { setFiles((l) => [rec, ...l]); notify(`Pinned ${f.name} → IPFS (${rec.cid})`); })
      .catch(() => notify("Upload failed — backend offline?"));
    e.target.value = "";
  }
  function addManual() {
    if (!name.trim()) return;
    api.uploadData(name, 0).then((rec) => { setFiles((l)=>[rec,...l]); setName(""); notify(`Registered ${rec.name}`); })
      .catch(() => notify("Backend offline"));
  }

  return (
    <div>
      <p className="mono" style={{fontSize:12,fontWeight:700,marginBottom:10,color:"var(--blue)"}}>
        UPLOAD A DATASET → PINNED TO IPFS → EARNS ROYALTIES WHEN IT SHAPES A DISCOVERY
      </p>
      <label className="btn" style={{display:"inline-block",cursor:"pointer"}}>
        ＋ CHOOSE FILE<input type="file" onChange={pick} style={{display:"none"}}/>
      </label>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="…or type a dataset name"
          style={{flex:1,border:"3px solid var(--ink)",background:"var(--paper)",padding:10,fontFamily:"'Space Mono',monospace"}}/>
        <button className="btn ghost" onClick={addManual}>REGISTER</button>
      </div>
      <div className="feed" style={{marginTop:16}}>
        <div className="fh"><span>📡 YOUR STAKED DATA</span><span>{files.length} FILES</span></div>
        {files.map((f)=>(
          <div className="row" key={f.id}>
            <span>📄 {f.name}</span>
            <b style={{color:"var(--blue)",fontSize:11}}>{f.cid}</b>
          </div>
        ))}
        {files.length===0 && <div className="row"><span style={{opacity:.6}}>No datasets staked yet — upload one to start earning royalties.</span></div>}
      </div>
    </div>
  );
}
