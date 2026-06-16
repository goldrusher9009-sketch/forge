'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CREATOR_TOKENS: Record<string, {
  name: string; color: string; symbol: string; price: number; change24h: number;
  change7d: number; mcap: number; holders: number; totalSupply: number;
  myTokens: number; tier: string | null; apy: number;
  priceHistory: number[];
}> = {
  sovereign_v: {
    name: 'Sovereign V', color: '#a855f7', symbol: 'SVRN', price: 8.75, change24h: 4.2, change7d: 12.8,
    mcap: 875000, holders: 2840, totalSupply: 100000, myTokens: 50, tier: 'Gold', apy: 22,
    priceHistory: [7.20, 7.35, 7.10, 7.55, 7.80, 8.10, 7.90, 8.25, 8.40, 8.75],
  },
  mayafit: {
    name: 'Maya Chen', color: '#22c55e', symbol: 'MAYA', price: 5.20, change24h: -1.8, change7d: 6.4,
    mcap: 416000, holders: 1620, totalSupply: 80000, myTokens: 80, tier: 'Diamond', apy: 35,
    priceHistory: [4.80, 4.95, 5.10, 5.05, 4.90, 5.00, 5.15, 5.20, 5.18, 5.20],
  },
  jaxbeats: {
    name: 'Jax Beats', color: '#ec4899', symbol: 'JAX', price: 3.80, change24h: 7.1, change7d: 18.2,
    mcap: 228000, holders: 980, totalSupply: 60000, myTokens: 0, tier: null, apy: 0,
    priceHistory: [2.90, 3.00, 3.10, 2.95, 3.20, 3.35, 3.50, 3.60, 3.72, 3.80],
  },
}

const TIERS = [
  { name: 'Bronze',  min: 10,  apy: 8,  color: '#b45309', emoji: '🥉', perks: ['Early content access', 'Bronze badge'] },
  { name: 'Silver',  min: 25,  apy: 14, color: '#94a3b8', emoji: '🥈', perks: ['Private Discord channel', 'Monthly AMA', 'Silver badge'] },
  { name: 'Gold',    min: 50,  apy: 22, color: '#f59e0b', emoji: '🥇', perks: ['1-on-1 Q&A slot', 'All Silver perks', 'Gold badge', 'Merch discounts'] },
  { name: 'Diamond', min: 100, apy: 35, color: '#818cf8', emoji: '💎', perks: ['All Gold perks', 'Revenue share', 'Diamond badge', 'Priority support', 'Exclusive drops'] },
]

const BUY_PRESETS = [1, 5, 10, 25, 50]

