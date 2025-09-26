let currentUser = null;
let isFetchingInitialTasks = false;
let hasResolvedConflict = false;

function showLoggedOutUI() {
  const loggedOut = document.getElementById("auth-logged-out");
  const loggedIn = document.getElementById("auth-logged-in");
  if (loggedOut) loggedOut.classList.remove("hidden");
  if (loggedIn) loggedIn.classList.add("hidden");
}

function showLoggedInUI(user) {
  const loggedOut = document.getElementById("auth-logged-out");
  const loggedIn = document.getElementById("auth-logged-in");
  const nameSpan = document.getElementById("auth-user-name");
  if (nameSpan && user && user.name) nameSpan.textContent = user.name;
  if (loggedOut) loggedOut.classList.add("hidden");
  if (loggedIn) loggedIn.classList.remove("hidden");
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
  const loginBtn = document.getElementById("auth-login-btn");
  const registerBtn = document.getElementById("auth-register-btn");
  const logoutBtn = document.getElementById("auth-logout-btn");
  const updateNameBtn = document.getElementById("auth-update-name-btn");
  const changePassBtn = document.getElementById("auth-change-pass-btn");

  if (loginBtn) loginBtn.addEventListener("click", handleLogin);
  if (registerBtn) registerBtn.addEventListener("click", handleRegister);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (updateNameBtn) updateNameBtn.addEventListener("click", handleUpdateName);
  if (changePassBtn) changePassBtn.addEventListener("click", handleChangePassword);
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


