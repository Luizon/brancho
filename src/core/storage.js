let saveDebounceTimer = null;

function generateTasksString() {
  const output = [];
  
  function traverseList(element, level = 0) {
    element.querySelectorAll(":scope > li").forEach(li => {
      const checkbox = li.querySelector("input[type='checkbox']");
      const text = li.querySelector("span").innerText.trim();
      const isChecked = checkbox.checked ? "[x]" : "[ ]";
      
      let description = li.getAttribute("data-description") || "";
      
      if (description.trim() !== "") {
        description = description.replace(/\n/g, "\\n");
        output.push("\t".repeat(level) + isChecked + " " + text + " [Description: " + description + "]");
      } else {
        output.push("\t".repeat(level) + isChecked + " " + text);
      }

      const sublist = li.querySelector(".subtasks");
      if (sublist) traverseList(sublist, level + 1);
    });
  }

  traverseList(document.getElementById("taskList"));
  return output.join("\n");
}

function exportList() {
  const text = generateTasksString();
  localStorage.setItem("hasSaved", "true");
  localStorage.setItem("savedText", text);
  return text;
}

function saveToLocalStorage() {
  exportList();
}

function processList() {
  const taskList = document.getElementById("taskList");
  taskList.style.animation = "none";
  void taskList.offsetWidth;
  taskList.style.animation = "fadeIn 0.5s ease-out forwards";

  const text = localStorage.getItem("hasSaved") === "true"
  ? localStorage.getItem("savedText")
  : `[ ] Example main task
	[ ] task 2 [Description: IMPORTANT:\\ncheck task 5]
		[ ] task 4
		[ ] task 5
	[x] task 3`;
  
  const lines = text ? text.split("\n").filter(line => line.trim() !== "") : [];
  const root = document.getElementById("taskList");
  root.innerHTML = "";

  const stack = [{ element: root, level: -1 }];

  lines.forEach(line => {
    const level = line.match(/^\s*/)[0].length / 2;
    const isChecked = line.includes("[x]");
    
    let description = "";
    let innerDescription = "";
    const descriptionMatch = line.match(/\[Description: (.+)\]$/);
    if (descriptionMatch) {
      description = descriptionMatch[1].replace(/\\n/g, "\n");
      innerDescription = window.replaceURLsWithContent(description);
      innerDescription = window.processLists(innerDescription);
      innerDescription = innerDescription
          .replace(/(^|\n)( +)/g, (match, p1, spaces) => p1 + spaces.replace(/ /g, "&nbsp;")) // blank spaces
          .replace(/\n/g, "<br>") // break lines
      line = line.replace(/\[Description: .+\]$/, "").trim();
    }

    const text = line.replace(/^\s*\[.?\]\s*/, "").trim();

    const li = document.createElement("li");
    const taskType = level === 0 ? "main-task" : "subtask";
    li.classList.add(taskType);
    li.style.setProperty('--level', level);

    li.setAttribute("data-description", description);

    li.innerHTML = `
      <button class="btn-toggle" onclick="toggleChildren(this)"><img src="./assets/img/triangle-down-filled.svg" alt="toggle" width="14" height="14"></button>
      <input type="checkbox" ${isChecked ? "checked" : ""}>
      <span contenteditable="true">${text}</span>
      <button class="btn-edit" onclick="openModal(this)"><img src="./assets/img/edit.svg" alt="edit" width="14" height="14"></button>
      <button class="btn-add" onclick="addTask('Subtask', this.parentElement.querySelector('.subtasks'), ${level + 1})"><img src="./assets/img/plus.svg" alt="add" width="14" height="14"></button>
      <div class="task-description ${description ? "" : "hidden"}">${innerDescription}</div>
      <button class="btn-remove" onclick="removeTask(this)"><img src="./assets/img/trash.svg" alt="remove" width="14" height="14"></button>
      <ul class="subtasks task"></ul>
    `;

    window.addTaskEventListeners(li);

    while (stack[stack.length - 1].level >= level) stack.pop();
    stack[stack.length - 1].element.appendChild(li);
    stack.push({ element: li.querySelector(".subtasks"), level });

    setTimeout(() => {
      const toggleButton = li.querySelector(".btn-toggle");

      // minimize the toggle button if there are no subtasks
      const subtasks = li.querySelectorAll(".subtasks input[type='checkbox']");
      if (subtasks.length > 0 && Array.from(subtasks).every(cb => cb.checked)) {
        window.toggleChildren(toggleButton);
      }

      // disable the toggle button if there are no subtasks and no description
      const hasSubtasks = li.querySelectorAll(".subtasks > li").length > 0;
      const description = li.getAttribute("data-description") || "";
      if (!hasSubtasks && description.trim() === "") {
        toggleButton.disabled = true;
        toggleButton.children[0].style.opacity = "0";
      }
    }, 10);
  });
}

window.exportList = exportList;
window.saveToLocalStorage = saveToLocalStorage;
window.processList = processList; 

// File save/load API
function saveToFile() {
  const text = localStorage.getItem("savedText") || exportList();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `Brancho-todo-list_${new Date().toISOString().replaceAll(/[T:-]/g, ' ').split('.')[0]}.txt`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (window.showToast) window.showToast(`<img src="./assets/img/file-text.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>List saved to ${filename}`); else window.showToast(`<img src="./assets/img/file-text.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>List saved to ${filename}`);
  const fabMenuPanel = document.getElementById("fabMenuPanel");
  if (fabMenuPanel) fabMenuPanel.classList.remove("show");
}

async function loadFile(event) {
  const input = event && event.target ? event.target : document.getElementById("fileLoader");
  const file = input && input.files && input.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const hasValidTask = text.split('\n').some(line => line.trim().match(/^\s*\[[ x]\]\s+\S+/));
    if (!hasValidTask) {
      if(text)
        throw new Error("Invalid file format. Expected tasks with '[ ]' or '[x]' markers.");
      else
        throw new Error("File is empty.");
    }
    localStorage.setItem("savedText", text);
    window.processList();
    if (window.showToast) window.showToast(`<img src="./assets/img/file-text.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>Loaded ${file.name} successfully`); else window.showToast(`<img src="./assets/img/file-text.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>Loaded ${file.name} successfully`);
  } catch (error) {
    if (window.showToast) window.showToast(`<img src="./assets/img/cross-mark.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>${error.message || 'Failed to load file'}`, 'error'); else window.showToast(`<img src="./assets/img/cross-mark.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>${error.message || 'Failed to load file'}`, 'error');
  }
  const fabMenuPanel = document.getElementById("fabMenuPanel");
  if (fabMenuPanel) fabMenuPanel.classList.remove("show");
}

window.storageManager = {
  saveToFile,
  loadFile,
};