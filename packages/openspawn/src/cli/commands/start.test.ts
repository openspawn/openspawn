import { describe, it, expect } from "vitest";
import { buildServerCommand } from "./start.js";

describe("start command", () => {
  it("builds uv run command with project dir", () => {
    const cmd = buildServerCommand("/tmp/myorg", "/path/to/api");
    expect(cmd[0]).toBe("uv");
    expect(cmd).toContain("openspawn-server");
    expect(cmd).toContain("--project-dir");
    expect(cmd).toContain("/tmp/myorg");
    expect(cmd).toContain("--directory");
    expect(cmd).toContain("/path/to/api");
  });
});
