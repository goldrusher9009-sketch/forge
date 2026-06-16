'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Tier = 'Diamond' | 'Gold' | 'Silver' | 'Bronze'

interface Holder {
  rank: number
  handle: string
  name: string
  color: string
  verified: boolean
  qty: number
  pct: number
  staked: number
  tier: Tier
  since: string
  value: number
}

const TOKEN_DATA: Record<string, { name:string; color:string; price:number; totalSupply:number; holders:Holder[] }> = {
  SVRN: {
    name:'Sovereign V', color:'#a855f7', price:8.75, totalSupply:100000,
    holders: [
      { rank:1,  handle:'atlas_k',    name:'Atlas K',      color:'#818cf8', verified:true,  qty:2400, pct:2.40, staked:1800, tier:'Diamond', since:'Jan 2026',  value:21000 },
      { rank:2,  handle:'lily_p',     name:'Lily P.',      color:'#f59e0b', verified:true,  qty:1820, pct:1.82, staked:1200, tier:'Diamond', since:'Feb 2026',  value:15925 },
      { rank:3,  handle:'nova_q',     name:'Nova Q.',      color:'#ec4899', verified:false, qty:1540, pct:1.54, staked:800,  tier:'Diamond', since:'Mar 2026',  value:13475 },
      { rank:4,  handle:'dex_n',      name:'Dex N.',       color:'#22c55e', verified:false, qty:1200, pct:1.20, staked:600,  tier:'Diamond', since:'Mar 2026',  value:10500 },
      { rank:5,  handle:'jade_l',     name:'Jade L.',      color:'#a855f7', verified:false, qty:980,  pct:0.98, staked:500,  tier:'Gold',    since:'Apr 2026',  value:8575  },
      { rank:6,  handle:'sam_q',      name:'Sam Q.',       color:'#818cf8', verified:false, qty:840,  pct:0.84, staked:400,  tier:'Gold',    since:'Apr 2026',  value:7350  },
      { rank:7,  handle:'kai_r',      name:'Kai R.',       color:'#22c55e', verified:false, qty:720,  pct:0.72, staked:300,  tier:'Gold',    since:'May 2026',  value:6300  },
      { rank:8,  handle:'marco_v',    name:'Marco V.',     color:'#f87171', verified:false, qty:580,  pct:0.58, staked:200,  tier:'Silver',  since:'May 2026',  value:5075  },
      { rank:9,  handle:'noa_d',      name:'Noa D.',       color:'#f59e0b', verified:false, qty:420,  pct:0.42, staked:100,  tier:'Silver',  since:'Jun 2026',  value:3675  },
      { rank:10, handle:'luna_w',     name:'Luna W.',      color:'#f87171', verified:false, qty:380,  pct:0.38, staked:80,   tier:'Silver',  since:'Jun 2026',  value:3325  },
      { rank:11, handle:'max_t',      name:'Max T.',       color:'#22c55e', verified:false, qty:280,  pct:0.28, staked:50,   tier:'Bronze',  since:'Jun 2026',  value:2450  },
      { rank:12, handle:'you',        name:'You',          color:'#a855f7', verified:false, qty:50,   pct:0.05, staked:50,   tier:'Gold',    since:'Jun 2026',  value:437   },
    ]
  },
  MAYA: {
    name:'Maya Chen', color:'#22c55e', price:5.20, totalSupply:80000,
    holders: [
      { rank:1, handle:'fitness_king', name:'Fitness King', color:'#22c55e', verified:true,  qty:1800, pct:2.25, staked:1500, tier:'Diamond', since:'Feb 2026', value:9360  },
      { rank:2, handle:'atlas_k',      name:'Atlas K',      color:'#818cf8', verified:true,  qty:1200, pct:1.50, staked:800,  tier:'Diamond', since:'Mar 2026', value:6240  },
      { rank:3, handle:'you',          name:'You',          color:'#22c55e', verified:false, qty:80,   pct:0.10, staked:80,   tier:'Diamond', since:'Jun 2026', value:416   },
    ]
  },
}

