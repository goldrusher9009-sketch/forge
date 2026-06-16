'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Channel = 'push' | 'email' | 'inApp'

interface NotifSetting {
  id: string
  label: string
  desc: string
  push: boolean
  email: boolean
  inApp: boolean
}

const GROUPS = [
  {
    label: 'Token Activity',
    icon: '💎',
    color: '#a855f7',
    items: [
      { id: 'token_price', label: 'Price movements', desc: 'When tokens you hold move ±5% in 1h', push: true,  email: false, inApp: true  },
      { id: 'token_buy',   label: 'New investors',   desc: 'When someone buys your token',        push: true,  email: false, inApp: true  },
      { id: 'tier_unlock', label: 'Tier upgrades',   desc: 'When a holder reaches a new tier',    push: false, email: false, inApp: true  },
      { id: 'reward_paid', label: 'Rewards paid',    desc: 'Monthly staking rewards distributed', push: true,  email: true,  inApp: true  },
    ] as NotifSetting[],
  },
  {
    label: 'Social',
    icon: '💬',
    color: '#22c55e',
    items: [
      { id: 'new_follow',  label: 'New followers',   desc: 'Someone followed your profile',    push: true,  email: false, inApp: true  },
      { id: 'mention',     label: 'Mentions',        desc: 'Someone mentioned @you in a post', push: true,  email: false, inApp: true  },
      { id: 'comment',     label: 'Post comments',   desc: 'Comments on your posts',           push: false, email: false, inApp: true  },
      { id: 'like',        label: 'Likes',           desc: 'Likes on your posts',              push: false, email: false, inApp: false },
      { id: 'repost',      label: 'Reposts',         desc: 'When someone reposts your content', push: false, email: false, inApp: true  },
    ] as NotifSetting[],
  },
  {
    label: 'Advertising',
    icon: '📣',
    color: '#f59e0b',
    items: [
      { id: 'ad_request',  label: 'Ad requests',     desc: 'Brands want to advertise on your profile', push: true,  email: true,  inApp: true  },
      { id: 'ad_live',     label: 'Campaigns live',  desc: 'Your campaigns go live',                   push: true,  email: false, inApp: true  },
      { id: 'ad_revenue',  label: 'Revenue share',   desc: 'Ad revenue credited to your account',      push: true,  email: true,  inApp: true  },
    ] as NotifSetting[],
  },
  {
    label: 'Rooms & DAO',
    icon: '🎙',
    color: '#818cf8',
    items: [
      { id: 'room_start',  label: 'Room goes live',  desc: 'Creators you follow start a room',   push: true,  email: false, inApp: true  },
      { id: 'dao_vote',    label: 'New proposals',   desc: 'New DAO proposals in your tokens',   push: true,  email: true,  inApp: true  },
      { id: 'dao_result',  label: 'Proposal results',desc: 'DAO votes you participated in end',  push: true,  email: false, inApp: true  },
    ] as NotifSetting[],
  },
  {
    label: 'Platform',
    icon: '⚙️',
    color: '#94a3b8',
    items: [
      { id: 'security',    label: 'Security alerts',  desc: 'Login from new device, etc.',       push: true,  email: true,  inApp: true  },
      { id: 'product_news',label: 'Product updates',  desc: 'New features and announcements',    push: false, email: true,  inApp: false },
      { id: 'weekly_digest',label: 'Weekly digest',   desc: 'Summary of your token performance', push: false, email: true,  inApp: false },
    ] as NotifSetting[],
  },
]

const CHANNEL_LABELS: Record<Channel, { label: string; icon: string }> = {
  push:  { label: 'Push',  icon: '🔔' },
  email: { label: 'Email', icon: '📧' },
  inApp: { label: 'In-app', icon: '💬' },
}

