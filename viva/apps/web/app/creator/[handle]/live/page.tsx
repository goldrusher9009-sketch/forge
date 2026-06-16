'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ChatMsg {
  id: string
  author: string
  authorColor: string
  verified: boolean
  body: string
  ts: number
}

interface StreamStats {
  viewers: number
  tips: number
  likes: number
}

const CREATOR_DATA: Record<string, { name: string; color: string; title: string; category: string; tokenSymbol: string; minTokens?: number }> = {
  sovereign_v: { name: 'Sovereign V', color: '#a855f7', title: 'DeFi Alpha Stream — Live Market Analysis', category: '📈 DeFi', tokenSymbol: 'SVRN' },
  mayafit:     { name: 'Maya Chen',   color: '#22c55e', title: 'Live Workout: Full Body Shred', category: '💪 Fitness', tokenSymbol: 'MAYA', minTokens: 10 },
  jaxbeats:    { name: 'Jax Beats',  color: '#ec4899', title: 'Beat Making Session + Q&A', category: '🎵 Music', tokenSymbol: 'JAX' },
}

const INIT_MESSAGES: ChatMsg[] = [
  { id: 'm1', author: 'atlas_k',  authorColor: '#818cf8', verified: true,  body: 'Let\'s go!! 🔥',              ts: Date.now() - 60000 },
  { id: 'm2', author: 'luna_w',   authorColor: '#f87171', verified: false, body: 'First time watching live!',   ts: Date.now() - 45000 },
  { id: 'm3', author: 'noa_d',    authorColor: '#f59e0b', verified: false, body: 'That BTC setup looks insane', ts: Date.now() - 30000 },
  { id: 'm4', author: 'kai_r',    authorColor: '#22c55e', verified: false, body: '💎💎💎',                       ts: Date.now() - 15000 },
  { id: 'm5', author: 'marco_v',  authorColor: '#f87171', verified: false, body: 'Just joined 👋',             ts: Date.now() - 5000  },
]

const BOT_MESSAGES = [
  { author: 'jade_l',   authorColor: '#a855f7', verified: false, body: 'What are you thinking about ETH?' },
  { author: 'dex_n',    authorColor: '#818cf8', verified: false, body: '🚀🚀🚀' },
  { author: 'sam_q',    authorColor: '#22c55e', verified: false, body: 'This is gold, thank you!' },
  { author: 'lily_p',   authorColor: '#f59e0b', verified: true,  body: 'Great analysis as always!' },
  { author: 'max_t',    authorColor: '#ec4899', verified: false, body: 'Can you explain that chart again?' },
  { author: 'atlas_k',  authorColor: '#818cf8', verified: true,  body: 'Just bought more SVRN 💎' },
  { author: 'kai_r',    authorColor: '#22c55e', verified: false, body: 'W stream every time' },
]

const MY_TOKENS: Record<string, number> = { SVRN: 50, MAYA: 80, JAX: 0 }
const TIP_PRESETS = [5, 10, 25, 50]

