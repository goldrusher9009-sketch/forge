'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { tokens as tokensApi } from '@/lib/api'
import { TIER_META } from '@/lib/store'

// ─── Mock staked positions ────────────────────────────────────────────────────
const MOCK_STAKES = [
  { symbol: 'MAYA', creator: 'Maya Chen',   handle: 'mayafit',    tier: 'guardian', color: '#a855f7', staked: 250,  apy: 26, stakedAt: '2025-11-01', price: 6.60, earned: 18.42, earningPerDay: 0.44 },
  { symbol: 'ALEX', creator: 'Alex Wave',   handle: 'alexwave',   tier: 'seeker',   color: '#22c55e', staked: 100,  apy: 20, stakedAt: '2025-12-10', price: 5.10, earned: 12.25, earningPerDay: 0.28 },
  { symbol: 'SOVV', creator: 'Sovereign V', handle: 'sovereign_v',tier: 'guardian', color: '#a855f7', staked: 500,  apy: 35, stakedAt: '2025-10-15', price: 12.40, earned: 54.10, earningPerDay: 1.79 },
]

const TIER_COLORS: Record<string, string> = {
  Bronze:  '#cd7f32',
  Silver:  '#94a3b8',
  Gold:    '#f59e0b',
  Diamond: '#818cf8',
}

function getStakingTier(staked: number) {
  if (staked >= 500) return 'Diamond'
  if (staked >= 100) return 'Gold'
  if (staked >= 50)  return 'Silver'
  return 'Bronze'
}

function daysStaked(since: string) {
  return Math.floor((Date.now() - new Date(since).getTime()) / 86400000)
}

function fmt(n: number, decimals = 2) {
  return `$${n.toFixed(decimals)}`
}

function AnnualProgressRing({ apy, color }: { apy: number; color: string }) {
  const pct = Math.min(apy / 40, 1)
  const r = 22, c = 2 * Math.PI * r
  const dash = pct * c
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '28px 28px', transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{apy}%</text>
    </svg>
  )
}

