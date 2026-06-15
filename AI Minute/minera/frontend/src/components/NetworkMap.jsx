import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

export default function NetworkMap() {
  const cv = useRef(null);
  const [stats, setStats] = useState({ nodes: 60, insights: 0 });
  useEffect(()=>{ let on=true;
    const load=()=>api.stats().then(s=>on&&setStats({nodes:Math.min(120,Math.round(s.nodesOnline/40)),insights:s.insights})).catch(()=>{});
    load(); const t=setInterval(load,6000); return ()=>{on=false;clearInterval(t);};
  },[]);
  useEffect(()=>{
    const c=cv.current, x=c.getContext("2d"); let W,H,nodes=[],t=0,raf;
    function size(){ W=c.width=c.offsetWidth; H=c.height=c.offsetHeight; build(); }
    function build(){ nodes=[]; const n=stats.nodes||60;
      for(let i=0;i<n;i++) nodes.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*2+1,p:Math.random()*6.28,pulse:Math.random()<.1}); }
    function css(v){ return getComputedStyle(document.body).getPropertyValue(v).trim(); }
    function loop(){
      const ink=css("--ink"),blue=css("--blue"),red=css("--red");
      x.clearRect(0,0,W,H); t+=.012;
      for(let i=0;i<nodes.length;i++){ const a=nodes[i]; a.x+=a.vx;a.y+=a.vy;
        if(a.x<0||a.x>W)a.vx*=-1; if(a.y<0||a.y>H)a.vy*=-1;
        for(let j=i+1;j<nodes.length;j++){ const b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);
          if(d<110){ x.globalAlpha=(1-d/110)*.4; x.strokeStyle=blue; x.lineWidth=1;
            x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke(); } } }
      x.globalAlpha=1;
      for(const a of nodes){ const pl=a.pulse?(Math.sin(t*3+a.p)+1)/2:0;
        x.beginPath(); x.arc(a.x,a.y,a.r+pl*2,0,6.28);
        x.fillStyle=a.pulse?red:blue; x.fill(); }
      raf=requestAnimationFrame(loop);
    }
    size(); loop();
    const ro=()=>size(); window.addEventListener("resize",ro);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",ro); };
  },[stats.nodes]);
  return (
    <div>
      <p className="mono" style={{fontSize:12,fontWeight:700,marginBottom:10,color:"var(--blue)"}}>
        LIVE SWARM · ~{(stats.nodes*40).toLocaleString()} NODES · {stats.insights} INSIGHTS · 🔴 = ACTIVE MINER
      </p>
      <div style={{border:"3px solid var(--ink)",background:"var(--paper2)"}}>
        <canvas ref={cv} style={{width:"100%",height:420,display:"block"}}/>
      </div>
    </div>
  );
}
