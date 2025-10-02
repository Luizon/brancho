function addTask(text = "New task", parent = document.getElementById("taskList"), level = 0) {
  const li = document.createElement("li");
  const taskType = level === 0 ? "main-task" : "subtask";
  li.classList.add(taskType);
  li.style.setProperty('--level', level);

  li.innerHTML = `
    <button class="btn-toggle" onclick="toggleChildren(this)" disabled style="color: #FFF0;">▼</button>
    <button onclick="removeTask(this)">🗑</button>
    <input type="checkbox">
    <span contenteditable="true">${text}</span>
    <button onclick="openModal(this)">📝</button>
    <button onclick="addTask('Subtask', this.parentElement.querySelector('.subtasks'), ${level + 1})">+</button>
    <div class="task-description hidden"></div>
    <ul class="subtasks task"></ul>
  `;

  li.setAttribute("data-description", "");
  parent.appendChild(li);
  
  addTaskEventListeners(li);
  window.observer.observe(li.querySelector("ul.subtasks"));
  window.addTreeLines(li);

  if(level > 0) {
    parent.parentElement.querySelector(".btn-toggle").disabled = false;
    parent.parentElement.querySelector(".btn-toggle").style.color = "#FFFF";
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

  window.animateReapearAllTreeLines();
  setTimeout(() => {
    window.updateTreeLineHeight(parent);
    window.updateAllTreeLines();
  }, 500);

  window.saveToLocalStorage();
}

function removeTask(button) {
  const taskElement = button.parentElement;

  if(taskElement.classList.contains("removing")) return; // It's already being removed

  taskElement.style.animation = "none";
  void taskElement.offsetWidth; // Force reflow
  taskElement.style.animation = "fadeOutTask 0.4s ease-out forwards";

  taskElement.classList.add("removing");
  window.removeTreeLines(taskElement);
  
  window.animateReapearAllTreeLines();
  setTimeout(() => {
    const parentTask = taskElement.parentElement.closest("li");
    const parentUl = taskElement.parentElement;

    taskElement.remove();
    
    window.updateTreeLineHeight(parentUl);
    window.updateAllTreeLines();
    
    if (parentTask) {
      const hasSubtasks = parentTask.querySelector(".subtasks").children.length > 1;
      const hasDescription = parentTask.getAttribute("data-description").trim() !== "";
      const toggleButton = parentTask.querySelector(".btn-toggle");
      toggleButton.disabled = !hasSubtasks && !hasDescription;
      toggleButton.style.color = toggleButton.disabled ? "#FFF0" : "#FFFF";

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