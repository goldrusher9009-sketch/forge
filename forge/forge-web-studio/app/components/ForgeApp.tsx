// Forge AI Workspace v5.0 — Full feature restore
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User { id: string; email: string; name?: string; token: string; plan?: string; }
interface Project { id: string; name: string; color: string; system_prompt?: string; pinned?: number; created_at: string; }
interface Thread { id: string; project_id?: string; title: string; created_at: string; }
interface Message { id: string; thread_id: string; role: 'user' | 'assistant'; content: string; model?: string; created_at: string; }
interface Artifact { id: string; thread_id?: string; title: string; type: string; content: string; version: number; created_at: string; }
interface WorkspaceAgent { id: string; name: string; icon: string; color: string; system_prompt: string; model: string; enabled: number; built_in?: number; }
interface WorkspaceTask { id: string; title: string; description?: string; status: 'todo' | 'in_progress' | 'done' | 'blocked'; priority: 'low' | 'medium' | 'high'; project_id?: string; created_at: string; }
interface DispatchRun { id: string; prompt: string; status: string; result?: string; created_at: string; }
interface ScheduledTask { id: string; name: string; cron_expression: string; prompt: string; enabled: number; last_run?: string; next_run?: string; created_at: string; }
interface CustomProvider { id: string; name: string; base_url: string; api_key_hint?: string; markup: number; models: string; enabled: number; }
interface UsageLog { id: string; model: string; tokens_in: number; tokens_out: number; cost_usd: number; markup_usd: number; created_at: string; }
interface Subscription { plan: string; tokens_used: number; token_limit: number; period_end?: string; }

