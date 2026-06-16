'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CONTACTS: Record<string, { name: string; color: string; handle: string; vscore: number; tier: string | null; online: boolean }> = {
  mayafit:    { name: 'Maya Chen',   color: '#22c55e', handle: 'mayafit',    vscore: 810, tier: 'Gold',    online: true  },
  jaxbeats:   { name: 'Jax Beats',   color: '#ec4899', handle: 'jaxbeats',   vscore: 760, tier: 'Silver',  online: false },
  crypto_kat: { name: 'Kat Zhou',    color: '#818cf8', handle: 'crypto_kat', vscore: 880, tier: 'Diamond', online: true  },
  noa_d:      { name: 'Noa D.',      color: '#a855f7', handle: 'noa_d',      vscore: 920, tier: 'Diamond', online: true  },
  danr:       { name: 'Dan R.',      color: '#34d399', handle: 'danr',       vscore: 700, tier: 'Silver',  online: false },
}

interface Msg {
  id: string
  from: 'me' | 'them'
  text: string
  ts: string
  read?: boolean
  reaction?: string
}

const SEED_MESSAGES: Msg[] = [
  { id: 'm1', from: 'them', text: 'Yo did you see the new V-Score update? Staking rewards went up 👀', ts: '2026-06-15T18:00:00Z' },
  { id: 'm2', from: 'me',   text: 'Yeah! Diamond tier is actually insane now. 35% APY 🤯', ts: '2026-06-15T18:01:00Z' },
  { id: 'm3', from: 'them', text: 'I\'ve been stacking $SVRN. Your content has been fire lately', ts: '2026-06-15T18:02:00Z', reaction: '🔥' },
  { id: 'm4', from: 'me',   text: 'Appreciate it! Working on a collab series — you in?', ts: '2026-06-15T18:03:00Z' },
  { id: 'm5', from: 'them', text: 'Definitely. When you thinking?', ts: '2026-06-15T18:05:00Z' },
  { id: 'm6', from: 'me',   text: 'Next week. I\'ll DM you the doc 🫡', ts: '2026-06-15T18:06:00Z', read: true },
]

const QUICK_REPLIES = ['👋', '🔥', '💎', '💸', 'Noted!', 'Let\'s do it!', 'When?', 'Deal 🤝']

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function DMThreadPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'mayafit'
  const contact = CONTACTS[handle] ?? CONTACTS.mayafit

  const [messages, setMessages] = useState<Msg[]>(SEED_MESSAGES)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [reactingTo, setReactingTo] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send(text?: string) {
    const val = text ?? input.trim()
    if (!val) return
    const newMsg: Msg = {
      id: `m${Date.now()}`,
      from: 'me',
      text: val,
      ts: new Date().toISOString(),
      read: false,
    }
    setMessages(m => [...m, newMsg])
    setInput('')
    // Simulate typing + reply
    setTimeout(() => setTyping(true), 800)
    setTimeout(() => {
      setTyping(false)
      const replies = [
        'Ha, love it 🙌', 'For sure!', '💎 let\'s gooo', 'Makes sense', 'Sent you a follow too!', '🔥🔥', 'On it!'
      ]
      setMessages(m => [...m, {
        id: `r${Date.now()}`,
        from: 'them',
        text: replies[Math.floor(Math.random() * replies.length)],
        ts: new Date().toISOString(),
      }])
    }, 2400)
  }

  function addReaction(msgId: string, emoji: string) {
    setMessages(m => m.map(msg => msg.id === msgId ? { ...msg, reaction: emoji } : msg))
    setReactingTo(null)
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/5 z-20"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Avatar */}
          <button onClick={() => router.push(`/profile/${handle}`)} className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: `${contact.color}18`, color: contact.color, border: `1.5px solid ${contact.color}25` }}>
              {contact.name[0]}
            </div>
            {contact.online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: '#22c55e', borderColor: '#04040A' }} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <button onClick={() => router.push(`/profile/${handle}`)}
              className="font-bold text-white/85 hover:text-white transition-colors text-sm">{contact.name}</button>
            <div className="text-xs text-white/30">
              {contact.online ? '🟢 Online' : '⚫ Offline'} · V-Score {contact.vscore}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <button onClick={() => router.push(`/profile/${handle}`)}
              className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors text-sm">
              👤
            </button>
            <button className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors text-sm">
              📞
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" onClick={() => setReactingTo(null)}>
        {/* Token holding badge */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{ background: `${contact.color}10`, color: contact.color, border: `1px solid ${contact.color}20` }}>
            💎 {contact.tier ?? 'Holder'} · You hold tokens of each other
          </div>
        </div>

        {messages.map((msg, i) => {
          const isMe = msg.from === 'me'
          const prevSameFrom = i > 0 && messages[i - 1].from === msg.from
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${prevSameFrom ? 'mt-0.5' : 'mt-3'}`}>
              {!isMe && !prevSameFrom && (
                <div className="w-7 h-7 rounded-lg mr-2 mt-auto flex-shrink-0 flex items-center justify-center font-black text-xs"
                  style={{ background: `${contact.color}18`, color: contact.color }}>
                  {contact.name[0]}
                </div>
              )}
              {!isMe && prevSameFrom && <div className="w-7 mr-2 flex-shrink-0" />}

              <div className="relative max-w-[75%]">
                <button
                  className="text-left px-3 py-2 rounded-2xl text-sm leading-relaxed transition-all"
                  style={isMe
                    ? { background: '#a855f7', color: '#04040A', borderBottomRightRadius: prevSameFrom ? 16 : 4 }
                    : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: prevSameFrom ? 16 : 4 }}
                  onDoubleClick={() => setReactingTo(msg.id)}>
                  {msg.text}
                </button>

                {/* Reaction */}
                {msg.reaction && (
                  <div className="absolute -bottom-2 right-1 text-xs px-1 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {msg.reaction}
                  </div>
                )}

                {/* Reaction picker */}
                {reactingTo === msg.id && (
                  <div className="absolute bottom-8 left-0 flex gap-1 p-1.5 rounded-xl z-10 border border-white/10"
                    style={{ background: 'rgba(20,20,35,0.95)', backdropFilter: 'blur(10px)' }}
                    onClick={e => e.stopPropagation()}>
                    {['❤️', '🔥', '💎', '😂', '👀', '🙌'].map(e => (
                      <button key={e} onClick={() => addReaction(msg.id, e)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-base">
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp for last in group */}
                {(i === messages.length - 1 || messages[i + 1]?.from !== msg.from) && (
                  <div className={`text-xs text-white/20 mt-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                    {fmtTime(msg.ts)}
                    {isMe && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {typing && (
          <div className="flex items-center gap-2 justify-start mt-3">
            <div className="w-7 h-7 rounded-lg mr-2 flex-shrink-0 flex items-center justify-center font-black text-xs"
              style={{ background: `${contact.color}18`, color: contact.color }}>
              {contact.name[0]}
            </div>
            <div className="px-3 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'rgba(255,255,255,0.4)', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_REPLIES.map(r => (
            <button key={r} onClick={() => send(r)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-6 pt-1 border-t border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/6"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={`Message ${contact.name}…`}
              className="flex-1 text-sm text-white bg-transparent outline-none placeholder-white/20"
            />
            <button className="text-white/25 hover:text-white/50 transition-colors text-base">😊</button>
          </div>
          <button onClick={() => send()}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
            style={{ background: input.trim() ? '#a855f7' : 'rgba(255,255,255,0.06)' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 10l14-7-7 14V10H3z" fill={input.trim() ? '#04040A' : 'rgba(255,255,255,0.3)'} />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
