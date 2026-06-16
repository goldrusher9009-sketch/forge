'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NotifSetting {
  push: boolean
  email: boolean
  inApp: boolean
}

type Category = 'social' | 'token' | 'earnings' | 'platform' | 'marketing'

interface NotifGroup {
  id: Category
  icon: string
  label: string
  desc: string
  color: string
  items: { id: string; label: string }[]
}

const GROUPS: NotifGroup[] = [
  {
    id: 'social', icon: '👥', label: 'Social', desc: 'Follows, mentions, comments, reactions', color: '#818cf8',
    items: [
      { id: 'new_follower', label: 'New follower' },
      { id: 'mention',      label: 'Mentions & tags' },
      { id: 'comment',      label: 'Comments on your posts' },
      { id: 'reaction',     label: 'Post reactions' },
      { id: 'dm',           label: 'Direct messages' },
    ],
  },
  {
    id: 'token', icon: '🪙', label: 'Token', desc: 'Price alerts, buys, sells, tier changes', color: '#a855f7',
    items: [
      { id: 'token_buy',      label: 'Someone buys your token' },
      { id: 'token_sell',     label: 'Someone sells your token' },
      { id: 'price_milestone', label: 'Price milestones' },
      { id: 'tier_change',    label: 'Holder tier upgrades' },
      { id: 'staking_reward', label: 'Staking rewards earned' },
    ],
  },
  {
    id: 'earnings', icon: '💰', label: 'Earnings', desc: 'Ad revenue, payouts, referrals', color: '#22c55e',
    items: [
      { id: 'ad_revenue',   label: 'Ad revenue earned' },
      { id: 'payout_ready', label: 'Payout ready to claim' },
      { id: 'referral',     label: 'Referral bonuses' },
      { id: 'airdrop',      label: 'Token airdrops' },
    ],
  },
  {
    id: 'platform', icon: '🔔', label: 'Platform', desc: 'System updates, security alerts', color: '#f59e0b',
    items: [
      { id: 'security',     label: 'Security alerts' },
      { id: 'login',        label: 'New sign-in detected' },
      { id: 'product_news', label: 'Product updates' },
      { id: 'challenges',   label: 'New challenges & rewards' },
    ],
  },
  {
    id: 'marketing', icon: '📣', label: 'Marketing', desc: 'Promotional offers from VIVA', color: '#ec4899',
    items: [
      { id: 'promotions',  label: 'Special offers & discounts' },
      { id: 'weekly_recap', label: 'Weekly activity recap' },
    ],
  },
]

type SettingsMap = Record<string, Record<string, NotifSetting>>

function defaultSettings(): SettingsMap {
  const s: SettingsMap = {}
  for (const g of GROUPS) {
    s[g.id] = {}
    for (const item of g.items) {
      s[g.id][item.id] = {
        push:  g.id !== 'marketing',
        email: g.id === 'earnings' || g.id === 'platform',
        inApp: true,
      }
    }
  }
  return s
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsMap>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState<Category | null>('social')

  function toggle(cat: Category, itemId: string, channel: keyof NotifSetting) {
    setSettings(s => ({
      ...s,
      [cat]: {
        ...s[cat],
        [itemId]: { ...s[cat][itemId], [channel]: !s[cat][itemId][channel] },
      },
    }))
  }

  function toggleAll(cat: Category, channel: keyof NotifSetting, value: boolean) {
    setSettings(s => {
      const updated = { ...s[cat] }
      for (const k of Object.keys(updated)) {
        updated[k] = { ...updated[k], [channel]: value }
      }
      return { ...s, [cat]: updated }
    })
  }

  async function save() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white flex-1">Notification Settings</div>
          <button onClick={save} disabled={saving}
            className="px-3 py-1.5 rounded-xl text-xs font-black disabled:opacity-50"
            style={{ background: saved ? '#22c55e' : '#a855f7', color: '#04040A' }}>
            {saved ? '✓ Saved' : saving ? '…' : 'Save'}
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {/* Channel header */}
        <div className="flex justify-end gap-6 pr-1 text-xs text-white/25 font-semibold uppercase tracking-wider mb-1">
          <span>Push</span>
          <span>Email</span>
          <span>In-App</span>
        </div>

        {GROUPS.map(g => {
          const isOpen = expanded === g.id
          const catSettings = settings[g.id]
          const allPush = Object.values(catSettings).every(s => s.push)
          const allEmail = Object.values(catSettings).every(s => s.email)
          return (
            <div key={g.id} className="rounded-2xl border border-white/5 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              {/* Group header */}
              <button
                onClick={() => setExpanded(isOpen ? null : g.id)}
                className="w-full flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${g.color}12` }}>
                  {g.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm text-white/80">{g.label}</div>
                  <div className="text-xs text-white/25">{g.desc}</div>
                </div>
                {/* Group-level toggles */}
                <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                  <Toggle value={allPush} color={g.color} onChange={v => toggleAll(g.id, 'push', v)} />
                  <Toggle value={allEmail} color={g.color} onChange={v => toggleAll(g.id, 'email', v)} />
                  <Toggle value={true} color={g.color} onChange={() => {}} disabled />
                </div>
                <span className="text-white/20 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Items */}
              {isOpen && (
                <div className="border-t border-white/5">
                  {g.items.map(item => {
                    const s = catSettings[item.id]
                    return (
                      <div key={item.id}
                        className="flex items-center gap-3 px-4 py-2.5 border-b border-white/3 last:border-0">
                        <div className="flex-1 text-sm text-white/50 pl-11">{item.label}</div>
                        <div className="flex items-center gap-4">
                          <Toggle value={s.push} color={g.color} onChange={() => toggle(g.id, item.id, 'push')} />
                          <Toggle value={s.email} color={g.color} onChange={() => toggle(g.id, item.id, 'email')} />
                          <Toggle value={s.inApp} color={g.color} onChange={() => toggle(g.id, item.id, 'inApp')} />
                        </div>
                        <span className="w-5" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Quiet hours */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-3"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="font-bold text-sm text-white/80">🌙 Quiet Hours</div>
          <div className="text-xs text-white/30">Suppress push notifications during these hours</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/6 text-sm text-white/50 text-center">
              10:00 PM
            </div>
            <span className="text-white/20 text-sm">to</span>
            <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/6 text-sm text-white/50 text-center">
              7:00 AM
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-3.5 rounded-2xl font-black transition-all"
          style={{ background: saved ? '#22c55e' : '#a855f7', color: '#04040A' }}>
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

function Toggle({ value, color, onChange, disabled }: {
  value: boolean; color: string; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
      style={{ background: value ? color : 'rgba(255,255,255,0.08)', opacity: disabled ? 0.3 : 1 }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
        style={{ left: value ? '18px' : '2px' }} />
    </button>
  )
}
