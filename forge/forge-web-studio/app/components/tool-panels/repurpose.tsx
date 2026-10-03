'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_repurpose() {
  const BACKEND = '';
  const ALL_FORMATS = [
    { id:'linkedin', label:'LinkedIn Post', icon:'💼' },
    { id:'tweet_thread', label:'Tweet Thread', icon:'🐦' },
    { id:'blog_post', label:'Blog Post', icon:'📝' },
    { id:'email_newsletter', label:'Email Newsletter', icon:'📧' },
    { id:'youtube_script', label:'YouTube Script', icon:'🎬' },
    { id:'tiktok_hook', label:'TikTok / Reels', icon:'📱' },
    { id:'podcast_notes', label:'Podcast Notes', icon:'🎙️' },
    { id:'press_release', label:'Press Release', icon:'📰' },
  ];
  const [content, setContent] = React.useState('');
  const [context, setContext] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>(['linkedin', 'tweet_thread', 'email_newsletter']);
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeResult, setActiveResult] = React.useState(0);
  const [copied, setCopied] = React.useState<number | null>(null);

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 6 ? [...prev, id] : prev);

  const repurpose = async () => {
    if (!content.trim()) { setError('Paste your source content'); return; }
    setLoading(true); setError(''); setResults([]);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/repurpose`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ content, formats: selected, context }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResults(d.results);
      setActiveResult(0);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copyResult = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(idx); setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ padding:'24px', maxWidth:'1000px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>♻️ Content Repurposer</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>Turn one piece of content into 8 formats — simultaneously</p>
      </div>

      {results.length === 0 ? (
        <div>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Source Content *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={7}
              placeholder="Paste your blog post, article, talk transcript, podcast notes, or any source content you want to repurpose..."
              style={{ width:'100%', padding:'12px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.6 }} />
          </div>

          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Brand Voice / Context (optional)</label>
            <input value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. Casual and conversational, target audience: startup founders, avoid corporate jargon"
              style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
          </div>

          <div style={{ marginBottom:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>Output Formats (select up to 6)</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
              {ALL_FORMATS.map(f => {
                const isSelected = selected.includes(f.id);
                return (
                  <button key={f.id} onClick={() => toggle(f.id)} style={{
                    padding:'10px 12px', borderRadius:'10px', border:'2px solid', cursor:'pointer', textAlign:'center',
                    borderColor: isSelected ? '#6366f1' : '#e5e7eb',
                    background: isSelected ? '#eef2ff' : '#fff',
                    opacity: !isSelected && selected.length >= 6 ? 0.4 : 1,
                  }}>
                    <div style={{ fontSize:'20px', marginBottom:'4px' }}>{f.icon}</div>
                    <div style={{ fontSize:'12px', fontWeight: isSelected ? 700 : 400, color: isSelected ? '#4f46e5' : '#374151' }}>{f.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={repurpose} disabled={loading || !content.trim() || selected.length === 0} style={{
            padding:'10px 28px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
          }}>{loading ? `♻️ Repurposing into ${selected.length} formats...` : `♻️ Repurpose into ${selected.length} Format${selected.length !== 1 ? 's' : ''}`}</button>

          {error && <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}
        </div>
      ) : (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div style={{ fontSize:'14px', color:'#64748b' }}>Generated {results.length} formats from your content</div>
            <button onClick={() => setResults([])} style={{ padding:'7px 16px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#64748b' }}>← Repurpose Again</button>
          </div>

          {/* Format tabs */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'20px' }}>
            {results.map((r, i) => {
              const fmt = ALL_FORMATS.find(f => f.id === r.format);
              return (
                <button key={i} onClick={() => setActiveResult(i)} style={{
                  padding:'8px 14px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontSize:'13px',
                  borderColor: activeResult === i ? '#6366f1' : '#e5e7eb',
                  background: activeResult === i ? '#eef2ff' : '#fff',
                  color: activeResult === i ? '#4f46e5' : '#6b7280',
                  fontWeight: activeResult === i ? 700 : 400,
                }}>{fmt?.icon || '📄'} {r.label}</button>
              );
            })}
          </div>

          {/* Active result */}
          {results[activeResult] && (
            <div style={{ border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                <span style={{ fontSize:'14px', fontWeight:700, color:'#374151' }}>
                  {ALL_FORMATS.find(f => f.id === results[activeResult].format)?.icon} {results[activeResult].label}
                </span>
                <button onClick={() => copyResult(activeResult, results[activeResult].content)} style={{
                  padding:'6px 14px', background: copied === activeResult ? '#ecfdf5' : '#fff', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'12px',
                  color: copied === activeResult ? '#059669' : '#475569',
                }}>{copied === activeResult ? '✓ Copied!' : '📋 Copy'}</button>
              </div>
              <div style={{ padding:'20px', background:'#fff' }}>
                <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'14px', color:'#1e293b', margin:0, lineHeight:1.8 }}>{results[activeResult].content}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_summarize() {
  const BACKEND = '';
  const MODES = [
    { id:'tldr', label:'TLDR', icon:'⚡', desc:'1-3 sentences' },
    { id:'bullets', label:'Bullet Points', icon:'📋', desc:'5-8 key points' },
    { id:'executive', label:'Executive Brief', icon:'👔', desc:'150 words' },
    { id:'eli5', label:'ELI5', icon:'👶', desc:'Simple language' },
    { id:'action_items', label:'Action Items', icon:'✅', desc:'To-do list' },
    { id:'key_insights', label:'Key Insights', icon:'💡', desc:'Non-obvious' },
    { id:'academic', label:'Academic', icon:'🎓', desc:'Formal abstract' },
    { id:'narrative', label:'Story', icon:'📖', desc:'Narrative form' },
  ];
  const [text, setText] = React.useState('');
  const [mode, setMode] = React.useState('bullets');
  const [length, setLength] = React.useState('medium');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const summarize = async () => {
    if (text.trim().length < 30) { setError('Text too short (min 30 chars)'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/summarize`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ text, mode, length }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.result);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding:'24px', maxWidth:'900px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>⚡ AI Summarizer</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>8 summary styles — from TLDR to academic abstract</p>
      </div>

      {/* Mode selector */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'16px' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding:'10px 8px', borderRadius:'10px', border:'2px solid', cursor:'pointer', textAlign:'center',
            borderColor: mode === m.id ? '#6366f1' : '#e5e7eb',
            background: mode === m.id ? '#eef2ff' : '#fff',
          }}>
            <div style={{ fontSize:'18px', marginBottom:'3px' }}>{m.icon}</div>
            <div style={{ fontSize:'12px', fontWeight: mode === m.id ? 700 : 500, color: mode === m.id ? '#4f46e5' : '#374151' }}>{m.label}</div>
            <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'1px' }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Length */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {['short','medium','long'].map(l => (
          <button key={l} onClick={() => setLength(l)} style={{
            padding:'6px 16px', borderRadius:'16px', border:'1.5px solid', cursor:'pointer', fontSize:'13px', textTransform:'capitalize',
            borderColor: length === l ? '#10b981' : '#e5e7eb',
            background: length === l ? '#ecfdf5' : '#fff',
            color: length === l ? '#059669' : '#6b7280', fontWeight: length === l ? 600 : 400,
          }}>{l}</button>
        ))}
        <span style={{ fontSize:'12px', color:'#94a3b8', alignSelf:'center' }}>output length</span>
      </div>

      <div style={{ marginBottom:'12px' }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
          placeholder="Paste any text — article, report, meeting notes, research paper, email thread, book chapter..."
          style={{ width:'100%', padding:'12px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.6 }} />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
          <span style={{ fontSize:'12px', color:'#94a3b8' }}>{text.split(/\s+/).filter(Boolean).length} words</span>
          <button onClick={summarize} disabled={loading || text.trim().length < 30} style={{
            padding:'9px 22px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
          }}>{loading ? '⚡ Summarizing...' : '⚡ Summarize'}</button>
        </div>
      </div>

      {error && <div style={{ padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}

      {result && (
        <div style={{ marginTop:'20px' }}>
          {/* Stats bar */}
          <div style={{ display:'flex', gap:'16px', marginBottom:'12px', padding:'10px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px' }}>
            <div style={{ fontSize:'13px', color:'#64748b' }}><strong style={{ color:'#374151' }}>{result.stats?.inputWords}</strong> words input</div>
            <div style={{ color:'#cbd5e1' }}>→</div>
            <div style={{ fontSize:'13px', color:'#64748b' }}><strong style={{ color:'#374151' }}>{result.stats?.outputWords}</strong> words output</div>
            <div style={{ color:'#cbd5e1' }}>|</div>
            <div style={{ fontSize:'13px', color:'#059669', fontWeight:600 }}>{result.stats?.compressionRatio}% compression</div>
            <div style={{ marginLeft:'auto' }}>
              <button onClick={copy} style={{ padding:'4px 12px', background: copied ? '#ecfdf5' : '#fff', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color: copied ? '#059669' : '#475569' }}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div style={{ padding:'20px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#64748b', marginBottom:'12px' }}>{result.icon} {result.label?.toUpperCase()}</div>
            <div style={{ fontSize:'14px', color:'#1e293b', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{result.result}</div>
          </div>

          {/* Quick-switch modes */}
          <div style={{ marginTop:'12px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'12px', color:'#94a3b8', alignSelf:'center' }}>Try also:</span>
            {MODES.filter(m => m.id !== mode).slice(0, 4).map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setTimeout(summarize, 50); }} style={{
                padding:'5px 12px', borderRadius:'12px', border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:'12px', color:'#6366f1',
              }}>{m.icon} {m.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ForgeTab_resumeanalyze() {
  const BACKEND = '';
  const [resume, setResume] = React.useState('');
  const [jobDesc, setJobDesc] = React.useState('');
  const [targetRole, setTargetRole] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('overview');

  const analyze = async () => {
    if (resume.trim().length < 50) { setError('Please paste your resume (at least 50 characters)'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/resume-analyze`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ resume, jobDescription: jobDesc, targetRole }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
      setActiveTab('overview');
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const gradeColor: Record<string, string> = { A:'#059669', B:'#0891b2', C:'#d97706', D:'#dc2626', F:'#7f1d1d' };
  const scoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#eff6ff' : s >= 40 ? '#fefce8' : '#fef2f2';
  const scoreColor = (s: number) => s >= 80 ? '#059669' : s >= 60 ? '#2563eb' : s >= 40 ? '#d97706' : '#dc2626';

  return (
    <div style={{ padding:'24px', maxWidth:'1000px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>📄 Resume Analyzer</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>ATS scoring, gap analysis, and bullet rewrites powered by AI</p>
      </div>

      {!result ? (
        <div>
          <div style={{ marginBottom:'12px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
              <div>
                <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Target Role (optional)</label>
                <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior Product Manager" style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex', alignItems:'flex-end' }}>
                <div style={{ fontSize:'12px', color:'#6b7280', padding:'8px 0' }}>Add a job description for targeted analysis</div>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
            <div>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Resume *</label>
              <textarea value={resume} onChange={e => setResume(e.target.value)} rows={16}
                placeholder="Paste your resume here (plain text)..."
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'13px', resize:'vertical', boxSizing:'border-box', fontFamily:'monospace', lineHeight:1.5 }} />
            </div>
            <div>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Job Description (optional)</label>
              <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={16}
                placeholder="Paste the job description to get targeted keyword analysis and gap detection..."
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'13px', resize:'vertical', boxSizing:'border-box', fontFamily:'monospace', lineHeight:1.5 }} />
            </div>
          </div>

          <button onClick={analyze} disabled={loading || resume.trim().length < 50} style={{
            padding:'10px 28px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
          }}>{loading ? '🔍 Analyzing...' : '📊 Analyze Resume'}</button>

          {error && <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}
        </div>
      ) : (
        <div>
          {/* Score header */}
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:'24px', alignItems:'center', marginBottom:'24px', padding:'20px 24px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'48px', fontWeight:800, color: scoreColor(result.atsScore) }}>{result.atsScore}</div>
              <div style={{ fontSize:'12px', color:'#64748b', fontWeight:600 }}>ATS SCORE</div>
            </div>
            <div>
              <div style={{ fontSize:'16px', fontWeight:700, color:'#1e293b', marginBottom:'4px' }}>{result.summary}</div>
              <div style={{ fontSize:'13px', color:'#64748b' }}>Grade: <strong style={{ color: gradeColor[result.overallGrade] || '#374151' }}>{result.overallGrade}</strong></div>
            </div>
            <button onClick={() => setResult(null)} style={{ padding:'8px 16px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#64748b' }}>← New Analysis</button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'4px', marginBottom:'20px', borderBottom:'2px solid #e2e8f0' }}>
            {['overview','keywords','bullets','sections'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding:'8px 18px', border:'none', borderBottom: activeTab === t ? '2px solid #6366f1' : '2px solid transparent',
                background:'none', cursor:'pointer', fontSize:'14px', fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? '#4f46e5' : '#6b7280', textTransform:'capitalize', marginBottom:'-2px',
              }}>{t}</button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div style={{ padding:'16px', background:'#ecfdf5', border:'1px solid #6ee7b7', borderRadius:'10px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#065f46', marginBottom:'10px' }}>✅ STRENGTHS</div>
                {result.strengths?.map((s: string, i: number) => <div key={i} style={{ fontSize:'13px', color:'#047857', padding:'4px 0', display:'flex', gap:'8px' }}><span>•</span><span>{s}</span></div>)}
              </div>
              <div style={{ padding:'16px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'10px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#991b1b', marginBottom:'10px' }}>⚠️ GAPS & ISSUES</div>
                {result.gaps?.map((g: string, i: number) => <div key={i} style={{ fontSize:'13px', color:'#b91c1c', padding:'4px 0', display:'flex', gap:'8px' }}><span>•</span><span>{g}</span></div>)}
              </div>
              <div style={{ gridColumn:'1/-1', padding:'16px', background:'#f0f9ff', border:'1px solid #7dd3fc', borderRadius:'10px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#0c4a6e', marginBottom:'10px' }}>🎯 TOP RECOMMENDATIONS</div>
                {result.topRecommendations?.map((r: string, i: number) => (
                  <div key={i} style={{ fontSize:'13px', color:'#075985', padding:'5px 0', display:'flex', gap:'10px', borderTop: i > 0 ? '1px solid #bae6fd' : 'none' }}>
                    <span style={{ fontWeight:700, minWidth:'18px' }}>{i+1}.</span><span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'keywords' && (
            <div>
              {result.presentKeywords?.length > 0 && (
                <div style={{ marginBottom:'16px', padding:'16px', background:'#ecfdf5', border:'1px solid #6ee7b7', borderRadius:'10px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#065f46', marginBottom:'10px' }}>✅ KEYWORDS FOUND ({result.presentKeywords.length})</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {result.presentKeywords.map((k: string, i: number) => <span key={i} style={{ padding:'4px 10px', background:'#d1fae5', color:'#047857', borderRadius:'12px', fontSize:'12px', fontWeight:600 }}>{k}</span>)}
                  </div>
                </div>
              )}
              {result.missingKeywords?.length > 0 && (
                <div style={{ padding:'16px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'10px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#991b1b', marginBottom:'10px' }}>❌ MISSING KEYWORDS ({result.missingKeywords.length})</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {result.missingKeywords.map((k: string, i: number) => <span key={i} style={{ padding:'4px 10px', background:'#fee2e2', color:'#b91c1c', borderRadius:'12px', fontSize:'12px', fontWeight:600 }}>{k}</span>)}
                  </div>
                  <div style={{ marginTop:'10px', fontSize:'12px', color:'#9f1239' }}>Add these keywords naturally to your resume to improve ATS scoring.</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bullets' && (
            <div>
              <div style={{ fontSize:'13px', color:'#64748b', marginBottom:'16px' }}>AI-powered bullet rewrites with stronger impact and metrics focus</div>
              {result.bulletRewrites?.length > 0 ? result.bulletRewrites.map((b: any, i: number) => (
                <div key={i} style={{ marginBottom:'16px', border:'1px solid #e2e8f0', borderRadius:'10px', overflow:'hidden' }}>
                  <div style={{ padding:'12px 14px', background:'#fef2f2', borderBottom:'1px solid #fecaca' }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#dc2626', marginBottom:'4px' }}>ORIGINAL</div>
                    <div style={{ fontSize:'13px', color:'#374151' }}>{b.original}</div>
                  </div>
                  <div style={{ padding:'12px 14px', background:'#ecfdf5' }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#059669', marginBottom:'4px' }}>IMPROVED ✨</div>
                    <div style={{ fontSize:'13px', color:'#1e293b', fontWeight:500 }}>{b.improved}</div>
                  </div>
                </div>
              )) : <div style={{ color:'#94a3b8', fontSize:'14px' }}>No bullet rewrites available for this resume.</div>}
            </div>
          )}

          {activeTab === 'sections' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {Object.entries(result.sectionFeedback || {}).map(([section, feedback]: [string, any]) => (
                <div key={section} style={{ padding:'14px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#374151', textTransform:'uppercase', marginBottom:'6px' }}>{section}</div>
                  <div style={{ fontSize:'13px', color:'#475569', lineHeight:1.6 }}>{feedback}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_tonedetect() {
  const BACKEND = '';
  const [text, setText] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showAlt, setShowAlt] = React.useState<number | null>(null);

  const detect = async () => {
    if (text.trim().length < 10) { setError('Text too short'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/tone-detect`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const meterBar = (value: number, color: string, label: string) => (
    <div style={{ marginBottom:'10px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
        <span style={{ fontSize:'12px', color:'#64748b' }}>{label}</span>
        <span style={{ fontSize:'12px', fontWeight:700, color }}>{value}%</span>
      </div>
      <div style={{ height:'8px', background:'#f1f5f9', borderRadius:'4px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${value}%`, background:color, borderRadius:'4px', transition:'width 0.5s' }} />
      </div>
    </div>
  );

  const sentimentColor = (label: string) => ({ Positive:'#059669', Negative:'#dc2626', Neutral:'#6b7280', Mixed:'#d97706' }[label] || '#6b7280');

  return (
    <div style={{ padding:'24px', maxWidth:'900px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>🎭 Tone Detector</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>Analyze sentiment, emotions, formality, and communication style</p>
      </div>

      <div style={{ marginBottom:'12px' }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
          placeholder="Paste any text — an email, message, article, feedback, or any content you want to analyze..."
          style={{ width:'100%', padding:'12px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.6 }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px' }}>
          <span style={{ fontSize:'12px', color:'#94a3b8' }}>{text.split(/\s+/).filter(Boolean).length} words</span>
          <button onClick={detect} disabled={loading || text.trim().length < 10} style={{
            padding:'9px 22px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
          }}>{loading ? '🔍 Analyzing...' : '🎭 Detect Tone'}</button>
        </div>
      </div>

      {error && <div style={{ padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}

      {result && (
        <div>
          {/* Top summary */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'20px' }}>
            <div style={{ padding:'16px', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:'10px', textAlign:'center' }}>
              <div style={{ fontSize:'24px', fontWeight:800, color:'#4f46e5' }}>{result.primaryTone}</div>
              <div style={{ fontSize:'11px', color:'#6366f1', fontWeight:600, marginTop:'4px' }}>PRIMARY TONE</div>
            </div>
            <div style={{ padding:'16px', borderRadius:'10px', textAlign:'center', background:'#f8fafc', border:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:'22px', fontWeight:800, color: sentimentColor(result.sentiment?.label) }}>{result.sentiment?.label}</div>
              <div style={{ fontSize:'11px', color:'#64748b', fontWeight:600, marginTop:'4px' }}>SENTIMENT</div>
              <div style={{ fontSize:'13px', color:'#94a3b8', marginTop:'2px' }}>Score: {(result.sentiment?.score || 0).toFixed(2)}</div>
            </div>
            <div style={{ padding:'16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', textAlign:'center' }}>
              <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.5 }}>{result.audienceMatch}</div>
              <div style={{ fontSize:'11px', color:'#64748b', fontWeight:600, marginTop:'4px' }}>BEST AUDIENCE</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
            {/* Metrics */}
            <div style={{ padding:'16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#374151', marginBottom:'12px' }}>COMMUNICATION METRICS</div>
              {meterBar(result.formality, '#6366f1', 'Formality')}
              {meterBar(result.persuasiveness, '#0891b2', 'Persuasiveness')}
              {meterBar(result.clarity, '#059669', 'Clarity')}
              {meterBar(result.confidence, '#d97706', 'Confidence')}
              {meterBar(result.empathy, '#ec4899', 'Empathy')}
            </div>

            {/* Emotions */}
            <div style={{ padding:'16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#374151', marginBottom:'12px' }}>EMOTIONS DETECTED</div>
              {result.emotions?.slice(0, 6).map((e: any, i: number) => (
                <div key={i} style={{ marginBottom:'8px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                    <span style={{ fontSize:'12px', color:'#64748b', textTransform:'capitalize' }}>{e.emotion}</span>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#374151' }}>{e.intensity}%</span>
                  </div>
                  <div style={{ height:'6px', background:'#f1f5f9', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${e.intensity}%`, background:`hsl(${(i * 47) % 360},70%,55%)`, borderRadius:'3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {result.insights?.length > 0 && (
            <div style={{ marginBottom:'16px', padding:'14px 16px', background:'#f0f9ff', border:'1px solid #7dd3fc', borderRadius:'10px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#0c4a6e', marginBottom:'8px' }}>💡 INSIGHTS</div>
              {result.insights.map((ins: string, i: number) => <div key={i} style={{ fontSize:'13px', color:'#075985', padding:'3px 0', display:'flex', gap:'8px' }}><span>•</span><span>{ins}</span></div>)}
            </div>
          )}

          {/* Alternative versions */}
          {result.alternativeVersions?.length > 0 && (
            <div style={{ padding:'16px', background:'#fefce8', border:'1px solid #fde68a', borderRadius:'10px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#92400e', marginBottom:'12px' }}>✍️ REWRITTEN VERSIONS</div>
              <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                {result.alternativeVersions.map((v: any, i: number) => (
                  <button key={i} onClick={() => setShowAlt(showAlt === i ? null : i)} style={{
                    padding:'6px 12px', border:'1px solid #fde68a', borderRadius:'8px', background: showAlt === i ? '#fde68a' : '#fff',
                    cursor:'pointer', fontSize:'12px', fontWeight: showAlt === i ? 700 : 400, color:'#78350f',
                  }}>{v.label}</button>
                ))}
              </div>
              {showAlt !== null && result.alternativeVersions[showAlt] && (
                <div style={{ padding:'12px 14px', background:'#fff', border:'1px solid #fde68a', borderRadius:'8px', fontSize:'14px', color:'#1e293b', lineHeight:1.7 }}>
                  {result.alternativeVersions[showAlt].text}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_emailcompose() {
  const BACKEND = '';
  const EMAIL_TYPES = [
    { id:'cold_outreach', label:'Cold Outreach', icon:'📬' },
    { id:'follow_up', label:'Follow Up', icon:'🔁' },
    { id:'apology', label:'Apology', icon:'🙏' },
    { id:'formal', label:'Formal', icon:'👔' },
    { id:'casual', label:'Casual', icon:'😊' },
    { id:'thank_you', label:'Thank You', icon:'💛' },
    { id:'complaint', label:'Complaint', icon:'⚠️' },
    { id:'proposal', label:'Proposal', icon:'📋' },
    { id:'introduction', label:'Introduction', icon:'👋' },
    { id:'newsletter', label:'Newsletter', icon:'📰' },
  ];
  const TONES = ['professional','friendly','authoritative','empathetic','persuasive','direct'];
  const [emailType, setEmailType] = React.useState('formal');
  const [tone, setTone] = React.useState('professional');
  const [context, setContext] = React.useState('');
  const [recipientName, setRecipientName] = React.useState('');
  const [senderName, setSenderName] = React.useState('');
  const [desiredSubject, setDesiredSubject] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const compose = async () => {
    if (!context.trim()) { setError('Please describe what this email should accomplish'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/email-compose`, {
        method: 'POST', headers: { 'Content-Type':'application/json','Authorization':`Bearer ${token}` },
        body: JSON.stringify({ type: emailType, context, tone, recipientName, senderName, subject: desiredSubject }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copyEmail = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding:'24px', maxWidth:'900px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>✉️ Email Composer</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>AI-powered emails for every situation</p>
      </div>

      {/* Email Type */}
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>Email Type</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {EMAIL_TYPES.map(t => (
            <button key={t.id} onClick={() => setEmailType(t.id)} style={{
              padding:'7px 14px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontSize:'13px',
              borderColor: emailType === t.id ? '#6366f1' : '#e5e7eb',
              background: emailType === t.id ? '#eef2ff' : '#fff',
              color: emailType === t.id ? '#4f46e5' : '#6b7280', fontWeight: emailType === t.id ? 600 : 400,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>Tone</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {TONES.map(t => (
            <button key={t} onClick={() => setTone(t)} style={{
              padding:'6px 14px', borderRadius:'16px', border:'1.5px solid', cursor:'pointer', fontSize:'13px',
              borderColor: tone === t ? '#10b981' : '#e5e7eb',
              background: tone === t ? '#ecfdf5' : '#fff',
              color: tone === t ? '#059669' : '#6b7280', fontWeight: tone === t ? 600 : 400,
              textTransform:'capitalize',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
        <div>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Recipient Name (optional)</label>
          <input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. Sarah Chen" style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Your Name (optional)</label>
          <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="e.g. Alex" style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
        </div>
      </div>
      <div style={{ marginBottom:'12px' }}>
        <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>Desired Subject (optional)</label>
        <input value={desiredSubject} onChange={e => setDesiredSubject(e.target.value)} placeholder="Leave blank for AI to generate" style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }} />
      </div>
      <div style={{ marginBottom:'16px' }}>
        <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>What should this email accomplish? *</label>
        <textarea value={context} onChange={e => setContext(e.target.value)} rows={4}
          placeholder="e.g. Follow up on a sales demo we had last week. They seemed interested in our enterprise plan but went quiet. Want to re-engage without being pushy."
          style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }} />
      </div>

      <button onClick={compose} disabled={loading || !context.trim()} style={{
        padding:'10px 24px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
        cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
      }}>{loading ? '✍️ Composing...' : '✉️ Compose Email'}</button>

      {error && <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}

      {result && (
        <div style={{ marginTop:'24px' }}>
          {/* Subject */}
          <div style={{ marginBottom:'16px', padding:'14px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'#64748b', marginBottom:'6px' }}>SUBJECT LINE</div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1e293b' }}>{result.subject}</div>
            {result.subjectAlternatives?.length > 0 && (
              <div style={{ marginTop:'8px' }}>
                <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'4px' }}>ALTERNATIVES</div>
                {result.subjectAlternatives.map((s: string, i: number) => (
                  <div key={i} style={{ fontSize:'13px', color:'#475569', padding:'3px 0', borderTop:'1px solid #f1f5f9' }}>{s}</div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ marginBottom:'16px', padding:'16px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
              <div style={{ fontSize:'12px', fontWeight:600, color:'#64748b' }}>EMAIL BODY</div>
              <button onClick={copyEmail} style={{ padding:'5px 12px', background: copied ? '#ecfdf5' : '#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color: copied ? '#059669' : '#475569' }}>
                {copied ? '✓ Copied!' : '📋 Copy Full Email'}
              </button>
            </div>
            <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', fontSize:'14px', color:'#1e293b', margin:0, lineHeight:1.7 }}>{result.body}</pre>
          </div>

          {/* Tips */}
          {result.tips?.length > 0 && (
            <div style={{ padding:'14px 16px', background:'#fefce8', border:'1px solid #fde68a', borderRadius:'10px' }}>
              <div style={{ fontSize:'12px', fontWeight:600, color:'#92400e', marginBottom:'8px' }}>💡 TIPS TO IMPROVE</div>
              {result.tips.map((tip: string, i: number) => (
                <div key={i} style={{ fontSize:'13px', color:'#78350f', padding:'4px 0', display:'flex', gap:'8px' }}>
                  <span>•</span><span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_translate() {
  const BACKEND = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const ALL_LANGS = [
    { id:'Spanish', flag:'🇪🇸' }, { id:'French', flag:'🇫🇷' }, { id:'German', flag:'🇩🇪' },
    { id:'Portuguese', flag:'🇧🇷' }, { id:'Italian', flag:'🇮🇹' }, { id:'Japanese', flag:'🇯🇵' },
    { id:'Chinese (Simplified)', flag:'🇨🇳' }, { id:'Korean', flag:'🇰🇷' }, { id:'Arabic', flag:'🇸🇦' },
    { id:'Russian', flag:'🇷🇺' }, { id:'Hindi', flag:'🇮🇳' }, { id:'Dutch', flag:'🇳🇱' },
    { id:'Polish', flag:'🇵🇱' }, { id:'Turkish', flag:'🇹🇷' }, { id:'Swedish', flag:'🇸🇪' },
    { id:'Greek', flag:'🇬🇷' }, { id:'Hebrew', flag:'🇮🇱' }, { id:'Thai', flag:'🇹🇭' },
    { id:'Vietnamese', flag:'🇻🇳' }, { id:'Indonesian', flag:'🇮🇩' },
  ];
  const [text, setText] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>(['Spanish','French','German','Japanese']);
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copiedLang, setCopiedLang] = React.useState<string|null>(null);

  const toggle = (id: string) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 12 ? [...prev, id] : prev
  );

  const run = async () => {
    if (!text.trim() || selected.length === 0) return;
    setLoading(true); setResults([]); setError('');
    try {
      const r = await fetch(`${BACKEND}/api/translate`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` },
        body: JSON.stringify({ text, languages: selected })
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setResults(d.results || []);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copy = async (lang: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLang(lang); setTimeout(() => setCopiedLang(null), 2000);
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>🌍 Translation Hub</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Translate text to multiple languages simultaneously. Select up to 12.</p>

        {/* Language picker */}
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:16, marginBottom:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--fg-text)', marginBottom:12 }}>Target Languages ({selected.length}/12)</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {ALL_LANGS.map(l => {
              const on = selected.includes(l.id);
              return (
                <button key={l.id} onClick={() => toggle(l.id)}
                  style={{ padding:'6px 14px', borderRadius:20, border:`2px solid ${on ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: on ? 'rgba(255,100,50,0.12)' : 'var(--fg-bg)', color: on ? 'var(--fg-orange)' : 'var(--fg-text3)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                  {l.flag} {l.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text input */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Source Text (English)</div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter the text you want to translate..."
            rows={5} style={{ width:'100%', padding:'12px 14px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:14, resize:'vertical', boxSizing:'border-box', lineHeight:1.7 }} />
        </div>

        {error && <div style={{ background:'#ef444420', border:'1px solid #ef4444', borderRadius:8, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>}

        <button onClick={run} disabled={loading || !text.trim() || selected.length === 0}
          style={{ padding:'12px 36px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:(loading||!text.trim()||selected.length===0)?0.5:1, marginBottom:24 }}>
          {loading ? `⏳ Translating to ${selected.length} languages…` : `🌍 Translate to ${selected.length} language${selected.length!==1?'s':''}`}
        </button>

        {results.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14 }}>
            {results.map((r: any) => {
              const meta = ALL_LANGS.find(l => l.id === r.language);
              return (
                <div key={r.language} style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)' }}>{meta?.flag} {r.language}</div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontSize:10, color:'var(--fg-text3)' }}>{r.elapsed ? `${(r.elapsed/1000).toFixed(1)}s` : ''}</span>
                      <button onClick={() => copy(r.language, r.translation)} style={{ padding:'4px 10px', background:copiedLang===r.language?'#16a34a':'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:copiedLang===r.language?'#fff':'var(--fg-text3)', fontSize:11, cursor:'pointer' }}>{copiedLang===r.language?'✓':'📋'}</button>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:'var(--fg-text)', lineHeight:1.7 }}>{r.translation}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_sqlgen() {
  const BACKEND = '';
  const DIALECTS = [
    { id:'postgresql', label:'PostgreSQL', icon:'🐘' },
    { id:'mysql', label:'MySQL', icon:'🐬' },
    { id:'sqlite', label:'SQLite', icon:'💾' },
    { id:'bigquery', label:'BigQuery', icon:'☁️' },
    { id:'mssql', label:'SQL Server', icon:'🪟' },
    { id:'snowflake', label:'Snowflake', icon:'❄️' },
  ];
  const MODES = [
    { id:'generate', label:'Generate', desc:'Natural language → SQL' },
    { id:'explain', label:'Explain', desc:'SQL → plain English' },
    { id:'optimize', label:'Optimize', desc:'Improve performance' },
    { id:'fix', label:'Fix', desc:'Fix errors' },
  ];
  const [dialect, setDialect] = React.useState('postgresql');
  const [mode, setMode] = React.useState('generate');
  const [question, setQuestion] = React.useState('');
  const [schema, setSchema] = React.useState('');
  const [showSchema, setShowSchema] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const generate = async () => {
    if (!question.trim()) { setError('Please enter a question or SQL'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const token = localStorage.getItem('forge_token');
      const r = await fetch(`${BACKEND}/api/sql-gen`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ question, schema, dialect, mode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copySql = () => {
    if (!result?.sql) return;
    navigator.clipboard.writeText(result.sql);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const placeholder = mode === 'generate'
    ? 'e.g. Find all users who signed up in the last 30 days and made at least 3 purchases, ordered by total spend descending'
    : 'Paste your SQL query here...';

  return (
    <div style={{ padding:'24px', maxWidth:'900px', margin:'0 auto', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ marginBottom:'24px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#1e293b', margin:0 }}>🗄️ SQL Generator</h2>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:'14px' }}>Natural language to SQL — generate, explain, optimize, fix</p>
      </div>

      {/* Mode */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'20px' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding:'10px 12px', borderRadius:'10px', border:'2px solid', cursor:'pointer', textAlign:'center',
            borderColor: mode === m.id ? '#6366f1' : '#e5e7eb',
            background: mode === m.id ? '#eef2ff' : '#fff',
          }}>
            <div style={{ fontSize:'13px', fontWeight:700, color: mode === m.id ? '#4f46e5' : '#374151' }}>{m.label}</div>
            <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Dialect */}
      <div style={{ marginBottom:'16px' }}>
        <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>Database</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {DIALECTS.map(d => (
            <button key={d.id} onClick={() => setDialect(d.id)} style={{
              padding:'6px 14px', borderRadius:'16px', border:'1.5px solid', cursor:'pointer', fontSize:'13px',
              borderColor: dialect === d.id ? '#0891b2' : '#e5e7eb',
              background: dialect === d.id ? '#ecfeff' : '#fff',
              color: dialect === d.id ? '#0e7490' : '#6b7280', fontWeight: dialect === d.id ? 600 : 400,
            }}>{d.icon} {d.label}</button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ marginBottom:'12px' }}>
        <label style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'block', marginBottom:'4px' }}>
          {mode === 'generate' ? 'What data do you need?' : 'SQL to ' + mode}
        </label>
        <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={4} placeholder={placeholder}
          style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', resize:'vertical', boxSizing:'border-box', fontFamily:'monospace' }} />
      </div>

      {/* Schema toggle */}
      <div style={{ marginBottom:'16px' }}>
        <button onClick={() => setShowSchema(!showSchema)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:'#6366f1', padding:0, fontWeight:600 }}>
          {showSchema ? '▼' : '▶'} {showSchema ? 'Hide' : 'Add'} Schema (optional)
        </button>
        {showSchema && (
          <textarea value={schema} onChange={e => setSchema(e.target.value)} rows={5}
            placeholder="Paste your table definitions here:\nCREATE TABLE users (id INT, email TEXT, created_at TIMESTAMP);\nCREATE TABLE orders (id INT, user_id INT, total DECIMAL, ...);"
            style={{ marginTop:'8px', width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'13px', resize:'vertical', boxSizing:'border-box', fontFamily:'monospace', background:'#f8fafc' }} />
        )}
      </div>

      <button onClick={generate} disabled={loading || !question.trim()} style={{
        padding:'10px 24px', background: loading ? '#94a3b8' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px',
        cursor: loading ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:600,
      }}>{loading ? '⚙️ Generating...' : '🗄️ Generate SQL'}</button>

      {error && <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontSize:'13px' }}>{error}</div>}

      {result && (
        <div style={{ marginTop:'24px' }}>
          {/* SQL output */}
          <div style={{ marginBottom:'16px', background:'#0f172a', borderRadius:'10px', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid #1e293b' }}>
              <span style={{ fontSize:'12px', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>SQL</span>
              <button onClick={copySql} style={{ padding:'4px 12px', background: copied ? '#059669' : '#1e293b', border:'1px solid #334155', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color: copied ? '#fff' : '#94a3b8' }}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <pre style={{ margin:0, padding:'16px', color:'#e2e8f0', fontSize:'13px', fontFamily:'monospace', overflowX:'auto', lineHeight:1.6 }}>{result.sql}</pre>
          </div>

          {/* Explanation */}
          {result.explanation && (
            <div style={{ marginBottom:'16px', padding:'14px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px' }}>
              <div style={{ fontSize:'12px', fontWeight:600, color:'#64748b', marginBottom:'6px' }}>EXPLANATION</div>
              <p style={{ margin:0, fontSize:'14px', color:'#374151', lineHeight:1.6 }}>{result.explanation}</p>
            </div>
          )}

          {/* Notes */}
          {result.notes?.length > 0 && (
            <div style={{ marginBottom:'16px', padding:'14px 16px', background:'#fefce8', border:'1px solid #fde68a', borderRadius:'10px' }}>
              <div style={{ fontSize:'12px', fontWeight:600, color:'#92400e', marginBottom:'8px' }}>📝 NOTES</div>
              {result.notes.map((n: string, i: number) => (
                <div key={i} style={{ fontSize:'13px', color:'#78350f', padding:'3px 0', display:'flex', gap:'8px' }}><span>•</span><span>{n}</span></div>
              ))}
            </div>
          )}

          {/* Alternatives */}
          {result.alternatives?.length > 0 && (
            <div>
              <div style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>ALTERNATIVE APPROACHES</div>
              {result.alternatives.map((alt: any, i: number) => (
                <div key={i} style={{ marginBottom:'10px', background:'#0f172a', borderRadius:'8px', overflow:'hidden' }}>
                  <div style={{ padding:'8px 14px', background:'#1e293b', fontSize:'12px', color:'#94a3b8', fontWeight:600 }}>{alt.label}</div>
                  <pre style={{ margin:0, padding:'12px 14px', color:'#e2e8f0', fontSize:'12px', fontFamily:'monospace', overflowX:'auto' }}>{alt.sql}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_extract() {
  const BACKEND = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const SCHEMAS = [
    { id:'contacts',   icon:'👤', label:'Contacts',    desc:'Names, emails, phones, companies' },
    { id:'dates',      icon:'📅', label:'Dates',       desc:'Dates, deadlines, time refs' },
    { id:'keywords',   icon:'🔑', label:'Keywords',    desc:'Topics, entities, keywords' },
    { id:'financials', icon:'💰', label:'Financials',  desc:'Amounts, prices, percentages' },
    { id:'tasks',      icon:'✅', label:'Tasks',       desc:'Action items with owners & due dates' },
    { id:'sentiment',  icon:'💬', label:'Sentiment',   desc:'Sentiment analysis + themes' },
    { id:'products',   icon:'📦', label:'Products',    desc:'Items, prices, descriptions' },
    { id:'custom',     icon:'⚙️', label:'Custom',      desc:'Define your own schema' },
  ];
  const [text, setText] = React.useState('');
  const [schema, setSchema] = React.useState('contacts');
  const [customSchema, setCustomSchema] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const r = await fetch(`${BACKEND}/api/extract`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` },
        body: JSON.stringify({ text, schema, customSchema })
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result?.result || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([result?.result || ''], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `extracted_${schema}.json`; a.click();
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>🗂 Data Extractor</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Pull structured JSON data from any unstructured text — emails, docs, web content.</p>

        {/* Schema picker */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
          {SCHEMAS.map(s => (
            <button key={s.id} onClick={() => setSchema(s.id)} title={s.desc}
              style={{ padding:'8px 16px', borderRadius:8, border:`2px solid ${schema===s.id ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: schema===s.id ? 'rgba(255,100,50,0.12)' : 'var(--fg-bg2)', color: schema===s.id ? 'var(--fg-orange)' : 'var(--fg-text3)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {schema === 'custom' && (
          <div style={{ marginBottom:14 }}>
            <input value={customSchema} onChange={e=>setCustomSchema(e.target.value)} placeholder='e.g. Extract all company names, their revenue, and CEO names as JSON...'
              style={{ width:'100%', padding:'10px 14px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }} />
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap:18, marginBottom:18 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Input Text</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your text here — email, article, report, meeting notes..."
              rows={16} style={{ width:'100%', padding:'12px 14px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box', lineHeight:1.7 }} />
          </div>
          {result && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Extracted JSON</div>
                  {result.valid && <span style={{ fontSize:10, padding:'2px 8px', background:'#16a34a20', border:'1px solid #16a34a', borderRadius:10, color:'#16a34a' }}>✓ Valid JSON</span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={copy} style={{ padding:'5px 12px', background:copied?'#16a34a':'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:6, color:copied?'#fff':'var(--fg-text)', fontSize:11, cursor:'pointer' }}>{copied?'✓':'📋'} Copy</button>
                  <button onClick={download} style={{ padding:'5px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:11, cursor:'pointer' }}>⬇ JSON</button>
                </div>
              </div>
              <pre style={{ width:'100%', minHeight:250, maxHeight:450, padding:'12px 14px', background:'#0d0d0d', border:'1px solid var(--fg-orange)', borderRadius:10, color:'#86efac', fontSize:12, fontFamily:'monospace', lineHeight:1.6, whiteSpace:'pre-wrap', overflowY:'auto', boxSizing:'border-box', margin:0 }}>{result.result}</pre>
            </div>
          )}
        </div>

        {error && <div style={{ background:'#ef444420', border:'1px solid #ef4444', borderRadius:8, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>}

        <button onClick={run} disabled={loading || !text.trim() || (schema === 'custom' && !customSchema.trim())}
          style={{ padding:'12px 36px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:(loading||!text.trim())?0.5:1 }}>
          {loading ? '⏳ Extracting…' : `${SCHEMAS.find(s=>s.id===schema)?.icon} Extract ${SCHEMAS.find(s=>s.id===schema)?.label}`}
        </button>
      </div>
    </div>
  );
}

export function ForgeTab_codeplay() {
  const BACKEND = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const MODES = [
    { id:'review',   icon:'🔍', label:'Review',   desc:'Find bugs & issues' },
    { id:'explain',  icon:'💡', label:'Explain',  desc:'Understand the code' },
    { id:'fix',      icon:'🔧', label:'Fix Bugs', desc:'Auto-fix problems' },
    { id:'comment',  icon:'📝', label:'Comment',  desc:'Add inline docs' },
    { id:'optimize', icon:'⚡', label:'Optimize', desc:'Faster & cleaner' },
    { id:'test',     icon:'✅', label:'Tests',    desc:'Write unit tests' },
    { id:'convert',  icon:'🔄', label:'Convert',  desc:'Change language' },
    { id:'security', icon:'🔒', label:'Security', desc:'Audit for vulns' },
  ];
  const LANGS = ['Auto-detect','JavaScript','TypeScript','Python','Go','Rust','Java','C#','C++','Ruby','PHP','Swift','Kotlin','SQL','Bash'];
  const [code, setCode] = React.useState('');
  const [lang, setLang] = React.useState('Auto-detect');
  const [mode, setMode] = React.useState('review');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const run = async (m?: string) => {
    const activeMode = m || mode;
    if (!code.trim()) return;
    setMode(activeMode); setLoading(true); setResult(''); setError('');
    try {
      const r = await fetch(`${BACKEND}/api/code-assist`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` },
        body: JSON.stringify({ code, mode: activeMode, language: lang === 'Auto-detect' ? '' : lang })
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>🖥 Code Playground</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>AI-powered code review, explanation, fixing, optimization, and more.</p>

        {/* Mode buttons */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => code.trim() ? run(m.id) : setMode(m.id)} title={m.desc}
              style={{ padding:'8px 16px', borderRadius:8, border:`2px solid ${mode===m.id ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: mode===m.id ? 'rgba(255,100,50,0.12)' : 'var(--fg-bg2)', color: mode===m.id ? 'var(--fg-orange)' : 'var(--fg-text3)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
              {m.icon} {m.label}
            </button>
          ))}
          <select value={lang} onChange={e=>setLang(e.target.value)} style={{ padding:'8px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12, marginLeft:'auto' }}>
            {LANGS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap:18, marginBottom:18 }}>
          {/* Code input */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Your Code</div>
            <textarea value={code} onChange={e=>setCode(e.target.value)} placeholder={'// Paste your code here...\nfunction example() {\n  return "hello world";\n}'}
              rows={18} style={{ width:'100%', padding:'12px 14px', background:'#0d0d0d', border:'1px solid var(--fg-border)', borderRadius:10, color:'#e2e8f0', fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'monospace', lineHeight:1.6 }} />
          </div>
          {/* Result */}
          {result && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>{MODES.find(m=>m.id===mode)?.label} Result</div>
                <button onClick={copy} style={{ padding:'5px 12px', background: copied?'#16a34a':'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:6, color:copied?'#fff':'var(--fg-text)', fontSize:11, cursor:'pointer', transition:'all 0.2s' }}>{copied?'✓ Copied':'📋 Copy'}</button>
              </div>
              <div style={{ width:'100%', minHeight:300, padding:'12px 14px', background:'#0d0d0d', border:'1px solid var(--fg-orange)', borderRadius:10, color:'#e2e8f0', fontSize:13, fontFamily:'monospace', lineHeight:1.6, whiteSpace:'pre-wrap', overflowY:'auto', maxHeight:500, boxSizing:'border-box' }}>{result}</div>
            </div>
          )}
        </div>

        {error && <div style={{ background:'#ef444420', border:'1px solid #ef4444', borderRadius:8, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>}

        <button onClick={() => run()} disabled={loading || !code.trim()}
          style={{ padding:'12px 36px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:(loading||!code.trim())?0.5:1 }}>
          {loading ? '⏳ Analyzing…' : `${MODES.find(m=>m.id===mode)?.icon} ${MODES.find(m=>m.id===mode)?.label}`}
        </button>
      </div>
    </div>
  );
}

export function ForgeTab_writeassist() {
  const BACKEND = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const MODES = [
    { id:'improve',    icon:'✨', label:'Improve' },
    { id:'shorten',    icon:'✂️', label:'Shorten' },
    { id:'expand',     icon:'📖', label:'Expand' },
    { id:'grammar',    icon:'✅', label:'Fix Grammar' },
    { id:'professional',icon:'👔',label:'Professional' },
    { id:'casual',     icon:'😊', label:'Casual' },
    { id:'simplify',   icon:'💡', label:'Simplify' },
    { id:'bullet',     icon:'📋', label:'Bullet Points' },
    { id:'persuasive', icon:'🎯', label:'Persuasive' },
    { id:'emojis',     icon:'🎨', label:'Add Emojis' },
  ];
  const [text, setText] = React.useState('');
  const [mode, setMode] = React.useState('improve');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const run = async (m?: string) => {
    const activeMode = m || mode;
    if (!text.trim()) return;
    setMode(activeMode); setLoading(true); setResult(''); setError('');
    try {
      const r = await fetch(`${BACKEND}/api/write-assist`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` },
        body: JSON.stringify({ text, mode: activeMode })
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>✍️ Writing Assistant</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Transform any text with AI. Improve, shorten, fix, rephrase — instantly.</p>

        {/* Mode picker */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => result ? run(m.id) : setMode(m.id)}
              style={{ padding:'8px 16px', borderRadius:20, border:`2px solid ${mode===m.id ? 'var(--fg-orange)' : 'var(--fg-border)'}`, background: mode===m.id ? 'rgba(255,100,50,0.12)' : 'var(--fg-bg2)', color: mode===m.id ? 'var(--fg-orange)' : 'var(--fg-text3)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap:18, marginBottom:18 }}>
          {/* Input */}
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--fg-text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Original Text</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your text here..." rows={14}
              style={{ width:'100%', padding:'12px 14px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:14, resize:'vertical', boxSizing:'border-box', lineHeight:1.7 }} />
            <div style={{ fontSize:11, color:'var(--fg-text3)', marginTop:4 }}>{text.length} chars · {text.split(/\s+/).filter(Boolean).length} words</div>
          </div>

          {/* Result */}
          {result && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Result ({MODES.find(m=>m.id===mode)?.label})</div>
                <button onClick={copy} style={{ padding:'5px 12px', background: copied ? '#16a34a' : 'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:6, color: copied ? '#fff' : 'var(--fg-text)', fontSize:11, cursor:'pointer', transition:'all 0.2s' }}>{copied ? '✓ Copied' : '📋 Copy'}</button>
              </div>
              <div style={{ width:'100%', minHeight:200, padding:'12px 14px', background:'var(--fg-bg2)', border:'1px solid var(--fg-orange)', borderRadius:10, color:'var(--fg-text)', fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap', overflowY:'auto', maxHeight:400, boxSizing:'border-box' }}>{result}</div>
              <div style={{ fontSize:11, color:'var(--fg-text3)', marginTop:4 }}>{result.length} chars · {result.split(/\s+/).filter(Boolean).length} words</div>
            </div>
          )}
        </div>

        {error && <div style={{ background:'#ef444420', border:'1px solid #ef4444', borderRadius:8, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>}

        <button onClick={() => run()} disabled={loading || !text.trim()}
          style={{ padding:'12px 36px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity: (loading || !text.trim()) ? 0.5 : 1 }}>
          {loading ? '⏳ Transforming…' : `${MODES.find(m=>m.id===mode)?.icon} ${MODES.find(m=>m.id===mode)?.label}`}
        </button>
      </div>
    </div>
  );
}

export function ForgeTab_batch() {
  const BACKEND = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const [template, setTemplate] = React.useState('Summarize this in one sentence:\n\n{{input}}');
  const [inputsRaw, setInputsRaw] = React.useState('');
  const [model, setModel] = React.useState('claude-haiku-4-5');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const inputs = inputsRaw.split('\n').map(s => s.trim()).filter(Boolean);

  const run = async () => {
    if (!template.trim() || inputs.length === 0) return;
    setLoading(true); setResults([]); setError('');
    try {
      const r = await fetch(`${BACKEND}/api/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ template, inputs, model })
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setResults(d.results || []);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const exportCSV = () => {
    const rows = [['Input','Output','Time(ms)'], ...results.map(r => [JSON.stringify(r.input), JSON.stringify(r.output), r.elapsed])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = 'batch_results.csv'; a.click();
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>⚡ Batch Processor</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Run a prompt template over many inputs at once. Use <code style={{ background:'var(--fg-bg2)', padding:'1px 5px', borderRadius:4 }}>{'{{input}}'}</code> in your template.</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
          {/* Template */}
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--fg-text)' }}>📝 Prompt Template</div>
              <select value={model} onChange={e=>setModel(e.target.value)} style={{ padding:'5px 10px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:11 }}>
                <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>
            <textarea value={template} onChange={e=>setTemplate(e.target.value)} rows={8}
              style={{ width:'100%', padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'monospace' }} />
          </div>
          {/* Inputs */}
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--fg-text)', marginBottom:10 }}>📋 Inputs <span style={{ color:'var(--fg-text3)', fontWeight:400 }}>({inputs.length} / 50, one per line)</span></div>
            <textarea value={inputsRaw} onChange={e=>setInputsRaw(e.target.value)} rows={8}
              placeholder={"Apple\nBanana\nOrange\n..."}
              style={{ width:'100%', padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
          </div>
        </div>

        <div style={{ display:'flex', gap:12, marginBottom:24 }}>
          <button onClick={run} disabled={loading || !template.trim() || inputs.length === 0 || inputs.length > 50}
            style={{ padding:'11px 32px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity: (loading || !template.trim() || inputs.length === 0) ? 0.5 : 1 }}>
            {loading ? `⏳ Processing ${inputs.length} inputs…` : `▶ Run Batch (${inputs.length} inputs)`}
          </button>
          {results.length > 0 && (
            <button onClick={exportCSV} style={{ padding:'11px 20px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, cursor:'pointer' }}>⬇ Export CSV</button>
          )}
        </div>

        {error && <div style={{ background:'#ef444420', border:'1px solid #ef4444', borderRadius:8, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>}

        {results.length > 0 && (
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--fg-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--fg-text)' }}>Results ({results.length})</div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'var(--fg-bg)' }}>
                    {['#','Input','Output','Time'].map(h => <th key={h} style={{ textAlign:'left', padding:'8px 14px', color:'var(--fg-text3)', fontWeight:600, borderBottom:'1px solid var(--fg-border)', whiteSpace:'nowrap' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--fg-border)' }}>
                      <td style={{ padding:'8px 14px', color:'var(--fg-text3)', width:32 }}>{i+1}</td>
                      <td style={{ padding:'8px 14px', color:'var(--fg-text)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.input}</td>
                      <td style={{ padding:'8px 14px', color:'var(--fg-text)', lineHeight:1.5 }}>{r.output}</td>
                      <td style={{ padding:'8px 14px', color:'var(--fg-text3)', whiteSpace:'nowrap' }}>{r.elapsed}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_prompts() {
  const BACKEND = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const CATEGORIES = ['General','Writing','Coding','Analysis','Creative','Research','Business','Marketing'];
  const [prompts, setPrompts] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [catFilter, setCatFilter] = React.useState('All');
  const [showNew, setShowNew] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newContent, setNewContent] = React.useState('');
  const [newCat, setNewCat] = React.useState('General');
  const [saving, setSaving] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<number|null>(null);

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (catFilter !== 'All') params.set('category', catFilter);
    fetch(`${BACKEND}/api/prompts?${params}`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(d => setPrompts(d.prompts || [])).catch(() => {});
  };

  React.useEffect(() => { load(); }, [search, catFilter]);

  const save = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSaving(true);
    await fetch(`${BACKEND}/api/prompts`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${tok}` }, body: JSON.stringify({ title: newTitle, content: newContent, category: newCat }) });
    setSaving(false); setNewTitle(''); setNewContent(''); setShowNew(false); load();
  };

  const del = async (id: number) => {
    await fetch(`${BACKEND}/api/prompts/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${tok}` } });
    load();
  };

  const copy = async (p: any) => {
    await navigator.clipboard.writeText(p.content);
    setCopiedId(p.id); setTimeout(() => setCopiedId(null), 2000);
    fetch(`${BACKEND}/api/prompts/${p.id}/use`, { method:'POST', headers:{ Authorization:`Bearer ${tok}` } });
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:920, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>📋 Prompt Library</h1>
            <p style={{ color:'var(--fg-text3)', fontSize:13 }}>Save, organize, and reuse your best prompts.</p>
          </div>
          <button onClick={() => setShowNew(v => !v)} style={{ padding:'9px 20px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ New Prompt</button>
        </div>

        {showNew && (
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-orange)', borderRadius:12, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:14 }}>New Prompt</div>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Title..." style={{ width:'100%', padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, marginBottom:10, boxSizing:'border-box' }} />
            <select value={newCat} onChange={e=>setNewCat(e.target.value)} style={{ width:'100%', padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, marginBottom:10, boxSizing:'border-box' }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="Prompt content..." rows={5} style={{ width:'100%', padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:12 }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={save} disabled={saving||!newTitle.trim()||!newContent.trim()} style={{ padding:'9px 22px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:saving?0.5:1 }}>{saving?'Saving…':'Save'}</button>
              <button onClick={() => setShowNew(false)} style={{ padding:'9px 16px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text3)', fontSize:13, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search prompts..." style={{ flex:1, padding:'9px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }} />
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{ padding:'9px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }}>
            <option>All</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Prompt cards */}
        {prompts.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--fg-text3)' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
            <div style={{ fontSize:14 }}>No prompts yet. Click "New Prompt" to save your first one.</div>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))', gap:14 }}>
          {prompts.map((p: any) => (
            <div key={p.id} style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', flex:1 }}>{p.title}</div>
                <span style={{ fontSize:10, padding:'2px 8px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text3)', marginLeft:8, flexShrink:0 }}>{p.category}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--fg-text3)', marginBottom:12, maxHeight:80, overflowY:'auto', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{p.content}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--fg-text3)' }}>Used {p.use_count || 0}×</span>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => copy(p)} style={{ padding:'6px 14px', background: copiedId===p.id ? '#16a34a' : 'var(--fg-orange)', border:'none', borderRadius:6, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', transition:'background 0.2s' }}>{copiedId===p.id ? '✓ Copied' : '📋 Copy'}</button>
                  <button onClick={() => del(p.id)} style={{ padding:'6px 10px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'#ef4444', fontSize:12, cursor:'pointer' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ForgeTab_compare() {
  const BACKEND = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const PRESET_MODELS = [
    { id:'claude-haiku-4-5', label:'Claude Haiku 4.5', color:'#f97316' },
    { id:'claude-sonnet-4-5', label:'Claude Sonnet 4.5', color:'#f97316' },
    { id:'gpt-4o-mini', label:'GPT-4o Mini', color:'#10b981' },
    { id:'gpt-4o', label:'GPT-4o', color:'#10b981' },
    { id:'gemini-1.5-flash', label:'Gemini 1.5 Flash', color:'#3b82f6' },
    { id:'gemini-2.0-flash', label:'Gemini 2.0 Flash', color:'#3b82f6' },
  ];
  const [prompt, setPrompt] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>(['claude-haiku-4-5', 'gpt-4o-mini']);
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const toggle = (id: string) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
  );

  const run = async () => {
    if (!prompt.trim() || selected.length < 2) return;
    setLoading(true); setResults([]);
    try {
      const r = await fetch(`${BACKEND}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ prompt: prompt.trim(), models: selected })
      });
      const d = await r.json();
      setResults(d.results || []);
    } catch(e: any) { setResults([{ model: 'Error', result: e.message, error: true }]); }
    setLoading(false);
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>⚖️ Model Comparison</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Run the same prompt across multiple models and compare responses side-by-side.</p>

        {/* Model picker */}
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:18, marginBottom:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--fg-text)', marginBottom:12 }}>Select 2–4 Models</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {PRESET_MODELS.map(m => {
              const on = selected.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggle(m.id)} style={{ padding:'7px 14px', borderRadius:20, border:`2px solid ${on ? m.color : 'var(--fg-border)'}`, background: on ? `${m.color}20` : 'var(--fg-bg)', color: on ? m.color : 'var(--fg-text3)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                  {on ? '✓ ' : ''}{m.label}
                </button>
              );
            })}
          </div>
          {selected.length < 2 && <div style={{ fontSize:11, color:'#f59e0b', marginTop:8 }}>⚠ Select at least 2 models.</div>}
        </div>

        {/* Prompt */}
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:18, marginBottom:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--fg-text)', marginBottom:10 }}>Prompt</div>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your prompt here..." rows={4}
            style={{ width:'100%', padding:'10px 14px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, resize:'vertical', boxSizing:'border-box', outline:'none' }} />
          <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
            <button onClick={run} disabled={loading || selected.length < 2 || !prompt.trim()}
              style={{ padding:'10px 28px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity: (loading || selected.length < 2 || !prompt.trim()) ? 0.5 : 1 }}>
              {loading ? '⏳ Comparing…' : '▶ Compare'}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns: `repeat(${Math.min(results.length, 2)}, 1fr)`, gap:16 }}>
            {results.map((r: any, i: number) => {
              const modelMeta = PRESET_MODELS.find(m => m.id === r.model);
              const col = modelMeta?.color || '#6b7280';
              return (
                <div key={i} style={{ background:'var(--fg-bg2)', border:`1px solid ${r.error ? '#ef4444' : col + '44'}`, borderRadius:12, padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: col }}>{modelMeta?.label || r.model}</div>
                    <div style={{ fontSize:11, color:'var(--fg-text3)' }}>{r.elapsed ? `${(r.elapsed/1000).toFixed(1)}s` : ''}{r.tokens ? ` · ${r.tokens} tok` : ''}</div>
                  </div>
                  <div style={{ fontSize:13, color: r.error ? '#ef4444' : 'var(--fg-text)', lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:400, overflowY:'auto' }}>{r.result}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
