"use client";

import { PageHeader, StatCard, SectionCard } from "@/components/ui";
import { useTenant, useApi } from "@/hooks";
import { formatCurrency } from "@/lib/format";

export function ReportsView() {
  const { api } = useTenant();
  const { data, loading } = useApi(() => api.reports(), []);

  const monthly = data?.monthly ?? [];
  const bySeva = data?.bySeva ?? [];
  const ytd = data?.ytd ?? 0;
  const peak = Math.max(1, ...monthly.map((m) => m.amount));
  const avg = monthly.length ? Math.round(ytd / monthly.length) : 0;
  const best = monthly.reduce<{ month: string; amount: number } | null>(
    (b, m) => (m.amount > (b?.amount ?? -1) ? m : b),
    null,
  );
  const hasBest = Boolean(best && best.amount > 0);

  return (
    <div>
      <PageHeader title="Reports" description="Insights into donations, sevas and growth." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Donations (6 mo)" value={formatCurrency(ytd)} icon="lucide:indian-rupee" />
        <StatCard label="Avg. monthly" value={formatCurrency(avg)} icon="lucide:trending-up" />
        <StatCard
          label="Best month"
          value={hasBest ? best!.month : "—"}
          hint={hasBest ? formatCurrency(best!.amount) : undefined}
          icon="lucide:calendar"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Donations by month" description="Last 6 months">
            {loading ? (
              <p className="text-foreground/50 py-12 text-center text-sm">Loading…</p>
            ) : ytd === 0 ? (
              <p className="text-foreground/50 py-12 text-center text-sm">No donations recorded yet.</p>
            ) : (
              <div className="flex h-56 items-end gap-3">
                {monthly.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="bg-primary/80 hover:bg-primary w-full rounded-t-md transition-colors"
                        style={{ height: `${Math.round((m.amount / peak) * 100)}%` }}
                        title={formatCurrency(m.amount)}
                      />
                    </div>
                    <span className="text-foreground/55 text-xs">{m.month}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Top sevas" description="Share of counter revenue">
          {loading ? (
            <p className="text-foreground/50 py-8 text-center text-sm">Loading…</p>
          ) : bySeva.length === 0 ? (
            <p className="text-foreground/50 py-8 text-center text-sm">No bookings yet.</p>
          ) : (
            <ul className="space-y-4">
              {bySeva.map((s) => (
                <li key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-foreground/55">{s.share}%</span>
                  </div>
                  <div className="bg-default-200 h-2 overflow-hidden rounded-full">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${s.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
