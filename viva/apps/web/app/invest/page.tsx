'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Mock portfolio positions ─────────────────────────────────────────────────
const POSITIONS = [
  { symbol: 'SOVV', name: 'Sovereign V',  handle: 'sovereign_v', color: '#a855f7', qty: 120, avgCost: 9.80,  currentPrice: 12.40, change24h: +8.2,  allocation: 31 },
  { symbol: 'MAYA', name: 'Maya Chen',    handle: 'mayafit',    color: '#a855f7', qty: 250, avgCost: 5.20,  currentPrice: 6.60,  change24h: +12.3, allocation: 34 },
  { symbol: 'ALEX', name: 'Alex Wave',    handle: 'alexwave',   color: '#22c55e', qty: 100, avgCost: 4.90,  currentPrice: 5.10,  change24h: +4.7,  allocation: 11 },
  { symbol: 'LUNA', name: 'Luna Apex',    handle: 'luna_apex',  color: '#f59e0b', qty: 80,  avgCost: 3.40,  currentPrice: 4.20,  change24h: +2.1,  allocation: 7  },
  { symbol: 'ZERO', name: 'ZeroNode',     handle: 'zeronode',   color: '#818cf8', qty: 200, avgCost: 2.80,  currentPrice: 2.30,  change24h: -3.8,  allocation: 10 },
  { symbol: 'NATE', name: 'Nate Rivers',  handle: 'nate_r',     color: '#22c55e', qty: 60,  avgCost: 7.10,  currentPrice: 8.50,  change24h: +6.0,  allocation: 11 },
]

const HISTORY = [
  { id: 'h1', type: 'buy',  symbol: 'SOVV', qty: 50,  price: 9.40,  total: 470,  ts: '2026-06-14 14:32' },
  { id: 'h2', type: 'buy',  symbol: 'MAYA', qty: 100, price: 5.10,  total: 510,  ts: '2026-06-13 09:11' },
  { id: 'h3', type: 'sell', symbol: 'ZERO', qty: 50,  price: 2.90,  total: 145,  ts: '2026-06-12 16:44' },
  { id: 'h4', type: 'buy',  symbol: 'ALEX', qty: 100, price: 4.90,  total: 490,  ts: '2026-06-11 11:05' },
  { id: 'h5', type: 'buy',  symbol: 'LUNA', qty: 80,  price: 3.40,  total: 272,  ts: '2026-06-09 08:22' },
  { id: 'h6', type: 'sell', symbol: 'MAYA', qty: 50,  price: 6.20,  total: 310,  ts: '2026-06-07 15:55' },
  { id: 'h7', type: 'buy',  symbol: 'NATE', qty: 60,  price: 7.10,  total: 426,  ts: '2026-06-05 10:18' },
  { id: 'h8', type: 'buy',  symbol: 'SOVV', qty: 70,  price: 10.20, total: 714,  ts: '2026-06-03 12:00' },
]

// Mini portfolio value history (7 days)
const VALUE_HISTORY = [4820, 5110, 4990, 5340, 5580, 5720, 6012]
const CHART_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']

function fmt(n: number, dec = 2) { return `$${n.toFixed(dec)}` }
function fmtK(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}k`
  return fmt(n)
}

function MiniChart({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 200, h = 40
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  const area = `0,${h} ${pts} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#cg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function AllocationRing({ positions }: { positions: typeof POSITIONS }) {
  const total = positions.reduce((s, p) => s + p.allocation, 0)
  let offset = 0
  const r = 36, c = 2 * Math.PI * r
  const segments = positions.map(p => {
    const dash = (p.allocation / total) * c
    const gap = c - dash
    const seg = { dash, gap, offset, color: p.color, symbol: p.symbol }
    offset += dash + 1.5
    return seg
  })
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      {segments.map((s, i) => (
        <circle key={i} cx="48" cy="48" r={r}
          fill="none" stroke={s.color} strokeWidth="8"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '48px 48px' }}
        />
      ))}
      <text x="48" y="52" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">
        Alloc
      </text>
    </svg>
  )
}

