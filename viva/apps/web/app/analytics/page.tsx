'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PERIODS = ['7d', '30d', '90d']

const METRICS = {
  '7d': {
    profileViews: [820, 910, 780, 1040, 1120, 990, 1380],
    tokenVolume:  [4200, 5100, 3800, 6200, 7100, 5800, 8400],
    followers:    [12, 8, 15, 22, 11, 18, 30],
    adImpressions:[3100, 3400, 2900, 4100, 4800, 4200, 5600],
  },
  '30d': {
    profileViews: [620, 710, 680, 740, 820, 910, 780, 1040, 1120, 990, 1380, 880, 960, 1050, 1200, 1100, 1300, 1400, 1250, 1100, 1050, 980, 1150, 1320, 1410, 1500, 1380, 1620, 1700, 1580],
    tokenVolume:  Array.from({length:30}, (_,i) => 3000 + Math.floor(Math.sin(i/3)*2000 + 5000)),
    followers:    Array.from({length:30}, () => Math.floor(Math.random()*25+5)),
    adImpressions:Array.from({length:30}, (_,i) => 2500 + Math.floor(i*120 + Math.random()*1000)),
  },
  '90d': {
    profileViews: Array.from({length:90}, (_,i) => 600 + Math.floor(i*12 + Math.random()*400)),
    tokenVolume:  Array.from({length:90}, (_,i) => 3000 + Math.floor(i*80 + Math.random()*3000)),
    followers:    Array.from({length:90}, () => Math.floor(Math.random()*30+2)),
    adImpressions:Array.from({length:90}, (_,i) => 2000 + Math.floor(i*50 + Math.random()*1500)),
  },
}

function MiniLineChart({ data, color, fill }: { data: number[]; color: string; fill?: string }) {
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const w = 300, h = 60
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  const area = `0,${h} ${pts} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`lg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#lg${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0) }
function pct(arr: number[]) {
  const half = Math.floor(arr.length / 2)
  const a = sum(arr.slice(0, half)), b = sum(arr.slice(half))
  return b === 0 ? 0 : ((b - a) / a * 100)
}

const TOP_POSTS = [
  { id: '1', text: 'How I built a $100k token economy from scratch...', views: 12400, likes: 840,  comments: 120 },
  { id: '2', text: 'The ZK health stack I use every morning →',       views: 9800,  likes: 620,  comments: 88  },
  { id: '3', text: 'Why your profile IS your portfolio',               views: 8200,  likes: 510,  comments: 74  },
]

const AUDIENCE = [
  { label: 'Finance / Crypto',  pct: 38, color: '#f59e0b' },
  { label: 'Health & Wellness', pct: 24, color: '#22c55e' },
  { label: 'Tech / Web3',       pct: 19, color: '#818cf8' },
  { label: 'Entrepreneurship',  pct: 12, color: '#a855f7' },
  { label: 'Other',             pct: 7,  color: '#94a3b8'  },
]

export default function AnalyticsPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<'7d'|'30d'|'90d'>('7d')
  const m = METRICS[period]

  const cards = [
    { label: 'Profile Views',   data: m.profileViews,   color: '#a855f7', fmt: (n: number) => n.toLocaleString() },
    { label: 'Token Volume',    data: m.tokenVolume,    color: '#f59e0b', fmt: (n: number) => `$${(n/1000).toFixed(1)}k` },
    { label: 'New Followers',   data: m.followers,      color: '#22c55e', fmt: (n: number) => `+${n}` },
    { label: 'Ad Impressions',  data: m.adImpressions,  color: '#ec4899', fmt: (n: number) => n.toLocaleString() },
  ]

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
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">PROFILE INSIGHTS</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Analytics</h1>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p as any)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={period === p
                  ? { background: 'rgba(255,255,255,0.15)', color: 'white' }
                  : { color: 'rgba(255,255,255,0.35)' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map(card => {
            const total = sum(card.data)
            const change = pct(card.data)
            return (
              <div key={card.label} className="p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="text-xs text-white/35 mb-1">{card.label}</div>
                <div className="text-xl font-black text-white mb-0.5">{card.fmt(total)}</div>
                <div className={`text-xs font-semibold mb-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs prev
                </div>
                <MiniLineChart data={card.data} color={card.color} />
              </div>
            )
          })}
        </div>

        {/* Audience breakdown */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 uppercase tracking-widest mb-3">Audience Interests</div>
          <div className="flex gap-2 mb-3">
            {AUDIENCE.map(a => (
              <div key={a.label} className="flex-1 h-2 rounded-full" style={{ background: a.color, opacity: a.pct / 100 + 0.3 }} />
            ))}
          </div>
          <div className="space-y-2">
            {AUDIENCE.map(a => (
              <div key={a.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                <div className="flex-1 text-xs text-white/60">{a.label}</div>
                <div className="text-xs font-bold" style={{ color: a.color }}>{a.pct}%</div>
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: a.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top posts */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 uppercase tracking-widest mb-3">Top Posts ({period})</div>
          <div className="space-y-3">
            {TOP_POSTS.map((post, i) => (
              <div key={post.id} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: i === 0 ? '#f59e0b18' : 'rgba(255,255,255,0.04)', color: i === 0 ? '#f59e0b' : 'rgba(255,255,255,0.25)' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/70 leading-snug mb-1 truncate">{post.text}</div>
                  <div className="flex gap-3 text-xs text-white/30">
                    <span>👁 {post.views.toLocaleString()}</span>
                    <span>♡ {post.likes}</span>
                    <span>◎ {post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Engagement Rate', val: '9.2%',  color: '#22c55e' },
            { label: 'Token Holders',   val: '420',   color: '#a855f7' },
            { label: 'Ad CTR',          val: '3.8%',  color: '#ec4899' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/6 text-center"
              style={{ background: `${s.color}06` }}>
              <div className="text-sm font-black" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.push('/creator')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: '#a855f7', color: '#04040A' }}>
            Creator Hub ↗
          </button>
          <button onClick={() => router.push('/advertise')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
            Ad Marketplace
          </button>
        </div>
      </div>
    </div>
  )
}
