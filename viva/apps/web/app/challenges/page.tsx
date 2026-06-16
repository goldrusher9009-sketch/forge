'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CHALLENGES = [
  {
    id: 'c1', title: '30-Day Posting Streak', category: 'Creator',
    color: '#a855f7', icon: '🔥',
    reward: { type: 'token', amount: 500, symbol: 'VIVA' },
    desc: 'Post at least one piece of content every day for 30 consecutive days. Builds audience momentum and unlocks the Creator badge.',
    participants: 842, completions: 201,
    duration: '30 days', ends: '2026-07-01',
    myProgress: 14, myTarget: 30, joined: true,
  },
  {
    id: 'c2', title: 'Token Holder Recruitment', category: 'Token Economy',
    color: '#f59e0b', icon: '⬡',
    reward: { type: 'token', amount: 1000, symbol: 'VIVA' },
    desc: 'Grow your token holder base by 50 new holders this month. Includes bonus APY boost for Gold+ stakers.',
    participants: 213, completions: 44,
    duration: 'June 2026', ends: '2026-06-30',
    myProgress: 38, myTarget: 50, joined: true,
  },
  {
    id: 'c3', title: 'ZK Health 7-Day Protocol', category: 'Health',
    color: '#22c55e', icon: '🧬',
    reward: { type: 'badge', amount: 0, symbol: 'Verified Athlete Badge' },
    desc: 'Complete a ZK-verified 7-day health protocol: daily HRV, sleep, and activity submissions.',
    participants: 1204, completions: 567,
    duration: 'Rolling 7 days', ends: null,
    myProgress: 3, myTarget: 7, joined: false,
  },
  {
    id: 'c4', title: 'Community Governance Sprint', category: 'Governance',
    color: '#818cf8', icon: '⚖️',
    reward: { type: 'token', amount: 250, symbol: 'VIVA' },
    desc: 'Vote on 5 active proposals and leave a comment on at least 2. Shape the future of VIVA.',
    participants: 380, completions: 122,
    duration: '2 weeks', ends: '2026-06-28',
    myProgress: 3, myTarget: 5, joined: true,
  },
  {
    id: 'c5', title: 'Referral Blitz', category: 'Growth',
    color: '#ec4899', icon: '📣',
    reward: { type: 'token', amount: 750, symbol: 'VIVA' },
    desc: 'Refer 10 new active users to VIVA within 2 weeks. Active = made a post or staked tokens.',
    participants: 560, completions: 98,
    duration: '2 weeks', ends: '2026-07-07',
    myProgress: 0, myTarget: 10, joined: false,
  },
  {
    id: 'c6', title: 'First Marketplace Sale', category: 'Creator',
    color: '#a855f7', icon: '🛍️',
    reward: { type: 'token', amount: 200, symbol: 'VIVA' },
    desc: 'List and sell your first digital product or service on the VIVA Marketplace.',
    participants: 94, completions: 29,
    duration: 'Ongoing', ends: null,
    myProgress: 0, myTarget: 1, joined: false,
  },
]

export default function ChallengesPage() {
  const router = useRouter()
  const [joined, setJoined] = useState<Set<string>>(new Set(['c1', 'c2', 'c4']))
  const [loading, setLoading] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'joined'>('active')
  const [txMsg, setTxMsg] = useState<string | null>(null)

  async function handleJoin(id: string, title: string) {
    setLoading(id)
    await new Promise(r => setTimeout(r, 700))
    setJoined(prev => new Set([...prev, id]))
    setLoading(null)
    setTxMsg(`Joined: ${title}`)
    setTimeout(() => setTxMsg(null), 3500)
  }

  const displayed = tab === 'joined'
    ? CHALLENGES.filter(c => joined.has(c.id))
    : CHALLENGES

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
            <p className="text-xs text-white/30 tracking-widest">COMMUNITY</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Challenges</h1>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([{ id: 'active', label: '⚡ All Challenges' }, { id: 'joined', label: `✓ My Challenges (${joined.size})` }] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {displayed.length === 0 && (
          <div className="text-center py-16 text-white/25 text-sm">No challenges joined yet</div>
        )}

        {displayed.map(c => {
          const isJoined = joined.has(c.id)
          const pct = Math.min(100, Math.round((c.myProgress / c.myTarget) * 100))
          const completionRate = Math.round((c.completions / c.participants) * 100)
          return (
            <div key={c.id} className="p-4 rounded-2xl border border-white/6"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${c.color}14` }}>{c.icon}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <span className="text-xs font-semibold mr-2" style={{ color: c.color }}>{c.category}</span>
                      <div className="font-bold text-white leading-snug mt-0.5">{c.title}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black" style={{ color: c.reward.type === 'token' ? '#f59e0b' : '#818cf8' }}>
                        {c.reward.type === 'token' ? `+${c.reward.amount}` : '🏅'}
                      </div>
                      <div className="text-xs text-white/30">{c.reward.type === 'token' ? c.reward.symbol : 'Badge'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/45 mb-3 leading-relaxed">{c.desc}</p>

              {isJoined && (
                <div className="mb-3 p-3 rounded-xl" style={{ background: `${c.color}0d` }}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: c.color }}>My Progress</span>
                    <span className="text-white/40">{c.myProgress} / {c.myTarget}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                  <div className="text-xs text-right mt-1" style={{ color: c.color }}>{pct}% complete</div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-white/25 mb-3">
                <span>👤 {c.participants.toLocaleString()} participants</span>
                <span>{completionRate}% completion rate</span>
                {c.ends && <span>Ends {c.ends.slice(5)}</span>}
              </div>

              <button
                onClick={() => !isJoined && handleJoin(c.id, c.title)}
                disabled={loading === c.id || isJoined}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-70"
                style={isJoined
                  ? { background: `${c.color}14`, color: c.color, border: `1px solid ${c.color}30` }
                  : { background: c.color, color: '#04040A' }}>
                {loading === c.id ? 'Joining…' : isJoined ? '✓ Joined — In Progress' : 'Join Challenge'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
