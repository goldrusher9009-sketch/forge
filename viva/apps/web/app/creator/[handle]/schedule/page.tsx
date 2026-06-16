'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CREATOR_DATA: Record<string, { name: string; color: string; tokenSymbol: string }> = {
  sovereign_v: { name:'Sovereign V', color:'#a855f7', tokenSymbol:'SVRN' },
  mayafit:     { name:'Maya Chen',   color:'#22c55e', tokenSymbol:'MAYA' },
  jaxbeats:    { name:'Jax Beats',  color:'#ec4899', tokenSymbol:'JAX'  },
}

type ContentType = 'post' | 'live' | 'analysis' | 'tutorial' | 'ama' | 'drop'
type Visibility  = 'public' | 'holders' | 'diamond'

interface ScheduledItem {
  id: string
  title: string
  type: ContentType
  visibility: Visibility
  date: string
  time: string
  dayLabel: string
  minTokens?: number
  teaser?: string
}

const SCHEDULE: Record<string, ScheduledItem[]> = {
  sovereign_v: [
    { id:'s1', title:'BTC weekly close analysis',       type:'analysis',  visibility:'public',  date:'Jun 16', time:'21:00', dayLabel:'Mon', teaser:'Watching this key resistance level closely' },
    { id:'s2', title:'DeFi gem deep dive — live',       type:'live',      visibility:'holders', date:'Jun 17', time:'19:00', dayLabel:'Tue', minTokens:10 },
    { id:'s3', title:'Portfolio update post',            type:'post',      visibility:'public',  date:'Jun 18', time:'12:00', dayLabel:'Wed' },
    { id:'s4', title:'Diamond AMA session',              type:'ama',       visibility:'diamond', date:'Jun 19', time:'20:00', dayLabel:'Thu', minTokens:100 },
    { id:'s5', title:'New signal alert drop',            type:'drop',      visibility:'holders', date:'Jun 20', time:'09:00', dayLabel:'Fri', minTokens:10 },
    { id:'s6', title:'Weekend macro read',               type:'analysis',  visibility:'public',  date:'Jun 22', time:'10:00', dayLabel:'Sun' },
    { id:'s7', title:'Tutorial: Reading on-chain data',  type:'tutorial',  visibility:'holders', date:'Jun 23', time:'18:00', dayLabel:'Mon', minTokens:10 },
  ],
  mayafit: [
    { id:'s1', title:'Full body HIIT — live',           type:'live',      visibility:'public',  date:'Jun 16', time:'07:00', dayLabel:'Mon' },
    { id:'s2', title:'Meal prep Sunday post',           type:'post',      visibility:'public',  date:'Jun 17', time:'11:00', dayLabel:'Tue' },
    { id:'s3', title:'Transformation Tuesday AMA',      type:'ama',       visibility:'holders', date:'Jun 18', time:'19:00', dayLabel:'Wed', minTokens:25 },
    { id:'s4', title:'Advanced training drop',          type:'drop',      visibility:'diamond', date:'Jun 20', time:'08:00', dayLabel:'Fri', minTokens:100 },
  ],
}

const TYPE_COLOR: Record<ContentType, string> = {
  post:'#818cf8', live:'#f87171', analysis:'#a855f7', tutorial:'#22c55e', ama:'#f59e0b', drop:'#ec4899',
}
const TYPE_ICON: Record<ContentType, string> = {
  post:'📝', live:'🔴', analysis:'📊', tutorial:'🎓', ama:'💬', drop:'📦',
}
const VIS_BADGE: Record<Visibility, { label: string; color: string }> = {
  public:  { label:'Public',   color:'rgba(255,255,255,0.25)' },
  holders: { label:'Holders',  color:'#f59e0b'               },
  diamond: { label:'Diamond',  color:'#818cf8'               },
}

const MY_TOKENS: Record<string, number> = { SVRN:50, MAYA:80, JAX:0 }

export default function CreatorSchedulePage() {
  const router = useRouter()
  const params = useParams()
  const handle  = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const creator = CREATOR_DATA[handle] ?? CREATOR_DATA.sovereign_v
  const items   = SCHEDULE[handle] ?? SCHEDULE.sovereign_v

  const [filter, setFilter] = useState<'all' | ContentType>('all')
  const [notified, setNotified] = useState<Record<string, boolean>>({})

  const visible = items.filter(i => filter === 'all' || i.type === filter)
  const userTokens = MY_TOKENS[creator.tokenSymbol] ?? 0

  function canAccess(item: ScheduledItem) {
    if (item.visibility === 'public') return true
    return userTokens >= (item.minTokens ?? 999)
  }

  function toggleNotify(id: string) {
    setNotified(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const FILTER_TYPES: (ContentType | 'all')[] = ['all', 'live', 'analysis', 'post', 'tutorial', 'ama', 'drop']

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
          <div className="flex-1">
            <div className="font-black text-white">Schedule</div>
            <div className="text-xs text-white/30">@{handle} · {items.length} upcoming</div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 capitalize"
              style={filter === t
                ? { background: creator.color, color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t === 'all' ? 'All' : `${TYPE_ICON[t as ContentType]} ${t}`}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {visible.map(item => {
          const access  = canAccess(item)
          const notif   = notified[item.id]
          const vis     = VIS_BADGE[item.visibility]
          return (
            <div key={item.id} className="p-4 rounded-2xl border"
              style={{ background: 'rgba(255,255,255,0.018)', borderColor: access ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-start gap-3">
                {/* Day/time column */}
                <div className="flex flex-col items-center flex-shrink-0 w-12">
                  <div className="text-xs text-white/25">{item.dayLabel}</div>
                  <div className="font-black text-sm text-white/50">{item.time}</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base">{TYPE_ICON[item.type]}</span>
                    <span className="font-black text-sm text-white/85 leading-tight">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: TYPE_COLOR[item.type] }}>{item.type}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: `${vis.color}15`, color: vis.color }}>
                      {vis.label}
                    </span>
                    {item.minTokens && (
                      <span className="text-xs" style={{ color: access ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                        {access ? '✓' : `🔒 ${item.minTokens}+ $${creator.tokenSymbol}`}
                      </span>
                    )}
                  </div>
                  {item.teaser && access && (
                    <p className="text-xs text-white/30 italic">"{item.teaser}"</p>
                  )}
                </div>

                {/* Notify bell */}
                <button onClick={() => toggleNotify(item.id)}
                  className="p-2 rounded-xl flex-shrink-0"
                  style={{ background: notif ? `${creator.color}18` : 'rgba(255,255,255,0.04)',
                    color: notif ? creator.color : 'rgba(255,255,255,0.2)' }}>
                  {notif ? '🔔' : '🔕'}
                </button>
              </div>
            </div>
          )
        })}

        {visible.length === 0 && (
          <div className="text-center py-12 text-white/25">Nothing scheduled for this type</div>
        )}
      </div>
    </div>
  )
}
