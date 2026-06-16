'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Proposal {
  id: string
  title: string
  description: string
  proposer: string
  proposerColor: string
  status: 'active' | 'passed' | 'rejected' | 'pending'
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  quorum: number
  endDate: string
  category: string
  impact: string
  tokenRequired: number
  tokenSymbol: string
}

const PROPOSALS: Record<string, Proposal> = {
  p1: {
    id:'p1', title:'Reduce staking lock period from 90 to 60 days',
    description:'This proposal aims to make staking more accessible by reducing the minimum lock period. Current 90-day locks deter new holders. A 60-day period balances commitment with flexibility, potentially increasing staking participation by 40% based on community surveys.',
    proposer:'sovereign_v', proposerColor:'#a855f7', status:'active',
    votesFor:142000, votesAgainst:58000, votesAbstain:12000,
    quorum:200000, endDate:'Jun 22, 2026', category:'Protocol',
    impact:'High — affects all stakers platform-wide',
    tokenRequired:10, tokenSymbol:'VIVA',
  },
  p2: {
    id:'p2', title:'Launch VIVA Creator Grant Program — 500k USDC pool',
    description:'Establish a quarterly grant program to fund emerging creators. Grants of $1k–$25k USDC for creators who meet V-Score and engagement thresholds. Funded from treasury performance fees.',
    proposer:'mayafit', proposerColor:'#22c55e', status:'active',
    votesFor:284000, votesAgainst:24000, votesAbstain:8000,
    quorum:200000, endDate:'Jun 28, 2026', category:'Treasury',
    impact:'Medium — new spending from treasury',
    tokenRequired:10, tokenSymbol:'VIVA',
  },
}

const STATUS_COLOR: Record<string, string> = { active:'#22c55e', passed:'#818cf8', rejected:'#f87171', pending:'#f59e0b' }

export default function DaoVotePage() {
  const router = useRouter()
  const params = useParams()
  const id       = typeof params.id === 'string' ? params.id : 'p1'
  const proposal = PROPOSALS[id] ?? PROPOSALS.p1

  const [vote,   setVote  ] = useState<'for' | 'against' | 'abstain' | null>(null)
  const [voted,  setVoted ] = useState(false)
  const [voting, setVoting] = useState(false)

  const total = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain
  const forPct     = (proposal.votesFor     / total) * 100
  const againstPct = (proposal.votesAgainst / total) * 100
  const abstainPct = (proposal.votesAbstain / total) * 100
  const quorumPct  = Math.min((total / proposal.quorum) * 100, 100)

  async function castVote() {
    if (!vote || voted) return
    setVoting(true)
    await new Promise(r => setTimeout(r, 1000))
    setVoting(false)
    setVoted(true)
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
          <div className="flex-1 min-w-0">
            <div className="font-black text-white text-sm leading-tight truncate">{proposal.title}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold" style={{ color: STATUS_COLOR[proposal.status] }}>● {proposal.status}</span>
              <span className="text-xs text-white/25">{proposal.category}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Proposer */}
        <button onClick={() => router.push(`/profile/${proposal.proposer}`)}
          className="flex items-center gap-2 p-3 rounded-2xl border border-white/4 w-full"
          style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
            style={{ background: `${proposal.proposerColor}15`, color: proposal.proposerColor }}>
            {proposal.proposer[0].toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-xs text-white/30">Proposed by</div>
            <div className="text-sm font-bold text-white/70">@{proposal.proposer}</div>
          </div>
          <div className="ml-auto text-xs text-white/25">Ends {proposal.endDate}</div>
        </button>

        {/* Description */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Proposal</div>
          <p className="text-sm text-white/60 leading-relaxed">{proposal.description}</p>
        </div>

        {/* Impact */}
        <div className="p-3 rounded-xl border" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="text-xs text-amber-400/70 font-semibold uppercase tracking-wider mb-1">Impact</div>
          <div className="text-sm text-white/60">{proposal.impact}</div>
        </div>

        {/* Votes breakdown */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Current Votes</div>

          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            <div style={{ width: `${forPct}%`,     background: '#22c55e' }} />
            <div style={{ width: `${againstPct}%`, background: '#f87171' }} />
            <div style={{ width: `${abstainPct}%`, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {[
            { label:'For',     votes:proposal.votesFor,     pct:forPct,     color:'#22c55e' },
            { label:'Against', votes:proposal.votesAgainst, pct:againstPct, color:'#f87171' },
            { label:'Abstain', votes:proposal.votesAbstain, pct:abstainPct, color:'rgba(255,255,255,0.2)' },
          ].map(v => (
            <div key={v.label} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                <span className="text-sm text-white/60">{v.label}</span>
              </div>
              <div className="text-right">
                <span className="font-black text-sm" style={{ color: v.color }}>{v.pct.toFixed(1)}%</span>
                <span className="text-xs text-white/25 ml-2">{(v.votes/1000).toFixed(0)}k</span>
              </div>
            </div>
          ))}

          {/* Quorum */}
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex justify-between text-xs text-white/30 mb-1.5">
              <span>Quorum</span>
              <span>{quorumPct.toFixed(0)}% ({(total/1000).toFixed(0)}k / {(proposal.quorum/1000).toFixed(0)}k)</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${quorumPct}%`, background: quorumPct >= 100 ? '#22c55e' : '#f59e0b' }} />
            </div>
            {quorumPct >= 100 && <div className="text-xs text-green-400 mt-1">✓ Quorum reached</div>}
          </div>
        </div>

        {/* Vote CTA */}
        {!voted ? (
          <div className="p-4 rounded-2xl border border-white/5 space-y-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Cast Your Vote</div>
            <div className="text-xs text-white/25">Requires {proposal.tokenRequired}+ ${proposal.tokenSymbol}</div>
            <div className="grid grid-cols-3 gap-2">
              {(['for','against','abstain'] as const).map(v => (
                <button key={v} onClick={() => setVote(v)}
                  className="py-2 rounded-xl text-xs font-black capitalize"
                  style={vote === v
                    ? { background: v === 'for' ? '#22c55e' : v === 'against' ? '#f87171' : 'rgba(255,255,255,0.15)', color: '#04040A' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  {v === 'for' ? '✓ For' : v === 'against' ? '✗ Against' : '− Abstain'}
                </button>
              ))}
            </div>
            <button onClick={castVote} disabled={!vote || voting}
              className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40"
              style={{ background: vote === 'for' ? '#22c55e' : vote === 'against' ? '#f87171' : '#818cf8', color: '#04040A' }}>
              {voting ? 'Submitting…' : vote ? `Vote ${vote.charAt(0).toUpperCase() + vote.slice(1)}` : 'Select a vote option'}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-green-500/20 text-center"
            style={{ background: 'rgba(34,197,94,0.06)' }}>
            <div className="text-2xl mb-2">✓</div>
            <div className="font-black text-white/80">Vote recorded!</div>
            <div className="text-xs text-white/30 mt-1">You voted <span className="text-white/60">{vote}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}
