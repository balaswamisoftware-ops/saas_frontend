"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useState } from "react";
import {
  FormPage,
  FormField,
  SelectField,
  toast,
} from "@/components/ui";
import { useTenant, useApi } from "@/hooks";
import type { Booking, BookingStatus } from "@/types";

const statusOptions = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const LIST_SUB = "/bookings";

const today = () => new Date().toISOString().slice(0, 10);

function draftFromBooking(b?: Booking) {
  return {
    sevaName: b?.sevaName ?? "",
    devoteeName: b?.devoteeName ?? "",
    date: b?.date ?? b?.soldAt?.slice(0, 10) ?? today(),
    amount: b ? String(b.amount) : "0",
    status: b?.status ?? ("pending" as BookingStatus),
  };
}

export interface BookingFormProps {
  /** The booking being edited, or undefined when creating a new one. */
  booking?: Booking;
}

export function BookingForm({ booking }: BookingFormProps) {
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const isEdit = Boolean(booking);
  const [draft, setDraft] = useState(() => draftFromBooking(booking));

  const sevaOptions = (useApi(() => api.sevas.list(), []).data?.items ?? []).map((s) => ({
    id: s.name,
    label: s.name,
  }));
  const devoteeOptions = (useApi(() => api.devotees.list(), []).data?.items ?? []).map((d) => ({
    id: d.name,
    label: d.name,
  }));

  async function save() {
    if (!draft.sevaName || !draft.devoteeName) {
      toast.danger("Seva and devotee are required");
      throw new Error("validation");
    }
    const payload: Partial<Booking> = {
      sevaName: draft.sevaName,
      devoteeName: draft.devoteeName,
      date: draft.date,
      amount: Number(draft.amount) || 0,
      status: draft.status,
    };
    try {
      if (isEdit && booking) {
        await api.bookings.update(booking.id, payload);
      } else {
        await api.bookings.create(payload);
      }
      toast.success(isEdit ? "Booking updated" : "Booking added");
    } catch (err) {
      toast.danger(isEdit ? "Failed to update booking" : "Failed to add booking");
      throw err;
    }
  }

  return (
    <FormPage
      title={isEdit ? "Edit booking" : "New booking"}
      description={isEdit ? booking?.sevaName : "Create a new seva booking."}
      backHref={adminPath(LIST_SUB)}
      backLabel="Back to bookings"
      submitLabel={isEdit ? "Save changes" : "Create booking"}
      onSubmit={save}
    >
      <SelectField
        label="Seva"
        options={sevaOptions}
        selectedKey={draft.sevaName}
        onSelectionChange={(k) => setDraft((d) => ({ ...d, sevaName: String(k ?? "") }))}
      />
      <SelectField
        label="Devotee"
        options={devoteeOptions}
        selectedKey={draft.devoteeName}
        onSelectionChange={(k) => setDraft((d) => ({ ...d, devoteeName: String(k ?? "") }))}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date" type="date" value={draft.date} onChange={(v) => setDraft((d) => ({ ...d, date: v }))} />
        <FormField label="Amount (₹)" type="number" value={draft.amount} onChange={(v) => setDraft((d) => ({ ...d, amount: v }))} />
      </div>
      <SelectField
        label="Status"
        options={statusOptions}
        selectedKey={draft.status}
        onSelectionChange={(k) => setDraft((d) => ({ ...d, status: String(k ?? "pending") as BookingStatus }))}
      />
    </FormPage>
  );
}
