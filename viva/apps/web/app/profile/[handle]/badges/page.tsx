'use client'
import { useRouter, useParams } from 'next/navigation'

interface Badge {
  id: string
  emoji: string
  title: string
  desc: string
  category: 'investing' | 'social' | 'creator' | 'special'
  earned: boolean
  earnedDate?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  progress?: number
  progressMax?: number
  progressLabel?: string
}

const PROFILE_BADGES: Record<string, Badge[]> = {
  sovereign_v: [
    { id: 'b1',  emoji: '💎', title: 'Diamond Investor',    desc: 'Hold 100+ tokens in any creator',           category: 'investing', earned: true,  earnedDate: 'May 2026', rarity: 'legendary' },
    { id: 'b2',  emoji: '🌟', title: 'V-Score Legend',      desc: 'Reach V-Score 9000+',                       category: 'social',    earned: true,  earnedDate: 'Apr 2026', rarity: 'legendary' },
    { id: 'b3',  emoji: '🚀', title: 'Early Adopter',       desc: 'Joined VIVA in the first 1000 users',       category: 'special',   earned: true,  earnedDate: 'Jan 2026', rarity: 'legendary' },
    { id: 'b4',  emoji: '🥇', title: 'Gold Staker',         desc: 'Stake 50+ tokens and hold Gold tier',       category: 'investing', earned: true,  earnedDate: 'Mar 2026', rarity: 'epic' },
    { id: 'b5',  emoji: '📈', title: 'Market Oracle',       desc: 'Have 500+ people follow your token alerts', category: 'creator',   earned: true,  earnedDate: 'Apr 2026', rarity: 'epic' },
    { id: 'b6',  emoji: '🎯', title: 'Alpha Caller',        desc: 'Post 3 bullish calls that 2x in 30 days',   category: 'creator',   earned: true,  earnedDate: 'May 2026', rarity: 'rare' },
    { id: 'b7',  emoji: '💬', title: 'Community Builder',   desc: 'Get 1,000 comments on your posts',          category: 'social',    earned: true,  earnedDate: 'Feb 2026', rarity: 'rare' },
    { id: 'b8',  emoji: '🔥', title: 'Streak Master',       desc: 'Post 30 days in a row',                     category: 'creator',   earned: true,  earnedDate: 'Mar 2026', rarity: 'rare' },
    { id: 'b9',  emoji: '💸', title: 'Tip Champion',        desc: 'Send $500 total in tips',                   category: 'social',    earned: false, rarity: 'rare', progress: 380, progressMax: 500, progressLabel: '$380 / $500' },
    { id: 'b10', emoji: '🌐', title: 'Multi-Portfolio',     desc: 'Hold tokens in 5+ different creators',      category: 'investing', earned: false, rarity: 'common', progress: 3, progressMax: 5, progressLabel: '3 / 5 creators' },
    { id: 'b11', emoji: '🎓', title: 'Knowledge Seeker',    desc: 'Attend 10 live workshops or AMAs',          category: 'social',    earned: false, rarity: 'common', progress: 7, progressMax: 10, progressLabel: '7 / 10 events' },
    { id: 'b12', emoji: '👑', title: 'Creator King',        desc: 'Launch your own creator token',             category: 'creator',   earned: false, rarity: 'epic' },
  ],
}

const RARITY_COLOR: Record<string, string> = {
  common: '#94a3b8', rare: '#22c55e', epic: '#a855f7', legendary: '#f59e0b',
}
const RARITY_LABEL: Record<string, string> = {
  common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
}
const CAT_LABEL: Record<string, string> = { investing: 'Investing', social: 'Social', creator: 'Creator', special: 'Special' }
const CAT_EMOJI: Record<string, string> = { investing: '💹', social: '🤝', creator: '✨', special: '⭐' }

const PROFILE_COLORS: Record<string, string> = { sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899' }

export default function ProfileBadgesPage() {
  const router = useRouter()
  const params = useParams()
  const handle = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const badges = PROFILE_BADGES[handle] ?? PROFILE_BADGES.sovereign_v
  const accentColor = PROFILE_COLORS[handle] ?? '#a855f7'

  const earned = badges.filter(b => b.earned)
  const inProgress = badges.filter(b => !b.earned && b.progress !== undefined)
  const locked = badges.filter(b => !b.earned && b.progress === undefined)

  const categories = ['investing', 'social', 'creator', 'special'] as const

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
            <div className="font-black text-white">Badges</div>
            <div className="text-xs text-white/30">@{handle} · {earned.length} earned</div>
          </div>
          <div className="ml-auto font-black text-xl">{earned.length}<span className="text-sm text-white/30">/{badges.length}</span></div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Stats by rarity */}
        <div className="grid grid-cols-4 gap-2">
          {(['legendary', 'epic', 'rare', 'common'] as const).map(r => {
            const count = earned.filter(b => b.rarity === r).length
            return (
              <div key={r} className="p-2 rounded-xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="font-black text-base" style={{ color: RARITY_COLOR[r] }}>{count}</div>
                <div className="text-xs text-white/25 capitalize">{RARITY_LABEL[r]}</div>
              </div>
            )
          })}
        </div>

        {/* Earned badges by category */}
        {categories.map(cat => {
          const catEarned = earned.filter(b => b.category === cat)
          if (catEarned.length === 0) return null
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span>{CAT_EMOJI[cat]}</span>
                <div className="font-black text-sm text-white/60 uppercase tracking-wider">{CAT_LABEL[cat]}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {catEarned.map(badge => (
                  <div key={badge.id} className="p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5"
                    style={{ borderColor: `${RARITY_COLOR[badge.rarity]}20`, background: `${RARITY_COLOR[badge.rarity]}06` }}>
                    <div className="text-3xl">{badge.emoji}</div>
                    <div className="text-xs font-black text-white/70 leading-tight">{badge.title}</div>
                    <div className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: `${RARITY_COLOR[badge.rarity]}15`, color: RARITY_COLOR[badge.rarity] }}>
                      {RARITY_LABEL[badge.rarity]}
                    </div>
                    {badge.earnedDate && <div className="text-xs text-white/20">{badge.earnedDate}</div>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* In-progress badges */}
        {inProgress.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span>⏳</span>
              <div className="font-black text-sm text-white/60 uppercase tracking-wider">In Progress</div>
            </div>
            <div className="space-y-2">
              {inProgress.map(badge => {
                const pct = badge.progressMax ? (badge.progress! / badge.progressMax) * 100 : 0
                return (
                  <div key={badge.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/5"
                    style={{ background: 'rgba(255,255,255,0.018)' }}>
                    <div className="text-2xl opacity-50">{badge.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-white/60">{badge.title}</span>
                        <span className="text-xs text-white/30">{badge.progressLabel}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accentColor }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Locked */}
        {locked.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span>🔒</span>
              <div className="font-black text-sm text-white/60 uppercase tracking-wider">Locked</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {locked.map(badge => (
                <div key={badge.id} className="p-3 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-1.5 opacity-30">
                  <div className="text-3xl grayscale">{badge.emoji}</div>
                  <div className="text-xs font-bold text-white/50 leading-tight">{badge.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
