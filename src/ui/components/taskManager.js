function addTask(text = "New task", parent = document.getElementById("taskList"), level = 0) {
  const li = document.createElement("li");
  const taskType = level === 0 ? "main-task" : "subtask";
  li.classList.add(taskType);
  li.style.setProperty('--level', level);

  li.innerHTML = `
    <button class="btn-toggle" onclick="toggleChildren(this)" disabled style="color: #FFF0;"><img src="./assets/img/triangle-down-filled.svg" style="opacity: 0;" alt="toggle" width="14" height="14"></button>
    <input type="checkbox">
    <span contenteditable="true">${text}</span>
    <button class="btn-edit" onclick="openModal(this)"><img src="./assets/img/edit.svg" alt="edit" width="14" height="14"></button>
    <button class="btn-add" onclick="addTask('Subtask', this.parentElement.querySelector('.subtasks'), ${level + 1})"><img src="./assets/img/plus.svg" alt="add" width="14" height="14"></button>
    <div class="task-description hidden"></div>
    <button class="btn-remove" onclick="removeTask(this)"><img src="./assets/img/trash.svg" alt="remove" width="14" height="14"></button>
    <ul class="subtasks task"></ul>
  `;

  li.setAttribute("data-description", "");
  parent.appendChild(li);
  
  addTaskEventListeners(li);

  if(level > 0) {
    parent.parentElement.querySelector(".btn-toggle").disabled = false;
    parent.parentElement.querySelector(".btn-toggle").children[0].style.opacity = "1";
    if(parent.classList.contains("hidden")) {
      window.maximize(parent, parent.parentElement.querySelector(".task-description"));
    }
  }

  const parentTask = parent.closest("li");
  if (parentTask) {
    window.uncheckParentHierarchy(parentTask);
  }

  li.style.animation = "none";
  void li.offsetWidth; // Force reflow
  li.style.animation = "fadeInTask 0.4s ease-out forwards";

  li.querySelector("span").focus();
  
  const range = document.createRange();
  range.selectNodeContents(li.querySelector("span"));
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);


  window.saveToLocalStorage();
}

function removeTask(button) {
  const taskElement = button.parentElement;

  if(taskElement.classList.contains("removing")) return; // It's already being removed

  taskElement.style.animation = "none";
  void taskElement.offsetWidth; // Force reflow
  taskElement.style.animation = "fadeOutTask 0.4s ease-out forwards";

  taskElement.classList.add("removing");
  
  setTimeout(() => {
    const parentTask = taskElement.parentElement.closest("li");

    taskElement.remove();
    
    if (parentTask) {
      const hasSubtasks = parentTask.querySelectorAll(".subtasks > li").length > 0;
      const hasDescription = parentTask.getAttribute("data-description").trim() !== "";
      const toggleButton = parentTask.querySelector(".btn-toggle");
      toggleButton.disabled = !hasSubtasks && !hasDescription;
      toggleButton.children[0].style.opacity = toggleButton.disabled ? "0" : "1";

      window.validateParentOnRemove(parentTask);
    }

    window.saveToLocalStorage();
  }, 400);
}

function addTaskEventListeners(li) {
  li.querySelector("input[type='checkbox']").addEventListener("change", (e) => window.handleCheckboxChange(li.querySelector("input[type='checkbox']")) );
  li.querySelector("span").addEventListener("input", (e) => window.saveToLocalStorage() );

  window.setupDragAndDrop(li);
}

window.addTask = addTask;
window.removeTask = removeTask;
window.addTaskEventListeners = addTaskEventListeners; 