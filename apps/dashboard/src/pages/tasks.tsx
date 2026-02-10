import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter, Search, GripVertical, X, Clock, User, Coins, Calendar, FileText, CheckCircle2, ArrowUpDown, AlertTriangle, RefreshCw, ShieldAlert, History, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { PhaseChip } from "../components/phase-chip";
import { EmptyState } from "../components/ui/empty-state";
import { useTasks, type Task, useCurrentPhase } from "../hooks";

type SortField = "created" | "priority" | "status" | "title";
type SortDirection = "asc" | "desc";

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

function getPriorityColor(priority: string) {
  switch (priority?.toUpperCase()) {
    case "URGENT":
      return "text-rose-500";
    case "HIGH":
      return "text-violet-500";
    case "NORMAL":
      return "text-blue-500";
    case "LOW":
      return "text-slate-400";
    default:
      return "text-muted-foreground";
  }
}

function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "DONE":
      return "text-emerald-500";
    case "IN_PROGRESS":
      return "text-cyan-500";
    case "REVIEW":
      return "text-violet-500";
    case "TODO":
      return "text-amber-500";
    case "BACKLOG":
      return "text-slate-400";
    case "BLOCKED":
      return "text-rose-500";
    default:
      return "text-muted-foreground";
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

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  compact?: boolean;
}

function TaskCard({ task, onClick, compact }: TaskCardProps) {
  const dueDate = formatDate(task.dueDate);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const hasRejection = task.rejection && task.status === "REVIEW";
  const createdViaWebhook = task.metadata?.createdViaWebhook === true;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
    >
      <Card className={`cursor-pointer transition-all hover:bg-accent/50 hover:shadow-md hover:border-primary/20 ${
        hasRejection ? 'border-amber-500/50 bg-amber-500/5' : ''
      }`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header: ID + Priority */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  {task.identifier}
                </span>
                <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                  {task.priority?.toLowerCase()}
                </Badge>
                {task.approvalRequired && (
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                    approval
                  </Badge>
                )}
                {createdViaWebhook && (
                  <Badge variant="outline" className="text-xs text-cyan-500 border-cyan-500/30">
                    <Webhook className="w-3 h-3 mr-1" />
                    webhook
                  </Badge>
                )}
                {hasRejection && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/50 bg-amber-500/10 animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    needs fixes
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              <p className="text-sm font-medium leading-tight">{task.title}</p>
              
              {/* Rejection feedback preview */}
              {hasRejection && task.rejection && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1.5">
                  <p className="text-xs text-amber-600 dark:text-amber-400 line-clamp-2">
                    <ShieldAlert className="w-3 h-3 inline mr-1" />
                    {task.rejection.feedback}
                  </p>
                </div>
              )}
              
              {/* Meta row: Assignee, Due date */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {task.assignee ? (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                      🤖
                    </div>
                    <span className="truncate max-w-[100px]">{task.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/50 italic">Unassigned</span>
                )}
                
                {dueDate && (
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                    <Clock className="w-3 h-3" />
                    <span>{dueDate}</span>
                  </div>
                )}
                
                {task.rejection?.rejectionCount && task.rejection.rejectionCount > 1 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <History className="w-3 h-3" />
                    <span>{task.rejection.rejectionCount}x</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface TaskDetailSidebarProps {
  task: Task;
  onClose: () => void;
}

function TaskDetailSidebar({ task, onClose }: TaskDetailSidebarProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const hasRejection = task.rejection && task.status === "REVIEW";
  
  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-background border-l border-border shadow-xl z-30 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{task.identifier}</span>
          <Badge variant={getPriorityVariant(task.priority)}>
            {task.priority?.toLowerCase()}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Rejection Banner */}
      {hasRejection && task.rejection && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-b border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-500/20 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-600 dark:text-amber-400">
                  Completion Rejected
                </h3>
                <p className="text-xs text-muted-foreground">
                  by {task.rejection.rejectedBy} • {formatFullDate(task.rejection.rejectedAt)}
                </p>
              </div>
              {task.rejection.rejectionCount > 1 && (
                <Badge variant="outline" className="ml-auto text-amber-500 border-amber-500/50">
                  <History className="w-3 h-3 mr-1" />
                  {task.rejection.rejectionCount} rejections
                </Badge>
              )}
            </div>
            
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Required Fixes
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {task.rejection.feedback}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                <RefreshCw className="w-3 h-3 mr-1" />
                Resume Work
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold">{task.title}</h2>
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-4 flex-wrap">
            <Badge 
              variant={task.status === "DONE" ? "success" : hasRejection ? "warning" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {hasRejection ? (
                <AlertTriangle className="w-3 h-3 mr-1" />
              ) : (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              )}
              {task.status?.replace("_", " ")}
            </Badge>
            {task.approvalRequired && !task.approvedAt && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                Needs Approval
              </Badge>
            )}
          </div>
          
          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4" />
                Description
              </div>
              <p className="text-sm leading-relaxed bg-muted/50 rounded-lg p-3">
                {task.description}
              </p>
            </div>
          )}
          
          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <User className="w-3 h-3" />
                Assignee
              </div>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                    🤖
                  </div>
                  <span className="text-sm font-medium">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">Unassigned</span>
              )}
            </div>
            
            {/* Due Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Due Date
              </div>
              <span className={`text-sm font-medium ${isOverdue ? 'text-red-500' : ''}`}>
                {task.dueDate ? formatDate(task.dueDate) : "—"}
              </span>
            </div>
            
            {/* Created */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="w-3 h-3" />
                Created
              </div>
              <span className="text-sm">{formatFullDate(task.createdAt)}</span>
            </div>
            
            {/* Completed */}
            {task.completedAt && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </div>
                <span className="text-sm">{formatFullDate(task.completedAt)}</span>
              </div>
            )}
          </div>
          
          {/* Approval Info */}
          {task.approvalRequired && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
                <Coins className="w-4 h-4" />
                Approval Required
              </div>
              <p className="text-xs text-muted-foreground">
                {task.approvedAt 
                  ? `Approved on ${formatFullDate(task.approvedAt)}`
                  : "This task requires approval before completion."}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {hasRejection ? (
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Resume Work
            </Button>
          ) : (
            <Button className="flex-1">
              Edit Task
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function KanbanView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (task: Task) => void }) {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
      {statusColumns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status?.toUpperCase() === column.id);
        return (
          <div key={column.id} className="flex-shrink-0 w-[280px] sm:w-72 snap-start">
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
              <div className={`w-2 h-2 rounded-full ${column.color}`} />
              <h3 className="font-medium text-sm">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {columnTasks.length}
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-360px)] sm:h-[calc(100vh-320px)]">
              <div className="space-y-2 pr-2">
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                  ))}
                </AnimatePresence>
                {columnTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">No tasks</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTaskId?: string;
}

