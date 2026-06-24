import { Chip } from "@heroui/react";
import { humanize } from "@/lib/utils";

type ChipColor = "default" | "success" | "warning" | "danger";

/** Maps any domain status string to a semantic chip colour. */
const STATUS_COLOR: Record<string, ChipColor> = {
  // positive
  active: "success",
  paid: "success",
  confirmed: "success",
  completed: "success",
  // in-progress / attention
  pending: "warning",
  trialing: "warning",
  open: "warning",
  upcoming: "warning",
  ongoing: "warning",
  paused: "warning",
  // negative
  suspended: "danger",
  past_due: "danger",
  cancelled: "danger",
  canceled: "danger",
  uncollectible: "danger",
  // neutral
  inactive: "default",
  archived: "default",
  void: "default",
};

export interface StatusChipProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Reusable status pill used in every table and detail page across both
 * consoles. Give it any status string and it picks the right colour + label.
 */
export function StatusChip({ status, size = "sm", className }: StatusChipProps) {
  const color = STATUS_COLOR[status.toLowerCase()] ?? "default";
  return (
    <Chip color={color} variant="soft" size={size} className={className}>
      {humanize(status)}
    </Chip>
  );
}
