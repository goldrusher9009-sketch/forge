'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CAMPAIGNS = [
  {
    id: 'a1', name: 'VIVA Genesis Drop', symbol: 'VIVA', tokenColor: '#a855f7',
    totalSupply: 500000, distributed: 320000, claimAmount: 250,
    criteria: 'Early adopters: joined before 2026-05-01',
    deadline: '2026-07-01', status: 'claimable',
    myEligible: true, myClaimed: false,
    desc: 'Rewarding the first 2,000 creators on the VIVA platform.',
  },
  {
    id: 'a2', name: 'Staker Loyalty Airdrop', symbol: 'SOVV', tokenColor: '#f59e0b',
    totalSupply: 100000, distributed: 40000, claimAmount: 120,
    criteria: 'Staked ≥100 SOVV tokens for 30+ days',
    deadline: '2026-06-30', status: 'claimable',
    myEligible: true, myClaimed: true,
    desc: 'Loyalty rewards for long-term SOVV stakers. Thank you for securing the network.',
  },
  {
    id: 'a3', name: 'Referral Amplifier Drop', symbol: 'MAYA', tokenColor: '#22c55e',
    totalSupply: 50000, distributed: 0, claimAmount: 80,
    criteria: 'Referred ≥5 active users in June 2026',
    deadline: '2026-07-15', status: 'upcoming',
    myEligible: false, myClaimed: false,
    desc: 'Rewarding top referrers with MAYA tokens. Campaign opens July 1st.',
  },
  {
    id: 'a4', name: 'Diamond Holder Bonus', symbol: 'VIVA', tokenColor: '#818cf8',
    totalSupply: 200000, distributed: 200000, claimAmount: 500,
    criteria: 'Diamond tier stakers during May 2026',
    deadline: '2026-05-31', status: 'ended',
    myEligible: false, myClaimed: false,
    desc: 'Ended. 400 Diamond stakers received 500 VIVA each.',
  },
]

const HISTORY = [
  { id: 'h1', campaign: 'Staker Loyalty Airdrop', symbol: 'SOVV', amount: 120, ts: '2026-06-10', color: '#f59e0b' },
  { id: 'h2', campaign: 'Beta Tester Drop', symbol: 'VIVA', amount: 100, ts: '2026-05-01', color: '#a855f7' },
]

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function AirdropPage() {
  const router = useRouter()
  const [claimed, setClaimed] = useState<Set<string>>(new Set(['a2']))
  const [loading, setLoading] = useState<string | null>(null)
  const [txMsg, setTxMsg] = useState<{ id: string; amt: number; sym: string } | null>(null)
  const [tab, setTab] = useState<'live' | 'history'>('live')

  async function handleClaim(id: string, amount: number, symbol: string) {
    setLoading(id)
    await new Promise(r => setTimeout(r, 1100))
    setClaimed(prev => new Set([...prev, id]))
    setLoading(null)
    setTxMsg({ id, amt: amount, sym: symbol })
    setTimeout(() => setTxMsg(null), 4000)
  }

  const totalClaimed = HISTORY.reduce((s, h) => s + h.amount, 0)

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
            <p className="text-xs text-white/30 tracking-widest">TOKEN DROPS</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Airdrop</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Summary */}
        <div className="p-4 rounded-2xl border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(129,140,248,0.05))' }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Received', val: `${totalClaimed + 120} VIVA`, color: '#a855f7' },
              { label: 'Claimable Now', val: `250 VIVA`, color: '#22c55e' },
              { label: 'Upcoming', val: `1 Drop`, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-sm font-black leading-tight" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ Claimed {txMsg.amt} {txMsg.sym} — added to wallet
          </div>
        )}

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([{ id: 'live', label: '🪂 Campaigns' }, { id: 'history', label: '◎ My History' }] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'live' && (
          <div className="space-y-3">
            {CAMPAIGNS.map(c => {
              const isClaimed = claimed.has(c.id)
              const pct = Math.round((c.distributed / c.totalSupply) * 100)
              const statusColor = c.status === 'claimable' ? '#22c55e' : c.status === 'upcoming' ? '#f59e0b' : '#94a3b8'
              const statusLabel = c.status === 'claimable' ? 'Claimable' : c.status === 'upcoming' ? 'Upcoming' : 'Ended'
              return (
                <div key={c.id} className="p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)', opacity: c.status === 'ended' ? 0.55 : 1 }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${statusColor}18`, color: statusColor }}>{statusLabel}</span>
                        {c.myEligible && c.status !== 'ended' && (
                          <span className="text-xs font-bold" style={{ color: '#22c55e' }}>✓ Eligible</span>
                        )}
                        {!c.myEligible && c.status !== 'ended' && (
                          <span className="text-xs text-white/25">Not eligible</span>
                        )}
                      </div>
                      <div className="font-bold text-white">{c.name}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black" style={{ color: c.tokenColor }}>{c.claimAmount}</div>
                      <div className="text-xs text-white/30">{c.symbol}</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mb-3">{c.desc}</p>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>{c.criteria}</span>
                      <span>{pct}% claimed</span>
                    </div>
                    <ProgressBar value={c.distributed} max={c.totalSupply} color={c.tokenColor} />
                  </div>
                  {c.status !== 'ended' && (
                    <div className="text-xs text-white/25 mb-3">Deadline: {c.deadline}</div>
                  )}
                  {c.myEligible && c.status === 'claimable' && (
                    <button onClick={() => !isClaimed && handleClaim(c.id, c.claimAmount, c.symbol)}
                      disabled={loading === c.id || isClaimed}
                      className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                      style={isClaimed
                        ? { background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }
                        : { background: c.tokenColor, color: '#04040A' }}>
                      {loading === c.id ? 'Claiming…' : isClaimed ? '✓ Claimed' : `Claim ${c.claimAmount} ${c.symbol}`}
                    </button>
                  )}
                  {(!c.myEligible || c.status === 'upcoming') && c.status !== 'ended' && (
                    <div className="w-full py-2.5 rounded-xl text-center text-xs text-white/25"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {c.status === 'upcoming' ? `Opens ${c.deadline.slice(0,7)}` : 'Requirements not met'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {HISTORY.length === 0 ? (
              <div className="text-center text-white/25 py-12 text-sm">No airdrops claimed yet</div>
            ) : HISTORY.map(h => (
              <div key={h.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
                  style={{ background: `${h.color}18`, color: h.color }}>🪂</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white/80">{h.campaign}</div>
                  <div className="text-xs text-white/30">{h.ts}</div>
                </div>
                <div className="font-bold text-sm" style={{ color: h.color }}>+{h.amount} {h.symbol}</div>
              </div>
            ))}
            <div className="p-4 rounded-2xl border border-white/6 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 mb-1">Total tokens received</div>
              <div className="text-2xl font-black" style={{ color: '#a855f7' }}>{totalClaimed + 120}</div>
              <div className="text-xs text-white/25">across all airdrops</div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.push('/wallet')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
            My Wallet
          </button>
          <button onClick={() => router.push('/staking')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: '#a855f7', color: '#04040A' }}>
            Stake Tokens ↗
          </button>
        </div>
      </div>
    </div>
  )
}
