'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TxType   = 'buy' | 'sell' | 'stake' | 'unstake' | 'reward' | 'tip' | 'ad_revenue' | 'transfer'
type TxFilter = 'all' | 'buys' | 'sells' | 'rewards' | 'tips'

interface Transaction {
  id: string; type: TxType; symbol?: string; color?: string
  amount: number; usdValue: number; qty?: number
  from?: string; to?: string; ts: string; status: 'confirmed' | 'pending' | 'failed'
}

const TRANSACTIONS: Transaction[] = [
  { id:'t1',  type:'reward',     symbol:'SVRN', color:'#a855f7', amount:12.40,  usdValue:108.5, ts:'2026-06-15T14:00:00Z', status:'confirmed', from:'staking'   },
  { id:'t2',  type:'buy',        symbol:'MAYA', color:'#22c55e', amount:-52.00, usdValue:52.0,  qty:10, from:'market',       ts:'2026-06-15T10:30:00Z', status:'confirmed' },
  { id:'t3',  type:'tip',        symbol:'USDC', color:'#818cf8', amount:100.00, usdValue:100.0, ts:'2026-06-14T18:00:00Z', status:'confirmed', from:'noa_d'      },
  { id:'t4',  type:'sell',       symbol:'JAX',  color:'#ec4899', amount:38.00,  usdValue:38.0,  qty:10, to:'market',         ts:'2026-06-14T12:00:00Z', status:'confirmed' },
  { id:'t5',  type:'stake',      symbol:'SVRN', color:'#a855f7', amount:0,      usdValue:437.5, qty:50, from:'wallet',       ts:'2026-06-13T09:00:00Z', status:'confirmed' },
  { id:'t6',  type:'ad_revenue', symbol:'USDC', color:'#22c55e', amount:84.20,  usdValue:84.2,  ts:'2026-06-12T20:00:00Z', status:'confirmed', from:'platform'   },
  { id:'t7',  type:'buy',        symbol:'SVRN', color:'#a855f7', amount:-87.50, usdValue:87.5,  qty:10, from:'market',       ts:'2026-06-10T08:00:00Z', status:'confirmed' },
  { id:'t8',  type:'reward',     symbol:'SVRN', color:'#a855f7', amount:8.90,   usdValue:77.9,  ts:'2026-06-08T14:00:00Z', status:'confirmed', from:'staking'    },
  { id:'t9',  type:'transfer',   symbol:'USDC', color:'#818cf8', amount:-250.0, usdValue:250.0, ts:'2026-06-07T11:00:00Z', status:'confirmed', to:'luna_w'       },
  { id:'t10', type:'tip',        symbol:'USDC', color:'#818cf8', amount:25.00,  usdValue:25.0,  ts:'2026-06-06T16:00:00Z', status:'confirmed', from:'kai_r'      },
]

const TX_ICONS:  Record<TxType,string> = { buy:'↓', sell:'↑', stake:'🔒', unstake:'🔓', reward:'✨', tip:'💸', ad_revenue:'📢', transfer:'→' }
const TX_LABELS: Record<TxType,string> = { buy:'Bought', sell:'Sold', stake:'Staked', unstake:'Unstaked', reward:'Staking Reward', tip:'Tip Received', ad_revenue:'Ad Revenue', transfer:'Transfer' }

function isPos(tx: Transaction) { return ['reward','tip','ad_revenue','sell'].includes(tx.type) }
function fmtDate(iso: string)   { return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' }) }

export default function WalletHistoryPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<TxFilter>('all')

  const filtered = TRANSACTIONS.filter(tx => {
    if (filter === 'buys')    return tx.type === 'buy'
    if (filter === 'sells')   return tx.type === 'sell'
    if (filter === 'rewards') return tx.type === 'reward' || tx.type === 'ad_revenue'
    if (filter === 'tips')    return tx.type === 'tip'
    return true
  })

  const totalIn  = TRANSACTIONS.filter(isPos).reduce((a,t) => a + t.usdValue, 0)
  const totalOut = TRANSACTIONS.filter(t => !isPos(t)).reduce((a,t) => a + t.usdValue, 0)

  const FILTERS: { key: TxFilter; label: string }[] = [
    { key:'all', label:'All' }, { key:'buys', label:'Buys' },
    { key:'sells', label:'Sells' }, { key:'rewards', label:'Rewards' }, { key:'tips', label:'Tips' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="font-black text-white">Transaction History</div>
            <div className="text-xs text-white/30">{TRANSACTIONS.length} transactions</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl border border-white/5 text-center" style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/25 mb-0.5">Total In</div>
            <div className="font-black text-lg" style={{ color:'#22c55e' }}>+${totalIn.toFixed(0)}</div>
          </div>
          <div className="p-3 rounded-xl border border-white/5 text-center" style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/25 mb-0.5">Total Out</div>
            <div className="font-black text-lg" style={{ color:'#f87171' }}>-${totalOut.toFixed(0)}</div>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f.key ? { background:'#a855f7', color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map(tx => {
            const pos = isPos(tx)
            return (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
                style={{ background:'rgba(255,255,255,0.015)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                  style={{ background: pos ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)', color: pos ? '#22c55e' : '#f87171' }}>
                  {TX_ICONS[tx.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white/75">
                    {TX_LABELS[tx.type]}{tx.qty ? ` ${tx.qty}` : ''}{tx.symbol ? ` $${tx.symbol}` : ''}
                  </div>
                  <div className="text-xs text-white/25">
                    {tx.from ? `from @${tx.from}` : tx.to ? `to @${tx.to}` : ''}{' '}{fmtDate(tx.ts)}
                    {tx.status === 'pending' && <span className="ml-1 text-amber-400">· pending</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-sm" style={{ color: pos ? '#22c55e' : '#f87171' }}>
                    {pos ? '+' : '-'}${Math.abs(tx.usdValue).toFixed(2)}
                  </div>
                  {tx.qty && <div className="text-xs" style={{ color: tx.color ?? 'rgba(255,255,255,0.25)' }}>{tx.qty} tokens</div>}
                </div>
              </div>
            )
          })}
        </div>

        <button className="w-full py-3 rounded-xl text-xs font-bold"
          style={{ background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.3)' }}>
          Export CSV →
        </button>
      </div>
    </div>
  )
}
