'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BALANCE = 842.50
const METHODS = [
  { id: 'bank',   label: 'Bank Account (ACH)',  icon: '🏦', desc: '1–3 business days. No fee.',        fee: 0,     min: 10  },
  { id: 'usdc',   label: 'USDC to Wallet',       icon: '🔵', desc: 'Instant. Network fee ~$0.50.',      fee: 0.50,  min: 5   },
  { id: 'paypal', label: 'PayPal',               icon: '🅿️', desc: 'Instant. 1% fee (max $10).',       fee: null,  min: 1   },
]

const BANK_ACCOUNTS = [
  { id: 'ba1', label: 'Chase Checking ···· 8821', verified: true  },
  { id: 'ba2', label: 'Wells Fargo ···· 2294',    verified: false },
]

const QUICK_AMOUNTS = [25, 50, 100, 250, 500]

export default function WithdrawPage() {
  const router = useRouter()
  const [method, setMethod] = useState('bank')
  const [amount, setAmount] = useState('100')
  const [step, setStep] = useState<'pick' | 'confirm' | 'done'>('pick')
  const [processing, setProcessing] = useState(false)
  const [bankAcct, setBankAcct] = useState('ba1')

  const amtNum = parseFloat(amount) || 0
  const sel = METHODS.find(m => m.id === method)!
  const fee = sel.fee === null ? Math.min(amtNum * 0.01, 10) : sel.fee
  const youGet = Math.max(0, amtNum - fee)
  const canContinue = amtNum >= sel.min && amtNum <= BALANCE

  async function confirm() {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1300))
    setProcessing(false)
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)' }}>
            <span className="text-3xl">✓</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white mb-1">${youGet.toFixed(2)} sent</div>
            <div className="text-white/40">
              {method === 'usdc' ? 'Sent to your wallet instantly.' : method === 'paypal' ? 'Sent to PayPal instantly.' : 'Bank transfer initiated. Arrives in 1–3 business days.'}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 text-left space-y-2"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="Withdrawn" value={`$${amtNum.toFixed(2)}`} />
            <Row label="Fee" value={fee > 0 ? `$${fee.toFixed(2)}` : 'Free'} />
            <Row label="You received" value={`$${youGet.toFixed(2)}`} bold />
            <Row label="New balance" value={`$${(BALANCE - amtNum).toFixed(2)}`} />
          </div>
          <button onClick={() => router.push('/wallet')}
            className="w-full py-3.5 rounded-xl font-black"
            style={{ background: '#a855f7', color: '#04040A' }}>
            Back to Wallet
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
          <button onClick={() => step === 'confirm' ? setStep('pick') : router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-bold text-white">Withdraw Funds</div>
        </div>
        <div className="flex gap-1 mt-3">
          {['pick', 'confirm'].map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: step === 'confirm' ? '#a855f7' : i === 0 ? '#a855f7' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {step === 'pick' && (
          <>
            {/* Balance */}
            <div className="p-4 rounded-2xl border border-white/6 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 mb-1">Available Balance</div>
              <div className="text-3xl font-black" style={{ color: '#22c55e' }}>${BALANCE.toFixed(2)}</div>
              <div className="text-xs text-white/25">USDC</div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="text-xs text-white/30 uppercase tracking-widest">Amount</div>
              <div className="flex items-center gap-2 px-4 py-4 rounded-2xl border border-white/8"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-2xl font-black text-white/30">$</span>
                <input value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  className="flex-1 text-4xl font-black text-white bg-transparent outline-none" />
                <button onClick={() => setAmount(String(BALANCE))}
                  className="text-xs px-2 py-1 rounded-lg font-bold"
                  style={{ background: '#a855f720', color: '#a855f7' }}>Max</button>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className="py-2 rounded-xl text-xs font-black transition-all"
                    style={amount === String(a)
                      ? { background: '#a855f7', color: '#04040A' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    ${a}
                  </button>
                ))}
              </div>
              {amtNum > BALANCE && <div className="text-xs text-red-400">Exceeds available balance</div>}
            </div>

            {/* Method */}
            <div className="space-y-2">
              <div className="text-xs text-white/30 uppercase tracking-widest">Withdrawal Method</div>
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all"
                  style={method === m.id
                    ? { background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.35)' }
                    : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white/80">{m.label}</div>
                    <div className="text-xs text-white/30">{m.desc}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {method === m.id
                      ? <div className="w-4 h-4 rounded-full" style={{ background: '#a855f7' }} />
                      : <div className="w-4 h-4 rounded-full border border-white/15" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Bank account picker */}
            {method === 'bank' && (
              <div className="space-y-2">
                <div className="text-xs text-white/30 uppercase tracking-widest">To Account</div>
                {BANK_ACCOUNTS.map(b => (
                  <button key={b.id} onClick={() => b.verified && setBankAcct(b.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={bankAcct === b.id
                      ? { background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }
                      : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-base">🏦</span>
                    <div className="flex-1 text-sm font-semibold text-white/70">{b.label}</div>
                    {b.verified
                      ? <span className="text-xs text-green-400 font-bold">Verified</span>
                      : <span className="text-xs text-white/25">Pending</span>
                    }
                  </button>
                ))}
                <button className="text-xs font-bold" style={{ color: '#a855f7' }}>+ Add bank account</button>
              </div>
            )}

            <button onClick={() => setStep('confirm')} disabled={!canContinue}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="text-xs text-white/30 uppercase tracking-widest">Review Withdrawal</div>
            <div className="p-5 rounded-2xl border border-white/8 space-y-4" style={{ background: 'rgba(255,255,255,0.025)' }}>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-1">${youGet.toFixed(2)}</div>
                <div className="text-sm text-white/30">you'll receive</div>
              </div>
              <div className="space-y-2 border-t border-white/5 pt-4">
                <Row label="Amount" value={`$${amtNum.toFixed(2)}`} />
                <Row label="Fee" value={fee > 0 ? `$${fee.toFixed(2)}` : 'Free'} />
                <Row label="You receive" value={`$${youGet.toFixed(2)}`} bold />
                <Row label="Method" value={sel.label} />
                <Row label="Arrival" value={method === 'bank' ? '1–3 business days' : 'Instant'} />
              </div>
            </div>
            <button onClick={confirm} disabled={processing}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
              style={{ background: '#22c55e', color: '#04040A' }}>
              {processing ? 'Processing…' : `Confirm Withdrawal`}
            </button>
            <p className="text-center text-xs text-white/20">
              Withdrawals are final once confirmed.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span className={bold ? 'font-black text-white' : 'text-white/60'}>{value}</span>
    </div>
  )
}
