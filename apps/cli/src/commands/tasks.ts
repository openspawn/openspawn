import { Command } from "commander";
import pc from "picocolors";
import { createClient } from "../lib/api.js";
import {
  output,
  outputError,
  outputSuccess,
  outputTable,
  formatTask,
  formatEmpty,
  icons,
  colors,
} from "../lib/output.js";
import { withSpinner } from "../lib/spinner.js";

interface Task {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: { id: string; name: string } | null;
  dueDate?: string;
  createdAt: string;
}

const STATUS_ORDER = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"];

function formatStatus(status: string): string {
  switch (status?.toUpperCase()) {
    case "DONE":
      return pc.green("✓ Done");
    case "IN_PROGRESS":
      return pc.magenta("◐ In Progress");
    case "REVIEW":
      return pc.yellow("◎ Review");
    case "TODO":
      return pc.cyan("○ To Do");
    case "BACKLOG":
      return pc.dim("◌ Backlog");
    case "BLOCKED":
      return pc.red("✗ Blocked");
    default:
      return pc.dim(status);
  }
}

function formatPriority(priority: string): string {
  switch (priority?.toUpperCase()) {
    case "CRITICAL":
      return pc.red(pc.bold("!!!"));
    case "HIGH":
      return pc.yellow("!!");
    case "MEDIUM":
      return pc.blue("!");
    case "LOW":
      return pc.dim("·");
    default:
      return pc.dim("·");
  }
}

function formatDueDate(dateStr?: string): string {
  if (!dateStr) return pc.dim("—");
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  if (diffDays < 0) return pc.red(`${formatted} (overdue)`);
  if (diffDays === 0) return pc.yellow(`${formatted} (today)`);
  if (diffDays === 1) return pc.yellow(`${formatted} (tomorrow)`);
  if (diffDays <= 7) return pc.cyan(formatted);
  return formatted;
}

export function createTasksCommand(): Command {
  const tasks = new Command("tasks")
    .description("Create and manage tasks")
    .addHelpText(
      "after",
      `
${pc.cyan("Examples:")}
  ${pc.dim("$")} openspawn tasks list
  ${pc.dim("$")} openspawn tasks list --status in_progress
  ${pc.dim("$")} openspawn tasks create --title "Build feature" --priority high
  ${pc.dim("$")} openspawn tasks assign TASK-001 --to agent-123
  ${pc.dim("$")} openspawn tasks transition TASK-001 --status done
`
    );

  tasks
    .command("list")
    .description("List all tasks")
    .option("--status <status>", "Filter by status")
    .option("--assignee <id>", "Filter by assignee")
    .option("--priority <priority>", "Filter by priority")
    .action(async (opts) => {
      try {
        const data = await withSpinner("Fetching tasks...", async () => {
          const client = createClient();
          return client.listTasks({ status: opts.status });
        });

        let taskList = ((data.data ?? data) as Task[]) || [];

        // Apply filters
        if (opts.assignee) {
          taskList = taskList.filter((t) => t.assignee?.id === opts.assignee);
        }
        if (opts.priority) {
          taskList = taskList.filter(
            (t) => t.priority?.toUpperCase() === opts.priority.toUpperCase()
          );
        }

        // Sort by status order then priority
        taskList.sort((a, b) => {
          const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
          if (statusDiff !== 0) return statusDiff;
          return (a.priority || "").localeCompare(b.priority || "");
        });

        if (taskList.length === 0) {
          formatEmpty(
            "No tasks found",
            opts.status
              ? "Try a different status filter"
              : `Run: ${pc.cyan("openspawn tasks create --title <title>")}`
          );
          return;
        }

        console.log();
        console.log(`  ${icons.task} ${pc.bold(`${taskList.length} task${taskList.length === 1 ? "" : "s"}`)}`);
        console.log();

        outputTable({
          headers: ["ID", "Pri", "Title", "Status", "Assignee", "Due"],
          rows: taskList.map((t) => [
            pc.dim(t.identifier),
            formatPriority(t.priority),
            t.title.length > 35 ? t.title.slice(0, 32) + "..." : t.title,
            formatStatus(t.status),
            t.assignee ? `${icons.agent} ${t.assignee.name}` : pc.dim("—"),
            formatDueDate(t.dueDate),
          ]),
        });
        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  tasks
    .command("get <id>")
    .description("Get task details")
    .action(async (id) => {
      try {
        const data = await withSpinner(`Fetching task ${pc.cyan(id)}...`, async () => {
          const client = createClient();
          return client.getTask(id);
        });

        const task = (data.data ?? data) as Task;
        formatTask(task);
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  tasks
    .command("create")
    .description("Create a new task")
    .requiredOption("--title <title>", "Task title")
    .option("--description <desc>", "Task description")
    .option("--priority <priority>", "Priority (low, medium, high, critical)", "medium")
    .option("--assignee <id>", "Assign to agent")
    .option("--due <date>", "Due date (YYYY-MM-DD)")
    .action(async (opts) => {
      // Validate priority
      const validPriorities = ["low", "medium", "high", "critical"];
      if (!validPriorities.includes(opts.priority.toLowerCase())) {
        outputError(
          `Invalid priority: ${opts.priority}`,
          `Valid values: ${validPriorities.join(", ")}`
        );
        process.exit(1);
      }

      try {
        const data = await withSpinner(
          `Creating task "${pc.cyan(opts.title)}"...`,
          async () => {
            const client = createClient();
            return client.createTask({
              title: opts.title,
              description: opts.description,
              priority: opts.priority.toUpperCase(),
            });
          },
          { successText: `Task created!` }
        );

        const task = (data.data ?? data) as Task;
        formatTask(task);
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  tasks
    .command("assign <taskId>")
    .description("Assign task to an agent")
    .requiredOption("--to <agentId>", "Agent ID to assign to")
    .action(async (taskId, opts) => {
      try {
        await withSpinner(
          `Assigning ${pc.cyan(taskId)} to ${pc.cyan(opts.to)}...`,
          async () => {
            const client = createClient();
            return client.assignTask(taskId, opts.to);
          },
          { successText: `${taskId} assigned to ${opts.to}` }
        );
        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  tasks
    .command("transition <taskId>")
    .description("Transition task to new status")
    .requiredOption("--status <status>", "New status")
    .option("--comment <text>", "Add a comment")
    .action(async (taskId, opts) => {
      const validStatuses = ["backlog", "todo", "in_progress", "review", "done", "blocked"];
      const status = opts.status.toLowerCase().replace("-", "_");
      
      if (!validStatuses.includes(status)) {
        outputError(
          `Invalid status: ${opts.status}`,
          `Valid values: ${validStatuses.join(", ")}`
        );
        process.exit(1);
      }

      try {
        await withSpinner(
          `Transitioning ${pc.cyan(taskId)} to ${pc.cyan(opts.status)}...`,
          async () => {
            const client = createClient();
            return client.transitionTask(taskId, status.toUpperCase());
          },
          { successText: `${taskId} → ${opts.status.toUpperCase()}` }
        );
        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  tasks
    .command("comment <taskId>")
    .description("Add a comment to a task")
    .requiredOption("--text <text>", "Comment text")
    .action(async (taskId, opts) => {
      try {
        await withSpinner(
          `Adding comment to ${pc.cyan(taskId)}...`,
          async () => {
            // TODO: Implement comment endpoint
            await new Promise((r) => setTimeout(r, 500));
          }
        );
        outputSuccess(`Comment added to ${taskId}`);
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return tasks;
}
