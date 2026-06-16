'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type AdObjective = 'awareness' | 'followers' | 'token_buys' | 'content_views'
type AdPlacement = 'feed' | 'profile' | 'search' | 'rooms'
type AdFormat    = 'banner' | 'card' | 'story' | 'sponsored_post'

interface AdForm {
  title: string
  objective: AdObjective
  budget: string
  duration: string
  placement: AdPlacement[]
  format: AdFormat
  targetMinVscore: string
  targetTokenHolders: boolean
  targetNewUsers: boolean
  headline: string
  cta: string
}

const OBJECTIVES: { key: AdObjective; label: string; icon: string; desc: string }[] = [
  { key:'awareness',     label:'Brand Awareness',   icon:'📢', desc:'Maximize impressions and reach'     },
  { key:'followers',     label:'Gain Followers',     icon:'👥', desc:'Grow your audience fast'            },
  { key:'token_buys',    label:'Token Sales',        icon:'💎', desc:'Drive $TOKEN purchases'             },
  { key:'content_views', label:'Content Views',      icon:'👁', desc:'Get eyes on your posts'            },
]

const FORMATS: { key: AdFormat; label: string; size: string }[] = [
  { key:'banner',         label:'Banner',           size:'728×90' },
  { key:'card',           label:'Card Ad',           size:'400×300' },
  { key:'story',          label:'Story',             size:'360×640' },
  { key:'sponsored_post', label:'Sponsored Post',    size:'Native' },
]

const PLACEMENTS: { key: AdPlacement; label: string; icon: string }[] = [
  { key:'feed',    label:'Feed',    icon:'📰' },
  { key:'profile', label:'Profile', icon:'👤' },
  { key:'search',  label:'Search',  icon:'🔍' },
  { key:'rooms',   label:'Rooms',   icon:'🎙' },
]

const CPM_RATES: Record<AdPlacement, number> = { feed:4.50, profile:3.80, search:6.20, rooms:5.10 }

