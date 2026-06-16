'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type ResultType = 'all' | 'creators' | 'posts' | 'tokens' | 'collections' | 'rooms'

interface Creator { type: 'creator'; handle: string; name: string; color: string; verified: boolean; vscore: number; followers: number; tokenSymbol: string; tokenPrice: number }
interface Post    { type: 'post';    id: string; title: string; author: string; authorColor: string; preview: string; likes: number; ts: string; tokenGated: boolean }
interface Token   { type: 'token';   symbol: string; creatorName: string; color: string; price: number; change24h: number; holders: number }
interface Coll    { type: 'collection'; id: string; title: string; icon: string; color: string; items: number; followers: number }
interface Room    { type: 'room';    id: string; title: string; color: string; live: boolean; listeners: number; host: string }

type Result = Creator | Post | Token | Coll | Room

const ALL_RESULTS: Result[] = [
  { type: 'creator', handle: 'sovereign_v', name: 'Sovereign V',  color: '#a855f7', verified: true,  vscore: 9840, followers: 48200, tokenSymbol: 'SVRN', tokenPrice: 8.75 },
  { type: 'creator', handle: 'mayafit',     name: 'Maya Chen',    color: '#22c55e', verified: true,  vscore: 8720, followers: 62100, tokenSymbol: 'MAYA', tokenPrice: 5.20 },
  { type: 'creator', handle: 'jaxbeats',    name: 'Jax Beats',   color: '#ec4899', verified: true,  vscore: 7410, followers: 34800, tokenSymbol: 'JAX',  tokenPrice: 3.80 },
  { type: 'post', id: 'p1', title: 'BTC accumulation zone — why I\'m adding here', author: 'sovereign_v', authorColor: '#a855f7', preview: 'The weekly RSI divergence is signaling a major move...', likes: 824, ts: '2h', tokenGated: false },
  { type: 'post', id: 'p2', title: 'My 30-day transformation: full breakdown',     author: 'mayafit',     authorColor: '#22c55e', preview: 'After 30 days of consistent training and...', likes: 412, ts: '5h', tokenGated: true  },
  { type: 'post', id: 'p3', title: 'New beat pack dropping Friday',                author: 'jaxbeats',    authorColor: '#ec4899', preview: 'The new collection features 12 exclusive...', likes: 298, ts: '1d', tokenGated: false },
  { type: 'token', symbol: 'SVRN', creatorName: 'Sovereign V', color: '#a855f7', price: 8.75,  change24h: 4.2,  holders: 2840 },
  { type: 'token', symbol: 'MAYA', creatorName: 'Maya Chen',   color: '#22c55e', price: 5.20,  change24h: -1.8, holders: 1620 },
  { type: 'token', symbol: 'JAX',  creatorName: 'Jax Beats',  color: '#ec4899', price: 3.80,  change24h: 7.1,  holders: 980  },
  { type: 'collection', id: 'col1', title: 'DeFi Deep Dives',   icon: '📊', color: '#a855f7', items: 28, followers: 1842 },
  { type: 'collection', id: 'col5', title: 'Workout Library',   icon: '💪', color: '#22c55e', items: 34, followers: 4200 },
  { type: 'room', id: 'r1', title: 'DeFi Alpha Room', color: '#a855f7', live: true,  listeners: 284, host: 'sovereign_v' },
  { type: 'room', id: 'r2', title: 'Beats & Vibes',   color: '#ec4899', live: false, listeners: 0,   host: 'jaxbeats'   },
]

const TABS: { key: ResultType; label: string; icon: string }[] = [
  { key: 'all',         label: 'All',         icon: '🔍' },
  { key: 'creators',    label: 'Creators',    icon: '👤' },
  { key: 'posts',       label: 'Posts',       icon: '📝' },
  { key: 'tokens',      label: 'Tokens',      icon: '💎' },
  { key: 'collections', label: 'Collections', icon: '📁' },
  { key: 'rooms',       label: 'Rooms',       icon: '🎙' },
]

