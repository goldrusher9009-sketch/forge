// Tiny WebAudio blips. Off by default; respects reduced-motion.
let on = false;
let ctx = null;
export function setSound(v){ on = v; }
export function getSound(){ return on; }
function tone(freq, dur=0.08, type="sine") {
  if (!on) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch {}
}
export const blip = {
  earn: () => tone(660, 0.1),
  claim: () => { tone(523); setTimeout(()=>tone(784,0.12),80); },
  burn: () => tone(180, 0.18, "sawtooth"),
  error: () => tone(140, 0.15, "square"),
};
