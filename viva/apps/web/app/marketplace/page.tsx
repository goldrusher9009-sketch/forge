'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type SortKey = 'price_change' | 'volume' | 'holders' | 'price' | 'mcap'

interface Token {
  symbol: string
  creatorName: string
  handle: string
  color: string
  verified: boolean
  price: number
  change24h: number
  volume24h: number
  holders: number
  supply: number
  mcap: number
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze'
  myTokens: number
}

const TOKENS: Token[] = [
  { symbol:'SVRN', creatorName:'Sovereign V',   handle:'sovereign_v', color:'#a855f7', verified:true,  price:8.75,  change24h:4.2,   volume24h:182400, holders:2840, supply:100000, mcap:875000, tier:'Diamond', myTokens:50  },
  { symbol:'MAYA', creatorName:'Maya Chen',     handle:'mayafit',     color:'#22c55e', verified:true,  price:5.20,  change24h:-1.8,  volume24h:84200,  holders:1620, supply:80000,  mcap:416000, tier:'Gold',    myTokens:80  },
  { symbol:'JAX',  creatorName:'Jax Beats',    handle:'jaxbeats',    color:'#ec4899', verified:true,  price:3.80,  change24h:7.1,   volume24h:61800,  holders:980,  supply:60000,  mcap:228000, tier:'Silver',  myTokens:0   },
  { symbol:'LUNA', creatorName:'Luna Writes',  handle:'luna_w',      color:'#f87171', verified:false, price:1.42,  change24h:12.4,  volume24h:28400,  holders:540,  supply:40000,  mcap:56800,  tier:'Silver',  myTokens:0   },
  { symbol:'ATL',  creatorName:'Atlas K',      handle:'atlas_k',     color:'#818cf8', verified:true,  price:6.10,  change24h:-0.4,  volume24h:54200,  holders:1240, supply:70000,  mcap:427000, tier:'Gold',    myTokens:20  },
  { symbol:'KAI',  creatorName:'Kai Raven',    handle:'kai_r',       color:'#22c55e', verified:false, price:0.88,  change24h:22.1,  volume24h:14200,  holders:320,  supply:30000,  mcap:26400,  tier:'Bronze',  myTokens:0   },
  { symbol:'NOA',  creatorName:'Noa Digital',  handle:'noa_d',       color:'#f59e0b', verified:false, price:2.15,  change24h:3.8,   volume24h:19800,  holders:680,  supply:50000,  mcap:107500, tier:'Bronze',  myTokens:0   },
  { symbol:'DXTR', creatorName:'Dex Trades',   handle:'dex_n',       color:'#a855f7', verified:false, price:0.32,  change24h:-5.2,  volume24h:8400,   holders:180,  supply:200000, mcap:64000,  tier:'Bronze',  myTokens:0   },
  { symbol:'JADE', creatorName:'Jade Luxury',  handle:'jade_l',      color:'#ec4899', verified:true,  price:4.60,  change24h:1.9,   volume24h:38200,  holders:890,  supply:45000,  mcap:207000, tier:'Silver',  myTokens:10  },
  { symbol:'MAXW', creatorName:'Max Wellness', handle:'max_t',       color:'#22c55e', verified:false, price:1.05,  change24h:-2.8,  volume24h:12400,  holders:410,  supply:55000,  mcap:57750,  tier:'Bronze',  myTokens:0   },
]

const SORT_LABELS: Record<SortKey, string> = {
  price_change: '24h %', volume: 'Volume', holders: 'Holders', price: 'Price', mcap: 'Market Cap'
}

const TIER_COLOR: Record<string, string> = { Diamond:'#818cf8', Gold:'#f59e0b', Silver:'#94a3b8', Bronze:'#b45309' }

