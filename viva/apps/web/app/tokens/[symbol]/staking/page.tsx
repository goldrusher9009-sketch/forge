'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKEN_DATA: Record<string, { name: string; color: string; price: number; myTokens: number; staked: number; totalStaked: number; totalSupply: number }> = {
  SVRN: { name: 'Sovereign V', color: '#a855f7', price: 8.75, myTokens: 50, staked: 30, totalStaked: 62400, totalSupply: 100000 },
  MAYA: { name: 'Maya Chen',   color: '#22c55e', price: 5.20, myTokens: 80, staked: 60, totalStaked: 48200, totalSupply: 80000  },
  JAX:  { name: 'Jax Beats',  color: '#ec4899', price: 3.80, myTokens: 0,  staked: 0,  totalStaked: 18900, totalSupply: 60000  },
}

const TIERS = [
  { name: 'Bronze',  min: 10,  max: 24,  apy: 8,  color: '#b45309', emoji: '🥉' },
  { name: 'Silver',  min: 25,  max: 49,  apy: 14, color: '#94a3b8', emoji: '🥈' },
  { name: 'Gold',    min: 50,  max: 99,  apy: 22, color: '#f59e0b', emoji: '🥇' },
  { name: 'Diamond', min: 100, max: Infinity, apy: 35, color: '#818cf8', emoji: '💎' },
]

function getTier(staked: number) {
  return TIERS.find(t => staked >= t.min && staked <= t.max) ?? null
}

