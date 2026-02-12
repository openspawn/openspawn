import { useMemo, useState, useEffect, useRef, useCallback, type ReactNode } from "react";

/** Stable container size hook — avoids recharts ResponsiveContainer infinite loop */
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
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckSquare,
  Coins,
  TrendingUp,
  Activity,
  Bot,
  Zap,
  Clock,
  AlertTriangle,
  Layers,
  CheckCircle,
} from "lucide-react";
// recharts v3 has infinite-loop bug in ChartDataContextProvider — using custom SVG charts instead
import { StaggerContainer, StaggerItem } from "../components/stagger";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { generateSparklineData } from "../components/ui/sparkline";
import { StatCard } from "../components/ui/stat-card";
import { PageHeader } from "../components/ui/page-header";
import { PhaseProgress } from "../components/phase-progress";
import { IdleAgentsWidget } from "../components/idle-agents-widget";
import { TeamStatsCards } from "../components/team-stats-cards";
import { DashboardGrid, DashboardToolbar, useDashboardLayout } from "../components/dashboard-grid";
import { useAgents } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import { useCredits } from "../hooks/use-credits";
import { useEvents } from "../hooks/use-events";
import { EmptyState } from "../components/ui/empty-state";
import { useDemo, PROJECT_PHASES } from "../demo/DemoProvider";
import { useSparklines } from "../hooks/use-sandbox-metrics";
import { useACPMetrics } from "../hooks/use-acp-metrics";
import { isSandboxMode } from "../graphql/fetcher";
import { SandboxControls } from "../components/sandbox-controls";
// SandboxCommandBar rendered in layout.tsx (not here to avoid duplicate)

