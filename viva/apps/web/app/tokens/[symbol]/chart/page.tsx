'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface TokenMeta {
  name: string; color: string; price: number; change24h: number; change7d: number
  high24h: number; low24h: number; volume24h: number; marketCap: number
  totalSupply: number; circulatingSupply: number; holders: number
  stakedPct: number; creatorHandle: string
}

const TOKEN_META: Record<string, TokenMeta> = {
  SVRN: { name:'Sovereign V', color:'#a855f7', price:8.75, change24h:4.2, change7d:18.4, high24h:9.10, low24h:8.20, volume24h:128400, marketCap:875000, totalSupply:100000, circulatingSupply:68000, holders:2840, stakedPct:42, creatorHandle:'sovereign_v' },
  MAYA: { name:'Maya Chen',   color:'#22c55e', price:5.20, change24h:-1.8, change7d:6.2,  high24h:5.45, low24h:5.05, volume24h:84200,  marketCap:416000, totalSupply:80000,  circulatingSupply:52000, holders:1620, stakedPct:38, creatorHandle:'mayafit'     },
  JAX:  { name:'Jax Beats',  color:'#ec4899', price:3.80, change24h:7.1,  change7d:22.1, high24h:3.95, low24h:3.50, volume24h:61000,  marketCap:190000, totalSupply:50000,  circulatingSupply:42000, holders:980,  stakedPct:28, creatorHandle:'jaxbeats'    },
}

type Period = '1H' | '4H' | '1D' | '1W' | '1M'

function genCandles(base: number, n: number, vol: number) {
  const candles = []
  let price = base * 0.75
  for (let i = 0; i < n; i++) {
    const o = price
    const move = (Math.random() - 0.48) * vol * price
    const c = Math.max(price + move, base * 0.3)
    const h = Math.max(o, c) * (1 + Math.random() * 0.008)
    const l = Math.min(o, c) * (1 - Math.random() * 0.008)
    candles.push({ o, h, l, c })
    price = c
  }
  candles[candles.length - 1].c = base
  return candles
}

