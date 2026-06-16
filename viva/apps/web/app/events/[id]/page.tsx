'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const EVENTS: Record<string, {
  id: string; title: string; desc: string; format: string; formatIcon: string
  category: string; host: string; hostHandle: string; hostColor: string; hostVScore: number
  date: string; durationMins: number; access: string; minTokens?: number; ticketPrice?: number
  attendees: { handle: string; name: string; color: string }[]
  maxAttendees?: number; tags: string[]
}> = {
  evt1: {
    id: 'evt1',
    title: 'DeFi Alpha: Top Signals for June',
    desc: 'Join Sovereign V for a live breakdown of the hottest DeFi trades this month. We\'ll cover yield strategies, token plays, and how to read on-chain signals like a pro.',
    format: 'Live Stream', formatIcon: '🔴',
    category: 'Finance',
    host: 'Sovereign V', hostHandle: 'sovereign_v', hostColor: '#a855f7', hostVScore: 900,
    date: '2026-06-20T20:00:00Z', durationMins: 90,
    access: 'free',
    attendees: [
      { handle: 'noa_d',      name: 'Noa D.',     color: '#a855f7' },
      { handle: 'crypto_kat', name: 'Kat Zhou',   color: '#818cf8' },
      { handle: 'mayafit',    name: 'Maya Chen',  color: '#22c55e' },
      { handle: 'jaxbeats',   name: 'Jax Beats',  color: '#ec4899' },
      { handle: 'moonset99',  name: 'Moonset',    color: '#22c55e' },
      { handle: 'alexpark',   name: 'Alex Park',  color: '#60a5fa' },
    ],
    tags: ['DeFi', 'Signals', 'Yield'],
  },
  evt2: {
    id: 'evt2',
    title: 'Fitness AMA with Maya Chen',
    desc: 'Ask me anything about nutrition, training plans, biohacking, and staying consistent. Diamond token holders get priority questions!',
    format: 'AMA', formatIcon: '💬',
    category: 'Health',
    host: 'Maya Chen', hostHandle: 'mayafit', hostColor: '#22c55e', hostVScore: 780,
    date: '2026-06-18T18:00:00Z', durationMins: 60,
    access: 'token', minTokens: 10,
    attendees: [
      { handle: 'luna_arts',  name: 'Luna Arts',  color: '#c084fc' },
      { handle: 'atlas_b',    name: 'Atlas B.',   color: '#60a5fa' },
      { handle: 'danr',       name: 'Dan R.',     color: '#34d399' },
    ],
    maxAttendees: 200,
    tags: ['Fitness', 'AMA', 'Health'],
  },
}

