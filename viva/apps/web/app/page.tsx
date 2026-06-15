'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function useInView(ref: React.RefObject<Element>, threshold = 0.15) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref, threshold])
  return inView
}

// Animated ring donut
function Rings({ size = 200, animated = true }: { size?: number; animated?: boolean }) {
  const rings = [
    { label: 'Sleep',      color: '#818CF8', pct: 91, r: 80 },
    { label: 'Nutrition',  color: '#34D399', pct: 74, r: 63 },
    { label: 'Activity',   color: '#FB923C', pct: 88, r: 46 },
    { label: 'Social',     color: '#F472B6', pct: 62, r: 29 },
    { label: 'Wealth',     color: '#FACC15', pct: 55, r: 12 },
  ]
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r
        const dash = animated ? circ * ring.pct / 100 : 0
        return (
          <g key={ring.label}>
            <circle cx={cx} cy={cx} r={ring.r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx={cx} cy={cx} r={ring.r} fill="none" stroke={ring.color} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              transform={`rotate(-90 ${cx} ${cx})`}
              style={{ transition: `stroke-dasharray 1.6s cubic-bezier(0.34,1.4,0.64,1) ${i * 0.12}s` }}
            />
          </g>
        )
      })}
      <text x={cx} y={cx - 6} textAnchor="middle" fill="white" fontSize={size * 0.13} fontWeight="800" fontFamily="system-ui">847</text>
      <text x={cx} y={cx + 12} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={size * 0.055} fontFamily="system-ui" fontWeight="600" letterSpacing="2">V-SCORE</text>
    </svg>
  )
}

// Mini market card
function MarketCard({ title, yes, color }: { title: string; yes: number; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 8, lineHeight: 1.4 }}>{title}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ width: `${yes}%`, height: '100%', borderRadius: 99, background: color }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace', flexShrink: 0 }}>{yes}%</span>
      </div>
    </div>
  )
}

