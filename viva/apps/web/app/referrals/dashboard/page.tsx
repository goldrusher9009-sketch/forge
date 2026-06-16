'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Referral {
  handle: string
  name: string
  color: string
  joinedAgo: string
  tokensHeld: number
  earnings: number
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | null
  active: boolean
}

const MY_REFERRALS: Referral[] = [
  { handle: 'jade_l',   name: 'Jade L.',   color: '#a855f7', joinedAgo: '3d ago',  tokensHeld: 280, earnings: 24.50, tier: 'Gold',    active: true  },
  { handle: 'noa_d',    name: 'Noa D.',    color: '#f59e0b', joinedAgo: '7d ago',  tokensHeld: 120, earnings: 9.80,  tier: 'Silver',  active: true  },
  { handle: 'sam_q',    name: 'Sam Q.',    color: '#22c55e', joinedAgo: '14d ago', tokensHeld: 60,  earnings: 4.20,  tier: 'Bronze',  active: true  },
  { handle: 'max_t',    name: 'Max T.',    color: '#ec4899', joinedAgo: '21d ago', tokensHeld: 0,   earnings: 0,     tier: null,      active: false },
  { handle: 'dex_n',    name: 'Dex N.',    color: '#818cf8', joinedAgo: '30d ago', tokensHeld: 45,  earnings: 2.10,  tier: 'Bronze',  active: true  },
]

const TIER_COLOR: Record<string, string> = { Diamond: '#818cf8', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#b45309' }
const TIER_EMOJI: Record<string, string> = { Diamond: '💎', Gold: '🥇', Silver: '🥈', Bronze: '🥉' }

const REFERRAL_CODE = 'VIVA-SCOTT42'
const REFERRAL_LINK = `https://viva.social/join?ref=${REFERRAL_CODE}`

export default function ReferralsDashboardPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'overview' | 'referrals'>('overview')

  const totalEarnings   = MY_REFERRALS.reduce((s, r) => s + r.earnings, 0)
  const activeCount     = MY_REFERRALS.filter(r => r.active).length
  const totalTokensHeld = MY_REFERRALS.reduce((s, r) => s + r.tokensHeld, 0)

  function copy() {
    navigator.clipboard.writeText(REFERRAL_LINK).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="font-black text-white">Referrals</div>
            <div className="text-xs text-white/30">Invite friends, earn rewards</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Referral link card */}
        <div className="p-4 rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.18)' }}>
          <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Your Referral Link</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-xl text-xs font-mono text-white/50 truncate"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {REFERRAL_LINK}
            </div>
            <button onClick={copy}
              className="px-4 py-2 rounded-xl text-xs font-black flex-shrink-0"
              style={copied ? { background: '#22c55e', color: '#04040A' } : { background: '#a855f7', color: '#04040A' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="mt-2 text-xs" style={{ color: '#a855f7' }}>
            Code: <span className="font-black">{REFERRAL_CODE}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Referred',      value: MY_REFERRALS.length, color: '#a855f7'  },
            { label: 'Active',         value: activeCount,          color: '#22c55e'  },
            { label: 'Earned (USDC)', value: `$${totalEarnings.toFixed(2)}`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-base" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">How It Works</div>
          <div className="space-y-2">
            {[
              { step: '1', text: 'Share your link with friends', color: '#a855f7' },
              { step: '2', text: 'They join VIVA & buy any token', color: '#818cf8' },
              { step: '3', text: 'You earn 5% of their trading fees forever', color: '#22c55e' },
              { step: '4', text: 'Bonus: +2% if they reach Gold tier', color: '#f59e0b' },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: `${s.color}15`, color: s.color }}>
                  {s.step}
                </div>
                <span className="text-sm text-white/60">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['overview', 'referrals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold capitalize"
              style={tab === t ? { background: 'rgba(255,255,255,0.08)', color: 'white' } : { color: 'rgba(255,255,255,0.3)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 mb-1">Total Tokens Held by Referrals</div>
              <div className="font-black text-2xl text-white">{totalTokensHeld.toLocaleString()}</div>
              <div className="text-xs text-white/25">across all creators</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 mb-3">Tier Distribution</div>
              {['Gold', 'Silver', 'Bronze', 'None'].map(tier => {
                const count = MY_REFERRALS.filter(r => (r.tier ?? 'None') === tier).length
                return (
                  <div key={tier} className="flex items-center gap-3 mb-2">
                    <div className="text-xs w-14" style={{ color: TIER_COLOR[tier] ?? 'rgba(255,255,255,0.2)' }}>
                      {TIER_EMOJI[tier] ?? '—'} {tier}
                    </div>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(count / MY_REFERRALS.length) * 100}%`, background: TIER_COLOR[tier] ?? 'rgba(255,255,255,0.15)' }} />
                    </div>
                    <div className="text-xs text-white/25 w-4">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'referrals' && (
          <div className="space-y-2">
            {MY_REFERRALS.map(r => (
              <button key={r.handle} onClick={() => router.push(`/profile/${r.handle}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/4 text-left"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${r.color}15`, color: r.color }}>
                  {r.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white/80">{r.name}</span>
                    {r.tier && <span className="text-xs" style={{ color: TIER_COLOR[r.tier] }}>{TIER_EMOJI[r.tier]}</span>}
                  </div>
                  <div className="text-xs text-white/25">{r.joinedAgo} · {r.tokensHeld} tokens</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm" style={{ color: r.earnings > 0 ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                    {r.earnings > 0 ? `+$${r.earnings.toFixed(2)}` : '—'}
                  </div>
                  <div className="text-xs" style={{ color: r.active ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                    {r.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
