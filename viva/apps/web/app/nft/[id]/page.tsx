'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface NFTItem {
  id: string
  title: string
  description: string
  emoji: string
  color: string
  gradient: [string, string]
  ownerHandle: string
  ownerName: string
  ownerColor: string
  creatorHandle: string
  creatorName: string
  price: number
  currency: 'ETH' | '$VIVA' | 'SOL'
  edition: string
  supply: number
  minted: number
  royalty: number
  utility: string[]
  traits: { key: string; value: string; rarity: number }[]
  history: { event: string; from: string; to: string; price: number; ts: string }[]
}

const NFTS: Record<string, NFTItem> = {
  nft1: {
    id: 'nft1',
    title: 'Sovereign Genesis #001',
    description: 'The first NFT from Sovereign V\'s genesis collection. Holders get lifetime access to all signal packs, private rooms, and priority onboarding for new VIVA features.',
    emoji: '👑',
    color: '#a855f7',
    gradient: ['#7c3aed', '#a855f7'],
    ownerHandle: 'noa_d',
    ownerName: 'Noa D.',
    ownerColor: '#818cf8',
    creatorHandle: 'sovereign_v',
    creatorName: 'Sovereign V',
    price: 2.4,
    currency: 'ETH',
    edition: '1 of 100',
    supply: 100,
    minted: 87,
    royalty: 10,
    utility: [
      'Lifetime access to all signal packs',
      'Private Diamond room membership',
      'Priority access to new VIVA features',
      'Annual airdrop of 500 $SVRN',
    ],
    traits: [
      { key: 'Background', value: 'Nebula',    rarity: 8  },
      { key: 'Crown',      value: 'Gold',      rarity: 12 },
      { key: 'Aura',       value: 'Purple',    rarity: 35 },
      { key: 'Border',     value: 'Diamond',   rarity: 5  },
    ],
    history: [
      { event: 'Listed',   from: 'sovereign_v', to: '',          price: 1.8,  ts: '2026-01-15T10:00:00Z' },
      { event: 'Sold',     from: 'sovereign_v', to: 'atlas',     price: 1.8,  ts: '2026-01-16T14:00:00Z' },
      { event: 'Sold',     from: 'atlas',       to: 'noa_d',     price: 2.4,  ts: '2026-05-20T09:00:00Z' },
    ],
  },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export default function NFTDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'nft1'
  const nft = NFTS[id] ?? NFTS.nft1

  const [buying, setBuying] = useState(false)
  const [bought, setBought] = useState(false)
  const [tab, setTab] = useState<'details' | 'history'>('details')

  const mintPct = (nft.minted / nft.supply) * 100

  async function buy() {
    setBuying(true)
    await new Promise(r => setTimeout(r, 1600))
    setBuying(false)
    setBought(true)
  }

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
          <div className="flex-1 font-black text-white truncate">{nft.title}</div>
        </div>
      </header>

      {/* NFT Art */}
      <div className="px-4 py-5">
        <div className="aspect-square max-w-xs mx-auto rounded-3xl flex items-center justify-center mb-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${nft.gradient[0]}, ${nft.gradient[1]})` }}>
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)' }} />
          <span className="text-8xl relative z-10">{nft.emoji}</span>
        </div>

        <div className="text-2xl font-black text-white mb-1">{nft.title}</div>
        <div className="text-xs text-white/30 mb-4">{nft.edition}</div>

        {/* Owner / Creator */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Owner',   handle: nft.ownerHandle,   name: nft.ownerName,   color: nft.ownerColor   },
            { label: 'Creator', handle: nft.creatorHandle, name: nft.creatorName, color: nft.color },
          ].map(u => (
            <button key={u.label} onClick={() => router.push(`/profile/${u.handle}`)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-white/5 text-left"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: `${u.color}18`, color: u.color }}>
                {u.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-white/25">{u.label}</div>
                <div className="text-xs font-bold text-white/65 truncate">{u.name}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Mint progress */}
        <div className="p-3 rounded-xl border border-white/5 mb-4"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex justify-between text-xs text-white/30 mb-1.5">
            <span>{nft.minted}/{nft.supply} minted</span>
            <span>{mintPct.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full" style={{ width: `${mintPct}%`, background: nft.color }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4">
          {(['details', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
              style={tab === t ? { background: nft.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'details' && (
          <div className="space-y-4">
            <p className="text-sm text-white/50 leading-relaxed">{nft.description}</p>

            {/* Utility */}
            <div className="p-4 rounded-2xl border border-white/5 space-y-2"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Utility</div>
              {nft.utility.map((u, i) => (
                <div key={i} className="flex gap-2.5 text-sm text-white/55">
                  <span style={{ color: nft.color }}>✓</span>
                  <span>{u}</span>
                </div>
              ))}
            </div>

            {/* Traits */}
            <div className="grid grid-cols-2 gap-2">
              {nft.traits.map(t => (
                <div key={t.key} className="p-3 rounded-xl border border-white/5 text-center"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="text-xs text-white/25 mb-0.5">{t.key}</div>
                  <div className="font-black text-sm text-white/80">{t.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: nft.color }}>{t.rarity}% rarity</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs text-white/25 p-3 rounded-xl border border-white/5">
              <span>Creator Royalty</span>
              <span className="font-bold" style={{ color: nft.color }}>{nft.royalty}%</span>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {nft.history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {h.event === 'Sold' ? '💸' : '📋'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white/70">{h.event}</div>
                  <div className="text-xs text-white/25">
                    {h.from}{h.to ? ` → ${h.to}` : ''} · {fmtDate(h.ts)}
                  </div>
                </div>
                <div className="font-black text-sm" style={{ color: nft.color }}>
                  {h.price} {nft.currency}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buy bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        {bought ? (
          <div className="p-4 rounded-2xl text-center font-black"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            ✓ NFT purchased! Check your wallet.
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-white/25">Current Price</div>
              <div className="font-black text-xl text-white">{nft.price} <span style={{ color: nft.color }}>{nft.currency}</span></div>
            </div>
            <button onClick={buy} disabled={buying}
              className="flex-1 py-4 rounded-2xl font-black text-lg disabled:opacity-50"
              style={{ background: nft.color, color: '#04040A' }}>
              {buying ? 'Buying…' : 'Buy NFT'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
