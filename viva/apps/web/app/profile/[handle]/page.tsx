'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { users as usersApi, feed as feedApi, dating as datingApi, tokens as tokensApi, messages as messagesApi } from '@/lib/api'
import { useAppStore, RING_META, TIER_META, mockUser } from '@/lib/store'

// ─── Animated SVG ring ────────────────────────────────────────────────────────
function VScoreRing({ vscore, color, size = 200 }: { vscore: number; color: string; size?: number }) {
  const [animated, setAnimated] = useState(false)
  const r = size * 0.42
  const circ = 2 * Math.PI * r
  const fill = animated ? (vscore / 1000) * circ : 0
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t) }, [])
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      {/* Fill — animated */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
      {/* Inner rings */}
      {[0.32, 0.22].map((rf, i) => {
        const ri = size * rf
        const ci = 2 * Math.PI * ri
        const fi = animated ? (vscore / 1000) * ci * (0.85 - i * 0.12) : 0
        return (
          <circle key={i} cx={size/2} cy={size/2} r={ri} fill="none"
            stroke={color} strokeWidth={3 - i} strokeLinecap="round" opacity={0.35 - i * 0.1}
            strokeDasharray={`${fi} ${ci}`}
            strokeDashoffset={ci * 0.25}
            style={{ transition: `stroke-dasharray ${1.2 + i * 0.2}s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s` }}
          />
        )
      })}
      {/* Center label */}
      <text x={size/2} y={size/2 - 6} textAnchor="middle" fill={color} fontSize={size * 0.18} fontWeight="900" fontFamily="monospace" letterSpacing="-2">{vscore}</text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" fill={color} fontSize={size * 0.07} fontWeight="600" opacity={0.6} letterSpacing="3">VSCORE</text>
    </svg>
  )
}

// ─── Mock augment data (investment + advertising layer) ────────────────────
const MOCK_INVESTORS = [
  { handle: 'luna_v', avatar: null, amount: 2400, pnl: +18.4, tier: 'guardian' },
  { handle: 'aisham', avatar: null, amount: 1800, pnl: +9.2, tier: 'proven' },
  { handle: 'zerov', avatar: null, amount: 950, pnl: -3.1, tier: 'seeker' },
  { handle: 'noa_d', avatar: null, amount: 620, pnl: +5.7, tier: 'proven' },
]
const MOCK_ADS = [
  { id: 'ad1', brand: 'BioSync Labs', tagline: 'Optimize your sleep protocol', color: '#34d399', cta: 'Learn more', budget: 1200 },
  { id: 'ad2', brand: 'SovereignStack', tagline: 'ZK identity for the sovereign human', color: '#818cf8', cta: 'Try free', budget: 800 },
]
const MOCK_MARKET = {
  title: 'V-Score will cross 900 by Q3 2026',
  yesStake: 12400,
  noStake: 3800,
  myPosition: null as 'YES' | 'NO' | null,
}
const MOCK_MILESTONES = [
  { label: 'Guardian Tier', done: true, date: '2025-11' },
  { label: 'V-Score 800', done: true, date: '2025-12' },
  { label: 'V-Score 900', done: false, date: '2026-Q3' },
  { label: 'Top 1% global', done: false, date: '2027' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 40, color = '#7c3aed' }: { src?: string; name: string; size?: number; color?: string }) {
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold"
      style={{ width: size, height: size, background: src ? 'transparent' : `${color}20`, border: `1.5px solid ${color}40`, color, fontSize: size * 0.4 }}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : name?.[0]?.toUpperCase()}
    </div>
  )
}

function RingBar({ k, val }: { k: string; val: number }) {
  const meta = RING_META[k as keyof typeof RING_META]
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-16 flex-shrink-0 text-white/40">{meta.label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${val}%`, background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})` }} />
      </div>
      <span className="font-mono text-xs w-7 text-right" style={{ color: meta.color }}>{val}</span>
    </div>
  )
}

