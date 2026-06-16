'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Message {
  id: string
  from: 'me' | 'them'
  text: string
  ts: string
  read: boolean
  attachment?: { type: 'token'; symbol: string; amount: number; color: string }
}

const PROFILES: Record<string, { name: string; color: string; verified: boolean; tokenSymbol: string; tokenPrice: number; online: boolean }> = {
  sovereign_v: { name: 'Sovereign V',  color: '#a855f7', verified: true,  tokenSymbol: 'SVRN', tokenPrice: 8.75, online: true  },
  mayafit:     { name: 'Maya Chen',    color: '#22c55e', verified: true,  tokenSymbol: 'MAYA', tokenPrice: 5.20, online: false },
  jaxbeats:    { name: 'Jax Beats',   color: '#ec4899', verified: true,  tokenSymbol: 'JAX',  tokenPrice: 3.80, online: true  },
  atlas_k:     { name: 'Atlas K',     color: '#818cf8', verified: false, tokenSymbol: 'SVRN', tokenPrice: 8.75, online: false },
}

const MOCK_MESSAGES: Record<string, Message[]> = {
  sovereign_v: [
    { id:'m1', from:'them', text:'Hey, saw your portfolio — massive SVRN position 🔥', ts:'2026-06-15T08:00:00Z', read: true },
    { id:'m2', from:'me',   text:"Thanks! Been accumulating since $4. You holding any?", ts:'2026-06-15T08:02:00Z', read: true },
    { id:'m3', from:'them', text:'Yeah, staked 200 at Gold tier. The 22% APY is insane', ts:'2026-06-15T08:05:00Z', read: true },
    { id:'m4', from:'them', text:'DM me when you want to talk strategy — sending you a token tip', ts:'2026-06-15T08:06:00Z', read: true, attachment: { type: 'token', symbol: 'SVRN', amount: 5, color: '#a855f7' } },
    { id:'m5', from:'me',   text:"Received! 🙏 Let's sync this week", ts:'2026-06-15T10:30:00Z', read: true },
    { id:'m6', from:'them', text:'Deal. DeFi Alpha Room going live at 3pm if you want to join', ts:'2026-06-15T10:32:00Z', read: false },
  ],
  mayafit: [
    { id:'m1', from:'them', text:'Hey! Just saw you staked some MAYA 💪', ts:'2026-06-14T09:00:00Z', read: true },
    { id:'m2', from:'me',   text:'Yeah! Love the content. The 30-day program is 🔥', ts:'2026-06-14T09:10:00Z', read: true },
    { id:'m3', from:'them', text:'Thank you so much!! New program dropping next week 👀', ts:'2026-06-14T09:15:00Z', read: false },
  ],
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function MessageThreadPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? PROFILES.sovereign_v

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES[handle] ?? MOCK_MESSAGES.sovereign_v)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    const msg: Message = { id: `m${Date.now()}`, from: 'me', text: text.trim(), ts: new Date().toISOString(), read: false }
    setText('')
    await new Promise(r => setTimeout(r, 400))
    setMessages(prev => [...prev, msg])
    setSending(false)
    // Simulate reply after 1.5s
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `reply${Date.now()}`, from: 'them',
        text: "Got it! I'll get back to you shortly 🙌",
        ts: new Date().toISOString(), read: false,
      }])
    }, 1800)
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5 flex-shrink-0"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => router.push(`/profile/${handle}`)} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                style={{ background: `${profile.color}15`, color: profile.color }}>
                {profile.name[0]}
              </div>
              {profile.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#04040A]"
                  style={{ background: '#22c55e' }} />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-black text-sm text-white/85">{profile.name}</span>
                {profile.verified && <span className="text-xs" style={{ color: profile.color }}>✓</span>}
              </div>
              <div className="text-xs" style={{ color: profile.online ? '#22c55e' : 'rgba(255,255,255,0.25)' }}>
                {profile.online ? 'Online' : 'Offline'}
              </div>
            </div>
          </button>
          <button onClick={() => router.push(`/tokens/${profile.tokenSymbol}/chart`)}
            className="text-xs font-black px-2 py-1 rounded-lg flex-shrink-0"
            style={{ background: `${profile.color}15`, color: profile.color }}>
            ${profile.tokenSymbol} ${profile.tokenPrice}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[78%]">
              {msg.attachment && (
                <div className="mb-1 p-2 rounded-xl border text-xs font-bold flex items-center gap-2"
                  style={{ background: `${msg.attachment.color}10`, borderColor: `${msg.attachment.color}20`, color: msg.attachment.color }}>
                  💎 Sent {msg.attachment.amount} ${msg.attachment.symbol}
                </div>
              )}
              <div className="px-3 py-2 rounded-2xl text-sm"
                style={msg.from === 'me'
                  ? { background: '#a855f7', color: '#04040A', borderBottomRightRadius: 4 }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', borderBottomLeftRadius: 4 }}>
                {msg.text}
              </div>
              <div className={`text-xs text-white/20 mt-0.5 ${msg.from === 'me' ? 'text-right' : 'text-left'}`}>
                {fmtTime(msg.ts)}
                {msg.from === 'me' && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-end gap-2">
          <button onClick={() => setShowTip(t => !t)}
            className="p-2.5 rounded-xl flex-shrink-0 text-sm"
            style={{ background: showTip ? `${profile.color}18` : 'rgba(255,255,255,0.05)', color: showTip ? profile.color : 'rgba(255,255,255,0.3)' }}>
            💎
          </button>
          <div className="flex-1 flex items-end gap-2 px-3 py-2 rounded-xl border border-white/6"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <textarea value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={`Message @${handle}…`} rows={1}
              className="flex-1 text-sm text-white placeholder-white/20 bg-transparent outline-none resize-none"
              style={{ maxHeight: 96 }} />
          </div>
          <button onClick={send} disabled={!text.trim() || sending}
            className="p-2.5 rounded-xl flex-shrink-0 font-black text-sm disabled:opacity-30"
            style={{ background: '#a855f7', color: '#04040A' }}>
            {sending ? '…' : '↑'}
          </button>
        </div>
        {showTip && (
          <div className="mt-2 p-3 rounded-xl border text-xs"
            style={{ background: `${profile.color}08`, borderColor: `${profile.color}20` }}>
            <div className="font-bold mb-1" style={{ color: profile.color }}>Send Token Tip</div>
            <div className="flex gap-2">
              {[1, 5, 10, 25].map(amt => (
                <button key={amt} onClick={() => setShowTip(false)}
                  className="px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: `${profile.color}20`, color: profile.color }}>
                  {amt} ${profile.tokenSymbol}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
