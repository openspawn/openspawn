import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Coins, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { useCredits } from "../hooks/use-credits";

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatChartTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function CreditsPage() {
  const { transactions, loading, error } = useCredits();

  const totalEarned = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalEarned - totalSpent;

  // Compute balance history from transactions (sorted chronologically)
  const balanceHistory = useMemo(() => {
    if (transactions.length === 0) return [];
    
    // Sort transactions by time (oldest first)
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Build running balance - start from 0 and track cumulative
    let runningBalance = 0;
    const history = sorted.map((tx) => {
      runningBalance += tx.type === "CREDIT" ? tx.amount : -tx.amount;
      return {
        time: formatChartTime(tx.createdAt),
        balance: runningBalance,
        fullTime: tx.createdAt,
      };
    });
    
    // If we have many transactions, sample to avoid overcrowded x-axis
    if (history.length > 20) {
      const step = Math.ceil(history.length / 20);
      const sampled = history.filter((_, i) => i % step === 0);
      // Always include the last point
      if (sampled[sampled.length - 1] !== history[history.length - 1]) {
        sampled.push(history[history.length - 1]);
      }
      return sampled;
    }
    
    return history;
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading credit history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-destructive">Error loading credits</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
        <p className="text-muted-foreground">
          Track credit transactions and balances
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{netBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              +{totalEarned.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              -{totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and transactions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Balance chart */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {balanceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="time"
                      className="text-xs fill-muted-foreground"
                      interval="preserveStartEnd"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value: number) => [`${value.toLocaleString()} credits`, "Balance"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={balanceHistory.length < 15}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No transaction history yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Chart will appear as transactions occur</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction list */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {transactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 30,
                        delay: index * 0.02 // Stagger effect for initial load
                      }}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {tx.type === "CREDIT" ? (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1 }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10"
                          >
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1 }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10"
                          >
                            <ArrowDownLeft className="h-4 w-4 text-amber-500" />
                          </motion.div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{tx.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tx.createdAt)} at {formatTime(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`font-medium ${
                            tx.type === "CREDIT"
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }`}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}
                          {tx.amount.toLocaleString()}
                        </motion.p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {tx.balanceAfter.toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {transactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Coins className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
