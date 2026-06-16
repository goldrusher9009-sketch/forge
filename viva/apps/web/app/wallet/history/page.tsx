'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TxType = 'all' | 'deposit' | 'withdraw' | 'buy' | 'sell' | 'stake' | 'earn' | 'ad_revenue'

const TX_TYPES: { id: TxType; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'deposit',    label: 'Deposits' },
  { id: 'withdraw',   label: 'Withdrawals' },
  { id: 'buy',        label: 'Bought' },
  { id: 'sell',       label: 'Sold' },
  { id: 'stake',      label: 'Staked' },
  { id: 'earn',       label: 'Earned' },
  { id: 'ad_revenue', label: 'Ad Revenue' },
]

interface Tx {
  id: string
  type: TxType
  title: string
  subtitle: string
  amount: number
  ts: string
  status: 'completed' | 'pending' | 'failed'
  txHash?: string
}

const MOCK_TXS: Tx[] = [
  { id: 't1',  type: 'earn',       title: 'Staking reward',         subtitle: '$SVRN Diamond tier',       amount: +42.80,  ts: '2026-06-16T09:12:00Z', status: 'completed' },
  { id: 't2',  type: 'ad_revenue', title: 'Ad revenue payout',      subtitle: 'Acme Corp campaign',       amount: +128.50, ts: '2026-06-16T06:00:00Z', status: 'completed' },
  { id: 't3',  type: 'buy',        title: 'Bought $MAYA',           subtitle: '15 tokens @ $6.20',        amount: -93.00,  ts: '2026-06-15T22:45:00Z', status: 'completed' },
  { id: 't4',  type: 'earn',       title: 'Referral bonus',         subtitle: '5 new signups',             amount: +25.00,  ts: '2026-06-15T18:30:00Z', status: 'completed' },
  { id: 't5',  type: 'sell',       title: 'Sold $JAX',             subtitle: '8 tokens @ $4.50',         amount: +36.00,  ts: '2026-06-15T14:00:00Z', status: 'completed' },
  { id: 't6',  type: 'stake',      title: 'Staked $SVRN',          subtitle: '50 tokens locked 90d',     amount: -0,      ts: '2026-06-14T20:00:00Z', status: 'completed' },
  { id: 't7',  type: 'deposit',    title: 'USDC deposit',           subtitle: 'from Coinbase',            amount: +500.00, ts: '2026-06-14T10:00:00Z', status: 'completed', txHash: '0xabc123' },
  { id: 't8',  type: 'withdraw',   title: 'Bank withdrawal',        subtitle: 'Chase ••4421',             amount: -200.00, ts: '2026-06-13T16:00:00Z', status: 'completed' },
  { id: 't9',  type: 'buy',        title: 'Bought $SVRN',          subtitle: '10 tokens @ $8.40',        amount: -84.00,  ts: '2026-06-12T11:30:00Z', status: 'completed' },
  { id: 't10', type: 'earn',       title: 'Staking reward',         subtitle: '$SVRN Gold tier',          amount: +18.60,  ts: '2026-06-09T09:00:00Z', status: 'completed' },
  { id: 't11', type: 'ad_revenue', title: 'Ad revenue payout',      subtitle: 'NovaTech campaign',        amount: +74.20,  ts: '2026-06-07T06:00:00Z', status: 'completed' },
  { id: 't12', type: 'withdraw',   title: 'USDC withdrawal',        subtitle: 'MetaMask 0x9f…',           amount: -150.00, ts: '2026-06-05T14:00:00Z', status: 'pending' },
  { id: 't13', type: 'buy',        title: 'Bought $MAYA',           subtitle: '5 tokens @ $5.90',         amount: -29.50,  ts: '2026-06-03T09:00:00Z', status: 'completed' },
  { id: 't14', type: 'deposit',    title: 'PayPal deposit',         subtitle: 'via PayPal',               amount: +100.00, ts: '2026-05-30T12:00:00Z', status: 'completed' },
  { id: 't15', type: 'sell',       title: 'Sold $SVRN',            subtitle: '3 tokens @ $8.10',         amount: +24.30,  ts: '2026-05-28T17:00:00Z', status: 'failed' },
]

