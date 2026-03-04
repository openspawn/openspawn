import { PageHeader } from "@openspawn/dashboard-ui";

export function NetworkPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Network" description="Agent network topology" />
      {/*
        Org chart — horizontal scroll on narrow screens.
        When the chart is implemented, wrap the SVG/canvas in this overflow-x-auto container
        so wide graphs stay scrollable instead of overflowing the viewport.
      */}
      <div className="overflow-x-auto">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 min-w-[320px]">
          <p className="text-sm text-white/40">Network visualization — coming soon.</p>
        </div>
      </div>
    </div>
  );
}
