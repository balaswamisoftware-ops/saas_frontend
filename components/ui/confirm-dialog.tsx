"use client";

import { useState } from "react";
import { Modal, Button } from "@heroui/react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use the danger styling for destructive actions. */
  destructive?: boolean;
  /** Called when confirmed. May be async; the button shows a spinner. */
  onConfirm: () => void | Promise<void>;
}

/**
 * Reusable confirmation modal for destructive or important actions
 * (delete tenant, suspend account, cancel subscription, …). Controlled via
 * `isOpen` / `onOpenChange` — pair it with `useOverlayState`.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    try {
      setPending(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            {description ? (
              <Modal.Body>
                <p className="text-foreground/70 text-sm">{description}</p>
              </Modal.Body>
            ) : null}
            <Modal.Footer>
              <Button variant="ghost" onPress={() => onOpenChange(false)} isDisabled={pending}>
                {cancelLabel}
              </Button>
              <Button
                variant={destructive ? "danger" : "primary"}
                onPress={handleConfirm}
                isDisabled={pending}
              >
                {confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
