'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Range = '7d' | '30d' | '90d' | 'all'

const RANGES: Range[] = ['7d', '30d', '90d', 'all']

// Simulated chart data points (index = day, value = metric)
const DATA: Record<Range, { earnings: number[]; followers: number[]; tokenPrice: number[]; impressions: number[] }> = {
  '7d': {
    earnings:    [18, 24, 31, 19, 42, 28, 37],
    followers:   [148000, 148200, 148500, 148900, 149100, 149300, 149620],
    tokenPrice:  [8.10, 8.25, 8.40, 8.35, 8.60, 8.55, 8.75],
    impressions: [12000, 14500, 18000, 11000, 22000, 16000, 19500],
  },
  '30d': {
    earnings:    [15,20,18,25,30,22,28,35,19,24,31,42,28,37,18,24,31,19,42,28,37,22,30,44,26,38,20,33,45,29],
    followers:   Array.from({length:30},(_,i)=>144000 + i*190),
    tokenPrice:  Array.from({length:30},(_,i)=>7.20 + i*0.052),
    impressions: Array.from({length:30},(_,i)=>10000+Math.sin(i*0.5)*3000+i*200),
  },
  '90d': {
    earnings:    Array.from({length:90},(_,i)=>12+Math.sin(i*0.15)*8+i*0.25),
    followers:   Array.from({length:90},(_,i)=>130000+i*217),
    tokenPrice:  Array.from({length:90},(_,i)=>5.80+i*0.033),
    impressions: Array.from({length:90},(_,i)=>8000+i*150+Math.sin(i*0.2)*2000),
  },
  'all': {
    earnings:    Array.from({length:180},(_,i)=>8+Math.sin(i*0.1)*6+i*0.18),
    followers:   Array.from({length:180},(_,i)=>80000+i*384),
    tokenPrice:  Array.from({length:180},(_,i)=>2.00+i*0.038),
    impressions: Array.from({length:180},(_,i)=>5000+i*130),
  },
}

function MiniChart({ values, color, height = 60 }: { values: number[]; color: string; height?: number }) {
  if (!values.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 300; const h = height
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      <defs>
        <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon fill={`url(#g${color.replace('#','')})`}
        points={`0,${h} ${pts} ${w},${h}`} />
    </svg>
  )
}

function pct(arr: number[]) {
  if (arr.length < 2) return 0
  const a = arr[0]; const b = arr[arr.length - 1]
  return a === 0 ? 0 : ((b - a) / a * 100)
}
function last(arr: number[]) { return arr[arr.length - 1] ?? 0 }
function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0) }

const TOP_POSTS = [
  { title: 'Why I stake 90% of my tokens',      views: 48200, likes: 2100, earnings: 220 },
  { title: 'Diamond tier breakdown 💎',          views: 35900, likes: 1780, earnings: 180 },
  { title: 'My V-Score hit 900 — here\'s how',  views: 29400, likes: 1420, earnings: 145 },
  { title: 'Trading signal thread (BTC long)',   views: 22100, likes: 980,  earnings: 98  },
  { title: 'Collab with @mayafit coming soon',   views: 18700, likes: 860,  earnings: 76  },
]

const AD_CAMPAIGNS = [
  { brand: 'Acme Corp',  slot: 'Feed Post',   impressions: 22000, ctr: '3.2%', earned: 128.50, status: 'active' },
  { brand: 'NovaTech',   slot: 'Story',        impressions: 14500, ctr: '4.1%', earned: 74.20,  status: 'active' },
  { brand: 'FitFuel Co', slot: 'Live Read',    impressions: 8200,  ctr: '5.8%', earned: 95.00,  status: 'ended' },
]

