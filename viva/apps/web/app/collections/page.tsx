'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MY_COLLECTIONS = [
  {
    id: 'col1', name: 'Alpha Stack', emoji: '⚡', desc: 'High-conviction picks I\'m holding long-term',
    tokens: [
      { symbol: 'SOVV', handle: 'sovereign_v', color: '#a855f7', price: 12.40, change: +8.2 },
      { symbol: 'ZERO', handle: 'zeronode', color: '#818cf8', price: 3.20, change: +5.5 },
      { symbol: 'APEX', handle: 'luna_apex', color: '#f59e0b', price: 9.10, change: -2.1 },
    ],
    totalValue: 2500, followers: 48,
  },
  {
    id: 'col2', name: 'Health Tech', emoji: '🧬', desc: 'Creators building the future of biometrics + wellness',
    tokens: [
      { symbol: 'MAYA', handle: 'mayafit', color: '#22c55e', price: 6.60, change: +12.3 },
    ],
    totalValue: 660, followers: 22,
  },
]

const PUBLIC_COLLECTIONS = [
  {
    id: 'pub1', curator: 'sovereign_v', curatorName: 'Sovereign V', name: 'Guardian Tier Bundle', emoji: '👑',
    desc: 'Top Guardian-tier creators across all categories — curated alpha for serious investors.',
    tokens: [
      { symbol: 'SOVV', handle: 'sovereign_v', color: '#a855f7', price: 12.40, change: +8.2 },
      { symbol: 'MAYA', handle: 'mayafit', color: '#22c55e', price: 6.60, change: +12.3 },
      { symbol: 'ZERO', handle: 'zeronode', color: '#818cf8', price: 3.20, change: +5.5 },
    ],
    totalValue: 14200, followers: 312, color: '#a855f7',
  },
  {
    id: 'pub2', curator: 'luna_apex', curatorName: 'Luna Apex', name: 'ZK / Privacy Stack', emoji: '🔐',
    desc: 'Creators building private, verifiable identity on VIVA. The thesis: ZK is the future of trust.',
    tokens: [
      { symbol: 'ZERO', handle: 'zeronode', color: '#818cf8', price: 3.20, change: +5.5 },
      { symbol: 'APEX', handle: 'luna_apex', color: '#f59e0b', price: 9.10, change: -2.1 },
    ],
    totalValue: 8800, followers: 189, color: '#818cf8',
  },
  {
    id: 'pub3', curator: 'alexwave', curatorName: 'Alex Wave', name: 'Rising Stars Q3', emoji: '🌟',
    desc: 'Under-the-radar creators with strong fundamentals and explosive growth potential.',
    tokens: [
      { symbol: 'MAYA', handle: 'mayafit', color: '#22c55e', price: 6.60, change: +12.3 },
    ],
    totalValue: 5100, followers: 97, color: '#22c55e',
  },
]

export default function CollectionsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'mine' | 'discover'>('mine')
  const [creating, setCreating] = useState(false)
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">CURATED PORTFOLIOS</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Collections</h1>
          </div>
          <button onClick={() => setCreating(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: '#a855f718', color: '#a855f7', border: '1px solid #a855f725' }}>
            + Create
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([{ id: 'mine', label: '◎ My Collections' }, { id: 'discover', label: '⊕ Discover' }] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'mine' && (
          <div className="space-y-3">
            {MY_COLLECTIONS.map(col => (
              <div key={col.id} className="p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>{col.emoji}</div>
                    <div>
                      <div className="font-bold text-white">{col.name}</div>
                      <div className="text-xs text-white/30">{col.tokens.length} tokens · {col.followers} followers</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white">${col.totalValue.toLocaleString()}</div>
                    <div className="text-xs text-white/30">value</div>
                  </div>
                </div>
                <p className="text-xs text-white/40 mb-3">{col.desc}</p>
                <div className="flex gap-2 mb-3">
                  {col.tokens.map(t => (
                    <button key={t.symbol} onClick={() => router.push(`/profile/${t.handle}`)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: `${t.color}14`, color: t.color }}>
                      ${t.symbol}
                      <span className={t.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {t.change >= 0 ? '+' : ''}{t.change}%
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                    Edit
                  </button>
                  <button className="flex-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                    Share
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => setCreating(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed text-sm font-semibold text-white/25 hover:text-white/40 hover:border-white/15 transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              + Create New Collection
            </button>
          </div>
        )}

        {tab === 'discover' && (
          <div className="space-y-3">
            {PUBLIC_COLLECTIONS.map(col => {
              const isFollowing = followed.has(col.id)
              return (
                <div key={col.id} className="p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${col.color}14` }}>{col.emoji}</div>
                      <div>
                        <div className="font-bold text-white">{col.name}</div>
                        <button onClick={() => router.push(`/profile/${col.curator}`)}
                          className="text-xs font-semibold transition-colors" style={{ color: col.color }}>
                          by {col.curatorName}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white">${(col.totalValue/1000).toFixed(1)}k</div>
                      <div className="text-xs text-white/30">{col.followers} followers</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mb-3">{col.desc}</p>
                  <div className="flex gap-2 mb-3">
                    {col.tokens.map(t => (
                      <button key={t.symbol} onClick={() => router.push(`/profile/${t.handle}`)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: `${t.color}14`, color: t.color }}>
                        ${t.symbol}
                        <span className={t.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {t.change >= 0 ? '+' : ''}{t.change}%
                        </span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setFollowed(prev => { const n = new Set(prev); isFollowing ? n.delete(col.id) : n.add(col.id); return n })}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
                    style={isFollowing
                      ? { background: `${col.color}14`, color: col.color, border: `1px solid ${col.color}30` }
                      : { background: col.color, color: '#04040A' }}>
                    {isFollowing ? '✓ Following' : 'Follow Collection'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setCreating(false)}>
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4"
            style={{ background: '#0d0d1a' }} onClick={e => e.stopPropagation()}>
            <div className="font-bold text-white text-lg">New Collection</div>
            <input placeholder="Collection name…" className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/25 outline-none" />
            <input placeholder="Description…" className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/25 outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setCreating(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#a855f7', color: '#04040A' }}>
                Create
              </button>
              <button onClick={() => setCreating(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
