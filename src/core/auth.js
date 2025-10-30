let currentUser = null;
let isFetchingInitialTasks = false;
let hasResolvedConflict = false;

function showLoggedOutUI() {
  const appbarLoggedOut = document.getElementById("appbar-logged-out");
  const appbarLoggedIn = document.getElementById("appbar-logged-in");
  if (appbarLoggedOut) appbarLoggedOut.classList.remove("hidden");
  if (appbarLoggedIn) appbarLoggedIn.classList.add("hidden");
  const greetEl = document.getElementById("greeting");
  if (greetEl) greetEl.textContent = "";
}

function showLoggedInUI(user) {
  const appbarLoggedOut = document.getElementById("appbar-logged-out");
  const appbarLoggedIn = document.getElementById("appbar-logged-in");
  if (appbarLoggedOut) appbarLoggedOut.classList.add("hidden");
  if (appbarLoggedIn) appbarLoggedIn.classList.remove("hidden");
  const greetEl = document.getElementById("greeting");
  if (greetEl) {
    const name = user && user.name ? user.name : "";
    greetEl.textContent = name ? `Hi, ${name}. ` : "";
  }
}

async function ensureAuthState() {
  const token = window.api.getAuthToken();
  if (!token) {
    currentUser = null;
    showLoggedOutUI();
    return null;
  }
  try {
    const me = await window.api.getCurrentUser();
    currentUser = me;
    showLoggedInUI(me);
    return me;
  } catch (err) {
    // Invalid token
    localStorage.removeItem("authToken");
    currentUser = null;
    showLoggedOutUI();
    return null;
  }
}

async function fetchAndLoadTasksIfNeeded(isLoggingIn = false) {
  if (!window.api.getAuthToken()) return false;
  try {
    isFetchingInitialTasks = true;
    const { tasks } = await window.api.getMyTasks();

    const remoteText = typeof tasks === "string" ? tasks : "";
    const localText = localStorage.getItem("savedText") || "";

    if (remoteText && localText && remoteText !== localText) {
      if (window.sync && window.sync.blockSync) window.sync.blockSync();
      hasResolvedConflict = false;
      showConflictModal({ localText, remoteText, isLoggingIn });
      return false; // do not render yet
    }

    const chosen = remoteText || localText;
    if (typeof chosen === "string" && chosen !== "") {
      localStorage.setItem("hasSaved", "true");
      localStorage.setItem("savedText", chosen);
    }
    window.processList();
    if (window.sync && window.sync.unblockSync) window.sync.unblockSync();
    return true;
  } catch (err) {
    // If 404 or not found, keep local content
    return false;
  } finally {
    isFetchingInitialTasks = false;
  }
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  const primaryBtn = document.getElementById("authModalPrimary");
  const closeBtn = document.getElementById("authModalClose");
  if (!modal) return;
  modal.classList.remove("show");
  modal.classList.add("hidden");
  const prev = (modal.dataset && modal.dataset.prevOverflow) || "";
  document.body.style.overflow = prev;
  if (primaryBtn) primaryBtn.onclick = null;
  if (closeBtn) closeBtn.onclick = null;
  // Cleanup keyboard handler if present
  if (modal._onKey) {
    document.removeEventListener("keydown", modal._onKey);
    modal._onKey = null;
  }
  // Reset controls to default state for next open
  if (primaryBtn) { primaryBtn.disabled = false; primaryBtn.textContent = "Continue"; }
  if (closeBtn) closeBtn.disabled = false;
  const nameInput = document.getElementById("auth-name");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  if (nameInput) nameInput.disabled = false;
  if (emailInput) emailInput.disabled = false;
  if (passInput) passInput.disabled = false;
  // Clear values so reopening does not preserve previous input
  if (nameInput) nameInput.value = "";
  if (emailInput) emailInput.value = "";
  if (passInput) passInput.value = "";
}

