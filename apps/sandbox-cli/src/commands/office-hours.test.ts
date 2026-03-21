import { describe, it, expect } from "vitest";
import { createOfficeHoursCommand } from "./office-hours.js";

describe("office-hours command", () => {
  it("creates a valid commander command", () => {
    const cmd = createOfficeHoursCommand();
    expect(cmd.name()).toBe("office-hours");
    expect(cmd.description()).toContain("scope challenge");
  });

  it("has --output option", () => {
    const cmd = createOfficeHoursCommand();
    const outputOption = cmd.options.find(
      (o) => o.long === "--output",
    );
    expect(outputOption).toBeDefined();
  });

  it("has --non-interactive option", () => {
    const cmd = createOfficeHoursCommand();
    const option = cmd.options.find(
      (o) => o.long === "--non-interactive",
    );
    expect(option).toBeDefined();
  });
});
