// ── JSON-RPC 2.0 Endpoint ────────────────────────────────────────────────────
// POST /a2a/jsonrpc — A2A v1.0 compliant JSON-RPC server

import { Router, type Request, type Response } from "express";
import { buildTaskPayload, deliverHook } from "../bridge.js";
import type { Store } from "../store.js";
import {
  JSON_RPC_ERRORS,
  type JsonRpcResponse,
  type JsonRpcError,
  type Message,
  type MessageSendParams,
  type TasksGetParams,
  type TasksListParams,
  type TasksCancelParams,
  type Part,
} from "../a2a-types.js";

type MethodHandler = (params: Record<string, unknown>, id: string | number) => Promise<JsonRpcResponse>;

function makeResponse(id: string | number, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function makeError(id: string | number, error: { code: number; message: string }, data?: unknown): JsonRpcResponse {
  const rpcError: JsonRpcError = { code: error.code, message: error.message };
  if (data !== undefined) {
    rpcError.data = data;
  }
  return { jsonrpc: "2.0", id, error: rpcError };
}

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

export function jsonrpcRoutes(store: Store): Router {
  const router = Router();

  const methods: Record<string, MethodHandler> = {
    "message/send": handleMessageSend,
    "tasks/get": handleTasksGet,
    "tasks/list": handleTasksList,
    "tasks/cancel": handleTasksCancel,
  };

  // POST /a2a/jsonrpc
  router.post("/", async (req: Request, res: Response) => {
    // Validate JSON-RPC envelope
    const body = req.body as Record<string, unknown>;

    if (body.jsonrpc !== "2.0") {
      res.json(makeError(
        (body.id as string | number) ?? 0,
        JSON_RPC_ERRORS.INVALID_REQUEST,
        { reason: "Missing or invalid jsonrpc version, must be '2.0'" },
      ));
      return;
    }

    if (body.id === undefined || body.id === null) {
      res.json(makeError(0, JSON_RPC_ERRORS.INVALID_REQUEST, { reason: "Missing id" }));
      return;
    }

    const id = body.id as string | number;

    if (typeof body.method !== "string" || body.method.length === 0) {
      res.json(makeError(id, JSON_RPC_ERRORS.INVALID_REQUEST, { reason: "Missing or invalid method" }));
      return;
    }

    const method = body.method;
    const handler = methods[method];
    if (!handler) {
      res.json(makeError(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, { method }));
      return;
    }

    const params = (body.params ?? {}) as Record<string, unknown>;

    try {
      const result = await handler(params, id);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.json(makeError(id, JSON_RPC_ERRORS.INTERNAL_ERROR, { message }));
    }
  });

  // ── Method Handlers ────────────────────────────────────────────────────

  async function handleMessageSend(params: Record<string, unknown>, id: string | number): Promise<JsonRpcResponse> {
    const p = params as Partial<MessageSendParams>;

    if (!p.agentId || typeof p.agentId !== "string") {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, { reason: "agentId is required" });
    }
    if (!p.senderId || typeof p.senderId !== "string") {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, { reason: "senderId is required" });
    }
    if (!p.message || !isValidMessage(p.message)) {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, {
        reason: "message is required and must be a valid A2A Message with kind, messageId, role, and parts",
      });
    }

    // Validate agents exist
    const target = store.getAgent(p.agentId);
    if (!target) {
      return makeError(id, JSON_RPC_ERRORS.AGENT_NOT_FOUND, { agentId: p.agentId });
    }
    const sender = store.getAgent(p.senderId);
    if (!sender) {
      return makeError(id, JSON_RPC_ERRORS.AGENT_NOT_FOUND, { agentId: p.senderId });
    }

    // Create A2A task
    const task = store.createA2ATask(
      p.senderId,
      p.agentId,
      p.message,
      p.contextId,
    );

    // Build hook payload from the internal task and deliver
    const internalTask = store.getTask(task.id);
    if (internalTask) {
      const payload = buildTaskPayload(internalTask);
      const result = await deliverHook(target, payload);

      if (!result.ok) {
        // Revert to submitted if delivery fails
        store.updateA2ATaskStatus(task.id, "submitted", "Delivery to agent gateway failed");
        const updatedTask = store.getA2ATask(task.id);
        return makeResponse(id, updatedTask);
      }
    }

    return makeResponse(id, task);
  }

  async function handleTasksGet(params: Record<string, unknown>, id: string | number): Promise<JsonRpcResponse> {
    const p = params as Partial<TasksGetParams>;

    if (!p.taskId || typeof p.taskId !== "string") {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, { reason: "taskId is required" });
    }

    const task = store.getA2ATask(p.taskId);
    if (!task) {
      return makeError(id, JSON_RPC_ERRORS.TASK_NOT_FOUND, { taskId: p.taskId });
    }

    return makeResponse(id, task);
  }

  async function handleTasksList(params: Record<string, unknown>, id: string | number): Promise<JsonRpcResponse> {
    const p = params as Partial<TasksListParams>;

    // Validate types if provided
    if (p.limit !== undefined && (typeof p.limit !== "number" || p.limit < 0)) {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, { reason: "limit must be a non-negative number" });
    }
    if (p.offset !== undefined && (typeof p.offset !== "number" || p.offset < 0)) {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, { reason: "offset must be a non-negative number" });
    }

    const validStates = ["submitted", "working", "input-required", "completed", "failed", "canceled"];
    if (p.status !== undefined && !validStates.includes(p.status)) {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, { reason: `status must be one of: ${validStates.join(", ")}` });
    }

    const result = store.listA2ATasks({
      agentId: typeof p.agentId === "string" ? p.agentId : undefined,
      status: p.status,
      contextId: typeof p.contextId === "string" ? p.contextId : undefined,
      limit: p.limit,
      offset: p.offset,
    });

    return makeResponse(id, result);
  }

  async function handleTasksCancel(params: Record<string, unknown>, id: string | number): Promise<JsonRpcResponse> {
    const p = params as Partial<TasksCancelParams>;

    if (!p.taskId || typeof p.taskId !== "string") {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, { reason: "taskId is required" });
    }

    const task = store.getA2ATask(p.taskId);
    if (!task) {
      return makeError(id, JSON_RPC_ERRORS.TASK_NOT_FOUND, { taskId: p.taskId });
    }

    // Can only cancel tasks that are not already in a terminal state
    const terminalStates = ["completed", "failed", "canceled"];
    if (terminalStates.includes(task.status.state)) {
      return makeError(id, JSON_RPC_ERRORS.INVALID_PARAMS, {
        reason: `Task '${p.taskId}' is in state '${task.status.state}' and cannot be canceled`,
      });
    }

    const updated = store.updateA2ATaskStatus(p.taskId, "canceled");
    return makeResponse(id, updated);
  }

  return router;
}
