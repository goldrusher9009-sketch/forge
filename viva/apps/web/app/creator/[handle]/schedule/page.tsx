'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type EventType = 'live' | 'post' | 'drop' | 'ama' | 'workshop'

interface ScheduledItem {
  id: string
  type: EventType
  title: string
  date: string
  time: string
  day: string
  month: string
  tokenGated: boolean
  minTokens?: number
  tokenSymbol?: string
  rsvpd: boolean
  rsvpCount: number
  color: string
}

const CREATOR_SCHEDULE: Record<string, ScheduledItem[]> = {
  sovereign_v: [
    { id: 's1', type: 'live',     title: 'Live Market Analysis — Weekly DeFi Alpha', date: 'Jun 17',  time: '8:00 PM', day: '17', month: 'JUN', tokenGated: false,       rsvpd: true,  rsvpCount: 284, color: '#a855f7' },
    { id: 's2', type: 'drop',     title: 'DeFi Signal Pack Q2 — Exclusive Drop',     date: 'Jun 19',  time: '12:00 PM',day: '19', month: 'JUN', tokenGated: true, minTokens: 25, tokenSymbol: 'SVRN', rsvpd: true, rsvpCount: 92, color: '#f59e0b' },
    { id: 's3', type: 'ama',      title: 'Q&A — Ask Me Anything (Gold+ only)',        date: 'Jun 21',  time: '7:00 PM', day: '21', month: 'JUN', tokenGated: true, minTokens: 50, tokenSymbol: 'SVRN', rsvpd: false, rsvpCount: 48, color: '#818cf8' },
    { id: 's4', type: 'live',     title: 'Trading Session: Altcoin Season Setup',     date: 'Jun 24',  time: '9:00 PM', day: '24', month: 'JUN', tokenGated: false,       rsvpd: false, rsvpCount: 156, color: '#a855f7' },
    { id: 's5', type: 'workshop', title: 'DeFi 101 Workshop — Beginner Friendly',     date: 'Jun 28',  time: '6:00 PM', day: '28', month: 'JUN', tokenGated: false,       rsvpd: false, rsvpCount: 412, color: '#22c55e' },
    { id: 's6', type: 'drop',     title: 'Diamond NFT Pass — Limited 10 Spots',       date: 'Jul 1',   time: '3:00 PM', day: '01', month: 'JUL', tokenGated: true, minTokens: 100, tokenSymbol: 'SVRN', rsvpd: false, rsvpCount: 8, color: '#818cf8' },
  ],
  mayafit: [
    { id: 's7', type: 'live',     title: 'Morning Burn — Full Body HIIT',            date: 'Jun 17',  time: '6:00 AM', day: '17', month: 'JUN', tokenGated: false,       rsvpd: false, rsvpCount: 180, color: '#22c55e' },
    { id: 's8', type: 'drop',     title: '12-Week Shred Program — Summer Edition',   date: 'Jun 20',  time: '9:00 AM', day: '20', month: 'JUN', tokenGated: true, minTokens: 10, tokenSymbol: 'MAYA', rsvpd: false, rsvpCount: 64, color: '#f59e0b' },
    { id: 's9', type: 'ama',      title: 'Nutrition Q&A — Ask a Coach Anything',     date: 'Jun 22',  time: '8:00 PM', day: '22', month: 'JUN', tokenGated: false,       rsvpd: false, rsvpCount: 310, color: '#22c55e' },
  ],
}

const PROFILE_COLORS: Record<string, string> = { sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899' }

const TYPE_META: Record<EventType, { icon: string; label: string }> = {
  live:     { icon: '🔴', label: 'Live Stream' },
  post:     { icon: '📝', label: 'Post' },
  drop:     { icon: '🎁', label: 'Drop' },
  ama:      { icon: '💬', label: 'AMA' },
  workshop: { icon: '🎓', label: 'Workshop' },
}

const MY_TOKENS: Record<string, number> = { SVRN: 50, MAYA: 80, JAX: 0 }

export default function CreatorSchedulePage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const items = CREATOR_SCHEDULE[handle] ?? CREATOR_SCHEDULE.sovereign_v
  const accentColor = PROFILE_COLORS[handle] ?? '#a855f7'

  const [rsvps, setRsvps] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map(i => [i.id, i.rsvpd]))
  )
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(items.map(i => [i.id, i.rsvpCount]))
  )
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  async function toggleRsvp(id: string) {
    setLoading(prev => ({ ...prev, [id]: true }))
    await new Promise(r => setTimeout(r, 700))
    setRsvps(prev => {
      const newVal = !prev[id]
      setCounts(c => ({ ...c, [id]: newVal ? c[id] + 1 : c[id] - 1 }))
      return { ...prev, [id]: newVal }
    })
    setLoading(prev => ({ ...prev, [id]: false }))
  }

  const typeFilters: (EventType | 'all')[] = ['all', 'live', 'drop', 'ama', 'workshop']
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all')
  const filtered = typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Schedule</div>
            <div className="text-xs text-white/30">@{handle} · {items.length} upcoming</div>
          </div>
          <div className="text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: `${accentColor}15`, color: accentColor }}>
            {items.filter(i => rsvps[i.id]).length} RSVP'd
          </div>
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {typeFilters.map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 capitalize"
              style={typeFilter === f ? { background: accentColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : `${TYPE_META[f].icon} ${TYPE_META[f].label}`}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {filtered.map(item => {
          const canAccess = !item.tokenGated || (item.tokenSymbol && (MY_TOKENS[item.tokenSymbol] ?? 0) >= (item.minTokens ?? 0))
          const isRsvpd = rsvps[item.id]
          const isLoading = loading[item.id]

          return (
            <div key={item.id} className="flex gap-3">
              {/* Date block */}
              <div className="flex-shrink-0 w-12 flex flex-col items-center pt-3">
                <div className="text-xs font-black text-white/25">{item.month}</div>
                <div className="text-2xl font-black text-white/70">{item.day}</div>
              </div>

              {/* Card */}
              <div className="flex-1 rounded-2xl border border-white/4 p-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
                {/* Type + time */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: `${item.color}15`, color: item.color }}>
                    {TYPE_META[item.type].icon} {TYPE_META[item.type].label}
                  </span>
                  <span className="text-xs text-white/25">{item.time}</span>
                  {item.tokenGated && (
                    <span className="ml-auto text-xs text-white/20">🔒 {item.minTokens}+ ${item.tokenSymbol}</span>
                  )}
                </div>

                <div className="font-bold text-sm text-white/80 mb-2">{item.title}</div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-white/25">{counts[item.id]} going</div>
                  {canAccess ? (
                    <button onClick={() => toggleRsvp(item.id)} disabled={isLoading}
                      className="ml-auto px-3 py-1.5 rounded-xl text-xs font-black disabled:opacity-50"
                      style={isRsvpd
                        ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                        : { background: item.color, color: '#04040A' }}>
                      {isLoading ? '…' : isRsvpd ? '✓ Going' : 'RSVP'}
                    </button>
                  ) : (
                    <button onClick={() => router.push(`/tokens/${item.tokenSymbol}/chart`)}
                      className="ml-auto px-3 py-1.5 rounded-xl text-xs font-black"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                      Get ${item.tokenSymbol} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
