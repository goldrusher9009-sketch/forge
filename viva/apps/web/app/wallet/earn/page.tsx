'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EarnOpportunity {
  id: string
  title: string
  description: string
  icon: string
  color: string
  apy?: number
  apyRange?: [number, number]
  category: 'staking' | 'referral' | 'content' | 'liquidity' | 'ads'
  action: string
  route: string
  active: boolean
  earned?: number
  badge?: string
}

const OPPORTUNITIES: EarnOpportunity[] = [
  {
    id:'e1', title:'Stake Creator Tokens',  icon:'🔒', color:'#a855f7', category:'staking',
    description:'Lock tokens for 30–90 days and earn 8–35% APY based on tier.',
    apyRange:[8,35], action:'Stake Now', route:'/staking', active:true, earned:181.2, badge:'Most Popular',
  },
  {
    id:'e2', title:'Referral Program',      icon:'🔗', color:'#22c55e', category:'referral',
    description:'Earn 5% of your referrals\' trading fees forever. +2% if they reach Gold.',
    apy:5, action:'Invite Friends', route:'/referrals/dashboard', active:true, earned:62.5,
  },
  {
    id:'e3', title:'Creator Content Boost', icon:'📣', color:'#f59e0b', category:'content',
    description:'Boost creator posts with tokens and earn a share of the engagement rewards.',
    apyRange:[3,12], action:'Boost Content', route:'/feed', active:true, earned:18.4,
  },
  {
    id:'e4', title:'Ads Revenue Share',     icon:'📊', color:'#818cf8', category:'ads',
    description:'Token holders earn a share of ad revenue from creators they hold.',
    apy:2, action:'View Ads', route:'/advertise', active:true, earned:8.9, badge:'New',
  },
  {
    id:'e5', title:'Liquidity Provision',   icon:'💧', color:'#ec4899', category:'liquidity',
    description:'Provide USDC/creator token liquidity to earn swap fees.',
    apyRange:[15,40], action:'Add Liquidity', route:'/swap', active:false, badge:'Coming Soon',
  },
]

const CAT_LABEL: Record<string, string> = {
  staking:'Staking', referral:'Referral', content:'Content', liquidity:'Liquidity', ads:'Ads Revenue',
}

type Filter = 'all' | 'staking' | 'referral' | 'content' | 'ads' | 'liquidity'

export default function WalletEarnPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')

  const opps = OPPORTUNITIES.filter(o => filter === 'all' || o.category === filter)
  const totalEarned = OPPORTUNITIES.reduce((s, o) => s + (o.earned ?? 0), 0)

  const FILTERS: Filter[] = ['all', 'staking', 'referral', 'content', 'ads', 'liquidity']

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
            <div className="font-black text-white">Earn</div>
            <div className="text-xs text-white/30">Passive income on VIVA</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Total earned hero */}
        <div className="p-5 rounded-2xl text-center" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
          <div className="text-xs text-white/30 mb-1">Total earned this month</div>
          <div className="text-4xl font-black" style={{ color: '#a855f7' }}>${totalEarned.toFixed(2)}</div>
          <div className="text-xs text-white/25 mt-1">Across all earning methods</div>
        </div>

        {/* APY range banner */}
        <div className="flex gap-2">
          {[
            { label:'Max APY',    value:'40%',   color:'#22c55e' },
            { label:'Active',     value: `${OPPORTUNITIES.filter(o=>o.active).length}`,     color:'#a855f7' },
            { label:'My Methods', value:'3',      color:'#f59e0b' },
          ].map(s => (
            <div key={s.label} className="flex-1 p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-base" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 capitalize"
              style={filter === f ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : CAT_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Opportunities */}
        <div className="space-y-3">
          {opps.map(opp => (
            <div key={opp.id} className="p-4 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.018)', opacity: opp.active ? 1 : 0.5 }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${opp.color}15` }}>
                  {opp.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-black text-sm text-white/85">{opp.title}</span>
                    {opp.badge && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: opp.badge === 'Coming Soon' ? 'rgba(255,255,255,0.06)' : `${opp.color}20`, color: opp.badge === 'Coming Soon' ? 'rgba(255,255,255,0.3)' : opp.color }}>
                        {opp.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/35">{opp.description}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="font-black text-sm" style={{ color: opp.color }}>
                    {opp.apy ? `${opp.apy}%` : `${opp.apyRange![0]}–${opp.apyRange![1]}%`}
                  </div>
                  <div className="text-xs text-white/25">APY</div>
                </div>
                {opp.earned != null && (
                  <div className="flex-1 p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="font-black text-sm" style={{ color: '#22c55e' }}>${opp.earned.toFixed(1)}</div>
                    <div className="text-xs text-white/25">Earned</div>
                  </div>
                )}
              </div>

              <button onClick={() => opp.active && router.push(opp.route)} disabled={!opp.active}
                className="w-full py-2.5 rounded-xl font-black text-sm disabled:opacity-30"
                style={{ background: opp.active ? opp.color : 'rgba(255,255,255,0.05)', color: '#04040A' }}>
                {opp.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
