import { Activity, Clock, Coins, MessageSquare, Settings, Terminal, X, Zap } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { useAgents } from "../hooks/use-agents";
import { getLevelColor, getLevelLabel, getStatusVariant } from "../lib/status-colors";
import { CreditsTab } from "./agent-detail/credits-tab";
import { MessagesTab } from "./agent-detail/messages-tab";
import { OverviewTab } from "./agent-detail/overview-tab";
import { PromptTab } from "./agent-detail/prompt-tab";
import { SettingsTab } from "./agent-detail/settings-tab";
import { TasksTab } from "./agent-detail/tasks-tab";
import { AgentAvatar } from "./agent-avatar";
import { TeamBadge } from "./team-badge";
import { TimelineView } from "./timeline-view";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface AgentDetailPanelProps {
  agentId: string | null;
  onClose: () => void;
}

export function AgentDetailPanel({ agentId, onClose }: AgentDetailPanelProps) {
  const { agents } = useAgents();
  const [activeTab, setActiveTab] = useState("overview");

  const agent = useMemo(() => agents.find((a) => a.id === agentId), [agents, agentId]);

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
            avatarUrl={agent.avatar}
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
              <TabsContent key="overview" value="overview" className="mt-0">
                <OverviewTab agent={agent} />
              </TabsContent>
              <TabsContent key="prompt" value="prompt" className="mt-0">
                <PromptTab agent={agent} />
              </TabsContent>
              <TabsContent key="tasks" value="tasks" className="mt-0">
                <TasksTab agent={agent} />
              </TabsContent>
              <TabsContent key="credits" value="credits" className="mt-0">
                <CreditsTab agent={agent} />
              </TabsContent>
              <TabsContent key="messages" value="messages" className="mt-0">
                <MessagesTab agent={agent} />
              </TabsContent>
              <TabsContent key="timeline" value="timeline" className="mt-0">
                <TimelineView agentId={agent.agentId} />
              </TabsContent>
              <TabsContent key="settings" value="settings" className="mt-0">
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
