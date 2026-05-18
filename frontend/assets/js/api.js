const API_PREFIX = "/api/";

const toSameOriginApiPath = (path, query) => {
  const url = new URL(path, window.location.origin);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  return `${url.pathname}${url.search}${url.hash}`;
};

export const getToken = () => sessionStorage.getItem("token");

export const getUser = () => {
  const raw = sessionStorage.getItem("user");
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
  const res = await fetch(toSameOriginApiPath(path), {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw await makeHttpError(res);
  }

  return res.json();
};

export const apiGet = async (path, query) => {
  const res = await fetch(toSameOriginApiPath(path, query), {
    headers: buildHeaders(false)
  });

  if (!res.ok) {
    throw await makeHttpError(res);
  }

  return res.json();
};

export const apiPut = async (path, body) => {
  const res = await fetch(toSameOriginApiPath(path), {
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
  const res = await fetch(toSameOriginApiPath(path), {
    method: "DELETE",
    headers: buildHeaders(false)
  });

  if (!res.ok) {
    throw await makeHttpError(res);
  }

  return res.json();
};

export const apiDownload = async (path, filename) => {
  const res = await fetch(toSameOriginApiPath(path), {
    headers: buildHeaders(false)
  });

  if (!res.ok) {
    throw await makeHttpError(res);
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
};

export const logout = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  window.location.href = "index.html";
};

export const ensureAuth = (allowedRoles) => {
  const user = getUser();

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    window.location.href = "index.html";
  }

  return user;
};
