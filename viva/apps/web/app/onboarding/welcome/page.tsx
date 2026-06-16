'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    id: 'intro',
    title: 'Welcome to VIVA',
    subtitle: 'Social meets finance',
    body: 'Every creator is a financial asset. Buy, stake, and trade creator tokens — or become a creator and turn your audience into investors.',
    emoji: '🌟',
    cta: 'Get Started',
  },
  {
    id: 'tokens',
    title: 'Creator Tokens',
    subtitle: 'Invest in people',
    body: 'Each creator has their own token. Buy tokens to access exclusive content, earn staking rewards, and profit when they grow.',
    emoji: '💎',
    cta: 'Next',
    bullets: ['Buy $SVRN, $MAYA, $JAX and more', 'Earn up to 35% APY staking', 'Token-gated content & events'],
  },
  {
    id: 'vscore',
    title: 'V-Score',
    subtitle: 'Your reputation on-chain',
    body: 'Your V-Score grows with every investment, post, and interaction. Higher scores unlock better deals, exclusive rooms, and creator partnerships.',
    emoji: '⚡',
    cta: 'Next',
    bullets: ['Starts at 0 — grows with activity', 'Unlocks premium features', 'Visible on your public profile'],
  },
  {
    id: 'role',
    title: 'Who are you?',
    subtitle: 'Personalize your experience',
    body: 'We\'ll tailor VIVA to match your goals.',
    emoji: '🎯',
    cta: 'Continue',
    roles: [
      { id: 'investor', emoji: '📈', label: 'Investor',   desc: 'I want to buy & stake creator tokens' },
      { id: 'creator',  emoji: '✨', label: 'Creator',    desc: 'I want to launch my own token' },
      { id: 'fan',      emoji: '❤️', label: 'Fan',        desc: 'I follow creators I love' },
      { id: 'trader',   emoji: '💹', label: 'Trader',     desc: 'I trade tokens for profit' },
    ],
  },
  {
    id: 'followcreators',
    title: 'Suggested Creators',
    subtitle: 'Start your portfolio',
    body: 'Follow and invest in creators that match your interests.',
    emoji: '👥',
    cta: 'Finish Setup →',
  },
]

const SUGGESTED = [
  { handle: 'sovereign_v', name: 'Sovereign V', color: '#a855f7', symbol: 'SVRN', price: 8.75, change: 4.2,  category: '📈 DeFi & Finance' },
  { handle: 'mayafit',     name: 'Maya Chen',   color: '#22c55e', symbol: 'MAYA', price: 5.20, change: -1.8, category: '💪 Health & Fitness' },
  { handle: 'jaxbeats',    name: 'Jax Beats',  color: '#ec4899', symbol: 'JAX',  price: 3.80, change: 7.1,  category: '🎵 Music & Arts' },
]

export default function OnboardingWelcomePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [followed, setFollowed] = useState<Record<string, boolean>>({})

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function next() {
    if (isLast) {
      router.push('/feed')
    } else {
      setStep(s => s + 1)
    }
  }

  const canContinue = current.id !== 'role' || selectedRole !== null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ink)' }}>
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: '#a855f7' }} />
      </div>

      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Skip */}
        {step < STEPS.length - 1 && (
          <div className="flex justify-end mb-6">
            <button onClick={() => router.push('/feed')} className="text-xs text-white/25 font-semibold">Skip</button>
          </div>
        )}

        {/* Emoji */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{current.emoji}</div>
          <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#a855f7' }}>{current.subtitle}</div>
          <div className="text-2xl font-black text-white">{current.title}</div>
        </div>

        {/* Body */}
        <div className="text-sm text-white/50 text-center leading-relaxed mb-6">{current.body}</div>

        {/* Bullets */}
        {current.bullets && (
          <div className="space-y-2 mb-6">
            {current.bullets.map(b => (
              <div key={b} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: '#a855f7', color: '#04040A' }}>✓</div>
                <span className="text-sm text-white/65">{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Role picker */}
        {current.roles && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {current.roles.map(role => (
              <button key={role.id} onClick={() => setSelectedRole(role.id)}
                className="p-3 rounded-2xl border text-left"
                style={{
                  borderColor: selectedRole === role.id ? '#a855f7' : 'rgba(255,255,255,0.07)',
                  background: selectedRole === role.id ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.018)',
                }}>
                <div className="text-xl mb-1">{role.emoji}</div>
                <div className="font-black text-sm text-white/80">{role.label}</div>
                <div className="text-xs text-white/30 mt-0.5">{role.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Suggested creators */}
        {current.id === 'followcreators' && (
          <div className="space-y-2 mb-6">
            {SUGGESTED.map(c => (
              <div key={c.handle} className="flex items-center gap-3 p-3 rounded-2xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0"
                  style={{ background: `${c.color}18`, color: c.color }}>
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white/80">{c.name}</div>
                  <div className="text-xs text-white/30">{c.category} · ${c.symbol}</div>
                </div>
                <button onClick={() => setFollowed(prev => ({ ...prev, [c.handle]: !prev[c.handle] }))}
                  className="px-3 py-1.5 rounded-full text-xs font-black flex-shrink-0"
                  style={followed[c.handle]
                    ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                    : { background: c.color, color: '#04040A' }}>
                  {followed[c.handle] ? '✓ Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto">
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 6, height: 6,
                  background: i === step ? '#a855f7' : i < step ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.1)',
                }} />
            ))}
          </div>

          <button onClick={next} disabled={!canContinue}
            className="w-full py-3.5 rounded-xl font-black text-base disabled:opacity-30"
            style={{ background: '#a855f7', color: '#04040A' }}>
            {current.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