function ListView({ tasks, onTaskClick, selectedTaskId }: ListViewProps) {
  return (
    <Card>
      <div className="divide-y divide-border">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => {
            const dueDate = formatDate(task.dueDate);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
            const isSelected = task.id === selectedTaskId;
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={() => onTaskClick(task)}
                className={`flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                  isSelected ? "bg-accent/70 border-l-2 border-l-primary" : ""
                }`}
              >
                <span className="font-mono text-sm text-muted-foreground w-20 flex-shrink-0">
                  {task.identifier}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                </div>
                <Badge variant={getPriorityVariant(task.priority)} className="flex-shrink-0">
                  {task.priority?.toLowerCase()}
                </Badge>
                <Badge
                  variant={task.status === "DONE" ? "success" : "secondary"}
                  className="w-24 justify-center flex-shrink-0"
                >
                  {task.status?.replace("_", " ").toLowerCase()}
                </Badge>
                {task.assignee ? (
                  <div className="flex items-center gap-1 w-28 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                      🤖
                    </div>
                    <span className="text-sm text-muted-foreground truncate">
                      {task.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground/50 w-28 flex-shrink-0 italic">
                    Unassigned
                  </span>
                )}
                {dueDate && (
                  <span className={`text-xs w-16 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {dueDate}
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No tasks found</p>
          </div>
        )}
      </div>
    </Card>
  );
}

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

export function TasksPage() {
  const { tasks, loading, error } = useTasks();
  const { currentPhase } = useCurrentPhase();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Filter & Sort state for List view
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc"); // newest first by default

  // Filter and sort tasks for list view
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.identifier.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(t => t.status?.toUpperCase() === statusFilter);
    }
    
    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter(t => t.priority?.toUpperCase() === priorityFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "created":
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case "priority":
          comparison = (PRIORITY_ORDER[a.priority?.toUpperCase() || "NORMAL"] || 2) - 
                       (PRIORITY_ORDER[b.priority?.toUpperCase() || "NORMAL"] || 2);
          break;
        case "status":
          comparison = (STATUS_ORDER[a.status?.toUpperCase() || "BACKLOG"] || 3) - 
                       (STATUS_ORDER[b.status?.toUpperCase() || "BACKLOG"] || 3);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });
    
    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortField, sortDirection]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function handleTaskClick(task: Task) {
    // Just update selected task - don't close sidebar
    setSelectedTask(task);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-destructive">Error loading tasks</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 transition-all ${selectedTask ? "mr-0 sm:mr-[400px]" : ""}`}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track agent tasks
            </p>
          </div>
          {currentPhase && <PhaseChip phase={currentPhase} />}
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* View toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="mt-4">
          <KanbanView tasks={tasks} onTaskClick={handleTaskClick} />
        </TabsContent>
        
        <TabsContent value="list" className="mt-4 space-y-4">
          {/* Filters and Sort for List view */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
            
            {/* Sort buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-sm text-muted-foreground">Sort:</span>
              {(["created", "priority", "status", "title"] as SortField[]).map((field) => (
                <Button
                  key={field}
                  variant={sortField === field ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleSort(field)}
                  className="capitalize"
                >
                  {field === "created" ? "Date" : field}
                  {sortField === field && (
                    <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
          </div>
          
          <ListView 
            tasks={filteredAndSortedTasks} 
            onTaskClick={handleTaskClick}
            selectedTaskId={selectedTask?.id}
          />
        </TabsContent>
      </Tabs>
      
      {/* Task Detail Sidebar - no backdrop, stays open */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailSidebar 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
