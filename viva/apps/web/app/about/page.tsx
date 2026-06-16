'use client'
import { useRouter } from 'next/navigation'

const STATS = [
  { val: '48k+', label: 'Active Profiles' },
  { val: '$2.4M', label: 'Total Staked' },
  { val: '312', label: 'Creator Tokens' },
  { val: '98%', label: 'Uptime' },
]

const TEAM = [
  { name: 'Sovereign V', role: 'Founder & CEO', handle: 'sovereign_v', color: '#a855f7', bio: 'Former quant turned creator. Built 3 profitable communities before VIVA.' },
  { name: 'Maya Chen', role: 'Chief Product', handle: 'mayafit', color: '#22c55e', bio: 'Product leader with 10y building consumer apps at scale.' },
  { name: 'ZeroNode', role: 'CTO', handle: 'zeronode', color: '#818cf8', bio: 'Zero-knowledge cryptography researcher. ex-Protocol Labs.' },
  { name: 'Luna Apex', role: 'Head of Creators', handle: 'luna_apex', color: '#f59e0b', bio: 'Grew personal creator brand to 100k+ before joining VIVA.' },
]

const VALUES = [
  { icon: '💎', title: 'Real Value', desc: 'Every token represents a real relationship between a creator and their community — not speculation.' },
  { icon: '🔑', title: 'Privacy First', desc: 'ZK proofs let you prove token ownership and credentials without revealing personal data.' },
  { icon: '⚖️', title: 'Fair Economics', desc: 'Creators keep the majority of their revenue. VIVA takes a small protocol fee, never more.' },
  { icon: '🌐', title: 'Open Protocol', desc: 'VIVA is building toward a fully open, composable token standard that any platform can integrate.' },
]

const TIMELINE = [
  { date: 'Q1 2026', event: 'VIVA Genesis — first 100 creator tokens launched, $180k staked in 72h' },
  { date: 'Q2 2026', event: 'ZK Identity layer launched. 8k profiles verified without revealing personal data.' },
  { date: 'Q3 2026', event: 'Marketplace and NFT Vault. Creator tokenomics expanded to merch, courses, access.' },
  { date: 'Q4 2026', event: 'DAO governance goes live. Token holders vote on platform direction.' },
  { date: '2027', event: 'Open protocol launch. Third-party apps can integrate VIVA tokens natively.' },
]

export default function AboutPage() {
  const router = useRouter()

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
          <div className="font-bold text-white">About VIVA</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center font-black text-2xl"
            style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>V</div>
          <h1 className="text-3xl font-black text-white">Your profile is property.</h1>
          <p className="text-white/40 leading-relaxed max-w-sm mx-auto">
            VIVA is a social platform where every profile is a financial asset. Creators launch tokens. Fans invest. Everyone earns.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/onboarding')}
              className="px-5 py-2.5 rounded-xl font-black text-sm"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Get started
            </button>
            <button onClick={() => router.push('/pricing')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              View pricing
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {STATS.map(s => (
            <div key={s.label} className="p-3 rounded-xl text-center border border-white/6"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-lg font-black" style={{ color: '#a855f7' }}>{s.val}</div>
              <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="p-5 rounded-2xl border border-white/6 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest">Our Mission</div>
          <p className="text-white/70 leading-relaxed">
            We believe every person has economic potential that today's platforms extract rather than share. VIVA gives creators and communities the tools to build real token economies — where following someone is an investment, not just a subscription.
          </p>
        </div>

        {/* Values */}
        <div className="space-y-3">
          <div className="text-xs text-white/30 uppercase tracking-widest">What We Stand For</div>
          <div className="grid grid-cols-2 gap-3">
            {VALUES.map(v => (
              <div key={v.title} className="p-4 rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="text-xl mb-2">{v.icon}</div>
                <div className="font-bold text-white text-sm mb-1">{v.title}</div>
                <div className="text-xs text-white/40 leading-relaxed">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Token Model */}
        <div className="p-5 rounded-2xl border border-white/6 space-y-4" style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/30 uppercase tracking-widest">How the Token Economy Works</div>
          {[
            { step: '1', title: 'Creator launches a token', desc: 'e.g. $MAYA at $1.00 with 20,000 total supply' },
            { step: '2', title: 'Fans buy in',             desc: 'Each purchase raises token price. Early adopters benefit most.' },
            { step: '3', title: 'Tiers unlock perks',      desc: 'Hold 10+ = Bronze. 25+ = Silver. 50+ = Gold. 100+ = Diamond.' },
            { step: '4', title: 'Stakers earn yield',      desc: 'Lock your tokens for 8–35% APY paid in creator tokens.' },
            { step: '5', title: 'Ad revenue flows to holders', desc: 'Brands pay to advertise on the creator\'s profile. Revenue shares to stakers.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: '#a855f720', color: '#a855f7' }}>{item.step}</div>
              <div>
                <div className="text-sm font-bold text-white/80">{item.title}</div>
                <div className="text-xs text-white/40">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <div className="space-y-3">
          <div className="text-xs text-white/30 uppercase tracking-widest">Roadmap</div>
          <div className="relative pl-4 border-l border-white/8 space-y-4">
            {TIMELINE.map((t, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-5 top-0.5 w-2 h-2 rounded-full"
                  style={{ background: i < 2 ? '#22c55e' : i === 2 ? '#a855f7' : 'rgba(255,255,255,0.15)' }} />
                <div className="text-xs font-black mb-0.5" style={{ color: i < 3 ? '#a855f7' : 'rgba(255,255,255,0.3)' }}>{t.date}</div>
                <div className="text-sm text-white/50">{t.event}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="space-y-3">
          <div className="text-xs text-white/30 uppercase tracking-widest">Core Team</div>
          <div className="grid grid-cols-2 gap-3">
            {TEAM.map(m => (
              <button key={m.handle} onClick={() => router.push(`/profile/${m.handle}`)}
                className="p-4 rounded-xl border border-white/6 text-left hover:border-white/15 transition-all"
                style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm mb-3"
                  style={{ background: `${m.color}18`, color: m.color }}>{m.name[0]}</div>
                <div className="font-bold text-white/85 text-sm">{m.name}</div>
                <div className="text-xs font-semibold mb-1.5" style={{ color: m.color }}>{m.role}</div>
                <div className="text-xs text-white/35 leading-relaxed">{m.bio}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center space-y-3 py-4">
          <div className="text-white/20 text-xs">Built on Railway · Deployed on Vercel · Powered by VIVA Protocol</div>
          <div className="flex justify-center gap-4 text-xs">
            <button onClick={() => router.push('/pricing')} className="text-white/30 hover:text-white/60 transition-colors">Pricing</button>
            <button onClick={() => router.push('/dao')} className="text-white/30 hover:text-white/60 transition-colors">Governance</button>
            <button onClick={() => router.push('/tokens')} className="text-white/30 hover:text-white/60 transition-colors">Token Market</button>
          </div>
        </div>
      </div>
    </div>
  )
}
