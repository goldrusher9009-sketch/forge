'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function useInView(ref: React.RefObject<Element>, threshold = 0.1) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    // Check immediately if already in viewport
    const rect = ref.current.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) { setInView(true); return }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref, threshold])
  return inView
}

function useCycler(items: string[], ms = 2800) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % items.length), ms)
    return () => clearInterval(t)
  }, [items.length, ms])
  return items[i]
}

function AnimatedRings({ size = 220, animated = true }: { size?: number; animated?: boolean }) {
  const rings = [
    { label: 'Sleep',     color: '#818CF8', pct: 91, r: 88 },
    { label: 'Nutrition', color: '#34D399', pct: 74, r: 70 },
    { label: 'Activity',  color: '#FB923C', pct: 88, r: 52 },
    { label: 'Social',    color: '#F472B6', pct: 62, r: 34 },
    { label: 'Wealth',    color: '#FACC15', pct: 55, r: 16 },
  ]
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r
        const dash = animated ? circ * ring.pct / 100 : 0
        return (
          <g key={ring.label}>
            <circle cx={cx} cy={cx} r={ring.r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
            <circle cx={cx} cy={cx} r={ring.r} fill="none" stroke={ring.color} strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              transform={`rotate(-90 ${cx} ${cx})`}
              style={{ transition: `stroke-dasharray 1.8s cubic-bezier(0.34,1.3,0.64,1) ${i * 0.15}s` }}
            />
          </g>
        )
      })}
      <text x={cx} y={cx - 7} textAnchor="middle" fill="white" fontSize={size * 0.14} fontWeight="900" fontFamily="system-ui">847</text>
      <text x={cx} y={cx + 13} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize={size * 0.055} fontFamily="system-ui" fontWeight="700" letterSpacing="2.5">V·SCORE</text>
    </svg>
  )
}

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : 'translateY(28px)',
      transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
    }}>
      {children}
    </div>
  )
}

const NOSTALGIC_LINES = [
  'Remember when your reputation meant something?',
  'Remember when your word was your bond?',
  'Remember when you had to earn your place?',
  'Remember when health was a lifestyle, not a hashtag?',
  'Remember when wealth was built, not performed?',
  'Remember when community meant something real?',
]

const TICKER_ITEMS = [
  { user: 'atlas_burns', action: 'V-Score hit 920 → Sovereign tier', color: '#818CF8', time: '2m' },
  { user: 'zara_voss', action: 'Won 340pts staking BioAge market YES', color: '#34D399', time: '4m' },
  { user: 'cael_morse', action: 'Twin executed 3 tasks autonomously', color: '#A78BFA', time: '7m' },
  { user: 'nova_pierce', action: 'YouToken $NOVA up 18% today', color: '#FACC15', time: '9m' },
  { user: 'reed_cross', action: 'Matched 94% ZK compatibility', color: '#F472B6', time: '11m' },
  { user: 'lena_dark', action: 'Sleep ring closed 100% — streak 30d', color: '#FB923C', time: '13m' },
]

function LiveTicker() {
  const active = useCycler(TICKER_ITEMS.map(t => t.user))
  const item = TICKER_ITEMS.find(t => t.user === active) || TICKER_ITEMS[0]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 99, padding: '6px 14px',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', animation: 'pulse 2s infinite' }} />
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
        <strong style={{ color: item.color }}>@{item.user}</strong>
        {' '}{item.action}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{item.time} ago</span>
    </div>
  )
}

function RingLegend() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
      {[
        ['Sleep', '#818CF8', 91],
        ['Nutrition', '#34D399', 74],
        ['Activity', '#FB923C', 88],
        ['Social', '#F472B6', 62],
        ['Wealth', '#FACC15', 55],
      ].map(([l, c, v]) => (
        <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c as string, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{l}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: c as string }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

function MarketBar({ label, yes, color }: { label: string; yes: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace', flexShrink: 0, marginLeft: 12 }}>{yes}% YES</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%', borderRadius: 99, background: color,
          width: inView ? `${yes}%` : '0%',
          transition: 'width 1.2s cubic-bezier(0.34,1.2,0.64,1) 0.3s',
        }} />
      </div>
    </div>
  )
}

