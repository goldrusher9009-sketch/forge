'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { tokens as tokensApi } from '@/lib/api'
import { TIER_META } from '@/lib/store'

// ─── Mock data keyed by symbol ───────────────────────────────────────────────
const TOKEN_DB: Record<string, any> = {
  SOVV: { symbol: 'SOVV', name: 'Sovereign V Token', creator: 'Sovereign V', handle: 'sovereign_v', tier: 'guardian', vScore: 980, price: 12.40, supply: 100000, holders: 420, mcap: 124000, change24h: +8.2, change7d: +24.1, desc: 'ZK identity pioneer. Access to alpha signals, private research vault, and governance rights over sovereign_v content drops.', staking: [ { tier: 'Bronze', min: 10,  apy: 8,  color: '#cd7f32', label: 'Basic holder' }, { tier: 'Silver', min: 50,  apy: 14, color: '#94a3b8', label: 'Signal access' }, { tier: 'Gold',   min: 100, apy: 22, color: '#f59e0b', label: 'VIP + rooms' }, { tier: 'Diamond',min: 500, apy: 35, color: '#818cf8', label: 'Direct DMs + alpha' } ], topHolders: [ { handle: 'luna_apex',  name: 'Luna Apex',   qty: 2400, tier: 'guardian', color: '#a855f7' }, { handle: 'mayafit',   name: 'Maya Chen',   qty: 1800, tier: 'guardian', color: '#a855f7' }, { handle: 'zeronode',  name: 'ZeroNode',    qty: 1200, tier: 'guardian', color: '#a855f7' }, { handle: 'aisham_x', name: 'Aisham X',    qty:  800, tier: 'proven',   color: '#7c3aed' }, { handle: 'noa_delta', name: 'Noa Delta',   qty:  500, tier: 'proven',   color: '#7c3aed' } ], priceHistory: [8.1,8.4,8.0,8.9,9.2,9.0,9.8,10.1,9.7,10.5,11.2,10.8,11.6,12.0,12.4] },
  MAYA: { symbol: 'MAYA', name: 'Maya Chen Token',  creator: 'Maya Chen',   handle: 'mayafit',    tier: 'guardian', vScore: 935, price:  6.60, supply: 100000, holders: 890, mcap:  66000, change24h: +12.3, change7d: +31.2, desc: 'Fitness creator with 2M followers. Token grants access to premium workout plans, nutrition coaching sessions, and token-gated live streams.', staking: [ { tier: 'Bronze', min: 10,  apy: 10, color: '#cd7f32', label: 'Workout library' }, { tier: 'Silver', min: 50,  apy: 18, color: '#94a3b8', label: 'Live coaching' }, { tier: 'Gold',   min: 100, apy: 26, color: '#f59e0b', label: 'Personal plans' }, { tier: 'Diamond',min: 500, apy: 40, color: '#818cf8', label: 'Weekly 1:1 calls' } ], topHolders: [ { handle: 'sovereign_v', name: 'Sovereign V', qty: 8200, tier: 'guardian', color: '#a855f7' }, { handle: 'luna_apex',   name: 'Luna Apex',   qty: 6100, tier: 'guardian', color: '#a855f7' }, { handle: 'noa_delta',  name: 'Noa Delta',   qty: 3400, tier: 'proven',   color: '#7c3aed' }, { handle: 'aisham_x',  name: 'Aisham X',    qty: 2200, tier: 'proven',   color: '#7c3aed' }, { handle: 'biophile',  name: 'BioPhile',    qty: 1500, tier: 'proven',   color: '#7c3aed' } ], priceHistory: [3.2,3.5,3.9,4.1,4.0,4.4,4.7,4.9,5.2,5.6,5.9,6.0,6.3,6.5,6.6] },
  ALEX: { symbol: 'ALEX', name: 'Alex Wave Token',  creator: 'Alex Wave',   handle: 'alexwave',   tier: 'seeker',   vScore: 832, price:  5.10, supply:  80000, holders: 320, mcap:  40800, change24h: +4.7,  change7d: +15.0, desc: 'Crypto native and DeFi yield farmer building in public. Token grants access to weekly DeFi alpha, yield strategies, and governance.', staking: [ { tier: 'Bronze', min: 10,  apy: 7,  color: '#cd7f32', label: 'DeFi digest' }, { tier: 'Silver', min: 50,  apy: 12, color: '#94a3b8', label: 'Alpha drops' }, { tier: 'Gold',   min: 100, apy: 20, color: '#f59e0b', label: 'Yield strategies' }, { tier: 'Diamond',min: 500, apy: 30, color: '#818cf8', label: 'Private deals' } ], topHolders: [ { handle: 'sovereign_v', name: 'Sovereign V', qty: 1200, tier: 'guardian', color: '#a855f7' }, { handle: 'zeronode',   name: 'ZeroNode',   qty:  900, tier: 'guardian', color: '#a855f7' }, { handle: 'zkproof',   name: 'ZK Proof',   qty:  700, tier: 'seeker',   color: '#22c55e' }, { handle: 'mintseeker', name: 'MintSeeker', qty:  500, tier: 'seeker',   color: '#22c55e' }, { handle: 'biophile',  name: 'BioPhile',   qty:  300, tier: 'proven',   color: '#7c3aed' } ], priceHistory: [2.8,3.0,2.9,3.2,3.5,3.4,3.7,3.9,4.1,4.3,4.5,4.7,4.9,5.0,5.1] },
}

