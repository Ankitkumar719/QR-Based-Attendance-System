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

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

const makeHttpError = (path, status, data) => {
  const message = data?.message || data?.error || "Request failed";

  const err = new Error(message);

  err.isHttpError = true;
  err.status = status;
  err.data = data;
  err.response = { status, data };
  err.path = path;

  return err;
};

export const apiGet = async (path) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(false)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw makeHttpError(path, res.status, data);
  }

  return data;
};

export const apiPost = async (path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw makeHttpError(path, res.status, data);
  }

  return data;
};

export const apiPut = async (path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw makeHttpError(path, res.status, data);
  }

  return data;
};

export const apiDelete = async (path) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: buildHeaders(false)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw makeHttpError(path, res.status, data);
  }

  return data;
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