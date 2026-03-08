import { describe, it, expect } from "vitest";
import { generateWorkspaces } from "./workspace-generator.js";
import type { AgentConfig } from "./workspace-generator.js";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { defaultConfig } from "../core/config.js";

// Structure: a department "Operations" with two sub-roles.
// Boss is level 10 (via explicit meta), Worker is level 4.
const SAMPLE_ORG = `# Test Org

## Structure

### Operations

#### Boss — CEO
- **Level:** 10
- **Domain:** operations

#### Worker — Engineer
- **Level:** 4
- **Domain:** engineering
`;

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "os-ws-"));
}

describe("workspace generator", () => {
  it("creates workspace dirs per agent", () => {
    const dir = makeTmpDir();
    const result = generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    expect(existsSync(join(dir, "workspaces", "boss"))).toBe(true);
    expect(existsSync(join(dir, "workspaces", "worker"))).toBe(true);
    expect(result.agentCount).toBe(2);
  });

  it("creates SOUL.md with alignment section", () => {
    const dir = makeTmpDir();
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    const soul = readFileSync(join(dir, "workspaces", "boss", "SOUL.md"), "utf-8");
    expect(soul).toContain("Organizational Alignment");
    expect(soul).toContain("Boss");
    expect(soul).toContain("Level:** 10");
    expect(soul).toContain(defaultConfig.alignment.mission);
  });

  it("creates AGENTS.md in each workspace", () => {
    const dir = makeTmpDir();
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    expect(existsSync(join(dir, "workspaces", "boss", "AGENTS.md"))).toBe(true);
    const agents = readFileSync(join(dir, "workspaces", "boss", "AGENTS.md"), "utf-8");
    expect(agents).toContain("Every Session");
  });

  it("creates memory/ dir in each workspace", () => {
    const dir = makeTmpDir();
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    expect(existsSync(join(dir, "workspaces", "boss", "memory"))).toBe(true);
  });

  it("writes openclaw-agents.json", () => {
    const dir = makeTmpDir();
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    expect(existsSync(join(dir, "openclaw-agents.json"))).toBe(true);
    const agents: AgentConfig[] = JSON.parse(
      readFileSync(join(dir, "openclaw-agents.json"), "utf-8"),
    );
    expect(agents.length).toBe(2);
    expect(agents[0].model).toBeDefined();
  });

  it("assigns model based on level and config threshold", () => {
    const dir = makeTmpDir();
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    const agents: AgentConfig[] = JSON.parse(
      readFileSync(join(dir, "openclaw-agents.json"), "utf-8"),
    );
    const boss = agents.find((a) => a.name === "Boss");
    const worker = agents.find((a) => a.name === "Worker");
    expect(boss?.model).toBe(defaultConfig.llm.models.senior);
    expect(worker?.model).toBe(defaultConfig.llm.models.default);
  });

  it("includes reportsTo for child agents", () => {
    const dir = makeTmpDir();
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    const agents: AgentConfig[] = JSON.parse(
      readFileSync(join(dir, "openclaw-agents.json"), "utf-8"),
    );
    const worker = agents.find((a) => a.name === "Worker");
    expect(worker?.reportsTo).toBe("Boss");
  });
});
