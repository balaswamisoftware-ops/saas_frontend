/**
 * Re-export HeroUI's class helpers so the whole app imports them from one place.
 * `cn` merges Tailwind classes; `tv` builds variant-aware component styles.
 */
export { cn, tv } from "@heroui/react";
export type { VariantProps } from "@heroui/react";

/** Build initials from a name, e.g. "Rama Krishna" -> "RK". */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Title-case a snake/kebab token, e.g. "past_due" -> "Past Due". */
export function humanize(value?: string | null): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Clamp a number between a min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
