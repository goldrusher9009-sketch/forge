'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKEN_META: Record<string, { name: string; price: number; supply: number; color: string; change24h: number; vol24h: number; mktCap: number }> = {
  SVRN: { name: 'Sovereign V', price: 8.75,  supply: 50000, color: '#a855f7', change24h: 8.3,  vol24h: 48200,  mktCap: 437500 },
  MAYA: { name: 'Maya Chen',   price: 6.40,  supply: 50000, color: '#22c55e', change24h: 3.1,  vol24h: 22100,  mktCap: 320000 },
  JAX:  { name: 'Jax Beats',   price: 4.80,  supply: 30000, color: '#ec4899', change24h: -2.4, vol24h: 9800,   mktCap: 144000 },
}

const SLIPPAGE_OPTIONS = [0.5, 1.0, 2.0, 5.0]

const ORDER_BOOK_ASKS = [
  { price: 8.90, size: 120 },
  { price: 8.85, size: 85  },
  { price: 8.80, size: 200 },
  { price: 8.77, size: 60  },
  { price: 8.76, size: 40  },
]
const ORDER_BOOK_BIDS = [
  { price: 8.74, size: 55  },
  { price: 8.72, size: 90  },
  { price: 8.70, size: 180 },
  { price: 8.65, size: 240 },
  { price: 8.60, size: 110 },
]

type Side = 'buy' | 'sell'

