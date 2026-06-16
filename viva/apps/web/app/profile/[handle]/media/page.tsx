'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type MediaType = 'all' | 'images' | 'videos' | 'audio' | 'locked'

interface MediaItem {
  id: string
  type: 'image' | 'video' | 'audio'
  title: string
  emoji: string
  color: string
  duration?: string
  locked: boolean
  minTokens?: number
  tokenSymbol?: string
  likes: number
  ts: string
  collection?: string
}

const PROFILE_MEDIA: Record<string, MediaItem[]> = {
  sovereign_v: [
    { id:'m1', type:'video', title:'BTC Breakout Analysis — LIVE',        emoji:'📊', color:'#a855f7', duration:'24:18', locked:false, likes:2840, ts:'2h ago',  collection:'DeFi Deep Dives' },
    { id:'m2', type:'image', title:'Portfolio screenshot: +82% YTD',       emoji:'📈', color:'#22c55e', locked:false, likes:1820, ts:'1d ago'  },
    { id:'m3', type:'video', title:'Gold Tier Exclusive — Altcoin picks',  emoji:'🥇', color:'#f59e0b', duration:'18:42', locked:true, minTokens:50, tokenSymbol:'SVRN', likes:420, ts:'2d ago', collection:'On-chain Alpha' },
    { id:'m4', type:'image', title:'Wallet address breakdown thread',       emoji:'💼', color:'#818cf8', locked:false, likes:982, ts:'3d ago'  },
    { id:'m5', type:'audio', title:'Market thoughts — morning brief',       emoji:'🎙', color:'#ec4899', duration:'8:12', locked:false, likes:640, ts:'4d ago' },
    { id:'m6', type:'video', title:'Diamond Vault: Next 100x gem?',        emoji:'💎', color:'#818cf8', duration:'31:05', locked:true, minTokens:100, tokenSymbol:'SVRN', likes:280, ts:'5d ago', collection:'Diamond Vault' },
    { id:'m7', type:'image', title:'On-chain data: what whales are doing', emoji:'🐋', color:'#a855f7', locked:false, likes:1240, ts:'6d ago' },
    { id:'m8', type:'video', title:'Free: Intro to DeFi yield farming',    emoji:'🌾', color:'#22c55e', duration:'14:30', locked:false, likes:3200, ts:'1w ago' },
  ],
  mayafit: [
    { id:'m1', type:'video', title:'30-Day Shred Day 1 — Full Workout',    emoji:'💪', color:'#22c55e', duration:'42:10', locked:false, likes:8420, ts:'1d ago',  collection:'Workout Library' },
    { id:'m2', type:'image', title:'Meal prep Sunday — 1800 cal plan',     emoji:'🥗', color:'#f59e0b', locked:false, likes:5200, ts:'2d ago' },
    { id:'m3', type:'video', title:'Member Transformation — @jade_l 90d',  emoji:'🌟', color:'#ec4899', duration:'12:45', locked:true, minTokens:10, tokenSymbol:'MAYA', likes:1840, ts:'3d ago', collection:'Member Transformations' },
    { id:'m4', type:'audio', title:'Mindset Monday — consistency is king', emoji:'🧠', color:'#818cf8', duration:'15:00', locked:false, likes:2100, ts:'4d ago' },
  ],
}

const PROFILE_COLORS: Record<string, string> = {
  sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899',
}

const MY_TOKENS: Record<string, number> = { SVRN: 50, MAYA: 80, JAX: 0 }

const TYPE_ICONS: Record<string, string> = { video: '▶', image: '🖼', audio: '🎵' }

export default function ProfileMediaPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const items  = PROFILE_MEDIA[handle] ?? PROFILE_MEDIA.sovereign_v
  const accentColor = PROFILE_COLORS[handle] ?? '#a855f7'

  const [filter, setFilter] = useState<MediaType>('all')
  const [liked,  setLiked ] = useState<Record<string, boolean>>({})

  const filtered = items.filter(i => {
    if (filter === 'locked') return i.locked
    if (filter === 'all')    return true
    return i.type === filter.slice(0, -1)
  })

  function canAccess(item: MediaItem): boolean {
    if (!item.locked) return true
    return MY_TOKENS[item.tokenSymbol ?? ''] >= (item.minTokens ?? 0)
  }

  const FILTERS: { key: MediaType; label: string }[] = [
    { key:'all',    label:'All'    },
    { key:'videos', label:'Videos' },
    { key:'images', label:'Images' },
    { key:'audio',  label:'Audio'  },
    { key:'locked', label:'🔒 Gated'},
  ]

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
          <div>
            <div className="font-black text-white">Media</div>
            <div className="text-xs text-white/30">@{handle} · {items.length} items</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f.key ? { background: accentColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid / List */}
        <div className="space-y-3">
          {filtered.map(item => {
            const accessible = canAccess(item)
            const isLiked = liked[item.id]
            return (
              <div key={item.id} className="rounded-2xl border border-white/4 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                {/* Thumbnail */}
                <div className="relative h-20 flex items-center justify-center"
                  style={{ background: `${item.color}08` }}>
                  <span className="text-4xl">{item.emoji}</span>
                  {/* Type badge */}
                  <div className="absolute top-2 left-3 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: `${item.color}20`, color: item.color }}>
                    {TYPE_ICONS[item.type]} {item.type}
                  </div>
                  {item.duration && (
                    <div className="absolute bottom-2 right-3 px-1.5 py-0.5 rounded text-xs font-bold"
                      style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)' }}>
                      {item.duration}
                    </div>
                  )}
                  {item.locked && !accessible && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(4,4,10,0.7)' }}>
                      <div className="text-center">
                        <div className="text-2xl mb-1">🔒</div>
                        <div className="text-xs text-white/50">{item.minTokens}+ ${item.tokenSymbol}</div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white/80 leading-tight mb-0.5">{item.title}</div>
                    <div className="flex items-center gap-2 text-xs text-white/25">
                      {item.collection && <span style={{ color: item.color }}>{item.collection}</span>}
                      {item.collection && <span>·</span>}
                      <span>{item.ts}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setLiked(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: isLiked ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
                      ♥ {item.likes + (isLiked ? 1 : 0)}
                    </button>
                    {accessible ? (
                      <button className="px-3 py-1.5 rounded-xl text-xs font-black"
                        style={{ background: accentColor, color: '#04040A' }}>
                        View
                      </button>
                    ) : (
                      <button onClick={() => router.push(`/tokens/${item.tokenSymbol}/stake`)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                        Unlock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
