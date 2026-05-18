// Forge AI Platform v2.2.0 — real LLM routing, agents CRUD, workflow save/run, Stripe billing
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; model?: string; ts: number; }
interface Agent { id: string; name: string; model: string; color: string; icon: string; desc: string; active: boolean; }
interface Plan { id: string; name: string; price: number; tokens: number; features: string[]; }
interface UsageStat { model: string; requests: number; tokens: number; cost: number; revenue: number; }

// ─── Constants ────────────────────────────────────────────────────────────────
const AGENTS: Agent[] = [
  { id:'aria',  name:'Aria',  model:'claude-opus-4',    color:'#7C3AED', icon:'🧠', desc:'Deep reasoning & analysis',    active:true  },
  { id:'nova',  name:'Nova',  model:'gpt-4o',           color:'#2563EB', icon:'⚡', desc:'Fast & creative responses',    active:true  },
  { id:'sage',  name:'Sage',  model:'gemini-1.5-pro',   color:'#059669', icon:'🔮', desc:'Research & fact-checking',     active:false },
  { id:'blaze', name:'Blaze', model:'forge-fast-v2',    color:'#DC2626', icon:'🔥', desc:'Ultra-fast ForgeRouter model', active:false },
  { id:'echo',  name:'Echo',  model:'llama-3.1-405b',   color:'#D97706', icon:'🌊', desc:'Open-source powerhouse',       active:false },
  { id:'iris',  name:'Iris',  model:'forge-creative-v1',color:'#DB2777', icon:'🎨', desc:'Creative & artistic output',   active:false },
];

const MODELS = [
  // Forge native
  { id:'forge-ultra',      name:'Forge Ultra',       provider:'Forge',      input:0.015,   output:0.075,  markup:1.5,  badge:'🔥 Forge Best',    tier:'pro',     free:false },
  { id:'forge-pro',        name:'Forge Pro',         provider:'Forge',      input:0.003,   output:0.015,  markup:1.5,  badge:'⚡ Forge Pro',     tier:'starter', free:false },
  { id:'forge-fast',       name:'Forge Fast',        provider:'Forge',      input:0.00015, output:0.0006, markup:2.0,  badge:'💨 Forge Fast',    tier:'free',    free:true  },
  { id:'forge-code',       name:'Forge Code',        provider:'Forge',      input:0.0025,  output:0.010,  markup:1.5,  badge:'💻 Forge Code',    tier:'starter', free:false },
  { id:'forge-creative',   name:'Forge Creative',    provider:'Forge',      input:0.003,   output:0.015,  markup:1.5,  badge:'🎨 Forge Creative',tier:'starter', free:false },
  // Anthropic
  { id:'claude-opus-4',    name:'Claude Opus 4',     provider:'Anthropic',  input:0.015,   output:0.075,  markup:1.35, badge:'🏆 Best',          tier:'pro',     free:false },
  { id:'claude-sonnet-4',  name:'Claude Sonnet 4',   provider:'Anthropic',  input:0.003,   output:0.015,  markup:1.35, badge:'⚖ Balanced',     tier:'starter', free:false },
  { id:'claude-haiku-4',   name:'Claude Haiku 4.5',  provider:'Anthropic',  input:0.0008,  output:0.004,  markup:1.4,  badge:'⚡ Fast',           tier:'free',    free:true  },
  // OpenAI
  { id:'gpt-4o',           name:'GPT-4o',            provider:'OpenAI',     input:0.0025,  output:0.010,  markup:1.35, badge:'🚀 Popular',        tier:'starter', free:false },
  { id:'gpt-4o-mini',      name:'GPT-4o Mini',       provider:'OpenAI',     input:0.00015, output:0.0006, markup:1.5,  badge:'💨 Fast',           tier:'free',    free:true  },
  { id:'gpt-4.1',          name:'GPT-4.1',           provider:'OpenAI',     input:0.002,   output:0.008,  markup:1.35, badge:'🧠 Reasoning',      tier:'pro',     free:false },
  { id:'o3-mini',          name:'o3 Mini',           provider:'OpenAI',     input:0.0011,  output:0.0044, markup:1.4,  badge:'🔍 Reasoning',      tier:'starter', free:false },
  // Google
  { id:'gemini-2.0-flash', name:'Gemini 2.0 Flash',  provider:'Google',     input:0.0001,  output:0.0004, markup:1.5,  badge:'⚡ Free',           tier:'free',    free:true  },
  { id:'gemini-1.5-pro',   name:'Gemini 1.5 Pro',    provider:'Google',     input:0.00125, output:0.005,  markup:1.4,  badge:'🔬 Research',       tier:'starter', free:false },
  // Groq (free tier)
  { id:'llama-3.3-70b',    name:'Llama 3.3 70B',     provider:'Groq',       input:0.00059, output:0.00079,markup:1.5,  badge:'🦙 Free Fast',      tier:'free',    free:true  },
  { id:'llama-3.1-8b',     name:'Llama 3.1 8B',      provider:'Groq',       input:0.00005, output:0.00008,markup:2.0,  badge:'🆓 Free',           tier:'free',    free:true  },
  { id:'mixtral-8x7b',     name:'Mixtral 8x7B',      provider:'Groq',       input:0.00024, output:0.00024,markup:1.5,  badge:'🔀 Free MoE',       tier:'free',    free:true  },
  // Mistral
  { id:'mistral-large',    name:'Mistral Large 2',   provider:'Mistral',    input:0.002,   output:0.006,  markup:1.4,  badge:'🇫🇷 EU',           tier:'starter', free:false },
  { id:'mistral-small',    name:'Mistral Small 3.1', provider:'Mistral',    input:0.0001,  output:0.0003, markup:1.5,  badge:'🆓 Free',           tier:'free',    free:true  },
  // OpenRouter passthrough
  { id:'openrouter/*',     name:'OpenRouter (400+)', provider:'OpenRouter', input:0,       output:0,      markup:1.2,  badge:'🌐 400+ Models',    tier:'starter', free:false },
];

const PLANS: Plan[] = [
  { id:'free',       name:'Free',       price:0,   tokens:10000,   features:['10K tokens/mo','2 agents','Basic models','Community support'] },
  { id:'starter',    name:'Starter',    price:29,  tokens:500000,  features:['500K tokens/mo','4 agents','All models','Email support','ForgeRouter access'] },
  { id:'pro',        name:'Pro',        price:99,  tokens:2000000, features:['2M tokens/mo','All 6 agents','Priority routing','Slack support','Usage analytics','Custom workflows'] },
  { id:'enterprise', name:'Enterprise', price:499, tokens:10000000,features:['10M tokens/mo','Unlimited agents','Dedicated routing','24/7 support','Custom models','SLA guarantee'] },
];

