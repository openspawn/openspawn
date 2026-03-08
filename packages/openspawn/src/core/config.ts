import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  type OpenSpawnConfig,
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
    models: { default: "claude-sonnet-4-20250514", senior: "claude-opus-4-20250514" },
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
    vision: "Every task owned, every blocker surfaced, every outcome measured.",
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMerge<T>(defaults: T, overrides: Partial<T>): T {
  const result: Record<string, unknown> = {};
  const defaultsRecord = defaults as Record<string, unknown>;
  const overridesRecord = overrides as Record<string, unknown>;

  for (const key of Object.keys(defaultsRecord)) {
    const defaultVal = defaultsRecord[key];
    const overrideVal = overridesRecord[key];

    if (overrideVal === undefined) {
      result[key] = defaultVal;
    } else if (isPlainObject(defaultVal) && isPlainObject(overrideVal)) {
      result[key] = deepMerge(defaultVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }

  return result as T;
}

export function parseConfig(dir: string): OpenSpawnConfig {
  const filePath = join(dir, CONFIG_FILENAME);

  if (!existsSync(filePath)) {
    return { ...defaultConfig };
  }

  const raw = readFileSync(filePath, "utf-8");
  const overrides = JSON.parse(raw) as Partial<OpenSpawnConfig>;
  return deepMerge(defaultConfig, overrides);
}

export function writeConfig(dir: string, config: OpenSpawnConfig): void {
  const filePath = join(dir, CONFIG_FILENAME);
  writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}