async function handleLogin(e) {
  e && e.preventDefault && e.preventDefault();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value.trim();
  if (!email || !password) {
    if (window.showInfo) window.showInfo('Missing information', 'Please enter email and password.');
    return;
  }
  const primaryBtn = document.getElementById("authModalPrimary");
  const closeBtn = document.getElementById("authModalClose");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const modal = document.getElementById("authModal");
  // lock modal
  if (primaryBtn) { primaryBtn.disabled = true; primaryBtn.textContent = "Logging in..."; }
  if (closeBtn) closeBtn.disabled = true;
  if (emailInput) emailInput.disabled = true;
  if (passInput) passInput.disabled = true;
  try {
    await window.api.loginUser(email, password);
    const me = await ensureAuthState();
    if (window.sync && window.sync.blockSync) window.sync.blockSync();
    const loaded = await fetchAndLoadTasksIfNeeded(true);
    if (!isFetchingInitialTasks && !localStorage.getItem("savedText")) {
      // Ensure there is something to render
      window.processList();
    }
    if (me && me.name) {
      document.getElementById("auth-email").value = "";
      document.getElementById("auth-password").value = "";
    }
    if (me && me.name) {
      const greetMsg = `<img src="./assets/img/waving-hand.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>Welcome back, ${me.name}!`;
      if (loaded) {
        if (window.showToast) window.showToast(greetMsg, 'success');
      } else {
        window.pendingToastMessage = greetMsg;
      }
    }
  } catch (err) {
    if (window.showInfo) window.showInfo('Login failed', err.message || 'Unable to login.');
    // keep modal open on error
    if (primaryBtn) { primaryBtn.disabled = false; primaryBtn.textContent = "Continue"; }
    if (closeBtn) closeBtn.disabled = false;
    if (emailInput) emailInput.disabled = false;
    if (passInput) passInput.disabled = false;
    return;
  }
  // success -> close modal after tasks loaded
  closeAuthModal();
}

async function handleRegister(e) {
  e && e.preventDefault && e.preventDefault();
  const name = document.getElementById("auth-name").value.trim();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value.trim();
  if (!name || !email || !password) {
    if (window.showInfo) window.showInfo('Missing information', 'Please fill name, email and password.');
    return;
  }
  const primaryBtn = document.getElementById("authModalPrimary");
  const closeBtn = document.getElementById("authModalClose");
  const nameInput = document.getElementById("auth-name");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const modal = document.getElementById("authModal");
  if (primaryBtn) { primaryBtn.disabled = true; primaryBtn.textContent = "Loading..."; }
  if (closeBtn) closeBtn.disabled = true;
  if (nameInput) nameInput.disabled = true;
  if (emailInput) emailInput.disabled = true;
  if (passInput) passInput.disabled = true;
  try {
    await window.api.registerUser(name, email, password);
    if (primaryBtn) primaryBtn.textContent = "Loading...";
    await window.api.loginUser(email, password);
    await ensureAuthState();
    const loaded = await fetchAndLoadTasksIfNeeded(true);
    document.getElementById("auth-name").value = "";
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
    const me = currentUser;
    if (me && me.name) {
      const greetMsg = `<img src="./assets/img/cowboy-hat-face.svg" alt="" width="16" height="16" style="vertical-align:middle; margin-right:6px;"/>Welcome to Brancho, ${me.name}!`;
      if (loaded) {
        if (window.showToast) window.showToast(greetMsg, 'success');
      } else {
        window.pendingToastMessage = greetMsg;
      }
    }
  } catch (err) {
    if (window.showInfo) window.showInfo('Registration failed', err.message || 'Unable to register.');
    if (primaryBtn) { primaryBtn.disabled = false; primaryBtn.textContent = "Continue"; }
    if (closeBtn) closeBtn.disabled = false;
    if (nameInput) nameInput.disabled = false;
    if (emailInput) emailInput.disabled = false;
    if (passInput) passInput.disabled = false;
    return;
  }
  closeAuthModal();
}

function handleLogout(clearTasks = true) {
  localStorage.removeItem("authToken");
  if (clearTasks) {
    window.confirmClear(true);
  }
  currentUser = null;
  showLoggedOutUI();
}