const TYPE_META: Record<string, { icon: string; color: string }> = {
  earn:       { icon: '🏆', color: '#22c55e' },
  ad_revenue: { icon: '📢', color: '#a855f7' },
  buy:        { icon: '🛒', color: '#f87171' },
  sell:       { icon: '💸', color: '#22c55e' },
  stake:      { icon: '🔒', color: '#818cf8' },
  deposit:    { icon: '⬇️', color: '#22c55e' },
  withdraw:   { icon: '⬆️', color: '#f59e0b' },
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  completed: { label: 'Done',    color: '#22c55e' },
  pending:   { label: 'Pending', color: '#f59e0b' },
  failed:    { label: 'Failed',  color: '#f87171' },
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function WalletHistoryPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<TxType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = MOCK_TXS.filter(t => filter === 'all' || t.type === filter)

  // Group by date label
  const groups: Record<string, Tx[]> = {}
  filtered.forEach(tx => {
    const d = new Date(tx.ts)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(tx)
  })

  const totalEarned = MOCK_TXS.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalSpent = MOCK_TXS.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white flex-1">Transaction History</div>
        </div>

        {/* Summary strip */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <div className="text-xs text-white/30 mb-0.5">Total In</div>
            <div className="font-black text-sm" style={{ color: '#22c55e' }}>+${totalEarned.toFixed(2)}</div>
          </div>
          <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.12)' }}>
            <div className="text-xs text-white/30 mb-0.5">Total Out</div>
            <div className="font-black text-sm" style={{ color: '#f87171' }}>-${totalSpent.toFixed(2)}</div>
          </div>
          <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.12)' }}>
            <div className="text-xs text-white/30 mb-0.5">Net</div>
            <div className="font-black text-sm" style={{ color: '#a855f7' }}>
              {totalEarned - totalSpent >= 0 ? '+' : ''}{(totalEarned - totalSpent).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {TX_TYPES.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={filter === t.id
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-3 space-y-6">
        {Object.entries(groups).map(([dateLabel, txs]) => (
          <div key={dateLabel}>
            <div className="text-xs text-white/25 uppercase tracking-widest mb-2">{dateLabel}</div>
            <div className="space-y-1">
              {txs.map(tx => {
                const meta = TYPE_META[tx.type] ?? { icon: '💱', color: '#818cf8' }
                const statusStyle = STATUS_STYLES[tx.status]
                const expanded = expandedId === tx.id
                return (
                  <button key={tx.id} onClick={() => setExpandedId(expanded ? null : tx.id)}
                    className="w-full text-left p-3 rounded-2xl border border-white/4 transition-all hover:border-white/8"
                    style={{ background: 'rgba(255,255,255,0.018)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}20` }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white/80 truncate">{tx.title}</div>
                        <div className="text-xs text-white/30 truncate">{tx.subtitle}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-black text-sm"
                          style={{ color: tx.amount > 0 ? '#22c55e' : tx.amount < 0 ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                          {tx.amount > 0 ? '+' : tx.amount < 0 ? '' : ''}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                        <div className="text-xs font-bold" style={{ color: statusStyle.color }}>{statusStyle.label}</div>
                      </div>
                    </div>
                    {expanded && (
                      <div className="mt-3 pt-3 border-t border-white/6 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">Time</span>
                          <span className="text-white/60">{fmt(tx.ts)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">Type</span>
                          <span className="text-white/60 capitalize">{tx.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">Status</span>
                          <span style={{ color: statusStyle.color }}>{statusStyle.label}</span>
                        </div>
                        {tx.txHash && (
                          <div className="flex justify-between text-xs">
                            <span className="text-white/30">Tx Hash</span>
                            <span className="text-white/50 font-mono">{tx.txHash}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">ID</span>
                          <span className="text-white/30 font-mono">{tx.id}</span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/20">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-sm">No transactions found</div>
          </div>
        )}
      </div>
    </div>
  )
}
