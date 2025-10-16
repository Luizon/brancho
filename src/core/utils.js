function replaceURLsWithContent(text) {
  const urlRegex = /\b(https?:\/\/[^\s\n\t]+)\b/g;

  return text.replace(urlRegex, (url) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerURL = url.toLowerCase();

    if (imageExtensions.some(ext => lowerURL.includes(ext))) {
      return `<img src="${url}" class="description-image" tabindex="1" onclick="openFullscreen(this)">`;
    }
    return `<a href="${url}">${url}</a>`;
  });
}

function processLists(text) {
  const lines = text.split('\n');
  const result = [];
  let currentListHtml = '';
  let listStack = [];
  let inListMode = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^(\s*)-\s*(.+)$/);
    
    if (listMatch) {
      const indentLevel = Math.floor(listMatch[1].length / 2);
      const content = listMatch[2];
      
      if (!inListMode) {
        // Starting a new list
        inListMode = true;
        currentListHtml = '';
        listStack = [];
      }
      
      // Close deeper nested lists
      while (listStack.length > indentLevel + 1) {
        currentListHtml += '</ul>';
        listStack.pop();
      }
      
      // Open new nested list if needed
      if (listStack.length === indentLevel) {
        currentListHtml += '<ul>';
        listStack.push(indentLevel);
      }
      
      // Add the list item
      currentListHtml += `<li>${content}</li>`;
      
    } else {
      // Not a list item - close any open lists and add to result
      if (inListMode) {
        // Close all open lists
        while (listStack.length > 0) {
          currentListHtml += '</ul>';
          listStack.pop();
        }
        result.push(currentListHtml);
        inListMode = false;
        currentListHtml = '';
      }

      result.push(line);
    }
  }
  
  // Close any remaining open lists at the end
  if (inListMode) {
    while (listStack.length > 0) {
      currentListHtml += '</ul>';
      listStack.pop();
    }
    result.push(currentListHtml);
  }
  
  return result.join('\n');
}

function openFullscreen(img) {
  let modal = document.getElementById("fullscreen-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "fullscreen-modal";
    modal.classList.add("modal-img");
    const modalImg = document.createElement("img");
    modal.appendChild(modalImg);
    document.body.appendChild(modal);

    document.addEventListener( "keydown", event => {
      if( event.key === "Escape" ) {
        modal.style.display = "none";
      }
    })
  }

  modal.style.display = "flex";
  modal.querySelector("img").src = img.src;

  modal.onclick = () => {
    modal.style.display = "none";
  };
}

function showInsertionLine(li, position) {
  if (!window.insertionLine) {
    window.insertionLine = document.createElement('div');
    window.insertionLine.className = 'insertion-line';
    document.body.appendChild(window.insertionLine);
  }
  const rect = li.getBoundingClientRect();
  window.insertionLine.style.width = rect.width + "px";
  window.insertionLine.style.left = rect.left + "px";
  if (position === "top") {
    window.insertionLine.style.top = rect.top + "px";
  } else if (position === "bottom") {
    window.insertionLine.style.top = rect.bottom + "px";
  } else if (position === "middle") {
    window.insertionLine.style.top = (rect.top + rect.height / 2) + "px";
  }
  window.insertionLine.style.display = "block";
}

function hideInsertionLine() {
  if (window.insertionLine) window.insertionLine.style.display = "none";
}


function maximize(sublist, description) {
  sublist.style.animation = "none";
  void sublist.offsetWidth;
  sublist.style.animation = "fadeInTask 0.3s ease-out forwards";
  sublist.classList.remove("hidden");

  const toggleButton = sublist.parentElement.querySelector(".btn-toggle");
  toggleButton.innerHTML = '<img src="./assets/img/triangle-down-filled.svg" alt="toggle" width="14" height="14">';

  if (description.innerHTML.trim() !== "") {
    description.style.animation = "none";
    void description.offsetWidth;
    description.style.animation = "fadeInDescription 0.3s ease-out forwards";
    description.classList.remove("hidden");
  }
  
  
}

function minimize(sublist, description) {
  sublist.style.animation = "none";
  void sublist.offsetWidth;
  sublist.style.animation = "fadeOutSubtasks 0.3s ease-out forwards";
  setTimeout(() => {
    sublist.classList.add("hidden");
  }, 500);

  const toggleButton = sublist.parentElement.querySelector(".btn-toggle");
  toggleButton.innerHTML = '<img src="./assets/img/triangle-right-filled.svg" alt="toggle" width="14" height="14">';

  if (description.innerHTML.trim() !== "") {
    description.style.animation = "none";
    void description.offsetWidth;
    description.style.animation = "fadeOutDescription 0.3s ease-out forwards";
    setTimeout(() => description.classList.add("hidden"), 300);
  }
}

window.openFullscreen = openFullscreen;
window.showInsertionLine = showInsertionLine;
window.hideInsertionLine = hideInsertionLine;
window.maximize = maximize;
window.minimize = minimize;
window.replaceURLsWithContent = replaceURLsWithContent;
window.processLists = processLists; 
