// Hawki Cookie Sync — grabs LinkedIn cookies and stores them
// for the Hawki app to use

const HAWKI_DOMAINS = [
  "https://hawki-sigma.vercel.app",
  "http://localhost:5001"
];

async function syncCookies() {
  try {
    const cookie = await chrome.cookies.get({
      url: "https://www.linkedin.com",
      name: "li_at",
    });

    if (!cookie || !cookie.value) {
      console.log("Hawki: No li_at cookie — not logged into LinkedIn");
      await chrome.storage.local.set({ status: "not_logged_in", li_at: "" });
      return;
    }

    const liAt = cookie.value;
    console.log("Hawki: Got li_at cookie");

    // Store in extension storage
    await chrome.storage.local.set({
      status: "synced",
      li_at: liAt,
      lastSync: new Date().toISOString(),
    });

    // Inject into Hawki pages' localStorage
    for (const domain of HAWKI_DOMAINS) {
      try {
        // Find any open Hawki tabs and inject
        const tabs = await chrome.tabs.query({ url: domain + "/*" });
        for (const tab of tabs) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (key) => { localStorage.setItem("hawki_li_at", key); },
            args: [liAt],
          });
        }
      } catch (e) {
        // Tab might not exist, that's fine
      }
    }

    console.log("Hawki: Cookies synced");
  } catch (e) {
    console.log("Hawki: Sync failed", e.message);
    await chrome.storage.local.set({ status: "error" });
  }
}

// Sync on install/startup
chrome.runtime.onInstalled.addListener(syncCookies);
chrome.runtime.onStartup.addListener(syncCookies);

// Sync every 2 minutes
chrome.alarms.create("cookieSync", { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cookieSync") syncCookies();
});

// Manual sync from popup or page request
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "sync") syncCookies();
  if (msg.action === "getCookie") {
    chrome.storage.local.get(["li_at"], (data) => {
      sendResponse({ li_at: data.li_at || "" });
    });
    return true; // keep channel open for async response
  }
});

// Sync immediately when LinkedIn cookies change
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (
    changeInfo.cookie.domain.includes("linkedin.com") &&
    changeInfo.cookie.name === "li_at"
  ) {
    syncCookies();
  }
});
