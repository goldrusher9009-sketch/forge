'use client'
import { useState, useEffect } from 'react'
import { useAppStore, mockUser, TIER_META } from '@/lib/store'
import { tokens as tokensApi } from '@/lib/api'
import clsx from 'clsx'

const MARKETPLACE_LISTINGS = [
  { id: 'l1', creator: 'luna_v', symbol: 'LUNA', price: 0.89, supply: 8000, holders: 142, change: +12.4, desc: '1hr strategy call + access to research vault' },
  { id: 'l2', creator: 'mateuso', symbol: 'MATO', price: 0.34, supply: 15000, holders: 89, change: +5.1, desc: 'Quarterly deep dive: DeFi protocol analysis' },
  { id: 'l3', creator: 'aisham', symbol: 'AISHA', price: 1.24, supply: 5000, holders: 203, change: -3.2, desc: 'Prediction market alpha + weekly signals' },
  { id: 'l4', creator: 'danr', symbol: 'DAN', price: 0.21, supply: 20000, holders: 34, change: +18.9, desc: 'AI systems consulting — 2hrs/month' },
]

const BONDING_POINTS = [0, 0.02, 0.05, 0.08, 0.14, 0.21, 0.31, 0.43, 0.59, 0.79, 1.02, 1.32, 1.68]

