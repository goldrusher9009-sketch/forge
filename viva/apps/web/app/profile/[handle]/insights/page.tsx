'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CREATOR_DATA: Record<string, { name: string; color: string; tokenSymbol: string }> = {
  sovereign_v: { name: 'Sovereign V', color: '#a855f7', tokenSymbol: 'SVRN' },
  mayafit:     { name: 'Maya Chen',   color: '#22c55e', tokenSymbol: 'MAYA' },
  jaxbeats:    { name: 'Jax Beats',  color: '#ec4899', tokenSymbol: 'JAX'  },
}

type Period = '7D' | '30D' | '90D'

interface Insight {
  label: string
  value: string
  sub: string
  color: string
  trend: number
}

const INSIGHTS: Record<string, Record<Period, Insight[]>> = {
  sovereign_v: {
    '7D': [
      { label:'Profile Views',   value:'8,420',  sub:'+12% vs prior period',  color:'#818cf8', trend:12  },
      { label:'New Followers',   value:'284',    sub:'+8% vs prior period',   color:'#a855f7', trend:8   },
      { label:'Token Buys',      value:'142',    sub:'+31% vs prior period',  color:'#22c55e', trend:31  },
      { label:'Content Likes',   value:'2,840',  sub:'-4% vs prior period',   color:'#f59e0b', trend:-4  },
      { label:'DMs Received',    value:'48',     sub:'+22% vs prior period',  color:'#ec4899', trend:22  },
      { label:'V-Score Change',  value:'+140',   sub:'9,840 total',           color:'#22c55e', trend:1.4 },
    ],
    '30D': [
      { label:'Profile Views',   value:'34,200', sub:'+28% vs prior period',  color:'#818cf8', trend:28  },
      { label:'New Followers',   value:'1,240',  sub:'+15% vs prior period',  color:'#a855f7', trend:15  },
      { label:'Token Buys',      value:'580',    sub:'+42% vs prior period',  color:'#22c55e', trend:42  },
      { label:'Content Likes',   value:'11,820', sub:'+8% vs prior period',   color:'#f59e0b', trend:8   },
      { label:'DMs Received',    value:'184',    sub:'+18% vs prior period',  color:'#ec4899', trend:18  },
      { label:'V-Score Change',  value:'+520',   sub:'9,840 total',           color:'#22c55e', trend:5.6 },
    ],
    '90D': [
      { label:'Profile Views',   value:'102k',   sub:'+54% vs prior period',  color:'#818cf8', trend:54  },
      { label:'New Followers',   value:'4,820',  sub:'+38% vs prior period',  color:'#a855f7', trend:38  },
      { label:'Token Buys',      value:'1,840',  sub:'+71% vs prior period',  color:'#22c55e', trend:71  },
      { label:'Content Likes',   value:'38,400', sub:'+22% vs prior period',  color:'#f59e0b', trend:22  },
      { label:'DMs Received',    value:'540',    sub:'+44% vs prior period',  color:'#ec4899', trend:44  },
      { label:'V-Score Change',  value:'+1,840', sub:'9,840 total',           color:'#22c55e', trend:23  },
    ],
  },
}

function genBarData(days: number, base: number): number[] {
  const arr = []
  for (let i = 0; i < days; i++) arr.push(Math.floor(base * (0.6 + Math.random() * 0.8)))
  return arr
}

export default function ProfileInsightsPage() {
  const router = useRouter()
  const params = useParams()
  const handle  = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const creator = CREATOR_DATA[handle] ?? CREATOR_DATA.sovereign_v

  const [period, setPeriod] = useState<Period>('7D')
  const insights = (INSIGHTS[handle] ?? INSIGHTS.sovereign_v)[period]

  const days = period === '7D' ? 7 : period === '30D' ? 30 : 90
  const viewData  = genBarData(days, 1200)
  const maxV = Math.max(...viewData)

  // Top content types
  const CONTENT_TYPES = [
    { label:'Videos',      pct:52, color:'#a855f7' },
    { label:'Posts',       pct:28, color:'#818cf8' },
    { label:'Audio',       pct:12, color:'#ec4899' },
    { label:'Images',      pct:8,  color:'#22c55e' },
  ]

  // Audience breakdown
  const AUDIENCE = [
    { label:'Diamond holders',  pct:18, color:'#818cf8' },
    { label:'Gold holders',     pct:24, color:'#f59e0b' },
    { label:'Silver holders',   pct:21, color:'#94a3b8' },
    { label:'Bronze holders',   pct:15, color:'#b45309' },
    { label:'Non-holders',      pct:22, color:'rgba(255,255,255,0.15)' },
  ]

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
            <div className="font-black text-white">Insights</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
          <button onClick={() => router.push(`/creator/analytics`)}
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: `${creator.color}15`, color: creator.color }}>
            Analytics
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Period selector */}
        <div className="flex gap-1.5">
          {(['7D','30D','90D'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold"
              style={period === p ? { background: creator.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Profile views chart */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-1">Profile Views</div>
          <div className="font-black text-xl text-white/80 mb-3">{insights[0]?.value}</div>
          <div className="flex items-end gap-0.5 h-16">
            {viewData.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-sm"
                style={{ height: `${(v / maxV) * 100}%`, background: `${creator.color}50`, minHeight: 2 }} />
            ))}
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          {insights.slice(1).map(ins => (
            <div key={ins.label} className="p-3 rounded-xl border border-white/5"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/25 mb-0.5">{ins.label}</div>
              <div className="font-black text-base" style={{ color: ins.color }}>{ins.value}</div>
              <div className="text-xs" style={{ color: ins.trend >= 0 ? '#22c55e' : '#f87171' }}>
                {ins.trend >= 0 ? '↑' : '↓'} {Math.abs(ins.trend)}% {ins.trend >= 0 ? 'up' : 'down'}
              </div>
            </div>
          ))}
        </div>

        {/* Audience breakdown */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Audience by Token Tier</div>
          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-3">
            {AUDIENCE.map(a => (
              <div key={a.label} className="h-full" style={{ width: `${a.pct}%`, background: a.color }} />
            ))}
          </div>
          {AUDIENCE.map(a => (
            <div key={a.label} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                <span className="text-xs text-white/50">{a.label}</span>
              </div>
              <span className="text-xs font-bold text-white/40">{a.pct}%</span>
            </div>
          ))}
        </div>

        {/* Content performance */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Top Content Types</div>
          {CONTENT_TYPES.map(c => (
            <div key={c.label} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: c.color }}>{c.label}</span>
                <span className="text-white/30">{c.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Best times to post */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Best Times to Post</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { time:'7–9 PM', day:'Mon–Wed', engagement:'Highest' },
              { time:'12–2 PM', day:'Tue/Thu', engagement:'High'    },
              { time:'9–11 AM', day:'Weekend', engagement:'Good'    },
            ].map(t => (
              <div key={t.time} className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="font-black text-xs" style={{ color: creator.color }}>{t.time}</div>
                <div className="text-xs text-white/30">{t.day}</div>
                <div className="text-xs mt-0.5" style={{ color: t.engagement === 'Highest' ? '#22c55e' : t.engagement === 'High' ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
                  {t.engagement}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
