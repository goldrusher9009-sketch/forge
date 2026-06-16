'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type EarnType = 'staking' | 'referral' | 'content' | 'rewards'

interface EarnItem {
  id: string
  type: EarnType
  title: string
  desc: string
  icon: string
  color: string
  earned: number
  pending: number
  claimable: boolean
  apy?: number
}

const EARN_ITEMS: EarnItem[] = [
  { id:'e1', type:'staking',  title:'SVRN Gold Staking',       desc:'50 tokens staked @ 22% APY',              icon:'🔒', color:'#f59e0b', earned:184.20, pending:12.40, claimable:true,  apy:22 },
  { id:'e2', type:'staking',  title:'MAYA Bronze Staking',     desc:'30 tokens staked @ 8% APY',               icon:'🔒', color:'#22c55e', earned:62.40,  pending:4.80,  claimable:true,  apy:8  },
  { id:'e3', type:'referral', title:'Referral Bonus',          desc:'5 active referrals · next tier at 6',     icon:'🎁', color:'#a855f7', earned:100.00, pending:25.00, claimable:true         },
  { id:'e4', type:'content',  title:'Content Creator Rewards', desc:'Your posts earned 3.2% engagement bonus', icon:'🔥', color:'#ec4899', earned:48.80,  pending:0,     claimable:false        },
  { id:'e5', type:'rewards',  title:'Platform Reward Points',  desc:'1,240 VIVA points → $12.40',              icon:'⭐', color:'#818cf8', earned:32.00,  pending:12.40, claimable:true         },
]

const TYPE_LABEL: Record<EarnType, string> = { staking:'Staking', referral:'Referrals', content:'Content', rewards:'Rewards' }

export default function WalletEarnPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | EarnType>('all')
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimed,  setClaimed  ] = useState<Record<string, boolean>>({})

  const visible = EARN_ITEMS.filter(e => filter === 'all' || e.type === filter)

  const totalEarned  = EARN_ITEMS.reduce((s, e) => s + e.earned,  0)
  const totalPending = EARN_ITEMS.reduce((s, e) => s + e.pending, 0)
  const totalClaimable = EARN_ITEMS.filter(e => e.claimable && !claimed[e.id]).reduce((s, e) => s + e.pending, 0)

  async function claim(id: string) {
    setClaiming(id)
    await new Promise(r => setTimeout(r, 900))
    setClaiming(null)
    setClaimed(prev => ({ ...prev, [id]: true }))
  }

  async function claimAll() {
    const claimable = EARN_ITEMS.filter(e => e.claimable && !claimed[e.id])
    for (const e of claimable) {
      setClaiming(e.id)
      await new Promise(r => setTimeout(r, 400))
      setClaimed(prev => ({ ...prev, [e.id]: true }))
    }
    setClaiming(null)
  }

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
          <div className="flex-1 font-black text-white">Earn</div>
        </div>
        <div className="flex gap-1.5">
          {([['all','All'],['staking','Staking'],['referral','Referrals'],['content','Content'],['rewards','Rewards']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
              style={filter === k ? { background:'#f59e0b', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Summary */}
        <div className="p-4 rounded-2xl border" style={{ background:'rgba(245,158,11,0.05)', borderColor:'rgba(245,158,11,0.15)' }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Total Earned', value:`$${totalEarned.toFixed(0)}`, color:'#f59e0b' },
              { label:'Pending',      value:`$${totalPending.toFixed(0)}`, color:'rgba(255,255,255,0.5)' },
              { label:'Claimable',    value:`$${totalClaimable.toFixed(0)}`, color:'#22c55e' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-white/25">{s.label}</div>
              </div>
            ))}
          </div>
          {totalClaimable > 0 && (
            <button onClick={claimAll}
              className="mt-4 w-full py-3 rounded-xl font-black text-sm"
              style={{ background:'#22c55e', color:'#04040A' }}>
              Claim All ${totalClaimable.toFixed(0)} →
            </button>
          )}
        </div>

        {/* Earn items */}
        <div className="space-y-3">
          {visible.map(e => {
            const isClaimed = claimed[e.id]
            return (
              <div key={e.id} className="p-4 rounded-2xl border border-white/4"
                style={{ background:'rgba(255,255,255,0.018)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background:`${e.color}12` }}>
                    {e.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white/85">{e.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background:`${e.color}15`, color:e.color }}>{TYPE_LABEL[e.type]}</span>
                    </div>
                    <div className="text-xs text-white/30 mt-0.5">{e.desc}</div>
                    {e.apy && <div className="text-xs mt-0.5" style={{ color:'#22c55e' }}>{e.apy}% APY</div>}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div>
                    <div className="text-xs text-white/25">Earned</div>
                    <div className="font-black text-sm" style={{ color:e.color }}>${e.earned.toFixed(2)}</div>
                  </div>
                  {e.pending > 0 && (
                    <div>
                      <div className="text-xs text-white/25">Pending</div>
                      <div className="font-black text-sm text-white/50">${e.pending.toFixed(2)}</div>
                    </div>
                  )}
                  <div className="ml-auto">
                    {e.claimable && !isClaimed && e.pending > 0 ? (
                      <button onClick={() => claim(e.id)} disabled={!!claiming}
                        className="px-3 py-2 rounded-xl font-black text-xs disabled:opacity-40"
                        style={{ background:'#22c55e', color:'#04040A' }}>
                        {claiming === e.id ? '…' : `Claim $${e.pending.toFixed(0)}`}
                      </button>
                    ) : isClaimed ? (
                      <span className="text-xs font-bold" style={{ color:'#22c55e' }}>✓ Claimed</span>
                    ) : (
                      <span className="text-xs text-white/20">{e.pending > 0 ? 'Locked' : 'Up to date'}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* How to earn more */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-3" style={{ background:'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Earn More</div>
          {[
            { icon:'🔒', label:'Stake more tokens',  desc:'Up to 35% APY with Diamond tier', href:'/staking' },
            { icon:'🎁', label:'Refer a friend',     desc:'Earn $10–$25 USDC per referral',  href:'/referral' },
            { icon:'📝', label:'Post quality content',desc:'Earn engagement bonuses',        href:'/feed' },
          ].map(a => (
            <button key={a.href} onClick={() => router.push(a.href)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
              style={{ background:'rgba(255,255,255,0.03)' }}>
              <span className="text-xl">{a.icon}</span>
              <div>
                <div className="font-bold text-sm text-white/70">{a.label}</div>
                <div className="text-xs text-white/30">{a.desc}</div>
              </div>
              <span className="ml-auto text-white/20 text-sm">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
