import {
  Activity,
  Clock,
  Coins,
  MessageSquare,
  Settings,
  Shield,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { CreditsTab } from "./credits-tab";
import { MessagesTab } from "./messages-tab";
import { OverviewTab } from "./overview-tab";
import { PromptTab } from "./prompt-tab";
import { SettingsTab } from "./settings-tab";
import { TasksTab } from "./tasks-tab";
import { TimelineTab } from "./timeline-tab";
import { AgentDetailTab } from "./types";
import type { AgentDetailAgent, AgentDetailPanelProps } from "./types";

/* ── Helpers ───────────────────────────────────────────────────── */

const LEVEL_COLORS: Record<number, string> = {
  10: "#f472b6",
  9: "#a78bfa",
  8: "#22c55e",
  7: "#22c55e",
  6: "#06b6d4",
  5: "#06b6d4",
  4: "#fbbf24",
  3: "#fbbf24",
  2: "#71717a",
  1: "#71717a",
};

function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] ?? "#71717a";
}

function getLevelLabel(level: number): string {
  if (level >= 10) return "COO";
  if (level >= 9) return "HR";
  if (level >= 7) return "Manager";
  if (level >= 5) return "Senior";
  if (level >= 3) return "Worker";
  return "Probation";
}

function getStatusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  const s = status.toLowerCase();
  switch (s) {
    case "active":
    case "busy":
      return "success";
    case "pending":
    case "idle":
      return "warning";
    case "suspended":
    case "revoked":
      return "destructive";
    default:
      return "secondary";
  }
}

