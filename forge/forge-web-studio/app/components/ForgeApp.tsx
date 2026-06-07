// Forge AI Workspace v6.62 -- ForgeAuto ForgeMulti ForgeASI MVP Builder Intelligence Agent Swarm + React hooks crash fix
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OnboardingFlow } from './OnboardingFlow';

// --- CSS injected once for animations ----------------------------------------
const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  /* -- Taskade-style deep blacks -- */
  --fg-bg:      #080809;
  --fg-bg2:     #0d0d0f;
  --fg-bg3:     #131316;
  --fg-bg4:     #1a1a1e;
  --fg-bg5:     #242428;
  /* -- Forge red — sharper, more saturated -- */
  --fg-orange:  #ff1f35;
  --fg-orange2: #ff4d5e;
  --fg-odim:    rgba(255,31,53,0.12);
  --fg-odim2:   rgba(255,31,53,0.22);
  --fg-border:  rgba(255,255,255,0.06);
  --fg-border2: rgba(255,255,255,0.11);
  --fg-border3: rgba(255,31,53,0.38);
  --fg-text:    #f0f1f5;
  --fg-text2:   #9a9caa;
  --fg-text3:   #5c5e6b;
  --fg-green:   #2ed18a;
  --fg-purple:  #a78bfa;
  --fg-blue:    #60a5fa;
  --fg-red:     #ff1f35;
  --fg-cyan:    #22d3ee;
  --fg-magenta: #ff4ecd;
  --fg-amber:   #ffb020;
  /* -- Taskade-style gradients -- */
  --fg-accent-grad: linear-gradient(135deg,#ff1f35 0%,#ff4d5e 45%,#ff6b35 100%);
  --fg-btn-grad:    linear-gradient(135deg,#ff1f35,#cc1020);
  --fg-btn-grad-hover: linear-gradient(135deg,#ff3347,#e01225);
  --fg-sidebar-w: 52px;
  --fg-sidebar-expanded: 220px;
  --fg-radius-btn: 10px;
  --fg-radius-card: 14px;
  --fg-font-ui: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --fg-font-display: 'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif;
  --fg-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

* { box-sizing: border-box; }

body, #__next {
  background:
    radial-gradient(900px 700px at 0% 100%, rgba(255,31,53,0.09) 0%, transparent 55%),
    radial-gradient(700px 500px at 100% 0%, rgba(255,31,53,0.06) 0%, transparent 50%),
    radial-gradient(600px 400px at 50% 50%, rgba(255,31,53,0.03) 0%, transparent 60%),
    var(--fg-bg) !important;
  background-attachment: fixed !important;
  color: var(--fg-text) !important;
  font-family: var(--fg-font-ui) !important;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility; font-feature-settings: 'ss01','cv01','cv11'; letter-spacing: -0.01em;
}
h1,h2,h3,h4 { font-family: var(--fg-font-display); letter-spacing: -0.02em; font-weight: 700; }
/* Multicolor accent helpers usable anywhere */
.fg-accent-bar { height:3px; background:var(--fg-accent-grad); background-size:200% auto; animation:fg-sheen 6s linear infinite; border-radius:3px; }
.fg-glass { background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)); backdrop-filter: blur(6px); }

::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,31,53,0.35); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,31,53,0.6); }

/* -- Taskade-style pill button global class -- */
.fg-btn-primary {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:9px 20px; border-radius:var(--fg-radius-btn); border:none;
  background:var(--fg-btn-grad); color:#fff; font-size:13px; font-weight:700;
  font-family:var(--fg-font-ui); cursor:pointer; letter-spacing:-0.01em;
  box-shadow:0 0 0 0 rgba(255,31,53,0); transition:all 0.18s ease;
}
.fg-btn-primary:hover {
  background:var(--fg-btn-grad-hover);
  box-shadow:0 0 18px rgba(255,31,53,0.35), 0 4px 12px rgba(0,0,0,0.4);
  transform:translateY(-1px);
}
.fg-btn-secondary {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:8px 18px; border-radius:var(--fg-radius-btn);
  border:1px solid var(--fg-border2); background:var(--fg-bg4); color:var(--fg-text2);
  font-size:13px; font-weight:500; font-family:var(--fg-font-ui); cursor:pointer;
  transition:all 0.15s ease;
}
.fg-btn-secondary:hover { border-color:var(--fg-border3); color:var(--fg-text); background:var(--fg-bg5); }

@keyframes pulse { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }
@keyframes fg-live-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{opacity:.7;box-shadow:0 0 0 5px rgba(34,197,94,0)} }
@keyframes fg-orange-glow { 0%,100%{box-shadow:0 0 0 0 rgba(110,168,255,.35)} 50%{box-shadow:0 0 0 5px rgba(110,168,255,0)} }
@keyframes forge-flash {
  0%,100% { background:var(--fg-orange); box-shadow:0 0 12px rgba(110,168,255,.6); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 20px rgba(176,124,255,.4); }
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
  0%,100% { background:var(--fg-orange); box-shadow:0 0 0 0 rgba(110,168,255,.5); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 0 6px rgba(110,168,255,0); }
}
@keyframes fg-think { 0%,60%,100%{transform:scale(.8);opacity:.3} 30%{transform:scale(1.15);opacity:1} }
@keyframes fg-slide-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes forge-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
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
/* High-end neon brand wordmark — sharp, multicolour, animated */
.forge-neon {
  font-family: 'Space Grotesk','Inter',ui-sans-serif,system-ui,sans-serif;
  font-weight: 700; letter-spacing: -1px;
  animation: neon-cycle 6s linear infinite;
  will-change: color, text-shadow;
}
.forge-neon-dot { animation: neon-cycle 6s linear infinite; will-change: color, text-shadow; }
@keyframes fg-sheen { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
.fg-gradient-text {
  background: linear-gradient(90deg,#ff003c,#ff6600,#ffcc00,#00ff88,#00ccff,#9f4ffa,#ff0099,#ff003c);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; animation: fg-sheen 5s linear infinite;
}
`;

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api';

// --- Code preview helpers (module-level to avoid TSX parser confusion with < chars) --
function extractCodeBlock(content: string): { code: string; isHtml: boolean; lang: string; suggestedFilename: string } | null {
  const fence = '```';
  // Match fenced code block with optional language
  const re = new RegExp(fence + '([a-zA-Z0-9]*)?\\n([\\s\\S]*?)' + fence, 'i');
  const m = content.match(re);
  if (!m) return null;
  const lang = (m[1] || '').toLowerCase().trim();
  const code = m[2].trim();
  if (!code) return null;
  const hasTag = code.includes('<');
  const hasFn = code.includes('function') || code.includes('const ') || code.includes('def ') || code.includes('class ');
  const isHtmlLang = lang === 'html' || lang === 'htm';
  const isHtmlContent = hasTag && (code.includes('DOCTYPE') || code.includes('<html') || code.includes('<div') || code.includes('<body'));
  const isHtml = isHtmlLang || isHtmlContent;
  const isRenderable = isHtml || ['jsx','tsx','react','vue','svelte'].includes(lang) || (hasTag && hasFn);
  if (!isRenderable && !['html','css','js','ts','jsx','tsx','python','py','bash','sh','json','yaml','sql','rust','go','java','cpp','c'].includes(lang)) {
    if (!hasTag && !hasFn) return null;
  }
  // Try to extract suggested filename from "Save as:" hint in message
  const filenameMatch = content.match(/[Ss]ave as[:\s]+[`"]?([^\s`"'\n]+\.[a-z]{2,6})[`"]?/);
  const ext = isHtml ? 'html' : lang === 'python' || lang === 'py' ? 'py' : lang === 'jsx' || lang === 'tsx' ? 'tsx' : lang === 'css' ? 'css' : lang === 'js' || lang === 'ts' ? 'ts' : lang || 'txt';
  const suggestedFilename = filenameMatch ? filenameMatch[1] : `forge-output.${ext}`;
  return { code, isHtml, lang, suggestedFilename };
}
function downloadCode(code: string, filename: string) {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function wrapCodeForPreview(code: string): string {
  const open = '\x3c';
  return open + '!DOCTYPE html>' + open + 'html>' + open + 'head>' + open + 'meta charset="utf-8">' + open + 'style>body{margin:0;font-family:system-ui,sans-serif;background:#fff;padding:16px;}' + open + '/style>' + open + '/head>' + open + 'body>' + code + open + '/body>' + open + '/html>';
}

// --- Syntax highlighter (no deps — inline tokenizer) -------------------------
function syntaxHighlight(code: string, lang: string): string {
  const e = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let c = e(code);
  const kw = lang === 'python' ? /\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|True|False|None|with|as|try|except|finally|raise|pass|break|continue|lambda|yield|async|await|self)\b/g
    : lang === 'sql' ? /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY KEY|FOREIGN KEY|REFERENCES|NOT NULL|DEFAULT|DISTINCT|COUNT|SUM|AVG|MAX|MIN|AS|AND|OR|NOT|IN|LIKE|BETWEEN|NULL|IS|EXISTS|UNION|ALL|LIMIT|OFFSET)\b/gi
    : /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|import|export|default|from|async|await|try|catch|finally|throw|new|this|typeof|instanceof|void|null|undefined|true|false|in|of|type|interface|enum|implements|abstract|readonly|public|private|protected|static|override|declare|namespace|module|require|super|yield|delete|as|is)\b/g;
  c = c.replace(kw, '<span style="color:#c084fc;font-weight:600">$&</span>');
  // Strings
  c = c.replace(/(&#39;[^&#39;]*&#39;|&quot;[^&quot;]*&quot;|`[^`]*`)/g, '<span style="color:#86efac">$&</span>');
  // Numbers
  c = c.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#fbbf24">$&</span>');
  // Comments
  c = c.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$&</span>');
  // Function calls
  c = c.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*\()/g, '<span style="color:#60a5fa">$1</span>$2');
  return c;
}

// --- Slash command definitions ------------------------------------------------
const SLASH_COMMANDS = [
  // Agents
  { cmd:'researcher',  icon:'🔬', label:'Researcher',    desc:'Deep web research on any topic',         category:'agent',   insert:'/researcher ' },
  { cmd:'coder',       icon:'💻', label:'Coder',          desc:'Write, review, or debug code',          category:'agent',   insert:'/coder ' },
  { cmd:'writer',      icon:'✍️', label:'Writer',         desc:'Draft emails, docs, content',            category:'agent',   insert:'/writer ' },
  { cmd:'analyst',     icon:'📊', label:'Analyst',        desc:'Analyze data, create reports',           category:'agent',   insert:'/analyst ' },
  { cmd:'designer',    icon:'🎨', label:'Designer',       desc:'UI/UX critique and mockup ideas',        category:'agent',   insert:'/designer ' },
  // Skills
  { cmd:'summarize',   icon:'📝', label:'Summarize',      desc:'Summarize the current thread',           category:'skill',   insert:'/summarize this conversation' },
  { cmd:'translate',   icon:'🌐', label:'Translate',      desc:'Translate text to another language',     category:'skill',   insert:'/translate to Spanish: ' },
  { cmd:'explain',     icon:'🧠', label:'Explain',        desc:'Explain like I\'m 5',                    category:'skill',   insert:'/explain ' },
  { cmd:'fix',         icon:'🔧', label:'Fix',            desc:'Fix bugs in selected code',              category:'skill',   insert:'/fix this: ' },
  { cmd:'improve',     icon:'⚡', label:'Improve',        desc:'Improve and polish text',                category:'skill',   insert:'/improve: ' },
  // Actions
  { cmd:'new',         icon:'📝', label:'New thread',     desc:'Start a new conversation',               category:'action',  insert:'__NEW_THREAD__' },
  { cmd:'harvest',     icon:'🧠', label:'Harvest memory', desc:'Harvest knowledge into SuperAgent',      category:'action',  insert:'__HARVEST__' },
  { cmd:'clear',       icon:'🗑', label:'Clear input',    desc:'Clear the composer',                     category:'action',  insert:'__CLEAR__' },
  // Modes
  { cmd:'router',      icon:'🔀', label:'ForgeRouter',    desc:'Open model router',                      category:'mode',    insert:'__TAB_router__' },
  { cmd:'super',       icon:'🌟', label:'SuperAgent',     desc:'Open SuperAgent',                        category:'mode',    insert:'__TAB_super__' },
  { cmd:'skills',      icon:'🧩', label:'Skills',         desc:'Browse skills & tools',                  category:'mode',    insert:'__TAB_skills__' },
  { cmd:'billing',     icon:'💳', label:'Billing',        desc:'Open billing panel',                     category:'mode',    insert:'__TAB_billing__' },
];

// --- Render message content — markdown-lite with syntax-highlighted code blocks -
function renderContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Strip raw XML tool_call blocks that leak from agent responses
  const noToolXml = content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g,'').replace(/<tool_name>[\s\S]*?<\/tool_name>/g,'').replace(/<tool_parameters>[\s\S]*?<\/tool_parameters>/g,'').replace(/<\/?(tool_parameter|query|parameter)[^>]*>/g,'').trim();
  // Detect sandbox:/ links and replace with download notice
  const sandboxFixed = noToolXml.replace(/\[([^\]]+)\]\(sandbox:\/[^)]*\)/g, (_, label) =>
    `**[📎 ${label} — use the 💾 Download button above]**`
  );
  const segments = sandboxFixed.split(/(```[\s\S]*?```)/g);
  segments.forEach((seg, si) => {
    if (seg.startsWith('```')) {
      const firstLine = seg.slice(3).split('\n')[0].trim();
      const lang = firstLine.replace(/[^a-zA-Z0-9]/, '') || 'text';
      const code = seg.slice(3 + firstLine.length + 1, -3).trim();
      const highlighted = syntaxHighlight(code, lang.toLowerCase());
      parts.push(
        <div key={`cb-${si}`} style={{ margin:'10px 0', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 10px', background:'rgba(0,0,0,0.4)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize:10, color:'#6b7280', fontFamily:'monospace' }}>{lang}</span>
            <button onClick={() => navigator.clipboard.writeText(code)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:10, padding:'1px 4px' }}>copy</button>
          </div>
          <pre style={{ margin:0, padding:'12px 14px', background:'rgba(0,0,0,0.35)', fontSize:12, fontFamily:'monospace', overflowX:'auto', lineHeight:1.6, color:'#e2e8f0' }}
            dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
      );
      return;
    }
    // Inline markdown: bold, inline code, links
    const lines = seg.split('\n');
    lines.forEach((line, li) => {
      // Headings
      if (line.startsWith('### ')) { parts.push(<h3 key={`h3-${si}-${li}`} style={{ margin:'14px 0 6px', fontSize:14, fontWeight:700, color:'var(--fg-text)', borderBottom:'1px solid var(--fg-border)' }}>{line.slice(4)}</h3>); return; }
      if (line.startsWith('## ')) { parts.push(<h2 key={`h2-${si}-${li}`} style={{ margin:'16px 0 8px', fontSize:16, fontWeight:800, color:'var(--fg-text)' }}>{line.slice(3)}</h2>); return; }
      if (line.startsWith('# ')) { parts.push(<h1 key={`h1-${si}-${li}`} style={{ margin:'18px 0 10px', fontSize:18, fontWeight:800, color:'var(--fg-orange)' }}>{line.slice(2)}</h1>); return; }
      // Horizontal rule
      if (/^---+$/.test(line.trim())) { parts.push(<hr key={`hr-${si}-${li}`} style={{ border:'none', borderTop:'1px solid var(--fg-border)', margin:'12px 0' }} />); return; }
      // Bullet list items
      if (line.startsWith('- ') || line.startsWith('* ')) { parts.push(<div key={`li-${si}-${li}`} style={{ display:'flex', gap:8, marginBottom:2 }}><span style={{ color:'var(--fg-orange)', flexShrink:0 }}>•</span><span>{line.slice(2)}</span></div>); return; }
      if (/^\d+\. /.test(line)) { const m2 = line.match(/^(\d+)\. (.*)/); if(m2) parts.push(<div key={`oli-${si}-${li}`} style={{ display:'flex', gap:8, marginBottom:2 }}><span style={{ color:'var(--fg-orange)', flexShrink:0, minWidth:16 }}>{m2[1]}.</span><span>{m2[2]}</span></div>); return; }
      const nodes: React.ReactNode[] = [];
      // Split on inline code, bold, italic
      const inlineRe = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
      let last = 0; let m;
      while ((m = inlineRe.exec(line)) !== null) {
        if (m.index > last) nodes.push(line.slice(last, m.index));
        const tok = m[0];
        if (tok.startsWith('`')) nodes.push(<code key={`ic-${li}-${m.index}`} style={{ background:'rgba(255,255,255,0.1)', padding:'1px 5px', borderRadius:4, fontSize:'0.9em', fontFamily:'monospace', color:'#86efac' }}>{tok.slice(1,-1)}</code>);
        else if (tok.startsWith('**')) nodes.push(<strong key={`b-${li}-${m.index}`}>{tok.slice(2,-2)}</strong>);
        else nodes.push(<em key={`i-${li}-${m.index}`}>{tok.slice(1,-1)}</em>);
        last = m.index + tok.length;
      }
      if (last < line.length) nodes.push(line.slice(last));
      parts.push(<span key={`ln-${si}-${li}`}>{nodes}{li < lines.length - 1 ? '\n' : ''}</span>);
    });
  });
  return parts;
}

// --- Types --------------------------------------------------------------------
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

// --- API Helper ---------------------------------------------------------------
let _onSessionExpired: (() => void) | null = null;
async function apiFetch(path: string, opts: RequestInit = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const signal = opts.signal ?? (opts.method === 'POST' ? AbortSignal.timeout(60000) : undefined);
  const res = await fetch(`${API}${path}`, { ...opts, headers, ...(signal ? { signal } : {}) });
  if (res.status === 401) {
    const err = await res.json().catch(() => ({}));
    if (err.error === 'AUTHENTICATION_REQUIRED' || err.error === 'INVALID_TOKEN') {
      localStorage.removeItem('forge_user');
      if (_onSessionExpired) _onSessionExpired();
    }
    throw new Error(err.error || 'Session expired. Please log in again.');
  }
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || err.error || `HTTP ${res.status}`); }
  return res.json().catch(() => ({}));
}

// SSE fetch: reads text/event-stream response, returns the payload from the last "result" event.
// Used for /api/threads/:id/messages which uses SSE to keep Railway connection alive.
async function apiFetchSSE(path: string, opts: RequestInit = {}, token?: string, onEvent?: (evt: any) => void): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const signal = opts.signal ?? AbortSignal.timeout(28000);
  const res = await fetch(`${API}${path}`, { ...opts, headers, signal });
  if (res.status === 401) {
    const err = await res.json().catch(() => ({}));
    if (err.error === 'AUTHENTICATION_REQUIRED' || err.error === 'INVALID_TOKEN') {
      localStorage.removeItem('forge_user');
      if (_onSessionExpired) _onSessionExpired();
    }
    throw new Error(err.error || 'Session expired. Please log in again.');
  }
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || err.error || `HTTP ${res.status}`); }
  // Read SSE stream — collect lines, fire callbacks for mid-stream events, return last result
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let lastResult: any = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const evt = JSON.parse(line.slice(6));
        if (evt.type === 'result') lastResult = evt.payload;
        if (onEvent) onEvent(evt);
      } catch {}
    }
  }
  return lastResult ?? {};
}

// --- Constants ----------------------------------------------------------------
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
    { id:'gpt-4.1-mini',label:'GPT-4.1 Mini' },
    { id:'o4-mini',     label:'o4-mini' },
    { id:'o3',          label:'o3' },
    { id:'o3-mini',     label:'o3-mini' },
  ]},
  { group:'Google', models:[
    { id:'gemini-2.5-pro',   label:'Gemini 2.5 Pro' },
    { id:'gemini-2.5-flash', label:'Gemini 2.5 Flash' },
    { id:'gemini-2.5-flash-lite', label:'Gemini 2.5 Flash Lite' },
    { id:'gemini-2.0-flash', label:'Gemini 2.0 Flash' },
    { id:'gemini-2.0-flash-lite', label:'Gemini 2.0 Flash Lite' },
    { id:'gemini-1.5-pro',   label:'Gemini 1.5 Pro' },
    { id:'gemini-1.5-flash', label:'Gemini 1.5 Flash' },
  ]},
  { group:'Groq', models:[
    { id:'llama-3.3-70b',        label:'Llama 3.3 70B' },
    { id:'llama-3.1-8b-instant', label:'Llama 3.1 8B Instant' },
    { id:'llama-3.1-8b',         label:'Llama 3.1 8B' },
    { id:'mixtral-8x7b',         label:'Mixtral 8×7B' },
  ]},
  { group:'Mistral', models:[
    { id:'mistral-large',  label:'Mistral Large' },
    { id:'mistral-small',  label:'Mistral Small' },
    { id:'codestral-latest', label:'Codestral' },
  ]},
  { group:'Anthropic (Legacy)', models:[
    { id:'claude-3-7-sonnet', label:'Claude 3.7 Sonnet' },
    { id:'claude-3-5-sonnet', label:'Claude 3.5 Sonnet' },
    { id:'claude-3-5-haiku',  label:'Claude 3.5 Haiku' },
    { id:'claude-3-opus',     label:'Claude 3 Opus' },
  ]},
  { group:'OpenRouter (400+ models — connect an OpenRouter key for the full live list)', models:[
    { id:'openrouter/anthropic/claude-opus-4.8',        label:'Claude Opus 4.8 (OR)' },
    { id:'openrouter/anthropic/claude-sonnet-4.6',      label:'Claude Sonnet 4.6 (OR)' },
    { id:'openrouter/openai/gpt-5.5',                   label:'GPT-5.5 (OR)' },
    { id:'openrouter/openai/gpt-5.4-mini',              label:'GPT-5.4 Mini (OR)' },
    { id:'openrouter/~google/gemini-flash-latest',      label:'Gemini Flash (latest, OR)' },
    { id:'openrouter/google/gemini-3.5-flash',          label:'Gemini 3.5 Flash (OR)' },
    { id:'openrouter/google/gemini-2.5-flash',          label:'Gemini 2.5 Flash (OR)' },
    { id:'openrouter/deepseek/deepseek-v4-pro',         label:'DeepSeek V4 Pro (OR)' },
    { id:'openrouter/deepseek/deepseek-chat-v3.1',      label:'DeepSeek V3.1 (OR)' },
    { id:'openrouter/meta-llama/llama-4-maverick',      label:'Llama 4 Maverick (OR)' },
    { id:'openrouter/meta-llama/llama-3.3-70b-instruct',label:'Llama 3.3 70B (OR)' },
    { id:'openrouter/qwen/qwen3.7-max',                 label:'Qwen 3.7 Max (OR)' },
    { id:'openrouter/x-ai/grok-4.3',                    label:'Grok 4.3 (OR)' },
    { id:'openrouter/mistralai/mistral-medium-3-5',     label:'Mistral Medium 3.5 (OR)' },
  ]},
];

// --- Login Screen -------------------------------------------------------------
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
          <h1 className="forge-neon" style={{ fontSize:30, margin:0 }}>Forge</h1>
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

