'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKENS: Record<string, { name: string; color: string; totalHolders: number; totalSupply: number }> = {
  SVRN: { name:'Sovereign V', color:'#a855f7', totalHolders:2840, totalSupply:100000 },
  MAYA: { name:'Maya Chen',   color:'#22c55e', totalHolders:1620, totalSupply:80000  },
  JAX:  { name:'Jax Beats',  color:'#ec4899', totalHolders:980,  totalSupply:60000  },
}

interface Holder {
  rank: number
  handle: string
  name: string
  color: string
  qty: number
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | null
  pctSupply: number
  value: number
  staked: number
}

const TOKEN_HOLDERS: Record<string, Holder[]> = {
  SVRN: [
    { rank:1,  handle:'atlas_k',    name:'Atlas K',   color:'#818cf8', qty:420,  tier:'Diamond', pctSupply:0.42, value:3675, staked:350 },
    { rank:2,  handle:'lily_p',     name:'Lily P.',   color:'#f59e0b', qty:320,  tier:'Diamond', pctSupply:0.32, value:2800, staked:200 },
    { rank:3,  handle:'luna_w',     name:'Luna W.',   color:'#f87171', qty:280,  tier:'Diamond', pctSupply:0.28, value:2450, staked:100 },
    { rank:4,  handle:'jade_l',     name:'Jade L.',   color:'#a855f7', qty:180,  tier:'Diamond', pctSupply:0.18, value:1575, staked:180 },
    { rank:5,  handle:'noa_d',      name:'Noa D.',    color:'#f59e0b', qty:140,  tier:'Gold',    pctSupply:0.14, value:1225, staked:50  },
    { rank:6,  handle:'max_t',      name:'Max T.',    color:'#ec4899', qty:80,   tier:'Gold',    pctSupply:0.08, value:700,  staked:30  },
    { rank:7,  handle:'kai_r',      name:'Kai R.',    color:'#22c55e', qty:50,   tier:'Gold',    pctSupply:0.05, value:438,  staked:50  },
    { rank:8,  handle:'alex_m',     name:'Alex M.',   color:'#818cf8', qty:42,   tier:'Gold',    pctSupply:0.04, value:368,  staked:0   },
    { rank:9,  handle:'marco_v',    name:'Marco V.',  color:'#f87171', qty:28,   tier:'Silver',  pctSupply:0.03, value:245,  staked:25  },
    { rank:10, handle:'dex_n',      name:'Dex N.',    color:'#818cf8', qty:18,   tier:'Silver',  pctSupply:0.02, value:158,  staked:0   },
  ],
}

const TIER_COLOR: Record<string, string> = { Diamond:'#818cf8', Gold:'#f59e0b', Silver:'#94a3b8', Bronze:'#b45309' }
const TIER_EMOJI: Record<string, string> = { Diamond:'💎', Gold:'🥇', Silver:'🥈', Bronze:'🥉' }

export default function TokenHoldersPage() {
  const router = useRouter()
  const params = useParams()
  const symbol  = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const token   = TOKENS[symbol] ?? TOKENS.SVRN
  const holders = TOKEN_HOLDERS[symbol] ?? TOKEN_HOLDERS.SVRN

  const [filter, setFilter] = useState<'all' | 'diamond' | 'gold' | 'silver'>('all')

  const visible = holders.filter(h => {
    if (filter === 'all') return true
    return h.tier?.toLowerCase() === filter
  })

  const diamondCt = holders.filter(h => h.tier === 'Diamond').length
  const goldCt    = holders.filter(h => h.tier === 'Gold').length
  const silverCt  = holders.filter(h => h.tier === 'Silver').length
  const topHeldPct = (holders.slice(0,10).reduce((s,h)=>s+h.qty,0) / token.totalSupply) * 100

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
            <div className="text-xs text-white/30">{token.name} · {token.totalHolders.toLocaleString()} total</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label:'Holders',  value:token.totalHolders.toLocaleString(), color:token.color },
            { label:'💎',       value:diamondCt, color:'#818cf8' },
            { label:'🥇',       value:goldCt,    color:'#f59e0b' },
            { label:'Top 10%',  value:`${topHeldPct.toFixed(0)}%`, color:'rgba(255,255,255,0.4)' },
          ].map(s => (
            <div key={s.label} className="p-2 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/20">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tier distribution bar */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Tier Distribution</div>
          {[
            { tier:'Diamond', count:diamondCt, pct:(diamondCt/holders.length)*100, color:'#818cf8' },
            { tier:'Gold',    count:goldCt,    pct:(goldCt/holders.length)*100,    color:'#f59e0b' },
            { tier:'Silver',  count:silverCt,  pct:(silverCt/holders.length)*100,  color:'#94a3b8' },
          ].map(t => (
            <div key={t.tier} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/40">{TIER_EMOJI[t.tier]} {t.tier}</span>
                <span className="text-white/30">{t.count} ({t.pct.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          {(['all','diamond','gold','silver'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
              style={filter === f ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : `${TIER_EMOJI[f.charAt(0).toUpperCase() + f.slice(1)]} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
            </button>
          ))}
        </div>

        {/* Holders list */}
        <div className="text-xs text-white/30 font-semibold">Top Holders</div>
        <div className="space-y-2">
          {visible.map(h => (
            <button key={h.handle} onClick={() => router.push(`/profile/${h.handle}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-7 text-center text-xs text-white/25 flex-shrink-0">#{h.rank}</div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: `${h.color}15`, color: h.color }}>
                {h.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/80">{h.name}</span>
                  {h.tier && <span className="text-xs" style={{ color: TIER_COLOR[h.tier] }}>{TIER_EMOJI[h.tier]}</span>}
                </div>
                <div className="text-xs text-white/25">
                  {h.qty.toLocaleString()} tokens · {h.pctSupply}% supply
                  {h.staked > 0 && <span className="ml-1 text-amber-400/50">· {h.staked} staked</span>}
                </div>
              </div>
              <div className="font-black text-sm text-right" style={{ color: token.color }}>${h.value.toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
