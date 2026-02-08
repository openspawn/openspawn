import { Command } from "commander";
import { createClient } from "../lib/api.js";
import { output, outputError } from "../lib/output.js";

export function createTasksCommand(): Command {
  const tasks = new Command("tasks").description("Manage tasks");

  tasks
    .command("list")
    .description("List tasks")
    .option("--status <status>", "Filter by status")
    .action(async (opts) => {
      try {
        const client = createClient();
        const response = await client.listTasks({ status: opts.status });
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  tasks
    .command("get <id>")
    .description("Get task details")
    .action(async (id) => {
      try {
        const client = createClient();
        const response = await client.getTask(id);
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  tasks
    .command("create")
    .description("Create a new task")
    .requiredOption("--title <title>", "Task title")
    .option("--description <desc>", "Task description")
    .option("--priority <priority>", "Priority (low|medium|high|critical)", "medium")
    .action(async (opts) => {
      try {
        const client = createClient();
        const response = await client.createTask({
          title: opts.title,
          description: opts.description,
          priority: opts.priority.toUpperCase(),
        });
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  tasks
    .command("assign <taskId>")
    .description("Assign task to agent")
    .requiredOption("--to <agentId>", "Agent ID to assign to")
    .action(async (taskId, opts) => {
      try {
        const client = createClient();
        const response = await client.assignTask(taskId, opts.to);
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  tasks
    .command("transition <taskId>")
    .description("Transition task to new status")
    .requiredOption("--status <status>", "New status")
    .action(async (taskId, opts) => {
      try {
        const client = createClient();
        const response = await client.transitionTask(taskId, opts.status.toUpperCase());
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return tasks;
}
