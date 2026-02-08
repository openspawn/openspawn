import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckSquare,
  Coins,
  Clock,
  Target,
  Zap,
  Award,
  BarChart3,
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useAgents } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import { useCredits } from "../hooks/use-credits";
import { useEvents } from "../hooks/use-events";

const COLORS = ["#22c55e", "#a855f7", "#f97316", "#06b6d4", "#fbbf24", "#ef4444"];

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}

function MetricCard({ title, value, change, changeLabel, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
            <span className={trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"}>
              {change > 0 ? "+" : ""}{change}%
            </span>
            <span className="text-muted-foreground">{changeLabel || "vs last period"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const { agents } = useAgents();
  const { tasks } = useTasks();
  const { transactions } = useCredits();
  const { events } = useEvents();

  // Calculate key metrics
  const activeAgents = agents.filter((a) => a.status?.toUpperCase() === "ACTIVE").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status?.toUpperCase() === "DONE").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalEarned = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalSpent = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0);

  // Credit flow over time (aggregate into periods)
  const creditTrend = useMemo(() => {
    const periods = 12;
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    if (sortedTx.length === 0) {
      return Array.from({ length: periods }, (_, i) => ({
        period: `P${i + 1}`,
        earned: 0,
        spent: 0,
        net: 0,
      }));
    }
    
    const txPerPeriod = Math.max(1, Math.ceil(sortedTx.length / periods));
    const result: { period: string; earned: number; spent: number; net: number }[] = [];
    
    for (let i = 0; i < periods; i++) {
      const start = i * txPerPeriod;
      const end = Math.min(start + txPerPeriod, sortedTx.length);
      const periodTx = sortedTx.slice(start, end);
      
      const earned = periodTx
        .filter((t) => t.type === "CREDIT")
        .reduce((sum, t) => sum + t.amount, 0);
      const spent = periodTx
        .filter((t) => t.type === "DEBIT")
        .reduce((sum, t) => sum + t.amount, 0);
      
      result.push({
        period: `P${i + 1}`,
        earned,
        spent,
        net: earned - spent,
      });
    }
    
    return result;
  }, [transactions]);

  // Agent performance by level
  const agentsByLevel = useMemo(() => {
    const levelCounts: Record<number, number> = {};
    for (const agent of agents) {
      levelCounts[agent.level] = (levelCounts[agent.level] || 0) + 1;
    }
    return Object.entries(levelCounts)
      .map(([level, count]) => ({
        level: `L${level}`,
        count,
        label: getLevelLabel(parseInt(level, 10)),
      }))
      .sort((a, b) => parseInt(a.level.slice(1), 10) - parseInt(b.level.slice(1), 10));
  }, [agents]);

  // Task status distribution
  const tasksByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
      BLOCKED: 0,
    };
    
    for (const task of tasks) {
      const status = task.status?.toUpperCase() || "BACKLOG";
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    }
    
    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.replace("_", " "),
        value: count,
      }));
  }, [tasks]);

  // Event activity over time
  const eventActivity = useMemo(() => {
    const periods = 10;
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    if (sortedEvents.length === 0) {
      return Array.from({ length: periods }, (_, i) => ({
        period: `T${i + 1}`,
        events: 0,
      }));
    }
    
    const eventsPerPeriod = Math.max(1, Math.ceil(sortedEvents.length / periods));
    const result: { period: string; events: number }[] = [];
    
    for (let i = 0; i < periods; i++) {
      const start = i * eventsPerPeriod;
      const end = Math.min(start + eventsPerPeriod, sortedEvents.length);
      result.push({
        period: `T${i + 1}`,
        events: end - start,
      });
    }
    
    return result;
  }, [events]);

  // Top performing agents (by trust score or task completion)
  const topAgents = useMemo(() => {
    return [...agents]
      .filter((a) => a.status?.toUpperCase() === "ACTIVE")
      .sort((a, b) => (b.trustScore || 50) - (a.trustScore || 50))
      .slice(0, 5)
      .map((agent) => ({
        name: agent.name,
        level: agent.level,
        trustScore: agent.trustScore || 50,
        tasksCompleted: agent.tasksCompleted || 0,
      }));
  }, [agents]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Performance metrics and trends across your agent organization
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Agents"
          value={activeAgents}
          icon={Users}
          change={12}
          trend="up"
        />
        <MetricCard
          title="Task Completion Rate"
          value={`${completionRate}%`}
          icon={Target}
          change={5}
          trend="up"
        />
        <MetricCard
          title="Total Credits Earned"
          value={totalEarned.toLocaleString()}
          icon={Coins}
          change={23}
          trend="up"
        />
        <MetricCard
          title="Total Credits Spent"
          value={totalSpent.toLocaleString()}
          icon={TrendingDown}
          change={-8}
          trend="down"
        />
      </div>

      {/* Credit flow chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Credit Flow Over Time
          </CardTitle>
          <CardDescription>
            Earned vs spent credits across time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={creditTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="earned"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                  name="Earned"
                />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Spent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agent distribution by level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent Distribution
            </CardTitle>
            <CardDescription>Agents by hierarchy level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentsByLevel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="level" type="category" className="text-xs" width={40} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value, name, props) => [value, props.payload.label]}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Task Status Breakdown
            </CardTitle>
            <CardDescription>Current distribution of tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {tasksByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Event Activity
          </CardTitle>
          <CardDescription>System activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eventActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: "#06b6d4" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top performing agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performing Agents
          </CardTitle>
          <CardDescription>Ranked by trust score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topAgents.map((agent, index) => (
              <div key={agent.name} className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{agent.name}</span>
                    <Badge variant="secondary">L{agent.level}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{agent.tasksCompleted} tasks</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={agent.trustScore} className="w-24 h-2" />
                  <span className="text-sm font-medium w-12 text-right">{agent.trustScore}%</span>
                </div>
              </div>
            ))}
            {topAgents.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No agents to display
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getLevelLabel(level: number): string {
  if (level >= 10) return "COO";
  if (level >= 9) return "HR";
  if (level >= 7) return "Manager";
  if (level >= 5) return "Senior";
  if (level >= 3) return "Worker";
  return "Probation";
}
