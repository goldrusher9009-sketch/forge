// Forge AI Workspace v6.6 -- fix stuck-thinking: early-return now clears sending state; fix model auto-select: platform/env keys now populate model dropdown
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── CSS injected once for animations ────────────────────────────────────────
const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --fg-bg:      #0d0608;
  --fg-bg2:     #120a0c;
  --fg-bg3:     #1a0e12;
  --fg-bg4:     #231419;
  --fg-bg5:     #2e1a20;
  --fg-orange:  #cc2936;
  --fg-orange2: #e63946;
  --fg-odim:    rgba(204,41,54,0.14);
  --fg-odim2:   rgba(204,41,54,0.22);
  --fg-border:  rgba(255,255,255,0.06);
  --fg-border2: rgba(255,255,255,0.11);
  --fg-border3: rgba(204,41,54,0.30);
  --fg-text:    #f0ecec;
  --fg-text2:   #9a8f91;
  --fg-text3:   #5c5054;
  --fg-green:   #4ade80;
  --fg-purple:  #a78bfa;
  --fg-blue:    #60a5fa;
  --fg-red:     #f87171;
  --fg-font-ui: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --fg-font-display: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --fg-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

* { box-sizing: border-box; }

body, #__next { background: var(--fg-bg) !important; color: var(--fg-text) !important; font-family: var(--fg-font-ui) !important; }

::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--fg-bg5); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--fg-bg4); }

