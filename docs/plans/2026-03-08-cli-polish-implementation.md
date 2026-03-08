# CLI Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite `npx openspawn init` from a 48-line stub into a full interactive wizard with 11 templates, organizational alignment framework, OpenClaw workspace generation, and two-tier deploy model.

**Architecture:** Template constants → @clack/prompts wizard → scaffold function → file generation. All wizard answers persisted in `openspawn.config.json`. Wizard steps have smart defaults so users can Enter through everything. `-y` flag skips wizard entirely.

**Tech Stack:** TypeScript (ESM), @clack/prompts, vitest, zod (for config schema)

**Design Doc:** `docs/plans/2026-03-08-cli-polish-design.md`

---

### Task 1: Add @clack/prompts dependency

**Files:**
- Modify: `packages/openspawn/package.json`

**Step 1: Install @clack/prompts**

Run: `cd packages/openspawn && pnpm add @clack/prompts`

**Step 2: Install @clack/prompts types**

Run: `cd packages/openspawn && pnpm add -D @types/node`

Note: @clack/prompts ships its own types, no separate @types needed. But ensure @types/node is present for `node:fs`, `node:path` imports.

**Step 3: Verify import works**

Create a quick smoke test — just import and ensure tsc compiles:

Run: `cd packages/openspawn && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add packages/openspawn/package.json pnpm-lock.yaml
git commit -m "chore(cli): add @clack/prompts dependency"
```

---

### Task 2: Define config schema and types

**Files:**
- Create: `packages/openspawn/src/core/config.ts`
- Modify: `packages/openspawn/src/core/types.ts`
- Test: `packages/openspawn/src/core/config.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/core/config.test.ts
import { describe, it, expect } from "vitest";
import { parseConfig, defaultConfig, writeConfig } from "./config.js";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("config", () => {
  it("returns default config when no file exists", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-cfg-"));
    const config = parseConfig(dir);
    expect(config.coordinator.port).toBe(8787);
    expect(config.llm.provider).toBe("anthropic");
    expect(config.budget.perAgentLimit).toBe(500);
    expect(config.alignment.values).toContain("ownership");
    expect(config.alignment.values.length).toBe(5);
  });

  it("reads config from file", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-cfg-"));
    writeFileSync(
      join(dir, "openspawn.config.json"),
      JSON.stringify({ coordinator: { port: 9999 } }),
    );
    const config = parseConfig(dir);
    expect(config.coordinator.port).toBe(9999);
    // defaults still applied for missing fields
    expect(config.llm.provider).toBe("anthropic");
  });

  it("writes config to file", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-cfg-"));
    writeConfig(dir, defaultConfig);
    const raw = readFileSync(join(dir, "openspawn.config.json"), "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed.coordinator.port).toBe(8787);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && npx vitest run src/core/config.test.ts`
Expected: FAIL — cannot resolve `./config.js`

**Step 3: Add types to types.ts**

Add to `packages/openspawn/src/core/types.ts`:

```typescript
// --- Config types ---

enum LlmProvider {
  Anthropic = "anthropic",
  OpenAI = "openai",
  Ollama = "ollama",
  Groq = "groq",
  OpenRouter = "openrouter",
}

enum OverageBehavior {
  PauseAndEscalate = "pause-and-escalate",
  WarnAndContinue = "warn-and-continue",
  HardStop = "hard-stop",
}

enum EscalationBehavior {
  Immediate = "immediate",
  Delayed = "delayed",
  Batched = "batched",
}

enum CulturePreset {
  Agency = "agency",
  Startup = "startup",
  Professional = "professional",
  Ops = "ops",
  Enterprise = "enterprise",
  Research = "research",
  Compliance = "compliance",
}

enum OrgValue {
  Ownership = "ownership",
  Transparency = "transparency",
  Measurement = "measurement",
  Subsidiarity = "subsidiarity",
  ContinuousImprovement = "continuous-improvement",
  Speed = "speed",
  Rigor = "rigor",
  Frugality = "frugality",
}

interface OpenSpawnConfig {
  orgFile: string;
  coordinator: {
    port: number;
  };
  llm: {
    provider: LlmProvider;
    models: {
      default: string;
      senior: string;
    };
    seniorThreshold: number;
  };
  budget: {
    perAgentLimit: number;
    period: string;
    alertThreshold: number;
    overageBehavior: OverageBehavior;
  };
  escalation: {
    behavior: EscalationBehavior;
  };
  alignment: {
    mission: string;
    vision: string;
    values: OrgValue[];
  };
  culture: {
    preset: CulturePreset;
  };
}
```

