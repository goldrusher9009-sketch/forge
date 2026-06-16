'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { users as usersApi, dating as datingApi, messages as messagesApi, tokens as tokensApi } from '@/lib/api'
import { TIER_META } from '@/lib/store'

// ─── Mock People ────────────────────────────────────────────────────────────
const MOCK_PEOPLE = [
  { handle: 'sovereign_v',  displayName: 'Sovereign V',  vScore: 980, tier: 'guardian', bio: 'ZK identity pioneer. Sleep optimizer. Running on 6h/night.',      sleepRing: 95, activityRing: 98, wealthRing: 94, tokenSymbol: 'SOVV', tokenPrice: 12.40, mcap: 124000, holders: 420, change24h: +8.2,  compatible: 96 },
  { handle: 'luna_apex',    displayName: 'Luna Apex',    vScore: 962, tier: 'guardian', bio: 'Biohacker. Longevity researcher. Building sovereign health stack.', sleepRing: 91, activityRing: 96, wealthRing: 87, tokenSymbol: 'LUNA', tokenPrice:  9.80, mcap:  98000, holders: 310, change24h: +5.1,  compatible: 91 },
  { handle: 'zeronode',     displayName: 'ZeroNode',     vScore: 941, tier: 'guardian', bio: 'Full stack dev. Wealth ring maximalist. BTC/ETH only.',            sleepRing: 88, activityRing: 90, wealthRing: 96, tokenSymbol: 'ZERO', tokenPrice:  7.20, mcap:  72000, holders: 280, change24h: +3.4,  compatible: 87 },
  { handle: 'mayafit',      displayName: 'Maya Chen',    vScore: 935, tier: 'guardian', bio: 'Fitness creator. 2M followers. Sleep + nutrition tracked daily.',   sleepRing: 89, activityRing: 94, wealthRing: 82, tokenSymbol: 'MAYA', tokenPrice:  6.60, mcap:  66000, holders: 890, change24h: +12.3, compatible: 85 },
  { handle: 'aisham_x',    displayName: 'Aisham X',     vScore: 928, tier: 'proven',   bio: 'Nutrition researcher. Every macro tracked. HRV 72 avg.',            sleepRing: 85, activityRing: 92, wealthRing: 83, tokenSymbol: 'AISH', tokenPrice:  5.10, mcap:  51000, holders: 210, change24h: +2.1,  compatible: 83 },
  { handle: 'noa_delta',   displayName: 'Noa Delta',    vScore: 912, tier: 'proven',   bio: 'Prediction market wizard. 78% win rate YTD.',                      sleepRing: 82, activityRing: 89, wealthRing: 91, tokenSymbol: 'NOAD', tokenPrice:  4.10, mcap:  41000, holders: 175, change24h: -1.8,  compatible: 79 },
  { handle: 'biophile',    displayName: 'BioPhile',     vScore: 881, tier: 'proven',   bio: 'Sleep 9h per night. VO2 max 58. Cold plunge daily.',              sleepRing: 93, activityRing: 88, wealthRing: 72, tokenSymbol: 'BIOP', tokenPrice:  2.80, mcap:  28000, holders: 140, change24h: +0.9,  compatible: 74 },
  { handle: 'zkproof',     displayName: 'ZK Proof',     vScore: 865, tier: 'seeker',   bio: 'Privacy maximalist. ZK rollup engineer. Anon by default.',         sleepRing: 76, activityRing: 85, wealthRing: 75, tokenSymbol: 'ZKPR', tokenPrice:  2.20, mcap:  22000, holders: 98,  change24h: -3.2,  compatible: 68 },
  { handle: 'mintseeker',  displayName: 'MintSeeker',   vScore: 849, tier: 'seeker',   bio: 'NFT artist. Social ring 80. Creator economy native.',              sleepRing: 74, activityRing: 82, wealthRing: 78, tokenSymbol: 'MINT', tokenPrice:  1.90, mcap:  19000, holders: 87,  change24h: +1.5,  compatible: 65 },
  { handle: 'alexwave',    displayName: 'Alex Wave',    vScore: 832, tier: 'seeker',   bio: 'Crypto native. DeFi yield farmer. Building in public.',            sleepRing: 72, activityRing: 80, wealthRing: 82, tokenSymbol: 'ALEX', tokenPrice:  5.10, mcap:  51000, holders: 320, change24h: +4.7,  compatible: 61 },
]

