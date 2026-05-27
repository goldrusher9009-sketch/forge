// Forge AI Extension — Content Script
// Injects sidebar iframe + captures page context

(function () {
  if (window.__forgeExtLoaded) return;
  window.__forgeExtLoaded = true;

  const FORGE_URL = 'https://forge-sand-two.vercel.app';
  let sidebarOpen = false;
  let sidebarEl = null;
  let toggleBtn = null;

  // ── Page context capture ──────────────────────────────────────────────────
  function getPageContext() {
    const selection = window.getSelection()?.toString()?.trim() || '';
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    // Get meaningful text — first 1000 chars of body text
    const bodyText = document.body?.innerText?.replace(/\s+/g, ' ')?.trim()?.slice(0, 1000) || '';
    return {
      type: 'page-context',
      url: location.href,
      title: document.title,
      text: bodyText,
      description: metaDesc,
      selection,
      ts: Date.now()
    };
  }

  // Send context immediately and on selection changes
  function sendContext() {
    try { chrome.runtime.sendMessage(getPageContext()); } catch (e) {}
  }
  sendContext();
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection()?.toString()?.trim();
    if (sel) sendContext();
  });

  // ── Sidebar iframe ────────────────────────────────────────────────────────
  function createSidebar() {
    if (sidebarEl) return;

    // Container
    sidebarEl = document.createElement('div');
    sidebarEl.id = '__forge-sidebar';
    Object.assign(sidebarEl.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: '420px',
      height: '100vh',
      zIndex: '2147483646',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.25)',
      transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      transform: 'translateX(100%)',
      borderLeft: '1px solid #333',
      background: '#0f0f0f'
    });

    // Iframe — load Forge app
    const ctx = getPageContext();
    const params = new URLSearchParams({
      ext: '1',
      url: ctx.url,
      title: ctx.title,
      text: ctx.text.slice(0, 500),
      sel: ctx.selection.slice(0, 200)
    });
    const iframe = document.createElement('iframe');
    iframe.src = `${FORGE_URL}?${params}`;
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      display: 'block'
    });
    iframe.allow = 'clipboard-read; clipboard-write';
    sidebarEl.appendChild(iframe);

    // Close handle (drag strip on left edge)
    const handle = document.createElement('div');
    Object.assign(handle.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '6px',
      height: '100%',
      cursor: 'col-resize',
      zIndex: '1',
      background: 'rgba(124,58,237,0.15)'
    });
    sidebarEl.appendChild(handle);

    document.body.appendChild(sidebarEl);
  }

  function openSidebar() {
    createSidebar();
    // Update iframe with latest context before opening
    const iframe = sidebarEl?.querySelector('iframe');
    if (iframe) {
      const ctx = getPageContext();
      const params = new URLSearchParams({
        ext: '1', url: ctx.url, title: ctx.title,
        text: ctx.text.slice(0, 500), sel: ctx.selection.slice(0, 200)
      });
      iframe.src = `${FORGE_URL}?${params}`;
    }
    sidebarEl.style.transform = 'translateX(0)';
    sidebarOpen = true;
    if (toggleBtn) toggleBtn.textContent = '✕';
    // Push page content
    document.body.style.transition = 'margin-right 0.25s cubic-bezier(0.4,0,0.2,1)';
    document.body.style.marginRight = '420px';
  }

  function closeSidebar() {
    if (sidebarEl) sidebarEl.style.transform = 'translateX(100%)';
    sidebarOpen = false;
    if (toggleBtn) toggleBtn.textContent = '⚡';
    document.body.style.marginRight = '';
  }

  function toggleSidebar() {
    if (sidebarOpen) closeSidebar();
    else openSidebar();
  }

  // ── Floating toggle button ────────────────────────────────────────────────
  toggleBtn = document.createElement('button');
  toggleBtn.id = '__forge-toggle';
  toggleBtn.textContent = '⚡';
  toggleBtn.title = 'Open Forge AI';
  Object.assign(toggleBtn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '2147483647',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED, #F97316)',
    border: 'none',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,58,237,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s, box-shadow 0.15s',
    fontFamily: 'system-ui, sans-serif'
  });
  toggleBtn.onmouseenter = () => { toggleBtn.style.transform = 'scale(1.1)'; toggleBtn.style.boxShadow = '0 6px 24px rgba(124,58,237,0.7)'; };
  toggleBtn.onmouseleave = () => { toggleBtn.style.transform = 'scale(1)'; toggleBtn.style.boxShadow = '0 4px 16px rgba(124,58,237,0.5)'; };
  toggleBtn.onclick = toggleSidebar;
  document.body.appendChild(toggleBtn);

  // ── Message listener (from background/popup) ─────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'toggle-sidebar') toggleSidebar();
    if (msg.type === 'open-sidebar') openSidebar();
    if (msg.type === 'close-sidebar') closeSidebar();
    if (msg.type === 'get-page-context') sendContext();
  });

  // Keyboard shortcut: Alt+Shift+F
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key === 'F') toggleSidebar();
  });
})();
