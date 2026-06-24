/**
 * Indian phone helpers. The UI always captures a 10-digit national number; we
 * store and send it with the +91 country code so the backend gets a tidy value.
 */
export const PHONE_CODE = "+91";

/** Last 10 digits of any stored/raw phone — what the input shows. */
export function toNationalPhone(raw?: string | null): string {
  return (raw ?? "").replace(/\D/g, "").slice(-10);
}

/** 10-digit national number -> "+91XXXXXXXXXX" (empty string when blank). */
export function toApiPhone(national?: string | null): string {
  const digits = (national ?? "").replace(/\D/g, "").slice(0, 10);
  return digits ? `${PHONE_CODE}${digits}` : "";
}
