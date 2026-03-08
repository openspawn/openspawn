import { describe, it, expect } from "vitest";
import {
  VALUE_DEFINITIONS,
  DEFAULT_VALUES,
  getConflicts,
  formatValueWarning,
} from "./alignment.js";

describe("alignment", () => {
  it("defines all 8 values", () => {
    expect(VALUE_DEFINITIONS.length).toBe(8);
  });

  it("has 5 default values", () => {
    expect(DEFAULT_VALUES.length).toBe(5);
  });

  it("detects speed/rigor conflict", () => {
    const conflicts = getConflicts(["speed", "rigor"]);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]).toContain("Speed");
    expect(conflicts[0]).toContain("Rigor");
  });

  it("no conflicts for default values", () => {
    const conflicts = getConflicts(DEFAULT_VALUES);
    expect(conflicts.length).toBe(0);
  });

  it("warns when more than 5 values selected", () => {
    const warning = formatValueWarning(6);
    expect(warning).toContain("6 values");
    expect(warning).toContain("token cost");
  });

  it("no warning for 5 or fewer", () => {
    expect(formatValueWarning(5)).toBeUndefined();
  });
});
