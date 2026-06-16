'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PAYOUT_METHODS = [
  { id: 'bank',  icon: '🏦', label: 'Bank Transfer', detail: 'Chase ••4421',          verified: true,  primary: true  },
  { id: 'usdc',  icon: '💠', label: 'USDC Wallet',   detail: '0x9f3a…b421',           verified: true,  primary: false },
  { id: 'paypal',icon: '💳', label: 'PayPal',        detail: 'scott@goldrusher.com',  verified: false, primary: false },
]

const EARNINGS_HISTORY = [
  { id: 'p1', date: '2026-06-01', type: 'ad_revenue', amount: 128.50, status: 'paid',    method: 'Bank' },
  { id: 'p2', date: '2026-06-01', type: 'staking',    amount: 42.80,  status: 'paid',    method: 'Bank' },
  { id: 'p3', date: '2026-06-01', type: 'referrals',  amount: 25.00,  status: 'paid',    method: 'Bank' },
  { id: 'p4', date: '2026-05-01', type: 'ad_revenue', amount: 95.20,  status: 'paid',    method: 'USDC' },
  { id: 'p5', date: '2026-05-01', type: 'staking',    amount: 38.40,  status: 'paid',    method: 'USDC' },
  { id: 'p6', date: '2026-04-01', type: 'ad_revenue', amount: 74.00,  status: 'paid',    method: 'Bank' },
  { id: 'p7', date: '2026-04-01', type: 'staking',    amount: 29.10,  status: 'paid',    method: 'Bank' },
]

const PENDING = [
  { type: 'ad_revenue', label: 'Ad Revenue — NovaTech',  amount: 74.20,  availableOn: '2026-06-20' },
  { type: 'staking',    label: 'Staking reward (June)',   amount: 44.90,  availableOn: '2026-06-22' },
  { type: 'referrals',  label: 'Referral bonuses',        amount: 10.00,  availableOn: '2026-06-25' },
]

const TYPE_COLORS: Record<string, string> = {
  ad_revenue: '#a855f7',
  staking:    '#22c55e',
  referrals:  '#818cf8',
  token_sale: '#f59e0b',
}

const TYPE_ICONS: Record<string, string> = {
  ad_revenue: '📢',
  staking:    '🔒',
  referrals:  '🔗',
  token_sale: '🪙',
}

export default function CreatorPayoutsPage() {
  const router = useRouter()
  const [schedule, setSchedule] = useState<'monthly' | 'weekly' | 'instant'>('monthly')
  const [threshold, setThreshold] = useState('50')
  const [primaryMethod, setPrimaryMethod] = useState('bank')
  const [saved, setSaved] = useState(false)

  const pendingTotal = PENDING.reduce((s, p) => s + p.amount, 0)
  const paidTotal = EARNINGS_HISTORY.filter(h => h.status === 'paid').reduce((s, h) => s + h.amount, 0)

  async function saveSettings() {
    await new Promise(r => setTimeout(r, 700))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
          <div className="font-black text-white flex-1">Payouts</div>
          <button onClick={() => router.push('/creator/analytics')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
            Analytics →
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Balance overview */}
        <div className="p-5 rounded-2xl text-center"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(168,85,247,0.06))', border: '1px solid rgba(34,197,94,0.15)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Pending Payout</div>
          <div className="text-4xl font-black text-white mb-1">${pendingTotal.toFixed(2)}</div>
          <div className="text-xs text-white/30 mb-4">across {PENDING.length} earnings categories</div>
          <button className="px-6 py-2.5 rounded-xl font-black text-sm transition-all"
            style={{ background: '#22c55e', color: '#04040A' }}>
            Request Payout Now
          </button>
          <div className="text-xs text-white/20 mt-2">or wait for next scheduled payout</div>
        </div>

        {/* Pending breakdown */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Pending Breakdown</div>
          {PENDING.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <span className="text-lg flex-shrink-0">{TYPE_ICONS[p.type] ?? '💰'}</span>
              <div className="flex-1">
                <div className="text-sm text-white/75">{p.label}</div>
                <div className="text-xs text-white/30">Available {new Date(p.availableOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="font-black text-sm" style={{ color: TYPE_COLORS[p.type] ?? '#22c55e' }}>
                +${p.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Payout settings */}
        <div className="space-y-3">
          <div className="text-xs text-white/30 uppercase tracking-widest">Payout Settings</div>

          <div className="space-y-1.5">
            <div className="text-xs text-white/35 font-semibold">Schedule</div>
            <div className="flex gap-2">
              {[
                { id: 'monthly', label: 'Monthly' },
                { id: 'weekly',  label: 'Weekly'  },
                { id: 'instant', label: 'Instant'  },
              ].map(s => (
                <button key={s.id} onClick={() => setSchedule(s.id as typeof schedule)}
                  className="flex-1 py-2 rounded-xl text-sm font-black transition-all"
                  style={schedule === s.id
                    ? { background: '#a855f7', color: '#04040A' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  {s.label}
                </button>
              ))}
            </div>
            {schedule === 'instant' && (
              <div className="text-xs text-white/30 px-1">
                Instant payouts incur a 1% fee (max $10). Payouts trigger when your balance exceeds the threshold.
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs text-white/35 font-semibold">Minimum Payout Threshold</div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/6 bg-white/5">
              <span className="text-white/30">$</span>
              <input value={threshold} onChange={e => setThreshold(e.target.value.replace(/\D/g, ''))}
                className="flex-1 text-white bg-transparent outline-none text-sm" />
              <span className="text-xs text-white/25">USDC</span>
            </div>
          </div>
        </div>

        {/* Payout methods */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Payout Methods</div>
          {PAYOUT_METHODS.map(m => (
            <button key={m.id} onClick={() => setPrimaryMethod(m.id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all"
              style={primaryMethod === m.id
                ? { background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }
                : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-xl flex-shrink-0">{m.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white/80">{m.label}</span>
                  {m.verified
                    ? <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Verified</span>
                    : <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Pending</span>
                  }
                </div>
                <div className="text-xs text-white/30 font-mono">{m.detail}</div>
              </div>
              {primaryMethod === m.id && <span style={{ color: '#a855f7', fontSize: 18 }}>✓</span>}
            </button>
          ))}
          <button className="w-full py-2.5 rounded-xl text-sm font-bold border border-dashed border-white/10 text-white/30 hover:text-white/50 hover:border-white/20 transition-all">
            + Add payment method
          </button>
        </div>

        <button onClick={saveSettings}
          className="w-full py-3.5 rounded-2xl font-black transition-all"
          style={{ background: saved ? '#22c55e' : '#a855f7', color: '#04040A' }}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        {/* History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/30 uppercase tracking-widest">Payout History</div>
            <div className="text-xs text-white/30">Total ${paidTotal.toFixed(2)}</div>
          </div>
          {EARNINGS_HISTORY.map(h => (
            <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <span className="text-base flex-shrink-0">{TYPE_ICONS[h.type] ?? '💰'}</span>
              <div className="flex-1">
                <div className="text-sm text-white/65 capitalize">{h.type.replace('_', ' ')}</div>
                <div className="text-xs text-white/25">{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {h.method}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm" style={{ color: '#22c55e' }}>+${h.amount.toFixed(2)}</div>
                <div className="text-xs" style={{ color: '#22c55e' }}>Paid</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
