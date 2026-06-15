export default function Help({ tabs, onClose }) {
  return (
    <div className="mbg show" onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="mw" style={{maxWidth:420}}>
        <div className="mh"><span>KEYBOARD SHORTCUTS</span><button className="x" onClick={onClose}>✕</button></div>
        <div className="mc">
          <div className="mono" style={{fontSize:13}}>
            {tabs.map(([k,l],i)=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"2px dashed var(--ink)"}}>
                <span>{l}</span><b style={{background:"var(--ink)",color:"var(--paper)",padding:"2px 8px"}}>{i+1<10?i+1:""}</b>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"2px dashed var(--ink)"}}><span>Help</span><b style={{background:"var(--ink)",color:"var(--paper)",padding:"2px 8px"}}>?</b></div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}><span>Close</span><b style={{background:"var(--ink)",color:"var(--paper)",padding:"2px 8px"}}>esc</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
