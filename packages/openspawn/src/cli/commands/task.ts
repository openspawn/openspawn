import { createTask, listTasks, claimTask, updateTask } from "../../core/task-store.js";

export function taskCommand(args: string[], ctx: { dir: string }) {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case "list": {
      const tasks = listTasks(ctx.dir);
      if (tasks.length === 0) {
        console.log("No tasks.");
        return;
      }
      for (const t of tasks) {
        console.log(
          `  ${t.id}  [${t.status.padEnd(11)}]  ${t.assignee ?? "(unassigned)"}  ${t.description}`,
        );
      }
      return;
    }
    case "create": {
      const desc = rest.join(" ");
      if (!desc) {
        console.error("Usage: openspawn task create <description>");
        return;
      }
      const task = createTask(ctx.dir, desc);
      console.log(`Created ${task.id}: ${task.description}`);
      return;
    }
    case "next": {
      const agentId = rest[0] || "cli";
      const task = claimTask(ctx.dir, agentId);
      if (!task) {
        console.log("No open tasks.");
        return;
      }
      console.log(`Claimed ${task.id}: ${task.description}`);
      return;
    }
    case "done": {
      const id = rest[0];
      if (!id) {
        console.error("Usage: openspawn task done <id>");
        return;
      }
      const task = updateTask(ctx.dir, id, { status: "done" });
      if (!task) {
        console.error(`Task ${id} not found.`);
        return;
      }
      console.log(`Completed ${task.id}`);
      return;
    }
    default:
      console.error("Usage: openspawn task <list|create|next|done>");
  }
}
