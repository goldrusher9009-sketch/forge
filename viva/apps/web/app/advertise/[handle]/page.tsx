'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PROFILES = {
  sovereign_v: { name: 'Sovereign V', color: '#a855f7', niche: 'Finance & Token Economy', followers: 148000, avgViews: 42000, engagement: 8.4, cpm: 12.50, tokenHolders: 1284 },
  mayafit:     { name: 'Maya Chen',   color: '#22c55e', niche: 'Health & Biohacking',     followers: 92000,  avgViews: 28000, engagement: 11.2, cpm: 9.80,  tokenHolders: 820  },
  luna_apex:   { name: 'Luna Apex',   color: '#f59e0b', niche: 'Creator & Lifestyle',     followers: 64000,  avgViews: 19000, engagement: 9.7, cpm: 8.20,  tokenHolders: 512  },
  zeronode:    { name: 'ZeroNode',    color: '#818cf8', niche: 'Web3 & Privacy Tech',     followers: 38000,  avgViews: 12000, engagement: 14.1, cpm: 14.00, tokenHolders: 398 },
}

const AD_FORMATS = [
  { id: 'feed_post',  label: 'Feed Post',     emoji: '📄', desc: 'Native post in creator feed', multiplier: 1.0 },
  { id: 'story_slot', label: 'Story Slot',    emoji: '📱', desc: '15s story placement', multiplier: 0.7 },
  { id: 'token_gate', label: 'Token Gate',    emoji: '🔑', desc: 'Shown to token holders only', multiplier: 1.4 },
  { id: 'live_read',  label: 'Live Read',     emoji: '🎙️', desc: 'Creator reads ad in live session', multiplier: 2.2 },
  { id: 'collab',     label: 'Collaboration', emoji: '🤝', desc: 'Full co-created content piece', multiplier: 3.5 },
]

const TARGETING = [
  { id: 'all_followers',    label: 'All Followers' },
  { id: 'token_holders',    label: 'Token Holders Only' },
  { id: 'bronze_plus',      label: 'Bronze+ Tier' },
  { id: 'silver_plus',      label: 'Silver+ Tier' },
  { id: 'gold_plus',        label: 'Gold+ Tier' },
]

