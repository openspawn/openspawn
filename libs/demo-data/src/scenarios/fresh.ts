import type { DemoScenario } from '../types.js';
import { agents, AGENT_IDS } from '../fixtures/agents.js';

/**
 * Fresh Scenario: Brand new tenant
 * - 1 agent (COO only - Agent Dennis)
 * - No tasks yet
 * - No credit history
 * - Agents spawn dynamically as simulation runs
 */
export const freshScenario: DemoScenario = {
  name: 'fresh',
  description: 'Fresh start - just the COO, agents spawn dynamically',
  
  // Start with only Agent Dennis (COO)
  agents: [
    agents.find(a => a.id === AGENT_IDS.agentDennis)!,
  ],
  
  // No initial tasks - they'll be created during simulation
  tasks: [],
  
  // No credit history yet
  credits: [],
  
  // No events yet
  events: [],
};

export default freshScenario;
