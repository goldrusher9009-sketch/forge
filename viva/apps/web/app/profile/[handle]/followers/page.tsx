'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PROFILES: Record<string, { name: string; handle: string; color: string; followers: number; following: number }> = {
  sovereign_v: { name: 'Sovereign V', handle: 'sovereign_v', color: '#a855f7', followers: 148000, following: 420 },
  mayafit:     { name: 'Maya Chen',   handle: 'mayafit',     color: '#22c55e', followers: 92000,  following: 310 },
  jaxbeats:    { name: 'Jax Beats',   handle: 'jaxbeats',    color: '#ec4899', followers: 67000,  following: 880 },
}

const FOLLOWERS = [
  { handle: 'crypto_kat',   name: 'Kat Zhou',       color: '#818cf8', tokens: 50,  tier: 'Gold',    bio: 'DeFi trader. Long $VIVA.', mutual: true  },
  { handle: 'moonset99',    name: 'Moonset',         color: '#22c55e', tokens: 120, tier: 'Diamond', bio: 'Token maximalist. Always staking.', mutual: false },
  { handle: 'aisham',       name: 'Aisha M.',        color: '#f59e0b', tokens: 25,  tier: 'Silver',  bio: 'Building in public. Health + web3.', mutual: true  },
  { handle: 'reed_cross',   name: 'Reed Cross',      color: '#ec4899', tokens: 10,  tier: 'Bronze',  bio: 'Founder. Early adopter.', mutual: false },
  { handle: 'noa_d',        name: 'Noa D.',          color: '#a855f7', tokens: 200, tier: 'Diamond', bio: 'ZK researcher. VIVA OG.', mutual: true  },
  { handle: 'zara_voss',    name: 'Zara Voss',       color: '#f87171', tokens: 15,  tier: 'Bronze',  bio: 'Longevity nerd. Track everything.', mutual: false },
  { handle: 'danr',         name: 'Dan R.',           color: '#34d399', tokens: 30,  tier: 'Silver',  bio: 'ML engineer. Building agents.', mutual: true  },
  { handle: 'mateuso',      name: 'Mateus O.',        color: '#fbbf24', tokens: 5,   tier: null,      bio: 'New to VIVA. Learning.', mutual: false },
  { handle: 'luna_arts',    name: 'Luna Arts',        color: '#c084fc', tokens: 80,  tier: 'Gold',    bio: 'NFT artist. Generative & abstract.', mutual: true  },
  { handle: 'atlas_burns',  name: 'Atlas Burns',      color: '#60a5fa', tokens: 45,  tier: 'Silver',  bio: 'V-Score 890. Living optimized.', mutual: false },
]

const FOLLOWING = [
  { handle: 'sovereign_v',  name: 'Sovereign V',     color: '#a855f7', tokens: 320, tier: 'Diamond', bio: 'Finance & crypto alpha.', mutual: true  },
  { handle: 'mayafit',      name: 'Maya Chen',        color: '#22c55e', tokens: 180, tier: 'Diamond', bio: 'Biohack your life.', mutual: true  },
  { handle: 'jaxbeats',     name: 'Jax Beats',        color: '#ec4899', tokens: 90,  tier: 'Gold',    bio: 'Beat lab is open.', mutual: true  },
  { handle: 'alexpark',     name: 'Alex Park',         color: '#818cf8', tokens: 60,  tier: 'Gold',    bio: 'Web3 dev. Open source.', mutual: false },
  { handle: 'lunaarts',     name: 'Luna Arts',         color: '#c084fc', tokens: 80,  tier: 'Gold',    bio: 'NFT art. Generative.', mutual: true  },
]

const TIER_COLORS: Record<string, string> = {
  Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309',
}

export default function FollowersPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? PROFILES.sovereign_v

  const [tab, setTab] = useState<'followers' | 'following'>('followers')
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState<Set<string>>(new Set(FOLLOWERS.filter(f => f.mutual).map(f => f.handle)))

  const list = tab === 'followers' ? FOLLOWERS : FOLLOWING
  const filtered = list.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.handle.toLowerCase().includes(search.toLowerCase())
  )

  function toggleFollow(h: string) {
    setFollowing(s => {
      const n = new Set(s)
      n.has(h) ? n.delete(h) : n.add(h)
      return n
    })
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="font-black text-white">@{handle}</div>
            <div className="text-xs text-white/30">
              {(profile.followers / 1000).toFixed(0)}k followers · {profile.following} following
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          <button onClick={() => setTab('followers')}
            className="flex-1 py-2 rounded-xl text-sm font-black transition-all"
            style={tab === 'followers'
              ? { background: profile.color, color: '#04040A' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
            {(profile.followers / 1000).toFixed(0)}k Followers
          </button>
          <button onClick={() => setTab('following')}
            className="flex-1 py-2 rounded-xl text-sm font-black transition-all"
            style={tab === 'following'
              ? { background: profile.color, color: '#04040A' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
            {profile.following} Following
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M15 15l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
        </div>
      </header>

      <div className="px-4 py-3 space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/20 text-sm">No results</div>
        )}
        {filtered.map(u => (
          <div key={u.handle} className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all hover:bg-white/3">
            {/* Avatar */}
            <button onClick={() => router.push(`/profile/${u.handle}`)}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${u.color}18`, color: u.color, border: `1.5px solid ${u.color}25` }}>
                {u.name[0]}
              </div>
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => router.push(`/profile/${u.handle}`)}
                  className="font-bold text-white/85 text-sm hover:text-white transition-colors">
                  {u.name}
                </button>
                {u.tier && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: `${TIER_COLORS[u.tier]}15`, color: TIER_COLORS[u.tier] }}>
                    {u.tier}
                  </span>
                )}
                {u.mutual && (
                  <span className="text-xs text-white/25">Mutual</span>
                )}
              </div>
              <div className="text-xs text-white/30">@{u.handle}</div>
              {u.bio && <div className="text-xs text-white/35 mt-0.5 truncate">{u.bio}</div>}
              {u.tokens > 0 && (
                <div className="text-xs mt-0.5" style={{ color: profile.color }}>
                  {u.tokens} ${handle.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 5)} held
                </div>
              )}
            </div>

            {/* Follow button */}
            <button onClick={() => toggleFollow(u.handle)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
              style={following.has(u.handle)
                ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                : { background: profile.color, color: '#04040A' }}>
              {following.has(u.handle) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
