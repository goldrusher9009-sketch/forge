'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKEN_INFO: Record<string, { name: string; color: string; price: number; apy: Record<string, number> }> = {
  SOVV: { name: 'Sovereign V', color: '#a855f7', price: 12.40, apy: { Bronze: 8, Silver: 14, Gold: 22, Diamond: 35 } },
  MAYA: { name: 'Maya Chen',   color: '#22c55e', price: 6.60,  apy: { Bronze: 8, Silver: 14, Gold: 22, Diamond: 35 } },
  APEX: { name: 'Luna Apex',   color: '#f59e0b', price: 9.10,  apy: { Bronze: 8, Silver: 14, Gold: 22, Diamond: 35 } },
  ZERO: { name: 'ZeroNode',    color: '#818cf8', price: 3.20,  apy: { Bronze: 8, Silver: 14, Gold: 22, Diamond: 35 } },
}

const TIERS = [
  { name: 'Bronze',  min: 10,  max: 24,  color: '#cd7f32', apy: 8  },
  { name: 'Silver',  min: 25,  max: 49,  color: '#94a3b8', apy: 14 },
  { name: 'Gold',    min: 50,  max: 99,  color: '#f59e0b', apy: 22 },
  { name: 'Diamond', min: 100, max: Infinity, color: '#818cf8', apy: 35 },
]

function getTier(qty: number) {
  return TIERS.slice().reverse().find(t => qty >= t.min) ?? null
}

