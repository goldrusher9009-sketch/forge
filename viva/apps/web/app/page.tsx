'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

function useCountUp(target: number, duration = 2000, start = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(ease * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return val
}

function useInView(ref: React.RefObject<Element>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

const RINGS = [
  { key: 'sleep',      label: 'Sleep',      color: '#818CF8', deg: 72,  r: 88 },
  { key: 'nutrition',  label: 'Nutrition',  color: '#34D399', deg: 51,  r: 72 },
  { key: 'activity',   label: 'Activity',   color: '#FB923C', deg: 83,  r: 56 },
  { key: 'social',     label: 'Social',     color: '#F472B6', deg: 62,  r: 40 },
  { key: 'wealth',     label: 'Wealth',     color: '#FACC15', deg: 44,  r: 24 },
]

function RingViz({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 32px rgba(124,58,237,0.3))' }}>
      {RINGS.map(ring => {
        const circ = 2 * Math.PI * ring.r
        const pct = animate ? ring.deg / 100 : 0
        const dash = circ * pct
        return (
          <g key={ring.key}>
            <circle cx="100" cy="100" r={ring.r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
            <circle cx="100" cy="100" r={ring.r} fill="none"
              stroke={ring.color} strokeWidth="8"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ transition: animate ? `stroke-dasharray 1.8s cubic-bezier(0.34,1.56,0.64,1) ${RINGS.indexOf(ring) * 0.1}s` : 'none' }}
            />
          </g>
        )
      })}
      <text x="100" y="96" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="system-ui">847</text>
      <text x="100" y="112" textAnchor="middle" fill="rgba(245,244,240,0.4)" fontSize="9" fontFamily="system-ui">V-SCORE</text>
    </svg>
  )
}

const FEATURES = [
  {
    icon: '◎',
    color: '#818CF8',
    title: 'V-Score™',
    sub: 'Your sovereign life metric',
    desc: 'A single score across 5 life rings — sleep, nutrition, activity, social, and wealth. Cryptographically proven, privately held, universally comparable.',
  },
  {
    icon: '◈',
    color: '#7C3AED',
    title: 'AI Twin',
    sub: 'Powered by Claude Fable 5',
    desc: 'Your autonomous AI agent that manages tasks, analyzes your health data, scouts markets, and coordinates your life — 24/7 across L1, L2, and L3 autonomy.',
  },
  {
    icon: '↗',
    color: '#FACC15',
    title: 'Prediction Markets',
    sub: 'Stake your conviction',
    desc: 'Trade YES/NO positions on longevity, technology, and culture. Your V-Score determines access tiers. Winners earn attention tokens.',
  },
  {
    icon: '◉',
    color: '#F472B6',
    title: 'ZK-Verified Matching',
    sub: 'Privacy-first compatibility',
    desc: 'Match with compatible humans based on ring alignment — not photos. Zero-knowledge proofs verify your data without ever exposing it.',
  },
  {
    icon: '⬡',
    color: '#34D399',
    title: 'YouToken',
    sub: 'Tokenize yourself',
    desc: 'Mint your personal token backed by your V-Score trajectory. Investors stake on your growth. You earn from your own sovereign data.',
  },
  {
    icon: '◎',
    color: '#FB923C',
    title: 'Audio Rooms',
    sub: 'V-Score gated spaces',
    desc: 'Live audio spaces where entry requires a minimum V-Score. Signal-to-noise ratio enforced cryptographically. Real conversations, curated.',
  },
]

