import { describe, it, expect, vi } from "vitest";
import { taskEventBus, type TaskEvent } from "../events.js";

describe("TaskEventBus", () => {
  it("emits and receives task updates", () => {
    const listener = vi.fn();
    const taskId = "test-task-1";

    taskEventBus.onTaskUpdate(taskId, listener);

    const event: TaskEvent = {
      taskId,
      kind: "status-update",
      status: { state: "working", timestamp: new Date().toISOString() },
    };

    taskEventBus.emitTaskUpdate(event);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(event);

    taskEventBus.offTaskUpdate(taskId, listener);
  });

  it("does not emit to unrelated task listeners", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    taskEventBus.onTaskUpdate("task-a", listener1);
    taskEventBus.onTaskUpdate("task-b", listener2);

    taskEventBus.emitTaskUpdate({
      taskId: "task-a",
      kind: "status-update",
      status: { state: "completed", timestamp: new Date().toISOString() },
    });

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).not.toHaveBeenCalled();

    taskEventBus.offTaskUpdate("task-a", listener1);
    taskEventBus.offTaskUpdate("task-b", listener2);
  });

  it("removes listeners with offTaskUpdate", () => {
    const listener = vi.fn();
    const taskId = "test-task-remove";

    taskEventBus.onTaskUpdate(taskId, listener);
    taskEventBus.offTaskUpdate(taskId, listener);

    taskEventBus.emitTaskUpdate({
      taskId,
      kind: "status-update",
      status: { state: "working", timestamp: new Date().toISOString() },
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports artifact-update events", () => {
    const listener = vi.fn();
    const taskId = "test-task-artifact";

    taskEventBus.onTaskUpdate(taskId, listener);

    const event: TaskEvent = {
      taskId,
      kind: "artifact-update",
      artifact: { parts: [{ kind: "text", text: "Hello world" }] },
    };

    taskEventBus.emitTaskUpdate(event);

    expect(listener).toHaveBeenCalledWith(event);
    expect(listener.mock.calls[0][0].kind).toBe("artifact-update");

    taskEventBus.offTaskUpdate(taskId, listener);
  });

  it("supports multiple listeners on the same task", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const taskId = "test-task-multi";

    taskEventBus.onTaskUpdate(taskId, listener1);
    taskEventBus.onTaskUpdate(taskId, listener2);

    taskEventBus.emitTaskUpdate({
      taskId,
      kind: "status-update",
      status: { state: "working", timestamp: new Date().toISOString() },
    });

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();

    taskEventBus.offTaskUpdate(taskId, listener1);
    taskEventBus.offTaskUpdate(taskId, listener2);
  });
});
