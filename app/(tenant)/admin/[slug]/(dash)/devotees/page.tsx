"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Avatar, Chip } from "@heroui/react";
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
import type { Devotee } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { initials } from "@/lib/utils";

export default function DevoteesPage() {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const pagination = usePagination();
  const { items, remove } = useResource(api.devotees, pagination.params);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q),
    );
  }, [query, items]);

  const columns: Column<Devotee>[] = [
    {
      key: "name",
      label: "Devotee",
      isRowHeader: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <Avatar.Image src={d.avatarUrl} alt={d.name} />
            <Avatar.Fallback>{initials(d.name)}</Avatar.Fallback>
          </Avatar>
          <div>
            <p className="font-medium">{d.name}</p>
            <p className="text-foreground/50 text-xs">{d.email}</p>
          </div>
        </div>
      ),
    },
    { key: "city", label: "City" },
    {
      key: "tags",
      label: "Tags",
      render: (d) =>
        d.tags.length ? (
          <div className="flex flex-wrap gap-1">
            {d.tags.map((t) => (
              <Chip key={t} size="sm" variant="soft" color="default">
                {t}
              </Chip>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
    { key: "totalDonations", label: "Donations", align: "end", render: (d) => formatCurrency(d.totalDonations) },
    { key: "joinedAt", label: "Joined", render: (d) => formatDate(d.joinedAt) },
    { key: "status", label: "Status", render: (d) => <StatusChip status={d.status} /> },
    {
      key: "actions",
      label: "",
      align: "end",
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Edit ${d.name}`}
            onPress={() => router.push(adminPath(`/devotees/${d.id}/edit`))}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Delete ${d.name}`}
            onPress={async () => {
              try {
                await remove(d.id);
                toast.success(`${d.name} deleted`);
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
        title="Devotees"
        description="Your members and supporters."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={() => router.push(adminPath("/devotees/new"))}>
              <Plus className="size-4" /> Add devotee
            </Button>
          </>
        }
      />

      <SectionCard flush>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search devotees…" aria-label="Search devotees" />
          <span className="text-foreground/50 ml-auto text-sm">{rows.length} devotees</span>
        </div>
        <DataTable
          aria-label="Devotees"
          columns={columns}
          rows={rows}
          getRowKey={(d) => d.id}
          onRowAction={(id) => router.push(adminPath(`/devotees/${id}/edit`))}
          emptyTitle="No devotees match"
          emptyDescription="Try a different search."
        />
      </SectionCard>
    </div>
  );
}
