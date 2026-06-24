"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Modal, Button } from "@heroui/react";

export interface FormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  size?: "sm" | "md" | "lg";
  /** The form fields. */
  children: ReactNode;
  /**
   * Called on submit. Throw to keep the dialog open (e.g. validation failed);
   * resolve to close it. May be async — the submit button shows a spinner.
   */
  onSubmit: () => void | Promise<void>;
}

/**
 * Reusable "add / edit" modal form used across the app. Pair it with
 * `useOverlayState`; put `FormField`/`SelectField` etc. as children.
 */
export function FormDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  size = "md",
  children,
  onSubmit,
}: FormDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setPending(true);
      await onSubmit();
      onOpenChange(false);
    } catch {
      /* keep the dialog open so the user can fix the input */
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size={size} scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit} className="contents">
              <Modal.Header>
                <Modal.Heading>{title}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                {description ? (
                  <p className="text-foreground/60 text-sm">{description}</p>
                ) : null}
                {children}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  type="button"
                  variant="ghost"
                  onPress={() => onOpenChange(false)}
                  isDisabled={pending}
                >
                  {cancelLabel}
                </Button>
                <Button type="submit" variant="primary" isDisabled={pending}>
                  {submitLabel}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
