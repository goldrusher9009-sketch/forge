'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { tokens as tokensApi } from '@/lib/api'
import { TIER_META } from '@/lib/store'

const MOCK_TOKENS = [
  { id: 'm1', symbol: 'SOVV', creator: 'sovereign_v', handle: 'sovereign_v', price: 0.0089, supply: 100000, holders: 312, change: +24.1, marketCap: 890, tier: 'guardian', desc: 'ZK identity pioneer. Access to alpha & signals.' },
  { id: 'm2', symbol: 'LUNA', creator: 'luna_apex',   handle: 'luna_apex',   price: 0.0072, supply: 80000,  holders: 198, change: +18.3, marketCap: 576, tier: 'guardian', desc: 'Biohacker. Longevity research vault access.' },
  { id: 'm3', symbol: 'ZERO', creator: 'zeronode',    handle: 'zeronode',    price: 0.0061, supply: 120000, holders: 145, change: +12.7, marketCap: 732, tier: 'guardian', desc: 'Full-stack dev. Weekly DeFi signal drops.' },
  { id: 'm4', symbol: 'AISH', creator: 'aisham_x',    handle: 'aisham_x',    price: 0.0048, supply: 60000,  holders: 89,  change: +9.2,  marketCap: 288, tier: 'proven',   desc: 'Nutrition researcher. Macro tracking system.' },
  { id: 'm5', symbol: 'NOAD', creator: 'noa_delta',   handle: 'noa_delta',   price: 0.0041, supply: 75000,  holders: 67,  change: +7.8,  marketCap: 307, tier: 'proven',   desc: 'Prediction market wizard. 78% win rate.' },
  { id: 'm6', symbol: 'BIOP', creator: 'biophile',    handle: 'biophile',    price: 0.0028, supply: 50000,  holders: 54,  change: +3.1,  marketCap: 140, tier: 'proven',   desc: 'Sleep 9h/night. VO2 max 58. Cold plunge.' },
  { id: 'm7', symbol: 'ZKPR', creator: 'zkproof',     handle: 'zkproof',     price: 0.0022, supply: 40000,  holders: 38,  change: -1.2,  marketCap: 88,  tier: 'seeker',   desc: 'Privacy maximalist. ZK rollup engineer.' },
  { id: 'm8', symbol: 'MINT', creator: 'mintseeker',  handle: 'mintseeker',  price: 0.0019, supply: 35000,  holders: 29,  change: +2.0,  marketCap: 66,  tier: 'seeker',   desc: 'NFT artist. Creator economy native.' },
]

type Sort = 'marketCap' | 'change' | 'holders' | 'price'
type Filter = 'all' | 'guardian' | 'proven' | 'seeker'

