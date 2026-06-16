'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const POST = {
  id: 'p1',
  author: { name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7', avatar: 'SV' },
  content: 'Thread on how I built a 6-figure token economy from scratch using nothing but audience trust and a clear value proposition. This is the blueprint nobody talks about 🧵',
  images: [] as string[],
  likes: 1842,
  comments: 38,
  reposts: 214,
  ts: '3h ago',
  tags: ['#YouToken', '#TokenEconomy', '#CreatorFinance'],
}

const COMMENTS = [
  { id: 'c1', author: { name: 'Maya Chen', handle: 'mayafit', color: '#22c55e', avatar: 'MC' }, content: 'This is exactly what I needed to read today. The part about audience trust before monetization is 🔑', likes: 89, ts: '2h ago' },
  { id: 'c2', author: { name: 'ZeroNode', handle: 'zeronode', color: '#818cf8', avatar: 'ZN' }, content: 'The ZK verification layer makes this even more powerful. When holders can prove ownership without doxing themselves, adoption goes parabolic.', likes: 54, ts: '2h ago' },
  { id: 'c3', author: { name: 'Luna Apex', handle: 'luna_apex', color: '#f59e0b', avatar: 'LA' }, content: 'Staked 500 SOVV after reading this last month. Best decision. Already up 22% + staking rewards. 🙏', likes: 47, ts: '1h ago' },
  { id: 'c4', author: { name: 'AlexWave', handle: 'alexwave', color: '#ec4899', avatar: 'AW' }, content: 'The token-gated community aspect is underrated. My most engaged fans are my token holders.', likes: 31, ts: '45m ago' },
  { id: 'c5', author: { name: 'CryptoMind', handle: 'cryptomind', color: '#f87171', avatar: 'CM' }, content: 'What\'s the minimum to get started? I have ~$500 to invest across a few creators.', likes: 12, ts: '30m ago' },
  { id: 'c6', author: { name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7', avatar: 'SV' }, content: '@cryptomind $500 is solid. I\'d split across 3-4 creators you genuinely follow. Bronze tier (10 tokens) per creator = meaningful exposure without concentration risk.', likes: 76, ts: '20m ago', isAuthor: true },
]

export default function PostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(POST.likes)
  const [reposted, setReposted] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState(COMMENTS)
  const [submitting, setSubmitting] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  function toggleLike() {
    setLiked(l => !l)
    setLikeCount(c => liked ? c - 1 : c + 1)
  }

  function toggleCommentLike(id: string) {
    setLikedComments(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function submitComment() {
    if (!newComment.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    const c = {
      id: `c${Date.now()}`,
      author: { name: 'You', handle: 'me', color: '#a855f7', avatar: 'ME' },
      content: newComment,
      likes: 0,
      ts: 'just now',
    }
    setComments(prev => [...prev, c])
    setNewComment('')
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-bold text-white">Post</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Original post */}
        <div className="px-4 pt-4 pb-4 border-b border-white/6">
          <div className="flex items-start gap-3 mb-3">
            <button onClick={() => router.push(`/profile/${POST.author.handle}`)}
              className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: `${POST.author.color}18`, color: POST.author.color }}>
              {POST.author.avatar}
            </button>
            <div className="flex-1">
              <button onClick={() => router.push(`/profile/${POST.author.handle}`)}
                className="font-bold text-white/90 hover:text-white transition-colors text-sm">{POST.author.name}</button>
              <div className="text-xs text-white/30">@{POST.author.handle} · {POST.ts}</div>
            </div>
          </div>

          <p className="text-white/80 leading-relaxed mb-3" style={{ fontSize: '1.05rem' }}>{POST.content}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {POST.tags.map(t => (
              <span key={t} className="text-xs font-semibold" style={{ color: '#a855f7' }}>{t}</span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-white/30 pb-3 border-b border-white/6 mb-3">
            <span><strong className="text-white/60">{likeCount.toLocaleString()}</strong> Likes</span>
            <span><strong className="text-white/60">{comments.length}</strong> Comments</span>
            <span><strong className="text-white/60">{POST.reposts}</strong> Reposts</span>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            {[
              { icon: liked ? '❤️' : '🤍', label: 'Like', action: toggleLike, active: liked },
              { icon: '💬', label: 'Comment', action: () => {}, active: false },
              { icon: reposted ? '🔁' : '↺', label: 'Repost', action: () => setReposted(r => !r), active: reposted },
              { icon: '↗', label: 'Share', action: () => {}, active: false },
            ].map(a => (
              <button key={a.label} onClick={a.action}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={a.active
                  ? { background: 'rgba(168,85,247,0.1)', color: '#a855f7' }
                  : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)' }}>
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Comment input */}
        <div className="px-4 py-3 border-b border-white/6 flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 flex items-center justify-center text-xs font-bold text-purple-400 flex-shrink-0">ME</div>
          <div className="flex-1 flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
              placeholder="Add a comment…"
              className="flex-1 text-sm bg-transparent text-white/80 placeholder-white/20 outline-none" />
            <button onClick={submitComment} disabled={submitting || !newComment.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-black disabled:opacity-30 transition-all"
              style={{ background: '#a855f7', color: '#04040A' }}>
              {submitting ? '…' : 'Post'}
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="divide-y divide-white/5">
          {comments.map(c => {
            const isLiked = likedComments.has(c.id)
            return (
              <div key={c.id} className={`px-4 py-4 ${(c as any).isAuthor ? 'bg-purple-950/10' : ''}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => router.push(`/profile/${c.author.handle}`)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                    style={{ background: `${c.author.color}18`, color: c.author.color }}>
                    {c.author.avatar}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <button onClick={() => router.push(`/profile/${c.author.handle}`)}
                        className="text-sm font-bold text-white/80 hover:text-white transition-colors">{c.author.name}</button>
                      {(c as any).isAuthor && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: '#a855f720', color: '#a855f7' }}>Author</span>
                      )}
                      <span className="text-xs text-white/25">{c.ts}</span>
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed">{c.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => toggleCommentLike(c.id)}
                        className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: isLiked ? '#ec4899' : 'rgba(255,255,255,0.3)' }}>
                        {isLiked ? '❤️' : '🤍'} {c.likes + (isLiked ? 1 : 0)}
                      </button>
                      <button className="text-xs text-white/25 hover:text-white/50 transition-colors">Reply</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
