let lastCloudSyncAt = 0;
let autosyncIntervalId = null;
let syncBlocked = false;
let autoSaveEnabled = true;

function getLastSyncLabel(ts) {
  if (!ts) return "Never";
  const d = new Date(ts);
  return d.toLocaleString();
}

function updateSyncStatus(text) {
  const el = document.getElementById("sync-status");
  if (el) el.textContent = text;
}

async function syncToCloud() {
  if (syncBlocked) {
    updateSyncStatus("Sync paused");
    return false;
  }
  if (!window.api || !window.api.getAuthToken()) {
    updateSyncStatus("Login to sync");
    return false;
  }
  try {
    const text = localStorage.getItem("savedText") || "";
    await window.api.updateMyTasks(text);
    lastCloudSyncAt = Date.now();
    localStorage.setItem("lastCloudSyncAt", String(lastCloudSyncAt));
    updateSyncStatus(`Last sync: ${getLastSyncLabel(lastCloudSyncAt)}`);
    return true;
  } catch (err) {
    updateSyncStatus("Sync failed");
    return false;
  }
}

function startAutoSync() {
  stopAutoSync();
  const stored = localStorage.getItem("lastCloudSyncAt");
  if (stored) {
    const ts = parseInt(stored, 10);
    if (!isNaN(ts)) lastCloudSyncAt = ts;
  }
  autosyncIntervalId = setInterval(async () => {
    const TEN_MIN = 10 * 60 * 1000;
    const now = Date.now();
    if (syncBlocked) return;
    if (autoSaveEnabled && now - lastCloudSyncAt >= TEN_MIN) {
      await syncToCloud();
    }
  }, 60 * 1000); // check every minute
}

function stopAutoSync() {
  if (autosyncIntervalId) clearInterval(autosyncIntervalId);
  autosyncIntervalId = null;
}

function setupSyncUI() {
  const btn = document.getElementById("sync-btn");
  if (btn) btn.addEventListener("click", syncToCloud);
  updateSyncStatus(`Last sync: ${getLastSyncLabel(lastCloudSyncAt)}`);
  // autosave toggle
  const toggle = document.getElementById("autosave-toggle");
  if (toggle) {
    const saved = localStorage.getItem("autosaveEnabled");
    if (saved !== null) autoSaveEnabled = saved === "true";
    applyAutosaveToggleUI(toggle);
    toggle.addEventListener("click", () => {
      autoSaveEnabled = !autoSaveEnabled;
      localStorage.setItem("autosaveEnabled", String(autoSaveEnabled));
      applyAutosaveToggleUI(toggle);
      if (autoSaveEnabled) {
        if (window.showInfo) window.showInfo('Autosave enabled', 'Brancho will automatically save your tasks to the cloud every 10 minutes.');
      }
    });
  }
}

function applyAutosaveToggleUI(el) {
  el.classList.remove("autosave-on", "autosave-off");
  el.classList.add(autoSaveEnabled ? "autosave-on" : "autosave-off");
}

function blockSync() {
  syncBlocked = true;
  updateSyncStatus("Sync paused");
}

function unblockSync() {
  syncBlocked = false;
  updateSyncStatus(`Last sync: ${getLastSyncLabel(lastCloudSyncAt)}`);
}

function isSyncBlocked() {
  return syncBlocked;
}

window.sync = {
  syncToCloud,
  startAutoSync,
  stopAutoSync,
  setupSyncUI,
  blockSync,
  unblockSync,
  isSyncBlocked,
  get autoSaveEnabled() { return autoSaveEnabled; },
};



