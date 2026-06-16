'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type ActivityType = 'buy' | 'sell' | 'stake' | 'unstake' | 'transfer' | 'reward'

interface Activity {
  id: string
  type: ActivityType
  handle: string
  name: string
  color: string
  verified: boolean
  qty: number
  price: number
  total: number
  ts: string
}

const TOKEN_DATA: Record<string, { name: string; color: string; price: number; change24h: number; volume24h: number; holders: number }> = {
  SVRN: { name: 'Sovereign V', color: '#a855f7', price: 8.75, change24h: 4.2,  volume24h: 48200, holders: 2840 },
  MAYA: { name: 'Maya Chen',   color: '#22c55e', price: 5.20, change24h: -1.8, volume24h: 22400, holders: 1620 },
  JAX:  { name: 'Jax Beats',  color: '#ec4899', price: 3.80, change24h: 7.1,  volume24h: 12800, holders: 980  },
}

const TOKEN_ACTIVITY: Record<string, Activity[]> = {
  SVRN: [
    { id: 'a1',  type: 'buy',     handle: 'atlas_k',  name: 'Atlas K',   color: '#818cf8', verified: true,  qty: 20,  price: 8.75, total: 175,  ts: '2m'  },
    { id: 'a2',  type: 'stake',   handle: 'luna_w',   name: 'Luna W.',   color: '#f87171', verified: false, qty: 50,  price: 8.72, total: 436,  ts: '5m'  },
    { id: 'a3',  type: 'buy',     handle: 'noa_d',    name: 'Noa D.',    color: '#f59e0b', verified: false, qty: 5,   price: 8.70, total: 43.5, ts: '12m' },
    { id: 'a4',  type: 'sell',    handle: 'kai_r',    name: 'Kai R.',    color: '#22c55e', verified: false, qty: 10,  price: 8.65, total: 86.5, ts: '18m' },
    { id: 'a5',  type: 'buy',     handle: 'marco_v',  name: 'Marco V.',  color: '#f87171', verified: false, qty: 30,  price: 8.60, total: 258,  ts: '25m' },
    { id: 'a6',  type: 'reward',  handle: 'jade_l',   name: 'Jade L.',   color: '#a855f7', verified: false, qty: 2,   price: 8.55, total: 17.1, ts: '31m' },
    { id: 'a7',  type: 'buy',     handle: 'dex_n',    name: 'Dex N.',    color: '#818cf8', verified: false, qty: 15,  price: 8.50, total: 127.5,ts: '45m' },
    { id: 'a8',  type: 'stake',   handle: 'sam_q',    name: 'Sam Q.',    color: '#22c55e', verified: false, qty: 25,  price: 8.48, total: 212,  ts: '52m' },
    { id: 'a9',  type: 'sell',    handle: 'lily_p',   name: 'Lily P.',   color: '#f59e0b', verified: true,  qty: 8,   price: 8.45, total: 67.6, ts: '1h'  },
    { id: 'a10', type: 'buy',     handle: 'max_t',    name: 'Max T.',    color: '#ec4899', verified: false, qty: 40,  price: 8.40, total: 336,  ts: '1h'  },
    { id: 'a11', type: 'unstake', handle: 'atlas_k',  name: 'Atlas K',   color: '#818cf8', verified: true,  qty: 10,  price: 8.35, total: 83.5, ts: '2h'  },
    { id: 'a12', type: 'buy',     handle: 'luna_w',   name: 'Luna W.',   color: '#f87171', verified: false, qty: 5,   price: 8.30, total: 41.5, ts: '3h'  },
  ],
}

const TYPE_META: Record<ActivityType, { icon: string; label: string; color: string }> = {
  buy:      { icon: '↓', label: 'Buy',      color: '#22c55e' },
  sell:     { icon: '↑', label: 'Sell',     color: '#f87171' },
  stake:    { icon: '🔒', label: 'Stake',   color: '#f59e0b' },
  unstake:  { icon: '🔓', label: 'Unstake', color: '#818cf8' },
  transfer: { icon: '→',  label: 'Transfer', color: '#94a3b8' },
  reward:   { icon: '🎁', label: 'Reward',  color: '#22c55e' },
}

type FilterType = 'all' | ActivityType

export default function TokenActivityPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol : 'SVRN'
  const token = TOKEN_DATA[symbol] ?? TOKEN_DATA.SVRN
  const activity = TOKEN_ACTIVITY[symbol] ?? TOKEN_ACTIVITY.SVRN

  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? activity : activity.filter(a => a.type === filter)

  const vol24h = activity.filter(a => a.type === 'buy' || a.type === 'sell').reduce((acc, a) => acc + a.total, 0)
  const buys = activity.filter(a => a.type === 'buy').length
  const sells = activity.filter(a => a.type === 'sell').length
  const bullish = buys / (buys + sells)

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',     label: 'All'    },
    { key: 'buy',     label: 'Buys'   },
    { key: 'sell',    label: 'Sells'  },
    { key: 'stake',   label: 'Stakes' },
    { key: 'reward',  label: 'Rewards'},
  ]

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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0"
            style={{ background: `${token.color}18`, color: token.color }}>
            {symbol[0]}
          </div>
          <div>
            <div className="font-black text-white">${symbol} Activity</div>
            <div className="text-xs text-white/30">{token.name}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-black text-sm text-white/75">${token.price}</div>
            <div className="text-xs font-bold" style={{ color: token.change24h >= 0 ? '#22c55e' : '#f87171' }}>
              {token.change24h >= 0 ? '+' : ''}{token.change24h}%
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-sm" style={{ color: token.color }}>${(token.volume24h / 1000).toFixed(0)}k</div>
            <div className="text-xs text-white/25">24h Vol</div>
          </div>
          <div className="p-2 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-sm text-white/70">{token.holders.toLocaleString()}</div>
            <div className="text-xs text-white/25">Holders</div>
          </div>
          <div className="p-2 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-sm" style={{ color: '#22c55e' }}>{Math.round(bullish * 100)}%</div>
            <div className="text-xs text-white/25">Bullish</div>
          </div>
        </div>

        {/* Buy/sell sentiment bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-white/30 mb-1">
            <span>Buys ({buys})</span>
            <span>Sells ({sells})</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ width: `${bullish * 100}%`, background: '#22c55e' }} />
            <div style={{ width: `${(1 - bullish) * 100}%`, background: '#f87171' }} />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f.key ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-2">
        {filtered.map(a => {
          const meta = TYPE_META[a.type]
          return (
            <button key={a.id} onClick={() => router.push(`/profile/${a.handle}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: `${a.color}15`, color: a.color }}>
                {a.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/75">@{a.handle}</span>
                  {a.verified && <span className="text-xs" style={{ color: a.color }}>✓</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.icon} {meta.label}</span>
                  <span className="text-xs text-white/25">{a.qty} tokens @ ${a.price}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm" style={{ color: meta.color }}>${a.total.toFixed(0)}</div>
                <div className="text-xs text-white/25">{a.ts}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
