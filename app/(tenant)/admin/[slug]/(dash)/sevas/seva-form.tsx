"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useState } from "react";
import {
  FormPage,
  FormField,
  SwitchOption,
  toast,
} from "@/components/ui";
import { useTenant } from "@/hooks";
import type { Seva } from "@/types";

const LIST_SUB = "/sevas";

function draftFromSeva(s?: Seva) {
  return {
    name: s?.name ?? "",
    price: s ? String(s.price) : "0",
    active: s?.active ?? true,
  };
}

export interface SevaFormProps {
  /** The seva being edited, or undefined when creating a new one. */
  seva?: Seva;
}

export function SevaForm({ seva }: SevaFormProps) {
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const isEdit = Boolean(seva);
  const [draft, setDraft] = useState(() => draftFromSeva(seva));

  async function save() {
    if (!draft.name.trim()) {
      toast.danger("Seva name is required");
      throw new Error("validation");
    }
    const name = draft.name.trim();

    const payload: Partial<Seva> = {
      name,
      price: Number(draft.price) || 0,
      currency: seva?.currency ?? "INR",
      active: draft.active,
    };

    try {
      if (isEdit && seva) {
        await api.sevas.update(seva.id, payload);
      } else {
        await api.sevas.create(payload);
      }
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Something went wrong");
      throw err;
    }

    toast.success(isEdit ? `${name} updated` : `${name} added`);
  }

  return (
    <FormPage
      title={isEdit ? "Edit seva" : "New seva"}
      description={isEdit ? seva?.name : "Services and offerings devotees can book."}
      backHref={adminPath(LIST_SUB)}
      backLabel="Back to sevas"
      submitLabel={isEdit ? "Save changes" : "Create seva"}
      onSubmit={save}
    >
      <FormField label="Seva name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} isRequired />
      <FormField label="Price (₹)" type="number" value={draft.price} onChange={(v) => setDraft((d) => ({ ...d, price: v }))} />
      <SwitchOption
        label="Active"
        description="Devotees can book this seva"
        isSelected={draft.active}
        onChange={(v) => setDraft((d) => ({ ...d, active: v }))}
      />
    </FormPage>
  );
}
