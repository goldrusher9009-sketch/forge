'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'studio' | 'agents' | 'workflow' | 'output';
type Lang = { code: string; name: string; flag: string };
type MsgRole = 'user' | 'agent' | 'system';
type AgentStatus = 'idle' | 'thinking' | 'done' | 'error';
type Channel = 'chat' | 'whatsapp' | 'telegram' | 'ios' | 'android' | 'email' | 'slack';
type NodeType = 'input' | 'agent' | 'condition' | 'output' | 'transform' | 'split' | 'merge';

interface Message {
  id: string;
  role: MsgRole;
  content: string;
  agentId?: string;
  agentName?: string;
  agentColor?: string;
  lang?: string;
  timestamp: Date;
  thinking?: boolean;
  channel?: Channel;
}

interface Agent {
  id: string;
  name: string;
  model: string;
  provider: string;
  color: string;
  icon: string;
  specialty: string;
  status: AgentStatus;
  selected: boolean;
  confidence?: number;
  outputPreview?: string;
}

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  config?: Record<string, string>;
  connected?: string[];
}

interface OutputProduct {
  id: string;
  type: 'document' | 'code' | 'marketing' | 'data' | 'app';
  title: string;
  content: string;
  format: string;
  createdAt: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LANGUAGES: Lang[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

const CHANNELS: { id: Channel; label: string; icon: string; color: string }[] = [
  { id: 'chat', label: 'Forge Chat', icon: '💬', color: '#7c3aed' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '📱', color: '#25d366' },
  { id: 'telegram', label: 'Telegram', icon: '✈️', color: '#0088cc' },
  { id: 'ios', label: 'iMessage', icon: '🍎', color: '#007aff' },
  { id: 'android', label: 'Android', icon: '🤖', color: '#3ddc84' },
  { id: 'email', label: 'Email', icon: '📧', color: '#f59e0b' },
  { id: 'slack', label: 'Slack', icon: '⚡', color: '#4a154b' },
];

const DEFAULT_AGENTS: Agent[] = [
  { id: 'a1', name: 'Aria', model: 'claude-opus-4', provider: 'Anthropic', color: '#7c3aed', icon: '🧠', specialty: 'Reasoning & Analysis', status: 'idle', selected: true },
  { id: 'a2', name: 'Nova', model: 'gpt-4o', provider: 'OpenAI', color: '#10b981', icon: '⚡', specialty: 'Code & Engineering', status: 'idle', selected: false },
  { id: 'a3', name: 'Sage', model: 'gemini-1.5-pro', provider: 'Google', color: '#3b82f6', icon: '🔬', specialty: 'Research & Data', status: 'idle', selected: false },
  { id: 'a4', name: 'Blaze', model: 'forge-fast-v2', provider: 'ForgeRouter', color: '#f59e0b', icon: '🚀', specialty: 'Speed & Efficiency', status: 'idle', selected: false },
  { id: 'a5', name: 'Echo', model: 'llama-3.1-405b', provider: 'ForgeRouter', color: '#ef4444', icon: '🌐', specialty: 'Multilingual & Translation', status: 'idle', selected: false },
  { id: 'a6', name: 'Iris', model: 'forge-creative-v1', provider: 'ForgeRouter', color: '#ec4899', icon: '🎨', specialty: 'Creative & Marketing', status: 'idle', selected: false },
];

const DEFAULT_WORKFLOW: WorkflowNode[] = [
  { id: 'n1', type: 'input', label: 'User Input', x: 80, y: 200, connected: ['n2'] },
  { id: 'n2', type: 'agent', label: 'ForgeRouter', x: 280, y: 200, connected: ['n3', 'n4'] },
  { id: 'n3', type: 'agent', label: 'Analysis Agent', x: 480, y: 120, connected: ['n5'] },
  { id: 'n4', type: 'agent', label: 'Creative Agent', x: 480, y: 280, connected: ['n5'] },
  { id: 'n5', type: 'merge', label: 'Merge & Rank', x: 680, y: 200, connected: ['n6'] },
  { id: 'n6', type: 'output', label: 'Product Output', x: 880, y: 200, connected: [] },
];

const NODE_COLORS: Record<NodeType, string> = {
  input: '#7c3aed', agent: '#3b82f6', condition: '#f59e0b',
  output: '#10b981', transform: '#ec4899', split: '#06b6d4', merge: '#8b5cf6',
};

const NODE_ICONS: Record<NodeType, string> = {
  input: '📥', agent: '🤖', condition: '⚡', output: '📤', transform: '🔄', split: '🔀', merge: '🔗',
};

// ─── Utility ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Simulated responses per agent
const AGENT_RESPONSES: Record<string, string[]> = {
  a1: [
    "I've analyzed your request in depth. The core insight is that combining multiple perspectives yields better outcomes — here's my structured breakdown with key reasoning chains...",
    "This is a nuanced problem. Let me walk you through the logical framework: first, we identify the constraint space, then explore the solution manifold...",
    "Excellent question. Based on systematic analysis, the optimal approach involves three phases: discovery, synthesis, and validation...",
  ],
  a2: [
    "```typescript\n// Here's a clean implementation:\nconst solution = async (input: string) => {\n  const processed = await transform(input);\n  return optimize(processed);\n};\n```\nThis approach gives O(n log n) complexity with minimal memory footprint.",
    "I'd architect this as a microservices pattern with event-driven communication. The key components are: API gateway, message broker, and worker pool...",
  ],
  a3: [
    "Based on my research across 47 relevant sources, the consensus points to three key findings: (1) market size is $2.3T by 2027, (2) adoption rate is accelerating at 34% YoY, (3) the competitive moat centers on data network effects...",
    "I found 12 peer-reviewed studies supporting this hypothesis. The statistical significance is p<0.001, with effect size d=0.82 (large). Here's the synthesis...",
  ],
  a4: [
    "Done. Here's the fast answer: use approach B — it's 3x faster, costs less, and has proven track record. Details on demand.",
    "Fastest path: skip steps 2-4, go directly to the core solution. I've seen this pattern 1000+ times.",
  ],
  a5: [
    "I'll respond in your preferred language. / Je répondrai dans votre langue préférée. / Responderé en su idioma preferido. / 我会用您喜欢的语言回答。",
    "Translation complete. Cultural context note: this phrase carries different connotations across regions — I've adapted it appropriately for your target audience.",
  ],
  a6: [
    "✨ Here's a compelling narrative for your brand: 'Forge doesn't just connect ideas — it transforms them into reality. Where human creativity meets machine precision.' Hook, story, offer — all aligned with your voice.",
    "Campaign concept: 'The Swarm Advantage' — visuals of multiple agents working in harmony, each bringing unique expertise. Tagline: 'Every mind, one mission.'",
  ],
};

function getAgentResponse(agent: Agent, prompt: string): string {
  const responses = AGENT_RESPONSES[agent.id] || ["I've processed your request and here's my analysis..."];
  return responses[Math.floor(Math.random() * responses.length)];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Typing indicator
function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="typing-dot w-2 h-2 rounded-full" style={{ background: color }} />
      ))}
    </div>
  );
}

