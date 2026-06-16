'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Mock creator data ────────────────────────────────────────────────────────
const CREATOR = {
  name: 'Sovereign V', handle: 'sovereign_v', symbol: 'SOVV', tier: 'Guardian',
  vScore: 980, price: 12.40, supply: 10000, holders: 420, mcap: 124000,
  totalEarned: 8420.50, monthEarned: 1240.00, adSlots: 3, slotsUsed: 1,
  reach: 41160, engagement: 9.2,
}

const AD_SLOTS = [
  { id: 'slot1', label: 'Banner Top',     occupied: true,  brand: 'Whoop',     cpm: 98,  impressions: 12400, since: '2026-05-20', expiresIn: '14 days' },
  { id: 'slot2', label: 'Sidebar Card',   occupied: false, brand: null,        cpm: 72,  impressions: 0,     since: null,         expiresIn: null },
  { id: 'slot3', label: 'Story Overlay',  occupied: false, brand: null,        cpm: 120, impressions: 0,     since: null,         expiresIn: null },
]

const PAYOUTS = [
  { id: 'p1', type: 'ad',    label: 'Whoop Campaign',      amount: 980,   ts: '2026-06-01', status: 'paid' },
  { id: 'p2', type: 'token', label: 'Token Royalties Q2',  amount: 1240,  ts: '2026-05-15', status: 'paid' },
  { id: 'p3', type: 'stake', label: 'Staking Pool Share',  amount: 340,   ts: '2026-05-01', status: 'paid' },
  { id: 'p4', type: 'ad',    label: 'Nike Pilot',          amount: 2100,  ts: '2026-04-10', status: 'paid' },
  { id: 'p5', type: 'token', label: 'Token Royalties Q1',  amount: 880,   ts: '2026-04-01', status: 'paid' },
]

const TIER_PERKS = [
  { tier: 'Bronze',  min: 10,  perk: 'DM access',            color: '#cd7f32', holders: 210 },
  { tier: 'Silver',  min: 50,  perk: 'Exclusive feed tab',   color: '#94a3b8', holders: 120 },
  { tier: 'Gold',    min: 100, perk: 'Private room access',  color: '#f59e0b', holders: 74  },
  { tier: 'Diamond', min: 500, perk: 'Advisory board seat',  color: '#818cf8', holders: 16  },
]

const EARNS_CHART = [340, 580, 720, 610, 890, 1100, 1240]

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values)
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{
          height: `${(v / max) * 100}%`,
          background: i === values.length - 1 ? color : `${color}40`,
        }} />
      ))}
    </div>
  )
}

function fmt(n: number) { return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtK(n: number) { return n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n) }

