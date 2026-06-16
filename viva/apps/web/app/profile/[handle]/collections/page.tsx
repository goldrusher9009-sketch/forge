'use client'
import { useRouter, useParams } from 'next/navigation'

interface ProfileCollection {
  id: string
  title: string
  icon: string
  coverColor: string
  type: 'public' | 'token-gated' | 'private'
  items: number
  followers: number
  minTokens?: number
  tokenSymbol?: string
  preview: string[]
}

const USER_COLLECTIONS: Record<string, ProfileCollection[]> = {
  sovereign_v: [
    { id: 'col1', title: 'DeFi Deep Dives',        icon: '📊', coverColor: '#a855f7', type: 'token-gated', items: 28, followers: 1842, minTokens: 25, tokenSymbol: 'SVRN', preview: ['BTC cycle thesis','ETH acc.','SOL breakout'] },
    { id: 'col2', title: 'Free Market Threads',     icon: '🧵', coverColor: '#818cf8', type: 'public',      items: 14, followers: 3210, preview: ['Weekly macro','Dollar analysis','Fed watch'] },
    { id: 'col3', title: 'Diamond Vault',           icon: '💎', coverColor: '#a855f7', type: 'token-gated', items: 9,  followers: 421,  minTokens: 100, tokenSymbol: 'SVRN', preview: ['Private deal flow','Alpha calls','VC intel'] },
    { id: 'col4', title: 'Educational Series',      icon: '📚', coverColor: '#22c55e', type: 'public',      items: 22, followers: 5800, preview: ['What is DeFi','Yield farming','Risk mgmt'] },
  ],
  mayafit: [
    { id: 'col5', title: 'Workout Library',         icon: '💪', coverColor: '#22c55e', type: 'public',      items: 34, followers: 4200, preview: ['30-day challenge','HIIT circuits','Yoga flows'] },
    { id: 'col6', title: 'Premium Programs',        icon: '🌟', coverColor: '#22c55e', type: 'token-gated', items: 8,  followers: 892,  minTokens: 10, tokenSymbol: 'MAYA', preview: ['12-week shred','Macro guide','Meal plans'] },
  ],
  jaxbeats: [
    { id: 'col7', title: 'Beat Collection Vol. 1',  icon: '🎵', coverColor: '#ec4899', type: 'token-gated', items: 18, followers: 743,  minTokens: 10, tokenSymbol: 'JAX',  preview: ['Midnight Flex','Cloud Walk','Sample Kit'] },
    { id: 'col8', title: 'Free Beats',              icon: '🎶', coverColor: '#818cf8', type: 'public',      items: 12, followers: 2100, preview: ['Lofi set','Trap loops','R&B pack'] },
  ],
}

export default function ProfileCollectionsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const collections = USER_COLLECTIONS[handle] ?? USER_COLLECTIONS.sovereign_v

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="font-black text-white">Collections</div>
            <div className="text-xs text-white/30">@{handle} · {collections.length} collections</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {collections.map(col => (
          <button key={col.id} onClick={() => router.push(`/collections/${col.id}`)}
            className="w-full p-4 rounded-2xl border border-white/4 text-left"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <div className="flex items-start gap-3 mb-3">
              {/* Cover icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${col.coverColor}20, ${col.coverColor}08)`, border: `1px solid ${col.coverColor}20` }}>
                {col.icon}
                {col.type === 'token-gated' && (
                  <div className="absolute top-0.5 right-0.5 text-[8px]">🔒</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm text-white/85">{col.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {col.type === 'token-gated' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: `${col.coverColor}12`, color: col.coverColor }}>
                      {col.minTokens}+ ${col.tokenSymbol}
                    </span>
                  )}
                  {col.type === 'public' && (
                    <span className="text-xs text-white/25">Public</span>
                  )}
                </div>
                <div className="text-xs text-white/25 mt-0.5">
                  {col.items} items · {col.followers.toLocaleString()} followers
                </div>
              </div>
              <span className="text-white/15">›</span>
            </div>
            {/* Preview items */}
            <div className="flex gap-1.5 flex-wrap">
              {col.preview.map((p, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                  {p}
                </span>
              ))}
            </div>
          </button>
        ))}

        <button onClick={() => router.push('/collections')}
          className="w-full py-3 rounded-xl text-xs font-bold text-center"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
          Browse all VIVA collections →
        </button>
      </div>
    </div>
  )
}
