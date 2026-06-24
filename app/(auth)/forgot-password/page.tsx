"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, Card, FormField } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <Card className="p-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-foreground/55 text-sm">
          We&apos;ll email you a link to set a new password.
        </p>
      </div>

      {sent ? (
        <div className="bg-success/10 text-success rounded-lg px-4 py-3 text-sm">
          If an account exists for that email, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            label="Email"
            type="email"
            name="email"
            placeholder="you@organisation.org"
            autoComplete="email"
            isRequired
          />
          <Button type="submit" variant="primary" fullWidth>
            Send reset link
          </Button>
        </form>
      )}

      <p className="text-foreground/55 mt-6 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}
