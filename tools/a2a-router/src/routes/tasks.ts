// ── Task Routes ──────────────────────────────────────────────────────────────

import { Router, type Request, type Response } from "express";
import { buildResultPayload, deliverHook } from "../bridge.js";
import type { Store } from "../store.js";
import type { CompleteTaskRequest } from "../types.js";

export function taskRoutes(store: Store): Router {
  const router = Router();

  // GET /a2a/tasks — List tasks (optional ?agentId= filter)
  router.get("/", (req: Request, res: Response) => {
    const agentId = req.query.agentId as string | undefined;
    const tasks = store.listTasks(agentId);
    res.json(tasks);
  });

  // GET /a2a/tasks/:id — Get task by ID
  router.get("/:id", (req: Request, res: Response) => {
    const task = store.getTask(req.params.id);
    if (!task) {
      res.status(404).json({ error: `Task '${req.params.id}' not found` });
      return;
    }
    res.json(task);
  });

  // POST /a2a/tasks/:id/complete — Agent reports completion
  router.post("/:id/complete", async (req: Request, res: Response) => {
    const body = req.body as Partial<CompleteTaskRequest>;
    const taskId = req.params.id;

    if (!body.agentId || typeof body.agentId !== "string") {
      res.status(400).json({ error: "agentId is required and must be a string" });
      return;
    }
    if (!body.status || !["completed", "failed"].includes(body.status)) {
      res.status(400).json({ error: "status must be 'completed' or 'failed'" });
      return;
    }
    if (!body.result || typeof body.result !== "string") {
      res.status(400).json({ error: "result is required and must be a string" });
      return;
    }

    const task = store.getTask(taskId);
    if (!task) {
      res.status(404).json({ error: `Task '${taskId}' not found` });
      return;
    }

    // Verify the completing agent is the target
    if (task.target_id !== body.agentId) {
      res.status(403).json({ error: `Agent '${body.agentId}' is not the target of task '${taskId}'` });
      return;
    }

    // Verify task is in a completable state
    if (!["submitted", "working"].includes(task.status)) {
      res.status(409).json({ error: `Task '${taskId}' is in state '${task.status}' and cannot be completed` });
      return;
    }

    // Complete the task
    const updated = store.completeTask(taskId, {
      agentId: body.agentId,
      status: body.status,
      result: body.result,
    });

    if (!updated) {
      res.status(500).json({ error: "Failed to update task" });
      return;
    }

    // Notify the sender agent (best-effort)
    const sender = store.getAgent(task.sender_id);
    const target = store.getAgent(task.target_id);
    if (sender && target) {
      const payload = buildResultPayload(updated, target.name);
      // Fire and forget — don't fail the completion if notification fails
      deliverHook(sender, payload).catch(() => {
        // Notification delivery failure is non-fatal
      });
    }

    res.json(updated);
  });

  return router;
}
