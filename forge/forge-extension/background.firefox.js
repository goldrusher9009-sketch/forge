// Forge AI Extension — Firefox Background Script (MV2)
// Firefox uses persistent background scripts, not service workers

const FORGE_URL = 'https://forge-sand-two.vercel.app';
const tabContexts = new Map();

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('moz-extension:')) {
    tabContexts.set(tabId, { url: tab.url, title: tab.title || '', text: '', selection: '', ts: Date.now() });
    browser.tabs.sendMessage(tabId, { type: 'get-page-context' }).catch(() => {});
  }
});

browser.tabs.onRemoved.addListener((tabId) => tabContexts.delete(tabId));

browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'page-context' && sender.tab) {
    tabContexts.set(sender.tab.id, { ...tabContexts.get(sender.tab.id), ...msg, ts: Date.now() });
  }
  if (msg.type === 'get-tab-context') {
    return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0];
      const ctx = tab ? (tabContexts.get(tab.id) || { url: tab.url, title: tab.title }) : null;
      return { context: ctx };
    });
  }
  if (msg.type === 'toggle-sidebar') {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]) browser.tabs.sendMessage(tabs[0].id, { type: 'toggle-sidebar' }).catch(() => {});
    });
  }
  if (msg.type === 'open-forge') {
    browser.tabs.create({ url: FORGE_URL });
  }
});

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    browser.tabs.create({ url: FORGE_URL });
  }
});
