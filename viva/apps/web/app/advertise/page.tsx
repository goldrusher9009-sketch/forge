'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TIER_META } from '@/lib/store'

// ─── Mock ad inventory ────────────────────────────────────────────────────────
const AD_PROFILES = [
  { handle: 'sovereign_v', name: 'Sovereign V', tier: 'guardian', vScore: 980, color: '#a855f7', reach: 41160, engagement: 9.2, cpm: 98,  slots: 3, slotsUsed: 1, categories: ['ZK Identity', 'Wealth', 'Health'] },
  { handle: 'mayafit',     name: 'Maya Chen',   tier: 'guardian', vScore: 935, color: '#a855f7', reach: 39270, engagement: 8.7, cpm: 94,  slots: 5, slotsUsed: 3, categories: ['Fitness', 'Nutrition', 'Lifestyle'] },
  { handle: 'luna_apex',   name: 'Luna Apex',   tier: 'guardian', vScore: 962, color: '#a855f7', reach: 40404, engagement: 8.4, cpm: 96,  slots: 4, slotsUsed: 2, categories: ['Longevity', 'Biohacking', 'Health'] },
  { handle: 'alexwave',    name: 'Alex Wave',   tier: 'seeker',   vScore: 832, color: '#22c55e', reach: 34944, engagement: 6.8, cpm: 72,  slots: 3, slotsUsed: 0, categories: ['DeFi', 'Crypto', 'Trading'] },
  { handle: 'zeronode',    name: 'ZeroNode',    tier: 'guardian', vScore: 941, color: '#a855f7', reach: 39522, engagement: 7.9, cpm: 88,  slots: 3, slotsUsed: 1, categories: ['Web3', 'Dev', 'DeFi'] },
  { handle: 'aisham_x',   name: 'Aisham X',    tier: 'proven',   vScore: 928, color: '#7c3aed', reach: 38976, engagement: 8.1, cpm: 86,  slots: 2, slotsUsed: 0, categories: ['Nutrition', 'Science', 'Health'] },
]

type CampaignStatus = 'active' | 'pending' | 'ended'

const MOCK_CAMPAIGNS = [
  { id: 'c1', brand: 'Whoop',        profile: 'mayafit',     budget: 5000, spent: 3200, status: 'active' as CampaignStatus,  reach: 28400, clicks: 1240, startDate: '2026-05-01', endDate: '2026-06-30' },
  { id: 'c2', brand: 'Levels',       profile: 'sovereign_v', budget: 8000, spent: 1800, status: 'active' as CampaignStatus,  reach: 14200, clicks: 890,  startDate: '2026-06-01', endDate: '2026-07-31' },
  { id: 'c3', brand: 'Coinbase',     profile: 'alexwave',    budget: 3000, spent: 3000, status: 'ended' as CampaignStatus,   reach: 32100, clicks: 2100, startDate: '2026-04-01', endDate: '2026-04-30' },
]

const CATEGORIES = ['All', 'Health', 'Fitness', 'DeFi', 'Web3', 'Longevity', 'Nutrition', 'ZK Identity']

