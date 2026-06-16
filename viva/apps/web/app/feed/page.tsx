'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, mockUser, mapApiUser, MOCK_POSTS } from '@/lib/store'
import { feed as feedApi, auth, tokens as tokensApi } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

const FILTERS = ['All', 'Health', 'Markets', 'Twin', 'ZKP', 'YouToken']

const TICKER_TOKENS = [
  { symbol: 'MAYA', price: 6.60, change: +12.3, color: '#a855f7' },
  { symbol: 'SOVV', price: 12.40, change: +8.2,  color: '#a855f7' },
  { symbol: 'ALEX', price:  5.10, change: +4.7,  color: '#22c55e' },
  { symbol: 'ZERO', price:  7.20, change: +3.4,  color: '#a855f7' },
  { symbol: 'LUNA', price:  9.80, change: +5.1,  color: '#a855f7' },
  { symbol: 'NOAD', price:  4.10, change: -1.8,  color: '#7c3aed' },
  { symbol: 'BIOP', price:  2.80, change: +0.9,  color: '#7c3aed' },
  { symbol: 'ZKPR', price:  2.20, change: -3.2,  color: '#22c55e' },
]

function TickerStrip({ onNavigate }: { onNavigate: (sym: string) => void }) {
  const items = [...TICKER_TOKENS, ...TICKER_TOKENS] // double for infinite feel
  return (
    <div className="overflow-x-auto no-scrollbar flex gap-3 py-2 px-1">
      {items.map((t, i) => {
        const up = t.change >= 0
        return (
          <button key={`${t.symbol}-${i}`} onClick={() => onNavigate(t.symbol)}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/6 hover:border-white/15 transition-all"
            style={{ background: `${t.color}08` }}>
            <span className="text-xs font-bold font-mono" style={{ color: t.color }}>${t.symbol}</span>
            <span className="text-xs font-mono text-white/60">${t.price.toFixed(2)}</span>
            <span className={`text-xs font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
              {up ? '+' : ''}{t.change.toFixed(1)}%
            </span>
          </button>
        )
      })}
    </div>
  )
}
const FEED_TABS = ['For You', 'Following', 'Trending'] as const
type FeedTab = typeof FEED_TABS[number]

interface Comment {
  id: string
  content: string
  author: { displayName: string; handle: string; avatarUrl?: string }
  createdAt: string
}

export default function FeedPage() {
  const router = useRouter()
  const { user, setUser } = useAppStore()
  const { success } = useToast()
  const [filter, setFilter] = useState('All')
  const [feedTab, setFeedTab] = useState<FeedTab>('For You')
  const [posts, setPosts] = useState<any[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  // Comments: postId → {open, comments, draft, submitting}
  const [commentState, setCommentState] = useState<Record<string, {
    open: boolean; comments: Comment[]; draft: string; submitting: boolean; loaded: boolean
  }>>({})

  useEffect(() => {
    setMounted(true)
    if (!user) auth.me().then(me => setUser(mapApiUser(me, mockUser()))).catch(() => setUser(mockUser()))
    loadFeed()
  }, [])

  useEffect(() => { if (mounted) loadFeed() }, [filter, feedTab])

  async function loadFeed(cursor?: string) {
    setLoading(true)
    try {
      const cat = filter === 'All' ? undefined : filter.toLowerCase()
      const res = await feedApi.list(cat, cursor)
      let fetched: any[] = res.posts
      // Sort by tab
      if (feedTab === 'Trending') {
        fetched = [...fetched].sort((a, b) =>
          ((b._count?.likes ?? 0) + (b._count?.comments ?? 0)) -
          ((a._count?.likes ?? 0) + (a._count?.comments ?? 0))
        )
      }
      // Following: keep API order but tag them visually (API already returns relevant posts)
      if (cursor) {
        setPosts(prev => [...prev, ...fetched])
      } else {
        setPosts(fetched)
      }
      setNextCursor(res.nextCursor)
    } catch {
      if (!cursor) {
        let mock = [...(MOCK_POSTS as any[])]
        if (feedTab === 'Trending') {
          mock = mock.sort((a, b) =>
            ((b._count?.likes ?? 0) + (b._count?.comments ?? 0)) -
            ((a._count?.likes ?? 0) + (a._count?.comments ?? 0))
          )
        }
        setPosts(mock)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null
  const u = user || mockUser()

  async function submitPost() {
    if (!draft.trim()) return
    try {
      const cat = filter === 'All' ? undefined : filter.toLowerCase()
      const newPost = await feedApi.create({ content: draft, category: cat })
      setPosts(prev => [newPost, ...prev])
      success('Post published to Signal Feed')
    } catch {
      setPosts(prev => [{
        id: `p${Date.now()}`,
        author: { displayName: u.displayName, handle: u.handle },
        content: draft,
        createdAt: new Date().toISOString(),
        _count: { likes: 0, comments: 0 },
      }, ...prev])
      success('Post published')
    }
    setDraft('')
    setComposing(false)
  }

  async function toggleLike(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, _count: { ...p._count, likes: (p._count?.likes ?? 0) + (p._liked ? -1 : 1) }, _liked: !p._liked }
      : p))
    try { await feedApi.like(postId) } catch {}
  }

  async function toggleComments(postId: string) {
    const cur = commentState[postId]
    if (cur?.open) {
      setCommentState(prev => ({ ...prev, [postId]: { ...prev[postId], open: false } }))
      return
    }
    // Open and load if not loaded yet
    setCommentState(prev => ({
      ...prev,
      [postId]: { open: true, comments: prev[postId]?.comments ?? [], draft: prev[postId]?.draft ?? '', submitting: false, loaded: prev[postId]?.loaded ?? false },
    }))
    if (!cur?.loaded) {
      try {
        const data = await feedApi.comments?.(postId) ?? []
        setCommentState(prev => ({
          ...prev,
          [postId]: { ...prev[postId], comments: data, loaded: true },
        }))
      } catch {
        // mock comments
        setCommentState(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            loaded: true,
            comments: [
              { id: 'c1', content: 'This is a signal 🔮', author: { displayName: 'Alex', handle: 'alex' }, createdAt: new Date(Date.now() - 120000).toISOString() },
              { id: 'c2', content: 'Agreed, great take', author: { displayName: 'Jordan', handle: 'jordan' }, createdAt: new Date(Date.now() - 60000).toISOString() },
            ],
          },
        }))
      }
    }
  }

  async function submitComment(postId: string) {
    const st = commentState[postId]
    if (!st?.draft.trim() || st.submitting) return
    const content = st.draft.trim()
    const optimistic: Comment = {
      id: `c${Date.now()}`,
      content,
      author: { displayName: u.displayName, handle: u.handle, avatarUrl: u.avatar },
      createdAt: new Date().toISOString(),
    }
    setCommentState(prev => ({
      ...prev,
      [postId]: { ...prev[postId], draft: '', submitting: true, comments: [...(prev[postId]?.comments ?? []), optimistic] },
    }))
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } }
      : p))
    try {
      await feedApi.comment?.(postId, content)
    } catch {}
    setCommentState(prev => ({ ...prev, [postId]: { ...prev[postId], submitting: false } }))
  }

  async function sharePost(postId: string, content: string) {
    const url = `${window.location.origin}/feed#${postId}`
    try {
      if (navigator.share) {
        await navigator.share({ text: content.slice(0, 100), url })
      } else {
        await navigator.clipboard.writeText(url)
        success('Link copied to clipboard')
      }
    } catch {
      success('Link copied')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5" style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>ATTENTION ECONOMY</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>Signal Feed</h1>
          </div>
          <button
            onClick={() => setComposing(!composing)}
            className="px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: composing ? 'transparent' : 'var(--v)', border: '1px solid var(--v)', color: composing ? 'var(--v)' : 'white', borderRadius: 'var(--radius)' }}
          >
            {composing ? 'Cancel' : '+ Post'}
          </button>
        </div>
        {/* For You / Following / Trending tabs */}
        <div className="flex gap-0 border-b border-white/6 mb-3 -mx-1">
          {FEED_TABS.map(t => (
            <button key={t} onClick={() => setFeedTab(t)}
              className="px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px"
              style={{
                borderBottomColor: feedTab === t ? 'var(--v)' : 'transparent',
                color: feedTab === t ? 'var(--v)' : 'rgba(255,255,255,0.35)',
              }}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className="flex-shrink-0 px-3 py-1.5 text-xs font-medium transition-all" style={{ borderRadius: '99px', border: `1px solid ${filter === f ? 'var(--v)' : 'rgba(255,255,255,0.1)'}`, background: filter === f ? 'rgba(124,58,237,0.15)' : 'transparent', color: filter === f ? 'var(--v)' : 'rgba(245,244,240,0.5)' }}>
              {f}
            </button>
          ))}
        </div>
        {/* Token ticker strip */}
        <div className="border-t border-white/5 mt-2 pt-2">
          <TickerStrip onNavigate={(sym) => router.push(`/tokens/${sym}`)} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
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
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitPost() }}
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
                  <span className="text-xs text-white/30">{draft.length} / 500</span>
                  <button onClick={submitPost} disabled={!draft.trim()} className="px-5 py-1.5 text-sm font-semibold text-white disabled:opacity-30" style={{ background: 'var(--v)', borderRadius: 'var(--radius)' }}>Publish</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-0">
          {loading && <p className="py-8 text-center text-white/30 text-sm">Loading feed...</p>}
          {!loading && posts.map((post) => {
            const authorName = post.author?.displayName ?? post.author ?? 'Unknown'
            const authorHandle = post.author?.handle ?? post.handle ?? 'unknown'
            const avatarSrc = post.author?.avatarUrl ?? post.avatar ?? ('https://api.dicebear.com/7.x/shapes/svg?seed=' + authorHandle)
            const ts = post.createdAt ?? post.ts
            const likes = post._count?.likes ?? post.attentionEarned ?? 0
            const commentCount = post._count?.comments ?? 0
            const tags: string[] = post.tags ?? (post.category ? [post.category] : [])
            const cs = commentState[post.id]

            return (
              <article key={post.id} id={post.id} className="py-6 border-b border-white/5 last:border-b-0 group">
                <div className="flex gap-4">
                  <a href={`/profile/${authorHandle}`} className="flex-shrink-0">
                    <img src={avatarSrc} alt={authorName} className="w-9 h-9 rounded-full hover:ring-2 hover:ring-white/20 transition-all" />
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <a href={`/profile/${authorHandle}`} className="font-semibold text-sm text-white/90 hover:text-white transition-colors">{authorName}</a>
                      <span className="text-xs text-white/30">@{authorHandle}</span>
                      <span className="text-white/15">·</span>
                      <span className="text-xs text-white/30">{formatRelTime(ts)}</span>
                      {feedTab === 'Trending' && (likes + commentCount) > 2 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: '0.55rem' }}>🔥 HOT</span>
                      )}
                      {likes > 0 && <span className="ml-auto text-xs font-semibold" style={{ color: 'var(--ring-social)' }}>+{likes} attn</span>}
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed mb-3">{post.content}</p>
                    {tags.length > 0 && (
                      <div className="flex gap-1.5 mb-3 flex-wrap">
                        {tags.map((tag: string) => (
                          <span key={tag} className="text-xs px-2 py-0.5" style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--v)', borderRadius: '99px' }}>#{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Action bar */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className="press flex items-center gap-1.5 transition-colors text-xs min-h-[36px] px-3 rounded-lg hover:bg-white/5"
                        style={{ color: post._liked ? 'var(--ring-social)' : 'rgba(255,255,255,0.3)' }}
                      >
                        <span>{post._liked ? '♥' : '♡'}</span><span>{likes}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="press flex items-center gap-1.5 transition-colors text-xs min-h-[36px] px-3 rounded-lg hover:bg-white/5"
                        style={{ color: cs?.open ? 'var(--v)' : 'rgba(255,255,255,0.3)' }}
                      >
                        <span>◎</span>
                        {commentCount > 0 && <span>{commentCount}</span>}
                      </button>
                      <button
                        onClick={() => sharePost(post.id, post.content ?? '')}
                        className="press text-white/30 hover:text-white/70 transition-colors text-xs min-h-[36px] px-3 rounded-lg hover:bg-white/5"
                      >
                        ⇄
                      </button>
                    </div>

                    {/* Inline comment thread */}
                    {cs?.open && (
                      <div className="mt-4 border-l-2 pl-4" style={{ borderColor: 'rgba(124,58,237,0.3)' }}>
                        {/* Existing comments */}
                        <div className="space-y-3 mb-3">
                          {cs.comments.length === 0 && cs.loaded && (
                            <p className="text-xs text-white/25 italic">No comments yet. Be first.</p>
                          )}
                          {!cs.loaded && (
                            <p className="text-xs text-white/25">Loading…</p>
                          )}
                          {cs.comments.map(c => (
                            <div key={c.id} className="flex gap-2.5">
                              <a href={`/profile/${c.author.handle}`}>
                                <img
                                  src={c.author.avatarUrl ?? `https://api.dicebear.com/7.x/shapes/svg?seed=${c.author.handle}`}
                                  alt={c.author.displayName}
                                  className="w-6 h-6 rounded-full flex-shrink-0 hover:ring-1 hover:ring-white/20"
                                />
                              </a>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <a href={`/profile/${c.author.handle}`} className="text-xs font-semibold text-white/70 hover:text-white">{c.author.displayName}</a>
                                  <span className="text-xs text-white/20">{formatRelTime(c.createdAt)}</span>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Comment input */}
                        <div className="flex gap-2.5 items-center">
                          <img src={u.avatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={cs.draft ?? ''}
                              onChange={e => setCommentState(prev => ({ ...prev, [post.id]: { ...prev[post.id], draft: e.target.value } }))}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) submitComment(post.id) }}
                              placeholder="Reply to signal…"
                              className="flex-1 bg-white/4 border border-white/10 px-3 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/40 transition-colors"
                              style={{ borderRadius: '99px' }}
                            />
                            <button
                              onClick={() => submitComment(post.id)}
                              disabled={!cs.draft?.trim() || cs.submitting}
                              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30 transition-opacity"
                              style={{ background: 'var(--v)', borderRadius: '99px' }}
                            >
                              {cs.submitting ? '…' : '↑'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {nextCursor && (
          <div className="pt-8 pb-20 text-center">
            <button
              onClick={() => loadFeed(nextCursor)}
              disabled={loading}
              className="t-caption hover:opacity-60 transition-opacity disabled:opacity-30"
              style={{ fontSize: '0.625rem' }}
            >
              {loading ? 'LOADING…' : 'LOAD MORE SIGNAL'}
            </button>
          </div>
        )}
        {!nextCursor && posts.length > 0 && (
          <div className="pt-8 pb-20 text-center">
            <p className="t-caption opacity-30" style={{ fontSize: '0.625rem' }}>END OF FEED</p>
          </div>
        )}
      </div>
    </div>
  )
}

function formatRelTime(ts: string | number) {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return Math.floor(diff / 86400000) + 'd ago'
}
