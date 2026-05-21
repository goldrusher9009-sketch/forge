// Forge AI Workspace v5.9 -- Full OR model list (358 models, grouped), proxy browser (server-side fetch), ForgeAgent (web search + fetch tool loop)
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── CSS injected once for animations ────────────────────────────────────────
const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500&display=swap');

:root {
  --fg-bg:      #08080d;
  --fg-bg2:     #0e0e16;
  --fg-bg3:     #13131e;
  --fg-bg4:     #1a1a2a;
  --fg-bg5:     #22223a;
  --fg-orange:  #f97316;
  --fg-orange2: #fb923c;
  --fg-odim:    rgba(249,115,22,0.12);
  --fg-odim2:   rgba(249,115,22,0.20);
  --fg-border:  rgba(255,255,255,0.055);
  --fg-border2: rgba(255,255,255,0.10);
  --fg-border3: rgba(249,115,22,0.25);
  --fg-text:    #f0f0f8;
  --fg-text2:   #8888aa;
  --fg-text3:   #4a4a66;
  --fg-green:   var(--fg-green);
  --fg-purple:  var(--fg-orange2);
  --fg-blue:    #38bdf8;
  --fg-red:     var(--fg-red);
  --fg-font-ui: 'Inter', system-ui, sans-serif;
  --fg-font-display: 'Syne', system-ui, sans-serif;
  --fg-font-mono: 'DM Mono', 'Fira Code', monospace;
}

* { box-sizing: border-box; }

body, #__next { background: var(--fg-bg) !important; color: var(--fg-text) !important; font-family: var(--fg-font-ui) !important; }

::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--fg-bg5); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--fg-bg4); }

