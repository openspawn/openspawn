export { freshScenario } from "./fresh";
export { startupScenario } from "./startup";
export { growthScenario } from "./growth";
export { enterpriseScenario } from "./enterprise";
export { acmetechScenario, PROJECT_PHASES, acmetechTasks, ACMETECH_AGENTS } from "./acmetech";
export { krustyKrabScenario, KRUSTY_KRAB_AGENTS } from "./krusty-krab";

import { freshScenario } from "./fresh";
import { startupScenario } from "./startup";
import { growthScenario } from "./growth";
import { enterpriseScenario } from "./enterprise";
import { acmetechScenario } from "./acmetech";
import { krustyKrabScenario } from "./krusty-krab";
import type { DemoScenario } from "../types";

export const scenarios: Record<string, DemoScenario> = {
  acmetech: acmetechScenario, // Default - realistic product launch
  fresh: freshScenario,
  startup: startupScenario,
  growth: growthScenario,
  enterprise: enterpriseScenario,
  "krusty-krab": krustyKrabScenario, // SpongeBob themed - for bikinibottom.ai
};

// Default scenario for demos
export const defaultScenario = acmetechScenario;

export function getScenario(name: string): DemoScenario {
  const scenario = scenarios[name];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}. Available: ${Object.keys(scenarios).join(", ")}`);
  }
  return scenario;
}

export type ScenarioName = keyof typeof scenarios;
