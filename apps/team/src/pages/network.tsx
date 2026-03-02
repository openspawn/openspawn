import { PageHeader } from "@openspawn/dashboard-ui";

export function NetworkPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Network" description="Agent network topology" />
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <p className="text-sm text-white/40">Network visualization — coming soon.</p>
      </div>
    </div>
  );
}
