'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const WATCHLIST_TOKENS = [
  { symbol: 'SOVV', name: 'Sovereign V',  handle: 'sovereign_v', color: '#a855f7', price: 12.40, change24h: +8.2,  high24h: 13.10, low24h: 11.20, alert: 15.00, vol24h: 84200 },
  { symbol: 'MAYA', name: 'Maya Chen',    handle: 'mayafit',     color: '#22c55e', price: 6.60,  change24h: +12.3, high24h: 7.10,  low24h: 5.80,  alert: null,   vol24h: 61800 },
  { symbol: 'ZERO', name: 'ZeroNode',     handle: 'zeronode',    color: '#818cf8', price: 3.20,  change24h: +5.5,  high24h: 3.45,  low24h: 2.95,  alert: 5.00,   vol24h: 29600 },
  { symbol: 'APEX', name: 'Luna Apex',    handle: 'luna_apex',   color: '#f59e0b', price: 9.10,  change24h: -2.1,  high24h: 9.80,  low24h: 8.80,  alert: null,   vol24h: 18400 },
]

function MiniSparkline({ color }: { color: string }) {
  // Static sparkline shape per color — deterministic
  const seed = color.charCodeAt(1)
  const h = 30, w = 80
  const pts = Array.from({ length: 8 }, (_, i) => {
    const y = h / 2 + Math.sin((i + seed) * 0.9) * 10 + Math.cos(i * 1.3) * 5
    return `${(i / 7) * w},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={80} height={30} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity={0.8} />
    </svg>
  )
}

export default function WatchlistPage() {
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['SOVV', 'MAYA', 'ZERO', 'APEX']))
  const [alerts, setAlerts] = useState<Record<string, number | null>>({
    SOVV: 15.00, MAYA: null, ZERO: 5.00, APEX: null,
  })
  const [settingAlert, setSettingAlert] = useState<string | null>(null)
  const [alertInput, setAlertInput] = useState('')
  const [txMsg, setTxMsg] = useState<string | null>(null)

  function removeFromWatchlist(sym: string) {
    setWatchlist(prev => { const n = new Set(prev); n.delete(sym); return n })
    setTxMsg(`Removed ${sym} from watchlist`)
    setTimeout(() => setTxMsg(null), 3000)
  }

  function saveAlert(sym: string) {
    const val = parseFloat(alertInput)
    if (!isNaN(val) && val > 0) {
      setAlerts(prev => ({ ...prev, [sym]: val }))
      setTxMsg(`Alert set for ${sym} at $${val.toFixed(2)}`)
      setTimeout(() => setTxMsg(null), 3000)
    }
    setSettingAlert(null)
    setAlertInput('')
  }

  const tokens = WATCHLIST_TOKENS.filter(t => watchlist.has(t.symbol))

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">PRICE TRACKING</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Watchlist</h1>
          </div>
          <button onClick={() => router.push('/tokens')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: '#a855f718', color: '#a855f7', border: '1px solid #a855f725' }}>
            + Add
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {tokens.length === 0 && (
          <div className="text-center py-16 text-white/25 text-sm">
            Watchlist empty.<br/>
            <button onClick={() => router.push('/tokens')} className="text-purple-400 hover:text-purple-300 mt-2 transition-colors">Browse tokens →</button>
          </div>
        )}

        {tokens.map(t => {
          const alert = alerts[t.symbol]
          return (
            <div key={t.symbol} className="p-4 rounded-2xl border border-white/6"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${t.color}14`, color: t.color }}>{t.symbol[0]}</div>
                  <div>
                    <button onClick={() => router.push(`/profile/${t.handle}`)}
                      className="text-sm font-bold text-white/85 hover:text-white transition-colors">{t.name}</button>
                    <div className="text-xs text-white/30">${t.symbol}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MiniSparkline color={t.color} />
                  <div className="text-right">
                    <div className="font-black text-white">${t.price}</div>
                    <div className={`text-xs font-semibold ${t.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.change24h >= 0 ? '+' : ''}{t.change24h}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                {[
                  { label: '24h High', val: `$${t.high24h}`, color: '#22c55e' },
                  { label: '24h Low',  val: `$${t.low24h}`,  color: '#f87171' },
                  { label: 'Vol 24h',  val: `$${(t.vol24h/1000).toFixed(0)}k`, color: '#94a3b8' },
                ].map(m => (
                  <div key={m.label} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-xs font-bold" style={{ color: m.color }}>{m.val}</div>
                    <div className="text-xs text-white/25">{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {alert ? (
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <span style={{ color: '#f59e0b' }}>🔔</span>
                    <span style={{ color: '#f59e0b' }}>Alert at ${alert.toFixed(2)}</span>
                    <button onClick={() => { setAlerts(prev => ({ ...prev, [t.symbol]: null })) }}
                      className="ml-auto text-white/25 hover:text-white/50 transition-colors">✕</button>
                  </div>
                ) : (
                  <button onClick={() => { setSettingAlert(t.symbol); setAlertInput('') }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white/35 hover:text-white/55 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    + Set Price Alert
                  </button>
                )}
                <button onClick={() => router.push('/invest')}
                  className="px-4 py-2 rounded-lg font-bold text-xs"
                  style={{ background: t.color, color: '#04040A' }}>Buy</button>
                <button onClick={() => removeFromWatchlist(t.symbol)}
                  className="px-3 py-2 rounded-lg text-xs text-white/25 hover:text-white/50 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>✕</button>
              </div>
            </div>
          )
        })}

        <button onClick={() => router.push('/signals')}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.15)' }}>
          View AI Signals ↗
        </button>
      </div>

      {settingAlert && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setSettingAlert(null)}>
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4"
            style={{ background: '#0d0d1a' }} onClick={e => e.stopPropagation()}>
            <div className="font-bold text-white">Set Price Alert — ${settingAlert}</div>
            <p className="text-sm text-white/40">Get notified when ${settingAlert} reaches your target price.</p>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">$</span>
              <input value={alertInput} onChange={e => setAlertInput(e.target.value)}
                type="number" placeholder="Target price…"
                className="flex-1 px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/25 outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => saveAlert(settingAlert!)}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#f59e0b', color: '#04040A' }}>
                Set Alert
              </button>
              <button onClick={() => setSettingAlert(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
