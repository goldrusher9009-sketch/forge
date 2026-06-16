'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Finance', 'Health', 'Tech', 'Music', 'Art', 'Gaming', 'Lifestyle', 'Education']
const FORMATS = [
  { id: 'audio',  icon: '🎙️', label: 'Audio Room',   desc: 'Voice-only. Speakers + listeners.' },
  { id: 'chat',   icon: '💬', label: 'Chat Room',    desc: 'Text chat with optional audio.' },
  { id: 'hybrid', icon: '📱', label: 'Stage + Video', desc: 'Speakers on stage, video clips feed.' },
]

const GATE_OPTIONS = [
  { id: 'open',    label: 'Open to all',        desc: 'Anyone on VIVA can join.' },
  { id: 'vscore',  label: 'V-Score minimum',    desc: 'Require a minimum reputation score.' },
  { id: 'token',   label: 'Token holders only', desc: 'Require holding a specific creator token.' },
  { id: 'private', label: 'Invite only',         desc: 'Only people you invite can join.' },
]

export default function CreateRoomPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('')
  const [format, setFormat] = useState('audio')
  const [gate, setGate] = useState('open')
  const [minVScore, setMinVScore] = useState('0')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [minTokens, setMinTokens] = useState('10')
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [launching, setLaunching] = useState(false)

  const canCreate = title.trim().length > 0 && category !== ''

  async function createRoom() {
    setLaunching(true)
    await new Promise(r => setTimeout(r, 1200))
    setLaunching(false)
    router.push('/rooms/r_new')
  }

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
          <div className="font-black text-white flex-1">Create Room</div>
          <button onClick={createRoom} disabled={!canCreate || launching}
            className="px-4 py-1.5 rounded-xl text-sm font-black transition-all disabled:opacity-30"
            style={{ background: '#a855f7', color: '#04040A' }}>
            {launching ? 'Starting…' : scheduleMode === 'now' ? '🔴 Go Live' : '📅 Schedule'}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/35 uppercase tracking-wider font-semibold">Room Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="What's the room about?"
            className="w-full px-4 py-3 rounded-2xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/35 uppercase tracking-wider font-semibold">Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Tell people what to expect…" rows={3}
            className="w-full px-4 py-3 rounded-2xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none resize-none" />
        </div>

        {/* Format */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 uppercase tracking-wider font-semibold">Format</div>
          {FORMATS.map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all"
              style={format === f.id
                ? { background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.35)' }
                : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-xl">{f.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-white/80">{f.label}</div>
                <div className="text-xs text-white/30">{f.desc}</div>
              </div>
              {format === f.id && <span style={{ color: '#a855f7' }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 uppercase tracking-wider font-semibold">Category *</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={category === c
                  ? { background: '#a855f7', color: '#04040A' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Access gate */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 uppercase tracking-wider font-semibold">Access</div>
          {GATE_OPTIONS.map(g => (
            <button key={g.id} onClick={() => setGate(g.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
              style={gate === g.id
                ? { background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }
                : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex-1">
                <div className="text-sm font-bold text-white/80">{g.label}</div>
                <div className="text-xs text-white/30">{g.desc}</div>
              </div>
              {gate === g.id && <span style={{ color: '#a855f7' }}>✓</span>}
            </button>
          ))}

          {gate === 'vscore' && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-white/40">Min V-Score:</label>
              <input value={minVScore} onChange={e => setMinVScore(e.target.value.replace(/\D/g, ''))}
                className="w-24 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/8 text-white outline-none" />
            </div>
          )}
          {gate === 'token' && (
            <div className="flex items-center gap-3">
              <input value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="Token symbol"
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none font-mono" />
              <input value={minTokens} onChange={e => setMinTokens(e.target.value.replace(/\D/g, ''))}
                placeholder="Min amount"
                className="w-24 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/8 text-white outline-none" />
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 uppercase tracking-wider font-semibold">When</div>
          <div className="flex gap-2">
            <button onClick={() => setScheduleMode('now')}
              className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
              style={scheduleMode === 'now'
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              🔴 Start Now
            </button>
            <button onClick={() => setScheduleMode('later')}
              className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
              style={scheduleMode === 'later'
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              📅 Schedule
            </button>
          </div>
          {scheduleMode === 'later' && (
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/8 text-white outline-none" />
          )}
        </div>

        <button onClick={createRoom} disabled={!canCreate || launching}
          className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
          style={{ background: '#a855f7', color: '#04040A' }}>
          {launching ? 'Creating room…' : scheduleMode === 'now' ? '🔴 Start Room' : '📅 Schedule Room'}
        </button>
      </div>
    </div>
  )
}
