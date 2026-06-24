"use client";

import type { ReactNode } from "react";
import { Switch } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface SwitchOptionProps {
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
 * A labelled switch with the visible track/thumb rendered. HeroUI v3's `Switch`
 * is compositional (Content / Control / Thumb) — this wraps the boilerplate so
 * toggles look the same everywhere.
 */
export function SwitchOption({
  name,
  isSelected,
  defaultSelected,
  onChange,
  isDisabled,
  label,
  description,
  className,
}: SwitchOptionProps) {
  return (
    <Switch
      name={name}
      isSelected={isSelected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={cn("flex", className)}
    >
      <Switch.Content className="items-center gap-3">
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <span className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          {description ? (
            <span className="text-foreground/55 text-xs">{description}</span>
          ) : null}
        </span>
      </Switch.Content>
    </Switch>
  );
}
