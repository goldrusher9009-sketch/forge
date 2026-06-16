'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKEN_META: Record<string, { name: string; price: number; supply: number; color: string; creatorHandle: string }> = {
  SVRN:  { name: 'Sovereign V',  price: 8.75,  supply: 50000, color: '#a855f7', creatorHandle: 'sovereign_v' },
  MAYA:  { name: 'Maya Chen',    price: 6.40,  supply: 50000, color: '#22c55e', creatorHandle: 'mayafit'     },
  JAX:   { name: 'Jax Beats',    price: 4.80,  supply: 30000, color: '#ec4899', creatorHandle: 'jaxbeats'    },
}

const TIER_CONFIG = [
  { id: 'Diamond', min: 100, color: '#818cf8', apy: '35%' },
  { id: 'Gold',    min: 50,  color: '#f59e0b', apy: '22%' },
  { id: 'Silver',  min: 25,  color: '#94a3b8', apy: '14%' },
  { id: 'Bronze',  min: 10,  color: '#b45309', apy: '8%'  },
]

function getTier(amount: number) {
  return TIER_CONFIG.slice().reverse().find(t => amount >= t.min) ?? null
}

const MOCK_HOLDERS = [
  { rank: 1,  handle: 'noa_d',       name: 'Noa D.',       amount: 320, color: '#a855f7', joined: '2025-11-01' },
  { rank: 2,  handle: 'crypto_kat',  name: 'Kat Zhou',     amount: 200, color: '#818cf8', joined: '2025-11-15' },
  { rank: 3,  handle: 'luna_arts',   name: 'Luna Arts',    amount: 180, color: '#c084fc', joined: '2026-01-08' },
  { rank: 4,  handle: 'mayafit',     name: 'Maya Chen',    amount: 150, color: '#22c55e', joined: '2025-12-01' },
  { rank: 5,  handle: 'moonset99',   name: 'Moonset',      amount: 120, color: '#22c55e', joined: '2026-02-14' },
  { rank: 6,  handle: 'alexpark',    name: 'Alex Park',    amount: 90,  color: '#818cf8', joined: '2026-03-01' },
  { rank: 7,  handle: 'jaxbeats',    name: 'Jax Beats',    amount: 80,  color: '#ec4899', joined: '2026-01-20' },
  { rank: 8,  handle: 'atlas_burns', name: 'Atlas Burns',  amount: 60,  color: '#60a5fa', joined: '2026-04-05' },
  { rank: 9,  handle: 'danr',        name: 'Dan R.',       amount: 45,  color: '#34d399', joined: '2026-04-18' },
  { rank: 10, handle: 'aisham',      name: 'Aisha M.',     amount: 35,  color: '#f59e0b', joined: '2026-05-02' },
  { rank: 11, handle: 'zara_voss',   name: 'Zara Voss',    amount: 25,  color: '#f87171', joined: '2026-05-10' },
  { rank: 12, handle: 'reed_cross',  name: 'Reed Cross',   amount: 20,  color: '#ec4899', joined: '2026-05-15' },
  { rank: 13, handle: 'lunaarts',    name: 'Luna A.',      amount: 15,  color: '#c084fc', joined: '2026-05-22' },
  { rank: 14, handle: 'mateuso',     name: 'Mateus O.',    amount: 10,  color: '#fbbf24', joined: '2026-06-01' },
  { rank: 15, handle: 'newuser',     name: 'New User',     amount: 5,   color: '#94a3b8', joined: '2026-06-10' },
]

const totalHeld = MOCK_HOLDERS.reduce((s, h) => s + h.amount, 0)

export default function TokenHoldersPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const meta = TOKEN_META[symbol] ?? TOKEN_META.SVRN

  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')

  const filtered = MOCK_HOLDERS.filter(h => {
    const tier = getTier(h.amount)
    const matchesTier = tierFilter === 'all' || tier?.id === tierFilter
    const matchesSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.handle.includes(search.toLowerCase())
    return matchesTier && matchesSearch
  })

  const diamondCount = MOCK_HOLDERS.filter(h => getTier(h.amount)?.id === 'Diamond').length
  const goldCount    = MOCK_HOLDERS.filter(h => getTier(h.amount)?.id === 'Gold').length
  const silverCount  = MOCK_HOLDERS.filter(h => getTier(h.amount)?.id === 'Silver').length
  const bronzeCount  = MOCK_HOLDERS.filter(h => getTier(h.amount)?.id === 'Bronze').length

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">${symbol} Holders</div>
            <div className="text-xs text-white/30">{MOCK_HOLDERS.length} holders · {totalHeld.toLocaleString()} in circulation</div>
          </div>
          <button onClick={() => router.push(`/tokens/${symbol}`)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: `${meta.color}15`, color: meta.color }}>
            Token →
          </button>
        </div>

        {/* Tier distribution */}
        <div className="flex gap-2 mb-3">
          {[
            { id: 'Diamond', count: diamondCount, color: '#818cf8' },
            { id: 'Gold',    count: goldCount,    color: '#f59e0b' },
            { id: 'Silver',  count: silverCount,  color: '#94a3b8' },
            { id: 'Bronze',  count: bronzeCount,  color: '#b45309' },
          ].map(t => (
            <button key={t.id} onClick={() => setTierFilter(tierFilter === t.id ? 'all' : t.id)}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={tierFilter === t.id
                ? { background: t.color, color: '#04040A' }
                : { background: `${t.color}10`, color: t.color }}>
              {t.id[0]} {t.count}
            </button>
          ))}
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M15 15l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search holders…"
            className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
        </div>
      </header>

      {/* Market cap + concentration */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-2">
        {[
          { label: 'Market Cap', value: `$${(meta.price * meta.supply / 1000).toFixed(0)}k`, color: meta.color },
          { label: 'Token Price', value: `$${meta.price.toFixed(2)}`, color: meta.color },
          { label: 'Top 10 Hold', value: `${((MOCK_HOLDERS.slice(0,10).reduce((s,h)=>s+h.amount,0)/totalHeld)*100).toFixed(0)}%`, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="p-2 rounded-xl text-center border border-white/4"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <div className="text-xs text-white/25 mb-0.5">{s.label}</div>
            <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/20 text-sm">No holders found</div>
        )}
        {filtered.map(h => {
          const tier = getTier(h.amount)
          const pct = ((h.amount / totalHeld) * 100).toFixed(1)
          return (
            <button key={h.handle} onClick={() => router.push(`/profile/${h.handle}`)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all hover:bg-white/3 text-left">
              {/* Rank */}
              <div className="w-7 font-black text-sm text-center flex-shrink-0"
                style={{ color: h.rank <= 3 ? meta.color : 'rgba(255,255,255,0.2)' }}>
                #{h.rank}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${h.color}18`, color: h.color, border: `1.5px solid ${h.color}25` }}>
                {h.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-white/85">{h.name}</span>
                  {tier && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: `${tier.color}15`, color: tier.color }}>
                      {tier.id}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/30">@{h.handle}</div>
              </div>

              {/* Amount + share */}
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm" style={{ color: meta.color }}>{h.amount}</div>
                <div className="text-xs text-white/25">{pct}%</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
