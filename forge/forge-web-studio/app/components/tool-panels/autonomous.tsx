'use client';
import React from 'react';
import { createAccountLocalState } from '../../../lib/account-local-state';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';
import { utcStamp } from '../../../lib/platform-time';

export function ForgeTab_autonomous() {
  const [goal, setGoal] = React.useState('');
  const [running, setRunning] = React.useState(false);
  const [steps, setSteps] = React.useState<any[]>([]);
  const [plan, setPlan] = React.useState<any[]>([]);
  const [finalResult, setFinalResult] = React.useState('');
  const [taskId, setTaskId] = React.useState<number|null>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [maxSteps, setMaxSteps] = React.useState(6);
  const apiBase = '';
  const token = getToken();
  const stepRef = React.useRef<HTMLDivElement>(null);

  const TOOLS_INFO = [
    { name:'web_search', icon:'🔍', color:'#3b82f6' },
    { name:'think', icon:'🧠', color:'#8b5cf6' },
    { name:'summarize', icon:'📄', color:'#10b981' },
    { name:'write_code', icon:'💻', color:'#f59e0b' },
    { name:'draft_email', icon:'📧', color:'#ef4444' },
    { name:'analyze_data', icon:'📊', color:'#06b6d4' },
    { name:'final_answer', icon:'✅', color:'#16a34a' },
  ];
  const toolMeta = (name: string) => TOOLS_INFO.find(t => t.name === name) || { name, icon:'⚙️', color:'#6b7280' };

  const loadHistory = async () => {
    try {
      const r = await fetch(`${apiBase}/api/autonomous`, { headers:{'Authorization':`Bearer ${token}`} });
      const d = await r.json();
      setHistory(d.rows || []);
    } catch {}
  };

  React.useEffect(() => { loadHistory(); }, []);
  React.useEffect(() => { if (stepRef.current) stepRef.current.scrollTop = stepRef.current.scrollHeight; }, [steps]);

  const runTask = async () => {
    if (!goal.trim() || running) return;
    setRunning(true);
    setSteps([]);
    setPlan([]);
    setFinalResult('');
    setTaskId(null);

    try {
      const resp = await fetch(`${apiBase}/api/autonomous`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ goal, max_steps: maxSteps })
      });

      if (!resp.ok) {
        const err = await resp.json();
        setSteps([{ type:'error', message: err.error || 'Failed to start task' }]);
        setRunning(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(5));
            if (event.type === 'start') setTaskId(event.task_id);
            else if (event.type === 'plan') setPlan(event.steps || []);
            else if (event.type === 'step_start') setSteps(prev => [...prev, { ...event, status:'running' }]);
            else if (event.type === 'step_done') setSteps(prev => prev.map(s => s.step === event.step ? { ...s, ...event, status:'done' } : s));
            else if (event.type === 'step_error') setSteps(prev => [...prev, { ...event, status:'error' }]);
            else if (event.type === 'done') { setFinalResult(event.result); loadHistory(); }
            else if (event.type === 'error') setSteps(prev => [...prev, { type:'error', message: event.message, status:'error' }]);
          } catch {}
        }
      }
    } catch (e: any) {
      setSteps(prev => [...prev, { type:'error', message: e.message, status:'error' }]);
    }
    setRunning(false);
  };

  const EXAMPLE_GOALS = [
    'Research the latest AI models released in 2025 and summarize the key ones',
    'Write a Python script that scrapes product prices and saves to CSV',
    'Draft a cold email sequence for a B2B SaaS targeting CTOs',
    'Analyze this business idea and give me pros, cons, and next steps: AI coding assistant for non-programmers',
    'Create a 30-day content calendar for a tech startup on LinkedIn',
  ];

  return (
    <div style={{ padding:24, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--fg-text1)', margin:0 }}>🦾 Autonomous Mode</h2>
        <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'4px 0 0' }}>Give Forge a goal — it plans, uses tools, and executes autonomously. Watch the agent work in real time.</p>
      </div>

      {/* Goal input */}
      <div style={{ padding:20, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:14, marginBottom:16 }}>
        <textarea value={goal} onChange={e=>setGoal(e.target.value)} placeholder="What do you want Forge to accomplish autonomously?&#10;&#10;e.g. Research the best marketing strategies for a SaaS startup and write me an action plan"
          style={{ width:'100%', minHeight:90, padding:'10px 12px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, color:'var(--fg-text1)', fontSize:14, resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
        <div style={{ display:'flex', gap:10, marginTop:10, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <label style={{ fontSize:12, color:'var(--fg-text3)' }}>Max steps:</label>
            {[3,5,8,12].map(n => (
              <button key={n} onClick={()=>setMaxSteps(n)} style={{ padding:'3px 10px', background:maxSteps===n?'#8b5cf6':'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, color:maxSteps===n?'#fff':'var(--fg-text3)', cursor:'pointer', fontSize:12 }}>{n}</button>
            ))}
          </div>
          <button onClick={runTask} disabled={!goal.trim() || running} style={{ marginLeft:'auto', padding:'10px 24px', background:running?'#6b7280':'#8b5cf6', border:'none', borderRadius:10, color:'#fff', cursor:running?'not-allowed':'pointer', fontSize:14, fontWeight:700 }}>
            {running ? '⏳ Running...' : '🚀 Run Autonomously'}
          </button>
        </div>

        {/* Example goals */}
        {!running && !finalResult && (
          <div style={{ marginTop:12 }}>
            <p style={{ fontSize:11, color:'var(--fg-text3)', margin:'0 0 6px' }}>Example goals:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {EXAMPLE_GOALS.map((eg, i) => (
                <button key={i} onClick={()=>setGoal(eg)} style={{ padding:'4px 10px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:20, color:'var(--fg-text2)', cursor:'pointer', fontSize:11 }}>{eg.slice(0,50)}…</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Available tools */}
      {!running && steps.length === 0 && (
        <div style={{ padding:14, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12, marginBottom:16 }}>
          <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:600, color:'var(--fg-text1)' }}>Available Tools</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {TOOLS_INFO.map(t => (
              <span key={t.name} style={{ padding:'4px 10px', background:`${t.color}18`, border:`1px solid ${t.color}40`, borderRadius:20, fontSize:12, color:t.color, fontWeight:600 }}>{t.icon} {t.name.replace('_',' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* Execution stream */}
      {(running || steps.length > 0) && (
        <div style={{ marginBottom:16 }}>
          {plan.length > 0 && (
            <div style={{ padding:14, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12, marginBottom:12 }}>
              <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:600, color:'var(--fg-text1)' }}>📋 Execution Plan ({plan.length} steps)</p>
              <div style={{ display:'grid', gap:4 }}>
                {plan.map((s, i) => {
                  const tm = toolMeta(s.tool);
                  const done = steps.some(st => st.step === s.step && st.status === 'done');
                  const active = running && steps.some(st => st.step === s.step && st.status === 'running');
                  return (
                    <div key={i} style={{ display:'flex', gap:8, alignItems:'center', opacity: done ? 0.6 : 1 }}>
                      <span style={{ fontSize:12, color: done?'#10b981':active?tm.color:'var(--fg-text3)', fontWeight:done||active?700:400 }}>{done?'✅':active?'⏳':'○'}</span>
                      <span style={{ fontSize:12, color:tm.color }}>{tm.icon}</span>
                      <span style={{ fontSize:12, color:'var(--fg-text2)' }}>{s.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={stepRef} style={{ maxHeight:400, overflowY:'auto', display:'grid', gap:8 }}>
            {steps.map((s, i) => {
              const tm = toolMeta(s.tool);
              return (
                <div key={i} style={{ padding:14, background:s.status==='error'?'rgba(239,68,68,0.08)':'var(--bg-surface)', border:`1px solid ${s.status==='error'?'#ef444440':s.status==='done'?`${tm.color}40`:'var(--border)'}`, borderRadius:10 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:s.result?8:0 }}>
                    <span style={{ fontSize:16 }}>{s.status==='running'?'⏳':s.status==='error'?'❌':tm.icon}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:tm.color }}>Step {s.step}: {(s.tool||'').replace(/_/g,' ')}</span>
                    {s.latency_ms && <span style={{ fontSize:11, color:'var(--fg-text3)', marginLeft:'auto' }}>{s.latency_ms}ms</span>}
                  </div>
                  {s.description && <p style={{ margin:'0 0 6px', fontSize:12, color:'var(--fg-text3)' }}>{s.description}</p>}
                  {s.result && <pre style={{ margin:0, fontSize:12, color:'var(--fg-text1)', whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:200, overflowY:'auto', background:'var(--bg-surface2)', padding:'8px 10px', borderRadius:6 }}>{s.result.slice(0,1500)}{s.result.length>1500?'…':''}</pre>}
                  {s.message && <p style={{ margin:0, fontSize:12, color:'#ef4444' }}>{s.message}</p>}
                </div>
              );
            })}
            {running && steps.length > 0 && steps[steps.length-1]?.status !== 'running' && (
              <div style={{ padding:12, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:16 }}>⏳</span><span style={{ fontSize:13, color:'var(--fg-text3)' }}>Waiting for next step…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final result */}
      {finalResult && (
        <div style={{ padding:20, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:14, marginBottom:16 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:20 }}>✅</span>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#10b981' }}>Task Complete {taskId ? `(#${taskId})` : ''}</h3>
            <button onClick={()=>{setGoal('');setFinalResult('');setSteps([]);setPlan([]);setTaskId(null);}} style={{ marginLeft:'auto', padding:'4px 12px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, color:'var(--fg-text2)', cursor:'pointer', fontSize:12 }}>New Task</button>
          </div>
          <pre style={{ margin:0, fontSize:13, color:'var(--fg-text1)', whiteSpace:'pre-wrap', wordBreak:'break-word', lineHeight:1.6 }}>{finalResult}</pre>
        </div>
      )}

      {/* Task history */}
      {history.length > 0 && (
        <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
            <h4 style={{ margin:0, fontSize:14, fontWeight:600, color:'var(--fg-text1)' }}>Recent Tasks</h4>
            <button onClick={loadHistory} style={{ marginLeft:'auto', padding:'3px 10px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>↻</button>
          </div>
          <div style={{ display:'grid', gap:6 }}>
            {history.slice(0,10).map((t: any) => (
              <div key={t.id} onClick={()=>{setGoal(t.goal);setFinalResult(t.result||'');setSteps([]);setPlan([]);}} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center', padding:'8px 10px', background:'var(--bg-surface2)', borderRadius:8, cursor:'pointer' }}>
                <span style={{ fontSize:14 }}>{t.status==='completed'?'✅':t.status==='failed'?'❌':'⏳'}</span>
                <div>
                  <p style={{ margin:0, fontSize:13, color:'var(--fg-text1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:500 }}>{t.goal}</p>
                  <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{t.steps_completed} steps · {new Date(utcStamp(t.created_at)).toLocaleDateString()}</p>
                </div>
                <span style={{ fontSize:11, color:t.status==='completed'?'#10b981':'#6b7280', fontWeight:600 }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ForgeTab_routerinsights() {
  const [decisions, setDecisions] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [savings, setSavings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [testPrompt, setTestPrompt] = React.useState('');
  const [testResult, setTestResult] = React.useState<any>(null);
  const [testMode, setTestMode] = React.useState<'cheap'|'normal'|'premium'>('normal');
  const [feedbackMap, setFeedbackMap] = React.useState<Record<number,number>>({});
  const apiBase = '';
  const token = getToken();

  const load = async () => {
    setLoading(true);
    try {
      const [d, s, sv] = await Promise.all([
        fetch(`${apiBase}/api/forgerouter/decisions`, { headers:{'Authorization':`Bearer ${token}`} }).then(r=>r.json()),
        fetch(`${apiBase}/api/forgerouter/stats`, { headers:{'Authorization':`Bearer ${token}`} }).then(r=>r.json()),
        fetch(`${apiBase}/api/router/savings`, { headers:{'Authorization':`Bearer ${token}`} }).then(r=>r.json()),
      ]);
      setDecisions(d.rows || []);
      setStats(s);
      setSavings(sv);
      // pre-populate feedback from existing rows
      const fm: Record<number,number> = {};
      for (const row of (d.rows || [])) { if (row.feedback_score != null) fm[row.id] = row.feedback_score; }
      setFeedbackMap(fm);
    } catch {}
    setLoading(false);
  };

  const testRouter = async () => {
    if (!testPrompt.trim()) return;
    try {
      const r = await fetch(`${apiBase}/api/forgerouter/decide`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ prompt: testPrompt, cost_mode: testMode }) });
      const d = await r.json();
      setTestResult(d);
      load();
    } catch(e: any) { setTestResult({ error: e.message }); }
  };

  const sendFeedback = async (decisionId: number, score: number) => {
    setFeedbackMap(prev => ({ ...prev, [decisionId]: score }));
    await fetch(`${apiBase}/api/router/feedback`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ decision_id: decisionId, score }) });
  };

  React.useEffect(() => { load(); }, []);

  const tierColor = (tier: string) => {
    if (!tier) return '#6b7280';
    if (tier.includes('expert')) return '#8b5cf6';
    if (tier.includes('hard')) return '#ef4444';
    if (tier.includes('medium')) return '#f59e0b';
    return '#10b981';
  };

  const tierFromReason = (reasoning: string) => {
    const m = reasoning?.match(/\[(\w+)\]/);
    return m ? m[1] : 'unknown';
  };

  const total = decisions.length;
  const avgLatency = stats?.avg_latency_ms || 0;
  const avgConfidence = total > 0 ? (decisions.reduce((s, d) => s + (d.confidence || 0), 0) / total * 100).toFixed(0) : '0';
  const feedbackScore = stats?.feedback?.avg_score != null ? Math.round((stats.feedback.avg_score + 1) / 2 * 100) : null;

  return (
    <div style={{ padding:24, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:'var(--fg-text1)', margin:0 }}>🧠 Router Intelligence</h2>
          <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'4px 0 0' }}>Live flywheel data — every routing decision logged with tier, model, latency and feedback</p>
        </div>
        <button onClick={load} disabled={loading} style={{ padding:'8px 18px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text2)', cursor:'pointer', fontSize:13 }}>{loading ? '⏳' : '↻ Refresh'}</button>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Decisions', value: stats?.total || total, icon:'📊', color:'#3b82f6' },
          { label:'Avg Latency', value: `${avgLatency}ms`, icon:'⚡', color:'#10b981' },
          { label:'Avg Confidence', value: `${avgConfidence}%`, icon:'🎯', color:'#8b5cf6' },
          { label:'Models Used', value: stats?.by_model?.length || 0, icon:'🤖', color:'#f59e0b' },
          { label:'User Rating', value: feedbackScore != null ? `${feedbackScore}%` : '—', icon:'⭐', color:'#ef4444' },
        ].map(k => (
          <div key={k.label} style={{ padding:14, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:20 }}>{k.icon}</div>
            <div style={{ fontSize:20, fontWeight:700, color:k.color, margin:'4px 0' }}>{k.value}</div>
            <div style={{ fontSize:11, color:'var(--fg-text3)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Savings panel */}
      {savings && savings.total_decisions > 0 && (
        <div style={{ padding:16, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:12, marginBottom:16 }}>
          <h4 style={{ margin:'0 0 12px', color:'#10b981', fontSize:14 }}>💰 Estimated Cost Savings vs Always-Using-Opus</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#10b981' }}>${savings.estimated_savings.toFixed(4)}</div>
              <div style={{ fontSize:11, color:'var(--fg-text3)' }}>Saved ({savings.savings_pct}%)</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--fg-text1)' }}>${savings.estimated_actual_cost.toFixed(4)}</div>
              <div style={{ fontSize:11, color:'var(--fg-text3)' }}>Actual Cost</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#6b7280' }}>${savings.estimated_premium_cost.toFixed(4)}</div>
              <div style={{ fontSize:11, color:'var(--fg-text3)' }}>If Always-Opus</div>
            </div>
          </div>
          <p style={{ margin:'10px 0 0', fontSize:11, color:'var(--fg-text3)', textAlign:'center' }}>{savings.note}</p>
        </div>
      )}

      {/* Tier distribution from stats */}
      {stats?.by_tier && stats.by_tier.length > 0 && (
        <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12, marginBottom:16 }}>
          <h4 style={{ margin:'0 0 12px', color:'var(--fg-text1)', fontSize:14 }}>Complexity Tier Distribution</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {stats.by_tier.map((t: any) => (
              <div key={t.tier} style={{ flex:1, minWidth:80, padding:12, background:`${tierColor(t.tier)}15`, border:`1px solid ${tierColor(t.tier)}40`, borderRadius:10, textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:700, color:tierColor(t.tier) }}>{t.count}</div>
                <div style={{ fontSize:12, color:tierColor(t.tier), fontWeight:600 }}>{t.tier}</div>
                <div style={{ fontSize:11, color:'var(--fg-text3)' }}>{stats.total > 0 ? Math.round(t.count/stats.total*100) : 0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model breakdown from stats */}
      {stats?.by_model && stats.by_model.length > 0 && (
        <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12, marginBottom:16 }}>
          <h4 style={{ margin:'0 0 12px', color:'var(--fg-text1)', fontSize:14 }}>Model Selection Frequency</h4>
          <div style={{ display:'grid', gap:8 }}>
            {stats.by_model.slice(0,8).map((m: any) => {
              const pct = stats.total > 0 ? Math.round(m.count/stats.total*100) : 0;
              const modelCost = savings?.by_model?.find((b: any) => b.model === m.selected_model);
              return (
                <div key={m.selected_model} style={{ display:'grid', gridTemplateColumns:'1fr auto 60px', alignItems:'center', gap:8 }}>
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--fg-text1)' }}>{m.selected_model}</span>
                      {modelCost && <span style={{ fontSize:11, color:'var(--fg-text3)' }}>${modelCost.cost_per_1k}/1k tok</span>}
                    </div>
                    <div style={{ height:4, background:'var(--bg-surface2)', borderRadius:2, marginTop:4 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'var(--fg-orange)', borderRadius:2 }} />
                    </div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--fg-text1)', whiteSpace:'nowrap' }}>×{m.count}</span>
                  <span style={{ fontSize:12, color:'var(--fg-text3)', textAlign:'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live router test */}
      <div style={{ padding:16, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:12, marginBottom:16 }}>
        <h4 style={{ margin:'0 0 12px', color:'#8b5cf6', fontSize:14 }}>🧪 Live Router Test</h4>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          {(['cheap','normal','premium'] as const).map(m => (
            <button key={m} onClick={()=>setTestMode(m)} style={{ padding:'5px 14px', background:testMode===m?'#8b5cf6':'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:20, color:testMode===m?'#fff':'var(--fg-text3)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              {m==='cheap'?'💸':m==='premium'?'💎':'⚡'} {m}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={testPrompt} onChange={e=>setTestPrompt(e.target.value)} placeholder="Type any prompt to see how the router classifies it..." style={{ flex:1, padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:13 }} onKeyDown={e=>e.key==='Enter'&&testRouter()} />
          <button onClick={testRouter} disabled={!testPrompt.trim()} style={{ padding:'8px 18px', background:'#8b5cf6', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Route →</button>
        </div>
        {testResult && !testResult.error && (
          <div style={{ marginTop:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
              <div style={{ padding:10, background:'var(--bg-surface)', borderRadius:8 }}>
                <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>Tier Classified</p>
                <p style={{ margin:'2px 0 0', fontWeight:700, color:tierColor(testResult.tier||''), fontSize:15 }}>{testResult.tier || testResult.classified?.tier || '—'}</p>
                <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{testResult.reason || testResult.classified?.reason}</p>
              </div>
              <div style={{ padding:10, background:'var(--bg-surface)', borderRadius:8 }}>
                <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>Selected Model</p>
                <p style={{ margin:'2px 0 0', fontWeight:700, color:'var(--fg-text1)', fontSize:13 }}>{testResult.selected_model}</p>
                <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{testResult.selected_provider}</p>
              </div>
              <div style={{ padding:10, background:'var(--bg-surface)', borderRadius:8 }}>
                <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>Score / Signals</p>
                <p style={{ margin:'2px 0 0', fontWeight:700, color:'#10b981', fontSize:15 }}>score {testResult.classified?.score ?? '—'}</p>
                <p style={{ margin:0, fontSize:10, color:'var(--fg-text3)', lineHeight:1.4 }}>{(testResult.classified?.signals || []).slice(0,4).join(' · ')}</p>
              </div>
            </div>
          </div>
        )}
        {testResult?.error && <p style={{ margin:'8px 0 0', fontSize:13, color:'#ef4444' }}>{testResult.error}</p>}
      </div>

      {/* Recent decisions log with feedback */}
      <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
        <h4 style={{ margin:'0 0 12px', color:'var(--fg-text1)', fontSize:14 }}>Recent Routing Decisions <span style={{ fontSize:11, color:'var(--fg-text3)', fontWeight:400 }}>(last 50) — rate good/bad to train the flywheel</span></h4>
        {decisions.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:13 }}>No decisions logged yet. Start chatting with forge-auto to populate the flywheel.</p>}
        <div style={{ display:'grid', gap:6 }}>
          {decisions.slice(0,25).map((d: any) => {
            const tier = tierFromReason(d.reasoning);
            const fb = feedbackMap[d.id];
            return (
              <div key={d.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto auto', gap:8, alignItems:'center', padding:'8px 10px', background:'var(--bg-surface2)', borderRadius:8 }}>
                <span style={{ padding:'2px 8px', background:`${tierColor(tier)}20`, color:tierColor(tier), borderRadius:4, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{tier}</span>
                <div style={{ overflow:'hidden' }}>
                  <p style={{ margin:0, fontSize:12, color:'var(--fg-text1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.input_prompt}</p>
                  <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{d.selected_model} · {d.latency_ms ? `${d.latency_ms}ms` : ''} · {new Date(utcStamp(d.created_at)).toLocaleTimeString()}</p>
                </div>
                <button onClick={() => sendFeedback(d.id, 1)} title="Good routing" style={{ background:fb===1?'#10b981':'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, color:fb===1?'#fff':'var(--fg-text3)', cursor:'pointer', padding:'3px 8px', fontSize:14 }}>👍</button>
                <button onClick={() => sendFeedback(d.id, -1)} title="Bad routing" style={{ background:fb===-1?'#ef4444':'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, color:fb===-1?'#fff':'var(--fg-text3)', cursor:'pointer', padding:'3px 8px', fontSize:14 }}>👎</button>
                <span style={{ fontSize:11, color:'var(--fg-text3)', whiteSpace:'nowrap', minWidth:30, textAlign:'center' }}>{Math.round((d.confidence||0)*100)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ForgeTab_forgemetrics() {
  const [metrics, setMetrics] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const BACKEND = '';
  const load = async () => {
    setLoading(true);
    try {
      const [mRes, hRes] = await Promise.all([
        fetch(`${BACKEND}/api/metrics`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${BACKEND}/api/metrics/history`, { headers: { Authorization: `Bearer ${tok}` } })
      ]);
      const m = await mRes.json();
      const h = await hRes.json();
      setMetrics(m);
      setHistory(h.history || []);
    } catch {}
    setLoading(false);
  };
  React.useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  const fmtUptime = (sec: number) => {
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.floor(sec%60);
    return `${h}h ${m}m ${s}s`;
  };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>📊 Platform Metrics</h1>
            <p style={{ color:'var(--fg-text3)', fontSize:13 }}>Real-time observability for the Forge backend.</p>
          </div>
          <button onClick={load} disabled={loading} style={{ padding:'8px 18px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, cursor:'pointer' }}>{loading ? '…' : '↻ Refresh'}</button>
        </div>
        {loading && !metrics && <div style={{ textAlign:'center', padding:60, color:'var(--fg-text3)' }}>Loading metrics…</div>}
        {metrics && (
          <>
            <div style={{ background:'#16a34a18', border:'1px solid #16a34a', borderRadius:10, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a' }} />
              <span style={{ color:'#16a34a', fontSize:13, fontWeight:600 }}>System Online</span>
              <span style={{ color:'var(--fg-text3)', fontSize:12, marginLeft:'auto' }}>v{metrics.version} · Uptime: {fmtUptime(metrics.uptimeSec || 0)}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))', gap:12, marginBottom:24 }}>
              {[
                { label:'Total Requests', value: metrics.requestCount ?? 0, icon:'🌐' },
                { label:'LLM Calls', value: metrics.llmCallCount ?? 0, icon:'🧠' },
                { label:'Agent Runs', value: metrics.hermesRunCount ?? 0, icon:'⚡' },
                { label:'Multiplex Jobs', value: metrics.multiplexJobCount ?? 0, icon:'🔀' },
                { label:'RAG Queries', value: metrics.ragQueryCount ?? 0, icon:'📚' },
                { label:'Errors', value: metrics.errorCount ?? 0, icon:'⚠️' },
                { label:'Memory (MB)', value: Math.round(metrics.memoryMB || 0), icon:'💾' },
                { label:'Started', value: metrics.startedAt ? new Date(metrics.startedAt).toLocaleDateString() : '—', icon:'🗓' },
              ].map((kpi, i) => (
                <div key={i} style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:10, padding:14 }}>
                  <div style={{ fontSize:18, marginBottom:6 }}>{kpi.icon}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:2 }}>{kpi.value}</div>
                  <div style={{ fontSize:11, color:'var(--fg-text3)', fontWeight:500 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            {history.length > 0 && (
              <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:14 }}>📈 Request History (last {history.length} min)</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr>{['Time','Req/min','Err/min','Mem MB'].map(hh => (
                        <th key={hh} style={{ textAlign:'left', padding:'6px 12px', color:'var(--fg-text3)', fontWeight:600, borderBottom:'1px solid var(--fg-border)', whiteSpace:'nowrap' }}>{hh}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {history.slice().reverse().map((row: any, i: number) => (
                        <tr key={i} style={{ borderBottom:'1px solid var(--fg-border)' }}>
                          <td style={{ padding:'6px 12px', color:'var(--fg-text3)' }}>{new Date(row.ts).toLocaleTimeString()}</td>
                          <td style={{ padding:'6px 12px', color:'var(--fg-text)', fontWeight:600 }}>{row.reqPerMin}</td>
                          <td style={{ padding:'6px 12px', color: row.errPerMin > 0 ? '#ef4444' : 'var(--fg-text3)' }}>{row.errPerMin}</td>
                          <td style={{ padding:'6px 12px', color:'var(--fg-text)' }}>{Math.round(row.memMB)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {history.length === 0 && <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:24, textAlign:'center', color:'var(--fg-text3)', fontSize:13 }}>History builds 1 point/min. Check back soon.</div>}
          </>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_ragknow() {
  const [docs, setDocs] = React.useState<any[]>([]);
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [text, setText] = React.useState('');
  const [docName, setDocName] = React.useState('');
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const BACKEND = '';
  const loadDocs = () => {
    fetch(`${BACKEND}/api/rag-docs`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(d => setDocs(d.data || [])).catch(() => {});
  };
  React.useEffect(() => { loadDocs(); }, []);
  const upload = async () => {
    if (!text.trim() || !docName.trim()) return;
    setUploading(true);
    await fetch(`${BACKEND}/api/rag-docs`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` }, body: JSON.stringify({ name: docName, content: text }) });
    setText(''); setDocName(''); setUploading(false); loadDocs();
  };
  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true); setAnswer('');
    const r = await fetch(`${BACKEND}/api/rag-query`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` }, body: JSON.stringify({ question }) });
    const d = await r.json();
    setAnswer(d.answer || d.error || 'No answer'); setLoading(false);
  };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>📚 Knowledge Base</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Upload documents, then ask AI questions grounded in your content.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:12 }}>📤 Add Document</div>
            <input value={docName} onChange={e=>setDocName(e.target.value)} placeholder="Document name..." style={{ width:'100%', padding:'8px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, marginBottom:8, boxSizing:'border-box' }} />
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste document text here..." rows={6} style={{ width:'100%', padding:'8px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:8 }} />
            <button onClick={upload} disabled={uploading||!text.trim()||!docName.trim()} style={{ padding:'9px 20px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:uploading?0.5:1 }}>{uploading?'Uploading…':'+ Add to KB'}</button>
          </div>
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:12 }}>🗂 Documents ({docs.length})</div>
            {docs.length === 0 && <div style={{ color:'var(--fg-text3)', fontSize:13 }}>No documents yet. Add one to get started.</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
              {docs.map((d:any) => (
                <div key={d.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--fg-bg)', borderRadius:8, fontSize:12 }}>
                  <span style={{ color:'var(--fg-text)', fontWeight:600 }}>📄 {d.name}</span>
                  <span style={{ color:'var(--fg-text3)' }}>{d.word_count || 0} words</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:12 }}>🔍 Ask Your Knowledge Base</div>
          <div style={{ display:'flex', gap:10 }}>
            <input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} placeholder="Ask a question about your documents..." style={{ flex:1, padding:'10px 14px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, outline:'none' }} />
            <button onClick={ask} disabled={loading||!question.trim()||docs.length===0} style={{ padding:'10px 22px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:loading||(docs.length===0)?0.5:1 }}>{loading?'…':'Ask'}</button>
          </div>
          {docs.length === 0 && <div style={{ fontSize:12, color:'var(--fg-text3)', marginTop:8 }}>⚠ Add documents first to enable Q&A.</div>}
          {answer && (
            <div style={{ marginTop:16, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, padding:16 }}>
              <div style={{ fontSize:11, color:'var(--fg-text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Answer</div>
              <div style={{ fontSize:14, color:'var(--fg-text)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{answer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ForgeTab_agentmulti() {
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [newGoal, setNewGoal] = React.useState('');
  const [launching, setLaunching] = React.useState(false);
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const BACKEND = '';
  const load = () => {
    fetch(`${BACKEND}/api/autonomy/status`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(d => setSessions(d.recent || [])).catch(() => {});
  };
  React.useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);
  const launch = async () => {
    if (!newGoal.trim()) return;
    setLaunching(true);
    await fetch(`${BACKEND}/api/autonomy/run`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` }, body: JSON.stringify({ goal: newGoal }) });
    setNewGoal(''); setLaunching(false); setTimeout(load, 1500);
  };
  const statusColor: Record<string,string> = { running:'#22c55e', completed:'#3b82f6', failed:'#ef4444', pending:'#f59e0b' };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>🤖 Agent Multiplexer</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Launch and monitor multiple autonomous agent sessions simultaneously.</p>
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20, marginBottom:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:12 }}>🚀 Launch New Agent</div>
          <div style={{ display:'flex', gap:10 }}>
            <input value={newGoal} onChange={e=>setNewGoal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&launch()} placeholder="Describe the agent's goal..." style={{ flex:1, padding:'10px 14px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, outline:'none' }} />
            <button onClick={launch} disabled={launching||!newGoal.trim()} style={{ padding:'10px 22px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:launching?0.5:1 }}>{launching?'Launching…':'▶ Launch'}</button>
          </div>
        </div>
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)' }}>Sessions ({sessions.length})</div>
            <button onClick={load} style={{ padding:'5px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text3)', fontSize:12, cursor:'pointer' }}>↻ Refresh</button>
          </div>
          {sessions.length === 0 && <div style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', padding:30 }}>No sessions yet. Launch your first agent above.</div>}
          {sessions.map((s: any) => (
            <div key={s.id} style={{ background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, padding:14, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-text)', marginBottom:4 }}>{s.goal}</div>
                  <div style={{ fontSize:11, color:'var(--fg-text3)' }}>{new Date(utcStamp(s.created_at)).toLocaleString()}</div>
                </div>
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${statusColor[s.status] || '#6b7280'}22`, color: statusColor[s.status] || '#6b7280', flexShrink:0, marginLeft:12 }}>{s.status}</span>
              </div>
              {s.status === 'running' && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:11, color:'var(--fg-text3)', marginBottom:4 }}>Progress: {s.steps_done || 0} / {s.steps_total || '?'}</div>
                  <div style={{ height:4, background:'var(--fg-bg2)', borderRadius:2 }}>
                    <div style={{ height:4, borderRadius:2, background:'#22c55e', width:`${s.steps_total ? Math.round((s.steps_done/s.steps_total)*100) : 50}%`, transition:'width 0.3s' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ForgeTab_videoanal() {
  const [url, setUrl] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<'summary'|'transcript'|'insights'|'questions'>('summary');
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const BACKEND = '';
  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true); setResult('');
    const r = await fetch(`${BACKEND}/api/dream-tool`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` }, body: JSON.stringify({ tool:'Video Analyzer', toolId:'videoanal', input: `Video URL: ${url}\n\nTask: ${mode}`, model:'claude-haiku-4-5' }) });
    const d = await r.json(); setResult(d.result || d.error || ''); setLoading(false);
  };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>🎬 Video Analyzer</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Paste any YouTube or video URL — get AI-powered summaries, insights, and Q&A.</p>
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20, marginBottom:20 }}>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste YouTube URL, Loom, or any video link..." style={{ width:'100%', padding:'12px 14px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:14 }} />
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {(['summary','transcript','insights','questions'] as const).map(m => (
              <button key={m} onClick={()=>setMode(m)} style={{ padding:'7px 16px', borderRadius:20, border:'none', background:mode===m?'var(--fg-orange)':'var(--fg-bg)', color:mode===m?'#fff':'var(--fg-text3)', fontSize:12, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>{m}</button>
            ))}
          </div>
          <button onClick={analyze} disabled={loading||!url.trim()} style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:loading?0.5:1 }}>{loading?'🎬 Analyzing…':'🎬 Analyze Video'}</button>
        </div>
        {result && (
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Analysis Result</div>
            <div style={{ fontSize:14, color:'var(--fg-text)', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{result}</div>
          </div>
        )}
        {!result && !loading && (
          <div style={{ background:'var(--fg-bg2)', border:'1px dashed var(--fg-border)', borderRadius:12, padding:32, textAlign:'center', color:'var(--fg-text3)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎬</div>
            <div style={{ fontSize:14 }}>Paste a video URL above to get started</div>
            <div style={{ fontSize:12, marginTop:8 }}>Works with YouTube, Loom, Vimeo, and more</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_meetingtrans() {
  const [transcript, setTranscript] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<'summary'|'actions'|'decisions'|'followup'>('summary');
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const BACKEND = '';
  const run = async () => {
    if (!transcript.trim()) return;
    setLoading(true); setResult('');
    const prompts: Record<string,string> = {
      summary: 'Write a concise meeting summary with key points discussed.',
      actions: 'Extract all action items with owner and deadline if mentioned.',
      decisions: 'List all decisions made in this meeting.',
      followup: 'Draft a professional follow-up email summarizing the meeting.',
    };
    const r = await fetch(`${BACKEND}/api/dream-tool`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` }, body: JSON.stringify({ tool:'Meeting Transcriber', toolId:'meetingtrans', input: `${prompts[mode]}\n\nMeeting Transcript:\n${transcript}`, model:'claude-haiku-4-5' }) });
    const d = await r.json(); setResult(d.result || d.error || ''); setLoading(false);
  };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>🎙️ Meeting Intelligence</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Paste a meeting transcript → get summaries, action items, decisions, and follow-up emails instantly.</p>
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {(['summary','actions','decisions','followup'] as const).map(m => (
              <button key={m} onClick={()=>setMode(m)} style={{ padding:'7px 16px', borderRadius:20, border:'none', background:mode===m?'var(--fg-orange)':'var(--fg-bg)', color:mode===m?'#fff':'var(--fg-text3)', fontSize:12, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                {m==='followup'?'Follow-up Email':m.charAt(0).toUpperCase()+m.slice(1)}
              </button>
            ))}
          </div>
          <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste your meeting transcript or notes here..." rows={10} style={{ width:'100%', padding:'12px 14px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:12 }} />
          <button onClick={run} disabled={loading||!transcript.trim()} style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:loading?0.5:1 }}>{loading?'🎙️ Processing…':'🎙️ Analyze Meeting'}</button>
        </div>
        {result && (
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Result</div>
              <button onClick={()=>navigator.clipboard?.writeText(result)} style={{ padding:'4px 10px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }}>Copy</button>
            </div>
            <div style={{ fontSize:14, color:'var(--fg-text)', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_skillbuilder() {
  const accountLocal = React.useRef(createAccountLocalState()).current;
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState('🧩');
  const [prompt, setPrompt] = React.useState('');
  const [cat, setCat] = React.useState('Custom');
  const [saved, setSaved] = React.useState<any[]>(() => { try { return JSON.parse(accountLocal.getItem('forge_custom_skills_v2') || '[]'); } catch { return []; } });
  const [testing, setTesting] = React.useState(false);
  const [testInput, setTestInput] = React.useState('');
  const [testOut, setTestOut] = React.useState('');
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const BACKEND = '';
  const save = () => {
    if (!name.trim() || !prompt.trim()) return;
    const skill = { id: 'custom_' + Date.now(), name, icon, prompt, cat, created: new Date().toISOString() };
    const next = [skill, ...saved]; setSaved(next);
    accountLocal.setItem('forge_custom_skills_v2', JSON.stringify(next));
    setName(''); setPrompt(''); setIcon('🧩'); setTestOut('');
  };
  const runTest = async () => {
    if (!prompt.trim() || !testInput.trim()) return;
    setTesting(true); setTestOut('');
    const r = await fetch(`${BACKEND}/api/dream-tool`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` }, body: JSON.stringify({ tool:name||'Custom Skill', toolId:'skillbuilder', input: `${prompt}\n\nUser Input:\n${testInput}`, model:'claude-haiku-4-5' }) });
    const d = await r.json(); setTestOut(d.result || d.error || ''); setTesting(false);
  };
  const del = (id: string) => { const next = saved.filter((s:any) => s.id !== id); setSaved(next); accountLocal.setItem('forge_custom_skills_v2', JSON.stringify(next)); };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>🛠️ Skill Builder</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Create custom AI skills with system prompts. Test them instantly, save to your library.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:14 }}>✍️ Create Skill</div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input value={icon} onChange={e=>setIcon(e.target.value)} style={{ width:50, padding:'8px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:20, textAlign:'center' }} />
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Skill name..." style={{ flex:1, padding:'8px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }} />
            </div>
            <input value={cat} onChange={e=>setCat(e.target.value)} placeholder="Category..." style={{ width:'100%', padding:'8px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, marginBottom:10, boxSizing:'border-box' }} />
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Write the AI system prompt for this skill. Example: 'You are a legal document analyzer. Review the document and identify risks, missing clauses, and red flags...'" rows={6} style={{ width:'100%', padding:'10px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:10 }} />
            <button onClick={save} disabled={!name.trim()||!prompt.trim()} style={{ width:'100%', padding:'10px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:(!name.trim()||!prompt.trim())?0.5:1 }}>💾 Save Skill</button>
          </div>
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:14 }}>⚡ Test Live</div>
            <textarea value={testInput} onChange={e=>setTestInput(e.target.value)} placeholder="Enter test input..." rows={4} style={{ width:'100%', padding:'10px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:10 }} />
            <button onClick={runTest} disabled={testing||!prompt.trim()||!testInput.trim()} style={{ width:'100%', padding:'10px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', marginBottom:12, opacity:testing?0.5:1 }}>{testing?'Running…':'▶ Test Skill'}</button>
            {testOut && <div style={{ background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, padding:12, fontSize:13, color:'var(--fg-text)', lineHeight:1.6, whiteSpace:'pre-wrap', maxHeight:200, overflowY:'auto' }}>{testOut}</div>}
          </div>
        </div>
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:14 }}>My Skills ({saved.length})</div>
          {saved.length === 0 && <div style={{ color:'var(--fg-text3)', fontSize:13 }}>No custom skills yet. Create one above.</div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
            {saved.map((s:any) => (
              <div key={s.id} style={{ background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:24 }}>{s.icon}</span>
                  <button onClick={()=>del(s.id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:14 }}>✕</button>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--fg-text)', marginBottom:4 }}>{s.name}</div>
                <div style={{ fontSize:10, color:'var(--fg-text3)', background:'var(--fg-bg2)', padding:'2px 6px', borderRadius:10, display:'inline-block', marginBottom:8 }}>{s.cat}</div>
                <div style={{ fontSize:11, color:'var(--fg-text3)', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{s.prompt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
