import { Component, useMemo, useState, useEffect, useRef, useCallback, type ReactNode, type ErrorInfo } from "react";

class ChartErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[Chart Error]', error, info); }
  render() {
    if (this.state.hasError) return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Chart unavailable</div>;
    return this.props.children;
  }
}

/** Measures container dimensions without recharts' buggy ResponsiveContainer */
function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize((prev) =>
          prev.width === Math.round(width) && prev.height === Math.round(height)
            ? prev
            : { width: Math.round(width), height: Math.round(height) }
        );
      }
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
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
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
import { useDemo, PROJECT_PHASES } from "../demo/DemoProvider";

function getEventIcon(type: string) {
  if (type.includes('agent')) return <Bot className="h-4 w-4 text-violet-500" />;
  if (type.includes('task')) return <CheckSquare className="h-4 w-4 text-blue-500" />;
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

  const creditChartRef = useRef<HTMLDivElement>(null);
  const tasksChartRef = useRef<HTMLDivElement>(null);
  const creditChartSize = useContainerSize(creditChartRef);
  const tasksChartSize = useContainerSize(tasksChartRef);

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

  // Generate stable sparkline data (seeded by agent/task counts)
  const sparklines = useMemo(() => ({
    agents: generateSparklineData(7, "up"),
    tasks: generateSparklineData(7, "up"),
    completed: generateSparklineData(7, "up"),
    credits: generateSparklineData(7, "stable"),
  }), []);

  const activeAgents = agents.filter((a) => a.status?.toUpperCase() === "ACTIVE").length;
  const pendingAgents = agents.filter((a) => a.status?.toUpperCase() === "PENDING").length;
  const completedTasks = tasks.filter((t) => t.status?.toUpperCase() === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status?.toUpperCase() === "IN_PROGRESS").length;

  const totalCreditsEarned = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCreditsSpent = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0);

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
              description={`${tasks.filter(t => t.status === "review").length} in review`}
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
  }, [activeAgents, pendingAgents, inProgressTasks, completedTasks, tasks, totalCreditsEarned, totalCreditsSpent, sparklines, navigate, displayEvents, creditHistory, tasksByStatus, events, isHighSpeed, speed]);

  function renderCreditChart() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Credit Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={creditChartRef} className="h-[220px] sm:h-[300px]">
            <ChartErrorBoundary>
              {creditChartSize.width > 0 && creditChartSize.height > 0 && (
              <AreaChart data={creditHistory} width={creditChartSize.width} height={creditChartSize.height}>
                <defs>
                  <linearGradient id="earned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Area type="monotone" dataKey="earned" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#earned)" isAnimationActive={true} />
                <Area type="monotone" dataKey="spent" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#spent)" isAnimationActive={true} />
              </AreaChart>
              )}
            </ChartErrorBoundary>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderTasksChart() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Tasks by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={tasksChartRef} className="h-[220px] sm:h-[300px]">
            <ChartErrorBoundary>
              {tasksChartSize.width > 0 && tasksChartSize.height > 0 && (
              <BarChart data={tasksByStatus} layout="vertical" width={tasksChartSize.width} height={tasksChartSize.height}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" className="text-xs fill-muted-foreground" />
                <YAxis type="category" dataKey="status" className="text-xs fill-muted-foreground" width={85} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={500}>
                  {tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
              )}
            </ChartErrorBoundary>
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
                  No activity yet. Start the simulation to see events.
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
          <DashboardToolbar
            editMode={layout.editMode}
            setEditMode={layout.setEditMode}
            widgets={layout.widgets}
            toggleVisibility={layout.toggleVisibility}
            applyPreset={layout.applyPreset}
            resetLayout={layout.resetLayout}
          />
        }
      />

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
