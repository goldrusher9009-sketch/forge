'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TREASURY = { total: 284500, stablecoin: 120000, tokenReserves: 164500, runway: '18 months' }

const PROPOSALS = [
  {
    id: 'p1', title: 'Increase Diamond staking APY to 40%', author: 'sovereign_v', authorName: 'Sovereign V',
    status: 'active', category: 'Tokenomics', votesFor: 1420, votesAgainst: 380, quorum: 2000,
    ends: '2 days', desc: 'Raise the Diamond tier staking APY from 35% to 40% to attract long-term holders and reduce token circulation.',
    myVote: null as 'for' | 'against' | null,
  },
  {
    id: 'p2', title: 'Launch VIVA Creator Grants Program — $50k treasury allocation', author: 'mayafit', authorName: 'Maya Chen',
    status: 'active', category: 'Treasury', votesFor: 2100, votesAgainst: 290, quorum: 2000,
    ends: '5 days', desc: 'Allocate $50,000 from treasury to fund 10 high-potential creators with grants, boosting ecosystem growth.',
    myVote: 'for' as const,
  },
  {
    id: 'p3', title: 'Add AI-powered profile analytics dashboard', author: 'zeronode', authorName: 'ZeroNode',
    status: 'active', category: 'Product', votesFor: 890, votesAgainst: 560, quorum: 2000,
    ends: '8 days', desc: 'Integrate AI analytics on every creator profile page — token sentiment, reach prediction, top audience segments.',
    myVote: null as 'for' | 'against' | null,
  },
]

const PAST = [
  { id: 'pp1', title: 'Launch YouToken marketplace',         result: 'passed',   category: 'Product',    votes: 3200, ts: '2026-05-01' },
  { id: 'pp2', title: 'Set ad slot minimum CPM at $40',     result: 'passed',   category: 'Tokenomics', votes: 2800, ts: '2026-04-15' },
  { id: 'pp3', title: 'Burn 5% of uncirculated token supply', result: 'failed', category: 'Treasury',   votes: 1100, ts: '2026-03-22' },
]

function VoteBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

const CAT_COLORS: Record<string, string> = {
  Tokenomics: '#f59e0b', Treasury: '#22c55e', Product: '#818cf8', Governance: '#ec4899',
}

