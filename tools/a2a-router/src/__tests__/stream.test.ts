import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import http from "node:http";
import { createApp } from "../index.js";
import { Store } from "../store.js";
// Event bus is accessed through store.events (shared instance)
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Express } from "express";

// Mock fetch for bridge delivery
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeStreamPayload(overrides: Record<string, unknown> = {}) {
  return {
    jsonrpc: "2.0",
    id: "stream-1",
    method: "message/stream",
    params: {
      agentId: "drinkify",
      senderId: "dennis",
      message: {
        kind: "message",
        messageId: "msg-1",
        role: "user",
        parts: [{ kind: "text", text: "Hello streaming" }],
      },
      ...overrides,
    },
  };
}

function parseSSEEvents(raw: string): Array<{ event: string; data: unknown }> {
  const events: Array<{ event: string; data: unknown }> = [];
  let currentEvent = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event: ")) {
      currentEvent = line.slice(7);
    } else if (line.startsWith("data: ")) {
      try {
        events.push({ event: currentEvent, data: JSON.parse(line.slice(6)) });
      } catch {
        // ignore
      }
    }
  }
  return events;
}

/** Collect SSE chunks from a raw HTTP request until connection closes or timeout */
function collectSSE(
  server: http.Server,
  payload: unknown,
  opts: { timeoutMs?: number } = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; chunks: string[]; events: Array<{ event: string; data: unknown }> }> {
  const { timeoutMs = 5000 } = opts;
  return new Promise((resolve) => {
    const addr = server.address() as { port: number };
    const body = JSON.stringify(payload);
    const chunks: string[] = [];
    let resolved = false;

    function finish(status: number, headers: http.IncomingHttpHeaders) {
      if (resolved) return;
      resolved = true;
      const full = chunks.join("");
      resolve({ status, headers, chunks, events: parseSSEEvents(full) });
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path: "/a2a/stream",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        const timer = setTimeout(() => {
          req.destroy();
          finish(res.statusCode ?? 0, res.headers);
        }, timeoutMs);

        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          chunks.push(chunk);
        });
        res.on("end", () => {
          clearTimeout(timer);
          finish(res.statusCode ?? 0, res.headers);
        });
      },
    );
    req.on("error", () => {
      finish(0, {});
    });
    req.write(body);
    req.end();
  });
}

