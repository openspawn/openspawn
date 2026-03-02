import { PageHeader } from "@openspawn/dashboard-ui";

export function KanbanPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Kanban" description="Visual task management board" />
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <p className="text-sm text-white/40">Kanban board — coming soon.</p>
      </div>
    </div>
  );
}
