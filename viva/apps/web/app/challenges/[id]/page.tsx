'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Challenge {
  id: string
  title: string
  description: string
  type: 'streak' | 'earnings' | 'social' | 'token' | 'content'
  icon: string
  color: string
  reward: string
  rewardAmount: number
  rewardType: '$VIVA' | 'XP' | 'Badge' | 'Token Boost'
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic'
  deadline: string
  participants: number
  maxParticipants: number | null
  progress: number
  goal: number
  unit: string
  joined: boolean
  sponsored: boolean
  sponsorName?: string
  requirements: string[]
  leaderboard: { rank: number; handle: string; name: string; color: string; progress: number }[]
}

const CHALLENGES: Record<string, Challenge> = {
  ch1: {
    id: 'ch1',
    title: '30-Day Post Streak',
    description: 'Post at least once every day for 30 consecutive days and earn a massive token reward plus an exclusive badge.',
    type: 'streak',
    icon: '🔥',
    color: '#f59e0b',
    reward: '500 $VIVA + Streak Badge',
    rewardAmount: 500,
    rewardType: '$VIVA',
    difficulty: 'Hard',
    deadline: '2026-07-01',
    participants: 1842,
    maxParticipants: null,
    progress: 14,
    goal: 30,
    unit: 'days',
    joined: false,
    sponsored: true,
    sponsorName: 'VIVA Platform',
    requirements: [
      'Post at least 1 original piece of content per day',
      'Skipping a day resets your streak',
      'Reposts and shares do not count',
      'Content must receive at least 1 engagement',
    ],
    leaderboard: [
      { rank: 1, handle: 'mayafit',    name: 'Maya Chen',   color: '#22c55e', progress: 30 },
      { rank: 2, handle: 'sovereign_v', name: 'Sovereign V', color: '#a855f7', progress: 29 },
      { rank: 3, handle: 'jaxbeats',   name: 'Jax Beats',   color: '#ec4899', progress: 27 },
    ],
  },
  ch2: {
    id: 'ch2',
    title: 'Token Whale Challenge',
    description: 'Accumulate 500 tokens across any 5 profiles. Stake them to qualify. Winners split a massive prize pool.',
    type: 'token',
    icon: '🐋',
    color: '#818cf8',
    reward: '2,000 $VIVA split',
    rewardAmount: 2000,
    rewardType: '$VIVA',
    difficulty: 'Epic',
    deadline: '2026-06-30',
    participants: 304,
    maxParticipants: 500,
    progress: 0,
    goal: 500,
    unit: 'tokens',
    joined: false,
    sponsored: false,
    requirements: [
      'Hold tokens across at least 5 different profiles',
      'Total holdings must reach 500 tokens',
      'All tokens must be staked (not just held)',
      'Must maintain holdings until deadline',
    ],
    leaderboard: [
      { rank: 1, handle: 'crypto_kat',  name: 'Kat Zhou',    color: '#818cf8', progress: 480 },
      { rank: 2, handle: 'atlas_burns', name: 'Atlas Burns',  color: '#60a5fa', progress: 410 },
      { rank: 3, handle: 'moonset99',   name: 'Moonset',      color: '#22c55e', progress: 390 },
    ],
  },
}

