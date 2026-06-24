"use client";

import { RouterProvider, Toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Global client providers shared by every route (auth, SaaS console and the
 * tenant admin dashboard).
 *
 * - `RouterProvider` wires HeroUI's `Link`/navigation primitives into the
 *   Next.js App Router so client-side navigation "just works".
 * - `Toast.Provider` mounts the single toast outlet used app-wide via the
 *   `toast` helper re-exported from `@/components/ui`.
 */
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Re-hydrate the signed-in user from the stored token on first mount so the
  // top bar, permissions etc. reflect the real session (via GET /auth/me).
  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  return (
    <RouterProvider navigate={(href) => router.push(href)}>
      {children}
      <Toast.Provider placement="bottom end" />
    </RouterProvider>
  );
}
