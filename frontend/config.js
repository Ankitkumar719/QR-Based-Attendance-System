const defaultApiBase = window.location.hostname.includes("vercel.app")
    ? "https://smart-attendance-backend.onrender.com"
    : "";

window.__APP_API_BASE__ = window.__APP_API_BASE__ || defaultApiBase;