// Language picker
function LangPicker({ value, onChange }: { value: string; onChange: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const lang = LANGUAGES.find(l => l.code === value) || LANGUAGES[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors"
        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
        <span>{lang.flag}</span>
        <span style={{ color: 'var(--text-2)' }}>{lang.name}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', width: 180 }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => { onChange(l.code); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--bg-3)]"
              style={{ color: l.code === value ? 'var(--accent-2)' : 'var(--text)' }}>
              <span>{l.flag}</span> {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Channel picker
function ChannelPicker({ value, onChange }: { value: Channel; onChange: (c: Channel) => void }) {
  const [open, setOpen] = useState(false);
  const ch = CHANNELS.find(c => c.id === value) || CHANNELS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors"
        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
        <span>{ch.icon}</span>
        <span style={{ color: 'var(--text-2)' }}>{ch.label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', width: 180 }}>
          {CHANNELS.map(c => (
            <button key={c.id} onClick={() => { onChange(c.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--bg-3)]">
              <span>{c.icon}</span>
              <span style={{ color: c.id === value ? c.color : 'var(--text)' }}>{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STUDIO TAB ───────────────────────────────────────────────────────────────
function StudioTab({ agents, onAgentsChange }: {
  agents: Agent[];
  onAgentsChange: (a: Agent[]) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(), role: 'system', content: 'Forge is ready. Select your agents, choose your language, and start building.',
      timestamp: new Date(), lang: 'en',
    }
  ]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('en');
  const [channel, setChannel] = useState<Channel>('chat');
  const [mode, setMode] = useState<'chat' | 'canvas' | 'voice'>('chat');
  const [isRunning, setIsRunning] = useState(false);
  const [routingMode, setRoutingMode] = useState<'auto' | 'manual' | 'swarm'>('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selectedAgents = useMemo(() => agents.filter(a => a.selected), [agents]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isRunning) return;
    const prompt = input.trim();
    setInput('');

    // Add user message
    setMessages(prev => [...prev, {
      id: uid(), role: 'user', content: prompt, timestamp: new Date(), lang, channel,
    }]);

    setIsRunning(true);

    // Determine which agents to use
    let activeAgents = selectedAgents;
    if (routingMode === 'auto') {
      // Auto-route: pick best 1-2 agents
      activeAgents = [agents[0]]; // simplify: use first selected
      if (!activeAgents.length) activeAgents = [agents[0]];
    } else if (routingMode === 'swarm') {
      activeAgents = agents.filter(a => a.selected);
      if (!activeAgents.length) activeAgents = agents.slice(0, 3);
    }

    // Update agents status
    onAgentsChange(agents.map(a => ({
      ...a, status: activeAgents.find(x => x.id === a.id) ? 'thinking' : a.status,
    })));

    // Stream responses from each agent
    for (let i = 0; i < activeAgents.length; i++) {
      const agent = activeAgents[i];
      await sleep(600 + i * 400);

      // Add thinking indicator
      const thinkId = uid();
      setMessages(prev => [...prev, {
        id: thinkId, role: 'agent', content: '', agentId: agent.id,
        agentName: agent.name, agentColor: agent.color, timestamp: new Date(), thinking: true,
      }]);

      await sleep(1200 + Math.random() * 800);

      // Replace with real response
      const response = getAgentResponse(agent, prompt);
      setMessages(prev => prev.map(m => m.id === thinkId ? {
        ...m, content: response, thinking: false,
      } : m));

      onAgentsChange(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'done', confidence: 80 + Math.floor(Math.random() * 19) } : a));
    }

    setIsRunning(false);
  }, [input, isRunning, selectedAgents, agents, routingMode, lang, channel, onAgentsChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Canvas drawing
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    setLastPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setLastPos({ x, y });
  };
  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['chat', 'canvas', 'voice'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="px-3 py-1.5 text-xs font-medium transition-colors capitalize"
                style={{
                  background: mode === m ? 'var(--accent)' : 'var(--bg-3)',
                  color: mode === m ? '#fff' : 'var(--text-2)',
                }}>
                {m === 'chat' ? '💬 Chat' : m === 'canvas' ? '✏️ Sketch' : '🎤 Voice'}
              </button>
            ))}
          </div>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

          <LangPicker value={lang} onChange={setLang} />
          <ChannelPicker value={channel} onChange={setChannel} />

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

          {/* Routing mode */}
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>Route:</span>
            {(['auto', 'manual', 'swarm'] as const).map(r => (
              <button key={r} onClick={() => setRoutingMode(r)}
                className="px-2.5 py-1 text-xs rounded-md transition-colors capitalize"
                style={{
                  background: routingMode === r ? 'rgba(124,58,237,0.2)' : 'transparent',
                  color: routingMode === r ? 'var(--accent-2)' : 'var(--text-3)',
                  border: `1px solid ${routingMode === r ? 'var(--accent)' : 'transparent'}`,
                }}>
                {r === 'auto' ? '⚡ Auto' : r === 'manual' ? '🎯 Manual' : '🌊 Swarm'}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              {selectedAgents.length} agent{selectedAgents.length !== 1 ? 's' : ''} active
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mode === 'chat' ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'system' && (
                      <div className="text-xs px-3 py-1.5 rounded-full mx-auto" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>
                        {msg.content}
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="max-w-lg">
                        <div className="flex items-center gap-2 mb-1 justify-end">
                          {msg.channel && msg.channel !== 'chat' && (
                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                              {CHANNELS.find(c => c.id === msg.channel)?.icon}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>You</span>
                        </div>
                        <div className="msg-user px-4 py-2.5 text-sm" style={{ background: 'var(--accent)', color: '#fff' }}>
                          {msg.content}
                        </div>
                      </div>
                    )}
                    {msg.role === 'agent' && (
                      <div className="max-w-2xl w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{ background: msg.agentColor + '33' }}>
                            {agents.find(a => a.id === msg.agentId)?.icon}
                          </div>
                          <span className="text-xs font-medium" style={{ color: msg.agentColor }}>{msg.agentName}</span>
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                            {agents.find(a => a.id === msg.agentId)?.model}
                          </span>
                        </div>
                        <div className="msg-ai px-4 py-3 text-sm" style={{ background: 'var(--bg-3)', color: 'var(--text)', border: `1px solid ${msg.agentColor}33` }}>
                          {msg.thinking ? <TypingIndicator color={msg.agentColor || '#7c3aed'} /> : (
                            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 rounded-xl overflow-hidden" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message in ${LANGUAGES.find(l => l.code === lang)?.name}... (Enter to send, Shift+Enter for newline)`}
                      rows={1}
                      className="w-full px-4 py-3 text-sm resize-none bg-transparent outline-none"
                      style={{ color: 'var(--text)', minHeight: 44, maxHeight: 160 }}
                      disabled={isRunning}
                    />
                  </div>
                  <button onClick={sendMessage} disabled={!input.trim() || isRunning}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      background: input.trim() && !isRunning ? 'var(--accent)' : 'var(--bg-3)',
                      color: input.trim() && !isRunning ? '#fff' : 'var(--text-3)',
                    }}>
                    {isRunning ? (
                      <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : mode === 'canvas' ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-2)' }}>Sketch your idea — Forge agents will interpret it</span>
                <button onClick={clearCanvas} className="ml-auto text-xs px-2.5 py-1 rounded-md"
                  style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  Clear
                </button>
                <button onClick={sendMessage} disabled={isRunning}
                  className="text-xs px-3 py-1 rounded-md transition-colors"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  Send to Agents
                </button>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <canvas ref={canvasRef} width={1200} height={600}
                  className="absolute inset-0 w-full h-full cursor-crosshair"
                  style={{ background: 'var(--bg)' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                  <span className="text-4xl">✏️</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center animate-agent-glow"
                style={{ background: 'var(--bg-3)', border: '2px solid var(--accent)' }}>
                <span className="text-4xl">🎤</span>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>Voice Input</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Speak in any language — Forge understands you</p>
              </div>
              <button className="px-6 py-3 rounded-xl font-medium text-sm transition-all"
                style={{ background: 'var(--accent)', color: '#fff' }}
                onClick={() => alert('Voice input requires microphone permission — connect ForgeRouter with STT endpoint')}>
                Start Speaking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Agent sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col" style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Active Agents</span>
          <button className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>
            + Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {agents.map(agent => (
            <div key={agent.id}
              onClick={() => onAgentsChange(agents.map(a => a.id === agent.id ? { ...a, selected: !a.selected } : a))}
              className="p-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: agent.selected ? agent.color + '15' : 'var(--bg-3)',
                border: `1px solid ${agent.selected ? agent.color + '60' : 'var(--border)'}`,
              }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: agent.color + '22' }}>
                  {agent.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{agent.name}</span>
                    {agent.selected && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-agent-glow" style={{ background: agent.color }} />
                    )}
                  </div>
                  <span className="text-xs truncate block" style={{ color: 'var(--text-3)' }}>{agent.model}</span>
                </div>
              </div>
              {agent.status !== 'idle' && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: agent.color }}>
                      {agent.status === 'thinking' ? '⚡ Thinking...' : agent.status === 'done' ? '✓ Done' : '✗ Error'}
                    </span>
                    {agent.confidence && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{agent.confidence}%</span>}
                  </div>
                  {agent.status === 'thinking' && (
                    <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-4)' }}>
                      <div className="h-full animate-shimmer rounded-full" style={{ background: agent.color, width: '60%' }} />
                    </div>
                  )}
                </div>
              )}
              <div className="mt-1.5">
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{agent.specialty}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ForgeRouter badge */}
        <div className="p-3 mx-3 mb-3 rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.15))', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🔀</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--accent-2)' }}>ForgeRouter</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Auto-routing to best model based on task type, cost, and latency</p>
        </div>
      </div>
    </div>
  );
}

// ─── AGENTS TAB ───────────────────────────────────────────────────────────────
function AgentsTab({ agents, onAgentsChange }: { agents: Agent[]; onAgentsChange: (a: Agent[]) => void }) {
  const [selected, setSelected] = useState<Agent | null>(null);

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Agent Swarm</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Configure and deploy AI agents with specialized capabilities</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            + New Agent
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {agents.map(agent => (
            <div key={agent.id} onClick={() => setSelected(selected?.id === agent.id ? null : agent)}
              className="p-4 rounded-2xl cursor-pointer transition-all"
              style={{
                background: selected?.id === agent.id ? agent.color + '15' : 'var(--bg-2)',
                border: `1px solid ${selected?.id === agent.id ? agent.color + '60' : 'var(--border)'}`,
              }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: agent.color + '22' }}>
                  {agent.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-3)', color: agent.color, border: `1px solid ${agent.color}40` }}>
                    {agent.provider}
                  </span>
                  <button onClick={e => {
                    e.stopPropagation();
                    onAgentsChange(agents.map(a => a.id === agent.id ? { ...a, selected: !a.selected } : a));
                  }}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: agent.selected ? agent.color : 'var(--bg-4)' }}>
                    {agent.selected && <span className="text-white text-xs">✓</span>}
                  </button>
                </div>
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{agent.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{agent.model}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{agent.specialty}</p>

              <div className="mt-3 flex gap-2">
                <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-3)' }}>
                  <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {agent.status === 'thinking' ? '⚡' : agent.status === 'done' ? '✓' : '○'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Status</div>
                </div>
                <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-3)' }}>
                  <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {agent.confidence ? `${agent.confidence}%` : 'N/A'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Confidence</div>
                </div>
                <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-3)' }}>
                  <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {agent.selected ? 'On' : 'Off'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Active</div>
                </div>
              </div>
            </div>
          ))}

          {/* Add custom agent card */}
          <div className="p-4 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 border-dashed"
            style={{ background: 'transparent', border: '2px dashed var(--border)', minHeight: 180 }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'var(--bg-3)' }}>
              +
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Custom Agent</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Connect any ForgeRouter model</p>
            </div>
          </div>
        </div>

        {/* ForgeRouter panel */}
        <div className="mt-6 p-5 rounded-2xl" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--blue))' }}>
              🔀
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>ForgeRouter</h3>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Your unified model gateway — like OpenRouter, built for Forge</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
              <span className="text-xs" style={{ color: 'var(--green)' }}>Connected</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Models Available', value: '50+', icon: '🧠' },
              { label: 'Avg Latency', value: '420ms', icon: '⚡' },
              { label: 'Cost Savings', value: '67%', icon: '💰' },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-xl" style={{ background: 'var(--bg-3)' }}>
                <div className="text-lg">{stat.icon}</div>
                <div className="text-lg font-bold mt-1" style={{ color: 'var(--text)' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-3)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WORKFLOW TAB ─────────────────────────────────────────────────────────────
function WorkflowTab() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(DEFAULT_WORKFLOW);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  const PALETTE: { type: NodeType; label: string }[] = [
    { type: 'input', label: 'Input' },
    { type: 'agent', label: 'Agent' },
    { type: 'condition', label: 'Condition' },
    { type: 'transform', label: 'Transform' },
    { type: 'split', label: 'Split' },
    { type: 'merge', label: 'Merge' },
    { type: 'output', label: 'Output' },
  ];

  const startDrag = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id)!;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const svgRect = canvasRef.current!.getBoundingClientRect();
    setDragging(id);
    setDragOffset({ x: e.clientX - svgRect.left - node.x, y: e.clientY - svgRect.top - node.y });
    setSelected(id);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(20, e.clientX - rect.left - dragOffset.x);
    const y = Math.max(20, e.clientY - rect.top - dragOffset.y);
    setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x, y } : n));
  };

  const addNode = (type: NodeType) => {
    const newNode: WorkflowNode = {
      id: uid(), type, label: PALETTE.find(p => p.type === type)?.label || type,
      x: 200 + Math.random() * 400, y: 100 + Math.random() * 200, connected: [],
    };
    setNodes(prev => [...prev, newNode]);
  };

  const connectNodes = (fromId: string, toId: string) => {
    setNodes(prev => prev.map(n => n.id === fromId ? {
      ...n, connected: n.connected?.includes(toId) ? n.connected : [...(n.connected || []), toId],
    } : n));
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id).map(n => ({
      ...n, connected: n.connected?.filter(c => c !== id),
    })));
    if (selected === id) setSelected(null);
  };

  return (
    <div className="flex h-full">
      {/* Palette */}
      <div className="w-48 flex-shrink-0 p-3 flex flex-col gap-2 overflow-y-auto"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <p className="text-xs font-semibold px-1 mb-1" style={{ color: 'var(--text-3)' }}>NODES</p>
        {PALETTE.map(p => (
          <button key={p.type} onClick={() => addNode(p.type)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-left"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            <span className="text-base">{NODE_ICONS[p.type]}</span>
            <div>
              <div className="font-medium text-xs" style={{ color: 'var(--text)' }}>{p.label}</div>
            </div>
          </button>
        ))}

        <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="w-full py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            ▶ Run Workflow
          </button>
          <button className="w-full py-2 mt-2 rounded-xl text-xs transition-colors"
            style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
            onClick={() => setNodes(DEFAULT_WORKFLOW)}>
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="var(--border)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <svg ref={canvasRef} className="absolute inset-0 w-full h-full"
          onMouseMove={onMouseMove} onMouseUp={() => setDragging(null)}>
          {/* Connections */}
          {nodes.map(node => node.connected?.map(toId => {
            const toNode = nodes.find(n => n.id === toId);
            if (!toNode) return null;
            const x1 = node.x + 80;
            const y1 = node.y + 22;
            const x2 = toNode.x;
            const y2 = toNode.y + 22;
            const mx = (x1 + x2) / 2;
            return (
              <g key={`${node.id}-${toId}`}>
                <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none" stroke={NODE_COLORS[node.type]} strokeWidth="2" strokeOpacity="0.6"
                  markerEnd="url(#arrow)" />
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill={NODE_COLORS[node.type]} fillOpacity="0.6" />
                  </marker>
                </defs>
              </g>
            );
          }))}

          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id} onMouseDown={e => startDrag(e, node.id)}
              onClick={e => { e.stopPropagation(); setSelected(node.id); }}
              style={{ cursor: 'grab' }}>
              <rect x={node.x} y={node.y} width="110" height="44" rx="10"
                fill={selected === node.id ? NODE_COLORS[node.type] + '30' : 'var(--bg-3)'}
                stroke={selected === node.id ? NODE_COLORS[node.type] : 'var(--border)'}
                strokeWidth={selected === node.id ? 2 : 1} />
              <text x={node.x + 12} y={node.y + 18} fontSize="14" dominantBaseline="middle">
                {NODE_ICONS[node.type]}
              </text>
              <text x={node.x + 32} y={node.y + 22} fontSize="11" fill="var(--text)"
                dominantBaseline="middle" fontWeight={selected === node.id ? '600' : '400'}>
                {node.label.length > 10 ? node.label.slice(0, 10) + '…' : node.label}
              </text>
              {/* Connection dot */}
              <circle cx={node.x + 110} cy={node.y + 22} r="5"
                fill={NODE_COLORS[node.type]} stroke="var(--bg)" strokeWidth="2"
                style={{ cursor: 'crosshair' }}
                onClick={e => {
                  e.stopPropagation();
                  if (connecting && connecting !== node.id) { connectNodes(connecting, node.id); setConnecting(null); }
                  else setConnecting(node.id);
                }} />
            </g>
          ))}
        </svg>

        {/* Selected node config */}
        {selected && (() => {
          const node = nodes.find(n => n.id === selected);
          if (!node) return null;
          return (
            <div className="absolute top-4 right-4 w-56 rounded-2xl p-4 animate-slide-up"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>{NODE_ICONS[node.type]}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{node.label}</span>
                </div>
                <button onClick={() => deleteNode(node.id)} className="text-xs" style={{ color: 'var(--red)' }}>
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-3)' }}>Label</label>
                  <input value={node.label}
                    onChange={e => setNodes(prev => prev.map(n => n.id === selected ? { ...n, label: e.target.value } : n))}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'var(--bg-3)', color: 'var(--text)', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-3)' }}>Type</label>
                  <div className="mt-1 text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ background: NODE_COLORS[node.type] + '20', color: NODE_COLORS[node.type] }}>
                    {node.type}
                  </div>
                </div>
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-3)' }}>Connections: {node.connected?.length || 0}</label>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="absolute bottom-4 left-4 text-xs" style={{ color: 'var(--text-3)' }}>
          Drag nodes • Click connector dot to link • Click node to configure
        </div>
      </div>
    </div>
  );
}

