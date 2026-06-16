'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PROFILES: Record<string, { name: string; color: string; handle: string; totalTips: number; topTippers: string[] }> = {
  sovereign_v: { name: 'Sovereign V', color: '#a855f7', handle: 'sovereign_v', totalTips: 18420, topTippers: ['noa_d','atlas_k','luna_w'] },
  mayafit:     { name: 'Maya Chen',   color: '#22c55e', handle: 'mayafit',     totalTips: 9840,  topTippers: ['kai_r','marco_v','jade_l']  },
  jaxbeats:    { name: 'Jax Beats',   color: '#ec4899', handle: 'jaxbeats',    totalTips: 6320,  topTippers: ['dex_n','lily_p','sam_q']    },
}

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000]
const PRESET_MESSAGES = [
  '🔥 Incredible content!',
  '💎 Keep it up, legend.',
  '🚀 This changed my trading game.',
  '🙏 Thanks for everything you share.',
  '💯 Best creator on VIVA.',
]

export default function TipsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? PROFILES.sovereign_v

  const [amount, setAmount] = useState<number | ''>('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input')
  const [sending, setSending] = useState(false)

  const amountNum = Number(amount) || 0

  async function sendTip() {
    setSending(true)
    await new Promise(r => setTimeout(r, 1400))
    setSending(false)
    setStep('success')
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-6xl">💸</div>
          <div>
            <div className="text-3xl font-black text-white">Tip Sent!</div>
            <div className="text-white/40 text-sm mt-2">
              You sent <strong style={{ color: profile.color }}>{amountNum} $VIVA</strong> to @{handle}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 space-y-2 text-left"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/35">Amount</span>
              <span className="font-black" style={{ color: profile.color }}>{amountNum} $VIVA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/35">To</span>
              <span className="text-white/70">@{handle}</span>
            </div>
            {message && (
              <div className="flex justify-between text-sm">
                <span className="text-white/35">Message</span>
                <span className="text-white/50 truncate max-w-[160px]">{message}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/35">Sender</span>
              <span className="text-white/50">{anonymous ? 'Anonymous' : 'You'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/profile/${handle}`)}
              className="flex-1 py-3 rounded-xl font-black text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              View Profile
            </button>
            <button onClick={() => { setStep('input'); setAmount('') }}
              className="flex-1 py-3 rounded-xl font-black text-sm"
              style={{ background: profile.color, color: '#04040A' }}>
              Send Another
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
            <button onClick={() => setStep('input')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="font-black text-white">Confirm Tip</div>
          </div>
        </header>
        <div className="max-w-sm mx-auto px-4 py-8 space-y-5">
          <div className="text-center">
            <div className="text-5xl font-black" style={{ color: profile.color }}>{amountNum}</div>
            <div className="text-white/40 text-sm">$VIVA to @{handle}</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 space-y-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
            {[
              { label: 'Recipient',  value: `@${handle}` },
              { label: 'Amount',     value: `${amountNum} $VIVA`, color: profile.color },
              { label: 'Message',    value: message || '—' },
              { label: 'From',       value: anonymous ? '🎭 Anonymous' : '👤 You' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-white/35">{r.label}</span>
                <span className="font-semibold truncate max-w-[180px]" style={{ color: r.color ?? 'rgba(255,255,255,0.65)' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <button onClick={sendTip} disabled={sending}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
            style={{ background: profile.color, color: '#04040A' }}>
            {sending ? 'Sending…' : `Send ${amountNum} $VIVA`}
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
          <div>
            <div className="font-black text-white">Send a Tip</div>
            <div className="text-xs text-white/30">to @{handle}</div>
          </div>
        </div>
      </header>

      <div className="max-w-sm mx-auto px-4 py-5 space-y-6">
        {/* Creator card */}
        <div className="p-4 rounded-2xl border border-white/5 flex items-center gap-3"
          style={{ background: `${profile.color}08`, borderColor: `${profile.color}15` }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg"
            style={{ background: `${profile.color}20`, color: profile.color }}>
            {profile.name[0]}
          </div>
          <div>
            <div className="font-black text-white">{profile.name}</div>
            <div className="text-xs text-white/35">@{handle} · {profile.totalTips.toLocaleString()} $VIVA received</div>
          </div>
        </div>

        {/* Amount presets */}
        <div className="space-y-3">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Amount ($VIVA)</div>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map(a => (
              <button key={a} onClick={() => setAmount(a)}
                className="py-3 rounded-xl font-black text-sm"
                style={amount === a
                  ? { background: profile.color, color: '#04040A' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/6 bg-white/5">
            <span className="text-white/30 text-sm">Custom</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="Enter amount…"
              className="flex-1 text-white bg-transparent outline-none text-sm" />
            <span className="text-xs text-white/25">$VIVA</span>
          </div>
        </div>

        {/* Quick messages */}
        <div className="space-y-3">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Message (optional)</div>
          <div className="flex flex-col gap-2">
            {PRESET_MESSAGES.map(m => (
              <button key={m} onClick={() => setMessage(m)}
                className="px-3 py-2 rounded-xl text-xs text-left"
                style={message === m
                  ? { background: `${profile.color}12`, color: profile.color, border: `1px solid ${profile.color}20` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }}>
                {m}
              </button>
            ))}
          </div>
          <input value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Or write your own…"
            className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
        </div>

        {/* Anonymous toggle */}
        <button onClick={() => setAnonymous(a => !a)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/5"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <span className="text-sm text-white/60">Send anonymously</span>
          <div className="w-10 h-5 rounded-full flex items-center transition-all px-0.5"
            style={{ background: anonymous ? profile.color : 'rgba(255,255,255,0.1)' }}>
            <div className="w-4 h-4 rounded-full bg-white transition-all"
              style={{ marginLeft: anonymous ? '20px' : '0px' }} />
          </div>
        </button>

        <button onClick={() => setStep('confirm')} disabled={!amountNum || amountNum <= 0}
          className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
          style={{ background: profile.color, color: '#04040A' }}>
          {amountNum ? `Send ${amountNum} $VIVA Tip` : 'Enter an amount'}
        </button>
      </div>
    </div>
  )
}
