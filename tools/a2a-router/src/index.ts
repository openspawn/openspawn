// ── A2A Router — Entry Point ─────────────────────────────────────────────────

import express from "express";
import { Store } from "./store.js";
import { agentRoutes } from "./routes/agents.js";
import { messageRoutes } from "./routes/messages.js";
import { taskRoutes } from "./routes/tasks.js";

const PORT = parseInt(process.env.A2A_PORT ?? "3380", 10);
const DB_PATH = process.env.A2A_DB_PATH ?? `${process.env.HOME}/.openspawn/a2a/tasks.db`;

export function createApp(store?: Store) {
  const s = store ?? new Store(DB_PATH);
  const app = express();

  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "a2a-router", version: "0.1.0" });
  });

  // Mount routes
  app.use("/a2a/agents", agentRoutes(s));
  app.use("/a2a/message", messageRoutes(s));
  app.use("/a2a/tasks", taskRoutes(s));

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
    console.log(`   DB: ${DB_PATH}`);
  });
}
