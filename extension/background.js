// Hawki Cookie Sync — sends LinkedIn cookies to the local Hawki server
// Runs every 5 minutes and on browser startup

const HAWKI_SERVER = "http://localhost:5001";
const COOKIE_NAMES = ["li_at", "JSESSIONID", "bcookie", "lidc", "li_sugr"];

async function syncCookies() {
  try {
    const cookies = {};
    for (const name of COOKIE_NAMES) {
      const cookie = await chrome.cookies.get({
        url: "https://www.linkedin.com",
        name: name,
      });
      if (cookie) {
        cookies[name] = cookie.value;
      }
    }

    if (!cookies.li_at) {
      console.log("Hawki: No li_at cookie found — not logged into LinkedIn");
      await chrome.storage.local.set({ status: "not_logged_in" });
      return;
    }

    // Send to Hawki server
    const resp = await fetch(HAWKI_SERVER + "/api/update-cookies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cookies),
    });

    if (resp.ok) {
      console.log("Hawki: Cookies synced");
      await chrome.storage.local.set({
        status: "synced",
        lastSync: new Date().toISOString(),
      });
    } else {
      console.log("Hawki: Server error", resp.status);
      await chrome.storage.local.set({ status: "server_error" });
    }
  } catch (e) {
    console.log("Hawki: Sync failed", e.message);
    await chrome.storage.local.set({ status: "offline" });
  }
}

// Sync on install/startup
chrome.runtime.onInstalled.addListener(syncCookies);
chrome.runtime.onStartup.addListener(syncCookies);

// Sync every 5 minutes
chrome.alarms.create("cookieSync", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cookieSync") syncCookies();
});

// Manual sync from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "sync") syncCookies();
});

// Sync when LinkedIn cookies change
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (
    changeInfo.cookie.domain.includes("linkedin.com") &&
    COOKIE_NAMES.includes(changeInfo.cookie.name)
  ) {
    syncCookies();
  }
});
