// Right-click menu. Clicking an item grants activeTab for that tab, so no host permissions are needed.
const FILES = ['tamal.js', 'content.js'];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'selection', title: 'Show selection in Tamil script', contexts: ['selection'] });
  chrome.contextMenus.create({ id: 'page', title: 'Convert this page to Tamil script', contexts: ['page'] });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: FILES });
    if (info.menuItemId === 'selection') await chrome.tabs.sendMessage(tab.id, { type: 'selection', text: info.selectionText });
    else await chrome.tabs.sendMessage(tab.id, { type: 'page' });
  } catch (e) {
    console.warn('Tamal:', e.message); // e.g. chrome:// pages, the Web Store or the built-in PDF viewer
  }
});

// "Always convert on this site": each granted site permission gets a content script that runs on every load.
// The permission is the source of truth, so granting or removing a site in Chrome's own settings works too.
const AUTO_FILES = ['tamal.js', 'content.js', 'auto.js'];
const autoId = (origin) => `auto ${origin}`;

async function syncAutoSites() {
  const { origins = [] } = await chrome.permissions.getAll();
  const have = new Set((await chrome.scripting.getRegisteredContentScripts()).map((s) => s.id));
  const want = new Set(origins.map(autoId));
  const stale = [...have].filter((id) => !want.has(id));
  if (stale.length) await chrome.scripting.unregisterContentScripts({ ids: stale });
  const added = origins.filter((o) => !have.has(autoId(o)));
  if (added.length) {
    await chrome.scripting.registerContentScripts(added.map((o) => ({
      id: autoId(o), matches: [o], js: AUTO_FILES, runAt: 'document_idle', persistAcrossSessions: true,
    })));
  }
}

// One sync at a time, so overlapping events never register the same script twice.
let syncing = Promise.resolve();
const queueSync = () => { syncing = syncing.then(syncAutoSites).catch((e) => console.warn('Tamal:', e.message)); };

chrome.permissions.onAdded.addListener(queueSync);
chrome.permissions.onRemoved.addListener(queueSync);
chrome.runtime.onInstalled.addListener(queueSync);
chrome.runtime.onStartup.addListener(queueSync);
