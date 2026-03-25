// ── Agent Discovery Routes ───────────────────────────────────────────────────
// GET /.well-known/agent.json — Platform-level AgentCard
// GET /a2a/agents/:id/card    — Individual agent's A2A-compliant AgentCard

import { Router, type Request, type Response } from "express";
import type { Store } from "../store.js";
import type { AgentCard } from "../a2a-types.js";

const DEFAULT_BASE_URL = "http://127.0.0.1:3380";

export interface DiscoveryOptions {
  baseUrl?: string;
  routerVersion?: string;
}

export function discoveryRoutes(store: Store, options?: DiscoveryOptions): { wellKnown: Router; agentCards: Router } {
  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  const routerVersion = options?.routerVersion ?? "0.2.0";

  const wellKnown = Router();
  const agentCards = Router();

  // GET /.well-known/agent.json — Platform-level AgentCard for the router
  wellKnown.get("/agent.json", (_req: Request, res: Response) => {
    const card: AgentCard = {
      name: "OpenSpawn A2A Router",
      description: "Multi-agent coordination router for OpenSpawn",
      protocolVersion: "1.0.0",
      version: routerVersion,
      url: `${baseUrl}/a2a/jsonrpc`,
      skills: [
        { id: "routing", name: "Agent Routing", description: "Route messages between registered agents" },
        { id: "task-management", name: "Task Management", description: "Track task lifecycle across agents" },
      ],
      capabilities: { pushNotifications: false, streaming: false },
      defaultInputModes: ["text"],
      defaultOutputModes: ["text"],
    };
    res.json(card);
  });

  // GET /a2a/agents/:id/card — Individual agent's A2A-compliant AgentCard
  agentCards.get("/:id/card", (req: Request, res: Response) => {
    const agent = store.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ error: `Agent '${req.params.id}' not found` });
      return;
    }

    const skills = (agent.skills ?? []).map((skill, idx) => {
      if (typeof skill === "string") {
        return { id: skill, name: skill.charAt(0).toUpperCase() + skill.slice(1) };
      }
      return { id: `skill-${idx}`, name: String(skill) };
    });

    const card: AgentCard = {
      name: agent.name,
      description: `Agent ${agent.agent_id} registered with OpenSpawn`,
      protocolVersion: "1.0.0",
      version: "1.0.0",
      url: `${baseUrl}/a2a/agents/${agent.agent_id}/jsonrpc`,
      skills,
      capabilities: { pushNotifications: false, streaming: false },
      defaultInputModes: ["text"],
      defaultOutputModes: ["text"],
    };

    res.json(card);
  });

  return { wellKnown, agentCards };
}
