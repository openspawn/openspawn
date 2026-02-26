import { useState, useMemo } from 'react';
import { useMcpTasks, type KanbanTask, type TaskStatus, type TaskPriority } from '../../hooks/use-mcp-tasks';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { Clock, User, X, AlertTriangle, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';

const COLUMNS: { key: TaskStatus; label: string; color: string; bg: string; border: string }[] = [
  { key: 'open', label: 'Open', color: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-500/20' },
  { key: 'claimed', label: 'Claimed', color: 'text-violet-400', bg: 'bg-violet-500/5', border: 'border-violet-500/20' },
  { key: 'in_progress', label: 'In Progress', color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20' },
  { key: 'review', label: 'Review', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
  { key: 'done', label: 'Done', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
];

const PRIORITY_STYLES: Record<TaskPriority, { badge: string; glow?: string }> = {
  low: { badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  normal: { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  high: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  critical: { badge: 'bg-red-500/20 text-red-300 border-red-500/30', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]' },
};

const AVATAR_COLORS: Record<string, string> = {
  'SpongeBob': 'bg-yellow-500',
  'Patrick': 'bg-pink-400',
  'Squidward': 'bg-teal-500',
  'Sandy': 'bg-amber-600',
  'Mr. Krabs': 'bg-red-500',
  'Plankton': 'bg-green-600',
  'Gary': 'bg-blue-400',
  'Karen': 'bg-purple-500',
};

function getInitials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function TaskCard({ task, onClick }: { task: KanbanTask; onClick: () => void }) {
  const ps = PRIORITY_STYLES[task.priority];
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border border-white/5 bg-[var(--card)] p-3 transition-all duration-200',
        'hover:border-cyan-500/30 hover:bg-[var(--card)]/80 hover:translate-y-[-1px] hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/40',
        ps.glow,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-[var(--foreground)] leading-tight line-clamp-2">{task.title}</span>
        <span className={cn('shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border', ps.badge)}>
          {task.priority}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {task.assignee && (
          <span className="flex items-center gap-1">
            <span className={cn('inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white', AVATAR_COLORS[task.assignee] || 'bg-slate-500')}>
              {getInitials(task.assignee)}
            </span>
            <span className="truncate max-w-[80px]">{task.assignee}</span>
          </span>
        )}
        <span className="flex items-center gap-0.5 ml-auto">
          <Clock className="w-3 h-3" />
          {timeAgo(task.updatedAt)}
        </span>
      </div>
    </button>
  );
}

function TaskDetail({ task, onClose }: { task: KanbanTask; onClose: () => void }) {
  const ps = PRIORITY_STYLES[task.priority];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[var(--card)] border border-white/10 rounded-xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{task.title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={cn('text-xs font-semibold px-2 py-1 rounded border', ps.badge)}>{task.priority}</span>
          <Badge variant="outline" className="text-xs">{task.status.replace('_', ' ')}</Badge>
        </div>
        {task.description && <p className="text-sm text-muted-foreground mb-4">{task.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {task.assignee && (
            <div>
              <span className="text-muted-foreground">Assignee</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white', AVATAR_COLORS[task.assignee] || 'bg-slate-500')}>
                  {getInitials(task.assignee)}
                </span>
                {task.assignee}
              </div>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Created</span>
            <div className="mt-1">{new Date(task.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Updated</span>
            <div className="mt-1">{timeAgo(task.updatedAt)} ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { tasks, connected, error } = useMcpTasks();
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<Set<TaskStatus>>(new Set());

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, KanbanTask[]> = { open: [], claimed: [], in_progress: [], review: [], done: [] };
    for (const t of tasks) {
      (map[t.status] ??= []).push(t);
    }
    // Sort by priority within each column
    const order: Record<TaskPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
    for (const col of Object.values(map)) {
      col.sort((a, b) => order[a.priority] - order[b.priority]);
    }
    return map;
  }, [tasks]);

  const toggleCol = (key: TaskStatus) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border', connected ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10')}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'MCP Connected' : 'Demo Data'}
          </span>
          <span className="text-xs text-muted-foreground">{tasks.length} tasks</span>
        </div>
      </div>

      {/* Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none min-h-[400px]">
        {COLUMNS.map(col => {
          const items = grouped[col.key];
          const collapsed = collapsedCols.has(col.key);
          return (
            <div
              key={col.key}
              className={cn(
                'flex-shrink-0 w-[280px] md:w-auto md:flex-1 rounded-xl border p-3 snap-center transition-colors duration-200',
                col.bg, col.border,
              )}
            >
              {/* Column header */}
              <button
                onClick={() => toggleCol(col.key)}
                className="flex items-center justify-between w-full mb-3 group"
              >
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
                  <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-full">{items.length}</span>
                </div>
                {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>

              {/* Cards */}
              {!collapsed && (
                <div className="space-y-2">
                  {items.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6 opacity-50">No tasks</div>
                  )}
                  {items.map(task => (
                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

export default KanbanBoard;
