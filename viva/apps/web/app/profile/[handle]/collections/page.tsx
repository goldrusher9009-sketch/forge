'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Collection {
  id: string
  title: string
  icon: string
  color: string
  desc: string
  count: number
  followers: number
  locked: boolean
  minTokens?: number
  tokenSymbol?: string
  lastUpdated: string
}

const PROFILE_COLLECTIONS: Record<string, Collection[]> = {
  sovereign_v: [
    { id:'c1', title:'DeFi Deep Dives',       icon:'📊', color:'#a855f7', desc:'Weekly macro analysis and alpha calls', count:28, followers:1842, locked:false, lastUpdated:'2h ago' },
    { id:'c2', title:'Diamond Members Only',  icon:'💎', color:'#818cf8', desc:'Exclusive signals for Diamond holders', count:14, followers:340, locked:true, minTokens:100, tokenSymbol:'SVRN', lastUpdated:'1d ago' },
    { id:'c3', title:'Beginner\'s Crypto 101',icon:'📚', color:'#22c55e', desc:'Free educational series for newcomers', count:22, followers:4210, locked:false, lastUpdated:'3d ago' },
    { id:'c4', title:'Market Recaps',         icon:'📈', color:'#f59e0b', desc:'Weekly market summary threads', count:46, followers:2840, locked:false, lastUpdated:'1d ago' },
    { id:'c5', title:'Token Alpha (Gold+)',   icon:'⭐', color:'#f59e0b', desc:'Early token calls for Gold tier holders', count:18, followers:820, locked:true, minTokens:50, tokenSymbol:'SVRN', lastUpdated:'4h ago' },
  ],
  mayafit: [
    { id:'c6', title:'Workout Library',       icon:'💪', color:'#22c55e', desc:'Full workout video collection', count:34, followers:4200, locked:false, lastUpdated:'5h ago' },
    { id:'c7', title:'Meal Plans',            icon:'🥗', color:'#f59e0b', desc:'Weekly nutrition guides', count:12, followers:2100, locked:true, minTokens:10, tokenSymbol:'MAYA', lastUpdated:'2d ago' },
    { id:'c8', title:'30-Day Challenges',     icon:'🔥', color:'#ec4899', desc:'Monthly transformation challenges', count:8,  followers:6800, locked:false, lastUpdated:'1d ago' },
  ],
}

const MY_TOKENS: Record<string, number> = { SVRN:50, MAYA:80 }

export default function ProfileCollectionsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const collections = PROFILE_COLLECTIONS[handle] ?? PROFILE_COLLECTIONS.sovereign_v

  const PROFILE_COLORS: Record<string, string> = { sovereign_v:'#a855f7', mayafit:'#22c55e', jaxbeats:'#ec4899' }
  const accent = PROFILE_COLORS[handle] ?? '#a855f7'

  const [following, setFollowing] = useState<Record<string, boolean>>({})

  const canAccess = (c: Collection) => {
    if (!c.locked) return true
    if (!c.tokenSymbol || !c.minTokens) return false
    return (MY_TOKENS[c.tokenSymbol] ?? 0) >= c.minTokens
  }

  const totalFollowers = collections.reduce((s, c) => s + c.followers, 0)
  const freeCount = collections.filter(c => !c.locked).length

  return (
    <div className="min-h-screen pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Collections</div>
            <div className="text-xs text-white/30">@{handle} · {collections.length} collections · {(totalFollowers/1000).toFixed(1)}k followers</div>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        {[
          { label:'Collections', value:collections.length, color:accent },
          { label:'Free',        value:freeCount,          color:'#22c55e' },
          { label:'Exclusive',   value:collections.length - freeCount, color:'#f59e0b' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
            style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-xl" style={{ color:s.color }}>{s.value}</div>
            <div className="text-xs text-white/25">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 space-y-3">
        {collections.map(c => {
          const access  = canAccess(c)
          const isFollowing = following[c.id]

          return (
            <div key={c.id} className="rounded-2xl border border-white/4 overflow-hidden"
              style={{ background:'rgba(255,255,255,0.015)' }}>
              <div className="h-0.5" style={{ background:c.color }} />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background:`${c.color}10` }}>{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-white/85">{c.title}</span>
                      {c.locked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={access
                            ? { background:`${c.color}15`, color:c.color }
                            : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.3)' }}>
                          {access ? '🔓' : '🔒'} {c.minTokens}+ ${c.tokenSymbol}
                        </span>
                      )}
                      {!c.locked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e' }}>FREE</span>
                      )}
                    </div>
                    <div className="text-xs text-white/30 mt-0.5">{c.desc}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3 text-xs text-white/25">
                  <span>📝 {c.count} posts</span>
                  <span>👥 {c.followers.toLocaleString()} followers</span>
                  <span>🕒 {c.lastUpdated}</span>
                </div>

                <div className="flex gap-2">
                  {access ? (
                    <>
                      <button onClick={() => router.push(`/collections/${c.id}`)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-black"
                        style={{ background:`${c.color}15`, color:c.color }}>
                        View Collection
                      </button>
                      <button onClick={() => setFollowing(p => ({ ...p, [c.id]: !p[c.id] }))}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold"
                        style={isFollowing
                          ? { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }
                          : { background:`${c.color}15`, color:c.color }}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => router.push(`/tokens/${c.tokenSymbol}/chart`)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black"
                      style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
                      Get ${c.tokenSymbol} to unlock →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
