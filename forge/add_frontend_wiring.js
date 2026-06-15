const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let src = fs.readFileSync(filePath, 'utf8');

// 1. Add heatmap + stale notify to useEffect (analytics loader block)
if (!src.includes('stale/notify')) {
  // Find analytics useEffect block and append heatmap fetch
  src = src.replace(
    /if \(mainTab === 'analytics' && user && !analyticsData && !analyticsLoading\) \{/,
    `if (mainTab === 'analytics' && user && !analyticsData && !analyticsLoading) {
      // heatmap fetch
      const htok = localStorage.getItem('forge_token');
      fetch(\`/api/analytics/heatmap?days=90\`, { headers: { Authorization: 'Bearer ' + htok } })
        .then(r => r.json()).then(d => { if (d.grid) setHeatmapData(d.grid); }).catch(() => {});`
  );
  // Add stale notify on login (after notifications load or near user effect)
  // Find a safe spot: after user && notifications.length check or just after user state resolves
  if (!src.includes('stale/notify')) {
    // Add after the existing fetch('/api/notifications' block by finding a stable anchor
    const staleInject = `
    // Stale thread follow-up notifier (fires once on load if no notifications)
    if (user) {
      const stok = localStorage.getItem('forge_token');
      fetch('/api/threads/stale/notify', { method: 'POST', headers: { Authorization: 'Bearer ' + stok } }).catch(() => {});
    }`;
    // Inject before the first fetch('/api/notifications')
    src = src.replace(
      "fetch('/api/notifications'",
      staleInject + "\n    fetch('/api/notifications'"
    );
  }
  console.log('✓ Heatmap + stale notify wired');
}

// 2. Add TL;DR button after AI-title button in thread header (only if missing)
if (!src.includes('TL;DR')) {
  // Find the AI title button and insert TL;DR after it
  const aiTitleBtn = `title='AI auto-title'`;
  const tldrBtn = `
              {activeThread && messages.length >= 6 && (
                <button onClick={async () => {
                  if (tldr) { setShowTldr((p:boolean) => !p); return; }
                  setTldrLoading(true);
                  const tok = localStorage.getItem('forge_token');
                  const d = await fetch('/api/threads/' + activeThread.id + '/tldr', { method:'POST', headers:{ Authorization:'Bearer '+tok } }).then(r=>r.json()).catch(()=>({bullets:[]}));
                  setTldr(d.bullets || []); setShowTldr(true); setTldrLoading(false);
                }} style={{ padding:'4px 10px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:8, color:'#818cf8', fontSize:12, fontWeight:600, cursor:'pointer' }} title='AI TL;DR summary'>
                  {tldrLoading ? '⏳' : '📋 TL;DR'}
                </button>
              )}`;
  if (src.includes(aiTitleBtn)) {
    // Insert after the closing of AI title button block
    const idx = src.indexOf(aiTitleBtn);
    const closeIdx = src.indexOf('</button>', idx) + '</button>'.length;
    const nextClose = src.indexOf('})}', closeIdx);
    const insertAt = src.indexOf('\n', nextClose) + 1;
    src = src.slice(0, insertAt) + tldrBtn + '\n' + src.slice(insertAt);
    console.log('✓ TL;DR button added');
  }
}

// 3. Add TL;DR banner before messages (only if missing)
if (!src.includes('tldr && tldr.length')) {
  // Find where messages.map starts and insert before it
  const msgMapAnchor = `{messages.map((m`;
  const tldrBanner = `              {tldr && tldr.length > 0 && showTldr && (
                <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:8, marginBottom:10, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderBottom:'1px solid rgba(99,102,241,0.15)' }}>
                    <span style={{ fontSize:13 }}>📋</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#818cf8', flex:1 }}>TL;DR</span>
                    <button onClick={() => setShowTldr(false)} style={{ background:'none', border:'none', color:'var(--fg-text3)', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
                  </div>
                  <div style={{ padding:'8px 12px' }}>
                    {tldr.map((b:string, i:number) => <div key={i} style={{ fontSize:12, color:'var(--fg-text2)', padding:'2px 0' }}>{b}</div>)}
                  </div>
                </div>
              )}
`;
  if (src.includes(msgMapAnchor)) {
    src = src.replace(msgMapAnchor, tldrBanner + '              ' + msgMapAnchor);
    console.log('✓ TL;DR banner added');
  }
}

// 4. Pin API wiring - update selectThread to load pinned (if missing)
if (!src.includes('/pinned')) {
  const selectAnchor = `const selectThread = async (t: Thread)`;
  if (src.includes(selectAnchor)) {
    src = src.replace(
      `const selectThread = async (t: Thread)`,
      `const loadPinned = async (threadId: number) => {
    const tok = localStorage.getItem('forge_token');
    try { const d = await fetch('/api/threads/' + threadId + '/pinned', { headers: { Authorization: 'Bearer ' + tok } }).then(r=>r.json()); if (d.pinned) setPinnedMessages(d.pinned); } catch {}
  };
  const selectThread = async (t: Thread)`
    );
    // Also add setPinnedMessages([]);setTldr(null); at start of selectThread body
    src = src.replace(
      `setActiveThread(t); await loadMessages(t.id);`,
      `setActiveThread(t); setPinnedMessages([]); setTldr(null); await loadMessages(t.id);`
    );
    // Call loadPinned
    src = src.replace(
      `setActiveThread(t); setPinnedMessages([]); setTldr(null); await loadMessages(t.id);`,
      `setActiveThread(t); setPinnedMessages([]); setTldr(null); await loadMessages(t.id); loadPinned(t.id);`
    );
    console.log('✓ selectThread pinned wiring added');
  }
}

fs.writeFileSync(filePath, src, 'utf8');
console.log('Frontend wiring complete');
