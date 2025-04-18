const pageText = document.body.innerText;
chrome.runtime.sendMessage({ type: "SAVE_PAGE_TEXT", text: pageText, url: window.location.href });
document.getElementById("clearTrackedPages").addEventListener("click", () => {
  chrome.storage.local.set({ visitedPages: [] }, () => {
    document.getElementById("statusMsg").textContent = "Tracked pages cleared.";
    updateTrackedPageCount();
  });
});