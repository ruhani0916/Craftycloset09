// frontend/src/api/axios.js
import axios from 'axios';
import { auth } from '../utils/firebase';

const api = axios.create({
  // In dev: Vite proxy forwards /api → localhost:5000
  // In production: set VITE_API_URL to your deployed backend URL
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: always attach a fresh Firebase ID token ──
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // getIdToken() returns cached token; auto-refreshes when < 5 min left
        const token = await currentUser.getIdToken();
        localStorage.setItem('cc_token', token);
        config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // Token refresh failed — let request proceed unauthenticated;
        // the 401 interceptor below will redirect to login.
        localStorage.removeItem('cc_token');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalise errors ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Don't redirect on auth endpoints themselves (sync/me)
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/');
      if (!isAuthEndpoint && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'Something went wrong';

    // Preserve HTTP status and backend error code on the thrown error
    // so callers (e.g. AuthContext) can branch on status/code without
    // having to parse the message string.
    const richError = new Error(message);
    richError.status = status;
    richError.code   = error.response?.data?.code;
    richError.data   = error.response?.data;
    return Promise.reject(richError);
  }
);

export default api;
