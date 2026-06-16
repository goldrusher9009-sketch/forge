'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Holding { symbol:string; name:string; color:string; qty:number; price:number; change24h:number; value:number; pnl:number; pnlPct:number; staked:number; apy:number }

const HOLDINGS: Holding[] = [
  { symbol:'SVRN', name:'Sovereign V', color:'#a855f7', qty:50,  price:8.75, change24h:4.2,  value:437.50, pnl:127.50, pnlPct:41.2, staked:50,  apy:22 },
  { symbol:'MAYA', name:'Maya Chen',   color:'#22c55e', qty:80,  price:5.20, change24h:-1.8, value:416.00, pnl:104.00, pnlPct:33.3, staked:80,  apy:14 },
  { symbol:'ATL',  name:'Atlas K',     color:'#818cf8', qty:20,  price:6.10, change24h:-0.4, value:122.00, pnl:22.00,  pnlPct:22.0, staked:0,   apy:0  },
  { symbol:'JADE', name:'Jade Luxury', color:'#ec4899', qty:10,  price:4.60, change24h:1.9,  value:46.00,  pnl:8.00,   pnlPct:21.1, staked:0,   apy:0  },
]

type Sort = 'value' | 'pnl' | 'change'

function makeLine(base: number, count: number) {
  const pts = [base * 0.72]
  for (let i = 1; i < count; i++) pts.push(Math.max(pts[i-1] * (1 + (Math.random()-0.4) * 0.04), base * 0.4))
  pts.push(base)
  return pts
}

