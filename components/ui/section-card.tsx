import type { ReactNode } from "react";
import { Card } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title?: ReactNode;
  description?: string;
  /** Right-aligned header content (e.g. a "View all" link or action). */
  action?: ReactNode;
  children: ReactNode;
  /** Remove inner padding around the body — useful when wrapping a table. */
  flush?: boolean;
  className?: string;
}

/**
 * A titled content panel. Use it to group forms, lists or tables on a page in
 * either console.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  flush,
  className,
}: SectionCardProps) {
  const hasHeader = title || description || action;
  return (
    <Card className={cn("overflow-hidden", className)}>
      {hasHeader ? (
        <div className="border-default-200/60 flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="space-y-0.5">
            {title ? <h2 className="font-semibold">{title}</h2> : null}
            {description ? (
              <p className="text-foreground/55 text-sm">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn(!flush && "p-5")}>{children}</div>
    </Card>
  );
}
