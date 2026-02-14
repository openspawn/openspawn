import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Clock, CheckCircle, AlertTriangle, UserPlus, Inbox, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AgentAvatar } from "./agent-avatar";
import { cn } from "../lib/utils";
import { useAgents } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import type { AgentFieldsFragment } from "../graphql/generated/graphql";

// Idle reason mapping
type IdleReason = "task_complete" | "blocked" | "awaiting_input" | "unassigned" | "newly_activated";

interface IdleAgentInfo {
  agent: AgentFieldsFragment;
  reason: IdleReason;
  idleSince?: Date;
  previousTaskTitle?: string;
}

const IDLE_REASON_CONFIG: Record<IdleReason, { 
  icon: typeof CheckCircle; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  task_complete: { 
    icon: CheckCircle, 
    label: "Completed Task", 
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  blocked: { 
    icon: AlertTriangle, 
    label: "Blocked", 
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  awaiting_input: { 
    icon: Clock, 
    label: "Awaiting Input", 
    color: "text-blue-500",
    bgColor: "bg-cyan-500/10",
  },
  unassigned: { 
    icon: Inbox, 
    label: "No Tasks", 
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  newly_activated: { 
    icon: UserPlus, 
    label: "Just Activated", 
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
};

function IdleAgentCard({ 
  idleInfo, 
  onClick 
}: { 
  idleInfo: IdleAgentInfo; 
  onClick?: () => void;
}) {
  const { agent, reason, previousTaskTitle } = idleInfo;
  const config = IDLE_REASON_CONFIG[reason];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <div className="relative flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
        {/* Idle pulse effect */}
        <div className="relative">
          <AgentAvatar
            agentId={agent.agentId}
            name={agent.name}
            level={agent.level}
            size="md"
            avatar={agent.avatar}

            avatarUrl={agent.avatarUrl}
            avatarColor={agent.avatarColor}
          />
          {/* Subtle pulse ring for idle state */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{agent.name}</span>
            <Badge variant="outline" className="text-xs">
              L{agent.level}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Icon className={cn("h-3 w-3", config.color)} />
            <span className="text-xs text-muted-foreground">
              {previousTaskTitle ? `Finished: ${previousTaskTitle}` : config.label}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </motion.div>
  );
}

export function IdleAgentsWidget({
  maxCount = 5,
  onAgentClick,
  className,
}: {
  maxCount?: number;
  onAgentClick?: (agent: AgentFieldsFragment) => void;
  className?: string;
}) {
  const { agents } = useAgents();
  const { tasks } = useTasks();

  // Compute idle agents based on task assignments
  const idleAgents = useMemo<IdleAgentInfo[]>(() => {
    if (!agents.length) return [];

    const activeAgents = agents.filter(a => a.status === "ACTIVE");
    
    // Build task count map
    const agentTaskCounts = new Map<string, number>();
    const recentCompletedTasks = new Map<string, string>();
    
    tasks.forEach(task => {
      if (!task.assigneeId) return;
      
      const status = task.status?.toUpperCase();
      if (status === "TODO" || status === "IN_PROGRESS" || status === "REVIEW") {
        agentTaskCounts.set(
          task.assigneeId, 
          (agentTaskCounts.get(task.assigneeId) || 0) + 1
        );
      } else if (status === "DONE" && !recentCompletedTasks.has(task.assigneeId)) {
        recentCompletedTasks.set(task.assigneeId, task.title);
      }
    });

    const idle: IdleAgentInfo[] = [];
    
    for (const agent of activeAgents) {
      const taskCount = agentTaskCounts.get(agent.id) || 0;
      
      if (taskCount === 0) {
        // Determine reason
        let reason: IdleReason = "unassigned";
        let previousTaskTitle: string | undefined;
        
        if (recentCompletedTasks.has(agent.id)) {
          reason = "task_complete";
          previousTaskTitle = recentCompletedTasks.get(agent.id);
        } else if (agent.createdAt) {
          // Check if recently created (within last hour simulation time)
          const createdAt = new Date(agent.createdAt);
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (createdAt > hourAgo) {
            reason = "newly_activated";
          }
        }
        
        idle.push({
          agent,
          reason,
          previousTaskTitle,
          idleSince: new Date(),
        });
      }
    }

    // Sort: task_complete first, then newly_activated, then by level (higher first)
    return idle.sort((a, b) => {
      const orderMap: Record<IdleReason, number> = {
        task_complete: 0,
        newly_activated: 1,
        blocked: 2,
        awaiting_input: 3,
        unassigned: 4,
      };
      const orderDiff = orderMap[a.reason] - orderMap[b.reason];
      if (orderDiff !== 0) return orderDiff;
      return b.agent.level - a.agent.level;
    }).slice(0, maxCount);
  }, [agents, tasks, maxCount]);

  if (idleAgents.length === 0) {
    return null; // Don't show widget if no idle agents
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </motion.div>
          <span>Available Agents</span>
          <Badge variant="secondary" className="ml-auto mr-2">
            {idleAgents.length}
          </Badge>
          <Link 
            to="/agents" 
            className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            See all →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Horizontal scroll on mobile, vertical list on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory sm:snap-none sm:flex-col sm:overflow-x-visible sm:mx-0 sm:px-0 sm:pb-0 sm:space-y-2 sm:gap-0 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {idleAgents.map((idleInfo) => (
              <div key={idleInfo.agent.id} className="flex-shrink-0 w-[260px] snap-start sm:w-full sm:flex-shrink">
                <IdleAgentCard
                  idleInfo={idleInfo}
                  onClick={() => onAgentClick?.(idleInfo.agent)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
        
        {agents.filter(a => a.status === "ACTIVE").length > 0 && (
          <div className="pt-2 text-center">
            <span className="text-xs text-muted-foreground">
              {idleAgents.length} of {agents.filter(a => a.status === "ACTIVE").length} agents available
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