export default function TokenPage() {
  const { user, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<'my-token' | 'marketplace'>('my-token')
  const [buying, setBuying] = useState(false)
  const [mintAmt, setMintAmt] = useState('100')
  const [minting, setMinting] = useState(false)
  const [buyTarget, setBuyTarget] = useState<string | null>(null)
  const [txAmt, setTxAmt] = useState('10')
  const [marketListings, setMarketListings] = useState(MARKETPLACE_LISTINGS)

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadTokens()
  }, [])

  async function loadTokens() {
    try {
      const list = await tokensApi.list()
      if (Array.isArray(list) && list.length) {
        setMarketListings(list.map((t: any) => ({
          id: t.id,
          creator: t.owner?.handle ?? t.creator?.handle ?? t.ownerId ?? 'unknown',
          symbol: t.symbol,
          price: t.price ?? 0.1,
          supply: t.supply ?? t.totalSupply ?? 0,
          holders: t._count?.holdings ?? t.holders ?? 0,
          change: t.priceChange24h ?? 0,
          desc: t.name ?? t.description ?? '',
        })))
      }
    } catch { /* keep mock */ }
  }

  if (!mounted) return null
  const u = user || mockUser()
  const tier = TIER_META[u.tier]

  const curve = BONDING_POINTS.map((y, i) => ({
    supply: i * (u.youtoken.supply / 12),
    price: y * (u.youtoken.price / BONDING_POINTS[Math.round(u.youtoken.supply / (u.youtoken.supply / 12))] || 0.148),
  }))

  async function mint() {
    setMinting(true)
    try {
      const myToken = await tokensApi.mine()
      if (myToken?.id) {
        await tokensApi.mint(myToken.id, +mintAmt)
      }
    } catch {
      await new Promise(r => setTimeout(r, 1800))
    }
    setMinting(false)
  }

  async function buyToken() {
    if (!buyTarget) return
    setBuying(true)
    try {
      await tokensApi.buy(buyTarget, +txAmt)
    } catch {
      await new Promise(r => setTimeout(r, 1400))
    }
    setBuying(false)
    setBuyTarget(null)
  }

  const marketCap = u.youtoken.price * u.youtoken.supply

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>TOKENIZED IDENTITY · BASE L2</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>
              YouToken
            </h1>
          </div>
          <div
            className="px-3 py-1.5 text-xs font-semibold"
            style={{ background: 'rgba(225,29,72,0.12)', color: 'var(--ring-wealth)', borderRadius: '99px', border: '1px solid rgba(225,29,72,0.2)' }}
          >
            ${(u.youtoken.price * 1000).toFixed(0)} mcap
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['my-token', 'marketplace'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 text-sm font-medium capitalize transition-all"
              style={{
                borderRadius: '99px',
                background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t ? 'white' : 'rgba(245,244,240,0.4)',
              }}
            >
              {t === 'my-token' ? 'My Token' : 'Marketplace'}
            </button>
          ))}
        </div>
      </header>

      {tab === 'my-token' && (
        <div className="container-editorial py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Token card */}
            <div className="lg:col-span-5">
              <div
                className="relative overflow-hidden border border-white/8 p-8"
                style={{ borderRadius: '4px' }}
              >
                {/* BG pattern */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    background: `radial-gradient(circle at 30% 50%, var(--ring-wealth), transparent 60%), radial-gradient(circle at 70% 50%, var(--v), transparent 60%)`,
                  }}
                />
                <div className="relative z-10">
                  {/* Token symbol */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="t-caption mb-1" style={{ fontSize: '0.625rem' }}>YOUR TOKEN</p>
                      <h2 className="text-5xl font-bold" style={{ letterSpacing: '-0.04em', color: 'var(--ring-wealth)' }}>
                        ${u.youtoken.symbol}
                      </h2>
                    </div>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center border"
                      style={{ borderColor: 'var(--ring-wealth)30', background: 'rgba(225,29,72,0.1)' }}
                    >
                      <span className="font-bold text-sm" style={{ color: 'var(--ring-wealth)' }}>
                        {u.youtoken.symbol[0]}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                      { label: 'Price', value: `$${u.youtoken.price}`, color: 'var(--ring-wealth)' },
                      { label: 'Holders', value: String(u.youtoken.holders), color: 'var(--ring-social)' },
                      { label: 'Supply', value: u.youtoken.supply.toLocaleString(), color: 'var(--ring-nutrition)' },
                      { label: 'V-Score', value: String(u.vscore), color: tier.color },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p style={{ fontSize: '0.6rem', opacity: 0.35, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
                        <p className="text-xl font-bold mt-0.5" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tier */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 border mb-6"
                    style={{ borderColor: `${tier.color}30`, borderRadius: '99px', background: `${tier.color}08`, display: 'inline-flex' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: tier.color }} />
                    <span className="text-xs font-semibold" style={{ color: tier.color }}>{tier.label} tier · On-chain V-Score</span>
                  </div>
                </div>
              </div>

              {/* Mint more */}
              <div className="mt-4 p-5 border border-white/6" style={{ borderRadius: 'var(--radius)' }}>
                <p className="t-caption mb-3" style={{ fontSize: '0.625rem' }}>MINT MORE SUPPLY</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={mintAmt}
                    onChange={e => setMintAmt(e.target.value)}
                    className="flex-1 bg-white/4 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                  />
                  <button
                    onClick={mint}
                    disabled={minting}
                    className="px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--ring-wealth)', borderRadius: 'var(--radius)' }}
                  >
                    {minting ? 'Minting…' : 'Mint'}
                  </button>
                </div>
                <p className="text-xs text-white/25 mt-2">
                  New supply moves price along bonding curve. Gas: ~$0.02 on Base L2.
                </p>
              </div>
            </div>

            {/* Bonding curve */}
            <div className="lg:col-span-7 space-y-5">
              <section>
                <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>BONDING CURVE</p>
                <div
                  className="p-5 border border-white/6"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <BondingCurve price={u.youtoken.price} supply={u.youtoken.supply} />
                  <p className="text-xs text-white/25 mt-3">
                    Price increases with supply. Holders earn when price rises.
                  </p>
                </div>
              </section>

              {/* Holders table */}
              <section>
                <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>TOP HOLDERS</p>
                <div className="space-y-2">
                  {[
                    { handle: 'luna_v', amount: 320, pct: 3.2, since: '14d' },
                    { handle: 'aisham', amount: 210, pct: 2.1, since: '7d' },
                    { handle: 'noa_d', amount: 180, pct: 1.8, since: '30d' },
                    { handle: 'danr', amount: 95, pct: 0.95, since: '3d' },
                  ].map(({ handle, amount, pct, since }) => (
                    <div key={handle} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--v)' }}>
                        {handle[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-white/70 flex-1">@{handle}</span>
                      <span className="t-mono text-xs" style={{ color: 'var(--ring-wealth)' }}>{amount} tokens</span>
                      <span className="t-mono text-xs text-white/25">{pct}%</span>
                      <span className="text-xs text-white/20">{since}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {tab === 'marketplace' && (
        <div className="container-editorial py-8">
          <p className="t-caption mb-6" style={{ fontSize: '0.625rem' }}>PERSONAL TOKEN MARKETPLACE · {marketListings.length} TOKENS</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketListings.map(l => {
              const isPositive = l.change >= 0
              return (
                <div
                  key={l.id}
                  className="p-5 border border-white/6 hover:border-white/15 transition-all"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(225,29,72,0.15)', color: 'var(--ring-wealth)' }}>
                        {l.symbol[0]}
                      </div>
                      <div>
                        <p className="font-bold text-base" style={{ color: 'var(--ring-wealth)', letterSpacing: '-0.02em' }}>
                          ${l.symbol}
                        </p>
                        <p className="text-xs text-white/35">@{l.creator}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-white/80">${l.price}</p>
                      <p className="text-xs font-semibold" style={{ color: isPositive ? 'var(--ring-activity)' : 'var(--ring-wealth)' }}>
                        {isPositive ? '+' : ''}{l.change}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mb-4 leading-relaxed">{l.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/25">{l.holders} holders · {(l.supply / 1000).toFixed(0)}K supply</span>
                    <button
                      onClick={() => setBuyTarget(l.id)}
                      className="px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                      style={{ background: 'var(--ring-wealth)', borderRadius: 'var(--radius)' }}
                    >
                      Buy →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Buy modal */}
      {buyTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(4,4,10,0.94)' }}
          onClick={e => e.target === e.currentTarget && setBuyTarget(null)}
        >
          <div className="w-full max-w-sm p-6 border border-white/10" style={{ background: 'var(--ink-dim)', borderRadius: '4px' }}>
            {(() => {
              const l = marketListings.find(x => x.id === buyTarget)!
              return (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <p className="t-caption" style={{ fontSize: '0.625rem' }}>BUY ${l.symbol}</p>
                    <button onClick={() => setBuyTarget(null)} className="text-white/30 hover:text-white text-xl">×</button>
                  </div>
                  <p className="text-sm text-white/60 mb-5">{l.desc}</p>
                  <div className="mb-5">
                    <label className="t-caption block mb-2" style={{ fontSize: '0.625rem' }}>AMOUNT (TOKENS)</label>
                    <input
                      type="number"
                      value={txAmt}
                      onChange={e => setTxAmt(e.target.value)}
                      className="w-full bg-white/4 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-500/30 transition-colors text-sm"
                      style={{ borderRadius: 'var(--radius)' }}
                    />
                    <p className="text-xs text-white/30 mt-2">
                      Cost: {(+txAmt * l.price).toFixed(3)} $VIVA
                    </p>
                  </div>
                  <button
                    onClick={buyToken}
                    disabled={buying}
                    className="w-full py-3.5 font-semibold text-sm text-white transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--ring-wealth)', borderRadius: 'var(--radius)' }}
                  >
                    {buying ? 'Processing…' : `Buy ${txAmt} $${l.symbol}`}
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Bonding Curve SVG ──────────────────────────────────
function BondingCurve({ price, supply }: { price: number; supply: number }) {
  const W = 400
  const H = 140
  const pts = Array.from({ length: 40 }, (_, i) => {
    const s = (i / 39) * supply * 1.5
    const p = 0.01 * Math.pow(s / 1000, 1.4)
    return { x: (i / 39) * W, y: H - Math.min(p * 100, H - 10) }
  })
  const currentX = (supply / (supply * 1.5)) * W
  const currentY = H - Math.min(price * 100, H - 10)

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${W},${H} L 0,${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ring-wealth)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--ring-wealth)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#curveGrad)" />
      <path d={pathD} fill="none" stroke="var(--ring-wealth)" strokeWidth="1.5" />
      {/* Current position */}
      <line x1={currentX} y1={0} x2={currentX} y2={H} stroke="rgba(225,29,72,0.3)" strokeWidth="1" strokeDasharray="3,3" />
      <circle cx={currentX} cy={currentY} r={4} fill="var(--ring-wealth)" style={{ filter: 'drop-shadow(0 0 4px var(--ring-wealth))' }} />
      {/* Axis labels */}
      <text x="0" y={H + 14} fontSize={9} fill="rgba(245,244,240,0.25)" fontFamily="monospace">0</text>
      <text x={W - 12} y={H + 14} fontSize={9} fill="rgba(245,244,240,0.25)" fontFamily="monospace">supply</text>
      <text x={currentX + 6} y={currentY - 6} fontSize={9} fill="var(--ring-wealth)" fontFamily="monospace">${price}</text>
    </svg>
  )
}