async function handleUpdateName() {
  const result = await showPrompt({
    title: 'Update name',
    body: '',
    inputs: [{ id: 'name', type: 'text', placeholder: 'New name' }],
    confirmText: 'Update',
    cancelText: 'Cancel',
  });
  if (!result || !result.name || !result.name.trim()) return;
  try {
    const updated = await window.api.updateCurrentUserName(result.name.trim());
    currentUser = updated;
    showLoggedInUI(updated);
    if (window.showInfo) window.showInfo('Name updated', 'Your display name has been updated.');
  } catch (err) {
    if (window.showInfo) window.showInfo('Error', err.message || 'Failed to update name');
  }
}

async function handleChangePassword() {
  const result = await showPrompt({
    title: 'Change password',
    body: '',
    inputs: [
      { id: 'currentPassword', type: 'password', placeholder: 'Current password' },
      { id: 'newPassword', type: 'password', placeholder: 'New password' },
    ],
    confirmText: 'Change',
    cancelText: 'Cancel',
  });
  if (!result || !result.currentPassword || !result.newPassword) return;
  try {
    await window.api.changeCurrentUserPassword(result.currentPassword, result.newPassword);
    if (window.showInfo) window.showInfo('Password updated', 'Your password has been successfully changed.');
  } catch (err) {
    if (window.showInfo) window.showInfo('Error', err.message || 'Failed to change password');
  }
}

function setupAuthBar() {
  const openLogin = document.getElementById("open-login");
  const openRegister = document.getElementById("open-register");
  const logoutBtn = document.getElementById("auth-logout-btn");
  const updateNameBtn = document.getElementById("auth-update-name-btn");
  const changePassBtn = document.getElementById("auth-change-pass-btn");
  const deleteAccountBtn = document.getElementById("auth-delete-account-btn");
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userMenu = document.getElementById("user-menu");

  if (openLogin) openLogin.addEventListener("click", () => openAuthModal("login"));
  if (openRegister) openRegister.addEventListener("click", () => openAuthModal("register"));
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (updateNameBtn) updateNameBtn.addEventListener("click", openUpdateNameModal);
  if (changePassBtn) changePassBtn.addEventListener("click", openChangePassModal);
  if (deleteAccountBtn) deleteAccountBtn.addEventListener("click", openDeleteAccountModal);
  if (userMenuBtn && userMenu) {
    let pinned = false;
    let closeTimer = null;
    const cancelClose = () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } };
    const openMenu = () => { cancelClose(); userMenu.classList.remove("hidden"); userMenuBtn.setAttribute("aria-expanded", "true"); };
    const hideMenu = () => { userMenu.classList.add("hidden"); userMenuBtn.setAttribute("aria-expanded", "false"); };
    const scheduleClose = () => { cancelClose(); closeTimer = setTimeout(() => { if (!pinned) hideMenu(); }, 180); };

    userMenuBtn.addEventListener("mouseenter", openMenu);
    userMenuBtn.addEventListener("mouseleave", scheduleClose);
    userMenu.addEventListener("mouseenter", openMenu);
    userMenu.addEventListener("mouseleave", scheduleClose);

    userMenuBtn.addEventListener("click", () => {
      pinned = !pinned;
      if (pinned) { openMenu(); }
      else { hideMenu(); }
    });

    document.addEventListener("click", (e) => {
      if (!userMenu.contains(e.target) && e.target !== userMenuBtn) {
        pinned = false; hideMenu();
      }
    });
  }
}

async function initAuthAndTasks() {
  setupAuthBar();
  if (window.sync && window.sync.setupSyncUI) {
    window.sync.setupSyncUI();
    if (window.sync && window.sync.startAutoSync) window.sync.startAutoSync();
    if (window.sync && window.sync.blockSync) window.sync.blockSync();
  }
  const me = await ensureAuthState();
  if (me) {
    const loaded = await fetchAndLoadTasksIfNeeded();
    if (!loaded) {
      if (localStorage.getItem("savedText")) {
        window.processList();
      } else {
        window.processList();
      }
    }
  } else {
    // Not logged in; render from local storage or default
    window.processList();
  }
}

