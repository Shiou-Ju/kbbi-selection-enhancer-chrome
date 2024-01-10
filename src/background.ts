const OPTION_ID = 'searchKBBI' as const;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: OPTION_ID,
    title: 'Search in KBBI for "%s"',
    contexts: ['selection'],
  });
});

function isTextSearchable(text: string | undefined): text is string {
  return typeof text === 'string' && text.trim().length > 0;
}

chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId !== OPTION_ID) return;

  if (isTextSearchable(info.selectionText)) {
    const query = encodeURIComponent(info.selectionText);
    const searchUrl = `https://kbbi.co.id/cari?kata=${query}`;
    chrome.tabs.create({ url: searchUrl });
  }
});