function getEventIcon(type: string) {
  if (type.includes('agent')) return <Bot className="h-4 w-4 text-violet-500" />;
  if (type.includes('task')) return <CheckSquare className="h-4 w-4 text-cyan-500" />;
  if (type.includes('credit')) return <Coins className="h-4 w-4 text-amber-500" />;
  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

function getEventBadgeVariant(type: string) {
  if (type.includes('created') || type.includes('activated')) return "success";
  if (type.includes('completed')) return "info";
  if (type.includes('earned')) return "success";
  if (type.includes('spent')) return "warning";
  return "secondary";
}

function formatEventTime(dateString: string, index?: number, speed?: number) {
  // At high speeds, timestamps cluster as "Just now" — show order instead
  if (speed && speed > 1 && index !== undefined) {
    if (index === 0) return "Latest";
    return `#${index + 1}`;
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { agents } = useAgents();
  const { tasks } = useTasks();
  const { transactions } = useCredits();
  const { events } = useEvents();
  const { isDemo, scenario, speed } = useDemo();
  const layout = useDashboardLayout();
  const { data: acpMetrics } = useACPMetrics();

  const creditChartRef = useRef<HTMLDivElement>(null);
  const creditChartSize = useStableSize(creditChartRef);

  // Debounced events: at high speeds, batch updates to avoid render thrashing
  const [displayEvents, setDisplayEvents] = useState(events);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHighSpeed = speed > 1;
  
  useEffect(() => {
    if (!isHighSpeed) {
      // Normal speed: update immediately
      setDisplayEvents(events);
      return;
    }
    // High speed: debounce updates (~200ms)
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(() => {
      setDisplayEvents(events);
    }, 200);
    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, [events, isHighSpeed]);

  // Determine current phase based on task progress (for NovaTech scenario)
  const currentPhase = useMemo(() => {
    if (scenario !== 'novatech') return 'development';
    
    // Count completed tasks per phase (based on task identifiers)
    const taskPhases = {
      discovery: ['NT-001', 'NT-002', 'NT-003'],
      definition: ['NT-004', 'NT-005', 'NT-006', 'NT-007'],
      development: ['NT-008', 'NT-009', 'NT-010', 'NT-011', 'NT-012', 'NT-013'],
      'go-to-market': ['NT-014', 'NT-015', 'NT-016', 'NT-017', 'NT-018'],
      launch: ['NT-019', 'NT-020', 'NT-021'],
      growth: ['NT-022', 'NT-023', 'NT-024'],
    };

    const phases = ['discovery', 'definition', 'development', 'go-to-market', 'launch', 'growth'];
    
    for (const phase of phases) {
      const phaseTasks = taskPhases[phase as keyof typeof taskPhases] || [];
      const completedCount = phaseTasks.filter(id => 
        tasks.find(t => t.identifier === id && t.status?.toUpperCase() === 'DONE')
      ).length;
      
      // If any task in this phase is not done, this is the current phase
      if (completedCount < phaseTasks.length) {
        return phase;
      }
    }
    
    return 'growth'; // All done
  }, [tasks, scenario]);

  // Use real metrics from sandbox API when available, otherwise generate mock data
  const sandboxSparklines = useSparklines();
  const sparklines = useMemo(() => {
    if (sandboxSparklines) return sandboxSparklines;
    return {
      agents: generateSparklineData(7, "up"),
      tasks: generateSparklineData(7, "up"),
      completed: generateSparklineData(7, "up"),
      credits: generateSparklineData(7, "stable"),
    };
  }, [sandboxSparklines]);

  const activeAgents = useMemo(() => agents.filter((a) => a.status?.toUpperCase() === "ACTIVE").length, [agents]);
  const pendingAgents = useMemo(() => agents.filter((a) => a.status?.toUpperCase() === "PENDING").length, [agents]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status?.toUpperCase() === "DONE").length, [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status?.toUpperCase() === "IN_PROGRESS").length, [tasks]);
  const reviewTasks = useMemo(() => tasks.filter(t => t.status === "review").length, [tasks]);

  const totalCreditsEarned = useMemo(() => transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);
  
  const totalCreditsSpent = useMemo(() => transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  // Real task status counts from simulation (normalized to uppercase)
  const tasksByStatus = useMemo(() => [
    { status: "Backlog", count: tasks.filter(t => t.status?.toUpperCase() === "BACKLOG").length, fill: "#64748b" },
    { status: "To Do", count: tasks.filter(t => t.status?.toUpperCase() === "TODO").length, fill: "#f59e0b" },
    { status: "In Progress", count: tasks.filter(t => t.status?.toUpperCase() === "IN_PROGRESS").length, fill: "#06b6d4" },
    { status: "Review", count: tasks.filter(t => t.status?.toUpperCase() === "REVIEW").length, fill: "#8b5cf6" },
    { status: "Done", count: tasks.filter(t => t.status?.toUpperCase() === "DONE").length, fill: "#10b981" },
  ], [tasks]);

  // Real credit flow - aggregate last N transactions into buckets
  const creditHistory = useMemo(() => {
    // Group transactions into time buckets (last 10 "periods")
    const bucketCount = 8;
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    if (sortedTx.length === 0) {
      return Array.from({ length: bucketCount }, (_, i) => ({
        period: `T${i + 1}`,
        earned: 0,
        spent: 0,
      }));
    }
    
    const txPerBucket = Math.max(1, Math.ceil(sortedTx.length / bucketCount));
    const buckets: { period: string; earned: number; spent: number }[] = [];
    
    for (let i = 0; i < bucketCount; i++) {
      const start = i * txPerBucket;
      const end = Math.min(start + txPerBucket, sortedTx.length);
      const bucketTx = sortedTx.slice(start, end);
      
      buckets.push({
        period: `T${i + 1}`,
        earned: bucketTx
          .filter(t => t.type === "CREDIT")
          .reduce((sum, t) => sum + t.amount, 0),
        spent: bucketTx
          .filter(t => t.type === "DEBIT")
          .reduce((sum, t) => sum + t.amount, 0),
      });
    }
    
    return buckets;
  }, [transactions]);

  // Widget render map
  const renderWidget = useCallback((id: string) => {
    switch (id) {
      case "stats-overview":
        return (
          <StaggerContainer className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem><StatCard
              title="Active Agents"
              value={activeAgents}
              icon={Users}
              description={pendingAgents > 0 ? `+${pendingAgents} pending activation` : undefined}
              sparklineData={sparklines.agents}
              sparklineColor="#06b6d4"
            /></StaggerItem>
            <StaggerItem><StatCard
              title="Tasks In Progress"
              value={inProgressTasks}
              icon={CheckSquare}
              description={`${reviewTasks} in review`}
              sparklineData={sparklines.tasks}
              sparklineColor="#06b6d4"
            /></StaggerItem>
            <StaggerItem><StatCard
              title="Completed Tasks"
              value={completedTasks}
              icon={TrendingUp}
              description={`${tasks.length} total tasks`}
              sparklineData={sparklines.completed}
              sparklineColor="#10b981"
            /></StaggerItem>
            <StaggerItem><StatCard
              title="Credit Flow"
              value={`+${totalCreditsEarned.toLocaleString()}`}
              icon={Coins}
              description={`-${totalCreditsSpent.toLocaleString()} spent`}
              sparklineData={sparklines.credits}
              sparklineColor="#f59e0b"
            /></StaggerItem>
          </StaggerContainer>
        );
      case "teams-overview":
        return (
          <TeamStatsCards
            onTeamClick={(teamId) => navigate(`/agents?tab=teams&team=${teamId}`)}
          />
        );
      case "credit-flow-chart":
        return renderCreditChart();
      case "tasks-by-status":
        return renderTasksChart();
      case "recent-activity":
        return renderRecentActivity();
      case "available-agents":
        return (
          <IdleAgentsWidget
            maxCount={6}
            onAgentClick={(agent) => navigate(`/agents?selected=${agent.agentId}`)}
          />
        );
      default:
        return null;
    }
  }, [activeAgents, pendingAgents, inProgressTasks, completedTasks, reviewTasks, tasks.length, totalCreditsEarned, totalCreditsSpent, sparklines, navigate]);

  function renderCreditChart() {
    const maxVal = Math.max(...creditHistory.map(d => Math.max(d.earned ?? 0, d.spent ?? 0)), 1);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Credit Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={creditChartRef} className="h-[220px] sm:h-[300px]">
            {creditChartSize.width > 0 && (
              <svg width={creditChartSize.width} height={creditChartSize.height} className="overflow-visible">
                <defs>
                  <linearGradient id="earnedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                {/* Area fills */}
                {creditHistory.length > 1 && (
                  <>
                    <path
                      d={creditHistory.map((d, i) => {
                        const x = (i / (creditHistory.length - 1)) * (creditChartSize.width - 40) + 20;
                        const y = creditChartSize.height - 30 - ((d.earned ?? 0) / maxVal) * (creditChartSize.height - 50);
                        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                      }).join(' ') + ` L${creditChartSize.width - 20},${creditChartSize.height - 30} L20,${creditChartSize.height - 30} Z`}
                      fill="url(#earnedGrad)"
                    />
                    <path
                      d={creditHistory.map((d, i) => {
                        const x = (i / (creditHistory.length - 1)) * (creditChartSize.width - 40) + 20;
                        const y = creditChartSize.height - 30 - ((d.spent ?? 0) / maxVal) * (creditChartSize.height - 50);
                        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                      }).join(' ') + ` L${creditChartSize.width - 20},${creditChartSize.height - 30} L20,${creditChartSize.height - 30} Z`}
                      fill="url(#spentGrad)"
                    />
                    {/* Lines */}
                    <path
                      d={creditHistory.map((d, i) => {
                        const x = (i / (creditHistory.length - 1)) * (creditChartSize.width - 40) + 20;
                        const y = creditChartSize.height - 30 - ((d.earned ?? 0) / maxVal) * (creditChartSize.height - 50);
                        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                      }).join(' ')}
                      fill="none" stroke="#10b981" strokeWidth={2}
                    />
                    <path
                      d={creditHistory.map((d, i) => {
                        const x = (i / (creditHistory.length - 1)) * (creditChartSize.width - 40) + 20;
                        const y = creditChartSize.height - 30 - ((d.spent ?? 0) / maxVal) * (creditChartSize.height - 50);
                        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                      }).join(' ')}
                      fill="none" stroke="#f59e0b" strokeWidth={2}
                    />
                  </>
                )}
                {/* X axis labels */}
                {creditHistory.map((d, i) => {
                  const x = creditHistory.length > 1 ? (i / (creditHistory.length - 1)) * (creditChartSize.width - 40) + 20 : creditChartSize.width / 2;
                  return i % Math.max(1, Math.floor(creditHistory.length / 6)) === 0 ? (
                    <text key={i} x={x} y={creditChartSize.height - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">{d.period}</text>
                  ) : null;
                })}
                {/* Legend */}
                <circle cx={creditChartSize.width - 120} cy={12} r={4} fill="#10b981" />
                <text x={creditChartSize.width - 112} y={16} className="fill-muted-foreground text-[11px]">Earned</text>
                <circle cx={creditChartSize.width - 60} cy={12} r={4} fill="#f59e0b" />
                <text x={creditChartSize.width - 52} y={16} className="fill-muted-foreground text-[11px]">Spent</text>
              </svg>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderTasksChart() {
    const maxCount = Math.max(...tasksByStatus.map(d => d.count), 1);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Tasks by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasksByStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24 text-right shrink-0">{item.status}</span>
                <div className="flex-1 h-8 bg-muted/30 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 8 : 0)}%`,
                      backgroundColor: item.fill,
                    }}
                  />
                </div>
                <span className="text-sm font-mono w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderRecentActivity() {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
            <Link
              to="/events"
              className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors whitespace-nowrap"
            >
              See all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {displayEvents.slice(0, 8).map((event, index) => (
                <motion.div
                  key={event.id}
                  layout={!isHighSpeed}
                  initial={isHighSpeed ? false : { opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={isHighSpeed
                    ? { duration: 0.15 }
                    : { type: "spring", stiffness: 400, damping: 30, delay: index * 0.03 }
                  }
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors min-h-[44px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{getEventIcon(event.type)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.actor?.name || "System"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                        {event.reasoning || event.type.replace(/\./g, ' → ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pl-7 sm:pl-0">
                    <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                      {event.type.split('.').pop()}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatEventTime(event.createdAt, index, speed)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isSandboxMode ? "Waiting for agent activity..." : "No activity yet. Start the simulation to see events."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Dashboard"
        description={
          isDemo && scenario === 'novatech'
            ? 'NovaTech AI — Product Launch Lifecycle'
            : 'Overview of your multi-agent system'
        }
        actions={
          !isSandboxMode ? (
          <DashboardToolbar
            editMode={layout.editMode}
            setEditMode={layout.setEditMode}
            widgets={layout.widgets}
            toggleVisibility={layout.toggleVisibility}
            applyPreset={layout.applyPreset}
            resetLayout={layout.resetLayout}
          />
          ) : undefined
        }
      />

      {/* Sandbox controls + command bar */}
      <SandboxControls />

      {/* ACP Metrics (sandbox mode only) */}
      {isSandboxMode && acpMetrics && (() => {
        const escColor = acpMetrics.escalationRate < 0.1
          ? "#10b981"
          : acpMetrics.escalationRate < 0.3
            ? "#f59e0b"
            : "#ef4444";
        const escLabel = acpMetrics.escalationRate < 0.1
          ? "Healthy"
          : acpMetrics.escalationRate < 0.3
            ? "Elevated"
            : "High";
        return (
          <StaggerContainer className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem><StatCard
              title="Ack Latency"
              value={`${acpMetrics.ackLatencyMs}ms`}
              icon={Clock}
              description={`${acpMetrics.totalAcks} acks received`}
              sparklineColor="#06b6d4"
            /></StaggerItem>
            <StaggerItem><StatCard
              title="Escalation Rate"
              value={`${Math.round(acpMetrics.escalationRate * 100)}%`}
              icon={AlertTriangle}
              description={`${escLabel} · ${acpMetrics.totalEscalations} escalations`}
              sparklineColor={escColor}
            /></StaggerItem>
            <StaggerItem><StatCard
              title="Avg Delegation Depth"
              value={acpMetrics.avgDelegationDepth.toFixed(1)}
              icon={Layers}
              description={`${acpMetrics.totalDelegations} total delegations`}
              sparklineColor="#8b5cf6"
            /></StaggerItem>
            <StaggerItem><StatCard
              title="Completion Rate"
              value={`${Math.round(acpMetrics.completionRate * 100)}%`}
              icon={CheckCircle}
              description={`${acpMetrics.totalCompletions} completed`}
              sparklineColor="#10b981"
            /></StaggerItem>
          </StaggerContainer>
        );
      })()}

      {/* Phase Progress (NovaTech scenario only) */}
      {isDemo && scenario === 'novatech' && PROJECT_PHASES && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              🚀 Project Progress
              <Badge variant="outline" className="ml-auto">Dashboard v2.0 Launch</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhaseProgress 
              phases={PROJECT_PHASES} 
              currentPhase={currentPhase}
            />
          </CardContent>
        </Card>
      )}

      {/* Customizable widget grid */}
      <DashboardGrid
        widgets={layout.widgets}
        editMode={layout.editMode}
        reorder={layout.reorder}
        renderWidget={renderWidget}
      />
    </div>
  );
}
