'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAppStore, mockUser, mapApiUser, RING_META, TIER_META } from '@/lib/store'
import { auth, messages as messagesApi, notifications as notifApi, feed as feedApi } from '@/lib/api'

function useCountUp(target: number, duration = 1000, trigger = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!trigger) return
    let cur = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      cur += step
      if (cur >= target) { setVal(target); clearInterval(id) }
      else setVal(Math.floor(cur))
    }, 16)
    return () => clearInterval(id)
  }, [target, trigger])
  return val
}

function useAnimIn(ref: React.RefObject<Element>) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.1 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return vis
}

function StatCard({ label, value, prefix = '', sub, color, trigger }: {
  label: string; value: number; prefix?: string; sub: string; color: string; trigger: boolean
}) {
  const animVal = useCountUp(value, 1000, trigger)
  return (
    <div className="p-3 lg:p-4 border border-white/6 hover:border-white/12 transition-all" style={{ borderRadius: 'var(--radius)' }}>
      <p style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      <p className="text-lg lg:text-xl font-bold" style={{ color, letterSpacing: '-0.03em' }}>{prefix}{trigger ? animVal : 0}</p>
      <p className="text-xs mt-0.5" style={{ opacity: 0.3 }}>{sub}</p>
    </div>
  )
}

const TICKER_TOKENS = [
  { symbol: 'SOVV', price: 0.0089, change: +24.1 },
  { symbol: 'LUNA', price: 0.0072, change: +18.3 },
  { symbol: 'ZERO', price: 0.0061, change: +12.7 },
  { symbol: 'AISH', price: 0.0048, change: +9.2 },
  { symbol: 'NOAD', price: 0.0041, change: +7.8 },
  { symbol: 'BIOP', price: 0.0028, change: +3.1 },
  { symbol: 'ZKPR', price: 0.0022, change: -1.2 },
  { symbol: 'MINT', price: 0.0019, change: +2.0 },
]