function MiniSparkline({ up, color }: { up: boolean; color: string }) {
  const pts = up
    ? [30,28,32,27,35,31,38,33,42,38,48,44,52]
    : [52,50,48,52,46,49,44,47,41,44,38,42,36]
  const max = Math.max(...pts), min = Math.min(...pts)
  const norm = (v: number) => 20 - ((v - min) / (max - min)) * 18
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * 4} ${norm(v)}`).join(' ')
  return (
    <svg width="52" height="22" viewBox="0 0 52 22" fill="none">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  )
}

export default function TokensPage() {
  const router = useRouter()
  const [tokens, setTokens] = useState(MOCK_TOKENS)
  const [sort, setSort] = useState<Sort>('marketCap')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [buying, setBuying] = useState<string | null>(null)
  const [bought, setBought] = useState<Set<string>>(new Set())
  const [buyAmt, setBuyAmt] = useState<Record<string, string>>({})

  useEffect(() => {
    tokensApi.list().then((list: any[]) => {
      if (list.length) {
        setTokens(prev => {
          const real = list.map((t: any, i: number) => ({
            ...MOCK_TOKENS[i % MOCK_TOKENS.length],
            id: t.id,
            symbol: t.symbol ?? MOCK_TOKENS[i % MOCK_TOKENS.length].symbol,
            creator: t.owner?.handle ?? t.ownerId ?? MOCK_TOKENS[i % MOCK_TOKENS.length].creator,
            handle: t.owner?.handle ?? MOCK_TOKENS[i % MOCK_TOKENS.length].handle,
            price: t.price ?? MOCK_TOKENS[i % MOCK_TOKENS.length].price,
            supply: t.supply ?? MOCK_TOKENS[i % MOCK_TOKENS.length].supply,
            holders: t._count?.holdings ?? MOCK_TOKENS[i % MOCK_TOKENS.length].holders,
            change: t.priceChange24h ?? MOCK_TOKENS[i % MOCK_TOKENS.length].change,
            marketCap: (t.price ?? 0.001) * (t.supply ?? 10000),
          }))
          return [...real, ...prev.slice(real.length)]
        })
      }
    }).catch(() => {})
  }, [])

  async function buyToken(token: any) {
    const amt = Number(buyAmt[token.id] || 10)
    setBuying(token.id)
    try {
      await tokensApi.buy(token.id, Math.floor(amt / token.price))
    } catch {}
    setBought(prev => new Set([...prev, token.id]))
    setBuying(null)
  }

  const totalMarketCap = tokens.reduce((s, t) => s + (t.marketCap ?? 0), 0)
  const totalHolders = tokens.reduce((s, t) => s + t.holders, 0)
  const avgChange = tokens.reduce((s, t) => s + t.change, 0) / tokens.length

  const filtered = tokens
    .filter(t => filter === 'all' || t.tier === filter)
    .filter(t => !search || t.symbol.toLowerCase().includes(search.toLowerCase()) || t.creator.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'change') return b.change - a.change
      if (sort === 'holders') return b.holders - a.holders
      if (sort === 'price') return b.price - a.price
      return (b.marketCap ?? 0) - (a.marketCap ?? 0)
    })

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.94)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest mb-0.5">YOUTOKEN EXCHANGE</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Human Capital Market</h1>
          </div>
        </div>

        {/* Market stats ticker */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar mb-3">
          {[
            { label: 'Total MCap', val: `$${(totalMarketCap / 1000).toFixed(1)}K`, up: true },
            { label: 'Holders', val: totalHolders.toLocaleString(), up: true },
            { label: 'Avg 24h', val: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(1)}%`, up: avgChange >= 0 },
            { label: 'Listed', val: `${tokens.length} tokens`, up: true },
          ].map(s => (
            <div key={s.label} className="flex-shrink-0 px-3 py-1.5 rounded-xl border border-white/6"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-xs text-white/30 mb-0.5">{s.label}</p>
              <p className="text-sm font-bold font-mono" style={{ color: s.up ? '#4ade80' : '#f87171' }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="13" height="13" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M15 15l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search symbol or creator…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/8 bg-white/4 text-white text-xs outline-none focus:border-white/20 placeholder-white/25" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as Sort)}
            className="px-3 py-2 rounded-xl border border-white/8 bg-white/4 text-white text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <option value="marketCap">Market Cap</option>
            <option value="change">24h Change</option>
            <option value="holders">Holders</option>
            <option value="price">Price</option>
          </select>
        </div>

        {/* Tier filters */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'guardian', 'proven', 'seeker'] as Filter[]).map(f => {
            const tier = f !== 'all' ? TIER_META[f as keyof typeof TIER_META] : null
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize"
                style={{
                  background: filter === f ? `${tier?.color ?? 'rgba(255,255,255,0.15)'}18` : 'transparent',
                  border: `1px solid ${filter === f ? `${tier?.color ?? 'rgba(255,255,255,0.3)'}40` : 'rgba(255,255,255,0.06)'}`,
                  color: filter === f ? (tier?.color ?? 'white') : 'rgba(255,255,255,0.35)',
                }}>
                {f === 'all' ? 'All' : tier?.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* Token list */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-xs text-white/25 mb-3">{filtered.length} tokens · sorted by {sort.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>

        <div className="space-y-2">
          {filtered.map((token, idx) => {
            const tier = TIER_META[token.tier as keyof typeof TIER_META] ?? TIER_META.seed
            const up = token.change >= 0
            const isBuying = buying === token.id
            const isBought = bought.has(token.id)
            const amt = buyAmt[token.id] ?? '10'

            return (
              <div key={token.id} className="p-4 rounded-2xl border border-white/6 hover:border-white/12 transition-all"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-start gap-3">
                  {/* Rank + avatar */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-white/20 font-mono w-5 text-center">{idx + 1}</span>
                    <button onClick={() => router.push(`/profile/${token.handle}`)}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm hover:opacity-80 transition-opacity"
                      style={{ background: `${tier.color}15`, color: tier.color, border: `1.5px solid ${tier.color}30` }}>
                      {token.symbol[0]}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white/90 font-mono text-sm">${token.symbol}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: `${tier.color}12`, color: tier.color, fontSize: '0.5rem', letterSpacing: '0.06em' }}>
                        {tier.label.toUpperCase()}
                      </span>
                    </div>
                    <button onClick={() => router.push(`/profile/${token.handle}`)}
                      className="text-xs text-white/35 hover:text-white/60 transition-colors">
                      @{token.creator}
                    </button>
                    {token.desc && <p className="text-xs text-white/40 mt-1 line-clamp-1">{token.desc}</p>}

                    <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                      <span>{token.holders} holders</span>
                      <span>MCap ${(token.marketCap / 1000).toFixed(1)}K</span>
                      <span>{(token.supply / 1000).toFixed(0)}K supply</span>
                    </div>
                  </div>

                  {/* Price + sparkline */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="font-bold font-mono text-sm text-white/90">${token.price.toFixed(4)}</p>
                    <p className={`text-xs font-mono font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
                      {up ? '+' : ''}{token.change.toFixed(1)}%
                    </p>
                    <MiniSparkline up={up} color={up ? '#4ade80' : '#f87171'} />
                  </div>
                </div>

                {/* Buy row */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                  {!isBought ? (
                    <>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/25">$</span>
                        <input
                          value={amt}
                          onChange={e => setBuyAmt(prev => ({ ...prev, [token.id]: e.target.value }))}
                          placeholder="10"
                          className="w-full pl-6 pr-2 py-2 rounded-xl border border-white/8 bg-white/4 text-white text-xs outline-none focus:border-white/20 font-mono"
                        />
                      </div>
                      <button onClick={() => buyToken(token)} disabled={isBuying}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                        style={{ background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color }}>
                        {isBuying ? '…' : `Buy $${token.symbol}`}
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 py-2 text-xs text-green-400 font-semibold">✓ Holding ${token.symbol}</div>
                  )}
                  <button onClick={() => router.push(`/profile/${token.handle}`)}
                    className="px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 border border-white/6 hover:border-white/15 transition-all">
                    Profile →
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3 opacity-20">◈</p>
            <p className="text-sm text-white/30">No tokens found</p>
          </div>
        )}

        {/* Launch CTA */}
        <div className="mt-8 p-5 rounded-2xl border border-white/8 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(255,255,255,0.02))' }}>
          <p className="text-xs text-white/35 mb-1 tracking-wider">LAUNCH YOUR TOKEN</p>
          <p className="text-sm font-semibold text-white/80 mb-3">Your profile is a financial asset. Issue your YouToken and let the world invest in you.</p>
          <button onClick={() => router.push('/token')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--v)' }}>
            Launch YouToken →
          </button>
        </div>
      </div>
    </div>
  )
}
