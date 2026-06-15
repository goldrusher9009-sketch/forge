'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore, mockUser, MOCK_THREADS } from '@/lib/store'
import { messages as messagesApi } from '@/lib/api'

export default function MessagesPage() {
  const { user, setUser } = useAppStore()
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<any[]>([])
  const [activeThread, setActiveThread] = useState<any | null>(null)
  const [msgs, setMsgs] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [mounted, setMounted] = useState(false)
  const [sending, setSending] = useState(false)
  const [showThread, setShowThread] = useState(false) // mobile slide-in
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const didAutoOpen = useRef(false)

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadThreads()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // Focus input when thread opens on mobile
  useEffect(() => {
    if (showThread && activeThread) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [showThread, activeThread])

  // Auto-open thread from ?thread= URL param once threads are loaded
  useEffect(() => {
    if (!mounted || didAutoOpen.current || threads.length === 0) return
    const threadId = searchParams.get('thread')
    if (!threadId) return
    didAutoOpen.current = true
    const found = threads.find((t: any) => t.id === threadId)
    if (found) {
      openThread(found)
    } else {
      // Thread not in list yet (just created) — fetch it directly and prepend
      messagesApi.getMessages(threadId).then(data => {
        const syntheticThread = {
          id: threadId,
          participants: [],
          lastMessage: null,
          messages: data.messages ?? data,
        }
        setThreads(prev => [syntheticThread, ...prev])
        openThread(syntheticThread)
      }).catch(() => {})
    }
  }, [mounted, threads, searchParams])

  async function loadThreads() {
    try {
      const raw = await messagesApi.threads()
      // API returns members: [{userId, user: {id,handle,displayName,avatarUrl}}]
      // Normalize to participants: [{displayName, handle, avatarUrl}] filtering out self
      const uid = user?.id ?? (typeof window !== 'undefined' ? localStorage.getItem('viva_user_id') : null)
      const data = raw.map((t: any) => {
        const otherMembers = (t.members ?? [])
          .filter((m: any) => m.userId !== uid && m.userId !== 'me')
          .map((m: any) => m.user ?? { displayName: m.userId, handle: m.userId, avatarUrl: null })
        const lastMessage = t.messages?.[0] ?? null
        return {
          ...t,
          participants: otherMembers,
          lastMessage,
        }
      })
      setThreads(data)
    } catch {
      setThreads(MOCK_THREADS as any)
    }
  }

  async function openThread(thread: any) {
    setActiveThread(thread)
    setShowThread(true)
    try {
      const data = await messagesApi.getMessages(thread.id)
      setMsgs(data.messages ?? data)
    } catch {
      setMsgs(thread.messages ?? [])
    }
  }

  const sendMsg = useCallback(async () => {
    if (!msg.trim() || !activeThread || sending) return
    setSending(true)
    const content = msg.trim()
    setMsg('')
    const optimistic = { id: `m${Date.now()}`, content, senderId: 'me', createdAt: new Date().toISOString() }
    setMsgs(prev => [...prev, optimistic])
    try {
      await messagesApi.send(activeThread.id, content)
    } catch {}
    setSending(false)
    // Keep focus on input after send
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [msg, activeThread, sending])

  if (!mounted) return null
  const u = user || mockUser()

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--ink)', overflow: 'hidden' }}>
      {/* ── Mobile: thread list ── */}
      <div className={`flex flex-col lg:hidden ${showThread ? 'hidden' : 'flex'}`} style={{ height: '100dvh' }}>
        <header className="px-5 py-5 border-b border-white/5"
          style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.95)' }}>
          <p className="t-caption" style={{ fontSize: '0.625rem' }}>ENCRYPTED MESSENGER</p>
          <h1 className="font-bold mt-0.5" style={{ fontSize: '1.5rem', letterSpacing: '-0.03em' }}>Messages</h1>
        </header>
        <div className="flex-1 overflow-y-auto">
          {threads.map((thread: any) => {
            const name = thread.participants?.[0]?.displayName ?? thread.name ?? 'Unknown'
            const handle = thread.participants?.[0]?.handle ?? thread.handle ?? 'unknown'
            const avatar = thread.participants?.[0]?.avatarUrl ?? `https://api.dicebear.com/7.x/shapes/svg?seed=${handle}`
            const lastMsg = thread.lastMessage?.content ?? thread.lastMsg ?? ''
            const unread = thread.unreadCount ?? thread.unread ?? 0
            return (
              <button key={thread.id} onClick={() => openThread(thread)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors border-b border-white/4 text-left tap-target">
                <img src={avatar} alt={name} className="w-11 h-11 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-white/85 truncate">{name}</span>
                    {unread > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--v)', color: 'white', fontSize: '0.6rem' }}>{unread}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/35 truncate">{lastMsg}</p>
                  <p className="text-xs text-white/20 mt-0.5">ZK verified · E2E encrypted</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 opacity-20">
                  <path d="M5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Mobile: active thread ── */}
      <div className={`flex-col lg:hidden ${showThread ? 'flex' : 'hidden'}`} style={{ height: '100dvh' }}>
        {/* Thread header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0"
          style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.95)' }}>
          <button onClick={() => setShowThread(false)}
            className="press w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {activeThread && (
            <>
              <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${activeThread.handle ?? 'user'}`}
                alt="" className="w-9 h-9 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{activeThread.participants?.[0]?.displayName ?? activeThread.name ?? 'Unknown'}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ring-activity)' }} />
                  <p className="text-xs text-white/35">ZK verified</p>
                </div>
              </div>
            </>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ overscrollBehavior: 'contain' }}>
          {msgs.map((m: any) => {
            const isMe = m.senderId === 'me' || m.senderId === u.id
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[78%] px-4 py-2.5 text-sm rounded-2xl"
                  style={{
                    background: isMe ? 'var(--v)' : 'rgba(255,255,255,0.06)',
                    color: isMe ? 'white' : 'rgba(245,244,240,0.85)',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}>
                  {m.content}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input — fixed at bottom, safe area aware */}
        <div className="flex-shrink-0 border-t border-white/5 px-4 py-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)', background: 'rgba(4,4,10,0.98)' }}>
          <div className="flex items-center gap-2.5">
            <input ref={inputRef} type="text" value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Message…"
              autoComplete="off"
              className="flex-1 px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '22px',
                fontSize: '16px', // prevent iOS zoom
              }} />
            <button onClick={sendMsg} disabled={!msg.trim() || sending}
              className="press w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: msg.trim() ? 'var(--v)' : 'rgba(255,255,255,0.08)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M9 4l5 4-5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop: split view ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden" style={{ height: '100vh' }}>
        {/* Sidebar */}
        <div className="w-80 border-r border-white/5 flex flex-col flex-shrink-0">
          <header className="px-5 py-5 border-b border-white/5"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.95)' }}>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>ENCRYPTED MESSENGER</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: '1.4rem', letterSpacing: '-0.03em' }}>Messages</h1>
          </header>
          <div className="flex-1 overflow-y-auto">
            {threads.map((thread: any) => {
              const name = thread.participants?.[0]?.displayName ?? thread.name ?? 'Unknown'
              const handle = thread.participants?.[0]?.handle ?? thread.handle ?? 'unknown'
              const avatar = thread.participants?.[0]?.avatarUrl ?? `https://api.dicebear.com/7.x/shapes/svg?seed=${handle}`
              const lastMsg = thread.lastMessage?.content ?? thread.lastMsg ?? ''
              const unread = thread.unreadCount ?? thread.unread ?? 0
              return (
                <button key={thread.id} onClick={() => openThread(thread)}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/3 transition-colors border-b border-white/4 text-left"
                  style={{ background: activeThread?.id === thread.id ? 'rgba(124,58,237,0.06)' : 'transparent' }}>
                  <img src={avatar} alt={name} className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-sm text-white/85 truncate">{name}</span>
                      {unread > 0 && (
                        <span className="ml-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'var(--v)', color: 'white', fontSize: '0.6rem' }}>{unread}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 truncate">{lastMsg}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat panel */}
        {activeThread ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
              <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${activeThread.handle ?? 'user'}`} alt="" className="w-8 h-8 rounded-full" />
              <div>
                <p className="font-semibold text-sm">{activeThread.participants?.[0]?.displayName ?? activeThread.name ?? 'Unknown'}</p>
                <p className="text-xs text-white/35">ZK verified · E2E encrypted</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {msgs.map((m: any) => {
                const isMe = m.senderId === 'me' || m.senderId === u.id
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs lg:max-w-md px-4 py-2.5 text-sm"
                      style={{
                        background: isMe ? 'var(--v)' : 'rgba(255,255,255,0.06)',
                        color: isMe ? 'white' : 'rgba(245,244,240,0.8)',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}>
                      {m.content}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <div className="px-4 py-4 border-t border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <input ref={inputRef} type="text" value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                  placeholder="Send a message…"
                  className="flex-1 bg-white/4 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 transition-colors"
                  style={{ borderRadius: 'var(--radius)' }} />
                <button onClick={sendMsg} disabled={!msg.trim() || sending}
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: 'var(--v)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7h12M8 3l5 4-5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <p className="text-center mt-2" style={{ fontSize: '0.6rem', opacity: 0.2 }}>End-to-end encrypted · ZK identity verified</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 5h18v12H13l-4 4v-4H3V5z" stroke="var(--v)" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm text-white/40">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
