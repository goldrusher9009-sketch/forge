'use client'
import { useState, useEffect } from 'react'
import { notifications as notifApi } from '@/lib/api'

const TYPE_META: Record<string, { icon: string; color: string }> = {
  like:    { icon: '♡', color: 'var(--ring-social)' },
  match:   { icon: '◉', color: 'var(--v)' },
  room:    { icon: '◎', color: 'var(--ring-activity)' },
  market:  { icon: '↗', color: 'var(--ring-wealth)' },
  twin:    { icon: '◈', color: 'var(--ring-nutrition)' },
  system:  { icon: '⊕', color: 'rgba(245,244,240,0.4)' },
}

function relTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await notifApi.list()
      setItems(data.notifications)
      setUnread(data.unread)
    } catch { setItems([]) }
    finally { setLoading(false) }
  }

  async function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
    await notifApi.markRead(id).catch(() => {})
  }

  async function markAll() {
    setMarkingAll(true)
    try {
      await notifApi.markAllRead()
      setItems(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
    } finally { setMarkingAll(false) }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>SIGNAL STREAM</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>
              Notifications
              {unread > 0 && (
                <span className="ml-3 text-sm px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--v)', verticalAlign: 'middle' }}>
                  {unread}
                </span>
              )}
            </h1>
          </div>
          {unread > 0 && (
            <button onClick={markAll} disabled={markingAll}
              className="text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-40">
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>
      </header>

      <div className="container-editorial py-8 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4 opacity-20">⊕</p>
            <p className="text-sm text-white/30">No notifications yet</p>
            <p className="text-xs text-white/20 mt-1">Activity from likes, matches, and your twin will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.system
              return (
                <div key={n.id}
                  onClick={() => { if (!n.read) markRead(n.id); if (n.linkUrl) window.location.href = n.linkUrl }}
                  className="flex items-start gap-4 px-4 py-4 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: n.read ? 'transparent' : 'rgba(124,58,237,0.04)',
                    border: n.read ? '1px solid transparent' : '1px solid rgba(124,58,237,0.12)',
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                    <span style={{ color: meta.color, fontSize: '1rem' }}>{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white/85">{n.title}</p>
                      <span className="text-xs text-white/25 flex-shrink-0 mt-0.5">{relTime(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: 'var(--v)' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
