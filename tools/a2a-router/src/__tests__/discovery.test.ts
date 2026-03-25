import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../index.js";
import { Store } from "../store.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Express } from "express";

describe("Agent Discovery", () => {
  let app: Express;
  let store: Store;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "a2a-discovery-test-"));
    const created = createApp(new Store(join(tempDir, "test.db")));
    app = created.app;
    store = created.store;
  });

  afterEach(() => {
    store.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ── Platform AgentCard ─────────────────────────────────────────────────

  describe("GET /.well-known/agent.json", () => {
    it("returns platform-level AgentCard", async () => {
      const res = await request(app).get("/.well-known/agent.json");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("OpenSpawn A2A Router");
      expect(res.body.protocolVersion).toBe("1.0.0");
      expect(res.body.version).toBe("0.2.0");
      expect(res.body.url).toContain("/a2a/jsonrpc");
    });

    it("includes required A2A fields", async () => {
      const res = await request(app).get("/.well-known/agent.json");
      const card = res.body;

      expect(card.name).toBeTruthy();
      expect(card.description).toBeTruthy();
      expect(card.protocolVersion).toBe("1.0.0");
      expect(card.version).toBeTruthy();
      expect(card.url).toBeTruthy();
      expect(Array.isArray(card.skills)).toBe(true);
      expect(card.capabilities).toBeDefined();
      expect(typeof card.capabilities.pushNotifications).toBe("boolean");
      expect(typeof card.capabilities.streaming).toBe("boolean");
      expect(Array.isArray(card.defaultInputModes)).toBe(true);
      expect(Array.isArray(card.defaultOutputModes)).toBe(true);
    });

    it("includes router skills", async () => {
      const res = await request(app).get("/.well-known/agent.json");

      expect(res.body.skills).toHaveLength(2);
      expect(res.body.skills[0].id).toBe("routing");
      expect(res.body.skills[1].id).toBe("task-management");
    });

    it("reports no push notifications or streaming", async () => {
      const res = await request(app).get("/.well-known/agent.json");

      expect(res.body.capabilities.pushNotifications).toBe(false);
      expect(res.body.capabilities.streaming).toBe(false);
    });
  });

  // ── Agent-Specific Cards ───────────────────────────────────────────────

  describe("GET /a2a/agents/:id/card", () => {
    beforeEach(() => {
      store.registerAgent({
        agent_id: "dennis",
        name: "Agent Dennis",
        skills: ["coding", "devops"],
        gateway_url: "http://127.0.0.1:18789",
        gateway_token: "secret",
        hook_path: "/hooks/ingest",
      });
    });

    it("returns agent's A2A-compliant AgentCard", async () => {
      const res = await request(app).get("/a2a/agents/dennis/card");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Agent Dennis");
      expect(res.body.protocolVersion).toBe("1.0.0");
      expect(res.body.version).toBe("1.0.0");
      expect(res.body.url).toContain("/a2a/agents/dennis/jsonrpc");
    });

    it("includes required A2A fields", async () => {
      const res = await request(app).get("/a2a/agents/dennis/card");
      const card = res.body;

      expect(card.name).toBeTruthy();
      expect(card.description).toBeTruthy();
      expect(card.protocolVersion).toBe("1.0.0");
      expect(card.version).toBeTruthy();
      expect(card.url).toBeTruthy();
      expect(Array.isArray(card.skills)).toBe(true);
      expect(card.capabilities).toBeDefined();
      expect(Array.isArray(card.defaultInputModes)).toBe(true);
      expect(Array.isArray(card.defaultOutputModes)).toBe(true);
    });

    it("converts string skills to AgentSkill objects", async () => {
      const res = await request(app).get("/a2a/agents/dennis/card");

      expect(res.body.skills).toHaveLength(2);
      expect(res.body.skills[0]).toEqual({ id: "coding", name: "Coding" });
      expect(res.body.skills[1]).toEqual({ id: "devops", name: "Devops" });
    });

    it("returns 404 for unknown agent", async () => {
      const res = await request(app).get("/a2a/agents/unknown/card");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("unknown");
    });

    it("does not expose gateway_token", async () => {
      const res = await request(app).get("/a2a/agents/dennis/card");

      const body = JSON.stringify(res.body);
      expect(body).not.toContain("secret");
      expect(body).not.toContain("gateway_token");
    });

    it("handles agent with empty skills", async () => {
      store.registerAgent({
        agent_id: "noskills",
        name: "No Skills Agent",
        skills: [],
        gateway_url: "http://localhost",
        hook_path: "/",
      });

      const res = await request(app).get("/a2a/agents/noskills/card");

      expect(res.status).toBe(200);
      expect(res.body.skills).toEqual([]);
    });
  });

  // ── Coexistence with REST routes ───────────────────────────────────────

  describe("coexistence with REST routes", () => {
    it("REST GET /a2a/agents/:id still works alongside /card", async () => {
      store.registerAgent({
        agent_id: "test",
        name: "Test",
        skills: [],
        gateway_url: "http://test",
        hook_path: "/",
      });

      // REST route
      const restRes = await request(app).get("/a2a/agents/test");
      expect(restRes.status).toBe(200);
      expect(restRes.body.agent_id).toBe("test");

      // Discovery route
      const cardRes = await request(app).get("/a2a/agents/test/card");
      expect(cardRes.status).toBe(200);
      expect(cardRes.body.protocolVersion).toBe("1.0.0");
    });

    it("REST GET /a2a/agents still lists agents", async () => {
      store.registerAgent({ agent_id: "a", name: "A", skills: [], gateway_url: "http://a", hook_path: "/" });

      const res = await request(app).get("/a2a/agents");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
