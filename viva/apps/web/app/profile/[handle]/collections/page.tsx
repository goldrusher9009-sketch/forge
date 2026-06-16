'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Collection {
  id: string
  title: string
  icon: string
  color: string
  description: string
  itemCount: number
  followers: number
  tokenGated: boolean
  minTokens?: number
  tokenSymbol?: string
  updated: string
  featured?: boolean
}

const PROFILE_COLLECTIONS: Record<string, Collection[]> = {
  sovereign_v: [
    { id:'col1', title:'DeFi Deep Dives',     icon:'📊', color:'#a855f7', description:'Weekly breakdowns of DeFi protocols, yields, and alpha plays.',       itemCount:28, followers:1842, tokenGated:false, updated:'2h ago',  featured:true  },
    { id:'col2', title:'On-chain Alpha',       icon:'🔮', color:'#818cf8', description:'Token-holder only: real-time signals, wallets to watch.',               itemCount:14, followers:820,  tokenGated:true,  minTokens:25, tokenSymbol:'SVRN', updated:'1d ago', featured:false },
    { id:'col3', title:'Portfolio Reviews',    icon:'💼', color:'#22c55e', description:'Community portfolio teardowns — what I would buy, sell, or hold.',       itemCount:42, followers:3100, tokenGated:false, updated:'3d ago', featured:false },
    { id:'col4', title:'Diamond Vault',         icon:'💎', color:'#f59e0b', description:'Exclusive strategies for 100+ SVRN stakers only.',                      itemCount:8,  followers:380,  tokenGated:true,  minTokens:100, tokenSymbol:'SVRN', updated:'5d ago', featured:false },
  ],
  mayafit: [
    { id:'col5', title:'Workout Library',      icon:'💪', color:'#22c55e', description:'Full workout programs — beginner to advanced.',                          itemCount:34, followers:4200, tokenGated:false, updated:'1d ago',  featured:true  },
    { id:'col6', title:'Nutrition Guides',     icon:'🥗', color:'#f59e0b', description:'Meal plans, macro breakdowns, and recipe videos.',                      itemCount:18, followers:2800, tokenGated:false, updated:'4d ago',  featured:false },
    { id:'col7', title:'Member Transformations',icon:'🌟',color:'#ec4899', description:'Real 30/60/90-day transformations from MAYA stakers.',                   itemCount:22, followers:1600, tokenGated:true,  minTokens:10, tokenSymbol:'MAYA', updated:'2d ago', featured:false },
  ],
  jaxbeats: [
    { id:'col8', title:'Beat Archives',        icon:'🎵', color:'#ec4899', description:'Every beat pack release, organized by genre.',                           itemCount:56, followers:2200, tokenGated:false, updated:'6h ago',  featured:true  },
    { id:'col9', title:'Exclusive Stems',      icon:'🎛',  color:'#a855f7', description:'Stem files for JAX holders — remix and release.',                       itemCount:12, followers:540,  tokenGated:true,  minTokens:10, tokenSymbol:'JAX', updated:'1d ago', featured:false },
  ],
}

const PROFILE_COLORS: Record<string, string> = {
  sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899',
}

// Simulated token holdings
const MY_TOKENS: Record<string, number> = { SVRN: 50, MAYA: 80, JAX: 0 }

export default function ProfileCollectionsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const collections = PROFILE_COLLECTIONS[handle] ?? PROFILE_COLLECTIONS.sovereign_v
  const accentColor = PROFILE_COLORS[handle] ?? '#a855f7'

  const [filter, setFilter] = useState<'all' | 'free' | 'gated'>('all')
  const [following, setFollowing] = useState<Record<string, boolean>>({})

  const filtered = collections.filter(c => {
    if (filter === 'free')  return !c.tokenGated
    if (filter === 'gated') return c.tokenGated
    return true
  })

  const featured = collections.find(c => c.featured)

  function canAccess(c: Collection): boolean {
    if (!c.tokenGated) return true
    return MY_TOKENS[c.tokenSymbol ?? ''] >= (c.minTokens ?? 0)
  }

  function toggleFollow(id: string) {
    setFollowing(prev => ({ ...prev, [id]: !prev[id] }))
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
          <div>
            <div className="font-black text-white">Collections</div>
            <div className="text-xs text-white/30">@{handle} · {collections.length} collections</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Featured collection */}
        {featured && (
          <button onClick={() => router.push(`/collections/${featured.id}`)}
            className="w-full p-4 rounded-2xl border text-left"
            style={{ background: `${featured.color}08`, borderColor: `${featured.color}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{featured.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white/85">{featured.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>Featured</span>
                </div>
                <div className="text-xs text-white/30">{featured.itemCount} items · {featured.followers.toLocaleString()} followers</div>
              </div>
            </div>
            <div className="text-sm text-white/50">{featured.description}</div>
          </button>
        )}

        {/* Filters */}
        <div className="flex gap-1.5">
          {[
            { key: 'all'   as const, label: 'All' },
            { key: 'free'  as const, label: '🔓 Free' },
            { key: 'gated' as const, label: '🔒 Token Gated' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={filter === f.key ? { background: accentColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Collection cards */}
        <div className="space-y-3">
          {filtered.map(c => {
            const accessible = canAccess(c)
            const isFollowing = following[c.id]
            return (
              <div key={c.id} className="rounded-2xl border border-white/4 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <button onClick={() => accessible && router.push(`/collections/${c.id}`)}
                  className="w-full p-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${c.color}12`, border: `1px solid ${c.color}20` }}>
                      {c.tokenGated && !accessible ? '🔒' : c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-sm text-white/80">{c.title}</span>
                        {c.tokenGated && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                            style={accessible
                              ? { background: `${accentColor}15`, color: accentColor }
                              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                            {accessible ? `✓ Holder` : `${c.minTokens}+ $${c.tokenSymbol}`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/30 mb-1">{c.itemCount} items · {c.followers.toLocaleString()} followers · {c.updated}</div>
                      <div className="text-xs text-white/40 line-clamp-2">{c.description}</div>
                    </div>
                  </div>
                </button>
                <div className="px-4 pb-3 flex gap-2">
                  <button onClick={() => accessible && router.push(`/collections/${c.id}`)}
                    disabled={!accessible}
                    className="flex-1 py-2 rounded-xl text-xs font-black disabled:opacity-30"
                    style={{ background: accessible ? accentColor : 'rgba(255,255,255,0.06)', color: accessible ? '#04040A' : 'rgba(255,255,255,0.3)' }}>
                    {accessible ? 'Open' : `Need ${c.minTokens} $${c.tokenSymbol}`}
                  </button>
                  <button onClick={() => toggleFollow(c.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold"
                    style={isFollowing ? { background: `${c.color}15`, color: c.color } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    {isFollowing ? '✓ Following' : 'Follow'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
