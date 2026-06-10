'use client'
import { useState, useEffect } from 'react'
import { useAppStore, mockUser, MOCK_PROFILES, TIER_META, RING_META } from '@/lib/store'
import clsx from 'clsx'

const ZK_BADGE_LABELS: Record<string, { label: string; color: string }> = {
  health:   { label: 'Health Verified', color: 'var(--ring-activity)' },
  income:   { label: 'Income Range', color: 'var(--ring-wealth)' },
  location: { label: 'Location City', color: 'var(--ring-nutrition)' },
  identity: { label: 'Identity', color: 'var(--v)' },
}

export default function DatingPage() {
  const { user, setUser } = useAppStore()
  const [profiles] = useState(MOCK_PROFILES)
  const [idx, setIdx] = useState(0)
  const [decided, setDecided] = useState<Record<string, 'pass' | 'like'>>({})
  const [matched, setMatched] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<'discover' | 'matches'>('discover')

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
  }, [])

  if (!mounted) return null
  const u = user || mockUser()

  const available = profiles.filter(p => !decided[p.id])
  const current = available[0]
  const likedProfiles = profiles.filter(p => decided[p.id] === 'like')

  function decide(choice: 'pass' | 'like') {
    if (!current) return
    setDecided(prev => ({ ...prev, [current.id]: choice }))
    if (choice === 'like' && Math.random() > 0.4) {
      setTimeout(() => setMatched(current.id), 300)
    }
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
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>ZK-VERIFIED MATCHING</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>
              Verified Match
            </h1>
          </div>
          <div
            className="px-3 py-1.5 border text-xs font-medium"
            style={{ borderColor: 'var(--ring-wealth)30', color: 'var(--ring-wealth)', borderRadius: '99px', background: 'rgba(225,29,72,0.08)' }}
          >
            V-Score 600+ required
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['discover', 'matches'] as const).map(t => (
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
              {t === 'matches' && likedProfiles.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full" style={{ background: 'var(--ring-wealth)', color: 'white', fontSize: '0.6rem' }}>
                  {likedProfiles.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {tab === 'discover' && (
        <div className="max-w-xl mx-auto px-4 py-8">
          {current ? (
            <div className="relative">
              {/* Profile card — editorial style */}
              <div
                className="relative overflow-hidden border border-white/8"
                style={{ borderRadius: '4px', minHeight: '540px' }}
              >
                {/* Top half — avatar / visual */}
                <div
                  className="relative h-64 flex items-center justify-center"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${TIER_META[current.tier].color}20, transparent 70%)` }}
                >
                  <img
                    src={current.avatar}
                    alt={current.displayName}
                    className="w-28 h-28 rounded-full border-2 border-white/10"
                    style={{ boxShadow: `0 0 40px ${TIER_META[current.tier].color}40` }}
                  />
                  {/* Compatibility */}
                  <div className="absolute top-4 right-4">
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 border"
                      style={{ borderColor: 'var(--ring-activity)30', background: 'rgba(5,150,105,0.12)', borderRadius: '99px' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ring-activity)' }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--ring-activity)' }}>{current.compatibility}% match</span>
                    </div>
                  </div>
                  {/* Distance */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs text-white/30">{current.distance}km</span>
                  </div>
                </div>

                {/* Bottom — info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-bold text-xl" style={{ letterSpacing: '-0.03em' }}>{current.displayName}</h2>
                      <p className="text-sm text-white/40">@{current.handle}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-2xl font-bold" style={{ color: TIER_META[current.tier].color, letterSpacing: '-0.04em' }}>
                        {current.vscore}
                      </span>
                      <span className="t-caption" style={{ fontSize: '0.55rem', color: TIER_META[current.tier].color }}>
                        {TIER_META[current.tier].label.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-white/55 mb-4 leading-relaxed">{current.bio}</p>

                  {/* ZK Badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {current.zkBadges.map(badge => {
                      const meta = ZK_BADGE_LABELS[badge]
                      return meta ? (
                        <span
                          key={badge}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs border"
                          style={{ borderColor: `${meta.color}30`, color: meta.color, borderRadius: '99px', background: `${meta.color}10` }}
                        >
                          <span style={{ fontSize: '0.7rem' }}>✓</span> {meta.label}
                        </span>
                      ) : null
                    })}
                    {!current.verified && (
                      <span className="px-2.5 py-1 text-xs border border-white/10 text-white/30 rounded-full">
                        Unverified
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decide('pass')}
                      className="flex-1 py-3.5 font-semibold text-sm border border-white/12 text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => decide('like')}
                      className="flex-1 py-3.5 font-semibold text-sm text-white transition-all hover:opacity-90"
                      style={{ background: 'var(--ring-wealth)', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(225,29,72,0.3)' }}
                    >
                      ♥ Connect
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile counter */}
              <p className="text-center mt-4 t-caption" style={{ fontSize: '0.625rem' }}>
                {available.length} profiles · Sorted by V-Score compatibility
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                <span style={{ color: 'var(--ring-wealth)', fontSize: '1.5rem' }}>♥</span>
              </div>
              <p className="text-sm text-white/40">You've seen all profiles</p>
              <button
                onClick={() => setDecided({})}
                className="text-xs px-4 py-2 border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-all"
                style={{ borderRadius: 'var(--radius)' }}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'matches' && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          {likedProfiles.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-sm text-white/30">No matches yet. Start discovering.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {likedProfiles.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 border border-white/6 hover:border-white/12 transition-all"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <img src={p.avatar} alt={p.displayName} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{p.displayName}</span>
                      {p.verified && (
                        <span className="text-xs px-1.5 py-0.5" style={{ background: 'rgba(5,150,105,0.15)', color: 'var(--ring-activity)', borderRadius: '3px' }}>
                          ZK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">@{p.handle} · {p.vscore} V-Score</p>
                  </div>
                  <button
                    className="px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                    style={{ background: 'var(--v)', borderRadius: 'var(--radius)' }}
                  >
                    Message →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Match animation */}
      {matched && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(4,4,10,0.95)' }}
          onClick={() => setMatched(null)}
        >
          <div className="text-center space-y-5 animate-fade-up">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl"
              style={{ background: 'rgba(225,29,72,0.15)', border: '2px solid var(--ring-wealth)' }}
            >
              ♥
            </div>
            <h2 className="text-3xl font-bold" style={{ letterSpacing: '-0.04em' }}>It's a match.</h2>
            <p className="text-sm text-white/50">
              You and {profiles.find(p => p.id === matched)?.displayName} connected.
            </p>
            <button
              className="px-8 py-3 font-semibold text-sm text-white"
              style={{ background: 'var(--ring-wealth)', borderRadius: 'var(--radius)' }}
            >
              Send a message →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
