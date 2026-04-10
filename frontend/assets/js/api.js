const API_BASE_URL = "http://localhost:5000";

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

export const apiGet = async (path) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(false)
  });
  if (!res.ok) throw new Error((await res.json()).message || "Request failed");
  return res.json();
};

export const apiPost = async (path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const apiPut = async (path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const apiDelete = async (path) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: buildHeaders(false)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const ensureAuth = (allowedRoles) => {
  const user = getUser();
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    window.location.href = "index.html";
  }
  return user;
};
