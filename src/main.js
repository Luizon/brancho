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
});