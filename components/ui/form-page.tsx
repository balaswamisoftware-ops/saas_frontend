"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@heroui/react";
import { PageHeader } from "./page-header";
import { SectionCard } from "./section-card";

export interface FormPageProps {
  title: string;
  description?: string;
  /** Where Cancel and a successful submit navigate back to (the list page). */
  backHref: string;
  backLabel?: string;
  /** Hide the back link (e.g. for standalone quick-action pages). */
  hideBack?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  /** The form fields. */
  children: ReactNode;
  /**
   * Called on submit. Throw to stay on the page (e.g. validation failed);
   * resolve to navigate back to `backHref`. May be async — the button shows
   * a disabled/pending state.
   */
  onSubmit: () => void | Promise<void>;
}

/**
 * Full-page equivalent of {@link FormDialog} — used for route-based add/edit
 * screens (`/new`, `/[id]/edit`) instead of a modal. Renders the standard
 * page header, a card with the fields, and a Cancel / Submit footer.
 */
export function FormPage({
  title,
  description,
  backHref,
  backLabel = "Back",
  hideBack = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  children,
  onSubmit,
}: FormPageProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setPending(true);
      await onSubmit();
      router.push(backHref);
    } catch {
      /* keep the user on the page so they can fix the input */
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        eyebrow={
          hideBack ? undefined : (
            <Link
              href={backHref}
              className="text-foreground/55 hover:text-foreground inline-flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="size-4" /> {backLabel}
            </Link>
          )
        }
      />

      <form onSubmit={handleSubmit}>
        <SectionCard>
          <div className="space-y-4">{children}</div>
        </SectionCard>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onPress={() => router.push(backHref)} isDisabled={pending}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="primary" isDisabled={pending}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
