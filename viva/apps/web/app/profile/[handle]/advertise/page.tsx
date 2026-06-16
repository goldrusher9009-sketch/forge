'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PROFILES: Record<string, {
  name: string; handle: string; color: string; category: string; verified: boolean;
  followers: number; engagement: number; cpm: number; tokenPrice: number; holders: number;
  topDemo: string; avgImpressions: number; adSlots: { id: string; name: string; desc: string; multiplier: number; available: boolean }[]
}> = {
  sovereign_v: {
    name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7', category: 'Finance', verified: true,
    followers: 148000, engagement: 8.4, cpm: 12.50, tokenPrice: 12.40, holders: 1284,
    topDemo: '25–34, Finance & Crypto', avgImpressions: 42000,
    adSlots: [
      { id: 'feed_post',  name: 'Sponsored Post',    desc: 'Native post in Sovereign\'s feed. Max engagement.',       multiplier: 1.0,  available: true  },
      { id: 'story',      name: 'Story Slot',        desc: '24h story placement with swipe-up CTA.',                  multiplier: 0.7,  available: true  },
      { id: 'token_gate', name: 'Token-Gated Ad',   desc: 'Shown only to token holders. High-intent audience.',       multiplier: 1.4,  available: false },
      { id: 'live_read',  name: 'Live Read',         desc: 'Mentioned live in Sovereign\'s next room session.',        multiplier: 2.2,  available: true  },
      { id: 'collab',     name: 'Co-created Post',  desc: 'Sovereign collaborates directly on branded content.',      multiplier: 3.5,  available: true  },
    ],
  },
  mayafit: {
    name: 'Maya Chen', handle: 'mayafit', color: '#22c55e', category: 'Health', verified: true,
    followers: 92000, engagement: 11.2, cpm: 9.80, tokenPrice: 6.60, holders: 820,
    topDemo: '22–38, Health & Wellness', avgImpressions: 28000,
    adSlots: [
      { id: 'feed_post',  name: 'Sponsored Post',    desc: 'Native post in Maya\'s feed.',                             multiplier: 1.0,  available: true  },
      { id: 'story',      name: 'Story Slot',        desc: '24h story with product tag.',                              multiplier: 0.7,  available: true  },
      { id: 'live_read',  name: 'Live Read',         desc: 'Mentioned in Maya\'s biohack session.',                   multiplier: 2.2,  available: true  },
      { id: 'collab',     name: 'Co-created Post',  desc: 'Maya tests and reviews your product.',                     multiplier: 3.5,  available: false },
    ],
  },
}

const TARGETING_OPTIONS = [
  { id: 'all',          label: 'All followers',   desc: 'Max reach.' },
  { id: 'token_hold',   label: 'Token holders',   desc: 'Engaged super-fans.' },
  { id: 'bronze_plus',  label: 'Bronze+ holders', desc: '10+ tokens held.' },
  { id: 'silver_plus',  label: 'Silver+ holders', desc: '25+ tokens held.' },
]

const BUDGETS = [100, 250, 500, 1000, 2500, 5000]
const DURATIONS = [3, 7, 14, 30]

