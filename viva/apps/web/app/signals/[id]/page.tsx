'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Signal {
  id: string
  type: 'long' | 'short' | 'neutral'
  asset: string
  entry: number
  tp1: number
  tp2: number | null
  sl: number
  creatorHandle: string
  creatorName: string
  creatorColor: string
  tier: string
  timeframe: string
  confidence: number
  ts: string
  rationale: string[]
  tags: string[]
  status: 'open' | 'tp1_hit' | 'tp2_hit' | 'stopped' | 'closed'
  currentPrice: number
  likes: number
  comments: number
  copies: number
}

const SIGNALS: Record<string, Signal> = {
  sig1: {
    id: 'sig1',
    type: 'long',
    asset: 'BTC/USD',
    entry: 98400,
    tp1: 104000,
    tp2: 110000,
    sl: 94000,
    creatorHandle: 'sovereign_v',
    creatorName: 'Sovereign V',
    creatorColor: '#a855f7',
    tier: 'Gold+',
    timeframe: '4H',
    confidence: 85,
    ts: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    rationale: [
      'Weekly support held at $97.8k — 3rd test, buyers stepping in',
      'RSI divergence on 4H: price lower, RSI higher → momentum shift',
      'CMF positive + volume spike on last green candle confirms accumulation',
      'Macro catalyst: ETF inflows up 40% WoW per on-chain data',
    ],
    tags: ['BTC', 'crypto', 'macro', 'swing'],
    status: 'open',
    currentPrice: 101200,
    likes: 847,
    comments: 63,
    copies: 128,
  },
  sig2: {
    id: 'sig2',
    type: 'short',
    asset: 'ETH/USD',
    entry: 3820,
    tp1: 3600,
    tp2: 3400,
    sl: 3950,
    creatorHandle: 'sovereign_v',
    creatorName: 'Sovereign V',
    creatorColor: '#a855f7',
    tier: 'Diamond',
    timeframe: '1D',
    confidence: 72,
    ts: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    rationale: [
      'Daily bearish engulfing at key resistance $3,850',
      'Funding rates elevated — overleveraged longs due for flush',
      'ETH/BTC ratio rejecting 0.039 — relative weakness',
    ],
    tags: ['ETH', 'short', 'leverage'],
    status: 'open',
    currentPrice: 3710,
    likes: 341,
    comments: 28,
    copies: 54,
  },
}

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  long:    { label: 'LONG',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  short:   { label: 'SHORT',   color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  neutral: { label: 'NEUTRAL', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtNum(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`
  if (n >= 1000)    return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toLocaleString()}`
}

function pct(a: number, b: number) {
  return (((b - a) / a) * 100).toFixed(1)
}

export default function SignalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'sig1'
  const signal = SIGNALS[id] ?? SIGNALS.sig1

  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)

  const ts = TYPE_STYLES[signal.type]
  const riskReward = Math.abs(signal.tp1 - signal.entry) / Math.abs(signal.entry - signal.sl)
  const pnl = signal.type === 'long'
    ? ((signal.currentPrice - signal.entry) / signal.entry) * 100
    : ((signal.entry - signal.currentPrice) / signal.entry) * 100
  const pnlPositive = pnl >= 0

  async function copy() {
    setCopying(true)
    await new Promise(r => setTimeout(r, 900))
    setCopying(false)
    setCopied(true)
  }

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
            <div className="font-black text-white">{signal.asset} Signal</div>
            <div className="text-xs text-white/25">{fmtRelative(signal.ts)} · {signal.timeframe}</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg font-black text-xs"
            style={{ background: ts.bg, color: ts.color }}>
            {ts.label}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Creator */}
        <button onClick={() => router.push(`/profile/${signal.creatorHandle}`)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
            style={{ background: `${signal.creatorColor}18`, color: signal.creatorColor }}>
            {signal.creatorName[0]}
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-white/80">{signal.creatorName}</div>
            <div className="text-xs text-white/25">@{signal.creatorHandle}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
              {signal.tier}
            </div>
            <div className="text-xs text-white/25 mt-0.5">{signal.confidence}% confidence</div>
          </div>
        </button>

        {/* Price levels */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-3"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-black text-white/60">Levels</span>
            <span className="text-xs text-white/25">{signal.timeframe} · RR {riskReward.toFixed(1)}x</span>
          </div>

          {[
            { label: signal.tp2 ? 'TP2' : null,  value: signal.tp2,    color: '#22c55e',   icon: '🎯' },
            { label: 'TP1',   value: signal.tp1,   color: '#22c55e',   icon: '🎯' },
            { label: 'Entry', value: signal.entry,  color: 'white',     icon: '→' },
            { label: 'Now',   value: signal.currentPrice, color: pnlPositive ? '#22c55e' : '#f87171', icon: '·' },
            { label: 'SL',    value: signal.sl,    color: '#f87171',   icon: '🛑' },
          ].filter(r => r.value !== null).map(r => (
            <div key={r.label!} className="flex items-center gap-3 text-sm">
              <span className="text-base w-6 text-center">{r.icon}</span>
              <span className="text-white/40 w-12">{r.label}</span>
              <span className="flex-1 font-black" style={{ color: r.color }}>{fmtNum(r.value!)}</span>
              {r.label !== 'Entry' && r.label !== 'Now' && (
                <span className="text-xs" style={{ color: r.color }}>
                  {signal.type === 'long' ? '+' : ''}{pct(signal.entry, r.value!)}%
                </span>
              )}
            </div>
          ))}

          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-white/30">Current P&L</span>
            <span className="font-black text-lg" style={{ color: pnlPositive ? '#22c55e' : '#f87171' }}>
              {pnlPositive ? '+' : ''}{pnl.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Rationale */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Analysis</div>
          <div className="p-4 rounded-2xl border border-white/5 space-y-2.5"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            {signal.rationale.map((r, i) => (
              <div key={i} className="flex gap-2.5 text-sm text-white/55">
                <span className="text-white/20 mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {signal.tags.map(t => (
            <span key={t} className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              #{t}
            </span>
          ))}
        </div>

        {/* Engagement */}
        <div className="flex gap-3">
          <button onClick={() => setLiked(l => !l)}
            className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
            style={liked ? { background: 'rgba(248,113,113,0.1)', color: '#f87171' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
            {liked ? '❤️' : '🤍'} {signal.likes + (liked ? 1 : 0)}
          </button>
          <button onClick={() => router.push('/signals')}
            className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
            💬 {signal.comments}
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
            🔁 {signal.copies}
          </button>
        </div>

        {/* CTA */}
        <button onClick={copy} disabled={copied || copying}
          className="w-full py-4 rounded-2xl font-black text-lg transition-all"
          style={{ background: copied ? '#22c55e' : ts.color, color: '#04040A' }}>
          {copied ? '✓ Trade Copied!' : copying ? 'Copying…' : `Copy ${ts.label} Trade`}
        </button>
        {copied && (
          <div className="text-center text-xs text-white/30">Trade mirrored to your portfolio</div>
        )}
      </div>
    </div>
  )
}