export default function TokenTradePage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const meta = TOKEN_META[symbol] ?? TOKEN_META.SVRN

  const [side, setSide] = useState<Side>('buy')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(1.0)
  const [step, setStep] = useState<'input' | 'confirm' | 'done'>('input')
  const [processing, setProcessing] = useState(false)

  const amountNum = parseFloat(amount) || 0
  const cost = side === 'buy' ? amountNum * meta.price : amountNum * meta.price
  const fee = cost * 0.005 // 0.5%
  const total = side === 'buy' ? cost + fee : cost - fee

  const canTrade = amountNum > 0

  async function trade() {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1500))
    setProcessing(false)
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: side === 'buy' ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)', border: `2px solid ${side === 'buy' ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
            <span className="text-3xl">{side === 'buy' ? '✅' : '💸'}</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white mb-1">
              {side === 'buy' ? `Bought ${amountNum} $${symbol}!` : `Sold ${amountNum} $${symbol}!`}
            </div>
            <div className="text-white/40 text-sm">
              {side === 'buy' ? `Spent $${total.toFixed(2)} USDC` : `Received $${total.toFixed(2)} USDC`}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 text-left space-y-2"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="Token"  value={`$${symbol}`} />
            <Row label="Amount" value={`${amountNum} tokens`} />
            <Row label="Price"  value={`$${meta.price.toFixed(2)}`} />
            <Row label="Fee"    value={`$${fee.toFixed(2)}`} />
            <Row label={side === 'buy' ? 'Total paid' : 'Total received'} value={`$${total.toFixed(2)}`} valueColor={side === 'buy' ? '#f87171' : '#22c55e'} />
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push(`/tokens/${symbol}`)}
              className="w-full py-3.5 rounded-xl font-black"
              style={{ background: meta.color, color: '#04040A' }}>
              View Token
            </button>
            <button onClick={() => { setStep('input'); setAmount('') }}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              Trade Again
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
            <div className="font-black text-white flex-1">Confirm {side === 'buy' ? 'Buy' : 'Sell'}</div>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
          <div className="text-center py-6">
            <div className="text-4xl font-black mb-1" style={{ color: side === 'buy' ? '#22c55e' : '#f87171' }}>
              {side === 'buy' ? '+' : '-'}{amountNum} ${symbol}
            </div>
            <div className="text-white/30 text-sm">
              {side === 'buy' ? `Pay $${total.toFixed(2)} USDC` : `Receive $${total.toFixed(2)} USDC`}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 space-y-3"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="Token"     value={`${meta.name} ($${symbol})`} />
            <Row label="Side"      value={side === 'buy' ? 'Buy' : 'Sell'} valueColor={side === 'buy' ? '#22c55e' : '#f87171'} />
            <Row label="Amount"    value={`${amountNum} tokens`} />
            <Row label="Price"     value={`$${meta.price.toFixed(2)} / token`} />
            <Row label="Subtotal"  value={`$${cost.toFixed(2)}`} />
            <div className="h-px bg-white/5"/>
            <Row label="Protocol fee (0.5%)" value={`$${fee.toFixed(2)}`} valueColor="rgba(255,255,255,0.3)" />
            <Row label="Slippage"  value={`${slippage}%`} valueColor="rgba(255,255,255,0.3)" />
            <Row label={side === 'buy' ? 'Total cost' : 'You receive'} value={`$${total.toFixed(2)}`} />
          </div>
          <button onClick={trade} disabled={processing}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
            style={{ background: side === 'buy' ? '#22c55e' : '#f87171', color: '#04040A' }}>
            {processing ? 'Processing…' : `Confirm ${side === 'buy' ? 'Buy' : 'Sell'}`}
          </button>
        </div>
      </div>
    )
  }

  const maxAskSize = Math.max(...ORDER_BOOK_ASKS.map(o => o.size))
  const maxBidSize = Math.max(...ORDER_BOOK_BIDS.map(o => o.size))

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">${symbol} Trade</div>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: meta.color }}>${meta.price.toFixed(2)}</span>
              <span style={{ color: meta.change24h >= 0 ? '#22c55e' : '#f87171' }}>
                {meta.change24h >= 0 ? '▲' : '▼'}{Math.abs(meta.change24h)}%
              </span>
            </div>
          </div>
          <button onClick={() => router.push(`/tokens/${symbol}`)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: `${meta.color}15`, color: meta.color }}>
            Info →
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Mkt Cap',   value: `$${(meta.mktCap / 1000).toFixed(0)}k` },
            { label: '24h Vol',   value: `$${(meta.vol24h / 1000).toFixed(1)}k` },
            { label: 'Supply',    value: meta.supply.toLocaleString() },
          ].map(s => (
            <div key={s.label} className="p-2 rounded-xl border border-white/4 text-center"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="text-xs text-white/25">{s.label}</div>
              <div className="font-black text-sm text-white/70">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Buy/Sell toggle */}
        <div className="flex p-1 rounded-2xl gap-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button onClick={() => setSide('buy')}
            className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all"
            style={side === 'buy' ? { background: '#22c55e', color: '#04040A' } : { color: 'rgba(255,255,255,0.35)' }}>
            Buy
          </button>
          <button onClick={() => setSide('sell')}
            className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all"
            style={side === 'sell' ? { background: '#f87171', color: '#04040A' } : { color: 'rgba(255,255,255,0.35)' }}>
            Sell
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">
            {side === 'buy' ? 'Tokens to buy' : 'Tokens to sell'}
          </label>
          <div className="flex items-center gap-2 px-4 py-3.5 rounded-xl border border-white/6 bg-white/5">
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              className="flex-1 text-white bg-transparent outline-none text-xl font-black" />
            <span className="text-white/30 font-bold">${symbol}</span>
          </div>
          <div className="flex gap-2 mt-1">
            {[10, 25, 50, 100].map(n => (
              <button key={n} onClick={() => setAmount(String(n))}
                className="flex-1 py-1.5 rounded-lg text-xs font-black transition-all"
                style={{ background: amountNum === n ? meta.color : 'rgba(255,255,255,0.05)', color: amountNum === n ? '#04040A' : 'rgba(255,255,255,0.4)' }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Cost preview */}
        {amountNum > 0 && (
          <div className="p-3 rounded-xl border border-white/5 space-y-1.5"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Row label="Price" value={`$${meta.price.toFixed(2)} / token`} />
            <Row label="Subtotal" value={`$${cost.toFixed(2)}`} />
            <Row label="Fee (0.5%)" value={`$${fee.toFixed(2)}`} valueColor="rgba(255,255,255,0.3)" />
            <div className="h-px bg-white/5"/>
            <Row label={side === 'buy' ? 'Total cost' : 'You receive'}
              value={`$${total.toFixed(2)}`}
              valueColor={side === 'buy' ? '#f87171' : '#22c55e'} />
          </div>
        )}

        {/* Slippage */}
        <div className="space-y-1.5">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Max Slippage</div>
          <div className="flex gap-2">
            {SLIPPAGE_OPTIONS.map(s => (
              <button key={s} onClick={() => setSlippage(s)}
                className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                style={slippage === s ? { background: meta.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                {s}%
              </button>
            ))}
          </div>
        </div>

        {/* Mini order book */}
        <div className="space-y-1">
          <div className="text-xs text-white/30 uppercase tracking-widest">Order Book</div>
          <div className="rounded-xl overflow-hidden border border-white/5"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            {ORDER_BOOK_ASKS.slice().reverse().map(o => (
              <div key={o.price} className="relative flex justify-between px-3 py-1 text-xs">
                <div className="absolute inset-y-0 right-0 opacity-15 rounded"
                  style={{ width: `${(o.size / maxAskSize) * 60}%`, background: '#f87171' }} />
                <span style={{ color: '#f87171' }}>${o.price.toFixed(2)}</span>
                <span className="text-white/30">{o.size}</span>
              </div>
            ))}
            <div className="flex justify-between px-3 py-1.5 border-y border-white/8 bg-white/3">
              <span className="text-xs font-black" style={{ color: meta.color }}>${meta.price.toFixed(2)}</span>
              <span className="text-xs text-white/30">Last</span>
            </div>
            {ORDER_BOOK_BIDS.map(o => (
              <div key={o.price} className="relative flex justify-between px-3 py-1 text-xs">
                <div className="absolute inset-y-0 right-0 opacity-15 rounded"
                  style={{ width: `${(o.size / maxBidSize) * 60}%`, background: '#22c55e' }} />
                <span style={{ color: '#22c55e' }}>${o.price.toFixed(2)}</span>
                <span className="text-white/30">{o.size}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.88)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setStep('confirm')} disabled={!canTrade}
          className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
          style={{ background: side === 'buy' ? '#22c55e' : '#f87171', color: '#04040A' }}>
          {side === 'buy' ? `Buy ${amountNum || '—'} $${symbol}` : `Sell ${amountNum || '—'} $${symbol}`}
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
