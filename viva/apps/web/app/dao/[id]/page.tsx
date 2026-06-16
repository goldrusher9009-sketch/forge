'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PROPOSAL = {
  id: 'p1',
  title: 'Increase Diamond Staker Revenue Share from 20% to 25%',
  status: 'active',
  category: 'Token Economics',
  author: { name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7', avatar: 'SV' },
  created: '2026-06-10',
  deadline: '2026-06-20',
  quorum: 500,
  votesFor: 1284,
  votesAgainst: 312,
  votesAbstain: 89,
  description: `## Summary

This proposal seeks to increase the revenue share allocation for Diamond-tier stakers from the current 20% to 25% of total advertising revenue generated on the Sovereign V profile.

## Motivation

Diamond-tier stakers represent our most committed community members — they hold ≥100 SOVV tokens and have chosen maximum lock-in. Since the Diamond tier was introduced in Q1 2026, Diamond holders have generated disproportionate referral activity and community advocacy.

Rewarding long-term commitment at a higher rate aligns incentives, reduces sell pressure, and signals that SOVV is designed for holders, not flippers.

## Specification

- Diamond tier revenue share: 20% → 25%
- Gold tier unchanged: 10%
- Silver tier unchanged: 5%
- Implementation: Effective 7 days after proposal passes
- Funding source: 5% comes from protocol treasury allocation (currently 45%, reduced to 40%)

## Risk Assessment

**Low risk.** The 5% delta is sourced from treasury allocation, not from removing revenue from other tiers. All existing holders maintain their current benefits.

## Voting Options

- **For:** Increase Diamond share to 25%
- **Against:** Keep Diamond share at 20%
- **Abstain:** No preference`,
  comments: [
    { id: 'c1', author: { name: 'Hodler X', handle: 'hodler_x', color: '#22c55e', avatar: 'HX' }, text: 'Strong support. Diamond holders take on real risk. 25% is still conservative honestly.', votes: 34, ts: '3h ago' },
    { id: 'c2', author: { name: 'ZeroNode', handle: 'zeronode', color: '#818cf8', avatar: 'ZN' }, text: 'I\'d want to see the treasury runway analysis first. Is 40% treasury still sustainable long-term?', votes: 28, ts: '2h ago' },
    { id: 'c3', author: { name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7', avatar: 'SV' }, text: '@zeronode Treasury has 18mo runway at current burn. Full breakdown in the governance forum.', votes: 51, ts: '1h ago', isAuthor: true },
    { id: 'c4', author: { name: 'Luna Apex', handle: 'luna_apex', color: '#f59e0b', avatar: 'LA' }, text: 'Voting FOR. Rewards the most committed community members.', votes: 19, ts: '45m ago' },
  ],
}

export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()

  const [myVote, setMyVote] = useState<'for' | 'against' | 'abstain' | null>(null)
  const [voting, setVoting] = useState(false)
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState(PROPOSAL.comments)
  const [submitting, setSubmitting] = useState(false)
  const [votedComments, setVotedComments] = useState<Set<string>>(new Set())

  const totalVotes = PROPOSAL.votesFor + PROPOSAL.votesAgainst + PROPOSAL.votesAbstain
  const forPct = (PROPOSAL.votesFor / totalVotes * 100).toFixed(1)
  const againstPct = (PROPOSAL.votesAgainst / totalVotes * 100).toFixed(1)
  const abstainPct = (PROPOSAL.votesAbstain / totalVotes * 100).toFixed(1)
  const quorumPct = Math.min(100, totalVotes / PROPOSAL.quorum * 100)
  const daysLeft = Math.max(0, Math.ceil((new Date(PROPOSAL.deadline).getTime() - Date.now()) / 86400000))

  async function castVote(vote: 'for' | 'against' | 'abstain') {
    setVoting(true)
    await new Promise(r => setTimeout(r, 900))
    setMyVote(vote)
    setVoting(false)
    setTxMsg(`Vote cast: ${vote.charAt(0).toUpperCase() + vote.slice(1)}`)
    setTimeout(() => setTxMsg(null), 4000)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    setComments(prev => [...prev, {
      id: `nc_${Date.now()}`,
      author: { name: 'You', handle: 'me', color: '#a855f7', avatar: 'ME' },
      text: newComment,
      votes: 0, ts: 'just now',
    }])
    setNewComment('')
    setSubmitting(false)
  }

  const VOTE_OPTIONS = [
    { id: 'for',     label: '✓ Vote For',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)' },
    { id: 'against', label: '✕ Vote Against', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
    { id: 'abstain', label: '— Abstain',       color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' },
  ] as const

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
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">DAO PROPOSAL</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <span className="text-xs text-green-400 font-semibold">Active · {daysLeft}d left</span>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
            {PROPOSAL.category}
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        <h1 className="text-xl font-black text-white leading-tight">{PROPOSAL.title}</h1>

        <div className="flex items-center gap-3 text-xs text-white/30">
          <button onClick={() => router.push(`/profile/${PROPOSAL.author.handle}`)}
            className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
            <div className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs"
              style={{ background: `${PROPOSAL.author.color}18`, color: PROPOSAL.author.color }}>
              {PROPOSAL.author.avatar}
            </div>
            {PROPOSAL.author.name}
          </button>
          <span>·</span>
          <span>Ends {PROPOSAL.deadline}</span>
        </div>

        {/* Vote bars */}
        <div className="p-4 rounded-2xl border border-white/8 space-y-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="flex justify-between text-xs text-white/30 mb-1">
            <span>{totalVotes.toLocaleString()} votes</span>
            <span>Quorum: {PROPOSAL.quorum} ({quorumPct.toFixed(0)}%)</span>
          </div>
          {[
            { label: 'For',     pct: forPct,     count: PROPOSAL.votesFor,     color: '#22c55e' },
            { label: 'Against', pct: againstPct, count: PROPOSAL.votesAgainst, color: '#f87171' },
            { label: 'Abstain', pct: abstainPct, count: PROPOSAL.votesAbstain, color: '#94a3b8' },
          ].map(v => (
            <div key={v.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: v.color }}>{v.label}</span>
                <span className="text-white/40">{v.count.toLocaleString()} ({v.pct}%)</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${v.pct}%`, background: v.color }} />
              </div>
            </div>
          ))}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/30">Quorum Progress</span>
              <span className="text-white/30">{quorumPct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${quorumPct}%`, background: '#a855f7' }} />
            </div>
          </div>
        </div>

        {/* Cast vote */}
        {!myVote ? (
          <div className="space-y-2">
            <div className="text-xs text-white/30 uppercase tracking-widest">Cast Your Vote</div>
            {VOTE_OPTIONS.map(v => (
              <button key={v.id} onClick={() => castVote(v.id)} disabled={voting}
                className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
                style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}>
                {voting ? '…' : v.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl text-center font-bold"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
            ✓ Voted: {myVote.charAt(0).toUpperCase() + myVote.slice(1)}
          </div>
        )}

        {/* Description */}
        <div className="p-4 rounded-2xl border border-white/6 space-y-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest">Proposal</div>
          <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line">
            {PROPOSAL.description}
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <div className="text-xs text-white/30 uppercase tracking-widest">Discussion</div>

          <div className="flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder="Add to discussion…"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none" />
            <button onClick={submitComment} disabled={submitting || !newComment.trim()}
              className="px-3 py-2.5 rounded-xl text-xs font-black disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              {submitting ? '…' : 'Post'}
            </button>
          </div>

          {comments.map(c => (
            <div key={c.id} className={`p-3 rounded-xl border border-white/6 ${(c as any).isAuthor ? 'border-purple-500/20 bg-purple-950/10' : ''}`}
              style={!(c as any).isAuthor ? { background: 'rgba(255,255,255,0.018)' } : {}}>
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: `${c.author.color}18`, color: c.author.color }}>{c.author.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => router.push(`/profile/${c.author.handle}`)}
                      className="text-xs font-bold text-white/70 hover:text-white transition-colors">
                      {c.author.name}
                    </button>
                    {(c as any).isAuthor && (
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: '#a855f720', color: '#a855f7' }}>Author</span>
                    )}
                    <span className="text-xs text-white/20">{c.ts}</span>
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed">{c.text}</p>
                  <button onClick={() => setVotedComments(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n })}
                    className="flex items-center gap-1 mt-1.5 text-xs transition-colors"
                    style={{ color: votedComments.has(c.id) ? '#a855f7' : 'rgba(255,255,255,0.25)' }}>
                    ↑ {c.votes + (votedComments.has(c.id) ? 1 : 0)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