export default function StakingPage() {
  const router = useRouter()
  const [stakes, setStakes] = useState(MOCK_STAKES)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [unstaking, setUnstaking] = useState<string | null>(null)
  const [txMsg, setTxMsg] = useState<string | null>(null)

  const totalStakedValue = stakes.reduce((s, p) => s + p.staked * p.price, 0)
  const totalEarned      = stakes.reduce((s, p) => s + p.earned, 0)
  const totalPerDay      = stakes.reduce((s, p) => s + p.earningPerDay, 0)
  const avgApy           = stakes.reduce((s, p) => s + p.apy, 0) / stakes.length

  async function claimRewards(sym: string) {
    setClaiming(sym)
    await new Promise(r => setTimeout(r, 900))
    setClaimed(prev => new Set([...prev, sym]))
    setClaiming(null)
    setTxMsg(`Claimed ${stakes.find(s => s.symbol === sym)?.earned.toFixed(2)} ${sym} rewards`)
    setTimeout(() => setTxMsg(null), 3000)
  }

  async function claimAll() {
    setClaiming('all')
    await new Promise(r => setTimeout(r, 1200))
    setClaimed(new Set(stakes.map(s => s.symbol)))
    setClaiming(null)
    setTxMsg(`Claimed ${fmt(totalEarned)} total rewards`)
    setTimeout(() => setTxMsg(null), 3500)
  }

  async function unstake(sym: string) {
    setUnstaking(sym)
    await new Promise(r => setTimeout(r, 800))
    setStakes(prev => prev.filter(s => s.symbol !== sym))
    setUnstaking(null)
    setTxMsg(`Unstaked ${sym}`)
    setTimeout(() => setTxMsg(null), 2500)
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
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Staking Dashboard</h1>
          </div>
          <button onClick={() => router.push('/tokens')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b25' }}>
            + Stake More
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 p-4 rounded-2xl border border-white/6"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(245,158,11,0.06))' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/35 mb-1">Total Staked Value</div>
                <div className="text-3xl font-black text-white">{fmt(totalStakedValue)}</div>
                <div className="text-sm text-white/40 mt-1">across {stakes.length} positions</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/35 mb-1">Total Earned</div>
                <div className="text-xl font-bold text-green-400">{fmt(totalEarned)}</div>
                <div className="text-xs text-white/40 mt-1">{fmt(totalPerDay)}/day avg</div>
              </div>
            </div>
          </div>

          {[
            { label: 'Avg APY',      val: `${avgApy.toFixed(1)}%`, color: '#f59e0b' },
            { label: 'Daily Yield',  val: fmt(totalPerDay),         color: '#22c55e' },
            { label: 'Active Positions', val: stakes.length,       color: '#a855f7' },
            { label: 'Est. Annual',  val: fmt(totalPerDay * 365),  color: '#818cf8' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/6 text-center"
              style={{ background: `${s.color}06` }}>
              <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Claim all */}
        {totalEarned > 0 && (
          <button onClick={claimAll} disabled={claiming === 'all' || claimed.size === stakes.length}
            className="w-full py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
            style={{ background: '#22c55e', color: '#04040A' }}>
            {claiming === 'all' ? 'Claiming…' : claimed.size === stakes.length
              ? `✓ All Rewards Claimed`
              : `Claim All Rewards · ${fmt(totalEarned)}`}
          </button>
        )}

        {/* Tx message */}
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {/* Position cards */}
        <div className="space-y-3">
          {stakes.map(pos => {
            const stakingTier = getStakingTier(pos.staked)
            const tierColor = TIER_COLORS[stakingTier]
            const days = daysStaked(pos.stakedAt)
            const isClaiming = claiming === pos.symbol
            const isClaimed = claimed.has(pos.symbol)
            const isUnstaking = unstaking === pos.symbol

            return (
              <div key={pos.symbol} className="p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{ background: `${pos.color}18`, color: pos.color, border: `1.5px solid ${pos.color}30` }}>
                      {pos.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">${pos.symbol}</div>
                      <button onClick={() => router.push(`/profile/${pos.handle}`)}
                        className="text-xs transition-colors hover:text-white/60"
                        style={{ color: pos.color }}>
                        {pos.creator}
                      </button>
                    </div>
                  </div>
                  <AnnualProgressRing apy={pos.apy} color={tierColor} />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Staked',   val: `${pos.staked}` },
                    { label: 'Tier',     val: stakingTier,      color: tierColor },
                    { label: 'Days',     val: days },
                    { label: '$/day',    val: fmt(pos.earningPerDay), color: '#22c55e' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-lg border border-white/5"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-xs font-bold" style={{ color: (s as any).color ?? 'white' }}>{s.val}</div>
                      <div className="text-xs text-white/30">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Earned bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/35">Rewards earned</span>
                    <span className="font-bold text-green-400">{fmt(pos.earned)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min((pos.earned / (pos.staked * pos.price * pos.apy / 100)) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #22c55e60, #22c55e)',
                    }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => claimRewards(pos.symbol)}
                    disabled={isClaiming || isClaimed}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
                    {isClaiming ? '…' : isClaimed ? '✓ Claimed' : `Claim ${fmt(pos.earned)}`}
                  </button>
                  <button onClick={() => router.push(`/tokens/${pos.symbol}`)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: `${pos.color}12`, color: pos.color, border: `1px solid ${pos.color}25` }}>
                    Details
                  </button>
                  <button onClick={() => unstake(pos.symbol)}
                    disabled={isUnstaking}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {isUnstaking ? '…' : 'Unstake'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {stakes.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4 opacity-20">⬡</div>
            <div className="text-white/30 text-sm mb-4">No active staking positions</div>
            <button onClick={() => router.push('/tokens')}
              className="px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#f59e0b', color: '#04040A' }}>
              Browse Tokens to Stake
            </button>
          </div>
        )}

        {/* Staking info */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="text-xs text-white/35 uppercase tracking-widest mb-3">How Staking Works</div>
          <div className="space-y-2.5 text-xs text-white/50">
            <div className="flex gap-2"><span style={{ color: '#f59e0b' }}>1.</span><span>Buy tokens on the <button onClick={() => router.push('/tokens')} className="underline" style={{ color: '#f59e0b' }}>Token Market</button></span></div>
            <div className="flex gap-2"><span style={{ color: '#f59e0b' }}>2.</span><span>Stake on the creator's profile to earn APY based on your tier</span></div>
            <div className="flex gap-2"><span style={{ color: '#f59e0b' }}>3.</span><span>Bronze (10+) = 8% · Silver (50+) = 14% · Gold (100+) = 22% · Diamond (500+) = 35%</span></div>
            <div className="flex gap-2"><span style={{ color: '#f59e0b' }}>4.</span><span>Claim rewards anytime — higher tiers unlock exclusive content and rooms</span></div>
          </div>
        </div>

        {/* CTA row */}
        <div className="flex gap-3">
          <button onClick={() => router.push('/tokens')}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: '#f59e0b', color: '#04040A' }}>
            Token Market ↗
          </button>
          <button onClick={() => router.push('/wallet')}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
            Wallet →
          </button>
        </div>
      </div>
    </div>
  )
}