export default function CreatorAnalyticsPage() {
  const router = useRouter()
  const [range, setRange] = useState<Range>('30d')

  const d = DATA[range]
  const earningsTotal = sum(d.earnings)
  const earningsPct = pct(d.earnings)
  const followersCurrent = last(d.followers)
  const followersPct = pct(d.followers)
  const tokenPriceCurrent = last(d.tokenPrice)
  const tokenPricePct = pct(d.tokenPrice)
  const impressionsTotal = sum(d.impressions)
  const impressionsPct = pct(d.impressions)

  function fmtNum(n: number) {
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n/1000).toFixed(0)}k`
    return n.toFixed(0)
  }

  function PctBadge({ v }: { v: number }) {
    const pos = v >= 0
    return (
      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: pos ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                 color: pos ? '#22c55e' : '#f87171' }}>
        {pos ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white flex-1">Creator Analytics</div>
          <button onClick={() => router.push('/creator')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
            Dashboard →
          </button>
        </div>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className="flex-1 py-1.5 rounded-xl text-xs font-black transition-all"
              style={range === r
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              {r}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Earnings',     value: `$${earningsTotal.toFixed(0)}`,    pct: earningsPct,    color: '#22c55e', data: d.earnings    },
            { label: 'Followers',    value: fmtNum(followersCurrent),            pct: followersPct,   color: '#a855f7', data: d.followers   },
            { label: 'Token Price',  value: `$${tokenPriceCurrent.toFixed(2)}`, pct: tokenPricePct,  color: '#f59e0b', data: d.tokenPrice  },
            { label: 'Impressions',  value: fmtNum(impressionsTotal),            pct: impressionsPct, color: '#818cf8', data: d.impressions },
          ].map(kpi => (
            <div key={kpi.label} className="p-3 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs text-white/30">{kpi.label}</div>
                  <div className="font-black text-xl text-white mt-0.5">{kpi.value}</div>
                </div>
                <PctBadge v={kpi.pct} />
              </div>
              <MiniChart values={kpi.data} color={kpi.color} height={40} />
            </div>
          ))}
        </div>

        {/* Earnings chart full */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-white/30">Earnings Over Time</div>
              <div className="font-black text-lg text-white">${earningsTotal.toFixed(2)}</div>
            </div>
            <PctBadge v={earningsPct} />
          </div>
          <MiniChart values={d.earnings} color="#22c55e" height={80} />
          <div className="flex justify-between text-xs text-white/20 mt-1">
            <span>{range === '7d' ? '7 days ago' : range === '30d' ? '30d ago' : range === '90d' ? '90d ago' : '6mo ago'}</span>
            <span>Today</span>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest">Revenue Breakdown</div>
          {[
            { label: 'Ad Revenue',     pct: 48, color: '#a855f7', amount: earningsTotal * 0.48 },
            { label: 'Staking Rewards', pct: 28, color: '#22c55e', amount: earningsTotal * 0.28 },
            { label: 'Token Sales',    pct: 16, color: '#f59e0b', amount: earningsTotal * 0.16 },
            { label: 'Referrals',      pct: 8,  color: '#818cf8', amount: earningsTotal * 0.08 },
          ].map(seg => (
            <div key={seg.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">{seg.label}</span>
                <span className="text-white/70 font-bold">${seg.amount.toFixed(0)} ({seg.pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: `${seg.pct}%`, background: seg.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Top posts */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Top Posts</div>
          {TOP_POSTS.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-lg text-white/15 w-6 flex-shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/75 truncate">{p.title}</div>
                <div className="text-xs text-white/30 mt-0.5">
                  {fmtNum(p.views)} views · {fmtNum(p.likes)} likes
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-black" style={{ color: '#22c55e' }}>${p.earnings}</div>
                <div className="text-xs text-white/25">earned</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ad campaigns */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Ad Campaigns</div>
          {AD_CAMPAIGNS.map((c, i) => (
            <div key={i} className="p-3 rounded-xl border border-white/4 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-white/80">{c.brand}</div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={c.status === 'active'
                    ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                  {c.status === 'active' ? '🟢 Active' : 'Ended'}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-white/40">
                <span>📋 {c.slot}</span>
                <span>👁 {fmtNum(c.impressions)}</span>
                <span>👆 {c.ctr} CTR</span>
                <span className="font-bold" style={{ color: '#22c55e' }}>+${c.earned}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