// ─── API Helper ───────────────────────────────────────────────────────────────
let _onSessionExpired: (() => void) | null = null;
async function apiFetch(path: string, opts: RequestInit = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (res.status === 401) {
    const err = await res.json().catch(() => ({}));
    if (err.error === 'AUTHENTICATION_REQUIRED' || err.error === 'INVALID_TOKEN') {
      // Session expired — clear local auth and force re-login
      localStorage.removeItem('forge_user');
      if (_onSessionExpired) _onSessionExpired();
    }
    throw new Error(err.error || 'Session expired. Please log in again.');
  }
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || err.message || `HTTP ${res.status}`); }
  return res.json().catch(() => ({}));
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROJECT_COLORS = ['#7C3AED','#2563EB','#059669','#DC2626','#D97706','#DB2777','#0891B2','#65A30D'];
const AGENT_ICONS = ['🧠','⚡','🔮','🔥','🌊','🎨','🚀','💻'];
const FORGE_MODELS = [
  { id:'forge-ultra',  label:'Forge Ultra',  desc:'Claude Opus 4.5 + markup',       base:'claude-opus-4-5' },
  { id:'forge-pro',    label:'Forge Pro',    desc:'Claude Sonnet 4.5 + markup',     base:'claude-sonnet-4-5' },
  { id:'forge-flash',  label:'Forge Flash',  desc:'Claude Haiku 4.5 + markup',      base:'claude-haiku-4-5-20251001' },
  { id:'forge-gpt',    label:'Forge GPT',    desc:'GPT-4o + markup',                base:'gpt-4o' },
  { id:'forge-gemini', label:'Forge Gemini', desc:'Gemini 2.0 Flash + markup',      base:'gemini-2.0-flash' },
];
const DIRECT_MODELS = [
  { group:'Anthropic', models:[
    { id:'claude-opus-4-5',         label:'Claude Opus 4.5' },
    { id:'claude-sonnet-4-5',       label:'Claude Sonnet 4.5' },
    { id:'claude-haiku-4-5',        label:'Claude Haiku 4.5' },
    { id:'claude-3-5-sonnet',       label:'Claude 3.5 Sonnet' },
    { id:'claude-3-5-haiku',        label:'Claude 3.5 Haiku' },
    { id:'claude-3-opus',           label:'Claude 3 Opus' },
  ]},
  { group:'OpenAI', models:[
    { id:'gpt-4o',      label:'GPT-4o' },
    { id:'gpt-4o-mini', label:'GPT-4o Mini' },
    { id:'gpt-4.1',     label:'GPT-4.1' },
    { id:'o3-mini',     label:'o3 Mini' },
  ]},
  { group:'Google', models:[
    { id:'gemini-2.0-flash', label:'Gemini 2.0 Flash' },
    { id:'gemini-1.5-pro',   label:'Gemini 1.5 Pro' },
  ]},
  { group:'Groq', models:[
    { id:'llama-3.3-70b',  label:'Llama 3.3 70B' },
    { id:'llama-3.1-8b',   label:'Llama 3.1 8B' },
    { id:'mixtral-8x7b',   label:'Mixtral 8×7B' },
  ]},
  { group:'Mistral', models:[
    { id:'mistral-large', label:'Mistral Large' },
    { id:'mistral-small', label:'Mistral Small' },
  ]},
];

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const body: any = { email, password };
      if (mode === 'register') { body.firstName = name; body.lastName = ''; }
      if (mode === 'register') {
        await apiFetch('/auth/register', { method:'POST', body:JSON.stringify(body) });
        // Auto-login after register
        const login = await apiFetch('/auth/login', { method:'POST', body:JSON.stringify({ email, password }) });
        const u = login.data?.user || login.user || {};
        const token = login.data?.accessToken || login.token || '';
        onLogin({ id: u.id, email: u.email, name: u.firstName || u.name || email, token });
      } else {
        const data = await apiFetch('/auth/login', { method:'POST', body:JSON.stringify(body) });
        const u = data.data?.user || data.user || {};
        const token = data.data?.accessToken || data.token || '';
        if (!token) throw new Error('No token received — check credentials');
        onLogin({ id: u.id, email: u.email, name: u.firstName || u.name || email, token });
      }
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('INVALID_CREDENTIALS')) setError('Invalid email or password');
      else if (msg.includes('DUPLICATE_EMAIL')) setError('Email already registered — try signing in');
      else if (msg.includes('INVALID_PASSWORD')) setError('Password must be at least 8 characters');
      else setError(msg || 'Something went wrong');
    }
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
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'8px', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:500, background:mode===m ? '#7C3AED' : 'transparent', color:mode===m ? '#fff' : '#666', transition:'all 0.2s' }}>{m==='login' ? 'Sign In' : 'Sign Up'}</button>
          ))}
        </div>
        {mode==='register' && <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />}
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} style={{ width:'100%', padding:'12px', marginBottom:16, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
        {error && <p style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{error}</p>}
        <button onClick={submit} disabled={loading} style={{ width:'100%', padding:'12px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading ? 0.7 : 1 }}>
          {loading ? '...' : (mode==='login' ? 'Sign In' : 'Create Account')}
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ForgeApp() {
  const [user, setUser] = useState<User | null>(null);

  // Core data
  const [projects, setProjects] = useState<Project[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [dispatchRuns, setDispatchRuns] = useState<DispatchRun[]>([]);
  const [schedules, setSchedules] = useState<ScheduledTask[]>([]);
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [openRouterModels, setOpenRouterModels] = useState<string[]>([]);

  // Selection
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);

  // Main tab — 'workspace' | 'router' | 'billing' | 'platforms' | 'settings'
  const [mainTab, setMainTab] = useState<'workspace'|'router'|'billing'|'platforms'|'settings'>('workspace');

  // Right panel tabs
  const [rightTab, setRightTab] = useState<'artifacts'|'tasks'|'schedule'|'dispatch'>('artifacts');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [rightExpanded, setRightExpanded] = useState(true);

  // Composer
  const [input, setInput] = useState('');
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [multiResponse, setMultiResponse] = useState(false);
  const [multiResponses, setMultiResponses] = useState<{model:string; content:string}[]>([]);

  // Voice chat
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Sketch / Live Preview
  const [sketchMode, setSketchMode] = useState(false);
  const [sketchArtifact, setSketchArtifact] = useState<Artifact | null>(null);
  const [previewCode, setPreviewCode] = useState('');

  // Dispatch
  const [dispatchPrompt, setDispatchPrompt] = useState('');
  const [dispatchAgentIds, setDispatchAgentIds] = useState<string[]>([]);
  const [dispatchOutput, setDispatchOutput] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [activeDispatchRunId, setActiveDispatchRunId] = useState<string|null>(null);

  // Schedule form
  const [schedName, setSchedName] = useState('');
  const [schedCron, setSchedCron] = useState('0 9 * * 1-5');
  const [schedPrompt, setSchedPrompt] = useState('');

  // Modals
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjColor, setNewProjColor] = useState('#7C3AED');
  const [newProjPrompt, setNewProjPrompt] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low'|'medium'|'high'>('medium');
  const [viewArtifact, setViewArtifact] = useState<Artifact | null>(null);

  // Settings / API keys
  const [apiKeys, setApiKeys] = useState<Record<string,string>>({});
  const [keysSaved, setKeysSaved] = useState(false);

  // Service credentials (subscription logins — Claude, OpenAI, Cursor) — persisted in localStorage
  const [serviceCreds, setServiceCreds] = useState<Record<string, { email:string; password:string; connected:boolean }>>({
    claude: { email:'', password:'', connected:false },
    openai: { email:'', password:'', connected:false },
    cursor: { email:'', password:'', connected:false },
  });
  const [serviceExpanded, setServiceExpanded] = useState<Record<string,boolean>>({});

  // LLM provider credentials (username + password + API key) — persisted in localStorage
  const [llmCreds, setLlmCreds] = useState<Record<string, { username:string; password:string; connected:boolean }>>({
    openrouter: { username:'', password:'', connected:false },
    groq: { username:'', password:'', connected:false },
    gemini: { username:'', password:'', connected:false },
    mistral: { username:'', password:'', connected:false },
    together: { username:'', password:'', connected:false },
    perplexity: { username:'', password:'', connected:false },
  });
  const [llmExpanded, setLlmExpanded] = useState<Record<string,boolean>>({});

  // ForgeRouter state
  const [routerTab, setRouterTab] = useState<'forge'|'direct'|'openrouter'|'custom'>('forge');
  const [orSearch, setOrSearch] = useState('');
  const [newProvider, setNewProvider] = useState({ name:'', base_url:'', api_key:'', markup:'1.5', models:'' });
  const [routerTestPrompt, setRouterTestPrompt] = useState('');
  const [routerTestModel, setRouterTestModel] = useState('forge-pro');
  const [routerTestResult, setRouterTestResult] = useState('');
  const [routerTesting, setRouterTesting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('forge_user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
  }, []);

  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('forge_user', JSON.stringify(u)); };
  const handleLogout = useCallback(() => { setUser(null); localStorage.removeItem('forge_user'); }, []);

  // Register session-expiry handler so apiFetch can auto-logout on 401
  useEffect(() => { _onSessionExpired = handleLogout; return () => { _onSessionExpired = null; }; }, [handleLogout]);

  // Restore credentials from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const sc = localStorage.getItem('forge_service_creds');
      if (sc) setServiceCreds(prev => ({ ...prev, ...JSON.parse(sc) }));
      const lc = localStorage.getItem('forge_llm_creds');
      if (lc) setLlmCreds(prev => ({ ...prev, ...JSON.parse(lc) }));
    } catch {}
  }, []);

  // Persist credentials to localStorage whenever they change (client-only)
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('forge_service_creds', JSON.stringify(serviceCreds)); }, [serviceCreds]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('forge_llm_creds', JSON.stringify(llmCreds)); }, [llmCreds]);

  useEffect(() => {
    if (!user) return;
    loadProjects(); loadAgents(); loadTasks(); loadArtifacts();
    loadDispatchRuns(); loadSchedules(); loadThreads();
    loadCustomProviders(); loadUsageLogs(); loadSubscription();
    loadOpenRouterModels(); loadApiKeys();
  }, [user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);


  // ── Data loaders ───────────────────────────────────────────────────────────
  const unwrap = (d: any): any[] => Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  const loadProjects = async () => { if (!user) return; try { const d = await apiFetch('/projects', {}, user.token); setProjects(unwrap(d)); } catch {} };
  const loadThreads = async (projectId?: string) => { if (!user) return; try { const path = projectId ? `/threads?project_id=${projectId}` : '/threads'; const d = await apiFetch(path, {}, user.token); setThreads(unwrap(d)); } catch {} };
  const loadMessages = async (threadId: string) => { if (!user) return; try { const d = await apiFetch(`/threads/${threadId}/messages`, {}, user.token); setMessages(unwrap(d)); } catch {} };
  const loadAgents = async () => { if (!user) return; try { const d = await apiFetch('/workspace/agents', {}, user.token); setAgents(unwrap(d)); } catch {} };
  const loadTasks = async () => { if (!user) return; try { const d = await apiFetch('/workspace/tasks', {}, user.token); setTasks(unwrap(d)); } catch {} };
  const loadArtifacts = async () => { if (!user) return; try { const d = await apiFetch('/artifacts', {}, user.token); setArtifacts(unwrap(d)); } catch {} };
  const loadDispatchRuns = async () => { if (!user) return; try { const d = await apiFetch('/dispatch/runs', {}, user.token); setDispatchRuns(unwrap(d)); } catch {} };
  const loadSchedules = async () => { if (!user) return; try { const d = await apiFetch('/schedules', {}, user.token); setSchedules(unwrap(d)); } catch {} };
  const loadCustomProviders = async () => { if (!user) return; try { const d = await apiFetch('/providers/custom', {}, user.token); setCustomProviders(Array.isArray(d) ? d : []); } catch {} };
  const loadUsageLogs = async () => { if (!user) return; try { const d = await apiFetch('/billing/usage', {}, user.token); setUsageLogs(Array.isArray(d?.logs) ? d.logs : []); } catch {} };
  const loadSubscription = async () => {
    if (!user) return;
    try {
      const d = await apiFetch('/billing/subscription', {}, user.token);
      if (!d || !d.success) return;
      // Backend returns camelCase (tokensUsed/tokenLimit) — normalize to snake_case for our Subscription type
      setSubscription({
        plan: d.plan || 'free',
        tokens_used: d.tokens_used ?? d.tokensUsed ?? 0,
        token_limit: d.token_limit ?? d.tokenLimit ?? 10000,
        period_end: d.period_end ?? d.periodEnd,
      });
    } catch {}
  };
  const loadOpenRouterModels = async () => { if (!user) return; try { const d = await apiFetch('/keys/openrouter-models', {}, user.token); setOpenRouterModels(Array.isArray(d) ? d : []); } catch {} };
  const loadApiKeys = async () => {
    if (!user) return;
    try {
      const d = await apiFetch('/keys', {}, user.token);
      // Backend returns { success, data: { anthropic_key: 'preview...', has_anthropic: true, ... } }
      // We need to rebuild apiKeys as { anthropic: 'full-key-if-in-state-or-preview' }
      // We keep full keys already in state (user typed them), but mark providers as active
      const data = d?.data || d?.keys || {};
      // Build a map of provider -> preview (so we know which are saved)
      const saved: Record<string,string> = {};
      const providers = ['anthropic','openai','openrouter','groq','gemini','mistral','together','perplexity','cohere','cursor'];
      providers.forEach(p => {
        if (data[`has_${p}`]) {
          // Provider has a key saved — keep existing full key in state if present, else mark with preview
          saved[p] = apiKeys[p] || data[`${p}_key`] || '__saved__';
        }
      });
      setApiKeys(prev => ({ ...prev, ...saved }));
    } catch {}
  };

  // ── Save API keys ──────────────────────────────────────────────────────────
  const saveApiKeys = async () => {
    if (!user) return;
    try {
      // Backend expects flat body: { anthropic_key: 'sk-ant-...', openai_key: 'sk-...', ... }
      const body: Record<string,string> = {};
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key && key !== '__saved__' && key.trim().length > 0) {
          body[`${provider}_key`] = key.trim();
        }
      });
      await apiFetch('/keys', { method:'POST', body:JSON.stringify(body) }, user.token);
      setKeysSaved(true); setTimeout(() => setKeysSaved(false), 3000);
      await loadApiKeys();
    } catch (e: any) {
      const msg = e?.message || String(e);
      alert(`Save failed: ${msg}\n\nMake sure you are logged in and try again.`);
    }
  };

  // ── Projects ───────────────────────────────────────────────────────────────
  const createProject = async () => {
    if (!user || !newProjName.trim()) return;
    try {
      await apiFetch('/projects', { method:'POST', body:JSON.stringify({ name:newProjName, color:newProjColor, system_prompt:newProjPrompt }) }, user.token);
      await loadProjects();
      setShowNewProject(false); setNewProjName(''); setNewProjColor('#7C3AED'); setNewProjPrompt('');
    } catch (e: any) { alert(e.message); }
  };

  const togglePin = async (p: Project) => {
    if (!user) return;
    try { await apiFetch(`/projects/${p.id}`, { method:'PATCH', body:JSON.stringify({ pinned:p.pinned ? 0 : 1 }) }, user.token); await loadProjects(); } catch {}
  };

  const selectProject = async (p: Project) => { setActiveProject(p); await loadThreads(p.id); };

  // ── Threads ────────────────────────────────────────────────────────────────
  const newThread = async () => {
    if (!user) return;
    try {
      const body: any = { title:'New conversation' };
      if (activeProject) body.project_id = activeProject.id;
      const d = await apiFetch('/threads', { method:'POST', body:JSON.stringify(body) }, user.token);
      await loadThreads(activeProject?.id); setActiveThread(d); setMessages([]);
    } catch (e: any) { alert(e.message); }
  };

  const selectThread = async (t: Thread) => { setActiveThread(t); await loadMessages(t.id); };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!user || !input.trim() || sending) return;
    if (!activeThread) { await newThread(); return; }

    const userContent = input.trim();
    setInput(''); setVoiceTranscript('');
    setSending(true); setTyping(true);
    setMultiResponses([]);

    const tempUser: Message = { id:'tmp-u', thread_id:activeThread.id, role:'user', content:userContent, created_at:new Date().toISOString() };
    setMessages(prev => [...prev, tempUser]);

    // Multi-response mode: query 3 models in parallel
    if (multiResponse) {
      const modelsToQuery = ['claude-sonnet-4','gpt-4o','gemini-2.0-flash'];
      try {
        const results = await Promise.allSettled(modelsToQuery.map(m =>
          apiFetch(`/threads/${activeThread.id}/messages`, { method:'POST', body:JSON.stringify({ content:userContent, model:m, agent_ids:activeAgentIds }) }, user.token)
        ));
        const responses = results.map((r, i) => ({
          model: modelsToQuery[i],
          content: r.status === 'fulfilled' ? (r.value?.assistant_message?.content || 'No response') : `Error: ${(r as any).reason?.message}`
        }));
        setMultiResponses(responses);
        await loadMessages(activeThread.id);
        await loadArtifacts();
      } catch {}
      setSending(false); setTyping(false);
      return;
    }

    try {
      const body: any = { content:userContent, model:selectedModel, agent_ids:activeAgentIds };
      await apiFetch(`/threads/${activeThread.id}/messages`, { method:'POST', body:JSON.stringify(body) }, user.token);
      await loadMessages(activeThread.id);
      await loadArtifacts();
      await loadThreads(activeProject?.id);
      // Auto-refresh sketch if active
      if (sketchMode) {
        const fresh = await apiFetch('/artifacts', {}, user.token);
        const arr = Array.isArray(fresh) ? fresh : Array.isArray(fresh?.data) ? fresh.data : [];
        if (arr.length > 0) { setSketchArtifact(arr[0]); setPreviewCode(arr[0].content); }
      }
    } catch (e: any) {
      const errMsg: Message = { id:'tmp-err', thread_id:activeThread.id, role:'assistant', content:`Error: ${e.message}`, created_at:new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    } finally { setSending(false); setTyping(false); }
  };

  // ── Voice Chat ─────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported in this browser. Try Chrome.'); return; }

    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
      setInput(transcript);
    };

    recognition.onend = () => { setVoiceActive(false); };
    recognition.onerror = () => { setVoiceActive(false); };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceActive(true);
  };

  // Speak response using Web Speech Synthesis
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text.slice(0, 500));
    utter.rate = 1.1;
    window.speechSynthesis.speak(utter);
  };

  // ── Dispatch (multi-agent swarm) ───────────────────────────────────────────
  const toggleDispatchAgent = (id: string) => {
    setDispatchAgentIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const runDispatch = async () => {
    if (!user || !dispatchPrompt.trim() || dispatching) return;
    setDispatching(true); setDispatchOutput('');
    try {
      const body: any = { prompt:dispatchPrompt };
      if (dispatchAgentIds.length === 1) body.agent_id = dispatchAgentIds[0];
      else if (dispatchAgentIds.length > 1) body.agent_ids = dispatchAgentIds;
      const data = await apiFetch('/dispatch/run', { method:'POST', body:JSON.stringify(body) }, user.token);
      const runId = data.run_id;
      setActiveDispatchRunId(runId);

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
    try { await apiFetch(`/dispatch/cancel/${activeDispatchRunId}`, { method:'POST' }, user.token); eventSourceRef.current?.close(); setDispatching(false); } catch {}
  };

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const createTask = async () => {
    if (!user || !newTaskTitle.trim()) return;
    try {
      const body: any = { title:newTaskTitle, priority:newTaskPriority, status:'todo' };
      if (activeProject) body.project_id = activeProject.id;
      await apiFetch('/workspace/tasks', { method:'POST', body:JSON.stringify(body) }, user.token);
      await loadTasks();
      setShowNewTask(false); setNewTaskTitle('');
    } catch (e: any) { alert(e.message); }
  };

  const cycleTaskStatus = async (t: WorkspaceTask) => {
    if (!user) return;
    const cycle: Record<string, WorkspaceTask['status']> = { todo:'in_progress', in_progress:'done', done:'todo', blocked:'todo' };
    try { await apiFetch(`/workspace/tasks/${t.id}`, { method:'PATCH', body:JSON.stringify({ status:cycle[t.status] }) }, user.token); await loadTasks(); } catch {}
  };

  // ── Schedules ──────────────────────────────────────────────────────────────
  const createSchedule = async () => {
    if (!user || !schedName.trim() || !schedPrompt.trim()) return;
    try {
      await apiFetch('/schedules', { method:'POST', body:JSON.stringify({ name:schedName, cron_expression:schedCron, prompt:schedPrompt }) }, user.token);
      await loadSchedules();
      setSchedName(''); setSchedPrompt('');
    } catch (e: any) { alert(e.message); }
  };

  const toggleSchedule = async (s: ScheduledTask) => {
    if (!user) return;
    try { await apiFetch(`/schedules/${s.id}`, { method:'PATCH', body:JSON.stringify({ enabled:s.enabled ? 0 : 1 }) }, user.token); await loadSchedules(); } catch {}
  };

  const runScheduleNow = async (s: ScheduledTask) => {
    if (!user) return;
    try { await apiFetch(`/schedules/${s.id}/run`, { method:'POST' }, user.token); alert('Triggered!'); } catch (e: any) { alert(e.message); }
  };

  // ── Custom Providers ────────────────────────────────────────────────────────
  const createCustomProvider = async () => {
    if (!user || !newProvider.name || !newProvider.base_url) return;
    try {
      await apiFetch('/providers/custom', { method:'POST', body:JSON.stringify({
        name:newProvider.name, base_url:newProvider.base_url, api_key:newProvider.api_key,
        markup:parseFloat(newProvider.markup) || 1.5, models:newProvider.models
      }) }, user.token);
      await loadCustomProviders();
      setNewProvider({ name:'', base_url:'', api_key:'', markup:'1.5', models:'' });
    } catch (e: any) { alert(e.message); }
  };

  const deleteCustomProvider = async (id: string) => {
    if (!user) return;
    try { await apiFetch(`/providers/custom/${id}`, { method:'DELETE' }, user.token); await loadCustomProviders(); } catch (e: any) { alert(e.message); }
  };

  // ── Router test ────────────────────────────────────────────────────────────
  const testRouter = async () => {
    if (!user || !routerTestPrompt.trim() || routerTesting) return;
    setRouterTesting(true); setRouterTestResult('');
    try {
      const body = { content:routerTestPrompt, model:routerTestModel };
      const data = await apiFetch('/forge/chat', { method:'POST', body:JSON.stringify(body) }, user.token);
      setRouterTestResult(data?.content || data?.result || JSON.stringify(data));
    } catch (e: any) { setRouterTestResult(`Error: ${e.message}`); }
    finally { setRouterTesting(false); }
  };

  // ── Billing upgrade ─────────────────────────────────────────────────────────
  const upgradePlan = async (plan: string) => {
    if (!user) return;
    try { await apiFetch('/billing/upgrade', { method:'POST', body:JSON.stringify({ plan }) }, user.token); await loadSubscription(); alert(`Upgraded to ${plan}!`); } catch (e: any) { alert(e.message); }
  };

  // ── Toggle agent (chat) ────────────────────────────────────────────────────
  const toggleAgent = (id: string) => {
    setActiveAgentIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pinnedProjects = projects.filter(p => p.pinned);
  const unpinnedProjects = projects.filter(p => !p.pinned);
  const filteredTasks = activeProject ? tasks.filter(t => t.project_id === activeProject.id) : tasks;
  const taskStatusColor: Record<string, string> = { todo:'#6b7280', in_progress:'#2563EB', done:'#059669', blocked:'#DC2626' };
  const taskPriorityColor: Record<string, string> = { low:'#6b7280', medium:'#D97706', high:'#DC2626' };
  const artifactTypeIcon: Record<string, string> = { code:'💻', html:'🌐', react:'⚛️', markdown:'📝', 'live-dashboard':'📊', diff:'📋', default:'📄' };
  const filteredOrModels = openRouterModels.filter(m => m.toLowerCase().includes(orSearch.toLowerCase()));
  const usagePercent = subscription ? Math.min(100, Math.round((subscription.tokens_used / (subscription.token_limit || 1)) * 100)) : 0;

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', background:'#0a0a0f', color:'#e2e8f0', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow:'hidden' }}>

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <div style={{ width:sidebarExpanded ? 260 : 60, background:'#0d0d15', borderRight:'1px solid #1e1e2e', display:'flex', flexDirection:'column', flexShrink:0, transition:'width 0.2s', overflow:'hidden' }}>
        {/* Logo + collapse */}
        <div style={{ padding:'16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1e1e2e' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
            <div style={{ width:32, height:32, background:'#7C3AED', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>⚡</div>
            {sidebarExpanded && <span style={{ fontWeight:700, fontSize:16, color:'#fff', whiteSpace:'nowrap' }}>Forge</span>}
          </div>
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:16, padding:4 }}>{sidebarExpanded ? '◀' : '▶'}</button>
        </div>

        {/* Nav tabs */}
        <div style={{ padding:'8px', borderBottom:'1px solid #1e1e2e' }}>
          {([
            { id:'workspace', icon:'💬', label:'Workspace' },
            { id:'router', icon:'🔀', label:'ForgeRouter' },
            { id:'billing', icon:'💳', label:'Billing' },
            { id:'platforms', icon:'🌐', label:'Platforms' },
            { id:'settings', icon:'⚙️', label:'Settings' },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setMainTab(tab.id)} title={tab.label} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:mainTab===tab.id ? '#1a1a2e' : 'transparent', border:'none', borderRadius:6, color:mainTab===tab.id ? '#a78bfa' : '#6b7280', cursor:'pointer', fontSize:13, fontWeight:mainTab===tab.id ? 600 : 400, marginBottom:2, justifyContent:sidebarExpanded ? 'flex-start' : 'center' }}>
              <span style={{ fontSize:16 }}>{tab.icon}</span>
              {sidebarExpanded && tab.label}
            </button>
          ))}
        </div>

        {/* Workspace sidebar content */}
        {mainTab === 'workspace' && sidebarExpanded && (
          <>
            <div style={{ padding:'10px 10px 0' }}>
              <button onClick={newThread} style={{ width:'100%', padding:'10px', background:'#1a1a2e', border:'1px solid #2d2d44', borderRadius:8, color:'#a78bfa', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                <span>✏️</span>New conversation
              </button>
            </div>

            {pinnedProjects.length > 0 && (
              <div style={{ padding:'16px 12px 4px' }}>
                <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>Pinned</p>
                {pinnedProjects.map(p => (
                  <div key={p.id} onClick={() => selectProject(p)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:6, cursor:'pointer', background:activeProject?.id===p.id ? '#1a1a2e' : 'transparent', marginBottom:2 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                    <span style={{ fontSize:13, color:'#cbd5e1', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                    <button onClick={e => { e.stopPropagation(); togglePin(p); }} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:12, padding:2 }}>📌</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding:'12px 12px 4px', flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>{activeProject ? activeProject.name : 'Recent'}</p>
              <div style={{ flex:1, overflowY:'auto' }}>
                {threads.slice(0, 30).map(t => (
                  <div key={t.id} onClick={() => selectThread(t)} style={{ padding:'7px 8px', borderRadius:6, cursor:'pointer', marginBottom:1, background:activeThread?.id===t.id ? '#1a1a2e' : 'transparent' }}>
                    <p style={{ margin:0, fontSize:13, color:activeThread?.id===t.id ? '#a78bfa' : '#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</p>
                    <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
                {threads.length === 0 && <p style={{ color:'#4b5563', fontSize:12, padding:'4px 8px' }}>No conversations yet</p>}
              </div>
            </div>

            <div style={{ padding:'0 12px 8px', borderTop:'1px solid #1e1e2e' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0 6px' }}>
                <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:0 }}>Projects</p>
                <button onClick={() => setShowNewProject(true)} style={{ background:'none', border:'none', color:'#7C3AED', cursor:'pointer', fontSize:16, lineHeight:1 }}>+</button>
              </div>
              {unpinnedProjects.slice(0, 8).map(p => (
                <div key={p.id} onClick={() => selectProject(p)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6, cursor:'pointer', background:activeProject?.id===p.id ? '#1a1a2e' : 'transparent', marginBottom:1 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'#94a3b8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                  <button onClick={e => { e.stopPropagation(); togglePin(p); }} style={{ background:'none', border:'none', color:'transparent', cursor:'pointer', fontSize:11, padding:2 }} title="Pin">📌</button>
                </div>
              ))}
              {projects.length === 0 && <p style={{ color:'#4b5563', fontSize:12, padding:'2px 8px' }}>No projects yet</p>}
            </div>
          </>
        )}

        {/* User profile */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid #1e1e2e', display:'flex', alignItems:'center', gap:8, marginTop:'auto' }}>
          <div style={{ width:32, height:32, background:'#1a1a2e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>👤</div>
          {sidebarExpanded && (
            <>
              <div style={{ flex:1, overflow:'hidden' }}>
                <p style={{ margin:0, fontSize:13, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name || user.email}</p>
                {subscription && <p style={{ margin:0, fontSize:11, color:'#7C3AED' }}>{subscription.plan} plan</p>}
              </div>
              <button onClick={handleLogout} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:12 }}>↗</button>
            </>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── WORKSPACE TAB ─────────────────────────────────────────────────── */}
        {mainTab === 'workspace' && (
          <>
            {/* Top bar */}
            <div style={{ padding:'0 20px', height:52, background:'#0d0d15', borderBottom:'1px solid #1e1e2e', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
              <div style={{ flex:1, overflow:'hidden' }}>
                <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {activeThread ? activeThread.title : activeProject ? activeProject.name : 'Forge Workspace'}
                </h2>
              </div>

              {/* Sketch toggle */}
              <button onClick={() => setSketchMode(!sketchMode)} title="Live Preview" style={{ padding:'5px 10px', background:sketchMode ? '#1e1e2e' : 'transparent', border:`1px solid ${sketchMode ? '#7C3AED' : '#2d2d44'}`, borderRadius:6, color:sketchMode ? '#a78bfa' : '#6b7280', cursor:'pointer', fontSize:12 }}>✏️ Sketch</button>

              {/* Multi-response toggle */}
              <button onClick={() => setMultiResponse(!multiResponse)} title="Multiple responses" style={{ padding:'5px 10px', background:multiResponse ? '#1e1e2e' : 'transparent', border:`1px solid ${multiResponse ? '#D97706' : '#2d2d44'}`, borderRadius:6, color:multiResponse ? '#D97706' : '#6b7280', cursor:'pointer', fontSize:12 }}>⚡ Multi</button>

              {/* Model selector — shows all models; marks ones with no API key */}
              {(() => {
                const providerForId = (id: string) => {
                  if (['forge-ultra','forge-pro','forge-flash','forge-code'].includes(id) || id.startsWith('claude')) return 'anthropic';
                  if (['forge-gpt'].includes(id) || id.startsWith('gpt') || id.startsWith('o3')) return 'openai';
                  if (['forge-gemini'].includes(id) || id.startsWith('gemini')) return 'gemini';
                  if (id.startsWith('llama') || id.startsWith('mixtral') || id === 'forge-fast') return 'groq';
                  if (id.startsWith('mistral')) return 'mistral';
                  return null;
                };
                const hasKey = (id: string) => { const p = providerForId(id); return !p || !!apiKeys[p]; };
                return (
                  <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ background:'#1a1a2e', border:'1px solid #2d2d44', borderRadius:8, color:'#a78bfa', padding:'6px 10px', fontSize:12, cursor:'pointer' }}>
                    <optgroup label="Forge (with markup)">
                      {FORGE_MODELS.map(m => <option key={m.id} value={m.id}>{hasKey(m.id) ? '' : '⚠ '}{m.label}</option>)}
                    </optgroup>
                    {DIRECT_MODELS.map(grp => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.models.map(m => <option key={m.id} value={m.id}>{hasKey(m.id) ? '' : '⚠ '}{m.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                );
              })()}

              <button onClick={() => setRightExpanded(!rightExpanded)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:14 }}>{rightExpanded ? '▶' : '◀'}</button>
            </div>

            <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
              {/* Messages + sketch */}
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                {/* Sketch / live preview panel */}
                {sketchMode && (
                  <div style={{ height:'40%', borderBottom:'1px solid #1e1e2e', display:'flex', overflow:'hidden' }}>
                    <div style={{ flex:1, padding:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:12, color:'#a78bfa', fontWeight:600 }}>✏️ Live Preview</span>
                        {artifacts.length > 0 && (
                          <select onChange={e => { const a = artifacts.find(x => x.id === e.target.value); if (a) { setSketchArtifact(a); setPreviewCode(a.content); } }} style={{ flex:1, padding:'4px 8px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:12 }}>
                            <option value="">Select artifact...</option>
                            {artifacts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                          </select>
                        )}
                      </div>
                      {sketchArtifact?.type === 'html' || sketchArtifact?.type === 'react' ? (
                        <iframe srcDoc={previewCode} style={{ flex:1, border:'1px solid #1e1e2e', borderRadius:8, background:'#fff' }} title="Live Preview" />
                      ) : (
                        <textarea value={previewCode} onChange={e => setPreviewCode(e.target.value)} style={{ flex:1, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:12, padding:10, resize:'none', fontFamily:'monospace' }} placeholder="Artifact preview will appear here. Ask AI to create HTML, React, or code artifacts." />
                      )}
                    </div>
                  </div>
                )}

                {/* Messages canvas */}
                <div style={{ flex:1, overflowY:'auto', padding:'24px 32px', display:'flex', flexDirection:'column', gap:16 }}>
                  {messages.length === 0 && !activeThread && (
                    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                      <div style={{ fontSize:48 }}>⚡</div>
                      <h2 style={{ color:'#e2e8f0', margin:0, fontSize:24 }}>What do you want to build?</h2>
                      <p style={{ color:'#4b5563', margin:0, textAlign:'center', maxWidth:400 }}>Start a conversation, pick a project, or dispatch an agent to work on your next big idea.</p>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginTop:8 }}>
                        {['Write a React component','Research a topic','Build an API endpoint','Create a deployment plan'].map(s => (
                          <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }} style={{ padding:'8px 14px', background:'#1a1a2e', border:'1px solid #2d2d44', borderRadius:20, color:'#94a3b8', fontSize:13, cursor:'pointer' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={m.id || i} style={{ display:'flex', gap:12, alignItems:'flex-start', flexDirection:m.role==='user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:m.role==='user' ? '#7C3AED' : '#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                        {m.role==='user' ? '👤' : '⚡'}
                      </div>
                      <div style={{ maxWidth:'75%', padding:'12px 16px', borderRadius:m.role==='user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background:m.role==='user' ? '#1a1a2e' : '#111118', border:'1px solid #1e1e2e', lineHeight:1.6 }}>
                        <p style={{ margin:0, fontSize:14, color:'#e2e8f0', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{m.content}</p>
                        {m.model && <p style={{ margin:'6px 0 0', fontSize:11, color:'#4b5563' }}>{m.model}</p>}
                        {m.role === 'assistant' && (
                          <button onClick={() => speakText(m.content)} style={{ marginTop:4, background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:11 }} title="Read aloud">🔊</button>
                        )}
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

                  {/* Multi-response cards */}
                  {multiResponses.length > 0 && (
                    <div>
                      <p style={{ color:'#D97706', fontSize:12, fontWeight:600, margin:'0 0 10px' }}>⚡ Multiple Responses</p>
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        {multiResponses.map((r, i) => (
                          <div key={i} style={{ flex:'1 1 250px', minWidth:200, padding:'12px 14px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:12 }}>
                            <p style={{ margin:'0 0 6px', fontSize:11, color:'#a78bfa', fontWeight:600 }}>{r.model}</p>
                            <p style={{ margin:0, fontSize:13, color:'#e2e8f0', whiteSpace:'pre-wrap', lineHeight:1.5 }}>{r.content.slice(0, 400)}{r.content.length > 400 ? '...' : ''}</p>
                            <button onClick={() => speakText(r.content)} style={{ marginTop:6, background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:11 }}>🔊</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div style={{ padding:'12px 24px 16px', background:'#0d0d15', borderTop:'1px solid #1e1e2e' }}>
                  <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                    {agents.filter(a => a.enabled).map(a => (
                      <button key={a.id} onClick={() => toggleAgent(a.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, border:activeAgentIds.includes(a.id) ? `1px solid ${a.color}` : '1px solid #2d2d44', background:activeAgentIds.includes(a.id) ? `${a.color}22` : 'transparent', color:activeAgentIds.includes(a.id) ? a.color : '#6b7280', cursor:'pointer', fontSize:12, fontWeight:500, transition:'all 0.15s' }}>
                        <span>{a.icon}</span><span>{a.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Voice indicator */}
                  {voiceActive && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 12px', background:'#1a0a2e', border:'1px solid #7C3AED', borderRadius:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', animation:'pulse 1s infinite' }} />
                      <span style={{ fontSize:12, color:'#a78bfa' }}>Listening… {voiceTranscript ? `"${voiceTranscript.slice(0, 60)}..."` : ''}</span>
                    </div>
                  )}

                  <div style={{ position:'relative', background:'#111118', border:'1px solid #2d2d44', borderRadius:12, overflow:'hidden' }}>
                    <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={activeThread ? 'Message... (Shift+Enter for newline)' : 'Start a conversation...'} rows={3} style={{ width:'100%', padding:'14px 16px 44px', background:'transparent', border:'none', color:'#e2e8f0', fontSize:14, resize:'none', outline:'none', lineHeight:1.6, boxSizing:'border-box' }} />
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        {/* Voice button */}
                        <button onClick={toggleVoice} title={voiceActive ? 'Stop recording' : 'Voice input'} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:voiceActive ? '#7C3AED22' : 'transparent', border:`1px solid ${voiceActive ? '#7C3AED' : '#2d2d44'}`, borderRadius:6, color:voiceActive ? '#a78bfa' : '#6b7280', cursor:'pointer', fontSize:11 }}>🎤 {voiceActive ? 'Stop' : 'Voice'}</button>
                        <button onClick={() => { setRightTab('artifacts'); setRightExpanded(true); }} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'transparent', border:'1px solid #2d2d44', borderRadius:6, color:'#6b7280', cursor:'pointer', fontSize:11 }}>📄 Artifacts</button>
                        <button onClick={() => { setRightTab('dispatch'); setRightExpanded(true); }} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'transparent', border:'1px solid #2d2d44', borderRadius:6, color:'#6b7280', cursor:'pointer', fontSize:11 }}>🚀 Dispatch</button>
                        <button onClick={() => { setShowNewTask(true); }} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'transparent', border:'1px solid #2d2d44', borderRadius:6, color:'#6b7280', cursor:'pointer', fontSize:11 }}>✅ Task</button>
                      </div>
                      <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ width:32, height:32, background:input.trim() && !sending ? '#7C3AED' : '#1a1a2e', border:'none', borderRadius:8, color:'#fff', cursor:input.trim() && !sending ? 'pointer' : 'default', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}>
                        {sending ? '⏳' : '↑'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel */}
              {rightExpanded && (
                <div style={{ width:340, background:'#0d0d15', borderLeft:'1px solid #1e1e2e', display:'flex', flexDirection:'column', flexShrink:0 }}>
                  <div style={{ display:'flex', borderBottom:'1px solid #1e1e2e', padding:'0 4px' }}>
                    {(['artifacts','tasks','schedule','dispatch'] as const).map(tab => (
                      <button key={tab} onClick={() => setRightTab(tab)} style={{ flex:1, padding:'12px 4px', background:'none', border:'none', borderBottom:rightTab===tab ? '2px solid #7C3AED' : '2px solid transparent', color:rightTab===tab ? '#a78bfa' : '#4b5563', cursor:'pointer', fontSize:11, fontWeight:500, textTransform:'capitalize' }}>{tab}</button>
                    ))}
                  </div>

                  <div style={{ flex:1, overflowY:'auto', padding:12 }}>
                    {/* ARTIFACTS */}
                    {rightTab==='artifacts' && (
                      <div>
                        <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Artifacts ({artifacts.length})</p>
                        {artifacts.length===0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', marginTop:40 }}>No artifacts yet.<br/>Ask the AI to create code, HTML, or documents.</p>}
                        {artifacts.slice(0,20).map(a => (
                          <div key={a.id} onClick={() => setViewArtifact(a)} style={{ padding:'10px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, marginBottom:6, cursor:'pointer' }}>
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

                    {/* TASKS */}
                    {rightTab==='tasks' && (
                      <div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                          <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0 }}>Tasks ({filteredTasks.length})</p>
                          <button onClick={() => setShowNewTask(true)} style={{ background:'#7C3AED', border:'none', borderRadius:6, color:'#fff', padding:'4px 8px', fontSize:11, cursor:'pointer' }}>+ New</button>
                        </div>
                        {filteredTasks.length===0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', marginTop:40 }}>No tasks yet.</p>}
                        {filteredTasks.map(t => (
                          <div key={t.id} onClick={() => cycleTaskStatus(t)} style={{ padding:'10px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, marginBottom:6, cursor:'pointer' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:taskStatusColor[t.status], flexShrink:0 }} />
                              <span style={{ fontSize:13, color:'#e2e8f0', flex:1 }}>{t.title}</span>
                              <span style={{ fontSize:10, color:taskPriorityColor[t.priority] }}>{t.priority}</span>
                            </div>
                            <p style={{ margin:'4px 0 0 16px', fontSize:11, color:'#4b5563' }}>{t.status.replace('_',' ')}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SCHEDULE */}
                    {rightTab==='schedule' && (
                      <div>
                        <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Scheduled Tasks</p>
                        <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, padding:12, marginBottom:12 }}>
                          <p style={{ margin:'0 0 8px', fontSize:12, color:'#94a3b8', fontWeight:500 }}>New Schedule</p>
                          <input placeholder="Name" value={schedName} onChange={e => setSchedName(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:6, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:12, boxSizing:'border-box' }} />
                          <input placeholder="Cron (e.g. 0 9 * * 1-5)" value={schedCron} onChange={e => setSchedCron(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:6, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:12, boxSizing:'border-box' }} />
                          <textarea placeholder="Prompt to run..." value={schedPrompt} onChange={e => setSchedPrompt(e.target.value)} rows={2} style={{ width:'100%', padding:'8px', marginBottom:8, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:12, resize:'none', boxSizing:'border-box' }} />
                          <button onClick={createSchedule} style={{ width:'100%', padding:'8px', background:'#7C3AED', border:'none', borderRadius:6, color:'#fff', fontSize:12, cursor:'pointer' }}>Create Schedule</button>
                        </div>
                        {schedules.map(s => (
                          <div key={s.id} style={{ padding:'10px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, marginBottom:6 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                              <span style={{ fontSize:11, color:s.enabled ? '#059669' : '#4b5563' }}>●</span>
                              <span style={{ fontSize:13, color:'#e2e8f0', flex:1 }}>{s.name}</span>
                              <button onClick={() => toggleSchedule(s)} style={{ background:'none', border:'none', color:s.enabled ? '#059669' : '#4b5563', cursor:'pointer', fontSize:11 }}>{s.enabled ? 'ON' : 'OFF'}</button>
                              <button onClick={() => runScheduleNow(s)} style={{ background:'#1a1a2e', border:'1px solid #2d2d44', borderRadius:4, color:'#6b7280', cursor:'pointer', fontSize:10, padding:'2px 6px' }}>▶</button>
                            </div>
                            <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{s.cron_expression}</p>
                            {s.last_run && <p style={{ margin:'2px 0 0', fontSize:11, color:'#4b5563' }}>Last: {new Date(s.last_run).toLocaleString()}</p>}
                          </div>
                        ))}
                        {schedules.length===0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', marginTop:16 }}>No scheduled tasks.</p>}
                      </div>
                    )}

                    {/* DISPATCH — Swarm */}
                    {rightTab==='dispatch' && (
                      <div>
                        <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Agent Dispatch</p>
                        <p style={{ color:'#6b7280', fontSize:11, margin:'0 0 8px' }}>Select agents for swarm (multi-select = parallel dispatch)</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                          {agents.filter(a => a.enabled).map(a => (
                            <button key={a.id} onClick={() => toggleDispatchAgent(a.id)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, border:dispatchAgentIds.includes(a.id) ? `1px solid ${a.color}` : '1px solid #2d2d44', background:dispatchAgentIds.includes(a.id) ? `${a.color}22` : 'transparent', color:dispatchAgentIds.includes(a.id) ? a.color : '#6b7280', cursor:'pointer', fontSize:12 }}>
                              <span>{a.icon}</span><span>{a.name}</span>
                            </button>
                          ))}
                        </div>
                        <textarea placeholder="Describe the task for the agent(s)..." value={dispatchPrompt} onChange={e => setDispatchPrompt(e.target.value)} rows={4} style={{ width:'100%', padding:'10px', marginBottom:8, background:'#111118', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13, resize:'none', boxSizing:'border-box' }} />
                        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                          <button onClick={runDispatch} disabled={dispatching || !dispatchPrompt.trim()} style={{ flex:1, padding:'10px', background:dispatching ? '#1a1a2e' : '#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:dispatching ? 'default' : 'pointer' }}>
                            {dispatching ? '⚡ Running...' : dispatchAgentIds.length > 1 ? `🚀 Dispatch Swarm (${dispatchAgentIds.length})` : '🚀 Dispatch'}
                          </button>
                          {dispatching && <button onClick={cancelDispatch} style={{ padding:'10px 12px', background:'#1a1a2e', border:'1px solid #DC2626', borderRadius:8, color:'#DC2626', fontSize:12, cursor:'pointer' }}>✕</button>}
                        </div>
                        {dispatchOutput && (
                          <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, padding:12, marginBottom:12 }}>
                            <p style={{ margin:'0 0 6px', fontSize:11, color:'#4b5563', fontWeight:600 }}>OUTPUT</p>
                            <p style={{ margin:0, fontSize:13, color:'#e2e8f0', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{dispatchOutput}</p>
                          </div>
                        )}
                        {dispatchRuns.length > 0 && (
                          <div>
                            <p style={{ color:'#4b5563', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 8px' }}>History</p>
                            {dispatchRuns.slice(0,10).map(r => (
                              <div key={r.id} style={{ padding:'8px 10px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:6, marginBottom:4 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                                  <span style={{ fontSize:10, color:r.status==='completed' ? '#059669' : r.status==='running' ? '#D97706' : '#DC2626' }}>●</span>
                                  <span style={{ fontSize:12, color:'#94a3b8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.prompt.slice(0,50)}{r.prompt.length > 50 ? '...' : ''}</span>
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
            </div>
          </>
        )}

        {/* ── FORGEROUTER TAB ──────────────────────────────────────────────── */}
        {mainTab === 'router' && (
          <div style={{ flex:1, overflowY:'auto', padding:32 }}>
            <div style={{ maxWidth:900, margin:'0 auto' }}>
              <h2 style={{ color:'#fff', margin:'0 0 4px', fontSize:22 }}>⚡ ForgeRouter</h2>
              <p style={{ color:'#6b7280', margin:'0 0 24px', fontSize:14 }}>Route prompts across 400+ AI models with configurable markup</p>

              <div style={{ display:'flex', gap:8, marginBottom:24 }}>
                {(['forge','direct','openrouter','custom'] as const).map(t => (
                  <button key={t} onClick={() => setRouterTab(t)} style={{ padding:'8px 16px', background:routerTab===t ? '#7C3AED' : '#111118', border:`1px solid ${routerTab===t ? '#7C3AED' : '#1e1e2e'}`, borderRadius:8, color:routerTab===t ? '#fff' : '#6b7280', cursor:'pointer', fontSize:13, fontWeight:500, textTransform:'capitalize' }}>{t === 'openrouter' ? 'OpenRouter' : t === 'forge' ? '⚡ Forge Models' : t}</button>
                ))}
              </div>

              {/* Forge Models */}
              {routerTab==='forge' && (
                <div>
                  <p style={{ color:'#6b7280', fontSize:13, margin:'0 0 16px' }}>Forge models are pre-configured with markup multipliers for resale. Use these as your product's branded AI.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12, marginBottom:24 }}>
                    {FORGE_MODELS.map(m => (
                      <div key={m.id} style={{ padding:'16px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:12 }}>
                        <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:600, color:'#a78bfa' }}>{m.label}</p>
                        <p style={{ margin:'0 0 8px', fontSize:12, color:'#6b7280' }}>{m.desc}</p>
                        <p style={{ margin:0, fontSize:11, color:'#4b5563', fontFamily:'monospace' }}>{m.id}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:12, padding:20 }}>
                    <p style={{ color:'#94a3b8', fontSize:13, fontWeight:600, margin:'0 0 12px' }}>Test a Forge Model</p>
                    <select value={routerTestModel} onChange={e => setRouterTestModel(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:8, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13 }}>
                      {FORGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                    <textarea placeholder="Enter a test prompt..." value={routerTestPrompt} onChange={e => setRouterTestPrompt(e.target.value)} rows={3} style={{ width:'100%', padding:'10px', marginBottom:8, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13, resize:'none', boxSizing:'border-box' }} />
                    <button onClick={testRouter} disabled={routerTesting || !routerTestPrompt.trim()} style={{ padding:'10px 20px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer', opacity:routerTesting ? 0.7 : 1 }}>{routerTesting ? 'Testing...' : 'Test'}</button>
                    {routerTestResult && <div style={{ marginTop:12, padding:'12px', background:'#0a0a0f', borderRadius:8, border:'1px solid #1e1e2e' }}><p style={{ margin:0, fontSize:13, color:'#e2e8f0', whiteSpace:'pre-wrap' }}>{routerTestResult}</p></div>}
                  </div>
                </div>
              )}

              {/* Direct Models */}
              {routerTab==='direct' && (
                <div>
                  <p style={{ color:'#6b7280', fontSize:13, margin:'0 0 16px' }}>Direct access to provider models (no markup). Requires your API key in Settings.</p>
                  {DIRECT_MODELS.map(grp => (
                    <div key={grp.group} style={{ marginBottom:20 }}>
                      <p style={{ color:'#94a3b8', fontSize:12, fontWeight:600, margin:'0 0 10px', textTransform:'uppercase' }}>{grp.group}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8 }}>
                        {grp.models.map(m => (
                          <div key={m.id} style={{ padding:'12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8 }}>
                            <p style={{ margin:'0 0 4px', fontSize:14, color:'#e2e8f0', fontWeight:500 }}>{m.label}</p>
                            <p style={{ margin:0, fontSize:11, color:'#4b5563', fontFamily:'monospace' }}>{m.id}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* OpenRouter */}
              {routerTab==='openrouter' && (
                <div>
                  <p style={{ color:'#6b7280', fontSize:13, margin:'0 0 12px' }}>400+ models via OpenRouter. Add your OpenRouter API key in Settings.</p>
                  <input placeholder="Search models..." value={orSearch} onChange={e => setOrSearch(e.target.value)} style={{ width:'100%', padding:'10px 14px', marginBottom:16, background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13, boxSizing:'border-box' }} />
                  {openRouterModels.length === 0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', padding:40 }}>Add OpenRouter API key in Settings to load models.</p>}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:8 }}>
                    {filteredOrModels.slice(0,50).map(m => (
                      <div key={m} style={{ padding:'10px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8 }}>
                        <p style={{ margin:0, fontSize:13, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m}</p>
                      </div>
                    ))}
                  </div>
                  {filteredOrModels.length > 50 && <p style={{ color:'#4b5563', fontSize:12, textAlign:'center', marginTop:12 }}>Showing 50 of {filteredOrModels.length} results. Refine search to see more.</p>}
                </div>
              )}

              {/* Custom Providers */}
              {routerTab==='custom' && (
                <div>
                  <p style={{ color:'#6b7280', fontSize:13, margin:'0 0 16px' }}>Add any OpenAI-compatible endpoint with custom markup multiplier.</p>
                  <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:12, padding:20, marginBottom:20 }}>
                    <p style={{ color:'#94a3b8', fontSize:13, fontWeight:600, margin:'0 0 12px' }}>Add Provider</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                      <input placeholder="Provider name" value={newProvider.name} onChange={e => setNewProvider(p => ({ ...p, name:e.target.value }))} style={{ padding:'8px 10px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13 }} />
                      <input placeholder="Base URL (https://...)" value={newProvider.base_url} onChange={e => setNewProvider(p => ({ ...p, base_url:e.target.value }))} style={{ padding:'8px 10px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13 }} />
                      <input placeholder="API Key" type="password" value={newProvider.api_key} onChange={e => setNewProvider(p => ({ ...p, api_key:e.target.value }))} style={{ padding:'8px 10px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13 }} />
                      <input placeholder="Markup multiplier (e.g. 1.5)" value={newProvider.markup} onChange={e => setNewProvider(p => ({ ...p, markup:e.target.value }))} style={{ padding:'8px 10px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13 }} />
                    </div>
                    <input placeholder="Model IDs (comma-separated)" value={newProvider.models} onChange={e => setNewProvider(p => ({ ...p, models:e.target.value }))} style={{ width:'100%', padding:'8px 10px', marginBottom:10, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#e2e8f0', fontSize:13, boxSizing:'border-box' }} />
                    <button onClick={createCustomProvider} style={{ padding:'10px 20px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>Add Provider</button>
                  </div>

                  {customProviders.length===0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', padding:24 }}>No custom providers yet.</p>}
                  {customProviders.map(cp => (
                    <div key={cp.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:10, marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{cp.name}</p>
                        <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>{cp.base_url} · {cp.markup}× markup</p>
                      </div>
                      <button onClick={() => deleteCustomProvider(cp.id)} style={{ background:'none', border:'1px solid #DC2626', borderRadius:6, color:'#DC2626', cursor:'pointer', fontSize:12, padding:'4px 8px' }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BILLING TAB ───────────────────────────────────────────────────── */}
        {mainTab === 'billing' && (
          <div style={{ flex:1, overflowY:'auto', padding:32 }}>
            <div style={{ maxWidth:800, margin:'0 auto' }}>
              <h2 style={{ color:'#fff', margin:'0 0 4px', fontSize:22 }}>💳 Billing</h2>
              <p style={{ color:'#6b7280', margin:'0 0 24px', fontSize:14 }}>Manage your plan, usage, and billing</p>

              {/* Current plan */}
              {subscription && (
                <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:16, padding:24, marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <div>
                      <p style={{ margin:'0 0 4px', fontSize:18, fontWeight:700, color:'#a78bfa', textTransform:'capitalize' }}>{subscription.plan} Plan</p>
                      {subscription.period_end && <p style={{ margin:0, fontSize:12, color:'#4b5563' }}>Renews {new Date(subscription.period_end).toLocaleDateString()}</p>}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ margin:0, fontSize:14, color:'#e2e8f0' }}>{(subscription.tokens_used ?? 0).toLocaleString()} / {(subscription.token_limit ?? 10000).toLocaleString()} tokens</p>
                      <p style={{ margin:'4px 0 0', fontSize:12, color:'#4b5563' }}>{usagePercent}% used</p>
                    </div>
                  </div>
                  <div style={{ background:'#0a0a0f', borderRadius:8, height:8, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:usagePercent > 80 ? '#DC2626' : '#7C3AED', width:`${usagePercent}%`, transition:'width 0.3s', borderRadius:8 }} />
                  </div>
                </div>
              )}

              {/* Plans */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
                {[
                  { plan:'free', label:'Free', price:'$0/mo', tokens:'100K tokens', color:'#4b5563', features:['3 models','Basic agents','Community support'] },
                  { plan:'starter', label:'Starter', price:'$19/mo', tokens:'2M tokens', color:'#2563EB', features:['All models','ForgeRouter','Email support'] },
                  { plan:'pro', label:'Pro', price:'$49/mo', tokens:'10M tokens', color:'#7C3AED', features:['All models','Agent swarm','Priority support','Custom providers'] },
                  { plan:'enterprise', label:'Enterprise', price:'Custom', tokens:'Unlimited', color:'#D97706', features:['Everything in Pro','SLA','Dedicated infra','White-label'] },
                ].map(p => (
                  <div key={p.plan} style={{ padding:'20px', background:'#111118', border:`1px solid ${subscription?.plan===p.plan ? p.color : '#1e1e2e'}`, borderRadius:14 }}>
                    <p style={{ margin:'0 0 2px', fontSize:16, fontWeight:700, color:p.color }}>{p.label}</p>
                    <p style={{ margin:'0 0 2px', fontSize:20, fontWeight:800, color:'#e2e8f0' }}>{p.price}</p>
                    <p style={{ margin:'0 0 12px', fontSize:12, color:'#6b7280' }}>{p.tokens}</p>
                    {p.features.map(f => <p key={f} style={{ margin:'0 0 4px', fontSize:12, color:'#94a3b8' }}>✓ {f}</p>)}
                    {subscription?.plan !== p.plan && p.plan !== 'enterprise' && (
                      <button onClick={() => upgradePlan(p.plan)} style={{ marginTop:12, width:'100%', padding:'8px', background:p.color, border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>
                        {subscription && ['free','starter','pro'].indexOf(p.plan) > ['free','starter','pro'].indexOf(subscription.plan) ? 'Upgrade' : 'Switch'}
                      </button>
                    )}
                    {subscription?.plan === p.plan && <p style={{ marginTop:12, fontSize:12, color:p.color, textAlign:'center' }}>✓ Current plan</p>}
                    {p.plan === 'enterprise' && <button onClick={() => window.open('mailto:sales@forge.ai')} style={{ marginTop:12, width:'100%', padding:'8px', background:'transparent', border:`1px solid ${p.color}`, borderRadius:8, color:p.color, fontSize:13, cursor:'pointer' }}>Contact Sales</button>}
                  </div>
                ))}
              </div>

              {/* AI Tools & Services */}
              <h3 style={{ color:'#94a3b8', fontSize:15, margin:'0 0 4px' }}>AI Tools & Services</h3>
              <p style={{ color:'#4b5563', fontSize:13, margin:'0 0 16px' }}>Connect your existing subscriptions or API keys to use Claude, OpenAI, and Cursor inside Forge.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:28 }}>
                {([
                  {
                    id:'claude', icon:'🟣', name:'Claude (Anthropic)', color:'#7C3AED', apiKeyId:'anthropic',
                    loginUrl:'https://claude.ai', signupUrl:'https://claude.ai/upgrade',
                    plans:[
                      { label:'Free', price:'$0/mo', desc:'Web access, limited messages' },
                      { label:'Pro', price:'$20/mo', desc:'5× usage, priority, longer context' },
                      { label:'Team', price:'$25/mo', desc:'Collaboration, admin controls' },
                    ],
                  },
                  {
                    id:'openai', icon:'🟢', name:'OpenAI / ChatGPT', color:'#059669', apiKeyId:'openai',
                    loginUrl:'https://chat.openai.com', signupUrl:'https://chat.openai.com/upgrade',
                    plans:[
                      { label:'Free', price:'$0/mo', desc:'GPT-4o mini, limited GPT-4o' },
                      { label:'Plus', price:'$20/mo', desc:'Full GPT-4o, DALL·E, browsing' },
                      { label:'Team', price:'$25/mo', desc:'Workspace, admin, more messages' },
                    ],
                  },
                  {
                    id:'cursor', icon:'🔵', name:'Cursor', color:'#2563EB', apiKeyId:'',
                    loginUrl:'https://cursor.sh', signupUrl:'https://cursor.sh/pricing',
                    plans:[
                      { label:'Free', price:'$0/mo', desc:'2000 completions/mo' },
                      { label:'Pro', price:'$20/mo', desc:'Unlimited, GPT-4, Claude in editor' },
                      { label:'Business', price:'$40/mo', desc:'SSO, analytics, team admin' },
                    ],
                  },
                ] as const).map(service => {
                  const creds = serviceCreds[service.id];
                  const expanded = serviceExpanded[service.id];
                  const hasApiKey = service.apiKeyId && apiKeys[service.apiKeyId];
                  return (
                    <div key={service.id} style={{ background:'#111118', border:`1px solid ${creds.connected ? service.color : '#1e1e2e'}`, borderRadius:14, overflow:'hidden' }}>
                      {/* Header */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid #1e1e2e', cursor:'pointer' }} onClick={() => setServiceExpanded(p => ({ ...p, [service.id]: !expanded }))}>
                        <span style={{ fontSize:20 }}>{service.icon}</span>
                        <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#e2e8f0' }}>{service.name}</p>
                        {creds.connected && <span style={{ fontSize:11, color:'#059669', background:'#05966922', padding:'2px 8px', borderRadius:20 }}>✓ Connected</span>}
                        {hasApiKey && !creds.connected && <span style={{ fontSize:11, color:'#059669', background:'#05966922', padding:'2px 8px', borderRadius:20 }}>✓ API key saved</span>}
                        <span style={{ marginLeft:'auto', color:'#4b5563', fontSize:14 }}>{expanded ? '▲' : '▼'}</span>
                      </div>

                      {/* Plans row */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', borderBottom: expanded ? '1px solid #1e1e2e' : 'none' }}>
                        {service.plans.map((plan, i) => (
                          <div key={plan.label} style={{ padding:'14px 16px', borderRight: i < 2 ? '1px solid #1e1e2e' : 'none' }}>
                            <p style={{ margin:'0 0 1px', fontSize:13, fontWeight:600, color:service.color }}>{plan.label}</p>
                            <p style={{ margin:'0 0 4px', fontSize:17, fontWeight:800, color:'#e2e8f0' }}>{plan.price}</p>
                            <p style={{ margin:'0 0 10px', fontSize:11, color:'#6b7280', lineHeight:1.4 }}>{plan.desc}</p>
                            <button onClick={() => window.open(plan.price === '$0/mo' ? service.loginUrl : service.signupUrl, '_blank')} style={{ padding:'5px 12px', background:'transparent', border:`1px solid ${service.color}`, borderRadius:8, color:service.color, fontSize:11, cursor:'pointer', fontWeight:500 }}>
                              {plan.price === '$0/mo' ? 'Get started →' : 'Subscribe →'}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Expanded: login form + API key */}
                      {expanded && (
                        <div style={{ padding:'18px 18px 16px', display:'flex', flexDirection:'column', gap:14 }}>
                          {/* Subscription login */}
                          <div>
                            <p style={{ margin:'0 0 10px', fontSize:12, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Sign in with your {service.name} account</p>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                              <input
                                placeholder="Email address"
                                type="email"
                                value={creds.email}
                                onChange={e => setServiceCreds(p => ({ ...p, [service.id]: { ...p[service.id], email: e.target.value } }))}
                                style={{ padding:'9px 12px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13 }}
                              />
                              <input
                                placeholder="Password"
                                type="password"
                                value={creds.password}
                                onChange={e => setServiceCreds(p => ({ ...p, [service.id]: { ...p[service.id], password: e.target.value } }))}
                                style={{ padding:'9px 12px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13 }}
                              />
                            </div>
                            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                              <button
                                onClick={() => {
                                  if (creds.email && creds.password) {
                                    setServiceCreds(p => ({ ...p, [service.id]: { ...p[service.id], connected: true } }));
                                    localStorage.setItem(`forge_svc_${service.id}`, JSON.stringify({ email: creds.email, connected: true }));
                                  }
                                }}
                                style={{ padding:'8px 18px', background:service.color, border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer', fontWeight:600 }}
                              >
                                {creds.connected ? '✓ Connected' : 'Connect Account'}
                              </button>
                              {creds.connected && (
                                <button
                                  onClick={() => { setServiceCreds(p => ({ ...p, [service.id]: { email:'', password:'', connected:false } })); localStorage.removeItem(`forge_svc_${service.id}`); }}
                                  style={{ padding:'8px 12px', background:'transparent', border:'1px solid #DC2626', borderRadius:8, color:'#DC2626', fontSize:12, cursor:'pointer' }}
                                >
                                  Disconnect
                                </button>
                              )}
                              <span style={{ fontSize:11, color:'#4b5563' }}>Credentials stored locally only</span>
                            </div>
                          </div>

                          {/* API Key shortcut */}
                          {service.apiKeyId && (
                            <div style={{ borderTop:'1px solid #1e1e2e', paddingTop:14 }}>
                              <p style={{ margin:'0 0 8px', fontSize:12, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Or use API Key directly</p>
                              <div style={{ display:'flex', gap:8 }}>
                                <input
                                  type="password"
                                  placeholder={service.id === 'claude' ? 'sk-ant-...' : 'sk-...'}
                                  value={apiKeys[service.apiKeyId] || ''}
                                  onChange={e => setApiKeys(prev => ({ ...prev, [service.apiKeyId]: e.target.value }))}
                                  style={{ flex:1, padding:'9px 12px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13 }}
                                />
                                <button onClick={async () => { await saveApiKeys(); }} style={{ padding:'9px 16px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                                  {keysSaved ? '✓ Saved!' : 'Save Key'}
                                </button>
                                <button onClick={() => window.open(service.id === 'claude' ? 'https://console.anthropic.com/keys' : 'https://platform.openai.com/api-keys', '_blank')} style={{ padding:'9px 12px', background:'transparent', border:'1px solid #1e1e2e', borderRadius:8, color:'#6b7280', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                                  Get key →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Usage logs */}
              <h3 style={{ color:'#94a3b8', fontSize:15, margin:'0 0 12px' }}>Usage Logs</h3>
              {usageLogs.length === 0 && <p style={{ color:'#4b5563', fontSize:13, textAlign:'center', padding:24 }}>No usage logged yet.</p>}
              {usageLogs.length > 0 && (
                <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1.5fr', padding:'10px 16px', borderBottom:'1px solid #1e1e2e', background:'#0d0d15' }}>
                    {['Model','Tokens In','Tokens Out','Cost','Time'].map(h => <p key={h} style={{ margin:0, fontSize:11, color:'#4b5563', fontWeight:600, textTransform:'uppercase' }}>{h}</p>)}
                  </div>
                  {usageLogs.slice(0,20).map(l => (
                    <div key={l.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1.5fr', padding:'10px 16px', borderBottom:'1px solid #0d0d15' }}>
                      <p style={{ margin:0, fontSize:12, color:'#e2e8f0' }}>{l.model}</p>
                      <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>{l.tokens_in?.toLocaleString()}</p>
                      <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>{l.tokens_out?.toLocaleString()}</p>
                      <p style={{ margin:0, fontSize:12, color:'#059669' }}>${((l.cost_usd||0)+(l.markup_usd||0)).toFixed(4)}</p>
                      <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{new Date(l.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PLATFORMS TAB ─────────────────────────────────────────────────── */}
        {mainTab === 'platforms' && (
          <div style={{ flex:1, overflowY:'auto', padding:32 }}>
            <div style={{ maxWidth:800, margin:'0 auto' }}>
              <h2 style={{ color:'#fff', margin:'0 0 4px', fontSize:22 }}>🌐 Platforms</h2>
              <p style={{ color:'#6b7280', margin:'0 0 24px', fontSize:14 }}>Access Forge from anywhere — desktop, mobile, bots, and APIs</p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
                {[
                  { icon:'🖥️', name:'Desktop App', desc:'Native Electron app for Mac, Windows, Linux. Works offline and syncs with your workspace.', badge:'Download', badgeColor:'#7C3AED', action:() => alert('Desktop app download link: https://github.com/goldrusher9009/forge/releases') },
                  { icon:'📱', name:'Mobile PWA', desc:'Install Forge as a Progressive Web App on iOS or Android — works from your browser.', badge:'Open Web', badgeColor:'#2563EB', action:() => window.open('/') },
                  { icon:'🤖', name:'Telegram Bot', desc:'Chat with your Forge agents via Telegram. Use /help to see available commands.', badge:'Connect', badgeColor:'#0891B2', action:() => alert('Add your Telegram Bot token in Settings → Platforms → Telegram') },
                  { icon:'💬', name:'WeChat / WeCom', desc:'Integrate Forge with WeChat or WeCom for enterprise team messaging.', badge:'Configure', badgeColor:'#059669', action:() => alert('WeChat integration coming soon. Email support@forge.ai for early access.') },
                  { icon:'🔌', name:'REST API', desc:'Full API access with your JWT token. Use any language or framework to call Forge models.', badge:'Docs', badgeColor:'#D97706', action:() => window.open('/api-docs') },
                  { icon:'⚡', name:'Slack', desc:'Bring Forge into your Slack workspace. Ask questions and run agents without leaving Slack.', badge:'Install', badgeColor:'#DB2777', action:() => alert('Slack app coming soon. Join waitlist at forge.ai/slack') },
                ].map(p => (
                  <div key={p.name} style={{ padding:'20px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <span style={{ fontSize:28 }}>{p.icon}</span>
                      <p style={{ margin:0, fontSize:16, fontWeight:600, color:'#e2e8f0' }}>{p.name}</p>
                    </div>
                    <p style={{ margin:'0 0 14px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>{p.desc}</p>
                    <button onClick={p.action} style={{ padding:'8px 16px', background:p.badgeColor, border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>{p.badge}</button>
                  </div>
                ))}
              </div>

              {/* API reference */}
              <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:16, padding:24, marginTop:24 }}>
                <h3 style={{ color:'#94a3b8', margin:'0 0 16px', fontSize:15 }}>Quick API Reference</h3>
                <div style={{ background:'#0a0a0f', borderRadius:8, padding:16, fontFamily:'monospace', fontSize:12, color:'#a78bfa' }}>
                  <p style={{ margin:'0 0 8px', color:'#4b5563' }}># Chat with a model</p>
                  <p style={{ margin:'0 0 16px' }}>POST {API}/threads/:threadId/messages</p>
                  <p style={{ margin:'0 0 8px', color:'#4b5563' }}># Dispatch an agent</p>
                  <p style={{ margin:'0 0 16px' }}>POST {API}/dispatch/run</p>
                  <p style={{ margin:'0 0 8px', color:'#4b5563' }}># Authorization header</p>
                  <p style={{ margin:0 }}>Authorization: Bearer {'<your-jwt-token>'}</p>
                </div>
                <p style={{ margin:'12px 0 0', fontSize:12, color:'#4b5563' }}>Your token: {user.token.slice(0,20)}...{user.token.slice(-8)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ──────────────────────────────────────────────────── */}
        {mainTab === 'settings' && (
          <div style={{ flex:1, overflowY:'auto', padding:32 }}>
            <div style={{ maxWidth:700, margin:'0 auto' }}>
              <h2 style={{ color:'#fff', margin:'0 0 4px', fontSize:22 }}>⚙️ Settings</h2>
              <p style={{ color:'#6b7280', margin:'0 0 24px', fontSize:14 }}>Configure API keys, agents, and preferences</p>

              {/* Connected Services */}
              <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:16, padding:24, marginBottom:24 }}>
                <h3 style={{ color:'#94a3b8', fontSize:14, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Connected Services</h3>
                <p style={{ color:'#4b5563', fontSize:12, margin:'0 0 16px' }}>Sign in with your existing subscriptions or enter API keys to use Claude, OpenAI, and Cursor.</p>
                {([
                  { id:'claude', icon:'🟣', name:'Claude', color:'#7C3AED', apiKeyId:'anthropic', placeholder:'sk-ant-...', keyHint:'console.anthropic.com/keys' },
                  { id:'openai', icon:'🟢', name:'OpenAI / ChatGPT', color:'#059669', apiKeyId:'openai', placeholder:'sk-...', keyHint:'platform.openai.com/api-keys' },
                  { id:'cursor', icon:'🔵', name:'Cursor', color:'#2563EB', apiKeyId:'', placeholder:'', keyHint:'' },
                ] as const).map(svc => {
                  const creds = serviceCreds[svc.id];
                  const hasApiKey = svc.apiKeyId && apiKeys[svc.apiKeyId];
                  return (
                    <div key={svc.id} style={{ marginBottom:16, background:'#0a0a0f', borderRadius:12, border:`1px solid ${creds.connected || hasApiKey ? svc.color + '66' : '#1e1e2e'}`, overflow:'hidden' }}>
                      {/* Service header */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderBottom:'1px solid #1e1e2e' }}>
                        <span style={{ fontSize:18 }}>{svc.icon}</span>
                        <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{svc.name}</p>
                        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
                          {creds.connected && <span style={{ fontSize:11, color:'#059669', background:'#05966922', padding:'2px 8px', borderRadius:20 }}>✓ Signed in · {creds.email}</span>}
                          {!creds.connected && hasApiKey && <span style={{ fontSize:11, color:'#059669', background:'#05966922', padding:'2px 8px', borderRadius:20 }}>✓ API key active</span>}
                          {!creds.connected && !hasApiKey && <span style={{ fontSize:11, color:'#4b5563' }}>Not connected</span>}
                        </div>
                      </div>

                      <div style={{ padding:'14px' }}>
                        {/* Subscription login */}
                        <p style={{ margin:'0 0 8px', fontSize:11, color:'#6b7280', fontWeight:600, textTransform:'uppercase' }}>Monthly subscription login</p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                          <input
                            placeholder="Email address"
                            type="email"
                            value={creds.email}
                            onChange={e => setServiceCreds(p => ({ ...p, [svc.id]: { ...p[svc.id], email: e.target.value } }))}
                            style={{ padding:'9px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13, boxSizing:'border-box' }}
                          />
                          <input
                            placeholder="Password"
                            type="password"
                            value={creds.password}
                            onChange={e => setServiceCreds(p => ({ ...p, [svc.id]: { ...p[svc.id], password: e.target.value } }))}
                            style={{ padding:'9px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13, boxSizing:'border-box' }}
                          />
                        </div>
                        <div style={{ display:'flex', gap:8, marginBottom: svc.apiKeyId ? 14 : 0 }}>
                          <button
                            onClick={() => {
                              if (creds.email && creds.password) {
                                setServiceCreds(p => ({ ...p, [svc.id]: { ...p[svc.id], connected: true } }));
                                localStorage.setItem(`forge_svc_${svc.id}`, JSON.stringify({ email: creds.email, connected: true }));
                              }
                            }}
                            style={{ padding:'8px 16px', background: creds.connected ? '#05966933' : svc.color, border: creds.connected ? `1px solid #059669` : 'none', borderRadius:8, color: creds.connected ? '#059669' : '#fff', fontSize:13, cursor:'pointer', fontWeight:600 }}
                          >
                            {creds.connected ? '✓ Connected' : 'Connect Account'}
                          </button>
                          {creds.connected && (
                            <button
                              onClick={() => { setServiceCreds(p => ({ ...p, [svc.id]: { email:'', password:'', connected:false } })); localStorage.removeItem(`forge_svc_${svc.id}`); }}
                              style={{ padding:'8px 12px', background:'transparent', border:'1px solid #DC2626', borderRadius:8, color:'#DC2626', fontSize:12, cursor:'pointer' }}
                            >
                              Disconnect
                            </button>
                          )}
                          <button onClick={() => window.open(svc.id === 'claude' ? 'https://claude.ai/upgrade' : svc.id === 'openai' ? 'https://chat.openai.com/upgrade' : 'https://cursor.sh/pricing', '_blank')} style={{ padding:'8px 12px', background:'transparent', border:'1px solid #1e1e2e', borderRadius:8, color:'#6b7280', fontSize:12, cursor:'pointer' }}>
                            View plans →
                          </button>
                        </div>

                        {/* API Key section */}
                        {svc.apiKeyId && (
                          <>
                            <div style={{ borderTop:'1px solid #1e1e2e', paddingTop:12, marginTop:4 }}>
                              <p style={{ margin:'0 0 8px', fontSize:11, color:'#6b7280', fontWeight:600, textTransform:'uppercase' }}>Or use API key</p>
                              <div style={{ display:'flex', gap:8 }}>
                                <input
                                  type="password"
                                  placeholder={svc.placeholder}
                                  value={apiKeys[svc.apiKeyId] || ''}
                                  onChange={e => setApiKeys(prev => ({ ...prev, [svc.apiKeyId]: e.target.value }))}
                                  style={{ flex:1, padding:'9px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13 }}
                                />
                                <button onClick={saveApiKeys} style={{ padding:'9px 16px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>
                                  {keysSaved ? '✓ Saved' : 'Save'}
                                </button>
                                <button onClick={() => window.open(`https://${svc.keyHint}`, '_blank')} style={{ padding:'9px 12px', background:'transparent', border:'1px solid #1e1e2e', borderRadius:8, color:'#6b7280', fontSize:12, cursor:'pointer' }}>
                                  Get key →
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LLM Providers — username + password + API key */}
              <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:16, padding:24, marginBottom:24 }}>
                <h3 style={{ color:'#94a3b8', fontSize:14, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>LLM Providers</h3>
                <p style={{ color:'#4b5563', fontSize:12, margin:'0 0 16px' }}>Connect with your account credentials or paste an API key directly.</p>
                {([
                  { key:'openrouter', icon:'🔀', label:'OpenRouter', color:'#6366f1', placeholder:'sk-or-v1-...', hint:'openrouter.ai/keys', loginUrl:'https://openrouter.ai/sign-in' },
                  { key:'groq',       icon:'⚡', label:'Groq',        color:'#F97316', placeholder:'gsk_...',      hint:'console.groq.com/keys', loginUrl:'https://console.groq.com' },
                  { key:'gemini',     icon:'✨', label:'Google Gemini', color:'#4285F4', placeholder:'AIza...',    hint:'aistudio.google.com', loginUrl:'https://aistudio.google.com' },
                  { key:'mistral',    icon:'🌊', label:'Mistral',     color:'#0891B2', placeholder:'...',          hint:'console.mistral.ai', loginUrl:'https://console.mistral.ai' },
                  { key:'together',   icon:'🤝', label:'Together AI', color:'#059669', placeholder:'...',          hint:'api.together.xyz', loginUrl:'https://api.together.xyz/signin' },
                  { key:'perplexity', icon:'🔭', label:'Perplexity',  color:'#8B5CF6', placeholder:'pplx-...',    hint:'perplexity.ai/settings', loginUrl:'https://www.perplexity.ai' },
                ] as const).map(({ key, icon, label, color, placeholder, hint, loginUrl }) => {
                  const creds = llmCreds[key];
                  const expanded = llmExpanded[key];
                  const hasKey = !!apiKeys[key];
                  return (
                    <div key={key} style={{ marginBottom:10, background:'#0a0a0f', borderRadius:12, border:`1px solid ${creds.connected || hasKey ? color + '55' : '#1e1e2e'}`, overflow:'hidden' }}>
                      {/* Header row */}
                      <div onClick={() => setLlmExpanded(p => ({ ...p, [key]: !p[key] }))} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer' }}>
                        <span style={{ fontSize:18 }}>{icon}</span>
                        <div style={{ flex:1 }}>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{label}</p>
                          <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{hint}</p>
                        </div>
                        {creds.connected && <span style={{ fontSize:11, color:color, background:color+'22', padding:'2px 8px', borderRadius:20 }}>✓ Signed in · {creds.username}</span>}
                        {!creds.connected && hasKey && <span style={{ fontSize:11, color:'#059669', background:'#05966922', padding:'2px 8px', borderRadius:20 }}>✓ API key active</span>}
                        {!creds.connected && !hasKey && <span style={{ fontSize:11, color:'#6b7280' }}>Not connected</span>}
                        <span style={{ color:'#4b5563', fontSize:12, marginLeft:4 }}>{expanded ? '▲' : '▼'}</span>
                      </div>
                      {/* Expanded body */}
                      {expanded && (
                        <div style={{ padding:'0 14px 14px', borderTop:'1px solid #1e1e2e' }}>
                          {/* Username + password */}
                          <p style={{ color:'#6b7280', fontSize:12, margin:'12px 0 8px' }}>Sign in with your {label} account</p>
                          <input
                            type="text"
                            placeholder="Username or email"
                            value={creds.username}
                            onChange={e => setLlmCreds(p => ({ ...p, [key]: { ...p[key], username: e.target.value } }))}
                            style={{ width:'100%', padding:'9px 12px', marginBottom:8, background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13, boxSizing:'border-box' }}
                          />
                          <input
                            type="password"
                            placeholder="Password"
                            value={creds.password}
                            onChange={e => setLlmCreds(p => ({ ...p, [key]: { ...p[key], password: e.target.value } }))}
                            style={{ width:'100%', padding:'9px 12px', marginBottom:10, background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13, boxSizing:'border-box' }}
                          />
                          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                            {!creds.connected ? (
                              <button onClick={() => {
                                if (!creds.username) return;
                                const saved = { ...creds, connected: true };
                                setLlmCreds(p => ({ ...p, [key]: saved }));
                                localStorage.setItem('llmCreds', JSON.stringify({ ...llmCreds, [key]: saved }));
                              }} style={{ flex:1, padding:'9px', background:color, border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                                Connect
                              </button>
                            ) : (
                              <button onClick={() => {
                                const reset = { username:'', password:'', connected:false };
                                setLlmCreds(p => ({ ...p, [key]: reset }));
                                localStorage.setItem('llmCreds', JSON.stringify({ ...llmCreds, [key]: reset }));
                              }} style={{ flex:1, padding:'9px', background:'transparent', border:'1px solid #DC2626', borderRadius:8, color:'#DC2626', fontSize:13, cursor:'pointer' }}>
                                Disconnect
                              </button>
                            )}
                            <button onClick={() => window.open(loginUrl, '_blank')} style={{ padding:'9px 12px', background:'transparent', border:'1px solid #1e1e2e', borderRadius:8, color:'#6b7280', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                              Sign up →
                            </button>
                          </div>
                          {/* Or use API key */}
                          <p style={{ color:'#6b7280', fontSize:12, margin:'0 0 8px' }}>— or use an API key directly —</p>
                          <div style={{ display:'flex', gap:8 }}>
                            <input
                              type="password"
                              placeholder={placeholder}
                              value={apiKeys[key] || ''}
                              onChange={e => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
                              style={{ flex:1, padding:'9px 12px', background:'#111118', border:'1px solid #1e1e2e', borderRadius:8, color:'#e2e8f0', fontSize:13 }}
                            />
                            <button onClick={saveApiKeys} style={{ padding:'9px 14px', background:color, border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                              {keysSaved ? '✓' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Agents management */}
              <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:16, padding:24, marginBottom:24 }}>
                <h3 style={{ color:'#94a3b8', fontSize:14, margin:'0 0 16px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Agents</h3>
                {agents.map(a => (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#0a0a0f', borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>{a.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{a.name}</p>
                      <p style={{ margin:0, fontSize:11, color:'#4b5563' }}>{a.model} {a.built_in ? '· built-in' : ''}</p>
                    </div>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:a.enabled ? '#059669' : '#4b5563' }} />
                  </div>
                ))}
                {agents.length === 0 && <p style={{ color:'#4b5563', fontSize:13 }}>No agents loaded.</p>}
              </div>

              {/* Account */}
              <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:16, padding:24 }}>
                <h3 style={{ color:'#94a3b8', fontSize:14, margin:'0 0 16px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Account</h3>
                <p style={{ margin:'0 0 4px', fontSize:13, color:'#e2e8f0' }}>{user.name || '(no name)'}</p>
                <p style={{ margin:'0 0 16px', fontSize:13, color:'#6b7280' }}>{user.email}</p>
                <button onClick={handleLogout} style={{ padding:'8px 16px', background:'transparent', border:'1px solid #DC2626', borderRadius:8, color:'#DC2626', fontSize:13, cursor:'pointer' }}>Sign Out</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}

      {/* New Project */}
      {showNewProject && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowNewProject(false)}>
          <div style={{ width:420, background:'#111118', borderRadius:16, padding:24, border:'1px solid #1e1e2e' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontSize:18 }}>New Project</h3>
            <input placeholder="Project name" value={newProjName} onChange={e => setNewProjName(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
            <p style={{ color:'#4b5563', fontSize:12, margin:'0 0 8px' }}>Color</p>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {PROJECT_COLORS.map(c => <div key={c} onClick={() => setNewProjColor(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border:newProjColor===c ? '3px solid #fff' : '3px solid transparent' }} />)}
            </div>
            <textarea placeholder="System prompt (optional)" value={newProjPrompt} onChange={e => setNewProjPrompt(e.target.value)} rows={3} style={{ width:'100%', padding:'12px', marginBottom:16, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowNewProject(false)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid #2d2d44', borderRadius:8, color:'#6b7280', cursor:'pointer' }}>Cancel</button>
              <button onClick={createProject} style={{ flex:1, padding:'10px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* New Task */}
      {showNewTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowNewTask(false)}>
          <div style={{ width:380, background:'#111118', borderRadius:16, padding:24, border:'1px solid #1e1e2e' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontSize:18 }}>New Task</h3>
            <input placeholder="Task title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:6, marginBottom:16 }}>
              {(['low','medium','high'] as const).map(p => (
                <button key={p} onClick={() => setNewTaskPriority(p)} style={{ flex:1, padding:'8px', background:newTaskPriority===p ? taskPriorityColor[p]+'33' : 'transparent', border:`1px solid ${newTaskPriority===p ? taskPriorityColor[p] : '#2d2d44'}`, borderRadius:6, color:newTaskPriority===p ? taskPriorityColor[p] : '#6b7280', cursor:'pointer', fontSize:12, textTransform:'capitalize' }}>{p}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowNewTask(false)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid #2d2d44', borderRadius:8, color:'#6b7280', cursor:'pointer' }}>Cancel</button>
              <button onClick={createTask} style={{ flex:1, padding:'10px', background:'#7C3AED', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Artifact viewer */}
      {viewArtifact && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setViewArtifact(null)}>
          <div style={{ width:'80vw', maxWidth:900, height:'80vh', background:'#111118', borderRadius:16, padding:24, border:'1px solid #1e1e2e', display:'flex', flexDirection:'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <span style={{ fontSize:22 }}>{artifactTypeIcon[viewArtifact.type] || artifactTypeIcon.default}</span>
              <h3 style={{ color:'#fff', margin:0, fontSize:18, flex:1 }}>{viewArtifact.title}</h3>
              <span style={{ fontSize:11, color:'#4b5563', background:'#1a1a2e', padding:'4px 8px', borderRadius:6 }}>v{viewArtifact.version} · {viewArtifact.type}</span>
              <button onClick={() => setViewArtifact(null)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            {(viewArtifact.type === 'html' || viewArtifact.type === 'react') ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                <iframe srcDoc={viewArtifact.content} style={{ flex:1, border:'1px solid #1e1e2e', borderRadius:8, background:'#fff' }} title={viewArtifact.title} />
              </div>
            ) : (
              <div style={{ flex:1, overflowY:'auto', background:'#0a0a0f', borderRadius:8, padding:16, border:'1px solid #1e1e2e' }}>
                <pre style={{ margin:0, fontSize:13, color:'#e2e8f0', fontFamily:'ui-monospace, monospace', whiteSpace:'pre-wrap', wordBreak:'break-word', lineHeight:1.6 }}>{viewArtifact.content}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d2d44; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: #4b5563; }
        select option { background: #1a1a2e; }
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
