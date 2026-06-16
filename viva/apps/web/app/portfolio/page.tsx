'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const HOLDINGS = [
  { symbol: 'SOVV', name: 'Sovereign V',  handle: 'sovereign_v', color: '#a855f7', qty: 120, price: 12.40, value: 1488, change24h: +8.2,  type: 'token' },
  { symbol: 'MAYA', name: 'Maya Chen',    handle: 'mayafit',     color: '#22c55e', qty: 250, price: 6.60,  value: 1650, change24h: +12.3, type: 'token' },
  { symbol: 'APEX', name: 'Luna Apex',    handle: 'luna_apex',   color: '#f59e0b', qty: 80,  price: 9.10,  value: 728,  change24h: -2.1,  type: 'token' },
  { symbol: 'ZERO', name: 'ZeroNode',     handle: 'zeronode',    color: '#818cf8', qty: 400, price: 3.20,  value: 1280, change24h: +5.5,  type: 'token' },
]

const STAKED = [
  { symbol: 'SOVV', name: 'Sovereign V', color: '#a855f7', staked: 500, value: 6200, apy: 22, tier: 'Gold',    rewards: 84.2 },
  { symbol: 'MAYA', name: 'Maya Chen',   color: '#22c55e', staked: 200, value: 1320, apy: 14, tier: 'Silver',  rewards: 12.4 },
]

const PURCHASES = [
  { id: 'p1', title: 'Token Economy Blueprint', seller: 'Sovereign V', price: 49, date: '2026-05-10', color: '#a855f7', icon: '📄' },
  { id: 'p2', title: 'MAYA Meal Plans',          seller: 'Maya Chen',   price: 29, date: '2026-04-22', color: '#22c55e', icon: '🥗' },
]

function AllocationRing({ data }: { data: { value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = 42, cx = 50, cy = 50, stroke = 11
  const circ = 2 * Math.PI * r
  let offset = 0
  const gap = 1.5
  return (
    <svg viewBox="0 0 100 100" width={120} height={120}>
      {data.map((d, i) => {
        const pct = d.value / total
        const dash = Math.max(0, pct * circ - gap)
        const seg = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={d.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset * circ + circ / 4}
            strokeLinecap="round" />
        )
        offset += pct
        return seg
      })}
      <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="rgba(255,255,255,0.02)" />
    </svg>
  )
}

export default function PortfolioPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'tokens' | 'staked' | 'purchases'>('tokens')

  const tokenValue = HOLDINGS.reduce((s, h) => s + h.value, 0)
  const stakedValue = STAKED.reduce((s, s2) => s + s2.value, 0)
  const purchasesValue = PURCHASES.reduce((s, p) => s + p.price, 0)
  const netWorth = tokenValue + stakedValue + purchasesValue
  const totalRewards = STAKED.reduce((s, s2) => s + s2.rewards, 0)

  const ringData = [
    { value: tokenValue, color: '#a855f7' },
    { value: stakedValue, color: '#f59e0b' },
    { value: purchasesValue, color: '#22c55e' },
  ]

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
            <p className="text-xs text-white/30 tracking-widest">ASSET OVERVIEW</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>My Portfolio</h1>
          </div>
          <button onClick={() => router.push('/invest')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: '#a855f718', color: '#a855f7', border: '1px solid #a855f725' }}>
            Trade ↗
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Net worth card */}
        <div className="p-5 rounded-2xl border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(34,197,94,0.05))' }}>
          <div className="flex items-center gap-4">
            <AllocationRing data={ringData} />
            <div className="flex-1">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Total Net Worth</div>
              <div className="text-3xl font-black text-white" style={{ letterSpacing: '-0.03em' }}>
                ${netWorth.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-green-400 mt-0.5">+$284 today (+3.8%)</div>
              <div className="mt-3 space-y-1">
                {[
                  { label: 'Tokens', val: tokenValue, color: '#a855f7' },
                  { label: 'Staked', val: stakedValue, color: '#f59e0b' },
                  { label: 'Purchases', val: purchasesValue, color: '#22c55e' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-white/40 flex-1">{s.label}</span>
                    <span className="font-semibold" style={{ color: s.color }}>${s.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Staking rewards banner */}
        <div className="p-3 rounded-xl flex items-center justify-between"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="text-sm text-white/60">Unclaimed staking rewards</div>
          <div className="flex items-center gap-3">
            <div className="font-black" style={{ color: '#f59e0b' }}>${totalRewards.toFixed(2)}</div>
            <button className="text-xs px-3 py-1.5 rounded-lg font-bold"
              style={{ background: '#f59e0b', color: '#04040A' }}>Claim</button>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([
            { id: 'tokens', label: '⬡ Tokens' },
            { id: 'staked', label: '🔒 Staked' },
            { id: 'purchases', label: '🛍️ Purchases' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'tokens' && (
          <div className="space-y-2">
            {HOLDINGS.map(h => (
              <div key={h.symbol} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${h.color}14`, color: h.color }}>{h.symbol[0]}</div>
                <div className="flex-1">
                  <button onClick={() => router.push(`/profile/${h.handle}`)}
                    className="text-sm font-bold text-white/85 hover:text-white transition-colors">{h.name}</button>
                  <div className="text-xs text-white/30">{h.qty} {h.symbol} · ${h.price.toFixed(2)}/token</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-white">${h.value.toLocaleString()}</div>
                  <div className={`text-xs font-semibold ${h.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.change24h >= 0 ? '+' : ''}{h.change24h}% 24h
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'staked' && (
          <div className="space-y-2">
            {STAKED.map(s => (
              <div key={s.symbol} className="p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{ background: `${s.color}14`, color: s.color }}>{s.symbol[0]}</div>
                    <div>
                      <div className="text-sm font-bold text-white">{s.name}</div>
                      <div className="text-xs text-white/30">{s.tier} Tier · {s.apy}% APY</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white">${s.value.toLocaleString()}</div>
                    <div className="text-xs text-white/30">{s.staked} staked</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Pending rewards</span>
                  <span className="font-bold" style={{ color: '#f59e0b' }}>${s.rewards.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'purchases' && (
          <div className="space-y-2">
            {PURCHASES.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${p.color}14` }}>{p.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white/85">{p.title}</div>
                  <div className="text-xs text-white/30">{p.seller} · {p.date}</div>
                </div>
                <div className="font-bold text-white/60 text-sm">${p.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
