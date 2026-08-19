// Forge AI Extension — Popup Script

const DEFAULT_BACKEND = 'https://forge-production-2692.up.railway.app';

const tokenInput   = document.getElementById('token-input');
const backendInput = document.getElementById('backend-input');
const saveBtn      = document.getElementById('save-btn');
const testBtn      = document.getElementById('test-btn');
const statusBar    = document.getElementById('status-bar');
const statusText   = document.getElementById('status-text');
const saveMsg      = document.getElementById('save-msg');

// Load saved settings
chrome.storage.local.get(['forge_token', 'forge_backend'], (result) => {
  if (result.forge_token) tokenInput.value = result.forge_token;
  backendInput.value = result.forge_backend || DEFAULT_BACKEND;
  if (result.forge_token) testConnection();
  else setStatus('disconnected', 'No token — add yours below');
});

// Save settings
saveBtn.addEventListener('click', () => {
  const token = tokenInput.value.trim();
  const backend = backendInput.value.trim() || DEFAULT_BACKEND;

  chrome.storage.local.set({ forge_token: token, forge_backend: backend }, () => {
    saveMsg.style.display = 'block';
    setTimeout(() => { saveMsg.style.display = 'none'; }, 2000);
    if (token) testConnection();
    else setStatus('disconnected', 'No token saved');
  });
});

// Test connection
testBtn.addEventListener('click', testConnection);

async function testConnection() {
  const token = tokenInput.value.trim();
  const backend = backendInput.value.trim() || DEFAULT_BACKEND;

  if (!token) {
    setStatus('disconnected', 'No token — add yours below');
    return;
  }

  setStatus('checking', 'Testing connection...');

  try {
    const r = await fetch(`${backend}/api/health`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (r.ok || r.status === 404) {
      // 404 is fine — just means /api/health doesn't exist but server is reachable
      // Try /api/keys instead which definitely exists
      const r2 = await fetch(`${backend}/api/keys`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (r2.ok) {
        setStatus('connected', 'Connected — ready to use!');
      } else if (r2.status === 401) {
        setStatus('disconnected', 'Invalid token — check and try again');
      } else {
        setStatus('connected', 'Server reachable');
      }
    } else if (r.status === 401) {
      setStatus('disconnected', 'Invalid token — check and try again');
    } else {
      setStatus('disconnected', `Error ${r.status} — check backend URL`);
    }
  } catch (e) {
    setStatus('disconnected', 'Cannot reach Forge — check URL');
  }
}

function setStatus(type, text) {
  statusBar.className = 'status-bar ' + type;
  statusText.textContent = text;
}

// Allow Enter key to save
tokenInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveBtn.click(); });
backendInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveBtn.click(); });
