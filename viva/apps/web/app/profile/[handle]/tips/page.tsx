'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Tip {
  id: string
  from: string
  fromColor: string
  fromVerified: boolean
  amount: number
  currency: string
  message?: string
  ts: string
  txType: 'received' | 'sent'
}

const PROFILE_TIPS: Record<string, { received: Tip[]; sent: Tip[] }> = {
  sovereign_v: {
    received: [
      { id: 't1', from: 'atlas_k',  fromColor: '#818cf8', fromVerified: true,  amount: 50,  currency: 'USDC', message: 'Amazing DeFi breakdown, keep it up 🔥', ts: '2h', txType: 'received' },
      { id: 't2', from: 'luna_w',   fromColor: '#f87171', fromVerified: false, amount: 20,  currency: 'USDC', message: 'That BTC analysis was 🎯',                ts: '5h', txType: 'received' },
      { id: 't3', from: 'noa_d',    fromColor: '#f59e0b', fromVerified: false, amount: 10,  currency: 'USDC', ts: '1d', txType: 'received' },
      { id: 't4', from: 'kai_r',    fromColor: '#22c55e', fromVerified: false, amount: 100, currency: 'USDC', message: 'Best signal on VIVA no cap',              ts: '2d', txType: 'received' },
      { id: 't5', from: 'marco_v',  fromColor: '#f87171', fromVerified: false, amount: 25,  currency: 'USDC', ts: '3d', txType: 'received' },
      { id: 't6', from: 'jade_l',   fromColor: '#a855f7', fromVerified: false, amount: 5,   currency: 'USDC', message: 'Love the content!',                       ts: '4d', txType: 'received' },
    ],
    sent: [
      { id: 't7', from: 'mayafit',  fromColor: '#22c55e', fromVerified: true,  amount: 30, currency: 'USDC', message: 'Great workout content!', ts: '1d', txType: 'sent' },
      { id: 't8', from: 'jaxbeats', fromColor: '#ec4899', fromVerified: true,  amount: 15, currency: 'USDC', ts: '5d', txType: 'sent' },
    ],
  },
  mayafit: {
    received: [
      { id: 't9',  from: 'sovereign_v', fromColor: '#a855f7', fromVerified: true,  amount: 30, currency: 'USDC', message: 'Crushing it!', ts: '1d', txType: 'received' },
      { id: 't10', from: 'atlas_k',     fromColor: '#818cf8', fromVerified: true,  amount: 20, currency: 'USDC', ts: '3d', txType: 'received' },
    ],
    sent: [],
  },
}

const PROFILE_COLORS: Record<string, string> = { sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899' }

const PRESETS = [5, 10, 25, 50, 100]

export default function ProfileTipsPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const data = PROFILE_TIPS[handle] ?? PROFILE_TIPS.sovereign_v
  const accentColor = PROFILE_COLORS[handle] ?? '#a855f7'

  const [tab, setTab] = useState<'received' | 'sent' | 'send'>('received')
  const [tipAmt, setTipAmt] = useState('')
  const [tipMsg, setTipMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const totalReceived = data.received.reduce((a, t) => a + t.amount, 0)
  const totalSent = data.sent.reduce((a, t) => a + t.amount, 0)

  async function sendTip() {
    if (!tipAmt || Number(tipAmt) <= 0) return
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    setSending(false)
    setSent(true)
    setTimeout(() => { setSent(false); setTipAmt(''); setTipMsg(''); setTab('received') }, 2500)
  }

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
            <div className="font-black text-white">Tips</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
          <button onClick={() => setTab('send')}
            className="px-3 py-1.5 rounded-xl text-xs font-black"
            style={{ background: accentColor, color: '#04040A' }}>
            💸 Send Tip
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-3 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-lg" style={{ color: '#22c55e' }}>${totalReceived}</div>
            <div className="text-xs text-white/25">Received</div>
          </div>
          <div className="p-3 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="font-black text-lg text-white/60">${totalSent}</div>
            <div className="text-xs text-white/25">Sent</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {(['received', 'sent', 'send'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
              style={tab === t ? { background: accentColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {t === 'send' ? '💸 Send' : t}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Tip list */}
        {(tab === 'received' || tab === 'sent') && (
          <div className="space-y-2">
            {(tab === 'received' ? data.received : data.sent).map(tip => (
              <div key={tip.id} className="p-3 rounded-2xl border border-white/4" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${tip.fromColor}15`, color: tip.fromColor }}>
                    {tip.from[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-white/75">@{tip.from}</span>
                      {tip.fromVerified && <span className="text-xs" style={{ color: tip.fromColor }}>✓</span>}
                    </div>
                    <div className="text-xs text-white/25">{tip.ts} ago</div>
                  </div>
                  <div className="font-black text-base" style={{ color: tab === 'received' ? '#22c55e' : '#f87171' }}>
                    {tab === 'received' ? '+' : '-'}${tip.amount}
                  </div>
                </div>
                {tip.message && (
                  <div className="mt-2 ml-11 text-xs text-white/40 italic">"{tip.message}"</div>
                )}
              </div>
            ))}
            {(tab === 'received' ? data.received : data.sent).length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">💸</div>
                <div className="text-sm text-white/30">No tips yet</div>
              </div>
            )}
          </div>
        )}

        {/* Send tip form */}
        {tab === 'send' && (
          <div className="space-y-4">
            {sent ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🎉</div>
                <div className="font-black text-xl text-white">Tip Sent!</div>
                <div className="text-sm text-white/35 mt-1">${tipAmt} USDC → @{handle}</div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Amount (USDC)</div>
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {PRESETS.map(p => (
                      <button key={p} onClick={() => setTipAmt(String(p))}
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={tipAmt === String(p) ? { background: accentColor, color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                        ${p}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/6">
                    <span className="text-white/30 text-sm">$</span>
                    <input value={tipAmt} onChange={e => setTipAmt(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="Custom amount"
                      className="flex-1 text-sm text-white placeholder-white/20 bg-transparent outline-none" />
                    <span className="text-xs text-white/25">USDC</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Message (optional)</div>
                  <textarea value={tipMsg} onChange={e => setTipMsg(e.target.value)}
                    placeholder="Say something nice…"
                    rows={3}
                    className="w-full text-sm text-white placeholder-white/20 bg-transparent outline-none resize-none" />
                  <div className="text-right text-xs" style={{ color: tipMsg.length > 120 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                    {tipMsg.length}/140
                  </div>
                </div>

                <button onClick={sendTip} disabled={!tipAmt || Number(tipAmt) <= 0 || sending}
                  className="w-full py-3.5 rounded-xl font-black text-sm disabled:opacity-30"
                  style={{ background: accentColor, color: '#04040A' }}>
                  {sending ? 'Sending…' : `💸 Send $${tipAmt || '0'} Tip`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
