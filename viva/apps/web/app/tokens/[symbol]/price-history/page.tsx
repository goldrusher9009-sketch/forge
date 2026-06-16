'use client'
import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface OHLC {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const TOKENS: Record<string, { name: string; color: string; supply: number }> = {
  SVRN: { name: 'Sovereign V', color: '#a855f7', supply: 10000 },
  MAYA: { name: 'Maya Chen',   color: '#22c55e', supply: 8000  },
  JAX:  { name: 'Jax Beats',  color: '#ec4899', supply: 12000 },
}

function genOHLC(days: number, basePrice: number, vol: number): OHLC[] {
  const arr: OHLC[] = []
  let price = basePrice * 0.6
  for (let i = days; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const open  = price
    const move  = (Math.random() - 0.46) * vol
    const close = Math.max(open * (1 + move), 0.01)
    const high  = Math.max(open, close) * (1 + Math.random() * 0.03)
    const low   = Math.min(open, close) * (1 - Math.random() * 0.03)
    arr.push({
      date: d.toISOString().slice(0, 10),
      open: +open.toFixed(3), high: +high.toFixed(3),
      low: +low.toFixed(3),   close: +close.toFixed(3),
      volume: Math.floor(2000 + Math.random() * 18000),
    })
    price = close
  }
  return arr
}

type Period = '7D' | '30D' | '90D' | 'ALL'
type View   = 'line' | 'candle'

export default function TokenPriceHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const token  = TOKENS[symbol] ?? TOKENS.SVRN

  const [period, setPeriod] = useState<Period>('30D')
  const [view,   setView  ] = useState<View>('line')

  const days = { '7D': 7, '30D': 30, '90D': 90, 'ALL': 180 }[period]
  const allData = useMemo(() => genOHLC(180, symbol === 'SVRN' ? 8.75 : symbol === 'MAYA' ? 5.20 : 3.80, 0.035), [symbol])
  const data    = allData.slice(allData.length - days - 1)

  const minP = Math.min(...data.map(d => d.low))
  const maxP = Math.max(...data.map(d => d.high))
  const rng  = maxP - minP || 0.01
  const W = 360; const H = 180
  const pad = { t: 12, b: 8, l: 8, r: 8 }

  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r),
    y: pad.t + (H - pad.t - pad.b) - ((d.close - minP) / rng) * (H - pad.t - pad.b),
    d,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const fillPath = `${linePath} L${pts[pts.length-1].x},${H-pad.b} L${pad.l},${H-pad.b} Z`

  const first = data[0]?.close ?? 0
  const last  = data[data.length-1]?.close ?? 0
  const chg   = last - first
  const chgPct = (chg / first) * 100
  const positive = chg >= 0
  const lineColor = positive ? '#22c55e' : '#f87171'

  const totalVol = data.reduce((s, d) => s + d.volume, 0)
  const maxVol   = Math.max(...data.map(d => d.volume))
  const ath = Math.max(...data.map(d => d.high))
  const atl = Math.min(...data.map(d => d.low))

  const PERIODS: Period[] = ['7D', '30D', '90D', 'ALL']

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
            <div className="font-black text-white">${symbol} Price History</div>
            <div className="text-xs text-white/30">{token.name}</div>
          </div>
          <button onClick={() => router.push(`/tokens/${symbol}/chart`)}
            className="px-2 py-1 rounded-lg text-xs font-black"
            style={{ background: `${token.color}15`, color: token.color }}>
            Chart
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div>
          <div className="text-3xl font-black text-white">${last.toFixed(3)}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold" style={{ color: positive ? '#22c55e' : '#f87171' }}>
              {positive ? '+' : ''}${chg.toFixed(3)} ({positive ? '+' : ''}{chgPct.toFixed(2)}%)
            </span>
            <span className="text-xs text-white/25">{period}</span>
          </div>
        </div>

        {/* Period + View toggles */}
        <div className="flex gap-2">
          <div className="flex gap-1 flex-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="flex-1 py-1.5 rounded-full text-xs font-bold"
                style={period === p ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => setView(v => v === 'line' ? 'candle' : 'line')}
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            {view === 'line' ? '🕯' : '📈'}
          </button>
        </div>

        {/* Chart */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={lineColor} stopOpacity="0.18" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {view === 'line' ? (
              <>
                <path d={fillPath} fill="url(#phGrad)" />
                <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </>
            ) : (
              pts.map((p, i) => {
                const d = p.d
                const isUp = d.close >= d.open
                const col  = isUp ? '#22c55e' : '#f87171'
                const barW = Math.max(2, (W - pad.l - pad.r) / data.length - 1)
                const bodyTop = pad.t + (H - pad.t - pad.b) - ((Math.max(d.open, d.close) - minP) / rng) * (H - pad.t - pad.b)
                const bodyBot = pad.t + (H - pad.t - pad.b) - ((Math.min(d.open, d.close) - minP) / rng) * (H - pad.t - pad.b)
                const wickTop = pad.t + (H - pad.t - pad.b) - ((d.high - minP) / rng) * (H - pad.t - pad.b)
                const wickBot = pad.t + (H - pad.t - pad.b) - ((d.low - minP) / rng) * (H - pad.t - pad.b)
                return (
                  <g key={i}>
                    <line x1={p.x} y1={wickTop} x2={p.x} y2={wickBot} stroke={col} strokeWidth="1" />
                    <rect x={p.x - barW/2} y={bodyTop} width={barW} height={Math.max(1, bodyBot - bodyTop)} fill={col} rx="0.5" />
                  </g>
                )
              })
            )}
          </svg>
          {/* Volume bars below */}
          <div className="flex items-end gap-px h-6 px-2 pb-1">
            {data.map((d, i) => (
              <div key={i} className="flex-1 rounded-t-sm"
                style={{ height: `${(d.volume / maxVol) * 100}%`, background: d.close >= d.open ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)', minHeight: 1 }} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Period High',   value: `$${ath.toFixed(3)}`,                             color: '#22c55e' },
            { label: 'Period Low',    value: `$${atl.toFixed(3)}`,                             color: '#f87171' },
            { label: 'Total Volume',  value: `${(totalVol/1000).toFixed(0)}k`,                 color: '#818cf8' },
            { label: 'Avg Daily Vol', value: `${(totalVol/data.length/1000).toFixed(1)}k`,     color: '#f59e0b' },
            { label: 'Open',          value: `$${first.toFixed(3)}`,                           color: 'rgba(255,255,255,0.4)' },
            { label: 'Close',         value: `$${last.toFixed(3)}`,                            color: 'rgba(255,255,255,0.4)' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/25 mb-0.5">{s.label}</div>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* OHLC table (last 7 days) */}
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider border-b border-white/5">Recent OHLC</div>
          <div className="divide-y divide-white/4">
            {data.slice(-7).reverse().map(d => {
              const isUp = d.close >= d.open
              return (
                <div key={d.date} className="flex items-center gap-2 px-4 py-2">
                  <span className="text-xs text-white/30 w-16 flex-shrink-0">{d.date.slice(5)}</span>
                  <span className="text-xs font-bold w-12" style={{ color: isUp ? '#22c55e' : '#f87171' }}>${d.close.toFixed(2)}</span>
                  <div className="flex-1 flex items-center gap-1 text-xs text-white/25">
                    <span>H ${d.high.toFixed(2)}</span>
                    <span className="text-white/10">·</span>
                    <span>L ${d.low.toFixed(2)}</span>
                  </div>
                  <span className="text-xs" style={{ color: isUp ? '#22c55e' : '#f87171' }}>
                    {isUp ? '+' : ''}{(((d.close - d.open) / d.open) * 100).toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
