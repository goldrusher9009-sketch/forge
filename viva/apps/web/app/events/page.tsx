'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = 'all' | 'defi' | 'music' | 'fitness' | 'art' | 'education'
type DateFilter = 'all' | 'today' | 'week' | 'month'

interface Event {
  id: string
  title: string
  emoji: string
  host: string
  hostHandle: string
  color: string
  category: Category
  date: string
  time: string
  type: 'virtual' | 'irl'
  capacity: number
  rsvp: number
  minTokens?: number
  tokenSymbol?: string
  price?: number
  tags: string[]
}

const EVENTS: Event[] = [
  { id:'ev1', title:'DeFi Alpha Summit',           emoji:'📊', host:'Sovereign V',  hostHandle:'sovereign_v', color:'#a855f7', category:'defi',      date:'Jun 20, 2026', time:'3:00 PM UTC', type:'virtual', capacity:200, rsvp:142, minTokens:10, tokenSymbol:'SVRN', tags:['alpha','trading','defi'] },
  { id:'ev2', title:'Beats & Vibes Release Party', emoji:'🎧', host:'Jax Beats',   hostHandle:'jaxbeats',    color:'#ec4899', category:'music',     date:'Jun 25, 2026', time:'9:00 PM UTC', type:'virtual', capacity:500, rsvp:318, minTokens:5,  tokenSymbol:'JAX',  tags:['music','drop','exclusive'] },
  { id:'ev3', title:'Summer Shred Challenge',      emoji:'💪', host:'Maya Chen',   hostHandle:'mayafit',     color:'#22c55e', category:'fitness',   date:'Jun 22, 2026', time:'6:00 AM UTC', type:'virtual', capacity:300, rsvp:204, minTokens:0,                 tags:['fitness','challenge','live'] },
  { id:'ev4', title:'Crypto Art Gallery',          emoji:'🎨', host:'Luna Writes', hostHandle:'luna_w',      color:'#f87171', category:'art',       date:'Jul 1, 2026',  time:'2:00 PM UTC', type:'virtual', capacity:150, rsvp:88,  price:25,                    tags:['art','nft','gallery'] },
  { id:'ev5', title:'Trading 101 Workshop',        emoji:'📈', host:'Atlas K',     hostHandle:'atlas_k',     color:'#818cf8', category:'education', date:'Jun 28, 2026', time:'5:00 PM UTC', type:'virtual', capacity:100, rsvp:67,  price:0,                     tags:['beginner','trading','workshop'] },
  { id:'ev6', title:'Token Staking Masterclass',   emoji:'🔒', host:'Sovereign V', hostHandle:'sovereign_v', color:'#a855f7', category:'defi',      date:'Jul 5, 2026',  time:'4:00 PM UTC', type:'virtual', capacity:80,  rsvp:45,  minTokens:25, tokenSymbol:'SVRN', tags:['staking','passive','income'] },
  { id:'ev7', title:'Wellness & Mindfulness Q&A',  emoji:'🧘', host:'Maya Chen',   hostHandle:'mayafit',     color:'#22c55e', category:'fitness',   date:'Jun 30, 2026', time:'11:00 AM UTC', type:'virtual', capacity:200, rsvp:112, price:0,                    tags:['wellness','mindfulness','free'] },
  { id:'ev8', title:'Beat Production Masterclass', emoji:'🎹', host:'Jax Beats',   hostHandle:'jaxbeats',    color:'#ec4899', category:'music',     date:'Jul 8, 2026',  time:'7:00 PM UTC', type:'virtual', capacity:60,  rsvp:38,  minTokens:10, tokenSymbol:'JAX',  tags:['production','masterclass','exclusive'] },
]

const CAT_LABELS: Record<Category | 'all', string> = {
  all:'All', defi:'DeFi', music:'Music', fitness:'Fitness', art:'Art', education:'Education'
}

const MY_TOKENS: Record<string, number> = { SVRN:50, MAYA:80, JAX:0 }

