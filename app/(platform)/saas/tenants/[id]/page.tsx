"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, StatCard, SectionCard } from "@/components/ui";
import { useApi, useAuth } from "@/hooks";
import { tenantsApi } from "@/lib/api/services";
import { canImpersonate } from "@/lib/permissions";
import { formatDate, formatNumber } from "@/lib/format";
import { humanize } from "@/lib/utils";
import { TenantActions } from "./tenant-actions";

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, loading } = useApi(() => tenantsApi.get(id), [id]);
  const { user } = useAuth();

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (!tenant) return <div className="text-foreground/50 p-6">Not found.</div>;

  const allowImpersonate = canImpersonate(user?.roleKey);

  const details: { label: string; value: string }[] = [
    { label: "Owner", value: tenant.ownerEmail },
    { label: "Slug", value: tenant.slug },
    { label: "Country", value: tenant.country },
    { label: "Employees allowed", value: String(tenant.seats) },
    { label: "Joined", value: formatDate(tenant.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title={tenant.name}
        description={tenant.ownerEmail}
        eyebrow={
          <Link
            href="/saas/tenants"
            className="text-foreground/55 hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" /> Back to tenants
          </Link>
        }
        actions={
          <TenantActions
            tenant={tenant}
            canImpersonate={allowImpersonate}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Members" value={formatNumber(tenant.membersCount)} />
        <StatCard label="Status" value={humanize(tenant.status)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Organisation details">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {details.map((d) => (
                <div key={d.label}>
                  <dt className="text-foreground/50 text-xs uppercase tracking-wide">{d.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{d.value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>

        <SectionCard title="Access">
          <div className="space-y-3 text-sm">
            <p className="text-foreground/60">
              {allowImpersonate
                ? "Your role can impersonate this tenant to troubleshoot inside their workspace. Sessions are logged."
                : "Your role has read-only access. Only Super Admin and Admin can impersonate tenants."}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-foreground/55">Your role</span>
              <span className="font-medium">{humanize(user?.roleName ?? user?.roleKey ?? "—")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/55">Impersonation</span>
              <span className="font-medium">{allowImpersonate ? "Allowed" : "Not allowed"}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
