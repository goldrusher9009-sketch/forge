'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const PEOPLE = [
  { handle: 'sovereign_v', name: 'Sovereign V', bio: 'Token economy builder. 1.2k holders.', color: '#a855f7', verified: true, followers: 148000, tokenPrice: 12.40, symbol: 'SOVV' },
  { handle: 'mayafit',     name: 'Maya Chen',   bio: 'Biohacker & health creator.',          color: '#22c55e', verified: true, followers: 92000,  tokenPrice: 6.60,  symbol: 'MAYA' },
  { handle: 'luna_apex',   name: 'Luna Apex',   bio: 'Creator & lifestyle investor.',         color: '#f59e0b', verified: false, followers: 64000, tokenPrice: 9.10,  symbol: 'APEX' },
  { handle: 'zeronode',    name: 'ZeroNode',    bio: 'ZK privacy & Web3 researcher.',         color: '#818cf8', verified: true, followers: 38000,  tokenPrice: 3.20,  symbol: 'ZERO' },
  { handle: 'alexwave',    name: 'Alex Wave',   bio: 'Music producer & NFT artist.',          color: '#ec4899', verified: false, followers: 29000, tokenPrice: 2.10,  symbol: 'WAVE' },
]

const TOKENS = [
  { symbol: 'SOVV', name: 'Sovereign V',  color: '#a855f7', price: 12.40, change24h: +8.2,  holders: 1284, marketCap: 248000 },
  { symbol: 'MAYA', name: 'Maya Chen',    color: '#22c55e', price: 6.60,  change24h: +12.3, holders: 820,  marketCap: 132000 },
  { symbol: 'APEX', name: 'Luna Apex',    color: '#f59e0b', price: 9.10,  change24h: -2.1,  holders: 512,  marketCap: 91000  },
  { symbol: 'ZERO', name: 'ZeroNode',     color: '#818cf8', price: 3.20,  change24h: +5.5,  holders: 398,  marketCap: 64000  },
  { symbol: 'WAVE', name: 'Alex Wave',    color: '#ec4899', price: 2.10,  change24h: +1.8,  holders: 214,  marketCap: 42000  },
]

const POSTS = [
  { id: 'p1', handle: 'sovereign_v', name: 'Sovereign V', color: '#a855f7', content: 'Thread on how I built a 6-figure token economy from scratch using nothing but audience trust and a clear value proposition 🧵', likes: 1842, ts: '3h ago' },
  { id: 'p2', handle: 'mayafit', name: 'Maya Chen', color: '#22c55e', content: 'Day 7 of the biohack protocol. Fasting HRV up 18%. Sleep score 94. Token holders getting the full data dump tonight.', likes: 923, ts: '5h ago' },
  { id: 'p3', handle: 'zeronode', name: 'ZeroNode', color: '#818cf8', content: 'New ZK proof technique reduces verification time by 40x without sacrificing security. Thread incoming.', likes: 612, ts: '8h ago' },
]

const ROOMS = [
  { id: 'r1', title: 'Token Economy 101 — Live Q&A', host: 'sovereign_v', color: '#a855f7', listeners: 284, live: true  },
  { id: 'r2', title: 'Health Biohacking Deep Dive',  host: 'mayafit',     color: '#22c55e', listeners: 142, live: true  },
  { id: 'r3', title: 'Web3 Privacy Future',          host: 'zeronode',    color: '#818cf8', listeners: 98,  live: false },
]

function SearchInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [tab, setTab] = useState<'people' | 'tokens' | 'posts' | 'rooms'>('people')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function filter<T extends { name?: string; handle?: string; symbol?: string; title?: string; content?: string }>(arr: T[]) {
    if (!query.trim()) return arr
    const q = query.toLowerCase()
    return arr.filter(item =>
      (item.name?.toLowerCase().includes(q) ?? false) ||
      (item.handle?.toLowerCase().includes(q) ?? false) ||
      (item.symbol?.toLowerCase().includes(q) ?? false) ||
      (item.title?.toLowerCase().includes(q) ?? false) ||
      (item.content?.toLowerCase().includes(q) ?? false)
    )
  }

  const filteredPeople = filter(PEOPLE)
  const filteredTokens = filter(TOKENS)
  const filteredPosts  = filter(POSTS)
  const filteredRooms  = filter(ROOMS)

  const TABS = [
    { id: 'people', label: 'People',  count: filteredPeople.length },
    { id: 'tokens', label: 'Tokens',  count: filteredTokens.length },
    { id: 'posts',  label: 'Posts',   count: filteredPosts.length  },
    { id: 'rooms',  label: 'Rooms',   count: filteredRooms.length  },
  ] as const

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 text-white/30">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search people, tokens, posts…"
              className="flex-1 text-sm bg-transparent text-white placeholder-white/30 outline-none" />
            {query && (
              <button onClick={() => setQuery('')} className="text-white/30 hover:text-white/60 transition-colors text-xs">✕</button>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={tab === t.id
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
        {tab === 'people' && (
          filteredPeople.length === 0
            ? <div className="text-center text-white/25 text-sm py-12">No people found</div>
            : filteredPeople.map(p => (
              <button key={p.handle} onClick={() => router.push(`/profile/${p.handle}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/6 hover:border-white/12 transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${p.color}18`, color: p.color }}>{p.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white/85">{p.name}</span>
                    {p.verified && <span style={{ color: p.color }} className="text-xs">✓</span>}
                  </div>
                  <div className="text-xs text-white/30">@{p.handle} · {(p.followers/1000).toFixed(0)}k followers</div>
                  <div className="text-xs text-white/40 truncate">{p.bio}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-black" style={{ color: p.color }}>${p.tokenPrice}</div>
                  <div className="text-xs text-white/25">${p.symbol}</div>
                </div>
              </button>
            ))
        )}

        {tab === 'tokens' && (
          filteredTokens.length === 0
            ? <div className="text-center text-white/25 text-sm py-12">No tokens found</div>
            : filteredTokens.map(t => (
              <button key={t.symbol} onClick={() => router.push(`/tokens/${t.symbol}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/6 hover:border-white/12 transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${t.color}18`, color: t.color }}>{t.symbol[0]}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-white/85">${t.symbol}</div>
                  <div className="text-xs text-white/30">{t.name} · {t.holders.toLocaleString()} holders</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-white">${t.price}</div>
                  <div className={`text-xs font-bold ${t.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.change24h >= 0 ? '+' : ''}{t.change24h}%
                  </div>
                </div>
              </button>
            ))
        )}

        {tab === 'posts' && (
          filteredPosts.length === 0
            ? <div className="text-center text-white/25 text-sm py-12">No posts found</div>
            : filteredPosts.map(p => (
              <button key={p.id} onClick={() => router.push(`/feed/${p.id}`)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-white/6 hover:border-white/12 transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: `${p.color}18`, color: p.color }}>{p.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/40 mb-1">{p.name} · {p.ts}</div>
                  <div className="text-sm text-white/65 leading-relaxed line-clamp-2">{p.content}</div>
                  <div className="text-xs text-white/25 mt-1">❤️ {p.likes.toLocaleString()}</div>
                </div>
              </button>
            ))
        )}

        {tab === 'rooms' && (
          filteredRooms.length === 0
            ? <div className="text-center text-white/25 text-sm py-12">No rooms found</div>
            : filteredRooms.map(r => (
              <button key={r.id} onClick={() => router.push(`/rooms/${r.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/6 hover:border-white/12 transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${r.color}18` }}>🎙</div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {r.live && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />}
                    <span className="text-xs font-semibold" style={{ color: r.live ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>{r.live ? 'LIVE' : 'Scheduled'}</span>
                  </div>
                  <div className="text-sm font-bold text-white/80">{r.title}</div>
                  <div className="text-xs text-white/30">@{r.host} · {r.listeners} listening</div>
                </div>
              </button>
            ))
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--ink)' }} />}>
      <SearchInner />
    </Suspense>
  )
}
