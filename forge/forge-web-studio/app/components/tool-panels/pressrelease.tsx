'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_pressrelease() {
  const [companyName, setCompanyName] = React.useState('');
  const [announcement, setAnnouncement] = React.useState('');
  const [headline, setHeadline] = React.useState('');
  const [quotes, setQuotes] = React.useState('');
  const [date, setDate] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeSection, setActiveSection] = React.useState('release');
  const apiBase = '';
  const token = getToken();

  const generate = async () => {
    if (!announcement.trim() || !companyName.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${apiBase}/api/press-release`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ companyName, announcement, headline, quotes, date, industry }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const fullText = result ? `${result.headline}\n\n${result.subheadline||''}\n\n${result.dateline||''} — ${result.leadParagraph||''}\n\n${(result.bodyParagraphs||[]).join('\n\n')}\n\n${(result.quotes||[]).map((q: any) => `"${q.quote}" — ${q.person}, ${q.title}`).join('\n\n')}\n\n${result.boilerplate||''}\n\n${result.contactBlock||''}`.trim() : '';

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--fg-text1)', margin:0 }}>📰 Press Release Writer</h2>
        <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'4px 0 0' }}>Professional press releases with distribution strategy & social angles</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>COMPANY NAME *</label>
          <input value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="e.g. Forge AI" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>DATE</label>
          <input value={date} onChange={e=>setDate(e.target.value)} placeholder="e.g. August 18, 2026" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>ANNOUNCEMENT *</label>
          <textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="What are you announcing? (funding round, product launch, partnership, milestone, etc.)" rows={3} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, resize:'vertical', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>HEADLINE IDEA (optional)</label>
          <input value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="e.g. Forge AI Raises $5M to..." style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>INDUSTRY</label>
          <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. AI / SaaS" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>EXECUTIVE QUOTES (optional)</label>
          <textarea value={quotes} onChange={e=>setQuotes(e.target.value)} placeholder='Name, Title: "quote text here"&#10;Name, Title: "another quote"' rows={2} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:13, marginTop:4, resize:'vertical', boxSizing:'border-box' }} />
        </div>
      </div>
      <button onClick={generate} disabled={loading||!announcement.trim()||!companyName.trim()} style={{ padding:'10px 24px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading||!announcement.trim()||!companyName.trim()?0.6:1 }}>
        {loading ? '⏳ Writing Press Release…' : '📰 Generate Press Release'}
      </button>
      {error && <div style={{ marginTop:12, padding:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', fontSize:13 }}>{error}</div>}
      {result && (
        <div style={{ marginTop:24 }}>
          <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
            {['release','strategy'].map(s => <button key={s} onClick={()=>setActiveSection(s)} style={{ padding:'6px 16px', background:activeSection===s?'var(--fg-orange)':'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:20, color:activeSection===s?'#fff':'var(--fg-text3)', cursor:'pointer', fontSize:12, fontWeight:600 }}>{s==='release'?'📰 Release':'📢 Strategy'}</button>)}
            <button onClick={() => navigator.clipboard.writeText(fullText)} style={{ marginLeft:'auto', padding:'6px 16px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:20, color:'var(--fg-text3)', cursor:'pointer', fontSize:12, fontWeight:600 }}>📋 Copy Full Release</button>
          </div>
          {activeSection === 'release' && (
            <div style={{ padding:24, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12, fontFamily:'Georgia, serif' }}>
              <p style={{ textAlign:'center', fontSize:11, color:'var(--fg-text3)', letterSpacing:2, marginTop:0 }}>FOR IMMEDIATE RELEASE</p>
              <h2 style={{ textAlign:'center', fontSize:22, fontWeight:700, color:'var(--fg-text1)', lineHeight:1.3 }}>{result.headline}</h2>
              {result.subheadline && <p style={{ textAlign:'center', fontSize:16, color:'var(--fg-text2)', margin:'-8px 0 16px', fontStyle:'italic' }}>{result.subheadline}</p>}
              {result.dateline && <p style={{ fontWeight:700, color:'var(--fg-text1)', marginBottom:0 }}>{result.dateline} —</p>}
              {result.leadParagraph && <p style={{ fontSize:15, color:'var(--fg-text1)', lineHeight:1.8, marginTop:4 }}>{result.leadParagraph}</p>}
              {(result.bodyParagraphs||[]).map((p: string, i: number) => <p key={i} style={{ fontSize:14, color:'var(--fg-text2)', lineHeight:1.8 }}>{p}</p>)}
              {(result.quotes||[]).map((q: any, i: number) => (
                <blockquote key={i} style={{ borderLeft:'3px solid var(--fg-orange)', paddingLeft:16, margin:'16px 0', fontStyle:'italic' }}>
                  <p style={{ margin:0, fontSize:15, color:'var(--fg-text1)' }}>"{q.quote}"</p>
                  <p style={{ margin:'6px 0 0', fontSize:13, color:'var(--fg-text3)' }}>— {q.person}, {q.title}</p>
                </blockquote>
              ))}
              {result.boilerplate && (
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:16, marginTop:16 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--fg-text3)', letterSpacing:1 }}>ABOUT {companyName.toUpperCase()}</p>
                  <p style={{ fontSize:13, color:'var(--fg-text3)', lineHeight:1.7 }}>{result.boilerplate}</p>
                </div>
              )}
              {result.contactBlock && (
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:16, marginTop:8 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--fg-text3)', letterSpacing:1 }}>MEDIA CONTACT</p>
                  <pre style={{ margin:0, fontSize:13, color:'var(--fg-text2)', fontFamily:'inherit', whiteSpace:'pre-wrap' }}>{result.contactBlock}</pre>
                </div>
              )}
            </div>
          )}
          {activeSection === 'strategy' && (
            <div style={{ display:'grid', gap:12 }}>
              {result.distributionSuggestions && result.distributionSuggestions.length > 0 && (
                <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                  <h4 style={{ margin:'0 0 10px', color:'var(--fg-text1)' }}>📡 Distribution Strategy</h4>
                  {result.distributionSuggestions.map((d: string, i: number) => <p key={i} style={{ margin:'0 0 6px', fontSize:13, color:'var(--fg-text2)' }}>• {d}</p>)}
                </div>
              )}
              {result.socialMediaAngles && result.socialMediaAngles.length > 0 && (
                <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                  <h4 style={{ margin:'0 0 10px', color:'var(--fg-text1)' }}>📱 Social Media Angles</h4>
                  {result.socialMediaAngles.map((a: string, i: number) => <p key={i} style={{ margin:'0 0 8px', fontSize:13, color:'var(--fg-text2)', padding:'8px 12px', background:'var(--bg-surface2)', borderRadius:8 }}>{a}</p>)}
                </div>
              )}
              {result.pitchEmail && (
                <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                  <h4 style={{ margin:'0 0 10px', color:'var(--fg-text1)' }}>✉️ Journalist Pitch Email</h4>
                  <pre style={{ whiteSpace:'pre-wrap', fontSize:13, color:'var(--fg-text2)', margin:0, lineHeight:1.7, fontFamily:'inherit' }}>{result.pitchEmail}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_dailyplan() {
  const [tasks, setTasks] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [timeAvailable, setTimeAvailable] = React.useState('8 hours');
  const [meetings, setMeetings] = React.useState('');
  const [energy, setEnergy] = React.useState('medium');
  const [workStyle, setWorkStyle] = React.useState('balanced');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('schedule');
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const BACKEND = '';
  const energyOpts = ['low','medium','high'];
  const styleOpts = ['deep-focus','balanced','meetings-heavy','creative'];
  const timeOpts = ['4 hours','6 hours','8 hours','10 hours','flexible'];
  async function generate() {
    if (!tasks && !goals) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${BACKEND}/api/daily-plan`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`}, body: JSON.stringify({ tasks, goals, timeAvailable, meetings, energy, workStyle }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  }
  const typeColor: Record<string,string> = { deep_work:'#6366f1', meeting:'#f59e0b', admin:'#6b7280', break:'#10b981' };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:32 }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <h2 style={{ color:'var(--fg-orange)', margin:'0 0 4px', fontSize:22, fontFamily:'var(--fg-font-display)', fontWeight:800 }}>📅 Daily Planner</h2>
        <p style={{ color:'var(--fg-text3)', margin:'0 0 24px', fontSize:14 }}>AI-powered daily plan with time blocks, priorities, and focus sessions</p>
        <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:16, padding:24, marginBottom:24 }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Today's Tasks</label>
            <textarea value={tasks} onChange={e=>setTasks(e.target.value)} placeholder="List your tasks, one per line or comma-separated..." rows={4} style={{ width:'100%', padding:12, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Top Goals for Today</label>
            <input value={goals} onChange={e=>setGoals(e.target.value)} placeholder="What must get done today?" style={{ width:'100%', padding:'10px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Available Time</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {timeOpts.map(t => <button key={t} onClick={()=>setTimeAvailable(t)} style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${timeAvailable===t ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: timeAvailable===t ? 'rgba(251,146,60,0.15)' : 'var(--fg-bg)', color: timeAvailable===t ? 'var(--fg-orange)' : 'var(--fg-text2)', fontSize:12, cursor:'pointer', fontWeight: timeAvailable===t ? 700 : 400 }}>{t}</button>)}
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Energy Level</label>
              <div style={{ display:'flex', gap:6 }}>
                {energyOpts.map(e => <button key={e} onClick={()=>setEnergy(e)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${energy===e ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: energy===e ? 'rgba(251,146,60,0.15)' : 'var(--fg-bg)', color: energy===e ? 'var(--fg-orange)' : 'var(--fg-text2)', fontSize:12, cursor:'pointer', fontWeight: energy===e ? 700 : 400, textTransform:'capitalize' }}>{e}</button>)}
              </div>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Work Style</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {styleOpts.map(s => <button key={s} onClick={()=>setWorkStyle(s)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${workStyle===s ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: workStyle===s ? 'rgba(251,146,60,0.15)' : 'var(--fg-bg)', color: workStyle===s ? 'var(--fg-orange)' : 'var(--fg-text2)', fontSize:12, cursor:'pointer', fontWeight: workStyle===s ? 700 : 400, textTransform:'capitalize' }}>{s.replace('-',' ')}</button>)}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Meetings (optional)</label>
            <input value={meetings} onChange={e=>setMeetings(e.target.value)} placeholder="e.g. 10am standup 30min, 2pm client call 1hr" style={{ width:'100%', padding:'10px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }} />
          </div>
          <button onClick={generate} disabled={loading || (!tasks && !goals)} style={{ padding:'12px 28px', background:'var(--fg-orange)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity: loading || (!tasks && !goals) ? 0.6 : 1 }}>
            {loading ? '⏳ Planning your day...' : '📅 Plan My Day'}
          </button>
        </div>
        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:14, color:'var(--fg-red)', fontSize:13, marginBottom:16 }}>{error}</div>}
        {result && (
          <div>
            <div style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(251,146,60,0.1))', border:'1px solid var(--fg-border)', borderRadius:14, padding:20, marginBottom:20 }}>
              <p style={{ margin:'0 0 6px', fontSize:11, color:'var(--fg-text3)', fontWeight:700, textTransform:'uppercase' }}>Day Theme</p>
              <p style={{ margin:'0 0 10px', fontSize:18, fontWeight:700, color:'var(--fg-text)' }}>{result.dayTheme}</p>
              <p style={{ margin:0, fontSize:13, color:'var(--fg-orange)', fontStyle:'italic' }}>💪 {result.motivationalNote}</p>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:20, borderBottom:'1px solid var(--fg-border)', paddingBottom:12 }}>
              {['schedule','priorities','focus','quickwins'].map(t => <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:'7px 16px', borderRadius:20, border:`1px solid ${activeTab===t ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: activeTab===t ? 'rgba(251,146,60,0.15)' : 'transparent', color: activeTab===t ? 'var(--fg-orange)' : 'var(--fg-text2)', fontSize:13, cursor:'pointer', fontWeight: activeTab===t ? 700 : 400, textTransform:'capitalize' }}>{t === 'quickwins' ? 'Quick Wins' : t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
            </div>
            {activeTab === 'schedule' && (
              <div>
                {(result.schedule || []).map((block: any, i: number) => (
                  <div key={i} style={{ display:'flex', gap:14, marginBottom:10, background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, padding:'12px 16px', alignItems:'center' }}>
                    <div style={{ minWidth:80, fontSize:12, fontWeight:700, color:'var(--fg-text3)' }}>{block.timeBlock}</div>
                    <div style={{ width:4, height:40, borderRadius:2, background: typeColor[block.type] || '#6b7280', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:600, color:'var(--fg-text)' }}>{block.activity}</p>
                      {block.notes && <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{block.notes}</p>}
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, background: (typeColor[block.type] || '#6b7280') + '20', color: typeColor[block.type] || '#6b7280', textTransform:'uppercase' }}>{(block.type||'').replace('_',' ')}</span>
                  </div>
                ))}
                <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:10, padding:14, marginTop:10 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--fg-green)' }}>🏁 End of Day Goal: {result.endOfDayGoal}</p>
                </div>
              </div>
            )}
            {activeTab === 'priorities' && (
              <div>
                {(result.topPriorities || []).map((p: any, i: number) => (
                  <div key={i} style={{ display:'flex', gap:14, background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, padding:16, marginBottom:10 }}>
                    <span style={{ fontSize:20, fontWeight:900, color:'var(--fg-orange)', minWidth:28 }}>#{i+1}</span>
                    <div>
                      <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:700, color:'var(--fg-text)' }}>{p.task}</p>
                      <p style={{ margin:'0 0 4px', fontSize:12, color:'var(--fg-text3)' }}>{p.reason}</p>
                      <span style={{ fontSize:11, color:'var(--fg-orange)', background:'rgba(251,146,60,0.1)', padding:'2px 8px', borderRadius:20 }}>⏱ {p.estimatedTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'focus' && (
              <div>
                {(result.focusBlocks || []).map((f: any, i: number) => (
                  <div key={i} style={{ background:'var(--fg-bg3)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:10, padding:16, marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#6366f1' }}>🎯 {f.focus}</span>
                      <span style={{ fontSize:11, color:'var(--fg-text3)' }}>{f.start} – {f.end}</span>
                    </div>
                    <span style={{ fontSize:11, background:'rgba(99,102,241,0.1)', color:'#6366f1', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{f.technique}</span>
                  </div>
                ))}
                {(result.avoidList || []).length > 0 && (
                  <div style={{ marginTop:16, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:14 }}>
                    <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:'var(--fg-red)', textTransform:'uppercase' }}>🚫 Avoid Today</p>
                    {result.avoidList.map((a: string, i: number) => <p key={i} style={{ margin:'0 0 4px', fontSize:13, color:'var(--fg-text2)' }}>• {a}</p>)}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'quickwins' && (
              <div>
                <p style={{ fontSize:13, color:'var(--fg-text3)', marginBottom:12 }}>Tasks you can knock out in under 5 minutes:</p>
                {(result.quickWins || []).map((w: string, i: number) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, padding:'10px 14px', marginBottom:8 }}>
                    <span style={{ fontSize:16 }}>⚡</span>
                    <span style={{ fontSize:13, color:'var(--fg-text)' }}>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_quickreply() {
  const [message, setMessage] = React.useState('');
  const [context, setContext] = React.useState('');
  const [tone, setTone] = React.useState('professional');
  const [length, setLength] = React.useState('medium');
  const [replyType, setReplyType] = React.useState('email');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(-1);
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const BACKEND = '';
  const toneOpts = ['professional','friendly','direct','empathetic','assertive'];
  const lengthOpts = ['short','medium','long'];
  const typeOpts = [{ id:'email', label:'📧 Email' }, { id:'slack', label:'💬 Slack' }, { id:'linkedin', label:'💼 LinkedIn' }, { id:'sms', label:'📱 SMS' }];
  async function generate() {
    if (!message.trim()) return;
    setLoading(true); setError(''); setResult(null); setCopied(-1);
    try {
      const r = await fetch(`${BACKEND}/api/quick-reply`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`}, body: JSON.stringify({ message, context, tone, length, replyType }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  }
  function copyReply(text: string, i: number) {
    navigator.clipboard.writeText(text).then(() => { setCopied(i); setTimeout(()=>setCopied(-1), 2000); });
  }
  const urgencyColor: Record<string,string> = { low:'var(--fg-green)', medium:'var(--fg-orange)', high:'var(--fg-red)' };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:32 }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <h2 style={{ color:'var(--fg-orange)', margin:'0 0 4px', fontSize:22, fontFamily:'var(--fg-font-display)', fontWeight:800 }}>⚡ Quick Reply</h2>
        <p style={{ color:'var(--fg-text3)', margin:'0 0 24px', fontSize:14 }}>Paste any email or message — get 3 smart reply options instantly</p>
        <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:16, padding:24, marginBottom:24 }}>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {typeOpts.map(t => <button key={t.id} onClick={()=>setReplyType(t.id)} style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${replyType===t.id ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: replyType===t.id ? 'rgba(251,146,60,0.15)' : 'var(--fg-bg)', color: replyType===t.id ? 'var(--fg-orange)' : 'var(--fg-text2)', fontSize:12, cursor:'pointer', fontWeight: replyType===t.id ? 700 : 400 }}>{t.label}</button>)}
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Message to Reply To</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Paste the email, Slack message, or DM you need to reply to..." rows={5} style={{ width:'100%', padding:12, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Context (optional)</label>
            <input value={context} onChange={e=>setContext(e.target.value)} placeholder="e.g. I'm declining this meeting, I need more info first, I want to say yes..." style={{ width:'100%', padding:'10px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Tone</label>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {toneOpts.map(t => <button key={t} onClick={()=>setTone(t)} style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${tone===t ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: tone===t ? 'rgba(251,146,60,0.15)' : 'var(--fg-bg)', color: tone===t ? 'var(--fg-orange)' : 'var(--fg-text2)', fontSize:11, cursor:'pointer', fontWeight: tone===t ? 700 : 400, textTransform:'capitalize' }}>{t}</button>)}
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>Length</label>
              <div style={{ display:'flex', gap:6 }}>
                {lengthOpts.map(l => <button key={l} onClick={()=>setLength(l)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${length===l ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: length===l ? 'rgba(251,146,60,0.15)' : 'var(--fg-bg)', color: length===l ? 'var(--fg-orange)' : 'var(--fg-text2)', fontSize:11, cursor:'pointer', fontWeight: length===l ? 700 : 400, textTransform:'capitalize' }}>{l}</button>)}
              </div>
            </div>
          </div>
          <button onClick={generate} disabled={loading || !message.trim()} style={{ padding:'12px 28px', background:'var(--fg-orange)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity: loading || !message.trim() ? 0.6 : 1 }}>
            {loading ? '⏳ Generating replies...' : '⚡ Generate Replies'}
          </button>
        </div>
        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:14, color:'var(--fg-red)', fontSize:13, marginBottom:16 }}>{error}</div>}
        {result && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, padding:12, textAlign:'center' }}>
                <p style={{ margin:'0 0 4px', fontSize:11, color:'var(--fg-text3)', textTransform:'uppercase', fontWeight:700 }}>Intent</p>
                <p style={{ margin:0, fontSize:12, color:'var(--fg-text)', fontWeight:600 }}>{result.analysis?.intent || '—'}</p>
              </div>
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, padding:12, textAlign:'center' }}>
                <p style={{ margin:'0 0 4px', fontSize:11, color:'var(--fg-text3)', textTransform:'uppercase', fontWeight:700 }}>Urgency</p>
                <p style={{ margin:0, fontSize:12, fontWeight:700, color: urgencyColor[result.analysis?.urgency] || 'var(--fg-text)', textTransform:'capitalize' }}>{result.analysis?.urgency || '—'}</p>
              </div>
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, padding:12, textAlign:'center' }}>
                <p style={{ margin:'0 0 4px', fontSize:11, color:'var(--fg-text3)', textTransform:'uppercase', fontWeight:700 }}>Sentiment</p>
                <p style={{ margin:0, fontSize:12, color:'var(--fg-text)', fontWeight:600, textTransform:'capitalize' }}>{result.analysis?.sentiment || '—'}</p>
              </div>
            </div>
            {result.suggestedSubject && <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#6366f1' }}>📧 Suggested Subject: <strong>{result.suggestedSubject}</strong></div>}
            <div style={{ marginBottom:20 }}>
              {(result.replies || []).map((reply: any, i: number) => (
                <div key={i} style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12, padding:18, marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--fg-orange)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{reply.label}</span>
                    <button onClick={()=>copyReply(reply.text, i)} style={{ padding:'5px 12px', background: copied===i ? 'rgba(16,185,129,0.15)' : 'var(--fg-bg)', border:`1px solid ${copied===i ? 'var(--fg-green)' : 'var(--fg-border)'}`, borderRadius:6, color: copied===i ? 'var(--fg-green)' : 'var(--fg-text2)', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                      {copied===i ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <p style={{ margin:0, fontSize:14, color:'var(--fg-text)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{reply.text}</p>
                </div>
              ))}
            </div>
            {(result.followUpActions || []).length > 0 && (
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, padding:14 }}>
                <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase' }}>📋 Follow-up Actions</p>
                {result.followUpActions.map((a: string, i: number) => <p key={i} style={{ margin:'0 0 4px', fontSize:13, color:'var(--fg-text2)' }}>• {a}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_competitorresearch() {
  const BACKEND = '';
  const FOCUS_AREAS = ['pricing','features','UX','marketing','integrations','support','performance','security'];
  const [yourProduct, setYourProduct] = React.useState('');
  const [competitorInput, setCompetitorInput] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [focusAreas, setFocusAreas] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('overview');

  const toggleFocus = (f: string) => setFocusAreas(prev => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev,f]);

  const analyze = async () => {
    const competitors = competitorInput.split('\n').map(s=>s.trim()).filter(Boolean);
    if (!yourProduct.trim() || competitors.length === 0) { setError('Enter your product and at least one competitor'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/competitor-research`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ yourProduct, competitors, industry, focusAreas })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  };

  const riskColor: Record<string,string> = { leader:'#10b981', challenger:'#3b82f6', niche:'#f59e0b', emerging:'#8b5cf6' };

  return (
    <div style={{padding:'24px',maxWidth:'900px',margin:'0 auto'}}>
      <h2 style={{fontSize:'22px',fontWeight:700,marginBottom:'6px'}}>🔭 Competitor Intelligence</h2>
      <p style={{color:'#6b7280',marginBottom:'24px',fontSize:'14px'}}>Analyze your competitive landscape and discover differentiation opportunities</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Your Product / Company *</label>
          <input value={yourProduct} onChange={e=>setYourProduct(e.target.value)} placeholder="e.g. Acme CRM" style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',boxSizing:'border-box'}} />
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Industry (optional)</label>
          <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. B2B SaaS, E-commerce, Fintech" style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',boxSizing:'border-box'}} />
        </div>
      </div>

      <div style={{marginBottom:'16px'}}>
        <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Competitors (one per line, up to 5) *</label>
        <textarea value={competitorInput} onChange={e=>setCompetitorInput(e.target.value)} rows={4} placeholder={"Salesforce\nHubSpot\nPipedrive"} style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',resize:'vertical',boxSizing:'border-box'}} />
      </div>

      <div style={{marginBottom:'20px'}}>
        <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'8px'}}>Focus Areas</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
          {FOCUS_AREAS.map(f => (
            <button key={f} onClick={()=>toggleFocus(f)} style={{padding:'6px 14px',borderRadius:'20px',fontSize:'13px',fontWeight:500,cursor:'pointer',border:'1.5px solid',borderColor:focusAreas.includes(f)?'#6366f1':'#e5e7eb',background:focusAreas.includes(f)?'#eef2ff':'white',color:focusAreas.includes(f)?'#6366f1':'#374151'}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px',color:'#dc2626',fontSize:'14px',marginBottom:'16px'}}>{error}</div>}

      <button onClick={analyze} disabled={loading} style={{background:loading?'#9ca3af':'#6366f1',color:'white',border:'none',borderRadius:'8px',padding:'12px 28px',fontSize:'15px',fontWeight:600,cursor:loading?'not-allowed':'pointer',marginBottom:'28px'}}>
        {loading ? '🔍 Analyzing...' : '🔭 Analyze Competitors'}
      </button>

      {result && (
        <div>
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'16px',marginBottom:'20px'}}>
            <p style={{margin:0,fontSize:'14px',color:'#166534',lineHeight:1.6}}>{result.marketOverview}</p>
          </div>

          <div style={{display:'flex',gap:'8px',marginBottom:'20px',borderBottom:'2px solid #e5e7eb',paddingBottom:'0'}}>
            {['overview','swot','opportunities','strategies'].map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} style={{padding:'10px 18px',border:'none',background:'none',cursor:'pointer',fontSize:'14px',fontWeight:activeTab===t?700:500,color:activeTab===t?'#6366f1':'#6b7280',borderBottom:activeTab===t?'3px solid #6366f1':'3px solid transparent',marginBottom:'-2px'}}>
                {t === 'overview' ? '🏢 Competitors' : t === 'swot' ? '📊 Your SWOT' : t === 'opportunities' ? '💡 Opportunities' : '🏆 Win Strategies'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{display:'grid',gap:'16px'}}>
              {(result.competitors||[]).map((c:any, i:number) => (
                <div key={i} style={{border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'18px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                    <div>
                      <span style={{fontSize:'17px',fontWeight:700}}>{c.name}</span>
                      <span style={{fontSize:'13px',color:'#6b7280',marginLeft:'12px'}}>{c.tagline}</span>
                    </div>
                    <span style={{padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:600,background:`${riskColor[c.marketPosition]||'#6b7280'}20`,color:riskColor[c.marketPosition]||'#6b7280',textTransform:'capitalize'}}>{c.marketPosition}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',fontSize:'13px'}}>
                    <div>
                      <div style={{color:'#6b7280',marginBottom:'4px'}}>Target: {c.targetCustomer}</div>
                      <div style={{color:'#6b7280'}}>Pricing: {c.estimatedPricing||c.pricingModel}</div>
                      <div style={{color:'#6366f1',fontWeight:600,marginTop:'6px'}}>"{c.uniqueAngle}"</div>
                    </div>
                    <div>
                      <div style={{marginBottom:'6px'}}><span style={{color:'#10b981',fontWeight:600}}>✓ </span>{(c.strengths||[]).join(' · ')}</div>
                      <div><span style={{color:'#ef4444',fontWeight:600}}>✗ </span>{(c.weaknesses||[]).join(' · ')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'swot' && result.yourSwot && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
              {[
                {key:'strengths',label:'💪 Strengths',bg:'#f0fdf4',border:'#bbf7d0',color:'#166534'},
                {key:'weaknesses',label:'⚠️ Weaknesses',bg:'#fff7ed',border:'#fed7aa',color:'#92400e'},
                {key:'opportunities',label:'🚀 Opportunities',bg:'#eff6ff',border:'#bfdbfe',color:'#1e40af'},
                {key:'threats',label:'🎯 Threats',bg:'#fef2f2',border:'#fecaca',color:'#991b1b'},
              ].map(s => (
                <div key={s.key} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:'10px',padding:'16px'}}>
                  <div style={{fontWeight:700,marginBottom:'10px',color:s.color}}>{s.label}</div>
                  {(result.yourSwot[s.key]||[]).map((item:string,i:number) => (
                    <div key={i} style={{fontSize:'13px',color:'#374151',marginBottom:'6px',paddingLeft:'12px',borderLeft:`3px solid ${s.border}`}}>{item}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'opportunities' && (
            <div>
              {result.pricingInsights && <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:'10px',padding:'16px',marginBottom:'16px'}}><div style={{fontWeight:700,marginBottom:'8px',color:'#6d28d9'}}>💰 Pricing Insights</div><p style={{margin:0,fontSize:'14px',color:'#374151',lineHeight:1.6}}>{result.pricingInsights}</p></div>}
              <div style={{marginBottom:'16px'}}><div style={{fontWeight:700,marginBottom:'12px',fontSize:'15px'}}>🏳️ White Space Opportunities</div>
                {(result.differentiationOpportunities||[]).map((op:string,i:number) => (
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'10px',padding:'12px',background:'white',border:'1.5px solid #e5e7eb',borderRadius:'8px'}}>
                    <span style={{color:'#6366f1',fontWeight:700,fontSize:'16px'}}>{i+1}</span>
                    <span style={{fontSize:'14px',color:'#374151'}}>{op}</span>
                  </div>
                ))}
              </div>
              {(result.keyBattlegrounds||[]).length > 0 && <div><div style={{fontWeight:700,marginBottom:'10px',fontSize:'15px'}}>⚔️ Key Battlegrounds</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>{result.keyBattlegrounds.map((b:string,i:number)=><span key={i} style={{padding:'6px 14px',background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:'20px',fontSize:'13px',color:'#92400e'}}>{b}</span>)}</div>
              </div>}
            </div>
          )}

          {activeTab === 'strategies' && (
            <div>{(result.winStrategies||[]).map((s:string,i:number) => (
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'12px',padding:'14px',background:'white',border:'1.5px solid #e5e7eb',borderRadius:'8px'}}>
                <span style={{background:'#6366f1',color:'white',borderRadius:'50%',width:'24px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,flexShrink:0}}>{i+1}</span>
                <span style={{fontSize:'14px',color:'#374151',lineHeight:1.5}}>{s}</span>
              </div>
            ))}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_jobdesc() {
  const BACKEND = '';
  const LEVELS = ['intern','junior','mid','senior','lead','staff','principal','director','vp','c-level'];
  const TYPES = ['full-time','part-time','contract','freelance','temporary'];
  const REMOTES = ['on-site','hybrid','remote'];
  const TONES = ['professional','startup','friendly','formal','creative','technical'];
  const [jobTitle, setJobTitle] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [level, setLevel] = React.useState('mid');
  const [employmentType, setEmploymentType] = React.useState('full-time');
  const [remote, setRemote] = React.useState('hybrid');
  const [salary, setSalary] = React.useState('');
  const [keyResponsibilities, setKeyResponsibilities] = React.useState('');
  const [requiredSkills, setRequiredSkills] = React.useState('');
  const [niceToHave, setNiceToHave] = React.useState('');
  const [companyDescription, setCompanyDescription] = React.useState('');
  const [tone, setTone] = React.useState('professional');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('preview');
  const [copied, setCopied] = React.useState(false);

  const generate = async () => {
    if (!jobTitle.trim()) { setError('Job title is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/job-desc`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ jobTitle, company, level, employmentType, remote, salary, keyResponsibilities, requiredSkills, niceToHave, companyDescription, tone })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  };

  const copyFull = () => {
    if (result?.fullText) { navigator.clipboard.writeText(result.fullText); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };

  return (
    <div style={{padding:'24px',maxWidth:'900px',margin:'0 auto'}}>
      <h2 style={{fontSize:'22px',fontWeight:700,marginBottom:'6px'}}>💼 Job Description Writer</h2>
      <p style={{color:'#6b7280',marginBottom:'24px',fontSize:'14px'}}>Create inclusive, compelling job descriptions that attract top candidates</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Job Title *</label>
          <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Senior Product Manager" style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',boxSizing:'border-box'}} />
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Company Name (optional)</label>
          <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Acme Inc." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',boxSizing:'border-box'}} />
        </div>
      </div>

      <div style={{marginBottom:'14px'}}>
        <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'8px'}}>Level</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>{LEVELS.map(l=>(
          <button key={l} onClick={()=>setLevel(l)} style={{padding:'6px 12px',borderRadius:'20px',fontSize:'13px',fontWeight:500,cursor:'pointer',border:'1.5px solid',borderColor:level===l?'#6366f1':'#e5e7eb',background:level===l?'#eef2ff':'white',color:level===l?'#6366f1':'#374151',textTransform:'capitalize'}}>{l}</button>
        ))}</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'14px',marginBottom:'14px'}}>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'8px'}}>Employment Type</label>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>{TYPES.map(t=>(
            <label key={t} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',cursor:'pointer'}}><input type="radio" checked={employmentType===t} onChange={()=>setEmploymentType(t)} />{t}</label>
          ))}</div>
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'8px'}}>Work Location</label>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>{REMOTES.map(r=>(
            <label key={r} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',cursor:'pointer'}}><input type="radio" checked={remote===r} onChange={()=>setRemote(r)} />{r}</label>
          ))}</div>
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'8px'}}>Tone</label>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>{TONES.map(t=>(
            <label key={t} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',cursor:'pointer',textTransform:'capitalize'}}><input type="radio" checked={tone===t} onChange={()=>setTone(t)} />{t}</label>
          ))}</div>
        </div>
      </div>

      <div style={{marginBottom:'14px'}}>
        <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Salary / Comp Range (optional)</label>
        <input value={salary} onChange={e=>setSalary(e.target.value)} placeholder="e.g. $120,000 – $160,000 + equity" style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',boxSizing:'border-box'}} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Key Responsibilities (optional)</label>
          <textarea value={keyResponsibilities} onChange={e=>setKeyResponsibilities(e.target.value)} rows={3} placeholder="Brief notes on main duties..." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',resize:'vertical',boxSizing:'border-box'}} />
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Required Skills (optional)</label>
          <textarea value={requiredSkills} onChange={e=>setRequiredSkills(e.target.value)} rows={3} placeholder="Key skills and experience required..." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',resize:'vertical',boxSizing:'border-box'}} />
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'20px'}}>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Nice to Have (optional)</label>
          <textarea value={niceToHave} onChange={e=>setNiceToHave(e.target.value)} rows={2} placeholder="Bonus qualifications..." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',resize:'vertical',boxSizing:'border-box'}} />
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:600,color:'#374151',display:'block',marginBottom:'6px'}}>Company Description (optional)</label>
          <textarea value={companyDescription} onChange={e=>setCompanyDescription(e.target.value)} rows={2} placeholder="Brief company pitch..." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',resize:'vertical',boxSizing:'border-box'}} />
        </div>
      </div>

      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px',color:'#dc2626',fontSize:'14px',marginBottom:'16px'}}>{error}</div>}

      <button onClick={generate} disabled={loading} style={{background:loading?'#9ca3af':'#6366f1',color:'white',border:'none',borderRadius:'8px',padding:'12px 28px',fontSize:'15px',fontWeight:600,cursor:loading?'not-allowed':'pointer',marginBottom:'28px'}}>
        {loading ? '✍️ Writing...' : '💼 Generate Job Description'}
      </button>

      {result && (
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
            <div style={{display:'flex',gap:'8px'}}>
              {['preview','breakdown','deicheck'].map(t => (
                <button key={t} onClick={()=>setActiveTab(t)} style={{padding:'8px 16px',border:'none',background:activeTab===t?'#6366f1':'#f3f4f6',color:activeTab===t?'white':'#374151',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:600}}>
                  {t==='preview'?'📄 Preview':t==='breakdown'?'📋 Breakdown':'🌈 DEI Check'}
                </button>
              ))}
            </div>
            <button onClick={copyFull} style={{padding:'8px 16px',background:copied?'#10b981':'white',color:copied?'white':'#374151',border:'1.5px solid #e5e7eb',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:600}}>
              {copied ? '✓ Copied!' : '📋 Copy Full JD'}
            </button>
          </div>

          {activeTab === 'preview' && (
            <div style={{border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'24px',background:'white',lineHeight:1.7}}>
              {result.tagline && <div style={{fontSize:'16px',color:'#6366f1',fontWeight:600,marginBottom:'16px',fontStyle:'italic'}}>"{result.tagline}"</div>}
              <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:'14px',color:'#1f2937',margin:0}}>{result.fullText}</pre>
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div style={{display:'grid',gap:'14px'}}>
              {[
                {key:'responsibilities',label:'📌 Responsibilities',color:'#6366f1'},
                {key:'requiredQualifications',label:'✅ Required Qualifications',color:'#059669'},
                {key:'niceToHave',label:'⭐ Nice to Have',color:'#d97706'},
                {key:'whatWeOffer',label:'🎁 What We Offer',color:'#7c3aed'},
              ].map(s => (
                result[s.key]?.length > 0 && <div key={s.key} style={{border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'16px'}}>
                  <div style={{fontWeight:700,marginBottom:'10px',color:s.color}}>{s.label}</div>
                  {result[s.key].map((item:string,i:number) => <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px',fontSize:'14px',color:'#374151'}}><span style={{color:s.color,flexShrink:0}}>•</span>{item}</div>)}
                </div>
              ))}
              {result.salaryRange && <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:'10px',padding:'14px'}}><span style={{fontWeight:600,color:'#6d28d9'}}>💰 Compensation: </span><span style={{fontSize:'14px',color:'#374151'}}>{result.salaryRange}</span></div>}
            </div>
          )}

          {activeTab === 'deicheck' && result.deiStatement && (
            <div>
              <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'16px',marginBottom:'16px'}}>
                <div style={{fontWeight:700,marginBottom:'8px',color:'#166534'}}>🌈 DEI Statement</div>
                <p style={{margin:0,fontSize:'14px',color:'#166534',lineHeight:1.6}}>{result.deiStatement}</p>
              </div>
              <div style={{border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'16px'}}>
                <div style={{fontWeight:700,marginBottom:'12px'}}>✅ Inclusive Language Checklist</div>
                {[
                  'Gender-neutral language used throughout',
                  'Avoids age-related terms ("young","recent grad")',
                  'Focuses on skills over credentials where possible',
                  'No unnecessary physical requirements listed',
                  'Growth and learning opportunities highlighted',
                  'Compensation transparency included',
                ].map((item,i) => <div key={i} style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'8px',fontSize:'14px',color:'#374151'}}><span style={{color:'#10b981',fontWeight:700}}>✓</span>{item}</div>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_contractanalyze() {
  const BACKEND = '';
  const CONTRACT_TYPES = ['general','nda','employment','saas','freelance','partnership','lease','service','purchase','licensing'];
  const [contract, setContract] = React.useState('');
  const [contractType, setContractType] = React.useState('general');
  const [perspective, setPerspective] = React.useState('both');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('overview');

  const analyze = async () => {
    if (contract.trim().length < 50) { setError('Please paste contract text (min 50 chars)'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/contract-analyze`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ contract, contractType, perspective }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
      setActiveTab('overview');
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const riskColor: Record<string, string> = { Low:'#059669', Medium:'#d97706', High:'#dc2626', Critical:'#7f1d1d' };
  const riskBg: Record<string, string> = { Low:'#ecfdf5', Medium:'#fefce8', High:'#fef2f2', Critical:'#fee2e2' };

  return (
    <div style={{ padding:'24px', maxWidth:'1000px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>⚖️ Contract Analyzer</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>AI-powered contract review — red flags, key terms, obligations (not legal advice)</p>
      </div>

      {!result ? (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Contract Type</label>
              <select value={contractType} onChange={e => setContractType(e.target.value)} style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', background:'#fff' }}>
                {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Analyze From Perspective</label>
              <select value={perspective} onChange={e => setPerspective(e.target.value)} style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', background:'#fff' }}>
                <option value="both">Both Parties</option>
                <option value="buyer">Buyer / Client</option>
                <option value="seller">Seller / Vendor</option>
                <option value="employee">Employee</option>
                <option value="employer">Employer</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Contract Text *</label>
            <textarea value={contract} onChange={e => setContract(e.target.value)} rows={16}
              placeholder="Paste the full contract text here..."
              style={{ width:'100%', padding:'12px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'13px', resize:'vertical', boxSizing:'border-box', fontFamily:'monospace', lineHeight:1.6 }} />
          </div>
          <div style={{ marginBottom:'12px', padding:'10px 14px', background:'#fefce8', border:'1px solid #fde68a', borderRadius:'8px', fontSize:'12px', color:'#92400e' }}>
            ⚠️ This is AI analysis for informational purposes only — not legal advice. Always consult a qualified attorney.
          </div>
          <button onClick={analyze} disabled={loading || contract.trim().length < 50} style={{
            padding:'10px 28px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
          }}>{loading ? '⚖️ Analyzing...' : '⚖️ Analyze Contract'}</button>
          {error && <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}
        </div>
      ) : (
        <div>
          {/* Risk header */}
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:'20px', alignItems:'center', marginBottom:'20px', padding:'16px 20px', background: riskBg[result.overallRisk] || '#f8fafc', border:`1px solid ${result.overallRisk === 'High' || result.overallRisk === 'Critical' ? '#fca5a5' : '#e2e8f0'}`, borderRadius:'12px' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'28px', fontWeight:800, color: riskColor[result.overallRisk] || '#374151' }}>{result.overallRisk}</div>
              <div style={{ fontSize:'11px', color:'#64748b', fontWeight:600 }}>RISK LEVEL</div>
            </div>
            <div>
              <div style={{ fontSize:'14px', fontWeight:700, color:'#1e293b', marginBottom:'4px' }}>{result.contractType}</div>
              <div style={{ fontSize:'13px', color:'#64748b', lineHeight:1.5 }}>{result.executiveSummary}</div>
            </div>
            <button onClick={() => setResult(null)} style={{ padding:'7px 14px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#64748b' }}>← New</button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'4px', marginBottom:'20px', borderBottom:'2px solid #e2e8f0' }}>
            {['overview','redflags','obligations','terms'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding:'8px 16px', border:'none', borderBottom: activeTab === t ? '2px solid #6366f1' : '2px solid transparent',
                background:'none', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? '#4f46e5' : '#6b7280', textTransform:'capitalize', marginBottom:'-2px',
              }}>{t === 'redflags' ? '🚩 Red Flags' : t === 'obligations' ? '📋 Obligations' : t === 'terms' ? '📌 Key Terms' : '📊 Overview'}</button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              {[
                { label:'Payment Terms', value: result.paymentTerms },
                { label:'Termination', value: result.terminationConditions },
                { label:'IP Ownership', value: result.ipOwnership },
                { label:'Liability Limits', value: result.liabilityLimitations },
              ].map(item => item.value ? (
                <div key={item.label} style={{ padding:'14px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:'#64748b', marginBottom:'6px' }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.5 }}>{item.value}</div>
                </div>
              ) : null)}
              {result.missingClauses?.length > 0 && (
                <div style={{ gridColumn:'1/-1', padding:'14px 16px', background:'#fefce8', border:'1px solid #fde68a', borderRadius:'10px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:'#92400e', marginBottom:'8px' }}>⚠️ MISSING CLAUSES</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {result.missingClauses.map((c: string, i: number) => <span key={i} style={{ padding:'4px 10px', background:'#fde68a', color:'#78350f', borderRadius:'12px', fontSize:'12px' }}>{c}</span>)}
                  </div>
                </div>
              )}
              {result.negotiationLeverage?.length > 0 && (
                <div style={{ gridColumn:'1/-1', padding:'14px 16px', background:'#f0f9ff', border:'1px solid #7dd3fc', borderRadius:'10px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:'#0c4a6e', marginBottom:'8px' }}>💪 NEGOTIATION LEVERAGE POINTS</div>
                  {result.negotiationLeverage.map((l: string, i: number) => <div key={i} style={{ fontSize:'13px', color:'#075985', padding:'3px 0', display:'flex', gap:'8px' }}><span>•</span><span>{l}</span></div>)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'redflags' && (
            <div>
              {result.redFlags?.length > 0 ? result.redFlags.map((flag: any, i: number) => (
                <div key={i} style={{ marginBottom:'12px', padding:'14px 16px', background: riskBg[flag.severity] || '#f8fafc', border:`1px solid ${flag.severity === 'High' || flag.severity === 'Critical' ? '#fca5a5' : '#e2e8f0'}`, borderRadius:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' }}>
                    <div style={{ fontSize:'14px', fontWeight:700, color:'#1e293b' }}>{flag.issue}</div>
                    <span style={{ padding:'2px 10px', borderRadius:'12px', fontSize:'11px', fontWeight:700, color:'#fff', background: riskColor[flag.severity] || '#6b7280' }}>{flag.severity}</span>
                  </div>
                  {flag.clause && <div style={{ fontSize:'12px', color:'#64748b', marginBottom:'6px' }}>Clause: {flag.clause}</div>}
                  <div style={{ fontSize:'13px', color:'#374151' }}>→ {flag.recommendation}</div>
                </div>
              )) : <div style={{ color:'#94a3b8', fontSize:'14px' }}>No major red flags identified.</div>}
            </div>
          )}

          {activeTab === 'obligations' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              {Object.entries(result.partyObligations || {}).map(([party, obligations]: [string, any]) => (
                <div key={party} style={{ padding:'16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#374151', marginBottom:'10px', textTransform:'uppercase' }}>{party.replace('party', 'Party ')}</div>
                  {(obligations as string[]).map((o: string, i: number) => <div key={i} style={{ fontSize:'13px', color:'#475569', padding:'5px 0', borderTop: i > 0 ? '1px solid #e2e8f0' : 'none', display:'flex', gap:'8px' }}><span>•</span><span>{o}</span></div>)}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'terms' && (
            <div>
              {result.keyTerms?.map((term: any, i: number) => (
                <div key={i} style={{ marginBottom:'10px', padding:'14px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <div style={{ fontSize:'14px', fontWeight:700, color:'#1e293b' }}>{term.term}</div>
                    {term.location && <div style={{ fontSize:'12px', color:'#94a3b8' }}>{term.location}</div>}
                  </div>
                  <div style={{ fontSize:'13px', color:'#475569', lineHeight:1.5 }}>{term.summary}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop:'16px', padding:'10px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'11px', color:'#94a3b8' }}>
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}

export function ForgeTab_productdesc() {
  const BACKEND = '';
  const PLATFORMS = [
    { id:'amazon', label:'Amazon', icon:'📦' },
    { id:'shopify', label:'Shopify', icon:'🛍️' },
    { id:'ebay', label:'eBay', icon:'🔨' },
    { id:'etsy', label:'Etsy', icon:'🎨' },
    { id:'general_seo', label:'SEO Page', icon:'🔍' },
    { id:'social_media', label:'Social Media', icon:'📱' },
  ];
  const TONES = ['professional','friendly','luxury','playful','urgent','minimalist','storytelling'];
  const [productName, setProductName] = React.useState('');
  const [features, setFeatures] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [platform, setPlatform] = React.useState('general_seo');
  const [tone, setTone] = React.useState('professional');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const generate = async () => {
    if (!productName.trim() || !features.trim()) { setError('Product name and features are required'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/product-desc`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ productName, features, targetAudience: audience, tone, platform, price }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding:'24px', maxWidth:'900px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>🛒 Product Description Writer</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>Platform-optimized product copy for Amazon, Shopify, eBay, Etsy, SEO, and Social</p>
      </div>

      {/* Platform */}
      <div style={{ marginBottom:'16px' }}>
        <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>Platform</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)} style={{
              padding:'8px 16px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontSize:'13px',
              borderColor: platform === p.id ? '#6366f1' : '#e5e7eb',
              background: platform === p.id ? '#eef2ff' : '#fff',
              color: platform === p.id ? '#4f46e5' : '#6b7280', fontWeight: platform === p.id ? 700 : 400,
            }}>{p.icon} {p.label}</button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div style={{ marginBottom:'16px' }}>
        <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>Tone</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {TONES.map(t => (
            <button key={t} onClick={() => setTone(t)} style={{
              padding:'5px 14px', borderRadius:'14px', border:'1.5px solid', cursor:'pointer', fontSize:'12px', textTransform:'capitalize',
              borderColor: tone === t ? '#10b981' : '#e5e7eb',
              background: tone === t ? '#ecfdf5' : '#fff',
              color: tone === t ? '#059669' : '#6b7280', fontWeight: tone === t ? 600 : 400,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
        <div>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Product Name *</label>
          <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. UltraGrip Pro Running Shoes" style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Price (optional)</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. $49.99" style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
        </div>
      </div>
      <div style={{ marginBottom:'12px' }}>
        <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Target Audience (optional)</label>
        <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Amateur marathon runners aged 25-45 who prioritize comfort" style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
      </div>
      <div style={{ marginBottom:'16px' }}>
        <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Product Features & Details *</label>
        <textarea value={features} onChange={e => setFeatures(e.target.value)} rows={5}
          placeholder="List key features, specs, materials, dimensions, what's included, unique advantages...&#10;e.g. Carbon fiber sole, memory foam insole, water-resistant upper, 3 color options, sizes 6-14, machine washable"
          style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }} />
      </div>

      <button onClick={generate} disabled={loading || !productName.trim() || !features.trim()} style={{
        padding:'10px 24px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
        cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
      }}>{loading ? '✍️ Writing...' : `✍️ Write for ${PLATFORMS.find(p => p.id === platform)?.label || 'Platform'}`}</button>

      {error && <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}

      {result && (
        <div style={{ marginTop:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <div style={{ fontSize:'14px', fontWeight:600, color:'#374151' }}>Generated Copy — {PLATFORMS.find(p => p.id === platform)?.label}</div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={copy} style={{ padding:'6px 14px', background: copied ? '#ecfdf5' : '#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color: copied ? '#059669' : '#475569' }}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button onClick={generate} style={{ padding:'6px 14px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color:'#6366f1' }}>↻ Regenerate</button>
            </div>
          </div>
          <div style={{ padding:'20px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px' }}>
            <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'14px', color:'#1e293b', margin:0, lineHeight:1.8 }}>{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ForgeTab_ideagen() {
  const BACKEND = '';
  const CATEGORIES = [
    { id:'startup', label:'Startup Ideas', icon:'🚀' },
    { id:'features', label:'Product Features', icon:'⚙️' },
    { id:'marketing', label:'Marketing Campaigns', icon:'📣' },
    { id:'content', label:'Content Ideas', icon:'📝' },
    { id:'business', label:'Business Models', icon:'💼' },
    { id:'names', label:'Brand Names', icon:'✨' },
    { id:'problem', label:'Problems to Solve', icon:'🔍' },
    { id:'growth', label:'Growth Hacks', icon:'📈' },
  ];
  const [prompt, setPrompt] = React.useState('');
  const [category, setCategory] = React.useState('startup');
  const [ideas, setIdeas] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [expanded, setExpanded] = React.useState<number | null>(0);

  const generate = async () => {
    if (!prompt.trim()) { setError('Describe the domain or context'); return; }
    setLoading(true); setError(''); setIdeas([]);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/ideagen`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ prompt, category }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setIdeas(d.ideas || []);
      setExpanded(0);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const scoreColor = (v: number) => v >= 80 ? '#059669' : v >= 60 ? '#d97706' : '#dc2626';

  return (
    <div style={{ padding:'24px', maxWidth:'900px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>💡 Idea Generator</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>AI-generated ideas with scoring and validation framework</p>
      </div>

      {/* Category */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'16px' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)} style={{
            padding:'9px 8px', borderRadius:'10px', border:'2px solid', cursor:'pointer', textAlign:'center',
            borderColor: category === c.id ? '#6366f1' : '#e5e7eb',
            background: category === c.id ? '#eef2ff' : '#fff',
          }}>
            <div style={{ fontSize:'16px', marginBottom:'3px' }}>{c.icon}</div>
            <div style={{ fontSize:'11px', fontWeight: category === c.id ? 700 : 500, color: category === c.id ? '#4f46e5' : '#374151' }}>{c.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
        <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Describe the domain, space, or constraints... e.g. B2B SaaS for remote teams, budget under $50k, solo founder"
          style={{ flex:1, padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px' }} />
        <button onClick={generate} disabled={loading || !prompt.trim()} style={{
          padding:'10px 22px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600, whiteSpace:'nowrap',
        }}>{loading ? '💡 Generating...' : '💡 Generate'}</button>
      </div>

      {error && <div style={{ padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px', marginBottom:'12px' }}>{error}</div>}

      {ideas.length > 0 && (
        <div>
          {ideas.map((idea, i) => (
            <div key={i} style={{ marginBottom:'12px', border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden' }}>
              <button onClick={() => setExpanded(expanded === i ? null : i)} style={{
                width:'100%', padding:'14px 18px', background: expanded === i ? '#eef2ff' : '#f8fafc', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', gap:'12px', textAlign:'left',
              }}>
                <span style={{ fontSize:'20px', fontWeight:800, color:'#c7d2fe', minWidth:'28px' }}>#{i+1}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'15px', fontWeight:700, color:'#1e293b' }}>{idea.title}</div>
                  <div style={{ fontSize:'13px', color:'#64748b', marginTop:'2px' }}>{idea.tagline}</div>
                </div>
                {idea.score && (
                  <div style={{ display:'flex', gap:'8px' }}>
                    {Object.entries(idea.score).map(([k, v]: [string, any]) => (
                      <div key={k} style={{ textAlign:'center', minWidth:'40px' }}>
                        <div style={{ fontSize:'14px', fontWeight:800, color: scoreColor(v) }}>{v}</div>
                        <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase' }}>{k.substring(0,3)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <span style={{ color:'#94a3b8', fontSize:'16px' }}>{expanded === i ? '▲' : '▼'}</span>
              </button>

              {expanded === i && (
                <div style={{ padding:'16px 18px', background:'#fff', borderTop:'1px solid #e2e8f0' }}>
                  {idea.details && Object.entries(idea.details).map(([k, v]: [string, any]) => (
                    <div key={k} style={{ marginBottom:'10px', display:'grid', gridTemplateColumns:'160px 1fr', gap:'8px' }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:'#374151', textTransform:'capitalize', paddingTop:'2px' }}>{k.replace(/_/g,' ')}</div>
                      <div style={{ fontSize:'13px', color:'#475569', lineHeight:1.6 }}>{v}</div>
                    </div>
                  ))}
                  {idea.verdict && (
                    <div style={{ marginTop:'12px', padding:'10px 14px', background:'#f0f9ff', border:'1px solid #7dd3fc', borderRadius:'8px', fontSize:'13px', color:'#0c4a6e', fontStyle:'italic' }}>
                      💭 {idea.verdict}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_meetingnotes() {
  const BACKEND = '';
  const [transcript, setTranscript] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [attendees, setAttendees] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('summary');
  const [copied, setCopied] = React.useState(false);

  const process = async () => {
    if (transcript.trim().length < 30) { setError('Please paste meeting notes (min 30 chars)'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/meeting-notes`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ transcript, meetingTitle: title, attendees }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
      setActiveTab('summary');
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copyEmail = () => {
    if (!result?.followUpEmail) return;
    navigator.clipboard.writeText(`Subject: ${result.followUpEmail.subject}\n\n${result.followUpEmail.body}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const priorityColor: Record<string, string> = { High:'#dc2626', Medium:'#d97706', Low:'#059669' };

  return (
    <div style={{ padding:'24px', maxWidth:'1000px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>📋 Meeting Notes AI</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>Transform raw meeting notes into decisions, action items, and follow-up emails</p>
      </div>

      {!result ? (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Meeting Title (optional)</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q3 Planning Kickoff" style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Attendees (optional)</label>
              <input value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="e.g. Alice, Bob, Carol" style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Meeting Notes / Transcript *</label>
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={14}
              placeholder="Paste your meeting transcript, raw notes, or any unstructured meeting content here..."
              style={{ width:'100%', padding:'12px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.6 }} />
          </div>
          <button onClick={process} disabled={loading || transcript.trim().length < 30} style={{
            padding:'10px 28px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
          }}>{loading ? '📋 Processing...' : '📋 Process Meeting Notes'}</button>
          {error && <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}
        </div>
      ) : (
        <div>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', padding:'16px 20px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px' }}>
            <div>
              <div style={{ fontSize:'18px', fontWeight:700, color:'#1e293b' }}>{result.title}</div>
              <div style={{ fontSize:'13px', color:'#64748b', marginTop:'4px' }}>{result.summary}</div>
              {result.sentiment && <div style={{ marginTop:'8px', fontSize:'12px' }}>Sentiment: <strong style={{ color:'#6366f1' }}>{result.sentiment}</strong></div>}
            </div>
            <button onClick={() => setResult(null)} style={{ padding:'7px 14px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#64748b' }}>← New Notes</button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'4px', marginBottom:'20px', borderBottom:'2px solid #e2e8f0' }}>
            {['summary','actions','email'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding:'8px 18px', border:'none', borderBottom: activeTab === t ? '2px solid #6366f1' : '2px solid transparent',
                background:'none', cursor:'pointer', fontSize:'14px', fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? '#4f46e5' : '#6b7280', textTransform:'capitalize', marginBottom:'-2px',
              }}>{t === 'actions' ? 'Action Items' : t === 'email' ? 'Follow-up Email' : 'Summary'}</button>
            ))}
          </div>

          {activeTab === 'summary' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div style={{ padding:'16px', background:'#f0f9ff', border:'1px solid #7dd3fc', borderRadius:'10px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#0c4a6e', marginBottom:'10px' }}>✅ KEY DECISIONS ({result.keyDecisions?.length || 0})</div>
                {result.keyDecisions?.map((d: any, i: number) => (
                  <div key={i} style={{ marginBottom:'10px', paddingBottom:'10px', borderBottom: i < result.keyDecisions.length-1 ? '1px solid #bae6fd' : 'none' }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#1e293b' }}>{d.decision}</div>
                    {d.owner && <div style={{ fontSize:'12px', color:'#64748b', marginTop:'2px' }}>Owner: {d.owner}</div>}
                    {d.rationale && <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>{d.rationale}</div>}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ padding:'16px', background:'#fefce8', border:'1px solid #fde68a', borderRadius:'10px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#92400e', marginBottom:'8px' }}>❓ OPEN QUESTIONS</div>
                  {result.openQuestions?.map((q: string, i: number) => <div key={i} style={{ fontSize:'13px', color:'#78350f', padding:'3px 0', display:'flex', gap:'8px' }}><span>•</span><span>{q}</span></div>)}
                </div>
                <div style={{ padding:'16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#374151', marginBottom:'8px' }}>📌 TOPICS COVERED</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {result.topicsCovered?.map((t: string, i: number) => <span key={i} style={{ padding:'4px 10px', background:'#e2e8f0', color:'#374151', borderRadius:'12px', fontSize:'12px' }}>{t}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div>
              {result.actionItems?.length > 0 ? result.actionItems.map((item: any, i: number) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:'12px', alignItems:'center', padding:'12px 16px', background: i % 2 === 0 ? '#f8fafc' : '#fff', border:'1px solid #e2e8f0', borderRadius:'8px', marginBottom:'8px' }}>
                  <div style={{ fontSize:'14px', color:'#1e293b', fontWeight:500 }}>{item.task}</div>
                  <div style={{ fontSize:'12px', color:'#64748b', whiteSpace:'nowrap' }}>👤 {item.owner}</div>
                  <div style={{ fontSize:'12px', color:'#64748b', whiteSpace:'nowrap' }}>📅 {item.deadline}</div>
                  <span style={{ padding:'3px 10px', borderRadius:'12px', fontSize:'11px', fontWeight:700, color:'#fff', background: priorityColor[item.priority] || '#6b7280', whiteSpace:'nowrap' }}>{item.priority}</span>
                </div>
              )) : <div style={{ color:'#94a3b8', fontSize:'14px' }}>No action items found in these notes.</div>}
            </div>
          )}

          {activeTab === 'email' && result.followUpEmail && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <div style={{ fontSize:'14px', fontWeight:600, color:'#374151' }}>Subject: {result.followUpEmail.subject}</div>
                <button onClick={copyEmail} style={{ padding:'6px 14px', background: copied ? '#ecfdf5' : '#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color: copied ? '#059669' : '#475569' }}>
                  {copied ? '✓ Copied!' : '📋 Copy Email'}
                </button>
              </div>
              <div style={{ padding:'20px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px' }}>
                <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'14px', color:'#1e293b', margin:0, lineHeight:1.8 }}>{result.followUpEmail.body}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
