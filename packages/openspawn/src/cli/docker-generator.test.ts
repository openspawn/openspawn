import { describe, it, expect } from "vitest";
import { generateDockerInfra } from "./docker-generator.js";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("docker generator", () => {
  it("creates docker-compose.yml with postgres and redis", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-docker-"));
    generateDockerInfra(dir, 8787);
    const compose = readFileSync(join(dir, "docker-compose.yml"), "utf-8");
    expect(compose).toContain("postgres");
    expect(compose).toContain("redis");
    expect(compose).toContain("5432");
    expect(compose).toContain("6379");
  });

  it("creates .env with generated secrets", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-docker-"));
    generateDockerInfra(dir, 8787);
    const env = readFileSync(join(dir, ".env"), "utf-8");
    expect(env).toContain("DATABASE_URL=");
    expect(env).toContain("REDIS_URL=");
    expect(env).toContain("POSTGRES_PASSWORD=");
  });

  it("generates unique postgres password each time", () => {
    const dir1 = mkdtempSync(join(tmpdir(), "os-docker-"));
    const dir2 = mkdtempSync(join(tmpdir(), "os-docker-"));
    generateDockerInfra(dir1, 8787);
    generateDockerInfra(dir2, 8787);
    const env1 = readFileSync(join(dir1, ".env"), "utf-8");
    const env2 = readFileSync(join(dir2, ".env"), "utf-8");
    expect(env1).not.toBe(env2);
  });
});
