'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKEN_DATA = {
  sovereign_v: {
    symbol: 'SOVV', name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7',
    price: 12.40, change24h: +8.2, change7d: +31.4,
    marketCap: 248000, volume24h: 84200, totalSupply: 20000, circulating: 14200,
    holders: 1284, stakersCount: 312, tvl: 156800,
    description: 'SOVV is the native token of Sovereign V — a token economy built on trust, transparency, and real value exchange. Holders get access to exclusive content, governance rights, and a share of ad revenue.',
    tiers: [
      { name: 'Bronze', min: 10, perks: ['Token-gated posts', 'Monthly Q&A', 'Early access'], color: '#cd7f32', holders: 580 },
      { name: 'Silver', min: 25, perks: ['All Bronze', 'Weekly voice notes', 'Private Discord', '5% ad revenue share'], color: '#94a3b8', holders: 412 },
      { name: 'Gold',   min: 50, perks: ['All Silver', '1:1 monthly call', '10% ad revenue share', 'Co-creation votes'], color: '#f59e0b', holders: 234 },
      { name: 'Diamond',min: 100,perks: ['All Gold', 'Unlimited 1:1 access', '20% ad revenue share', 'Token allocation'], color: '#818cf8', holders: 58 },
    ],
    topHolders: [
      { handle: 'whale_01', avatar: 'W1', qty: 842, value: 10441, tier: 'Diamond', color: '#818cf8' },
      { handle: 'mayafit',  avatar: 'MC', qty: 500, value: 6200,  tier: 'Diamond', color: '#22c55e' },
      { handle: 'alexwave', avatar: 'AW', qty: 320, value: 3968,  tier: 'Gold',    color: '#ec4899' },
      { handle: 'zeronode', avatar: 'ZN', qty: 280, value: 3472,  tier: 'Gold',    color: '#818cf8' },
      { handle: 'luna_apex',avatar: 'LA', qty: 150, value: 1860,  tier: 'Silver',  color: '#f59e0b' },
    ],
    recentTx: [
      { type: 'buy',  handle: 'cryptomind', qty: 50,  ts: '5m ago',  color: '#22c55e' },
      { type: 'buy',  handle: 'newuser_42', qty: 25,  ts: '12m ago', color: '#22c55e' },
      { type: 'sell', handle: 'trader_88',  qty: 10,  ts: '1h ago',  color: '#f87171' },
      { type: 'buy',  handle: 'hodler_x',   qty: 100, ts: '2h ago',  color: '#22c55e' },
    ],
  }
}

const TIER_COLORS: Record<string, string> = { Bronze: '#cd7f32', Silver: '#94a3b8', Gold: '#f59e0b', Diamond: '#818cf8' }

