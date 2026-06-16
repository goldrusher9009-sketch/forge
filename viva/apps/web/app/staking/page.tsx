'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StakeOpportunity {
  symbol: string
  creatorName: string
  color: string
  price: number
  change24h: number
  minStake: number
  apy: number
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
  totalStaked: number
  myBalance: number
  locked: boolean
}

const OPPORTUNITIES: StakeOpportunity[] = [
  { symbol:'SVRN', creatorName:'Sovereign V', color:'#a855f7', price:8.75,  change24h:4.2,  minStake:10,  apy:8,  tier:'Bronze',  totalStaked:48000, myBalance:50, locked:false },
  { symbol:'SVRN', creatorName:'Sovereign V', color:'#a855f7', price:8.75,  change24h:4.2,  minStake:25,  apy:14, tier:'Silver',  totalStaked:31000, myBalance:50, locked:false },
  { symbol:'SVRN', creatorName:'Sovereign V', color:'#a855f7', price:8.75,  change24h:4.2,  minStake:50,  apy:22, tier:'Gold',    totalStaked:18000, myBalance:50, locked:false },
  { symbol:'SVRN', creatorName:'Sovereign V', color:'#a855f7', price:8.75,  change24h:4.2,  minStake:100, apy:35, tier:'Diamond', totalStaked:8200,  myBalance:50, locked:true  },
  { symbol:'MAYA', creatorName:'Maya Chen',   color:'#22c55e', price:5.20,  change24h:-1.8, minStake:10,  apy:8,  tier:'Bronze',  totalStaked:22000, myBalance:80, locked:false },
  { symbol:'MAYA', creatorName:'Maya Chen',   color:'#22c55e', price:5.20,  change24h:-1.8, minStake:50,  apy:22, tier:'Gold',    totalStaked:9800,  myBalance:80, locked:false },
  { symbol:'MAYA', creatorName:'Maya Chen',   color:'#22c55e', price:5.20,  change24h:-1.8, minStake:100, apy:35, tier:'Diamond', totalStaked:4200,  myBalance:80, locked:false },
  { symbol:'JAX',  creatorName:'Jax Beats',  color:'#ec4899', price:3.80,  change24h:7.1,  minStake:10,  apy:8,  tier:'Bronze',  totalStaked:8400,  myBalance:0,  locked:false },
  { symbol:'JAX',  creatorName:'Jax Beats',  color:'#ec4899', price:3.80,  change24h:7.1,  minStake:25,  apy:14, tier:'Silver',  totalStaked:3200,  myBalance:0,  locked:false },
]

const TIER_COLOR: Record<string, string> = { Bronze:'#b45309', Silver:'#94a3b8', Gold:'#f59e0b', Diamond:'#818cf8' }
const TIER_EMOJI: Record<string, string> = { Bronze:'🥉', Silver:'🥈', Gold:'🥇', Diamond:'💎' }

type SortKey = 'apy' | 'tvl' | 'price'

export default function StakingPage() {
  const router = useRouter()
  const [sort,   setSort  ] = useState<SortKey>('apy')
  const [filter, setFilter] = useState<'all' | 'eligible'>('all')
  const [staking, setStaking] = useState<string | null>(null)
  const [staked,  setStaked ] = useState<Record<string, boolean>>({})

  const sorted = [...OPPORTUNITIES]
    .filter(o => filter === 'all' || o.myBalance >= o.minStake)
    .sort((a, b) => sort === 'apy' ? b.apy - a.apy : sort === 'tvl' ? b.totalStaked - a.totalStaked : b.price - a.price)

  const totalTVL = OPPORTUNITIES.reduce((s, o) => s + o.totalStaked * o.price, 0)

  async function stake(key: string) {
    setStaking(key)
    await new Promise(r => setTimeout(r, 1000))
    setStaking(null)
    setStaked(prev => ({ ...prev, [key]: true }))
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
          <div className="flex-1 font-black text-white">Staking</div>
          <button onClick={() => router.push('/wallet/staking')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            My Stakes
          </button>
        </div>
        <div className="flex gap-1.5">
          {([['apy','Best APY'],['tvl','Most Staked'],['price','Token Price']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setSort(k)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={sort === k ? { background: '#f59e0b', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* TVL hero */}
        <div className="p-4 rounded-2xl border" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}>
          <div className="text-xs text-amber-400/50 font-semibold uppercase tracking-wider">Total Value Locked</div>
          <div className="text-2xl font-black text-white mt-1">${(totalTVL/1000).toFixed(0)}k</div>
          <div className="text-xs text-white/25">{OPPORTUNITIES.length} staking pools across {new Set(OPPORTUNITIES.map(o=>o.symbol)).size} tokens</div>
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          {([['all','All Pools'],['eligible','I Can Stake']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={filter === k ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Pools */}
        <div className="space-y-3">
          {sorted.map(o => {
            const key = `${o.symbol}_${o.tier}`
            const eligible = o.myBalance >= o.minStake
            const isStaked = staked[key]
            return (
              <div key={key} className="p-4 rounded-2xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${o.color}15`, color: o.color }}>
                    {o.symbol[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm text-white/85">${o.symbol}</span>
                      <span className="text-xs" style={{ color: TIER_COLOR[o.tier] }}>{TIER_EMOJI[o.tier]} {o.tier}</span>
                    </div>
                    <div className="text-xs text-white/30">{o.creatorName} · {o.minStake}+ tokens required</div>
                  </div>
                  {/* APY badge */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-lg" style={{ color: '#22c55e' }}>{o.apy}%</div>
                    <div className="text-xs text-white/25">APY</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-white/25">
                  <span>TVL: {(o.totalStaked/1000).toFixed(0)}k tokens</span>
                  <span>${o.price} / token</span>
                  {o.change24h >= 0
                    ? <span style={{ color:'#22c55e' }}>+{o.change24h}%</span>
                    : <span style={{ color:'#f87171' }}>{o.change24h}%</span>}
                </div>

                {o.myBalance > 0 && (
                  <div className="mt-2 text-xs" style={{ color: eligible ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                    {eligible ? `✓ You hold ${o.myBalance} $${o.symbol} — eligible` : `You need ${o.minStake - o.myBalance} more $${o.symbol}`}
                  </div>
                )}

                <button
                  disabled={!eligible || !!staking || isStaked}
                  onClick={() => stake(key)}
                  className="mt-3 w-full py-2.5 rounded-xl font-black text-xs disabled:opacity-30"
                  style={isStaked
                    ? { background: '#22c55e', color: '#04040A' }
                    : { background: eligible ? o.color : 'rgba(255,255,255,0.06)',
                        color: eligible ? '#04040A' : 'rgba(255,255,255,0.25)' }}>
                  {isStaked ? '✓ Staked!' : staking === key ? 'Staking…' : eligible ? `Stake $${o.symbol} for ${o.apy}% APY` : `Need ${o.minStake} $${o.symbol}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