@keyframes pulse { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }
@keyframes fg-live-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{opacity:.7;box-shadow:0 0 0 5px rgba(34,197,94,0)} }
@keyframes fg-orange-glow { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.35)} 50%{box-shadow:0 0 0 5px rgba(249,115,22,0)} }
@keyframes forge-flash {
  0%,100% { background:var(--fg-orange); box-shadow:0 0 10px rgba(249,115,22,.5); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 16px rgba(249,115,22,.3); }
}
@keyframes forge-ring {
  0%,100% { border-color: var(--fg-border3); }
  50%     { border-color: var(--fg-orange); }
}
@keyframes forge-text-flash {
  0%,100% { color: var(--fg-orange); }
  50%     { color: var(--fg-orange2); }
}
@keyframes send-pulse {
  0%,100% { background:var(--fg-orange); box-shadow:0 0 0 0 rgba(249,115,22,.5); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 0 6px rgba(249,115,22,0); }
}
@keyframes fg-think { 0%,60%,100%{transform:scale(.8);opacity:.3} 30%{transform:scale(1.15);opacity:1} }
@keyframes fg-slide-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes fg-topbar-line { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
`;

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User { id: string; email: string; name?: string; token: string; plan?: string; role?: string; }
interface Project { id: string; name: string; color: string; system_prompt?: string; pinned?: number; created_at: string; }
interface Thread { id: string; project_id?: string; title: string; created_at: string; pinned?: number; archived?: number; total_tokens?: number; }
interface VaultKey { provider: string; key_preview: string; key_status: 'active'|'inactive'|'invalid'; created_at: string; updated_at: string; }
interface SuperMemory { id: string; topic: string; insight: string; frequency: number; strength: number; updated_at: string; }
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
      // Session expired -- clear local auth and force re-login
      localStorage.removeItem('forge_user');
      if (_onSessionExpired) _onSessionExpired();
    }
    throw new Error(err.error || 'Session expired. Please log in again.');
  }
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || err.error || `HTTP ${res.status}`); }
  return res.json().catch(() => ({}));
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROJECT_COLORS = ['var(--fg-orange)','var(--fg-blue)','var(--fg-green)','var(--fg-red)','var(--fg-orange)','var(--fg-orange)','var(--fg-blue)','var(--fg-green)'];
const AGENT_ICONS = ['🧠','⚡','🔮','🔥','🌊','🎨','🚀','💻'];
const FORGE_MODELS = [
  { id:'forge-ultra',  label:'Forge Ultra',  desc:'Claude Opus 4.6 + markup',       base:'claude-opus-4-6' },
  { id:'forge-pro',    label:'Forge Pro',    desc:'Claude Sonnet 4.6 + markup',     base:'claude-sonnet-4-6' },
  { id:'forge-flash',  label:'Forge Flash',  desc:'Claude Haiku 4.5 + markup',      base:'claude-haiku-4-5-20251001' },
  { id:'forge-gpt',    label:'Forge GPT',    desc:'GPT-4o + markup',                base:'gpt-4o' },
  { id:'forge-gemini', label:'Forge Gemini', desc:'Gemini 2.0 Flash + markup',      base:'gemini-2.0-flash' },
];
const DIRECT_MODELS = [
  { group:'Morph', models:[
    { id:'morph-v3-fast', label:'Morph v3 Fast' },
    { id:'morph-v3',      label:'Morph v3' },
  ]},
  { group:'Anthropic', models:[
    { id:'claude-opus-4-6',         label:'Claude Opus 4.6' },
    { id:'claude-sonnet-4-6',       label:'Claude Sonnet 4.6' },
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
        onLogin({ id: u.id, email: u.email, name: u.firstName || u.name || email, token, role: u.role });
      } else {
        const data = await apiFetch('/auth/login', { method:'POST', body:JSON.stringify(body) });
        const u = data.data?.user || data.user || {};
        const token = data.data?.accessToken || data.token || '';
        if (!token) throw new Error('No token received -- check credentials');
        onLogin({ id: u.id, email: u.email, name: u.firstName || u.name || email, token, role: u.role });
      }
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('INVALID_CREDENTIALS')) setError('Invalid email or password');
      else if (msg.includes('DUPLICATE_EMAIL')) setError('Email already registered -- try signing in');
      else if (msg.includes('INVALID_PASSWORD')) setError('Password must be at least 8 characters');
      else setError(msg || 'Something went wrong');
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--fg-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:400, padding:'40px', background:'var(--fg-bg3)', borderRadius:16, border:'1px solid var(--fg-border)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>⚡</div>
          <h1 style={{ color:'#fff', fontSize:24, fontWeight:800, margin:0, fontFamily:'var(--fg-font-display)', letterSpacing:'-0.5px' }}>Forge</h1>
          <p style={{ color:'var(--fg-text3)', margin:'4px 0 0', fontSize:14 }}>AI Workspace Platform</p>
        </div>
        <div style={{ display:'flex', background:'var(--fg-bg)', borderRadius:8, marginBottom:24, padding:4 }}>
          {(['login','register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'8px', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:500, background:mode===m ? 'var(--fg-orange)' : 'transparent', color:mode===m ? '#fff' : 'var(--fg-text3)', transition:'all 0.2s' }}>{m==='login' ? 'Sign In' : 'Sign Up'}</button>
          ))}
        </div>
        {mode==='register' && <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box' }} />}
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box' }} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} style={{ width:'100%', padding:'12px', marginBottom:16, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box' }} />
        {error && <p style={{ color:'var(--fg-red)', fontSize:13, marginBottom:12 }}>{error}</p>}
        <button onClick={submit} disabled={loading} style={{ width:'100%', padding:'12px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading ? 0.7 : 1 }}>
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
  const [openRouterModels, setOpenRouterModels] = useState<{id:string;name:string;context_length?:number;pricing?:{prompt:string;completion:string}}[]>([]);

  // Selection
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);

  // Main tab -- 'workspace' | 'router' | 'billing' | 'platforms' | 'settings' | 'admin' | 'super'
  const [mainTab, setMainTab] = useState<'workspace'|'router'|'billing'|'platforms'|'settings'|'admin'|'super'>('workspace');

  // Right panel tabs
  const [rightTab, setRightTab] = useState<'artifacts'|'tasks'|'schedule'|'dispatch'|'live'|'context'|'browser'|'terminal'|'agent'>('artifacts');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [rightExpanded, setRightExpanded] = useState(true);

  // Composer
  const [input, setInput] = useState('');
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
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
  const [newProjColor, setNewProjColor] = useState('var(--fg-orange)');
  const [newProjPrompt, setNewProjPrompt] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low'|'medium'|'high'>('medium');
  const [viewArtifact, setViewArtifact] = useState<Artifact | null>(null);

  // Settings / API keys
  const [apiKeys, setApiKeys] = useState<Record<string,string>>({});
  const [keysSaved, setKeysSaved] = useState(false);
  const [savedProviders, setSavedProviders] = useState<Record<string,boolean>>({});

  // Admin panel state
  const [adminTab, setAdminTab] = useState<'stats'|'users'|'keys'|'models'>('stats');
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminPlatformKeys, setAdminPlatformKeys] = useState<any[]>([]);
  const [adminModels, setAdminModels] = useState<any[]>([]);
  const [adminKeyInputs, setAdminKeyInputs] = useState<Record<string,string>>({});
  const [adminSaving, setAdminSaving] = useState('');

  // Service credentials (subscription logins -- Claude, OpenAI, Cursor) -- persisted in localStorage
  const [serviceCreds, setServiceCreds] = useState<Record<string, { email:string; password:string; connected:boolean }>>({
    claude: { email:'', password:'', connected:false },
    openai: { email:'', password:'', connected:false },
    cursor: { email:'', password:'', connected:false },
  });
  const [serviceExpanded, setServiceExpanded] = useState<Record<string,boolean>>({});

  // LLM provider credentials (username + password + API key) -- persisted in localStorage
  const [llmCreds, setLlmCreds] = useState<Record<string, { username:string; password:string; connected:boolean }>>({
    openrouter: { username:'', password:'', connected:false },
    groq: { username:'', password:'', connected:false },
    gemini: { username:'', password:'', connected:false },
    mistral: { username:'', password:'', connected:false },
    together: { username:'', password:'', connected:false },
    perplexity: { username:'', password:'', connected:false },
  });
  const [llmExpanded, setLlmExpanded] = useState<Record<string,boolean>>({});

  // Key vault
  const [vaultKeys, setVaultKeys] = useState<VaultKey[]>([]);
  const [vaultUpdateInputs, setVaultUpdateInputs] = useState<Record<string,string>>({});
  const [vaultUpdating, setVaultUpdating] = useState('');
  const [vaultValidating, setVaultValidating] = useState<Record<string,boolean>>({});

  // Thread context menu
  const [threadMenu, setThreadMenu] = useState<{ threadId:string; x:number; y:number } | null>(null);
  const [renamingThread, setRenamingThread] = useState<{ id:string; title:string }|null>(null);
  const [threadStats, setThreadStats] = useState<{ total_tokens:number; message_count:number; token_history:{tokens:number;created_at:string}[] }|null>(null);

  // Navbar token total
  const [totalTokens, setTotalTokens] = useState(0);

  // SuperAgent
  const [superInput, setSuperInput] = useState('');
  const [superMessages, setSuperMessages] = useState<{role:string;content:string}[]>([]);
  const [superSending, setSuperSending] = useState(false);
  const [superMemory, setSuperMemory] = useState<SuperMemory[]>([]);
  const [superHarvesting, setSuperHarvesting] = useState(false);
  const [superTab, setSuperTab] = useState<'chat'|'memory'>('chat');
  const superEndRef = useRef<HTMLDivElement>(null);

  // ForgeRouter state
  const [routerTab, setRouterTab] = useState<'forge'|'direct'|'openrouter'|'custom'>('forge');
  const [orSearch, setOrSearch] = useState('');
  const [orSort, setOrSort] = useState<'name'|'price_asc'|'price_desc'|'context'>('name');
  const [orFilter, setOrFilter] = useState<'all'|'free'|'paid'>('all');
  const [orLoading, setOrLoading] = useState(false);
  const [newProvider, setNewProvider] = useState({ name:'', base_url:'', api_key:'', markup:'1.5', models:'' });
  const [routerTestPrompt, setRouterTestPrompt] = useState('');
  const [routerTestModel, setRouterTestModel] = useState('forge-pro');
  const [routerTestResult, setRouterTestResult] = useState('');
  const [routerTesting, setRouterTesting] = useState(false);

  // Live activity feed
  const [liveEvents, setLiveEvents] = useState<{type:string;message:string;model?:string;elapsed?:number;ts:number}[]>([]);
  const liveSSERef = useRef<EventSource|null>(null);

  // Context bar -- per-thread token tracking + model context limits
  const MODEL_CONTEXT_LIMITS: Record<string, number> = {
    'claude-sonnet-4-6': 200000, 'claude-opus-4-6': 200000, 'claude-haiku-4-5-20251001': 200000,
    'gpt-4o': 128000, 'gpt-4o-mini': 128000, 'o3': 200000, 'o4-mini': 200000,
    'gemini-2.0-flash': 1048576, 'gemini-2.5-pro': 2097152,
    'llama-3.1-8b-instant': 128000, 'mistral-small-latest': 32000,
  };
  const getContextLimit = (model: string) => {
    if (MODEL_CONTEXT_LIMITS[model]) return MODEL_CONTEXT_LIMITS[model];
    const orModel = openRouterModels.find(m => m.id === model);
    if (orModel?.context_length) return orModel.context_length;
    return 128000;
  };

  // ForgeBrowser state
  const [browserUrl, setBrowserUrl] = useState('https://google.com');
  const [browserInput, setBrowserInput] = useState('https://google.com');
  const [browserHistory, setBrowserHistory] = useState<string[]>([]);
  const [browserHistoryIdx, setBrowserHistoryIdx] = useState(0);
  const browserFrameRef = useRef<HTMLIFrameElement>(null);
  const [browserMode, setBrowserMode] = useState<'proxy'|'iframe'>('proxy');
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserPage, setBrowserPage] = useState<{title:string;text:string;links:{text:string;href:string}[];url:string;status:number;error?:string}|null>(null);

  // SuperAgent / agent chat state
  const [agentMessages, setAgentMessages] = useState<{role:'user'|'agent'|'tool'|'tool_result'|'error';content:string;tool?:string;args?:any}[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const agentScrollRef = useRef<HTMLDivElement>(null);

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<{text:string;type:'input'|'output'|'error'|'system'}[]>([
    { text: '⚡ Forge Terminal -- type commands below', type:'system' },
    { text: 'Safe commands: ls, cat, echo, date, pwd, env, node, python, curl, git log/status', type:'system' },
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalHistoryIdx, setTerminalHistoryIdx] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Dynamic provider models (all providers)
  const [providerModels, setProviderModels] = useState<Record<string, {id:string;name:string;context_length?:number;pricing?:{prompt:string;completion:string}}[]>>({});

  // Attached folders/files (bottom bar)
  const [attachedFolders, setAttachedFolders] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<{name:string;content:string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Inject global animation styles once ───────────────────────────────────
  useEffect(() => {
    const id = 'forge-global-styles';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = GLOBAL_STYLES;
      document.head.appendChild(s);
    }
  }, []);

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
    loadOpenRouterModels(); loadApiKeys(); loadVault();
    loadTotalTokens(); loadSuperMemory(); loadSuperHistory();
  }, [user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);
  useEffect(() => { superEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [superMessages]);
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [terminalLines]);

  // Connect live activity SSE when user logs in
  useEffect(() => {
    if (!user) { liveSSERef.current?.close(); liveSSERef.current = null; return; }
    const token = user.token;
    const es = new EventSource(`${API}/live/activity?token=${token}`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'connected') return;
        setLiveEvents(prev => [{ ...data, ts: Date.now() }, ...prev].slice(0, 100));
      } catch {}
    };
    liveSSERef.current = es;
    return () => { es.close(); };
  }, [user]);


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
      // Backend returns camelCase (tokensUsed/tokenLimit) -- normalize to snake_case for our Subscription type
      setSubscription({
        plan: d.plan || 'free',
        tokens_used: d.tokens_used ?? d.tokensUsed ?? 0,
        token_limit: d.token_limit ?? d.tokenLimit ?? 10000,
        period_end: d.period_end ?? d.periodEnd,
      });
    } catch {}
  };
  const loadOpenRouterModels = async () => {
    if (!user) return;
    setOrLoading(true);
    try {
      const d = await apiFetch('/keys/openrouter-models', {}, user.token);
      if (d?.error === 'NO_OPENROUTER_KEY') { setOrLoading(false); return; }
      const models = Array.isArray(d?.data?.models) ? d.data.models : [];
      setOpenRouterModels(models);
      // Auto-select first free OR model if no valid model selected
      if (models.length > 0) {
        setSelectedModel(prev => {
          if (!prev || prev === 'claude-sonnet-4-6') {
            const freeModel = models.find((m: any) => m.id.includes(':free') || m.pricing?.prompt === '0' || m.pricing?.prompt === '0.0');
            return freeModel ? freeModel.id : models[0].id;
          }
          return prev;
        });
      }
    } catch {}
    setOrLoading(false);
  };
  // Fetch models for a specific provider from its API
  const loadProviderModels = async (provider: string) => {
    if (!user) return;
    try {
      const d = await apiFetch(`/keys/${provider}/models`, {}, user.token);
      if (d?.success && Array.isArray(d?.data?.models)) {
        const models = d.data.models;
        setProviderModels(prev => ({ ...prev, [provider]: models }));
        // If provider is OpenRouter, also update the openRouterModels state (used elsewhere)
        if (provider === 'openrouter') setOpenRouterModels(models);
      }
    } catch {}
  };

  const loadApiKeys = async () => {
    if (!user) return;
    try {
      const d = await apiFetch('/keys', {}, user.token);
      const data = d?.data || {};
      const providers = ['anthropic','openai','openrouter','groq','gemini','mistral','together','perplexity','cohere','cursor','morph'];
      const confirmed: Record<string,boolean> = {};
      providers.forEach(p => { if (data[`has_${p}`]) confirmed[p] = true; });
      setSavedProviders(confirmed);
      // Trigger model fetch for all confirmed providers (in background, don't await)
      Object.keys(confirmed).forEach(p => { if (confirmed[p]) loadProviderModels(p); });
      // Auto-select best available model based on saved keys
      setSelectedModel(prev => {
        // Keep existing selection if it's already pointing at a valid provider
        if (prev && confirmed['openrouter']) return prev;
        if (prev && prev !== 'claude-sonnet-4-6') return prev;
        // Pick best model from first available provider
        if (confirmed['openrouter']) return prev; // will be set by loadOpenRouterModels
        if (confirmed['morph']) return 'morph-v3-fast';
        if (confirmed['anthropic']) return 'claude-sonnet-4-6';
        if (confirmed['openai']) return 'gpt-4o';
        if (confirmed['gemini']) return 'gemini-2.0-flash';
        if (confirmed['groq']) return 'llama-3.1-8b-instant';
        if (confirmed['mistral']) return 'mistral-small-latest';
        return prev;
      });
    } catch {}
  };
  const loadVault = async () => {
    if (!user) return;
    try { const d = await apiFetch('/keys/vault', {}, user.token); setVaultKeys(Array.isArray(d?.data) ? d.data : []); } catch {}
  };
  const loadTotalTokens = async () => {
    if (!user) return;
    try { const d = await apiFetch('/user/token-total', {}, user.token); setTotalTokens(d?.total || 0); } catch {}
  };
  const loadSuperMemory = async () => {
    if (!user) return;
    try { const d = await apiFetch('/superagent/memory', {}, user.token); setSuperMemory(Array.isArray(d?.data) ? d.data : []); } catch {}
    try { const s = await apiFetch('/superagent/stats', {}, user.token); if (s?.data) setSuperStats(s.data); } catch {}
  };
  const loadSuperHistory = async () => {
    if (!user) return;
    try { const d = await apiFetch('/superagent/history', {}, user.token); setSuperMessages(Array.isArray(d?.data) ? d.data.map((m:any) => ({ role:m.role, content:m.content })) : []); } catch {}
  };
  const loadThreadTokenStats = async (threadId: string) => {
    if (!user) return;
    try { const d = await apiFetch(`/threads/${threadId}/stats`, {}, user.token); if (d?.success) setThreadStats(d.data); } catch {}
  };

  // ── Admin loaders ──────────────────────────────────────────────────────────
  const loadAdminStats   = async () => { if (!user) return; try { const d = await apiFetch('/admin/stats', {}, user.token); setAdminStats(d?.data || d); } catch {} };
  const loadAdminUsers   = async () => { if (!user) return; try { const d = await apiFetch('/admin/users', {}, user.token); setAdminUsers(unwrap(d)); } catch {} };
  const loadAdminKeys    = async () => { if (!user) return; try { const d = await apiFetch('/admin/platform-keys', {}, user.token); setAdminPlatformKeys(unwrap(d)); } catch {} };
  const loadAdminModels  = async () => { if (!user) return; try { const d = await apiFetch('/admin/models', {}, user.token); setAdminModels(unwrap(d)); } catch {} };

  const saveAdminKey = async (provider: string) => {
    if (!user) return;
    const key = adminKeyInputs[provider]?.trim();
    if (!key) { alert('Please enter a key first.'); return; }
    setAdminSaving(provider);
    try {
      await apiFetch('/admin/platform-keys', { method:'POST', body:JSON.stringify({ provider, key }) }, user.token);
      setAdminKeyInputs(prev => ({ ...prev, [provider]: '' }));
      await loadAdminKeys();
    } catch (e: any) { alert(`Failed: ${e?.message || e}`); }
    finally { setAdminSaving(''); }
  };

  const deleteAdminKey = async (provider: string) => {
    if (!user || !confirm(`Remove platform key for ${provider}?`)) return;
    try { await apiFetch(`/admin/platform-keys/${provider}`, { method:'DELETE' }, user.token); await loadAdminKeys(); } catch (e: any) { alert(e?.message); }
  };

  const toggleAdminModel = async (modelId: string, enabled: boolean) => {
    if (!user) return;
    try {
      await apiFetch(`/admin/models/${modelId}`, { method:'PATCH', body:JSON.stringify({ enabled: enabled ? 1 : 0 }) }, user.token);
      setAdminModels(prev => prev.map(m => m.id === modelId ? { ...m, enabled: enabled ? 1 : 0 } : m));
    } catch (e: any) { alert(e?.message); }
  };

  const changeUserRole = async (userId: string, role: string) => {
    if (!user) return;
    try {
      await apiFetch(`/admin/users/${userId}`, { method:'PATCH', body:JSON.stringify({ role }) }, user.token);
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e: any) { alert(e?.message); }
  };

  // ── Save a single provider's API key ──────────────────────────────────────
  const saveOneKey = async (provider: string, key: string) => {
    if (!user) return;
    const trimmed = key.trim();
    if (!trimmed) { alert('Please paste a key first.'); return; }
    try {
      await apiFetch('/keys', { method:'POST', body:JSON.stringify({ [`${provider}_key`]: trimmed }) }, user.token);
      setKeysSaved(true); setTimeout(() => setKeysSaved(false), 3000);
      setSavedProviders(prev => ({ ...prev, [provider]: true }));
      // Refresh vault + api key flags
      await loadVault();
      await loadApiKeys();
      // Validate immediately -- shows Active/Invalid badge right away
      await validateVaultKey(provider);
      // Fetch latest models for this provider from its API
      await loadProviderModels(provider);
    } catch (e: any) {
      alert(`Save failed: ${e?.message || String(e)}`);
    }
  };
  // Legacy alias used in some places
  const saveApiKeys = async () => {
    // Save whichever keys are currently non-empty in apiKeys state
    if (!user) return;
    const body: Record<string,string> = {};
    Object.entries(apiKeys).forEach(([p, k]) => {
      if (k && k !== '__saved__' && k.trim().length > 0) body[`${p}_key`] = k.trim();
    });
    if (!Object.keys(body).length) { alert('No key to save.'); return; }
    try {
      await apiFetch('/keys', { method:'POST', body:JSON.stringify(body) }, user.token);
      setKeysSaved(true); setTimeout(() => setKeysSaved(false), 3000);
      await loadApiKeys();
    } catch (e: any) { alert(`Save failed: ${e?.message || e}`); }
  };

  // ── Terminal execution ────────────────────────────────────────────────────
  const runTerminalCommand = async (cmd: string) => {
    if (!user || !cmd.trim() || terminalRunning) return;
    const trimmed = cmd.trim();
    setTerminalLines(prev => [...prev, { text:`$ ${trimmed}`, type:'input' }]);
    setTerminalHistory(prev => [trimmed, ...prev.filter(c => c !== trimmed)].slice(0, 50));
    setTerminalHistoryIdx(-1);
    setTerminalInput('');
    setTerminalRunning(true);
    try {
      const d = await apiFetch('/terminal/exec', { method:'POST', body:JSON.stringify({ command:trimmed }) }, user.token);
      if (d?.output) {
        const lines = d.output.split('\n');
        setTerminalLines(prev => [...prev, ...lines.map((l: string) => ({ text: l, type: d.exit_code === 0 ? 'output' as const : 'error' as const }))]);
      } else {
        setTerminalLines(prev => [...prev, { text:'(no output)', type:'output' }]);
      }
    } catch (e: any) {
      setTerminalLines(prev => [...prev, { text:`Error: ${e.message}`, type:'error' }]);
    }
    setTerminalRunning(false);
  };

  // ── Browser navigation ────────────────────────────────────────────────────
  const browserNavigate = async (url: string) => {
    let nav = url.trim();
    if (!nav.startsWith('http://') && !nav.startsWith('https://')) {
      nav = nav.includes('.') ? `https://${nav}` : `https://www.google.com/search?q=${encodeURIComponent(nav)}`;
    }
    setBrowserHistory(prev => { const next = [...prev.slice(0, browserHistoryIdx + 1), nav]; setBrowserHistoryIdx(next.length - 1); return next; });
    setBrowserUrl(nav);
    setBrowserInput(nav);

    if (browserMode === 'proxy') {
      setBrowserLoading(true);
      setBrowserPage(null);
      try {
        const d = await apiFetch('/browser/fetch', { method:'POST', body: JSON.stringify({ url: nav }) }, user?.token || '');
        if (d?.error) {
          setBrowserPage({ title:'Error', text: d.error, links:[], url: nav, status: 0, error: d.error });
        } else {
          setBrowserPage({ title: d.title || nav, text: d.text || '', links: d.links || [], url: nav, status: d.status || 200 });
        }
      } catch (e: any) {
        setBrowserPage({ title:'Error', text: e.message, links:[], url: nav, status: 0, error: e.message });
      }
      setBrowserLoading(false);
    }
  };

  // SuperAgent run via SSE
  const runAgent = async () => {
    if (!agentInput.trim() || agentRunning || !user) return;
    const prompt = agentInput.trim();
    setAgentInput('');
    setAgentRunning(true);
    setAgentMessages(prev => [...prev, { role:'user', content: prompt }]);

    try {
      const token = user.token;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-e4d6.up.railway.app'}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt, model: selectedModel }),
      });

      if (!resp.ok || !resp.body) throw new Error(`Agent error: ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'tool_call') {
              setAgentMessages(prev => [...prev, { role:'tool', content: `Using **${evt.tool}**${evt.reasoning ? ` -- ${evt.reasoning}` : ''}`, tool: evt.tool, args: evt.args }]);
            } else if (evt.type === 'tool_result') {
              setAgentMessages(prev => [...prev, { role:'tool_result', content: evt.result, tool: evt.tool }]);
            } else if (evt.type === 'response') {
              setAgentMessages(prev => [...prev, { role:'agent', content: evt.content }]);
            } else if (evt.type === 'error') {
              setAgentMessages(prev => [...prev, { role:'error', content: evt.message }]);
            }
            setTimeout(() => agentScrollRef.current?.scrollTo({ top: 99999, behavior:'smooth' }), 50);
          } catch {}
        }
      }
    } catch (e: any) {
      setAgentMessages(prev => [...prev, { role:'error', content: e.message }]);
    }
    setAgentRunning(false);
  };

  // ── Projects ───────────────────────────────────────────────────────────────
  const createProject = async () => {
    if (!user || !newProjName.trim()) return;
    try {
      await apiFetch('/projects', { method:'POST', body:JSON.stringify({ name:newProjName, color:newProjColor, system_prompt:newProjPrompt }) }, user.token);
      await loadProjects();
      setShowNewProject(false); setNewProjName(''); setNewProjColor('var(--fg-orange)'); setNewProjPrompt('');
    } catch (e: any) { alert(e.message); }
  };

  const togglePin = async (p: Project) => {
    if (!user) return;
    try { await apiFetch(`/projects/${p.id}`, { method:'PATCH', body:JSON.stringify({ pinned:p.pinned ? 0 : 1 }) }, user.token); await loadProjects(); } catch {}
  };

  const selectProject = async (p: Project) => { setActiveProject(p); await loadThreads(p.id); };

  // ── Thread actions ────────────────────────────────────────────────────────
  const deleteThread = async (id: string) => {
    if (!user || !confirm('Delete this conversation?')) return;
    try {
      await apiFetch(`/threads/${id}`, { method:'DELETE' }, user.token);
      if (activeThread?.id === id) { setActiveThread(null); setMessages([]); setThreadStats(null); }
      await loadThreads(activeProject?.id);
    } catch (e: any) { alert(e.message); }
  };
  const pinThread = async (t: Thread) => {
    if (!user) return;
    try { await apiFetch(`/threads/${t.id}`, { method:'PATCH', body:JSON.stringify({ pinned: t.pinned ? 0 : 1 }) }, user.token); await loadThreads(activeProject?.id); } catch {}
  };
  const archiveThread = async (t: Thread) => {
    if (!user) return;
    try { await apiFetch(`/threads/${t.id}`, { method:'PATCH', body:JSON.stringify({ archived: t.archived ? 0 : 1 }) }, user.token); await loadThreads(activeProject?.id); } catch {}
  };
  const renameThread = async () => {
    if (!user || !renamingThread || !renamingThread.title.trim()) return;
    try {
      await apiFetch(`/threads/${renamingThread.id}`, { method:'PATCH', body:JSON.stringify({ title: renamingThread.title.trim() }) }, user.token);
      if (activeThread?.id === renamingThread.id) setActiveThread(prev => prev ? { ...prev, title: renamingThread.title.trim() } : prev);
      setRenamingThread(null); await loadThreads(activeProject?.id);
    } catch (e: any) { alert(e.message); }
  };

  // ── Key vault actions ─────────────────────────────────────────────────────
  const updateVaultKey = async (provider: string) => {
    if (!user) return;
    const key = vaultUpdateInputs[provider]?.trim();
    if (!key) { alert('Paste new key first'); return; }
    setVaultUpdating(provider);
    try {
      await apiFetch(`/keys/${provider}`, { method:'PATCH', body:JSON.stringify({ key }) }, user.token);
      setVaultUpdateInputs(prev => ({ ...prev, [provider]: '' }));
      await loadVault();
      await loadApiKeys();
      // Validate immediately after update
      await validateVaultKey(provider);
      // Fetch latest models for this provider
      await loadProviderModels(provider);
    } catch (e: any) { alert(e.message); }
    finally { setVaultUpdating(''); }
  };
  const toggleVaultKeyStatus = async (v: VaultKey) => {
    if (!user) return;
    const next = v.key_status === 'active' ? 'inactive' : 'active';
    try {
      await apiFetch(`/keys/${v.provider}`, { method:'PATCH', body:JSON.stringify({ status: next }) }, user.token);
      setVaultKeys(prev => prev.map(k => k.provider === v.provider ? { ...k, key_status: next } : k));
      setSavedProviders(prev => ({ ...prev, [v.provider]: next === 'active' }));
    } catch {}
  };
  const validateVaultKey = async (provider: string) => {
    if (!user) return;
    setVaultValidating(prev => ({ ...prev, [provider]: true }));
    try {
      const d = await apiFetch(`/keys/${provider}/validate`, { method:'POST' }, user.token);
      const status: 'active'|'inactive' = d.valid ? 'active' : 'inactive';
      setVaultKeys(prev => prev.map(k => k.provider === provider ? { ...k, key_status: status } : k));
    } catch {}
    setVaultValidating(prev => ({ ...prev, [provider]: false }));
  };
  const deleteVaultKey = async (provider: string) => {
    if (!user || !confirm(`Remove ${provider} key?`)) return;
    try {
      await apiFetch(`/keys/${provider}`, { method:'DELETE' }, user.token);
      setVaultKeys(prev => prev.filter(k => k.provider !== provider));
      setSavedProviders(prev => ({ ...prev, [provider]: false }));
    } catch (e: any) { alert(e.message); }
  };

  // ── SuperAgent actions ────────────────────────────────────────────────────
  const harvestMemory = async () => {
    if (!user) return;
    setSuperHarvesting(true);
    try {
      const d = await apiFetch('/superagent/harvest', { method:'POST' }, user.token);
      await loadSuperMemory();
      try { const s = await apiFetch('/superagent/stats', {}, user.token); if (s?.data) setSuperStats(s.data); } catch {}
      alert(d?.data?.message || `✅ Harvest complete! Intelligence: ${d?.data?.intelligenceScore || '+'}`);
    } catch (e: any) { alert(e.message); }
    finally { setSuperHarvesting(false); }
  };
  const sendSuperMessage = async () => {
    if (!user || !superInput.trim() || superSending) return;
    const content = superInput.trim(); setSuperInput(''); setSuperSending(true);
    setSuperMessages(prev => [...prev, { role:'user', content }]);
    try {
      const cleanModel = selectedModel.startsWith('openrouter/') ? selectedModel.slice('openrouter/'.length) : selectedModel;
      const d = await apiFetch('/superagent/chat', { method:'POST', body:JSON.stringify({ message: content, model: cleanModel }) }, user.token);
      setSuperMessages(prev => [...prev, { role:'assistant', content: d?.data?.content || '' }]);
      loadTotalTokens();
      // Refresh stats after each exchange
      try { const s = await apiFetch('/superagent/stats', {}, user.token); if (s?.data) setSuperStats(s.data); } catch {}
    } catch (e: any) { setSuperMessages(prev => [...prev, { role:'assistant', content:`⚠️ ${e.message}` }]); }
    finally { setSuperSending(false); }
  };
  const deleteMemoryEntry = async (id: string) => {
    if (!user) return;
    try { await apiFetch(`/superagent/memory/${id}`, { method:'DELETE' }, user.token); setSuperMemory(prev => prev.filter(m => m.id !== id)); } catch {}
  };

  // ── Threads ────────────────────────────────────────────────────────────────
  const newThread = async (title?: string): Promise<Thread|null> => {
    if (!user) return null;
    try {
      const body: any = { title: title || 'New conversation' };
      if (activeProject) body.project_id = activeProject.id;
      if (selectedModel) body.model = selectedModel.startsWith('openrouter/') ? selectedModel.slice('openrouter/'.length) : selectedModel;
      const d = await apiFetch('/threads', { method:'POST', body:JSON.stringify(body) }, user.token);
      const t: Thread = (d?.data && typeof d.data === 'object' && d.data.id) ? d.data : (d?.id ? d : null);
      if (!t) throw new Error('Failed to create thread -- unexpected response');
      await loadThreads(activeProject?.id); setActiveThread(t); setMessages([]);
      return t;
    } catch (e: any) { 
      console.error('newThread error:', e.message);
      // Fallback: create thread with minimal data
      try {
        const fallback = await apiFetch('/threads', { method:'POST', body:JSON.stringify({ title: title || 'New conversation' }) }, user.token);
        const t2: Thread = fallback?.data || fallback;
        if (t2?.id) { await loadThreads(activeProject?.id); setActiveThread(t2); setMessages([]); return t2; }
      } catch {}
      return null; 
    }
  };

  const selectThread = async (t: Thread) => { setActiveThread(t); await loadMessages(t.id); loadThreadTokenStats(t.id); };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!user || !input.trim() || sending) return;
    let currentThread = activeThread;
    if (!currentThread) {
      // Create thread titled from first message, then immediately send
      const title = input.trim().slice(0, 60);
      currentThread = await newThread(title);
      if (!currentThread) return;
    }

    // Build content with attached files
    let userContent = input.trim();
    if (attachedFiles.length > 0) {
      const fileContext = attachedFiles.map(f => `\n\n---\n📎 **${f.name}**:\n\`\`\`\n${f.content}\n\`\`\``).join('');
      userContent += fileContext;
      setAttachedFiles([]); // Clear after send
    }
    setInput(''); setVoiceTranscript('');
    setSending(true); setTyping(true);
    setMultiResponses([]);
    // Auto-open live tab so user sees thinking indicator
    if (!rightExpanded || rightTab !== 'live') { setRightTab('live'); setRightExpanded(true); }

    const tempUser: Message = { id:'tmp-u', thread_id:currentThread.id, role:'user', content:userContent, created_at:new Date().toISOString() };
    setMessages(prev => [...prev, tempUser]);

    // Multi-response mode: query 3 models in parallel
    if (multiResponse) {
      const modelsToQuery = ['claude-sonnet-4','gpt-4o','gemini-2.0-flash'];
      try {
        const results = await Promise.allSettled(modelsToQuery.map(m =>
          apiFetch(`/threads/${currentThread!.id}/messages`, { method:'POST', body:JSON.stringify({ content:userContent, model:m, agent_ids:activeAgentIds }) }, user.token)
        ));
        const responses = results.map((r, i) => ({
          model: modelsToQuery[i],
          content: r.status === 'fulfilled' ? (r.value?.assistant_message?.content || 'No response') : `Error: ${(r as any).reason?.message}`
        }));
        setMultiResponses(responses);
        await loadMessages(currentThread!.id);
        await loadArtifacts();
      } catch {}
      setSending(false); setTyping(false);
      return;
    }

    try {
      const cleanModel = selectedModel.startsWith('openrouter/') ? selectedModel.slice('openrouter/'.length) : selectedModel;
      const body: any = { content:userContent, model:cleanModel, agent_ids:activeAgentIds };
      let threadId = currentThread.id;
      try {
        await apiFetch(`/threads/${threadId}/messages`, { method:'POST', body:JSON.stringify(body) }, user.token);
      } catch (e: any) {
        // Thread was wiped (Railway redeploy) -- create a fresh one and retry
        if (e.message?.includes('THREAD_NOT_FOUND') || e.message?.includes('404')) {
          const fresh = await apiFetch('/threads', { method:'POST', body:JSON.stringify({ title: userContent.slice(0,60), model: cleanModel }) }, user.token);
          const newT = fresh?.data || fresh;
          threadId = newT.id;
          setActiveThread(newT);
          await apiFetch(`/threads/${threadId}/messages`, { method:'POST', body:JSON.stringify(body) }, user.token);
          await loadThreads(activeProject?.id);
        } else { throw e; }
      }
      await loadMessages(threadId);
      await loadArtifacts();
      await loadThreads(activeProject?.id);
      loadThreadTokenStats(threadId);
      loadTotalTokens();
      // Auto-extract memory from this exchange (fire-and-forget)
      try {
        const memTopic = userContent.slice(0, 80);
        const freshForMem = await apiFetch(`/threads/${threadId}/messages`, {}, user.token);
        const memArr = Array.isArray(freshForMem) ? freshForMem : Array.isArray(freshForMem?.data) ? freshForMem.data : [];
        const lastAIMsg = memArr.filter((m: any) => m.role === 'assistant').pop();
        if (lastAIMsg?.content) {
          const insight = lastAIMsg.content.slice(0, 200).replace(/\n/g, ' ');
          await apiFetch(`/threads/${threadId}/memory`, { method:'POST', body: JSON.stringify({ topic: memTopic, insight }) }, user.token);
        }
      } catch {}
      // Auto-execute model actions: [TERMINAL: cmd] and [BROWSER: url]
      try {
        const freshMsgs = await apiFetch(`/threads/${threadId}/messages`, {}, user.token);
        const freshArr = Array.isArray(freshMsgs) ? freshMsgs : Array.isArray(freshMsgs?.data) ? freshMsgs.data : [];
        const lastAI = freshArr.filter((m: any) => m.role === 'assistant').pop();
        if (lastAI?.content) {
          const termMatch = lastAI.content.match(/\[TERMINAL:\s*([^\]]+)\]/i);
          if (termMatch) { setRightTab('terminal'); setRightExpanded(true); runTerminalCommand(termMatch[1].trim()); }
          const browserMatch = lastAI.content.match(/\[BROWSER:\s*([^\]]+)\]/i);
          if (browserMatch) { setRightTab('browser'); setRightExpanded(true); browserNavigate(browserMatch[1].trim()); }
        }
      } catch {}
      if (sketchMode) {
        const fresh = await apiFetch('/artifacts', {}, user.token);
        const arr = Array.isArray(fresh) ? fresh : Array.isArray(fresh?.data) ? fresh.data : [];
        if (arr.length > 0) { setSketchArtifact(arr[0]); setPreviewCode(arr[0].content); }
      }
    } catch (e: any) {
      // Strip raw provider prefixes like "Anthropic error: " for clean display
      const raw: string = e.message || 'Something went wrong';
      const clean = raw
        .replace(/^(anthropic|openai|google|groq|mistral|openrouter) error:\s*/i, '')
        .replace(/^\{"type":"error".*?"message":"([^"]+)".*\}$/i, '$1')
        .trim();
      const errMsg: Message = { id:'tmp-err', thread_id:currentThread.id, role:'assistant', content:`⚠️ ${clean}`, created_at:new Date().toISOString() };
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
  const taskStatusColor: Record<string, string> = { todo:'var(--fg-text2)', in_progress:'var(--fg-blue)', done:'var(--fg-green)', blocked:'var(--fg-red)' };
  const taskPriorityColor: Record<string, string> = { low:'var(--fg-text2)', medium:'var(--fg-orange)', high:'var(--fg-red)' };
  const artifactTypeIcon: Record<string, string> = { code:'💻', html:'🌐', react:'⚛️', markdown:'📝', 'live-dashboard':'📊', diff:'📋', default:'📄' };
  const filteredOrModels = openRouterModels
    .filter(m => {
      const text = (m.id+' '+(m.name||'')).toLowerCase();
      if (!text.includes(orSearch.toLowerCase())) return false;
      const isFree = m.pricing?.prompt === '0' || m.pricing?.prompt === '0.0' || m.id.includes(':free');
      if (orFilter === 'free') return isFree;
      if (orFilter === 'paid') return !isFree;
      return true;
    })
    .sort((a, b) => {
      if (orSort === 'price_asc') return parseFloat(a.pricing?.prompt||'9999') - parseFloat(b.pricing?.prompt||'9999');
      if (orSort === 'price_desc') return parseFloat(b.pricing?.prompt||'0') - parseFloat(a.pricing?.prompt||'0');
      if (orSort === 'context') return (b.context_length||0) - (a.context_length||0);
      return (a.name||a.id).localeCompare(b.name||b.id);
    });
  const usagePercent = subscription ? Math.min(100, Math.round((subscription.tokens_used / (subscription.token_limit || 1)) * 100)) : 0;

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--fg-bg)', color:'var(--fg-text)', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow:'hidden' }} onClick={() => setThreadMenu(null)}>

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <div style={{ width:sidebarExpanded ? 260 : 60, background:'var(--fg-bg)', borderRight:'1px solid var(--fg-border)', display:'flex', flexDirection:'column', flexShrink:0, transition:'width 0.2s', overflow:'hidden' }}>
        {/* Logo + collapse */}
        <div style={{ padding:'16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--fg-border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
            <div style={{ width:32, height:32, background:'var(--fg-orange)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>⚡</div>
            {sidebarExpanded && <span style={{ fontWeight:800, fontSize:16, color:'var(--fg-orange)', whiteSpace:'nowrap', fontFamily:'var(--fg-font-display)', letterSpacing:'-0.3px' }}>Forge</span>}
          </div>
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:16, padding:4 }}>{sidebarExpanded ? '◀' : '▶'}</button>
        </div>

        {/* Nav tabs */}
        <div style={{ padding:'8px', borderBottom:'1px solid var(--fg-border)' }}>
          {(([
            { id:'workspace', icon:'💬', label:'Workspace' },
            { id:'router', icon:'🔀', label:'ForgeRouter' },
            { id:'billing', icon:'💳', label:'Billing' },
            { id:'platforms', icon:'🌐', label:'Platforms' },
            { id:'settings', icon:'⚙️', label:'Settings' },
            { id:'super', icon:'🌟', label:'Forge Super' },
            ...(user.role === 'admin' ? [{ id:'admin', icon:'🛡️', label:'Admin' }] : []),
          ]) as Array<{ id: string; icon: string; label: string }>).map((tab) => (
            <button key={tab.id} onClick={() => { setMainTab(tab.id as any); if (tab.id === 'admin') { loadAdminStats(); loadAdminUsers(); loadAdminKeys(); loadAdminModels(); } if (tab.id === 'super') { loadSuperMemory(); loadSuperHistory(); } if (tab.id === 'settings') { loadVault(); } }} title={tab.label} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:mainTab===tab.id ? 'var(--fg-bg4)' : 'transparent', border:'none', borderRadius:6, color:mainTab===tab.id ? (tab.id==='admin' ? 'var(--fg-orange2)' : tab.id==='super' ? 'var(--fg-orange2)' : 'var(--fg-orange2)') : 'var(--fg-text2)', cursor:'pointer', fontSize:13, fontWeight:mainTab===tab.id ? 600 : 400, marginBottom:2, justifyContent:sidebarExpanded ? 'flex-start' : 'center' }}>
              <span style={{ fontSize:16 }}>{tab.icon}</span>
              {sidebarExpanded && tab.label}
            </button>
          ))}
        </div>

        {/* Workspace sidebar content */}
        {mainTab === 'workspace' && sidebarExpanded && (
          <>
            <div style={{ padding:'10px 10px 0' }}>
              <button onClick={newThread} style={{ width:'100%', padding:'10px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-orange)', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                <span>✏️</span>New conversation
              </button>
            </div>

            {pinnedProjects.length > 0 && (
              <div style={{ padding:'16px 12px 4px' }}>
                <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>Pinned</p>
                {pinnedProjects.map(p => (
                  <div key={p.id} onClick={() => selectProject(p)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:6, cursor:'pointer', background:activeProject?.id===p.id ? 'var(--fg-bg4)' : 'transparent', marginBottom:2 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                    <span style={{ fontSize:13, color:'var(--fg-text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                    <button onClick={e => { e.stopPropagation(); togglePin(p); }} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:2 }}>📌</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding:'12px 12px 4px', flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>{activeProject ? activeProject.name : 'Recent'}</p>
              <div style={{ flex:1, overflowY:'auto' }}>
                {/* Pinned threads first */}
                {threads.filter(t => t.pinned && !t.archived).map(t => (
                  <div key={t.id} style={{ position:'relative' }}
                    onContextMenu={e => { e.preventDefault(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }}>
                    <div onClick={() => selectThread(t)}
                      onMouseEnter={e => { const b = e.currentTarget.querySelector('.thread-menu-btn') as HTMLElement; if (b) b.style.opacity='1'; }}
                      onMouseLeave={e => { const b = e.currentTarget.querySelector('.thread-menu-btn') as HTMLElement; if (b) b.style.opacity='0'; }}
                      style={{ padding:'7px 8px 5px', borderRadius:6, cursor:'pointer', marginBottom:1, background:activeThread?.id===t.id ? 'var(--fg-bg4)' : 'var(--fg-bg)', border:'1px solid var(--fg-border2)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ fontSize:10 }}>📌</span>
                        <p style={{ margin:0, fontSize:13, color:activeThread?.id===t.id ? 'var(--fg-orange2)' : 'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{t.title}</p>
                        <button onClick={e => { e.stopPropagation(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11, padding:'0 2px', opacity:0, transition:'opacity 0.15s' }} className="thread-menu-btn">•••</button>
                      </div>
                      {t.total_tokens ? <p style={{ margin:'2px 0 0 14px', fontSize:10, color:'var(--fg-text3)' }}>{t.total_tokens >= 1000 ? (t.total_tokens/1000).toFixed(1)+'k' : t.total_tokens} tokens</p> : null}
                    </div>
                  </div>
                ))}
                {/* Regular threads */}
                {threads.filter(t => !t.pinned && !t.archived).slice(0, 30).map(t => (
                  <div key={t.id} style={{ position:'relative' }}
                    onContextMenu={e => { e.preventDefault(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }}>
                    <div onClick={() => selectThread(t)} style={{ padding:'7px 8px 5px', borderRadius:6, cursor:'pointer', marginBottom:1, background:activeThread?.id===t.id ? 'var(--fg-bg4)' : 'transparent' }}
                      onMouseEnter={e => { (e.currentTarget.querySelector('.thread-menu-btn') as any)?.style && ((e.currentTarget.querySelector('.thread-menu-btn') as any).style.opacity = '1'); }}
                      onMouseLeave={e => { (e.currentTarget.querySelector('.thread-menu-btn') as any)?.style && ((e.currentTarget.querySelector('.thread-menu-btn') as any).style.opacity = '0'); }}>
                      <div style={{ display:'flex', alignItems:'center' }}>
                        <p style={{ margin:0, fontSize:13, color:activeThread?.id===t.id ? 'var(--fg-orange2)' : 'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{t.title}</p>
                        <button onClick={e => { e.stopPropagation(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11, padding:'0 2px', opacity:0, transition:'opacity 0.15s' }} className="thread-menu-btn">•••</button>
                      </div>
                      {t.total_tokens ? <p style={{ margin:'2px 0 0', fontSize:10, color:'var(--fg-text3)' }}>{t.total_tokens >= 1000 ? (t.total_tokens/1000).toFixed(1)+'k' : t.total_tokens} tokens</p> : null}
                    </div>
                  </div>
                ))}
                {threads.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:12, padding:'4px 8px' }}>No conversations yet</p>}
              </div>
            </div>

            <div style={{ padding:'0 12px 8px', borderTop:'1px solid var(--fg-border)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0 6px' }}>
                <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:0 }}>Projects</p>
                <button onClick={() => setShowNewProject(true)} style={{ background:'none', border:'none', color:'var(--fg-orange)', cursor:'pointer', fontSize:16, lineHeight:1 }}>+</button>
              </div>
              {unpinnedProjects.slice(0, 8).map(p => (
                <div key={p.id} onClick={() => selectProject(p)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6, cursor:'pointer', background:activeProject?.id===p.id ? 'var(--fg-bg4)' : 'transparent', marginBottom:1 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'var(--fg-text2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                  <button onClick={e => { e.stopPropagation(); togglePin(p); }} style={{ background:'none', border:'none', color:'transparent', cursor:'pointer', fontSize:11, padding:2 }} title="Pin">📌</button>
                </div>
              ))}
              {projects.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:12, padding:'2px 8px' }}>No projects yet</p>}
            </div>
          </>
        )}

        {/* User profile + version */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid var(--fg-border)', display:'flex', alignItems:'center', gap:8, marginTop:'auto' }}>
          <div style={{ width:32, height:32, background:'var(--fg-bg4)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>👤</div>
          {sidebarExpanded && (
            <>
              <div style={{ flex:1, overflow:'hidden' }}>
                <p style={{ margin:0, fontSize:13, color:'var(--fg-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name || user.email}</p>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {subscription && <p style={{ margin:0, fontSize:11, color:'var(--fg-orange)' }}>{subscription.plan} plan</p>}
                  <span style={{ fontSize:10, color:'var(--fg-border2)', background:'var(--fg-bg4)', padding:'1px 5px', borderRadius:4, border:'1px solid var(--fg-border2)', fontFamily:'monospace' }}>v5.8</span>
                </div>
              </div>
              <button onClick={handleLogout} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12 }}>↗</button>
            </>
          )}
          {!sidebarExpanded && <span style={{ fontSize:9, color:'var(--fg-border2)', fontFamily:'monospace' }}>5.6</span>}
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── WORKSPACE TAB ─────────────────────────────────────────────────── */}
        {mainTab === 'workspace' && (
          <>
            {/* Top bar */}
            <div style={{ padding:'0 16px', height:52, background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <div style={{ flex:1, overflow:'hidden', display:'flex', alignItems:'center', gap:10 }}>
                <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:'var(--fg-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {activeThread ? activeThread.title : activeProject ? activeProject.name : 'Forge Workspace'}
                </h2>
                {/* Mini sparkline -- token usage per message in current thread */}
                {threadStats && threadStats.token_history.length > 0 && (() => {
                  const vals = threadStats.token_history.map(h => h.tokens);
                  const max = Math.max(...vals, 1);
                  const w = 6; const gap = 2; const h = 20;
                  return (
                    <svg width={vals.length * (w + gap)} height={h} style={{ flexShrink:0, opacity:0.7 }} title={`${threadStats.total_tokens.toLocaleString()} tokens total`}>
                      {vals.map((v, i) => {
                        const barH = Math.max(2, Math.round((v / max) * h));
                        const color = v === max ? 'var(--fg-orange2)' : 'var(--fg-border2)';
                        return <rect key={i} x={i*(w+gap)} y={h-barH} width={w} height={barH} rx={2} fill={color} />;
                      })}
                    </svg>
                  );
                })()}
                {/* Thread token total pill */}
                {threadStats && threadStats.total_tokens > 0 && (
                  <span style={{ fontSize:10, color:'var(--fg-text3)', background:'var(--fg-bg4)', padding:'2px 6px', borderRadius:10, whiteSpace:'nowrap', flexShrink:0 }}>
                    {threadStats.total_tokens >= 1000 ? (threadStats.total_tokens/1000).toFixed(1)+'k' : threadStats.total_tokens}t
                  </span>
                )}
              </div>
              {/* Global token counter -- always visible */}
              <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'var(--fg-bg4)', borderRadius:8, border:'1px solid var(--fg-border2)', flexShrink:0 }}>
                <span style={{ fontSize:10 }}>⚡</span>
                <span style={{ fontSize:11, color: totalTokens > 0 ? 'var(--fg-orange)' : 'var(--fg-text3)', fontWeight:600 }}>
                  {totalTokens >= 1000000 ? (totalTokens/1000000).toFixed(1)+'M' : totalTokens >= 1000 ? (totalTokens/1000).toFixed(0)+'k' : totalTokens || '0'}
                </span>
                <span style={{ fontSize:10, color:'var(--fg-text3)' }}>tokens</span>
              </div>
              {/* Sketch toggle */}
              <button onClick={() => setSketchMode(!sketchMode)} title="Live Preview" style={{ padding:'5px 10px', background:sketchMode ? 'var(--fg-border)' : 'transparent', border:`1px solid ${sketchMode ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:6, color:sketchMode ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:12, flexShrink:0 }}>✏️ Sketch</button>

              {/* Multi-response toggle */}
              <button onClick={() => setMultiResponse(!multiResponse)} title="Multiple responses" style={{ padding:'5px 10px', background:multiResponse ? 'var(--fg-border)' : 'transparent', border:`1px solid ${multiResponse ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:6, color:multiResponse ? 'var(--fg-orange)' : 'var(--fg-text2)', cursor:'pointer', fontSize:12, flexShrink:0 }}>⚡ Multi</button>

              {/* Model selector -- shows models from all providers with saved keys */}
              {(() => {
                const providerForId = (id: string) => {
                  if (['forge-ultra','forge-pro','forge-flash','forge-code'].includes(id) || id.startsWith('claude')) return 'anthropic';
                  if (['forge-gpt'].includes(id) || id.startsWith('gpt') || id.startsWith('o3') || id.startsWith('o4')) return 'openai';
                  if (['forge-gemini'].includes(id) || id.startsWith('gemini')) return 'gemini';
                  if (id.startsWith('llama') || id.startsWith('mixtral') || id === 'forge-fast') return 'groq';
                  if (id.startsWith('mistral')) return 'mistral';
                  return null;
                };
                const hasKey = (id: string) => { const p = providerForId(id); return !p || !!savedProviders[p]; };
                const availableForge = FORGE_MODELS.filter(m => hasKey(m.id));
                const availableDirect = DIRECT_MODELS.map(g => ({ ...g, models: g.models.filter(m => hasKey(m.id)) })).filter(g => g.models.length > 0);
                // Dynamic models from other providers (anthropic, openai, gemini, groq, mistral, etc.)
                const dynamicGroups = Object.entries(providerModels)
                  .filter(([p]) => p !== 'openrouter' && savedProviders[p] && providerModels[p]?.length > 0)
                  .map(([p, models]) => ({
                    provider: p,
                    label: p.charAt(0).toUpperCase() + p.slice(1),
                    models: models.slice(0, 30),
                  }));
                const orModels = providerModels['openrouter'] || openRouterModels;
                const noKeys = availableForge.length === 0 && availableDirect.length === 0 && dynamicGroups.length === 0;
                return (
                  <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:8, color: noKeys && orModels.length === 0 ? 'var(--fg-text2)' : 'var(--fg-orange2)', padding:'6px 10px', fontSize:12, cursor:'pointer', maxWidth:240 }}>
                    {noKeys && orModels.length === 0 && <option value="">⚠ Add an API key in Settings</option>}
                    {availableForge.length > 0 && <optgroup label="⚡ Forge Models">{availableForge.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</optgroup>}
                    {availableDirect.map(grp => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </optgroup>
                    ))}
                    {dynamicGroups.map(grp => (
                      <optgroup key={grp.provider} label={`🔥 ${grp.label} (live)`}>
                        {grp.models.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
                      </optgroup>
                    ))}
                    {orModels.length > 0 && (() => {
                      // Group OR models by provider prefix for the dropdown
                      const orGrouped: Record<string, typeof orModels> = {};
                      orModels.forEach(m => {
                        const grpKey = m.id.includes('/') ? m.id.split('/')[0] : 'other';
                        if (!orGrouped[grpKey]) orGrouped[grpKey] = [];
                        orGrouped[grpKey].push(m);
                      });
                      return Object.entries(orGrouped).sort(([a],[b]) => a.localeCompare(b)).map(([grp, ms]) => (
                        <optgroup key={`or-${grp}`} label={`🔀 OR · ${grp}`}>
                          {ms.sort((a,b) => (a.name||a.id).localeCompare(b.name||b.id)).map(m => {
                            const isFree = m.id.includes(':free') || m.pricing?.prompt === '0';
                            return <option key={m.id} value={m.id}>{isFree ? '🆓 ' : ''}{m.name || m.id}</option>;
                          })}
                        </optgroup>
                      ));
                    })()}
                  </select>
                );
              })()}

              <button onClick={() => setRightExpanded(!rightExpanded)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:14 }}>{rightExpanded ? '▶' : '◀'}</button>
            </div>

            <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
              {/* Messages + sketch */}
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                {/* Sketch / live preview panel */}
                {sketchMode && (
                  <div style={{ height:'40%', borderBottom:'1px solid var(--fg-border)', display:'flex', overflow:'hidden' }}>
                    <div style={{ flex:1, padding:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:12, color:'var(--fg-orange)', fontWeight:600 }}>✏️ Live Preview</span>
                        {artifacts.length > 0 && (
                          <select onChange={e => { const a = artifacts.find(x => x.id === e.target.value); if (a) { setSketchArtifact(a); setPreviewCode(a.content); } }} style={{ flex:1, padding:'4px 8px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:12 }}>
                            <option value="">Select artifact...</option>
                            {artifacts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                          </select>
                        )}
                      </div>
                      {sketchArtifact?.type === 'html' || sketchArtifact?.type === 'react' ? (
                        <iframe srcDoc={previewCode} style={{ flex:1, border:'1px solid var(--fg-border)', borderRadius:8, background:'#fff' }} title="Live Preview" />
                      ) : (
                        <textarea value={previewCode} onChange={e => setPreviewCode(e.target.value)} style={{ flex:1, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12, padding:10, resize:'none', fontFamily:'monospace' }} placeholder="Artifact preview will appear here. Ask AI to create HTML, React, or code artifacts." />
                      )}
                    </div>
                  </div>
                )}

                {/* Messages canvas */}
                <div style={{ flex:1, overflowY:'auto', padding:'24px 32px', display:'flex', flexDirection:'column', gap:16 }}>
                  {messages.length === 0 && !activeThread && (
                    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                      <div style={{ fontSize:48 }}>⚡</div>
                      <h2 style={{ color:'var(--fg-text)', margin:0, fontSize:24, fontFamily:'var(--fg-font-display)', fontWeight:800, letterSpacing:'-0.5px' }}>What do you want to build?</h2>
                      <p style={{ color:'var(--fg-text3)', margin:0, textAlign:'center', maxWidth:400 }}>Start a conversation, pick a project, or dispatch an agent to work on your next big idea.</p>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginTop:8 }}>
                        {['Write a React component','Research a topic','Build an API endpoint','Create a deployment plan'].map(s => (
                          <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }} style={{ padding:'8px 14px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:20, color:'var(--fg-text2)', fontSize:13, cursor:'pointer' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={m.id || i} style={{ display:'flex', gap:12, alignItems:'flex-start', flexDirection:m.role==='user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:m.role==='user' ? 'var(--fg-orange)' : 'var(--fg-bg4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                        {m.role==='user' ? '👤' : '⚡'}
                      </div>
                      <div style={{ maxWidth:'75%', padding:'12px 16px', borderRadius:m.role==='user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background:m.role==='user' ? 'var(--fg-bg4)' : 'var(--fg-bg3)', border:'1px solid var(--fg-border)', lineHeight:1.6 }}>
                        <p style={{ margin:0, fontSize:14, color:'var(--fg-text)', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{m.content}</p>
                        {m.model && <p style={{ margin:'6px 0 0', fontSize:11, color:'var(--fg-text3)' }}>{m.model}</p>}
                        <div style={{ display:'flex', gap:4, marginTop:6, opacity:0.5, transition:'opacity 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity='0.5')}>
                          <button onClick={() => { navigator.clipboard.writeText(m.content); }} title="Copy"
                            style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:'2px 6px', borderRadius:4, display:'flex', alignItems:'center', gap:3 }}
                            onMouseEnter={e => (e.currentTarget.style.background='var(--fg-border)')}
                            onMouseLeave={e => (e.currentTarget.style.background='none')}>
                            📋 Copy
                          </button>
                          {m.role === 'assistant' && (
                            <button onClick={() => speakText(m.content)} title="Read aloud"
                              style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:'2px 6px', borderRadius:4, display:'flex', alignItems:'center', gap:3 }}
                              onMouseEnter={e => (e.currentTarget.style.background='var(--fg-border)')}
                              onMouseLeave={e => (e.currentTarget.style.background='none')}>
                              🔊 Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      {/* Flash-cycling avatar */}
                      <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, animation:'forge-flash 1.8s ease-in-out infinite', flexShrink:0 }}>⚡</div>
                      <div style={{ padding:'12px 18px', borderRadius:'4px 18px 18px 18px', background:'var(--fg-bg2)', border:'2px solid var(--fg-orange)', animation:'forge-ring 1.8s ease-in-out infinite', display:'flex', alignItems:'center', gap:10 }}>
                        {/* Bouncing dots */}
                        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                          {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--fg-orange)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, animation:'forge-text-flash 1.8s ease-in-out infinite', letterSpacing:'0.05em' }}>thinking…</span>
                      </div>
                    </div>
                  )}

                  {/* Multi-response cards */}
                  {multiResponses.length > 0 && (
                    <div>
                      <p style={{ color:'var(--fg-orange)', fontSize:12, fontWeight:600, margin:'0 0 10px' }}>⚡ Multiple Responses</p>
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        {multiResponses.map((r, i) => (
                          <div key={i} style={{ flex:'1 1 250px', minWidth:200, padding:'12px 14px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12 }}>
                            <p style={{ margin:'0 0 6px', fontSize:11, color:'var(--fg-orange)', fontWeight:600 }}>{r.model}</p>
                            <p style={{ margin:0, fontSize:13, color:'var(--fg-text)', whiteSpace:'pre-wrap', lineHeight:1.5 }}>{r.content.slice(0, 400)}{r.content.length > 400 ? '...' : ''}</p>
                            <button onClick={() => speakText(r.content)} style={{ marginTop:6, background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>🔊</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div style={{ padding:'12px 24px 16px', background:'var(--fg-bg)', borderTop:'1px solid var(--fg-border)' }}>
                  <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                    {agents.filter(a => a.enabled).map(a => (
                      <button key={a.id} onClick={() => toggleAgent(a.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, border:activeAgentIds.includes(a.id) ? `1px solid ${a.color}` : '1px solid var(--fg-border2)', background:activeAgentIds.includes(a.id) ? `${a.color}22` : 'transparent', color:activeAgentIds.includes(a.id) ? a.color : 'var(--fg-text2)', cursor:'pointer', fontSize:12, fontWeight:500, transition:'all 0.15s' }}>
                        <span>{a.icon}</span><span>{a.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Voice indicator */}
                  {voiceActive && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-orange)', borderRadius:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--fg-red)', animation:'pulse 1s infinite' }} />
                      <span style={{ fontSize:12, color:'var(--fg-orange)' }}>Listening… {voiceTranscript ? `"${voiceTranscript.slice(0, 60)}..."` : ''}</span>
                    </div>
                  )}

                  {/* Attached files chips */}
                  {attachedFiles.length > 0 && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                      {attachedFiles.map((f, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 8px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:16, maxWidth:200 }}>
                          <span style={{ fontSize:11 }}>📎</span>
                          <span style={{ fontSize:11, color:'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{f.name}</span>
                          <button onClick={() => setAttachedFiles(prev => prev.filter((_,j) => j !== i))} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:0, lineHeight:1 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ position:'relative', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:12, overflow:'hidden' }}>
                    <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={activeThread ? 'Message... (Shift+Enter for newline)' : 'Start a conversation...'} rows={3} style={{ width:'100%', padding:'14px 16px 44px', background:'transparent', border:'none', color:'var(--fg-text)', fontSize:14, resize:'none', outline:'none', lineHeight:1.6, boxSizing:'border-box' }} />
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
                        {/* Voice button */}
                        <button onClick={toggleVoice} title={voiceActive ? 'Stop recording' : 'Voice input'} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', background:voiceActive ? 'var(--fg-orange)' : 'var(--fg-odim)', border:`1px solid ${voiceActive ? 'var(--fg-orange2)' : 'var(--fg-odim2)'}`, borderRadius:8, color:voiceActive ? '#fff' : 'var(--fg-orange2)', cursor:'pointer', fontSize:12, fontWeight:600, animation:voiceActive ? 'send-pulse 0.9s ease-in-out infinite' : 'none' }}>🎤 {voiceActive ? '● Rec' : 'Voice'}</button>
                        {/* Attach file */}
                        <input ref={fileInputRef} type="file" multiple accept="*/*" style={{ display:'none' }} onChange={async e => {
                          const files = Array.from(e.target.files || []);
                          for (const file of files) {
                            const text = await file.text().catch(() => `[Binary file: ${file.name}]`);
                            setAttachedFiles(prev => [...prev, { name: file.name, content: text.slice(0, 50000) }]);
                          }
                          e.target.value = '';
                        }} />
                        <button onClick={() => fileInputRef.current?.click()} title="Attach files" style={{ display:'flex', alignItems:'center', gap:3, padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>📎 {attachedFiles.length > 0 ? `${attachedFiles.length}` : 'Files'}</button>
                        {/* Quick right panel buttons */}
                        <button onClick={() => { setRightTab('context'); setRightExpanded(true); }} title="Context usage" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>📊</button>
                        <button onClick={() => { setRightTab('live'); setRightExpanded(true); }} title="Live activity" style={{ padding:'4px 8px', background: liveEvents.length > 0 ? 'var(--fg-odim)' : 'transparent', border:`1px solid ${liveEvents.length > 0 ? 'var(--fg-odim2)' : 'var(--fg-border2)'}`, borderRadius:6, color: liveEvents.length > 0 ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:11 }}>📺</button>
                        <button onClick={() => { setRightTab('browser'); setRightExpanded(true); }} title="Browser" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>🌐</button>
                        <button onClick={() => { setRightTab('terminal'); setRightExpanded(true); }} title="Terminal" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>💻</button>
                        <button onClick={() => { setRightTab('dispatch'); setRightExpanded(true); }} title="Dispatch agents" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>🚀</button>
                        <button onClick={() => { setShowNewTask(true); }} title="New task" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>✅</button>
                      </div>
                      <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ width:32, height:32, background:sending ? 'var(--fg-orange)' : input.trim() ? 'var(--fg-orange)' : 'var(--fg-bg4)', border:'none', borderRadius:8, color:'#fff', cursor:input.trim() && !sending ? 'pointer' : 'default', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', animation: sending ? 'send-pulse 0.9s ease-in-out infinite' : 'none', transition:'background 0.2s', flexShrink:0 }}>
                        {sending ? '⚡' : '↑'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel */}
              {rightExpanded && (
                <div style={{ width:360, background:'var(--fg-bg)', borderLeft:'1px solid var(--fg-border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
                  <div style={{ display:'flex', borderBottom:'1px solid var(--fg-border)', padding:'0 2px', overflowX:'auto' }}>
                    {([
                      {id:'artifacts',icon:'📄'},{id:'tasks',icon:'✅'},{id:'context',icon:'📊'},
                      {id:'live',icon:'📺'},{id:'browser',icon:'🌐'},{id:'terminal',icon:'💻'},
                      {id:'agent',icon:'🤖'},{id:'dispatch',icon:'🚀'},{id:'schedule',icon:'⏱'},
                    ] as const).map(tab => (
                      <button key={tab.id} onClick={() => setRightTab(tab.id as any)} title={tab.id} style={{ flex:'0 0 auto', padding:'10px 8px', background:'none', border:'none', borderBottom:rightTab===tab.id ? '2px solid var(--fg-orange)' : '2px solid transparent', color:rightTab===tab.id ? 'var(--fg-orange2)' : 'var(--fg-text3)', cursor:'pointer', fontSize:14 }}>{tab.icon}</button>
                    ))}
                  </div>

                  <div style={{ flex:1, overflowY:'auto', padding:12 }}>
                    {/* ARTIFACTS */}
                    {rightTab==='artifacts' && (
                      <div>
                        <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Artifacts ({artifacts.length})</p>
                        {artifacts.length===0 && <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', marginTop:40 }}>No artifacts yet.<br/>Ask the AI to create code, HTML, or documents.</p>}
                        {artifacts.slice(0,20).map(a => (
                          <div key={a.id} onClick={() => setViewArtifact(a)} style={{ padding:'10px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, marginBottom:6, cursor:'pointer' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                              <span style={{ fontSize:16 }}>{artifactTypeIcon[a.type] || artifactTypeIcon.default}</span>
                              <span style={{ fontSize:13, fontWeight:500, color:'var(--fg-text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                              <span style={{ fontSize:10, color:'var(--fg-text3)', background:'var(--fg-bg4)', padding:'2px 6px', borderRadius:4 }}>v{a.version}</span>
                            </div>
                            <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{a.type} · {new Date(a.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TASKS */}
                    {rightTab==='tasks' && (
                      <div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0 }}>Tasks ({filteredTasks.length})</p>
                          <button onClick={() => setShowNewTask(true)} style={{ background:'var(--fg-orange)', border:'none', borderRadius:6, color:'#fff', padding:'4px 8px', fontSize:11, cursor:'pointer' }}>+ New</button>
                        </div>
                        {filteredTasks.length===0 && <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', marginTop:40 }}>No tasks yet.</p>}
                        {filteredTasks.map(t => (
                          <div key={t.id} onClick={() => cycleTaskStatus(t)} style={{ padding:'10px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, marginBottom:6, cursor:'pointer' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:taskStatusColor[t.status], flexShrink:0 }} />
                              <span style={{ fontSize:13, color:'var(--fg-text)', flex:1 }}>{t.title}</span>
                              <span style={{ fontSize:10, color:taskPriorityColor[t.priority] }}>{t.priority}</span>
                            </div>
                            <p style={{ margin:'4px 0 0 16px', fontSize:11, color:'var(--fg-text3)' }}>{t.status.replace('_',' ')}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SCHEDULE */}
                    {rightTab==='schedule' && (
                      <div>
                        <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Scheduled Tasks</p>
                        <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, padding:12, marginBottom:12 }}>
                          <p style={{ margin:'0 0 8px', fontSize:12, color:'var(--fg-text2)', fontWeight:500 }}>New Schedule</p>
                          <input placeholder="Name" value={schedName} onChange={e => setSchedName(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:6, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:12, boxSizing:'border-box' }} />
                          <input placeholder="Cron (e.g. 0 9 * * 1-5)" value={schedCron} onChange={e => setSchedCron(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:6, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:12, boxSizing:'border-box' }} />
                          <textarea placeholder="Prompt to run..." value={schedPrompt} onChange={e => setSchedPrompt(e.target.value)} rows={2} style={{ width:'100%', padding:'8px', marginBottom:8, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:12, resize:'none', boxSizing:'border-box' }} />
                          <button onClick={createSchedule} style={{ width:'100%', padding:'8px', background:'var(--fg-orange)', border:'none', borderRadius:6, color:'#fff', fontSize:12, cursor:'pointer' }}>Create Schedule</button>
                        </div>
                        {schedules.map(s => (
                          <div key={s.id} style={{ padding:'10px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, marginBottom:6 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                              <span style={{ fontSize:11, color:s.enabled ? 'var(--fg-green)' : 'var(--fg-text3)' }}>●</span>
                              <span style={{ fontSize:13, color:'var(--fg-text)', flex:1 }}>{s.name}</span>
                              <button onClick={() => toggleSchedule(s)} style={{ background:'none', border:'none', color:s.enabled ? 'var(--fg-green)' : 'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>{s.enabled ? 'ON' : 'OFF'}</button>
                              <button onClick={() => runScheduleNow(s)} style={{ background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:4, color:'var(--fg-text3)', cursor:'pointer', fontSize:10, padding:'2px 6px' }}>▶</button>
                            </div>
                            <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{s.cron_expression}</p>
                            {s.last_run && <p style={{ margin:'2px 0 0', fontSize:11, color:'var(--fg-text3)' }}>Last: {new Date(s.last_run).toLocaleString()}</p>}
                          </div>
                        ))}
                        {schedules.length===0 && <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', marginTop:16 }}>No scheduled tasks.</p>}
                      </div>
                    )}

                    {/* CONTEXT -- Token progress bar */}
                    {rightTab==='context' && (() => {
                      const used = threadStats?.total_tokens || 0;
                      const limit = getContextLimit(selectedModel);
                      const pct = Math.min(100, (used / limit) * 100);
                      const color = pct > 80 ? 'var(--fg-red)' : pct > 60 ? 'var(--fg-orange2)' : 'var(--fg-orange)';
                      return (
                        <div>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 12px' }}>Context Usage</p>
                          <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, padding:16, marginBottom:12 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                              <span style={{ fontSize:13, color:'var(--fg-text2)', fontWeight:600 }}>{selectedModel}</span>
                              <span style={{ fontSize:12, color:color, fontWeight:700 }}>{pct.toFixed(1)}%</span>
                            </div>
                            <div style={{ background:'var(--fg-bg4)', borderRadius:6, height:12, overflow:'hidden', marginBottom:8 }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:6, transition:'width 0.5s ease', boxShadow:`0 0 8px ${color}55` }} />
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between' }}>
                              <span style={{ fontSize:11, color:'var(--fg-text3)' }}>{used.toLocaleString()} tokens used</span>
                              <span style={{ fontSize:11, color:'var(--fg-text3)' }}>{limit.toLocaleString()} limit</span>
                            </div>
                          </div>
                          {pct > 70 && (
                            <div style={{ background:'var(--fg-bg2)', border:'1px solid rgba(248,113,113,0.53)', borderRadius:8, padding:12, marginBottom:12 }}>
                              <p style={{ margin:'0 0 8px', fontSize:12, color:'var(--fg-red)', fontWeight:600 }}>⚠️ {pct > 90 ? 'Critical' : 'Warning'}: Context {pct > 90 ? 'nearly full' : 'filling up'}</p>
                              <p style={{ margin:'0 0 10px', fontSize:11, color:'var(--fg-text2)' }}>Auto-compact will summarize older messages to free up context space.</p>
                              <button onClick={async () => {
                                if (!user || !activeThread) return;
                                const keepMsgs = messages.slice(-6);
                                const summarizeContent = messages.slice(0, -6).map(m => `${m.role}: ${m.content}`).join('\n');
                                try {
                                  await apiFetch(`/threads/${activeThread.id}/compact`, { method:'POST', body:JSON.stringify({ keep_recent: 6, summary_hint: summarizeContent.slice(0,2000) }) }, user.token);
                                  await loadMessages(activeThread.id);
                                  loadThreadTokenStats(activeThread.id);
                                } catch { alert('Compact not available yet -- coming soon!'); }
                              }} style={{ width:'100%', padding:'8px', background:'var(--fg-orange)', border:'none', borderRadius:6, color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>⚡ Compact Now</button>
                            </div>
                          )}
                          {threadStats && (
                            <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, padding:14 }}>
                              <p style={{ margin:'0 0 10px', fontSize:11, color:'var(--fg-text3)', fontWeight:600, textTransform:'uppercase' }}>Message Breakdown</p>
                              {threadStats.token_history.slice(-10).map((h, i) => (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                                  <div style={{ fontSize:10, color:'var(--fg-text3)', width:16 }}>#{i+1}</div>
                                  <div style={{ flex:1, background:'var(--fg-bg4)', borderRadius:3, height:6, overflow:'hidden' }}>
                                    <div style={{ height:'100%', width:`${Math.min(100, (h.tokens / (threadStats.token_history.reduce((a,b) => Math.max(a,b.tokens), 1)))*100)}%`, background:'var(--fg-orange)' }} />
                                  </div>
                                  <span style={{ fontSize:10, color:'var(--fg-text3)', width:50, textAlign:'right' }}>{h.tokens >= 1000 ? (h.tokens/1000).toFixed(1)+'k' : h.tokens}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {!activeThread && <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', marginTop:40 }}>Start a conversation to see context usage.</p>}
                        </div>
                      );
                    })()}

                    {/* LIVE -- Manus-style agent activity */}
                    {rightTab==='live' && (
                      <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0 }}>Live Agent Activity</p>
                          <div style={{ display:'flex', alignItems:'center', gap:4, marginLeft:'auto' }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background: liveSSERef.current?.readyState === 1 ? 'var(--fg-green)' : 'var(--fg-text3)', animation: liveSSERef.current?.readyState === 1 ? 'pulse 1.5s infinite' : 'none' }} />
                            <span style={{ fontSize:10, color: liveSSERef.current?.readyState === 1 ? 'var(--fg-green)' : 'var(--fg-text3)' }}>{liveSSERef.current?.readyState === 1 ? 'LIVE' : 'Connecting...'}</span>
                          </div>
                          <button onClick={() => setLiveEvents([])} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:10 }}>Clear</button>
                        </div>
                        {liveEvents.length === 0 && (
                          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                            <div style={{ fontSize:40 }}>📺</div>
                            <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', margin:0 }}>Send a chat message to see<br/>live AI activity here in real time.</p>
                          </div>
                        )}
                        <div style={{ flex:1, overflowY:'auto' }}>
                          {liveEvents.map((ev, i) => {
                            const dot = ev.type === 'done' ? 'var(--fg-green)' : ev.type === 'error' ? 'var(--fg-red)' : ev.type === 'thinking' ? 'var(--fg-orange2)' : 'var(--fg-orange)';
                            return (
                              <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid var(--fg-border)' }}>
                                <div style={{ width:8, height:8, borderRadius:'50%', background:dot, flexShrink:0, marginTop:4, animation: ev.type === 'thinking' ? 'pulse 1s infinite' : 'none' }} />
                                <div style={{ flex:1 }}>
                                  <p style={{ margin:0, fontSize:12, color:'var(--fg-text)', lineHeight:1.5 }}>{ev.message}</p>
                                  <div style={{ display:'flex', gap:8, marginTop:2 }}>
                                    {ev.model && <span style={{ fontSize:10, color:'var(--fg-orange)', background:'var(--fg-odim)', padding:'1px 5px', borderRadius:4 }}>{ev.model}</span>}
                                    <span style={{ fontSize:10, color:'var(--fg-text3)' }}>{new Date(ev.ts).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* BROWSER -- ForgeBrowser */}
                    {rightTab==='browser' && (
                      <div style={{ display:'flex', flexDirection:'column', height:'100%', margin:-12, overflow:'hidden' }}>
                        {/* Browser toolbar */}
                        <div style={{ padding:'8px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)', display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                          <button onClick={() => {
                            if (browserHistoryIdx > 0) { const prev2 = browserHistory[browserHistoryIdx - 1]; setBrowserHistoryIdx(i => i-1); browserNavigate(prev2); }
                          }} disabled={browserHistoryIdx <= 0} style={{ padding:'4px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:12 }}>◀</button>
                          <button onClick={() => {
                            if (browserHistoryIdx < browserHistory.length - 1) { const next2 = browserHistory[browserHistoryIdx + 1]; setBrowserHistoryIdx(i => i+1); browserNavigate(next2); }
                          }} disabled={browserHistoryIdx >= browserHistory.length - 1} style={{ padding:'4px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:12 }}>▶</button>
                          <button onClick={() => browserNavigate(browserUrl)} style={{ padding:'4px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:12 }}>{browserLoading ? '✕' : '⟳'}</button>
                          <input value={browserInput} onChange={e => setBrowserInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') browserNavigate(browserInput); }} placeholder="Enter URL or search..." style={{ flex:1, padding:'5px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text)', fontSize:12, outline:'none' }} />
                          <button onClick={() => browserNavigate(browserInput)} style={{ padding:'4px 8px', background:'var(--fg-orange)', border:'none', borderRadius:6, color:'#fff', cursor:'pointer', fontSize:12 }}>Go</button>
                          {/* Mode toggle */}
                          <button onClick={() => setBrowserMode(m => m === 'proxy' ? 'iframe' : 'proxy')} title={browserMode === 'proxy' ? 'Switch to iframe mode' : 'Switch to reader mode'} style={{ padding:'4px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>{browserMode === 'proxy' ? '📖' : '🌐'}</button>
                        </div>
                        {/* Quick links */}
                        <div style={{ padding:'6px 8px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)', display:'flex', gap:6, flexShrink:0, flexWrap:'wrap' }}>
                          {[['🔍 Google','https://www.google.com/search?q='],['🐙 GitHub','https://github.com'],['📚 Anthropic','https://docs.anthropic.com'],['🤖 OpenRouter','https://openrouter.ai/models'],['📰 HN','https://news.ycombinator.com'],['🐦 Twitter','https://twitter.com'],['▶ YouTube','https://youtube.com']].map(([label, url]) => (
                            <button key={url} onClick={() => browserNavigate(url)} title={url as string} style={{ padding:'3px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:4, color:'var(--fg-text2)', cursor:'pointer', fontSize:11, whiteSpace:'nowrap' }}>{label as string}</button>
                          ))}
                        </div>

                        {/* Content area */}
                        {browserMode === 'proxy' ? (
                          <div style={{ flex:1, overflowY:'auto', background:'var(--fg-bg)' }}>
                            {browserLoading && (
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--fg-text3)', fontSize:13 }}>
                                <span>⟳ Fetching {browserUrl}…</span>
                              </div>
                            )}
                            {!browserLoading && !browserPage && (
                              <div style={{ padding:24, color:'var(--fg-text3)', textAlign:'center' }}>
                                <div style={{ fontSize:40, marginBottom:12 }}>🌐</div>
                                <div style={{ fontSize:14, color:'var(--fg-text3)', marginBottom:8 }}>ForgeBrowser -- Proxy Reader Mode</div>
                                <div style={{ fontSize:12, color:'var(--fg-bg5)' }}>Fetches pages server-side -- bypasses CORS and CSP restrictions.<br/>Click a quick link above or type a URL and press Go.</div>
                              </div>
                            )}
                            {!browserLoading && browserPage && (
                              <div style={{ padding:16, maxWidth:900, margin:'0 auto' }}>
                                {/* Page header */}
                                <div style={{ marginBottom:12, paddingBottom:12, borderBottom:'1px solid var(--fg-border)' }}>
                                  <div style={{ fontSize:16, fontWeight:600, color:'var(--fg-text)', marginBottom:4 }}>{browserPage.title || browserPage.url}</div>
                                  <div style={{ fontSize:11, color:'var(--fg-text3)' }}>{browserPage.url} -- HTTP {browserPage.status}</div>
                                  {browserPage.error && <div style={{ marginTop:6, padding:'6px 10px', background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.15)', borderRadius:6, color:'var(--fg-red)', fontSize:12 }}>⚠ {browserPage.error}</div>}
                                </div>
                                {/* Links sidebar */}
                                {browserPage.links.length > 0 && (
                                  <details style={{ marginBottom:12 }}>
                                    <summary style={{ fontSize:11, color:'var(--fg-text3)', cursor:'pointer', padding:'4px 0' }}>🔗 {browserPage.links.length} links on this page</summary>
                                    <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:2, maxHeight:200, overflowY:'auto', padding:'6px', background:'var(--fg-bg3)', borderRadius:6 }}>
                                      {browserPage.links.map((l, i) => (
                                        <button key={i} onClick={() => browserNavigate(l.href)} style={{ background:'none', border:'none', color:'var(--fg-orange2)', cursor:'pointer', fontSize:11, textAlign:'left', padding:'2px 4px', borderRadius:3, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }} title={l.href}>
                                          {l.text || l.href}
                                        </button>
                                      ))}
                                    </div>
                                  </details>
                                )}
                                {/* Page text content */}
                                <pre style={{ fontSize:13, color:'var(--fg-text)', whiteSpace:'pre-wrap', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', lineHeight:1.6, margin:0 }}>{browserPage.text}</pre>
                                {/* Copy button */}
                                <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--fg-border)', display:'flex', gap:8 }}>
                                  <button onClick={() => navigator.clipboard.writeText(browserPage.text)} style={{ padding:'6px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-orange)', cursor:'pointer', fontSize:12 }}>📋 Copy text</button>
                                  <button onClick={() => { const q = `Content from ${browserPage.url}:\n\n${browserPage.text.slice(0,4000)}`; setInput(prev => prev + (prev ? '\n\n' : '') + q); setActiveTab('workspace'); }} style={{ padding:'6px 12px', background:'var(--fg-orange)', border:'none', borderRadius:6, color:'#fff', cursor:'pointer', fontSize:12 }}>💬 Send to chat</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <iframe ref={browserFrameRef} src={browserUrl} title="ForgeBrowser" style={{ flex:1, border:'none', background:'#fff' }} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-navigation" onLoad={e => { try { setBrowserInput((e.target as HTMLIFrameElement).contentDocument?.location?.href || browserUrl); } catch {} }} />
                            <div style={{ padding:'4px 8px', background:'var(--fg-bg)', borderTop:'1px solid var(--fg-border)', flexShrink:0 }}>
                              <span style={{ fontSize:10, color:'var(--fg-text3)' }}>🌐 iFrame mode -- some sites block embedding. Switch to 📖 Reader mode for full access.</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* TERMINAL -- Forge Terminal */}
                    {rightTab==='terminal' && (
                      <div style={{ display:'flex', flexDirection:'column', height:'100%', margin:-12, overflow:'hidden', background:'var(--fg-bg)', fontFamily:'ui-monospace,monospace' }}>
                        <div style={{ padding:'6px 10px', background:'var(--fg-bg3)', borderBottom:'1px solid var(--fg-border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                          <span style={{ fontSize:12, color:'var(--fg-green)', fontWeight:600 }}>⚡ Forge Terminal</span>
                          <button onClick={() => setTerminalLines([{ text:'⚡ Forge Terminal -- cleared', type:'system' }])} style={{ marginLeft:'auto', padding:'2px 8px', background:'none', border:'1px solid var(--fg-border2)', borderRadius:4, color:'var(--fg-text3)', cursor:'pointer', fontSize:10 }}>Clear</button>
                        </div>
                        <div style={{ flex:1, overflowY:'auto', padding:'8px 12px', display:'flex', flexDirection:'column', gap:2 }}>
                          {terminalLines.map((line, i) => (
                            <div key={i} style={{ fontSize:12, lineHeight:1.5, color: line.type === 'input' ? 'var(--fg-orange2)' : line.type === 'error' ? 'var(--fg-red)' : line.type === 'system' ? 'var(--fg-orange2)' : 'var(--fg-text)', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{line.text}</div>
                          ))}
                          {terminalRunning && <div style={{ fontSize:12, color:'var(--fg-orange)', animation:'pulse 1s infinite' }}>⚡ Running…</div>}
                          <div ref={terminalEndRef} />
                        </div>
                        <div style={{ padding:'8px 12px', borderTop:'1px solid var(--fg-border)', display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                          <span style={{ fontSize:12, color:'var(--fg-green)', fontWeight:700, flexShrink:0 }}>$</span>
                          <input ref={terminalInputRef} value={terminalInput} onChange={e => setTerminalInput(e.target.value)} onKeyDown={e => {
                            if (e.key === 'Enter' && terminalInput.trim()) { runTerminalCommand(terminalInput); }
                            else if (e.key === 'ArrowUp') { const idx = Math.min(terminalHistoryIdx + 1, terminalHistory.length - 1); setTerminalHistoryIdx(idx); setTerminalInput(terminalHistory[idx] || ''); e.preventDefault(); }
                            else if (e.key === 'ArrowDown') { const idx = Math.max(terminalHistoryIdx - 1, -1); setTerminalHistoryIdx(idx); setTerminalInput(idx === -1 ? '' : terminalHistory[idx]); e.preventDefault(); }
                          }} placeholder="type command..." disabled={terminalRunning} style={{ flex:1, background:'transparent', border:'none', color:'var(--fg-text)', fontSize:12, outline:'none', fontFamily:'ui-monospace,monospace' }} autoComplete="off" spellCheck={false} />
                          <button onClick={() => runTerminalCommand(terminalInput)} disabled={!terminalInput.trim() || terminalRunning} style={{ padding:'4px 8px', background:'var(--fg-orange)', border:'none', borderRadius:4, color:'#fff', cursor:'pointer', fontSize:12, opacity: terminalInput.trim() && !terminalRunning ? 1 : 0.4 }}>↵</button>
                        </div>
                      </div>
                    )}

                    {/* DISPATCH -- Swarm */}
                    {/* 🤖 SUPERAGENT -- autonomous web + tool use chat */}
                    {rightTab==='agent' && (
                      <div style={{ display:'flex', flexDirection:'column', height:'100%', margin:-12, overflow:'hidden' }}>
                        {/* Header */}
                        <div style={{ padding:'10px 12px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                          <span style={{ fontSize:16 }}>🤖</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-orange)' }}>ForgeAgent</div>
                            <div style={{ fontSize:10, color:'var(--fg-text3)' }}>Autonomous -- browses web, fetches data, returns results</div>
                          </div>
                          <button onClick={() => setAgentMessages([])} style={{ marginLeft:'auto', padding:'2px 8px', background:'none', border:'1px solid var(--fg-border2)', borderRadius:4, color:'var(--fg-text3)', cursor:'pointer', fontSize:10 }}>Clear</button>
                        </div>

                        {/* Tool legend */}
                        <div style={{ padding:'6px 10px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)', display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
                          {[['🔍','web_search'],['🌐','web_fetch'],['📊','extract_data'],['📝','summarize']].map(([icon, name]) => (
                            <span key={name} style={{ fontSize:10, color:'var(--fg-bg5)', display:'flex', alignItems:'center', gap:2 }}>{icon} {name}</span>
                          ))}
                        </div>

                        {/* Messages */}
                        <div ref={agentScrollRef} style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:8 }}>
                          {agentMessages.length === 0 && (
                            <div style={{ textAlign:'center', padding:24, color:'var(--fg-bg5)' }}>
                              <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
                              <div style={{ fontSize:13, color:'var(--fg-text3)', marginBottom:4 }}>ForgeAgent is ready</div>
                              <div style={{ fontSize:11, color:'var(--fg-bg5)' }}>Ask it to search the web, fetch pages, extract data, or research any topic.</div>
                              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:4 }}>
                                {['Search for latest AI news and summarize', 'What are the top 5 open-source LLMs right now?', 'Fetch openrouter.ai/models and list free models', 'Research competitors of Anthropic Claude'].map(s => (
                                  <button key={s} onClick={() => setAgentInput(s)} style={{ padding:'6px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-orange2)', cursor:'pointer', fontSize:11, textAlign:'left' }}>{s}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          {agentMessages.map((msg, i) => (
                            <div key={i} style={{
                              padding: msg.role === 'tool' || msg.role === 'tool_result' ? '6px 10px' : '10px 12px',
                              background: msg.role === 'user' ? 'var(--fg-bg4)' : msg.role === 'agent' ? 'var(--fg-bg2)' : msg.role === 'error' ? 'rgba(248,113,113,0.07)' : 'var(--fg-bg)',
                              border: `1px solid ${msg.role === 'tool' ? 'rgba(34,197,94,0.07)' : msg.role === 'tool_result' ? 'rgba(34,197,94,0.07)' : msg.role === 'error' ? 'rgba(248,113,113,0.15)' : 'var(--fg-border)'}`,
                              borderRadius: 8,
                              borderLeft: msg.role === 'tool' ? '3px solid var(--fg-green)' : msg.role === 'tool_result' ? '3px solid var(--fg-green)' : msg.role === 'agent' ? '3px solid var(--fg-orange)' : 'none',
                            }}>
                              <div style={{ fontSize:10, color:'var(--fg-text3)', marginBottom:3, textTransform:'uppercase', fontWeight:600 }}>
                                {msg.role === 'user' ? '👤 You' : msg.role === 'agent' ? '🤖 ForgeAgent' : msg.role === 'tool' ? `🔧 Tool: ${msg.tool}` : msg.role === 'tool_result' ? `📥 Result: ${msg.tool}` : '⚠ Error'}
                              </div>
                              <div style={{ fontSize:12, color: msg.role === 'error' ? 'var(--fg-red)' : msg.role === 'tool' ? 'var(--fg-green)' : 'var(--fg-text)', whiteSpace:'pre-wrap', lineHeight:1.5 }}>{msg.content}</div>
                              {msg.role === 'agent' && (
                                <div style={{ marginTop:4, display:'flex', gap:4 }}>
                                  <button onClick={() => navigator.clipboard.writeText(msg.content)} style={{ padding:'2px 6px', background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:10 }}>📋 Copy</button>
                                  <button onClick={() => { setInput(prev => prev + (prev ? '\n\n' : '') + msg.content); setActiveTab('workspace'); }} style={{ padding:'2px 6px', background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:10 }}>💬 To chat</button>
                                </div>
                              )}
                            </div>
                          ))}
                          {agentRunning && (
                            <div style={{ padding:'8px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:12, color:'var(--fg-orange)' }}>⚡ Agent working…</span>
                              <span style={{ fontSize:10, color:'var(--fg-text3)', animation:'pulse 1s infinite' }}>searching and fetching data</span>
                            </div>
                          )}
                        </div>

                        {/* Input */}
                        <div style={{ padding:'8px', background:'var(--fg-bg)', borderTop:'1px solid var(--fg-border)', flexShrink:0 }}>
                          <div style={{ display:'flex', gap:6 }}>
                            <textarea value={agentInput} onChange={e => setAgentInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runAgent(); } }}
                              placeholder="Ask ForgeAgent anything -- it can browse the web…" rows={2}
                              style={{ flex:1, padding:'8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text)', fontSize:12, resize:'none', outline:'none', fontFamily:'inherit' }} />
                            <button onClick={runAgent} disabled={agentRunning || !agentInput.trim()} style={{ padding:'8px 12px', background: agentRunning ? 'var(--fg-bg4)' : 'var(--fg-orange)', border:'none', borderRadius:6, color:'#fff', cursor: agentRunning ? 'default' : 'pointer', fontSize:13, fontWeight:600, alignSelf:'flex-end' }}>
                              {agentRunning ? '⟳' : '▶'}
                            </button>
                          </div>
                          <div style={{ fontSize:10, color:'var(--fg-bg5)', marginTop:4 }}>Enter to send · Shift+Enter for newline · Uses {selectedModel}</div>
                        </div>
                      </div>
                    )}

                    {rightTab==='dispatch' && (
                      <div>
                        <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 10px' }}>Agent Dispatch</p>
                        <p style={{ color:'var(--fg-text3)', fontSize:11, margin:'0 0 8px' }}>Select agents for swarm (multi-select = parallel dispatch)</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                          {agents.filter(a => a.enabled).map(a => (
                            <button key={a.id} onClick={() => toggleDispatchAgent(a.id)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, border:dispatchAgentIds.includes(a.id) ? `1px solid ${a.color}` : '1px solid var(--fg-border2)', background:dispatchAgentIds.includes(a.id) ? `${a.color}22` : 'transparent', color:dispatchAgentIds.includes(a.id) ? a.color : 'var(--fg-text2)', cursor:'pointer', fontSize:12 }}>
                              <span>{a.icon}</span><span>{a.name}</span>
                            </button>
                          ))}
                        </div>
                        <textarea placeholder="Describe the task for the agent(s)..." value={dispatchPrompt} onChange={e => setDispatchPrompt(e.target.value)} rows={4} style={{ width:'100%', padding:'10px', marginBottom:8, background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:13, resize:'none', boxSizing:'border-box' }} />
                        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                          <button onClick={runDispatch} disabled={dispatching || !dispatchPrompt.trim()} style={{ flex:1, padding:'10px', background:dispatching ? 'var(--fg-bg4)' : 'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:dispatching ? 'default' : 'pointer' }}>
                            {dispatching ? '⚡ Running...' : dispatchAgentIds.length > 1 ? `🚀 Dispatch Swarm (${dispatchAgentIds.length})` : '🚀 Dispatch'}
                          </button>
                          {dispatching && <button onClick={cancelDispatch} style={{ padding:'10px 12px', background:'var(--fg-bg4)', border:'1px solid var(--fg-red)', borderRadius:8, color:'var(--fg-red)', fontSize:12, cursor:'pointer' }}>✕</button>}
                        </div>
                        {dispatchOutput && (
                          <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, padding:12, marginBottom:12 }}>
                            <p style={{ margin:'0 0 6px', fontSize:11, color:'var(--fg-text3)', fontWeight:600 }}>OUTPUT</p>
                            <p style={{ margin:0, fontSize:13, color:'var(--fg-text)', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{dispatchOutput}</p>
                          </div>
                        )}
                        {dispatchRuns.length > 0 && (
                          <div>
                            <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 8px' }}>History</p>
                            {dispatchRuns.slice(0,10).map(r => (
                              <div key={r.id} style={{ padding:'8px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:6, marginBottom:4 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                                  <span style={{ fontSize:10, color:r.status==='completed' ? 'var(--fg-green)' : r.status==='running' ? 'var(--fg-orange)' : 'var(--fg-red)' }}>●</span>
                                  <span style={{ fontSize:12, color:'var(--fg-text2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.prompt.slice(0,50)}{r.prompt.length > 50 ? '...' : ''}</span>
                                </div>
                                <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{new Date(r.created_at).toLocaleString()}</p>
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
              <h2 style={{ color:'var(--fg-orange)', margin:'0 0 4px', fontSize:22, fontFamily:'var(--fg-font-display)', fontWeight:800, letterSpacing:'-0.3px' }}>⚡ ForgeRouter</h2>
              <p style={{ color:'var(--fg-text3)', margin:'0 0 24px', fontSize:14 }}>Route prompts across 400+ AI models with configurable markup</p>

              <div style={{ display:'flex', gap:8, marginBottom:24 }}>
                {(['forge','direct','openrouter','custom'] as const).map(t => (
                  <button key={t} onClick={() => setRouterTab(t)} style={{ padding:'8px 16px', background:routerTab===t ? 'var(--fg-orange)' : 'var(--fg-bg3)', border:`1px solid ${routerTab===t ? 'var(--fg-orange)' : 'var(--fg-border)'}`, borderRadius:8, color:routerTab===t ? '#fff' : 'var(--fg-text2)', cursor:'pointer', fontSize:13, fontWeight:500, textTransform:'capitalize' }}>{t === 'openrouter' ? 'OpenRouter' : t === 'forge' ? '⚡ Forge Models' : t}</button>
                ))}
              </div>

              {/* Forge Models */}
              {routerTab==='forge' && (
                <div>
                  <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'0 0 16px' }}>Forge models are pre-configured with markup multipliers for resale. Use these as your product's branded AI.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12, marginBottom:24 }}>
                    {FORGE_MODELS.map(m => (
                      <div key={m.id} style={{ padding:'16px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12 }}>
                        <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:600, color:'var(--fg-orange)' }}>{m.label}</p>
                        <p style={{ margin:'0 0 8px', fontSize:12, color:'var(--fg-text3)' }}>{m.desc}</p>
                        <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)', fontFamily:'monospace' }}>{m.id}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
                    <p style={{ color:'var(--fg-text2)', fontSize:13, fontWeight:600, margin:'0 0 12px' }}>Test a Forge Model</p>
                    <select value={routerTestModel} onChange={e => setRouterTestModel(e.target.value)} style={{ width:'100%', padding:'8px', marginBottom:8, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:13 }}>
                      {FORGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                    <textarea placeholder="Enter a test prompt..." value={routerTestPrompt} onChange={e => setRouterTestPrompt(e.target.value)} rows={3} style={{ width:'100%', padding:'10px', marginBottom:8, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:13, resize:'none', boxSizing:'border-box' }} />
                    <button onClick={testRouter} disabled={routerTesting || !routerTestPrompt.trim()} style={{ padding:'10px 20px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer', opacity:routerTesting ? 0.7 : 1 }}>{routerTesting ? 'Testing...' : 'Test'}</button>
                    {routerTestResult && <div style={{ marginTop:12, padding:'12px', background:'var(--fg-bg)', borderRadius:8, border:'1px solid var(--fg-border)' }}><p style={{ margin:0, fontSize:13, color:'var(--fg-text)', whiteSpace:'pre-wrap' }}>{routerTestResult}</p></div>}
                  </div>
                </div>
              )}

              {/* Direct Models */}
              {routerTab==='direct' && (
                <div>
                  <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'0 0 16px' }}>Direct access to provider models (no markup). Requires your API key in Settings.</p>
                  {DIRECT_MODELS.map(grp => (
                    <div key={grp.group} style={{ marginBottom:20 }}>
                      <p style={{ color:'var(--fg-text2)', fontSize:12, fontWeight:600, margin:'0 0 10px', textTransform:'uppercase' }}>{grp.group}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8 }}>
                        {grp.models.map(m => (
                          <div key={m.id} style={{ padding:'12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8 }}>
                            <p style={{ margin:'0 0 4px', fontSize:14, color:'var(--fg-text)', fontWeight:500 }}>{m.label}</p>
                            <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)', fontFamily:'monospace' }}>{m.id}</p>
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
                  {/* Key entry if not loaded */}
                  {openRouterModels.length === 0 && (
                    <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-odim)', borderRadius:12, padding:16, marginBottom:16 }}>
                      <p style={{ margin:'0 0 10px', fontSize:13, color:'var(--fg-text2)', fontWeight:600 }}>🔑 Add your OpenRouter API key to unlock 400+ models</p>
                      <div style={{ display:'flex', gap:8 }}>
                        <input type="password" placeholder="sk-or-v1-..." value={apiKeys['openrouter'] || ''} onChange={e => setApiKeys(prev => ({ ...prev, openrouter: e.target.value }))} style={{ flex:1, padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }} />
                        <button onClick={async () => { await saveOneKey('openrouter', apiKeys['openrouter'] || ''); loadOpenRouterModels(); }} style={{ padding:'9px 16px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>{savedProviders['openrouter'] ? '✓ Saved' : 'Save & Load'}</button>
                        <button onClick={() => window.open('https://openrouter.ai/keys', '_blank')} style={{ padding:'9px 12px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text3)', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>Get key →</button>
                      </div>
                    </div>
                  )}
                  {/* Stats bar */}
                  {openRouterModels.length > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, color:'var(--fg-text3)' }}>{openRouterModels.length} models</span>
                      <span style={{ fontSize:12, color:'var(--fg-green)' }}>✓ {openRouterModels.filter(m => m.pricing?.prompt==='0'||m.pricing?.prompt==='0.0'||m.id.includes(':free')).length} free</span>
                      <span style={{ fontSize:12, color:'var(--fg-orange)' }}>💎 {openRouterModels.filter(m => !(m.pricing?.prompt==='0'||m.pricing?.prompt==='0.0'||m.id.includes(':free'))).length} paid</span>
                      <button onClick={loadOpenRouterModels} disabled={orLoading} style={{ marginLeft:'auto', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color: orLoading ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:11, padding:'3px 8px' }}>{orLoading ? '⟳ Loading…' : '↻ Refresh'}</button>
                    </div>
                  )}
                  {/* Search + filter + sort */}
                  <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                    <input placeholder="Search models..." value={orSearch} onChange={e => setOrSearch(e.target.value)} style={{ flex:1, minWidth:160, padding:'9px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }} />
                    <select value={orFilter} onChange={e => setOrFilter(e.target.value as any)} style={{ padding:'9px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12, cursor:'pointer' }}>
                      <option value="all">All models</option>
                      <option value="free">Free only</option>
                      <option value="paid">Paid only</option>
                    </select>
                    <select value={orSort} onChange={e => setOrSort(e.target.value as any)} style={{ padding:'9px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12, cursor:'pointer' }}>
                      <option value="name">Sort: Name</option>
                      <option value="price_asc">Sort: Price ↑</option>
                      <option value="price_desc">Sort: Price ↓</option>
                      <option value="context">Sort: Context ↓</option>
                    </select>
                  </div>
                  {/* Model grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:8 }}>
                    {filteredOrModels.slice(0,120).map(m => {
                      const isFree = m.pricing?.prompt==='0'||m.pricing?.prompt==='0.0'||m.id.includes(':free');
                      const pricePerM = isFree ? null : m.pricing?.prompt ? (parseFloat(m.pricing.prompt)*1_000_000).toFixed(2) : null;
                      const isSelected = selectedModel===m.id || selectedModel===`openrouter/${m.id}`;
                      return (
                        <div key={m.id} onClick={() => { setSelectedModel(m.id); setActiveTab('workspace'); }} style={{ padding:'12px', background:'var(--fg-bg3)', border: isSelected ? '1px solid var(--fg-orange)' : '1px solid var(--fg-border)', borderRadius:10, cursor:'pointer', transition:'border-color 0.15s', position:'relative' }}>
                          {/* Free badge */}
                          {isFree && <span style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:700, color:'var(--fg-green)', background:'rgba(34,197,94,0.13)', padding:'2px 6px', borderRadius:8 }}>FREE</span>}
                          {isSelected && <span style={{ position:'absolute', top:8, right:isFree?46:8, fontSize:9, fontWeight:700, color:'var(--fg-orange)', background:'rgba(249,115,22,0.13)', padding:'2px 6px', borderRadius:8 }}>✓ ACTIVE</span>}
                          <p style={{ margin:'0 0 3px', fontSize:13, color:'var(--fg-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600, paddingRight:isFree?36:0 }}>{m.name || m.id}</p>
                          <p style={{ margin:'0 0 6px', fontSize:10, color:'var(--fg-text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace' }}>{m.id}</p>
                          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                            {m.context_length && <span style={{ fontSize:10, color:'var(--fg-text3)', background:'var(--fg-bg4)', padding:'2px 6px', borderRadius:6 }}>{(m.context_length/1000).toFixed(0)}k ctx</span>}
                            {pricePerM && <span style={{ fontSize:10, color:'var(--fg-orange2)' }}>${pricePerM}/1M in</span>}
                            {!isFree && m.pricing?.completion && <span style={{ fontSize:10, color:'var(--fg-text3)' }}>${(parseFloat(m.pricing.completion)*1_000_000).toFixed(2)}/1M out</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {orLoading && <p style={{ color:'var(--fg-orange)', fontSize:13, textAlign:'center', padding:32 }}>⟳ Loading models from OpenRouter…</p>}
                  {filteredOrModels.length > 120 && <p style={{ color:'var(--fg-text3)', fontSize:12, textAlign:'center', marginTop:12 }}>Showing 120 of {filteredOrModels.length}. Refine search to see more.</p>}
                  {!orLoading && openRouterModels.length > 0 && filteredOrModels.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', padding:32 }}>No models match your search.</p>}
                </div>
              )}

              {/* Custom Providers */}
              {routerTab==='custom' && (
                <div>
                  <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'0 0 16px' }}>Add any OpenAI-compatible endpoint with custom markup multiplier.</p>
                  <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20, marginBottom:20 }}>
                    <p style={{ color:'var(--fg-text2)', fontSize:13, fontWeight:600, margin:'0 0 12px' }}>Add Provider</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                      <input placeholder="Provider name" value={newProvider.name} onChange={e => setNewProvider(p => ({ ...p, name:e.target.value }))} style={{ padding:'8px 10px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:13 }} />
                      <input placeholder="Base URL (https://...)" value={newProvider.base_url} onChange={e => setNewProvider(p => ({ ...p, base_url:e.target.value }))} style={{ padding:'8px 10px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:13 }} />
                      <input placeholder="API Key" type="password" value={newProvider.api_key} onChange={e => setNewProvider(p => ({ ...p, api_key:e.target.value }))} style={{ padding:'8px 10px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:13 }} />
                      <input placeholder="Markup multiplier (e.g. 1.5)" value={newProvider.markup} onChange={e => setNewProvider(p => ({ ...p, markup:e.target.value }))} style={{ padding:'8px 10px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:13 }} />
                    </div>
                    <input placeholder="Model IDs (comma-separated)" value={newProvider.models} onChange={e => setNewProvider(p => ({ ...p, models:e.target.value }))} style={{ width:'100%', padding:'8px 10px', marginBottom:10, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }} />
                    <button onClick={createCustomProvider} style={{ padding:'10px 20px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>Add Provider</button>
                  </div>

                  {customProviders.length===0 && <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', padding:24 }}>No custom providers yet.</p>}
                  {customProviders.map(cp => (
                    <div key={cp.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:600, color:'var(--fg-text)' }}>{cp.name}</p>
                        <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)' }}>{cp.base_url} · {cp.markup}× markup</p>
                      </div>
                      <button onClick={() => deleteCustomProvider(cp.id)} style={{ background:'none', border:'1px solid var(--fg-red)', borderRadius:6, color:'var(--fg-red)', cursor:'pointer', fontSize:12, padding:'4px 8px' }}>Delete</button>
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
              <h2 style={{ color:'var(--fg-orange)', margin:'0 0 4px', fontSize:22, fontFamily:'var(--fg-font-display)', fontWeight:800, letterSpacing:'-0.3px' }}>💳 Billing</h2>
              <p style={{ color:'var(--fg-text3)', margin:'0 0 24px', fontSize:14 }}>Manage your plan, usage, and billing</p>

              {/* Current plan */}
              {subscription && (
                <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:16, padding:24, marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <div>
                      <p style={{ margin:'0 0 4px', fontSize:18, fontWeight:700, color:'var(--fg-orange)', textTransform:'capitalize' }}>{subscription.plan} Plan</p>
                      {subscription.period_end && <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)' }}>Renews {new Date(subscription.period_end).toLocaleDateString()}</p>}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ margin:0, fontSize:14, color:'var(--fg-text)' }}>{(subscription.tokens_used ?? 0).toLocaleString()} / {(subscription.token_limit ?? 10000).toLocaleString()} tokens</p>
                      <p style={{ margin:'4px 0 0', fontSize:12, color:'var(--fg-text3)' }}>{usagePercent}% used</p>
                    </div>
                  </div>
                  <div style={{ background:'var(--fg-bg)', borderRadius:8, height:8, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:usagePercent > 80 ? 'var(--fg-red)' : 'var(--fg-orange)', width:`${usagePercent}%`, transition:'width 0.3s', borderRadius:8 }} />
                  </div>
                </div>
              )}

              {/* Plans */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
                {[
                  { plan:'free', label:'Free', price:'$0/mo', tokens:'100K tokens', color:'var(--fg-text3)', features:['3 models','Basic agents','Community support'] },
                  { plan:'starter', label:'Starter', price:'$19/mo', tokens:'2M tokens', color:'var(--fg-blue)', features:['All models','ForgeRouter','Email support'] },
                  { plan:'pro', label:'Pro', price:'$49/mo', tokens:'10M tokens', color:'var(--fg-orange)', features:['All models','Agent swarm','Priority support','Custom providers'] },
                  { plan:'enterprise', label:'Enterprise', price:'Custom', tokens:'Unlimited', color:'var(--fg-orange)', features:['Everything in Pro','SLA','Dedicated infra','White-label'] },
                ].map(p => (
                  <div key={p.plan} style={{ padding:'20px', background:'var(--fg-bg3)', border:`1px solid ${subscription?.plan===p.plan ? p.color : 'var(--fg-border)'}`, borderRadius:14 }}>
                    <p style={{ margin:'0 0 2px', fontSize:16, fontWeight:700, color:p.color }}>{p.label}</p>
                    <p style={{ margin:'0 0 2px', fontSize:20, fontWeight:800, color:'var(--fg-text)' }}>{p.price}</p>
                    <p style={{ margin:'0 0 12px', fontSize:12, color:'var(--fg-text3)' }}>{p.tokens}</p>
                    {p.features.map(f => <p key={f} style={{ margin:'0 0 4px', fontSize:12, color:'var(--fg-text2)' }}>✓ {f}</p>)}
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
              <h3 style={{ color:'var(--fg-text2)', fontSize:15, margin:'0 0 4px' }}>AI Tools & Services</h3>
              <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'0 0 16px' }}>Connect your existing subscriptions or API keys to use Claude, OpenAI, and Cursor inside Forge.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:28 }}>
                {([
                  {
                    id:'claude', icon:'🟣', name:'Claude (Anthropic)', color:'var(--fg-orange)', apiKeyId:'anthropic',
                    loginUrl:'https://claude.ai', signupUrl:'https://claude.ai/upgrade',
                    plans:[
                      { label:'Free', price:'$0/mo', desc:'Web access, limited messages' },
                      { label:'Pro', price:'$20/mo', desc:'5× usage, priority, longer context' },
                      { label:'Team', price:'$25/mo', desc:'Collaboration, admin controls' },
                    ],
                  },
                  {
                    id:'openai', icon:'🟢', name:'OpenAI / ChatGPT', color:'var(--fg-green)', apiKeyId:'openai',
                    loginUrl:'https://chat.openai.com', signupUrl:'https://chat.openai.com/upgrade',
                    plans:[
                      { label:'Free', price:'$0/mo', desc:'GPT-4o mini, limited GPT-4o' },
                      { label:'Plus', price:'$20/mo', desc:'Full GPT-4o, DALL·E, browsing' },
                      { label:'Team', price:'$25/mo', desc:'Workspace, admin, more messages' },
                    ],
                  },
                  {
                    id:'cursor', icon:'🔵', name:'Cursor', color:'var(--fg-blue)', apiKeyId:'',
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
                    <div key={service.id} style={{ background:'var(--fg-bg3)', border:`1px solid ${creds.connected ? service.color : 'var(--fg-border)'}`, borderRadius:14, overflow:'hidden' }}>
                      {/* Header */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid var(--fg-border)', cursor:'pointer' }} onClick={() => setServiceExpanded(p => ({ ...p, [service.id]: !expanded }))}>
                        <span style={{ fontSize:20 }}>{service.icon}</span>
                        <p style={{ margin:0, fontSize:15, fontWeight:700, color:'var(--fg-text)' }}>{service.name}</p>
                        {creds.connected && <span style={{ fontSize:11, color:'var(--fg-green)', background:'rgba(34,197,94,0.13)', padding:'2px 8px', borderRadius:20 }}>✓ Connected</span>}
                        {hasApiKey && !creds.connected && <span style={{ fontSize:11, color:'var(--fg-green)', background:'rgba(34,197,94,0.13)', padding:'2px 8px', borderRadius:20 }}>✓ API key saved</span>}
                        <span style={{ marginLeft:'auto', color:'var(--fg-text3)', fontSize:14 }}>{expanded ? '▲' : '▼'}</span>
                      </div>

                      {/* Plans row */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', borderBottom: expanded ? '1px solid var(--fg-border)' : 'none' }}>
                        {service.plans.map((plan, i) => (
                          <div key={plan.label} style={{ padding:'14px 16px', borderRight: i < 2 ? '1px solid var(--fg-border)' : 'none' }}>
                            <p style={{ margin:'0 0 1px', fontSize:13, fontWeight:600, color:service.color }}>{plan.label}</p>
                            <p style={{ margin:'0 0 4px', fontSize:17, fontWeight:800, color:'var(--fg-text)' }}>{plan.price}</p>
                            <p style={{ margin:'0 0 10px', fontSize:11, color:'var(--fg-text3)', lineHeight:1.4 }}>{plan.desc}</p>
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
                            <p style={{ margin:'0 0 10px', fontSize:12, color:'var(--fg-text2)', fontWeight:600, textTransform:'uppercase' }}>Sign in with your {service.name} account</p>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                              <input
                                placeholder="Email address"
                                type="email"
                                value={creds.email}
                                onChange={e => setServiceCreds(p => ({ ...p, [service.id]: { ...p[service.id], email: e.target.value } }))}
                                style={{ padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }}
                              />
                              <input
                                placeholder="Password"
                                type="password"
                                value={creds.password}
                                onChange={e => setServiceCreds(p => ({ ...p, [service.id]: { ...p[service.id], password: e.target.value } }))}
                                style={{ padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }}
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
                                  style={{ padding:'8px 12px', background:'transparent', border:'1px solid var(--fg-red)', borderRadius:8, color:'var(--fg-red)', fontSize:12, cursor:'pointer' }}
                                >
                                  Disconnect
                                </button>
                              )}
                              <span style={{ fontSize:11, color:'var(--fg-text3)' }}>Credentials stored locally only</span>
                            </div>
                          </div>

                          {/* API Key shortcut */}
                          {service.apiKeyId && (
                            <div style={{ borderTop:'1px solid var(--fg-border)', paddingTop:14 }}>
                              <p style={{ margin:'0 0 8px', fontSize:12, color:'var(--fg-text2)', fontWeight:600, textTransform:'uppercase' }}>Or use API Key directly</p>
                              <div style={{ display:'flex', gap:8 }}>
                                <input
                                  type="password"
                                  placeholder={service.id === 'claude' ? 'sk-ant-...' : 'sk-...'}
                                  value={apiKeys[service.apiKeyId] || ''}
                                  onChange={e => setApiKeys(prev => ({ ...prev, [service.apiKeyId]: e.target.value }))}
                                  style={{ flex:1, padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }}
                                />
                                <button onClick={() => saveOneKey(service.apiKeyId, apiKeys[service.apiKeyId] || '')} style={{ padding:'9px 16px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                                  {savedProviders[service.apiKeyId] ? '✓ Saved' : 'Save Key'}
                                </button>
                                <button onClick={() => window.open(service.id === 'claude' ? 'https://console.anthropic.com/keys' : 'https://platform.openai.com/api-keys', '_blank')} style={{ padding:'9px 12px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text3)', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
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
              <h3 style={{ color:'var(--fg-text2)', fontSize:15, margin:'0 0 12px' }}>Usage Logs</h3>
              {usageLogs.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', padding:24 }}>No usage logged yet.</p>}
              {usageLogs.length > 0 && (
                <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1.5fr', padding:'10px 16px', borderBottom:'1px solid var(--fg-border)', background:'var(--fg-bg)' }}>
                    {['Model','Tokens In','Tokens Out','Cost','Time'].map(h => <p key={h} style={{ margin:0, fontSize:11, color:'var(--fg-text3)', fontWeight:600, textTransform:'uppercase' }}>{h}</p>)}
                  </div>
                  {usageLogs.slice(0,20).map(l => (
                    <div key={l.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1.5fr', padding:'10px 16px', borderBottom:'1px solid var(--fg-bg)' }}>
                      <p style={{ margin:0, fontSize:12, color:'var(--fg-text)' }}>{l.model}</p>
                      <p style={{ margin:0, fontSize:12, color:'var(--fg-text2)' }}>{l.tokens_in?.toLocaleString()}</p>
                      <p style={{ margin:0, fontSize:12, color:'var(--fg-text2)' }}>{l.tokens_out?.toLocaleString()}</p>
                      <p style={{ margin:0, fontSize:12, color:'var(--fg-green)' }}>${((l.cost_usd||0)+(l.markup_usd||0)).toFixed(4)}</p>
                      <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{new Date(l.created_at).toLocaleString()}</p>
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
              <h2 style={{ color:'var(--fg-orange)', margin:'0 0 4px', fontSize:22, fontFamily:'var(--fg-font-display)', fontWeight:800, letterSpacing:'-0.3px' }}>🌐 Platforms</h2>
              <p style={{ color:'var(--fg-text3)', margin:'0 0 24px', fontSize:14 }}>Access Forge from anywhere -- desktop, mobile, bots, and APIs</p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
                {[
                  { icon:'🖥️', name:'Desktop App', desc:'Native Electron app for Mac, Windows, Linux. Works offline and syncs with your workspace.', badge:'Download', badgeColor:'var(--fg-orange)', action:() => alert('Desktop app download link: https://github.com/goldrusher9009/forge/releases') },
                  { icon:'📱', name:'Mobile PWA', desc:'Install Forge as a Progressive Web App on iOS or Android -- works from your browser.', badge:'Open Web', badgeColor:'var(--fg-blue)', action:() => window.open('/') },
                  { icon:'🤖', name:'Telegram Bot', desc:'Chat with your Forge agents via Telegram. Use /help to see available commands.', badge:'Connect', badgeColor:'var(--fg-blue)', action:() => alert('Add your Telegram Bot token in Settings → Platforms → Telegram') },
                  { icon:'💬', name:'WeChat / WeCom', desc:'Integrate Forge with WeChat or WeCom for enterprise team messaging.', badge:'Configure', badgeColor:'var(--fg-green)', action:() => alert('WeChat integration coming soon. Email support@forge.ai for early access.') },
                  { icon:'🔌', name:'REST API', desc:'Full API access with your JWT token. Use any language or framework to call Forge models.', badge:'Docs', badgeColor:'var(--fg-orange)', action:() => window.open('/api-docs') },
                  { icon:'⚡', name:'Slack', desc:'Bring Forge into your Slack workspace. Ask questions and run agents without leaving Slack.', badge:'Install', badgeColor:'var(--fg-orange)', action:() => alert('Slack app coming soon. Join waitlist at forge.ai/slack') },
                ].map(p => (
                  <div key={p.name} style={{ padding:'20px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <span style={{ fontSize:28 }}>{p.icon}</span>
                      <p style={{ margin:0, fontSize:16, fontWeight:600, color:'var(--fg-text)' }}>{p.name}</p>
                    </div>
                    <p style={{ margin:'0 0 14px', fontSize:13, color:'var(--fg-text3)', lineHeight:1.5 }}>{p.desc}</p>
                    <button onClick={p.action} style={{ padding:'8px 16px', background:p.badgeColor, border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>{p.badge}</button>
                  </div>
                ))}
              </div>

              {/* API reference */}
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:16, padding:24, marginTop:24 }}>
                <h3 style={{ color:'var(--fg-text2)', margin:'0 0 16px', fontSize:15 }}>Quick API Reference</h3>
                <div style={{ background:'var(--fg-bg)', borderRadius:8, padding:16, fontFamily:'monospace', fontSize:12, color:'var(--fg-orange)' }}>
                  <p style={{ margin:'0 0 8px', color:'var(--fg-text3)' }}># Chat with a model</p>
                  <p style={{ margin:'0 0 16px' }}>POST {API}/threads/:threadId/messages</p>
                  <p style={{ margin:'0 0 8px', color:'var(--fg-text3)' }}># Dispatch an agent</p>
                  <p style={{ margin:'0 0 16px' }}>POST {API}/dispatch/run</p>
                  <p style={{ margin:'0 0 8px', color:'var(--fg-text3)' }}># Authorization header</p>
                  <p style={{ margin:0 }}>Authorization: Bearer {'<your-jwt-token>'}</p>
                </div>
                <p style={{ margin:'12px 0 0', fontSize:12, color:'var(--fg-text3)' }}>Your token: {user.token.slice(0,20)}...{user.token.slice(-8)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ──────────────────────────────────────────────────── */}
        {mainTab === 'settings' && (
          <div style={{ flex:1, overflowY:'auto', padding:32 }}>
            <div style={{ maxWidth:700, margin:'0 auto' }}>
              <h2 style={{ color:'var(--fg-orange)', margin:'0 0 4px', fontSize:22, fontFamily:'var(--fg-font-display)', fontWeight:800, letterSpacing:'-0.3px' }}>⚙️ Settings</h2>
              <p style={{ color:'var(--fg-text3)', margin:'0 0 24px', fontSize:14 }}>Configure API keys, agents, and preferences</p>

              {/* Connected Services */}
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:16, padding:24, marginBottom:24 }}>
                <h3 style={{ color:'var(--fg-text2)', fontSize:14, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Connected Services</h3>
                <p style={{ color:'var(--fg-text3)', fontSize:12, margin:'0 0 16px' }}>Sign in with your existing subscriptions or enter API keys to use Claude, OpenAI, and Cursor.</p>
                {([
                  { id:'claude', icon:'🟣', name:'Claude', color:'var(--fg-orange)', apiKeyId:'anthropic', placeholder:'sk-ant-...', keyHint:'console.anthropic.com/keys' },
                  { id:'openai', icon:'🟢', name:'OpenAI / ChatGPT', color:'var(--fg-green)', apiKeyId:'openai', placeholder:'sk-...', keyHint:'platform.openai.com/api-keys' },
                  { id:'cursor', icon:'🔵', name:'Cursor', color:'var(--fg-blue)', apiKeyId:'', placeholder:'', keyHint:'' },
                ] as const).map(svc => {
                  const creds = serviceCreds[svc.id];
                  const hasApiKey = svc.apiKeyId && apiKeys[svc.apiKeyId];
                  return (
                    <div key={svc.id} style={{ marginBottom:16, background:'var(--fg-bg)', borderRadius:12, border:`1px solid ${creds.connected || hasApiKey ? svc.color + '66' : 'var(--fg-border)'}`, overflow:'hidden' }}>
                      {/* Service header */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderBottom:'1px solid var(--fg-border)' }}>
                        <span style={{ fontSize:18 }}>{svc.icon}</span>
                        <p style={{ margin:0, fontSize:14, fontWeight:600, color:'var(--fg-text)' }}>{svc.name}</p>
                        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
                          {creds.connected && <span style={{ fontSize:11, color:'var(--fg-green)', background:'rgba(34,197,94,0.13)', padding:'2px 8px', borderRadius:20 }}>✓ Signed in · {creds.email}</span>}
                          {!creds.connected && hasApiKey && <span style={{ fontSize:11, color:'var(--fg-green)', background:'rgba(34,197,94,0.13)', padding:'2px 8px', borderRadius:20 }}>✓ API key active</span>}
                          {!creds.connected && !hasApiKey && <span style={{ fontSize:11, color:'var(--fg-text3)' }}>Not connected</span>}
                        </div>
                      </div>

                      <div style={{ padding:'14px' }}>
                        {/* Subscription login */}
                        <p style={{ margin:'0 0 8px', fontSize:11, color:'var(--fg-text3)', fontWeight:600, textTransform:'uppercase' }}>Monthly subscription login</p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                          <input
                            placeholder="Email address"
                            type="email"
                            value={creds.email}
                            onChange={e => setServiceCreds(p => ({ ...p, [svc.id]: { ...p[svc.id], email: e.target.value } }))}
                            style={{ padding:'9px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }}
                          />
                          <input
                            placeholder="Password"
                            type="password"
                            value={creds.password}
                            onChange={e => setServiceCreds(p => ({ ...p, [svc.id]: { ...p[svc.id], password: e.target.value } }))}
                            style={{ padding:'9px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }}
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
                            style={{ padding:'8px 16px', background: creds.connected ? 'rgba(34,197,94,0.20)' : svc.color, border: creds.connected ? `1px solid var(--fg-green)` : 'none', borderRadius:8, color: creds.connected ? 'var(--fg-green)' : '#fff', fontSize:13, cursor:'pointer', fontWeight:600 }}
                          >
                            {creds.connected ? '✓ Connected' : 'Connect Account'}
                          </button>
                          {creds.connected && (
                            <button
                              onClick={() => { setServiceCreds(p => ({ ...p, [svc.id]: { email:'', password:'', connected:false } })); localStorage.removeItem(`forge_svc_${svc.id}`); }}
                              style={{ padding:'8px 12px', background:'transparent', border:'1px solid var(--fg-red)', borderRadius:8, color:'var(--fg-red)', fontSize:12, cursor:'pointer' }}
                            >
                              Disconnect
                            </button>
                          )}
                          <button onClick={() => window.open(svc.id === 'claude' ? 'https://claude.ai/upgrade' : svc.id === 'openai' ? 'https://chat.openai.com/upgrade' : 'https://cursor.sh/pricing', '_blank')} style={{ padding:'8px 12px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text3)', fontSize:12, cursor:'pointer' }}>
                            View plans →
                          </button>
                        </div>

                        {/* API Key section */}
                        {svc.apiKeyId && (
                          <>
                            <div style={{ borderTop:'1px solid var(--fg-border)', paddingTop:12, marginTop:4 }}>
                              <p style={{ margin:'0 0 8px', fontSize:11, color:'var(--fg-text3)', fontWeight:600, textTransform:'uppercase' }}>Or use API key</p>
                              <div style={{ display:'flex', gap:8 }}>
                                <input
                                  type="password"
                                  placeholder={svc.placeholder}
                                  value={apiKeys[svc.apiKeyId] || ''}
                                  onChange={e => setApiKeys(prev => ({ ...prev, [svc.apiKeyId]: e.target.value }))}
                                  style={{ flex:1, padding:'9px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }}
                                />
                                <button onClick={() => saveOneKey(svc.apiKeyId, apiKeys[svc.apiKeyId] || '')} style={{ padding:'9px 16px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>
                                  {savedProviders[svc.apiKeyId] ? '✓ Saved' : 'Save'}
                                </button>
                                <button onClick={() => window.open(`https://${svc.keyHint}`, '_blank')} style={{ padding:'9px 12px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text3)', fontSize:12, cursor:'pointer' }}>
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

              {/* Key Vault -- all saved keys with status, update, delete */}
              {vaultKeys.length > 0 && (
                <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:16, padding:24, marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <div>
                      <h3 style={{ color:'var(--fg-orange)', fontSize:14, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.05em' }}>🔐 Key Vault</h3>
                      <p style={{ color:'var(--fg-text3)', fontSize:12, margin:0 }}>Your API keys are encrypted and saved -- no re-entry needed on login.</p>
                    </div>
                    <button onClick={loadVault} style={{ background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:'4px 10px' }}>↻ Refresh</button>
                  </div>
                  {vaultKeys.map(v => (
                    <div key={v.provider} style={{ marginBottom:10, background:'var(--fg-bg)', borderRadius:12, border:`1px solid ${v.key_status==='active' ? '#05966633' : v.key_status==='invalid' ? 'rgba(248,113,113,0.33)' : 'rgba(255,255,255,0.033)'}`, padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                        {/* Status dot */}
                        <div style={{ width:8, height:8, borderRadius:'50%', background: v.key_status==='active' ? 'var(--fg-green)' : v.key_status==='invalid' ? 'var(--fg-red)' : 'var(--fg-text2)', boxShadow: v.key_status==='active' ? '0 0 6px var(--fg-green)' : v.key_status==='invalid' ? '0 0 6px var(--fg-red)' : 'none', flexShrink:0 }} />
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--fg-text)', flex:1, textTransform:'capitalize' }}>{v.provider}</span>
                        <span style={{ fontSize:11, color:'var(--fg-text3)', fontFamily:'monospace' }}>{v.key_preview}</span>
                        <span style={{ fontSize:10, color: v.key_status==='active' ? 'var(--fg-green)' : v.key_status==='invalid' ? 'var(--fg-red)' : 'var(--fg-orange2)', background: v.key_status==='active' ? '#05966622' : v.key_status==='invalid' ? 'rgba(248,113,113,0.13)' : 'rgba(251,146,60,0.13)', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>{v.key_status==='active' ? '✓ Active' : v.key_status==='invalid' ? '✗ Invalid' : '● Inactive'}</span>
                        {/* Validate button */}
                        <button onClick={() => validateVaultKey(v.provider)} disabled={vaultValidating[v.provider]} title="Test this key against the provider API" style={{ background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-orange)', cursor:'pointer', fontSize:11, padding:'3px 8px', whiteSpace:'nowrap' }}>
                          {vaultValidating[v.provider] ? '⟳ Testing…' : '⚡ Validate'}
                        </button>
                        <button onClick={() => deleteVaultKey(v.provider)} title="Remove key" style={{ background:'transparent', border:'1px solid var(--fg-red)', borderRadius:6, color:'var(--fg-red)', cursor:'pointer', fontSize:11, padding:'3px 8px' }}>✕ Delete</button>
                      </div>
                      {/* Update key inline */}
                      <div style={{ display:'flex', gap:8 }}>
                        <input
                          type="password"
                          placeholder="Paste new key to update…"
                          value={vaultUpdateInputs[v.provider] || ''}
                          onChange={e => setVaultUpdateInputs(prev => ({ ...prev, [v.provider]: e.target.value }))}
                          style={{ flex:1, padding:'7px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12 }}
                        />
                        <button
                          onClick={() => updateVaultKey(v.provider)}
                          disabled={vaultUpdating === v.provider || !vaultUpdateInputs[v.provider]?.trim()}
                          style={{ padding:'7px 14px', background: vaultUpdateInputs[v.provider]?.trim() ? 'var(--fg-orange)' : 'var(--fg-bg4)', border:'none', borderRadius:8, color:'#fff', fontSize:12, cursor:'pointer', opacity: vaultUpdating===v.provider ? 0.6 : 1 }}
                        >
                          {vaultUpdating===v.provider ? '…' : 'Update'}
                        </button>
                      </div>
                      <p style={{ margin:'6px 0 0', fontSize:10, color:'var(--fg-text3)' }}>Last updated {new Date(v.updated_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* LLM Providers -- username + password + API key */}
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:16, padding:24, marginBottom:24 }}>
                <h3 style={{ color:'var(--fg-text2)', fontSize:14, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>LLM Providers</h3>
                <p style={{ color:'var(--fg-text3)', fontSize:12, margin:'0 0 16px' }}>Connect with your account credentials or paste an API key directly.</p>
                {([
                  { key:'openrouter', icon:'🔀', label:'OpenRouter', color:'var(--fg-orange)', placeholder:'sk-or-v1-...', hint:'openrouter.ai/keys', loginUrl:'https://openrouter.ai/sign-in' },
                  { key:'groq',       icon:'⚡', label:'Groq',        color:'#F97316', placeholder:'gsk_...',      hint:'console.groq.com/keys', loginUrl:'https://console.groq.com' },
                  { key:'gemini',     icon:'✨', label:'Google Gemini', color:'#4285F4', placeholder:'AIza...',    hint:'aistudio.google.com', loginUrl:'https://aistudio.google.com' },
                  { key:'mistral',    icon:'🌊', label:'Mistral',     color:'var(--fg-blue)', placeholder:'...',          hint:'console.mistral.ai', loginUrl:'https://console.mistral.ai' },
                  { key:'together',   icon:'🤝', label:'Together AI', color:'var(--fg-green)', placeholder:'...',          hint:'api.together.xyz', loginUrl:'https://api.together.xyz/signin' },
                  { key:'perplexity', icon:'🔭', label:'Perplexity',  color:'#8B5CF6', placeholder:'pplx-...',    hint:'perplexity.ai/settings', loginUrl:'https://www.perplexity.ai' },
                ] as const).map(({ key, icon, label, color, placeholder, hint, loginUrl }) => {
                  const creds = llmCreds[key];
                  const expanded = llmExpanded[key];
                  const hasKey = !!apiKeys[key];
                  return (
                    <div key={key} style={{ marginBottom:10, background:'var(--fg-bg)', borderRadius:12, border:`1px solid ${creds.connected || hasKey ? color + '55' : 'var(--fg-border)'}`, overflow:'hidden' }}>
                      {/* Header row */}
                      <div onClick={() => setLlmExpanded(p => ({ ...p, [key]: !p[key] }))} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer' }}>
                        <span style={{ fontSize:18 }}>{icon}</span>
                        <div style={{ flex:1 }}>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--fg-text)' }}>{label}</p>
                          <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{hint}</p>
                        </div>
                        {creds.connected && <span style={{ fontSize:11, color:color, background:color+'22', padding:'2px 8px', borderRadius:20 }}>✓ Signed in · {creds.username}</span>}
                        {!creds.connected && hasKey && <span style={{ fontSize:11, color:'var(--fg-green)', background:'rgba(34,197,94,0.13)', padding:'2px 8px', borderRadius:20 }}>✓ API key active</span>}
                        {!creds.connected && !hasKey && <span style={{ fontSize:11, color:'var(--fg-text3)' }}>Not connected</span>}
                        <span style={{ color:'var(--fg-text3)', fontSize:12, marginLeft:4 }}>{expanded ? '▲' : '▼'}</span>
                      </div>
                      {/* Expanded body */}
                      {expanded && (
                        <div style={{ padding:'0 14px 14px', borderTop:'1px solid var(--fg-border)' }}>
                          {/* Username + password */}
                          <p style={{ color:'var(--fg-text3)', fontSize:12, margin:'12px 0 8px' }}>Sign in with your {label} account</p>
                          <input
                            type="text"
                            placeholder="Username or email"
                            value={creds.username}
                            onChange={e => setLlmCreds(p => ({ ...p, [key]: { ...p[key], username: e.target.value } }))}
                            style={{ width:'100%', padding:'9px 12px', marginBottom:8, background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }}
                          />
                          <input
                            type="password"
                            placeholder="Password"
                            value={creds.password}
                            onChange={e => setLlmCreds(p => ({ ...p, [key]: { ...p[key], password: e.target.value } }))}
                            style={{ width:'100%', padding:'9px 12px', marginBottom:10, background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, boxSizing:'border-box' }}
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
                              }} style={{ flex:1, padding:'9px', background:'transparent', border:'1px solid var(--fg-red)', borderRadius:8, color:'var(--fg-red)', fontSize:13, cursor:'pointer' }}>
                                Disconnect
                              </button>
                            )}
                            <button onClick={() => window.open(loginUrl, '_blank')} style={{ padding:'9px 12px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text3)', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                              Sign up →
                            </button>
                          </div>
                          {/* Or use API key */}
                          <p style={{ color:'var(--fg-text3)', fontSize:12, margin:'0 0 8px' }}>-- or use an API key directly --</p>
                          <div style={{ display:'flex', gap:8 }}>
                            <input
                              type="password"
                              placeholder={placeholder}
                              value={apiKeys[key] || ''}
                              onChange={e => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
                              style={{ flex:1, padding:'9px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }}
                            />
                            <button onClick={async () => { await saveOneKey(key, apiKeys[key] || ''); if (key === 'openrouter') loadOpenRouterModels(); }} style={{ padding:'9px 14px', background:color, border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                              {savedProviders[key] ? '✓ Saved' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Agents management */}
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:16, padding:24, marginBottom:24 }}>
                <h3 style={{ color:'var(--fg-text2)', fontSize:14, margin:'0 0 16px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Agents</h3>
                {agents.map(a => (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--fg-bg)', borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>{a.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, color:'var(--fg-text)', fontWeight:500 }}>{a.name}</p>
                      <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{a.model} {a.built_in ? '· built-in' : ''}</p>
                    </div>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:a.enabled ? 'var(--fg-green)' : 'var(--fg-text3)' }} />
                  </div>
                ))}
                {agents.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:13 }}>No agents loaded.</p>}
              </div>

              {/* Account */}
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:16, padding:24 }}>
                <h3 style={{ color:'var(--fg-text2)', fontSize:14, margin:'0 0 16px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Account</h3>
                <p style={{ margin:'0 0 4px', fontSize:13, color:'var(--fg-text)' }}>{user.name || '(no name)'}</p>
                <p style={{ margin:'0 0 16px', fontSize:13, color:'var(--fg-text3)' }}>{user.email}</p>
                <button onClick={handleLogout} style={{ padding:'8px 16px', background:'transparent', border:'1px solid var(--fg-red)', borderRadius:8, color:'var(--fg-red)', fontSize:13, cursor:'pointer' }}>Sign Out</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADMIN TAB ───────────────────────────────────────────────────────── */}
        {mainTab === 'admin' && user.role === 'admin' && (
          <div style={{ flex:1, overflowY:'auto', padding:24 }}>
            <div style={{ maxWidth:960, margin:'0 auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                <span style={{ fontSize:24 }}>🛡️</span>
                <div>
                  <h2 style={{ margin:0, color:'var(--fg-orange2)', fontSize:20, fontWeight:800, fontFamily:'var(--fg-font-display)' }}>Admin Panel</h2>
                  <p style={{ margin:0, color:'var(--fg-text3)', fontSize:13 }}>Platform management & moderation</p>
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--fg-bg)', padding:4, borderRadius:10, width:'fit-content' }}>
                {([
                  { id:'stats', label:'📊 Stats' },
                  { id:'users', label:'👥 Users' },
                  { id:'keys', label:'🔑 Platform Keys' },
                  { id:'models', label:'🤖 Models' },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setAdminTab(t.id)} style={{ padding:'7px 16px', background:adminTab===t.id ? 'var(--fg-bg4)' : 'transparent', border:`1px solid ${adminTab===t.id ? 'var(--fg-orange2)' : 'transparent'}`, borderRadius:7, color:adminTab===t.id ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:13, fontWeight:adminTab===t.id ? 600 : 400, whiteSpace:'nowrap' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── STATS ── */}
              {adminTab === 'stats' && (
                <div>
                  <div style={{ display:'flex', gap:4, marginBottom:16 }}>
                    <button onClick={() => { loadAdminStats(); loadAdminUsers(); loadAdminKeys(); loadAdminModels(); }} style={{ padding:'7px 16px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-orange)', cursor:'pointer', fontSize:13 }}>↺ Refresh</button>
                  </div>
                  {adminStats ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16, marginBottom:24 }}>
                      {[
                        { label:'Total Users', value: adminStats.total_users ?? 0, color:'var(--fg-orange)' },
                        { label:'Active Today', value: adminStats.active_today ?? 0, color:'var(--fg-blue)' },
                        { label:'Threads', value: adminStats.total_threads ?? 0, color:'var(--fg-green)' },
                        { label:'Messages', value: adminStats.total_messages ?? 0, color:'var(--fg-orange)' },
                        { label:'Revenue (USD)', value: `$${(adminStats.total_revenue_usd ?? 0).toFixed(2)}`, color:'var(--fg-orange)' },
                        { label:'Tokens Used', value: (adminStats.total_tokens ?? 0).toLocaleString(), color:'var(--fg-blue)' },
                      ].map(s => (
                        <div key={s.label} style={{ background:'var(--fg-bg3)', border:`1px solid ${s.color}33`, borderRadius:12, padding:'20px 20px 16px' }}>
                          <p style={{ margin:'0 0 8px', fontSize:12, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</p>
                          <p style={{ margin:0, fontSize:28, fontWeight:700, color:s.color, fontFamily:'var(--fg-font-mono)' }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12, padding:40, textAlign:'center' }}>
                      <p style={{ color:'var(--fg-text3)', fontSize:14 }}>Loading stats… click Refresh if this takes long.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── USERS ── */}
              {adminTab === 'users' && (
                <div>
                  <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:16 }}>{adminUsers.length} users registered</p>
                  <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px 100px', gap:0, padding:'10px 16px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)' }}>
                      {['Email','Role','Joined','Actions'].map(h => <span key={h} style={{ fontSize:11, color:'var(--fg-text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>)}
                    </div>
                    {adminUsers.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:13, padding:'16px' }}>No users found.</p>}
                    {adminUsers.map((u: any) => (
                      <div key={u.id} style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px 100px', gap:0, padding:'12px 16px', borderBottom:'1px solid var(--fg-border)', alignItems:'center' }}>
                        <div>
                          <p style={{ margin:0, fontSize:13, color:'var(--fg-text)' }}>{u.email}</p>
                          {u.first_name && <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{u.first_name} {u.last_name}</p>}
                        </div>
                        <select value={u.role} onChange={e => changeUserRole(u.id, e.target.value)} style={{ padding:'4px 8px', background:'var(--fg-bg)', border:`1px solid ${u.role==='admin' ? 'var(--fg-orange2)' : 'var(--fg-border)'}`, borderRadius:6, color:u.role==='admin' ? 'var(--fg-orange2)' : 'var(--fg-text2)', fontSize:12, cursor:'pointer' }}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                        <span style={{ fontSize:11, color:'var(--fg-text3)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '--'}</span>
                        <span style={{ fontSize:11, color:u.verified ? 'var(--fg-green)' : 'var(--fg-red)' }}>{u.verified ? '✓ verified' : '✗ unverified'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PLATFORM KEYS ── */}
              {adminTab === 'keys' && (
                <div>
                  <p style={{ color:'var(--fg-text2)', fontSize:13, marginBottom:20 }}>Platform-level API keys are used as fallback for all users who haven't saved their own key. Keys are encrypted server-side and never exposed to the frontend.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[
                      { provider:'anthropic', label:'Anthropic (Claude)', placeholder:'sk-ant-api03-...', color:'var(--fg-orange)' },
                      { provider:'openai', label:'OpenAI', placeholder:'sk-...', color:'var(--fg-green)' },
                      { provider:'gemini', label:'Google Gemini', placeholder:'AIza...', color:'var(--fg-blue)' },
                      { provider:'groq', label:'Groq', placeholder:'gsk_...', color:'var(--fg-orange)' },
                      { provider:'openrouter', label:'OpenRouter', placeholder:'sk-or-v1-...', color:'var(--fg-orange)' },
      { provider:'morph', label:'Morph', placeholder:'sk-CKUd-...', color:'var(--fg-blue)' },
                      { provider:'mistral', label:'Mistral', placeholder:'...', color:'var(--fg-blue)' },
                      { provider:'together', label:'Together AI', placeholder:'...', color:'var(--fg-green)' },
                      { provider:'perplexity', label:'Perplexity', placeholder:'pplx-...', color:'var(--fg-red)' },
                    ].map(({ provider, label, placeholder, color }) => {
                      const saved = adminPlatformKeys.find((k: any) => k.provider === provider);
                      return (
                        <div key={provider} style={{ background:'var(--fg-bg3)', border:`1px solid ${saved ? color+'44' : 'var(--fg-border)'}`, borderRadius:12, padding:16 }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                            <div>
                              <span style={{ fontSize:13, color:'var(--fg-text)', fontWeight:600 }}>{label}</span>
                              {saved && <span style={{ marginLeft:10, fontSize:11, color:color, background:color+'22', padding:'2px 8px', borderRadius:20 }}>✓ Key saved · enabled={saved.enabled ? 'yes' : 'no'}</span>}
                              {!saved && <span style={{ marginLeft:10, fontSize:11, color:'var(--fg-text3)' }}>No platform key</span>}
                            </div>
                            {saved && <button onClick={() => deleteAdminKey(provider)} style={{ padding:'4px 10px', background:'transparent', border:'1px solid var(--fg-red)', borderRadius:6, color:'var(--fg-red)', fontSize:11, cursor:'pointer' }}>Remove</button>}
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <input
                              type="password"
                              placeholder={saved ? '••••••••••• (replace)' : placeholder}
                              value={adminKeyInputs[provider] || ''}
                              onChange={e => setAdminKeyInputs(prev => ({ ...prev, [provider]: e.target.value }))}
                              style={{ flex:1, padding:'9px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13 }}
                            />
                            <button onClick={() => saveAdminKey(provider)} disabled={adminSaving === provider} style={{ padding:'9px 16px', background:color, border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:adminSaving===provider ? 0.6 : 1, whiteSpace:'nowrap' }}>
                              {adminSaving===provider ? '…' : saved ? 'Replace' : 'Save'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── MODELS ── */}
              {adminTab === 'models' && (
                <div>
                  <p style={{ color:'var(--fg-text2)', fontSize:13, marginBottom:20 }}>Enable or disable models platform-wide. Disabled models won't appear in any user's model selector.</p>
                  <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 80px 80px', padding:'10px 16px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)' }}>
                      {['Model','Provider','Markup','Enabled'].map(h => <span key={h} style={{ fontSize:11, color:'var(--fg-text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>)}
                    </div>
                    {adminModels.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:13, padding:'16px' }}>Loading models…</p>}
                    {adminModels.map((m: any) => (
                      <div key={m.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 80px 80px', padding:'10px 16px', borderBottom:'1px solid var(--fg-bg)', alignItems:'center', background:m.enabled ? 'transparent' : 'var(--fg-bg)' }}>
                        <div>
                          <p style={{ margin:0, fontSize:13, color: m.enabled ? 'var(--fg-text)' : 'var(--fg-text3)', fontWeight:500 }}>{m.label}</p>
                          <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{m.id}{m.is_forge_model ? ' · forge' : ''}</p>
                        </div>
                        <span style={{ fontSize:12, color:'var(--fg-text3)', textTransform:'capitalize' }}>{m.provider}</span>
                        <span style={{ fontSize:12, color:'var(--fg-text3)' }}>{m.markup ? `×${m.markup}` : '--'}</span>
                        <button onClick={() => toggleAdminModel(m.id, !m.enabled)} style={{ padding:'5px 12px', background:m.enabled ? 'rgba(34,197,94,0.13)' : 'var(--fg-border)', border:`1px solid ${m.enabled ? 'var(--fg-green)' : 'var(--fg-border2)'}`, borderRadius:20, color:m.enabled ? 'var(--fg-green)' : 'var(--fg-text3)', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.15s' }}>
                          {m.enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FORGE SUPER TAB ──────────────────────────────────────────────── */}
        {mainTab === 'super' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--fg-bg)' }}>
            {/* Super header */}
            <div style={{ padding:'16px 24px 0', borderBottom:'1px solid var(--fg-border)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', animation:'forge-flash 2s ease-in-out infinite', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🌟</div>
                <div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'var(--fg-orange)', fontFamily:'var(--fg-font-display)', letterSpacing:'-0.3px' }}>Forge SuperAgent</h2>
                  <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)' }}>Using: {selectedModel || 'forge-fast'}</p>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
                  {/* Memory count badge */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 12px', background:'var(--fg-bg4)', borderRadius:8, border:'1px solid var(--fg-border2)' }}>
                    <span style={{ fontSize:16, fontWeight:700, color:'var(--fg-orange)', lineHeight:1, fontFamily:'var(--fg-font-mono)' }}>{superStats.memoryCount}</span>
                    <span style={{ fontSize:9, color:'var(--fg-text3)', marginTop:2 }}>MEMORIES</span>
                  </div>
                  {/* Intelligence score badge */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 12px', background: superStats.intelligenceScore > 100 ? 'linear-gradient(135deg,var(--fg-odim),rgba(56,189,248,0.13))' : 'var(--fg-bg4)', borderRadius:8, border:`1px solid ${superStats.intelligenceScore > 100 ? 'var(--fg-odim2)' : 'var(--fg-border2)'}` }}>
                    <span style={{ fontSize:16, fontWeight:700, color: superStats.intelligenceScore > 500 ? 'var(--fg-orange2)' : superStats.intelligenceScore > 100 ? 'var(--fg-orange2)' : 'var(--fg-text3)', lineHeight:1 }}>{superStats.intelligenceScore}</span>
                    <span style={{ fontSize:9, color:'var(--fg-text3)', marginTop:2 }}>FORGE IQ</span>
                  </div>
                  <button onClick={harvestMemory} disabled={superHarvesting} style={{ padding:'8px 16px', background: superHarvesting ? 'var(--fg-bg4)' : 'linear-gradient(135deg,var(--fg-orange),var(--fg-blue))', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: superHarvesting ? 0.6 : 1 }}>
                    {superHarvesting ? <><span style={{ animation:'forge-flash 0.8s infinite', display:'inline-block' }}>⚡</span> Harvesting…</> : '⚡ Harvest Memory'}
                  </button>
                </div>
              </div>
              <div style={{ display:'flex', gap:0 }}>
                {(['chat','memory'] as const).map(t => (
                  <button key={t} onClick={() => setSuperTab(t)} style={{ padding:'8px 18px', background:'transparent', border:'none', borderBottom:`2px solid ${superTab===t ? 'var(--fg-orange)' : 'transparent'}`, color:superTab===t ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:13, fontWeight:superTab===t ? 600 : 400, textTransform:'capitalize' }}>{t === 'chat' ? '💬 Chat' : '🧠 Memory'}</button>
                ))}
              </div>
            </div>

            {superTab === 'chat' && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                {/* Messages */}
                <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
                  {superMessages.length === 0 && (
                    <div style={{ textAlign:'center', padding:'60px 0', color:'var(--fg-text3)' }}>
                      <div style={{ fontSize:48, marginBottom:12, animation:'forge-flash 3s ease-in-out infinite', display:'inline-block' }}>🌟</div>
                      <p style={{ fontSize:16, color:'var(--fg-text3)', margin:'0 0 8px' }}>Forge SuperAgent is ready</p>
                      <p style={{ fontSize:13, color:'var(--fg-text3)', margin:0 }}>Start chatting -- it knows your workspace history. Hit "Harvest Memory" first for best results.</p>
                    </div>
                  )}
                  {superMessages.map((m, i) => (
                    <div key={i} style={{ display:'flex', gap:12, marginBottom:20, flexDirection: m.role==='user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background: m.role==='user' ? 'var(--fg-border2)' : undefined, animation: m.role==='assistant' ? 'forge-flash 2s ease-in-out infinite' : undefined, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                        {m.role==='user' ? '👤' : '🌟'}
                      </div>
                      <div style={{ maxWidth:'70%', padding:'12px 16px', borderRadius: m.role==='user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: m.role==='user' ? 'var(--fg-bg4)' : 'var(--fg-bg2)', border:`1px solid ${m.role==='user' ? 'var(--fg-border2)' : 'rgba(249,115,22,0.27)'}`, color:'var(--fg-text)', fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {superSending && (
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, animation:'forge-flash 1.8s ease-in-out infinite' }}>🌟</div>
                      <div style={{ padding:'12px 18px', borderRadius:'4px 18px 18px 18px', background:'var(--fg-bg2)', border:'2px solid var(--fg-orange)', animation:'forge-ring 1.8s ease-in-out infinite', display:'flex', alignItems:'center', gap:10 }}>
                        {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--fg-orange)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                        <span style={{ fontSize:11, fontWeight:600, animation:'forge-text-flash 1.8s ease-in-out infinite' }}>thinking…</span>
                      </div>
                    </div>
                  )}
                  <div ref={superEndRef} />
                </div>
                {/* Input */}
                <div style={{ padding:'12px 24px 20px', borderTop:'1px solid var(--fg-border)', flexShrink:0 }}>
                  <div style={{ display:'flex', gap:10, background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:12, padding:'8px 12px', alignItems:'flex-end' }}>
                    <textarea value={superInput} onChange={e => setSuperInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendSuperMessage(); } }} placeholder="Ask Forge SuperAgent anything\u2026 it remembers your work" rows={2} style={{ flex:1, background:'transparent', border:'none', color:'var(--fg-text)', fontSize:14, resize:'none', outline:'none', lineHeight:1.6 }} />
                    <button onClick={sendSuperMessage} disabled={superSending || !superInput.trim()} style={{ width:36, height:36, background: superSending ? 'var(--fg-orange)' : superInput.trim() ? 'var(--fg-orange)' : 'var(--fg-bg4)', border:'none', borderRadius:8, color:'#fff', cursor:superInput.trim() && !superSending ? 'pointer' : 'default', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {superSending ? '\u26a1' : '\u2191'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {superTab === 'memory' && (
              <div style={{ flex:1, overflowY:'auto', padding:24 }}>
                {superMemory.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 0' }}>
                    <p style={{ fontSize:32, margin:'0 0 12px' }}>\ud83e\udde0</p>
                    <p style={{ color:'var(--fg-text3)', fontSize:15, margin:'0 0 8px' }}>No memory yet</p>
                    <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'0 0 20px' }}>Click "Harvest Memory" to distill your conversation history into SuperAgent knowledge.</p>
                    <button onClick={harvestMemory} disabled={superHarvesting} style={{ padding:'10px 24px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                      {superHarvesting ? '\u26a1 Harvesting\u2026' : '\u26a1 Harvest Memory Now'}
                    </button>
                  </div>
                ) : (
                  <div style={{ maxWidth:800, margin:'0 auto' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                      <div>
                        <h3 style={{ color:'var(--fg-text)', margin:'0 0 4px', fontSize:18, fontFamily:'var(--fg-font-display)', fontWeight:700 }}>\ud83e\udde0 SuperAgent Memory</h3>
                        <p style={{ color:'var(--fg-text3)', margin:0, fontSize:13 }}>{superMemory.length} insights across {superMemory.reduce((a,m)=>a+m.frequency,0)} observations</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:12, color:'var(--fg-text3)' }}>Strength</span>
                        <div style={{ width:120, height:8, background:'var(--fg-bg4)', borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.min(100, superMemory.length * 5)}%`, background:'linear-gradient(90deg,var(--fg-orange),var(--fg-blue),var(--fg-green))', borderRadius:4 }} />
                        </div>
                        <span style={{ fontSize:11, color:'var(--fg-orange)', fontWeight:600 }}>{Math.min(100, superMemory.length * 5)}%</span>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {superMemory.map(m => (
                        <div key={m.id} style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:12, padding:16, position:'relative' }}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:`hsl(${(m.strength*120).toFixed(0)},70%,60%)`, marginTop:5, flexShrink:0 }} />
                            <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--fg-orange)', flex:1 }}>{m.topic}</p>
                            <button onClick={() => deleteMemoryEntry(m.id)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:2, lineHeight:1 }}>\u2715</button>
                          </div>
                          <p style={{ margin:'0 0 8px', fontSize:13, color:'var(--fg-text2)', lineHeight:1.5 }}>{m.insight}</p>
                          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                            <span style={{ fontSize:10, color:'var(--fg-text3)' }}>Seen {m.frequency}\u00d7</span>
                            <div style={{ flex:1, height:3, background:'var(--fg-bg4)', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${Math.round(m.strength*100)}%`, background:`hsl(${(m.strength*120).toFixed(0)},70%,60%)`, borderRadius:2 }} />
                            </div>
                            <span style={{ fontSize:10, color:'var(--fg-text3)' }}>{Math.round(m.strength*100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── MODALS ────────────────────────────────────────────────────── */}

      {showNewProject && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowNewProject(false)}>
          <div style={{ width:420, background:'var(--fg-bg3)', borderRadius:16, padding:24, border:'1px solid var(--fg-border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'var(--fg-text)', margin:'0 0 20px', fontSize:18, fontFamily:'var(--fg-font-display)', fontWeight:700 }}>New Project</h3>
            <input placeholder="Project name" value={newProjName} onChange={e => setNewProjName(e.target.value)} style={{ width:'100%', padding:'12px', marginBottom:12, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box' }} />
            <p style={{ color:'var(--fg-text3)', fontSize:12, margin:'0 0 8px' }}>Color</p>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {PROJECT_COLORS.map(c => <div key={c} onClick={() => setNewProjColor(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border:newProjColor===c ? '3px solid #fff' : '3px solid transparent' }} />)}
            </div>
            <textarea placeholder="System prompt (optional)" value={newProjPrompt} onChange={e => setNewProjPrompt(e.target.value)} rows={3} style={{ width:'100%', padding:'12px', marginBottom:16, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowNewProject(false)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', cursor:'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (!user || !newProjName.trim()) return;
                try { await apiFetch('/projects', { method:'POST', body:JSON.stringify({ name:newProjName.trim(), color:newProjColor, system_prompt:newProjPrompt }) }, user.token); setShowNewProject(false); setNewProjName(''); setNewProjPrompt(''); await loadProjects(); } catch (e:any) { alert(e.message); }
              }} style={{ flex:1, padding:'10px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showNewTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowNewTask(false)}>
          <div style={{ width:380, background:'var(--fg-bg3)', borderRadius:16, padding:24, border:'1px solid var(--fg-border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'var(--fg-text)', margin:'0 0 20px', fontSize:18, fontFamily:'var(--fg-font-display)', fontWeight:700 }}>New Task</h3>
            <input placeholder="Task title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => { if (e.key==='Enter') addTask(); }} autoFocus style={{ width:'100%', padding:'12px', marginBottom:12, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box', outline:'none' }} />
            <div style={{ display:'flex', gap:6, marginBottom:16 }}>
              {(['low','medium','high'] as const).map(p => {
                const tpc: Record<string,string> = { low:'var(--fg-text2)', medium:'var(--fg-orange)', high:'var(--fg-red)' };
                return <button key={p} onClick={() => setNewTaskPriority(p)} style={{ flex:1, padding:'8px', background:newTaskPriority===p ? tpc[p]+'33' : 'transparent', border:`1px solid ${newTaskPriority===p ? tpc[p] : 'var(--fg-border2)'}`, borderRadius:6, color:newTaskPriority===p ? tpc[p] : 'var(--fg-text2)', cursor:'pointer', fontSize:12, textTransform:'capitalize' }}>{p}</button>;
              })}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowNewTask(false)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', cursor:'pointer' }}>Cancel</button>
              <button onClick={addTask} style={{ flex:1, padding:'10px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Add Task</button>
            </div>
          </div>
        </div>
      )}

      {renamingThread && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setRenamingThread(null)}>
          <div style={{ width:380, background:'var(--fg-bg3)', borderRadius:16, padding:24, border:'1px solid var(--fg-border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'var(--fg-text)', margin:'0 0 20px', fontSize:18, fontFamily:'var(--fg-font-display)', fontWeight:700 }}>Rename Thread</h3>
            <input value={renamingThread.title} onChange={e => setRenamingThread(prev => prev ? { ...prev, title: e.target.value } : prev)} onKeyDown={e => { if (e.key==='Enter') renameThread(); }} autoFocus style={{ width:'100%', padding:'12px', marginBottom:16, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box', outline:'none' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setRenamingThread(null)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', cursor:'pointer' }}>Cancel</button>
              <button onClick={renameThread} style={{ flex:1, padding:'10px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
