'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TIERS = [
  { id: 'bronze',  min: 10,  max: 24,  apy: 8,   color: '#b45309', label: 'Bronze',  icon: '🥉' },
  { id: 'silver',  min: 25,  max: 49,  apy: 14,  color: '#94a3b8', label: 'Silver',  icon: '🥈' },
  { id: 'gold',    min: 50,  max: 99,  apy: 22,  color: '#f59e0b', label: 'Gold',    icon: '🥇' },
  { id: 'diamond', min: 100, max: 999, apy: 35,  color: '#818cf8', label: 'Diamond', icon: '💎' },
]

const PROFILES: Record<string, { name: string; color: string; symbol: string; price: number; holders: number; totalStaked: number; yourStaked: number }> = {
  sovereign_v: { name: 'Sovereign V',   color: '#a855f7', symbol: 'SVRN', price: 8.75, holders: 284, totalStaked: 18200, yourStaked: 0    },
  mayafit:     { name: 'Maya Chen',      color: '#22c55e', symbol: 'MAYA', price: 5.20, holders: 142, totalStaked: 9400,  yourStaked: 25   },
  jaxbeats:    { name: 'Jax Beats',      color: '#ec4899', symbol: 'JAX',  price: 3.80, holders: 98,  totalStaked: 4100,  yourStaked: 0    },
}

function getTier(amount: number) {
  return TIERS.slice().reverse().find(t => amount >= t.min) ?? null
}

type Step = 'select' | 'confirm' | 'success'

