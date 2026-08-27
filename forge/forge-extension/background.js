// Forge AI Extension — Background Service Worker

const TOOLS = [
  { id: 'improve',      title: '✨ Improve Writing' },
  { id: 'summarize',   title: '📝 Summarize' },
  { id: 'simplify',    title: '💡 Explain Simply' },
  { id: 'shorten',     title: '✂️ Make Shorter' },
  { id: 'professional',title: '👔 Make Professional' },
  { id: 'bullet',      title: '📋 Convert to Bullets' },
  { id: 'translate',   title: '🌍 Translate to English' },
  { id: 'tone',        title: '🎭 Detect Tone' },
];

// Create context menus on install/startup
function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'forge-root',
      title: '⚡ Forge AI',
      contexts: ['selection'],
    });
    TOOLS.forEach(t => {
      chrome.contextMenus.create({
        id: `forge-${t.id}`,
        parentId: 'forge-root',
        title: t.title,
        contexts: ['selection'],
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.menuItemId.toString().startsWith('forge-')) return;
  const tool = info.menuItemId.toString().replace('forge-', '');
  if (tool === 'root') return;

  chrome.tabs.sendMessage(tab.id, {
    type: 'run_tool',
    tool: tool,
    text: info.selectionText || '',
  });
});

// Handle messages from popup (e.g. test connection)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'test_connection') {
    chrome.storage.local.get(['forge_token', 'forge_backend'], async (result) => {
      const backend = result.forge_backend || 'https://forge-sand-two.vercel.app';
      const token = result.forge_token || '';
      try {
        const r = await fetch(`${backend}/api/health`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        sendResponse({ ok: r.ok, status: r.status });
      } catch(e) {
        sendResponse({ ok: false, error: e.message });
      }
    });
    return true; // keep channel open for async
  }
});
