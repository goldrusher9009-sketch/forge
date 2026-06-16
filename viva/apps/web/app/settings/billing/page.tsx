'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CURRENT_PLAN = {
  id: 'pro',
  name: 'Pro',
  price: 9.99,
  period: 'monthly',
  color: '#a855f7',
  renewsAt: '2026-07-15',
  features: ['Unlimited follows', 'Token analytics', 'Silver staking', 'Ad revenue sharing (5%)', '10 marketplace listings'],
}

const PLANS = [
  { id: 'free',    name: 'Free',    price: 0,    color: '#94a3b8', desc: 'Basic access. Hold tokens.' },
  { id: 'pro',     name: 'Pro',     price: 9.99, color: '#a855f7', desc: 'Full analytics, earn from ads.', highlight: true },
  { id: 'diamond', name: 'Diamond', price: 29.99,color: '#818cf8', desc: 'Launch token, max yield (35%).' },
]

const PAYMENT_METHODS = [
  { id: 'pm1', type: 'card',   last4: '4242', brand: 'Visa',       exp: '12/27', isDefault: true  },
  { id: 'pm2', type: 'card',   last4: '1234', brand: 'Mastercard', exp: '06/26', isDefault: false },
  { id: 'pm3', type: 'crypto', addr: '0x4f2a…b8d3',              label: 'MetaMask', isDefault: false },
]

const INVOICES = [
  { id: 'inv1', date: '2026-06-01', desc: 'Pro Plan — June 2026',  amount: 9.99,  status: 'paid' },
  { id: 'inv2', date: '2026-05-01', desc: 'Pro Plan — May 2026',   amount: 9.99,  status: 'paid' },
  { id: 'inv3', date: '2026-04-01', desc: 'Pro Plan — April 2026', amount: 9.99,  status: 'paid' },
]

export default function BillingPage() {
  const router = useRouter()
  const [changingPlan, setChangingPlan] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(CURRENT_PLAN.id)
  const [confirming, setConfirming] = useState(false)
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  async function confirmPlanChange() {
    setConfirming(true)
    await new Promise(r => setTimeout(r, 1000))
    setConfirming(false)
    setChangingPlan(false)
    setTxMsg(`Plan updated to ${PLANS.find(p => p.id === selectedPlan)?.name}`)
    setTimeout(() => setTxMsg(null), 3500)
  }

  async function cancelPlan() {
    await new Promise(r => setTimeout(r, 800))
    setCancelConfirm(false)
    setTxMsg('Subscription cancelled. Access continues until Jul 15, 2026.')
    setTimeout(() => setTxMsg(null), 5000)
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
          <div className="font-bold text-white">Billing & Plan</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {/* Current plan */}
        <div className="p-4 rounded-2xl border space-y-3"
          style={{ background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Current Plan</div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl" style={{ color: CURRENT_PLAN.color }}>{CURRENT_PLAN.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${CURRENT_PLAN.color}20`, color: CURRENT_PLAN.color }}>Active</span>
              </div>
              <div className="text-sm text-white/40">${CURRENT_PLAN.price}/mo · Renews {CURRENT_PLAN.renewsAt}</div>
            </div>
            <button onClick={() => setChangingPlan(!changingPlan)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              Change
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CURRENT_PLAN.features.map(f => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: `${CURRENT_PLAN.color}10`, color: CURRENT_PLAN.color }}>✓ {f}</span>
            ))}
          </div>
        </div>

        {/* Plan switcher */}
        {changingPlan && (
          <div className="p-4 rounded-2xl border border-white/8 space-y-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
            <div className="text-xs text-white/30 uppercase tracking-widest">Choose Plan</div>
            {PLANS.map(p => (
              <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                style={selectedPlan === p.id
                  ? { background: `${p.color}10`, borderColor: `${p.color}40` }
                  : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: `${p.color}18`, color: p.color }}>{p.name[0]}</div>
                <div className="flex-1">
                  <div className="font-bold text-white/80 text-sm">{p.name}</div>
                  <div className="text-xs text-white/30">{p.desc}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm" style={{ color: p.color }}>
                    {p.price === 0 ? 'Free' : `$${p.price}`}
                  </div>
                  {p.price > 0 && <div className="text-xs text-white/25">/mo</div>}
                </div>
              </button>
            ))}
            <button onClick={confirmPlanChange} disabled={confirming || selectedPlan === CURRENT_PLAN.id}
              className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              {confirming ? 'Updating…' : `Switch to ${PLANS.find(p => p.id === selectedPlan)?.name}`}
            </button>
          </div>
        )}

        {/* Token holder note */}
        <div className="p-3 rounded-xl border border-white/5 text-xs text-white/30"
          style={{ background: 'rgba(255,255,255,0.01)' }}>
          💎 Hold 100+ creator tokens → Diamond tier auto-unlocked, no subscription needed.{' '}
          <button onClick={() => router.push('/tokens')} style={{ color: '#a855f7' }}>Browse tokens →</button>
        </div>

        {/* Payment methods */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/30 uppercase tracking-widest">Payment Methods</div>
            <button className="text-xs font-bold" style={{ color: '#a855f7' }}>+ Add</button>
          </div>
          {PAYMENT_METHODS.map(pm => (
            <div key={pm.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/6"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {pm.type === 'card' ? '💳' : '🦊'}
              </div>
              <div className="flex-1">
                {pm.type === 'card'
                  ? <><div className="text-sm font-bold text-white/80">{pm.brand} ···· {pm.last4}</div>
                      <div className="text-xs text-white/30">Expires {pm.exp}</div></>
                  : <><div className="text-sm font-bold text-white/80">{pm.label}</div>
                      <div className="text-xs text-white/30 font-mono">{pm.addr}</div></>
                }
              </div>
              {pm.isDefault
                ? <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Default</span>
                : <button className="text-xs text-white/25 hover:text-white/50 transition-colors">Set default</button>
              }
            </div>
          ))}
        </div>

        {/* Invoice history */}
        <div className="space-y-3">
          <div className="text-xs text-white/30 uppercase tracking-widest">Invoice History</div>
          <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.018)' }}>
            {INVOICES.map((inv, i) => (
              <div key={inv.id} className={`flex items-center px-4 py-3 gap-3 ${i < INVOICES.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="flex-1">
                  <div className="text-sm text-white/70">{inv.desc}</div>
                  <div className="text-xs text-white/25">{inv.date}</div>
                </div>
                <div className="text-sm font-black text-white">${inv.amount}</div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Paid</span>
                <button className="text-xs text-white/25 hover:text-white/50 transition-colors">PDF</button>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel subscription */}
        <div className="pt-4 border-t border-white/5">
          {!cancelConfirm
            ? <button onClick={() => setCancelConfirm(true)}
                className="w-full py-3 rounded-xl text-xs font-bold text-red-400 border border-red-500/15 hover:border-red-500/30 transition-all"
                style={{ background: 'rgba(248,113,113,0.04)' }}>
                Cancel Subscription
              </button>
            : <div className="space-y-2">
                <div className="text-sm text-white/60 text-center">Cancel Pro plan? You'll keep access until Jul 15, 2026.</div>
                <div className="flex gap-2">
                  <button onClick={() => setCancelConfirm(false)}
                    className="flex-1 py-3 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>Keep Plan</button>
                  <button onClick={cancelPlan}
                    className="flex-1 py-3 rounded-xl text-xs font-bold text-red-400 border border-red-500/30"
                    style={{ background: 'rgba(248,113,113,0.08)' }}>Yes, Cancel</button>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
