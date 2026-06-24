"use client";

import { PageHeader, StatCard, SectionCard, StatusChip, DataTable, type Column } from "@/components/ui";
import type { Booking, CrmEvent } from "@/types";
import { formatDate, formatNumber } from "@/lib/format";
import { useApi, useTenant } from "@/hooks";

const bookingColumns: Column<Booking>[] = [
  { key: "sevaName", label: "Seva", isRowHeader: true, render: (b) => <span className="font-medium">{b.sevaName}</span> },
  { key: "devoteeName", label: "Devotee" },
  { key: "soldAt", label: "Date", render: (b) => formatDate(b.soldAt) },
  { key: "amount", label: "Amount", align: "end", render: (b) => `₹${formatNumber(b.amount)}` },
  { key: "status", label: "Status", render: (b) => <StatusChip status={b.status} /> },
];

/** Reads a metric value (formatted string) from the dashboard payload by label. */
function metric(metrics: { label: string; value: string }[] | undefined, label: string): string {
  return metrics?.find((m) => m.label === label)?.value ?? "—";
}

export default function TenantDashboardPage() {
  const { api } = useTenant();
  const { data: stats } = useApi(() => api.dashboard(), []);
  const { data: bookingsData } = useApi(() => api.bookings.list({ limit: 5, sort: "soldAt", order: "desc" }), []);
  const { data: eventsData } = useApi(() => api.events.list({ limit: 6 }), []);

  const metrics = stats?.metrics;
  const bookings = (bookingsData?.items ?? []) as Booking[];
  const events = (eventsData?.items ?? []) as CrmEvent[];

  return (
    <div>
      <PageHeader title="Dashboard" description="Your organisation at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Devotees" value={metric(metrics, "Devotees")} icon="lucide:contact" hint="total" />
        <StatCard label="Donations" value={metric(metrics, "Donations")} icon="lucide:heart-handshake" hint="collected" />
        <StatCard label="Seva bookings" value={metric(metrics, "Bookings")} icon="lucide:hand-heart" hint="all time" />
        <StatCard label="Active events" value={metric(metrics, "Active events")} icon="lucide:calendar-days" hint="scheduled" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title="Recent bookings" description="Latest seva bookings" flush>
            <DataTable
              aria-label="Recent bookings"
              columns={bookingColumns}
              rows={bookings}
              getRowKey={(b) => b.id}
              emptyTitle="No bookings yet"
              emptyDescription="Counter sales will appear here."
            />
          </SectionCard>
        </div>

        <SectionCard title="Upcoming events">
          {events.length ? (
            <ul className="space-y-4">
              {events.map((e) => (
                <li key={e.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{e.title}</p>
                    <StatusChip status={e.status} />
                  </div>
                  <p className="text-foreground/55">{e.venue}</p>
                  <p className="text-foreground/40 text-xs">
                    {formatDate(e.startsAt)} · {formatNumber(e.registered)} tickets issued
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-foreground/50 text-sm">No events scheduled.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
