'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

const ROOM = {
  id: 'r1',
  title: 'Token Economy 101 — Live Q&A',
  host: { name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7', avatar: 'SV' },
  topic: 'Finance & Token Economy',
  tokenGate: { symbol: 'SOVV', tier: 'Bronze', min: 10 },
  live: true,
  listeners: 284,
  speakers: [
    { name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7', avatar: 'SV', role: 'Host',     speaking: true  },
    { name: 'Maya Chen',   handle: 'mayafit',     color: '#22c55e', avatar: 'MC', role: 'Co-host',  speaking: false },
    { name: 'ZeroNode',    handle: 'zeronode',    color: '#818cf8', avatar: 'ZN', role: 'Speaker',  speaking: false },
    { name: 'Luna Apex',   handle: 'luna_apex',   color: '#f59e0b', avatar: 'LA', role: 'Speaker',  speaking: true  },
  ],
}

const INITIAL_CHAT = [
  { id: 'm1', handle: 'cryptomind', color: '#ec4899', text: 'Just joined! What\'s the best way to launch a creator token?', ts: '3m ago' },
  { id: 'm2', handle: 'sovereign_v', color: '#a855f7', text: 'Great Q! Start with value, not hype. Holders should get real utility on day 1.', ts: '2m ago', isHost: true },
  { id: 'm3', handle: 'wave_99', color: '#818cf8', text: '🔥🔥🔥', ts: '2m ago' },
  { id: 'm4', handle: 'hodler_x', color: '#22c55e', text: 'The staking tiers model is genius — creates real lock-in incentive', ts: '1m ago' },
  { id: 'm5', handle: 'newuser_42', color: '#f59e0b', text: 'How do you set initial token price?', ts: '45s ago' },
]

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(true)
  const [handRaised, setHandRaised] = useState(false)
  const [chat, setChat] = useState(INITIAL_CHAT)
  const [msg, setMsg] = useState('')
  const [listeners, setListeners] = useState(ROOM.listeners)
  const [speakers, setSpeakers] = useState(ROOM.speakers)
  const chatRef = useRef<HTMLDivElement>(null)

  // Simulate live listener count drift
  useEffect(() => {
    const iv = setInterval(() => {
      setListeners(l => l + Math.floor(Math.random() * 3 - 1))
    }, 4000)
    return () => clearInterval(iv)
  }, [])

  // Simulate speaking indicators toggling
  useEffect(() => {
    if (!joined) return
    const iv = setInterval(() => {
      setSpeakers(prev => prev.map(s =>
        s.role !== 'Host' ? { ...s, speaking: Math.random() > 0.6 } : s
      ))
    }, 2500)
    return () => clearInterval(iv)
  }, [joined])

  // Simulate incoming chat messages
  useEffect(() => {
    if (!joined) return
    const msgs = [
      { handle: 'lurker_01', color: '#94a3b8', text: '🙌' },
      { handle: 'builder_x', color: '#818cf8', text: 'This explains so much. Thank you!' },
      { handle: 'apex_fan',  color: '#f59e0b', text: '@luna_apex when is your token launching??' },
      { handle: 'degen_88',  color: '#ec4899', text: 'Pumping my SOVV bags rn 📈' },
    ]
    let idx = 0
    const iv = setInterval(() => {
      if (idx < msgs.length) {
        const m = msgs[idx++]
        setChat(prev => [...prev, { id: `live_${Date.now()}`, ts: 'just now', ...m }])
        setTimeout(() => chatRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50)
      }
    }, 7000)
    return () => clearInterval(iv)
  }, [joined])

  function sendMsg() {
    if (!msg.trim()) return
    setChat(prev => [...prev, { id: `me_${Date.now()}`, handle: 'you', color: '#a855f7', text: msg, ts: 'now' }])
    setMsg('')
    setTimeout(() => chatRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50)
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <button onClick={() => router.back()} className="self-start mb-8 text-white/35 hover:text-white transition-colors text-sm">← Back</button>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-4"
          style={{ background: `${ROOM.host.color}18`, color: ROOM.host.color }}>{ROOM.host.avatar}</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
          <span className="text-xs text-green-400 font-semibold">LIVE</span>
        </div>
        <h1 className="text-xl font-black text-white text-center mb-2">{ROOM.title}</h1>
        <p className="text-sm text-white/40 text-center mb-1">Hosted by {ROOM.host.name}</p>
        <p className="text-xs text-white/25 mb-6">{listeners} listening</p>

        {ROOM.tokenGate && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}>
            🔑 Requires {ROOM.tokenGate.min}+ ${ROOM.tokenGate.symbol} ({ROOM.tokenGate.tier} tier)
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {ROOM.speakers.map(s => (
            <div key={s.handle} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm relative"
                style={{ background: `${s.color}18`, color: s.color }}>
                {s.avatar}
                {s.speaking && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
                    style={{ background: '#22c55e', borderColor: '#04040A' }} />
                )}
              </div>
              <div className="text-xs text-white/35">{s.role}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setJoined(true)}
          className="w-full max-w-xs py-4 rounded-2xl font-black text-base"
          style={{ background: '#22c55e', color: '#04040A' }}>
          🎙 Join Room
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="px-4 pt-4 pb-3 border-b border-white/5 flex-shrink-0"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <p className="text-xs text-green-400 font-semibold">LIVE</p>
              <span className="text-xs text-white/25">{listeners} listening</span>
            </div>
            <h1 className="font-bold text-white text-sm truncate">{ROOM.title}</h1>
          </div>
        </div>
      </header>

      {/* Speakers */}
      <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex flex-wrap gap-4 justify-center">
          {speakers.map(s => (
            <div key={s.handle} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-base transition-all ${s.speaking ? 'ring-2' : ''}`}
                  style={{ background: `${s.color}18`, color: s.color, ringColor: s.color }}>
                  {s.avatar}
                </div>
                {s.speaking && (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                    style={{ background: '#22c55e', borderColor: '#04040A' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                )}
              </div>
              <div className="text-xs text-white/60 font-semibold">{s.name.split(' ')[0]}</div>
              <div className="text-xs text-white/25">{s.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {chat.map(m => (
          <div key={m.id} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
              style={{ background: `${m.color}18`, color: m.color }}>{m.handle[0].toUpperCase()}</div>
            <div>
              <span className="text-xs font-bold" style={{ color: (m as any).isHost ? m.color : 'rgba(255,255,255,0.5)' }}>
                @{m.handle}
                {(m as any).isHost && <span className="ml-1 text-xs" style={{ color: m.color }}>· Host</span>}
              </span>
              <span className="text-xs text-white/55 ml-2">{m.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-4 pb-6 pt-3 border-t border-white/5 flex-shrink-0" style={{ background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-2 mb-3">
          <input value={msg} onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Say something…"
            className="flex-1 px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none" />
          <button onClick={sendMsg}
            className="px-3 py-2 rounded-xl font-bold text-xs"
            style={{ background: '#a855f7', color: '#04040A' }}>→</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMuted(m => !m)}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all"
            style={muted
              ? { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }
              : { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
            {muted ? '🔇 Muted' : '🎙 Speaking'}
          </button>
          <button onClick={() => setHandRaised(h => !h)}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all"
            style={handRaised
              ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
            {handRaised ? '✋ Hand Raised' : '✋ Raise Hand'}
          </button>
          <button onClick={() => { setJoined(false); router.back() }}
            className="py-2.5 px-3 rounded-xl font-bold text-xs"
            style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}
