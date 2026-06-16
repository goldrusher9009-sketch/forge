'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = 'vscore' | 'earnings' | 'followers' | 'token_price' | 'stakers'

interface Leader {
  rank: number
  handle: string
  name: string
  color: string
  verified: boolean
  vscore: number
  earnings7d: number
  followers: number
  tokenSymbol: string
  tokenPrice: number
  tokenChange: number
  stakerCount: number
  tier: 'Diamond' | 'Gold' | 'Silver'
}

const LEADERS: Leader[] = [
  { rank:1,  handle:'sovereign_v',  name:'Sovereign V',    color:'#a855f7', verified:true,  vscore:9840,  earnings7d:4820,  followers:48200, tokenSymbol:'SVRN', tokenPrice:8.75,  tokenChange:4.2,  stakerCount:284, tier:'Diamond' },
  { rank:2,  handle:'mayafit',      name:'Maya Chen',      color:'#22c55e', verified:true,  vscore:8720,  earnings7d:3640,  followers:62100, tokenSymbol:'MAYA', tokenPrice:5.20,  tokenChange:-1.8, stakerCount:198, tier:'Diamond' },
  { rank:3,  handle:'jaxbeats',     name:'Jax Beats',      color:'#ec4899', verified:true,  vscore:7410,  earnings7d:2180,  followers:34800, tokenSymbol:'JAX',  tokenPrice:3.80,  tokenChange:7.1,  stakerCount:142, tier:'Diamond' },
  { rank:4,  handle:'atlas_k',      name:'Atlas K',        color:'#818cf8', verified:false, vscore:6820,  earnings7d:1920,  followers:28400, tokenSymbol:'ATLK', tokenPrice:4.20,  tokenChange:2.8,  stakerCount:118, tier:'Gold'    },
  { rank:5,  handle:'lily_p',       name:'Lily Park',      color:'#f59e0b', verified:true,  vscore:6410,  earnings7d:1540,  followers:21900, tokenSymbol:'LILY', tokenPrice:2.80,  tokenChange:1.4,  stakerCount:94,  tier:'Gold'    },
  { rank:6,  handle:'noa_d',        name:'Noa Davis',      color:'#f59e0b', verified:false, vscore:5900,  earnings7d:1280,  followers:18200, tokenSymbol:'NOAD', tokenPrice:1.95,  tokenChange:-0.8, stakerCount:76,  tier:'Gold'    },
  { rank:7,  handle:'kai_r',        name:'Kai Reed',       color:'#22c55e', verified:false, vscore:5200,  earnings7d:980,   followers:14600, tokenSymbol:'KAIR', tokenPrice:1.60,  tokenChange:3.2,  stakerCount:61,  tier:'Gold'    },
  { rank:8,  handle:'luna_w',       name:'Luna Walsh',     color:'#f87171', verified:false, vscore:4800,  earnings7d:820,   followers:12100, tokenSymbol:'LUNA', tokenPrice:1.20,  tokenChange:5.1,  stakerCount:52,  tier:'Silver'  },
  { rank:9,  handle:'jade_l',       name:'Jade Lee',       color:'#a855f7', verified:false, vscore:4200,  earnings7d:640,   followers:9800,  tokenSymbol:'JADL', tokenPrice:0.95,  tokenChange:-2.1, stakerCount:44,  tier:'Silver'  },
  { rank:10, handle:'max_t',        name:'Max Tran',       color:'#ec4899', verified:false, vscore:3800,  earnings7d:520,   followers:8200,  tokenSymbol:'MAXT', tokenPrice:0.80,  tokenChange:0.6,  stakerCount:38,  tier:'Silver'  },
  { rank:11, handle:'marco_v',      name:'Marco V.',       color:'#f87171', verified:false, vscore:3200,  earnings7d:410,   followers:6400,  tokenSymbol:'MARV', tokenPrice:0.60,  tokenChange:4.8,  stakerCount:28,  tier:'Silver'  },
  { rank:12, handle:'dex_n',        name:'Dex North',      color:'#818cf8', verified:false, vscore:2800,  earnings7d:320,   followers:4900,  tokenSymbol:'DEXN', tokenPrice:0.45,  tokenChange:-1.2, stakerCount:21,  tier:'Silver'  },
]

