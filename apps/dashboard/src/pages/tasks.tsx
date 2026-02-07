import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter, Search, GripVertical, X, Clock, User, Coins, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { useTasks, type Task } from "../hooks/use-tasks";

const statusColumns = [
  { id: "BACKLOG", label: "Backlog", color: "bg-slate-500" },
  { id: "TODO", label: "To Do", color: "bg-yellow-500" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-purple-500" },
  { id: "REVIEW", label: "Review", color: "bg-orange-500" },
  { id: "DONE", label: "Done", color: "bg-emerald-500" },
  { id: "BLOCKED", label: "Blocked", color: "bg-red-500" },
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
      return "text-red-500";
    case "HIGH":
      return "text-orange-500";
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
      return "text-purple-500";
    case "REVIEW":
      return "text-orange-500";
    case "TODO":
      return "text-yellow-500";
    case "BACKLOG":
      return "text-slate-400";
    case "BLOCKED":
      return "text-red-500";
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
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
    >
      <Card className="cursor-pointer transition-all hover:bg-accent/50 hover:shadow-md hover:border-primary/20">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header: ID + Priority */}
              <div className="flex items-center gap-2">
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
              </div>
              
              {/* Title */}
              <p className="text-sm font-medium leading-tight">{task.title}</p>
              
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
  
  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-background border-l border-border shadow-xl z-50 flex flex-col"
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
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold">{task.title}</h2>
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-4">
            <Badge 
              variant={task.status === "DONE" ? "success" : "secondary"}
              className="text-sm px-3 py-1"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
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
          <Button className="flex-1">
            Edit Task
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function KanbanView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (task: Task) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusColumns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status?.toUpperCase() === column.id);
        return (
          <div key={column.id} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${column.color}`} />
              <h3 className="font-medium text-sm">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {columnTasks.length}
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-320px)]">
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

function ListView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (task: Task) => void }) {
  return (
    <Card>
      <div className="divide-y divide-border">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => {
            const dueDate = formatDate(task.dueDate);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={() => onTaskClick(task)}
                className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors cursor-pointer"
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

export function TasksPage() {
  const { tasks, loading, error } = useTasks();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track agent tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* View toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-4">
          <KanbanView tasks={tasks} onTaskClick={setSelectedTask} />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <ListView tasks={tasks} onTaskClick={setSelectedTask} />
        </TabsContent>
      </Tabs>
      
      {/* Task Detail Sidebar */}
      <AnimatePresence>
        {selectedTask && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <TaskDetailSidebar 
              task={selectedTask} 
              onClose={() => setSelectedTask(null)} 
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
