import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Circle,
  User,
  Play,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Coins,
  ZoomIn,
  ZoomOut,
  Clock,
} from "lucide-react";
import { cn } from "../lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | "task_created"
  | "task_assigned"
  | "agent_started"
  | "message"
  | "task_completed"
  | "task_failed"
  | "credit_transaction";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: Date;
  agentId: string;
  taskId?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const eventConfig: Record<
  TimelineEventType,
  { icon: typeof Circle; color: string; bg: string; border: string; label: string }
> = {
  task_created: {
    icon: Circle,
    color: "text-cyan-400",
    bg: "bg-cyan-400/20",
    border: "border-cyan-400/50",
    label: "Task Created",
  },
  task_assigned: {
    icon: User,
    color: "text-violet-400",
    bg: "bg-violet-400/20",
    border: "border-violet-400/50",
    label: "Task Assigned",
  },
  agent_started: {
    icon: Play,
    color: "text-emerald-400",
    bg: "bg-emerald-400/20",
    border: "border-emerald-400/50",
    label: "Agent Started",
  },
  message: {
    icon: MessageSquare,
    color: "text-muted-foreground",
    bg: "bg-muted-foreground/20",
    border: "border-muted-foreground/50",
    label: "Message",
  },
  task_completed: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/20",
    border: "border-emerald-400/50",
    label: "Completed",
  },
  task_failed: {
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-400/20",
    border: "border-rose-400/50",
    label: "Failed",
  },
  credit_transaction: {
    icon: Coins,
    color: "text-amber-400",
    bg: "bg-amber-400/20",
    border: "border-amber-400/50",
    label: "Credits",
  },
};

// ── Mock data generator ────────────────────────────────────────────────────

export function generateMockTimeline(agentId: string): TimelineEvent[] {
  const now = new Date();
  const base = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4h ago

  const m = (mins: number) => new Date(base.getTime() + mins * 60 * 1000);

  return [
    { id: "e1", type: "task_created", title: "Task #42 created", description: "Implement user authentication flow", timestamp: m(0), agentId, taskId: "t42" },
    { id: "e2", type: "task_assigned", title: "Task #42 assigned", description: "Assigned to agent for execution", timestamp: m(3), agentId, taskId: "t42" },
    { id: "e3", type: "agent_started", title: "Agent started working", description: "Picked up task #42, analyzing requirements", timestamp: m(5), agentId, taskId: "t42" },
    { id: "e4", type: "message", title: "Status update sent", description: "\"Starting implementation of auth module\"", timestamp: m(12), agentId, taskId: "t42" },
    { id: "e5", type: "credit_transaction", title: "Credits consumed", description: "2.5 credits for GPT-4 inference", timestamp: m(18), agentId, taskId: "t42" },
    { id: "e6", type: "message", title: "Code review request", description: "Submitted PR #187 for review", timestamp: m(35), agentId, taskId: "t42" },
    { id: "e7", type: "credit_transaction", title: "Credits consumed", description: "1.8 credits for Claude inference", timestamp: m(40), agentId, taskId: "t42" },
    { id: "e8", type: "task_completed", title: "Task #42 completed", description: "Auth flow implemented and tested", timestamp: m(55), agentId, taskId: "t42" },
    { id: "e9", type: "task_created", title: "Task #43 created", description: "Write API documentation", timestamp: m(60), agentId, taskId: "t43" },
    { id: "e10", type: "task_assigned", title: "Task #43 assigned", description: "Auto-assigned based on capability match", timestamp: m(62), agentId, taskId: "t43" },
    { id: "e11", type: "agent_started", title: "Agent started working", description: "Analyzing existing endpoints for docs", timestamp: m(64), agentId, taskId: "t43" },
    { id: "e12", type: "task_created", title: "Task #44 created", description: "Fix pagination bug in list view", timestamp: m(70), agentId, taskId: "t44" },
    { id: "e13", type: "message", title: "Progress update", description: "\"Documented 8/12 endpoints so far\"", timestamp: m(90), agentId, taskId: "t43" },
    { id: "e14", type: "task_assigned", title: "Task #44 assigned", description: "Urgent bug fix assignment", timestamp: m(95), agentId, taskId: "t44" },
    { id: "e15", type: "credit_transaction", title: "Credits consumed", description: "3.2 credits for multi-model pipeline", timestamp: m(110), agentId, taskId: "t43" },
    { id: "e16", type: "agent_started", title: "Agent started on #44", description: "Investigating pagination offset issue", timestamp: m(115), agentId, taskId: "t44" },
    { id: "e17", type: "task_failed", title: "Task #44 failed", description: "Could not reproduce bug in test env", timestamp: m(140), agentId, taskId: "t44" },
    { id: "e18", type: "message", title: "Documentation complete", description: "\"All 12 endpoints documented with examples\"", timestamp: m(160), agentId, taskId: "t43" },
    { id: "e19", type: "task_completed", title: "Task #43 completed", description: "API docs published to wiki", timestamp: m(170), agentId, taskId: "t43" },
    { id: "e20", type: "credit_transaction", title: "Bonus credits earned", description: "+5 credits for completing 2 tasks", timestamp: m(175), agentId },
  ];
}

// ── Popover ────────────────────────────────────────────────────────────────

function EventDetail({ event }: { event: TimelineEvent }) {
  const cfg = eventConfig[event.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="p-3 rounded-lg border border-border bg-muted/30"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("p-1 rounded", cfg.bg)}>
          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        </div>
        <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
        {event.taskId && (
          <span className="text-[10px] text-muted-foreground/70 font-mono">{event.taskId}</span>
        )}
        <span className="text-[10px] text-muted-foreground/70 ml-auto flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground mt-1">{event.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
    </motion.div>
  );
}

