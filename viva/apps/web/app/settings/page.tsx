'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, mockUser, mapApiUser, RING_META } from '@/lib/store'
import { auth, users as usersApi, clearTokens } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    sleepRing: 50,
    nutritionRing: 50,
    activityRing: 50,
    socialRing: 50,
    wealthRing: 50,
  })

  useEffect(() => {
    setMounted(true)
    auth.me().then(me => {
      const u = mapApiUser(me, mockUser())
      setUser(u)
      setForm({
        displayName: me.displayName ?? '',
        bio: me.bio ?? '',
        avatarUrl: me.avatarUrl ?? '',
        sleepRing: me.sleepRing ?? 50,
        nutritionRing: me.nutritionRing ?? 50,
        activityRing: me.activityRing ?? 50,
        socialRing: me.socialRing ?? 50,
        wealthRing: me.wealthRing ?? 50,
      })
    }).catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await usersApi.updateMe({
        displayName: form.displayName || undefined,
        bio: form.bio || undefined,
        avatarUrl: form.avatarUrl || undefined,
        sleepRing: form.sleepRing,
        nutritionRing: form.nutritionRing,
        activityRing: form.activityRing,
        socialRing: form.socialRing,
        wealthRing: form.wealthRing,
      })
      setUser(mapApiUser(updated, mockUser()))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    clearTokens()
    router.push('/auth/onboard')
  }

  if (!mounted) return null

  const rings = [
    { key: 'sleepRing', label: 'Sleep' },
    { key: 'nutritionRing', label: 'Nutrition' },
    { key: 'activityRing', label: 'Activity' },
    { key: 'socialRing', label: 'Social' },
    { key: 'wealthRing', label: 'Wealth' },
  ] as const

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.85)' }}>
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors mr-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="font-semibold text-sm">Settings</span>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-8">

        {/* Profile */}
        <section>
          <p className="t-caption mb-4" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>PROFILE</p>
          <div className="space-y-3">
            <div>
              <label className="t-caption block mb-1.5" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>DISPLAY NAME</label>
              <input
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/30"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="t-caption block mb-1.5" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>BIO</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 resize-none"
                placeholder="Short bio…"
              />
            </div>
            <div>
              <label className="t-caption block mb-1.5" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>AVATAR URL</label>
              <input
                value={form.avatarUrl}
                onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/30"
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* Rings */}
        <section>
          <p className="t-caption mb-4" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>SOVEREIGN RINGS</p>
          <div className="space-y-4">
            {rings.map(({ key, label }) => {
              const meta = RING_META[label.toLowerCase() as keyof typeof RING_META]
              const val = form[key]
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1.5">
                    <label className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>{label.toUpperCase()}</label>
                    <span className="font-mono text-xs" style={{ color: meta.color }}>{val}</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={val}
                    onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: meta.color }}
                  />
                </div>
              )
            })}
          </div>
        </section>

        {/* Save */}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: 'var(--v)' }}
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
        </button>

        {/* Logout */}
        <div className="pt-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl text-sm transition-all"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
          >
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}
