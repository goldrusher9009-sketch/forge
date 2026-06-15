const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('tokenBreakdown')) { console.log('Already patched'); process.exit(0); }

// 1. Add state vars after existing batch2 state vars
const stateAnchor = "const [improvedPrompt, setImprovedPrompt] = useState<string|null>(null);";
const newState = `
  const [tokenBreakdown, setTokenBreakdown] = useState<any>(null);
  const [showTokenBreakdown, setShowTokenBreakdown] = useState(false);
  const [threadStatsExt, setThreadStatsExt] = useState<any>(null);
  const [showThreadStats, setShowThreadStats] = useState(false);`;
src = src.replace(stateAnchor, stateAnchor + newState);

// 2. Add fetch functions after improvePrompt function
const fnAnchor = "async function improvePrompt()";
const newFns = `
  async function loadTokenBreakdown(threadId: string) {
    try {
      const r = await fetch(\`/api/threads/\${threadId}/token-breakdown\`, { headers: { Authorization: \`Bearer \${token}\` } });
      if (r.ok) setTokenBreakdown(await r.json());
    } catch {}
  }

  async function loadThreadStatsExt(threadId: string) {
    try {
      const r = await fetch(\`/api/threads/\${threadId}/stats-extended\`, { headers: { Authorization: \`Bearer \${token}\` } });
      if (r.ok) setThreadStatsExt(await r.json());
    } catch {}
  }

  async function triggerSmartRename(threadId: string) {
    try {
      const r = await fetch(\`/api/threads/\${threadId}/smart-rename\`, { method: 'POST', headers: { Authorization: \`Bearer \${token}\` } });
      if (r.ok) {
        const data = await r.json();
        if (data.renamed) {
          setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title: data.title } : t));
          if (selectedThread?.id === threadId) setSelectedThread((prev: any) => prev ? { ...prev, title: data.title } : prev);
        }
      }
    } catch {}
  }

`;
src = src.replace(fnAnchor, newFns + fnAnchor);

// 3. Call loadTokenBreakdown + smart rename in selectThread
const selectAnchor = "loadPinned(t.id);";
src = src.replace(selectAnchor, selectAnchor + `
      loadTokenBreakdown(String(t.id));
      loadThreadStatsExt(String(t.id));
      setTimeout(() => triggerSmartRename(String(t.id)), 3000);`);

// 4. Add token breakdown panel + stats button in thread header area (near mood badge)
const headerAnchor = "{threadMood && (";
const tokenPanel = `
          {/* Token breakdown + stats buttons */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => setShowTokenBreakdown(!showTokenBreakdown)}
              className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
              title="Token breakdown by model"
            >⚡ Tokens</button>
            <button
              onClick={() => setShowThreadStats(!showThreadStats)}
              className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
              title="Thread stats"
            >📊 Stats</button>
          </div>
          {showTokenBreakdown && tokenBreakdown && (
            <div className="absolute right-4 top-12 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 w-80 shadow-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white">Token Breakdown</span>
                <button onClick={() => setShowTokenBreakdown(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
              </div>
              <div className="space-y-1.5">
                {tokenBreakdown.breakdown?.length > 0 ? tokenBreakdown.breakdown.map((b: any, i: number) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span className="font-medium">{b.model || b.provider}</span>
                      <span>{(b.total_tokens||0).toLocaleString()} tok</span>
                    </div>
                    <div className="flex justify-between text-gray-500 pl-2">
                      <span>{b.requests} req · {(b.prompt_tokens||0).toLocaleString()}↑ {(b.completion_tokens||0).toLocaleString()}↓</span>
                      {b.cost > 0 && <span>\${b.cost.toFixed(4)}</span>}
                    </div>
                  </div>
                )) : <p className="text-xs text-gray-500">No routing data yet</p>}
                {tokenBreakdown.totals?.total > 0 && (
                  <div className="border-t border-gray-600 pt-1 mt-1 flex justify-between text-xs text-white font-semibold">
                    <span>Total</span>
                    <span>{tokenBreakdown.totals.total.toLocaleString()} tok</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {showThreadStats && threadStatsExt && (
            <div className="absolute right-4 top-12 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 w-64 shadow-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white">Thread Stats</span>
                <button onClick={() => setShowThreadStats(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <div className="flex justify-between"><span>Messages</span><span>{threadStatsExt.totalMessages}</span></div>
                <div className="flex justify-between"><span>Your messages</span><span>{threadStatsExt.userMessages}</span></div>
                <div className="flex justify-between"><span>AI replies</span><span>{threadStatsExt.assistantMessages}</span></div>
                <div className="flex justify-between"><span>Word count</span><span>{(threadStatsExt.wordCount||0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Read time</span><span>~{threadStatsExt.readingMinutes} min</span></div>
              </div>
            </div>
          )}
`;
src = src.replace(headerAnchor, tokenPanel + headerAnchor);

fs.writeFileSync(filePath, src, 'utf8');
console.log('Batch3 frontend done. Lines:', src.split('\n').length);
