// Forge AI Workspace v4.0 — World-class AI workspace UI
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface User { id: string; email: string; name?: string; token: string; }
interface Project { id: string; name: string; color: string; system_prompt?: string; pinned?: number; created_at: string; }
interface Thread { id: string; project_id?: string; title: string; created_at: string; }
interface Message { id: string; thread_id: string; role: 'user' | 'assistant'; content: string; model?: string; created_at: string; }
interface Artifact { id: string; thread_id?: string; title: string; type: string; content: string; version: number; created_at: string; }
interface WorkspaceAgent { id: string; name: string; icon: string; color: string; system_prompt: string; model: string; enabled: number; built_in?: number; }
interface WorkspaceTask { id: string; title: string; description?: string; status: 'todo' | 'in_progress' | 'done' | 'blocked'; priority: 'low' | 'medium' | 'high'; project_id?: string; created_at: string; }
interface DispatchRun { id: string; prompt: string; status: string; result?: string; created_at: string; }
interface ScheduledTask { id: string; name: string; cron_expression: string; prompt: string; enabled: number; last_run?: string; next_run?: string; created_at: string; }

// ─── API Helper ──────────────────────────────────────────────────────────────
async function apiFetch(path: string, opts: RequestInit = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `HTTP ${res.status}`); }
  return res.json().catch(() => ({}));
}

