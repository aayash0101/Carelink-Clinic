// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',        // ✅ always proxy
  withCredentials: true,  // ✅ send cookies
});

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const safeUUID = () => {
  try {
    return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

api.interceptors.request.use((config) => {
  // ✅ CSRF: server sets cookie "csrf-token" on GET /api/* (your middleware does that)
  const csrfToken = getCookie('csrf-token');
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;

  // ✅ request tracing headers (your backend expects them in allowedHeaders)
  config.headers['X-Timestamp'] = Date.now().toString();
  config.headers['X-Request-ID'] = safeUUID();

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // Optional: redirect to login on 401
    if (status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        const returnUrl = encodeURIComponent(currentPath);
        window.location.href = `/login?return=${returnUrl}`;
      }
    }

    // If CSRF expired/missing, refresh to get a new csrf cookie
    if (
      status === 403 &&
      (code === 'CSRF_TOKEN_MISSING' || code === 'CSRF_TOKEN_INVALID' || code === 'CSRF_TOKEN_EXPIRED')
    ) {
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default api;
