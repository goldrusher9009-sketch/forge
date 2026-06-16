'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GRANTS = [
  {
    id: 'g1', title: 'Emerging Creator Grant', amount: 5000, currency: 'USDC', slots: 4, remaining: 2,
    deadline: '2026-07-01', category: 'Content', status: 'open', color: '#22c55e',
    desc: 'For creators with <6 months on VIVA showing exceptional growth. Covers content equipment, tools, and 3 months of boosted reach.',
    requirements: ['≥50 token holders', 'Active for 30+ days', '500+ V-Score'],
    applied: false,
  },
  {
    id: 'g2', title: 'Token Economy Builder', amount: 10000, currency: 'USDC', slots: 2, remaining: 1,
    deadline: '2026-06-25', category: 'Tokenomics', status: 'open', color: '#f59e0b',
    desc: 'For Guardian-tier creators ready to build advanced token mechanics — staking tiers, governance tokens, burn mechanisms.',
    requirements: ['Guardian tier', '≥200 token holders', '800+ V-Score'],
    applied: true,
  },
  {
    id: 'g3', title: 'ZK Health Pioneer', amount: 7500, currency: 'USDC', slots: 3, remaining: 3,
    deadline: '2026-07-15', category: 'Health ZK', status: 'open', color: '#818cf8',
    desc: 'Grants for creators building verifiable health journeys using zero-knowledge proof stacks on VIVA.',
    requirements: ['Health ZK profile active', '100+ followers', 'Submit health ZK plan'],
    applied: false,
  },
  {
    id: 'g4', title: 'Community Growth Fund', amount: 3000, currency: 'USDC', slots: 10, remaining: 0,
    deadline: '2026-06-01', category: 'Community', status: 'closed', color: '#94a3b8',
    desc: 'Closed. Funded 10 creators in the VIVA referral acceleration program.',
    requirements: [], applied: false,
  },
]

const FUNDED = [
  { handle: 'mayafit', name: 'Maya Chen', grant: 'Emerging Creator', amount: 5000, ts: '2026-04-01' },
  { handle: 'alexwave', name: 'Alex Wave', grant: 'ZK Health Pioneer', amount: 7500, ts: '2026-03-15' },
  { handle: 'luna_apex', name: 'Luna Apex', grant: 'Community Growth', amount: 3000, ts: '2026-03-01' },
]

export default function GrantsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'open' | 'funded'>('open')
  const [applying, setApplying] = useState<string | null>(null)
  const [applied, setApplied] = useState<Set<string>>(new Set(['g2']))
  const [loading, setLoading] = useState<string | null>(null)
  const [txMsg, setTxMsg] = useState<string | null>(null)

  const treasury = 284500
  const allocated = GRANTS.filter(g => g.status === 'open').reduce((s, g) => s + g.amount * g.slots, 0)

  async function submitApplication(id: string) {
    setLoading(id)
    await new Promise(r => setTimeout(r, 900))
    setApplied(prev => new Set([...prev, id]))
    setLoading(null)
    setApplying(null)
    setTxMsg('Application submitted — review in 5-7 days')
    setTimeout(() => setTxMsg(null), 4000)
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
            <p className="text-xs text-white/30 tracking-widest">DAO TREASURY</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Creator Grants</h1>
          </div>
          <button onClick={() => router.push('/dao')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: '#818cf818', color: '#818cf8', border: '1px solid #818cf825' }}>
            DAO ↗
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Treasury */}
        <div className="p-4 rounded-2xl border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(129,140,248,0.05))' }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Treasury',  val: `$${(treasury/1000).toFixed(0)}k`, color: '#22c55e' },
              { label: 'Allocated', val: `$${(allocated/1000).toFixed(0)}k`, color: '#f59e0b' },
              { label: 'Available', val: `$${((treasury-allocated)/1000).toFixed(0)}k`, color: '#818cf8' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-black" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-white/30">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([{ id: 'open', label: `◎ Open Grants` }, { id: 'funded', label: `✓ Funded Creators` }] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'open' && (
          <div className="space-y-3">
            {GRANTS.map(g => {
              const isApplied = applied.has(g.id)
              const isClosed = g.status === 'closed'
              return (
                <div key={g.id} className="p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)', opacity: isClosed ? 0.6 : 1 }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${g.color}18`, color: g.color }}>{g.category}</span>
                        {isClosed && <span className="text-xs text-white/25">Closed</span>}
                        {!isClosed && g.remaining < 2 && g.remaining > 0 && (
                          <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>⚡ {g.remaining} slot{g.remaining !== 1 ? 's' : ''} left</span>
                        )}
                        {g.remaining === 0 && !isClosed && <span className="text-xs" style={{ color: '#f87171' }}>Full</span>}
                      </div>
                      <div className="font-bold text-white">{g.title}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black" style={{ color: g.color }}>${(g.amount/1000).toFixed(0)}k</div>
                      <div className="text-xs text-white/30">{g.currency}</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/45 mb-3">{g.desc}</p>
                  {g.requirements.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {g.requirements.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-white/40">
                          <span style={{ color: g.color }}>✓</span><span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!isClosed && (
                    <div className="flex items-center justify-between text-xs text-white/25 mb-3">
                      <span>Deadline: {g.deadline}</span>
                      <span>{g.slots} slots total</span>
                    </div>
                  )}
                  {!isClosed && g.remaining > 0 && (
                    <button onClick={() => isApplied ? null : setApplying(g.id)}
                      className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={isApplied
                        ? { background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }
                        : { background: g.color, color: '#04040A' }}>
                      {isApplied ? '✓ Applied — Under Review' : 'Apply for Grant'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'funded' && (
          <div className="space-y-2">
            {FUNDED.map(f => (
              <div key={f.handle} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{f.name[0]}</div>
                <div className="flex-1">
                  <button onClick={() => router.push(`/profile/${f.handle}`)}
                    className="text-sm font-semibold text-white/80 hover:text-white transition-colors">{f.name}</button>
                  <div className="text-xs text-white/30">{f.grant} · {f.ts}</div>
                </div>
                <div className="font-bold text-green-400 text-sm">${f.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply modal */}
      {applying && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setApplying(null)}>
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4"
            style={{ background: '#0d0d1a' }} onClick={e => e.stopPropagation()}>
            <div className="font-bold text-white text-lg">Submit Application</div>
            <p className="text-sm text-white/50">Your profile data, V-Score, and token metrics will be included automatically. Add a short note about your plans:</p>
            <textarea rows={4} placeholder="What will you build with this grant?"
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/25 outline-none focus:border-white/20 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => submitApplication(applying)} disabled={loading === applying}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{ background: '#22c55e', color: '#04040A' }}>
                {loading === applying ? 'Submitting…' : 'Submit Application'}
              </button>
              <button onClick={() => setApplying(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