function showConflictModal({ localText, remoteText, isLoggingIn }) {
  const modal = document.getElementById("conflictModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  const useLocalBtn = document.getElementById("conflict-use-local");
  const useRemoteBtn = document.getElementById("conflict-use-remote");
  const logoutBtn = document.getElementById("conflict-logout");
  const textEl = modal.querySelector('.conflict-text');

  if (textEl) {
    if (isLoggingIn) {
      textEl.innerHTML = 'The tasks saved on this device are <strong>different</strong> from the ones in your account. Please choose which version you want to keep — the other one will be <strong>overwritten</strong>. If you\'re not sure, you can log out now and decide later.';
    } else {
      textEl.innerHTML = 'You have unsaved changes from last session, do you want to restore them?';
    }
  }

  if (useLocalBtn) {
    useLocalBtn.textContent = isLoggingIn ? 'Keep Device Tasks' : 'Restore last changes';
  }
  if (useRemoteBtn) {
    useRemoteBtn.textContent = isLoggingIn ? 'Load Account Tasks' : 'Continue without restoring';
  }
  if (logoutBtn) {
    logoutBtn.classList.toggle('hidden', !isLoggingIn);
  }

  const cleanup = () => {
    modal.classList.remove("show");
    modal.classList.add("hidden");
    useLocalBtn.onclick = null;
    useRemoteBtn.onclick = null;
    logoutBtn.onclick = null;
    // Always restore scroll; avoid re-applying a stale "hidden" from other modals
    document.body.style.overflow = "";
  };

  useLocalBtn.onclick = async () => {
    localStorage.setItem("savedText", localText);
    window.processList();
    if (window.sync && window.sync.unblockSync) window.sync.unblockSync();
    hasResolvedConflict = true;
    cleanup();
    // Optionally push local to cloud immediately so both are aligned
    if (window.sync && window.sync.syncToCloud) {
      await window.sync.syncToCloud();
    }
    if (window.pendingToastMessage && window.showToast) {
      window.showToast(window.pendingToastMessage, 'success');
      window.pendingToastMessage = null;
    }
  };

  useRemoteBtn.onclick = async () => {
    localStorage.setItem("savedText", remoteText);
    window.processList();
    if (window.sync && window.sync.unblockSync) window.sync.unblockSync();
    hasResolvedConflict = true;
    cleanup();
    if (window.pendingToastMessage && window.showToast) {
      window.showToast(window.pendingToastMessage, 'success');
      window.pendingToastMessage = null;
    }
  };

  logoutBtn.onclick = () => {
    handleLogout(false);
    cleanup();
    // Do not show greeting on logout
    window.pendingToastMessage = null;
  };
}

window.initAuthAndTasks = initAuthAndTasks;
function closeAllModals() {
  // Close description modal if open
  if (typeof window.closeModal === "function") {
    window.closeModal();
  }
  // Close auth modal via its dedicated closer
  if (typeof closeAuthModal === "function") {
    closeAuthModal();
  }
  // Hide any modal elements currently shown
  const modals = document.querySelectorAll('.modal');
  modals.forEach((modalEl) => {
    modalEl.classList.remove('show');
    modalEl.classList.add('hidden');
  });
  // Restore scroll just in case any modal locked it
  document.body.style.overflow = "";
}
window.auth = {
  ensureAuthState,
  fetchAndLoadTasksIfNeeded,
  handleLogin,
  handleRegister,
  handleLogout,
  handleUpdateName,
  handleChangePassword,
};
window.closeAllModals = closeAllModals;

function openAuthModal(mode) {
  const modal = document.getElementById("authModal");
  const title = document.getElementById("authModalTitle");
  const nameInput = document.getElementById("auth-name");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const privacyLabel = document.getElementById("privacy-acceptance");
  const privacyCheckbox = document.getElementById("privacy-checkbox");
  const primaryBtn = document.getElementById("authModalPrimary");
  const closeBtn = document.getElementById("authModalClose");
  if (!modal) return;
  title.textContent = mode === "register" ? "Register" : "Login";
  nameInput.classList.toggle("hidden", mode !== "register");
  privacyLabel.classList.toggle("hidden", mode !== "register");
  if (privacyLabel) privacyLabel.style.display = mode === 'register' ? 'flex' : 'none';
  if (mode !== "register" && privacyCheckbox) privacyCheckbox.checked = false;
  // Ensure default interactive state when opening
  if (primaryBtn) { primaryBtn.disabled = false; primaryBtn.textContent = "Continue"; }
  if (closeBtn) closeBtn.disabled = false;
  if (nameInput) nameInput.disabled = false;
  if (emailInput) emailInput.disabled = false;
  if (passInput) passInput.disabled = false;
  modal.classList.remove("hidden");
  modal.classList.add("show");
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  if (modal && modal.dataset) { modal.dataset.prevOverflow = previousOverflow || ""; }
  // Pressing Enter triggers primary action; Escape triggers cancel
  const onKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (primaryBtn && !primaryBtn.disabled) primaryBtn.click();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (closeBtn && !closeBtn.disabled) closeBtn.click();
    }
  };
  document.addEventListener("keydown", onKey);
  modal._onKey = onKey;
  const cleanup = () => {
    modal.classList.remove("show");
    modal.classList.add("hidden");
    document.body.style.overflow = previousOverflow || "";
    primaryBtn.onclick = null; closeBtn.onclick = null;
    if (modal._onKey) { document.removeEventListener("keydown", modal._onKey); modal._onKey = null; }
    // Reset controls to default state when closing via Cancel
    if (primaryBtn) { primaryBtn.disabled = false; primaryBtn.textContent = "Continue"; }
    if (closeBtn) closeBtn.disabled = false;
    if (nameInput) nameInput.disabled = false;
    if (emailInput) emailInput.disabled = false;
    if (passInput) passInput.disabled = false;
    // Clear values so reopening starts fresh
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    if (passInput) passInput.value = "";
    if (privacyCheckbox) privacyCheckbox.checked = false;
    if (privacyLabel) privacyLabel.style.display = 'none';
  };
  // Do NOT auto-close on primary click; keep modal open and show loading state until flow completes
  primaryBtn.onclick = () => { mode === "register" ? handleRegister() : handleLogin(); };
  closeBtn.onclick = cleanup;

  // Enforce privacy acceptance in Register mode
  const syncRegisterButtonState = () => {
    if (mode === 'register') {
      const accepted = !!(privacyCheckbox && privacyCheckbox.checked);
      primaryBtn.disabled = !accepted;
      primaryBtn.textContent = accepted ? 'Continue' : 'Accept Privacy Policy to continue';
    }
  };
  if (privacyCheckbox) {
    privacyCheckbox.onchange = syncRegisterButtonState;
  }
  syncRegisterButtonState();
}

