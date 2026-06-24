import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { platformNav } from "@/config/nav";

/** Frame for the SaaS platform console (super-admin). */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard loginHref="/login">
      <DashboardShell nav={platformNav} workspace="platform">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