**Step 4: Implement config.ts**

```typescript
// packages/openspawn/src/core/config.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { OpenSpawnConfig } from "./types.js";
import {
  LlmProvider,
  OverageBehavior,
  EscalationBehavior,
  CulturePreset,
  OrgValue,
} from "./types.js";

const CONFIG_FILENAME = "openspawn.config.json";

export const defaultConfig: OpenSpawnConfig = {
  orgFile: "ORG.md",
  coordinator: { port: 8787 },
  llm: {
    provider: LlmProvider.Anthropic,
    models: {
      default: "claude-sonnet-4-20250514",
      senior: "claude-opus-4-20250514",
    },
    seniorThreshold: 7,
  },
  budget: {
    perAgentLimit: 500,
    period: "weekly",
    alertThreshold: 0.8,
    overageBehavior: OverageBehavior.PauseAndEscalate,
  },
  escalation: { behavior: EscalationBehavior.Immediate },
  alignment: {
    mission:
      "Deliver measurable outcomes through autonomous coordination, escalating when uncertain.",
    vision:
      "Every task owned, every blocker surfaced, every outcome measured.",
    values: [
      OrgValue.Ownership,
      OrgValue.Transparency,
      OrgValue.Measurement,
      OrgValue.Subsidiarity,
      OrgValue.ContinuousImprovement,
    ],
  },
  culture: { preset: CulturePreset.Agency },
};

export function parseConfig(dir: string): OpenSpawnConfig {
  const configPath = join(dir, CONFIG_FILENAME);
  if (!existsSync(configPath)) {
    return { ...defaultConfig };
  }
  const raw = JSON.parse(readFileSync(configPath, "utf-8"));
  return deepMerge(defaultConfig, raw);
}

export function writeConfig(dir: string, config: OpenSpawnConfig): void {
  const configPath = join(dir, CONFIG_FILENAME);
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
}

function deepMerge<T extends Record<string, unknown>>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults };
  for (const key of Object.keys(overrides) as Array<keyof T>) {
    const val = overrides[key];
    if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      typeof defaults[key] === "object" &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMerge(
        defaults[key] as Record<string, unknown>,
        val as Record<string, unknown>,
      ) as T[keyof T];
    } else if (val !== undefined) {
      result[key] = val as T[keyof T];
    }
  }
  return result;
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/openspawn && npx vitest run src/core/config.test.ts`
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add packages/openspawn/src/core/config.ts packages/openspawn/src/core/config.test.ts packages/openspawn/src/core/types.ts
git commit -m "feat(cli): add config schema with defaults and deep merge"
```

---

### Task 3: Create template system

**Files:**
- Create: `packages/openspawn/src/cli/templates/index.ts`
- Create: `packages/openspawn/src/cli/templates/general.ts`
- Create: `packages/openspawn/src/cli/templates/industry.ts`
- Create: `packages/openspawn/src/cli/templates/types.ts`
- Test: `packages/openspawn/src/cli/templates/templates.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/cli/templates/templates.test.ts
import { describe, it, expect } from "vitest";
import { getTemplate, listTemplates, renderTemplate } from "./index.js";

