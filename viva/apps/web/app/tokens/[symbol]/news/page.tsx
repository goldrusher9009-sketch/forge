'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type NewsType = 'post' | 'price_alert' | 'holder_milestone' | 'staking' | 'drop' | 'live'

interface NewsItem {
  id: string
  type: NewsType
  title: string
  body: string
  ts: string
  ago: string
  pinned?: boolean
}

const TOKEN_NEWS: Record<string, { name:string; color:string; price:number; change24h:number; items:NewsItem[] }> = {
  SVRN: {
    name:'Sovereign V', color:'#a855f7', price:8.75, change24h:4.2,
    items:[
      { id:'n1',  type:'price_alert',       title:'$SVRN up 4.2% today',                  body:'New 2-week high of $8.75. Volume surged 180% vs yesterday. Strong accumulation pattern forming.',       ts:'Jun 16, 09:14', ago:'2h',   pinned:true  },
      { id:'n2',  type:'post',              title:'New post: BTC accumulation zone',        body:'Sovereign V just dropped a new analysis post on Bitcoin\'s weekly RSI divergence.',                   ts:'Jun 16, 07:30', ago:'4h'               },
      { id:'n3',  type:'staking',           title:'New Diamond staker joined',              body:'@jade_l staked 105 $SVRN, reaching Diamond tier. Total Diamond TVL now $718k.',                       ts:'Jun 16, 06:00', ago:'5h'               },
      { id:'n4',  type:'holder_milestone',  title:'2,840 holders milestone reached!',       body:'$SVRN now has 2,840 unique holders — up 12% this month. New milestone badge unlocked.',              ts:'Jun 15, 20:00', ago:'15h'              },
      { id:'n5',  type:'live',              title:'DeFi Alpha Room — NOW LIVE',             body:'Sovereign V is live discussing macro and on-chain signals. 284 listeners.',                            ts:'Jun 15, 18:00', ago:'17h'              },
      { id:'n6',  type:'drop',              title:'New signal pack released',               body:'Exclusive Jun 2026 signal pack available for Gold+ holders. 12 setups inside.',                        ts:'Jun 15, 14:00', ago:'21h'              },
      { id:'n7',  type:'post',              title:'New post: ETH accumulation pattern',     body:'Deep dive into Ethereum\'s weekly structure and why $3,800 is the key level.',                        ts:'Jun 15, 11:00', ago:'1d'               },
      { id:'n8',  type:'staking',           title:'Weekly staking rewards distributed',     body:'$1,840 in staking rewards sent to 198 stakers. APY rates unchanged.',                                 ts:'Jun 14, 09:00', ago:'2d'               },
      { id:'n9',  type:'price_alert',       title:'$SVRN bounced off $8.00 support',        body:'$SVRN tested $8.00 and recovered strongly. RSI bounced from 42 — bullish divergence.',               ts:'Jun 13, 16:00', ago:'2d'               },
      { id:'n10', type:'post',              title:'New post: Altcoin season indicator',     body:'Updated TOTAL2 dominance chart — altcoin season may begin in 2–4 weeks.',                             ts:'Jun 12, 13:00', ago:'3d'               },
    ]
  },
  MAYA: {
    name:'Maya Chen', color:'#22c55e', price:5.20, change24h:-1.8,
    items:[
      { id:'m1', type:'post',             title:'30-day transformation post is live', body:'Maya dropped her full 30-day breakdown — 412 likes in the first hour.',  ts:'Jun 16, 07:00', ago:'4h',  pinned:true },
      { id:'m2', type:'price_alert',      title:'$MAYA -1.8% today',                 body:'Minor pullback after 3 green days. Support at $4.90 holding.',            ts:'Jun 16, 09:00', ago:'2h'              },
      { id:'m3', type:'holder_milestone', title:'1,600 holder milestone!',            body:'$MAYA crossed 1,600 unique holders — 8% growth this month.',              ts:'Jun 14, 12:00', ago:'2d'              },
      { id:'m4', type:'staking',          title:'New Gold staker joined',             body:'80 $MAYA staked at Gold tier (22% APY). TVL up another $416.',            ts:'Jun 13, 15:00', ago:'2d'              },
    ]
  },
  JAX: {
    name:'Jax Beats', color:'#ec4899', price:3.80, change24h:7.1,
    items:[
      { id:'j1', type:'price_alert', title:'$JAX up 7.1% today 🔥',           body:'Strong move on beat pack drop announcement. Highest daily volume in 3 weeks.', ts:'Jun 16, 11:00', ago:'1h', pinned:true },
      { id:'j2', type:'drop',        title:'New beat pack dropping Friday',    body:'12-track exclusive for $JAX holders. Silver tier gets first access.',          ts:'Jun 16, 08:00', ago:'3h'              },
      { id:'j3', type:'live',        title:'Beats & Vibes room — replay up',   body:'Missed the live session? Replay now available for Bronze+ holders.',           ts:'Jun 15, 22:00', ago:'13h'             },
    ]
  }
}

const TYPE_ICON: Record<NewsType, string>  = { post:'📝', price_alert:'📈', holder_milestone:'🏆', staking:'🔒', drop:'💎', live:'🔴' }
const TYPE_COLOR: Record<NewsType, string> = {
  post:'rgba(255,255,255,0.3)', price_alert:'#22c55e', holder_milestone:'#f59e0b',
  staking:'#f59e0b', drop:'#818cf8', live:'#f87171',
}

export default function TokenNewsPage() {
  const router = useRouter()
  const params = useParams()
  const symbol  = typeof params.symbol === 'string' ? params.symbol : 'SVRN'
  const token   = TOKEN_NEWS[symbol] ?? TOKEN_NEWS.SVRN
  const accent  = token.color

  const [filter, setFilter] = useState<'all' | NewsType>('all')

  const visible = token.items.filter(n => filter === 'all' || n.type === filter)
  const FILTERS = [
    { key:'all',               label:'All'        },
    { key:'post',              label:'Posts'      },
    { key:'price_alert',       label:'Price'      },
    { key:'staking',           label:'Staking'    },
    { key:'holder_milestone',  label:'Milestones' },
    { key:'drop',              label:'Drops'      },
  ] as const

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
            <div className="font-black text-white">${symbol} News</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">{token.name}</span>
              <span className="text-xs font-bold" style={{ color: token.change24h >= 0 ? '#22c55e':'#f87171' }}>
                {token.change24h >= 0 ? '+':''}{token.change24h}% today
              </span>
            </div>
          </div>
          <div className="font-black text-sm" style={{ color: accent }}>${token.price}</div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={filter === f.key ? { background:accent, color:'#04040A' } : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="divide-y divide-white/5">
        {visible.map(n => (
          <div key={n.id} className="px-4 py-4"
            style={n.pinned ? { background:'rgba(255,255,255,0.01)' } : {}}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background:`${TYPE_COLOR[n.type]}10` }}>
                {TYPE_ICON[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {n.pinned && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background:`${accent}15`, color:accent }}>📌 Pinned</span>}
                    <span className="font-bold text-sm text-white/85">{n.title}</span>
                  </div>
                  <span className="text-xs text-white/20 flex-shrink-0">{n.ago}</span>
                </div>
                <div className="text-xs text-white/40 leading-relaxed">{n.body}</div>
                <div className="text-xs text-white/15 mt-1">{n.ts}</div>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && <div className="text-center py-12 text-white/25">No news</div>}
      </div>
    </div>
  )
}
