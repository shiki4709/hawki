function updateUI() {
  chrome.storage.local.get(["status", "lastSync", "li_at"], (data) => {
    const el = document.getElementById("status");
    const status = data.status || "unknown";

    if (status === "synced" && data.li_at) {
      const ago = data.lastSync ? timeAgo(new Date(data.lastSync)) : "";
      const masked = data.li_at.slice(0, 10) + "..." + data.li_at.slice(-4);
      el.className = "status status-ok";
      el.innerHTML = "Connected<div class='detail'>" + masked + "</div><div class='time'>Synced " + ago + "</div>";
    } else if (status === "not_logged_in") {
      el.className = "status status-err";
      el.textContent = "Not logged into LinkedIn. Open linkedin.com and log in.";
    } else {
      el.className = "status status-off";
      el.textContent = "Not synced yet. Click Sync Now.";
    }
  });
}

function manualSync() {
  const btn = document.getElementById("sync-btn");
  btn.textContent = "Syncing...";
  btn.disabled = true;
  chrome.runtime.sendMessage({ action: "sync" });
  setTimeout(() => {
    btn.textContent = "Sync Now";
    btn.disabled = false;
    updateUI();
  }, 2000);
}

function openHawki() {
  chrome.tabs.create({ url: "https://hawki-sigma.vercel.app" });
}

function timeAgo(date) {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  return Math.round(mins / 60) + "h ago";
}

updateUI();