// Twin chat bubble
function TwinBubble({ from, msg }: { from: 'twin' | 'you'; msg: string }) {
  const isYou = from === 'you'
  return (
    <div style={{ display: 'flex', justifyContent: isYou ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{
        maxWidth: '80%', padding: '8px 12px', borderRadius: isYou ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isYou ? '#7C3AED' : 'rgba(255,255,255,0.07)',
        fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5,
      }}>{msg}</div>
    </div>
  )
}

const SECTIONS = [
  {
    id: 'vscore',
    color: '#818CF8',
    eyebrow: 'THE FOUNDATION',
    headline: 'Your life has a score. You just never knew it.',
    body: 'V-Score is a single number from 0–1000 built from 5 sovereign rings: Sleep, Nutrition, Activity, Social, and Wealth. Not an algorithm you can game. Not a brand score. Your actual biological and financial reality, quantified daily.',
    bullets: [
      'Log once — rings update automatically',
      'Score is cryptographically verifiable',
      'Unlocks tiers: Seed → Builder → Guardian → Sovereign → Legend',
      'Visible on your public profile — your reputation, earned',
    ],
    visual: 'rings',
  },
  {
    id: 'twin',
    color: '#7C3AED',
    eyebrow: 'YOUR AI AGENT',
    headline: 'An AI that actually does things. Not just chats.',
    body: 'Your Twin is a Claude-powered autonomous agent that reads your rings, monitors markets, manages tasks, and acts on your behalf — at whatever level of autonomy you choose. L1 observes. L2 recommends. L3 executes.',
    bullets: [
      'Reads your V-Score and ring data live',
      'Stakes prediction markets when confidence is high',
      'Drafts messages, schedules tasks, flags anomalies',
      'You control the autonomy dial — always',
    ],
    visual: 'twin',
  },
  {
    id: 'markets',
    color: '#FACC15',
    eyebrow: 'PREDICTION MARKETS',
    headline: 'Bet on the future. With your reputation on the line.',
    body: 'VIVA runs real prediction markets on longevity science, crypto, culture, and health. Your V-Score determines which markets you can access. Higher tier = higher stakes = bigger payouts. Skin in the game, literally.',
    bullets: [
      'YES/NO markets on real-world events',
      'V-Score gates access to premium markets',
      'Your Twin can stake automatically at L3',
      'Winners earn attention points redeemable across the platform',
    ],
    visual: 'markets',
  },
  {
    id: 'matching',
    color: '#F472B6',
    eyebrow: 'ZK MATCHING',
    headline: 'Find people who actually align with you. No photos. No swiping.',
    body: 'VIVA matches you with compatible humans using zero-knowledge proofs on your ring data. Compatibility is computed without either person seeing the other\'s raw numbers. You get a score. You decide whether to connect.',
    bullets: [
      'Matching based on ring alignment, not looks',
      'ZK proofs: computed privately, verified publicly',
      'No unsolicited DMs — both sides must accept',
      'Compatible people show up in your Signal Feed',
    ],
    visual: 'matching',
  },
  {
    id: 'youtoken',
    color: '#34D399',
    eyebrow: 'YOUTOKEN',
    headline: 'Mint yourself. Your V-Score trajectory is the asset.',
    body: 'Every VIVA user can mint a personal token. Price is tied to your V-Score trajectory. As your rings improve, your token appreciates. Others can stake on your growth. You earn royalties every time your token trades.',
    bullets: [
      '10,000 fixed supply personal token',
      'Price rises with V-Score improvement',
      'Holders bet on your personal growth',
      'You earn from every trade — forever',
    ],
    visual: 'token',
  },
  {
    id: 'rooms',
    color: '#FB923C',
    eyebrow: 'AUDIO ROOMS',
    headline: 'Conversations with actual signal. Entry is earned, not bought.',
    body: 'Live audio rooms where every participant had to earn their way in. No follower counts. No verified badges. Just your V-Score. The room sets the minimum — the protocol enforces it. Signal-to-noise by design.',
    bullets: [
      'Entry gated by minimum V-Score',
      'Raise hand to speak — listeners can boost you',
      'Rooms organised by topic and tier',
      'Top speakers get featured in Signal Feed',
    ],
    visual: 'rooms',
  },
]

function SectionVisual({ id, color, animated }: { id: string; color: string; animated: boolean }) {
  if (id === 'vscore') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <Rings size={220} animated={animated} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['Sleep','#818CF8',91],['Nutrition','#34D399',74],['Activity','#FB923C',88],['Social','#F472B6',62],['Wealth','#FACC15',55]].map(([l,c,v]) => (
          <div key={l as string} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 4 }}>{l as string}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: c as string, fontFamily: 'monospace' }}>{v as number}</p>
          </div>
        ))}
      </div>
    </div>
  )

  if (id === 'twin') return (
    <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#A78BFA' }}>◈</div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Your Twin</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399' }} />
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>L3 — Autonomous</p>
          </div>
        </div>
      </div>
      <TwinBubble from="twin" msg="Sleep ring dipped to 68 — flagged 3 late meetings this week causing it." />
      <TwinBubble from="you" msg="What do you recommend?" />
      <TwinBubble from="twin" msg="Move Tuesday standup to 9am. I've drafted the reschedule. Approve?" />
      <TwinBubble from="you" msg="Do it." />
      <TwinBubble from="twin" msg="Done. Also: BioAge market at 71% YES. Staking 200pts on your behalf." />
    </div>
  )

  if (id === 'markets') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>LIVE MARKETS</p>
        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 99, background: 'rgba(250,204,21,0.1)', color: '#FACC15', border: '1px solid rgba(250,204,21,0.2)' }}>Guardian+ access</span>
      </div>
      <MarketCard title="BTC breaks $150K before Dec 2025" yes={67} color="#FACC15" />
      <MarketCard title="CRISPR longevity trial approved by FDA" yes={43} color="#34D399" />
      <MarketCard title="AGI deployed in consumer product by 2027" yes={71} color="#818CF8" />
      <MarketCard title="Average human lifespan exceeds 90 by 2040" yes={38} color="#F472B6" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#FACC15', fontFamily: 'monospace' }}>22.1K</p>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>pts staked today</p>
        </div>
        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#FB923C', fontFamily: 'monospace' }}>5</p>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>active markets</p>
        </div>
      </div>
    </div>
  )

  if (id === 'matching') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 4 }}>YOUR MATCHES TODAY</p>
      {[
        { handle: 'atlas_burns', display: 'Atlas Burns', score: 920, compat: 94, rings: [91,85,78,70,88], tier: 'SOVEREIGN' },
        { handle: 'zara_voss', display: 'Zara Voss', score: 872, compat: 87, rings: [88,79,91,65,74], tier: 'GUARDIAN' },
      ].map(u => (
        <div key={u.handle} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${color}30, rgba(255,255,255,0.1))`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 14 }}>
                {u.display[0]}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{u.display}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>@{u.handle} · {u.tier}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#F472B6', fontFamily: 'monospace' }}>{u.compat}%</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>ZK match</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {u.rings.map((v, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: ['#818CF8','#34D399','#FB923C','#F472B6','#FACC15'][i], opacity: v / 100 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  if (id === 'youtoken') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#34D399' }}>$SOVEREIGN</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>10,000 supply · 23 holders</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: '#34D399' }}>$0.0847</p>
            <p style={{ fontSize: 11, color: '#34D399' }}>↑ +12.4% today</p>
          </div>
        </div>
        {/* price chart */}
        <div style={{ height: 52, display: 'flex', alignItems: 'flex-end', gap: 2, marginBottom: 12 }}>
          {[32,36,30,42,38,44,48,46,52,58,54,61,64,62,70,74,71,78,82,80].map((h, i) => (
            <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: `rgba(52,211,153,${0.15 + (i/20)*0.6})`, height: `${h}%` }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[['Market cap','847 pts'],['24h vol','124 pts'],['Your earn','18 pts']].map(([l,v]) => (
            <div key={l}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (id === 'rooms') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { title: 'Longevity Founders Room', gate: 800, live: true, speakers: 2, listeners: 47 },
        { title: 'Biomarker Hacking w/ Atlas', gate: 700, live: true, speakers: 1, listeners: 23 },
        { title: 'ZK Privacy Primitives', gate: 600, live: false, speakers: 0, listeners: 0 },
      ].map(r => (
        <div key={r.title} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${r.live ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {r.live && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FB923C', flexShrink: 0 }} />}
              <p style={{ fontSize: 12, fontWeight: 600, color: r.live ? 'white' : 'rgba(255,255,255,0.4)' }}>{r.title}</p>
            </div>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(251,146,60,0.1)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.2)', flexShrink: 0 }}>
              V{r.gate}+
            </span>
          </div>
          {r.live && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* waveform */}
                <div style={{ display: 'flex', gap: 1, alignItems: 'center', height: 14 }}>
                  {[4,7,5,9,6,8,4,7].map((h,i) => <div key={i} style={{ width: 2, height: h, borderRadius: 1, background: '#FB923C', opacity: 0.7 }} />)}
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.speakers} speaking</p>
              </div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{r.listeners} listening</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return null
}

function Section({ s, i }: { s: typeof SECTIONS[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)
  const flip = i % 2 !== 0

  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : 'translateY(32px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '80px 0',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        display: 'flex', flexDirection: 'column', gap: 48,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 56,
          alignItems: 'center',
        }}>
          {/* Text */}
          <div style={{ order: flip ? 2 : 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: s.color, marginBottom: 16 }}>{s.eyebrow}</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, color: 'white' }}>
              {s.headline}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(245,244,240,0.5)', marginBottom: 28, maxWidth: 460 }}>
              {s.body}
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.bullets.map((b, bi) => (
                <li key={bi} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0, marginTop: 7 }} />
                  <span style={{ fontSize: 13, color: 'rgba(245,244,240,0.6)', lineHeight: 1.5 }}>{b}</span>
                </li>
              ))}
            </ul>
            <a href="/auth/onboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 28, fontSize: 13, fontWeight: 700, color: s.color,
              textDecoration: 'none', transition: 'gap 0.2s ease',
            }}>
              Try it free →
            </a>
          </div>

          {/* Visual */}
          <div style={{ order: flip ? 1 : 2 }}>
            <div style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20,
              padding: 24,
            }}>
              <SectionVisual id={s.id} color={s.color} animated={inView} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef as React.RefObject<Element>, 0.1)

  return (
    <div style={{ background: '#04040A', color: '#F5F4F0', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C3AED' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>VIVA</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/auth/onboard" style={{ padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'rgba(245,244,240,0.6)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none' }}>
            Sign in
          </Link>
          <Link href="/auth/onboard" style={{ padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'white', background: '#7C3AED', textDecoration: 'none' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO — full screen, left-aligned, direct */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          opacity: heroInView ? 1 : 0,
          transform: heroInView ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          {/* What it is — immediately */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
            {['Life Score','AI Agent','Prediction Markets','ZK Matching','Personal Token','Audio Rooms'].map(tag => (
              <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}>{tag}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: 24 }}>
                The operating<br />system for<br />
                <span style={{ background: 'linear-gradient(120deg, #7C3AED, #818CF8, #34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your actual life.</span>
              </h1>

              {/* CLEAR explanation — no buzzwords */}
              <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(245,244,240,0.55)', marginBottom: 12, maxWidth: 500 }}>
                VIVA turns your daily habits into a <strong style={{ color: 'rgba(245,244,240,0.85)' }}>V-Score</strong> — a verifiable life reputation. Then it gives you an <strong style={{ color: 'rgba(245,244,240,0.85)' }}>AI twin</strong> to act on it, <strong style={{ color: 'rgba(245,244,240,0.85)' }}>prediction markets</strong> to profit from it, and <strong style={{ color: 'rgba(245,244,240,0.85)' }}>a personal token</strong> to monetise it.
              </p>
              <p style={{ fontSize: 15, color: 'rgba(245,244,240,0.35)', marginBottom: 36 }}>
                Think Strava × Robinhood × Tinder × a Bloomberg terminal — but for your life, not your portfolio.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/auth/onboard" style={{
                  display: 'inline-block', padding: '14px 28px', borderRadius: 12,
                  fontWeight: 700, fontSize: 15, color: 'white', textDecoration: 'none',
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  boxShadow: '0 0 40px rgba(124,58,237,0.4)',
                }}>
                  Get your V-Score — free
                </Link>
                <a href="#vscore" style={{
                  display: 'inline-block', padding: '14px 28px', borderRadius: 12,
                  fontWeight: 600, fontSize: 15, color: 'rgba(245,244,240,0.65)', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  See how it works ↓
                </a>
              </div>

              {/* social proof */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32 }}>
                <div style={{ display: 'flex' }}>
                  {[0,1,2,3,4].map(i => (
                    <img key={i} src={`https://api.dicebear.com/7.x/shapes/svg?seed=u${i}&backgroundColor=7c3aed`}
                      style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #04040A', marginLeft: i > 0 ? -8 : 0 }} alt="" />
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(245,244,240,0.4)' }}>
                  <strong style={{ color: 'white' }}>12,847</strong> sovereigns already on the protocol
                </p>
              </div>
            </div>

            {/* Hero visual — the rings */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <div style={{ position: 'relative' }}>
                <Rings size={260} animated={heroInView} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Ring legend */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', width: '100%', maxWidth: 300 }}>
                {[['Sleep','#818CF8',91],['Nutrition','#34D399',74],['Activity','#FB923C',88],['Social','#F472B6',62],['Wealth','#FACC15',55]].map(([l,c,v]) => (
                  <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c as string, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{l as string}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: c as string }}>{v as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IS THIS — plain English explainer strip */}
      <div style={{ background: 'rgba(124,58,237,0.06)', borderTop: '1px solid rgba(124,58,237,0.15)', borderBottom: '1px solid rgba(124,58,237,0.15)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {[
            { q: 'What is VIVA?', a: 'A platform that scores your life across 5 dimensions and lets you act on that score.' },
            { q: 'Who is it for?', a: 'People serious about optimising their health, wealth, and reputation — not casually.' },
            { q: 'How does it work?', a: 'Log your rings daily → earn a V-Score → unlock markets, matching, and your AI twin.' },
            { q: 'Is it free?', a: 'Yes. Seed tier is free. Higher tiers unlock as your V-Score grows.' },
          ].map(({ q, a }) => (
            <div key={q}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', marginBottom: 6 }}>{q}</p>
              <p style={{ fontSize: 13, color: 'rgba(245,244,240,0.5)', lineHeight: 1.6 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE SECTIONS — each with ID for anchor links */}
      {SECTIONS.map((s, i) => (
        <div key={s.id} id={s.id}>
          <Section s={s} i={i} />
        </div>
      ))}

      {/* FINAL CTA */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#A78BFA', marginBottom: 16 }}>START FOR FREE</p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 }}>
            Your V-Score is<br />
            <span style={{ background: 'linear-gradient(120deg, #7C3AED, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              waiting.
            </span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(245,244,240,0.45)', marginBottom: 36, lineHeight: 1.7 }}>
            No credit card. No data sold. Your rings, your score, your twin — all yours.
          </p>
          <Link href="/auth/onboard" style={{
            display: 'inline-block', padding: '16px 36px', borderRadius: 14,
            fontWeight: 700, fontSize: 17, color: 'white', textDecoration: 'none',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            boxShadow: '0 0 60px rgba(124,58,237,0.45)',
          }}>
            Claim your V-Score →
          </Link>
          <p style={{ fontSize: 12, color: 'rgba(245,244,240,0.2)', marginTop: 20 }}>Takes 2 minutes. No credit card.</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em' }}>VIVA</span>
          <span style={{ fontSize: 11, color: 'rgba(245,244,240,0.2)' }}>Life Operating System</span>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(245,244,240,0.2)' }}>© 2026 VIVA Protocol · No data sold · Ever.</p>
      </footer>
    </div>
  )
}
