'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Review {
  id: string
  reviewer: string
  reviewerColor: string
  rating: number
  text: string
  ts: string
  helpful: number
  youHelpful: boolean
  verified: boolean
}

const PROFILES: Record<string, { name: string; color: string; avgRating: number; totalReviews: number }> = {
  sovereign_v: { name: 'Sovereign V',  color: '#a855f7', avgRating: 4.9, totalReviews: 284 },
  mayafit:     { name: 'Maya Chen',    color: '#22c55e', avgRating: 4.8, totalReviews: 142 },
  jaxbeats:    { name: 'Jax Beats',    color: '#ec4899', avgRating: 4.7, totalReviews: 97  },
}

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', reviewer: 'atlas_k',  reviewerColor: '#818cf8', rating: 5, text: 'Absolutely top-tier signals. Been following for 6 months and consistently profitable. The rationale behind each trade is invaluable for learning.',           ts: '2026-05-20T10:00:00Z', helpful: 34, youHelpful: false, verified: true  },
  { id: 'r2', reviewer: 'noa_d',    reviewerColor: '#f59e0b', rating: 5, text: 'Best DeFi analyst on VIVA bar none. The BTC cycle deep dive alone was worth the token investment. Posts consistently, always backed by data.',                ts: '2026-05-15T08:00:00Z', helpful: 28, youHelpful: true,  verified: true  },
  { id: 'r3', reviewer: 'kai_r',    reviewerColor: '#22c55e', rating: 4, text: 'Great content overall. Signals are solid, win rate is real. Would give 5 stars but sometimes the write-ups come a bit late after the entry window closes.', ts: '2026-04-28T14:00:00Z', helpful: 19, youHelpful: false, verified: false },
  { id: 'r4', reviewer: 'luna_w',   reviewerColor: '#ec4899', rating: 5, text: 'Bought the signal pack and made back 8x the token cost in the first week. The private Telegram is super active too.',                                    ts: '2026-04-10T09:00:00Z', helpful: 44, youHelpful: false, verified: true  },
  { id: 'r5', reviewer: 'marco_v',  reviewerColor: '#f87171', rating: 3, text: 'Content is good but token price makes it inaccessible for smaller accounts. Would love a lite tier.',                                                         ts: '2026-03-22T16:00:00Z', helpful: 12, youHelpful: false, verified: true  },
]

const DIST = [
  { stars: 5, count: 201 },
  { stars: 4, count: 52  },
  { stars: 3, count: 18  },
  { stars: 2, count: 8   },
  { stars: 1, count: 5   },
]

function fmtRelative(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  if (d < 86400 * 30) return `${Math.floor(d / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ReviewsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? PROFILES.sovereign_v

  const [reviews, setReviews] = useState(MOCK_REVIEWS)
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all')
  const [showForm, setShowForm] = useState(false)
  const [myRating, setMyRating] = useState(0)
  const [myText, setMyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.rating === Number(filter))
  const maxCount = Math.max(...DIST.map(d => d.count))

  function toggleHelpful(id: string) {
    setReviews(prev => prev.map(r => r.id === id
      ? { ...r, youHelpful: !r.youHelpful, helpful: r.helpful + (r.youHelpful ? -1 : 1) }
      : r))
  }

  async function submitReview() {
    if (!myRating || !myText.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setReviews(prev => [{
      id: `r${Date.now()}`,
      reviewer: 'you',
      reviewerColor: '#818cf8',
      rating: myRating,
      text: myText,
      ts: new Date().toISOString(),
      helpful: 0,
      youHelpful: false,
      verified: true,
    }, ...prev])
    setMyRating(0)
    setMyText('')
    setShowForm(false)
    setSubmitting(false)
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
          <div>
            <div className="font-black text-white">Reviews</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
          <div className="ml-auto">
            <button onClick={() => setShowForm(s => !s)}
              className="px-3 py-1.5 rounded-xl text-xs font-black"
              style={{ background: profile.color, color: '#04040A' }}>
              + Write Review
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Summary */}
        <div className="p-4 rounded-2xl border border-white/5 flex gap-4"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-center pr-4 border-r border-white/6">
            <div className="text-4xl font-black text-white">{profile.avgRating}</div>
            <div className="text-yellow-400 text-lg">{'★'.repeat(Math.round(profile.avgRating))}</div>
            <div className="text-xs text-white/25 mt-1">{profile.totalReviews} reviews</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {DIST.map(d => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="text-xs text-white/30 w-2">{d.stars}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(d.count / maxCount) * 100}%`, background: profile.color }} />
                </div>
                <span className="text-xs text-white/20 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write review form */}
        {showForm && (
          <div className="p-4 rounded-2xl border space-y-3" style={{ background: 'rgba(255,255,255,0.018)', borderColor: `${profile.color}20` }}>
            <div className="text-sm font-black text-white/70">Your review of @{handle}</div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setMyRating(s)} className="text-2xl">
                  <span style={{ color: s <= myRating ? '#f59e0b' : 'rgba(255,255,255,0.15)' }}>★</span>
                </button>
              ))}
            </div>
            <textarea value={myText} onChange={e => setMyText(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                Cancel
              </button>
              <button onClick={submitReview} disabled={!myRating || !myText.trim() || submitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-black disabled:opacity-30"
                style={{ background: profile.color, color: '#04040A' }}>
                {submitting ? 'Posting…' : 'Post Review'}
              </button>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['all', '5', '4', '3', '2', '1'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f ? { background: profile.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? `All (${reviews.length})` : `${'★'.repeat(Number(f))} ${f}`}
            </button>
          ))}
        </div>

        {/* Review list */}
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="p-4 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: `${r.reviewerColor}15`, color: r.reviewerColor }}>
                  {r.reviewer[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white/70">@{r.reviewer}</span>
                    {r.verified && <span className="text-xs" style={{ color: profile.color }}>✓</span>}
                    <span className="text-xs text-white/20">{fmtRelative(r.ts)}</span>
                  </div>
                  <div className="text-yellow-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
              </div>
              <p className="text-sm text-white/55 leading-relaxed mb-3">{r.text}</p>
              <button onClick={() => toggleHelpful(r.id)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                style={r.youHelpful
                  ? { background: `${profile.color}15`, color: profile.color }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                👍 Helpful ({r.helpful})
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
