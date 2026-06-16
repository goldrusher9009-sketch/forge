'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Token {
  symbol: string
  name: string
  color: string
  price: number
  balance: number
  type: 'stable' | 'creator'
}

const TOKENS: Token[] = [
  { symbol: 'USDC',  name: 'USD Coin',    color: '#818cf8', price: 1.00,  balance: 1842.50, type: 'stable' },
  { symbol: 'SVRN',  name: 'Sovereign V', color: '#a855f7', price: 8.75,  balance: 50,      type: 'creator' },
  { symbol: 'MAYA',  name: 'Maya Chen',   color: '#22c55e', price: 5.20,  balance: 80,      type: 'creator' },
  { symbol: 'JAX',   name: 'Jax Beats',  color: '#ec4899', price: 3.80,  balance: 0,       type: 'creator' },
  { symbol: 'SOL',   name: 'Solana',      color: '#9945ff', price: 152.40, balance: 2.5,   type: 'stable' },
  { symbol: 'ETH',   name: 'Ethereum',    color: '#627eea', price: 3420,  balance: 0.12,    type: 'stable' },
]

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 3.0]

export default function WalletSwapPage() {
  const router = useRouter()
  const [fromSymbol, setFromSymbol] = useState('USDC')
  const [toSymbol, setToSymbol] = useState('SVRN')
  const [fromAmt, setFromAmt] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [swapped, setSwapped] = useState(false)

  const fromToken = TOKENS.find(t => t.symbol === fromSymbol) ?? TOKENS[0]
  const toToken = TOKENS.find(t => t.symbol === toSymbol) ?? TOKENS[1]

  const numFrom = Number(fromAmt) || 0
  const rate = fromToken.price / toToken.price
  const numTo = numFrom * rate * (1 - slippage / 100)
  const priceImpact = (numFrom / (fromToken.balance * fromToken.price) * 0.8).toFixed(2)
  const fee = (numFrom * 0.003).toFixed(3)
  const minReceived = (numTo * (1 - slippage / 100)).toFixed(4)

  function flip() {
    const tmp = fromSymbol
    setFromSymbol(toSymbol)
    setToSymbol(tmp)
    setFromAmt('')
  }

  async function swap() {
    if (numFrom <= 0 || numFrom > fromToken.balance) return
    setSwapping(true)
    await new Promise(r => setTimeout(r, 1200))
    setSwapping(false)
    setSwapped(true)
    setTimeout(() => { setSwapped(false); setFromAmt('') }, 3000)
  }

  function TokenPicker({ onSelect, exclude, onClose }: { onSelect: (s: string) => void; exclude: string; onClose: () => void }) {
    return (
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(4,4,10,0.85)' }} onClick={onClose}>
        <div className="w-full rounded-t-3xl pb-8" style={{ background: '#0c0c18' }} onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-4" />
          <div className="px-4 pb-2 text-xs font-black text-white/40 uppercase tracking-wider">Select Token</div>
          {TOKENS.filter(t => t.symbol !== exclude).map(t => (
            <button key={t.symbol} onClick={() => { onSelect(t.symbol); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-white/5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${t.color}18`, color: t.color }}>
                {t.symbol[0]}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-sm text-white/80">{t.symbol}</div>
                <div className="text-xs text-white/30">{t.name}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-white/60">{t.balance}</div>
                <div className="text-xs text-white/25">${(t.balance * t.price).toFixed(0)}</div>
              </div>
            </button>
          ))}
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
          <div className="font-black text-white">Swap</div>
          <div className="ml-auto flex items-center gap-1 text-xs text-white/30">
            <span>Slippage:</span>
            {SLIPPAGE_OPTIONS.map(s => (
              <button key={s} onClick={() => setSlippage(s)}
                className="px-1.5 py-0.5 rounded-full font-bold"
                style={slippage === s ? { background: '#a855f7', color: '#04040A' } : { color: 'rgba(255,255,255,0.3)' }}>
                {s}%
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-2">
        {swapped ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">✅</div>
            <div className="font-black text-xl text-white">Swap Complete!</div>
            <div className="text-sm text-white/40 mt-1">{fromAmt} {fromSymbol} → {numTo.toFixed(4)} {toSymbol}</div>
          </div>
        ) : (
          <>
            {/* From */}
            <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="flex justify-between text-xs text-white/30 mb-2">
                <span>From</span>
                <span>Balance: {fromToken.balance} {fromToken.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowFromPicker(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl flex-shrink-0"
                  style={{ background: `${fromToken.color}15` }}>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs"
                    style={{ background: `${fromToken.color}30`, color: fromToken.color }}>
                    {fromToken.symbol[0]}
                  </div>
                  <span className="font-black text-sm text-white/80">{fromToken.symbol}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
                <input value={fromAmt} onChange={e => setFromAmt(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.0"
                  className="flex-1 text-right text-2xl font-black text-white bg-transparent outline-none" />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-white/25">${(numFrom * fromToken.price).toFixed(2)}</span>
                <button onClick={() => setFromAmt(String(fromToken.balance))}
                  className="text-xs font-bold" style={{ color: fromToken.color }}>MAX</button>
              </div>
            </div>

            {/* Flip button */}
            <div className="flex justify-center py-1">
              <button onClick={flip}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                ⇅
              </button>
            </div>

            {/* To */}
            <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="flex justify-between text-xs text-white/30 mb-2">
                <span>To (estimated)</span>
                <span>Balance: {toToken.balance} {toToken.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowToPicker(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl flex-shrink-0"
                  style={{ background: `${toToken.color}15` }}>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs"
                    style={{ background: `${toToken.color}30`, color: toToken.color }}>
                    {toToken.symbol[0]}
                  </div>
                  <span className="font-black text-sm text-white/80">{toToken.symbol}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
                <div className="flex-1 text-right text-2xl font-black text-white/60">
                  {numTo > 0 ? numTo.toFixed(4) : '0.0'}
                </div>
              </div>
              <div className="text-xs text-white/25 text-right mt-1">${(numTo * toToken.price).toFixed(2)}</div>
            </div>

            {/* Route details */}
            {numFrom > 0 && (
              <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Route Details</div>
                {[
                  { label: 'Rate',          value: `1 ${fromToken.symbol} ≈ ${rate.toFixed(4)} ${toToken.symbol}` },
                  { label: 'Fee (0.3%)',    value: `${fee} ${fromToken.symbol}` },
                  { label: 'Price Impact',  value: `${priceImpact}%`, color: Number(priceImpact) > 1 ? '#f59e0b' : '#22c55e' },
                  { label: 'Min. Received', value: `${minReceived} ${toToken.symbol}` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-white/30">{r.label}</span>
                    <span className="font-bold" style={{ color: r.color ?? 'rgba(255,255,255,0.6)' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={swap}
              disabled={numFrom <= 0 || numFrom > fromToken.balance || swapping}
              className="w-full py-3.5 rounded-xl font-black text-sm disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              {swapping ? 'Swapping…' : numFrom > fromToken.balance ? 'Insufficient balance' : `Swap ${fromSymbol} → ${toSymbol}`}
            </button>
          </>
        )}
      </div>

      {showFromPicker && <TokenPicker onSelect={setFromSymbol} exclude={toSymbol} onClose={() => setShowFromPicker(false)} />}
      {showToPicker && <TokenPicker onSelect={setToSymbol} exclude={fromSymbol} onClose={() => setShowToPicker(false)} />}
    </div>
  )
}
