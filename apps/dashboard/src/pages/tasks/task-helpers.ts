const statusColumns = [
  { id: "BACKLOG", label: "Backlog", color: "bg-slate-500" },
  { id: "TODO", label: "To Do", color: "bg-amber-500" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-cyan-500" },
  { id: "REVIEW", label: "Review", color: "bg-violet-500" },
  { id: "DONE", label: "Done", color: "bg-emerald-500" },
  { id: "BLOCKED", label: "Blocked", color: "bg-rose-500" },
];

function getPriorityVariant(priority: string) {
  switch (priority?.toUpperCase()) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "warning";
    case "NORMAL":
      return "secondary";
    case "LOW":
      return "outline";
    default:
      return "secondary";
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type AgentAvatarMap = Map<
  string,
  { avatar?: string | null; avatarColor?: string | null; avatarUrl?: string | null }
>;

// Priority order for sorting
const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

// Status order for sorting
const STATUS_ORDER: Record<string, number> = {
  IN_PROGRESS: 0,
  REVIEW: 1,
  TODO: 2,
  BACKLOG: 3,
  BLOCKED: 4,
  DONE: 5,
  CANCELLED: 6,
};

export {
  statusColumns,
  getPriorityVariant,
  formatDate,
  formatFullDate,
  PRIORITY_ORDER,
  STATUS_ORDER,
};
export type { AgentAvatarMap };
