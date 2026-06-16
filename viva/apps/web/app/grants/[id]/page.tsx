'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Grant {
  id: string
  title: string
  description: string
  icon: string
  color: string
  category: string
  amount: number
  currency: '$VIVA' | 'USD'
  deadline: string
  applicants: number
  slots: number
  requirements: string[]
  deliverables: string[]
  sponsorHandle: string
  sponsorName: string
  sponsorColor: string
  tags: string[]
}

const GRANTS: Record<string, Grant> = {
  gr1: {
    id: 'gr1',
    title: 'Creator Growth Fund — Q3 2026',
    description: 'VIVA is funding 20 creators with $5,000 each to accelerate their content business. Winners receive funding + 3 months of mentorship from top-performing VIVA creators.',
    icon: '🚀',
    color: '#a855f7',
    category: 'Creator Growth',
    amount: 5000,
    currency: 'USD',
    deadline: '2026-07-15',
    applicants: 842,
    slots: 20,
    requirements: [
      'At least 500 followers on VIVA',
      'Minimum 30 posts published',
      'Active for at least 3 months',
      'Token launched (any tier)',
    ],
    deliverables: [
      'Monthly progress report',
      '4 pieces of long-form content per month',
      'Participate in 2 community events',
      'Final impact report at end of grant',
    ],
    sponsorHandle: 'vivaplatform',
    sponsorName: 'VIVA Platform',
    sponsorColor: '#a855f7',
    tags: ['creator', 'growth', 'funding', 'mentorship'],
  },
  gr2: {
    id: 'gr2',
    title: 'DeFi Research Fellowship',
    description: 'Funding 5 researchers to produce high-quality DeFi analysis content. Ideal for analysts who want to build a reputation publishing institutional-grade research on VIVA.',
    icon: '🔬',
    color: '#22c55e',
    category: 'Research',
    amount: 10000,
    currency: '$VIVA',
    deadline: '2026-06-30',
    applicants: 189,
    slots: 5,
    requirements: [
      'Published at least 10 DeFi research posts',
      'Minimum 1k followers',
      'Demonstrated analytical background',
    ],
    deliverables: [
      '2 deep-dive research reports per month',
      'Weekly market commentary thread',
      'Collaboration with VIVA data team',
    ],
    sponsorHandle: 'sovereign_v',
    sponsorName: 'Sovereign V',
    sponsorColor: '#a855f7',
    tags: ['defi', 'research', 'fellowship', 'finance'],
  },
}

function daysLeft(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000))
}

export default function GrantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'gr1'
  const grant = GRANTS[id] ?? GRANTS.gr1

  const [step, setStep] = useState<'view' | 'apply' | 'submitted'>('view')
  const [pitch, setPitch] = useState('')
  const [links, setLinks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const days = daysLeft(grant.deadline)
  const spotsLeft = grant.slots - Math.floor(grant.applicants / (grant.slots * 5))

  async function submit() {
    if (!pitch.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setSubmitting(false)
    setStep('submitted')
  }

  if (step === 'submitted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-5xl">🎉</div>
          <div>
            <div className="text-2xl font-black text-white">Application Submitted!</div>
            <div className="text-sm text-white/40 mt-1">We'll notify you by {new Date(grant.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 text-left space-y-2"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/35">Grant</span>
              <span className="text-white/70 font-semibold truncate max-w-[180px]">{grant.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/35">Amount</span>
              <span className="font-black" style={{ color: '#22c55e' }}>{grant.amount.toLocaleString()} {grant.currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/35">Decision by</span>
              <span className="text-white/70">{new Date(grant.deadline).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={() => router.push('/grants')}
            className="w-full py-3.5 rounded-xl font-black"
            style={{ background: grant.color, color: '#04040A' }}>
            View All Grants
          </button>
        </div>
      </div>
    )
  }

  if (step === 'apply') {
    return (
      <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
        <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
          style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('view')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="font-black text-white">Apply for Grant</div>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
          <div className="p-3 rounded-xl border border-white/5 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <span className="text-xl">{grant.icon}</span>
            <div>
              <div className="font-bold text-sm text-white/80">{grant.title}</div>
              <div className="font-black text-sm" style={{ color: '#22c55e' }}>{grant.amount.toLocaleString()} {grant.currency}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Your Pitch *</label>
            <textarea value={pitch} onChange={e => setPitch(e.target.value)}
              placeholder="Describe what you'll do with this grant. What will you create? How will you use the funds? What impact do you expect?"
              rows={6}
              className="w-full px-4 py-3 rounded-2xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none resize-none" />
            <div className="text-xs text-white/20 text-right">{pitch.length}/1000</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Portfolio Links (optional)</label>
            <input value={links} onChange={e => setLinks(e.target.value)}
              placeholder="Links to your best work..."
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
          </div>

          <button onClick={submit} disabled={!pitch.trim() || submitting}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
            style={{ background: grant.color, color: '#04040A' }}>
            {submitting ? 'Submitting…' : '📨 Submit Application'}
          </button>
        </div>
      </div>
    )
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
          <div className="font-black text-white flex-1 truncate">{grant.title}</div>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${grant.color}12`, color: grant.color }}>
            {grant.category}
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Hero */}
        <div className="text-5xl">{grant.icon}</div>
        <div>
          <div className="text-2xl font-black text-white mb-1">{grant.title}</div>
          <p className="text-sm text-white/50 leading-relaxed">{grant.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Award',     value: `${grant.amount.toLocaleString()} ${grant.currency}`, color: '#22c55e' },
            { label: 'Days Left', value: `${days}d`, color: days <= 5 ? '#f87171' : 'white' },
            { label: 'Slots',     value: `${grant.slots} total`, color: 'white' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/25 mb-0.5">{s.label}</div>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Applicants progress */}
        <div className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex justify-between text-xs text-white/30 mb-1.5">
            <span>{grant.applicants} applicants</span>
            <span>{grant.slots} winners selected</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (grant.applicants / 1000) * 100)}%`, background: grant.color }} />
          </div>
        </div>

        {/* Sponsor */}
        <button onClick={() => router.push(`/profile/${grant.sponsorHandle}`)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 text-left"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
            style={{ background: `${grant.sponsorColor}18`, color: grant.sponsorColor }}>
            {grant.sponsorName[0]}
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-white/80">{grant.sponsorName}</div>
            <div className="text-xs text-white/25">Sponsor · @{grant.sponsorHandle}</div>
          </div>
        </button>

        {/* Requirements */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Requirements</div>
          {grant.requirements.map((r, i) => (
            <div key={i} className="flex gap-2.5 text-sm text-white/55">
              <span className="text-white/20 flex-shrink-0">•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>

        {/* Deliverables */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Deliverables</div>
          {grant.deliverables.map((d, i) => (
            <div key={i} className="flex gap-2.5 text-sm text-white/55">
              <span style={{ color: grant.color }}>✓</span>
              <span>{d}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {grant.tags.map(t => (
            <span key={t} className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              #{t}
            </span>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => setStep('apply')}
          className="w-full py-4 rounded-2xl font-black text-lg"
          style={{ background: grant.color, color: '#04040A' }}>
          Apply for Grant ({grant.amount.toLocaleString()} {grant.currency})
        </button>
        {spotsLeft > 0 && (
          <div className="text-center text-xs text-white/20 mt-1.5">{spotsLeft} spots remaining · {grant.applicants} applied</div>
        )}
      </div>
    </div>
  )
}
