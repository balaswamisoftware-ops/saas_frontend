"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useState } from "react";
import { TextField, Label, TextArea } from "@heroui/react";
import { FormPage, FormField, SelectField, toast } from "@/components/ui";
import { useApi, useTenant } from "@/hooks";
import type { Printer, PrinterConnection, ReceiptLayout } from "@/types";
import { ScaledReceipt } from "@/components/receipt/scaled-receipt";
import { RECEIPT_LAYOUT_LABEL } from "@/lib/receipt";

const LIST_SUB = "/printers";
const NOTES_MAX = 500;

const connectionOptions = [
  { id: "ethernet", label: "Ethernet" },
  { id: "usb", label: "USB" },
  { id: "wifi", label: "WiFi" },
  { id: "bluetooth", label: "Bluetooth" },
];

const layoutOptions: { id: ReceiptLayout; label: string }[] = [
  { id: "55mm", label: RECEIPT_LAYOUT_LABEL["55mm"] },
  { id: "80mm", label: RECEIPT_LAYOUT_LABEL["80mm"] },
  { id: "a4", label: RECEIPT_LAYOUT_LABEL.a4 },
];

function draftFromPrinter(p?: Printer) {
  return {
    name: p?.name ?? "",
    model: p?.model ?? "",
    connection: (p?.connection ?? "ethernet") as PrinterConnection,
    layout: (p?.layout ?? "80mm") as ReceiptLayout,
    ipAddress: p?.ipAddress ?? "",
    backupPrinterId: p?.backupPrinterId ?? "",
    notes: p?.notes ?? "",
  };
}

export interface PrinterFormProps {
  /** The printer being edited, or undefined when adding a new one. */
  printer?: Printer;
}

export function PrinterForm({ printer }: PrinterFormProps) {
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const isEdit = Boolean(printer);
  const [draft, setDraft] = useState(() => draftFromPrinter(printer));

  const printersData = useApi(() => api.printers.list(), []);
  // Any other printer can serve as the backup (a printer can't back up itself).
  const backupOptions = (printersData.data?.items ?? [])
    .filter((p) => p.id !== printer?.id)
    .map((p) => ({ id: p.id, label: p.name }));

  // IP address only applies to network connections.
  const showIp = draft.connection === "ethernet" || draft.connection === "wifi";

  async function save() {
    if (!draft.name.trim()) {
      toast.danger("Printer name is required");
      throw new Error("validation");
    }
    const name = draft.name.trim();
    const payload: Partial<Printer> = {
      name,
      model: draft.model || undefined,
      connection: draft.connection,
      ipAddress: showIp ? draft.ipAddress || undefined : undefined,
      layout: draft.layout,
      backupPrinterId: draft.backupPrinterId || undefined,
      notes: draft.notes || undefined,
      status: printer?.status ?? "online",
    };
    try {
      if (isEdit && printer) {
        await api.printers.update(printer.id, payload);
      } else {
        await api.printers.create(payload);
      }
    } catch (err) {
      toast.danger(isEdit ? `Failed to update ${name}` : `Failed to add ${name}`);
      throw err;
    }
    toast.success(isEdit ? `${name} updated` : `${name} added`);
  }

  return (
    <FormPage
      title={isEdit ? "Edit printer" : "Add printer"}
      description={isEdit ? printer?.name : "Set up a receipt printer for this location."}
      backHref={adminPath(LIST_SUB)}
      backLabel="Back to printers"
      submitLabel={isEdit ? "Save changes" : "Add printer"}
      onSubmit={save}
    >
      <FormField
        label="Printer name"
        value={draft.name}
        onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
        placeholder="e.g. Receipt Printer 1"
        isRequired
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Model"
          value={draft.model}
          onChange={(v) => setDraft((d) => ({ ...d, model: v }))}
          placeholder="e.g. Epson TM-T88VI"
        />
        <SelectField
          label="Connection type"
          options={connectionOptions}
          selectedKey={draft.connection}
          onSelectionChange={(k) =>
            setDraft((d) => ({ ...d, connection: String(k ?? "ethernet") as PrinterConnection }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Receipt layout"
          options={layoutOptions}
          selectedKey={draft.layout}
          onSelectionChange={(k) =>
            setDraft((d) => ({ ...d, layout: String(k ?? "80mm") as ReceiptLayout }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {showIp ? (
          <FormField
            label="IP address"
            value={draft.ipAddress}
            onChange={(v) => setDraft((d) => ({ ...d, ipAddress: v }))}
            placeholder="192.168.1.150"
          />
        ) : null}
        <SelectField
          label="Backup printer"
          placeholder={backupOptions.length ? "Select…" : "No other printers"}
          options={backupOptions}
          selectedKey={draft.backupPrinterId || null}
          isDisabled={!backupOptions.length}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, backupPrinterId: String(k ?? "") }))}
        />
      </div>
      <TextField
        className="flex flex-col gap-1.5"
        value={draft.notes}
        onChange={(v) => setDraft((d) => ({ ...d, notes: v.slice(0, NOTES_MAX) }))}
      >
        <Label>Notes</Label>
        <TextArea placeholder="Notes about this printer" rows={4} maxLength={NOTES_MAX} />
        <span className="text-foreground/50 text-xs">
          {draft.notes.length}/{NOTES_MAX}
        </span>
      </TextField>

      <div className="flex flex-col gap-1.5">
        <Label>Layout preview — {RECEIPT_LAYOUT_LABEL[draft.layout]}</Label>
        <div className="bg-default-100 rounded-lg border p-4">
          <ScaledReceipt layout={draft.layout} />
        </div>
      </div>
    </FormPage>
  );
}
