chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'openNewPage',
    title: 'Open New Blank Page',
    contexts: ['all'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openNewPage') {
    chrome.tabs.create({ url: 'about:blank' });
  }
});
