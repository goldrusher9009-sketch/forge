'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TokenOption {
  symbol: string
  name: string
  color: string
  balance: number
  price: number
}

const TOKENS: TokenOption[] = [
  { symbol:'USDC', name:'USD Coin',   color:'#818cf8', balance:1240.50, price:1.00   },
  { symbol:'SVRN', name:'Sovereign V',color:'#a855f7', balance:50,      price:8.75   },
  { symbol:'MAYA', name:'Maya Chen',  color:'#22c55e', balance:80,      price:5.20   },
  { symbol:'JAX',  name:'Jax Beats', color:'#ec4899', balance:0,       price:3.80   },
  { symbol:'VIVA', name:'VIVA',       color:'#f59e0b', balance:120,     price:2.40   },
]

const FEE_PCT = 0.003 // 0.3%

export default function WalletSwapPage() {
  const router = useRouter()

  const [fromSymbol, setFromSymbol] = useState('USDC')
  const [toSymbol,   setToSymbol  ] = useState('SVRN')
  const [fromAmt,    setFromAmt   ] = useState('')
  const [showFrom,   setShowFrom  ] = useState(false)
  const [showTo,     setShowTo    ] = useState(false)
  const [swapping,   setSwapping  ] = useState(false)
  const [swapped,    setSwapped   ] = useState(false)

  const fromToken = TOKENS.find(t => t.symbol === fromSymbol)!
  const toToken   = TOKENS.find(t => t.symbol === toSymbol)!

  const fromVal = parseFloat(fromAmt) || 0
  const rate    = fromToken.price / toToken.price
  const toVal   = fromVal * rate * (1 - FEE_PCT)
  const fee     = fromVal * fromToken.price * FEE_PCT
  const priceImpact = fromVal * fromToken.price > 1000 ? 1.2 : 0.1

  function flip() {
    const tmp = fromSymbol
    setFromSymbol(toSymbol)
    setToSymbol(tmp)
    setFromAmt('')
  }

  function setMax() {
    setFromAmt(fromToken.balance.toString())
  }

  async function doSwap() {
    if (!fromVal || fromVal > fromToken.balance || swapping) return
    setSwapping(true)
    await new Promise(r => setTimeout(r, 1200))
    setSwapping(false)
    setSwapped(true)
    setTimeout(() => { setSwapped(false); setFromAmt('') }, 2500)
  }

  const insufficientBalance = fromVal > fromToken.balance
  const canSwap = fromVal > 0 && !insufficientBalance && fromSymbol !== toSymbol

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
          <div className="font-black text-white">Swap</div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-3">
        {/* From card */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-white/30">From</span>
            <button onClick={setMax} className="text-xs font-bold" style={{ color: fromToken.color }}>
              Max: {fromToken.balance} ${fromToken.symbol}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowFrom(!showFrom); setShowTo(false) }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0"
              style={{ background: `${fromToken.color}15`, color: fromToken.color }}>
              <span className="font-black text-sm">${fromToken.symbol}</span>
              <span className="text-xs">▾</span>
            </button>
            <input
              type="number" value={fromAmt} onChange={e => setFromAmt(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-2xl font-black bg-transparent outline-none text-right"
              style={{ color: insufficientBalance ? '#f87171' : 'rgba(255,255,255,0.85)' }} />
          </div>
          {fromAmt && <div className="text-right text-xs text-white/25 mt-1">≈ ${(fromVal * fromToken.price).toFixed(2)}</div>}

          {/* From token picker */}
          {showFrom && (
            <div className="mt-3 space-y-1">
              {TOKENS.filter(t => t.symbol !== toSymbol).map(t => (
                <button key={t.symbol} onClick={() => { setFromSymbol(t.symbol); setShowFrom(false); setFromAmt('') }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-left"
                  style={{ background: t.symbol === fromSymbol ? `${t.color}15` : 'transparent' }}>
                  <span className="font-black text-sm" style={{ color: t.color }}>${t.symbol}</span>
                  <span className="text-xs text-white/30 flex-1">{t.name}</span>
                  <span className="text-xs text-white/25">{t.balance}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Flip button */}
        <div className="flex justify-center">
          <button onClick={flip}
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            ↕
          </button>
        </div>

        {/* To card */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="text-xs text-white/30 mb-3">To</div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowTo(!showTo); setShowFrom(false) }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0"
              style={{ background: `${toToken.color}15`, color: toToken.color }}>
              <span className="font-black text-sm">${toToken.symbol}</span>
              <span className="text-xs">▾</span>
            </button>
            <div className="flex-1 text-2xl font-black text-right text-white/60">
              {toVal > 0 ? toVal.toFixed(4) : '0.00'}
            </div>
          </div>
          {toVal > 0 && <div className="text-right text-xs text-white/25 mt-1">≈ ${(toVal * toToken.price).toFixed(2)}</div>}

          {/* To picker */}
          {showTo && (
            <div className="mt-3 space-y-1">
              {TOKENS.filter(t => t.symbol !== fromSymbol).map(t => (
                <button key={t.symbol} onClick={() => { setToSymbol(t.symbol); setShowTo(false) }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-left"
                  style={{ background: t.symbol === toSymbol ? `${t.color}15` : 'transparent' }}>
                  <span className="font-black text-sm" style={{ color: t.color }}>${t.symbol}</span>
                  <span className="text-xs text-white/30 flex-1">{t.name}</span>
                  <span className="text-xs text-white/25">${t.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rate details */}
        {fromVal > 0 && (
          <div className="p-3 rounded-xl border border-white/4 space-y-2" style={{ background: 'rgba(255,255,255,0.01)' }}>
            {[
              { label:'Rate',          value:`1 $${fromSymbol} = ${rate.toFixed(4)} $${toSymbol}` },
              { label:'Fee (0.3%)',    value:`$${fee.toFixed(4)}` },
              { label:'Price impact',  value:`~${priceImpact}%`, color: priceImpact > 1 ? '#f59e0b' : '#22c55e' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-white/30">{r.label}</span>
                <span style={{ color: r.color ?? 'rgba(255,255,255,0.5)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button onClick={doSwap} disabled={!canSwap || swapping}
          className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40"
          style={swapped
            ? { background: '#22c55e', color: '#04040A' }
            : { background: canSwap ? fromToken.color : 'rgba(255,255,255,0.06)',
                color: canSwap ? '#04040A' : 'rgba(255,255,255,0.25)' }}>
          {swapped ? '✓ Swapped!' : swapping ? 'Swapping…' : insufficientBalance ? 'Insufficient balance' : fromSymbol === toSymbol ? 'Select different tokens' : !fromVal ? 'Enter amount' : `Swap $${fromSymbol} → $${toSymbol}`}
        </button>
      </div>
    </div>
  )
}
