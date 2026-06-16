'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type VerifyStep = 'intro' | 'type' | 'id' | 'selfie' | 'review' | 'done'
type VerifyType = 'creator' | 'investor' | 'institution'

const VERIFY_TYPES: { id: VerifyType; label: string; icon: string; color: string; desc: string; perks: string[] }[] = [
  {
    id: 'creator',
    label: 'Creator Verification',
    icon: '🎨',
    color: '#a855f7',
    desc: 'For public figures, artists, and content creators.',
    perks: ['Purple checkmark on profile', 'Boosted feed visibility', 'Priority support', 'Early access to creator features'],
  },
  {
    id: 'investor',
    label: 'Investor Verification',
    icon: '💼',
    color: '#f59e0b',
    desc: 'For verified traders, analysts, and financial professionals.',
    perks: ['Gold investor badge', 'Accredited investor label', 'Access to advanced signal features', 'Verified analytics tag'],
  },
  {
    id: 'institution',
    label: 'Institution Verification',
    icon: '🏛️',
    color: '#818cf8',
    desc: 'For funds, DAOs, companies, and organizations.',
    perks: ['Institution badge', 'Entity profile with team members', 'Bulk token operations', 'Dedicated account manager'],
  },
]

const ID_TYPES = ['Passport', 'Driver\'s License', 'National ID Card', 'Residence Permit']

