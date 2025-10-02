function validateParentOnRemove(task) {
  const list = task.querySelector(".subtasks");
  const siblingCheckboxes = list ? list.querySelectorAll("input[type='checkbox']") : [];
  const parentCheckbox = task.querySelector("input[type='checkbox']");

  if (siblingCheckboxes.length > 0) {
    const allChecked = Array.from(siblingCheckboxes).every(cb => cb.checked);
    parentCheckbox.checked = allChecked;
  }

  const grandParentTask = task.parentElement.closest("li");
  if (grandParentTask) {
    validateParentOnRemove(grandParentTask);
  }
}

function handleCheckboxChange(checkbox) {
  const parentTask = checkbox.closest("li").parentElement.closest("li");
  const sublist = checkbox.parentElement.querySelector(".subtasks");

  // check/uncheck children
  if (sublist && sublist.hasChildNodes()) {
    sublist.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = checkbox.checked);
  }

  if (parentTask) {
    checkParentHierarchy(parentTask);
  }

  if (!checkbox.checked && parentTask) {
    uncheckParentHierarchy(parentTask);
  }

  window.saveToLocalStorage();
}

function checkParentHierarchy(task) {
  const list = task.querySelector(".subtasks");
  const siblingCheckboxes = list ? list.querySelectorAll("input[type='checkbox']") : [];
  const parentCheckbox = task.querySelector("input[type='checkbox']");

  if (siblingCheckboxes.length > 0) {
    const allChecked = Array.from(siblingCheckboxes).every(cb => cb.checked);
    parentCheckbox.checked = allChecked;
  }

  const grandParentTask = task.parentElement.closest("li");
  if (grandParentTask && parentCheckbox.checked) {
    checkParentHierarchy(grandParentTask);
  }
}

function uncheckParentHierarchy(task) {
  const list = task.querySelector(".subtasks");
  const parentCheckbox = task.querySelector("input[type='checkbox']");

  if (parentCheckbox.checked) {
    parentCheckbox.checked = false;
  }

  const grandParentTask = task.parentElement.closest("li");
  if (grandParentTask) {
    uncheckParentHierarchy(grandParentTask);
  }
}

window.validateParentOnRemove = validateParentOnRemove;
window.handleCheckboxChange = handleCheckboxChange;
window.checkParentHierarchy = checkParentHierarchy;
window.uncheckParentHierarchy = uncheckParentHierarchy; 