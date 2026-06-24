import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { tenantNav } from "@/config/nav";

/** Frame for the tenant admin dashboard, scoped to the tenant's slug. */
export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <AuthGuard loginHref={`/admin/${slug}/login`}>
      <DashboardShell
        nav={tenantNav}
        workspace="tenant"
        slug={slug}
        user={{
          settingsHref: `/admin/${slug}/settings`,
          signOutHref: `/admin/${slug}/login`,
        }}
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
