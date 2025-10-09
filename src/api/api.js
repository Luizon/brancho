const API_BASE_URL = "https://treed-todo-list-api.onrender.com";

function getAuthToken() {
  return localStorage.getItem("authToken") || "";
}

function setAuthToken(token) {
  if (token) localStorage.setItem("authToken", token);
}

async function apiRequest(path, options = {}) {
  const headers = options.headers || {};
  const isJson = options.body && typeof options.body === "object";
  const token = options.noAuth ? "" : getAuthToken();

  const requestInit = {
    method: options.method || "GET",
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isJson ? JSON.stringify(options.body) : options.body,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, requestInit);
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }
  if (!response.ok) {
    let message = data && data.error ? data.error : `HTTP ${response.status}`;
    if (token && response.status === 401) {
      message = "Your session has expired. Please login again.";
      if (typeof window.closeAllModals === "function") {
        window.closeAllModals();
      }
      window.auth.handleLogout();
    }
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function registerUser(name, email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: { name, email, password },
    noAuth: true,
  });
}

async function loginUser(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    noAuth: true,
  });
  if (data && data.token) setAuthToken(data.token);
  return data;
}

async function getCurrentUser() {
  return apiRequest("/users/me", { method: "GET" });
}

async function updateCurrentUserName(name) {
  return apiRequest("/users/me", { method: "PUT", body: { name } });
}

async function changeCurrentUserPassword(currentPassword, newPassword) {
  return apiRequest("/users/me/password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
}

async function deleteMyAccount(password) {
  return apiRequest("/users/me", {
    method: "DELETE",
    body: { password },
  });
}

async function getMyTasks() {
  return apiRequest("/tasks/me", { method: "GET" });
}

async function updateMyTasks(tasks) {
  return apiRequest("/tasks/me", { method: "PUT", body: { tasks } });
}

window.api = {
  getAuthToken,
  setAuthToken,
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUserName,
  changeCurrentUserPassword,
  deleteMyAccount,
  getMyTasks,
  updateMyTasks,
};


