'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TxType = 'buy' | 'sell' | 'stake' | 'unstake' | 'tip_sent' | 'tip_recv' | 'reward' | 'deposit' | 'withdraw' | 'ad_spend'

interface Tx {
  id: string
  type: TxType
  symbol?: string
  color?: string
  qty?: number
  price?: number
  amount: number
  currency: string
  counterparty?: string
  ts: string
  date: string
  status: 'confirmed' | 'pending' | 'failed'
  hash?: string
}

const TX_META: Record<TxType, { icon: string; label: string; sign: '+' | '-' | '' }> = {
  buy:       { icon: '↓',  label: 'Bought',      sign: '-' },
  sell:      { icon: '↑',  label: 'Sold',        sign: '+' },
  stake:     { icon: '🔒', label: 'Staked',      sign: '-' },
  unstake:   { icon: '🔓', label: 'Unstaked',    sign: '+' },
  tip_sent:  { icon: '💸', label: 'Tip Sent',    sign: '-' },
  tip_recv:  { icon: '💰', label: 'Tip Received',sign: '+' },
  reward:    { icon: '🎁', label: 'Reward',      sign: '+' },
  deposit:   { icon: '📥', label: 'Deposit',     sign: '+' },
  withdraw:  { icon: '📤', label: 'Withdraw',    sign: '-' },
  ad_spend:  { icon: '📣', label: 'Ad Spend',    sign: '-' },
}

const TRANSACTIONS: Tx[] = [
  { id: 'tx1',  type: 'deposit',   amount: 500,   currency: 'USDC', ts: '2h',  date: 'Jun 16', status: 'confirmed', hash: '0x1a2b' },
  { id: 'tx2',  type: 'buy',       symbol: 'SVRN', color: '#a855f7', qty: 10,  price: 8.75, amount: 87.50,  currency: 'USDC', ts: '3h',  date: 'Jun 16', status: 'confirmed', hash: '0x3c4d' },
  { id: 'tx3',  type: 'stake',     symbol: 'MAYA', color: '#22c55e', qty: 20,  price: 5.20, amount: 104,    currency: 'USDC', ts: '5h',  date: 'Jun 16', status: 'confirmed' },
  { id: 'tx4',  type: 'tip_recv',  counterparty: 'atlas_k', amount: 50, currency: 'USDC', ts: '8h',  date: 'Jun 15', status: 'confirmed' },
  { id: 'tx5',  type: 'reward',    symbol: 'SVRN', color: '#a855f7', amount: 12.40, currency: 'USDC', ts: '1d',  date: 'Jun 15', status: 'confirmed' },
  { id: 'tx6',  type: 'buy',       symbol: 'MAYA', color: '#22c55e', qty: 15,  price: 5.10, amount: 76.50,  currency: 'USDC', ts: '2d',  date: 'Jun 14', status: 'confirmed', hash: '0x5e6f' },
  { id: 'tx7',  type: 'tip_sent',  counterparty: 'mayafit', amount: 30, currency: 'USDC', ts: '2d',  date: 'Jun 14', status: 'confirmed' },
  { id: 'tx8',  type: 'sell',      symbol: 'SVRN', color: '#a855f7', qty: 5,   price: 7.80, amount: 39,     currency: 'USDC', ts: '3d',  date: 'Jun 13', status: 'confirmed', hash: '0x7g8h' },
  { id: 'tx9',  type: 'ad_spend',  amount: 150,   currency: 'USDC', ts: '4d',  date: 'Jun 12', status: 'confirmed' },
  { id: 'tx10', type: 'withdraw',  amount: 200,   currency: 'USDC', ts: '5d',  date: 'Jun 11', status: 'confirmed', hash: '0x9i0j' },
  { id: 'tx11', type: 'reward',    symbol: 'MAYA', color: '#22c55e', amount: 8.90,  currency: 'USDC', ts: '5d',  date: 'Jun 11', status: 'confirmed' },
  { id: 'tx12', type: 'deposit',   amount: 1000,  currency: 'USDC', ts: '6d',  date: 'Jun 10', status: 'confirmed', hash: '0xabcd' },
  { id: 'tx13', type: 'buy',       symbol: 'JAX',  color: '#ec4899', qty: 50,  price: 3.40, amount: 170,    currency: 'USDC', ts: '7d',  date: 'Jun 09', status: 'confirmed', hash: '0xef12' },
  { id: 'tx14', type: 'unstake',   symbol: 'SVRN', color: '#a855f7', qty: 10,  price: 8.50, amount: 85,     currency: 'USDC', ts: '8d',  date: 'Jun 08', status: 'failed' },
]

