'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Listing {
  id: string
  title: string
  description: string
  type: 'signal_pack' | 'preset' | 'course' | 'nft' | 'template' | 'report'
  icon: string
  color: string
  price: number
  currency: '$VIVA' | 'USD'
  sellerHandle: string
  sellerName: string
  sellerColor: string
  sellerVerified: boolean
  rating: number
  reviews: number
  sales: number
  preview: string[]
  tags: string[]
  includes: string[]
}

const LISTINGS: Record<string, Listing> = {
  lst1: {
    id: 'lst1',
    title: 'DeFi Alpha Signal Pack — June',
    description: 'Get Sovereign V\'s top 15 trading signals for June. Each signal includes entry, take-profit levels, stop-loss, and full technical analysis write-up. Win rate: 74% over last 6 months.',
    type: 'signal_pack',
    icon: '📈',
    color: '#a855f7',
    price: 250,
    currency: '$VIVA',
    sellerHandle: 'sovereign_v',
    sellerName: 'Sovereign V',
    sellerColor: '#a855f7',
    sellerVerified: true,
    rating: 4.9,
    reviews: 284,
    sales: 1204,
    preview: ['BTC/USD Long — Entry $98.4k, TP1 $104k', 'ETH/USD Short — Entry $3,820', 'SOL breakout setup — 4H chart'],
    tags: ['signals', 'defi', 'crypto', 'swing'],
    includes: [
      '15 trading signals for June',
      'Full technical analysis for each',
      'Private Telegram group access',
      '30-day post-purchase support',
      'Historical accuracy data',
    ],
  },
  lst2: {
    id: 'lst2',
    title: 'Fitness Creator Starter Kit',
    description: 'Maya\'s proven system for building a fitness creator brand from zero. Includes workout content templates, engagement scripts, and a 30-day content calendar.',
    type: 'template',
    icon: '💪',
    color: '#22c55e',
    price: 89,
    currency: 'USD',
    sellerHandle: 'mayafit',
    sellerName: 'Maya Chen',
    sellerColor: '#22c55e',
    sellerVerified: true,
    rating: 4.8,
    reviews: 142,
    sales: 587,
    preview: ['30-day content calendar', 'Engagement script templates', 'Hashtag strategy guide'],
    tags: ['fitness', 'creator', 'templates', 'content'],
    includes: [
      '30-day content calendar template',
      '50+ post caption scripts',
      'Reel structure templates',
      'Hashtag research guide',
      'DM conversion scripts',
    ],
  },
}

const TYPE_LABELS: Record<string, string> = {
  signal_pack: 'Signal Pack',
  preset:      'Preset',
  course:      'Course',
  nft:         'NFT',
  template:    'Template',
  report:      'Report',
}

export default function MarketplaceItemPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'lst1'
  const item = LISTINGS[id] ?? LISTINGS.lst1

  const [buying, setBuying] = useState(false)
  const [bought, setBought] = useState(false)

  async function buy() {
    setBuying(true)
    await new Promise(r => setTimeout(r, 1400))
    setBuying(false)
    setBought(true)
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(item.rating) ? '★' : '☆')

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white text-sm truncate">{item.title}</div>
            <div className="text-xs text-white/25">{TYPE_LABELS[item.type]}</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="px-4 py-5">
        <div className="flex gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${item.color}12`, border: `1.5px solid ${item.color}20` }}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-lg text-white leading-tight">{item.title}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-400 text-sm">{stars.join('')}</span>
              <span className="text-sm font-bold text-white/70">{item.rating}</span>
              <span className="text-xs text-white/25">({item.reviews})</span>
              <span className="text-xs text-white/20">·</span>
              <span className="text-xs text-white/25">{item.sales.toLocaleString()} sales</span>
            </div>
          </div>
        </div>

        {/* Seller */}
        <button onClick={() => router.push(`/profile/${item.sellerHandle}`)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 text-left mb-4"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
            style={{ background: `${item.sellerColor}18`, color: item.sellerColor }}>
            {item.sellerName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-white/80">{item.sellerName}</span>
              {item.sellerVerified && <span className="text-xs" style={{ color: item.sellerColor }}>✓</span>}
            </div>
            <div className="text-xs text-white/25">@{item.sellerHandle}</div>
          </div>
          <span className="text-white/20 text-xs">View profile →</span>
        </button>

        {/* Description */}
        <p className="text-sm text-white/50 leading-relaxed mb-4">{item.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.tags.map(t => (
            <span key={t} className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              #{t}
            </span>
          ))}
        </div>

        {/* Preview */}
        <div className="space-y-2 mb-4">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Preview</div>
          <div className="p-3.5 rounded-2xl border border-white/5 space-y-2"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            {item.preview.map((p, i) => (
              <div key={i} className="flex gap-2 text-sm text-white/40">
                <span className="text-white/15">{i + 1}.</span>
                <span className="blur-[2px] select-none">{p}</span>
              </div>
            ))}
            <div className="text-xs text-center text-white/20 pt-1">Purchase to unlock full access</div>
          </div>
        </div>

        {/* What's included */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">What&apos;s Included</div>
          <div className="p-4 rounded-2xl border border-white/5 space-y-2.5"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            {item.includes.map((inc, i) => (
              <div key={i} className="flex gap-2.5 text-sm text-white/60">
                <span style={{ color: item.color }}>✓</span>
                <span>{inc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed buy bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        {bought ? (
          <div className="p-4 rounded-2xl text-center font-black"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            ✓ Purchased! Check your library.
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-white/25">Price</div>
              <div className="font-black text-xl text-white">
                {item.price} <span style={{ color: item.color }}>{item.currency}</span>
              </div>
            </div>
            <button onClick={buy} disabled={buying}
              className="flex-1 py-4 rounded-2xl font-black text-lg disabled:opacity-50"
              style={{ background: item.color, color: '#04040A' }}>
              {buying ? 'Buying…' : `Buy Now`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
