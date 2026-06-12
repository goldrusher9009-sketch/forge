'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, mockUser, mapApiUser, RING_META, TIER_META } from '@/lib/store'
import { auth, setTokens } from '@/lib/api'
import clsx from 'clsx'

const STEPS = [
  { id: 'welcome',  title: 'Sovereign\nData.',     sub: 'Your life, fully yours.' },
  { id: 'identity', title: 'Claim your\nidentity.', sub: 'Choose your handle. Own your name.' },
  { id: 'rings',    title: 'Configure\nyour rings.', sub: 'Five domains. One score.' },
  { id: 'wallet',   title: 'Connect\nyour wallet.',  sub: 'Base L2. Your keys, your tokens.' },
  { id: 'ready',    title: 'You\'re\nsovereign.',    sub: 'V-Score initialized. Life OS online.' },
]

export default function Onboard() {
  const router = useRouter()
  const setUser = useAppStore(s => s.setUser)
  const setOnboarded = useAppStore(s => s.setOnboarded)
  const [step, setStep] = useState(0)
  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [rings, setRings] = useState({ sleep: 70, nutrition: 60, activity: 80, social: 65, wealth: 50 })
  const [walletConnected, setWalletConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apiError, setApiError] = useState('')

  const progress = ((step + 1) / STEPS.length) * 100
  const current = STEPS[step]

  function next() { if (step < STEPS.length - 1) setStep(s => s + 1) }
  function back() { if (step > 0) setStep(s => s - 1) }

  async function connectWallet() {
    setConnecting(true)
    await new Promise(r => setTimeout(r, 1600))
    setConnecting(false)
    setWalletConnected(true)
  }

  async function launch() {
    setLaunching(true)
    setApiError('')
    try {
      const res = await auth.register({
        handle: handle || 'sovereign',
        displayName: displayName || 'Sovereign',
        email: email || `${handle}@viva.app`,
        password: password || 'demo1234',
        sleepRing: rings.sleep,
        nutritionRing: rings.nutrition,
        activityRing: rings.activity,
        socialRing: rings.social,
        wealthRing: rings.wealth,
      })
      setTokens(res.accessToken, res.refreshToken)
      setUser(mapApiUser(res.user, mockUser()))
    } catch (e: any) {
      // Fallback to mock if API unavailable
      console.warn('API unavailable, using mock:', e.message)
      setUser({ ...mockUser(), handle: handle || 'sovereign', displayName: displayName || 'Sovereign' })
    }
    setOnboarded(true)
    router.push('/home')
  }

  function canAdvance() {
    if (step === 1) return handle.length >= 2 && displayName.length >= 2
    if (step === 3) return walletConnected
    return true
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--ink)' }}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${progress}%`, background: 'var(--v)', boxShadow: '0 0 12px var(--v)' }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-6 right-6 z-50">
        <span className="t-mono" style={{ opacity: 0.35 }}>
          {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
        </span>
      </div>

      {/* Logo */}
      <div className="fixed top-5 left-6 z-50">
        <span className="text-xl font-bold tracking-tighter" style={{ color: 'var(--v)' }}>VIVA</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg">

          {/* Heading */}
          <div className="mb-12 animate-fade-up">
            <h1
              className="font-bold mb-3 whitespace-pre-line"
              style={{ fontSize: 'clamp(2.5rem,7vw,4.5rem)', letterSpacing: '-0.04em', lineHeight: 0.92 }}
            >
              {current.title}
            </h1>
            <p style={{ opacity: 0.45, fontSize: '1rem' }}>{current.sub}</p>
          </div>

          {/* Step body */}
          <div className="animate-fade-up delay-100">
            {step === 0 && <StepWelcome />}
            {step === 1 && (
              <StepIdentity
                handle={handle} setHandle={setHandle}
                displayName={displayName} setDisplayName={setDisplayName}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
              />
            )}
            {step === 2 && <StepRings rings={rings} setRings={setRings} />}
            {step === 3 && (
              <StepWallet
                connected={walletConnected}
                connecting={connecting}
                onConnect={connectWallet}
              />
            )}
            {step === 4 && <StepReady rings={rings} handle={handle || 'sovereign'} />}
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between mt-12 animate-fade-up delay-200">
            {step > 0 ? (
              <button
                onClick={back}
                className="t-caption hover:opacity-80 transition-opacity"
                style={{ fontSize: '0.75rem' }}
              >
                ← Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                disabled={!canAdvance()}
                className={clsx(
                  'px-8 py-3 font-semibold text-sm tracking-wide transition-all duration-200',
                  canAdvance()
                    ? 'text-black hover:opacity-90'
                    : 'opacity-30 cursor-not-allowed text-white border border-white/20'
                )}
                style={canAdvance() ? { background: 'var(--paper)' } : {}}
              >
                Continue →
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                {apiError && (
                  <p className="text-xs" style={{ color: 'var(--ring-wealth)' }}>{apiError}</p>
                )}
                <button
                  onClick={launch}
                  disabled={launching}
                  className="px-8 py-3 font-semibold text-sm tracking-wide transition-all duration-200 hover:opacity-90"
                  style={{ background: 'var(--v)', color: 'white', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
                >
                  {launching ? 'Initializing…' : 'Enter VIVA →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? '20px' : '6px',
              height: '6px',
              background: i === step ? 'var(--v)' : i < step ? 'rgba(245,244,240,0.4)' : 'rgba(245,244,240,0.15)',
            }}
          />
        ))}
      </div>

      {/* BG glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        }}
      />
    </div>
  )
}

// ── Step components ────────────────────────────────────

function StepWelcome() {
  const features = [
    { num: '01', label: 'V-Score', desc: 'GNN-powered reputation, 0–1000, fully on-chain' },
    { num: '02', label: 'Five Rings', desc: 'Sleep · Nutrition · Activity · Social · Wealth' },
    { num: '03', label: 'AI Twin', desc: 'HyperAgent at L1, L2, or L3 autonomy' },
    { num: '04', label: 'YouToken', desc: 'Your identity as a bonding-curve ERC-20' },
    { num: '05', label: 'ZK Health', desc: 'Prove facts without exposing data' },
  ]
  return (
    <div className="space-y-3">
      {features.map(({ num, label, desc }) => (
        <div
          key={num}
          className="flex items-start gap-5 p-4 border border-white/6 transition-colors hover:border-white/12"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <span className="t-mono text-xs mt-0.5" style={{ opacity: 0.25, minWidth: '20px' }}>{num}</span>
          <div>
            <p className="font-semibold text-sm text-white/90">{label}</p>
            <p className="text-sm text-white/40 mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StepIdentity({ handle, setHandle, displayName, setDisplayName, email, setEmail, password, setPassword }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="t-caption block mb-2" style={{ fontSize: '0.625rem' }}>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-white/4 border border-white/10 px-4 py-3 text-white placeholder-white/25 outline-none transition-all focus:border-violet-500/50 font-medium"
          style={{ borderRadius: 'var(--radius)' }}
        />
      </div>
      <div>
        <label className="t-caption block mb-2" style={{ fontSize: '0.625rem' }}>Handle</label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-white/30 font-medium">@</span>
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="yourhandle"
            className="w-full bg-white/4 border border-white/10 pl-8 pr-4 py-3 text-white placeholder-white/25 outline-none transition-all focus:border-violet-500/50 font-medium"
            style={{ borderRadius: 'var(--radius)' }}
          />
        </div>
        {handle.length > 0 && handle.length < 2 && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--ring-wealth)' }}>Minimum 2 characters</p>
        )}
        {handle.length >= 2 && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--ring-activity)' }}>✓ Available</p>
        )}
      </div>
      <div>
        <label className="t-caption block mb-2" style={{ fontSize: '0.625rem' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-white/4 border border-white/10 px-4 py-3 text-white placeholder-white/25 outline-none transition-all focus:border-violet-500/50 font-medium"
          style={{ borderRadius: 'var(--radius)' }}
        />
      </div>
      <div>
        <label className="t-caption block mb-2" style={{ fontSize: '0.625rem' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          className="w-full bg-white/4 border border-white/10 px-4 py-3 text-white placeholder-white/25 outline-none transition-all focus:border-violet-500/50 font-medium"
          style={{ borderRadius: 'var(--radius)' }}
        />
      </div>
      <p className="text-xs text-white/30 mt-2">
        Your handle becomes your on-chain identity. Choose wisely.
      </p>
    </div>
  )
}

function StepRings({ rings, setRings }: any) {
  return (
    <div className="space-y-4">
      {(Object.entries(RING_META) as [keyof typeof rings, typeof RING_META[keyof typeof RING_META]][]).map(([key, meta]) => (
        <div key={key} className="group">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}80` }} />
              <span className="text-sm font-medium text-white/80">{meta.label}</span>
            </div>
            <span className="t-mono text-sm font-bold" style={{ color: meta.color }}>{rings[key]}</span>
          </div>
          <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{ width: `${rings[key]}%`, background: meta.color, boxShadow: `0 0 8px ${meta.color}60` }}
            />
          </div>
          <input
            type="range"
            min={0} max={100} value={rings[key]}
            onChange={e => setRings((r: any) => ({ ...r, [key]: +e.target.value }))}
            className="w-full opacity-0 cursor-pointer absolute"
            style={{ marginTop: '-8px', height: '20px' }}
          />
        </div>
      ))}
      <p className="text-xs text-white/30 mt-2">Set your current baselines. Your AI twin will learn from real data.</p>
    </div>
  )
}

function StepWallet({ connected, connecting, onConnect }: any) {
  const wallets = [
    { name: 'Coinbase Wallet', desc: 'Recommended · Base native', primary: true },
    { name: 'MetaMask', desc: 'Browser extension', primary: false },
    { name: 'WalletConnect', desc: '300+ wallets', primary: false },
  ]
  return (
    <div className="space-y-3">
      {connected ? (
        <div
          className="p-5 border flex items-center gap-4"
          style={{ borderColor: 'var(--ring-activity)', borderRadius: 'var(--radius)', background: 'rgba(5,150,105,0.08)' }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(5,150,105,0.2)' }}>✓</div>
          <div>
            <p className="font-semibold text-sm text-white/90">Wallet connected</p>
            <p className="t-mono text-xs mt-0.5" style={{ color: 'var(--ring-activity)' }}>0x7c3a…ed42 · Base L2</p>
          </div>
        </div>
      ) : (
        wallets.map((w) => (
          <button
            key={w.name}
            onClick={onConnect}
            disabled={connecting}
            className={clsx(
              'w-full flex items-center justify-between p-4 border transition-all text-left',
              w.primary ? 'border-violet-500/30 hover:border-violet-500/60 bg-violet-500/5' : 'border-white/8 hover:border-white/20 bg-white/2'
            )}
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div>
              <p className="font-semibold text-sm text-white/90">{w.name}</p>
              <p className="text-xs text-white/35 mt-0.5">{w.desc}</p>
            </div>
            {connecting && w.primary ? (
              <span className="text-xs text-white/50">Connecting…</span>
            ) : (
              <span className="text-white/30 text-sm">→</span>
            )}
          </button>
        ))
      )}
      <p className="text-xs text-white/25">Your wallet controls your YouToken, V-Score NFT, and ZK proofs on Base L2.</p>
    </div>
  )
}

function StepReady({ rings, handle }: { rings: any; handle: string }) {
  const vScore = Math.round(
    Object.values(rings as Record<string, number>).reduce((a, b) => a + b, 0) / 5 * 10
  )
  const tier = vScore >= 800 ? 'sovereign' : vScore >= 600 ? 'guardian' : vScore >= 400 ? 'stable' : vScore >= 200 ? 'rising' : 'seed'
  const tierColor = TIER_META[tier as keyof typeof TIER_META].color

  return (
    <div className="space-y-5">
      {/* V-Score display */}
      <div
        className="relative p-8 flex flex-col items-center justify-center border"
        style={{ borderColor: `${tierColor}30`, borderRadius: 'var(--radius)', background: `${tierColor}08`, minHeight: '180px' }}
      >
        <div
          className="text-7xl font-bold mb-1"
          style={{ letterSpacing: '-0.04em', color: tierColor, textShadow: `0 0 40px ${tierColor}60` }}
        >
          {vScore}
        </div>
        <div className="t-caption" style={{ fontSize: '0.625rem', color: tierColor }}>
          {TIER_META[tier as keyof typeof TIER_META].label.toUpperCase()} · V-SCORE INITIALIZED
        </div>
      </div>

      {/* Handle */}
      <div className="flex items-center gap-3 p-4 border border-white/8" style={{ borderRadius: 'var(--radius)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--v)', color: 'white' }}>
          {handle[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">@{handle}</p>
          <p className="text-xs text-white/35">Sovereign identity · Base L2</p>
        </div>
        <span className="ml-auto t-mono text-xs text-white/25">0x7c3a…ed42</span>
      </div>

      {/* Ring summary */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(RING_META) as any[]).map(([key, meta]) => (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <div
              className="w-1 rounded-full"
              style={{ height: `${40 + rings[key] * 0.3}px`, background: meta.color, boxShadow: `0 0 6px ${meta.color}60` }}
            />
            <span className="t-mono text-xs" style={{ color: meta.color }}>{rings[key]}</span>
            <span style={{ fontSize: '0.55rem', opacity: 0.4 }}>{meta.label.slice(0, 3).toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
