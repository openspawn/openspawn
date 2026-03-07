import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadAgentConfig, buildSystemPrompt, type AgentConfig } from "./config-loader.js";

// Mock fs
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { existsSync, readFileSync } from "node:fs";

const mockExists = vi.mocked(existsSync);
const mockRead = vi.mocked(readFileSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadAgentConfig", () => {
  it("loads agent-specific files when they exist", () => {
    mockExists.mockImplementation((p: any) => {
      const path = String(p);
      return path.includes("/agents/alice/SOUL.md");
    });
    mockRead.mockReturnValue("You are Alice, a brilliant engineer.");

    const config = loadAgentConfig("alice", "/org");
    expect(config.soul).toBe("You are Alice, a brilliant engineer.");
  });

  it("falls back to _defaults when agent file missing", () => {
    mockExists.mockImplementation((p: any) => {
      const path = String(p);
      return path.includes("_defaults/SOUL.md");
    });
    mockRead.mockReturnValue("Default soul content");

    const config = loadAgentConfig("bob", "/org");
    expect(config.soul).toBe("Default soul content");
  });

  it("returns empty config when no files exist", () => {
    mockExists.mockReturnValue(false);
    const config = loadAgentConfig("nobody", "/org");
    expect(config.soul).toBeUndefined();
    expect(config.agents).toBeUndefined();
    expect(config.tools).toBeUndefined();
    expect(config.identity).toBeUndefined();
    expect(config.memory).toBeUndefined();
  });

  it("loads all five config files", () => {
    mockExists.mockReturnValue(true);
    mockRead.mockImplementation((p: any) => `content of ${String(p).split("/").pop()}`);

    const config = loadAgentConfig("alice", "/org");
    expect(config.soul).toContain("SOUL.md");
    expect(config.agents).toContain("AGENTS.md");
    expect(config.tools).toContain("TOOLS.md");
    expect(config.identity).toContain("IDENTITY.md");
    expect(config.memory).toContain("MEMORY.md");
  });

  it("prefers agent-specific over defaults", () => {
    mockExists.mockImplementation((p: any) => {
      const path = String(p);
      return path.includes("/agents/alice/SOUL.md") || path.includes("_defaults/SOUL.md");
    });
    mockRead.mockImplementation((p: any) => {
      const path = String(p);
      return path.includes("alice") ? "Alice soul" : "Default soul";
    });

    const config = loadAgentConfig("alice", "/org");
    expect(config.soul).toBe("Alice soul");
  });
});

describe("buildSystemPrompt", () => {
  it("combines soul + identity + agents", () => {
    const config: AgentConfig = {
      soul: "You are helpful.",
      identity: "Identity section.",
      agents: "Agent rules.",
    };
    const prompt = buildSystemPrompt(config);
    expect(prompt).toContain("You are helpful.");
    expect(prompt).toContain("Identity section.");
    expect(prompt).toContain("Agent rules.");
  });

  it("includes orgIdentity when provided", () => {
    const config: AgentConfig = { soul: "Soul." };
    const prompt = buildSystemPrompt(config, "We are Acme Corp.");
    expect(prompt).toContain("We are Acme Corp.");
  });

  it("handles empty config", () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toBe("");
  });

  it("trims whitespace from parts", () => {
    const config: AgentConfig = { soul: "  Soul with spaces  \n\n" };
    const prompt = buildSystemPrompt(config);
    expect(prompt).toBe("Soul with spaces");
  });

  it("does not include tools or memory", () => {
    const config: AgentConfig = { soul: "Soul", tools: "Tools content", memory: "Memory content" };
    const prompt = buildSystemPrompt(config);
    expect(prompt).not.toContain("Tools content");
    expect(prompt).not.toContain("Memory content");
  });

  it("orders parts: soul, identity, orgIdentity, agents", () => {
    const config: AgentConfig = { soul: "SOUL", identity: "IDENTITY", agents: "AGENTS" };
    const prompt = buildSystemPrompt(config, "ORG");
    const soulIdx = prompt.indexOf("SOUL");
    const identityIdx = prompt.indexOf("IDENTITY");
    const orgIdx = prompt.indexOf("ORG");
    const agentsIdx = prompt.indexOf("AGENTS");
    expect(soulIdx).toBeLessThan(identityIdx);
    expect(identityIdx).toBeLessThan(orgIdx);
    expect(orgIdx).toBeLessThan(agentsIdx);
  });
});