@keyframes pulse { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }
@keyframes fg-live-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{opacity:.7;box-shadow:0 0 0 5px rgba(34,197,94,0)} }
@keyframes fg-orange-glow { 0%,100%{box-shadow:0 0 0 0 rgba(204,41,54,.35)} 50%{box-shadow:0 0 0 5px rgba(204,41,54,0)} }
@keyframes forge-flash {
  0%,100% { background:var(--fg-orange); box-shadow:0 0 12px rgba(204,41,54,.6); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 20px rgba(230,57,70,.4); }
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
  0%,100% { background:var(--fg-orange); box-shadow:0 0 0 0 rgba(204,41,54,.5); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 0 6px rgba(204,41,54,0); }
}
@keyframes fg-think { 0%,60%,100%{transform:scale(.8);opacity:.3} 30%{transform:scale(1.15);opacity:1} }
@keyframes fg-slide-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes fg-topbar-line { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
@keyframes neon-cycle {
  0%   { color: #ff003c; text-shadow: 0 0 8px #ff003c, 0 0 22px rgba(255,0,60,.6); }
  14%  { color: #ff6600; text-shadow: 0 0 8px #ff6600, 0 0 22px rgba(255,102,0,.6); }
  28%  { color: #ffcc00; text-shadow: 0 0 8px #ffcc00, 0 0 22px rgba(255,204,0,.6); }
  42%  { color: #00ff88; text-shadow: 0 0 8px #00ff88, 0 0 22px rgba(0,255,136,.6); }
  57%  { color: #00ccff; text-shadow: 0 0 8px #00ccff, 0 0 22px rgba(0,204,255,.6); }
  71%  { color: #9f4ffa; text-shadow: 0 0 8px #9f4ffa, 0 0 22px rgba(159,79,250,.6); }
  85%  { color: #ff0099; text-shadow: 0 0 8px #ff0099, 0 0 22px rgba(255,0,153,.6); }
  100% { color: #ff003c; text-shadow: 0 0 8px #ff003c, 0 0 22px rgba(255,0,60,.6); }
}
`;

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api';

// ─── Code preview helpers (module-level to avoid TSX parser confusion with < chars) ──
function extractCodeBlock(content: string): { code: string; isHtml: boolean } | null {
  const fence = '```';
  const re = new RegExp(fence + '(?:html|jsx?|tsx?|react|svelte|vue)?\\n([\\s\\S]*?)' + fence, 'i');
  const m = content.match(re);
  if (!m) return null;
  const code = m[1].trim();
  const hasTag = code.indexOf('<') !== -1;
  const hasFn = code.indexOf('function') !== -1 || code.indexOf('const ') !== -1;
  const isHtml = hasTag && (code.indexOf('div') !== -1 || code.indexOf('html') !== -1 || code.indexOf('style') !== -1 || code.indexOf('DOCTYPE') !== -1);
  const isRenderable = content.match(new RegExp(fence + '(?:html|jsx?|tsx?|react)', 'i')) || isHtml || hasFn;
  if (!isRenderable) return null;
  if (!hasTag && !hasFn) return null;
  return { code, isHtml };
}
function wrapCodeForPreview(code: string): string {
  const open = '\x3c';
  return open + '!DOCTYPE html>' + open + 'html>' + open + 'head>' + open + 'meta charset="utf-8">' + open + 'style>body{margin:0;font-family:system-ui,sans-serif;background:#fff;}' + open + '/style>' + open + '/head>' + open + 'body>' + code + open + '/body>' + open + '/html>';
}

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
  // Add a 180s timeout for POST requests (LLM calls) — covers Railway cold-start (30s) + LLM latency (90s)
  const signal = opts.signal ?? (opts.method === 'POST' ? AbortSignal.timeout(180000) : undefined);
  const res = await fetch(`${API}${path}`, { ...opts, headers, ...(signal ? { signal } : {}) });
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
          <div style={{ fontSize:40, marginBottom:8, animation:'neon-cycle 4s linear infinite' }}>⚡</div>
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

  // Main tab
  const [mainTab, setMainTab] = useState<'workspace'|'router'|'billing'|'platforms'|'settings'|'admin'|'super'|'forgeauto'|'forgemulti'|'forgeco'|'forgeasi'>('workspace');

  // Right panel tabs
  const [rightTab, setRightTab] = useState<'artifacts'|'tasks'|'schedule'|'dispatch'|'live'|'context'|'browser'|'terminal'|'agent'>('artifacts');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  useEffect(() => {
    const check = () => { const m = window.innerWidth < 768; setIsMobile(m); if (m) setSidebarExpanded(false); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [rightExpanded, setRightExpanded] = useState(true);

  // Composer
  const [input, setInput] = useState('');
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(''); // auto-set by loadApiKeys once user's actual keys are known
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [agentSteps, setAgentSteps] = useState<{icon:string;text:string;ts:number}[]>([]);
  const addAgentStep = (icon: string, text: string) => setAgentSteps(prev => [...prev.slice(-8), { icon, text, ts: Date.now() }]);
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
  // Inline message preview state: msgId -> 'code' | 'preview'
  const [inlinePreviews, setInlinePreviews] = useState<Record<string, 'code'|'preview'>>({});

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
    morph: { username:'', password:'', connected:false },
  });
  const [llmExpanded, setLlmExpanded] = useState<Record<string,boolean>>({});

  // Website credential vault -- stored ONLY in localStorage, never sent to server
  const [webCreds, setWebCreds] = useState<{ id:string; site:string; url:string; username:string; password:string }[]>([]);
  const [webCredForm, setWebCredForm] = useState({ site:'', url:'', username:'', password:'' });
  const [webCredShowPassIds, setWebCredShowPassIds] = useState<Set<string>>(new Set());
  const [webCredEditing, setWebCredEditing] = useState<string|null>(null);

  // Key vault
  const [vaultKeys, setVaultKeys] = useState<VaultKey[]>([]);
  const [vaultUpdateInputs, setVaultUpdateInputs] = useState<Record<string,string>>({});
  const [vaultUpdating, setVaultUpdating] = useState('');
  const [vaultValidating, setVaultValidating] = useState<Record<string,boolean>>({});
  const [keyUsageData, setKeyUsageData] = useState<Record<string,{total_tokens:number;requests:number;cost:number;byModel:{model:string;tokens:number;requests:number}[]}>>({});
  const [keyUsageExpanded, setKeyUsageExpanded] = useState<Record<string,boolean>>({});

  // Thread context menu
  const [threadMenu, setThreadMenu] = useState<{ threadId:string; x:number; y:number } | null>(null);
  const [renamingThread, setRenamingThread] = useState<{ id:string; title:string }|null>(null);
  const [threadStats, setThreadStats] = useState<{ total_tokens:number; message_count:number; token_history:{tokens:number;created_at:string}[] }|null>(null);
  const [projectMenu, setProjectMenu] = useState<{ projectId:string; x:number; y:number } | null>(null);
  const [renamingProject, setRenamingProject] = useState<{ id:string; name:string } | null>(null);
  const [showAllThreads, setShowAllThreads] = useState(false);

  // Navbar token total
  const [totalTokens, setTotalTokens] = useState(0);

  // SuperAgent
  const [superInput, setSuperInput] = useState('');
  const [superMessages, setSuperMessages] = useState<{role:string;content:string}[]>([]);
  const [superSending, setSuperSending] = useState(false);
  const [superMemory, setSuperMemory] = useState<SuperMemory[]>([]);
  const [superHarvesting, setSuperHarvesting] = useState(false);
  const [superTab, setSuperTab] = useState<'chat'|'memory'>('chat');
  const [superStats, setSuperStats] = useState<{memoryCount:number;intelligenceScore:number;threadCount:number}>({memoryCount:0,intelligenceScore:0,threadCount:0});
  const superEndRef = useRef<HTMLDivElement>(null);

  // ForgeAuto state
  const [autoPrompt, setAutoPrompt] = useState('');
  const [autoSelectedModels, setAutoSelectedModels] = useState<string[]>([]);
  const [autoResults, setAutoResults] = useState<{model:string;content:string|null;error?:string;tokens?:number;elapsed?:number}[]>([]);
  const [autoRunning, setAutoRunning] = useState(false);

  // ForgeMulti state
  const [multiPrompt, setMultiPrompt] = useState('');
  const [multiModel, setMultiModel] = useState('claude-sonnet-4-6');
  const [multiRunning, setMultiRunning] = useState(false);
  const [multiResults, setMultiResults] = useState<{agents:{role:string;icon:string;content:string;elapsed:number}[];synthesis:string}|null>(null);
  const [multiSelectedRoles, setMultiSelectedRoles] = useState<string[]>(['Analyst','Creative','Critic','Strategist','Researcher']);

  // ForgeASI state
  const [asiPrompt, setAsiPrompt] = useState('');
  const [asiModel, setAsiModel] = useState('forge-pro');
  const [asiDepth, setAsiDepth] = useState(3);
  const [asiRunning, setAsiRunning] = useState(false);
  const [asiResult, setAsiResult] = useState<{steps:{phase:string;content:string;tokens:number}[];synthesis:string;totalTokens:number;model:string}|null>(null);
  const [asiLivePhases, setAsiLivePhases] = useState<{phase:string;content:string;done:boolean}[]>([]);
  const [asiCurrentPhase, setAsiCurrentPhase] = useState('');
  const [asiWebSearch, setAsiWebSearch] = useState(false);

  // ForgeCo state
  const [coTab, setCoTab] = useState<'code'|'cowork'>('code');
  const [coCode, setCoCode] = useState('// Start coding here...\n');
  const [coCodeLang, setCoCodeLang] = useState('typescript');
  const [coCodePrompt, setCoCodePrompt] = useState('');
  const [coCodeRunning, setCoCodeRunning] = useState(false);
  const [coCodeOutput, setCoCodeOutput] = useState('');
  const [coCoworkInput, setCoCoworkInput] = useState('');
  const [coCoworkMessages, setCoCoworkMessages] = useState<{role:string;content:string}[]>([]);
  const [coCoworkRunning, setCoCoworkRunning] = useState(false);

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
  // AbortController for current sendMessage request -- allows Stop button to cancel in-flight LLM call
  const sendAbortRef = useRef<AbortController|null>(null);
  // Pending message queue -- if user types while AI is thinking, queue it for immediate send after current response
  const [pendingMessage, setPendingMessage] = useState<string>('');

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
    // Wake Railway backend on mount so it's warm when user sends first message
    fetch(`${API.replace('/api', '')}/health`, { signal: AbortSignal.timeout(10000) }).catch(() => {});
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
      const wc = localStorage.getItem('forge_web_creds');
      if (wc) setWebCreds(JSON.parse(wc));
    } catch {}
  }, []);

  // Persist credentials to localStorage whenever they change (client-only)
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('forge_service_creds', JSON.stringify(serviceCreds)); }, [serviceCreds]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('forge_llm_creds', JSON.stringify(llmCreds)); }, [llmCreds]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('forge_web_creds', JSON.stringify(webCreds)); }, [webCreds]);

  // Keep ForgeMulti model in sync with the main model picker
  useEffect(() => { setMultiModel(selectedModel); }, [selectedModel]);

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

  // Connect live activity SSE + polling fallback when user logs in
  useEffect(() => {
    if (!user) { liveSSERef.current?.close(); liveSSERef.current = null; return; }
    const token = user.token;
    const es = new EventSource(`${API}/live/activity?token=${token}`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'connected') return;
        setLiveEvents(prev => {
          const exists = prev.some(e => e.ts === data.ts);
          if (exists) return prev;
          return [{ ...data, ts: data.ts || Date.now() }, ...prev].slice(0, 100);
        });
      } catch {}
    };
    liveSSERef.current = es;
    // Polling fallback — catches events when SSE is on a different backend instance
    let lastTs = 0;
    const poll = setInterval(async () => {
      try {
        const d = await apiFetch(`/live/events?since=${lastTs}`, {}, token);
        if (d?.data?.length) {
          setLiveEvents(prev => {
            const newEvs = (d.data as any[]).filter(e => !prev.some(p => p.ts === e.ts));
            if (!newEvs.length) return prev;
            if (newEvs.length > 0) lastTs = Math.max(...newEvs.map((e:any) => e.ts));
            return [...newEvs, ...prev].slice(0, 100);
          });
          lastTs = Math.max(lastTs, ...d.data.map((e:any) => e.ts));
        }
      } catch {}
    }, 3000);
    return () => { es.close(); clearInterval(poll); };
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
    if (!user || provider === 'morph') return;
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
      const providers = ['anthropic','openai','openrouter','groq','gemini','mistral','together','perplexity','cohere','cursor'];
      const confirmed: Record<string,boolean> = {};
      providers.forEach(p => { if (data[`has_${p}`]) confirmed[p] = true; });
      setSavedProviders(confirmed);
      // Trigger model fetch for all confirmed providers (in background, don't await)
      Object.keys(confirmed).forEach(p => { if (confirmed[p]) loadProviderModels(p); });
      // Auto-select best available model based on keys user has actually saved
      setSelectedModel(prev => {
        // Helper: which provider does a model belong to?
        const provOf = (m: string) => {
          if (!m) return null;
          if (m.startsWith('forge-ultra') || m.startsWith('forge-pro') || m.startsWith('forge-flash') || m.startsWith('claude')) return 'anthropic';
          if (m.startsWith('forge-gpt') || m.startsWith('gpt') || m.startsWith('o3') || m.startsWith('o4') || m.startsWith('o1')) return 'openai';
          if (m.startsWith('forge-gemini') || m.startsWith('gemini')) return 'gemini';
          if (m.startsWith('llama') || m.startsWith('mixtral') || m === 'forge-fast') return 'groq';
          if (m.startsWith('mistral')) return 'mistral';
          if (m.startsWith('morph')) return 'morph';
          if (m.includes('/')) return 'openrouter';
          return null;
        };
        // Keep current selection only if user has a key for that provider
        if (prev && confirmed[provOf(prev) || '']) return prev;
        // Pick first provider user actually has a key for (priority order — no morph)
        if (confirmed['anthropic']) return 'claude-sonnet-4-6';
        if (confirmed['openai']) return 'gpt-4o';
        if (confirmed['gemini']) return 'gemini-2.0-flash';
        if (confirmed['groq']) return 'llama-3.1-8b-instant';
        if (confirmed['mistral']) return 'mistral-small-latest';
        if (confirmed['openrouter']) return prev || ''; // OpenRouter models loaded async via loadOpenRouterModels
        // No keys at all — leave empty so UI shows the warning
        return '';
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
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app'}/api/agent/run`, {
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
    // Auto-harvest into SuperAgent memory (fire-and-forget)
    if (user) apiFetch('/superagent/harvest', { method:'POST' }, user.token).catch(() => {});
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

  const renameProject = async () => {
    if (!user || !renamingProject?.name.trim()) return;
    try {
      await apiFetch(`/projects/${renamingProject.id}`, { method:'PATCH', body:JSON.stringify({ name: renamingProject.name }) }, user.token);
      await loadProjects();
      setRenamingProject(null);
    } catch (e: any) { alert(e.message); }
  };

  const deleteProject = async (id: string) => {
    if (!user || !confirm('Delete this project and all its threads?')) return;
    try {
      await apiFetch(`/projects/${id}`, { method:'DELETE' }, user.token);
      if (activeProject?.id === id) { setActiveProject(null); await loadThreads(); }
      await loadProjects();
    } catch (e: any) { alert(e.message); }
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

  const loadKeyUsage = async (provider: string) => {
    if (!user) return;
    try {
      const d = await apiFetch(`/keys/${provider}/usage`, {}, user.token);
      if (d?.data?.totals) {
        setKeyUsageData(prev => ({ ...prev, [provider]: { total_tokens: d.data.totals.total_tokens, requests: d.data.totals.requests, cost: d.data.totals.cost, byModel: d.data.byModel || [] } }));
      }
    } catch {}
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
    setAgentSteps([]);
    setMultiResponses([]);
    addAgentStep('🧠', 'Processing your message…');
    // Create AbortController so Stop button can cancel this request
    const abortCtrl = new AbortController();
    sendAbortRef.current = abortCtrl;
    // Hard safety timeout: abort + unstick UI after 65s (backend LLM timeout is 50-55s, so error arrives before this)
    const safetyTimer = setTimeout(() => {
      abortCtrl.abort(new DOMException('Request timed out — the model took too long to respond. Try a faster model.', 'TimeoutError'));
      setSending(false); setTyping(false); sendAbortRef.current = null;
    }, 65000);
    // Don't auto-open live tab — user stays in chat view

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
      // Guard: no model selected — tell user clearly instead of silently failing
      if (!cleanModel) {
        const errMsg: Message = { id:'tmp-err', thread_id:currentThread.id, role:'assistant', content:'⚠️ No AI model selected. Go to **Settings → LLM Providers** and add an API key, then pick a model from the dropdown.', created_at:new Date().toISOString() };
        setMessages(prev => [...prev, errMsg]);
        clearTimeout(safetyTimer);
        setSending(false); setTyping(false);
        return;
      }
      const body: any = { content:userContent, model:cleanModel, agent_ids:activeAgentIds };
      let threadId = currentThread.id;

      // Extract AI reply from response and append directly — avoids loadMessages race condition
      const applyResp = (resp: any) => {
        if (resp && resp.success === false) {
          if (resp.error === 'NO_API_KEY') {
            const provName = resp.providerName || resp.provider || 'your LLM provider';
            // Backend already saved the error message in DB; also show it directly
            const provLabel = provName.charAt(0).toUpperCase() + provName.slice(1);
            const errContent = `⚠️ No ${provLabel} API key found. Go to **Settings → LLM Providers** and add your ${provLabel} key.`;
            const errMsg: Message = { id: resp.data?.id || 'tmp-err', thread_id: threadId, role: 'assistant', content: errContent, created_at: new Date().toISOString() };
            setMessages(prev => [...prev.filter(m => m.id !== 'tmp-u'), errMsg]);
            return; // don't throw — message is shown
          }
          throw new Error(resp.message || resp.error || 'Unknown error from server');
        }
        // Success — append AI reply directly from response, no re-fetch needed
        const aiData = resp?.data;
        if (aiData?.content) {
          const aiMsg: Message = { id: aiData.id || 'tmp-ai', thread_id: threadId, role: 'assistant', content: aiData.content, created_at: new Date().toISOString() };
          setMessages(prev => {
            const withoutTemp = prev.filter(m => m.id !== 'tmp-u');
            // Replace temp user message with a clean copy, then add AI reply
            const userMsg: Message = { id: aiData.id + '-u', thread_id: threadId, role: 'user', content: userContent, created_at: new Date().toISOString() };
            const already = withoutTemp.find(m => m.role === 'user' && m.content === userContent);
            return already ? [...withoutTemp, aiMsg] : [...withoutTemp, userMsg, aiMsg];
          });
        }
      };

      try {
        const modelLabel = cleanModel.split('/').pop() || cleanModel;
        addAgentStep('⚙️', `Sending to ${modelLabel}…`);
        const r = await apiFetch(`/threads/${threadId}/messages`, { method:'POST', body:JSON.stringify(body), signal: abortCtrl.signal }, user.token);
        addAgentStep('✅', 'Response received');
        applyResp(r);
      } catch (e: any) {
        // Thread was wiped (Railway redeploy) -- create a fresh one and retry
        if (e.message?.includes('THREAD_NOT_FOUND') || e.message?.includes('404')) {
          const fresh = await apiFetch('/threads', { method:'POST', body:JSON.stringify({ title: userContent.slice(0,60), model: cleanModel }) }, user.token);
          const newT = fresh?.data || fresh;
          threadId = newT.id;
          setActiveThread(newT);
          const r2 = await apiFetch(`/threads/${threadId}/messages`, { method:'POST', body:JSON.stringify(body) }, user.token);
          applyResp(r2);
          await loadThreads(activeProject?.id);
        } else { throw e; }
      }
      // Reload messages in background to sync with DB (don't await — already have the reply)
      loadMessages(threadId);
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
      // Use abort reason if available (set by safetyTimer or Stop button with reason)
      const abortReason = e?.name === 'AbortError' && (e as any).cause?.message;
      const raw: string = abortReason || e.message || 'Something went wrong';
      // Strip raw provider prefixes like "Anthropic error: " for clean display
      const clean = raw
        .replace(/^(anthropic|openai|google|groq|mistral|openrouter) error:\s*/i, '')
        .replace(/^\{"type":"error".*?"message":"([^"]+)".*\}$/i, '$1')
        .replace(/^signal is aborted without reason$/i, 'Request timed out — the model took too long. Try a faster model.')
        .trim();
      const errMsg: Message = { id:'tmp-err', thread_id:currentThread.id, role:'assistant', content:`⚠️ ${clean}`, created_at:new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      clearTimeout(safetyTimer);
      setSending(false); setTyping(false);
      sendAbortRef.current = null;
      // If user queued a message while we were thinking, send it now
      if (pendingMessage.trim()) {
        const queued = pendingMessage;
        setPendingMessage('');
        setTimeout(() => { setInput(queued); }, 50);
      }
    }
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
    <div style={{ display:'flex', height:'100vh', background:'var(--fg-bg)', color:'var(--fg-text)', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow:'hidden', position:'relative' }} onClick={() => { setThreadMenu(null); setProjectMenu(null); if(isMobile) setMobileDrawerOpen(false); }}>

      {/* Mobile overlay */}
      {isMobile && mobileDrawerOpen && <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:98 }} onClick={() => setMobileDrawerOpen(false)} />}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:52, background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)', display:'flex', alignItems:'center', padding:'0 14px', gap:10, zIndex:99, flexShrink:0 }}>
          <button onClick={e => { e.stopPropagation(); setMobileDrawerOpen(o=>!o); }} style={{ background:'none', border:'none', color:'var(--fg-text2)', fontSize:20, cursor:'pointer', padding:4 }}>☰</button>
          <div style={{ width:28, height:28, background:'transparent', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, animation:'neon-cycle 3s linear infinite' }}>⚡</div>
          <span style={{ fontWeight:800, fontSize:15, color:'var(--fg-orange)', fontFamily:'var(--fg-font-display)' }}>Forge</span>
          <div style={{ marginLeft:'auto', fontSize:12, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>{selectedModel || 'forge-fast'}</div>
        </div>
      )}

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <div style={{ width: isMobile ? (mobileDrawerOpen ? 260 : 0) : (sidebarExpanded ? 260 : 60), background:'var(--fg-bg)', borderRight:'1px solid var(--fg-border)', display:'flex', flexDirection:'column', flexShrink:0, transition:'width 0.2s', overflow:'hidden', position: isMobile ? 'fixed' : 'relative', top:0, left:0, bottom:0, zIndex: isMobile ? 99 : 'auto' as any }} onClick={e => e.stopPropagation()}>
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
            { id:'forgeco', icon:'🧑‍💻', label:'ForgeCo' },
            { id:'forgeauto', icon:'⚡', label:'ForgeAuto' },
            { id:'forgemulti', icon:'🤖', label:'ForgeMulti' },
            { id:'forgeasi', icon:'🌌', label:'ForgeASI' },
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
                {/* Regular threads — show 5, rest hidden behind View All */}
                {threads.filter(t => !t.pinned && !t.archived).slice(0, showAllThreads ? 100 : 5).map(t => (
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
                {threads.filter(t => !t.pinned && !t.archived).length > 5 && (
                  <button onClick={() => setShowAllThreads(p => !p)} style={{ width:'100%', padding:'6px 8px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11, marginTop:4 }}>
                    {showAllThreads ? '▲ Show less' : `▼ View all (${threads.filter(t => !t.pinned && !t.archived).length})`}
                  </button>
                )}
                {threads.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:12, padding:'4px 8px' }}>No conversations yet</p>}
              </div>
            </div>

            <div style={{ padding:'0 12px 8px', borderTop:'1px solid var(--fg-border)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0 6px' }}>
                <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:0 }}>Projects</p>
                <button onClick={() => setShowNewProject(true)} style={{ background:'none', border:'none', color:'var(--fg-orange)', cursor:'pointer', fontSize:16, lineHeight:1 }}>+</button>
              </div>
              {unpinnedProjects.slice(0, 8).map(p => (
                <div key={p.id}
                  onContextMenu={e => { e.preventDefault(); setProjectMenu({ projectId:p.id, x:e.clientX, y:e.clientY }); }}
                  onClick={() => selectProject(p)}
                  onMouseEnter={e => { const b = e.currentTarget.querySelector('.proj-menu-btn') as HTMLElement; if (b) b.style.opacity='1'; }}
                  onMouseLeave={e => { const b = e.currentTarget.querySelector('.proj-menu-btn') as HTMLElement; if (b) b.style.opacity='0'; }}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6, cursor:'pointer', background:activeProject?.id===p.id ? 'var(--fg-bg4)' : 'transparent', marginBottom:1 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'var(--fg-text2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                  <button onClick={e => { e.stopPropagation(); setProjectMenu({ projectId:p.id, x:e.clientX, y:e.clientY }); }} className="proj-menu-btn" style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11, padding:'0 2px', opacity:0, transition:'opacity 0.15s' }}>•••</button>
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
                  <span style={{ fontSize:10, color:'var(--fg-border2)', background:'var(--fg-bg4)', padding:'1px 5px', borderRadius:4, border:'1px solid var(--fg-border2)', fontFamily:'monospace' }}>v6.6</span>
                </div>
              </div>
              <button onClick={handleLogout} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12 }}>↗</button>
            </>
          )}
          {!sidebarExpanded && <span style={{ fontSize:9, color:'var(--fg-border2)', fontFamily:'monospace' }}>6.1</span>}
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', marginTop: isMobile ? 52 : 0 }}>

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
              {!isMobile && <button onClick={() => setSketchMode(!sketchMode)} title="Live Preview" style={{ padding:'5px 10px', background:sketchMode ? 'var(--fg-border)' : 'transparent', border:`1px solid ${sketchMode ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:6, color:sketchMode ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:12, flexShrink:0 }}>✏️ Sketch</button>}

              {/* Multi-response toggle */}
              {!isMobile && <button onClick={() => setMultiResponse(!multiResponse)} title="Multiple responses" style={{ padding:'5px 10px', background:multiResponse ? 'var(--fg-border)' : 'transparent', border:`1px solid ${multiResponse ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:6, color:multiResponse ? 'var(--fg-orange)' : 'var(--fg-text2)', cursor:'pointer', fontSize:12, flexShrink:0 }}>⚡ Multi</button>}

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
                  .filter(([p]) => p !== 'openrouter' && p !== 'morph' && savedProviders[p] && providerModels[p]?.length > 0)
                  .map(([p, models]) => ({
                    provider: p,
                    label: p.charAt(0).toUpperCase() + p.slice(1),
                    models: models.slice(0, 30),
                  }));
                const orModels = providerModels['openrouter'] || openRouterModels;
                const noKeys = availableForge.length === 0 && availableDirect.length === 0 && dynamicGroups.length === 0;
                return (
                  <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:8, color: noKeys && orModels.length === 0 ? 'var(--fg-text2)' : 'var(--fg-orange2)', padding:'6px 10px', fontSize:12, cursor:'pointer', maxWidth: isMobile ? 140 : 240 }}>
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

              {!isMobile && <button onClick={() => setRightExpanded(!rightExpanded)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:14 }}>{rightExpanded ? '▶' : '◀'}</button>}
            </div>

            {/* ── Active Agents Navbar ─────────────────────────────────────────── */}
            {agents.filter(a => a.enabled).length > 0 && (
              <div style={{ padding:'4px 16px', borderBottom:'1px solid var(--fg-border)', background:'var(--fg-bg)', display:'flex', alignItems:'center', gap:6, flexShrink:0, overflowX:'auto', minHeight:34 }}>
                <span style={{ fontSize:10, color:'var(--fg-text3)', whiteSpace:'nowrap', marginRight:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Agents</span>
                {agents.filter(a => a.enabled).map(a => {
                  const isActive = activeAgentIds.includes(a.id);
                  const isProcessing = sending && isActive;
                  return (
                    <button key={a.id} onClick={() => toggleAgent(a.id)} title={a.description || a.name} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:14, border: isActive ? `1px solid ${a.color}` : '1px solid var(--fg-border2)', background: isActive ? `${a.color}18` : 'transparent', color: isActive ? a.color : 'var(--fg-text3)', cursor:'pointer', fontSize:11, fontWeight: isActive ? 600 : 400, flexShrink:0, transition:'all 0.15s', position:'relative' }}>
                      <span style={{ fontSize:13, animation: isProcessing ? 'forge-flash 0.8s ease-in-out infinite' : 'none' }}>{a.icon}</span>
                      <span>{a.name}</span>
                      {isProcessing && <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--fg-orange)', display:'inline-block', animation:'pulse 0.8s ease-in-out infinite', marginLeft:2 }} />}
                    </button>
                  );
                })}
                {/* Live activity summary when sending */}
                {sending && agentSteps.length > 0 && (
                  <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'2px 10px', background:'var(--fg-bg4)', border:'1px solid var(--fg-orange)', borderRadius:14, flexShrink:0 }}>
                    <span style={{ fontSize:11, animation:'forge-flash 1s ease-in-out infinite' }}>{agentSteps[agentSteps.length-1]?.icon}</span>
                    <span style={{ fontSize:11, color:'var(--fg-orange)', whiteSpace:'nowrap', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>{agentSteps[agentSteps.length-1]?.text}</span>
                  </div>
                )}
              </div>
            )}

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
                <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '16px 12px' : '24px 32px', display:'flex', flexDirection:'column', gap:16 }}>
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
                  {messages.map((m, i) => {
                    // Extract first code block for inline preview
                    const extracted = m.role === 'assistant' ? extractCodeBlock(m.content) : null;
                    const codeBlock = extracted?.code || null;
                    const isHtml = extracted?.isHtml || false;
                    const msgKey = m.id || String(i);
                    const previewMode = inlinePreviews[msgKey] || 'code';
                    return (
                    <div key={msgKey} style={{ display:'flex', gap:12, alignItems:'flex-start', flexDirection:m.role==='user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:m.role==='user' ? 'var(--fg-orange)' : 'var(--fg-bg4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                        {m.role==='user' ? '👤' : '⚡'}
                      </div>
                      <div style={{ maxWidth: codeBlock ? '90%' : '75%', flex: codeBlock ? 1 : undefined, padding:'12px 16px', borderRadius:m.role==='user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background:m.role==='user' ? 'var(--fg-bg4)' : 'var(--fg-bg3)', border:'1px solid var(--fg-border)', lineHeight:1.6 }}>
                        <p style={{ margin:0, fontSize:14, color:'var(--fg-text)', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{m.content}</p>
                        {/* Inline live preview card */}
                        {codeBlock && (
                          <div style={{ marginTop:12, border:'1px solid var(--fg-border2)', borderRadius:10, overflow:'hidden' }}>
                            {/* Preview toolbar */}
                            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)' }}>
                              <span style={{ fontSize:11, color:'var(--fg-orange)', fontWeight:600, marginRight:4 }}>⚡ Live Preview</span>
                              <button onClick={() => setInlinePreviews(p => ({ ...p, [msgKey]: 'code' }))} style={{ padding:'3px 10px', background: previewMode==='code' ? 'var(--fg-orange)' : 'var(--fg-bg3)', border:'none', borderRadius:5, color: previewMode==='code' ? '#fff' : 'var(--fg-text3)', fontSize:11, cursor:'pointer', fontWeight:600 }}>Code</button>
                              <button onClick={() => setInlinePreviews(p => ({ ...p, [msgKey]: 'preview' }))} style={{ padding:'3px 10px', background: previewMode==='preview' ? 'var(--fg-orange)' : 'var(--fg-bg3)', border:'none', borderRadius:5, color: previewMode==='preview' ? '#fff' : 'var(--fg-text3)', fontSize:11, cursor:'pointer', fontWeight:600 }}>Preview</button>
                              <button onClick={() => { navigator.clipboard.writeText(codeBlock); }} style={{ marginLeft:'auto', padding:'3px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:5, color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }}>📋 Copy</button>
                              <button onClick={() => { setPreviewCode(codeBlock); setSketchMode(true); }} style={{ padding:'3px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:5, color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }} title="Open in Sketch panel">↗ Expand</button>
                            </div>
                            {previewMode === 'code' ? (
                              <pre style={{ margin:0, padding:'12px 14px', background:'var(--fg-bg)', color:'var(--fg-green)', fontSize:12, fontFamily:'var(--fg-font-mono)', overflowX:'auto', maxHeight:280, overflowY:'auto', whiteSpace:'pre', lineHeight:1.6 }}>{codeBlock}</pre>
                            ) : (
                              <iframe
                                srcDoc={isHtml ? codeBlock : wrapCodeForPreview(codeBlock)}
                                style={{ width:'100%', height:320, border:'none', background:'#fff' }}
                                title="Inline Preview"
                                sandbox="allow-scripts allow-same-origin"
                              />
                            )}
                          </div>
                        )}
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
                    );
                  })}
                  {typing && (
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, animation:'forge-flash 1.8s ease-in-out infinite', flexShrink:0 }}>⚡</div>
                      <div style={{ padding:'10px 16px', borderRadius:'4px 18px 18px 18px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', minWidth:180, maxWidth:360 }}>
                        {/* Live activity steps */}
                        {agentSteps.length > 0 ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                            {agentSteps.map((s, i) => (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:7, opacity: i === agentSteps.length - 1 ? 1 : 0.45 }}>
                                <span style={{ fontSize:13 }}>{s.icon}</span>
                                <span style={{ fontSize:11, color:'var(--fg-text2)', animation: i === agentSteps.length - 1 ? 'forge-text-flash 1.4s ease-in-out infinite' : 'none' }}>{s.text}</span>
                                {i === agentSteps.length - 1 && (
                                  <div style={{ display:'flex', gap:3, alignItems:'center', marginLeft:'auto' }}>
                                    {[0,1,2].map(j => <div key={j} style={{ width:4, height:4, borderRadius:'50%', background:'var(--fg-orange)', animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                            {[0,1,2].map(i => <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'var(--fg-orange)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                            <span style={{ fontSize:11, color:'var(--fg-text3)', marginLeft:4 }}>thinking…</span>
                          </div>
                        )}
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
                  {/* Subtle typing indicator — shows only while waiting for response */}
                  {typing && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🤖</div>
                      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                        {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--fg-orange)', opacity:0.7, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Live activity shown in 📺 toolbar button only — no inline overlay */}

                {/* Composer */}
                <div style={{ padding: isMobile ? '8px 10px 12px' : '12px 24px 16px', background:'var(--fg-bg)', borderTop:'1px solid var(--fg-border)' }}>
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
                    <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
                      if (e.key==='Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (sending) {
                          // Queue for after current response
                          if (input.trim()) { setPendingMessage(input.trim()); setInput(''); }
                        } else {
                          sendMessage();
                        }
                      }
                    }} placeholder={sending ? (pendingMessage ? `Queued: "${pendingMessage.slice(0,40)}…"` : 'AI is thinking… press Enter to queue next message') : (activeThread ? 'Message...' : 'Start a conversation...')} rows={isMobile ? 2 : 3} style={{ width:'100%', padding: isMobile ? '10px 12px 40px' : '14px 16px 44px', background:'transparent', border:'none', color:'var(--fg-text)', fontSize: isMobile ? 15 : 14, resize:'none', outline:'none', lineHeight:1.6, boxSizing:'border-box' }} />
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
                        <button onClick={() => { setRightTab('live'); setRightExpanded(true); }} title={liveEvents[0]?.message || 'Live activity'} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background: sending ? 'var(--fg-odim)' : liveEvents.length > 0 ? 'var(--fg-odim)' : 'transparent', border:`1px solid ${sending ? 'var(--fg-orange)' : liveEvents.length > 0 ? 'var(--fg-odim2)' : 'var(--fg-border2)'}`, borderRadius:6, color: sending ? 'var(--fg-orange2)' : liveEvents.length > 0 ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:11, maxWidth:160, overflow:'hidden' }}>
                          <span>📺</span>
                          {sending && liveEvents[0] && <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:10, maxWidth:100 }}>{liveEvents[0].message.slice(0, 30)}</span>}
                        </button>
                        <button onClick={() => { setRightTab('browser'); setRightExpanded(true); }} title="Browser" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>🌐</button>
                        <button onClick={() => { setRightTab('terminal'); setRightExpanded(true); }} title="Terminal" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>💻</button>
                        <button onClick={() => { setRightTab('dispatch'); setRightExpanded(true); }} title="Dispatch agents" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>🚀</button>
                        <button onClick={() => { setShowNewTask(true); }} title="New task" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>✅</button>
                      </div>
                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        {sending && (
                          <button
                            onClick={() => { sendAbortRef.current?.abort(); setSending(false); setTyping(false); sendAbortRef.current = null; }}
                            title="Stop generation"
                            style={{ height:32, padding:'0 10px', background:'rgba(220,38,38,0.85)', border:'1px solid rgba(220,38,38,0.5)', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}
                          >
                            ■ Stop
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (sending) {
                              if (input.trim()) { setPendingMessage(input.trim()); setInput(''); }
                            } else {
                              sendMessage();
                            }
                          }}
                          disabled={!input.trim() && !sending}
                          style={{ width:32, height:32, background: input.trim() ? 'var(--fg-orange)' : sending ? 'var(--fg-bg4)' : 'var(--fg-bg4)', border:'none', borderRadius:8, color:'#fff', cursor: input.trim() ? 'pointer' : 'default', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', animation: sending && !input.trim() ? 'send-pulse 0.9s ease-in-out infinite' : 'none', transition:'background 0.2s' }}
                        >
                          {sending && !input.trim() ? '⚡' : input.trim() && sending ? '⏎' : '↑'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel */}
              {rightExpanded && !isMobile && (
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
                  {DIRECT_MODELS.filter(grp => grp.group !== 'Morph').map(grp => (
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
                  { icon:'🖥️', name:'Desktop App', desc:'Native Electron app for Mac, Windows, Linux. Works offline and syncs with your workspace.', badge:'View Releases', badgeColor:'var(--fg-orange)', comingSoon:false, action:() => window.open('https://github.com/goldrusher9009/forge/releases', '_blank') },
                  { icon:'📱', name:'Mobile PWA', desc:'Install Forge as a Progressive Web App on iOS or Android — tap Share → Add to Home Screen in your browser.', badge:'Open App', badgeColor:'var(--fg-blue)', comingSoon:false, action:() => window.open('https://forge-sand-two.vercel.app', '_blank') },
                  { icon:'🔌', name:'REST API', desc:'Full API access with your JWT token. Use any language or framework to call Forge models and agents.', badge:'API Docs', badgeColor:'var(--fg-orange)', comingSoon:false, action:() => window.open(`${API.replace('/api','')}/health`, '_blank') },
                  { icon:'🤖', name:'Telegram Bot', desc:'Chat with your Forge agents via Telegram. Add your bot token in Settings to connect.', badge:'Get Token', badgeColor:'#229ED9', comingSoon:false, action:() => window.open('https://t.me/BotFather', '_blank') },
                  { icon:'💬', name:'Slack Bot', desc:'Bring Forge into your Slack workspace. Ask questions and run agents without leaving Slack.', badge:'Coming Soon', badgeColor:'var(--fg-text3)', comingSoon:true, action:() => {} },
                  { icon:'🧩', name:'Chrome Extension', desc:'Use Forge on any webpage — highlight text, run agents, get answers in context.', badge:'Coming Soon', badgeColor:'var(--fg-text3)', comingSoon:true, action:() => {} },
                ].map(p => (
                  <div key={p.name} style={{ padding:'20px', background:'var(--fg-bg3)', border:`1px solid ${p.comingSoon ? 'var(--fg-border)' : 'var(--fg-border2)'}`, borderRadius:14, opacity: p.comingSoon ? 0.7 : 1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <span style={{ fontSize:28 }}>{p.icon}</span>
                      <p style={{ margin:0, fontSize:16, fontWeight:600, color:'var(--fg-text)' }}>{p.name}</p>
                      {!p.comingSoon && <span style={{ marginLeft:'auto', fontSize:10, color:'var(--fg-green)', background:'rgba(34,197,94,0.12)', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>LIVE</span>}
                    </div>
                    <p style={{ margin:'0 0 14px', fontSize:13, color:'var(--fg-text3)', lineHeight:1.5 }}>{p.desc}</p>
                    <button onClick={p.action} disabled={p.comingSoon} style={{ padding:'8px 16px', background: p.comingSoon ? 'var(--fg-bg4)' : p.badgeColor, border: p.comingSoon ? '1px solid var(--fg-border)' : 'none', borderRadius:8, color: p.comingSoon ? 'var(--fg-text3)' : '#fff', fontSize:13, cursor: p.comingSoon ? 'default' : 'pointer', fontWeight:600 }}>{p.badge}</button>
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

              {/* Website Credential Vault -- stored only in localStorage, never sent to server */}
              <div style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:16, padding:24, marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <div>
                    <h3 style={{ color:'var(--fg-orange)', fontSize:14, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.05em' }}>🔑 Website Credentials</h3>
                    <p style={{ color:'var(--fg-text3)', fontSize:12, margin:0 }}>Saved locally in your browser only — never sent to any server. Add logins for any website.</p>
                  </div>
                </div>
                {/* Add new entry form */}
                <div style={{ background:'var(--fg-bg)', borderRadius:12, border:'1px solid var(--fg-border)', padding:14, marginTop:14, marginBottom:14 }}>
                  <p style={{ color:'var(--fg-text2)', fontSize:12, fontWeight:600, margin:'0 0 10px' }}>+ Add New Credential</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                    <input type="text" placeholder="Site name (e.g. GitHub)" value={webCredForm.site} onChange={e => setWebCredForm(p => ({ ...p, site: e.target.value }))} style={{ padding:'8px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12 }} />
                    <input type="url" placeholder="URL (e.g. https://github.com)" value={webCredForm.url} onChange={e => setWebCredForm(p => ({ ...p, url: e.target.value }))} style={{ padding:'8px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12 }} />
                    <input type="text" placeholder="Username or email" value={webCredForm.username} onChange={e => setWebCredForm(p => ({ ...p, username: e.target.value }))} style={{ padding:'8px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12 }} />
                    <input type="password" placeholder="Password" value={webCredForm.password} onChange={e => setWebCredForm(p => ({ ...p, password: e.target.value }))} style={{ padding:'8px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:12 }} />
                  </div>
                  <button
                    disabled={!webCredForm.site.trim() || !webCredForm.username.trim()}
                    onClick={() => {
                      if (!webCredForm.site.trim()) return;
                      if (webCredEditing) {
                        setWebCreds(prev => prev.map(c => c.id === webCredEditing ? { ...c, ...webCredForm } : c));
                        setWebCredEditing(null);
                      } else {
                        setWebCreds(prev => [...prev, { id: Date.now().toString(), ...webCredForm }]);
                      }
                      setWebCredForm({ site:'', url:'', username:'', password:'' });
                    }}
                    style={{ padding:'8px 20px', background: webCredForm.site.trim() && webCredForm.username.trim() ? 'var(--fg-orange)' : 'var(--fg-bg4)', border:'none', borderRadius:8, color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}
                  >
                    {webCredEditing ? '✓ Save Changes' : '+ Add'}
                  </button>
                  {webCredEditing && (
                    <button onClick={() => { setWebCredEditing(null); setWebCredForm({ site:'', url:'', username:'', password:'' }); }} style={{ marginLeft:8, padding:'8px 14px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', fontSize:12, cursor:'pointer' }}>Cancel</button>
                  )}
                </div>
                {/* Saved entries */}
                {webCreds.length === 0 && (
                  <p style={{ color:'var(--fg-text3)', fontSize:12, textAlign:'center', margin:'8px 0' }}>No saved credentials yet. Add your first website login above.</p>
                )}
                {webCreds.map(c => (
                  <div key={c.id} style={{ marginBottom:8, background:'var(--fg-bg)', borderRadius:10, border:'1px solid var(--fg-border)', padding:'10px 14px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--fg-text)' }}>{c.site}</span>
                        {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:'var(--fg-orange)', textDecoration:'none' }}>{c.url.replace(/^https?:\/\//, '').split('/')[0]}</a>}
                      </div>
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:'var(--fg-text3)', fontFamily:'monospace' }}>👤 {c.username}</span>
                        <span style={{ fontSize:11, color:'var(--fg-text3)', fontFamily:'monospace', cursor:'pointer' }} onClick={() => setWebCredShowPassIds(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}>
                          🔒 {webCredShowPassIds.has(c.id) ? c.password : '••••••••'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => { setWebCredEditing(c.id); setWebCredForm({ site:c.site, url:c.url, username:c.username, password:c.password }); }} style={{ padding:'5px 10px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-orange)', cursor:'pointer', fontSize:11 }}>✏️ Edit</button>
                    <button onClick={() => navigator.clipboard.writeText(c.password).catch(() => {})} title="Copy password" style={{ padding:'5px 10px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>📋</button>
                    <button onClick={() => setWebCreds(prev => prev.filter(x => x.id !== c.id))} style={{ padding:'5px 10px', background:'transparent', border:'1px solid var(--fg-red)', borderRadius:6, color:'var(--fg-red)', cursor:'pointer', fontSize:11 }}>✕</button>
                  </div>
                ))}
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
                        <button onClick={async () => { await loadKeyUsage(v.provider); setKeyUsageExpanded(prev => ({ ...prev, [v.provider]: !prev[v.provider] })); }} style={{ background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11, padding:'3px 8px', whiteSpace:'nowrap' }}>📊 Usage</button>
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
                      {/* Key Usage Analytics */}
                      {keyUsageExpanded[v.provider] && (
                        <div style={{ marginTop:10, padding:'10px 12px', background:'var(--fg-bg3)', borderRadius:8, border:'1px solid var(--fg-border)' }}>
                          {keyUsageData[v.provider] ? (
                            <>
                              <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:8 }}>
                                <div style={{ textAlign:'center' }}><div style={{ fontSize:16, fontWeight:700, color:'var(--fg-orange)' }}>{(keyUsageData[v.provider].total_tokens/1000).toFixed(1)}K</div><div style={{ fontSize:10, color:'var(--fg-text3)' }}>tokens</div></div>
                                <div style={{ textAlign:'center' }}><div style={{ fontSize:16, fontWeight:700, color:'var(--fg-blue)' }}>{keyUsageData[v.provider].requests}</div><div style={{ fontSize:10, color:'var(--fg-text3)' }}>requests</div></div>
                                <div style={{ textAlign:'center' }}><div style={{ fontSize:16, fontWeight:700, color:'var(--fg-green)' }}>${(keyUsageData[v.provider].cost||0).toFixed(4)}</div><div style={{ fontSize:10, color:'var(--fg-text3)' }}>cost</div></div>
                              </div>
                              {keyUsageData[v.provider].byModel.slice(0,5).map(m => (
                                <div key={m.model} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--fg-text2)', padding:'2px 0', borderBottom:'1px solid var(--fg-border)' }}>
                                  <span style={{ fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{m.model}</span>
                                  <span style={{ color:'var(--fg-text3)', flexShrink:0, marginLeft:8 }}>{(m.tokens/1000).toFixed(1)}K · {m.requests}×</span>
                                </div>
                              ))}
                            </>
                          ) : <span style={{ fontSize:11, color:'var(--fg-text3)' }}>No usage data yet.</span>}
                        </div>
                      )}
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
                  const hasKey = !!savedProviders[key] || !!apiKeys[key];
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

        {/* ── FORGECO ───────────────────────────────────────────────────── */}
        {mainTab === 'forgeco' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--fg-bg)' }}>
            {/* Header */}
            <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--fg-border)', flexShrink:0, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:22 }}>🧑‍💻</span>
              <div>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:'var(--fg-orange)', fontFamily:'var(--fg-font-display)' }}>ForgeCo</h2>
                <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>Code + Cowork — AI-assisted development and collaboration</p>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, padding:3, gap:2 }}>
                {(['code','cowork'] as const).map(t => (
                  <button key={t} onClick={() => setCoTab(t)} style={{ padding:'5px 16px', background:coTab===t ? 'var(--fg-orange)' : 'transparent', border:'none', borderRadius:6, color:coTab===t ? '#fff' : 'var(--fg-text3)', cursor:'pointer', fontSize:13, fontWeight:coTab===t ? 600 : 400, textTransform:'capitalize' }}>{t === 'code' ? '💻 Code' : '🤝 Cowork'}</button>
                ))}
              </div>
            </div>

            {/* Code tab */}
            {coTab === 'code' && (
              <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                {/* Editor pane */}
                <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:'1px solid var(--fg-border)' }}>
                  <div style={{ padding:'8px 12px', background:'var(--fg-bg3)', borderBottom:'1px solid var(--fg-border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <span style={{ fontSize:12, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>editor</span>
                    <select value={coCodeLang} onChange={e => setCoCodeLang(e.target.value)} style={{ marginLeft:'auto', padding:'3px 8px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:5, color:'var(--fg-text2)', fontSize:11, cursor:'pointer' }}>
                      {['typescript','javascript','python','rust','go','html','css','json','bash','sql'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <textarea
                    value={coCode}
                    onChange={e => setCoCode(e.target.value)}
                    spellCheck={false}
                    style={{ flex:1, padding:16, background:'var(--fg-bg2)', border:'none', color:'var(--fg-text)', fontSize:13, fontFamily:'var(--fg-font-mono)', lineHeight:1.7, resize:'none', outline:'none', tabSize:2 }}
                  />
                  {/* AI prompt bar */}
                  <div style={{ padding:'10px 12px', borderTop:'1px solid var(--fg-border)', background:'var(--fg-bg3)', display:'flex', gap:8, flexShrink:0 }}>
                    <input
                      value={coCodePrompt}
                      onChange={e => setCoCodePrompt(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key !== 'Enter' || !coCodePrompt.trim() || !user) return;
                        e.preventDefault();
                        setCoCodeRunning(true);
                        try {
                          const d = await apiFetch('/chat/completions', { method:'POST', body:JSON.stringify({ model: selectedModel||'forge-fast', messages:[{role:'system',content:`You are an expert ${coCodeLang} developer. Current code:\n\`\`\`${coCodeLang}\n${coCode}\n\`\`\`\nRespond with ONLY the updated code, no markdown fences.`},{role:'user',content:coCodePrompt}] }) }, user.token);
                          if (d?.choices?.[0]?.message?.content) { setCoCode(d.choices[0].message.content); setCoCodePrompt(''); }
                        } catch(err:any) { setCoCodeOutput('Error: '+err.message); } finally { setCoCodeRunning(false); }
                      }}
                      placeholder="Ask AI to edit this code… (Enter to apply)"
                      style={{ flex:1, padding:'8px 12px', background:'var(--fg-bg)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text)', fontSize:13, outline:'none' }}
                    />
                    <button onClick={() => { navigator.clipboard?.writeText(coCode); }} style={{ padding:'8px 14px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text2)', cursor:'pointer', fontSize:12 }}>Copy</button>
                    {coCodeRunning && <span style={{ fontSize:12, color:'var(--fg-orange)', alignSelf:'center', animation:'forge-flash 0.8s ease-in-out infinite' }}>✦</span>}
                  </div>
                </div>
                {/* Output pane */}
                <div style={{ width:340, display:'flex', flexDirection:'column', background:'var(--fg-bg2)' }}>
                  <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--fg-border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <span style={{ fontSize:12, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>output</span>
                    <button onClick={() => setCoCodeOutput('')} style={{ marginLeft:'auto', padding:'2px 8px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:4, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>Clear</button>
                  </div>
                  <div style={{ flex:1, padding:14, fontFamily:'var(--fg-font-mono)', fontSize:12, color:'var(--fg-green)', lineHeight:1.7, overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                    {coCodeOutput || <span style={{ color:'var(--fg-text3)' }}>// output will appear here\n// use the AI prompt bar to edit code\n// or paste your code and ask questions</span>}
                  </div>
                  {/* Quick actions */}
                  <div style={{ padding:'10px 12px', borderTop:'1px solid var(--fg-border)', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                    <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)', fontWeight:600, textTransform:'uppercase' }}>Quick Actions</p>
                    {['Explain this code','Add TypeScript types','Write unit tests','Find bugs','Optimize performance','Add error handling'].map(action => (
                      <button key={action} onClick={async () => {
                        if (!user || !coCode.trim()) return;
                        setCoCodeRunning(true); setCoCodePrompt(action);
                        try {
                          const d = await apiFetch('/chat/completions', { method:'POST', body:JSON.stringify({ model: selectedModel||'forge-fast', messages:[{role:'system',content:`You are an expert ${coCodeLang} developer.`},{role:'user',content:`${action}:\n\`\`\`${coCodeLang}\n${coCode}\n\`\`\``}] }) }, user.token);
                          if (d?.choices?.[0]?.message?.content) setCoCodeOutput(d.choices[0].message.content);
                        } catch(err:any) { setCoCodeOutput('Error: '+err.message); } finally { setCoCodeRunning(false); setCoCodePrompt(''); }
                      }} style={{ padding:'5px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text2)', cursor:'pointer', fontSize:11, textAlign:'left' }}>{action}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cowork tab */}
            {coTab === 'cowork' && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
                  {coCoworkMessages.length === 0 && (
                    <div style={{ textAlign:'center', padding:'60px 0', color:'var(--fg-text3)' }}>
                      <div style={{ fontSize:48, marginBottom:16 }}>🤝</div>
                      <p style={{ fontSize:16, margin:'0 0 8px', color:'var(--fg-text2)' }}>ForgeCo Cowork</p>
                      <p style={{ fontSize:13, margin:'0 0 28px', color:'var(--fg-text3)', maxWidth:460, marginLeft:'auto', marginRight:'auto', lineHeight:1.6 }}>Your AI collaboration partner. Plan projects, write docs, review code, brainstorm ideas, draft proposals — all in a shared workspace.</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                        {['Plan a new product feature','Review and improve this document','Help me write a technical spec','Brainstorm solutions for this problem','Create a project roadmap'].map(s => (
                          <button key={s} onClick={() => setCoCoworkInput(s)} style={{ padding:'8px 16px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:20, color:'var(--fg-text2)', cursor:'pointer', fontSize:12 }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {coCoworkMessages.map((m, i) => (
                    <div key={i} style={{ display:'flex', gap:12, marginBottom:20, flexDirection: m.role==='user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background: m.role==='user' ? 'var(--fg-bg4)' : 'linear-gradient(135deg,var(--fg-orange),#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                        {m.role==='user' ? '👤' : '🤝'}
                      </div>
                      <div style={{ maxWidth:'72%', padding:'12px 16px', borderRadius: m.role==='user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: m.role==='user' ? 'var(--fg-bg4)' : 'var(--fg-bg2)', border:`1px solid ${m.role==='user' ? 'var(--fg-border2)' : 'rgba(124,58,237,0.3)'}`, color:'var(--fg-text)', fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {coCoworkRunning && (
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--fg-orange),#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤝</div>
                      <div style={{ padding:'12px 18px', borderRadius:'4px 18px 18px 18px', background:'var(--fg-bg2)', border:'1px solid rgba(124,58,237,0.3)', display:'flex', gap:6, alignItems:'center' }}>
                        {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#7c3aed', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding:'12px 24px 20px', borderTop:'1px solid var(--fg-border)', flexShrink:0 }}>
                  <div style={{ display:'flex', gap:10, background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:12, padding:'8px 12px', alignItems:'flex-end' }}>
                    <textarea value={coCoworkInput} onChange={e => setCoCoworkInput(e.target.value)} onKeyDown={async e => {
                      if (e.key !== 'Enter' || e.shiftKey || !coCoworkInput.trim() || !user) return;
                      e.preventDefault();
                      const msg = coCoworkInput.trim();
                      setCoCoworkInput('');
                      const newMsgs = [...coCoworkMessages, {role:'user', content:msg}];
                      setCoCoworkMessages(newMsgs);
                      setCoCoworkRunning(true);
                      try {
                        const d = await apiFetch('/chat/completions', { method:'POST', body:JSON.stringify({ model: selectedModel||'forge-pro', messages:[{role:'system',content:'You are ForgeCo, an expert AI collaboration partner. Help with planning, writing, coding, brainstorming, and all knowledge work. Be thorough, practical, and insightful.'}, ...newMsgs.map(m=>({role:m.role,content:m.content}))] }) }, user.token);
                        if (d?.choices?.[0]?.message?.content) setCoCoworkMessages(prev => [...prev, {role:'assistant', content:d.choices[0].message.content}]);
                      } catch(err:any) { setCoCoworkMessages(prev => [...prev, {role:'assistant', content:'Error: '+err.message}]); } finally { setCoCoworkRunning(false); }
                    }} placeholder="Collaborate with AI — plan, write, code, brainstorm… (Enter to send)" rows={2} style={{ flex:1, background:'transparent', border:'none', color:'var(--fg-text)', fontSize:14, resize:'none', outline:'none', lineHeight:1.6 }} />
                    <button onClick={async () => {
                      if (!coCoworkInput.trim() || !user) return;
                      const msg = coCoworkInput.trim();
                      setCoCoworkInput('');
                      const newMsgs = [...coCoworkMessages, {role:'user', content:msg}];
                      setCoCoworkMessages(newMsgs);
                      setCoCoworkRunning(true);
                      try {
                        const d = await apiFetch('/chat/completions', { method:'POST', body:JSON.stringify({ model: selectedModel||'forge-pro', messages:[{role:'system',content:'You are ForgeCo, an expert AI collaboration partner.'}, ...newMsgs.map(m=>({role:m.role,content:m.content}))] }) }, user.token);
                        if (d?.choices?.[0]?.message?.content) setCoCoworkMessages(prev => [...prev, {role:'assistant', content:d.choices[0].message.content}]);
                      } catch(err:any) { setCoCoworkMessages(prev => [...prev, {role:'assistant', content:'Error: '+err.message}]); } finally { setCoCoworkRunning(false); }
                    }} disabled={coCoworkRunning||!coCoworkInput.trim()} style={{ width:36, height:36, background: coCoworkRunning||!coCoworkInput.trim() ? 'var(--fg-bg4)' : 'linear-gradient(135deg,var(--fg-orange),#7c3aed)', border:'none', borderRadius:8, color:'#fff', cursor:coCoworkInput.trim()&&!coCoworkRunning ? 'pointer' : 'default', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>↑</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FORGEAUTO ─────────────────────────────────────────────────── */}
        {mainTab === 'forgeauto' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--fg-bg)' }}>
            <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--fg-border)', flexShrink:0, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:28 }}>⚡</div>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'var(--fg-orange)', fontFamily:'var(--fg-font-display)' }}>ForgeAuto</h2>
                <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)' }}>Run your prompt through 2–100 LLMs simultaneously and compare results</p>
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:24 }}>
              {/* Model selector */}
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--fg-text2)', margin:'0 0 10px' }}>Select models to run in parallel:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {[
                    { id:'claude-sonnet-4', label:'Claude Sonnet 4', icon:'🟠' },
                    { id:'claude-opus-4', label:'Claude Opus 4', icon:'🟣' },
                    { id:'claude-haiku-4', label:'Claude Haiku 4', icon:'🔵' },
                    { id:'gpt-4o', label:'GPT-4o', icon:'🟢' },
                    { id:'gpt-4o-mini', label:'GPT-4o Mini', icon:'🟡' },
                    { id:'gpt-4-turbo', label:'GPT-4 Turbo', icon:'⚪' },
                    { id:'gemini-2.5-pro', label:'Gemini 2.5 Pro', icon:'💎' },
                    { id:'gemini-2.0-flash', label:'Gemini Flash', icon:'💠' },
                    { id:'deepseek-chat', label:'DeepSeek Chat', icon:'🌊' },
                    { id:'mistral-large', label:'Mistral Large', icon:'🌀' },
                    { id:'llama-3.3-70b', label:'Llama 3.3 70B', icon:'🦙' },
                    { id:'forge-pro', label:'Forge Pro (best)', icon:'⚡' },
                    { id:'forge-fast', label:'Forge Fast', icon:'🚀' },
                    { id:'forge-reasoning', label:'Forge Reasoning', icon:'🧠' },
                  ].map(m => {
                    const sel = autoSelectedModels.includes(m.id);
                    return (
                      <button key={m.id} onClick={() => setAutoSelectedModels(prev => sel ? prev.filter(x=>x!==m.id) : [...prev, m.id])} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background: sel ? 'rgba(249,115,22,0.18)' : 'var(--fg-bg3)', border:`1px solid ${sel ? 'var(--fg-orange)' : 'var(--fg-border)'}`, borderRadius:20, color: sel ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:12, fontWeight: sel ? 600 : 400, transition:'all 0.15s' }}>
                        <span>{m.icon}</span>{m.label}
                        {sel && <span style={{ fontSize:10, color:'var(--fg-orange)' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                {autoSelectedModels.length > 0 && <p style={{ margin:'8px 0 0', fontSize:11, color:'var(--fg-text3)' }}>{autoSelectedModels.length} model{autoSelectedModels.length!==1?'s':''} selected</p>}
              </div>
              {/* Prompt input */}
              <div style={{ marginBottom:16 }}>
                <textarea value={autoPrompt} onChange={e => setAutoPrompt(e.target.value)} placeholder="Enter your prompt — all selected models will run it in parallel..." rows={4} style={{ width:'100%', padding:14, background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:10, color:'var(--fg-text)', fontSize:14, resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.6 }} />
              </div>
              <button disabled={autoRunning || !autoPrompt.trim() || autoSelectedModels.length===0} onClick={async () => {
                if (!user || !autoPrompt.trim() || autoSelectedModels.length===0) return;
                setAutoRunning(true); setAutoResults([]);
                try {
                  const d = await apiFetch('/forgeauto/run', { method:'POST', body:JSON.stringify({ prompt:autoPrompt, models:autoSelectedModels }) }, user.token);
                  if (d?.success) setAutoResults(d.data || []);
                } catch(e:any) { alert('ForgeAuto error: '+e.message); } finally { setAutoRunning(false); }
              }} style={{ padding:'10px 28px', background: autoRunning||!autoPrompt.trim()||autoSelectedModels.length===0 ? 'var(--fg-bg4)' : 'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color: autoRunning||!autoPrompt.trim()||autoSelectedModels.length===0 ? 'var(--fg-text3)' : '#fff', fontSize:14, fontWeight:700, cursor: autoRunning||!autoPrompt.trim()||autoSelectedModels.length===0 ? 'default' : 'pointer', display:'flex', alignItems:'center', gap:8 }}>
                {autoRunning ? <><span style={{ animation:'forge-flash 0.6s ease-in-out infinite', display:'inline-block' }}>⚡</span> Running {autoSelectedModels.length} models…</> : `⚡ Run ${autoSelectedModels.length||''} Models`}
              </button>

              {/* Results grid */}
              {autoResults.length > 0 && (
                <div style={{ marginTop:24 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'var(--fg-text)', fontFamily:'var(--fg-font-display)' }}>Results — {autoResults.filter(r=>r.content).length}/{autoResults.length} succeeded</h3>
                    <button onClick={() => { const best = autoResults.filter(r=>r.content).sort((a,b)=>(b.tokens||0)-(a.tokens||0))[0]; if (best) navigator.clipboard?.writeText(best.content||''); }} style={{ padding:'6px 14px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text2)', cursor:'pointer', fontSize:12 }}>Copy Best</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))', gap:14 }}>
                    {autoResults.map((r, i) => (
                      <div key={i} style={{ background:'var(--fg-bg3)', border:`1px solid ${r.error ? 'var(--fg-red)' : r.content ? 'var(--fg-border2)' : 'var(--fg-border)'}`, borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--fg-orange2)' }}>{r.model}</span>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            {r.elapsed && <span style={{ fontSize:10, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>{(r.elapsed/1000).toFixed(1)}s</span>}
                            {r.tokens && <span style={{ fontSize:10, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>{r.tokens} tok</span>}
                            {r.content && <span style={{ fontSize:10, padding:'2px 8px', background:'rgba(74,222,128,0.15)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:10, color:'var(--fg-green)' }}>✓</span>}
                            {r.error && <span style={{ fontSize:10, padding:'2px 8px', background:'rgba(248,113,113,0.15)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:10, color:'var(--fg-red)' }}>✗</span>}
                          </div>
                        </div>
                        {r.error ? (
                          <p style={{ margin:0, fontSize:12, color:'var(--fg-red)', background:'rgba(248,113,113,0.08)', padding:'8px 10px', borderRadius:6 }}>{r.error}</p>
                        ) : (
                          <div style={{ fontSize:13, color:'var(--fg-text2)', lineHeight:1.7, maxHeight:200, overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word', background:'var(--fg-bg2)', padding:'10px 12px', borderRadius:8 }}>{r.content}</div>
                        )}
                        {r.content && <button onClick={() => navigator.clipboard?.writeText(r.content||'')} style={{ alignSelf:'flex-end', padding:'4px 12px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text2)', cursor:'pointer', fontSize:11 }}>Copy</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FORGEMULTI ────────────────────────────────────────────────── */}
        {mainTab === 'forgemulti' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--fg-bg)' }}>
            <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--fg-border)', flexShrink:0, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:28 }}>🤖</div>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'var(--fg-orange)', fontFamily:'var(--fg-font-display)' }}>ForgeMulti</h2>
                <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)' }}>Swarm of AI agents — each with a unique role — attack your problem simultaneously</p>
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:24 }}>
              {/* Agent role selector */}
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--fg-text2)', margin:'0 0 10px' }}>Active agent roles:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {[
                    { role:'Analyst', icon:'🔍', desc:'Data-driven analysis' },
                    { role:'Creative', icon:'💡', desc:'Brainstorming & ideation' },
                    { role:'Critic', icon:'⚡', desc:'Rigorous critique & flaws' },
                    { role:'Strategist', icon:'🎯', desc:'Strategic planning' },
                    { role:'Researcher', icon:'📚', desc:'Deep knowledge retrieval' },
                    { role:'Engineer', icon:'🛠️', desc:'Technical implementation' },
                    { role:'Ethicist', icon:'⚖️', desc:'Ethics & risk assessment' },
                    { role:'Futurist', icon:'🚀', desc:'Long-range implications' },
                  ].map(a => {
                    const active = multiSelectedRoles.includes(a.role);
                    return (
                      <button key={a.role} title={a.desc} onClick={() => setMultiSelectedRoles(prev => active ? prev.filter(r=>r!==a.role) : [...prev, a.role])} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background: active ? 'rgba(249,115,22,0.18)' : 'var(--fg-bg3)', border:`1px solid ${active ? 'var(--fg-orange)' : 'var(--fg-border)'}`, borderRadius:20, color: active ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:12, fontWeight: active ? 600 : 400, transition:'all 0.15s' }}>
                        <span>{a.icon}</span>{a.role}
                        {active && <span style={{ fontSize:10, color:'var(--fg-orange)' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                {multiSelectedRoles.length > 0 && <p style={{ margin:'8px 0 0', fontSize:11, color:'var(--fg-text3)' }}>{multiSelectedRoles.length} agent{multiSelectedRoles.length!==1?'s':''} active</p>}
              </div>
              {/* Model selector */}
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--fg-text2)', margin:'0 0 8px' }}>Base model for all agents:</p>
                <select value={multiModel} onChange={e => setMultiModel(e.target.value)} style={{ padding:'8px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text)', fontSize:13, cursor:'pointer', minWidth:220 }}>
                  {['forge-fast','forge-pro','forge-reasoning','claude-sonnet-4','claude-haiku-4','gpt-4o-mini','gpt-4o','gemini-2.0-flash','gemini-2.5-pro'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {/* Prompt */}
              <div style={{ marginBottom:16 }}>
                <textarea value={multiPrompt} onChange={e => setMultiPrompt(e.target.value)} placeholder="Describe your task or question — all agents will tackle it from their unique perspective..." rows={4} style={{ width:'100%', padding:14, background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:10, color:'var(--fg-text)', fontSize:14, resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.6 }} />
              </div>
              <button disabled={multiRunning || !multiPrompt.trim() || multiSelectedRoles.length===0} onClick={async () => {
                if (!user || !multiPrompt.trim() || multiSelectedRoles.length===0) return;
                setMultiRunning(true); setMultiResults(null);
                try {
                  const d = await apiFetch('/forgemulti/run', { method:'POST', body:JSON.stringify({ prompt:multiPrompt, model:multiModel, agent_roles:multiSelectedRoles }) }, user.token);
                  if (d?.success) {
                    setMultiResults(d.data);
                    // Auto-harvest into SuperAgent memory (fire-and-forget)
                    apiFetch('/superagent/harvest', { method:'POST' }, user.token).catch(() => {});
                  }
                } catch(e:any) { alert('ForgeMulti error: '+e.message); } finally { setMultiRunning(false); }
              }} style={{ padding:'10px 28px', background: multiRunning||!multiPrompt.trim()||multiSelectedRoles.length===0 ? 'var(--fg-bg4)' : 'linear-gradient(135deg,#7c3aed,var(--fg-orange))', border:'none', borderRadius:8, color: multiRunning||!multiPrompt.trim()||multiSelectedRoles.length===0 ? 'var(--fg-text3)' : '#fff', fontSize:14, fontWeight:700, cursor: multiRunning||!multiPrompt.trim()||multiSelectedRoles.length===0 ? 'default' : 'pointer', display:'flex', alignItems:'center', gap:8 }}>
                {multiRunning ? <><span style={{ animation:'forge-flash 0.6s ease-in-out infinite', display:'inline-block' }}>🤖</span> Agents thinking…</> : `🤖 Dispatch ${multiSelectedRoles.length} Agents`}
              </button>

              {/* Results */}
              {multiResults && (
                <div style={{ marginTop:24 }}>
                  {/* Synthesis */}
                  <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(249,115,22,0.12))', border:'1px solid rgba(124,58,237,0.35)', borderRadius:14, padding:20, marginBottom:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:22 }}>🌐</span>
                      <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'var(--fg-orange)', fontFamily:'var(--fg-font-display)' }}>Synthesized Intelligence</h3>
                      <button onClick={() => navigator.clipboard?.writeText(multiResults.synthesis)} style={{ marginLeft:'auto', padding:'4px 12px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, color:'var(--fg-text2)', cursor:'pointer', fontSize:11 }}>Copy</button>
                    </div>
                    <div style={{ fontSize:14, color:'var(--fg-text)', lineHeight:1.8, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{multiResults.synthesis}</div>
                  </div>
                  {/* Individual agent cards */}
                  <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:'var(--fg-text2)' }}>Individual Agent Perspectives ({multiResults.agents.length})</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:12 }}>
                    {multiResults.agents.map((a, i) => (
                      <div key={i} style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:12, padding:16 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                          <span style={{ fontSize:20 }}>{a.icon}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--fg-orange2)' }}>{a.role}</span>
                          <span style={{ marginLeft:'auto', fontSize:10, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>{(a.elapsed/1000).toFixed(1)}s</span>
                          <button onClick={() => navigator.clipboard?.writeText(a.content)} style={{ padding:'3px 10px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border)', borderRadius:5, color:'var(--fg-text2)', cursor:'pointer', fontSize:10 }}>Copy</button>
                        </div>
                        <div style={{ fontSize:13, color:'var(--fg-text2)', lineHeight:1.7, maxHeight:220, overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word', background:'var(--fg-bg2)', padding:'10px 12px', borderRadius:8 }}>{a.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FORGEASI ──────────────────────────────────────────────────── */}
        {mainTab === 'forgeasi' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--fg-bg)' }}>
            <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--fg-border)', flexShrink:0, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:28 }}>🌌</div>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:800, background:'linear-gradient(90deg,var(--fg-orange),#a78bfa,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontFamily:'var(--fg-font-display)' }}>ForgeASI</h2>
                <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)' }}>Deep Analysis → Solution Paths → Self-Critique → Synthesis → Push Now</p>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <select value={asiModel} onChange={e => setAsiModel(e.target.value)} style={{ padding:'6px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:7, color:'var(--fg-text)', fontSize:12 }}>
                  {['forge-pro','forge-reasoning','claude-opus-4','claude-sonnet-4','gpt-4o'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:11, color:'var(--fg-text3)' }}>Depth</span>
                  {[2,3,4].map(d => <button key={d} onClick={() => setAsiDepth(d)} style={{ width:26, height:26, background: asiDepth===d ? 'var(--fg-orange)' : 'var(--fg-bg3)', border:`1px solid ${asiDepth===d ? 'var(--fg-orange)' : 'var(--fg-border)'}`, borderRadius:5, color: asiDepth===d ? '#fff' : 'var(--fg-text3)', cursor:'pointer', fontSize:11, fontWeight:700 }}>{d}</button>)}
                </div>
                <button onClick={() => setAsiWebSearch(w => !w)} style={{ padding:'5px 10px', background: asiWebSearch ? 'rgba(6,182,212,0.15)' : 'var(--fg-bg3)', border:`1px solid ${asiWebSearch ? '#06b6d4' : 'var(--fg-border2)'}`, borderRadius:6, color: asiWebSearch ? '#06b6d4' : 'var(--fg-text3)', cursor:'pointer', fontSize:11, fontWeight:600 }}>🌐 Web</button>
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:24 }}>
              <div style={{ marginBottom:16 }}>
                <textarea value={asiPrompt} onChange={e => setAsiPrompt(e.target.value)} placeholder="Ask anything requiring deep reasoning — complex decisions, strategy, analysis, hard problems…" rows={4} style={{ width:'100%', padding:14, background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:10, color:'var(--fg-text)', fontSize:14, resize:'vertical', outline:'none', boxSizing:'border-box' as any, lineHeight:1.6 }} />
              </div>
              <div style={{ display:'flex', gap:10, marginBottom:24, alignItems:'center', flexWrap:'wrap' }}>
                <button disabled={asiRunning || !asiPrompt.trim()} onClick={async () => {
                  if (!user || !asiPrompt.trim()) return;
                  setAsiRunning(true); setAsiResult(null); setAsiLivePhases([]); setAsiCurrentPhase('Initializing…');
                  const phaseNames = ['Deep Analysis','Solution Paths','Self-Critique','Synthesis'].slice(0, asiDepth+1);
                  // Simulate live phase progress while waiting
                  let phaseIdx = 0;
                  const phaseTimer = setInterval(() => {
                    if (phaseIdx < phaseNames.length) { setAsiCurrentPhase(phaseNames[phaseIdx]); phaseIdx++; }
                  }, Math.max(1500, 8000/(phaseNames.length)));
                  try {
                    const d = await apiFetch('/forgeasi/run', { method:'POST', body:JSON.stringify({ prompt:asiPrompt, model:asiModel, depth:asiDepth, webSearch:asiWebSearch }) }, user.token);
                    if (d?.success) {
                      setAsiResult(d.data);
                      setAsiLivePhases(d.data.steps.map((s: any) => ({ phase:s.phase, content:s.content, done:true })));
                      // Auto-harvest into SuperAgent memory (fire-and-forget)
                      apiFetch('/superagent/harvest', { method:'POST' }, user.token).catch(() => {});
                    }
                  } catch(e:any) { alert('ForgeASI error: '+e.message); } finally { clearInterval(phaseTimer); setAsiRunning(false); setAsiCurrentPhase(''); }
                }} style={{ padding:'10px 28px', background: asiRunning||!asiPrompt.trim() ? 'var(--fg-bg4)' : 'linear-gradient(135deg,var(--fg-orange),#7c3aed,#06b6d4)', border:'none', borderRadius:8, color: asiRunning||!asiPrompt.trim() ? 'var(--fg-text3)' : '#fff', fontSize:14, fontWeight:700, cursor: asiRunning||!asiPrompt.trim() ? 'default' : 'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  {asiRunning ? <><span style={{ animation:'forge-flash 0.5s ease-in-out infinite', display:'inline-block' }}>🌌</span> {asiCurrentPhase || 'Starting…'}</> : '🌌 Activate ForgeASI'}
                </button>
                {asiResult && !asiRunning && (
                  <>
                    <button onClick={() => { setInput(asiResult.synthesis); setMainTab('workspace'); }} style={{ padding:'9px 18px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>💬 Push to Chat</button>
                    <button onClick={() => { setPreviewCode(asiResult.synthesis); setSketchMode(true); setMainTab('workspace'); }} style={{ padding:'9px 18px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>✏️ Open in Sketch</button>
                    <button onClick={() => { navigator.clipboard.writeText(asiResult.synthesis); }} style={{ padding:'9px 14px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', fontSize:13, cursor:'pointer' }}>📋 Copy</button>
                    <button onClick={() => { setAsiResult(null); setAsiLivePhases([]); setAsiPrompt(''); }} style={{ padding:'9px 14px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text3)', fontSize:13, cursor:'pointer' }}>✕ Clear</button>
                  </>
                )}
              </div>

              {/* Live phase indicators while running */}
              {asiRunning && (
                <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
                  {['Deep Analysis','Solution Paths','Self-Critique','Synthesis'].slice(0, asiDepth+1).map((p, i) => {
                    const isActive = asiCurrentPhase === p;
                    const isDone = asiLivePhases.some(lp => lp.phase === p && lp.done);
                    return (
                      <div key={p} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background: isDone ? 'rgba(249,115,22,0.15)' : isActive ? 'rgba(124,58,237,0.15)' : 'var(--fg-bg3)', border: isActive ? '1px solid #a78bfa' : isDone ? '1px solid var(--fg-orange)' : '1px solid var(--fg-border)', borderRadius:20, fontSize:12, color: isDone ? 'var(--fg-orange)' : isActive ? '#a78bfa' : 'var(--fg-text3)', transition:'all 0.3s' }}>
                        <span style={{ animation: isActive ? `forge-flash 0.6s ease-in-out infinite` : 'none', display:'inline-block' }}>{isDone ? '✓' : ['🔍','🗺️','⚡','🌐'][i]}</span>{p}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Results */}
              {asiResult && (
                <div>
                  {/* Synthesis hero */}
                  <div style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(124,58,237,0.1),rgba(6,182,212,0.1))', border:'1px solid rgba(124,58,237,0.4)', borderRadius:16, padding:24, marginBottom:24 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                      <span style={{ fontSize:24 }}>🌌</span>
                      <h3 style={{ margin:0, fontSize:17, fontWeight:800, background:'linear-gradient(90deg,var(--fg-orange),#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontFamily:'var(--fg-font-display)' }}>ASI Synthesis</h3>
                      <span style={{ fontSize:11, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)', marginLeft:8 }}>{asiResult.totalTokens.toLocaleString()} tokens · {asiResult.model}</span>
                      <button onClick={() => navigator.clipboard?.writeText(asiResult.synthesis)} style={{ marginLeft:'auto', padding:'5px 14px', background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, color:'var(--fg-text2)', cursor:'pointer', fontSize:11 }}>Copy</button>
                    </div>
                    <div style={{ fontSize:14, color:'var(--fg-text)', lineHeight:1.85, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{asiResult.synthesis}</div>
                  </div>
                  {/* Reasoning steps */}
                  <h4 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Reasoning Chain ({asiResult.steps.length} phases)</h4>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {asiResult.steps.map((s, i) => {
                      const icons = ['🔍','🗺️','⚡','🌐'];
                      const colors = ['rgba(249,115,22,0.12)','rgba(6,182,212,0.12)','rgba(248,113,113,0.12)','rgba(124,58,237,0.12)'];
                      const borders = ['rgba(249,115,22,0.3)','rgba(6,182,212,0.3)','rgba(248,113,113,0.3)','rgba(124,58,237,0.3)'];
                      return (
                        <details key={i} style={{ background:colors[i%4], border:`1px solid ${borders[i%4]}`, borderRadius:12, overflow:'hidden' }}>
                          <summary style={{ padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, listStyle:'none', userSelect:'none' }}>
                            <span style={{ fontSize:16 }}>{icons[i%4]}</span>
                            <span style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)' }}>Phase {i+1}: {s.phase}</span>
                            <span style={{ marginLeft:'auto', fontSize:11, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>{s.tokens} tok</span>
                          </summary>
                          <div style={{ padding:'0 16px 16px', fontSize:13, color:'var(--fg-text2)', lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', borderTop:`1px solid ${borders[i%4]}`, paddingTop:12, marginTop:0 }}>{s.content}</div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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

      {/* Thread context menu popup */}
      {threadMenu && (() => {
        const t = threads.find(x => x.id === threadMenu.threadId);
        if (!t) return null;
        return (
          <div style={{ position:'fixed', top: threadMenu.y, left: threadMenu.x, background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:10, padding:4, zIndex:2000, minWidth:160, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            {[
              { icon:'✏️', label:'Rename', action:() => { setRenamingThread({ id:t.id, title:t.title }); setThreadMenu(null); } },
              { icon: t.pinned ? '📌 Unpin' : '📌 Pin', label: t.pinned ? 'Unpin' : 'Pin', action:() => { apiFetch('/threads/' + t.id, { method:'PATCH', body:JSON.stringify({ pinned: t.pinned ? 0 : 1 }) }, user!.token).then(() => loadThreads(activeProject?.id)); setThreadMenu(null); } },
              { icon:'🗄️', label: t.archived ? 'Unarchive' : 'Archive', action:() => { archiveThread(t); setThreadMenu(null); } },
              { icon:'🗑️', label:'Delete', action:() => { deleteThread(t.id); setThreadMenu(null); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', background:'none', border:'none', color: item.label === 'Delete' ? 'var(--fg-red)' : 'var(--fg-text)', cursor:'pointer', fontSize:13, borderRadius:7, textAlign:'left' }}
                onMouseEnter={e => (e.currentTarget.style.background='var(--fg-bg4)')} onMouseLeave={e => (e.currentTarget.style.background='none')}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Project context menu popup */}
      {projectMenu && (() => {
        const p = projects.find(x => x.id === projectMenu.projectId);
        if (!p) return null;
        return (
          <div style={{ position:'fixed', top: projectMenu.y, left: projectMenu.x, background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:10, padding:4, zIndex:2000, minWidth:160, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            {[
              { icon:'✏️', label:'Rename', action:() => { setRenamingProject({ id:p.id, name:p.name }); setProjectMenu(null); } },
              { icon: p.pinned ? '📌 Unpin' : '📌 Pin', label: p.pinned ? 'Unpin' : 'Pin', action:() => { togglePin(p); setProjectMenu(null); } },
              { icon:'🗑️', label:'Delete', action:() => { deleteProject(p.id); setProjectMenu(null); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', background:'none', border:'none', color: item.label === 'Delete' ? 'var(--fg-red)' : 'var(--fg-text)', cursor:'pointer', fontSize:13, borderRadius:7, textAlign:'left' }}
                onMouseEnter={e => (e.currentTarget.style.background='var(--fg-bg4)')} onMouseLeave={e => (e.currentTarget.style.background='none')}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Rename project modal */}
      {renamingProject && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setRenamingProject(null)}>
          <div style={{ width:360, background:'var(--fg-bg3)', borderRadius:16, padding:24, border:'1px solid var(--fg-border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'var(--fg-text)', margin:'0 0 16px', fontSize:16, fontWeight:700 }}>Rename Project</h3>
            <input value={renamingProject.name} onChange={e => setRenamingProject(prev => prev ? { ...prev, name: e.target.value } : prev)} onKeyDown={e => { if (e.key==='Enter') renameProject(); }} autoFocus style={{ width:'100%', padding:'10px 12px', marginBottom:16, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box', outline:'none' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setRenamingProject(null)} style={{ flex:1, padding:'9px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', cursor:'pointer' }}>Cancel</button>
              <button onClick={renameProject} style={{ flex:1, padding:'9px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontWeight:600, cursor:'pointer' }}>Rename</button>
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