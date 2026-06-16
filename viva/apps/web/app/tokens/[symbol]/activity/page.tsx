'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type ActivityType = 'buy' | 'sell' | 'stake' | 'unstake' | 'transfer' | 'reward'
type ActivityFilter = 'all' | 'buys' | 'sells' | 'stakes'

interface TokenActivity {
  id: string
  type: ActivityType
  handle: string
  color: string
  qty: number
  price: number
  total: number
  ts: string
}

const TOKENS: Record<string, { name: string; color: string; price: number; change24h: number }> = {
  SVRN: { name: 'Sovereign V', color: '#a855f7', price: 8.75, change24h: 4.2  },
  MAYA: { name: 'Maya Chen',   color: '#22c55e', price: 5.20, change24h: -1.8 },
  JAX:  { name: 'Jax Beats',  color: '#ec4899', price: 3.80, change24h: 7.1  },
}

const MOCK_ACTIVITY: Record<string, TokenActivity[]> = {
  SVRN: [
    { id:'a1',  type:'buy',      handle:'atlas_k',   color:'#818cf8', qty:50,  price:8.72, total:436.0,  ts:'2026-06-15T14:22:00Z' },
    { id:'a2',  type:'sell',     handle:'dex_n',     color:'#f87171', qty:10,  price:8.80, total:88.0,   ts:'2026-06-15T13:55:00Z' },
    { id:'a3',  type:'stake',    handle:'luna_w',    color:'#f87171', qty:100, price:8.75, total:875.0,  ts:'2026-06-15T12:10:00Z' },
    { id:'a4',  type:'buy',      handle:'kai_r',     color:'#22c55e', qty:25,  price:8.68, total:217.0,  ts:'2026-06-15T10:44:00Z' },
    { id:'a5',  type:'reward',   handle:'noa_d',     color:'#f59e0b', qty:2,   price:8.75, total:17.5,   ts:'2026-06-15T09:00:00Z' },
    { id:'a6',  type:'buy',      handle:'marco_v',   color:'#f87171', qty:15,  price:8.60, total:129.0,  ts:'2026-06-14T20:00:00Z' },
    { id:'a7',  type:'unstake',  handle:'jade_l',    color:'#a855f7', qty:30,  price:8.55, total:256.5,  ts:'2026-06-14T18:30:00Z' },
    { id:'a8',  type:'sell',     handle:'max_t',     color:'#ec4899', qty:5,   price:8.45, total:42.25,  ts:'2026-06-14T15:00:00Z' },
    { id:'a9',  type:'stake',    handle:'lily_p',    color:'#f59e0b', qty:200, price:8.50, total:1700.0, ts:'2026-06-14T12:00:00Z' },
    { id:'a10', type:'buy',      handle:'sam_q',     color:'#22c55e', qty:8,   price:8.40, total:67.2,   ts:'2026-06-14T09:00:00Z' },
  ],
}

const ACT_ICONS:  Record<ActivityType, string> = { buy:'↓', sell:'↑', stake:'🔒', unstake:'🔓', transfer:'→', reward:'✨' }
const ACT_LABELS: Record<ActivityType, string> = { buy:'Bought', sell:'Sold', stake:'Staked', unstake:'Unstaked', transfer:'Transferred', reward:'Reward' }

function isGreen(t: ActivityType) { return ['buy', 'stake', 'reward'].includes(t) }

function fmtRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function TokenActivityPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const token  = TOKENS[symbol] ?? TOKENS.SVRN

  const [filter, setFilter] = useState<ActivityFilter>('all')

  const activities = (MOCK_ACTIVITY[symbol] ?? MOCK_ACTIVITY.SVRN).filter(a => {
    if (filter === 'buys')  return a.type === 'buy'
    if (filter === 'sells') return a.type === 'sell'
    if (filter === 'stakes') return a.type === 'stake' || a.type === 'unstake'
    return true
  })

  const totalBuys  = (MOCK_ACTIVITY[symbol] ?? MOCK_ACTIVITY.SVRN).filter(a => a.type === 'buy').reduce((s, a) => s + a.total, 0)
  const totalSells = (MOCK_ACTIVITY[symbol] ?? MOCK_ACTIVITY.SVRN).filter(a => a.type === 'sell').reduce((s, a) => s + a.total, 0)
  const pressure   = (totalBuys / (totalBuys + totalSells)) * 100

  const FILTERS: { key: ActivityFilter; label: string }[] = [
    { key:'all', label:'All' }, { key:'buys', label:'Buys' },
    { key:'sells', label:'Sells' }, { key:'stakes', label:'Stakes' },
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
            <div className="font-black text-white">${symbol} Activity</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">{token.name}</span>
              <span className="text-xs font-bold" style={{ color: token.change24h >= 0 ? '#22c55e' : '#f87171' }}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h}%
              </span>
            </div>
          </div>
          <button onClick={() => router.push(`/tokens/${symbol}/chart`)}
            className="text-xs font-black px-2 py-1 rounded-lg"
            style={{ background: `${token.color}15`, color: token.color }}>
            ${token.price}
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Buy / Sell pressure */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex justify-between text-xs text-white/30 mb-2">
            <span className="font-bold" style={{ color: '#22c55e' }}>Buy {pressure.toFixed(0)}%</span>
            <span className="font-bold" style={{ color: '#f87171' }}>Sell {(100-pressure).toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ width: `${pressure}%`, background: '#22c55e' }} />
            <div style={{ flex: 1, background: '#f87171' }} />
          </div>
          <div className="text-xs text-white/20 mt-1">Buy/sell pressure · last 24h</div>
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

        {/* Activity list */}
        <div className="space-y-2">
          {activities.map(a => {
            const green = isGreen(a.type)
            return (
              <button key={a.id} onClick={() => router.push(`/profile/${a.handle}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                  style={{ background: green ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)', color: green ? '#22c55e' : '#f87171' }}>
                  {ACT_ICONS[a.type]}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px]"
                    style={{ background: `${a.color}15`, color: a.color }}>
                    {a.handle[0].toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white/75">
                    @{a.handle} {ACT_LABELS[a.type].toLowerCase()} {a.qty} ${symbol}
                  </div>
                  <div className="text-xs text-white/25">{fmtRelative(a.ts)} · @${a.price.toFixed(2)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-sm" style={{ color: green ? '#22c55e' : '#f87171' }}>
                    {green ? '+' : '-'}${a.total.toFixed(0)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
