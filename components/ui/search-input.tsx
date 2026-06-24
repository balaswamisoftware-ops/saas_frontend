"use client";

import { SearchField } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Controlled search box used above data tables. Keep the value in the parent so
 * it can filter the table's rows.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  "aria-label": ariaLabel = "Search",
}: SearchInputProps) {
  return (
    <SearchField
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      className={cn("w-full sm:max-w-xs", className)}
    >
      <SearchField.Input placeholder={placeholder} />
    </SearchField>
  );
}
