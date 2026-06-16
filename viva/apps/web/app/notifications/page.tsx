'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type NType = 'tip' | 'follow' | 'token_buy' | 'token_price' | 'live' | 'drop' | 'comment' | 'like' | 'milestone' | 'system'

interface Notification {
  id: string
  type: NType
  title: string
  body: string
  ts: string
  read: boolean
  color: string
  emoji: string
  actionUrl?: string
}

const NOTIFS: Notification[] = [
  { id: 'n1',  type: 'tip',         title: 'You received a tip!',          body: '@atlas_k tipped you 25 USDC 🎉',                           ts: '2m',  read: false, color: '#22c55e', emoji: '💸', actionUrl: '/profile/sovereign_v/tips' },
  { id: 'n2',  type: 'token_buy',   title: 'New token buyer',              body: '@luna_w bought 10 $SVRN at $8.75',                          ts: '8m',  read: false, color: '#a855f7', emoji: '💎', actionUrl: '/tokens/SVRN/activity' },
  { id: 'n3',  type: 'follow',      title: 'New follower',                 body: '@noa_d started following you',                              ts: '15m', read: false, color: '#818cf8', emoji: '👤', actionUrl: '/profile/noa_d' },
  { id: 'n4',  type: 'live',        title: 'Going live soon',              body: '@mayafit starts live in 30 minutes',                        ts: '30m', read: false, color: '#22c55e', emoji: '🔴', actionUrl: '/creator/mayafit/live' },
  { id: 'n5',  type: 'token_price', title: '$SVRN price alert',            body: 'Your $SVRN is up 5.2% in the last hour → $9.21',            ts: '1h',  read: true,  color: '#f59e0b', emoji: '📈', actionUrl: '/tokens/SVRN/chart' },
  { id: 'n6',  type: 'comment',     title: 'New comment',                  body: '@kai_r replied to your post: "This alpha is 🔥"',            ts: '2h',  read: true,  color: '#ec4899', emoji: '💬', actionUrl: '/feed/p1' },
  { id: 'n7',  type: 'like',        title: 'Post liked',                   body: '@marco_v and 12 others liked your post',                    ts: '3h',  read: true,  color: '#f87171', emoji: '❤️', actionUrl: '/feed/p1' },
  { id: 'n8',  type: 'token_buy',   title: 'New token buyer',              body: '@jade_l bought 25 $SVRN at $8.60',                          ts: '4h',  read: true,  color: '#a855f7', emoji: '💎', actionUrl: '/tokens/SVRN/activity' },
  { id: 'n9',  type: 'drop',        title: 'Drop available!',              body: '@jaxbeats just dropped: "Summer Beat Pack"',                ts: '5h',  read: true,  color: '#ec4899', emoji: '🎁', actionUrl: '/feed/p4' },
  { id: 'n10', type: 'milestone',   title: 'Milestone reached! 🎉',        body: 'You hit 50,000 followers! Diamond badge unlocked.',         ts: '1d',  read: true,  color: '#f59e0b', emoji: '🏆', actionUrl: '/profile/sovereign_v/badges' },
  { id: 'n11', type: 'follow',      title: 'New follower',                 body: '@dex_n started following you',                              ts: '1d',  read: true,  color: '#818cf8', emoji: '👤', actionUrl: '/profile/dex_n' },
  { id: 'n12', type: 'system',      title: 'Staking reward paid',          body: 'You earned 1.42 $SVRN from staking rewards this week',      ts: '2d',  read: true,  color: '#94a3b8', emoji: '⚙️', actionUrl: '/tokens/SVRN/staking' },
  { id: 'n13', type: 'tip',         title: 'Tip sent!',                    body: 'Your 10 USDC tip to @mayafit was delivered',                ts: '2d',  read: true,  color: '#22c55e', emoji: '💸', actionUrl: '/profile/mayafit/tips' },
  { id: 'n14', type: 'token_price', title: '$MAYA price alert',            body: 'Your $MAYA token down 3.1% today → $5.04',                 ts: '3d',  read: true,  color: '#f87171', emoji: '📉', actionUrl: '/tokens/MAYA/chart' },
]

const TYPE_FILTERS: { key: NType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'token_buy', label: 'Tokens' },
  { key: 'tip', label: 'Tips' },
  { key: 'follow', label: 'Follows' },
  { key: 'live', label: 'Live' },
  { key: 'comment', label: 'Comments' },
  { key: 'milestone', label: 'Milestones' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState(NOTIFS)
  const [filter, setFilter] = useState<NType | 'all'>('all')

  const unread = notifs.filter(n => !n.read).length

  const filtered = notifs.filter(n => filter === 'all' || n.type === filter)

  function markAll() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function dismiss(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white flex items-center gap-2">
              Notifications
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-black"
                  style={{ background: '#a855f7', color: '#04040A' }}>{unread}</span>
              )}
            </div>
          </div>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs font-bold" style={{ color: '#a855f7' }}>
              Mark all read
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TYPE_FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f.key ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="divide-y divide-white/4">
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔔</div>
            <div className="font-black text-white/40">No notifications</div>
          </div>
        )}
        {filtered.map(n => (
          <button key={n.id}
            onClick={() => { markRead(n.id); if (n.actionUrl) router.push(n.actionUrl) }}
            className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
            style={!n.read ? { background: 'rgba(168,85,247,0.04)' } : undefined}>
            {/* Unread dot */}
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: n.read ? 'transparent' : '#a855f7' }} />
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: `${n.color}12` }}>
              {n.emoji}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white/85">{n.title}</div>
              <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{n.body}</div>
              <div className="text-xs text-white/20 mt-1">{n.ts} ago</div>
            </div>
            {/* Dismiss */}
            <button onClick={e => { e.stopPropagation(); dismiss(n.id) }}
              className="text-white/15 text-xs mt-1 flex-shrink-0 hover:text-white/40">✕</button>
          </button>
        ))}
      </div>
    </div>
  )
}
