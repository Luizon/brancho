function showToast(message, type) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const el = document.createElement("div");
    el.className = `toast${type === 'error' ? ' error' : type === 'success' ? ' success' : ''}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 250);
    }, 2000);
  }

window.showToast = showToast;