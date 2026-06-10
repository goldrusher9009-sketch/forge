'use client'
import { useState, useEffect, useRef } from 'react'
import { useAppStore, mockUser, MOCK_THREADS } from '@/lib/store'
import { messages as messagesApi } from '@/lib/api'

export default function MessagesPage() {
  const { user, setUser } = useAppStore()
  const [threads, setThreads] = useState<any[]>([])
  const [activeThread, setActiveThread] = useState<any | null>(null)
  const [msgs, setMsgs] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [mounted, setMounted] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadThreads()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function loadThreads() {
    try {
      const data = await messagesApi.threads()
      setThreads(data)
    } catch {
      setThreads(MOCK_THREADS as any)
    }
  }

  async function openThread(thread: any) {
    setActiveThread(thread)
    try {
      const data = await messagesApi.thread(thread.id)
      setMsgs(data.messages ?? data)
    } catch {
      setMsgs(thread.messages ?? [])
    }
  }

  async function sendMsg() {
    if (!msg.trim() || !activeThread || sending) return
    setSending(true)
    const content = msg
    setMsg('')
    const optimistic = { id: `m${Date.now()}`, content, senderId: 'me', createdAt: new Date().toISOString() }
    setMsgs(prev => [...prev, optimistic])
    try {
      await messagesApi.send(activeThread.id, content)
    } catch {}
    setSending(false)
  }

  if (!mounted) return null
  const u = user || mockUser()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5" style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <p className="t-caption" style={{ fontSize: '0.625rem' }}>ENCRYPTED MESSENGER</p>
        <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>Messages</h1>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="w-full lg:w-80 border-r border-white/5 overflow-y-auto flex-shrink-0">
          {threads.map((thread: any) => {
            const name = thread.participants?.[0]?.displayName ?? thread.name ?? 'Unknown'
            const handle = thread.participants?.[0]?.handle ?? thread.handle ?? 'unknown'
            const avatar = thread.participants?.[0]?.avatarUrl ?? ('https://api.dicebear.com/7.x/shapes/svg?seed=' + handle)
            const lastMsg = thread.lastMessage?.content ?? thread.lastMsg ?? ''
            const unread = thread.unreadCount ?? thread.unread ?? 0
            return (
              <button key={thread.id} onClick={() => openThread(thread)} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/3 transition-colors border-b border-white/4 text-left" style={{ background: activeThread?.id === thread.id ? 'rgba(124,58,237,0.06)' : 'transparent' }}>
                <img src={avatar} alt={name} className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-white/85 truncate">{name}</span>
                    {unread > 0 && <span className="ml-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--v)', color: 'white', fontSize: '0.6rem' }}>{unread}</span>}
                  </div>
                  <p className="text-xs text-white/35 truncate">{lastMsg}</p>
                </div>
              </button>
            )
          })}
        </div>

        {activeThread ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <img src={'https://api.dicebear.com/7.x/shapes/svg?seed=' + (activeThread.handle ?? 'user')} alt="" className="w-8 h-8 rounded-full" />
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
                    <div className="max-w-xs lg:max-w-md px-4 py-2.5 text-sm rounded-2xl" style={{ background: isMe ? 'var(--v)' : 'rgba(255,255,255,0.06)', color: isMe ? 'white' : 'rgba(245,244,240,0.8)' }}>
                      {m.content}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                  placeholder="Send a message..."
                  className="flex-1 bg-white/4 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 transition-colors"
                  style={{ borderRadius: 'var(--radius)' }}
                />
                <button onClick={sendMsg} disabled={!msg.trim() || sending} className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'var(--v)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 3l5 4-5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
              <p className="text-center mt-2" style={{ fontSize: '0.6rem', opacity: 0.2 }}>End-to-end encrypted · ZK identity verified</p>
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
    </div>
  )
}
