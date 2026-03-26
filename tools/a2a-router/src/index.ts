// ── A2A Router — Entry Point ─────────────────────────────────────────────────

import express from "express";
import { Store } from "./store.js";
import { agentRoutes } from "./routes/agents.js";
import { messageRoutes } from "./routes/messages.js";
import { taskRoutes } from "./routes/tasks.js";
import { jsonrpcRoutes } from "./routes/jsonrpc.js";
import { streamRoutes } from "./routes/stream.js";
import { discoveryRoutes } from "./routes/discovery.js";
import { initSync } from "./sync.js";

const PORT = parseInt(process.env.A2A_PORT ?? "3380", 10);
const DB_PATH = process.env.A2A_DB_PATH ?? `${process.env.HOME}/.openspawn/a2a/tasks.db`;
const BASE_URL = process.env.A2A_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export function createApp(store?: Store) {
  const s = store ?? new Store(DB_PATH);
  const app = express();

  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "a2a-router", version: "0.2.0" });
  });

  // ── Agent Discovery ───────────────────────────────────────────────────
  // Mount discovery BEFORE REST agent routes so /:id/card doesn't get caught by /:id
  const { wellKnown, agentCards } = discoveryRoutes(s, { baseUrl: BASE_URL });
  app.use("/.well-known", wellKnown);
  app.use("/a2a/agents", agentCards);

  // ── Legacy REST routes (backward compatibility) ────────────────────────
  app.use("/a2a/agents", agentRoutes(s));
  app.use("/a2a/message", messageRoutes(s));
  app.use("/a2a/tasks", taskRoutes(s));

  // ── A2A v1.0 JSON-RPC endpoint ────────────────────────────────────────
  app.use("/a2a/jsonrpc", jsonrpcRoutes(s));

  // ── SSE Streaming endpoint ────────────────────────────────────────────
  app.use("/a2a/stream", streamRoutes(s));

  // ── API Sync (fire-and-forget) ────────────────────────────────────────
  initSync(s);

  return { app, store: s };
}

// Only start server if run directly (not imported for tests)
const isDirectRun = process.argv[1]?.endsWith("/index.ts") || process.argv[1]?.endsWith("/index.js");
const isVitest = process.argv[1]?.includes("vitest") || process.env.VITEST;
if (isDirectRun && !isVitest) {
  const { app } = createApp();
  app.listen(PORT, () => {
    console.log(`🔄 A2A Router listening on http://127.0.0.1:${PORT}`);
    console.log(`   Health: http://127.0.0.1:${PORT}/health`);
    console.log(`   JSON-RPC: http://127.0.0.1:${PORT}/a2a/jsonrpc`);
    console.log(`   Stream:   http://127.0.0.1:${PORT}/a2a/stream`);
    console.log(`   Discovery: http://127.0.0.1:${PORT}/.well-known/agent.json`);
    console.log(`   DB: ${DB_PATH}`);
  });
}
