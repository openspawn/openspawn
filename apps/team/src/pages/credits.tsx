import { Coins } from "lucide-react";
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
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="space-y-1">
                <div className="text-sm text-white">{tx.reason}</div>
                <div className="text-xs text-white/40">{new Date(tx.createdAt).toLocaleString()}</div>
              </div>
              <span className={tx.amount >= 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                {tx.amount >= 0 ? "+" : ""}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