type Tab = 'posts' | 'invest' | 'market' | 'advertise'

// ─── Tab: Posts ───────────────────────────────────────────────────────────────
function PostsTab({ posts, isOwn }: { posts: any[]; isOwn: boolean }) {
  if (!posts.length) return (
    <div className="py-16 text-center">
      <p className="text-4xl mb-3 opacity-20">◈</p>
      <p className="text-sm text-white/30">No posts yet</p>
      {isOwn && <a href="/feed" className="block mt-3 text-xs text-white/40 hover:text-white/70 underline">Write your first post</a>}
    </div>
  )
  return (
    <div className="space-y-2">
      {posts.map((p: any) => (
        <div key={p.id} className="p-4 rounded-xl border border-white/6 hover:border-white/12 transition-all"
          style={{ background: 'rgba(255,255,255,0.015)' }}>
          <p className="text-sm text-white/80 leading-relaxed">{p.content}</p>
          <div className="flex gap-4 mt-2.5 text-xs text-white/25">
            <span>♡ {p._count?.likes ?? p.likesCount ?? 0}</span>
            <span>💬 {p._count?.comments ?? p.commentsCount ?? 0}</span>
            <span className="ml-auto">{new Date(p.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Invest ──────────────────────────────────────────────────────────────
function InvestTab({ profile, tier }: { profile: any; tier: any }) {
  const [amount, setAmount] = useState('')
  const [bought, setBought] = useState(false)
  const [buying, setBuying] = useState(false)
  const [token, setToken] = useState<any>(null)
  const total = MOCK_INVESTORS.reduce((s, i) => s + i.amount, 0)
  const price = token?.price ?? profile.tokenPrice ?? 0.0012
  const symbol = token?.symbol ?? profile.tokenSymbol ?? profile.handle?.toUpperCase().slice(0, 4)
  const supply = token?.supply ?? profile.tokenSupply ?? 10000
  const marketCap = price * supply

  useEffect(() => {
    // Try fetching all tokens, find this user's
    tokensApi.list().then((list: any[]) => {
      const found = list.find((t: any) => t.ownerId === profile.id || t.symbol === (profile.tokenSymbol ?? profile.handle?.toUpperCase().slice(0,4)))
      if (found) setToken(found)
    }).catch(() => {})
  }, [profile.id])

  async function buy() {
    if (!amount || isNaN(Number(amount))) return
    setBuying(true)
    try {
      if (token) {
        await tokensApi.buy(token.id, Math.floor(Number(amount) / price))
      } else {
        await new Promise(r => setTimeout(r, 900))
      }
      setBought(true)
    } catch {
      setBought(true) // optimistic
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Token card */}
      <div className="p-5 rounded-2xl border" style={{ background: `linear-gradient(135deg, ${tier.color}08, rgba(255,255,255,0.02))`, borderColor: `${tier.color}20` }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/40 mb-0.5">YOUTOKEN</p>
            <p className="text-2xl font-bold font-mono" style={{ color: tier.color }}>${symbol}</p>
            <p className="text-xs text-white/40 mt-0.5">{profile.displayName}'s sovereign asset</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono" style={{ color: tier.color }}>${price.toFixed(4)}</p>
            <p className="text-xs text-green-400 mt-0.5">↑ +12.4% 7d</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Market Cap', val: `$${marketCap.toFixed(0)}` },
            { label: 'Investors', val: MOCK_INVESTORS.length },
            { label: 'Total Staked', val: `$${(total / 1000).toFixed(1)}K` },
          ].map(s => (
            <div key={s.label} className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs text-white/35 mb-1">{s.label}</p>
              <p className="font-bold text-sm text-white/85">{s.val}</p>
            </div>
          ))}
        </div>
        {/* Mini price chart bars */}
        <div className="flex items-end gap-0.5 h-8 mb-4">
          {[40,52,48,60,55,70,65,72,68,80,76,88,82,90,87,95,89,100].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${h}%`, background: i === 17 ? tier.color : `${tier.color}40` }} />
          ))}
        </div>
        {/* Buy */}
        {!bought ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="w-full pl-6 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-white/25 font-mono" />
            </div>
            <button onClick={buy} disabled={buying || !amount}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: `${tier.color}25`, border: `1px solid ${tier.color}50`, color: tier.color }}>
              {buying ? '…' : `Buy $${symbol}`}
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-sm text-green-400">✓ Invested — you now hold $${symbol}</div>
        )}
      </div>

      {/* Investors list */}
      <div>
        <p className="text-xs text-white/35 mb-3 tracking-wider">TOP INVESTORS</p>
        <div className="space-y-2">
          {MOCK_INVESTORS.map((inv, i) => {
            const t = TIER_META[inv.tier as keyof typeof TIER_META] ?? TIER_META.seed
            return (
              <div key={inv.handle} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <span className="text-xs text-white/20 w-4">{i + 1}</span>
                <Avatar name={inv.handle} size={32} color={t.color} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/80">@{inv.handle}</p>
                  <p className="text-xs text-white/35">${inv.amount.toLocaleString()} invested</p>
                </div>
                <span className={`text-xs font-mono font-semibold ${inv.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {inv.pnl >= 0 ? '+' : ''}{inv.pnl}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Market ──────────────────────────────────────────────────────────────
function MarketTab({ profile, tier }: { profile: any; tier: any }) {
  const [market, setMarket] = useState(MOCK_MARKET)
  const [staking, setStaking] = useState(false)
  const total = market.yesStake + market.noStake
  const yesPct = Math.round((market.yesStake / total) * 100)

  async function stake(side: 'YES' | 'NO') {
    setStaking(true)
    await new Promise(r => setTimeout(r, 700))
    setMarket(m => ({ ...m, myPosition: side, [`${side === 'YES' ? 'yes' : 'no'}Stake`]: (side === 'YES' ? m.yesStake : m.noStake) + 100 }))
    setStaking(false)
  }

  return (
    <div className="space-y-5">
      {/* V-Score trajectory market */}
      <div className="p-5 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="text-xs text-white/35 mb-2 tracking-wider">VIVA TRAJECTORY MARKET</p>
        <p className="text-base font-semibold text-white/85 leading-snug mb-4">"{market.title}"</p>

        {/* Odds bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-green-400 font-mono w-10">{yesPct}%</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${yesPct}%`, background: 'linear-gradient(90deg, #34d399, #22c55e)' }} />
          </div>
          <span className="text-xs text-red-400 font-mono w-10 text-right">{100 - yesPct}%</span>
        </div>
        <div className="flex justify-between text-xs text-white/30 mb-5">
          <span>YES — ${(market.yesStake / 1000).toFixed(1)}K staked</span>
          <span>NO — ${(market.noStake / 1000).toFixed(1)}K staked</span>
        </div>

        {/* Stake buttons */}
        {!market.myPosition ? (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => stake('YES')} disabled={staking}
              className="py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}>
              {staking ? '…' : '↑ Stake YES'}
            </button>
            <button onClick={() => stake('NO')} disabled={staking}
              className="py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}>
              {staking ? '…' : '↓ Stake NO'}
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-sm font-semibold"
            style={{ color: market.myPosition === 'YES' ? '#34d399' : '#f87171' }}>
            You staked {market.myPosition} — position active
          </div>
        )}
      </div>

      {/* Milestones */}
      <div>
        <p className="text-xs text-white/35 mb-3 tracking-wider">MILESTONES</p>
        <div className="space-y-2">
          {MOCK_MILESTONES.map((m, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
              style={{ background: m.done ? `${tier.color}06` : 'rgba(255,255,255,0.01)', opacity: m.done ? 1 : 0.6 }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                style={{ background: m.done ? `${tier.color}20` : 'rgba(255,255,255,0.05)', color: m.done ? tier.color : 'rgba(255,255,255,0.3)', border: `1px solid ${m.done ? `${tier.color}40` : 'rgba(255,255,255,0.08)'}` }}>
                {m.done ? '✓' : '○'}
              </div>
              <p className="flex-1 text-sm text-white/75">{m.label}</p>
              <span className="text-xs text-white/25">{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Advertise ───────────────────────────────────────────────────────────
function AdvertiseTab({ profile, tier }: { profile: any; tier: any }) {
  const [showForm, setShowForm] = useState(false)
  const [brand, setBrand] = useState('')
  const [tagline, setTagline] = useState('')
  const [budget, setBudget] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const cpmRate = Math.round(profile.vScore ?? 820 / 10) // higher V-Score = higher ad rate
  const reach = Math.round((profile.vScore ?? 820) * 4.2)

  async function submit() {
    if (!brand || !tagline || !budget) return
    setSubmitted(true)
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Est. Reach', val: `${(reach / 1000).toFixed(1)}K` },
          { label: 'CPM Rate', val: `$${cpmRate}` },
          { label: 'Ad Slots', val: '2 / 5' },
        ].map(s => (
          <div key={s.label} className="text-center p-3 rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs text-white/35 mb-1">{s.label}</p>
            <p className="font-bold text-white/85">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Why advertise here */}
      <div className="p-4 rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <p className="text-xs text-white/35 mb-2 tracking-wider">WHY ADVERTISE ON @{profile.handle}</p>
        <p className="text-sm text-white/60 leading-relaxed">
          V-Score <span className="text-white/85 font-semibold">{profile.vScore ?? 820}</span> — <span style={{ color: tier.color }}>{tier.label}</span> tier.
          High-trust sovereign audience. Health, wealth, and identity verticals.
          Guaranteed native placement in feed — no banner blindness.
        </p>
      </div>

      {/* Active ads */}
      <div>
        <p className="text-xs text-white/35 mb-3 tracking-wider">ACTIVE SPONSORS</p>
        <div className="space-y-2">
          {MOCK_ADS.map(ad => (
            <div key={ad.id} className="flex items-center gap-3 p-4 rounded-xl border transition-all"
              style={{ background: `${ad.color}06`, borderColor: `${ad.color}20` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs"
                style={{ background: `${ad.color}15`, color: ad.color, border: `1px solid ${ad.color}30` }}>
                {ad.brand[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/85">{ad.brand}</p>
                <p className="text-xs text-white/45 mt-0.5">{ad.tagline}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-mono" style={{ color: ad.color }}>${ad.budget}</p>
                <p className="text-xs text-white/25 mt-0.5">budget</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Place ad form */}
      {!submitted ? (
        <div>
          <button onClick={() => setShowForm(!showForm)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)', color: 'var(--v)' }}>
            {showForm ? 'Cancel' : `+ Place Ad on @${profile.handle}'s Profile`}
          </button>
          {showForm && (
            <div className="mt-4 space-y-3 p-4 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand / Company name"
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/4 text-white text-sm outline-none focus:border-white/25 placeholder-white/25" />
              <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Ad tagline (max 60 chars)"
                maxLength={60}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/4 text-white text-sm outline-none focus:border-white/25 placeholder-white/25" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Monthly budget"
                  className="w-full pl-6 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/4 text-white text-sm outline-none focus:border-white/25 font-mono placeholder-white/25" />
              </div>
              <button onClick={submit} disabled={!brand || !tagline || !budget}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.5)', color: 'var(--v)' }}>
                Submit Proposal →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-green-400">✓ Proposal submitted — @{profile.handle} will review</div>
      )}
    </div>
  )
}

// ─── Main Profile Page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>()
  const router = useRouter()
  const { user: me } = useAppStore()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('posts')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  const isOwn = me?.handle === handle

  useEffect(() => {
    if (!handle) return
    Promise.all([
      usersApi.get(handle as string),
      feedApi.list().then(r => r.posts),
    ]).then(([user, allPosts]) => {
      setProfile(user)
      setPosts(allPosts.filter((p: any) => p.author?.handle === handle || p.authorId === user.id).slice(0, 12))
    }).catch(() => setError('User not found'))
      .finally(() => setLoading(false))
  }, [handle])

  async function handleConnect() {
    if (!profile) return
    setConnecting(true)
    try { await datingApi.connect(profile.id); setConnected(true) }
    catch { setConnected(true) }
    finally { setConnecting(false) }
  }

  async function handleMessage() {
    if (!profile) return
    setMessaging(true)
    try {
      const thread = await messagesApi.createThread(profile.id)
      router.push(`/messages?thread=${thread.id}`)
    } catch { router.push('/messages') }
    finally { setMessaging(false) }
  }

  function share() {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
    </div>
  )

  if (error || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--ink)' }}>
      <p className="text-5xl mb-2 opacity-20">◈</p>
      <p className="text-white/50 text-sm">Profile not found</p>
      <button onClick={() => router.back()} className="text-xs text-white/40 hover:text-white underline mt-2">← Back</button>
    </div>
  )

  const tier = TIER_META[profile.tier as keyof typeof TIER_META] ?? TIER_META.seed
  const rings = {
    sleep: profile.sleepRing ?? 72,
    nutrition: profile.nutritionRing ?? 68,
    activity: profile.activityRing ?? 81,
    social: profile.socialRing ?? 65,
    wealth: profile.wealthRing ?? 77,
  }
  const vscore = profile.vScore ?? profile.vscore ?? 820
  const symbol = profile.tokenSymbol ?? profile.handle?.toUpperCase().slice(0, 4)
  const price = profile.tokenPrice ?? 0.0012
  const investors = MOCK_INVESTORS.length
  const totalInvested = MOCK_INVESTORS.reduce((s, i) => s + i.amount, 0)

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'posts', label: 'Posts', icon: '▤' },
    { id: 'invest', label: 'Invest', icon: '↗' },
    { id: 'market', label: 'Market', icon: '◈' },
    { id: 'advertise', label: 'Advertise', icon: '⊕' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Nav bar */}
      <header ref={headerRef} className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3.5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">{profile.displayName}</p>
          <p className="text-xs text-white/35">@{profile.handle} · {posts.length} posts</p>
        </div>
        <button onClick={share} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white relative">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </svg>
          {shareToast && (
            <span className="absolute -bottom-7 right-0 text-xs bg-white/10 text-white/70 px-2 py-1 rounded-lg whitespace-nowrap">Copied!</span>
          )}
        </button>
        {isOwn && (
          <a href="/settings" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </a>
        )}
      </header>

      {/* Cover + avatar */}
      <div className="relative">
        {/* Cover banner */}
        <div className="h-44 sm:h-56 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${tier.color}18 0%, rgba(4,4,10,0) 60%, rgba(124,58,237,0.12) 100%)` }}>
          {/* Animated V-Score ring — center cover */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.18 }}>
            <VScoreRing vscore={vscore} color={tier.color} size={260} />
          </div>
          {/* Property value strip — top left */}
          <div className="absolute left-4 top-4">
            <p className="text-xs text-white/20 tracking-widest uppercase">Property Value</p>
            <p className="font-black font-mono leading-none text-2xl sm:text-3xl" style={{ color: `${tier.color}90`, letterSpacing: '-0.04em' }}>
              ${((price * (profile.tokenSupply ?? 10000)) + totalInvested).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          {/* V-Score watermark right */}
          <div className="absolute right-4 top-4 text-right">
            <p className="text-xs text-white/20 tracking-widest">V-SCORE</p>
            <p className="font-black font-mono leading-none" style={{ fontSize: 'clamp(2rem,8vw,4rem)', color: `${tier.color}30`, letterSpacing: '-0.04em' }}>{vscore}</p>
          </div>
        </div>

        {/* Avatar — overlapping cover */}
        <div className="absolute left-5 -bottom-12 sm:-bottom-14">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4"
              style={{ borderColor: 'var(--ink)', background: `${tier.color}15` }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center font-black text-3xl sm:text-4xl" style={{ color: tier.color }}>
                    {profile.displayName?.[0]?.toUpperCase()}
                  </div>
              }
            </div>
            {/* Tier badge */}
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: tier.color, color: '#04040A', fontSize: '0.55rem', letterSpacing: '0.05em' }}>
              {tier.label.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Profile info block */}
      <div className="px-5 pt-16 sm:pt-18 pb-4">
        {/* Name + actions row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-xl sm:text-2xl text-white leading-tight" style={{ letterSpacing: '-0.03em' }}>
              {profile.displayName}
            </h1>
            <p className="text-sm text-white/40 mt-0.5">@{profile.handle}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            {!isOwn && (
              <>
                <button onClick={handleMessage} disabled={messaging}
                  className="p-2 rounded-xl border border-white/12 text-white/50 hover:text-white hover:border-white/25 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </button>
                <button onClick={() => setFollowed(!followed)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: followed ? 'rgba(255,255,255,0.06)' : `${tier.color}20`,
                    border: `1px solid ${followed ? 'rgba(255,255,255,0.1)' : `${tier.color}50`}`,
                    color: followed ? 'rgba(255,255,255,0.5)' : tier.color,
                  }}>
                  {followed ? 'Following' : 'Follow'}
                </button>
              </>
            )}
            {isOwn && (
              <a href="/settings" className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/12 text-white/60 hover:border-white/25 hover:text-white transition-all">
                Edit profile
              </a>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-white/65 leading-relaxed mt-3">{profile.bio}</p>
        )}

        {/* Stat pills row */}
        <div className="flex gap-4 mt-4 text-sm">
          <div>
            <span className="font-bold text-white/90">{posts.length}</span>
            <span className="text-white/35 ml-1.5">posts</span>
          </div>
          <div>
            <span className="font-bold text-white/90">{investors}</span>
            <span className="text-white/35 ml-1.5">investors</span>
          </div>
          <div>
            <span className="font-bold text-white/90">${(totalInvested / 1000).toFixed(1)}K</span>
            <span className="text-white/35 ml-1.5">invested</span>
          </div>
        </div>

        {/* YouToken + V-Score strip */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl border border-white/6" style={{ background: `${tier.color}06` }}>
            <span className="text-xs font-mono font-bold" style={{ color: tier.color }}>${symbol}</span>
            <span className="text-xs text-white/40">{price.toFixed(4)}</span>
            <span className="text-xs text-green-400 ml-auto">↑ 12.4%</span>
          </div>
          <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-xs text-white/35">V-Score</span>
            <span className="text-sm font-black font-mono ml-auto" style={{ color: tier.color }}>{vscore}</span>
          </div>
        </div>

        {/* Rings (compact) */}
        <div className="mt-4 space-y-2">
          {Object.entries(rings).map(([k, v]) => <RingBar key={k} k={k} val={v as number} />)}
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[57px] z-10 border-b border-white/5 px-5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all"
              style={{
                borderBottomColor: tab === t.id ? tier.color : 'transparent',
                color: tab === t.id ? tier.color : 'rgba(255,255,255,0.35)',
              }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-5 py-5 max-w-2xl mx-auto">
        {tab === 'posts' && <PostsTab posts={posts} isOwn={isOwn} />}
        {tab === 'invest' && <InvestTab profile={{ ...profile, vScore: vscore, tokenSymbol: symbol, tokenPrice: price }} tier={tier} />}
        {tab === 'market' && <MarketTab profile={{ ...profile, vScore: vscore }} tier={tier} />}
        {tab === 'advertise' && <AdvertiseTab profile={{ ...profile, vScore: vscore }} tier={tier} />}
      </div>
    </div>
  )
}
