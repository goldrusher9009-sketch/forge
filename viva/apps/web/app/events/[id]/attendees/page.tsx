'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Attendee {
  handle: string
  name: string
  color: string
  verified: boolean
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | null
  tokenHeld: number
  tokenSymbol: string
  rsvp: 'going' | 'maybe' | 'waitlist'
  checkedIn: boolean
  joinedAgo?: string
}

const EVENTS: Record<string, { title: string; color: string; tokenSymbol: string; date: string; capacity: number }> = {
  ev1: { title: 'DeFi Alpha Summit',     color: '#a855f7', tokenSymbol: 'SVRN', date: 'Jun 20, 2026', capacity: 200 },
  ev2: { title: 'Beats & Vibes Release', color: '#ec4899', tokenSymbol: 'JAX',  date: 'Jun 25, 2026', capacity: 150 },
}

const EVENT_ATTENDEES: Record<string, Attendee[]> = {
  ev1: [
    { handle: 'atlas_k',   name: 'Atlas K',   color: '#818cf8', verified: true,  tier: 'Diamond', tokenHeld: 80,  tokenSymbol: 'SVRN', rsvp: 'going',    checkedIn: false },
    { handle: 'luna_w',    name: 'Luna W.',   color: '#f87171', verified: false, tier: 'Gold',    tokenHeld: 60,  tokenSymbol: 'SVRN', rsvp: 'going',    checkedIn: false },
    { handle: 'noa_d',     name: 'Noa D.',    color: '#f59e0b', verified: false, tier: 'Silver',  tokenHeld: 35,  tokenSymbol: 'SVRN', rsvp: 'going',    checkedIn: false },
    { handle: 'kai_r',     name: 'Kai R.',    color: '#22c55e', verified: false, tier: 'Bronze',  tokenHeld: 12,  tokenSymbol: 'SVRN', rsvp: 'going',    checkedIn: false },
    { handle: 'marco_v',   name: 'Marco V.',  color: '#f87171', verified: false, tier: 'Bronze',  tokenHeld: 14,  tokenSymbol: 'SVRN', rsvp: 'maybe',    checkedIn: false },
    { handle: 'jade_l',    name: 'Jade L.',   color: '#a855f7', verified: false, tier: 'Silver',  tokenHeld: 28,  tokenSymbol: 'SVRN', rsvp: 'maybe',    checkedIn: false },
    { handle: 'dex_n',     name: 'Dex N.',    color: '#818cf8', verified: false, tier: null,      tokenHeld: 0,   tokenSymbol: 'SVRN', rsvp: 'waitlist', checkedIn: false },
    { handle: 'sam_q',     name: 'Sam Q.',    color: '#22c55e', verified: false, tier: null,      tokenHeld: 0,   tokenSymbol: 'SVRN', rsvp: 'waitlist', checkedIn: false },
    { handle: 'lily_p',    name: 'Lily P.',   color: '#f59e0b', verified: true,  tier: 'Gold',    tokenHeld: 72,  tokenSymbol: 'SVRN', rsvp: 'going',    checkedIn: false },
    { handle: 'max_t',     name: 'Max T.',    color: '#ec4899', verified: false, tier: 'Silver',  tokenHeld: 30,  tokenSymbol: 'SVRN', rsvp: 'going',    checkedIn: false },
  ],
}

const RSVP_COLOR: Record<string, string> = { going: '#22c55e', maybe: '#f59e0b', waitlist: '#818cf8' }
const TIER_COLOR: Record<string, string> = { Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309' }

export default function EventAttendeesPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'ev1'
  const event = EVENTS[id] ?? EVENTS.ev1
  const all = EVENT_ATTENDEES[id] ?? EVENT_ATTENDEES.ev1

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'going' | 'maybe' | 'waitlist'>('all')

  let attendees = all
  if (search) attendees = attendees.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.handle.includes(search.toLowerCase()))
  if (filter !== 'all') attendees = attendees.filter(a => a.rsvp === filter)

  const going = all.filter(a => a.rsvp === 'going').length
  const maybe = all.filter(a => a.rsvp === 'maybe').length
  const waitlist = all.filter(a => a.rsvp === 'waitlist').length
  const capPct = (going / event.capacity) * 100

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
          <div>
            <div className="font-black text-white">Attendees</div>
            <div className="text-xs text-white/30">{event.title} · {event.date}</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Capacity bar */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/35 font-semibold uppercase tracking-wider">Capacity</span>
            <span className="text-sm font-black text-white/70">{going} / {event.capacity}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${capPct}%`, background: capPct > 85 ? '#f87171' : event.color }} />
          </div>
          <div className="text-xs text-white/20 mt-1">{capPct.toFixed(0)}% full</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Going',     value: going,    color: '#22c55e' },
            { label: 'Maybe',     value: maybe,    color: '#f59e0b' },
            { label: 'Waitlist',  value: waitlist, color: '#818cf8' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search attendees…"
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />

        {/* Filter */}
        <div className="flex gap-1.5">
          {(['all', 'going', 'maybe', 'waitlist'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
              style={filter === f ? { background: event.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Attendee list */}
        <div className="space-y-2">
          {attendees.map(a => (
            <button key={a.handle} onClick={() => router.push(`/profile/${a.handle}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${a.color}15`, color: a.color }}>
                {a.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/80">{a.name}</span>
                  {a.verified && <span className="text-xs" style={{ color: event.color }}>✓</span>}
                  {a.tier && <span className="text-xs" style={{ color: TIER_COLOR[a.tier] }}>{a.tier[0]}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: RSVP_COLOR[a.rsvp] }}>{a.rsvp}</span>
                  {a.tokenHeld > 0 && (
                    <>
                      <span className="text-white/15 text-xs">·</span>
                      <span className="text-xs text-white/25">{a.tokenHeld} ${a.tokenSymbol}</span>
                    </>
                  )}
                </div>
              </div>
              {a.checkedIn && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>In</span>
              )}
            </button>
          ))}
        </div>

        {/* Export CTA */}
        <button className="w-full py-3 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
          Export attendee list →
        </button>
      </div>
    </div>
  )
}
