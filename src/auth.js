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
    greetEl.textContent = name ? `Hi, ${name}` : "";
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

async function fetchAndLoadTasksIfNeeded() {
  if (!window.api.getAuthToken()) return false;
  try {
    isFetchingInitialTasks = true;
    const { tasks } = await window.api.getMyTasks();

    const remoteText = typeof tasks === "string" ? tasks : "";
    const localText = localStorage.getItem("savedText") || "";

    if (remoteText && localText && remoteText !== localText) {
      if (window.sync && window.sync.blockSync) window.sync.blockSync();
      hasResolvedConflict = false;
      showConflictModal({ localText, remoteText });
      return false; // do not render yet
    }

    const chosen = remoteText || localText;
    if (typeof chosen === "string" && chosen !== "") {
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

async function handleLogin(e) {
  e && e.preventDefault && e.preventDefault();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value.trim();
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }
  try {
    await window.api.loginUser(email, password);
    const me = await ensureAuthState();
    if (window.sync && window.sync.blockSync) window.sync.blockSync();
    await fetchAndLoadTasksIfNeeded();
    if (!isFetchingInitialTasks && !localStorage.getItem("savedText")) {
      // Ensure there is something to render
      window.processList();
    }
    if (me && me.name) {
      document.getElementById("auth-email").value = "";
      document.getElementById("auth-password").value = "";
    }
  } catch (err) {
    alert(err.message || "Login failed");
  }
}

async function handleRegister(e) {
  e && e.preventDefault && e.preventDefault();
  const name = document.getElementById("auth-name").value.trim();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value.trim();
  if (!name || !email || !password) {
    alert("Please fill name, email and password");
    return;
  }
  try {
    await window.api.registerUser(name, email, password);
    await window.api.loginUser(email, password);
    await ensureAuthState();
    await fetchAndLoadTasksIfNeeded();
    document.getElementById("auth-name").value = "";
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
  } catch (err) {
    alert(err.message || "Registration failed");
  }
}

function handleLogout() {
  localStorage.removeItem("authToken");
  currentUser = null;
  showLoggedOutUI();
}

async function handleUpdateName() {
  const newName = prompt("Enter new name:");
  if (!newName) return;
  try {
    const updated = await window.api.updateCurrentUserName(newName.trim());
    currentUser = updated;
    showLoggedInUI(updated);
  } catch (err) {
    alert(err.message || "Failed to update name");
  }
}

async function handleChangePassword() {
  const currentPassword = prompt("Enter current password:");
  if (!currentPassword) return;
  const newPassword = prompt("Enter new password:");
  if (!newPassword) return;
  try {
    await window.api.changeCurrentUserPassword(currentPassword, newPassword);
    alert("Password has been updated");
  } catch (err) {
    alert(err.message || "Failed to change password");
  }
}

function setupAuthBar() {
  const openLogin = document.getElementById("open-login");
  const openRegister = document.getElementById("open-register");
  const logoutBtn = document.getElementById("auth-logout-btn");
  const updateNameBtn = document.getElementById("auth-update-name-btn");
  const changePassBtn = document.getElementById("auth-change-pass-btn");
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userMenu = document.getElementById("user-menu");

  if (openLogin) openLogin.addEventListener("click", () => openAuthModal("login"));
  if (openRegister) openRegister.addEventListener("click", () => openAuthModal("register"));
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (updateNameBtn) updateNameBtn.addEventListener("click", openUpdateNameModal);
  if (changePassBtn) changePassBtn.addEventListener("click", openChangePassModal);
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

function showConflictModal({ localText, remoteText }) {
  const modal = document.getElementById("conflictModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("show");
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const useLocalBtn = document.getElementById("conflict-use-local");
  const useRemoteBtn = document.getElementById("conflict-use-remote");
  const logoutBtn = document.getElementById("conflict-logout");

  const cleanup = () => {
    modal.classList.remove("show");
    modal.classList.add("hidden");
    useLocalBtn.onclick = null;
    useRemoteBtn.onclick = null;
    logoutBtn.onclick = null;
    document.body.style.overflow = previousOverflow || "";
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
  };

  useRemoteBtn.onclick = async () => {
    localStorage.setItem("savedText", remoteText);
    window.processList();
    if (window.sync && window.sync.unblockSync) window.sync.unblockSync();
    hasResolvedConflict = true;
    cleanup();
  };

  logoutBtn.onclick = () => {
    handleLogout();
    cleanup();
  };
}

window.initAuthAndTasks = initAuthAndTasks;
window.auth = {
  ensureAuthState,
  fetchAndLoadTasksIfNeeded,
  handleLogin,
  handleRegister,
  handleLogout,
  handleUpdateName,
  handleChangePassword,
};

function openAuthModal(mode) {
  const modal = document.getElementById("authModal");
  const title = document.getElementById("authModalTitle");
  const nameInput = document.getElementById("auth-name");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const primaryBtn = document.getElementById("authModalPrimary");
  const closeBtn = document.getElementById("authModalClose");
  if (!modal) return;
  title.textContent = mode === "register" ? "Register" : "Login";
  nameInput.classList.toggle("hidden", mode !== "register");
  modal.classList.remove("hidden");
  modal.classList.add("show");
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  const cleanup = () => { modal.classList.remove("show"); modal.classList.add("hidden"); document.body.style.overflow = previousOverflow || ""; primaryBtn.onclick = null; closeBtn.onclick = null; };
  primaryBtn.onclick = () => { mode === "register" ? handleRegister() : handleLogin(); cleanup(); };
  closeBtn.onclick = cleanup;
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
  const cleanup = () => { input.value = ""; modal.classList.remove("show"); modal.classList.add("hidden"); document.body.style.overflow = prev || ""; confirm.onclick = null; cancel.onclick = null; confirm.disabled = false; confirm.textContent = "Update"; };
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
  const cleanup = () => { cur.value = ""; nw.value = ""; modal.classList.remove("show"); modal.classList.add("hidden"); document.body.style.overflow = prev || ""; confirm.onclick = null; cancel.onclick = null; confirm.disabled = false; confirm.textContent = "Change"; };
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
  const cleanup = () => { modal.classList.remove("show"); modal.classList.add("hidden"); document.body.style.overflow = prev || ""; c.onclick = null; };
  c.onclick = cleanup;
}

window.showInfo = showInfo;


