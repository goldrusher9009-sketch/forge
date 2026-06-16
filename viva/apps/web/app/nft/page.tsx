'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MY_NFTS = [
  {
    id: 'n1', name: 'VIVA Genesis #0042', collection: 'VIVA Genesis Pass', color: '#a855f7',
    rarity: 'Legendary', traits: ['Early Adopter', 'Token Pioneer', 'Guardian Tier'],
    floorPrice: 0.8, lastSale: 1.2, currency: 'ETH', owned: true, mintDate: '2026-03-01',
    emoji: '🏆', desc: 'Genesis pass for VIVA founding community members. Unlocks lifetime Diamond tier perks.',
  },
  {
    id: 'n2', name: 'SOVV Holder Badge', collection: 'Sovereign V Collectibles', color: '#818cf8',
    rarity: 'Rare', traits: ['Gold Staker', '100+ Tokens'],
    floorPrice: 0.12, lastSale: 0.15, currency: 'ETH', owned: true, mintDate: '2026-04-12',
    emoji: '⬡', desc: 'Proof of Gold-tier staking. Grants exclusive access to Sovereign V\'s inner circle.',
  },
  {
    id: 'n3', name: '30-Day Streak Badge', collection: 'VIVA Achievement NFTs', color: '#f59e0b',
    rarity: 'Uncommon', traits: ['30-Day Streak', 'Creator Badge'],
    floorPrice: 0.04, lastSale: 0.05, currency: 'ETH', owned: false, mintDate: null,
    emoji: '🔥', desc: 'Minted automatically on completing the 30-day posting challenge. Non-transferable.',
  },
]

const DROPS = [
  {
    id: 'd1', name: 'VIVA Summer Series', collection: 'Limited Drops', color: '#ec4899',
    supply: 500, minted: 312, price: 0.05, currency: 'ETH',
    ends: '2026-07-01', emoji: '☀️',
    desc: 'Summer 2026 commemorative NFT. Includes profile frame + 50 bonus VIVA tokens.',
    traits: ['Seasonal', 'Profile Frame', 'Token Bonus'],
  },
  {
    id: 'd2', name: 'DAO Voter Badge', collection: 'Governance NFTs', color: '#818cf8',
    supply: 1000, minted: 788, price: 0, currency: 'VIVA',
    ends: '2026-06-30', emoji: '🗳️',
    desc: 'Free mint for anyone who voted on 5+ proposals. Unlocks DAO governance multiplier.',
    traits: ['Governance', 'Free Mint', 'Voting Boost'],
  },
]

const RARITY_COLORS: Record<string, string> = {
  Legendary: '#f59e0b',
  Rare: '#818cf8',
  Uncommon: '#22c55e',
  Common: '#94a3b8',
}

export default function NFTPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'owned' | 'drops'>('owned')
  const [minting, setMinting] = useState<string | null>(null)
  const [minted, setMinted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const [txMsg, setTxMsg] = useState<string | null>(null)

  async function handleMint(id: string, name: string) {
    setLoading(id)
    await new Promise(r => setTimeout(r, 1200))
    setMinted(prev => new Set([...prev, id]))
    setLoading(null)
    setMinting(null)
    setTxMsg(`Minted: ${name}`)
    setTimeout(() => setTxMsg(null), 4000)
  }

  const mintingDrop = DROPS.find(d => d.id === minting)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">DIGITAL COLLECTIBLES</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>NFT Vault</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([{ id: 'owned', label: '◎ My NFTs' }, { id: 'drops', label: '🎁 Live Drops' }] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'owned' && (
          <div className="space-y-3">
            {MY_NFTS.map(n => {
              const rarityColor = RARITY_COLORS[n.rarity] || '#94a3b8'
              return (
                <div key={n.id} className="p-4 rounded-2xl border"
                  style={{ background: 'rgba(255,255,255,0.018)', borderColor: n.owned ? `${n.color}30` : 'rgba(255,255,255,0.06)', opacity: n.owned ? 1 : 0.5 }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: `${n.color}14`, border: `1px solid ${n.color}25` }}>{n.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: `${rarityColor}18`, color: rarityColor }}>{n.rarity}</span>
                      </div>
                      <div className="font-bold text-white">{n.name}</div>
                      <div className="text-xs text-white/30">{n.collection}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white text-sm">Ξ{n.lastSale}</div>
                      <div className="text-xs text-white/25">last sale</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mb-3">{n.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {n.traits.map(tr => (
                      <span key={tr} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' }}>{tr}</span>
                    ))}
                  </div>
                  {n.owned && (
                    <div className="flex gap-2">
                      <div className="flex-1 py-2.5 rounded-xl text-center text-xs font-semibold"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>
                        Floor: Ξ{n.floorPrice}
                      </div>
                      <button className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                        style={{ background: n.color, color: '#04040A' }}>
                        List for Sale
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'drops' && (
          <div className="space-y-3">
            {DROPS.map(d => {
              const isMinted = minted.has(d.id)
              const pct = Math.round((d.minted / d.supply) * 100)
              return (
                <div key={d.id} className="p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: `${d.color}14`, border: `1px solid ${d.color}25` }}>{d.emoji}</div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{d.name}</div>
                      <div className="text-xs text-white/30 mb-1">{d.collection}</div>
                      <div className="text-xs font-bold" style={{ color: d.color }}>
                        {d.price === 0 ? 'Free Mint' : `Ξ${d.price}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white/60">{d.supply - d.minted}</div>
                      <div className="text-xs text-white/25">remaining</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mb-3">{d.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {d.traits.map(tr => (
                      <span key={tr} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${d.color}10`, color: d.color }}>{tr}</span>
                    ))}
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-white/25 mb-1">
                      <span>{d.minted}/{d.supply} minted</span>
                      <span>Ends {d.ends.slice(5)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                    </div>
                  </div>
                  <button onClick={() => !isMinted && setMinting(d.id)}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
                    style={isMinted
                      ? { background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }
                      : { background: d.color, color: '#04040A' }}>
                    {isMinted ? '✓ Minted' : d.price === 0 ? 'Mint Free' : `Mint for Ξ${d.price}`}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {mintingDrop && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setMinting(null)}>
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4"
            style={{ background: '#0d0d1a' }} onClick={e => e.stopPropagation()}>
            <div className="text-4xl text-center">{mintingDrop.emoji}</div>
            <div className="text-center">
              <div className="font-bold text-white text-lg">{mintingDrop.name}</div>
              <div className="text-sm text-white/40">{mintingDrop.collection}</div>
            </div>
            <div className="p-3 rounded-xl flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-sm text-white/60">Mint price</span>
              <span className="font-black" style={{ color: mintingDrop.color }}>
                {mintingDrop.price === 0 ? 'FREE' : `Ξ${mintingDrop.price}`}
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleMint(mintingDrop.id, mintingDrop.name)}
                disabled={loading === mintingDrop.id}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{ background: mintingDrop.color, color: '#04040A' }}>
                {loading === mintingDrop.id ? 'Minting…' : 'Confirm Mint'}
              </button>
              <button onClick={() => setMinting(null)}
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
