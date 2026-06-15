'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, mockUser, mapApiUser, TIER_META } from '@/lib/store'
import { auth } from '@/lib/api'

type ProofStatus = 'verified' | 'pending' | 'unverified'

interface ZKProof {
  id: string
  type: string
  label: string
  description: string
  status: ProofStatus
  mintedAt?: string
  value?: string  // disclosed range/label, never exact
  icon: string
  color: string
  boost: number  // V-Score boost from this proof
}

const PROOF_TYPES: ZKProof[] = [
  {
    id: 'health',
    type: 'health',
    label: 'Health Protocol',
    description: 'Prove your sleep, activity & nutrition rings without revealing raw data',
    status: 'verified',
    mintedAt: '2025-11-14',
    value: 'V-Score 800+, Sleep 85+',
    icon: '◎',
    color: '#4ade80',
    boost: 120,
  },
  {
    id: 'income',
    type: 'income',
    label: 'Income Range',
    description: 'ZK-prove your income bracket without disclosing exact figures',
    status: 'verified',
    mintedAt: '2025-12-02',
    value: '$100K–$250K range',
    icon: '◈',
    color: '#f59e0b',
    boost: 80,
  },
  {
    id: 'location',
    type: 'location',
    label: 'City Verified',
    description: 'Prove you reside in a city without revealing your address',
    status: 'pending',
    value: 'San Francisco, CA',
    icon: '◉',
    color: '#38bdf8',
    boost: 40,
  },
  {
    id: 'identity',
    type: 'identity',
    label: 'Sovereign Identity',
    description: 'Biometric-anchored identity proof — no government ID stored',
    status: 'unverified',
    icon: '◐',
    color: '#818cf8',
    boost: 200,
  },
  {
    id: 'wealth',
    type: 'wealth',
    label: 'Wealth Tier',
    description: 'Prove net worth tier for high-trust connections and investments',
    status: 'unverified',
    icon: '⬡',
    color: '#f472b6',
    boost: 100,
  },
  {
    id: 'education',
    type: 'education',
    label: 'Education',
    description: 'Prove degree/credential without revealing institution or GPA',
    status: 'unverified',
    icon: '◫',
    color: '#a78bfa',
    boost: 60,
  },
]

