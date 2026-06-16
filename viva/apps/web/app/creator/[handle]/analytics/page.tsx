'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Period = '7D' | '30D' | '90D'

interface Metric { label:string; value:string; sub:string; color:string; delta:string; positive:boolean }

const CREATOR_DATA: Record<string, { name:string; color:string; tokenSymbol:string }> = {
  sovereign_v: { name:'Sovereign V', color:'#a855f7', tokenSymbol:'SVRN' },
  mayafit:     { name:'Maya Chen',   color:'#22c55e', tokenSymbol:'MAYA' },
  jaxbeats:    { name:'Jax Beats',  color:'#ec4899', tokenSymbol:'JAX'  },
}

function makeBars(base: number, count: number, vol: number) {
  return Array.from({length:count}, (_, i) => Math.max(0.05, base * (0.6 + Math.random() * vol) * (0.8 + i/count*0.4)))
}

export default function CreatorAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const handle  = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const creator = CREATOR_DATA[handle] ?? CREATOR_DATA.sovereign_v
  const accent  = creator.color

  const [period, setPeriod] = useState<Period>('7D')
  const days = period === '7D' ? 7 : period === '30D' ? 30 : 90

  const followers = handle === 'mayafit' ? 62100 : handle === 'jaxbeats' ? 34800 : 48200
  const earnings  = handle === 'mayafit' ? 3640  : handle === 'jaxbeats' ? 2180  : 4820
  const tips      = handle === 'mayafit' ? 18400 : handle === 'jaxbeats' ? 9200  : 42800
  const holders   = handle === 'mayafit' ? 1620  : handle === 'jaxbeats' ? 980   : 2840

  const viewBars   = makeBars(1800, days, 0.5)
  const earningBars= makeBars(690, days, 0.6)
  const maxV       = Math.max(...viewBars)
  const maxE       = Math.max(...earningBars)

  const METRICS: Metric[] = [
    { label:'Followers',    value:(followers/1000).toFixed(1)+'k', sub:'total',             color:accent,    delta:'+2.4%',  positive:true  },
    { label:'7D Earnings',  value:`$${earnings}`,                  sub:'USDC',              color:'#f59e0b', delta:'+18%',   positive:true  },
    { label:'Token Holders',value:holders.toLocaleString(),        sub:`$${creator.tokenSymbol}`, color:accent, delta:'+8%', positive:true  },
    { label:'Total Tips',   value:`$${(tips/1000).toFixed(0)}k`,   sub:'all time',          color:'#ec4899', delta:'+12%',   positive:true  },
    { label:'Posts/wk',     value:'6.2',                           sub:'avg this month',    color:'rgba(255,255,255,0.5)', delta:'+1.4', positive:true },
    { label:'Engagement',   value:'8.4%',                          sub:'likes/views',       color:'#22c55e', delta:'+0.8%',  positive:true  },
  ]

  const TOP_POSTS = [
    { title:'BTC accumulation zone', views:12400, likes:824,  earnings:142 },
    { title:'ETH accumulation pattern', views:7100, likes:490, earnings:86 },
    { title:'DeFi 101: Liquidity pools', views:28000, likes:1200, earnings:210 },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Analytics</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {(['7D','30D','90D'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={period === p ? { background:accent, color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-2">
          {METRICS.map(m => (
            <div key={m.label} className="p-3 rounded-xl border border-white/5" style={{ background:'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/25 mb-0.5">{m.label}</div>
              <div className="font-black text-base" style={{ color:m.color }}>{m.value}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs font-bold" style={{ color:m.positive?'#22c55e':'#f87171' }}>{m.delta}</span>
                <span className="text-xs text-white/15">{m.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Views chart */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background:'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Content Views</div>
          <div className="flex items-end gap-0.5 h-20">
            {viewBars.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-sm"
                style={{ height:`${(v/maxV)*100}%`, background:`${accent}40`, minHeight:2 }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/20">
            <span>{days}d ago</span><span>Today</span>
          </div>
        </div>

        {/* Earnings chart */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background:'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Daily Earnings (USDC)</div>
          <div className="flex items-end gap-0.5 h-20">
            {earningBars.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-sm"
                style={{ height:`${(v/maxE)*100}%`, background:'rgba(245,158,11,0.4)', minHeight:2 }} />
            ))}
          </div>
          <div className="text-xs text-white/25 mt-2">Total: ${earningBars.reduce((s,v)=>s+v,0).toFixed(0)} USDC</div>
        </div>

        {/* Top content */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Top Content</div>
          <div className="space-y-2">
            {TOP_POSTS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
                style={{ background:'rgba(255,255,255,0.015)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background:`${accent}15`, color:accent }}>#{i+1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white/75 truncate">{p.title}</div>
                  <div className="text-xs text-white/25">{(p.views/1000).toFixed(1)}k views · ♥{p.likes}</div>
                </div>
                <div className="font-black text-sm flex-shrink-0" style={{ color:'#f59e0b' }}>+${p.earnings}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-3" style={{ background:'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Revenue Breakdown</div>
          {[
            { label:'Tips',             pct:58, value:'$2,796', color:'#ec4899' },
            { label:'Token staking',    pct:24, value:'$1,157', color:'#f59e0b' },
            { label:'Ad revenue',       pct:12, value:'$579',   color:'#818cf8' },
            { label:'Content gating',   pct:6,  value:'$288',   color:accent    },
          ].map(r => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/35">{r.label}</span>
                <span className="font-bold" style={{ color:r.color }}>{r.value} ({r.pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width:`${r.pct}%`, background:r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
