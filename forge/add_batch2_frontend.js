const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('msgSearchQuery')) { console.log('Already patched'); process.exit(0); }

// ── 1. State vars (after heatmapData line) ──────────────────────────────────
src = src.replace(
  'const [heatmapData, setHeatmapData] = useState<number[][]|null>(null);',
  `const [heatmapData, setHeatmapData] = useState<number[][]|null>(null);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgSearchResults, setMsgSearchResults] = useState<any[]>([]);
  const [msgSearchLoading, setMsgSearchLoading] = useState(false);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [threadMood, setThreadMood] = useState<{mood:string;emoji:string}|null>(null);
  const [promptImproving, setPromptImproving] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string|null>(null);`
);

// ── 2. Load mood + autotag when thread selected ──────────────────────────────
src = src.replace(
  'setActiveThread(t); setPinnedMessages([]); setTldr(null); await loadMessages(t.id); loadPinned(t.id);',
  `setActiveThread(t); setPinnedMessages([]); setTldr(null); setThreadMood(null); await loadMessages(t.id); loadPinned(t.id);
    const _tok = localStorage.getItem('forge_token');
    fetch('/api/threads/' + t.id + '/mood', { headers: { Authorization: 'Bearer ' + _tok } })
      .then(r => r.json()).then(d => { if (d.emoji) setThreadMood(d); }).catch(() => {});
    fetch('/api/threads/' + t.id + '/autotag', { method:'POST', headers: { Authorization: 'Bearer ' + _tok } }).catch(() => {});`
);

// ── 3. Message search function (before selectThread) ─────────────────────────
src = src.replace(
  'const loadPinned = async (threadId: string)',
  `const searchMessages = async (q: string) => {
    if (!q.trim() || !user) return;
    setMsgSearchLoading(true);
    const tok = localStorage.getItem('forge_token');
    try {
      const d = await fetch('/api/messages/search?q=' + encodeURIComponent(q) + '&limit=20', { headers: { Authorization: 'Bearer ' + tok } }).then(r => r.json());
      setMsgSearchResults(d.results || []);
    } catch {}
    setMsgSearchLoading(false);
  };
  const loadPinned = async (threadId: string)`
);

// ── 4. Prompt improver function (near searchMessages) ────────────────────────
src = src.replace(
  'const searchMessages = async (q: string)',
  `const improvePrompt = async (currentInput: string) => {
    if (!currentInput.trim() || !user) return;
    setPromptImproving(true); setImprovedPrompt(null);
    const tok = localStorage.getItem('forge_token');
    try {
      const d = await fetch('/api/prompts/improve', { method:'POST', headers:{ Authorization:'Bearer '+tok, 'Content-Type':'application/json' }, body: JSON.stringify({ prompt: currentInput }) }).then(r=>r.json());
      if (d.improved) setImprovedPrompt(d.improved);
    } catch {}
    setPromptImproving(false);
  };
  const searchMessages = async (q: string)`
);

// ── 5. Mood emoji in thread header (after thread title) ──────────────────────
// Find the thread title display and append mood badge
const titleAnchor = `activeThread.title || 'Untitled'`;
if (src.includes(titleAnchor)) {
  src = src.replace(
    titleAnchor,
    `activeThread.title || 'Untitled'}{threadMood && <span title={'Mood: '+threadMood.mood} style={{ marginLeft:8, fontSize:16 }}>{threadMood.emoji}</span>`
  );
}

// ── 6. Message search toggle button in thread header ─────────────────────────
// Find the 🔍 or search area in the thread header area
const searchBtnAnchor = `title='AI auto-title'`;
if (src.includes(searchBtnAnchor)) {
  const idx = src.indexOf(searchBtnAnchor);
  // Find the button start before this title
  const btnStart = src.lastIndexOf('<button', idx);
  // Find where that button closes
  const btnClose = src.indexOf('</button>', btnStart) + '</button>'.length;
  // Insert message search button after
  const msgSearchBtn = `
              <button onClick={() => { setShowMsgSearch(p => !p); setMsgSearchResults([]); setMsgSearchQuery(''); }}
                style={{ padding:'4px 10px', background: showMsgSearch ? 'rgba(34,197,94,0.15)' : 'var(--fg-bg3)', border:'1px solid '+(showMsgSearch ? 'rgba(34,197,94,0.4)' : 'var(--fg-border)'), borderRadius:8, color: showMsgSearch ? '#22c55e' : 'var(--fg-text3)', fontSize:12, fontWeight:600, cursor:'pointer' }}
                title='Search messages'>🔍 Search</button>`;
  src = src.slice(0, btnClose) + msgSearchBtn + src.slice(btnClose);
}

