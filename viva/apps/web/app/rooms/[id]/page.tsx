'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Speaker { handle:string; name:string; color:string; verified:boolean; muted:boolean; role:'host'|'speaker'|'listener' }
interface Message { id:string; handle:string; color:string; text:string; ts:string }

const ROOM_DATA: Record<string, { title:string; host:string; hostColor:string; tokenSymbol:string; color:string; minTokens:number; listeners:number; live:boolean; topic:string }> = {
  r1: { title:'DeFi Alpha Room',      host:'sovereign_v', hostColor:'#a855f7', tokenSymbol:'SVRN', color:'#a855f7', minTokens:0,  listeners:284, live:true,  topic:'Weekly DeFi analysis and market alpha' },
  r2: { title:'Beats & Vibes',         host:'jaxbeats',    hostColor:'#ec4899', tokenSymbol:'JAX',  color:'#ec4899', minTokens:5,  listeners:0,   live:false, topic:'Music production and beat drops' },
  r3: { title:'Fitness Accountability',host:'mayafit',     hostColor:'#22c55e', tokenSymbol:'MAYA', color:'#22c55e', minTokens:0,  listeners:128, live:true,  topic:'Monday morning fitness check-in' },
}

const SPEAKERS: Speaker[] = [
  { handle:'sovereign_v', name:'Sovereign V', color:'#a855f7', verified:true,  muted:false, role:'host'     },
  { handle:'atlas_k',     name:'Atlas K',     color:'#818cf8', verified:true,  muted:false, role:'speaker'  },
  { handle:'luna_w',      name:'Luna W.',     color:'#f87171', verified:false, muted:true,  role:'speaker'  },
  { handle:'you',         name:'You',         color:'#a855f7', verified:false, muted:true,  role:'listener' },
  { handle:'kai_r',       name:'Kai R.',      color:'#22c55e', verified:false, muted:true,  role:'listener' },
  { handle:'marco_v',     name:'Marco V.',    color:'#f87171', verified:false, muted:true,  role:'listener' },
  { handle:'jade_l',      name:'Jade L.',     color:'#a855f7', verified:false, muted:true,  role:'listener' },
  { handle:'noa_d',       name:'Noa D.',      color:'#f59e0b', verified:false, muted:true,  role:'listener' },
]

const MESSAGES: Message[] = [
  { id:'m1', handle:'atlas_k',   color:'#818cf8', text:'Great alpha on ETH this week, totally agree with the setup', ts:'2m' },
  { id:'m2', handle:'luna_w',    color:'#f87171', text:'What\'s your target for the BTC move?',                       ts:'1m' },
  { id:'m3', handle:'sovereign_v',color:'#a855f7',text:'Targeting 72k retest before next leg up. Hold tight 🎯',     ts:'45s' },
  { id:'m4', handle:'kai_r',     color:'#22c55e', text:'This room is gold every week 🔥',                             ts:'30s' },
]