export default function VerifyPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'me'

  const [step, setStep] = useState<VerifyStep>('intro')
  const [verifyType, setVerifyType] = useState<VerifyType | null>(null)
  const [idType, setIdType] = useState(ID_TYPES[0])
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [idUploaded, setIdUploaded] = useState(false)
  const [selfieUploaded, setSelfieUploaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedType = VERIFY_TYPES.find(t => t.id === verifyType)

  async function submit() {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 2000))
    setSubmitting(false)
    setStep('done')
  }

  function stepNum() {
    const steps: VerifyStep[] = ['intro', 'type', 'id', 'selfie', 'review']
    return Math.max(0, steps.indexOf(step))
  }

  const STEPS_TOTAL = 4

  if (step === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-6xl">✅</div>
          <div>
            <div className="text-2xl font-black text-white">Submitted for Review</div>
            <div className="text-white/40 text-sm mt-2">We'll verify your identity within 24–48 hours and notify you at your registered email.</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 space-y-2 text-left"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            {[
              { label: 'Type',    value: selectedType?.label ?? '' },
              { label: 'Status',  value: '⏳ Pending Review',       color: '#f59e0b' },
              { label: 'Account', value: `@${handle}` },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-white/35">{r.label}</span>
                <span className="font-semibold" style={{ color: r.color ?? 'rgba(255,255,255,0.65)' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push(`/profile/${handle}`)}
            className="w-full py-3.5 rounded-xl font-black"
            style={{ background: '#a855f7', color: '#04040A' }}>
            Back to Profile
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
          <button onClick={() => {
            const prev: Record<VerifyStep, VerifyStep> = { intro: 'intro', type: 'intro', id: 'type', selfie: 'id', review: 'selfie', done: 'review' }
            step === 'intro' ? router.back() : setStep(prev[step])
          }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white">Get Verified</div>
        </div>
        {step !== 'intro' && step !== 'done' && (
          <div className="flex gap-1 mt-3">
            {Array.from({ length: STEPS_TOTAL }, (_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full"
                style={{ background: i < stepNum() ? '#a855f7' : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
        )}
      </header>

      <div className="max-w-lg mx-auto px-4 py-5">

        {/* INTRO */}
        {step === 'intro' && (
          <div className="space-y-5">
            <div>
              <div className="text-2xl font-black text-white mb-2">Verify your identity</div>
              <p className="text-sm text-white/45 leading-relaxed">
                Verification builds trust with your audience and unlocks advanced features. Choose the verification type that fits you best.
              </p>
            </div>
            <div className="space-y-3">
              {VERIFY_TYPES.map(t => (
                <button key={t.id}
                  onClick={() => { setVerifyType(t.id); setStep('type') }}
                  className="w-full flex items-start gap-3 p-4 rounded-2xl border text-left"
                  style={{ background: `${t.color}06`, borderColor: `${t.color}15` }}>
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <div className="font-black text-sm text-white/85">{t.label}</div>
                    <div className="text-xs text-white/35 mt-0.5">{t.desc}</div>
                  </div>
                  <span className="ml-auto text-white/20 flex-shrink-0">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TYPE OVERVIEW */}
        {step === 'type' && selectedType && (
          <div className="space-y-5">
            <div className="text-center py-4">
              <div className="text-4xl mb-3">{selectedType.icon}</div>
              <div className="text-xl font-black text-white">{selectedType.label}</div>
              <div className="text-sm text-white/40 mt-1">{selectedType.desc}</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">What you get</div>
              {selectedType.perks.map((p, i) => (
                <div key={i} className="flex gap-2.5 text-sm text-white/60">
                  <span style={{ color: selectedType.color }}>✓</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl border border-white/5 text-xs text-white/30 space-y-1" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="font-semibold text-white/40">You'll need:</div>
              <div>• Government-issued photo ID</div>
              <div>• A selfie holding your ID</div>
              <div>• Review takes 24–48 hours</div>
            </div>
            <button onClick={() => setStep('id')}
              className="w-full py-4 rounded-2xl font-black text-lg"
              style={{ background: selectedType.color, color: '#04040A' }}>
              Continue →
            </button>
          </div>
        )}

        {/* ID STEP */}
        {step === 'id' && (
          <div className="space-y-5">
            <div className="text-lg font-black text-white">Upload your ID</div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">ID Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ID_TYPES.map(t => (
                  <button key={t} onClick={() => setIdType(t)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-left"
                    style={idType === t ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Full Legal Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="As it appears on your ID"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Country of Issue</label>
              <input value={country} onChange={e => setCountry(e.target.value)}
                placeholder="e.g. United States"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
            </div>
            <button onClick={() => setIdUploaded(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed text-sm font-bold"
              style={idUploaded
                ? { background: 'rgba(34,197,94,0.08)', borderColor: '#22c55e', color: '#22c55e' }
                : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}>
              {idUploaded ? '✓ ID Uploaded' : '📸 Upload ID Photo'}
            </button>
            <button onClick={() => setStep('selfie')} disabled={!name.trim() || !country.trim() || !idUploaded}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Next →
            </button>
          </div>
        )}

        {/* SELFIE STEP */}
        {step === 'selfie' && (
          <div className="space-y-5">
            <div>
              <div className="text-lg font-black text-white mb-1">Selfie with your ID</div>
              <p className="text-sm text-white/40 leading-relaxed">Take a clear photo of yourself holding your ID next to your face. Both must be clearly visible.</p>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 space-y-2 text-sm text-white/45" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div>✓ Face clearly visible and unobstructed</div>
              <div>✓ ID legible in photo</div>
              <div>✓ Good lighting, no shadows</div>
              <div>✗ No filters or editing</div>
              <div>✗ Not a photo of a photo</div>
            </div>
            <button onClick={() => setSelfieUploaded(true)}
              className="w-full py-8 rounded-2xl border-2 border-dashed text-4xl"
              style={selfieUploaded
                ? { background: 'rgba(34,197,94,0.08)', borderColor: '#22c55e' }
                : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}>
              {selfieUploaded ? '✅' : '🤳'}
              <div className="text-sm font-bold mt-2"
                style={{ color: selfieUploaded ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                {selfieUploaded ? 'Selfie uploaded' : 'Tap to upload selfie'}
              </div>
            </button>
            <button onClick={() => setStep('review')} disabled={!selfieUploaded}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Next →
            </button>
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && selectedType && (
          <div className="space-y-5">
            <div className="text-lg font-black text-white">Review & Submit</div>
            <div className="p-4 rounded-2xl border border-white/5 space-y-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
              {[
                { label: 'Verification type', value: selectedType.label },
                { label: 'Full name',          value: name },
                { label: 'Country',            value: country },
                { label: 'ID type',            value: idType },
                { label: 'ID photo',           value: '✓ Uploaded', color: '#22c55e' },
                { label: 'Selfie',             value: '✓ Uploaded', color: '#22c55e' },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-white/35">{r.label}</span>
                  <span className="font-semibold" style={{ color: r.color ?? 'rgba(255,255,255,0.65)' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-white/25 leading-relaxed">
              By submitting, you confirm this information is accurate and authorize VIVA to process your verification. Documents are encrypted and not shared with third parties.
            </div>
            <button onClick={submit} disabled={submitting}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
              style={{ background: selectedType.color, color: '#04040A' }}>
              {submitting ? 'Submitting…' : '🔒 Submit for Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
