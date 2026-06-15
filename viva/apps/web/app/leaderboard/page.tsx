'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { users as usersApi } from '@/lib/api'
import { TIER_META } from '@/lib/store'

// ─── Mock top performers (real API augmented) ──────────────────────────────
const MOCK_LEADERS = [
  { handle: 'sovereign_v', displayName: 'Sovereign V', vScore: 980, tier: 'guardian', sleepRing: 95, nutritionRing: 92, activityRing: 98, socialRing: 88, wealthRing: 94, tokenPrice: 0.0089, tokenSymbol: 'SOVV', change7d: +24.1 },
  { handle: 'luna_apex', displayName: 'Luna Apex', vScore: 962, tier: 'guardian', sleepRing: 91, nutritionRing: 89, activityRing: 96, socialRing: 94, wealthRing: 87, tokenPrice: 0.0072, tokenSymbol: 'LUNA', change7d: +18.3 },
  { handle: 'zeronode', displayName: 'ZeroNode', vScore: 941, tier: 'guardian', sleepRing: 88, nutritionRing: 94, activityRing: 90, socialRing: 82, wealthRing: 96, tokenPrice: 0.0061, tokenSymbol: 'ZERO', change7d: +12.7 },
  { handle: 'aisham_x', displayName: 'Aisham X', vScore: 928, tier: 'proven', sleepRing: 85, nutritionRing: 88, activityRing: 92, socialRing: 90, wealthRing: 83, tokenPrice: 0.0048, tokenSymbol: 'AISH', change7d: +9.2 },
  { handle: 'noa_delta', displayName: 'Noa Delta', vScore: 912, tier: 'proven', sleepRing: 82, nutritionRing: 86, activityRing: 89, socialRing: 78, wealthRing: 91, tokenPrice: 0.0041, tokenSymbol: 'NOAD', change7d: +7.8 },
  { handle: 'vaultman', displayName: 'Vaultman', vScore: 897, tier: 'proven', sleepRing: 79, nutritionRing: 83, activityRing: 87, socialRing: 85, wealthRing: 94, tokenPrice: 0.0035, tokenSymbol: 'VLTM', change7d: +5.4 },
  { handle: 'biophile', displayName: 'BioPhile', vScore: 881, tier: 'proven', sleepRing: 93, nutritionRing: 91, activityRing: 88, socialRing: 71, wealthRing: 72, tokenPrice: 0.0028, tokenSymbol: 'BIOP', change7d: +3.1 },
  { handle: 'zkproof', displayName: 'ZK Proof', vScore: 865, tier: 'seeker', sleepRing: 76, nutritionRing: 80, activityRing: 85, socialRing: 88, wealthRing: 75, tokenPrice: 0.0022, tokenSymbol: 'ZKPR', change7d: -1.2 },
  { handle: 'mintseeker', displayName: 'MintSeeker', vScore: 849, tier: 'seeker', sleepRing: 74, nutritionRing: 77, activityRing: 82, socialRing: 80, wealthRing: 78, tokenPrice: 0.0019, tokenSymbol: 'MINT', change7d: +2.0 },
  { handle: 'chronos88', displayName: 'Chronos88', vScore: 831, tier: 'seeker', sleepRing: 72, nutritionRing: 75, activityRing: 79, socialRing: 76, wealthRing: 80, tokenPrice: 0.0016, tokenSymbol: 'CHRN', change7d: -0.4 },
]

type Category = 'vscore' | 'sleep' | 'wealth' | 'activity' | 'token'

const CATEGORIES: { id: Category; label: string; icon: string; color: string; key: string }[] = [
  { id: 'vscore',   label: 'V-Score',  icon: '◈', color: 'var(--v)',              key: 'vScore' },
  { id: 'sleep',    label: 'Sleep',    icon: '◑', color: 'var(--ring-sleep)',     key: 'sleepRing' },
  { id: 'activity', label: 'Activity', icon: '◎', color: 'var(--ring-activity)',  key: 'activityRing' },
  { id: 'wealth',   label: 'Wealth',   icon: '↗', color: 'var(--ring-wealth)',    key: 'wealthRing' },
  { id: 'token',    label: 'Token',    icon: '$', color: '#34d399',               key: 'tokenPrice' },
]

