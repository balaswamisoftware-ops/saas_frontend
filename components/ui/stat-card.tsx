import { Icon } from "@iconify/react";
import { Card } from "@heroui/react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Iconify icon name, e.g. `"lucide:building-2"`. */
  icon?: string;
  /** Percentage change vs the previous period. */
  delta?: number;
  hint?: string;
  className?: string;
}

/**
 * KPI tile for dashboard overviews. Works for any metric in either console —
 * MRR, tenants, donations, bookings, etc.
 */
export function StatCard({
  label,
  value,
  icon,
  delta,
  hint,
  className,
}: StatCardProps) {
  const trend = delta === undefined ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const trendIcon =
    trend === "up"
      ? "lucide:arrow-up-right"
      : trend === "down"
        ? "lucide:arrow-down-right"
        : "lucide:minus";

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-foreground/60 text-sm font-medium">{label}</span>
        {icon ? (
          <span className="bg-default-100 text-foreground/70 grid size-9 place-items-center rounded-lg">
            <Icon icon={icon} className="size-4.5" />
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {delta !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-danger",
              trend === "flat" && "text-foreground/50",
            )}
          >
            <Icon icon={trendIcon} className="size-3.5" />
            {formatPercent(delta)}
          </span>
        ) : null}
        {hint ? <span className="text-foreground/50">{hint}</span> : null}
      </div>
    </Card>
  );
}
