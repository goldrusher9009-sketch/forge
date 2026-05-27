// Forge AI Extension — Background Service Worker (MV3)
// Standalone — no desktop app required. Bridges tab context to sidebar.

const FORGE_URL = 'https://forge-sand-two.vercel.app';

// Store page context per tab
const tabContexts = new Map();

// Listen for tab updates — capture URL/title
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:')) {
    tabContexts.set(tabId, { url: tab.url, title: tab.title || '', text: '', selection: '', ts: Date.now() });
    // Ask content script for page text
    chrome.tabs.sendMessage(tabId, { type: 'get-page-context' }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => tabContexts.delete(tabId));

// Receive messages from content scripts and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'page-context' && sender.tab) {
    tabContexts.set(sender.tab.id, { ...tabContexts.get(sender.tab.id), ...msg, ts: Date.now() });
  }
  if (msg.type === 'get-context') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const ctx = tabs[0] ? (tabContexts.get(tabs[0].id) || { url: tabs[0].url, title: tabs[0].title }) : {};
      sendResponse({ context: ctx });
    });
    return true; // async
  }
  if (msg.type === 'toggle-sidebar') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'toggle-sidebar' }).catch(() => {});
    });
  }
  if (msg.type === 'open-forge') {
    chrome.tabs.create({ url: FORGE_URL });
  }
  if (msg.type === 'get-tab-context') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        const ctx = tabContexts.get(tab.id) || { url: tab.url, title: tab.title };
        sendResponse({ context: ctx });
      } else {
        sendResponse({ context: null });
      }
    });
    return true;
  }
});

// On install/update — show welcome
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: FORGE_URL });
  }
});