export default function EventsPage() {
  const router = useRouter()
  const [cat, setCat]         = useState<Category | 'all'>('all')
  const [dateF, setDateF]     = useState<DateFilter>('all')
  const [rsvped, setRsvped]   = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  async function rsvp(id: string) {
    setLoading(p => ({ ...p, [id]: true }))
    await new Promise(r => setTimeout(r, 800))
    setLoading(p => ({ ...p, [id]: false }))
    setRsvped(p => ({ ...p, [id]: true }))
  }

  let events = EVENTS
  if (cat !== 'all') events = events.filter(e => e.category === cat)

  const canAccess = (e: Event) => {
    if (!e.minTokens || e.minTokens === 0) return true
    if (!e.tokenSymbol) return true
    return (MY_TOKENS[e.tokenSymbol] ?? 0) >= e.minTokens
  }

  const upcoming = events.filter(e => !rsvped[e.id]).length
  const going    = Object.values(rsvped).filter(Boolean).length

  return (
    <div className="min-h-screen pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Events</div>
            <div className="text-xs text-white/30">{upcoming} upcoming · {going} going</div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto">
          {(Object.keys(CAT_LABELS) as (Category | 'all')[]).map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={cat === c ? { background:'#a855f7', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </header>

      {/* Going section */}
      {going > 0 && (
        <div className="px-4 pt-4">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">You're Going</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {EVENTS.filter(e => rsvped[e.id]).map(e => (
              <button key={e.id} onClick={() => router.push(`/events/${e.id}/attendees`)}
                className="flex-shrink-0 p-3 rounded-2xl border border-white/4 w-44 text-left"
                style={{ background:`${e.color}06` }}>
                <div className="text-2xl mb-1">{e.emoji}</div>
                <div className="font-bold text-xs text-white/70 leading-tight mb-0.5">{e.title}</div>
                <div className="text-xs" style={{ color:e.color }}>{e.date}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📅</div>
            <div className="font-black text-white/40">No events</div>
            <div className="text-sm text-white/20 mt-1">Try a different category</div>
          </div>
        ) : events.map(e => {
          const access  = canAccess(e)
          const isGoing = rsvped[e.id]
          const pct     = Math.round((e.rsvp / e.capacity) * 100)
          const spotsLeft = e.capacity - e.rsvp

          return (
            <div key={e.id} className="rounded-2xl border border-white/4 overflow-hidden"
              style={{ background:'rgba(255,255,255,0.015)' }}>
              {/* Color bar */}
              <div className="h-1" style={{ background:e.color }} />

              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background:`${e.color}10` }}>{e.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-white/85">{e.title}</span>
                      {e.minTokens ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background:access?`${e.color}15`:'rgba(255,255,255,0.05)', color:access?e.color:'rgba(255,255,255,0.25)' }}>
                          {access ? '🔓' : '🔒'} {e.minTokens}+ ${e.tokenSymbol}
                        </span>
                      ) : e.price === 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e' }}>FREE</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b' }}>${e.price}</span>
                      )}
                    </div>
                    <button onClick={() => router.push(`/profile/${e.hostHandle}`)}
                      className="text-xs text-white/30 mt-0.5 hover:text-white/50">@{e.hostHandle}</button>
                  </div>
                </div>

                {/* Date + time */}
                <div className="flex gap-4 mb-3">
                  <div className="text-xs text-white/40">📅 {e.date}</div>
                  <div className="text-xs text-white/40">⏰ {e.time}</div>
                  <div className="text-xs text-white/40">{e.type === 'virtual' ? '💻 Virtual' : '📍 IRL'}</div>
                </div>

                {/* Capacity */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-white/25 mb-1">
                    <span>{e.rsvp} going</span>
                    <span>{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width:`${pct}%`, background:pct >= 90 ? '#f87171' : e.color }} />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {e.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.3)' }}>#{t}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/events/${e.id}/attendees`)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.35)' }}>
                    See Attendees
                  </button>
                  {access ? (
                    <button onClick={() => !isGoing && rsvp(e.id)} disabled={loading[e.id] || isGoing}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black"
                      style={isGoing
                        ? { background:'rgba(34,197,94,0.12)', color:'#22c55e' }
                        : loading[e.id]
                          ? { background:`${e.color}10`, color:`${e.color}60` }
                          : { background:e.color, color:'#04040A' }}>
                      {isGoing ? '✓ Going' : loading[e.id] ? '…' : 'RSVP'}
                    </button>
                  ) : (
                    <button onClick={() => router.push(`/tokens/${e.tokenSymbol}/chart`)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black"
                      style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
                      Get ${e.tokenSymbol} →
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
