// Content script — bridges between Hawki page and extension
// Listens for custom events from the page, asks the extension for the cookie

window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "HAWKI_GET_COOKIE") {
    chrome.runtime.sendMessage({ action: "getCookie" }, (response) => {
      if (response && response.li_at) {
        // Save to localStorage so the page can use it
        localStorage.setItem("hawki_li_at", response.li_at);
        // Notify the page
        window.postMessage({ type: "HAWKI_COOKIE_READY", li_at: response.li_at }, "*");
      }
    });
  }
});

// Auto-inject on page load
chrome.runtime.sendMessage({ action: "getCookie" }, (response) => {
  if (response && response.li_at) {
    localStorage.setItem("hawki_li_at", response.li_at);
    window.postMessage({ type: "HAWKI_COOKIE_READY", li_at: response.li_at }, "*");
  }
});
