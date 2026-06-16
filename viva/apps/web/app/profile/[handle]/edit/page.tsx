'use client'
import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PROFILE = {
  handle: 'sovereign_v',
  name: 'Sovereign V',
  bio: 'Token economy builder. DeFi researcher. Helping creators monetize through Web3.',
  location: 'New York, NY',
  website: 'https://sovereignv.xyz',
  twitter: 'sovereign_v',
  instagram: 'sovereign.v',
  color: '#a855f7',
  category: 'finance',
  birthdate: '1992-03-15',
  pronoun: 'he/him',
}

const CATEGORIES = [
  'Finance', 'Health', 'Tech', 'Music', 'Art', 'Gaming', 'Fitness', 'Crypto', 'Lifestyle', 'Education', 'Sports', 'Food',
]

const PRONOUNS = ['he/him', 'she/her', 'they/them', 'prefer not to say']

const COLORS = [
  '#a855f7', '#22c55e', '#f59e0b', '#818cf8', '#ec4899', '#f87171', '#38bdf8', '#fb923c',
]

export default function ProfileEditPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'

  const [form, setForm] = useState({ ...PROFILE })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<'basic' | 'social' | 'appearance'>('basic')
  const avatarRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  function set(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    setTxMsg('Profile updated')
    setTimeout(() => { setSaved(false); setTxMsg(null) }, 3000)
  }

  async function deleteProfile() {
    // just show a toast — no actual deletion
    setTxMsg('Contact support to delete your account.')
    setTimeout(() => setTxMsg(null), 4000)
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
          <div className="flex-1 font-bold text-white">Edit Profile</div>
          <button onClick={save} disabled={saving}
            className="px-4 py-1.5 rounded-lg text-xs font-black disabled:opacity-50"
            style={{ background: saved ? '#22c55e' : '#a855f7', color: '#04040A' }}>
            {saving ? '…' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#a855f718', color: '#a855f7', border: '1px solid #a855f730' }}>
            {txMsg}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/6"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="relative flex-shrink-0">
            {avatarPreview
              ? <img src={avatarPreview} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              : <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl"
                  style={{ background: `${form.color}18`, color: form.color }}>{form.name[0]}</div>
            }
            <button onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: '#a855f7' }}>
              <span className="text-xs text-black font-black">+</span>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <div className="font-black text-white">{form.name}</div>
            <div className="text-sm text-white/30">@{form.handle}</div>
            <button onClick={() => avatarRef.current?.click()}
              className="text-xs mt-1" style={{ color: '#a855f7' }}>Change photo</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['basic', 'social', 'appearance'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
              style={tab === t
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'basic' && (
          <div className="space-y-3">
            <Field label="Display Name">
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white outline-none focus:border-purple-500/40" />
            </Field>
            <Field label="Bio">
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white outline-none focus:border-purple-500/40 resize-none" />
              <div className="text-xs text-white/25 mt-1 text-right">{form.bio.length}/160</div>
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="City, Country"
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none focus:border-purple-500/40" />
            </Field>
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => set('category', c.toLowerCase())}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={form.category === c.toLowerCase()
                      ? { background: '#a855f7', color: '#04040A' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Pronoun">
              <div className="flex gap-2 flex-wrap">
                {PRONOUNS.map(p => (
                  <button key={p} onClick={() => set('pronoun', p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={form.pronoun === p
                      ? { background: '#818cf8', color: '#04040A' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    {p}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {tab === 'social' && (
          <div className="space-y-3">
            <Field label="Website">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 focus-within:border-purple-500/40">
                <span className="text-white/25 text-xs flex-shrink-0">🌐</span>
                <input value={form.website} onChange={e => set('website', e.target.value)}
                  placeholder="https://yoursite.com"
                  className="flex-1 text-sm bg-transparent text-white placeholder-white/20 outline-none" />
              </div>
            </Field>
            <Field label="Twitter / X">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 focus-within:border-purple-500/40">
                <span className="text-white/25 text-xs flex-shrink-0">𝕏</span>
                <span className="text-white/20 text-sm">@</span>
                <input value={form.twitter} onChange={e => set('twitter', e.target.value)}
                  placeholder="handle"
                  className="flex-1 text-sm bg-transparent text-white placeholder-white/20 outline-none" />
              </div>
            </Field>
            <Field label="Instagram">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 focus-within:border-purple-500/40">
                <span className="text-white/25 text-xs flex-shrink-0">📸</span>
                <span className="text-white/20 text-sm">@</span>
                <input value={form.instagram} onChange={e => set('instagram', e.target.value)}
                  placeholder="handle"
                  className="flex-1 text-sm bg-transparent text-white placeholder-white/20 outline-none" />
              </div>
            </Field>
            <div className="p-3 rounded-xl border border-white/5 text-xs text-white/25"
              style={{ background: 'rgba(255,255,255,0.01)' }}>
              Your social links are public and visible on your profile.
            </div>
          </div>
        )}

        {tab === 'appearance' && (
          <div className="space-y-4">
            <Field label="Profile Color">
              <div className="flex gap-3 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => set('color', c)}
                    className="w-9 h-9 rounded-xl transition-all"
                    style={{ background: c, outline: form.color === c ? `3px solid white` : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </Field>
            <Field label="Preview">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/8"
                style={{ background: 'rgba(255,255,255,0.025)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl"
                  style={{ background: `${form.color}18`, color: form.color }}>{form.name[0]}</div>
                <div>
                  <div className="font-black text-white">{form.name}</div>
                  <div className="text-xs text-white/30">@{form.handle}</div>
                  <div className="text-xs mt-0.5" style={{ color: form.color }}>✓ Verified</div>
                </div>
              </div>
            </Field>
          </div>
        )}

        {/* Danger zone */}
        <div className="mt-8 pt-4 border-t border-white/5 space-y-2">
          <div className="text-xs text-white/20 uppercase tracking-widest">Danger Zone</div>
          <button onClick={deleteProfile}
            className="w-full py-3 rounded-xl text-xs font-bold text-red-400 border border-red-500/15 hover:border-red-500/30 transition-all"
            style={{ background: 'rgba(248,113,113,0.04)' }}>
            Request Account Deletion
          </button>
        </div>
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
