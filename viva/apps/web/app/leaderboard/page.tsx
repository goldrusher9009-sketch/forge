'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = 'creators' | 'investors' | 'tokens' | 'tippers'
type Period = '24h' | '7d' | '30d' | 'all'

interface CreatorEntry { rank: number; handle: string; name: string; color: string; verified: boolean; vscore: number; vscoreChange: number; followers: number; tokenSymbol: string; tokenPrice: number }
interface InvestorEntry { rank: number; handle: string; name: string; color: string; verified: boolean; portfolioValue: number; pnlPct: number; tokensHeld: number }
interface TokenEntry { rank: number; symbol: string; creatorName: string; color: string; price: number; change: number; holders: number; volume: number }
interface TipperEntry { rank: number; handle: string; name: string; color: string; verified: boolean; tipped: number; received: number }

const CREATORS: CreatorEntry[] = [
  { rank:1, handle:'sovereign_v', name:'Sovereign V', color:'#a855f7', verified:true,  vscore:9840, vscoreChange:+120, followers:48200, tokenSymbol:'SVRN', tokenPrice:8.75 },
  { rank:2, handle:'mayafit',     name:'Maya Chen',   color:'#22c55e', verified:true,  vscore:8720, vscoreChange:+85,  followers:62100, tokenSymbol:'MAYA', tokenPrice:5.20 },
  { rank:3, handle:'jaxbeats',    name:'Jax Beats',  color:'#ec4899', verified:true,  vscore:7410, vscoreChange:-30,  followers:34800, tokenSymbol:'JAX',  tokenPrice:3.80 },
  { rank:4, handle:'atlas_k',     name:'Atlas K',     color:'#818cf8', verified:true,  vscore:6280, vscoreChange:+210, followers:22400, tokenSymbol:'ATLK', tokenPrice:2.10 },
  { rank:5, handle:'lily_p',      name:'Lily P.',     color:'#f59e0b', verified:false, vscore:5540, vscoreChange:+55,  followers:18900, tokenSymbol:'LILY', tokenPrice:1.45 },
  { rank:6, handle:'dex_n',       name:'Dex N.',      color:'#818cf8', verified:false, vscore:4820, vscoreChange:-15,  followers:12300, tokenSymbol:'DXNT', tokenPrice:0.95 },
  { rank:7, handle:'luna_w',      name:'Luna W.',     color:'#f87171', verified:false, vscore:4200, vscoreChange:+40,  followers: 9800, tokenSymbol:'LUNW', tokenPrice:0.80 },
  { rank:8, handle:'marco_v',     name:'Marco V.',    color:'#f87171', verified:false, vscore:3760, vscoreChange:+90,  followers: 7200, tokenSymbol:'MRCV', tokenPrice:0.65 },
  { rank:9, handle:'jade_l',      name:'Jade L.',     color:'#a855f7', verified:false, vscore:3310, vscoreChange:-5,   followers: 5600, tokenSymbol:'JDEL', tokenPrice:0.50 },
  { rank:10,handle:'noa_d',       name:'Noa D.',      color:'#22c55e', verified:false, vscore:2980, vscoreChange:+125, followers: 4100, tokenSymbol:'NOAD', tokenPrice:0.42 },
]

const INVESTORS: InvestorEntry[] = [
  { rank:1, handle:'atlas_k',  name:'Atlas K',   color:'#818cf8', verified:true,  portfolioValue:42840, pnlPct:51.2, tokensHeld:3 },
  { rank:2, handle:'lily_p',   name:'Lily P.',   color:'#f59e0b', verified:false, portfolioValue:28400, pnlPct:38.9, tokensHeld:4 },
  { rank:3, handle:'max_t',    name:'Max T.',    color:'#ec4899', verified:false, portfolioValue:19200, pnlPct:22.1, tokensHeld:2 },
  { rank:4, handle:'luna_w',   name:'Luna W.',   color:'#f87171', verified:false, portfolioValue:14800, pnlPct:15.4, tokensHeld:5 },
  { rank:5, handle:'noa_d',    name:'Noa D.',    color:'#22c55e', verified:false, portfolioValue:11200, pnlPct:9.8,  tokensHeld:2 },
  { rank:6, handle:'kai_r',    name:'Kai R.',    color:'#f59e0b', verified:false, portfolioValue: 8400, pnlPct:6.2,  tokensHeld:3 },
  { rank:7, handle:'marco_v',  name:'Marco V.',  color:'#f87171', verified:false, portfolioValue: 6100, pnlPct:4.1,  tokensHeld:1 },
  { rank:8, handle:'jade_l',   name:'Jade L.',   color:'#a855f7', verified:false, portfolioValue: 4800, pnlPct:2.8,  tokensHeld:2 },
]

const TOKENS: TokenEntry[] = [
  { rank:1, symbol:'SVRN', creatorName:'Sovereign V', color:'#a855f7', price:8.75, change:4.2,  holders:2840, volume:128400 },
  { rank:2, symbol:'MAYA', creatorName:'Maya Chen',   color:'#22c55e', price:5.20, change:-1.8, holders:1620, volume:84200  },
  { rank:3, symbol:'JAX',  creatorName:'Jax Beats',  color:'#ec4899', price:3.80, change:7.1,  holders:980,  volume:61000  },
  { rank:4, symbol:'ATLK', creatorName:'Atlas K',     color:'#818cf8', price:2.10, change:12.4, holders:620,  volume:38400  },
  { rank:5, symbol:'LILY', creatorName:'Lily P.',     color:'#f59e0b', price:1.45, change:-2.1, holders:440,  volume:22100  },
]

