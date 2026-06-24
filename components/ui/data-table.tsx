"use client";

import type { ReactNode } from "react";
import { Table, Spinner, EmptyState } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  /** Unique key; also used to read `row[key]` when no `render` is given. */
  key: string;
  label: ReactNode;
  align?: "start" | "center" | "end";
  /** Marks the primary identifying column for accessibility. */
  isRowHeader?: boolean;
  /** Custom cell renderer. */
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  "aria-label": string;
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Row click handler — receives the row's key. */
  onRowAction?: (key: string) => void;
  className?: string;
}

const alignClass = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
} as const;

/**
 * Generic, fully reusable data table built on HeroUI's `Table`. Drive it with a
 * `columns` definition and a `rows` array — used for every list view across the
 * SaaS console and the tenant admin (tenants, devotees, donations, etc.).
 */
export function DataTable<T>({
  "aria-label": ariaLabel,
  columns,
  rows,
  getRowKey,
  isLoading,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Records will appear here once they exist.",
  onRowAction,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("relative", className)}>
      {isLoading ? (
        <div className="bg-background/50 absolute inset-0 z-10 grid place-items-center backdrop-blur-sm">
          <Spinner aria-label="Loading" />
        </div>
      ) : null}

      <Table>
        <Table.ScrollContainer className="app-scroll w-full overflow-x-auto">
          <Table.Content
            aria-label={ariaLabel}
            onRowAction={onRowAction ? (key) => onRowAction(String(key)) : undefined}
          >
            <Table.Header>
              {columns.map((col) => (
                <Table.Column
                  key={col.key}
                  id={col.key}
                  isRowHeader={col.isRowHeader}
                  className={cn(alignClass[col.align ?? "start"], col.className)}
                >
                  {col.label}
                </Table.Column>
              ))}
            </Table.Header>

            <Table.Body
              renderEmptyState={() => (
                <EmptyState className="py-12 text-center">
                  <p className="font-medium">{emptyTitle}</p>
                  <p className="text-foreground/55 mt-1 text-sm">{emptyDescription}</p>
                </EmptyState>
              )}
            >
              {rows.map((row) => (
                <Table.Row key={getRowKey(row)} id={getRowKey(row)}>
                  {columns.map((col) => (
                    <Table.Cell
                      key={col.key}
                      className={cn(alignClass[col.align ?? "start"])}
                    >
                      {col.render
                        ? col.render(row)
                        : ((row as Record<string, ReactNode>)[col.key] ?? "—")}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
