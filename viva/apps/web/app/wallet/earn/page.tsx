'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EarnOpportunity {
  id: string
  type: 'staking' | 'referral' | 'content' | 'engagement' | 'trading'
  title: string
  desc: string
  emoji: string
  reward: string
  apy?: number
  color: string
  action: string
  actionUrl: string
  completed?: boolean
  progress?: number
  progressMax?: number
  progressLabel?: string
}

const OPPORTUNITIES: EarnOpportunity[] = [
  { id:'e1', type:'staking',    title:'Stake $SVRN',    desc:'Stake your SVRN tokens and earn up to 35% APY',          emoji:'🔒', reward:'Up to 35% APY',  apy:35, color:'#a855f7', action:'Stake Now',   actionUrl:'/tokens/SVRN/staking', },
  { id:'e2', type:'staking',    title:'Stake $MAYA',    desc:'Maya token staking unlocks Diamond tier and rewards',     emoji:'🔒', reward:'Up to 35% APY',  apy:22, color:'#22c55e', action:'Stake Now',   actionUrl:'/tokens/MAYA/staking', },
  { id:'e3', type:'referral',   title:'Refer a Friend', desc:'Earn 50 USDC per friend who joins and buys tokens',       emoji:'👥', reward:'50 USDC/referral',          color:'#f59e0b', action:'Share Link',  actionUrl:'/settings/referrals',  progress:3, progressMax:10, progressLabel:'3 / 10 referrals' },
  { id:'e4', type:'content',    title:'Post Daily',     desc:'Post quality content 7 days in a row for a bonus',        emoji:'📝', reward:'+200 VScore',               color:'#818cf8', action:'Post Now',    actionUrl:'/feed/compose',        progress:4, progressMax:7, progressLabel:'Day 4 / 7' },
  { id:'e5', type:'engagement', title:'Comment 5 Posts',desc:'Leave thoughtful comments on 5 posts today',              emoji:'💬', reward:'20 USDC',                   color:'#ec4899', action:'Browse Feed', actionUrl:'/feed',                progress:2, progressMax:5, progressLabel:'2 / 5 posts' },
  { id:'e6', type:'trading',    title:'First Swap',     desc:'Complete your first token swap and earn a reward',         emoji:'⇅',  reward:'10 USDC',                   color:'#818cf8', action:'Swap Now',    actionUrl:'/wallet/swap',         completed:true },
  { id:'e7', type:'engagement', title:'Tip a Creator',  desc:'Send a tip to any creator to earn VScore',                emoji:'💸', reward:'+50 VScore',                color:'#22c55e', action:'Browse',      actionUrl:'/feed',                completed:true },
  { id:'e8', type:'staking',    title:'Diamond Holder', desc:'Hold 100+ $SVRN for 30 days to unlock Diamond tier',      emoji:'💎', reward:'Diamond Badge + 35% APY',   color:'#818cf8', action:'Buy Tokens',  actionUrl:'/profile/sovereign_v/invest', progress:50, progressMax:100, progressLabel:'50 / 100 $SVRN' },
]

const TYPE_LABELS: Record<string, string> = { all:'All', staking:'Staking', referral:'Referral', content:'Content', engagement:'Engage', trading:'Trading' }

export default function WalletEarnPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')

  const filtered = OPPORTUNITIES.filter(o => filter === 'all' || o.type === filter)
  const active = filtered.filter(o => !o.completed)
  const done = filtered.filter(o => o.completed)

  const totalApy = OPPORTUNITIES.filter(o => o.type === 'staking' && !o.completed).map(o => o.apy ?? 0)
  const highestApy = Math.max(...totalApy)

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
          <div>
            <div className="font-black text-white">Earn</div>
            <div className="text-xs text-white/30">Ways to grow your portfolio</div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {Object.entries(TYPE_LABELS).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === k ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Hero stat */}
        <div className="p-4 rounded-2xl border border-purple-500/20"
          style={{ background: 'rgba(168,85,247,0.06)' }}>
          <div className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Highest Available APY</div>
          <div className="text-4xl font-black" style={{ color: '#a855f7' }}>{highestApy}%</div>
          <div className="text-xs text-white/30 mt-0.5">Stake $SVRN Diamond tier</div>
        </div>

        {/* Active opportunities */}
        {active.length > 0 && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Available</div>
            <div className="space-y-2">
              {active.map(o => (
                <div key={o.id} className="rounded-2xl border border-white/4 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${o.color}12` }}>
                        {o.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm text-white/85">{o.title}</div>
                        <div className="text-xs text-white/35 mt-0.5">{o.desc}</div>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: `${o.color}18`, color: o.color }}>
                          🎁 {o.reward}
                        </div>
                      </div>
                    </div>
                    {o.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-white/25 mb-1">
                          <span>Progress</span>
                          <span>{o.progressLabel}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${(o.progress / o.progressMax!) * 100}%`, background: o.color }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-3">
                    <button onClick={() => router.push(o.actionUrl)}
                      className="w-full py-2.5 rounded-xl font-black text-sm"
                      style={{ background: o.color, color: '#04040A' }}>
                      {o.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {done.length > 0 && (
          <div>
            <div className="text-xs text-white/25 font-semibold uppercase tracking-wider mb-2">Completed</div>
            <div className="space-y-2 opacity-60">
              {done.map(o => (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
                  style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <span className="text-lg">{o.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white/50">{o.title}</div>
                    <div className="text-xs text-white/25">{o.reward}</div>
                  </div>
                  <span className="text-green-400 text-sm">✓</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