const DIFF_STYLES: Record<string, { color: string; bg: string }> = {
  Easy:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  Hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  Epic:   { color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
}

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

export default function ChallengeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'ch1'
  const challenge = CHALLENGES[id] ?? CHALLENGES.ch1

  const [joined, setJoined] = useState(challenge.joined)
  const [joining, setJoining] = useState(false)
  const [showJoinSuccess, setShowJoinSuccess] = useState(false)

  const diff = DIFF_STYLES[challenge.difficulty]
  const progressPct = Math.min(100, (challenge.progress / challenge.goal) * 100)
  const days = daysLeft(challenge.deadline)
  const full = challenge.maxParticipants !== null && challenge.participants >= challenge.maxParticipants

  async function join() {
    setJoining(true)
    await new Promise(r => setTimeout(r, 1000))
    setJoining(false)
    setJoined(true)
    setShowJoinSuccess(true)
    setTimeout(() => setShowJoinSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--ink)' }}>
      {/* Hero */}
      <div className="relative h-48 flex flex-col justify-end pb-4 px-4"
        style={{ background: `linear-gradient(to bottom, ${challenge.color}20, ${challenge.color}05)` }}>
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-white/50"
          style={{ background: 'rgba(4,4,10,0.5)' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="text-4xl mb-2">{challenge.icon}</div>
        <div className="text-2xl font-black text-white leading-tight">{challenge.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full font-black"
            style={diff}>
            {challenge.difficulty}
          </span>
          {challenge.sponsored && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
              Sponsored by {challenge.sponsorName}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Time Left', value: days > 0 ? `${days}d` : 'Ended', color: days <= 3 ? '#f87171' : 'white' },
            { label: 'Joined',    value: challenge.participants.toLocaleString(), color: 'white' },
            { label: 'Reward',    value: `${challenge.rewardAmount} ${challenge.rewardType}`, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 mb-0.5">{s.label}</div>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="text-sm text-white/50 leading-relaxed">{challenge.description}</div>

        {/* Progress (if joined) */}
        {joined && (
          <div className="p-4 rounded-2xl border space-y-2"
            style={{ background: `${challenge.color}08`, borderColor: `${challenge.color}20` }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Your progress</span>
              <span className="font-black" style={{ color: challenge.color }}>{challenge.progress}/{challenge.goal} {challenge.unit}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: challenge.color }} />
            </div>
            <div className="text-xs text-white/30">{progressPct.toFixed(0)}% complete</div>
          </div>
        )}

        {/* Requirements */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Requirements</div>
          <div className="p-4 rounded-2xl border border-white/5 space-y-2"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            {challenge.requirements.map((r, i) => (
              <div key={i} className="flex gap-2.5 text-sm text-white/50">
                <span className="text-white/20 flex-shrink-0 mt-0.5">•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Top Participants</div>
          <div className="space-y-1.5">
            {challenge.leaderboard.map(l => (
              <button key={l.handle} onClick={() => router.push(`/profile/${l.handle}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/4 text-left"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <span className="font-black text-sm w-5 text-center"
                  style={{ color: l.rank <= 3 ? challenge.color : 'rgba(255,255,255,0.2)' }}>
                  #{l.rank}
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                  style={{ background: `${l.color}18`, color: l.color }}>
                  {l.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-white/75">{l.name}</div>
                  <div className="text-xs text-white/25">@{l.handle}</div>
                </div>
                <div className="font-black text-sm" style={{ color: challenge.color }}>
                  {l.progress}/{challenge.goal} {challenge.unit}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/5"
        style={{ background: 'rgba(4,4,10,0.95)', backdropFilter: 'blur(20px)' }}>
        {showJoinSuccess && (
          <div className="mb-3 p-2.5 rounded-xl text-center text-sm font-bold"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            ✓ You&apos;re in! Challenge accepted.
          </div>
        )}
        {joined ? (
          <button className="w-full py-4 rounded-2xl font-black text-lg"
            style={{ background: '#22c55e', color: '#04040A' }}>
            ✓ Joined · Track Progress
          </button>
        ) : full ? (
          <button disabled className="w-full py-4 rounded-2xl font-black text-lg opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
            Challenge Full
          </button>
        ) : (
          <button onClick={join} disabled={joining}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
            style={{ background: challenge.color, color: '#04040A' }}>
            {joining ? 'Joining…' : `${challenge.icon} Accept Challenge`}
          </button>
        )}
        {!joined && !full && challenge.maxParticipants && (
          <div className="text-center text-xs text-white/20 mt-1.5">
            {challenge.maxParticipants - challenge.participants} spots remaining
          </div>
        )}
      </div>
    </div>
  )
}
