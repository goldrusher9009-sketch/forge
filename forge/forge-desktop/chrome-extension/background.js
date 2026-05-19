// Forge Desktop Bridge — Background Service Worker
// Connects to the Electron app via WebSocket on localhost:27184

const WS_URL = 'ws://127.0.0.1:27184';
let ws = null;
let reconnectTimer = null;

function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[Forge Bridge] Connected to Forge Desktop');
    clearTimeout(reconnectTimer);
    // Update extension icon to show connected
    chrome.action.setBadgeText({ text: '●' });
    chrome.action.setBadgeBackgroundColor({ color: '#7C3AED' });
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      // Forward to popup/content scripts
      chrome.runtime.sendMessage(msg).catch(() => {});
    } catch (e) {}
  };

  ws.onerror = () => {
    chrome.action.setBadgeText({ text: '' });
  };

  ws.onclose = () => {
    chrome.action.setBadgeText({ text: '' });
    reconnectTimer = setTimeout(connect, 3000);
  };
}

// Send page context to Forge Desktop
async function sendPageContext(tabId) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    ws.send(JSON.stringify({
      type: 'page-context',
      url: tab.url,
      title: tab.title,
      tabId: tab.id,
      ts: Date.now()
    }));
  } catch (e) {}
}

// Listen for tab updates
chrome.tabs.onActivated.addListener(({ tabId }) => sendPageContext(tabId));
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'complete') sendPageContext(tabId);
});

// Listen from content scripts
chrome.runtime.onMessage.addListener((msg) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
});

connect();