function ResultCard({ r }: { r: Result }) {
  const router = useRouter()
  if (r.type === 'creator') return (
    <button onClick={() => router.push(`/profile/${r.handle}`)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
      style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
        style={{ background: `${r.color}15`, color: r.color }}>
        {r.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-white/85">{r.name}</span>
          {r.verified && <span className="text-xs" style={{ color: r.color }}>✓</span>}
        </div>
        <div className="text-xs text-white/30">@{r.handle} · {(r.followers/1000).toFixed(0)}k followers</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-black text-xs" style={{ color: r.color }}>${r.tokenSymbol}</div>
        <div className="text-xs text-white/35">${r.tokenPrice}</div>
      </div>
    </button>
  )
  if (r.type === 'post') return (
    <button onClick={() => router.push(`/feed/${r.id}`)}
      className="w-full p-3 rounded-2xl border border-white/4 text-left"
      style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]"
          style={{ background: `${r.authorColor}18`, color: r.authorColor }}>
          {r.author[0].toUpperCase()}
        </div>
        <span className="text-xs text-white/30">@{r.author}</span>
        <span className="text-xs text-white/20">· {r.ts}</span>
        {r.tokenGated && <span className="ml-auto text-xs text-white/25">🔒</span>}
      </div>
      <div className="font-bold text-sm text-white/80 mb-0.5">{r.title}</div>
      <div className="text-xs text-white/35 truncate">{r.preview}</div>
    </button>
  )
  if (r.type === 'token') return (
    <button onClick={() => router.push(`/tokens/${r.symbol}/chart`)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
      style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
        style={{ background: `${r.color}15`, color: r.color }}>
        {r.symbol[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-white/85">${r.symbol}</div>
        <div className="text-xs text-white/30">{r.creatorName} · {r.holders.toLocaleString()} holders</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-black text-sm text-white/75">${r.price}</div>
        <div className="text-xs font-bold" style={{ color: r.change24h >= 0 ? '#22c55e' : '#f87171' }}>
          {r.change24h >= 0 ? '+' : ''}{r.change24h}%
        </div>
      </div>
    </button>
  )
  if (r.type === 'collection') return (
    <button onClick={() => router.push(`/collections/${r.id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
      style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${r.color}12`, border: `1px solid ${r.color}20` }}>
        {r.icon}
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm text-white/85">{r.title}</div>
        <div className="text-xs text-white/30">{r.items} items · {r.followers.toLocaleString()} followers</div>
      </div>
    </button>
  )
  if (r.type === 'room') return (
    <button onClick={() => router.push(`/rooms/${r.id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
      style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${r.color}12`, border: `1px solid ${r.color}20` }}>
        🎙
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white/85">{r.title}</span>
          {r.live && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>LIVE</span>}
        </div>
        <div className="text-xs text-white/30">
          @{r.host}{r.live ? ` · ${r.listeners} listening` : ' · Offline'}
        </div>
      </div>
    </button>
  )
  return null
}

function SearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(q)
  const [tab, setTab] = useState<ResultType>('all')

  const filtered = ALL_RESULTS.filter(r => {
    const str = JSON.stringify(r).toLowerCase()
    const matchQ = !query || str.includes(query.toLowerCase())
    const matchTab = tab === 'all' || r.type + 's' === tab || r.type === tab
    return matchQ && matchTab
  })

  const counts: Record<ResultType, number> = {
    all: ALL_RESULTS.length,
    creators: ALL_RESULTS.filter(r => r.type === 'creator').length,
    posts: ALL_RESULTS.filter(r => r.type === 'post').length,
    tokens: ALL_RESULTS.filter(r => r.type === 'token').length,
    collections: ALL_RESULTS.filter(r => r.type === 'collection').length,
    rooms: ALL_RESULTS.filter(r => r.type === 'room').length,
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/6">
            <span className="text-white/30">🔍</span>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search VIVA…"
              className="flex-1 text-sm text-white placeholder-white/20 bg-transparent outline-none" />
            {query && <button onClick={() => setQuery('')} className="text-white/20 text-xs">✕</button>}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 flex items-center gap-1"
              style={tab === t.key ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t.label}
              <span className="opacity-60">{counts[t.key]}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-black text-white/40">No results</div>
            <div className="text-sm text-white/20 mt-1">Try different keywords</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-white/20 mb-3">{filtered.length} results{query ? ` for "${query}"` : ''}</div>
            {filtered.map((r, i) => <ResultCard key={i} r={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchResultsPage() {
  return <Suspense><SearchResults /></Suspense>
}