function MiniRing({ value, color, size = 32 }: { value: number; color: string; size?: number }) {
  const r = size * 0.4
  const circ = 2 * Math.PI * r
  const fill = (value / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`} strokeDashoffset={circ * 0.25}
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
      />
    </svg>
  )
}

function Crown({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">👑</span>
  if (rank === 2) return <span className="text-base opacity-60">🥈</span>
  if (rank === 3) return <span className="text-base opacity-60">🥉</span>
  return <span className="text-xs font-mono text-white/25 w-5 text-right">{rank}</span>
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [category, setCategory] = useState<Category>('vscore')
  const [leaders, setLeaders] = useState(MOCK_LEADERS)
  const [realUsers, setRealUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cat = CATEGORIES.find(c => c.id === category)!

  useEffect(() => {
    usersApi.search().then((us: any[]) => {
      if (us.length > 0) {
        // Merge real users at top, augmented with mock fields
        const merged = us.map((u: any, i: number) => ({
          ...MOCK_LEADERS[i % MOCK_LEADERS.length],
          ...u,
          vScore: u.vScore ?? u.vscore ?? MOCK_LEADERS[i]?.vScore ?? 800,
          handle: u.handle,
          displayName: u.displayName,
          tier: u.tier ?? 'seed',
        }))
        setRealUsers(merged)
      }
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const source = realUsers.length > 0
    ? [...realUsers, ...MOCK_LEADERS.slice(realUsers.length)]
    : MOCK_LEADERS

  const sorted = [...source].sort((a, b) => {
    const key = cat.key as keyof typeof a
    return (Number(b[key]) || 0) - (Number(a[key]) || 0)
  })

  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3.5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <p className="font-semibold text-sm text-white">Leaderboard</p>
          <p className="text-xs text-white/30">Top VIVA citizens by {cat.label}</p>
        </div>
      </header>

      {/* Category tabs */}
      <div className="px-4 pt-4 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: category === c.id ? `${c.color}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${category === c.id ? `${c.color}40` : 'rgba(255,255,255,0.06)'}`,
                color: category === c.id ? c.color : 'rgba(255,255,255,0.45)',
              }}>
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 max-w-2xl mx-auto">
        {/* Podium — top 3 */}
        <div className="flex items-end justify-center gap-3 py-8">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-black text-xl"
              style={{ borderColor: 'rgba(255,255,255,0.15)', background: TIER_META[top3[1]?.tier as keyof typeof TIER_META]?.color + '18' || '#7c3aed18' }}>
              {top3[1]?.avatarUrl
                ? <img src={top3[1].avatarUrl} className="w-full h-full object-cover" alt="" />
                : <span style={{ color: TIER_META[top3[1]?.tier as keyof typeof TIER_META]?.color || '#7c3aed' }}>{top3[1]?.displayName?.[0]}</span>
              }
            </div>
            <p className="text-xs text-white/60 text-center truncate w-full">{top3[1]?.displayName}</p>
            <div className="w-full rounded-t-xl py-4 text-center text-xs text-white/40" style={{ background: 'rgba(255,255,255,0.04)', minHeight: 48 }}>
              🥈 2nd
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-black text-2xl"
                style={{ borderColor: cat.color, background: TIER_META[top3[0]?.tier as keyof typeof TIER_META]?.color + '20' || '#7c3aed20', boxShadow: `0 0 24px ${cat.color}40` }}>
                {top3[0]?.avatarUrl
                  ? <img src={top3[0].avatarUrl} className="w-full h-full object-cover" alt="" />
                  : <span style={{ color: cat.color }}>{top3[0]?.displayName?.[0]}</span>
                }
              </div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl">👑</div>
            </div>
            <p className="text-xs font-semibold text-white text-center truncate w-full">{top3[0]?.displayName}</p>
            <div className="w-full rounded-t-xl py-5 text-center" style={{ background: `${cat.color}12`, minHeight: 64, border: `1px solid ${cat.color}20`, borderBottom: 'none' }}>
              <p className="text-sm font-black font-mono" style={{ color: cat.color }}>
                {category === 'token' ? `$${top3[0]?.tokenPrice?.toFixed(4)}` : top3[0]?.[cat.key as keyof typeof top3[0]]}
              </p>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-black text-xl"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: TIER_META[top3[2]?.tier as keyof typeof TIER_META]?.color + '18' || '#7c3aed18' }}>
              {top3[2]?.avatarUrl
                ? <img src={top3[2].avatarUrl} className="w-full h-full object-cover" alt="" />
                : <span style={{ color: TIER_META[top3[2]?.tier as keyof typeof TIER_META]?.color || '#7c3aed' }}>{top3[2]?.displayName?.[0]}</span>
              }
            </div>
            <p className="text-xs text-white/60 text-center truncate w-full">{top3[2]?.displayName}</p>
            <div className="w-full rounded-t-xl py-3 text-center text-xs text-white/40" style={{ background: 'rgba(255,255,255,0.03)', minHeight: 36 }}>
              🥉 3rd
            </div>
          </div>
        </div>

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {rest.map((u, i) => {
            const tier = TIER_META[u.tier as keyof typeof TIER_META] ?? TIER_META.seed
            const val = category === 'token'
              ? `$${Number(u.tokenPrice ?? 0).toFixed(4)}`
              : String(u[cat.key as keyof typeof u] ?? 0)
            const change = u.change7d ?? 0
            return (
              <button key={u.handle} onClick={() => router.push(`/profile/${u.handle}`)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-white/5 hover:border-white/12 transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <Crown rank={i + 4} />
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}25` }}>
                  {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" /> : u.displayName?.[0]}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/85 truncate">{u.displayName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/30">@{u.handle}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${tier.color}12`, color: tier.color, fontSize: '0.55rem', fontWeight: 700 }}>
                      {tier.label.toUpperCase()}
                    </span>
                  </div>
                </div>
                {/* Ring bars mini */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <MiniRing value={Number(u[cat.key as keyof typeof u]) || 50} color={cat.color} size={28} />
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono" style={{ color: cat.color }}>{val}</p>
                    <p className={`text-xs font-mono ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Join CTA */}
        <div className="mt-8 p-5 rounded-2xl border border-white/8 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-sm font-semibold text-white/70 mb-1">Climb the ranks</p>
          <p className="text-xs text-white/35 mb-4">Log health rings daily to increase your V-Score and token value</p>
          <div className="flex gap-2 justify-center">
            <a href="/health" className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.4)', color: 'var(--v)' }}>
              Log Health Ring
            </a>
            <a href="/feed" className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              Post to Feed
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
