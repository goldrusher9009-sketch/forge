// Forge Chrome Extension Content Script
// Injects sidebar + handles IPC with background worker

const SIDEBAR_ID = 'forge-sidebar-container';

function initSidebar() {
  if (document.getElementById(SIDEBAR_ID)) return;
  
  const sidebar = document.createElement('div');
  sidebar.id = SIDEBAR_ID;
  sidebar.style.cssText = `
    position: fixed;
    right: 0;
    top: 0;
    width: 360px;
    height: 100vh;
    background: #0a0a0b;
    border-left: 1px solid rgba(255,255,255,0.06);
    z-index: 999999;
    box-shadow: -2px 0 8px rgba(0,0,0,0.3);
    overflow-y: auto;
  `;
  
  sidebar.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.06);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #f0f1f5; font-weight: 700;">⚡ Forge</span>
        <button id="forge-close" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px;">✕</button>
      </div>
    </div>
    <div id="forge-messages" style="padding: 12px; color: #f0f1f5;"></div>
    <div style="padding: 12px; border-top: 1px solid rgba(255,255,255,0.06);">
      <input id="forge-input" type="text" placeholder="Ask Forge..." style="width: 100%; padding: 8px 12px; background: #1a1a1e; border: 1px solid rgba(255,255,255,0.11); color: #fff; border-radius: 6px; font-size: 13px;">
    </div>
  `;
  
  document.body.appendChild(sidebar);
  
  // Close button
  document.getElementById('forge-close').onclick = () => sidebar.remove();
  
  // Send message
  document.getElementById('forge-input').onkeypress = (e) => {
    if (e.key === 'Enter') {
      const msg = e.target.value;
      chrome.runtime.sendMessage({ action: 'chat', message: msg }, (response) => {
        const messagesDiv = document.getElementById('forge-messages');
        messagesDiv.innerHTML += `<div style="padding: 8px; background: #131316; border-radius: 6px; margin-bottom: 8px; border-left: 2px solid #ff1f35; font-size: 12px;">${response.reply || 'Processing...'}</div>`;
        e.target.value = '';
      });
    }
  };
}

// Listen for sidebar toggle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle-sidebar') {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (sidebar) {
      sidebar.remove();
    } else {
      initSidebar();
    }
    sendResponse({ success: true });
  }
});

// Auto-init on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}
