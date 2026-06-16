'use client'
import { useRouter, useParams } from 'next/navigation'

interface Award {
  id: string
  title: string
  icon: string
  color: string
  description: string
  earnedDate: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: 'milestone' | 'community' | 'trading' | 'content' | 'special'
}

const PROFILE_AWARDS: Record<string, Award[]> = {
  sovereign_v: [
    { id:'a1',  title:'Diamond Creator',     icon:'💎', color:'#818cf8', description:'Achieved Diamond token holder tier',      earnedDate:'May 2026',  rarity:'legendary', category:'milestone' },
    { id:'a2',  title:'V-Score Elite',        icon:'⭐', color:'#f59e0b', description:'V-Score exceeded 9,000',                  earnedDate:'Apr 2026',  rarity:'epic',      category:'milestone' },
    { id:'a3',  title:'Token Pioneer',        icon:'🚀', color:'#a855f7', description:'Launched a creator token (early adopter)', earnedDate:'Jan 2026',  rarity:'rare',      category:'special'   },
    { id:'a4',  title:'10k Followers',        icon:'👥', color:'#22c55e', description:'Reached 10,000 followers',                earnedDate:'Mar 2026',  rarity:'rare',      category:'milestone' },
    { id:'a5',  title:'Alpha Caller',         icon:'📊', color:'#ec4899', description:'3+ signals with 20%+ return verified',    earnedDate:'Feb 2026',  rarity:'epic',      category:'trading'   },
    { id:'a6',  title:'Community Builder',    icon:'🏗',  color:'#818cf8', description:'Hosted 10+ live rooms with 100+ attendees',earnedDate:'Apr 2026', rarity:'rare',      category:'community' },
    { id:'a7',  title:'Viral Post',           icon:'🔥', color:'#f87171', description:'Post reached 10k+ likes',                 earnedDate:'Mar 2026',  rarity:'common',    category:'content'   },
    { id:'a8',  title:'Verified Creator',     icon:'✓',  color:'#a855f7', description:'Completed identity verification',         earnedDate:'Dec 2025',  rarity:'common',    category:'milestone' },
  ],
  mayafit: [
    { id:'a1', title:'Fitness Icon',          icon:'💪', color:'#22c55e', description:'100k+ followers in fitness category',     earnedDate:'May 2026',  rarity:'legendary', category:'milestone' },
    { id:'a2', title:'V-Score Elite',         icon:'⭐', color:'#f59e0b', description:'V-Score exceeded 8,000',                  earnedDate:'Mar 2026',  rarity:'epic',      category:'milestone' },
    { id:'a3', title:'Transformation Pro',    icon:'🌟', color:'#f59e0b', description:'100+ documented member transformations',   earnedDate:'Apr 2026',  rarity:'rare',      category:'content'   },
    { id:'a4', title:'Verified Creator',      icon:'✓',  color:'#22c55e', description:'Completed identity verification',         earnedDate:'Nov 2025',  rarity:'common',    category:'milestone' },
  ],
}

const RARITY_COLOR: Record<string, string> = { common:'rgba(255,255,255,0.3)', rare:'#22c55e', epic:'#a855f7', legendary:'#f59e0b' }
const RARITY_LABEL: Record<string, string> = { common:'Common', rare:'Rare', epic:'Epic', legendary:'Legendary' }

const PROFILE_COLORS: Record<string, string> = { sovereign_v: '#a855f7', mayafit: '#22c55e', jaxbeats: '#ec4899' }

export default function ProfileAwardsPage() {
  const router = useRouter()
  const params = useParams()
  const handle  = typeof params.handle === 'string' ? params.handle : 'sovereign_v'
  const awards  = PROFILE_AWARDS[handle] ?? PROFILE_AWARDS.sovereign_v
  const accent  = PROFILE_COLORS[handle] ?? '#a855f7'

  const legendary = awards.filter(a => a.rarity === 'legendary').length
  const epic      = awards.filter(a => a.rarity === 'epic').length
  const rare      = awards.filter(a => a.rarity === 'rare').length

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
            <div className="font-black text-white">Awards</div>
            <div className="text-xs text-white/30">@{handle} · {awards.length} earned</div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Rarity summary */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label:'Legendary', value:legendary, color:'#f59e0b' },
            { label:'Epic',      value:epic,      color:'#a855f7' },
            { label:'Rare',      value:rare,      color:'#22c55e' },
            { label:'Total',     value:awards.length, color:'rgba(255,255,255,0.5)' },
          ].map(s => (
            <div key={s.label} className="p-2 rounded-xl border border-white/5 text-center"
              style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="font-black text-base" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/20 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Awards grid */}
        <div className="grid grid-cols-2 gap-3">
          {awards.map(a => (
            <div key={a.id} className="p-4 rounded-2xl border border-white/4 flex flex-col"
              style={{ background: 'rgba(255,255,255,0.018)', borderColor: a.rarity === 'legendary' ? `${a.color}30` : undefined }}>
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto"
                style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                {a.icon}
              </div>
              {/* Rarity badge */}
              <div className="text-center mb-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${RARITY_COLOR[a.rarity]}15`, color: RARITY_COLOR[a.rarity] }}>
                  {RARITY_LABEL[a.rarity]}
                </span>
              </div>
              {/* Info */}
              <div className="font-black text-sm text-white/80 text-center mb-1">{a.title}</div>
              <div className="text-xs text-white/25 text-center leading-tight flex-1">{a.description}</div>
              <div className="text-xs text-white/20 text-center mt-2">{a.earnedDate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
