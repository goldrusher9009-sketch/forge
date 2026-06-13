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

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-24" style={{ background: 'rgba(124,58,237,0.04)', borderTop: '1px solid rgba(124,58,237,0.1)', borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#A78BFA' }}>HOW IT WORKS</p>
            <h2 className="font-black tracking-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.04em' }}>
              Three steps to sovereignty
            </h2>
          </div>
          <div className="space-y-6">
            {[
              { n: '01', title: 'Log your rings', desc: 'Connect health data or log manually. Sleep, nutrition, activity, social interactions, and wealth metrics feed your sovereign V-Score in real time.', color: '#818CF8' },
              { n: '02', title: 'Deploy your AI twin', desc: 'Your Fable 5-powered twin observes, advises (L1), assists (L2), or acts fully autonomously (L3). Schedule tasks, analyze markets, manage your life.', color: '#7C3AED' },
              { n: '03', title: 'Earn and trade', desc: 'Stake on prediction markets with your V-Score unlocking tiers. Mint YouToken backed by your trajectory. Match with compatible humans via ZK proofs.', color: '#34D399' },
            ].map(step => (
              <div key={step.n} className="flex gap-6 p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-4xl font-black flex-shrink-0 tabular-nums" style={{ color: step.color, opacity: 0.3, letterSpacing: '-0.04em' }}>{step.n}</div>
                <div>
                  <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,244,240,0.5)' }}>{step.desc}</p>
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
