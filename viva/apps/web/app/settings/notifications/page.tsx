'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NotifSetting { id:string; label:string; desc:string; push:boolean; email:boolean; inApp:boolean; category:string }

const DEFAULTS: NotifSetting[] = [
  { id:'n1',  label:'Token price alerts',       desc:'When tokens you hold move ±5%',              push:true,  email:false, inApp:true,  category:'tokens'   },
  { id:'n2',  label:'New token holders',        desc:'When someone buys your token',               push:true,  email:false, inApp:true,  category:'tokens'   },
  { id:'n3',  label:'Staking rewards',          desc:'Daily staking reward updates',               push:false, email:true,  inApp:true,  category:'tokens'   },
  { id:'n4',  label:'Token drops',              desc:'When creators you follow drop new tokens',   push:true,  email:false, inApp:true,  category:'tokens'   },
  { id:'n5',  label:'New followers',            desc:'When someone follows you',                   push:false, email:false, inApp:true,  category:'social'   },
  { id:'n6',  label:'Post likes',               desc:'When someone likes your content',            push:false, email:false, inApp:true,  category:'social'   },
  { id:'n7',  label:'Tips received',            desc:'When you receive a tip',                     push:true,  email:true,  inApp:true,  category:'social'   },
  { id:'n8',  label:'New posts from creators',  desc:'Content from creators you follow',           push:false, email:false, inApp:true,  category:'social'   },
  { id:'n9',  label:'Live rooms',               desc:'When creators you follow go live',           push:true,  email:false, inApp:true,  category:'social'   },
  { id:'n10', label:'DAO proposals',            desc:'New governance votes',                       push:true,  email:true,  inApp:true,  category:'platform' },
  { id:'n11', label:'Deposit confirmations',    desc:'When deposits arrive',                       push:true,  email:true,  inApp:true,  category:'platform' },
  { id:'n12', label:'Withdrawal confirmations', desc:'When withdrawals process',                   push:true,  email:true,  inApp:true,  category:'platform' },
  { id:'n13', label:'Security alerts',          desc:'Login and account activity',                 push:true,  email:true,  inApp:true,  category:'platform' },
  { id:'n14', label:'Events & RSVP reminders',  desc:'Upcoming events you\'re attending',         push:true,  email:false, inApp:true,  category:'platform' },
  { id:'n15', label:'Weekly digest',            desc:'Weekly summary of your VIVA activity',      push:false, email:true,  inApp:false, category:'platform' },
]

const CATEGORIES = ['tokens', 'social', 'platform']
const CAT_LABELS: Record<string, string> = { tokens:'💎 Tokens', social:'👥 Social', platform:'⚙️ Platform' }

type Channel = 'push' | 'email' | 'inApp'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<NotifSetting[]>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  function toggle(id: string, channel: Channel) {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [channel]: !s[channel as keyof NotifSetting] } : s))
  }

  function toggleAll(category: string, channel: Channel, val: boolean) {
    setSettings(prev => prev.map(s => s.category === category ? { ...s, [channel]: val } : s))
  }

  async function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 font-black text-white">Notification Settings</div>
          <button onClick={save}
            className="px-3 py-1.5 rounded-xl text-xs font-black"
            style={saved ? { background:'#22c55e', color:'#04040A' } : { background:'#a855f7', color:'#04040A' }}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </header>

      {/* Column headers */}
      <div className="sticky top-[60px] z-10 px-4 py-2 border-b border-white/4"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.88)' }}>
        <div className="flex items-center">
          <div className="flex-1" />
          {(['push','email','inApp'] as Channel[]).map(c => (
            <div key={c} className="w-14 text-center text-[10px] text-white/25 font-bold uppercase">
              {c === 'inApp' ? 'In-App' : c}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {CATEGORIES.map(cat => {
          const catSettings = settings.filter(s => s.category === cat)
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-black text-sm text-white/70">{CAT_LABELS[cat]}</div>
                <div className="flex gap-1">
                  {(['push','email','inApp'] as Channel[]).map(ch => {
                    const allOn = catSettings.every(s => s[ch as keyof NotifSetting])
                    return (
                      <button key={ch} onClick={() => toggleAll(cat, ch, !allOn)}
                        className="w-14 text-center text-[10px] font-bold"
                        style={{ color:allOn?'#a855f7':'rgba(255,255,255,0.2)' }}>
                        {allOn ? 'All ✓' : 'All'}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-1">
                {catSettings.map(s => (
                  <div key={s.id} className="flex items-center px-3 py-3 rounded-2xl border border-white/4"
                    style={{ background:'rgba(255,255,255,0.015)' }}>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-sm font-bold text-white/75">{s.label}</div>
                      <div className="text-xs text-white/25">{s.desc}</div>
                    </div>
                    {(['push','email','inApp'] as Channel[]).map(ch => {
                      const val = s[ch as keyof NotifSetting] as boolean
                      return (
                        <button key={ch} onClick={() => toggle(s.id, ch)}
                          className="w-14 flex justify-center">
                          <div className="w-8 h-4 rounded-full relative transition-all"
                            style={{ background:val?'#a855f7':'rgba(255,255,255,0.1)' }}>
                            <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                              style={{ left:val?'calc(100% - 14px)':'2px' }} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Quiet hours */}
        <div>
          <div className="font-black text-sm text-white/70 mb-3">🌙 Quiet Hours</div>
          <div className="p-4 rounded-2xl border border-white/5" style={{ background:'rgba(255,255,255,0.018)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-white/75">Do Not Disturb</div>
                <div className="text-xs text-white/30">Mute push notifications during quiet hours</div>
              </div>
              <div className="w-10 h-5 rounded-full" style={{ background:'rgba(255,255,255,0.1)' }}>
                <div className="w-4 h-4 rounded-full bg-white m-0.5" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="text-xs text-white/25 mb-1">From</div>
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-sm text-white/50">10:00 PM</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/25 mb-1">Until</div>
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-sm text-white/50">8:00 AM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
