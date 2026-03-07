import { updateTask } from "../../core/task-store.js";

export function escalateCommand(args: string[], ctx: { dir: string }) {
  const taskIdx = args.indexOf("--task");
  const reasonIdx = args.indexOf("--reason");
  if (taskIdx < 0) {
    console.error("Usage: openspawn escalate --task <id> --reason <R>");
    return;
  }
  const taskId = args[taskIdx + 1];
  const reason = reasonIdx >= 0 ? args.slice(reasonIdx + 1).join(" ") : "escalated";
  const task = updateTask(ctx.dir, taskId, { status: "blocked" });
  if (!task) {
    console.error(`Task ${taskId} not found.`);
    return;
  }
  console.log(`Escalated ${task.id}: ${reason}`);
}
