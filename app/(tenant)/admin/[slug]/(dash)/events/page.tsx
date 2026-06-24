"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Pencil, Plus, Printer, Ticket } from "lucide-react";
import { Chip } from "@heroui/react";
import {
  Button,
  Card,
  PageHeader,
  RefreshButton,
  StatusChip,
} from "@/components/ui";
import { useApi, usePagination, useResource, useTenant } from "@/hooks";
import { formatDateTime, formatNumber } from "@/lib/format";

export default function EventsPage() {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const pagination = usePagination();
  const { items: list } = useResource(api.events, pagination.params);
  const printersData = useApi(() => api.printers.list(), []);
  const printers = printersData.data?.items ?? [];
  const printerName = (id?: string) => printers.find((p) => p.id === id)?.name;

  return (
    <div>
      <PageHeader
        title="Events"
        description="Programs and festivals. Add the sevas devotees can book tickets for at each event — your team issues the tickets."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={() => router.push(adminPath("/events/new"))}>
              <Plus className="size-4" /> Create event
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((e) => (
          <Card key={e.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{e.title}</h2>
              <StatusChip status={e.status} />
            </div>

            <div className="text-foreground/60 mt-3 space-y-1.5 text-sm">
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4" /> {e.startsAt ? formatDateTime(e.startsAt) : "—"}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4" /> {e.venue || "—"}
              </p>
              <p className="flex items-center gap-2">
                <Ticket className="size-4" /> {formatNumber(e.registered)} tickets issued
              </p>
              <p className="flex items-center gap-2">
                <Printer className="size-4" /> {printerName(e.printerId) ?? "No printer assigned"}
              </p>
            </div>

            <div className="mt-4 flex-1">
              <p className="text-foreground/50 text-xs font-medium uppercase tracking-wide">Sevas</p>
              {e.sevas && e.sevas.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {e.sevas.map((s) => (
                    <Chip key={s} size="sm" variant="soft" color="default">
                      {s}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-foreground/50 mt-1.5 text-sm">No sevas added yet</p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="outline" onPress={() => router.push(adminPath(`/events/${e.id}/edit`))}>
                <Pencil className="size-4" /> Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