const TIER_COLOR: Record<Tier, string> = { Diamond:'#818cf8', Gold:'#f59e0b', Silver:'#94a3b8', Bronze:'#b45309' }
const TIER_EMOJI: Record<Tier, string> = { Diamond:'💎', Gold:'🥇', Silver:'🥈', Bronze:'🥉' }

export default function TokenHoldersPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol : 'SVRN'
  const token  = TOKEN_DATA[symbol] ?? TOKEN_DATA.SVRN

  const [filter, setFilter] = useState<'all' | Tier>('all')
  const [search, setSearch] = useState('')

  let holders = token.holders
  if (filter !== 'all') holders = holders.filter(h => h.tier === filter)
  if (search) holders = holders.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.handle.includes(search.toLowerCase()))

  const diamondCount = token.holders.filter(h => h.tier === 'Diamond').length
  const goldCount    = token.holders.filter(h => h.tier === 'Gold').length
  const totalStaked  = token.holders.reduce((s, h) => s + h.staked, 0)
  const stakedPct    = Math.round((totalStaked / token.totalSupply) * 100)

  return (
    <div className="min-h-screen pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">${symbol} Holders</div>
            <div className="text-xs text-white/30">{token.holders.length} holders · {token.name}</div>
          </div>
          <div className="text-right">
            <div className="font-black text-sm" style={{ color:token.color }}>${token.price}</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/6 mb-2">
          <span className="text-white/30 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search holders…"
            className="flex-1 text-sm text-white placeholder-white/20 bg-transparent outline-none" />
        </div>

        {/* Tier filter */}
        <div className="flex gap-1.5 overflow-x-auto">
          {(['all', 'Diamond', 'Gold', 'Silver', 'Bronze'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
              style={filter === f
                ? { background:f==='all'?token.color:TIER_COLOR[f], color:'#04040A' }
                : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : `${TIER_EMOJI[f]} ${f}`}
            </button>
          ))}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5 px-4 mt-4">
        {[
          { label:'Total',   value:token.holders.length, color:token.color },
          { label:'💎',      value:diamondCount,          color:'#818cf8'   },
          { label:'🥇',      value:goldCount,             color:'#f59e0b'   },
          { label:'Staked',  value:`${stakedPct}%`,       color:'#22c55e'   },
        ].map(s => (
          <div key={s.label} className="p-2.5 rounded-xl border border-white/5 text-center"
            style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-base" style={{ color:s.color }}>{s.value}</div>
            <div className="text-[10px] text-white/25">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Holders list */}
      <div className="px-4 py-4 space-y-2">
        {holders.map(h => (
          <button key={h.handle} onClick={() => router.push(`/profile/${h.handle}`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
            style={{ background: h.handle === 'you' ? `${token.color}06` : 'rgba(255,255,255,0.015)',
                     borderColor: h.handle === 'you' ? `${token.color}20` : 'rgba(255,255,255,0.04)' }}>
            <div className="w-6 text-xs font-black text-white/25 flex-shrink-0 text-center">
              {h.rank <= 3 ? ['🥇','🥈','🥉'][h.rank-1] : `#${h.rank}`}
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background:`${h.color}15`, color:h.color }}>
              {h.handle === 'you' ? 'Y' : h.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm" style={{ color: h.handle==='you' ? token.color : 'rgba(255,255,255,0.8)' }}>
                  {h.handle === 'you' ? 'You' : h.name}
                </span>
                {h.verified && <span className="text-xs" style={{ color:token.color }}>✓</span>}
                <span className="text-[10px] font-bold" style={{ color:TIER_COLOR[h.tier] }}>{TIER_EMOJI[h.tier]}</span>
              </div>
              <div className="text-xs text-white/25">
                {h.qty.toLocaleString()} tokens · {h.staked > 0 ? `${h.staked} staked` : 'not staking'} · since {h.since}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-black text-xs" style={{ color:token.color }}>{h.pct}%</div>
              <div className="text-xs text-white/25">${h.value.toLocaleString()}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
