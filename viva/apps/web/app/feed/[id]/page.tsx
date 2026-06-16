'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Comment {
  id: string
  author: string
  authorColor: string
  authorVerified: boolean
  body: string
  ts: string
  likes: number
  liked: boolean
}

interface Post {
  id: string
  author: string
  authorName: string
  authorColor: string
  authorVerified: boolean
  body: string
  ts: string
  likes: number
  tips: number
  comments: number
  tokenGated: boolean
  tokenSymbol?: string
  minTokens?: number
  type: 'text' | 'poll' | 'token_alert' | 'drop'
  pollOptions?: { text: string; votes: number }[]
  sentiment?: 'bullish' | 'bearish' | 'neutral'
  ticker?: string
  dropTitle?: string
}

const POSTS: Record<string, Post> = {
  p1: {
    id: 'p1', author: 'sovereign_v', authorName: 'Sovereign V', authorColor: '#a855f7', authorVerified: true,
    body: 'BTC accumulation zone — why I\'m adding here\n\nThe weekly RSI divergence is signaling a major move incoming. I\'ve been slowly accumulating in this range and here\'s why:\n\n1. Key support holding for the 3rd time\n2. Funding rates negative = longs washed\n3. Institutional OI rebuilding\n\nThis is the setup I\'ve been waiting for all cycle.',
    ts: '2h', likes: 824, tips: 12, comments: 47, tokenGated: false, type: 'text',
  },
  p2: {
    id: 'p2', author: 'mayafit', authorName: 'Maya Chen', authorColor: '#22c55e', authorVerified: true,
    body: 'My 30-day transformation: full breakdown\n\nAfter 30 days of consistent training and clean eating, here are my honest numbers:\n\n• Body fat: 22% → 18.5%\n• Strength: PR on every major lift\n• Energy levels: night and day difference\n\nThe program I followed is in my Gold+ collection 🔒',
    ts: '5h', likes: 412, tips: 8, comments: 31, tokenGated: true, tokenSymbol: 'MAYA', minTokens: 25, type: 'text',
  },
  p3: {
    id: 'p3', author: 'sovereign_v', authorName: 'Sovereign V', authorColor: '#a855f7', authorVerified: true,
    body: 'Where do you see BTC price end of year?',
    ts: '1d', likes: 1204, tips: 0, comments: 312, tokenGated: false, type: 'poll',
    pollOptions: [
      { text: 'Under $80k',      votes: 142 },
      { text: '$80k–$120k',      votes: 680 },
      { text: '$120k–$200k',     votes: 890 },
      { text: 'Over $200k 🚀',   votes: 310 },
    ],
  },
  p4: {
    id: 'p4', author: 'jaxbeats', authorName: 'Jax Beats', authorColor: '#ec4899', authorVerified: true,
    body: 'New beat pack dropping this Friday 🎵\n\n12 exclusive trap/soul hybrid beats. Limited to 50 licenses.',
    ts: '1d', likes: 298, tips: 5, comments: 22, tokenGated: false, type: 'drop', dropTitle: 'Friday Beat Pack Vol.3',
  },
}

const MOCK_COMMENTS: Record<string, Comment[]> = {
  p1: [
    { id: 'c1', author: 'atlas_k',  authorColor: '#818cf8', authorVerified: true,  body: 'Spot on analysis. I\'ve been watching the same setup on the weekly.', ts: '1h', likes: 24, liked: false },
    { id: 'c2', author: 'luna_w',   authorColor: '#f87171', authorVerified: false, body: 'Finally someone calling the bottom. Been accumulating since $58k', ts: '1h', likes: 8,  liked: false },
    { id: 'c3', author: 'noa_d',    authorColor: '#f59e0b', authorVerified: false, body: 'Funding rates negative is the key signal here fr', ts: '2h', likes: 5,  liked: false },
  ],
  p2: [
    { id: 'c4', author: 'atlas_k',  authorColor: '#818cf8', authorVerified: true,  body: 'The consistency is inspiring! What did the diet look like?', ts: '2h', likes: 12, liked: false },
    { id: 'c5', author: 'kai_r',    authorColor: '#22c55e', authorVerified: false, body: 'Need that program 👀', ts: '4h', likes: 3, liked: false },
  ],
}

