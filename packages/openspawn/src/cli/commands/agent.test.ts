import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  toAgentId,
  scaffoldAgent,
  generateAgentsMd,
  generateSoulMd,
  generateIdentityMd,
  generateUserMd,
  type AgentConfig,
  type Teammate,
} from "../../core/agent-scaffold.js";

// ── Test Helpers ────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  const dir = join(tmpdir(), `openspawn-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeSkillDir(baseDir: string): string {
  const skillDir = join(baseDir, "a2a-reporter");
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), "# A2A Reporter\nTest skill.");
  mkdirSync(join(skillDir, "scripts"), { recursive: true });
  writeFileSync(join(skillDir, "scripts", "report.sh"), "#!/bin/bash\necho test");
  return skillDir;
}

const TEST_CONFIG: AgentConfig = {
  name: "Writer",
  role: "writer",
  level: 5,
  skills: ["docs", "markdown", "tutorials"],
  model: "anthropic/claude-haiku-3-5",
};

// ── toAgentId ───────────────────────────────────────────────────────────────

describe("toAgentId", () => {
  it("converts name to lowercase kebab-case", () => {
    expect(toAgentId("Writer")).toBe("writer");
    expect(toAgentId("PM")).toBe("pm");
    expect(toAgentId("UX Designer")).toBe("ux-designer");
    expect(toAgentId("Code Review Bot")).toBe("code-review-bot");
  });

  it("strips leading/trailing hyphens", () => {
    expect(toAgentId("--test--")).toBe("test");
  });

  it("handles special characters", () => {
    expect(toAgentId("agent@123!")).toBe("agent-123");
  });
});

// ── Template Generation ─────────────────────────────────────────────────────

describe("generateAgentsMd", () => {
  it("generates valid AGENTS.md with identity", () => {
    const md = generateAgentsMd(TEST_CONFIG, "writer");
    expect(md).toContain("# AGENTS.md — Writer");
    expect(md).toContain("**Name:** Writer");
    expect(md).toContain("**Role:** writer");
    expect(md).toContain("**Level:** 5");
    expect(md).toContain("**Agent ID:** writer");
    expect(md).toContain("**Model:** anthropic/claude-haiku-3-5");
  });

  it("includes A2A protocol instructions", () => {
    const md = generateAgentsMd(TEST_CONFIG, "writer");
    expect(md).toContain("A2A Protocol");
    expect(md).toContain("[a2a:task:<uuid>]");
    expect(md).toContain("127.0.0.1:3380");
  });

  it("includes teammates when provided", () => {
    const teammates: Teammate[] = [
      { name: "PM", level: 7, role: "project-manager", skills: "planning, tracking" },
      { name: "Engineer", level: 5, role: "developer", skills: "code, typescript" },
    ];
    const md = generateAgentsMd(TEST_CONFIG, "writer", teammates);
    expect(md).toContain("**PM** (L7, project-manager)");
    expect(md).toContain("**Engineer** (L5, developer)");
  });

  it("shows placeholder when no teammates", () => {
    const md = generateAgentsMd(TEST_CONFIG, "writer", []);
    expect(md).toContain("No teammates registered yet");
  });
});

describe("generateSoulMd", () => {
  it("generates role-appropriate personality for writer", () => {
    const soul = generateSoulMd(TEST_CONFIG);
    expect(soul).toContain("# SOUL.md — Writer");
    expect(soul).toContain("technical writer");
  });

  it("generates role-appropriate personality for PM", () => {
    const soul = generateSoulMd({ ...TEST_CONFIG, name: "PM", role: "project-manager" });
    expect(soul).toContain("project manager");
    expect(soul).toContain("Organized, decisive");
  });

  it("generates role-appropriate personality for developer", () => {
    const soul = generateSoulMd({ ...TEST_CONFIG, name: "Engineer", role: "developer" });
    expect(soul).toContain("developer");
    expect(soul).toContain("clean code");
  });

  it("falls back for unknown roles", () => {
    const soul = generateSoulMd({ ...TEST_CONFIG, name: "Custom", role: "custom-role" });
    expect(soul).toContain("custom-role");
    expect(soul).toContain("specialty");
  });
});

describe("generateIdentityMd", () => {
  it("includes name, role, and emoji", () => {
    const identity = generateIdentityMd(TEST_CONFIG, "writer");
    expect(identity).toContain("# IDENTITY.md — Writer");
    expect(identity).toContain("**Name:** Writer");
    expect(identity).toContain("**Role:** writer");
    expect(identity).toContain("**Emoji:** ✍️");
  });

  it("uses correct emoji for developer", () => {
    const identity = generateIdentityMd({ ...TEST_CONFIG, role: "developer" }, "dev");
    expect(identity).toContain("💻");
  });

  it("uses fallback emoji for unknown role", () => {
    const identity = generateIdentityMd({ ...TEST_CONFIG, role: "unknown" }, "x");
    expect(identity).toContain("🤖");
  });
});

