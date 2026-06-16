'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Method = 'usdc' | 'bank' | 'crypto'
type Network = 'ethereum' | 'solana' | 'bnb'

const METHODS = [
  { key:'usdc'   as Method, label:'USDC Transfer',    icon:'💵', desc:'To external wallet · ~1 min' },
  { key:'bank'   as Method, label:'Bank Transfer',    icon:'🏦', desc:'ACH / Wire · 1–3 business days' },
  { key:'crypto' as Method, label:'Crypto Withdrawal',icon:'₿',  desc:'BTC, ETH, SOL · varies' },
]

const NETWORKS: { key:Network; label:string; color:string; fee:string; time:string }[] = [
  { key:'ethereum', label:'Ethereum',  color:'#818cf8', fee:'$2–8', time:'~12 min'  },
  { key:'solana',   label:'Solana',    color:'#a855f7', fee:'<$0.01', time:'~30 sec' },
  { key:'bnb',      label:'BNB Chain', color:'#f59e0b', fee:'~$0.20', time:'~3 min' },
]

const BALANCE = 1842.50
const PRESETS = [100, 250, 500, 1000]

export default function WalletWithdrawPage() {
  const router    = useRouter()
  const [method, setMethod]     = useState<Method>('usdc')
  const [network, setNetwork]   = useState<Network>('solana')
  const [amount, setAmount]     = useState('')
  const [address, setAddress]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [step, setStep]         = useState<1|2>(1)

  const numAmt = parseFloat(amount) || 0
  const fee    = method === 'bank' ? 5 : method === 'crypto' ? 2 : 0.5
  const receive= Math.max(0, numAmt - fee)
  const valid  = numAmt > 0 && numAmt <= BALANCE && (method === 'bank' || address.length > 10)

  async function submit() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background:'var(--ink)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
        style={{ background:'rgba(34,197,94,0.1)' }}>✓</div>
      <div className="font-black text-2xl text-white mb-2">Withdrawal Sent</div>
      <div className="text-white/35 text-sm mb-2">${receive.toFixed(2)} on its way</div>
      <div className="text-white/20 text-xs mb-8">
        {method === 'bank' ? 'Arrives in 1–3 business days' : 'Estimated arrival: ~30 seconds'}
      </div>
      <button onClick={() => router.push('/wallet')}
        className="w-full py-4 rounded-2xl font-black text-base"
        style={{ background:'#a855f7', color:'#04040A' }}>Back to Wallet</button>
    </div>
  )

  return (
    <div className="min-h-screen pb-32" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white">Withdraw</div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Balance */}
        <div className="p-4 rounded-2xl border border-white/5 flex items-center justify-between"
          style={{ background:'rgba(255,255,255,0.018)' }}>
          <div>
            <div className="text-xs text-white/30">Available Balance</div>
            <div className="font-black text-2xl text-white">${BALANCE.toLocaleString()}</div>
          </div>
          <button onClick={() => setAmount(String(BALANCE))}
            className="text-xs px-3 py-1.5 rounded-xl font-bold"
            style={{ background:'rgba(168,85,247,0.12)', color:'#a855f7' }}>Max</button>
        </div>

        {/* Method */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Withdrawal Method</div>
          <div className="space-y-2">
            {METHODS.map(m => (
              <button key={m.key} onClick={() => setMethod(m.key)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left"
                style={method === m.key
                  ? { background:'rgba(168,85,247,0.08)', borderColor:'rgba(168,85,247,0.3)' }
                  : { background:'rgba(255,255,255,0.015)', borderColor:'rgba(255,255,255,0.05)' }}>
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-sm text-white/80">{m.label}</div>
                  <div className="text-xs text-white/30">{m.desc}</div>
                </div>
                <div className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                  style={method === m.key ? { background:'#a855f7', borderColor:'#a855f7' } : { borderColor:'rgba(255,255,255,0.2)' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Network (crypto/usdc) */}
        {method !== 'bank' && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Network</div>
            <div className="flex gap-2">
              {NETWORKS.map(n => (
                <button key={n.key} onClick={() => setNetwork(n.key)}
                  className="flex-1 p-2.5 rounded-xl border text-center"
                  style={network === n.key
                    ? { background:`${n.color}08`, borderColor:`${n.color}30` }
                    : { background:'rgba(255,255,255,0.015)', borderColor:'rgba(255,255,255,0.05)' }}>
                  <div className="font-bold text-xs" style={{ color:n.color }}>{n.label}</div>
                  <div className="text-[10px] text-white/25">{n.fee} · {n.time}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Destination */}
        {method !== 'bank' && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Destination Address</div>
            <input value={address} onChange={e => setAddress(e.target.value)}
              placeholder="0x... or wallet address"
              className="w-full px-4 py-3 rounded-2xl border border-white/8 bg-white/5 text-sm text-white placeholder-white/20 outline-none font-mono" />
          </div>
        )}
        {method === 'bank' && (
          <div className="p-3 rounded-xl border border-amber-400/20 text-xs"
            style={{ background:'rgba(245,158,11,0.05)', color:'rgba(245,158,11,0.6)' }}>
            ⚠️ Bank transfers require KYC verification. ACH: $0 fee. Wire: $5 fee. 1–3 business days.
          </div>
        )}

        {/* Amount */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Amount</div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/8 bg-white/5">
            <span className="text-2xl font-black text-white/30">$</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-2xl font-black text-white bg-transparent outline-none placeholder-white/15" />
          </div>
          <div className="flex gap-2 mt-2">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(String(p))}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold"
                style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
                ${p}
              </button>
            ))}
          </div>
          {numAmt > BALANCE && (
            <div className="text-xs text-red-400/70 mt-2">Exceeds available balance</div>
          )}
        </div>

        {/* Summary */}
        {numAmt > 0 && numAmt <= BALANCE && (
          <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/35">Withdrawal amount</span>
              <span className="font-bold text-white/75">${numAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/35">Fee</span>
              <span className="text-orange-400/70">-${fee.toFixed(2)}</span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between">
              <span className="text-white/50 text-sm font-bold">You receive</span>
              <span className="font-black text-base" style={{ color:'#22c55e' }}>${receive.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 border-t border-white/5"
        style={{ background:'rgba(4,4,10,0.95)', backdropFilter:'blur(20px)' }}>
        <button onClick={submit} disabled={!valid || loading}
          className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40"
          style={{ background:'#a855f7', color:'#04040A' }}>
          {loading ? 'Processing…' : `Withdraw $${numAmt > 0 ? numAmt.toFixed(2) : '0.00'}`}
        </button>
      </div>
    </div>
  )
}
