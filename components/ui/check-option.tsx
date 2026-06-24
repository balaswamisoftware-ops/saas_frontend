"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface CheckOptionProps {
  /** Value within a `CheckboxGroup`. */
  value?: string;
  name?: string;
  isSelected?: boolean;
  defaultSelected?: boolean;
  onChange?: (selected: boolean) => void;
  isDisabled?: boolean;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
}

/**
 * A labelled checkbox with the visible box rendered. HeroUI v3's `Checkbox` is
 * fully compositional (Content / Control / Indicator) — this wraps the boilerplate
 * so every checkbox across the app looks the same. Use standalone or inside a
 * `CheckboxGroup`.
 */
export function CheckOption({
  value,
  name,
  isSelected,
  defaultSelected,
  onChange,
  isDisabled,
  label,
  description,
  className,
}: CheckOptionProps) {
  return (
    <Checkbox
      value={value}
      name={name}
      isSelected={isSelected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={cn("flex", className)}
    >
      <Checkbox.Content className="items-start gap-2.5">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <span className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          {description ? (
            <span className="text-foreground/55 text-xs">{description}</span>
          ) : null}
        </span>
      </Checkbox.Content>
    </Checkbox>
  );
}
