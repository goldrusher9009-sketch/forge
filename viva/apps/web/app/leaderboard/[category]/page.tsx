'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CATEGORIES: Record<string, { label: string; icon: string; color: string; metric: string }> = {
  finance:   { label: 'Finance',   icon: '📈', color: '#22c55e', metric: 'Total Returns' },
  health:    { label: 'Health',    icon: '💪', color: '#34d399', metric: 'Streak Days'   },
  music:     { label: 'Music',     icon: '🎵', color: '#ec4899', metric: 'Streams'        },
  gaming:    { label: 'Gaming',    icon: '🎮', color: '#818cf8', metric: 'Win Rate'        },
  tech:      { label: 'Tech',      icon: '💻', color: '#60a5fa', metric: 'Projects Built' },
  art:       { label: 'Art',       icon: '🎨', color: '#c084fc', metric: 'NFTs Sold'       },
  education: { label: 'Education', icon: '📚', color: '#f59e0b', metric: 'Students'        },
  lifestyle: { label: 'Lifestyle', icon: '✨', color: '#f87171', metric: 'Engagement'      },
}

const MOCK_LEADERS = [
  { rank: 1,  handle: 'sovereign_v', name: 'Sovereign V', color: '#a855f7', vscore: 900, followers: 28400, tokenPrice: 8.75, metric: '+284%',  tier: 'Diamond', verified: true  },
  { rank: 2,  handle: 'noa_d',       name: 'Noa D.',      color: '#a855f7', vscore: 860, followers: 22000, tokenPrice: 7.20, metric: '+240%',  tier: 'Diamond', verified: true  },
  { rank: 3,  handle: 'mayafit',     name: 'Maya Chen',   color: '#22c55e', vscore: 780, followers: 14200, tokenPrice: 6.40, metric: '+188%',  tier: 'Gold',    verified: true  },
  { rank: 4,  handle: 'crypto_kat',  name: 'Kat Zhou',    color: '#818cf8', vscore: 720, followers: 11500, tokenPrice: 5.80, metric: '+152%',  tier: 'Gold',    verified: false },
  { rank: 5,  handle: 'atlas_burns', name: 'Atlas Burns', color: '#60a5fa', vscore: 680, followers: 9800,  tokenPrice: 5.10, metric: '+134%',  tier: 'Gold',    verified: false },
  { rank: 6,  handle: 'jaxbeats',    name: 'Jax Beats',   color: '#ec4899', vscore: 650, followers: 8700,  tokenPrice: 4.80, metric: '+118%',  tier: 'Silver',  verified: true  },
  { rank: 7,  handle: 'danr',        name: 'Dan R.',      color: '#34d399', vscore: 600, followers: 6200,  tokenPrice: 4.20, metric: '+98%',   tier: 'Silver',  verified: false },
  { rank: 8,  handle: 'aisham',      name: 'Aisha M.',    color: '#f59e0b', vscore: 580, followers: 5400,  tokenPrice: 3.90, metric: '+87%',   tier: 'Silver',  verified: false },
  { rank: 9,  handle: 'zara_voss',   name: 'Zara Voss',   color: '#f87171', vscore: 540, followers: 4100,  tokenPrice: 3.40, metric: '+74%',   tier: 'Bronze',  verified: false },
  { rank: 10, handle: 'moonset99',   name: 'Moonset',     color: '#22c55e', vscore: 510, followers: 3200,  tokenPrice: 3.10, metric: '+61%',   tier: 'Bronze',  verified: false },
]

const TIER_COLORS: Record<string, string> = {
  Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309',
}

type SortKey = 'vscore' | 'followers' | 'tokenPrice' | 'metric'

