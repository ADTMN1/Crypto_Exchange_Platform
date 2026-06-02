import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string>;
}

/** Shape returned to callers on any rejected request. */
export interface NormalizedError {
  message: string;
  errors?: Record<string, string>;
  statusCode?: number;
}

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REFRESH_URL = "/auth/refresh";

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Required so the browser sends/receives HTTP-Only cookies
});

// ─── Token Refresh State ──────────────────────────────────────────────────────

/** True while a /auth/refresh call is in-flight. */
let isRefreshing = false;

/** Requests that arrived while a refresh was in-flight. */
let pendingQueue: QueueItem[] = [];

/**
 * Drain the queue after a refresh attempt settles.
 * Atomically swaps the queue out first to prevent re-entrancy issues.
 */
function drainQueue(error: AxiosError | null): void {
  const queue = pendingQueue;
  pendingQueue = [];
  queue.forEach((item) => (error ? item.reject(error) : item.resolve(null)));
}

/**
 * Park the current request until the in-flight refresh settles,
 * then retry it automatically.
 */
function enqueueRequest(originalRequest: RetryableRequest): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    pendingQueue.push({ resolve, reject });
  }).then(() => api(originalRequest));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildNormalizedError(
  error: AxiosError<ApiErrorResponse>,
): NormalizedError {
  const base: NormalizedError = {
    message: "An unexpected error occurred. Please try again.",
    statusCode: error.response?.status,
  };

  if (error.response) {
    base.message = error.response.data?.message ?? base.message;
    base.errors = error.response.data?.errors;
  }

  return base;
}

/**
 * Redirect the user to the login page with a session-expired flag.
 * Safe to call from SSR contexts — exits early if `window` is unavailable.
 */
function handleGlobalLogout(): void {
  if (typeof window === "undefined") return;
  window.location.href = "/login?session=expired";
}

// ─── Response Interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequest;
    const normalizedError = buildNormalizedError(error);

    // No response means a network-level failure — no point retrying.
    if (!error.response) {
      return Promise.reject<NormalizedError>({
        ...normalizedError,
        message: "Network error: Unable to connect to the server.",
      });
    }

    // Only attempt token refresh on 401s that haven't been retried yet.
    if (error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(normalizedError);
    }

    // A 401 from the refresh endpoint means the refresh token itself is expired.
    if (originalRequest.url?.includes(REFRESH_URL)) {
      handleGlobalLogout();
      return Promise.reject(normalizedError);
    }

    // Another refresh call is already in-flight — queue this request.
    if (isRefreshing) {
      return enqueueRequest(originalRequest);
    }

    // Kick off a token refresh, then retry all queued requests.
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post(REFRESH_URL);
      drainQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      drainQueue(refreshError as AxiosError);
      handleGlobalLogout();
      return Promise.reject(normalizedError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
