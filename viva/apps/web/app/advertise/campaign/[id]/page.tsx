'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CAMPAIGNS: Record<string, {
  id: string; brand: string; creator: string; creatorHandle: string; creatorColor: string
  slot: string; status: 'active' | 'paused' | 'ended'
  headline: string; body: string; cta: string
  budget: number; spent: number; startDate: string; endDate: string
  targeting: string; duration: number
  stats: { impressions: number; reach: number; clicks: number; conversions: number; ctr: number; cpm: number }
  daily: { day: string; impressions: number; clicks: number; spend: number }[]
}> = {
  camp1: {
    id: 'camp1', brand: 'Acme Corp', creator: 'Sovereign V', creatorHandle: 'sovereign_v', creatorColor: '#a855f7',
    slot: 'Feed Post', status: 'active',
    headline: 'Trade Smarter with Acme Pro', body: 'Real-time signals + AI analysis. Trusted by 50k traders.', cta: 'Try Free for 30 Days',
    budget: 500, spent: 284.60, startDate: '2026-06-01', endDate: '2026-06-14', duration: 14, targeting: 'all',
    stats: { impressions: 22000, reach: 14300, clicks: 704, conversions: 42, ctr: 3.2, cpm: 12.94 },
    daily: [
      { day: 'Jun 1',  impressions: 1400, clicks: 45,  spend: 18.10 },
      { day: 'Jun 2',  impressions: 1650, clicks: 53,  spend: 21.35 },
      { day: 'Jun 3',  impressions: 1820, clicks: 58,  spend: 23.54 },
      { day: 'Jun 4',  impressions: 1500, clicks: 48,  spend: 19.40 },
      { day: 'Jun 5',  impressions: 1900, clicks: 61,  spend: 24.57 },
      { day: 'Jun 6',  impressions: 2100, clicks: 67,  spend: 27.15 },
      { day: 'Jun 7',  impressions: 1750, clicks: 56,  spend: 22.63 },
    ],
  },
  camp2: {
    id: 'camp2', brand: 'NovaTech', creator: 'Sovereign V', creatorHandle: 'sovereign_v', creatorColor: '#a855f7',
    slot: 'Story', status: 'active',
    headline: 'NovaTech AI Trading Bot', body: 'Automate your portfolio. 3x returns avg.', cta: 'Get Beta Access',
    budget: 300, spent: 149.80, startDate: '2026-06-08', endDate: '2026-06-21', duration: 14, targeting: 'silver',
    stats: { impressions: 14500, reach: 9425, clicks: 595, conversions: 31, ctr: 4.1, cpm: 10.33 },
    daily: [
      { day: 'Jun 8',  impressions: 1800, clicks: 74, spend: 18.60 },
      { day: 'Jun 9',  impressions: 2200, clicks: 90, spend: 22.73 },
      { day: 'Jun 10', impressions: 2050, clicks: 84, spend: 21.18 },
      { day: 'Jun 11', impressions: 2400, clicks: 98, spend: 24.79 },
      { day: 'Jun 12', impressions: 1950, clicks: 80, spend: 20.15 },
      { day: 'Jun 13', impressions: 2200, clicks: 90, spend: 22.73 },
      { day: 'Jun 14', impressions: 1900, clicks: 79, spend: 19.62 },
    ],
  },
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-12 flex items-end" style={{ width: 28 }}>
      <div className="w-full rounded-sm transition-all" style={{ height: `${(value / max) * 100}%`, background: `${color}60`, minHeight: 2 }} />
    </div>
  )
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'camp1'
  const c = CAMPAIGNS[id] ?? CAMPAIGNS.camp1

  const [paused, setPaused] = useState(c.status === 'paused')
  const budgetUsed = (c.spent / c.budget) * 100
  const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000))
  const maxImpressions = Math.max(...c.daily.map(d => d.impressions))
  const maxSpend = Math.max(...c.daily.map(d => d.spend))

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
            <div className="font-black text-white">{c.brand}</div>
            <div className="text-xs text-white/30">{c.slot} · @{c.creatorHandle}</div>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full"
            style={c.status === 'active' && !paused
              ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
              : c.status === 'ended'
              ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
              : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            {c.status === 'active' && !paused ? '🟢 Active' : c.status === 'ended' ? 'Ended' : '⏸ Paused'}
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Budget bar */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/40">Budget used</span>
            <span className="font-black text-white">${c.spent.toFixed(0)} / ${c.budget}</span>
          </div>
          <div className="h-2 rounded-full bg-white/8 mb-2">
            <div className="h-full rounded-full transition-all" style={{ width: `${budgetUsed}%`, background: budgetUsed > 80 ? '#f59e0b' : '#a855f7' }} />
          </div>
          <div className="flex justify-between text-xs text-white/30">
            <span>{budgetUsed.toFixed(0)}% spent</span>
            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Campaign ended'}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Impressions', value: c.stats.impressions.toLocaleString(), color: '#818cf8' },
            { label: 'Reach',       value: c.stats.reach.toLocaleString(),       color: '#a855f7' },
            { label: 'Clicks',      value: c.stats.clicks.toLocaleString(),      color: '#22c55e' },
            { label: 'Conversions', value: c.stats.conversions.toString(),       color: '#f59e0b' },
            { label: 'CTR',         value: `${c.stats.ctr}%`,                   color: '#ec4899' },
            { label: 'CPM',         value: `$${c.stats.cpm.toFixed(2)}`,        color: '#34d399' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/4"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30">{s.label}</div>
              <div className="font-black text-xl mt-0.5" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Daily chart */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Daily Impressions</div>
          <div className="flex items-end gap-1 h-16">
            {c.daily.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <Bar value={d.impressions} max={maxImpressions} color="#818cf8" />
                <span className="text-xs text-white/20" style={{ fontSize: 9 }}>{d.day.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Daily Spend</div>
          <div className="flex items-end gap-1 h-16">
            {c.daily.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <Bar value={d.spend} max={maxSpend} color="#22c55e" />
                <span className="text-xs text-white/20" style={{ fontSize: 9 }}>{d.day.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ad preview */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Ad Creative</div>
          <div className="p-4 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.025)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
                style={{ background: `${c.creatorColor}18`, color: c.creatorColor }}>S</div>
              <div>
                <div className="text-xs font-bold text-white/70">{c.creator}</div>
                <div className="text-xs text-white/25">Sponsored · {c.slot}</div>
              </div>
            </div>
            <div className="font-black text-white mb-1">{c.headline}</div>
            <div className="text-sm text-white/50 mb-3">{c.body}</div>
            <div className="py-2 px-4 rounded-xl text-xs font-black text-center"
              style={{ background: c.creatorColor, color: '#04040A' }}>
              {c.cta}
            </div>
          </div>
        </div>

        {/* Campaign details */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Details</div>
          {[
            { label: 'Creator',   value: `@${c.creatorHandle}` },
            { label: 'Slot',      value: c.slot },
            { label: 'Targeting', value: c.targeting === 'all' ? 'All audiences' : `${c.targeting}+ token holders` },
            { label: 'Dates',     value: `${new Date(c.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${new Date(c.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}` },
            { label: 'Duration',  value: `${c.duration} days` },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-white/35">{r.label}</span>
              <span className="text-white/65 font-semibold">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {c.status !== 'ended' && (
          <div className="flex gap-2">
            <button onClick={() => setPaused(p => !p)}
              className="flex-1 py-3 rounded-xl font-black text-sm transition-all"
              style={{ background: paused ? '#22c55e' : 'rgba(245,158,11,0.12)', color: paused ? '#04040A' : '#f59e0b' }}>
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button onClick={() => router.push('/advertise')}
              className="flex-1 py-3 rounded-xl font-black text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              All Campaigns
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
