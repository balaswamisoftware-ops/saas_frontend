import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, type SessionUser } from "@/lib/api/services";
import { tokenStore } from "@/lib/api/tokenStore";
import { setAuthFailureHandler } from "@/lib/api/client";

interface AuthState {
  user: SessionUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;

  login: (input: { email: string; password: string; tenantSlug?: string }) => Promise<SessionUser>;
  loginWithPin: (input: { tenantSlug: string; pin: string }) => Promise<SessionUser>;
  logout: () => Promise<void>;
  /** Re-hydrates the session from a stored token (call on app mount). */
  hydrate: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

function can(permissions: string[], permission: string): boolean {
  if (permissions.includes("*") || permissions.includes(permission)) return true;
  const [mod] = permission.split(":");
  return permissions.includes(`${mod}:*`);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "idle",
      error: null,

      async login(input) {
        set({ status: "loading", error: null });
        try {
          const result = await authApi.login(input);
          tokenStore.set({ accessToken: result.accessToken, refreshToken: result.refreshToken });
          set({ user: result.user, status: "authenticated" });
          return result.user;
        } catch (err) {
          const message = (err as { message?: string }).message ?? "Login failed";
          set({ status: "unauthenticated", error: message });
          throw err;
        }
      },

      async loginWithPin(input) {
        set({ status: "loading", error: null });
        try {
          const result = await authApi.pinLogin(input);
          tokenStore.set({ accessToken: result.accessToken, refreshToken: result.refreshToken });
          set({ user: result.user, status: "authenticated" });
          return result.user;
        } catch (err) {
          const message = (err as { message?: string }).message ?? "Invalid PIN";
          set({ status: "unauthenticated", error: message });
          throw err;
        }
      },

      async logout() {
        try {
          await authApi.logout(tokenStore.refresh ?? undefined);
        } catch {
          /* best effort */
        }
        tokenStore.clear();
        set({ user: null, status: "unauthenticated" });
      },

      async hydrate() {
        // Run once. Both Providers (on mount) and AuthGuard (when idle) call
        // this; the guard ensures a single GET /auth/me instead of two. Setting
        // status synchronously below makes a concurrent second call a no-op.
        if (get().status !== "idle") return;
        if (!tokenStore.access) {
          set({ status: "unauthenticated" });
          return;
        }
        set({ status: "loading" });
        try {
          const user = await authApi.me();
          set({ user, status: "authenticated" });
        } catch {
          tokenStore.clear();
          set({ user: null, status: "unauthenticated" });
        }
      },

      hasPermission(permission) {
        const user = get().user;
        return user ? can(user.permissions, permission) : false;
      },
    }),
    {
      name: "seva.auth",
      partialize: (s) => ({ user: s.user }), // tokens live in tokenStore, not here
    }
  )
);

// When the axios layer exhausts refresh, force the store to a clean logout state.
if (typeof window !== "undefined") {
  setAuthFailureHandler(() => {
    useAuthStore.setState({ user: null, status: "unauthenticated" });
  });
}
