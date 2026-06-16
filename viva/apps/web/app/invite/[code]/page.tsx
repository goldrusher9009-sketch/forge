'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const INVITE_CODES: Record<string, { handle: string; name: string; color: string; vscore: number; bonus: number; tier: string }> = {
  SVRN2026:  { handle: 'sovereign_v', name: 'Sovereign V', color: '#a855f7', vscore: 900, bonus: 150, tier: 'Diamond' },
  MAYA100:   { handle: 'mayafit',     name: 'Maya Chen',   color: '#22c55e', vscore: 780, bonus: 100, tier: 'Gold'    },
  JAX50:     { handle: 'jaxbeats',    name: 'Jax Beats',   color: '#ec4899', vscore: 650, bonus: 75,  tier: 'Silver'  },
  VIVA2026:  { handle: 'vivaplatform', name: 'VIVA',       color: '#a855f7', vscore: 999, bonus: 200, tier: 'Diamond' },
}

const PERKS = [
  { icon: '🎁', label: 'Sign-up bonus', desc: 'Free $VIVA tokens on join' },
  { icon: '🚀', label: 'Boosted reach', desc: 'Your posts reach 3x more people in week 1' },
  { icon: '🪙', label: 'Early token',   desc: 'Launch your token immediately (no wait)' },
  { icon: '👥', label: 'VIP access',    desc: 'Direct access to your inviter\'s community' },
]

export default function InviteLandingPage() {
  const router = useRouter()
  const params = useParams()
  const code = typeof params.code === 'string' ? params.code.toUpperCase() : 'VIVA2026'
  const invite = INVITE_CODES[code] ?? INVITE_CODES.VIVA2026

  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  async function join() {
    if (!email.trim() || !handle.trim()) return
    setJoining(true)
    await new Promise(r => setTimeout(r, 1600))
    setJoining(false)
    setJoined(true)
  }

  if (joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <div>
            <div className="text-3xl font-black text-white">Welcome to VIVA!</div>
            <div className="text-white/40 text-sm mt-2">
              @{invite.handle} invited you. Your {invite.bonus} $VIVA bonus is on the way.
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 space-y-2 text-left"
            style={{ background: 'rgba(255,255,255,0.018)' }}>
            {[
              { label: 'Welcome Bonus', value: `${invite.bonus} $VIVA`, color: '#22c55e' },
              { label: 'Your Handle',   value: `@${handle}` },
              { label: 'Invited by',    value: invite.name, color: invite.color },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-white/35">{r.label}</span>
                <span className="font-bold" style={{ color: r.color ?? 'rgba(255,255,255,0.7)' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/onboarding')}
            className="w-full py-4 rounded-2xl font-black text-lg"
            style={{ background: '#a855f7', color: '#04040A' }}>
            Set Up Your Profile →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      {/* Hero gradient */}
      <div className="relative overflow-hidden"
        style={{ background: `linear-gradient(to bottom, ${invite.color}15, transparent)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(circle at 50% 0%, ${invite.color}, transparent 60%)` }} />
        <div className="relative px-6 pt-12 pb-8 text-center">
          {/* Inviter */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl"
              style={{ background: `${invite.color}20`, color: invite.color, border: `2px solid ${invite.color}30` }}>
              {invite.name[0]}
            </div>
            <div className="text-2xl text-white/20">→</div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.1)' }}>
              🧑
            </div>
          </div>

          <div className="text-xs uppercase tracking-widest text-white/30 mb-2">Personal Invite from</div>
          <div className="text-2xl font-black text-white mb-1">{invite.name}</div>
          <div className="text-sm text-white/40 mb-4">
            invited you to join VIVA · {invite.vscore} VScore · {invite.tier} holder
          </div>

          {/* Bonus pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}>
            <span className="text-base">🎁</span>
            <span className="font-black text-sm" style={{ color: '#22c55e' }}>+{invite.bonus} $VIVA welcome bonus</span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* Perks */}
        <div className="grid grid-cols-2 gap-2">
          {PERKS.map(p => (
            <div key={p.label} className="p-3 rounded-xl border border-white/5"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xl mb-1.5">{p.icon}</div>
              <div className="font-bold text-xs text-white/70 mb-0.5">{p.label}</div>
              <div className="text-xs text-white/30">{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Sign-up form */}
        <div className="space-y-3">
          <div className="text-sm font-black text-white/60">Create your account</div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="you@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">Choose a Handle</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/6 bg-white/5">
              <span className="text-white/25">@</span>
              <input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                placeholder="yourhandle"
                className="flex-1 text-white bg-transparent outline-none text-sm" />
            </div>
          </div>

          <button onClick={join} disabled={!email.trim() || !handle.trim() || joining}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
            style={{ background: '#a855f7', color: '#04040A' }}>
            {joining ? 'Creating account…' : `Join with ${invite.bonus} $VIVA Bonus`}
          </button>

          <div className="text-center text-xs text-white/20">
            By joining, you agree to VIVA&apos;s Terms of Service. Already have an account?{' '}
            <button onClick={() => router.push('/auth/onboard')} className="underline" style={{ color: '#a855f7' }}>Sign in</button>
          </div>
        </div>

        {/* Social proof */}
        <div className="p-4 rounded-2xl border border-white/5 text-center"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/25 mb-2">Join 140,000+ creators already on VIVA</div>
          <div className="flex justify-center -space-x-2">
            {['#a855f7','#22c55e','#ec4899','#f59e0b','#818cf8'].map((c, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black"
                style={{ background: `${c}20`, borderColor: 'rgba(4,4,10,0.8)', color: c }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs text-white/30"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(4,4,10,0.8)' }}>+</div>
          </div>
        </div>
      </div>
    </div>
  )
}
