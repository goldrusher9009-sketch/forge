// Forge AI Workspace v6.62 -- ForgeAuto ForgeMulti ForgeASI MVP Builder Intelligence Agent Swarm + React hooks crash fix
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OnboardingFlow } from './OnboardingFlow';
import { ForgeAutonomyHub, OnboardingWizard, CreditBadge, LIVING_STYLES } from './ForgeAutonomy';

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
}
/* Interactive cursor-following glow — sits behind all content, reacts to mouse */
#fg-cursor-glow {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background: radial-gradient(360px 360px at var(--mx, 50%) var(--my, 40%), rgba(255,31,53,0.10) 0%, rgba(255,31,53,0.04) 35%, transparent 70%);
  transition: background 0.18s ease-out; will-change: background;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility; font-feature-settings: 'ss01','cv01','cv11'; letter-spacing: -0.01em;
}
h1,h2,h3,h4 { font-family: var(--fg-font-display); letter-spacing: -0.02em; font-weight: 700; }
/* Multicolor accent helpers usable anywhere */
.fg-accent-bar { height:3px; background:var(--fg-accent-grad); background-size:200% auto; animation:fg-sheen 6s linear infinite; border-radius:3px; }
/* Always-visible slim scrollbar for the recent-chats list */
.fg-chats-scroll { scrollbar-width: thin; scrollbar-color: var(--fg-orange) var(--fg-bg3); }
.fg-chats-scroll::-webkit-scrollbar { width: 9px; }
.fg-chats-scroll::-webkit-scrollbar-track { background: var(--fg-bg3); border-radius: 6px; }
.fg-chats-scroll::-webkit-scrollbar-thumb { background: linear-gradient(var(--fg-orange),var(--fg-btn-grad)); border-radius: 6px; border: 2px solid var(--fg-bg3); }
.fg-chats-scroll::-webkit-scrollbar-thumb:hover { background: var(--fg-orange2); }
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
const BACKEND = 'https://forge-production-2692.up.railway.app';

// --- Global memory + history helpers ---
function getToken(): string { return typeof window !== 'undefined' ? (localStorage.getItem('forge_token') || '') : ''; }
async function saveToolHistory(toolId: string, toolName: string, input: any, output: string) {
  try { await fetch(`${BACKEND}/api/tool-history`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ tool_id: toolId, tool_name: toolName, input, output }) }); } catch {}
}
async function saveMemoryKV(key: string, value: string, category = 'general') {
  try { await fetch(`${BACKEND}/api/memory`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ key, value, category }) }); } catch {}
}
async function getToolHistory(toolId: string, limit = 10): Promise<any[]> {
  try { const r = await fetch(`${BACKEND}/api/tool-history?tool_id=${toolId}&limit=${limit}`, { headers: { Authorization: `Bearer ${getToken()}` } }); const d = await r.json(); return d.history || []; } catch { return []; }
}

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
  { cmd:'explain',     icon:'🧠', label:'Explain',        desc:`Explain like I\'m 5`,                    category:'skill',   insert:'/explain ' },
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
      // Inline images: ![alt](url)
      const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const [, alt, url] = imgMatch;
        parts.push(<div key={`img-${si}-${li}`} style={{ margin:'10px 0' }}><img src={url} alt={alt || 'Generated image'} style={{ maxWidth:'100%', maxHeight:480, borderRadius:8, display:'block', cursor:'pointer' }} onClick={() => window.open(url,'_blank')} /></div>);
        return;
      }
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
let _onTokenRefreshed: ((token: string) => void) | null = null;

