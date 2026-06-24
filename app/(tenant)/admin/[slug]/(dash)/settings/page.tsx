import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/common/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function TenantSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your organisation's workspace." />
      <SettingsForm scope="tenant" />
    </div>
  );
}
