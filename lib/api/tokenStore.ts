/**
 * Single source of truth for auth tokens in the browser. Both the axios
 * interceptors and the Zustand auth store read/write through here so they never
 * drift out of sync. Persisted to localStorage to survive reloads.
 */
const ACCESS_KEY = "seva.accessToken";
const REFRESH_KEY = "seva.refreshToken";

const isBrowser = typeof window !== "undefined";

export const tokenStore = {
  get access(): string | null {
    return isBrowser ? window.localStorage.getItem(ACCESS_KEY) : null;
  },
  get refresh(): string | null {
    return isBrowser ? window.localStorage.getItem(REFRESH_KEY) : null;
  },
  set(tokens: { accessToken: string; refreshToken: string }) {
    if (!isBrowser) return;
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    if (!isBrowser) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
