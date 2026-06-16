'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ScheduledPost {
  id: string
  title: string
  type: 'post' | 'signal' | 'video' | 'audio' | 'nft'
  icon: string
  color: string
  scheduledFor: string
  status: 'scheduled' | 'draft' | 'publishing'
  platform: ('feed' | 'tokens' | 'rooms')[]
  tokenGated: boolean
  minTokens?: number
  tokenSymbol?: string
}

const POSTS: ScheduledPost[] = [
  { id: 's1', title: 'BTC Weekend Setup — entry zones for the correction',  type: 'signal', icon: '📈', color: '#22c55e', scheduledFor: '2026-06-17T09:00:00Z', status: 'scheduled',  platform: ['feed', 'tokens'], tokenGated: true,  minTokens: 25, tokenSymbol: 'SVRN' },
  { id: 's2', title: 'Why ETH will hit $5k before year end (deep dive)',     type: 'post',   icon: '✍️', color: '#818cf8', scheduledFor: '2026-06-17T14:00:00Z', status: 'scheduled',  platform: ['feed'],           tokenGated: false },
  { id: 's3', title: 'Monthly portfolio update — June 2026',                 type: 'post',   icon: '✍️', color: '#818cf8', scheduledFor: '2026-06-18T10:00:00Z', status: 'scheduled',  platform: ['feed'],           tokenGated: false },
  { id: 's4', title: 'Altcoin season signal pack teaser',                    type: 'video',  icon: '🎬', color: '#f59e0b', scheduledFor: '2026-06-18T16:00:00Z', status: 'draft',      platform: ['feed'],           tokenGated: false },
  { id: 's5', title: 'SOL breakout — aggressive entry signal',               type: 'signal', icon: '📈', color: '#22c55e', scheduledFor: '2026-06-19T08:30:00Z', status: 'scheduled',  platform: ['tokens'],         tokenGated: true,  minTokens: 50, tokenSymbol: 'SVRN' },
  { id: 's6', title: 'Weekly market sentiment thread',                       type: 'post',   icon: '✍️', color: '#818cf8', scheduledFor: '2026-06-20T07:00:00Z', status: 'scheduled',  platform: ['feed'],           tokenGated: false },
]

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  scheduled:  { label: '⏰ Scheduled', color: '#f59e0b' },
  draft:      { label: '📝 Draft',     color: '#818cf8' },
  publishing: { label: '🚀 Publishing', color: '#22c55e' },
}

function fmtScheduled(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const isToday = d.toDateString() === today.toDateString()
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (isToday)    return `Today, ${time}`
  if (isTomorrow) return `Tomorrow, ${time}`
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`
}

function groupByDate(posts: ScheduledPost[]) {
  const groups: Record<string, ScheduledPost[]> = {}
  for (const p of posts) {
    const day = new Date(p.scheduledFor).toDateString()
    if (!groups[day]) groups[day] = []
    groups[day].push(p)
  }
  return Object.entries(groups).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
}

function dayLabel(ds: string) {
  const d = new Date(ds)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString())    return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function ScheduledPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'

  const [posts, setPosts] = useState(POSTS)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'draft'>('all')

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)
  const groups = groupByDate(filtered)

  function deletePost(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Scheduled Content</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
          <button onClick={() => router.push('/feed/create')}
            className="px-3 py-1.5 rounded-xl text-xs font-black"
            style={{ background: '#a855f7', color: '#04040A' }}>
            + Schedule
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Scheduled', value: posts.filter(p => p.status === 'scheduled').length, color: '#f59e0b' },
            { label: 'Drafts',    value: posts.filter(p => p.status === 'draft').length,     color: '#818cf8' },
            { label: 'This Week', value: posts.length,                                        color: 'white'   },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          {(['all', 'scheduled', 'draft'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
              style={filter === f ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Posts by day */}
        {groups.length === 0 ? (
          <div className="text-center py-12 text-white/25 text-sm">No {filter === 'all' ? '' : filter + ' '}posts</div>
        ) : (
          groups.map(([day, dayPosts]) => (
            <div key={day} className="space-y-2">
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">{dayLabel(day)}</div>
              {dayPosts.map(post => {
                const st = STATUS_STYLE[post.status]
                return (
                  <div key={post.id} className="p-3 rounded-2xl border border-white/4"
                    style={{ background: 'rgba(255,255,255,0.015)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${post.color}10`, border: `1px solid ${post.color}15` }}>
                        {post.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white/80 leading-tight mb-1">{post.title}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs" style={{ color: st.color }}>{st.label}</span>
                          <span className="text-xs text-white/20">·</span>
                          <span className="text-xs text-white/35">{fmtScheduled(post.scheduledFor)}</span>
                        </div>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {post.platform.map(pl => (
                            <span key={pl} className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                              {pl}
                            </span>
                          ))}
                          {post.tokenGated && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                              🔒 {post.minTokens}+ ${post.tokenSymbol}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deletePost(post.id)}
                        className="p-1 rounded text-white/15 hover:text-white/40">
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
