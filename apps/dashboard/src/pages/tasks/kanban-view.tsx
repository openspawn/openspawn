import { AnimatePresence } from "motion/react";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import type { Task } from "../../hooks";
import { statusColumns, type AgentAvatarMap } from "./task-helpers";
import { TaskCard } from "./task-card";

function KanbanView({
  tasks,
  onTaskClick,
  agentMap,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  agentMap: AgentAvatarMap;
}) {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none scrollbar-hide">
      {statusColumns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status?.toUpperCase() === column.id);
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-[75vw] sm:w-[280px] md:w-72 snap-center sm:snap-start"
          >
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
              <div className={`w-2 h-2 rounded-full ${column.color}`} />
              <h3 className="font-medium text-sm">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {columnTasks.length}
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-400px)] sm:h-[calc(100vh-360px)] md:h-[calc(100vh-320px)]">
              <div className="space-y-2 pr-2">
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                      compact
                      agentMap={agentMap}
                    />
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

export { KanbanView };
