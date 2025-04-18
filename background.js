chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_PAGE_TEXT") {
    console.log("Saving page:", message.url);
    const timestamp = new Date().toISOString();
    chrome.storage.local.get({ visitedPages: [] }, (data) => {
      const filtered = data.visitedPages.filter(page => page.url !== message.url);
      const updated = [...filtered, { url: message.url, text: message.text, timestamp }];
      chrome.storage.local.set({ visitedPages: updated });
    });
  }
});