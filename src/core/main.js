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

  const fabButton = document.getElementById("fabButton");
  const fabMenuPanel = document.getElementById("fabMenuPanel");
  const fileLoader = document.getElementById("fileLoader");
  const menuAddMain = document.getElementById("menuAddMain");
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
      fabMenuPanel && fabMenuPanel.classList.remove("show");
    });
  }

  window.confirmClear = () => {
    localStorage.removeItem("savedText");
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";
    if (window.showToast) window.showToast('<img src="./assets/img/trash.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>List cleared');
    window.closeConfirmModal();
  };

  window.closeConfirmModal = () => {
    const modal = document.getElementById("confirmClearModal");
    modal.classList.remove("show");
    modal.classList.add("hidden");
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