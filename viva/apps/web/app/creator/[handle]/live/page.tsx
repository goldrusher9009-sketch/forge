'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CREATOR_DATA: Record<string, { name: string; color: string; tokenSymbol: string; followers: number }> = {
  sovereign_v: { name: 'Sovereign V', color: '#a855f7', tokenSymbol: 'SVRN', followers: 48200 },
  mayafit:     { name: 'Maya Chen',   color: '#22c55e', tokenSymbol: 'MAYA', followers: 62100 },
  jaxbeats:    { name: 'Jax Beats',  color: '#ec4899', tokenSymbol: 'JAX',  followers: 34800 },
}

interface ScheduledStream {
  id: string
  title: string
  date: string
  time: string
  tokenGated: boolean
  minTokens?: number
  rsvps: number
  type: 'ama' | 'analysis' | 'tutorial' | 'event'
}

const SCHEDULED: ScheduledStream[] = [
  { id:'s1', title:'Weekly DeFi Alpha AMA',        date:'Jun 18', time:'7:00 PM', tokenGated:true,  minTokens:10,  rsvps:284, type:'ama'      },
  { id:'s2', title:'BTC Monthly Close Analysis',   date:'Jun 30', time:'9:00 PM', tokenGated:false, rsvps:1820,   type:'analysis'  },
  { id:'s3', title:'Diamond Vault: Altseason Prep',date:'Jul 05', time:'8:00 PM', tokenGated:true,  minTokens:100, rsvps:42,  type:'tutorial'  },
]

const PAST_STREAMS = [
  { id:'p1', title:'BTC Accumulation Deep Dive', date:'Jun 10', duration:'1h 24m', viewers:2840, replay:true },
  { id:'p2', title:'Altcoin Season Indicators',  date:'Jun 03', duration:'58m',    viewers:1820, replay:true },
  { id:'p3', title:'Diamond AMA — May Recap',    date:'May 28', duration:'47m',    viewers:620,  replay:true },
]

const TYPE_COLOR: Record<string, string> = { ama:'#818cf8', analysis:'#22c55e', tutorial:'#f59e0b', event:'#ec4899' }
const TYPE_LABEL: Record<string, string> = { ama:'AMA', analysis:'Analysis', tutorial:'Tutorial', event:'Event' }

type Tab = 'upcoming' | 'past'

export default function CreatorLivePage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const creator = CREATOR_DATA[handle] ?? CREATOR_DATA.sovereign_v

  const [tab,    setTab   ] = useState<Tab>('upcoming')
  const [rsvped, setRsvped] = useState<Record<string, boolean>>({})
  const [viewers, setViewers] = useState(0)
  const [isLive, setIsLive] = useState(false)

  // Simulate live viewer count
  useEffect(() => {
    const t = setInterval(() => setViewers(v => Math.max(0, v + Math.floor((Math.random() - 0.45) * 12))), 3000)
    return () => clearInterval(t)
  }, [])

  function toggleRsvp(id: string) {
    setRsvped(prev => ({ ...prev, [id]: !prev[id] }))
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
          <div className="flex-1">
            <div className="font-black text-white">Live Streams</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
          <button onClick={() => setIsLive(l => !l)}
            className="px-3 py-1.5 rounded-xl text-xs font-black"
            style={isLive ? { background: '#f87171', color: '#04040A' } : { background: `${creator.color}15`, color: creator.color }}>
            {isLive ? '⏹ End Live' : '▶ Go Live'}
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Live now card */}
        {isLive && (
          <div className="p-4 rounded-2xl border"
            style={{ background: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-black text-red-400">LIVE NOW</span>
              <span className="text-xs text-white/30 ml-auto">{viewers + 284} watching</span>
            </div>
            <div className="font-black text-white mb-1">Live Session in Progress</div>
            <div className="text-xs text-white/40 mb-3">Started just now</div>
            <button className="w-full py-2 rounded-xl font-black text-xs"
              style={{ background: '#f87171', color: '#04040A' }}>
              View Stream Dashboard
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Total Streams', value:'18',         color: creator.color },
            { label:'Avg Viewers',   value:'1.2k',       color: '#22c55e'    },
            { label:'Total Hours',   value:'42h',        color: '#f59e0b'    },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-base" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['upcoming', 'past'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
              style={tab === t ? { background: 'rgba(255,255,255,0.08)', color: 'white' } : { color: 'rgba(255,255,255,0.3)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'upcoming' && (
          <div className="space-y-3">
            {SCHEDULED.map(s => (
              <div key={s.id} className="p-4 rounded-2xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${TYPE_COLOR[s.type]}15` }}>
                    {s.type === 'ama' ? '🎙' : s.type === 'analysis' ? '📊' : s.type === 'tutorial' ? '🎓' : '🎉'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white/85 leading-tight mb-1">{s.title}</div>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <span>{s.date} · {s.time}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: `${TYPE_COLOR[s.type]}15`, color: TYPE_COLOR[s.type] }}>
                        {TYPE_LABEL[s.type]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/25">
                    {s.rsvps} RSVPs{s.tokenGated && ` · 🔒 ${s.minTokens}+ $${creator.tokenSymbol}`}
                  </div>
                  <button onClick={() => toggleRsvp(s.id)}
                    className="px-4 py-1.5 rounded-xl text-xs font-black"
                    style={rsvped[s.id] ? { background: '#22c55e', color: '#04040A' } : { background: creator.color, color: '#04040A' }}>
                    {rsvped[s.id] ? '✓ RSVPd' : 'RSVP'}
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => router.push(`/rooms/create`)}
              className="w-full py-3 rounded-xl font-black text-sm border border-dashed border-white/10 text-white/30 hover:border-white/20">
              + Schedule New Stream
            </button>
          </div>
        )}

        {tab === 'past' && (
          <div className="space-y-3">
            {PAST_STREAMS.map(s => (
              <div key={s.id} className="p-4 rounded-2xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${creator.color}10` }}>
                    📹
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white/80">{s.title}</div>
                    <div className="text-xs text-white/25">{s.date} · {s.duration} · {s.viewers.toLocaleString()} viewers</div>
                  </div>
                </div>
                {s.replay && (
                  <button className="w-full py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    ▶ Watch Replay
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