const MY_TOKENS: Record<string, number> = { SVRN:50, MAYA:80, JAX:0 }

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const id     = typeof params.id === 'string' ? params.id : 'r1'
  const room   = ROOM_DATA[id] ?? ROOM_DATA.r1

  const [muted, setMuted]     = useState(true)
  const [msg, setMsg]         = useState('')
  const [msgs, setMsgs]       = useState<Message[]>(MESSAGES)
  const [listeners, setListeners] = useState(room.listeners)
  const [raised, setRaised]   = useState(false)
  const [tab, setTab]         = useState<'room'|'chat'>('room')

  // Simulate listener count fluctuating
  useEffect(() => {
    if (!room.live) return
    const t = setInterval(() => {
      setListeners(l => l + (Math.random() > 0.5 ? 1 : -1))
    }, 3000)
    return () => clearInterval(t)
  }, [room.live])

  const canAccess = !room.minTokens || (MY_TOKENS[room.tokenSymbol] ?? 0) >= room.minTokens
  const accent = room.color

  function sendMsg() {
    if (!msg.trim()) return
    setMsgs(prev => [...prev, { id:String(Date.now()), handle:'you', color:'#a855f7', text:msg, ts:'now' }])
    setMsg('')
  }

  const hosts   = SPEAKERS.filter(s => s.role === 'host')
  const speakers= SPEAKERS.filter(s => s.role === 'speaker')
  const listeners_list = SPEAKERS.filter(s => s.role === 'listener')

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-black text-white text-sm truncate">{room.title}</div>
            <div className="flex items-center gap-2">
              {room.live ? (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background:'rgba(248,113,113,0.15)', color:'#f87171' }}>● LIVE</span>
              ) : (
                <span className="text-xs text-white/30">Offline</span>
              )}
              <span className="text-xs text-white/25">{listeners.toLocaleString()} listening</span>
            </div>
          </div>
          {room.live && (
            <button onClick={() => router.back()}
              className="px-3 py-1.5 rounded-xl text-xs font-black"
              style={{ background:'rgba(248,113,113,0.12)', color:'#f87171' }}>
              Leave
            </button>
          )}
        </div>
      </header>

      {/* Gate check */}
      {!canAccess ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <div className="font-black text-white/70 mb-2">Token-Gated Room</div>
          <div className="text-sm text-white/30 mb-6">Hold {room.minTokens}+ ${room.tokenSymbol} to join</div>
          <button onClick={() => router.push(`/tokens/${room.tokenSymbol}/chart`)}
            className="px-6 py-3 rounded-2xl font-black text-sm"
            style={{ background:accent, color:'#04040A' }}>
            Get ${room.tokenSymbol} →
          </button>
        </div>
      ) : (
        <>
          {/* Topic banner */}
          <div className="mx-4 mt-4 p-3 rounded-xl border flex gap-2"
            style={{ background:`${accent}06`, borderColor:`${accent}15` }}>
            <span className="text-sm">📌</span>
            <div className="text-xs text-white/50">{room.topic}</div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mx-4 mt-3 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.04)' }}>
            {(['room','chat'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
                style={tab===t ? { background:'rgba(255,255,255,0.08)', color:'white' } : { color:'rgba(255,255,255,0.3)' }}>
                {t === 'room' ? '🎙 Room' : '💬 Chat'}
              </button>
            ))}
          </div>

          {tab === 'room' && (
            <div className="px-4 py-4 flex-1 overflow-y-auto">
              {/* Host */}
              <div className="text-xs text-white/25 font-semibold uppercase tracking-wider mb-3">Host</div>
              <div className="flex gap-3 mb-4">
                {hosts.map(s => (
                  <div key={s.handle} className="flex flex-col items-center gap-1">
                    <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl"
                      style={{ background:`${s.color}15`, border:`2px solid ${s.color}`, boxShadow:`0 0 16px ${s.color}40` }}>
                      {s.name[0]}
                      {!s.muted && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                        style={{ background:accent }}>🎤</div>}
                    </div>
                    <div className="text-[10px] text-white/50 font-bold">@{s.handle}</div>
                  </div>
                ))}
              </div>

              {/* Speakers */}
              <div className="text-xs text-white/25 font-semibold uppercase tracking-wider mb-3">Speakers</div>
              <div className="flex gap-3 flex-wrap mb-4">
                {speakers.map(s => (
                  <div key={s.handle} className="flex flex-col items-center gap-1">
                    <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base"
                      style={{ background:`${s.color}12`, border:`1.5px solid ${s.color}40` }}>
                      {s.name[0]}
                      {s.muted && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center"
                        style={{ background:'rgba(248,113,113,0.2)', color:'#f87171' }}>🔇</div>}
                    </div>
                    <div className="text-[10px] text-white/40">{s.name.split(' ')[0]}</div>
                  </div>
                ))}
              </div>

              {/* Listeners */}
              <div className="text-xs text-white/25 font-semibold uppercase tracking-wider mb-3">
                Listeners ({listeners_list.length}+)
              </div>
              <div className="flex gap-2 flex-wrap">
                {listeners_list.map(s => (
                  <div key={s.handle} className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                    style={{ background:`${s.color}10`, color:s.color }}>
                    {s.handle === 'you' ? 'Y' : s.name[0]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'chat' && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {msgs.map(m => (
                  <div key={m.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{ background:`${m.color}15`, color:m.color }}>
                      {m.handle === 'you' ? 'Y' : m.handle[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold" style={{ color:m.color }}>@{m.handle}</span>
                        <span className="text-[10px] text-white/20">{m.ts}</span>
                      </div>
                      <div className="text-sm text-white/70 mt-0.5">{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-2 flex gap-2">
                <input value={msg} onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Say something…"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/20 outline-none" />
                <button onClick={sendMsg}
                  className="px-3 py-2.5 rounded-xl font-black text-sm"
                  style={{ background:accent, color:'#04040A' }}>→</button>
              </div>
            </div>
          )}

          {/* Bottom controls */}
          <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 border-t border-white/5"
            style={{ background:'rgba(4,4,10,0.95)', backdropFilter:'blur(20px)' }}>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setMuted(m => !m)}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={muted ? { background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.2)' }
                             : { background:`${accent}15`, border:`1px solid ${accent}30` }}>
                {muted ? '🔇' : '🎤'}
              </button>
              <button onClick={() => setRaised(r => !r)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={raised ? { background:`${accent}15`, border:`1px solid ${accent}30` }
                              : { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                ✋
              </button>
              <button onClick={() => router.back()}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={{ background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.2)' }}>
                📵
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