export default function TokenStakingPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol : 'SVRN'
  const token = TOKEN_DATA[symbol] ?? TOKEN_DATA.SVRN

  const available = token.myTokens - token.staked
  const currentTier = getTier(token.staked)
  const nextTier = TIERS.find(t => t.min > token.staked) ?? null

  const [stakeAmt, setStakeAmt] = useState('')
  const [unstakeAmt, setUnstakeAmt] = useState('')
  const [staking, setStaking] = useState(false)
  const [unstaking, setUnstaking] = useState(false)
  const [staked, setStaked] = useState(false)
  const [unstaked, setUnstaked] = useState(false)
  const [tab, setTab] = useState<'stake' | 'unstake'>('stake')

  const numStake = Number(stakeAmt) || 0
  const previewStaked = token.staked + numStake
  const previewTier = getTier(previewStaked)
  const projectedApy = previewTier?.apy ?? currentTier?.apy ?? 0
  const projectedEarnings = (previewStaked * token.price * projectedApy / 100).toFixed(2)

  async function handleStake() {
    if (numStake <= 0 || numStake > available) return
    setStaking(true)
    await new Promise(r => setTimeout(r, 1000))
    setStaking(false)
    setStaked(true)
    setTimeout(() => { setStaked(false); setStakeAmt('') }, 2500)
  }

  async function handleUnstake() {
    const n = Number(unstakeAmt) || 0
    if (n <= 0 || n > token.staked) return
    setUnstaking(true)
    await new Promise(r => setTimeout(r, 1000))
    setUnstaking(false)
    setUnstaked(true)
    setTimeout(() => { setUnstaked(false); setUnstakeAmt('') }, 2500)
  }

  const stakedPct = token.totalSupply > 0 ? (token.totalStaked / token.totalSupply) * 100 : 0

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
            {symbol[0]}
          </div>
          <div>
            <div className="font-black text-white">${symbol} Staking</div>
            <div className="text-xs text-white/30">{token.name} · ${token.price}</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Current position */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">My Position</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="font-black text-xl text-white/80">{token.myTokens}</div>
              <div className="text-xs text-white/25">Held</div>
            </div>
            <div className="text-center">
              <div className="font-black text-xl" style={{ color: token.color }}>{token.staked}</div>
              <div className="text-xs text-white/25">Staked</div>
            </div>
            <div className="text-center">
              <div className="font-black text-xl text-white/50">{available}</div>
              <div className="text-xs text-white/25">Available</div>
            </div>
          </div>

          {/* Current tier badge */}
          {currentTier ? (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl border"
              style={{ background: `${currentTier.color}08`, borderColor: `${currentTier.color}20` }}>
              <span className="text-lg">{currentTier.emoji}</span>
              <div className="flex-1">
                <div className="text-xs font-black" style={{ color: currentTier.color }}>{currentTier.name} Member · {currentTier.apy}% APY</div>
                {nextTier && (
                  <div className="text-xs text-white/25">{nextTier.min - token.staked} more to reach {nextTier.name} ({nextTier.apy}% APY)</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-black text-sm" style={{ color: '#22c55e' }}>
                  +${(token.staked * token.price * currentTier.apy / 100).toFixed(0)}/yr
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 p-2.5 rounded-xl border border-white/5 text-center text-xs text-white/30">
              Stake 10+ tokens to earn rewards
            </div>
          )}
        </div>

        {/* Tier progression */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Tier Rewards</div>
          <div className="space-y-2">
            {TIERS.map(tier => {
              const isActive = currentTier?.name === tier.name
              const isPast = token.staked >= tier.min
              return (
                <div key={tier.name} className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ background: isActive ? `${tier.color}10` : 'transparent' }}>
                  <span className="text-base">{tier.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: isPast ? tier.color : 'rgba(255,255,255,0.3)' }}>
                        {tier.name}
                      </span>
                      {isActive && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: tier.color, color: '#04040A' }}>Active</span>}
                    </div>
                    <div className="text-xs text-white/25">{tier.min}{tier.max === Infinity ? '+' : `–${tier.max}`} tokens</div>
                  </div>
                  <div className="font-black text-sm" style={{ color: isPast ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                    {tier.apy}% APY
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Protocol stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-base" style={{ color: token.color }}>{token.totalStaked.toLocaleString()}</div>
            <div className="text-xs text-white/25">Total Staked</div>
          </div>
          <div className="p-3 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-base text-white/70">{stakedPct.toFixed(0)}%</div>
            <div className="text-xs text-white/25">of Supply</div>
          </div>
        </div>

        {/* Stake/Unstake tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['stake', 'unstake'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
              style={tab === t ? { background: 'rgba(255,255,255,0.08)', color: 'white' } : { color: 'rgba(255,255,255,0.3)' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Stake form */}
        {tab === 'stake' && (
          staked ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔒</div>
              <div className="font-black text-white">Staked!</div>
              <div className="text-sm text-white/35 mt-1">{stakeAmt} ${symbol} now earning rewards</div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex justify-between text-xs text-white/35 mb-2">
                  <span>Amount to stake</span>
                  <span>Available: {available}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input value={stakeAmt} onChange={e => setStakeAmt(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="flex-1 text-2xl font-black text-white bg-transparent outline-none" />
                  <button onClick={() => setStakeAmt(String(available))}
                    className="text-xs px-2 py-1 rounded-lg font-bold"
                    style={{ background: `${token.color}15`, color: token.color }}>MAX</button>
                </div>
              </div>

              {numStake > 0 && (
                <div className="p-3 rounded-xl border border-white/5 space-y-1.5" style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Preview</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">New staked total</span>
                    <span className="text-white/70 font-bold">{previewStaked}</span>
                  </div>
                  {previewTier && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Tier</span>
                      <span className="font-bold" style={{ color: previewTier.color }}>{previewTier.emoji} {previewTier.name} · {previewTier.apy}% APY</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Est. yearly earnings</span>
                    <span className="font-black" style={{ color: '#22c55e' }}>+${projectedEarnings}</span>
                  </div>
                </div>
              )}

              <button onClick={handleStake} disabled={numStake <= 0 || numStake > available || staking}
                className="w-full py-3.5 rounded-xl font-black text-sm disabled:opacity-30"
                style={{ background: token.color, color: '#04040A' }}>
                {staking ? 'Staking…' : `🔒 Stake ${stakeAmt || '0'} $${symbol}`}
              </button>
            </div>
          )
        )}

        {/* Unstake form */}
        {tab === 'unstake' && (
          unstaked ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔓</div>
              <div className="font-black text-white">Unstaked!</div>
              <div className="text-sm text-white/35 mt-1">{unstakeAmt} ${symbol} returned to wallet</div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex justify-between text-xs text-white/35 mb-2">
                  <span>Amount to unstake</span>
                  <span>Staked: {token.staked}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input value={unstakeAmt} onChange={e => setUnstakeAmt(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="flex-1 text-2xl font-black text-white bg-transparent outline-none" />
                  <button onClick={() => setUnstakeAmt(String(token.staked))}
                    className="text-xs px-2 py-1 rounded-lg font-bold"
                    style={{ background: `${token.color}15`, color: token.color }}>MAX</button>
                </div>
              </div>
              <div className="text-xs text-white/25 text-center px-4">Unstaking removes you from the rewards tier. 24h cooldown applies.</div>
              <button onClick={handleUnstake} disabled={Number(unstakeAmt) <= 0 || Number(unstakeAmt) > token.staked || unstaking}
                className="w-full py-3.5 rounded-xl font-black text-sm disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                {unstaking ? 'Unstaking…' : `🔓 Unstake ${unstakeAmt || '0'} $${symbol}`}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
