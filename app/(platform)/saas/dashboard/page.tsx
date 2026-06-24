"use client";

import { PageHeader, StatCard, SectionCard, StatusChip, DataTable, type Column } from "@/components/ui";
import { useApi, useAuditLogs } from "@/hooks";
import { platformApi, tenantsApi } from "@/lib/api/services";
import type { Tenant } from "@/types";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { humanize } from "@/lib/utils";

const columns: Column<Tenant>[] = [
  { key: "name", label: "Tenant", isRowHeader: true, render: (t) => <span className="font-medium">{t.name}</span> },
  { key: "membersCount", label: "Members", align: "end", render: (t) => formatNumber(t.membersCount) },
  { key: "createdAt", label: "Joined", render: (t) => formatDate(t.createdAt) },
  { key: "status", label: "Status", render: (t) => <StatusChip status={t.status} /> },
];

export default function PlatformDashboardPage() {
  const { data: dashboard } = useApi(() => platformApi.dashboard(), []);
  const { data: tenantList } = useApi(() => tenantsApi.list({ limit: 100 }), []);
  const { logs } = useAuditLogs();

  const metrics = dashboard?.metrics ?? [];
  const recentTenants = (tenantList?.items ?? []).slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Platform Overview"
        description="How the whole product is performing across every tenant."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title="Recent tenants" description="Latest organisations on the platform" flush>
            <DataTable
              aria-label="Recent tenants"
              columns={columns}
              rows={recentTenants}
              getRowKey={(t) => t.id}
            />
          </SectionCard>
        </div>

        <SectionCard title="Activity" description="Latest platform events">
          <ul className="space-y-4">
            {logs.map((log) => (
              <li key={log.id} className="text-sm">
                <p className="font-medium">{humanize(log.action)}</p>
                <p className="text-foreground/55">
                  {log.targetLabel ?? "—"} · {log.actorName}
                </p>
                <p className="text-foreground/40 text-xs">{formatDateTime(log.createdAt)}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
