'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type LeaderType = 'earners' | 'stakers' | 'creators' | 'investors'
type Period = 'day' | 'week' | 'month' | 'all'

interface LeaderEntry {
  rank: number
  handle: string
  name: string
  color: string
  verified: boolean
  value: number
  valueLabel: string
  change: number
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | null
  badge?: string
}

const TYPE_META: Record<LeaderType, { label: string; icon: string; color: string; unit: string; desc: string }> = {
  earners:   { label: 'Top Earners',    icon: '💰', color: '#22c55e', unit: '$',     desc: 'Highest total earnings on VIVA' },
  stakers:   { label: 'Top Stakers',    icon: '🔒', color: '#a855f7', unit: 'tokens', desc: 'Most tokens staked across all creators' },
  creators:  { label: 'Top Creators',   icon: '🎨', color: '#ec4899', unit: 'V',     desc: 'Highest VIVA Score this period' },
  investors: { label: 'Top Investors',  icon: '📈', color: '#f59e0b', unit: '%',     desc: 'Best portfolio return this period' },
}

const EARNERS_DATA: LeaderEntry[] = [
  { rank: 1, handle: 'sovereign_v', name: 'Sovereign V',  color: '#a855f7', verified: true,  value: 142800, valueLabel: '$142.8k', change: 12.4, tier: 'Diamond', badge: '👑' },
  { rank: 2, handle: 'mayafit',     name: 'Maya Chen',    color: '#22c55e', verified: true,  value: 98400,  valueLabel: '$98.4k',  change: 8.1,  tier: 'Diamond' },
  { rank: 3, handle: 'jaxbeats',    name: 'Jax Beats',   color: '#ec4899', verified: true,  value: 76200,  valueLabel: '$76.2k',  change: 21.3, tier: 'Gold'    },
  { rank: 4, handle: 'atlas_k',     name: 'Atlas K',      color: '#818cf8', verified: true,  value: 54100,  valueLabel: '$54.1k',  change: 5.9,  tier: 'Gold'    },
  { rank: 5, handle: 'noa_d',       name: 'Noa D.',       color: '#f59e0b', verified: false, value: 41800,  valueLabel: '$41.8k',  change: 3.2,  tier: 'Silver'  },
  { rank: 6, handle: 'luna_w',      name: 'Luna W.',      color: '#f87171', verified: false, value: 38200,  valueLabel: '$38.2k',  change: -1.4, tier: 'Silver'  },
  { rank: 7, handle: 'kai_r',       name: 'Kai R.',       color: '#22c55e', verified: false, value: 29400,  valueLabel: '$29.4k',  change: 9.8,  tier: 'Bronze'  },
  { rank: 8, handle: 'jade_l',      name: 'Jade L.',      color: '#a855f7', verified: false, value: 24100,  valueLabel: '$24.1k',  change: -2.1, tier: 'Bronze'  },
  { rank: 9, handle: 'dex_n',       name: 'Dex N.',       color: '#818cf8', verified: false, value: 18700,  valueLabel: '$18.7k',  change: 14.5, tier: null      },
  { rank: 10, handle: 'sam_q',      name: 'Sam Q.',       color: '#f59e0b', verified: false, value: 14200,  valueLabel: '$14.2k',  change: 6.3,  tier: null      },
]

const STAKERS_DATA: LeaderEntry[] = [
  { rank: 1, handle: 'atlas_k',  name: 'Atlas K',   color: '#818cf8', verified: true,  value: 4820,  valueLabel: '4,820 tokens', change: 8.0,  tier: 'Diamond', badge: '👑' },
  { rank: 2, handle: 'luna_w',   name: 'Luna W.',   color: '#f87171', verified: false, value: 3610,  valueLabel: '3,610 tokens', change: 12.5, tier: 'Diamond' },
  { rank: 3, handle: 'noa_d',    name: 'Noa D.',    color: '#f59e0b', verified: false, value: 2940,  valueLabel: '2,940 tokens', change: 3.1,  tier: 'Gold'    },
  { rank: 4, handle: 'kai_r',    name: 'Kai R.',    color: '#22c55e', verified: false, value: 1830,  valueLabel: '1,830 tokens', change: -0.8, tier: 'Gold'    },
  { rank: 5, handle: 'jade_l',   name: 'Jade L.',   color: '#a855f7', verified: false, value: 1420,  valueLabel: '1,420 tokens', change: 5.7,  tier: 'Silver'  },
]

