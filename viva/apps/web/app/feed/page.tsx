'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppStore, mockUser, MOCK_POSTS, TIER_META } from '@/lib/store'

const FILTERS = ['All', 'Health', 'Markets', 'Twin', 'ZKP', 'YouToken']

export default function FeedPage() {
  const { user, setUser } = useAppStore()
  const [filter, setFilter] = useState('All')
  const [posts, setPosts] = useState(MOCK_POSTS)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
  }, [])

  if (!mounted) return null
  const u = user || mockUser()

  const filtered = filter === 'All' ? posts : posts.filter(p => p.tags.includes(filter.toLowerCase()))

  function submitPost() {
    if (!draft.trim()) return
    setPosts(prev => [{
      id: `p${Date.now()}`,
      author: u.displayName,
      handle: u.handle,
      avatar: u.avatar,
      content: draft,
      ts: Date.now(),
      attentionEarned: 0,
      replies: 0,
      boosts: 0,
      tags: [],
    }, ...prev])
    setDraft('')
    setComposing(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>ATTENTION ECONOMY</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>
              Signal Feed
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded border border-white/6" style={{ borderRadius: 'var(--radius)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="rgba(245,244,240,0.4)" strokeWidth="1.5"/>
                <line x1="11" y1="11" x2="15" y2="15" stroke="rgba(245,244,240,0.4)" strokeWidth="1.5"/>
              </svg>
            </div>
            <button
              onClick={() => setComposing(!composing)}
              className="px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: composing ? 'transparent' : 'var(--v)', border: `1px solid var(--v)`, color: composing ? 'var(--v)' : 'white', borderRadius: 'var(--radius)' }}
            >
              {composing ? 'Cancel' : '+ Post'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                borderRadius: '99px',
                border: `1px solid ${filter === f ? 'var(--v)' : 'rgba(255,255,255,0.1)'}`,
                background: filter === f ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: filter === f ? 'var(--v)' : 'rgba(245,244,240,0.5)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 lg:px-0 py-6">

        {/* Attention stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Attention Earned', value: '1,247', unit: 'pts today', color: 'var(--ring-social)' },
            { label: 'Signal Score', value: '94', unit: '/ 100', color: 'var(--ring-activity)' },
            { label: 'Reach', value: '3.2K', unit: 'impressions', color: 'var(--ring-nutrition)' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="p-4 border border-white/6" style={{ borderRadius: 'var(--radius)' }}>
              <p className="t-caption mb-1" style={{ fontSize: '0.55rem' }}>{label.toUpperCase()}</p>
              <p className="text-lg font-bold" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
              <p style={{ fontSize: '0.7rem', opacity: 0.35 }}>{unit}</p>
            </div>
          ))}
        </div>

        {/* Compose box */}
        {composing && (
          <div className="mb-6 p-5 border border-violet-500/30 bg-violet-500/5" style={{ borderRadius: 'var(--radius)' }}>
            <div className="flex gap-3">
              <img src={u.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="What signal are you sending today?"
                  className="w-full bg-transparent text-white placeholder-white/25 outline-none resize-none text-sm leading-relaxed"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
                  <span className="text-xs text-white/30">{draft.length} / 500</span>
                  <button
                    onClick={submitPost}
                    disabled={!draft.trim()}
                    className="px-5 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
                    style={{ background: 'var(--v)', borderRadius: 'var(--radius)' }}
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-0">
          {filtered.map((post, idx) => (
            <article
              key={post.id}
              className="py-6 border-b border-white/5 last:border-b-0 group"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img src={post.avatar} alt={post.author} className="w-9 h-9 rounded-full" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Author row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-sm text-white/90">{post.author}</span>
                    <span className="text-xs text-white/30">@{post.handle}</span>
                    <span className="text-white/15">·</span>
                    <span className="text-xs text-white/30">{formatRelTime(post.ts)}</span>
                    {post.attentionEarned > 0 && (
                      <span
                        className="ml-auto text-xs font-semibold"
                        style={{ color: 'var(--ring-social)' }}
                      >
                        +{post.attentionEarned} attn
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <p className="text-sm text-white/80 leading-relaxed mb-3">{post.content}</p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                      {post.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5"
                          style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--v)', borderRadius: '99px' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {[
                      { label: post.replies, icon: '◎', action: 'reply' },
                      { label: post.boosts, icon: '⇄', action: 'boost' },
                      { label: null, icon: '◈', action: 'twin' },
                    ].map(({ label, icon, action }) => (
                      <button
                        key={action}
                        className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-xs"
                      >
                        <span style={{ fontFamily: 'monospace' }}>{icon}</span>
                        {label !== null && <span>{label}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load more */}
        <div className="pt-8 pb-20 text-center">
          <button className="t-caption hover:opacity-60 transition-opacity" style={{ fontSize: '0.625rem' }}>
            LOAD MORE SIGNAL
          </button>
        </div>
      </div>
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
