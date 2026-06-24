"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";

export interface AuthGuardProps {
  /** Where to send the visitor when there is no active session. */
  loginHref: string;
  children: React.ReactNode;
}

/**
 * Gates a console behind authentication. Hydrates the session from the stored
 * token on mount and, once resolved, redirects unauthenticated visitors to the
 * login page instead of rendering an empty, 401-ing dashboard.
 */
export function AuthGuard({ loginHref, children }: AuthGuardProps) {
  const router = useRouter();
  const { status, hydrate } = useAuth();

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace(loginHref);
  }, [status, loginHref, router]);

  if (status !== "authenticated") {
    return (
      <div className="bg-default-50 flex min-h-screen items-center justify-center">
        <p className="text-foreground/50 text-sm">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