const CREATORS_DATA: LeaderEntry[] = [
  { rank: 1, handle: 'sovereign_v', name: 'Sovereign V', color: '#a855f7', verified: true,  value: 9840, valueLabel: '9,840 V', change: 4.2,  tier: 'Diamond', badge: '👑' },
  { rank: 2, handle: 'mayafit',     name: 'Maya Chen',   color: '#22c55e', verified: true,  value: 8720, valueLabel: '8,720 V', change: 2.8,  tier: 'Diamond' },
  { rank: 3, handle: 'jaxbeats',    name: 'Jax Beats',  color: '#ec4899', verified: true,  value: 7410, valueLabel: '7,410 V', change: 11.4, tier: 'Gold'    },
  { rank: 4, handle: 'atlas_k',     name: 'Atlas K',     color: '#818cf8', verified: true,  value: 6180, valueLabel: '6,180 V', change: 1.9,  tier: 'Gold'    },
  { rank: 5, handle: 'noa_d',       name: 'Noa D.',      color: '#f59e0b', verified: false, value: 5240, valueLabel: '5,240 V', change: 7.3,  tier: 'Silver'  },
]

const INVESTORS_DATA: LeaderEntry[] = [
  { rank: 1, handle: 'dex_n',   name: 'Dex N.',   color: '#818cf8', verified: false, value: 284.2, valueLabel: '+284.2%', change: 284.2, tier: 'Gold',    badge: '👑' },
  { rank: 2, handle: 'luna_w',  name: 'Luna W.',  color: '#f87171', verified: false, value: 196.8, valueLabel: '+196.8%', change: 196.8, tier: 'Silver'  },
  { rank: 3, handle: 'kai_r',   name: 'Kai R.',   color: '#22c55e', verified: false, value: 142.4, valueLabel: '+142.4%', change: 142.4, tier: 'Silver'  },
  { rank: 4, handle: 'jade_l',  name: 'Jade L.',  color: '#a855f7', verified: false, value: 98.1,  valueLabel: '+98.1%',  change: 98.1,  tier: 'Bronze'  },
  { rank: 5, handle: 'sam_q',   name: 'Sam Q.',   color: '#f59e0b', verified: false, value: 74.3,  valueLabel: '+74.3%',  change: 74.3,  tier: 'Bronze'  },
]

const DATA_BY_TYPE: Record<LeaderType, LeaderEntry[]> = {
  earners: EARNERS_DATA,
  stakers: STAKERS_DATA,
  creators: CREATORS_DATA,
  investors: INVESTORS_DATA,
}

