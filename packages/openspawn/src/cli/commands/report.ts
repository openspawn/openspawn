import { updateTask } from "../../core/task-store.js";

export function reportCommand(args: string[], ctx: { dir: string }) {
  const statusIdx = args.indexOf("--status");
  const prIdx = args.indexOf("--pr");
  const taskIdx = args.indexOf("--task");
  const status = statusIdx >= 0 ? args[statusIdx + 1] : "update";
  const pr = prIdx >= 0 ? parseInt(args[prIdx + 1]) : undefined;
  const taskId = taskIdx >= 0 ? args[taskIdx + 1] : undefined;

  if (taskId) {
    updateTask(ctx.dir, taskId, { status: pr ? "done" : "in-progress", pr });
  }
  console.log(`Report: ${status}${pr ? ` (PR #${pr})` : ""}`);
}
