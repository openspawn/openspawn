import { describe, it, expect } from "vitest";
import { defaultAnswers, buildAnswersFromFlags } from "./wizard.js";
import { CulturePreset } from "../core/types.js";

describe("wizard", () => {
  it("provides complete default answers", () => {
    const answers = defaultAnswers();
    expect(answers.templateName).toBe("assistant-team");
    expect(answers.orgName).toBe("My Agent Team");
    expect(answers.culturePreset).toBe(CulturePreset.Agency);
    expect(answers.llmProvider).toBe("anthropic");
    expect(answers.values.length).toBe(5);
    expect(answers.budgetLimit).toBe(500);
    expect(answers.port).toBe(8787);
    expect(answers.deploy).toBe(false);
  });

  it("overrides defaults from CLI flags", () => {
    const answers = buildAnswersFromFlags({
      template: "dev-shop",
      port: 9000,
      deploy: true,
    });
    expect(answers.templateName).toBe("dev-shop");
    expect(answers.port).toBe(9000);
    expect(answers.deploy).toBe(true);
    expect(answers.orgName).toBe("My Agent Team");
  });

  it("uses template culture preset as default", () => {
    const answers = buildAnswersFromFlags({ template: "dev-shop" });
    expect(answers.culturePreset).toBe(CulturePreset.Startup);
  });

  it("falls back to agency preset for unknown template", () => {
    const answers = buildAnswersFromFlags({ template: "nonexistent" });
    expect(answers.culturePreset).toBe(CulturePreset.Agency);
  });
});
