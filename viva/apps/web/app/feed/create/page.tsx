'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const POST_TYPES = [
  { id: 'text',   icon: '✍️', label: 'Text'  },
  { id: 'image',  icon: '📸', label: 'Photo'  },
  { id: 'video',  icon: '🎬', label: 'Video'  },
  { id: 'poll',   icon: '📊', label: 'Poll'   },
  { id: 'signal', icon: '📈', label: 'Signal' },
]

const AUDIENCES = [
  { id: 'public',   label: 'Everyone',          desc: 'Visible to all VIVA users' },
  { id: 'followers', label: 'Followers only',   desc: 'Your followers see this' },
  { id: 'bronze',   label: 'Bronze+ holders',   desc: '10+ tokens of yours held' },
  { id: 'silver',   label: 'Silver+ holders',   desc: '25+ tokens held' },
  { id: 'gold',     label: 'Gold+ holders',     desc: '50+ tokens held' },
  { id: 'diamond',  label: 'Diamond holders',   desc: '100+ tokens — exclusive' },
]

const TAGS = ['crypto', 'defi', 'health', 'biohacking', 'web3', 'finance', 'music', 'ai', 'trading', 'lifestyle', 'nft', 'staking']

export default function CreatePostPage() {
  const router = useRouter()
  const [type, setType] = useState('text')
  const [text, setText] = useState('')
  const [audience, setAudience] = useState('public')
  const [showAudience, setShowAudience] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [signalTicker, setSignalTicker] = useState('')
  const [signalDir, setSignalDir] = useState<'long' | 'short'>('long')
  const [signalNote, setSignalNote] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const MAX_CHARS = 500
  const canPost = type === 'text' ? text.trim().length > 0 :
                  type === 'poll' ? pollOptions.filter(o => o.trim()).length >= 2 :
                  type === 'signal' ? signalTicker.trim().length > 0 : true

  function handleText(v: string) {
    if (v.length <= MAX_CHARS) { setText(v); setCharCount(v.length) }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setImagePreview(URL.createObjectURL(f))
  }

  function toggleTag(t: string) {
    setSelectedTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t].slice(0, 5))
  }

  function addPollOption() {
    if (pollOptions.length < 4) setPollOptions(p => [...p, ''])
  }

  function setPollOption(i: number, v: string) {
    setPollOptions(p => p.map((o, j) => j === i ? v : o))
  }

  async function post() {
    setPosting(true)
    await new Promise(r => setTimeout(r, 1100))
    setPosting(false)
    router.push('/feed')
  }

  const selectedAudience = AUDIENCES.find(a => a.id === audience)!

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="font-black text-white">New Post</div>
          <button onClick={post} disabled={!canPost || posting}
            className="px-4 py-1.5 rounded-xl text-sm font-black transition-all disabled:opacity-30"
            style={{ background: '#a855f7', color: '#04040A' }}>
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Author row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>S</div>
          <div>
            <div className="text-sm font-bold text-white/80">Sovereign V</div>
            {/* Audience picker */}
            <button onClick={() => setShowAudience(!showAudience)}
              className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full transition-all"
              style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
              👁 {selectedAudience.label} ▾
            </button>
          </div>
        </div>

        {/* Audience dropdown */}
        {showAudience && (
          <div className="p-2 rounded-2xl border border-white/8 space-y-1" style={{ background: 'rgba(255,255,255,0.025)' }}>
            {AUDIENCES.map(a => (
              <button key={a.id} onClick={() => { setAudience(a.id); setShowAudience(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                style={audience === a.id ? { background: 'rgba(168,85,247,0.1)' } : {}}>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white/80">{a.label}</div>
                  <div className="text-xs text-white/30">{a.desc}</div>
                </div>
                {audience === a.id && <span style={{ color: '#a855f7' }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Type selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {POST_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={type === t.id
                ? { background: '#a855f7', color: '#04040A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Text area */}
        {(type === 'text' || type === 'image' || type === 'video') && (
          <div className="relative">
            <textarea
              value={text}
              onChange={e => handleText(e.target.value)}
              placeholder={type === 'signal' ? '' : "What's on your mind?"}
              rows={5}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-white/20 outline-none resize-none border border-white/6"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            />
            <div className="absolute bottom-3 right-3 text-xs" style={{ color: charCount > MAX_CHARS * 0.8 ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>
              {charCount}/{MAX_CHARS}
            </div>
          </div>
        )}

        {/* Image/video upload */}
        {(type === 'image' || type === 'video') && (
          <div>
            <input ref={fileRef} type="file" accept={type === 'image' ? 'image/*' : 'video/*'} onChange={handleFile} className="hidden" />
            {imagePreview
              ? <div className="relative rounded-2xl overflow-hidden">
                  <img src={imagePreview} alt="" className="w-full object-cover max-h-64" />
                  <button onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>✕</button>
                </div>
              : <button onClick={() => fileRef.current?.click()}
                  className="w-full py-10 rounded-2xl border border-dashed border-white/15 text-white/30 text-sm hover:border-white/25 hover:text-white/50 transition-all flex flex-col items-center gap-2">
                  <span className="text-3xl">{type === 'image' ? '📸' : '🎬'}</span>
                  <span>Tap to add {type === 'image' ? 'photo' : 'video'}</span>
                </button>
            }
          </div>
        )}

        {/* Poll */}
        {type === 'poll' && (
          <div className="space-y-3">
            <textarea value={text} onChange={e => handleText(e.target.value)}
              placeholder="Ask a question…" rows={2}
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-white/20 outline-none resize-none border border-white/6"
              style={{ background: 'rgba(255,255,255,0.025)' }} />
            {pollOptions.map((o, i) => (
              <input key={i} value={o} onChange={e => setPollOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
            ))}
            {pollOptions.length < 4 && (
              <button onClick={addPollOption} className="text-xs font-bold" style={{ color: '#a855f7' }}>+ Add option</button>
            )}
          </div>
        )}

        {/* Signal */}
        {type === 'signal' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={signalTicker} onChange={e => setSignalTicker(e.target.value.toUpperCase())}
                placeholder="Ticker (e.g. BTC)"
                className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none font-mono font-black" />
              <button onClick={() => setSignalDir('long')}
                className="px-4 py-3 rounded-xl text-sm font-black transition-all"
                style={signalDir === 'long' ? { background: '#22c55e', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                📈 Long
              </button>
              <button onClick={() => setSignalDir('short')}
                className="px-4 py-3 rounded-xl text-sm font-black transition-all"
                style={signalDir === 'short' ? { background: '#f87171', color: '#04040A' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                📉 Short
              </button>
            </div>
            <textarea value={signalNote} onChange={e => setSignalNote(e.target.value)}
              placeholder="Why? Add thesis, TP, SL…" rows={3}
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-white/20 outline-none resize-none border border-white/6"
              style={{ background: 'rgba(255,255,255,0.025)' }} />
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2">
          <div className="text-xs text-white/30 uppercase tracking-widest">Tags (up to 5)</div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={selectedTags.includes(t)
                  ? { background: '#a855f7', color: '#04040A' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                #{t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
