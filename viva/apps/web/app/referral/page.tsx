'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Referral {
  handle: string
  name: string
  color: string
  joinedAgo: string
  bonus: number
  status: 'active' | 'pending'
  tokensBought: boolean
}

const MY_REFERRALS: Referral[] = [
  { handle:'lily_p',  name:'Lily Park',  color:'#f59e0b', joinedAgo:'3d',  bonus:25,  status:'active',  tokensBought:true  },
  { handle:'max_t',   name:'Max Tran',   color:'#ec4899', joinedAgo:'5d',  bonus:25,  status:'active',  tokensBought:true  },
  { handle:'sam_q',   name:'Sam Quinn',  color:'#22c55e', joinedAgo:'1w',  bonus:15,  status:'active',  tokensBought:false },
  { handle:'marco_v', name:'Marco V.',   color:'#f87171', joinedAgo:'2w',  bonus:25,  status:'active',  tokensBought:true  },
  { handle:'kai_r',   name:'Kai Reed',   color:'#22c55e', joinedAgo:'3w',  bonus:10,  status:'pending', tokensBought:false },
]

const MY_CODE   = 'SVRN-X9K2'
const TOTAL_EARNED = MY_REFERRALS.filter(r => r.status === 'active').reduce((s, r) => s + r.bonus, 0)
const ACTIVE_CT = MY_REFERRALS.filter(r => r.status === 'active').length
const TIERS = [
  { label:'1–5 referrals',  bonus:'$10 USDC each',   active:true  },
  { label:'6–15 referrals', bonus:'$15 USDC each',   active:false },
  { label:'16–30',          bonus:'$20 USDC each',   active:false },
  { label:'31+ referrals',  bonus:'$25 USDC + bonus', active:false },
]

export default function ReferralPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  function copyCode() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const progress = (MY_REFERRALS.length / 15) * 100

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
          <div className="flex-1 font-black text-white">Referral Program</div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Hero card */}
        <div className="p-5 rounded-2xl border text-center"
          style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.15)' }}>
          <div className="text-4xl font-black text-white mb-1">🎁</div>
          <div className="font-black text-xl text-white">Earn for every friend</div>
          <div className="text-sm text-white/40 mt-1">Get up to $25 USDC per referral who buys tokens</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Referred',  value:MY_REFERRALS.length, color:'#a855f7' },
            { label:'Active',    value:ACTIVE_CT,           color:'#22c55e' },
            { label:'Earned',    value:`$${TOTAL_EARNED}`,  color:'#f59e0b' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Referral code */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Your Code</div>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl font-black text-lg tracking-widest text-center"
              style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7', borderColor: 'rgba(168,85,247,0.15)', border: '1px solid' }}>
              {MY_CODE}
            </div>
            <button onClick={copyCode}
              className="px-3 py-2 rounded-xl font-black text-xs"
              style={copied ? { background: '#22c55e', color: '#04040A' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          <button onClick={copyLink}
            className="mt-2 w-full py-2.5 rounded-xl font-black text-xs"
            style={copiedLink ? { background: '#22c55e', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            {copiedLink ? '✓ Link copied!' : '🔗 Copy invite link'}
          </button>
        </div>

        {/* Progress toward next tier */}
        <div className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white/35 font-semibold uppercase tracking-wider">Progress</span>
            <span className="text-white/40">{MY_REFERRALS.length} / 15 for next tier</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, progress)}%`, background: '#a855f7' }} />
          </div>
          <div className="mt-3 space-y-2">
            {TIERS.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: t.active ? '#a855f7' : 'rgba(255,255,255,0.06)' }}>
                  {t.active && <span className="text-black font-black text-[9px]">✓</span>}
                </div>
                <span className="text-white/40">{t.label}</span>
                <span className="ml-auto font-bold" style={{ color: t.active ? '#a855f7' : 'rgba(255,255,255,0.25)' }}>{t.bonus}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referred list */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Your Referrals</div>
          <div className="space-y-2">
            {MY_REFERRALS.map(r => (
              <div key={r.handle} className="flex items-center gap-3 p-3 rounded-2xl border border-white/4"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${r.color}15`, color: r.color }}>
                  {r.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white/80">{r.name}</div>
                  <div className="text-xs text-white/25">
                    @{r.handle} · joined {r.joinedAgo}
                    {r.tokensBought && <span className="ml-1" style={{ color:'#22c55e' }}>· bought tokens ✓</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-sm" style={{ color: r.status === 'active' ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>
                    {r.status === 'active' ? `+$${r.bonus}` : 'Pending'}
                  </div>
                  <div className="text-xs text-white/20">{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="p-4 rounded-2xl border border-white/5 space-y-3" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">How It Works</div>
          {[
            { step:'1', text:'Share your code or link with friends' },
            { step:'2', text:'They sign up using your code' },
            { step:'3', text:'Earn $10–$25 USDC when they buy tokens' },
            { step:'4', text:'Unlock higher bonuses as you refer more' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: '#a855f715', color: '#a855f7' }}>{s.step}</div>
              <span className="text-sm text-white/50">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
