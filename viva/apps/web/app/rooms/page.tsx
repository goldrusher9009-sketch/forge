'use client'
import { useState, useEffect, useRef } from 'react'
import { useAppStore, mockUser } from '@/lib/store'
import { rooms as roomsApi } from '@/lib/api'

/* ── types ── */
type ChatMsg = { id: number; handle: string; text: string; color: string; ts: number }
type VideoClip = { id: number; handle: string; caption: string; likes: number; color: string; duration: string; avatar: string }

const COLORS = ['#818CF8','#34D399','#FB923C','#F472B6','#FACC15','#A78BFA']

const MOCK_ROOMS = [
  { id:'r1', title:'Regenerative Finance + ZK Identity', topic:'DeFi · ZKP', host:'noa_d', hostScore:671, speakers:['noa_d','luna_v','aisham'], listeners:47, minVScore:400, color:'#818CF8' },
  { id:'r2', title:'Builder Hour: AI Agents & Autonomy', topic:'AI · Builders', host:'danr', hostScore:589, speakers:['danr','mateuso'], listeners:23, minVScore:200, color:'#34D399' },
  { id:'r3', title:'Sovereign Health: Beyond the App', topic:'Health · Philosophy', host:'luna_v', hostScore:834, speakers:['luna_v'], listeners:89, minVScore:600, color:'#F472B6' },
]

const SEED_CHAT: ChatMsg[] = [
  { id:1, handle:'luna_v', text:'Sleep ring closed 100% today 🔥', color:'#F472B6', ts: Date.now()-120000 },
  { id:2, handle:'noa_d', text:'ZK proof dropped for BioAge under 26', color:'#818CF8', ts: Date.now()-90000 },
  { id:3, handle:'aisham', text:'staking 500 on luna YES', color:'#34D399', ts: Date.now()-60000 },
  { id:4, handle:'danr', text:'V-Score gating is actually genius', color:'#FACC15', ts: Date.now()-30000 },
  { id:5, handle:'mateuso', text:'twin moved my gym to 7am lmao', color:'#FB923C', ts: Date.now()-10000 },
]

const VIDEOS: VideoClip[] = [
  { id:1, handle:'luna_v', caption:'How I closed all 5 rings for 30 days straight 🔥', likes:847, color:'#F472B6', duration:'0:42', avatar:'L' },
  { id:2, handle:'atlas_burns', caption:'V-Score 920 — what actually moved it', likes:634, color:'#818CF8', duration:'1:12', avatar:'A' },
  { id:3, handle:'nova_pierce', caption:'$NOVA up 22% — here\'s what I staked', likes:411, color:'#FACC15', duration:'0:31', avatar:'N' },
  { id:4, handle:'zara_voss', caption:'BioAge 24.3 at 31 years old. This is how.', likes:1203, color:'#34D399', duration:'2:04', avatar:'Z' },
  { id:5, handle:'reed_cross', caption:'Got matched 94% ZK compat. First date update 👀', likes:988, color:'#A78BFA', duration:'0:58', avatar:'R' },
]

function fmt(ts: number) {
  const d = Math.floor((Date.now() - ts) / 1000)
  if (d < 60) return `${d}s`
  if (d < 3600) return `${Math.floor(d/60)}m`
  return `${Math.floor(d/3600)}h`
}

