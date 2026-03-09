import { describe, it, expect } from "vitest";
import { scaffold } from "./init.js";
import { defaultAnswers } from "../wizard.js";
import { listTemplates, getTemplate, renderTemplate } from "../templates/index.js";
import { CulturePreset } from "../../core/types.js";
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("init scaffold", () => {
  it("creates ORG.md from template", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, "ORG.md"))).toBe(true);
    const org = readFileSync(join(dir, "ORG.md"), "utf-8");
    expect(org).toContain("# My Agent Team");
  });

  it("creates openspawn.config.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, "openspawn.config.json"))).toBe(true);
    const raw = JSON.parse(readFileSync(join(dir, "openspawn.config.json"), "utf-8"));
    expect(raw.coordinator.port).toBe(8787);
  });

  it("creates .gitignore", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    const gi = readFileSync(join(dir, ".gitignore"), "utf-8");
    expect(gi).toContain("node_modules");
    expect(gi).toContain(".env");
  });

  it("creates workspaces with SOUL.md", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, "workspaces"))).toBe(true);
    expect(existsSync(join(dir, "openclaw-agents.json"))).toBe(true);
  });

  it("creates .openspawn/tasks.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, ".openspawn", "tasks.json"))).toBe(true);
  });

  it("does not overwrite existing ORG.md", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    writeFileSync(join(dir, "ORG.md"), "existing");
    scaffold(dir, defaultAnswers());
    const org = readFileSync(join(dir, "ORG.md"), "utf-8");
    expect(org).toBe("existing");
  });

  it("generates docker infra when deploy is true", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    const answers = { ...defaultAnswers(), deploy: true };
    scaffold(dir, answers);
    expect(existsSync(join(dir, "docker-compose.yml"))).toBe(true);
    expect(existsSync(join(dir, ".env"))).toBe(true);
  });

  it("skips docker infra when deploy is false", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, "docker-compose.yml"))).toBe(false);
  });
});

describe("init scaffolding", () => {
  it("all templates produce valid ORG.md with agents table or structure", () => {
    for (const tmpl of listTemplates()) {
      const rendered = renderTemplate(tmpl, "Test Corp");
      const hasTable = rendered.includes("| Name");
      const hasStructure = rendered.includes("## Structure");
      expect(hasTable || hasStructure, `${tmpl.name} missing agents/structure`).toBe(true);
    }
  });

  it("all templates have unique names", () => {
    const names = listTemplates().map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all templates have valid culture presets", () => {
    const validPresets = Object.values(CulturePreset);
    for (const tmpl of listTemplates()) {
      expect(validPresets).toContain(tmpl.culturePreset);
    }
  });

  it("rendered template has correct team name", () => {
    const tmpl = getTemplate("assistant-team")!;
    const rendered = renderTemplate(tmpl, "Acme Corp");
    expect(rendered).toContain("# Acme Corp");
    expect(rendered).not.toContain("{{TEAM_NAME}}");
  });
});
