'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { tokensApi } from '@/lib/api'

// ── Types ────────────────────────────────────────────────
interface HeldToken {
  symbol: string
  creator: string
  handle: string
  qty: number
  avgCost: number
  price: number
  change: number
  tier: string
  color: string
}

interface StakedPosition {
  symbol: string
  handle: string
  tier: string
  tierColor: string
  staked: number
  apy: number
  since: string
  earned: number
}

// ── Mock data ────────────────────────────────────────────
const HELD_TOKENS: HeldToken[] = [
  { symbol: 'MAYA', creator: 'Maya Chen',    handle: 'mayafit',   qty: 250, avgCost: 2.20, price: 2.85,  change: 29.5,  tier: 'Guardian', color: '#a855f7' },
  { symbol: 'ALEX', creator: 'Alex Rivera',  handle: 'alexribs',  qty: 100, avgCost: 5.10, price: 6.40,  change: 25.5,  tier: 'Guardian', color: '#a855f7' },
  { symbol: 'SAR',  creator: 'Sara Kim',     handle: 'sarakim',   qty: 500, avgCost: 0.92, price: 1.12,  change: 21.7,  tier: 'Proven',   color: '#38bdf8' },
  { symbol: 'JOE',  creator: 'Joe Martinez', handle: 'joemartinez',qty: 80, avgCost: 8.50, price: 7.20,  change: -15.3, tier: 'Guardian', color: '#a855f7' },
  { symbol: 'ZEN',  creator: 'Zena Okafor',  handle: 'zenaokafor',qty: 200, avgCost: 3.30, price: 3.95,  change: 19.7,  tier: 'Proven',   color: '#38bdf8' },
]

const STAKED: StakedPosition[] = [
  { symbol: 'MAYA', handle: 'mayafit',    tier: 'Gold',    tierColor: '#f59e0b', staked: 2000, apy: 22, since: '2024-11-15', earned: 36.67 },
  { symbol: 'ALEX', handle: 'alexribs',   tier: 'Silver',  tierColor: '#94a3b8', staked: 500,  apy: 14, since: '2025-01-03', earned: 8.17  },
  { symbol: 'SAR',  handle: 'sarakim',    tier: 'Bronze',  tierColor: '#cd7f32', staked: 100,  apy: 8,  since: '2025-02-10', earned: 0.67  },
]

// ── Sparkline ────────────────────────────────────────────
function Spark({ up }: { up: boolean }) {
  return (
    <svg width="48" height="18" viewBox="0 0 48 18">
      {up
        ? <polyline points="0,14 8,10 16,12 24,6 32,8 40,3 48,1"
            fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        : <polyline points="0,2 8,5 16,3 24,9 32,7 40,13 48,15"
            fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      }
    </svg>
  )
}

