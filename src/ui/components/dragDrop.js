function setupDragAndDrop(li) {
  li.setAttribute("draggable", "true");

  li.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", null); // needed for firefox
    if(window.draggedTask)
      return;
    window.draggedTask = li;
    window.lastParent = li.parentElement.closest("li");
    li.classList.add("dragging");
  });

  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
    window.draggedTask = null;
  });

  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    if( e.target !== li && e.target.parentElement !== li )
      return;
    li.classList.add("drag-over");
    const rect = li.getBoundingClientRect();
    const mouseY = e.clientY;
    const topZone = rect.top + rect.height / 3;
    const bottomZone = rect.bottom - rect.height / 3;

    if (mouseY < topZone) {
      window.showInsertionLine(li, "top");
    } else if (mouseY > bottomZone) {
      window.showInsertionLine(li, "bottom");
    } else {
      window.showInsertionLine(li, "middle");
    }
  });

  li.addEventListener("dragleave", () => {
    li.classList.remove("drag-over");
    window.hideInsertionLine();
  });

  li.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    li.classList.remove("drag-over");
    window.hideInsertionLine();
    const dragged = window.draggedTask;
    if (
      dragged &&
      dragged !== li &&
      !dragged.contains(li)
    ) {
      const rect = li.getBoundingClientRect();
      const mouseY = e.clientY;
      const topZone = rect.top + rect.height / 3;
      const bottomZone = rect.bottom - rect.height / 3;

      if (mouseY < topZone) {
        li.parentElement.insertBefore(dragged, li);
        if (!li.parentElement.closest("li")) {
          dragged.classList.add("main-task");
          dragged.classList.remove("subtask");
        } else {
          dragged.classList.remove("main-task");
          dragged.classList.add("subtask");
        }
      } else if (mouseY > bottomZone) {
        li.parentElement.insertBefore(dragged, li.nextSibling);
        if (!li.parentElement.closest("li")) {
          dragged.classList.add("main-task");
          dragged.classList.remove("subtask");
        } else {
          dragged.classList.remove("main-task");
          dragged.classList.add("subtask");
        }
      } else {
        const sublist = li.querySelector(".subtasks");
        sublist.appendChild(dragged);
        dragged.classList.remove("main-task");
        dragged.classList.add("subtask");

        const toggleButton = li.querySelector(".btn-toggle");
        toggleButton.disabled = false;
        toggleButton.children[0].style.opacity = "1";
        window.maximize(sublist, li.querySelector(".task-description"));
      }

      const parentTask = li.closest("li");
      if (parentTask) {
        window.validateParentOnRemove(parentTask);
      }
      if (window.lastParent) {
        window.validateParentOnRemove(window.lastParent);
        const hasSubtasks = window.lastParent.querySelectorAll(".subtasks > li").length > 0;
        const hasDescription = window.lastParent.getAttribute("data-description").trim() !== "";
        const toggleButton = window.lastParent.querySelector(".btn-toggle");
        toggleButton.disabled = !hasSubtasks && !hasDescription;
        toggleButton.children[0].style.opacity = toggleButton.disabled ? "0" : "1";
      }

      window.saveToLocalStorage();
    }
  });
}

window.setupDragAndDrop = setupDragAndDrop; 