export default function PortfolioPage() {
  const router = useRouter()
  const [sort, setSort] = useState<Sort>('value')
  const [tab, setTab]   = useState<'holdings'|'activity'>('holdings')

  const totalValue  = HOLDINGS.reduce((s, h) => s + h.value, 0)
  const totalPnl    = HOLDINGS.reduce((s, h) => s + h.pnl, 0)
  const totalPnlPct = (totalPnl / (totalValue - totalPnl)) * 100
  const stakingIncome = HOLDINGS.reduce((s, h) => s + (h.staked * h.price * h.apy / 100), 0)
  const positive    = totalPnl >= 0

  let sorted = [...HOLDINGS]
  if (sort === 'value')  sorted.sort((a,b) => b.value - a.value)
  if (sort === 'pnl')    sorted.sort((a,b) => b.pnlPct - a.pnlPct)
  if (sort === 'change') sorted.sort((a,b) => b.change24h - a.change24h)

  const lineData = makeLine(totalValue, 60)
  const minL = Math.min(...lineData); const maxL = Math.max(...lineData)
  const W=360; const H=100; const pl=8; const pr=8; const pt=8; const pb=12
  const pts = lineData.map((v,i) => ({
    x: pl + (i/(lineData.length-1))*(W-pl-pr),
    y: pt + (H-pt-pb) - ((v-minL)/(maxL-minL||1))*(H-pt-pb)
  }))
  const line = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const fill = `${line} L${pts[pts.length-1].x},${H-pb} L${pl},${H-pb} Z`
  const lc = positive ? '#22c55e' : '#f87171'

  const ACTIVITY = [
    { action:'Bought',   symbol:'SVRN', qty:5,  price:8.20, date:'Jun 15' },
    { action:'Staked',   symbol:'MAYA', qty:30, price:5.10, date:'Jun 12' },
    { action:'Tip recv', symbol:'SVRN', qty:0,  price:0, note:'$12 tip from @atlas_k', date:'Jun 10' },
    { action:'Bought',   symbol:'JADE', qty:10, price:4.20, date:'Jun 08' },
    { action:'Reward',   symbol:'MAYA', qty:0,  price:0, note:'Staking reward: $8.40', date:'Jun 07' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 font-black text-white">Portfolio</div>
          <button onClick={() => router.push('/marketplace')}
            className="text-xs px-3 py-1.5 rounded-xl font-bold"
            style={{ background:'rgba(168,85,247,0.12)', color:'#a855f7' }}>+ Buy</button>
        </div>
      </header>

      <div className="px-4 pt-5 pb-3">
        {/* Total value */}
        <div className="mb-1">
          <div className="text-xs text-white/30">Total Value</div>
          <div className="text-4xl font-black text-white">${totalValue.toFixed(2)}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-sm" style={{ color:lc }}>
              {positive?'+':''} ${totalPnl.toFixed(2)} ({positive?'+':''}{totalPnlPct.toFixed(1)}%)
            </span>
            <span className="text-xs text-white/25">all time</span>
          </div>
        </div>

        {/* Mini chart */}
        <div className="my-4 rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.01)' }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={lc} stopOpacity="0.18" />
                <stop offset="100%" stopColor={lc} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={fill} fill="url(#portGrad)" />
            <path d={line}  fill="none" stroke={lc} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label:'Holdings',    value:`$${totalValue.toFixed(0)}`,             color:'rgba(255,255,255,0.7)' },
            { label:'P&L',         value:`${positive?'+':''}$${totalPnl.toFixed(0)}`, color:lc },
            { label:'Staking/yr',  value:`+$${Math.round(stakingIncome)}`,         color:'#f59e0b' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background:'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/25 mb-0.5">{s.label}</div>
              <div className="font-black text-sm" style={{ color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab + sort */}
        <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.04)' }}>
          {(['holdings','activity'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
              style={tab===t ? { background:'rgba(255,255,255,0.08)', color:'white' } : { color:'rgba(255,255,255,0.3)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'holdings' && (
          <>
            <div className="flex gap-1.5 mb-3">
              {(['value','pnl','change'] as Sort[]).map(s => (
                <button key={s} onClick={() => setSort(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold capitalize"
                  style={sort===s ? { background:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)' }
                                  : { background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.3)' }}>
                  {s === 'pnl' ? 'P&L' : s === 'change' ? '24h' : 'Value'}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {sorted.map(h => (
                <button key={h.symbol} onClick={() => router.push(`/tokens/${h.symbol}/chart`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
                  style={{ background:'rgba(255,255,255,0.015)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background:`${h.color}15`, color:h.color }}>{h.symbol[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white/80">${h.symbol}</div>
                    <div className="text-xs text-white/25">
                      {h.qty} · {h.staked > 0 ? `${h.staked} staked ${h.apy}% APY` : 'not staking'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-white/75">${h.value.toFixed(2)}</div>
                    <div className="text-xs font-bold" style={{ color:h.change24h>=0?'#22c55e':'#f87171' }}>
                      {h.change24h>=0?'+':''}{h.change24h}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => router.push('/staking')}
                className="flex-1 py-3 rounded-xl font-black text-sm"
                style={{ background:'rgba(168,85,247,0.1)', color:'#a855f7' }}>Stake Tokens</button>
              <button onClick={() => router.push('/portfolio/atlas_k/performance')}
                className="flex-1 py-3 rounded-xl font-black text-sm"
                style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)' }}>Performance →</button>
            </div>
          </>
        )}

        {tab === 'activity' && (
          <div className="space-y-2">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
                style={{ background:'rgba(255,255,255,0.015)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background:a.action.includes('Bought')?'rgba(34,197,94,0.1)':a.action.includes('Reward')||a.action.includes('Tip')?'rgba(245,158,11,0.1)':'rgba(168,85,247,0.1)',
                           color:a.action.includes('Bought')?'#22c55e':a.action.includes('Reward')||a.action.includes('Tip')?'#f59e0b':'#a855f7' }}>
                  {a.action.includes('Bought')?'↓':a.action.includes('Staked')?'🔒':'+'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-white/75">
                    {a.action} {a.qty > 0 ? `${a.qty} $${a.symbol}` : a.note}
                  </div>
                  <div className="text-xs text-white/25">{a.qty > 0 ? `@ $${a.price}` : ''} · {a.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
