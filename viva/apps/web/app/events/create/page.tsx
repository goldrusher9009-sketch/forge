'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FORMATS = [
  { id: 'live',     icon: '🔴', label: 'Live Stream',    desc: 'Real-time video + chat' },
  { id: 'audio',    icon: '🎙️', label: 'Audio Stage',    desc: 'Clubhouse-style room' },
  { id: 'ama',      icon: '💬', label: 'AMA',            desc: 'Q&A with your community' },
  { id: 'workshop', icon: '🧑‍💻', label: 'Workshop',      desc: 'Hands-on session with screenshare' },
  { id: 'collab',   icon: '🤝', label: 'Collab',         desc: 'With another creator' },
]

const CATEGORIES = ['Finance', 'Crypto', 'Health', 'Music', 'Education', 'Tech', 'Art', 'Gaming']

const ACCESS_OPTIONS = [
  { id: 'free',    label: 'Free',            desc: 'Open to all followers' },
  { id: 'token',   label: 'Token Gated',     desc: 'Require holding your token' },
  { id: 'ticket',  label: 'Paid Ticket',     desc: 'Charge USDC admission' },
  { id: 'private', label: 'Invite Only',      desc: 'Manual approval' },
]

export default function CreateEventPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [format, setFormat] = useState('live')
  const [category, setCategory] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [access, setAccess] = useState('free')
  const [minTokens, setMinTokens] = useState('10')
  const [ticketPrice, setTicketPrice] = useState('5')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [cohost, setCohost] = useState('')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)

  const canCreate = title.trim() && category && dateStr

  async function createEvent() {
    setCreating(true)
    await new Promise(r => setTimeout(r, 1400))
    setCreating(false)
    setCreated(true)
  }

  if (created) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '2px solid rgba(168,85,247,0.3)' }}>
            <span className="text-3xl">🎉</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white mb-1">Event Created!</div>
            <div className="text-white/40 text-sm">"{title}" is scheduled.</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 text-left space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="Format" value={FORMATS.find(f => f.id === format)?.label ?? format} />
            <Row label="Date" value={new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            <Row label="Access" value={ACCESS_OPTIONS.find(a => a.id === access)?.label ?? access} />
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push('/events')}
              className="w-full py-3.5 rounded-xl font-black" style={{ background: '#a855f7', color: '#04040A' }}>
              View All Events
            </button>
            <button onClick={() => router.push('/creator')}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              Creator Dashboard
            </button>
          </div>
        </div>
      </div>
    )
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
          <div className="font-black text-white flex-1">Create Event</div>
          <button onClick={createEvent} disabled={!canCreate || creating}
            className="px-4 py-1.5 rounded-xl text-sm font-black disabled:opacity-30"
            style={{ background: '#a855f7', color: '#04040A' }}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Title + desc */}
        <div className="space-y-3">
          <Field label="Event Title *">
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What's happening?"
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
          </Field>
          <Field label="Description">
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Tell attendees what to expect…" rows={3}
              className="w-full px-4 py-3 rounded-2xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none resize-none" />
          </Field>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 uppercase tracking-wider font-semibold">Format</div>
          <div className="grid grid-cols-1 gap-2">
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)}
                className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                style={format === f.id
                  ? { background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)' }
                  : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-xl">{f.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white/80">{f.label}</div>
                  <div className="text-xs text-white/30">{f.desc}</div>
                </div>
                {format === f.id && <span style={{ color: '#a855f7' }}>✓</span>}
              </button>
            ))}
          </div>
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

        {/* Date/Time */}
        <Field label="Date & Time *">
          <input type="datetime-local" value={dateStr} onChange={e => setDateStr(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white outline-none" />
        </Field>

        {/* Access */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 uppercase tracking-wider font-semibold">Access</div>
          {ACCESS_OPTIONS.map(a => (
            <button key={a.id} onClick={() => setAccess(a.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
              style={access === a.id
                ? { background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }
                : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex-1">
                <div className="text-sm font-bold text-white/80">{a.label}</div>
                <div className="text-xs text-white/30">{a.desc}</div>
              </div>
              {access === a.id && <span style={{ color: '#a855f7' }}>✓</span>}
            </button>
          ))}
          {access === 'token' && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-white/35">Min tokens:</span>
              <input value={minTokens} onChange={e => setMinTokens(e.target.value.replace(/\D/g, ''))}
                className="w-24 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/8 text-white outline-none" />
            </div>
          )}
          {access === 'ticket' && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-white/35">Price (USDC):</span>
              <input value={ticketPrice} onChange={e => setTicketPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-24 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/8 text-white outline-none" />
            </div>
          )}
        </div>

        {/* Optional fields */}
        <div className="space-y-3">
          <Field label="Max Attendees (optional)">
            <input value={maxAttendees} onChange={e => setMaxAttendees(e.target.value.replace(/\D/g, ''))}
              placeholder="Leave blank for unlimited"
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
          </Field>
          {format === 'collab' && (
            <Field label="Co-host Handle">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/6 bg-white/5">
                <span className="text-white/30">@</span>
                <input value={cohost} onChange={e => setCohost(e.target.value.toLowerCase())}
                  placeholder="mayafit"
                  className="flex-1 text-white bg-transparent outline-none text-sm" />
              </div>
            </Field>
          )}
        </div>

        <button onClick={createEvent} disabled={!canCreate || creating}
          className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
          style={{ background: '#a855f7', color: '#04040A' }}>
          {creating ? 'Creating event…' : '🎉 Create Event'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70 font-semibold">{value}</span>
    </div>
  )
}
