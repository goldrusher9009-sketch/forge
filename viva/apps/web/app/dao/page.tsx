'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ProposalStatus = 'active' | 'passed' | 'failed' | 'pending'
type VoteChoice = 'for' | 'against' | 'abstain'

interface Proposal {
  id: string
  title: string
  body: string
  author: string
  authorColor: string
  tokenSymbol: string
  color: string
  status: ProposalStatus
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  quorum: number
  endDate: string
  category: 'treasury' | 'protocol' | 'creator' | 'community'
  myVotingPower?: number
}

const PROPOSALS: Proposal[] = [
  { id:'p1', title:'Allocate 50k USDC to Creator Grants Fund', body:'Proposal to allocate 50,000 USDC from the VIVA treasury to bootstrap a creator grants program rewarding top content creators who drive platform growth.', author:'sovereign_v', authorColor:'#a855f7', tokenSymbol:'SVRN', color:'#a855f7', status:'active', votesFor:142000, votesAgainst:38000, votesAbstain:12000, quorum:200000, endDate:'Jun 22, 2026', category:'treasury', myVotingPower:50 },
  { id:'p2', title:'Reduce Token Trading Fee from 2.5% to 1.8%', body:'Lower the platform trading fee to increase volume and remain competitive with external DEX alternatives. Revenue simulation shows net positive outcome at higher volume.', author:'atlas_k', authorColor:'#818cf8', tokenSymbol:'SVRN', color:'#818cf8', status:'active', votesFor:284000, votesAgainst:62000, votesAbstain:8000, quorum:200000, endDate:'Jun 25, 2026', category:'protocol', myVotingPower:50 },
  { id:'p3', title:'Add Fitness Category to Creator Leaderboard', body:'Create a dedicated fitness leaderboard track with $MAYA as the featured token, allowing fitness creators to compete separately from DeFi and music verticals.', author:'mayafit', authorColor:'#22c55e', tokenSymbol:'MAYA', color:'#22c55e', status:'passed', votesFor:310000, votesAgainst:28000, votesAbstain:14000, quorum:200000, endDate:'Jun 10, 2026', category:'creator' },
  { id:'p4', title:'Partner with Solana Foundation for L2 Deployment', body:'Evaluate and vote on deploying VIVA token infrastructure on Solana for lower gas costs and faster settlement.', author:'sovereign_v', authorColor:'#a855f7', tokenSymbol:'SVRN', color:'#a855f7', status:'failed', votesFor:88000, votesAgainst:196000, votesAbstain:22000, quorum:200000, endDate:'Jun 5, 2026', category:'protocol' },
  { id:'p5', title:'Launch Community Moderation DAO Council', body:'Form a 9-member community moderation council elected by token holders to handle content disputes and creator violations.', author:'luna_w', authorColor:'#f87171', tokenSymbol:'SVRN', color:'#f87171', status:'pending', votesFor:0, votesAgainst:0, votesAbstain:0, quorum:200000, endDate:'Jul 1, 2026', category:'community', myVotingPower:50 },
]

const STATUS_COLOR: Record<ProposalStatus, string> = { active:'#22c55e', passed:'#818cf8', failed:'#f87171', pending:'#f59e0b' }
const STATUS_LABEL: Record<ProposalStatus, string> = { active:'Active', passed:'Passed', failed:'Failed', pending:'Pending' }
const CAT_EMOJI: Record<string, string> = { treasury:'💰', protocol:'⚙️', creator:'⭐', community:'🏛️' }

