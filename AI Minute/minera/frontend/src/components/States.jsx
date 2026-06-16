// Reusable loading / empty / error states for consistent UX.
export function Loading({ label = "Loading…" }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"24px 4px",color:"var(--ink)",opacity:.7,fontFamily:"'Space Mono',monospace",fontSize:13}}>
      <span className="mn-spin" style={{width:16,height:16,border:"3px solid var(--ink)",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block"}}/>
      {label}
      <style>{`@keyframes mnspin{to{transform:rotate(360deg)}}.mn-spin{animation:mnspin .8s linear infinite}@media(prefers-reduced-motion:reduce){.mn-spin{animation:none}}`}</style>
    </div>
  );
}
export function Empty({ icon = "—", label = "Nothing here yet." }) {
  return (
    <div style={{textAlign:"center",padding:"30px 16px",border:"3px dashed var(--ink)",color:"var(--ink)",opacity:.7}}>
      <div style={{fontSize:30,marginBottom:8}}>{icon}</div>
      <div className="mono" style={{fontSize:12,fontWeight:700}}>{label}</div>
    </div>
  );
}
export function ErrorState({ label = "Couldn't load this.", onRetry }) {
  return (
    <div style={{padding:"20px 16px",border:"3px solid var(--red)",background:"var(--paper2)"}}>
      <div className="mono" style={{fontSize:12,fontWeight:700,color:"var(--red)",marginBottom:onRetry?10:0}}>⚠ {label}</div>
      {onRetry && <button className="btn ghost" style={{fontSize:11,padding:"7px 12px"}} onClick={onRetry}>RETRY</button>}
    </div>
  );
}

export function Skeleton({ rows = 4 }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",border:"3px solid var(--ink)",marginBottom:8,opacity:.5}}>
          <span className="mn-sk" style={{height:12,width:`${50+(i%3)*12}%`,background:"var(--ink)",opacity:.18,display:"block"}}/>
          <span className="mn-sk" style={{height:12,width:60,background:"var(--ink)",opacity:.18,display:"block"}}/>
        </div>
      ))}
      <style>{`@keyframes mnsk{0%,100%{opacity:.12}50%{opacity:.28}}.mn-sk{animation:mnsk 1.2s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.mn-sk{animation:none}}`}</style>
    </div>
  );
}
