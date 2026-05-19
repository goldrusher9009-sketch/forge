// Check connection status via background
chrome.runtime.sendMessage({ type: 'ping' }, () => {});

// Try to detect if Forge Desktop bridge is alive
const ws = new WebSocket('ws://127.0.0.1:27184');
ws.onopen = () => {
  document.getElementById('status').className = 'status connected';
  document.getElementById('dot').className = 'dot on';
  document.getElementById('status-text').textContent = 'Connected to Forge Desktop';
  ws.close();
};
ws.onerror = () => {
  document.getElementById('status-text').textContent = 'Forge Desktop not running';
};

document.getElementById('send-page').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.runtime.sendMessage({ type: 'send-page', url: tab.url, title: tab.title });
    window.close();
  }
});

document.getElementById('open-forge').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://forge-sand-two.vercel.app' });
});
