// Global variables
window.insertionLine = null;
window.draggedTask = null;
window.lastParent = null;

// Event listeners
document.addEventListener("keydown", event => {
  if(event.key === "Escape") {
    const modal = document.getElementById("descriptionModal");
    if (modal.classList.contains("show")) {
      window.closeModal();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Initialize auth and then tasks
  if (window.initAuthAndTasks) {
    window.initAuthAndTasks();
  } else {
    const savedText = localStorage.getItem("savedText");
    if (savedText) {
      window.processList();
    }
  }

  // Remove file save/load buttons inside Android/iOS WebViews where they don't work
  try {
    const ua = navigator.userAgent || "";
    const isWebView = /(\bwv\b|WebView)/i.test(ua);
    if (isWebView) {
      const saveBtn = document.getElementById("menuSaveFile");
      if (saveBtn) saveBtn.remove();
      const loadBtn = document.getElementById("menuLoadFile");
      if (loadBtn) loadBtn.remove();
    }
  } catch (_) { /* noop */ }

  const fabButton = document.getElementById("fabButton");
  const fabMenuPanel = document.getElementById("fabMenuPanel");
  const fileLoader = document.getElementById("fileLoader");
  const menuAddMain = document.getElementById("menuAddMain");
  const menuToggleCompleted = document.getElementById("menuToggleCompleted");
  const menuSaveFile = document.getElementById("menuSaveFile");
  const menuLoadFile = document.getElementById("menuLoadFile");
  const menuClearAll = document.getElementById("menuClearAll");

  if (fabButton && fabMenuPanel) {
    fabButton.addEventListener("click", () => {
      fabMenuPanel.classList.toggle("show");
    });
  }

  if (menuAddMain) {
    menuAddMain.addEventListener("click", () => {
      window.addTask();
      fabMenuPanel && fabMenuPanel.classList.remove("show");
    });
  }

  if (menuToggleCompleted) {
    // Initialize visual state from localStorage using showCompleted (default: true)
    const show = localStorage.getItem("showCompleted") === "true" || localStorage.getItem("showCompleted") === null;
    menuToggleCompleted.innerHTML = `${show
      ? '<img src="./assets/img/eye.svg" alt="" width="18" height="18" style="vertical-align:middle; margin-right:6px;">'
      : '<img src="./assets/img/eye-slash.svg" alt="" width="18" height="18" style="vertical-align:middle; margin-right:6px;">'}Show completed`;
    // Green when showing completed (show=true); gray when hiding (show=false)
    menuToggleCompleted.classList.toggle('autosave-on', show);
    menuToggleCompleted.classList.toggle('autosave-off', !show);
    menuToggleCompleted.classList.toggle('muted-text', !show);
    menuToggleCompleted.addEventListener("click", () => {
      const currentShow = localStorage.getItem("showCompleted") === "true" || localStorage.getItem("showCompleted") === null;
      const nextShow = !currentShow;
      localStorage.setItem("showCompleted", String(nextShow));
      if (window.setHideCompleted) window.setHideCompleted(!nextShow);
      // Update visual state: green/eye when showing, gray/eye-slash when hiding
      menuToggleCompleted.classList.toggle('autosave-on', nextShow);
      menuToggleCompleted.classList.toggle('autosave-off', !nextShow);
      menuToggleCompleted.classList.toggle('muted-text', !nextShow);
      menuToggleCompleted.innerHTML = `${nextShow
        ? '<img src="./assets/img/eye.svg" alt="" width="18" height="18" style="vertical-align:middle; margin-right:6px;">'
        : '<img src="./assets/img/eye-slash.svg" alt="" width="18" height="18" style="vertical-align:middle; margin-right:6px;">'}Show completed`;
      fabMenuPanel && fabMenuPanel.classList.remove("show");
    });
  }

  if (menuSaveFile && window.storageManager && window.storageManager.saveToFile) {
    menuSaveFile.addEventListener("click", window.storageManager.saveToFile);
  }

  if (menuLoadFile && fileLoader) {
    menuLoadFile.addEventListener("click", () => {
      fileLoader.value = "";
      fileLoader.click();
    });
    if (window.storageManager && window.storageManager.loadFile) {
      fileLoader.addEventListener("change", window.storageManager.loadFile);
    }
  }

  if (menuClearAll) {
    menuClearAll.addEventListener("click", () => {
      const confirmModal = document.getElementById("confirmClearModal");
      if (!confirmModal) return;
      confirmModal.classList.remove("hidden");
      confirmModal.classList.add("show");
      const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
      const confirmBtn = confirmModal.querySelector('.modal-btn-danger');
      const cancelBtn = confirmModal.querySelector('.modal-btn-close');
      const onEnterKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (confirmBtn) confirmBtn.click(); } };
      document.addEventListener('keydown', onEnterKey); confirmModal._onEnterKey = onEnterKey; confirmModal._prevOverflow = prev || '';
      fabMenuPanel && fabMenuPanel.classList.remove("show");
    });
  }

  window.confirmClear = (autoLogOut = false) => {
    localStorage.removeItem("savedText");
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";
    if (!autoLogOut && window.showToast) {
      window.showToast('<img src="./assets/img/trash.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>List cleared');
    }
    window.closeConfirmModal();
  };

  window.closeConfirmModal = () => {
    const modal = document.getElementById("confirmClearModal");
    modal.classList.remove("show");
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    if (modal && modal._onEnterKey) { document.removeEventListener('keydown', modal._onEnterKey); modal._onEnterKey = null; }
  };

  document.addEventListener("keydown", event => {
    if(event.key === "Escape") {
      const confirmModal = document.getElementById("confirmClearModal");
      if (confirmModal && confirmModal.classList.contains("show")) {
        window.closeConfirmModal();
      }
    }
  });

  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
});