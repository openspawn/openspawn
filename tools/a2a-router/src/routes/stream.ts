// ── SSE Streaming Endpoint ───────────────────────────────────────────────────
// POST /a2a/stream — Server-Sent Events for real-time task updates

import { Router, type Request, type Response } from "express";
import { buildTaskPayload, deliverHook } from "../bridge.js";
import type { TaskEvent } from "../events.js";
import type { Store } from "../store.js";
import {
  JSON_RPC_ERRORS,
  type Message,
  type MessageSendParams,
  type Part,
} from "../a2a-types.js";

const SSE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const TERMINAL_STATES = ["completed", "failed", "canceled"];

function isValidPart(part: unknown): part is Part {
  if (typeof part !== "object" || part === null) return false;
  const p = part as Record<string, unknown>;
  if (p.kind === "text") return typeof p.text === "string";
  if (p.kind === "file") return true;
  if (p.kind === "data") return typeof p.data === "object" && p.data !== null;
  return false;
}

function isValidMessage(msg: unknown): msg is Message {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as Record<string, unknown>;
  if (m.kind !== "message") return false;
  if (typeof m.messageId !== "string") return false;
  if (m.role !== "user" && m.role !== "agent") return false;
  if (!Array.isArray(m.parts) || m.parts.length === 0) return false;
  return m.parts.every(isValidPart);
}

function writeSSE(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function streamRoutes(store: Store): Router {
  const router = Router();

  // POST /a2a/stream
  router.post("/", async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;

    // Validate JSON-RPC envelope
    if (body.jsonrpc !== "2.0") {
      res.status(400).json({
        jsonrpc: "2.0",
        id: (body.id as string | number) ?? 0,
        error: { ...JSON_RPC_ERRORS.INVALID_REQUEST, data: { reason: "Missing or invalid jsonrpc version" } },
      });
      return;
    }

    const id = body.id as string | number;
    if (id === undefined || id === null) {
      res.status(400).json({
        jsonrpc: "2.0",
        id: 0,
        error: { ...JSON_RPC_ERRORS.INVALID_REQUEST, data: { reason: "Missing id" } },
      });
      return;
    }

    // Validate method
    const method = body.method as string;
    if (method !== "message/stream") {
      res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: { ...JSON_RPC_ERRORS.METHOD_NOT_FOUND, data: { method, reason: "Stream endpoint only supports message/stream" } },
      });
      return;
    }

    const params = (body.params ?? {}) as Partial<MessageSendParams>;

    // Validate params
    if (!params.agentId || typeof params.agentId !== "string") {
      res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: { ...JSON_RPC_ERRORS.INVALID_PARAMS, data: { reason: "agentId is required" } },
      });
      return;
    }
    if (!params.senderId || typeof params.senderId !== "string") {
      res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: { ...JSON_RPC_ERRORS.INVALID_PARAMS, data: { reason: "senderId is required" } },
      });
      return;
    }
    if (!params.message || !isValidMessage(params.message)) {
      res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: { ...JSON_RPC_ERRORS.INVALID_PARAMS, data: { reason: "message is required and must be a valid A2A Message" } },
      });
      return;
    }

    // Validate agents exist
    const target = store.getAgent(params.agentId);
    if (!target) {
      res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: { ...JSON_RPC_ERRORS.AGENT_NOT_FOUND, data: { agentId: params.agentId } },
      });
      return;
    }
    const sender = store.getAgent(params.senderId);
    if (!sender) {
      res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: { ...JSON_RPC_ERRORS.AGENT_NOT_FOUND, data: { agentId: params.senderId } },
      });
      return;
    }

    // Create A2A task
    const task = store.createA2ATask(
      params.senderId,
      params.agentId,
      params.message,
      params.contextId,
    );

    const taskId = task.id;

    // Set up SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send initial status
    writeSSE(res, "status", {
      kind: "status-update",
      taskId,
      status: task.status,
    });

    let closed = false;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      store.events.offTaskUpdate(taskId, listener);
      clearTimeout(timeout);
    };

    // Listen for updates
    const listener = (event: TaskEvent) => {
      if (closed) return;
      writeSSE(res, "status", event);

      if (event.status && TERMINAL_STATES.includes(event.status.state)) {
        writeSSE(res, "done", { taskId });
        cleanup();
        res.end();
      }
    };

    store.events.onTaskUpdate(taskId, listener);

    // Timeout after 5 minutes
    const timeout = setTimeout(() => {
      if (closed) return;
      writeSSE(res, "timeout", {
        taskId,
        message: "SSE connection timed out after 5 minutes",
      });
      writeSSE(res, "done", { taskId });
      cleanup();
      res.end();
    }, SSE_TIMEOUT_MS);

    // Handle client disconnect
    res.on("close", () => {
      cleanup();
    });

    // Deliver to target agent (fire and forget for SSE — status updates come via event bus)
    const internalTask = store.getTask(taskId);
    if (internalTask) {
      const payload = buildTaskPayload(internalTask);
      const result = await deliverHook(target, payload);

      if (!result.ok && !closed) {
        store.updateA2ATaskStatus(taskId, "submitted", "Delivery to agent gateway failed");
        const updatedTask = store.getA2ATask(taskId);
        if (updatedTask) {
          writeSSE(res, "status", {
            kind: "status-update",
            taskId,
            status: updatedTask.status,
          });
        }
      }
    }
  });

  return router;
}
