'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

const ROOMS: Record<string, { title: string; color: string; host: string; live: boolean }> = {
  r1: { title:'DeFi Alpha Room', color:'#a855f7', host:'sovereign_v', live:true  },
  r2: { title:'Beats & Vibes',   color:'#ec4899', host:'jaxbeats',    live:false },
  r3: { title:'Fitness Focus',   color:'#22c55e', host:'mayafit',     live:true  },
}

interface ChatMsg {
  id: string
  handle: string
  name: string
  color: string
  text: string
  ts: string
  tier?: 'Diamond' | 'Gold' | 'Silver'
  pinned?: boolean
}

const SEED_MSGS: ChatMsg[] = [
  { id:'m1', handle:'atlas_k',  name:'Atlas K',   color:'#818cf8', text:'LFG! 💎 That BTC setup is looking insane', ts:'14:31', tier:'Diamond' },
  { id:'m2', handle:'lily_p',   name:'Lily P.',   color:'#f59e0b', text:'On-chain data backing this up hard',        ts:'14:31', tier:'Gold'    },
  { id:'m3', handle:'luna_w',   name:'Luna W.',   color:'#f87171', text:'What\'s the target? 40k retest?',           ts:'14:32'                  },
  { id:'m4', handle:'noa_d',    name:'Noa D.',    color:'#f59e0b', text:'Volume profile looks clean above 38.5k',   ts:'14:32', tier:'Silver'   },
  { id:'m5', handle:'kai_r',    name:'Kai R.',    color:'#22c55e', text:'Been waiting for this level for weeks 🔥', ts:'14:33'                  },
  { id:'m6', handle:'jade_l',   name:'Jade L.',   color:'#a855f7', text:'Stacking more SVRN before this pumps',     ts:'14:33', tier:'Diamond'  },
  { id:'m7', handle:'marco_v',  name:'Marco V.',  color:'#f87171', text:'RS diverging on 4H too',                   ts:'14:34'                  },
  { id:'m8', handle:'max_t',    name:'Max T.',    color:'#ec4899', text:'GM everyone! Just tuned in',               ts:'14:34'                  },
]

const AUTO_MSGS = [
  { handle:'dex_n',  name:'Dex N.',   color:'#818cf8', text:'This is the alpha I\'ve been waiting for 👀' },
  { handle:'sam_q',  name:'Sam Q.',   color:'#22c55e', text:'SVRN holding 8.50 now strong support' },
  { handle:'alex_m', name:'Alex M.',  color:'#f59e0b', text:'Volume spike incoming lfg 🚀' },
  { handle:'riley_k',name:'Riley K.', color:'#ec4899', text:'Diamond members already knew 💎' },
  { handle:'pat_r',  name:'Pat R.',   color:'#a855f7', text:'Someone DM me the signal from last week?' },
]

const TIER_COLOR: Record<string, string> = { Diamond:'#818cf8', Gold:'#f59e0b', Silver:'#94a3b8' }

export default function RoomChatPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = typeof params.id === 'string' ? params.id : 'r1'
  const room    = ROOMS[id] ?? ROOMS.r1

  const [msgs,    setMsgs   ] = useState<ChatMsg[]>(SEED_MSGS)
  const [input,   setInput  ] = useState('')
  const [sending, setSending] = useState(false)
  const [viewers, setViewers] = useState(284)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // Simulate incoming chat
  useEffect(() => {
    if (!room.live) return
    let i = 0
    const iv = setInterval(() => {
      const m = AUTO_MSGS[i % AUTO_MSGS.length]
      setMsgs(prev => [...prev, {
        id: `auto_${Date.now()}`, ...m,
        ts: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false }),
      }])
      setViewers(v => v + Math.floor(Math.random() * 6) - 2)
      i++
    }, 4000)
    return () => clearInterval(iv)
  }, [room.live])

  async function sendMsg() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    await new Promise(r => setTimeout(r, 200))
    setMsgs(prev => [...prev, {
      id: `me_${Date.now()}`, handle:'me', name:'You', color: room.color,
      text, ts: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false }),
    }])
    setSending(false)
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm truncate">{room.title}</span>
              {room.live && (
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <div className="text-xs text-white/25">@{room.host} · {viewers} watching</div>
          </div>
          <button onClick={() => router.push(`/rooms/${id}`)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: `${room.color}15`, color: room.color }}>
            Room
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {msgs.map(m => (
          <div key={m.id} className={`flex items-start gap-2 ${m.handle === 'me' ? 'flex-row-reverse' : ''}`}>
            {m.handle !== 'me' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: `${m.color}15`, color: m.color }}>
                {m.name[0]}
              </div>
            )}
            <div className={`max-w-[75%] ${m.handle === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
              {m.handle !== 'me' && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold" style={{ color: m.color }}>{m.name}</span>
                  {m.tier && <span className="text-xs" style={{ color: TIER_COLOR[m.tier] }}>
                    {m.tier === 'Diamond' ? '💎' : m.tier === 'Gold' ? '🥇' : '🥈'}
                  </span>}
                </div>
              )}
              <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                style={m.handle === 'me'
                  ? { background: `${room.color}25`, color: 'rgba(255,255,255,0.85)', borderRadius: '18px 18px 4px 18px' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', borderRadius: '4px 18px 18px 18px' }}>
                {m.text}
              </div>
              <div className="text-xs text-white/15 mt-0.5 px-1">{m.ts}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/6">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Say something…"
              className="flex-1 text-sm text-white placeholder-white/20 bg-transparent outline-none" />
          </div>
          <button onClick={sendMsg} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm disabled:opacity-30"
            style={{ background: room.color, color: '#04040A' }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