const MY_TOKENS: Record<string, number> = { SVRN: 50, MAYA: 80, JAX: 0 }

export default function FeedPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'p1'
  const post = POSTS[id] ?? POSTS.p1

  const canAccess = !post.tokenGated || (post.tokenSymbol && (MY_TOKENS[post.tokenSymbol] ?? 0) >= (post.minTokens ?? 0))

  const initComments = MOCK_COMMENTS[id] ?? []
  const [comments, setComments] = useState<Comment[]>(initComments)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [tipping, setTipping] = useState(false)
  const [tipped, setTipped] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [voting, setVoting] = useState<number | null>(null)
  const [voted, setVoted] = useState<number | null>(null)

  function toggleLike() {
    setLiked(l => !l)
    setLikeCount(c => liked ? c - 1 : c + 1)
  }

  async function sendTip() {
    setTipping(true)
    await new Promise(r => setTimeout(r, 800))
    setTipping(false)
    setTipped(true)
    setTimeout(() => setTipped(false), 2000)
  }

  function submitComment() {
    if (!commentInput.trim()) return
    const c: Comment = {
      id: `c${Date.now()}`, author: 'you', authorColor: '#a855f7', authorVerified: false,
      body: commentInput, ts: 'now', likes: 0, liked: false,
    }
    setComments(prev => [c, ...prev])
    setCommentInput('')
  }

  async function vote(idx: number) {
    if (voted !== null) return
    setVoting(idx)
    await new Promise(r => setTimeout(r, 600))
    setVoting(null)
    setVoted(idx)
  }

  const totalVotes = post.pollOptions?.reduce((a, o) => a + o.votes, 0) ?? 0
  const SENTIMENT_COLOR: Record<string, string> = { bullish: '#22c55e', bearish: '#f87171', neutral: '#f59e0b' }

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
          <div className="font-black text-white">Post</div>
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Post card */}
        <div className="rounded-2xl border border-white/5 p-4 mb-4" style={{ background: 'rgba(255,255,255,0.018)' }}>
          {/* Author */}
          <div className="flex items-center gap-2.5 mb-3">
            <button onClick={() => router.push(`/profile/${post.author}`)}
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0"
              style={{ background: `${post.authorColor}18`, color: post.authorColor }}>
              {post.authorName[0]}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white/85">{post.authorName}</span>
                {post.authorVerified && <span className="text-xs" style={{ color: post.authorColor }}>✓</span>}
              </div>
              <div className="text-xs text-white/30">@{post.author} · {post.ts}</div>
            </div>
            {post.tokenGated && (
              <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                🔒 {post.minTokens}+ ${post.tokenSymbol}
              </span>
            )}
          </div>

          {/* Drop badge */}
          {post.type === 'drop' && post.dropTitle && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold"
              style={{ background: `${post.authorColor}15`, color: post.authorColor }}>
              🎁 Drop: {post.dropTitle}
            </div>
          )}

          {/* Token alert badge */}
          {post.type === 'token_alert' && post.ticker && post.sentiment && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold"
              style={{ background: `${SENTIMENT_COLOR[post.sentiment]}15`, color: SENTIMENT_COLOR[post.sentiment] }}>
              {post.sentiment === 'bullish' ? '🟢' : post.sentiment === 'bearish' ? '🔴' : '🟡'} ${post.ticker}
            </div>
          )}

          {/* Body */}
          {canAccess ? (
            <div className="text-sm text-white/75 whitespace-pre-line leading-relaxed mb-3">{post.body}</div>
          ) : (
            <div className="mb-3">
              <div className="text-sm text-white/75 whitespace-pre-line leading-relaxed mb-3 blur-sm select-none">
                {post.body.slice(0, 80)}…
              </div>
              <div className="p-3 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-sm font-black text-white/50 mb-1">🔒 Token-Gated Content</div>
                <div className="text-xs text-white/25 mb-2">Hold {post.minTokens}+ ${post.tokenSymbol} to unlock</div>
                <button onClick={() => router.push(`/tokens/${post.tokenSymbol}/chart`)}
                  className="px-4 py-1.5 rounded-lg text-xs font-black"
                  style={{ background: post.authorColor, color: '#04040A' }}>
                  Get ${post.tokenSymbol} →
                </button>
              </div>
            </div>
          )}

          {/* Poll */}
          {post.type === 'poll' && post.pollOptions && (
            <div className="space-y-2 mb-3">
              {post.pollOptions.map((opt, idx) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                const isVoted = voted === idx
                return (
                  <button key={idx} onClick={() => vote(idx)} disabled={voted !== null || voting !== null}
                    className="w-full text-left rounded-xl overflow-hidden border"
                    style={{ borderColor: isVoted ? post.authorColor : 'rgba(255,255,255,0.08)' }}>
                    <div className="relative px-3 py-2.5">
                      <div className="absolute inset-0 rounded-xl" style={{ width: voted !== null ? `${pct}%` : '0%', background: `${post.authorColor}15`, transition: 'width 0.6s ease' }} />
                      <div className="relative flex justify-between">
                        <span className="text-sm text-white/70">{opt.text}</span>
                        {voted !== null && <span className="text-xs font-black" style={{ color: isVoted ? post.authorColor : 'rgba(255,255,255,0.3)' }}>{pct}%</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
              <div className="text-xs text-white/25">{(totalVotes + (voted !== null ? 1 : 0)).toLocaleString()} votes</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-3 border-t border-white/5">
            <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm"
              style={{ color: liked ? post.authorColor : 'rgba(255,255,255,0.35)' }}>
              <span>{liked ? '❤️' : '🤍'}</span>
              <span className="font-bold">{likeCount.toLocaleString()}</span>
            </button>
            <div className="flex items-center gap-1.5 text-sm text-white/35">
              <span>💬</span>
              <span className="font-bold">{comments.length}</span>
            </div>
            <button onClick={sendTip} disabled={tipping}
              className="flex items-center gap-1.5 text-sm"
              style={{ color: tipped ? '#22c55e' : 'rgba(255,255,255,0.35)' }}>
              <span>{tipped ? '✓' : '💸'}</span>
              <span className="font-bold">{tipped ? 'Tipped!' : `Tips (${post.tips})`}</span>
            </button>
            <button className="ml-auto text-white/25 text-sm">↗</button>
          </div>
        </div>

        {/* Comment input */}
        <div className="flex gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
            style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>Y</div>
          <div className="flex-1 flex gap-2">
            <input value={commentInput} onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder="Add a comment…"
              className="flex-1 px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
            <button onClick={submitComment} disabled={!commentInput.trim()}
              className="px-3 py-2 rounded-xl text-xs font-black disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Post
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <div className="text-xs text-white/25 font-semibold uppercase tracking-wider">{comments.length} Comments</div>
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: `${c.authorColor}15`, color: c.authorColor }}>
                {c.author[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-white/70">@{c.author}</span>
                  {c.authorVerified && <span className="text-xs" style={{ color: c.authorColor }}>✓</span>}
                  <span className="text-xs text-white/20">{c.ts}</span>
                </div>
                <div className="text-sm text-white/60">{c.body}</div>
                <button onClick={() => {
                  setComments(prev => prev.map(x => x.id === c.id ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 } : x))
                }} className="mt-1 text-xs flex items-center gap-1"
                  style={{ color: c.liked ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                  {c.liked ? '❤️' : '🤍'} {c.likes}
                </button>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-8 text-sm text-white/20">No comments yet. Be first!</div>
          )}
        </div>
      </div>
    </div>
  )
}