export default function StakePage() {
  const router = useRouter()
  const params = useParams()
  const symbol = ((params.symbol as string) || 'SOVV').toUpperCase()
  const token = TOKEN_INFO[symbol] || TOKEN_INFO.SOVV

  const [mode, setMode] = useState<'stake' | 'unstake'>('stake')
  const [qty, setQty] = useState('')
  const [compound, setCompound] = useState(true)
  const [loading, setLoading] = useState(false)
  const [txMsg, setTxMsg] = useState<string | null>(null)

  // Mock current state
  const [stakedQty, setStakedQty] = useState(120)
  const [walletQty] = useState(80)
  const [pendingRewards] = useState(8.42)

  const qtyNum = parseFloat(qty) || 0
  const activeTier = getTier(stakedQty + (mode === 'stake' ? qtyNum : -qtyNum))
  const currentTier = getTier(stakedQty)
  const apy = activeTier?.apy ?? 0
  const stakedValue = stakedQty * token.price
  const annualRewards = (stakedValue * apy) / 100
  const monthlyRewards = annualRewards / 12

  async function handleAction() {
    if (!qty || qtyNum <= 0) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1100))
    if (mode === 'stake') {
      setStakedQty(s => s + qtyNum)
      setTxMsg(`Staked ${qty} ${symbol} at ${activeTier?.apy ?? 0}% APY`)
    } else {
      setStakedQty(s => Math.max(0, s - qtyNum))
      setTxMsg(`Unstaked ${qty} ${symbol}`)
    }
    setQty('')
    setLoading(false)
    setTimeout(() => setTxMsg(null), 5000)
  }

  async function claimRewards() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setTxMsg(`Claimed ${pendingRewards.toFixed(4)} ${symbol}`)
    setTimeout(() => setTxMsg(null), 4000)
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
            <p className="text-xs text-white/30 tracking-widest">STAKE & EARN</p>
            <h1 className="font-bold text-white">${symbol} Staking</h1>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: `${token.color}18`, color: token.color }}>
            {symbol[0]}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {/* Current position */}
        <div className="p-4 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-white/30">Staked</div>
              <div className="text-2xl font-black text-white">{stakedQty} <span className="text-base text-white/50">{symbol}</span></div>
              <div className="text-xs text-white/30">${stakedValue.toFixed(2)} USD</div>
            </div>
            {currentTier && (
              <div className="text-right">
                <div className="px-3 py-1.5 rounded-xl font-black text-sm"
                  style={{ background: `${currentTier.color}20`, color: currentTier.color }}>
                  {currentTier.name}
                </div>
                <div className="text-xs mt-1" style={{ color: currentTier.color }}>{currentTier.apy}% APY</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Monthly', val: `+${monthlyRewards.toFixed(2)}` },
              { label: 'Annual',  val: `+${annualRewards.toFixed(2)}` },
              { label: 'Pending', val: pendingRewards.toFixed(4) },
            ].map(m => (
              <div key={m.label} className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-sm font-black" style={{ color: token.color }}>{m.val}</div>
                <div className="text-xs text-white/25 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
          {pendingRewards > 0 && (
            <button onClick={claimRewards} disabled={loading}
              className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40"
              style={{ background: `${token.color}15`, color: token.color, border: `1px solid ${token.color}25` }}>
              Claim {pendingRewards.toFixed(4)} {symbol}
            </button>
          )}
        </div>

        {/* Tier ladder */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Staking Tiers</div>
          {TIERS.map(tier => {
            const isActive = currentTier?.name === tier.name
            const willBe = activeTier?.name === tier.name && qtyNum > 0
            return (
              <div key={tier.name} className="p-3 rounded-xl border transition-all"
                style={isActive
                  ? { background: `${tier.color}12`, borderColor: `${tier.color}35` }
                  : willBe && mode === 'stake'
                  ? { background: `${tier.color}08`, borderColor: `${tier.color}20` }
                  : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ background: `${tier.color}20`, color: tier.color }}>{tier.name[0]}</div>
                    <span className="font-bold text-sm" style={{ color: isActive ? tier.color : 'rgba(255,255,255,0.7)' }}>{tier.name}</span>
                    {isActive && <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: `${tier.color}20`, color: tier.color }}>Current</span>}
                    {willBe && mode === 'stake' && !isActive && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: `${tier.color}15`, color: tier.color }}>After stake</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black" style={{ color: tier.color }}>{tier.apy}% APY</div>
                    <div className="text-xs text-white/25">≥ {tier.min} tokens</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stake/Unstake */}
        <div className="p-4 rounded-2xl border border-white/8 space-y-4" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="flex gap-2">
            {(['stake', 'unstake'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-xl text-xs font-black capitalize transition-all"
                style={mode === m
                  ? { background: token.color, color: '#04040A' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                {m}
              </button>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/35 mb-1.5">
              <span>Amount</span>
              <span>{mode === 'stake' ? 'Wallet' : 'Staked'}: {mode === 'stake' ? walletQty : stakedQty} {symbol}</span>
            </div>
            <input value={qty} onChange={e => setQty(e.target.value)}
              type="number" placeholder="0"
              className="w-full px-4 py-3 rounded-xl text-xl font-black bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none" />
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => setQty(String(Math.floor((mode === 'stake' ? walletQty : stakedQty) * pct / 100)))}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {mode === 'stake' && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white/70">Auto-compound</div>
                <div className="text-xs text-white/30">Reinvest rewards daily</div>
              </div>
              <button onClick={() => setCompound(c => !c)}
                className="w-12 h-6 rounded-full transition-all relative"
                style={{ background: compound ? token.color : 'rgba(255,255,255,0.1)' }}>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: compound ? '26px' : '4px' }} />
              </button>
            </div>
          )}

          {qtyNum > 0 && activeTier && (
            <div className="p-3 rounded-xl space-y-1"
              style={{ background: `${activeTier.color}08`, border: `1px solid ${activeTier.color}20` }}>
              <div className="text-xs font-bold" style={{ color: activeTier.color }}>
                → {activeTier.name} tier at {activeTier.apy}% APY
              </div>
              <div className="text-xs text-white/40">
                Est. +{((qtyNum * token.price + stakedValue) * activeTier.apy / 100 / 12).toFixed(2)} {symbol}/month
              </div>
            </div>
          )}

          <button onClick={handleAction} disabled={loading || qtyNum <= 0}
            className="w-full py-3.5 rounded-xl font-black text-sm disabled:opacity-40 capitalize"
            style={{ background: mode === 'stake' ? token.color : '#f87171', color: '#04040A' }}>
            {loading ? 'Processing…' : `${mode} ${qty || '0'} ${symbol}`}
          </button>
        </div>
      </div>
    </div>
  )
}
