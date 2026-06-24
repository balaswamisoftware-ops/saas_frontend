"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  PageHeader,
  RefreshButton,
  SectionCard,
  SearchInput,
  StatusChip,
  DataTable,
  toast,
  type Column,
} from "@/components/ui";
import { useTenant, usePagination, useResource } from "@/hooks";
import type { Seva } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function SevasPage() {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const pagination = usePagination();
  const { items, remove } = useResource(api.sevas, pagination.params);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, items]);

  const columns: Column<Seva>[] = [
    { key: "name", label: "Seva", isRowHeader: true, render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "price", label: "Price", align: "end", render: (s) => formatCurrency(s.price) },
    { key: "bookingsCount", label: "Bookings", align: "end", render: (s) => formatNumber(s.bookingsCount) },
    { key: "active", label: "Status", render: (s) => <StatusChip status={s.active ? "active" : "inactive"} /> },
    {
      key: "actions",
      label: "",
      align: "end",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Edit ${s.name}`}
            onPress={() => router.push(adminPath(`/sevas/${s.id}/edit`))}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Delete ${s.name}`}
            onPress={async () => {
              try {
                await remove(s.id);
                toast.success(`${s.name} deleted`);
              } catch (err) {
                toast.danger((err as { message?: string }).message ?? "Something went wrong");
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sevas"
        description="Services and offerings devotees can book."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={() => router.push(adminPath("/sevas/new"))}>
              <Plus className="size-4" /> New seva
            </Button>
          </>
        }
      />
      <SectionCard flush>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search sevas…" aria-label="Search sevas" />
          <span className="text-foreground/50 ml-auto text-sm">{rows.length} sevas</span>
        </div>
        <DataTable
          aria-label="Sevas"
          columns={columns}
          rows={rows}
          getRowKey={(s) => s.id}
          onRowAction={(id) => router.push(adminPath(`/sevas/${id}/edit`))}
          emptyTitle="No sevas match"
          emptyDescription="Try a different search."
        />
      </SectionCard>
    </div>
  );
}
