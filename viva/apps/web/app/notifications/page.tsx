'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { notifications as notifApi } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────
type NType = 'like' | 'comment' | 'invest' | 'stake' | 'follow' | 'system' | 'yield'

interface Notif {
  id: string
  type: NType
  actor: string
  handle: string
  avatar: string
  body: string
  time: string
  read: boolean
  link?: string
  amount?: number
}

// ── Mock data ─────────────────────────────────────────────
const MOCK: Notif[] = [
  { id:'1',  type:'invest',  actor:'Maya Chen',     handle:'mayafit',     avatar:'MC', body:'invested $500 in your profile',             time:'2m ago',  read:false, link:'/profile/you', amount:500  },
  { id:'2',  type:'like',    actor:'Alex Rivera',   handle:'alexribs',    avatar:'AR', body:'liked your post about morning routines',     time:'5m ago',  read:false, link:'/feed'         },
  { id:'3',  type:'follow',  actor:'Sara Kim',      handle:'sarakim',     avatar:'SK', body:'started following you',                      time:'12m ago', read:false, link:'/profile/sarakim' },
  { id:'4',  type:'yield',   actor:'VIVA Protocol', handle:'viva',        avatar:'VP', body:'Monthly staking yield: $36.67 from MAYA',    time:'1h ago',  read:false, link:'/wallet', amount:36.67 },
  { id:'5',  type:'comment', actor:'Joe Martinez',  handle:'joemartinez', avatar:'JM', body:'commented: "This is exactly what I needed"', time:'2h ago',  read:true,  link:'/feed'         },
  { id:'6',  type:'stake',   actor:'Zena Okafor',   handle:'zenaokafor',  avatar:'ZO', body:'staked 2000 tokens at Gold tier',            time:'3h ago',  read:true,  link:'/wallet', amount:2000 },
  { id:'7',  type:'invest',  actor:'Mike Thompson', handle:'mikethompson',avatar:'MT', body:'invested $200 in your profile',              time:'5h ago',  read:true,  link:'/profile/you', amount:200  },
  { id:'8',  type:'like',    actor:'Priya Nair',    handle:'priyanair',   avatar:'PN', body:'liked your photo',                           time:'8h ago',  read:true,  link:'/feed'         },
  { id:'9',  type:'follow',  actor:'Carlos Mendez', handle:'carlosmendez',avatar:'CM', body:'started following you',                     time:'12h ago', read:true,  link:'/profile/carlosmendez' },
  { id:'10', type:'system',  actor:'VIVA',          handle:'viva',        avatar:'V',  body:'Your V-Score increased to 847 ✦',            time:'1d ago',  read:true                         },
  { id:'11', type:'invest',  actor:'Lin Wei',       handle:'linwei',      avatar:'LW', body:'invested $1,000 in your profile',            time:'2d ago',  read:true,  link:'/wallet', amount:1000 },
  { id:'12', type:'comment', actor:'Amara Osei',    handle:'amaraosei',   avatar:'AO', body:'commented: "Love your health journey!"',     time:'2d ago',  read:true,  link:'/feed'         },
]

// ── Icon/color per type ───────────────────────────────────
const TYPE_META: Record<NType, { icon: string; color: string; label: string }> = {
  like:    { icon: '♥',  color: '#e11d48', label: 'Likes'     },
  comment: { icon: '◉',  color: '#0891b2', label: 'Comments'  },
  invest:  { icon: '↗',  color: '#f59e0b', label: 'Invest'    },
  stake:   { icon: '⬡',  color: '#a855f7', label: 'Staking'   },
  follow:  { icon: '◈',  color: '#059669', label: 'Followers' },
  system:  { icon: '✦',  color: '#7c3aed', label: 'VIVA'      },
  yield:   { icon: '◎',  color: '#22c55e', label: 'Yield'     },
}

type Tab = 'all' | NType

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',     label: 'All'      },
  { id: 'invest',  label: '↗ Invest' },
  { id: 'stake',   label: '⬡ Stake'  },
  { id: 'follow',  label: '◈ Follow' },
  { id: 'like',    label: '♥ Likes'  },
  { id: 'yield',   label: '◎ Yield'  },
]

