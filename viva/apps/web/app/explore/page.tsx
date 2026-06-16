'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Section = 'trending' | 'new' | 'defi' | 'fitness' | 'music' | 'rooms'

interface Creator { handle:string; name:string; color:string; verified:boolean; vscore:number; tokenSymbol:string; tokenPrice:number; tokenChange:number; followers:number; category:string }
interface Room    { id:string; title:string; host:string; color:string; live:boolean; listeners:number; category:string }
interface Post    { id:string; title:string; author:string; authorColor:string; likes:number; ts:string; category:string }

const CREATORS: Creator[] = [
  { handle:'sovereign_v', name:'Sovereign V', color:'#a855f7', verified:true,  vscore:9840, tokenSymbol:'SVRN', tokenPrice:8.75, tokenChange:4.2,   followers:48200, category:'defi'    },
  { handle:'mayafit',     name:'Maya Chen',   color:'#22c55e', verified:true,  vscore:8720, tokenSymbol:'MAYA', tokenPrice:5.20, tokenChange:-1.8,  followers:62100, category:'fitness'  },
  { handle:'jaxbeats',    name:'Jax Beats',  color:'#ec4899', verified:true,  vscore:7410, tokenSymbol:'JAX',  tokenPrice:3.80, tokenChange:7.1,   followers:34800, category:'music'    },
  { handle:'atlas_k',     name:'Atlas K',    color:'#818cf8', verified:false, vscore:6820, tokenSymbol:'ATLK', tokenPrice:4.20, tokenChange:2.8,   followers:28400, category:'defi'    },
  { handle:'lily_p',      name:'Lily Park',  color:'#f59e0b', verified:true,  vscore:6410, tokenSymbol:'LILY', tokenPrice:2.80, tokenChange:1.4,   followers:21900, category:'lifestyle'},
  { handle:'noa_d',       name:'Noa Davis',  color:'#f59e0b', verified:false, vscore:5900, tokenSymbol:'NOAD', tokenPrice:1.95, tokenChange:-0.8,  followers:18200, category:'tech'     },
]

const ROOMS: Room[] = [
  { id:'r1', title:'DeFi Alpha Room',     host:'sovereign_v', color:'#a855f7', live:true,  listeners:284, category:'defi'    },
  { id:'r2', title:'Beats & Vibes',       host:'jaxbeats',    color:'#ec4899', live:false, listeners:0,   category:'music'   },
  { id:'r3', title:'Fitness Flow',        host:'mayafit',     color:'#22c55e', live:true,  listeners:142, category:'fitness' },
  { id:'r4', title:'Crypto Macro Talk',   host:'atlas_k',     color:'#818cf8', live:true,  listeners:98,  category:'defi'    },
]

const POSTS: Post[] = [
  { id:'p1', title:'BTC accumulation zone — why I\'m adding here',     author:'sovereign_v', authorColor:'#a855f7', likes:824,  ts:'2h',  category:'defi'    },
  { id:'p2', title:'My 30-day transformation: full breakdown',          author:'mayafit',     authorColor:'#22c55e', likes:412,  ts:'5h',  category:'fitness'  },
  { id:'p3', title:'New beat pack dropping Friday',                     author:'jaxbeats',    authorColor:'#ec4899', likes:298,  ts:'1d',  category:'music'    },
  { id:'p4', title:'ETH accumulation pattern — next target is $4,800', author:'atlas_k',     authorColor:'#818cf8', likes:188,  ts:'3h',  category:'defi'    },
  { id:'p5', title:'Morning routine that changed my life',              author:'lily_p',      authorColor:'#f59e0b', likes:641,  ts:'8h',  category:'lifestyle'},
  { id:'p6', title:'Why I switched from Solana to Ethereum DeFi',      author:'noa_d',       authorColor:'#f59e0b', likes:314,  ts:'12h', category:'tech'    },
]

const SECTIONS: { key:Section; label:string; icon:string }[] = [
  { key:'trending', label:'Trending',  icon:'🔥' },
  { key:'new',      label:'New',       icon:'✨' },
  { key:'defi',     label:'DeFi',      icon:'📊' },
  { key:'fitness',  label:'Fitness',   icon:'💪' },
  { key:'music',    label:'Music',     icon:'🎵' },
  { key:'rooms',    label:'Rooms',     icon:'🎙' },
]

export default function ExplorePage() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('trending')

  const filtCreators = section === 'rooms' ? [] :
    section === 'trending' || section === 'new' ? CREATORS :
    CREATORS.filter(c => c.category === section)

  const filtRooms = section === 'rooms' || section === 'trending' ? ROOMS :
    ROOMS.filter(r => r.category === section)

  const filtPosts = section === 'rooms' ? [] :
    section === 'trending' || section === 'new' ? POSTS :
    POSTS.filter(p => p.category === section)

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
          <div className="flex-1 font-black text-white">Explore</div>
          <button onClick={() => router.push('/search/results')}
            className="p-1.5 rounded-lg text-white/40 hover:bg-white/5">🔍</button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 flex items-center gap-1"
              style={section === s.key ? { background:'#a855f7', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Live Rooms */}
        {filtRooms.length > 0 && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">🔴 Live Rooms</div>
            <div className="space-y-2">
              {filtRooms.filter(r => r.live).map(r => (
                <button key={r.id} onClick={() => router.push(`/rooms/${r.id}/chat`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${r.color}12` }}>🎙</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white/85">{r.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background:'rgba(248,113,113,0.15)', color:'#f87171' }}>LIVE</span>
                    </div>
                    <div className="text-xs text-white/30">@{r.host} · {r.listeners} listening</div>
                  </div>
                </button>
              ))}
              {filtRooms.filter(r => !r.live).map(r => (
                <button key={r.id} onClick={() => router.push(`/rooms/${r.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left opacity-50"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${r.color}08` }}>🎙</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white/60">{r.title}</div>
                    <div className="text-xs text-white/20">@{r.host} · Offline</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending creators */}
        {filtCreators.length > 0 && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">
              {section === 'new' ? '✨ New Creators' : '⭐ Top Creators'}
            </div>
            <div className="space-y-2">
              {filtCreators.map(c => (
                <button key={c.handle} onClick={() => router.push(`/profile/${c.handle}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                    style={{ background: `${c.color}15`, color: c.color }}>
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white/85">{c.name}</span>
                      {c.verified && <span className="text-xs" style={{ color:c.color }}>✓</span>}
                    </div>
                    <div className="text-xs text-white/30">@{c.handle} · {(c.followers/1000).toFixed(0)}k followers</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-xs" style={{ color:c.color }}>${c.tokenSymbol}</div>
                    <div className="text-xs font-bold" style={{ color: c.tokenChange >= 0 ? '#22c55e':'#f87171' }}>
                      {c.tokenChange >= 0 ? '+':''}{c.tokenChange}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending posts */}
        {filtPosts.length > 0 && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">🔥 Trending Posts</div>
            <div className="space-y-2">
              {filtPosts.map(p => (
                <button key={p.id} onClick={() => router.push(`/feed/${p.id}`)}
                  className="w-full p-3 rounded-2xl border border-white/4 text-left"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]"
                      style={{ background:`${p.authorColor}18`, color:p.authorColor }}>
                      {p.author[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-white/30">@{p.author}</span>
                    <span className="text-xs text-white/20">· {p.ts}</span>
                  </div>
                  <div className="font-bold text-sm text-white/80">{p.title}</div>
                  <div className="text-xs text-white/25 mt-1">♥ {p.likes.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
