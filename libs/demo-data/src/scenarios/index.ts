export { freshScenario } from './fresh.js';
export { startupScenario } from './startup.js';
export { growthScenario } from './growth.js';
export { enterpriseScenario } from './enterprise.js';
export { novatechScenario, PROJECT_PHASES, novatechTasks, NOVATECH_AGENTS } from './novatech.js';

import { freshScenario } from './fresh.js';
import { startupScenario } from './startup.js';
import { growthScenario } from './growth.js';
import { enterpriseScenario } from './enterprise.js';
import { novatechScenario } from './novatech.js';
import type { DemoScenario } from '../types.js';

export const scenarios: Record<string, DemoScenario> = {
  novatech: novatechScenario,  // Default - realistic product launch
  fresh: freshScenario,
  startup: startupScenario,
  growth: growthScenario,
  enterprise: enterpriseScenario,
};

// Default scenario for demos
export const defaultScenario = novatechScenario;

export function getScenario(name: string): DemoScenario {
  const scenario = scenarios[name];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}. Available: ${Object.keys(scenarios).join(', ')}`);
  }
  return scenario;
}

export type ScenarioName = keyof typeof scenarios;