function openUpdateNameModal() {
  const modal = document.getElementById("updateNameModal");
  if (!modal) return;
  const input = document.getElementById("updateNameInput");
  const confirm = document.getElementById("updateNameConfirm");
  const cancel = document.getElementById("updateNameCancel");
  input.value = "";
  modal.classList.remove("hidden");
  modal.classList.add("show");
  const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
  const cleanup = () => { input.value = ""; modal.classList.remove("show"); modal.classList.add("hidden"); document.body.style.overflow = prev || ""; confirm.onclick = null; cancel.onclick = null; confirm.disabled = false; confirm.textContent = "Update"; if (modal._onKey) { document.removeEventListener("keydown", modal._onKey); modal._onKey = null; } };
  const onKey = (e) => { if (e.key === "Enter") { e.preventDefault(); if (!confirm.disabled) confirm.click(); } else if (e.key === "Escape") { e.preventDefault(); cancel.click(); } };
  document.addEventListener("keydown", onKey); modal._onKey = onKey;
  confirm.onclick = async () => {
    if (!input.value.trim()) return;
    confirm.disabled = true;
    confirm.textContent = "Updating...";
    try {
      const updated = await window.api.updateCurrentUserName(input.value.trim());
      currentUser = updated;
      showLoggedInUI(updated);
      if (window.showInfo) window.showInfo('Name updated', 'Your display name has been updated.');
      cleanup();
    } catch (e) {
      if (window.showInfo) window.showInfo('Error', e.message || 'Failed to update name');
      confirm.disabled = false;
      confirm.textContent = "Update";
    }
  };
  cancel.onclick = cleanup;
}

