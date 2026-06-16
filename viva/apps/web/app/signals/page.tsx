'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SIGNALS = [
  {
    id: 's1', symbol: 'SOVV', name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7',
    signal: 'BUY', confidence: 92, price: 12.40, target: 18.00, change24h: +8.2,
    rationale: 'Guardian tier milestone in 48h. Token holder count up 22% WoW. New ad slot signed with Whoop. Staking TVL hit ATH.',
    factors: [
      { label: 'Holder Growth', score: 95, positive: true },
      { label: 'Ad Revenue',   score: 88, positive: true },
      { label: 'Staking TVL',  score: 90, positive: true },
      { label: 'Social Reach', score: 84, positive: true },
    ],
    timeframe: '2-4 weeks', vol24h: 84200, ts: '2m ago',
  },
  {
    id: 's2', symbol: 'MAYA', name: 'Maya Chen', handle: 'mayafit', color: '#22c55e',
    signal: 'STRONG BUY', confidence: 96, price: 6.60, target: 12.00, change24h: +12.3,
    rationale: 'Summer fitness season driving massive organic growth. Course launch next week. Diamond stakers up 31%.',
    factors: [
      { label: 'Engagement',   score: 98, positive: true },
      { label: 'New Content',  score: 95, positive: true },
      { label: 'Seasonality',  score: 91, positive: true },
      { label: 'Token Supply', score: 80, positive: false },
    ],
    timeframe: '1-3 weeks', vol24h: 61800, ts: '15m ago',
  },
  {
    id: 's3', symbol: 'APEX', name: 'Luna Apex', handle: 'luna_apex', color: '#f59e0b',
    signal: 'HOLD', confidence: 61, price: 9.10, target: 9.80, change24h: -2.1,
    rationale: 'Content cadence dropped 40% vs last month. Ad revenue stable but no new brands. Awaiting IRL event uplift.',
    factors: [
      { label: 'Post Frequency', score: 45, positive: false },
      { label: 'Ad Revenue',     score: 72, positive: true },
      { label: 'IRL Events',     score: 80, positive: true },
      { label: 'Holder Churn',   score: 55, positive: false },
    ],
    timeframe: '3-6 weeks', vol24h: 18400, ts: '1h ago',
  },
  {
    id: 's4', symbol: 'ZERO', name: 'ZeroNode', handle: 'zeronode', color: '#818cf8',
    signal: 'BUY', confidence: 78, price: 3.20, target: 5.50, change24h: +5.5,
    rationale: 'ZK privacy narrative gaining traction. Masterclass launch drove 145 new holders. Governance activity up.',
    factors: [
      { label: 'Narrative',     score: 88, positive: true },
      { label: 'New Holders',   score: 82, positive: true },
      { label: 'Price Action',  score: 74, positive: true },
      { label: 'Market Cap',    score: 60, positive: false },
    ],
    timeframe: '4-8 weeks', vol24h: 29600, ts: '3h ago',
  },
]

const SIG_COLORS: Record<string, string> = {
  'STRONG BUY': '#22c55e',
  'BUY': '#4ade80',
  'HOLD': '#f59e0b',
  'SELL': '#f87171',
  'STRONG SELL': '#ef4444',
}

function ConfidenceBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}%</span>
    </div>
  )
}

export default function SignalsPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'buy' | 'hold' | 'sell'>('all')

  const filtered = SIGNALS.filter(s => {
    if (filter === 'all') return true
    if (filter === 'buy') return s.signal.includes('BUY')
    if (filter === 'hold') return s.signal === 'HOLD'
    if (filter === 'sell') return s.signal.includes('SELL')
    return true
  })

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">AI INTELLIGENCE</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Trading Signals</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            <span className="text-xs text-white/35">Live</span>
          </div>
        </div>
        <div className="flex gap-2">
          {([
            { id: 'all', label: 'All' },
            { id: 'buy', label: '▲ Buy' },
            { id: 'hold', label: '— Hold' },
            { id: 'sell', label: '▼ Sell' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={filter === f.id
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        <div className="p-3 rounded-xl text-xs text-white/30"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          ⚠️ Signals are AI-generated from on-chain + social data. Not financial advice. DYOR.
        </div>

        {filtered.map(s => {
          const sigColor = SIG_COLORS[s.signal] || '#94a3b8'
          const isExpanded = expanded === s.id
          const upside = ((s.target - s.price) / s.price * 100).toFixed(0)
          return (
            <div key={s.id} className="rounded-2xl border border-white/6 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : s.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: `${s.color}14`, color: s.color }}>{s.symbol[0]}</div>
                    <div>
                      <button onClick={e => { e.stopPropagation(); router.push(`/profile/${s.handle}`) }}
                        className="text-sm font-bold text-white/85 hover:text-white transition-colors">{s.name}</button>
                      <div className="text-xs text-white/30">${s.symbol} · {s.ts}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg font-black"
                      style={{ background: `${sigColor}18`, color: sigColor }}>{s.signal}</span>
                    <span className="text-xs text-white/25">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Price', val: `$${s.price}`, color: 'white' },
                    { label: 'Target', val: `$${s.target}`, color: sigColor },
                    { label: 'Upside', val: `+${upside}%`, color: sigColor },
                    { label: 'Confidence', val: `${s.confidence}%`, color: s.color },
                  ].map(m => (
                    <div key={m.label} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="text-xs font-bold" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-xs text-white/25 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/6 pt-3 space-y-3">
                  <p className="text-xs text-white/50 leading-relaxed">{s.rationale}</p>
                  <div className="space-y-2">
                    <div className="text-xs text-white/30 uppercase tracking-widest">Signal Factors</div>
                    {s.factors.map(f => (
                      <div key={f.label} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-white/40">{f.label}</div>
                        <div className="flex-1">
                          <ConfidenceBar score={f.score} color={f.positive ? '#22c55e' : '#f87171'} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/30">
                    <span>Timeframe: {s.timeframe}</span>
                    <span>24h vol: ${(s.vol24h/1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/invest`)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                      style={{ background: s.color, color: '#04040A' }}>
                      Buy ${s.symbol}
                    </button>
                    <button onClick={() => router.push(`/watchlist`)}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Watchlist +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