function useCountdown(target: string) {
  const [left, setLeft] = useState(Math.max(0, new Date(target).getTime() - Date.now()))
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, new Date(target).getTime() - Date.now())), 1000)
    return () => clearInterval(id)
  }, [target])
  const d = Math.floor(left / 86400000)
  const h = Math.floor((left % 86400000) / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  return { d, h, m, s, started: left === 0 }
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'evt1'
  const ev = EVENTS[id] ?? EVENTS.evt1

  const [rsvpd, setRsvpd] = useState(false)
  const [rsvping, setRsvping] = useState(false)
  const [shared, setShared] = useState(false)
  const { d, h, m, s, started } = useCountdown(ev.date)

  async function rsvp() {
    setRsvping(true)
    await new Promise(r => setTimeout(r, 800))
    setRsvping(false)
    setRsvpd(true)
  }

  function share() {
    navigator.clipboard.writeText(window.location.href)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const fmtDate = new Date(ev.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const isLive = started
  const attendeeCount = ev.attendees.length + (rsvpd ? 1 : 0)

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      {/* Hero */}
      <div className="relative px-4 pt-12 pb-6"
        style={{ background: `linear-gradient(180deg, ${ev.hostColor}15 0%, transparent 100%)` }}>
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 p-1.5 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button onClick={share}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-xs font-bold px-3 py-1.5"
          style={{ background: 'rgba(0,0,0,0.3)', color: shared ? '#22c55e' : 'white' }}>
          {shared ? '✓ Copied' : 'Share'}
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: `${ev.hostColor}18`, color: ev.hostColor }}>
            {ev.formatIcon} {ev.format}
          </span>
          <span className="text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            {ev.category}
          </span>
          {isLive && (
            <span className="text-xs px-2 py-1 rounded-full font-bold animate-pulse"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
              🔴 LIVE NOW
            </span>
          )}
        </div>

        <h1 className="text-2xl font-black text-white mb-4 leading-tight">{ev.title}</h1>

        {/* Host */}
        <button onClick={() => router.push(`/profile/${ev.hostHandle}`)}
          className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
            style={{ background: `${ev.hostColor}18`, color: ev.hostColor, border: `1.5px solid ${ev.hostColor}30` }}>
            {ev.host[0]}
          </div>
          <div className="text-left">
            <div className="font-bold text-white text-sm">{ev.host}</div>
            <div className="text-xs" style={{ color: ev.hostColor }}>@{ev.hostHandle} · VScore {ev.hostVScore}</div>
          </div>
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Countdown */}
        {!started && (
          <div className="p-4 rounded-2xl border border-white/6"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/30 uppercase tracking-widest text-center mb-3">Starts in</div>
            <div className="flex justify-center gap-3">
              {[
                { val: d, label: 'Days' },
                { val: h, label: 'Hrs' },
                { val: m, label: 'Min' },
                { val: s, label: 'Sec' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-black text-white w-12">{String(val).padStart(2, '0')}</div>
                  <div className="text-xs text-white/25">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '📅 Date',     value: fmtDate },
            { label: '⏱ Duration', value: `${ev.durationMins} min` },
            { label: '👥 Attending', value: `${attendeeCount}${ev.maxAttendees ? ` / ${ev.maxAttendees}` : ''}` },
            { label: '🔑 Access',   value: ev.access === 'free' ? 'Free' : ev.access === 'token' ? `${ev.minTokens}+ tokens` : `$${ev.ticketPrice} USDC` },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl border border-white/5"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 mb-0.5">{label}</div>
              <div className="text-sm font-bold text-white/75 line-clamp-2">{value}</div>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="p-4 rounded-2xl border border-white/5"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-2">About</div>
          <div className="text-sm text-white/60 leading-relaxed">{ev.desc}</div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {ev.tags.map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Attendees */}
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Going ({attendeeCount})</div>
          <div className="flex flex-wrap gap-2">
            {ev.attendees.map(a => (
              <button key={a.handle} onClick={() => router.push(`/profile/${a.handle}`)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: `${a.color}20`, color: a.color }}>
                  {a.name[0]}
                </div>
                <span className="text-xs text-white/50">{a.name}</span>
              </button>
            ))}
            {rsvpd && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
                style={{ background: `${ev.hostColor}08`, borderColor: `${ev.hostColor}25` }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: `${ev.hostColor}20`, color: ev.hostColor }}>
                  Y
                </div>
                <span className="text-xs" style={{ color: ev.hostColor }}>You</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.88)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {isLive ? (
          <button onClick={() => router.push(`/rooms/live_${ev.id}`)}
            className="w-full py-4 rounded-2xl font-black text-lg animate-pulse"
            style={{ background: '#f87171', color: '#04040A' }}>
            🔴 Join Live Now
          </button>
        ) : rsvpd ? (
          <div className="w-full py-4 rounded-2xl font-black text-lg text-center"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
            ✓ You're In — We'll remind you
          </div>
        ) : (
          <button onClick={rsvp} disabled={rsvping}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
            style={{ background: ev.hostColor, color: '#04040A' }}>
            {rsvping ? 'Reserving…' : ev.access === 'free' ? '🎟 RSVP Free' : ev.access === 'token' ? `🔑 RSVP (${ev.minTokens}+ tokens)` : `🎟 Get Ticket — $${ev.ticketPrice}`}
          </button>
        )}
      </div>
    </div>
  )
}
