'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MY_CODE = 'SOVV-X7K2'
const MY_LINK = 'https://viva.app/join?ref=SOVV-X7K2'

const STATS = { totalRefs: 28, activeRefs: 19, totalEarned: 840, pendingEarned: 120, thisMonth: 240 }

const REFERRED = [
  { handle: 'luna_apex',   name: 'Luna Apex',   joinedDays: 3,  status: 'active',  earned: 42, tier: 'guardian' },
  { handle: 'zeronode',    name: 'ZeroNode',    joinedDays: 7,  status: 'active',  earned: 38, tier: 'seeker' },
  { handle: 'aisham_x',   name: 'Aisham X',    joinedDays: 14, status: 'active',  earned: 55, tier: 'proven' },
  { handle: 'nate_r',     name: 'Nate Rivers',  joinedDays: 21, status: 'active',  earned: 29, tier: 'seed' },
  { handle: 'kira_void',  name: 'Kira Void',   joinedDays: 30, status: 'pending', earned: 0,  tier: 'seed' },
]

const LEADERBOARD = [
  { rank: 1, handle: 'mayafit',    name: 'Maya Chen',   refs: 84, earned: 3200, color: '#f59e0b' },
  { rank: 2, handle: 'sovereign_v',name: 'Sovereign V', refs: 28, earned: 840,  color: '#94a3b8' },
  { rank: 3, handle: 'alexwave',   name: 'Alex Wave',   refs: 22, earned: 660,  color: '#cd7f32' },
  { rank: 4, handle: 'luna_apex',  name: 'Luna Apex',   refs: 17, earned: 510,  color: 'rgba(255,255,255,0.3)' },
  { rank: 5, handle: 'zeronode',   name: 'ZeroNode',    refs: 14, earned: 420,  color: 'rgba(255,255,255,0.3)' },
]

const TIERS = [
  { label: 'Starter',   min: 1,   reward: '5% of referral revenue',    color: '#94a3b8' },
  { label: 'Recruiter', min: 10,  reward: '8% + bonus SOVV tokens',    color: '#22c55e' },
  { label: 'Amplifier', min: 25,  reward: '12% + ad slot boost',       color: '#a855f7' },
  { label: 'Legend',    min: 50,  reward: '18% + Diamond perks',       color: '#f59e0b' },
]