export default function CreatorLivePage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const creator = CREATOR_DATA[handle] ?? CREATOR_DATA.sovereign_v

  const canAccess = !creator.minTokens || (MY_TOKENS[creator.tokenSymbol] ?? 0) >= creator.minTokens

  const [messages, setMessages] = useState<ChatMsg[]>(INIT_MESSAGES)
  const [input, setInput] = useState('')
  const [stats, setStats] = useState<StreamStats>({ viewers: 284, tips: 47, likes: 1204 })
  const [liked, setLiked] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [tipAmt, setTipAmt] = useState(10)
  const [tipping, setTipping] = useState(false)
  const [tipped, setTipped] = useState(false)
  const [elapsed, setElapsed] = useState(3720) // 1h 2m
  const chatRef = useRef<HTMLDivElement>(null)

  // Simulate live viewers and chat
  useEffect(() => {
    const chatInterval = setInterval(() => {
      const bot = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)]
      const msg: ChatMsg = { id: `m${Date.now()}`, ...bot, ts: Date.now() }
      setMessages(prev => [...prev.slice(-50), msg])
      setStats(prev => ({ ...prev, viewers: Math.max(100, prev.viewers + Math.round((Math.random() - 0.48) * 8)) }))
    }, 3000)
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { clearInterval(chatInterval); clearInterval(timer) }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  function sendMessage() {
    if (!input.trim()) return
    const msg: ChatMsg = { id: `m${Date.now()}`, author: 'you', authorColor: '#a855f7', verified: false, body: input, ts: Date.now() }
    setMessages(prev => [...prev, msg])
    setInput('')
  }

  async function sendTip() {
    setTipping(true)
    await new Promise(r => setTimeout(r, 800))
    setTipping(false)
    setTipped(true)
    setShowTip(false)
    setStats(prev => ({ ...prev, tips: prev.tips + tipAmt }))
    setTimeout(() => setTipped(false), 3000)
  }

  function toggleLike() {
    setLiked(l => {
      setStats(prev => ({ ...prev, likes: l ? prev.likes - 1 : prev.likes + 1 }))
      return !l
    })
  }

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#f87171' }} />
              <span className="text-xs font-black" style={{ color: '#f87171' }}>LIVE</span>
              <span className="text-xs text-white/30">{formatElapsed(elapsed)}</span>
            </div>
            <div className="text-xs text-white/50 truncate">{creator.title}</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <span>👁</span>
            <span className="font-bold">{stats.viewers.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {canAccess ? (
        <div className="flex flex-col flex-1">
          {/* Stream area */}
          <div className="aspect-video relative flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${creator.color}08 0%, rgba(4,4,10,0.9) 100%)`, minHeight: 200 }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-2"
                style={{ background: `${creator.color}20`, color: creator.color }}>
                {creator.name[0]}
              </div>
              <div className="text-sm font-bold text-white/60">{creator.name}</div>
              <div className="text-xs text-white/25">{creator.category}</div>
            </div>
            {/* Stream overlay stats */}
            <div className="absolute top-3 left-3 flex gap-2">
              <div className="px-2 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}>🔴 LIVE</div>
            </div>
            {tipped && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="px-4 py-2 rounded-full font-black text-sm animate-bounce"
                  style={{ background: '#22c55e', color: '#04040A' }}>
                  💸 Tip sent! ${tipAmt}
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
            <button onClick={toggleLike}
              className="flex items-center gap-1 text-sm"
              style={{ color: liked ? creator.color : 'rgba(255,255,255,0.35)' }}>
              {liked ? '❤️' : '🤍'}
              <span className="font-bold text-xs">{stats.likes.toLocaleString()}</span>
            </button>
            <button onClick={() => setShowTip(t => !t)}
              className="flex items-center gap-1 text-sm text-white/35">
              💸 <span className="font-bold text-xs">${stats.tips}</span>
            </button>
            <button onClick={() => router.push(`/tokens/${creator.tokenSymbol}/chart`)}
              className="ml-auto px-3 py-1 rounded-full text-xs font-black"
              style={{ background: `${creator.color}20`, color: creator.color }}>
              ${creator.tokenSymbol} {MY_TOKENS[creator.tokenSymbol] > 0 ? `· ${MY_TOKENS[creator.tokenSymbol]}` : ''}
            </button>
          </div>

          {/* Tip panel */}
          {showTip && (
            <div className="px-4 py-3 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/35 font-semibold mb-2">Send a tip</div>
              <div className="flex gap-1.5 mb-2">
                {TIP_PRESETS.map(p => (
                  <button key={p} onClick={() => setTipAmt(p)}
                    className="flex-1 py-1.5 rounded-full text-xs font-bold"
                    style={tipAmt === p ? { background: creator.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    ${p}
                  </button>
                ))}
              </div>
              <button onClick={sendTip} disabled={tipping}
                className="w-full py-2 rounded-xl text-xs font-black disabled:opacity-50"
                style={{ background: creator.color, color: '#04040A' }}>
                {tipping ? 'Sending…' : `💸 Send $${tipAmt} Tip`}
              </button>
            </div>
          )}

          {/* Chat */}
          <div ref={chatRef} className="flex-1 px-3 py-3 overflow-y-auto space-y-2" style={{ maxHeight: 280 }}>
            {messages.map(msg => (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center font-black text-[9px] flex-shrink-0 mt-0.5"
                  style={{ background: `${msg.authorColor}15`, color: msg.authorColor }}>
                  {msg.author[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold mr-1.5" style={{ color: msg.authorColor }}>
                    {msg.author}{msg.verified && ' ✓'}
                  </span>
                  <span className="text-xs text-white/60">{msg.body}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div className="px-3 py-3 border-t border-white/5 flex gap-2"
            style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Say something…"
              className="flex-1 px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
            <button onClick={sendMessage} disabled={!input.trim()}
              className="px-3 py-2 rounded-xl text-xs font-black disabled:opacity-30"
              style={{ background: creator.color, color: '#04040A' }}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="text-5xl">🔒</div>
          <div className="font-black text-xl text-white">Token-Gated Stream</div>
          <div className="text-sm text-white/40">Hold {creator.minTokens}+ ${creator.tokenSymbol} to watch</div>
          <button onClick={() => router.push(`/tokens/${creator.tokenSymbol}/chart`)}
            className="px-6 py-3 rounded-xl font-black text-sm"
            style={{ background: creator.color, color: '#04040A' }}>
            Get ${creator.tokenSymbol} →
          </button>
        </div>
      )}
    </div>
  )
}
