'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore, mockUser, RING_META, TIER_META } from '@/lib/store'
import { auth } from '@/lib/api'
import clsx from 'clsx'

export default function HomeCanvas() {
  const router = useRouter()
  const { user, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const tick = setInterval(() => setTime(new Date()), 60000)
    // Fetch real user from API; fallback to mock
    auth.me().then(me => {
      setUser({
        ...mockUser(),
        id: me.id,
        handle: me.handle,
        displayName: me.displayName,
        avatarUrl: me.avatarUrl,
        bio: me.bio,
        vScore: me.vScore ?? 300,
        tier: me.tier?.toLowerCase() ?? 'rising',
        rings: {
          sleep: me.sleepRing ?? 70,
          nutrition: me.nutritionRing ?? 60,
          activity: me.activityRing ?? 80,
          social: me.socialRing ?? 65,
          wealth: me.wealthRing ?? 50,
        },
      })
    }).catch(() => {
      if (!user) setUser(mockUser())
    })
    return () => clearInterval(tick)
  }, [])

  if (!mounted) return null

  const u = user || mockUser()
  const rings = Object.entries(RING_META) as [keyof typeof u.rings, typeof RING_META[keyof typeof RING_META]][]
  const tier = TIER_META[u.tier]
  const greeting = time.getHours() < 12 ? 'Morning' : time.getHours() < 18 ? 'Afternoon' : 'Evening'

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.85)' }}
      >
        <div>
          <p className="t-caption" style={{ fontSize: '0.625rem' }}>
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-semibold text-lg mt-0.5" style={{ letterSpacing: '-0.02em' }}>
            {greeting}, {u.displayName}.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/messages" className="relative">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/40 hover:text-white/70 transition-colors">
              <path d="M3 4h14v10H11l-3 3v-3H3V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center" style={{ background: 'var(--v)', fontSize: '0.5rem' }}>3</span>
          </Link>
          <button className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
            <img src={u.avatar} alt={u.displayName} className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      <div className="container-editorial py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT: V-Score + Rings SVG */}
          <div className="lg:col-span-5">
            <div className="relative flex items-center justify-center" style={{ minHeight: '420px' }}>
              <RingCanvas rings={u.rings} vscore={u.vscore} tier={u.tier} hovered={hovered} setHovered={setHovered} />
            </div>

            {/* Tier badge */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div
                className="h-px flex-1"
                style={{ background: `linear-gradient(to right, transparent, ${tier.color}40)` }}
              />
              <span
                className="t-caption px-3 py-1 border"
                style={{ fontSize: '0.625rem', borderColor: `${tier.color}40`, color: tier.color, borderRadius: '99px' }}
              >
                {tier.label.toUpperCase()} TIER
              </span>
              <div
                className="h-px flex-1"
                style={{ background: `linear-gradient(to left, transparent, ${tier.color}40)` }}
              />
            </div>
          </div>

          {/* RIGHT: Metrics + Quick actions */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Ring detail bars */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="t-caption" style={{ fontSize: '0.625rem' }}>LIFE RINGS</h2>
                <span className="t-mono text-xs" style={{ opacity: 0.3 }}>daily average</span>
              </div>
              <div className="space-y-4">
                {rings.map(([key, meta]) => {
                  const val = u.rings[key]
                  const isHov = hovered === key
                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setHovered(key)}
                      onMouseLeave={() => setHovered(null)}
                      className="group cursor-default"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                            style={{ background: meta.color, boxShadow: isHov ? `0 0 8px ${meta.color}` : 'none' }}
                          />
                          <span className="text-sm font-medium" style={{ color: isHov ? 'white' : 'rgba(245,244,240,0.7)' }}>
                            {meta.label}
                          </span>
                        </div>
                        <span
                          className="t-mono text-sm font-bold transition-colors"
                          style={{ color: isHov ? meta.color : 'rgba(245,244,240,0.5)' }}
                        >
                          {val}
                        </span>
                      </div>
                      <div className="relative h-0.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="absolute left-0 top-0 h-full transition-all duration-700"
                          style={{
                            width: mounted ? `${val}%` : '0%',
                            background: meta.color,
                            boxShadow: isHov ? `0 0 10px ${meta.color}80` : 'none',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <div className="rule" />

            {/* Quick stats grid */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'YouToken', value: `$${u.youtoken.price}`, sub: u.youtoken.symbol, color: 'var(--ring-wealth)' },
                { label: 'Holders', value: String(u.youtoken.holders), sub: 'token holders', color: 'var(--ring-social)' },
                { label: 'ZK Proofs', value: String(u.zkProofs.length), sub: 'verified', color: 'var(--ring-activity)' },
                { label: 'V-Score', value: String(u.vscore), sub: `${tier.label} tier`, color: 'var(--v)' },
              ].map(({ label, value, sub, color }) => (
                <div
                  key={label}
                  className="p-4 border border-white/6 hover:border-white/12 transition-colors"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <p className="t-caption mb-2" style={{ fontSize: '0.625rem' }}>{label.toUpperCase()}</p>
                  <p className="text-xl font-bold" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
                  <p className="text-xs mt-1" style={{ opacity: 0.35 }}>{sub}</p>
                </div>
              ))}
            </section>

            <div className="rule" />

            {/* Quick actions */}
            <section>
              <h2 className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>QUICK ACTIONS</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Log activity', href: '/health', icon: '◎' },
                  { label: 'Check feed', href: '/feed', icon: '≡' },
                  { label: 'Twin status', href: '/twin', icon: '◈' },
                  { label: 'Open markets', href: '/markets', icon: '↗' },
                  { label: 'My token', href: '/token', icon: '◉' },
                  { label: 'Find match', href: '/dating', icon: '◇' },
                ].map(({ label, href, icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 px-4 py-3 border border-white/6 hover:border-white/18 hover:bg-white/2 transition-all group"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    <span className="text-base" style={{ opacity: 0.4, fontFamily: 'monospace' }}>{icon}</span>
                    <span className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
                  </Link>
                ))}
              </div>
            </section>

            <div className="rule" />

            {/* AI Twin status */}
            <section>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="t-caption" style={{ fontSize: '0.625rem' }}>AI TWIN — HYPERAGENT</h2>
                  <p className="text-sm mt-1 text-white/50">3 tasks completed today · L2 autonomy active</p>
                </div>
                <Link href="/twin">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse"
                    style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--v)' }} />
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Ring Canvas SVG ────────────────────────────────────
function RingCanvas({ rings, vscore, tier, hovered, setHovered }: {
  rings: Record<string, number>
  vscore: number
  tier: string
  hovered: string | null
  setHovered: (k: string | null) => void
}) {
  const size = 360
  const cx = size / 2
  const cy = size / 2
  const ringOrder = ['sleep', 'nutrition', 'activity', 'social', 'wealth']
  const radii = [148, 124, 100, 76, 52]
  const strokeWidth = 10
  const tierColor = TIER_META[tier as keyof typeof TIER_META]?.color || '#7C3AED'

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {ringOrder.map((key, i) => {
          const meta = RING_META[key as keyof typeof RING_META]
          return (
            <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={hovered === key ? '6' : '3'} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )
        })}
        <filter id="glow-vscore" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Tick marks */}
      {ringOrder.map((key, i) => {
        const r = radii[i]
        return Array.from({ length: 60 }).map((_, t) => {
          const angle = (t / 60) * Math.PI * 2 - Math.PI / 2
          const inner = r - 4
          const outer = r + 4
          return (
            <line
              key={`${key}-${t}`}
              x1={cx + inner * Math.cos(angle)}
              y1={cy + inner * Math.sin(angle)}
              x2={cx + outer * Math.cos(angle)}
              y2={cy + outer * Math.sin(angle)}
              stroke={RING_META[key as keyof typeof RING_META].color}
              strokeWidth={t % 5 === 0 ? 1.5 : 0.5}
              opacity={t % 5 === 0 ? 0.15 : 0.06}
            />
          )
        })
      })}

      {/* Track rings */}
      {ringOrder.map((key, i) => (
        <circle
          key={`track-${key}`}
          cx={cx} cy={cy}
          r={radii[i]}
          fill="none"
          stroke={RING_META[key as keyof typeof RING_META].color}
          strokeWidth={strokeWidth}
          opacity={0.06}
        />
      ))}

      {/* Fill rings */}
      {ringOrder.map((key, i) => {
        const meta = RING_META[key as keyof typeof RING_META]
        const val = rings[key] / 100
        const r = radii[i]
        const circ = 2 * Math.PI * r
        const dash = circ * val
        const isHov = hovered === key
        return (
          <circle
            key={`fill-${key}`}
            cx={cx} cy={cy}
            r={r}
            fill="none"
            stroke={meta.color}
            strokeWidth={isHov ? strokeWidth + 2 : strokeWidth}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            filter={`url(#glow-${key})`}
            style={{ transition: 'all 0.4s ease', cursor: 'pointer' }}
            opacity={isHov ? 1 : 0.85}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
          />
        )
      })}

      {/* Endpoint dots */}
      {ringOrder.map((key, i) => {
        const meta = RING_META[key as keyof typeof RING_META]
        const val = rings[key] / 100
        const r = radii[i]
        const angle = val * Math.PI * 2 - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        return (
          <circle
            key={`dot-${key}`}
            cx={x} cy={y} r={5}
            fill={meta.color}
            style={{ filter: `drop-shadow(0 0 6px ${meta.color})` }}
            opacity={0.9}
          />
        )
      })}

      {/* Center V-Score */}
      <circle cx={cx} cy={cy} r={35} fill="var(--ink)" />
      <circle cx={cx} cy={cy} r={33} fill="none" stroke={tierColor} strokeWidth={1} opacity={0.3} />
      <text
        x={cx} y={cy - 4}
        textAnchor="middle"
        fill={tierColor}
        fontSize={28}
        fontWeight={700}
        fontFamily="system-ui"
        style={{ letterSpacing: '-0.04em', filter: `drop-shadow(0 0 12px ${tierColor})` }}
      >
        {vscore}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="white" fontSize={7} opacity={0.35} letterSpacing={2} fontFamily="monospace">
        V-SCORE
      </text>

      {/* Hovered label */}
      {hovered && (
        <g>
          <text
            x={cx} y={cy + 42}
            textAnchor="middle"
            fill={RING_META[hovered as keyof typeof RING_META]?.color}
            fontSize={9}
            letterSpacing={2}
            fontFamily="monospace"
            opacity={0.8}
          >
            {hovered.toUpperCase()}  {rings[hovered]}
          </text>
        </g>
      )}
    </svg>
  )
}
