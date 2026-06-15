'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

/* ── tiny hooks ── */
function useInView(ref: React.RefObject<Element>) {
  const [v, setV] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    if (r.top < window.innerHeight) { setV(true); return }
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.05 })
    o.observe(ref.current!)
    return () => o.disconnect()
  }, [ref])
  return v
}

function useTick(ms = 60) {
  const [t, setT] = useState(0)
  useEffect(() => { const id = setInterval(() => setT(p => p + 1), ms); return () => clearInterval(id) }, [ms])
  return t
}

/* ── live score counter ── */
function LiveCounter({ from, to, suffix = '' }: { from: number; to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(from)
  const inView = useInView(ref as React.RefObject<Element>)
  useEffect(() => {
    if (!inView) return
    let start: number
    const duration = 1400
    const raf = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [inView, from, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ── rings ── */
function Rings({ size = 200 }: { size?: number }) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)
  const tick = useTick(50)
  const cx = size / 2
  const rings = [
    { label: 'Sleep',     color: '#818CF8', base: 91, r: 86 },
    { label: 'Nutrition', color: '#34D399', base: 74, r: 68 },
    { label: 'Activity',  color: '#FB923C', base: 88, r: 50 },
    { label: 'Social',    color: '#F472B6', base: 62, r: 32 },
    { label: 'Wealth',    color: '#FACC15', base: 55, r: 15 },
  ]
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r
        const wobble = inView ? ring.base + Math.sin((tick + i * 20) * 0.03) * 2 : 0
        const dash = circ * wobble / 100
        return (
          <g key={ring.label}>
            <circle cx={cx} cy={cx} r={ring.r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={i === 0 ? 8 : 7} />
            <circle cx={cx} cy={cx} r={ring.r} fill="none" stroke={ring.color} strokeWidth={i === 0 ? 8 : 7}
              strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
              transform={`rotate(-90 ${cx} ${cx})`}
              style={{ transition: inView ? 'stroke-dasharray 0.3s ease' : 'none', filter: `drop-shadow(0 0 6px ${ring.color}66)` }}
            />
          </g>
        )
      })}
      <text x={cx} y={cx - 6} textAnchor="middle" fill="white" fontSize={size * 0.16} fontWeight="900" fontFamily="system-ui" style={{ filter: 'drop-shadow(0 0 12px #818CF8)' }}>847</text>
      <text x={cx} y={cx + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={size * 0.055} fontFamily="system-ui" fontWeight="700" letterSpacing="3">V·SCORE</text>
    </svg>
  )
}

/* ── live feed item ── */
const FEED = [
  { handle: 'atlas_burns', tier: '🟣', msg: 'Sleep ring closed 100% — 30 day streak. BioAge at 26.', score: 920, delta: '+12', color: '#818CF8' },
  { handle: 'zara_voss', tier: '🔵', msg: 'Staked 500pts on my BioAge market. YES at 71%. Paying off.', score: 847, delta: '+8', color: '#34D399' },
  { handle: 'cael_morse', tier: '🟢', msg: 'Twin just moved my standup to 9am. Sleep ring already climbing.', score: 634, delta: '+3', color: '#A78BFA' },
  { handle: 'nova_pierce', tier: '🟡', msg: '$NOVA up 22% this week. YouToken holders eating.', score: 771, delta: '+19', color: '#FACC15' },
  { handle: 'reed_cross', tier: '🟣', msg: 'Matched 94% ZK compatibility with someone. First date tmrw.', score: 891, delta: '+5', color: '#F472B6' },
]

function LiveFeed() {
  const [items, setItems] = useState(FEED)
  const [flash, setFlash] = useState(-1)
  useEffect(() => {
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * FEED.length)
      setFlash(idx)
      setTimeout(() => setFlash(-1), 600)
      setItems(prev => {
        const next = [...prev]
        next[idx] = { ...next[idx] }
        return next
      })
    }, 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map((item, i) => (
        <div key={item.handle} style={{
          padding: '14px 16px',
          background: flash === i ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${flash === i ? 'rgba(129,140,248,0.25)' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: 10,
          transition: 'all 0.3s ease',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${item.color}22`, border: `2px solid ${item.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{item.tier}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>@{item.handle}</span>
              <span style={{ fontSize: 11, color: '#34D399', fontFamily: 'monospace', fontWeight: 700 }}>{item.delta} pts</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>{item.msg}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── twin chat demo ── */
function TwinDemo() {
  const msgs = [
    { from: 'twin', text: 'Sleep down 3 nights. Late meetings.' },
    { from: 'you', text: 'What do I do?' },
    { from: 'twin', text: 'Move Tuesday standup to 9am. Approve?' },
    { from: 'you', text: 'Yes.' },
    { from: 'twin', text: 'Done. BioAge market at 71% YES — staking 200pts.' },
    { from: 'you', text: 'Good.' },
    { from: 'twin', text: 'V-Score +12 this week. Wealth ring lagging.' },
  ]
  const [n, setN] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setN(p => p < msgs.length ? p + 1 : p), 1200)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'system-ui' }}>
      {msgs.slice(0, n).map((m, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: m.from === 'you' ? 'flex-end' : 'flex-start', animation: 'popIn 0.2s ease' }}>
          <div style={{
            maxWidth: '80%', padding: '8px 12px',
            borderRadius: m.from === 'you' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
            background: m.from === 'you' ? '#7C3AED' : 'rgba(255,255,255,0.08)',
            fontSize: 12.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5,
          }}>{m.text}</div>
        </div>
      ))}
      {n >= msgs.length && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Twin active 24/7</div>
      )}
    </div>
  )
}

/* ── market bars ── */
function MarketBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)
  return (
    <div ref={ref} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace' }}>{pct}% YES</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '100%', borderRadius: 99, background: color, width: inView ? `${pct}%` : '0%', transition: 'width 1.2s cubic-bezier(0.34,1.2,0.64,1) 0.2s', boxShadow: `0 0 8px ${color}88` }} />
      </div>
    </div>
  )
}

