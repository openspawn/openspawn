// ── Message Routes ───────────────────────────────────────────────────────────

import { Router, type Request, type Response } from "express";
import { buildTaskPayload, deliverHook } from "../bridge.js";
import type { Store } from "../store.js";
import type { SendMessageRequest } from "../types.js";

export function messageRoutes(store: Store): Router {
  const router = Router();

  // POST /a2a/message/send — Send message to an agent (creates task)
  router.post("/send", async (req: Request, res: Response) => {
    const body = req.body as Partial<SendMessageRequest>;

    if (!body.agentId || typeof body.agentId !== "string") {
      res.status(400).json({ error: "agentId is required and must be a string" });
      return;
    }
    if (!body.senderId || typeof body.senderId !== "string") {
      res.status(400).json({ error: "senderId is required and must be a string" });
      return;
    }
    if (!body.message || typeof body.message !== "string") {
      res.status(400).json({ error: "message is required and must be a string" });
      return;
    }

    // Validate agents exist
    const target = store.getAgent(body.agentId);
    if (!target) {
      res.status(404).json({ error: `Target agent '${body.agentId}' not found. Register it first.` });
      return;
    }
    const sender = store.getAgent(body.senderId);
    if (!sender) {
      res.status(404).json({ error: `Sender agent '${body.senderId}' not found. Register it first.` });
      return;
    }

    // Create task
    const task = store.createTask(body.senderId, body.agentId, body.message);

    // Build hook payload and deliver to target agent
    const payload = buildTaskPayload(task);
    const result = await deliverHook(target, payload);

    if (!result.ok) {
      // Task stays as submitted but we report the delivery failure
      res.status(502).json({
        error: `Failed to deliver task to agent '${body.agentId}' gateway`,
        task,
        delivery: { status: result.status, body: result.body },
      });
      return;
    }

    // Transition to working
    const updated = store.updateTaskStatus(task.id, "working");

    res.status(201).json(updated);
  });

  return router;
}
