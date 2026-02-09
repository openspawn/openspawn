import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckSquare,
  Coins,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
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
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { PhaseProgress } from "../components/phase-progress";
import { IdleAgentsWidget } from "../components/idle-agents-widget";
import { useAgents } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import { useCredits } from "../hooks/use-credits";
import { useEvents } from "../hooks/use-events";
import { useDemo, PROJECT_PHASES } from "../demo/DemoProvider";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function StatCard({ title, value, change, icon: Icon, description }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <motion.div 
          key={String(value)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="text-2xl font-bold"
        >
          {value}
        </motion.div>
        {change !== undefined && (
          <p className="flex items-center text-xs text-muted-foreground">
            {isPositive && (
              <>
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">+{change}%</span>
              </>
            )}
            {isNegative && (
              <>
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                <span className="text-red-500">{change}%</span>
              </>
            )}
            {!isPositive && !isNegative && <span>{change}%</span>}
            <span className="ml-1">from last week</span>
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function getEventIcon(type: string) {
  if (type.includes('agent')) return <Bot className="h-4 w-4 text-purple-500" />;
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

function formatEventTime(dateString: string) {
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
  const { agents } = useAgents();
  const { tasks } = useTasks();
  const { transactions } = useCredits();
  const { events } = useEvents();
  const { isDemo, scenario } = useDemo();

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
    { status: "To Do", count: tasks.filter(t => t.status?.toUpperCase() === "TODO").length, fill: "#fbbf24" },
    { status: "In Progress", count: tasks.filter(t => t.status?.toUpperCase() === "IN_PROGRESS").length, fill: "#a855f7" },
    { status: "Review", count: tasks.filter(t => t.status?.toUpperCase() === "REVIEW").length, fill: "#f97316" },
    { status: "Done", count: tasks.filter(t => t.status?.toUpperCase() === "DONE").length, fill: "#22c55e" },
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {isDemo && scenario === 'novatech' 
            ? 'NovaTech AI — Product Launch Lifecycle' 
            : 'Overview of your multi-agent system'}
        </p>
      </div>

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

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Agents"
          value={activeAgents}
          icon={Users}
          description={pendingAgents > 0 ? `+${pendingAgents} pending activation` : undefined}
        />
        <StatCard
          title="Tasks In Progress"
          value={inProgressTasks}
          icon={CheckSquare}
          description={`${tasks.filter(t => t.status === "review").length} in review`}
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          icon={TrendingUp}
          description={`${tasks.length} total tasks`}
        />
        <StatCard
          title="Credit Flow"
          value={`+${totalCreditsEarned.toLocaleString()}`}
          icon={Coins}
          description={`-${totalCreditsSpent.toLocaleString()} spent`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Credit flow chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Credit Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={creditHistory}>
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="period"
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earned"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#earned)"
                    isAnimationActive={true}
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spent)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tasks by status */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByStatus} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    horizontal={false}
                  />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis
                    type="category"
                    dataKey="status"
                    className="text-xs fill-muted-foreground"
                    width={85}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={true}
                    animationDuration={500}
                  >
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity + Idle Agents */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {events.slice(0, 8).map((event, index) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 30,
                    delay: index * 0.03
                  }}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                    >
                      {getEventIcon(event.type)}
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.actor?.name || "System"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {event.reasoning || event.type.replace(/\./g, ' → ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                      {event.type.split('.').pop()}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatEventTime(event.createdAt)}
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
        <IdleAgentsWidget maxCount={6} className="lg:col-span-1" />
      </div>
    </div>
  );
}
