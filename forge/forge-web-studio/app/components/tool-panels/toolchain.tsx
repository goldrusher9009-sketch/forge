'use client';
import React from 'react';
import { AuthenticatedEventSource } from '../../../lib/authenticated-event-source';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';
import { utcStamp } from '../../../lib/platform-time';

export function ForgeTab_toolchain() {
  const [steps, setSteps] = React.useState<Array<{tool: string, input: string, output: string, status: 'idle'|'running'|'done'|'error'}>>([
    { tool: 'pitchcoach93', input: '', output: '', status: 'idle' },
    { tool: 'seowriter94', input: '', output: '', status: 'idle' },
  ]);
  const [running, setRunning] = React.useState(false);

  const addStep = () => setSteps(s => [...s, { tool: CHAINABLE_TOOLS[0].id, input: '', output: '', status: 'idle' }]);
  const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, patch: any) => setSteps(s => s.map((st, idx) => idx === i ? { ...st, ...patch } : st));

  const runChain = async () => {
    if (running) return;
    setRunning(true);
    let lastOutput = '';
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const input = i === 0 ? step.input : (step.input || lastOutput);
      updateStep(i, { status: 'running', output: '', input });
      try {
        const toolDef = CHAINABLE_TOOLS.find(t => t.id === step.tool);
        const prompt = toolDef ? `You are the ${toolDef.name} tool. Process this input and produce high-quality output:\n\n${input}` : input;
        const r = await fetch(`${BACKEND}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ message: prompt, model: 'claude-3-5-haiku-20241022' }),
        });
        const d = await r.json();
        const out = d.response || d.content || d.error || 'No output';
        lastOutput = out;
        updateStep(i, { status: 'done', output: out });
        saveToolHistory(`chain_${step.tool}`, `Chain: ${toolDef?.name || step.tool}`, { input: input.slice(0, 200) }, out.slice(0, 500));
      } catch (e: any) {
        updateStep(i, { status: 'error', output: e.message });
        lastOutput = '';
        break;
      }
    }
    setRunning(false);
  };

  const STATUS_COLOR: Record<string,string> = { idle: '#555', running: '#f59e0b', done: '#10b981', error: '#ef4444' };
  const STATUS_ICON: Record<string,string> = { idle: '○', running: '⚙️', done: '✅', error: '❌' };

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>⛓️</span>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Tool Chain</div>
          <div style={{ color: '#888', fontSize: 13 }}>Pipe one tool's output into the next — build multi-step AI workflows</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={addStep} style={{ padding: '7px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>+ Add Step</button>
          <button onClick={runChain} disabled={running} style={{ padding: '7px 20px', background: running ? '#555' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer' }}>{running ? '⚙️ Running…' : '▶ Run Chain'}</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 20 }}>Each step's output auto-fills the next step's input. You can also type custom inputs.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ background: '#0f172a', border: `1px solid ${step.status === 'done' ? '#10b981' : step.status === 'error' ? '#ef4444' : '#1e293b'}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#1e293b' }}>
              <span style={{ fontSize: 16, color: STATUS_COLOR[step.status] }}>{STATUS_ICON[step.status]}</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>Step {i + 1}</span>
              <select value={step.tool} onChange={e => updateStep(i, { tool: e.target.value })} disabled={running}
                style={{ flex: 1, padding: '4px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 13 }}>
                {CHAINABLE_TOOLS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {steps.length > 1 && <button onClick={() => removeStep(i)} disabled={running} style={{ padding: '3px 8px', background: 'none', border: '1px solid #334155', borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>×</button>}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{i === 0 ? 'INPUT' : `INPUT (auto from step ${i}, or override below)`}</div>
              <textarea
                value={step.input}
                onChange={e => updateStep(i, { input: e.target.value })}
                disabled={running}
                placeholder={i === 0 ? 'Enter your starting input…' : 'Leave blank to use previous step output, or enter custom input…'}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', background: '#020617', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              {step.output && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>OUTPUT</div>
                  <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', lineHeight: 1.6 }}>{step.output}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={() => navigator.clipboard?.writeText(step.output)} style={{ padding: '4px 10px', background: 'none', border: '1px solid #1e293b', borderRadius: 6, color: '#64748b', fontSize: 11, cursor: 'pointer' }}>📋 Copy</button>
                    {i < steps.length - 1 && <button onClick={() => updateStep(i + 1, { input: step.output })} style={{ padding: '4px 10px', background: 'none', border: '1px solid #1e293b', borderRadius: 6, color: '#64748b', fontSize: 11, cursor: 'pointer' }}>→ Push to next step</button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {steps.length > 1 && <div style={{ textAlign: 'center', marginTop: 20 }}><button onClick={addStep} style={{ padding: '8px 20px', background: 'none', border: '1px dashed #334155', borderRadius: 10, color: '#64748b', fontSize: 13, cursor: 'pointer' }}>+ Add Another Step</button></div>}
    </div>
  );
}

export function ForgeTab_forgeauto2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [goal, setGoal] = React.useState('');
          const [running, setRunning] = React.useState(false);
          const [phase, setPhase] = React.useState('');
          const [plan, setPlan] = React.useState<any[]>([]);
          const [planSummary, setPlanSummary] = React.useState('');
          const [steps, setSteps] = React.useState<{index:number,step:any,status:'waiting'|'running'|'done'|'error',result?:string}[]>([]);
          const [output, setOutput] = React.useState('');
          const [artifacts, setArtifacts] = React.useState<any[]>([]);
          const [sessions, setSessions] = React.useState<any[]>([]);
          const [activeArtifact, setActiveArtifact] = React.useState<any>(null);
          const logRef = React.useRef<HTMLDivElement>(null);
          const esRef = React.useRef<AuthenticatedEventSource|null>(null);
          React.useEffect(()=>{if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight;},[steps,phase]);
          React.useEffect(()=>{fetch(`${API}/api/autonomy/sessions`,{headers:{'Authorization':`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setSessions(d.sessions||[])).catch(()=>{});},[]);
          const TYPE_ICONS:Record<string,string>={research:'🔍',browse:'🌐',code:'💻',write:'✍️',analyze:'📊',create:'🎨',synthesize:'🔮',default:'⚙️'};
          const startAutonomy = async () => {
            if(!goal.trim()) return;
            setRunning(true); setPhase('Initializing…'); setPlan([]); setPlanSummary(''); setSteps([]); setOutput(''); setArtifacts([]);
            if(esRef.current) esRef.current.close();
            const r = await fetch(`${API}/api/autonomy/run`, {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({goal})});
            const {sessionId} = await r.json();
            const es = new AuthenticatedEventSource(`${API}/api/autonomy/stream/${sessionId}`, tok || '');
            esRef.current = es;
            es.addEventListener('thinking', ((e:MessageEvent)=>{setPhase(JSON.parse(e.data).message);}) as EventListener);
            es.addEventListener('plan', ((e:MessageEvent)=>{
              const d=JSON.parse(e.data); setPlan(d.steps||[]); setPlanSummary(d.summary||'');
              setSteps((d.steps||[]).map((_:any,i:number)=>({index:i,step:d.steps[i],status:'waiting' as const})));
            }) as EventListener);
            es.addEventListener('step_start', ((e:MessageEvent)=>{const d=JSON.parse(e.data); setPhase(`Running: ${d.step.title}`); setSteps(p=>p.map(s=>s.index===d.index?{...s,status:'running' as const}:s));}) as EventListener);
            es.addEventListener('step_done', ((e:MessageEvent)=>{const d=JSON.parse(e.data); setSteps(p=>p.map(s=>s.index===d.index?{...s,status:'done' as const,result:d.result}:s)); if(d.artifacts?.length) setArtifacts(d.artifacts);}) as EventListener);
            es.addEventListener('step_error', ((e:MessageEvent)=>{const d=JSON.parse(e.data); setSteps(p=>p.map(s=>s.index===d.index?{...s,status:'error' as const,result:d.error}:s));}) as EventListener);
            es.addEventListener('complete', ((e:MessageEvent)=>{
              const d=JSON.parse(e.data); setOutput(d.output||''); setArtifacts(d.artifacts||[]); setRunning(false); setPhase('Complete ✅');
              es.close(); setSessions((p:any[])=>[{id:sessionId,goal,status:'done',created_at:new Date().toISOString()},...p]);
            }) as EventListener);
            es.addEventListener('error', ((e:MessageEvent)=>{try{setPhase('Error: '+JSON.parse(e.data).error);}catch{}setRunning(false);es.close();}) as EventListener);
          };
          const loadSession = async(id:string) => {
            const r=await fetch(`${API}/api/autonomy/session/${id}`,{headers:{'Authorization':`Bearer ${tok}`}});
            const d=await r.json(); setGoal(d.goal||''); setOutput(d.final_output||'');
            const p=JSON.parse(d.plan||'[]'); setPlan(p);
            setSteps(p.map((s:any,i:number)=>({index:i,step:s,status:(i<(d.steps_done||0)?'done':'waiting') as any})));
            setArtifacts(JSON.parse(d.artifacts||'[]'));
          };
          const EXAMPLES = [
            'Research and write a comprehensive report on quantum computing',
            'Build a full JavaScript todo app with localStorage and dark mode',
            'Create a complete marketing strategy for a SaaS product launch',
            'Analyze the pros and cons of 5 different database architectures',
            'Write a detailed technical spec for a real-time chat application',
          ];
          return(<div style={{display:'grid',gridTemplateColumns:'280px 1fr',height:'100vh',fontFamily:'system-ui',background:'#080810',color:'#fff'}}>
            {/* Left panel */}
            <div style={{background:'#0d0d1a',borderRight:'1px solid #1f1f35',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'16px',borderBottom:'1px solid #1f1f35'}}>
                <div style={{fontSize:'18px',fontWeight:800,marginBottom:'4px'}}>⚡ Forge Autonomy</div>
                <div style={{fontSize:'11px',color:'#666'}}>Give a goal. Watch it get done.</div>
              </div>
              <div style={{padding:'12px',flex:1,overflowY:'auto'}}>
                <textarea value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Describe what you want Forge to do autonomously…" rows={4} style={{width:'100%',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'8px',padding:'10px',fontSize:'13px',resize:'none',boxSizing:'border-box',marginBottom:'8px'}}/>
                <button onClick={startAutonomy} disabled={running||!goal.trim()} style={{width:'100%',background:running?'#2a2a3e':'linear-gradient(135deg,#7c3aed,#6366f1,#06b6d4)',color:'#fff',border:'none',borderRadius:'8px',padding:'12px',fontWeight:800,cursor:running?'default':'pointer',fontSize:'14px',marginBottom:'12px',boxShadow:running?'none':'0 0 20px rgba(99,102,241,0.4)'}}>
                  {running?`${phase}`:'⚡ Run Autonomously'}
                </button>
                {!goal&&<div>
                  <div style={{color:'#555',fontSize:'11px',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'1px'}}>Examples</div>
                  {EXAMPLES.map((ex,i)=><div key={i} onClick={()=>setGoal(ex)} style={{padding:'6px 8px',background:'#1a1a2e',borderRadius:'6px',marginBottom:'4px',cursor:'pointer',fontSize:'11px',color:'#888',border:'1px solid #1f1f35'}} onMouseEnter={e=>(e.currentTarget.style.color='#ddd')} onMouseLeave={e=>(e.currentTarget.style.color='#888')}>{ex}</div>)}
                </div>}
                <div style={{marginTop:'16px'}}>
                  <div style={{color:'#555',fontSize:'11px',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'1px'}}>History</div>
                  {sessions.map((s:any)=><div key={s.id} onClick={()=>loadSession(s.id)} style={{padding:'8px',background:'#1a1a2e',borderRadius:'6px',marginBottom:'4px',cursor:'pointer',border:'1px solid #1f1f35'}}>
                    <div style={{fontSize:'11px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#bbb'}}>{s.goal}</div>
                    <div style={{fontSize:'10px',color:'#555',marginTop:'2px'}}>{new Date(utcStamp(s.created_at)).toLocaleDateString()}</div>
                  </div>)}
                </div>
              </div>
            </div>
            {/* Right panel */}
            <div style={{display:'grid',gridTemplateRows:'1fr auto',overflow:'hidden'}}>
              {/* Top: steps + output */}
              <div style={{display:'grid',gridTemplateColumns:output?'380px 1fr':'1fr',overflow:'hidden'}}>
                {/* Steps timeline */}
                <div ref={logRef} style={{overflowY:'auto',padding:'16px',borderRight:output?'1px solid #1f1f35':'none'}}>
                  {!plan.length&&!running&&<div style={{textAlign:'center',padding:'80px 20px',color:'#333'}}>
                    <div style={{fontSize:'64px',marginBottom:'16px'}}>⚡</div>
                    <div style={{fontSize:'16px',fontWeight:700,marginBottom:'8px',color:'#555'}}>Full Autonomy Mode</div>
                    <div style={{fontSize:'13px',lineHeight:'1.6'}}>Enter any goal and watch Forge autonomously plan, research, write code, create documents, and deliver a complete result — showing every step live.</div>
                  </div>}
                  {planSummary&&<div style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:'8px',padding:'12px',marginBottom:'16px',fontSize:'13px',color:'#a78bfa'}}>📋 {planSummary}</div>}
                  {steps.map((s,i)=>{
                    const icon=TYPE_ICONS[s.step?.type]||TYPE_ICONS.default;
                    const bg=s.status==='done'?'rgba(16,185,129,0.08)':s.status==='running'?'rgba(99,102,241,0.1)':s.status==='error'?'rgba(239,68,68,0.08)':'#1a1a2e';
                    const border=s.status==='done'?'#10b981':s.status==='running'?'#6366f1':s.status==='error'?'#ef4444':'#2a2a3e';
                    return(<div key={i} style={{background:bg,border:`1px solid ${border}`,borderRadius:'8px',padding:'10px 12px',marginBottom:'8px',transition:'all 0.3s'}}>
                      <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:s.result?'6px':'0'}}>
                        <span style={{fontSize:'16px'}}>{s.status==='done'?'✅':s.status==='running'?'⏳':s.status==='error'?'❌':icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'12px',fontWeight:700,color:s.status==='running'?'#a78bfa':'#ddd'}}>{s.step?.title||`Step ${i+1}`}</div>
                          <div style={{fontSize:'10px',color:'#666',textTransform:'capitalize'}}>{s.step?.type}</div>
                        </div>
                        <div style={{fontSize:'10px',color:border,fontWeight:600,textTransform:'uppercase'}}>{s.status}</div>
                      </div>
                      {s.result&&<div style={{fontSize:'11px',color:'#888',borderTop:'1px solid #2a2a3e',paddingTop:'6px',maxHeight:'80px',overflowY:'auto',lineHeight:'1.5'}}>{s.result.slice(0,300)}{s.result.length>300?'…':''}</div>}
                    </div>);
                  })}
                  {running&&!steps.length&&<div style={{textAlign:'center',padding:'40px',color:'#6366f1'}}>
                    <div style={{fontSize:'32px',marginBottom:'8px'}}>🧠</div>
                    <div style={{fontSize:'13px'}}>{phase}</div>
                  </div>}
                </div>
                {/* Output panel */}
                {output&&<div style={{overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                    <div style={{fontSize:'14px',fontWeight:700,color:'#a78bfa'}}>✨ Final Deliverable</div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>navigator.clipboard.writeText(output)} style={{padding:'5px 10px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}}>📋</button>
                      <button onClick={()=>{const b=new Blob([output],{type:'text/markdown'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='forge-output.md';a.click();}} style={{padding:'5px 10px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}}>⬇️</button>
                      <button onClick={()=>{setOutput('');setSteps([]);setPlan([]);setGoal('');}} style={{padding:'5px 10px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}}>🔄 New</button>
                    </div>
                  </div>
                  <div style={{background:'#0d0d1a',borderRadius:'10px',padding:'20px',border:'1px solid #1f1f35',whiteSpace:'pre-wrap',fontSize:'13px',lineHeight:'1.8',color:'#e0e0e0',flex:1}}>{output}</div>
                  {artifacts.length>0&&<div>
                    <div style={{fontSize:'12px',fontWeight:700,color:'#aaa',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'1px'}}>Artifacts ({artifacts.length})</div>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      {artifacts.map((a:any,i:number)=><button key={i} onClick={()=>setActiveArtifact(activeArtifact?.title===a.title?null:a)} style={{padding:'6px 12px',background:activeArtifact?.title===a.title?'#6366f1':'#1a1a2e',color:'#fff',border:'1px solid '+(activeArtifact?.title===a.title?'#6366f1':'#333'),borderRadius:'6px',cursor:'pointer',fontSize:'11px'}}>{a.type==='code'?'💻':'📄'} {a.title}</button>)}
                    </div>
                    {activeArtifact&&<div style={{marginTop:'8px',background:'#0d0d1a',borderRadius:'8px',padding:'16px',border:'1px solid #333',fontFamily:'monospace',fontSize:'12px',lineHeight:'1.6',color:'#e0e0e0',maxHeight:'300px',overflowY:'auto',whiteSpace:'pre-wrap'}}>{activeArtifact.content}</div>}
                  </div>}
                </div>}
              </div>
            </div>
          </div>);
}

export function ForgeTab_dreamlog() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [log, setLog] = React.useState<any[]>([]);
          const [brief, setBrief] = React.useState('');
          const [suggesting, setSuggesting] = React.useState(false);
          const [briefing, setBriefing] = React.useState(false);
          const STATUS_COLOR:Record<string,string>={suggested:'#6366f1',building:'#f59e0b',built:'#10b981',rejected:'#ef4444'};
          const TYPE_ICON:Record<string,string>={agent:'🤖',ui:'🎨',integration:'🔗',analytics:'📊',autonomy:'⚡',feature:'✨'};
          const load=()=>fetch(`${API}/api/dream/log`,{headers:{'Authorization':`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setLog(d.log||[])).catch(()=>{});
          React.useEffect(()=>{load();},[]);
          const suggest=async()=>{setSuggesting(true);try{await fetch(`${API}/api/dream/suggest`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({})});await load();}finally{setSuggesting(false);}};
          const getAutobrief=async()=>{setBriefing(true);try{const r=await fetch(`${API}/api/auto-brief`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({})});const d=await r.json();setBrief(d.brief||'');}finally{setBriefing(false);}};
          const setStatus=(id:string,s:string)=>fetch(`${API}/api/dream/${id}/status`,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({status:s})}).then(()=>load());
          return(<div style={{display:'grid',gridTemplateColumns:'1fr 360px',height:'100vh',background:'#080810',color:'#fff',fontFamily:'system-ui',gap:0}}>
            <div style={{overflowY:'auto',padding:'24px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
                <div>
                  <div style={{fontSize:'24px',fontWeight:800}}>🌙 Dream Log</div>
                  <div style={{color:'#555',fontSize:'13px'}}>Forge dreams its own next features every night</div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={suggest} disabled={suggesting} style={{padding:'10px 18px',background:'linear-gradient(135deg,#7c3aed,#6366f1)',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700,fontSize:'13px'}}>{suggesting?'Dreaming…':'💡 Dream New Features'}</button>
                  <button onClick={getAutobrief} disabled={briefing} style={{padding:'10px 18px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'8px',cursor:'pointer',fontSize:'13px'}}>{briefing?'Writing…':'📝 Auto-Brief'}</button>
                </div>
              </div>
              {brief&&<div style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:'12px',padding:'20px',marginBottom:'20px',fontSize:'13px',lineHeight:'1.8',color:'#c4c4ff',whiteSpace:'pre-wrap'}}><div style={{fontWeight:700,marginBottom:'8px',color:'#a78bfa'}}>📣 Forge Morning Brief</div>{brief}</div>}
              <div style={{display:'grid',gap:'10px'}}>
                {!log.length&&<div style={{textAlign:'center',padding:'80px',color:'#333'}}>
                  <div style={{fontSize:'48px',marginBottom:'12px'}}>🌙</div>
                  <div style={{fontSize:'16px',color:'#555'}}>No dreams yet — hit "Dream New Features" to start</div>
                </div>}
                {log.map((item:any)=><div key={item.id} style={{background:'#0d0d1a',border:'1px solid #1f1f35',borderRadius:'10px',padding:'16px',display:'grid',gridTemplateColumns:'1fr auto',gap:'12px',alignItems:'start'}}>
                  <div>
                    <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'6px'}}>
                      <span style={{fontSize:'18px'}}>{TYPE_ICON[item.type]||'✨'}</span>
                      <span style={{fontWeight:700,fontSize:'14px'}}>{item.title}</span>
                      <span style={{padding:'2px 8px',borderRadius:'999px',fontSize:'10px',background:STATUS_COLOR[item.status]||'#333',color:'#fff',textTransform:'uppercase',letterSpacing:'0.5px'}}>{item.status}</span>
                      {item.iq_delta>0&&<span style={{fontSize:'11px',color:'#10b981'}}>+{item.iq_delta} IQ</span>}
                    </div>
                    <div style={{fontSize:'12px',color:'#888',lineHeight:'1.6'}}>{item.description}</div>
                    <div style={{fontSize:'10px',color:'#444',marginTop:'6px'}}>{new Date(utcStamp(item.created_at)).toLocaleString()}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px',minWidth:'90px'}}>
                    {item.status==='suggested'&&<><button onClick={()=>setStatus(item.id,'building')} style={{padding:'5px 10px',background:'#f59e0b',color:'#000',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontWeight:700}}>Build</button>
                    <button onClick={()=>setStatus(item.id,'rejected')} style={{padding:'5px 10px',background:'#2a2a3e',color:'#888',border:'1px solid #333',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}}>Skip</button></>}
                    {item.status==='building'&&<button onClick={()=>setStatus(item.id,'built')} style={{padding:'5px 10px',background:'#10b981',color:'#000',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontWeight:700}}>✓ Done</button>}
                  </div>
                </div>)}
              </div>
            </div>
            <div style={{background:'#0d0d1a',borderLeft:'1px solid #1f1f35',padding:'20px',overflowY:'auto'}}>
              <div style={{fontWeight:700,marginBottom:'16px',color:'#a78bfa'}}>📊 Dream Stats</div>
              <div style={{display:'grid',gap:'10px'}}>
                {(['suggested','building','built','rejected'] as string[]).map(s=>{const n=log.filter((l:any)=>l.status===s).length;return(<div key={s} style={{background:'#1a1a2e',borderRadius:'8px',padding:'12px',display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'#888',textTransform:'capitalize'}}>{s}</span>
                  <span style={{fontWeight:700,color:STATUS_COLOR[s]||'#fff'}}>{n}</span>
                </div>);})}
              </div>
              <div style={{marginTop:'20px',fontWeight:700,marginBottom:'12px',color:'#a78bfa'}}>🏆 Top Ideas by IQ</div>
              {log.sort((a:any,b:any)=>b.iq_delta-a.iq_delta).slice(0,5).map((item:any)=><div key={item.id} style={{padding:'8px',background:'#1a1a2e',borderRadius:'6px',marginBottom:'6px'}}>
                <div style={{fontSize:'11px',fontWeight:600,color:'#ddd',marginBottom:'2px'}}>{item.title}</div>
                <div style={{fontSize:'10px',color:'#10b981'}}>+{item.iq_delta} IQ points</div>
              </div>)}
            </div>
          </div>);
}

export function ForgeTab_forgeiq() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [iq, setIq] = React.useState<any>(null);
          const [history, setHistory] = React.useState<any[]>([]);
          const [loading, setLoading] = React.useState(false);
          const compute=async()=>{setLoading(true);try{const r=await fetch(`${API}/api/forge-iq`,{headers:{'Authorization':`Bearer ${tok}`}});const d=await r.json();setIq(d);fetch(`${API}/api/forge-iq/history`,{headers:{'Authorization':`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}finally{setLoading(false);}};
          React.useEffect(()=>{compute();},[]);
          const BAR=(label:string,val:number,color:string)=><div style={{marginBottom:'12px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'12px',color:'#aaa'}}>{label}</span><span style={{fontSize:'12px',fontWeight:700,color}}>{val}</span></div>
            <div style={{height:'6px',background:'#1a1a2e',borderRadius:'3px'}}><div style={{height:'6px',width:`${val}%`,background:color,borderRadius:'3px',transition:'width 0.8s'}} /></div>
          </div>;
          const score=iq?.score||0;
          const scoreColor=score>=90?'#10b981':score>=80?'#6366f1':score>=70?'#f59e0b':'#ef4444';
          return(<div style={{height:'100vh',overflowY:'auto',background:'#080810',color:'#fff',fontFamily:'system-ui',padding:'32px',maxWidth:'900px',margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:'40px'}}>
              <div style={{fontSize:'20px',fontWeight:700,color:'#888',marginBottom:'8px'}}>🧬 Forge IQ Score</div>
              <div style={{fontSize:'96px',fontWeight:900,color:scoreColor,lineHeight:1,marginBottom:'8px',textShadow:`0 0 40px ${scoreColor}88`}}>{loading?'…':score}</div>
              <div style={{fontSize:'16px',color:'#666'}}>/ 100 — Capability vs Claude & ChatGPT</div>
              <button onClick={compute} disabled={loading} style={{marginTop:'16px',padding:'10px 24px',background:'linear-gradient(135deg,#7c3aed,#6366f1)',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700}}>{loading?'Computing…':'🔄 Recompute'}</button>
            </div>
            {iq&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',marginBottom:'32px'}}>
              <div style={{background:'#0d0d1a',border:'1px solid #1f1f35',borderRadius:'12px',padding:'20px'}}>
                <div style={{fontWeight:700,marginBottom:'16px',color:'#a78bfa'}}>Capability Breakdown</div>
                {Object.entries(iq.breakdown||{}).map(([k,v]:any)=>BAR(k.replace(/_/g,' '),v,scoreColor))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                <div style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:'12px',padding:'16px'}}>
                  <div style={{fontWeight:700,color:'#10b981',marginBottom:'8px'}}>✅ vs Claude</div>
                  <div style={{fontSize:'13px',color:'#aaa',lineHeight:'1.6'}}>{iq.vs_claude||'Computing…'}</div>
                </div>
                <div style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:'12px',padding:'16px'}}>
                  <div style={{fontWeight:700,color:'#6366f1',marginBottom:'8px'}}>✅ vs ChatGPT</div>
                  <div style={{fontSize:'13px',color:'#aaa',lineHeight:'1.6'}}>{iq.vs_chatgpt||'Computing…'}</div>
                </div>
                <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'12px',padding:'16px'}}>
                  <div style={{fontWeight:700,color:'#f59e0b',marginBottom:'8px'}}>🎯 Next Unlock</div>
                  <div style={{fontSize:'13px',color:'#aaa',lineHeight:'1.6'}}>{iq.next_unlock||'Computing…'}</div>
                </div>
                {iq.weakness&&<div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'12px',padding:'16px'}}>
                  <div style={{fontWeight:700,color:'#ef4444',marginBottom:'8px'}}>⚠️ Weakness</div>
                  <div style={{fontSize:'13px',color:'#aaa',lineHeight:'1.6'}}>{iq.weakness}</div>
                </div>}
              </div>
            </div>}
            {history.length>1&&<div style={{background:'#0d0d1a',border:'1px solid #1f1f35',borderRadius:'12px',padding:'20px'}}>
              <div style={{fontWeight:700,marginBottom:'12px',color:'#a78bfa'}}>📈 IQ History</div>
              <div style={{display:'flex',gap:'8px',alignItems:'flex-end',height:'60px'}}>
                {history.slice(0,20).reverse().map((h:any,i:number)=><div key={i} style={{flex:1,background:'#6366f1',borderRadius:'3px 3px 0 0',height:`${(h.score/100)*60}px`,minWidth:'8px'}} title={`${h.score} — ${new Date(h.computed_at).toLocaleDateString()}`}/>)}
              </div>
            </div>}
          </div>);
}

export function ForgeTab_promptopt() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [prompt, setPrompt] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/prompt/history`,{headers:{'Authorization':`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});},[]);
          const optimize=async()=>{if(!prompt.trim()) return; setLoading(true); setResult(null);
            try{const r=await fetch(`${API}/api/prompt/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({prompt})});const d=await r.json();setResult(d);setHistory((p:any[])=>[{original:prompt,optimized:d.optimized,improvement_pct:d.improvement_pct,created_at:new Date().toISOString()},...p]);}
            finally{setLoading(false);}};
          const EXAMPLES=['Write me a blog post about AI','Summarize this document','Help me with my code','Explain machine learning','Give me ideas for my startup'];
          return(<div style={{display:'grid',gridTemplateColumns:'1fr 320px',height:'100vh',background:'#080810',color:'#fff',fontFamily:'system-ui'}}>
            <div style={{overflowY:'auto',padding:'24px'}}>
              <div style={{fontSize:'24px',fontWeight:800,marginBottom:'4px'}}>✨ Prompt Optimizer</div>
              <div style={{color:'#555',fontSize:'13px',marginBottom:'24px'}}>Forge rewrites your prompts for 2–5× better AI results</div>
              <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Enter your prompt to optimize…" rows={4} style={{width:'100%',background:'#0d0d1a',color:'#fff',border:'1px solid #333',borderRadius:'10px',padding:'14px',fontSize:'14px',resize:'vertical',boxSizing:'border-box',marginBottom:'10px'}}/>
              {!prompt&&<div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>{EXAMPLES.map((ex,i)=><button key={i} onClick={()=>setPrompt(ex)} style={{padding:'5px 10px',background:'#1a1a2e',color:'#888',border:'1px solid #2a2a3e',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}}>{ex}</button>)}</div>}
              <button onClick={optimize} disabled={loading||!prompt.trim()} style={{padding:'12px 28px',background:'linear-gradient(135deg,#7c3aed,#6366f1)',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700,fontSize:'14px',boxShadow:'0 0 20px rgba(99,102,241,0.4)',marginBottom:'24px'}}>{loading?'Optimizing…':'✨ Optimize Prompt'}</button>
              {result&&<div style={{display:'grid',gap:'16px'}}>
                <div style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:'12px',padding:'20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                    <div style={{fontWeight:700,color:'#10b981'}}>✅ Optimized Prompt</div>
                    <div style={{background:'#10b981',color:'#000',padding:'4px 12px',borderRadius:'999px',fontSize:'12px',fontWeight:700}}>+{result.improvement_pct}% better</div>
                  </div>
                  <div style={{background:'#0d0d1a',borderRadius:'8px',padding:'14px',fontSize:'13px',lineHeight:'1.7',color:'#e0e0e0',marginBottom:'10px',whiteSpace:'pre-wrap'}}>{result.optimized}</div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={()=>navigator.clipboard.writeText(result.optimized)} style={{padding:'6px 14px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'6px',cursor:'pointer',fontSize:'11px'}}>📋 Copy</button>
                    <button onClick={()=>setPrompt(result.optimized)} style={{padding:'6px 14px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'6px',cursor:'pointer',fontSize:'11px'}}>🔁 Use as input</button>
                  </div>
                </div>
                {result.improvements?.length>0&&<div style={{background:'#0d0d1a',border:'1px solid #1f1f35',borderRadius:'12px',padding:'16px'}}>
                  <div style={{fontWeight:700,marginBottom:'10px',color:'#a78bfa'}}>What changed</div>
                  {result.improvements.map((imp:string,i:number)=><div key={i} style={{fontSize:'12px',color:'#aaa',marginBottom:'6px',display:'flex',gap:'8px'}}><span style={{color:'#6366f1'}}>→</span>{imp}</div>)}
                </div>}
                {result.tip&&<div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'10px',padding:'14px',fontSize:'13px',color:'#fbbf24'}}>💡 {result.tip}</div>}
                {result.techniques_used?.length>0&&<div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>{result.techniques_used.map((t:string,i:number)=><span key={i} style={{padding:'3px 10px',background:'rgba(99,102,241,0.15)',color:'#a78bfa',borderRadius:'999px',fontSize:'11px'}}>{t}</span>)}</div>}
              </div>}
            </div>
            <div style={{background:'#0d0d1a',borderLeft:'1px solid #1f1f35',padding:'16px',overflowY:'auto'}}>
              <div style={{fontWeight:700,marginBottom:'12px',color:'#a78bfa'}}>Recent Optimizations</div>
              {!history.length&&<div style={{color:'#444',fontSize:'12px'}}>None yet — optimize a prompt!</div>}
              {history.slice(0,15).map((h:any,i:number)=><div key={i} onClick={()=>{setPrompt(h.original);setResult(null);}} style={{padding:'10px',background:'#1a1a2e',borderRadius:'8px',marginBottom:'6px',cursor:'pointer',border:'1px solid #2a2a3e'}}>
                <div style={{fontSize:'11px',color:'#aaa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:'3px'}}>{h.original?.slice(0,50)}…</div>
                <div style={{fontSize:'10px',color:'#10b981'}}>+{h.improvement_pct}% improved</div>
              </div>)}
            </div>
          </div>);
}

export function ForgeTab_shadowmode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [prompt, setPrompt] = React.useState('');
          const [modelA, setModelA] = React.useState('claude-3-5-sonnet-20241022');
          const [modelB, setModelB] = React.useState('gpt-4o');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [runs, setRuns] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/shadow/runs`,{headers:{'Authorization':`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setRuns(d.runs||[])).catch(()=>{});},[]);
          const run=async()=>{if(!prompt.trim()) return; setLoading(true); setResult(null);
            try{const r=await fetch(`${API}/api/shadow/run`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({prompt,model_a:modelA,model_b:modelB})});const d=await r.json();setResult(d);setRuns((p:any[])=>[{id:d.id,prompt,model_a:modelA,model_b:modelB,created_at:new Date().toISOString()},...p]);}
            finally{setLoading(false);}};
          const loadRun=async(id:string)=>{const r=await fetch(`${API}/api/shadow/run/${id}`,{headers:{'Authorization':`Bearer ${tok}`}});const d=await r.json();setResult(d);setPrompt(d.prompt||'');};
          const MODELS=['claude-3-5-sonnet-20241022','claude-3-opus-20240229','claude-3-haiku-20240307','gpt-4o','gpt-4o-mini','gpt-4-turbo','gemini-1.5-pro','gemini-1.5-flash'];
          return(<div style={{display:'grid',gridTemplateColumns:'300px 1fr',height:'100vh',background:'#080810',color:'#fff',fontFamily:'system-ui'}}>
            <div style={{background:'#0d0d1a',borderRight:'1px solid #1f1f35',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'16px',borderBottom:'1px solid #1f1f35'}}>
                <div style={{fontSize:'18px',fontWeight:800,marginBottom:'4px'}}>👥 Shadow Mode</div>
                <div style={{fontSize:'11px',color:'#555'}}>Run prompt through 2 models, compare side by side</div>
              </div>
              <div style={{padding:'12px',flex:1,overflowY:'auto'}}>
                <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Enter your prompt…" rows={4} style={{width:'100%',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'8px',padding:'10px',fontSize:'13px',resize:'none',boxSizing:'border-box',marginBottom:'10px'}}/>
                <div style={{marginBottom:'8px'}}>
                  <div style={{fontSize:'11px',color:'#666',marginBottom:'4px'}}>Model A</div>
                  <select value={modelA} onChange={e=>setModelA(e.target.value)} style={{width:'100%',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'6px',padding:'6px',fontSize:'12px'}}>
                    {MODELS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'12px'}}>
                  <div style={{fontSize:'11px',color:'#666',marginBottom:'4px'}}>Model B</div>
                  <select value={modelB} onChange={e=>setModelB(e.target.value)} style={{width:'100%',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'6px',padding:'6px',fontSize:'12px'}}>
                    {MODELS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button onClick={run} disabled={loading||!prompt.trim()} style={{width:'100%',background:'linear-gradient(135deg,#7c3aed,#6366f1)',color:'#fff',border:'none',borderRadius:'8px',padding:'11px',fontWeight:700,cursor:'pointer',fontSize:'13px',marginBottom:'16px'}}>{loading?'Running…':'▶ Run Both'}</button>
                <div style={{fontSize:'11px',color:'#444',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'1px'}}>Past Runs</div>
                {runs.map((r:any)=><div key={r.id} onClick={()=>loadRun(r.id)} style={{padding:'8px',background:'#1a1a2e',borderRadius:'6px',marginBottom:'4px',cursor:'pointer',border:'1px solid #2a2a3e'}}>
                  <div style={{fontSize:'11px',color:'#bbb',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.prompt?.slice(0,40)}…</div>
                  <div style={{fontSize:'10px',color:'#555',marginTop:'2px'}}>{r.model_a} vs {r.model_b}</div>
                </div>)}
              </div>
            </div>
            <div style={{overflowY:'auto',padding:'0'}}>
              {!result&&!loading&&<div style={{textAlign:'center',padding:'80px',color:'#333'}}>
                <div style={{fontSize:'48px',marginBottom:'12px'}}>👥</div>
                <div style={{fontSize:'16px',color:'#555'}}>Enter a prompt and run both models to compare</div>
              </div>}
              {loading&&<div style={{textAlign:'center',padding:'80px',color:'#6366f1'}}>
                <div style={{fontSize:'32px',marginBottom:'12px'}}>⚡</div>
                <div>Running on both models simultaneously…</div>
              </div>}
              {result&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',height:'100%'}}>
                {[{key:'response_a',model:result.model_a,color:'#6366f1'},{key:'response_b',model:result.model_b,color:'#10b981'}].map(side=><div key={side.key} style={{padding:'20px',borderRight:side.key==='response_a'?'1px solid #1f1f35':'none',overflowY:'auto'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                    <div style={{fontWeight:700,color:side.color,fontSize:'14px'}}>{side.model}</div>
                    <button onClick={()=>navigator.clipboard.writeText(result[side.key]||'')} style={{padding:'4px 10px',background:'#1a1a2e',color:'#888',border:'1px solid #333',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}}>📋</button>
                  </div>
                  <div style={{fontSize:'13px',lineHeight:'1.8',color:'#e0e0e0',whiteSpace:'pre-wrap'}}>{result[side.key]||'No response'}</div>
                </div>)}
              </div>}
            </div>
          </div>);
}

export function ForgeTab_debate2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [topic, setTopic] = React.useState('');
          const [rounds, setRounds] = React.useState(3);
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(() => { fetch(`${API}/api/debate/sessions`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.sessions||[])).catch(()=>{}); }, []);
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:900,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>⚔️ AI Debate Mode</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Two AI agents argue opposite sides of any topic. You judge the winner.</div>
              <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Enter debate topic (e.g. 'Remote work is better than office')" style={{flex:1,minWidth:200,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:14}} />
                <select value={rounds} onChange={e=>setRounds(Number(e.target.value))} style={{padding:'10px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13}}>
                  {[2,3,4,5].map(n=><option key={n} value={n}>{n} rounds</option>)}
                </select>
                <button disabled={loading||!topic.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/debate/run`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({topic,rounds})});const d=await r.json();setResult(d);setHistory(h=>[{id:d.id,topic:d.topic,rounds:d.rounds,created_at:new Date().toISOString()},...h.slice(0,19)]);}catch(e:any){alert(e.message);}setLoading(false);}} style={{padding:'10px 20px',background:'#ef4444',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',opacity:loading||!topic.trim()?0.5:1}}>{loading?'Debating…':'⚔️ Start Debate'}</button>
              </div>
              {result && <div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                  {[{label:'✅ PRO (Side A)',content:result.side_a,color:'#22c55e'},{label:'❌ CON (Side B)',content:result.side_b,color:'#ef4444'}].map(s=>(
                    <div key={s.label} style={{background:'var(--fg-bg2)',border:`1px solid ${s.color}44`,borderRadius:12,padding:16}}>
                      <div style={{fontSize:12,fontWeight:700,color:s.color,marginBottom:10}}>{s.label}</div>
                      <div style={{fontSize:13,color:'var(--fg-text)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{s.content}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:'linear-gradient(135deg,#7c3aed22,#3b82f622)',border:'1px solid #7c3aed44',borderRadius:12,padding:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#a78bfa',marginBottom:8}}>🏆 VERDICT</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.7}}>{result.verdict}</div>
                </div>
              </div>}
              {history.length>0 && <div style={{marginTop:24}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em'}}>Past Debates</div>
                {history.map((h:any)=><div key={h.id} onClick={async()=>{const r=await fetch(`${API}/api/debate/${h.id}`,{headers:{Authorization:`Bearer ${tok}`}});setResult(await r.json());}} style={{padding:'8px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:6,cursor:'pointer',fontSize:13,color:'var(--fg-text2)'}}>{h.topic} <span style={{color:'var(--fg-text3)',fontSize:11}}>· {h.rounds} rounds · {h.created_at?.slice(0,10)}</span></div>)}
              </div>}
            </div>
          </div>);
}

export function ForgeTab_timecapsule() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [msg, setMsg] = React.useState('');
          const [deliverAt, setDeliverAt] = React.useState('');
          const [capsules, setCapsules] = React.useState<any[]>([]);
          const [ready, setReady] = React.useState<any[]>([]);
          const [saving, setSaving] = React.useState(false);
          const load = async () => { const [c,r]=await Promise.all([fetch(`${API}/api/time-capsules`,{headers:{Authorization:`Bearer ${tok}`}}).then(x=>x.json()),fetch(`${API}/api/time-capsules/ready`,{headers:{Authorization:`Bearer ${tok}`}}).then(x=>x.json())]); setCapsules(c.capsules||[]); setReady(r.capsules||[]); };
          React.useEffect(()=>{load();}, []);
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:700,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>⏳ Time Capsule</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Write a message to your future self. Choose when it unlocks.</div>
              {ready.length>0 && <div style={{background:'linear-gradient(135deg,#f59e0b22,#ef444422)',border:'1px solid #f59e0b',borderRadius:12,padding:16,marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:'#fbbf24',marginBottom:10}}>📬 {ready.length} capsule{ready.length>1?'s':''} just unlocked!</div>
                {ready.map((c:any)=><div key={c.id} style={{background:'var(--fg-bg2)',borderRadius:8,padding:12,marginBottom:8}}>
                  <div style={{fontSize:11,color:'var(--fg-text3)',marginBottom:6}}>Written {c.created_at?.slice(0,10)} · Unlocked {c.deliver_at?.slice(0,16)}</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.6}}>{c.message}</div>
                </div>)}
              </div>}
              <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:12,padding:16,marginBottom:20}}>
                <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Dear future me…" rows={5} style={{width:'100%',padding:'10px',background:'var(--fg-bg3)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text)',fontSize:14,resize:'vertical',boxSizing:'border-box',marginBottom:12}} />
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  <input type="datetime-local" value={deliverAt} onChange={e=>setDeliverAt(e.target.value)} style={{flex:1,padding:'8px 12px',background:'var(--fg-bg3)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text)',fontSize:13}} />
                  <button disabled={saving||!msg.trim()||!deliverAt} onClick={async()=>{setSaving(true);await fetch(`${API}/api/time-capsule`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({message:msg,deliver_at:deliverAt})});setMsg('');setDeliverAt('');await load();setSaving(false);}} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',opacity:saving||!msg.trim()||!deliverAt?0.5:1}}>{saving?'Saving…':'🕰️ Seal Capsule'}</button>
                </div>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em'}}>Pending Capsules ({capsules.filter((c:any)=>!c.delivered).length})</div>
                {capsules.filter((c:any)=>!c.delivered).map((c:any)=><div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:6}}>
                  <span style={{fontSize:20}}>🔒</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:'var(--fg-text)',fontStyle:'italic'}}>"{c.message.slice(0,80)}{c.message.length>80?'…':''}"</div>
                    <div style={{fontSize:11,color:'var(--fg-text3)',marginTop:2}}>Unlocks: {c.deliver_at?.slice(0,16)}</div>
                  </div>
                  <button onClick={async()=>{await fetch(`${API}/api/time-capsule/${c.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${tok}`}});load();}} style={{padding:'4px 8px',background:'#ef444444',border:'none',borderRadius:6,color:'#f87171',cursor:'pointer',fontSize:11}}>Delete</button>
                </div>)}
                {capsules.filter((c:any)=>!c.delivered).length===0 && <div style={{textAlign:'center',color:'var(--fg-text3)',fontSize:13,padding:32}}>No pending capsules. Write your first message to the future!</div>}
              </div>
            </div>
          </div>);
}

export function ForgeTab_codeexplain() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [code, setCode] = React.useState('');
          const [lang, setLang] = React.useState('auto');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/code/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const LANGS = ['auto','javascript','typescript','python','rust','go','java','c++','c#','ruby','php','swift','kotlin','sql'];
          const COMPLEXITY_COLOR:Record<string,string> = {simple:'#22c55e',moderate:'#f59e0b',complex:'#ef4444'};
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:900,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>🔬 Code Explainer</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Paste any code and get a line-by-line explanation with key concepts.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,marginBottom:12,alignItems:'start'}}>
                <textarea value={code} onChange={e=>setCode(e.target.value)} placeholder="// Paste your code here..." rows={8} style={{padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,fontFamily:'monospace',resize:'vertical',boxSizing:'border-box'}} />
                <select value={lang} onChange={e=>setLang(e.target.value)} style={{padding:'8px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text)',fontSize:12,height:'fit-content'}}>
                  {LANGS.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
                <button disabled={loading||!code.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/code/explain`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({code,language:lang})});const d=await r.json();setResult(d);}catch(e:any){alert(e.message);}setLoading(false);}} style={{padding:'10px 18px',background:'#3b82f6',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',opacity:loading||!code.trim()?0.5:1,height:'fit-content'}}>{loading?'Analyzing…':'🔬 Explain'}</button>
              </div>
              {result && <div>
                <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                  <div style={{padding:'6px 14px',background:'#3b82f622',border:'1px solid #3b82f644',borderRadius:20,fontSize:12,color:'#60a5fa'}}>📝 {result.language}</div>
                  <div style={{padding:'6px 14px',background:`${COMPLEXITY_COLOR[result.complexity]||'#gray'}22`,border:`1px solid ${COMPLEXITY_COLOR[result.complexity]||'gray'}44`,borderRadius:20,fontSize:12,color:COMPLEXITY_COLOR[result.complexity]||'#gray'}}>⚡ {result.complexity}</div>
                  {(result.concepts||[]).slice(0,4).map((c:string)=><div key={c} style={{padding:'4px 10px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:11,color:'var(--fg-text3)'}}>{c}</div>)}
                </div>
                <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:14,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:6,textTransform:'uppercase'}}>Summary</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.6}}>{result.summary}</div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:10,textTransform:'uppercase'}}>Line-by-Line Breakdown</div>
                  {(result.lines||[]).map((l:any,i:number)=><div key={i} style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr',gap:0,marginBottom:6,background:'var(--fg-bg2)',borderRadius:8,overflow:'hidden',border:'1px solid var(--fg-border)'}}>
                    <div style={{padding:'8px 10px',background:'#1e1e2e',borderRight:'1px solid var(--fg-border)',fontFamily:'monospace',fontSize:11,color:'#94a3b8',minWidth:80}}>{l.line_range}</div>
                    <div style={{padding:'8px 10px',borderRight:'1px solid var(--fg-border)',fontSize:12,color:'var(--fg-text)',fontFamily:'monospace',background:'#0f0f1a'}}><code>{l.code}</code></div>
                    <div style={{padding:'8px 10px',fontSize:12,color:'var(--fg-text2)',lineHeight:1.4}}>{l.explanation} {l.concept&&<span style={{fontSize:10,padding:'2px 6px',background:'#7c3aed22',border:'1px solid #7c3aed44',borderRadius:10,color:'#a78bfa',marginLeft:4}}>{l.concept}</span>}</div>
                  </div>)}
                </div>
                {result.suggested_improvements?.length>0 && <div style={{background:'#22c55e11',border:'1px solid #22c55e33',borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#4ade80',marginBottom:8,textTransform:'uppercase'}}>💡 Improvement Suggestions</div>
                  {result.suggested_improvements.map((s:string,i:number)=><div key={i} style={{fontSize:13,color:'var(--fg-text)',marginBottom:4}}>• {s}</div>)}
                </div>}
              </div>}
              {history.length>0 && !result && <div style={{marginTop:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Recent</div>
                {history.slice(0,5).map((h:any)=><div key={h.id} onClick={()=>setCode(h.code)} style={{padding:'8px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:4,cursor:'pointer',fontSize:12,color:'var(--fg-text3)'}}>{h.language} · {h.code?.slice(0,60)}… <span style={{color:'var(--fg-text4)'}}>{h.created_at?.slice(0,10)}</span></div>)}
              </div>}
            </div>
          </div>);
}

export function ForgeTab_ideavalidator() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [idea, setIdea] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/idea/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const VERDICT_COLOR:Record<string,string>={pass:'#22c55e',promising:'#f59e0b',fail:'#ef4444'};
          const scoreColor=(s:number)=>s>=70?'#22c55e':s>=40?'#f59e0b':'#ef4444';
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:800,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>💡 Idea Validator</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Get a brutally honest VC-style analysis of your startup or project idea.</div>
              <div style={{display:'flex',gap:10,marginBottom:16}}>
                <textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Describe your idea in 1-3 sentences…" rows={3} style={{flex:1,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:14,resize:'none',boxSizing:'border-box'}} />
                <button disabled={loading||!idea.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/idea/validate`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({idea})});const d=await r.json();setResult(d);}catch(e:any){alert(e.message);}setLoading(false);}} style={{padding:'0 20px',background:'#f59e0b',border:'none',borderRadius:10,color:'#000',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!idea.trim()?0.5:1,alignSelf:'stretch'}}>{loading?'Analyzing…':'🔍 Validate'}</button>
              </div>
              {result && <div>
                <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
                  <div style={{textAlign:'center',background:'var(--fg-bg2)',border:`2px solid ${scoreColor(result.score)}`,borderRadius:16,padding:'20px 28px'}}>
                    <div style={{fontSize:48,fontWeight:900,color:scoreColor(result.score),lineHeight:1}}>{result.score}</div>
                    <div style={{fontSize:11,color:'var(--fg-text3)',marginTop:4}}>SCORE / 100</div>
                  </div>
                  <div style={{flex:1,background:'var(--fg-bg2)',border:`1px solid ${VERDICT_COLOR[result.verdict]||'var(--fg-border)'}44`,borderRadius:16,padding:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:VERDICT_COLOR[result.verdict]||'var(--fg-text3)',marginBottom:6,textTransform:'uppercase'}}>Verdict: {result.verdict}</div>
                    <div style={{fontSize:15,color:'var(--fg-text)',fontStyle:'italic',lineHeight:1.5}}>"{result.one_liner}"</div>
                    <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:11,color:'var(--fg-text3)'}}>Market: {result.market_size}</span>
                      <span style={{fontSize:11,color:'var(--fg-text3)'}}>Revenue in: {result.timeline_to_revenue}</span>
                    </div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
                  {[{title:'✅ Strengths',items:result.strengths,color:'#22c55e'},{title:'⚠️ Weaknesses',items:result.weaknesses,color:'#f59e0b'},{title:'🚨 Risks',items:result.risks,color:'#ef4444'}].map(s=>(
                    <div key={s.title} style={{background:'var(--fg-bg2)',border:`1px solid ${s.color}33`,borderRadius:10,padding:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:s.color,marginBottom:8}}>{s.title}</div>
                      {(s.items||[]).map((item:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:4}}>• {item}</div>)}
                    </div>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#60a5fa',marginBottom:8}}>🎯 Key Advice</div>
                    <div style={{fontSize:13,color:'var(--fg-text)',lineHeight:1.6}}>{result.advice}</div>
                  </div>
                  <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#a78bfa',marginBottom:8}}>🔄 Suggested Pivot</div>
                    <div style={{fontSize:13,color:'var(--fg-text)',lineHeight:1.6}}>{result.pivot||'No pivot suggested — stay the course.'}</div>
                  </div>
                </div>
                {result.competition?.length>0 && <div style={{marginTop:12,background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:6}}>⚔️ Competition</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{result.competition.map((c:string)=><span key={c} style={{padding:'3px 10px',background:'var(--fg-bg3)',borderRadius:16,fontSize:12,color:'var(--fg-text2)'}}>{c}</span>)}</div>
                </div>}
              </div>}
              {history.length>0 && !result && <div style={{marginTop:20}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em'}}>Recent Validations</div>
                {history.map((h:any)=><div key={h.id} onClick={()=>setIdea(h.idea)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:6,cursor:'pointer'}}>
                  <span style={{fontSize:18,fontWeight:900,color:scoreColor(h.score)}}>{h.score}</span>
                  <div style={{flex:1,fontSize:13,color:'var(--fg-text)'}}>{h.idea?.slice(0,80)}{h.idea?.length>80?'…':''}</div>
                  <span style={{fontSize:11,color:'var(--fg-text3)'}}>{h.created_at?.slice(0,10)}</span>
                </div>)}
              </div>}
            </div>
          </div>);
}

export function ForgeTab_tonerewriter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [text, setText] = React.useState('');
          const [tone, setTone] = React.useState('professional');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/tone/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const TONES = [{id:'professional',emoji:'👔',label:'Professional'},{id:'casual',emoji:'😊',label:'Casual'},{id:'brutal',emoji:'🔥',label:'Brutal'},{id:'poetic',emoji:'🌸',label:'Poetic'},{id:'academic',emoji:'🎓',label:'Academic'},{id:'humorous',emoji:'😂',label:'Humorous'},{id:'persuasive',emoji:'💪',label:'Persuasive'},{id:'simple',emoji:'🧒',label:'Simple'}];
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:800,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>🎨 Tone Rewriter</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Rewrite any text in 8 different tones. Same message, different voice.</div>
              <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
                {TONES.map(t=><button key={t.id} onClick={()=>setTone(t.id)} style={{padding:'6px 14px',background:tone===t.id?'var(--fg-orange)':'var(--fg-bg2)',border:tone===t.id?'1px solid var(--fg-orange)':'1px solid var(--fg-border)',borderRadius:20,color:tone===t.id?'#fff':'var(--fg-text2)',fontSize:12,fontWeight:tone===t.id?600:400,cursor:'pointer'}}>{t.emoji} {t.label}</button>)}
              </div>
              <div style={{display:'flex',gap:12,marginBottom:16}}>
                <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text to rewrite…" rows={5} style={{flex:1,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:14,resize:'vertical',boxSizing:'border-box'}} />
              </div>
              <button disabled={loading||!text.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/tone/rewrite`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({text,tone})});const d=await r.json();setResult(d);}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'var(--fg-orange)',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!text.trim()?0.5:1,marginBottom:20}}>{loading?'Rewriting…':'🎨 Rewrite'}</button>
              {result && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase'}}>Original ({result.word_count_original} words)</div>
                  <div style={{fontSize:13,color:'var(--fg-text2)',lineHeight:1.7}}>{text}</div>
                </div>
                <div style={{background:'linear-gradient(135deg,var(--fg-bg2),var(--fg-bg3))',border:'1px solid var(--fg-orange)44',borderRadius:10,padding:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-orange)',marginBottom:8,textTransform:'uppercase'}}>{TONES.find(t=>t.id===tone)?.emoji} {TONES.find(t=>t.id===tone)?.label} version</div>
                  <div style={{fontSize:13,color:'var(--fg-text)',lineHeight:1.7,marginBottom:12}}>{result.rewritten}</div>
                  <button onClick={()=>navigator.clipboard.writeText(result.rewritten)} style={{padding:'4px 12px',background:'var(--fg-bg3)',border:'1px solid var(--fg-border)',borderRadius:6,color:'var(--fg-text3)',fontSize:11,cursor:'pointer'}}>📋 Copy</button>
                </div>
              </div>}
              {result && <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12,marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:6}}>What changed</div>
                <div style={{fontSize:13,color:'var(--fg-text)',lineHeight:1.6}}>{result.changes}</div>
              </div>}
              {history.length>0 && <div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>History</div>
                {history.map((h:any)=><div key={h.id} onClick={()=>setText(h.original)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:4,cursor:'pointer'}}>
                  <span style={{fontSize:14}}>{TONES.find(t=>t.id===h.tone)?.emoji||'🎨'}</span>
                  <span style={{fontSize:12,color:'var(--fg-text2)',flex:1}}>{h.original?.slice(0,60)}…</span>
                  <span style={{fontSize:11,color:'var(--fg-text3)',padding:'2px 8px',background:'var(--fg-bg3)',borderRadius:10}}>{h.tone}</span>
                </div>)}
              </div>}
            </div>
          </div>);
}

export function ForgeTab_resumebuilder() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [experience, setExperience] = React.useState('');
          const [jobDesc, setJobDesc] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          const [view, setView] = React.useState<'build'|'preview'>('build');
          React.useEffect(()=>{fetch(`${API}/api/resume/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const scoreColor=(s:number)=>s>=80?'#22c55e':s>=60?'#f59e0b':'#ef4444';
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:900,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>📄 Resume Builder</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>AI tailors your resume to any job description. ATS-optimized, keyword-matched.</div>
              {!result ? (<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--fg-text2)',marginBottom:6}}>Your Experience & Background</div>
                  <textarea value={experience} onChange={e=>setExperience(e.target.value)} placeholder="Paste your work history, skills, education, projects…" rows={12} style={{width:'100%',padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,resize:'vertical',boxSizing:'border-box'}} />
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--fg-text2)',marginBottom:6}}>Target Job Description</div>
                  <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste the job description you\'re applying for…" rows={12} style={{width:'100%',padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,resize:'vertical',boxSizing:'border-box'}} />
                </div>
              </div>) : null}
              {!result && <button disabled={loading||!experience.trim()||!jobDesc.trim()} onClick={async()=>{setLoading(true);try{const r=await fetch(`${API}/api/resume/build`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({experience,job_desc:jobDesc})});const d=await r.json();setResult(d);setView('preview');saveToolHistory('resumebuilder','Resume Builder',{experience:experience.slice(0,200),job_desc:jobDesc.slice(0,200)},d.resume?.slice(0,500)||'');}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'#3b82f6',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!experience.trim()||!jobDesc.trim()?0.5:1}}>{loading?'Building resume…':'📄 Build Resume'}</button>}
              {result && <div>
                <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
                  <div style={{textAlign:'center',background:'var(--fg-bg2)',border:`2px solid ${scoreColor(result.score)}`,borderRadius:12,padding:'12px 20px'}}>
                    <div style={{fontSize:36,fontWeight:900,color:scoreColor(result.score),lineHeight:1}}>{result.score}</div>
                    <div style={{fontSize:10,color:'var(--fg-text3)'}}>MATCH SCORE</div>
                  </div>
                  <div style={{flex:1,display:'flex',gap:8,flexWrap:'wrap'}}>
                    {(result.keywords_used||[]).slice(0,8).map((k:string)=><span key={k} style={{padding:'3px 10px',background:'#3b82f622',border:'1px solid #3b82f644',borderRadius:16,fontSize:11,color:'#60a5fa'}}>{k}</span>)}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    {(['preview','build'] as const).map(v=><button key={v} onClick={()=>setView(v)} style={{padding:'6px 14px',background:view===v?'var(--fg-orange)':'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:view===v?'#fff':'var(--fg-text2)',fontSize:12,cursor:'pointer'}}>{v==='preview'?'📄 Resume':'✏️ Edit'}</button>)}
                    <button onClick={()=>navigator.clipboard.writeText(result.resume)} style={{padding:'6px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text2)',fontSize:12,cursor:'pointer'}}>📋 Copy</button>
                    <button onClick={()=>{setResult(null);setView('build');}} style={{padding:'6px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text2)',fontSize:12,cursor:'pointer'}}>🔄 New</button>
                  </div>
                </div>
                {view==='preview' && <div style={{background:'#fff',color:'#111',borderRadius:10,padding:28,fontFamily:'Georgia,serif',fontSize:14,lineHeight:1.7,whiteSpace:'pre-wrap',marginBottom:16,minHeight:400}}>{result.resume}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div style={{background:'#22c55e11',border:'1px solid #22c55e33',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#4ade80',marginBottom:6}}>✅ Why You Match</div>
                    {(result.match_reasons||[]).map((r:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {r}</div>)}
                  </div>
                  <div style={{background:'#f59e0b11',border:'1px solid #f59e0b33',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#fbbf24',marginBottom:6}}>⚠️ Gaps to Address</div>
                    {(result.gaps||[]).map((g:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {g}</div>)}
                  </div>
                </div>
              </div>}
              {history.length>0 && !result && <div style={{marginTop:24}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Past Resumes</div>
                {history.map((h:any)=><div key={h.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:4,fontSize:13,color:'var(--fg-text2)'}}>
                  <span style={{fontWeight:700,color:scoreColor(h.score)}}>{h.score}</span>
                  <span style={{flex:1}}>{h.job_desc?.slice(0,60)}…</span>
                  <span style={{fontSize:11,color:'var(--fg-text3)'}}>{h.created_at?.slice(0,10)}</span>
                </div>)}
              </div>}
            </div>
          </div>);
}

export function ForgeTab_emailnegotiator() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [original, setOriginal] = React.useState('');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/negotiate/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const RISK_COLOR:Record<string,string>={low:'#22c55e',medium:'#f59e0b',high:'#ef4444'};
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:800,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>🤝 Email Negotiator</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Paste any offer, contract, or email. AI drafts the perfect counter-response.</div>
              {!result ? (<>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--fg-text2)',marginBottom:6}}>Original Email / Offer</div>
                  <textarea value={original} onChange={e=>setOriginal(e.target.value)} placeholder="Paste the email or offer you received…" rows={8} style={{width:'100%',padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,resize:'vertical',boxSizing:'border-box'}} />
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--fg-text2)',marginBottom:6}}>Context (optional)</div>
                  <input value={context} onChange={e=>setContext(e.target.value)} placeholder="e.g. 'salary negotiation, I have 2 competing offers' or 'vendor contract renewal'" style={{width:'100%',padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,boxSizing:'border-box'}} />
                </div>
                <button disabled={loading||!original.trim()} onClick={async()=>{setLoading(true);try{const r=await fetch(`${API}/api/negotiate/email`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({original,context})});const d=await r.json();setResult(d);saveToolHistory('emailnegotiator','Email Negotiator',{original,context},d.counter_email||'');}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'#22c55e',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!original.trim()?0.5:1}}>{loading?'Drafting counter…':'🤝 Generate Counter'}</button>
              </>) : (<div>
                <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                  <span style={{padding:'4px 12px',background:RISK_COLOR[result.risk]+'22',border:`1px solid ${RISK_COLOR[result.risk]}44`,borderRadius:16,fontSize:12,color:RISK_COLOR[result.risk]}}>Risk: {result.risk}</span>
                  <span style={{padding:'4px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text2)'}}>Tone: {result.tone}</span>
                  <button onClick={()=>setResult(null)} style={{padding:'4px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text2)',cursor:'pointer'}}>← New</button>
                </div>
                <div style={{background:'var(--fg-bg2)',border:'1px solid #22c55e44',borderRadius:12,padding:20,marginBottom:16,position:'relative'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#4ade80',marginBottom:10}}>📧 YOUR COUNTER-RESPONSE</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{result.counter_email}</div>
                  <button onClick={()=>navigator.clipboard.writeText(result.counter_email)} style={{position:'absolute',top:12,right:12,padding:'4px 10px',background:'var(--fg-bg3)',border:'1px solid var(--fg-border)',borderRadius:6,color:'var(--fg-text3)',fontSize:11,cursor:'pointer'}}>📋 Copy</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                  <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#60a5fa',marginBottom:6}}>🎯 Tactics Used</div>
                    {(result.tactics||[]).map((t:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {t}</div>)}
                  </div>
                  <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#a78bfa',marginBottom:6}}>💪 Your Leverage</div>
                    {(result.leverage_points||[]).map((l:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {l}</div>)}
                  </div>
                  <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#f59e0b',marginBottom:6}}>🚶 Walk-Away Options</div>
                    {(result.alternatives||[]).map((a:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {a}</div>)}
                  </div>
                </div>
              </div>)}
            </div>
          </div>);
}

export function ForgeTab_storygen2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [premise, setPremise] = React.useState('');
          const [genre, setGenre] = React.useState('fantasy');
          const [storyId, setStoryId] = React.useState<string|null>(null);
          const [storyText, setStoryText] = React.useState('');
          const [choices, setChoices] = React.useState<string[]>([]);
          const [turns, setTurns] = React.useState(0);
          const [loading, setLoading] = React.useState(false);
          const [isEnding, setIsEnding] = React.useState(false);
          const [stories, setStories] = React.useState<any[]>([]);
          const scrollRef = React.useRef<HTMLDivElement>(null);
          React.useEffect(()=>{fetch(`${API}/api/stories`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setStories(d.stories||[])).catch(()=>{});}, []);
          React.useEffect(()=>{if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight;}, [storyText]);
          const GENRES = ['fantasy','sci-fi','thriller','romance','horror','mystery','comedy','adventure'];
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:800,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>📖 Story Generator</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Interactive AI fiction. You choose what happens next.</div>
              {!storyId ? (<>
                <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
                  {GENRES.map(g=><button key={g} onClick={()=>setGenre(g)} style={{padding:'6px 14px',background:genre===g?'var(--fg-orange)':'var(--fg-bg2)',border:`1px solid ${genre===g?'var(--fg-orange)':'var(--fg-border)'}`,borderRadius:20,color:genre===g?'#fff':'var(--fg-text2)',fontSize:12,cursor:'pointer'}}>{g}</button>)}
                </div>
                <textarea value={premise} onChange={e=>setPremise(e.target.value)} placeholder="Enter your story premise… (e.g. 'A time traveler accidentally prevents their own birth')" rows={3} style={{width:'100%',padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:14,resize:'none',boxSizing:'border-box',marginBottom:12}} />
                <button disabled={loading||!premise.trim()} onClick={async()=>{setLoading(true);try{const r=await fetch(`${API}/api/story/start`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({premise,genre})});const d=await r.json();setStoryId(d.id);setStoryText(d.opening);setChoices(d.choices||[]);setTurns(0);}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'var(--fg-orange)',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!premise.trim()?0.5:1}}>{loading?'Generating…':'📖 Begin Story'}</button>
                {stories.length>0 && <div style={{marginTop:20}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Past Stories</div>
                  {stories.map((s:any)=><div key={s.id} style={{padding:'8px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:4,fontSize:13,color:'var(--fg-text2)'}}>📖 {s.premise?.slice(0,60)}… <span style={{fontSize:11,color:'var(--fg-text3)'}}>· {s.genre} · {s.turns} turns</span></div>)}
                </div>}
              </>) : (<div>
                <div ref={scrollRef} style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:12,padding:20,marginBottom:16,maxHeight:400,overflowY:'auto'}}>
                  <div style={{fontSize:12,color:'var(--fg-text3)',marginBottom:10}}>Turn {turns} · {genre}</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{storyText}</div>
                </div>
                {!isEnding && choices.length>0 && <div>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:10}}>What happens next?</div>
                  {choices.map((c:string,i:number)=><button key={i} disabled={loading} onClick={async()=>{setLoading(true);try{const r=await fetch(`${API}/api/story/${storyId}/continue`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({choice:c})});const d=await r.json();setStoryText(d.full_story);setChoices(d.choices||[]);setTurns(d.turns);setIsEnding(d.is_ending||false);}catch(e:any){alert(e.message);}setLoading(false);}} style={{display:'block',width:'100%',padding:'12px 16px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,cursor:'pointer',marginBottom:8,textAlign:'left',opacity:loading?0.5:1,transition:'border-color 0.15s'}}>{loading?'Writing…':c}</button>)}
                </div>}
                {isEnding && <div style={{textAlign:'center',padding:24,background:'linear-gradient(135deg,#7c3aed22,#f59e0b22)',borderRadius:12,border:'1px solid #7c3aed44'}}>
                  <div style={{fontSize:24,marginBottom:8}}>🏆 THE END</div>
                  <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:16}}>Your story is complete ({turns} turns)</div>
                  <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                    <button onClick={()=>navigator.clipboard.writeText(storyText)} style={{padding:'8px 16px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text2)',fontSize:12,cursor:'pointer'}}>📋 Copy Story</button>
                    <button onClick={()=>{setStoryId(null);setStoryText('');setChoices([]);setTurns(0);setIsEnding(false);setPremise('');}} style={{padding:'8px 16px',background:'var(--fg-orange)',border:'none',borderRadius:8,color:'#fff',fontSize:12,cursor:'pointer'}}>📖 New Story</button>
                  </div>
                </div>}
              </div>)}
            </div>
          </div>);
}

export function ForgeTab_meetingsum() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [transcript, setTranscript] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/meeting/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const SENTIMENT_COLOR:Record<string,string>={positive:'#22c55e',neutral:'#60a5fa',negative:'#ef4444'};
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:800,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>📋 Meeting Summarizer</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Paste any meeting transcript → instant action items, decisions, and summary.</div>
              {!result ? (<>
                <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste your meeting transcript or notes here…" rows={12} style={{width:'100%',padding:'12px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,resize:'vertical',boxSizing:'border-box',marginBottom:12}} />
                <button disabled={loading||!transcript.trim()} onClick={async()=>{setLoading(true);try{const r=await fetch(`${API}/api/meeting/summarize`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({transcript})});const d=await r.json();setResult(d);}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'#7c3aed',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!transcript.trim()?0.5:1}}>{loading?'Summarizing…':'📋 Summarize Meeting'}</button>
              </>) : (<div>
                <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{padding:'4px 12px',background:SENTIMENT_COLOR[result.sentiment]+'22',border:`1px solid ${SENTIMENT_COLOR[result.sentiment]}44`,borderRadius:16,fontSize:12,color:SENTIMENT_COLOR[result.sentiment]}}>Mood: {result.sentiment}</span>
                  {result.duration_estimate && <span style={{padding:'4px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text3)'}}>~{result.duration_estimate} min</span>}
                  <button onClick={()=>setResult(null)} style={{padding:'4px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text2)',cursor:'pointer',marginLeft:'auto'}}>← New</button>
                </div>
                <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:16,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase'}}>Summary</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.6}}>{result.summary}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                  <div style={{background:'var(--fg-bg2)',border:'1px solid #3b82f644',borderRadius:10,padding:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#60a5fa',marginBottom:10}}>✅ Action Items ({(result.action_items||[]).length})</div>
                    {(result.action_items||[]).map((a:any,i:number)=><div key={i} style={{padding:'8px',background:'var(--fg-bg3)',borderRadius:6,marginBottom:6}}>
                      <div style={{fontSize:13,color:'var(--fg-text)',fontWeight:500}}>{a.task}</div>
                      <div style={{fontSize:11,color:'var(--fg-text3)',marginTop:2}}>{a.owner && `👤 ${a.owner}`}{a.deadline && ` · 📅 ${a.deadline}`}</div>
                    </div>)}
                    {(result.action_items||[]).length===0 && <div style={{fontSize:12,color:'var(--fg-text3)'}}>No action items identified</div>}
                  </div>
                  <div style={{background:'var(--fg-bg2)',border:'1px solid #7c3aed44',borderRadius:10,padding:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#a78bfa',marginBottom:10}}>🔨 Decisions Made</div>
                    {(result.decisions||[]).map((d:string,i:number)=><div key={i} style={{fontSize:13,color:'var(--fg-text)',marginBottom:6,paddingLeft:8,borderLeft:'2px solid #7c3aed44'}}>• {d}</div>)}
                    {(result.decisions||[]).length===0 && <div style={{fontSize:12,color:'var(--fg-text3)'}}>No decisions recorded</div>}
                  </div>
                </div>
                {result.blockers?.length>0 && <div style={{background:'#ef444411',border:'1px solid #ef444433',borderRadius:10,padding:12,marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#f87171',marginBottom:6}}>🚧 Blockers</div>
                  {result.blockers.map((b:string,i:number)=><div key={i} style={{fontSize:13,color:'var(--fg-text)',marginBottom:3}}>• {b}</div>)}
                </div>}
                {result.next_meeting && <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:4}}>🗓 Next Meeting Focus</div>
                  <div style={{fontSize:13,color:'var(--fg-text)'}}>{result.next_meeting}</div>
                </div>}
              </div>)}
              {history.length>0 && !result && <div style={{marginTop:20}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Recent Meetings</div>
                {history.map((h:any)=><div key={h.id} style={{padding:'8px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:4,fontSize:13,color:'var(--fg-text2)'}}>{h.summary?.slice(0,80)}… <span style={{fontSize:11,color:'var(--fg-text3)'}}>{h.created_at?.slice(0,10)}</span></div>)}
              </div>}
            </div>
          </div>);
}