const EXPLAINERS = [
  {
    id: 'vscore',
    badge: '01',
    color: '#818CF8',
    icon: '◎',
    title: 'V-Score™',
    tagline: 'One number that proves how you actually live',
    steps: [
      { label: 'Log your rings', detail: 'Track sleep, nutrition, activity, social interactions, and wealth daily — manually or synced from wearables.' },
      { label: 'Get your score', detail: 'VIVA computes your V-Score (0–1000) across all 5 rings, updated in real time. No black box — every point is traceable.' },
      { label: 'Unlock tiers', detail: 'Seed → Builder → Guardian → Sovereign → Legend. Higher tiers unlock markets, rooms, and matching features.' },
    ],
    visual: (
      <div className="relative flex items-center justify-center" style={{ height: 180 }}>
        {[
          { label: 'Sleep', color: '#818CF8', pct: 91, r: 72 },
          { label: 'Activity', color: '#FB923C', pct: 78, r: 54 },
          { label: 'Wealth', color: '#FACC15', pct: 62, r: 36 },
        ].map(ring => {
          const circ = 2 * Math.PI * ring.r
          return (
            <svg key={ring.label} viewBox="0 0 180 180" className="absolute" style={{ width: 180, height: 180 }}>
              <circle cx="90" cy="90" r={ring.r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
              <circle cx="90" cy="90" r={ring.r} fill="none" stroke={ring.color} strokeWidth="7"
                strokeDasharray={`${circ * ring.pct / 100} ${circ}`} strokeLinecap="round" transform="rotate(-90 90 90)"
                style={{ transition: 'stroke-dasharray 1.5s ease' }} />
            </svg>
          )
        })}
        <div className="relative z-10 text-center">
          <p className="font-black text-3xl" style={{ color: '#818CF8', letterSpacing: '-0.04em' }}>847</p>
          <p className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>V-SCORE</p>
        </div>
      </div>
    ),
  },
  {
    id: 'twin',
    badge: '02',
    color: '#7C3AED',
    icon: '◈',
    title: 'AI Twin',
    tagline: 'Your autonomous agent — watching, advising, acting',
    steps: [
      { label: 'Brief your twin', detail: 'Tell it your goals, habits, and what you want automated. It reads your rings and learns your patterns.' },
      { label: 'Choose autonomy level', detail: 'L1 — Observe & report. L2 — Recommend and assist. L3 — Full auto-execute. You control the dial.' },
      { label: 'Let it work', detail: 'Your twin schedules tasks, scouts prediction markets, drafts messages, and surfaces insights — 24/7.' },
    ],
    visual: (
      <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
        {[
          { from: 'Twin', msg: 'Sleep ring dropped to 71 — flagging 3 meetings after 9pm this week', time: '08:14' },
          { from: 'Twin', msg: 'Staked 200pts on BioAge market (YES). Confidence: 87%', time: '09:31' },
          { from: 'You', msg: 'Good call. Increase stake limit to 500.', time: '09:33' },
          { from: 'Twin', msg: 'Limit updated. Watching 2 new longevity markets.', time: '09:33' },
        ].map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.from === 'You' ? 'flex-row-reverse' : ''}`}>
            <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: m.from === 'Twin' ? 'rgba(124,58,237,0.4)' : 'rgba(52,211,153,0.3)', fontSize: '0.45rem', color: 'white' }}>
              {m.from === 'Twin' ? '◈' : 'U'}
            </div>
            <div className="text-xs px-3 py-1.5 rounded-xl max-w-[85%] leading-relaxed"
              style={{ background: m.from === 'Twin' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)', color: 'rgba(245,244,240,0.8)' }}>
              {m.msg}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'markets',
    badge: '03',
    color: '#FACC15',
    icon: '↗',
    title: 'Prediction Markets',
    tagline: 'Bet your conviction. Earn when you\'re right.',
    steps: [
      { label: 'Browse markets', detail: 'Open YES/NO markets on longevity science, crypto, culture, and health — curated by V-Score tier.' },
      { label: 'Stake your position', detail: 'Buy YES or NO with attention points. Market probability updates live as others stake.' },
      { label: 'Collect winnings', detail: 'Resolved markets pay out proportionally. High V-Score users access exclusive high-stakes markets.' },
    ],
    visual: (
      <div className="space-y-2">
        {[
          { title: 'BTC hits $100K by 2025', yes: 72, vol: '14.2K', color: '#FACC15' },
          { title: 'CRISPR longevity trial approved', yes: 41, vol: '8.7K', color: '#34D399' },
          { title: 'AGI before 2027', yes: 58, vol: '22.1K', color: '#818CF8' },
        ].map(m => (
          <div key={m.title} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-medium text-white/80 leading-tight">{m.title}</p>
              <span className="text-xs font-bold flex-shrink-0" style={{ color: m.color }}>{m.yes}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${m.yes}%`, background: m.color, opacity: 0.7 }} />
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{m.vol} pts staked</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'matching',
    badge: '04',
    color: '#F472B6',
    icon: '◉',
    title: 'ZK Matching',
    tagline: 'Find your people. Without giving yourself away.',
    steps: [
      { label: 'Set your ring preferences', detail: 'Tell VIVA which rings matter most to you in a match — sleep alignment, wealth trajectory, social score.' },
      { label: 'ZK proof runs', detail: 'A zero-knowledge proof computes compatibility without either person seeing the other\'s raw data.' },
      { label: 'Connect', detail: 'Matched? You get a compatibility score and encrypted intro. No unsolicited DMs, no data exposure.' },
    ],
    visual: (
      <div className="flex items-center justify-center gap-4" style={{ height: 160 }}>
        {[
          { handle: 'atlas_burns', score: 920, rings: [91, 85, 78], colors: ['#818CF8', '#34D399', '#FB923C'] },
          { handle: 'you', score: 847, rings: [83, 71, 88], colors: ['#818CF8', '#34D399', '#FB923C'] },
        ].map((u, ui) => (
          <div key={u.handle} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${u.colors[0]}30, ${u.colors[1]}20)`, border: `2px solid ${u.colors[0]}40`, color: 'white' }}>
              {u.handle === 'you' ? 'Y' : 'A'}
            </div>
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>@{u.handle}</p>
            <div className="flex gap-1">
              {u.rings.map((r, i) => (
                <div key={i} className="w-5 h-1.5 rounded-full" style={{ background: u.colors[i], opacity: r / 100 }} />
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1 mx-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(244,114,182,0.2)', border: '1px solid rgba(244,114,182,0.4)', color: '#F472B6' }}>
            94%
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>match</p>
        </div>
      </div>
    ),
  },
  {
    id: 'youtoken',
    badge: '05',
    color: '#34D399',
    icon: '⬡',
    title: 'YouToken',
    tagline: 'Mint yourself. Let the market believe in you.',
    steps: [
      { label: 'Mint your token', detail: 'Create a personal token tied to your V-Score. Supply is fixed. Price rises with your trajectory.' },
      { label: 'Build your market cap', detail: 'As your rings improve, your token appreciates. Others stake on your growth with attention points.' },
      { label: 'Earn from your data', detail: 'Royalties flow back to you every time your token trades. Your life, your economy.' },
    ],
    visual: (
      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono font-bold text-lg" style={{ color: '#34D399' }}>$SOVEREIGN</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>YouToken · 10,000 supply</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold" style={{ color: '#34D399' }}>$0.0847</p>
            <p className="text-xs" style={{ color: '#34D399' }}>↑ +12.4%</p>
          </div>
        </div>
        <div className="h-12 flex items-end gap-0.5">
          {[40,45,38,52,48,55,60,58,65,72,68,75,80,78,85].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: `rgba(52,211,153,${0.2 + (i/15)*0.6})` }} />
          ))}
        </div>
        <div className="flex gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span>Market cap: <span className="text-white/60">847 pts</span></span>
          <span>Holders: <span className="text-white/60">23</span></span>
        </div>
      </div>
    ),
  },
  {
    id: 'rooms',
    badge: '06',
    color: '#FB923C',
    icon: '⬡',
    title: 'Audio Rooms',
    tagline: 'Gated conversations. No noise. Only signal.',
    steps: [
      { label: 'Browse live rooms', detail: 'See active audio rooms filtered by topic and minimum V-Score requirement. Quality is enforced, not hoped for.' },
      { label: 'Pass the gate', detail: 'Entry requires your V-Score to meet the room threshold. No exceptions — the protocol decides, not a moderator.' },
      { label: 'Speak or listen', detail: 'Raise your hand to speak. Listeners can boost speakers with attention points. Top voices get featured.' },
    ],
    visual: (
      <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FB923C' }} />
            <p className="text-sm font-semibold">Longevity Founders Room</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,146,60,0.15)', color: '#FB923C' }}>V800+</span>
        </div>
        {[
          { name: 'Atlas Burns', role: 'speaking', score: 920 },
          { name: 'Zara Voss', role: 'speaking', score: 885 },
          { name: 'Cael Morse', role: 'listening', score: 841 },
          { name: 'You', role: 'listening', score: 847 },
        ].map(u => (
          <div key={u.name} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: u.role === 'speaking' ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.06)', border: u.role === 'speaking' ? '1.5px solid rgba(251,146,60,0.5)' : '1.5px solid rgba(255,255,255,0.08)', color: 'white' }}>
              {u.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: u.role === 'speaking' ? 'white' : 'rgba(255,255,255,0.5)' }}>{u.name}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {u.role === 'speaking' && <div className="flex gap-0.5">{[3,5,4,6,3,5].map((h,i) => <div key={i} className="w-0.5 rounded-full" style={{ height: h*2, background: '#FB923C', opacity: 0.7 }} />)}</div>}
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{u.score}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

const STATS = [
  { value: 12847, label: 'Active users', suffix: '' },
  { value: 94,    label: 'Avg V-Score', suffix: '%' },
  { value: 2300,  label: 'Prediction markets', suffix: '+' },
  { value: 99,    label: 'Uptime', suffix: '%' },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef as React.RefObject<Element>)
  const statsInView = useInView(statsRef as React.RefObject<Element>)

  const s0 = useCountUp(STATS[0].value, 2200, statsInView)
  const s1 = useCountUp(STATS[1].value, 1800, statsInView)
  const s2 = useCountUp(STATS[2].value, 2000, statsInView)
  const s3 = useCountUp(STATS[3].value, 1600, statsInView)
  const statVals = [s0, s1, s2, s3]

  return (
    <div style={{ background: '#04040A', color: '#F5F4F0', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#7C3AED' }} />
          </div>
          <span className="font-bold text-lg tracking-tight">VIVA</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgba(245,244,240,0.5)' }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#stats" className="hover:text-white transition-colors">By the numbers</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/onboard" className="hidden sm:block text-sm px-4 py-2 rounded-lg transition-all"
            style={{ color: 'rgba(245,244,240,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Sign in
          </Link>
          <Link href="/auth/onboard" className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: '#7C3AED', color: 'white' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-medium"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Now live · Sovereign Identity Protocol v1
          </div>

          <h1 className="font-black mb-6 leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)', letterSpacing: '-0.04em' }}>
            Your Life.<br />
            <span style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA, #34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Quantified. Owned. Traded.
            </span>
          </h1>

          <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(245,244,240,0.55)', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}>
            VIVA is the world's first life operating system. Earn a sovereign V-Score across 5 life rings,
            deploy your AI twin, trade prediction markets, and tokenize your growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/onboard"
              className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
              Claim your V-Score →
            </Link>
            <a href="#features"
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:border-white/30"
              style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(245,244,240,0.7)' }}>
              See how it works
            </a>
          </div>

          {/* Ring viz */}
          <div className="relative mx-auto" style={{ width: 'min(280px, 70vw)', height: 'min(280px, 70vw)' }}>
            <RingViz animate={heroInView} />
            {/* Ring labels */}
            {RINGS.map((ring, i) => {
              const angle = (i * 72 - 90) * (Math.PI / 180)
              const labelR = ring.r + 16
              const x = 50 + (labelR / 100) * 50 * Math.cos(angle)
              const y = 50 + (labelR / 100) * 50 * Math.sin(angle)
              return null // labels omitted for cleanliness
            })}
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
            <div className="flex -space-x-2">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 overflow-hidden" style={{ borderColor: '#04040A' }}>
                  <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=user${i}&backgroundColor=7c3aed,6d28d9,818cf8`} alt="" className="w-full h-full" />
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'rgba(245,244,240,0.4)' }}>
              <span className="font-semibold text-white">12,847</span> sovereigns and counting
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" ref={statsRef} className="px-6 py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={s.label} className="text-center">
              <p className="font-black mb-1 tabular-nums" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', color: i === 0 ? '#A78BFA' : i === 1 ? '#34D399' : i === 2 ? '#FACC15' : '#FB923C' }}>
                {statVals[i].toLocaleString()}{s.suffix}
              </p>
              <p className="text-sm" style={{ color: 'rgba(245,244,240,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#A78BFA' }}>THE PROTOCOL</p>
            <h2 className="font-black tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em' }}>
              Every dimension of your life,<br className="hidden sm:block" /> in one sovereign stack.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="p-6 rounded-2xl transition-all hover:scale-[1.02] hover:border-opacity-40 cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  animationDelay: `${i * 0.1}s`,
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                  <span style={{ color: f.color, fontSize: '1.1rem' }}>{f.icon}</span>
                </div>
                <h3 className="font-bold text-lg mb-0.5">{f.title}</h3>
                <p className="text-xs mb-3 font-medium" style={{ color: f.color }}>{f.sub}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,244,240,0.5)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE EXPLAINERS */}
      <section id="how" className="px-6 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#A78BFA' }}>HOW IT WORKS</p>
            <h2 className="font-black tracking-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.04em' }}>
              Every feature, explained.
            </h2>
            <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: 'rgba(245,244,240,0.4)' }}>
              No fluff. Here's exactly what each part of VIVA does and how you use it.
            </p>
          </div>

          <div className="space-y-28">
            {EXPLAINERS.map((ex, i) => (
              <div key={ex.id} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}>

                {/* Text side */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-black text-5xl tabular-nums" style={{ color: ex.color, opacity: 0.15, letterSpacing: '-0.05em' }}>{ex.badge}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${ex.color}15`, border: `1px solid ${ex.color}30` }}>
                      <span style={{ color: ex.color }}>{ex.icon}</span>
                    </div>
                    <h3 className="font-black text-2xl tracking-tight">{ex.title}</h3>
                  </div>
                  <p className="text-lg font-semibold mb-6" style={{ color: ex.color }}>{ex.tagline}</p>

                  <div className="space-y-4">
                    {ex.steps.map((step, si) => (
                      <div key={si} className="flex gap-4">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                          style={{ background: `${ex.color}20`, color: ex.color, border: `1px solid ${ex.color}30` }}>
                          {si + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-white mb-0.5">{step.label}</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,244,240,0.45)' }}>{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <a href="/auth/onboard"
                    className="inline-flex items-center gap-2 mt-8 text-sm font-semibold transition-all hover:gap-3"
                    style={{ color: ex.color }}>
                    Try {ex.title} →
                  </a>
                </div>

                {/* Visual side */}
                <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
                  <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {ex.visual}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="font-black mb-6 tracking-tight" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', letterSpacing: '-0.04em' }}>
            Your V-Score is<br />
            <span style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              waiting to be claimed.
            </span>
          </h2>
          <p className="text-lg mb-10" style={{ color: 'rgba(245,244,240,0.5)' }}>
            Join 12,847 sovereigns already living on the protocol. Free to start. Yours forever.
          </p>
          <Link href="/auth/onboard"
            className="inline-block px-10 py-5 rounded-xl font-bold text-white text-xl transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', boxShadow: '0 0 60px rgba(124,58,237,0.5)' }}>
            Claim your V-Score — it's free →
          </Link>
          <p className="mt-6 text-sm" style={{ color: 'rgba(245,244,240,0.25)' }}>No credit card. No data sold. Ever.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-10 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#7C3AED' }} />
            </div>
            <span className="font-bold text-sm">VIVA</span>
            <span className="text-xs ml-2" style={{ color: 'rgba(245,244,240,0.25)' }}>Life Operating System</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'rgba(245,244,240,0.3)' }}>
            <Link href="/auth/onboard" className="hover:text-white transition-colors">App</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <span>© 2026 VIVA Protocol</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
