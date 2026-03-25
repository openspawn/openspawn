// ── Agent Routes ─────────────────────────────────────────────────────────────

import { Router, type Request, type Response } from "express";
import type { Store } from "../store.js";
import type { RegisterAgentRequest } from "../types.js";

export function agentRoutes(store: Store): Router {
  const router = Router();

  // POST /a2a/agents — Register agent
  router.post("/", (req: Request, res: Response) => {
    const body = req.body as Partial<RegisterAgentRequest>;

    if (!body.agentId || typeof body.agentId !== "string") {
      res.status(400).json({ error: "agentId is required and must be a string" });
      return;
    }
    if (!body.name || typeof body.name !== "string") {
      res.status(400).json({ error: "name is required and must be a string" });
      return;
    }
    if (!body.gateway_url || typeof body.gateway_url !== "string") {
      res.status(400).json({ error: "gateway_url is required and must be a string" });
      return;
    }

    const agent = store.registerAgent({
      agent_id: body.agentId,
      name: body.name,
      skills: body.skills ?? [],
      gateway_url: body.gateway_url,
      gateway_token: body.gateway_token,
      hook_path: body.hook_path ?? "/hooks/ingest",
    });

    res.status(201).json(agent);
  });

  // GET /a2a/agents — List agents
  router.get("/", (_req: Request, res: Response) => {
    const agents = store.listAgents();
    res.json(agents);
  });

  // GET /a2a/agents/:id — Get agent
  router.get("/:id", (req: Request, res: Response) => {
    const agent = store.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ error: `Agent '${req.params.id}' not found` });
      return;
    }
    res.json(agent);
  });

  return router;
}
