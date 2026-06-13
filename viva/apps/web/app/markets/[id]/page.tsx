'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { markets as marketsApi } from '@/lib/api'

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [market, setMarket] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [staking, setStaking] = useState(false)
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [amount, setAmount] = useState(100)
  const [stakeResult, setStakeResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      marketsApi.get(id as string),
      marketsApi.myPositions().catch(() => []),
    ]).then(([m, pos]) => {
      setMarket(m)
      setPositions((pos as any[]).filter((p: any) => p.marketId === id))
    }).catch(() => setError('Market not found'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleStake() {
    if (!market) return
    setStaking(true)
    setError('')
    try {
      const res = await marketsApi.stake(id as string, side, amount)
      setStakeResult(res)
      // Refresh market
      const updated = await marketsApi.get(id as string)
      setMarket(updated)
      const pos = await marketsApi.myPositions().catch(() => [])
      setPositions((pos as any[]).filter((p: any) => p.marketId === id))
    } catch (e: any) {
      setError(e.message || 'Stake failed')
    } finally {
      setStaking(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
    </div>
  )

  if (error && !market) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--ink)' }}>
      <p className="text-white/40">Market not found</p>
      <button onClick={() => router.back()} className="t-caption text-white/60 hover:text-white">← Go back</button>
    </div>
  )

  const yesProb = market.yesProb ?? 0.5
  const noProb = 1 - yesProb
  const closesAt = market.closesAt ? new Date(market.closesAt) : null
  const isClosed = closesAt ? closesAt < new Date() : false
  const daysLeft = closesAt ? Math.max(0, Math.ceil((closesAt.getTime() - Date.now()) / 86400000)) : null
  const payout = amount / (side === 'YES' ? yesProb : noProb)

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.85)' }}>
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors mr-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="font-semibold text-sm truncate">{market.title}</span>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">

        {/* Title + meta */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {market.category && (
              <span className="t-caption px-2 py-0.5 rounded-full border border-white/10 text-white/40" style={{ fontSize: '0.6rem' }}>
                {market.category}
              </span>
            )}
            {isClosed ? (
              <span className="t-caption px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '0.6rem' }}>CLOSED</span>
            ) : daysLeft !== null && (
              <span className="t-caption px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ghost)', fontSize: '0.6rem' }}>
                {daysLeft}d left
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold leading-snug">{market.title}</h1>
          {market.description && <p className="text-sm text-white/50 mt-2 leading-relaxed">{market.description}</p>}
        </div>

        {/* Probability bar */}
        <div className="p-5 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>YES PROBABILITY</p>
              <p className="text-4xl font-bold font-mono mt-0.5" style={{ color: '#10B981' }}>
                {Math.round(yesProb * 100)}%
              </p>
            </div>
            <div className="text-right">
              <p className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>NO PROBABILITY</p>
              <p className="text-4xl font-bold font-mono mt-0.5" style={{ color: '#EF4444' }}>
                {Math.round(noProb * 100)}%
              </p>
            </div>
          </div>
          {/* Bar */}
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.3)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${yesProb * 100}%`, background: '#10B981' }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="t-caption text-green-400" style={{ fontSize: '0.6rem' }}>YES</span>
            <span className="t-caption text-red-400" style={{ fontSize: '0.6rem' }}>NO</span>
          </div>
          {/* Stats row */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
            <div>
              <p className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>VOLUME</p>
              <p className="font-mono font-semibold text-sm mt-0.5">{(market.totalVolume ?? 0).toLocaleString()} pts</p>
            </div>
            <div>
              <p className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>POSITIONS</p>
              <p className="font-mono font-semibold text-sm mt-0.5">{market._count?.positions ?? 0}</p>
            </div>
            {closesAt && (
              <div>
                <p className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>CLOSES</p>
                <p className="font-mono font-semibold text-sm mt-0.5">
                  {closesAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stake form */}
        {!isClosed && (
          <div className="p-5 rounded-2xl border border-white/5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>TAKE A POSITION</p>

            {/* YES / NO toggle */}
            <div className="flex gap-2">
              {(['YES', 'NO'] as const).map(s => (
                <button key={s} onClick={() => setSide(s)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: side === s
                      ? s === 'YES' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    border: side === s
                      ? `1px solid ${s === 'YES' ? '#10B981' : '#EF4444'}60`
                      : '1px solid rgba(255,255,255,0.06)',
                    color: side === s ? (s === 'YES' ? '#10B981' : '#EF4444') : 'var(--ghost)',
                  }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div>
              <label className="t-caption block mb-2" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>AMOUNT (points)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number" min={1} max={10000} value={amount}
                  onChange={e => setAmount(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
                  className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-white/30"
                />
                {[50, 100, 500].map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    className="px-3 py-2 rounded-xl text-xs font-mono transition-colors"
                    style={{ background: amount === v ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', color: 'var(--ghost)' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout preview */}
            <div className="flex justify-between text-sm px-1">
              <span className="text-white/40">Potential payout</span>
              <span className="font-mono font-semibold" style={{ color: side === 'YES' ? '#10B981' : '#EF4444' }}>
                {Math.round(payout).toLocaleString()} pts
              </span>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            {stakeResult && (
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-xs text-green-400 font-semibold">Position taken ✓</p>
                <p className="text-xs text-white/40 mt-0.5">
                  New probability: {Math.round((stakeResult.newProbability ?? stakeResult.newYesProb ?? yesProb) * 100)}% YES
                </p>
              </div>
            )}

            <button onClick={handleStake} disabled={staking}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{
                background: side === 'YES' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${side === 'YES' ? '#10B981' : '#EF4444'}40`,
                color: side === 'YES' ? '#10B981' : '#EF4444',
              }}>
              {staking ? 'Staking…' : `Stake ${amount} pts on ${side}`}
            </button>
          </div>
        )}

        {/* My positions */}
        {positions.length > 0 && (
          <div>
            <p className="t-caption mb-3" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>MY POSITIONS</p>
            <div className="space-y-2">
              {positions.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: p.side === 'YES' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p.side === 'YES' ? '#10B981' : '#EF4444' }}>
                      {p.side}
                    </span>
                    <span className="font-mono text-sm">{p.amount} pts</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-white/60">→ {Math.round(p.payout)} pts</p>
                    <p className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>
                      @{Math.round(p.price * 100)}¢
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
