'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKENS: Record<string, { name: string; color: string; heldQty: number }> = {
  SVRN: { name:'Sovereign V', color:'#a855f7', heldQty:50  },
  MAYA: { name:'Maya Chen',   color:'#22c55e', heldQty:80  },
  JAX:  { name:'Jax Beats',  color:'#ec4899', heldQty:25  },
}

interface GovProposal {
  id: string
  title: string
  status: 'active' | 'passed' | 'rejected'
  votesFor: number
  votesAgainst: number
  endDate: string
  myVote?: 'for' | 'against' | 'abstain'
}

const GOV_PROPOSALS: Record<string, GovProposal[]> = {
  SVRN: [
    { id:'g1', title:'Increase creator royalty from 2% to 3%',       status:'active',   votesFor:82000, votesAgainst:18000, endDate:'Jun 22', myVote:undefined },
    { id:'g2', title:'Add tip leaderboard to profile pages',          status:'passed',   votesFor:124000, votesAgainst:6000, endDate:'Jun 10', myVote:'for'    },
    { id:'g3', title:'Reduce min stake from 10 to 5 tokens',          status:'active',   votesFor:44000, votesAgainst:56000, endDate:'Jun 25', myVote:undefined },
    { id:'g4', title:'Launch $SVRN NFT collection for Diamond tier',  status:'rejected', votesFor:28000, votesAgainst:72000, endDate:'Jun 01', myVote:'against'},
  ],
}

const STATUS_COLOR: Record<string, string> = { active:'#22c55e', passed:'#818cf8', rejected:'#f87171' }

export default function TokenGovernancePage() {
  const router = useRouter()
  const params = useParams()
  const symbol  = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const token   = TOKENS[symbol] ?? TOKENS.SVRN
  const allProps = GOV_PROPOSALS[symbol] ?? GOV_PROPOSALS.SVRN

  const [myVotes, setMyVotes] = useState<Record<string, 'for'|'against'|'abstain'>>({})
  const [voting,  setVoting ] = useState<string | null>(null)

  async function vote(propId: string, choice: 'for'|'against'|'abstain') {
    setVoting(propId)
    await new Promise(r => setTimeout(r, 800))
    setMyVotes(prev => ({ ...prev, [propId]: choice }))
    setVoting(null)
  }

  const voted = allProps.filter(p => myVotes[p.id] || p.myVote).length
  const active = allProps.filter(p => p.status === 'active').length

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
          <div className="flex-1">
            <div className="font-black text-white">${symbol} Governance</div>
            <div className="text-xs text-white/30">{token.name} · {token.heldQty} votes</div>
          </div>
          <button onClick={() => router.push('/dao')}
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: `${token.color}15`, color: token.color }}>
            DAO
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Voting power */}
        <div className="p-4 rounded-2xl border"
          style={{ background: `${token.color}06`, borderColor: `${token.color}18` }}>
          <div className="text-xs text-white/30 mb-1">Your voting power</div>
          <div className="text-3xl font-black" style={{ color: token.color }}>{token.heldQty}</div>
          <div className="text-xs text-white/25">1 ${symbol} = 1 vote · {voted}/{allProps.length} proposals voted</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Active',   value:active,             color:'#22c55e' },
            { label:'Voted',    value:voted,              color:token.color },
            { label:'Passed',   value:allProps.filter(p=>p.status==='passed').length, color:'#818cf8' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Proposals */}
        <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Proposals</div>
        <div className="space-y-3">
          {allProps.map(p => {
            const total  = p.votesFor + p.votesAgainst
            const forPct = total > 0 ? (p.votesFor / total) * 100 : 50
            const cast   = myVotes[p.id] || p.myVote
            return (
              <div key={p.id} className="p-4 rounded-2xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white/80 leading-tight mb-1">{p.title}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold" style={{ color: STATUS_COLOR[p.status] }}>● {p.status}</span>
                      {p.status === 'active' && <span className="text-white/25">Ends {p.endDate}</span>}
                    </div>
                  </div>
                </div>

                {/* Vote bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden mb-2">
                  <div style={{ width: `${forPct}%`, background: '#22c55e' }} />
                  <div style={{ width: `${100 - forPct}%`, background: '#f87171' }} />
                </div>
                <div className="flex justify-between text-xs text-white/25 mb-3">
                  <span style={{ color:'#22c55e' }}>For {forPct.toFixed(0)}%</span>
                  <span style={{ color:'#f87171' }}>Against {(100-forPct).toFixed(0)}%</span>
                </div>

                {/* Vote buttons or result */}
                {cast ? (
                  <div className="text-center text-xs font-bold" style={{ color: cast === 'for' ? '#22c55e' : cast === 'against' ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                    ✓ You voted {cast}
                  </div>
                ) : p.status === 'active' ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['for','against','abstain'] as const).map(v => (
                      <button key={v} onClick={() => vote(p.id, v)} disabled={!!voting}
                        className="py-1.5 rounded-xl text-xs font-black disabled:opacity-40"
                        style={{ background: v === 'for' ? 'rgba(34,197,94,0.12)' : v === 'against' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.06)',
                          color: v === 'for' ? '#22c55e' : v === 'against' ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                        {voting === p.id ? '…' : v === 'for' ? '✓ For' : v === 'against' ? '✗ Vs' : '− Skip'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-white/20">Voting ended</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
