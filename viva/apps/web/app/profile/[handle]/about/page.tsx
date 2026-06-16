'use client'
import { useRouter, useParams } from 'next/navigation'

interface ProfileAbout {
  name: string
  handle: string
  color: string
  verified: boolean
  vscore: number
  bio: string
  location: string
  joined: string
  website?: string
  categories: string[]
  tokenSymbol: string
  tokenPrice: number
  totalHolders: number
  totalSupply: number
  stats: { label:string; value:string }[]
  links: { icon:string; label:string; url:string }[]
  milestones: { date:string; text:string }[]
}

const PROFILES: Record<string, ProfileAbout> = {
  sovereign_v: {
    name:'Sovereign V', handle:'sovereign_v', color:'#a855f7', verified:true, vscore:9840,
    bio:'DeFi educator, macro analyst, and on-chain researcher. I share my actual portfolio, trade setups, and long-term conviction plays.\n\nBuilding the SVRN community of 2,800+ serious investors. No hype — only data.',
    location:'New York, USA', joined:'November 2024', website:'https://sovereign.finance',
    categories:['DeFi', 'Macro', 'On-chain Analytics', 'Portfolio Management'],
    tokenSymbol:'SVRN', tokenPrice:8.75, totalHolders:2840, totalSupply:100000,
    stats:[
      { label:'Followers',     value:'48.2k'   },
      { label:'Following',     value:'312'     },
      { label:'Posts',         value:'1,240'   },
      { label:'Token Holders', value:'2,840'   },
      { label:'Total Tips',    value:'$42,800' },
      { label:'V-Score',       value:'9,840'   },
    ],
    links:[
      { icon:'🐦', label:'Twitter / X', url:'https://x.com/sovereign_v'    },
      { icon:'📺', label:'YouTube',     url:'https://youtube.com/@sovereign' },
      { icon:'💬', label:'Telegram',    url:'https://t.me/sovereign_v'      },
    ],
    milestones:[
      { date:'Jun 2026',  text:'Reached 2,800 SVRN holders and $100k TVL' },
      { date:'Apr 2026',  text:'SVRN token hit all-time high of $12.40'    },
      { date:'Feb 2026',  text:'Diamond staking tier launched'              },
      { date:'Jan 2026',  text:'Crossed 40k followers'                     },
      { date:'Nov 2024',  text:'Joined VIVA and launched $SVRN token'      },
    ],
  },
  mayafit: {
    name:'Maya Chen', handle:'mayafit', color:'#22c55e', verified:true, vscore:8720,
    bio:'Certified personal trainer and nutrition coach. I share science-backed training programs, meal plans, and mindset content.\n\n$MAYA holders get exclusive 12-week programs, live coaching, and community challenges.',
    location:'Los Angeles, USA', joined:'December 2024', website:'https://mayafit.io',
    categories:['Fitness', 'Nutrition', 'Wellness', 'Mindset'],
    tokenSymbol:'MAYA', tokenPrice:5.20, totalHolders:1620, totalSupply:100000,
    stats:[
      { label:'Followers',     value:'62.1k'   },
      { label:'Following',     value:'890'     },
      { label:'Posts',         value:'2,840'   },
      { label:'Token Holders', value:'1,620'   },
      { label:'Total Tips',    value:'$18,400' },
      { label:'V-Score',       value:'8,720'   },
    ],
    links:[
      { icon:'📸', label:'Instagram', url:'https://instagram.com/mayafit' },
      { icon:'📺', label:'YouTube',   url:'https://youtube.com/@mayafit'  },
    ],
    milestones:[
      { date:'May 2026', text:'1,600 MAYA holders milestone'      },
      { date:'Mar 2026', text:'Launched 12-week shred program PDF' },
      { date:'Jan 2026', text:'Crossed 50k followers'             },
      { date:'Dec 2024', text:'Joined VIVA and launched $MAYA'    },
    ],
  },
}

export default function ProfileAboutPage() {
  const router = useRouter()
  const params = useParams()
  const handle  = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const profile = PROFILES[handle] ?? PROFILES.sovereign_v
  const accent  = profile.color

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
          <div className="flex-1">
            <div className="font-black text-white">About</div>
            <div className="text-xs text-white/30">@{handle}</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Avatar + hero */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/4"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0"
            style={{ background: `${accent}18`, color: accent }}>
            {profile.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-white">{profile.name}</span>
              {profile.verified && <span style={{ color: accent }}>✓</span>}
            </div>
            <div className="text-sm text-white/40">@{handle}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${accent}15`, color: accent }}>V-Score {profile.vscore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="p-4 rounded-2xl border border-white/4" style={{ background:'rgba(255,255,255,0.018)' }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Bio</div>
          <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{profile.bio}</div>
        </div>

        {/* Details */}
        <div className="p-4 rounded-2xl border border-white/4 space-y-2.5" style={{ background:'rgba(255,255,255,0.018)' }}>
          {[
            { icon:'📍', label: profile.location },
            { icon:'📅', label: `Joined ${profile.joined}` },
            ...(profile.website ? [{ icon:'🌐', label: profile.website }] : []),
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-white/40">
              <span>{d.icon}</span><span>{d.label}</span>
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.categories.map(c => (
              <span key={c} className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background:`${accent}12`, color:accent }}>{c}</span>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {profile.stats.map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-white/5 text-center"
              style={{ background:'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-sm text-white/80">{s.value}</div>
              <div className="text-xs text-white/25">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Token info */}
        <div className="p-4 rounded-2xl border" style={{ background:`${accent}05`, borderColor:`${accent}18` }}>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Token</div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-black text-lg" style={{ color: accent }}>${profile.tokenSymbol}</div>
            <div className="font-black text-lg text-white/80">${profile.tokenPrice}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-white/25">Holders</span> <span className="font-bold text-white/60 ml-1">{profile.totalHolders.toLocaleString()}</span></div>
            <div><span className="text-white/25">Supply</span>  <span className="font-bold text-white/60 ml-1">{(profile.totalSupply/1000).toFixed(0)}k</span></div>
          </div>
          <button onClick={() => router.push(`/tokens/${profile.tokenSymbol}/chart`)}
            className="mt-3 w-full py-2 rounded-xl text-xs font-black"
            style={{ background: accent, color:'#04040A' }}>
            View ${profile.tokenSymbol} Market →
          </button>
        </div>

        {/* Links */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">Links</div>
          {profile.links.map(l => (
            <div key={l.url} className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
              style={{ background:'rgba(255,255,255,0.018)' }}>
              <span className="text-xl">{l.icon}</span>
              <span className="text-sm text-white/50 font-bold">{l.label}</span>
              <span className="ml-auto text-xs text-white/20 truncate max-w-32">{l.url.replace('https://','')}</span>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-3">Milestones</div>
          <div className="relative pl-5">
            <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background:'rgba(255,255,255,0.06)' }} />
            {profile.milestones.map((m, i) => (
              <div key={i} className="relative mb-4">
                <div className="absolute -left-3 top-1 w-2 h-2 rounded-full" style={{ background: accent }} />
                <div className="text-xs text-white/25 mb-0.5">{m.date}</div>
                <div className="text-sm text-white/60">{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
