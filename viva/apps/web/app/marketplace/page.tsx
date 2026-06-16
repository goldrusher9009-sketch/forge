'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['All', 'Digital', 'Merch', 'Courses', 'Access']

const LISTINGS = [
  {
    id: 'l1', seller: 'sovereign_v', sellerName: 'Sovereign V', symbol: 'SOVV', color: '#a855f7',
    title: 'Token Economy Blueprint', category: 'Digital', type: 'PDF + Template Pack',
    price: 49, priceCurrency: 'USDC', tokenGate: null,
    desc: 'The exact framework I used to build a 6-figure personal token economy. 60-page PDF + Notion template.',
    sold: 312, rating: 4.9, reviews: 84, img: '📄',
  },
  {
    id: 'l2', seller: 'mayafit', sellerName: 'Maya Chen', symbol: 'MAYA', color: '#22c55e',
    title: 'Biohack OS — Full Program', category: 'Courses', type: '8-week video course',
    price: 120, priceCurrency: 'USDC', tokenGate: { tier: 'Bronze', minTokens: 10 },
    desc: '8-week morning optimization program. Sleep, HRV, cold exposure, nutrition protocol. Diamond holders get lifetime updates.',
    sold: 189, rating: 4.8, reviews: 61, img: '🧬',
  },
  {
    id: 'l3', seller: 'luna_apex', sellerName: 'Luna Apex', symbol: 'APEX', color: '#f59e0b',
    title: 'Apex Creator Hoodie', category: 'Merch', type: 'Physical — ships worldwide',
    price: 65, priceCurrency: 'USDC', tokenGate: { tier: 'Silver', minTokens: 25 },
    desc: 'Limited run. Heavyweight cotton. APEX embroidered logo. Ships in 2-3 weeks. Silver+ holders get free shipping.',
    sold: 72, rating: 4.7, reviews: 22, img: '👕',
  },
  {
    id: 'l4', seller: 'zeronode', sellerName: 'ZeroNode', symbol: 'ZERO', color: '#818cf8',
    title: 'ZK Identity Masterclass', category: 'Courses', type: '4-hour workshop recording',
    price: 89, priceCurrency: 'USDC', tokenGate: null,
    desc: 'Deep dive on ZK proofs, anonymous credentials, and building on VIVA\'s identity layer. Includes code walkthroughs.',
    sold: 145, rating: 5.0, reviews: 39, img: '🔐',
  },
  {
    id: 'l5', seller: 'sovereign_v', sellerName: 'Sovereign V', symbol: 'SOVV', color: '#a855f7',
    title: 'Sovereign Inner Circle (Q3)', category: 'Access', type: 'Private Telegram + monthly call',
    price: 0, priceCurrency: 'SOVV', tokenGate: { tier: 'Gold', minTokens: 50 },
    desc: 'Gold+ holders only. Weekly alpha, deal flow, monthly live Q&A, and first access to new SOVV drops.',
    sold: 58, rating: 5.0, reviews: 14, img: '👑',
  },
  {
    id: 'l6', seller: 'mayafit', sellerName: 'Maya Chen', symbol: 'MAYA', color: '#22c55e',
    title: 'MAYA Exclusive Meal Plans', category: 'Digital', type: '12-week nutrition guide PDF',
    price: 29, priceCurrency: 'USDC', tokenGate: null,
    desc: 'Evidence-based nutrition templates. Performance, longevity, and aesthetic tracks. Includes macro calculator.',
    sold: 421, rating: 4.9, reviews: 113, img: '🥗',
  },
]

export default function MarketplacePage() {
  const router = useRouter()
  const [cat, setCat] = useState('All')
  const [buying, setBuying] = useState<string | null>(null)
  const [purchased, setPurchased] = useState<Set<string>>(new Set())
  const [loadingBuy, setLoadingBuy] = useState<string | null>(null)
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = LISTINGS.filter(l =>
    (cat === 'All' || l.category === cat) &&
    (!search || l.title.toLowerCase().includes(search.toLowerCase()) || l.sellerName.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleBuy(id: string, title: string) {
    setLoadingBuy(id)
    await new Promise(r => setTimeout(r, 1000))
    setPurchased(prev => new Set([...prev, id]))
    setLoadingBuy(null)
    setBuying(null)
    setTxMsg(`Purchased: ${title}`)
    setTimeout(() => setTxMsg(null), 4000)
  }

  const buyingItem = LISTINGS.find(l => l.id === buying)

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
            <p className="text-xs text-white/30 tracking-widest">CREATOR ECONOMY</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Marketplace</h1>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: '#a855f718', color: '#a855f7', border: '1px solid #a855f725' }}>
            + List Item
          </button>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search listings or creators…"
          className="w-full px-3 py-2 rounded-xl text-sm mb-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none' }}
        />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
              style={cat === c
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/25 text-sm">No listings found</div>
        )}

        {filtered.map(l => {
          const isBought = purchased.has(l.id)
          const isFree = l.price === 0
          return (
            <div key={l.id} className="p-4 rounded-2xl border border-white/6"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${l.color}14` }}>{l.img}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-white leading-snug">{l.title}</div>
                      <button onClick={() => router.push(`/profile/${l.seller}`)}
                        className="text-xs font-semibold transition-colors" style={{ color: l.color }}>
                        by {l.sellerName}
                      </button>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black" style={{ color: isFree ? '#818cf8' : 'white' }}>
                        {isFree ? `${l.tokenGate?.tier}+` : `$${l.price}`}
                      </div>
                      <div className="text-xs text-white/30">{isFree ? 'token gate' : l.priceCurrency}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${l.color}14`, color: l.color }}>{l.category}</span>
                <span className="text-xs text-white/30">{l.type}</span>
              </div>
              <p className="text-xs text-white/45 mb-3 leading-relaxed">{l.desc}</p>
              {l.tokenGate && (
                <div className="mb-3 flex items-center gap-2 text-xs"
                  style={{ color: l.color }}>
                  <span>⬡</span>
                  <span>Requires {l.tokenGate.minTokens}+ {l.symbol} ({l.tokenGate.tier} tier)</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-white/25 mb-3">
                <span>⭐ {l.rating} ({l.reviews} reviews)</span>
                <span>{l.sold} sold</span>
              </div>
              <button
                onClick={() => isBought ? null : setBuying(l.id)}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
                style={isBought
                  ? { background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }
                  : { background: l.color, color: '#04040A' }}>
                {isBought ? '✓ Purchased' : isFree ? 'Unlock with Tokens' : `Buy for $${l.price}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Purchase modal */}
      {buyingItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setBuying(null)}>
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4"
            style={{ background: '#0d0d1a' }} onClick={e => e.stopPropagation()}>
            <div className="text-2xl text-center">{buyingItem.img}</div>
            <div className="text-center">
              <div className="font-bold text-white text-lg">{buyingItem.title}</div>
              <div className="text-sm text-white/40">by {buyingItem.sellerName}</div>
            </div>
            <div className="p-3 rounded-xl flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-sm text-white/60">Total</span>
              <span className="font-black text-white">${buyingItem.price} {buyingItem.priceCurrency}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleBuy(buyingItem.id, buyingItem.title)}
                disabled={loadingBuy === buyingItem.id}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{ background: buyingItem.color, color: '#04040A' }}>
                {loadingBuy === buyingItem.id ? 'Processing…' : 'Confirm Purchase'}
              </button>
              <button onClick={() => setBuying(null)}
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
