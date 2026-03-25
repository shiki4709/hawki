function updateUI() {
  chrome.storage.local.get(["status", "lastSync"], (data) => {
    const el = document.getElementById("status");
    const status = data.status || "unknown";

    if (status === "synced") {
      const ago = data.lastSync
        ? timeAgo(new Date(data.lastSync))
        : "";
      el.className = "status status-ok";
      el.innerHTML = "Connected<div class='time'>Last synced " + ago + "</div>";
    } else if (status === "not_logged_in") {
      el.className = "status status-err";
      el.textContent = "Not logged into LinkedIn";
    } else if (status === "server_error") {
      el.className = "status status-err";
      el.textContent = "Hawki server not running";
    } else if (status === "offline") {
      el.className = "status status-off";
      el.textContent = "Can't reach Hawki server";
    } else {
      el.className = "status status-off";
      el.textContent = "Not synced yet";
    }
  });
}

function manualSync() {
  chrome.runtime.sendMessage({ action: "sync" });
  document.getElementById("sync-btn").textContent = "Syncing...";
  setTimeout(() => {
    document.getElementById("sync-btn").textContent = "Sync Now";
    updateUI();
  }, 2000);
}

function timeAgo(date) {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  return Math.round(mins / 60) + "h ago";
}

updateUI();
