'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const USERS: Record<string, { name: string; color: string; handle: string }> = {
  sovereign_v: { name: 'Sovereign V',  color: '#a855f7', handle: 'sovereign_v' },
  mayafit:     { name: 'Maya Chen',     color: '#22c55e', handle: 'mayafit'     },
  jaxbeats:    { name: 'Jax Beats',     color: '#ec4899', handle: 'jaxbeats'    },
}

const HOLDINGS = [
  { symbol: 'SVRN', name: 'Sovereign V',  color: '#a855f7', amount: 120, price: 8.75,  change: +12.4,  staked: 80  },
  { symbol: 'MAYA', name: 'Maya Chen',    color: '#22c55e', amount: 55,  price: 5.20,  change: +6.2,   staked: 25  },
  { symbol: 'JAX',  name: 'Jax Beats',   color: '#ec4899', amount: 30,  price: 3.80,  change: -2.1,   staked: 0   },
  { symbol: 'NOA',  name: 'Noa D.',       color: '#f59e0b', amount: 18,  price: 6.40,  change: +21.0,  staked: 10  },
  { symbol: 'KAT',  name: 'Kat Zhou',    color: '#818cf8', amount: 12,  price: 4.10,  change: -5.5,   staked: 0   },
]

const ACTIVITY = [
  { id: 'a1', type: 'buy',    symbol: 'SVRN', amount: 20,  price: 7.80, ts: new Date(Date.now() - 86400000 * 2).toISOString()  },
  { id: 'a2', type: 'stake',  symbol: 'MAYA', amount: 25,  price: 5.10, ts: new Date(Date.now() - 86400000 * 3).toISOString()  },
  { id: 'a3', type: 'reward', symbol: 'SVRN', amount: 1.4, price: 8.60, ts: new Date(Date.now() - 86400000 * 5).toISOString()  },
  { id: 'a4', type: 'sell',   symbol: 'JAX',  amount: 10,  price: 4.20, ts: new Date(Date.now() - 86400000 * 7).toISOString()  },
]

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  buy:    { label: 'Bought',  color: '#22c55e', icon: '↓' },
  sell:   { label: 'Sold',    color: '#f87171', icon: '↑' },
  stake:  { label: 'Staked',  color: '#818cf8', icon: '🔒' },
  reward: { label: 'Reward',  color: '#f59e0b', icon: '✨' },
}

type Tab = 'holdings' | 'activity' | 'stats'

function fmtRelative(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`
}

export default function PortfolioHandlePage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const user = USERS[handle] ?? USERS.sovereign_v

  const [tab, setTab] = useState<Tab>('holdings')

  const totalValue = HOLDINGS.reduce((s, h) => s + h.amount * h.price, 0)
  const totalStaked = HOLDINGS.reduce((s, h) => s + h.staked * h.price, 0)
  const dailyPnl = HOLDINGS.reduce((s, h) => s + h.amount * h.price * (h.change / 100), 0)
  const pnlPct = (dailyPnl / (totalValue - dailyPnl)) * 100

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
          <button onClick={() => router.push(`/profile/${handle}`)} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
              style={{ background: `${user.color}18`, color: user.color }}>
              {user.name[0]}
            </div>
            <span className="font-black text-white text-sm">{user.name}&apos;s Portfolio</span>
          </button>
        </div>
        <div className="flex gap-1">
          {(['holdings', 'activity', 'stats'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all"
              style={tab === t ? { background: user.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Value card */}
      <div className="px-4 py-4">
        <div className="p-5 rounded-2xl border border-white/5 space-y-1"
          style={{ background: `linear-gradient(135deg, ${user.color}08, rgba(255,255,255,0.01))` }}>
          <div className="text-xs text-white/30">Total Portfolio Value</div>
          <div className="text-4xl font-black text-white">${totalValue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: pnlPct >= 0 ? '#22c55e' : '#f87171' }}>
              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
            </span>
            <span className="text-sm font-bold" style={{ color: dailyPnl >= 0 ? '#22c55e' : '#f87171' }}>
              ({dailyPnl >= 0 ? '+' : ''}${dailyPnl.toFixed(2)})
            </span>
            <span className="text-xs text-white/25">24h</span>
          </div>
          <div className="flex gap-4 pt-2">
            <div>
              <div className="text-xs text-white/25">Staked</div>
              <div className="font-bold text-sm text-white/60">${totalStaked.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-white/25">Liquid</div>
              <div className="font-bold text-sm text-white/60">${(totalValue - totalStaked).toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-white/25">Tokens</div>
              <div className="font-bold text-sm text-white/60">{HOLDINGS.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-2">
        {tab === 'holdings' && HOLDINGS.map(h => {
          const value = h.amount * h.price
          const pct = (value / totalValue) * 100
          return (
            <button key={h.symbol} onClick={() => router.push(`/tokens/${h.symbol}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs"
                style={{ background: `${h.color}18`, color: h.color }}>
                ${h.symbol}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white/80">{h.name}</div>
                <div className="text-xs text-white/25">{h.amount} tokens{h.staked > 0 ? ` · ${h.staked} staked` : ''}</div>
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: h.color }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm text-white/80">${value.toFixed(2)}</div>
                <div className="text-xs font-bold" style={{ color: h.change >= 0 ? '#22c55e' : '#f87171' }}>
                  {h.change >= 0 ? '+' : ''}{h.change}%
                </div>
              </div>
            </button>
          )
        })}

        {tab === 'activity' && ACTIVITY.map(a => {
          const tm = TYPE_META[a.type]
          return (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ background: `${tm.color}12`, color: tm.color }}>
                {tm.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-white/80">{tm.label} ${a.symbol}</div>
                <div className="text-xs text-white/25">{a.amount} @ ${a.price} · {fmtRelative(a.ts)}</div>
              </div>
              <div className="font-black text-sm" style={{ color: tm.color }}>
                ${(a.amount * a.price).toFixed(2)}
              </div>
            </div>
          )
        })}

        {tab === 'stats' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-white/5 space-y-3"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Allocation</div>
              {HOLDINGS.map(h => {
                const pct = ((h.amount * h.price) / totalValue) * 100
                return (
                  <div key={h.symbol} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">${h.symbol}</span>
                      <span className="font-bold text-white/70">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: h.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Best Performer', value: '+21.0% NOA', color: '#22c55e' },
                { label: 'Worst Performer', value: '-5.5% KAT', color: '#f87171' },
                { label: 'Staking Yield',  value: '~18% APY avg', color: '#818cf8' },
                { label: 'Est. Monthly',   value: '+$142', color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl border border-white/5"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="text-xs text-white/25 mb-1">{s.label}</div>
                  <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