const PROOF_INFO = {
  verified: { label: 'Verified', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  unverified: { label: 'Not started', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
}

function ProofCard({ proof, onMint }: { proof: ZKProof; onMint: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [minting, setMinting] = useState(false)
  const info = PROOF_INFO[proof.status]

  async function handleMint() {
    setMinting(true)
    await new Promise(r => setTimeout(r, 1400))
    onMint(proof.id)
    setMinting(false)
  }

  return (
    <div className="rounded-2xl border transition-all"
      style={{ background: proof.status === 'verified' ? `${proof.color}06` : 'rgba(255,255,255,0.018)', borderColor: proof.status === 'verified' ? `${proof.color}20` : 'rgba(255,255,255,0.07)' }}>
      <button className="w-full p-4 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: `${proof.color}12`, border: `1.5px solid ${proof.color}25`, color: proof.color }}>
            {proof.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm text-white/85">{proof.label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}`, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                {info.label.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">{proof.description}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs font-mono font-semibold" style={{ color: proof.color }}>+{proof.boost} V</span>
            <span className="text-xs text-white/25 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          {proof.status === 'verified' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-xs text-white/30 mb-1">Proof Type</p>
                  <p className="text-sm font-semibold" style={{ color: proof.color }}>ZK-SNARK</p>
                </div>
                <div className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-xs text-white/30 mb-1">Minted</p>
                  <p className="text-sm font-semibold text-white/70">{proof.mintedAt}</p>
                </div>
              </div>
              {proof.value && (
                <div className="p-3 rounded-xl border" style={{ background: `${proof.color}06`, borderColor: `${proof.color}20` }}>
                  <p className="text-xs text-white/30 mb-1">Disclosed range</p>
                  <p className="text-sm font-semibold" style={{ color: proof.color }}>{proof.value}</p>
                  <p className="text-xs text-white/25 mt-1">Exact value remains private · verified by ZK circuit</p>
                </div>
              )}
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
                  style={{ background: `${proof.color}12`, border: `1px solid ${proof.color}30`, color: proof.color }}>
                  Share Proof →
                </button>
                <button className="px-4 py-2 rounded-xl text-xs text-white/35 border border-white/8 hover:text-white/60 transition-all">
                  Re-mint
                </button>
              </div>
            </div>
          )}

          {proof.status === 'pending' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.06)' }}>
                <p className="text-xs text-amber-400/80 mb-1">⏳ Verification in progress</p>
                <p className="text-xs text-white/40">Your proof is being generated. This usually takes 2–5 minutes.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: '65%', background: 'linear-gradient(90deg, #f59e0b80, #f59e0b)' }} />
                </div>
                <span className="text-xs text-amber-400 font-mono">65%</span>
              </div>
            </div>
          )}

          {proof.status === 'unverified' && (
            <div className="space-y-3">
              <p className="text-xs text-white/40 leading-relaxed">
                Generate a zero-knowledge proof that lets you share this attribute without revealing private data. Takes 2–5 minutes.
              </p>
              <div className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-xs text-white/25 mb-2">What you'll unlock</p>
                <div className="space-y-1.5">
                  {[
                    `+${proof.boost} V-Score boost`,
                    'Badge on profile page',
                    'Higher match compatibility score',
                    'Access to verified-only rooms',
                  ].map(b => (
                    <div key={b} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: proof.color }} />
                      <span className="text-xs text-white/45">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleMint} disabled={minting}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: `${proof.color}18`, border: `1px solid ${proof.color}40`, color: proof.color }}>
                {minting ? '⏳ Generating ZK proof…' : `Mint ${proof.label} Proof`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IdentityPage() {
  const router = useRouter()
  const { user, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [proofs, setProofs] = useState<ZKProof[]>(PROOF_TYPES)

  useEffect(() => {
    setMounted(true)
    if (!user) auth.me().then(me => setUser(mapApiUser(me, mockUser()))).catch(() => setUser(mockUser()))
  }, [])

  if (!mounted) return null
  const u = user || mockUser()

  function mintProof(id: string) {
    setProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'pending' as ProofStatus, mintedAt: new Date().toISOString().slice(0, 10) } : p))
    // Simulate completion after 3s
    setTimeout(() => {
      setProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'verified' as ProofStatus } : p))
    }, 3000)
  }

  const tier = TIER_META[(u as any).tier as keyof typeof TIER_META] ?? TIER_META.seed
  const verified = proofs.filter(p => p.status === 'verified')
  const totalBoost = verified.reduce((s, p) => s + p.boost, 0)
  const identityScore = Math.min(100, Math.round((verified.length / proofs.length) * 100))

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.94)' }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <p className="text-xs text-white/30 tracking-widest">SOVEREIGN IDENTITY</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>ZK Proof Vault</h1>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Identity score card */}
        <div className="p-5 rounded-2xl border" style={{ background: `linear-gradient(135deg, ${tier.color}08, rgba(255,255,255,0.015))`, borderColor: `${tier.color}20` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/35 tracking-wider mb-1">IDENTITY SCORE</p>
              <p className="text-4xl font-bold font-mono" style={{ color: tier.color, letterSpacing: '-0.04em' }}>{identityScore}<span className="text-lg text-white/30">/100</span></p>
              <p className="text-xs text-white/40 mt-1">{verified.length} of {proofs.length} proofs verified</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/30 mb-1">V-Score boost</p>
              <p className="text-2xl font-bold font-mono text-green-400">+{totalBoost}</p>
              <p className="text-xs text-white/25 mt-0.5">from ZK proofs</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${identityScore}%`, background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})` }} />
          </div>

          {/* Proof chips */}
          <div className="flex flex-wrap gap-1.5">
            {proofs.map(p => (
              <div key={p.id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                style={{
                  background: p.status === 'verified' ? `${p.color}12` : 'rgba(255,255,255,0.04)',
                  color: p.status === 'verified' ? p.color : 'rgba(255,255,255,0.25)',
                  border: `1px solid ${p.status === 'verified' ? `${p.color}25` : 'rgba(255,255,255,0.06)'}`,
                }}>
                <span>{p.icon}</span>
                <span className="font-medium">{p.label.split(' ')[0]}</span>
                {p.status === 'verified' && <span className="opacity-60">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div className="p-3 rounded-xl border border-white/5 flex gap-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-base flex-shrink-0">🔒</span>
          <p className="text-xs text-white/40 leading-relaxed">
            All proofs use <strong className="text-white/60">ZK-SNARKs</strong> — you prove attributes without revealing raw data.
            No private information is stored on VIVA servers.
          </p>
        </div>

        {/* Proof cards */}
        <div>
          <p className="text-xs text-white/25 mb-3 tracking-widest">YOUR PROOF VAULT</p>
          <div className="space-y-2.5">
            {proofs.map(proof => (
              <ProofCard key={proof.id} proof={proof} onMint={mintProof} />
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <p className="text-xs text-white/35 mb-3 tracking-wider">HOW ZK PROOFS WORK</p>
          <div className="space-y-3">
            {[
              { step: '1', title: 'You provide data locally', desc: 'Raw data never leaves your device' },
              { step: '2', title: 'ZK circuit generates proof', desc: 'A cryptographic proof that the statement is true' },
              { step: '3', title: 'Proof anchored on-chain', desc: 'Verifiable by anyone, reveals nothing extra' },
              { step: '4', title: 'Share selectively', desc: 'Choose what to disclose and to whom' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--v)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/75">{s.title}</p>
                  <p className="text-xs text-white/35 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
