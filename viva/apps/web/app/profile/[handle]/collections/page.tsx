'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Collection {
  id: string
  title: string
  icon: string
  desc: string
  color: string
  items: number
  followers: number
  isFollowing: boolean
  tokenGated: boolean
  minTokens?: number
  tokenSymbol?: string
  updatedAgo: string
  category: 'research' | 'trading' | 'fitness' | 'music' | 'general'
}

const PROFILE_COLLECTIONS: Record<string, Collection[]> = {
  sovereign_v: [
    { id: 'col1', title: 'DeFi Deep Dives',       icon: '📊', desc: 'Weekly on-chain analysis and protocol reviews', color: '#a855f7', items: 28, followers: 1842, isFollowing: true,  tokenGated: false,                          updatedAgo: '2h',  category: 'research' },
    { id: 'col2', title: 'Alpha Trades',            icon: '⚡', desc: 'My live portfolio moves + thesis for each',    color: '#f59e0b', items: 42, followers: 3210, isFollowing: false, tokenGated: true,  minTokens: 25, tokenSymbol: 'SVRN', updatedAgo: '4h',  category: 'trading'  },
    { id: 'col3', title: 'Macro Watch',             icon: '🌍', desc: 'Fed policy, macro cycles & crypto correlations', color: '#818cf8', items: 15, followers: 982,  isFollowing: false, tokenGated: false,                          updatedAgo: '1d',  category: 'research' },
    { id: 'col4', title: 'Diamond Member Vault',    icon: '💎', desc: 'Exclusive signals for Diamond tier holders',  color: '#818cf8', items: 8,  followers: 214,  isFollowing: false, tokenGated: true,  minTokens: 100, tokenSymbol: 'SVRN', updatedAgo: '6h',  category: 'trading'  },
    { id: 'col5', title: 'Crypto Fundamentals 101', icon: '📚', desc: 'Learning resources for new investors',        color: '#22c55e', items: 32, followers: 4400, isFollowing: true,  tokenGated: false,                          updatedAgo: '3d',  category: 'general'  },
  ],
  mayafit: [
    { id: 'col6', title: 'Workout Library',   icon: '💪', desc: '200+ workout videos organized by muscle group',   color: '#22c55e', items: 34, followers: 4200, isFollowing: true,  tokenGated: false,                         updatedAgo: '1h',  category: 'fitness' },
    { id: 'col7', title: 'Nutrition Plans',   icon: '🥗', desc: 'Meal plans, macro breakdowns, recipes',           color: '#f59e0b', items: 12, followers: 2100, isFollowing: false, tokenGated: true, minTokens: 10, tokenSymbol: 'MAYA', updatedAgo: '2d',  category: 'fitness' },
    { id: 'col8', title: '12-Week Programs',  icon: '🗓', desc: 'Complete training programs from beginner to pro', color: '#ec4899', items: 6,  followers: 8800, isFollowing: true,  tokenGated: false,                         updatedAgo: '1w',  category: 'fitness' },
  ],
}

const MY_TOKENS: Record<string, number> = { SVRN: 50, MAYA: 80, JAX: 0 }
const PROFILE_COLORS: Record<string, string> = { sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899' }

type Cat = 'all' | 'research' | 'trading' | 'fitness' | 'music' | 'general'

export default function ProfileCollectionsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const cols = PROFILE_COLLECTIONS[handle] ?? PROFILE_COLLECTIONS.sovereign_v
  const accentColor = PROFILE_COLORS[handle] ?? '#a855f7'

  const [following, setFollowing] = useState<Record<string, boolean>>(
    Object.fromEntries(cols.map(c => [c.id, c.isFollowing]))
  )
  const [cat, setCat] = useState<Cat>('all')

  const categories = ['all', ...new Set(cols.map(c => c.category))] as Cat[]
  const filtered = cols.filter(c => cat === 'all' || c.category === cat)

  function toggleFollow(id: string) {
    setFollowing(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function canAccess(c: Collection) {
    if (!c.tokenGated) return true
    return MY_TOKENS[c.tokenSymbol ?? ''] >= (c.minTokens ?? 0)
  }

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
            <div className="font-black text-white">Collections</div>
            <div className="text-xs text-white/30">@{handle} · {cols.length} collections</div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 capitalize"
              style={cat === c ? { background: accentColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {filtered.map(c => {
          const access = canAccess(c)
          const isFollowing = following[c.id]

          return (
            <div key={c.id} className="rounded-2xl border border-white/4 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <button onClick={() => access && router.push(`/collections/${c.id}`)}
                className="w-full p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${c.color}12`, border: `1px solid ${c.color}20` }}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-white/85">{c.title}</span>
                      {c.tokenGated && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={access
                            ? { background: `${accentColor}20`, color: accentColor }
                            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                          {access ? `✓ ${c.tokenSymbol}` : `🔒 ${c.minTokens}+ ${c.tokenSymbol}`}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/35 mt-0.5 leading-relaxed">{c.desc}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/25">
                      <span>{c.items} items</span>
                      <span>·</span>
                      <span>{c.followers.toLocaleString()} followers</span>
                      <span>·</span>
                      <span>Updated {c.updatedAgo} ago</span>
                    </div>
                  </div>
                </div>
                {!access && (
                  <div className="mt-3 p-2.5 rounded-xl text-xs text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                    Hold {c.minTokens}+ ${c.tokenSymbol} to unlock →
                  </div>
                )}
              </button>
              {/* Follow button bar */}
              <div className="px-4 pb-3 flex gap-2">
                <button onClick={() => toggleFollow(c.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-black"
                  style={isFollowing
                    ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                    : { background: accentColor, color: '#04040A' }}>
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
                {access && (
                  <button onClick={() => router.push(`/collections/${c.id}`)}
                    className="px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    View →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