// ── 7. Message search panel (before TL;DR banner) ───────────────────────────
const tldrBannerAnchor = `{tldr && tldr.length > 0 && showTldr`;
if (src.includes(tldrBannerAnchor)) {
  const msgSearchPanel = `              {showMsgSearch && (
                <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:10, marginBottom:10, overflow:'hidden' }}>
                  <div style={{ display:'flex', gap:8, padding:'8px 12px', borderBottom:'1px solid var(--fg-border)' }}>
                    <input value={msgSearchQuery} onChange={e => setMsgSearchQuery(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && searchMessages(msgSearchQuery)}
                      placeholder='Search messages…' autoFocus
                      style={{ flex:1, padding:'6px 10px', background:'var(--fg-bg)', border:'1px solid var(--fg-border2)', borderRadius:7, color:'var(--fg-text)', fontSize:13 }} />
                    <button onClick={() => searchMessages(msgSearchQuery)} disabled={msgSearchLoading}
                      style={{ padding:'6px 14px', background:'var(--fg-orange)', border:'none', borderRadius:7, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      {msgSearchLoading ? '…' : 'Go'}
                    </button>
                  </div>
                  {msgSearchResults.length > 0 && (
                    <div style={{ maxHeight:240, overflowY:'auto' }}>
                      {msgSearchResults.map((r:any) => (
                        <div key={r.id} style={{ padding:'8px 14px', borderBottom:'1px solid var(--fg-border)', cursor:'pointer' }}
                          onClick={() => { const el = document.getElementById('msg-'+r.id); if (el) el.scrollIntoView({behavior:'smooth',block:'center'}); }}>
                          <div style={{ fontSize:11, color:'var(--fg-text3)', marginBottom:2 }}>{r.thread_title} · {r.role}</div>
                          <div style={{ fontSize:12, color:'var(--fg-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.content.slice(0,120)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {msgSearchResults.length === 0 && msgSearchQuery && !msgSearchLoading && (
                    <div style={{ padding:'12px 14px', fontSize:12, color:'var(--fg-text3)' }}>No results for "{msgSearchQuery}"</div>
                  )}
                </div>
              )}
`;
  src = src.replace(tldrBannerAnchor, msgSearchPanel + '              ' + tldrBannerAnchor);
}

// ── 8. Prompt improver ✨ button (near send button) ──────────────────────────
// Find the send button in chat input area
const sendBtnAnchor = `onClick={handleSend}`;
if (src.includes(sendBtnAnchor)) {
  const improverUI = `{improvedPrompt && (
                  <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:8, padding:'8px 12px', marginBottom:6, fontSize:13 }}>
                    <div style={{ fontSize:11, color:'#818cf8', fontWeight:600, marginBottom:4 }}>✨ Improved prompt:</div>
                    <div style={{ color:'var(--fg-text2)', marginBottom:8 }}>{improvedPrompt}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => { setInput(improvedPrompt); setImprovedPrompt(null); }} style={{ padding:'4px 12px', background:'#6366f1', border:'none', borderRadius:6, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>Use this</button>
                      <button onClick={() => setImprovedPrompt(null)} style={{ padding:'4px 12px', background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', borderRadius:6, color:'var(--fg-text3)', fontSize:12, cursor:'pointer' }}>Dismiss</button>
                    </div>
                  </div>
                )}
                <button onClick={() => improvePrompt(input)} disabled={promptImproving || !input.trim()} title='Improve prompt with AI'
                  style={{ padding:'7px 10px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:9, color:'#818cf8', fontSize:13, cursor:'pointer', flexShrink:0 }}>
                  {promptImproving ? '⏳' : '✨'}
                </button>`;
  // Insert before the send button
  const sendIdx = src.indexOf(sendBtnAnchor);
  const sendBtnStart = src.lastIndexOf('<button', sendIdx);
  src = src.slice(0, sendBtnStart) + improverUI + '\n                ' + src.slice(sendBtnStart);
}

fs.writeFileSync(filePath, src, 'utf8');
console.log('Batch 2 frontend wiring done');