export default function ProfileAdvertisePage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? PROFILES.sovereign_v

  const [step, setStep] = useState(1)
  const [slot, setSlot] = useState(profile.adSlots[0].id)
  const [targeting, setTargeting] = useState('all')
  const [budget, setBudget] = useState(500)
  const [duration, setDuration] = useState(7)
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)

  const selectedSlot = profile.adSlots.find(s => s.id === slot)!
  const cpm = profile.cpm * selectedSlot.multiplier
  const impressions = Math.round((budget / cpm) * 1000)
  const reach = Math.round(impressions * 0.65)
  const dailyBudget = (budget / duration).toFixed(0)

  async function launchCampaign() {
    setLaunching(true)
    await new Promise(r => setTimeout(r, 1600))
    setLaunching(false)
    setLaunched(true)
  }

  if (launched) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '2px solid rgba(168,85,247,0.3)' }}>
            <span className="text-3xl">📣</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white mb-1">Campaign Live!</div>
            <div className="text-white/40">Your ad is running on {profile.name}'s profile.</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 text-left space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="Creator" value={profile.name} />
            <Row label="Format" value={selectedSlot.name} />
            <Row label="Budget" value={`$${budget}`} />
            <Row label="Duration" value={`${duration} days`} />
            <Row label="Est. impressions" value={impressions.toLocaleString()} />
            <Row label="Est. reach" value={reach.toLocaleString()} />
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push('/advertise')}
              className="w-full py-3.5 rounded-xl font-black" style={{ background: '#a855f7', color: '#04040A' }}>
              Go to Ad Dashboard
            </button>
            <button onClick={() => router.push(`/profile/${handle}`)}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              View Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-bold text-white">Advertise on @{handle}</div>
            <div className="text-xs text-white/30">Step {step} of 3</div>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: step >= i ? profile.color : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Profile card always visible */}
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: `${profile.color}18`, color: profile.color }}>{profile.name[0]}</div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white/85 text-sm">{profile.name}</span>
              {profile.verified && <span style={{ color: profile.color }} className="text-xs">✓</span>}
            </div>
            <div className="text-xs text-white/30">{(profile.followers/1000).toFixed(0)}k followers · {profile.engagement}% engagement</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/30">avg CPM</div>
            <div className="font-black text-sm" style={{ color: profile.color }}>${profile.cpm}</div>
          </div>
        </div>

        {/* Step 1 — Format */}
        {step === 1 && (
          <>
            <div className="text-xs text-white/30 uppercase tracking-widest">Ad Format</div>
            {profile.adSlots.map(s => (
              <button key={s.id} onClick={() => s.available && setSlot(s.id)}
                disabled={!s.available}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all disabled:opacity-40"
                style={slot === s.id
                  ? { background: `${profile.color}10`, borderColor: `${profile.color}40` }
                  : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white/80 text-sm">{s.name}</span>
                    {!s.available && <span className="text-xs text-white/25">Unavailable</span>}
                  </div>
                  <div className="text-xs text-white/30">{s.desc}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-white/30">×{s.multiplier} CPM</div>
                  <div className="text-sm font-black" style={{ color: profile.color }}>${(profile.cpm * s.multiplier).toFixed(2)}</div>
                </div>
              </button>
            ))}
            <button onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl font-black"
              style={{ background: profile.color, color: '#04040A' }}>
              Continue →
            </button>
          </>
        )}

        {/* Step 2 — Budget + targeting */}
        {step === 2 && (
          <>
            <div className="space-y-3">
              <div className="text-xs text-white/30 uppercase tracking-widest">Targeting</div>
              {TARGETING_OPTIONS.map(t => (
                <button key={t.id} onClick={() => setTargeting(t.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={targeting === t.id
                    ? { background: `${profile.color}08`, borderColor: `${profile.color}35` }
                    : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white/80">{t.label}</div>
                    <div className="text-xs text-white/30">{t.desc}</div>
                  </div>
                  {targeting === t.id && <span style={{ color: profile.color }}>✓</span>}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-xs text-white/30 uppercase tracking-widest">Total Budget (USDC)</div>
              <div className="grid grid-cols-3 gap-2">
                {BUDGETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)}
                    className="py-2.5 rounded-xl text-sm font-black transition-all"
                    style={budget === b
                      ? { background: profile.color, color: '#04040A' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    ${b}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-white/30 uppercase tracking-widest">Duration (days)</div>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                    style={duration === d
                      ? { background: profile.color, color: '#04040A' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Estimate */}
            <div className="p-4 rounded-2xl border border-white/6 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Estimated Performance</div>
              <Row label="Daily budget" value={`$${dailyBudget}`} />
              <Row label="Est. impressions" value={impressions.toLocaleString()} />
              <Row label="Est. unique reach" value={reach.toLocaleString()} />
              <Row label="Est. CPM" value={`$${cpm.toFixed(2)}`} />
            </div>

            <button onClick={() => setStep(3)}
              className="w-full py-4 rounded-2xl font-black"
              style={{ background: profile.color, color: '#04040A' }}>
              Continue →
            </button>
          </>
        )}

        {/* Step 3 — Creative + launch */}
        {step === 3 && (
          <>
            <div className="text-xs text-white/30 uppercase tracking-widest">Ad Creative</div>
            <div className="space-y-3">
              <Field label="Headline">
                <input value={headline} onChange={e => setHeadline(e.target.value)}
                  placeholder="Grab their attention in one line"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none" />
              </Field>
              <Field label="Body copy">
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  rows={3} placeholder="Tell your story…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none resize-none" />
              </Field>
              <Field label="CTA URL">
                <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none" />
              </Field>
            </div>

            <div className="p-4 rounded-2xl border border-white/6 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Campaign Summary</div>
              <Row label="Creator" value={profile.name} />
              <Row label="Format" value={selectedSlot.name} />
              <Row label="Targeting" value={TARGETING_OPTIONS.find(t => t.id === targeting)!.label} />
              <Row label="Budget" value={`$${budget} over ${duration} days`} />
              <Row label="Est. impressions" value={impressions.toLocaleString()} />
            </div>

            <button onClick={launchCampaign} disabled={launching || !headline}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-40"
              style={{ background: profile.color, color: '#04040A' }}>
              {launching ? 'Launching…' : '📣 Launch Campaign'}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70 font-semibold">{value}</span>
    </div>
  )
}
