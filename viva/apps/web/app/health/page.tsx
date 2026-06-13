'use client'
import { useState, useEffect } from 'react'
import { useAppStore, mockUser, RING_META } from '@/lib/store'
import { health as healthApi } from '@/lib/api'
import clsx from 'clsx'

const ZK_PROOFS = [
  {
    id: 'sleep_duration',
    title: 'Sleep Duration',
    desc: 'Prove you sleep 7+ hours without revealing exact hours',
    status: 'active',
    ring: 'sleep',
    expires: '2025-08-12',
    threshold: '≥7h nightly avg',
  },
  {
    id: 'activity_level',
    title: 'Activity Level',
    desc: 'Prove daily movement meets threshold. No GPS data exposed.',
    status: 'active',
    ring: 'activity',
    expires: '2025-07-30',
    threshold: '≥6k steps/day',
  },
  {
    id: 'nutrition_quality',
    title: 'Nutrition Score',
    desc: 'Prove dietary consistency. No meal data stored.',
    status: 'pending',
    ring: 'nutrition',
    expires: null,
    threshold: 'Score ≥65',
  },
  {
    id: 'health_overall',
    title: 'Overall Health',
    desc: 'Composite ZK proof across all 5 rings',
    status: 'none',
    ring: 'sleep',
    expires: null,
    threshold: 'V-Score ≥650',
  },
]

const HEALTH_LOG = [
  { ts: Date.now() - 3600000,  type: 'sleep',     value: 7.8, unit: 'hrs',   ring: 'sleep' },
  { ts: Date.now() - 7200000,  type: 'steps',     value: 8420, unit: 'steps', ring: 'activity' },
  { ts: Date.now() - 14400000, type: 'nutrition',  value: 72,   unit: '/100',  ring: 'nutrition' },
  { ts: Date.now() - 28800000, type: 'sleep',     value: 6.9, unit: 'hrs',   ring: 'sleep' },
  { ts: Date.now() - 86400000, type: 'steps',     value: 10200, unit: 'steps', ring: 'activity' },
]