export default function StakeProfilePage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? PROFILES.sovereign_v

  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<Step>('select')
  const [staking, setStaking] = useState(false)
  const [duration, setDuration] = useState<30 | 90 | 180 | 365>(90)

  const amountNum = parseFloat(amount) || 0
  const totalAfter = profile.yourStaked + amountNum
  const tier = getTier(totalAfter)
  const prevTier = getTier(profile.yourStaked)
  const tiersUp = tier && prevTier ? TIERS.indexOf(tier) > TIERS.indexOf(prevTier) : tier && !prevTier

  const dailyEarn = tier ? (amountNum * profile.price * (tier.apy / 100)) / 365 : 0
  const periodEarn = dailyEarn * duration

  const nextTier = TIERS.find(t => totalAfter < t.min)
  const toNext = nextTier ? nextTier.min - totalAfter : 0

  async function stake() {
    setStaking(true)
    await new Promise(r => setTimeout(r, 1500))
    setStaking(false)
    setStep('success')
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: `${profile.color}15`, border: `2px solid ${profile.color}30` }}>
            <span className="text-3xl">{tier?.icon ?? '✓'}</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white">Staked!</div>
            <div className="text-white/40 text-sm mt-1">{amountNum} ${profile.symbol} staked for {duration} days</div>
          </div>
          {tier && (
            <div className="p-4 rounded-2xl border space-y-2"
              style={{ background: `${tier.color}08`, borderColor: `${tier.color}20` }}>
              <div className="font-black text-lg" style={{ color: tier.color }}>{tier.icon} {tier.label} Tier</div>
              <div className="text-sm text-white/50">{tier.apy}% APY · est. +${periodEarn.toFixed(2)} in {duration}d</div>
            </div>
          )}
          <div className="space-y-2">
            <button onClick={() => router.push(`/profile/${handle}`)}
              className="w-full py-3.5 rounded-xl font-black"
              style={{ background: profile.color, color: '#04040A' }}>
              View Profile
            </button>
            <button onClick={() => router.push('/staking')}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              All Stakes
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
        <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
          style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('select')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="font-black text-white">Confirm Stake</div>
          </div>
        </header>
        <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
          <div className="p-4 rounded-2xl border border-white/6 space-y-3"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            {[
              { label: 'Profile',    value: profile.name },
              { label: 'Token',      value: `$${profile.symbol}` },
              { label: 'Amount',     value: `${amountNum} tokens` },
              { label: 'Value',      value: `$${(amountNum * profile.price).toFixed(2)}` },
              { label: 'Duration',   value: `${duration} days` },
              { label: 'Tier',       value: tier ? `${tier.icon} ${tier.label}` : '—', color: tier?.color },
              { label: 'APY',        value: tier ? `${tier.apy}%` : '—', color: '#22c55e' },
              { label: 'Est. Earn',  value: `+$${periodEarn.toFixed(2)}`, color: '#22c55e' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-white/35">{r.label}</span>
                <span className="font-bold" style={{ color: r.color ?? 'rgba(255,255,255,0.7)' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl border border-amber-500/20 text-xs text-amber-400/70"
            style={{ background: 'rgba(245,158,11,0.05)' }}>
            Tokens locked for {duration} days. Early unstaking forfeits accrued rewards.
          </div>
          <button onClick={stake} disabled={staking}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
            style={{ background: profile.color, color: '#04040A' }}>
            {staking ? 'Staking…' : `Stake ${amountNum} $${profile.symbol}`}
          </button>
        </div>
      </div>
    )
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
          <div className="font-black text-white flex-1">Stake ${profile.symbol}</div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: `${profile.color}20`, color: profile.color }}>
            {profile.name[0]}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Current position */}
        {profile.yourStaked > 0 && (
          <div className="p-3 rounded-2xl border border-white/5 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <span className="text-lg">{prevTier?.icon ?? ''}</span>
            <div className="flex-1">
              <div className="text-xs text-white/30">Current stake</div>
              <div className="font-bold text-white/70">{profile.yourStaked} ${profile.symbol}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/30">Tier</div>
              <div className="font-black text-sm" style={{ color: prevTier?.color ?? 'white' }}>{prevTier?.label ?? '—'}</div>
            </div>
          </div>
        )}

        {/* Amount input */}
        <div className="space-y-2">
          <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Amount to Stake</label>
          <div className="flex items-center gap-2 px-4 py-4 rounded-2xl border border-white/6"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="0"
              className="flex-1 text-2xl font-black text-white bg-transparent outline-none" />
            <span className="font-black text-sm" style={{ color: profile.color }}>${profile.symbol}</span>
          </div>
          <div className="flex gap-2">
            {[10, 25, 50, 100].map(n => (
              <button key={n} onClick={() => setAmount(String(n))}
                className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Lock Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {([30, 90, 180, 365] as const).map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className="py-2 rounded-xl text-xs font-black transition-all"
                style={duration === d ? { background: profile.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Tier preview */}
        {amountNum >= 10 && (
          <div className="p-4 rounded-2xl border space-y-2"
            style={{ background: `${tier?.color ?? '#fff'}08`, borderColor: `${tier?.color ?? '#fff'}15` }}>
            <div className="flex items-center justify-between">
              <span className="font-black text-lg">{tier?.icon} {tier?.label} Tier</span>
              <span className="font-black text-xl" style={{ color: '#22c55e' }}>{tier?.apy}% APY</span>
            </div>
            <div className="text-sm text-white/40">Est. +${periodEarn.toFixed(2)} over {duration} days</div>
            {tiersUp && <div className="text-xs font-bold" style={{ color: tier?.color }}>⬆ Tier upgrade!</div>}
            {toNext > 0 && (
              <div className="text-xs text-white/25">{toNext} more tokens → {nextTier?.label}</div>
            )}
          </div>
        )}

        {/* Tier table */}
        <div className="rounded-2xl border border-white/5 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="px-4 py-2 border-b border-white/5 flex text-xs text-white/25 font-semibold">
            <span className="flex-1">Tier</span>
            <span className="w-20 text-right">Tokens</span>
            <span className="w-16 text-right">APY</span>
          </div>
          {TIERS.map(t => (
            <div key={t.id} className="px-4 py-2.5 flex items-center border-b border-white/3 last:border-0 transition-all"
              style={totalAfter >= t.min ? { background: `${t.color}06` } : {}}>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-base">{t.icon}</span>
                <span className="text-sm font-bold" style={{ color: totalAfter >= t.min ? t.color : 'rgba(255,255,255,0.3)' }}>{t.label}</span>
              </div>
              <div className="w-20 text-right text-xs text-white/30">{t.min}+</div>
              <div className="w-16 text-right font-black text-sm" style={{ color: totalAfter >= t.min ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>{t.apy}%</div>
            </div>
          ))}
        </div>

        <button onClick={() => setStep('confirm')}
          disabled={amountNum < 10}
          className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
          style={{ background: profile.color, color: '#04040A' }}>
          {amountNum < 10 ? 'Min 10 tokens' : `Stake ${amountNum} $${profile.symbol} →`}
        </button>
      </div>
    </div>
  )
}