// ── Event Node ─────────────────────────────────────────────────────────────

function EventNode({
  event,
  isSelected,
  isLatest,
  onClick,
}: {
  event: TimelineEvent;
  isSelected: boolean;
  isLatest: boolean;
  onClick: () => void;
}) {
  const cfg = eventConfig[event.type];
  const Icon = cfg.icon;

  return (
    <div className="relative flex flex-col items-center" onClick={onClick}>
      {/* Node */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-colors",
          cfg.bg,
          cfg.border,
          isSelected && "ring-2 ring-offset-2 ring-offset-background ring-white/30"
        )}
      >
        {isLatest && (
          <motion.div
            className={cn("absolute inset-0 rounded-full", cfg.bg)}
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </motion.button>

      {/* Time label */}
      <span className="mt-2 text-[10px] text-muted-foreground/70 whitespace-nowrap">
        {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

// ── Swim Lane Timeline ─────────────────────────────────────────────────────

interface TimelineViewProps {
  events?: TimelineEvent[];
  agentId?: string;
  className?: string;
}

export function TimelineView({ events: eventsProp, agentId, className }: TimelineViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const events = useMemo(
    () => eventsProp ?? (agentId ? generateMockTimeline(agentId) : []),
    [eventsProp, agentId]
  );

  // Group events by taskId for swim lanes
  const lanes = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const ev of events) {
      const key = ev.taskId ?? "__general__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return Array.from(map.entries()).map(([taskId, evts]) => ({
      taskId: taskId === "__general__" ? null : taskId,
      events: evts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    }));
  }, [events]);

  if (events.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-muted-foreground/70", className)}>
        <Clock className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No activity yet</p>
        <p className="text-xs mt-1">Events will appear here as the agent works</p>
      </div>
    );
  }

  // Compute time range for positioning
  const minT = Math.min(...events.map((e) => e.timestamp.getTime()));
  const maxT = Math.max(...events.map((e) => e.timestamp.getTime()));
  const range = maxT - minT || 1;
  const timelineWidth = Math.max(800, events.length * 100) * zoom;

  const getX = (t: Date) => {
    const pct = (t.getTime() - minT) / range;
    return 60 + pct * (timelineWidth - 120); // padding on sides
  };

  const latestId = events[events.length - 1]?.id;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Zoom controls */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground/70 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal scroll container — desktop */}
      <div
        ref={scrollRef}
        className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent rounded-lg bg-muted/30 border border-border"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div style={{ width: timelineWidth, minHeight: lanes.length * 72 + 48 }} className="relative py-4">
          {/* Lanes */}
          {lanes.map((lane, laneIdx) => {
            const y = 24 + laneIdx * 72;
            const laneEvents = lane.events;

            return (
              <div key={lane.taskId ?? "general"} className="absolute" style={{ top: y, left: 0, right: 0, height: 60 }}>
                {/* Lane label */}
                <div className="absolute -left-0 top-1/2 -translate-y-1/2 pl-2">
                  <span className="text-[10px] font-mono text-muted-foreground/60 bg-card/80 px-1.5 py-0.5 rounded">
                    {lane.taskId ?? "general"}
                  </span>
                </div>

                {/* Connector lines */}
                {laneEvents.map((ev, i) => {
                  if (i === 0) return null;
                  const x1 = getX(laneEvents[i - 1].timestamp);
                  const x2 = getX(ev.timestamp);
                  return (
                    <div
                      key={`line-${ev.id}`}
                      className="absolute top-1/2 h-px bg-border/60"
                      style={{ left: x1 + 20, width: x2 - x1 - 40, transform: "translateY(-12px)" }}
                    />
                  );
                })}

                {/* Event nodes */}
                {laneEvents.map((ev) => (
                  <div key={ev.id} className="absolute" style={{ left: getX(ev.timestamp) - 20, top: 0 }}>
                    <EventNode
                      event={ev}
                      isSelected={selectedId === ev.id}
                      isLatest={ev.id === latestId}
                      onClick={() => setSelectedId(selectedId === ev.id ? null : ev.id)}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected event detail — rendered outside the scroll area so it never clips */}
      <AnimatePresence mode="wait">
        {selectedId && (() => {
          const ev = events.find((e) => e.id === selectedId);
          return ev ? <EventDetail key={ev.id} event={ev} /> : null;
        })()}
      </AnimatePresence>

      {/* Vertical mobile layout */}
      <div className="md:hidden flex flex-col gap-3">
        {events
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          .map((ev, i) => {
            const cfg = eventConfig[ev.type];
            const Icon = cfg.icon;
            const isLast = i === events.length - 1;

            return (
              <div key={ev.id} className="flex gap-3">
                {/* Vertical line + node */}
                <div className="flex flex-col items-center">
                  <motion.div
                    className={cn("flex items-center justify-center w-8 h-8 rounded-full border", cfg.bg, cfg.border)}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isLast && (
                      <motion.div
                        className={cn("absolute inset-0 rounded-full", cfg.bg)}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                  </motion.div>
                  {i < events.length - 1 && <div className="w-px flex-1 bg-border/40 min-h-[16px]" />}
                </div>

                {/* Content */}
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
                    {ev.taskId && <span className="text-[10px] text-muted-foreground/60 font-mono">{ev.taskId}</span>}
                    <span className="text-[10px] text-muted-foreground/70 ml-auto">
                      {ev.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{ev.title}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{ev.description}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
