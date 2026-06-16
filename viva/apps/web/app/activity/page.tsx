'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const EVENTS = [
  { id: 'e1',  type: 'buy',     actor: 'luna_apex',   actorName: 'Luna Apex',    subject: 'sovereign_v', subjectName: 'Sovereign V', detail: 'bought 120 SOVV',   amount: 1488,  ts: '1m ago',  color: '#22c55e' },
  { id: 'e2',  type: 'stake',   actor: 'zeronode',    actorName: 'ZeroNode',     subject: 'mayafit',     subjectName: 'Maya Chen',   detail: 'staked 500 MAYA',   amount: 3300,  ts: '4m ago',  color: '#818cf8' },
  { id: 'e3',  type: 'invest',  actor: 'aisham_x',    actorName: 'Aisham X',     subject: 'alexwave',    subjectName: 'Alex Wave',   detail: 'bought 200 ALEX',   amount: 1020,  ts: '9m ago',  color: '#22c55e' },
  { id: 'e4',  type: 'ad',      actor: 'whoop_brand', actorName: 'Whoop',        subject: 'sovereign_v', subjectName: 'Sovereign V', detail: 'booked ad slot',    amount: 4900,  ts: '12m ago', color: '#ec4899' },
  { id: 'e5',  type: 'sell',    actor: 'nate_r',      actorName: 'Nate Rivers',  subject: 'luna_apex',   subjectName: 'Luna Apex',   detail: 'sold 50 LUNA',      amount: 210,   ts: '18m ago', color: '#f87171' },
  { id: 'e6',  type: 'claim',   actor: 'alexwave',    actorName: 'Alex Wave',    subject: null,          subjectName: null,          detail: 'claimed $54 rewards', amount: 54,  ts: '22m ago', color: '#f59e0b' },
  { id: 'e7',  type: 'buy',     actor: 'kira_void',   actorName: 'Kira Void',    subject: 'zeronode',    subjectName: 'ZeroNode',    detail: 'bought 300 ZERO',   amount: 690,   ts: '31m ago', color: '#22c55e' },
  { id: 'e8',  type: 'vote',    actor: 'mayafit',     actorName: 'Maya Chen',    subject: null,          subjectName: null,          detail: 'voted on Creator Grants proposal', amount: 0, ts: '44m ago', color: '#818cf8' },
  { id: 'e9',  type: 'stake',   actor: 'sovereign_v', actorName: 'Sovereign V',  subject: 'luna_apex',   subjectName: 'Luna Apex',   detail: 'staked 200 LUNA',   amount: 840,   ts: '1h ago',  color: '#818cf8' },
  { id: 'e10', type: 'ad',      actor: 'nike_brand',  actorName: 'Nike',         subject: 'mayafit',     subjectName: 'Maya Chen',   detail: 'booked story slot', amount: 6200,  ts: '2h ago',  color: '#ec4899' },
  { id: 'e11', type: 'buy',     actor: 'luna_apex',   actorName: 'Luna Apex',    subject: 'alexwave',    subjectName: 'Alex Wave',   detail: 'bought 80 ALEX',    amount: 408,   ts: '3h ago',  color: '#22c55e' },
  { id: 'e12', type: 'sell',    actor: 'aisham_x',    actorName: 'Aisham X',     subject: 'sovereign_v', subjectName: 'Sovereign V', detail: 'sold 30 SOVV',      amount: 372,   ts: '4h ago',  color: '#f87171' },
]

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  buy:    { icon: '↓', label: 'Buy',    color: '#22c55e' },
  sell:   { icon: '↑', label: 'Sell',   color: '#f87171' },
  stake:  { icon: '⬡', label: 'Stake',  color: '#818cf8' },
  invest: { icon: '◈', label: 'Invest', color: '#a855f7' },
  ad:     { icon: '⊕', label: 'Ad',     color: '#ec4899' },
  claim:  { icon: '✓', label: 'Claim',  color: '#f59e0b' },
  vote:   { icon: '◎', label: 'Vote',   color: '#818cf8' },
}

const ALL_TYPES = ['all', 'buy', 'sell', 'stake', 'ad', 'vote', 'claim']

export default function ActivityPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? EVENTS : EVENTS.filter(e => e.type === filter)

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
            <p className="text-xs text-white/30 tracking-widest">YOUTOKEN</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Live Activity</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            <span className="text-xs text-white/40">Live</span>
          </div>
        </div>
        {/* Filter strip */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {ALL_TYPES.map(t => {
            const meta = t === 'all' ? null : TYPE_META[t]
            const active = filter === t
            return (
              <button key={t} onClick={() => setFilter(t)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
                style={active
                  ? { background: meta?.color ?? '#a855f7', color: '#04040A' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                {meta ? `${meta.icon} ${meta.label}` : 'All'}
              </button>
            )
          })}
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {filtered.map(ev => {
          const meta = TYPE_META[ev.type]
          return (
            <div key={ev.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-white/4 hover:bg-white/2 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: `${meta.color}18`, color: meta.color }}>
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <button onClick={() => router.push(`/profile/${ev.actor}`)}
                  className="font-bold hover:opacity-80 transition-opacity" style={{ color: meta.color }}>
                  {ev.actorName}
                </button>
                <span className="text-white/40"> {ev.detail}</span>
                {ev.subject && (
                  <>
                    <span className="text-white/25"> on </span>
                    <button onClick={() => router.push(`/profile/${ev.subject!}`)}
                      className="font-semibold text-white/60 hover:text-white/80 transition-colors">
                      {ev.subjectName}
                    </button>
                  </>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {ev.amount > 0 && (
                  <div className="text-xs font-bold text-white/60">${ev.amount.toLocaleString()}</div>
                )}
                <div className="text-xs text-white/25">{ev.ts}</div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-white/30 text-sm">No {filter} activity</div>
        )}
      </div>
    </div>
  )
}
