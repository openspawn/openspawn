import { describe, it, expect } from "vitest";
import { defaultConfig } from "./config.js";

describe("spawn config defaults", () => {
  it("has maxConcurrentAgents default of 2", () => {
    expect(defaultConfig.spawning.maxConcurrentAgents).toBe(2);
  });

  it("has idleTimeoutSeconds default of 300", () => {
    expect(defaultConfig.spawning.idleTimeoutSeconds).toBe(300);
  });

  it("has runtime mode default of local", () => {
    expect(defaultConfig.runtime.mode).toBe("local");
  });

  it("has database default pointing to .openspawn", () => {
    expect(defaultConfig.runtime.database).toContain("openspawn.db");
  });
});
