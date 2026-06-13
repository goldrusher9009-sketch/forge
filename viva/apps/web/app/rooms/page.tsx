'use client'
import { useState, useEffect } from 'react'
import { useAppStore, mockUser, TIER_META } from '@/lib/store'
import { rooms as roomsApi } from '@/lib/api'
import clsx from 'clsx'

const LIVE_ROOMS = [
  {
    id: 'r1', title: 'Regenerative Finance + ZK Identity', topic: 'DeFi · ZKP',
    host: 'noa_d', hostScore: 671, tier: 'guardian',
    speakers: ['noa_d', 'luna_v', 'aisham'],
    listeners: 47, live: true, started: Date.now() - 1800000,
    minVScore: 400,
  },
  {
    id: 'r2', title: 'Builder Hour: AI Agents & Autonomy', topic: 'AI · Builders',
    host: 'danr', hostScore: 589, tier: 'stable',
    speakers: ['danr', 'mateuso'],
    listeners: 23, live: true, started: Date.now() - 3600000,
    minVScore: 200,
  },
  {
    id: 'r3', title: 'Sovereign Health: Beyond the App', topic: 'Health · Philosophy',
    host: 'luna_v', hostScore: 834, tier: 'sovereign',
    speakers: ['luna_v'],
    listeners: 89, live: true, started: Date.now() - 7200000,
    minVScore: 600,
  },
]

const UPCOMING_ROOMS = [
  { id: 'u1', title: 'YouToken Economics 101', host: 'mateuso', scheduled: Date.now() + 7200000, topic: 'YouToken' },
  { id: 'u2', title: 'V-Score: What Actually Moves It', host: 'luna_v', scheduled: Date.now() + 14400000, topic: 'V-Score' },
]

