'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Holding {
  symbol: string
  creatorName: string
  color: string
  qty: number
  avgCost: number
  currentPrice: number
  value: number
  pnl: number
  pnlPct: number
  staked: number
  stakedApy: number
}

const PORTFOLIOS: Record<string, { totalValue: number; totalCost: number; holdings: Holding[] }> = {
  atlas_k: {
    totalValue: 42840,
    totalCost: 28400,
    holdings: [
      { symbol: 'SVRN', creatorName: 'Sovereign V', color: '#a855f7', qty: 80,  avgCost: 6.20, currentPrice: 8.75, value: 700,  pnl: 204,   pnlPct: 41.1, staked: 50, stakedApy: 22 },
      { symbol: 'MAYA', creatorName: 'Maya Chen',   color: '#22c55e', qty: 120, avgCost: 3.80, currentPrice: 5.20, value: 624,  pnl: 168,   pnlPct: 36.8, staked: 80, stakedApy: 14 },
      { symbol: 'JAX',  creatorName: 'Jax Beats',  color: '#ec4899', qty: 200, avgCost: 1.90, currentPrice: 3.80, value: 760,  pnl: 380,   pnlPct: 100,  staked: 0,  stakedApy: 0  },
    ],
  },
  sovereign_v: {
    totalValue: 18200,
    totalCost: 12000,
    holdings: [
      { symbol: 'MAYA', creatorName: 'Maya Chen', color: '#22c55e', qty: 500, avgCost: 4.10, currentPrice: 5.20, value: 2600, pnl: 550,  pnlPct: 26.8, staked: 300, stakedApy: 22 },
      { symbol: 'JAX',  creatorName: 'Jax Beats', color: '#ec4899', qty: 800, avgCost: 2.40, currentPrice: 3.80, value: 3040, pnl: 1120, pnlPct: 58.3, staked: 0,   stakedApy: 0  },
    ],
  },
}

type Period = '1D' | '1W' | '1M' | '3M' | 'ALL'

function generatePerf(base: number, periods: number, vol: number) {
  const arr = [base * 0.72]
  for (let i = 1; i < periods; i++) {
    arr.push(Math.max(arr[i-1] * (1 + (Math.random() - 0.45) * vol), base * 0.4))
  }
  arr.push(base)
  return arr
}

export default function PortfolioPerformancePage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'atlas_k'
  const portfolio = PORTFOLIOS[handle] ?? PORTFOLIOS.atlas_k

  const [period, setPeriod] = useState<Period>('1M')
  const [tab, setTab] = useState<'holdings' | 'history'>('holdings')

  const PERIODS: Period[] = ['1D', '1W', '1M', '3M', 'ALL']
  const POINTS: Record<Period, number> = { '1D': 24, '1W': 56, '1M': 90, '3M': 90, 'ALL': 90 }

  const perf = generatePerf(portfolio.totalValue, POINTS[period], 0.025)
  const minV = Math.min(...perf)
  const maxV = Math.max(...perf)
  const rangeV = maxV - minV || 1
  const W = 360; const H = 160
  const pad = { t: 8, b: 8, l: 8, r: 8 }
  const pts = perf.map((v, i) => ({
    px: pad.l + (i / (perf.length - 1)) * (W - pad.l - pad.r),
    py: pad.t + (H - pad.t - pad.b) - ((v - minV) / rangeV) * (H - pad.t - pad.b),
  }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')
  const fillPath = `${linePath} L${pts[pts.length-1].px},${pad.t+H-pad.b} L${pad.l},${pad.t+H-pad.b} Z`

  const totalPnl = portfolio.totalValue - portfolio.totalCost
  const totalPnlPct = (totalPnl / portfolio.totalCost) * 100
  const positive = totalPnl >= 0
  const green = '#22c55e'; const red = '#f87171'
  const lineColor = positive ? green : red

  const stakingIncome = portfolio.holdings.reduce((acc, h) => acc + h.staked * h.currentPrice * (h.stakedApy / 100), 0)

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
          <div>
            <div className="font-black text-white">Portfolio Performance</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-5">
        {/* Total value */}
        <div className="mb-5">
          <div className="text-3xl font-black text-white">${portfolio.totalValue.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold" style={{ color: positive ? green : red }}>
              {positive ? '+' : ''}${totalPnl.toLocaleString()} ({positive ? '+' : ''}{totalPnlPct.toFixed(1)}%)
            </span>
            <span className="text-xs text-white/25">all time</span>
          </div>
        </div>

        {/* Performance chart */}
        <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={lineColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#perfGrad)" />
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Period pills */}
        <div className="flex gap-1.5 mb-6">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={period === p ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Invested',       value: `$${portfolio.totalCost.toLocaleString()}` },
            { label: 'Total P&L',      value: `${positive ? '+' : ''}$${totalPnl.toLocaleString()}`, color: positive ? green : red },
            { label: 'Staking / yr',   value: `+$${Math.round(stakingIncome).toLocaleString()}`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/25 mb-0.5">{s.label}</div>
              <div className="font-black text-sm" style={{ color: s.color ?? 'rgba(255,255,255,0.75)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['holdings', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
              style={tab === t ? { background: 'rgba(255,255,255,0.08)', color: 'white' } : { color: 'rgba(255,255,255,0.3)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'holdings' && (
          <div className="space-y-2">
            {portfolio.holdings.map(h => (
              <button key={h.symbol} onClick={() => router.push(`/tokens/${h.symbol}/chart`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${h.color}15`, color: h.color }}>
                  {h.symbol[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white/80">${h.symbol}</div>
                  <div className="text-xs text-white/25">
                    {h.qty} tokens · avg ${h.avgCost.toFixed(2)}
                    {h.staked > 0 && <span className="ml-1 text-amber-400/60">· {h.staked} staked {h.stakedApy}%</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm text-white/75">${(h.qty * h.currentPrice).toFixed(0)}</div>
                  <div className="text-xs font-bold" style={{ color: h.pnlPct >= 0 ? green : red }}>
                    {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(1)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {[
              { date: 'Jun 15', action: 'Bought', symbol: 'SVRN', qty: 10, price: 8.20, total: 82   },
              { date: 'Jun 12', action: 'Staked', symbol: 'MAYA', qty: 30, price: 5.10, total: 153  },
              { date: 'Jun 08', action: 'Bought', symbol: 'JAX',  qty: 50, price: 3.40, total: 170  },
              { date: 'Jun 03', action: 'Sold',   symbol: 'SVRN', qty: 5,  price: 7.80, total: 39   },
            ].map((tx, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: tx.action === 'Sold' ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)', color: tx.action === 'Sold' ? red : green }}>
                  {tx.action === 'Bought' ? '↓' : tx.action === 'Sold' ? '↑' : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-white/75">{tx.action} {tx.qty} ${tx.symbol}</div>
                  <div className="text-xs text-white/25">@ ${tx.price} · {tx.date}</div>
                </div>
                <div className="font-black text-sm" style={{ color: tx.action === 'Sold' ? red : green }}>
                  {tx.action === 'Sold' ? '+' : '-'}${tx.total}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