const CAT_LABELS: Record<Category, string> = {
  vscore:'V-Score', earnings:'7D Earnings', followers:'Followers', token_price:'Token Price', stakers:'Stakers'
}
const CAT_VALUE: Record<Category, (l: Leader) => string> = {
  vscore:      l => l.vscore.toLocaleString(),
  earnings:    l => `$${l.earnings7d.toLocaleString()}`,
  followers:   l => `${(l.followers/1000).toFixed(1)}k`,
  token_price: l => `$${l.tokenPrice}`,
  stakers:     l => l.stakerCount.toString(),
}
const MEDALS = ['🥇','🥈','🥉']
const TIER_COLOR: Record<string, string> = { Diamond:'#818cf8', Gold:'#f59e0b', Silver:'#94a3b8' }

export default function LeaderboardPage() {
  const router = useRouter()
  const [cat, setCat] = useState<Category>('vscore')

  const sorted = [...LEADERS].sort((a, b) => {
    if (cat === 'vscore')      return b.vscore - a.vscore
    if (cat === 'earnings')    return b.earnings7d - a.earnings7d
    if (cat === 'followers')   return b.followers - a.followers
    if (cat === 'token_price') return b.tokenPrice - a.tokenPrice
    if (cat === 'stakers')     return b.stakerCount - a.stakerCount
    return 0
  })

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
          <div className="flex-1 font-black text-white">Leaderboard</div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(Object.keys(CAT_LABELS) as Category[]).map(k => (
            <button key={k} onClick={() => setCat(k)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={cat === k ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {CAT_LABELS[k]}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[sorted[1], sorted[0], sorted[2]].map((l, i) => {
            const podiumRank = [2,1,3][i]
            const heights = ['h-20','h-24','h-16']
            return (
              <button key={l.handle} onClick={() => router.push(`/profile/${l.handle}`)}
                className={`flex flex-col items-center justify-end pb-3 rounded-2xl border border-white/4 ${heights[i]}`}
                style={{ background: `${l.color}08` }}>
                <div className="text-lg mb-1">{MEDALS[podiumRank-1]}</div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                  style={{ background: `${l.color}18`, color: l.color }}>
                  {l.name[0]}
                </div>
                <div className="text-xs font-black text-white/70 mt-1">{l.name.split(' ')[0]}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: l.color }}>{CAT_VALUE[cat](l)}</div>
              </button>
            )
          })}
        </div>

        {/* Full list */}
        {sorted.map((l, idx) => (
          <button key={l.handle} onClick={() => router.push(`/profile/${l.handle}`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            {/* Rank */}
            <div className="w-7 text-center flex-shrink-0">
              {idx < 3
                ? <span className="text-base">{MEDALS[idx]}</span>
                : <span className="font-black text-sm text-white/25">#{idx+1}</span>}
            </div>
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: `${l.color}15`, color: l.color }}>
              {l.name[0]}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white/85">{l.name}</span>
                {l.verified && <span className="text-xs" style={{ color: l.color }}>✓</span>}
                <span className="text-xs" style={{ color: TIER_COLOR[l.tier] }}>·{l.tier[0]}</span>
              </div>
              <div className="text-xs text-white/25">
                @{l.handle} · ${l.tokenSymbol}
                <span className="ml-1" style={{ color: l.tokenChange >= 0 ? '#22c55e' : '#f87171' }}>
                  {l.tokenChange >= 0 ? '+' : ''}{l.tokenChange}%
                </span>
              </div>
            </div>
            {/* Metric */}
            <div className="text-right flex-shrink-0">
              <div className="font-black text-sm" style={{ color: l.color }}>{CAT_VALUE[cat](l)}</div>
              <div className="text-xs text-white/20">{CAT_LABELS[cat]}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