export default function RoomsPage() {
  const { user, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [liveRooms, setLiveRooms] = useState(LIVE_ROOMS)
  const [activeRoom, setActiveRoom] = useState<any | null>(null)
  const [handRaised, setHandRaised] = useState(false)
  const [muted, setMuted] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [waveform, setWaveform] = useState<number[]>(Array.from({ length: 20 }, () => Math.random() * 40 + 10))

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadRooms()
    const waveInterval = setInterval(() => {
      setWaveform(Array.from({ length: 20 }, () => Math.random() * 40 + 10))
    }, 180)
    return () => clearInterval(waveInterval)
  }, [])

  async function loadRooms() {
    try {
      const data = await roomsApi.list()
      if (Array.isArray(data) && data.length) {
        setLiveRooms(data.map((r: any) => ({
          id: r.id,
          title: r.title,
          topic: r.topic ?? r.category ?? '',
          host: r.host?.handle ?? r.hostId ?? 'unknown',
          hostScore: r.host?.vScore ?? 0,
          tier: r.host?.tier?.toLowerCase() ?? 'rising',
          speakers: (r.members ?? []).filter((m: any) => m.role === 'SPEAKER' || m.role === 'HOST').map((m: any) => m.user?.handle ?? m.userId),
          listeners: r._count?.members ?? r.listenerCount ?? r.listeners ?? 0,
          live: Boolean(r.isLive ?? (r.status === 'LIVE')),
          started: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
          minVScore: r.minVScore ?? 0,
        })))
      }
    } catch { /* keep mock */ }
  }

  if (!mounted) return null
  const u = user || mockUser()

  async function joinRoom(room: any) {
    if (u.vscore < room.minVScore) return
    setActiveRoom(room)
    setMuted(true)
    setSpeaking(false)
    try { await roomsApi.join(room.id) } catch { /* offline ok */ }
  }

  async function leaveRoom() {
    if (activeRoom) {
      try { await roomsApi.leave(activeRoom.id) } catch { /* offline ok */ }
    }
    setActiveRoom(null)
    setHandRaised(false)
    setMuted(true)
  }

  const activeTime = activeRoom
    ? Math.floor((Date.now() - activeRoom.started) / 60000)
    : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>LIVE AUDIO · V-GATED</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>
              Rooms
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ring-wealth)', boxShadow: '0 0 6px var(--ring-wealth)', animation: 'glowPulse 1.5s ease infinite' }} />
              <span className="text-xs text-white/40">{liveRooms.length} live</span>
            </div>
            <button
              className="px-4 py-2 text-xs font-semibold border border-white/15 text-white/60 hover:border-white/30 hover:text-white transition-all"
              style={{ borderRadius: 'var(--radius)' }}
            >
              + Start Room
            </button>
          </div>
        </div>
      </header>

      <div className="container-editorial py-8">
        {activeRoom ? (
          /* ── ACTIVE ROOM ── */
          <div className="max-w-2xl mx-auto">
            {/* Room header */}
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--ring-wealth)' }} />
                    <span className="t-caption text-xs" style={{ color: 'var(--ring-wealth)' }}>LIVE</span>
                    <span className="t-caption text-xs text-white/25">{activeTime}m</span>
                  </div>
                  <h2 className="text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>{activeRoom.title}</h2>
                  <p className="text-sm text-white/40 mt-0.5">{activeRoom.topic}</p>
                </div>
                <button
                  onClick={leaveRoom}
                  className="text-xs px-3 py-1.5 border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  Leave
                </button>
              </div>
            </div>

            {/* Waveform visualizer */}
            <div
              className="flex items-center justify-center gap-1 mb-8"
              style={{ height: '80px' }}
            >
              {waveform.map((h, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-150"
                  style={{
                    width: '3px',
                    height: speaking ? `${h}px` : `${h * 0.3}px`,
                    background: speaking
                      ? `hsl(${260 + i * 3},70%,${50 + h * 0.3}%)`
                      : 'rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>

            {/* Speakers */}
            <section className="mb-8">
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>SPEAKERS · {activeRoom.speakers.length}</p>
              <div className="flex gap-4 flex-wrap">
                {activeRoom.speakers.map((sp: string, i: number) => (
                  <div key={sp} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg"
                        style={{
                          background: `rgba(124,58,237,0.2)`,
                          border: i === 0 ? `2px solid var(--v)` : '2px solid rgba(255,255,255,0.1)',
                          boxShadow: i === 0 ? '0 0 16px rgba(124,58,237,0.4)' : 'none',
                        }}
                      >
                        {sp[0].toUpperCase()}
                      </div>
                      {i === 0 && (
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                          style={{ background: 'var(--ring-social)', fontSize: '0.55rem' }}
                        >
                          ♦
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white/50">@{sp}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 3 }).map((_, b) => (
                        <div
                          key={b}
                          className="w-1 rounded-full transition-all duration-150"
                          style={{ height: `${4 + Math.random() * 8}px`, background: i === 0 ? 'var(--v)' : 'rgba(255,255,255,0.2)' }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setMuted(!muted)}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: muted ? 'rgba(255,255,255,0.06)' : 'var(--v)',
                  border: `1px solid ${muted ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                  boxShadow: muted ? 'none' : '0 0 20px rgba(124,58,237,0.4)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3v8M7 6v2M13 6v2" stroke={muted ? 'rgba(245,244,240,0.3)' : 'white'} strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M5 11a5 5 0 0 0 10 0" stroke={muted ? 'rgba(245,244,240,0.3)' : 'white'} strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="10" y1="16" x2="10" y2="19" stroke={muted ? 'rgba(245,244,240,0.3)' : 'white'} strokeWidth="1.8" strokeLinecap="round"/>
                  {muted && <line x1="3" y1="3" x2="17" y2="17" stroke="rgba(225,29,72,0.8)" strokeWidth="1.5" strokeLinecap="round"/>}
                </svg>
              </button>

              <button
                onClick={() => setHandRaised(!handRaised)}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: handRaised ? 'rgba(217,119,6,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${handRaised ? 'rgba(217,119,6,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>✋</span>
              </button>

              <button
                onClick={() => { setMuted(false); setSpeaking(!speaking) }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all text-white/40 hover:text-white/70"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 9h4M9 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Listeners */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="t-caption mb-3" style={{ fontSize: '0.625rem' }}>LISTENING · {activeRoom.listeners}</p>
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(activeRoom.listeners, 12) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border border-ink flex items-center justify-center text-xs font-bold"
                    style={{ background: `hsl(${i * 30},50%,35%)`, color: 'white' }}
                  >
                    {String.fromCharCode(65 + (i % 26))}
                  </div>
                ))}
                {activeRoom.listeners > 12 && (
                  <div
                    className="w-7 h-7 rounded-full border border-ink flex items-center justify-center text-xs text-white/40"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    +{activeRoom.listeners - 12}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── ROOM LIST ── */
          <div className="max-w-2xl space-y-8">
            {/* Live rooms */}
            <section>
              <p className="t-caption mb-5" style={{ fontSize: '0.625rem' }}>LIVE NOW · {liveRooms.length} ROOMS</p>
              <div className="space-y-3">
                {liveRooms.map(room => {
                  const canJoin = u.vscore >= room.minVScore
                  const tierColor = TIER_META[room.tier as keyof typeof TIER_META]?.color || 'var(--v)'
                  return (
                    <div
                      key={room.id}
                      className="p-5 border border-white/6 hover:border-white/15 transition-all"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      {/* Live indicator + title */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ring-wealth)', boxShadow: '0 0 4px var(--ring-wealth)' }} />
                            <span className="t-caption" style={{ fontSize: '0.55rem', color: 'var(--ring-wealth)' }}>LIVE</span>
                            <span className="t-caption text-white/20" style={{ fontSize: '0.55rem' }}>·</span>
                            <span className="t-caption text-white/30" style={{ fontSize: '0.55rem' }}>{room.topic}</span>
                          </div>
                          <h3 className="font-semibold text-sm text-white/85">{room.title}</h3>
                        </div>
                        <button
                          onClick={() => joinRoom(room)}
                          disabled={!canJoin}
                          className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{
                            background: canJoin ? 'var(--ring-wealth)' : 'transparent',
                            border: `1px solid ${canJoin ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 'var(--radius)',
                          }}
                          title={!canJoin ? `Requires V-Score ${room.minVScore}+` : undefined}
                        >
                          {canJoin ? 'Join →' : `${room.minVScore}+ V`}
                        </button>
                      </div>

                      {/* Speakers row */}
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5">
                          {room.speakers.map(sp => (
                            <div
                              key={sp}
                              className="w-6 h-6 rounded-full border border-ink flex items-center justify-center text-xs font-bold"
                              style={{ background: `rgba(124,58,237,0.3)`, color: 'var(--v)' }}
                            >
                              {sp[0].toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-white/35">
                          @{room.host} hosting · {room.listeners} listening
                        </span>
                        <span className="ml-auto text-xs px-2 py-0.5" style={{ background: `${tierColor}15`, color: tierColor, borderRadius: '3px' }}>
                          {TIER_META[room.tier as keyof typeof TIER_META]?.label}+ only
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Upcoming */}
            <section>
              <p className="t-caption mb-5" style={{ fontSize: '0.625rem' }}>UPCOMING ROOMS</p>
              <div className="space-y-2">
                {UPCOMING_ROOMS.map(r => (
                  <div key={r.id} className="flex items-center gap-4 p-4 border border-white/5" style={{ borderRadius: 'var(--radius)' }}>
                    <div>
                      <p className="font-medium text-sm text-white/70">{r.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">@{r.host} · {formatTime(r.scheduled)}</p>
                    </div>
                    <button className="ml-auto text-xs px-3 py-1.5 border border-white/10 text-white/40 hover:text-white transition-colors" style={{ borderRadius: 'var(--radius)' }}>
                      Remind
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}


function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