const TIER_COLOR: Record<string, string> = { Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309' }

const TYPES: LeaderType[] = ['earners', 'stakers', 'creators', 'investors']
const PERIODS: { key: Period; label: string }[] = [
  { key: 'day', label: '24H' }, { key: 'week', label: '7D' }, { key: 'month', label: '30D' }, { key: 'all', label: 'All' },
]

export default function LeaderboardPage() {
  const router = useRouter()
  const params = useParams()
  const rawType = typeof params.type === 'string' ? params.type : 'earners'
  const type: LeaderType = TYPES.includes(rawType as LeaderType) ? (rawType as LeaderType) : 'earners'
  const meta = TYPE_META[type]

  const [period, setPeriod] = useState<Period>('week')
  const entries = DATA_BY_TYPE[type]
  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="font-black text-white">{meta.icon} {meta.label}</div>
            <div className="text-xs text-white/30">{meta.desc}</div>
          </div>
        </div>
        {/* Type tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TYPES.map(t => (
            <button key={t} onClick={() => router.push(`/leaderboard/${t}`)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={t === type
                ? { background: TYPE_META[t].color, color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {TYPE_META[t].icon} {TYPE_META[t].label.split(' ')[1]}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Period */}
        <div className="flex gap-1.5">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={period === p.key ? { background: meta.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Podium top 3 */}
        <div className="flex items-end justify-center gap-3 py-4">
          {/* 2nd */}
          {top3[1] && (
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg"
                style={{ background: `${top3[1].color}18`, color: top3[1].color, border: `2px solid ${TIER_COLOR['Silver']}30` }}>
                {top3[1].name[0]}
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-white/70 truncate max-w-[70px]">{top3[1].name.split(' ')[0]}</div>
                <div className="text-xs font-black" style={{ color: meta.color }}>{top3[1].valueLabel}</div>
              </div>
              <div className="w-full h-14 rounded-t-xl flex items-center justify-center text-lg font-black text-white/40"
                style={{ background: 'rgba(148,163,184,0.1)' }}>2</div>
            </div>
          )}
          {/* 1st */}
          {top3[0] && (
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xl">{top3[0].badge ?? '👑'}</div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl"
                style={{ background: `${top3[0].color}18`, color: top3[0].color, border: `2px solid ${meta.color}50` }}>
                {top3[0].name[0]}
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-white/80 truncate max-w-[80px]">{top3[0].name.split(' ')[0]}</div>
                <div className="text-sm font-black" style={{ color: meta.color }}>{top3[0].valueLabel}</div>
              </div>
              <div className="w-full h-20 rounded-t-xl flex items-center justify-center text-xl font-black"
                style={{ background: `${meta.color}15`, color: meta.color }}>1</div>
            </div>
          )}
          {/* 3rd */}
          {top3[2] && (
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg"
                style={{ background: `${top3[2].color}18`, color: top3[2].color, border: `2px solid ${TIER_COLOR['Bronze']}30` }}>
                {top3[2].name[0]}
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-white/60 truncate max-w-[70px]">{top3[2].name.split(' ')[0]}</div>
                <div className="text-xs font-black" style={{ color: meta.color }}>{top3[2].valueLabel}</div>
              </div>
              <div className="w-full h-10 rounded-t-xl flex items-center justify-center text-lg font-black text-white/30"
                style={{ background: `rgba(${180},${109},${39},0.1)` }}>3</div>
            </div>
          )}
        </div>

        {/* Rest of list */}
        <div className="space-y-2">
          {rest.map(e => (
            <button key={e.handle} onClick={() => router.push(`/profile/${e.handle}`)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <span className="w-6 text-center text-sm font-black text-white/25">#{e.rank}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${e.color}15`, color: e.color }}>
                {e.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/80">{e.name}</span>
                  {e.verified && <span className="text-xs" style={{ color: meta.color }}>✓</span>}
                  {e.tier && <span className="text-xs" style={{ color: TIER_COLOR[e.tier] }}>{e.tier[0]}</span>}
                </div>
                <div className="text-xs text-white/30">@{e.handle}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm" style={{ color: meta.color }}>{e.valueLabel}</div>
                <div className="text-xs" style={{ color: e.change >= 0 ? '#22c55e' : '#f87171' }}>
                  {e.change >= 0 ? '+' : ''}{e.change}%
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Your rank card */}
        <div className="p-3 rounded-2xl border flex items-center gap-3"
          style={{ background: `${meta.color}08`, borderColor: `${meta.color}20` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
            Y
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-white/70">Your Rank</div>
            <div className="text-xs text-white/30">@you</div>
          </div>
          <div className="text-right">
            <div className="font-black text-sm text-white/50">#142</div>
            <div className="text-xs text-white/25">Top 15%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
