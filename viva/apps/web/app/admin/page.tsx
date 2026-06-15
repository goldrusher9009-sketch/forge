'use client'
import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'users' | 'posts' | 'markets' | 'rooms' | 'reports' | 'bans'

interface AdminUser {
  id: string; handle: string; displayName: string; email: string
  vscore: number; tier: string; banned: boolean; suspended: boolean
  createdAt: string; lastSeen?: string; postCount?: number; reportCount?: number
}
interface AdminPost {
  id: string; authorHandle: string; content: string; likes: number
  comments: number; reported: boolean; hidden: boolean; createdAt: string
}
interface AdminMarket {
  id: string; title: string; status: string; yesStake: number; noStake: number
  resolvedAt?: string; createdAt: string; creatorHandle: string
}
interface AdminRoom {
  id: string; title: string; type: string; memberCount: number
  live: boolean; createdAt: string; hostHandle: string; vscoreGate: number
}
interface AdminReport {
  id: string; type: 'post' | 'user' | 'room'; targetId: string
  targetHandle?: string; reason: string; reporterHandle: string
  status: 'open' | 'resolved' | 'dismissed'; createdAt: string
}
interface AdminBan {
  id: string; handle: string; reason: string; bannedBy: string
  type: 'ban' | 'suspend'; expiresAt?: string; createdAt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_USERS: AdminUser[] = [
  { id: 'u1', handle: 'sovereign', displayName: 'Sovereign One', email: 'sovereign@viva.io', vscore: 920, tier: 'guardian', banned: false, suspended: false, createdAt: '2024-01-01', lastSeen: '2026-06-14', postCount: 142, reportCount: 0 },
  { id: 'u2', handle: 'luna_v', displayName: 'Luna V', email: 'luna@viva.io', vscore: 850, tier: 'guardian', banned: false, suspended: false, createdAt: '2024-02-14', lastSeen: '2026-06-13', postCount: 87, reportCount: 1 },
  { id: 'u3', handle: 'aisham', displayName: 'Aisham', email: 'aisham@viva.io', vscore: 780, tier: 'proven', banned: false, suspended: false, createdAt: '2024-03-01', lastSeen: '2026-06-12', postCount: 63, reportCount: 2 },
  { id: 'u4', handle: 'noa_d', displayName: 'Noa D', email: 'noa@viva.io', vscore: 710, tier: 'proven', banned: false, suspended: true, createdAt: '2024-04-05', lastSeen: '2026-06-01', postCount: 29, reportCount: 5 },
  { id: 'u5', handle: 'spambot99', displayName: 'SpamBot', email: 'spam@fake.com', vscore: 120, tier: 'seeker', banned: true, suspended: false, createdAt: '2026-05-01', lastSeen: '2026-05-02', postCount: 341, reportCount: 18 },
  { id: 'u6', handle: 'zerov', displayName: 'Zero V', email: 'zero@viva.io', vscore: 450, tier: 'seeker', banned: false, suspended: false, createdAt: '2024-09-10', lastSeen: '2026-06-14', postCount: 12, reportCount: 0 },
]
const MOCK_POSTS: AdminPost[] = [
  { id: 'p1', authorHandle: 'sovereign', content: 'The ZK proof future is here — your health data, your sovereign proof.', likes: 312, comments: 42, reported: false, hidden: false, createdAt: '2026-06-14' },
  { id: 'p2', authorHandle: 'luna_v', content: 'V-Score 850 hit! Guardian tier unlocked 🔓 The grind was real', likes: 198, comments: 31, reported: false, hidden: false, createdAt: '2026-06-13' },
  { id: 'p3', authorHandle: 'spambot99', content: 'BUY CRYPTO NOW!! 1000x guaranteed click here → fake-link.xyz', likes: 0, comments: 2, reported: true, hidden: true, createdAt: '2026-05-02' },
  { id: 'p4', authorHandle: 'noa_d', content: 'Regenerative finance is how we fund the sovereign body', likes: 87, comments: 14, reported: true, hidden: false, createdAt: '2026-06-10' },
  { id: 'p5', authorHandle: 'aisham', content: 'Sleep optimization protocol: 4-7-8 breathing + 18°C room = +23 V-Score this week', likes: 445, comments: 67, reported: false, hidden: false, createdAt: '2026-06-12' },
]
const MOCK_MARKETS: AdminMarket[] = [
  { id: 'm1', title: 'BTC > $120K by end of 2026', status: 'open', yesStake: 84200, noStake: 31800, createdAt: '2026-01-01', creatorHandle: 'sovereign' },
  { id: 'm2', title: 'ETH Merge 2.0 ships by Q3 2026', status: 'open', yesStake: 52000, noStake: 48000, createdAt: '2026-02-01', creatorHandle: 'luna_v' },
  { id: 'm3', title: 'VIVA reaches 10K users by July 2026', status: 'open', yesStake: 71000, noStake: 29000, createdAt: '2026-03-15', creatorHandle: 'aisham' },
  { id: 'm4', title: 'ZK passport accepted in 3+ countries', status: 'resolved', yesStake: 38000, noStake: 12000, resolvedAt: '2026-05-01', createdAt: '2025-11-01', creatorHandle: 'noa_d' },
]
const MOCK_ROOMS: AdminRoom[] = [
  { id: 'r1', title: 'Biohackers Anonymous', type: 'audio', memberCount: 28, live: true, createdAt: '2026-06-14', hostHandle: 'sovereign', vscoreGate: 400 },
  { id: 'r2', title: 'ZK Identity + Self-Sovereignty', type: 'video', memberCount: 14, live: true, createdAt: '2026-06-14', hostHandle: 'luna_v', vscoreGate: 600 },
  { id: 'r3', title: 'Regenerative Finance Alpha', type: 'chat', memberCount: 91, live: false, createdAt: '2026-06-01', hostHandle: 'aisham', vscoreGate: 0 },
  { id: 'r4', title: 'Spam Room — flagged', type: 'audio', memberCount: 3, live: false, createdAt: '2026-05-20', hostHandle: 'spambot99', vscoreGate: 0 },
]
const MOCK_REPORTS: AdminReport[] = [
  { id: 'rep1', type: 'post', targetId: 'p3', targetHandle: 'spambot99', reason: 'Spam and phishing link', reporterHandle: 'sovereign', status: 'resolved', createdAt: '2026-05-02' },
  { id: 'rep2', type: 'user', targetId: 'u4', targetHandle: 'noa_d', reason: 'Harassment in DMs', reporterHandle: 'luna_v', status: 'open', createdAt: '2026-06-10' },
  { id: 'rep3', type: 'post', targetId: 'p4', targetHandle: 'noa_d', reason: 'Misinformation about health claims', reporterHandle: 'aisham', status: 'open', createdAt: '2026-06-11' },
  { id: 'rep4', type: 'room', targetId: 'r4', targetHandle: 'spambot99', reason: 'Spam room recruiting for scam', reporterHandle: 'zerov', status: 'open', createdAt: '2026-05-21' },
]
const MOCK_BANS: AdminBan[] = [
  { id: 'b1', handle: 'spambot99', reason: 'Repeated spam + phishing links across 10+ posts', bannedBy: 'admin', type: 'ban', createdAt: '2026-05-02' },
  { id: 'b2', handle: 'noa_d', reason: 'Harassment reports — 3 confirmed', bannedBy: 'admin', type: 'suspend', expiresAt: '2026-07-01', createdAt: '2026-06-12' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relTime(ts: string) {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40`, fontSize: '0.6rem', letterSpacing: '0.05em' }}>
      {label.toUpperCase()}
    </span>
  )
}

function StatTile({ label, value, sub, color = '#fff' }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="p-4 border border-white/8 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview({ users, posts, markets, rooms, reports }: { users: AdminUser[]; posts: AdminPost[]; markets: AdminMarket[]; rooms: AdminRoom[]; reports: AdminReport[] }) {
  const activeUsers = users.filter(u => !u.banned && !u.suspended).length
  const openReports = reports.filter(r => r.status === 'open').length
  const liveRooms = rooms.filter(r => r.live).length
  const hiddenPosts = posts.filter(p => p.hidden).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Total Users" value={users.length} sub={`${activeUsers} active`} color="var(--v)" />
        <StatTile label="Total Posts" value={posts.length} sub={`${hiddenPosts} hidden`} color="#34d399" />
        <StatTile label="Open Reports" value={openReports} sub="needs review" color={openReports > 0 ? '#f87171' : '#34d399'} />
        <StatTile label="Live Rooms" value={liveRooms} sub={`${rooms.length} total`} color="#60a5fa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent reports */}
        <div className="border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/6" style={{ background: 'rgba(248,113,113,0.06)' }}>
            <p className="text-xs font-semibold text-red-400">⚠ Open Reports</p>
          </div>
          <div className="divide-y divide-white/4">
            {reports.filter(r => r.status === 'open').map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/80">{r.reason}</p>
                  <p className="text-xs text-white/35 mt-0.5">by <span className="text-white/55">@{r.reporterHandle}</span> · {relTime(r.createdAt)}</p>
                </div>
                <Badge label={r.type} color="#f87171" />
              </div>
            ))}
          </div>
        </div>

        {/* Banned users summary */}
        <div className="border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/6" style={{ background: 'rgba(124,58,237,0.06)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--v)' }}>🔒 Banned / Suspended</p>
          </div>
          <div className="divide-y divide-white/4">
            {users.filter(u => u.banned || u.suspended).map(u => (
              <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/80">@{u.handle}</p>
                  <p className="text-xs text-white/35 mt-0.5">V-Score {u.vscore} · {u.postCount} posts</p>
                </div>
                <Badge label={u.banned ? 'banned' : 'suspended'} color={u.banned ? '#f87171' : '#fb923c'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ users, setUsers }: { users: AdminUser[]; setUsers: (u: AdminUser[]) => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'banned' | 'suspended' | 'reported'>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [vscoreEdit, setVscoreEdit] = useState('')

  const filtered = users.filter(u => {
    const matchQ = !search || u.handle.includes(search.toLowerCase()) || u.displayName.toLowerCase().includes(search.toLowerCase())
    const matchF = filter === 'all' || (filter === 'banned' && u.banned) || (filter === 'suspended' && u.suspended) || (filter === 'reported' && (u.reportCount ?? 0) > 0)
    return matchQ && matchF
  })

  function ban(id: string) { setUsers(users.map(u => u.id === id ? { ...u, banned: true, suspended: false } : u)) }
  function unban(id: string) { setUsers(users.map(u => u.id === id ? { ...u, banned: false } : u)) }
  function suspend(id: string) { setUsers(users.map(u => u.id === id ? { ...u, suspended: true } : u)) }
  function unsuspend(id: string) { setUsers(users.map(u => u.id === id ? { ...u, suspended: false } : u)) }
  function saveVscore(id: string) {
    const v = parseInt(vscoreEdit)
    if (!isNaN(v)) setUsers(users.map(u => u.id === id ? { ...u, vscore: Math.min(1000, Math.max(0, v)) } : u))
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search handle or name…"
          className="flex-1 min-w-48 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/4 text-white placeholder-white/30 outline-none focus:border-white/25" />
        {(['all', 'banned', 'suspended', 'reported'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-2 text-xs rounded-lg border transition-all capitalize"
            style={{ border: `1px solid ${filter === f ? 'var(--v)' : 'rgba(255,255,255,0.1)'}`, background: filter === f ? 'rgba(124,58,237,0.12)' : 'transparent', color: filter === f ? 'var(--v)' : 'rgba(255,255,255,0.45)' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="border border-white/8 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/6 text-xs text-white/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">V-Score</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Posts</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Reports</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white/85">@{u.handle}</p>
                  <p className="text-xs text-white/35">{u.email}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {editing === u.id ? (
                    <div className="flex gap-1">
                      <input value={vscoreEdit} onChange={e => setVscoreEdit(e.target.value)}
                        className="w-16 px-2 py-1 text-xs rounded border border-white/20 bg-white/6 text-white outline-none"
                        onKeyDown={e => e.key === 'Enter' && saveVscore(u.id)} autoFocus />
                      <button onClick={() => saveVscore(u.id)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--v)' }}>✓</button>
                      <button onClick={() => setEditing(null)} className="text-xs px-2 py-1 rounded text-white/30">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditing(u.id); setVscoreEdit(String(u.vscore)) }}
                      className="font-mono text-sm hover:text-white transition-colors" style={{ color: u.vscore >= 700 ? '#a78bfa' : u.vscore >= 400 ? '#60a5fa' : '#94a3b8' }}>
                      {u.vscore}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-white/40 text-xs">{u.postCount ?? '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={`text-xs font-mono ${(u.reportCount ?? 0) > 3 ? 'text-red-400' : 'text-white/40'}`}>{u.reportCount ?? 0}</span>
                </td>
                <td className="px-4 py-3">
                  {u.banned ? <Badge label="banned" color="#f87171" /> : u.suspended ? <Badge label="suspended" color="#fb923c" /> : <Badge label="active" color="#34d399" />}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 justify-end flex-wrap">
                    {!u.banned && !u.suspended && (
                      <>
                        <button onClick={() => suspend(u.id)} className="text-xs px-2.5 py-1 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors">Suspend</button>
                        <button onClick={() => ban(u.id)} className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Ban</button>
                      </>
                    )}
                    {u.suspended && <button onClick={() => unsuspend(u.id)} className="text-xs px-2.5 py-1 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">Unsuspend</button>}
                    {u.banned && <button onClick={() => unban(u.id)} className="text-xs px-2.5 py-1 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">Unban</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Posts Tab ────────────────────────────────────────────────────────────────
function PostsTab({ posts, setPosts }: { posts: AdminPost[]; setPosts: (p: AdminPost[]) => void }) {
  const [filter, setFilter] = useState<'all' | 'reported' | 'hidden'>('all')

  const filtered = posts.filter(p =>
    filter === 'all' ? true : filter === 'reported' ? p.reported : p.hidden
  )

  function hide(id: string) { setPosts(posts.map(p => p.id === id ? { ...p, hidden: true } : p)) }
  function unhide(id: string) { setPosts(posts.map(p => p.id === id ? { ...p, hidden: false } : p)) }
  function dismiss(id: string) { setPosts(posts.map(p => p.id === id ? { ...p, reported: false } : p)) }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'reported', 'hidden'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-2 text-xs rounded-lg border transition-all capitalize"
            style={{ border: `1px solid ${filter === f ? 'var(--v)' : 'rgba(255,255,255,0.1)'}`, background: filter === f ? 'rgba(124,58,237,0.12)' : 'transparent', color: filter === f ? 'var(--v)' : 'rgba(255,255,255,0.45)' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="border border-white/8 rounded-xl p-4"
            style={{ background: p.reported ? 'rgba(248,113,113,0.03)' : 'rgba(255,255,255,0.01)', opacity: p.hidden ? 0.5 : 1 }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-white/50">@{p.authorHandle}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-xs text-white/30">{p.createdAt}</span>
                  {p.reported && <Badge label="reported" color="#f87171" />}
                  {p.hidden && <Badge label="hidden" color="#94a3b8" />}
                </div>
                <p className="text-sm text-white/75 leading-relaxed">{p.content}</p>
                <div className="flex gap-4 mt-2 text-xs text-white/30">
                  <span>♡ {p.likes}</span>
                  <span>💬 {p.comments}</span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-col flex-shrink-0">
                {!p.hidden
                  ? <button onClick={() => hide(p.id)} className="text-xs px-2.5 py-1 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors">Hide</button>
                  : <button onClick={() => unhide(p.id)} className="text-xs px-2.5 py-1 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">Unhide</button>
                }
                {p.reported && <button onClick={() => dismiss(p.id)} className="text-xs px-2.5 py-1 rounded-lg border border-white/15 text-white/40 hover:text-white/60 transition-colors">Dismiss</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Markets Tab ──────────────────────────────────────────────────────────────
function MarketsTab({ markets, setMarkets }: { markets: AdminMarket[]; setMarkets: (m: AdminMarket[]) => void }) {
  function resolve(id: string, outcome: 'YES' | 'NO') {
    setMarkets(markets.map(m => m.id === id ? { ...m, status: `resolved_${outcome}`, resolvedAt: new Date().toISOString().split('T')[0] } : m))
  }
  function closeMarket(id: string) {
    setMarkets(markets.map(m => m.id === id ? { ...m, status: 'closed' } : m))
  }

  return (
    <div className="space-y-3">
      {markets.map(m => {
        const total = m.yesStake + m.noStake
        const yesPct = total ? Math.round((m.yesStake / total) * 100) : 50
        return (
          <div key={m.id} className="border border-white/8 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge label={m.status} color={m.status === 'open' ? '#34d399' : '#94a3b8'} />
                  <span className="text-xs text-white/35">by @{m.creatorHandle}</span>
                </div>
                <p className="text-sm font-medium text-white/85 mb-3">{m.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400">YES {yesPct}%</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${yesPct}%`, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }} />
                  </div>
                  <span className="text-xs text-red-400">NO {100 - yesPct}%</span>
                </div>
                <p className="text-xs text-white/30 mt-1">{(total / 1000).toFixed(1)}K tokens staked</p>
              </div>
              {m.status === 'open' && (
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => resolve(m.id, 'YES')} className="text-xs px-2.5 py-1 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">Resolve YES</button>
                  <button onClick={() => resolve(m.id, 'NO')} className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Resolve NO</button>
                  <button onClick={() => closeMarket(m.id)} className="text-xs px-2.5 py-1 rounded-lg border border-white/15 text-white/40 hover:text-white/60 transition-colors">Close</button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Rooms Tab ────────────────────────────────────────────────────────────────
function RoomsTab({ rooms, setRooms }: { rooms: AdminRoom[]; setRooms: (r: AdminRoom[]) => void }) {
  function closeRoom(id: string) { setRooms(rooms.map(r => r.id === id ? { ...r, live: false } : r)) }
  function setGate(id: string, gate: number) { setRooms(rooms.map(r => r.id === id ? { ...r, vscoreGate: gate } : r)) }

  return (
    <div className="space-y-3">
      {rooms.map(r => (
        <div key={r.id} className="border border-white/8 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {r.live && <span className="inline-flex items-center gap-1 text-xs text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />LIVE</span>}
                <Badge label={r.type} color="#60a5fa" />
                <span className="text-xs text-white/35">host: @{r.hostHandle}</span>
              </div>
              <p className="text-sm font-medium text-white/85">{r.title}</p>
              <div className="flex gap-4 mt-2 text-xs text-white/35">
                <span>👥 {r.memberCount} members</span>
                <span>🔒 V-Score gate: {r.vscoreGate > 0 ? r.vscoreGate : 'None'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {r.live && <button onClick={() => closeRoom(r.id)} className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Close Room</button>}
              <select value={r.vscoreGate}
                onChange={e => setGate(r.id, parseInt(e.target.value))}
                className="text-xs px-2 py-1 rounded-lg border border-white/15 bg-white/5 text-white/60 outline-none">
                <option value={0}>No gate</option>
                <option value={200}>200+</option>
                <option value={400}>400+</option>
                <option value={600}>600+</option>
                <option value={800}>800+</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ reports, setReports }: { reports: AdminReport[]; setReports: (r: AdminReport[]) => void }) {
  const [filter, setFilter] = useState<'open' | 'resolved' | 'dismissed' | 'all'>('open')

  function resolve(id: string) { setReports(reports.map(r => r.id === id ? { ...r, status: 'resolved' } : r)) }
  function dismiss(id: string) { setReports(reports.map(r => r.id === id ? { ...r, status: 'dismissed' } : r)) }

  const filtered = reports.filter(r => filter === 'all' || r.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['open', 'resolved', 'dismissed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-2 text-xs rounded-lg border transition-all capitalize"
            style={{ border: `1px solid ${filter === f ? 'var(--v)' : 'rgba(255,255,255,0.1)'}`, background: filter === f ? 'rgba(124,58,237,0.12)' : 'transparent', color: filter === f ? 'var(--v)' : 'rgba(255,255,255,0.45)' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="border border-white/8 rounded-xl p-4"
            style={{ background: r.status === 'open' ? 'rgba(248,113,113,0.03)' : 'rgba(255,255,255,0.01)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex gap-2 mb-1.5 flex-wrap">
                  <Badge label={r.type} color="#60a5fa" />
                  <Badge label={r.status} color={r.status === 'open' ? '#f87171' : r.status === 'resolved' ? '#34d399' : '#94a3b8'} />
                  {r.targetHandle && <span className="text-xs text-white/40">@{r.targetHandle}</span>}
                </div>
                <p className="text-sm text-white/75">{r.reason}</p>
                <p className="text-xs text-white/30 mt-1">reported by @{r.reporterHandle} · {relTime(r.createdAt)}</p>
              </div>
              {r.status === 'open' && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => resolve(r.id)} className="text-xs px-2.5 py-1 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">Resolve</button>
                  <button onClick={() => dismiss(r.id)} className="text-xs px-2.5 py-1 rounded-lg border border-white/15 text-white/40 hover:text-white/60 transition-colors">Dismiss</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/25 text-sm">No {filter} reports</div>
        )}
      </div>
    </div>
  )
}

// ─── Bans Tab ─────────────────────────────────────────────────────────────────
function BansTab({ bans, setBans, users }: { bans: AdminBan[]; setBans: (b: AdminBan[]) => void; users: AdminUser[] }) {
  const [newHandle, setNewHandle] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newType, setNewType] = useState<'ban' | 'suspend'>('suspend')
  const [adding, setAdding] = useState(false)

  function addBan() {
    if (!newHandle || !newReason) return
    setBans([{ id: `b${Date.now()}`, handle: newHandle, reason: newReason, bannedBy: 'admin', type: newType, createdAt: new Date().toISOString().split('T')[0] }, ...bans])
    setNewHandle(''); setNewReason(''); setAdding(false)
  }
  function removeBan(id: string) { setBans(bans.filter(b => b.id !== id)) }

  return (
    <div className="space-y-4">
      <button onClick={() => setAdding(!adding)}
        className="px-4 py-2 text-sm rounded-xl border border-white/15 text-white/70 hover:border-white/30 hover:text-white transition-all">
        {adding ? '✕ Cancel' : '+ New Ban / Suspension'}
      </button>

      {adding && (
        <div className="border border-white/10 rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newHandle} onChange={e => setNewHandle(e.target.value)} placeholder="Handle (without @)"
              className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/4 text-white placeholder-white/30 outline-none focus:border-white/25" />
            <select value={newType} onChange={e => setNewType(e.target.value as 'ban' | 'suspend')}
              className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/4 text-white outline-none">
              <option value="suspend">Suspend</option>
              <option value="ban">Permanent Ban</option>
            </select>
          </div>
          <textarea value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Reason for action…" rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/4 text-white placeholder-white/30 outline-none focus:border-white/25 resize-none" />
          <button onClick={addBan} className="px-4 py-2 text-sm rounded-lg text-white font-medium transition-all"
            style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.5)' }}>
            Confirm {newType === 'ban' ? 'Ban' : 'Suspension'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {bans.map(b => (
          <div key={b.id} className="border border-white/8 rounded-xl p-4 flex items-start justify-between gap-3"
            style={{ background: b.type === 'ban' ? 'rgba(248,113,113,0.03)' : 'rgba(251,146,60,0.03)' }}>
            <div>
              <div className="flex gap-2 mb-1">
                <span className="font-medium text-sm text-white/85">@{b.handle}</span>
                <Badge label={b.type} color={b.type === 'ban' ? '#f87171' : '#fb923c'} />
              </div>
              <p className="text-xs text-white/50">{b.reason}</p>
              <p className="text-xs text-white/25 mt-1">by {b.bannedBy} · {b.createdAt}{b.expiresAt ? ` · expires ${b.expiresAt}` : ''}</p>
            </div>
            <button onClick={() => removeBan(b.id)} className="text-xs px-2.5 py-1 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors flex-shrink-0">Lift</button>
          </div>
        ))}
        {bans.length === 0 && <div className="text-center py-12 text-white/25 text-sm">No active bans</div>}
      </div>
    </div>
  )
}

// ─── Root Admin Page ──────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'users', label: 'Users', icon: '◉' },
  { id: 'posts', label: 'Posts', icon: '▤' },
  { id: 'markets', label: 'Markets', icon: '↗' },
  { id: 'rooms', label: 'Rooms', icon: '◎' },
  { id: 'reports', label: 'Reports', icon: '⚑' },
  { id: 'bans', label: 'Bans', icon: '⊗' },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS)
  const [posts, setPosts] = useState<AdminPost[]>(MOCK_POSTS)
  const [markets, setMarkets] = useState<AdminMarket[]>(MOCK_MARKETS)
  const [rooms, setRooms] = useState<AdminRoom[]>(MOCK_ROOMS)
  const [reports, setReports] = useState<AdminReport[]>(MOCK_REPORTS)
  const [bans, setBans] = useState<AdminBan[]>(MOCK_BANS)

  const openReports = reports.filter(r => r.status === 'open').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/6"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="px-4 lg:px-8 py-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-white/30 font-mono tracking-wider">VIVA</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1rem,2.5vw,1.4rem)', letterSpacing: '-0.03em' }}>
              Super Admin <span className="text-red-400">⚡</span>
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {openReports > 0 && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                {openReports} open reports
              </span>
            )}
            <span className="text-xs text-white/25 hidden md:block">{users.length} users · {posts.length} posts</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto no-scrollbar px-4 lg:px-8 gap-1 pb-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all relative"
              style={{
                background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: tab === t.id ? 'var(--v)' : 'rgba(255,255,255,0.4)',
                border: tab === t.id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.id === 'reports' && openReports > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-xs rounded-full" style={{ background: '#f87171', color: '#fff', fontSize: '0.5rem' }}>
                  {openReports}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        {tab === 'overview' && <Overview users={users} posts={posts} markets={markets} rooms={rooms} reports={reports} />}
        {tab === 'users' && <UsersTab users={users} setUsers={setUsers} />}
        {tab === 'posts' && <PostsTab posts={posts} setPosts={setPosts} />}
        {tab === 'markets' && <MarketsTab markets={markets} setMarkets={setMarkets} />}
        {tab === 'rooms' && <RoomsTab rooms={rooms} setRooms={setRooms} />}
        {tab === 'reports' && <ReportsTab reports={reports} setReports={setReports} />}
        {tab === 'bans' && <BansTab bans={bans} setBans={setBans} users={users} />}
      </main>
    </div>
  )
}