function openChangePassModal() {
  const modal = document.getElementById("changePassModal");
  if (!modal) return;
  const cur = document.getElementById("changePassCurrent");
  const nw = document.getElementById("changePassNew");
  const confirm = document.getElementById("changePassConfirm");
  const cancel = document.getElementById("changePassCancel");
  cur.value = ""; nw.value = "";
  modal.classList.remove("hidden");
  modal.classList.add("show");
  const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
  const cleanup = () => { cur.value = ""; nw.value = ""; modal.classList.remove("show"); modal.classList.add("hidden"); document.body.style.overflow = prev || ""; confirm.onclick = null; cancel.onclick = null; confirm.disabled = false; confirm.textContent = "Change"; if (modal._onKey) { document.removeEventListener("keydown", modal._onKey); modal._onKey = null; } };
  const onKey = (e) => { if (e.key === "Enter") { e.preventDefault(); if (!confirm.disabled) confirm.click(); } else if (e.key === "Escape") { e.preventDefault(); cancel.click(); } };
  document.addEventListener("keydown", onKey); modal._onKey = onKey;
  confirm.onclick = async () => {
    if (!cur.value || !nw.value) return;
    confirm.disabled = true;
    confirm.textContent = "Changing...";
    try {
      await window.api.changeCurrentUserPassword(cur.value, nw.value);
      if (window.showInfo) window.showInfo('Password updated', 'Your password has been successfully changed.');
      cleanup();
    } catch (e) {
      if (window.showInfo) window.showInfo('Error', e.message || 'Failed to change password');
      confirm.disabled = false;
      confirm.textContent = "Change";
    }
  };
  cancel.onclick = cleanup;
}

function openDeleteAccountModal() {
  const modal = document.getElementById('promptModal');
  const titleEl = document.getElementById('promptTitle');
  const bodyEl = document.getElementById('promptBody');
  const inputsEl = document.getElementById('promptInputs');
  const confirmBtn = document.getElementById('promptConfirm');
  const cancelBtn = document.getElementById('promptCancel');
  if (!modal || !titleEl || !bodyEl || !inputsEl || !confirmBtn || !cancelBtn) return;
  titleEl.innerHTML = '<img src="./assets/img/warning.svg" alt="" width="18" height="18" style="vertical-align:middle; margin-right:6px;"/>Delete your account';
  bodyEl.innerHTML = 'Once deleted, your account and cloud data will be <strong>gone forever</strong>. Your tasks will still be available locally on this device.';
  inputsEl.innerHTML = '';
  const input = document.createElement('input');
  input.type = 'password';
  input.placeholder = 'Enter your password';
  input.id = 'deleteAccountPassword';
  input.className = 'auth-input';
  inputsEl.appendChild(input);
  confirmBtn.textContent = 'Delete account';
  confirmBtn.classList.add('modal-btn-danger');
  confirmBtn.classList.remove('modal-btn-save');
  cancelBtn.textContent = 'Cancel';
  modal.classList.remove('hidden');
  modal.classList.add('show');
  const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
  const cleanup = () => { modal.classList.remove('show'); modal.classList.add('hidden'); document.body.style.overflow = prev || ''; confirmBtn.onclick = null; cancelBtn.onclick = null; confirmBtn.disabled = false; cancelBtn.disabled = false; confirmBtn.textContent = 'Delete account'; if (modal._onKey) { document.removeEventListener('keydown', modal._onKey); modal._onKey = null; } };
  const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (!confirmBtn.disabled) confirmBtn.click(); } else if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); } };
  document.addEventListener('keydown', onKey); modal._onKey = onKey;
  cancelBtn.onclick = () => { cleanup(); };
  confirmBtn.onclick = async () => {
    const passwordEl = document.getElementById('deleteAccountPassword');
    const password = passwordEl ? passwordEl.value : '';
    if (!password) return;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';
    try {
      const res = await window.api.deleteMyAccount(password);
      if (window.showInfo) window.showInfo('Account deleted', (res && res.message) || 'Your account has been deleted successfully.');
      localStorage.removeItem('authToken');
      currentUser = null;
      showLoggedOutUI();
      cleanup();
    } catch (e) {
      if (window.showInfo) window.showInfo('Error', e.message || 'Failed to delete account');
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      confirmBtn.textContent = 'Delete account';
    }
  };
}