export default function CategoryLeaderboardPage() {
  const router = useRouter()
  const params = useParams()
  const category = typeof params.category === 'string' ? params.category : 'finance'
  const cat = CATEGORIES[category] ?? CATEGORIES.finance

  const [sort, setSort] = useState<SortKey>('vscore')
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d')

  const sorted = [...MOCK_LEADERS].sort((a, b) => {
    if (sort === 'vscore')     return b.vscore - a.vscore
    if (sort === 'followers')  return b.followers - a.followers
    if (sort === 'tokenPrice') return b.tokenPrice - a.tokenPrice
    // metric: parse numeric % for sort
    return parseFloat(b.metric) - parseFloat(a.metric)
  }).map((l, i) => ({ ...l, rank: i + 1 }))

  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex-1">
              <div className="font-black text-white">{cat.icon} {cat.label} Leaderboard</div>
              <div className="text-xs text-white/30">Top creators ranked by VScore + engagement</div>
            </div>
          </div>

          {/* Period */}
          <div className="flex gap-1.5 mb-3">
            {(['7d', '30d', 'all'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={period === p ? { background: cat.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {[
              { id: 'vscore' as SortKey,     label: 'V-Score' },
              { id: 'followers' as SortKey,  label: 'Followers' },
              { id: 'tokenPrice' as SortKey, label: 'Token Price' },
              { id: 'metric' as SortKey,     label: cat.metric },
            ].map(s => (
              <button key={s.id} onClick={() => setSort(s.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={sort === s.id ? { background: cat.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Top 3 podium */}
      <div className="px-4 py-5">
        <div className="flex items-end justify-center gap-3 mb-6 h-32">
          {[sorted[1], sorted[0], sorted[2]].map((leader, i) => {
            const isFirst = i === 1
            const medals = ['🥈', '🥇', '🥉']
            const heights = ['h-20', 'h-32', 'h-16']
            return (
              <button key={leader.handle} onClick={() => router.push(`/profile/${leader.handle}`)}
                className={`flex-1 ${heights[i]} rounded-2xl flex flex-col items-center justify-end pb-2 border transition-all`}
                style={{
                  background: isFirst ? `${leader.color}15` : 'rgba(255,255,255,0.03)',
                  borderColor: isFirst ? `${leader.color}30` : 'rgba(255,255,255,0.05)',
                }}>
                <span className="text-lg">{medals[i]}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                  style={{ background: `${leader.color}20`, color: leader.color }}>
                  {leader.name[0]}
                </div>
                <div className="text-xs font-bold text-white/60 mt-1 truncate w-full text-center px-1">{leader.name.split(' ')[0]}</div>
                {sort === 'vscore' && <div className="text-xs font-black mt-0.5" style={{ color: cat.color }}>{leader.vscore}</div>}
                {sort === 'tokenPrice' && <div className="text-xs font-black mt-0.5" style={{ color: cat.color }}>${leader.tokenPrice}</div>}
              </button>
            )
          })}
        </div>

        {/* Full list */}
        <div className="space-y-2">
          {sorted.map(leader => (
            <button key={leader.handle} onClick={() => router.push(`/profile/${leader.handle}`)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl border border-white/4 text-left transition-all hover:bg-white/3"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              {/* Rank */}
              <div className="w-7 font-black text-sm text-center flex-shrink-0"
                style={{ color: leader.rank <= 3 ? cat.color : 'rgba(255,255,255,0.2)' }}>
                #{leader.rank}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${leader.color}18`, color: leader.color, border: `1.5px solid ${leader.color}25` }}>
                {leader.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/85 truncate">{leader.name}</span>
                  {leader.verified && <span className="text-xs" style={{ color: cat.color }}>✓</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: `${TIER_COLORS[leader.tier]}12`, color: TIER_COLORS[leader.tier] }}>
                    {leader.tier[0]}
                  </span>
                </div>
                <div className="text-xs text-white/25">@{leader.handle} · {fmtNum(leader.followers)} followers</div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0 space-y-0.5">
                <div className="font-black text-sm" style={{ color: cat.color }}>
                  {sort === 'vscore'     ? leader.vscore
                   : sort === 'followers'  ? fmtNum(leader.followers)
                   : sort === 'tokenPrice' ? `$${leader.tokenPrice.toFixed(2)}`
                   : leader.metric}
                </div>
                <div className="text-xs text-white/20">
                  {sort !== 'vscore' ? `${leader.vscore} V` : `$${leader.tokenPrice.toFixed(2)}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
