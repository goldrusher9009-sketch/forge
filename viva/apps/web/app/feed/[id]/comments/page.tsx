'use client'
import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Comment {
  id: string
  author: string
  authorColor: string
  text: string
  ts: string
  likes: number
  youLiked: boolean
  replies?: Comment[]
  isPinned?: boolean
}

const POST_SUMMARIES: Record<string, { title: string; author: string; authorColor: string; commentCount: number }> = {
  p1: { title: 'BTC accumulation zone — why I\'m adding here', author: 'sovereign_v', authorColor: '#a855f7', commentCount: 47 },
  p2: { title: 'My morning routine that changed everything',   author: 'mayafit',     authorColor: '#22c55e', commentCount: 31 },
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1', author: 'atlas_k', authorColor: '#818cf8', ts: '2026-06-15T09:00:00Z', likes: 18, youLiked: false, isPinned: true,
    text: 'This is exactly what I needed to see. Been waiting for someone to call out the divergence on the weekly. Thanks for the clear breakdown.',
    replies: [
      { id: 'c1r1', author: 'sovereign_v', authorColor: '#a855f7', ts: '2026-06-15T09:30:00Z', likes: 7, youLiked: false,
        text: 'Glad it helped! The weekly RSI divergence is the key signal here. Keep watching the $94k level.' },
    ],
  },
  {
    id: 'c2', author: 'noa_d', authorColor: '#f59e0b', ts: '2026-06-15T10:00:00Z', likes: 11, youLiked: true,
    text: 'Perfect timing on this post. I was literally looking at the same chart last night wondering if anyone else saw the pattern. Bought 0.05 BTC at $95.2k this morning.',
    replies: [],
  },
  {
    id: 'c3', author: 'kai_r', authorColor: '#22c55e', ts: '2026-06-15T11:30:00Z', likes: 6, youLiked: false,
    text: 'Do you see the same setup on ETH? Feels like ETH has been lagging but might follow.',
    replies: [
      { id: 'c3r1', author: 'luna_w', authorColor: '#ec4899', ts: '2026-06-15T12:00:00Z', likes: 3, youLiked: false,
        text: 'ETH is showing the same RSI divergence on the 4h, just less obvious.' },
    ],
  },
  {
    id: 'c4', author: 'luna_w', authorColor: '#ec4899', ts: '2026-06-15T13:00:00Z', likes: 4, youLiked: false,
    text: 'This is why I hold SVRN tokens. Posts like this alone are worth more than the token price.',
    replies: [],
  },
  {
    id: 'c5', author: 'marco_v', authorColor: '#f87171', ts: '2026-06-15T14:00:00Z', likes: 2, youLiked: false,
    text: 'What\'s your stop loss recommendation on this entry? You mentioned $90k in the signal pack but seems wide.',
    replies: [],
  },
]

function fmtRelative(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 3600)  return `${Math.floor(d / 60)}m`
  if (d < 86400) return `${Math.floor(d / 3600)}h`
  return `${Math.floor(d / 86400)}d`
}

function CommentItem({ c, onLike, onReply, level = 0 }: {
  c: Comment; onLike: (id: string) => void; onReply: (id: string, author: string) => void; level?: number
}) {
  return (
    <div className={level > 0 ? 'pl-10 mt-3' : ''}>
      {c.isPinned && (
        <div className="text-xs text-white/20 mb-1 flex items-center gap-1">
          <span>📌</span> Pinned by author
        </div>
      )}
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
          style={{ background: `${c.authorColor}18`, color: c.authorColor }}>
          {c.author[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-bold text-xs text-white/70">@{c.author}</span>
            <span className="text-xs text-white/20">{fmtRelative(c.ts)}</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{c.text}</p>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => onLike(c.id)}
              className="flex items-center gap-1 text-xs"
              style={{ color: c.youLiked ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
              {c.youLiked ? '❤️' : '🤍'} {c.likes}
            </button>
            {level === 0 && (
              <button onClick={() => onReply(c.id, c.author)}
                className="text-xs text-white/25 hover:text-white/50">
                Reply
              </button>
            )}
          </div>
          {c.replies?.map(r => (
            <CommentItem key={r.id} c={r} onLike={onLike} onReply={onReply} level={1} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CommentsPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'p1'
  const post = POST_SUMMARIES[id] ?? POST_SUMMARIES.p1

  const [comments, setComments] = useState(MOCK_COMMENTS)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null)
  const [posting, setPosting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function toggleLike(cid: string) {
    function toggle(list: Comment[]): Comment[] {
      return list.map(c => {
        if (c.id === cid) return { ...c, youLiked: !c.youLiked, likes: c.likes + (c.youLiked ? -1 : 1) }
        if (c.replies) return { ...c, replies: toggle(c.replies) }
        return c
      })
    }
    setComments(prev => toggle(prev))
  }

  function startReply(id: string, author: string) {
    setReplyTo({ id, author })
    setText(`@${author} `)
    inputRef.current?.focus()
  }

  async function post_comment() {
    if (!text.trim()) return
    setPosting(true)
    await new Promise(r => setTimeout(r, 800))
    const newC: Comment = {
      id: `c${Date.now()}`,
      author: 'you',
      authorColor: '#818cf8',
      ts: new Date().toISOString(),
      likes: 0,
      youLiked: false,
      text: text.trim(),
      replies: [],
    }
    if (replyTo) {
      setComments(prev => prev.map(c =>
        c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), newC] } : c
      ))
    } else {
      setComments(prev => [...prev, newC])
    }
    setText('')
    setReplyTo(null)
    setPosting(false)
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="font-black text-white">Comments</div>
            <div className="text-xs text-white/30">{comments.length} comments</div>
          </div>
        </div>
      </header>

      {/* Post preview */}
      <button onClick={() => router.push(`/feed/${id}`)}
        className="w-full px-4 py-3 border-b border-white/4 text-left"
        style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px]"
            style={{ background: `${post.authorColor}18`, color: post.authorColor }}>
            {post.author[0].toUpperCase()}
          </div>
          <span className="text-xs text-white/35">@{post.author}</span>
        </div>
        <div className="text-sm text-white/50 truncate">{post.title}</div>
      </button>

      {/* Comments */}
      <div className="px-4 py-4 space-y-5">
        {comments.map(c => (
          <CommentItem key={c.id} c={c} onLike={toggleLike} onReply={startReply} />
        ))}
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        {replyTo && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-white/30">Replying to @{replyTo.author}</span>
            <button onClick={() => { setReplyTo(null); setText('') }} className="text-xs text-white/20">✕</button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
            style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
            Y
          </div>
          <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && post_comment()}
            placeholder="Add a comment…"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
          <button onClick={post_comment} disabled={!text.trim() || posting}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30"
            style={{ background: '#a855f7', color: '#04040A' }}>
            {posting ? '…' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
