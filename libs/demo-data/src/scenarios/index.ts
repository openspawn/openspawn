export { freshScenario } from './fresh.js';
export { startupScenario } from './startup.js';
export { growthScenario } from './growth.js';
export { enterpriseScenario } from './enterprise.js';

import { freshScenario } from './fresh.js';
import { startupScenario } from './startup.js';
import { growthScenario } from './growth.js';
import { enterpriseScenario } from './enterprise.js';
import type { DemoScenario } from '../types.js';

export const scenarios: Record<string, DemoScenario> = {
  fresh: freshScenario,
  startup: startupScenario,
  growth: growthScenario,
  enterprise: enterpriseScenario,
};

export function getScenario(name: string): DemoScenario {
  const scenario = scenarios[name];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}. Available: ${Object.keys(scenarios).join(', ')}`);
  }
  return scenario;
}

export type ScenarioName = keyof typeof scenarios;
