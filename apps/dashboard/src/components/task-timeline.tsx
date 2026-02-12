/**
 * Task Timeline — horizontal timeline showing task lifecycle events.
 * Shows: created → assigned → started → messages → completed/rejected
 * Click any node to see details. Supports drill-down into agent detail.
 */
import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  UserPlus,
  Play,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AgentAvatar } from './agent-avatar';
import { cn } from '../lib/utils';
import { useAgents, useTasks, useMessages, useEvents } from '../hooks';
import type { Task } from '../hooks/use-tasks';
import type { Message } from '../hooks/use-messages';
import { getStatusVariant } from '../lib/status-colors';

// ── Timeline event types ────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  type: 'created' | 'assigned' | 'started' | 'message' | 'completed' | 'rejected' | 'review';
  timestamp: string;
  label: string;
  detail?: string;
  agentId?: string;
  agentName?: string;
  icon: typeof Plus;
  color: string;
}

function buildTimelineEvents(task: Task, messages: Message[], agentMap: Map<string, { name: string; level: number }>): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Created
  events.push({
    id: `${task.id}-created`,
    type: 'created',
    timestamp: task.createdAt,
    label: 'Task Created',
    detail: task.title,
    agentId: task.creatorId,
    agentName: agentMap.get(task.creatorId)?.name || 'System',
    icon: Plus,
    color: '#06b6d4',
  });

  // Assigned (if has assignee and different from creator)
  if (task.assigneeId) {
    const assignTime = new Date(new Date(task.createdAt).getTime() + 30000).toISOString();
    events.push({
      id: `${task.id}-assigned`,
      type: 'assigned',
      timestamp: assignTime,
      label: 'Assigned',
      detail: `to ${agentMap.get(task.assigneeId)?.name || 'agent'}`,
      agentId: task.assigneeId,
      agentName: agentMap.get(task.assigneeId)?.name,
      icon: UserPlus,
      color: '#8b5cf6',
    });
  }

  // Started (infer from status being beyond 'pending')
  if (task.status !== 'pending' && task.status !== 'open') {
    const startTime = new Date(new Date(task.createdAt).getTime() + 60000).toISOString();
    events.push({
      id: `${task.id}-started`,
      type: 'started',
      timestamp: startTime,
      label: 'Work Started',
      agentId: task.assigneeId || undefined,
      agentName: task.assigneeId ? agentMap.get(task.assigneeId)?.name : undefined,
      icon: Play,
      color: '#10b981',
    });
  }

  // Messages related to this task
  const taskMessages = messages
    .filter((m) => m.taskRef === task.identifier)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  taskMessages.slice(0, 5).forEach((msg, i) => {
    events.push({
      id: `${task.id}-msg-${i}`,
      type: 'message',
      timestamp: msg.createdAt,
      label: `Message from ${agentMap.get(msg.fromAgentId)?.name || 'agent'}`,
      detail: msg.content.slice(0, 80) + (msg.content.length > 80 ? '…' : ''),
      agentId: msg.fromAgentId,
      agentName: agentMap.get(msg.fromAgentId)?.name,
      icon: MessageSquare,
      color: '#f59e0b',
    });
  });

  if (taskMessages.length > 5) {
    events.push({
      id: `${task.id}-msg-more`,
      type: 'message',
      timestamp: taskMessages[5].createdAt,
      label: `+${taskMessages.length - 5} more messages`,
      icon: MessageSquare,
      color: '#f59e0b',
    });
  }

  // Review
  if (task.status === 'review') {
    events.push({
      id: `${task.id}-review`,
      type: 'review',
      timestamp: task.updatedAt,
      label: 'In Review',
      icon: Clock,
      color: '#f97316',
    });
  }

  // Completed
  if (task.completedAt) {
    events.push({
      id: `${task.id}-completed`,
      type: 'completed',
      timestamp: task.completedAt,
      label: 'Completed',
      icon: CheckCircle2,
      color: '#10b981',
    });
  }

  // Rejected
  if (task.rejection) {
    events.push({
      id: `${task.id}-rejected`,
      type: 'rejected',
      timestamp: task.updatedAt,
      label: 'Rejected',
      detail: task.rejection.reason || undefined,
      icon: XCircle,
      color: '#ef4444',
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ── Timeline node ───────────────────────────────────────────────────────────

function TimelineNode({
  event,
  isFirst,
  isLast,
  isSelected,
  onClick,
}: {
  event: TimelineEvent;
  isFirst: boolean;
  isLast: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = event.icon;

  return (
    <div className="flex flex-col items-center relative min-w-[80px]">
      {/* Connector line (left) */}
      {!isFirst && (
        <div
          className="absolute top-5 right-1/2 h-0.5 w-full -translate-x-0"
          style={{ backgroundColor: `${event.color}30` }}
        />
      )}
      {/* Connector line (right) */}
      {!isLast && (
        <div
          className="absolute top-5 left-1/2 h-0.5 w-full translate-x-0"
          style={{ backgroundColor: `${event.color}30` }}
        />
      )}

      {/* Node */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
          isSelected
            ? 'ring-2 ring-offset-2 ring-offset-background'
            : 'hover:ring-1 hover:ring-offset-1 hover:ring-offset-background',
        )}
        style={{
          borderColor: event.color,
          backgroundColor: isSelected ? event.color : `${event.color}15`,
          color: isSelected ? 'white' : event.color,
          // ring color matches event
          ...(isSelected ? { ['--tw-ring-color' as string]: event.color } : {}),
        }}
      >
        <Icon className="h-4 w-4" />
      </motion.button>

      {/* Label */}
      <span className="mt-2 text-[10px] font-medium text-muted-foreground text-center max-w-[80px] leading-tight">
        {event.label}
      </span>

      {/* Time */}
      <span className="text-[9px] text-muted-foreground/60 mt-0.5">
        {formatShortTime(event.timestamp)}
      </span>
    </div>
  );
}

function formatShortTime(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDuration(startStr: string, endStr: string) {
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

// ── Single task timeline row ────────────────────────────────────────────────

function TaskTimelineRow({
  task,
  messages,
  agentMap,
  onAgentClick,
  defaultOpen,
}: {
  task: Task;
  messages: Message[];
  agentMap: Map<string, { name: string; level: number }>;
  onAgentClick?: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const events = useMemo(
    () => buildTimelineEvents(task, messages, agentMap),
    [task, messages, agentMap],
  );

  const duration =
    task.completedAt
      ? formatDuration(task.createdAt, task.completedAt)
      : formatDuration(task.createdAt, new Date().toISOString());

  return (
    <Card className={cn('transition-all', open && 'ring-1 ring-primary/20')}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-accent/30 transition-colors rounded-t-lg"
      >
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>

        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
          {task.identifier}
        </Badge>

        <span className="font-medium text-sm truncate flex-1">{task.title}</span>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">{duration}</span>
          <Badge variant={getStatusVariant(task.status)} className="text-[10px]">
            {task.status}
          </Badge>
          {task.assigneeId && (
            <AgentAvatar
              agentId={agentMap.get(task.assigneeId)?.name || task.assigneeId}
              name={agentMap.get(task.assigneeId)?.name || '?'}
              level={agentMap.get(task.assigneeId)?.level || 1}
              size="xs"
              avatar={(agentMap.get(task.assigneeId) as any)?.avatar}
              avatarColor={(agentMap.get(task.assigneeId) as any)?.avatarColor}
            />
          )}
        </div>
      </button>

      {/* Timeline — expanded */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3 sm:px-4 py-4">
              {/* Horizontal scrollable timeline */}
              <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide"
              >
                {events.map((event, i) => (
                  <TimelineNode
                    key={event.id}
                    event={event}
                    isFirst={i === 0}
                    isLast={i === events.length - 1}
                    isSelected={selectedEvent?.id === event.id}
                    onClick={() =>
                      setSelectedEvent((prev) =>
                        prev?.id === event.id ? null : event,
                      )
                    }
                  />
                ))}
              </div>

              {/* Selected event detail */}
              <AnimatePresence mode="wait">
                {selectedEvent && (
                  <motion.div
                    key={selectedEvent.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="mt-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color }}
                      >
                        <selectedEvent.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-sm">{selectedEvent.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(selectedEvent.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {selectedEvent.detail && (
                      <p className="text-xs text-muted-foreground mt-1 pl-8">
                        {selectedEvent.detail}
                      </p>
                    )}
                    {selectedEvent.agentId && onAgentClick && (
                      <button
                        onClick={() => onAgentClick(selectedEvent.agentId!)}
                        className="mt-2 pl-8 text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View {selectedEvent.agentName || 'agent'} <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ── Main Timeline View ──────────────────────────────────────────────────────

export function TaskTimeline({
  onAgentClick,
}: {
  onAgentClick?: (id: string) => void;
}) {
  const { tasks } = useTasks();
  const { messages } = useMessages(200);
  const { agents } = useAgents();
  const [filter, setFilter] = useState<string>('all');
  const [limit, setLimit] = useState(10);

  const agentMap = useMemo(() => {
    const map = new Map<string, { name: string; level: number }>();
    agents.forEach((a) => map.set(a.id, { name: a.name, level: a.level }));
    return map;
  }, [agents]);

  // Sort tasks by most recently updated
  const sortedTasks = useMemo(() => {
    let filtered = [...tasks];
    if (filter !== 'all') {
      filtered = filtered.filter((t) => t.status === filter);
    }
    return filtered
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [tasks, filter, limit]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No tasks to display. Start the simulation to see task timelines.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="shrink-0"
        >
          All ({tasks.length})
        </Button>
        {Object.entries(statusCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([status, count]) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="shrink-0 capitalize"
            >
              {status} ({count})
            </Button>
          ))}
      </div>

      {/* Task timelines */}
      <div className="space-y-3">
        {sortedTasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <TaskTimelineRow
              task={task}
              messages={messages}
              agentMap={agentMap}
              onAgentClick={onAgentClick}
              defaultOpen={i === 0}
            />
          </motion.div>
        ))}
      </div>

      {/* Load more */}
      {sortedTasks.length >= limit && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + 10)}>
            <ChevronDown className="h-4 w-4 mr-1" />
            Load more tasks
          </Button>
        </div>
      )}
    </div>
  );
}
