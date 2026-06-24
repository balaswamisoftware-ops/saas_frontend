"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Printer } from "lucide-react";
import { Chip } from "@heroui/react";
import {
  Button,
  PageHeader,
  RefreshButton,
  SectionCard,
  SearchInput,
  DataTable,
  type Column,
} from "@/components/ui";
import { useTenant, usePagination, useResource, useApi } from "@/hooks";
import type { Booking, CrmEvent, PaymentMode, Printer as PrinterType, ReceiptLayout } from "@/types";
import type { TenantSettings } from "@/lib/api/services";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { printReceipt, resolveDesign, receiptFromBooking } from "@/lib/receipt";

const PAYMENT_LABEL: Record<PaymentMode, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  other: "Other",
};

const PAYMENT_CHIP: Record<
  PaymentMode,
  { variant: "primary" | "soft"; color?: "warning" | "default" | "accent" | "success" }
> = {
  cash: { variant: "primary" },
  upi: { variant: "soft", color: "warning" },
  card: { variant: "soft", color: "accent" },
  other: { variant: "soft", color: "default" },
};

/** Build receipt data for a booking and send it to its event's printer,
 *  using the tenant's real org header + the layout's saved design. */
function printBooking(
  b: Booking,
  events: CrmEvent[],
  printers: PrinterType[],
  settings: TenantSettings | null,
) {
  const event = events.find((e) => e.title === b.eventName);
  const printer = printers.find((p) => p.id === event?.printerId);
  const layout: ReceiptLayout = printer?.layout ?? "80mm";
  printReceipt(layout, resolveDesign(layout, settings?.receiptLayouts), receiptFromBooking(settings ?? {}, b));
}

export default function BookingsPage() {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const pagination = usePagination();
  const { items } = useResource(api.bookings, pagination.params);
  const events = useApi(() => api.events.list(), []).data?.items ?? [];
  const printers = useApi(() => api.printers.list(), []).data?.items ?? [];
  const settings = useApi(() => api.settings.get(), []).data;
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((b) =>
      [b.receiptNo, b.bookingNo, b.eventName, b.sevaName, b.devoteeName, b.soldBy].some((v) =>
        (v ?? "").toLowerCase().includes(q),
      ),
    );
  }, [query, items]);

  const columns: Column<Booking>[] = [
    {
      key: "receiptNo",
      label: "Receipt",
      isRowHeader: true,
      render: (b) => <span className="font-medium">{b.receiptNo}</span>,
    },
    { key: "bookingNo", label: "Booking", render: (b) => <span className="text-foreground/70">{b.bookingNo}</span> },
    { key: "eventName", label: "Event" },
    { key: "sevaName", label: "Seva" },
    { key: "devoteeName", label: "Devotee" },
    { key: "qty", label: "Qty", render: (b) => b.qty },
    {
      key: "amount",
      label: "Amount",
      align: "end",
      render: (b) => <span className="text-primary font-semibold">{formatCurrency(b.amount)}</span>,
    },
    {
      key: "payment",
      label: "Payment",
      render: (b) => (
        <Chip size="sm" variant={PAYMENT_CHIP[b.payment].variant} color={PAYMENT_CHIP[b.payment].color}>
          {PAYMENT_LABEL[b.payment]}
        </Chip>
      ),
    },
    { key: "soldBy", label: "Sold by" },
    { key: "soldAt", label: "Sold at", render: (b) => formatDateTime(b.soldAt) },
    {
      key: "actions",
      label: "",
      align: "end",
      render: (b) => (
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={`Print receipt ${b.receiptNo}`}
          onPress={() => printBooking(b, events, printers, settings)}
        >
          <Printer className="text-primary size-4" />
        </Button>
      ),
    },
  ];

  const total = rows.reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Counter-sale receipts issued for seva bookings."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={() => router.push(adminPath("/counter-sale"))}>
              <Plus className="size-4" /> New booking
            </Button>
          </>
        }
      />
      <SectionCard flush>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search receipt, booking, event, devotee…"
            aria-label="Search bookings"
          />
          <span className="text-foreground/50 ml-auto text-sm">
            {rows.length} bookings · {formatCurrency(total)}
          </span>
        </div>
        <DataTable
          aria-label="Bookings"
          columns={columns}
          rows={rows}
          getRowKey={(b) => b.id}
          onRowAction={(id) => router.push(adminPath(`/bookings/${id}/edit`))}
          emptyTitle="No bookings match"
          emptyDescription="Try a different search."
        />
      </SectionCard>
    </div>
  );
}