function TwinChat() {
  const msgs = [
    { from: 'twin', text: 'Sleep ring down 3 nights running. Late meetings causing it.' },
    { from: 'you', text: 'What should I do?' },
    { from: 'twin', text: 'Move Tuesday standup to 9am. Draft ready. Approve?' },
    { from: 'you', text: 'Yes.' },
    { from: 'twin', text: 'Done. BioAge market at 71% YES — staking 200pts on your behalf.' },
    { from: 'you', text: 'Good call.' },
    { from: 'twin', text: 'V-Score now 851. Wealth ring lagging — suggest YouToken stake review.' },
  ]
  const [visible, setVisible] = useState(2)
  useEffect(() => {
    const t = setInterval(() => setVisible(v => v < msgs.length ? v + 1 : v), 1400)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {msgs.slice(0, visible).map((m, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: m.from === 'you' ? 'flex-end' : 'flex-start' }}>
          <div style={{
            maxWidth: '82%', padding: '9px 13px',
            borderRadius: m.from === 'you' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: m.from === 'you' ? '#7C3AED' : 'rgba(255,255,255,0.07)',
            fontSize: 12, color: 'rgba(255,255,255,0.88)', lineHeight: 1.55,
            animation: 'fadeUp 0.35s ease',
          }}>{m.text}</div>
        </div>
      ))}
      {visible < msgs.length && (
        <div style={{ display: 'flex', gap: 3, padding: '8px 14px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#A78BFA', opacity: 0.6, animation: `bounce 1.2s ${i*0.2}s infinite` }} />
          ))}
        </div>
      )}
    </div>
  )
}

const FEATURES = [
  {
    id: 'vscore',
    num: '01',
    color: '#818CF8',
    tag: 'THE FOUNDATION',
    title: "Your life has a score.\nThe world just couldn't see it.",
    story: 'Before social media, reputation was earned slowly — over years, through actions, in person. Then the internet flattened it all into follower counts and blue ticks. VIVA restores the original idea: your actual behaviour, quantified and verified. V-Score is built from 5 rings that touch every pillar of a real life.',
    details: ['Sleep → how well you recover', 'Nutrition → what you actually eat', 'Activity → how you move your body', 'Social → depth of your real connections', 'Wealth → your financial trajectory'],
    callout: 'Score updates daily. Cryptographically verifiable. Cannot be bought.',
    visual: 'rings',
  },
  {
    id: 'twin',
    num: '02',
    color: '#7C3AED',
    tag: 'YOUR AI AGENT',
    title: 'The assistant you always\nwanted. Finally exists.',
    story: 'Not a chatbot. Not a to-do list. Your Twin is a Claude-powered AI agent that reads your rings, monitors your markets, manages your tasks — and acts on your behalf at whatever level of trust you give it. L1: watches. L2: recommends. L3: executes. You set the dial.',
    details: ['Reads live V-Score and ring data', 'Stakes prediction markets autonomously', 'Reschedules meetings, flags anomalies', 'Drafts messages in your voice', 'Gets smarter the longer you use it'],
    callout: 'Your Twin works while you sleep. Literally.',
    visual: 'twin',
  },
  {
    id: 'markets',
    num: '03',
    color: '#FACC15',
    tag: 'PREDICTION MARKETS',
    title: 'Put your conviction\nwhere your score is.',
    story: 'Real prediction markets on longevity science, biotech, crypto, culture. Your V-Score determines which markets you can access — higher tier, higher stakes, bigger payouts. This is the original idea of betting: skin in the game, knowledge rewarded, noise filtered out.',
    details: ['YES/NO binary markets on real events', 'V-Score gates premium market access', 'Your Twin stakes automatically at L3', 'Winners earn attention points', 'Markets resolve on chain — no disputes'],
    callout: 'Seed tier: 5 markets. Sovereign tier: unlimited.',
    visual: 'markets',
  },
  {
    id: 'matching',
    num: '04',
    color: '#F472B6',
    tag: 'ZK MATCHING',
    title: 'Find your people.\nWithout showing your cards.',
    story: 'Before dating apps, you met people through shared context — work, sport, community. You knew something real about them before you spoke. ZK Matching brings that back: we compute compatibility from your ring data using zero-knowledge proofs, so neither person sees the other\'s numbers. You get a compatibility score. You decide whether to connect.',
    details: ['Matching based on ring alignment, not photos', 'ZK proofs: computed privately, verified publicly', 'No unsolicited DMs — both must accept', 'Compatible matches appear in Signal Feed', 'Compatibility shown as ring overlap visual'],
    callout: 'No swiping. No cold DMs. Only mutual signal.',
    visual: 'matching',
  },
  {
    id: 'youtoken',
    num: '05',
    color: '#34D399',
    tag: 'YOUTOKEN',
    title: 'Mint yourself.\nLet others bet on your growth.',
    story: 'Every VIVA user can mint a personal token tied to their V-Score trajectory. As your rings improve, your token appreciates. Others can stake on your improvement. You earn royalties every time your token trades. It\'s the original idea of investing in people — now actually possible at scale.',
    details: ['10,000 fixed-supply personal token', 'Price tied to V-Score trajectory', 'Holders bet on your personal growth', 'You earn from every trade — forever', 'Top tokens surface in the Signal Feed'],
    callout: 'Your growth is the asset. Start compounding it.',
    visual: 'token',
  },
  {
    id: 'rooms',
    num: '06',
    color: '#FB923C',
    tag: 'AUDIO ROOMS',
    title: 'Conversations where\nentry is earned, not bought.',
    story: 'Remember when a room full of serious people felt different to a public forum? The signal-to-noise ratio was earned by the entry cost — be it geography, credential, or reputation. VIVA Audio Rooms gate entry by V-Score. Every participant had to earn their place. The protocol enforces it.',
    details: ['Entry gated by minimum V-Score', 'Raise hand to speak — listeners can boost', 'Rooms by topic, tier, and ring focus', 'Top speakers featured in Signal Feed', 'Record and replay at Guardian tier+'],
    callout: 'A room of 20 high-V-Score humans beats a forum of 20,000.',
    visual: 'rooms',
  },
]

