"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, CheckOption, FormField } from "@/components/ui";
import { useAuth } from "@/hooks";

/**
 * Platform (SaaS) admin sign-in. Platform employees log in here with their
 * email + password. Tenants do NOT log in here — they use their own
 * slug-scoped login at `/admin/{slug}/login`.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.push("/saas/dashboard");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Platform sign in</h1>
        <p className="text-foreground/55 text-sm">For Seva CRM platform employees.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Work email"
          type="email"
          name="email"
          placeholder="you@sevacrm.app"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          isRequired
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          isRequired
        />

        {error ? <p className="text-danger text-sm">{error}</p> : null}

        <div className="flex items-center justify-between">
          <CheckOption name="remember" label="Remember me" />
          <Link href="/forgot-password" className="text-primary text-sm hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" fullWidth isDisabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-foreground/50 mt-6 text-center text-xs">
        Tenant staff sign in at your organisation&apos;s own link:
        <br />
        <span className="font-mono">/admin/your-organisation/login</span>
      </p>
    </Card>
  );
}
