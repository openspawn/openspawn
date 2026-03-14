import { useState, useMemo } from "react";
import { Plus, Search, ArrowUpDown, History } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { PageHeader } from "../../components/ui/page-header";
import { PhaseChip } from "../../components/phase-chip";
import { EmptyState } from "../../components/ui/empty-state";
import { useTasks, type Task, useCurrentPhase, useAgents } from "../../hooks";
import { useTeams } from "../../hooks";
import { useSidePanel } from "../../contexts";
import { TeamFilterDropdown } from "../../components/team-badge";
import { TaskTimeline } from "../../components/task-timeline";
import { AgentDetailPanel } from "../../components/agent-detail-panel";
import { SortDirection, TaskSortField } from "../../lib/enums";
import { PRIORITY_ORDER, STATUS_ORDER } from "./task-helpers";
import { TaskDetailSidebar } from "./task-detail-sidebar";
import { KanbanView } from "./kanban-view";
import { ListView } from "./list-view";

export function TasksPage() {
  const { tasks, loading, error } = useTasks();
  const { currentPhase } = useCurrentPhase();
  const [view, setView] = useState<"kanban" | "list" | "timeline">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { openSidePanel, closeSidePanel } = useSidePanel();

  const { agents } = useAgents();
  const agentMap = useMemo(() => {
    const m = new Map<
      string,
      { avatar?: string | null; avatarColor?: string | null; avatarUrl?: string | null }
    >();
    agents.forEach((a) =>
      m.set(a.id, { avatar: a.avatar, avatarColor: a.avatarColor, avatarUrl: a.avatarUrl }),
    );
    return m;
  }, [agents]);
  const { teams: allTeams } = useTeams();

  // Filter & Sort state for List view
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [teamFilterValue, setTeamFilterValue] = useState<string>("all");
  const [sortField, setTaskSortField] = useState<TaskSortField>(TaskSortField.Created);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Desc); // newest first by default

  // Filter and sort tasks for list view
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.identifier.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status?.toUpperCase() === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority?.toUpperCase() === priorityFilter);
    }

    // Team filter — filter tasks whose assignee belongs to the selected team
    if (teamFilterValue !== "all") {
      const teamAgentIds = new Set(
        agents.filter((a) => a.teamId === teamFilterValue).map((a) => a.id),
      );
      result = result.filter((t) => t.assigneeId && teamAgentIds.has(t.assigneeId));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case TaskSortField.Created:
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case TaskSortField.Priority:
          comparison =
            (PRIORITY_ORDER[a.priority?.toUpperCase() || "NORMAL"] || 2) -
            (PRIORITY_ORDER[b.priority?.toUpperCase() || "NORMAL"] || 2);
          break;
        case TaskSortField.Status:
          comparison =
            (STATUS_ORDER[a.status?.toUpperCase() || "BACKLOG"] || 3) -
            (STATUS_ORDER[b.status?.toUpperCase() || "BACKLOG"] || 3);
          break;
        case TaskSortField.Title:
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortDirection === SortDirection.Desc ? -comparison : comparison;
    });

    return result;
  }, [
    tasks,
    agents,
    searchQuery,
    statusFilter,
    priorityFilter,
    teamFilterValue,
    sortField,
    sortDirection,
  ]);

  function handleSort(field: TaskSortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc));
    } else {
      setTaskSortField(field);
      setSortDirection(SortDirection.Desc);
    }
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task);
    openSidePanel(
      <TaskDetailSidebar
        task={task}
        onClose={() => {
          setSelectedTask(null);
          closeSidePanel();
        }}
        agentMap={agentMap}
      />,
      { width: 480 },
    );
  }

  function handleAgentClick(agentId: string) {
    openSidePanel(<AgentDetailPanel agentId={agentId} onClose={closeSidePanel} />, { width: 520 });
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

  if (tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Manage and track agent tasks</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
        <Card>
          <CardContent>
            <EmptyState
              variant="tasks"
              title="No tasks in the queue"
              description="Create your first task to start assigning work to your agents."
              ctaLabel="Create your first task →"
              onCta={() => {
                /* TODO: open create task modal */
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6" data-tour="task-list">
      {/* Page header */}
      <PageHeader
        title="Tasks"
        description="Manage and track agent tasks"
        actions={
          <div className="flex items-center gap-3">
            {currentPhase && <PhaseChip phase={currentPhase} />}
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        }
      />

      {/* View toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list" | "timeline")}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <KanbanView tasks={tasks} onTaskClick={handleTaskClick} agentMap={agentMap} />
        </TabsContent>

        <TabsContent value="list" className="mt-4 space-y-4">
          {/* Filters and Sort for List view */}
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-0 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] sm:min-h-0"
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
                className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] sm:min-h-0"
              >
                <option value="all">All Priority</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>

              {/* Team Filter */}
              <TeamFilterDropdown
                value={teamFilterValue}
                onChange={setTeamFilterValue}
                teams={allTeams}
              />

              {/* Sort buttons */}
              <div className="flex items-center gap-1 sm:ml-auto overflow-x-auto">
                <span className="text-sm text-muted-foreground shrink-0">Sort:</span>
                {(
                  [
                    TaskSortField.Created,
                    TaskSortField.Priority,
                    TaskSortField.Status,
                    TaskSortField.Title,
                  ] as TaskSortField[]
                ).map((field) => (
                  <Button
                    key={field}
                    variant={sortField === field ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleSort(field)}
                    className="capitalize min-h-[44px] sm:min-h-0 shrink-0"
                  >
                    {field === TaskSortField.Created ? "Date" : field}
                    {sortField === field && (
                      <ArrowUpDown
                        className={`ml-1 h-3 w-3 ${sortDirection === SortDirection.Desc ? "rotate-180" : ""}`}
                      />
                    )}
                  </Button>
                ))}
              </div>
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
            agentMap={agentMap}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TaskTimeline onAgentClick={handleAgentClick} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
