'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BADGE_GROUPS = [
  {
    group: 'Token Milestones',
    color: '#f59e0b',
    badges: [
      { id: 'b1', icon: '⬡', name: 'First Holder', desc: 'Acquire your first token from any creator', earned: true, earnedDate: '2026-03-01', xp: 50 },
      { id: 'b2', icon: '⬡⬡', name: 'Token Collector', desc: 'Hold tokens from 5+ different creators', earned: true, earnedDate: '2026-04-12', xp: 150 },
      { id: 'b3', icon: '💎', name: 'Diamond Staker', desc: 'Reach Diamond staking tier (500+ tokens staked)', earned: false, progress: 320, target: 500, xp: 500 },
      { id: 'b4', icon: '🏆', name: 'Token Whale', desc: 'Hold 10,000+ tokens across all creators', earned: false, progress: 4200, target: 10000, xp: 1000 },
    ],
  },
  {
    group: 'Social',
    color: '#a855f7',
    badges: [
      { id: 'b5', icon: '👥', name: 'Connected', desc: 'Follow 10 creators on VIVA', earned: true, earnedDate: '2026-03-10', xp: 30 },
      { id: 'b6', icon: '🌐', name: 'Network Builder', desc: 'Gain 100 followers', earned: true, earnedDate: '2026-05-01', xp: 200 },
      { id: 'b7', icon: '📣', name: 'Influencer', desc: 'Reach 1,000 followers', earned: false, progress: 420, target: 1000, xp: 500 },
      { id: 'b8', icon: '⭐', name: 'VIVA Legend', desc: 'Reach 10,000 followers', earned: false, progress: 420, target: 10000, xp: 2000 },
    ],
  },
  {
    group: 'Creator',
    color: '#ec4899',
    badges: [
      { id: 'b9', icon: '✍️', name: 'First Post', desc: 'Publish your first post', earned: true, earnedDate: '2026-03-02', xp: 20 },
      { id: 'b10', icon: '🔥', name: 'Consistent Creator', desc: 'Post 30 days in a row', earned: false, progress: 14, target: 30, xp: 300 },
      { id: 'b11', icon: '💡', name: 'Viral Post', desc: 'Get 10,000 views on a single post', earned: false, progress: 0, target: 10000, xp: 400 },
      { id: 'b12', icon: '💰', name: 'First Ad Deal', desc: 'Accept your first paid ad placement', earned: false, progress: 0, target: 1, xp: 250 },
    ],
  },
  {
    group: 'Governance',
    color: '#818cf8',
    badges: [
      { id: 'b13', icon: '🗳️', name: 'First Vote', desc: 'Cast a vote on a DAO proposal', earned: true, earnedDate: '2026-06-01', xp: 75 },
      { id: 'b14', icon: '⚖️', name: 'Active Voter', desc: 'Vote on 10 proposals', earned: false, progress: 3, target: 10, xp: 300 },
      { id: 'b15', icon: '📜', name: 'Proposal Passed', desc: 'Have a proposal you created pass a vote', earned: false, progress: 0, target: 1, xp: 800 },
    ],
  },
  {
    group: 'Health ZK',
    color: '#22c55e',
    badges: [
      { id: 'b16', icon: '🏃', name: 'Health Pioneer', desc: 'Set up your first ZK health ring', earned: true, earnedDate: '2026-03-15', xp: 100 },
      { id: 'b17', icon: '🧬', name: 'Verified Athlete', desc: 'Verify 3 health metrics with ZK proof', earned: false, progress: 1, target: 3, xp: 350 },
    ],
  },
]

const ALL_BADGES = BADGE_GROUPS.flatMap(g => g.badges)
const EARNED = ALL_BADGES.filter(b => b.earned)
const TOTAL_XP = EARNED.reduce((s, b) => s + b.xp, 0)
const LEVEL = Math.floor(TOTAL_XP / 500) + 1
const LEVEL_XP_PROGRESS = TOTAL_XP % 500
const LEVEL_XP_NEXT = 500

export default function BadgesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
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
            <p className="text-xs text-white/30 tracking-widest">ACHIEVEMENTS</p>
            <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', letterSpacing: '-0.03em' }}>Badges</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {(['all', 'earned', 'locked'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
              style={filter === f
                ? { background: '#f59e0b', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {f === 'earned' ? `✓ Earned (${EARNED.length})` : f === 'locked' ? `🔒 Locked` : 'All'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* XP / Level */}
        <div className="p-4 rounded-2xl border border-white/6"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(168,85,247,0.05))' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-0.5">Achievement Level</div>
              <div className="text-3xl font-black" style={{ color: '#f59e0b' }}>Lv. {LEVEL}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/30 mb-0.5">Total XP</div>
              <div className="text-xl font-black text-white">{TOTAL_XP.toLocaleString()}</div>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(LEVEL_XP_PROGRESS / LEVEL_XP_NEXT) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #a855f7)' }} />
          </div>
          <div className="flex justify-between text-xs text-white/25 mt-1">
            <span>{LEVEL_XP_PROGRESS} XP</span>
            <span>{LEVEL_XP_NEXT} XP to Lv. {LEVEL + 1}</span>
          </div>
        </div>

        {/* Badge groups */}
        {BADGE_GROUPS.map(g => {
          const groupBadges = g.badges.filter(b =>
            filter === 'all' ? true : filter === 'earned' ? b.earned : !b.earned
          )
          if (groupBadges.length === 0) return null
          return (
            <div key={g.group}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: g.color }}>{g.group}</div>
              <div className="space-y-2">
                {groupBadges.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/6 transition-all"
                    style={{ background: 'rgba(255,255,255,0.018)', opacity: b.earned ? 1 : 0.65 }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: b.earned ? `${g.color}18` : 'rgba(255,255,255,0.05)' }}>
                      {b.earned ? b.icon : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="text-sm font-bold text-white">{b.name}</div>
                        <div className="text-xs font-bold" style={{ color: b.earned ? g.color : 'rgba(255,255,255,0.25)' }}>+{b.xp} XP</div>
                      </div>
                      <div className="text-xs text-white/40">{b.desc}</div>
                      {'progress' in b && !b.earned && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-white/25 mb-1">
                            <span>{(b as any).progress?.toLocaleString()} / {(b as any).target?.toLocaleString()}</span>
                            <span>{Math.round(((b as any).progress / (b as any).target) * 100)}%</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((b as any).progress / (b as any).target) * 100)}%`, background: g.color }} />
                          </div>
                        </div>
                      )}
                      {b.earned && 'earnedDate' in b && (
                        <div className="text-xs text-white/25 mt-0.5">Earned {(b as any).earnedDate}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
