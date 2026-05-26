import axios, { type InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/* ─────────────────────────────────────────────
   Cookie Helpers
   ─────────────────────────────────────────────
   Note: the *auth* cookies (access_token, refresh_token) are HttpOnly
   and therefore NOT readable from JS. That's the point — XSS can't
   steal them. The only cookie we read in JS is `csrf_token`, which is
   intentionally JS-readable for the double-submit pattern. */

/**
 * Read a cookie value by name. Returns null during SSR or if absent.
 */
export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/* ─────────────────────────────────────────────
   Axios Instance — cookie-based auth
   ─────────────────────────────────────────────
   `withCredentials: true` makes the browser auto-attach the HttpOnly
   `access_token` cookie on every request to this origin. We never
   manage tokens in JS anymore: no localStorage, no Authorization
   header. Server reads the cookie via the auth middleware. */

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    // CSRF: echo the cookie value as a header. Bearer auth would
    // bypass CSRF on the server, but we no longer use Bearer.
    const method = (config.method || "get").toLowerCase();
    if (MUTATING_METHODS.has(method)) {
      const csrfToken =
        getCookieValue("csrf_token") || getCookieValue("XSRF-TOKEN");
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }
  }
  return config;
});

/* ─────────────────────────────────────────────
   Response Interceptor
   - 401: silently call /auth/refresh to mint new cookies, then retry.
   - Refresh is itself cookie-driven (server reads refresh_token cookie),
     so no token plumbing in JS.
   ───────────────────────────────────────────── */

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(api(config));
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    // Don't try to refresh during the login/refresh flows themselves.
    const url = originalRequest.url || "";
    if (url.includes("/auth/login") || url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh uses the HttpOnly refresh_token cookie that the server
      // set on login. Empty body — server reads cookie.
      await axios.post(
        `${API_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function clearAuth() {
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login";
  }
}

/* ─────────────────────────────────────────────
   Typed Error Helper
   ───────────────────────────────────────────── */

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error) && error.response) {
    return {
      status: error.response.status,
      message:
        error.response.data?.error ||
        error.response.data?.message ||
        error.message,
      code: error.response.data?.code,
    };
  }
  return {
    status: 0,
    message:
      error instanceof Error ? error.message : "An unexpected error occurred",
  };
}
