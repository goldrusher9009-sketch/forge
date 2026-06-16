'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PURPOSES = [
  { id: 'investment', icon: '📈', label: 'Investment Club', desc: 'Pool funds, vote on trades' },
  { id: 'creator',    icon: '🎨', label: 'Creator Collective', desc: 'Govern a shared creative brand' },
  { id: 'community',  icon: '👥', label: 'Community Treasury', desc: 'Fund community initiatives' },
  { id: 'protocol',   icon: '⚙️', label: 'Protocol DAO', desc: 'Govern a DeFi protocol' },
]

const PROPOSAL_TYPES = [
  { id: 'text',     label: 'Text proposals' },
  { id: 'transfer', label: 'Fund transfers' },
  { id: 'token',    label: 'Token actions' },
  { id: 'member',   label: 'Membership changes' },
  { id: 'custom',   label: 'Custom contracts' },
]

const VOTING_PERIODS = ['24h', '48h', '72h', '7 days']

export default function DaoCreatePage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [description, setDescription] = useState('')
  const [govToken, setGovToken] = useState('')
  const [quorum, setQuorum] = useState('20')
  const [threshold, setThreshold] = useState('51')
  const [votingPeriod, setVotingPeriod] = useState('48h')
  const [proposalTypes, setProposalTypes] = useState<string[]>(['text', 'transfer'])
  const [treasuryWallet, setTreasuryWallet] = useState('')
  const [minTokensPropose, setMinTokensPropose] = useState('100')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)

  function toggleProposalType(id: string) {
    setProposalTypes(pt => pt.includes(id) ? pt.filter(x => x !== id) : [...pt, id])
  }

  async function create() {
    setCreating(true)
    await new Promise(r => setTimeout(r, 1800))
    setCreating(false)
    setCreated(true)
  }

  const canStep1 = name.trim() && purpose
  const canStep2 = govToken.trim()
  const canCreate = canStep1 && canStep2

  if (created) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.1)', border: '2px solid rgba(168,85,247,0.3)' }}>
            <span className="text-3xl">🏛️</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white mb-1">DAO Created!</div>
            <div className="text-white/40 text-sm">"{name}" is live. Invite members to join.</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 text-left space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
            {[
              { label: 'Purpose', value: PURPOSES.find(p => p.id === purpose)?.label ?? purpose },
              { label: 'Gov Token', value: `$${govToken.toUpperCase()}` },
              { label: 'Quorum',    value: `${quorum}%` },
              { label: 'Threshold', value: `${threshold}%` },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-white/35">{r.label}</span>
                <span className="text-white/70 font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push('/dao')}
              className="w-full py-3.5 rounded-xl font-black" style={{ background: '#a855f7', color: '#04040A' }}>
              View All DAOs
            </button>
            <button onClick={() => router.push('/tokens')}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              Token Marketplace
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step > 1 ? setStep(s => (s - 1) as 1|2|3) : router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white flex-1">Create DAO</div>
          <span className="text-xs text-white/25">Step {step} of 3</span>
        </div>
        {/* Progress */}
        <div className="flex gap-1">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: n <= step ? '#a855f7' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Step 1: Basics */}
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <div className="text-sm font-black text-white/70 mb-4">Basics</div>
              <Field label="DAO Name *">
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alpha Syndicate"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
              </Field>
            </div>

            <Field label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="What is this DAO for?" rows={3}
                className="w-full px-4 py-3 rounded-2xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none resize-none" />
            </Field>

            <div className="space-y-2">
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Purpose *</div>
              {PURPOSES.map(p => (
                <button key={p.id} onClick={() => setPurpose(p.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
                  style={purpose === p.id
                    ? { background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)' }
                    : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white/80">{p.label}</div>
                    <div className="text-xs text-white/30">{p.desc}</div>
                  </div>
                  {purpose === p.id && <span style={{ color: '#a855f7' }}>✓</span>}
                </button>
              ))}
            </div>

            <button onClick={() => setStep(2)} disabled={!canStep1}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Next: Governance →
            </button>
          </>
        )}

        {/* Step 2: Governance */}
        {step === 2 && (
          <>
            <div className="text-sm font-black text-white/70 mb-1">Governance</div>

            <Field label="Governance Token Symbol *">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/6 bg-white/5">
                <span className="text-white/30">$</span>
                <input value={govToken} onChange={e => setGovToken(e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="SVRN"
                  className="flex-1 text-white bg-transparent outline-none text-sm font-bold" />
              </div>
              <div className="text-xs text-white/20 px-1">Token holders vote on proposals</div>
            </Field>

            <Field label="Min Tokens to Propose">
              <input value={minTokensPropose} onChange={e => setMinTokensPropose(e.target.value.replace(/\D/g,''))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white outline-none" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Quorum (${quorum}%)`}>
                <input type="range" min={5} max={80} value={quorum} onChange={e => setQuorum(e.target.value)}
                  className="w-full accent-purple-500" />
              </Field>
              <Field label={`Pass Threshold (${threshold}%)`}>
                <input type="range" min={51} max={90} value={threshold} onChange={e => setThreshold(e.target.value)}
                  className="w-full accent-purple-500" />
              </Field>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Voting Period</div>
              <div className="flex gap-2">
                {VOTING_PERIODS.map(v => (
                  <button key={v} onClick={() => setVotingPeriod(v)}
                    className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                    style={votingPeriod === v ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Proposal Types</div>
              <div className="flex flex-wrap gap-2">
                {PROPOSAL_TYPES.map(pt => (
                  <button key={pt.id} onClick={() => toggleProposalType(pt.id)}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={proposalTypes.includes(pt.id)
                      ? { background: '#a855f7', color: '#04040A' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(3)} disabled={!canStep2}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Next: Treasury →
            </button>
          </>
        )}

        {/* Step 3: Treasury + review */}
        {step === 3 && (
          <>
            <div className="text-sm font-black text-white/70 mb-1">Treasury & Review</div>

            <Field label="Treasury Wallet (optional)">
              <input value={treasuryWallet} onChange={e => setTreasuryWallet(e.target.value)}
                placeholder="0x... or leave blank to auto-generate"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none font-mono" />
            </Field>

            {/* Summary */}
            <div className="p-4 rounded-2xl border border-white/6 space-y-2.5"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Summary</div>
              {[
                { label: 'Name',       value: name },
                { label: 'Purpose',    value: PURPOSES.find(p => p.id === purpose)?.label ?? purpose },
                { label: 'Gov Token',  value: `$${govToken}` },
                { label: 'Quorum',     value: `${quorum}%` },
                { label: 'Threshold',  value: `${threshold}%` },
                { label: 'Vote Period', value: votingPeriod },
                { label: 'Min to Propose', value: `${minTokensPropose} $${govToken}` },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-white/35">{r.label}</span>
                  <span className="text-white/70 font-semibold truncate max-w-[180px]">{r.value}</span>
                </div>
              ))}
            </div>

            <button onClick={create} disabled={!canCreate || creating}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              {creating ? 'Creating DAO…' : '🏛️ Launch DAO'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
