// Forge AI Extension — Popup Script

const FORGE_URL = 'https://forge-sand-two.vercel.app';

async function init() {
  // Get current tab context from background
  const response = await chrome.runtime.sendMessage({ type: 'get-tab-context' }).catch(() => null);
  const ctx = response?.context;

  if (ctx) {
    document.getElementById('page-title').textContent = ctx.title || ctx.url || 'Unknown page';
    document.getElementById('page-url').textContent = ctx.url || '';
    if (ctx.selection) {
      document.getElementById('selection-info').style.display = 'block';
      document.getElementById('selection-text').textContent = `"${ctx.selection.slice(0, 80)}${ctx.selection.length > 80 ? '…' : ''}"`;
    }
  } else {
    // Try to get from active tab directly
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => [null]);
    if (tab) {
      document.getElementById('page-title').textContent = tab.title || tab.url || '';
      document.getElementById('page-url').textContent = tab.url || '';
    }
  }
}

document.getElementById('btn-sidebar').addEventListener('click', async () => {
  // Toggle sidebar on current page
  chrome.runtime.sendMessage({ type: 'toggle-sidebar' });
  window.close();
});

document.getElementById('btn-open-forge').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'open-forge' });
  window.close();
});

document.getElementById('btn-ask-page').addEventListener('click', async () => {
  // Open sidebar with page context pre-loaded
  const response = await chrome.runtime.sendMessage({ type: 'get-tab-context' }).catch(() => null);
  const ctx = response?.context;
  const params = new URLSearchParams({
    ext: '1',
    url: ctx?.url || '',
    title: ctx?.title || '',
    text: (ctx?.text || '').slice(0, 500),
    sel: (ctx?.selection || '').slice(0, 200),
    ask: '1'
  });
  chrome.tabs.create({ url: `${FORGE_URL}?${params}` });
  window.close();
});

init();
