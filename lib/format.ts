/** Formatting helpers used across tables, cards and detail pages. */

export function formatCurrency(
  amount: number,
  currency = "INR",
  opts: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...opts,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** Compact form for KPIs, e.g. 12_400 -> "12.4K". */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(
  input: string | number | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat("en-IN", opts).format(new Date(input));
}

export function formatDateTime(input: string | number | Date): string {
  return formatDate(input, { dateStyle: "medium", timeStyle: "short" });
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
