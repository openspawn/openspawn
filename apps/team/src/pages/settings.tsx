import { PageHeader } from "@openspawn/dashboard-ui";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your workspace" />

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <h3 className="text-lg font-semibold text-white mb-4">General</h3>
        <p className="text-sm text-white/40">Settings page — coming soon.</p>
      </div>
    </div>
  );
}