// Fallback for unknown symbols
function makeFallback(sym: string) {
  return {
    symbol: sym, name: `${sym} Token`, creator: sym, handle: sym.toLowerCase(),
    tier: 'seeker', vScore: 800, price: 1.00, supply: 50000, holders: 50, mcap: 50000,
    change24h: 0, change7d: 0, desc: 'YouToken on the VIVA platform.',
    staking: [ { tier: 'Bronze', min: 10, apy: 8, color: '#cd7f32', label: 'Holder' } ],
    topHolders: [],
    priceHistory: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  }
}

function PriceChart({ prices, color }: { prices: number[]; color: string }) {
  const max = Math.max(...prices), min = Math.min(...prices)
  const W = 320, H = 80, pad = 4
  const x = (i: number) => pad + (i / (prices.length - 1)) * (W - pad * 2)
  const y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2)
  const pts = prices.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const area = `M ${x(0)},${H} L ${pts.split(' ').map(p => `L ${p}`).join(' ')} L ${x(prices.length - 1)},${H} Z`
    .replace('L L', 'L')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last price dot */}
      <circle cx={x(prices.length - 1)} cy={y(prices[prices.length - 1])} r="3" fill={color} />
    </svg>
  )
}

function StakingTier({ tier, mine }: { tier: any; mine: number }) {
  const has = mine >= tier.min
  return (
    <div className="p-3 rounded-xl border transition-all"
      style={{
        background: has ? `${tier.color}10` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${has ? `${tier.color}30` : 'rgba(255,255,255,0.06)'}`,
      }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold" style={{ color: tier.color }}>{tier.tier}</span>
        <span className="text-xs font-mono" style={{ color: '#22c55e' }}>{tier.apy}% APY</span>
      </div>
      <div className="text-xs text-white/40">{tier.min}+ tokens · {tier.label}</div>
      {has && <div className="text-xs mt-1" style={{ color: tier.color }}>✓ You qualify</div>}
    </div>
  )
}

export default function TokenDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sym = (params?.symbol as string ?? '').toUpperCase()

  const [token, setToken] = useState<any>(TOKEN_DB[sym] ?? makeFallback(sym))
  const [buyAmt, setBuyAmt] = useState('10')
  const [selling, setSelling] = useState(false)
  const [staking, setStaking] = useState(false)
  const [stakeAmt, setStakeAmt] = useState('50')
  const [txDone, setTxDone] = useState<string | null>(null)
  const [myTokens] = useState(() => ({ MAYA: 250, ALEX: 100, SAR: 500, JOE: 80, ZEN: 200, SOVV: 0, LUNA: 0, ZERO: 0, AISH: 0 } as Record<string, number>))
  const mine = myTokens[sym] ?? 0

  // Try real API
  useEffect(() => {
    tokensApi.list().then((list: any[]) => {
      const found = list.find((t: any) => t.symbol === sym)
      if (found) setToken((prev: any) => ({ ...prev, ...found, price: found.price ?? prev.price }))
    }).catch(() => {})
  }, [sym])

  const tier = TIER_META[token.tier as keyof typeof TIER_META] ?? TIER_META.seed
  const up24 = token.change24h >= 0
  const cost = parseFloat(buyAmt || '0') * token.price

  async function doBuy() {
    try { await (tokensApi as any).buy?.(token.id ?? sym, parseFloat(buyAmt)) } catch {}
    setTxDone(`Bought ${buyAmt} ${sym}`)
    setTimeout(() => setTxDone(null), 3000)
  }

  async function doSell() {
    try { await (tokensApi as any).sell?.(token.id ?? sym, parseFloat(buyAmt)) } catch {}
    setTxDone(`Sold ${buyAmt} ${sym}`)
    setTimeout(() => setTxDone(null), 3000)
  }

  async function doStake() {
    try { await (tokensApi as any).stake?.(token.id ?? sym, parseFloat(stakeAmt)) } catch {}
    setTxDone(`Staked ${stakeAmt} ${sym}`)
    setStaking(false)
    setTimeout(() => setTxDone(null), 3000)
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
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
              style={{ background: `${tier.color}18`, color: tier.color, border: `1.5px solid ${tier.color}30` }}>
              {sym.slice(0, 2)}
            </div>
            <div>
              <div className="font-bold text-white text-sm">${sym}</div>
              <div className="text-xs text-white/35">{token.name}</div>
            </div>
          </div>
          <button onClick={() => router.push(`/profile/${token.handle}`)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{ background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}25` }}>
            ◈ Profile
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Price hero */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-3xl font-black text-white">${token.price.toFixed(2)}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-sm font-bold ${up24 ? 'text-green-400' : 'text-red-400'}`}>
                  {up24 ? '+' : ''}{token.change24h.toFixed(1)}% 24h
                </span>
                <span className="text-xs text-white/30">MCap ${(token.mcap / 1000).toFixed(0)}K</span>
                <span className="text-xs text-white/30">{token.holders} holders</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/30">You hold</div>
              <div className="text-lg font-bold" style={{ color: tier.color }}>{mine} {sym}</div>
            </div>
          </div>

          {/* Price chart */}
          <PriceChart prices={token.priceHistory} color={up24 ? '#22c55e' : '#ef4444'} />

          {/* Time labels */}
          <div className="flex justify-between text-xs text-white/20 mt-1 px-1">
            <span>14d ago</span><span>7d ago</span><span>Now</span>
          </div>
        </div>

        {/* About */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/40 uppercase tracking-widest mb-2">About</div>
          <p className="text-sm text-white/70 leading-relaxed">{token.desc}</p>
          <button onClick={() => router.push(`/profile/${token.handle}`)}
            className="mt-3 flex items-center gap-2 text-sm font-semibold transition-colors hover:text-white/80"
            style={{ color: tier.color }}>
            <span>View {token.creator}'s profile</span>
            <span>→</span>
          </button>
        </div>

        {/* Buy / Sell panel */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex gap-2 mb-4">
            {[false, true].map(isSell => (
              <button key={String(isSell)} onClick={() => setSelling(isSell)}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: selling === isSell
                    ? (isSell ? '#ef444418' : '#22c55e18')
                    : 'rgba(255,255,255,0.04)',
                  color: selling === isSell ? (isSell ? '#ef4444' : '#22c55e') : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${selling === isSell ? (isSell ? '#ef444430' : '#22c55e30') : 'rgba(255,255,255,0.06)'}`,
                }}>
                {isSell ? 'Sell' : 'Buy'}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Amount ({sym})</label>
            <input type="number" value={buyAmt} onChange={e => setBuyAmt(e.target.value)} min="1"
              className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-white/25"
            />
          </div>

          <div className="flex justify-between text-xs text-white/40 mb-4">
            <span>Total cost</span>
            <span className="text-white font-semibold">${cost.toFixed(2)}</span>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-4">
            {['10', '50', '100', '500'].map(a => (
              <button key={a} onClick={() => setBuyAmt(a)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: buyAmt === a ? `${tier.color}18` : 'rgba(255,255,255,0.04)',
                  color: buyAmt === a ? tier.color : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${buyAmt === a ? `${tier.color}30` : 'rgba(255,255,255,0.06)'}`,
                }}>
                {a}
              </button>
            ))}
          </div>

          <button onClick={selling ? doSell : doBuy}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: selling ? '#ef444420' : `${tier.color}`,
              color: selling ? '#ef4444' : '#04040A',
              border: selling ? '1px solid #ef444430' : 'none',
            }}>
            {selling ? `Sell ${buyAmt} ${sym}` : `Buy ${buyAmt} ${sym} · $${cost.toFixed(2)}`}
          </button>

          {txDone && (
            <div className="mt-3 p-3 rounded-xl text-sm text-center font-semibold"
              style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
              ✓ {txDone}
            </div>
          )}
        </div>

        {/* Staking tiers */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/40 uppercase tracking-widest">Staking Tiers</div>
            <button onClick={() => setStaking(!staking)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
              {staking ? 'Cancel' : 'Stake Tokens'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {token.staking.map((s: any) => <StakingTier key={s.tier} tier={s} mine={mine} />)}
          </div>

          {staking && (
            <div className="mt-3 p-3 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <label className="text-xs text-white/40 mb-1 block">Stake amount</label>
              <div className="flex gap-2">
                <input type="number" value={stakeAmt} onChange={e => setStakeAmt(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-white/25"
                />
                <button onClick={doStake}
                  className="px-4 py-2 rounded-xl font-bold text-sm"
                  style={{ background: '#f59e0b', color: '#04040A' }}>
                  Stake ↗
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top holders */}
        {token.topHolders?.length > 0 && (
          <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Top Holders</div>
            <div className="space-y-2.5">
              {token.topHolders.map((h: any, i: number) => (
                <button key={h.handle} onClick={() => router.push(`/profile/${h.handle}`)}
                  className="w-full flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <span className="text-xs text-white/25 w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs"
                    style={{ background: `${h.color}18`, color: h.color, border: `1px solid ${h.color}25` }}>
                    {h.name[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">{h.name}</div>
                    <div className="text-xs text-white/30">@{h.handle}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{h.qty.toLocaleString()}</div>
                    <div className="text-xs text-white/30">{sym}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Back to market CTA */}
        <div className="text-center py-2">
          <button onClick={() => router.push('/tokens')}
            className="text-sm text-white/30 hover:text-white/60 transition-colors">
            ← Back to Token Market
          </button>
        </div>
      </div>
    </div>
  )
}