describe("templates", () => {
  it("lists all 11 templates", () => {
    const all = listTemplates();
    expect(all.length).toBe(11);
  });

  it("has 4 general templates", () => {
    const all = listTemplates();
    const general = all.filter((t) => t.category === "general");
    expect(general.length).toBe(4);
  });

  it("has 7 industry templates", () => {
    const all = listTemplates();
    const industry = all.filter((t) => t.category === "industry");
    expect(industry.length).toBe(7);
  });

  it("gets template by name", () => {
    const tmpl = getTemplate("assistant-team");
    expect(tmpl).toBeDefined();
    expect(tmpl?.label).toBe("Personal Assistant Team");
  });

  it("returns undefined for unknown template", () => {
    expect(getTemplate("does-not-exist")).toBeUndefined();
  });

  it("renders template with team name", () => {
    const tmpl = getTemplate("assistant-team");
    const rendered = renderTemplate(tmpl!, "Acme Corp");
    expect(rendered).toContain("# Acme Corp");
    expect(rendered).not.toContain("{{TEAM_NAME}}");
  });

  it("every template has required sections", () => {
    for (const tmpl of listTemplates()) {
      expect(tmpl.content).toContain("{{TEAM_NAME}}");
      expect(tmpl.content).toContain("## Structure");
      expect(tmpl.culturePreset).toBeTruthy();
      expect(tmpl.description).toBeTruthy();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && npx vitest run src/cli/templates/templates.test.ts`
Expected: FAIL — cannot resolve

**Step 3: Create template types**

```typescript
// packages/openspawn/src/cli/templates/types.ts
import type { CulturePreset } from "../../core/types.js";

export interface Template {
  name: string;
  label: string;
  description: string;
  emoji: string;
  category: "general" | "industry";
  culturePreset: CulturePreset;
  content: string;
}
```

**Step 4: Create general templates**

Port the 4 templates from `packages/cli/internal/templates/templates.go` into `packages/openspawn/src/cli/templates/general.ts`. Use the exact same ORG.md content from the Go source, but as TypeScript template literal strings. Each function returns a `Template` object.

Reference file: `packages/cli/internal/templates/templates.go` (lines 40-475)

```typescript
// packages/openspawn/src/cli/templates/general.ts
import { CulturePreset } from "../../core/types.js";
import type { Template } from "./types.js";

export function generalTemplates(): Template[] {
  return [assistantTeam(), contentAgency(), devShop(), researchLab()];
}
// ... each template function returns Template with content from Go source
```

**Step 5: Create industry templates**

Port the 7 templates from `apps/website/app/routes/templates.tsx`. Each template's `orgMd` field becomes the `content` field. Ensure they all follow the same `## Identity / ## Culture / ## Structure / ## Policies / ## Playbooks` structure, adding `{{TEAM_NAME}}` as the H1.

Reference file: `apps/website/app/routes/templates.tsx`

```typescript
// packages/openspawn/src/cli/templates/industry.ts
import { CulturePreset } from "../../core/types.js";
import type { Template } from "./types.js";

export function industryTemplates(): Template[] {
  return [
    saasOnboarding(), incidentResponse(), contractReview(),
    complianceMonitoring(), gameLiveOps(), catalogManagement(),
    clinicalTrialProcessing(),
  ];
}
// ... each template function returns Template with content from website source
```

**Step 6: Create index barrel**

```typescript
// packages/openspawn/src/cli/templates/index.ts
import type { Template } from "./types.js";
import { generalTemplates } from "./general.js";
import { industryTemplates } from "./industry.js";

export type { Template };
export { type Template as TemplateType } from "./types.js";

const ALL_TEMPLATES: Template[] = [
  ...generalTemplates(),
  ...industryTemplates(),
];

export function listTemplates(): Template[] {
  return ALL_TEMPLATES;
}

export function getTemplate(name: string): Template | undefined {
  return ALL_TEMPLATES.find((t) => t.name === name);
}

export function renderTemplate(template: Template, teamName: string): string {
  return template.content.replaceAll("{{TEAM_NAME}}", teamName);
}
```

Note: this is a templates-internal index, not a project-wide barrel file. It re-exports the template API surface only.

**Step 7: Run tests**

Run: `cd packages/openspawn && npx vitest run src/cli/templates/templates.test.ts`
Expected: PASS (7 tests)

**Step 8: Commit**

```bash
git add packages/openspawn/src/cli/templates/
git commit -m "feat(cli): add 11 org templates (4 general + 7 industry)"
```

---

### Task 4: Create alignment framework

**Files:**
- Create: `packages/openspawn/src/cli/alignment.ts`
- Test: `packages/openspawn/src/cli/alignment.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/cli/alignment.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && npx vitest run src/cli/alignment.test.ts`
Expected: FAIL

**Step 3: Implement alignment.ts**

```typescript
// packages/openspawn/src/cli/alignment.ts
import { OrgValue } from "../core/types.js";

export interface ValueDefinition {
  value: OrgValue;
  label: string;
  description: string;
  source: string;
  conflictsWith?: OrgValue;
  isDefault: boolean;
}

export const VALUE_DEFINITIONS: ValueDefinition[] = [
  {
    value: OrgValue.Ownership,
    label: "Ownership",
    description: "Every task has exactly one owner; it ships or it escalates",
    source: "Katzenbach & Smith, 'The Discipline of Teams'",
    isDefault: true,
  },
  {
    value: OrgValue.Transparency,
    label: "Transparency",
    description: "Surface problems early; silent failure is the worst outcome",
    source: "Amy Edmondson, psychological safety",
    isDefault: true,
  },
  {
    value: OrgValue.Measurement,
    label: "Measurement",
    description: "Track outcomes, not activity; if you can't measure it, don't claim it",
    source: "Peter Drucker, management by objectives",
    isDefault: true,
  },
  {
    value: OrgValue.Subsidiarity,
    label: "Subsidiarity",
    description: "Decisions made at the lowest competent level; don't escalate what you can solve",
    source: "Rogers & Blenko, 'Who Has the D?'",
    isDefault: true,
  },
  {
    value: OrgValue.ContinuousImprovement,
    label: "Continuous Improvement",
    description: "Document every mistake, update process, never repeat",
    source: "Peter Senge, learning organizations",
    isDefault: true,
  },
  {
    value: OrgValue.Speed,
    label: "Speed",
    description: "Bias toward action; ship small, iterate fast",
    source: "",
    conflictsWith: OrgValue.Rigor,
    isDefault: false,
  },
  {
    value: OrgValue.Rigor,
    label: "Rigor",
    description: "Depth over speed; verify before asserting",
    source: "",
    conflictsWith: OrgValue.Speed,
    isDefault: false,
  },
  {
    value: OrgValue.Frugality,
    label: "Frugality",
    description: "Prefer cheap models for mechanical tasks; expensive models only for reasoning",
    source: "",
    isDefault: false,
  },
];

export const DEFAULT_VALUES: OrgValue[] = VALUE_DEFINITIONS
  .filter((v) => v.isDefault)
  .map((v) => v.value);

export function getConflicts(selected: string[]): string[] {
  const conflicts: string[] = [];
  for (const def of VALUE_DEFINITIONS) {
    if (
      def.conflictsWith &&
      selected.includes(def.value) &&
      selected.includes(def.conflictsWith)
    ) {
      const other = VALUE_DEFINITIONS.find((d) => d.value === def.conflictsWith);
      if (other) {
        const msg = `${def.label} conflicts with ${other.label}`;
        // avoid duplicate (A conflicts B + B conflicts A)
        const reverse = `${other.label} conflicts with ${def.label}`;
        if (!conflicts.includes(msg) && !conflicts.includes(reverse)) {
          conflicts.push(msg);
        }
      }
    }
  }
  return conflicts;
}

export function formatValueWarning(count: number): string | undefined {
  if (count <= 5) return undefined;
  return `You selected ${count} values. More than 5 increases per-session token cost and may create conflicting guidance.`;
}
```

**Step 4: Run test**

Run: `cd packages/openspawn && npx vitest run src/cli/alignment.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add packages/openspawn/src/cli/alignment.ts packages/openspawn/src/cli/alignment.test.ts
git commit -m "feat(cli): add alignment framework with values, conflicts, warnings"
```

---

### Task 5: Create OpenClaw workspace generator

**Files:**
- Create: `packages/openspawn/src/cli/workspace-generator.ts`
- Test: `packages/openspawn/src/cli/workspace-generator.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/cli/workspace-generator.test.ts
import { describe, it, expect } from "vitest";
import { generateWorkspaces } from "./workspace-generator.js";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { OpenSpawnConfig } from "../core/types.js";
import { defaultConfig } from "../core/config.js";

const SAMPLE_ORG = `# Test Org

## Structure

### Boss — CEO
- **Level:** 10
- **Domain:** operations

#### Worker — Engineer
- **Level:** 4
- **Domain:** engineering
`;

describe("workspace generator", () => {
  it("creates workspace dirs per agent", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-ws-"));
    const result = generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    expect(existsSync(join(dir, "workspaces", "boss"))).toBe(true);
    expect(existsSync(join(dir, "workspaces", "worker"))).toBe(true);
    expect(result.agentCount).toBe(2);
  });

  it("creates SOUL.md with alignment section", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-ws-"));
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    const soul = readFileSync(join(dir, "workspaces", "boss", "SOUL.md"), "utf-8");
    expect(soul).toContain("Organizational Alignment");
    expect(soul).toContain("Boss");
    expect(soul).toContain("Level:** 10");
  });

  it("creates AGENTS.md in each workspace", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-ws-"));
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    expect(existsSync(join(dir, "workspaces", "boss", "AGENTS.md"))).toBe(true);
  });

  it("creates memory/ dir in each workspace", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-ws-"));
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    expect(existsSync(join(dir, "workspaces", "boss", "memory"))).toBe(true);
  });

  it("writes openclaw-agents.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-ws-"));
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    expect(existsSync(join(dir, "openclaw-agents.json"))).toBe(true);
    const agents = JSON.parse(readFileSync(join(dir, "openclaw-agents.json"), "utf-8"));
    expect(agents.length).toBe(2);
    expect(agents[0].model).toBeDefined();
  });

  it("assigns model based on level and config threshold", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-ws-"));
    generateWorkspaces(dir, SAMPLE_ORG, defaultConfig);
    const agents = JSON.parse(readFileSync(join(dir, "openclaw-agents.json"), "utf-8"));
    const boss = agents.find((a: { name: string }) => a.name === "Boss");
    const worker = agents.find((a: { name: string }) => a.name === "Worker");
    // L10 >= threshold 7 → senior model
    expect(boss.model).toBe(defaultConfig.llm.models.senior);
    // L4 < threshold 7 → default model
    expect(worker.model).toBe(defaultConfig.llm.models.default);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && npx vitest run src/cli/workspace-generator.test.ts`
Expected: FAIL

**Step 3: Implement workspace-generator.ts**

Port logic from `packages/cli/internal/openclaw/generator.go`:
- Parse ORG.md content using existing `parseOrgMdContent()` from `src/core/org-parser.ts`
- For each agent: create `workspaces/<sanitized-name>/` with `SOUL.md`, `AGENTS.md`, `memory/`
- SOUL.md includes: Organizational Alignment section (mission, values from config) + Identity section (name, role, domain, level, reports-to)
- Write `openclaw-agents.json` with model assignments based on `config.llm.seniorThreshold`

Reference: `packages/cli/internal/openclaw/generator.go` (lines 46-112)

**Step 4: Run tests**

Run: `cd packages/openspawn && npx vitest run src/cli/workspace-generator.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add packages/openspawn/src/cli/workspace-generator.ts packages/openspawn/src/cli/workspace-generator.test.ts
git commit -m "feat(cli): add OpenClaw workspace generator with SOUL.md + alignment"
```

---

### Task 6: Create interactive wizard

**Files:**
- Create: `packages/openspawn/src/cli/wizard.ts`
- Test: `packages/openspawn/src/cli/wizard.test.ts`

**Step 1: Write the failing test**

Test the non-interactive path (wizard internals are hard to unit test since @clack/prompts is interactive). Test the `buildAnswersFromFlags` helper and `defaultAnswers` export:

```typescript
// packages/openspawn/src/cli/wizard.test.ts
import { describe, it, expect } from "vitest";
import { defaultAnswers, buildAnswersFromFlags, type WizardAnswers } from "./wizard.js";

describe("wizard", () => {
  it("provides complete default answers", () => {
    const answers = defaultAnswers();
    expect(answers.templateName).toBe("assistant-team");
    expect(answers.orgName).toBe("My Agent Team");
    expect(answers.culturePreset).toBe("agency");
    expect(answers.llmProvider).toBe("anthropic");
    expect(answers.values.length).toBe(5);
    expect(answers.budgetLimit).toBe(500);
    expect(answers.port).toBe(8787);
    expect(answers.deploy).toBe(false);
  });

  it("overrides defaults from CLI flags", () => {
    const answers = buildAnswersFromFlags({
      template: "dev-shop",
      port: 9000,
      deploy: true,
    });
    expect(answers.templateName).toBe("dev-shop");
    expect(answers.port).toBe(9000);
    expect(answers.deploy).toBe(true);
    // non-overridden fields keep defaults
    expect(answers.orgName).toBe("My Agent Team");
  });

  it("uses template's culture preset as default", () => {
    const answers = buildAnswersFromFlags({ template: "dev-shop" });
    expect(answers.culturePreset).toBe("startup"); // dev-shop template uses startup preset
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && npx vitest run src/cli/wizard.test.ts`
Expected: FAIL

**Step 3: Implement wizard.ts**

The wizard module has two paths:
1. `runWizard()` — interactive, uses @clack/prompts (intro, select, text, multiselect, confirm)
2. `buildAnswersFromFlags()` + `defaultAnswers()` — non-interactive, used by `-y` flag

```typescript
// packages/openspawn/src/cli/wizard.ts
import * as p from "@clack/prompts";
import { listTemplates, getTemplate } from "./templates/index.js";
import {
  VALUE_DEFINITIONS,
  DEFAULT_VALUES,
  getConflicts,
  formatValueWarning,
} from "./alignment.js";
import {
  CulturePreset,
  LlmProvider,
  OverageBehavior,
  EscalationBehavior,
  OrgValue,
} from "../core/types.js";

export interface WizardAnswers {
  templateName: string;
  orgName: string;
  mission: string;
  vision: string;
  values: OrgValue[];
  culturePreset: CulturePreset;
  llmProvider: LlmProvider;
  defaultModel: string;
  seniorModel: string;
  budgetLimit: number;
  alertThreshold: number;
  overageBehavior: OverageBehavior;
  escalationBehavior: EscalationBehavior;
  port: number;
  deploy: boolean;
}

// ... implement defaultAnswers(), buildAnswersFromFlags(), runWizard()
```

The `runWizard()` function follows the 8-step flow from the design doc. Each step uses @clack/prompts:
- Step 1: `p.select()` for template (grouped by category)
- Step 2: `p.text()` for org name
- Step 3: `p.text()` for mission + vision, `p.multiselect()` for values with conflict detection
- Step 4: `p.select()` for culture preset (pre-selected from template)
- Step 5: `p.select()` for LLM provider + `p.text()` for model names
- Step 6: `p.text()` for budget + `p.select()` for overage behavior
- Step 7: `p.select()` for escalation behavior
- Step 8: `p.text()` for port + `p.confirm()` for Docker

Each step shows the template's default value. `p.isCancel()` checks at every step — if cancelled, exit gracefully.

**Step 4: Run tests**

Run: `cd packages/openspawn && npx vitest run src/cli/wizard.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add packages/openspawn/src/cli/wizard.ts packages/openspawn/src/cli/wizard.test.ts
git commit -m "feat(cli): add interactive wizard with 8-step flow"
```

---

### Task 7: Create Docker infra generator

**Files:**
- Create: `packages/openspawn/src/cli/docker-generator.ts`
- Test: `packages/openspawn/src/cli/docker-generator.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/cli/docker-generator.test.ts
import { describe, it, expect } from "vitest";
import { generateDockerInfra } from "./docker-generator.js";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
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
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && npx vitest run src/cli/docker-generator.test.ts`
Expected: FAIL

**Step 3: Implement docker-generator.ts**

```typescript
// packages/openspawn/src/cli/docker-generator.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

export function generateDockerInfra(dir: string, coordinatorPort: number): void {
  const pgPassword = randomBytes(24).toString("hex");

  const compose = `# OpenSpawn Infrastructure
# Run: docker compose up -d

services:
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: openspawn
      POSTGRES_USER: openspawn
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U openspawn"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
`;

  const envFile = `# OpenSpawn Environment
# Generated by openspawn init --deploy

POSTGRES_PASSWORD=${pgPassword}
DATABASE_URL=postgresql://openspawn:${pgPassword}@localhost:5432/openspawn
REDIS_URL=redis://localhost:6379
OPENSPAWN_PORT=${coordinatorPort}
`;

  writeFileSync(join(dir, "docker-compose.yml"), compose);
  writeFileSync(join(dir, ".env"), envFile);
}
```

**Step 4: Run tests**

Run: `cd packages/openspawn && npx vitest run src/cli/docker-generator.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add packages/openspawn/src/cli/docker-generator.ts packages/openspawn/src/cli/docker-generator.test.ts
git commit -m "feat(cli): add Docker infra generator for Postgres + Redis"
```

---

### Task 8: Create dry-run validator

**Files:**
- Create: `packages/openspawn/src/cli/dry-run.ts`
- Test: `packages/openspawn/src/cli/dry-run.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/cli/dry-run.test.ts
import { describe, it, expect } from "vitest";
import { simulateDryRun } from "./dry-run.js";

const SAMPLE_ORG = `# Test Org

## Structure

### Boss — CEO
- **Level:** 10
- **Domain:** operations

#### Worker — Engineer
- **Level:** 4
- **Domain:** engineering
`;

describe("dry-run", () => {
  it("returns simulation result with agent count", () => {
    const result = simulateDryRun(SAMPLE_ORG);
    expect(result.agentCount).toBe(2);
    expect(result.departments).toBeGreaterThan(0);
  });

  it("simulates sample task creation", () => {
    const result = simulateDryRun(SAMPLE_ORG);
    expect(result.sampleTask).toBeDefined();
    expect(result.sampleTask.assignee).toBe("Boss");
  });

  it("simulates delegation chain", () => {
    const result = simulateDryRun(SAMPLE_ORG);
    expect(result.delegationChain.length).toBeGreaterThan(0);
    expect(result.delegationChain[0]).toContain("Boss");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && npx vitest run src/cli/dry-run.test.ts`
Expected: FAIL

**Step 3: Implement dry-run.ts**

Uses `parseOrgMdContent()` to parse the generated ORG.md, then simulates:
1. Registering each agent
2. Creating a sample task assigned to the top-level agent
3. Simulating delegation down the hierarchy

Returns a `DryRunResult` with `agentCount`, `departments`, `sampleTask`, `delegationChain` — all displayed in the terminal after scaffold.

**Step 4: Run tests**

Run: `cd packages/openspawn && npx vitest run src/cli/dry-run.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add packages/openspawn/src/cli/dry-run.ts packages/openspawn/src/cli/dry-run.test.ts
git commit -m "feat(cli): add dry-run simulation for init validation"
```

---

### Task 9: Rewrite init command + update CLI entry point

**Files:**
- Modify: `packages/openspawn/src/cli/commands/init.ts`
- Modify: `packages/openspawn/src/cli/index.ts`
- Test: `packages/openspawn/src/cli/commands/init.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/cli/commands/init.test.ts
import { describe, it, expect } from "vitest";
import { scaffold } from "../commands/init.js";
import { defaultAnswers } from "../wizard.js";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("init scaffold", () => {
  it("creates ORG.md from template", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, "ORG.md"))).toBe(true);
    const org = readFileSync(join(dir, "ORG.md"), "utf-8");
    expect(org).toContain("# My Agent Team");
  });

  it("creates openspawn.config.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, "openspawn.config.json"))).toBe(true);
  });

  it("creates .gitignore", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    const gi = readFileSync(join(dir, ".gitignore"), "utf-8");
    expect(gi).toContain("node_modules");
    expect(gi).toContain(".env");
  });

  it("creates workspaces with SOUL.md", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, "workspaces"))).toBe(true);
    expect(existsSync(join(dir, "openclaw-agents.json"))).toBe(true);
  });

  it("creates .openspawn/tasks.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, ".openspawn", "tasks.json"))).toBe(true);
  });

  it("does not overwrite existing ORG.md", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    const { writeFileSync } = require("node:fs");
    writeFileSync(join(dir, "ORG.md"), "existing");
    scaffold(dir, defaultAnswers());
    const org = readFileSync(join(dir, "ORG.md"), "utf-8");
    expect(org).toBe("existing");
  });

  it("generates docker infra when deploy is true", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    const answers = { ...defaultAnswers(), deploy: true };
    scaffold(dir, answers);
    expect(existsSync(join(dir, "docker-compose.yml"))).toBe(true);
    expect(existsSync(join(dir, ".env"))).toBe(true);
  });

  it("skips docker infra when deploy is false", () => {
    const dir = mkdtempSync(join(tmpdir(), "os-init-"));
    scaffold(dir, defaultAnswers());
    expect(existsSync(join(dir, "docker-compose.yml"))).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && npx vitest run src/cli/commands/init.test.ts`
Expected: FAIL

**Step 3: Rewrite init.ts**

The new `init.ts` exports two functions:
- `initCommand(args, ctx)` — parses flags, decides wizard vs non-interactive, calls `scaffold()`
- `scaffold(dir, answers)` — pure function that writes all files

```typescript
// packages/openspawn/src/cli/commands/init.ts
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getTemplate, renderTemplate } from "../templates/index.js";
import { generateWorkspaces } from "../workspace-generator.js";
import { generateDockerInfra } from "../docker-generator.js";
import { writeConfig } from "../../core/config.js";
import { runWizard, defaultAnswers, buildAnswersFromFlags, type WizardAnswers } from "../wizard.js";
import { simulateDryRun, printDryRunResult } from "../dry-run.js";
import { parseOrgMdContent } from "../../core/org-parser.js";
import { printAgentTree } from "../tree-printer.js"; // reuse from org command or create
import type { OpenSpawnConfig } from "../../core/types.js";
// ... implementation that wires everything together
```

**Step 4: Update CLI entry point**

Modify `packages/openspawn/src/cli/index.ts` to parse new flags:
- `--template` / `-t`
- `--yes` / `-y`
- `--non-interactive`
- `--dry-run`
- `--deploy`
- `--port` / `-p`

Pass these as structured options to `initCommand()`.

**Step 5: Run tests**

Run: `cd packages/openspawn && npx vitest run src/cli/commands/init.test.ts`
Expected: PASS (8 tests)

**Step 6: Run all tests**

Run: `cd packages/openspawn && npx vitest run`
Expected: ALL PASS

**Step 7: Type check**

Run: `cd packages/openspawn && npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add packages/openspawn/src/cli/commands/init.ts packages/openspawn/src/cli/index.ts packages/openspawn/src/cli/commands/init.test.ts
git commit -m "feat(cli): rewrite init command with wizard, templates, workspace gen"
```

---

### Task 10: Fix existing `as any` casts

**Files:**
- Modify: `packages/openspawn/src/mcp/server.ts` (line 34)
- Modify: `packages/openspawn/src/mcp/tools.ts` (line 70)

**Step 1: Fix server.ts**

`sessionIdGenerator: undefined as any` — check @modelcontextprotocol/sdk types for the correct way to disable session IDs or provide a proper generator function.

**Step 2: Fix tools.ts**

`(org.policies as any)[params.policyKey]` — add `policyKey` as a proper typed key of the `policies` interface, or use a type-safe lookup.

**Step 3: Type check**

Run: `cd packages/openspawn && npx tsc --noEmit`
Expected: No errors

**Step 4: Run tests**

Run: `cd packages/openspawn && npx vitest run`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add packages/openspawn/src/mcp/server.ts packages/openspawn/src/mcp/tools.ts
git commit -m "fix(cli): remove as-any casts in MCP server and tools"
```

---

### Task 11: Build, lint, and verify

**Step 1: Build**

Run: `cd packages/openspawn && pnpm run build`
Expected: tsc compiles to dist/ without errors

**Step 2: Lint**

Run: `pnpm exec oxfmt --write packages/openspawn/ && pnpm exec nx run-many -t lint`
Expected: Clean

**Step 3: Manual smoke test**

Run: `cd /tmp && npx /Users/adamdennis/github/openspawn/openspawn/packages/openspawn init test-org -y`

Expected output:
- Creates `test-org/` directory
- `ORG.md` with assistant-team template
- `openspawn.config.json` with defaults
- `workspaces/` with SOUL.md per agent
- Agent hierarchy tree printed

**Step 4: Commit any lint fixes**

```bash
git add -u && git commit -m "chore(cli): format and lint fixes"
```

---

### Task 12: Update documentation

**Files:**
- Modify: `apps/docs/src/content/docs/guides/templates.md` (if exists)
- Modify: relevant getting-started docs

**Step 1:** Update docs to reflect new wizard flow, all 11 templates, new flags, config file format.

**Step 2:** Add note about documentation deliverables (values framework page with HBR references) as a follow-up issue.

**Step 3: Commit**

```bash
git add apps/docs/ && git commit -m "docs(cli): update CLI docs for new init wizard"
```

---

## Summary

| Task | What | New Files | Tests |
|------|------|-----------|-------|
| 1 | Add @clack/prompts | — | — |
| 2 | Config schema + types | config.ts | 3 |
| 3 | Template system (11) | templates/*.ts | 7 |
| 4 | Alignment framework | alignment.ts | 6 |
| 5 | Workspace generator | workspace-generator.ts | 6 |
| 6 | Interactive wizard | wizard.ts | 3 |
| 7 | Docker infra gen | docker-generator.ts | 3 |
| 8 | Dry-run validator | dry-run.ts | 3 |
| 9 | Rewrite init + CLI | init.ts, index.ts | 8 |
| 10 | Fix `as any` casts | server.ts, tools.ts | — |
| 11 | Build + lint + smoke | — | — |
| 12 | Update docs | docs/ | — |

**Total: ~39 new tests across 7 test files**
