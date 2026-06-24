"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";

/**
 * RBAC helpers for components. Mirrors the backend's permission logic so the UI
 * can hide/disable actions the current user is not allowed to perform.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions ?? [];

  const can = useCallback(
    (permission: string) => {
      if (permissions.includes("*") || permissions.includes(permission)) return true;
      const [mod] = permission.split(":");
      return permissions.includes(`${mod}:*`);
    },
    [permissions]
  );

  const canAny = useCallback((perms: string[]) => perms.some(can), [can]);
  const canAll = useCallback((perms: string[]) => perms.every(can), [can]);

  return { permissions, can, canAny, canAll, roleKey: user?.roleKey ?? null };
}
