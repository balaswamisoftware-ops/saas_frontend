"use client";

import { cn } from "@/lib/utils";
import { PHONE_CODE } from "@/lib/phone";

export interface PhoneFieldProps {
  label?: string;
  /** The 10-digit national number (no country code). */
  value: string;
  /** Called with the sanitised 10-digit national number. */
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

/**
 * Phone input with a fixed +91 country code prefix that only accepts a 10-digit
 * national number. Pair with the `toApiPhone` / `toNationalPhone` helpers in
 * `@/lib/phone` to convert to/from the stored "+91XXXXXXXXXX" form.
 */
export function PhoneField({
  label,
  value,
  onChange,
  placeholder = "10-digit number",
  description,
  isRequired,
  isDisabled,
  className,
}: PhoneFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label className="text-sm font-medium">
          {label}
          {isRequired ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-xl border bg-background transition",
          isDisabled ? "border-default-200 opacity-50" : "border-default-300 focus-within:border-primary",
        )}
      >
        <span className="bg-default-100 text-foreground/60 border-default-200 grid place-items-center border-r px-3 text-sm">
          {PHONE_CODE}
        </span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          disabled={isDisabled}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none disabled:cursor-not-allowed"
        />
      </div>
      {description ? <p className="text-foreground/55 text-xs">{description}</p> : null}
    </div>
  );
}
