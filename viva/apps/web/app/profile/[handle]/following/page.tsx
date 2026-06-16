'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Following {
  handle: string
  name: string
  color: string
  verified: boolean
  vscore: number
  tokenSymbol: string
  tokenPrice: number
  tokenChange: number
  myTokens: number
  category: string
}

const PROFILE_FOLLOWING: Record<string, Following[]> = {
  sovereign_v: [
    { handle:'mayafit',    name:'Maya Chen',     color:'#22c55e', verified:true,  vscore:8720, tokenSymbol:'MAYA', tokenPrice:5.20,  tokenChange:2.1,  myTokens:80,  category:'Fitness'  },
    { handle:'jaxbeats',   name:'Jax Beats',    color:'#ec4899', verified:true,  vscore:7410, tokenSymbol:'JAX',  tokenPrice:3.80,  tokenChange:7.1,  myTokens:25,  category:'Music'    },
    { handle:'atlas_k',    name:'Atlas K',       color:'#818cf8', verified:false, vscore:6820, tokenSymbol:'ATLK', tokenPrice:4.20,  tokenChange:-1.2, myTokens:0,   category:'Trading'  },
    { handle:'lily_p',     name:'Lily Park',     color:'#f59e0b', verified:true,  vscore:6410, tokenSymbol:'LILY', tokenPrice:2.80,  tokenChange:4.5,  myTokens:0,   category:'Finance'  },
    { handle:'luna_w',     name:'Luna Walsh',    color:'#f87171', verified:false, vscore:5900, tokenSymbol:'LUNA', tokenPrice:1.95,  tokenChange:-3.4, myTokens:0,   category:'Art'      },
    { handle:'marco_v',    name:'Marco Vega',    color:'#f87171', verified:false, vscore:4200, tokenSymbol:'MARV', tokenPrice:0.85,  tokenChange:12.1, myTokens:0,   category:'Gaming'   },
  ],
  mayafit: [
    { handle:'sovereign_v',name:'Sovereign V',   color:'#a855f7', verified:true,  vscore:9840, tokenSymbol:'SVRN', tokenPrice:8.75,  tokenChange:4.2,  myTokens:50,  category:'Finance'  },
    { handle:'jaxbeats',   name:'Jax Beats',    color:'#ec4899', verified:true,  vscore:7410, tokenSymbol:'JAX',  tokenPrice:3.80,  tokenChange:7.1,  myTokens:10,  category:'Music'    },
    { handle:'atlas_k',    name:'Atlas K',       color:'#818cf8', verified:false, vscore:6820, tokenSymbol:'ATLK', tokenPrice:4.20,  tokenChange:-1.2, myTokens:0,   category:'Trading'  },
  ],
}

const PROFILE_COLORS: Record<string, string> = { sovereign_v:'#a855f7', mayafit:'#22c55e', jaxbeats:'#ec4899' }

export default function ProfileFollowingPage() {
  const router = useRouter()
  const params = useParams()
  const handle   = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const list     = PROFILE_FOLLOWING[handle] ?? PROFILE_FOLLOWING.sovereign_v
  const accent   = PROFILE_COLORS[handle] ?? '#a855f7'

  const [search,   setSearch  ] = useState('')
  const [filter,   setFilter  ] = useState<'all' | 'holding'>('all')
  const [followed, setFollowed] = useState<Record<string, boolean>>({})

  const visible = list.filter(f => {
    if (filter === 'holding' && f.myTokens === 0) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.handle.includes(search)) return false
    return true
  })

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
            <div className="font-black text-white">Following</div>
            <div className="text-xs text-white/30">@{handle} · {list.length}</div>
          </div>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Filter */}
        <div className="flex gap-1.5">
          {([['all','All'], ['holding','Holding tokens']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={filter === k ? { background: accent, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2">
          {visible.map(f => (
            <div key={f.handle} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <button onClick={() => router.push(`/profile/${f.handle}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                  style={{ background: `${f.color}15`, color: f.color }}>
                  {f.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white/85">{f.name}</span>
                    {f.verified && <span className="text-xs" style={{ color: f.color }}>✓</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <span>{f.category}</span>
                    <span>V-{f.vscore.toLocaleString()}</span>
                    {f.myTokens > 0 && <span style={{ color: f.color }}>· {f.myTokens} ${f.tokenSymbol}</span>}
                  </div>
                </div>
              </button>

              {/* Token price */}
              <div className="text-right flex-shrink-0 mr-2">
                <div className="font-black text-xs text-white/50">${f.tokenPrice}</div>
                <div className="text-xs font-bold" style={{ color: f.tokenChange >= 0 ? '#22c55e' : '#f87171' }}>
                  {f.tokenChange >= 0 ? '+' : ''}{f.tokenChange}%
                </div>
              </div>

              {/* Follow/Unfollow */}
              <button onClick={() => setFollowed(prev => ({ ...prev, [f.handle]: !prev[f.handle] }))}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
                style={followed[f.handle]
                  ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
                  : { background: `${f.color}18`, color: f.color }}>
                {followed[f.handle] ? 'Unfollow' : 'Following'}
              </button>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="text-center py-12 text-white/25">No results</div>
          )}
        </div>
      </div>
    </div>
  )
}
