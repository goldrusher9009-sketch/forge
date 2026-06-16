'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PostType = 'text' | 'media' | 'poll' | 'token_alert' | 'drop'
type Access   = 'public' | 'followers' | 'token_gated'

const TYPE_OPTIONS = [
  { key:'text'        as PostType, label:'Text Post',     icon:'📝', desc:'Write a post' },
  { key:'media'       as PostType, label:'Media',          icon:'📸', desc:'Photo or video' },
  { key:'poll'        as PostType, label:'Poll',           icon:'📊', desc:'Ask your audience' },
  { key:'token_alert' as PostType, label:'Token Alert',   icon:'🔔', desc:'Market signal' },
  { key:'drop'        as PostType, label:'Drop',           icon:'💎', desc:'Exclusive content drop' },
]

const ACCESS_OPTIONS = [
  { key:'public'       as Access, label:'Public',         icon:'🌍', desc:'Anyone can see' },
  { key:'followers'    as Access, label:'Followers',      icon:'👥', desc:'Followers only' },
  { key:'token_gated' as Access, label:'Token Gated',    icon:'🔒', desc:'Require tokens to view' },
]

export default function ComposePage() {
  const router = useRouter()
  const [type, setType]     = useState<PostType>('text')
  const [access, setAccess] = useState<Access>('public')
  const [body, setBody]     = useState('')
  const [title, setTitle]   = useState('')
  const [minTok, setMinTok] = useState('10')
  const [pollOpts, setPollOpts] = useState(['',''])
  const [alertSign, setAlertSign] = useState<'bullish'|'bearish'|'neutral'>('bullish')
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const charLimit = type === 'token_alert' ? 280 : 1400
  const remaining = charLimit - body.length

  async function publish() {
    if (!body.trim() && type !== 'poll') return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background:'var(--ink)' }}>
      <div className="text-5xl mb-4">🚀</div>
      <div className="font-black text-2xl text-white mb-2">Posted!</div>
      <div className="text-white/35 text-sm mb-8">Your post is live</div>
      <button onClick={() => router.push('/feed')}
        className="w-full py-4 rounded-2xl font-black text-base mb-3"
        style={{ background:'#a855f7', color:'#04040A' }}>View Feed</button>
      <button onClick={() => { setDone(false); setBody(''); setTitle('') }}
        className="w-full py-3 rounded-2xl font-bold text-sm text-white/30">
        Post Another
      </button>
    </div>
  )

  return (
    <div className="min-h-screen pb-32" style={{ background:'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter:'blur(20px)', background:'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 font-black text-white">New Post</div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: remaining < 20 ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
              {remaining}
            </span>
            <button onClick={publish} disabled={loading || (type !== 'poll' && !body.trim())}
              className="px-4 py-2 rounded-xl font-black text-sm disabled:opacity-40"
              style={{ background:'#a855f7', color:'#04040A' }}>
              {loading ? '…' : 'Post'}
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Post type */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Type</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TYPE_OPTIONS.map(t => (
              <button key={t.key} onClick={() => setType(t.key)}
                className="flex-shrink-0 px-3 py-2 rounded-xl border text-left"
                style={type === t.key
                  ? { background:'rgba(168,85,247,0.1)', borderColor:'rgba(168,85,247,0.3)' }
                  : { background:'rgba(255,255,255,0.015)', borderColor:'rgba(255,255,255,0.06)' }}>
                <div className="text-base mb-0.5">{t.icon}</div>
                <div className="text-xs font-bold text-white/70">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title (for drop/alert) */}
        {(type === 'drop' || type === 'token_alert') && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">
              {type === 'token_alert' ? 'Ticker' : 'Drop Title'}
            </div>
            <input value={type === 'token_alert' ? ticker : title}
              onChange={e => type === 'token_alert' ? setTicker(e.target.value) : setTitle(e.target.value)}
              placeholder={type === 'token_alert' ? '$BTC, $ETH...' : 'Name your drop'}
              className="w-full px-4 py-3 rounded-2xl border border-white/8 bg-white/5 text-sm text-white placeholder-white/20 outline-none" />
          </div>
        )}

        {/* Alert sentiment */}
        {type === 'token_alert' && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Signal</div>
            <div className="flex gap-2">
              {(['bullish','bearish','neutral'] as const).map(s => (
                <button key={s} onClick={() => setAlertSign(s)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black capitalize"
                  style={alertSign === s
                    ? s === 'bullish' ? { background:'rgba(34,197,94,0.15)', color:'#22c55e' }
                      : s === 'bearish' ? { background:'rgba(248,113,113,0.15)', color:'#f87171' }
                        : { background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)' }
                    : { background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.3)' }}>
                  {s === 'bullish' ? '🟢' : s === 'bearish' ? '🔴' : '🟡'} {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        {type !== 'poll' && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">
              {type === 'token_alert' ? 'Analysis' : 'Content'}
            </div>
            <textarea value={body} onChange={e => setBody(e.target.value.slice(0, charLimit))}
              rows={type === 'text' ? 6 : 4}
              placeholder={type === 'token_alert' ? 'Share your analysis...' : type === 'drop' ? 'Describe your exclusive drop...' : "What's on your mind?"}
              className="w-full px-4 py-3 rounded-2xl border border-white/8 bg-white/5 text-sm text-white placeholder-white/20 outline-none resize-none leading-relaxed" />
          </div>
        )}

        {/* Poll options */}
        {type === 'poll' && (
          <div>
            <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Poll Options</div>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              rows={2} placeholder="Ask your question..."
              className="w-full px-4 py-3 rounded-2xl border border-white/8 bg-white/5 text-sm text-white placeholder-white/20 outline-none resize-none mb-2" />
            {pollOpts.map((o, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={o} onChange={e => setPollOpts(prev => prev.map((p, j) => j === i ? e.target.value : p))}
                  placeholder={`Option ${i+1}`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/8 bg-white/5 text-sm text-white placeholder-white/20 outline-none" />
                {i >= 2 && <button onClick={() => setPollOpts(p => p.filter((_, j) => j !== i))}
                  className="text-white/25 px-2">✕</button>}
              </div>
            ))}
            {pollOpts.length < 4 && (
              <button onClick={() => setPollOpts(p => [...p, ''])}
                className="text-xs text-white/30 mt-1">+ Add option</button>
            )}
          </div>
        )}

        {/* Access control */}
        <div>
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Who can see this?</div>
          <div className="grid grid-cols-3 gap-2">
            {ACCESS_OPTIONS.map(a => (
              <button key={a.key} onClick={() => setAccess(a.key)}
                className="p-3 rounded-xl border text-center"
                style={access === a.key
                  ? { background:'rgba(168,85,247,0.08)', borderColor:'rgba(168,85,247,0.3)' }
                  : { background:'rgba(255,255,255,0.015)', borderColor:'rgba(255,255,255,0.05)' }}>
                <div className="text-lg mb-0.5">{a.icon}</div>
                <div className="text-xs font-bold text-white/70">{a.label}</div>
              </button>
            ))}
          </div>
          {access === 'token_gated' && (
            <div className="flex items-center gap-2 mt-2">
              <input value={minTok} onChange={e => setMinTok(e.target.value)}
                type="number" placeholder="10"
                className="w-20 px-3 py-2 rounded-xl border border-white/8 bg-white/5 text-sm text-white outline-none text-center" />
              <span className="text-xs text-white/35">minimum $SVRN to unlock</span>
            </div>
          )}
        </div>

        {/* Media area placeholder */}
        {type === 'media' && (
          <div className="h-32 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/20"
            style={{ background:'rgba(255,255,255,0.02)' }}>
            <span className="text-3xl">📸</span>
            <span className="text-xs text-white/25">Tap to upload photo or video</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 border-t border-white/5"
        style={{ background:'rgba(4,4,10,0.95)', backdropFilter:'blur(20px)' }}>
        <button onClick={publish} disabled={loading || (type !== 'poll' && !body.trim())}
          className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40"
          style={{ background:'#a855f7', color:'#04040A' }}>
          {loading ? 'Publishing…' : '🚀 Publish Post'}
        </button>
      </div>
    </div>
  )
}
