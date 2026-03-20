import { describe, it, expect } from "vitest";
import { scaffold, defaultAnswers } from "./init.js";
import { regenerate } from "./regenerate.js";
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function setupScaffold(): string {
  const dir = mkdtempSync(join(tmpdir(), "os-regen-"));
  scaffold(dir, defaultAnswers());
  return dir;
}

describe("regenerate command", () => {
  it("regenerate after init produces identical files (all unchanged)", () => {
    const dir = setupScaffold();
    const result = regenerate(dir, false);

    expect(result.agentCount).toBeGreaterThan(0);
    // All files should be unchanged since nothing was edited
    const changed = result.changes.filter((c) => c.status !== "unchanged");
    expect(changed).toHaveLength(0);
  });

  it("regenerate after ORG.md edit updates SOUL.md", () => {
    const dir = setupScaffold();

    // Read and modify ORG.md — change the mission in Identity section
    const configPath = join(dir, "openspawn.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    config.alignment.mission = "New mission: conquer the world";
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");

    const result = regenerate(dir, false);

    // SOUL.md files should be updated (they embed the mission)
    const updated = result.changes.filter((c) => c.status === "updated");
    expect(updated.length).toBeGreaterThan(0);

    // Verify the new mission is in SOUL.md files
    const soulFiles = updated.filter((c) => c.path.endsWith("SOUL.md"));
    expect(soulFiles.length).toBeGreaterThan(0);

    for (const sf of soulFiles) {
      const content = readFileSync(join(dir, sf.path), "utf-8");
      expect(content).toContain("New mission: conquer the world");
    }
  });

  it("--dry-run does not write files", () => {
    const dir = setupScaffold();

    // Modify config to trigger changes
    const configPath = join(dir, "openspawn.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    config.alignment.mission = "Dry run mission change";
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");

    // Read current SOUL.md content before dry run
    const agentsJson = JSON.parse(readFileSync(join(dir, "openclaw-agents.json"), "utf-8"));
    const firstWs = agentsJson[0]?.workspace;
    expect(firstWs).toBeDefined();
    const soulBefore = readFileSync(join(dir, firstWs, "SOUL.md"), "utf-8");

    // Run dry-run
    const result = regenerate(dir, true);
    const updated = result.changes.filter((c) => c.status === "updated");
    expect(updated.length).toBeGreaterThan(0);

    // Verify files were NOT written
    const soulAfter = readFileSync(join(dir, firstWs, "SOUL.md"), "utf-8");
    expect(soulAfter).toBe(soulBefore);
    expect(soulAfter).not.toContain("Dry run mission change");
  });

  it("missing ORG.md gives clear error", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-regen-empty-"));
    expect(() => regenerate(dir, false)).toThrow("ORG.md not found");
  });

  it("missing openspawn.json gives clear error", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-regen-noconfig-"));
    writeFileSync(join(dir, "ORG.md"), "# Test Org\n");
    expect(() => regenerate(dir, false)).toThrow("openspawn.json not found");
  });

  it("creates workspace for new agent added to ORG.md", () => {
    const dir = setupScaffold();

    // Add a new agent inside the ## Structure section of ORG.md
    const orgPath = join(dir, "ORG.md");
    let org = readFileSync(orgPath, "utf-8");
    // Find the last ### heading in Structure and append after
    const structureIdx = org.indexOf("## Structure");
    expect(structureIdx).toBeGreaterThan(-1);
    // Find the next ## section after Structure (or end of file)
    const afterStructure = org.indexOf("\n## ", structureIdx + 1);
    const insertPos = afterStructure > 0 ? afterStructure : org.length;
    const newAgent = "\n### New Agent — Worker\n\n- **Level:** 3\n- **Domain:** Testing\n\n";
    org = org.slice(0, insertPos) + newAgent + org.slice(insertPos);
    writeFileSync(orgPath, org, "utf-8");

    const result = regenerate(dir, false);
    const created = result.changes.filter((c) => c.status === "created");
    expect(created.length).toBeGreaterThan(0);

    // New agent workspace should exist
    expect(existsSync(join(dir, "workspaces", "new-agent", "SOUL.md"))).toBe(true);
  });

  it("preserves tasks.json and custom workspace files", () => {
    const dir = setupScaffold();

    // Add a custom file to first agent workspace
    const agentsJson = JSON.parse(readFileSync(join(dir, "openclaw-agents.json"), "utf-8"));
    const firstWs = agentsJson[0]?.workspace;
    const customPath = join(dir, firstWs, "custom-notes.md");
    writeFileSync(customPath, "my custom notes");

    // Verify tasks.json exists
    const tasksPath = join(dir, ".openspawn", "tasks.json");
    expect(existsSync(tasksPath)).toBe(true);
    const tasksBefore = readFileSync(tasksPath, "utf-8");

    // Regenerate
    regenerate(dir, false);

    // Custom file preserved
    expect(readFileSync(customPath, "utf-8")).toBe("my custom notes");

    // Tasks preserved
    expect(readFileSync(tasksPath, "utf-8")).toBe(tasksBefore);
  });

  it("updates openclaw-agents.json when model config changes", () => {
    const dir = setupScaffold();

    const configPath = join(dir, "openspawn.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    config.llm.models.default = "gpt-4o-mini";
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");

    const result = regenerate(dir, false);

    const agentsJsonChange = result.changes.find((c) => c.path === "openclaw-agents.json");
    expect(agentsJsonChange?.status).toBe("updated");

    const newAgents = JSON.parse(readFileSync(join(dir, "openclaw-agents.json"), "utf-8"));
    const workerAgents = newAgents.filter(
      (a: { level: number }) => a.level < config.llm.seniorThreshold,
    );
    for (const a of workerAgents) {
      expect(a.model).toBe("gpt-4o-mini");
    }
  });
});
