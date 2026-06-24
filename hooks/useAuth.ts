"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Primary auth hook. Exposes the session user + auth actions and (optionally)
 * hydrates the session from the persisted token on first mount.
 */
export function useAuth(options: { hydrate?: boolean } = {}) {
  const store = useAuthStore();

  useEffect(() => {
    if (options.hydrate && store.status === "idle") {
      void store.hydrate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.hydrate, store.status]);

  return {
    user: store.user,
    status: store.status,
    error: store.error,
    isAuthenticated: store.status === "authenticated",
    isLoading: store.status === "loading" || store.status === "idle",
    login: store.login,
    loginWithPin: store.loginWithPin,
    logout: store.logout,
    hydrate: store.hydrate,
    hasPermission: store.hasPermission,
  };
}
