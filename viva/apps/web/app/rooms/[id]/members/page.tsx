'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface RoomMember {
  handle: string
  name: string
  color: string
  role: 'host' | 'mod' | 'speaker' | 'listener'
  verified: boolean
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | null
  speaking: boolean
  muted: boolean
  tokenHeld: number
  tokenSymbol: string
  joinedAgo: string
}

const ROOMS: Record<string, { title: string; color: string; tokenSymbol: string }> = {
  r1: { title: 'DeFi Alpha Room', color: '#a855f7', tokenSymbol: 'SVRN' },
  r2: { title: 'Beats & Vibes',   color: '#ec4899', tokenSymbol: 'JAX'  },
}

const ROOM_MEMBERS: Record<string, RoomMember[]> = {
  r1: [
    { handle: 'sovereign_v', name: 'Sovereign V', color: '#a855f7', role: 'host',     verified: true,  tier: 'Diamond', speaking: true,  muted: false, tokenHeld: 500, tokenSymbol: 'SVRN', joinedAgo: '45m' },
    { handle: 'atlas_k',     name: 'Atlas K',     color: '#818cf8', role: 'speaker',  verified: true,  tier: 'Gold',    speaking: false, muted: true,  tokenHeld: 80,  tokenSymbol: 'SVRN', joinedAgo: '42m' },
    { handle: 'noa_d',       name: 'Noa D.',      color: '#f59e0b', role: 'speaker',  verified: false, tier: 'Silver',  speaking: false, muted: false, tokenHeld: 35,  tokenSymbol: 'SVRN', joinedAgo: '38m' },
    { handle: 'luna_w',      name: 'Luna W.',     color: '#ec4899', role: 'mod',      verified: true,  tier: 'Gold',    speaking: false, muted: true,  tokenHeld: 60,  tokenSymbol: 'SVRN', joinedAgo: '35m' },
    { handle: 'kai_r',       name: 'Kai R.',      color: '#22c55e', role: 'listener', verified: false, tier: 'Bronze',  speaking: false, muted: true,  tokenHeld: 12,  tokenSymbol: 'SVRN', joinedAgo: '30m' },
    { handle: 'marco_v',     name: 'Marco V.',    color: '#f87171', role: 'listener', verified: false, tier: 'Bronze',  speaking: false, muted: true,  tokenHeld: 14,  tokenSymbol: 'SVRN', joinedAgo: '25m' },
    { handle: 'jade_l',      name: 'Jade L.',     color: '#a855f7', role: 'listener', verified: false, tier: 'Silver',  speaking: false, muted: true,  tokenHeld: 28,  tokenSymbol: 'SVRN', joinedAgo: '20m' },
    { handle: 'dex_n',       name: 'Dex N.',      color: '#818cf8', role: 'listener', verified: false, tier: null,      speaking: false, muted: true,  tokenHeld: 0,   tokenSymbol: 'SVRN', joinedAgo: '15m' },
    { handle: 'sam_q',       name: 'Sam Q.',      color: '#22c55e', role: 'listener', verified: false, tier: null,      speaking: false, muted: true,  tokenHeld: 0,   tokenSymbol: 'SVRN', joinedAgo: '10m' },
    { handle: 'lily_p',      name: 'Lily P.',     color: '#f59e0b', role: 'listener', verified: true,  tier: 'Gold',    speaking: false, muted: true,  tokenHeld: 72,  tokenSymbol: 'SVRN', joinedAgo: '5m'  },
  ],
}

const ROLE_LABEL: Record<string, string> = { host: 'Host', mod: 'Mod', speaker: 'Speaker', listener: 'Listener' }
const ROLE_ORDER: Record<string, number> = { host: 0, mod: 1, speaker: 2, listener: 3 }
const TIER_COLOR: Record<string, string> = { Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309' }

export default function RoomMembersPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'r1'
  const room = ROOMS[id] ?? ROOMS.r1
  const allMembers = ROOM_MEMBERS[id] ?? ROOM_MEMBERS.r1

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'speakers' | 'holders'>('all')

  let members = allMembers
  if (search) members = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.handle.includes(search.toLowerCase()))
  if (filter === 'speakers') members = members.filter(m => m.role === 'host' || m.role === 'mod' || m.role === 'speaker')
  if (filter === 'holders')  members = members.filter(m => m.tokenHeld > 0)
  members = [...members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])

  const speakers = allMembers.filter(m => ['host','mod','speaker'].includes(m.role))
  const listeners = allMembers.filter(m => m.role === 'listener')

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
            <div className="font-black text-white">Members</div>
            <div className="text-xs text-white/30">{room.title} · {allMembers.length} in room</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Speakers',  value: speakers.length,  color: '#22c55e' },
            { label: 'Listeners', value: listeners.length, color: 'white'   },
            { label: 'Holders',   value: allMembers.filter(m => m.tokenHeld > 0).length, color: room.color },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />

        {/* Filter */}
        <div className="flex gap-1.5">
          {(['all', 'speakers', 'holders'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
              style={filter === f ? { background: room.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {members.map(m => (
            <button key={m.handle} onClick={() => router.push(`/profile/${m.handle}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                  style={{ background: `${m.color}15`, color: m.color,
                    boxShadow: m.speaking ? `0 0 0 2px ${m.color}` : undefined }}>
                  {m.name[0]}
                </div>
                {m.speaking && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: '#22c55e', border: '1.5px solid rgba(4,4,10,0.9)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/80">{m.name}</span>
                  {m.verified && <span className="text-xs" style={{ color: room.color }}>✓</span>}
                  {m.tier && (
                    <span className="text-xs px-1 py-0" style={{ color: TIER_COLOR[m.tier] }}>{m.tier[0]}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: m.role === 'host' ? room.color : m.role === 'mod' ? '#f59e0b' : m.role === 'speaker' ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                    {ROLE_LABEL[m.role]}
                  </span>
                  {m.tokenHeld > 0 && (
                    <>
                      <span className="text-white/15 text-xs">·</span>
                      <span className="text-xs text-white/25">{m.tokenHeld} ${m.tokenSymbol}</span>
                    </>
                  )}
                  <span className="text-white/15 text-xs">·</span>
                  <span className="text-xs text-white/20">{m.joinedAgo}</span>
                </div>
              </div>

              {m.muted && <span className="text-white/15 text-xs flex-shrink-0">🔇</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
