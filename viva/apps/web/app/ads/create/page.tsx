'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'objective' | 'audience' | 'creative' | 'budget' | 'review'

const OBJECTIVES = [
  { key: 'awareness',    emoji: '👁',  title: 'Awareness',      desc: 'Maximize impressions and reach across the platform' },
  { key: 'followers',    emoji: '👤', title: 'Followers',      desc: 'Grow your follower base with targeted exposure' },
  { key: 'token_buyers', emoji: '💎', title: 'Token Buyers',   desc: 'Drive token purchases from qualified investors' },
  { key: 'conversions',  emoji: '⚡', title: 'Conversions',    desc: 'Get users to take a specific action (buy, sign up, tip)' },
]

const AUDIENCE_SEGMENTS = [
  { key: 'defi',      label: 'DeFi enthusiasts' },
  { key: 'traders',   label: 'Active traders' },
  { key: 'fitness',   label: 'Fitness & wellness' },
  { key: 'music',     label: 'Music fans' },
  { key: 'investors', label: 'Token investors' },
  { key: 'new_users', label: 'New users' },
]

const PLACEMENTS = [
  { key: 'feed',    label: 'Feed',        emoji: '📱' },
  { key: 'profile', label: 'Profiles',    emoji: '👤' },
  { key: 'tokens',  label: 'Token pages', emoji: '💎' },
  { key: 'search',  label: 'Search',      emoji: '🔍' },
]

const BUDGET_PRESETS = [100, 250, 500, 1000, 2500, 5000]
const DURATION_PRESETS = [3, 7, 14, 30]

const STEPS: Step[] = ['objective', 'audience', 'creative', 'budget', 'review']
const STEP_LABELS: Record<Step, string> = {
  objective: 'Objective', audience: 'Audience', creative: 'Creative', budget: 'Budget', review: 'Review'
}

