'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Collection {
  id: string
  title: string
  icon: string
  color: string
  description: string
  postCount: number
  followers: number
  locked: boolean
  minTokens?: number
  tokenSymbol?: string
  updatedAgo: string
}

const PROFILE_COLLECTIONS: Record<string, Collection[]> = {
  sovereign_v: [
    { id:'col1', title:'DeFi Deep Dives',     icon:'📊', color:'#a855f7', description:'On-chain analysis, protocol breakdowns, and alpha.',     postCount:28, followers:1842, locked:false, updatedAgo:'2h ago'  },
    { id:'col2', title:'Trading Setups',       icon:'📈', color:'#22c55e', description:'Live chart setups with entry/exit levels.',              postCount:15, followers:924,  locked:true,  minTokens:10, tokenSymbol:'SVRN', updatedAgo:'1d ago'  },
    { id:'col3', title:'Macro Reads',          icon:'🌐', color:'#818cf8', description:'Macro economic context for crypto markets.',             postCount:9,  followers:612,  locked:false, updatedAgo:'3d ago'  },
    { id:'col4', title:'Diamond Member Vault', icon:'💎', color:'#f59e0b', description:'Exclusive signals and early access content.',            postCount:42, followers:318,  locked:true,  minTokens:100, tokenSymbol:'SVRN', updatedAgo:'6h ago'  },
    { id:'col5', title:'Portfolio Diary',      icon:'📓', color:'#ec4899', description:'My public portfolio moves with reasoning.',              postCount:22, followers:1250, locked:false, updatedAgo:'5d ago'  },
  ],
  mayafit: [
    { id:'col6', title:'Workout Library',      icon:'💪', color:'#22c55e', description:'Full workout programs from beginner to advanced.',       postCount:34, followers:4200, locked:false, updatedAgo:'1d ago'  },
    { id:'col7', title:'Nutrition Guides',     icon:'🥗', color:'#f59e0b', description:'Meal plans, macros, and supplement info.',               postCount:18, followers:2800, locked:false, updatedAgo:'2d ago'  },
    { id:'col8', title:'Transformation Hub',   icon:'🌟', color:'#a855f7', description:'Member transformation stories and progress.',            postCount:12, followers:980,  locked:true,  minTokens:25, tokenSymbol:'MAYA', updatedAgo:'4d ago'  },
  ],
}

const PROFILE_COLORS: Record<string, string> = { sovereign_v:'#a855f7', mayafit:'#22c55e', jaxbeats:'#ec4899' }
const MY_TOKENS: Record<string, number> = { SVRN:50, MAYA:80, JAX:0 }

export default function ProfileCollectionsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const colls  = PROFILE_COLLECTIONS[handle] ?? PROFILE_COLLECTIONS.sovereign_v
  const accent = PROFILE_COLORS[handle] ?? '#a855f7'

  const [filter, setFilter] = useState<'all' | 'free' | 'locked'>('all')

  const visible = colls.filter(c => filter === 'all' || (filter === 'free' ? !c.locked : c.locked))

  function canAccess(c: Collection) {
    if (!c.locked) return true
    return MY_TOKENS[c.tokenSymbol ?? ''] >= (c.minTokens ?? 999)
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
            <div className="font-black text-white">Collections</div>
            <div className="text-xs text-white/30">@{handle} · {colls.length} collections</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Collections', value:colls.length,                                   color:accent },
            { label:'Total Posts', value:colls.reduce((s,c)=>s+c.postCount,0),           color:'rgba(255,255,255,0.6)' },
            { label:'Total Fans',  value:`${(colls.reduce((s,c)=>s+c.followers,0)/1000).toFixed(1)}k`, color:'#f59e0b' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          {(['all','free','locked'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
              style={filter === f ? { background: accent, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f === 'locked' ? '🔒 Gated' : f === 'free' ? '🌐 Free' : 'All'}
            </button>
          ))}
        </div>

        {/* Collection cards */}
        <div className="space-y-3">
          {visible.map(c => {
            const accessible = canAccess(c)
            return (
              <button key={c.id} onClick={() => router.push(`/collections/${c.id}`)}
                className="w-full p-4 rounded-2xl border text-left"
                style={{ background: 'rgba(255,255,255,0.018)', borderColor: accessible ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${c.color}12`, border: `1px solid ${c.color}20` }}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm text-white/85">{c.title}</span>
                      {c.locked && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={accessible
                            ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e' }
                            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                          {accessible ? '✓ Access' : `🔒 ${c.minTokens}+ $${c.tokenSymbol}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 leading-relaxed mb-2">{c.description}</p>
                    <div className="flex items-center gap-3 text-xs text-white/20">
                      <span>{c.postCount} posts</span>
                      <span>{c.followers.toLocaleString()} followers</span>
                      <span>{c.updatedAgo}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