// --- Main App -----------------------------------------------------------------
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
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'|'info'}|null>(null);
  const showToast = (msg: string, type: 'ok'|'err'|'info' = 'ok') => { setToast({msg,type}); setTimeout(()=>setToast(null), 3500); };
  const [openRouterModels, setOpenRouterModels] = useState<{id:string;name:string;context_length?:number;pricing?:{prompt:string;completion:string}}[]>([]);

  // Selection
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);

  // Main tab
  const [mainTab, setMainTab] = useState<'workspace'|'router'|'billing'|'platforms'|'settings'|'admin'|'super'|'forgeauto'|'forgemulti'|'forgeco'|'forgeasi'|'skills'|'files'|'hooks'|'runs'|'mvp'|'intelligence'|'swarm'|'desktop'|'marketplace'>('workspace');
  // Desktop app integration
  const isDesktop = typeof window !== 'undefined' && !!(window as any).forgeDesktop;
  const [desktopFolders, setDesktopFolders] = useState<string[]>([]);
  const [desktopFileTree, setDesktopFileTree] = useState<any[]>([]);
  const [desktopMemory, setDesktopMemory] = useState<Record<string, any>>({});
  const [desktopBrowserCtx, setDesktopBrowserCtx] = useState<{ url: string; title: string; text: string } | null>(null);

  // Right panel tabs
  const [rightTab, setRightTab] = useState<'tracker'|'agents'|'artifacts'|'tasks'|'schedule'|'dispatch'|'live'|'context'|'browser'|'terminal'|'agent'|'tools'|'hooks'|'runs'>(() => {
    try { return (localStorage.getItem('forge_right_tab') as any) || 'tracker'; } catch { return 'tracker'; }
  });
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  useEffect(() => {
    const check = () => { const m = window.innerWidth < 768; setIsMobile(m); if (m) setSidebarExpanded(false); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [rightExpanded, setRightExpanded] = useState(() => {
    try { return localStorage.getItem('forge_right_expanded') !== 'false'; } catch { return true; }
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    setShowOnboarding(localStorage.getItem('forge_onboarding_done') !== 'true');
  }, []);
  useEffect(() => {
    try { localStorage.setItem('forge_right_tab', rightTab); } catch {}
  }, [rightTab]);
  useEffect(() => {
    try { localStorage.setItem('forge_right_expanded', rightExpanded ? 'true' : 'false'); } catch {}
  }, [rightExpanded]);

  // Desktop app: load state + listen for browser events from Chrome extension
  useEffect(() => {
    if (!isDesktop) return;
    const fd = (window as any).forgeDesktop;
    fd.getOpenFolders().then((folders: string[]) => {
      setDesktopFolders(folders);
      if (folders.length > 0) fd.getTree(folders[0]).then((tree: any[]) => setDesktopFileTree(tree)).catch(() => {});
    }).catch(() => {});
    fd.memoryGet().then((mem: any) => setDesktopMemory(mem || {})).catch(() => {});
    const cleanup = fd.onBrowserEvent((evt: any) => {
      if (evt.type === 'page-context' || evt.type === 'page-content' || evt.type === 'selection') {
        setDesktopBrowserCtx({ url: evt.url || '', title: evt.title || '', text: evt.text || evt.selection || '' });
      }
    });
    return cleanup;
  }, [isDesktop]);

  // Composer
  const [input, setInput] = useState('');
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIdx, setSlashIdx] = useState(0);
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => { try { return localStorage.getItem('forge_selected_model') || ''; } catch { return ''; } }); // persisted to localStorage
  const isFreeModel = (m: any) => !m ? false : (typeof m === 'string' ? m.includes(':free') : (m.id?.includes(':free') || m.pricing?.prompt === '0' || m.pricing?.prompt === '0.0'));
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [agentSteps, setAgentSteps] = useState<{icon:string;text:string;ts:number}[]>([]);
  const agentStepsRef = useRef<{icon:string;text:string;ts:number}[]>([]);
  const addAgentStep = (icon: string, text: string) => {
    setAgentSteps(prev => { const next = [...prev.slice(-20), { icon, text, ts: Date.now() }]; agentStepsRef.current = next; return next; });
    // Auto-add to Progress Tracker as a numbered step (crossed off when done)
    const stepText = `${icon} ${text}`;
    const newItem = { id: `step_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, text: stepText, done: false, priority: 'medium' as const, createdAt: Date.now() };
    setTrackerItems(prev => {
      // Keep tracker to last 20 auto-steps to avoid flooding
      const filtered = prev.filter(i => !i.id.startsWith('step_') || prev.filter(x=>x.id.startsWith('step_')).indexOf(i) >= (prev.filter(x=>x.id.startsWith('step_')).length - 19));
      const updated = [...filtered, newItem];
      try { localStorage.setItem('forge_tracker', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };
  const completeTrackerStep = (stepText: string) => {
    setTrackerItems(prev => {
      const updated = prev.map(i => i.text === stepText ? { ...i, done: true } : i);
      try { localStorage.setItem('forge_tracker', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };
  const [lastThinkingSteps, setLastThinkingSteps] = useState<{icon:string;text:string;ts:number}[]>([]);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [multiResponse, setMultiResponse] = useState(false);
  const [multiResponses, setMultiResponses] = useState<{model:string; content:string}[]>([]);
  // Tool calls captured during the current SSE stream — map of msgId -> tool call list
  const [liveToolCalls, setLiveToolCalls] = useState<Array<{tool:string;args:any;result:string;ts:number}>>([]);
  const [expandedTools, setExpandedTools] = useState<Record<number,boolean>>({});
  // Clarification question from AI
  const [clarifyQuestion, setClarifyQuestion] = useState<{question:string; options:string[]} | null>(null);

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
  const [threadStats, setThreadStats] = useState<{ total_tokens:number; message_count:number; token_history:{tokens:number;created_at:string;model?:string|null;role?:string}[]; model_breakdown?:{model:string;provider:string;requests:number;prompt_tokens:number;completion_tokens:number;total_tokens:number;cost:number}[]; recent_calls?:{model:string;provider:string;prompt_tokens:number;completion_tokens:number;total_tokens:number;provider_cost:number;created_at:string}[] }|null>(null);
  const [projectMenu, setProjectMenu] = useState<{ projectId:string; x:number; y:number } | null>(null);
  const [renamingProject, setRenamingProject] = useState<{ id:string; name:string } | null>(null);
  const [showAllThreads, setShowAllThreads] = useState(false);

  // Navbar token total + session cost
  const [totalTokens, setTotalTokens] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  // ForgeOptimizer
  const [optimizerEnabled, setOptimizerEnabled] = useState(true);
  const [optimizerData, setOptimizerData] = useState<{totalTokens:number;potentialSavings:number;savingsPct:number;estimatedCost:string;savedCost:string;suggestions:Array<{type:string;title:string;description:string;tokenSavings:number;auto:boolean}>;autoApplyCount:number}|null>(null);
  const [optimizerRunning, setOptimizerRunning] = useState(false);
  const [optimizerOpen, setOptimizerOpen] = useState(false);
  // Provider balances
  const [providerBalances, setProviderBalances] = useState<Record<string,{label:string;balance:number|null}>>({});
  // Q&A interrupt
  const [agentQuestion, setAgentQuestion] = useState<{question:string;resolve:(a:string)=>void}|null>(null);
  const [agentAnswer, setAgentAnswer] = useState('');

  // SuperAgent
  const [superInput, setSuperInput] = useState('');
  const [superMessages, setSuperMessages] = useState<{role:string;content:string}[]>([]);
  const [superSending, setSuperSending] = useState(false);
  const [superMemory, setSuperMemory] = useState<SuperMemory[]>([]);
  const [superHarvesting, setSuperHarvesting] = useState(false);
  const [superTab, setSuperTab] = useState<'chat'|'memory'>('chat');
  const [superStats, setSuperStats] = useState<{memoryCount:number;intelligenceScore:number;threadCount:number}>({memoryCount:0,intelligenceScore:0,threadCount:0});
  const [superMode, setSuperMode] = useState<'forgeAsk'|'forgeMagic'>('forgeAsk');
  const [language, setLanguage] = useState('en');
  const [renamingThreadInput, setRenamingThreadInput] = useState('');
  const [showRunsScheduler, setShowRunsScheduler] = useState(false);
  const [runsSchedule, setRunsSchedule] = useState<{id:string;name:string;prompt:string;cron:string;enabled:boolean;lastRun?:string}[]>([]);
  const [newRunName, setNewRunName] = useState('');
  const [newRunPrompt, setNewRunPrompt] = useState('');
  const [newRunCron, setNewRunCron] = useState('0 9 * * 1-5');
  const [showAskModal, setShowAskModal] = useState(false);
  const [pendingAskMessage, setPendingAskMessage] = useState('');
  const [showConnectModal, setShowConnectModal] = useState<{id:string;name:string;icon:string;desc:string;setupUrl?:string;envKey?:string} | null>(null);
  const [selectedAskSkills, setSelectedAskSkills] = useState<Set<string>>(new Set());
  const [selectedAskConnectors, setSelectedAskConnectors] = useState<Set<string>>(new Set());
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
  const [multiLiveAgents, setMultiLiveAgents] = useState<{role:string;icon:string;content:string|null;elapsed:number|null;done:boolean}[]>([]);
  const [multiStartTime, setMultiStartTime] = useState<number>(0);
  // Chat folder actions (hoisted — can't use useState inside render IIFE)
  const [pinnedThreads, setPinnedThreads] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('forge_pinned_threads')||'[]')); } catch { return new Set(); }
  });
  const [folderRenamingId, setFolderRenamingId] = useState<string|null>(null);
  const [folderRenameVal, setFolderRenameVal] = useState('');
  // ForgeCO hoisted state
  const [forgecoTab, setForgecoTab] = useState<'team'|'projects'|'docs'|'chat'>('team');
  const [forgecoChatMsg, setForgecoChatMsg] = useState('');
  const [forgecoChatLog, setForgecoChatLog] = useState<{from:string;text:string;ts:number}[]>([
    { from:'Sarah Kim', text:'Just pushed the new onboarding flow — ready for review!', ts:Date.now()-3600000 },
    { from:'Alex Chen', text:'On it, will check after standup', ts:Date.now()-1800000 },
    { from:'Forge AI', text:'Reminder: Platform v2.0 sprint ends Friday. 3 tasks still open.', ts:Date.now()-600000 },
  ]);
  // Hooks panel hoisted state
  const [builtinEnabled, setBuiltinEnabled] = useState<Record<string,boolean>>({'bh_memory':true,'bh_tools':true,'bh_sysprompt':false,'bh_connector':false,'bh_context':false});

  const [autoFeatEnabled, setAutoFeatEnabled] = React.useState<Record<string,boolean>>({'Smart Model Select':true,'Chain of Thought':true,'Self-Correction':false,'Parallel Execution':true,'Goal Tracking':false,'Auto Memory':true});
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

  // MVP Builder state
  const [mvpIdea, setMvpIdea] = useState('');
  const [mvpIndustry, setMvpIndustry] = useState('');
  const [mvpTarget, setMvpTarget] = useState('');
  const [mvpBuilding, setMvpBuilding] = useState(false);
  const [mvpResult, setMvpResult] = useState<{spec:string;stack:string;roadmap:string;pitch:string}|null>(null);
  const [mvpPhase, setMvpPhase] = useState('');

  // Intelligence (Context Graph) state
  const [igNodes, setIgNodes] = useState<{id:string;label:string;type:string;weight:number}[]>([]);
  const [igQuery, setIgQuery] = useState('');
  const [igLoading, setIgLoading] = useState(false);

  // Agent Swarm state
  const [swarmTask, setSwarmTask] = useState('');
  const [swarmAgentCount, setSwarmAgentCount] = useState(5);
  const [swarmRunning, setSwarmRunning] = useState(false);
  const [swarmResults, setSwarmResults] = useState<{agentId:string;role:string;result:string;tokens:number;done:boolean}[]>([]);
  const [swarmSynthesis, setSwarmSynthesis] = useState('');

  // Skills & Tools state (must be top-level — not inside render IIFE)
  const [skillSearch, setSkillSearch] = useState('');
  const [toolSubTab, setToolSubTab] = useState<'skills'|'tools'>('skills');
  const [forgeTools, setForgeTools] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [marketplaceCat, setMarketplaceCat] = useState('All');
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [threadSearch, setThreadSearch] = useState('');
  const [skillCat, setSkillCat] = useState('All');
  const [activeSkills, setActiveSkills] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('forge_active_skills'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const [activeConnectors, setActiveConnectors] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('forge_active_connectors'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const [activeSkillPrompt, setActiveSkillPrompt] = useState('');
  const [activeAgentId, setActiveAgentId] = useState<string|null>(null);
  const [genTopic, setGenTopic] = useState('');
  const [genIndustry, setGenIndustry] = useState('');
  const [genGoal, setGenGoal] = useState('');
  const [genResult, setGenResult] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [toolVisibility, setToolVisibility] = useState<Array<{tool:string; status:'running'|'done'|'error'; input?:string; output?:string}>>([]);

  // Active tools toggles (shown in right panel Tools tab + wired into chat sends)
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set(['web_search','run_code']));
  const toggleTool = (t: string) => setActiveTools(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });

  // Hooks state (persisted locally + synced with backend when available)
  const [hooks, setHooks] = useState<{id:string;event:string;action:string;target:string;enabled:boolean}[]>([]);
  const [hookForm, setHookForm] = useState({event:'on_message',action:'post_slack',target:''});
  const [showHookFormPanel, setShowHookFormPanel] = useState(false);
  const addHook = () => {
    if (!hookForm.target.trim()) return;
    setHooks(prev => [...prev, { id: Date.now().toString(), event: hookForm.event, action: hookForm.action, target: hookForm.target.trim(), enabled: true }]);
    setHookForm({event:'on_message',action:'post_slack',target:''});
    setShowHookFormPanel(false);
  };
  const toggleHook = (id: string) => setHooks(prev => prev.map(h => h.id === id ? {...h, enabled: !h.enabled} : h));
  const deleteHook = (id: string) => setHooks(prev => prev.filter(h => h.id !== id));

  // Progress Tracker state
  const [trackerItems, setTrackerItems] = useState<{id:string;text:string;done:boolean;priority:'high'|'medium'|'low';createdAt:number;folderId?:string|null}[]>(() => {
    try { return JSON.parse(localStorage.getItem('forge_tracker') || '[]'); } catch { return []; }
  });
  const [trackerInput, setTrackerInput] = useState('');
  const [showTrackerArchive, setShowTrackerArchive] = useState(false);
  const [trackerEditId, setTrackerEditId] = useState<string|null>(null);
  const [trackerEditText, setTrackerEditText] = useState('');
  const saveTracker = (items: typeof trackerItems) => { setTrackerItems(items); try { localStorage.setItem('forge_tracker', JSON.stringify(items)); } catch {} };
  // Tracker is scoped to active thread — empty when no chat selected
  const visibleTrackerItems = activeThread?.id
    ? trackerItems.filter(i => !i.folderId || i.folderId === activeThread.id)
    : [];
  const archivedTrackerItems = visibleTrackerItems.filter(i => i.done);
  const activeTrackerItems = visibleTrackerItems.filter(i => !i.done).slice(0, 5);
  const addTrackerItem = () => {
    if (!trackerInput.trim()) return;
    const item = { id: Date.now().toString(), text: trackerInput.trim(), done: false, priority: 'medium' as const, createdAt: Date.now(), folderId: activeThread?.id || null };
    saveTracker([...trackerItems, item]);
    setTrackerInput('');
  };

  // Chat inactivity tracking for 6h warning / 24h delete
  const chatLastActiveRef = useRef<Record<string, number>>({});
  const [inactiveWarnings, setInactiveWarnings] = useState<Set<string>>(new Set());
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newWarnings = new Set<string>();
      Object.entries(chatLastActiveRef.current).forEach(([threadId, lastActive]) => {
        const hoursInactive = (now - lastActive) / (1000 * 60 * 60);
        if (hoursInactive >= 6) newWarnings.add(threadId);
      });
      setInactiveWarnings(newWarnings);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Files state — files belong to the ACTIVE folder (thread); switching folders reloads its files
  const [files, setFiles] = useState<{id:string;name:string;size:number;type:string;created_at:string}[]>([]);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const loadFolderFiles = useCallback(async () => {
    if (!user) return;
    try {
      const q = activeThread?.id ? `?thread_id=${activeThread.id}` : '';
      const r = await apiFetch(`/userfiles${q}`, {}, user.token);
      const rows = (r.data || []).map((f: any) => ({ id: f.id, name: f.filename, size: f.size || 0, type: f.mime_type || 'text/plain', created_at: f.created_at }));
      setFiles(rows);
    } catch { /* keep current list if endpoint unavailable */ }
  }, [user, activeThread?.id]);
  useEffect(() => { loadFolderFiles(); }, [loadFolderFiles]);
  const uploadFile = async (file: File) => {
    if (!user) return;
    const entry = { id: Date.now().toString(), name: file.name, size: file.size, type: file.type || 'application/octet-stream', created_at: new Date().toISOString() };
    setFiles(prev => [...prev, entry]);
    // Backend upload when endpoint exists
    try {
      const fd = new FormData(); fd.append('file', file);
      await fetch(`${API}/files`, { method:'POST', headers:{ Authorization:`Bearer ${user.token}` }, body: fd });
    } catch { /* store locally if backend not ready */ }
  };

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
    'claude-sonnet-4': 200000, 'claude-opus-4': 200000, 'claude-haiku-4': 200000,
    'gpt-4o': 128000, 'gpt-4o-mini': 128000, 'o3': 200000, 'o4-mini': 200000, 'gpt-4-turbo': 128000,
    'gemini-2.0-flash': 1048576, 'gemini-2.5-pro': 2097152, 'gemini-2.5-flash': 1048576, 'gemini-1.5-pro': 2097152, 'gemini-1.5-flash': 1048576,
    'llama-3.1-8b-instant': 128000, 'llama-3.3-70b-versatile': 128000, 'mistral-small-latest': 32000, 'mistral-large-latest': 128000,
    // Common OpenRouter models
    'deepseek/deepseek-chat-v3-0324': 64000, 'deepseek/deepseek-r1': 64000, 'deepseek/deepseek-r1-distill-llama-70b': 128000,
    'meta-llama/llama-3.1-8b-instruct': 128000, 'meta-llama/llama-3.3-70b-instruct': 128000,
    'qwen/qwen-2.5-72b-instruct': 128000, 'mistralai/mistral-small-3.1-24b-instruct': 128000,
    'google/gemini-2.0-flash-001': 1048576, 'google/gemini-2.5-pro-preview-05-06': 2097152,
    'anthropic/claude-sonnet-4-5': 200000, 'anthropic/claude-opus-4-5': 200000,
    'openai/gpt-4o': 128000, 'openai/gpt-4o-mini': 128000,
  };
  const getContextLimit = (model: string) => {
    if (!model) return 128000;
    // Direct lookup
    if (MODEL_CONTEXT_LIMITS[model]) return MODEL_CONTEXT_LIMITS[model];
    // Strip openrouter/ prefix and try again
    const stripped = model.startsWith('openrouter/') ? model.slice('openrouter/'.length) : model;
    if (MODEL_CONTEXT_LIMITS[stripped]) return MODEL_CONTEXT_LIMITS[stripped];
    // Try openRouterModels list (has live context_length from API)
    const orModel = openRouterModels.find(m => m.id === stripped || m.id === model);
    if (orModel?.context_length && orModel.context_length > 0) return orModel.context_length;
    // Pattern-based fallback
    if (stripped.includes('deepseek')) return 64000;
    if (stripped.includes('gemini-2.5-pro')) return 2097152;
    if (stripped.includes('gemini')) return 1048576;
    if (stripped.includes('claude')) return 200000;
    if (stripped.includes('gpt-4')) return 128000;
    if (stripped.includes('llama-3')) return 128000;
    if (stripped.includes('qwen')) return 128000;
    if (stripped.includes('mistral')) return 32000;
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
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // -- Inject global animation styles once -----------------------------------
  useEffect(() => {
    const id = 'forge-global-styles';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = GLOBAL_STYLES;
      document.head.appendChild(s);
    }
    // Wake Railway backend on mount so it's warm when user sends first message
    fetch(`${API.replace('/api', '')}/health`, { signal: AbortSignal.timeout(10000) }).catch(() => {});
  }, []);

  // -- Auth -------------------------------------------------------------------
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

  // Keep ForgeMulti and ForgeASI models in sync with the main model picker
  useEffect(() => { setMultiModel(selectedModel); }, [selectedModel]);
  useEffect(() => { if (selectedModel) setAsiModel(selectedModel); }, [selectedModel]);
  // Pre-select active model in ForgeAuto when selectedModel changes
  useEffect(() => { if (selectedModel) setAutoSelectedModels(prev => prev.includes(selectedModel) ? prev : [selectedModel, ...prev]); }, [selectedModel]);
  // Persist selected model to localStorage so it survives page reloads and race conditions
  useEffect(() => { if (selectedModel) { try { localStorage.setItem('forge_selected_model', selectedModel); } catch {} } }, [selectedModel]);

  // Build flat list of active models for ForgeASI/Multi/Auto selectors
  const getActiveModels = (): {id:string; label:string}[] => {
    const out: {id:string; label:string}[] = [];
    // Forge-aliased models (require anthropic key)
    if (savedProviders['anthropic']) {
      out.push({ id:'forge-pro', label:'⚡ Forge Pro' }, { id:'forge-flash', label:'⚡ Forge Flash' });
    }
    // Direct provider models
    const DIRECT_MAP: Record<string, {id:string;label:string}[]> = {
      anthropic: [{ id:'claude-sonnet-4-6', label:'Claude Sonnet 4.6' }, { id:'claude-opus-4', label:'Claude Opus 4' }, { id:'claude-haiku-4-5', label:'Claude Haiku 4.5' }],
      openai:    [{ id:'gpt-4o', label:'GPT-4o' }, { id:'gpt-4o-mini', label:'GPT-4o Mini' }, { id:'o3', label:'o3' }],
      gemini:    [{ id:'gemini-2.5-pro', label:'Gemini 2.5 Pro' }, { id:'gemini-2.0-flash', label:'Gemini 2.0 Flash' }],
      groq:      [{ id:'llama-3.3-70b-versatile', label:'Llama 3.3 70B' }, { id:'llama-3.1-8b-instant', label:'Llama 3.1 8B' }],
      mistral:   [{ id:'mistral-large-latest', label:'Mistral Large' }, { id:'mistral-small-latest', label:'Mistral Small' }],
    };
    Object.entries(DIRECT_MAP).forEach(([p, models]) => {
      if (savedProviders[p]) models.forEach(m => out.push(m));
    });
    // Dynamic provider models
    Object.entries(providerModels).forEach(([p, models]) => {
      if (p === 'openrouter' || !savedProviders[p]) return;
      models.slice(0, 5).forEach(m => {
        if (!out.find(x => x.id === m.id)) out.push({ id: m.id, label: m.name || m.id });
      });
    });
    // OpenRouter top models
    if (savedProviders['openrouter'] && openRouterModels.length > 0) {
      openRouterModels.slice(0, 8).forEach(m => out.push({ id: m.id, label: m.name || m.id }));
    }
    // Fallback if nothing is configured
    if (out.length === 0) out.push({ id:'forge-pro', label:'Forge Pro (add API key in Settings)' });
    return out;
  };

  useEffect(() => {
    if (!user) return;
    loadProjects(); loadAgents(); loadTasks(); loadArtifacts();
    loadDispatchRuns(); loadSchedules(); loadThreads();
    loadCustomProviders(); loadUsageLogs(); loadSubscription();

  const loadForgeTools = async () => {
    if (!user?.token) return;
    try { const d = await apiFetch('/forge-tools', {}, user.token); setForgeTools(d.tools || []); } catch {}
  };
  const loadMarketplace = async () => {
    try { const d = await apiFetch('/marketplace/items', {}, user?.token || ''); setMarketplaceItems(d.items || []); } catch {}
  };
  const toggleForgeTool = async (id: string, enabled: boolean) => {
    if (!user?.token) return;
    try { await apiFetch(`/forge-tools/${id}`, { method:'PATCH', body: JSON.stringify({ enabled }) }, user.token); loadForgeTools(); } catch {}
  };

    loadForgeTools(); loadMarketplace();
    loadApiKeys(); loadVault(); // loadOpenRouterModels called inside loadApiKeys only when OR key confirmed
    loadTotalTokens(); loadSuperMemory(); loadSuperHistory();
  }, [user]);

  useEffect(() => { if (!userScrolledUp) messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, userScrolledUp]);
  useEffect(() => { if (sending) { setUserScrolledUp(false); messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); } }, [sending]);
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
        // Feed thinking/tool events directly into the Manus agent steps panel
        if (data.type === 'thinking' || data.type === 'tool' || data.type === 'start') {
          const icon = data.type === 'start' ? '🚀' : data.type === 'tool' ? '🔧' : '💭';
          addAgentStep(icon, data.message || '');
        }
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
          const newEvs = (d.data as any[]).filter((e: any) => e.ts > lastTs);
          if (newEvs.length) {
            // Feed new thinking/tool steps into the Manus panel
            newEvs.forEach((e: any) => {
              if (e.type === 'thinking' || e.type === 'tool' || e.type === 'start') {
                const icon = e.type === 'start' ? '🚀' : e.type === 'tool' ? '🔧' : '💭';
                addAgentStep(icon, e.message || '');
              }
            });
            setLiveEvents(prev => {
              const merged = [...newEvs, ...prev].filter((e,i,a) => a.findIndex(x => x.ts === e.ts) === i);
              return merged.slice(0, 100);
            });
            lastTs = Math.max(...newEvs.map((e:any) => e.ts));
          }
        }
      } catch {}
    }, 3000);
    return () => { es.close(); clearInterval(poll); };
  }, [user]);


  // -- Data loaders -----------------------------------------------------------
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
  const loadUsageLogs = async () => { if (!user) return; try { const d = await apiFetch('/billing/usage', {}, user.token); const rows = Array.isArray(d?.data) ? d.data : Array.isArray(d?.logs) ? d.logs : []; setUsageLogs(rows.map((r:any) => ({ id: r.id||String(Math.random()), model: r.model||'unknown', tokens_in: r.tokens_in||r.total_tokens||0, tokens_out: r.tokens_out||0, cost_usd: r.cost_usd||r.provider_cost||0, markup_usd: r.markup_usd||r.forge_revenue||0, created_at: r.created_at }))); } catch {} };
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
      // Fetch OR models — uses user key if saved, else returns public list (400+ models always available)
      const d = await apiFetch('/keys/openrouter-models', {}, user.token);
      const models = Array.isArray(d?.data?.models) ? d.data.models : [];
      if (!models.length) { setOrLoading(false); return; }
      setOpenRouterModels(models);
      // Auto-select a reliable paid OR model if no valid model currently selected
      setSelectedModel(prev => {
        const isFreeModel = (m: any) => m.id.includes(':free') || m.pricing?.prompt === '0' || m.pricing?.prompt === '0.0';
        if (!prev || prev.endsWith(':free') || prev === '') {
          // Prefer genuinely paid models — free models (by id or pricing) rate-limit even with your own key
          const preferred =
            models.find((m: any) => m.id === 'deepseek/deepseek-chat-v3-0324')
            || models.find((m: any) => m.id === 'mistralai/mistral-small-3.2-24b-instruct')
            || models.find((m: any) => m.id === 'mistralai/mistral-7b-instruct' && !isFreeModel(m))
            || models.find((m: any) => !isFreeModel(m));
          return preferred?.id || 'deepseek/deepseek-chat-v3-0324';
        }
        // Also replace if current selection is a free-priced model
        const currentModel = models.find((m: any) => m.id === prev || m.id === prev.replace('openrouter/', ''));
        if (currentModel && isFreeModel(currentModel)) {
          const preferred = models.find((m: any) => m.id === 'deepseek/deepseek-chat-v3-0324') || models.find((m: any) => !isFreeModel(m));
          return preferred?.id || prev;
        }
        return prev;
      });
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
      // Always load OR models (public list available even without key; key gives full access)
      loadOpenRouterModels();
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
        if (confirmed['openrouter']) return (prev && !prev.endsWith(':free')) ? prev : 'deepseek/deepseek-chat-v3-0324'; // prefer paid model — free models rate-limit even with own key
        // No keys at all — leave empty so UI shows the warning
        return '';
      });
    } catch {}
  };
  const loadVault = async () => {
    if (!user) return;
    try { const d = await apiFetch('/keys/vault', {}, user.token); setVaultKeys(Array.isArray(d?.data) ? d.data : []); } catch {}
  };
  const fetchProviderBalances = async () => {
    if (!user) return;
    const providers = ['openrouter','anthropic','openai','groq','gemini','mistral'];
    const results: Record<string,{label:string;balance:number|null}> = {};
    await Promise.allSettled(providers.map(async p => {
      try {
        const d = await apiFetch(`/keys/${p}/balance`, {}, user.token);
        if (d?.success !== false) results[p] = { label: d?.label || 'valid', balance: d?.balance ?? null };
      } catch {}
    }));
    setProviderBalances(results);
  };

  const runForgeOptimizer = async (threadId?: string, autoApply = false) => {
    const tid = threadId || activeThread?.id;
    if (!user || !tid) return;
    setOptimizerRunning(true);
    try {
      const d = await apiFetch(`/forge-optimizer/${tid}/analyze`, {}, user.token);
      if (d?.data) {
        setOptimizerData(d.data);
        setOptimizerOpen(true);
        if (autoApply && d.data.autoApplyCount > 0 && d.data.savingsPct >= 30) {
          // Auto-apply if savings > 30%
          const r = await apiFetch(`/forge-optimizer/${tid}/apply`, { method:'POST' }, user.token);
          if (r?.data?.message) showToast(r.data.message);
          await loadMessages(tid);
          await loadThreadTokenStats(tid);
          setOptimizerData(null); // reset to re-analyze
        }
      }
    } catch (e:any) { showToast('Optimizer error: '+String(e?.message||e),'err'); }
    finally { setOptimizerRunning(false); }
  };

  const applyForgeOptimizer = async () => {
    const tid = activeThread?.id;
    if (!user || !tid) return;
    setOptimizerRunning(true);
    try {
      const r = await apiFetch(`/forge-optimizer/${tid}/apply`, { method:'POST' }, user.token);
      if (r?.data?.message) showToast(r.data.message);
      await loadMessages(tid);
      await loadThreadTokenStats(tid);
      setOptimizerData(null);
      setOptimizerOpen(false);
      await runForgeOptimizer(tid); // re-analyze
    } catch (e:any) { showToast('Apply failed: '+String(e?.message||e),'err'); }
    finally { setOptimizerRunning(false); }
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
    try { const d = await apiFetch('/superagent/history', {}, user.token); setSuperMessages(Array.isArray(d?.data) ? d.data.map((m:any) => ({ role:m.role, content:m.content||'' })).filter((m:any)=>m.content) : []); } catch {}
  };
  const loadThreadTokenStats = async (threadId: string) => {
    if (!user) return;
    try { const d = await apiFetch(`/threads/${threadId}/stats`, {}, user.token); if (d?.success) setThreadStats(d.data); } catch {}
  };

  // -- Admin loaders ----------------------------------------------------------
  const loadAdminStats   = async () => { if (!user) return; try { const d = await apiFetch('/admin/stats', {}, user.token); setAdminStats(d?.data || d); } catch {} };
  const loadAdminUsers   = async () => { if (!user) return; try { const d = await apiFetch('/admin/users', {}, user.token); setAdminUsers(unwrap(d)); } catch {} };
  const loadAdminKeys    = async () => { if (!user) return; try { const d = await apiFetch('/admin/platform-keys', {}, user.token); setAdminPlatformKeys(unwrap(d)); } catch {} };
  const loadAdminModels  = async () => { if (!user) return; try { const d = await apiFetch('/admin/models', {}, user.token); setAdminModels(unwrap(d)); } catch {} };

  const saveAdminKey = async (provider: string) => {
    if (!user) return;
    const key = adminKeyInputs[provider]?.trim();
    if (!key) { showToast('Please enter a key first.','info'); return; }
    setAdminSaving(provider);
    try {
      await apiFetch('/admin/platform-keys', { method:'POST', body:JSON.stringify({ provider, key }) }, user.token);
      setAdminKeyInputs(prev => ({ ...prev, [provider]: '' }));
      await loadAdminKeys();
    } catch (e: any) { showToast(`Failed: ${e?.message||e}`,'err'); }
    finally { setAdminSaving(''); }
  };

  const deleteAdminKey = async (provider: string) => {
    if (!user || !confirm(`Remove platform key for ${provider}?`)) return;
    try { await apiFetch(`/admin/platform-keys/${provider}`, { method:'DELETE' }, user.token); await loadAdminKeys(); } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  const toggleAdminModel = async (modelId: string, enabled: boolean) => {
    if (!user) return;
    try {
      await apiFetch(`/admin/models/${modelId}`, { method:'PATCH', body:JSON.stringify({ enabled: enabled ? 1 : 0 }) }, user.token);
      setAdminModels(prev => prev.map(m => m.id === modelId ? { ...m, enabled: enabled ? 1 : 0 } : m));
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  const changeUserRole = async (userId: string, role: string) => {
    if (!user) return;
    try {
      await apiFetch(`/admin/users/${userId}`, { method:'PATCH', body:JSON.stringify({ role }) }, user.token);
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  // -- Save a single provider's API key --------------------------------------
  const saveOneKey = async (provider: string, key: string) => {
    if (!user) return;
    const trimmed = key.trim();
    if (!trimmed) { showToast('Please paste a key first.','info'); return; }
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
      showToast(`Save failed: ${e?.message||String(e)}`,'err');
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
    if (!Object.keys(body).length) { showToast('No key to save.','info'); return; }
    try {
      await apiFetch('/keys', { method:'POST', body:JSON.stringify(body) }, user.token);
      setKeysSaved(true); setTimeout(() => setKeysSaved(false), 3000);
      await loadApiKeys();
    } catch (e: any) { showToast(`Save failed: ${e?.message||e}`,'err'); }
  };

  // -- Terminal execution ----------------------------------------------------
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

  // -- Browser navigation ----------------------------------------------------
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

  // -- Projects ---------------------------------------------------------------
  const createProject = async () => {
    if (!user || !newProjName.trim()) return;
    try {
      await apiFetch('/projects', { method:'POST', body:JSON.stringify({ name:newProjName, color:newProjColor, system_prompt:newProjPrompt }) }, user.token);
      await loadProjects();
      setShowNewProject(false); setNewProjName(''); setNewProjColor('var(--fg-orange)'); setNewProjPrompt('');
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
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
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  const deleteProject = async (id: string) => {
    if (!user || !confirm('Delete this project and all its threads?')) return;
    try {
      await apiFetch(`/projects/${id}`, { method:'DELETE' }, user.token);
      if (activeProject?.id === id) { setActiveProject(null); setThreads([]); }
      await loadProjects();
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  const selectProject = async (p: Project) => { setActiveProject(p); await loadThreads(p.id); };

  // -- Thread actions --------------------------------------------------------
  const deleteThread = async (id: string) => {
    if (!user) return;
    try {
      await apiFetch(`/threads/${id}`, { method:'DELETE' }, user.token);
      if (activeThread?.id === id) { setActiveThread(null); setMessages([]); setThreadStats(null); }
      await loadThreads(activeProject?.id);
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
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
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  // -- Key vault actions -----------------------------------------------------
  const updateVaultKey = async (provider: string) => {
    if (!user) return;
    const key = vaultUpdateInputs[provider]?.trim();
    if (!key) { showToast('Paste new key first','info'); return; }
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
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
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
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
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

  // -- SuperAgent actions ----------------------------------------------------
  const harvestMemory = async () => {
    if (!user) return;
    setSuperHarvesting(true);
    showToast('⚡ Harvesting knowledge...', 'info');
    try {
      // Longer timeout for harvest — queries all threads/messages
      const d = await apiFetch('/superagent/harvest', { method:'POST', signal: AbortSignal.timeout(120000) }, user.token);
      await loadSuperMemory();
      try { const s = await apiFetch('/superagent/stats', {}, user.token); if (s?.data) setSuperStats(s.data); } catch {}
      const msg = d?.data?.message || d?.message || `✓ Harvest complete! Intelligence: ${d?.data?.intelligenceScore ?? d?.intelligenceScore ?? '+'}`;
      setSuperMessages(prev => [...prev, { role:'assistant', content: String(msg) }]);
      setSuperTab('chat');
      showToast('🧠 Memory harvested!');
    } catch (e: any) {
      const errMsg = `❌ Harvest error: ${String(e?.message || e)}`;
      setSuperMessages(prev => [...prev, { role:'assistant', content: errMsg }]);
      showToast(errMsg, 'err');
    }
    finally { setSuperHarvesting(false); }
  };
  const sendSuperMessage = async () => {
    if (!user || !superInput.trim() || superSending) return;
    const content = superInput.trim();

    // ForgeAsk mode: show modal to select skills/connectors
    if (superMode === 'forgeAsk') {
      setPendingAskMessage(content);
      setShowAskModal(true);
      setSuperInput('');
      return;
    }

    // ForgeMagic mode: auto-match skills/connectors to intent
    if (superMode === 'forgeMagic') {
      const enabledSkills = new Set<string>();
      const enabledConnectors = new Set<string>();
      const contentLower = content.toLowerCase();

      // Match skills by prompt keywords
      (((window as any).FORGE_CATALOG_DATA as any)?.skills || []).forEach((skill: any) => {
        const keywords = (skill.prompt || '').toLowerCase();
        const matchWords = ['pdf', 'docx', 'xlsx', 'pptx', 'excel', 'word', 'sheet', 'data', 'chart', 'graph', 'debug', 'code', 'review', 'brand', 'marketing', 'content'];
        if (matchWords.some(w => contentLower.includes(w) && keywords.includes(w))) {
          enabledSkills.add(skill.id);
        }
      });

      // Match connectors by keywords
      const connectorKeywords: Record<string, string[]> = {
        slack: ['slack', 'message', 'channel', 'post'],
        gmail: ['email', 'mail', 'send', 'inbox'],
        linear: ['linear', 'issue', 'bug', 'ticket'],
        notion: ['notion', 'page', 'database'],
        asana: ['asana', 'task', 'project'],
        'google-drive': ['drive', 'gdrive', 'google', 'doc', 'sheet', 'file'],
        stripe: ['stripe', 'payment', 'billing', 'subscription'],
        github: ['github', 'repo', 'pull', 'pr', 'code'],
        zoom: ['zoom', 'meeting', 'call', 'video']
      };

      Object.entries(connectorKeywords).forEach(([connId, keywords]) => {
        if (keywords.some(k => contentLower.includes(k))) {
          enabledConnectors.add(connId);
        }
      });

      setActiveSkills(enabledSkills);
      setActiveConnectors(enabledConnectors);
    }

    setSuperInput(''); setSuperSending(true); setToolVisibility([]);
    setSuperMessages(prev => [...prev, { role:'user', content }]);
    try {
      const cleanModel = selectedModel.startsWith('openrouter/') ? selectedModel.slice('openrouter/'.length) : selectedModel;
      const d = await apiFetch('/superagent/chat', { method:'POST', body:JSON.stringify({ message: content, model: cleanModel, enabledSkills: Array.from(activeSkills), enabledConnectors: Array.from(activeConnectors || new Set()) }) }, user.token);

      // Parse tool visibility from response
      if (d?.data?.tools) {
        const tools = Array.isArray(d.data.tools) ? d.data.tools : [d.data.tools];
        setToolVisibility(tools.map((t: any) => ({ tool: t.name || t.id || 'unknown', status: t.status || 'done', input: t.input, output: t.output })));
      }

      setSuperMessages(prev => [...prev, { role:'assistant', content: String(d?.data?.content || d?.message || '(no response)') }]);
      loadTotalTokens();
      try { const s = await apiFetch('/superagent/stats', {}, user.token); if (s?.data) setSuperStats(s.data); } catch {}
    } catch (e: any) { setSuperMessages(prev => [...prev, { role:'assistant', content:`⚠️ ${e.message}` }]); }
    finally { setSuperSending(false); }
  };
  const deleteMemoryEntry = async (id: string) => {
    if (!user) return;
    try { await apiFetch(`/superagent/memory/${id}`, { method:'DELETE' }, user.token); setSuperMemory(prev => prev.filter(m => m.id !== id)); } catch {}
  };

  // -- Threads ----------------------------------------------------------------
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

  // -- Send message -----------------------------------------------------------
  const handleNLCommand = (content: string): boolean => {
    const lower = content.toLowerCase().trim();
    if (/enable.*(hook|hooks)/i.test(lower) || /turn on.*(hook|hooks)/i.test(lower)) {
      setMainTab('hooks'); addAgentStep('🪝', 'Opening Hooks — toggle on the hooks you want'); return true;
    }
    if (/disable.*(hook|hooks)/i.test(lower) || /turn off.*(hook|hooks)/i.test(lower)) {
      setMainTab('hooks'); addAgentStep('🪝', 'Opening Hooks — toggle off hooks there'); return true;
    }
    if (/enable.*(skill|skills|tool|tools)/i.test(lower) || /activate.*(skill|tool)/i.test(lower)) {
      setMainTab('skills'); addAgentStep('🛠', 'Opening Skills & Tools'); return true;
    }
    if (/schedule.*(run|task|job)/i.test(lower) || /\bcron\b/i.test(lower) || /automat/i.test(lower)) {
      setMainTab('runs'); addAgentStep('🏃', 'Opening Runs — click "+ Schedule Run" to automate tasks'); return true;
    }
    if (/turn on.*agent|enable.*agent|launch.*agent|forge.*agent/i.test(lower)) {
      setMainTab('forgeauto'); addAgentStep('⚡', 'Opening ForgeAuto'); return true;
    }
    if (/multi.?agent|multiagent/i.test(lower)) {
      setMainTab('forgemulti'); addAgentStep('🤖', 'Opening ForgeMulti'); return true;
    }
    if (/\bswarm\b/i.test(lower)) {
      setMainTab('swarm'); addAgentStep('🐝', 'Opening Agent Swarm'); return true;
    }
    if (/\basi\b|deep.*analys|epic.*analys/i.test(lower)) {
      setMainTab('forgeasi'); addAgentStep('🌌', 'Opening ForgeASI'); return true;
    }
    if (/\bmvp\b|build.*app|build.*product|build.*startup/i.test(lower)) {
      setMainTab('mvp'); addAgentStep('🏗', 'Opening MVP Builder'); return true;
    }
    if (/intelligen|memory.*layer/i.test(lower)) {
      setMainTab('intelligence'); addAgentStep('🧠', 'Opening Intelligence Layer'); return true;
    }
    if (/billing|upgrade.*plan|subscri/i.test(lower)) {
      setMainTab('billing'); addAgentStep('💳', 'Opening Billing'); return true;
    }
    if (/setting|configure.*model|change.*model/i.test(lower)) {
      setMainTab('settings'); addAgentStep('⚙️', 'Opening Settings'); return true;
    }
    return false;
  };

  const sendMessage = async () => {
    if (!user || !input.trim()) return;
    if (handleNLCommand(input.trim())) { setInput(''); return; }
    let currentThread = activeThread;

    // If already sending, spawn a NEW thread for this message so both run in parallel
    if (sending) {
      const title = input.trim().slice(0, 60);
      const spawnThread = await newThread(title);
      if (!spawnThread) return;
      setInput('');
      // Fire the new thread request independently — no await so current send keeps going
      const spawnContent = input.trim();
      const spawnModel = selectedModel.startsWith('openrouter/') ? selectedModel.slice('openrouter/'.length) : selectedModel;
      const spawnCatalogSkills: any[] = (window as any).FORGE_CATALOG_DATA?.skills || [];
      const spawnSkillPrompts: Record<string, string> = {};
      spawnCatalogSkills.forEach((s: any) => { if (activeSkills.has(s.id)) spawnSkillPrompts[s.id] = s.prompt || s.name; });
      const spawnBody: any = {
        content: spawnContent, model: spawnModel, agent_ids: activeAgentIds,
        enabled_tools: Array.from(activeTools), active_skills: Array.from(activeSkills),
        active_skill_prompts: spawnSkillPrompts,
        active_connectors: Array.from(activeConnectors),
        enabled_hooks: hooks.filter(h => h.enabled).map(h => ({ event: h.event, action: h.action, target: h.target })),
      };
      if (activeSkillPrompt) spawnBody.skill_prompt = activeSkillPrompt;
      addAgentStep('⚡', `Spawning parallel agent for: ${spawnContent.slice(0,40)}…`);
      apiFetchSSE(`/threads/${spawnThread.id}/messages`, { method:'POST', body:JSON.stringify(spawnBody) }, user.token)
        .then(() => { loadThreads(activeProject?.id); })
        .catch(() => {});
      return;
    }

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
    setAgentSteps([]); agentStepsRef.current = [];
    setLastThinkingSteps([]); setThinkingExpanded(false);
    setMultiResponses([]);
    addAgentStep('🧠', 'Processing your message…');
    // Create AbortController so Stop button can cancel this request
    const abortCtrl = new AbortController();
    sendAbortRef.current = abortCtrl;
    // Hard safety timeout: abort + unstick UI after 30s (backend LLM timeout is 20s, Railway kills at 30s)
    const safetyTimer = setTimeout(() => {
      abortCtrl.abort(new DOMException('Request timed out — the model took too long to respond. Try a faster model.', 'TimeoutError'));
      setSending(false); setTyping(false); sendAbortRef.current = null;
    }, 55000);
    // Don't auto-open live tab — user stays in chat view

    const tempUser: Message = { id:'tmp-u', thread_id:currentThread.id, role:'user', content:userContent, created_at:new Date().toISOString() };
    setMessages(prev => [...prev, tempUser]);

    // Multi-response mode: query 3 models in parallel
    if (multiResponse) {
      const modelsToQuery = ['claude-sonnet-4','gpt-4o','gemini-2.0-flash'];
      try {
        const results = await Promise.allSettled(modelsToQuery.map(m =>
          apiFetchSSE(`/threads/${currentThread!.id}/messages`, { method:'POST', body:JSON.stringify({ messages: [{role:'user', content:userContent}], model:m, agent_ids:activeAgentIds }) }, user.token)
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
      // Build skill prompt map from catalog so backend gets rich descriptions, not just IDs
      const catalogSkills: any[] = (window as any).FORGE_CATALOG_DATA?.skills || [];
      const skillPromptsMap: Record<string, string> = {};
      catalogSkills.forEach((s: any) => { if (activeSkills.has(s.id)) skillPromptsMap[s.id] = s.prompt || s.name; });
      const body: any = {
        content: userContent,
        model: cleanModel,
        agent_ids: activeAgentIds,
        language: language !== 'en' ? language : undefined,
        enabled_tools: Array.from(activeTools),
        active_skills: Array.from(activeSkills),
        active_skill_prompts: skillPromptsMap,
        active_connectors: Array.from(activeConnectors),
        enabled_hooks: hooks.filter(h => h.enabled).map(h => ({ event: h.event, action: h.action, target: h.target })),
        forge_mode: superMode === 'forgeMagic' ? 'magic' : 'ask',
      };
      if (activeSkillPrompt) body.skill_prompt = activeSkillPrompt;
      // Inject stored website credentials so agent can auto-login
      if (webCreds.length > 0) body.web_creds = webCreds.map(c => ({ site: c.site, url: c.url, username: c.username, password: c.password }));
      // Inject desktop context (folder list + browser page) into system prompt when running in desktop app
      if (isDesktop) {
        const ctxParts: string[] = [];
        if (desktopFolders.length > 0) ctxParts.push(`Open folders: ${desktopFolders.join(', ')}`);
        if (desktopBrowserCtx) ctxParts.push(`Current browser page: ${desktopBrowserCtx.title} (${desktopBrowserCtx.url})${desktopBrowserCtx.text ? `\nPage excerpt: ${desktopBrowserCtx.text.slice(0,600)}` : ''}`);
        if (ctxParts.length > 0) body.desktop_context = ctxParts.join('\n\n');
      }
      // Emit local thinking steps for skills/connectors/hooks
      if (activeSkills.size > 0) addAgentStep('🧩', `Skills active: ${Array.from(activeSkills).slice(0,3).join(', ')}`);
      if (activeConnectors.size > 0) addAgentStep('🔌', `Connectors: ${Array.from(activeConnectors).slice(0,3).join(', ')}`);
      if (hooks.filter(h => h.enabled).length > 0) addAgentStep('🪝', `${hooks.filter(h => h.enabled).length} hook(s) applied`);
      let threadId = currentThread.id;

      // Extract AI reply from response and append directly — avoids loadMessages race condition
      const applyResp = (resp: any) => {
        if (resp && resp.success === false) {
          if (resp.error === 'NO_API_KEY') {
            const provName = resp.providerName || resp.provider || 'your LLM provider';
            // Auto-switch to next available model
            const fallbackOrder = ['forge-ultra','forge-pro','forge-flash','forge-fast','forge-gemini','forge-gpt',
              ...Object.keys(savedProviders).filter(p => savedProviders[p] && p !== provName).map(p =>
                p === 'anthropic' ? 'claude-sonnet-4' : p === 'openai' ? 'gpt-4o' : p === 'groq' ? 'llama-3.3-70b-versatile' :
                p === 'gemini' ? 'gemini-2.0-flash' : p === 'mistral' ? 'mistral-small-latest' :
                p === 'openrouter' ? (openRouterModels[0]?.id || '') : '')
              .filter(Boolean)];
            const nextModel = fallbackOrder.find(m => m && m !== cleanModel);
            if (nextModel) {
              setSelectedModel(nextModel);
              addAgentStep('🔄', `Auto-switched to ${nextModel} (${provName} key missing)`);
              const switchNote: Message = { id: 'tmp-switch', thread_id: threadId, role: 'assistant', content: `🔄 No ${provName} key — auto-switched to **${nextModel}**. Retrying...`, created_at: new Date().toISOString() };
              setMessages(prev => [...prev.filter(m => m.id !== 'tmp-u'), switchNote]);
              return; // caller will retry with new model
            }
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
        setLiveToolCalls([]);
        setExpandedTools({});
        const r = await apiFetchSSE(`/threads/${threadId}/messages`, { method:'POST', body:JSON.stringify(body), signal: abortCtrl.signal }, user.token, (evt) => {
          if (evt.type === 'tool_call') {
            const tc = { tool: evt.tool, args: evt.args, result: evt.result || '', ts: Date.now() };
            setLiveToolCalls(prev => [...prev, tc]);
            addAgentStep('🔧', `${evt.tool}(${JSON.stringify(evt.args||{}).slice(0,60)})`);
          } else if (evt.type === 'file_created') {
            // Agent created a file — it's auto-filed into this folder; refresh the left panel
            addAgentStep('📄', `Saved ${evt.filename} to this folder`);
            loadFolderFiles();
          }
        });
        addAgentStep('✓', 'Response received');
        // Cross off all pending auto-steps in tracker
        setTrackerItems(prev => {
          const updated = prev.map(i => i.id.startsWith('step_') && !i.done ? { ...i, done: true } : i);
          try { localStorage.setItem('forge_tracker', JSON.stringify(updated)); } catch {}
          return updated;
        });
        applyResp(r);
        // Track session cost
        if (r?.data?.cost_usd != null) setSessionCost(prev => prev + (r.data.cost_usd || 0) + (r.data.markup_usd || 0));
        // Auto-open sketch panel when AI produces code/HTML artifact
        const aiContent: string = r?.data?.content || '';
        if (aiContent) {
          const ex = extractCodeBlock(aiContent);
          if (ex?.code && !sketchMode) { setPreviewCode(ex.code); setSketchMode(true); }
        }
        // Auto-compact: if thread context > 85% of model limit, trigger compact
        try {
          const stats = await apiFetch(`/threads/${threadId}/stats`, {}, user.token);
          const used = stats?.data?.total_tokens || 0;
          const limit = getContextLimit(cleanModel);
          if (used > 0 && limit > 0 && used / limit > 0.85) {
            addAgentStep('🗜', 'Context full — auto-compacting…');
            await apiFetch(`/threads/${threadId}/compact`, { method:'POST', body:JSON.stringify({ keep_recent: 8 }) }, user.token);
            addAgentStep('✓', 'Context compacted');
            loadThreadTokenStats(threadId);
          }
        } catch {}
        // Detect clarification request in AI response
        const clarifyMatch = aiContent.match(/\[CLARIFY\]([\s\S]*?)\[\/CLARIFY\]/i) ||
          aiContent.match(/\*\*What do you mean\?\*\*|I need a bit more info|Could you clarify|To help you better|Before I (proceed|start|do that)/i);
        if (clarifyMatch) {
          // Try to extract numbered/bulleted options from the AI response
          const optionMatches = aiContent.match(/(?:\d+[\.\)]\s*|\-\s*|\*\s*)([^\n]+)/g);
          const options = optionMatches ? optionMatches.slice(0, 5).map(o => o.replace(/^[\d\.\)\-\*\s]+/, '').trim()).filter(o => o.length > 2 && o.length < 100) : [];
          if (options.length >= 2) {
            const questionMatch = aiContent.match(/^([^\n?]+\?)/m);
            setClarifyQuestion({ question: questionMatch?.[1] || 'How would you like to proceed?', options });
          }
        } else {
          setClarifyQuestion(null);
        }
      } catch (e: any) {
        // Thread was wiped (Railway redeploy) -- create a fresh one and retry
        if (e.message?.includes('THREAD_NOT_FOUND') || e.message?.includes('404')) {
          const fresh = await apiFetch('/threads', { method:'POST', body:JSON.stringify({ title: userContent.slice(0,60), model: cleanModel }) }, user.token);
          const newT = fresh?.data || fresh;
          threadId = newT.id;
          setActiveThread(newT);
          const r2 = await apiFetchSSE(`/threads/${threadId}/messages`, { method:'POST', body:JSON.stringify(body) }, user.token);
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
      // Auto-run ForgeOptimizer if enabled (fire-and-forget, auto-apply if big savings)
      if (optimizerEnabled) runForgeOptimizer(threadId, true).catch(()=>{});
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
        .replace(/^(anthropic|openai|google|groq|mistral|openrouter) error[^:]*:\s*/i, '')
        .replace(/^\{"type":"error".*?"message":"([^"]+)".*\}$/i, '$1')
        .replace(/^signal is aborted without reason$/i, 'Request timed out — the model took too long. Try a faster model.')
        .replace(/^Failed to fetch$/i, 'Connection timed out — the model took too long to respond. Try a faster model.')
        .replace(/^NetworkError.*$/i, 'Network error — check your connection or try a different model.')
        .replace(/BodyStreamBuffer.*aborted/i, 'Stream interrupted — the response was cut off. Try sending again or switch to a faster model.')
        .replace(/AbortError/i, 'Request cancelled.')
        .replace(/rate.limit.*upstream.*add your own key[^]*/i, 'Free model is rate-limited — switch to a paid model for unthrottled access.')
        .replace(/"?Provider returned error"?,?\s*"?code"?:?\s*429[^]*/i, 'Model is rate-limited. Switch to a different model.')
        .trim();
      const errMsg: Message = { id:'tmp-err', thread_id:currentThread.id, role:'assistant', content:`⚠️ ${clean}`, created_at:new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      clearTimeout(safetyTimer);
      if (agentStepsRef.current.length > 0) setLastThinkingSteps([...agentStepsRef.current]);
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

  // -- Voice Chat -------------------------------------------------------------
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast('Speech recognition not supported. Try Chrome.','info'); return; }

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

  // -- Dispatch (multi-agent swarm) -------------------------------------------
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
    } catch (e: any) { showToast(String(e?.message||e),'err'); setDispatching(false); }
  };

  const cancelDispatch = async () => {
    if (!user || !activeDispatchRunId) return;
    try { await apiFetch(`/dispatch/cancel/${activeDispatchRunId}`, { method:'POST' }, user.token); eventSourceRef.current?.close(); setDispatching(false); } catch {}
  };

  // -- Tasks ------------------------------------------------------------------
  const createTask = async () => {
    if (!user || !newTaskTitle.trim()) return;
    try {
      const body: any = { title:newTaskTitle, priority:newTaskPriority, status:'todo' };
      if (activeProject) body.project_id = activeProject.id;
      await apiFetch('/workspace/tasks', { method:'POST', body:JSON.stringify(body) }, user.token);
      await loadTasks();
      setShowNewTask(false); setNewTaskTitle('');
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  const cycleTaskStatus = async (t: WorkspaceTask) => {
    if (!user) return;
    const cycle: Record<string, WorkspaceTask['status']> = { todo:'in_progress', in_progress:'done', done:'todo', blocked:'todo' };
    try { await apiFetch(`/workspace/tasks/${t.id}`, { method:'PATCH', body:JSON.stringify({ status:cycle[t.status] }) }, user.token); await loadTasks(); } catch {}
  };

  // -- Schedules --------------------------------------------------------------
  const createSchedule = async () => {
    if (!user || !schedName.trim() || !schedPrompt.trim()) return;
    try {
      await apiFetch('/schedules', { method:'POST', body:JSON.stringify({ name:schedName, cron_expression:schedCron, prompt:schedPrompt }) }, user.token);
      await loadSchedules();
      setSchedName(''); setSchedPrompt('');
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  const toggleSchedule = async (s: ScheduledTask) => {
    if (!user) return;
    try { await apiFetch(`/schedules/${s.id}`, { method:'PATCH', body:JSON.stringify({ enabled:s.enabled ? 0 : 1 }) }, user.token); await loadSchedules(); } catch {}
  };

  const runScheduleNow = async (s: ScheduledTask) => {
    if (!user) return;
    try { await apiFetch(`/schedules/${s.id}/run`, { method:'POST' }, user.token); showToast('✓ Triggered!'); } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  // -- Custom Providers --------------------------------------------------------
  const createCustomProvider = async () => {
    if (!user || !newProvider.name || !newProvider.base_url) return;
    try {
      await apiFetch('/providers/custom', { method:'POST', body:JSON.stringify({
        name:newProvider.name, base_url:newProvider.base_url, api_key:newProvider.api_key,
        markup:parseFloat(newProvider.markup) || 1.5, models:newProvider.models
      }) }, user.token);
      await loadCustomProviders();
      setNewProvider({ name:'', base_url:'', api_key:'', markup:'1.5', models:'' });
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  const deleteCustomProvider = async (id: string) => {
    if (!user) return;
    try { await apiFetch(`/providers/custom/${id}`, { method:'DELETE' }, user.token); await loadCustomProviders(); } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  // -- Router test ------------------------------------------------------------
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

  // -- Billing upgrade ---------------------------------------------------------
  const upgradePlan = async (plan: string) => {
    if (!user) return;
    try {
      const d = await apiFetch('/billing/upgrade', { method:'POST', body:JSON.stringify({ plan }) }, user.token);
      if (d?.checkoutUrl) { window.open(d.checkoutUrl, '_blank'); showToast('Opening Stripe checkout...','info'); }
      else { await loadSubscription(); showToast(d?.message || `✓ Upgraded to ${plan} plan!`); }
    } catch (e: any) { showToast(String(e?.message||e),'err'); }
  };

  // -- Toggle agent (chat) ----------------------------------------------------
  const toggleAgent = (id: string) => {
    setActiveAgentIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // -- Helpers ----------------------------------------------------------------
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

  // --- Render --------------------------------------------------------------
  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--fg-bg)', color:'var(--fg-text)', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow:'hidden', position:'relative' }} onClick={() => { setThreadMenu(null); setProjectMenu(null); if(isMobile) setMobileDrawerOpen(false); }}>

      {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:9999, padding:'12px 24px', borderRadius:12, background: toast.type==='err' ? '#ef4444' : toast.type==='info' ? 'var(--fg-bg3)' : '#16a34a', color:'#fff', fontSize:14, fontWeight:600, boxShadow:'0 4px 24px rgba(0,0,0,0.5)', maxWidth:440, textAlign:'center', pointerEvents:'none', animation:'forge-flash 0.2s ease' }}>{toast.msg}</div>}

      {showOnboarding && <OnboardingFlow onComplete={() => { setShowOnboarding(false); localStorage.setItem('forge_onboarding_done', 'true'); }} onSelectPrompt={(p) => { setInput(p); }} hasKeys={vaultKeys.length > 0} />}

      {/* Mobile overlay */}
      {isMobile && mobileDrawerOpen && <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:98 }} onClick={() => setMobileDrawerOpen(false)} />}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:52, background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)', display:'flex', alignItems:'center', padding:'0 14px', gap:10, zIndex:99, flexShrink:0 }}>
          <button onClick={e => { e.stopPropagation(); setMobileDrawerOpen(o=>!o); }} style={{ background:'none', border:'none', color:'var(--fg-text2)', fontSize:20, cursor:'pointer', padding:4 }}>🌀</button>
          <div style={{ width:28, height:28, background:'transparent', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, animation:'neon-cycle 3s linear infinite' }}>⚡</div>
          <span className="forge-neon" style={{ fontSize:16 }}>Forge</span>
          <div style={{ marginLeft:'auto', fontSize:12, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>{selectedModel || 'forge-fast'}</div>
        </div>
      )}

      {/* -- LEFT SIDEBAR ---------------------------------------------------- */}
      <div style={{ width: isMobile ? (mobileDrawerOpen ? 260 : 0) : (sidebarExpanded ? 260 : 60), background:'var(--fg-bg)', borderRight:'1px solid var(--fg-border)', display:'flex', flexDirection:'column', flexShrink:0, transition:'width 0.2s', overflow:'hidden', position: isMobile ? 'fixed' : 'relative', top:0, left:0, bottom:0, zIndex: isMobile ? 99 : 'auto' as any }} onClick={e => e.stopPropagation()}>
        {/* Logo + collapse */}
        <div style={{ padding:'14px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--fg-border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, overflow:'hidden' }}>
            <div style={{ width:30, height:30, background:'var(--fg-btn-grad)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, boxShadow:'0 0 14px rgba(255,31,53,0.4)' }}>⚡</div>
            {sidebarExpanded && <span style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.04em', fontFamily:'var(--fg-font-display)', whiteSpace:'nowrap', background:'linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Forge</span>}
          </div>
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:13, padding:4, opacity:0.6 }}>{sidebarExpanded ? '«' : '◀'}</button>
        </div>

        {/* Nav tabs — 3-zone Taskade-style */}
        <div style={{ padding:'6px 6px', borderBottom:'1px solid var(--fg-border)', overflowY:'auto', flexShrink:0, maxHeight: sidebarExpanded ? 'calc(100vh - 340px)' : 'calc(100vh - 120px)' }}>
          {/* -- ZONE 1: Core -- */}
          {sidebarExpanded && <div style={{ padding:'4px 6px 2px', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--fg-text3)' }}>Core</div>}
          {([
            { id:'workspace', icon:'💬', label:'Workspace' },
            { id:'super', icon:'🌟', label:'SuperAgent' },
            { id:'skills', icon:'🧩', label:'Skills & Tools' },
          ] as Array<{id:string;icon:string;label:string}>).map(tab => (
            <button key={tab.id} onClick={() => { setMainTab(tab.id as any); if (tab.id==='super'){loadSuperMemory();loadSuperHistory();} }} title={tab.label}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 8px', background: mainTab===tab.id ? 'rgba(255,31,53,0.12)' : 'transparent', border:'none', borderLeft: mainTab===tab.id ? '2px solid var(--fg-orange)' : '2px solid transparent', borderRadius: mainTab===tab.id ? '0 8px 8px 0' : '0 8px 8px 0', color: mainTab===tab.id ? 'var(--fg-orange)' : 'var(--fg-text2)', cursor:'pointer', fontSize:13, fontWeight: mainTab===tab.id ? 600 : 400, marginBottom:1, justifyContent:sidebarExpanded?'flex-start':'center', transition:'all 0.15s' }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{tab.icon}</span>
              {sidebarExpanded && <span style={{ fontSize:12, letterSpacing:'-0.01em' }}>{tab.label}</span>}
            </button>
          ))}

          {/* -- ZONE 2: Build -- */}
          <div style={{ margin:'8px 0 2px', height:'1px', background:'var(--fg-border)' }} />
          {sidebarExpanded && <div style={{ padding:'4px 6px 2px', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--fg-text3)' }}>Build</div>}
          {([
            { id:'router', icon:'🔀', label:'ForgeRouter' },
            { id:'forgeco', icon:'🧑"💻', label:'ForgeCo' },
            { id:'forgeauto', icon:'⚡', label:'ForgeAuto' },
            { id:'forgemulti', icon:'🤖', label:'ForgeMulti' },
            { id:'forgeasi', icon:'🌌', label:'ForgeASI' },
            { id:'mvp', icon:'🏗', label:'MVP Builder' },
            { id:'marketplace', icon:'🛍', label:'Marketplace' },
            { id:'intelligence', icon:'🧠', label:'Intelligence' },
            { id:'swarm', icon:'🐝', label:'Agent Swarm' },
            { id:'files', icon:'📁', label:'Files' },
            { id:'runs', icon:'🏃', label:'Runs' },
            { id:'hooks', icon:'🪝', label:'Hooks' },
            ...(isDesktop ? [{ id:'desktop', icon:'🖥', label:'Desktop & Files' }] : []),
          ] as Array<{id:string;icon:string;label:string}>).map(tab => (
            <button key={tab.id} onClick={() => setMainTab(tab.id as any)} title={tab.label}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background: mainTab===tab.id ? 'rgba(255,31,53,0.10)' : 'transparent', border:'none', borderLeft: mainTab===tab.id ? '2px solid var(--fg-orange)' : '2px solid transparent', borderRadius:'0 8px 8px 0', color: mainTab===tab.id ? 'var(--fg-orange2)' : 'var(--fg-text3)', cursor:'pointer', fontSize:12, fontWeight: mainTab===tab.id ? 600 : 400, marginBottom:1, justifyContent:sidebarExpanded?'flex-start':'center', transition:'all 0.15s' }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{tab.icon}</span>
              {sidebarExpanded && <span style={{ fontSize:12, letterSpacing:'-0.01em' }}>{tab.label}</span>}
            </button>
          ))}

          {/* -- ZONE 3: System -- */}
          <div style={{ margin:'8px 0 2px', height:'1px', background:'var(--fg-border)' }} />
          {sidebarExpanded && <div style={{ padding:'4px 6px 2px', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--fg-text3)' }}>System</div>}
          {([
            { id:'platforms', icon:'🌐', label:'Platforms' },
            { id:'billing', icon:'💳', label:'Billing' },
            { id:'settings', icon:'⚙️', label:'Settings' },
            ...(user.role==='admin' ? [{ id:'admin', icon:'🛡', label:'Admin' }] : []),
          ] as Array<{id:string;icon:string;label:string}>).map(tab => (
            <button key={tab.id} onClick={() => { setMainTab(tab.id as any); if(tab.id==='admin'){loadAdminStats();loadAdminUsers();loadAdminKeys();loadAdminModels();} if(tab.id==='settings'){loadVault();} }} title={tab.label}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background: mainTab===tab.id ? 'rgba(255,31,53,0.10)' : 'transparent', border:'none', borderLeft: mainTab===tab.id ? '2px solid var(--fg-orange)' : '2px solid transparent', borderRadius:'0 8px 8px 0', color: mainTab===tab.id ? 'var(--fg-orange2)' : 'var(--fg-text3)', cursor:'pointer', fontSize:12, fontWeight: mainTab===tab.id ? 600 : 400, marginBottom:1, justifyContent:sidebarExpanded?'flex-start':'center', transition:'all 0.15s' }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{tab.icon}</span>
              {sidebarExpanded && <span style={{ fontSize:12, letterSpacing:'-0.01em' }}>{tab.label}</span>}
            </button>
          ))}
        </div>

        {/* Workspace sidebar content */}
        {mainTab === 'workspace' && sidebarExpanded && (
          <>
            <div style={{ padding:'10px 10px 0' }}>
              <button onClick={newThread} style={{ width:'100%', padding:'9px 14px', background:'var(--fg-btn-grad)', border:'none', borderRadius:'var(--fg-radius-btn)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:7, boxShadow:'0 2px 10px rgba(255,31,53,0.25)', transition:'all 0.18s', letterSpacing:'-0.01em' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 18px rgba(255,31,53,0.4), 0 4px 12px rgba(0,0,0,0.4)';(e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.boxShadow='0 2px 10px rgba(255,31,53,0.25)';(e.currentTarget as HTMLButtonElement).style.transform='none';}}>
                <span style={{ fontSize:14 }}>📝</span>New conversation
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
              <input value={threadSearch} onChange={e => setThreadSearch(e.target.value)} placeholder="🔍 Search threads..." style={{ flex:'0 0 auto', marginBottom:8, padding:'6px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text)', fontSize:12, outline:'none' }} />
              <div style={{ flex:1, overflowY:'auto' }}>
                {/* Pinned threads first */}
                {threads.filter(t => t.pinned && !t.archived && t.title.toLowerCase().includes(threadSearch.toLowerCase())).map(t => (
                  <div key={t.id} style={{ position:'relative' }}
                    onContextMenu={e => { e.preventDefault(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }}>
                    <div onClick={() => selectThread(t)}
                      onMouseEnter={e => { const b = e.currentTarget.querySelector('.thread-menu-btn') as HTMLElement; if (b) b.style.opacity='1'; }}
                      onMouseLeave={e => { const b = e.currentTarget.querySelector('.thread-menu-btn') as HTMLElement; if (b) b.style.opacity='0'; }}
                      style={{ padding:'7px 8px 5px', borderRadius:6, cursor:'pointer', marginBottom:1, background:activeThread?.id===t.id ? 'var(--fg-bg4)' : 'var(--fg-bg)', border:'1px solid var(--fg-border2)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ fontSize:10 }}>📌</span>
                        {renamingThread?.id === t.id ? (
                          <input autoFocus value={renamingThreadInput} onChange={e => setRenamingThreadInput(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter') {
                                await apiFetch(`/threads/${t.id}`, { method:'PATCH', body:JSON.stringify({ title: renamingThreadInput }) }, user?.token||'');
                                setThreads(prev => prev.map(th => th.id===t.id ? {...th, title:renamingThreadInput} : th));
                                setRenamingThread(null);
                              }
                              if (e.key === 'Escape') setRenamingThread(null);
                            }}
                            onBlur={() => setRenamingThread(null)}
                            style={{ flex:1, background:'var(--fg-bg3)', border:'1px solid var(--fg-orange)', borderRadius:4, color:'var(--fg-text)', fontSize:12, padding:'1px 6px', outline:'none' }} />
                        ) : (
                          <p style={{ margin:0, fontSize:13, color:activeThread?.id===t.id ? 'var(--fg-orange2)' : 'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{t.title}</p>
                        )}
                        <button onClick={e => { e.stopPropagation(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11, padding:'0 2px', opacity:0, transition:'opacity 0.15s' }} className="thread-menu-btn">•••</button>
                      </div>
                      {t.total_tokens ? <p style={{ margin:'2px 0 0 14px', fontSize:10, color:'var(--fg-text3)' }}>{t.total_tokens >= 1000 ? (t.total_tokens/1000).toFixed(1)+'k' : t.total_tokens} tokens</p> : null}
                    </div>
                  </div>
                ))}
                {/* Grouped threads — Today / Yesterday / This week / Older */}
                {(() => {
                  const unpinned = threads.filter(t => !t.pinned && !t.archived && t.title.toLowerCase().includes(threadSearch.toLowerCase()));
                  const now = new Date(); const today = now.toDateString();
                  const yesterday = new Date(now.getTime()-86400000).toDateString();
                  const weekAgo = new Date(now.getTime()-7*86400000);
                  const groups: {label:string; threads:typeof unpinned}[] = [
                    { label:'Today',     threads: unpinned.filter(t => { const d = new Date(t.updated_at||t.created_at||0); return d.toDateString()===today; }) },
                    { label:'Yesterday', threads: unpinned.filter(t => { const d = new Date(t.updated_at||t.created_at||0); return d.toDateString()===yesterday; }) },
                    { label:'This week', threads: unpinned.filter(t => { const d = new Date(t.updated_at||t.created_at||0); return d < new Date(yesterday) && d >= weekAgo; }) },
                    { label:'Older',     threads: unpinned.filter(t => { const d = new Date(t.updated_at||t.created_at||0); return d < weekAgo; }) },
                  ].filter(g => g.threads.length > 0);
                  const allGrouped = groups.flatMap(g => g.threads);
                  // If no date info, fall back to flat list
                  if (allGrouped.length === 0) return unpinned.slice(0, showAllThreads ? 100 : 8).map(t => {
                    const isActive = activeThread?.id===t.id;
                    return (
                      <div key={t.id} style={{ position:'relative' }} onContextMenu={e => { e.preventDefault(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }}>
                        <div onClick={() => selectThread(t)} style={{ padding:'6px 8px', borderRadius:7, cursor:'pointer', marginBottom:1, background: isActive ? 'rgba(255,31,53,0.1)' : 'transparent', borderLeft: isActive ? '2px solid var(--fg-orange)' : '2px solid transparent', transition:'all 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget.querySelector('.thread-menu-btn') as any)?.style&&((e.currentTarget.querySelector('.thread-menu-btn') as any).style.opacity='1'); }}
                          onMouseLeave={e => { (e.currentTarget.querySelector('.thread-menu-btn') as any)?.style&&((e.currentTarget.querySelector('.thread-menu-btn') as any).style.opacity='0'); }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <p style={{ margin:0, fontSize:12, color: isActive ? 'var(--fg-orange2)' : 'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{t.title}</p>
                            <button onClick={e => { e.stopPropagation(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11, padding:'0 2px', opacity:0, transition:'opacity 0.15s' }} className="thread-menu-btn">•••</button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                  return (
                    <>
                      {groups.map(group => (
                        <div key={group.label}>
                          <div style={{ padding:'8px 4px 3px', fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fg-text3)' }}>{group.label}</div>
                          {(showAllThreads ? group.threads : group.threads.slice(0, group.label==='Today' ? 10 : group.label==='Yesterday' ? 5 : 3)).map(t => {
                            const isActive = activeThread?.id===t.id;
                            return (
                              <div key={t.id} style={{ position:'relative' }} onContextMenu={e => { e.preventDefault(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }}>
                                <div onClick={() => selectThread(t)} style={{ padding:'6px 8px', borderRadius:7, cursor:'pointer', marginBottom:1, background: isActive ? 'rgba(255,31,53,0.1)' : 'transparent', borderLeft: isActive ? '2px solid var(--fg-orange)' : '2px solid transparent', transition:'all 0.12s' }}
                                  onMouseEnter={e => { (e.currentTarget.querySelector('.thread-menu-btn') as any)?.style && ((e.currentTarget.querySelector('.thread-menu-btn') as any).style.opacity='1'); if(!isActive)(e.currentTarget as HTMLElement).style.background='var(--fg-bg4)'; }}
                                  onMouseLeave={e => { (e.currentTarget.querySelector('.thread-menu-btn') as any)?.style && ((e.currentTarget.querySelector('.thread-menu-btn') as any).style.opacity='0'); if(!isActive)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                    {renamingThread?.id === t.id ? (
                                      <input autoFocus value={renamingThreadInput} onChange={e => setRenamingThreadInput(e.target.value)}
                                        onKeyDown={async e => {
                                          if (e.key==='Enter') { await apiFetch(`/threads/${t.id}`,{method:'PATCH',body:JSON.stringify({title:renamingThreadInput})},user?.token||''); setThreads(prev=>prev.map(th=>th.id===t.id?{...th,title:renamingThreadInput}:th)); setRenamingThread(null); }
                                          if (e.key==='Escape') setRenamingThread(null);
                                        }} onBlur={() => setRenamingThread(null)}
                                        style={{ flex:1, background:'var(--fg-bg3)', border:'1px solid var(--fg-orange)', borderRadius:4, color:'var(--fg-text)', fontSize:12, padding:'1px 6px', outline:'none' }} />
                                    ) : (
                                      <p style={{ margin:0, fontSize:12, color: isActive ? 'var(--fg-orange2)' : 'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, letterSpacing:'-0.01em' }}>{t.title}</p>
                                    )}
                                    <button onClick={e => { e.stopPropagation(); setThreadMenu({ threadId:t.id, x:e.clientX, y:e.clientY }); }} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11, padding:'0 2px', opacity:0, transition:'opacity 0.15s', flexShrink:0 }} className="thread-menu-btn">•••</button>
                                  </div>
                                  {t.total_tokens ? <p style={{ margin:'1px 0 0', fontSize:10, color:'var(--fg-text3)' }}>{t.total_tokens>=1000?(t.total_tokens/1000).toFixed(1)+'k':t.total_tokens} tok</p> : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      {unpinned.length > 8 && (
                        <button onClick={() => setShowAllThreads(p=>!p)} style={{ width:'100%', padding:'5px 8px', background:'transparent', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11, marginTop:4 }}>
                          {showAllThreads ? '▲ Show less' : `▼ All threads (${unpinned.length})`}
                        </button>
                      )}
                    </>
                  );
                })()}
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
                  <span style={{ fontSize:10, color:'var(--fg-border2)', background:'var(--fg-bg4)', padding:'1px 5px', borderRadius:4, border:'1px solid var(--fg-border2)', fontFamily:'monospace' }}>v6.59</span>
                  {isDesktop && <span style={{ fontSize:10, color:'var(--fg-green)', background:'rgba(34,197,94,0.1)', padding:'1px 6px', borderRadius:4, border:'1px solid rgba(34,197,94,0.3)', fontWeight:600 }}>🖥 Desktop</span>}
                </div>
              </div>
              <button onClick={handleLogout} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12 }}>×</button>
            </>
          )}
          {!sidebarExpanded && <span style={{ fontSize:9, color:'var(--fg-border2)', fontFamily:'monospace' }}>6.1</span>}
        </div>
      </div>

      {/* -- MAIN CONTENT ---------------------------------------------------- */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', marginTop: isMobile ? 52 : 0 }}>

        {/* -- WORKSPACE TAB --------------------------------------------------- */}
        {mainTab === 'workspace' && (
          <div style={{ display:'contents' }}>
            {/* Top bar */}
            <div style={{ padding:'0 10px', height:52, background:'var(--fg-bg2)', borderBottom:'1px solid var(--fg-border)', display:'flex', alignItems:'center', gap:8, flexShrink:0, position:'relative' }}>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:'var(--fg-accent-grad)', backgroundSize:'200% auto', animation:'fg-topbar-line 4s linear infinite', opacity:0.6 }} />
              {/* Active Space selector */}
              {!isMobile && (
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'var(--fg-bg4)', borderRadius:8, border:'1px solid var(--fg-border2)', flexShrink:0, cursor:'pointer' }} title="Active Space">
                  <span style={{ fontSize:11 }}>🌐</span>
                  <span style={{ fontSize:11, color:'var(--fg-orange2)', fontWeight:600, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {activeProject ? activeProject.name : 'Default Space'}
                  </span>
                  <span style={{ fontSize:9, color:'var(--fg-text3)' }}>▼</span>
                </div>
              )}
              {/* Title */}
              <div style={{ flex:1, overflow:'hidden', display:'flex', alignItems:'center', gap:8 }}>
                <h2 style={{ margin:0, fontSize:14, fontWeight:600, color:'var(--fg-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {activeThread ? activeThread.title : activeProject ? activeProject.name : 'Forge Workspace'}
                </h2>
                {/* Mini sparkline */}
                {threadStats && threadStats.token_history.length > 0 && (() => {
                  const vals = threadStats.token_history.map(h => h.tokens);
                  const max = Math.max(...vals, 1);
                  const w = 5; const gap = 2; const h = 18;
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
              </div>
              {/* Active skill indicator */}
              {activeSkillPrompt && (
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', background:'rgba(255,140,0,0.12)', border:'1px solid var(--fg-orange)', borderRadius:8, flexShrink:0 }}>
                  <span style={{ fontSize:10 }}>🧩</span>
                  <span style={{ fontSize:10, color:'var(--fg-orange)', fontWeight:600 }}>Skill</span>
                  <button onClick={() => setActiveSkillPrompt('')} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', padding:0, fontSize:12, lineHeight:1, flexShrink:0 }}>×</button>
                </div>
              )}
              {/* 💰 Gas-style live token counter + session cost */}
              <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background: totalTokens > 500000 ? 'rgba(239,68,68,0.12)' : totalTokens > 100000 ? 'rgba(255,140,0,0.1)' : 'var(--fg-bg4)', borderRadius:8, border:`1px solid ${totalTokens > 500000 ? 'rgba(239,68,68,0.4)' : 'var(--fg-border2)'}`, flexShrink:0, justifyContent:'center', cursor:'pointer' }} onClick={() => setMainTab('billing')} title="Click to view billing">
                <span style={{ fontSize:10 }}>💰</span>
                <span style={{ fontSize:11, color: totalTokens > 500000 ? '#ef4444' : totalTokens > 0 ? 'var(--fg-orange)' : 'var(--fg-text3)', fontWeight:700, fontFamily:'monospace', letterSpacing:'-0.5px' }}>
                  {totalTokens >= 1000000 ? (totalTokens/1000000).toFixed(2)+'M' : totalTokens >= 1000 ? (totalTokens/1000).toFixed(1)+'k' : totalTokens || '0'}
                </span>
                {sessionCost > 0 && <span style={{ fontSize:10, color:'var(--fg-green)', fontFamily:'monospace', marginLeft:2 }}>${sessionCost.toFixed(4)}</span>}
              </div>
              {/* 🔧 ForgeOptimizer toggle */}
              {!isMobile && activeThread && (
                <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                  <button
                    onClick={() => { if (optimizerData) { setOptimizerOpen(!optimizerOpen); } else { setOptimizerOpen(true); runForgeOptimizer(); } }}
                    disabled={optimizerRunning}
                    title={optimizerData ? `ForgeOptimizer: ${optimizerData.savingsPct}% savings available` : 'Analyze token usage'}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background: optimizerData && optimizerData.savingsPct > 20 ? 'linear-gradient(135deg,rgba(255,43,61,0.2),rgba(251,146,60,0.15))' : 'var(--fg-bg4)', border:`1px solid ${optimizerData && optimizerData.savingsPct > 20 ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:8, color: optimizerData && optimizerData.savingsPct > 20 ? 'var(--fg-orange)' : 'var(--fg-text3)', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'monospace' }}>
                    <span>{optimizerRunning ? '⚡' : '🔧'}</span>
                    <span>{optimizerRunning ? 'Analyzing...' : optimizerData ? `${optimizerData.savingsPct}% save` : 'Optimizer'}</span>
                  </button>
                  <button onClick={() => setOptimizerEnabled(!optimizerEnabled)} title={optimizerEnabled ? 'Auto-optimizer ON (click to disable)' : 'Auto-optimizer OFF (click to enable)'}
                    style={{ padding:'4px 6px', background:'none', border:`1px solid ${optimizerEnabled ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:6, color: optimizerEnabled ? 'var(--fg-orange)' : 'var(--fg-text3)', cursor:'pointer', fontSize:9, fontWeight:700 }}>
                    {optimizerEnabled ? 'AUTO' : 'OFF'}
                  </button>
                </div>
              )}
              {/* 🧠 IQ score */}
              {!isMobile && (
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background: superStats.intelligenceScore > 100 ? 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(56,189,248,0.1))' : 'var(--fg-bg4)', borderRadius:8, border:`1px solid ${superStats.intelligenceScore > 100 ? 'rgba(139,92,246,0.4)' : 'var(--fg-border2)'}`, flexShrink:0, cursor:'pointer' }} onClick={() => setMainTab('super')} title="SuperAgent IQ — click to open">
                  <span style={{ fontSize:10 }}>🧠</span>
                  <span style={{ fontSize:11, fontWeight:700, color: superStats.intelligenceScore > 500 ? 'var(--fg-orange2)' : superStats.intelligenceScore > 100 ? '#a78bfa' : 'var(--fg-text3)', fontFamily:'monospace' }}>IQ {superStats.intelligenceScore}</span>
                </div>
              )}
              {/* ⚡ Harvest button */}
              {!isMobile && (
                <button onClick={harvestMemory} disabled={superHarvesting} title="Harvest memory → boost SuperAgent IQ" style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background: superHarvesting ? 'var(--fg-bg4)' : 'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:8, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, opacity: superHarvesting ? 0.5 : 1 }}>
                  <span>{superHarvesting ? '⚡' : '⚡'}</span>
                  <span>Harvest</span>
                </button>
              )}
              {/* Language selector */}
              {!isMobile && (
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{ background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text2)', padding:'4px 8px', fontSize:11, cursor:'pointer' }} title="Response language">
                  <option value="en">🇬🇧 EN</option>
                  <option value="es">🇪🇸 ES</option>
                  <option value="fr">🇫🇷 FR</option>
                  <option value="de">🇩🇪 DE</option>
                  <option value="pt">🇧🇷 PT</option>
                  <option value="it">🇮🇹 IT</option>
                  <option value="zh">🇨🇳 ZH</option>
                  <option value="ja">🇯🇵 JA</option>
                  <option value="ko">🇰🇷 KO</option>
                  <option value="ar">🇸🇦 AR</option>
                  <option value="hi">🇮🇳 HI</option>
                  <option value="ru">🇷🇺 RU</option>
                </select>
              )}
              {/* EPIC button */}
              {!isMobile && (
                <button onClick={() => setMainTab('forgeasi')} title="EPIC: Extended Parallel Intelligence Chains" style={{ padding:'4px 8px', background: mainTab==='forgeasi' ? '#6366f1' : 'var(--fg-bg4)', border:`1px solid ${mainTab==='forgeasi' ? '#6366f1' : 'var(--fg-border2)'}`, borderRadius:6, color: mainTab==='forgeasi' ? '#fff' : 'var(--fg-text3)', fontSize:10, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>🌌 EPIC</button>
              )}
              {/* Sketch toggle */}
              {!isMobile && <button onClick={() => setSketchMode(!sketchMode)} title="Live Preview" style={{ padding:'4px 8px', background:sketchMode ? 'var(--fg-border)' : 'transparent', border:`1px solid ${sketchMode ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:6, color:sketchMode ? 'var(--fg-orange2)' : 'var(--fg-text2)', cursor:'pointer', fontSize:11, flexShrink:0 }}>📝</button>}

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
                    {noKeys && orModels.length === 0 && <option value="">⚠️ Add an API key in Settings</option>}
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
              {/* OR model refresh button */}
              {savedProviders['openrouter'] && (
                <button onClick={loadOpenRouterModels} disabled={orLoading} title="Refresh OpenRouter models" style={{ background:'none', border:'none', color: orLoading ? 'var(--fg-text3)' : 'var(--fg-orange)', cursor: orLoading ? 'default' : 'pointer', fontSize:14, padding:'2px 4px', flexShrink:0 }}>
                  {orLoading ? '⚡' : '🔄'}
                </button>
              )}

              {!isMobile && <button onClick={() => setRightExpanded(!rightExpanded)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:14 }}>{rightExpanded ? '◀' : '«'}</button>}
            </div>

            {/* -- Active Agents Navbar ------------------------------------------- */}
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
                        <span style={{ fontSize:12, color:'var(--fg-orange)', fontWeight:600 }}>📝 Live Preview</span>
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
                <div onScroll={e=>{const el=e.currentTarget;const b=el.scrollHeight-el.scrollTop-el.clientHeight<80;setShowScrollDown(!b);setUserScrolledUp(!b);}} style={{ flex:1, overflowY:'auto', padding: isMobile ? '16px 12px' : '24px 32px', display:'flex', flexDirection:'column', gap:16 }}>
                  {messages.length === 0 && !activeThread && (
                    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
                      <div style={{ fontSize:56 }}>⚡</div>
                      <h1 style={{ color:'var(--fg-text)', margin:0, fontSize:28, fontFamily:'var(--fg-font-display)', fontWeight:800, letterSpacing:'-0.6px' }}>What do you want to build?</h1>
                      <p style={{ color:'var(--fg-text3)', margin:0, textAlign:'center', maxWidth:480, fontSize:14, lineHeight:1.5 }}>Start a conversation, dispatch an agent, or explore your tools and skills.</p>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginTop:12 }}>
                        {['Write a React component','Research a topic','Build an API endpoint','Create a deployment plan'].map(s => (
                          <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }} style={{ padding:'8px 14px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:20, color:'var(--fg-text2)', fontSize:12, cursor:'pointer', transition:'all 0.15s' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--fg-bg3)';(e.currentTarget as HTMLElement).style.borderColor='var(--fg-border3)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='var(--fg-bg4)';(e.currentTarget as HTMLElement).style.borderColor='var(--fg-border2)';}}>{s}</button>
                        ))}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:24, maxWidth:540 }}>
                        <button onClick={() => { newThread(); }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border2)', borderRadius:12, color:'var(--fg-text2)', cursor:'pointer', transition:'all 0.15s' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--fg-orange)';(e.currentTarget as HTMLElement).style.background='rgba(255,31,53,0.05)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--fg-border2)';(e.currentTarget as HTMLElement).style.background='var(--fg-bg2)';}}>
                          <span style={{ fontSize:28 }}>💬</span>
                          <span style={{ fontSize:12, fontWeight:600 }}>New Thread</span>
                        </button>
                        <button onClick={() => { setMainTab('agents'); }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border2)', borderRadius:12, color:'var(--fg-text2)', cursor:'pointer', transition:'all 0.15s' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--fg-orange)';(e.currentTarget as HTMLElement).style.background='rgba(255,31,53,0.05)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--fg-border2)';(e.currentTarget as HTMLElement).style.background='var(--fg-bg2)';}}>
                          <span style={{ fontSize:28 }}>🤖</span>
                          <span style={{ fontSize:12, fontWeight:600 }}>Agents</span>
                        </button>
                        <button onClick={() => { setMainTab('skills'); }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border2)', borderRadius:12, color:'var(--fg-text2)', cursor:'pointer', transition:'all 0.15s' }} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--fg-orange)';(e.currentTarget as HTMLElement).style.background='rgba(255,31,53,0.05)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--fg-border2)';(e.currentTarget as HTMLElement).style.background='var(--fg-bg2)';}}>
                          <span style={{ fontSize:28 }}>🛠</span>
                          <span style={{ fontSize:12, fontWeight:600 }}>Skills</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Clarification question card */}
                  {clarifyQuestion && !sending && (
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start', maxWidth:560 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🤔</div>
                      <div style={{ flex:1, padding:'12px 16px', borderRadius:'4px 18px 18px 18px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border2)' }}>
                        <p style={{ margin:'0 0 10px', fontSize:13, color:'var(--fg-text)', fontWeight:500 }}>{clarifyQuestion.question}</p>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {clarifyQuestion.options.map((opt, i) => (
                            <button key={i} onClick={() => {
                              setClarifyQuestion(null);
                              setInput(opt);
                              setTimeout(() => sendMessage(), 50);
                            }} style={{ padding:'8px 14px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text)', fontSize:12, cursor:'pointer', textAlign:'left', transition:'all 0.15s', display:'flex', alignItems:'center', gap:8 }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--fg-orange)'; (e.currentTarget as HTMLElement).style.background = 'var(--fg-odim)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--fg-border2)'; (e.currentTarget as HTMLElement).style.background = 'var(--fg-bg4)'; }}>
                              <span style={{ width:20, height:20, borderRadius:'50%', background:'var(--fg-bg5)', border:'1px solid var(--fg-border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                              <span>{opt}</span>
                            </button>
                          ))}
                          <button onClick={() => setClarifyQuestion(null)} style={{ padding:'4px 10px', background:'none', border:'none', color:'var(--fg-text3)', fontSize:11, cursor:'pointer', textAlign:'left' }}>× dismiss</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Live tool call cards — shown while/after agentic tools ran */}
                  {liveToolCalls.length > 0 && !sending && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, padding:'10px 14px', background:'rgba(255,107,53,0.06)', border:'1px solid rgba(255,107,53,0.2)', borderRadius:12, marginBottom:4 }}>
                      <div style={{ fontSize:11, color:'var(--fg-orange)', fontWeight:700, letterSpacing:'0.5px', marginBottom:2 }}>⚡ I used {liveToolCalls.length} tool{liveToolCalls.length>1?'s':''} to get this done</div>
                      {liveToolCalls.map((tc, idx) => {
                        const toolMeta: {[k:string]:{icon:string;narrate:(a:any)=>string}} = {
                          web_search: { icon:'🔍', narrate: a => `Searched the web for "${a?.query||'...'}"` },
                          web_scrape: { icon:'🌐', narrate: a => `Read the page at ${a?.url||'...'}` },
                          run_code: { icon:'💻', narrate: a => `Ran ${a?.language||'code'} to compute the result` },
                          shell_exec: { icon:'🖥', narrate: a => `Executed shell command: ${(a?.command||'').slice(0,60)}` },
                          browser_action: { icon:'🖱', narrate: a => `Interacted with browser — ${a?.action||'click'}` },
                          read_file: { icon:'📄', narrate: a => `Read file: ${a?.path||a?.file||'...'}` },
                          write_file: { icon:'💾', narrate: a => `Wrote file: ${a?.path||a?.file||'...'}` },
                          http_request: { icon:'📡', narrate: a => `Made ${a?.method||'GET'} request to ${a?.url||'...'}` },
                          list_directory: { icon:'📁', narrate: a => `Listed files in ${a?.path||'...'}` },
                          screenshot: { icon:'📸', narrate: _a => 'Took a screenshot' },
                          image_gen: { icon:'🎨', narrate: a => `Generated image: "${(a?.prompt||'').slice(0,50)}"` },
                        };
                        const meta = toolMeta[tc.tool] || { icon:'🔧', narrate: _a => `Used ${tc.tool}` };
                        return (
                          <div key={idx} style={{ borderRadius:8, border:'1px solid var(--fg-border2)', overflow:'hidden', background:'var(--fg-bg3)' }}>
                            <div
                              onClick={() => setExpandedTools(p => ({ ...p, [idx]: !p[idx] }))}
                              style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', cursor:'pointer', userSelect:'none' }}>
                              <span style={{ fontSize:15, flexShrink:0 }}>{meta.icon}</span>
                              <span style={{ fontSize:12, color:'var(--fg-text2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {meta.narrate(tc.args)}
                              </span>
                              <span style={{ fontSize:10, color:'var(--fg-text3)', marginLeft:'auto', flexShrink:0 }}>{expandedTools[idx] ? '▲' : '▼'}</span>
                            </div>
                            {expandedTools[idx] && (
                              <div style={{ borderTop:'1px solid var(--fg-border)', padding:'8px 10px', display:'flex', flexDirection:'column', gap:6 }}>
                                <div>
                                  <div style={{ fontSize:10, color:'var(--fg-text3)', marginBottom:3, fontWeight:600 }}>INPUT</div>
                                  <pre style={{ margin:0, fontSize:11, color:'var(--fg-text2)', fontFamily:'var(--fg-font-mono)', whiteSpace:'pre-wrap', wordBreak:'break-all', background:'var(--fg-bg)', padding:'6px 8px', borderRadius:6, maxHeight:120, overflowY:'auto' }}>{JSON.stringify(tc.args, null, 2)}</pre>
                                </div>
                                {tc.result && (
                                  <div>
                                    <div style={{ fontSize:10, color:'var(--fg-text3)', marginBottom:3, fontWeight:600 }}>OUTPUT</div>
                                    <pre style={{ margin:0, fontSize:11, color:'var(--fg-green)', fontFamily:'var(--fg-font-mono)', whiteSpace:'pre-wrap', wordBreak:'break-all', background:'var(--fg-bg)', padding:'6px 8px', borderRadius:6, maxHeight:200, overflowY:'auto' }}>{tc.result.slice(0, 800)}{tc.result.length > 800 ? '\n…(truncated)' : ''}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {messages.map((m, i) => {
                    // Extract first code block for inline preview
                    const extracted = m.role === 'assistant' ? extractCodeBlock(m.content) : null;
                    const codeBlock = extracted?.code || null;
                    const isHtml = extracted?.isHtml || false;
                    const msgKey = m.id || String(i);
                    const previewMode = inlinePreviews[msgKey] || (isHtml ? 'preview' : 'code');
                    return (
                    <div key={msgKey} style={{ display:'flex', gap:12, alignItems:'flex-start', flexDirection:m.role==='user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:m.role==='user' ? 'var(--fg-orange)' : 'var(--fg-bg4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                        {m.role==='user' ? '👤' : '⚡'}
                      </div>
                      <div style={{ maxWidth: codeBlock ? '90%' : '75%', flex: codeBlock ? 1 : undefined, padding:'12px 16px', borderRadius:m.role==='user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background:m.role==='user' ? 'var(--fg-bg4)' : 'var(--fg-bg3)', border:'1px solid var(--fg-border)', lineHeight:1.6 }}>
                        <div style={{ margin:0, fontSize:14, color:'var(--fg-text)', whiteSpace:'pre-wrap', wordBreak:'break-word', lineHeight:1.7 }}>{renderContent(m.content)}</div>
                        {/* Inline live preview card */}
                        {codeBlock && (
                          <div style={{ marginTop:12, border:'1px solid var(--fg-border2)', borderRadius:10, overflow:'hidden' }}>
                            {/* Preview toolbar */}
                            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'var(--fg-bg)', borderBottom:'1px solid var(--fg-border)' }}>
                              <span style={{ fontSize:11, color:'var(--fg-orange)', fontWeight:600, marginRight:4 }}>⚡ Live Preview</span>
                              <button onClick={() => setInlinePreviews(p => ({ ...p, [msgKey]: 'code' }))} style={{ padding:'3px 10px', background: previewMode==='code' ? 'var(--fg-orange)' : 'var(--fg-bg3)', border:'none', borderRadius:5, color: previewMode==='code' ? '#fff' : 'var(--fg-text3)', fontSize:11, cursor:'pointer', fontWeight:600 }}>Code</button>
                              <button onClick={() => setInlinePreviews(p => ({ ...p, [msgKey]: 'preview' }))} style={{ padding:'3px 10px', background: previewMode==='preview' ? 'var(--fg-orange)' : 'var(--fg-bg3)', border:'none', borderRadius:5, color: previewMode==='preview' ? '#fff' : 'var(--fg-text3)', fontSize:11, cursor:'pointer', fontWeight:600 }}>Preview</button>
                              <button onClick={() => { navigator.clipboard.writeText(codeBlock); }} style={{ marginLeft:'auto', padding:'3px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:5, color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }}>📋 Copy</button>
                              <button onClick={() => downloadCode(codeBlock, extracted?.suggestedFilename || (isHtml ? 'output.html' : 'output.txt'))} style={{ padding:'3px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:5, color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }} title="Download file">💾 Download</button>
                              <button onClick={() => { setPreviewCode(codeBlock); setSketchMode(true); }} style={{ padding:'3px 8px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:5, color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }} title="Open in Sketch panel">× Expand</button>
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
                  {/* Persistent thinking steps — shown after response arrives */}
                  {!typing && lastThinkingSteps.length > 0 && (
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start', maxWidth:680 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--fg-bg4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>⚡</div>
                      <div style={{ flex:1, borderRadius:'4px 18px 18px 18px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', overflow:'hidden' }}>
                        <button onClick={() => setThinkingExpanded(p => !p)} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                          <span style={{ fontSize:11, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)' }}>🧠 Forge thought for {lastThinkingSteps.length} step{lastThinkingSteps.length !== 1 ? 's' : ''}</span>
                          <span style={{ fontSize:11, color:'var(--fg-text3)', marginLeft:'auto' }}>{thinkingExpanded ? '▲' : '▼'}</span>
                        </button>
                        {thinkingExpanded && (
                          <div style={{ borderTop:'1px solid var(--fg-border)', display:'flex', flexDirection:'column' }}>
                            {lastThinkingSteps.map((s, i) => (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 14px', borderBottom: i < lastThinkingSteps.length-1 ? '1px solid var(--fg-border)' : 'none' }}>
                                <span style={{ fontSize:12 }}>{s.icon}</span>
                                <span style={{ fontSize:11, color:'var(--fg-text3)' }}>{s.text}</span>
                                <span style={{ fontSize:10, color:'var(--fg-green)', marginLeft:'auto' }}>✓</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {typing && (
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start', maxWidth:680 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--fg-orange)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, boxShadow:'0 0 12px rgba(249,115,22,0.4)' }}>⚡</div>
                      {/* Manus-style full activity feed */}
                      <div style={{ flex:1, borderRadius:'4px 18px 18px 18px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border2)', overflow:'hidden' }}>
                        {/* Header */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom: agentSteps.length > 0 ? '1px solid var(--fg-border)' : 'none', background:'var(--fg-bg3)' }}>
                          <div style={{ display:'flex', gap:3 }}>
                            {[0,1,2].map(i => <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'var(--fg-orange)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                          </div>
                          <span style={{ fontSize:11, color:'var(--fg-orange)', fontWeight:700, letterSpacing:'0.5px', fontFamily:'var(--fg-font-mono)' }}>FORGE AGENT — WORKING</span>
                        </div>
                        {/* Live steps — each one shown in full */}
                        {agentSteps.length > 0 && (
                          <div style={{ display:'flex', flexDirection:'column' }}>
                            {agentSteps.slice(-12).map((s, i, arr) => {
                              const isLast = i === arr.length - 1;
                              // Parse tool details out of step text
                              const isToolStep = s.text.startsWith('Tool:');
                              const isSearchStep = s.icon === '🔍' || (isToolStep && s.text.includes('web_search'));
                              const isScrapeStep = s.icon === '🌐' || (isToolStep && s.text.includes('web_scrape'));
                              const isBrowserStep = s.icon === '🖥' || (isToolStep && s.text.includes('browser'));
                              const isCodeStep = isToolStep && s.text.includes('run_code');
                              const isShellStep = isToolStep && s.text.includes('shell_exec');

                              return (
                                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 14px', borderBottom: i < arr.length-1 ? '1px solid var(--fg-border)' : 'none', background: isLast ? 'rgba(249,115,22,0.04)' : 'transparent', transition:'background 0.2s' }}>
                                  {/* Timeline dot */}
                                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:3, flexShrink:0 }}>
                                    <div style={{ width:8, height:8, borderRadius:'50%', background: isLast ? 'var(--fg-orange)' : 'var(--fg-green)', boxShadow: isLast ? '0 0 8px var(--fg-orange)' : 'none', animation: isLast ? 'pulse 1s ease-in-out infinite' : 'none' }} />
                                    {i < arr.length-1 && <div style={{ width:1, height:16, background:'var(--fg-border)', marginTop:3 }} />}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                      <span style={{ fontSize:13 }}>{s.icon}</span>
                                      <span style={{ fontSize:12, color: isLast ? 'var(--fg-text)' : 'var(--fg-text3)', fontWeight: isLast ? 600 : 400, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', animation: isLast ? 'forge-text-flash 2s ease-in-out infinite' : 'none' }}>{s.text}</span>
                                      {!isLast && <span style={{ fontSize:10, color:'var(--fg-green)', flexShrink:0, fontWeight:700 }}>✓</span>}
                                    </div>
                                    {/* Show extracted detail for tool steps */}
                                    {isToolStep && (
                                      <div style={{ marginTop:4, fontSize:11, color:'var(--fg-text3)', fontFamily:'var(--fg-font-mono)', background:'var(--fg-bg)', padding:'4px 8px', borderRadius:6, wordBreak:'break-all' }}>
                                        {isSearchStep && <span>🔍 Searching: <span style={{ color:'var(--fg-orange2)' }}>{s.text.replace('Tool: web_search(','').replace(')','').replace(/[{}"query:]/g,'').slice(0,80)}</span></span>}
                                        {isScrapeStep && <span>🌐 Reading: <span style={{ color:'var(--fg-orange2)' }}>{s.text.replace('Tool: web_scrape(','').replace(')','').replace(/[{}"url:]/g,'').slice(0,80)}</span></span>}
                                        {isBrowserStep && <span>🖥 Browser: <span style={{ color:'var(--fg-orange2)' }}>{s.text.slice(0,80)}</span></span>}
                                        {isCodeStep && <span>💻 Executing code…</span>}
                                        {isShellStep && <span>🖥 Shell: <span style={{ color:'var(--fg-orange2)' }}>{s.text.replace('Tool: shell_exec(','').replace(')','').replace(/[{}"command:]/g,'').slice(0,80)}</span></span>}
                                        {!isSearchStep && !isScrapeStep && !isBrowserStep && !isCodeStep && !isShellStep && <span>{s.text.slice(0,100)}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Live tool calls inline during thinking */}
                        {liveToolCalls.length > 0 && (
                          <div style={{ padding:'8px 14px', borderTop:'1px solid var(--fg-border)', display:'flex', flexDirection:'column', gap:4 }}>
                            <div style={{ fontSize:10, color:'var(--fg-text3)', fontWeight:700, letterSpacing:'0.5px', marginBottom:2 }}>⚡ TOOLS ACTIVE ({liveToolCalls.length})</div>
                            {liveToolCalls.map((tc, idx) => (
                              <div key={idx} style={{ borderRadius:6, border:'1px solid var(--fg-border2)', overflow:'hidden', background:'var(--fg-bg3)' }}>
                                <div onClick={() => setExpandedTools(p => ({ ...p, [idx]: !p[idx] }))} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', cursor:'pointer' }}>
                                  <span style={{ fontSize:12 }}>{tc.tool==='web_search'?'🔍':tc.tool==='web_scrape'?'🌐':tc.tool==='run_code'?'💻':tc.tool==='shell_exec'?'🖥':tc.tool==='browser_action'?'🖱':tc.tool==='http_request'?'📡':'🔧'}</span>
                                  <span style={{ fontSize:11, color:'var(--fg-text)', fontFamily:'var(--fg-font-mono)', fontWeight:600 }}>{tc.tool}</span>
                                  <span style={{ fontSize:11, color:'var(--fg-orange2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {tc.tool==='web_search' ? `"${tc.args?.query}"` : tc.tool==='web_scrape'||tc.tool==='browser_action' ? (tc.args?.url||tc.args?.action||'') : tc.tool==='run_code' ? `${tc.args?.language}` : tc.tool==='shell_exec' ? tc.args?.command?.slice(0,60) : tc.tool==='http_request' ? `${tc.args?.method||'GET'} ${tc.args?.url}` : JSON.stringify(tc.args||{}).slice(0,50)}
                                  </span>
                                  <span style={{ fontSize:10, color:'var(--fg-text3)' }}>{expandedTools[idx]?'▲':'▼'}</span>
                                </div>
                                {expandedTools[idx] && (
                                  <div style={{ borderTop:'1px solid var(--fg-border)', padding:'6px 8px', display:'flex', flexDirection:'column', gap:4 }}>
                                    <pre style={{ margin:0, fontSize:11, color:'var(--fg-text2)', fontFamily:'var(--fg-font-mono)', whiteSpace:'pre-wrap', wordBreak:'break-all', background:'var(--fg-bg)', padding:'4px 6px', borderRadius:4, maxHeight:80, overflowY:'auto' }}>{JSON.stringify(tc.args,null,2)}</pre>
                                    {tc.result && <pre style={{ margin:0, fontSize:11, color:'var(--fg-green)', fontFamily:'var(--fg-font-mono)', whiteSpace:'pre-wrap', wordBreak:'break-all', background:'var(--fg-bg)', padding:'4px 6px', borderRadius:4, maxHeight:120, overflowY:'auto' }}>{tc.result.slice(0,600)}{tc.result.length>600?'\n…':''}</pre>}
                                  </div>
                                )}
                              </div>
                            ))}
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
                  {/* Agent Q&A — Claude-style with option chips + free text */}
                  {agentQuestion && (() => {
                    // Parse options from question like "1. Option A\n2. Option B\n3. Other"
                    const lines = agentQuestion.question.split('\n');
                    const questionText = lines[0];
                    const options = lines.slice(1).filter(l => /^\d+[\.\)]/.test(l.trim())).map(l => l.replace(/^\d+[\.\)]\s*/,'').trim());
                    const answerOpt = (opt: string) => { agentQuestion.resolve(opt); setAgentQuestion(null); setAgentAnswer(''); };
                    return (
                      <div style={{ margin:'12px 24px 0', background:'var(--fg-bg2)', border:'1px solid var(--fg-border2)', borderRadius:16, overflow:'hidden' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'linear-gradient(135deg,rgba(255,43,61,0.08),transparent)', borderBottom:'1px solid var(--fg-border)' }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>⚡</div>
                          <div>
                            <p style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--fg-text)' }}>Forge needs your input to continue</p>
                            <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>Agent is paused — answer below to resume</p>
                          </div>
                        </div>
                        <div style={{ padding:'16px' }}>
                          <p style={{ margin:'0 0 14px', fontSize:14, color:'var(--fg-text)', lineHeight:1.6, fontWeight:500 }}>{questionText}</p>
                          {options.length > 0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
                              {options.map((opt,i) => (
                                <button key={i} onClick={() => answerOpt(opt)}
                                  style={{ padding:'8px 16px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:20, color:'var(--fg-text)', fontSize:13, cursor:'pointer', transition:'all 0.15s', fontWeight:500 }}
                                  onMouseEnter={e => { (e.target as HTMLElement).style.background='var(--fg-orange)'; (e.target as HTMLElement).style.borderColor='var(--fg-orange)'; (e.target as HTMLElement).style.color='#fff'; }}
                                  onMouseLeave={e => { (e.target as HTMLElement).style.background='var(--fg-bg4)'; (e.target as HTMLElement).style.borderColor='var(--fg-border2)'; (e.target as HTMLElement).style.color='var(--fg-text)'; }}>
                                  {i+1}. {opt}
                                </button>
                              ))}
                            </div>
                          )}
                          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                            <textarea value={agentAnswer} onChange={e => setAgentAnswer(e.target.value)}
                              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey&&agentAnswer.trim()){e.preventDefault();answerOpt(agentAnswer.trim());}}}
                              placeholder={options.length > 0 ? 'Or type a custom answer...' : 'Type your answer... (Enter to send)'}
                              rows={2} autoFocus
                              style={{ flex:1, padding:'10px 12px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:10, color:'var(--fg-text)', fontSize:13, outline:'none', resize:'none', lineHeight:1.5 }} />
                            <button onClick={() => { if(agentAnswer.trim()) answerOpt(agentAnswer.trim()); }} disabled={!agentAnswer.trim()}
                              style={{ padding:'10px 18px', background:agentAnswer.trim()?'var(--fg-orange)':'var(--fg-bg4)', border:'none', borderRadius:10, color:agentAnswer.trim()?'#fff':'var(--fg-text3)', fontSize:13, fontWeight:700, cursor:agentAnswer.trim()?'pointer':'default', flexShrink:0 }}>
                              Send ↵
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {sending && agentSteps.length > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 16px', fontSize:11, color:'var(--fg-text3)' }}>
                      <span>⚙️</span>
                      <span style={{ color:'var(--fg-orange2)' }}>
                        {agentSteps[agentSteps.length-1]?.text?.includes('web_search') ? '🔍 Searching web...'
                          : agentSteps[agentSteps.length-1]?.text?.includes('web_scrape') ? '🌐 Reading page...'
                          : agentSteps[agentSteps.length-1]?.text?.includes('run_code') ? '💻 Running code...'
                          : agentSteps[agentSteps.length-1]?.text || 'Thinking...'}
                      </span>
                      <span>┬╖ {messages.length} in context</span>
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
                  {/* Token optimization hint — shown after conversation has tokens */}
                  {!sending && messages.length >= 4 && threadStats && threadStats.total_tokens > 0 && (() => {
                    const tokens = threadStats.total_tokens;
                    const msgs = threadStats.message_count || messages.length;
                    const avgPerMsg = Math.round(tokens / Math.max(msgs, 1));
                    const tips: string[] = [];
                    if (tokens > 50000) tips.push('Use shorter follow-ups — this thread is getting long. Start a new chat for new topics.');
                    if (avgPerMsg > 2000) tips.push('Your messages are long. Try bullet points or split into smaller questions to save tokens.');
                    if (tokens > 20000 && msgs < 6) tips.push('Long initial prompt detected. Use system instructions once, then ask short follow-ups.');
                    if (tips.length === 0 && tokens > 10000) tips.push('💡 Tip: Reference previous answers with "as above" instead of repeating context.');
                    if (tips.length === 0) return null;
                    return (
                      <div style={{ margin:'0 32px 12px', padding:'8px 14px', background:'rgba(255,43,61,0.06)', border:'1px solid rgba(255,43,61,0.2)', borderRadius:10, display:'flex', alignItems:'flex-start', gap:8 }}>
                        <span style={{ fontSize:14, flexShrink:0 }}>⚡</span>
                        <div>
                          <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:700, color:'var(--fg-orange)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Token Optimizer ┬╖ {tokens.toLocaleString()} used ┬╖ ~${((tokens/1000000)*3).toFixed(4)}</p>
                          <p style={{ margin:0, fontSize:12, color:'var(--fg-text2)', lineHeight:1.5 }}>{tips[0]}</p>
                        </div>
                      </div>
                    );
                  })()}
                  <div ref={messagesEndRef} />
                </div>
                {showScrollDown && (
                  <button onClick={() => { setUserScrolledUp(false); messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }}
                    style={{ position:'absolute', bottom:110, right:24, zIndex:50, width:34, height:34, borderRadius:'50%', background:'var(--fg-orange)', border:'none', color:'#fff', fontSize:18, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.5)' }}>×</button>
                )}

                {/* Live activity shown in 📺 toolbar button only — no inline overlay */}

                {/* ForgeOptimizer Panel */}
                {optimizerOpen && (optimizerData || optimizerRunning) && (
                  <div style={{ margin:'0 24px 12px', background:'var(--fg-bg2)', border:'1px solid var(--fg-orange)', borderRadius:14, overflow:'hidden' }}>
                    {optimizerRunning && !optimizerData && (
                      <div style={{ padding:'20px', textAlign:'center', color:'var(--fg-orange)', fontSize:13, fontWeight:700 }}>
                        <span style={{ display:'inline-block', animation:'forge-spin 1s linear infinite', marginRight:8 }}>⚡</span>
                        Analyzing token usage...
                      </div>
                    )}
                    {optimizerData && <>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'linear-gradient(135deg,rgba(255,43,61,0.12),transparent)', borderBottom:'1px solid var(--fg-border)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:16 }}>🔧</span>
                        <div>
                          <p style={{ margin:0, fontSize:13, fontWeight:800, color:'var(--fg-orange)', fontFamily:'var(--fg-font-display)' }}>ForgeOptimizer™</p>
                          <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>World's first 90-95% token optimizer</p>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ margin:0, fontSize:20, fontWeight:800, color:'var(--fg-green)', fontFamily:'var(--fg-font-mono)' }}>{optimizerData.savingsPct}%</p>
                          <p style={{ margin:0, fontSize:10, color:'var(--fg-text3)' }}>potential savings</p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ margin:0, fontSize:14, fontWeight:700, color:'var(--fg-green)', fontFamily:'var(--fg-font-mono)' }}>${optimizerData.savedCost}</p>
                          <p style={{ margin:0, fontSize:10, color:'var(--fg-text3)' }}>saved cost</p>
                        </div>
                        <button onClick={() => setOptimizerOpen(false)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:16 }}>×</button>
                      </div>
                    </div>
                    <div style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
                        {optimizerData.suggestions.map((s,i) => (
                          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'6px 10px', background:'var(--fg-bg3)', borderRadius:8, border:'1px solid var(--fg-border)' }}>
                            <span style={{ fontSize:12, flexShrink:0, marginTop:1 }}>{s.auto ? '⚡' : '💡'}</span>
                            <div style={{ flex:1 }}>
                              <p style={{ margin:'0 0 2px', fontSize:12, fontWeight:700, color:'var(--fg-text)' }}>{s.title} <span style={{ color:'var(--fg-green)', fontFamily:'monospace' }}>~{s.tokenSavings.toLocaleString()} tok</span></p>
                              <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)', lineHeight:1.4 }}>{s.description}</p>
                            </div>
                            {s.auto && <span style={{ fontSize:10, color:'var(--fg-green)', fontWeight:700, flexShrink:0 }}>AUTO</span>}
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={applyForgeOptimizer} disabled={optimizerRunning}
                          style={{ flex:1, padding:'8px 16px', background:'linear-gradient(135deg,var(--fg-orange),#f97316)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                          {optimizerRunning ? '⚡ Optimizing...' : `⚡ Apply All (save ${optimizerData.savingsPct}% tokens)`}
                        </button>
                        <button onClick={() => setOptimizerOpen(false)}
                          style={{ padding:'8px 14px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:10, color:'var(--fg-text3)', fontSize:13, cursor:'pointer' }}>
                          Later
                        </button>
                      </div>
                    </div>
                    </>}
                  </div>
                )}

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

                  {/* Attached files compact badge */}
                  {attachedFiles.length > 0 && (
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:16 }}>
                        <span style={{ fontSize:11 }}>📎</span>
                        <span style={{ fontSize:11, color:'var(--fg-text2)' }}>{attachedFiles.length} file{attachedFiles.length!==1?'s':''} attached</span>
                        <button onClick={() => setAttachedFiles([])} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:0, lineHeight:1, marginLeft:2 }} title="Remove all">×</button>
                      </div>
                    </div>
                  )}
                  <div style={{ position:'relative', background:'var(--fg-bg3)', border:`1px solid ${slashOpen ? 'var(--fg-border3)' : 'var(--fg-border2)'}`, borderRadius:12, overflow:'visible' }}>
                    {/* Slash command dropdown */}
                    {slashOpen && (() => {
                      const q = slashQuery.toLowerCase();
                      const filtered = SLASH_COMMANDS.filter(c => c.cmd.startsWith(q) || c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
                      if (!filtered.length) return null;
                      return (
                        <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0, background:'var(--fg-bg2)', border:'1px solid var(--fg-border3)', borderRadius:12, overflow:'hidden', zIndex:200, boxShadow:'0 -8px 32px rgba(0,0,0,0.6)' }}>
                          <div style={{ padding:'6px 12px 4px', fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fg-orange)', borderBottom:'1px solid var(--fg-border)' }}>⚡ Commands</div>
                          <div style={{ maxHeight:280, overflowY:'auto' }}>
                            {(['agent','skill','action','mode'] as const).map(cat => {
                              const items = filtered.filter(c => c.category === cat);
                              if (!items.length) return null;
                              const catLabel: Record<string,string> = { agent:'Agents', skill:'Skills', action:'Actions', mode:'Navigate' };
                              return (
                                <div key={cat}>
                                  <div style={{ padding:'5px 12px 2px', fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fg-text3)' }}>{catLabel[cat]}</div>
                                  {items.map((c, i) => {
                                    const globalIdx = filtered.indexOf(c);
                                    const active = globalIdx === slashIdx;
                                    return (
                                      <div key={c.cmd} onMouseDown={e => { e.preventDefault();
                                        if (c.insert === '__NEW_THREAD__') { newThread(); setSlashOpen(false); setInput(''); return; }
                                        if (c.insert === '__HARVEST__') { harvestMemory(); setSlashOpen(false); setInput(''); return; }
                                        if (c.insert === '__CLEAR__') { setInput(''); setSlashOpen(false); return; }
                                        if (c.insert.startsWith('__TAB_')) { setMainTab(c.insert.replace('__TAB_','') as any); setSlashOpen(false); setInput(''); return; }
                                        setInput(c.insert); setSlashOpen(false); setTimeout(() => textareaRef.current?.focus(), 10);
                                      }} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background: active ? 'rgba(255,31,53,0.1)' : 'transparent', cursor:'pointer', borderLeft: active ? '2px solid var(--fg-orange)' : '2px solid transparent', transition:'all 0.1s' }}>
                                        <span style={{ fontSize:16, flexShrink:0 }}>{c.icon}</span>
                                        <div style={{ flex:1, minWidth:0 }}>
                                          <div style={{ fontSize:13, fontWeight:600, color: active ? 'var(--fg-orange)' : 'var(--fg-text)', letterSpacing:'-0.01em' }}>{c.label}</div>
                                          <div style={{ fontSize:11, color:'var(--fg-text3)', marginTop:1 }}>{c.desc}</div>
                                        </div>
                                        <kbd style={{ fontSize:9, padding:'2px 5px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:4, color:'var(--fg-text3)', flexShrink:0 }}>↑</kbd>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <textarea ref={textareaRef} value={input}
                      onChange={e => {
                        const val = e.target.value;
                        setInput(val);
                        // Slash detection
                        const match = val.match(/(?:^|\n)\/(\S*)$/);
                        if (match) { setSlashOpen(true); setSlashQuery(match[1]); setSlashIdx(0); }
                        else { setSlashOpen(false); setSlashQuery(''); }
                      }}
                      onKeyDown={e => {
                        if (slashOpen) {
                          const q = slashQuery.toLowerCase();
                          const filtered = SLASH_COMMANDS.filter(c => c.cmd.startsWith(q) || c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
                          if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx(i => Math.min(i+1, filtered.length-1)); return; }
                          if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIdx(i => Math.max(i-1, 0)); return; }
                          if (e.key === 'Escape') { setSlashOpen(false); return; }
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            const sel = filtered[slashIdx];
                            if (sel) {
                              e.preventDefault();
                              if (sel.insert === '__NEW_THREAD__') { newThread(); setSlashOpen(false); setInput(''); return; }
                              if (sel.insert === '__HARVEST__') { harvestMemory(); setSlashOpen(false); setInput(''); return; }
                              if (sel.insert === '__CLEAR__') { setInput(''); setSlashOpen(false); return; }
                              if (sel.insert.startsWith('__TAB_')) { setMainTab(sel.insert.replace('__TAB_','') as any); setSlashOpen(false); setInput(''); return; }
                              // Replace the /cmd with the insert text
                              setInput(prev => prev.replace(/(?:^|\n)\/\S*$/, (m) => m.startsWith('\n') ? '\n'+sel.insert : sel.insert));
                              setSlashOpen(false);
                              setTimeout(() => textareaRef.current?.focus(), 10);
                              return;
                            }
                          }
                        }
                        if (e.key==='Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (sending) {
                            if (input.trim()) { setPendingMessage(input.trim()); setInput(''); }
                          } else {
                            sendMessage();
                          }
                        }
                      }}
                      placeholder={sending ? (pendingMessage ? `Queued: "${pendingMessage.slice(0,40)}…"` : 'AI is thinking… press Enter to queue') : (activeThread ? 'Message… or type / for commands' : 'Start a conversation… or type / for commands')}
                      rows={isMobile ? 2 : 3} style={{ width:'100%', padding: isMobile ? '10px 12px 40px' : '14px 16px 44px', background:'transparent', border:'none', color:'var(--fg-text)', fontSize: isMobile ? 15 : 14, resize:'none', outline:'none', lineHeight:1.6, boxSizing:'border-box' }} />
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
                        {/* Slash command button */}
                        <button onClick={() => { setSlashOpen(true); textareaRef.current?.focus(); }} title="Commands" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'5px 8px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-orange)', cursor:'pointer', fontSize:14, fontWeight:700 }}>/</button>
                        {/* Voice button */}
                        <button onClick={toggleVoice} title={voiceActive ? 'Stop recording' : 'Voice input'} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', background:voiceActive ? 'var(--fg-orange)' : 'var(--fg-odim)', border:`1px solid ${voiceActive ? 'var(--fg-orange2)' : 'var(--fg-odim2)'}`, borderRadius:8, color:voiceActive ? '#fff' : 'var(--fg-orange2)', cursor:'pointer', fontSize:12, fontWeight:600, animation:voiceActive ? 'send-pulse 0.9s ease-in-out infinite' : 'none' }}>🎤 {voiceActive ? '⏺ Rec' : 'Voice'}</button>
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
                        <button onClick={() => { setShowNewTask(true); }} title="New task" style={{ padding:'4px 8px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:6, color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>✓</button>
                        {/* Mode pills in input bar */}
                        <div style={{ display:'flex', gap:3, marginLeft:4 }}>
                          <button onClick={() => setSuperMode('forgeAsk')} title="Ask mode — confirms skills/connectors before task" style={{ padding:'3px 8px', background: superMode==='forgeAsk' ? 'var(--fg-orange)' : 'var(--fg-bg4)', border:`1px solid ${superMode==='forgeAsk' ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:6, color: superMode==='forgeAsk' ? '#fff' : 'var(--fg-text3)', fontSize:10, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>🙋 Ask</button>
                          <button onClick={() => setSuperMode('forgeMagic')} title="Magic mode — auto-loads all tools, skills, hooks & connectors" style={{ padding:'3px 8px', background: superMode==='forgeMagic' ? 'var(--fg-orange)' : 'var(--fg-bg4)', border:`1px solid ${superMode==='forgeMagic' ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, borderRadius:6, color: superMode==='forgeMagic' ? '#fff' : 'var(--fg-text3)', fontSize:10, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>✨ Magic</button>
                        </div>
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
                          style={{ width:34, height:34, background: input.trim() ? 'var(--fg-btn-grad)' : sending ? 'rgba(255,31,53,0.2)' : 'var(--fg-bg4)', border:'none', borderRadius:10, color:'#fff', cursor: input.trim() ? 'pointer' : 'default', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', animation: sending && !input.trim() ? 'send-pulse 0.9s ease-in-out infinite' : 'none', transition:'all 0.18s', boxShadow: input.trim() ? '0 0 12px rgba(255,31,53,0.3)' : 'none' }}
                        >
                          {sending && !input.trim() ? '⚡' : input.trim() && sending ? '⌛' : '↵'}
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
                      {id:'tracker',icon:'📌'},{id:'agents',icon:'🧠'},
                      {id:'tools',icon:'🛠'},{id:'hooks',icon:'🪝'},{id:'runs',icon:'🏃'},
                      {id:'agent',icon:'🤖'},{id:'artifacts',icon:'📄'},{id:'tasks',icon:'✓'},
                      {id:'live',icon:'📺'},{id:'schedule',icon:'📅'},{id:'context',icon:'📊'},
                      {id:'browser',icon:'🌐'},{id:'terminal',icon:'💻'},{id:'dispatch',icon:'🚀'},
                    ] as const).map(tab => (
                      <button key={tab.id} onClick={() => setRightTab(tab.id as any)} title={tab.id} style={{ flex:'0 0 auto', padding:'10px 8px', background:'none', border:'none', borderBottom:rightTab===tab.id ? '2px solid var(--fg-orange)' : '2px solid transparent', color:rightTab===tab.id ? 'var(--fg-orange2)' : 'var(--fg-text3)', cursor:'pointer', fontSize:14 }}>{tab.icon}</button>
                    ))}
                  </div>

                  <div style={{ flex:1, overflowY:'auto', padding:12 }}>
                    {/* PROGRESS TRACKER */}
                    {rightTab==='tracker' && (
                      <div>

                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                          <p style={{ color:'var(--fg-orange2)', fontSize:12, fontWeight:700, textTransform:'uppercase', margin:0, letterSpacing:'0.5px' }}>📌 Progress Tracker</p>
                          <span style={{ fontSize:10, color:'var(--fg-text3)' }}>{visibleTrackerItems.filter(i=>i.done).length}/{visibleTrackerItems.length} done</span>
                        </div>

                        {/* Progress bar */}
                        {visibleTrackerItems.length > 0 && (
                          <div style={{ marginBottom:12, height:6, background:'var(--fg-bg3)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', background:'var(--fg-orange)', borderRadius:3, width:`${(visibleTrackerItems.filter(i=>i.done).length/visibleTrackerItems.length)*100}%`, transition:'width 0.3s' }} />
                          </div>
                        )}

                        {/* Add item input */}
                        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                          <input
                            value={trackerInput}
                            onChange={e => setTrackerInput(e.target.value)}
                            onKeyDown={e => e.key==='Enter' && addTrackerItem()}
                            placeholder="Add a goal or task..."
                            style={{ flex:1, padding:'7px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text)', fontSize:12, outline:'none' }}
                          />
                          <button onClick={addTrackerItem} style={{ padding:'7px 12px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>+</button>
                        </div>

                        {/* Tracker items — scrollable, max 5 active */}
                        <div style={{ overflowY:'auto', maxHeight:300 }}>
                        {activeTrackerItems.length === 0 && archivedTrackerItems.length === 0 && (
                          <div style={{ textAlign:'center', padding:'24px 12px', color:'var(--fg-text3)', fontSize:12 }}>
                            <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
                            <p style={{ margin:0 }}>No goals yet. Add your first goal above.</p>
                            <p style={{ margin:'8px 0 0', fontSize:11 }}>Track MVPs, project milestones, and deliverables here.</p>
                          </div>
                        )}

                        {['high','medium','low'].map(priority => {
                          const items = activeTrackerItems.filter(i => i.priority === priority);
                          if (items.length === 0) return null;
                          const colors: Record<string,string> = { high:'var(--fg-red,#ef4444)', medium:'var(--fg-orange)', low:'var(--fg-text3)' };
                          return (
                            <div key={priority} style={{ marginBottom:10 }}>
                              <p style={{ fontSize:10, color:colors[priority], fontWeight:700, textTransform:'uppercase', margin:'0 0 5px', letterSpacing:'0.5px' }}>{priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'} {priority}</p>
                              {items.map(item => (
                                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background: item.done ? 'var(--fg-bg3)' : 'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:8, marginBottom:4, opacity: item.done ? 0.6 : 1 }}>
                                  <button onClick={() => saveTracker(visibleTrackerItems.map(i => i.id===item.id ? {...i,done:!i.done} : i))}
                                    style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${item.done ? 'var(--fg-orange)' : 'var(--fg-border2)'}`, background: item.done ? 'var(--fg-orange)' : 'transparent', cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                                    {item.done && <span style={{ fontSize:9, color:'#fff' }}>✓</span>}
                                  </button>
                                  {trackerEditId === item.id ? (
                                    <input autoFocus value={trackerEditText} onChange={e => setTrackerEditText(e.target.value)}
                                      onKeyDown={e => { if(e.key==='Enter') { saveTracker(visibleTrackerItems.map(i=>i.id===item.id?{...i,text:trackerEditText}:i)); setTrackerEditId(null); } if(e.key==='Escape') setTrackerEditId(null); }}
                                      onBlur={() => { saveTracker(visibleTrackerItems.map(i=>i.id===item.id?{...i,text:trackerEditText}:i)); setTrackerEditId(null); }}
                                      style={{ flex:1, background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:5, color:'var(--fg-text)', fontSize:12, padding:'2px 6px', outline:'none' }}
                                    />
                                  ) : (
                                    <span onClick={() => { setTrackerEditId(item.id); setTrackerEditText(item.text); }}
                                      style={{ flex:1, fontSize:12, color: item.done ? 'var(--fg-text3)' : 'var(--fg-text)', textDecoration: item.done ? 'line-through' : 'none', cursor:'text', wordBreak:'break-word' }}>
                                      {item.text}
                                    </span>
                                  )}
                                  <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                                    <select value={item.priority} onChange={e => saveTracker(visibleTrackerItems.map(i=>i.id===item.id?{...i,priority:e.target.value as any}:i))}
                                      style={{ fontSize:10, background:'var(--fg-bg4)', border:'1px solid var(--fg-border)', borderRadius:4, color:'var(--fg-text3)', padding:'1px 3px', cursor:'pointer' }}>
                                      <option value="high">🔴</option><option value="medium">🟡</option><option value="low">🟢</option>
                                    </select>
                                    <button onClick={() => saveTracker(visibleTrackerItems.filter(i=>i.id!==item.id))} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:'0 2px' }}>×</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}

                        {visibleTrackerItems.length > 0 && (
                          <div style={{ display:'flex', gap:6, marginTop:8 }}>
                            <button onClick={() => saveTracker(visibleTrackerItems.filter(i=>!i.done))} style={{ flex:1, padding:'5px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:7, color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }}>Clear done</button>
                            <button onClick={() => saveTracker([])} style={{ flex:1, padding:'5px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:7, color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }}>Clear all</button>
                          </div>
                        )}
                        </div>{/* end tracker scroll */}
                        {archivedTrackerItems.length > 0 && (
                          <div style={{ marginTop:6, borderTop:'1px solid var(--fg-border)', paddingTop:6 }}>
                            <button onClick={() => setShowTrackerArchive(p => !p)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11, padding:'2px 0', display:'flex', alignItems:'center', gap:4 }}>
                              <span>{showTrackerArchive ? 'v' : '>'}</span>
                              <span>Archive ({archivedTrackerItems.length} done)</span>
                            </button>
                            {showTrackerArchive && archivedTrackerItems.map(item => (
                              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', opacity:0.6, fontSize:12 }}>
                                <span style={{ color:'var(--fg-green)' }}>✓</span>
                                <span style={{ flex:1, textDecoration:'line-through', color:'var(--fg-text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.text}</span>
                                <button onClick={() => saveTracker(visibleTrackerItems.filter(i => i.id !== item.id))} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:11 }}>x</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Chat Files section */}
                        <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid var(--fg-border)' }}>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'0 0 8px', letterSpacing:'0.5px' }}>💬 Chat Folders</p>
                          {threads.length === 0 && <p style={{ fontSize:11, color:'var(--fg-text3)', textAlign:'center', margin:'12px 0' }}>No chats yet</p>}
          {[...threads].sort((a,b) => (pinnedThreads.has(b.id)?1:0)-(pinnedThreads.has(a.id)?1:0)).slice(0,10).map(t => {
                              const isWarning = inactiveWarnings.has(t.id);
                              const pinned = pinnedThreads.has(t.id);
                              const togglePin = (id:string) => {
                                const next = new Set(pinnedThreads);
                                next.has(id) ? next.delete(id) : next.add(id);
                                setPinnedThreads(next);
                                try { localStorage.setItem('forge_pinned_threads', JSON.stringify([...next])); } catch {}
                              };
                              return (
                                <div key={t.id} style={{ padding:'7px 10px', background: isWarning ? 'rgba(249,115,22,0.08)' : 'var(--fg-bg3)', border:`1px solid ${pinned?'var(--fg-orange)':isWarning?'var(--fg-border3)':'var(--fg-border)'}`, borderRadius:8, marginBottom:4 }}>
                                  {folderRenamingId === t.id ? (
                                    <input autoFocus value={folderRenameVal} onChange={e => setFolderRenameVal(e.target.value)}
                                      onKeyDown={e => { if(e.key==='Enter') { setThreads(prev => prev.map(th => th.id===t.id ? {...th,title:folderRenameVal} : th)); setFolderRenamingId(null); } if(e.key==='Escape') setFolderRenamingId(null); }}
                                      onBlur={() => { setThreads(prev => prev.map(th => th.id===t.id ? {...th,title:folderRenameVal} : th)); setFolderRenamingId(null); }}
                                      style={{ width:'100%', background:'var(--fg-bg)', border:'1px solid var(--fg-orange)', borderRadius:5, padding:'2px 6px', color:'var(--fg-text)', fontSize:12 }} />
                                  ) : (
                                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                      <span onClick={() => { setActiveThread(t); setMainTab('workspace'); }} style={{ fontSize:12, color:'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, cursor:'pointer' }}>
                                        {pinned && <span style={{ marginRight:4 }}>📌</span>}{t.title || 'Untitled'}
                                      </span>
                                      <button onClick={() => togglePin(t.id)} title={pinned?'Unpin':'Pin'} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color: pinned?'var(--fg-orange)':'var(--fg-text3)', padding:'0 2px', flexShrink:0 }}>📌</button>
                                      <button onClick={() => { setFolderRenamingId(t.id); setFolderRenameVal(t.title||''); }} title="Rename" style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'var(--fg-text3)', padding:'0 2px', flexShrink:0 }}>📝</button>
                                      <button onClick={() => deleteThread(t.id)} title="Delete" style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'var(--fg-text3)', padding:'0 2px', flexShrink:0 }}>🗑</button>
                                    </div>
                                  )}
                                  {isWarning && <p style={{ margin:'3px 0 0', fontSize:10, color:'var(--fg-orange)' }}>⏰ Deletes after 24h of inactivity</p>}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* READY-MADE AGENTS */}
                    {rightTab==='agents' && (() => {
                      const agentGroups = [
                        { group:'💼 Business', agents:[
                          { id:'ceo_advisor', icon:'👔', name:'CEO Advisor', desc:'Strategic decisions, company direction, investor updates' },
                          { id:'marketer', icon:'📢', name:'Marketing Pro', desc:'Campaigns, copy, brand voice, social media strategy' },
                          { id:'sales_coach', icon:'🤝', name:'Sales Coach', desc:'Outreach, objection handling, closing techniques, CRM' },
                          { id:'finance_analyst', icon:'💰', name:'Finance Analyst', desc:'P&L, budgets, cash flow, financial modeling, forecasts' },
                          { id:'legal_advisor', icon:'⚖️', name:'Legal Advisor', desc:'Contracts, compliance, IP, NDAs, business terms' },
                          { id:'hr_manager', icon:'👥', name:'HR Manager', desc:'Hiring, onboarding, culture, performance reviews' },
                          { id:'product_manager', icon:'🎯', name:'Product Manager', desc:'PRDs, roadmaps, user stories, prioritization frameworks' },
                          { id:'data_scientist', icon:'📊', name:'Data Scientist', desc:'Analysis, visualization, ML models, insights' },
                          { id:'customer_support', icon:'🎧', name:'Customer Support', desc:'Ticket triage, responses, escalation, knowledge base' },
                          { id:'operations', icon:'⚙️', name:'Operations Lead', desc:'Process optimization, SOPs, workflows, logistics' },
                        ]},
                        { group:'🧑 Individual', agents:[
                          { id:'personal_coach', icon:'🏋', name:'Life Coach', desc:'Goals, habits, productivity, mindset, accountability' },
                          { id:'writer', icon:'✍️', name:'Writer', desc:'Essays, stories, scripts, emails, any written content' },
                          { id:'researcher', icon:'🔬', name:'Researcher', desc:'Deep research, fact-checking, summarizing papers' },
                          { id:'tutor', icon:'📚', name:'Tutor', desc:'Explain concepts, teach skills, quizzes, study plans' },
                          { id:'developer', icon:'💻', name:'Software Developer', desc:'Code, debug, architecture, code review, deploy' },
                          { id:'designer', icon:'🎨', name:'Designer', desc:'UI/UX, visual design, prototypes, design critique' },
                          { id:'therapist', icon:'🧘', name:'Wellness Guide', desc:'Mental wellness tips, stress management, reflection' },
                          { id:'travel_planner', icon:'✈', name:'Travel Planner', desc:'Itineraries, bookings, visa info, travel tips' },
                          { id:'chef', icon:'🍳', name:'Chef', desc:'Recipes, meal plans, nutrition, cooking techniques' },
                          { id:'financial_planner', icon:'💳', name:'Financial Planner', desc:'Budgeting, savings, investments, debt payoff plans' },
                        ]},
                        { group:'🚀 Builder', agents:[
                          { id:'mvp_builder', icon:'🏗', name:'MVP Builder', desc:'Scope, spec, build and ship a working MVP fast' },
                          { id:'project_manager', icon:'📋', name:'Project Manager', desc:'Plans, timelines, milestones, team coordination' },
                          { id:'pitch_deck', icon:'🎞', name:'Pitch Deck Creator', desc:'Investor decks, storytelling, traction slides' },
                          { id:'seo_expert', icon:'🔍', name:'SEO Expert', desc:'Keywords, on-page SEO, backlinks, content strategy' },
                          { id:'automation', icon:'🤖', name:'Automation Builder', desc:'Workflows, Zapier/Make logic, API integrations' },
                        ]},
                      ];
                      return (
                        <div>
                          <p style={{ color:'var(--fg-orange2)', fontSize:12, fontWeight:700, textTransform:'uppercase', margin:'0 0 4px', letterSpacing:'0.5px' }}>🧠 Ready-made Agents</p>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, margin:'0 0 12px' }}>Activate an agent to load its expertise into your workspace chat.</p>
                          {agentGroups.map(group => (
                            <div key={group.group} style={{ marginBottom:14 }}>
                              <p style={{ fontSize:11, color:'var(--fg-text3)', fontWeight:700, margin:'0 0 6px', letterSpacing:'0.3px' }}>{group.group}</p>
                              {group.agents.map(a => {
                                const isActive = activeAgentId === a.id || activeSkills.has(a.id);
                                return (
                                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background: isActive ? 'var(--fg-odim)' : 'var(--fg-bg3)', border:`1px solid ${isActive ? 'var(--fg-border3)' : 'var(--fg-border)'}`, borderRadius:8, marginBottom:4, cursor:'pointer' }}
                                    onClick={() => {
                                      if (isActive) {
                                        setActiveSkills(prev => { const n=new Set(prev); n.delete(a.id); return n; });
                                        setActiveAgentId(null);
                                      } else {
                                        setActiveSkills(prev => { const n=new Set(prev); n.add(a.id); return n; });
                                        setActiveAgentId(a.id);
                                        setActiveSkillPrompt(`You are a ${a.name}. ${a.desc}. Always provide expert, actionable advice. Be direct, confident, and thorough.`);
                                        setMainTab('workspace');
                                      }
                                    }}>
                                    <span style={{ fontSize:16, flexShrink:0 }}>{a.icon}</span>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <p style={{ margin:0, fontSize:12, color: isActive ? 'var(--fg-orange2)' : 'var(--fg-text)', fontWeight: isActive ? 600 : 400 }}>{a.name}</p>
                                      <p style={{ margin:0, fontSize:10, color:'var(--fg-text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.desc}</p>
                                    </div>
                                    {isActive && <span style={{ fontSize:10, color:'var(--fg-orange)', flexShrink:0, fontWeight:700 }}>ON</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* TOOLS */}
                    {rightTab==='tools' && (() => {
                      const catalog = (window as any).FORGE_CATALOG_DATA;
                      const allSkills: any[] = catalog?.skills || [];
                      const allConnectors: any[] = catalog?.connectors || [];
                      const activeSkillsList = allSkills.filter((s:any) => activeSkills.has(s.id));
                      const activeConnectorsList = allConnectors.filter((c:any) => activeConnectors.has(c.id));
                      const enabledHooks = hooks.filter(h => h.enabled);
                      return (
                      <div>
                        {/* Active summary banner */}
                        {(activeSkills.size > 0 || activeConnectors.size > 0 || enabledHooks.length > 0) ? (
                          <div style={{ marginBottom:12, padding:'10px 12px', background:'var(--fg-odim)', border:'1px solid var(--fg-border3)', borderRadius:10 }}>
                            <p style={{ margin:'0 0 8px', fontSize:10, color:'var(--fg-orange)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>⚡ Active in this chat</p>
                            {activeSkillsList.map((s:any) => (
                              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                <span style={{ fontSize:14 }}>{s.icon || '🧩'}</span>
                                <span style={{ fontSize:12, color:'var(--fg-text)', flex:1 }}>{s.name}</span>
                                <button onClick={() => setActiveSkills(prev => { const n=new Set(prev); n.delete(s.id); return n; })} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:0 }}>×</button>
                              </div>
                            ))}
                            {activeConnectorsList.map((c:any) => (
                              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                <span style={{ fontSize:14 }}>{c.icon || '🔌'}</span>
                                <span style={{ fontSize:12, color:'var(--fg-text)', flex:1 }}>{c.name}</span>
                                <button onClick={() => setActiveConnectors(prev => { const n=new Set(prev); n.delete(c.id); return n; })} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:12, padding:0 }}>×</button>
                              </div>
                            ))}
                            {enabledHooks.map(h => (
                              <div key={h.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                <span style={{ fontSize:14 }}>🪝</span>
                                <span style={{ fontSize:12, color:'var(--fg-text)', flex:1 }}>{h.event} → {h.target}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginBottom:12, padding:'8px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, textAlign:'center' }}>
                            <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>No skills or connectors active</p>
                          </div>
                        )}

                        {/* SKILLS from catalog */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0, letterSpacing:'0.5px' }}>Skills ({activeSkills.size} active)</p>
                          <button onClick={() => setMainTab('skills')} style={{ background:'none', border:'none', color:'var(--fg-orange)', cursor:'pointer', fontSize:10, padding:0 }}>Browse all →</button>
                        </div>
                        {allSkills.length === 0 && <p style={{ fontSize:11, color:'var(--fg-text3)', margin:'0 0 10px' }}>No skills loaded</p>}
                        {allSkills.slice(0, 12).map((s:any) => (
                          <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', background: activeSkills.has(s.id) ? 'var(--fg-odim)' : 'var(--fg-bg3)', border:`1px solid ${activeSkills.has(s.id) ? 'var(--fg-border3)' : 'var(--fg-border)'}`, borderRadius:8, marginBottom:4 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                              <span style={{ fontSize:14, flexShrink:0 }}>{s.icon || '🧩'}</span>
                              <span style={{ fontSize:11, color: activeSkills.has(s.id) ? 'var(--fg-orange2)' : 'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
                            </div>
                            <button onClick={() => setActiveSkills(prev => { const n=new Set(prev); n.has(s.id)?n.delete(s.id):n.add(s.id); return n; })} style={{ width:34, height:18, borderRadius:9, border:'none', cursor:'pointer', background: activeSkills.has(s.id) ? 'var(--fg-orange)' : 'var(--fg-bg5)', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                              <span style={{ position:'absolute', top:2, left: activeSkills.has(s.id) ? 16 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                            </button>
                          </div>
                        ))}
                        {allSkills.length > 12 && (
                          <button onClick={() => setMainTab('skills')} style={{ width:'100%', padding:'5px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:7, color:'var(--fg-text3)', fontSize:11, cursor:'pointer', marginBottom:10 }}>+{allSkills.length - 12} more skills →</button>
                        )}

                        {/* CONNECTORS from catalog */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'12px 0 6px' }}>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0, letterSpacing:'0.5px' }}>Connectors ({activeConnectors.size} active)</p>
                          <button onClick={() => setMainTab('skills')} style={{ background:'none', border:'none', color:'var(--fg-orange)', cursor:'pointer', fontSize:10, padding:0 }}>Browse all →</button>
                        </div>
                        {allConnectors.length === 0 && <p style={{ fontSize:11, color:'var(--fg-text3)', margin:'0 0 10px' }}>No connectors loaded</p>}
                        {allConnectors.slice(0, 12).map((c:any) => (
                          <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', background: activeConnectors.has(c.id) ? 'var(--fg-odim)' : 'var(--fg-bg3)', border:`1px solid ${activeConnectors.has(c.id) ? 'var(--fg-border3)' : 'var(--fg-border)'}`, borderRadius:8, marginBottom:4 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                              <span style={{ fontSize:14, flexShrink:0 }}>{c.icon || '🔌'}</span>
                              <span style={{ fontSize:11, color: activeConnectors.has(c.id) ? 'var(--fg-orange2)' : 'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</span>
                            </div>
                            <button onClick={() => setActiveConnectors(prev => { const n=new Set(prev); n.has(c.id)?n.delete(c.id):n.add(c.id); return n; })} style={{ width:34, height:18, borderRadius:9, border:'none', cursor:'pointer', background: activeConnectors.has(c.id) ? 'var(--fg-orange)' : 'var(--fg-bg5)', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                              <span style={{ position:'absolute', top:2, left: activeConnectors.has(c.id) ? 16 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                            </button>
                          </div>
                        ))}
                        {allConnectors.length > 12 && (
                          <button onClick={() => setMainTab('skills')} style={{ width:'100%', padding:'5px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:7, color:'var(--fg-text3)', fontSize:11, cursor:'pointer', marginBottom:10 }}>+{allConnectors.length - 12} more connectors →</button>
                        )}

                        {/* BUILT-IN TOOLS */}
                        <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:'12px 0 6px', letterSpacing:'0.5px' }}>Built-in Tools ({activeTools.size} active)</p>
                        {[
                          { id:'web_search', icon:'🔍', label:'Web Search', desc:'Search Google, Bing, DuckDuckGo' },
                          { id:'browser_navigate', icon:'🌐', label:'Browse Web', desc:'Navigate URLs, read pages' },
                          { id:'browser_batch', icon:'🖥', label:'Browser Batch', desc:'Multi-tab parallel browsing' },
                          { id:'run_code', icon:'⚙️', label:'Run Code', desc:'Execute Python, JS, shell scripts' },
                          { id:'start_process', icon:'◀', label:'Start Process', desc:'Launch and manage processes' },
                          { id:'read_file', icon:'📄', label:'Read Files', desc:'Read any file type' },
                          { id:'write_file', icon:'💾', label:'Write Files', desc:'Create and save files' },
                          { id:'list_directory', icon:'📁', label:'List Directory', desc:'Browse filesystem' },
                          { id:'execute_js', icon:'⚡', label:'Execute JS', desc:'Run JavaScript in browser context' },
                          { id:'screenshot', icon:'📸', label:'Screenshot', desc:'Capture screen or webpage' },
                          { id:'click', icon:'🖱', label:'Click / Interact', desc:'Click buttons, fill forms' },
                          { id:'press_key', icon:'⌨️', label:'Press Key', desc:'Keyboard shortcuts and input' },
                          { id:'webhooks', icon:'🪝', label:'Webhooks', desc:'Send/receive webhook events' },
                          { id:'image_gen', icon:'🎨', label:'Image Gen', desc:'Generate images with AI' },
                          { id:'data_analyze', icon:'📊', label:'Data Analyze', desc:'Analyze CSV, JSON, datasets' },
                          { id:'desktop_commander', icon:'🖥', label:'Desktop Commander', desc:'Control desktop apps' },
                          { id:'computer_use', icon:'🤖', label:'Computer Use', desc:'Full computer automation' },
                          { id:'send_request', icon:'📡', label:'HTTP Request', desc:'GET/POST/PUT to any API' },
                          { id:'read_process', icon:'📟', label:'Read Process Output', desc:'Capture process stdout/stderr' },
                          { id:'commit_deploy', icon:'🚀', label:'Commit & Deploy', desc:'Git commit, push, deploy' },
                          { id:'tool_search', icon:'🔧', label:'Tool Search', desc:'Find and load tools dynamically' },
                          { id:'wait', icon:'⚡', label:'Wait / Delay', desc:'Pause execution, wait for events' },
                          { id:'action', icon:'🎬', label:'Action', desc:'Trigger any automation action' },
                        ].map((t: {id:string;icon:string;label:string;desc:string}) => (
                          <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', background: activeTools.has(t.id) ? 'var(--fg-odim)' : 'var(--fg-bg3)', border:`1px solid ${activeTools.has(t.id) ? 'var(--fg-border3)' : 'var(--fg-border)'}`, borderRadius:8, marginBottom:4 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                              <span style={{ fontSize:13, flexShrink:0 }}>{t.icon}</span>
                              <div style={{ minWidth:0 }}>
                                <p style={{ margin:0, fontSize:11, color: activeTools.has(t.id) ? 'var(--fg-orange2)' : 'var(--fg-text2)', fontWeight: activeTools.has(t.id) ? 600 : 400 }}>{t.label}</p>
                                <p style={{ margin:0, fontSize:10, color:'var(--fg-text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.desc}</p>
                              </div>
                            </div>
                            <button onClick={() => toggleTool(t.id)} style={{ width:34, height:18, borderRadius:9, border:'none', cursor:'pointer', background: activeTools.has(t.id) ? 'var(--fg-green,#22c55e)' : 'var(--fg-bg5)', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                              <span style={{ position:'absolute', top:2, left: activeTools.has(t.id) ? 16 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                            </button>
                          </div>
                        ))}

                        {/* HOOKS */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'12px 0 6px' }}>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0, letterSpacing:'0.5px' }}>Hooks ({enabledHooks.length} active)</p>
                          <button onClick={() => setMainTab('hooks')} style={{ background:'none', border:'none', color:'var(--fg-orange)', cursor:'pointer', fontSize:10, padding:0 }}>Manage →</button>
                        </div>
                        {hooks.length === 0 ? (
                          <p style={{ fontSize:11, color:'var(--fg-text3)', margin:'0 0 8px' }}>No hooks — <button onClick={() => setMainTab('hooks')} style={{ background:'none', border:'none', color:'var(--fg-orange)', cursor:'pointer', fontSize:11, padding:0 }}>add one</button></p>
                        ) : (
                          hooks.map(h => (
                            <div key={h.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', background: h.enabled ? 'var(--fg-odim)' : 'var(--fg-bg3)', border:`1px solid ${h.enabled ? 'var(--fg-border3)' : 'var(--fg-border)'}`, borderRadius:8, marginBottom:4 }}>
                              <div style={{ minWidth:0 }}>
                                <span style={{ fontSize:11, fontFamily:'var(--fg-font-mono)', color: h.enabled ? 'var(--fg-orange)' : 'var(--fg-text3)', fontWeight:600 }}>{h.event}</span>
                                <span style={{ fontSize:10, color:'var(--fg-text3)', marginLeft:5 }}>→ {h.target}</span>
                              </div>
                              <button onClick={() => setHooks(prev => prev.map(x => x.id===h.id ? {...x, enabled:!x.enabled} : x))} style={{ width:34, height:18, borderRadius:9, border:'none', cursor:'pointer', background: h.enabled ? 'var(--fg-orange)' : 'var(--fg-bg5)', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                                <span style={{ position:'absolute', top:2, left: h.enabled ? 16 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      );
                    })()}
                    {/* HOOKS */}
                    {rightTab==='hooks' && (
                      <div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0 }}>Hooks ({hooks.filter(h=>h.enabled).length} active)</p>
                          <button onClick={() => setMainTab('hooks')} style={{ background:'var(--fg-orange)', border:'none', borderRadius:6, color:'#fff', padding:'4px 8px', fontSize:11, cursor:'pointer' }}>+ New</button>
                        </div>
                        {hooks.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:12, textAlign:'center', marginTop:24 }}>No hooks yet.<br/>Hooks fire on workspace events.</p>}
                        {hooks.map(h => (
                          <div key={h.id} style={{ padding:'8px 10px', background:'var(--fg-bg3)', border:`1px solid ${h.enabled ? 'var(--fg-border3)' : 'var(--fg-border)'}`, borderRadius:8, marginBottom:6 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                              <span style={{ fontSize:11, fontFamily:'var(--fg-font-mono)', color:'var(--fg-orange)', fontWeight:600 }}>{h.event}</span>
                              <span style={{ marginLeft:'auto', fontSize:10, color: h.enabled ? 'var(--fg-green)' : 'var(--fg-text3)' }}>{h.enabled ? '⏺ on' : '⏸ off'}</span>
                            </div>
                            <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>→ {h.target || h.action}</p>
                          </div>
                        ))}
                        <button onClick={() => setMainTab('hooks')} style={{ width:'100%', padding:'7px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:7, color:'var(--fg-text2)', fontSize:11, cursor:'pointer', marginTop:4 }}>Manage hooks →</button>
                      </div>
                    )}
                    {/* RUNS */}
                    {rightTab==='runs' && (
                      <div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                          <p style={{ color:'var(--fg-text3)', fontSize:11, fontWeight:600, textTransform:'uppercase', margin:0 }}>Runs</p>
                          <span style={{ fontSize:10, color:'var(--fg-green)', background:'rgba(34,197,94,0.1)', padding:'2px 7px', borderRadius:8 }}>{dispatchRuns.filter(r => r.status === 'running').length} running</span>
                        </div>
                        {dispatchRuns.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:12, textAlign:'center', marginTop:24 }}>No runs yet.<br/>Agent workflows appear here.</p>}
                        {dispatchRuns.slice(0,5).map(r => (
                          <div key={r.id} style={{ padding:'8px 10px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, marginBottom:6 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                              <span style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background: r.status==='done' ? 'rgba(34,197,94,0.15)' : r.status==='running' ? 'rgba(249,115,22,0.15)' : 'rgba(248,113,113,0.15)', color: r.status==='done' ? 'var(--fg-green)' : r.status==='running' ? 'var(--fg-orange)' : 'var(--fg-red)' }}>{r.status}</span>
                              <span style={{ fontSize:11, color:'var(--fg-text2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.prompt?.slice(0,40) || 'Run'}</span>
                            </div>
                            <p style={{ margin:0, fontSize:10, color:'var(--fg-text3)' }}>{new Date(r.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                        <button onClick={() => setMainTab('runs')} style={{ width:'100%', padding:'7px', background:'var(--fg-bg4)', border:'1px solid var(--fg-border2)', borderRadius:7, color:'var(--fg-text2)', fontSize:11, cursor:'pointer', marginTop:4 }}>View all runs →</button>
                      </div>
                    )}
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
                            <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{a.type} ┬╖ {new Date(a.created_at).toLocaleDateString()}</p>
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
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                              <span style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background: t.status==='done' ? 'rgba(34,197,94,0.15)' : t.status==='in_progress' ? 'rgba(249,115,22,0.15)' : 'var(--fg-bg4)', color: t.status==='done' ? 'var(--fg-green)' : t.status==='in_progress' ? 'var(--fg-orange)' : 'var(--fg-text3)', fontWeight:600 }}>{t.status}</span>
                              <span style={{ fontSize:11, color:'var(--fg-text2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</span>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setShowNewTask(true)} style={{ width:'100%', padding:'7px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text3)', fontSize:11, cursor:'pointer', marginTop:6 }}>+ New Task</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

          {/* ── SKILLS & TOOLS ──────────────────────────────────────────────── */}
          {mainTab === 'skills' && (() => {
            const wcd = ((window as any).FORGE_CATALOG_DATA as any) || { skills: [], connectors: [] };
            const catalogData = {
              skills: (wcd.skills || []).map((s: any) => ({
                id: s.id, name: s.name, description: s.description, category: s.category || 'general', icon: s.icon || '🧩', tags: s.tags || [], rating: s.rating || 4.5
              })),
              connectors: (wcd.connectors || []).map((c: any) => ({
                id: c.id, name: c.name, description: c.description, category: c.category || 'general', icon: c.icon || '🔌', tags: c.tags || []
              }))
            };
            const SKILLS = catalogData.skills;
            const cats = ['All', ...Array.from(new Set(SKILLS.map((s:any) => s.category)))] as string[];
            const filtered = SKILLS.filter((s:any) => (skillCat === 'All' || s.category === skillCat) && (!skillSearch || s.name.toLowerCase().includes(skillSearch.toLowerCase()) || s.description?.toLowerCase().includes(skillSearch.toLowerCase())));
            return (
              <div style={{ flex:1, overflowY:'auto', padding:28 }}>
                <div style={{ maxWidth:900, margin:'0 auto' }}>
                  <div style={{ marginBottom:24 }}>
                    <h1 style={{ margin:'0 0 6px', fontSize:28, fontWeight:900, color:'var(--fg-orange)' }}>🧩 Skills & Tools</h1>
                    <p style={{ margin:0, color:'var(--fg-text3)', fontSize:15 }}>Prebuilt AI skills, connectors, and Forge tools</p>
                  </div>

                  {/* Sub-tab toggle */}
                  <div style={{ display:'flex', gap:0, marginBottom:28, background:'var(--fg-bg3)', borderRadius:12, padding:4, width:'fit-content' }}>
                    {(['skills','tools'] as const).map(tab => (
                      <button key={tab} onClick={() => setToolSubTab(tab)} style={{ padding:'8px 22px', borderRadius:10, border:'none', background: toolSubTab===tab ? 'var(--fg-orange)' : 'transparent', color: toolSubTab===tab ? '#fff' : 'var(--fg-text3)', fontWeight: toolSubTab===tab ? 700 : 400, fontSize:13, cursor:'pointer' }}>
                        {tab === 'skills' ? '🧩 Skills' : '🔧 Forge Tools'}
                      </button>
                    ))}
                  </div>

                  {toolSubTab === 'tools' && (
                    <div>
                      <p style={{ margin:'0 0 20px', color:'var(--fg-text3)', fontSize:13 }}>Enable/disable tools that auto-launch with your AI. AUTO tools inject into every chat automatically.</p>
                      {(['search','compute','code','files','intelligence','creative'] as const).map(cat => {
                        const defaultTools: any[] = [
                          { id:'web_search', name:'Web Search', icon:'🌐', category:'search', description:'Real-time web search', enabled:true, auto_launch:true, providers:['anthropic','openai'] },
                          { id:'browser', name:'Browser / Scrape', icon:'🌍', category:'search', description:'Fetch and parse web pages', enabled:true, auto_launch:true, providers:['anthropic','openai','openrouter'] },
                          { id:'code_exec', name:'Code Execution', icon:'⚡', category:'compute', description:'Run Python, JS, bash', enabled:true, auto_launch:true, providers:['anthropic','openai','openrouter'] },
                          { id:'calculator', name:'Calculator', icon:'🧮', category:'compute', description:'Precise math & finance', enabled:true, auto_launch:true, providers:['anthropic','openai','openrouter'] },
                          { id:'cursor_edit', name:'Cursor / Code Edit', icon:'✏️', category:'code', description:'Diff-based code edits', enabled:false, auto_launch:false, providers:['anthropic','openai'] },
                          { id:'file_read', name:'File Read', icon:'📄', category:'files', description:'Read PDFs, CSVs, DOCX', enabled:false, auto_launch:false, providers:['anthropic','openai','openrouter'] },
                          { id:'memory_store', name:'Memory Store', icon:'🧠', category:'intelligence', description:'Persist facts across chats', enabled:true, auto_launch:true, providers:['anthropic','openai','openrouter'] },
                          { id:'image_gen', name:'Image Generation', icon:'🎨', category:'creative', description:'Generate images with DALL-E 3', enabled:false, auto_launch:false, providers:['openai'] },
                        ];
                        const displayTools = forgeTools.length > 0 ? forgeTools : defaultTools;
                        const catTools = displayTools.filter((t: any) => t.category === cat);
                        if (catTools.length === 0) return null;
                        return (
                          <div key={cat} style={{ marginBottom:24 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{cat}</div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
                              {catTools.map((tool: any) => (
                                <div key={tool.id} style={{ display:'flex', alignItems:'center', gap:14, background:'var(--fg-bg3)', border:'1px solid ' + (tool.enabled ? 'var(--fg-orange)' : 'var(--fg-border)'), borderRadius:12, padding:'14px 16px' }}>
                                  <span style={{ fontSize:26, flexShrink:0 }}>{tool.icon}</span>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontWeight:700, fontSize:14, color:'var(--fg-text)', marginBottom:2 }}>{tool.name}</div>
                                    <div style={{ fontSize:12, color:'var(--fg-text3)', marginBottom:5 }}>{tool.description}</div>
                                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                      {tool.auto_launch && <span style={{ fontSize:10, padding:'1px 7px', background:'rgba(249,115,22,0.12)', borderRadius:8, color:'var(--fg-orange)', fontWeight:600 }}>AUTO</span>}
                                      {(tool.providers||[]).map((p: string) => <span key={p} style={{ fontSize:10, padding:'1px 7px', background:'var(--fg-bg4)', borderRadius:8, color:'var(--fg-text3)' }}>{p}</span>)}
                                    </div>
                                  </div>
                                  <button onClick={() => toggleForgeTool(tool.id, !tool.enabled)} style={{ flexShrink:0, width:46, height:26, borderRadius:13, border:'none', background: tool.enabled ? 'var(--fg-orange)' : 'var(--fg-bg4)', cursor:'pointer', position:'relative' }}>
                                    <div style={{ position:'absolute', top:3, left: tool.enabled ? 22 : 3, width:20, height:20, borderRadius:'50%', background:'#fff' }} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={async () => { if (!user?.token) return; try { await apiFetch('/forge-tools/reset',{method:'POST'},user.token); loadForgeTools(); } catch {} }} style={{ padding:'8px 18px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', fontSize:12, cursor:'pointer' }}>↩ Reset to defaults</button>
                    </div>
                  )}

                  {toolSubTab === 'skills' && (
                    <>
                      {/* Skills Library */}
                      <div style={{ marginBottom:20 }}>
                        <h2 style={{ margin:'0 0 16px', fontSize:17, fontWeight:800, color:'var(--fg-text)' }}>🧩 Skills Library</h2>
                        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                          <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Search skills…" style={{ flex:1, minWidth:180, padding:'8px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:13, outline:'none' }} />
                          {cats.map((c:string) => <button key={c} onClick={() => setSkillCat(c)} style={{ padding:'6px 14px', borderRadius:8, border:'none', background: skillCat===c ? 'var(--fg-orange)' : 'var(--fg-bg3)', color: skillCat===c ? '#fff' : 'var(--fg-text3)', fontSize:12, cursor:'pointer' }}>{c}</button>)}
                        </div>
                        {filtered.length === 0 && <p style={{ color:'var(--fg-text3)', fontSize:13, textAlign:'center', padding:'40px 0' }}>No skills found</p>}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                          {filtered.map((skill: any) => {
                            const isActive = activeSkills.has(skill.id);
                            return (
                              <div key={skill.id} style={{ background:'var(--fg-bg3)', border:'1px solid ' + (isActive ? 'var(--fg-orange)' : 'var(--fg-border)'), borderRadius:12, padding:'16px 18px' }}>
                                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                                  <span style={{ fontSize:28 }}>{skill.icon}</span>
                                  <button onClick={() => { setActiveSkills(prev => { const n=new Set(prev); n.has(skill.id)?n.delete(skill.id):n.add(skill.id); try{localStorage.setItem('forge_active_skills',JSON.stringify(Array.from(n)))}catch{}; return n; }); }} style={{ padding:'4px 12px', borderRadius:8, border:'none', background: isActive ? 'var(--fg-orange)' : 'var(--fg-bg4)', color: isActive ? '#fff' : 'var(--fg-text3)', fontSize:11, fontWeight:600, cursor:'pointer' }}>{isActive ? '✓ Active' : '+ Add'}</button>
                                </div>
                                <div style={{ fontWeight:700, fontSize:14, color:'var(--fg-text)', marginBottom:4 }}>{skill.name}</div>
                                <div style={{ fontSize:12, color:'var(--fg-text3)' }}>{skill.description}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── MARKETPLACE ──────────────────────────────────────────────────── */}
          {mainTab === 'marketplace' && (
            <div style={{ flex:1, overflowY:'auto', padding:28 }}>
              <div style={{ maxWidth:1000, margin:'0 auto' }}>
                <div style={{ marginBottom:24 }}>
                  <h1 style={{ margin:'0 0 6px', fontSize:28, fontWeight:900, color:'var(--fg-orange)' }}>🛒 Model Marketplace</h1>
                  <p style={{ margin:0, color:'var(--fg-text3)', fontSize:15 }}>Browse and install AI models and integrations</p>
                </div>
                <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
                  <input value={marketplaceSearch} onChange={e => setMarketplaceSearch(e.target.value)} placeholder="Search marketplace…" style={{ flex:1, minWidth:200, padding:'9px 14px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:13, outline:'none' }} />
                  {['All','model','tools','integration'].map(c => <button key={c} onClick={() => setMarketplaceCat(c)} style={{ padding:'7px 16px', borderRadius:9, border:'none', background: marketplaceCat===c ? 'var(--fg-orange)' : 'var(--fg-bg3)', color: marketplaceCat===c ? '#fff' : 'var(--fg-text3)', fontSize:12, cursor:'pointer' }}>{c}</button>)}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                  {(marketplaceItems.length > 0 ? marketplaceItems : [
                    { id:'gpt4o', name:'GPT-4o', provider:'OpenAI', icon:'🤖', description:'Most capable OpenAI model', tags:['flagship','vision'], rating:4.9, price:'$5/M', installs:12400, category:'model' },
                    { id:'claude3opus', name:'Claude 3 Opus', provider:'Anthropic', icon:'🧠', description:'Most intelligent Claude model', tags:['flagship','reasoning'], rating:4.9, price:'$15/M', installs:9800, category:'model' },
                    { id:'gemini15', name:'Gemini 1.5 Pro', provider:'Google', icon:'✨', description:'Long context multimodal model', tags:['long-context','vision'], rating:4.7, price:'$3.5/M', installs:7200, category:'model' },
                    { id:'llama3', name:'Llama 3 70B', provider:'Meta', icon:'🦙', description:'Open-source powerhouse', tags:['open-source','fast'], rating:4.6, price:'Free', installs:15600, category:'model' },
                    { id:'mixtral', name:'Mixtral 8x22B', provider:'Mistral', icon:'🌪️', description:'MoE architecture, fast inference', tags:['MoE','efficient'], rating:4.5, price:'$2/M', installs:5400, category:'model' },
                    { id:'deepseek', name:'DeepSeek V2', provider:'DeepSeek', icon:'🔍', description:'Cost-effective reasoning model', tags:['reasoning','cheap'], rating:4.4, price:'$0.14/M', installs:4100, category:'model' },
                  ]).filter((m: any) => (marketplaceCat==='All' || m.category===marketplaceCat) && (!marketplaceSearch || m.name.toLowerCase().includes(marketplaceSearch.toLowerCase()))).map((m: any) => (
                    <div key={m.id} style={{ background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:14, padding:'18px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:32 }}>{m.icon}</span>
                        <div>
                          <div style={{ fontWeight:800, fontSize:15, color:'var(--fg-text)' }}>{m.name}</div>
                          <div style={{ fontSize:11, color:'var(--fg-text3)' }}>{m.provider}</div>
                        </div>
                        <div style={{ marginLeft:'auto', textAlign:'right' }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'var(--fg-orange)' }}>{m.price}</div>
                          <div style={{ fontSize:10, color:'var(--fg-text3)' }}>⭐ {m.rating}</div>
                        </div>
                      </div>
                      <p style={{ margin:'0 0 10px', fontSize:12, color:'var(--fg-text3)' }}>{m.description}</p>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
                        {(m.tags||[]).map((t: string) => <span key={t} style={{ fontSize:10, padding:'2px 8px', background:'var(--fg-bg4)', borderRadius:8, color:'var(--fg-text3)' }}>{t}</span>)}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:10, color:'var(--fg-text3)' }}>{(m.installs||0).toLocaleString()} installs</span>
                        <button onClick={() => { setSelectedModel(m.id); setMainTab('workspace'); }} style={{ padding:'6px 14px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>⚡ Use in Workspace</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

      </div>
    </div>
  );
}
