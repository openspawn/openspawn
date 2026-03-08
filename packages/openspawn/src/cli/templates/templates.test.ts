import { describe, it, expect } from "vitest";
import { getTemplate, listTemplates, renderTemplate } from "./index.js";

describe("templates", () => {
  it("lists all 11 templates", () => {
    const all = listTemplates();
    expect(all.length).toBe(11);
  });

  it("has 4 general templates", () => {
    const general = listTemplates().filter((t) => t.category === "general");
    expect(general.length).toBe(4);
  });

  it("has 7 industry templates", () => {
    const industry = listTemplates().filter((t) => t.category === "industry");
    expect(industry.length).toBe(7);
  });

  it("gets template by name", () => {
    const tmpl = getTemplate("assistant-team");
    expect(tmpl).toBeDefined();
    expect(tmpl!.label).toBe("Personal Assistant Team");
  });

  it("returns undefined for unknown template", () => {
    expect(getTemplate("does-not-exist")).toBeUndefined();
  });

  it("renders template with team name", () => {
    const tmpl = getTemplate("assistant-team")!;
    const rendered = renderTemplate(tmpl, "Acme Corp");
    expect(rendered).toContain("# Acme Corp");
    expect(rendered).not.toContain("{{TEAM_NAME}}");
  });

  it("every template has required sections", () => {
    for (const tmpl of listTemplates()) {
      expect(tmpl.content).toContain("{{TEAM_NAME}}");
      expect(tmpl.content).toContain("## Structure");
      expect(tmpl.culturePreset).toBeTruthy();
      expect(tmpl.description).toBeTruthy();
    }
  });
});
