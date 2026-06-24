"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Delete, X } from "lucide-react";
import { Card, cn, toast } from "@/components/ui";
import { Brand } from "@/components/layout/brand";
import { useAuth } from "@/hooks";

export interface TenantLoginProps {
  slug: string;
}

const PIN_LENGTH = 6;

/** Human label from a slug, e.g. "shanti-ashram" -> "Shanti Ashram". */
function slugToName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function TenantLogin({ slug }: TenantLoginProps) {
  const router = useRouter();
  const { loginWithPin } = useAuth();
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Ensures the sign-in fires only once per completed PIN.
  const submitted = useRef(false);

  const press = useCallback((digit: string) => {
    if (submitted.current) return;
    setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + digit));
  }, []);

  const backspace = useCallback(() => {
    if (submitted.current) return;
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    if (submitted.current) return;
    setPin("");
  }, []);

  // Auto sign-in once the full PIN is entered. Done in an effect (never during
  // render) so navigation/state updates don't happen while rendering.
  useEffect(() => {
    if (pin.length !== PIN_LENGTH || submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    loginWithPin({ tenantSlug: slug, pin })
      .then((user) => {
        toast.success(`Welcome, ${user.name}`);
        router.replace(`/admin/${slug}/dashboard`);
      })
      .catch((err) => {
        toast.danger((err as { message?: string }).message ?? "Invalid PIN");
        setPin("");
        setSubmitting(false);
        submitted.current = false;
      });
  }, [pin, router, slug, loginWithPin]);

  // Allow typing the PIN on a physical keyboard too.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        press(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      } else if (e.key === "Escape") {
        clear();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, backspace, clear]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="bg-default-50 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="p-6">
          <div className="mb-6 space-y-1 text-center">
            <p className="text-foreground/50 text-xs font-medium uppercase tracking-wide">{slug}</p>
            <h1 className="text-xl font-semibold tracking-tight">
              Sign in to {slugToName(slug) || "your organisation"}
            </h1>
            <p className="text-foreground/55 text-sm">Enter your staff PIN to continue.</p>
          </div>

          {/* PIN dots */}
          <div
            className="mb-6 flex justify-center gap-3"
            aria-label={`PIN, ${pin.length} of ${PIN_LENGTH} digits entered`}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-4 rounded-full border-2 transition",
                  i < pin.length
                    ? "border-foreground bg-foreground scale-110"
                    : "border-default-300 bg-transparent",
                )}
              />
            ))}
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-3">
            {keys.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                disabled={submitting}
                className="bg-default-100 hover:bg-default-200 active:bg-default-300 grid h-14 place-items-center rounded-xl text-xl font-semibold transition disabled:opacity-50"
              >
                {k}
              </button>
            ))}

            <button
              type="button"
              onClick={clear}
              disabled={submitting || !pin}
              aria-label="Clear"
              className="text-foreground/60 hover:bg-default-100 active:bg-default-200 grid h-14 place-items-center rounded-xl transition disabled:opacity-40"
            >
              <X className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => press("0")}
              disabled={submitting}
              className="bg-default-100 hover:bg-default-200 active:bg-default-300 grid h-14 place-items-center rounded-xl text-xl font-semibold transition disabled:opacity-50"
            >
              0
            </button>

            <button
              type="button"
              onClick={backspace}
              disabled={submitting || !pin}
              aria-label="Backspace"
              className="text-foreground/60 hover:bg-default-100 active:bg-default-200 grid h-14 place-items-center rounded-xl transition disabled:opacity-40"
            >
              <Delete className="size-5" />
            </button>
          </div>
        </Card>

        <div className="mt-6 flex justify-center opacity-70">
          <Brand href="/" subtitle="Powered by Seva CRM" />
        </div>
      </div>
    </div>
  );
}
