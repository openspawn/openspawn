import { useState } from "react";
import { Plus, Filter, Search, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { useTasks } from "../hooks/use-tasks";

const statusColumns = [
  { id: "backlog", label: "Backlog", color: "bg-slate-500" },
  { id: "pending", label: "Pending", color: "bg-yellow-500" },
  { id: "assigned", label: "Assigned", color: "bg-blue-500" },
  { id: "in_progress", label: "In Progress", color: "bg-purple-500" },
  { id: "review", label: "Review", color: "bg-orange-500" },
  { id: "done", label: "Done", color: "bg-emerald-500" },
];

function getPriorityVariant(priority: string) {
  switch (priority) {
    case "critical":
      return "destructive";
    case "high":
      return "warning";
    case "normal":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "secondary";
  }
}

interface Task {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  assignee?: { name: string } | null;
}

function TaskCard({ task }: { task: Task }) {
  return (
    <Card className="cursor-pointer transition-colors hover:bg-accent/50">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                {task.identifier}
              </span>
              <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
            </div>
            <p className="text-sm font-medium truncate">{task.title}</p>
            {task.assignee && (
              <p className="text-xs text-muted-foreground mt-1">
                → {task.assignee.name}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusColumns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
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
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
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

function ListView({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <div className="divide-y divide-border">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
          >
            <span className="font-mono text-sm text-muted-foreground w-24">
              {task.identifier}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{task.title}</p>
            </div>
            <Badge variant={getPriorityVariant(task.priority)}>
              {task.priority}
            </Badge>
            <Badge
              variant={task.status === "done" ? "success" : "secondary"}
              className="w-24 justify-center"
            >
              {task.status.replace("_", " ")}
            </Badge>
            {task.assignee ? (
              <span className="text-sm text-muted-foreground w-32 truncate">
                {task.assignee.name}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground/50 w-32">
                Unassigned
              </span>
            )}
          </div>
        ))}
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
          <KanbanView tasks={tasks} />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <ListView tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