export default function DaoPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState(PROPOSALS)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [voting, setVoting] = useState<string | null>(null)
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'past'>('active')

  const myVotingPower = 620 // tokens held

  async function castVote(propId: string, choice: 'for' | 'against') {
    setVoting(propId)
    await new Promise(r => setTimeout(r, 800))
    setProposals(prev => prev.map(p => {
      if (p.id !== propId) return p
      return {
        ...p,
        myVote: choice,
        votesFor: choice === 'for' ? p.votesFor + myVotingPower : p.votesFor,
        votesAgainst: choice === 'against' ? p.votesAgainst + myVotingPower : p.votesAgainst,
      }
    }))
    setVoting(null)
    setTxMsg(`Vote cast — ${choice === 'for' ? '✓ For' : '✗ Against'} with ${myVotingPower} voting power`)
    setTimeout(() => setTxMsg(null), 3000)
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
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">VIVA COMMUNITY</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Governance DAO</h1>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold" style={{ color: '#818cf8' }}>{myVotingPower}</div>
            <div className="text-xs text-white/30">voting power</div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Treasury */}
        <div className="p-4 rounded-2xl border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.07), rgba(129,140,248,0.05))' }}>
          <div className="text-xs text-white/35 uppercase tracking-widest mb-3">Community Treasury</div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-3xl font-black text-white">${(TREASURY.total/1000).toFixed(0)}k</div>
              <div className="text-xs text-white/40 mt-1">total assets · {TREASURY.runway} runway</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-400">${(TREASURY.stablecoin/1000).toFixed(0)}k</div>
              <div className="text-xs text-white/30">stablecoins</div>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex gap-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-l-full" style={{ width: `${(TREASURY.stablecoin/TREASURY.total)*100}%`, background: '#22c55e' }} />
            <div className="h-full rounded-r-full" style={{ width: `${(TREASURY.tokenReserves/TREASURY.total)*100}%`, background: '#818cf8' }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-white/30">
            <span><span className="text-green-400">■</span> Stablecoins</span>
            <span><span style={{ color: '#818cf8' }}>■</span> Token Reserves</span>
          </div>
        </div>

        {/* Voting power card */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-white/6"
          style={{ background: 'rgba(129,140,248,0.05)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background: '#818cf818', color: '#818cf8', border: '1.5px solid #818cf830' }}>
            ◎
          </div>
          <div className="flex-1 text-xs text-white/50">
            Your voting power: <strong style={{ color: '#818cf8' }}>{myVotingPower} VP</strong> (based on tokens held). Stake more to increase influence.
          </div>
          <button onClick={() => router.push('/staking')}
            className="text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0"
            style={{ background: '#818cf818', color: '#818cf8' }}>
            Stake ↗
          </button>
        </div>

        {/* Tx msg */}
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#818cf818', color: '#818cf8', border: '1px solid #818cf825' }}>
            ✓ {txMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([
            { id: 'active', label: `⟳ Active (${proposals.length})` },
            { id: 'past',   label: `◎ Past (${PAST.length})` },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id
                ? { background: 'rgba(255,255,255,0.1)', color: 'white' }
                : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Active proposals */}
        {tab === 'active' && (
          <div className="space-y-3">
            {proposals.map(prop => {
              const total = prop.votesFor + prop.votesAgainst
              const forPct = total > 0 ? (prop.votesFor / total) * 100 : 50
              const quorumPct = Math.min((total / prop.quorum) * 100, 100)
              const isExpanded = expanded === prop.id
              const catColor = CAT_COLORS[prop.category] ?? '#a855f7'
              return (
                <div key={prop.id} className="p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${catColor}18`, color: catColor }}>{prop.category}</span>
                        <span className="text-xs text-white/30">ends in {prop.ends}</span>
                        {prop.myVote && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: prop.myVote === 'for' ? '#22c55e18' : '#f8717118', color: prop.myVote === 'for' ? '#22c55e' : '#f87171' }}>
                            {prop.myVote === 'for' ? '✓ For' : '✗ Against'}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-white text-sm leading-snug">{prop.title}</div>
                      <button className="text-xs mt-0.5 transition-colors" style={{ color: catColor }}
                        onClick={() => router.push(`/profile/${prop.author}`)}>
                        by {prop.authorName}
                      </button>
                    </div>
                  </div>

                  {/* Vote bars */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-400 font-semibold">For: {prop.votesFor.toLocaleString()}</span>
                      <span className="text-red-400 font-semibold">Against: {prop.votesAgainst.toLocaleString()}</span>
                    </div>
                    <VoteBar pct={forPct} color="#22c55e" />
                    <div className="flex justify-between text-xs text-white/25 mt-1">
                      <span>Quorum: {quorumPct.toFixed(0)}%</span>
                      <span>{total.toLocaleString()} / {prop.quorum.toLocaleString()} votes</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full rounded-full" style={{ width: `${quorumPct}%`, background: '#818cf8' }} />
                    </div>
                  </div>

                  {/* Expand */}
                  <button onClick={() => setExpanded(isExpanded ? null : prop.id)}
                    className="w-full text-xs text-white/30 hover:text-white/50 transition-colors mb-3 text-left">
                    {isExpanded ? '▲ Hide details' : '▼ Show details'}
                  </button>
                  {isExpanded && (
                    <div className="mb-3 p-3 rounded-xl text-xs text-white/50 border border-white/5"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {prop.desc}
                    </div>
                  )}

                  {/* Vote actions */}
                  {!prop.myVote ? (
                    <div className="flex gap-2">
                      <button onClick={() => castVote(prop.id, 'for')}
                        disabled={voting === prop.id}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
                        {voting === prop.id ? '…' : `✓ Vote For`}
                      </button>
                      <button onClick={() => castVote(prop.id, 'against')}
                        disabled={voting === prop.id}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        style={{ background: '#f8717118', color: '#f87171', border: '1px solid #f8717125' }}>
                        {voting === prop.id ? '…' : `✗ Vote Against`}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-white/30 py-2">
                      Vote recorded · {myVotingPower} VP used
                    </div>
                  )}
                </div>
              )
            })}
            <button
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all"
              style={{ background: '#818cf818', color: '#818cf8', border: '1px solid #818cf825' }}>
              + Submit Proposal
            </button>
          </div>
        )}

        {/* Past proposals */}
        {tab === 'past' && (
          <div className="space-y-2">
            {PAST.map(p => {
              const catColor = CAT_COLORS[p.category] ?? '#a855f7'
              const passed = p.result === 'passed'
              return (
                <div key={p.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: passed ? '#22c55e18' : '#f8717118', color: passed ? '#22c55e' : '#f87171' }}>
                    {passed ? '✓' : '✗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 font-semibold leading-snug">{p.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: `${catColor}18`, color: catColor }}>{p.category}</span>
                      <span className="text-xs text-white/25">{p.ts}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold capitalize" style={{ color: passed ? '#22c55e' : '#f87171' }}>{p.result}</div>
                    <div className="text-xs text-white/30">{p.votes.toLocaleString()} votes</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3">
          <button onClick={() => router.push('/tokens')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: '#818cf8', color: '#04040A' }}>
            Get Voting Power ↗
          </button>
          <button onClick={() => router.push('/staking')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
            Staking ⬡
          </button>
        </div>
      </div>
    </div>
  )
}
