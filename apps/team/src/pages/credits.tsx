import { useMemo, useState, useCallback } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  PageHeader,
  EmptyState,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
  Input,
  Label,
  Dialog,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@openspawn/dashboard-ui";
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Hash,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  useCreditStats,
  useCreditsByAgent,
  useSpendingTrends,
  useAgents,
} from "../hooks";
import {
  useRestCredits,
  useSetBudget,
} from "@openspawn/dashboard-data";

/* ── Helpers ────────────────────────────────────────────────────── */

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCredits(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

/* ── Spending Trend Chart (SVG) ─────────────────────────────────── */

function SpendingTrendChart({
  data,
}: {
  data: { date: string; amount: number }[];
}) {
  const { linePath, areaPath, points, yLabels } = useMemo(() => {
    if (!data.length)
      return { linePath: "", areaPath: "", points: [], yLabels: [] };

    const amounts = data.map((d) => d.amount);
    const max = Math.max(...amounts, 1);
    const min = 0;
    const range = max - min || 1;

    const padX = 48;
    const padY = 20;
    const padBottom = 40;
    const w = 800 - padX * 2;
    const h = 300 - padY - padBottom;

    const pts = data.map((d, i) => ({
      x: padX + (data.length > 1 ? (i / (data.length - 1)) * w : w / 2),
      y: padY + h - ((d.amount - min) / range) * h,
      date: d.date,
      amount: d.amount,
    }));

    let line = "";
    let area = "";
    if (pts.length >= 2) {
      line = `M${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const cx = (pts[i - 1].x + pts[i].x) / 2;
        line += `C${cx},${pts[i - 1].y},${cx},${pts[i].y},${pts[i].x},${pts[i].y}`;
      }
      area = line + `L${pts[pts.length - 1].x},${padY + h}L${pts[0].x},${padY + h}Z`;
    }

    const steps = 4;
    const labels = Array.from({ length: steps + 1 }, (_, i) => {
      const val = min + (range / steps) * i;
      return {
        value: val,
        y: padY + h - (i / steps) * h,
      };
    });

    return { linePath: line, areaPath: area, points: pts, yLabels: labels };
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-white/30 text-sm">
        No spending data yet
      </div>
    );
  }

  return (
    <svg viewBox="0 0 800 300" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trend-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
        </linearGradient>
      </defs>

      {yLabels.map((l, i) => (
        <g key={i}>
          <line
            x1={48}
            x2={752}
            y1={l.y}
            y2={l.y}
            stroke="currentColor"
            className="text-white/5"
            strokeDasharray="4 4"
          />
          <text x={42} y={l.y + 4} textAnchor="end" className="fill-white/30" fontSize={10}>
            {formatCredits(l.value)}
          </text>
        </g>
      ))}

      {areaPath && <path d={areaPath} fill="url(#trend-area-grad)" />}
      {linePath && (
        <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth={2} strokeLinecap="round" />
      )}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#06b6d4" opacity={0.8} />
      ))}
      {points
        .filter((_, i) => {
          const step = Math.max(1, Math.floor(points.length / 7));
          return i % step === 0 || i === points.length - 1;
        })
        .map((p, i) => (
          <text key={i} x={p.x} y={285} textAnchor="middle" className="fill-white/30" fontSize={10}>
            {formatDate(p.date)}
          </text>
        ))}
    </svg>
  );
}

/* ── Budget Modal ───────────────────────────────────────────────── */

function SetBudgetModal({
  agentId,
  agentName,
  currentLimit,
  open,
  onOpenChange,
}: {
  agentId: string;
  agentName: string;
  currentLimit: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [limit, setLimit] = useState(currentLimit?.toString() ?? "");
  const setBudget = useSetBudget(agentId);

  const handleSubmit = useCallback(() => {
    const value = limit ? parseFloat(limit) : null;
    setBudget.mutate(
      { budget_period_limit: value, reset_current_period: false },
      { onSuccess: () => onOpenChange(false) },
    );
  }, [limit, setBudget, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle>Set Budget — {agentName}</DialogTitle>
            <DialogDescription>
              Set a per-period spending limit for this agent. Leave empty to remove the limit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="budget-limit">Period Limit (credits)</Label>
              <Input
                id="budget-limit"
                type="number"
                placeholder="No limit"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min={0}
                step={100}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={setBudget.isPending}>
                {setBudget.isPending ? "Saving..." : "Save Budget"}
              </Button>
            </div>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */

const PAGE_SIZE = 20;

export function CreditsPage() {
  const search = useSearch({ from: "/layout/credits" as never });
  const navigate = useNavigate();

  const agentFilter = (search as { agent?: string }).agent;
  const typeFilter = (search as { type?: string }).type;
  const page = (search as { page?: number }).page ?? 0;

  // Data hooks
  const { stats, loading: statsLoading } = useCreditStats();
  const { trends, loading: trendsLoading } = useSpendingTrends(30);
  const { agents: agentSpending, loading: agentSpendingLoading } = useCreditsByAgent();
  const agentsQuery = useAgents();
  const agents = useMemo(() => {
    const raw = agentsQuery.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if ("data" in raw && Array.isArray((raw as { data?: unknown }).data))
      return (raw as { data: unknown[] }).data;
    return [];
  }, [agentsQuery.data]) as {
    id: string;
    agent_id: string;
    name: string;
    budget_period_limit: number | null;
    budget_period_spent: number;
  }[];

  const historyQuery = useRestCredits({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });

  const transactions = useMemo(() => {
    const raw = historyQuery.data;
    if (!raw) return [];
    if ("data" in raw && Array.isArray((raw as { data?: unknown }).data))
      return (raw as { data: unknown[] }).data as {
        id: string;
        agent_id: string;
        type: string;
        amount: number;
        balance_after: number;
        reason: string;
        created_at: string;
      }[];
    return [];
  }, [historyQuery.data]);

  const totalTransactions = useMemo(() => {
    const raw = historyQuery.data;
    if (raw && "meta" in raw) return (raw as { meta?: { total?: number } }).meta?.total ?? 0;
    return 0;
  }, [historyQuery.data]);

  // Client-side filters (API doesn't support agent/type query params)
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (agentFilter) list = list.filter((tx) => tx.agent_id === agentFilter);
    if (typeFilter) list = list.filter((tx) => tx.type === typeFilter);
    return list;
  }, [transactions, agentFilter, typeFilter]);

  const agentMap = useMemo(() => {
    const map = new Map<string, string>();
    agents.forEach((a) => map.set(a.id, a.name));
    (agentSpending as { agent_id: string; name: string }[]).forEach((a) =>
      map.set(a.agent_id, a.name),
    );
    return map;
  }, [agents, agentSpending]);

  const [budgetModal, setBudgetModal] = useState<{
    agentId: string;
    agentName: string;
    currentLimit: number | null;
  } | null>(null);

  const totalPages = Math.ceil(totalTransactions / PAGE_SIZE);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          [key]: value,
          ...(key !== "page" ? { page: 0 } : {}),
        }),
      });
    },
    [navigate],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credits & Spending"
        description="Monitor credit usage, spending trends, and manage agent budgets"
      />

      {/* ── Summary Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Net Balance"
          value={stats ? formatCredits(stats.net) : "—"}
          icon={Coins}
          description={statsLoading ? "Loading..." : undefined}
          sparklineData={
            trends.length > 0
              ? (trends as { amount: number }[]).map((t) => t.amount)
              : undefined
          }
          sparklineColor="#06b6d4"
        />
        <StatCard
          title="Total Spent"
          value={stats ? formatCredits(stats.total_debits) : "—"}
          icon={TrendingDown}
          sparklineColor="#f43f5e"
        />
        <StatCard
          title="Total Earned"
          value={stats ? formatCredits(stats.total_credits) : "—"}
          icon={TrendingUp}
          sparklineColor="#10b981"
        />
        <StatCard
          title="Transactions"
          value={stats ? stats.transaction_count.toLocaleString() : "—"}
          icon={Hash}
        />
      </div>

      {/* ── Spending Trend Chart ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Spending Trend (30 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {trendsLoading ? (
            <div className="flex items-center justify-center h-[300px] text-white/30 text-sm">
              Loading trends...
            </div>
          ) : (
            <SpendingTrendChart data={trends as { date: string; amount: number }[]} />
          )}
        </CardContent>
      </Card>

      {/* ── Per-Agent Spending Table ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Spending by Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentSpendingLoading ? (
            <div className="text-white/30 text-sm py-8 text-center">Loading...</div>
          ) : (agentSpending as { agent_id: string }[]).length === 0 ? (
            <EmptyState
              title="No agent spending"
              description="Spending data will appear when agents start working."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="text-left py-2 px-3 font-medium">Agent</th>
                    <th className="text-right py-2 px-3 font-medium">Total Spent</th>
                    <th className="text-right py-2 px-3 font-medium hidden sm:table-cell">
                      Transactions
                    </th>
                    <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Budget</th>
                    <th className="text-right py-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    agentSpending as {
                      agent_id: string;
                      name: string;
                      total_spent: number;
                      transaction_count: number;
                    }[]
                  ).map((agent) => {
                    const agentInfo = agents.find(
                      (a) => a.id === agent.agent_id || a.agent_id === agent.agent_id,
                    );
                    const budgetLimit = agentInfo?.budget_period_limit ?? null;
                    const budgetSpent = agentInfo?.budget_period_spent ?? 0;
                    const budgetPct =
                      budgetLimit && budgetLimit > 0
                        ? Math.min(100, (budgetSpent / budgetLimit) * 100)
                        : null;

                    return (
                      <tr
                        key={agent.agent_id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() =>
                          setFilter(
                            "agent",
                            agentFilter === agent.agent_id ? undefined : agent.agent_id,
                          )
                        }
                      >
                        <td className="py-3 px-3">
                          <span className="font-medium text-white">{agent.name}</span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-red-400">
                          {formatCredits(agent.total_spent)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-white/60 hidden sm:table-cell">
                          {agent.transaction_count}
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          {budgetLimit !== null ? (
                            <div className="flex items-center gap-2 min-w-[140px]">
                              <Progress value={budgetPct ?? 0} className="h-1.5 flex-1" />
                              <span className="text-xs text-white/40 tabular-nums whitespace-nowrap">
                                {formatCredits(budgetSpent)}/{formatCredits(budgetLimit)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-white/20 text-xs">No limit</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBudgetModal({
                                agentId: agentInfo?.id ?? agent.agent_id,
                                agentName: agent.name,
                                currentLimit: budgetLimit,
                              });
                            }}
                          >
                            Set Budget
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Transaction Log ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transaction Log
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-white/30" />
              <select
                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/70 outline-none"
                value={agentFilter ?? ""}
                onChange={(e) => setFilter("agent", e.target.value || undefined)}
              >
                <option value="">All agents</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <select
                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/70 outline-none"
                value={typeFilter ?? ""}
                onChange={(e) => setFilter("type", e.target.value || undefined)}
              >
                <option value="">All types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              {(agentFilter || typeFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() =>
                    navigate({ search: { agent: undefined, type: undefined, page: 0 } })
                  }
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="text-white/30 text-sm py-8 text-center">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Credits will appear when agents start working."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40">
                      <th className="text-left py-2 px-3 font-medium">Date</th>
                      <th className="text-left py-2 px-3 font-medium hidden sm:table-cell">
                        Agent
                      </th>
                      <th className="text-left py-2 px-3 font-medium">Type</th>
                      <th className="text-right py-2 px-3 font-medium">Amount</th>
                      <th className="text-left py-2 px-3 font-medium hidden md:table-cell">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-2.5 px-3 text-white/60 whitespace-nowrap text-xs">
                          {formatDateTime(tx.created_at)}
                        </td>
                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <span className="text-white/80 text-xs">
                            {agentMap.get(tx.agent_id) ?? tx.agent_id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={tx.type === "credit" ? "success" : "destructive"}
                            className="text-xs"
                          >
                            {tx.type}
                          </Badge>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                            tx.type === "credit" ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {formatCredits(Math.abs(tx.amount))}
                        </td>
                        <td className="py-2.5 px-3 hidden md:table-cell">
                          <span className="text-white/40 text-xs truncate max-w-[200px] block">
                            {tx.reason || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                  <span className="text-xs text-white/30">
                    Page {page + 1} of {totalPages} · {totalTransactions} total
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={!hasPrevPage}
                      onClick={() => setFilter("page", String(page - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={!hasNextPage}
                      onClick={() => setFilter("page", String(page + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Budget Modal ─────────────────────────────────────── */}
      {budgetModal && (
        <SetBudgetModal
          agentId={budgetModal.agentId}
          agentName={budgetModal.agentName}
          currentLimit={budgetModal.currentLimit}
          open={!!budgetModal}
          onOpenChange={(open) => {
            if (!open) setBudgetModal(null);
          }}
        />
      )}
    </div>
  );
}