function DefaultAvatar({ agent }: { agent: AgentDetailAgent }) {
  const levelColor = getLevelColor(agent.level);

  if (agent.avatarUrl) {
    return (
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
        <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (agent.avatar) {
    return (
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: `${agent.avatarColor ?? levelColor}30` }}
      >
        {agent.avatar}
      </div>
    );
  }

  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white/90 border border-white/10 shrink-0"
      style={{
        background: `linear-gradient(135deg, ${levelColor}40, ${levelColor}15)`,
      }}
    >
      {agent.name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Stat Box (tinted design) ─────────────────────────────────── */

function StatBox({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: "cyan" | "amber" | "emerald";
}) {
  const bgMap = {
    cyan: "bg-cyan-500/5",
    amber: "bg-amber-500/5",
    emerald: "bg-emerald-500/5",
  };
  return (
    <div className={cn("rounded-xl p-3 space-y-1.5", bgMap[accent])}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] text-white/35 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-white tabular-nums leading-none">{value}</span>
        {sub && <span className="text-[10px] text-white/30">{sub}</span>}
      </div>
    </div>
  );
}

/* ── Tab Config ────────────────────────────────────────────────── */

interface TabConfig {
  value: AgentDetailTab;
  label: string;
  icon: ReactNode;
}

const ALL_TABS: TabConfig[] = [
  {
    value: AgentDetailTab.Overview,
    label: "Overview",
    icon: <Activity className="h-4 w-4 mr-2 hidden sm:block" />,
  },
  {
    value: AgentDetailTab.Prompt,
    label: "Prompt",
    icon: <Terminal className="h-4 w-4 mr-2 hidden sm:block" />,
  },
  {
    value: AgentDetailTab.Tasks,
    label: "Tasks",
    icon: <Zap className="h-4 w-4 mr-2 hidden sm:block" />,
  },
  {
    value: AgentDetailTab.Credits,
    label: "Credits",
    icon: <Coins className="h-4 w-4 mr-2 hidden sm:block" />,
  },
  {
    value: AgentDetailTab.Messages,
    label: "Messages",
    icon: <MessageSquare className="h-4 w-4 mr-2 hidden sm:block" />,
  },
  {
    value: AgentDetailTab.Timeline,
    label: "Timeline",
    icon: <Clock className="h-4 w-4 mr-2 hidden sm:block" />,
  },
  {
    value: AgentDetailTab.Settings,
    label: "Settings",
    icon: <Settings className="h-4 w-4 mr-2 hidden sm:block" />,
  },
];

/* ── Main Component ────────────────────────────────────────────── */

export function AgentDetailPanel({
  agent,
  onClose,
  parentAgentName,
  teamName,
  tasks,
  tasksLoading,
  transactions,
  transactionsLoading,
  messages,
  systemPrompt,
  timelineEvents,
  onSaveSettings,
  onTaskClick,
  visibleTabs,
  renderAvatar,
}: AgentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<string>(AgentDetailTab.Overview);

  const levelColor = getLevelColor(agent.level);
  const successRate =
    agent.tasksCompleted > 0 ? Math.round((agent.tasksSuccessful / agent.tasksCompleted) * 100) : 0;

  // Determine which tabs to show
  const resolvedTabs = useMemo(() => {
    if (visibleTabs) {
      return ALL_TABS.filter((t) => visibleTabs.includes(t.value));
    }

    // Auto-detect: Overview always shows, others show when data is provided
    return ALL_TABS.filter((t) => {
      if (t.value === AgentDetailTab.Overview) return true;
      if (t.value === AgentDetailTab.Prompt) return systemPrompt !== undefined;
      if (t.value === AgentDetailTab.Tasks) return tasks !== undefined;
      if (t.value === AgentDetailTab.Credits) return transactions !== undefined;
      if (t.value === AgentDetailTab.Messages) return messages !== undefined;
      if (t.value === AgentDetailTab.Timeline) return timelineEvents !== undefined;
      if (t.value === AgentDetailTab.Settings) return onSaveSettings !== undefined;
      return false;
    });
  }, [visibleTabs, systemPrompt, tasks, transactions, messages, timelineEvents, onSaveSettings]);

  const tabTriggerClass =
    "data-[selected]:bg-transparent data-[selected]:shadow-none border-b-2 border-transparent data-[selected]:border-primary rounded-none pb-3 px-0";

  return (
    <div className="h-full flex flex-col bg-background overflow-x-hidden">
      {/* Header */}
      <div
        className="flex-shrink-0 p-4 md:p-6 border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${levelColor}15 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-start gap-3">
          {renderAvatar ? renderAvatar(agent) : <DefaultAvatar agent={agent} />}
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
              <Badge variant={getStatusVariant(agent.status)} className="text-[10px]">
                {agent.status}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {agent.role}
              </Badge>
              <Badge
                className="text-[10px]"
                style={{
                  backgroundColor: `${levelColor}20`,
                  color: levelColor,
                  borderColor: levelColor,
                }}
              >
                L{agent.level} - {getLevelLabel(agent.level)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 md:px-6 py-4">
        <div className="grid grid-cols-3 gap-3">
          <StatBox
            icon={<Shield className="w-3.5 h-3.5 text-cyan-400" />}
            label="Trust"
            value={`${agent.trustScore}%`}
            accent="cyan"
          />
          <StatBox
            icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
            label="Done"
            value={String(agent.tasksCompleted)}
            sub={successRate > 0 ? `${successRate}%` : undefined}
            accent="amber"
          />
          <StatBox
            icon={<Coins className="w-3.5 h-3.5 text-emerald-400" />}
            label="Balance"
            value={`${(agent.currentBalance ?? 0).toLocaleString()}c`}
            accent="emerald"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 border-b border-border px-4 md:px-6 pt-3 overflow-x-auto scrollbar-none">
          <TabsList className="w-max justify-start bg-transparent h-auto p-0 gap-3 md:gap-6">
            {resolvedTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClass}>
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              <TabsContent
                key={AgentDetailTab.Overview}
                value={AgentDetailTab.Overview}
                className="mt-0"
              >
                <OverviewTab agent={agent} parentAgentName={parentAgentName} teamName={teamName} />
              </TabsContent>

              {systemPrompt !== undefined && (
                <TabsContent
                  key={AgentDetailTab.Prompt}
                  value={AgentDetailTab.Prompt}
                  className="mt-0"
                >
                  <PromptTab systemPrompt={systemPrompt} />
                </TabsContent>
              )}

              {tasks !== undefined && (
                <TabsContent
                  key={AgentDetailTab.Tasks}
                  value={AgentDetailTab.Tasks}
                  className="mt-0"
                >
                  <TasksTab
                    agent={agent}
                    tasks={tasks}
                    tasksLoading={tasksLoading}
                    onTaskClick={onTaskClick}
                  />
                </TabsContent>
              )}

              {transactions !== undefined && (
                <TabsContent
                  key={AgentDetailTab.Credits}
                  value={AgentDetailTab.Credits}
                  className="mt-0"
                >
                  <CreditsTab
                    agent={agent}
                    transactions={transactions}
                    transactionsLoading={transactionsLoading}
                  />
                </TabsContent>
              )}

              {messages !== undefined && (
                <TabsContent
                  key={AgentDetailTab.Messages}
                  value={AgentDetailTab.Messages}
                  className="mt-0"
                >
                  <MessagesTab messages={messages} />
                </TabsContent>
              )}

              {timelineEvents !== undefined && (
                <TabsContent
                  key={AgentDetailTab.Timeline}
                  value={AgentDetailTab.Timeline}
                  className="mt-0"
                >
                  <TimelineTab events={timelineEvents} />
                </TabsContent>
              )}

              {onSaveSettings !== undefined && (
                <TabsContent
                  key={AgentDetailTab.Settings}
                  value={AgentDetailTab.Settings}
                  className="mt-0"
                >
                  <SettingsTab agent={agent} onSaveSettings={onSaveSettings} />
                </TabsContent>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