export default function InvestPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'positions' | 'history'>('positions')
  const [buySymbol, setBuySymbol] = useState<string | null>(null)
  const [buyAmt, setBuyAmt] = useState('')
  const [txMsg, setTxMsg] = useState<string | null>(null)

  const totalValue = POSITIONS.reduce((s, p) => s + p.qty * p.currentPrice, 0)
  const totalCost  = POSITIONS.reduce((s, p) => s + p.qty * p.avgCost, 0)
  const totalPnL   = totalValue - totalCost
  const pnlPct     = (totalPnL / totalCost) * 100
  const dayChange  = VALUE_HISTORY[VALUE_HISTORY.length - 1] - VALUE_HISTORY[VALUE_HISTORY.length - 2]
  const dayChangePct = (dayChange / VALUE_HISTORY[VALUE_HISTORY.length - 2]) * 100

  async function handleBuy() {
    if (!buySymbol || !buyAmt) return
    await new Promise(r => setTimeout(r, 700))
    setTxMsg(`Bought ${buyAmt} ${buySymbol} tokens`)
    setBuySymbol(null)
    setBuyAmt('')
    setTimeout(() => setTxMsg(null), 3000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">YOUTOKEN</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>My Portfolio</h1>
          </div>
          <button onClick={() => router.push('/tokens')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{ background: '#a855f718', color: '#a855f7', border: '1px solid #a855f725' }}>
            + Invest
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Portfolio value hero */}
        <div className="p-4 rounded-2xl border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(34,197,94,0.05))' }}>
          <div className="text-xs text-white/35 mb-1">Total Portfolio Value</div>
          <div className="text-4xl font-black text-white mb-1">{fmtK(totalValue)}</div>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}{fmt(totalPnL)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
            </span>
            <span className="text-xs text-white/30">all time</span>
            <span className="text-xs text-white/20">·</span>
            <span className={`text-xs font-semibold ${dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {dayChange >= 0 ? '+' : ''}{fmt(dayChange)} today
            </span>
          </div>
          <MiniChart values={VALUE_HISTORY} color="#a855f7" />
          <div className="flex justify-between mt-1">
            {CHART_DAYS.map((d, i) => (
              <span key={i} className="text-xs text-white/20">{d}</span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/6"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <AllocationRing positions={POSITIONS} />
            <div className="space-y-1">
              {POSITIONS.slice(0, 3).map(p => (
                <div key={p.symbol} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-xs text-white/50">${p.symbol}</span>
                  <span className="text-xs text-white/25">{p.allocation}%</span>
                </div>
              ))}
              <div className="text-xs text-white/20">+{POSITIONS.length - 3} more</div>
            </div>
          </div>
          <div className="grid grid-rows-2 gap-2">
            {[
              { label: 'Positions',  val: POSITIONS.length,      color: '#a855f7' },
              { label: 'Total Cost', val: fmtK(totalCost),       color: '#818cf8' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl border border-white/6 text-center"
                style={{ background: `${s.color}06` }}>
                <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-white/30">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tx msg */}
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['positions', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={tab === t
                ? { background: 'rgba(255,255,255,0.1)', color: 'white' }
                : { color: 'rgba(255,255,255,0.35)' }}>
              {t === 'positions' ? `◈ Positions (${POSITIONS.length})` : `⟳ History (${HISTORY.length})`}
            </button>
          ))}
        </div>

        {/* Positions tab */}
        {tab === 'positions' && (
          <div className="space-y-2">
            {POSITIONS.map(pos => {
              const value = pos.qty * pos.currentPrice
              const cost  = pos.qty * pos.avgCost
              const pnl   = value - cost
              const pnlP  = (pnl / cost) * 100
              return (
                <div key={pos.symbol} className="p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs"
                        style={{ background: `${pos.color}18`, color: pos.color, border: `1.5px solid ${pos.color}30` }}>
                        {pos.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">${pos.symbol}</div>
                        <button onClick={() => router.push(`/profile/${pos.handle}`)}
                          className="text-xs transition-colors" style={{ color: pos.color }}>
                          {pos.name}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">{fmt(value)}</div>
                      <div className={`text-xs font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{fmt(pnl)} ({pnlP >= 0 ? '+' : ''}{pnlP.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: 'Qty',     val: pos.qty },
                      { label: 'Avg Cost',val: fmt(pos.avgCost) },
                      { label: 'Price',   val: fmt(pos.currentPrice) },
                      { label: '24h',     val: `${pos.change24h >= 0 ? '+' : ''}${pos.change24h}%`, color: pos.change24h >= 0 ? '#22c55e' : '#f87171' },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-lg border border-white/5"
                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="text-xs font-bold" style={{ color: (s as any).color ?? 'white' }}>{s.val}</div>
                        <div className="text-xs text-white/25">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setBuySymbol(pos.symbol); setBuyAmt('') }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: `${pos.color}18`, color: pos.color, border: `1px solid ${pos.color}25` }}>
                      Buy More
                    </button>
                    <button onClick={() => router.push(`/tokens/${pos.symbol}`)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      Details ↗
                    </button>
                  </div>

                  {/* Inline buy panel */}
                  {buySymbol === pos.symbol && (
                    <div className="mt-3 pt-3 border-t border-white/6 space-y-2">
                      <div className="flex gap-2">
                        {[10, 25, 50, 100].map(n => (
                          <button key={n} onClick={() => setBuyAmt(String(n))}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={buyAmt === String(n)
                              ? { background: pos.color, color: '#04040A' }
                              : { background: `${pos.color}12`, color: pos.color }}>
                            {n}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        placeholder="Custom amount"
                        value={buyAmt}
                        onChange={e => setBuyAmt(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/25 outline-none focus:border-white/20"
                      />
                      {buyAmt && (
                        <div className="text-xs text-white/40 text-center">
                          Total: {fmt(Number(buyAmt) * pos.currentPrice)} at {fmt(pos.currentPrice)}/token
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={handleBuy}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: pos.color, color: '#04040A' }}>
                          Confirm Buy
                        </button>
                        <button onClick={() => setBuySymbol(null)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white/30 transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div className="space-y-2">
            {HISTORY.map(tx => {
              const isBuy = tx.type === 'buy'
              const color = isBuy ? '#22c55e' : '#f87171'
              const pos = POSITIONS.find(p => p.symbol === tx.symbol)
              return (
                <div key={tx.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${color}18`, color }}>
                    {isBuy ? '↓' : '↑'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/80"
                        style={{ color: pos?.color ?? '#a855f7' }}>${tx.symbol}</span>
                      <span className="text-xs font-semibold capitalize" style={{ color }}>{tx.type}</span>
                    </div>
                    <div className="text-xs text-white/30">{tx.ts}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-white">{tx.qty} tokens</div>
                    <div className="text-xs text-white/40">{fmt(tx.total)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3">
          <button onClick={() => router.push('/tokens')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: '#a855f7', color: '#04040A' }}>
            Token Market ↗
          </button>
          <button onClick={() => router.push('/staking')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
            Staking ⬡
          </button>
        </div>
      </div>
    </div>
  )
}
