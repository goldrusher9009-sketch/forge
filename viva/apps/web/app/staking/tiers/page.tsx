'use client'
import { useRouter } from 'next/navigation'

interface Tier {
  name: string
  min: number
  max: number | null
  apy: number
  color: string
  emoji: string
  perks: string[]
}

const TIERS: Tier[] = [
  {
    name: 'Bronze', min: 10, max: 24, apy: 8, color: '#b45309', emoji: '🥉',
    perks: ['8% APY staking rewards', 'Bronze badge on profile', 'Access to Bronze rooms', 'Exclusive Bronze newsletter'],
  },
  {
    name: 'Silver', min: 25, max: 49, apy: 14, color: '#94a3b8', emoji: '🥈',
    perks: ['14% APY staking rewards', 'Silver badge on profile', 'Priority room access', '5% merch discount', 'Early content access'],
  },
  {
    name: 'Gold', min: 50, max: 99, apy: 22, color: '#f59e0b', emoji: '🥇',
    perks: ['22% APY staking rewards', 'Gold badge on profile', 'Token-gated content', '10% merch discount', 'Monthly creator call', 'Ad revenue share'],
  },
  {
    name: 'Diamond', min: 100, max: null, apy: 35, color: '#818cf8', emoji: '💎',
    perks: ['35% APY staking rewards', 'Diamond badge on profile', 'All Gold perks', '20% merch discount', 'Direct creator DMs', 'Governance voting rights', 'Airdrop priority'],
  },
]

// Simulated user stakes per creator
const MY_STAKES: Record<string, { held: number; symbol: string; color: string; creatorName: string }> = {
  SVRN: { held: 50, symbol: 'SVRN', color: '#a855f7', creatorName: 'Sovereign V' },
  MAYA: { held: 80, symbol: 'MAYA', color: '#22c55e', creatorName: 'Maya Chen'   },
  JAX:  { held: 0,  symbol: 'JAX',  color: '#ec4899', creatorName: 'Jax Beats'  },
}

function getTier(held: number): string {
  if (held >= 100) return 'Diamond'
  if (held >= 50)  return 'Gold'
  if (held >= 25)  return 'Silver'
  if (held >= 10)  return 'Bronze'
  return 'None'
}

function getNextTier(held: number): { name: string; need: number } | null {
  if (held >= 100) return null
  if (held >= 50)  return { name: 'Diamond', need: 100 - held }
  if (held >= 25)  return { name: 'Gold',    need: 50  - held }
  if (held >= 10)  return { name: 'Silver',  need: 25  - held }
  return { name: 'Bronze', need: 10 - held }
}

export default function StakingTiersPage() {
  const router = useRouter()

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
            <div className="font-black text-white">Staking Tiers</div>
            <div className="text-xs text-white/30">Lock tokens → earn rewards</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* My current stakes */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">My Staked Positions</div>
          <div className="space-y-2">
            {Object.values(MY_STAKES).map(s => {
              const tier = getTier(s.held)
              const next = getNextTier(s.held)
              const tierData = TIERS.find(t => t.name === tier)
              return (
                <button key={s.symbol} onClick={() => router.push(`/staking/${s.symbol.toLowerCase()}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-white/4 text-left"
                  style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm"
                      style={{ background: `${s.color}15`, color: s.color }}>
                      {s.symbol[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white/75">{s.creatorName}</div>
                      <div className="text-xs text-white/30">{s.held} ${s.symbol} staked</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {tier !== 'None' ? (
                      <div className="font-black text-xs" style={{ color: tierData?.color }}>
                        {tierData?.emoji} {tier}
                      </div>
                    ) : (
                      <div className="text-xs text-white/25">Not staking</div>
                    )}
                    {next && s.held > 0 && (
                      <div className="text-xs text-white/20">{next.need} more → {next.name}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tier cards */}
        <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">All Tiers</div>
        {TIERS.map(t => (
          <div key={t.name} className="p-4 rounded-2xl border overflow-hidden"
            style={{ background: `${t.color}06`, borderColor: `${t.color}18` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <div className="font-black text-base" style={{ color: t.color }}>{t.name}</div>
                  <div className="text-xs text-white/30">
                    {t.min}{t.max ? `–${t.max}` : '+'} tokens
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-2xl" style={{ color: t.color }}>{t.apy}%</div>
                <div className="text-xs text-white/25">APY</div>
              </div>
            </div>
            {/* Progress-like bar */}
            <div className="h-1 rounded-full mb-3" style={{ background: `${t.color}20` }}>
              <div className="h-full rounded-full" style={{ background: t.color, width: `${(t.apy / 35) * 100}%` }} />
            </div>
            <div className="space-y-1">
              {t.perks.map(p => (
                <div key={p} className="flex items-center gap-2 text-xs text-white/50">
                  <span style={{ color: t.color }}>✓</span>{p}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <button onClick={() => router.push('/staking')}
          className="w-full py-3 rounded-xl font-black text-sm"
          style={{ background: '#a855f7', color: '#04040A' }}>
          Start Staking →
        </button>
      </div>
    </div>
  )
}
