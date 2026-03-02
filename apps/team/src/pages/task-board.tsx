import { PageHeader } from "@openspawn/dashboard-ui";

export function TaskBoardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Task Board" description="Sprint planning and tracking" />
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <p className="text-sm text-white/40">Task board — coming soon.</p>
      </div>
    </div>
  );
}
