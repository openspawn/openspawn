import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Calendar, Zap, MessageSquare, Settings, Activity, Award, Coins } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { AgentAvatar } from "./agent-avatar";
import { Progress } from "./ui/progress";
import { useAgents } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import { useCredits } from "../hooks/use-credits";
import { AgentStatus, TaskStatus } from "../graphql/generated/graphql";
import type { AgentFieldsFragment } from "../graphql/generated/graphql";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./ui/chart-tooltip";

type Agent = AgentFieldsFragment;

interface AgentDetailPanelProps {
  agentId: string | null;
  onClose: () => void;
}

// Level colors matching network page
const levelColors: Record<number, string> = {
  10: "#f472b6", // COO - pink
  9: "#a78bfa",  // HR - purple
  8: "#22c55e",  // Manager - green
  7: "#22c55e",
  6: "#06b6d4",  // Senior - cyan
  5: "#06b6d4",
  4: "#fbbf24",  // Worker - yellow
  3: "#fbbf24",
  2: "#71717a",  // Probation - gray
  1: "#71717a",
};

function getLevelColor(level: number): string {
  return levelColors[level] || "#71717a";
}

function getLevelLabel(level: number): string {
  if (level >= 10) return "COO";
  if (level >= 9) return "HR";
  if (level >= 7) return "Manager";
  if (level >= 5) return "Senior";
  if (level >= 3) return "Worker";
  return "Probation";
}

function getStatusVariant(status: AgentStatus): "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case AgentStatus.Active:
      return "success";
    case AgentStatus.Pending:
      return "warning";
    case AgentStatus.Suspended:
    case AgentStatus.Revoked:
      return "destructive";
    default:
      return "secondary";
  }
}

function getTaskStatusBadge(status: TaskStatus): { variant: "success" | "warning" | "destructive" | "secondary"; label: string } {
  switch (status) {
    case TaskStatus.Completed:
      return { variant: "success", label: "Completed" };
    case TaskStatus.InProgress:
      return { variant: "info", label: "In Progress" };
    case TaskStatus.Blocked:
    case TaskStatus.Rejected:
      return { variant: "destructive", label: status };
    case TaskStatus.Pending:
      return { variant: "secondary", label: "Pending" };
    default:
      return { variant: "secondary", label: status };
  }
}

