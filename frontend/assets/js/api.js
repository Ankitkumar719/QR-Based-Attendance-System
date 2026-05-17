const DEFAULT_API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "http://34.238.164.184:5000";

export const API_BASE_URL =
  window.API_BASE_URL ||
  (window._env_ && window._env_.API_BASE_URL) ||
  DEFAULT_API_BASE_URL;

export const getToken = () => localStorage.getItem("token");
export const getUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

const buildHeaders = (isJson = true) => {
  const headers = {};
  if (isJson) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const makeHttpError = (path, status, data) => {
  const message = data?.message || data?.error || "Request failed";
  const err = new Error(message);
  err.isHttpError = true;
  err.status = status;
  err.data = data;
  // Axios-compatible shape (student.js expects error.response.data/code)
  err.response = { status, data };
  err.path = path;
  return err;
};

export const apiGet = async (path) => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: buildHeaders(false)
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        console.error("API GET unauthorized:", path, payload.message || "No message");
        try { localStorage.removeItem("token"); localStorage.removeItem("user"); } catch (e) { /* ignore */ }
        window.location.href = "index.html";
        throw makeHttpError(path, res.status, payload);
      }
      throw makeHttpError(path, res.status, payload);
    }
    return res.json();
  } catch (err) {
    console.error(`API GET ${path} failed:`, err);
    throw err;
  }
};

export const apiPost = async (path, body) => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        console.error("API POST unauthorized:", path, data.message || "No message");
        try { localStorage.removeItem("token"); localStorage.removeItem("user"); } catch (e) { /* ignore */ }
        window.location.href = "index.html";
        throw makeHttpError(path, res.status, data);
      }
      throw makeHttpError(path, res.status, data);
    }
    return data;
  } catch (err) {
    console.error(`API POST ${path} failed:`, err);
    throw err;
  }
};

export const apiPut = async (path, body) => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        console.error("API PUT unauthorized:", path, data.message || "No message");
        try { localStorage.removeItem("token"); localStorage.removeItem("user"); } catch (e) { /* ignore */ }
        window.location.href = "index.html";
        throw makeHttpError(path, res.status, data);
      }
      throw makeHttpError(path, res.status, data);
    }
    return data;
  } catch (err) {
    console.error(`API PUT ${path} failed:`, err);
    throw err;
  }
};

export const apiDelete = async (path) => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: buildHeaders(false)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        console.error("API DELETE unauthorized:", path, data.message || "No message");
        try { localStorage.removeItem("token"); localStorage.removeItem("user"); } catch (e) { /* ignore */ }
        window.location.href = "index.html";
        throw makeHttpError(path, res.status, data);
      }
      throw makeHttpError(path, res.status, data);
    }
    return data;
  } catch (err) {
    console.error(`API DELETE ${path} failed:`, err);
    throw err;
  }
};

export const apiDownload = async (path, filename = "download.csv") => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: buildHeaders(false)
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        console.error("API DOWNLOAD unauthorized:", path, payload.message || "No message");
        try { localStorage.removeItem("token"); localStorage.removeItem("user"); } catch (e) { /* ignore */ }
        window.location.href = "index.html";
        throw makeHttpError(path, res.status, payload);
      }
      throw makeHttpError(path, res.status, payload);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(`API DOWNLOAD ${path} failed:`, err);
    throw err;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
};

export const ensureAuth = (allowedRoles) => {
  const user = getUser();
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    window.location.href = "index.html";
  }
  return user;
};
