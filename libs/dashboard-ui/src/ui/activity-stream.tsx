import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckSquare,
  Play,
  UserPlus,
  AlertTriangle,
  Brain,
  Zap,
  Shield,
  CheckCircle,
  Radio,
  Plus,
  type LucideIcon,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────── */

export interface ActivityEvent {
  id: string;
  type: string;
  actor_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  data?: Record<string, unknown> | null;
  severity?: string;
  created_at: string;
}

export interface ActivityAgent {
  id: string;
  agentId?: string;
  name: string;
}

interface ActivityStreamProps {
  events: ActivityEvent[];
  agents?: ActivityAgent[];
  maxVisible?: number;
  connected?: boolean;
}

/* ── Helpers ───────────────────────────────────────────────────── */

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const EVENT_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; label: string }
> = {
  "task.created": { icon: Plus, color: "text-cyan-400", label: "created a task" },
  "task.transitioned": { icon: Play, color: "text-emerald-400", label: "updated task status" },
  "task.assigned": { icon: UserPlus, color: "text-violet-400", label: "was assigned a task" },
  "task.escalated": { icon: AlertTriangle, color: "text-amber-400", label: "escalated a task" },
  "memory.stored": { icon: Brain, color: "text-pink-400", label: "stored a memory" },
  "agent.registered": { icon: UserPlus, color: "text-cyan-400", label: "registered" },
  "agent.spawned": { icon: Zap, color: "text-amber-400", label: "was spawned" },
  "escalation.created": { icon: AlertTriangle, color: "text-red-400", label: "created an escalation" },
  "escalation.resolved": { icon: CheckCircle, color: "text-emerald-400", label: "resolved an escalation" },
  "coordination.event": { icon: Radio, color: "text-blue-400", label: "coordination event" },
};

const DEFAULT_CONFIG = { icon: CheckSquare, color: "text-muted-foreground", label: "event" };

function getEventConfig(type: string) {
  return EVENT_CONFIG[type] ?? DEFAULT_CONFIG;
}

function resolveActorName(
  actorId: string | null | undefined,
  agents: ActivityAgent[],
): string {
  if (!actorId) return "System";
  const agent = agents.find((a) => a.id === actorId || a.agentId === actorId);
  if (agent) return agent.name;
  // Capitalize the agent ID as fallback
  return actorId.charAt(0).toUpperCase() + actorId.slice(1);
}

function describeEvent(event: ActivityEvent, agents: ActivityAgent[]): string {
  const actor = resolveActorName(event.actor_id, agents);
  const config = getEventConfig(event.type);
  const data = event.data ?? {};

  switch (event.type) {
    case "task.created": {
      const title = (data.title as string) || (event.entity_id ? `#${event.entity_id}` : "");
      return `${actor} created task${title ? ` "${title}"` : ""}`;
    }
    case "task.transitioned": {
      const from = data.from_status as string | undefined;
      const to = data.to_status as string | undefined;
      const taskRef = event.entity_id ? ` #${event.entity_id}` : "";
      if (to === "done") return `${actor} completed task${taskRef}`;
      if (from && to) return `${actor} moved task${taskRef} to ${to.replace("_", " ")}`;
      return `${actor} updated task${taskRef}`;
    }
    case "task.assigned": {
      const assignee = data.assignee_id
        ? resolveActorName(data.assignee_id as string, agents)
        : "someone";
      return `Task assigned to ${assignee}`;
    }
    case "task.escalated":
      return `${actor} escalated task${event.entity_id ? ` #${event.entity_id}` : ""}`;
    case "memory.stored": {
      const category = data.category as string | undefined;
      return `${actor} stored a ${category ?? ""}memory`.replace("  ", " ");
    }
    case "agent.registered":
      return `${actor} joined the organization`;
    case "agent.spawned":
      return `${actor} was spawned`;
    case "escalation.created":
      return `${actor} created an escalation`;
    case "escalation.resolved":
      return `${actor} resolved an escalation`;
    case "coordination.event":
      return `${actor}: coordination event`;
    default:
      return `${actor}: ${config.label}`;
  }
}

function severityDot(severity?: string): string | null {
  switch (severity) {
    case "critical":
      return "bg-red-500";
    case "warning":
      return "bg-amber-500";
    case "info":
      return "bg-cyan-500";
    default:
      return null;
  }
}

/* ── Component ─────────────────────────────────────────────────── */

export function ActivityStream({
  events,
  agents = [],
  maxVisible = 50,
  connected,
}: ActivityStreamProps) {
  const visibleEvents = useMemo(() => {
    // Sort newest first, limit
    return [...events]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, maxVisible);
  }, [events, maxVisible]);

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {connected !== undefined && (
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
            title={connected ? "Live" : "Polling"}
          />
        )}
        <span className="text-xs text-muted-foreground">
          {connected ? "Live" : "Polling"} · {events.length} events
        </span>
      </div>

      {/* Event list */}
      <div className="max-h-[400px] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {visibleEvents.map((event, i) => {
            const config = getEventConfig(event.type);
            const Icon = config.icon;
            const dot = severityDot(event.severity);
            return (
              <motion.div
                key={event.id}
                initial={i === 0 ? { opacity: 0, y: -8 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5 py-2 px-2 rounded-md hover:bg-white/[0.03] transition-colors group"
              >
                <div className={`mt-0.5 shrink-0 ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90 leading-snug truncate">
                    {describeEvent(event, agents)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {timeAgo(event.created_at)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visibleEvents.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No activity yet — events will appear as agents start working
          </div>
        )}
      </div>
    </div>
  );
}
