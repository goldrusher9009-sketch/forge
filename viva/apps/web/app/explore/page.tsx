'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { users as usersApi, dating as datingApi, messages as messagesApi } from '@/lib/api'
import { TIER_META } from '@/lib/store'

const MOCK_PEOPLE = [
  { handle: 'sovereign_v',  displayName: 'Sovereign V',  vScore: 980, tier: 'guardian', bio: 'ZK identity pioneer. Sleep optimizer. Running on 6h/night.',      sleepRing: 95, activityRing: 98, wealthRing: 94, tokenSymbol: 'SOVV', tokenPrice: 0.0089, change7d: +24.1, compatible: 96 },
  { handle: 'luna_apex',    displayName: 'Luna Apex',    vScore: 962, tier: 'guardian', bio: 'Biohacker. Longevity researcher. Building sovereign health stack.', sleepRing: 91, activityRing: 96, wealthRing: 87, tokenSymbol: 'LUNA', tokenPrice: 0.0072, change7d: +18.3, compatible: 91 },
  { handle: 'zeronode',     displayName: 'ZeroNode',     vScore: 941, tier: 'guardian', bio: 'Full stack dev. Wealth ring maximalist. BTC/ETH only.',            sleepRing: 88, activityRing: 90, wealthRing: 96, tokenSymbol: 'ZERO', tokenPrice: 0.0061, change7d: +12.7, compatible: 87 },
  { handle: 'aisham_x',     displayName: 'Aisham X',     vScore: 928, tier: 'proven',   bio: 'Nutrition researcher. Every macro tracked. HRV 72 avg.',            sleepRing: 85, activityRing: 92, wealthRing: 83, tokenSymbol: 'AISH', tokenPrice: 0.0048, change7d: +9.2,  compatible: 83 },
  { handle: 'noa_delta',    displayName: 'Noa Delta',    vScore: 912, tier: 'proven',   bio: 'Prediction market wizard. 78% win rate YTD.',                      sleepRing: 82, activityRing: 89, wealthRing: 91, tokenSymbol: 'NOAD', tokenPrice: 0.0041, change7d: +7.8,  compatible: 79 },
  { handle: 'biophile',     displayName: 'BioPhile',     vScore: 881, tier: 'proven',   bio: 'Sleep 9h per night. VO2 max 58. Cold plunge daily.',              sleepRing: 93, activityRing: 88, wealthRing: 72, tokenSymbol: 'BIOP', tokenPrice: 0.0028, change7d: +3.1,  compatible: 74 },
  { handle: 'zkproof',      displayName: 'ZK Proof',     vScore: 865, tier: 'seeker',   bio: 'Privacy maximalist. ZK rollup engineer. Anon by default.',         sleepRing: 76, activityRing: 85, wealthRing: 75, tokenSymbol: 'ZKPR', tokenPrice: 0.0022, change7d: -1.2,  compatible: 68 },
  { handle: 'mintseeker',   displayName: 'MintSeeker',   vScore: 849, tier: 'seeker',   bio: 'NFT artist. Social ring 80. Creator economy native.',              sleepRing: 74, activityRing: 82, wealthRing: 78, tokenSymbol: 'MINT', tokenPrice: 0.0019, change7d: +2.0,  compatible: 65 },
]

type Filter = 'all' | 'guardian' | 'proven' | 'seeker' | 'seed'

const FILTERS: { id: Filter; label: string }[] = [
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

export default function ExplorePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [people, setPeople] = useState(MOCK_PEOPLE)
  const [connecting, setConnecting] = useState<Record<string, boolean>>({})
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const [messaging, setMessaging] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (search) {
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
    } else {
      setPeople(MOCK_PEOPLE)
    }
  }, [search])

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

  const filtered = people.filter(p => {
    const matchFilter = filter === 'all' || p.tier === filter
    const matchSearch = !search || p.displayName.toLowerCase().includes(search.toLowerCase()) || p.handle.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-2 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M15 15l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search people by name or handle…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-white/25 placeholder-white/25"
            />
          </div>
        </div>
        {/* Tier filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {FILTERS.map(f => {
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
      </header>

      {/* Results */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        <p className="text-xs text-white/25 mb-4">{filtered.length} people · ranked by V-Score compatibility</p>

        <div className="space-y-3">
          {filtered.map(person => {
            const tier = TIER_META[person.tier as keyof typeof TIER_META] ?? TIER_META.seed
            const isConn = connected[person.handle]
            const isConnecting = connecting[person.handle]
            const isMsg = messaging[person.handle]

            return (
              <div key={person.handle}
                className="p-4 rounded-2xl border border-white/6 hover:border-white/12 transition-all"
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
                    <div className="flex items-center gap-2">
                      <button onClick={() => router.push(`/profile/${person.handle}`)}
                        className="font-bold text-white/90 hover:text-white transition-colors text-sm">
                        {person.displayName}
                      </button>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: `${tier.color}15`, color: tier.color, fontSize: '0.55rem', letterSpacing: '0.05em' }}>
                        {tier.label.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">@{person.handle} · V-Score {person.vScore}</p>
                    {person.bio && <p className="text-xs text-white/50 mt-1.5 leading-relaxed line-clamp-2">{person.bio}</p>}

                    {/* Compatibility */}
                    <div className="mt-2.5">
                      <p className="text-xs text-white/25 mb-1">Compatibility</p>
                      <CompatBar pct={person.compatible} color={tier.color} />
                    </div>

                    {/* Token strip */}
                    <div className="flex items-center gap-2 mt-2.5 p-2 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <span className="text-xs font-mono font-bold" style={{ color: tier.color }}>${person.tokenSymbol}</span>
                      <span className="text-xs text-white/30 font-mono">${person.tokenPrice.toFixed(4)}</span>
                      <span className={`text-xs font-mono ml-auto ${person.change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {person.change7d >= 0 ? '+' : ''}{person.change7d.toFixed(1)}% 7d
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => message(person)} disabled={isMsg}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all border border-white/10 text-white/50 hover:text-white hover:border-white/25 disabled:opacity-40">
                    {isMsg ? '…' : '💬 Message'}
                  </button>
                  {!isConn ? (
                    <button onClick={() => connect(person)} disabled={isConnecting}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                      style={{ background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color }}>
                      {isConnecting ? '…' : '◉ Connect'}
                    </button>
                  ) : (
                    <div className="flex-1 py-2 rounded-xl text-xs font-semibold text-center text-green-400">
                      ✓ Connected
                    </div>
                  )}
                  <button onClick={() => router.push(`/profile/${person.handle}`)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-white/8 text-white/35 hover:text-white/70 hover:border-white/20">
                    Profile →
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3 opacity-20">◈</p>
            <p className="text-sm text-white/30">No results for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