export default function CreatorPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'slots' | 'perks' | 'payouts'>('overview')
  const [slotModal, setSlotModal] = useState<string | null>(null)
  const [txMsg, setTxMsg] = useState<string | null>(null)

  async function listSlot(slotId: string) {
    await new Promise(r => setTimeout(r, 600))
    setSlotModal(null)
    setTxMsg(`Ad slot listed — brands can now book it`)
    setTimeout(() => setTxMsg(null), 3000)
  }

  const pctThisMonth = ((CREATOR.monthEarned / CREATOR.totalEarned) * 100).toFixed(0)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      {/* Header */}
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
            <p className="text-xs text-white/30 tracking-widest">CREATOR HUB</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Monetize Your Profile</h1>
          </div>
          <button onClick={() => router.push(`/profile/${CREATOR.handle}`)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            View Profile
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Profile card */}
        <div className="p-4 rounded-2xl border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(245,158,11,0.05))' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black"
              style={{ background: '#a855f718', color: '#a855f7', border: '1.5px solid #a855f730', fontSize: 16 }}>
              {CREATOR.symbol.slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">{CREATOR.name}</div>
              <div className="text-xs text-white/40">@{CREATOR.handle} · ${CREATOR.symbol} · {CREATOR.tier}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-white">{CREATOR.vScore}</div>
              <div className="text-xs text-white/30">V-Score</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Token Price', val: `$${CREATOR.price}`,        color: '#f59e0b' },
              { label: 'Market Cap',  val: fmtK(CREATOR.mcap),         color: '#a855f7' },
              { label: 'Holders',     val: CREATOR.holders,            color: '#818cf8' },
              { label: 'Reach',       val: `${(CREATOR.reach/1000).toFixed(0)}k`, color: '#22c55e' },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-lg border border-white/5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-xs font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-white/25">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings hero */}
        <div className="p-4 rounded-2xl border border-white/6"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs text-white/35 mb-1">Total Lifetime Earnings</div>
              <div className="text-3xl font-black text-white">{fmtK(CREATOR.totalEarned)}</div>
              <div className="text-sm text-green-400 mt-1">+{fmt(CREATOR.monthEarned)} this month ({pctThisMonth}% of total)</div>
            </div>
            <div className="w-28">
              <MiniBar values={EARNS_CHART} color="#a855f7" />
              <div className="text-xs text-white/25 text-center mt-1">Last 7 months</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Ad Revenue',    val: '$3,080',  color: '#ec4899' },
              { label: 'Token Royalty', val: '$2,120',  color: '#f59e0b' },
              { label: 'Staking Share', val: '$3,220',  color: '#818cf8' },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-xl border border-white/5"
                style={{ background: `${s.color}08` }}>
                <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-white/30">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([
            { id: 'overview', label: '◎ Overview' },
            { id: 'slots',    label: '⊕ Ad Slots' },
            { id: 'perks',    label: '⬡ Tier Perks' },
            { id: 'payouts',  label: '↓ Payouts' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 flex-1 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={tab === t.id
                ? { background: 'rgba(255,255,255,0.1)', color: 'white' }
                : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tx msg */}
        {txMsg && (
          <div className="p-3 rounded-xl text-sm text-center font-semibold"
            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>
            ✓ {txMsg}
          </div>
        )}

        {/* ── Overview tab ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/35 uppercase tracking-widest mb-3">Profile as Asset</div>
              <div className="space-y-3 text-xs text-white/50">
                <div className="flex gap-2 items-start">
                  <span style={{ color: '#a855f7' }}>◈</span>
                  <span>Your profile generates value as people hold <strong style={{ color: '#f59e0b' }}>${CREATOR.symbol}</strong> tokens — price rises with demand, giving you royalties on every trade.</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span style={{ color: '#ec4899' }}>⊕</span>
                  <span>You have <strong className="text-white/70">{CREATOR.adSlots} ad slots</strong> on your profile. Brands pay CPM to reach your <strong className="text-white/70">{CREATOR.reach.toLocaleString()}</strong> unique viewers.</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span style={{ color: '#818cf8' }}>⬡</span>
                  <span>Stakers in Diamond tier (<strong className="text-white/70">500+ tokens</strong>) earn 35% APY — this deepens loyalty and boosts your engagement score.</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTab('slots')}
                className="p-4 rounded-2xl border border-white/6 text-left transition-all hover:border-pink-500/30"
                style={{ background: 'rgba(236,72,153,0.04)' }}>
                <div className="text-xl mb-2">⊕</div>
                <div className="font-bold text-white text-sm">Manage Ad Slots</div>
                <div className="text-xs text-white/40 mt-1">{CREATOR.slotsUsed}/{CREATOR.adSlots} slots active</div>
              </button>
              <button onClick={() => setTab('perks')}
                className="p-4 rounded-2xl border border-white/6 text-left transition-all hover:border-amber-500/30"
                style={{ background: 'rgba(245,158,11,0.04)' }}>
                <div className="text-xl mb-2">⬡</div>
                <div className="font-bold text-white text-sm">Token Perks</div>
                <div className="text-xs text-white/40 mt-1">{CREATOR.holders} token holders</div>
              </button>
            </div>
          </div>
        )}

        {/* ── Ad Slots tab ─────────────────────────────────────────── */}
        {tab === 'slots' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-white/5 text-xs text-white/40"
              style={{ background: 'rgba(236,72,153,0.04)' }}>
              Brands discover your slots via the <button onClick={() => router.push('/advertise')} className="underline" style={{ color: '#ec4899' }}>Advertise</button> marketplace. You earn CPM revenue each time your slot serves an impression.
            </div>
            {AD_SLOTS.map(slot => (
              <div key={slot.id} className="p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-white text-sm">{slot.label}</div>
                    <div className="text-xs text-white/40">{fmt(slot.cpm)} CPM</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {slot.occupied
                      ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#22c55e18', color: '#22c55e' }}>● Live</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>○ Open</span>
                    }
                  </div>
                </div>
                {slot.occupied && slot.brand && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Brand',        val: slot.brand },
                      { label: 'Impressions',  val: slot.impressions.toLocaleString() },
                      { label: 'Expires',      val: slot.expiresIn ?? '–' },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-lg border border-white/5"
                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="text-xs font-bold text-white/70">{s.val}</div>
                        <div className="text-xs text-white/25">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {!slot.occupied && (
                  <button onClick={() => setSlotModal(slot.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: '#ec4899', color: '#04040A' }}>
                    List This Slot
                  </button>
                )}
                {slot.occupied && (
                  <button className="w-full py-2 rounded-xl text-xs font-semibold text-white/40 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    View Campaign Details
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tier Perks tab ───────────────────────────────────────── */}
        {tab === 'perks' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-white/5 text-xs text-white/40"
              style={{ background: 'rgba(245,158,11,0.04)' }}>
              Set exclusive perks for each staking tier. Higher tiers lock premium content, rooms, and direct access — driving demand for your token.
            </div>
            {TIER_PERKS.map(t => (
              <div key={t.tier} className="p-4 rounded-2xl border border-white/6 flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                  style={{ background: `${t.color}18`, color: t.color, border: `1.5px solid ${t.color}30` }}>
                  ⬡
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: t.color }}>{t.tier}</span>
                    <span className="text-xs text-white/30">{t.min}+ tokens</span>
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">{t.perk}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">{t.holders}</div>
                  <div className="text-xs text-white/30">holders</div>
                </div>
              </div>
            ))}
            <button
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all"
              style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b25' }}>
              + Add Custom Perk
            </button>
          </div>
        )}

        {/* ── Payouts tab ──────────────────────────────────────────── */}
        {tab === 'payouts' && (
          <div className="space-y-2">
            {PAYOUTS.map(p => {
              const colors = { ad: '#ec4899', token: '#f59e0b', stake: '#818cf8' } as Record<string, string>
              const icons  = { ad: '⊕', token: '◈', stake: '⬡' } as Record<string, string>
              const c = colors[p.type]
              return (
                <div key={p.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${c}18`, color: c }}>
                    {icons[p.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 font-semibold">{p.label}</div>
                    <div className="text-xs text-white/30">{p.ts}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-green-400 text-sm">{fmt(p.amount)}</div>
                    <div className="text-xs capitalize px-1.5 py-0.5 rounded-full" style={{ background: '#22c55e18', color: '#22c55e' }}>{p.status}</div>
                  </div>
                </div>
              )
            })}
            <div className="p-3 rounded-xl text-center text-xs text-white/30">
              Total paid out: <strong className="text-white/60">{fmt(PAYOUTS.reduce((s, p) => s + p.amount, 0))}</strong>
            </div>
          </div>
        )}

        {/* CTA row */}
        <div className="flex gap-3">
          <button onClick={() => router.push('/tokens/SOVV')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: '#a855f7', color: '#04040A' }}>
            My Token ↗
          </button>
          <button onClick={() => router.push('/advertise')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.2)' }}>
            Ad Marketplace
          </button>
        </div>
      </div>

      {/* List slot modal */}
      {slotModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSlotModal(null)}>
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4"
            style={{ background: '#0d0d1a' }}
            onClick={e => e.stopPropagation()}>
            <div className="font-bold text-white text-lg">List Ad Slot</div>
            <p className="text-sm text-white/50">
              Listing this slot makes it visible to brands on the Advertise marketplace. You'll receive CPM payments when impressions are served.
            </p>
            <div className="flex gap-3">
              <button onClick={() => listSlot(slotModal)}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#ec4899', color: '#04040A' }}>
                List Slot
              </button>
              <button onClick={() => setSlotModal(null)}
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
