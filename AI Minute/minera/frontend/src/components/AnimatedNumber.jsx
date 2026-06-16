import { useEffect, useRef, useState } from "react";
export default function AnimatedNumber({ value, decimals = 2, duration = 500 }) {
  const [disp, setDisp] = useState(value);
  const from = useRef(value);
  useEffect(()=>{
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setDisp(value); return; }
    const start = performance.now(), a = from.current, b = value;
    let raf;
    const tick = (t)=>{ const p = Math.min((t-start)/duration,1);
      setDisp(a + (b-a)*(1-Math.pow(1-p,3)));
      if(p<1) raf=requestAnimationFrame(tick); else from.current=b; };
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[value,duration]);
  return <>{disp.toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}</>;
}
