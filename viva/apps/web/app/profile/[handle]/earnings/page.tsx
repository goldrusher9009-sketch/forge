'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface EarningsBreakdown {
  label: string
  icon: string
  color: string
  amount: number
  pct: number
  trend: number
}

const EARNINGS: Record<string, { total: number; prev: number; breakdown: EarningsBreakdown[] }> = {
  sovereign_v: {
    total: 28420,
    prev: 22100,
    breakdown: [
      { label: 'Token Sales',    icon: '💎', color: '#a855f7', amount: 12400, pct: 43.6, trend: 18.2  },
      { label: 'Staking Fees',   icon: '🔒', color: '#818cf8', amount: 6840,  pct: 24.1, trend: 9.4   },
      { label: 'Ad Revenue',     icon: '📢', color: '#22c55e', amount: 5200,  pct: 18.3, trend: 42.1  },
      { label: 'Tips Received',  icon: '💸', color: '#f59e0b', amount: 2480,  pct: 8.7,  trend: 5.8   },
      { label: 'Token Merch',    icon: '🛍',  color: '#ec4899', amount: 1500,  pct: 5.3,  trend: 112.0 },
    ],
  },
  mayafit: {
    total: 16840,
    prev: 14200,
    breakdown: [
      { label: 'Token Sales',    icon: '💎', color: '#22c55e', amount: 7200,  pct: 42.8, trend: 14.0  },
      { label: 'Ad Revenue',     icon: '📢', color: '#a855f7', amount: 4800,  pct: 28.5, trend: 55.0  },
      { label: 'Staking Fees',   icon: '🔒', color: '#818cf8', amount: 2640,  pct: 15.7, trend: 8.2   },
      { label: 'Tips Received',  icon: '💸', color: '#f59e0b', amount: 1400,  pct: 8.3,  trend: 2.1   },
      { label: 'Token Merch',    icon: '🛍',  color: '#ec4899', amount: 800,   pct: 4.7,  trend: 200.0 },
    ],
  },
}

type Period = '7D' | '30D' | '90D' | 'ALL'

const HISTORY: { date: string; amount: number }[] = [
  { date: 'Jun 9',  amount: 840  },
  { date: 'Jun 10', amount: 1240 },
  { date: 'Jun 11', amount: 680  },
  { date: 'Jun 12', amount: 1820 },
  { date: 'Jun 13', amount: 2100 },
  { date: 'Jun 14', amount: 960  },
  { date: 'Jun 15', amount: 1480 },
]

export default function CreatorEarningsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const data   = EARNINGS[handle] ?? EARNINGS.sovereign_v

  const [period, setPeriod] = useState<Period>('30D')

  const change    = data.total - data.prev
  const changePct = (change / data.prev) * 100
  const maxDay    = Math.max(...HISTORY.map(h => h.amount))

  const PERIODS: Period[] = ['7D', '30D', '90D', 'ALL']

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
            <div className="font-black text-white">Earnings</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 space-y-4">
        {/* Total */}
        <div>
          <div className="text-3xl font-black text-white">${data.total.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold" style={{ color: change >= 0 ? '#22c55e' : '#f87171' }}>
              {change >= 0 ? '+' : ''}${change.toLocaleString()} ({changePct.toFixed(1)}%)
            </span>
            <span className="text-xs text-white/25">vs last period</span>
          </div>
        </div>

        {/* Period */}
        <div className="flex gap-1.5">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={period === p ? { background: '#a855f7', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Daily bar chart */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Daily Earnings</div>
          <div className="flex items-end gap-1.5 h-24">
            {HISTORY.map(h => (
              <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm" title={`$${h.amount}`}
                  style={{ height: `${(h.amount / maxDay) * 100}%`, background: 'rgba(168,85,247,0.5)', minHeight: 2 }} />
                <div className="text-[8px] text-white/20">{h.date.split(' ')[1]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Revenue Breakdown</div>
        {data.breakdown.map(b => (
          <div key={b.label} className="p-3 rounded-2xl border border-white/4"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{b.icon}</span>
                <span className="font-bold text-sm text-white/75">{b.label}</span>
              </div>
              <div className="text-right">
                <div className="font-black text-sm text-white/80">${b.amount.toLocaleString()}</div>
                <div className="text-xs font-bold" style={{ color: '#22c55e' }}>+{b.trend}%</div>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
            <div className="text-xs text-white/20 mt-1">{b.pct}% of total</div>
          </div>
        ))}

        {/* Payout CTA */}
        <button onClick={() => router.push('/creator/payouts')}
          className="w-full py-3 rounded-xl font-black text-sm"
          style={{ background: '#22c55e', color: '#04040A' }}>
          Request Payout →
        </button>
      </div>
    </div>
  )
}
