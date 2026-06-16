'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type TxType = 'buy' | 'sell' | 'stake' | 'unstake' | 'tip_sent' | 'tip_received' | 'reward' | 'transfer'

interface Tx {
  id: string
  type: TxType
  qty: number
  price: number
  total: number
  fee?: number
  date: string
  ts: number
  from?: string
  to?: string
  note?: string
  status: 'confirmed' | 'pending' | 'failed'
}

const TOKEN_TXS: Record<string, { name: string; color: string; currentPrice: number; txs: Tx[] }> = {
  SVRN: {
    name:'Sovereign V', color:'#a855f7', currentPrice:8.75,
    txs: [
      { id:'t1',  type:'reward',       qty:1.42,  price:8.75,  total:12.43,  date:'Jun 16',  ts:1749945600, note:'Weekly staking reward',                     status:'confirmed' },
      { id:'t2',  type:'buy',          qty:10,    price:8.20,  total:82.00,  fee:0.82, date:'Jun 15', ts:1749859200, status:'confirmed' },
      { id:'t3',  type:'tip_received', qty:40,    price:8.50,  total:340.00, date:'Jun 14',  ts:1749772800, from:'atlas_k',                                   status:'confirmed' },
      { id:'t4',  type:'stake',        qty:25,    price:8.60,  total:215.00, date:'Jun 13',  ts:1749686400, note:'Silver tier (14% APY)',                     status:'confirmed' },
      { id:'t5',  type:'buy',          qty:15,    price:7.90,  total:118.50, fee:1.19, date:'Jun 11', ts:1749513600, status:'confirmed' },
      { id:'t6',  type:'sell',         qty:5,     price:8.80,  total:44.00,  fee:0.44, date:'Jun 10', ts:1749427200, status:'confirmed' },
      { id:'t7',  type:'tip_sent',     qty:10,    price:8.40,  total:84.00,  date:'Jun 9',   ts:1749340800, to:'mayafit', note:'Great content!',              status:'confirmed' },
      { id:'t8',  type:'reward',       qty:1.38,  price:8.20,  total:11.32,  date:'Jun 9',   ts:1749340800, note:'Weekly staking reward',                     status:'confirmed' },
      { id:'t9',  type:'unstake',      qty:10,    price:8.10,  total:81.00,  date:'Jun 5',   ts:1748995200, note:'Early unstake — lock expired',              status:'confirmed' },
      { id:'t10', type:'transfer',     qty:5,     price:7.80,  total:39.00,  date:'Jun 3',   ts:1748822400, to:'jade_l',  note:'Gift',                        status:'confirmed' },
      { id:'t11', type:'buy',          qty:20,    price:6.50,  total:130.00, fee:1.30, date:'May 28', ts:1748390400, status:'confirmed' },
      { id:'t12', type:'buy',          qty:5,     price:6.20,  total:31.00,  fee:0.31, date:'May 20', ts:1747785600, status:'confirmed' },
    ]
  },
  MAYA: {
    name:'Maya Chen', color:'#22c55e', currentPrice:5.20,
    txs: [
      { id:'u1', type:'buy',     qty:30,   price:5.10,  total:153.00, fee:1.53, date:'Jun 12', ts:1749686400, status:'confirmed' },
      { id:'u2', type:'stake',   qty:80,   price:5.00,  total:400.00, date:'Jun 10', ts:1749427200, note:'Gold tier (22% APY)', status:'confirmed' },
      { id:'u3', type:'reward',  qty:0.92, price:5.20,  total:4.78,   date:'Jun 9',  ts:1749340800, note:'Staking reward',      status:'confirmed' },
      { id:'u4', type:'buy',     qty:50,   price:4.40,  total:220.00, fee:2.20, date:'May 15', ts:1747353600, status:'confirmed' },
    ]
  },
  JAX: {
    name:'Jax Beats', color:'#ec4899', currentPrice:3.80,
    txs: [
      { id:'j1', type:'buy',  qty:100, price:1.90, total:190.00, fee:1.90, date:'Apr 10', ts:1744243200, status:'confirmed' },
      { id:'j2', type:'sell', qty:50,  price:3.20, total:160.00, fee:1.60, date:'May 20', ts:1747785600, status:'confirmed' },
    ]
  }
}