function FeatureVisual({ id, color, active }: { id: string; color: string; active: boolean }) {
  if (id === 'vscore') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '12px 0' }}>
      <AnimatedRings size={200} animated={active} />
      <RingLegend />
    </div>
  )
  if (id === 'twin') return (
    <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 18, padding: '18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#A78BFA' }}>◈</div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Your Twin</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399' }} />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>L3 Autonomous · live</p>
          </div>
        </div>
      </div>
      {active && <TwinChat />}
    </div>
  )
  if (id === 'markets') return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.3)' }}>LIVE MARKETS</p>
        <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'rgba(250,204,21,0.08)', color: '#FACC15', border: '1px solid rgba(250,204,21,0.2)' }}>Guardian+ only</span>
      </div>
      <MarketBar label="BTC breaks $150K before Dec 2025" yes={67} color="#FACC15" />
      <MarketBar label="CRISPR longevity trial FDA-approved by 2026" yes={43} color="#34D399" />
      <MarketBar label="AGI in consumer product by 2027" yes={71} color="#818CF8" />
      <MarketBar label="Average lifespan exceeds 90 by 2040" yes={38} color="#F472B6" />
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        {[['22.1K pts staked', '#FACC15'], ['5 markets live', '#FB923C'], ['4h avg resolution', '#818CF8']].map(([l, c]) => (
          <div key={l as string} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: c as string, fontFamily: 'monospace' }}>{(l as string).split(' ')[0]}</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{(l as string).split(' ').slice(1).join(' ')}</p>
          </div>
        ))}
      </div>
    </div>
  )
  if (id === 'matching') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { handle: 'atlas_burns', display: 'Atlas Burns', score: 920, compat: 94, rings: [91,85,78,70,88], tier: 'SOVEREIGN' },
        { handle: 'zara_voss', display: 'Zara Voss', score: 872, compat: 87, rings: [88,79,91,65,74], tier: 'GUARDIAN' },
        { handle: 'reed_cross', display: 'Reed Cross', score: 801, compat: 81, rings: [80,82,76,88,71], tier: 'GUARDIAN' },
      ].map(u => (
        <div key={u.handle} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${color}25, rgba(255,255,255,0.06))`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 13 }}>
                {u.display[0]}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{u.display}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{u.tier} · V{u.score}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 19, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>{u.compat}%</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>ZK match</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {u.rings.map((v, ri) => (
              <div key={ri} style={{ flex: 1, height: 3, borderRadius: 99, background: ['#818CF8','#34D399','#FB923C','#F472B6','#FACC15'][ri], opacity: v / 100 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
  if (id === 'youtoken') return (
    <div style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 18, padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#34D399' }}>$SOVEREIGN</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>10,000 supply · 23 holders</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', color: '#34D399' }}>$0.0847</p>
          <p style={{ fontSize: 12, color: '#34D399', marginTop: 3 }}>↑ +12.4% today</p>
        </div>
      </div>
      <div style={{ height: 56, display: 'flex', alignItems: 'flex-end', gap: 2, marginBottom: 16 }}>
        {[32,36,30,42,38,44,48,46,52,58,54,61,64,62,70,74,71,78,82,80,88].map((h, i) => (
          <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: `rgba(52,211,153,${0.12 + (i/21)*0.7})`, height: `${h}%` }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {[['Market cap','847 pts'],['24h vol','124 pts'],['Your royalty','18 pts/day']].map(([l,v]) => (
          <div key={l}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>{l}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace', marginTop: 3 }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
  if (id === 'rooms') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { title: 'Longevity Founders Room', gate: 800, live: true, speakers: 2, listeners: 47, topic: 'VO2 max and lifespan correlation' },
        { title: 'Biomarker Hacking w/ Atlas', gate: 700, live: true, speakers: 1, listeners: 23, topic: 'Sleep ring optimisation' },
        { title: 'ZK Privacy Primitives', gate: 600, live: false, speakers: 0, listeners: 0, topic: 'Starts in 2h' },
      ].map(r => (
        <div key={r.title} style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${r.live ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {r.live && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FB923C', flexShrink: 0, marginTop: 4 }} />}
              <p style={{ fontSize: 13, fontWeight: 700, color: r.live ? 'white' : 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{r.title}</p>
            </div>
            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 99, background: 'rgba(251,146,60,0.1)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.2)', flexShrink: 0, marginLeft: 8 }}>V{r.gate}+</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: r.live ? 8 : 0, paddingLeft: r.live ? 14 : 0 }}>{r.topic}</p>
          {r.live && (
            <div style={{ display: 'flex', gap: 14, paddingLeft: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ display: 'flex', gap: 1, alignItems: 'center', height: 12 }}>
                  {[4,7,5,9,6,8].map((h,i) => <div key={i} style={{ width: 2, height: h, borderRadius: 1, background: '#FB923C', opacity: 0.7 }} />)}
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{r.speakers} speaking</p>
              </div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{r.listeners} listening</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
  return null
}

function FeatureSection({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)
  const flip = i % 2 !== 0

  return (
    <div ref={ref} id={f.id} style={{
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '80px 0',
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : 'translateY(24px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'start' }}>
          {/* Text */}
          <div style={{ order: flip ? 2 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{f.num}</span>
              <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: f.color }}>{f.tag}</span>
            </div>
            <h2 style={{
              fontSize: 'clamp(1.7rem, 3.5vw, 2.7rem)', fontWeight: 900, letterSpacing: '-0.03em',
              lineHeight: 1.1, marginBottom: 24, color: 'white',
              whiteSpace: 'pre-line',
            }}>{f.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(245,244,240,0.45)', marginBottom: 24, maxWidth: 460 }}>{f.story}</p>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
              {f.details.map((d, di) => (
                <li key={di} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: f.color, flexShrink: 0, marginTop: 8 }} />
                  <span style={{ fontSize: 13, color: 'rgba(245,244,240,0.55)', lineHeight: 1.55 }}>{d}</span>
                </li>
              ))}
            </ul>

            <div style={{
              padding: '14px 18px', borderRadius: 12,
              background: `rgba(${f.color.includes('818') ? '129,140,248' : f.color.includes('7C3') ? '124,58,237' : f.color.includes('FAC') ? '250,204,21' : f.color.includes('F47') ? '244,114,182' : f.color.includes('34D') ? '52,211,153' : '251,146,60'},0.07)`,
              border: `1px solid ${f.color}25`,
              marginBottom: 24,
            }}>
              <p style={{ fontSize: 13, color: 'rgba(245,244,240,0.7)', lineHeight: 1.55, fontStyle: 'italic' }}>"{f.callout}"</p>
            </div>

            <Link href="/auth/onboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, color: f.color, textDecoration: 'none',
            }}>
              Get started →
            </Link>
          </div>

          {/* Visual */}
          <div style={{ order: flip ? 1 : 2 }}>
            <div style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 22, padding: 24,
            }}>
              <FeatureVisual id={f.id} color={f.color} active={inView} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const nostalgia = useCycler(NOSTALGIC_LINES, 3200)
  const [nKey, setNKey] = useState(0)
  useEffect(() => { setNKey(k => k + 1) }, [nostalgia])
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef as React.RefObject<Element>, 0.05)

  return (
    <div style={{ background: '#050509', color: '#F5F4F0', fontFamily: 'system-ui,-apple-system,sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes ticker { 0%{opacity:0;transform:translateX(-8px)} 8%{opacity:1;transform:none} 88%{opacity:1;transform:none} 100%{opacity:0;transform:translateX(8px)} }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(24px)', background: 'rgba(5,5,9,0.88)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#7C3AED' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.03em' }}>VIVA</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/auth/onboard" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'rgba(245,244,240,0.55)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none' }}>
            Sign in
          </Link>
          <Link href="/auth/onboard" style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'white', background: '#7C3AED', textDecoration: 'none' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Cycling nostalgia line */}
        <div style={{
          opacity: heroInView ? 1 : 0, transition: 'opacity 0.9s ease',
          marginBottom: 48,
        }}>
          <p key={nKey} style={{
            fontSize: 'clamp(13px, 2vw, 15px)', fontWeight: 600,
            color: 'rgba(245,244,240,0.35)', letterSpacing: '0.02em',
            animation: 'ticker 3.2s ease',
          }}>
            {nostalgia}
          </p>
          <p style={{ fontSize: 'clamp(13px, 2vw, 15px)', fontWeight: 700, color: '#A78BFA', marginTop: 6 }}>
            We built the answer.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 56, alignItems: 'center',
          opacity: heroInView ? 1 : 0,
          transform: heroInView ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s',
        }}>
          {/* Left */}
          <div>
            <h1 style={{
              fontSize: 'clamp(2.6rem, 6.5vw, 5.2rem)', fontWeight: 900,
              letterSpacing: '-0.045em', lineHeight: 0.97, marginBottom: 28,
            }}>
              The platform<br />
              where your life<br />
              <span style={{ background: 'linear-gradient(120deg, #7C3AED 0%, #818CF8 50%, #34D399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                has real value.
              </span>
            </h1>

            {/* WHO WE ARE */}
            <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(245,244,240,0.48)', marginBottom: 10, maxWidth: 480 }}>
              VIVA is a life protocol. We track your <strong style={{ color: 'rgba(245,244,240,0.78)' }}>health, wealth, and social capital</strong> through 5 daily rings, compress them into a <strong style={{ color: 'rgba(245,244,240,0.78)' }}>V-Score</strong>, and use that score to unlock a world of prediction markets, AI autonomy, peer matching, and financial instruments built on your actual behaviour.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(245,244,240,0.3)', marginBottom: 36, maxWidth: 480 }}>
              Think of it as your operating system for real life — the one app that actually rewards you for becoming a better human.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link href="/auth/onboard" style={{
                display: 'inline-block', padding: '15px 30px', borderRadius: 13,
                fontWeight: 800, fontSize: 15, color: 'white', textDecoration: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                boxShadow: '0 0 50px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.4)',
              }}>
                Claim your V-Score — free
              </Link>
              <a href="#vscore" style={{
                display: 'inline-block', padding: '15px 24px', borderRadius: 13,
                fontWeight: 600, fontSize: 15, color: 'rgba(245,244,240,0.55)', textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                How it works ↓
              </a>
            </div>

            <LiveTicker />
          </div>

          {/* Right — rings */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <AnimatedRings size={240} animated={heroInView} />
            <RingLegend />
          </div>
        </div>
      </section>

      {/* ═══ WHO WE ARE strip ═══ */}
      <Fade>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '56px 24px', background: 'rgba(124,58,237,0.04)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#A78BFA', marginBottom: 28, textAlign: 'center' }}>WHO WE ARE & WHAT WE BUILT</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
              {[
                { icon: '⚡', color: '#818CF8', title: 'Built for people who want more', body: "VIVA is for humans who take their health, wealth, and relationships seriously. No motivation-poster energy. Real systems, real accountability." },
                { icon: '🧬', color: '#34D399', title: 'Rooted in biology and finance', body: "The 5 rings are not arbitrary. Sleep, nutrition, activity, social, wealth — the pillars longevity science says matter most. We quantify what actually moves the needle." },
                { icon: '🔐', color: '#F472B6', title: 'Sovereignty by design', body: 'You own your data. Your score is cryptographically verified. Your twin works for you, not advertisers. No data sold. Ever.' },
                { icon: '🌐', color: '#FACC15', title: 'Reputation is the new currency', body: 'In the attention economy, followers were currency. In VIVA, your V-Score is currency. Earned through action, not content.' },
              ].map(c => (
                <div key={c.title} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{c.icon}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.title}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Fade>

      {/* MANIFESTO */}
      <Fade>
        <section style={{ padding: '88px 24px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#A78BFA', marginBottom: 40 }}>THE MANIFESTO</p>
          {[
            "Social media gave everyone a platform. It gave no one a reputation.",
            "You can have 10 million followers and zero credibility. You can have 50 real connections and move markets.",
            "The internet optimised for attention. We optimised for signal.",
            "VIVA is built on a simple belief: the people who actually do the work deserve a system that sees them.",
            "Not a feed. Not a highlight reel. A score.",
          ].map((line, i) => (
            <p key={i} style={{ fontSize: i === 0 ? 22 : 16, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'white' : 'rgba(255,255,255,0.45)', lineHeight: 1.75, marginBottom: 24 }}>
              {line}
            </p>
          ))}
        </section>
      </Fade>

      {/* FEATURES */}
      <section style={{ padding: '0 24px 80px' }}>
        <Fade>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#A78BFA', textAlign: 'center', marginBottom: 72 }}>THE SYSTEM</p>
        </Fade>
        {FEATURES.map((f, i) => <FeatureSection key={f.id} f={f} i={i} />)}
      </section>

      {/* TIERS */}
      <Fade>
        <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#A78BFA', textAlign: 'center', marginBottom: 12 }}>YOUR RANK UNLOCKS YOUR WORLD</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 52 }}>V-Score gates every feature. Earn access. It cannot be bought.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {[
                { tier: 'SEED', range: '0–199', color: '#64748B', features: ['Basic V-Score', 'Public feed', 'Health rings'] },
                { tier: 'BUILDER', range: '200–499', color: '#34D399', features: ['AI Twin (L1)', 'Feed + comments', 'Dating preview'] },
                { tier: 'GUARDIAN', range: '500–699', color: '#818CF8', features: ['Twin L2', 'Prediction markets', 'Token mint'] },
                { tier: 'SOVEREIGN', range: '700–899', color: '#F472B6', features: ['Twin L3 auto', 'All markets', 'Rooms host'] },
                { tier: 'LEGEND', range: '900–1000', color: '#FACC15', features: ['Everything', 'LEGEND badge', 'Governance vote'] },
              ].map(t => (
                <div key={t.tier} style={{ border: `1px solid ${t.color}30`, borderRadius: 16, padding: '24px 18px', background: `${t.color}06` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: t.color, marginBottom: 6 }}>{t.tier}</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: 'monospace', marginBottom: 18 }}>{t.range}</p>
                  {t.features.map(feat => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{feat}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </Fade>

      {/* CTA */}
      <Fade>
        <section style={{ padding: '100px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#A78BFA', marginBottom: 24 }}>THE INVITATION</p>
          <h2 style={{ fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
            Your score is already<br />being written.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 48, maxWidth: 480, margin: '0 auto 48px' }}>
            Every day you sleep well, move, connect, and build — it counts. VIVA just makes it visible.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/auth/onboard" style={{ padding: '16px 36px', borderRadius: 12, background: '#7C3AED', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
              Start building your score
            </a>
            <a href="/home" style={{ padding: '16px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
              Go to app
            </a>
          </div>
        </section>
      </Fade>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          VIVA — Life Operating System · Your data, your score, your sovereignty.
        </p>
      </footer>

    </div>
  )
}