export default function NotificationSettingsPage() {
  const router = useRouter()

  type GroupSettings = Record<string, NotifSetting>
  const [settings, setSettings] = useState<GroupSettings>(() => {
    const map: GroupSettings = {}
    GROUPS.forEach(g => g.items.forEach(i => { map[i.id] = { ...i } }))
    return map
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quietHours, setQuietHours] = useState(true)
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('08:00')

  function toggle(id: string, channel: Channel) {
    setSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], [channel]: !prev[id][channel] },
    }))
    setSaved(false)
  }

  function toggleAll(channel: Channel, value: boolean) {
    setSettings(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(id => { next[id] = { ...next[id], [channel]: value } })
      return next
    })
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const channels: Channel[] = ['push', 'email', 'inApp']

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
          <div className="flex-1 font-bold text-white">Notification Settings</div>
          <button onClick={save} disabled={saving}
            className="px-4 py-1.5 rounded-lg text-xs font-black disabled:opacity-50"
            style={{ background: saved ? '#22c55e' : '#a855f7', color: '#04040A' }}>
            {saving ? '…' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* Bulk toggles */}
        <div className="p-4 rounded-2xl border border-white/6 space-y-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Quick Settings</div>
          <div className="flex gap-2">
            {channels.map(ch => (
              <div key={ch} className="flex-1 space-y-1.5">
                <div className="text-xs text-center text-white/30">{CHANNEL_LABELS[ch].icon} {CHANNEL_LABELS[ch].label}</div>
                <div className="flex gap-1">
                  <button onClick={() => toggleAll(ch, true)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>All</button>
                  <button onClick={() => toggleAll(ch, false)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>None</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiet hours */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-white/80">Quiet Hours</div>
              <div className="text-xs text-white/30">Mute push notifications during sleep</div>
            </div>
            <button onClick={() => setQuietHours(!quietHours)}
              className="relative w-10 h-5 rounded-full transition-all"
              style={{ background: quietHours ? '#a855f7' : 'rgba(255,255,255,0.1)' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: quietHours ? '22px' : '2px' }} />
            </button>
          </div>
          {quietHours && (
            <div className="flex gap-3 items-center text-xs">
              <div className="flex-1">
                <div className="text-white/25 mb-1">From</div>
                <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-white text-sm bg-white/5 border border-white/8 outline-none" />
              </div>
              <div className="text-white/20 mt-4">→</div>
              <div className="flex-1">
                <div className="text-white/25 mb-1">Until</div>
                <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-white text-sm bg-white/5 border border-white/8 outline-none" />
              </div>
            </div>
          )}
        </div>

        {/* Per-group settings */}
        {GROUPS.map(group => (
          <div key={group.label} className="rounded-2xl border border-white/6 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <span className="text-base">{group.icon}</span>
              <span className="font-black text-sm" style={{ color: group.color }}>{group.label}</span>
            </div>
            {/* Column headers */}
            <div className="flex items-center px-4 py-2 border-b border-white/4">
              <div className="flex-1" />
              {channels.map(ch => (
                <div key={ch} className="w-12 text-center">
                  <div className="text-xs text-white/20">{CHANNEL_LABELS[ch].icon}</div>
                </div>
              ))}
            </div>
            {group.items.map((item, i) => {
              const s = settings[item.id]
              return (
                <div key={item.id} className={`flex items-center px-4 py-3 ${i < group.items.length - 1 ? 'border-b border-white/4' : ''}`}>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-sm font-semibold text-white/75">{item.label}</div>
                    <div className="text-xs text-white/25">{item.desc}</div>
                  </div>
                  {channels.map(ch => (
                    <div key={ch} className="w-12 flex justify-center">
                      <button onClick={() => toggle(item.id, ch)}
                        className="relative w-8 h-4 rounded-full transition-all"
                        style={{ background: s[ch] ? group.color : 'rgba(255,255,255,0.08)' }}>
                        <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                          style={{ left: s[ch] ? '17px' : '2px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}

        <button onClick={() => router.push('/notifications')}
          className="w-full py-3 rounded-xl text-xs text-white/25 hover:text-white/50 transition-colors">
          ← Back to Notifications
        </button>
      </div>
    </div>
  )
}
