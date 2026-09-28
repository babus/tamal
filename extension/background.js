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