const TYPE_ICON: Record<TxType, string>  = { buy:'↓', sell:'↑', stake:'🔒', unstake:'🔓', tip_sent:'💸', tip_received:'💰', reward:'⭐', transfer:'→' }
const TYPE_LABEL: Record<TxType, string> = { buy:'Bought', sell:'Sold', stake:'Staked', unstake:'Unstaked', tip_sent:'Tip Sent', tip_received:'Tip Received', reward:'Reward', transfer:'Transfer' }
const TYPE_COLOR: Record<TxType, string> = {
  buy:'#22c55e', sell:'#f87171', stake:'#f59e0b', unstake:'#94a3b8',
  tip_sent:'#ec4899', tip_received:'#22c55e', reward:'#f59e0b', transfer:'#818cf8'
}
const TYPE_SIGN: Record<TxType, string>  = { buy:'-', sell:'+', stake:'', unstake:'', tip_sent:'-', tip_received:'+', reward:'+', transfer:'' }

export default function TokenTransactionsPage() {
  const router = useRouter()
  const params = useParams()
  const symbol   = typeof params.symbol === 'string' ? params.symbol : 'SVRN'
  const token    = TOKEN_TXS[symbol] ?? TOKEN_TXS.SVRN
  const accent   = token.color

  const [filter, setFilter] = useState<'all' | TxType>('all')

  const visible = token.txs.filter(t => filter === 'all' || t.type === filter)

  const totalIn  = token.txs.filter(t => ['buy','tip_received','reward'].includes(t.type)).reduce((s, t) => s + t.total, 0)
  const totalOut = token.txs.filter(t => ['sell','tip_sent'].includes(t.type)).reduce((s, t) => s + t.total, 0)
  const totalFees= token.txs.reduce((s, t) => s + (t.fee ?? 0), 0)

  const FILTERS = [
    { key:'all', label:'All' },
    { key:'buy', label:'Buys' },
    { key:'sell', label:'Sells' },
    { key:'stake', label:'Staking' },
    { key:'reward', label:'Rewards' },
    { key:'tip_received', label:'Tips In' },
  ] as const

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
            <div className="font-black text-white">${symbol} Transactions</div>
            <div className="text-xs text-white/30">{token.name} · {token.txs.length} records</div>
          </div>
          <div className="font-black text-sm" style={{ color: accent }}>${token.currentPrice}</div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f.key ? { background: accent, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Total In',  value:`$${totalIn.toFixed(0)}`,  color:'#22c55e' },
            { label:'Total Out', value:`$${totalOut.toFixed(0)}`, color:'#f87171' },
            { label:'Fees',      value:`$${totalFees.toFixed(2)}`,color:'rgba(255,255,255,0.3)' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tx list */}
        <div className="space-y-2">
          {visible.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${TYPE_COLOR[tx.type]}10`, color: TYPE_COLOR[tx.type] }}>
                {TYPE_ICON[tx.type]}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white/80">{TYPE_LABEL[tx.type]} {tx.qty} ${symbol}</div>
                <div className="text-xs text-white/25">
                  {tx.date}
                  {tx.from && ` · from @${tx.from}`}
                  {tx.to   && ` · to @${tx.to}`}
                  {tx.note && ` · ${tx.note}`}
                </div>
              </div>
              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm" style={{ color: TYPE_COLOR[tx.type] }}>
                  {TYPE_SIGN[tx.type]}${tx.total.toFixed(0)}
                </div>
                {tx.fee && <div className="text-xs text-white/20">fee ${tx.fee}</div>}
              </div>
            </div>
          ))}
          {visible.length === 0 && <div className="text-center py-10 text-white/25">No transactions</div>}
        </div>
      </div>
    </div>
  )
}
