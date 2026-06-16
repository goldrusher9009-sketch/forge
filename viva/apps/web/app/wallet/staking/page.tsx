'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StakePosition {
  id: string
  symbol: string
  creatorName: string
  color: string
  qty: number
  price: number
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze'
  apy: number
  stakedAt: string
  earned: number
  lockDays: number
  daysLeft: number
}

const TIERS = { Bronze: '#b45309', Silver: '#94a3b8', Gold: '#f59e0b', Diamond: '#818cf8' }
const APY   = { Bronze: 8, Silver: 14, Gold: 22, Diamond: 35 }
const EMOJIS= { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Diamond: '💎' }

const POSITIONS: StakePosition[] = [
  { id:'s1', symbol:'SVRN', creatorName:'Sovereign V', color:'#a855f7', qty:50,  price:8.75,  tier:'Gold',    apy:22, stakedAt:'2026-04-01', earned:48.5,  lockDays:90, daysLeft:15 },
  { id:'s2', symbol:'MAYA', creatorName:'Maya Chen',   color:'#22c55e', qty:80,  price:5.20,  tier:'Diamond', apy:35, stakedAt:'2026-03-15', earned:124.2, lockDays:90, daysLeft:0  },
  { id:'s3', symbol:'JAX',  creatorName:'Jax Beats',  color:'#ec4899', qty:25,  price:3.80,  tier:'Silver',  apy:14, stakedAt:'2026-05-01', earned:8.4,   lockDays:30, daysLeft:8  },
]

export default function WalletStakingPage() {
  const router = useRouter()
  const [unstaking, setUnstaking] = useState<string | null>(null)

  const totalStaked = POSITIONS.reduce((s, p) => s + p.qty * p.price, 0)
  const totalEarned = POSITIONS.reduce((s, p) => s + p.earned, 0)
  const annualIncome = POSITIONS.reduce((s, p) => s + p.qty * p.price * (p.apy / 100), 0)

  async function handleUnstake(id: string) {
    setUnstaking(id)
    await new Promise(r => setTimeout(r, 1200))
    setUnstaking(null)
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
          <div>
            <div className="font-black text-white">Staking Overview</div>
            <div className="text-xs text-white/30">All positions</div>
          </div>
          <button onClick={() => router.push('/staking/tiers')}
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
            Tiers
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Summary */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 mb-3 font-semibold uppercase tracking-wider">Portfolio Summary</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Staked Value', value:`$${totalStaked.toFixed(0)}`, color:'#a855f7'  },
              { label:'Total Earned', value:`$${totalEarned.toFixed(1)}`, color:'#22c55e'  },
              { label:'Annual Est.', value:`$${annualIncome.toFixed(0)}`, color:'#f59e0b'  },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-black text-base" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-white/25 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier summary */}
        <div className="flex gap-2">
          {(['Bronze','Silver','Gold','Diamond'] as const).map(tier => {
            const count = POSITIONS.filter(p => p.tier === tier).length
            return (
              <div key={tier} className="flex-1 p-2 rounded-xl text-center border border-white/4"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="text-base">{EMOJIS[tier]}</div>
                <div className="text-xs font-black" style={{ color: TIERS[tier] }}>{count}</div>
              </div>
            )
          })}
        </div>

        {/* Positions */}
        <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Active Positions</div>
        <div className="space-y-3">
          {POSITIONS.map(pos => {
            const value = pos.qty * pos.price
            const lockedPct = pos.daysLeft > 0 ? (pos.daysLeft / pos.lockDays) * 100 : 0
            const canUnstake = pos.daysLeft === 0
            const isUnstaking = unstaking === pos.id
            return (
              <div key={pos.id} className="p-4 rounded-2xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                    style={{ background: `${pos.color}15`, color: pos.color }}>
                    {pos.symbol[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-white/80">${pos.symbol}</span>
                      <span className="text-xs" style={{ color: TIERS[pos.tier] }}>{EMOJIS[pos.tier]} {pos.tier}</span>
                    </div>
                    <div className="text-xs text-white/30">{pos.creatorName} · {pos.qty} tokens</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-white/75">${value.toFixed(0)}</div>
                    <div className="text-xs font-bold" style={{ color: TIERS[pos.tier] }}>{pos.apy}% APY</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="font-black text-sm" style={{ color: '#22c55e' }}>+${pos.earned.toFixed(2)}</div>
                    <div className="text-xs text-white/25">Earned</div>
                  </div>
                  <div className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="font-black text-sm text-white/60">${(value * pos.apy / 100).toFixed(0)}</div>
                    <div className="text-xs text-white/25">Projected / yr</div>
                  </div>
                </div>

                {pos.daysLeft > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-white/25 mb-1">
                      <span>Lock period</span>
                      <span>{pos.daysLeft}d remaining</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${lockedPct}%`, background: '#f59e0b' }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => router.push(`/tokens/${pos.symbol}/chart`)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    View Token
                  </button>
                  <button onClick={() => canUnstake && handleUnstake(pos.id)} disabled={!canUnstake || isUnstaking}
                    className="flex-1 py-2 rounded-xl text-xs font-black disabled:opacity-30"
                    style={canUnstake ? { background: '#22c55e', color: '#04040A' } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>
                    {isUnstaking ? 'Unstaking…' : canUnstake ? 'Unstake' : `Locked ${pos.daysLeft}d`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={() => router.push('/staking')}
          className="w-full py-3 rounded-xl font-black text-sm"
          style={{ background: '#a855f7', color: '#04040A' }}>
          + Stake More Tokens
        </button>
      </div>
    </div>
  )
}
