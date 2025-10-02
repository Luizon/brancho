let currentTaskElement = null;

function openModal(button) {
  currentTaskElement = button.parentElement;
  const modal = document.getElementById("descriptionModal");
  const descriptionText = document.getElementById("descriptionText");

  descriptionText.value = currentTaskElement.getAttribute("data-description") || "";
  modal.classList.remove("hidden");
  modal.classList.add("show");

  setTimeout(() => {
    descriptionText.focus();
    descriptionText.setSelectionRange(descriptionText.value.length, descriptionText.value.length);
  }, 100);

  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };
}

function closeModal() {
  const modal = document.getElementById("descriptionModal");
  modal.classList.remove("show");
  modal.classList.add("hidden");
}

function saveDescription() {
  if (currentTaskElement) {
    const rawText = document.getElementById("descriptionText").value.trim();
    currentTaskElement.setAttribute("data-description", rawText);

    let descElement = currentTaskElement.querySelector(".task-description");

    let processedText = window.replaceURLsWithContent(rawText);
    processedText = window.processLists(processedText);
    descElement.innerHTML = processedText
        .replace(/(^|\n)( +)/g, (match, p1, spaces) => p1 + spaces.replace(/ /g, "&nbsp;")) // blank spaces
        .replace(/\n/g, "<br>") // break lines
    window.maximize(currentTaskElement.querySelector(".subtasks"), descElement);
    if(rawText.trim() === "")
      descElement.classList.add("hidden");

    const toggleButton = currentTaskElement.querySelector(".btn-toggle");
    const hasSubtasks = currentTaskElement.querySelector(".subtasks").children.length > 1;
    toggleButton.disabled = !hasSubtasks && rawText === "";
    toggleButton.style.color = toggleButton.disabled ? "#FFF0" : "#FFFF";

    window.saveToLocalStorage();
  }
  closeModal();
}

function toggleChildren(button) {
  const taskElement = button.parentElement;
  const sublist = taskElement.querySelector(".subtasks");
  const description = taskElement.querySelector(".task-description");

  if(sublist.classList.contains("hidden")) {
    window.maximize(sublist, description);
  }
  else {
    window.minimize(sublist, description);
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.saveDescription = saveDescription;
window.toggleChildren = toggleChildren; 