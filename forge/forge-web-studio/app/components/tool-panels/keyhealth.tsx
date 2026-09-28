'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_keyhealth() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [health, setHealth] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [probedAt, setProbedAt] = React.useState('');
          const PROVIDERS: Record<string,{icon:string,name:string,color:string}> = {
            anthropic:  { icon:'🟣', name:'Anthropic (Claude)', color:'#c96442' },
            openai:     { icon:'🟢', name:'OpenAI',             color:'#10a37f' },
            gemini:     { icon:'🔵', name:'Google Gemini',      color:'#4285f4' },
            groq:       { icon:'⚡', name:'Groq',               color:'#f04444' },
            mistral:    { icon:'🌊', name:'Mistral AI',         color:'#ff7000' },
            openrouter: { icon:'🔀', name:'OpenRouter',         color:'#6366f1' },
          };
          const probe = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/keys/health`, { headers: { Authorization: `Bearer ${tok}` } });
              const d = await r.json();
              setHealth(d.results || {});
              setProbedAt(d.probed_at || '');
            } finally { setLoading(false); }
          };
          React.useEffect(() => { probe(); }, []);
          const allOk = health && Object.values(health).every((v:any) => v.status === 'ok');
          return (
            <div style={{ flex:1, overflowY:'auto', padding:32 }}>
              <div style={{ maxWidth:700, margin:'0 auto' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🩺</div>
                  <div>
                    <h2 style={{ margin:0, color:'var(--fg-text)', fontSize:20, fontWeight:800 }}>API Key Health</h2>
                    <p style={{ margin:0, color:'var(--fg-text3)', fontSize:13 }}>Live probe of every connected provider</p>
                  </div>
                  <button onClick={probe} disabled={loading} style={{ marginLeft:'auto', padding:'8px 18px', borderRadius:10, border:'1px solid var(--fg-border)', background:'var(--fg-bg3)', color:'var(--fg-text2)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                    {loading ? '⏳ Probing…' : '↻ Re-probe'}
                  </button>
                </div>
                {health && (
                  <div style={{ padding:'12px 16px', borderRadius:12, background: allOk ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${allOk ? '#10b981' : '#ef4444'}`, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>{allOk ? '✅' : '⚠️'}</span>
                    <span style={{ fontSize:14, fontWeight:700, color: allOk ? '#10b981' : '#ef4444' }}>
                      {allOk ? 'All keys healthy' : 'Some keys need attention'}
                    </span>
                    {probedAt && <span style={{ marginLeft:'auto', fontSize:11, color:'var(--fg-text3)' }}>Last probed {probedAt.slice(11,19)} UTC</span>}
                  </div>
                )}
                {!health && !loading && <p style={{ color:'var(--fg-text3)', fontSize:13 }}>No keys configured yet. Add API keys in Settings.</p>}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {health && Object.entries(PROVIDERS).map(([key, p]) => {
                    const h = health[key];
                    if (!h) return null;
                    const ok = h.status === 'ok';
                    return (
                      <div key={key} style={{ borderRadius:12, border:`1px solid ${ok ? 'var(--fg-border)' : '#ef4444'}`, background:'var(--fg-bg2)', padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                        <span style={{ fontSize:22 }}>{p.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:2 }}>{p.name}</div>
                          {h.error && <div style={{ fontSize:11, color:'#ef4444' }}>{h.error}</div>}
                        </div>
                        {h.latency_ms && (
                          <div style={{ textAlign:'right', minWidth:70 }}>
                            <div style={{ fontSize:16, fontWeight:800, color: h.latency_ms < 500 ? '#10b981' : h.latency_ms < 1500 ? '#f59e0b' : '#ef4444' }}>{h.latency_ms}ms</div>
                            <div style={{ fontSize:10, color:'var(--fg-text3)' }}>latency</div>
                          </div>
                        )}
                        <div style={{ width:80, textAlign:'center', padding:'5px 12px', borderRadius:8, background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border:`1px solid ${ok ? '#10b981' : '#ef4444'}`, color: ok ? '#10b981' : '#ef4444', fontSize:12, fontWeight:800 }}>
                          {ok ? '✓ OK' : '✗ ERROR'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
}

export function ForgeTab_leads() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
                const [leads, setLeads] = React.useState<any[]>([]);
                const [total, setTotal] = React.useState(0);
                const [loading, setLoading] = React.useState(false);
                const [filter, setFilter] = React.useState('');
                React.useEffect(() => {
                  setLoading(true);
                  fetch(`${API}/api/leads`, { headers: { Authorization: `Bearer ${tok}` } })
                    .then(r => r.json())
                    .then(d => { const rows = Array.isArray(d?.data) ? d.data : []; setLeads(rows); setTotal(rows.length); })
                    .catch(() => { setLeads([]); setTotal(0); })
                    .finally(() => setLoading(false));
                }, []);
                const del = async (id: string) => {
                  const r = await fetch(`${API}/api/leads/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${tok}` } });
                  if (!r.ok) return;
                  setLeads(prev => { const next = prev.filter(l => l.id !== id); setTotal(next.length); return next; });
                };
                const needle = filter.trim().toLowerCase();
                const filtered = needle
                  ? leads.filter((l:any) => [l.email, l.name, l.company].some((v:any) => String(v || '').toLowerCase().includes(needle)))
                  : leads;
                const byStatus = leads.reduce((acc:any, l:any) => { const key = l.status || 'new'; acc[key]=(acc[key]||0)+1; return acc; }, {});
                return (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', gap:8 }}>
                        {Object.entries(byStatus).map(([src, cnt]:any) => (
                          <div key={src} style={{ padding:'4px 12px', borderRadius:20, background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', fontSize:12, color:'var(--fg-text2)' }}>
                            {src}: <b>{cnt}</b>
                          </div>
                        ))}
                        <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(255,107,53,0.1)', border:'1px solid var(--fg-orange)', fontSize:12, color:'var(--fg-orange)', fontWeight:700 }}>
                          Total: {total}
                        </div>
                      </div>
                      <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by email / name / company…" style={{ flex:1, minWidth:200, padding:'6px 12px', borderRadius:8, border:'1px solid var(--fg-border)', background:'var(--fg-bg)', color:'var(--fg-text)', fontSize:13 }} />
                    </div>
                    {loading && <p style={{ color:'var(--fg-text3)', fontSize:13 }}>Loading…</p>}
                    <div style={{ background:'var(--fg-bg3)', borderRadius:12, border:'1px solid var(--fg-border)', overflow:'hidden' }}>
                       <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 120px 40px', padding:'10px 16px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)' }}>
                        {['Email','Name','Company','Status','Date',''].map(h => <span key={h} style={{ fontSize:11, color:'var(--fg-text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>)}
                      </div>
                      {filtered.length === 0 && !loading && <p style={{ color:'var(--fg-text3)', fontSize:13, padding:16 }}>No leads yet.</p>}
                      {filtered.map((l:any) => (
                        <div key={l.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 120px 40px', padding:'10px 16px', borderBottom:'1px solid var(--fg-bg)', alignItems:'center' }}>
                          <span style={{ fontSize:13, color:'var(--fg-text)', fontWeight:500 }}>{l.email}</span>
                          <span style={{ fontSize:12, color:'var(--fg-text2)' }}>{l.name||'—'}</span>
                          <span style={{ fontSize:12, color:'var(--fg-text2)' }}>{l.company||'—'}</span>
                          <span style={{ fontSize:12, color:'var(--fg-orange)' }}>{l.status||'new'}</span>
                          <span style={{ fontSize:11, color:'var(--fg-text3)' }}>{l.created_at?.slice(0,16)}</span>
                          <button onClick={()=>del(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:14, padding:0 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
}

export function ForgeTab_github_v1() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [status, setStatus] = React.useState<any>(null);
  const [pat, setPat] = React.useState('');
  const [connecting, setConnecting] = React.useState(false);
  const [repos, setRepos] = React.useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = React.useState<any>(null);
  const [files, setFiles] = React.useState<any[]>([]);
  const [currentPath, setCurrentPath] = React.useState('');
  const [fileContent, setFileContent] = React.useState('');
  const [fileSha, setFileSha] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState('');
  const [commits, setCommits] = React.useState<any[]>([]);
  const [review, setReview] = React.useState('');
  const [reviewing, setReviewing] = React.useState(false);
  const [commitMsg, setCommitMsg] = React.useState('');
  const [editedContent, setEditedContent] = React.useState('');
  const [committing, setCommitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'repos'|'files'|'review'|'commits'>('repos');
  const h = { Authorization: `Bearer ${tok}` };

  React.useEffect(() => {
    fetch(`${API}/api/integrations/github/status`, { headers: h }).then(r => r.json()).then(d => { setStatus(d); if (d.connected) loadRepos(); }).catch(() => {});
  }, []);

  async function loadRepos() {
    const r = await fetch(`${API}/api/integrations/github/repos`, { headers: h });
    const d = await r.json();
    setRepos(d.repos || []);
  }

  async function connect() {
    if (!pat.trim()) return;
    setConnecting(true);
    try {
      const r = await fetch(`${API}/api/integrations/github/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token: pat }) });
      const d = await r.json();
      if (d.ok) { setStatus({ connected: true, username: d.username, avatar: d.avatar }); setPat(''); loadRepos(); }
      else alert(d.error);
    } catch(e:any) { alert(e.message); }
    setConnecting(false);
  }

  async function loadFiles(repo: any, path = '') {
    setSelectedRepo(repo); setCurrentPath(path); setFileContent(''); setSelectedFile(''); setReview('');
    const r = await fetch(`${API}/api/integrations/github/repo/${repo.full_name.split('/')[0]}/${repo.full_name.split('/')[1]}/files?path=${encodeURIComponent(path)}&branch=${repo.default_branch}`, { headers: h });
    const d = await r.json();
    setFiles(d.files || []);
    setActiveTab('files');
    const rc = await fetch(`${API}/api/integrations/github/repo/${repo.full_name.split('/')[0]}/${repo.full_name.split('/')[1]}/commits?branch=${repo.default_branch}`, { headers: h });
    const rcd = await rc.json();
    setCommits(rcd.commits || []);
  }

  async function openFile(file: any) {
    if (file.type === 'dir') { loadFiles(selectedRepo, file.path); return; }
    setSelectedFile(file.path);
    const [owner, repo] = selectedRepo.full_name.split('/');
    const r = await fetch(`${API}/api/integrations/github/repo/${owner}/${repo}/file?path=${encodeURIComponent(file.path)}&branch=${selectedRepo.default_branch}`, { headers: h });
    const d = await r.json();
    setFileContent(d.content || ''); setFileSha(d.sha || ''); setEditedContent(d.content || '');
  }

  async function doReview() {
    if (!selectedFile || !selectedRepo) return;
    setReviewing(true); setReview('');
    const [owner, repo] = selectedRepo.full_name.split('/');
    const r = await fetch(`${API}/api/integrations/github/repo/${owner}/${repo}/ai-review`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ path: selectedFile, branch: selectedRepo.default_branch }) });
    const d = await r.json();
    setReview(d.review || d.error || 'Error');
    setReviewing(false); setActiveTab('review');
  }

  async function doCommit() {
    if (!commitMsg.trim() || !editedContent || !selectedRepo) return;
    setCommitting(true);
    const [owner, repo] = selectedRepo.full_name.split('/');
    const r = await fetch(`${API}/api/integrations/github/repo/${owner}/${repo}/commit`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ path: selectedFile, content: editedContent, message: commitMsg, sha: fileSha, branch: selectedRepo.default_branch }) });
    const d = await r.json();
    if (d.ok) { alert(`✅ Committed! SHA: ${d.commit}`); setCommitMsg(''); setFileSha(d.sha); }
    else alert(d.error);
    setCommitting(false);
  }

  const tabStyle = (t: string) => ({ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: activeTab === t ? '#6366f1' : 'var(--fg-bg2)', color: activeTab === t ? '#fff' : 'var(--fg-text2)' });

  if (!status) return <div style={{ padding: 40, color: 'var(--fg-text3)' }}>Loading…</div>;

  if (!status.connected) return (
    <div style={{ maxWidth: 500, margin: '60px auto', padding: 32, background: 'var(--fg-bg2)', borderRadius: 16, border: '1px solid var(--fg-border)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🐙</div>
      <h2 style={{ margin: '0 0 8px', color: 'var(--fg-text)' }}>Connect GitHub</h2>
      <p style={{ color: 'var(--fg-text3)', fontSize: 13, marginBottom: 24 }}>Paste a Personal Access Token (PAT) with <code>repo</code> scope. <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>Create one here →</a></p>
      <input value={pat} onChange={e => setPat(e.target.value)} type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--fg-border)', background: 'var(--fg-bg3)', color: 'var(--fg-text)', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }} />
      <button onClick={connect} disabled={connecting || !pat.trim()} style={{ width: '100%', padding: '10px', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: connecting || !pat.trim() ? 0.5 : 1 }}>{connecting ? 'Connecting…' : '🔗 Connect GitHub'}</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 260, borderRight: '1px solid var(--fg-border)', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--fg-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={status.avatar} style={{ width: 28, height: 28, borderRadius: 14 }} alt="" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text)' }}>{status.username}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-text3)' }}>GitHub Connected</div>
          </div>
          <button onClick={() => { fetch(`${API}/api/integrations/github/disconnect`, { method: 'DELETE', headers: h }).then(() => { setStatus({ connected: false }); setRepos([]); setSelectedRepo(null); }); }} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #ef444444', borderRadius: 6, color: '#ef4444', fontSize: 10, cursor: 'pointer', padding: '2px 6px' }}>Disconnect</button>
        </div>
        <div style={{ padding: '8px 0' }}>
          {repos.map(r => (
            <div key={r.id} onClick={() => loadFiles(r)} style={{ padding: '8px 16px', cursor: 'pointer', background: selectedRepo?.id === r.id ? '#6366f122' : 'transparent', borderLeft: selectedRepo?.id === r.id ? '2px solid #6366f1' : '2px solid transparent' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {r.private ? '🔒' : '📁'} {r.name}
              </div>
              {r.language && <div style={{ fontSize: 10, color: 'var(--fg-text3)', marginTop: 2 }}>{r.language} · ⭐{r.stars}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedRepo ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--fg-text3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐙</div>
            <div>Select a repository to browse files, view commits, and run AI code reviews.</div>
          </div>
        ) : (<>
          {/* Tab bar */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--fg-border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text)', marginRight: 8 }}>{selectedRepo.name}</div>
            <button style={tabStyle('files')} onClick={() => setActiveTab('files')}>📁 Files</button>
            <button style={tabStyle('commits')} onClick={() => setActiveTab('commits')}>📝 Commits</button>
            {selectedFile && <><button style={tabStyle('review')} onClick={() => { if (!review) doReview(); else setActiveTab('review'); }}>🤖 AI Review</button></>}
            {selectedFile && <span style={{ fontSize: 11, color: 'var(--fg-text3)', marginLeft: 4 }}>/{selectedFile}</span>}
          </div>

          {/* File browser */}
          {activeTab === 'files' && (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ width: 240, borderRight: '1px solid var(--fg-border)', overflowY: 'auto', padding: '8px 0' }}>
                {currentPath && <div onClick={() => { const parts = currentPath.split('/'); parts.pop(); loadFiles(selectedRepo, parts.join('/')); }} style={{ padding: '6px 12px', cursor: 'pointer', color: '#6366f1', fontSize: 12 }}>← ..</div>}
                {files.map(f => (
                  <div key={f.path} onClick={() => openFile(f)} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: selectedFile === f.path ? '#6366f1' : 'var(--fg-text)', background: selectedFile === f.path ? '#6366f111' : 'transparent', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {f.type === 'dir' ? '📂' : '📄'} {f.name}
                    {f.type === 'file' && <span style={{ marginLeft: 'auto', color: 'var(--fg-text3)', fontSize: 10 }}>{Math.round(f.size/1024*10)/10}kb</span>}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {selectedFile ? (<>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--fg-border)', display: 'flex', gap: 8 }}>
                    <button onClick={doReview} disabled={reviewing} style={{ padding: '4px 12px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{reviewing ? 'Reviewing…' : '🤖 AI Review'}</button>
                    <input value={commitMsg} onChange={e => setCommitMsg(e.target.value)} placeholder="Commit message…" style={{ flex: 1, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--fg-border)', background: 'var(--fg-bg2)', color: 'var(--fg-text)', fontSize: 12 }} />
                    <button onClick={doCommit} disabled={committing || !commitMsg.trim()} style={{ padding: '4px 12px', background: '#22c55e', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{committing ? 'Pushing…' : '⬆ Commit'}</button>
                  </div>
                  <textarea value={editedContent} onChange={e => setEditedContent(e.target.value)} style={{ flex: 1, padding: 16, background: '#0d0d0d', color: '#e2e8f0', border: 'none', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, resize: 'none', outline: 'none' }} />
                </>) : <div style={{ padding: 32, color: 'var(--fg-text3)', fontSize: 13 }}>Select a file to view and edit.</div>}
              </div>
            </div>
          )}

          {/* Commits */}
          {activeTab === 'commits' && (
            <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
              {commits.map(c => (
                <div key={c.sha} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--fg-bg2)', border: '1px solid var(--fg-border)', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <code style={{ fontSize: 11, color: '#6366f1', background: '#6366f122', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{c.sha}</code>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--fg-text)', marginBottom: 4 }}>{c.message.split('\n')[0]}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-text3)' }}>{c.author} · {new Date(c.date).toLocaleDateString()}</div>
                  </div>
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none' }}>View →</a>
                </div>
              ))}
            </div>
          )}

          {/* AI Review */}
          {activeTab === 'review' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {reviewing ? <div style={{ color: 'var(--fg-text3)' }}>🤖 Analyzing {selectedFile}…</div> : review ? (
                <div style={{ background: 'var(--fg-bg2)', border: '1px solid #7c3aed44', borderRadius: 12, padding: 20, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7, color: 'var(--fg-text)' }}>{review}</div>
              ) : <div style={{ color: 'var(--fg-text3)' }}>Select a file and click AI Review.</div>}
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}

export function ForgeTab_integrationsHub({ onOpen }: { onOpen: (id: string) => void }) {
  const [search, setSearch] = React.useState('');
  const [cat, setCat] = React.useState('All');
  const [statuses, setStatuses] = React.useState<Record<string,boolean>>({});
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    // Check connection status for all integrations in parallel
    const providers = INTEGRATION_CATALOG.map(i => i.id === 'stripe_mgmt' ? 'stripe' : i.id);
    Promise.all(
      INTEGRATION_CATALOG.map(async (integ) => {
        const provider = integ.id === 'stripe_mgmt' ? 'stripe' : integ.id;
        try {
          const r = await fetch(`${BACKEND}/api/integrations/${provider}/status`, { headers: h });
          const d = await r.json();
          return { id: integ.id, connected: !!d.connected };
        } catch { return { id: integ.id, connected: false }; }
      })
    ).then(results => {
      const map: Record<string,boolean> = {};
      results.forEach(r => { map[r.id] = r.connected; });
      setStatuses(map);
    });
  }, []);

  const connectedCount = Object.values(statuses).filter(Boolean).length;
  const filtered = INTEGRATION_CATALOG.filter(i =>
    (cat === 'All' || i.cat === cat) &&
    (search === '' || i.label.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase()))
  );
  const grouped = INTEGRATION_CATS.filter(c => c !== 'All').reduce((acc, c) => {
    const items = filtered.filter(i => i.cat === c);
    if (items.length) acc[c] = items;
    return acc;
  }, {} as Record<string, typeof INTEGRATION_CATALOG>);

  return (
    <div style={{ padding: 28, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 16, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>🔌 Integrations</h1>
          <div style={{ background: connectedCount > 0 ? '#18d26e22' : '#ffffff11', border: `1px solid ${connectedCount > 0 ? '#18d26e44' : '#333'}`, borderRadius: 20, padding: '3px 12px', fontSize: 12, color: connectedCount > 0 ? '#18d26e' : '#888' }}>
            {connectedCount} connected
          </div>
        </div>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>Connect your tools to see all your data in one place.</p>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations..." style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#111', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {INTEGRATION_CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: cat === c ? '#ffffff18' : 'transparent', color: cat === c ? '#fff' : '#666', cursor: 'pointer', fontSize: 12, fontWeight: cat === c ? 600 : 400, transition: 'all 0.15s' }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Connected strip */}
      {connectedCount > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#18d26e', marginBottom: 10 }}>● Connected</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {INTEGRATION_CATALOG.filter(i => statuses[i.id]).map(i => (
              <button key={i.id} onClick={() => onOpen(i.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#0a1a0a', border: '1px solid #18d26e44', borderRadius: 10, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0d250d')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0a1a0a')}>
                <span>{i.icon}</span><span>{i.label}</span><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#18d26e', display: 'inline-block' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid by category */}
      {(cat === 'All' ? Object.entries(grouped) : [[cat, filtered] as [string, typeof INTEGRATION_CATALOG]]).map(([catName, items]) => (
        <div key={catName} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 12 }}>{catName}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {(items as typeof INTEGRATION_CATALOG).map(integ => {
              const connected = statuses[integ.id];
              return (
                <button key={integ.id} onClick={() => onOpen(integ.id)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '14px 16px', background: connected ? '#0a120a' : '#0f0f0f', border: `1px solid ${connected ? '#18d26e33' : '#1e1e1e'}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.background = connected ? '#0d1a0d' : '#161616'; e.currentTarget.style.borderColor = connected ? '#18d26e66' : '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = connected ? '#0a120a' : '#0f0f0f'; e.currentTarget.style.borderColor = connected ? '#18d26e33' : '#1e1e1e'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: 22 }}>{integ.icon}</span>
                    {connected
                      ? <span style={{ fontSize: 10, color: '#18d26e', background: '#18d26e18', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Connected</span>
                      : <span style={{ fontSize: 10, color: '#555', background: '#ffffff08', padding: '2px 8px', borderRadius: 20 }}>Connect</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#eee', marginBottom: 2 }}>{integ.label}</div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{integ.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForgeTab_homeHub({ onOpen }: { onOpen: (id: string) => void }) {
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<{
    connected: Array<{id:string;icon:string;label:string;color:string}>;
    github?: any; linear?: any; pagerduty?: any; stripe?: any; datadog?: any; sentry?: any;
  }>({ connected: [] });
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Check which are connected
      const statuses = await Promise.all(
        INTEGRATION_CATALOG.map(async i => {
          const provider = i.id === 'stripe_mgmt' ? 'stripe' : i.id;
          try { const r = await fetch(`${BACKEND}/api/integrations/${provider}/status`, { headers: h }); const d = await r.json(); return { ...i, connected: !!d.connected }; }
          catch { return { ...i, connected: false }; }
        })
      );
      const connected = statuses.filter(s => s.connected);

      // Load quick data from connected services in parallel
      const fetches: Record<string, Promise<any>> = {};
      if (connected.find(c => c.id === 'github')) fetches.github = fetch(`${BACKEND}/api/integrations/github/prs`, { headers: h }).then(r => r.json()).catch(() => ({}));
      if (connected.find(c => c.id === 'linear')) fetches.linear = fetch(`${BACKEND}/api/integrations/linear/issues`, { headers: h }).then(r => r.json()).catch(() => ({}));
      if (connected.find(c => c.id === 'pagerduty')) fetches.pagerduty = fetch(`${BACKEND}/api/integrations/pagerduty/incidents`, { headers: h }).then(r => r.json()).catch(() => ({}));
      if (connected.find(c => c.id === 'stripe_mgmt')) fetches.stripe = fetch(`${BACKEND}/api/integrations/stripe/overview`, { headers: h }).then(r => r.json()).catch(() => ({}));
      if (connected.find(c => c.id === 'sentry')) fetches.sentry = fetch(`${BACKEND}/api/integrations/sentry/issues`, { headers: h }).then(r => r.json()).catch(() => ({}));

      const results = await Promise.all(Object.values(fetches));
      const keys = Object.keys(fetches);
      const extra: Record<string,any> = {};
      keys.forEach((k, i) => { extra[k] = results[i]; });

      setData({ connected, ...extra });
      setLoading(false);
    };
    load();
  }, []);

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const Card = ({ title, children, accent, onClick }: any) => (
    <div onClick={onClick} style={{ background: '#0f0f0f', border: `1px solid #1e1e1e`, borderLeft: `3px solid ${accent || '#333'}`, borderRadius: 12, padding: '16px 18px', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.background = '#141414'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = '#0f0f0f'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: accent || '#555', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
      <div>Loading your dashboard...</div>
    </div>
  );

  if (data.connected.length === 0) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Connect your first tool</h2>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>Your dashboard will show live data from GitHub, Linear, Stripe, and more.</p>
      <button onClick={() => onOpen('integrations')} style={{ background: '#ffffff', color: '#000', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Browse Integrations →</button>
    </div>
  );

  return (
    <div style={{ padding: 28, maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' }}>{greeting()} 👋</h1>
            <p style={{ color: '#666', fontSize: 13, margin: 0 }}>{time.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })} · {data.connected.length} tools connected</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {data.connected.slice(0, 6).map(i => (
              <button key={i.id} onClick={() => onOpen(i.id)} title={i.label} style={{ width: 34, height: 34, borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>{i.icon}</button>
            ))}
            {data.connected.length > 6 && <button onClick={() => onOpen('integrations')} style={{ width: 34, height: 34, borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, color: '#888' }}>+{data.connected.length - 6}</button>}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
        {data.github && <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }} onClick={() => onOpen('github')}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Open PRs</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#238636' }}>{(data.github.prs || []).length}</div>
          <div style={{ fontSize: 11, color: '#555' }}>🐙 GitHub</div>
        </div>}
        {data.linear && <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }} onClick={() => onOpen('linear')}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Open Issues</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#5e6ad2' }}>{(data.linear.issues || []).length}</div>
          <div style={{ fontSize: 11, color: '#555' }}>📐 Linear</div>
        </div>}
        {data.pagerduty && <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }} onClick={() => onOpen('pagerduty')}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Active Incidents</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: (data.pagerduty.incidents || []).length > 0 ? '#e55' : '#18d26e' }}>{(data.pagerduty.incidents || []).length}</div>
          <div style={{ fontSize: 11, color: '#555' }}>🚨 PagerDuty</div>
        </div>}
        {data.sentry && <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }} onClick={() => onOpen('sentry')}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Sentry Issues</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f77' }}>{(data.sentry.issues || []).length}</div>
          <div style={{ fontSize: 11, color: '#555' }}>🛡️ Sentry</div>
        </div>}
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {data.github && (data.github.prs || []).length > 0 && (
          <Card title="🔀 Open Pull Requests" accent="#238636" onClick={() => onOpen('github')}>
            {(data.github.prs || []).slice(0, 4).map((p: any) => (
              <div key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid #1a1a1a', fontSize: 12, color: '#ddd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#18d26e', fontSize: 10 }}>●</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                </div>
                <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>#{p.number} · {p.repository_url?.split('/').slice(-2).join('/')}</div>
              </div>
            ))}
            {(data.github.prs || []).length > 4 && <div style={{ color: '#555', fontSize: 11, marginTop: 6 }}>+{(data.github.prs || []).length - 4} more</div>}
          </Card>
        )}

        {data.linear && (data.linear.issues || []).length > 0 && (
          <Card title="📐 Linear Issues" accent="#5e6ad2" onClick={() => onOpen('linear')}>
            {(data.linear.issues || []).slice(0, 4).map((i: any) => (
              <div key={i.id} style={{ padding: '6px 0', borderBottom: '1px solid #1a1a1a', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: '#1a1a2e', color: '#5e6ad2', padding: '1px 6px', borderRadius: 4, fontSize: 10, flexShrink: 0 }}>{i.state?.name}</span>
                  <span style={{ color: '#ddd', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</span>
                </div>
                <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>{i.team?.name} · {i.assignee?.name || 'Unassigned'}</div>
              </div>
            ))}
          </Card>
        )}

        {data.pagerduty && (data.pagerduty.incidents || []).filter((i: any) => i.status !== 'resolved').length > 0 && (
          <Card title="🚨 Active Incidents" accent="#e55" onClick={() => onOpen('pagerduty')}>
            {(data.pagerduty.incidents || []).filter((i: any) => i.status !== 'resolved').slice(0, 3).map((i: any) => (
              <div key={i.id} style={{ padding: '6px 0', borderBottom: '1px solid #1a1a1a', fontSize: 12 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: i.urgency === 'high' ? '#e55' : '#fa0', fontSize: 10 }}>▲</span>
                  <span style={{ color: '#ddd', flex: 1 }}>{i.title}</span>
                </div>
                <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>{i.service?.summary}</div>
              </div>
            ))}
          </Card>
        )}

        {/* Empty connection prompt */}
        <Card title="➕ Add Integration" accent="#333">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {INTEGRATION_CATALOG.filter(i => !data.connected.find(c => c.id === i.id)).slice(0, 6).map(i => (
              <button key={i.id} onClick={() => onOpen(i.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, cursor: 'pointer', color: '#888', fontSize: 11 }}>
                <span>{i.icon}</span><span>{i.label}</span>
              </button>
            ))}
            <button onClick={() => onOpen('integrations')} style={{ padding: '5px 10px', background: 'transparent', border: '1px dashed #333', borderRadius: 8, cursor: 'pointer', color: '#555', fontSize: 11 }}>See all →</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ForgeTab_notion_v1() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [status, setStatus] = React.useState<any>(null);
  const [token, setToken] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [pages, setPages] = React.useState<any[]>([]);
  const [dbs, setDbs] = React.useState<any[]>([]);
  const [selPage, setSelPage] = React.useState<any>(null);
  const [pageContent, setPageContent] = React.useState('');
  const [newTitle, setNewTitle] = React.useState('');
  const [newBody, setNewBody] = React.useState('');
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [aiResult, setAiResult] = React.useState('');
  const [searchQ, setSearchQ] = React.useState('');
  const [searchRes, setSearchRes] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState<'pages'|'create'|'search'|'db'>('pages');

  React.useEffect(() => {
    fetch(`${API}/api/integrations/notion/status`, {headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.json()).then(d=>{ setStatus(d); if(d.connected) loadPages(); });
  }, []);

  async function loadPages() {
    const r = await fetch(`${API}/api/integrations/notion/pages`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    if(d.pages) setPages(d.pages);
    if(d.dbs) setDbs(d.dbs);
  }

  async function connect() {
    if(!token.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/notion/connect`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({token})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setStatus({connected:true,...d}); loadPages(); }
    else alert(d.error||'Connection failed');
  }

  async function loadPage(pageId: string) {
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/notion/page/${pageId}`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    setPageContent(d.content||'');
    setLoading(false);
  }

  async function createPage() {
    if(!newTitle.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/notion/page`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({title:newTitle,content:newBody})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setNewTitle(''); setNewBody(''); loadPages(); setTab('pages'); alert('Page created!'); }
    else alert(d.error||'Failed');
  }

  async function aiEnhance() {
    if(!aiPrompt.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/chat`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({message:`Write Notion page content for: ${aiPrompt}\n\nFormat with clear sections, bullet points where appropriate. Be thorough and professional.`, model:'claude-3-5-haiku-20241022'})});
    const d = await r.json();
    setAiResult(d.response||d.content||'');
    setNewBody(d.response||d.content||'');
    setLoading(false);
  }

  async function doSearch() {
    if(!searchQ.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/notion/search?q=${encodeURIComponent(searchQ)}`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    setSearchRes(d.results||[]);
    setLoading(false);
  }

  const s: Record<string,React.CSSProperties> = {
    wrap:{padding:24,maxWidth:1000,margin:'0 auto'},
    card:{background:'#1e1e2e',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #2d2d3d'},
    input:{background:'#0d0d14',border:'1px solid #3d3d5c',borderRadius:8,padding:'10px 14px',color:'#e2e8f0',width:'100%',fontSize:14,boxSizing:'border-box' as const},
    btn:{padding:'10px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:14},
    tabs:{display:'flex',gap:8,marginBottom:20},
    tab:{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600},
    pageItem:{background:'#12121e',borderRadius:8,padding:'10px 14px',marginBottom:8,cursor:'pointer',border:'1px solid #2d2d3d',display:'flex',justifyContent:'space-between',alignItems:'center'},
  };

  if(!status) return <div style={{padding:40,color:'#94a3b8',textAlign:'center'}}>Loading Notion status…</div>;

  if(!status.connected) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={{color:'#f1f5f9',marginBottom:8}}>🗒️ Connect Notion</h2>
        <p style={{color:'#94a3b8',fontSize:14,marginBottom:16}}>Connect your Notion workspace to create pages, browse databases, and write AI-generated content directly.</p>
        <ol style={{color:'#94a3b8',fontSize:13,marginBottom:20,lineHeight:'1.8'}}>
          <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" style={{color:'#818cf8'}}>notion.so/my-integrations</a></li>
          <li>Click "New integration" → give it a name → copy the Internal Integration Token</li>
          <li>In your Notion pages, click ··· → Add connections → select your integration</li>
        </ol>
        <div style={{display:'flex',gap:10}}>
          <input style={s.input} placeholder="secret_xxx integration token" value={token} onChange={e=>setToken(e.target.value)} />
          <button style={{...s.btn,background:'#6366f1',color:'#fff',whiteSpace:'nowrap'}} onClick={connect} disabled={loading}>{loading?'Connecting…':'Connect Notion'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><span style={{color:'#a78bfa',fontWeight:700,fontSize:18}}>🗒️ Notion</span><span style={{color:'#22c55e',fontSize:12,marginLeft:10}}>● Connected as {status.workspace_name||'workspace'}</span></div>
        <button style={{...s.btn,background:'#374151',color:'#9ca3af',fontSize:12}} onClick={()=>{fetch(`${API}/api/integrations/notion/disconnect`,{method:'DELETE',headers:{Authorization:`Bearer ${tok}`}});setStatus({connected:false});}}>Disconnect</button>
      </div>

      <div style={s.tabs}>
        {(['pages','create','search','db'] as const).map(t=>(
          <button key={t} style={{...s.tab,background:tab===t?'#6366f1':'#1e1e2e',color:tab===t?'#fff':'#94a3b8',border:'1px solid '+(tab===t?'#6366f1':'#2d2d3d')}} onClick={()=>setTab(t)}>{t==='pages'?'📄 Pages':t==='create'?'✏️ Create':t==='search'?'🔍 Search':'🗄️ Databases'}</button>
        ))}
      </div>

      {tab==='pages' && (
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{color:'#f1f5f9',margin:0}}>Recent Pages</h3>
            <button style={{...s.btn,background:'#1e1e2e',color:'#6366f1',border:'1px solid #6366f1',fontSize:12}} onClick={loadPages}>↻ Refresh</button>
          </div>
          {pages.length===0 && <p style={{color:'#64748b',fontSize:13}}>No pages found. Share pages with your integration in Notion first.</p>}
          {pages.map(p=>(
            <div key={p.id} style={s.pageItem} onClick={()=>{setSelPage(p);loadPage(p.id);}}>
              <span style={{color:'#e2e8f0',fontSize:14}}>{p.icon||'📄'} {p.title||'Untitled'}</span>
              <span style={{color:'#64748b',fontSize:12}}>{p.last_edited?.slice(0,10)}</span>
            </div>
          ))}
          {selPage && (
            <div style={{marginTop:16,background:'#0d0d14',borderRadius:10,padding:16}}>
              <h4 style={{color:'#a78bfa',marginBottom:8}}>{selPage.icon||'📄'} {selPage.title}</h4>
              {loading ? <p style={{color:'#64748b'}}>Loading…</p> : <pre style={{color:'#cbd5e1',fontSize:13,whiteSpace:'pre-wrap',lineHeight:'1.6',maxHeight:400,overflow:'auto'}}>{pageContent||'(empty page)'}</pre>}
              <a href={selPage.url} target="_blank" style={{color:'#6366f1',fontSize:12}}>Open in Notion ↗</a>
            </div>
          )}
        </div>
      )}

      {tab==='create' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:16}}>Create New Page</h3>
          <div style={{marginBottom:12}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Page Title</label>
            <input style={{...s.input,marginTop:6}} placeholder="My new page" value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
          </div>
          <div style={{marginBottom:12}}>
            <label style={{color:'#94a3b8',fontSize:13}}>AI Generate Content</label>
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <input style={s.input} placeholder="Describe what this page should contain…" value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} />
              <button style={{...s.btn,background:'#8b5cf6',color:'#fff',whiteSpace:'nowrap'}} onClick={aiEnhance} disabled={loading}>{loading?'…':'✨ AI Write'}</button>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Content</label>
            <textarea style={{...s.input,marginTop:6,minHeight:200,resize:'vertical'} as React.CSSProperties} placeholder="Or write content manually…" value={newBody} onChange={e=>setNewBody(e.target.value)} />
          </div>
          <button style={{...s.btn,background:'#22c55e',color:'#fff',width:'100%'}} onClick={createPage} disabled={loading||!newTitle.trim()}>{loading?'Creating…':'Create Page'}</button>
        </div>
      )}

      {tab==='search' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:16}}>Search Workspace</h3>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <input style={s.input} placeholder="Search pages and databases…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()} />
            <button style={{...s.btn,background:'#6366f1',color:'#fff'}} onClick={doSearch} disabled={loading}>{loading?'…':'Search'}</button>
          </div>
          {searchRes.map(r=>(
            <div key={r.id} style={s.pageItem} onClick={()=>window.open(r.url,'_blank')}>
              <span style={{color:'#e2e8f0',fontSize:14}}>{r.icon||'📄'} {r.title||'Untitled'}</span>
              <span style={{color:'#64748b',fontSize:12}}>{r.type}</span>
            </div>
          ))}
          {searchRes.length===0 && searchQ && !loading && <p style={{color:'#64748b',fontSize:13}}>No results. Try a different query.</p>}
        </div>
      )}

      {tab==='db' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:16}}>Databases</h3>
          {dbs.length===0 && <p style={{color:'#64748b',fontSize:13}}>No databases found. Share databases with your integration in Notion.</p>}
          {dbs.map(db=>(
            <div key={db.id} style={{...s.pageItem}} onClick={()=>window.open(db.url,'_blank')}>
              <span style={{color:'#e2e8f0',fontSize:14}}>🗄️ {db.title||'Untitled DB'}</span>
              <span style={{color:'#6366f1',fontSize:12}}>Open ↗</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_linear_v1() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [status, setStatus] = React.useState<any>(null);
  const [apiKey, setApiKey] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [teams, setTeams] = React.useState<any[]>([]);
  const [issues, setIssues] = React.useState<any[]>([]);
  const [selTeam, setSelTeam] = React.useState('');
  const [newTitle, setNewTitle] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');
  const [newPri, setNewPri] = React.useState('2');
  const [aiGoal, setAiGoal] = React.useState('');
  const [tab, setTab] = React.useState<'issues'|'create'|'ai'>('issues');

  React.useEffect(() => {
    fetch(`${API}/api/integrations/linear/status`, {headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.json()).then(d=>{ setStatus(d); if(d.connected) loadData(); });
  }, []);

  async function loadData() {
    const r = await fetch(`${API}/api/integrations/linear/teams`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    if(d.teams?.length) { setTeams(d.teams); setSelTeam(d.teams[0].id); loadIssues(d.teams[0].id); }
  }

  async function loadIssues(teamId: string) {
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/linear/issues?teamId=${teamId}`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    setIssues(d.issues||[]);
    setLoading(false);
  }

  async function connect() {
    if(!apiKey.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/linear/connect`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({apiKey})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setStatus({connected:true,...d}); loadData(); }
    else alert(d.error||'Connection failed');
  }

  async function createIssue() {
    if(!newTitle.trim()||!selTeam) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/linear/issue`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({teamId:selTeam,title:newTitle,description:newDesc,priority:Number(newPri)})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setNewTitle(''); setNewDesc(''); loadIssues(selTeam); setTab('issues'); alert(`Issue created: ${d.identifier}`); }
    else alert(d.error||'Failed');
  }

  async function aiBreakdown() {
    if(!aiGoal.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/chat`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({message:`Break this goal into actionable Linear issues:\n\n"${aiGoal}"\n\nProvide 5-8 specific, well-scoped tickets. For each:\n- TITLE (concise, action-oriented)\n- DESCRIPTION (what, why, acceptance criteria)\n- PRIORITY (1=Urgent, 2=High, 3=Medium, 4=Low)\n\nFormat as a numbered list.`, model:'claude-3-5-haiku-20241022'})});
    const d = await r.json();
    setNewDesc(d.response||d.content||'');
    setNewTitle(aiGoal.slice(0,80));
    setLoading(false);
    setTab('create');
  }

  const priColor: Record<string,string> = {'0':'#6b7280','1':'#ef4444','2':'#f97316','3':'#eab308','4':'#94a3b8'};
  const priLabel: Record<string,string> = {'0':'No priority','1':'🔴 Urgent','2':'🟠 High','3':'🟡 Medium','4':'⚪ Low'};

  const s: Record<string,React.CSSProperties> = {
    wrap:{padding:24,maxWidth:1000,margin:'0 auto'},
    card:{background:'#1e1e2e',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #2d2d3d'},
    input:{background:'#0d0d14',border:'1px solid #3d3d5c',borderRadius:8,padding:'10px 14px',color:'#e2e8f0',width:'100%',fontSize:14,boxSizing:'border-box' as const},
    btn:{padding:'10px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:14},
    tabs:{display:'flex',gap:8,marginBottom:20},
    tab:{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600},
    issueRow:{background:'#12121e',borderRadius:8,padding:'10px 14px',marginBottom:8,border:'1px solid #2d2d3d',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  };

  if(!status) return <div style={{padding:40,color:'#94a3b8',textAlign:'center'}}>Loading Linear status…</div>;

  if(!status.connected) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={{color:'#f1f5f9',marginBottom:8}}>📐 Connect Linear</h2>
        <p style={{color:'#94a3b8',fontSize:14,marginBottom:16}}>Connect your Linear workspace to browse issues, create tickets, and use AI to break goals into tasks.</p>
        <ol style={{color:'#94a3b8',fontSize:13,marginBottom:20,lineHeight:'1.8'}}>
          <li>Go to <a href="https://linear.app/settings/api" target="_blank" style={{color:'#818cf8'}}>linear.app/settings/api</a></li>
          <li>Under "Personal API Keys", click "Create key"</li>
          <li>Copy the key and paste it below</li>
        </ol>
        <div style={{display:'flex',gap:10}}>
          <input style={s.input} placeholder="lin_api_xxx" type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} />
          <button style={{...s.btn,background:'#6366f1',color:'#fff',whiteSpace:'nowrap'}} onClick={connect} disabled={loading}>{loading?'Connecting…':'Connect Linear'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><span style={{color:'#a78bfa',fontWeight:700,fontSize:18}}>📐 Linear</span><span style={{color:'#22c55e',fontSize:12,marginLeft:10}}>● Connected as {status.org_name||'workspace'}</span></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <select style={{...s.input,width:'auto',padding:'6px 10px'}} value={selTeam} onChange={e=>{setSelTeam(e.target.value);loadIssues(e.target.value);}}>
            {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button style={{...s.btn,background:'#374151',color:'#9ca3af',fontSize:12}} onClick={()=>{fetch(`${API}/api/integrations/linear/disconnect`,{method:'DELETE',headers:{Authorization:`Bearer ${tok}`}});setStatus({connected:false});}}>Disconnect</button>
        </div>
      </div>

      <div style={s.tabs}>
        {(['issues','create','ai'] as const).map(t=>(
          <button key={t} style={{...s.tab,background:tab===t?'#6366f1':'#1e1e2e',color:tab===t?'#fff':'#94a3b8',border:'1px solid '+(tab===t?'#6366f1':'#2d2d3d')}} onClick={()=>setTab(t)}>{t==='issues'?'🎯 Issues':t==='create'?'✏️ Create':'🤖 AI Breakdown'}</button>
        ))}
      </div>

      {tab==='issues' && (
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{color:'#f1f5f9',margin:0}}>Recent Issues</h3>
            <button style={{...s.btn,background:'#1e1e2e',color:'#6366f1',border:'1px solid #6366f1',fontSize:12}} onClick={()=>loadIssues(selTeam)}>↻ Refresh</button>
          </div>
          {loading && <p style={{color:'#64748b'}}>Loading…</p>}
          {issues.map(iss=>(
            <div key={iss.id} style={s.issueRow}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span style={{color:'#6366f1',fontSize:12,fontWeight:700}}>{iss.identifier}</span>
                  <span style={{background:iss.state_color||'#374151',color:'#fff',borderRadius:4,padding:'1px 6px',fontSize:11}}>{iss.state_name||'—'}</span>
                  <span style={{color:priColor[String(iss.priority)]||'#6b7280',fontSize:11}}>{priLabel[String(iss.priority)]||''}</span>
                </div>
                <div style={{color:'#e2e8f0',fontSize:14}}>{iss.title}</div>
                {iss.assignee && <div style={{color:'#64748b',fontSize:12,marginTop:4}}>👤 {iss.assignee}</div>}
              </div>
              <a href={iss.url} target="_blank" style={{color:'#6366f1',fontSize:12,whiteSpace:'nowrap'}}>Open ↗</a>
            </div>
          ))}
          {issues.length===0 && !loading && <p style={{color:'#64748b',fontSize:13}}>No issues found for this team.</p>}
        </div>
      )}

      {tab==='create' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:16}}>Create Issue</h3>
          <div style={{marginBottom:12}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Title *</label>
            <input style={{...s.input,marginTop:6}} placeholder="Issue title" value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
          </div>
          <div style={{marginBottom:12}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Description</label>
            <textarea style={{...s.input,marginTop:6,minHeight:120,resize:'vertical'} as React.CSSProperties} placeholder="Description / acceptance criteria…" value={newDesc} onChange={e=>setNewDesc(e.target.value)} />
          </div>
          <div style={{marginBottom:16}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Priority</label>
            <select style={{...s.input,marginTop:6,width:'auto'}} value={newPri} onChange={e=>setNewPri(e.target.value)}>
              <option value="1">🔴 Urgent</option>
              <option value="2">🟠 High</option>
              <option value="3">🟡 Medium</option>
              <option value="4">⚪ Low</option>
            </select>
          </div>
          <button style={{...s.btn,background:'#22c55e',color:'#fff',width:'100%'}} onClick={createIssue} disabled={loading||!newTitle.trim()}>{loading?'Creating…':'Create Issue'}</button>
        </div>
      )}

      {tab==='ai' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:8}}>🤖 AI Issue Breakdown</h3>
          <p style={{color:'#94a3b8',fontSize:13,marginBottom:16}}>Describe a goal or feature and AI will break it into Linear-ready tickets.</p>
          <textarea style={{...s.input,minHeight:100,resize:'vertical',marginBottom:12} as React.CSSProperties} placeholder="e.g. Build user authentication with email/password, Google OAuth, and 2FA" value={aiGoal} onChange={e=>setAiGoal(e.target.value)} />
          <button style={{...s.btn,background:'#8b5cf6',color:'#fff',width:'100%'}} onClick={aiBreakdown} disabled={loading||!aiGoal.trim()}>{loading?'Analyzing…':'✨ Break into Issues'}</button>
          <p style={{color:'#64748b',fontSize:12,marginTop:8}}>Results will pre-fill the Create tab so you can review before creating.</p>
        </div>
      )}
    </div>
  );
}

export function ForgeTab_slack_v1() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [status, setStatus] = React.useState<any>(null);
  const [botToken, setBotToken] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [channels, setChannels] = React.useState<any[]>([]);
  const [selChan, setSelChan] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([]);
  const [msgText, setMsgText] = React.useState('');
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [searchQ, setSearchQ] = React.useState('');
  const [searchRes, setSearchRes] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState<'channels'|'compose'|'search'>('channels');

  React.useEffect(() => {
    fetch(`${API}/api/integrations/slack/status`, {headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.json()).then(d=>{ setStatus(d); if(d.connected) loadChannels(); });
  }, []);

  async function loadChannels() {
    const r = await fetch(`${API}/api/integrations/slack/channels`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    if(d.channels?.length) { setChannels(d.channels); setSelChan(d.channels[0].id); loadMessages(d.channels[0].id); }
  }

  async function loadMessages(channelId: string) {
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/slack/messages?channelId=${channelId}`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    setMessages(d.messages||[]);
    setLoading(false);
  }

  async function connect() {
    if(!botToken.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/slack/connect`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({botToken})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setStatus({connected:true,...d}); loadChannels(); }
    else alert(d.error||'Connection failed');
  }

  async function sendMessage() {
    if(!msgText.trim()||!selChan) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/slack/send`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({channelId:selChan,text:msgText})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setMsgText(''); loadMessages(selChan); }
    else alert(d.error||'Failed to send');
  }

  async function aiWrite() {
    if(!aiPrompt.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/chat`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({message:`Write a clear, professional Slack message for: ${aiPrompt}\n\nBe concise. Use emoji sparingly. Format for Slack (bold with *text*, code with \`text\`). Output only the message text, no preamble.`, model:'claude-3-5-haiku-20241022'})});
    const d = await r.json();
    setMsgText(d.response||d.content||'');
    setLoading(false);
    setTab('compose');
  }

  async function doSearch() {
    if(!searchQ.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/slack/search?q=${encodeURIComponent(searchQ)}`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    setSearchRes(d.messages||[]);
    setLoading(false);
  }

  const s: Record<string,React.CSSProperties> = {
    wrap:{padding:24,maxWidth:1000,margin:'0 auto'},
    card:{background:'#1e1e2e',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #2d2d3d'},
    input:{background:'#0d0d14',border:'1px solid #3d3d5c',borderRadius:8,padding:'10px 14px',color:'#e2e8f0',width:'100%',fontSize:14,boxSizing:'border-box' as const},
    btn:{padding:'10px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:14},
    tabs:{display:'flex',gap:8,marginBottom:20},
    tab:{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600},
    msgRow:{background:'#12121e',borderRadius:8,padding:'10px 14px',marginBottom:6,border:'1px solid #2d2d3d'},
  };

  if(!status) return <div style={{padding:40,color:'#94a3b8',textAlign:'center'}}>Loading Slack status…</div>;

  if(!status.connected) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={{color:'#f1f5f9',marginBottom:8}}>💬 Connect Slack</h2>
        <p style={{color:'#94a3b8',fontSize:14,marginBottom:16}}>Connect your Slack workspace to browse channels, send messages, and search conversations.</p>
        <ol style={{color:'#94a3b8',fontSize:13,marginBottom:20,lineHeight:'1.8'}}>
          <li>Go to <a href="https://api.slack.com/apps" target="_blank" style={{color:'#818cf8'}}>api.slack.com/apps</a> → Create New App → From scratch</li>
          <li>OAuth &amp; Permissions → Bot Token Scopes: add <code style={{background:'#2d2d3d',padding:'1px 4px',borderRadius:3}}>channels:read</code>, <code style={{background:'#2d2d3d',padding:'1px 4px',borderRadius:3}}>channels:history</code>, <code style={{background:'#2d2d3d',padding:'1px 4px',borderRadius:3}}>chat:write</code>, <code style={{background:'#2d2d3d',padding:'1px 4px',borderRadius:3}}>search:read</code></li>
          <li>Install App → copy Bot User OAuth Token (<code style={{background:'#2d2d3d',padding:'1px 4px',borderRadius:3}}>xoxb-...</code>)</li>
        </ol>
        <div style={{display:'flex',gap:10}}>
          <input style={s.input} placeholder="xoxb-xxx Bot Token" type="password" value={botToken} onChange={e=>setBotToken(e.target.value)} />
          <button style={{...s.btn,background:'#6366f1',color:'#fff',whiteSpace:'nowrap'}} onClick={connect} disabled={loading}>{loading?'Connecting…':'Connect Slack'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><span style={{color:'#a78bfa',fontWeight:700,fontSize:18}}>💬 Slack</span><span style={{color:'#22c55e',fontSize:12,marginLeft:10}}>● Connected to {status.workspace_name||'workspace'}</span></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <select style={{...s.input,width:'auto',padding:'6px 10px'}} value={selChan} onChange={e=>{setSelChan(e.target.value);loadMessages(e.target.value);}}>
            {channels.map(c=><option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
          <button style={{...s.btn,background:'#374151',color:'#9ca3af',fontSize:12}} onClick={()=>{fetch(`${API}/api/integrations/slack/disconnect`,{method:'DELETE',headers:{Authorization:`Bearer ${tok}`}});setStatus({connected:false});}}>Disconnect</button>
        </div>
      </div>

      <div style={s.tabs}>
        {(['channels','compose','search'] as const).map(t=>(
          <button key={t} style={{...s.tab,background:tab===t?'#6366f1':'#1e1e2e',color:tab===t?'#fff':'#94a3b8',border:'1px solid '+(tab===t?'#6366f1':'#2d2d3d')}} onClick={()=>setTab(t)}>{t==='channels'?'📨 Messages':t==='compose'?'✏️ Compose':'🔍 Search'}</button>
        ))}
      </div>

      {tab==='channels' && (
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{color:'#f1f5f9',margin:0}}>Recent Messages</h3>
            <button style={{...s.btn,background:'#1e1e2e',color:'#6366f1',border:'1px solid #6366f1',fontSize:12}} onClick={()=>loadMessages(selChan)}>↻ Refresh</button>
          </div>
          {loading && <p style={{color:'#64748b'}}>Loading…</p>}
          {messages.map((m,i)=>(
            <div key={i} style={s.msgRow}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                <span style={{color:'#6366f1',fontSize:12,fontWeight:700}}>{m.user||'Bot'}</span>
                <span style={{color:'#475569',fontSize:11}}>{m.time}</span>
              </div>
              <div style={{color:'#cbd5e1',fontSize:14,whiteSpace:'pre-wrap'}}>{m.text}</div>
            </div>
          ))}
          {messages.length===0 && !loading && <p style={{color:'#64748b',fontSize:13}}>No messages. Invite the bot to the channel first.</p>}
        </div>
      )}

      {tab==='compose' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:12}}>Compose Message</h3>
          <div style={{marginBottom:12}}>
            <label style={{color:'#94a3b8',fontSize:13}}>AI Write</label>
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <input style={s.input} placeholder="What should the message say?" value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&aiWrite()} />
              <button style={{...s.btn,background:'#8b5cf6',color:'#fff',whiteSpace:'nowrap'}} onClick={aiWrite} disabled={loading}>{loading?'…':'✨ AI Write'}</button>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Message</label>
            <textarea style={{...s.input,marginTop:6,minHeight:120,resize:'vertical'} as React.CSSProperties} placeholder="Type your message…" value={msgText} onChange={e=>setMsgText(e.target.value)} />
          </div>
          <button style={{...s.btn,background:'#22c55e',color:'#fff',width:'100%'}} onClick={sendMessage} disabled={loading||!msgText.trim()||!selChan}>{loading?'Sending…':'Send to #'+((channels.find(c=>c.id===selChan)?.name)||'channel')}</button>
        </div>
      )}

      {tab==='search' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:12}}>Search Messages</h3>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <input style={s.input} placeholder="Search across all channels…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()} />
            <button style={{...s.btn,background:'#6366f1',color:'#fff'}} onClick={doSearch} disabled={loading}>{loading?'…':'Search'}</button>
          </div>
          {searchRes.map((m,i)=>(
            <div key={i} style={s.msgRow}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                <span style={{color:'#6366f1',fontSize:12}}>#{m.channel}</span>
                <span style={{color:'#475569',fontSize:11}}>{m.time}</span>
                <span style={{color:'#94a3b8',fontSize:12}}>{m.user}</span>
              </div>
              <div style={{color:'#cbd5e1',fontSize:14}}>{m.text}</div>
            </div>
          ))}
          {searchRes.length===0 && searchQ && !loading && <p style={{color:'#64748b',fontSize:13}}>No results.</p>}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_figma_v1() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [projects, setProjects] = React.useState<any[]>([]);
  const [files, setFiles] = React.useState<any[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/figma/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); fetch(`${BACKEND}/api/integrations/figma/projects`, { headers: h }).then(r => r.json()).then(d => setProjects(d.projects || [])); }
    });
  }, []);

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/figma/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); fetch(`${BACKEND}/api/integrations/figma/projects`, { headers: h }).then(r => r.json()).then(d => setProjects(d.projects || [])); } else setConnStatus(d.error || 'Failed');
  };

  const selectProject = async (p: any) => {
    setSelectedProject(p);
    const d = await fetch(`/api/integrations/figma/files?projectId=${p.id}`, { headers: h }).then(r => r.json());
    setFiles(d.files || []);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🎨 Figma</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Figma to browse your design projects and files.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#a259ff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Figma'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎨 Figma</h2>
        <span style={{ background: '#a259ff22', color: '#a259ff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/figma/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16, height: 450 }}>
        <div style={{ width: 220, overflowY: 'auto', borderRight: '1px solid #222', paddingRight: 12 }}>
          <div style={{ fontWeight: 600, color: '#aaa', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Projects</div>
          {projects.map(p => <div key={p.id} onClick={() => selectProject(p)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedProject?.id === p.id ? '#1a0030' : 'transparent', color: selectedProject?.id === p.id ? '#a259ff' : '#ddd', fontSize: 13, marginBottom: 2 }}>📁 {p.name}</div>)}
          {projects.length === 0 && <p style={{ color: '#555', fontSize: 12 }}>No team projects found (personal token may not expose team projects)</p>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selectedProject && <p style={{ color: '#555', fontSize: 13 }}>Select a project to view files</p>}
          {selectedProject && <>
            <div style={{ fontWeight: 600, color: '#aaa', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>{selectedProject.name}</div>
            {files.map(f => <div key={f.key} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>🎨 {f.name}</span>
              <span style={{ color: '#555', fontSize: 11 }}>{f.last_modified ? new Date(f.last_modified).toLocaleDateString() : ''}</span>
            </div>)}
          </>}
        </div>
      </div>
    </div>
  );
}

export function ForgeTab_loom() {
  const [connected, setConnected] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [folders, setFolders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/loom/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); fetch(`${BACKEND}/api/integrations/loom/videos`, { headers: h }).then(r => r.json()).then(d => setFolders(d.data || d.folders || [])); }
    });
  }, []);

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/loom/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); fetch(`${BACKEND}/api/integrations/loom/videos`, { headers: h }).then(r => r.json()).then(d => setFolders(d.data || d.folders || [])); } else setConnStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🎬 Loom</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Loom to browse your video library.</p>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#625df5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Loom'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎬 Loom</h2>
        <span style={{ background: '#625df522', color: '#625df5', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/loom/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ fontWeight: 600, color: '#aaa', fontSize: 11, textTransform: 'uppercase', marginBottom: 10 }}>Folders</div>
      {folders.map((f: any) => <div key={f.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>📁 {f.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{f.videos_count || 0} videos</span>
      </div>)}
      {folders.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>No folders found.</p>}
    </div>
  );
}

export function ForgeTab_calendly() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'events'|'types'>('events');
  const [events, setEvents] = React.useState<any[]>([]);
  const [eventTypes, setEventTypes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/calendly/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [e, t] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/calendly/events`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/calendly/event-types`, { headers: h }).then(r => r.json()),
    ]);
    setEvents(e.collection || []); setEventTypes(t.collection || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/calendly/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const statusColor = (s: string) => ({ active: '#18d26e', canceled: '#f55' }[s] || '#aaa');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📅 Calendly</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Calendly to view scheduled meetings and event types.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#0069ff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Calendly'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📅 Calendly</h2>
        <span style={{ background: '#0069ff22', color: '#0069ff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/calendly/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['events','types'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#0069ff' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'events' ? '📆 Scheduled' : '📋 Event Types'}</button>)}
      </div>
      {tab === 'events' && events.map(e => <div key={e.uri} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: statusColor(e.status), fontSize: 11 }}>●</span>
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{e.name}</span>
          <span style={{ color: '#555', fontSize: 11 }}>{e.start_time ? new Date(e.start_time).toLocaleString() : ''}</span>
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{e.invitees_counter?.total} invitee(s)</div>
      </div>)}
      {tab === 'types' && eventTypes.map(t => <div key={t.uri} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{t.name}</span>
        <span style={{ color: '#0069ff', fontSize: 11 }}>{t.duration} min</span>
        <span style={{ color: t.active ? '#18d26e' : '#888', fontSize: 11 }}>● {t.active ? 'active' : 'inactive'}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_zoom() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ accountId: '', clientId: '', clientSecret: '' });
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'meetings'|'recordings'>('meetings');
  const [meetings, setMeetings] = React.useState<any[]>([]);
  const [recordings, setRecordings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/zoom/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [m, r] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/zoom/meetings`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/zoom/recordings`, { headers: h }).then(r => r.json()),
    ]);
    setMeetings(m.meetings || []); setRecordings(r.meetings || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/zoom/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📹 Zoom</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Zoom (Server-to-Server OAuth) to view meetings and recordings.</p>
      <input value={form.accountId} onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))} placeholder="Account ID" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} placeholder="Client ID" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.clientSecret} onChange={e => setForm(p => ({ ...p, clientSecret: e.target.value }))} placeholder="Client Secret" type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#2d8cff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Zoom'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📹 Zoom</h2>
        <span style={{ background: '#2d8cff22', color: '#2d8cff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/zoom/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['meetings','recordings'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#2d8cff' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'meetings' ? '📹 Meetings' : '🎬 Recordings'}</button>)}
      </div>
      {tab === 'meetings' && meetings.map(m => <div key={m.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>📹 {m.topic}</span>
          <span style={{ color: '#2d8cff', fontSize: 11 }}>{m.duration} min</span>
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{m.start_time ? new Date(m.start_time).toLocaleString() : ''}</div>
      </div>)}
      {tab === 'recordings' && recordings.map(m => <div key={m.uuid} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>🎬 {m.topic}</span>
          <span style={{ color: '#2d8cff', fontSize: 11 }}>{m.duration} min</span>
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{m.start_time ? new Date(m.start_time).toLocaleDateString() : ''} · {m.recording_count} recordings</div>
      </div>)}
    </div>
  );
}

export function ForgeTab_stripe_mgmt() {
  const [connected, setConnected] = React.useState(false);
  const [secretKey, setSecretKey] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'payments'|'customers'|'subscriptions'>('payments');
  const [payments, setPayments] = React.useState<any[]>([]);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [subs, setSubs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/stripe/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [p, c, s] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/stripe/payments`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/stripe/customers`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/stripe/subscriptions`, { headers: h }).then(r => r.json()),
    ]);
    setPayments(p.data || []); setCustomers(c.data || []); setSubs(s.data || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/stripe/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ secretKey }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const statusColor = (s: string) => ({ succeeded: '#18d26e', pending: '#ff9500', failed: '#f55', canceled: '#888' }[s] || '#888');
  const subColor = (s: string) => ({ active: '#18d26e', trialing: '#4285f4', past_due: '#ff9500', canceled: '#888' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>💳 Stripe</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Stripe to view payments, customers, and subscriptions.</p>
      <input value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="Secret Key (sk_live_... or sk_test_...)" type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#635bff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Stripe'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>💳 Stripe</h2>
        <span style={{ background: '#635bff22', color: '#635bff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/stripe/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['payments','customers','subscriptions'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#635bff' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'payments' ? '💰 Payments' : t === 'customers' ? '👤 Customers' : '🔄 Subscriptions'}</button>)}
      </div>
      {tab === 'payments' && payments.map(p => <div key={p.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: statusColor(p.status), fontSize: 11 }}>●</span>
        <span style={{ fontWeight: 700, color: '#ddd' }}>${((p.amount||0)/100).toFixed(2)} {p.currency?.toUpperCase()}</span>
        <span style={{ color: '#aaa', fontSize: 11, flex: 1 }}>{p.description || p.id}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{p.created ? new Date(p.created*1000).toLocaleDateString() : ''}</span>
      </div>)}
      {tab === 'customers' && customers.map(c => <div key={c.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{c.name || c.email || c.id}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{c.email}</span>
        <span style={{ color: '#635bff', fontSize: 11 }}>${((c.balance||0)/100).toFixed(2)}</span>
      </div>)}
      {tab === 'subscriptions' && subs.map(s => <div key={s.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: subColor(s.status), fontSize: 11 }}>●</span>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{s.id}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{s.status}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{s.current_period_end ? new Date(s.current_period_end*1000).toLocaleDateString() : ''}</span>
      </div>)}
    </div>
  );
}