describe("SSE Stream Endpoint", () => {
  let app: Express;
  let store: Store;
  let tempDir: string;
  let server: http.Server;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "a2a-stream-test-"));
    const created = createApp(new Store(join(tempDir, "test.db")));
    app = created.app;
    store = created.store;
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => "ok" });

    store.registerAgent({
      agent_id: "dennis",
      name: "Agent Dennis",
      skills: ["coding"],
      gateway_url: "http://127.0.0.1:18789",
      hook_path: "/hooks/ingest",
    });
    store.registerAgent({
      agent_id: "drinkify",
      name: "Agent Drinkify",
      skills: ["ecommerce"],
      gateway_url: "http://127.0.0.1:18810",
      gateway_token: "tok",
      hook_path: "/hooks/ingest",
    });

    server = app.listen(0);
    await new Promise<void>((resolve) => server.on("listening", resolve));
  });

  afterEach(() => {
    store.close();
    server.close();
    rmSync(tempDir, { recursive: true, force: true });
    store.events.removeAllListeners();
  });

  // ── Validation (JSON error responses) ─────────────────────────────────

  it("rejects missing jsonrpc version", async () => {
    const res = await request(app)
      .post("/a2a/stream")
      .send({ id: "1", method: "message/stream", params: {} });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(-32600);
  });

  it("rejects wrong method", async () => {
    const res = await request(app)
      .post("/a2a/stream")
      .send({ jsonrpc: "2.0", id: "1", method: "message/send", params: {} });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(-32601);
  });

  it("rejects missing agentId", async () => {
    const res = await request(app)
      .post("/a2a/stream")
      .send({
        jsonrpc: "2.0",
        id: "1",
        method: "message/stream",
        params: {
          senderId: "dennis",
          message: { kind: "message", messageId: "m1", role: "user", parts: [{ kind: "text", text: "hi" }] },
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(-32602);
  });

  it("rejects unknown agent", async () => {
    const res = await request(app)
      .post("/a2a/stream")
      .send({
        jsonrpc: "2.0",
        id: "1",
        method: "message/stream",
        params: {
          agentId: "nonexistent",
          senderId: "dennis",
          message: { kind: "message", messageId: "m1", role: "user", parts: [{ kind: "text", text: "hi" }] },
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(-32002);
  });

  // ── SSE Output ────────────────────────────────────────────────────────

  it("returns SSE content-type and initial status event", async () => {
    // Mock fetch to complete the task immediately so the SSE stream closes
    mockFetch.mockImplementation(async (_url: string, init: { body?: string }) => {
      try {
        const payload = JSON.parse(init.body ?? "{}");
        const match = (payload.message as string)?.match(/\[a2a:task:([^\]]+)\]/);
        const taskId = match?.[1];
        if (taskId) {
          // Complete immediately so stream closes
          setImmediate(() => {
            store.updateA2ATaskStatus(taskId, "completed", "Done");
          });
        }
      } catch {
        // ignore
      }
      return { ok: true, status: 200, text: async () => "ok" };
    });

    const result = await collectSSE(server, makeStreamPayload(), { timeoutMs: 3000 });

    expect(result.status).toBe(200);
    expect(result.headers["content-type"]).toBe("text/event-stream");
    expect(result.headers["cache-control"]).toBe("no-cache");

    // Should have initial status event
    const statusEvents = result.events.filter((e) => e.event === "status");
    expect(statusEvents.length).toBeGreaterThanOrEqual(1);
    expect(statusEvents[0].data).toHaveProperty("kind", "status-update");
    expect(statusEvents[0].data).toHaveProperty("taskId");
  });

  it("streams status updates and closes on terminal state", { timeout: 15000 }, async () => {
    const taskIdReady = new Promise<string>((resolve) => {
      mockFetch.mockImplementation(async (_url: string, init: { body?: string }) => {
        try {
          const payload = JSON.parse(init.body ?? "{}");
          const match = (payload.message as string)?.match(/\[a2a:task:([^\]]+)\]/);
          if (match?.[1]) {
            resolve(match[1]);
          }
        } catch {
          // ignore
        }
        return { ok: true, status: 200, text: async () => "ok" };
      });
    });

    // Start collecting SSE (non-blocking)
    const ssePromise = collectSSE(server, makeStreamPayload(), { timeoutMs: 5000 });

    // Wait for the mock to be called (task created)
    const taskId = await taskIdReady;

    // Wait for the event listener to be set up (the handler sets it up after writeHead)
    await new Promise((r) => setTimeout(r, 200));

    // Emit events through the store (uses the same taskEventBus instance as the SSE handler)
    store.updateA2ATaskStatus(taskId, "working", "Processing...");

    await new Promise((r) => setTimeout(r, 50));

    store.updateA2ATaskStatus(taskId, "completed", "All done!");

    const result = await ssePromise;

    // Should have: initial status, working, completed, done
    const statusEvents = result.events.filter((e) => e.event === "status");
    const doneEvents = result.events.filter((e) => e.event === "done");

    expect(statusEvents.length).toBeGreaterThanOrEqual(2); // initial + completed (working may or may not arrive)

    // Should have completed event
    const completedEvent = statusEvents.find(
      (e) => ((e.data as Record<string, Record<string, string>>).status)?.state === "completed",
    );
    expect(completedEvent).toBeDefined();

    // Should have done event
    expect(doneEvents.length).toBe(1);
    expect(doneEvents[0].data).toHaveProperty("taskId");

    // Connection should have closed
    expect(result.status).toBe(200);
  });

  it("handles delivery failure gracefully in SSE mode", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => "error" });

    // Connection won't close on its own since delivery fails and no terminal event fires
    const result = await collectSSE(server, makeStreamPayload(), { timeoutMs: 1000 });

    expect(result.status).toBe(200);

    // Should have at least the initial status event
    const statusEvents = result.events.filter((e) => e.event === "status");
    expect(statusEvents.length).toBeGreaterThanOrEqual(1);
  });
});
