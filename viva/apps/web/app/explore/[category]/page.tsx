'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CATEGORIES: Record<string, {
  label: string; icon: string; color: string;
  description: string;
  trending: { handle: string; name: string; tokenSymbol: string; tokenPrice: number; change24h: number; followers: number; bio: string }[];
  posts: { id: string; handle: string; name: string; content: string; likes: number; ts: string }[];
  tags: string[];
}> = {
  finance: {
    label: 'Finance', icon: '💹', color: '#22c55e',
    description: 'Token economy, DeFi, investing, and personal finance creators.',
    trending: [
      { handle: 'sovereign_v', name: 'Sovereign V', tokenSymbol: 'SOVV', tokenPrice: 12.40, change24h: +8.2, followers: 148000, bio: 'Token economy builder and yield optimizer.' },
      { handle: 'apextrader',  name: 'Apex Trader', tokenSymbol: 'APEX', tokenPrice: 9.10,  change24h: -2.1, followers: 64000,  bio: 'Swing trader. 7-figure portfolio. Educational content.' },
      { handle: 'yieldmaxi',   name: 'YieldMaxi',   tokenSymbol: 'YMXI', tokenPrice: 4.50,  change24h: +3.4, followers: 31000,  bio: 'DeFi yield maximization. Staking guides.' },
    ],
    posts: [
      { id: 'fp1', handle: 'sovereign_v', name: 'Sovereign V', content: 'The best DeFi yields right now are hiding in creator token staking. 35% APY on Diamond tier — and you get governance rights too. Thread 🧵', likes: 2100, ts: '2h ago' },
      { id: 'fp2', handle: 'apextrader',  name: 'Apex Trader', content: 'Pattern I see every bull cycle: retail buys tops, Diamond stakers buy dips. Be the Diamond staker.', likes: 1480, ts: '4h ago' },
    ],
    tags: ['#TokenStaking', '#YieldFarming', '#CreatorTokens', '#DeFi', '#Investing'],
  },
  health: {
    label: 'Health', icon: '🏃', color: '#f59e0b',
    description: 'Fitness, biohacking, nutrition, and longevity creators.',
    trending: [
      { handle: 'mayafit',   name: 'Maya Chen',   tokenSymbol: 'MAYA', tokenPrice: 6.60, change24h: +12.3, followers: 92000, bio: 'Biohacker & certified nutritionist.' },
      { handle: 'zenvitals', name: 'Zen Vitals',  tokenSymbol: 'ZENV', tokenPrice: 3.80, change24h: +1.8,  followers: 42000, bio: 'HRV, sleep, and longevity protocols.' },
      { handle: 'fitdao',    name: 'FitDAO Club', tokenSymbol: 'FITD', tokenPrice: 2.20, change24h: +5.2,  followers: 28000, bio: 'Community fitness challenges with token rewards.' },
    ],
    posts: [
      { id: 'hp1', handle: 'mayafit',   name: 'Maya Chen',  content: 'Day 14 biohack results: cortisol down 22%, HRV up 31%, sleep efficiency 96%. Protocol breakdown live for Gold+ holders tonight.', likes: 1920, ts: '1h ago' },
      { id: 'hp2', handle: 'zenvitals', name: 'Zen Vitals', content: 'Your morning light exposure matters more than your supplements. 10min of sunlight in the first 30min of waking → better sleep 16hrs later.', likes: 890, ts: '6h ago' },
    ],
    tags: ['#Biohacking', '#LongevityProtocol', '#HRV', '#Fitness', '#Nutrition'],
  },
  tech: {
    label: 'Tech', icon: '⚡', color: '#818cf8',
    description: 'Web3, AI, ZK proofs, and cutting-edge tech creators.',
    trending: [
      { handle: 'zeronode',  name: 'ZeroNode',     tokenSymbol: 'ZERO', tokenPrice: 3.20, change24h: +5.5, followers: 38000, bio: 'ZK privacy researcher. ex-Protocol Labs.' },
      { handle: 'aibuilder', name: 'AI Builder',   tokenSymbol: 'AIBD', tokenPrice: 2.90, change24h: +9.1, followers: 27000, bio: 'Building AI agents. Ship daily.' },
      { handle: 'coredev',   name: 'CoreDev Labs', tokenSymbol: 'CRDV', tokenPrice: 1.80, change24h: -1.2, followers: 19000, bio: 'L2 infra and rollup research.' },
    ],
    posts: [
      { id: 'tp1', handle: 'zeronode',  name: 'ZeroNode',   content: 'New ZK proof system reduces verification gas cost by 68%. Publishing the paper tomorrow. Token holders get early access.', likes: 1340, ts: '3h ago' },
      { id: 'tp2', handle: 'aibuilder', name: 'AI Builder', content: '30 days of shipping AI agents in public. What I learned: distribution > model quality. Build in public, earn trust, tokenize the community.', likes: 780, ts: '7h ago' },
    ],
    tags: ['#ZeroKnowledge', '#AIAgents', '#Web3', '#L2', '#BlockchainDev'],
  },
  music: {
    label: 'Music', icon: '🎵', color: '#ec4899',
    description: 'Artists, producers, and music community creators.',
    trending: [
      { handle: 'alexwave', name: 'Alex Wave',    tokenSymbol: 'WAVE', tokenPrice: 2.10, change24h: +1.8, followers: 29000, bio: 'Music producer & NFT artist. 3 gold records.' },
      { handle: 'bassline', name: 'Bassline DAO', tokenSymbol: 'BASS', tokenPrice: 1.60, change24h: +4.2, followers: 18000, bio: 'Community-owned music label.' },
      { handle: 'synthkid', name: 'Synth Kid',   tokenSymbol: 'SYNT', tokenPrice: 0.90, change24h: +8.0, followers: 11000, bio: 'Lo-fi and ambient producer.' },
    ],
    posts: [
      { id: 'mp1', handle: 'alexwave', name: 'Alex Wave', content: 'Dropped an unreleased track as an NFT for Silver+ holders. 48hrs exclusive. Then it drops everywhere. New album in 3 weeks 🎶', likes: 2840, ts: '1h ago' },
      { id: 'mp2', handle: 'bassline', name: 'Bassline DAO', content: 'DAO vote passed: we\'re signing our first independent artist to the label. Token holders split 15% of first album revenue. Historical moment.', likes: 1200, ts: '5h ago' },
    ],
    tags: ['#MusicNFT', '#IndieArtist', '#MusicDAO', '#Producer', '#LoFi'],
  },
}

