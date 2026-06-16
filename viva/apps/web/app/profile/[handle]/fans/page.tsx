'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Fan {
  handle: string
  name: string
  color: string
  verified: boolean
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze'
  tokensHeld: number
  tokenSymbol: string
  tipped: number
  followedAgo: string
  isFollowingBack: boolean
}

const PROFILE_FANS: Record<string, Fan[]> = {
  sovereign_v: [
    { handle: 'atlas_k',  name: 'Atlas K',   color: '#818cf8', verified: true,  tier: 'Diamond', tokensHeld: 1200, tokenSymbol: 'SVRN', tipped: 450,  followedAgo: '6mo', isFollowingBack: true  },
    { handle: 'lily_p',   name: 'Lily P.',   color: '#f59e0b', verified: true,  tier: 'Diamond', tokensHeld: 980,  tokenSymbol: 'SVRN', tipped: 280,  followedAgo: '4mo', isFollowingBack: false },
    { handle: 'luna_w',   name: 'Luna W.',   color: '#f87171', verified: false, tier: 'Gold',    tokensHeld: 580,  tokenSymbol: 'SVRN', tipped: 120,  followedAgo: '3mo', isFollowingBack: false },
    { handle: 'noa_d',    name: 'Noa D.',    color: '#22c55e', verified: false, tier: 'Gold',    tokensHeld: 440,  tokenSymbol: 'SVRN', tipped: 80,   followedAgo: '2mo', isFollowingBack: true  },
    { handle: 'kai_r',    name: 'Kai R.',    color: '#f59e0b', verified: false, tier: 'Silver',  tokensHeld: 280,  tokenSymbol: 'SVRN', tipped: 50,   followedAgo: '2mo', isFollowingBack: false },
    { handle: 'marco_v',  name: 'Marco V.',  color: '#f87171', verified: false, tier: 'Silver',  tokensHeld: 120,  tokenSymbol: 'SVRN', tipped: 25,   followedAgo: '1mo', isFollowingBack: false },
    { handle: 'jade_l',   name: 'Jade L.',   color: '#a855f7', verified: false, tier: 'Bronze',  tokensHeld: 85,   tokenSymbol: 'SVRN', tipped: 10,   followedAgo: '3w',  isFollowingBack: false },
    { handle: 'dex_n',    name: 'Dex N.',    color: '#818cf8', verified: false, tier: 'Bronze',  tokensHeld: 42,   tokenSymbol: 'SVRN', tipped: 0,    followedAgo: '1w',  isFollowingBack: false },
    { handle: 'sam_q',    name: 'Sam Q.',    color: '#22c55e', verified: false, tier: 'Bronze',  tokensHeld: 30,   tokenSymbol: 'SVRN', tipped: 0,    followedAgo: '3d',  isFollowingBack: false },
  ],
  mayafit: [
    { handle: 'luna_w',   name: 'Luna W.',   color: '#f87171', verified: false, tier: 'Gold',    tokensHeld: 220,  tokenSymbol: 'MAYA', tipped: 90,   followedAgo: '5mo', isFollowingBack: true  },
    { handle: 'kai_r',    name: 'Kai R.',    color: '#f59e0b', verified: false, tier: 'Silver',  tokensHeld: 80,   tokenSymbol: 'MAYA', tipped: 40,   followedAgo: '2mo', isFollowingBack: false },
    { handle: 'max_t',    name: 'Max T.',    color: '#ec4899', verified: false, tier: 'Silver',  tokensHeld: 60,   tokenSymbol: 'MAYA', tipped: 20,   followedAgo: '1mo', isFollowingBack: true  },
  ],
}

const TIER_COLOR: Record<string, string> = { Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309' }
const PROFILE_COLORS: Record<string, string> = { sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899' }

type TierFilter = 'all' | 'Diamond' | 'Gold' | 'Silver' | 'Bronze'
type SortKey = 'tokens' | 'tipped' | 'recent'

export default function ProfileFansPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const fans = PROFILE_FANS[handle] ?? PROFILE_FANS.sovereign_v
  const accentColor = PROFILE_COLORS[handle] ?? '#a855f7'

  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [sort, setSort] = useState<SortKey>('tokens')
  const [following, setFollowing] = useState<Record<string, boolean>>(
    Object.fromEntries(fans.map(f => [f.handle, f.isFollowingBack]))
  )

  let list = [...fans]
  if (tierFilter !== 'all') list = list.filter(f => f.tier === tierFilter)
  list.sort((a, b) => {
    if (sort === 'tipped') return b.tipped - a.tipped
    if (sort === 'recent') return 0 // already sorted
    return b.tokensHeld - a.tokensHeld
  })

  const totalFans = fans.length
  const diamondCount = fans.filter(f => f.tier === 'Diamond').length
  const totalTipped = fans.reduce((s, f) => s + f.tipped, 0)

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
            <div className="font-black text-white">Token Fans</div>
            <div className="text-xs text-white/30">@{handle} · {totalFans} holders</div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(['all','Diamond','Gold','Silver','Bronze'] as TierFilter[]).map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={tierFilter === t
                ? { background: t === 'all' ? accentColor : TIER_COLOR[t], color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: 'Total Fans', v: totalFans,              color: accentColor },
            { l: 'Diamond',    v: diamondCount,            color: '#818cf8'  },
            { l: 'Tipped',     v: `$${totalTipped}`,      color: '#22c55e'  },
          ].map(s => (
            <div key={s.l} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-base" style={{ color: s.color }}>{s.v}</div>
              <div className="text-xs text-white/25">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1.5">
          {([['tokens','By Tokens'],['tipped','By Tips'],['recent','Recent']] as [SortKey,string][]).map(([k,l]) => (
            <button key={k} onClick={() => setSort(k)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={sort === k ? { background: accentColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Fan list */}
        <div className="space-y-2">
          {list.map(f => (
            <div key={f.handle} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <button onClick={() => router.push(`/profile/${f.handle}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${f.color}18`, color: f.color }}>
                  {f.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white/80">{f.name}</span>
                    {f.verified && <span className="text-xs" style={{ color: accentColor }}>✓</span>}
                    <span className="text-xs" style={{ color: TIER_COLOR[f.tier] }}>{f.tier[0]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/25">
                    <span>{f.tokensHeld} ${f.tokenSymbol}</span>
                    {f.tipped > 0 && <><span>·</span><span className="text-green-400/50">${f.tipped} tipped</span></>}
                    <span>·</span><span>{f.followedAgo}</span>
                  </div>
                </div>
              </button>
              <button onClick={() => setFollowing(prev => ({ ...prev, [f.handle]: !prev[f.handle] }))}
                className="px-3 py-1.5 rounded-full text-xs font-black flex-shrink-0"
                style={following[f.handle]
                  ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }
                  : { background: accentColor, color: '#04040A' }}>
                {following[f.handle] ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
