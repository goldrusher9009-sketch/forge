'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NotifSetting { key: string; label: string; desc: string; on: boolean }
interface NotifGroup   { id: string; title: string; icon: string; color: string; settings: NotifSetting[] }

const DEFAULT_GROUPS: NotifGroup[] = [
  { id: 'social', title: 'Social', icon: '👥', color: '#a855f7', settings: [
    { key: 'new_follower', label: 'New Follower',   desc: 'When someone follows you',            on: true  },
    { key: 'mention',      label: 'Mentions',       desc: 'When someone mentions you in a post', on: true  },
    { key: 'comment',      label: 'Comments',       desc: 'Comments on your posts',              on: true  },
    { key: 'like',         label: 'Likes',          desc: 'Likes on your posts',                 on: false },
    { key: 'reply',        label: 'Replies',        desc: 'Replies to your comments',            on: true  },
  ]},
  { id: 'tokens', title: 'Tokens & Trading', icon: '💎', color: '#22c55e', settings: [
    { key: 'token_buy',    label: 'Token Purchase', desc: 'When someone buys your tokens',       on: true  },
    { key: 'token_price',  label: 'Price Alerts',   desc: '10%+ price moves in your holdings',  on: true  },
    { key: 'stake_reward', label: 'Staking Rewards',desc: 'Weekly staking reward distributions', on: true  },
    { key: 'tier_change',  label: 'Tier Changes',   desc: 'When your staking tier changes',     on: true  },
    { key: 'trade_fill',   label: 'Trade Fills',    desc: 'When your limit orders fill',         on: false },
  ]},
  { id: 'content', title: 'Content', icon: '📝', color: '#f59e0b', settings: [
    { key: 'new_post',       label: 'New Posts',         desc: 'Posts from creators you follow',      on: true  },
    { key: 'exclusive_drop', label: 'Exclusive Drops',   desc: 'Token-gated content from your stack', on: true  },
    { key: 'collection_add', label: 'Collection Updates',desc: 'New items in followed collections',   on: false },
  ]},
  { id: 'rooms', title: 'Rooms & Events', icon: '🎙', color: '#818cf8', settings: [
    { key: 'room_live',      label: 'Room Goes Live',  desc: 'Followed creators start a room',    on: true },
    { key: 'event_reminder', label: 'Event Reminders', desc: "30 min before events you RSVP'd",  on: true },
    { key: 'room_invite',    label: 'Room Invites',    desc: 'Invited to join a live room',       on: true },
  ]},
  { id: 'platform', title: 'Platform', icon: '⚙️', color: '#94a3b8', settings: [
    { key: 'weekly_digest',   label: 'Weekly Digest',   desc: 'Your weekly performance summary',   on: true },
    { key: 'product_updates', label: 'Product Updates', desc: 'New features and announcements',    on: true },
    { key: 'security',        label: 'Security Alerts', desc: 'Login attempts and security events', on: true },
  ]},
]

type DeliveryChannel = 'push' | 'email' | 'sms'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState(DEFAULT_GROUPS)
  const [channels, setChannels] = useState<Record<DeliveryChannel, boolean>>({ push: true, email: true, sms: false })
  const [saved, setSaved] = useState(false)

  function toggle(groupId: string, key: string) {
    setGroups(prev => prev.map(g => g.id === groupId
      ? { ...g, settings: g.settings.map(s => s.key === key ? { ...s, on: !s.on } : s) } : g))
    setSaved(false)
  }
  function toggleAll(groupId: string, on: boolean) {
    setGroups(prev => prev.map(g => g.id === groupId
      ? { ...g, settings: g.settings.map(s => ({ ...s, on })) } : g))
    setSaved(false)
  }
  async function save() {
    setSaved(false)
    await new Promise(r => setTimeout(r, 600))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const totalOn  = groups.reduce((acc, g) => acc + g.settings.filter(s => s.on).length, 0)
  const totalAll = groups.reduce((acc, g) => acc + g.settings.length, 0)

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
            <div className="font-black text-white">Notification Settings</div>
            <div className="text-xs text-white/30">{totalOn} of {totalAll} enabled</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Delivery Channels</div>
          <div className="space-y-3">
            {([{ key: 'push' as DeliveryChannel, label: 'Push Notifications', icon: '📱' },
               { key: 'email' as DeliveryChannel, label: 'Email', icon: '✉️' },
               { key: 'sms' as DeliveryChannel, label: 'SMS', icon: '💬' }]).map(ch => (
              <div key={ch.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{ch.icon}</span>
                  <span className="text-sm text-white/65">{ch.label}</span>
                </div>
                <button onClick={() => setChannels(prev => ({ ...prev, [ch.key]: !prev[ch.key] }))}
                  className="w-10 h-6 rounded-full relative flex-shrink-0"
                  style={{ background: channels[ch.key] ? '#a855f7' : 'rgba(255,255,255,0.1)' }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                    style={{ left: channels[ch.key] ? '18px' : '2px' }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {groups.map(g => {
          const allOn = g.settings.every(s => s.on)
          const anyOn = g.settings.some(s => s.on)
          return (
            <div key={g.id} className="rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/4"
                style={{ background: 'rgba(255,255,255,0.025)' }}>
                <div className="flex items-center gap-2">
                  <span>{g.icon}</span>
                  <span className="font-black text-sm text-white/80">{g.title}</span>
                  <span className="text-xs text-white/25">{g.settings.filter(s => s.on).length}/{g.settings.length}</span>
                </div>
                <button onClick={() => toggleAll(g.id, !allOn)} className="text-xs font-bold"
                  style={{ color: anyOn ? '#f87171' : g.color }}>
                  {allOn ? 'All off' : 'All on'}
                </button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.012)' }}>
                {g.settings.map((s, i) => (
                  <div key={s.key} className={`flex items-center justify-between px-4 py-3 ${i < g.settings.length - 1 ? 'border-b border-white/3' : ''}`}>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-sm text-white/70 font-semibold">{s.label}</div>
                      <div className="text-xs text-white/25">{s.desc}</div>
                    </div>
                    <button onClick={() => toggle(g.id, s.key)}
                      className="w-9 h-5 rounded-full relative flex-shrink-0"
                      style={{ background: s.on ? g.color : 'rgba(255,255,255,0.08)' }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                        style={{ left: s.on ? '17px' : '2px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={save} className="w-full py-3 rounded-xl font-black text-sm"
          style={{ background: saved ? '#22c55e' : '#a855f7', color: '#04040A' }}>
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
