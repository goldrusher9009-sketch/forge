'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type MediaType = 'post' | 'video' | 'audio' | 'chart' | 'drop'

interface MediaItem {
  id: string
  type: MediaType
  title: string
  emoji: string
  color: string
  locked: boolean
  minTokens?: number
  tokenSymbol?: string
  likes: number
  views: number
  ts: string
  duration?: string
}

const PROFILE_MEDIA: Record<string, MediaItem[]> = {
  sovereign_v: [
    { id:'m1',  type:'chart',  title:'BTC accumulation zone',              emoji:'📊', color:'#a855f7', locked:false, likes:824, views:12400, ts:'2h'  },
    { id:'m2',  type:'post',   title:'Why I moved 30% to stablecoins',     emoji:'📝', color:'#a855f7', locked:true,  minTokens:25, tokenSymbol:'SVRN', likes:612, views:8800,  ts:'5h'  },
    { id:'m3',  type:'video',  title:'DeFi 101: Liquidity pools',          emoji:'🎬', color:'#818cf8', locked:false, likes:1200, views:28000, ts:'1d', duration:'12:40' },
    { id:'m4',  type:'audio',  title:'Weekly alpha audio brief',           emoji:'🎙', color:'#f59e0b', locked:true,  minTokens:10, tokenSymbol:'SVRN', likes:340, views:4200,  ts:'2d', duration:'8:15' },
    { id:'m5',  type:'chart',  title:'ETH accumulation pattern',           emoji:'📈', color:'#22c55e', locked:false, likes:490, views:7100,  ts:'3d'  },
    { id:'m6',  type:'drop',   title:'Exclusive signal pack — Jun 2026',   emoji:'💎', color:'#818cf8', locked:true,  minTokens:50, tokenSymbol:'SVRN', likes:880, views:3200,  ts:'4d'  },
    { id:'m7',  type:'post',   title:'Solana thesis — long form',          emoji:'📝', color:'#a855f7', locked:false, likes:701, views:10900, ts:'5d'  },
    { id:'m8',  type:'video',  title:'Portfolio rebalancing strategy',     emoji:'🎬', color:'#818cf8', locked:true,  minTokens:25, tokenSymbol:'SVRN', likes:540, views:6800,  ts:'6d', duration:'18:22' },
    { id:'m9',  type:'chart',  title:'Altcoin season indicator update',    emoji:'📊', color:'#f59e0b', locked:false, likes:388, views:5600,  ts:'1w'  },
    { id:'m10', type:'audio',  title:'Market structure deep-dive',         emoji:'🎙', color:'#a855f7', locked:false, likes:244, views:3100,  ts:'1w', duration:'22:05' },
    { id:'m11', type:'post',   title:'Why DeFi TVL matters more than price',emoji:'📝', color:'#22c55e', locked:false, likes:910, views:14200, ts:'2w'  },
    { id:'m12', type:'drop',   title:'Diamond member research pack — May', emoji:'💎', color:'#818cf8', locked:true,  minTokens:100, tokenSymbol:'SVRN', likes:1240, views:2800, ts:'3w'  },
  ],
  mayafit: [
    { id:'n1', type:'video', title:'30-min full body HIIT',         emoji:'🎬', color:'#22c55e', locked:false, likes:2100, views:44000, ts:'1d', duration:'30:00' },
    { id:'n2', type:'post',  title:'30-day transformation: breakdown',emoji:'📝', color:'#22c55e', locked:true,  minTokens:10, tokenSymbol:'MAYA', likes:412, views:8800, ts:'5h' },
    { id:'n3', type:'drop',  title:'12-week shred program PDF',     emoji:'💎', color:'#818cf8', locked:true,  minTokens:50, tokenSymbol:'MAYA', likes:680, views:4200, ts:'2d' },
    { id:'n4', type:'audio', title:'Mindset & recovery podcast',    emoji:'🎙', color:'#f59e0b', locked:false, likes:320, views:5900, ts:'4d', duration:'34:20' },
  ],
}

const PROFILE_COLORS: Record<string, string> = { sovereign_v:'#a855f7', mayafit:'#22c55e', jaxbeats:'#ec4899' }
const MY_TOKENS: Record<string, number> = { SVRN:50, MAYA:80, JAX:0 }
const TYPE_LABEL: Record<MediaType, string> = { post:'Post', video:'Video', audio:'Audio', chart:'Chart', drop:'Drop' }

export default function ProfileMediaPage() {
  const router = useRouter()
  const params = useParams()
  const handle  = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const items   = PROFILE_MEDIA[handle] ?? PROFILE_MEDIA.sovereign_v
  const accent  = PROFILE_COLORS[handle] ?? '#a855f7'

  const [filter, setFilter] = useState<'all' | MediaType | 'locked' | 'free'>('all')

  function canAccess(item: MediaItem) {
    if (!item.locked) return true
    if (!item.tokenSymbol) return false
    return MY_TOKENS[item.tokenSymbol] >= (item.minTokens ?? 0)
  }

  const visible = items.filter(item => {
    if (filter === 'free')   return !item.locked
    if (filter === 'locked') return item.locked
    if (filter !== 'all')    return item.type === filter
    return true
  })

  const totalLikes = items.reduce((s, i) => s + i.likes, 0)
  const totalViews = items.reduce((s, i) => s + i.views, 0)

  const FILTER_TABS = [
    { key:'all',   label:'All' },
    { key:'post',  label:'Posts' },
    { key:'video', label:'Videos' },
    { key:'audio', label:'Audio' },
    { key:'chart', label:'Charts' },
    { key:'drop',  label:'Drops' },
    { key:'free',  label:'Free' },
    { key:'locked',label:'🔒' },
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
          <div className="flex-1">
            <div className="font-black text-white">Media</div>
            <div className="text-xs text-white/30">@{handle} · {items.length} items</div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_TABS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f.key ? { background: accent, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Posts',  value:items.length },
            { label:'Likes',  value:`${(totalLikes/1000).toFixed(1)}k` },
            { label:'Views',  value:`${(totalViews/1000).toFixed(0)}k` },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm text-white/75">{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2">
          {visible.map(item => {
            const accessible = canAccess(item)
            return (
              <button key={item.id}
                onClick={() => accessible && router.push(`/feed/${item.id}`)}
                className="relative rounded-2xl border border-white/4 overflow-hidden text-left"
                style={{ background: 'rgba(255,255,255,0.018)', opacity: accessible ? 1 : 0.7 }}>
                {/* Thumb */}
                <div className="h-28 flex items-center justify-center relative"
                  style={{ background: `${item.color}0C` }}>
                  <span className="text-4xl">{item.emoji}</span>
                  {/* Lock overlay */}
                  {item.locked && !accessible && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ background: 'rgba(4,4,10,0.55)' }}>
                      <span className="text-xl mb-0.5">🔒</span>
                      <span className="text-xs font-bold text-white/50">{item.minTokens}+ ${item.tokenSymbol}</span>
                    </div>
                  )}
                  {/* Type badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: `${item.color}25`, color: item.color }}>
                    {TYPE_LABEL[item.type]}
                  </div>
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)' }}>
                      {item.duration}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <div className="text-xs font-bold text-white/75 leading-tight line-clamp-2">{item.title}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-white/25">
                    <span>♥ {item.likes.toLocaleString()}</span>
                    <span>· {item.ts}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        {visible.length === 0 && <div className="text-center py-10 text-white/25">No media</div>}
      </div>
    </div>
  )
}
