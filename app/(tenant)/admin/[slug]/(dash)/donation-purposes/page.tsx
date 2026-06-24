"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  Button,
  PageHeader,
  RefreshButton,
  StatCard,
  SectionCard,
  StatusChip,
  DataTable,
  FormField,
  SwitchOption,
  FormDialog,
  useOverlayState,
  toast,
  type Column,
} from "@/components/ui";
import { useTenant, usePagination, useResource } from "@/hooks";
import type { DonationPurpose } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/format";

const emptyDraft = { name: "", description: "", suggestedAmount: "", active: true };

export default function DonationPurposesPage() {
  const { api } = useTenant();
  const pagination = usePagination();
  const { items: list, create, update } = useResource(api.donationPurposes, pagination.params);
  const dialog = useOverlayState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);

  const totalRaised = list.reduce((s, p) => s + p.totalRaised, 0);
  const activeCount = list.filter((p) => p.active).length;

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft);
    dialog.open();
  }

  function openEdit(p: DonationPurpose) {
    setEditingId(p.id);
    setDraft({
      name: p.name,
      description: p.description ?? "",
      suggestedAmount: p.suggestedAmount ? String(p.suggestedAmount) : "",
      active: p.active,
    });
    dialog.open();
  }

  async function save() {
    if (!draft.name.trim()) {
      toast.danger("Purpose name is required");
      throw new Error("validation");
    }
    const fields = {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      suggestedAmount: draft.suggestedAmount ? Number(draft.suggestedAmount) || undefined : undefined,
      active: draft.active,
    };
    try {
      if (editingId) {
        await update(editingId, fields);
        toast.success(`${fields.name} updated`);
      } else {
        await create(fields);
        toast.success(`${fields.name} added`);
      }
    } catch (err) {
      toast.danger("Could not save the purpose. Please try again.");
      throw err;
    }
  }

  const columns: Column<DonationPurpose>[] = [
    {
      key: "name",
      label: "Purpose",
      isRowHeader: true,
      render: (p) => (
        <div className="min-w-0">
          <p className="font-medium">{p.name}</p>
          {p.description ? (
            <p className="text-foreground/55 truncate text-xs">{p.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "suggestedAmount",
      label: "Suggested",
      align: "end",
      render: (p) => (p.suggestedAmount ? formatCurrency(p.suggestedAmount) : "—"),
    },
    { key: "donationsCount", label: "Donations", align: "end", render: (p) => formatNumber(p.donationsCount) },
    { key: "totalRaised", label: "Raised", align: "end", render: (p) => formatCurrency(p.totalRaised) },
    { key: "active", label: "Status", render: (p) => <StatusChip status={p.active ? "active" : "inactive"} /> },
    {
      key: "actions",
      label: "",
      align: "end",
      render: (p) => (
        <Button isIconOnly size="sm" variant="ghost" aria-label={`Edit ${p.name}`} onPress={() => openEdit(p)}>
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Donation Purposes"
        description="The categories donations can be assigned to. Devotees and staff pick from these when recording a donation."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={openCreate}>
              <Plus className="size-4" /> New purpose
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total raised" value={formatCurrency(totalRaised)} icon="lucide:indian-rupee" />
        <StatCard label="Purposes" value={String(list.length)} icon="lucide:list-checks" />
        <StatCard label="Active" value={String(activeCount)} icon="lucide:circle-check" />
      </div>

      <div className="mt-6">
        <SectionCard flush>
          <DataTable aria-label="Donation purposes" columns={columns} rows={list} getRowKey={(p) => p.id} />
        </SectionCard>
      </div>

      <FormDialog
        isOpen={dialog.isOpen}
        onOpenChange={dialog.setOpen}
        title={editingId ? "Edit purpose" : "New purpose"}
        submitLabel={editingId ? "Save changes" : "Create purpose"}
        onSubmit={save}
      >
        <FormField label="Purpose name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} isRequired />
        <FormField
          label="Description"
          value={draft.description}
          onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
          placeholder="What is this fund for?"
        />
        <FormField
          label="Suggested amount (₹)"
          type="number"
          value={draft.suggestedAmount}
          onChange={(v) => setDraft((d) => ({ ...d, suggestedAmount: v }))}
          description="Optional preset shown when recording a donation."
        />
        <SwitchOption
          label="Active"
          description="Available to select when recording a donation"
          isSelected={draft.active}
          onChange={(v) => setDraft((d) => ({ ...d, active: v }))}
        />
      </FormDialog>
    </div>
  );
}
