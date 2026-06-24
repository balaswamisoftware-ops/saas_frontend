"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Button,
  PageHeader,
  RefreshButton,
  SectionCard,
  SearchInput,
  StatusChip,
  DataTable,
  type Column,
} from "@/components/ui";
import { useResource, usePagination } from "@/hooks";
import { tenantsApi } from "@/lib/api/services";
import type { Tenant } from "@/types";
import { formatDate, formatNumber } from "@/lib/format";

const columns: Column<Tenant>[] = [
  { key: "name", label: "Tenant", isRowHeader: true, render: (t) => (
      <div>
        <p className="font-medium">{t.name}</p>
        <p className="text-foreground/50 text-xs">{t.ownerEmail}</p>
      </div>
    ) },
  { key: "membersCount", label: "Members", align: "end", render: (t) => formatNumber(t.membersCount) },
  { key: "createdAt", label: "Joined", render: (t) => formatDate(t.createdAt) },
  { key: "status", label: "Status", render: (t) => <StatusChip status={t.status} /> },
];

export default function TenantsPage() {
  const router = useRouter();
  const pagination = usePagination();
  const { items } = useResource<Tenant>(tenantsApi, pagination.params);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) => t.name.toLowerCase().includes(q) || t.ownerEmail.toLowerCase().includes(q),
    );
  }, [query, items]);

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Every organisation using the platform."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={() => router.push("/saas/tenants/new")}>
              <Plus className="size-4" /> New tenant
            </Button>
          </>
        }
      />

      <SectionCard flush>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search tenants…"
            aria-label="Search tenants"
          />
          <span className="text-foreground/50 ml-auto text-sm">{rows.length} tenants</span>
        </div>

        <DataTable
          aria-label="Tenants"
          columns={columns}
          rows={rows}
          getRowKey={(t) => t.id}
          onRowAction={(id) => router.push(`/saas/tenants/${id}`)}
          emptyTitle="No tenants match"
          emptyDescription="Try a different search."
        />
      </SectionCard>
    </div>
  );
}