type FilterType = 'all' | TxType

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'buy',      label: 'Buys'     },
  { key: 'sell',     label: 'Sells'    },
  { key: 'stake',    label: 'Stakes'   },
  { key: 'tip_recv', label: 'Tips In'  },
  { key: 'tip_sent', label: 'Tips Out' },
  { key: 'reward',   label: 'Rewards'  },
  { key: 'deposit',  label: 'Deposits' },
  { key: 'withdraw', label: 'Withdraws'},
]

const STATUS_COLOR: Record<string, string> = { confirmed: '#22c55e', pending: '#f59e0b', failed: '#f87171' }

export default function WalletHistoryPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = filter === 'all' ? TRANSACTIONS : TRANSACTIONS.filter(t => t.type === filter)

  const totalIn = TRANSACTIONS.filter(t => TX_META[t.type].sign === '+').reduce((a, t) => a + t.amount, 0)
  const totalOut = TRANSACTIONS.filter(t => TX_META[t.type].sign === '-').reduce((a, t) => a + t.amount, 0)

  // Group by date
  const dates = [...new Set(filtered.map(t => t.date))]

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
            <div className="text-xs text-white/30">{TRANSACTIONS.length} transactions</div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-base" style={{ color: '#22c55e' }}>+${totalIn.toFixed(0)}</div>
            <div className="text-xs text-white/25">Total In</div>
          </div>
          <div className="p-2.5 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-base" style={{ color: '#f87171' }}>-${totalOut.toFixed(0)}</div>
            <div className="text-xs text-white/25">Total Out</div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_OPTIONS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f.key ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {dates.map(date => {
          const dayTxs = filtered.filter(t => t.date === date)
          return (
            <div key={date}>
              <div className="text-xs text-white/25 font-semibold uppercase tracking-wider mb-2">{date}</div>
              <div className="space-y-2">
                {dayTxs.map(tx => {
                  const meta = TX_META[tx.type]
                  const isExp = expanded[tx.id]
                  return (
                    <button key={tx.id} onClick={() => setExpanded(prev => ({ ...prev, [tx.id]: !prev[tx.id] }))}
                      className="w-full p-3 rounded-2xl border border-white/4 text-left"
                      style={{ background: 'rgba(255,255,255,0.015)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: tx.color ? `${tx.color}15` : 'rgba(255,255,255,0.06)', color: tx.color ?? 'rgba(255,255,255,0.5)' }}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-white/75">
                            {meta.label}{tx.symbol ? ` $${tx.symbol}` : ''}{tx.counterparty ? ` @${tx.counterparty}` : ''}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white/25">{tx.ts}</span>
                            {tx.status !== 'confirmed' && (
                              <span className="text-xs font-bold" style={{ color: STATUS_COLOR[tx.status] }}>● {tx.status}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-black text-sm" style={{ color: meta.sign === '+' ? '#22c55e' : meta.sign === '-' ? '#f87171' : 'rgba(255,255,255,0.6)' }}>
                            {meta.sign}${tx.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-white/25">{tx.currency}</div>
                        </div>
                      </div>
                      {isExp && (
                        <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                          {tx.qty && <div className="flex justify-between text-xs"><span className="text-white/30">Quantity</span><span className="text-white/50">{tx.qty} tokens @ ${tx.price}</span></div>}
                          {tx.hash && <div className="flex justify-between text-xs"><span className="text-white/30">Tx Hash</span><span className="text-white/50 font-mono">{tx.hash}…</span></div>}
                          <div className="flex justify-between text-xs"><span className="text-white/30">Status</span><span className="font-bold" style={{ color: STATUS_COLOR[tx.status] }}>{tx.status}</span></div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
