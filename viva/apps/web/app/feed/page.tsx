'use client'
import { useState, useEffect } from 'react'
import { useAppStore, mockUser, mapApiUser, MOCK_POSTS } from '@/lib/store'
import { feed as feedApi, auth } from '@/lib/api'

const FILTERS = ['All', 'Health', 'Markets', 'Twin', 'ZKP', 'YouToken']

export default function FeedPage() {
  const { user, setUser } = useAppStore()
  const [filter, setFilter] = useState('All')
  const [posts, setPosts] = useState<any[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    if (!user) auth.me().then(me => setUser(mapApiUser(me, mockUser()))).catch(() => setUser(mockUser()))
    loadFeed()
  }, [])

  useEffect(() => { if (mounted) loadFeed() }, [filter])

  async function loadFeed() {
    setLoading(true)
    try {
      const cat = filter === 'All' ? undefined : filter.toLowerCase()
      const res = await feedApi.list(cat)
      setPosts(res.posts)
      setNextCursor(res.nextCursor)
    } catch {
      setPosts(MOCK_POSTS as any)
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
    } catch {
      setPosts(prev => [{ id: `p${Date.now()}`, author: { displayName: u.displayName, handle: u.handle }, content: draft, createdAt: new Date().toISOString(), _count: { likes: 0 } }, ...prev])
    }
    setDraft('')
    setComposing(false)
  }

  async function toggleLike(postId: string) {
    try {
      await feedApi.like(postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, _count: { ...p._count, likes: (p._count?.likes ?? 0) + 1 } } : p))
    } catch {}
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
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className="flex-shrink-0 px-3 py-1.5 text-xs font-medium transition-all" style={{ borderRadius: '99px', border: `1px solid ${filter === f ? 'var(--v)' : 'rgba(255,255,255,0.1)'}`, background: filter === f ? 'rgba(124,58,237,0.15)' : 'transparent', color: filter === f ? 'var(--v)' : 'rgba(245,244,240,0.5)' }}>
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[{ label: 'Attention Earned', value: '1,247', unit: 'pts today', color: 'var(--ring-social)' }, { label: 'Signal Score', value: '94', unit: '/ 100', color: 'var(--ring-activity)' }, { label: 'Reach', value: '3.2K', unit: 'impressions', color: 'var(--ring-nutrition)' }].map(({ label, value, unit, color }) => (
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
                <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="What signal are you sending today?" className="w-full bg-transparent text-white placeholder-white/25 outline-none resize-none text-sm leading-relaxed" rows={3} autoFocus />
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
            const tags: string[] = post.tags ?? (post.category ? [post.category] : [])
            return (
              <article key={post.id} className="py-6 border-b border-white/5 last:border-b-0 group">
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
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleLike(post.id)} className="press flex items-center gap-1.5 text-white/30 hover:text-white/70 transition-colors text-xs min-h-[36px] px-3 rounded-lg hover:bg-white/5">
                        <span>♡</span><span>{likes}</span>
                      </button>
                      <button className="press text-white/30 hover:text-white/70 transition-colors text-xs min-h-[36px] px-3 rounded-lg hover:bg-white/5">◎</button>
                      <button className="press text-white/30 hover:text-white/70 transition-colors text-xs min-h-[36px] px-3 rounded-lg hover:bg-white/5">⇄</button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="pt-8 pb-20 text-center">
          <button className="t-caption hover:opacity-60 transition-opacity" style={{ fontSize: '0.625rem' }}>LOAD MORE SIGNAL</button>
        </div>
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