// ── Main ──────────────────────────────────────────────────
export default function NotificationsPage() {
  const [tab, setTab]         = useState<Tab>('all')
  const [notifs, setNotifs]   = useState<Notif[]>(MOCK)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    notifApi.list?.()?.then?.((res: any[]) => {
      if (!res?.length) return
      const mapped: Notif[] = res.map((n: any, i: number) => ({
        id:     String(n.id ?? i),
        type:   (n.type ?? 'system') as NType,
        actor:  n.sender?.name ?? 'VIVA',
        handle: n.sender?.handle ?? 'viva',
        avatar: (n.sender?.name ?? 'V').slice(0, 2).toUpperCase(),
        body:   n.content ?? n.message ?? '',
        time:   n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : '',
        read:   !!n.read,
        link:   n.link,
        amount: n.amount,
      }))
      setNotifs(mapped)
    }).catch(() => {})
  }, [])

  if (!mounted) return null

  const filtered = tab === 'all' ? notifs : notifs.filter(n => n.type === tab)
  const unread   = notifs.filter(n => !n.read).length

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    notifApi.markAllRead?.()?.catch?.(() => {})
  }

  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  // Financial summary for current month
  const investTotal = MOCK.filter(n => n.type === 'invest').reduce((s, n) => s + (n.amount ?? 0), 0)
  const yieldTotal  = MOCK.filter(n => n.type === 'yield').reduce((s, n) => s + (n.amount ?? 0), 0)
  const newInvestors = new Set(MOCK.filter(n => n.type === 'invest').map(n => n.handle)).size

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3"
        style={{ background: 'rgba(4,4,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">Notifications</span>
            {unread > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(124,58,237,0.25)', color: '#a855f7' }}>
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="text-xs transition-opacity"
              style={{ opacity: 0.5 }}
              onMouseEnter={e => (e.currentTarget.style.opacity='1')}
              onMouseLeave={e => (e.currentTarget.style.opacity='0.5')}>
              Mark all read
            </button>
          )}
        </div>

        {/* Tab scroll */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={tab === t.id
                ? { background: 'rgba(124,58,237,0.25)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-1.5">

        {/* Financial summary banner */}
        {(tab === 'all' || tab === 'invest' || tab === 'yield') && (
          <div className="rounded-xl px-4 py-3 mb-3"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ opacity: 0.5 }}>This Month · Your Profile as Asset</p>
            <div className="flex gap-5">
              <div>
                <p className="text-xs opacity-40">Invested in you</p>
                <p className="text-lg font-bold" style={{ color: '#f59e0b' }}>${investTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs opacity-40">Investors</p>
                <p className="text-lg font-bold">{newInvestors}</p>
              </div>
              <div>
                <p className="text-xs opacity-40">Yield paid</p>
                <p className="text-lg font-bold" style={{ color: '#22c55e' }}>${yieldTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 opacity-30">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-sm">No {tab === 'all' ? '' : tab} notifications yet</p>
          </div>
        )}

        {filtered.map(n => {
          const meta = TYPE_META[n.type] ?? TYPE_META.system

          const card = (
            <div
              onClick={() => markRead(n.id)}
              className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer"
              style={{
                background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(124,58,237,0.07)',
                border: `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.18)'}`,
              }}>

              {/* Avatar + badge */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: `${meta.color}18`, border: `1.5px solid ${meta.color}35`, color: meta.color }}>
                  {n.avatar}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: meta.color, fontSize: '0.5rem' }}>
                  {meta.icon}
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-semibold">{n.actor}</span>
                  {' '}
                  <span style={{ opacity: 0.7 }}>{n.body}</span>
                  {n.amount != null && (
                    <span className="ml-1 font-bold" style={{ color: meta.color }}>
                      ${n.amount.toLocaleString()}
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ opacity: 0.35 }}>{n.time}</p>
              </div>

              {/* Unread dot */}
              {!n.read && (
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                  style={{ background: '#a855f7' }} />
              )}
            </div>
          )

          return n.link
            ? <Link key={n.id} href={n.link}>{card}</Link>
            : <div key={n.id}>{card}</div>
        })}
      </div>
    </div>
  )
}