export default function AdvertiseHandlePage() {
  const router = useRouter()
  const params = useParams()
  const handle = (params.handle as string) || 'sovereign_v'
  const profile = PROFILES[handle as keyof typeof PROFILES] || PROFILES.sovereign_v

  const [format, setFormat]     = useState('feed_post')
  const [targeting, setTargeting] = useState('all_followers')
  const [budget, setBudget]     = useState('500')
  const [duration, setDuration] = useState(7)
  const [headline, setHeadline] = useState('')
  const [body, setBody]         = useState('')
  const [url, setUrl]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [step, setStep]         = useState<1|2|3>(1)

  const selectedFormat = AD_FORMATS.find(f => f.id === format)!
  const budgetNum = parseFloat(budget) || 0
  const cpm = profile.cpm * selectedFormat.multiplier
  const estimatedImpressions = Math.floor((budgetNum / cpm) * 1000)
  const estimatedReach       = Math.floor(estimatedImpressions * 0.65)
  const dailyBudget          = budgetNum / duration

  async function handleLaunch() {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setSubmitting(false)
    setLaunched(true)
  }

  if (launched) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-black text-white mb-2">Campaign Live!</h2>
        <p className="text-white/40 text-sm text-center mb-8">Your ad is now running on {profile.name}'s profile. You'll receive performance reports daily.</p>
        <div className="w-full max-w-sm p-4 rounded-2xl border border-white/8 space-y-2 mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {[
            { label: 'Format', val: selectedFormat.label },
            { label: 'Budget', val: `$${budget}` },
            { label: 'Duration', val: `${duration} days` },
            { label: 'Est. Impressions', val: estimatedImpressions.toLocaleString() },
            { label: 'Est. Reach', val: estimatedReach.toLocaleString() },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-white/35">{r.label}</span>
              <span className="font-bold text-white/70">{r.val}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={() => router.push('/advertise')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: profile.color, color: '#04040A' }}>
            View Dashboard
          </button>
          <button onClick={() => { setLaunched(false); setStep(1) }}
            className="flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
            New Campaign
          </button>
        </div>
      </div>
    )
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
            <p className="text-xs text-white/30 tracking-widest">CAMPAIGN BUILDER</p>
            <h1 className="font-bold text-white">Advertise on {profile.name}</h1>
          </div>
        </div>
        {/* Steps */}
        <div className="flex gap-1 mt-3">
          {[1,2,3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: step >= s ? profile.color : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Profile card */}
        <div className="p-4 rounded-2xl border border-white/8 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.025)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
            style={{ background: `${profile.color}18`, color: profile.color }}>
            {profile.name[0]}
          </div>
          <div className="flex-1">
            <div className="font-bold text-white">{profile.name}</div>
            <div className="text-xs text-white/35">{profile.niche}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-white">{(profile.followers/1000).toFixed(0)}k</div>
            <div className="text-xs text-white/30">followers</div>
          </div>
        </div>

        {/* Audience stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Avg Views', val: `${(profile.avgViews/1000).toFixed(0)}k` },
            { label: 'Engagement', val: `${profile.engagement}%` },
            { label: 'Token Holders', val: profile.tokenHolders.toLocaleString() },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-xl text-center border border-white/6"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-white text-sm">{m.val}</div>
              <div className="text-xs text-white/30 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Ad Format</div>
              <div className="space-y-2">
                {AD_FORMATS.map(f => (
                  <button key={f.id} onClick={() => setFormat(f.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={format === f.id
                      ? { background: `${profile.color}12`, borderColor: `${profile.color}40` }
                      : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-xl">{f.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: format === f.id ? profile.color : 'rgba(255,255,255,0.8)' }}>{f.label}</div>
                      <div className="text-xs text-white/35">{f.desc}</div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: format === f.id ? profile.color : 'rgba(255,255,255,0.25)' }}>
                      ×{f.multiplier}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl font-black text-sm"
              style={{ background: profile.color, color: '#04040A' }}>
              Next: Budget & Targeting →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Target Audience</div>
              <div className="space-y-2">
                {TARGETING.map(t => (
                  <button key={t.id} onClick={() => setTargeting(t.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all"
                    style={targeting === t.id
                      ? { background: `${profile.color}12`, borderColor: `${profile.color}40` }
                      : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-sm font-semibold" style={{ color: targeting === t.id ? profile.color : 'rgba(255,255,255,0.7)' }}>{t.label}</span>
                    {targeting === t.id && <span style={{ color: profile.color }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Total Budget (USDC)</div>
              <div className="flex gap-2">
                <input value={budget} onChange={e => setBudget(e.target.value)}
                  type="number" placeholder="500"
                  className="flex-1 px-4 py-3 rounded-xl text-lg font-black bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none" />
              </div>
              <div className="flex gap-2 mt-2">
                {[250, 500, 1000, 2500].map(b => (
                  <button key={b} onClick={() => setBudget(String(b))}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    ${b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Duration: {duration} days</div>
              <input type="range" min={1} max={30} value={duration} onChange={e => setDuration(Number(e.target.value))}
                className="w-full accent-purple-500" />
              <div className="flex justify-between text-xs text-white/20 mt-1">
                <span>1 day</span><span>30 days</span>
              </div>
            </div>

            {/* Estimate */}
            {budgetNum > 0 && (
              <div className="p-4 rounded-2xl border border-white/6 space-y-2"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="text-xs text-white/30 uppercase tracking-widest">Estimated Performance</div>
                {[
                  { label: 'CPM', val: `$${cpm.toFixed(2)}` },
                  { label: 'Impressions', val: estimatedImpressions.toLocaleString() },
                  { label: 'Reach', val: estimatedReach.toLocaleString() },
                  { label: 'Daily Budget', val: `$${dailyBudget.toFixed(2)}/day` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-white/35">{r.label}</span>
                    <span className="font-bold" style={{ color: profile.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>← Back</button>
              <button onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-xl font-black text-sm"
                style={{ background: profile.color, color: '#04040A' }}>
                Next: Creative →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-white/30 mb-1.5">Headline</div>
                <input value={headline} onChange={e => setHeadline(e.target.value)}
                  placeholder="Your ad headline…"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/20 outline-none" />
              </div>
              <div>
                <div className="text-xs text-white/30 mb-1.5">Body Copy</div>
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder="Describe your product or service…" rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/20 outline-none resize-none" />
              </div>
              <div>
                <div className="text-xs text-white/30 mb-1.5">Destination URL</div>
                <input value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/20 outline-none" />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-white/6 space-y-1.5"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Order Summary</div>
              {[
                { label: 'Creator', val: profile.name },
                { label: 'Format', val: selectedFormat.label },
                { label: 'Audience', val: TARGETING.find(t => t.id === targeting)?.label ?? '' },
                { label: 'Budget', val: `$${budget} USDC` },
                { label: 'Duration', val: `${duration} days` },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-white/35">{r.label}</span>
                  <span className="font-semibold text-white/70">{r.val}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>← Back</button>
              <button onClick={handleLaunch} disabled={submitting || !headline}
                className="flex-1 py-3.5 rounded-xl font-black text-sm disabled:opacity-40"
                style={{ background: profile.color, color: '#04040A' }}>
                {submitting ? 'Launching…' : '🚀 Launch Campaign'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