export default function TokenChartPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol : 'SVRN'
  const meta = TOKEN_META[symbol] ?? TOKEN_META.SVRN

  const [period, setPeriod] = useState<Period>('1D')
  const [tab, setTab] = useState<'chart' | 'info'>('chart')

  const PERIODS: Period[] = ['1H', '4H', '1D', '1W', '1M']
  const N_CANDLES: Record<Period, number> = { '1H': 60, '4H': 48, '1D': 90, '1W': 52, '1M': 30 }
  const VOL: Record<Period, number> = { '1H': 0.005, '4H': 0.012, '1D': 0.025, '1W': 0.05, '1M': 0.08 }

  const candles = genCandles(meta.price, N_CANDLES[period], VOL[period])
  const allH = Math.max(...candles.map(c => c.h))
  const allL = Math.min(...candles.map(c => c.l))
  const range = allH - allL || 0.01

  const W = 360; const H = 180; const padX = 4; const padY = 8
  const cw = (W - padX * 2) / candles.length
  const green = '#22c55e'; const red = '#f87171'

  const positive = meta.change24h >= 0

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
          <button onClick={() => router.push(`/profile/${meta.creatorHandle}`)}
            className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
              style={{ background: `${meta.color}18`, color: meta.color }}>{symbol[0]}</div>
            <div>
              <div className="font-black text-sm text-white">${symbol}</div>
              <div className="text-xs text-white/30">{meta.name}</div>
            </div>
          </button>
          <div className="ml-auto text-right">
            <div className="font-black text-lg text-white">${meta.price}</div>
            <div className="text-xs font-bold" style={{ color: positive ? green : red }}>
              {positive ? '+' : ''}{meta.change24h}% 24h
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {/* High / Low bar */}
        <div className="flex justify-between text-xs text-white/30">
          <span>L ${meta.low24h}</span>
          <div className="flex-1 mx-3 flex items-center">
            <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{
                background: meta.color,
                marginLeft: `${((meta.price - meta.low24h) / (meta.high24h - meta.low24h)) * 80}%`,
                width: '6px'
              }} />
            </div>
          </div>
          <span>H ${meta.high24h}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['chart','info'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
              style={tab === t ? { background: 'rgba(255,255,255,0.08)', color: 'white' } : { color: 'rgba(255,255,255,0.3)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'chart' && (
          <>
            {/* Period selector */}
            <div className="flex gap-1.5">
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="flex-1 py-1.5 rounded-full text-xs font-bold"
                  style={period === p ? { background: meta.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Candlestick chart */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map(f => {
                  const y = padY + (1 - f) * (H - padY * 2)
                  return <line key={f} x1={padX} y1={y} x2={W-padX} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                })}
                {/* Candles */}
                {candles.map((c, i) => {
                  const x = padX + i * cw + cw * 0.1
                  const w = cw * 0.8
                  const bullish = c.c >= c.o
                  const col = bullish ? green : red
                  const bodyY = padY + (1 - (Math.max(c.o,c.c) - allL) / range) * (H - padY*2)
                  const bodyH = Math.max(1, ((Math.abs(c.c - c.o)) / range) * (H - padY*2))
                  const wickTopY = padY + (1 - (c.h - allL) / range) * (H - padY*2)
                  const wickBotY = padY + (1 - (c.l - allL) / range) * (H - padY*2)
                  const midX = x + w/2
                  return (
                    <g key={i}>
                      <line x1={midX} y1={wickTopY} x2={midX} y2={wickBotY} stroke={col} strokeWidth="0.6" strokeOpacity="0.7"/>
                      <rect x={x} y={bodyY} width={w} height={bodyH} fill={bullish ? `${col}80` : col} rx="0.5"/>
                    </g>
                  )
                })}
              </svg>
            </div>
          </>
        )}

        {tab === 'info' && (
          <div className="space-y-2">
            {[
              { l:'Market Cap',         v:`$${(meta.marketCap/1000).toFixed(0)}k`,        c: meta.color },
              { l:'24h Volume',         v:`$${(meta.volume24h/1000).toFixed(0)}k`,        c: 'rgba(255,255,255,0.7)' },
              { l:'Total Supply',       v:meta.totalSupply.toLocaleString(),               c: 'rgba(255,255,255,0.7)' },
              { l:'Circulating',        v:`${meta.circulatingSupply.toLocaleString()} (${((meta.circulatingSupply/meta.totalSupply)*100).toFixed(0)}%)`, c: 'rgba(255,255,255,0.7)' },
              { l:'Holders',            v:meta.holders.toLocaleString(),                   c: 'rgba(255,255,255,0.7)' },
              { l:'% Staked',           v:`${meta.stakedPct}%`,                            c: '#f59e0b' },
              { l:'7D Change',          v:`${meta.change7d >= 0 ? '+' : ''}${meta.change7d}%`, c: meta.change7d >= 0 ? green : red },
            ].map(r => (
              <div key={r.l} className="flex justify-between p-3 rounded-xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <span className="text-xs text-white/30">{r.l}</span>
                <span className="font-black text-sm" style={{ color: r.c }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={() => router.push(`/profile/${meta.creatorHandle}/invest`)}
            className="flex-1 py-3 rounded-xl font-black text-sm"
            style={{ background: meta.color, color: '#04040A' }}>
            Buy ${symbol}
          </button>
          <button onClick={() => router.push(`/tokens/${symbol}/staking`)}
            className="flex-1 py-3 rounded-xl font-black text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            Stake
          </button>
          <button onClick={() => router.push(`/tokens/${symbol}/holders`)}
            className="px-4 py-3 rounded-xl font-black text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            👥
          </button>
        </div>
      </div>
    </div>
  )
}
