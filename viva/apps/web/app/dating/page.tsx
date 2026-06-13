'use client'
import { useState, useEffect } from 'react'
import { useAppStore, mockUser, MOCK_PROFILES, TIER_META } from '@/lib/store'
import { dating as datingApi } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

const ZK_BADGE_LABELS: Record<string, { label: string; color: string }> = {
  health:   { label: 'Health Verified', color: 'var(--ring-activity)' },
  income:   { label: 'Income Range', color: 'var(--ring-wealth)' },
  location: { label: 'Location City', color: 'var(--ring-nutrition)' },
  identity: { label: 'Identity', color: 'var(--v)' },
}

export default function DatingPage() {
  const { user, setUser } = useAppStore()
  const { success, info } = useToast()
  const [profiles, setProfiles] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [decided, setDecided] = useState<Record<string, 'pass' | 'like'>>({})
  const [matched, setMatched] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<'discover' | 'matches'>('discover')

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadDiscover()
    loadMatches()
  }, [])

  async function loadDiscover() {
    try {
      const data = await datingApi.discover()
      setProfiles(data)
    } catch {
      setProfiles(MOCK_PROFILES as any)
    }
  }

  async function loadMatches() {
    try {
      const data = await datingApi.matches()
      setMatches(data)
    } catch {}
  }

  if (!mounted) return null
  const u = user || mockUser()
  const available = profiles.filter(p => !decided[p.id])
  const current = available[0]

  async function decide(choice: 'pass' | 'like') {
    if (!current) return
    setDecided(prev => ({ ...prev, [current.id]: choice }))
    try {
      if (choice === 'like') {
        const res = await datingApi.connect(current.id)
        if (res.status === 'MATCHED') {
          setTimeout(() => setMatched(current.id), 300)
          success('🔮 It\'s a match!')
        } else {
          info('Interest sent — waiting for match')
        }
      } else {
        await datingApi.pass(current.id)
      }
    } catch {
      if (choice === 'like') {
        if (Math.random() > 0.4) {
          setTimeout(() => setMatched(current.id), 300)
          success('🔮 It\'s a match!')
        } else {
          info('Interest sent')
        }
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5" style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>ZK-VERIFIED MATCHING</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>Verified Match</h1>
          </div>
          <div className="px-3 py-1.5 border text-xs font-medium" style={{ borderColor: 'rgba(225,29,72,0.3)', color: 'var(--ring-wealth)', borderRadius: '99px', background: 'rgba(225,29,72,0.08)' }}>
            V-Score 600+ required
          </div>
        </div>
        <div className="flex gap-1">
          {(['discover', 'matches'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-1.5 text-sm font-medium capitalize transition-all" style={{ borderRadius: '99px', background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === t ? 'white' : 'rgba(245,244,240,0.4)' }}>
              {t}
              {t === 'matches' && matches.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full" style={{ background: 'var(--ring-wealth)', color: 'white', fontSize: '0.6rem' }}>{matches.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {tab === 'discover' && (
        <div className="max-w-xl mx-auto px-4 py-8">
          {current ? (
            <div className="relative">
              <div className="relative overflow-hidden border border-white/8" style={{ borderRadius: '4px', minHeight: '540px' }}>
                <div className="relative h-64 flex items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.2), transparent 70%)' }}>
                  <img src={current.avatar} alt={current.displayName} className="w-28 h-28 rounded-full border-2 border-white/10" />
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border" style={{ borderColor: 'rgba(5,150,105,0.3)', background: 'rgba(5,150,105,0.12)', borderRadius: '99px' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ring-activity)' }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--ring-activity)' }}>{current.compatibility}% match</span>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4"><span className="text-xs text-white/30">{current.distance}km</span></div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-bold text-xl" style={{ letterSpacing: '-0.03em' }}>{current.displayName}</h2>
                      <p className="text-sm text-white/40">@{current.handle}</p>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: 'var(--v)', letterSpacing: '-0.04em' }}>{current.vscore}</span>
                  </div>
                  <p className="text-sm text-white/55 mb-4 leading-relaxed">{current.bio}</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {(current.zkBadges ?? []).map((badge: string) => {
                      const meta = ZK_BADGE_LABELS[badge]
                      return meta ? (
                        <span key={badge} className="flex items-center gap-1.5 px-2.5 py-1 text-xs border" style={{ borderColor: meta.color + '30', color: meta.color, borderRadius: '99px', background: meta.color + '10' }}>
                          ✓ {meta.label}
                        </span>
                      ) : null
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => decide('pass')} className="press flex-1 py-3.5 font-semibold text-sm border border-white/12 text-white/50 hover:border-white/25 transition-all" style={{ borderRadius: 'var(--radius)' }}>Pass</button>
                    <button onClick={() => decide('like')} className="press flex-1 py-3.5 font-semibold text-sm text-white transition-all hover:opacity-90" style={{ background: 'var(--ring-wealth)', borderRadius: 'var(--radius)' }}>♥ Connect</button>
                  </div>
                </div>
              </div>
              <p className="text-center mt-4 t-caption" style={{ fontSize: '0.625rem' }}>{available.length} profiles · Sorted by V-Score compatibility</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                <span style={{ color: 'var(--ring-wealth)', fontSize: '1.5rem' }}>♥</span>
              </div>
              <p className="text-sm text-white/40">You've seen all profiles</p>
              <button onClick={() => setDecided({})} className="text-xs px-4 py-2 border border-white/15 text-white/50 hover:text-white transition-all" style={{ borderRadius: 'var(--radius)' }}>Reset</button>
            </div>
          )}
        </div>
      )}

      {tab === 'matches' && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          {matches.length === 0 ? (
            <div className="text-center py-24"><p className="text-sm text-white/30">No matches yet. Start discovering.</p></div>
          ) : (
            <div className="space-y-3">
              {matches.map((p: any) => {
                const name = p.displayName ?? p.target?.displayName ?? 'Unknown'
                const handle = p.handle ?? p.target?.handle ?? 'unknown'
                const avatar = p.avatar ?? p.target?.avatarUrl ?? ('https://api.dicebear.com/7.x/shapes/svg?seed=' + handle)
                const vscore = p.vscore ?? p.target?.vScore ?? 0
                const verified = p.verified ?? p.target?.verified ?? false
                return (
                  <div key={p.id} className="flex items-center gap-4 p-4 border border-white/6 hover:border-white/12 transition-all" style={{ borderRadius: 'var(--radius)' }}>
                    <img src={avatar} alt={name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{name}</span>
                        {verified && <span className="text-xs px-1.5 py-0.5" style={{ background: 'rgba(5,150,105,0.15)', color: 'var(--ring-activity)', borderRadius: '3px' }}>ZK</span>}
                      </div>
                      <p className="text-xs text-white/35 mt-0.5">@{handle} · {vscore} V-Score</p>
                    </div>
                    <button className="px-4 py-2 text-xs font-semibold text-white hover:opacity-80 transition-opacity" style={{ background: 'var(--v)', borderRadius: 'var(--radius)' }}>Message →</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {matched && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(4,4,10,0.95)' }} onClick={() => setMatched(null)}>
          <div className="text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(225,29,72,0.15)', border: '2px solid var(--ring-wealth)' }}>♥</div>
            <h2 className="text-3xl font-bold" style={{ letterSpacing: '-0.04em' }}>It's a match.</h2>
            <p className="text-sm text-white/50">You and {profiles.find(p => p.id === matched)?.displayName} connected.</p>
            <button className="px-8 py-3 font-semibold text-sm text-white" style={{ background: 'var(--ring-wealth)', borderRadius: 'var(--radius)' }} onClick={() => setMatched(null)}>Send a message →</button>
          </div>
        </div>
      )}
    </div>
  )
}
