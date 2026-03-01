import { useMemo } from 'react';
import { useRepoTasks, type RepoTask, type RepoTaskStatus } from '../hooks/use-repo-tasks';
import { PageHeader } from '../components/ui/page-header';
import { Badge } from '../components/ui/badge';
import { Clock, User, ExternalLink, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

/* ── Column config ── */
type Column = { key: RepoTaskStatus[]; label: string; color: string; bg: string; border: string };

const COLUMNS: Column[] = [
  { key: ['open', 'blocked'], label: 'Open', color: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-500/20' },
  { key: ['claimed', 'in-progress'], label: 'In Progress', color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20' },
  { key: ['done'], label: 'Done', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
];

const STATUS_BADGE: Record<RepoTaskStatus, { class: string; label: string }> = {
  open: { class: 'bg-slate-500/20 text-slate-300 border-slate-500/30', label: 'open' },
  claimed: { class: 'bg-violet-500/20 text-violet-300 border-violet-500/30', label: 'claimed' },
  'in-progress': { class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'in progress' },
  done: { class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'done' },
  blocked: { class: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'blocked' },
};

/* ── Helpers ── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── TaskCard ── */
function TaskCard({ task }: { task: RepoTask }) {
  const badge = STATUS_BADGE[task.status];
  return (
    <div className={cn(
      'rounded-lg border border-white/5 bg-[var(--card)] p-3 space-y-2 transition-all duration-200',
      'hover:border-cyan-500/30 hover:bg-[var(--card)]/80 hover:translate-y-[-1px] hover:shadow-lg',
    )}>
      {/* Header: ID + status */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground">🔧 {task.id}</span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', badge.class)}>
          {badge.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm font-medium text-[var(--foreground)] leading-tight line-clamp-3">
        {task.description}
      </p>

      {/* Blocked warning */}
      {task.status === 'blocked' && (
        <div className="flex items-center gap-1 text-xs text-rose-400">
          <AlertTriangle className="w-3 h-3" />
          <span>Blocked</span>
        </div>
      )}

      {/* Footer: assignee, PR, updated */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {task.assignee}
          </span>
        )}
        {task.pr && (
          <a
            href={`https://github.com/openspawn/openspawn/pull/${task.pr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            PR #{task.pr}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {timeAgo(task.updatedAt)}
        </span>
      </div>

      {/* Budget */}
      {task.budget && (
        <div className="text-[10px] text-muted-foreground/70">
          💰 ${task.budget.spent.toFixed(2)} {task.budget.currency}
        </div>
      )}
    </div>
  );
}

/* ── TaskBoard page ── */
export function TaskBoardPage() {
  const { tasks, loading, source, refetch } = useRepoTasks();

  const grouped = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      tasks: tasks.filter((t) => col.key.includes(t.status)),
    }));
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading repo tasks…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <PageHeader
        title="Task Board"
        description="Tasks from .openspawn/tasks.json — the repo backlog"
        actions={
          <div className="flex items-center gap-3">
            <span className={cn(
              'flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border',
              source === 'github'
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-amber-500/30 text-amber-400 bg-amber-500/10',
            )}>
              {source === 'github' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {source === 'github' ? 'Live' : 'Demo Data'}
            </span>
            <button
              onClick={refetch}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none min-h-[400px]">
        {grouped.map((col) => (
          <div
            key={col.label}
            className={cn(
              'flex-shrink-0 w-[300px] md:w-auto md:flex-1 rounded-xl border p-3 snap-center transition-colors',
              col.bg, col.border,
            )}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
              <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-full">
                {col.tasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {col.tasks.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-8 opacity-50">No tasks</div>
              )}
              {col.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Auto-refreshes every 30s • {tasks.length} total tasks
      </p>
    </div>
  );
}

export default TaskBoardPage;
