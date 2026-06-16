export default function Toasts({ items }) {
  return (
    <div style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",zIndex:120,display:"flex",flexDirection:"column",gap:8,alignItems:"center",width:"min(92vw,420px)"}}>
      {items.map((t)=>(
        <div key={t.id} style={{
          background:"var(--ink)",color:"var(--paper)",fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,
          padding:"11px 16px",border:`3px solid ${t.kind==="error"?"var(--red)":t.kind==="success"?"var(--green)":"var(--blue)"}`,
          width:"100%",animation:"toastin .2s ease",boxShadow:"4px 4px 0 rgba(20,17,12,.4)"}}>
          {t.kind==="error"?"⚠ ":t.kind==="success"?"✓ ":"› "}{t.msg}
        </div>
      ))}
      <style>{`@keyframes toastin{from{opacity:0;transform:translateY(8px)}to{opacity:1}}@media(prefers-reduced-motion:reduce){[style*=toastin]{animation:none}}`}</style>
    </div>
  );
}