/* ─────────────────────────────────────────────── */
export default function RoomsPage() {
  const { user, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [rooms, setRooms] = useState(MOCK_ROOMS)
  const [tab, setTab] = useState<'audio'|'chat'|'video'>('audio')
  const [activeRoom, setActiveRoom] = useState<typeof MOCK_ROOMS[0] | null>(null)
  const [muted, setMuted] = useState(true)
  const [handUp, setHandUp] = useState(false)
  const [wave, setWave] = useState<number[]>(Array.from({length:24},()=>Math.random()*35+8))
  const [chat, setChat] = useState<ChatMsg[]>(SEED_CHAT)
  const [chatInput, setChatInput] = useState('')
  const [likedVids, setLikedVids] = useState<Set<number>>(new Set())
  const [currentVid, setCurrentVid] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    // wave animation
    const wid = setInterval(() => setWave(Array.from({length:24},()=>Math.random()*35+8)), 160)
    // fake chat trickle
    const chatLines = [
      { handle:'luna_v', text:'who else got their twin running 24/7?', color:'#F472B6' },
      { handle:'aisham', text:'YES and it staked markets while I slept lol', color:'#34D399' },
      { handle:'noa_d', text:'V-Score went up 8 pts overnight', color:'#818CF8' },
      { handle:'danr', text:'BioAge proof dropping this week 🔥', color:'#FACC15' },
      { handle:'mateuso', text:'rooms like this are why i joined', color:'#FB923C' },
      { handle:'reed_cross', text:'sleep ring finally closed after 2 months 😭', color:'#A78BFA' },
    ]
    let idx = 0
    const cid = setInterval(() => {
      const line = chatLines[idx % chatLines.length]
      setChat(p => [...p.slice(-40), { id: Date.now(), handle: line.handle, text: line.text, color: line.color, ts: Date.now() }])
      idx++
    }, 3500)
    // auto-load rooms
    roomsApi.list().then(data => {
      if (Array.isArray(data) && data.length) setRooms(data.map((r:any) => ({
        id: r.id, title: r.title, topic: r.topic??'', host: r.host?.handle??'unknown',
        hostScore: r.host?.vScore??0, speakers: (r.members??[]).map((m:any)=>m.user?.handle??'?'),
        listeners: r._count?.members??0, minVScore: r.minVScore??0, color: COLORS[Math.floor(Math.random()*COLORS.length)],
      })))
    }).catch(()=>{})
    return () => { clearInterval(wid); clearInterval(cid) }
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chat])

  if (!mounted) return null
  const u = user || mockUser()

  function sendChat() {
    if (!chatInput.trim()) return
    setChat(p => [...p, { id: Date.now(), handle: u.handle, text: chatInput.trim(), color: '#7C3AED', ts: Date.now() }])
    setChatInput('')
  }

  function joinRoom(r: typeof MOCK_ROOMS[0]) {
    if (u.vscore < r.minVScore) return
    setActiveRoom(r)
    setTab('audio')
    roomsApi.join(r.id).catch(()=>{})
  }

  function leaveRoom() {
    if (activeRoom) roomsApi.leave(activeRoom.id).catch(()=>{})
    setActiveRoom(null)
    setMuted(true)
    setHandUp(false)
  }

  const speaking = !muted

  /* ── layout ── */
  return (
    <div style={{ minHeight:'100vh', background:'#06060E', color:'white', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#7C3AED44;border-radius:99px}
      `}</style>

      {/* header */}
      <header style={{ position:'sticky', top:0, zIndex:50, padding:'0 20px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(6,6,14,0.9)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <a href="/home" style={{ color:'rgba(255,255,255,0.3)', fontSize:18, textDecoration:'none', lineHeight:1 }}>←</a>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase' }}>V-GATED</div>
            <div style={{ fontSize:18, fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>Rooms</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', animation:'pulse 1.5s infinite' }} />
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{rooms.length} live</span>
          <button style={{ marginLeft:8, padding:'6px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, cursor:'pointer' }}>+ Start</button>
        </div>
      </header>

      {activeRoom ? (
        /* ══ ACTIVE ROOM ══ */
        <div style={{ flex:1, display:'flex', flexDirection:'column', maxWidth:800, width:'100%', margin:'0 auto', padding:'0 0 80px' }}>
          {/* room title bar */}
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', animation:'pulse 1.5s infinite' }} />
                <span style={{ fontSize:11, fontWeight:700, color:'#34D399', letterSpacing:1 }}>LIVE</span>
                <span style={{ width:1, height:10, background:'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{activeRoom.listeners + 1} in room</span>
              </div>
              <div style={{ fontSize:16, fontWeight:800, letterSpacing:-0.5 }}>{activeRoom.title}</div>
            </div>
            <button onClick={leaveRoom} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid rgba(255,100,100,0.3)', background:'rgba(255,100,100,0.05)', color:'#F87171', fontSize:12, fontWeight:600, cursor:'pointer' }}>Leave</button>
          </div>

          {/* tab switcher */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {(['audio','chat','video'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'12px 0', background:'transparent', border:'none', color: tab===t ? 'white' : 'rgba(255,255,255,0.3)', fontSize:13, fontWeight: tab===t ? 700 : 500, cursor:'pointer', borderBottom: tab===t ? '2px solid #7C3AED' : '2px solid transparent', transition:'all 0.2s' }}>
                {t==='audio'?'🎙️ Audio':t==='chat'?'💬 Chat':'📱 Video'}
              </button>
            ))}
          </div>

          {/* ── AUDIO TAB ── */}
          {tab==='audio' && (
            <div style={{ flex:1, padding:20 }}>
              {/* waveform */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, height:64, marginBottom:24 }}>
                {wave.map((h,i) => (
                  <div key={i} style={{ width:3, borderRadius:99, height: speaking ? `${h}px` : `${h*0.25}px`, background: speaking ? `hsl(${250+i*4},70%,${55+h*0.4}%)` : 'rgba(255,255,255,0.1)', transition:'height 0.15s ease', boxShadow: speaking ? `0 0 4px hsl(${250+i*4},70%,60%)` : 'none' }} />
                ))}
              </div>

              {/* speakers */}
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Speakers · {activeRoom.speakers.length}</div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  {activeRoom.speakers.map((sp, i) => (
                    <div key={sp} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      <div style={{ position:'relative' }}>
                        <div style={{ width:52, height:52, borderRadius:'50%', background:`${activeRoom.color}22`, border:`2px solid ${i===0?activeRoom.color:'rgba(255,255,255,0.12)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, boxShadow: i===0?`0 0 16px ${activeRoom.color}44`:'' }}>
                          {sp[0].toUpperCase()}
                        </div>
                        {i===0 && <div style={{ position:'absolute', bottom:-2, right:-2, width:16, height:16, borderRadius:'50%', background:'#7C3AED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, border:'2px solid #06060E' }}>♦</div>}
                      </div>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>@{sp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* controls */}
              <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:32 }}>
                <button onClick={()=>setMuted(m=>!m)} style={{ width:56, height:56, borderRadius:'50%', border:`2px solid ${muted?'rgba(255,255,255,0.2)':'#7C3AED'}`, background: muted?'transparent':'rgba(124,58,237,0.2)', color:'white', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: muted?'':' 0 0 20px rgba(124,58,237,0.4)', transition:'all 0.2s' }}>
                  {muted?'🔇':'🎤'}
                </button>
                <button onClick={()=>setHandUp(h=>!h)} style={{ width:56, height:56, borderRadius:'50%', border:`2px solid ${handUp?'#FACC15':'rgba(255,255,255,0.2)'}`, background: handUp?'rgba(250,204,21,0.15)':'transparent', color:'white', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>✋</button>
                <button onClick={()=>setTab('chat')} style={{ width:56, height:56, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.2)', background:'transparent', color:'white', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>💬</button>
              </div>
              {handUp && <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'#FACC15', fontWeight:600 }}>Hand raised — host will let you speak</div>}
            </div>
          )}

          {/* ── CHAT TAB (MSN-style) ── */}
          {tab==='chat' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', height:'calc(100vh - 200px)' }}>
              {/* messages */}
              <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px' }}>
                {chat.map(m => (
                  <div key={m.id} style={{ display:'flex', gap:8, marginBottom:10, animation:'slideUp 0.2s ease' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:`${m.color}22`, border:`1px solid ${m.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, color:m.color }}>
                      {m.handle[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.handle}</span>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>{fmt(m.ts)}</span>
                      </div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.5, wordBreak:'break-word' }}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* input */}
              <div style={{ padding:'8px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:8, background:'rgba(0,0,0,0.3)' }}>
                <input
                  value={chatInput}
                  onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') sendChat() }}
                  placeholder="Say something..."
                  style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'white', fontSize:13, outline:'none' }}
                />
                <button onClick={sendChat} style={{ padding:'8px 16px', borderRadius:8, background:'#7C3AED', color:'white', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>Send</button>
              </div>
            </div>
          )}

          {/* ── VIDEO TAB (TikTok-style) ── */}
          {tab==='video' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
              {/* current video */}
              <div style={{ position:'relative', background:`linear-gradient(160deg,${VIDEOS[currentVid].color}11,#06060E)`, borderBottom:'1px solid rgba(255,255,255,0.06)', padding:20, minHeight:280, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                {/* fake video placeholder */}
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:64, opacity:0.06 }}>▶</div>
                <div style={{ position:'absolute', top:16, right:16, background:'rgba(0,0,0,0.5)', borderRadius:6, padding:'3px 8px', fontSize:11, color:'rgba(255,255,255,0.7)' }}>{VIDEOS[currentVid].duration}</div>
                {/* avatar */}
                <div style={{ position:'absolute', top:16, left:16, width:44, height:44, borderRadius:'50%', background:`${VIDEOS[currentVid].color}33`, border:`2px solid ${VIDEOS[currentVid].color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:VIDEOS[currentVid].color }}>
                  {VIDEOS[currentVid].avatar}
                </div>
                <div style={{ position:'relative' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:VIDEOS[currentVid].color, marginBottom:4 }}>@{VIDEOS[currentVid].handle}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.85)', lineHeight:1.4 }}>{VIDEOS[currentVid].caption}</div>
                </div>
                {/* like/nav */}
                <div style={{ position:'absolute', right:16, bottom:16, display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
                  <button onClick={()=>{ setLikedVids(s=>{ const n=new Set(s); n.has(currentVid)?n.delete(currentVid):n.add(currentVid); return n }); }} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    <span style={{ fontSize:24, filter: likedVids.has(currentVid)?'none':'grayscale(1)', transition:'filter 0.2s' }}>❤️</span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{VIDEOS[currentVid].likes+(likedVids.has(currentVid)?1:0)}</span>
                  </button>
                </div>
              </div>
              {/* video scroll list */}
              <div style={{ flex:1, overflowY:'auto' }}>
                {VIDEOS.map((v, i) => (
                  <div key={v.id} onClick={()=>setCurrentVid(i)} style={{ display:'flex', gap:12, padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', background: currentVid===i?'rgba(124,58,237,0.08)':'transparent', transition:'background 0.2s', alignItems:'center' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:`${v.color}22`, border:`2px solid ${currentVid===i?v.color:'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:v.color, flexShrink:0 }}>{v.avatar}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:v.color, marginBottom:2 }}>@{v.handle}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.caption}</div>
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', flexShrink:0 }}>❤️ {v.likes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      ) : (
        /* ══ ROOM LIST ══ */
        <div style={{ flex:1, padding:'20px 20px 80px', maxWidth:800, width:'100%', margin:'0 auto' }}>
          {/* tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {(['audio','chat','video'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${tab===t?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.1)'}`, background: tab===t?'rgba(124,58,237,0.15)':'transparent', color: tab===t?'white':'rgba(255,255,255,0.4)', fontSize:13, fontWeight: tab===t?700:500, cursor:'pointer' }}>
                {t==='audio'?'🎙️ Audio':t==='chat'?'💬 Chat':'📱 Video'}
              </button>
            ))}
          </div>

          {/* audio rooms */}
          {tab==='audio' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {rooms.map(r=>{
                const locked = u.vscore < r.minVScore
                return (
                  <div key={r.id} onClick={()=>!locked&&joinRoom(r)} style={{ padding:20, borderRadius:14, border:`1px solid ${locked?'rgba(255,255,255,0.06)':`${r.color}30`}`, background:`${r.color}06`, cursor:locked?'not-allowed':'pointer', opacity:locked?0.5:1, transition:'all 0.2s' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', animation:'pulse 1.5s infinite' }} />
                          <span style={{ fontSize:10, fontWeight:700, color:'#34D399', letterSpacing:1 }}>LIVE</span>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>{r.topic}</span>
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, letterSpacing:-0.5, marginBottom:8 }}>{r.title}</div>
                        <div style={{ display:'flex', gap:-8 }}>
                          {r.speakers.slice(0,4).map((sp,i)=>(
                            <div key={sp} style={{ width:24, height:24, borderRadius:'50%', background:`${r.color}22`, border:`2px solid ${r.color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, marginLeft:i?-6:0, color:r.color, zIndex:10-i }}>
                              {sp[0].toUpperCase()}
                            </div>
                          ))}
                          <span style={{ marginLeft:10, fontSize:12, color:'rgba(255,255,255,0.35)', alignSelf:'center' }}>{r.listeners} listening</span>
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        {locked
                          ? <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>V-Score {r.minVScore}+<br/>required</div>
                          : <div style={{ padding:'6px 14px', borderRadius:8, background:r.color, color:'#06060E', fontSize:12, fontWeight:800 }}>Join</div>
                        }
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* global chat (not in a room) */}
          {tab==='chat' && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', height:'calc(100vh - 200px)' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>
                🌐 Global chat — join a room for room chat
              </div>
              <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px' }}>
                {chat.map(m=>(
                  <div key={m.id} style={{ display:'flex', gap:8, marginBottom:10, animation:'slideUp 0.2s ease' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:`${m.color}22`, border:`1px solid ${m.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, color:m.color }}>{m.handle[0].toUpperCase()}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.handle}</span>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>{fmt(m.ts)}</span>
                      </div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.5 }}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'8px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:8, background:'rgba(0,0,0,0.3)' }}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Message..." style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'white', fontSize:13, outline:'none' }} />
                <button onClick={sendChat} style={{ padding:'8px 16px', borderRadius:8, background:'#7C3AED', color:'white', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>Send</button>
              </div>
            </div>
          )}

          {/* video feed (TikTok-style list) */}
          {tab==='video' && (
            <div style={{ display:'flex', flexDirection:'column', gap:0, borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>
              {VIDEOS.map((v,i)=>(
                <div key={v.id} onClick={()=>setCurrentVid(i)} style={{ display:'flex', gap:12, padding:'16px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', background: currentVid===i?'rgba(124,58,237,0.08)':'transparent', alignItems:'center', transition:'background 0.2s' }}>
                  <div style={{ width:56, height:72, borderRadius:8, background:`linear-gradient(160deg,${v.color}33,${v.color}11)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, border:`1px solid ${v.color}22` }}>▶</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:v.color, marginBottom:4 }}>@{v.handle}</div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.4, marginBottom:6 }}>{v.caption}</div>
                    <div style={{ display:'flex', gap:12, fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                      <span>❤️ {v.likes}</span><span>⏱ {v.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
