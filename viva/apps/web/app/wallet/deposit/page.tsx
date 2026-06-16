'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const METHODS = [
  {
    id: 'card', label: 'Credit / Debit Card', icon: '💳',
    desc: 'Instant. 1.5% fee. Visa, Mastercard, Amex.',
    fee: 0.015, instant: true,
  },
  {
    id: 'crypto', label: 'Crypto Transfer', icon: '🔗',
    desc: 'USDC, ETH, BTC. No fee. 1–3 min confirmation.',
    fee: 0, instant: false,
  },
  {
    id: 'bank', label: 'Bank Transfer (ACH)', icon: '🏦',
    desc: 'No fee. 1–3 business days.',
    fee: 0, instant: false,
  },
]

const CRYPTO_ASSETS = [
  { symbol: 'USDC', name: 'USD Coin',  icon: '🔵', rate: 1.00 },
  { symbol: 'ETH',  name: 'Ethereum', icon: '⬡',  rate: 3240 },
  { symbol: 'BTC',  name: 'Bitcoin',  icon: '₿',  rate: 64800 },
]

const QUICK_AMOUNTS = [25, 50, 100, 250, 500, 1000]

export default function DepositPage() {
  const router = useRouter()
  const [method, setMethod] = useState('card')
  const [amount, setAmount] = useState('100')
  const [cryptoAsset, setCryptoAsset] = useState('USDC')
  const [step, setStep] = useState<'pick' | 'confirm' | 'done'>('pick')
  const [processing, setProcessing] = useState(false)

  const amtNum = parseFloat(amount) || 0
  const selectedMethod = METHODS.find(m => m.id === method)!
  const fee = amtNum * selectedMethod.fee
  const total = amtNum + fee
  const selectedAsset = CRYPTO_ASSETS.find(a => a.symbol === cryptoAsset)!
  const cryptoAmount = amtNum / selectedAsset.rate

  async function confirmDeposit() {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1400))
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
            <div className="text-2xl font-black text-white mb-1">${amtNum.toFixed(2)} USDC</div>
            <div className="text-white/40">
              {method === 'card' ? 'Added to your wallet instantly.' : method === 'crypto' ? 'Awaiting blockchain confirmation (1–3 min).' : 'Transfer initiated. Arrives in 1–3 business days.'}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 text-left space-y-2"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Deposit amount</span>
              <span className="text-white font-bold">${amtNum.toFixed(2)}</span>
            </div>
            {fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Fee ({(selectedMethod.fee * 100).toFixed(1)}%)</span>
                <span className="text-white/60">${fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-white/5 pt-2">
              <span className="text-white/40">Method</span>
              <span className="text-white/60">{selectedMethod.label}</span>
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push('/wallet')}
              className="w-full py-3.5 rounded-xl font-black"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Go to Wallet
            </button>
            <button onClick={() => { setStep('pick'); setAmount('100') }}
              className="w-full py-2.5 rounded-xl text-sm text-white/30 hover:text-white/60 transition-colors">
              Make another deposit
            </button>
          </div>
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
          <div className="font-bold text-white">Add Funds</div>
        </div>
        {/* Progress */}
        <div className="flex gap-1 mt-3">
          {(['pick', 'confirm'] as const).map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: step === 'confirm' ? '#a855f7' : i === 0 ? '#a855f7' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {step === 'pick' && (
          <>
            {/* Amount */}
            <div className="space-y-3">
              <div className="text-xs text-white/30 uppercase tracking-widest">Amount (USDC)</div>
              <div className="flex items-center gap-2 px-4 py-4 rounded-2xl border border-white/8"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-2xl font-black text-white/30">$</span>
                <input value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  className="flex-1 text-4xl font-black text-white bg-transparent outline-none" />
                <span className="text-sm text-white/20">USDC</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
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
            </div>

            {/* Method */}
            <div className="space-y-2">
              <div className="text-xs text-white/30 uppercase tracking-widest">Payment Method</div>
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all"
                  style={method === m.id
                    ? { background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.35)' }
                    : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-xl flex-shrink-0">{m.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white/80">{m.label}</div>
                    <div className="text-xs text-white/30">{m.desc}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {method === m.id
                      ? <div className="w-4 h-4 rounded-full" style={{ background: '#a855f7' }} />
                      : <div className="w-4 h-4 rounded-full border border-white/15" />
                    }
                  </div>
                </button>
              ))}
            </div>

            {/* Crypto asset picker */}
            {method === 'crypto' && (
              <div className="space-y-2">
                <div className="text-xs text-white/30 uppercase tracking-widest">Select Asset</div>
                {CRYPTO_ASSETS.map(a => (
                  <button key={a.symbol} onClick={() => setCryptoAsset(a.symbol)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={cryptoAsset === a.symbol
                      ? { background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }
                      : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-xl">{a.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white/80">{a.symbol}</div>
                      <div className="text-xs text-white/30">{a.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/40">Rate</div>
                      <div className="text-xs font-bold text-white/60">${a.rate.toLocaleString()}</div>
                    </div>
                  </button>
                ))}
                <div className="p-3 rounded-xl text-xs text-white/30 border border-white/5"
                  style={{ background: 'rgba(255,255,255,0.01)' }}>
                  You'll send <span className="font-mono text-white/60">{cryptoAmount.toFixed(6)} {cryptoAsset}</span> to our deposit address. Rate locked at confirmation.
                </div>
              </div>
            )}

            <button onClick={() => setStep('confirm')} disabled={amtNum < 1}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="text-xs text-white/30 uppercase tracking-widest">Review Deposit</div>
            <div className="p-5 rounded-2xl border border-white/8 space-y-4" style={{ background: 'rgba(255,255,255,0.025)' }}>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-1">${amtNum.toFixed(2)}</div>
                <div className="text-sm text-white/30">USDC into your VIVA wallet</div>
              </div>
              <div className="space-y-2 border-t border-white/5 pt-4">
                <Row label="Method" value={selectedMethod.label} />
                {method === 'crypto' && <Row label="You send" value={`${cryptoAmount.toFixed(6)} ${cryptoAsset}`} />}
                {fee > 0 && <Row label={`Fee (${(selectedMethod.fee * 100).toFixed(1)}%)`} value={`$${fee.toFixed(2)}`} />}
                <Row label="Total charged" value={`$${total.toFixed(2)}`} bold />
                <Row label="Arrival" value={selectedMethod.instant ? 'Instant' : method === 'bank' ? '1–3 business days' : '1–3 min'} />
              </div>
            </div>
            <button onClick={confirmDeposit} disabled={processing}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
              style={{ background: '#22c55e', color: '#04040A' }}>
              {processing ? 'Processing…' : `Confirm — Add $${amtNum.toFixed(2)}`}
            </button>
            <p className="text-center text-xs text-white/20">
              Funds are non-refundable once processed. By continuing you agree to our Terms.
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
