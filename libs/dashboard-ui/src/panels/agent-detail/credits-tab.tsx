import { TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Badge } from "../../ui/badge";
import type { AgentDetailAgent, AgentDetailTransaction } from "./types";

interface CreditsTabProps {
  agent: AgentDetailAgent;
  transactions: AgentDetailTransaction[];
  transactionsLoading?: boolean;
}

export function CreditsTab({ agent, transactions, transactionsLoading }: CreditsTabProps) {
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    return last7Days.map((date) => {
      const dayTransactions = transactions.filter((h) => h.createdAt.startsWith(date));
      const earned = dayTransactions
        .filter((h) => h.amount > 0)
        .reduce((sum, h) => sum + h.amount, 0);
      const spent = Math.abs(
        dayTransactions.filter((h) => h.amount < 0).reduce((sum, h) => sum + h.amount, 0),
      );

      return {
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        earned,
        spent,
      };
    });
  }, [transactions]);

  const totalEarned = transactions
    .filter((h) => h.amount > 0)
    .reduce((sum, h) => sum + h.amount, 0);
  const totalSpent = Math.abs(
    transactions.filter((h) => h.amount < 0).reduce((sum, h) => sum + h.amount, 0),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Balance Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
          <div className="text-2xl font-bold">{agent.currentBalance.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>Total Earned</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalEarned.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 mb-1">
            <TrendingDown className="h-4 w-4" />
            <span>Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {totalSpent.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <h3 className="text-sm font-medium mb-4">7-Day Activity</h3>
        <div className="w-full space-y-2" style={{ height: 200 }}>
          {chartData.map((d: { date: string; earned: number; spent: number }) => {
            const max = Math.max(
              ...chartData.map((x: { earned: number; spent: number }) =>
                Math.max(x.earned, x.spent),
              ),
              1,
            );
            return (
              <div key={d.date} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-muted-foreground shrink-0">{d.date}</span>
                <div className="flex-1 flex gap-1 h-5">
                  <div
                    className="bg-emerald-500 rounded-sm"
                    style={{ width: `${(d.earned / max) * 50}%` }}
                    title={`Earned: ${d.earned}`}
                  />
                  <div
                    className="bg-rose-500 rounded-sm"
                    style={{ width: `${(d.spent / max) * 50}%` }}
                    title={`Spent: ${d.spent}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-sm font-medium mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {transactionsLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
              No transaction history yet
            </div>
          ) : (
            transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        transaction.amount > 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toLocaleString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {transaction.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transaction.reason || "No description"}
                  </p>
                  {transaction.balanceAfter != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance: {transaction.balanceAfter.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
