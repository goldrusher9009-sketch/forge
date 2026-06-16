'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PrivacySetting {
  id: string
  label: string
  desc: string
  category: string
}

const SETTINGS: PrivacySetting[] = [
  // Profile visibility
  { id: 'profile_public',      label: 'Public profile',           desc: 'Anyone can view your profile page',             category: 'Profile' },
  { id: 'show_holdings',       label: 'Show token holdings',      desc: 'Display your token portfolio on your profile',  category: 'Profile' },
  { id: 'show_staking',        label: 'Show staking positions',   desc: 'Show staked amounts and tiers publicly',        category: 'Profile' },
  { id: 'show_tips_received',  label: 'Show tips received',       desc: 'Display total tips on your public profile',     category: 'Profile' },
  { id: 'show_online',         label: 'Show online status',       desc: 'Let others see when you\'re active',            category: 'Profile' },
  // Activity
  { id: 'activity_feed',       label: 'Activity feed visible',    desc: 'Others can see your likes and follows',         category: 'Activity' },
  { id: 'search_indexing',     label: 'Appear in search',         desc: 'Your profile appears in VIVA search results',   category: 'Activity' },
  { id: 'indexing_external',   label: 'External search engines',  desc: 'Allow Google / Bing to index your profile',     category: 'Activity' },
  // Messaging
  { id: 'dms_everyone',        label: 'DMs from everyone',        desc: 'Allow anyone to message you (not just holders)', category: 'Messages' },
  { id: 'read_receipts',       label: 'Read receipts',            desc: 'Let senders see when you\'ve read their messages', category: 'Messages' },
  // Data
  { id: 'analytics_sharing',   label: 'Analytics data sharing',   desc: 'Help improve VIVA by sharing usage analytics',  category: 'Data' },
  { id: 'personalization',     label: 'Personalized experience',  desc: 'Use your activity to personalize recommendations', category: 'Data' },
  { id: 'ad_targeting',        label: 'Targeted ads',             desc: 'See ads relevant to your interests',            category: 'Data' },
]

const DEFAULTS: Record<string, boolean> = {
  profile_public: true, show_holdings: true, show_staking: false, show_tips_received: true,
  show_online: true, activity_feed: true, search_indexing: true, indexing_external: false,
  dms_everyone: false, read_receipts: true, analytics_sharing: true, personalization: true, ad_targeting: false,
}

const CATEGORIES = ['Profile', 'Activity', 'Messages', 'Data']
const CAT_EMOJI: Record<string, string> = { Profile: '👤', Activity: '⚡', Messages: '💬', Data: '📊' }

export default function SettingsPrivacyPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, boolean>>({ ...DEFAULTS })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function save() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const byCategory = (cat: string) => SETTINGS.filter(s => s.category === cat)

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="font-black text-white">Privacy</div>
            <div className="text-xs text-white/30">Control who sees what</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Quick privacy mode */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Quick Mode</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Open',    desc: 'Max visibility', icon: '🌐', action: () => setSettings({ ...DEFAULTS, profile_public: true, activity_feed: true, search_indexing: true }) },
              { label: 'Balanced', desc: 'Default',       icon: '⚖️', action: () => setSettings({ ...DEFAULTS }) },
              { label: 'Private', desc: 'Min visibility', icon: '🔒', action: () => setSettings({ ...Object.fromEntries(SETTINGS.map(s => [s.id, false])), profile_public: true }) },
            ].map(m => (
              <button key={m.label} onClick={m.action}
                className="p-3 rounded-xl border border-white/5 text-center"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-xl mb-1">{m.icon}</div>
                <div className="text-xs font-bold text-white/70">{m.label}</div>
                <div className="text-xs text-white/25">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {CATEGORIES.map(cat => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{CAT_EMOJI[cat]}</span>
              <div className="font-black text-sm text-white/60 uppercase tracking-wider">{cat}</div>
            </div>
            <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.018)' }}>
              {byCategory(cat).map((s, idx) => (
                <div key={s.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${idx < byCategory(cat).length - 1 ? 'border-b border-white/4' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white/75">{s.label}</div>
                    <div className="text-xs text-white/25 mt-0.5">{s.desc}</div>
                  </div>
                  <button onClick={() => toggle(s.id)}
                    className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
                    style={{ background: settings[s.id] ? '#a855f7' : 'rgba(255,255,255,0.1)' }}>
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: settings[s.id] ? '22px' : '2px' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Blocked users */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🚫</span>
            <div className="font-black text-sm text-white/60 uppercase tracking-wider">Blocked & Muted</div>
          </div>
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.018)' }}>
            {[
              { label: 'Blocked users',   count: 2,  path: '/settings/blocked'  },
              { label: 'Muted accounts',  count: 5,  path: '/settings/muted'    },
              { label: 'Muted keywords',  count: 12, path: '/settings/keywords' },
            ].map((item, idx) => (
              <button key={item.label} onClick={() => router.push(item.path)}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${idx < 2 ? 'border-b border-white/4' : ''}`}>
                <span className="text-sm text-white/70">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30 font-bold">{item.count}</span>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-white/25">
                    <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data download */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-sm font-bold text-white/70 mb-1">Your Data</div>
          <div className="text-xs text-white/30 mb-3">Download an archive of your VIVA account data.</div>
          <button className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            Request Data Export →
          </button>
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={save} disabled={saving}
          className="w-full py-3.5 rounded-xl font-black text-sm disabled:opacity-60"
          style={{ background: saved ? '#22c55e' : '#a855f7', color: '#04040A' }}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Privacy Settings'}
        </button>
      </div>
    </div>
  )
}
