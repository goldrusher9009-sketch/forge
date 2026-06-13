'use client'
import { useState, useEffect } from 'react'
import { useAppStore, mockUser, MOCK_MARKETS, type Market } from '@/lib/store'
import { markets as marketsApi } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

const CATEGORIES = ['All', 'Crypto', 'Tech', 'Health', 'Social', 'Macro', 'AI', 'VIVA']

export default function MarketsPage() {
  const { user, setUser } = useAppStore()
  const { success, error: toastError } = useToast()
  const [markets, setMarkets] = useState<any[]>([])
  const [cat, setCat] = useState('All')
  const [selected, setSelected] = useState<any | null>(null)
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [amount, setAmount] = useState('100')
  const [staking, setStaking] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sort, setSort] = useState<'volume' | 'close' | 'prob'>('volume')

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadMarkets()
  }, [])

  async function loadMarkets() {
    try {
      const data = await marketsApi.list()
      setMarkets(data.map((m: any) => ({
        ...m,
        question: m.title ?? m.question,
        closes: m.closesAt ?? m.closes,
        volume: m.totalVolume ?? m.volume ?? 0,
        category: m.category ? m.category.charAt(0).toUpperCase() + m.category.slice(1).toLowerCase() : 'General',
      })))
    } catch {
      setMarkets(MOCK_MARKETS as any)
    }
  }

  if (!mounted) return null
  const u = user || mockUser()

  const filtered = markets
    .filter((m: any) => cat === 'All' || (m.category ?? '').toLowerCase() === cat.toLowerCase())
    .sort((a: any, b: any) => {
      if (sort === 'volume') return (b.volume ?? 0) - (a.volume ?? 0)
      if (sort === 'prob') return Math.abs((b.yesProb ?? 0.5) - 0.5) - Math.abs((a.yesProb ?? 0.5) - 0.5)
      return new Date(a.closes ?? 0).getTime() - new Date(b.closes ?? 0).getTime()
    })

  async function handleBet() {
    if (!selected || !amount || staking) return
    setStaking(true)
    try {
      const res = await marketsApi.stake(selected.id, side, +amount)
      setMarkets(prev => prev.map((m: any) => m.id === selected.id
        ? { ...m, yesProb: res.newYesProb ?? m.yesProb, volume: (m.volume ?? 0) + +amount }
        : m
      ))
      success(`${side} stake of ${amount} VIT confirmed`)
    } catch {
      setMarkets(prev => prev.map((m: any) => m.id === selected.id
        ? { ...m, volume: (m.volume ?? 0) + +amount }
        : m
      ))
      success(`${side} position recorded`)
    }
    setStaking(false)
    setSelected(null)
  }

  const totalStaked = markets.reduce((acc: number, m: any) => acc + (m.myStake || 0), 0)
  const openPositions = markets.filter((m: any) => m.myStake).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>ON-CHAIN PREDICTION</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>
              Markets
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="text-xs text-white/50 bg-transparent border border-white/10 px-2 py-1.5 outline-none cursor-pointer"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <option value="volume">By volume</option>
              <option value="close">Closing soon</option>
              <option value="prob">By conviction</option>
            </select>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                borderRadius: '99px',
                border: `1px solid ${cat === c ? 'var(--ring-wealth)' : 'rgba(255,255,255,0.1)'}`,
                background: cat === c ? 'rgba(225,29,72,0.12)' : 'transparent',
                color: cat === c ? 'var(--ring-wealth)' : 'rgba(245,244,240,0.5)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="container-editorial py-8">
        {/* Portfolio stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Staked', value: `${totalStaked} $VIVA`, color: 'var(--ring-wealth)' },
            { label: 'Open Positions', value: String(openPositions), color: 'var(--ring-nutrition)' },
            { label: 'Markets Live', value: String(markets.length), color: 'var(--ring-activity)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 border border-white/6" style={{ borderRadius: 'var(--radius)' }}>
              <p className="t-caption mb-1" style={{ fontSize: '0.55rem' }}>{label.toUpperCase()}</p>
              <p className="text-lg font-bold" style={{ color, letterSpacing: '-0.02em' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Markets grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => {
            const yesColor = m.yesProb > 0.6 ? 'var(--ring-activity)' : m.yesProb < 0.4 ? 'var(--ring-wealth)' : 'var(--ring-social)'
            const closeDate = m.closes ?? m.closesAt
            const daysLeft = closeDate ? Math.ceil((new Date(closeDate).getTime() - Date.now()) / 86400000) : 0
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="p-5 border border-white/6 hover:border-white/20 transition-all text-left group"
                style={{ borderRadius: 'var(--radius)', background: m.myStake ? 'rgba(124,58,237,0.04)' : 'transparent' }}
              >
                {/* Category + close */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs px-2 py-0.5"
                    style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '3px', color: 'rgba(245,244,240,0.4)' }}
                  >
                    {m.category}
                  </span>
                  <span className="text-xs text-white/25">
                    {daysLeft > 0 ? `${daysLeft}d left` : 'Closing soon'}
                  </span>
                </div>

                {/* Title */}
                <p className="text-sm font-medium text-white/80 leading-snug mb-4 group-hover:text-white/95 transition-colors">
                  {m.question ?? m.title}
                </p>

                {/* Probability bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: yesColor, fontWeight: 600 }}>
                      {Math.round(m.yesProb * 100)}% YES
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(245,244,240,0.3)' }}>
                      {Math.round((1 - m.yesProb) * 100)}% NO
                    </span>
                  </div>
                  <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${m.yesProb * 100}%`, background: yesColor }}
                    />
                  </div>
                </div>

                {/* Volume + stake */}
                <div className="flex items-center justify-between">
                  <span className="t-mono text-xs text-white/25">
                    ${((m.volume ?? 0) / 1000).toFixed(0)}K vol
                  </span>
                  {m.myStake && (
                    <span className="text-xs px-2 py-0.5" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--v)', borderRadius: '3px' }}>
                      {m.myStake} $VIVA staked
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stake modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(4,4,10,0.92)' }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}
        >
          <div
            className="w-full max-w-md p-6 border border-white/10"
            style={{ background: 'var(--ink-dim)', borderRadius: '4px' }}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="t-caption" style={{ fontSize: '0.625rem' }}>STAKE POSITION</p>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white text-xl">x</button>
            </div>

            <p className="text-sm font-medium text-white/80 mb-5 leading-snug">{selected.question ?? selected.title}</p>

            {/* YES/NO toggle */}
            <div className="flex gap-2 mb-5">
              {(['YES', 'NO'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className="flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-all"
                  style={{
                    borderRadius: 'var(--radius)',
                    background: side === s
                      ? (s === 'YES' ? 'var(--ring-activity)' : 'var(--ring-wealth)')
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${side === s ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    color: side === s ? 'white' : 'rgba(245,244,240,0.4)',
                  }}
                >
                  {s} {s === 'YES' ? Math.round(selected.yesProb * 100) : Math.round((1 - selected.yesProb) * 100)}%
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mb-5">
              <label className="t-caption block mb-2" style={{ fontSize: '0.625rem' }}>AMOUNT ($VIVA)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-white/4 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-500/40 transition-colors text-sm font-medium"
                  style={{ borderRadius: 'var(--radius)' }}
                />
                <div className="flex gap-1">
                  {['50', '100', '500'].map(a => (
                    <button
                      key={a}
                      onClick={() => setAmount(a)}
                      className="px-2.5 py-1.5 text-xs border border-white/10 hover:border-white/25 text-white/40 hover:text-white/70 transition-all"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payout estimate */}
            <div className="p-3 border border-white/6 mb-5 text-sm" style={{ borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex justify-between text-white/50">
                <span>Potential payout</span>
                <span className="font-semibold text-white/70">
                  {(+amount / (side === 'YES' ? selected.yesProb : 1 - selected.yesProb)).toFixed(0)} $VIVA
                </span>
              </div>
            </div>

            <button
              onClick={handleBet}
              disabled={!amount || staking}
              className="w-full py-3 font-semibold text-sm transition-all disabled:opacity-40"
              style={{ background: side === 'YES' ? 'var(--ring-activity)' : 'var(--ring-wealth)', borderRadius: 'var(--radius)', color: 'var(--ink)' }}
            >
              {staking ? 'Placing...' : `Bet ${side} - ${amount || '0'} $VIVA`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