// Overview Tab Content
function OverviewTab({ agent }: { agent: Agent }) {
  const { agents } = useAgents();
  const parentAgent = useMemo(() => 
    agents.find(a => a.id === agent.parentId),
    [agents, agent.parentId]
  );

  const levelColor = getLevelColor(agent.level);
  const trustScore = agent.trustScore ?? 50;
  const successRate = agent.tasksCompleted && agent.tasksCompleted > 0
    ? Math.round(((agent.tasksSuccessful ?? 0) / agent.tasksCompleted) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <AgentAvatar 
          agentId={agent.agentId} 
          name={agent.name} 
          level={agent.level} 
          size="lg"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{agent.name}</h2>
          <p className="text-sm text-muted-foreground">@{agent.agentId}</p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={getStatusVariant(agent.status)}>{agent.status}</Badge>
        <Badge variant="outline">{agent.role}</Badge>
        <Badge style={{ backgroundColor: `${levelColor}20`, color: levelColor, borderColor: levelColor }}>
          Level {agent.level} • {getLevelLabel(agent.level)}
        </Badge>
        {agent.reputationLevel && (
          <Badge variant="secondary">
            🏆 {agent.reputationLevel}
          </Badge>
        )}
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Status</span>
          </div>
          <p className="text-2xl font-bold">{agent.status}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Coins className="h-4 w-4" />
            <span className="text-sm">Balance</span>
          </div>
          <p className="text-2xl font-bold">{agent.currentBalance.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Award className="h-4 w-4" />
            <span className="text-sm">Trust Score</span>
          </div>
          <p className="text-2xl font-bold">{trustScore}/100</p>
          <Progress value={trustScore} className="mt-2 h-2" />
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Success Rate</span>
          </div>
          <p className="text-2xl font-bold">{successRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {agent.tasksSuccessful ?? 0}/{agent.tasksCompleted ?? 0} tasks
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Domain</span>
          <span className="text-sm font-medium">{agent.domain || "—"}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Parent Agent</span>
          <span className="text-sm font-medium">{parentAgent?.name || "—"}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Model</span>
          <span className="text-sm font-medium">{agent.model}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Mode</span>
          <span className="text-sm font-medium capitalize">{agent.mode || "worker"}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Created</span>
          <span className="text-sm font-medium">
            {new Date(agent.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Last Activity</span>
          <span className="text-sm font-medium">
            {agent.lastActivityAt ? new Date(agent.lastActivityAt).toLocaleString() : "—"}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Lifetime Earnings</span>
          <span className="text-sm font-medium">{agent.lifetimeEarnings.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Tasks Tab Content
function TasksTab({ agent }: { agent: Agent }) {
  const { tasks, loading } = useTasks();
  
  const agentTasks = useMemo(() => 
    tasks.filter(t => t.assigneeId === agent.id),
    [tasks, agent.id]
  );

  const tasksByStatus = useMemo(() => ({
    completed: agentTasks.filter(t => t.status === TaskStatus.Completed),
    inProgress: agentTasks.filter(t => t.status === TaskStatus.InProgress),
    pending: agentTasks.filter(t => t.status === TaskStatus.Pending),
    failed: agentTasks.filter(t => 
      t.status === TaskStatus.Rejected || t.status === TaskStatus.Blocked
    ),
  }), [agentTasks]);

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading tasks...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Task Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-2xl font-bold text-emerald-500">{tasksByStatus.completed.length}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-2xl font-bold text-amber-500">{tasksByStatus.inProgress.length}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <div className="text-2xl font-bold text-blue-500">{tasksByStatus.pending.length}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="text-2xl font-bold text-red-500">{tasksByStatus.failed.length}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {agentTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
            No tasks assigned to this agent yet
          </div>
        ) : (
          agentTasks.map((task, index) => {
            const statusInfo = getTaskStatusBadge(task.status);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {task.identifier && (
                        <span className="font-mono">#{task.identifier}</span>
                      )}
                      {task.priority && (
                        <span className="capitalize">{task.priority} priority</span>
                      )}
                      {task.completedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// Credits Tab Content
function CreditsTab({ agent }: { agent: Agent }) {
  const { transactions: creditHistory, loading } = useCredits(undefined, agent.id, 20);

  // Prepare chart data for last 7 days
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayTransactions = creditHistory.filter(h => 
        h.createdAt.startsWith(date)
      );
      const earned = dayTransactions
        .filter(h => h.amount > 0)
        .reduce((sum, h) => sum + h.amount, 0);
      const spent = Math.abs(dayTransactions
        .filter(h => h.amount < 0)
        .reduce((sum, h) => sum + h.amount, 0));
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        earned,
        spent,
      };
    });
  }, [creditHistory]);

  const totalEarned = creditHistory.filter(h => h.amount > 0).reduce((sum, h) => sum + h.amount, 0);
  const totalSpent = Math.abs(creditHistory.filter(h => h.amount < 0).reduce((sum, h) => sum + h.amount, 0));

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
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip valueFormatter={(v) => `${v.toLocaleString()} credits`} />}
            />
            <Bar dataKey="earned" fill="#10b981" radius={[6, 6, 0, 0]} animationDuration={800} />
            <Bar dataKey="spent" fill="#f43f5e" radius={[6, 6, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-sm font-medium mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading transactions...</div>
          ) : creditHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
              No transaction history yet
            </div>
          ) : (
            creditHistory.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {transaction.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transaction.reason || "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Balance: {transaction.balanceAfter.toLocaleString()}
                  </p>
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

// Messages Tab Content
function MessagesTab({ agent }: { agent: Agent }) {
  // Mock messages for now - would integrate with real messages API
  const messages = useMemo(() => [
    {
      id: "1",
      type: "sent",
      body: "Task completed successfully. Ready for next assignment.",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "2",
      type: "received",
      body: "Great work! Please proceed with the code review task.",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "3",
      type: "sent",
      body: "Requesting approval for PR #123",
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
  ], []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No messages yet</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, x: message.type === "sent" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${message.type === "sent" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] p-4 rounded-lg ${
              message.type === "sent" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted border border-border"
            }`}>
              <p className="text-sm">{message.body}</p>
              <p className={`text-xs mt-2 ${
                message.type === "sent" ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

// Settings Tab Content
function SettingsTab({ agent }: { agent: Agent }) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [domain, setDomain] = useState(agent.domain || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = 
      name !== agent.name || 
      role !== agent.role || 
      domain !== (agent.domain || "");
    setHasChanges(changed);
  }, [name, role, domain, agent]);

  const handleSave = () => {
    // TODO: Implement mutation
    console.log("Saving changes:", { name, role, domain });
    setHasChanges(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g., engineering, marketing"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges}
          className="flex-1"
        >
          Save Changes
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            setName(agent.name);
            setRole(agent.role);
            setDomain(agent.domain || "");
          }}
          disabled={!hasChanges}
        >
          Reset
        </Button>
      </div>

      {/* Read-only settings */}
      <div className="pt-6 border-t border-border space-y-3">
        <h3 className="text-sm font-medium">Read-Only Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Agent ID</p>
            <p className="font-mono">{agent.agentId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Level</p>
            <p className="font-medium">Level {agent.level}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{agent.model}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{agent.status}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AgentDetailPanel({ agentId, onClose }: AgentDetailPanelProps) {
  const { agents } = useAgents();
  const [activeTab, setActiveTab] = useState("overview");
  
  const agent = useMemo(() => 
    agents.find(a => a.id === agentId),
    [agents, agentId]
  );

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!agentId || !agent) return null;

  const levelColor = getLevelColor(agent.level);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative h-full w-full max-w-2xl bg-background border-l border-border shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div 
            className="flex-shrink-0 p-6 border-b border-border"
            style={{ 
              background: `linear-gradient(135deg, ${levelColor}15 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <AgentAvatar 
                  agentId={agent.agentId} 
                  name={agent.name} 
                  level={agent.level} 
                  size="lg"
                />
                <div>
                  <h2 className="text-2xl font-bold">{agent.name}</h2>
                  <p className="text-sm text-muted-foreground">@{agent.agentId}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex-shrink-0 border-b border-border px-6">
              <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="tasks"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger 
                  value="credits"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Credits
                </TabsTrigger>
                <TabsTrigger 
                  value="messages"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content with ScrollArea */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab agent={agent} />
                  </TabsContent>
                  <TabsContent value="tasks" className="mt-0">
                    <TasksTab agent={agent} />
                  </TabsContent>
                  <TabsContent value="credits" className="mt-0">
                    <CreditsTab agent={agent} />
                  </TabsContent>
                  <TabsContent value="messages" className="mt-0">
                    <MessagesTab agent={agent} />
                  </TabsContent>
                  <TabsContent value="settings" className="mt-0">
                    <SettingsTab agent={agent} />
                  </TabsContent>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </Tabs>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
