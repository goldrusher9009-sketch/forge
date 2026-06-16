'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const EVENTS = [
  {
    id: 'ev1', type: 'live', title: 'Token Economy Masterclass', host: 'sovereign_v', hostName: 'Sovereign V',
    tier: 'guardian', date: '2026-06-17', time: '7:00 PM UTC', duration: '90 min',
    attendees: 320, maxAttendees: 500, price: 0, priceToken: 'SOVV', priceAmt: 0,
    desc: 'Deep dive into building a personal token economy — pricing, supply, staking tiers, and community incentives.',
    tags: ['Tokenomics', 'Finance', 'Web3'], rsvp: false, color: '#a855f7', isLive: false,
  },
  {
    id: 'ev2', type: 'live', title: 'Morning Flow & Biohack Session', host: 'mayafit', hostName: 'Maya Chen',
    tier: 'guardian', date: '2026-06-16', time: '6:00 AM UTC', duration: '45 min',
    attendees: 210, maxAttendees: 300, price: 0, priceToken: 'MAYA', priceAmt: 10,
    desc: 'Live guided morning routine — breath, movement, cold protocol. Diamond tier holders get private Q&A after.',
    tags: ['Health', 'Wellness', 'Biohack'], rsvp: true, color: '#22c55e', isLive: true,
  },
  {
    id: 'ev3', type: 'irl', title: 'VIVA Creator Summit — London', host: 'viva_hq', hostName: 'VIVA',
    tier: null, date: '2026-07-04', time: '10:00 AM BST', duration: '8 hours',
    attendees: 88, maxAttendees: 200, price: 120, priceToken: null, priceAmt: 0,
    desc: 'First IRL VIVA creator summit — panels, workshops, and token-gated networking dinner. London, UK.',
    tags: ['IRL', 'Networking', 'Community'], rsvp: false, color: '#f59e0b', isLive: false,
  },
  {
    id: 'ev4', type: 'live', title: 'ZK Identity & Privacy AMA', host: 'zeronode', hostName: 'ZeroNode',
    tier: 'seeker', date: '2026-06-20', time: '4:00 PM UTC', duration: '60 min',
    attendees: 145, maxAttendees: null, price: 0, priceToken: null, priceAmt: 0,
    desc: 'Ask Me Anything on zero-knowledge proofs, private credentials, and the future of verifiable identity.',
    tags: ['ZK', 'Privacy', 'Tech'], rsvp: false, color: '#818cf8', isLive: false,
  },
]

export default function EventsPage() {
  const router = useRouter()
  const [rsvpd, setRsvpd] = useState<Set<string>>(new Set(['ev2']))
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'live' | 'irl'>('all')

  async function handleRsvp(id: string) {
    setLoading(id)
    await new Promise(r => setTimeout(r, 700))
    setRsvpd(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    setLoading(null)
  }

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
            <p className="text-xs text-white/30 tracking-widest">VIVA COMMUNITY</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Events</h1>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: '#a855f718', color: '#a855f7', border: '1px solid #a855f725' }}>
            + Host Event
          </button>
        </div>
        <div className="flex gap-2">
          {(['all','live','irl'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase transition-all"
              style={filter === f
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f === 'live' ? '🔴 Live' : f === 'irl' ? '📍 IRL' : 'All'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {filtered.map(ev => {
          const isRsvpd = rsvpd.has(ev.id)
          const spotsLeft = ev.maxAttendees ? ev.maxAttendees - ev.attendees : null
          return (
            <div key={ev.id} className="p-4 rounded-2xl border border-white/6"
              style={{ background: 'rgba(255,255,255,0.018)', borderColor: ev.isLive ? `${ev.color}40` : undefined }}>
              {ev.isLive && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                  <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live Now</span>
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-3">
                  <div className="font-bold text-white leading-snug mb-1">{ev.title}</div>
                  <button onClick={() => router.push(`/profile/${ev.host}`)}
                    className="text-xs font-semibold transition-colors" style={{ color: ev.color }}>
                    by {ev.hostName}
                  </button>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-white/60">{ev.date.slice(5)}</div>
                  <div className="text-xs text-white/30">{ev.time}</div>
                </div>
              </div>
              <p className="text-xs text-white/45 mb-3 leading-relaxed">{ev.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {ev.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${ev.color}14`, color: ev.color }}>{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-3 text-xs text-white/35">
                  <span>👤 {ev.attendees}{ev.maxAttendees ? `/${ev.maxAttendees}` : ''}</span>
                  <span>⏱ {ev.duration}</span>
                  {ev.type === 'irl' && <span>📍 London, UK</span>}
                  {spotsLeft !== null && spotsLeft < 50 && (
                    <span className="font-semibold" style={{ color: '#f59e0b' }}>⚡ {spotsLeft} spots left</span>
                  )}
                </div>
                <div className="text-xs text-white/35">
                  {ev.price > 0 ? `$${ev.price}` : ev.priceAmt > 0 ? `${ev.priceAmt} ${ev.priceToken}` : 'Free'}
                </div>
              </div>
              <button onClick={() => handleRsvp(ev.id)} disabled={loading === ev.id}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                style={isRsvpd
                  ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                  : { background: ev.color, color: '#04040A' }}>
                {loading === ev.id ? '…' : isRsvpd ? '✓ RSVPd — Cancel' : ev.isLive ? 'Join Live ↗' : 'RSVP'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