describe("generateUserMd", () => {
  it("includes Adam's details", () => {
    const user = generateUserMd();
    expect(user).toContain("Adam");
    expect(user).toContain("Founder & CEO");
    expect(user).toContain("Atlantic");
  });
});

// ── Workspace Scaffolding ───────────────────────────────────────────────────

describe("scaffoldAgent", () => {
  let tmpDir: string;
  let skillDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    skillDir = makeSkillDir(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates workspace with all expected files", () => {
    const config: AgentConfig = {
      ...TEST_CONFIG,
      workspace: join(tmpDir, "workspace"),
    };

    const result = scaffoldAgent(config, [], { skillSourceDir: skillDir });

    expect(result.agentId).toBe("writer");
    expect(result.workspace).toBe(join(tmpDir, "workspace"));
    expect(existsSync(join(result.workspace, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(result.workspace, "SOUL.md"))).toBe(true);
    expect(existsSync(join(result.workspace, "IDENTITY.md"))).toBe(true);
    expect(existsSync(join(result.workspace, "USER.md"))).toBe(true);
    expect(existsSync(join(result.workspace, ".agent-manifest.json"))).toBe(true);
  });

  it("creates memory directory", () => {
    const config: AgentConfig = {
      ...TEST_CONFIG,
      workspace: join(tmpDir, "workspace"),
    };

    const result = scaffoldAgent(config, [], { skillSourceDir: skillDir });

    expect(existsSync(join(result.workspace, "memory"))).toBe(true);
  });

  it("copies a2a-reporter skill", () => {
    const config: AgentConfig = {
      ...TEST_CONFIG,
      workspace: join(tmpDir, "workspace"),
    };

    const result = scaffoldAgent(config, [], { skillSourceDir: skillDir });

    expect(result.a2aSkillCopied).toBe(true);
    expect(existsSync(join(result.workspace, "skills", "a2a-reporter", "SKILL.md"))).toBe(true);
    expect(existsSync(join(result.workspace, "skills", "a2a-reporter", "scripts", "report.sh"))).toBe(true);
  });

  it("handles missing skill source gracefully", () => {
    const config: AgentConfig = {
      ...TEST_CONFIG,
      workspace: join(tmpDir, "workspace"),
    };

    const result = scaffoldAgent(config, [], {
      skillSourceDir: join(tmpDir, "nonexistent"),
    });

    expect(result.a2aSkillCopied).toBe(false);
  });

  it("writes valid manifest JSON", () => {
    const config: AgentConfig = {
      ...TEST_CONFIG,
      workspace: join(tmpDir, "workspace"),
    };

    const result = scaffoldAgent(config, [], { skillSourceDir: skillDir });

    const manifest = JSON.parse(
      readFileSync(join(result.workspace, ".agent-manifest.json"), "utf-8"),
    );
    expect(manifest.agentId).toBe("writer");
    expect(manifest.name).toBe("Writer");
    expect(manifest.role).toBe("writer");
    expect(manifest.level).toBe(5);
    expect(manifest.skills).toEqual(["docs", "markdown", "tutorials"]);
    expect(manifest.model).toBe("anthropic/claude-haiku-3-5");
    expect(manifest.createdAt).toBeTruthy();
  });

  it("includes teammates in AGENTS.md", () => {
    const config: AgentConfig = {
      ...TEST_CONFIG,
      workspace: join(tmpDir, "workspace"),
    };
    const teammates: Teammate[] = [
      { name: "PM", level: 7, role: "project-manager", skills: "planning" },
    ];

    scaffoldAgent(config, teammates, { skillSourceDir: skillDir });

    const agents = readFileSync(join(tmpDir, "workspace", "AGENTS.md"), "utf-8");
    expect(agents).toContain("**PM** (L7, project-manager)");
  });
});

// ── Batch Support ───────────────────────────────────────────────────────────

describe("batch scaffolding", () => {
  let tmpDir: string;
  let skillDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    skillDir = makeSkillDir(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates multiple agents with cross-references", () => {
    const configs: AgentConfig[] = [
      { name: "PM", role: "project-manager", level: 7, skills: ["planning"], model: "anthropic/claude-sonnet-4-5", workspace: join(tmpDir, "pm") },
      { name: "Writer", role: "writer", level: 5, skills: ["docs"], model: "anthropic/claude-haiku-3-5", workspace: join(tmpDir, "writer") },
    ];

    for (const config of configs) {
      const teammates: Teammate[] = configs
        .filter((c) => c.name !== config.name)
        .map((c) => ({ name: c.name, level: c.level, role: c.role, skills: c.skills.join(", ") }));

      scaffoldAgent(config, teammates, { skillSourceDir: skillDir });
    }

    // PM's AGENTS.md should mention Writer
    const pmAgents = readFileSync(join(tmpDir, "pm", "AGENTS.md"), "utf-8");
    expect(pmAgents).toContain("**Writer** (L5, writer)");

    // Writer's AGENTS.md should mention PM
    const writerAgents = readFileSync(join(tmpDir, "writer", "AGENTS.md"), "utf-8");
    expect(writerAgents).toContain("**PM** (L7, project-manager)");
  });
});
