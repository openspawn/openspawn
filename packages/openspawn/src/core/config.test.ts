import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseConfig, writeConfig, defaultConfig } from "./config.js";
import {
  LlmProvider,
  OverageBehavior,
  EscalationBehavior,
  CulturePreset,
  OrgValue,
} from "./types.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "openspawn-config-"));
});

describe("parseConfig", () => {
  it("returns default config when no file exists", () => {
    const config = parseConfig(dir);
    expect(config).toEqual(defaultConfig);
    expect(config.llm.provider).toBe(LlmProvider.Anthropic);
    expect(config.budget.overageBehavior).toBe(OverageBehavior.PauseAndEscalate);
    expect(config.escalation.behavior).toBe(EscalationBehavior.Immediate);
    expect(config.culture.preset).toBe(CulturePreset.Agency);
  });

  it("reads config from file and merges with defaults", () => {
    const partial = {
      llm: {
        provider: LlmProvider.OpenAI,
        models: { default: "gpt-4o", senior: "o1" },
      },
      budget: { perAgentLimit: 50 },
    };
    writeFileSync(join(dir, "openspawn.config.json"), JSON.stringify(partial), "utf-8");

    const config = parseConfig(dir);

    // overridden values
    expect(config.llm.provider).toBe(LlmProvider.OpenAI);
    expect(config.llm.models.default).toBe("gpt-4o");
    expect(config.llm.models.senior).toBe("o1");
    expect(config.budget.perAgentLimit).toBe(50);

    // defaults preserved
    expect(config.llm.seniorThreshold).toBe(defaultConfig.llm.seniorThreshold);
    expect(config.budget.period).toBe(defaultConfig.budget.period);
    expect(config.budget.alertThreshold).toBe(defaultConfig.budget.alertThreshold);
    expect(config.budget.overageBehavior).toBe(defaultConfig.budget.overageBehavior);
    expect(config.coordinator.port).toBe(defaultConfig.coordinator.port);
    expect(config.alignment).toEqual(defaultConfig.alignment);
  });

  it("replaces arrays instead of merging them", () => {
    const partial = {
      alignment: {
        values: [OrgValue.Speed, OrgValue.Rigor],
      },
    };
    writeFileSync(join(dir, "openspawn.config.json"), JSON.stringify(partial), "utf-8");

    const config = parseConfig(dir);
    expect(config.alignment.values).toEqual([OrgValue.Speed, OrgValue.Rigor]);
  });
});

describe("writeConfig", () => {
  it("writes config to file correctly", () => {
    writeConfig(dir, defaultConfig);

    const raw = readFileSync(join(dir, "openspawn.config.json"), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    expect(parsed).toEqual(defaultConfig);
  });
});