function SlotBadge({ used, total }: { used: number; total: number }) {
  const avail = total - used
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="w-2 h-2 rounded-sm"
          style={{ background: i < used ? 'rgba(255,255,255,0.2)' : '#22c55e' }} />
      ))}
      <span className="ml-1.5 text-xs" style={{ color: avail > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
        {avail} open
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = {
    active:  { color: '#22c55e', label: 'Live' },
    pending: { color: '#f59e0b', label: 'Pending' },
    ended:   { color: 'rgba(255,255,255,0.3)', label: 'Ended' },
  }[status]
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${cfg.color}18`, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

export default function AdvertisePage() {
  const router = useRouter()
  const [tab, setTab]         = useState<'discover' | 'campaigns'>('discover')
  const [catFilter, setCatFilter] = useState('All')
  const [showBook, setShowBook]   = useState<string | null>(null) // handle
  const [brand, setBrand]         = useState('')
  const [tagline, setTagline]     = useState('')
  const [budget, setBudget]       = useState('1000')
  const [booked, setBooked]       = useState<Set<string>>(new Set())
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS)

  const filtered = AD_PROFILES
    .filter(p => catFilter === 'All' || p.categories.includes(catFilter))
    .filter(p => p.slots - p.slotsUsed > 0)
    .sort((a, b) => b.vScore - a.vScore)

  const bookTarget = AD_PROFILES.find(p => p.handle === showBook)

  function book() {
    if (!brand || !tagline || !budget || !showBook) return
    const target = AD_PROFILES.find(p => p.handle === showBook)
    if (!target) return
    const newCamp = {
      id: `c${Date.now()}`,
      brand,
      profile: showBook,
      budget: parseInt(budget),
      spent: 0,
      status: 'pending' as CampaignStatus,
      reach: 0,
      clicks: 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    }
    setCampaigns(prev => [newCamp, ...prev])
    setBooked(prev => new Set([...prev, showBook]))
    setShowBook(null)
    setBrand(''); setTagline(''); setBudget('1000')
    setTab('campaigns')
  }

  const totalSpend    = campaigns.filter(c => c.status === 'active').reduce((s, c) => s + c.spent, 0)
  const totalReach    = campaigns.reduce((s, c) => s + c.reach, 0)
  const totalClicks   = campaigns.reduce((s, c) => s + c.clicks, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/30 tracking-widest">VIVA ADS</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Advertise on Humans</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([['discover', '⊕ Discover Profiles'], ['campaigns', '◈ My Campaigns']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === id ? 'rgba(124,58,237,0.25)' : 'transparent',
                color: tab === id ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                border: tab === id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              }}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* ── Discover Tab ── */}
        {tab === 'discover' && (
          <>
            {/* Platform reach stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Reach',   val: `${(AD_PROFILES.reduce((s,p) => s+p.reach,0)/1000).toFixed(0)}K`, color: '#a855f7' },
                { label: 'Open Slots',    val: AD_PROFILES.reduce((s,p) => s + p.slots - p.slotsUsed, 0),       color: '#22c55e' },
                { label: 'Avg Engagement',val: `${(AD_PROFILES.reduce((s,p) => s+p.engagement,0)/AD_PROFILES.length).toFixed(1)}%`, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl border border-white/6 text-center"
                  style={{ background: `${s.color}08` }}>
                  <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: catFilter === c ? '#a855f718' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${catFilter === c ? '#a855f740' : 'rgba(255,255,255,0.06)'}`,
                    color: catFilter === c ? '#a855f7' : 'rgba(255,255,255,0.4)',
                  }}>
                  {c}
                </button>
              ))}
            </div>

            <p className="text-xs text-white/25">{filtered.length} profiles with open ad slots</p>

            {/* Profile cards */}
            <div className="space-y-3">
              {filtered.map(p => {
                const tier = TIER_META[p.tier as keyof typeof TIER_META] ?? TIER_META.seed
                const avail = p.slots - p.slotsUsed
                const isBooked = booked.has(p.handle)
                return (
                  <div key={p.handle} className="p-4 rounded-2xl border border-white/6"
                    style={{ background: 'rgba(255,255,255,0.018)' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: `${p.color}18`, color: p.color, border: `1.5px solid ${p.color}30` }}>
                        {p.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-white text-sm">{p.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                            style={{ background: `${p.color}15`, color: p.color }}>
                            {p.vScore}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.categories.map(c => (
                            <span key={c} className="text-xs px-1.5 py-0.5 rounded-md"
                              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { label: 'Reach',       val: `${(p.reach/1000).toFixed(0)}K` },
                        { label: 'Engage',      val: `${p.engagement}%`, color: '#22c55e' },
                        { label: 'CPM',         val: `$${p.cpm}`, color: '#f59e0b' },
                        { label: 'Open Slots',  val: avail, color: '#22c55e' },
                      ].map(s => (
                        <div key={s.label} className="text-center p-2 rounded-lg border border-white/5"
                          style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div className="text-xs font-bold" style={{ color: (s as any).color ?? 'white' }}>{s.val}</div>
                          <div className="text-xs text-white/25">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <SlotBadge used={p.slotsUsed} total={p.slots} />

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setShowBook(p.handle)} disabled={isBooked}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        style={{
                          background: isBooked ? '#22c55e18' : '#7c3aed',
                          color: isBooked ? '#22c55e' : 'white',
                        }}>
                        {isBooked ? '✓ Campaign Booked' : `Book Ad Slot · $${p.cpm} CPM`}
                      </button>
                      <button onClick={() => router.push(`/profile/${p.handle}`)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}25` }}>
                        Profile
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Campaigns Tab ── */}
        {tab === 'campaigns' && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 p-4 rounded-2xl border border-white/6"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(34,197,94,0.05))' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/35 mb-1">Active Spend</div>
                    <div className="text-2xl font-black text-white">${totalSpend.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/35 mb-1">Total Reach</div>
                    <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{(totalReach / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              </div>
              {[
                { label: 'Active',   val: activeCampaigns,           color: '#22c55e' },
                { label: 'Clicks',   val: totalClicks.toLocaleString(), color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl border border-white/6 text-center"
                  style={{ background: `${s.color}06` }}>
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {campaigns.length === 0 && (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3 opacity-20">⊕</div>
                <div className="text-sm text-white/30 mb-4">No campaigns yet</div>
                <button onClick={() => setTab('discover')}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: '#7c3aed', color: 'white' }}>
                  Discover Profiles
                </button>
              </div>
            )}

            <div className="space-y-3">
              {campaigns.map(c => {
                const profile = AD_PROFILES.find(p => p.handle === c.profile)
                const pctSpent = (c.spent / c.budget) * 100
                return (
                  <div key={c.id} className="p-4 rounded-2xl border border-white/6"
                    style={{ background: 'rgba(255,255,255,0.018)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-white text-sm">{c.brand}</div>
                        <button onClick={() => router.push(`/profile/${c.profile}`)}
                          className="text-xs text-white/35 hover:text-white/60 transition-colors">
                          on @{c.profile}
                        </button>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/35">Budget used</span>
                        <span className="text-white/60">${c.spent.toLocaleString()} / ${c.budget.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pctSpent}%`, background: pctSpent > 80 ? '#ef4444' : '#22c55e' }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        { label: 'Reach',  val: c.reach > 0 ? `${(c.reach/1000).toFixed(0)}K` : '–' },
                        { label: 'Clicks', val: c.clicks > 0 ? c.clicks.toLocaleString() : '–' },
                        { label: 'End',    val: c.endDate },
                      ].map(s => (
                        <div key={s.label} className="text-center p-2 rounded-lg border border-white/5"
                          style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div className="text-xs font-bold text-white/80">{s.val}</div>
                          <div className="text-xs text-white/25">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Book modal */}
      {showBook && bookTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowBook(null) }}>
          <div className="w-full max-w-lg p-6 rounded-t-3xl border-t border-white/10"
            style={{ background: '#0d0d14' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                style={{ background: `${bookTarget.color}18`, color: bookTarget.color }}>
                {bookTarget.name[0]}
              </div>
              <div>
                <div className="font-bold text-white">{bookTarget.name}</div>
                <div className="text-xs text-white/35">${bookTarget.cpm} CPM · {(bookTarget.slots - bookTarget.slotsUsed)} slots open</div>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-white/40 block mb-1">Brand / Company name</label>
                <input value={brand} onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Whoop, Coinbase, AG1…"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-white/25 placeholder-white/20" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Ad tagline</label>
                <input value={tagline} onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Optimize your health with Whoop"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-white/25 placeholder-white/20" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Monthly budget (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-white/25" />
                </div>
                <p className="text-xs text-white/25 mt-1">
                  Est. {Math.floor(parseInt(budget || '0') / bookTarget.cpm * 1000).toLocaleString()} impressions
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowBook(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white/40 border border-white/8">
                Cancel
              </button>
              <button onClick={book} disabled={!brand || !tagline || !budget}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
                style={{ background: '#7c3aed', color: 'white' }}>
                Book Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
