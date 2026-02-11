// ── Scenario Registry ────────────────────────────────────────────────────────
import { aiDevAgencyScenario } from './ai-dev-agency.js';
import type { ScenarioDefinition } from '../scenario-types.js';

export const SCENARIO_REGISTRY: Record<string, ScenarioDefinition> = {
  'ai-dev-agency': aiDevAgencyScenario,
};