export default function ReferralPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'overview' | 'referred' | 'leaderboard'>('overview')

  function copyLink() {
    navigator.clipboard.writeText(MY_LINK).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const myTier = TIERS.slice().reverse().find(t => STATS.totalRefs >= t.min) ?? TIERS[0]
  const nextTier = TIERS.find(t => t.min > STATS.totalRefs)

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
            <p className="text-xs text-white/30 tracking-widest">VIVA GROWTH</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Refer & Earn</h1>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold" style={{ color: myTier.color }}>{myTier.label}</div>
            <div className="text-xs text-white/30">ref tier</div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Invite card */}
        <div className="p-5 rounded-2xl border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(245,158,11,0.06))' }}>
          <div className="text-xs text-white/35 uppercase tracking-widest mb-2">Your Referral Link</div>
          <div className="font-mono text-sm text-white/70 mb-3 truncate">{MY_LINK}</div>
          <div className="flex gap-2">
            <button onClick={copyLink}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: copied ? '#22c55e' : '#a855f7', color: '#04040A' }}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Share ↗
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-white/30">Code:</span>
            <span className="font-mono text-sm font-bold" style={{ color: '#a855f7' }}>{MY_CODE}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 grid grid-cols-3 gap-2">
            {[
              { label: 'Total Refs',   val: STATS.totalRefs,   color: '#a855f7' },
              { label: 'Active',       val: STATS.activeRefs,  color: '#22c55e' },
              { label: 'This Month',   val: `$${STATS.thisMonth}`, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl border border-white/6 text-center"
                style={{ background: `${s.color}06` }}>
                <div className="text-lg font-black" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-white/30">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/35 mb-1">Total Earned</div>
            <div className="text-2xl font-black text-white">${STATS.totalEarned}</div>
            <div className="text-xs text-green-400 mt-1">+${STATS.pendingEarned} pending</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <div className="text-xs text-white/35 mb-1">Current Tier</div>
            <div className="text-lg font-black" style={{ color: myTier.color }}>{myTier.label}</div>
            <div className="text-xs text-white/40 mt-1">{myTier.reward}</div>
            {nextTier && (
              <div className="text-xs mt-2" style={{ color: '#818cf8' }}>
                {nextTier.min - STATS.totalRefs} more → {nextTier.label}
              </div>
            )}
          </div>
        </div>

        {/* Tier progress */}
        <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 uppercase tracking-widest mb-3">Tier Progress</div>
          <div className="flex items-center gap-2 mb-3">
            {TIERS.map((t, i) => (
              <div key={t.label} className="flex-1 text-center">
                <div className="h-1.5 rounded-full mb-1" style={{
                  background: STATS.totalRefs >= t.min ? t.color : 'rgba(255,255,255,0.08)'
                }} />
                <div className="text-xs" style={{ color: STATS.totalRefs >= t.min ? t.color : 'rgba(255,255,255,0.25)' }}>{t.min}+</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {TIERS.map(t => (
              <div key={t.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <div className="text-xs font-bold" style={{ color: t.color }}>{t.label}</div>
                <div className="text-xs text-white/40 flex-1">{t.reward}</div>
                <div className="text-xs text-white/25">{t.min}+ refs</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([
            { id: 'overview',    label: '◎ Overview' },
            { id: 'referred',    label: `◈ Referred (${STATS.totalRefs})` },
            { id: 'leaderboard', label: '⬡ Leaders' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={tab === t.id
                ? { background: 'rgba(255,255,255,0.1)', color: 'white' }
                : { color: 'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/35 uppercase tracking-widest mb-3">How It Works</div>
              <div className="space-y-3 text-xs text-white/50">
                {[
                  { icon: '1', text: 'Share your link — friends join VIVA using your referral code', color: '#a855f7' },
                  { icon: '2', text: 'They create a profile and get their first token or ad slot', color: '#f59e0b' },
                  { icon: '3', text: 'You earn a % of everything they generate on the platform', color: '#22c55e' },
                  { icon: '4', text: 'Climb tiers for higher rates — up to 18% with Legend status', color: '#818cf8' },
                ].map(s => (
                  <div key={s.icon} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyLink}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#a855f7', color: '#04040A' }}>
                {copied ? '✓ Copied!' : 'Copy My Link'}
              </button>
              <button className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
                Share on Feed
              </button>
            </div>
          </div>
        )}

        {tab === 'referred' && (
          <div className="space-y-2">
            {REFERRED.map(u => (
              <div key={u.handle} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <button onClick={() => router.push(`/profile/${u.handle}`)}
                    className="text-sm font-semibold text-white/80 hover:text-white transition-colors">{u.name}</button>
                  <div className="text-xs text-white/30">joined {u.joinedDays}d ago · {u.tier}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-bold ${u.status === 'active' ? 'text-green-400' : 'text-white/30'}`}>
                    {u.status === 'active' ? `+$${u.earned}` : 'Pending'}
                  </div>
                  <div className="text-xs capitalize" style={{ color: u.status === 'active' ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                    {u.status}
                  </div>
                </div>
              </div>
            ))}
            {STATS.totalRefs > REFERRED.length && (
              <div className="text-center text-xs text-white/25 py-2">
                +{STATS.totalRefs - REFERRED.length} more referrals
              </div>
            )}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="space-y-2">
            {LEADERBOARD.map(u => (
              <div key={u.rank} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6"
                style={{ background: u.rank <= 3 ? `${u.color}06` : 'rgba(255,255,255,0.018)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${u.color}18`, color: u.color }}>
                  {u.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <button onClick={() => router.push(`/profile/${u.handle}`)}
                    className="text-sm font-semibold text-white/80 hover:text-white transition-colors">{u.name}</button>
                  <div className="text-xs text-white/30">{u.refs} referrals</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: u.color }}>${u.earned.toLocaleString()}</div>
                  <div className="text-xs text-white/30">earned</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