// ─── OUTPUT TAB ───────────────────────────────────────────────────────────────
function OutputTab() {
  const [products, setProducts] = useState<OutputProduct[]>([
    {
      id: uid(), type: 'document', title: 'Forge Platform Analysis Report',
      content: `# Forge Platform Analysis\n\n## Executive Summary\nForge is a next-generation AI agent orchestration platform designed for teams that need to deploy, manage, and coordinate multiple AI models simultaneously.\n\n## Key Capabilities\n- **Multilingual Interface**: 12+ languages with real-time translation\n- **Agent Swarm**: Parallel agent execution with ForgeRouter auto-routing\n- **Visual Workflow**: Drag-and-drop process builder\n- **Product Output**: Export to any format\n\n## Market Opportunity\nThe AI agent management market is projected to reach $47B by 2028, growing at 42% CAGR.`,
      format: 'markdown', createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: uid(), type: 'code', title: 'ForgeRouter Integration SDK',
      content: `// ForgeRouter SDK v2\nimport { ForgeRouter } from '@forge/router';\n\nconst router = new ForgeRouter({\n  apiKey: process.env.FORGE_API_KEY,\n  strategy: 'auto', // 'speed' | 'quality' | 'cost' | 'auto'\n});\n\nconst result = await router.complete({\n  prompt: 'Analyze this dataset',\n  agents: ['aria', 'sage'],\n  swarm: true,\n  language: 'en',\n});`,
      format: 'typescript', createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: uid(), type: 'marketing', title: 'Launch Campaign Copy',
      content: `🚀 HEADLINE: "Every Agent. One Platform. Zero Limits."\n\nSUBHEAD: Forge brings your entire AI stack under one roof — route to the best model, automate complex workflows, and ship real products in every language.\n\nCTA: "Start Forging" | "See the Swarm in Action"\n\nKEY MESSAGES:\n• The only platform with true multi-agent swarm intelligence\n• ForgeRouter: 50+ models, 1 API, automatic optimization\n• Multilingual from day one — 12 languages, 7 channels`,
      format: 'text', createdAt: new Date(Date.now() - 1800000),
    },
  ]);
  const [selected, setSelected] = useState(products[0]);
  const [generating, setGenerating] = useState(false);

  const TYPE_ICONS: Record<string, string> = { document: '📄', code: '💻', marketing: '📣', data: '📊', app: '⚡' };
  const TYPE_COLORS: Record<string, string> = { document: '#7c3aed', code: '#3b82f6', marketing: '#ec4899', data: '#10b981', app: '#f59e0b' };

  const generateNew = async (type: OutputProduct['type']) => {
    setGenerating(true);
    await sleep(2000);
    const newProduct: OutputProduct = {
      id: uid(), type,
      title: `Generated ${type} — ${new Date().toLocaleTimeString()}`,
      content: `# Auto-generated ${type}\n\nThis content was produced by the Forge agent swarm using ForgeRouter intelligent routing.\n\nGenerated at: ${new Date().toISOString()}\nAgents used: Aria (Claude), Nova (GPT-4o), Sage (Gemini)\n\nContent goes here...`,
      format: type === 'code' ? 'typescript' : 'markdown', createdAt: new Date(),
    };
    setProducts(prev => [newProduct, ...prev]);
    setSelected(newProduct);
    setGenerating(false);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Products</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Ready-made outputs from your agents</p>
        </div>

        {/* Generate new */}
        <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>Generate new:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(['document', 'code', 'marketing', 'data'] as const).map(type => (
              <button key={type} onClick={() => generateNew(type)}
                disabled={generating}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: 'var(--bg-3)', color: TYPE_COLORS[type], border: `1px solid ${TYPE_COLORS[type]}30` }}>
                {generating ? '...' : TYPE_ICONS[type]} {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {products.map(p => (
            <button key={p.id} onClick={() => setSelected(p)}
              className="w-full text-left p-3 rounded-xl transition-all"
              style={{
                background: selected?.id === p.id ? TYPE_COLORS[p.type] + '15' : 'transparent',
                border: `1px solid ${selected?.id === p.id ? TYPE_COLORS[p.type] + '50' : 'transparent'}`,
              }}>
              <div className="flex items-center gap-2">
                <span className="text-base">{TYPE_ICONS[p.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{p.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {p.createdAt.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected && (
          <>
            <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
              <span className="text-xl">{TYPE_ICONS[selected.type]}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{selected.title}</h3>
                <span className="text-xs" style={{ color: TYPE_COLORS[selected.type] }}>{selected.format}</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Copy', icon: '📋' },
                  { label: 'Export', icon: '⬇️' },
                  { label: 'Share', icon: '📤' },
                  { label: 'Deploy', icon: '🚀' },
                ].map(action => (
                  <button key={action.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                    onClick={() => {
                      if (action.label === 'Copy') navigator.clipboard?.writeText(selected.content);
                    }}>
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono"
                style={{ color: 'var(--text-2)', fontFamily: selected.format === 'markdown' ? 'inherit' : 'monospace' }}>
                {selected.content}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ForgeApp() {
  const [tab, setTab] = useState<Tab>('studio');
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'studio', label: 'Studio', icon: '⚡' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'workflow', label: 'Workflow', icon: '🔀' },
    { id: 'output', label: 'Products', icon: '📦' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <header className="flex items-center px-4 h-12 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-6">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--blue))', color: '#fff' }}>
            F
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>Forge</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--accent-2)', fontSize: '10px' }}>v2</span>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: tab === t.id ? 'var(--accent-2)' : 'var(--text-3)',
                border: `1px solid ${tab === t.id ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
              }}>
              <span className="text-base leading-none">{t.icon}</span>
              <span className="font-medium">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Active agents indicator */}
          <div className="flex items-center gap-1.5">
            {agents.filter(a => a.selected).map(a => (
              <div key={a.id} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: a.color + '30', border: `1px solid ${a.color}60` }} title={a.name}>
                {a.icon}
              </div>
            ))}
          </div>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: 'var(--green)' }} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>ForgeRouter live</span>
          </div>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors"
            style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            ⚙️ Settings
          </button>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            S
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {tab === 'studio' && <StudioTab agents={agents} onAgentsChange={setAgents} />}
        {tab === 'agents' && <AgentsTab agents={agents} onAgentsChange={setAgents} />}
        {tab === 'workflow' && <WorkflowTab />}
        {tab === 'output' && <OutputTab />}
      </main>
    </div>
  );
}