export default function DAOPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<ProposalStatus | 'all'>('all')
  const [votes, setVotes]   = useState<Record<string, VoteChoice>>({})
  const [voting, setVoting] = useState<Record<string, boolean>>({})
  const [expand, setExpand] = useState<Record<string, boolean>>({})

  async function vote(id: string, choice: VoteChoice) {
    setVoting(p => ({ ...p, [id]: true }))
    await new Promise(r => setTimeout(r, 900))
    setVoting(p => ({ ...p, [id]: false }))
    setVotes(p => ({ ...p, [id]: choice }))
  }

  const filtered = PROPOSALS.filter(p => filter === 'all' || p.status === filter)
  const activeCount = PROPOSALS.filter(p => p.status === 'active').length

  const totalPower = PROPOSALS.filter(p => p.myVotingPower).reduce((s, p) => s + (p.myVotingPower ?? 0), 0)

  return (
    <div className="min-h-screen pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">🏛️ DAO Governance</div>
            <div className="text-xs text-white/30">{activeCount} active proposals · {totalPower} voting power</div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(['all','active','passed','failed','pending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize flex-shrink-0"
              style={filter === f ? { background:'#a855f7', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </header>

      {/* Voting power card */}
      <div className="mx-4 mt-4 p-4 rounded-2xl border border-white/5 flex items-center gap-3"
        style={{ background:'rgba(168,85,247,0.06)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background:'rgba(168,85,247,0.1)' }}>🗳️</div>
        <div>
          <div className="font-black text-sm text-white/80">Your Voting Power</div>
          <div className="text-xs text-white/35">50 SVRN · 80 MAYA = <span className="font-bold" style={{ color:'#a855f7' }}>130 votes</span></div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {filtered.map(p => {
          const total = p.votesFor + p.votesAgainst + p.votesAbstain || 1
          const forPct     = Math.round((p.votesFor / total) * 100)
          const againstPct = Math.round((p.votesAgainst / total) * 100)
          const quorumPct  = Math.min(100, Math.round((total / p.quorum) * 100))
          const myVote     = votes[p.id]
          const isVoting   = voting[p.id]
          const isExpanded = expand[p.id]

          return (
            <div key={p.id} className="rounded-2xl border border-white/4 overflow-hidden"
              style={{ background:'rgba(255,255,255,0.015)' }}>
              <div className="h-0.5" style={{ background:p.color }} />
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-sm">{CAT_EMOJI[p.category]}</span>
                  <div className="flex-1">
                    <button onClick={() => setExpand(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="text-sm font-black text-white/85 text-left leading-snug">
                      {p.title}
                    </button>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/25">@{p.author}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background:`${STATUS_COLOR[p.status]}12`, color:STATUS_COLOR[p.status] }}>
                        {STATUS_LABEL[p.status]}
                      </span>
                      <span className="text-xs text-white/20">Ends {p.endDate}</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="text-xs text-white/40 leading-relaxed mb-3">{p.body}</div>
                )}

                {/* Vote bars */}
                <div className="space-y-1.5 mb-3">
                  <div>
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>For</span><span className="font-bold" style={{ color:'#22c55e' }}>{forPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width:`${forPct}%`, background:'#22c55e' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>Against</span><span className="font-bold" style={{ color:'#f87171' }}>{againstPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width:`${againstPct}%`, background:'#f87171' }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-white/20">
                    <span>Quorum {quorumPct}%</span>
                    <span>{(total/1000).toFixed(0)}k votes cast</span>
                  </div>
                </div>

                {/* Voting buttons (only active + has power) */}
                {p.status === 'active' && p.myVotingPower && (
                  <div>
                    {myVote ? (
                      <div className="text-center text-xs font-bold py-2 rounded-xl"
                        style={{ background:`${myVote==='for'?'#22c55e':myVote==='against'?'#f87171':'#94a3b8'}12`,
                                 color:myVote==='for'?'#22c55e':myVote==='against'?'#f87171':'#94a3b8' }}>
                        ✓ Voted {myVote} ({p.myVotingPower} votes)
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {(['for','against','abstain'] as VoteChoice[]).map(c => (
                          <button key={c} onClick={() => vote(p.id, c)} disabled={isVoting}
                            className="flex-1 py-2 rounded-xl text-xs font-black capitalize"
                            style={c === 'for'
                              ? { background:'rgba(34,197,94,0.12)', color:'#22c55e' }
                              : c === 'against'
                                ? { background:'rgba(248,113,113,0.12)', color:'#f87171' }
                                : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
                            {isVoting ? '…' : c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