// ─── Mock Tokens (standalone — not tied to a person in results) ──────────────
const MOCK_TOKENS = MOCK_PEOPLE.map(p => ({
  symbol:    p.tokenSymbol,
  creator:   p.displayName,
  handle:    p.handle,
  price:     p.tokenPrice,
  mcap:      p.mcap,
  holders:   p.holders,
  change24h: p.change24h,
  tier:      p.tier,
  vScore:    p.vScore,
})).sort((a, b) => b.mcap - a.mcap)

type PeopleFilter = 'all' | 'guardian' | 'proven' | 'seeker' | 'seed'
type TokenSort = 'mcap' | 'price' | 'change' | 'holders'
type MainTab = 'people' | 'tokens'

const TIER_FILTERS: { id: PeopleFilter; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'guardian', label: '👑 Guardian' },
  { id: 'proven',   label: '◈ Proven' },
  { id: 'seeker',   label: '◉ Seeker' },
  { id: 'seed',     label: '· Seed' },
]

function CompatBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}60, ${color})` }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
    </div>
  )
}

function fmt(n: number) {
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `$${(n/1000).toFixed(0)}K`
  return `$${n.toFixed(2)}`
}

// ─── People Card ─────────────────────────────────────────────────────────────
function PersonCard({ person, onConnect, onMessage, connected, connecting, messaging, router }: any) {
  const tier = TIER_META[person.tier as keyof typeof TIER_META] ?? TIER_META.seed
  const isConn = connected[person.handle]
  const isConnecting = connecting[person.handle]
  const isMsg = messaging[person.handle]

  return (
    <div className="p-4 rounded-2xl border border-white/6 hover:border-white/12 transition-all"
      style={{ background: 'rgba(255,255,255,0.018)' }}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <button onClick={() => router.push(`/profile/${person.handle}`)}
          className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center font-black text-lg flex-shrink-0 hover:opacity-80 transition-opacity"
          style={{ background: `${tier.color}18`, color: tier.color, border: `1.5px solid ${tier.color}30` }}>
          {(person as any).avatarUrl
            ? <img src={(person as any).avatarUrl} className="w-full h-full object-cover" alt="" />
            : person.displayName[0]
          }
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <button onClick={() => router.push(`/profile/${person.handle}`)}
              className="font-bold text-white text-sm hover:text-white/80 transition-colors truncate">
              {person.displayName}
            </button>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
              style={{ background: `${tier.color}15`, color: tier.color }}>
              {person.vScore}
            </span>
          </div>
          <p className="text-xs text-white/40 mb-2 line-clamp-2">{person.bio}</p>

          {/* Rings */}
          <div className="flex gap-3 mb-3">
            {[
              { label: 'Sleep',    val: person.sleepRing,    color: '#818cf8' },
              { label: 'Activity', val: person.activityRing, color: '#22c55e' },
              { label: 'Wealth',   val: person.wealthRing,   color: '#f59e0b' },
            ].map(r => (
              <div key={r.label} className="text-center">
                <div className="text-xs font-bold" style={{ color: r.color }}>{r.val}%</div>
                <div className="text-xs text-white/25">{r.label}</div>
              </div>
            ))}
            <div className="text-center ml-auto">
              <div className="text-xs font-bold text-white/60">{person.tokenSymbol}</div>
              <div className="text-xs text-white/25">${person.tokenPrice.toFixed(2)}</div>
            </div>
          </div>

          {/* Compat bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-white/25 mb-1">
              <span>V-Score compatibility</span>
            </div>
            <CompatBar pct={person.compatible} color={tier.color} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => onConnect(person)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: isConn ? `${tier.color}18` : `${tier.color}22`,
                color: isConn ? tier.color : 'white',
                border: `1px solid ${tier.color}30`,
              }}>
              {isConnecting ? '…' : isConn ? '✓ Connected' : '+ Connect'}
            </button>
            <button onClick={() => onMessage(person)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {isMsg ? '…' : '✉ Message'}
            </button>
            <button onClick={() => router.push(`/tokens?buy=${person.tokenSymbol}`)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
              ↗ Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Token Card ───────────────────────────────────────────────────────────────
function TokenCard({ token, router }: { token: typeof MOCK_TOKENS[0]; router: any }) {
  const tier = TIER_META[token.tier as keyof typeof TIER_META] ?? TIER_META.seed
  const up = token.change24h >= 0
  return (
    <div className="p-4 rounded-2xl border border-white/6 hover:border-white/12 transition-all"
      style={{ background: 'rgba(255,255,255,0.018)' }}>
      <div className="flex items-center gap-3">
        {/* Symbol badge */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{ background: `${tier.color}18`, color: tier.color, border: `1.5px solid ${tier.color}30` }}>
          {token.symbol.slice(0, 2)}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-white text-sm">${token.symbol}</span>
            <span className="text-xs text-white/30">by</span>
            <button onClick={() => router.push(`/profile/${token.handle}`)}
              className="text-xs hover:text-white/80 transition-colors truncate"
              style={{ color: tier.color }}>
              {token.creator}
            </button>
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
              style={{ background: `${tier.color}15`, color: tier.color }}>
              {token.vScore}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-2">
            <div>
              <div className="text-xs text-white/30">Price</div>
              <div className="text-sm font-bold text-white">${token.price.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-white/30">MCap</div>
              <div className="text-sm font-semibold text-white">{fmt(token.mcap)}</div>
            </div>
            <div>
              <div className="text-xs text-white/30">Holders</div>
              <div className="text-sm font-semibold text-white">{token.holders}</div>
            </div>
            <div>
              <div className="text-xs text-white/30">24h</div>
              <div className={`text-sm font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
                {up ? '+' : ''}{token.change24h.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Buy CTA */}
        <button onClick={() => router.push(`/tokens?buy=${token.symbol}`)}
          className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
          Buy ↗
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const router = useRouter()
  const [mainTab, setMainTab]   = useState<MainTab>('people')
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<PeopleFilter>('all')
  const [tokenSort, setTokenSort] = useState<TokenSort>('mcap')
  const [people, setPeople]     = useState(MOCK_PEOPLE)
  const [tokens, setTokens]     = useState(MOCK_TOKENS)
  const [connecting, setConnecting] = useState<Record<string, boolean>>({})
  const [connected,  setConnected]  = useState<Record<string, boolean>>({})
  const [messaging,  setMessaging]  = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  // Load real people
  useEffect(() => {
    usersApi.search().then((us: any[]) => {
      if (us.length > 0) {
        const merged = us.map((u: any, i: number) => ({
          ...MOCK_PEOPLE[i % MOCK_PEOPLE.length],
          ...u,
          vScore: u.vScore ?? u.vscore ?? 800,
          compatible: Math.floor(70 + Math.random() * 28),
        }))
        setPeople([...merged, ...MOCK_PEOPLE.slice(merged.length)])
      }
    }).catch(() => {})
  }, [])

  // Load real tokens
  useEffect(() => {
    tokensApi.list().then((ts: any[]) => {
      if (ts.length > 0) {
        const merged = ts.map((t: any, i: number) => ({
          ...MOCK_TOKENS[i % MOCK_TOKENS.length],
          symbol:    t.symbol ?? MOCK_TOKENS[i % MOCK_TOKENS.length].symbol,
          price:     t.price  ?? MOCK_TOKENS[i % MOCK_TOKENS.length].price,
          mcap:      t.mcap   ?? MOCK_TOKENS[i % MOCK_TOKENS.length].mcap,
          holders:   t.holders ?? MOCK_TOKENS[i % MOCK_TOKENS.length].holders,
          change24h: t.change24h ?? MOCK_TOKENS[i % MOCK_TOKENS.length].change24h,
        }))
        setTokens(merged)
      }
    }).catch(() => {})
  }, [])

  // Search people on query change
  useEffect(() => {
    if (search && mainTab === 'people') {
      usersApi.search(search).then((us: any[]) => {
        if (us.length > 0) {
          setPeople(us.map((u: any, i: number) => ({
            ...MOCK_PEOPLE[i % MOCK_PEOPLE.length],
            ...u,
            vScore: u.vScore ?? u.vscore ?? 800,
            compatible: Math.floor(70 + Math.random() * 28),
          })))
        }
      }).catch(() => {})
    } else if (!search) {
      setPeople(MOCK_PEOPLE)
    }
  }, [search, mainTab])

  async function connect(person: any) {
    setConnecting(p => ({ ...p, [person.handle]: true }))
    try { await datingApi.connect(person.id ?? person.handle) } catch {}
    setConnected(p => ({ ...p, [person.handle]: true }))
    setConnecting(p => ({ ...p, [person.handle]: false }))
  }

  async function message(person: any) {
    setMessaging(p => ({ ...p, [person.handle]: true }))
    try {
      const thread = await messagesApi.createThread(person.id ?? person.handle)
      router.push(`/messages?thread=${thread.id}`)
    } catch { router.push('/messages') }
    setMessaging(p => ({ ...p, [person.handle]: false }))
  }

  const filteredPeople = people.filter(p => {
    const matchFilter = filter === 'all' || p.tier === filter
    const matchSearch = !search || p.displayName.toLowerCase().includes(search.toLowerCase()) || p.handle.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const filteredTokens = tokens
    .filter(t => !search || t.symbol.toLowerCase().includes(search.toLowerCase()) || t.creator.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (tokenSort === 'mcap')    return b.mcap - a.mcap
      if (tokenSort === 'price')   return b.price - a.price
      if (tokenSort === 'change')  return b.change24h - a.change24h
      if (tokenSort === 'holders') return b.holders - a.holders
      return 0
    })

  // Economy summary for tokens tab
  const totalMcap    = tokens.reduce((s, t) => s + t.mcap, 0)
  const topGainer    = [...tokens].sort((a, b) => b.change24h - a.change24h)[0]
  const totalHolders = tokens.reduce((s, t) => s + t.holders, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-2 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        {/* Search row */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M15 15l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder={mainTab === 'people' ? 'Search people…' : 'Search tokens…'}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-white/25 placeholder-white/25"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">✕</button>
            )}
          </div>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([['people', '◈ People'], ['tokens', '⬡ Tokens']] as [MainTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setMainTab(id)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: mainTab === id ? 'rgba(124,58,237,0.25)' : 'transparent',
                color: mainTab === id ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                border: mainTab === id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Sub-filters */}
        {mainTab === 'people' ? (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {TIER_FILTERS.map(f => {
              const tier = f.id !== 'all' ? TIER_META[f.id as keyof typeof TIER_META] : null
              return (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: filter === f.id ? `${tier?.color ?? 'rgba(255,255,255,0.15)'}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${filter === f.id ? `${tier?.color ?? 'rgba(255,255,255,0.3)'}40` : 'rgba(255,255,255,0.06)'}`,
                    color: filter === f.id ? (tier?.color ?? 'white') : 'rgba(255,255,255,0.4)',
                  }}>
                  {f.label}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {([['mcap', 'MCap ↓'], ['price', 'Price ↓'], ['change', '24h ↓'], ['holders', 'Holders ↓']] as [TokenSort, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTokenSort(id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: tokenSort === id ? '#f59e0b18' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${tokenSort === id ? '#f59e0b40' : 'rgba(255,255,255,0.06)'}`,
                  color: tokenSort === id ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <div className="px-4 py-4 max-w-2xl mx-auto">

        {/* ── People Tab ── */}
        {mainTab === 'people' && (
          <>
            <p className="text-xs text-white/25 mb-4">{filteredPeople.length} people · ranked by V-Score compatibility</p>
            <div className="space-y-3">
              {filteredPeople.map(person => (
                <PersonCard key={person.handle} person={person}
                  onConnect={connect} onMessage={message}
                  connected={connected} connecting={connecting} messaging={messaging}
                  router={router}
                />
              ))}
              {filteredPeople.length === 0 && (
                <div className="text-center py-12 text-white/25">
                  <div className="text-4xl mb-3">◈</div>
                  <div className="text-sm">No people match your search</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Tokens Tab ── */}
        {mainTab === 'tokens' && (
          <>
            {/* Economy stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Total MCap',  val: fmt(totalMcap),              color: '#f59e0b' },
                { label: 'Top Gainer',  val: `+${topGainer?.change24h.toFixed(1)}%`, color: '#22c55e' },
                { label: 'Total Holders', val: totalHolders.toLocaleString(), color: '#a855f7' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl border border-white/6 text-center"
                  style={{ background: `${s.color}08` }}>
                  <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-white/25 mb-3">{filteredTokens.length} tokens · sorted by {tokenSort}</p>
            <div className="space-y-3">
              {filteredTokens.map(token => (
                <TokenCard key={token.symbol} token={token} router={router} />
              ))}
              {filteredTokens.length === 0 && (
                <div className="text-center py-12 text-white/25">
                  <div className="text-4xl mb-3">⬡</div>
                  <div className="text-sm">No tokens match your search</div>
                </div>
              )}
            </div>

            {/* Bottom CTA */}
            <div className="mt-6 p-4 rounded-2xl border border-white/6 text-center"
              style={{ background: 'rgba(245,158,11,0.06)' }}>
              <div className="text-white/60 text-sm mb-3">Want to trade tokens?</div>
              <button onClick={() => router.push('/tokens')}
                className="px-6 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#f59e0b', color: '#04040A' }}>
                Open Token Market ↗
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
