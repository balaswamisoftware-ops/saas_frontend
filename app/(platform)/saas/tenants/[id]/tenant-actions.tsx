"use client";

import { useRouter } from "next/navigation";
import { UserRoundCog, Pencil } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  useOverlayState,
  toast,
} from "@/components/ui";
import type { Tenant } from "@/types";

export interface TenantActionsProps {
  tenant: Tenant;
  /** Whether the signed-in employee's role may impersonate (super admin / admin). */
  canImpersonate: boolean;
}

/** Actions for a tenant: impersonate, edit, and suspend/reactivate. */
export function TenantActions({ tenant, canImpersonate }: TenantActionsProps) {
  const router = useRouter();
  const suspendDialog = useOverlayState();
  const impersonateDialog = useOverlayState();

  const suspended = tenant.status === "suspended";

  return (
    <>
      {canImpersonate ? (
        <Button variant="primary" onPress={impersonateDialog.open}>
          <UserRoundCog className="size-4" /> Impersonate
        </Button>
      ) : null}
      <Button variant="outline" onPress={() => router.push(`/saas/tenants/${tenant.id}/edit`)}>
        <Pencil className="size-4" /> Edit
      </Button>
      <Button variant="danger" onPress={suspendDialog.open}>
        {suspended ? "Reactivate" : "Suspend"}
      </Button>

      <ConfirmDialog
        isOpen={suspendDialog.isOpen}
        onOpenChange={suspendDialog.setOpen}
        title={suspended ? `Reactivate ${tenant.name}?` : `Suspend ${tenant.name}?`}
        description={
          suspended
            ? "Members will regain access immediately."
            : "Members will lose access until the tenant is reactivated."
        }
        confirmLabel={suspended ? "Reactivate" : "Suspend"}
        destructive={!suspended}
        onConfirm={() => {
          toast.success(`${tenant.name} ${suspended ? "reactivated" : "suspended"}.`);
        }}
      />

      <ConfirmDialog
        isOpen={impersonateDialog.isOpen}
        onOpenChange={impersonateDialog.setOpen}
        title={`Impersonate ${tenant.name}?`}
        description={`You'll enter ${tenant.name}'s admin dashboard as their team. This action is recorded in the audit log.`}
        confirmLabel="Start session"
        onConfirm={() => {
          toast.success(`Now impersonating ${tenant.name}`);
          router.push(`/admin/${tenant.slug}/dashboard`);
        }}
      />
    </>
  );
}
