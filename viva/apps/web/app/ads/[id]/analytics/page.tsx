'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface AdCampaign {
  id: string
  title: string
  creatorHandle: string
  creatorName: string
  creatorColor: string
  status: 'active' | 'paused' | 'ended'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  startDate: string
  endDate: string
  targetAudience: string
}

const CAMPAIGNS: Record<string, AdCampaign> = {
  ad1: {
    id: 'ad1', title: 'DeFi Academy Launch', creatorHandle: 'sovereign_v', creatorName: 'Sovereign V', creatorColor: '#a855f7',
    status: 'active', budget: 5000, spent: 3240, impressions: 284000, clicks: 8420, conversions: 312,
    startDate: '2026-06-01', endDate: '2026-06-30', targetAudience: 'DeFi enthusiasts, 18–45',
  },
  ad2: {
    id: 'ad2', title: 'Maya Fit Premium Promo', creatorHandle: 'mayafit', creatorName: 'Maya Chen', creatorColor: '#22c55e',
    status: 'active', budget: 2500, spent: 1180, impressions: 142000, clicks: 5900, conversions: 218,
    startDate: '2026-06-10', endDate: '2026-06-25', targetAudience: 'Fitness, wellness, 18–35',
  },
}

type Period = '7D' | '14D' | '30D'

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  )
}

// Simple day-by-day impression data
function makeDailyData(total: number, days: number) {
  const arr = []
  let rem = total
  for (let i = 0; i < days; i++) {
    const v = Math.round(rem / (days - i) * (0.7 + Math.random() * 0.6))
    arr.push(Math.min(v, rem))
    rem -= v
    if (rem <= 0) break
  }
  return arr
}

export default function AdAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'ad1'
  const ad = CAMPAIGNS[id] ?? CAMPAIGNS.ad1

  const [period, setPeriod] = useState<Period>('7D')
  const days = period === '7D' ? 7 : period === '14D' ? 14 : 30
  const dailyImpressions = makeDailyData(ad.impressions, days)
  const maxDay = Math.max(...dailyImpressions)

  const ctr = ((ad.clicks / ad.impressions) * 100).toFixed(2)
  const cvr = ((ad.conversions / ad.clicks) * 100).toFixed(2)
  const cpc = (ad.spent / ad.clicks).toFixed(2)
  const cpa = (ad.spent / ad.conversions).toFixed(2)
  const budgetPct = (ad.spent / ad.budget) * 100
  const positive = ad.status === 'active'

  const STATUS_COLOR: Record<string, string> = { active: '#22c55e', paused: '#f59e0b', ended: '#f87171' }

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
          <div className="flex-1 min-w-0">
            <div className="font-black text-white truncate">{ad.title}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: STATUS_COLOR[ad.status] }}>● {ad.status}</span>
              <span className="text-xs text-white/25">@{ad.creatorHandle}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Budget bar */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/35 font-semibold uppercase tracking-wider">Budget</span>
            <span className="text-sm font-black text-white/70">${ad.spent.toLocaleString()} / ${ad.budget.toLocaleString()}</span>
          </div>
          <Bar pct={budgetPct} color={budgetPct > 85 ? '#f87171' : '#a855f7'} />
          <div className="text-xs text-white/25 mt-1">{budgetPct.toFixed(0)}% used · {ad.startDate} → {ad.endDate}</div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Impressions', value: (ad.impressions / 1000).toFixed(0) + 'k', sub: 'total views',      color: '#818cf8' },
            { label: 'Clicks',      value: ad.clicks.toLocaleString(),                sub: `CTR ${ctr}%`,     color: '#a855f7' },
            { label: 'Conversions', value: ad.conversions.toLocaleString(),           sub: `CVR ${cvr}%`,     color: '#22c55e' },
            { label: 'Spent',       value: `$${ad.spent.toLocaleString()}`,           sub: `CPC $${cpc}`,     color: '#f59e0b' },
            { label: 'CPA',         value: `$${cpa}`,                                sub: 'cost per action',  color: '#ec4899' },
            { label: 'ROAS',        value: '3.2×',                                   sub: 'return on ad spend', color: '#22c55e' },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/25 mb-0.5">{m.label}</div>
              <div className="font-black text-lg" style={{ color: m.color }}>{m.value}</div>
              <div className="text-xs text-white/25">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex gap-1.5">
          {(['7D', '14D', '30D'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={period === p ? { background: ad.creatorColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Impression chart */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Daily Impressions</div>
          <div className="flex items-end gap-1 h-24">
            {dailyImpressions.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-sm" title={`${v.toLocaleString()} impressions`}
                style={{ height: `${maxDay > 0 ? (v / maxDay) * 100 : 0}%`, background: `${ad.creatorColor}50`, minHeight: 2 }} />
            ))}
          </div>
        </div>

        {/* Audience */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Target Audience</div>
          <div className="text-sm text-white/60">{ad.targetAudience}</div>
          <div className="mt-3 space-y-2">
            {[
              { label: 'Token Holders',   pct: 68, color: ad.creatorColor },
              { label: 'Free Users',       pct: 32, color: 'rgba(255,255,255,0.2)' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-white/30 mb-1">
                  <span>{s.label}</span><span>{s.pct}%</span>
                </div>
                <Bar pct={s.pct} color={s.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl font-black text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            ⏸ Pause
          </button>
          <button onClick={() => router.push(`/ads/create`)}
            className="flex-1 py-3 rounded-xl font-black text-sm"
            style={{ background: ad.creatorColor, color: '#04040A' }}>
            + New Ad
          </button>
        </div>
      </div>
    </div>
  )
}
