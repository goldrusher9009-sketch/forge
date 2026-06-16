'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type LeaderType = 'tokens' | 'holders' | 'stakers' | 'earners'
type Period = '24H' | '7D' | '30D'

interface Creator {
  rank: number
  handle: string
  name: string
  color: string
  verified: boolean
  tokenSymbol: string
  tokenPrice: number
  change24h: number
  holders: number
  volume24h: number
  stakers: number
  earnings: number
  vscore: number
}

const CREATORS: Creator[] = [
  { rank:1, handle:'sovereign_v', name:'Sovereign V', color:'#a855f7', verified:true,  tokenSymbol:'SVRN', tokenPrice:8.75, change24h:4.2,  holders:2840, volume24h:128400, stakers:820,  earnings:28420, vscore:9840 },
  { rank:2, handle:'mayafit',     name:'Maya Chen',   color:'#22c55e', verified:true,  tokenSymbol:'MAYA', tokenPrice:5.20, change24h:-1.8, holders:1620, volume24h:58200,  stakers:510,  earnings:16840, vscore:8720 },
  { rank:3, handle:'jaxbeats',    name:'Jax Beats',  color:'#ec4899', verified:true,  tokenSymbol:'JAX',  tokenPrice:3.80, change24h:7.1,  holders:980,  volume24h:34100,  stakers:320,  earnings:9200,  vscore:7410 },
  { rank:4, handle:'atlas_k',     name:'Atlas K',    color:'#818cf8', verified:false, tokenSymbol:'ATLK', tokenPrice:2.40, change24h:12.4, holders:720,  volume24h:18600,  stakers:180,  earnings:5840,  vscore:6180 },
  { rank:5, handle:'luna_w',      name:'Luna W.',    color:'#f87171', verified:false, tokenSymbol:'LUNA', tokenPrice:1.80, change24h:-3.2, holders:540,  volume24h:9800,   stakers:120,  earnings:3200,  vscore:5240 },
  { rank:6, handle:'kai_r',       name:'Kai R.',     color:'#22c55e', verified:false, tokenSymbol:'KAIR', tokenPrice:1.20, change24h:5.8,  holders:380,  volume24h:6200,   stakers:90,   earnings:1840,  vscore:4620 },
  { rank:7, handle:'marco_v',     name:'Marco V.',   color:'#f87171', verified:false, tokenSymbol:'MARC', tokenPrice:0.90, change24h:2.1,  holders:260,  volume24h:4100,   stakers:60,   earnings:980,   vscore:3980 },
  { rank:8, handle:'jade_l',      name:'Jade L.',    color:'#a855f7', verified:false, tokenSymbol:'JADE', tokenPrice:0.70, change24h:-1.4, holders:190,  volume24h:2800,   stakers:45,   earnings:620,   vscore:3240 },
  { rank:9, handle:'noa_d',       name:'Noa D.',     color:'#f59e0b', verified:false, tokenSymbol:'NOAD', tokenPrice:0.55, change24h:8.2,  holders:140,  volume24h:1900,   stakers:30,   earnings:380,   vscore:2810 },
  { rank:10,handle:'dex_n',       name:'Dex N.',     color:'#818cf8', verified:false, tokenSymbol:'DEXN', tokenPrice:0.42, change24h:1.6,  holders:100,  volume24h:1200,   stakers:18,   earnings:240,   vscore:2140 },
]

const TABS: { key: LeaderType; label: string; icon: string }[] = [
  { key:'tokens',  label:'Token Value', icon:'💎' },
  { key:'holders', label:'Holders',     icon:'👥' },
  { key:'stakers', label:'Stakers',     icon:'🔒' },
  { key:'earners', label:'Earnings',    icon:'💰' },
]

const RANK_BADGE: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<LeaderType>('tokens')
  const [period, setPeriod] = useState<Period>('7D')

  const sorted = [...CREATORS].sort((a, b) => {
    if (tab === 'tokens')  return b.tokenPrice - a.tokenPrice
    if (tab === 'holders') return b.holders - a.holders
    if (tab === 'stakers') return b.stakers - a.stakers
    return b.earnings - a.earnings
  })

  function metricVal(c: Creator): string {
    if (tab === 'tokens')  return `$${c.tokenPrice}`
    if (tab === 'holders') return c.holders.toLocaleString()
    if (tab === 'stakers') return c.stakers.toLocaleString()
    return `$${(c.earnings / 1000).toFixed(1)}k`
  }
  function metricSub(c: Creator): string {
    if (tab === 'tokens')  return `${c.change24h >= 0 ? '+' : ''}${c.change24h}% 24h`
    if (tab === 'holders') return `Vol $${(c.volume24h/1000).toFixed(0)}k`
    if (tab === 'stakers') return `${((c.stakers/c.holders)*100).toFixed(0)}% holder staked`
    return 'total earned'
  }

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
            <div className="font-black text-white">Leaderboard</div>
            <div className="text-xs text-white/30">Top creators on VIVA</div>
          </div>
          <div className="flex gap-1">
            {(['24H', '7D', '30D'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={period === p ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={tab === t.key ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Top 3 podium */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-2">
        {[sorted[1], sorted[0], sorted[2]].map((c, i) => {
          const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3
          const heights   = ['h-20', 'h-28', 'h-20']
          return (
            <button key={c.handle} onClick={() => router.push(`/profile/${c.handle}`)}
              className={`${heights[i]} rounded-2xl border flex flex-col items-center justify-end pb-3 px-2`}
              style={{ background: `${c.color}08`, borderColor: `${c.color}20` }}>
              <div className="text-lg mb-0.5">{RANK_BADGE[actualRank]}</div>
              <div className="text-xs font-black text-white/70 truncate w-full text-center">{c.name.split(' ')[0]}</div>
              <div className="text-xs font-bold" style={{ color: c.color }}>{metricVal(c)}</div>
            </button>
          )
        })}
      </div>

      <div className="px-4 pb-4 space-y-2">
        {sorted.map((c, i) => (
          <button key={c.handle} onClick={() => router.push(`/profile/${c.handle}`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <div className="w-7 text-center font-black text-sm flex-shrink-0"
              style={{ color: i < 3 ? ['#f59e0b','#94a3b8','#b45309'][i] : 'rgba(255,255,255,0.2)' }}>
              {i < 3 ? RANK_BADGE[i+1] : i + 1}
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: `${c.color}15`, color: c.color }}>
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white/80">{c.name}</span>
                {c.verified && <span className="text-xs" style={{ color: c.color }}>✓</span>}
              </div>
              <div className="text-xs text-white/25">
                ${c.tokenSymbol} · {(c.holders/1000).toFixed(0)}k holders
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-black text-sm" style={{ color: c.color }}>{metricVal(c)}</div>
              <div className="text-xs" style={{ color: tab === 'tokens' && c.change24h < 0 ? '#f87171' : '#22c55e' }}>
                {metricSub(c)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
