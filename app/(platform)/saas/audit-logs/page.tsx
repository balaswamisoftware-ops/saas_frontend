"use client";

import { Chip, PageHeader, RefreshButton, SectionCard, DataTable, type Column } from "@/components/ui";
import { useAuditLogs, type AuditLogEntry } from "@/hooks/useAuditLogs";
import { formatDateTime } from "@/lib/format";
import { humanize } from "@/lib/utils";

const columns: Column<AuditLogEntry>[] = [
  { key: "action", label: "Action", isRowHeader: true, render: (l) => (
      <Chip size="sm" variant="soft" color="default">
        {humanize(l.action)}
      </Chip>
    ) },
  { key: "targetLabel", label: "Target", render: (l) => <span className="font-medium">{l.targetLabel ?? "—"}</span> },
  { key: "actorName", label: "Actor", render: (l) => l.actorName },
  { key: "module", label: "Module", render: (l) => l.module },
  { key: "createdAt", label: "When", render: (l) => formatDateTime(l.createdAt) },
];

export default function AuditLogsPage() {
  const { logs } = useAuditLogs();

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="A trail of important platform events."
        actions={<RefreshButton />}
      />
      <SectionCard flush>
        <DataTable aria-label="Audit logs" columns={columns} rows={logs} getRowKey={(l) => l.id} />
      </SectionCard>
    </div>
  );
}
