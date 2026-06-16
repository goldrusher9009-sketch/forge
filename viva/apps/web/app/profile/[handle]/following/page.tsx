'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PROFILES: Record<string, { name: string; color: string }> = {
  sovereign_v: { name: 'Sovereign V', color: '#a855f7' },
  mayafit:     { name: 'Maya Chen',   color: '#22c55e' },
  jaxbeats:    { name: 'Jax Beats',   color: '#ec4899' },
}

const TIERS = ['Diamond', 'Gold', 'Silver', 'Bronze', null] as const
type Tier = typeof TIERS[number]

const MOCK_FOLLOWING = [
  { handle: 'mayafit',     name: 'Maya Chen',    color: '#22c55e', vscore: 780, tier: 'Gold'    as Tier, followers: 14200, youFollow: true,  theyFollow: true  },
  { handle: 'jaxbeats',    name: 'Jax Beats',    color: '#ec4899', vscore: 650, tier: 'Silver'  as Tier, followers: 9800,  youFollow: true,  theyFollow: false },
  { handle: 'noa_d',       name: 'Noa D.',       color: '#a855f7', vscore: 820, tier: 'Diamond' as Tier, followers: 22000, youFollow: true,  theyFollow: true  },
  { handle: 'crypto_kat',  name: 'Kat Zhou',     color: '#818cf8', vscore: 710, tier: 'Gold'    as Tier, followers: 11500, youFollow: false, theyFollow: false },
  { handle: 'luna_arts',   name: 'Luna Arts',    color: '#c084fc', vscore: 590, tier: 'Silver'  as Tier, followers: 7200,  youFollow: false, theyFollow: false },
  { handle: 'atlas_burns', name: 'Atlas Burns',  color: '#60a5fa', vscore: 480, tier: 'Bronze'  as Tier, followers: 3400,  youFollow: false, theyFollow: false },
  { handle: 'danr',        name: 'Dan R.',       color: '#34d399', vscore: 540, tier: 'Bronze'  as Tier, followers: 4100,  youFollow: true,  theyFollow: false },
  { handle: 'aisham',      name: 'Aisha M.',     color: '#f59e0b', vscore: 670, tier: 'Silver'  as Tier, followers: 8900,  youFollow: false, theyFollow: false },
  { handle: 'zara_voss',   name: 'Zara Voss',    color: '#f87171', vscore: 445, tier: null,             followers: 1200,  youFollow: false, theyFollow: false },
  { handle: 'reed_cross',  name: 'Reed Cross',   color: '#ec4899', vscore: 510, tier: 'Bronze'  as Tier, followers: 2800,  youFollow: false, theyFollow: true  },
]

const TIER_COLORS: Record<string, string> = {
  Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309',
}

export default function ProfileFollowingPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? { name: handle, color: '#a855f7' }

  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_FOLLOWING.map(u => [u.handle, u.youFollow]))
  )

  const filtered = MOCK_FOLLOWING.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.handle.includes(search.toLowerCase())
  )

  function toggle(h: string) {
    setFollowing(f => ({ ...f, [h]: !f[h] }))
  }

  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

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
          <div className="flex-1">
            <div className="font-black text-white">Following</div>
            <div className="text-xs text-white/30">@{handle} · {MOCK_FOLLOWING.length} people</div>
          </div>
          <button onClick={() => router.push(`/profile/${handle}`)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: `${profile.color}15`, color: profile.color }}>
            Profile →
          </button>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M15 15l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search following…"
            className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
        </div>
      </header>

      <div className="px-4 py-3 space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/20 text-sm">No results</div>
        )}
        {filtered.map(u => {
          const isFollowing = following[u.handle]
          const mutual = u.theyFollow && isFollowing
          return (
            <div key={u.handle}
              className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <button onClick={() => router.push(`/profile/${u.handle}`)}
                className="w-11 h-11 rounded-xl flex items-center justify-center font-black flex-shrink-0"
                style={{ background: `${u.color}18`, color: u.color, border: `1.5px solid ${u.color}25` }}>
                {u.name[0]}
              </button>

              <button onClick={() => router.push(`/profile/${u.handle}`)} className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-white/85 truncate">{u.name}</span>
                  {u.tier && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: `${TIER_COLORS[u.tier]}15`, color: TIER_COLORS[u.tier] }}>
                      {u.tier[0]}
                    </span>
                  )}
                  {mutual && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                      Mutual
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/30">@{u.handle} · {fmtNum(u.followers)} followers · {u.vscore} V</div>
              </button>

              <button onClick={() => toggle(u.handle)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                style={isFollowing
                  ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                  : { background: profile.color, color: '#04040A' }}>
                {isFollowing ? 'Following' : u.theyFollow ? 'Follow Back' : 'Follow'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
