'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Follower {
  handle: string
  name: string
  color: string
  verified: boolean
  vscore: number
  tokenSymbol: string
  tokenPrice: number
  myTokens: number
  followedSince: string
  tier?: 'Diamond' | 'Gold' | 'Silver' | 'Bronze'
}

const PROFILE_FOLLOWERS: Record<string, Follower[]> = {
  sovereign_v: [
    { handle:'atlas_k',  name:'Atlas K',   color:'#818cf8', verified:false, vscore:6820, tokenSymbol:'ATLK', tokenPrice:4.20, myTokens:80,  followedSince:'Jan 2026', tier:'Diamond' },
    { handle:'lily_p',   name:'Lily Park',  color:'#f59e0b', verified:true,  vscore:6410, tokenSymbol:'LILY', tokenPrice:2.80, myTokens:72,  followedSince:'Feb 2026', tier:'Gold'    },
    { handle:'luna_w',   name:'Luna Walsh', color:'#f87171', verified:false, vscore:5900, tokenSymbol:'LUNA', tokenPrice:1.95, myTokens:60,  followedSince:'Mar 2026', tier:'Gold'    },
    { handle:'jade_l',   name:'Jade Lee',   color:'#a855f7', verified:false, vscore:5200, tokenSymbol:'JADL', tokenPrice:1.20, myTokens:180, followedSince:'Dec 2025', tier:'Diamond' },
    { handle:'noa_d',    name:'Noa Davis',  color:'#f59e0b', verified:false, vscore:4800, tokenSymbol:'NOAD', tokenPrice:0.95, myTokens:35,  followedSince:'Apr 2026', tier:'Silver'  },
    { handle:'kai_r',    name:'Kai Reed',   color:'#22c55e', verified:false, vscore:4200, tokenSymbol:'KAIR', tokenPrice:0.60, myTokens:12,  followedSince:'May 2026', tier:'Bronze'  },
    { handle:'max_t',    name:'Max Tran',   color:'#ec4899', verified:false, vscore:3800, tokenSymbol:'MAXT', tokenPrice:0.55, myTokens:30,  followedSince:'May 2026', tier:'Silver'  },
    { handle:'marco_v',  name:'Marco V.',   color:'#f87171', verified:false, vscore:3200, tokenSymbol:'MARV', tokenPrice:0.40, myTokens:14,  followedSince:'Jun 2026', tier:'Bronze'  },
    { handle:'dex_n',    name:'Dex North',  color:'#818cf8', verified:false, vscore:2800, tokenSymbol:'DEXN', tokenPrice:0.30, myTokens:0,   followedSince:'Jun 2026'               },
    { handle:'sam_q',    name:'Sam Quinn',  color:'#22c55e', verified:false, vscore:1900, tokenSymbol:'SAMQ', tokenPrice:0.20, myTokens:0,   followedSince:'Jun 2026'               },
  ],
}

const PROFILE_COLORS: Record<string, string> = { sovereign_v:'#a855f7', mayafit:'#22c55e', jaxbeats:'#ec4899' }
const TIER_COLOR: Record<string, string> = { Diamond:'#818cf8', Gold:'#f59e0b', Silver:'#94a3b8', Bronze:'#b45309' }
const TIER_EMOJI: Record<string, string> = { Diamond:'💎', Gold:'🥇', Silver:'🥈', Bronze:'🥉' }

export default function ProfileFollowersPage() {
  const router = useRouter()
  const params = useParams()
  const handle   = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const list     = PROFILE_FOLLOWERS[handle] ?? PROFILE_FOLLOWERS.sovereign_v
  const accent   = PROFILE_COLORS[handle] ?? '#a855f7'

  const [search,  setSearch ] = useState('')
  const [filter,  setFilter ] = useState<'all' | 'diamond' | 'gold' | 'holding'>('all')
  const [followed, setFollowed] = useState<Record<string, boolean>>({})

  const visible = list.filter(f => {
    if (filter === 'diamond' && f.tier !== 'Diamond') return false
    if (filter === 'gold' && f.tier !== 'Gold') return false
    if (filter === 'holding' && f.myTokens === 0) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.handle.includes(search.toLowerCase())) return false
    return true
  })

  const diamondCt = list.filter(f => f.tier === 'Diamond').length
  const goldCt    = list.filter(f => f.tier === 'Gold').length
  const holdingCt = list.filter(f => f.myTokens > 0).length

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
            <div className="font-black text-white">Followers</div>
            <div className="text-xs text-white/30">@{handle} · {list.length.toLocaleString()}</div>
          </div>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search followers…"
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label:'Total',    value:list.length, color:'rgba(255,255,255,0.5)' },
            { label:'💎',       value:diamondCt,   color:'#818cf8' },
            { label:'🥇',       value:goldCt,      color:'#f59e0b' },
            { label:'Holders',  value:holdingCt,   color:accent },
          ].map(s => (
            <div key={s.label} className="p-2 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/20">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {([['all','All'],['diamond','💎 Diamond'],['gold','🥇 Gold'],['holding','Holding']] as const).map(([k,l]) => (
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${f.color}15`, color: f.color }}>
                  {f.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white/85">{f.name}</span>
                    {f.verified && <span className="text-xs" style={{ color: accent }}>✓</span>}
                    {f.tier && <span className="text-xs" style={{ color: TIER_COLOR[f.tier] }}>{TIER_EMOJI[f.tier]}</span>}
                  </div>
                  <div className="text-xs text-white/25">
                    @{f.handle}
                    {f.myTokens > 0 && <span className="ml-1" style={{ color: accent }}>· {f.myTokens} ${f.tokenSymbol}</span>}
                  </div>
                </div>
              </button>
              <button onClick={() => setFollowed(p => ({ ...p, [f.handle]: !p[f.handle] }))}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
                style={followed[f.handle]
                  ? { background: `${f.color}18`, color: f.color }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                {followed[f.handle] ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
          {visible.length === 0 && <div className="text-center py-12 text-white/25">No results</div>}
        </div>
      </div>
    </div>
  )
}