async function showPrompt({ title, body, inputs = [], confirmText = 'OK', cancelText = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const modal = document.getElementById('promptModal');
    const titleEl = document.getElementById('promptTitle');
    const bodyEl = document.getElementById('promptBody');
    const inputsEl = document.getElementById('promptInputs');
    const confirmBtn = document.getElementById('promptConfirm');
    const cancelBtn = document.getElementById('promptCancel');
    if (!modal || !titleEl || !bodyEl || !inputsEl || !confirmBtn || !cancelBtn) {
      resolve(null);
      return;
    }
    titleEl.textContent = title || 'Confirm';
    bodyEl.innerHTML = body || '';
    inputsEl.innerHTML = '';
    inputs.forEach(cfg => {
      const input = document.createElement('input');
      input.type = cfg.type || 'text';
      input.placeholder = cfg.placeholder || '';
      if (cfg.id) input.id = cfg.id;
      input.className = 'auth-input';
      inputsEl.appendChild(input);
    });
    confirmBtn.textContent = confirmText || 'OK';
    confirmBtn.classList.toggle('modal-btn-danger', !!danger);
    confirmBtn.classList.toggle('modal-btn-save', !danger);
    cancelBtn.textContent = cancelText || 'Cancel';
    modal.classList.remove('hidden');
    modal.classList.add('show');
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const cleanup = () => { modal.classList.remove('show'); modal.classList.add('hidden'); document.body.style.overflow = prev || ''; confirmBtn.onclick = null; cancelBtn.onclick = null; if (modal._onKey) { document.removeEventListener('keydown', modal._onKey); modal._onKey = null; } };
    const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (!confirmBtn.disabled) confirmBtn.click(); } else if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); } };
    document.addEventListener('keydown', onKey); modal._onKey = onKey;
    cancelBtn.onclick = () => { cleanup(); resolve(null); };
    confirmBtn.onclick = () => {
      const values = {};
      inputs.forEach(cfg => {
        const el = cfg.id ? document.getElementById(cfg.id) : null;
        if (el) values[cfg.id] = el.value;
      });
      cleanup();
      resolve(values);
    };
  });
}

async function handleDeleteAccountFlow() {
  const result = await showPrompt({
    title: '<img src="./assets/img/warning.svg" alt="" width="18" height="18" style="vertical-align:middle; margin-right:6px;"/>Delete your account',
    body: 'Once deleted, your account and cloud data will be <strong>gone forever</strong>. Your tasks will still be available locally on this device.',
    inputs: [{ id: 'password', type: 'password', placeholder: 'Enter your password' }],
    confirmText: 'Delete account',
    cancelText: 'Cancel',
    danger: true,
  });
  if (!result || !result.password) return;
  try {
    const res = await window.api.deleteMyAccount(result.password);
    if (window.showInfo) window.showInfo('Account deleted', (res && res.message) || 'Your account has been deleted successfully.');
    localStorage.removeItem('authToken');
    currentUser = null;
    showLoggedOutUI();
  } catch (e) {
    if (window.showInfo) window.showInfo('Error', e.message || 'Failed to delete account');
  }
}

function showInfo(title, body) {
  const modal = document.getElementById("infoModal");
  if (!modal) return;
  const t = document.getElementById("infoModalTitle");
  const b = document.getElementById("infoModalBody");
  const c = document.getElementById("infoModalClose");
  t.textContent = title || 'Info';
  b.textContent = body || '';
  modal.classList.remove("hidden");
  modal.classList.add("show");
  const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
  const cleanup = () => { modal.classList.remove("show"); modal.classList.add("hidden"); document.body.style.overflow = ""; c.onclick = null; if (modal._onKey) { document.removeEventListener("keydown", modal._onKey); modal._onKey = null; } };
  const onKey = (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); c.click(); } };
  document.addEventListener('keydown', onKey); modal._onKey = onKey;
  c.onclick = cleanup;
}

window.showInfo = showInfo;
