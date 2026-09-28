'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_eulogywriter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [person, setPerson] = React.useState('');
          const [relationship, setRelationship] = React.useState('');
          const [memories, setMemories] = React.useState('');
          const [tone, setTone] = React.useState('heartfelt and celebratory');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const write = async () => {
            if (!person.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/eulogy/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ person, relationship, memories, tone }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#94a3b8',marginBottom:'1rem'}}>🕊️ Eulogy Writer</h2>
              <p style={{color:'#64748b',marginBottom:'1.5rem'}}>Write a heartfelt eulogy that truly honors someone\'s life.</p>
              <input value={person} onChange={e=>setPerson(e.target.value)} placeholder="Person\'s name" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={relationship} onChange={e=>setRelationship(e.target.value)} placeholder="Your relationship (e.g. daughter, best friend, colleague)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={memories} onChange={e=>setMemories(e.target.value)} placeholder="Their qualities, memories, things they said or did..." style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'80px',marginBottom:'0.75rem'}} />
              <select value={tone} onChange={e=>setTone(e.target.value)} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}>
                <option value="heartfelt and celebratory">Heartfelt and celebratory</option>
                <option value="solemn and dignified">Solemn and dignified</option>
                <option value="humorous and warm">Humorous and warm</option>
                <option value="poetic and spiritual">Poetic and spiritual</option>
              </select>
              <button onClick={write} disabled={loading} style={{background:'#475569',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Writing...' : '🕊️ Write Eulogy'}
              </button>
              {result && result.eulogy && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.5rem',whiteSpace:'pre-line',color:'#e2e8f0',lineHeight:'1.8',marginBottom:'0.75rem'}}>{result.eulogy}</div>
                  {result.reading_time_mins && <p style={{color:'#64748b',fontSize:'0.85rem',textAlign:'right'}}>Reading time: ~{result.reading_time_mins} min</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_villainorigin() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [name, setName] = React.useState('');
          const [wound, setWound] = React.useState('');
          const [power, setPower] = React.useState('');
          const [goal, setGoal] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const generate = async () => {
            if (!name.trim() || !wound.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/villain/origin`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ name, wound, power, goal }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#dc2626',marginBottom:'1rem'}}>😈 Villain Origin Story</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Every villain is the hero of their own story. Write yours.</p>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Villain\'s name" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={wound} onChange={e=>setWound(e.target.value)} placeholder="Core wound or trauma (e.g. betrayed by the city they swore to protect)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'70px',marginBottom:'0.75rem'}} />
              <input value={power} onChange={e=>setPower(e.target.value)} placeholder="Power or ability (e.g. control over time, genius-level intellect)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Ultimate goal (e.g. burn the corrupt system to ashes)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}} />
              <button onClick={generate} disabled={loading} style={{background:'#991b1b',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Forging origin...' : '😈 Generate Origin Story'}
              </button>
              {result && result.origin && (
                <div style={{marginTop:'1.5rem'}}>
                  {result.title && <h3 style={{color:'#ef4444',marginBottom:'1rem',textAlign:'center'}}>{result.title}</h3>}
                  <div style={{background:'#1c0a0a',border:'1px solid #7f1d1d',borderRadius:'10px',padding:'1.5rem',whiteSpace:'pre-line',color:'#fca5a5',lineHeight:'1.8',marginBottom:'0.75rem'}}>{result.origin}</div>
                  {result.manifesto_line && <div style={{background:'#1e293b',borderRadius:'8px',padding:'0.75rem',textAlign:'center',fontStyle:'italic'}}><span style={{color:'#f87171'}}>"{result.manifesto_line}"</span></div>}
                  {result.backstory_twist && <p style={{color:'#64748b',marginTop:'0.75rem',fontSize:'0.9rem'}}>🌀 Twist: {result.backstory_twist}</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_secretadmirer() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [recipient, setRecipient] = React.useState('');
          const [feelings, setFeelings] = React.useState('');
          const [context, setContext] = React.useState('');
          const [reveal, setReveal] = React.useState('no — keep anonymous');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const write = async () => {
            if (!recipient.trim() || !feelings.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/admirer/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ recipient, feelings, context, reveal }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#f43f5e',marginBottom:'1rem'}}>💘 Secret Admirer Letter</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Poetic, mysterious, and delightfully unsettling (in the good way).</p>
              <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Their name or how you know them" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={feelings} onChange={e=>setFeelings(e.target.value)} placeholder="What do you feel? What do you notice about them that others miss?" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'80px',marginBottom:'0.75rem'}} />
              <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Context (e.g. we work in the same building, met at a coffee shop)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <select value={reveal} onChange={e=>setReveal(e.target.value)} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}>
                <option value="no — keep anonymous">Keep anonymous</option>
                <option value="yes — reveal at the end">Reveal identity at the end</option>
                <option value="leave a clue">Leave a subtle clue</option>
              </select>
              <button onClick={write} disabled={loading} style={{background:'#e11d48',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Writing...' : '💘 Write the Letter'}
              </button>
              {result && result.letter && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#1e1e2e',border:'1px solid #831843',borderRadius:'10px',padding:'1.5rem',whiteSpace:'pre-line',color:'#fda4af',lineHeight:'1.8',fontStyle:'italic',marginBottom:'0.75rem'}}>{result.letter}</div>
                  {result.ps_line && <p style={{color:'#94a3b8',marginBottom:'0.4rem'}}>P.S. {result.ps_line}</p>}
                  {result.mystery_clue && <p style={{color:'#64748b',fontSize:'0.85rem'}}>🔍 Clue: {result.mystery_clue}</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_legacyletter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [recipient, setRecipient] = React.useState('');
          const [lessons, setLessons] = React.useState('');
          const [values, setValues] = React.useState('');
          const [timeline, setTimeline] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const write = async () => {
            if (!recipient.trim() || !lessons.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/legacy/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ recipient, lessons, values, timeline }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#818cf8',marginBottom:'1rem'}}>📖 Legacy Letter</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>A letter from you to the future — wisdom they can open when they need it most.</p>
              <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Who is this for? (e.g. my daughter, my future self, my team)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={lessons} onChange={e=>setLessons(e.target.value)} placeholder="Life lessons you want to pass on..." style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'80px',marginBottom:'0.75rem'}} />
              <input value={values} onChange={e=>setValues(e.target.value)} placeholder="Core values (e.g. courage, kindness, honesty, curiosity)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={timeline} onChange={e=>setTimeline(e.target.value)} placeholder="To be opened when... (e.g. they turn 18, they face failure, they get married)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}} />
              <button onClick={write} disabled={loading} style={{background:'#4f46e5',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Writing your legacy...' : '📖 Write Legacy Letter'}
              </button>
              {result && result.letter && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#1e1b4b',border:'1px solid #4338ca',borderRadius:'10px',padding:'1.5rem',whiteSpace:'pre-line',color:'#e0e7ff',lineHeight:'1.8',marginBottom:'0.75rem'}}>{result.letter}</div>
                  {result.if_you_forget_everything_else && <div style={{background:'#1e293b',borderRadius:'8px',padding:'0.75rem',borderLeft:'3px solid #818cf8'}}><span style={{color:'#a5b4fc',fontWeight:600}}>If you forget everything else: </span><span style={{color:'#e2e8f0'}}>{result.if_you_forget_everything_else}</span></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_lovelanguage() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [behaviors, setBehaviors] = React.useState('');
          const [relationship, setRelationship] = React.useState('romantic partner');
          const [concern, setConcern] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const decode = async () => {
            if (!behaviors.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/love-language/decode`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ behaviors, relationship, concern }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const langColor: Record<string,string> = {'words of affirmation':'#f59e0b','acts of service':'#22c55e','receiving gifts':'#ec4899','quality time':'#3b82f6','physical touch':'#ef4444'};
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#f472b6',marginBottom:'1rem'}}>💞 Love Language Decoder</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Describe how they act — I\'ll decode their love language.</p>
              <textarea value={behaviors} onChange={e=>setBehaviors(e.target.value)} placeholder="How do they show love? What do they do or say? What upsets them? (e.g. always doing things for me, gets hurt when I cancel plans, gives random gifts)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'100px',marginBottom:'0.75rem'}} />
              <select value={relationship} onChange={e=>setRelationship(e.target.value)} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}>
                {['romantic partner','spouse','parent','child','friend','colleague'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
              <input value={concern} onChange={e=>setConcern(e.target.value)} placeholder="What\'s your main concern? (e.g. we keep missing each other emotionally)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}} />
              <button onClick={decode} disabled={loading} style={{background:'#db2777',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Decoding...' : '💞 Decode Their Love Language'}
              </button>
              {result && result.primary && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.25rem',marginBottom:'1rem',textAlign:'center',border:`2px solid ${langColor[result.primary.language?.toLowerCase()]||'#f472b6'}`}}>
                    <p style={{color:'#f472b6',fontSize:'1.1rem',fontWeight:600,textTransform:'capitalize'}}>Primary: {result.primary.language}</p>
                    <p style={{color:'#64748b',fontSize:'0.85rem'}}>{result.primary.confidence}% confidence</p>
                    <p style={{color:'#94a3b8',marginTop:'0.4rem',fontSize:'0.9rem'}}>{result.primary.evidence}</p>
                  </div>
                  {result.speak_their_language && <div style={{background:'#1e293b',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem'}}>
                    <h4 style={{color:'#22c55e',marginBottom:'0.5rem'}}>💡 How to speak their language</h4>
                    {result.speak_their_language.map((tip:string,i:number)=><p key={i} style={{color:'#e2e8f0',marginBottom:'0.3rem'}}>• {tip}</p>)}
                  </div>}
                  {result.insight && <div style={{background:'#1e1e2e',borderRadius:'8px',padding:'0.75rem',borderLeft:'3px solid #f472b6'}}><p style={{color:'#fda4af',fontStyle:'italic'}}>{result.insight}</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_forgeoperator() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [goal, setGoal] = React.useState('');
          const [sessionId, setSessionId] = React.useState<string|null>(null);
          const [status, setStatus] = React.useState<'idle'|'running'|'done'|'error'>('idle');
          const [plan, setPlan] = React.useState<{action:string;url?:string;instruction:string}[]>([]);
          const [planSummary, setPlanSummary] = React.useState('');
          const [steps, setSteps] = React.useState<{index:number;action:string;instruction:string;url?:string;result?:string;state:'pending'|'running'|'done'|'error'}[]>([]);
          const [thinking, setThinking] = React.useState('');
          const [finalResult, setFinalResult] = React.useState('');
          const [sessions, setSessions] = React.useState<any[]>([]);
          const [activeSession, setActiveSession] = React.useState<any>(null);
          const [loadingSession, setLoadingSession] = React.useState(false);
          const esRef = React.useRef<EventSource|null>(null);
          const logRef = React.useRef<HTMLDivElement>(null);

          const ACTION_ICONS: Record<string,string> = {
            navigate:'🌐', search:'🔍', read:'📖', analyze:'🧮', write:'✍️', summarize:'📋', default:'⚙️'
          };
          const ACTION_COLORS: Record<string,string> = {
            navigate:'#3b82f6', search:'#8b5cf6', read:'#06b6d4', analyze:'#f59e0b', write:'#10b981', summarize:'#ec4899'
          };

          React.useEffect(() => {
            fetch(`${API}/api/operator/sessions`, { headers: { Authorization:`Bearer ${tok}` } })
              .then(r=>r.json()).then(d => setSessions(d.sessions || [])).catch(()=>{});
          }, []);

          React.useEffect(() => {
            if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
          }, [steps, thinking]);

          const connectSSE = (sid: string) => {
            if (esRef.current) esRef.current.close();
            const es = new EventSource(`${API}/api/operator/stream/${sid}?token=${tok}`);
            esRef.current = es;

            es.addEventListener('thinking', (e:any) => {
              const d = JSON.parse(e.data);
              setThinking(d.message);
            });
            es.addEventListener('plan', (e:any) => {
              const d = JSON.parse(e.data);
              setPlan(d.steps || []);
              setPlanSummary(d.summary || '');
              setSteps((d.steps || []).map((s:any, i:number) => ({...s, index:i, state:'pending'})));
              setThinking('');
            });
            es.addEventListener('step_start', (e:any) => {
              const d = JSON.parse(e.data);
              setSteps(prev => prev.map((s,i) => i === d.index ? {...s, state:'running'} : s));
              setThinking(`Running: ${d.instruction}`);
            });
            es.addEventListener('step_done', (e:any) => {
              const d = JSON.parse(e.data);
              setSteps(prev => prev.map((s,i) => i === d.index ? {...s, state:'done', result:d.result, url:d.url||s.url} : s));
              setThinking('');
            });
            es.addEventListener('step_error', (e:any) => {
              const d = JSON.parse(e.data);
              setSteps(prev => prev.map((s,i) => i === d.index ? {...s, state:'error', result:d.error} : s));
            });
            es.addEventListener('complete', (e:any) => {
              const d = JSON.parse(e.data);
              setFinalResult(d.result || '');
              setStatus('done');
              setThinking('');
              es.close();
              fetch(`${API}/api/operator/sessions`, { headers: { Authorization:`Bearer ${tok}` } })
                .then(r=>r.json()).then(d2 => setSessions(d2.sessions || [])).catch(()=>{});
            });
            es.addEventListener('error', (e:any) => {
              try { const d = JSON.parse((e as any).data); setThinking(`Error: ${d.error}`); } catch {}
              setStatus('error');
            });
          };

          const run = async () => {
            if (!goal.trim() || status === 'running') return;
            setStatus('running'); setPlan([]); setPlanSummary(''); setSteps([]); setFinalResult(''); setThinking('🧠 Analyzing your goal...');
            try {
              const r = await fetch(`${API}/api/operator/run`, {
                method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${tok}`},
                body: JSON.stringify({ goal: goal.trim() })
              });
              const d = await r.json();
              if (d.sessionId) { setSessionId(d.sessionId); connectSSE(d.sessionId); }
              else { setStatus('error'); setThinking('Failed to start session'); }
            } catch (e:any) { setStatus('error'); setThinking(e.message); }
          };

          const loadSession = async (sid: string) => {
            setLoadingSession(true);
            try {
              const r = await fetch(`${API}/api/operator/session/${sid}`, { headers:{Authorization:`Bearer ${tok}`} });
              const d = await r.json();
              setActiveSession(d);
              setGoal(d.session.goal);
              setFinalResult(d.session.final_result || '');
              setStatus(d.session.status === 'done' ? 'done' : d.session.status === 'error' ? 'error' : 'idle');
              const p = JSON.parse(d.session.plan || '[]');
              setPlan(p);
              setSteps(d.steps.map((s:any) => ({
                index: s.step_index, action: s.action, instruction: s.instruction,
                url: s.url, result: s.result, state: s.status === 'done' ? 'done' : s.status === 'error' ? 'error' : 'pending'
              })));
            } finally { setLoadingSession(false); }
          };

          const EXAMPLES = [
            'Research the top 5 AI coding tools in 2025 and compare them',
            'Find the best cloud hosting options under $20/month for a Node.js app',
            'Research competitors of Notion and summarize their pricing and features',
            'Find recent news about OpenAI and summarize the key developments',
            'Research how to build a SaaS waitlist and write a step-by-step guide',
            'Find the top 10 productivity techniques and write an actionable summary',
          ];

          return (
            <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--fg-bg)'}}>
              {/* Header */}
              <div style={{padding:'20px 28px 16px', borderBottom:'1px solid var(--fg-border)', background:'var(--fg-bg2)', flexShrink:0}}>
                <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:14}}>
                  <div style={{width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0}}>🤖</div>
                  <div>
                    <h2 style={{margin:0, fontSize:20, fontWeight:800, color:'var(--fg-text)'}}>Forge Operator</h2>
                    <p style={{margin:0, fontSize:13, color:'var(--fg-text3)'}}>AI that browses, researches, writes and delivers — you watch it work in real time</p>
                  </div>
                  {status === 'running' && <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8}}>
                    <div style={{width:8, height:8, borderRadius:'50%', background:'#10b981', animation:'pulse 1s infinite'}} />
                    <span style={{fontSize:12, color:'#10b981', fontWeight:700}}>OPERATING</span>
                  </div>}
                </div>
                <div style={{display:'flex', gap:10}}>
                  <textarea
                    value={goal} onChange={e=>setGoal(e.target.value)}
                    placeholder="Give me a goal to accomplish autonomously… e.g. 'Research the best AI tools for small businesses and write a detailed comparison report'"
                    style={{flex:1, padding:'12px 14px', borderRadius:10, border:'1px solid var(--fg-border2)', background:'var(--fg-bg)', color:'var(--fg-text)', fontSize:14, resize:'none', height:64, fontFamily:'inherit', outline:'none'}}
                    onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault();run();}}}
                    disabled={status==='running'}
                  />
                  <button onClick={run} disabled={!goal.trim()||status==='running'}
                    style={{padding:'0 24px', borderRadius:10, border:'none', background: status==='running' ? 'var(--fg-bg4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:14, fontWeight:700, cursor: status==='running'?'not-allowed':'pointer', whiteSpace:'nowrap', flexShrink:0}}>
                    {status==='running' ? '⏳ Running…' : '🚀 Run'}
                  </button>
                </div>
                {status === 'idle' && !goal && (
                  <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:10}}>
                    {EXAMPLES.map((ex,i) => (
                      <button key={i} onClick={()=>setGoal(ex)}
                        style={{padding:'5px 11px', borderRadius:20, border:'1px solid var(--fg-border)', background:'var(--fg-bg3)', color:'var(--fg-text3)', fontSize:11, cursor:'pointer'}}>
                        {ex.length > 50 ? ex.slice(0,50)+'…' : ex}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Main content split */}
              <div style={{flex:1, display:'flex', overflow:'hidden'}}>
                {/* Left: Live action log */}
                <div style={{width:480, flexShrink:0, borderRight:'1px solid var(--fg-border)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                  <div style={{padding:'12px 16px', borderBottom:'1px solid var(--fg-border)', background:'var(--fg-bg2)', fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.06em'}}>
                    Live Action Log
                  </div>
                  <div ref={logRef} style={{flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8}}>
                    {status === 'idle' && steps.length === 0 && (
                      <div style={{textAlign:'center', padding:40, color:'var(--fg-text3)'}}>
                        <div style={{fontSize:48, marginBottom:12}}>🤖</div>
                        <div style={{fontSize:14, fontWeight:600}}>Ready to operate</div>
                        <div style={{fontSize:12, marginTop:4}}>Give Forge a goal and watch it work</div>
                      </div>
                    )}
                    {planSummary && (
                      <div style={{padding:'10px 14px', borderRadius:10, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', fontSize:13, color:'#a5b4fc', marginBottom:4}}>
                        📋 <strong>Plan:</strong> {planSummary}
                      </div>
                    )}
                    {thinking && (
                      <div style={{display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)'}}>
                        <div style={{width:8, height:8, borderRadius:'50%', background:'#f59e0b', marginTop:4, flexShrink:0, animation:'pulse 1s infinite'}} />
                        <span style={{fontSize:13, color:'#fbbf24', fontStyle:'italic'}}>{thinking}</span>
                      </div>
                    )}
                    {steps.map((s, i) => {
                      const icon = ACTION_ICONS[s.action] || ACTION_ICONS.default;
                      const color = ACTION_COLORS[s.action] || '#64748b';
                      const isRunning = s.state === 'running';
                      const isDone = s.state === 'done';
                      const isError = s.state === 'error';
                      return (
                        <div key={i} style={{borderRadius:10, border:`1px solid ${isRunning?color:isDone?'var(--fg-border)':isError?'#ef4444':'var(--fg-border)'}`, background: isRunning?`${color}10`:'var(--fg-bg2)', overflow:'hidden', transition:'all 0.2s'}}>
                          <div style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px'}}>
                            <span style={{fontSize:16}}>{icon}</span>
                            <div style={{flex:1}}>
                              <div style={{fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.05em'}}>{s.action}</div>
                              <div style={{fontSize:13, color:'var(--fg-text2)', marginTop:1}}>{s.instruction}</div>
                              {s.url && <div style={{fontSize:11, color:'var(--fg-text3)', marginTop:2, wordBreak:'break-all'}}>{s.url}</div>}
                            </div>
                            <div style={{flexShrink:0}}>
                              {isRunning && <div style={{width:16, height:16, border:'2px solid '+color, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite'}} />}
                              {isDone && <span style={{color:'#10b981', fontSize:16}}>✓</span>}
                              {isError && <span style={{color:'#ef4444', fontSize:16}}>✗</span>}
                              {s.state==='pending' && <span style={{color:'var(--fg-text3)', fontSize:11}}>#{i+1}</span>}
                            </div>
                          </div>
                          {(isDone||isError) && s.result && (
                            <div style={{padding:'8px 14px 12px', borderTop:'1px solid var(--fg-border)', fontSize:12, color: isError?'#ef4444':'var(--fg-text3)', maxHeight:120, overflowY:'auto', lineHeight:1.5}}>
                              {s.result.slice(0, 400)}{s.result.length > 400 ? '…' : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {status === 'done' && (
                      <div style={{padding:'10px 14px', borderRadius:10, background:'rgba(16,185,129,0.08)', border:'1px solid #10b981', fontSize:13, color:'#34d399', fontWeight:600, textAlign:'center'}}>
                        ✅ Task complete
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Result panel + history */}
                <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
                  {finalResult ? (
                    <div style={{flex:1, overflowY:'auto', padding:24}}>
                      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:16}}>
                        <span style={{fontSize:20}}>📄</span>
                        <h3 style={{margin:0, fontSize:16, fontWeight:800, color:'var(--fg-text)'}}>Final Deliverable</h3>
                        <button onClick={()=>navigator.clipboard.writeText(finalResult)}
                          style={{marginLeft:'auto', padding:'5px 12px', borderRadius:8, border:'1px solid var(--fg-border)', background:'var(--fg-bg3)', color:'var(--fg-text3)', fontSize:11, cursor:'pointer'}}>
                          📋 Copy
                        </button>
                      </div>
                      <div style={{padding:20, borderRadius:12, background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', fontSize:14, color:'var(--fg-text2)', lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'inherit'}}>
                        {finalResult}
                      </div>
                      <button onClick={()=>{setGoal('');setStatus('idle');setSteps([]);setFinalResult('');setPlan([]);setPlanSummary('');setThinking('');setSessionId(null);}}
                        style={{marginTop:16, padding:'10px 20px', borderRadius:10, border:'1px solid var(--fg-border)', background:'var(--fg-bg3)', color:'var(--fg-text2)', fontSize:13, cursor:'pointer', fontWeight:600}}>
                        + New Task
                      </button>
                    </div>
                  ) : (
                    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
                      <div style={{padding:'12px 16px', borderBottom:'1px solid var(--fg-border)', background:'var(--fg-bg2)', fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.06em'}}>
                        Session History
                      </div>
                      <div style={{flex:1, overflowY:'auto', padding:16}}>
                        {sessions.length === 0 && (
                          <div style={{textAlign:'center', padding:40, color:'var(--fg-text3)', fontSize:13}}>No sessions yet — run your first task!</div>
                        )}
                        {sessions.map((s:any) => (
                          <div key={s.id} onClick={()=>loadSession(s.id)}
                            style={{padding:'12px 16px', borderRadius:10, border:'1px solid var(--fg-border)', background:'var(--fg-bg2)', marginBottom:8, cursor:'pointer', transition:'all 0.15s'}}
                            onMouseEnter={e=>(e.currentTarget.style.borderColor='#6366f1')}
                            onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--fg-border)')}>
                            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                              <span style={{fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background: s.status==='done'?'rgba(16,185,129,0.15)':s.status==='error'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)', color: s.status==='done'?'#10b981':s.status==='error'?'#ef4444':'#f59e0b'}}>
                                {s.status.toUpperCase()}
                              </span>
                              <span style={{fontSize:11, color:'var(--fg-text3)', marginLeft:'auto'}}>{s.created_at?.slice(0,16)}</span>
                            </div>
                            <div style={{fontSize:13, fontWeight:600, color:'var(--fg-text)', marginBottom:3}}>{s.goal.slice(0,80)}{s.goal.length>80?'…':''}</div>
                            {s.summary_preview && <div style={{fontSize:11, color:'var(--fg-text3)'}}>{s.summary_preview}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
}

export function ForgeTab_passport() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [pp, setPp] = React.useState<any>(null);
          const [ppLoad, setPpLoad] = React.useState(true);
          const [ppEdit, setPpEdit] = React.useState(false);
          const [ppForm, setPpForm] = React.useState<any>({});
          const [ppMsg, setPpMsg] = React.useState('');
          const SECTORS = ['General Business','Law & Legal','Healthcare','Restaurant & Food','Agency & Marketing','Real Estate','Finance & Accounting','Trades & Construction','E-commerce','SaaS & Tech','Education','Consulting'];
          const PERSONALITIES = ['professional','friendly','direct','creative','analytical','empathetic'];
          const ICONS = ['🤖','💼','⚡','🧠','🎯','🚀','💡','🔥','✨','🦾','🌟','👑'];
          const COLORS = ['#ff1f35','#6366f1','#059669','#f59e0b','#0ea5e9','#8b5cf6','#ec4899','#14b8a6'];
          React.useEffect(() => {
            fetch(`${API}/api/passport`, { headers: { Authorization: `Bearer ${tok}` } })
              .then(r => r.json()).then(d => { setPp(d.data); setPpForm(d.data || {}); setPpLoad(false); }).catch(() => setPpLoad(false));
          }, []);
          const save = async () => {
            await fetch(`${API}/api/passport`, { method:'PATCH', headers:{ Authorization:`Bearer ${tok}`, 'Content-Type':'application/json' }, body: JSON.stringify(ppForm) });
            setPpMsg('✅ Saved'); setPpEdit(false);
            fetch(`${API}/api/passport`, { headers: { Authorization: `Bearer ${tok}` } }).then(r=>r.json()).then(d=>setPp(d.data));
            setTimeout(() => setPpMsg(''), 2500);
          };
          const togglePublic = async () => {
            const val = !pp?.is_public;
            await fetch(`${API}/api/passport`, { method:'PATCH', headers:{ Authorization:`Bearer ${tok}`, 'Content-Type':'application/json' }, body: JSON.stringify({ is_public: val }) });
            setPp((p: any) => ({ ...p, is_public: val }));
          };
          if (ppLoad) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--fg-text3)' }}>Loading passport…</div>;
          const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
          const shareUrl = pp?.is_public ? `${API}/api/passport/public/${pp.public_slug}` : '';
          return (
          <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
            <div style={{ maxWidth:760, margin:'0 auto' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
                <span style={{ fontSize:36 }}>🪪</span>
                <div>
                  <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'var(--fg-text)' }}>Agent Passport</h1>
                  <p style={{ margin:0, fontSize:13, color:'var(--fg-text3)' }}>Your AI Twin — certified, benchmarked, shareable.</p>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  {ppMsg && <span style={{ fontSize:12, color:'#10b981', padding:'6px 10px' }}>{ppMsg}</span>}
                  <button onClick={() => { setPpEdit(!ppEdit); setPpForm(pp || {}); }} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--fg-border)', background: ppEdit ? '#ff1f35' : 'var(--fg-bg2)', color: ppEdit ? '#fff' : 'var(--fg-text2)', cursor:'pointer', fontSize:12 }}>{ppEdit ? '✕ Cancel' : '✏️ Edit'}</button>
                  {ppEdit && <button onClick={save} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#10b981', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>💾 Save</button>}
                </div>
              </div>

              {/* Passport Card */}
              <div style={{ borderRadius:20, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.25)', marginBottom:24 }}>
                {/* Card Header */}
                <div style={{ background: ppEdit ? (ppForm.cover_color || '#ff1f35') : (pp?.cover_color || '#ff1f35'), padding:'28px 28px 20px', position:'relative' }}>
                  <div style={{ position:'absolute', top:12, right:16, fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'rgba(255,255,255,0.6)', textTransform:'uppercase' }}>FORGE AI PASSPORT • v{pp?.version || 1}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ width:72, height:72, borderRadius:16, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, border:'2px solid rgba(255,255,255,0.3)' }}>
                      {ppEdit ? (
                        <select value={ppForm.icon || '🤖'} onChange={e => setPpForm((f: any) => ({ ...f, icon: e.target.value }))} style={{ background:'transparent', border:'none', fontSize:28, cursor:'pointer' }}>
                          {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                        </select>
                      ) : (pp?.icon || '🤖')}
                    </div>
                    <div style={{ flex:1 }}>
                      {ppEdit ? (
                        <input value={ppForm.twin_name || ''} onChange={e => setPpForm((f: any) => ({ ...f, twin_name: e.target.value }))} placeholder="Twin name…" style={{ fontSize:22, fontWeight:800, color:'#fff', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'4px 10px', width:'100%' }} />
                      ) : (
                        <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{pp?.twin_name || 'My AI Twin'}</div>
                      )}
                      {ppEdit ? (
                        <select value={ppForm.sector || 'General Business'} onChange={e => setPpForm((f: any) => ({ ...f, sector: e.target.value }))} style={{ marginTop:4, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, color:'rgba(255,255,255,0.9)', padding:'3px 8px', fontSize:12 }}>
                          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:3 }}>📍 {pp?.sector || 'General Business'}</div>
                      )}
                    </div>
                    {/* Benchmark score ring */}
                    <div style={{ textAlign:'center' }}>
                      <div style={{ width:64, height:64, borderRadius:'50%', background:`conic-gradient(${scoreColor(pp?.benchmark_score || 0)} ${(pp?.benchmark_score || 0) * 3.6}deg, rgba(255,255,255,0.1) 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid rgba(255,255,255,0.2)' }}>
                        <div style={{ width:48, height:48, borderRadius:'50%', background:(pp?.cover_color || '#ff1f35'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#fff' }}>{Math.round(pp?.benchmark_score || 0)}</div>
                      </div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.1em' }}>Score</div>
                    </div>
                  </div>
                  {ppEdit && (
                    <div style={{ marginTop:12, display:'flex', gap:6, flexWrap:'wrap' }}>
                      {COLORS.map(c => <button key={c} onClick={() => setPpForm((f: any) => ({ ...f, cover_color: c }))} style={{ width:24, height:24, borderRadius:'50%', background:c, border: ppForm.cover_color === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)', cursor:'pointer' }} />)}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ background:'var(--fg-bg2)', padding:'20px 28px', borderTop:'1px solid var(--fg-border)' }}>
                  {/* Stats row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                    {[
                      { label:'Tasks Done', value: (pp?.tasks_completed || 0).toLocaleString(), icon:'✅' },
                      { label:'Words Gen.', value: pp?.words_generated >= 1000 ? `${((pp.words_generated||0)/1000).toFixed(1)}k` : (pp?.words_generated || 0), icon:'✍️' },
                      { label:'Hours Saved', value: `${(pp?.hours_saved || 0).toFixed(1)}h`, icon:'⏱️' },
                      { label:'Top Skill', value: pp?.top_skill || 'TBD', icon:'🏆' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign:'center', padding:'12px 8px', background:'var(--fg-bg3)', borderRadius:10, border:'1px solid var(--fg-border)' }}>
                        <div style={{ fontSize:20 }}>{s.icon}</div>
                        <div style={{ fontSize:15, fontWeight:700, color:'var(--fg-text)', marginTop:4 }}>{s.value}</div>
                        <div style={{ fontSize:10, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Specialties */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Specialties</div>
                    {ppEdit ? (
                      <input value={Array.isArray(ppForm.specialties) ? ppForm.specialties.join(', ') : (ppForm.specialties || '')} onChange={e => setPpForm((f: any) => ({ ...f, specialties: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))} placeholder="Sales, Content, Legal, Finance…" style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid var(--fg-border)', background:'var(--fg-bg)', color:'var(--fg-text)', fontSize:13 }} />
                    ) : (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {(pp?.specialties || []).length ? (pp.specialties as string[]).map((sp: string) => (
                          <span key={sp} style={{ padding:'4px 10px', borderRadius:20, background:'rgba(255,31,53,0.12)', color:'#ff1f35', fontSize:12, fontWeight:600 }}>{sp}</span>
                        )) : <span style={{ fontSize:13, color:'var(--fg-text3)' }}>No specialties set — edit to add.</span>}
                      </div>
                    )}
                  </div>

                  {/* Personality */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Personality</div>
                    {ppEdit ? (
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {PERSONALITIES.map(p => <button key={p} onClick={() => setPpForm((f: any) => ({ ...f, personality: p }))} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${ppForm.personality===p ? '#ff1f35' : 'var(--fg-border)'}`, background: ppForm.personality===p ? 'rgba(255,31,53,0.12)' : 'var(--fg-bg)', color: ppForm.personality===p ? '#ff1f35' : 'var(--fg-text2)', cursor:'pointer', fontSize:12, textTransform:'capitalize' }}>{p}</button>)}
                      </div>
                    ) : (
                      <span style={{ padding:'5px 14px', borderRadius:20, background:'rgba(255,31,53,0.12)', color:'#ff1f35', fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{pp?.personality || 'professional'}</span>
                    )}
                  </div>

                  {/* System prompt */}
                  {ppEdit && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>System Prompt (Core Identity)</div>
                      <textarea value={ppForm.system_prompt || ''} onChange={e => setPpForm((f: any) => ({ ...f, system_prompt: e.target.value }))} placeholder="You are an expert AI twin specialized in…" rows={4} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--fg-border)', background:'var(--fg-bg)', color:'var(--fg-text)', fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
                    </div>
                  )}

                  {/* Benchmarks */}
                  {pp?.benchmarks?.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Benchmark History</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {(pp.benchmarks as any[]).slice(0,5).map((b: any, i: number) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--fg-bg3)', borderRadius:8 }}>
                            <span style={{ fontSize:12, color:'var(--fg-text3)', width:80, flexShrink:0 }}>{b.category}</span>
                            <div style={{ flex:1, height:6, background:'var(--fg-bg)', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ width:`${b.score}%`, height:'100%', background: scoreColor(b.score), borderRadius:3, transition:'width 0.5s' }} />
                            </div>
                            <span style={{ fontSize:12, fontWeight:700, color: scoreColor(b.score), width:32, textAlign:'right' }}>{Math.round(b.score)}</span>
                            <span style={{ fontSize:11, color:'var(--fg-text3)', width:90, flexShrink:0, textAlign:'right' }}>{b.model?.split('/').pop()?.slice(0,12)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div style={{ background:'var(--fg-bg3)', padding:'12px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid var(--fg-border)' }}>
                  <div style={{ fontSize:11, color:'var(--fg-text3)' }}>ID: {pp?.id?.slice(0,16)}… • Last active: {pp?.last_active?.slice(0,10)}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={togglePublic} style={{ padding:'5px 12px', borderRadius:6, border:'1px solid var(--fg-border)', background: pp?.is_public ? 'rgba(16,185,129,0.12)' : 'var(--fg-bg)', color: pp?.is_public ? '#10b981' : 'var(--fg-text3)', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                      {pp?.is_public ? '🌐 Public' : '🔒 Private'}
                    </button>
                    {pp?.is_public && shareUrl && (
                      <button onClick={() => { navigator.clipboard.writeText(shareUrl); setPpMsg('📋 Link copied!'); setTimeout(() => setPpMsg(''), 2000); }} style={{ padding:'5px 12px', borderRadius:6, border:'1px solid var(--fg-border)', background:'var(--fg-bg)', color:'var(--fg-text2)', cursor:'pointer', fontSize:11 }}>📋 Copy Link</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sector coverage hint */}
              <div style={{ padding:'16px 20px', borderRadius:12, background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', fontSize:13, color:'var(--fg-text2)' }}>
                <strong style={{ color:'var(--fg-text)' }}>🌍 Every sector, every professional.</strong> Your AI Twin works 24/7 in your industry — from law firms to restaurants, agencies to healthcare. Run a benchmark to score your twin and unlock a shareable profile card.
              </div>
            </div>
          </div>
          );
}

export function ForgeTab_symptomcheck() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [symptoms, setSymptoms] = React.useState('');
          const [duration, setDuration] = React.useState('');
          const [age, setAge] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#f87171',marginBottom:4}}>🩺 Symptom Checker</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>AI health info triage — not a medical diagnosis. Always see a doctor.</p>
              <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="Describe your symptoms in detail..." rows={4} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duration (e.g. 3 days)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={age} onChange={e=>setAge(e.target.value)} placeholder="Age (optional)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <button onClick={async()=>{if(!symptoms.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/symptom-check/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({symptoms,duration,age})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Analyzing...':'Check Symptoms'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:result.urgency==='emergency'?'#7f1d1d':result.urgency==='urgent'?'#78350f':result.urgency==='soon'?'#1e3a5f':'#14532d',border:`1px solid ${result.urgency==='emergency'?'#ef4444':result.urgency==='urgent'?'#f59e0b':'#3b82f6'}`,borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                  <div style={{fontSize:18,fontWeight:700,color:'#fff',marginBottom:4}}>Urgency: {result.urgency?.toUpperCase()}</div>
                  <div style={{color:'#cbd5e1',fontSize:14}}>{result.urgency_reason}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}>
                    <div style={{color:'#f87171',fontWeight:600,marginBottom:8}}>Possible Explanations</div>
                    {(result.possible_explanations||[]).map((e:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}>• {e}</div>)}
                  </div>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}>
                    <div style={{color:'#fb923c',fontWeight:600,marginBottom:8}}>Immediate Actions</div>
                    {(result.immediate_actions||[]).map((a:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}>→ {a}</div>)}
                  </div>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}>
                    <div style={{color:'#facc15',fontWeight:600,marginBottom:8}}>See Doctor If...</div>
                    {(result.see_doctor_if||[]).map((s:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}>⚠ {s}</div>)}
                  </div>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}>
                    <div style={{color:'#4ade80',fontWeight:600,marginBottom:8}}>Home Care Tips</div>
                    {(result.home_care_tips||[]).map((t:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}>✓ {t}</div>)}
                  </div>
                </div>
                <div style={{background:'#0f172a',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginTop:'1rem',color:'#64748b',fontSize:12}}>{result.disclaimer}</div>
              </div>)}
            </div>
          );
}

export function ForgeTab_sleepopt() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [issues, setIssues] = React.useState('');
          const [schedule, setSchedule] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#818cf8',marginBottom:4}}>😴 Sleep Optimizer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Get a personalized sleep protocol based on your issues and lifestyle.</p>
              <textarea value={issues} onChange={e=>setIssues(e.target.value)} placeholder="What are your sleep issues? (e.g. can\'t fall asleep, wake up at 3am, feel groggy...)" rows={3} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <input value={schedule} onChange={e=>setSchedule(e.target.value)} placeholder="Current schedule (e.g. need to wake at 7am, usually sleep around midnight)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <button onClick={async()=>{if(!issues.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/sleep/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({sleep_issues:issues,current_schedule:schedule})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Optimizing...':'Get Sleep Protocol'}</button>
              {result&&!result.error&&(<div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',textAlign:'center'}}>
                    <div style={{color:'#818cf8',fontSize:13}}>Ideal Bedtime</div>
                    <div style={{color:'#fff',fontSize:24,fontWeight:700}}>{result.ideal_bedtime}</div>
                  </div>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',textAlign:'center'}}>
                    <div style={{color:'#818cf8',fontSize:13}}>Ideal Wake Time</div>
                    <div style={{color:'#fff',fontSize:24,fontWeight:700}}>{result.ideal_wake_time}</div>
                  </div>
                </div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}>
                  <div style={{color:'#c4b5fd',fontWeight:600,marginBottom:8}}>Wind-Down Routine</div>
                  {(result.wind_down_routine||[]).map((s:any,i:number)=><div key={i} style={{display:'flex',gap:'1rem',marginBottom:6}}><span style={{color:'#818cf8',fontSize:12,minWidth:90}}>{s.time}</span><span style={{color:'#cbd5e1',fontSize:13}}>{s.action}</span></div>)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}>
                    <div style={{color:'#4ade80',fontWeight:600,marginBottom:8}}>Morning Routine</div>
                    {(result.morning_routine||[]).map((m:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}>☀ {m}</div>)}
                  </div>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}>
                    <div style={{color:'#f87171',fontWeight:600,marginBottom:8}}>Avoid</div>
                    {(result.avoid||[]).map((a:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}>✗ {a}</div>)}
                  </div>
                </div>
                <div style={{background:'#0f172a',border:'1px solid #6366f1',borderRadius:8,padding:'0.75rem',marginTop:'1rem',color:'#94a3b8',fontSize:13}}>⏱ {result.timeline}</div>
              </div>)}
            </div>
          );
}

export function ForgeTab_stressdecode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [desc, setDesc] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#fb923c',marginBottom:4}}>😤 Stress Decoder</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Understand your stress and get an actionable coping toolkit.</p>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Describe what\'s stressing you out — work, relationships, finances, health, everything..." rows={5} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <button onClick={async()=>{if(!desc.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/stress/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({stress_description:desc})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#f97316',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Decoding...':'Decode My Stress'}</button>
              {result&&!result.error&&(<div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',textAlign:'center'}}>
                    <div style={{color:'#94a3b8',fontSize:12}}>Stress Type</div>
                    <div style={{color:'#fb923c',fontWeight:700,fontSize:14,marginTop:4}}>{result.stress_type}</div>
                  </div>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',textAlign:'center'}}>
                    <div style={{color:'#94a3b8',fontSize:12}}>Stress Score</div>
                    <div style={{color:result.stress_score>=8?'#ef4444':result.stress_score>=5?'#f59e0b':'#4ade80',fontWeight:700,fontSize:28}}>{result.stress_score}/10</div>
                  </div>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',textAlign:'center'}}>
                    <div style={{color:'#94a3b8',fontSize:12}}>This Week</div>
                    <div style={{color:'#c4b5fd',fontWeight:600,fontSize:12,marginTop:4}}>{result.this_week_action}</div>
                  </div>
                </div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}>
                  <div style={{color:'#fb923c',fontWeight:600,marginBottom:8}}>Coping Toolkit</div>
                  {(result.coping_toolkit||[]).map((t:any,i:number)=><div key={i} style={{background:'#0f172a',borderRadius:8,padding:'0.75rem',marginBottom:6}}><div style={{color:'#e2e8f0',fontWeight:600,fontSize:13}}>{t.technique} <span style={{color:'#64748b',fontWeight:400}}>({t.time_needed})</span></div><div style={{color:'#94a3b8',fontSize:12,marginTop:2}}>{t.how_to}</div></div>)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}><div style={{color:'#f59e0b',fontWeight:600,marginBottom:6}}>Boundary to Set</div><div style={{color:'#cbd5e1',fontSize:13}}>{result.boundary_to_set}</div></div>
                  <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}><div style={{color:'#818cf8',fontWeight:600,marginBottom:6}}>Reframe</div><div style={{color:'#cbd5e1',fontSize:13}}>{result.reframe}</div></div>
                </div>
              </div>)}
            </div>
          );
}

export function ForgeTab_workoutgen() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [goal, setGoal] = React.useState('');
          const [equipment, setEquipment] = React.useState('bodyweight only');
          const [time, setTime] = React.useState('45');
          const [level, setLevel] = React.useState('intermediate');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#4ade80',marginBottom:4}}>💪 Workout Generator</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Get a complete custom workout plan in seconds.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Goal (e.g. lose fat, build muscle)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={equipment} onChange={e=>setEquipment(e.target.value)} placeholder="Equipment available" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <select value={time} onChange={e=>setTime(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['20','30','45','60','90'].map(t=><option key={t} value={t}>{t} min</option>)}
                </select>
                <select value={level} onChange={e=>setLevel(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['beginner','intermediate','advanced'].map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!goal.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/workout/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({goal,equipment,time_available:`${time} minutes`,fitness_level:level})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#22c55e',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Building Workout...':'Generate Workout'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#14532d',border:'1px solid #22c55e',borderRadius:10,padding:'1rem',marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{color:'#4ade80',fontWeight:700,fontSize:18}}>{result.workout_name}</div><div style={{color:'#86efac',fontSize:13}}>{result.duration} • ~{result.calories_estimate}</div></div>
                </div>
                {['warmup','main_workout','cooldown'].map(phase=><div key={phase} style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'0.75rem'}}>
                  <div style={{color:phase==='warmup'?'#fbbf24':phase==='main_workout'?'#4ade80':'#818cf8',fontWeight:600,marginBottom:8,textTransform:'capitalize'}}>{phase.replace('_',' ')}</div>
                  {(result[phase]||[]).map((ex:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid #0f172a'}}><div><div style={{color:'#e2e8f0',fontSize:13,fontWeight:600}}>{ex.exercise}</div><div style={{color:'#64748b',fontSize:11}}>{ex.notes}</div></div><div style={{color:'#94a3b8',fontSize:12,textAlign:'right'}}>{ex.sets?`${ex.sets}x${ex.reps}`:ex.duration}{ex.rest?` / ${ex.rest}s rest`:''}</div></div>)}
                </div>)}
                <div style={{background:'#0f172a',border:'1px solid #22c55e',borderRadius:8,padding:'0.75rem',color:'#86efac',fontSize:13}}>💡 {result.pro_tip}</div>
              </div>)}
            </div>
          );
}

export function ForgeTab_nutricoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [goal, setGoal] = React.useState('');
          const [restrictions, setRestrictions] = React.useState('');
          const [calories, setCalories] = React.useState('2000');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#34d399',marginBottom:4}}>🥗 Nutrition Coach</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Get a personalized meal plan with macros, recipes & grocery list.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Goal (e.g. lose weight, build muscle)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={restrictions} onChange={e=>setRestrictions(e.target.value)} placeholder="Dietary restrictions (or 'none')" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={calories} onChange={e=>setCalories(e.target.value)} placeholder="Daily calorie target" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <button onClick={async()=>{if(!goal.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/nutrition/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({goal,dietary_restrictions:restrictions,calories_target:calories})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#10b981',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Building Plan...':'Generate Meal Plan'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#064e3b',border:'1px solid #10b981',borderRadius:10,padding:'1rem',marginBottom:'1rem',display:'flex',gap:'2rem',justifyContent:'center'}}>
                  {[['Calories',result.daily_calories+'kcal'],['Protein',result.macros?.protein],['Carbs',result.macros?.carbs],['Fat',result.macros?.fat]].map(([k,v])=><div key={k as string} style={{textAlign:'center'}}><div style={{color:'#6ee7b7',fontSize:12}}>{k}</div><div style={{color:'#fff',fontWeight:700,fontSize:16}}>{v}</div></div>)}
                </div>
                {(['breakfast','lunch','dinner','snack'] as const).map(meal=>{const m=result.meal_plan?.[meal];if(!m)return null;return(<div key={meal} style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'0.75rem'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><div style={{color:'#34d399',fontWeight:700,textTransform:'capitalize'}}>{meal}: {m.name}</div><div style={{color:'#64748b',fontSize:12}}>{m.calories} cal • {m.protein} protein{m.prep_time?` • ${m.prep_time}`:''}</div></div>{m.recipe&&<div style={{color:'#94a3b8',fontSize:12}}>{m.recipe}</div>}</div>);})}
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'0.75rem'}}>
                  <div style={{color:'#34d399',fontWeight:600,marginBottom:8}}>🛒 Grocery List</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{(result.grocery_list||[]).map((item:string,i:number)=><span key={i} style={{background:'#0f172a',color:'#94a3b8',borderRadius:20,padding:'2px 10px',fontSize:12}}>{item}</span>)}</div>
                </div>
                <div style={{background:'#0f172a',border:'1px solid #10b981',borderRadius:8,padding:'0.75rem',color:'#86efac',fontSize:13}}>💡 {result.meal_prep_tip}</div>
              </div>)}
            </div>
          );
}

export function ForgeTab_willgen() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [name, setName] = React.useState('');
          const [state, setState] = React.useState('');
          const [assets, setAssets] = React.useState('');
          const [beneficiaries, setBeneficiaries] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#fbbf24',marginBottom:4}}>📜 Will Generator</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>AI-drafted will outline. You MUST consult a licensed attorney to finalize.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full legal name" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={state} onChange={e=>setState(e.target.value)} placeholder="State (e.g. California)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <textarea value={assets} onChange={e=>setAssets(e.target.value)} placeholder="Assets (e.g. house at 123 Main St, savings account ~$50k, car 2020 Toyota, investment account ~$100k)" rows={3} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <textarea value={beneficiaries} onChange={e=>setBeneficiaries(e.target.value)} placeholder="Beneficiaries (e.g. spouse Jane Doe 60%, daughter Emily Doe 40%)" rows={2} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <button onClick={async()=>{if(!name.trim()||!assets.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/will/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({full_name:name,state,assets,beneficiaries})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#d97706',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Drafting...':'Generate Will Outline'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                  <div style={{color:'#fbbf24',fontWeight:700,marginBottom:12}}>Will Outline — {name}</div>
                  <div style={{color:'#94a3b8',fontSize:13,marginBottom:12,fontStyle:'italic'}}>{result.will_outline?.declaration}</div>
                  <div style={{color:'#e2e8f0',fontWeight:600,marginBottom:8}}>Asset Distribution</div>
                  {(result.will_outline?.asset_distribution||[]).map((a:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid #0f172a'}}><span style={{color:'#cbd5e1',fontSize:13}}>{a.asset}</span><span style={{color:'#fbbf24',fontSize:13}}>{a.beneficiary} — {a.percentage_or_amount}</span></div>)}
                </div>
                {result.missing_info?.length>0&&<div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}><div style={{color:'#f87171',fontWeight:600,marginBottom:8}}>Still Needed</div>{result.missing_info.map((m:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}>• {m}</div>)}</div>}
                <div style={{background:'#0f172a',border:'1px solid #d97706',borderRadius:8,padding:'0.75rem',color:'#fbbf24',fontSize:12}}>{result.disclaimer}</div>
              </div>)}
            </div>
          );
}

export function ForgeTab_leaseanalyze() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [leaseText, setLeaseText] = React.useState('');
          const [rent, setRent] = React.useState('');
          const [state, setState] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#60a5fa',marginBottom:4}}>🏠 Lease Analyzer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Paste your lease and get a red-flag analysis with negotiation tips.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={rent} onChange={e=>setRent(e.target.value)} placeholder="Monthly rent ($)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={state} onChange={e=>setState(e.target.value)} placeholder="State" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <textarea value={leaseText} onChange={e=>setLeaseText(e.target.value)} placeholder="Paste lease text here (or key sections)..." rows={8} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <button onClick={async()=>{if(!leaseText.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/lease/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({lease_text:leaseText,monthly_rent:rent,state})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Analyzing...':'Analyze Lease'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:result.verdict==='avoid'?'#7f1d1d':result.verdict==='negotiate'?'#78350f':'#14532d',border:'1px solid #3b82f6',borderRadius:10,padding:'1rem',marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{color:'#fff',fontWeight:700,fontSize:18}}>Verdict: {result.verdict?.toUpperCase()}</div><div style={{color:'#93c5fd',fontSize:13}}>Risk Score: {result.risk_score}/10 ({result.overall_risk} risk)</div></div>
                </div>
                {(result.red_flags||[]).map((f:any,i:number)=><div key={i} style={{background:'#1e293b',borderRadius:8,padding:'0.75rem',marginBottom:6,borderLeft:`3px solid ${f.severity==='high'?'#ef4444':f.severity==='medium'?'#f59e0b':'#4ade80'}`}}><div style={{color:'#e2e8f0',fontWeight:600,fontSize:13}}>{f.clause}</div><div style={{color:'#94a3b8',fontSize:12,marginTop:2}}>{f.issue}</div></div>)}
                {result.negotiate_these?.length>0&&<div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginTop:'1rem'}}><div style={{color:'#fbbf24',fontWeight:600,marginBottom:8}}>Negotiate These</div>{result.negotiate_these.map((n:any,i:number)=><div key={i} style={{marginBottom:8}}><div style={{color:'#e2e8f0',fontSize:13,fontWeight:600}}>{n.item}</div><div style={{color:'#94a3b8',fontSize:12}}>→ {n.suggested_change}</div></div>)}</div>}
              </div>)}
            </div>
          );
}

export function ForgeTab_disputeletter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [company, setCompany] = React.useState('');
          const [amount, setAmount] = React.useState('');
          const [description, setDescription] = React.useState('');
          const [outcome, setOutcome] = React.useState('full refund');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#f87171',marginBottom:4}}>⚔️ Dispute Letter Generator</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Professional dispute letters for bills, charges, services — ready to send.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount disputed ($)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What happened? Be specific — dates, what was promised vs delivered, attempts to resolve..." rows={4} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <input value={outcome} onChange={e=>setOutcome(e.target.value)} placeholder="Desired outcome (e.g. full refund, charge reversal)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <button onClick={async()=>{if(!company.trim()||!description.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/dispute/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({company,amount,description,desired_outcome:outcome})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Writing...':'Generate Dispute Letter'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div style={{color:'#f87171',fontWeight:700}}>Subject: {result.subject_line}</div><button onClick={()=>{navigator.clipboard.writeText(result.letter);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:'#334155',color:'#e2e8f0',border:'none',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:12}}>{copied?'Copied!':'Copy'}</button></div>
                  <pre style={{color:'#cbd5e1',fontSize:12,whiteSpace:'pre-wrap',fontFamily:'inherit',lineHeight:1.6}}>{result.letter}</pre>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:8,padding:'0.75rem'}}><div style={{color:'#fbbf24',fontSize:12,fontWeight:600}}>Follow Up</div><div style={{color:'#cbd5e1',fontSize:12,marginTop:4}}>{result.follow_up_timeline}</div></div>
                  <div style={{background:'#1e293b',borderRadius:8,padding:'0.75rem'}}><div style={{color:'#60a5fa',fontSize:12,fontWeight:600}}>Escalation</div><div style={{color:'#cbd5e1',fontSize:12,marginTop:4}}>{result.escalation_path}</div></div>
                </div>
              </div>)}
            </div>
          );
}

export function ForgeTab_tosdecode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [tosText, setTosText] = React.useState('');
          const [service, setService] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#a78bfa',marginBottom:4}}>🔍 TOS Decoder</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Paste any Terms of Service and get plain-English translation with red flags.</p>
              <input value={service} onChange={e=>setService(e.target.value)} placeholder="Service name (e.g. Spotify, LinkedIn)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <textarea value={tosText} onChange={e=>setTosText(e.target.value)} placeholder="Paste Terms of Service text here..." rows={8} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <button onClick={async()=>{if(!tosText.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/tos/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({tos_text:tosText,service_name:service})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Decoding...':'Decode TOS'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:result.verdict==='concerning'?'#7f1d1d':result.verdict==='caution'?'#78350f':'#14532d',border:'1px solid #7c3aed',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}>
                  <div style={{color:'#fff',fontWeight:700,fontSize:16}}>Verdict: {result.verdict?.toUpperCase()}</div>
                  <div style={{color:'#c4b5fd',fontSize:13,marginTop:4}}>{result.tldr}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                  {[['Data Collection',result.data_collection,'#f87171'],['Data Sharing',result.data_sharing,'#fb923c'],['Your Rights',result.your_rights,'#4ade80'],['Their Rights',result.their_rights,'#facc15']].map(([k,v,c])=><div key={k as string} style={{background:'#1e293b',borderRadius:8,padding:'0.75rem'}}><div style={{color:c as string,fontSize:12,fontWeight:600,marginBottom:4}}>{k}</div><div style={{color:'#cbd5e1',fontSize:12}}>{v as string}</div></div>)}
                </div>
                {(result.red_flags||[]).map((f:any,i:number)=><div key={i} style={{background:'#1e293b',borderRadius:8,padding:'0.75rem',marginBottom:6,borderLeft:`3px solid ${f.severity==='high'?'#ef4444':f.severity==='medium'?'#f59e0b':'#4ade80'}`}}><div style={{color:'#e2e8f0',fontWeight:600,fontSize:13}}>{f.section}</div><div style={{color:'#94a3b8',fontSize:12,marginTop:2}}>{f.issue}</div></div>)}
              </div>)}
            </div>
          );
}

export function ForgeTab_foiarequest() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [agency, setAgency] = React.useState('');
          const [records, setRecords] = React.useState('');
          const [yourName, setYourName] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#34d399',marginBottom:4}}>📋 FOIA Request Writer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Generate a proper Freedom of Information Act request letter, ready to file.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={agency} onChange={e=>setAgency(e.target.value)} placeholder="Agency (e.g. FBI, EPA, City of LA)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={yourName} onChange={e=>setYourName(e.target.value)} placeholder="Your full name" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <textarea value={records} onChange={e=>setRecords(e.target.value)} placeholder="Records sought (be specific — types, dates, topics, names involved...)" rows={4} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <button onClick={async()=>{if(!agency.trim()||!records.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/foia/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({agency,records_sought:records,your_name:yourName})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#10b981',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Writing...':'Generate FOIA Request'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div style={{color:'#34d399',fontWeight:700}}>FOIA Request Letter</div><button onClick={()=>{navigator.clipboard.writeText(result.letter);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:'#334155',color:'#e2e8f0',border:'none',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:12}}>{copied?'Copied!':'Copy'}</button></div>
                  <pre style={{color:'#cbd5e1',fontSize:12,whiteSpace:'pre-wrap',fontFamily:'inherit',lineHeight:1.6}}>{result.letter}</pre>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:8,padding:'0.75rem'}}><div style={{color:'#fbbf24',fontSize:12,fontWeight:600}}>Expected Timeline</div><div style={{color:'#cbd5e1',fontSize:12,marginTop:4}}>{result.expected_timeline}</div></div>
                  <div style={{background:'#1e293b',borderRadius:8,padding:'0.75rem'}}><div style={{color:'#60a5fa',fontSize:12,fontWeight:600}}>Appeal Rights</div><div style={{color:'#cbd5e1',fontSize:12,marginTop:4}}>{result.appeal_rights}</div></div>
                </div>
              </div>)}
            </div>
          );
}

export function ForgeTab_plottwist() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [summary, setSummary] = React.useState('');
          const [genre, setGenre] = React.useState('thriller');
          const [situation, setSituation] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#a78bfa',marginBottom:4}}>🌀 Plot Twist Generator</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Generate 5 unexpected, story-breaking plot twists for your narrative.</p>
              <textarea value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Summarize your story so far..." rows={4} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={genre} onChange={e=>setGenre(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['thriller','mystery','romance','fantasy','sci-fi','horror','literary fiction','YA'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <input value={situation} onChange={e=>setSituation(e.target.value)} placeholder="Current situation / midpoint" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <button onClick={async()=>{if(!summary.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/plot-twist/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({story_summary:summary,genre,current_situation:situation})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Generating...':'Generate Plot Twists'}</button>
              {result&&!result.error&&(<div>{(result.twists||[]).map((t:any,i:number)=><div key={i} style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem',borderLeft:`3px solid #7c3aed`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><div style={{color:'#c4b5fd',fontWeight:700,fontSize:15}}>{t.title}</div><div style={{background:'#4c1d95',color:'#a78bfa',borderRadius:20,padding:'2px 10px',fontSize:12}}>Shock: {t.shock_level}/10</div></div>
                <div style={{color:'#e2e8f0',fontSize:13,marginBottom:8}}>{t.description}</div>
                <div style={{color:'#64748b',fontSize:12,marginBottom:4}}>🌱 Setup: {t.setup_needed}</div>
                <div style={{color:'#818cf8',fontSize:12}}>💥 Impact: {t.impact}</div>
              </div>)}</div>)}
            </div>
          );
}
