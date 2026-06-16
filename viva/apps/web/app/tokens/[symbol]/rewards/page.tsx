'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKENS: Record<string, { name: string; color: string; stakedQty: number; apy: number; tier: string }> = {
  SVRN: { name: 'Sovereign V', color: '#a855f7', stakedQty: 50,  apy: 22, tier: 'Gold'    },
  MAYA: { name: 'Maya Chen',   color: '#22c55e', stakedQty: 80,  apy: 35, tier: 'Diamond' },
  JAX:  { name: 'Jax Beats',  color: '#ec4899', stakedQty: 25,  apy: 14, tier: 'Silver'  },
}

interface RewardEvent {
  id: string
  type: 'staking' | 'trading_fee' | 'referral' | 'bonus' | 'airdrop'
  amount: number
  ts: string
  note: string
}

const REWARDS: Record<string, RewardEvent[]> = {
  SVRN: [
    { id:'r1',  type:'staking',     amount:4.82,  ts:'2026-06-15', note:'Daily staking reward — Gold tier 22% APY' },
    { id:'r2',  type:'trading_fee', amount:1.24,  ts:'2026-06-14', note:'0.5% fee share from 248 SVRN traded'       },
    { id:'r3',  type:'staking',     amount:4.82,  ts:'2026-06-14', note:'Daily staking reward'                      },
    { id:'r4',  type:'referral',    amount:12.50, ts:'2026-06-13', note:'Referral bonus — @atlas_k joined'          },
    { id:'r5',  type:'staking',     amount:4.82,  ts:'2026-06-13', note:'Daily staking reward'                      },
    { id:'r6',  type:'bonus',       amount:25.00, ts:'2026-06-10', note:'30-day loyalty bonus'                      },
    { id:'r7',  type:'staking',     amount:4.82,  ts:'2026-06-10', note:'Daily staking reward'                      },
    { id:'r8',  type:'airdrop',     amount:50.00, ts:'2026-06-01', note:'Early holder airdrop — 1000+ SVRN'         },
    { id:'r9',  type:'trading_fee', amount:0.84,  ts:'2026-05-31', note:'0.5% fee share from 168 SVRN traded'       },
    { id:'r10', type:'staking',     amount:4.82,  ts:'2026-05-30', note:'Daily staking reward'                      },
  ],
}

const TYPE_COLOR: Record<string, string> = {
  staking:'#a855f7', trading_fee:'#22c55e', referral:'#f59e0b', bonus:'#818cf8', airdrop:'#ec4899',
}
const TYPE_ICON: Record<string, string>  = {
  staking:'🔒', trading_fee:'💸', referral:'🔗', bonus:'⭐', airdrop:'🪂',
}
const TYPE_LABEL: Record<string, string> = {
  staking:'Staking', trading_fee:'Fee Share', referral:'Referral', bonus:'Bonus', airdrop:'Airdrop',
}

type Filter = 'all' | 'staking' | 'trading_fee' | 'referral' | 'bonus' | 'airdrop'

export default function TokenRewardsPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const token  = TOKENS[symbol] ?? TOKENS.SVRN

  const [filter, setFilter] = useState<Filter>('all')
  const [claimed, setClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const events = (REWARDS[symbol] ?? REWARDS.SVRN).filter(r => filter === 'all' || r.type === filter)
  const total  = (REWARDS[symbol] ?? REWARDS.SVRN).reduce((s, r) => s + r.amount, 0)
  const pending = 48.52
  const dailyRate = (token.stakedQty * 8.75 * (token.apy / 100)) / 365

  async function claim() {
    setClaiming(true)
    await new Promise(r => setTimeout(r, 1200))
    setClaiming(false)
    setClaimed(true)
  }

  const FILTERS: Filter[] = ['all', 'staking', 'trading_fee', 'referral', 'bonus', 'airdrop']

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
          <div className="flex-1">
            <div className="font-black text-white">${symbol} Rewards</div>
            <div className="text-xs text-white/30">{token.name} · {token.tier}</div>
          </div>
          <button onClick={() => router.push(`/tokens/${symbol}/stake`)}
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: `${token.color}15`, color: token.color }}>
            Stake More
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Pending claim card */}
        <div className="p-4 rounded-2xl border"
          style={{ background: `${token.color}06`, borderColor: `${token.color}20` }}>
          <div className="text-xs text-white/30 mb-1">Pending rewards</div>
          <div className="text-3xl font-black" style={{ color: token.color }}>
            ${claimed ? '0.00' : pending.toFixed(2)}
          </div>
          <div className="text-xs text-white/25 mb-3">+${dailyRate.toFixed(2)}/day · {token.apy}% APY</div>
          <button onClick={() => !claimed && claim()} disabled={claimed || claiming}
            className="w-full py-2.5 rounded-xl font-black text-sm disabled:opacity-40"
            style={claimed ? { background: '#22c55e', color: '#04040A' } : { background: token.color, color: '#04040A' }}>
            {claiming ? 'Claiming…' : claimed ? '✓ Claimed!' : 'Claim All Rewards'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Total Earned', value:`$${total.toFixed(0)}`,         color: token.color    },
            { label:'Staked Qty',   value:`${token.stakedQty}`,           color: '#f59e0b'      },
            { label:'Daily Rate',   value:`$${dailyRate.toFixed(2)}`,     color: '#22c55e'      },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Type distribution */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-3">By Type</div>
          {(['staking','trading_fee','referral','bonus','airdrop'] as const).map(t => {
            const sum = (REWARDS[symbol] ?? REWARDS.SVRN).filter(r => r.type === t).reduce((s,r) => s+r.amount,0)
            const pct = (sum / total) * 100
            return (
              <div key={t} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: TYPE_COLOR[t] }}>{TYPE_ICON[t]} {TYPE_LABEL[t]}</span>
                  <span className="text-white/40">${sum.toFixed(2)} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TYPE_COLOR[t] }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 capitalize"
              style={filter === f ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : f === 'trading_fee' ? 'Fee Share' : TYPE_LABEL[f]}
            </button>
          ))}
        </div>

        {/* History */}
        <div className="space-y-2">
          {events.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${TYPE_COLOR[r.type]}15` }}>
                {TYPE_ICON[r.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold" style={{ color: TYPE_COLOR[r.type] }}>{TYPE_LABEL[r.type]}</div>
                <div className="text-xs text-white/25 truncate">{r.note}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm" style={{ color: '#22c55e' }}>+${r.amount.toFixed(2)}</div>
                <div className="text-xs text-white/20">{r.ts.slice(5)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
