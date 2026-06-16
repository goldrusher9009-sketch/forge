'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Holder {
  rank: number
  handle: string
  name: string
  color: string
  verified: boolean
  tokens: number
  pct: number
  value: number
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze'
  change7d: number
  staked: number
}

const TOKEN_INFO: Record<string, { name: string; color: string; price: number; totalSupply: number; holders: number }> = {
  SVRN: { name: 'Sovereign V', color: '#a855f7', price: 8.75, totalSupply: 100000, holders: 2840 },
  MAYA: { name: 'Maya Chen',   color: '#22c55e', price: 5.20, totalSupply: 80000,  holders: 1620 },
  JAX:  { name: 'Jax Beats',  color: '#ec4899', price: 3.80, totalSupply: 50000,  holders: 980  },
}

const MOCK_HOLDERS: Record<string, Holder[]> = {
  SVRN: [
    { rank: 1,  handle: 'atlas_k',   name: 'Atlas K',    color: '#818cf8', verified: true,  tokens: 1200, pct: 1.20, value: 10500, tier: 'Diamond', change7d:  5.2, staked: 800  },
    { rank: 2,  handle: 'lily_p',    name: 'Lily P.',    color: '#f59e0b', verified: true,  tokens: 980,  pct: 0.98, value: 8575,  tier: 'Diamond', change7d:  2.1, staked: 600  },
    { rank: 3,  handle: 'max_t',     name: 'Max T.',     color: '#ec4899', verified: false, tokens: 720,  pct: 0.72, value: 6300,  tier: 'Diamond', change7d:  0,   staked: 400  },
    { rank: 4,  handle: 'luna_w',    name: 'Luna W.',    color: '#f87171', verified: false, tokens: 580,  pct: 0.58, value: 5075,  tier: 'Diamond', change7d: -1.4, staked: 300  },
    { rank: 5,  handle: 'noa_d',     name: 'Noa D.',     color: '#22c55e', verified: false, tokens: 440,  pct: 0.44, value: 3850,  tier: 'Gold',    change7d:  3.0, staked: 200  },
    { rank: 6,  handle: 'kai_r',     name: 'Kai R.',     color: '#f59e0b', verified: false, tokens: 280,  pct: 0.28, value: 2450,  tier: 'Gold',    change7d: -0.5, staked: 100  },
    { rank: 7,  handle: 'marco_v',   name: 'Marco V.',   color: '#818cf8', verified: false, tokens: 120,  pct: 0.12, value: 1050,  tier: 'Silver',  change7d:  7.1, staked: 0    },
    { rank: 8,  handle: 'jade_l',    name: 'Jade L.',    color: '#a855f7', verified: false, tokens: 85,   pct: 0.09, value: 744,   tier: 'Silver',  change7d:  1.2, staked: 0    },
    { rank: 9,  handle: 'dex_n',     name: 'Dex N.',     color: '#22c55e', verified: false, tokens: 42,   pct: 0.04, value: 368,   tier: 'Bronze',  change7d: -2.0, staked: 0    },
    { rank: 10, handle: 'sam_q',     name: 'Sam Q.',     color: '#f87171', verified: false, tokens: 30,   pct: 0.03, value: 263,   tier: 'Bronze',  change7d:  0.5, staked: 0    },
  ],
}

const TIER_COLOR: Record<string, string> = { Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309' }
const MEDALS = ['🥇', '🥈', '🥉']

type SortKey = 'rank' | 'tokens' | 'staked' | 'change7d'

export default function TokenHoldersPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol : 'SVRN'
  const token = TOKEN_INFO[symbol] ?? TOKEN_INFO.SVRN
  const holders = MOCK_HOLDERS[symbol] ?? MOCK_HOLDERS.SVRN

  const [sort, setSort] = useState<SortKey>('rank')
  const [tierFilter, setTierFilter] = useState<string>('all')

  let list = [...holders]
  if (tierFilter !== 'all') list = list.filter(h => h.tier === tierFilter)
  list.sort((a, b) => {
    if (sort === 'tokens') return b.tokens - a.tokens
    if (sort === 'staked') return b.staked - a.staked
    if (sort === 'change7d') return b.change7d - a.change7d
    return a.rank - b.rank
  })

  const top3 = holders.slice(0, 3)
  const totalStaked = holders.reduce((s, h) => s + h.staked, 0)
  const stakedPct = ((totalStaked / token.totalSupply) * 100).toFixed(1)

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
          <div className="flex-1">
            <div className="font-black text-white">${symbol} Holders</div>
            <div className="text-xs text-white/30">{token.name} · {token.holders.toLocaleString()} holders</div>
          </div>
        </div>
        {/* Tier filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {['all', 'Diamond', 'Gold', 'Silver', 'Bronze'].map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 capitalize"
              style={tierFilter === t
                ? { background: t === 'all' ? token.color : TIER_COLOR[t], color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Holders', value: token.holders.toLocaleString(), color: token.color },
            { label: 'Tokens Staked', value: `${stakedPct}%`, color: '#f59e0b' },
            { label: 'Price', value: `$${token.price}`, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-base" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Top 3 podium */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Top Holders</div>
          <div className="space-y-2">
            {top3.map((h, i) => (
              <button key={h.handle} onClick={() => router.push(`/profile/${h.handle}`)}
                className="w-full flex items-center gap-3 text-left">
                <span className="text-lg w-6 flex-shrink-0">{MEDALS[i]}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: `${h.color}18`, color: h.color }}>
                  {h.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm text-white/80">{h.name}</span>
                    {h.verified && <span className="text-xs" style={{ color: token.color }}>✓</span>}
                  </div>
                  <div className="text-xs" style={{ color: TIER_COLOR[h.tier] }}>{h.tier}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm text-white/70">{h.tokens.toLocaleString()}</div>
                  <div className="text-xs text-white/30">{h.pct}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex gap-1.5">
          {([['rank','Rank'],['tokens','Tokens'],['staked','Staked'],['change7d','7D %']] as [SortKey,string][]).map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={sort === k ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Holder list */}
        <div className="space-y-2">
          {list.map(h => (
            <button key={h.handle} onClick={() => router.push(`/profile/${h.handle}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <span className="text-xs font-black text-white/20 w-5 text-right flex-shrink-0">#{h.rank}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${h.color}18`, color: h.color }}>
                {h.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-white/80">{h.name}</span>
                  {h.verified && <span className="text-xs" style={{ color: token.color }}>✓</span>}
                  <span className="text-xs ml-1" style={{ color: TIER_COLOR[h.tier] }}>{h.tier[0]}</span>
                </div>
                <div className="text-xs text-white/25">
                  {h.tokens} tokens · {h.pct}% supply
                  {h.staked > 0 && <span className="text-amber-400/50"> · {h.staked} staked</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm text-white/65">${h.value.toLocaleString()}</div>
                <div className="text-xs font-bold" style={{ color: h.change7d >= 0 ? '#22c55e' : '#f87171' }}>
                  {h.change7d >= 0 ? '+' : ''}{h.change7d}%
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