// ── Donut chart ──────────────────────────────────────────
function DonutChart({ slices }: { slices: { pct: number; color: string; label: string }[] }) {
  const r = 36; const cx = 44; const cy = 44; const stroke = 12
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      {slices.map((s, i) => {
        const dash = (s.pct / 100) * circ
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function WalletPage() {
  const [tab, setTab] = useState<'holdings' | 'staked' | 'activity'>('holdings')
  const [mounted, setMounted] = useState(false)
  const [tokens, setTokens] = useState<HeldToken[]>(HELD_TOKENS)

  useEffect(() => {
    setMounted(true)
    // Try real API
    tokensApi.list().then((list: any[]) => {
      if (!list?.length) return
      // Merge real prices into held tokens
      setTokens(prev => prev.map(h => {
        const live = list.find((t: any) => t.symbol === h.symbol)
        if (!live) return h
        return { ...h, price: live.price ?? h.price, change: live.change ?? h.change }
      }))
    }).catch(() => {})
  }, [])

  if (!mounted) return null

  // ── Compute totals ──
  const holdTotal = tokens.reduce((s, t) => s + t.qty * t.price, 0)
  const holdCost  = tokens.reduce((s, t) => s + t.qty * t.avgCost, 0)
  const holdPnl   = holdTotal - holdCost
  const holdPct   = holdCost > 0 ? (holdPnl / holdCost) * 100 : 0

  const stakedTotal  = STAKED.reduce((s, p) => s + p.staked, 0)
  const earnedTotal  = STAKED.reduce((s, p) => s + p.earned, 0)

  const totalValue = holdTotal + stakedTotal

  // Donut slices
  const donutSlices = tokens.slice(0, 5).map(t => ({
    pct: (t.qty * t.price / holdTotal) * 100,
    color: t.color,
    label: t.symbol,
  }))

  const green = '#22c55e'; const red = '#ef4444'

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3"
        style={{ background: 'rgba(4,4,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold tracking-widest uppercase opacity-40">Wallet</span>
          <Link href="/tokens"
            className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.25)' }}>
            + Buy Tokens
          </Link>
        </div>

        {/* Total value */}
        <div className="mt-1">
          <p className="text-3xl font-bold tracking-tight">${totalValue.toFixed(2)}</p>
          <p className="text-xs mt-0.5" style={{ color: holdPnl >= 0 ? green : red }}>
            {holdPnl >= 0 ? '▲' : '▼'} ${Math.abs(holdPnl).toFixed(2)} ({holdPct >= 0 ? '+' : ''}{holdPct.toFixed(1)}%) all time
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex gap-2 mt-3">
          {[
            { label: 'Holdings', val: `$${holdTotal.toFixed(0)}` },
            { label: 'Staked',   val: `$${stakedTotal.toFixed(0)}` },
            { label: 'Earned',   val: `$${earnedTotal.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-lg px-2 py-1.5 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs opacity-50 mb-0.5">{s.label}</p>
              <p className="text-sm font-semibold">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Allocation donut */}
        <div className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <DonutChart slices={donutSlices} />
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-bold tracking-wider uppercase opacity-40 mb-2">Allocation</p>
            {tokens.slice(0, 5).map(t => (
              <div key={t.symbol} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <span className="text-xs font-mono flex-1">{t.symbol}</span>
                <span className="text-xs opacity-60">{((t.qty * t.price / holdTotal) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg p-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['holdings', 'staked', 'activity'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
              style={tab === t
                ? { background: 'rgba(124,58,237,0.25)', color: '#a855f7' }
                : { color: 'rgba(255,255,255,0.45)' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Holdings tab */}
        {tab === 'holdings' && (
          <div className="space-y-2">
            {tokens.map(t => {
              const value   = t.qty * t.price
              const costBas = t.qty * t.avgCost
              const pnl     = value - costBas
              const pct     = costBas > 0 ? (pnl / costBas) * 100 : 0
              return (
                <Link key={t.symbol} href={`/profile/${t.handle}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Token badge */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                    style={{ background: `${t.color}20`, border: `1.5px solid ${t.color}40`, color: t.color }}>
                    {t.symbol.slice(0, 3)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold">{t.symbol}</span>
                      <span className="text-xs opacity-40">·</span>
                      <span className="text-xs opacity-40">{t.creator}</span>
                    </div>
                    <p className="text-xs opacity-50 mt-0.5">{t.qty} tokens · avg ${t.avgCost.toFixed(2)}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2 justify-end">
                      <Spark up={t.change >= 0} />
                      <div>
                        <p className="text-sm font-semibold">${value.toFixed(2)}</p>
                        <p className="text-xs" style={{ color: pnl >= 0 ? green : red }}>
                          {pnl >= 0 ? '+' : ''}{pct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Total row */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <span className="text-xs font-bold tracking-widest uppercase opacity-60">Total Holdings</span>
              <div className="text-right">
                <p className="text-sm font-bold">${holdTotal.toFixed(2)}</p>
                <p className="text-xs" style={{ color: holdPnl >= 0 ? green : red }}>
                  {holdPnl >= 0 ? '+' : ''}${holdPnl.toFixed(2)} ({holdPct >= 0 ? '+' : ''}{holdPct.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Staked tab */}
        {tab === 'staked' && (
          <div className="space-y-2">
            {STAKED.map(p => {
              const monthlyYield = ((p.staked * p.apy) / 100 / 12)
              const daysStaked = Math.floor((Date.now() - new Date(p.since).getTime()) / 86400000)
              return (
                <Link key={p.symbol} href={`/profile/${p.handle}`}
                  className="rounded-xl px-4 py-3 block"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${p.tierColor}20`, border: `1.5px solid ${p.tierColor}50`, color: p.tierColor }}>
                        {p.symbol.slice(0, 2)}
                      </div>
                      <span className="text-sm font-bold">{p.symbol}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: `${p.tierColor}15`, color: p.tierColor }}>
                        {p.tier}
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#22c55e' }}>{p.apy}% APY</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: 'Staked',   v: `$${p.staked.toLocaleString()}` },
                      { l: 'Earned',   v: `$${p.earned.toFixed(2)}`, color: '#22c55e' },
                      { l: 'Monthly',  v: `$${monthlyYield.toFixed(2)}` },
                    ].map(s => (
                      <div key={s.l} className="rounded-lg p-2 text-center"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-xs opacity-40 mb-0.5">{s.l}</p>
                        <p className="text-xs font-semibold" style={{ color: s.color }}>{s.v}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs opacity-30 mt-2">Staked {daysStaked} days · since {p.since}</p>
                </Link>
              )
            })}

            {/* Summary */}
            <div className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-50 mb-0.5">Total Staked</p>
                  <p className="text-lg font-bold">${stakedTotal.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-50 mb-0.5">Total Earned</p>
                  <p className="text-lg font-bold" style={{ color: '#22c55e' }}>${earnedTotal.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(34,197,94,0.15)' }}>
                <p className="text-xs opacity-40">Avg APY across all staked positions:
                  <span className="ml-1 font-bold" style={{ color: '#22c55e' }}>
                    {(STAKED.reduce((s, p) => s + p.apy * p.staked, 0) / stakedTotal).toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>

            <Link href="/tokens"
              className="block w-full py-3 rounded-xl text-center text-sm font-semibold transition-all"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.25)' }}>
              Stake More Tokens →
            </Link>
          </div>
        )}

        {/* Activity tab */}
        {tab === 'activity' && (
          <div className="space-y-2">
            {[
              { type: 'buy',    symbol: 'MAYA', qty: 50,   price: 2.60, date: '2025-05-28', total: 130.00 },
              { type: 'stake',  symbol: 'ALEX', qty: null, price: null,  date: '2025-05-15', total: 500.00, note: 'Silver tier' },
              { type: 'buy',    symbol: 'ZEN',  qty: 200,  price: 3.30, date: '2025-04-20', total: 660.00 },
              { type: 'sell',   symbol: 'JOE',  qty: 20,   price: 9.10, date: '2025-04-01', total: 182.00 },
              { type: 'yield',  symbol: 'MAYA', qty: null, price: null,  date: '2025-03-31', total: 36.67, note: 'Monthly yield' },
              { type: 'buy',    symbol: 'SAR',  qty: 500,  price: 0.92, date: '2025-03-10', total: 460.00 },
              { type: 'stake',  symbol: 'MAYA', qty: null, price: null,  date: '2024-11-15', total: 2000.00, note: 'Gold tier' },
              { type: 'buy',    symbol: 'MAYA', qty: 200,  price: 2.10, date: '2024-10-05', total: 420.00 },
            ].map((a, i) => {
              const icons: Record<string,string> = { buy:'↓', sell:'↑', stake:'⬡', yield:'◈' }
              const colors: Record<string,string> = { buy:'#22c55e', sell:'#ef4444', stake:'#a855f7', yield:'#f59e0b' }
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${colors[a.type]}15`, color: colors[a.type] }}>
                    {icons[a.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold capitalize">
                      {a.type} {a.symbol} {a.qty ? `× ${a.qty}` : ''} {a.note ? `· ${a.note}` : ''}
                    </p>
                    <p className="text-xs opacity-40">{a.date}</p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0"
                    style={{ color: a.type === 'sell' ? '#ef4444' : a.type === 'yield' ? '#f59e0b' : 'var(--paper)' }}>
                    {a.type === 'sell' ? '-' : a.type === 'yield' ? '+' : ''}${a.total.toFixed(2)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom CTAs */}
        <div className="grid grid-cols-2 gap-2 pb-4">
          <Link href="/tokens"
            className="py-3 rounded-xl text-center text-sm font-semibold"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.2)' }}>
            Token Market
          </Link>
          <Link href="/identity"
            className="py-3 rounded-xl text-center text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            ZK Identity
          </Link>
        </div>
      </div>
    </div>
  )
}