export default function ProfileInvestPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const token = CREATOR_TOKENS[handle] ?? CREATOR_TOKENS.sovereign_v

  const [buyAmt, setBuyAmt] = useState('')
  const [buying, setBuying] = useState(false)
  const [bought, setBought] = useState(false)

  const numTokens = Number(buyAmt) || 0
  const cost = numTokens * token.price
  const previewHeld = token.myTokens + numTokens
  const previewTier = [...TIERS].reverse().find(t => previewHeld >= t.min) ?? null
  const currentTier = [...TIERS].reverse().find(t => token.myTokens >= t.min) ?? null
  const nextTier = TIERS.find(t => t.min > token.myTokens) ?? null

  async function buy() {
    if (numTokens <= 0) return
    setBuying(true)
    await new Promise(r => setTimeout(r, 1100))
    setBuying(false)
    setBought(true)
    setTimeout(() => { setBought(false); setBuyAmt('') }, 3000)
  }

  // Mini chart
  const ph = token.priceHistory
  const minP = Math.min(...ph); const maxP = Math.max(...ph); const rng = maxP - minP || 1
  const W = 300; const H = 60
  const pts = ph.map((v, i) => ({ x: (i / (ph.length - 1)) * W, y: H - ((v - minP) / rng) * H }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const positive = token.change7d >= 0
  const lineColor = positive ? '#22c55e' : '#f87171'

  const stakedPct = (token.totalSupply > 0 ? token.holders / token.totalSupply * 100 : 0).toFixed(1)

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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0"
            style={{ background: `${token.color}18`, color: token.color }}>
            {token.name[0]}
          </div>
          <div>
            <div className="font-black text-white">Invest in {token.name}</div>
            <div className="text-xs text-white/30">@{handle} · ${token.symbol}</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Price card */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-2xl font-black text-white">${token.price}</div>
              <div className="flex gap-3 mt-0.5">
                <span className="text-xs font-bold" style={{ color: token.change24h >= 0 ? '#22c55e' : '#f87171' }}>
                  {token.change24h >= 0 ? '+' : ''}{token.change24h}% 24h
                </span>
                <span className="text-xs font-bold" style={{ color: token.change7d >= 0 ? '#22c55e' : '#f87171' }}>
                  {token.change7d >= 0 ? '+' : ''}{token.change7d}% 7d
                </span>
              </div>
            </div>
            <button onClick={() => router.push(`/tokens/${token.symbol}/chart`)}
              className="text-xs px-3 py-1.5 rounded-full font-bold"
              style={{ background: `${token.color}15`, color: token.color }}>
              Full Chart →
            </button>
          </div>
          {/* Mini chart */}
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full mt-2">
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* My position */}
        {token.myTokens > 0 && (
          <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">My Position</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="font-black text-base" style={{ color: token.color }}>{token.myTokens}</div>
                <div className="text-xs text-white/25">Tokens</div>
              </div>
              <div className="text-center">
                <div className="font-black text-base text-white/70">${(token.myTokens * token.price).toFixed(0)}</div>
                <div className="text-xs text-white/25">Value</div>
              </div>
              <div className="text-center">
                {currentTier ? (
                  <div className="font-black text-base" style={{ color: currentTier.color }}>{currentTier.emoji}</div>
                ) : (
                  <div className="font-black text-base text-white/20">—</div>
                )}
                <div className="text-xs text-white/25">{currentTier?.name ?? 'No tier'}</div>
              </div>
            </div>
            {nextTier && (
              <div className="mt-2 text-xs text-center" style={{ color: nextTier.color }}>
                {nextTier.min - token.myTokens} more tokens to reach {nextTier.name} ({nextTier.apy}% APY)
              </div>
            )}
          </div>
        )}

        {/* Token stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Market Cap',  value: `$${(token.mcap / 1000).toFixed(0)}k` },
            { label: 'Holders',     value: token.holders.toLocaleString() },
            { label: 'Supply',      value: `${(token.totalSupply / 1000).toFixed(0)}k` },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm text-white/70">{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tier benefits */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Holder Benefits</div>
          <div className="space-y-3">
            {TIERS.map(tier => {
              const isActive = currentTier?.name === tier.name
              const isReachable = previewTier?.name === tier.name && tier.name !== currentTier?.name
              return (
                <div key={tier.name} className="p-3 rounded-xl border"
                  style={{ borderColor: isActive || isReachable ? `${tier.color}30` : 'rgba(255,255,255,0.05)', background: isActive ? `${tier.color}08` : 'transparent' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{tier.emoji}</span>
                      <span className="font-bold text-sm" style={{ color: tier.color }}>{tier.name}</span>
                      {isActive && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: tier.color, color: '#04040A' }}>You</span>}
                    </div>
                    <span className="text-xs font-black" style={{ color: '#22c55e' }}>{tier.apy}% APY</span>
                  </div>
                  <div className="text-xs text-white/25 mb-1">{tier.min}+ tokens required</div>
                  <div className="flex flex-wrap gap-1">
                    {tier.perks.map(p => (
                      <span key={p} className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>{p}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Buy form */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Buy ${token.symbol}</div>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {BUY_PRESETS.map(p => (
              <button key={p} onClick={() => setBuyAmt(String(p))}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={buyAmt === String(p) ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                {p} tokens
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/6 mb-3">
            <input value={buyAmt} onChange={e => setBuyAmt(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Quantity"
              className="flex-1 text-base font-black text-white bg-transparent outline-none" />
            <span className="text-xs text-white/25">${token.symbol}</span>
          </div>
          {numTokens > 0 && (
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Cost</span>
                <span className="text-white/60 font-bold">${cost.toFixed(2)} USDC</span>
              </div>
              {previewTier && previewTier.name !== currentTier?.name && (
                <div className="flex justify-between text-xs">
                  <span className="text-white/30">Unlocks</span>
                  <span className="font-bold" style={{ color: previewTier.color }}>{previewTier.emoji} {previewTier.name} tier</span>
                </div>
              )}
            </div>
          )}
          {bought ? (
            <div className="w-full py-3 rounded-xl font-black text-sm text-center" style={{ background: '#22c55e', color: '#04040A' }}>
              ✓ Bought {buyAmt} ${token.symbol}!
            </div>
          ) : (
            <button onClick={buy} disabled={numTokens <= 0 || buying}
              className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-30"
              style={{ background: token.color, color: '#04040A' }}>
              {buying ? 'Buying…' : `Buy ${buyAmt || '0'} $${token.symbol} · $${cost.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
