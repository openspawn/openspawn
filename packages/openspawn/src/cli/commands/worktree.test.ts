import { describe, it, expect } from "vitest";
import {
  getWorktreePath,
  getDefaultBranch,
  validateAgentId,
  validateRepoString,
  isProtectedBranch,
  generatePrePushHook,
  generatePreCommitHook,
  findRepoRoot,
  type ExecFn,
} from "../../core/worktree.js";
import { parseReposString, parseOrgMdContent, generateOrgMd } from "../../core/org-parser.js";
import { homedir } from "node:os";
import { join } from "node:path";

// ── Path Generation ──────────────────────────────────────────────────────────

describe("getWorktreePath", () => {
  it("generates correct path for agent worktree", () => {
    const path = getWorktreePath("dennis", "openspawn", "openspawn");
    expect(path).toBe(join(homedir(), ".openspawn", "agents", "dennis", "repos", "openspawn", "openspawn"));
  });

  it("handles different org/repo combinations", () => {
    const path = getWorktreePath("ceo", "my-org", "my-repo");
    expect(path).toBe(join(homedir(), ".openspawn", "agents", "ceo", "repos", "my-org", "my-repo"));
  });

  it("handles hyphenated agent ids", () => {
    const path = getWorktreePath("agent-1", "org", "repo");
    expect(path).toContain("agent-1");
  });
});

// ── Branch Name Convention ───────────────────────────────────────────────────

describe("getDefaultBranch", () => {
  it("generates <agent-id>-workspace branch name", () => {
    expect(getDefaultBranch("dennis")).toBe("dennis-workspace");
    expect(getDefaultBranch("ceo")).toBe("ceo-workspace");
    expect(getDefaultBranch("agent-1")).toBe("agent-1-workspace");
  });
});

// ── Agent ID Validation ──────────────────────────────────────────────────────

describe("validateAgentId", () => {
  it("accepts valid agent IDs", () => {
    expect(validateAgentId("dennis")).toBe(true);
    expect(validateAgentId("ceo")).toBe(true);
    expect(validateAgentId("agent-1")).toBe(true);
    expect(validateAgentId("Agent_2")).toBe(true);
    expect(validateAgentId("a")).toBe(true);
  });

  it("rejects invalid agent IDs", () => {
    expect(validateAgentId("")).toBe(false);
    expect(validateAgentId("-starts-with-dash")).toBe(false);
    expect(validateAgentId("has spaces")).toBe(false);
    expect(validateAgentId("has/slash")).toBe(false);
    expect(validateAgentId(".dotstart")).toBe(false);
  });
});

// ── Repo String Validation ───────────────────────────────────────────────────

describe("validateRepoString", () => {
  it("parses valid org/repo strings", () => {
    expect(validateRepoString("openspawn/openspawn")).toEqual({ org: "openspawn", repo: "openspawn" });
    expect(validateRepoString("my-org/my-repo")).toEqual({ org: "my-org", repo: "my-repo" });
    expect(validateRepoString("org.name/repo.name")).toEqual({ org: "org.name", repo: "repo.name" });
  });

  it("rejects invalid repo strings", () => {
    expect(validateRepoString("noslash")).toBeNull();
    expect(validateRepoString("too/many/slashes")).toBeNull();
    expect(validateRepoString("/empty-org")).toBeNull();
    expect(validateRepoString("empty-repo/")).toBeNull();
    expect(validateRepoString("")).toBeNull();
  });
});

// ── Protected Branch Detection ───────────────────────────────────────────────

describe("isProtectedBranch", () => {
  it("detects protected branches", () => {
    expect(isProtectedBranch("main")).toBe(true);
    expect(isProtectedBranch("master")).toBe(true);
    expect(isProtectedBranch("develop")).toBe(true);
    expect(isProtectedBranch("release")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isProtectedBranch("Main")).toBe(true);
    expect(isProtectedBranch("MASTER")).toBe(true);
  });

  it("allows non-protected branches", () => {
    expect(isProtectedBranch("dennis-workspace")).toBe(false);
    expect(isProtectedBranch("feat/new-feature")).toBe(false);
    expect(isProtectedBranch("fix/bug")).toBe(false);
  });
});

// ── Hook Content Generation ──────────────────────────────────────────────────

describe("generatePrePushHook", () => {
  it("generates a valid shell script", () => {
    const hook = generatePrePushHook("dennis");
    expect(hook).toContain("#!/bin/sh");
    expect(hook).toContain("dennis");
  });

  it("includes protected branch list", () => {
    const hook = generatePrePushHook("ceo");
    expect(hook).toContain("main");
    expect(hook).toContain("master");
    expect(hook).toContain("develop");
    expect(hook).toContain("release");
  });

  it("blocks pushes to protected branches", () => {
    const hook = generatePrePushHook("agent-1");
    expect(hook).toContain("BLOCKED");
    expect(hook).toContain("agent-1");
    expect(hook).toContain("exit 1");
  });

  it("suggests PR creation", () => {
    const hook = generatePrePushHook("dennis");
    expect(hook).toContain("gh pr create");
  });
});

describe("generatePreCommitHook", () => {
  it("generates a valid shell script", () => {
    const hook = generatePreCommitHook("dennis");
    expect(hook).toContain("#!/bin/sh");
    expect(hook).toContain("dennis");
  });

  it("warns about git init usage", () => {
    const hook = generatePreCommitHook("ceo");
    expect(hook).toContain("git init");
    expect(hook).toContain("WARNING");
  });
});

