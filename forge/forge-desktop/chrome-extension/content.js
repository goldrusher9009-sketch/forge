// Forge Desktop Bridge — Content Script
// Runs on every page, extracts context and sends to Forge via background

function getPageContext() {
  return {
    type: 'page-content',
    url: window.location.href,
    title: document.title,
    text: document.body?.innerText?.slice(0, 4000) || '',
    selection: window.getSelection()?.toString() || '',
    ts: Date.now()
  };
}

// Send selection when user highlights text
document.addEventListener('mouseup', () => {
  const sel = window.getSelection()?.toString()?.trim();
  if (sel && sel.length > 10) {
    chrome.runtime.sendMessage({ type: 'selection', text: sel, url: window.location.href, title: document.title });
  }
});

// Send page context on load
window.addEventListener('load', () => {
  chrome.runtime.sendMessage(getPageContext());
});
