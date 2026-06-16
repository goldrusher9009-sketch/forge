'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TODAY = new Date('2026-06-16')
const START_OF_WEEK = new Date(TODAY)
START_OF_WEEK.setDate(TODAY.getDate() - TODAY.getDay()) // Sunday

type ItemType = 'post' | 'event' | 'room' | 'signal' | 'token_drop'

interface ScheduledItem {
  id: string
  type: ItemType
  title: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  status: 'scheduled' | 'published' | 'draft'
  audience: string
}

const TYPE_META: Record<ItemType, { icon: string; color: string; label: string }> = {
  post:       { icon: '✍️', color: '#818cf8', label: 'Post'       },
  event:      { icon: '🎙️', color: '#a855f7', label: 'Event'      },
  room:       { icon: '🎧', color: '#ec4899', label: 'Room'        },
  signal:     { icon: '📈', color: '#22c55e', label: 'Signal'      },
  token_drop: { icon: '🪙', color: '#f59e0b', label: 'Token Drop'  },
}

const ITEMS: ScheduledItem[] = [
  { id: 's1', type: 'post',       title: 'Morning market breakdown',      date: '2026-06-16', time: '08:00', status: 'scheduled', audience: 'public'    },
  { id: 's2', type: 'signal',     title: 'BTC Long setup — TP $110k',     date: '2026-06-16', time: '10:30', status: 'draft',     audience: 'gold+'     },
  { id: 's3', type: 'room',       title: 'DeFi Alpha — Live Q&A',         date: '2026-06-17', time: '19:00', status: 'scheduled', audience: 'public'    },
  { id: 's4', type: 'event',      title: 'DeFi Alpha: June Signals',      date: '2026-06-20', time: '20:00', status: 'scheduled', audience: 'public'    },
  { id: 's5', type: 'post',       title: 'Weekly portfolio review thread', date: '2026-06-21', time: '09:00', status: 'scheduled', audience: 'silver+'   },
  { id: 's6', type: 'token_drop', title: '$SVRN staking rewards drop',    date: '2026-06-22', time: '12:00', status: 'scheduled', audience: 'diamond'   },
  { id: 's7', type: 'post',       title: 'Ecosystem roundup post',        date: '2026-06-19', time: '14:00', status: 'draft',     audience: 'followers' },
]

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: 'rgba(129,140,248,0.12)', color: '#818cf8' },
  published:  { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e' },
  draft:      { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' },
}

export default function CreatorSchedulePage() {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [filter, setFilter] = useState<ItemType | 'all'>('all')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const weekStart = new Date(START_OF_WEEK)
  weekStart.setDate(weekStart.getDate() + weekOffset * 7)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const fmtDate = (d: Date) => d.toISOString().split('T')[0]

  const filteredItems = ITEMS.filter(item => {
    const matchFilter = filter === 'all' || item.type === filter
    const matchDay = !selectedDay || item.date === selectedDay
    return matchFilter && matchDay
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  const itemsThisWeek = ITEMS.filter(item => {
    const d = new Date(item.date)
    return d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000)
  })

  const todayStr = fmtDate(TODAY)

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
          <div className="font-black text-white flex-1">Content Schedule</div>
          <button onClick={() => router.push('/feed/create')}
            className="px-3 py-1.5 rounded-xl text-xs font-black"
            style={{ background: '#a855f7', color: '#04040A' }}>
            + Schedule
          </button>
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white">
            ‹
          </button>
          <div className="flex-1 text-center text-xs text-white/40 font-semibold">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white">
            ›
          </button>
        </div>

        {/* Calendar strip */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekDays.map((d, i) => {
            const ds = fmtDate(d)
            const hasItems = itemsThisWeek.some(it => it.date === ds)
            const isToday = ds === todayStr
            const selected = selectedDay === ds
            return (
              <button key={i} onClick={() => setSelectedDay(selected ? null : ds)}
                className="flex flex-col items-center py-2 rounded-xl transition-all"
                style={selected
                  ? { background: '#a855f7' }
                  : isToday
                  ? { background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)' }
                  : { background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xs font-semibold" style={{ color: selected ? '#04040A' : 'rgba(255,255,255,0.3)' }}>
                  {DAYS[d.getDay()]}
                </span>
                <span className="font-black text-sm" style={{ color: selected ? '#04040A' : isToday ? '#a855f7' : 'rgba(255,255,255,0.7)' }}>
                  {d.getDate()}
                </span>
                {hasItems && (
                  <div className="w-1 h-1 rounded-full mt-0.5"
                    style={{ background: selected ? 'rgba(4,4,10,0.5)' : '#a855f7' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button onClick={() => setFilter('all')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={filter === 'all' ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            All
          </button>
          {(Object.keys(TYPE_META) as ItemType[]).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={filter === t
                ? { background: TYPE_META[t].color, color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {TYPE_META[t].icon} {TYPE_META[t].label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-3 space-y-2">
        {filteredItems.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="text-3xl">📅</div>
            <div className="text-white/20 text-sm">Nothing scheduled{selectedDay ? ' for this day' : ''}</div>
            <button onClick={() => router.push('/feed/create')}
              className="px-4 py-2 rounded-xl text-sm font-black"
              style={{ background: '#a855f7', color: '#04040A' }}>
              + Create content
            </button>
          </div>
        )}
        {filteredItems.map(item => {
          const tm = TYPE_META[item.type]
          const st = STATUS_STYLES[item.status]
          const itemDate = new Date(`${item.date}T${item.time}`)
          return (
            <div key={item.id}
              className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: `${tm.color}10`, border: `1px solid ${tm.color}20` }}>
                {tm.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white/80 truncate">{item.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/25">
                    {itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {item.time}
                  </span>
                  <span className="text-xs text-white/20">·</span>
                  <span className="text-xs text-white/25">{item.audience}</span>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={st}>
                  {item.status}
                </span>
                <span className="text-xs font-bold" style={{ color: tm.color }}>{tm.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
