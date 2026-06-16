'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Holder {
  handle: string
  name: string
  color: string
  verified: boolean
  qty: number
  pct: number
  staked: number
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | null
  value: number
  since: string
}

const TOKENS: Record<string, { name: string; color: string; price: number; supply: number; change24h: number }> = {
  SVRN: { name: 'Sovereign V', color: '#a855f7', price: 8.75,  supply: 10000, change24h: 4.2  },
  MAYA: { name: 'Maya Chen',   color: '#22c55e', price: 5.20,  supply: 8000,  change24h: -1.8 },
  JAX:  { name: 'Jax Beats',  color: '#ec4899', price: 3.80,  supply: 12000, change24h: 7.1  },
}

const MOCK_HOLDERS: Record<string, Holder[]> = {
  SVRN: [
    { handle:'atlas_k',   name:'Atlas K',   color:'#818cf8', verified:false, qty:200, pct:7.1,  staked:200, tier:'Diamond', value:1750,  since:'Mar 2026' },
    { handle:'lily_p',    name:'Lily P.',   color:'#f59e0b', verified:true,  qty:180, pct:6.4,  staked:180, tier:'Diamond', value:1575,  since:'Feb 2026' },
    { handle:'jade_l',    name:'Jade L.',   color:'#a855f7', verified:false, qty:120, pct:4.3,  staked:100, tier:'Diamond', value:1050,  since:'Apr 2026' },
    { handle:'luna_w',    name:'Luna W.',   color:'#f87171', verified:false, qty:80,  pct:2.9,  staked:80,  tier:'Gold',    value:700,   since:'Apr 2026' },
    { handle:'noa_d',     name:'Noa D.',    color:'#f59e0b', verified:false, qty:50,  pct:1.8,  staked:35,  tier:'Gold',    value:437.5, since:'May 2026' },
    { handle:'kai_r',     name:'Kai R.',    color:'#22c55e', verified:false, qty:40,  pct:1.4,  staked:25,  tier:'Silver',  value:350,   since:'May 2026' },
    { handle:'marco_v',   name:'Marco V.',  color:'#f87171', verified:false, qty:30,  pct:1.1,  staked:10,  tier:'Bronze',  value:262.5, since:'May 2026' },
    { handle:'max_t',     name:'Max T.',    color:'#ec4899', verified:false, qty:25,  pct:0.9,  staked:0,   tier:'Bronze',  value:218.75,since:'Jun 2026' },
    { handle:'sam_q',     name:'Sam Q.',    color:'#22c55e', verified:false, qty:20,  pct:0.7,  staked:0,   tier:'Bronze',  value:175,   since:'Jun 2026' },
    { handle:'dex_n',     name:'Dex N.',    color:'#818cf8', verified:false, qty:10,  pct:0.4,  staked:0,   tier:null,      value:87.5,  since:'Jun 2026' },
  ],
}

const TIER_COLOR: Record<string, string> = { Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309' }
const TIER_EMOJI: Record<string, string> = { Diamond: '💎', Gold: '🥇', Silver: '🥈', Bronze: '🥉' }

type HolderFilter = 'all' | 'staking' | 'diamond' | 'gold'

export default function TokenHoldersPage() {
  const router = useRouter()
  const params = useParams()
  const symbol  = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const token   = TOKENS[symbol] ?? TOKENS.SVRN
  const allHolders = MOCK_HOLDERS[symbol] ?? MOCK_HOLDERS.SVRN

  const [filter, setFilter] = useState<HolderFilter>('all')

  const holders = allHolders.filter(h => {
    if (filter === 'staking') return h.staked > 0
    if (filter === 'diamond') return h.tier === 'Diamond'
    if (filter === 'gold')    return h.tier === 'Gold' || h.tier === 'Diamond'
    return true
  })

  const totalStaked = allHolders.reduce((s, h) => s + h.staked, 0)
  const stakingPct  = ((totalStaked / token.supply) * 100).toFixed(1)

  const FILTERS: { key: HolderFilter; label: string }[] = [
    { key:'all',     label:'All' },
    { key:'staking', label:'Staking' },
    { key:'diamond', label:'💎 Diamond' },
    { key:'gold',    label:'🥇 Gold+' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">${symbol} Holders</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">{token.name}</span>
              <span className="text-xs font-bold" style={{ color: token.change24h >= 0 ? '#22c55e' : '#f87171' }}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h}%
              </span>
            </div>
          </div>
          <button onClick={() => router.push(`/tokens/${symbol}/chart`)}
            className="px-2 py-1 rounded-lg text-xs font-black"
            style={{ background: `${token.color}15`, color: token.color }}>
            ${token.price}
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Holders', value: allHolders.length, color: token.color  },
            { label: 'Staking',        value: `${stakingPct}%`,  color: '#f59e0b' },
            { label: 'Supply',         value: `${(token.supply/1000).toFixed(0)}k`,  color: '#818cf8' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-base" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Distribution bar */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 mb-2">Tier Distribution</div>
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            {(['Diamond','Gold','Silver','Bronze','None'] as const).map(tier => {
              const c = allHolders.filter(h => (h.tier ?? 'None') === tier).length
              const pct = (c / allHolders.length) * 100
              return (
                <div key={tier} style={{ width: `${pct}%`, background: TIER_COLOR[tier] ?? 'rgba(255,255,255,0.1)' }} />
              )
            })}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap">
            {(['Diamond','Gold','Silver','Bronze'] as const).map(tier => (
              <span key={tier} className="text-xs flex items-center gap-1" style={{ color: TIER_COLOR[tier] }}>
                {TIER_EMOJI[tier]} {tier}
              </span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={filter === f.key ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Holders list */}
        <div className="space-y-2">
          {holders.map((h, i) => (
            <button key={h.handle} onClick={() => router.push(`/profile/${h.handle}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="text-xs w-5 text-center font-bold text-white/20 flex-shrink-0">{i + 1}</div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${h.color}15`, color: h.color }}>
                {h.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/80">{h.name}</span>
                  {h.verified && <span className="text-xs" style={{ color: token.color }}>✓</span>}
                  {h.tier && <span className="text-xs">{TIER_EMOJI[h.tier]}</span>}
                </div>
                <div className="text-xs text-white/25">
                  {h.qty} tokens · {h.pct}% supply
                  {h.staked > 0 && <span className="ml-1 text-amber-400/50">· {h.staked} staked</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm text-white/70">${h.value.toFixed(0)}</div>
                <div className="text-xs text-white/20">{h.since}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
