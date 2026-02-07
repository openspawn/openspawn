import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckSquare,
  Coins,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
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
import { useAgents } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import { useCredits } from "../hooks/use-credits";

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

export function DashboardPage() {
  const { agents } = useAgents();
  const { tasks } = useTasks();
  const { transactions } = useCredits();

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const pendingAgents = agents.filter((a) => a.status === "pending").length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;

  const totalCreditsEarned = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCreditsSpent = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0);

  // Real task status counts from simulation
  const tasksByStatus = useMemo(() => [
    { status: "Backlog", count: tasks.filter(t => t.status === "backlog").length, fill: "#64748b" },
    { status: "Pending", count: tasks.filter(t => t.status === "pending").length, fill: "#fbbf24" },
    { status: "Assigned", count: tasks.filter(t => t.status === "assigned").length, fill: "#3b82f6" },
    { status: "In Progress", count: tasks.filter(t => t.status === "in_progress").length, fill: "#a855f7" },
    { status: "Review", count: tasks.filter(t => t.status === "review").length, fill: "#f97316" },
    { status: "Done", count: tasks.filter(t => t.status === "done").length, fill: "#22c55e" },
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
          Overview of your multi-agent system
        </p>
      </div>

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

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {tasks.slice(0, 5).map((task, index) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 30,
                    delay: index * 0.05
                  }}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.identifier}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.status === "done"
                        ? "success"
                        : task.status === "in_progress"
                          ? "info"
                          : "secondary"
                    }
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
            {tasks.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No tasks yet. Create your first task to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
