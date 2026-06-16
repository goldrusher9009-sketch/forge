'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, period: '',
    color: '#94a3b8', highlight: false,
    features: [
      'Basic profile + feed',
      'Follow up to 50 creators',
      'Buy & hold creator tokens',
      'Bronze staking tier',
      'Community rooms (listen-only)',
      '1 active marketplace listing',
    ],
    cta: 'Get started free',
  },
  {
    id: 'pro', name: 'Pro', price: 9.99, period: '/mo',
    color: '#a855f7', highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Free',
      'Unlimited follows',
      'Token analytics dashboard',
      'Silver staking access',
      'Speak in community rooms',
      '10 marketplace listings',
      'Creator monetization tools',
      'Priority feed placement',
      'Ad revenue sharing (5%)',
    ],
    cta: 'Start Pro — 14 days free',
  },
  {
    id: 'diamond', name: 'Diamond', price: 29.99, period: '/mo',
    color: '#818cf8', highlight: false,
    badge: 'For Serious Creators',
    features: [
      'Everything in Pro',
      'Diamond staking APY (35%)',
      'Launch your own token',
      'Custom ad slot pricing',
      'Verified creator badge',
      'Unlimited marketplace listings',
      'DAO voting power ×3',
      'Revenue share (20%)',
      'Dedicated creator dashboard',
      '1:1 onboarding call',
    ],
    cta: 'Go Diamond',
  },
]

const FAQS = [
  { q: 'What is a creator token?', a: 'A creator token is a personal digital asset tied to a creator\'s VIVA profile. When you invest in a token, you\'re buying into the creator\'s future success. Tokens entitle holders to perks, revenue sharing, and governance rights.' },
  { q: 'How does staking work?', a: 'Staking means locking your creator tokens for a set period in exchange for APY rewards. Higher tiers (Bronze → Diamond) unlock higher yields (8% → 35% APY) and additional perks like revenue sharing and 1:1 access.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Pro and Diamond are month-to-month. Cancel anytime from Settings → Billing. Your token holdings and staking positions are unaffected by plan changes.' },
  { q: 'How is ad revenue shared?', a: 'Creators set aside a portion of their advertising income for token holders. Pro creators share 5%; Diamond creators share up to 20%. Revenue is distributed monthly in USDC directly to your wallet.' },
]

export default function PricingPage() {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const discount = billing === 'annual' ? 0.8 : 1

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
            <h1 className="font-bold text-white">Pricing</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-white">Invest in people.<br/>Earn while they grow.</h2>
          <p className="text-white/40 text-sm max-w-sm mx-auto">Start free. Upgrade when you're ready to unlock the full token economy.</p>
          <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {(['monthly', 'annual'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                style={billing === b
                  ? { background: '#a855f7', color: '#04040A' }
                  : { color: 'rgba(255,255,255,0.4)' }}>
                {b} {b === 'annual' && <span className="ml-1 text-green-400">–20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id} className={`relative p-5 rounded-2xl border flex flex-col ${plan.highlight ? 'border-purple-500/40' : 'border-white/8'}`}
              style={{ background: plan.highlight ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.018)' }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap"
                  style={{ background: plan.color, color: '#04040A' }}>{plan.badge}</div>
              )}
              <div className="mb-4">
                <div className="font-black text-white mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black" style={{ color: plan.color }}>
                    {plan.price === 0 ? 'Free' : `$${(plan.price * discount).toFixed(2)}`}
                  </span>
                  {plan.price > 0 && <span className="text-white/30 text-sm">{plan.period}</span>}
                </div>
                {billing === 'annual' && plan.price > 0 && (
                  <div className="text-xs text-green-400 mt-0.5">Save ${(plan.price * 0.2 * 12).toFixed(0)}/yr</div>
                )}
              </div>

              <ul className="flex-1 space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/60">
                    <span style={{ color: plan.color }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => router.push(plan.price === 0 ? '/onboarding' : '/settings')}
                className="w-full py-3 rounded-xl font-black text-sm"
                style={plan.highlight
                  ? { background: plan.color, color: '#04040A' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'white', border: `1px solid ${plan.color}30` }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature comparison teaser */}
        <div className="p-4 rounded-2xl border border-white/6 text-center space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-sm font-bold text-white/70">Token holder? You unlock Pro features automatically.</div>
          <div className="text-xs text-white/35">Hold 25+ tokens of any creator → Silver access. Hold 100+ → Diamond access. No subscription needed.</div>
          <button onClick={() => router.push('/tokens')} className="text-xs font-bold" style={{ color: '#a855f7' }}>
            Browse creator tokens →
          </button>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h3 className="text-lg font-black text-white">Common questions</h3>
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left">
                <span className="text-sm font-semibold text-white/80">{faq.q}</span>
                <span className="text-white/30 text-xs">{openFaq === i ? '▲' : '▼'}</span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-white/45 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
