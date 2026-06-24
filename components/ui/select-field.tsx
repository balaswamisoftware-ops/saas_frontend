"use client";

import type { Key } from "@heroui/react";
import { Select, ListBox, ListBoxItem, Label } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectFieldProps {
  label?: string;
  name?: string;
  placeholder?: string;
  options: SelectOption[];
  selectedKey?: Key | null;
  defaultSelectedKey?: Key;
  onSelectionChange?: (key: Key | null) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** Labelled dropdown select, reusable across filters and forms. */
export function SelectField({
  label,
  name,
  placeholder = "Select…",
  options,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  isRequired,
  isDisabled,
  className,
  "aria-label": ariaLabel,
}: SelectFieldProps) {
  return (
    <Select
      name={name}
      aria-label={ariaLabel}
      placeholder={placeholder}
      selectedKey={selectedKey}
      defaultSelectedKey={defaultSelectedKey}
      onSelectionChange={onSelectionChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={cn("flex flex-col gap-1.5", className)}
    >
      {label ? <Label>{label}</Label> : null}
      <Select.Trigger>
        <Select.Value />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((opt) => (
            <ListBoxItem key={opt.id} id={opt.id}>
              {opt.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