const DEFAULT_CATEGORY = {
  label: 'Explore', icon: '🔍', color: '#a855f7',
  description: 'Discover creators across all categories.',
  trending: [
    { handle: 'sovereign_v', name: 'Sovereign V', tokenSymbol: 'SOVV', tokenPrice: 12.40, change24h: +8.2, followers: 148000, bio: 'Token economy builder.' },
    { handle: 'mayafit',     name: 'Maya Chen',   tokenSymbol: 'MAYA', tokenPrice: 6.60,  change24h: +12.3, followers: 92000,  bio: 'Biohacker & health creator.' },
    { handle: 'zeronode',    name: 'ZeroNode',    tokenSymbol: 'ZERO', tokenPrice: 3.20,  change24h: +5.5,  followers: 38000,  bio: 'ZK privacy researcher.' },
  ],
  posts: [],
  tags: ['#Trending', '#NewTokens', '#TopCreators'],
}

const NAV_CATEGORIES = [
  { id: 'finance', label: 'Finance', icon: '💹' },
  { id: 'health',  label: 'Health',  icon: '🏃' },
  { id: 'tech',    label: 'Tech',    icon: '⚡' },
  { id: 'music',   label: 'Music',   icon: '🎵' },
  { id: 'art',     label: 'Art',     icon: '🎨' },
  { id: 'gaming',  label: 'Gaming',  icon: '🎮' },
]

export default function ExploreCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const catId = typeof params.category === 'string' ? params.category : ''
  const cat = CATEGORIES[catId] ?? { ...DEFAULT_CATEGORY, label: catId ? catId.charAt(0).toUpperCase() + catId.slice(1) : 'Explore' }

  const [tab, setTab] = useState<'creators' | 'posts'>('creators')
  const [buying, setBuying] = useState<string | null>(null)

  async function quickBuy(symbol: string) {
    setBuying(symbol)
    await new Promise(r => setTimeout(r, 1100))
    setBuying(null)
  }

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
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">{cat.icon}</span>
            <div>
              <div className="font-black text-white">{cat.label}</div>
              <div className="text-xs text-white/30">{cat.description}</div>
            </div>
          </div>
        </div>
        {/* Category switcher */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {NAV_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => router.push(`/explore/${c.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
              style={c.id === catId
                ? { background: cat.color, color: '#04040A' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {cat.tags.map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: `${cat.color}15`, color: cat.color }}>{t}</span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['creators', 'posts'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
              style={tab === t
                ? { background: cat.color, color: '#04040A' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'creators' && (
          <div className="space-y-3">
            <div className="text-xs text-white/30 uppercase tracking-widest">Trending Creators</div>
            {cat.trending.map((c, i) => (
              <div key={c.handle} className="p-3 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{ background: `${cat.color}18`, color: cat.color }}>{c.name[0]}</div>
                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: cat.color, color: '#04040A' }}>{i + 1}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white/85 text-sm">{c.name}</div>
                    <div className="text-xs text-white/30">@{c.handle} · {(c.followers/1000).toFixed(0)}k followers</div>
                    <div className="text-xs text-white/40 truncate">{c.bio}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black text-white">${c.tokenPrice}</div>
                    <div className={`text-xs font-bold ${c.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {c.change24h >= 0 ? '+' : ''}{c.change24h}%
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/profile/${c.handle}`)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    View Profile
                  </button>
                  <button onClick={() => quickBuy(c.tokenSymbol)}
                    disabled={buying === c.tokenSymbol}
                    className="flex-1 py-2 rounded-xl text-xs font-black disabled:opacity-50"
                    style={{ background: cat.color, color: '#04040A' }}>
                    {buying === c.tokenSymbol ? '…' : `Buy $${c.tokenSymbol}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'posts' && (
          <div className="space-y-3">
            <div className="text-xs text-white/30 uppercase tracking-widest">Top Posts</div>
            {cat.posts.length === 0
              ? <div className="text-center text-white/25 text-sm py-12">No posts yet</div>
              : cat.posts.map(p => (
                <button key={p.id} onClick={() => router.push(`/feed/${p.id}`)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-white/6 hover:border-white/12 transition-all text-left"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                    style={{ background: `${cat.color}18`, color: cat.color }}>{p.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/40 mb-1">{p.name} · {p.ts}</div>
                    <div className="text-sm text-white/65 leading-relaxed line-clamp-3">{p.content}</div>
                    <div className="text-xs text-white/25 mt-1">❤️ {p.likes.toLocaleString()}</div>
                  </div>
                </button>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
