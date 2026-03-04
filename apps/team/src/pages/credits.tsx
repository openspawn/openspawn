import { PageHeader, EmptyState } from "@openspawn/dashboard-ui";
import { useCredits } from "../hooks";

export function CreditsPage() {
  const { transactions, loading } = useCredits();

  return (
    <div className="space-y-6">
      <PageHeader title="Credits" description="Credit usage and transactions" />

      {loading ? (
        <div className="text-white/40 text-sm">Loading credits...</div>
      ) : transactions.length === 0 ? (
        <EmptyState title="No transactions" description="Credit transactions will appear here." />
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
            >
              {/* Mobile: stacked; sm+: row */}
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-sm text-white truncate">{tx.reason}</div>
                  <div className="text-xs text-white/40">
                    {new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 self-start sm:self-center tabular-nums ${
                    tx.amount >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
