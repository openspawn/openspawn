import { createTask } from "../../core/task-store.js";

export function delegateCommand(args: string[], ctx: { dir: string }) {
  const toIdx = args.indexOf("--to");
  const taskIdx = args.indexOf("--task");
  if (toIdx < 0 || taskIdx < 0) {
    console.error("Usage: openspawn delegate --to <agent> --task <desc>");
    return;
  }
  const to = args[toIdx + 1];
  const desc = args
    .slice(taskIdx + 1)
    .filter((a) => a !== "--to" && a !== to)
    .join(" ");
  const task = createTask(ctx.dir, desc, { assignee: to, delegatedBy: "cli" });
  console.log(`Delegated ${task.id} to ${to}: ${desc}`);
}