function TokenTicker() {
  const items = [...TICKER_TOKENS, ...TICKER_TOKENS] // duplicate for seamless loop
  return (
    <Link href="/tokens" className="block overflow-hidden rounded-xl border border-white/6 hover:border-white/12 transition-all"
      style={{ background: 'rgba(255,255,255,0.018)' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
        <span className="text-xs text-white/35 tracking-widest">YOUTOKEN MARKET</span>
        <span className="ml-auto text-xs text-white/25 hover:text-white/50 transition-colors">View all →</span>
      </div>
      <div className="relative py-2 overflow-hidden">
        <div className="flex gap-6 animate-[ticker_20s_linear_infinite]" style={{ width: 'max-content' }}>
          {items.map((t, i) => {
            const up = t.change >= 0
            return (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono font-bold text-white/70">${t.symbol}</span>
                <span className="text-xs font-mono text-white/45">{t.price.toFixed(4)}</span>
                <span className={`text-xs font-mono font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
                  {up ? '▲' : '▼'}{Math.abs(t.change).toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Link>
  )
}

export default function HomeCanvas() {
  const { user, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [hovered, setHovered] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [animReady, setAnimReady] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null!)
  const statsVisible = useAnimIn(statsRef)

  useEffect(() => {
    setMounted(true)
    const tick = setInterval(() => setTime(new Date()), 60000)
    auth.me().then(me => setUser(mapApiUser(me, mockUser()))).catch(() => {
      if (!user) {
        // In prod this would redirect to login; for now fall back to mock so UI isn't blank
        setUser(mockUser())
      }
    })
    messagesApi.threads().then((t: any[]) => setUnread(t.filter((x: any) => x.unreadCount > 0).length)).catch(() => {})
    notifApi.unreadCount().then(d => setNotifCount(d.count)).catch(() => {})
    feedApi.list().then((res: any) => setRecentPosts((res.posts || []).slice(0, 3))).catch(() => {})
    const t2 = setTimeout(() => setAnimReady(true), 250)
    return () => { clearInterval(tick); clearTimeout(t2) }
  }, [])

  if (!mounted) return null

  const u = user || mockUser()
  const rings = Object.entries(RING_META) as [keyof typeof u.rings, (typeof RING_META)[keyof typeof RING_META]][]
  const tier = TIER_META[u.tier]
  const greeting = time.getHours() < 12 ? 'Morning' : time.getHours() < 18 ? 'Afternoon' : 'Evening'
  const vscore = u.vscore ?? (u as any).vScore ?? 0

  const checks = [
    { label: 'Set your display name', done: !!u.displayName && u.displayName !== 'Unknown', href: '/settings' },
    { label: 'Log your first health ring', done: Object.values(u.rings).some(v => v > 0), href: '/health' },
    { label: 'Post to the feed', done: false, href: '/feed' },
    { label: 'Explore prediction markets', done: false, href: '/markets' },
    { label: 'Run your AI twin', done: false, href: '/twin' },
  ]
  const doneCount = checks.filter(c => c.done).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 lg:px-8 py-4 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <div>
          <p style={{ fontSize: '0.6rem', opacity: 0.35, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-semibold text-base lg:text-lg mt-0.5" style={{ letterSpacing: '-0.02em' }}>
            {greeting}, {u.displayName.split(' ')[0]}.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-white/50">
              <path d="M10 2a6 6 0 00-6 6v3l-1.5 2h15L16 11V8a6 6 0 00-6-6zM8.5 16a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
                style={{ background: 'var(--ring-social)', fontSize: '0.5rem', fontWeight: 700 }}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
          <Link href="/messages" className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-white/50">
              <path d="M3 4h14v10H11l-3 3v-3H3V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
                style={{ background: 'var(--v)', fontSize: '0.5rem', fontWeight: 700 }}>
                {unread}
              </span>
            )}
          </Link>
          <Link href={`/profile/${u.handle}`} className="text-xs text-white/30 hover:text-white/70 transition-colors hidden sm:block">My Profile</Link>
          <Link href="/settings" className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/10 hover:border-white/30 transition-colors">
            <img src={u.avatar} alt={u.displayName} className="w-full h-full object-cover" />
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">

          {/* LEFT */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-xs mx-auto" style={{ aspectRatio: '1' }}>
              <RingCanvas rings={u.rings} vscore={vscore} tier={u.tier} hovered={hovered} setHovered={setHovered} animReady={animReady} />
            </div>

            <div className="flex items-center gap-3 mt-3 w-full max-w-xs">
              <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${tier.color}40)` }} />
              <span className="px-3 py-1 border" style={{ fontSize: '0.6rem', letterSpacing: '0.12em', borderColor: `${tier.color}40`, color: tier.color, borderRadius: '99px' }}>
                {tier.label.toUpperCase()} TIER
              </span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${tier.color}40)` }} />
            </div>

            <div className="w-full max-w-xs mt-5 space-y-3">
              {rings.map(([key, meta]) => {
                const val = u.rings[key]
                const isHov = hovered === key
                return (
                  <div key={key} onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)} className="cursor-default">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                          style={{ background: meta.color, boxShadow: isHov ? `0 0 8px ${meta.color}` : 'none' }} />
                        <span className="text-xs font-medium transition-colors duration-200"
                          style={{ color: isHov ? 'white' : 'rgba(245,244,240,0.6)' }}>{meta.label}</span>
                      </div>
                      <span className="text-xs font-bold font-mono transition-colors duration-200"
                        style={{ color: isHov ? meta.color : 'rgba(245,244,240,0.35)' }}>{val}</span>
                    </div>
                    <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: animReady ? `${val}%` : '0%', background: meta.color, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)', boxShadow: isHov ? `0 0 8px ${meta.color}60` : 'none' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-7 flex flex-col gap-5">

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="V-Score" value={vscore} sub={`${tier.label} tier`} color="var(--v)" trigger={statsVisible} />
              <StatCard label="YouToken" value={u.youtoken.price} prefix="$" sub={u.youtoken.symbol} color="var(--ring-wealth)" trigger={statsVisible} />
              <StatCard label="Holders" value={u.youtoken.holders} sub="token holders" color="var(--ring-social)" trigger={statsVisible} />
              <StatCard label="ZK Proofs" value={u.zkProofs.length} sub="verified" color="var(--ring-activity)" trigger={statsVisible} />
            </div>

            <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* Token ticker */}
            <TokenTicker />

            {/* Quick actions */}
            <section>
              <p style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>QUICK ACTIONS</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {([
                  { label: 'Log Activity', href: '/health', icon: '◎', color: 'var(--ring-activity)' },
                  { label: 'Check Feed', href: '/feed', icon: '≡', color: 'var(--ring-social)' },
                  { label: 'AI Twin', href: '/twin', icon: '◈', color: 'var(--v)' },
                  { label: 'Markets', href: '/markets', icon: '↗', color: 'var(--ring-wealth)' },
                  { label: 'Wallet', href: '/wallet', icon: '◎', color: '#22c55e' },
                  { label: 'Staking', href: '/staking', icon: '⬡', color: '#f59e0b' },
                  { label: 'ZK Identity', href: '/identity', icon: '◐', color: '#818cf8' },
                ] as const).map(({ label, href, icon, color }) => (
                  <Link key={label} href={href}
                    className="flex items-center gap-2.5 px-3 py-2.5 border border-white/6 hover:border-white/18 hover:bg-white/2 transition-all group"
                    style={{ borderRadius: 'var(--radius)' }}>
                    <span className="group-hover:opacity-100 transition-opacity" style={{ color, opacity: 0.65, fontFamily: 'monospace', fontSize: '1rem' }}>{icon}</span>
                    <span className="text-sm font-medium text-white/55 group-hover:text-white/80 transition-colors">{label}</span>
                  </Link>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* AI Twin */}
            <section className="flex items-center justify-between p-4 border border-white/6 hover:border-white/12 transition-all" style={{ borderRadius: 'var(--radius)' }}>
              <div>
                <p style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>AI TWIN — HYPERAGENT</p>
                <p className="text-sm text-white/50">Fable 5 · L2 autonomy active</p>
              </div>
              <Link href="/twin" className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/25 rounded-lg text-sm text-white/60 hover:text-white/90 transition-all">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--v)' }} />
                Open Twin
              </Link>
            </section>

            <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* Onboarding */}
            {doneCount < checks.length && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>GETTING STARTED</p>
                  <span className="text-xs font-mono" style={{ color: 'var(--v)', opacity: 0.7 }}>{doneCount}/{checks.length}</span>
                </div>
                <div className="h-0.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(doneCount / checks.length) * 100}%`, background: 'var(--v)' }} />
                </div>
                <div className="space-y-2">
                  {checks.map(({ label, done, href }) => (
                    <Link key={label} href={href}
                      className="flex items-center gap-3 px-3 py-2.5 border rounded-lg transition-all group"
                      style={{ borderColor: done ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)', background: done ? 'rgba(124,58,237,0.05)' : 'transparent', borderRadius: 'var(--radius)' }}>
                      <div className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center"
                        style={{ borderColor: done ? 'var(--v)' : 'rgba(255,255,255,0.2)', background: done ? 'var(--v)' : 'transparent' }}>
                        {done && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-sm flex-1" style={{ color: done ? 'rgba(245,244,240,0.35)' : 'rgba(245,244,240,0.7)', textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
                      {!done && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-25 group-hover:opacity-60 transition-opacity">
                          <path d="M4.5 2.5l4 3.5-4 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recent feed */}
            {recentPosts.length > 0 && (
              <>
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>RECENT FEED</p>
                    <Link href="/feed" className="text-xs text-white/30 hover:text-white/60 transition-colors">View all →</Link>
                  </div>
                  <div className="space-y-2">
                    {recentPosts.map((post: any) => (
                      <Link key={post.id} href="/feed"
                        className="block px-3 py-2.5 border border-white/5 hover:border-white/12 hover:bg-white/1 transition-all"
                        style={{ borderRadius: 'var(--radius)' }}>
                        <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">{post.content}</p>
                        <p className="text-xs mt-1.5 opacity-25">{post.author?.displayName || 'Someone'} · {new Date(post.createdAt).toLocaleDateString()}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RingCanvas({ rings, vscore, tier, hovered, setHovered, animReady }: {
  rings: Record<string, number>; vscore: number; tier: string
  hovered: string | null; setHovered: (k: string | null) => void; animReady: boolean
}) {
  const size = 340
  const cx = size / 2
  const cy = size / 2
  const ringOrder = ['sleep', 'nutrition', 'activity', 'social', 'wealth']
  const radii = [140, 117, 94, 71, 48]
  const sw = 9
  const tierColor = TIER_META[tier as keyof typeof TIER_META]?.color || '#7C3AED'

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        {ringOrder.map(key => (
          <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={hovered === key ? '5' : '2.5'} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {ringOrder.map((key, i) => (
        <circle key={`track-${key}`} cx={cx} cy={cy} r={radii[i]} fill="none"
          stroke={RING_META[key as keyof typeof RING_META].color} strokeWidth={sw} opacity={0.07} />
      ))}

      {ringOrder.map((key, i) => {
        const meta = RING_META[key as keyof typeof RING_META]
        const val = rings[key] / 100
        const r = radii[i]
        const circ = 2 * Math.PI * r
        const dash = animReady ? circ * val : 0
        const isHov = hovered === key
        return (
          <circle key={`fill-${key}`} cx={cx} cy={cy} r={r} fill="none"
            stroke={meta.color}
            strokeWidth={isHov ? sw + 2 : sw}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            filter={`url(#glow-${key})`}
            opacity={isHov ? 1 : 0.88}
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1), stroke-width 0.3s', cursor: 'pointer' }}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
          />
        )
      })}

      {animReady && ringOrder.map((key, i) => {
        const meta = RING_META[key as keyof typeof RING_META]
        const val = rings[key] / 100
        const r = radii[i]
        const angle = val * Math.PI * 2 - Math.PI / 2
        return (
          <circle key={`dot-${key}`}
            cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r={4.5}
            fill={meta.color} style={{ filter: `drop-shadow(0 0 5px ${meta.color})` }} />
        )
      })}

      <circle cx={cx} cy={cy} r={34} fill="var(--ink)" />
      <circle cx={cx} cy={cy} r={32} fill="none" stroke={tierColor} strokeWidth={1} opacity={0.25} />
      <text x={cx} y={cy - 3} textAnchor="middle" fill={tierColor} fontSize={26} fontWeight={700} fontFamily="system-ui"
        style={{ letterSpacing: '-0.04em', filter: `drop-shadow(0 0 10px ${tierColor})` }}>
        {vscore}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="white" fontSize={6} opacity={0.3} letterSpacing={2} fontFamily="monospace">
        V-SCORE
      </text>

      {hovered && (
        <text x={cx} y={cy + 50} textAnchor="middle"
          fill={RING_META[hovered as keyof typeof RING_META].color}
          fontSize={10} fontFamily="monospace" opacity={0.9}>
          {RING_META[hovered as keyof typeof RING_META].label.toUpperCase()} · {rings[hovered]}
        </text>
      )}
    </svg>
  )
}
