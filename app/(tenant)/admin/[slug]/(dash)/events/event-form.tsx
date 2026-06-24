"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useState } from "react";
import {
  FormPage,
  FormField,
  SelectField,
  CheckboxGroup,
  CheckOption,
  toast,
} from "@/components/ui";
import { useApi, useTenant } from "@/hooks";
import type { CrmEvent, EventStatus } from "@/types";
import { RECEIPT_LAYOUT_LABEL } from "@/lib/receipt";

const statusOptions = [
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const LIST_SUB = "/events";

const dtLocal = (iso: string) => iso.slice(0, 16);

function draftFromEvent(e?: CrmEvent) {
  return {
    title: e?.title ?? "",
    venue: e?.venue ?? "",
    startsAt: e ? dtLocal(e.startsAt) : "",
    endsAt: e ? dtLocal(e.endsAt) : "",
    status: e?.status ?? ("upcoming" as EventStatus),
    sevas: e?.sevas ?? ([] as string[]),
    printerId: e?.printerId ?? "",
  };
}

export interface EventFormProps {
  /** The event being edited, or undefined when creating a new one. */
  event?: CrmEvent;
}

export function EventForm({ event }: EventFormProps) {
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const isEdit = Boolean(event);
  const [draft, setDraft] = useState(() => draftFromEvent(event));

  const sevasData = useApi(() => api.sevas.list(), []);
  const sevas = sevasData.data?.items ?? [];
  const printersData = useApi(() => api.printers.list(), []);
  // Printers staff can assign to issue this event's receipts/tickets.
  const printerOptions = (printersData.data?.items ?? []).map((p) => ({
    id: p.id,
    label: `${p.name} · ${RECEIPT_LAYOUT_LABEL[p.layout]}`,
  }));

  async function save() {
    if (!draft.title.trim()) {
      toast.danger("Event title is required");
      throw new Error("validation");
    }
    const title = draft.title.trim();
    const payload: Partial<CrmEvent> = {
      title,
      venue: draft.venue,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      status: draft.status,
      sevas: draft.sevas,
      printerId: draft.printerId || undefined,
    };
    try {
      if (isEdit && event) {
        await api.events.update(event.id, payload);
      } else {
        await api.events.create(payload);
      }
    } catch (err) {
      toast.danger(isEdit ? `Failed to update ${title}` : `Failed to create ${title}`);
      throw err;
    }
    toast.success(isEdit ? `${title} updated` : `${title} created`);
  }

  return (
    <FormPage
      title={isEdit ? "Edit event" : "Create event"}
      description={
        isEdit
          ? event?.title
          : "Programs and festivals. Add the sevas devotees can book tickets for at this event."
      }
      backHref={adminPath(LIST_SUB)}
      backLabel="Back to events"
      submitLabel={isEdit ? "Save changes" : "Create event"}
      onSubmit={save}
    >
      <FormField label="Title" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} isRequired />
      <FormField label="Venue" value={draft.venue} onChange={(v) => setDraft((d) => ({ ...d, venue: v }))} />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Starts" type="datetime-local" value={draft.startsAt} onChange={(v) => setDraft((d) => ({ ...d, startsAt: v }))} />
        <FormField label="Ends" type="datetime-local" value={draft.endsAt} onChange={(v) => setDraft((d) => ({ ...d, endsAt: v }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Status"
          options={statusOptions}
          selectedKey={draft.status}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, status: String(k ?? "upcoming") as EventStatus }))}
        />
        <SelectField
          label="Receipt printer"
          placeholder={printerOptions.length ? "Select…" : "No printers configured"}
          options={printerOptions}
          selectedKey={draft.printerId || null}
          isDisabled={!printerOptions.length}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, printerId: String(k ?? "") }))}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Sevas at this event</p>
        <p className="text-foreground/55 text-xs">
          Devotees can book tickets for the sevas you select here.
        </p>
        <CheckboxGroup
          aria-label="Sevas at this event"
          value={draft.sevas}
          onChange={(v) => setDraft((d) => ({ ...d, sevas: v }))}
          className="gap-2"
        >
          {sevas.map((s) => (
            <CheckOption key={s.id} value={s.name} label={s.name} />
          ))}
        </CheckboxGroup>
      </div>
    </FormPage>
  );
}