// ── Repo String Parsing (ORG.md) ─────────────────────────────────────────────

describe("parseReposString", () => {
  it("parses a single repo with access", () => {
    const repos = parseReposString("openspawn/openspawn (write)");
    expect(repos).toHaveLength(1);
    expect(repos[0]).toEqual({
      org: "openspawn",
      repo: "openspawn",
      access: "write",
    });
  });

  it("parses a repo with access and branch", () => {
    const repos = parseReposString("openspawn/openspawn (write, branch: dennis-workspace)");
    expect(repos).toHaveLength(1);
    expect(repos[0]).toEqual({
      org: "openspawn",
      repo: "openspawn",
      access: "write",
      branch: "dennis-workspace",
    });
  });

  it("parses multiple repos", () => {
    const repos = parseReposString(
      "openspawn/openspawn (write, branch: dennis-workspace), openspawn/docs (read)",
    );
    expect(repos).toHaveLength(2);
    expect(repos[0].org).toBe("openspawn");
    expect(repos[0].repo).toBe("openspawn");
    expect(repos[0].access).toBe("write");
    expect(repos[0].branch).toBe("dennis-workspace");
    expect(repos[1].org).toBe("openspawn");
    expect(repos[1].repo).toBe("docs");
    expect(repos[1].access).toBe("read");
  });

  it("defaults to read access", () => {
    const repos = parseReposString("openspawn/openspawn");
    expect(repos).toHaveLength(1);
    expect(repos[0].access).toBe("read");
  });

  it("handles empty string", () => {
    expect(parseReposString("")).toEqual([]);
  });

  it("handles repo without modifiers", () => {
    const repos = parseReposString("org/repo");
    expect(repos).toHaveLength(1);
    expect(repos[0]).toEqual({ org: "org", repo: "repo", access: "read" });
  });

  it("handles read-only access", () => {
    const repos = parseReposString("org/repo (read)");
    expect(repos).toHaveLength(1);
    expect(repos[0].access).toBe("read");
  });
});

// ── ORG.md Repos Integration ─────────────────────────────────────────────────

describe("ORG.md repos parsing", () => {
  it("parses repos from agent entries", () => {
    const org = parseOrgMdContent(`# Test Org

## Structure

### Dennis — coo

- **Level:** 10
- **Domain:** operations
- **Repos:** openspawn/openspawn (write, branch: dennis-workspace)
`);
    expect(org.agents).toHaveLength(1);
    expect(org.agents[0].repos).toBeDefined();
    expect(org.agents[0].repos).toHaveLength(1);
    const repos0 = org.agents[0].repos ?? [];
    expect(repos0[0]).toEqual({
      org: "openspawn",
      repo: "openspawn",
      access: "write",
      branch: "dennis-workspace",
    });
  });

  it("parses multiple repos for an agent", () => {
    const org = parseOrgMdContent(`# Test Org

## Structure

### Dennis — coo

- **Level:** 10
- **Domain:** operations
- **Repos:** openspawn/openspawn (write, branch: dennis-workspace), openspawn/docs (read)
`);
    const multiRepos = org.agents[0].repos ?? [];
    expect(multiRepos).toHaveLength(2);
    expect(multiRepos[0].access).toBe("write");
    expect(multiRepos[1].access).toBe("read");
  });

  it("agents without repos have undefined repos field", () => {
    const org = parseOrgMdContent(`# Test Org

## Structure

### Worker — worker

- **Level:** 4
- **Domain:** engineering
`);
    expect(org.agents[0].repos).toBeUndefined();
  });

  it("parses repos from sub-role agents", () => {
    const org = parseOrgMdContent(`# Test Org

## Structure

### Engineering

#### Lead Engineer — Engineering Lead

- **Level:** 7
- **Domain:** engineering
- **Repos:** openspawn/openspawn (write, branch: lead-workspace)
`);
    const lead = org.agents.find((a) => a.id === "lead-engineer");
    expect(lead).toBeDefined();
    const leadRepos = lead?.repos ?? [];
    expect(leadRepos).toHaveLength(1);
    expect(leadRepos[0].branch).toBe("lead-workspace");
  });
});

// ── ORG.md Generation with Repos ─────────────────────────────────────────────

describe("ORG.md generation with repos", () => {
  it("round-trips repos through generate/parse", () => {
    const input = parseOrgMdContent(`# Test Org

## Structure

### Dennis — coo

- **Level:** 10
- **Domain:** operations
- **Repos:** openspawn/openspawn (write, branch: dennis-workspace)
`);

    const generated = generateOrgMd(input);
    expect(generated).toContain("openspawn/openspawn (write, branch: dennis-workspace)");

    // Parse the generated output
    const reparsed = parseOrgMdContent(generated);
    const reparsedRepos = reparsed.agents[0].repos ?? [];
    expect(reparsedRepos).toHaveLength(1);
    expect(reparsedRepos[0].access).toBe("write");
    expect(reparsedRepos[0].branch).toBe("dennis-workspace");
  });
});

// ── findRepoRoot ─────────────────────────────────────────────────────────────

describe("findRepoRoot", () => {
  it("returns null when no repo found", () => {
    const mockExec: ExecFn = () => {
      throw new Error("not found");
    };
    // This will return null since test dirs don't exist
    const result = findRepoRoot("nonexistent-org", "nonexistent-repo", mockExec);
    expect(result).toBeNull();
  });
});
