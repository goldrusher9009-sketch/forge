'use client'
import { useState, useEffect, useRef } from 'react'
import { useAppStore, mockUser, MOCK_THREADS } from '@/lib/store'
import clsx from 'clsx'

const MOCK_MESSAGES: Record<string, { id: string; from: string; text: string; ts: number }[]> = {
  t1: [
    { id: 'm1', from: 'luna_v', text: 'Hey, finally got the ZK health module deployed.', ts: Date.now() - 7200000 },
    { id: 'm2', from: 'scott', text: 'Wait, full proof generation live?', ts: Date.now() - 7100000 },
    { id: 'm3', from: 'luna_v', text: 'Yes. You can prove sleep duration without exposing the raw data.', ts: Date.now() - 7000000 },
    { id: 'm4', from: 'scott', text: 'This changes everything. Testing now.', ts: Date.now() - 6900000 },
    { id: 'm5', from: 'luna_v', text: 'The ZK proof system is live. Check your health module.', ts: Date.now() - 1800000 },
  ],
  t2: [
    { id: 'm1', from: 'noa_d', text: 'Big rooms session tonight, 9pm. Builders & growers.', ts: Date.now() - 28800000 },
    { id: 'm2', from: 'scott', text: "I'll be there. What's the focus?", ts: Date.now() - 28000000 },
    { id: 'm3', from: 'noa_d', text: 'Regenerative finance + ZK identity. Should be deep.', ts: Date.now() - 27200000 },
    { id: 'm4', from: 'noa_d', text: 'You in for the rooms session tonight?', ts: Date.now() - 5400000 },
  ],
  t3: [
    { id: 'm1', from: 'mateuso', text: 'My V-score jumped 40pts this week.', ts: Date.now() - 86400000 },
    { id: 'm2', from: 'scott', text: 'Activity ring pushing it?', ts: Date.now() - 86000000 },
    { id: 'm3', from: 'mateuso', text: 'All 5 rings up actually. The AI twin suggestions really work.', ts: Date.now() - 85000000 },
    { id: 'm4', from: 'mateuso', text: 'My YouToken just hit 50 holders!', ts: Date.now() - 28800000 },
  ],
}

export default function MessagesPage() {
  const { user, setUser } = useAppStore()
  const [active, setActive] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [threads, setThreads] = useState(MOCK_THREADS)
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [mounted, setMounted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active, messages])

  if (!mounted) return null
  const u = user || mockUser()

  const activeThread = threads.find(t => t.id === active)
  const partner = activeThread?.participants.find(p => p !== u.handle)
  const msgs = active ? (messages[active] || []) : []

  function sendMsg() {
    if (!msg.trim() || !active) return
    const newMsg = { id: `m${Date.now()}`, from: u.handle, text: msg, ts: Date.now() }
    setMessages(prev => ({ ...prev, [active]: [...(prev[active] || []), newMsg] }))
    setThreads(prev => prev.map(t => t.id === active ? { ...t, lastMsg: msg, lastTs: Date.now(), unread: 0 } : t))
    setMsg('')
  }

  return (
    <div className="h-screen flex" style={{ background: 'var(--ink)' }}>
      {/* Thread list */}
      <div
        className={clsx(
          'flex flex-col border-r border-white/5',
          active ? 'hidden lg:flex lg:w-80' : 'flex-1 lg:w-80'
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5">
          <p className="t-caption" style={{ fontSize: '0.625rem', marginBottom: '4px' }}>ENCRYPTED · E2E</p>
          <h1 className="font-bold" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>Messages</h1>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 bg-white/4 px-3 py-2" style={{ borderRadius: 'var(--radius)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="rgba(245,244,240,0.3)" strokeWidth="1.3"/><line x1="9.5" y1="9.5" x2="13" y2="13" stroke="rgba(245,244,240,0.3)" strokeWidth="1.3"/></svg>
            <input placeholder="Search" className="bg-transparent text-white/60 text-sm outline-none flex-1 placeholder-white/20" />
          </div>
        </div>

        {/* Threads */}
        <div className="flex-1 overflow-y-auto">
          {threads.map(thread => {
            const pName = thread.participants.find(p => p !== u.handle) || ''
            const isActive = thread.id === active
            return (
              <button
                key={thread.id}
                onClick={() => setActive(thread.id)}
                className={clsx(
                  'w-full flex items-start gap-3 px-4 py-4 border-b border-white/4 text-left transition-colors',
                  isActive ? 'bg-white/5' : 'hover:bg-white/3'
                )}
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-sm"
                  style={{ background: 'rgba(124,58,237,0.3)', color: 'var(--v)' }}
                >
                  {pName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white/80">@{pName}</span>
                    <span className="text-xs text-white/25">{formatRelTime(thread.lastTs)}</span>
                  </div>
                  <p className="text-xs text-white/40 truncate mt-0.5">{thread.lastMsg}</p>
                </div>
                {thread.unread > 0 && (
                  <span
                    className="w-4 h-4 rounded-full text-white flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--v)', fontSize: '0.55rem' }}
                  >
                    {thread.unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* New message */}
        <div className="p-4 border-t border-white/5">
          <button
            className="w-full py-2.5 text-sm font-semibold text-center transition-all hover:opacity-80"
            style={{ border: '1px solid var(--v)', color: 'var(--v)', borderRadius: 'var(--radius)' }}
          >
            + New message
          </button>
        </div>
      </div>

      {/* Message pane */}
      {active ? (
        <div className="flex-1 flex flex-col h-full">
          {/* Convo header */}
          <div
            className="flex items-center gap-4 px-6 py-4 border-b border-white/5"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.85)' }}
          >
            <button
              onClick={() => setActive(null)}
              className="lg:hidden text-white/40 hover:text-white mr-1"
            >
              ←
            </button>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
              style={{ background: 'rgba(124,58,237,0.3)', color: 'var(--v)' }}
            >
              {partner?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-white/90">@{partner}</p>
              <p className="text-xs text-white/35">End-to-end encrypted · Base ID verified</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--ring-activity)' }} />
              <span className="text-xs text-white/30">online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {msgs.map(m => {
              const isMe = m.from === u.handle
              return (
                <div key={m.id} className={clsx('flex', isMe ? 'justify-end' : 'justify-start')}>
                  <div
                    className="max-w-xs lg:max-w-md px-4 py-2.5 text-sm leading-relaxed"
                    style={{
                      background: isMe ? 'var(--v)' : 'rgba(255,255,255,0.05)',
                      color: isMe ? 'white' : 'rgba(245,244,240,0.85)',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    }}
                  >
                    {m.text}
                    <div className={clsx('text-xs mt-1', isMe ? 'text-white/40' : 'text-white/25')}>
                      {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && ' · ✓✓'}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-white/5">
            <div
              className="flex items-end gap-3 bg-white/4 px-4 py-3"
              style={{ borderRadius: '12px' }}
            >
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                placeholder="Message…"
                className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none resize-none leading-relaxed"
                rows={1}
                style={{ maxHeight: '100px' }}
              />
              <button
                onClick={sendMsg}
                disabled={!msg.trim()}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'var(--v)', color: 'white' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 3l5 4-5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-center mt-2" style={{ fontSize: '0.6rem', opacity: 0.2 }}>
              End-to-end encrypted · ZK identity verified
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center flex-col gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 5h18v12H13l-4 4v-4H3V5z" stroke="var(--v)" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-sm text-white/40">Select a conversation</p>
        </div>
      )}
    </div>
  )
}

function formatRelTime(ts: number) {
  const diff = Date.now() - ts
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)}m`
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
