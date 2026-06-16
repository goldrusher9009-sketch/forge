'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = [
  { id: 'creator',  emoji: '🎙', title: 'Creator',  desc: 'Launch your token, monetize your audience, earn from content' },
  { id: 'investor', emoji: '📈', title: 'Investor', desc: 'Invest in creators you believe in, stake tokens, earn rewards' },
  { id: 'fan',      emoji: '❤️', title: 'Fan',      desc: 'Support your favorites, unlock exclusive content, join communities' },
]

const INTERESTS = [
  'Finance', 'Health', 'Tech', 'Art', 'Gaming', 'Music', 'Fitness', 'Crypto', 'Lifestyle', 'Sports', 'Fashion', 'Food',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole]             = useState('')
  const [handle, setHandle]         = useState('')
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [checkingHandle, setCheckingHandle]   = useState(false)
  const [interests, setInterests]   = useState<Set<string>>(new Set())
  const [walletConnected, setWalletConnected] = useState(false)
  const [fundAmt, setFundAmt]       = useState('50')
  const [completing, setCompleting] = useState(false)

  async function checkHandle(h: string) {
    if (h.length < 3) return
    setCheckingHandle(true)
    await new Promise(r => setTimeout(r, 500))
    setHandleAvailable(!['sovereign_v', 'mayafit', 'luna_apex', 'zeronode'].includes(h))
    setCheckingHandle(false)
  }

  function toggleInterest(i: string) {
    setInterests(prev => {
      const n = new Set(prev)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  }

  async function connectWallet() {
    await new Promise(r => setTimeout(r, 800))
    setWalletConnected(true)
  }

  async function finish() {
    setCompleting(true)
    await new Promise(r => setTimeout(r, 1200))
    router.push('/home')
  }

  const TOTAL_STEPS = 5

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ink)' }}>
      {/* Progress */}
      <div className="px-6 pt-8 pb-0">
        <div className="flex gap-1 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: step > i ? '#a855f7' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12 max-w-md mx-auto w-full">

        {/* Step 1 — Role */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="text-4xl mb-3">👋</div>
              <h1 className="text-2xl font-black text-white mb-1">Welcome to VIVA</h1>
              <p className="text-white/40 text-sm">How do you want to start?</p>
            </div>
            <div className="space-y-3">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all"
                  style={role === r.id
                    ? { background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.4)' }
                    : { background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <div className="font-black text-white">{r.title}</div>
                    <div className="text-xs text-white/40 mt-0.5">{r.desc}</div>
                  </div>
                  {role === r.id && <span className="ml-auto" style={{ color: '#a855f7' }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!role}
              className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Handle */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="text-4xl mb-3">🪪</div>
              <h1 className="text-2xl font-black text-white mb-1">Claim your handle</h1>
              <p className="text-white/40 text-sm">Your handle is your identity — and your brand.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="text-white/40">@</span>
                <input value={handle}
                  onChange={e => { setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setHandleAvailable(null) }}
                  onBlur={() => checkHandle(handle)}
                  placeholder="your_handle"
                  className="flex-1 text-lg font-black text-white placeholder-white/20 bg-transparent outline-none" />
                {checkingHandle && <span className="text-white/30 text-sm">…</span>}
                {handleAvailable === true && <span className="text-green-400 text-sm font-bold">✓</span>}
                {handleAvailable === false && <span className="text-red-400 text-sm font-bold">✕</span>}
              </div>
              {handleAvailable === false && (
                <p className="text-xs text-red-400 mt-1.5 ml-1">Handle taken. Try another.</p>
              )}
              {handleAvailable === true && (
                <p className="text-xs text-green-400 mt-1.5 ml-1">Available!</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>← Back</button>
                <button onClick={() => setStep(3)} disabled={handle.length < 3 || handleAvailable === false}
                  className="flex-1 py-3.5 rounded-xl font-black text-sm disabled:opacity-30"
                  style={{ background: '#a855f7', color: '#04040A' }}>
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Interests */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="text-4xl mb-3">🎯</div>
              <h1 className="text-2xl font-black text-white mb-1">What are you into?</h1>
              <p className="text-white/40 text-sm">We'll personalize your feed and token recommendations.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button key={i} onClick={() => toggleInterest(i)}
                  className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                  style={interests.has(i)
                    ? { background: '#a855f7', color: '#04040A' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                  {i}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>← Back</button>
              <button onClick={() => setStep(4)} disabled={interests.size < 2}
                className="flex-1 py-3.5 rounded-xl font-black text-sm disabled:opacity-30"
                style={{ background: '#a855f7', color: '#04040A' }}>
                Continue ({interests.size}/3+) →
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Wallet */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="text-4xl mb-3">🔑</div>
              <h1 className="text-2xl font-black text-white mb-1">Connect your wallet</h1>
              <p className="text-white/40 text-sm">Required to hold tokens, stake, and earn rewards.</p>
            </div>
            {!walletConnected ? (
              <div className="space-y-3">
                {['MetaMask', 'WalletConnect', 'Coinbase Wallet'].map(w => (
                  <button key={w} onClick={connectWallet}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:border-white/20"
                    style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">🦊</div>
                    <span className="font-bold text-white/80">{w}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl border text-center space-y-1"
                style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)' }}>
                <div className="text-green-400 text-xl">✓</div>
                <div className="font-bold text-white">Wallet Connected</div>
                <div className="text-xs text-white/30 font-mono">0x4f2a…b8d3</div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>← Back</button>
              <button onClick={() => setStep(5)}
                className="flex-1 py-3.5 rounded-xl font-black text-sm"
                style={{ background: '#a855f7', color: '#04040A' }}>
                {walletConnected ? 'Continue →' : 'Skip for now →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Fund */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <div className="text-4xl mb-3">💰</div>
              <h1 className="text-2xl font-black text-white mb-1">Add starting funds</h1>
              <p className="text-white/40 text-sm">Start buying creator tokens immediately. Skip anytime.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['25', '50', '100', '250', '500', '1000'].map(a => (
                <button key={a} onClick={() => setFundAmt(a)}
                  className="py-3 rounded-xl font-black text-sm transition-all"
                  style={fundAmt === a
                    ? { background: '#a855f7', color: '#04040A' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                  ${a}
                </button>
              ))}
            </div>
            <div className="p-4 rounded-2xl border border-white/6 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30">With ${fundAmt} USDC you could:</div>
              <div className="text-sm text-white/60">• Bronze stake in {Math.floor(parseInt(fundAmt) / 12)} creators at current avg price</div>
              <div className="text-sm text-white/60">• Earn ~{(parseInt(fundAmt) * 0.08 / 12).toFixed(2)} USDC/month at Bronze APY (8%)</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(4)}
                className="py-3.5 px-5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>← Back</button>
              <button onClick={finish} disabled={completing}
                className="flex-1 py-3.5 rounded-xl font-black text-sm disabled:opacity-40"
                style={{ background: '#22c55e', color: '#04040A' }}>
                {completing ? 'Setting up…' : `🚀 Start with $${fundAmt}`}
              </button>
            </div>
            <button onClick={finish} className="w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors">
              Skip — I'll fund later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
