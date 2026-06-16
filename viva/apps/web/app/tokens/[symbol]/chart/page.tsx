'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface TokenData {
  name: string
  handle: string
  color: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  holders: number
  supply: number
}

const TOKENS: Record<string, TokenData> = {
  SVRN: { name: 'Sovereign V',  handle: 'sovereign_v', color: '#a855f7', price: 8.75,  change24h: 4.2,   marketCap: 875000,  volume24h: 124000, holders: 2840, supply: 100000 },
  MAYA: { name: 'Maya Chen',    handle: 'mayafit',     color: '#22c55e', price: 5.20,  change24h: -1.8,  marketCap: 520000,  volume24h: 48000,  holders: 1620, supply: 100000 },
  JAX:  { name: 'Jax Beats',   handle: 'jaxbeats',    color: '#ec4899', price: 3.80,  change24h: 7.1,   marketCap: 380000,  volume24h: 67000,  holders: 980,  supply: 100000 },
}

type Period = '1H' | '4H' | '1D' | '1W' | '1M' | 'ALL'

// Generate synthetic price chart data
function generateChart(basePrice: number, change: number, points: number): { x: number; y: number }[] {
  const data = []
  let price = basePrice * (1 - change / 100)
  for (let i = 0; i < points; i++) {
    price += (Math.random() - 0.48) * basePrice * 0.015
    price = Math.max(basePrice * 0.5, price)
    data.push({ x: i, y: price })
  }
  data.push({ x: points - 1, y: basePrice })
  return data
}

function ChartSVG({ data, color, width = 340, height = 160 }: { data: {x:number;y:number}[]; color: string; width?: number; height?: number }) {
  if (data.length === 0) return null
  const minY = Math.min(...data.map(d => d.y))
  const maxY = Math.max(...data.map(d => d.y))
  const rangeY = maxY - minY || 1
  const pad = { t: 8, b: 8, l: 8, r: 8 }
  const W = width - pad.l - pad.r
  const H = height - pad.t - pad.b
  const pts = data.map(d => ({
    px: pad.l + (d.x / (data.length - 1)) * W,
    py: pad.t + H - ((d.y - minY) / rangeY) * H,
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')
  const fill = `${path} L${pts[pts.length-1].px},${pad.t+H} L${pad.l},${pad.t+H} Z`
  const id = `grad-${color.replace('#','')}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function TokenChartPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const token = TOKENS[symbol] ?? TOKENS.SVRN

  const [period, setPeriod] = useState<Period>('1D')
  const [hovered, setHovered] = useState<number | null>(null)

  const PERIODS: Period[] = ['1H', '4H', '1D', '1W', '1M', 'ALL']
  const POINT_COUNTS: Record<Period, number> = { '1H': 60, '4H': 96, '1D': 96, '1W': 168, '1M': 120, ALL: 200 }

  const chartData = generateChart(token.price, token.change24h, POINT_COUNTS[period])
  const displayPrice = hovered !== null ? chartData[hovered]?.y ?? token.price : token.price
  const startPrice = chartData[0]?.y ?? token.price
  const priceDiff = displayPrice - startPrice
  const pctDiff = (priceDiff / startPrice) * 100

  const positive = token.change24h >= 0
  const green = '#22c55e'
  const red = '#f87171'

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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
            style={{ background: `${token.color}18`, color: token.color }}>
            {symbol[0]}
          </div>
          <div>
            <div className="font-black text-white text-sm">${symbol}</div>
            <div className="text-xs text-white/30">{token.name}</div>
          </div>
          <button onClick={() => router.push(`/tokens/${symbol}/trade`)}
            className="ml-auto px-3 py-1.5 rounded-xl text-xs font-black"
            style={{ background: token.color, color: '#04040A' }}>
            Trade
          </button>
        </div>
      </header>

      <div className="px-4 py-5">
        {/* Price header */}
        <div className="mb-5">
          <div className="text-3xl font-black text-white">${displayPrice.toFixed(2)}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold" style={{ color: pctDiff >= 0 ? green : red }}>
              {pctDiff >= 0 ? '+' : ''}{pctDiff.toFixed(2)}%
            </span>
            <span className="text-xs text-white/25">{period}</span>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <ChartSVG data={chartData} color={positive ? green : red} width={380} height={180} />
        </div>

        {/* Period pills */}
        <div className="flex gap-1.5 mb-6">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={period === p ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: '24h Change',  value: `${positive ? '+' : ''}${token.change24h}%`, color: positive ? green : red },
            { label: 'Market Cap',  value: `$${(token.marketCap/1000).toFixed(0)}k` },
            { label: '24h Volume',  value: `$${(token.volume24h/1000).toFixed(0)}k` },
            { label: 'Holders',     value: token.holders.toLocaleString() },
            { label: 'Supply',      value: token.supply.toLocaleString() },
            { label: 'Your Rank',   value: '#12',  color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/25 mb-0.5">{s.label}</div>
              <div className="font-black text-sm" style={{ color: s.color ?? 'rgba(255,255,255,0.75)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Creator link */}
        <button onClick={() => router.push(`/profile/${token.handle}`)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 text-left"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
            style={{ background: `${token.color}18`, color: token.color }}>
            {token.name[0]}
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-white/80">{token.name}</div>
            <div className="text-xs text-white/25">@{token.handle} · Creator</div>
          </div>
          <span className="text-white/20 text-xs">Profile →</span>
        </button>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button onClick={() => router.push(`/staking/${token.handle}`)}
            className="flex-1 py-3 rounded-xl font-black text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>
            🔒 Stake
          </button>
          <button onClick={() => router.push(`/tokens/${symbol}/trade`)}
            className="flex-1 py-3 rounded-xl font-black text-sm"
            style={{ background: token.color, color: '#04040A' }}>
            Trade ${symbol}
          </button>
        </div>
      </div>
    </div>
  )
}
