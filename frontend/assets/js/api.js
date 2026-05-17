export const API_BASE_URL = "";

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

const makeHttpError = async (res) => {
  const data = await res.json().catch(() => ({}));
  return new Error(data.message || "Request failed");
};

export const apiPost = async (path, body) => {
  const res = await fetch(path, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw await makeHttpError(res);
  }

  return res.json();
};

export const apiGet = async (path) => {
  const res = await fetch(path, {
    headers: buildHeaders(false)
  });

  if (!res.ok) {
    throw await makeHttpError(res);
  }

  return res.json();
};

export const apiPut = async (path, body) => {
  const res = await fetch(path, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw await makeHttpError(res);
  }

  return res.json();
};

export const apiDelete = async (path) => {
  const res = await fetch(path, {
    method: "DELETE",
    headers: buildHeaders(false)
  });

  if (!res.ok) {
    throw await makeHttpError(res);
  }

  return res.json();
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