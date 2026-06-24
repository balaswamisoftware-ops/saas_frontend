"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useRouter } from "next/navigation";
import { Download, Pencil, Plus } from "lucide-react";
import { Chip } from "@heroui/react";
import {
  Button,
  PageHeader,
  RefreshButton,
  StatCard,
  SectionCard,
  DataTable,
  type Column,
} from "@/components/ui";
import { useTenant, usePagination, useResource } from "@/hooks";
import type { Donation } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { humanize } from "@/lib/utils";

export default function DonationsPage() {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const pagination = usePagination();
  const { items: list } = useResource(api.donations, pagination.params);

  const total = list.reduce((s, d) => s + d.amount, 0);
  const donors = new Set(list.map((d) => d.devoteeName)).size;

  const columns: Column<Donation>[] = [
    { key: "receiptNo", label: "Receipt", isRowHeader: true, render: (d) => <span className="font-medium">{d.receiptNo}</span> },
    { key: "devoteeName", label: "Donor" },
    { key: "purpose", label: "Purpose" },
    { key: "method", label: "Method", render: (d) => (
        <Chip size="sm" variant="soft" color="default">
          {humanize(d.method)}
        </Chip>
      ) },
    { key: "amount", label: "Amount", align: "end", render: (d) => formatCurrency(d.amount) },
    { key: "date", label: "Date", render: (d) => formatDate(d.date) },
    {
      key: "actions",
      label: "",
      align: "end",
      render: (d) => (
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Edit donation"
          onPress={() => router.push(adminPath(`/donations/${d.id}/edit`))}
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Donations"
        description="Contributions received from devotees."
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton />
            <Button variant="outline">
              <Download className="size-4" /> Export
            </Button>
            <Button variant="primary" onPress={() => router.push(adminPath("/new-donation"))}>
              <Plus className="size-4" /> Record donation
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total received" value={formatCurrency(total)} icon="lucide:indian-rupee" delta={9.5} hint="this month" />
        <StatCard label="Donations" value={String(list.length)} icon="lucide:heart-handshake" />
        <StatCard label="Unique donors" value={String(donors)} icon="lucide:users" />
      </div>

      <div className="mt-6">
        <SectionCard title="Recent donations" flush>
          <DataTable
            aria-label="Donations"
            columns={columns}
            rows={list}
            getRowKey={(d) => d.id}
            onRowAction={(id) => router.push(adminPath(`/donations/${id}/edit`))}
          />
        </SectionCard>
      </div>
    </div>
  );
}