/* ── section wrapper ── */
function S({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const v = useInView(ref as React.RefObject<Element>)
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease', ...style }}>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════ */
export default function Landing() {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const tick = useTick(80)

  useEffect(() => {
    const h = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  return (
    <div style={{ background: '#06060E', minHeight: '100vh', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @keyframes popIn { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:none } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-track { background: #06060E } ::-webkit-scrollbar-thumb { background: #7C3AED55; border-radius: 99px }
      `}</style>

      {/* cursor glow */}
      <div style={{ position: 'fixed', left: mouseX - 200, top: mouseY - 200, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, transition: 'left 0.1s, top 0.1s' }} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,6,14,0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>V</div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.5 }}>VIVA</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/auth/login" style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/onboard" style={{ padding: '7px 16px', borderRadius: 8, background: '#7C3AED', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px', position: 'relative', textAlign: 'center' }}>
        {/* grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '60px 60px', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)', filter: 'blur(40px)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* live pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 99, padding: '5px 14px', marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}><LiveCounter from={0} to={2847} /> people levelling up right now</span>
          </div>

          <h1 style={{ fontSize: 'clamp(42px,7vw,88px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: -3, margin: '0 0 24px' }}>
            Your life.<br />
            <span style={{ background: 'linear-gradient(135deg,#818CF8,#7C3AED,#F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Quantified.</span><br />
            Owned.
          </h1>

          <p style={{ fontSize: 'clamp(16px,2.2vw,20px)', color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.65 }}>
            VIVA tracks your health, wealth, identity and social capital in real time — and lets you stake, trade, and prove it on-chain.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/onboard" style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: 'white', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 32px rgba(124,58,237,0.4)' }}>Claim your score →</Link>
            <Link href="/auth/login" style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>

          {/* rings hero */}
          <div style={{ marginTop: 64, animation: 'float 4s ease-in-out infinite' }}>
            <Rings size={240} />
          </div>
        </div>
      </section>

      {/* LIVE TICKER */}
      <div style={{ overflow: 'hidden', padding: '16px 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 40, animation: 'marquee 20s linear infinite', width: 'max-content' }}>
          {[...FEED, ...FEED].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>@{f.handle}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{f.msg.slice(0, 50)}</span>
              <span style={{ fontSize: 11, color: '#34D399', fontFamily: 'monospace' }}>{f.delta}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STATS ROW */}
      <S style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 1 }}>
          {[
            { n: 2847, label: 'Active users', suffix: '' },
            { n: 14200, label: 'V-Score data points', suffix: '' },
            { n: 847, label: 'Avg V-Score', suffix: '' },
            { n: 96, label: 'Market accuracy', suffix: '%' },
          ].map(({ n, label, suffix }) => (
            <div key={label} style={{ padding: '32px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, letterSpacing: -2, background: 'linear-gradient(135deg,white,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                <LiveCounter from={0} to={n} suffix={suffix} />
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </S>

      {/* LIVE FEED SECTION */}
      <section style={{ padding: '0 24px 80px', maxWidth: 740, margin: '0 auto' }}>
        <S>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399', letterSpacing: 1, textTransform: 'uppercase' }}>Live activity</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, letterSpacing: -1.5, margin: 0 }}>Real people.<br />Real progress.</h2>
          </div>
          <LiveFeed />
        </S>
      </section>

      {/* TWIN SECTION */}
      <section style={{ padding: '80px 24px', background: 'rgba(124,58,237,0.04)', borderTop: '1px solid rgba(124,58,237,0.15)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 48, alignItems: 'center' }}>
          <S>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Your AI Twin</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: -1.5, margin: '0 0 16px' }}>Runs your life<br />while you live it.</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 24px', fontSize: 15 }}>Your Twin watches your rings, moves your calendar, stakes markets, and acts on your behalf — with your permission.</p>
            <Link href="/auth/onboard" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 10, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)', color: '#A78BFA', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Activate Twin →</Link>
          </S>
          <S>
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⚡</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#A78BFA' }}>Your Twin</span>
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#34D399', animation: 'pulse 1.5s infinite' }} />
              </div>
              <TwinDemo />
            </div>
          </S>
        </div>
      </section>

      {/* MARKETS SECTION */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <S>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Prediction Markets</div>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: -1.5, margin: '0 0 16px' }}>Bet on yourself.<br />Win points.</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 24px', fontSize: 15 }}>Stake V-Points on health outcomes, community wagers, and personal milestones. Verified on-chain with ZK proofs.</p>
              <Link href="/auth/onboard" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Explore markets →</Link>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 }}>Live markets</div>
              <MarketBar label="Will atlas_burns close all rings this week?" pct={78} color="#818CF8" />
              <MarketBar label="zara_voss BioAge under 25 by Dec?" pct={61} color="#34D399" />
              <MarketBar label="nova_pierce $NOVA above 0.5 USDC?" pct={44} color="#FACC15" />
              <MarketBar label="reed_cross V-Score hits 900 this month?" pct={83} color="#F472B6" />
            </div>
          </div>
        </S>
      </section>

      {/* ROOMS SECTION */}
      <section style={{ padding: '80px 24px', background: 'rgba(244,114,182,0.03)', borderTop: '1px solid rgba(244,114,182,0.1)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <S style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F472B6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Rooms</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: -1.5, margin: 0 }}>Talk. Watch. Connect.</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 12 }}>Audio rooms, live chat, and TikTok-style video drops — all gated by V-Score.</p>
          </S>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {[
              { icon: '🎙️', title: 'Audio Rooms', desc: 'Clubhouse-style voice with live waveforms and hand-raise queue', color: '#818CF8' },
              { icon: '💬', title: 'Live Chat', desc: 'MSN-style group chats inside every room — fast, raw, real-time', color: '#34D399' },
              { icon: '📱', title: 'Video Drops', desc: 'TikTok-style short clips from high V-Score members, stacked and scrollable', color: '#F472B6' },
            ].map(({ icon, title, desc, color }) => (
              <S key={title}>
                <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}22`, borderRadius: 14, height: '100%' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </S>
            ))}
          </div>
          <S style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/auth/onboard" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)', color: '#F472B6', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Enter rooms →</Link>
          </S>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse,rgba(124,58,237,0.2) 0%,transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <S style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, letterSpacing: -3, margin: '0 0 20px', lineHeight: 1.05 }}>
            Your score is<br />
            <span style={{ background: 'linear-gradient(135deg,#818CF8,#F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>waiting.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', margin: '0 0 40px' }}>Join <LiveCounter from={0} to={2847} /> people who own their life data.</p>
          <Link href="/auth/onboard" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 14, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: 'white', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 48px rgba(124,58,237,0.5)' }}>Start for free →</Link>
        </S>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>© 2025 VIVA · Life Operating System · <Link href="/auth/login" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Sign in</Link></div>
      </footer>
    </div>
  )
}
