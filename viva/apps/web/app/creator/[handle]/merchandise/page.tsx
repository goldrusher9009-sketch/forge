'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface MerchItem {
  id: string
  title: string
  emoji: string
  price: number
  currency: string
  category: 'apparel' | 'accessories' | 'digital' | 'limited'
  inStock: boolean
  qty?: number
  tokenDiscount?: number
  minTokens?: number
  tokenSymbol?: string
  limited?: boolean
}

const MERCH: Record<string, { items: MerchItem[]; currency: string }> = {
  sovereign_v: {
    currency: 'USDC',
    items: [
      { id: 'm1', title: 'Sovereign Hoodie',        emoji: '👕', price: 89,  currency: 'USDC', category: 'apparel',     inStock: true,  tokenDiscount: 20, minTokens: 25, tokenSymbol: 'SVRN' },
      { id: 'm2', title: 'Alpha Trader Cap',         emoji: '🧢', price: 45,  currency: 'USDC', category: 'apparel',     inStock: true,  tokenDiscount: 10, minTokens: 10, tokenSymbol: 'SVRN' },
      { id: 'm3', title: 'SVRN Enamel Pin',          emoji: '📌', price: 18,  currency: 'USDC', category: 'accessories', inStock: true  },
      { id: 'm4', title: 'Diamond Member NFT Pass',  emoji: '💎', price: 500, currency: 'USDC', category: 'limited',     inStock: true,  limited: true, qty: 7, minTokens: 100, tokenSymbol: 'SVRN' },
      { id: 'm5', title: 'DeFi Signal Notion Pack',  emoji: '📓', price: 29,  currency: 'USDC', category: 'digital',     inStock: true,  tokenDiscount: 15, minTokens: 10, tokenSymbol: 'SVRN' },
      { id: 'm6', title: '1-on-1 Strategy Session',  emoji: '🎯', price: 299, currency: 'USDC', category: 'limited',     inStock: false, limited: true, qty: 0 },
    ],
  },
  mayafit: {
    currency: 'USDC',
    items: [
      { id: 'm7',  title: 'MayaFit Resistance Bands', emoji: '💪', price: 39, currency: 'USDC', category: 'accessories', inStock: true,  tokenDiscount: 10, minTokens: 10, tokenSymbol: 'MAYA' },
      { id: 'm8',  title: 'MayaFit Sports Bra',       emoji: '👙', price: 55, currency: 'USDC', category: 'apparel',     inStock: true  },
      { id: 'm9',  title: '12-Week Shred PDF',         emoji: '📋', price: 49, currency: 'USDC', category: 'digital',     inStock: true,  tokenDiscount: 20, minTokens: 10, tokenSymbol: 'MAYA' },
    ],
  },
}

type Category = 'all' | 'apparel' | 'accessories' | 'digital' | 'limited'

const CAT_LABELS: Record<Category, string> = { all: 'All', apparel: 'Apparel', accessories: 'Accessories', digital: 'Digital', limited: 'Limited' }

export default function CreatorMerchandisePage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const store = MERCH[handle] ?? MERCH.sovereign_v

  const [cat, setCat] = useState<Category>('all')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [added, setAdded] = useState<Record<string, boolean>>({})

  const filtered = store.items.filter(i => cat === 'all' || i.category === cat)
  const cartCount = Object.values(cart).reduce((a, v) => a + v, 0)
  const categories = ['all', ...new Set(store.items.map(i => i.category))] as Category[]

  // Pretend user holds tokens
  const tokenHeld = 50

  function addToCart(id: string) {
    setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
    setAdded(prev => ({ ...prev, [id]: true }))
    setTimeout(() => setAdded(prev => ({ ...prev, [id]: false })), 1500)
  }

  const PROFILE_COLORS: Record<string, string> = { sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899' }
  const accentColor = PROFILE_COLORS[handle] ?? '#a855f7'

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Merch Store</div>
            <div className="text-xs text-white/30">@{handle} · {store.items.length} items</div>
          </div>
          {cartCount > 0 && (
            <button onClick={() => router.push('/cart')}
              className="relative px-3 py-1.5 rounded-xl text-xs font-black"
              style={{ background: accentColor, color: '#04040A' }}>
              🛒 {cartCount}
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 capitalize"
              style={cat === c ? { background: accentColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </header>

      {/* Token discount banner */}
      {store.items.some(i => i.tokenDiscount) && (
        <div className="mx-4 mt-4 p-3 rounded-xl border flex items-center gap-3"
          style={{ background: `${accentColor}08`, borderColor: `${accentColor}20` }}>
          <span className="text-lg">💎</span>
          <div className="flex-1">
            <div className="text-xs font-black text-white/75">You hold tokens → get discounts!</div>
            <div className="text-xs text-white/30">Your {handle === 'sovereign_v' ? 'SVRN' : 'MAYA'} tokens unlock savings on eligible items.</div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {filtered.map(item => {
          const hasDiscount = item.tokenDiscount && tokenHeld >= (item.minTokens ?? 0)
          const finalPrice = hasDiscount ? item.price * (1 - item.tokenDiscount! / 100) : item.price
          const isAdded = added[item.id]

          return (
            <div key={item.id} className="rounded-2xl border border-white/4 overflow-hidden flex flex-col"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              {/* Product image area */}
              <div className="h-32 flex items-center justify-center relative"
                style={{ background: `${accentColor}08` }}>
                <span className="text-5xl">{item.emoji}</span>
                {item.limited && (
                  <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: '#f59e0b', color: '#04040A' }}>
                    Limited
                  </div>
                )}
                {!item.inStock && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-t-2xl"
                    style={{ background: 'rgba(4,4,10,0.6)' }}>
                    <span className="text-xs font-bold text-white/40">Sold Out</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="font-bold text-xs text-white/80 leading-tight">{item.title}</div>
                {item.qty !== undefined && item.qty > 0 && (
                  <div className="text-xs" style={{ color: item.qty <= 3 ? '#f87171' : '#f59e0b' }}>
                    {item.qty} left
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  {hasDiscount ? (
                    <>
                      <span className="font-black text-sm" style={{ color: accentColor }}>${finalPrice.toFixed(0)}</span>
                      <span className="text-xs line-through text-white/25">${item.price}</span>
                      <span className="text-xs" style={{ color: accentColor }}>-{item.tokenDiscount}%</span>
                    </>
                  ) : (
                    <span className="font-black text-sm text-white/70">${item.price}</span>
                  )}
                </div>
                {item.minTokens && !hasDiscount && (
                  <div className="text-xs text-white/20">Hold {item.minTokens}+ ${item.tokenSymbol} for {item.tokenDiscount}% off</div>
                )}
                <button onClick={() => item.inStock && addToCart(item.id)} disabled={!item.inStock}
                  className="mt-auto py-2 rounded-xl font-black text-xs disabled:opacity-30"
                  style={isAdded
                    ? { background: '#22c55e', color: '#04040A' }
                    : { background: item.inStock ? accentColor : 'rgba(255,255,255,0.06)', color: item.inStock ? '#04040A' : 'rgba(255,255,255,0.3)' }}>
                  {isAdded ? '✓ Added' : item.inStock ? 'Add to Cart' : 'Sold Out'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