export default function HealthPage() {
  const { user, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [proofs, setProofs] = useState(ZK_PROOFS)
  const [generating, setGenerating] = useState<string | null>(null)
  const [logEntry, setLogEntry] = useState({ type: 'sleep', value: '' })
  const [tab, setTab] = useState<'rings' | 'proofs' | 'log'>('rings')
  const [healthLog, setHealthLog] = useState(HEALTH_LOG)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadLog()
  }, [])

  async function loadLog() {
    try {
      const data = await healthApi.logs()
      if (Array.isArray(data) && data.length) {
        setHealthLog(data.map((e: any) => ({
          ts: new Date(e.createdAt ?? Date.now()).getTime(),
          type: e.metric ?? e.type ?? 'sleep',
          value: e.value,
          unit: e.unit ?? '',
          ring: e.ring ?? e.metric ?? 'sleep',
        })))
      }
    } catch { /* keep mock */ }
  }

  if (!mounted) return null
  const u = user || mockUser()

  async function logHealthEntry() {
    if (!logEntry.value || logging) return
    setLogging(true)
    try {
      await healthApi.logEntry({ ring: logEntry.type, value: +logEntry.value })
      setHealthLog(prev => [{ ts: Date.now(), type: logEntry.type, value: +logEntry.value, unit: '', ring: logEntry.type }, ...prev])
      setLogEntry(prev => ({ ...prev, value: '' }))
    } catch {
      setHealthLog(prev => [{ ts: Date.now(), type: logEntry.type, value: +logEntry.value, unit: '', ring: logEntry.type }, ...prev])
      setLogEntry(prev => ({ ...prev, value: '' }))
    } finally {
      setLogging(false)
    }
  }

  async function generateProof(proofId: string) {
    setGenerating(proofId)
    try {
      await healthApi.generateProof(proofId)
      setProofs(prev => prev.map(p =>
        p.id === proofId
          ? { ...p, status: 'active', expires: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) }
          : p
      ))
    } catch {
      await new Promise(r => setTimeout(r, 2200))
      setProofs(prev => prev.map(p =>
        p.id === proofId
          ? { ...p, status: 'active', expires: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) }
          : p
      ))
    }
    setGenerating(null)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>ZERO-KNOWLEDGE HEALTH</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>
              Health ZK
            </h1>
          </div>
          <div
            className="px-3 py-1.5 text-xs font-medium border"
            style={{ borderColor: 'var(--ring-activity)30', color: 'var(--ring-activity)', borderRadius: '99px', background: 'rgba(5,150,105,0.08)' }}
          >
            {proofs.filter(p => p.status === 'active').length} active proofs
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['rings', 'proofs', 'log'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 text-sm font-medium capitalize transition-all"
              style={{
                borderRadius: '99px',
                background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t ? 'white' : 'rgba(245,244,240,0.4)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="container-editorial py-8">

        {/* Rings tab */}
        {tab === 'rings' && (
          <div className="max-w-2xl space-y-6">
            {/* Ring meters */}
            <section>
              <p className="t-caption mb-5" style={{ fontSize: '0.625rem' }}>CURRENT RING VALUES</p>
              <div className="space-y-5">
                {(Object.entries(RING_META) as any[]).map(([key, meta]) => {
                  const val = u.rings[key as keyof typeof u.rings]
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
                          <span className="font-semibold text-sm text-white/80">{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="t-mono text-base font-bold" style={{ color: meta.color }}>{val}</span>
                          <span className="text-xs text-white/25">/ 100</span>
                        </div>
                      </div>
                      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                          style={{ width: `${val}%`, background: meta.color, boxShadow: `0 0 10px ${meta.color}60` }}
                        />
                      </div>
                      {/* Tick marks */}
                      <div className="flex justify-between mt-1">
                        {[0, 25, 50, 75, 100].map(tick => (
                          <span key={tick} className="t-mono" style={{ fontSize: '0.55rem', opacity: 0.2 }}>{tick}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Log health data */}
            <div className="rule" />
            <section>
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>LOG TODAY'S DATA</p>
              <div className="flex gap-3">
                <select
                  value={logEntry.type}
                  onChange={e => setLogEntry(prev => ({ ...prev, type: e.target.value }))}
                  className="bg-white/4 border border-white/10 px-3 py-2.5 text-sm text-white/70 outline-none"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <option value="sleep">Sleep (hours)</option>
                  <option value="steps">Steps</option>
                  <option value="nutrition">Nutrition score</option>
                  <option value="mood">Mood (1-10)</option>
                </select>
                <input
                  type="number"
                  value={logEntry.value}
                  onChange={e => setLogEntry(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Value"
                  className="flex-1 bg-white/4 border border-white/10 px-4 py-2.5 text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors text-sm"
                  style={{ borderRadius: 'var(--radius)' }}
                />
                <button
                  onClick={logHealthEntry}
                  disabled={!logEntry.value || logging}
                  className="px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-30 transition-opacity"
                  style={{ background: 'var(--ring-activity)', borderRadius: 'var(--radius)' }}
                >
                  {logging ? 'Logging…' : 'Log'}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ZK Proofs tab */}
        {tab === 'proofs' && (
          <div className="max-w-2xl">
            <div className="mb-6 p-4 border border-white/6 text-sm text-white/50 leading-relaxed" style={{ borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)' }}>
              <span className="font-semibold text-white/70">ZK Health Proofs</span> let you prove health facts to apps, matches, and markets — without exposing raw data. Proofs live as Soulbound Tokens on Base L2.
            </div>

            <div className="space-y-3">
              {proofs.map(proof => {
                const ringMeta = RING_META[proof.ring as keyof typeof RING_META]
                const isGenerating = generating === proof.id
                return (
                  <div
                    key={proof.id}
                    className="p-5 border transition-all"
                    style={{
                      borderRadius: 'var(--radius)',
                      borderColor: proof.status === 'active' ? `${ringMeta.color}30` : 'rgba(255,255,255,0.08)',
                      background: proof.status === 'active' ? `${ringMeta.color}06` : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: ringMeta.color }} />
                          <span className="font-semibold text-sm text-white/85">{proof.title}</span>
                          <span
                            className="text-xs px-2 py-0.5"
                            style={{
                              borderRadius: '3px',
                              background: proof.status === 'active' ? `${ringMeta.color}20` : proof.status === 'pending' ? 'rgba(217,119,6,0.15)' : 'rgba(255,255,255,0.05)',
                              color: proof.status === 'active' ? ringMeta.color : proof.status === 'pending' ? 'var(--ring-social)' : 'rgba(245,244,240,0.3)',
                            }}
                          >
                            {proof.status === 'active' ? 'Active SBT' : proof.status === 'pending' ? 'Ready to mint' : 'Not generated'}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mb-1.5 leading-relaxed">{proof.desc}</p>
                        <div className="flex items-center gap-3">
                          <span className="t-mono text-xs text-white/25">Threshold: {proof.threshold}</span>
                          {proof.expires && (
                            <span className="t-mono text-xs text-white/20">Expires: {proof.expires}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {proof.status === 'active' ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ background: `${ringMeta.color}20`, border: `1px solid ${ringMeta.color}40` }}
                            >
                              <span style={{ color: ringMeta.color, fontSize: '1rem' }}>✓</span>
                            </div>
                            <span className="text-xs text-white/25">SBT #{proof.id.slice(-4)}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => generateProof(proof.id)}
                            disabled={!!generating}
                            className="px-4 py-2 text-xs font-semibold border transition-all disabled:opacity-40"
                            style={{
                              borderColor: ringMeta.color + '40',
                              color: ringMeta.color,
                              borderRadius: 'var(--radius)',
                              background: `${ringMeta.color}08`,
                            }}
                          >
                            {isGenerating ? 'Proving…' : 'Generate'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Activity log tab */}
        {tab === 'log' && (
          <div className="max-w-xl">
            <p className="t-caption mb-5" style={{ fontSize: '0.625rem' }}>RECENT HEALTH EVENTS</p>
            <div className="space-y-2">
              {healthLog.map((entry, i) => {
                const meta = RING_META[entry.ring as keyof typeof RING_META]
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 border border-white/6"
                    style={{ borderRadius: 'var(--radius)', borderLeft: `2px solid ${meta.color}50` }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold capitalize" style={{ color: meta.color }}>{entry.type}</span>
                        <span className="text-white/15">·</span>
                        <span className="text-xs text-white/25">{formatRelTime(entry.ts)}</span>
                      </div>
                      <span className="t-mono text-sm font-bold text-white/70">{entry.value} {entry.unit}</span>
                    </div>
                    <div
                      className="h-8 w-0.5 rounded-full"
                      style={{ background: `${meta.color}40` }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatRelTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return Math.floor(diff / 86400000) + 'd ago'
}
