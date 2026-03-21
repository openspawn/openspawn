import { describe, it, expect } from "vitest";
import { createSkillsCommand } from "./skills.js";

describe("skills command", () => {
  it("creates a valid commander command", () => {
    const cmd = createSkillsCommand();
    expect(cmd.name()).toBe("skills");
    expect(cmd.description()).toContain("skill");
  });

  it("has list subcommand", () => {
    const cmd = createSkillsCommand();
    const sub = cmd.commands.find((c) => c.name() === "list");
    expect(sub).toBeDefined();
  });

  it("has validate subcommand", () => {
    const cmd = createSkillsCommand();
    const sub = cmd.commands.find((c) => c.name() === "validate");
    expect(sub).toBeDefined();
  });

  it("has import subcommand", () => {
    const cmd = createSkillsCommand();
    const sub = cmd.commands.find((c) => c.name() === "import");
    expect(sub).toBeDefined();
  });

  it("has export subcommand", () => {
    const cmd = createSkillsCommand();
    const sub = cmd.commands.find((c) => c.name() === "export");
    expect(sub).toBeDefined();
  });
});
