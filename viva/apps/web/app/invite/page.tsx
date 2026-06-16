'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MY_CODE = 'SVRN2026'
const REFERRAL_LINK = `https://viva.app/join?ref=${MY_CODE}`

const PERKS = [
  { icon: '💰', you: '$10 USDC per referral',   them: '$5 USDC bonus on signup' },
  { icon: '📈', you: '5% of their token fees (90d)', them: 'Boosted V-Score for 30 days' },
  { icon: '🏆', you: 'Elite badge at 50 referrals', them: 'Early access to new features' },
]

const TIERS = [
  { label: 'Starter',    min: 0,   max: 4,   color: '#94a3b8', reward: '$10/ref' },
  { label: 'Connector',  min: 5,   max: 14,  color: '#b45309', reward: '$12/ref + 5% fees' },
  { label: 'Amplifier',  min: 15,  max: 49,  color: '#f59e0b', reward: '$15/ref + 7% fees' },
  { label: 'Legend',     min: 50,  max: 999, color: '#818cf8', reward: '$20/ref + 10% + badge' },
]

const REFERRED = [
  { handle: 'crypto_kat', name: 'Kat Zhou',     joined: '2026-06-10', earned: 12.50, status: 'active' },
  { handle: 'danr',       name: 'Dan R.',        joined: '2026-06-08', earned: 10.00, status: 'active' },
  { handle: 'reed_cross', name: 'Reed Cross',    joined: '2026-06-01', earned: 10.00, status: 'active' },
  { handle: 'mateuso',    name: 'Mateus O.',     joined: '2026-05-28', earned: 10.00, status: 'pending' },
]

export default function InvitePage() {
  const router = useRouter()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const totalReferred = REFERRED.length
  const totalEarned = REFERRED.reduce((s, r) => s + r.earned, 0)
  const currentTier = TIERS.slice().reverse().find(t => totalReferred >= t.min) ?? TIERS[0]
  const nextTier = TIERS.find(t => t.min > totalReferred)

  function copy(type: 'code' | 'link') {
    const val = type === 'code' ? MY_CODE : REFERRAL_LINK
    navigator.clipboard.writeText(val).catch(() => {})
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareText = `Join me on VIVA — the social platform where your profile is a financial asset. Sign up with my code ${MY_CODE} and get $5 USDC free. ${REFERRAL_LINK}`

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
          <div className="font-black text-white flex-1">Invite & Earn</div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Hero stats */}
        <div className="p-5 rounded-2xl text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(129,140,248,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div className="text-5xl font-black text-white mb-1">{totalReferred}</div>
          <div className="text-white/40 text-sm mb-4">people you've invited</div>
          <div className="flex gap-3 justify-center">
            <div className="text-center">
              <div className="font-black text-xl" style={{ color: '#22c55e' }}>${totalEarned.toFixed(2)}</div>
              <div className="text-xs text-white/30">Earned</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="font-black text-xl" style={{ color: currentTier.color }}>{currentTier.label}</div>
              <div className="text-xs text-white/30">Your Tier</div>
            </div>
            {nextTier && (
              <>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <div className="font-black text-xl text-white/60">{nextTier.min - totalReferred}</div>
                  <div className="text-xs text-white/30">to {nextTier.label}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Invite code */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Your Invite Code</div>
          <button onClick={() => copy('code')}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/8 transition-all active:scale-98"
            style={{ background: 'rgba(255,255,255,0.025)' }}>
            <span className="font-black text-2xl tracking-widest" style={{ color: '#a855f7', letterSpacing: '0.2em' }}>{MY_CODE}</span>
            <span className="text-sm font-bold px-3 py-1.5 rounded-xl"
              style={{ background: copied === 'code' ? '#22c55e' : 'rgba(168,85,247,0.15)', color: copied === 'code' ? '#04040A' : '#a855f7' }}>
              {copied === 'code' ? '✓ Copied!' : 'Copy Code'}
            </span>
          </button>
        </div>

        {/* Invite link */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Invite Link</div>
          <div className="flex items-center gap-2 p-3 rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <span className="flex-1 text-xs text-white/40 font-mono truncate">{REFERRAL_LINK}</span>
            <button onClick={() => copy('link')}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: copied === 'link' ? '#22c55e' : 'rgba(255,255,255,0.08)', color: copied === 'link' ? '#04040A' : 'white' }}>
              {copied === 'link' ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share sheet */}
        <div className="space-y-2">
          <button onClick={() => setShareOpen(!shareOpen)}
            className="w-full py-3.5 rounded-2xl font-black transition-all"
            style={{ background: '#a855f7', color: '#04040A' }}>
            🔗 Share Invite
          </button>
          {shareOpen && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: '💬', label: 'WhatsApp', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`) },
                { icon: '📱', label: 'X (Twitter)', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`) },
                { icon: '📸', label: 'Instagram', action: () => copy('link') },
                { icon: '✉️', label: 'Email', action: () => window.open(`mailto:?subject=Join me on VIVA&body=${encodeURIComponent(shareText)}`) },
              ].map(s => (
                <button key={s.label} onClick={s.action}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs text-white/40">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Perks */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">What You Both Get</div>
          {PERKS.map((p, i) => (
            <div key={i} className="p-3.5 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">{p.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white/80">You: {p.you}</div>
                  <div className="text-xs text-white/40">Them: {p.them}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tiers */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Referral Tiers</div>
          {TIERS.map(t => {
            const active = t.label === currentTier.label
            return (
              <div key={t.label} className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={active
                  ? { background: `${t.color}08`, borderColor: `${t.color}25` }
                  : { background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <div className="flex-1">
                  <span className="font-bold text-sm" style={{ color: active ? t.color : 'rgba(255,255,255,0.5)' }}>{t.label}</span>
                  <span className="text-xs text-white/25 ml-2">{t.min}{t.max < 999 ? `–${t.max}` : '+'} invites</span>
                </div>
                <span className="text-xs font-bold" style={{ color: active ? t.color : 'rgba(255,255,255,0.3)' }}>{t.reward}</span>
                {active && <span className="text-xs font-black ml-1" style={{ color: t.color }}>← you</span>}
              </div>
            )
          })}
        </div>

        {/* Referred users */}
        {REFERRED.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-white/30 uppercase tracking-widest">Your Referrals</div>
            {REFERRED.map(r => (
              <div key={r.handle} className="flex items-center gap-3 p-3 rounded-xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
                  {r.name[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white/80">{r.name}</div>
                  <div className="text-xs text-white/30">Joined {new Date(r.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black" style={{ color: '#22c55e' }}>+${r.earned.toFixed(2)}</div>
                  <div className="text-xs" style={{ color: r.status === 'active' ? '#22c55e' : '#f59e0b' }}>
                    {r.status === 'active' ? 'Active' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