export default function CreateAdPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted ] = useState(false)

  const [form, setForm] = useState<AdForm>({
    title:'', objective:'awareness', budget:'100', duration:'7',
    placement:['feed'], format:'card',
    targetMinVscore:'', targetTokenHolders:false, targetNewUsers:false,
    headline:'', cta:'Learn More',
  })

  function togglePlacement(p: AdPlacement) {
    setForm(f => ({
      ...f,
      placement: f.placement.includes(p) ? f.placement.filter(x => x !== p) : [...f.placement, p]
    }))
  }

  const budget   = parseFloat(form.budget) || 0
  const duration = parseInt(form.duration) || 7
  const avgCPM   = form.placement.reduce((s, p) => s + CPM_RATES[p], 0) / (form.placement.length || 1)
  const estImpressions = Math.round((budget / avgCPM) * 1000)
  const estReach       = Math.round(estImpressions * 0.72)

  async function submit() {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--ink)' }}>
      <div className="text-5xl mb-4">🚀</div>
      <div className="font-black text-xl text-white mb-2">Campaign Created!</div>
      <div className="text-sm text-white/40 mb-6">Your ad is under review. Goes live within 2 hours.</div>
      <div className="space-y-2 w-full max-w-xs">
        <button onClick={() => router.push('/ads')}
          className="w-full py-3 rounded-2xl font-black text-sm"
          style={{ background: '#a855f7', color: '#04040A' }}>
          View Campaign
        </button>
        <button onClick={() => { setSubmitted(false); setStep(1) }}
          className="w-full py-3 rounded-2xl font-black text-sm"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
          Create Another
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep(s => s-1) : router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Create Ad</div>
            <div className="text-xs text-white/30">Step {step} of 3</div>
          </div>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5 mt-3">
          {[1,2,3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full"
              style={{ background: s <= step ? '#a855f7' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </header>

      <div className="px-4 py-6 space-y-5">
        {/* Step 1 — Objective & Format */}
        {step === 1 && <>
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Campaign Name</div>
            <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))}
              placeholder="e.g. June DeFi Push"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/6 text-sm text-white placeholder-white/20 outline-none" />
          </div>

          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Objective</div>
            <div className="space-y-2">
              {OBJECTIVES.map(o => (
                <button key={o.key} onClick={() => setForm(f => ({...f, objective:o.key}))}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left"
                  style={form.objective === o.key
                    ? { background: 'rgba(168,85,247,0.08)', borderColor: '#a855f720' }
                    : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-xl">{o.icon}</span>
                  <div>
                    <div className="font-bold text-sm text-white/85">{o.label}</div>
                    <div className="text-xs text-white/30">{o.desc}</div>
                  </div>
                  {form.objective === o.key && <span className="ml-auto text-xs" style={{ color:'#a855f7' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Ad Format</div>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(f => (
                <button key={f.key} onClick={() => setForm(fm => ({...fm, format:f.key}))}
                  className="p-3 rounded-xl border text-left"
                  style={form.format === f.key
                    ? { background: 'rgba(168,85,247,0.08)', borderColor: '#a855f720' }
                    : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="font-bold text-xs text-white/80">{f.label}</div>
                  <div className="text-xs text-white/25">{f.size}</div>
                </button>
              ))}
            </div>
          </div>
        </>}

        {/* Step 2 — Budget & Placement */}
        {step === 2 && <>
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Budget (USDC)</div>
            <div className="flex gap-2 mb-2">
              {['50','100','250','500'].map(b => (
                <button key={b} onClick={() => setForm(f => ({...f, budget:b}))}
                  className="flex-1 py-2 rounded-xl text-xs font-black"
                  style={form.budget === b ? { background:'#a855f7', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
                  ${b}
                </button>
              ))}
            </div>
            <input type="number" value={form.budget} onChange={e => setForm(f => ({...f, budget:e.target.value}))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/6 text-sm text-white outline-none" />
          </div>

          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Duration (days)</div>
            <div className="flex gap-2">
              {['3','7','14','30'].map(d => (
                <button key={d} onClick={() => setForm(f => ({...f, duration:d}))}
                  className="flex-1 py-2 rounded-xl text-xs font-black"
                  style={form.duration === d ? { background:'#a855f7', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Placement</div>
            <div className="grid grid-cols-2 gap-2">
              {PLACEMENTS.map(p => (
                <button key={p.key} onClick={() => togglePlacement(p.key)}
                  className="flex items-center gap-2 p-3 rounded-xl border"
                  style={form.placement.includes(p.key)
                    ? { background: 'rgba(168,85,247,0.08)', borderColor: '#a855f720' }
                    : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.04)' }}>
                  <span>{p.icon}</span>
                  <span className="text-xs font-bold text-white/70">{p.label}</span>
                  <span className="ml-auto text-xs text-white/25">${CPM_RATES[p.key]}/CPM</span>
                </button>
              ))}
            </div>
          </div>

          {/* Estimate */}
          {budget > 0 && (
            <div className="p-3 rounded-xl border border-white/4" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Estimate</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-white/25">Impressions</div><div className="font-black text-white/60">{estImpressions.toLocaleString()}</div></div>
                <div><div className="text-white/25">Reach</div><div className="font-black text-white/60">{estReach.toLocaleString()}</div></div>
              </div>
            </div>
          )}
        </>}

        {/* Step 3 — Creative */}
        {step === 3 && <>
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Ad Headline</div>
            <input value={form.headline} onChange={e => setForm(f => ({...f, headline:e.target.value}))}
              placeholder="e.g. Get exclusive DeFi signals"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/6 text-sm text-white placeholder-white/20 outline-none" />
          </div>
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Call to Action</div>
            <div className="flex gap-2 flex-wrap">
              {['Learn More','Follow','Buy Token','View Post','Join Room'].map(c => (
                <button key={c} onClick={() => setForm(f => ({...f, cta:c}))}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={form.cta === c ? { background:'#a855f7', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Audience</div>
            {[
              { key:'targetTokenHolders', label:'Token holders only' },
              { key:'targetNewUsers',     label:'New VIVA users'     },
            ].map(o => (
              <button key={o.key} onClick={() => setForm(f => ({...f, [o.key]: !f[o.key as keyof AdForm]}))}
                className="w-full flex items-center gap-3 p-3 rounded-xl mb-2"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-5 h-5 rounded flex items-center justify-center border"
                  style={{ borderColor: (form[o.key as keyof AdForm] as boolean) ? '#a855f7' : 'rgba(255,255,255,0.15)',
                    background: (form[o.key as keyof AdForm] as boolean) ? '#a855f7' : 'transparent' }}>
                  {(form[o.key as keyof AdForm] as boolean) && <span className="text-xs text-black font-black">✓</span>}
                </div>
                <span className="text-sm text-white/70">{o.label}</span>
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Summary</div>
            {[
              { label:'Objective', value:OBJECTIVES.find(o=>o.key===form.objective)?.label ?? '' },
              { label:'Budget',    value:`$${form.budget} USDC` },
              { label:'Duration',  value:`${form.duration} days` },
              { label:'Format',    value:FORMATS.find(f=>f.key===form.format)?.label ?? '' },
              { label:'Reach est.', value:estReach.toLocaleString() },
            ].map(s => (
              <div key={s.label} className="flex justify-between text-xs">
                <span className="text-white/30">{s.label}</span>
                <span className="text-white/60 font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </>}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={() => step < 3 ? setStep(s => s+1) : submit()}
          disabled={submitting || (step === 1 && !form.title)}
          className="w-full py-3.5 rounded-2xl font-black text-sm disabled:opacity-40"
          style={{ background: '#a855f7', color: '#04040A' }}>
          {submitting ? 'Submitting…' : step < 3 ? 'Continue →' : 'Launch Campaign 🚀'}
        </button>
      </div>
    </div>
  )
}
