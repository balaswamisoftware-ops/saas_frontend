import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenStore } from "./tokenStore";
import type { ApiEnvelope, ApiErrorShape, PageMeta } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

/** The raw axios instance. Prefer the typed `api` helpers below in app code. */
export const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/* ── Request: attach the access token ─────────────────────────────────── */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response: transparent refresh-token rotation on 401 ──────────────── */
let refreshing: Promise<string | null> | null = null;
let onAuthFailure: (() => void) | null = null;

/** Lets the auth store register a callback to run when refresh ultimately fails. */
export function setAuthFailureHandler(fn: () => void) {
  onAuthFailure = fn;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken }
    );
    tokenStore.set(data.data);
    return data.data.accessToken;
  } catch {
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string; errors?: ApiErrorShape["errors"] }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Try one refresh+retry cycle for expired access tokens.
    if (status === 401 && original && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      }
      tokenStore.clear();
      onAuthFailure?.();
    }

    const shaped: ApiErrorShape = {
      status: status ?? 0,
      message: error.response?.data?.message ?? error.message ?? "Request failed",
      errors: error.response?.data?.errors,
    };
    return Promise.reject(shaped);
  }
);

/* ── Normalise Mongo `_id` -> `id` so the UI can rely on `id` everywhere ── */
function withId<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withId) as unknown as T;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.id == null && obj._id != null) obj.id = String(obj._id);
  }
  return value;
}

/* ── Typed helpers that unwrap the `{ data }` envelope ────────────────── */
async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  return withId((await p).data.data);
}

/** List helper that returns both items and pagination meta. */
export async function getList<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<{ items: T[]; meta: PageMeta }> {
  const res = await http.get<ApiEnvelope<T[]>>(url, config);
  return {
    items: withId(res.data.data),
    meta: res.data.meta ?? {
      page: 1,
      limit: res.data.data.length,
      total: res.data.data.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(http.get(url, config)),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(http.post(url, body, config)),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(http.patch(url, body, config)),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(http.put(url, body, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(http.delete(url, config)),
  list: getList,
};
