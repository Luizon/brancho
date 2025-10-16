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
  const elMobile = document.getElementById("sync-status-mobile");
  if (elMobile) elMobile.textContent = text;
}

async function syncToCloud() {
  if (syncBlocked) {
    updateSyncStatus("Save paused");
    return false;
  }
  if (!window.api || !window.api.getAuthToken()) {
    updateSyncStatus("Login to save");
    return false;
  }
  const btn = document.getElementById("sync-btn");
  const btnMobile = document.getElementById("sync-btn-mobile");
  const prevText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
  const prevTextMobile = btnMobile ? btnMobile.textContent : '';
  if (btnMobile) { btnMobile.disabled = true; btnMobile.textContent = "Saving..."; }
  try {
    const text = localStorage.getItem("savedText") || "";
    await window.api.updateMyTasks(text);
    lastCloudSyncAt = Date.now();
    localStorage.setItem("lastCloudSyncAt", String(lastCloudSyncAt));
    updateSyncStatus(`Last save: ${getLastSyncLabel(lastCloudSyncAt)}`);
    return true;
  } catch (err) {
    updateSyncStatus("Sync failed");
    if (window.showInfo) window.showInfo('Sync failed', err.message || 'Unable to sync your tasks to the cloud.');
    return false;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = prevText || 'Save to Cloud'; }
    if (btnMobile) { btnMobile.disabled = false; btnMobile.textContent = prevTextMobile || 'Save to Cloud'; }
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
  const btnMobile = document.getElementById("sync-btn-mobile");
  if (btnMobile) btnMobile.addEventListener("click", syncToCloud);
  updateSyncStatus(`Last save: ${getLastSyncLabel(lastCloudSyncAt)}`);
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
  // initialize hide/show completed state on load using showCompleted (default true)
  const show = localStorage.getItem("showCompleted") === "true" || localStorage.getItem("showCompleted") === null;
  setHideCompleted(!show);
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
  updateSyncStatus(`Last save: ${getLastSyncLabel(lastCloudSyncAt)}`);
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

// Hide completed implementation
function applyHideCompletedUI() {}

function setHideCompleted(enabled) {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;
  const selector = 'li.main-task input[type="checkbox"], li.subtask input[type="checkbox"]';
  taskList.querySelectorAll(selector).forEach(cb => {
    const li = cb.closest('li');
    if (!li) return;
    if (enabled && cb.checked) {
      // Hide with existing fade-out animation
      li.style.animation = 'none';
      void li.offsetWidth;
      li.style.animation = 'fadeOutTask 0.4s ease-out forwards';
      setTimeout(() => { li.style.display = 'none'; }, 380);
    } else {
      // Show with existing fade-in animation
      const wasHidden = li.style.display === 'none';
      li.style.display = '';
      if (wasHidden) {
        li.style.animation = 'none';
        void li.offsetWidth;
        li.style.animation = 'fadeInTask 0.4s ease-out forwards';
      }
    }
  });
}

window.applyHideCompletedUI = applyHideCompletedUI;
window.setHideCompleted = setHideCompleted;