const LANGUAGES = ['English','Español','Français','Deutsch','中文','日本語','한국어','Português','Italiano','हिन्दी','العربية','Русский'];
const CHANNELS  = ['Chat','iOS','Android','WhatsApp','Telegram','Email','Slack'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatNum(n: number, decimals = 2) { return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); }
function ago(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
  return `${Math.floor(d/3600000)}h ago`;
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function ForgeApp() {
  const [tab, setTab] = useState<'studio'|'agents'|'router'|'workflow'|'billing'|'output'|'settings'>('studio');
  const [token, setToken] = useState<string|null>(null);
  const [user, setUser] = useState<{name:string;email:string}|null>(null);
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Studio state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [language, setLanguage] = useState('English');
  const [channel, setChannel] = useState('Chat');
  const [selectedModel, setSelectedModel] = useState('forge-pro');
  const [inputMode, setInputMode] = useState<'chat'|'voice'|'sketch'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Agents state
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [agentMode, setAgentMode] = useState<'auto'|'manual'>('auto');
  const [dbAgents, setDbAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentForm, setAgentForm] = useState({ name:'', description:'', model:'claude-sonnet-4', temperature:0.7, maxTokens:2048 });
  const [editingAgent, setEditingAgent] = useState<string|null>(null);
  const [agentsMsg, setAgentsMsg] = useState('');

  // Router state
  const [routerUsage, setRouterUsage] = useState<UsageStat[]>([]);
  const [routerLoading, setRouterLoading] = useState(false);

  // Billing state
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [tokenUsage, setTokenUsage] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(10000);
  const [upgradeLoading, setUpgradeLoading] = useState('');
  const [billingMsg, setBillingMsg] = useState('');

  // Settings / API keys state
  const [savedKeys, setSavedKeys] = useState<{has_anthropic:boolean;has_openai:boolean;has_openrouter:boolean;has_gemini:boolean;anthropic_key:string|null;openai_key:string|null;openrouter_key:string|null;gemini_key:string|null}>({has_anthropic:false,has_openai:false,has_openrouter:false,has_gemini:false,anthropic_key:null,openai_key:null,openrouter_key:null,gemini_key:null});
  const [keyInputs, setKeyInputs] = useState({anthropic:'',openai:'',openrouter:'',gemini:''});
  const [keysSaving, setKeysSaving] = useState(false);
  const [keysMsg, setKeysMsg] = useState('');
  const [orModels, setOrModels] = useState<any[]>([]);
  const [customProviders, setCustomProviders] = useState<any[]>([]);
  const [newProvider, setNewProvider] = useState({ name:'', base_url:'', api_key:'', markup_multiplier:1.3, model_prefix:'', notes:'' });
  const [addingProvider, setAddingProvider] = useState(false);
  const [providerMsg, setProviderMsg] = useState('');
  const [testingProvider, setTestingProvider] = useState('');
  const [orLoading, setOrLoading] = useState(false);
  const [orSearch, setOrSearch] = useState('');

  // Workflow
  const [nodes, setNodes] = useState([
    { id:1, label:'Input',    x:80,  y:180, color:'#7C3AED' },
    { id:2, label:'ForgeRouter',x:260,y:180, color:'#2563EB' },
    { id:3, label:'Agents',   x:440, y:120, color:'#059669' },
    { id:4, label:'Review',   x:440, y:240, color:'#D97706' },
    { id:5, label:'Output',   x:620, y:180, color:'#DC2626' },
  ]);
  const [dragging, setDragging] = useState<{id:number;ox:number;oy:number}|null>(null);
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [workflowMsg, setWorkflowMsg] = useState('');
  const [workflowLoading, setWorkflowLoading] = useState(false);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    try {
      // Register: create account then auto-login
      if (authMode === 'register') {
        const nameParts = authName.trim().split(' ');
        const regRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword, firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '' })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.message || regData.error || 'Registration failed');
      }
      // Login (either direct login or post-register auto-login)
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message || loginData.error || 'Login failed');
      const tk = loginData.data?.accessToken || loginData.accessToken || loginData.token || '';
      if (!tk) throw new Error('No token received from server');
      const uname = loginData.data?.user?.first_name || loginData.data?.user?.email || authName || authEmail.split('@')[0];
      setToken(tk);
      setUser({ name: uname, email: authEmail });
      localStorage.setItem('forge_token', tk);
    } catch (err: any) { setAuthError(err.message); }
    setAuthLoading(false);
  }

  useEffect(() => {
    const saved = localStorage.getItem('forge_token');
    if (saved) setToken(saved);
  }, []);

  function logout() { setToken(null); setUser(null); localStorage.removeItem('forge_token'); setMessages([]); }

  // ── Chat ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || sending) return;
    if (!token) { setAuthError('Please log in to chat'); return; }
    const userMsg: Message = { role:'user', content: input.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const activeAgent = agents.find(a => a.active);
      const model = agentMode === 'auto' ? selectedModel : (activeAgent?.model || selectedModel);
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({
          messages: [...messages.slice(-10).map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMsg.content }],
          model,
          language,
          channel,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.message) || data.error || 'API error');
      const payload = data.data || data;
      const responseText = payload.response || payload.content || payload.message || payload.text || 'No response';
      const asstMsg: Message = { role:'assistant', content: responseText, model: payload.model || payload.modelName || model, ts: Date.now() };
      setMessages(prev => [...prev, asstMsg]);
      if (payload.tokensUsed) setTokenUsage((prev: number) => prev + payload.tokensUsed);
    } catch (err: any) {
      setMessages(prev => [...prev, { role:'assistant', content:`Error: ${err.message}`, ts: Date.now() }]);
    }
    setSending(false);
  }

  // ── API Keys ──────────────────────────────────────────────────────────────
  async function loadKeys() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/keys`, { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSavedKeys(data.data);
    } catch {}
  }

  async function saveKeys() {
    setKeysSaving(true); setKeysMsg('');
    try {
      const body: any = {};
      if (keyInputs.anthropic)  body.anthropic_key  = keyInputs.anthropic;
      if (keyInputs.openai)     body.openai_key     = keyInputs.openai;
      if (keyInputs.openrouter) body.openrouter_key = keyInputs.openrouter;
      if (keyInputs.gemini)     body.gemini_key     = keyInputs.gemini;
      const res = await fetch(`${API_BASE}/keys`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) { setKeysMsg('✅ Keys saved!'); setKeyInputs({anthropic:'',openai:'',openrouter:'',gemini:''}); loadKeys(); }
      else setKeysMsg('❌ ' + (data.error || 'Save failed'));
    } catch (e:any) { setKeysMsg('❌ ' + e.message); }
    setKeysSaving(false);
  }

  async function loadOrModels() {
    if (!token) return;
    setOrLoading(true);
    try {
      const res = await fetch(`${API_BASE}/keys/openrouter-models`, { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setOrModels(data.data.models || []);
      else setKeysMsg('❌ ' + data.error);
    } catch (e:any) { setKeysMsg('❌ ' + e.message); }
    setOrLoading(false);
  }

  async function loadCustomProviders() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/providers`, { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCustomProviders(data.data);
    } catch {}
  }

  async function addCustomProvider() {
    setAddingProvider(true); setProviderMsg('');
    try {
      const res = await fetch(`${API_BASE}/providers`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify(newProvider)
      });
      const data = await res.json();
      if (data.success) {
        setProviderMsg('✅ Provider added!');
        setNewProvider({ name:'', base_url:'', api_key:'', markup_multiplier:1.3, model_prefix:'', notes:'' });
        loadCustomProviders();
      } else setProviderMsg('❌ ' + (data.error || 'Failed'));
    } catch(e:any) { setProviderMsg('❌ ' + e.message); }
    setAddingProvider(false);
  }

  async function deleteCustomProvider(id: string) {
    await fetch(`${API_BASE}/providers/${id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` } });
    loadCustomProviders();
  }

  async function testCustomProvider(id: string) {
    setTestingProvider(id); setProviderMsg('');
    try {
      const res = await fetch(`${API_BASE}/providers/${id}/test`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:'{}'
      });
      const data = await res.json();
      setProviderMsg(data.success ? `✅ Connected! Response: "${(data.response||'').slice(0,60)}"` : `❌ ${data.error}`);
    } catch(e:any) { setProviderMsg('❌ ' + e.message); }
    setTestingProvider('');
  }

  useEffect(() => { if (tab === 'settings') { loadKeys(); loadCustomProviders(); } }, [tab]);

  // ── Router Usage ──────────────────────────────────────────────────────────
  async function loadRouterUsage() {
    if (!token) return;
    setRouterLoading(true);
    try {
      const res = await fetch(`${API_BASE}/router/usage`, { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      setRouterUsage(data.usage || []);
    } catch { }
    setRouterLoading(false);
  }

  useEffect(() => { if (tab === 'router') loadRouterUsage(); }, [tab]);

  // ── Billing ───────────────────────────────────────────────────────────────
  async function loadBilling() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/billing/subscription`, { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      setCurrentPlan(data.plan || 'free');
      setTokenUsage(data.tokensUsed || 0);
      setTokenLimit(data.tokenLimit || 10000);
    } catch { }
  }

  async function upgradePlan(planId: string) {
    if (!token) return;
    setUpgradeLoading(planId); setBillingMsg('');
    try {
      const res = await fetch(`${API_BASE}/billing/upgrade`, {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ plan: planId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upgrade failed');
      // If Stripe returned a checkout URL, redirect
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      setCurrentPlan(planId);
      setBillingMsg(`✅ ${data.message || `Upgraded to ${planId}!`}`);
      loadBilling();
    } catch (err: any) { setBillingMsg(`❌ ${err.message}`); }
    setUpgradeLoading('');
  }

  // ── Agents CRUD ───────────────────────────────────────────────────────────
  async function loadDbAgents() {
    if (!token) return;
    setAgentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agents`, { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDbAgents(data.data);
    } catch {}
    setAgentsLoading(false);
  }

  async function saveAgent() {
    if (!agentForm.name.trim()) { setAgentsMsg('❌ Name is required'); return; }
    setAgentsMsg('');
    try {
      const url = editingAgent ? `${API_BASE}/agents/${editingAgent}` : `${API_BASE}/agents`;
      const method = editingAgent ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ name:agentForm.name, description:agentForm.description, model:agentForm.model, temperature:agentForm.temperature, maxTokens:agentForm.maxTokens })
      });
      const data = await res.json();
      if (data.success) {
        setAgentsMsg(editingAgent ? '✅ Agent updated!' : '✅ Agent created!');
        setAgentForm({ name:'', description:'', model:'claude-sonnet-4', temperature:0.7, maxTokens:2048 });
        setEditingAgent(null);
        loadDbAgents();
      } else setAgentsMsg('❌ ' + (data.message || data.error || 'Failed'));
    } catch (e:any) { setAgentsMsg('❌ ' + e.message); }
  }

  async function deleteAgent(id: string) {
    await fetch(`${API_BASE}/agents/${id}`, { method:'DELETE', headers: { 'Authorization':`Bearer ${token}` } });
    setAgentsMsg('✅ Agent deleted');
    loadDbAgents();
  }

  function startEditAgent(a: any) {
    setEditingAgent(a.id);
    setAgentForm({ name:a.name, description:a.description, model:a.model, temperature:a.temperature, maxTokens:a.max_tokens });
  }

  useEffect(() => { if (tab === 'agents') loadDbAgents(); }, [tab]);

  // ── Workflows ─────────────────────────────────────────────────────────────
  async function loadWorkflows() {
    if (!token) return;
    setWorkflowLoading(true);
    try {
      const res = await fetch(`${API_BASE}/workflows`, { headers: { 'Authorization':`Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSavedWorkflows(data.data);
    } catch {}
    setWorkflowLoading(false);
  }

  async function saveWorkflow() {
    setWorkflowMsg('');
    try {
      const definition = { nodes, edges: [[1,2],[2,3],[2,4],[3,5],[4,5]] };
      const res = await fetch(`${API_BASE}/workflows`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ name: workflowName, description: 'Visual workflow', definition })
      });
      const data = await res.json();
      if (data.success) { setWorkflowMsg('✅ Workflow saved!'); loadWorkflows(); }
      else setWorkflowMsg('❌ ' + (data.error || 'Failed'));
    } catch(e:any) { setWorkflowMsg('❌ ' + e.message); }
  }

  async function loadWorkflow(w: any) {
    try {
      const def = typeof w.definition === 'string' ? JSON.parse(w.definition) : w.definition;
      if (def.nodes) setNodes(def.nodes);
      setWorkflowName(w.name);
      setWorkflowMsg(`✅ Loaded "${w.name}"`);
    } catch { setWorkflowMsg('❌ Failed to load workflow'); }
  }

  async function deleteWorkflow(id: string) {
    await fetch(`${API_BASE}/workflows/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} });
    loadWorkflows();
  }

  useEffect(() => { if (tab === 'workflow') loadWorkflows(); }, [tab]);

  useEffect(() => { if (tab === 'billing') loadBilling(); }, [tab]);

  // ── Workflow drag ─────────────────────────────────────────────────────────
  function onNodeMouseDown(e: React.MouseEvent, id: number) {
    const n = nodes.find(n => n.id === id)!;
    setDragging({ id, ox: e.clientX - n.x, oy: e.clientY - n.y });
  }
  function onSvgMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: e.clientX - dragging.ox, y: e.clientY - dragging.oy } : n));
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!token) return <AuthScreen mode={authMode} setMode={setAuthMode} email={authEmail} setEmail={setAuthEmail}
    password={authPassword} setPassword={setAuthPassword} name={authName} setName={setAuthName}
    error={authError} loading={authLoading} onSubmit={handleAuth} />;

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'#e2e8f0', fontFamily:'system-ui,sans-serif', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderBottom:'1px solid #1e293b', background:'#0f172a' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24, fontWeight:800, background:'linear-gradient(135deg,#7C3AED,#2563EB)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>⚡ Forge</span>
          <span style={{ fontSize:11, color:'#64748b', background:'#1e293b', padding:'2px 8px', borderRadius:99 }}>v2 Studio</span>
        </div>
        <nav style={{ display:'flex', gap:4 }}>
          {(['studio','agents','router','workflow','billing','output','settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
              background: tab===t ? '#7C3AED' : 'transparent', color: tab===t ? '#fff' : '#94a3b8',
              transition:'all .2s'
            }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:600 }}>{user?.name || authEmail.split('@')[0]}</div>
            <div style={{ fontSize:11, color:'#64748b', textTransform:'capitalize' }}>{currentPlan} plan</div>
          </div>
          <button onClick={logout} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #334155', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:12 }}>Logout</button>
        </div>
      </header>

      {/* Body */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {tab === 'studio'   && <StudioTab messages={messages} input={input} setInput={setInput} sending={sending}
            sendMessage={sendMessage} language={language} setLanguage={setLanguage} channel={channel} setChannel={setChannel}
            selectedModel={selectedModel} setSelectedModel={setSelectedModel} inputMode={inputMode} setInputMode={setInputMode}
            messagesEndRef={messagesEndRef} agents={agents} agentMode={agentMode} />}
        {tab === 'agents'   && <AgentsTab agents={agents} setAgents={setAgents} agentMode={agentMode} setAgentMode={setAgentMode}
            dbAgents={dbAgents} loading={agentsLoading} agentForm={agentForm} setAgentForm={setAgentForm}
            editingAgent={editingAgent} setEditingAgent={setEditingAgent} onSave={saveAgent} onDelete={deleteAgent}
            onEdit={startEditAgent} message={agentsMsg} setMessage={setAgentsMsg} />}
        {tab === 'router'   && <RouterTab models={MODELS} usage={routerUsage} loading={routerLoading} onRefresh={loadRouterUsage} />}
        {tab === 'workflow' && <WorkflowTab nodes={nodes} setNodes={setNodes} onMouseDown={onNodeMouseDown} onMouseMove={onSvgMouseMove} onMouseUp={() => setDragging(null)}
            savedWorkflows={savedWorkflows} workflowName={workflowName} setWorkflowName={setWorkflowName}
            onSave={saveWorkflow} onLoad={loadWorkflow} onDelete={deleteWorkflow}
            message={workflowMsg} loading={workflowLoading} />}
        {tab === 'billing'  && <BillingTab plans={PLANS} currentPlan={currentPlan} tokenUsage={tokenUsage} tokenLimit={tokenLimit}
            onUpgrade={upgradePlan} upgradeLoading={upgradeLoading} message={billingMsg} />}
        {tab === 'output'   && <OutputTab messages={messages} />}
        {tab === 'settings'  && <SettingsTab savedKeys={savedKeys} keyInputs={keyInputs} setKeyInputs={setKeyInputs}
            onSave={saveKeys} saving={keysSaving} message={keysMsg}
            orModels={orModels} orLoading={orLoading} onLoadOrModels={loadOrModels}
            orSearch={orSearch} setOrSearch={setOrSearch}
            onSelectModel={(m:string) => { setSelectedModel(m); setTab('studio'); }}
            customProviders={customProviders} newProvider={newProvider} setNewProvider={setNewProvider}
            onAddProvider={addCustomProvider} addingProvider={addingProvider}
            onDeleteProvider={deleteCustomProvider} onTestProvider={testCustomProvider}
            testingProvider={testingProvider} providerMsg={providerMsg} />}
      </main>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ mode, setMode, email, setEmail, password, setPassword, name, setName, error, loading, onSubmit }: any) {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:420, background:'#0f172a', borderRadius:20, padding:40, border:'1px solid #1e293b' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>⚡</div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, background:'linear-gradient(135deg,#7C3AED,#2563EB)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Forge Studio</h1>
          <p style={{ margin:'8px 0 0', color:'#64748b', fontSize:14 }}>AI Agent Platform</p>
        </div>
        <div style={{ display:'flex', background:'#1e293b', borderRadius:10, padding:4, marginBottom:24 }}>
          {(['login','register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:14, background: mode===m?'#7C3AED':'transparent', color: mode===m?'#fff':'#94a3b8', transition:'all .2s' }}>{m==='login'?'Sign In':'Sign Up'}</button>
          ))}
        </div>
        <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {mode === 'register' && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" required style={inputStyle} />}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required style={inputStyle} />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" required style={inputStyle} />
          {error && <div style={{ color:'#f87171', fontSize:13, textAlign:'center' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', opacity: loading?0.7:1 }}>
            {loading ? 'Please wait…' : mode==='login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
const inputStyle: React.CSSProperties = { padding:'12px 14px', borderRadius:10, border:'1px solid #334155', background:'#1e293b', color:'#e2e8f0', fontSize:14, outline:'none', width:'100%', boxSizing:'border-box' };

// ─── Studio Tab ───────────────────────────────────────────────────────────────
function StudioTab({ messages, input, setInput, sending, sendMessage, language, setLanguage, channel, setChannel, selectedModel, setSelectedModel, inputMode, setInputMode, messagesEndRef, agents, agentMode }: any) {
  const activeAgent = agents.find((a:Agent) => a.active);
  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
      {/* Sidebar */}
      <div style={{ width:220, background:'#0f172a', borderRight:'1px solid #1e293b', padding:16, display:'flex', flexDirection:'column', gap:16, overflowY:'auto' }}>
        <div>
          <label style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>Language</label>
          <select value={language} onChange={e=>setLanguage(e.target.value)} style={{ ...selectStyle, marginTop:6 }}>
            {LANGUAGES.map(l=><option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>Channel</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
            {CHANNELS.map(c=>(
              <button key={c} onClick={()=>setChannel(c)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid', fontSize:11, cursor:'pointer', borderColor: channel===c?'#7C3AED':'#334155', background: channel===c?'#7C3AED20':'transparent', color: channel===c?'#a78bfa':'#94a3b8' }}>{c}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>Model</label>
          <select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)} style={{ ...selectStyle, marginTop:6 }}>
            <optgroup label="⚡ Forge Models">
              {MODELS.filter(m=>m.provider==='Forge').map(m=><option key={m.id} value={m.id}>{m.badge} {m.name}</option>)}
            </optgroup>
            <optgroup label="🆓 Free Models">
              {MODELS.filter(m=>m.free&&m.provider!=='Forge').map(m=><option key={m.id} value={m.id}>{m.badge} {m.name}</option>)}
            </optgroup>
            <optgroup label="Anthropic">
              {MODELS.filter(m=>m.provider==='Anthropic').map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
            <optgroup label="OpenAI">
              {MODELS.filter(m=>m.provider==='OpenAI').map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
            <optgroup label="Google">
              {MODELS.filter(m=>m.provider==='Google').map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
            <optgroup label="Groq (Fast + Free)">
              {MODELS.filter(m=>m.provider==='Groq').map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
            <optgroup label="Mistral">
              {MODELS.filter(m=>m.provider==='Mistral').map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
            <optgroup label="🌐 OpenRouter (400+ models)">
              {MODELS.filter(m=>m.provider==='OpenRouter').map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
          </select>
        </div>
        <div>
          <label style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>Active Agent</label>
          <div style={{ marginTop:6, padding:10, background:'#1e293b', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:20 }}>{agentMode==='auto'?'🤖':(activeAgent?.icon||'🧠')}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>{agentMode==='auto'?'Auto-Route':(activeAgent?.name||'None')}</div>
              <div style={{ fontSize:11, color:'#64748b' }}>{agentMode==='auto'?'ForgeRouter picks':'Manual select'}</div>
            </div>
          </div>
        </div>
        <div>
          <label style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>Input Mode</label>
          <div style={{ display:'flex', gap:4, marginTop:6 }}>
            {(['chat','voice','sketch'] as const).map(m=>(
              <button key={m} onClick={()=>setInputMode(m)} style={{ flex:1, padding:'6px 0', borderRadius:6, border:'1px solid', fontSize:11, cursor:'pointer', borderColor: inputMode===m?'#7C3AED':'#334155', background: inputMode===m?'#7C3AED20':'transparent', color: inputMode===m?'#a78bfa':'#94a3b8' }}>{m==='chat'?'💬':m==='voice'?'🎙':'✏'}</button>
            ))}
          </div>
        </div>
      </div>
      {/* Chat */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          {messages.length === 0 && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#334155', gap:16 }}>
              <div style={{ fontSize:64 }}>⚡</div>
              <div style={{ fontSize:18, fontWeight:600 }}>Forge Studio</div>
              <div style={{ fontSize:14, textAlign:'center', maxWidth:400, lineHeight:1.6 }}>Send a message in any language. ForgeRouter will pick the best agent and model automatically.</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                {['Analyze this data','Write a strategy','Debug my code','Translate this'].map(s=>(
                  <button key={s} onClick={()=>setInput(s)} style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #1e293b', background:'#0f172a', color:'#7C3AED', cursor:'pointer', fontSize:13 }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m: Message, i: number) => (
            <div key={i} style={{ display:'flex', justifyContent: m.role==='user'?'flex-end':'flex-start', gap:10 }}>
              {m.role==='assistant' && <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7C3AED,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>⚡</div>}
              <div style={{ maxWidth:'75%' }}>
                <div style={{ padding:'12px 16px', borderRadius: m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px', background: m.role==='user'?'#7C3AED':'#1e293b', color:'#e2e8f0', fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{m.content}</div>
                <div style={{ fontSize:11, color:'#475569', marginTop:4, textAlign: m.role==='user'?'right':'left' }}>
                  {m.model && <span style={{ background:'#1e293b', padding:'2px 6px', borderRadius:4, marginRight:6 }}>{m.model}</span>}
                  {ago(m.ts)}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7C3AED,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⚡</div>
              <div style={{ padding:'12px 16px', borderRadius:'16px 16px 16px 4px', background:'#1e293b' }}>
                <span style={{ animation:'pulse 1s infinite' }}>Thinking</span><span style={{ marginLeft:4 }}>…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input bar */}
        <div style={{ padding:16, borderTop:'1px solid #1e293b', background:'#0f172a' }}>
          {inputMode === 'sketch' && (
            <div style={{ height:100, background:'#1e293b', borderRadius:10, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:13, border:'1px dashed #334155' }}>✏ Sketch canvas — draw your idea here</div>
          )}
          {inputMode === 'voice' && (
            <div style={{ height:60, background:'#1e293b', borderRadius:10, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'#475569', fontSize:13 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'#DC2626', animation:'pulse 1s infinite' }} />
              Voice input — click mic to speak
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <textarea
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMessage(); }}}
              placeholder={`Message in ${language}… (Enter to send)`}
              style={{ flex:1, padding:'12px 14px', borderRadius:12, border:'1px solid #334155', background:'#1e293b', color:'#e2e8f0', fontSize:14, resize:'none', height:52, outline:'none', fontFamily:'inherit' }}
            />
            <button onClick={sendMessage} disabled={sending||!input.trim()} style={{ padding:'0 20px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'#fff', fontWeight:700, fontSize:16, cursor:'pointer', opacity: (sending||!input.trim())?0.5:1 }}>
              {sending ? '…' : '→'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Agents Tab ───────────────────────────────────────────────────────────────
const AGENT_MODELS = [
  'claude-opus-4','claude-sonnet-4','claude-haiku-4',
  'gpt-4o','gpt-4o-mini','gpt-4.1','o3-mini',
  'gemini-2.0-flash','gemini-1.5-pro',
  'llama-3.3-70b','llama-3.1-8b','mixtral-8x7b',
  'mistral-large','mistral-small',
  'forge-ultra','forge-pro','forge-fast','forge-code','forge-creative',
];
const AGENT_ICONS = ['🧠','⚡','🔮','🔥','🌊','🎨','🤖','🦾','🔬','💡','🛡','🚀'];

function AgentsTab({ agents, setAgents, agentMode, setAgentMode, dbAgents, loading, agentForm, setAgentForm, editingAgent, setEditingAgent, onSave, onDelete, onEdit, message, setMessage }: any) {
  const [showForm, setShowForm] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('🧠');

  function toggleAgent(id: string) {
    setAgents((prev: Agent[]) => prev.map((a: Agent) => a.id===id ? {...a, active:!a.active} : a));
  }
  const activeCount = agents.filter((a:Agent)=>a.active).length;

  return (
    <div style={{ flex:1, overflow:'auto', padding:32 }}>
      <div style={{ maxWidth:960, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>Agent Swarm</h2>
            <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:14 }}>{activeCount} preset + {dbAgents.length} custom agents</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ display:'flex', background:'#1e293b', borderRadius:10, padding:4 }}>
              {(['auto','manual'] as const).map(m=>(
                <button key={m} onClick={()=>setAgentMode(m)} style={{ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, background: agentMode===m?'#7C3AED':'transparent', color: agentMode===m?'#fff':'#94a3b8' }}>
                  {m==='auto'?'🤖 Auto':'⚙ Manual'}
                </button>
              ))}
            </div>
            <button onClick={()=>{ setShowForm(!showForm); setEditingAgent(null); setAgentForm({name:'',description:'',model:'claude-sonnet-4',temperature:0.7,maxTokens:2048}); setMessage(''); }}
              style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
              {showForm ? '✕ Cancel' : '+ New Agent'}
            </button>
          </div>
        </div>

        {agentMode==='auto' && (
          <div style={{ padding:16, background:'#7C3AED15', border:'1px solid #7C3AED30', borderRadius:12, marginBottom:24, fontSize:14, color:'#a78bfa' }}>
            🤖 ForgeRouter automatically selects the best agent and model based on your prompt complexity, language, and token budget.
          </div>
        )}

        {/* Create/Edit form */}
        {(showForm || editingAgent) && (
          <div style={{ padding:24, background:'#0f172a', borderRadius:16, border:'1px dashed #7C3AED50', marginBottom:28 }}>
            <h3 style={{ margin:'0 0 18px', fontSize:16, fontWeight:700, color:'#a78bfa' }}>{editingAgent ? '✏ Edit Agent' : '✨ Create New Agent'}</h3>
            {message && <div style={{ padding:10, borderRadius:8, marginBottom:12, fontSize:13, background: message.startsWith('✅')?'#05966915':'#DC262615', color: message.startsWith('✅')?'#4ade80':'#f87171' }}>{message}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Agent Name *</label>
                <input value={agentForm.name} onChange={e=>setAgentForm((p:any)=>({...p,name:e.target.value}))} placeholder="e.g. Research Analyst" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Model</label>
                <select value={agentForm.model} onChange={e=>setAgentForm((p:any)=>({...p,model:e.target.value}))} style={selectStyle}>
                  {AGENT_MODELS.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Description / System Prompt</label>
                <textarea value={agentForm.description} onChange={e=>setAgentForm((p:any)=>({...p,description:e.target.value}))} placeholder="What does this agent do? What's its personality and expertise?" rows={3}
                  style={{ ...inputStyle, resize:'vertical', fontFamily:'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Temperature: {agentForm.temperature}</label>
                <input type="range" min="0" max="2" step="0.05" value={agentForm.temperature} onChange={e=>setAgentForm((p:any)=>({...p,temperature:parseFloat(e.target.value)}))} style={{ width:'100%' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginTop:2 }}><span>Precise</span><span>Creative</span></div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Max Tokens: {agentForm.maxTokens.toLocaleString()}</label>
                <input type="range" min="256" max="8192" step="256" value={agentForm.maxTokens} onChange={e=>setAgentForm((p:any)=>({...p,maxTokens:parseInt(e.target.value)}))} style={{ width:'100%' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginTop:2 }}><span>256</span><span>8192</span></div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onSave} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                {editingAgent ? 'Update Agent' : 'Create Agent'}
              </button>
              {editingAgent && <button onClick={()=>{ setEditingAgent(null); setAgentForm({name:'',description:'',model:'claude-sonnet-4',temperature:0.7,maxTokens:2048}); setMessage(''); }} style={{ padding:'10px 18px', borderRadius:10, border:'1px solid #334155', background:'transparent', color:'#94a3b8', fontWeight:600, fontSize:14, cursor:'pointer' }}>Cancel</button>}
            </div>
          </div>
        )}

        {/* Custom DB agents */}
        {dbAgents.length > 0 && (
          <>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Your Custom Agents</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12, marginBottom:28 }}>
              {loading ? <div style={{ color:'#475569', padding:20 }}>Loading…</div> : dbAgents.map((a:any)=>(
                <div key={a.id} style={{ padding:20, borderRadius:14, border:'1px solid #2563EB30', background:'#2563EB08', position:'relative' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'#64748b', fontFamily:'monospace' }}>{a.model}</div>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>{ onEdit(a); setShowForm(false); }} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #334155', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11 }}>✏</button>
                      <button onClick={()=>onDelete(a.id)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #ef444440', background:'transparent', color:'#ef4444', cursor:'pointer', fontSize:11 }}>✕</button>
                    </div>
                  </div>
                  {a.description && <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5, marginBottom:10 }}>{a.description.slice(0,120)}{a.description.length>120?'…':''}</div>}
                  <div style={{ display:'flex', gap:8, fontSize:11, color:'#475569' }}>
                    <span>🌡 {a.temperature}</span>
                    <span>·</span>
                    <span>📏 {(a.max_tokens||2048).toLocaleString()} tokens</span>
                    <span>·</span>
                    <span style={{ color: a.status==='active'?'#4ade80':'#f87171', textTransform:'capitalize' }}>● {a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Built-in preset agents */}
        <h3 style={{ fontSize:14, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Built-in Agents</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {agents.map((a:Agent) => (
            <div key={a.id} onClick={()=>agentMode==='manual'&&toggleAgent(a.id)} style={{
              padding:20, borderRadius:16, border:`2px solid ${a.active?a.color:'#1e293b'}`,
              background: a.active?`${a.color}10`:'#0f172a', cursor: agentMode==='manual'?'pointer':'default',
              transition:'all .2s', position:'relative'
            }}>
              {a.active && <div style={{ position:'absolute', top:12, right:12, width:8, height:8, borderRadius:'50%', background:a.color }} />}
              <div style={{ fontSize:32, marginBottom:10 }}>{a.icon}</div>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>{a.name}</div>
              <div style={{ fontSize:12, color:'#64748b', fontFamily:'monospace', marginBottom:8 }}>{a.model}</div>
              <div style={{ fontSize:13, color:'#94a3b8' }}>{a.desc}</div>
              {agentMode==='manual' && (
                <div style={{ marginTop:12, fontSize:12, fontWeight:600, color: a.active?a.color:'#475569' }}>
                  {a.active ? '✓ Active — click to deactivate' : 'Click to activate'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Router Tab ───────────────────────────────────────────────────────────────
function RouterTab({ models, usage, loading, onRefresh }: any) {
  const totalRevenue = usage.reduce((s:number,u:UsageStat)=>s+u.revenue,0);
  const totalCost    = usage.reduce((s:number,u:UsageStat)=>s+u.cost,0);
  const margin       = totalRevenue > 0 ? ((totalRevenue-totalCost)/totalRevenue*100) : 0;
  return (
    <div style={{ flex:1, overflow:'auto', padding:32 }}>
      <div style={{ maxWidth:960, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>⚡ ForgeRouter</h2>
            <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:14 }}>LLM routing engine — your revenue layer on every AI call</p>
          </div>
          <button onClick={onRefresh} disabled={loading} style={{ padding:'8px 18px', borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#94a3b8', cursor:'pointer', fontSize:13 }}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {/* Revenue stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
          {[
            { label:'Total Revenue', value:`$${formatNum(totalRevenue,4)}`, sub:'from routing markup', color:'#7C3AED' },
            { label:'Provider Cost',  value:`$${formatNum(totalCost,4)}`,    sub:'paid to LLM APIs',   color:'#2563EB' },
            { label:'Gross Margin',   value:`${formatNum(margin,1)}%`,       sub:'routing profit margin',color:'#059669' },
          ].map(s=>(
            <div key={s.label} style={{ padding:20, background:'#0f172a', borderRadius:14, border:`1px solid ${s.color}30` }}>
              <div style={{ fontSize:12, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
              <div style={{ fontSize:26, fontWeight:800, color:s.color, margin:'6px 0 2px' }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#475569' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Model Catalog */}
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14, color:'#94a3b8' }}>Model Catalog — Routing Prices</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:12, marginBottom:32 }}>
          {models.map((m:any)=>(
            <div key={m.id} style={{ padding:18, background:'#0f172a', borderRadius:14, border:'1px solid #1e293b' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{m.name}</div>
                <span style={{ fontSize:11, background:'#1e293b', padding:'2px 8px', borderRadius:99, color:'#94a3b8' }}>{m.badge}</span>
              </div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:10 }}>{m.provider}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ padding:8, background:'#1e293b', borderRadius:8, fontSize:12 }}>
                  <div style={{ color:'#64748b' }}>Input /1K</div>
                  <div style={{ color:'#7C3AED', fontWeight:600 }}>${formatNum(m.input*m.markup,5)}</div>
                </div>
                <div style={{ padding:8, background:'#1e293b', borderRadius:8, fontSize:12 }}>
                  <div style={{ color:'#64748b' }}>Output /1K</div>
                  <div style={{ color:'#2563EB', fontWeight:600 }}>${formatNum(m.output*m.markup,5)}</div>
                </div>
              </div>
              <div style={{ marginTop:8, fontSize:11, color:'#475569' }}>{m.markup}× markup · provider cost: ${formatNum(m.input,5)} / ${formatNum(m.output,5)}</div>
            </div>
          ))}
        </div>

        {/* Usage by model */}
        {usage.length > 0 && (
          <>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14, color:'#94a3b8' }}>Usage Analytics</h3>
            <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e293b', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#1e293b' }}>
                    {['Model','Requests','Tokens','Provider Cost','Revenue','Margin'].map(h=>(
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'#64748b', fontWeight:600, fontSize:12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usage.map((u:UsageStat,i:number)=>(
                    <tr key={i} style={{ borderTop:'1px solid #1e293b' }}>
                      <td style={{ padding:'12px 16px', fontFamily:'monospace', color:'#a78bfa' }}>{u.model}</td>
                      <td style={{ padding:'12px 16px' }}>{u.requests.toLocaleString()}</td>
                      <td style={{ padding:'12px 16px' }}>{u.tokens.toLocaleString()}</td>
                      <td style={{ padding:'12px 16px', color:'#f87171' }}>${formatNum(u.cost,4)}</td>
                      <td style={{ padding:'12px 16px', color:'#4ade80' }}>${formatNum(u.revenue,4)}</td>
                      <td style={{ padding:'12px 16px', color:'#94a3b8' }}>{u.revenue>0?formatNum((u.revenue-u.cost)/u.revenue*100,1):0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {usage.length === 0 && !loading && (
          <div style={{ textAlign:'center', padding:40, color:'#334155', fontSize:14 }}>No routing data yet — send some messages to see analytics here.</div>
        )}
      </div>
    </div>
  );
}

// ─── Workflow Tab ─────────────────────────────────────────────────────────────
const NODE_TEMPLATES = [
  { label:'Input',     color:'#7C3AED' },
  { label:'ForgeRouter',color:'#2563EB' },
  { label:'Agents',   color:'#059669' },
  { label:'Review',   color:'#D97706' },
  { label:'Output',   color:'#DC2626' },
  { label:'Filter',   color:'#0EA5E9' },
  { label:'Transform',color:'#8B5CF6' },
  { label:'Webhook',  color:'#F59E0B' },
];

function WorkflowTab({ nodes, setNodes, onMouseDown, onMouseMove, onMouseUp, savedWorkflows, workflowName, setWorkflowName, onSave, onLoad, onDelete, message, loading }: any) {
  const [nextId, setNextId] = useState(6);
  const edges = [[1,2],[2,3],[2,4],[3,5],[4,5]];

  function addNode(template: any) {
    const newNode = { id: nextId, label: template.label, x: 100 + Math.random()*300, y: 80 + Math.random()*200, color: template.color };
    setNodes((prev: any[]) => [...prev, newNode]);
    setNextId((n: number) => n + 1);
  }

  function removeNode(id: number) {
    setNodes((prev: any[]) => prev.filter((n: any) => n.id !== id));
  }

  return (
    <div style={{ flex:1, display:'flex', gap:0, overflow:'hidden' }}>
      {/* Left panel */}
      <div style={{ width:220, background:'#0f172a', borderRight:'1px solid #1e293b', padding:16, display:'flex', flexDirection:'column', gap:14, overflowY:'auto' }}>
        <div>
          <label style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>Workflow Name</label>
          <input value={workflowName} onChange={e=>setWorkflowName(e.target.value)} style={{ ...inputStyle, marginTop:6 }} />
        </div>

        <button onClick={onSave} style={{ padding:'10px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          💾 Save Workflow
        </button>

        {message && <div style={{ padding:8, borderRadius:8, fontSize:12, background: message.startsWith('✅')?'#05966915':'#DC262615', color: message.startsWith('✅')?'#4ade80':'#f87171' }}>{message}</div>}

        <div>
          <label style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:8 }}>Add Node</label>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {NODE_TEMPLATES.map(t=>(
              <button key={t.label} onClick={()=>addNode(t)} style={{ padding:'7px 10px', borderRadius:8, border:`1px solid ${t.color}40`, background:`${t.color}10`, color:'#e2e8f0', cursor:'pointer', fontSize:12, textAlign:'left' }}>
                + {t.label}
              </button>
            ))}
          </div>
        </div>

        {savedWorkflows.length > 0 && (
          <div>
            <label style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:8 }}>Saved Workflows</label>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {loading ? <div style={{ fontSize:12, color:'#475569' }}>Loading…</div> : savedWorkflows.map((w:any)=>(
                <div key={w.id} style={{ padding:8, borderRadius:8, background:'#1e293b', fontSize:12 }}>
                  <div style={{ fontWeight:600, color:'#e2e8f0', marginBottom:4 }}>{w.name}</div>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={()=>onLoad(w)} style={{ flex:1, padding:'4px', borderRadius:6, border:'1px solid #334155', background:'transparent', color:'#7C3AED', cursor:'pointer', fontSize:11 }}>Load</button>
                    <button onClick={()=>onDelete(w.id)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #ef444430', background:'transparent', color:'#ef4444', cursor:'pointer', fontSize:11 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'12px 16px', background:'#0a0a0f', borderBottom:'1px solid #1e293b', fontSize:13, color:'#475569' }}>
          {nodes.length} nodes · Drag to reposition · Right-click node to delete
        </div>
        <svg style={{ flex:1, background:'#0f172a', cursor:'default' }}
          onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#334155" />
            </marker>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0 L0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {edges.map(([from,to],i)=>{
            const f = nodes.find((n:any)=>n.id===from);
            const t = nodes.find((n:any)=>n.id===to);
            if(!f||!t) return null;
            return <line key={i} x1={f.x+60} y1={f.y+20} x2={t.x} y2={t.y+20} stroke="#334155" strokeWidth={2} markerEnd="url(#arrow)" />;
          })}
          {nodes.map((n:any)=>(
            <g key={n.id} onMouseDown={(e:any)=>onMouseDown(e,n.id)} onContextMenu={(e:any)=>{e.preventDefault();removeNode(n.id);}} style={{ cursor:'grab' }}>
              <rect x={n.x} y={n.y} width={120} height={40} rx={10} fill={n.color} fillOpacity={0.15} stroke={n.color} strokeWidth={2} />
              <text x={n.x+60} y={n.y+25} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight={600}>{n.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────
function BillingTab({ plans, currentPlan, tokenUsage, tokenLimit, onUpgrade, upgradeLoading, message }: any) {
  const pct = Math.min(tokenUsage/tokenLimit*100, 100);
  return (
    <div style={{ flex:1, overflow:'auto', padding:32 }}>
      <div style={{ maxWidth:920, margin:'0 auto' }}>
        <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:700 }}>Billing & Plans</h2>
        <p style={{ margin:'0 0 28px', color:'#64748b', fontSize:14 }}>Manage your subscription and token usage</p>

        {/* Usage meter */}
        <div style={{ padding:20, background:'#0f172a', borderRadius:14, border:'1px solid #1e293b', marginBottom:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontWeight:600 }}>Token Usage This Month</div>
            <div style={{ fontSize:14, color:'#64748b' }}>{tokenUsage.toLocaleString()} / {tokenLimit.toLocaleString()}</div>
          </div>
          <div style={{ height:10, background:'#1e293b', borderRadius:99 }}>
            <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background: pct>90?'#DC2626':pct>70?'#D97706':'#7C3AED', transition:'width .5s' }} />
          </div>
          <div style={{ marginTop:8, fontSize:13, color:'#475569' }}>Plan: <span style={{ color:'#a78bfa', textTransform:'capitalize', fontWeight:600 }}>{currentPlan}</span></div>
        </div>

        {message && <div style={{ padding:12, borderRadius:10, background: message.startsWith('✅')?'#05966915':'#DC262615', border:`1px solid ${message.startsWith('✅')?'#059669':'#DC2626'}`, marginBottom:20, fontSize:14, color: message.startsWith('✅')?'#4ade80':'#f87171' }}>{message}</div>}

        {/* Plan cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:16 }}>
          {plans.map((p:Plan)=>{
            const isCurrent = p.id === currentPlan;
            return (
              <div key={p.id} style={{ padding:24, borderRadius:16, border:`2px solid ${isCurrent?'#7C3AED':'#1e293b'}`, background: isCurrent?'#7C3AED10':'#0f172a', display:'flex', flexDirection:'column' }}>
                {isCurrent && <div style={{ fontSize:11, fontWeight:700, color:'#7C3AED', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>✓ Current Plan</div>}
                <div style={{ fontWeight:800, fontSize:18, marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:28, fontWeight:800, color:'#7C3AED', marginBottom:4 }}>
                  {p.price===0?'Free':`$${p.price}`}<span style={{ fontSize:13, color:'#64748b', fontWeight:400 }}>{p.price>0?'/mo':''}</span>
                </div>
                <div style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>{(p.tokens/1000).toLocaleString()}K tokens/mo</div>
                <ul style={{ padding:0, margin:'0 0 20px', listStyle:'none', flex:1 }}>
                  {p.features.map((f:string)=><li key={f} style={{ fontSize:13, color:'#94a3b8', padding:'3px 0' }}>✓ {f}</li>)}
                </ul>
                <button
                  onClick={()=>!isCurrent&&onUpgrade(p.id)}
                  disabled={isCurrent||upgradeLoading===p.id}
                  style={{ padding:'10px', borderRadius:10, border:'none', cursor: isCurrent?'default':'pointer', fontWeight:700, fontSize:14,
                    background: isCurrent?'#1e293b':'linear-gradient(135deg,#7C3AED,#2563EB)', color: isCurrent?'#475569':'#fff', opacity: upgradeLoading===p.id?0.7:1 }}>
                  {upgradeLoading===p.id ? '…' : isCurrent ? 'Current' : p.price===0 ? 'Downgrade' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:24, padding:16, background:'#0f172a', borderRadius:12, border:'1px solid #1e293b', fontSize:13, color:'#475569' }}>
          💳 <strong style={{ color:'#94a3b8' }}>Secure billing powered by Stripe.</strong> Charges are prorated and billed monthly. Cancel anytime. Enterprise plans include custom invoicing and SLAs.
        </div>
      </div>
    </div>
  );
}

// ─── Output Tab ───────────────────────────────────────────────────────────────
function OutputTab({ messages }: any) {
  const assistantMsgs = messages.filter((m:Message)=>m.role==='assistant');
  const lastMsg = assistantMsgs[assistantMsgs.length-1];
  return (
    <div style={{ flex:1, overflow:'auto', padding:32 }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>Output</h2>
            <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:14 }}>{assistantMsgs.length} response{assistantMsgs.length!==1?'s':''} generated</p>
          </div>
          {lastMsg && (
            <button onClick={()=>{ const a=document.createElement('a'); a.href='data:text/plain,'+encodeURIComponent(lastMsg.content); a.download='forge-output.txt'; a.click(); }} style={{ padding:'8px 16px', borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#94a3b8', cursor:'pointer', fontSize:13 }}>
              ↓ Export
            </button>
          )}
        </div>
        {assistantMsgs.length === 0 ? (
          <div style={{ textAlign:'center', padding:80, color:'#334155' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📤</div>
            <div style={{ fontSize:16, fontWeight:600 }}>No output yet</div>
            <div style={{ fontSize:14, marginTop:6 }}>Send a message in the Studio tab to see outputs here</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {assistantMsgs.map((m:Message,i:number)=>(
              <div key={i} style={{ padding:24, background:'#0f172a', borderRadius:16, border:'1px solid #1e293b' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>⚡</span>
                    <span style={{ fontSize:12, background:'#1e293b', padding:'2px 8px', borderRadius:4, color:'#7C3AED', fontFamily:'monospace' }}>{m.model||'forge'}</span>
                  </div>
                  <span style={{ fontSize:12, color:'#475569' }}>{new Date(m.ts).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize:14, lineHeight:1.7, color:'#cbd5e1', whiteSpace:'pre-wrap' }}>{m.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #334155', background:'#1e293b', color:'#e2e8f0', fontSize:13, outline:'none' };

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ savedKeys, keyInputs, setKeyInputs, onSave, saving, message, orModels, orLoading, onLoadOrModels, orSearch, setOrSearch, onSelectModel, customProviders, newProvider, setNewProvider, onAddProvider, addingProvider, onDeleteProvider, onTestProvider, testingProvider, providerMsg }: any) {
  const providers = [
    { id:'anthropic',  label:'Anthropic',   icon:'🟣', free:false, desc:'Claude Opus 4, Sonnet 4, Haiku 4.5',         placeholder:'sk-ant-api03-…',   signup:'https://console.anthropic.com/settings/keys',    color:'#7C3AED', monthly:'claude.ai/settings' },
    { id:'openai',     label:'OpenAI',      icon:'🟢', free:false, desc:'GPT-4o, GPT-4.1, o3 Mini, o1',              placeholder:'sk-proj-…',        signup:'https://platform.openai.com/api-keys',           color:'#059669', monthly:'platform.openai.com/account/billing' },
    { id:'openrouter', label:'OpenRouter',  icon:'🔵', free:false, desc:'400+ models — every frontier model in one key',placeholder:'sk-or-v1-…',      signup:'https://openrouter.ai/keys',                     color:'#2563EB', monthly:'openrouter.ai/credits' },
    { id:'groq',       label:'Groq',        icon:'⚡', free:true,  desc:'FREE — Llama 3.3, Mixtral, ultra-fast inference',placeholder:'gsk_…',          signup:'https://console.groq.com/keys',                  color:'#F59E0B', monthly:'console.groq.com' },
    { id:'gemini',     label:'Google',      icon:'🔴', free:true,  desc:'FREE tier — Gemini 2.0 Flash, 1.5 Pro',     placeholder:'AIza…',            signup:'https://aistudio.google.com/app/apikey',         color:'#DC2626', monthly:'aistudio.google.com' },
    { id:'mistral',    label:'Mistral AI',  icon:'🇫🇷', free:true,  desc:'FREE tier — Mistral Small, EU-based models', placeholder:'…',               signup:'https://console.mistral.ai/api-keys',            color:'#E25822', monthly:'console.mistral.ai' },
    { id:'together',   label:'Together AI', icon:'🤝', free:false, desc:'Open-source models — Llama, Qwen, DBRX',    placeholder:'…',                signup:'https://api.together.ai/settings/api-keys',      color:'#8B5CF6', monthly:'api.together.ai' },
    { id:'perplexity', label:'Perplexity',  icon:'🔍', free:false, desc:'Sonar models with web search built-in',     placeholder:'pplx-…',           signup:'https://www.perplexity.ai/settings/api',         color:'#06B6D4', monthly:'perplexity.ai/settings' },
    { id:'cohere',     label:'Cohere',      icon:'🌊', free:true,  desc:'FREE trial — Command R+, enterprise NLP',   placeholder:'…',                signup:'https://dashboard.cohere.com/api-keys',          color:'#0EA5E9', monthly:'dashboard.cohere.com' },
    { id:'cursor',     label:'Cursor',      icon:'🖱', free:false, desc:'Cursor Pro/Business API access',            placeholder:'…',                signup:'https://cursor.sh/settings',                     color:'#6366F1', monthly:'cursor.sh/settings' },
  ];

  const filtered = orModels.filter((m: any) => {
    const q = orSearch.toLowerCase();
    return !q || m.id?.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q);
  });

  return (
    <div style={{ flex:1, overflow:'auto', padding:32 }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>
        <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:700 }}>Settings — API Keys</h2>
        <p style={{ margin:'0 0 28px', color:'#64748b', fontSize:14 }}>
          Add your own API keys. Forge routes your requests through them — you pay providers directly at their rates with no extra Forge markup.
        </p>

        {/* Key inputs */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:28 }}>
          {providers.map(p => {
            const hasKey = savedKeys[`has_${p.id}`];
            const masked = savedKeys[`${p.id}_key`];
            return (
              <div key={p.id} style={{ padding:20, background:'#0f172a', borderRadius:14, border:`1px solid ${hasKey ? p.color+'40' : '#1e293b'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>{p.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      {p.label}
                      {hasKey && <span style={{ fontSize:11, background:p.color+'20', color:p.color, padding:'2px 8px', borderRadius:99, fontWeight:600 }}>✓ Connected</span>}
                      {(p as any).free && <span style={{ fontSize:10, background:'#05966920', color:'#4ade80', padding:'2px 6px', borderRadius:99, fontWeight:700 }}>FREE TIER</span>}
                    </div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{p.desc}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
                    <a href={p.signup} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#7C3AED', textDecoration:'none', background:'#7C3AED10', padding:'4px 10px', borderRadius:6, whiteSpace:'nowrap' }}>Get key →</a>
                    <a href={`https://${(p as any).monthly}`} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#64748b', textDecoration:'none' }}>Monthly plan ↗</a>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    type="password"
                    value={keyInputs[p.id as keyof typeof keyInputs]}
                    onChange={e => setKeyInputs((prev: any) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder={hasKey ? `Current: ${masked} — paste new key to update` : p.placeholder}
                    style={{ ...inputStyle, flex:1, fontFamily:'monospace', fontSize:13 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {message && (
          <div style={{ padding:12, borderRadius:10, marginBottom:16, fontSize:14,
            background: message.startsWith('✅') ? '#05966915' : '#DC262615',
            border: `1px solid ${message.startsWith('✅') ? '#059669' : '#DC2626'}`,
            color: message.startsWith('✅') ? '#4ade80' : '#f87171' }}>
            {message}
          </div>
        )}

        <button onClick={onSave} disabled={saving || !Object.values(keyInputs).some(Boolean)} style={{
          padding:'12px 28px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:700, fontSize:15,
          background:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'#fff',
          opacity: (saving || !Object.values(keyInputs).some(Boolean)) ? 0.5 : 1, marginBottom:40
        }}>
          {saving ? 'Saving…' : 'Save API Keys'}
        </button>

        {/* Custom Providers */}
        <div style={{ borderTop:'1px solid #1e293b', paddingTop:32, marginBottom:32 }}>
          <h3 style={{ margin:'0 0 6px', fontSize:18, fontWeight:700 }}>🔌 Custom Providers</h3>
          <p style={{ margin:'0 0 20px', color:'#64748b', fontSize:13 }}>Add any OpenAI-compatible API. Forge routes calls through it with your markup on top.</p>

          {/* Existing custom providers */}
          {customProviders.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {customProviders.map((p:any) => (
                <div key={p.id} style={{ padding:16, background:'#0f172a', borderRadius:12, border:'1px solid #1e293b', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
                      {p.name}
                      <span style={{ fontSize:11, background:'#7C3AED20', color:'#a78bfa', padding:'2px 6px', borderRadius:99 }}>{p.markup_multiplier}× markup</span>
                      {!p.active && <span style={{ fontSize:11, color:'#ef4444' }}>disabled</span>}
                    </div>
                    <div style={{ fontSize:12, color:'#475569', fontFamily:'monospace' }}>{p.base_url}</div>
                    {p.notes && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{p.notes}</div>}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => onTestProvider(p.id)} disabled={testingProvider===p.id} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #334155', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:12 }}>
                      {testingProvider===p.id ? '⏳' : '🧪 Test'}
                    </button>
                    <button onClick={() => onDeleteProvider(p.id)} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #ef444440', background:'transparent', color:'#ef4444', cursor:'pointer', fontSize:12 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new custom provider */}
          <div style={{ padding:20, background:'#0f172a', borderRadius:14, border:'1px dashed #334155' }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16, color:'#94a3b8' }}>+ Add Custom Provider</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Provider Name *</label>
                <input value={newProvider.name} onChange={e=>setNewProvider((p:any)=>({...p,name:e.target.value}))} placeholder="e.g. My Llama Server" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Base URL * (OpenAI-compatible)</label>
                <input value={newProvider.base_url} onChange={e=>setNewProvider((p:any)=>({...p,base_url:e.target.value}))} placeholder="https://api.example.com/v1" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>API Key *</label>
                <input type="password" value={newProvider.api_key} onChange={e=>setNewProvider((p:any)=>({...p,api_key:e.target.value}))} placeholder="sk-…" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Markup Multiplier (Forge charges this × cost)</label>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="range" min="1.0" max="5.0" step="0.05" value={newProvider.markup_multiplier}
                    onChange={e=>setNewProvider((p:any)=>({...p,markup_multiplier:parseFloat(e.target.value)}))}
                    style={{ flex:1 }} />
                  <span style={{ fontSize:14, fontWeight:700, color:'#7C3AED', minWidth:40 }}>{newProvider.markup_multiplier}×</span>
                </div>
                <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>= {Math.round((newProvider.markup_multiplier-1)*100)}% margin on every call</div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Default Model Prefix (optional)</label>
                <input value={newProvider.model_prefix} onChange={e=>setNewProvider((p:any)=>({...p,model_prefix:e.target.value}))} placeholder="e.g. meta-llama" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:4 }}>Notes (optional)</label>
                <input value={newProvider.notes} onChange={e=>setNewProvider((p:any)=>({...p,notes:e.target.value}))} placeholder="e.g. Local Ollama instance" style={inputStyle} />
              </div>
            </div>

            <div style={{ padding:12, background:'#1e293b', borderRadius:8, marginBottom:12, fontSize:12, color:'#64748b' }}>
              <strong style={{ color:'#94a3b8' }}>Compatible with:</strong> Ollama · LM Studio · vLLM · Together AI · Replicate · Any OpenAI-format API
              <br/><strong style={{ color:'#94a3b8' }}>In Studio, select model as:</strong> <code style={{ color:'#7C3AED' }}>custom:[provider-id]:[model-name]</code>
            </div>

            {providerMsg && <div style={{ padding:10, borderRadius:8, marginBottom:12, fontSize:13,
              background: providerMsg.startsWith('✅')?'#05966915':'#DC262615',
              color: providerMsg.startsWith('✅')?'#4ade80':'#f87171' }}>{providerMsg}</div>}

            <button onClick={onAddProvider} disabled={addingProvider||!newProvider.name||!newProvider.base_url||!newProvider.api_key} style={{
              padding:'10px 24px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:14,
              background:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'#fff',
              opacity:(addingProvider||!newProvider.name||!newProvider.base_url||!newProvider.api_key)?0.5:1
            }}>{addingProvider?'Adding…':'Add Provider'}</button>
          </div>
        </div>

        {/* OpenRouter model browser */}
        <div style={{ borderTop:'1px solid #1e293b', paddingTop:32 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>⚡ OpenRouter Model Browser</h3>
              <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:13 }}>400+ models — click any to use it instantly in Studio</p>
            </div>
            <button onClick={onLoadOrModels} disabled={orLoading || !savedKeys.has_openrouter} style={{
              padding:'8px 18px', borderRadius:10, border:'1px solid #334155', background:'#0f172a',
              color: savedKeys.has_openrouter ? '#94a3b8' : '#475569', cursor: savedKeys.has_openrouter ? 'pointer' : 'not-allowed', fontSize:13
            }}>
              {orLoading ? '⏳ Loading…' : orModels.length > 0 ? `↻ Refresh (${orModels.length})` : 'Load Models'}
            </button>
          </div>

          {!savedKeys.has_openrouter && (
            <div style={{ padding:20, background:'#1e293b', borderRadius:12, textAlign:'center', color:'#64748b', fontSize:14 }}>
              Add your <strong style={{ color:'#2563EB' }}>OpenRouter API key</strong> above to browse 400+ models
            </div>
          )}

          {orModels.length > 0 && (
            <>
              <input
                value={orSearch}
                onChange={e => setOrSearch(e.target.value)}
                placeholder="Search models — llama, mistral, claude, gemini, qwen…"
                style={{ ...inputStyle, width:'100%', boxSizing:'border-box', marginBottom:14 }}
              />
              <div style={{ fontSize:12, color:'#475569', marginBottom:10 }}>{filtered.length} models{orSearch ? ` matching "${orSearch}"` : ''}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10, maxHeight:520, overflowY:'auto' }}>
                {filtered.slice(0,200).map((m: any) => {
                  const priceIn  = m.pricing?.prompt  ? `$${(parseFloat(m.pricing.prompt)*1000).toFixed(4)}/1K`  : 'free';
                  const priceOut = m.pricing?.completion ? `$${(parseFloat(m.pricing.completion)*1000).toFixed(4)}/1K` : 'free';
                  const isFree   = priceIn === 'free' && priceOut === 'free';
                  return (
                    <div key={m.id} onClick={() => onSelectModel(m.id)} style={{
                      padding:14, background:'#0f172a', borderRadius:12, border:'1px solid #1e293b',
                      cursor:'pointer', transition:'all .15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor='#7C3AED')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor='#1e293b')}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{m.name || m.id}</div>
                        {isFree && <span style={{ fontSize:10, background:'#05966920', color:'#4ade80', padding:'2px 6px', borderRadius:99, fontWeight:700 }}>FREE</span>}
                      </div>
                      <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.id}</div>
                      <div style={{ display:'flex', gap:6 }}>
                        <span style={{ fontSize:11, color:'#64748b' }}>In: {priceIn}</span>
                        <span style={{ fontSize:11, color:'#334155' }}>·</span>
                        <span style={{ fontSize:11, color:'#64748b' }}>Out: {priceOut}</span>
                      </div>
                      {m.context_length && <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>{(m.context_length/1000).toFixed(0)}K ctx</div>}
                    </div>
                  );
                })}
              </div>
              {filtered.length > 200 && <div style={{ textAlign:'center', color:'#475569', fontSize:13, marginTop:12 }}>Showing 200 of {filtered.length} — narrow search to see more</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
