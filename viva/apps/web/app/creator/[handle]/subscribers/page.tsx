'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Subscriber {
  handle: string
  name: string
  color: string
  verified: boolean
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | null
  tokensHeld: number
  tokenSymbol: string
  monthlyValue: number
  joinedAgo: string
  active: boolean
}

const CREATOR_DATA: Record<string, { color: string; tokenSymbol: string; totalRevenue: number }> = {
  sovereign_v: { color: '#a855f7', tokenSymbol: 'SVRN', totalRevenue: 4820 },
  mayafit:     { color: '#22c55e', tokenSymbol: 'MAYA', totalRevenue: 2640 },
  jaxbeats:    { color: '#ec4899', tokenSymbol: 'JAX',  totalRevenue: 1180 },
}

const SUBS: Subscriber[] = [
  { handle:'atlas_k', name:'Atlas K',  color:'#818cf8', verified:false, tier:'Diamond', tokensHeld:200, tokenSymbol:'SVRN', monthlyValue:68.5, joinedAgo:'3 mo', active:true  },
  { handle:'lily_p',  name:'Lily P.',  color:'#f59e0b', verified:true,  tier:'Diamond', tokensHeld:180, tokenSymbol:'SVRN', monthlyValue:61.2, joinedAgo:'4 mo', active:true  },
  { handle:'jade_l',  name:'Jade L.',  color:'#a855f7', verified:false, tier:'Diamond', tokensHeld:120, tokenSymbol:'SVRN', monthlyValue:42.0, joinedAgo:'2 mo', active:true  },
  { handle:'luna_w',  name:'Luna W.',  color:'#f87171', verified:false, tier:'Gold',    tokensHeld:80,  tokenSymbol:'SVRN', monthlyValue:28.0, joinedAgo:'5 mo', active:true  },
  { handle:'noa_d',   name:'Noa D.',   color:'#f59e0b', verified:false, tier:'Silver',  tokensHeld:35,  tokenSymbol:'SVRN', monthlyValue:12.5, joinedAgo:'1 mo', active:true  },
  { handle:'kai_r',   name:'Kai R.',   color:'#22c55e', verified:false, tier:'Bronze',  tokensHeld:12,  tokenSymbol:'SVRN', monthlyValue:5.2,  joinedAgo:'6 mo', active:true  },
  { handle:'marco_v', name:'Marco V.', color:'#f87171', verified:false, tier:'Bronze',  tokensHeld:14,  tokenSymbol:'SVRN', monthlyValue:4.8,  joinedAgo:'7 mo', active:false },
  { handle:'max_t',   name:'Max T.',   color:'#ec4899', verified:false, tier:null,      tokensHeld:0,   tokenSymbol:'SVRN', monthlyValue:0,    joinedAgo:'2 mo', active:false },
]

const TIER_COLOR: Record<string, string> = { Diamond:'#818cf8', Gold:'#f59e0b', Silver:'#94a3b8', Bronze:'#b45309' }
const TIER_EMOJI: Record<string, string> = { Diamond:'💎', Gold:'🥇', Silver:'🥈', Bronze:'🥉' }

type SubFilter = 'all' | 'active' | 'diamond' | 'gold'

export default function CreatorSubscribersPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const creator = CREATOR_DATA[handle] ?? CREATOR_DATA.sovereign_v

  const [filter, setFilter] = useState<SubFilter>('all')
  const [search, setSearch] = useState('')

  let subs = SUBS
  if (filter === 'active')  subs = subs.filter(s => s.active)
  if (filter === 'diamond') subs = subs.filter(s => s.tier === 'Diamond')
  if (filter === 'gold')    subs = subs.filter(s => s.tier === 'Gold' || s.tier === 'Diamond')
  if (search) subs = subs.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.handle.includes(search.toLowerCase()))

  const active = SUBS.filter(s => s.active).length
  const mrr    = SUBS.reduce((sum, s) => sum + s.monthlyValue, 0)

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
            <div className="font-black text-white">Subscribers</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Total',    value: SUBS.length,           color: creator.color },
            { label:'Active',   value: active,                color: '#22c55e'     },
            { label:'MRR',      value: `$${mrr.toFixed(0)}`, color: '#f59e0b'     },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-base" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search subscribers…"
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />

        <div className="flex gap-1.5">
          {[
            { key:'all'     as SubFilter, label:'All'      },
            { key:'active'  as SubFilter, label:'Active'   },
            { key:'diamond' as SubFilter, label:'💎 Diamond'},
            { key:'gold'    as SubFilter, label:'🥇 Gold+' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={filter === f.key ? { background: creator.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {subs.map(s => (
            <button key={s.handle} onClick={() => router.push(`/profile/${s.handle}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${s.color}15`, color: s.color }}>
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/80">{s.name}</span>
                  {s.tier && <span className="text-xs">{TIER_EMOJI[s.tier]}</span>}
                  {s.verified && <span className="text-xs" style={{ color: creator.color }}>✓</span>}
                </div>
                <div className="text-xs text-white/25">{s.tokensHeld} ${s.tokenSymbol} · {s.joinedAgo}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm" style={{ color: s.active ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                  {s.monthlyValue > 0 ? `$${s.monthlyValue.toFixed(1)}/mo` : '—'}
                </div>
                <div className="text-xs" style={{ color: s.active ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                  {s.active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