// Try to silently mint a new access token using the httpOnly refresh cookie.
// Returns the new token on success, or null. De-duped so concurrent 401s share one refresh.
let _refreshInFlight: Promise<string | null> | null = null;
async function tryRefreshToken(): Promise<string | null> {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = (async () => {
    try {
      const r = await fetch(`${API}/auth/refresh`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: '{}',
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return null;
      const d = await r.json().catch(() => ({}));
      const t = d?.data?.accessToken || d?.accessToken || '';
      if (t) {
        try {
          const stored = JSON.parse(localStorage.getItem('forge_user') || '{}');
          stored.token = t; localStorage.setItem('forge_user', JSON.stringify(stored));
        } catch {}
        if (_onTokenRefreshed) _onTokenRefreshed(t);
        return t;
      }
      return null;
    } catch { return null; }
    finally { setTimeout(() => { _refreshInFlight = null; }, 0); }
  })();
  return _refreshInFlight;
}

async function apiFetch(path: string, opts: RequestInit = {}, token?: string, _retry = false): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const signal = opts.signal ?? (opts.method === 'POST' ? AbortSignal.timeout(60000) : undefined);
  const res = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include', ...(signal ? { signal } : {}) });
  if (res.status === 401) {
    const err = await res.json().catch(() => ({}));
    // On the FIRST 401, try to refresh the access token and replay once before giving up.
    if (!_retry && (err.error === 'AUTHENTICATION_REQUIRED' || err.error === 'INVALID_TOKEN')) {
      const fresh = await tryRefreshToken();
      if (fresh) return apiFetch(path, opts, fresh, true);
      // Refresh failed -> session truly gone
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
async function apiFetchSSE(path: string, opts: RequestInit = {}, token?: string, onEvent?: (evt: any) => void, _retry = false): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const signal = opts.signal ?? AbortSignal.timeout(180000);
  const res = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include', signal });
  if (res.status === 401) {
    const err = await res.json().catch(() => ({}));
    if (!_retry && (err.error === 'AUTHENTICATION_REQUIRED' || err.error === 'INVALID_TOKEN')) {
      const fresh = await tryRefreshToken();
      if (fresh) return apiFetchSSE(path, opts, fresh, onEvent, true);
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
  { id:'forge-auto',    label:'⚡ Auto',        desc:'Smart router — picks best model based on complexity', base:'auto' },
  { id:'forge-cheap',   label:'💸 Cheap',       desc:'Always uses fastest/free models — Groq, Flash, Mini', base:'auto' },
  { id:'forge-premium', label:'💎 Premium',     desc:'Always uses the best available model — Opus, GPT-4o', base:'auto' },
  { id:'forge-ultra',   label:'Forge Ultra',   desc:'Claude Opus 4.6 + markup',       base:'claude-opus-4-6' },
  { id:'forge-pro',     label:'Forge Pro',     desc:'Claude Sonnet 4.6 + markup',     base:'claude-sonnet-4-6' },
  { id:'forge-flash',   label:'Forge Flash',   desc:'Claude Haiku 4.5 + markup',      base:'claude-haiku-4-5-20251001' },
  { id:'forge-gpt',     label:'Forge GPT',     desc:'GPT-4o + markup',                base:'gpt-4o' },
  { id:'forge-gemini',  label:'Forge Gemini',  desc:'Gemini 2.0 Flash + markup',      base:'gemini-2.0-flash' },
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
        const token = login.data?.accessToken || login.data?.access_token || login.accessToken || login.access_token || login.token || '';
        onLogin({ id: u.id, email: u.email, name: u.firstName || u.name || email, token, role: u.role });
      } else {
        const data = await apiFetch('/auth/login', { method:'POST', body:JSON.stringify(body) });
        const u = data.data?.user || data.user || {};
        const token = data.data?.accessToken || data.data?.access_token || data.accessToken || data.access_token || data.token || '';
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

// --- Monaco Editor (textarea fallback) -----------------------------------------------------
function MonacoEditor({ code, lang, onChange }: { code: string; lang: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={code}
      onChange={e => onChange(e.target.value)}
      style={{ width:'100%', height:'100%', background:'#1e1e1e', color:'#d4d4d4', fontFamily:'monospace', fontSize:13, border:'none', outline:'none', resize:'none', padding:12 }}
      spellCheck={false}
    />
  );
}

export default ForgeApp;