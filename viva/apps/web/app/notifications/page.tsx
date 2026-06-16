'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type NotifType = 'trade' | 'tip' | 'follow' | 'reward' | 'alert' | 'social' | 'dao' | 'system'

interface Notif {
  id: string
  type: NotifType
  title: string
  body: string
  ago: string
  read: boolean
  href?: string
  actorColor?: string
}

const NOTIFS: Notif[] = [
  { id:'n1',  type:'trade',  title:'Buy order filled',           body:'Bought 10 $SVRN @ $8.75',                 ago:'2m',    read:false, href:'/wallet/history',             actorColor:'#a855f7' },
  { id:'n2',  type:'tip',    title:'You received a tip!',        body:'@atlas_k tipped you 40 $SVRN ($350)',      ago:'6m',    read:false, href:'/creator/sovereign_v/tips',   actorColor:'#818cf8' },
  { id:'n3',  type:'follow', title:'New follower',               body:'@lily_p started following you',            ago:'14m',   read:false, href:'/profile/lily_p',             actorColor:'#f59e0b' },
  { id:'n4',  type:'reward', title:'Staking reward distributed', body:'+$12.40 from $SVRN staking (22% APY)',     ago:'1h',    read:false, href:'/wallet/staking',             actorColor:'#22c55e' },
  { id:'n5',  type:'dao',    title:'New governance proposal',    body:'"Reduce lock period to 60 days" is live',  ago:'2h',    read:false, href:'/dao/vote/p1',                actorColor:'#818cf8' },
  { id:'n6',  type:'alert',  title:'$SVRN price alert',          body:'$SVRN crossed $8.75 (+5%)',                ago:'3h',    read:true,  href:'/tokens/SVRN/chart',          actorColor:'#a855f7' },
  { id:'n7',  type:'social', title:'Your post is trending',      body:'"BTC accumulation zone" hit 800+ likes',   ago:'4h',    read:true,  href:'/feed/p1'                                       },
  { id:'n8',  type:'follow', title:'New follower',               body:'@max_t started following you',             ago:'5h',    read:true,  href:'/profile/max_t',              actorColor:'#ec4899' },
  { id:'n9',  type:'trade',  title:'Token listed for sale',      body:'@marco_v listed 8 $SVRN @ $8.90',         ago:'5h',    read:true,  href:'/tokens/SVRN/activity',       actorColor:'#f87171' },
  { id:'n10', type:'system', title:'V-Score updated',            body:'Your V-Score is now 9,840 (+120)',          ago:'6h',    read:true,  href:'/profile/sovereign_v'                           },
  { id:'n11', type:'reward', title:'Referral bonus earned',      body:'+$18.50 from @jade_l referral signup',     ago:'1d',    read:true,  href:'/wallet/earn',                actorColor:'#a855f7' },
  { id:'n12', type:'tip',    title:'You received a tip!',        body:'@luna_w tipped you 15 $SVRN ($131.25)',    ago:'1d',    read:true,  href:'/creator/sovereign_v/tips',   actorColor:'#f87171' },
]

const TYPE_ICON: Record<NotifType, string>  = { trade:'💹', tip:'💸', follow:'👤', reward:'⭐', alert:'🔔', social:'🔥', dao:'🗳', system:'⚙' }
const TYPE_COLOR: Record<NotifType, string> = {
  trade:'#22c55e', tip:'#ec4899', follow:'#818cf8', reward:'#f59e0b',
  alert:'#a855f7', social:'#f87171', dao:'#818cf8', system:'rgba(255,255,255,0.3)',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState(NOTIFS)
  const [filter, setFilter] = useState<'all' | 'unread' | NotifType>('all')

  const unread = notifs.filter(n => !n.read).length

  const visible = notifs.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter !== 'all') return n.type === filter
    return true
  })

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const FILTER_TABS = [
    { key:'all',    label:'All'     },
    { key:'unread', label:`Unread ${unread > 0 ? `(${unread})` : ''}` },
    { key:'trade',  label:'Trades'  },
    { key:'social', label:'Social'  },
    { key:'reward', label:'Rewards' },
    { key:'dao',    label:'DAO'     },
  ] as const

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 font-black text-white">Notifications</div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-white/30 font-bold">Mark all read</button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key as any)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === t.key ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="divide-y divide-white/5">
        {visible.length === 0 && (
          <div className="text-center py-16 text-white/25">All caught up ✓</div>
        )}
        {visible.map(n => (
          <button key={n.id}
            onClick={() => { markRead(n.id); if (n.href) router.push(n.href) }}
            className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
            style={{ background: n.read ? 'transparent' : 'rgba(168,85,247,0.03)' }}>
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
              style={{ background: `${TYPE_COLOR[n.type]}12` }}>
              {TYPE_ICON[n.type]}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-sm text-white/85">{n.title}</span>
                <span className="text-xs text-white/20 flex-shrink-0">{n.ago}</span>
              </div>
              <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{n.body}</div>
            </div>
            {/* Unread dot */}
            {!n.read && (
              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: '#a855f7' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