export default function AdsCreatePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('objective')
  const [objective, setObjective] = useState('')
  const [segments, setSegments] = useState<string[]>([])
  const [placements, setPlacements] = useState<string[]>(['feed'])
  const [headline, setHeadline] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [ctaText, setCtaText] = useState('Learn More')
  const [budget, setBudget] = useState(500)
  const [duration, setDuration] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const stepIdx = STEPS.indexOf(step)
  const progress = ((stepIdx + 1) / STEPS.length) * 100

  function toggleSegment(k: string) {
    setSegments(prev => prev.includes(k) ? prev.filter(s => s !== k) : [...prev, k])
  }
  function togglePlacement(k: string) {
    setPlacements(prev => prev.includes(k) ? prev.filter(p => p !== k) : [...prev, k])
  }

  function next() {
    const s = STEPS[stepIdx + 1]
    if (s) setStep(s)
  }
  function back() {
    const s = STEPS[stepIdx - 1]
    if (s) setStep(s)
  }

  async function submit() {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1400))
    setSubmitting(false)
    setSubmitted(true)
  }

  const dailyBudget = (budget / duration).toFixed(0)
  const estImpressions = Math.round(budget * 55)
  const canNext = step === 'objective' ? !!objective
    : step === 'audience' ? segments.length > 0
    : step === 'creative' ? headline.length > 0 && bodyText.length > 0
    : true

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--ink)' }}>
      <div className="text-5xl mb-4">🚀</div>
      <div className="font-black text-2xl text-white mb-2">Ad Submitted!</div>
      <div className="text-sm text-white/40 mb-6">Your campaign is under review. Estimated approval within 2 hours.</div>
      <div className="p-4 rounded-2xl border border-white/5 w-full mb-6 text-left space-y-2"
        style={{ background: 'rgba(255,255,255,0.018)' }}>
        {[
          { l: 'Objective', v: OBJECTIVES.find(o => o.key === objective)?.title ?? objective },
          { l: 'Budget',    v: `$${budget} over ${duration} days` },
          { l: 'Est. reach', v: `${(estImpressions/1000).toFixed(0)}k impressions` },
        ].map(r => (
          <div key={r.l} className="flex justify-between text-sm">
            <span className="text-white/30">{r.l}</span>
            <span className="font-bold text-white/70">{r.v}</span>
          </div>
        ))}
      </div>
      <button onClick={() => router.push('/ads/ad1/analytics')}
        className="w-full py-3.5 rounded-xl font-black text-sm mb-2"
        style={{ background: '#a855f7', color: '#04040A' }}>
        View Analytics →
      </button>
      <button onClick={() => router.push('/feed')}
        className="text-sm text-white/30">Back to feed</button>
    </div>
  )

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => stepIdx === 0 ? router.back() : back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Create Ad</div>
            <div className="text-xs text-white/30">Step {stepIdx+1} of {STEPS.length} — {STEP_LABELS[step]}</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: '#a855f7' }} />
        </div>
      </header>

      <div className="px-4 py-4">
        {step === 'objective' && (
          <div className="space-y-3">
            <div className="text-sm font-black text-white/60 mb-4">What's your campaign goal?</div>
            {OBJECTIVES.map(o => (
              <button key={o.key} onClick={() => setObjective(o.key)}
                className="w-full flex items-start gap-3 p-4 rounded-2xl border text-left"
                style={objective === o.key
                  ? { background: 'rgba(168,85,247,0.1)', borderColor: '#a855f7' }
                  : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-2xl flex-shrink-0">{o.emoji}</span>
                <div>
                  <div className="font-black text-sm text-white/85">{o.title}</div>
                  <div className="text-xs text-white/35 mt-0.5">{o.desc}</div>
                </div>
                {objective === o.key && <span className="ml-auto text-purple-400">✓</span>}
              </button>
            ))}
          </div>
        )}

        {step === 'audience' && (
          <div className="space-y-4">
            <div className="text-sm font-black text-white/60 mb-2">Who should see your ad?</div>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_SEGMENTS.map(s => (
                <button key={s.key} onClick={() => toggleSegment(s.key)}
                  className="py-3 px-4 rounded-xl border text-left text-sm font-bold"
                  style={segments.includes(s.key)
                    ? { background: 'rgba(168,85,247,0.1)', borderColor: '#a855f7', color: '#d8b4fe' }
                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="text-sm font-black text-white/60 mt-2 mb-2">Placements</div>
            <div className="grid grid-cols-2 gap-2">
              {PLACEMENTS.map(p => (
                <button key={p.key} onClick={() => togglePlacement(p.key)}
                  className="py-3 px-4 rounded-xl border text-left flex items-center gap-2 font-bold text-sm"
                  style={placements.includes(p.key)
                    ? { background: 'rgba(168,85,247,0.1)', borderColor: '#a855f7', color: '#d8b4fe' }
                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                  <span>{p.emoji}</span>{p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'creative' && (
          <div className="space-y-4">
            <div className="text-sm font-black text-white/60 mb-2">Write your ad creative</div>
            <div>
              <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Headline</label>
              <input value={headline} onChange={e => setHeadline(e.target.value.slice(0, 60))}
                placeholder="Grab their attention…"
                className="mt-1 w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
              <div className="text-xs text-white/20 text-right mt-1">{headline.length}/60</div>
            </div>
            <div>
              <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Body</label>
              <textarea value={bodyText} onChange={e => setBodyText(e.target.value.slice(0, 200))}
                placeholder="Tell them why they should care…"
                rows={4}
                className="mt-1 w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none resize-none" />
              <div className="text-xs text-white/20 text-right mt-1">{bodyText.length}/200</div>
            </div>
            <div>
              <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">CTA Text</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {['Learn More', 'Buy Token', 'Follow', 'Join Now', 'View Drop'].map(cta => (
                  <button key={cta} onClick={() => setCtaText(cta)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={ctaText === cta ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    {cta}
                  </button>
                ))}
              </div>
            </div>
            {/* Preview */}
            {headline && (
              <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="text-xs text-white/25 mb-2 uppercase tracking-wider font-semibold">Preview</div>
                <div className="font-black text-sm text-white/85">{headline}</div>
                <div className="text-xs text-white/45 mt-1">{bodyText}</div>
                <div className="mt-3 px-4 py-2 rounded-xl font-black text-xs inline-block"
                  style={{ background: '#a855f7', color: '#04040A' }}>{ctaText}</div>
              </div>
            )}
          </div>
        )}

        {step === 'budget' && (
          <div className="space-y-4">
            <div className="text-sm font-black text-white/60 mb-2">Set your budget</div>
            <div>
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Total Budget (USDC)</div>
              <div className="flex flex-wrap gap-2">
                {BUDGET_PRESETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)}
                    className="px-4 py-2 rounded-xl font-bold text-sm"
                    style={budget === b ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    ${b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Duration</div>
              <div className="flex gap-2">
                {DURATION_PRESETS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className="flex-1 py-2 rounded-xl font-bold text-sm"
                    style={duration === d ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
              {[
                { l: 'Daily budget',      v: `$${dailyBudget} USDC` },
                { l: 'Est. impressions',  v: `${(estImpressions/1000).toFixed(0)}k–${(estImpressions*1.3/1000).toFixed(0)}k` },
                { l: 'Est. clicks',       v: `${Math.round(estImpressions * 0.03).toLocaleString()}–${Math.round(estImpressions * 0.05).toLocaleString()}` },
              ].map(r => (
                <div key={r.l} className="flex justify-between text-sm">
                  <span className="text-white/30">{r.l}</span>
                  <span className="font-bold text-white/65">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-3">
            <div className="text-sm font-black text-white/60 mb-2">Review your campaign</div>
            {[
              { label: 'Objective',  value: OBJECTIVES.find(o => o.key === objective)?.title ?? '-' },
              { label: 'Audience',   value: segments.map(s => AUDIENCE_SEGMENTS.find(x => x.key === s)?.label).join(', ') || '-' },
              { label: 'Placements', value: placements.map(p => PLACEMENTS.find(x => x.key === p)?.label).join(', ') || '-' },
              { label: 'Headline',   value: headline || '-' },
              { label: 'CTA',        value: ctaText },
              { label: 'Budget',     value: `$${budget} USDC` },
              { label: 'Duration',   value: `${duration} days` },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start p-3 rounded-xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <span className="text-xs text-white/30 font-semibold uppercase tracking-wider">{r.label}</span>
                <span className="text-xs font-bold text-white/65 text-right max-w-[60%]">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={step === 'review' ? submit : next}
          disabled={!canNext || submitting}
          className="w-full py-3.5 rounded-xl font-black text-sm disabled:opacity-30"
          style={{ background: '#a855f7', color: '#04040A' }}>
          {submitting ? 'Launching…' : step === 'review' ? 'Launch Campaign 🚀' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