const TIPPERS: TipperEntry[] = [
  { rank:1, handle:'atlas_k',  name:'Atlas K',   color:'#818cf8', verified:true,  tipped:2840,  received:0    },
  { rank:2, handle:'lily_p',   name:'Lily P.',   color:'#f59e0b', verified:false, tipped:1280,  received:420  },
  { rank:3, handle:'max_t',    name:'Max T.',    color:'#ec4899', verified:false, tipped: 840,  received:0    },
  { rank:4, handle:'luna_w',   name:'Luna W.',   color:'#f87171', verified:false, tipped: 620,  received:0    },
  { rank:5, handle:'noa_d',    name:'Noa D.',    color:'#22c55e', verified:false, tipped: 440,  received:0    },
]

const MEDALS = ['🥇', '🥈', '🥉']
const CAT_LABELS: Record<Category, string> = { creators: 'Creators', investors: 'Investors', tokens: 'Tokens', tippers: 'Tippers' }

export default function LeaderboardPage() {
  const router = useRouter()
  const [cat, setCat] = useState<Category>('creators')
  const [period, setPeriod] = useState<Period>('7d')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white">Leaderboard</div>
          <div className="ml-auto flex gap-1">
            {(['24h','7d','30d','all'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-2 py-1 rounded-full text-xs font-bold"
                style={period === p ? { background: '#a855f7', color: '#04040A' } : { color: 'rgba(255,255,255,0.3)' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5">
          {(Object.keys(CAT_LABELS) as Category[]).map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={cat === c ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-2">
        {cat === 'creators' && CREATORS.map(c => (
          <button key={c.handle} onClick={() => router.push(`/profile/${c.handle}`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <span className="text-lg w-6 flex-shrink-0">{c.rank <= 3 ? MEDALS[c.rank-1] : <span className="text-xs font-black text-white/20">#{c.rank}</span>}</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: `${c.color}18`, color: c.color }}>{c.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white/80">{c.name}</span>
                {c.verified && <span className="text-xs" style={{ color: c.color }}>✓</span>}
              </div>
              <div className="text-xs text-white/25">{(c.followers/1000).toFixed(0)}k followers</div>
            </div>
            <div className="text-right">
              <div className="font-black text-sm text-white/70">{c.vscore.toLocaleString()}</div>
              <div className="text-xs font-bold" style={{ color: c.vscoreChange >= 0 ? '#22c55e' : '#f87171' }}>
                {c.vscoreChange >= 0 ? '+' : ''}{c.vscoreChange}
              </div>
            </div>
          </button>
        ))}

        {cat === 'investors' && INVESTORS.map(inv => (
          <button key={inv.handle} onClick={() => router.push(`/portfolio/${inv.handle}/performance`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <span className="text-lg w-6 flex-shrink-0">{inv.rank <= 3 ? MEDALS[inv.rank-1] : <span className="text-xs font-black text-white/20">#{inv.rank}</span>}</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: `${inv.color}18`, color: inv.color }}>{inv.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white/80">{inv.name}</span>
                {inv.verified && <span className="text-xs" style={{ color: inv.color }}>✓</span>}
              </div>
              <div className="text-xs text-white/25">{inv.tokensHeld} tokens held</div>
            </div>
            <div className="text-right">
              <div className="font-black text-sm text-white/70">${(inv.portfolioValue/1000).toFixed(1)}k</div>
              <div className="text-xs font-bold" style={{ color: '#22c55e' }}>+{inv.pnlPct}%</div>
            </div>
          </button>
        ))}

        {cat === 'tokens' && TOKENS.map(t => (
          <button key={t.symbol} onClick={() => router.push(`/tokens/${t.symbol}/chart`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <span className="text-lg w-6 flex-shrink-0">{t.rank <= 3 ? MEDALS[t.rank-1] : <span className="text-xs font-black text-white/20">#{t.rank}</span>}</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: `${t.color}18`, color: t.color }}>{t.symbol[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white/80">${t.symbol}</div>
              <div className="text-xs text-white/25">{t.holders.toLocaleString()} holders · vol ${(t.volume/1000).toFixed(0)}k</div>
            </div>
            <div className="text-right">
              <div className="font-black text-sm text-white/70">${t.price}</div>
              <div className="text-xs font-bold" style={{ color: t.change >= 0 ? '#22c55e' : '#f87171' }}>
                {t.change >= 0 ? '+' : ''}{t.change}%
              </div>
            </div>
          </button>
        ))}

        {cat === 'tippers' && TIPPERS.map(t => (
          <button key={t.handle} onClick={() => router.push(`/profile/${t.handle}`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <span className="text-lg w-6 flex-shrink-0">{t.rank <= 3 ? MEDALS[t.rank-1] : <span className="text-xs font-black text-white/20">#{t.rank}</span>}</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: `${t.color}18`, color: t.color }}>{t.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white/80">{t.name}</span>
                {t.verified && <span className="text-xs" style={{ color: t.color }}>✓</span>}
              </div>
              <div className="text-xs text-white/25">{t.received > 0 ? `$${t.received} received` : 'Supporter'}</div>
            </div>
            <div className="text-right">
              <div className="font-black text-sm" style={{ color: '#22c55e' }}>${t.tipped}</div>
              <div className="text-xs text-white/25">tipped</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
