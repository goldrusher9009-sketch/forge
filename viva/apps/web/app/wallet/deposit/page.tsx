'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Method = 'usdc' | 'crypto' | 'card'
type Network = 'ethereum' | 'solana' | 'bnb' | 'polygon'

const METHODS = [
  { key:'usdc'   as Method, label:'USDC / Stablecoin', icon:'💵', desc:'Instant, no fees' },
  { key:'crypto' as Method, label:'Crypto',             icon:'₿',  desc:'BTC, ETH, SOL...' },
  { key:'card'   as Method, label:'Debit / Credit',    icon:'💳', desc:'3.5% fee, instant' },
]

const NETWORKS: { key:Network; label:string; symbol:string; color:string; time:string; fee:string }[] = [
  { key:'ethereum', label:'Ethereum',  symbol:'ETH',    color:'#818cf8', time:'~12 min',  fee:'$2–8 gas' },
  { key:'solana',   label:'Solana',    symbol:'SOL',    color:'#a855f7', time:'~30 sec',  fee:'~$0.01'   },
  { key:'bnb',      label:'BNB Chain', symbol:'BNB',    color:'#f59e0b', time:'~3 min',   fee:'~$0.20'   },
  { key:'polygon',  label:'Polygon',   symbol:'MATIC',  color:'#818cf8', time:'~2 min',   fee:'~$0.05'   },
]

const PRESETS = [50, 100, 250, 500]

const FAKE_ADDRESS = '0x1A9f...d4E7'
const FULL_ADDRESS = '0x1A9fC2bB4dE8e9a3F0c6B1D85a4f3c2d1e0b4E7'

export default function WalletDepositPage() {
  const router = useRouter()
  const [method, setMethod]   = useState<Method>('usdc')
  const [network, setNetwork] = useState<Network>('solana')
  const [amount, setAmount]   = useState('')
  const [copied, setCopied]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const numAmt = parseFloat(amount) || 0
  const fee = method === 'card' ? numAmt * 0.035 : 0
  const receive = numAmt - fee

  function copyAddress() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function submit() {
    if (!amount || numAmt <= 0) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background:'var(--ink)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
        style={{ background:'rgba(34,197,94,0.1)' }}>✓</div>
      <div className="font-black text-2xl text-white mb-2">Deposit Initiated</div>
      <div className="text-white/35 text-sm mb-8">${receive.toFixed(2)} arriving soon to your VIVA wallet</div>
      <button onClick={() => router.push('/wallet')}
        className="w-full py-4 rounded-2xl font-black text-base"
        style={{ background:'#a855f7', color:'#04040A' }}>
        Back to Wallet
      </button>
      <button onClick={() => { setDone(false); setAmount('') }}
        className="w-full py-3 rounded-2xl font-bold text-sm mt-3 text-white/30">
        Deposit More
      </button>
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
          <div className="font-black text-white">Deposit</div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Method select */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Payment Method</div>
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

        {/* Network (not for card) */}
        {method !== 'card' && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Network</div>
            <div className="grid grid-cols-2 gap-2">
              {NETWORKS.map(n => (
                <button key={n.key} onClick={() => setNetwork(n.key)}
                  className="p-3 rounded-xl border text-left"
                  style={network === n.key
                    ? { background:`${n.color}08`, borderColor:`${n.color}30` }
                    : { background:'rgba(255,255,255,0.015)', borderColor:'rgba(255,255,255,0.05)' }}>
                  <div className="font-bold text-sm" style={{ color:n.color }}>{n.label}</div>
                  <div className="text-xs text-white/25">{n.time} · {n.fee}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Deposit address (crypto/usdc) */}
        {method !== 'card' && (
          <div className="p-4 rounded-2xl border border-white/5" style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Your Deposit Address</div>
            {/* QR code simulation */}
            <div className="w-32 h-32 mx-auto mb-3 rounded-xl flex items-center justify-center border border-white/8"
              style={{ background:'rgba(255,255,255,0.04)' }}>
              <div className="grid grid-cols-8 gap-0.5">
                {Array.from({length:64}).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-[1px]"
                    style={{ background: Math.random() > 0.45 ? 'rgba(255,255,255,0.7)' : 'transparent' }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/4 border border-white/6">
              <span className="flex-1 font-mono text-xs text-white/50 truncate">{FULL_ADDRESS}</span>
              <button onClick={copyAddress}
                className="text-xs px-2.5 py-1 rounded-lg font-bold flex-shrink-0"
                style={copied ? { background:'#22c55e', color:'#04040A' } : { background:'rgba(168,85,247,0.12)', color:'#a855f7' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="text-xs text-white/20 text-center mt-2">
              Send only {method === 'usdc' ? 'USDC' : NETWORKS.find(n=>n.key===network)?.symbol} on {NETWORKS.find(n=>n.key===network)?.label}
            </div>
          </div>
        )}

        {/* Amount */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Amount (USD)</div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/8 bg-white/5">
            <span className="text-2xl font-black text-white/30">$</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-2xl font-black text-white bg-transparent outline-none placeholder-white/15" />
            <span className="text-xs text-white/25">USD</span>
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
        </div>

        {/* Summary */}
        {numAmt > 0 && (
          <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/35">You send</span>
              <span className="font-bold text-white/75">${numAmt.toFixed(2)}</span>
            </div>
            {fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/35">Processing fee (3.5%)</span>
                <span className="text-orange-400/70">-${fee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-white/5 pt-2 flex justify-between">
              <span className="text-white/50 text-sm font-bold">You receive</span>
              <span className="font-black text-base" style={{ color:'#22c55e' }}>${receive.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 border-t border-white/5"
        style={{ background:'rgba(4,4,10,0.95)', backdropFilter:'blur(20px)' }}>
        <button onClick={submit} disabled={!amount || numAmt <= 0 || loading}
          className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40"
          style={{ background:'#a855f7', color:'#04040A' }}>
          {loading ? 'Processing…' : method === 'card' ? `Pay $${numAmt.toFixed(2)}` : 'Confirm Deposit'}
        </button>
      </div>
    </div>
  )
}
