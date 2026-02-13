import axios, { type InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/* ─────────────────────────────────────────────
   Cookie Helpers
   ───────────────────────────────────────────── */

/**
 * Read a cookie value by name.
 * Works client-side only; returns null during SSR or if cookie is absent.
 */
export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** @internal alias for backwards compat */
const getCookie = getCookieValue;

/* ─────────────────────────────────────────────
   Axios Instance
   ───────────────────────────────────────────── */

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000, // 30s timeout
});

/* ─────────────────────────────────────────────
   Request Interceptor
   - Attach Bearer auth token
   - Attach CSRF token for state-changing requests
   ───────────────────────────────────────────── */

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    // Auth token
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CSRF token for mutating requests
    const method = (config.method || "get").toLowerCase();
    if (MUTATING_METHODS.has(method)) {
      const csrfToken = getCookie("csrf_token") || getCookie("XSRF-TOKEN");
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }
  }
  return config;
});

/* ─────────────────────────────────────────────
   Response Interceptor
   - 401: Attempt silent token refresh
   - Prevent infinite retry loops
   ───────────────────────────────────────────── */

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      resolve(api(config));
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only handle 401 and non-retried requests
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      isRefreshing = false;
      clearAuth();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      processQueue(null, data.access_token);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
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
      message: error.response.data?.error || error.response.data?.message || error.message,
      code: error.response.data?.code,
    };
  }
  return {
    status: 0,
    message: error instanceof Error ? error.message : "An unexpected error occurred",
  };
}
