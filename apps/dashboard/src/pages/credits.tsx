import { useMemo, useRef, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Coins, TrendingUp } from "lucide-react";
// recharts v3 has infinite-loop bug — using custom SVG chart instead
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { generateSparklineData } from "../components/ui/sparkline";
import { StatCard } from "../components/ui/stat-card";
import { PageHeader } from "../components/ui/page-header";
// OceanGradients/ChartTooltip removed — using custom SVG chart
import { useCredits } from "../hooks/use-credits";
import { BudgetBurndown } from "../components/budget-burndown";
import { ModelUsageBreakdown } from "../components/model-usage";
import { AgentEfficiencyLeaderboard } from "../components/agent-efficiency";

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

function TransactionVirtualList({ transactions }: { transactions: ReturnType<typeof useCredits>["transactions"] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  if (transactions.length === 0) {
    return (
      <EmptyState
        variant="credits"
        title="No credit transactions"
        description="Credits track agent resource usage. Transactions appear as agents earn and spend."
        compact
      />
    );
  }

  return (
    <div ref={parentRef} className="h-[300px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const tx = transactions[virtualRow.index];
            return (
              <div
                key={tx.id}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 sm:p-3 min-h-[44px]"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {tx.type === "CREDIT" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-500/10 shrink-0"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-500/10 shrink-0"
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                    </motion.div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{tx.reason}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)} at {formatTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 min-w-[90px]">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm sm:text-base font-medium tabular-nums ${
                      tx.type === "CREDIT"
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }`}
                  >
                    {tx.type === "CREDIT" ? "+" : "-"}
                    {tx.amount.toLocaleString()}
                  </motion.p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                    Bal: {tx.balanceAfter.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function useStableSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize((prev) => (prev.width === Math.round(width) && prev.height === Math.round(height) ? prev : { width: Math.round(width), height: Math.round(height) }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export function CreditsPage() {
  const { transactions, loading, error } = useCredits();
  const balanceChartRef = useRef<HTMLDivElement>(null);
  const balanceChartSize = useStableSize(balanceChartRef);

  const totalEarned = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalEarned - totalSpent;

  // Sparkline data for credit stats
  const creditSparklines = useMemo(() => ({
    balance: generateSparklineData(7, "up"),
    earned: generateSparklineData(7, "up"),
    spent: generateSparklineData(7, "up"),
    burnRate: generateSparklineData(7, "down"),
  }), []);

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
      <PageHeader
        title="Credits"
        description="Track credit transactions and balances"
      />

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Net Balance"
          value={netBalance.toLocaleString()}
          icon={Coins}
          sparklineData={creditSparklines.balance}
          sparklineColor="#06b6d4"
        />
        <StatCard
          title="Total Earned"
          value={`+${totalEarned.toLocaleString()}`}
          icon={ArrowUpRight}
          sparklineData={creditSparklines.earned}
          sparklineColor="#10b981"
        />
        <StatCard
          title="Total Spent"
          value={`-${totalSpent.toLocaleString()}`}
          icon={ArrowDownLeft}
          sparklineData={creditSparklines.spent}
          sparklineColor="#f59e0b"
        />
        <StatCard
          title="Transactions"
          value={transactions.length}
          icon={TrendingUp}
          sparklineData={creditSparklines.burnRate}
          sparklineColor="#f43f5e"
        />
      </div>

      {/* Chart and transactions */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Balance chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Balance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={balanceChartRef} className="h-[220px] sm:h-[300px]">
              {balanceHistory.length > 0 && balanceChartSize.width > 0 ? (() => {
                const w = balanceChartSize.width;
                const h = balanceChartSize.height;
                const maxVal = Math.max(...balanceHistory.map((d: { balance?: number }) => d.balance ?? 0), 1);
                const minVal = Math.min(...balanceHistory.map((d: { balance?: number }) => d.balance ?? 0), 0);
                const range = maxVal - minVal || 1;
                const pad = { top: 20, right: 10, bottom: 30, left: 10 };
                const points = balanceHistory.map((d: { balance?: number }, i: number) => ({
                  x: pad.left + (i / Math.max(balanceHistory.length - 1, 1)) * (w - pad.left - pad.right),
                  y: pad.top + (1 - ((d.balance ?? 0) - minVal) / range) * (h - pad.top - pad.bottom),
                }));
                const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                const area = line + ` L${points[points.length - 1].x},${h - pad.bottom} L${points[0].x},${h - pad.bottom} Z`;
                return (
                  <svg width={w} height={h}>
                    <defs>
                      <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <path d={area} fill="url(#balGrad)" />
                    <path d={line} fill="none" stroke="#06b6d4" strokeWidth={2.5} />
                    {balanceHistory.map((d: { time?: string }, i: number) => (
                      i % Math.max(1, Math.floor(balanceHistory.length / 6)) === 0 ? (
                        <text key={i} x={points[i].x} y={h - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">{d.time}</text>
                      ) : null
                    ))}
                  </svg>
                );
              })() : (
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
            <TransactionVirtualList transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 mt-4 sm:mt-6">
        <BudgetBurndown
          budget={25000}
          spent={totalSpent || 9250}
          periodDays={30}
          daysElapsed={12}
        />
        <ModelUsageBreakdown />
      </div>

      <div className="mt-6">
        <AgentEfficiencyLeaderboard />
      </div>
    </div>
  );
}
