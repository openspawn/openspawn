import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, TrendingDown, Calendar, Zap, MessageSquare, Settings, Activity, Award, Coins, Clock, Terminal } from "lucide-react";
import { isSandboxMode } from "../graphql/fetcher";
import { SANDBOX_URL } from "../lib/sandbox-url";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { AgentAvatar } from "./agent-avatar";
import { Progress } from "./ui/progress";
import { useAgents } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import { useCredits } from "../hooks/use-credits";
import { AgentRole, AgentStatus, TaskStatus } from "../graphql/generated/graphql";
import type { AgentFieldsFragment } from "../graphql/generated/graphql";
// recharts v3 has infinite-loop bug — using custom bars instead
import { useContainerSize } from "../hooks/use-container-size";
// ChartTooltip removed — using custom bars
import { Sparkline, generateSparklineData } from "./ui/sparkline";
import { TimelineView } from "./timeline-view";
import { getStatusVariant, getLevelColor, getLevelLabel } from "../lib/status-colors";
import { TeamBadge } from "./team-badge";

type Agent = AgentFieldsFragment;

interface AgentDetailPanelProps {
  agentId: string | null;
  onClose: () => void;
}

function getTaskStatusBadge(status: TaskStatus): { variant: "success" | "warning" | "destructive" | "secondary"; label: string } {
  switch (status) {
    case TaskStatus.Done:
      return { variant: "success", label: "Completed" };
    case TaskStatus.InProgress:
      return { variant: "warning", label: "In Progress" };
    case TaskStatus.Blocked:
    case TaskStatus.Cancelled:
      return { variant: "destructive", label: status };
    case TaskStatus.Backlog:
    case TaskStatus.Todo:
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
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{agent.currentBalance.toLocaleString()}</p>
            <Sparkline data={generateSparklineData(7, "stable")} color="#f59e0b" width={48} height={18} showDot />
          </div>
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
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{successRate}%</p>
            <Sparkline data={generateSparklineData(7, successRate > 70 ? "up" : "down")} color={successRate > 70 ? "#10b981" : "#f43f5e"} width={48} height={18} showDot showTrend />
          </div>
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
    completed: agentTasks.filter(t => t.status === TaskStatus.Done),
    inProgress: agentTasks.filter(t => t.status === TaskStatus.InProgress),
    pending: agentTasks.filter(t => t.status === TaskStatus.Backlog || t.status === TaskStatus.Todo),
    failed: agentTasks.filter(t => 
      t.status === TaskStatus.Cancelled || t.status === TaskStatus.Blocked
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
  // chartRef/chartSize removed — no longer using recharts

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
        <div className="w-full space-y-2" style={{ height: 200 }}>
          {chartData.map((d: { date: string; earned: number; spent: number }) => {
            const max = Math.max(...chartData.map((x: { earned: number; spent: number }) => Math.max(x.earned, x.spent)), 1);
            return (
              <div key={d.date} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-muted-foreground shrink-0">{d.date}</span>
                <div className="flex-1 flex gap-1 h-5">
                  <div className="bg-emerald-500 rounded-sm" style={{ width: `${(d.earned / max) * 50}%` }} title={`Earned: ${d.earned}`} />
                  <div className="bg-rose-500 rounded-sm" style={{ width: `${(d.spent / max) * 50}%` }} title={`Spent: ${d.spent}`} />
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

// ACP message type styling
const acpTypeStyles: Record<string, { icon: string; accent: string; bg: string }> = {
  ack: { icon: '👍', accent: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
  delegation: { icon: '📋', accent: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
  progress: { icon: '📊', accent: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
  escalation: { icon: '⚠️', accent: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  completion: { icon: '✅', accent: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  status_request: { icon: '💬', accent: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
};

// Messages Tab Content
function MessagesTab({ agent }: { agent: Agent }) {
  const { agents: allAgents } = useAgents();
  const parent = allAgents.find((a) => a.id === agent.parentId);
  const reports = allAgents.filter((a) => a.parentId === agent.id);
  const firstReport = reports[0];

  // Fetch real messages from sandbox API when in sandbox mode
  const { data: sandboxMessages } = useQuery({
    queryKey: ['sandbox-agent-messages', agent.agentId],
    queryFn: async () => {
      const res = await fetch(`${SANDBOX_URL}/api/agent/${agent.agentId}/messages`);
      return res.json();
    },
    enabled: isSandboxMode,
    // Refetch driven by SSE tick_complete (see use-sandbox-tick.ts)
  });

  // Generate contextual messages based on agent properties (fallback for non-sandbox)
  const generatedMessages = useMemo(() => {
    if (isSandboxMode) return [];
    const domain = agent.domain ?? 'operations';
    const parentName = parent?.name ?? 'Manager';
    const reportName = firstReport?.name;
    const now = Date.now();

    const pool: Array<{ type: string; body: string; offset: number }> = [];

    if (parent) {
      pool.push({ type: "received", body: `${agent.name}, please prioritize the ${domain} backlog items.`, offset: 1 });
      pool.push({ type: "sent", body: `Acknowledged. Working on ${domain} tasks now.`, offset: 2 });
    }
    if (agent.tasksCompleted > 0) {
      pool.push({ type: "sent", body: `Completed ${agent.tasksCompleted} task${agent.tasksCompleted > 1 ? 's' : ''} so far. Ready for more.`, offset: 3 });
    }
    if (reportName) {
      pool.push({ type: "sent", body: `Delegated the latest ${domain} task to ${reportName}.`, offset: 4 });
      pool.push({ type: "received", body: `${reportName} finished the subtask. Results look good.`, offset: 5 });
    }
    if (domain === 'engineering' || domain === 'code') {
      pool.push({ type: "sent", body: "PR review complete. All checks passing.", offset: 6 });
    } else if (domain === 'security') {
      pool.push({ type: "sent", body: "Security scan finished. No critical vulnerabilities found.", offset: 7 });
    } else {
      pool.push({ type: "sent", body: `${domain.charAt(0).toUpperCase() + domain.slice(1)} tasks are on track.`, offset: 6 });
    }
    if (agent.trustScore >= 90) {
      pool.push({ type: "received", body: `Great reliability, ${agent.name}. Keep it up.`, offset: 10 });
    } else if (agent.trustScore < 50) {
      pool.push({ type: "received", body: "Please improve task completion rate. Let me know if you need support.", offset: 11 });
    }

    return pool.slice(0, 5).map((m, i) => ({
      id: String(i + 1),
      type: m.type,
      body: m.body,
      createdAt: new Date(now - m.offset * 3600000).toISOString(),
    }));
  }, [agent, parent, firstReport]);

  // Render sandbox messages with ACP type styling
  if (isSandboxMode) {
    const msgs = sandboxMessages || [];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {msgs.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet</p>
          </div>
        ) : (
          msgs.map((msg: any, index: number) => {
            const isSent = msg.from === agent.agentId;
            const style = acpTypeStyles[msg.type] || acpTypeStyles.ack;
            const fromAgent = allAgents.find(a => a.agentId === msg.from);
            const toAgent = allAgents.find(a => a.agentId === msg.to);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isSent ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] p-3 rounded-lg border ${style.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{style.icon}</span>
                    <span className={`text-xs font-medium ${style.accent}`}>
                      {msg.type}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {isSent ? `→ ${toAgent?.name || msg.to}` : `← ${fromAgent?.name || msg.from}`}
                    </span>
                  </div>
                  <p className="text-sm">{msg.body || msg.summary || msg.type}</p>
                  {msg.pct !== undefined && msg.pct !== null && (
                    <div className="mt-1 text-xs text-muted-foreground">Progress: {msg.pct}%</div>
                  )}
                  <p className="text-xs mt-2 text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    );
  }

  // Non-sandbox: use generated messages
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {generatedMessages.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No messages yet</p>
        </div>
      ) : (
        generatedMessages.map((message, index) => (
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

// Prompt Tab Content
function PromptTab({ agent }: { agent: Agent }) {
  const { data: sandboxAgents } = useQuery({
    queryKey: ['sandbox-agents-for-prompt'],
    queryFn: async () => {
      const res = await fetch(`${SANDBOX_URL}/api/agents`);
      return res.json();
    },
    enabled: isSandboxMode,
  });

  const systemPrompt = useMemo(() => {
    if (!isSandboxMode || !sandboxAgents) return null;
    const match = sandboxAgents.find((a: any) => a.agentId === agent.agentId || a.id === agent.agentId);
    return match?.systemPrompt || null;
  }, [sandboxAgents, agent.agentId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {isSandboxMode && systemPrompt ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 overflow-auto max-h-[500px]">
          <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap break-words">
            {systemPrompt}
          </pre>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>System prompt not available in this mode</p>
        </div>
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
            onChange={(e) => setRole(e.target.value as AgentRole)}
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

  // Escape key is handled by SidePanelProvider

  if (!agentId || !agent) return null;

  const levelColor = getLevelColor(agent.level);

  const panelContent = (
    <>
          {/* Header */}
          <div 
            className="flex-shrink-0 p-4 md:p-6 border-b border-border"
            style={{ 
              background: `linear-gradient(135deg, ${levelColor}15 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-start gap-3">
              <AgentAvatar 
                agentId={agent.agentId} 
                name={agent.name} 
                level={agent.level} 
                size="lg"
                avatar={agent.avatar}

                avatarUrl={agent.avatarUrl}
                avatarColor={agent.avatarColor}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold truncate">{agent.name}</h2>
                    <p className="text-sm text-muted-foreground truncate">@{agent.agentId}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0 min-w-[44px] min-h-[44px]"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant={getStatusVariant(agent.status)} className="text-[10px]">{agent.status}</Badge>
                  <Badge variant="outline" className="text-[10px]">{agent.role}</Badge>
                  <Badge className="text-[10px]" style={{ backgroundColor: `${levelColor}20`, color: levelColor, borderColor: levelColor }}>
                    L{agent.level} • {getLevelLabel(agent.level)}
                  </Badge>
                  <TeamBadge teamId={agent.teamId} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-w-0">
            <div className="flex-shrink-0 border-b border-border px-4 md:px-6 pt-3 overflow-x-auto scrollbar-none">
              <TabsList className="w-max justify-start bg-transparent h-auto p-0 gap-3 md:gap-6">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Activity className="h-4 w-4 mr-2 hidden sm:block" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="prompt"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Terminal className="h-4 w-4 mr-2 hidden sm:block" />
                  Prompt
                </TabsTrigger>
                <TabsTrigger 
                  value="tasks"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Zap className="h-4 w-4 mr-2 hidden sm:block" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger 
                  value="credits"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Coins className="h-4 w-4 mr-2 hidden sm:block" />
                  Credits
                </TabsTrigger>
                <TabsTrigger 
                  value="messages"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <MessageSquare className="h-4 w-4 mr-2 hidden sm:block" />
                  Messages
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Clock className="h-4 w-4 mr-2 hidden sm:block" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3 px-0"
                >
                  <Settings className="h-4 w-4 mr-2 hidden sm:block" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content with ScrollArea */}
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6">
                <AnimatePresence mode="wait">
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab agent={agent} />
                  </TabsContent>
                  <TabsContent value="prompt" className="mt-0">
                    <PromptTab agent={agent} />
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
                  <TabsContent value="timeline" className="mt-0">
                    <TimelineView agentId={agent.agentId} />
                  </TabsContent>
                  <TabsContent value="settings" className="mt-0">
                    <SettingsTab agent={agent} />
                  </TabsContent>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </Tabs>
    </>
  );

  return <div className="h-full flex flex-col bg-background overflow-x-hidden">{panelContent}</div>;
}
