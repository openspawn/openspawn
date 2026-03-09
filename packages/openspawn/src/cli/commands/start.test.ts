import { resolve } from "node:path";
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

  it("always starts with uv", () => {
    const cmd = buildServerCommand("/any/dir", "/any/api");
    expect(cmd[0]).toBe("uv");
  });

  it("uses absolute paths", () => {
    const projectDir = resolve("/tmp/myorg");
    const apiDir = resolve("/opt/openspawn/apps/api");
    const cmd = buildServerCommand(projectDir, apiDir);
    // cmd[3] = apiDir (after --directory), cmd[6] = projectDir (after --project-dir)
    expect(cmd[3]).toMatch(/^\//);
    expect(cmd[6]).toMatch(/^\//);
  });
});
