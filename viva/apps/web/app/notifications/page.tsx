'use client'
import { useState, useEffect } from 'react'
import { notifications as notifApi } from '@/lib/api'

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  like:    { icon: '♡', color: 'var(--ring-social)',    label: 'Reaction' },
  match:   { icon: '◉', color: 'var(--v)',              label: 'Match' },
  room:    { icon: '◎', color: 'var(--ring-activity)', label: 'Room' },
  market:  { icon: '↗', color: 'var(--ring-wealth)',   label: 'Market' },
  twin:    { icon: '◈', color: 'var(--ring-nutrition)', label: 'Twin' },
  system:  { icon: '⊕', color: 'rgba(245,244,240,0.4)', label: 'System' },
}

const MOCK_NOTIFICATIONS = [
  { id: 'm1', type: 'like',   title: 'sovereign liked your post',       body: '"The ZK proof future is here" got 12 reactions in the last hour.', read: false, createdAt: new Date(Date.now() - 300000).toISOString(),  linkUrl: '/feed' },
  { id: 'm2', type: 'match',  title: 'You matched with luna_v',         body: 'V-Score compatibility: 94%. You can now send messages.', read: false, createdAt: new Date(Date.now() - 1800000).toISOString(), linkUrl: '/dating' },
  { id: 'm3', type: 'market', title: 'Market position update',          body: 'Your YES stake on "BTC > $100K by EOY" is up 23% today.', read: false, createdAt: new Date(Date.now() - 3600000).toISOString(), linkUrl: '/markets' },
  { id: 'm4', type: 'twin',   title: 'Twin completed health task',       body: 'Sleep optimization protocol analyzed. 3 recommendations ready.', read: true,  createdAt: new Date(Date.now() - 7200000).toISOString(), linkUrl: '/twin' },
  { id: 'm5', type: 'room',   title: 'Room starting soon',              body: '"Regenerative Finance + ZK Identity" with noa_d starts in 10 min.', read: true,  createdAt: new Date(Date.now() - 14400000).toISOString(), linkUrl: '/rooms' },
  { id: 'm6', type: 'system', title: 'V-Score milestone',               body: 'Congratulations — you reached V-Score 850. Guardian tier unlocked.', read: true,  createdAt: new Date(Date.now() - 86400000).toISOString(), linkUrl: '/home' },
  { id: 'm7', type: 'like',   title: 'aisham boosted your signal',      body: 'Your health post reached 3.2K impressions this week.', read: true,  createdAt: new Date(Date.now() - 172800000).toISOString(), linkUrl: '/feed' },
]

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
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await notifApi.list()
      setItems(data.notifications)
      setUnread(data.unread)
    } catch {
      // Railway not yet deployed — show realistic mock data
      setItems(MOCK_NOTIFICATIONS)
      setUnread(MOCK_NOTIFICATIONS.filter(n => !n.read).length)
    }
    setLoading(false)
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
    } catch {
      setItems(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
    } finally { setMarkingAll(false) }
  }

  const filtered = filter === 'all' ? items : filter === 'unread' ? items.filter(n => !n.read) : items.filter(n => n.type === filter)
  const types = ['all', 'unread', ...Array.from(new Set(items.map(n => n.type)))]

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <div className="flex items-center justify-between mb-4">
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
              className="press text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-40 px-3 py-1.5 border border-white/10 rounded-full">
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="press flex-shrink-0 px-3 py-1.5 text-xs font-medium capitalize transition-all"
              style={{
                borderRadius: '99px',
                border: `1px solid ${filter === t ? 'var(--v)' : 'rgba(255,255,255,0.1)'}`,
                background: filter === t ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: filter === t ? 'var(--v)' : 'rgba(245,244,240,0.5)',
              }}>
              {t === 'unread' ? `Unread (${unread})` : t}
            </button>
          ))}
        </div>
      </header>

      <div className="container-editorial py-6 max-w-2xl">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-4 p-4 border border-white/5 rounded-xl animate-pulse">
                <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-2.5 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4 opacity-20">⊕</p>
            <p className="text-sm text-white/30">No notifications here</p>
            <p className="text-xs text-white/20 mt-1">Activity from likes, matches, and your twin will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Group by today / earlier */}
            {['Today', 'Earlier'].map(group => {
              const groupItems = filtered.filter(n => {
                const daysAgo = (Date.now() - new Date(n.createdAt).getTime()) / 86400000
                return group === 'Today' ? daysAgo < 1 : daysAgo >= 1
              })
              if (!groupItems.length) return null
              return (
                <div key={group} className="mb-6">
                  <p className="t-caption mb-3 px-1" style={{ fontSize: '0.6rem', opacity: 0.35 }}>{group.toUpperCase()}</p>
                  <div className="space-y-1">
                    {groupItems.map(n => {
                      const meta = TYPE_META[n.type] ?? TYPE_META.system
                      return (
                        <div key={n.id}
                          onClick={() => { if (!n.read) markRead(n.id); if (n.linkUrl) window.location.href = n.linkUrl }}
                          className="flex items-start gap-4 px-4 py-4 rounded-xl transition-all cursor-pointer hover:bg-white/3"
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
                              <p className="text-sm font-semibold text-white/85 leading-snug">{n.title}</p>
                              <span className="text-xs text-white/25 flex-shrink-0 mt-0.5">{relTime(n.createdAt)}</span>
                            </div>
                            <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{n.body}</p>
                            <span className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded"
                              style={{ background: `${meta.color}12`, color: meta.color, fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                              {meta.label.toUpperCase()}
                            </span>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                              style={{ background: 'var(--v)', boxShadow: '0 0 6px var(--v)' }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
