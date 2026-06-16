'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TxType = 'buy' | 'sell' | 'stake' | 'unstake' | 'tip' | 'reward' | 'transfer' | 'ad_spend'

interface Transaction {
  id: string
  type: TxType
  symbol: string
  symbolColor: string
  qty: number
  price: number
  total: number
  fee: number
  date: string
  ts: string
  status: 'confirmed' | 'pending' | 'failed'
  note?: string
}

const TX_DATA: Transaction[] = [
  { id:'t1',  type:'buy',      symbol:'SVRN', symbolColor:'#a855f7', qty:10,  price:8.75,  total:87.50,  fee:0.44, date:'Jun 15', ts:'14:32', status:'confirmed' },
  { id:'t2',  type:'reward',   symbol:'SVRN', symbolColor:'#a855f7', qty:0,   price:0,     total:12.40,  fee:0,    date:'Jun 15', ts:'08:00', status:'confirmed', note:'Staking reward' },
  { id:'t3',  type:'stake',    symbol:'MAYA', symbolColor:'#22c55e', qty:30,  price:5.20,  total:156.00, fee:0,    date:'Jun 14', ts:'19:11', status:'confirmed' },
  { id:'t4',  type:'sell',     symbol:'JAX',  symbolColor:'#ec4899', qty:5,   price:3.80,  total:19.00,  fee:0.10, date:'Jun 13', ts:'11:45', status:'confirmed' },
  { id:'t5',  type:'tip',      symbol:'SVRN', symbolColor:'#a855f7', qty:10,  price:8.75,  total:87.50,  fee:0,    date:'Jun 12', ts:'22:03', status:'confirmed', note:'Tip to @sovereign_v' },
  { id:'t6',  type:'buy',      symbol:'MAYA', symbolColor:'#22c55e', qty:50,  price:5.10,  total:255.00, fee:1.28, date:'Jun 11', ts:'09:17', status:'confirmed' },
  { id:'t7',  type:'reward',   symbol:'MAYA', symbolColor:'#22c55e', qty:0,   price:0,     total:8.90,   fee:0,    date:'Jun 10', ts:'08:00', status:'confirmed', note:'Staking reward' },
  { id:'t8',  type:'unstake',  symbol:'SVRN', symbolColor:'#a855f7', qty:20,  price:8.40,  total:168.00, fee:0,    date:'Jun 09', ts:'16:55', status:'confirmed' },
  { id:'t9',  type:'ad_spend', symbol:'USDC', symbolColor:'#818cf8', qty:0,   price:0,     total:250.00, fee:0,    date:'Jun 08', ts:'10:30', status:'confirmed', note:'Ad campaign: DeFi post' },
  { id:'t10', type:'buy',      symbol:'JAX',  symbolColor:'#ec4899', qty:50,  price:3.40,  total:170.00, fee:0.85, date:'Jun 07', ts:'13:22', status:'confirmed' },
  { id:'t11', type:'transfer', symbol:'USDC', symbolColor:'#818cf8', qty:0,   price:0,     total:500.00, fee:1.00, date:'Jun 05', ts:'08:45', status:'confirmed', note:'Deposit from wallet' },
  { id:'t12', type:'buy',      symbol:'SVRN', symbolColor:'#a855f7', qty:20,  price:7.80,  total:156.00, fee:0.78, date:'Jun 01', ts:'17:08', status:'confirmed' },
]

const TX_ICON: Record<TxType, string>  = { buy:'↓', sell:'↑', stake:'🔒', unstake:'🔓', tip:'💸', reward:'⭐', transfer:'↔', ad_spend:'📢' }
const TX_LABEL: Record<TxType, string> = { buy:'Buy', sell:'Sell', stake:'Stake', unstake:'Unstake', tip:'Tip', reward:'Reward', transfer:'Transfer', ad_spend:'Ad Spend' }
const TX_COLOR: Record<TxType, string> = {
  buy:'#22c55e', sell:'#f87171', stake:'#f59e0b', unstake:'#f59e0b',
  tip:'#ec4899', reward:'#818cf8', transfer:'rgba(255,255,255,0.4)', ad_spend:'#a855f7',
}
const TX_SIGN: Record<TxType, string>  = { buy:'-', sell:'+', stake:'', unstake:'', tip:'-', reward:'+', transfer:'+', ad_spend:'-' }

type FilterType = 'all' | TxType

export default function WalletHistoryPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const visible = TX_DATA.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase()) && !t.note?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalIn  = TX_DATA.filter(t => ['buy','reward','transfer','sell'].includes(t.type)).reduce((s,t) => s + t.total, 0)
  const totalOut = TX_DATA.filter(t => ['sell','tip','ad_spend'].includes(t.type)).reduce((s,t) => s + t.total, 0)
  const totalFees = TX_DATA.reduce((s,t) => s + t.fee, 0)

  const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key:'all', label:'All' },
    { key:'buy', label:'Buys' },
    { key:'sell', label:'Sells' },
    { key:'stake', label:'Stakes' },
    { key:'reward', label:'Rewards' },
    { key:'tip', label:'Tips' },
  ]

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
          <div className="flex-1">
            <div className="font-black text-white">Transaction History</div>
            <div className="text-xs text-white/30">{TX_DATA.length} transactions</div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === t.key ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Volume In',  value:`$${totalIn.toFixed(0)}`,   color:'#22c55e' },
            { label:'Volume Out', value:`$${totalOut.toFixed(0)}`,  color:'#f87171' },
            { label:'Fees Paid',  value:`$${totalFees.toFixed(2)}`, color:'rgba(255,255,255,0.3)' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by token or note…"
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />

        {/* Tx list */}
        <div className="space-y-2">
          {visible.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${TX_COLOR[tx.type]}12`, color: TX_COLOR[tx.type] }}>
                {TX_ICON[tx.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white/80">{TX_LABEL[tx.type]}</span>
                  <span className="font-black text-xs" style={{ color: tx.symbolColor }}>${tx.symbol}</span>
                </div>
                <div className="text-xs text-white/25">
                  {tx.note ?? (tx.qty > 0 ? `${tx.qty} × $${tx.price.toFixed(2)}` : '')}
                  {tx.fee > 0 && <span className="ml-1 text-white/15">fee ${tx.fee.toFixed(2)}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm" style={{ color: TX_COLOR[tx.type] }}>
                  {TX_SIGN[tx.type]}${tx.total.toFixed(2)}
                </div>
                <div className="text-xs text-white/20">{tx.date} {tx.ts}</div>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="text-center py-12 text-white/25">No transactions match</div>
          )}
        </div>
      </div>
    </div>
  )
}
