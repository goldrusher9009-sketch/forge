'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TOKENS = [
  { symbol: 'VIVA', name: 'VIVA Platform', color: '#a855f7', price: 1.00, balance: 1240 },
  { symbol: 'SOVV', name: 'Sovereign V',   color: '#818cf8', price: 12.40, balance: 120 },
  { symbol: 'MAYA', name: 'Maya Chen',     color: '#22c55e', price: 6.60,  balance: 250 },
  { symbol: 'APEX', name: 'Luna Apex',     color: '#f59e0b', price: 9.10,  balance: 80  },
  { symbol: 'ZERO', name: 'ZeroNode',      color: '#818cf8', price: 3.20,  balance: 400 },
  { symbol: 'USDC', name: 'USD Coin',      color: '#22c55e', price: 1.00,  balance: 840 },
]

const FEE_PCT = 0.003 // 0.3%

export default function SwapPage() {
  const router = useRouter()
  const [fromSym, setFromSym] = useState('USDC')
  const [toSym, setToSym] = useState('SOVV')
  const [fromAmt, setFromAmt] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [loading, setLoading] = useState(false)
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [selectingFrom, setSelectingFrom] = useState(false)
  const [selectingTo, setSelectingTo] = useState(false)

  const fromToken = TOKENS.find(t => t.symbol === fromSym)!
  const toToken = TOKENS.find(t => t.symbol === toSym)!

  const fromValue = parseFloat(fromAmt) || 0
  const rate = toToken.price === 0 ? 0 : fromToken.price / toToken.price
  const toValue = fromValue * rate
  const fee = fromValue * FEE_PCT
  const minReceived = toValue * (1 - slippage / 100)

  async function handleSwap() {
    if (!fromAmt || fromValue <= 0) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    setTxMsg(`Swapped ${fromAmt} ${fromSym} → ${toValue.toFixed(4)} ${toSym}`)
    setFromAmt('')
    setTimeout(() => setTxMsg(null), 5000)
  }

  function flipTokens() {
    setFromSym(toSym)
    setToSym(fromSym)
    setFromAmt('')
  }

  function selectToken(sym: string, side: 'from' | 'to') {
    if (side === 'from') { setFromSym(sym); setSelectingFrom(false) }
    else { setToSym(sym); setSelectingTo(false) }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">INSTANT EXCHANGE</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Swap</h1>
          </div>
          <button onClick={() => router.push('/invest')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: '#a855f718', color: '#a855f7', border: '1px solid #a855f725' }}>
            Portfolio ↗
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-3">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {/* From */}
        <div className="p-4 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/35">You Pay</span>
            <span className="text-xs text-white/25">Balance: {fromToken.balance} {fromSym}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectingFrom(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0"
              style={{ background: `${fromToken.color}14`, border: `1px solid ${fromToken.color}25` }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: fromToken.color, color: '#04040A' }}>{fromToken.symbol[0]}</div>
              <span className="font-bold text-sm" style={{ color: fromToken.color }}>{fromSym}</span>
              <span className="text-white/35 text-xs">▼</span>
            </button>
            <input value={fromAmt} onChange={e => setFromAmt(e.target.value)}
              type="number" placeholder="0.00"
              className="flex-1 text-right text-xl font-black bg-transparent text-white placeholder-white/20 outline-none" />
          </div>
          {fromValue > 0 && (
            <div className="text-right text-xs text-white/25 mt-1">${(fromValue * fromToken.price).toFixed(2)}</div>
          )}
          <div className="flex gap-2 mt-3">
            {[25, 50, 75, 100].map(pct => (
              <button key={pct} onClick={() => setFromAmt(String(fromToken.balance * pct / 100))}
                className="flex-1 py-1 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center">
          <button onClick={flipTokens}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all hover:rotate-180"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', transition: 'transform 0.3s ease' }}>
            ⇅
          </button>
        </div>

        {/* To */}
        <div className="p-4 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/35">You Receive</span>
            <span className="text-xs text-white/25">Balance: {toToken.balance} {toSym}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectingTo(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0"
              style={{ background: `${toToken.color}14`, border: `1px solid ${toToken.color}25` }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: toToken.color, color: '#04040A' }}>{toToken.symbol[0]}</div>
              <span className="font-bold text-sm" style={{ color: toToken.color }}>{toSym}</span>
              <span className="text-white/35 text-xs">▼</span>
            </button>
            <div className="flex-1 text-right text-xl font-black text-white/60">
              {toValue > 0 ? toValue.toFixed(4) : '—'}
            </div>
          </div>
          {toValue > 0 && (
            <div className="text-right text-xs text-white/25 mt-1">${(toValue * toToken.price).toFixed(2)}</div>
          )}
        </div>

        {/* Details */}
        {fromValue > 0 && (
          <div className="p-4 rounded-2xl border border-white/6 space-y-2"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            {[
              { label: 'Rate', val: `1 ${fromSym} = ${rate.toFixed(4)} ${toSym}` },
              { label: 'Fee (0.3%)', val: `${fee.toFixed(4)} ${fromSym}` },
              { label: 'Min Received', val: `${minReceived.toFixed(4)} ${toSym}` },
              { label: 'Slippage', val: `${slippage}%` },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-white/35">{r.label}</span>
                <span className="text-white/60 font-semibold">{r.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Slippage */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/35">Slippage Tolerance</span>
          <div className="flex gap-1">
            {[0.1, 0.5, 1.0].map(s => (
              <button key={s} onClick={() => setSlippage(s)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={slippage === s
                  ? { background: '#a855f7', color: '#04040A' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                {s}%
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSwap} disabled={loading || fromValue <= 0 || fromSym === toSym}
          className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-40"
          style={{ background: fromValue > 0 && fromSym !== toSym ? '#a855f7' : 'rgba(255,255,255,0.05)', color: '#04040A' }}>
          {loading ? 'Swapping…' : fromValue <= 0 ? 'Enter Amount' : fromSym === toSym ? 'Select Different Tokens' : `Swap ${fromSym} → ${toSym}`}
        </button>
      </div>

      {/* Token picker */}
      {(selectingFrom || selectingTo) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => { setSelectingFrom(false); setSelectingTo(false) }}>
          <div className="w-full max-w-md pb-6 rounded-t-3xl border-t border-white/10"
            style={{ background: '#0d0d1a' }} onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/6">
              <div className="font-bold text-white">Select Token</div>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {TOKENS.filter(t => t.symbol !== (selectingFrom ? toSym : fromSym)).map(t => (
                <button key={t.symbol}
                  onClick={() => selectToken(t.symbol, selectingFrom ? 'from' : 'to')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${t.color}18`, color: t.color }}>{t.symbol[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{t.symbol}</div>
                    <div className="text-xs text-white/30">{t.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white/60">{t.balance}</div>
                    <div className="text-xs text-white/25">${t.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