// ─── Color Map ───────────────────────────────────────────────────────────────
const PROJECT_COLORS = ['#7C3AED', '#2563EB', '#059669', '#DC2626', '#D97706', '#DB2777', '#0891B2', '#65A30D'];
const AGENT_ICONS = ['🧠', '⚡', '🔮', '🔥', '🌊', '🎨', '🚀', '💻'];

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const body: any = { email, password };
      if (mode === 'register') body.name = name;
      const data = await apiFetch(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      onLogin({ ...data.user, token: data.token });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:400, padding:'40px', background:'#111118', borderRadius:16, border:'1px solid #1e1e2e' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>⚡</div>
          <h1 style={{ color:'#fff', fontSize:24, fontWeight:700, margin:0 }}>Forge</h1>
          <p style={{ color:'#666', margin:'4px 0 0', fontSize:14 }}>AI Workspace Platform</p>
        </div>
        <div style={{ display:'flex', background:'#0a0a0f', borderRadius:8, marginBottom:24, padding:4 }}>
          {(['login','register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'8px', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:500, background: mode===m ? '#7C3AED' : 'transparent', color: mode===m ? '#fff' : '#666', transition:'all 0.2s' }}>{m === 'login' ? 'Sign In' : 'Sign Up'}</button>
          ))}
        </div>
        {mode === 'register' && (
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
        )}
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ width:'100%', padding:'12px', marginBottom:16, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
        {error && <p style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{error}</p>}
        <button onClick={submit} disabled={loading} style={{ width:'100%', padding:'12px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function ForgeApp() {
  const [user, setUser] = useState<User | null>(null);

  // Core state
  const [projects, setProjects] = useState<Project[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [dispatchRuns, setDispatchRuns] = useState<DispatchRun[]>([]);
  const [schedules, setSchedules] = useState<ScheduledTask[]>([]);

  // Selection
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);

  // UI state
  const [rightTab, setRightTab] = useState<'artifacts' | 'tasks' | 'schedule' | 'dispatch'>('artifacts');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [rightExpanded, setRightExpanded] = useState(true);

  // Composer state
  const [input, setInput] = useState('');
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  // Dispatch state
  const [dispatchPrompt, setDispatchPrompt] = useState('');
  const [dispatchAgentId, setDispatchAgentId] = useState('');
  const [dispatchOutput, setDispatchOutput] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [activeDispatchRunId, setActiveDispatchRunId] = useState<string | null>(null);

  // Schedule form
  const [schedName, setSchedName] = useState('');
  const [schedCron, setSchedCron] = useState('0 9 * * 1-5');
  const [schedPrompt, setSchedPrompt] = useState('');

  // New project modal
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjColor, setNewProjColor] = useState('#7C3AED');
  const [newProjPrompt, setNewProjPrompt] = useState('');

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  // Artifact viewer
  const [viewArtifact, setViewArtifact] = useState<Artifact | null>(null);

  // New task form
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('forge_user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
  }, []);

  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('forge_user', JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('forge_user'); };

  useEffect(() => {
    if (!user) return;
    loadProjects();
    loadAgents();
    loadTasks();
    loadArtifacts();
    loadDispatchRuns();
    loadSchedules();
    loadThreads();
  }, [user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadProjects = async () => { if (!user) return; try { const d = await apiFetch('/projects', {}, user.token); setProjects(d); } catch {} };
  const loadThreads = async (projectId?: string) => { if (!user) return; try { const path = projectId ? `/threads?project_id=${projectId}` : '/threads'; const d = await apiFetch(path, {}, user.token); setThreads(d); } catch {} };
  const loadMessages = async (threadId: string) => { if (!user) return; try { const d = await apiFetch(`/threads/${threadId}/messages`, {}, user.token); setMessages(d); } catch {} };
  const loadAgents = async () => { if (!user) return; try { const d = await apiFetch('/workspace/agents', {}, user.token); setAgents(d); } catch {} };
  const loadTasks = async () => { if (!user) return; try { const d = await apiFetch('/workspace/tasks', {}, user.token); setTasks(d); } catch {} };
  const loadArtifacts = async () => { if (!user) return; try { const d = await apiFetch('/artifacts', {}, user.token); setArtifacts(d); } catch {} };
  const loadDispatchRuns = async () => { if (!user) return; try { const d = await apiFetch('/dispatch/runs', {}, user.token); setDispatchRuns(d); } catch {} };
  const loadSchedules = async () => { if (!user) return; try { const d = await apiFetch('/schedules', {}, user.token); setSchedules(d); } catch {} };

  // ── Project actions ────────────────────────────────────────────────────────
  const createProject = async () => {
    if (!user || !newProjName.trim()) return;
    try {
      await apiFetch('/projects', { method: 'POST', body: JSON.stringify({ name: newProjName, color: newProjColor, system_prompt: newProjPrompt }) }, user.token);
      await loadProjects();
      setShowNewProject(false); setNewProjName(''); setNewProjColor('#7C3AED'); setNewProjPrompt('');
    } catch (e: any) { alert(e.message); }
  };

  const togglePin = async (p: Project) => {
    if (!user) return;
    try { await apiFetch(`/projects/${p.id}`, { method: 'PATCH', body: JSON.stringify({ pinned: p.pinned ? 0 : 1 }) }, user.token); await loadProjects(); } catch {}
  };

  const selectProject = async (p: Project) => {
    setActiveProject(p);
    await loadThreads(p.id);
  };

  // ── Thread actions ─────────────────────────────────────────────────────────
  const newThread = async () => {
    if (!user) return;
    try {
      const body: any = { title: 'New conversation' };
      if (activeProject) body.project_id = activeProject.id;
      const d = await apiFetch('/threads', { method: 'POST', body: JSON.stringify(body) }, user.token);
      await loadThreads(activeProject?.id);
      setActiveThread(d);
      setMessages([]);
    } catch (e: any) { alert(e.message); }
  };

  const selectThread = async (t: Thread) => {
    setActiveThread(t);
    await loadMessages(t.id);
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!user || !input.trim() || sending) return;
    let thread = activeThread;
    if (!thread) { await newThread(); return; }

    const userContent = input.trim();
    setInput('');
    setSending(true);
    setTyping(true);

    const tempUser: Message = { id: 'tmp-u', thread_id: thread.id, role: 'user', content: userContent, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempUser]);

    try {
      const body: any = { content: userContent, model: selectedModel, agent_ids: activeAgentIds };
      const data = await apiFetch(`/threads/${thread.id}/messages`, { method: 'POST', body: JSON.stringify(body) }, user.token);
      await loadMessages(thread.id);
      await loadArtifacts();
      // Refresh thread title
      await loadThreads(activeProject?.id);
    } catch (e: any) {
      const errMsg: Message = { id: 'tmp-err', thread_id: thread.id, role: 'assistant', content: `Error: ${e.message}`, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
      setTyping(false);
    }
  };

  // ── Dispatch with SSE streaming ────────────────────────────────────────────
  const runDispatch = async () => {
    if (!user || !dispatchPrompt.trim() || dispatching) return;
    setDispatching(true);
    setDispatchOutput('');
    try {
      const body: any = { prompt: dispatchPrompt };
      if (dispatchAgentId) body.agent_id = dispatchAgentId;
      const data = await apiFetch('/dispatch/run', { method: 'POST', body: JSON.stringify(body) }, user.token);
      const runId = data.run_id;
      setActiveDispatchRunId(runId);

      // Connect SSE
      if (eventSourceRef.current) eventSourceRef.current.close();
      const es = new EventSource(`${API}/dispatch/stream/${runId}?token=${user.token}`);
      eventSourceRef.current = es;
      let output = '';

      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt.type === 'TEXT_MESSAGE_CHUNK') { output += evt.delta; setDispatchOutput(output); }
          if (evt.type === 'RUN_FINISHED') { es.close(); setDispatching(false); loadDispatchRuns(); }
          if (evt.type === 'ERROR') { es.close(); setDispatching(false); }
        } catch {}
      };
      es.onerror = () => { es.close(); setDispatching(false); };
    } catch (e: any) { alert(e.message); setDispatching(false); }
  };

  const cancelDispatch = async () => {
    if (!user || !activeDispatchRunId) return;
    try { await apiFetch(`/dispatch/cancel/${activeDispatchRunId}`, { method: 'POST' }, user.token); eventSourceRef.current?.close(); setDispatching(false); } catch {}
  };

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const createTask = async () => {
    if (!user || !newTaskTitle.trim()) return;
    try {
      const body: any = { title: newTaskTitle, priority: newTaskPriority, status: 'todo' };
      if (activeProject) body.project_id = activeProject.id;
      await apiFetch('/workspace/tasks', { method: 'POST', body: JSON.stringify(body) }, user.token);
      await loadTasks();
      setShowNewTask(false); setNewTaskTitle('');
    } catch (e: any) { alert(e.message); }
  };

  const cycleTaskStatus = async (t: WorkspaceTask) => {
    if (!user) return;
    const cycle: Record<string, WorkspaceTask['status']> = { todo: 'in_progress', in_progress: 'done', done: 'todo', blocked: 'todo' };
    try { await apiFetch(`/workspace/tasks/${t.id}`, { method: 'PATCH', body: JSON.stringify({ status: cycle[t.status] }) }, user.token); await loadTasks(); } catch {}
  };

  // ── Schedules ──────────────────────────────────────────────────────────────
  const createSchedule = async () => {
    if (!user || !schedName.trim() || !schedPrompt.trim()) return;
    try {
      await apiFetch('/schedules', { method: 'POST', body: JSON.stringify({ name: schedName, cron_expression: schedCron, prompt: schedPrompt }) }, user.token);
      await loadSchedules();
      setSchedName(''); setSchedPrompt('');
    } catch (e: any) { alert(e.message); }
  };

  const toggleSchedule = async (s: ScheduledTask) => {
    if (!user) return;
    try { await apiFetch(`/schedules/${s.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: s.enabled ? 0 : 1 }) }, user.token); await loadSchedules(); } catch {}
  };

  const runScheduleNow = async (s: ScheduledTask) => {
    if (!user) return;
    try { await apiFetch(`/schedules/${s.id}/run`, { method: 'POST' }, user.token); alert('Scheduled task triggered!'); } catch (e: any) { alert(e.message); }
  };

  // ── Toggle agent ───────────────────────────────────────────────────────────
  const toggleAgent = (id: string) => {
    setActiveAgentIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pinnedProjects = projects.filter(p => p.pinned);
  const unpinnedProjects = projects.filter(p => !p.pinned);
  const filteredTasks = activeProject ? tasks.filter(t => t.project_id === activeProject.id) : tasks;

  const taskStatusColor: Record<string, string> = { todo: '#6b7280', in_progress: '#2563EB', done: '#059669', blocked: '#DC2626' };
  const taskPriorityColor: Record<string, string> = { low: '#6b7280', medium: '#D97706', high: '#DC2626' };
  const artifactTypeIcon: Record<string, string> = { code: '💻', html: '🌐', react: '⚛️', markdown: '📝', 'live-dashboard': '📊', diff: '📋', default: '📄' };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // ─── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', background:'#0a0a0f', color:'#e2e8f0', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow:'hidden' }}>

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <div style={{ width: sidebarExpanded ? 260 : 60, background:'#0d0d15', borderRight:'1px solid #1e1e2e', display:'flex', flexDirection:'column', flexShrink:0, transition:'width 0.2s', overflow:'hidden' }}>
        {/* Logo + collapse */}
        <div style={{ padding:'16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1e1e2e' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
            <div style={{ width:32, height:32, background:'#7C3AED', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>⚡</div>
            {sidebarExpanded && <span style={{ fontWeight:700, fontSize:16, color:'#fff', whiteSpace:'nowrap' }}>Forge</span>}
          </div>
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:16, padding:4 }}>{sidebarExpanded ? '◀' : '▶'}</button>
        </div>

        {/* New thread button */}
        <div style={{ padding:'10px 10px 0' }}>
          <button onClick={newThread} title="New conversation" style={{ width:'100%', padding:'10px', background:'#1a1a2e', border:'1px solid #2d2d44', borderRadius:8, color:'#a78bfa', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap:8 }}>
            <span>✏️</span>{sidebarExpanded && 'New conversation'}
          </button>
        </div>

        {/* Pinned projects */}
        {sidebarExpanded && pinnedProjects.length > 0 && (
          <div style={{ padding:'16px 12px 4px' }}>
            <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>Pinned</p>
            {pinnedProjects.map(p => (
              <div key={p.id} onClick={() => selectProject(p)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:6, cursor:'pointer', background: activeProject?.id===p.id ? '#1a1a2e' : 'transparent', marginBottom:2 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                <span style={{ fontSize:13, color:'#cbd5e1', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                <button onClick={e => { e.stopPropagation(); togglePin(p); }} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:12, opacity:0.6, padding:2 }}>📌</button>
              </div>
            ))}
          </div>
        )}

        {/* Recent threads */}
        {sidebarExpanded && (
          <div style={{ padding:'12px 12px 4px', flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>
              {activeProject ? `${activeProject.name}` : 'Recent'}
            </p>
            <div style={{ flex:1, overflowY:'auto' }}>
              {threads.slice(0, 30).map(t => (
                <div key={t.id} onClick={() => selectThread(t)} style={{ padding:'7px 8px', borderRadius:6, cursor:'pointer', marginBottom:1, background: activeThread?.id===t.id ? '#1a1a2e' : 'transparent' }}>
                  <p style={{ margin:0, fontSize:13, color: activeThread?.id===t.id ? '#a78bfa' : '#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</p>
                  <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {threads.length === 0 && <p style={{ color:'#4b5563', fontSize:12, padding:'4px 8px' }}>No conversations yet</p>}
            </div>
          </div>
        )}

        {/* Projects list */}
        {sidebarExpanded && (
          <div style={{ padding:'0 12px 8px', borderTop:'1px solid #1e1e2e' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0 6px' }}>
              <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:0 }}>Projects</p>
              <button onClick={() => setShowNewProject(true)} style={{ background:'none', border:'none', color:'#7C3AED', cursor:'pointer', fontSize:16, lineHeight:1 }}>+</button>
            </div>
            {unpinnedProjects.slice(0, 8).map(p => (
              <div key={p.id} onClick={() => selectProject(p)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6, cursor:'pointer', background: activeProject?.id===p.id ? '#1a1a2e' : 'transparent', marginBottom:1 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                <span style={{ fontSize:13, color:'#94a3b8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                <button onClick={e => { e.stopPropagation(); togglePin(p); }} style={{ background:'none', border:'none', color:'transparent', cursor:'pointer', fontSize:11, padding:2 }} title="Pin">📌</button>
              </div>
            ))}
            {projects.length === 0 && <p style={{ color:'#4b5563', fontSize:12, padding:'2px 8px' }}>No projects yet</p>}
          </div>
        )}

        {/* User profile */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid #1e1e2e', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, background:'#1a1a2e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>👤</div>
          {sidebarExpanded && (
            <>
              <div style={{ flex:1, overflow:'hidden' }}>
                <p style={{ margin:0, fontSize:13, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name || user.email}</p>
              </div>
              <button onClick={() => setShowSettings(true)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:14 }}>⚙️</button>
              <button onClick={handleLogout} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:12 }}>↗</button>
            </>
          )}
        </div>
      </div>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Top bar */}
        <div style={{ padding:'0 20px', height:52, background:'#0d0d15', borderBottom:'1px solid #1e1e2e', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ flex:1, overflow:'hidden' }}>
            <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {activeThread ? activeThread.title : activeProject ? activeProject.name : 'Forge Workspace'}
            </h2>
            {activeProject && <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{activeProject.name}</p>}
          </div>

          {/* Model selector */}
          <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ background:'#1a1a2e', border:'1px solid #2d2d44', borderRadius:8, color:'#a78bfa', padding:'6px 10px', fontSize:12, cursor:'pointer' }}>
            <optgroup label="Anthropic">
              <option value="claude-opus-4">Claude Opus 4</option>
              <option value="claude-sonnet-4">Claude Sonnet 4</option>
              <option value="claude-haiku-4">Claude Haiku 4.5</option>
            </optgroup>
            <optgroup label="OpenAI">
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
            </optgroup>
            <optgroup label="Google">
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </optgroup>
          </select>

          <button onClick={() => setRightExpanded(!rightExpanded)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:14 }}>{rightExpanded ? '▶' : '◀'}</button>
        </div>

        {/* Messages canvas */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 32px', display:'flex', flexDirection:'column', gap:16 }}>
          {messages.length === 0 && !activeThread && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
              <div style={{ fontSize:48 }}>⚡</div>
              <h2 style={{ color:'#e2e8f0', margin:0, fontSize:24 }}>What do you want to build?</h2>
              <p style={{ color:'#4b5563', margin:0, textAlign:'center', maxWidth:400 }}>Start a conversation, pick a project, or dispatch an agent to work on your next big idea.</p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginTop:8 }}>
                {['Write a React component', 'Research a topic', 'Build an API endpoint', 'Create a deployment plan'].map(s => (
                  <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }} style={{ padding:'8px 14px', background:'#1a1a2e', border:'1px solid #2d2d44', borderRadius:20, color:'#94a3b8', fontSize:13, cursor:'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={m.id || i} style={{ display:'flex', gap:12, alignItems:'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background: m.role === 'user' ? '#7C3AED' : '#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                {m.role === 'user' ? '👤' : '⚡'}
              </div>
              <div style={{ maxWidth:'75%', padding:'12px 16px', borderRadius: m.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: m.role === 'user' ? '#1a1a2e' : '#111118', border:'1px solid #1e1e2e', lineHeight:1.6 }}>
                <p style={{ margin:0, fontSize:14, color:'#e2e8f0', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{m.content}</p>
                {m.model && <p style={{ margin:'6px 0 0', fontSize:11, color:'#4b5563' }}>{m.model}</p>}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚡</div>
              <div style={{ padding:'12px 16px', borderRadius:'4px 18px 18px 18px', background:'#111118', border:'1px solid #1e1e2e' }}>
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#4b5563', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── COMPOSER ──────────────────────────────────────────────────────── */}
        <div style={{ padding:'12px 24px 16px', background:'#0d0d15', borderTop:'1px solid #1e1e2e' }}>
          {/* Agent bar */}
          <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
            {agents.filter(a => a.enabled).map(a => (
              <button key={a.id} onClick={() => toggleAgent(a.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, border: activeAgentIds.includes(a.id) ? `1px solid ${a.color}` : '1px solid #2d2d44', background: activeAgentIds.includes(a.id) ? `${a.color}22` : 'transparent', color: activeAgentIds.includes(a.id) ? a.color : '#6b7280', cursor:'pointer', fontSize:12, fontWeight:500, transition:'all 0.15s' }}>
                <span>{a.icon}</span><span>{a.name}</span>
              </button>
            ))}
            {agents.length === 0 && <span style={{ fontSize:12, color:'#4b5563' }}>No agents loaded</span>}
          </div>

          {/* Input area */}
          <div style={{ position:'relative', background:'#111118', border:'1px solid #2d2d44', borderRadius:12, overflow:'hidden' }}>
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={activeThread ? 'Message...' : 'Start a conversation...'} rows={3} style={{ width:'100%', padding:'14px 16px 40px', background:'transparent', border:'none', color:'#e2e8f0', fontSize:14, resize:'none', outline:'none', lineHeight:1.6, boxSizing:'border-box' }} />

            {/* Bottom toolbar */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', gap:6 }}>
                {/* Quick action chips */}
                <button onClick={() => { setRightTab('artifacts'); setRightExpanded(true); }} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'transparent', border:'1px solid #2d2d44', borderRadius:6, color:'#6b7280', cursor:'pointer', fontSize:11 }}>📄 Artifact</button>
                <button onClick={() => { setRightTab('schedule'); setRightExpanded(true); }} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'transparent', border:'1px solid #2d2d44', borderRadius:6, color:'#6b7280', cursor:'pointer', fontSize:11 }}>⏰ Schedule</button>
                <button onClick={() => { setShowNewTask(true); }} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'transparent', border:'1px solid #2d2d44', borderRadius:6, color:'#6b7280', cursor:'pointer', fontSize:11 }}>✅ Task</button>
                <button onClick={() => { setRightTab('dispatch'); setRightExpanded(true); }} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'transparent', border:'1px solid #2d2d44', borderRadius:6, color:'#6b7280', cursor:'pointer', fontSize:11 }}>🚀 Dispatch</button>
              </div>
              <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ width:32, height:32, background: input.trim() && !sending ? '#7C3AED' : '#1a1a2e', border:'none', borderRadius:8, color:'#fff', cursor: input.trim() && !sending ? 'pointer' : 'default', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}>
                {sending ? '⏳' : '↑'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────────── */}
      {rightExpanded && (
        <div style={{ width:340, background:'#0d0d15', borderLeft:'1px solid #1e1e2e', display:'flex', flexDirection:'column', flexShrink:0 }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid #1e1e2e', padding:'0 4px' }}>
            {(['artifacts', 'tasks', 'schedule', 'dispatch'] as const).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)} style={{ flex:1, padding:'12px 4px', background:'none', border:'none', borderBottom: rightTab===tab ? '2px solid #7C3AED' : '2px solid transparent', color: rightTab===tab ? '#a78bfa' : '#4b5563', cursor:'pointer', fontSize:12, fontWeight:500, textTransform:'capitalize' }}>{tab}</button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:12 }}>

            {/* ARTIFACTS TAB */}
            {rightTab === 'artifacts' && (
              <div>
                <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Artifacts ({artifacts.length})</p>
                {artifacts.length === 0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', marginTop:40 }}>No artifacts yet.<br/>Ask the AI to create code, HTML, or documents.</p>}
                {artifacts.slice(0, 20).map(a => (
                  <div key={a.id} onClick={() => setViewArtifact(a)} style={{ padding:'10px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, marginBottom:6, cursor:'pointer', transition:'border-color 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:16 }}>{artifactTypeIcon[a.type] || artifactTypeIcon.default}</span>
                      <span style={{ fontSize:13, fontWeight:500, color:'#e2e8f0', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                      <span style={{ fontSize:10, color:'#4b5563', background:'#1a1a2e', padding:'2px 6px', borderRadius:4 }}>v{a.version}</span>
                    </div>
                    <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{a.type} · {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TASKS TAB */}
            {rightTab === 'tasks' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0 }}>Tasks ({filteredTasks.length})</p>
                  <button onClick={() => setShowNewTask(true)} style={{ background:'#7C3AED', border:'none', borderRadius:6, color:'#fff', padding:'4px 8px', fontSize:11, cursor:'pointer' }}>+ New</button>
                </div>
                {filteredTasks.length === 0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', marginTop:40 }}>No tasks yet.</p>}
                {filteredTasks.map(t => (
                  <div key={t.id} onClick={() => cycleTaskStatus(t)} style={{ padding:'10px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, marginBottom:6, cursor:'pointer' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:taskStatusColor[t.status], flexShrink:0 }} />
                      <span style={{ fontSize:13, color:'#e2e8f0', flex:1 }}>{t.title}</span>
                      <span style={{ fontSize:10, color:taskPriorityColor[t.priority] }}>{t.priority}</span>
                    </div>
                    <p style={{ margin:'4px 0 0 16px', fontSize:11, color:'#4b5563' }}>{t.status.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            )}

            {/* SCHEDULE TAB */}
            {rightTab === 'schedule' && (
              <div>
                <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Scheduled Tasks</p>
                {/* Create form */}
                <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, padding:12, marginBottom:12 }}>
                  <p style={{ margin:'0 0 8px', fontSize:12, color:'#94a3b8', fontWeight:500 }}>New Schedule</p>
                  <input placeholder="Name" value={schedName} onChange={e => setSchedName(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:6, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:12, boxSizing:'border-box' }} />
                  <input placeholder="Cron (e.g. 0 9 * * 1-5)" value={schedCron} onChange={e => setSchedCron(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:6, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:12, boxSizing:'border-box' }} />
                  <textarea placeholder="Prompt to run..." value={schedPrompt} onChange={e => setSchedPrompt(e.target.value)} rows={2} style={{ width:'100%', padding:'8px', marginBottom:8, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:12, resize:'none', boxSizing:'border-box' }} />
                  <button onClick={createSchedule} style={{ width:'100%', padding:'8px', background:'#7C3AED', border:'none', borderRadius:6, color:'#fff', fontSize:12, cursor:'pointer' }}>Create Schedule</button>
                </div>

                {schedules.length === 0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', marginTop:24 }}>No scheduled tasks.</p>}
                {schedules.map(s => (
                  <div key={s.id} style={{ padding:'10px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:11, color: s.enabled ? '#059669' : '#4b5563' }}>●</span>
                      <span style={{ fontSize:13, color:'#e2e8f0', flex:1 }}>{s.name}</span>
                      <button onClick={() => toggleSchedule(s)} style={{ background:'none', border:'none', color: s.enabled ? '#059669' : '#4b5563', cursor:'pointer', fontSize:11 }}>{s.enabled ? 'ON' : 'OFF'}</button>
                      <button onClick={() => runScheduleNow(s)} style={{ background:'#1a1a2e', border:'1px solid #2d2d44', borderRadius:4, color:'#6b7280', cursor:'pointer', fontSize:10, padding:'2px 6px' }}>▶</button>
                    </div>
                    <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{s.cron_expression}</p>
                    {s.last_run && <p style={{ margin:'2px 0 0', fontSize:11, color:'#4b5563' }}>Last: {new Date(s.last_run).toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* DISPATCH TAB */}
            {rightTab === 'dispatch' && (
              <div>
                <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Dispatch Agent</p>
                {/* Agent selector */}
                <select value={dispatchAgentId} onChange={e => setDispatchAgentId(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:8, background:'#111118', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:12 }}>
                  <option value="">Auto (best agent)</option>
                  {agents.filter(a => a.enabled).map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
                <textarea placeholder="Describe what you want the agent to do..." value={dispatchPrompt} onChange={e => setDispatchPrompt(e.target.value)} rows={4} style={{ width:'100%', padding:'10px', marginBottom:8, background:'#111118', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13, resize:'none', boxSizing:'border-box' }} />
                <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                  <button onClick={runDispatch} disabled={dispatching || !dispatchPrompt.trim()} style={{ flex:1, padding:'10px', background: dispatching ? '#1a1a2e' : '#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor: dispatching ? 'default' : 'pointer' }}>
                    {dispatching ? '⚡ Running...' : '🚀 Dispatch'}
                  </button>
                  {dispatching && <button onClick={cancelDispatch} style={{ padding:'10px 12px', background:'#1a1a2e', border:'1px solid #DC2626', borderRadius:8, color:'#DC2626', fontSize:12, cursor:'pointer' }}>✕</button>}
                </div>

                {/* SSE output */}
                {dispatchOutput && (
                  <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, padding:12, marginBottom:12 }}>
                    <p style={{ margin:'0 0 6px', fontSize:11, color:'#4b5563', fontWeight:600 }}>OUTPUT</p>
                    <p style={{ margin:0, fontSize:13, color:'#e2e8f0', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{dispatchOutput}</p>
                  </div>
                )}

                {/* Run history */}
                {dispatchRuns.length > 0 && (
                  <div>
                    <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 8px' }}>History</p>
                    {dispatchRuns.slice(0, 10).map(r => (
                      <div key={r.id} style={{ padding:'8px 10px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:6, marginBottom:4 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                          <span style={{ fontSize:10, color: r.status === 'completed' ? '#059669' : r.status === 'running' ? '#D97706' : '#DC2626' }}>●</span>
                          <span style={{ fontSize:12, color:'#94a3b8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.prompt.slice(0, 50)}{r.prompt.length > 50 ? '...' : ''}</span>
                        </div>
                        <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NEW PROJECT MODAL ──────────────────────────────────────────────── */}
      {showNewProject && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowNewProject(false)}>
          <div style={{ width:420, background:'#111118', borderRadius:16, padding:24, border:'1px solid #1e1e2e' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontSize:18 }}>New Project</h3>
            <input placeholder="Project name" value={newProjName} onChange={e => setNewProjName(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
            <p style={{ color:'#4b5563', fontSize:12, margin:'0 0 8px' }}>Color</p>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <div key={c} onClick={() => setNewProjColor(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border: newProjColor===c ? '3px solid #fff' : '3px solid transparent', transition:'border 0.15s' }} />
              ))}
            </div>
            <textarea placeholder="System prompt (optional) — instructions every message in this project will follow" value={newProjPrompt} onChange={e => setNewProjPrompt(e.target.value)} rows={3} style={{ width:'100%', padding:'12px', marginBottom:16, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowNewProject(false)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid #2d2d44', borderRadius:8, color:'#6b7280', cursor:'pointer' }}>Cancel</button>
              <button onClick={createProject} style={{ flex:1, padding:'10px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW TASK MODAL ─────────────────────────────────────────────────── */}
      {showNewTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowNewTask(false)}>
          <div style={{ width:380, background:'#111118', borderRadius:16, padding:24, border:'1px solid #1e1e2e' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontSize:18 }}>New Task</h3>
            <input placeholder="Task title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:6, marginBottom:16 }}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <button key={p} onClick={() => setNewTaskPriority(p)} style={{ flex:1, padding:'8px', background: newTaskPriority===p ? taskPriorityColor[p] + '33' : 'transparent', border:`1px solid ${newTaskPriority===p ? taskPriorityColor[p] : '#2d2d44'}`, borderRadius:6, color: newTaskPriority===p ? taskPriorityColor[p] : '#6b7280', cursor:'pointer', fontSize:12, textTransform:'capitalize' }}>{p}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowNewTask(false)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid #2d2d44', borderRadius:8, color:'#6b7280', cursor:'pointer' }}>Cancel</button>
              <button onClick={createTask} style={{ flex:1, padding:'10px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ────────────────────────────────────────────────── */}
      {showSettings && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowSettings(false)}>
          <div style={{ width:500, background:'#111118', borderRadius:16, padding:24, border:'1px solid #1e1e2e', maxHeight:'80vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontSize:18 }}>Settings</h3>
            <p style={{ color:'#4b5563', fontSize:12, margin:'0 0 12px', fontWeight:600, textTransform:'uppercase' }}>API Keys</p>
            {[
              { key:'anthropic', label:'Anthropic (Claude)', placeholder:'sk-ant-...' },
              { key:'openai', label:'OpenAI (GPT)', placeholder:'sk-...' },
              { key:'google', label:'Google (Gemini)', placeholder:'AIza...' },
              { key:'groq', label:'Groq (Llama)', placeholder:'gsk_...' },
              { key:'mistral', label:'Mistral', placeholder:'...' },
              { key:'openrouter', label:'OpenRouter', placeholder:'sk-or-...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom:12 }}>
                <label style={{ display:'block', color:'#94a3b8', fontSize:12, marginBottom:4 }}>{label}</label>
                <input type="password" placeholder={placeholder} value={apiKeys[key] || ''} onChange={e => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))} style={{ width:'100%', padding:'10px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <p style={{ color:'#4b5563', fontSize:12, margin:'20px 0 12px', fontWeight:600, textTransform:'uppercase' }}>Agents</p>
            {agents.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'#0a0a0f', borderRadius:8, marginBottom:6 }}>
                <span style={{ fontSize:18 }}>{a.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{a.name}</p>
                  <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{a.model}</p>
                </div>
                <div style={{ width:10, height:10, borderRadius:'50%', background: a.enabled ? '#059669' : '#4b5563' }} />
              </div>
            ))}
            <button onClick={() => setShowSettings(false)} style={{ width:'100%', padding:'10px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', marginTop:20, cursor:'pointer', fontSize:14, fontWeight:600 }}>Save & Close</button>
          </div>
        </div>
      )}

      {/* ── ARTIFACT VIEWER MODAL ──────────────────────────────────────────── */}
      {viewArtifact && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setViewArtifact(null)}>
          <div style={{ width:'80vw', maxWidth:900, height:'80vh', background:'#111118', borderRadius:16, padding:24, border:'1px solid #1e1e2e', display:'flex', flexDirection:'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <span style={{ fontSize:22 }}>{artifactTypeIcon[viewArtifact.type] || artifactTypeIcon.default}</span>
              <h3 style={{ color:'#fff', margin:0, fontSize:18, flex:1 }}>{viewArtifact.title}</h3>
              <span style={{ fontSize:11, color:'#4b5563', background:'#1a1a2e', padding:'4px 8px', borderRadius:6 }}>v{viewArtifact.version} · {viewArtifact.type}</span>
              <button onClick={() => setViewArtifact(null)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', background:'#0a0a0f', borderRadius:8, padding:16, border:'1px solid #1e1e2e' }}>
              <pre style={{ margin:0, fontSize:13, color:'#e2e8f0', fontFamily:'ui-monospace, monospace', whiteSpace:'pre-wrap', wordBreak:'break-word', lineHeight:1.6 }}>{viewArtifact.content}</pre>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d2d44; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: #4b5563; }
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
