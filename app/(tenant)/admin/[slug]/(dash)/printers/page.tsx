"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, Printer as PrinterIcon, Trash2 } from "lucide-react";
import { Chip, Modal } from "@heroui/react";
import {
  Button,
  PageHeader,
  RefreshButton,
  StatCard,
  SectionCard,
  DataTable,
  ConfirmDialog,
  useOverlayState,
  toast,
  type Column,
} from "@/components/ui";
import { usePagination, useResource, useTenant } from "@/hooks";
import type { Printer, PrinterStatus } from "@/types";
import { ScaledReceipt } from "@/components/receipt/scaled-receipt";
import { useApi } from "@/hooks";
import {
  RECEIPT_LAYOUT_LABEL,
  SAMPLE_RECEIPT,
  resolveDesign,
  printReceipt,
  type ReceiptData,
} from "@/lib/receipt";

const CONNECTION_LABEL: Record<string, string> = {
  ethernet: "Ethernet",
  usb: "USB",
  wifi: "WiFi",
  bluetooth: "Bluetooth",
};

const STATUS_COLOR: Record<PrinterStatus, "success" | "danger" | "default"> = {
  online: "success",
  offline: "danger",
  disabled: "default",
};

export default function PrintersPage() {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const pagination = usePagination();
  const { items: list, remove } = useResource(api.printers, pagination.params);
  const deleteDialog = useOverlayState();
  const [pendingDelete, setPendingDelete] = useState<Printer | null>(null);
  const previewDialog = useOverlayState();
  const [previewPrinter, setPreviewPrinter] = useState<Printer | null>(null);
  const { data: settings } = useApi(() => api.settings.get(), []);
  // The saved layout design for the printer being previewed, plus a sample
  // receipt carrying the tenant's real organisation header.
  const previewDesign = previewPrinter
    ? resolveDesign(previewPrinter.layout, settings?.receiptLayouts)
    : null;
  const previewData: ReceiptData = {
    ...SAMPLE_RECEIPT,
    orgName: settings?.name ?? SAMPLE_RECEIPT.orgName,
    addressLines: settings
      ? [settings.addressLine1, [settings.addressLine2, settings.city, settings.state, settings.pincode].filter(Boolean).join(", ")].filter(
          (l): l is string => Boolean(l && l.trim()),
        )
      : SAMPLE_RECEIPT.addressLines,
    phone: settings?.phone ?? SAMPLE_RECEIPT.phone,
    gstin: settings?.gstin ?? SAMPLE_RECEIPT.gstin,
    pan: settings?.pan ?? SAMPLE_RECEIPT.pan,
    reg80g: settings?.reg80g ?? SAMPLE_RECEIPT.reg80g,
  };

  function openPreview(printer: Printer) {
    setPreviewPrinter(printer);
    previewDialog.open();
  }

  function askDelete(printer: Printer) {
    setPendingDelete(printer);
    deleteDialog.open();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await remove(pendingDelete.id);
      toast.success(`${pendingDelete.name} deleted`);
    } catch {
      toast.danger(`Failed to delete ${pendingDelete.name}`);
    }
    setPendingDelete(null);
  }

  const online = list.filter((p) => p.status === "online").length;

  const columns: Column<Printer>[] = [
    {
      key: "name",
      label: "Printer",
      isRowHeader: true,
      render: (p) => (
        <div>
          <p className="font-medium">{p.name}</p>
          {p.model ? <p className="text-foreground/50 text-xs">{p.model}</p> : null}
        </div>
      ),
    },
    {
      key: "connection",
      label: "Connection",
      render: (p) => (
        <Chip size="sm" variant="soft" color="default">
          {CONNECTION_LABEL[p.connection] ?? p.connection}
        </Chip>
      ),
    },
    { key: "ipAddress", label: "IP Address", render: (p) => p.ipAddress || "—" },
    {
      key: "layout",
      label: "Layout",
      render: (p) => (
        <Chip size="sm" variant="soft" color="default">
          {RECEIPT_LAYOUT_LABEL[p.layout]}
        </Chip>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <Chip size="sm" variant="soft" color={STATUS_COLOR[p.status]}>
          {p.status === "online" ? "Online" : p.status === "offline" ? "Offline" : "Disabled"}
        </Chip>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "end",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Preview ${p.name} layout`}
            onPress={() => openPreview(p)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Edit ${p.name}`}
            onPress={() => router.push(adminPath(`/printers/${p.id}/edit`))}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Delete ${p.name}`}
            onPress={() => askDelete(p)}
          >
            <Trash2 className="text-danger size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Printers"
        description="Set up receipt printers for this location."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={() => router.push(adminPath("/printers/new"))}>
              <Plus className="size-4" /> Add printer
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total printers" value={String(list.length)} icon="lucide:printer" />
        <StatCard label="Online" value={String(online)} icon="lucide:wifi" />
        <StatCard label="Offline / disabled" value={String(list.length - online)} icon="lucide:power-off" />
      </div>

      <div className="mt-6">
        <SectionCard title="All printers" flush>
          <DataTable
            aria-label="Printers"
            columns={columns}
            rows={list}
            getRowKey={(p) => p.id}
            onRowAction={(id) => router.push(adminPath(`/printers/${id}/edit`))}
            emptyTitle="No printers yet"
            emptyDescription="Add a receipt printer to get started."
          />
        </SectionCard>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete printer?"}
        description="This printer will be removed. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />

      <Modal isOpen={previewDialog.isOpen} onOpenChange={previewDialog.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  {previewPrinter
                    ? `${previewPrinter.name} — ${RECEIPT_LAYOUT_LABEL[previewPrinter.layout]}`
                    : "Receipt preview"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="bg-default-100 rounded-lg p-4">
                  {previewPrinter && previewDesign ? (
                    <ScaledReceipt layout={previewPrinter.layout} design={previewDesign} data={previewData} />
                  ) : null}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => previewDialog.setOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  isDisabled={!previewPrinter}
                  onPress={() =>
                    previewPrinter &&
                    previewDesign &&
                    printReceipt(previewPrinter.layout, previewDesign, previewData)
                  }
                >
                  <PrinterIcon className="size-4" /> Print
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
