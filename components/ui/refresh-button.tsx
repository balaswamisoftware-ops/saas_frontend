"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface RefreshButtonProps {
  /**
   * Optional refresh handler (e.g. reset local list state / refetch). Runs
   * before `router.refresh()`, which re-runs server data for the route.
   */
  onRefresh?: () => void | Promise<void>;
  label?: string;
  /** Render just the icon (no label) — handy in tight headers. */
  iconOnly?: boolean;
  className?: string;
}

/** Standard "refresh this list" control used in list-page headers. */
export function RefreshButton({ onRefresh, label = "Refresh", iconOnly, className }: RefreshButtonProps) {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  async function handleRefresh() {
    setSpinning(true);
    try {
      await onRefresh?.();
      router.refresh();
    } finally {
      // Keep the icon spinning briefly so the click registers visually.
      setTimeout(() => setSpinning(false), 600);
    }
  }

  return (
    <Button
      variant="outline"
      isIconOnly={iconOnly}
      onPress={handleRefresh}
      aria-label={label}
      className={className}
    >
      <RotateCw className={cn("size-4", spinning && "animate-spin")} />
      {iconOnly ? null : label}
    </Button>
  );
}