export default function MarketplacePage() {
  const router = useRouter()
  const [sort, setSort]     = useState<SortKey>('volume')
  const [filter, setFilter] = useState<'all' | 'holding' | 'trending'>('all')
  const [buying, setBuying] = useState<Record<string, boolean>>({})
  const [bought, setBought] = useState<Record<string, boolean>>({})

  async function buy(symbol: string) {
    setBuying(p => ({ ...p, [symbol]: true }))
    await new Promise(r => setTimeout(r, 900))
    setBuying(p => ({ ...p, [symbol]: false }))
    setBought(p => ({ ...p, [symbol]: true }))
    setTimeout(() => setBought(p => ({ ...p, [symbol]: false })), 2000)
  }

  let tokens = [...TOKENS]
  if (filter === 'holding') tokens = tokens.filter(t => t.myTokens > 0)
  if (filter === 'trending') tokens = tokens.filter(t => t.change24h > 5)

  tokens.sort((a, b) => {
    if (sort === 'price_change') return b.change24h - a.change24h
    if (sort === 'volume')   return b.volume24h - a.volume24h
    if (sort === 'holders')  return b.holders - a.holders
    if (sort === 'price')    return b.price - a.price
    if (sort === 'mcap')     return b.mcap - a.mcap
    return 0
  })

  const totalVol = TOKENS.reduce((s, t) => s + t.volume24h, 0)
  const totalMcap = TOKENS.reduce((s, t) => s + t.mcap, 0)

  return (
    <div className="min-h-screen pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Marketplace</div>
            <div className="text-xs text-white/30">{TOKENS.length} tokens · ${ (totalMcap/1000000).toFixed(2) }M market cap</div>
          </div>
          <button onClick={() => router.push('/wallet')}
            className="text-xs px-3 py-1.5 rounded-xl font-bold"
            style={{ background:'rgba(168,85,247,0.12)', color:'#a855f7' }}>
            Wallet
          </button>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-xl border border-white/5" style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/25">24h Volume</div>
            <div className="font-black text-sm text-white/75">${(totalVol/1000).toFixed(0)}k</div>
          </div>
          <div className="p-2.5 rounded-xl border border-white/5" style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/25">Total Market Cap</div>
            <div className="font-black text-sm text-white/75">${(totalMcap/1000000).toFixed(2)}M</div>
          </div>
        </div>

        {/* Filter + Sort */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto">
          {(['all','holding','trending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize flex-shrink-0"
              style={filter === f ? { background:'#a855f7', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {f === 'trending' ? '🔥 Trending' : f === 'holding' ? '💎 Holding' : 'All'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
            <button key={k} onClick={() => setSort(k)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0"
              style={sort === k ? { background:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)' } : { background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.3)' }}>
              {SORT_LABELS[k]}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-2">
        {tokens.map((t, i) => (
          <div key={t.symbol} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
            style={{ background:'rgba(255,255,255,0.015)' }}>
            <div className="flex items-center gap-2 w-5 flex-shrink-0">
              <span className="text-xs text-white/20 font-bold">{i+1}</span>
            </div>
            <button onClick={() => router.push(`/tokens/${t.symbol}/chart`)}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background:`${t.color}15`, color:t.color }}>
                {t.symbol[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/80">${t.symbol}</span>
                  {t.verified && <span className="text-[10px]" style={{ color:t.color }}>✓</span>}
                  <span className="text-[10px] px-1 py-0.5 rounded font-bold"
                    style={{ background:`${TIER_COLOR[t.tier]}18`, color:TIER_COLOR[t.tier] }}>{t.tier[0]}</span>
                </div>
                <div className="text-xs text-white/25 truncate">{t.creatorName}</div>
              </div>
            </button>
            <div className="text-right flex-shrink-0 mr-2">
              <div className="font-black text-sm text-white/75">${t.price.toFixed(2)}</div>
              <div className="text-xs font-bold" style={{ color:t.change24h>=0?'#22c55e':'#f87171' }}>
                {t.change24h>=0?'+':''}{t.change24h}%
              </div>
            </div>
            <button onClick={() => buy(t.symbol)} disabled={buying[t.symbol]}
              className="px-3 py-1.5 rounded-xl text-xs font-black flex-shrink-0"
              style={bought[t.symbol]
                ? { background:'#22c55e', color:'#04040A' }
                : buying[t.symbol]
                  ? { background:'rgba(168,85,247,0.1)', color:'rgba(168,85,247,0.4)' }
                  : { background:`${t.color}15`, color:t.color }}>
              {bought[t.symbol] ? '✓' : buying[t.symbol] ? '…' : 'Buy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
