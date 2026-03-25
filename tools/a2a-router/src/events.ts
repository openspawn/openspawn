// ── Task Event Bus ───────────────────────────────────────────────────────────
// In-memory event emitter for real-time task status streaming (SSE).

import { EventEmitter } from "node:events";

export interface TaskEvent {
  taskId: string;
  kind: "status-update" | "artifact-update";
  status?: { state: string; message?: string; timestamp: string };
  artifact?: { parts: Array<{ kind: string; text?: string }> };
}

export class TaskEventBus extends EventEmitter {
  emitTaskUpdate(event: TaskEvent): void {
    this.emit(`task:${event.taskId}`, event);
  }

  onTaskUpdate(taskId: string, listener: (event: TaskEvent) => void): void {
    this.on(`task:${taskId}`, listener);
  }

  offTaskUpdate(taskId: string, listener: (event: TaskEvent) => void): void {
    this.off(`task:${taskId}`, listener);
  }
}

export const taskEventBus = new TaskEventBus();
