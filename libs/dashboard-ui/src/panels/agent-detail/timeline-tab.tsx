import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Settings, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import type { AgentDetailTimelineEvent } from "./types";

function getEventIcon(type: string): ReactNode {
  switch (type) {
    case "task_completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "task_assigned":
      return <Zap className="h-4 w-4 text-amber-500" />;
    case "message":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "escalation":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "settings_changed":
      return <Settings className="h-4 w-4 text-violet-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getEventColor(type: string): string {
  switch (type) {
    case "task_completed":
      return "border-emerald-500/30";
    case "task_assigned":
      return "border-amber-500/30";
    case "message":
      return "border-blue-500/30";
    case "escalation":
      return "border-orange-500/30";
    case "settings_changed":
      return "border-violet-500/30";
    default:
      return "border-border";
  }
}

interface TimelineTabProps {
  events: AgentDetailTimelineEvent[];
}

export function TimelineTab({ events }: TimelineTabProps) {
  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No timeline events yet</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative pl-12"
          >
            {/* Icon dot */}
            <div className="absolute left-3 top-3 flex items-center justify-center w-5 h-5 rounded-full bg-background border border-border">
              {getEventIcon(event.type)}
            </div>

            {/* Event card */}
            <div className={cn("p-3 rounded-lg border bg-card", getEventColor(event.type))}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium">{event.title}</h4>
                <span className="text-xs text-muted-foreground shrink-0">
                  {event.timestamp.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
