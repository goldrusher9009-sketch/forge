'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RECENT_RECIPIENTS = [
  { handle: 'mayafit',    name: 'Maya Chen',  color: '#22c55e' },
  { handle: 'jaxbeats',   name: 'Jax Beats',  color: '#ec4899' },
  { handle: 'noa_d',      name: 'Noa D.',     color: '#a855f7' },
  { handle: 'crypto_kat', name: 'Kat Zhou',   color: '#818cf8' },
]

const WALLET_BALANCE = 2482.55
const FEE = 0.50
const MIN_SEND = 1

type Step = 'input' | 'confirm' | 'success'

export default function WalletSendPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [sending, setSending] = useState(false)
  const [resolvedName, setResolvedName] = useState('')

  const amountNum = parseFloat(amount) || 0
  const total = amountNum + FEE
  const canSend = recipient.trim().length > 0 && amountNum >= MIN_SEND && total <= WALLET_BALANCE

  function selectRecent(r: typeof RECENT_RECIPIENTS[0]) {
    setRecipient(r.handle)
    setResolvedName(r.name)
  }

  function handleRecipientChange(val: string) {
    setRecipient(val)
    // Auto-resolve known handles
    const match = RECENT_RECIPIENTS.find(r => r.handle === val.replace('@', '').toLowerCase())
    setResolvedName(match?.name ?? '')
  }

  async function send() {
    setSending(true)
    await new Promise(r => setTimeout(r, 1600))
    setSending(false)
    setStep('success')
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.25)' }}>
            <span className="text-3xl">✅</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white mb-1">Sent!</div>
            <div className="text-white/40 text-sm">${amountNum.toFixed(2)} USDC sent to @{recipient.replace('@','')}</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 space-y-2 text-left"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="To"      value={`@${recipient.replace('@','')}${resolvedName ? ` · ${resolvedName}` : ''}`} />
            <Row label="Amount"  value={`$${amountNum.toFixed(2)} USDC`} />
            <Row label="Fee"     value={`$${FEE.toFixed(2)}`} />
            <Row label="Total"   value={`$${total.toFixed(2)}`} />
            {memo && <Row label="Memo" value={memo} />}
            <Row label="Status"  value="Confirmed" valueColor="#22c55e" />
          </div>
          <div className="space-y-2">
            <button onClick={() => { setStep('input'); setAmount(''); setRecipient(''); setMemo(''); setResolvedName('') }}
              className="w-full py-3.5 rounded-xl font-black"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Send Again
            </button>
            <button onClick={() => router.push('/wallet')}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              Back to Wallet
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
            <button onClick={() => setStep('input')}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="font-black text-white flex-1">Confirm Send</div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
          {/* Big amount */}
          <div className="text-center py-8">
            <div className="text-5xl font-black text-white mb-1">${amountNum.toFixed(2)}</div>
            <div className="text-white/30 text-sm">USDC</div>
          </div>

          <div className="p-4 rounded-2xl border border-white/6 space-y-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="To"     value={`@${recipient.replace('@','')}${resolvedName ? ` · ${resolvedName}` : ''}`} />
            <Row label="Amount" value={`$${amountNum.toFixed(2)} USDC`} />
            <div className="h-px bg-white/5" />
            <Row label="Network fee" value={`$${FEE.toFixed(2)}`} valueColor="rgba(255,255,255,0.3)" />
            <Row label="Total deducted" value={`$${total.toFixed(2)}`} />
            {memo && <Row label="Memo" value={memo} />}
          </div>

          <div className="p-3 rounded-xl text-xs text-white/30 border border-white/5"
            style={{ background: 'rgba(245,158,11,0.03)' }}>
            ⚠️ Crypto sends are irreversible. Double-check the recipient before confirming.
          </div>

          <button onClick={send} disabled={sending}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
            style={{ background: '#22c55e', color: '#04040A' }}>
            {sending ? 'Sending…' : 'Confirm & Send'}
          </button>
          <button onClick={() => setStep('input')}
            className="w-full py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Input step
  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white flex-1">Send USDC</div>
          <span className="text-xs text-white/30">Balance: <span className="text-white/60 font-bold">${WALLET_BALANCE.toLocaleString()}</span></span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Recipient */}
        <div className="space-y-2">
          <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">To</label>
          <div className="flex items-center gap-2 px-4 py-3.5 rounded-xl border border-white/6 bg-white/5">
            <span className="text-white/30">@</span>
            <input
              value={recipient}
              onChange={e => handleRecipientChange(e.target.value)}
              placeholder="handle or 0x address"
              className="flex-1 text-white bg-transparent outline-none text-sm" />
            {resolvedName && (
              <span className="text-xs text-white/40 flex-shrink-0">{resolvedName}</span>
            )}
          </div>

          {/* Recent */}
          {!recipient && (
            <div>
              <div className="text-xs text-white/20 mb-2">Recent</div>
              <div className="flex gap-2 flex-wrap">
                {RECENT_RECIPIENTS.map(r => (
                  <button key={r.handle} onClick={() => selectRecent(r)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/5"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black"
                      style={{ background: `${r.color}20`, color: r.color }}>
                      {r.name[0]}
                    </div>
                    <span className="text-xs text-white/45">@{r.handle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">$</span>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              className="w-full pl-8 pr-20 py-4 rounded-xl text-xl font-black bg-white/5 border border-white/6 text-white placeholder-white/15 outline-none" />
            <button onClick={() => setAmount(String((WALLET_BALANCE - FEE).toFixed(2)))}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-black"
              style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
              MAX
            </button>
          </div>
          <div className="flex justify-between text-xs text-white/25 px-1">
            <span>Min $1.00</span>
            <span>Fee $0.50 · Total ${total > 0 ? total.toFixed(2) : '—'}</span>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {[10, 25, 50, 100].map(n => (
            <button key={n} onClick={() => setAmount(String(n))}
              className="flex-1 py-2 rounded-xl text-sm font-black transition-all"
              style={{ background: amountNum === n ? '#a855f7' : 'rgba(255,255,255,0.05)', color: amountNum === n ? '#04040A' : 'rgba(255,255,255,0.4)' }}>
              ${n}
            </button>
          ))}
        </div>

        {/* Memo */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Memo (optional)</label>
          <input value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="What's this for?"
            maxLength={80}
            className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
        </div>

        {amountNum > 0 && total > WALLET_BALANCE && (
          <div className="text-xs text-center py-2" style={{ color: '#f87171' }}>
            Insufficient balance. Max you can send: ${(WALLET_BALANCE - FEE).toFixed(2)}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.88)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setStep('confirm')} disabled={!canSend}
          className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
          style={{ background: '#22c55e', color: '#04040A' }}>
          Review Send →
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/35">{label}</span>
      <span className="font-semibold" style={{ color: valueColor ?? 'rgba(255,255,255,0.7)' }}>{value}</span>
    </div>
  )
}