export default function ProfileTokensPage() {
  const router = useRouter()
  const params = useParams()
  const handle = (params.handle as string) || 'sovereign_v'
  const data = TOKEN_DATA[handle as keyof typeof TOKEN_DATA] || TOKEN_DATA.sovereign_v

  const [tab, setTab] = useState<'overview' | 'holders' | 'activity'>('overview')
  const [buyQty, setBuyQty] = useState('')
  const [buying, setBuying] = useState(false)
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)

  const buyValue = (parseFloat(buyQty) || 0) * data.price

  async function handleBuy() {
    if (!buyQty || parseFloat(buyQty) <= 0) return
    setBuying(true)
    await new Promise(r => setTimeout(r, 1200))
    setBuying(false)
    setShowBuyModal(false)
    setTxMsg(`Bought ${buyQty} ${data.symbol} for $${buyValue.toFixed(2)}`)
    setBuyQty('')
    setTimeout(() => setTxMsg(null), 5000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
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
            <div className="font-bold text-white">${data.symbol}</div>
            <div className="text-xs text-white/30">@{handle} · Creator Token</div>
          </div>
          <button onClick={() => setShowBuyModal(true)}
            className="px-4 py-2 rounded-xl font-black text-sm"
            style={{ background: data.color, color: '#04040A' }}>
            Buy
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {/* Price hero */}
        <div className="p-4 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-black text-white">${data.price.toFixed(2)}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-sm font-bold ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.change24h >= 0 ? '+' : ''}{data.change24h}% 24h
                </span>
                <span className={`text-sm font-bold ${data.change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.change7d >= 0 ? '+' : ''}{data.change7d}% 7d
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
              style={{ background: `${data.color}18`, color: data.color }}>
              {data.symbol[0]}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Market Cap', val: `$${(data.marketCap/1000).toFixed(0)}k` },
              { label: 'Vol 24h',    val: `$${(data.volume24h/1000).toFixed(0)}k` },
              { label: 'Holders',    val: data.holders.toLocaleString() },
              { label: 'Supply',     val: data.totalSupply.toLocaleString() },
              { label: 'Staked TVL', val: `$${(data.tvl/1000).toFixed(0)}k` },
              { label: 'Stakers',    val: data.stakersCount },
            ].map(m => (
              <div key={m.label} className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-sm font-bold text-white/70">{m.val}</div>
                <div className="text-xs text-white/25">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['overview', 'holders', 'activity'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all"
              style={tab === t
                ? { background: data.color, color: '#04040A' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            <p className="text-sm text-white/50 leading-relaxed">{data.description}</p>
            <div className="space-y-3">
              <div className="text-xs text-white/30 uppercase tracking-widest">Holder Tiers</div>
              {data.tiers.map(tier => (
                <div key={tier.name} className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                        style={{ background: `${tier.color}20`, color: tier.color }}>
                        {tier.name[0]}
                      </div>
                      <span className="font-bold text-sm" style={{ color: tier.color }}>{tier.name}</span>
                      <span className="text-xs text-white/30">≥ {tier.min} tokens</span>
                    </div>
                    <span className="text-xs text-white/30">{tier.holders} holders</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tier.perks.map(p => (
                      <span key={p} className="text-xs px-2 py-0.5 rounded-md"
                        style={{ background: `${tier.color}10`, color: tier.color }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'holders' && (
          <div className="space-y-2">
            <div className="text-xs text-white/30 uppercase tracking-widest">Top Holders</div>
            {data.topHolders.map((h, i) => (
              <div key={h.handle} className="p-3 rounded-xl border border-white/6 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="text-xs text-white/20 w-4 text-right">#{i+1}</div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: `${h.color}18`, color: h.color }}>{h.avatar}</div>
                <div className="flex-1">
                  <button onClick={() => router.push(`/profile/${h.handle}`)}
                    className="text-sm font-bold text-white/80 hover:text-white transition-colors">@{h.handle}</button>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white/70">{h.qty}</div>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${TIER_COLORS[h.tier]}18`, color: TIER_COLORS[h.tier] }}>{h.tier}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'activity' && (
          <div className="space-y-2">
            <div className="text-xs text-white/30 uppercase tracking-widest">Recent Trades</div>
            {data.recentTx.map((tx, i) => (
              <div key={i} className="p-3 rounded-xl border border-white/6 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                  style={{ background: `${tx.color}15`, color: tx.color }}>{tx.type === 'buy' ? '↑' : '↓'}</div>
                <div className="flex-1">
                  <span className="text-sm font-bold" style={{ color: tx.color }}>{tx.type.toUpperCase()}</span>
                  <span className="text-sm text-white/50 ml-2">@{tx.handle}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white/70">{tx.qty} {data.symbol}</div>
                  <div className="text-xs text-white/25">{tx.ts}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowBuyModal(false)}>
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4"
            style={{ background: '#0d0d1a' }} onClick={e => e.stopPropagation()}>
            <div className="font-black text-white text-lg">Buy ${data.symbol}</div>
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <div className="text-xs text-white/30">Current Price</div>
                <div className="font-black text-white">${data.price}</div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-xs text-white/30">24h Change</div>
                <div className="font-bold" style={{ color: '#22c55e' }}>+{data.change24h}%</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1.5">Quantity</div>
              <div className="flex gap-2">
                <input value={buyQty} onChange={e => setBuyQty(e.target.value)}
                  type="number" placeholder="0"
                  className="flex-1 px-4 py-3 rounded-xl text-lg font-black bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none" />
              </div>
              {buyValue > 0 && (
                <div className="text-sm text-white/40 mt-1.5">≈ ${buyValue.toFixed(2)} USDC</div>
              )}
            </div>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map(q => (
                <button key={q} onClick={() => setBuyQty(String(q))}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>{q}</button>
              ))}
            </div>
            <button onClick={handleBuy} disabled={buying || !buyQty || parseFloat(buyQty) <= 0}
              className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40"
              style={{ background: data.color, color: '#04040A' }}>
              {buying ? 'Processing…' : `Buy ${buyQty || '0'} ${data.symbol}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
