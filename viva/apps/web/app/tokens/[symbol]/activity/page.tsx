'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const TOKENS: Record<string, { name: string; color: string; price: number }> = {
  SVRN: { name:'Sovereign V', color:'#a855f7', price:8.75 },
  MAYA: { name:'Maya Chen',   color:'#22c55e', price:5.20 },
  JAX:  { name:'Jax Beats',  color:'#ec4899', price:3.80 },
}

type ActivityType = 'buy' | 'sell' | 'stake' | 'unstake' | 'tip' | 'reward' | 'listing'

interface Activity {
  id: string
  type: ActivityType
  fromHandle: string
  fromName: string
  fromColor: string
  toHandle?: string
  toName?: string
  qty: number
  price: number
  total: number
  ts: string
  ago: string
}

const TOKEN_ACTIVITY: Record<string, Activity[]> = {
  SVRN: [
    { id:'a1',  type:'buy',     fromHandle:'atlas_k',  fromName:'Atlas K',  fromColor:'#818cf8', qty:20,  price:8.75, total:175.00, ts:'14:32', ago:'2m ago'   },
    { id:'a2',  type:'tip',     fromHandle:'lily_p',   fromName:'Lily P.',  fromColor:'#f59e0b', toHandle:'sovereign_v', toName:'Sovereign V', qty:10, price:8.75, total:87.50, ts:'14:28', ago:'6m ago' },
    { id:'a3',  type:'stake',   fromHandle:'jade_l',   fromName:'Jade L.',  fromColor:'#a855f7', qty:50,  price:8.70, total:435.00, ts:'14:15', ago:'19m ago'  },
    { id:'a4',  type:'sell',    fromHandle:'noa_d',    fromName:'Noa D.',   fromColor:'#f59e0b', qty:5,   price:8.68, total:43.40,  ts:'14:01', ago:'33m ago'  },
    { id:'a5',  type:'buy',     fromHandle:'max_t',    fromName:'Max T.',   fromColor:'#ec4899', qty:30,  price:8.65, total:259.50, ts:'13:45', ago:'49m ago'  },
    { id:'a6',  type:'reward',  fromHandle:'sovereign_v',fromName:'Sovereign V',fromColor:'#a855f7',qty:0, price:0, total:24.80, ts:'08:00', ago:'6h ago', toHandle:'atlas_k', toName:'Atlas K' },
    { id:'a7',  type:'stake',   fromHandle:'luna_w',   fromName:'Luna W.',  fromColor:'#f87171', qty:25,  price:8.60, total:215.00, ts:'11:20', ago:'3h ago'   },
    { id:'a8',  type:'buy',     fromHandle:'kai_r',    fromName:'Kai R.',   fromColor:'#22c55e', qty:10,  price:8.55, total:85.50,  ts:'10:05', ago:'4h ago'   },
    { id:'a9',  type:'listing', fromHandle:'marco_v',  fromName:'Marco V.', fromColor:'#f87171', qty:8,   price:8.90, total:71.20,  ts:'09:30', ago:'5h ago'   },
    { id:'a10', type:'unstake', fromHandle:'dex_n',    fromName:'Dex N.',   fromColor:'#818cf8', qty:15,  price:8.75, total:131.25, ts:'08:45', ago:'6h ago'   },
  ],
}

const TYPE_ICON: Record<ActivityType, string>  = { buy:'↓', sell:'↑', stake:'🔒', unstake:'🔓', tip:'💸', reward:'⭐', listing:'🏷' }
const TYPE_LABEL: Record<ActivityType, string> = { buy:'Bought', sell:'Sold', stake:'Staked', unstake:'Unstaked', tip:'Tipped', reward:'Rewarded', listing:'Listed' }
const TYPE_COLOR: Record<ActivityType, string> = {
  buy:'#22c55e', sell:'#f87171', stake:'#f59e0b', unstake:'#f59e0b',
  tip:'#ec4899', reward:'#818cf8', listing:'#a855f7',
}

export default function TokenActivityPage() {
  const router = useRouter()
  const params = useParams()
  const symbol   = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : 'SVRN'
  const token    = TOKENS[symbol] ?? TOKENS.SVRN
  const activity = TOKEN_ACTIVITY[symbol] ?? TOKEN_ACTIVITY.SVRN

  const [filter, setFilter] = useState<'all' | ActivityType>('all')

  const visible = activity.filter(a => filter === 'all' || a.type === filter)

  const vol24h   = activity.reduce((s,a) => s + a.total, 0)
  const buys24h  = activity.filter(a => a.type === 'buy').length
  const sells24h = activity.filter(a => a.type === 'sell').length

  const FILTER_TYPES: ('all' | ActivityType)[] = ['all', 'buy', 'sell', 'stake', 'tip', 'reward']

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
            <div className="font-black text-white">${symbol} Activity</div>
            <div className="text-xs text-white/30">{token.name}</div>
          </div>
          <button onClick={() => router.push(`/tokens/${symbol}/chart`)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: `${token.color}15`, color: token.color }}>
            Chart
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 capitalize"
              style={filter === t ? { background: token.color, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t === 'all' ? 'All' : `${TYPE_ICON[t]} ${TYPE_LABEL[t]}`}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'24h Volume', value:`$${vol24h.toFixed(0)}`,   color:token.color },
            { label:'Buys',       value:buys24h,                    color:'#22c55e'   },
            { label:'Sells',      value:sells24h,                   color:'#f87171'   },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div className="space-y-2">
          {visible.map(a => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-2xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${TYPE_COLOR[a.type]}12`, color: TYPE_COLOR[a.type] }}>
                {TYPE_ICON[a.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button onClick={() => router.push(`/profile/${a.fromHandle}`)}
                    className="font-bold" style={{ color: a.fromColor }}>
                    @{a.fromHandle}
                  </button>
                  <span className="text-white/35">{TYPE_LABEL[a.type]}</span>
                  {a.qty > 0 && <span className="font-bold" style={{ color: token.color }}>{a.qty} ${symbol}</span>}
                  {a.toHandle && (
                    <>
                      <span className="text-white/25">→</span>
                      <button onClick={() => router.push(`/profile/${a.toHandle}`)}
                        className="font-bold" style={{ color: a.fromColor }}>
                        @{a.toHandle}
                      </button>
                    </>
                  )}
                </div>
                <div className="text-xs text-white/20 mt-0.5">
                  {a.qty > 0 && `@ $${a.price.toFixed(2)} · `}{a.ago}
                </div>
              </div>
              <div className="font-black text-sm flex-shrink-0" style={{ color: TYPE_COLOR[a.type] }}>
                ${a.total.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
