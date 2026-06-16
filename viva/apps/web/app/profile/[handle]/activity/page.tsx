'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PROFILES: Record<string, { name: string; handle: string; color: string }> = {
  sovereign_v: { name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7' },
  mayafit:     { name: 'Maya Chen',   handle: 'mayafit',     color: '#22c55e' },
  jaxbeats:    { name: 'Jax Beats',   handle: 'jaxbeats',    color: '#ec4899' },
}

type ActivityType = 'all' | 'post' | 'token' | 'stake' | 'social' | 'earn'

const FILTERS: { id: ActivityType; label: string }[] = [
  { id: 'all',    label: 'All'       },
  { id: 'post',   label: 'Posts'     },
  { id: 'token',  label: 'Tokens'    },
  { id: 'stake',  label: 'Staking'   },
  { id: 'social', label: 'Social'    },
  { id: 'earn',   label: 'Earnings'  },
]

interface Activity {
  id: string
  type: ActivityType
  icon: string
  title: string
  subtitle: string
  ts: string
  value?: string
  valueColor?: string
  link?: string
}

const ACTIVITY: Activity[] = [
  { id: 'a1',  type: 'earn',   icon: '💰', title: 'Earned staking reward',           subtitle: 'Diamond tier — $SVRN',           ts: '2026-06-16T09:00:00Z', value: '+$42.80',   valueColor: '#22c55e' },
  { id: 'a2',  type: 'post',   icon: '✍️', title: 'Published a new post',            subtitle: '"Why I stake 90% of my tokens"', ts: '2026-06-16T08:30:00Z', link: '/feed/post1' },
  { id: 'a3',  type: 'social', icon: '👥', title: 'Gained 420 new followers',        subtitle: 'Past 24 hours',                  ts: '2026-06-16T07:00:00Z', value: '+420',      valueColor: '#a855f7' },
  { id: 'a4',  type: 'token',  icon: '📈', title: '$SVRN price hit $8.75',           subtitle: 'New all-time high',              ts: '2026-06-15T22:00:00Z', value: '+8.3%',     valueColor: '#22c55e' },
  { id: 'a5',  type: 'earn',   icon: '📢', title: 'Ad revenue payout',               subtitle: 'Acme Corp — Feed Post',          ts: '2026-06-15T18:00:00Z', value: '+$128.50',  valueColor: '#22c55e' },
  { id: 'a6',  type: 'social', icon: '🤝', title: 'Followed @mayafit',               subtitle: 'New connection',                 ts: '2026-06-15T16:00:00Z' },
  { id: 'a7',  type: 'post',   icon: '📊', title: 'Posted a poll',                   subtitle: '"What content do you want next?"', ts: '2026-06-15T14:00:00Z', link: '/feed/poll1' },
  { id: 'a8',  type: 'stake',  icon: '🔒', title: 'Staked 50 $SVRN',               subtitle: '90 days · Diamond tier',         ts: '2026-06-14T20:00:00Z', value: '35% APY',   valueColor: '#818cf8' },
  { id: 'a9',  type: 'token',  icon: '🛒', title: 'Bought 15 $MAYA',               subtitle: '@ $6.20 each',                   ts: '2026-06-14T12:00:00Z', value: '-$93.00',   valueColor: '#f87171' },
  { id: 'a10', type: 'earn',   icon: '🔗', title: 'Referral bonus earned',           subtitle: '5 new signups via your code',    ts: '2026-06-14T09:00:00Z', value: '+$25.00',   valueColor: '#22c55e' },
  { id: 'a11', type: 'post',   icon: '📈', title: 'Posted a trading signal',         subtitle: 'BTC Long · TP $110k',            ts: '2026-06-13T18:00:00Z', link: '/feed/sig1' },
  { id: 'a12', type: 'social', icon: '🏆', title: 'V-Score reached 900',             subtitle: 'Top 1% on VIVA',                 ts: '2026-06-13T12:00:00Z', value: '900',       valueColor: '#f59e0b' },
  { id: 'a13', type: 'token',  icon: '💸', title: 'Sold 8 $JAX',                    subtitle: '@ $4.50 each',                   ts: '2026-06-12T16:00:00Z', value: '+$36.00',   valueColor: '#22c55e' },
  { id: 'a14', type: 'stake',  icon: '🏅', title: 'Staking reward unlocked',        subtitle: '$MAYA Gold tier',                ts: '2026-06-09T09:00:00Z', value: '+$18.60',   valueColor: '#22c55e' },
  { id: 'a15', type: 'social', icon: '🎙️', title: 'Hosted a room: "DeFi Alpha"',    subtitle: '240 listeners',                  ts: '2026-06-08T20:00:00Z', link: '/rooms/r1' },
]

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function ProfileActivityPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? PROFILES.sovereign_v

  const [filter, setFilter] = useState<ActivityType>('all')

  const filtered = ACTIVITY.filter(a => filter === 'all' || a.type === filter)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Activity</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
          <button onClick={() => router.push(`/profile/${handle}`)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: `${profile.color}15`, color: profile.color }}>
            Profile →
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={filter === f.id
                ? { background: profile.color, color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-3 space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/20 text-sm">No activity yet</div>
        )}
        {filtered.map(a => (
          <button key={a.id}
            onClick={() => a.link ? router.push(a.link) : undefined}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl border border-white/4 text-left transition-all ${a.link ? 'hover:border-white/8 hover:bg-white/3' : 'cursor-default'}`}
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {a.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white/80 truncate">{a.title}</div>
              <div className="text-xs text-white/30 truncate">{a.subtitle}</div>
            </div>

            {/* Right */}
            <div className="text-right flex-shrink-0">
              {a.value && (
                <div className="font-black text-sm" style={{ color: a.valueColor ?? 'rgba(255,255,255,0.5)' }}>
                  {a.value}
                </div>
              )}
              <div className="text-xs text-white/20">{fmtRelative(a.ts)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
