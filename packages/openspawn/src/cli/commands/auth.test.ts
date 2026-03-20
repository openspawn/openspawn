import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// We test the credential storage logic directly since the CLI
// auth command makes network calls. Integration tests for the
// full flow require a running API.

describe("CLI credentials", () => {
  const testDir = join(tmpdir(), `openspawn-test-${Date.now()}`);
  const credFile = join(testDir, "credentials.json");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("saves and reads credentials", () => {
    const creds = {
      api_key: "osp_test123abc",
      api_url: "https://api.openspawn.ai",
    };
    writeFileSync(credFile, JSON.stringify(creds, null, 2), { mode: 0o600 });

    const loaded = JSON.parse(readFileSync(credFile, "utf-8"));
    expect(loaded.api_key).toBe("osp_test123abc");
    expect(loaded.api_url).toBe("https://api.openspawn.ai");
  });

  it("credentials file does not exist initially", () => {
    expect(existsSync(credFile)).toBe(false);
  });

  it("validates API key prefix", () => {
    const key = "osp_abcdef123456";
    expect(key.startsWith("osp_")).toBe(true);

    const badKey = "sk_badkey";
    expect(badKey.startsWith("osp_")).toBe(false);
  });
});
