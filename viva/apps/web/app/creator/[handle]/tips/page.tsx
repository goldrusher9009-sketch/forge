'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CREATOR_DATA: Record<string, { name: string; color: string; tokenSymbol: string; tokenPrice: number }> = {
  sovereign_v: { name:'Sovereign V', color:'#a855f7', tokenSymbol:'SVRN', tokenPrice:8.75 },
  mayafit:     { name:'Maya Chen',   color:'#22c55e', tokenSymbol:'MAYA', tokenPrice:5.20 },
  jaxbeats:    { name:'Jax Beats',  color:'#ec4899', tokenSymbol:'JAX',  tokenPrice:3.80 },
}

interface Tipper {
  handle: string
  name: string
  color: string
  tipAmount: number
  tipCount: number
  lastTip: string
  rank: number
}

const TIPPERS: Tipper[] = [
  { handle:'atlas_k',  name:'Atlas K',  color:'#818cf8', tipAmount:480.0, tipCount:12, lastTip:'2h ago',  rank:1 },
  { handle:'lily_p',   name:'Lily P.',  color:'#f59e0b', tipAmount:280.5, tipCount:8,  lastTip:'1d ago',  rank:2 },
  { handle:'luna_w',   name:'Luna W.',  color:'#f87171', tipAmount:195.0, tipCount:15, lastTip:'3d ago',  rank:3 },
  { handle:'jade_l',   name:'Jade L.',  color:'#a855f7', tipAmount:142.5, tipCount:6,  lastTip:'4d ago',  rank:4 },
  { handle:'noa_d',    name:'Noa D.',   color:'#f59e0b', tipAmount:95.0,  tipCount:9,  lastTip:'5d ago',  rank:5 },
  { handle:'kai_r',    name:'Kai R.',   color:'#22c55e', tipAmount:62.5,  tipCount:4,  lastTip:'1w ago',  rank:6 },
]

const RECENT_TIPS = [
  { from:'atlas_k', fromColor:'#818cf8', amount:40, tokenSymbol:'SVRN', ts:'2h ago',  msg:'🔥 Another banger drop!' },
  { from:'lily_p',  fromColor:'#f59e0b', amount:25, tokenSymbol:'SVRN', ts:'5h ago',  msg:'Keep it up! 💎'          },
  { from:'luna_w',  fromColor:'#f87171', amount:15, tokenSymbol:'SVRN', ts:'1d ago',  msg:''                        },
  { from:'jade_l',  fromColor:'#a855f7', amount:50, tokenSymbol:'SVRN', ts:'2d ago',  msg:'Alpha as always 🚀'      },
]

const MEDALS = ['🥇','🥈','🥉']

export default function CreatorTipsPage() {
  const router = useRouter()
  const params = useParams()
  const handle  = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const creator = CREATOR_DATA[handle] ?? CREATOR_DATA.sovereign_v

  const [tab, setTab] = useState<'leaderboard' | 'recent'>('leaderboard')
  const [tipping, setTipping] = useState(false)
  const [tipAmount, setTipAmount] = useState(10)
  const [tipSent,   setTipSent  ] = useState(false)

  const totalTips = TIPPERS.reduce((s, t) => s + t.tipAmount, 0)
  const topTipper = TIPPERS[0]

  async function sendTip() {
    setTipping(true)
    await new Promise(r => setTimeout(r, 900))
    setTipping(false)
    setTipSent(true)
    setTimeout(() => setTipSent(false), 2000)
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="font-black text-white">Tips</div>
            <div className="text-xs text-white/30">@{handle} · {TIPPERS.length} supporters</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Total Tips',    value:`$${totalTips.toFixed(0)}`, color:creator.color },
            { label:'This Month',    value:'$284',                     color:'#22c55e'      },
            { label:'Top Tipper',    value:topTipper.name.split(' ')[0], color:'#f59e0b'   },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tip CTA */}
        <div className="p-4 rounded-2xl border" style={{ background: `${creator.color}06`, borderColor: `${creator.color}18` }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Send a Tip</div>
          <div className="flex gap-2 mb-3">
            {[5, 10, 25, 50].map(a => (
              <button key={a} onClick={() => setTipAmount(a)}
                className="flex-1 py-2 rounded-xl text-xs font-black"
                style={tipAmount === a ? { background: creator.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                {a}
              </button>
            ))}
          </div>
          <div className="text-xs text-white/25 text-center mb-3">${tipAmount} = {(tipAmount / creator.tokenPrice).toFixed(1)} ${creator.tokenSymbol}</div>
          <button onClick={sendTip} disabled={tipping}
            className="w-full py-2.5 rounded-xl font-black text-sm"
            style={tipSent ? { background: '#22c55e', color: '#04040A' } : { background: creator.color, color: '#04040A' }}>
            {tipping ? 'Sending…' : tipSent ? '✓ Tip Sent!' : `Tip ${tipAmount} ${creator.tokenSymbol}`}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['leaderboard','recent'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
              style={tab === t ? { background: 'rgba(255,255,255,0.08)', color: 'white' } : { color: 'rgba(255,255,255,0.3)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'leaderboard' && (
          <div className="space-y-2">
            {TIPPERS.map(t => (
              <button key={t.handle} onClick={() => router.push(`/profile/${t.handle}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-7 text-center text-base flex-shrink-0">
                  {t.rank <= 3 ? MEDALS[t.rank-1] : <span className="text-xs text-white/25">#{t.rank}</span>}
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: `${t.color}15`, color: t.color }}>
                  {t.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-white/80">{t.name}</div>
                  <div className="text-xs text-white/25">{t.tipCount} tips · last {t.lastTip}</div>
                </div>
                <div className="font-black text-sm" style={{ color: creator.color }}>${t.tipAmount.toFixed(0)}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'recent' && (
          <div className="space-y-2">
            {RECENT_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: `${tip.fromColor}15`, color: tip.fromColor }}>
                  {tip.from[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white/80">@{tip.from}</span>
                    <span className="font-black text-sm" style={{ color: creator.color }}>+{tip.amount} ${tip.tokenSymbol}</span>
                    <span className="text-xs text-white/20 ml-auto">{tip.ts}</span>
                  </div>
                  {tip.msg && <div className="text-xs text-white/40 mt-0.5">"{tip.msg}"</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
