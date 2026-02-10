import type { DemoScenario } from '../types';
import { agents, AGENT_IDS } from '../fixtures/agents';

/**
 * Fresh Scenario: Brand new tenant
 * - 2 agents (COO + Talent Agent)
 * - No tasks yet
 * - No credit history
 * - Agents spawn dynamically as simulation runs
 */
export const freshScenario: DemoScenario = {
  name: 'fresh',
  description: 'Fresh start - COO + Talent Agent, agents spawn dynamically',
  
  // Start with Agent Dennis (COO) and Tech Talent Agent
  agents: [
    agents.find(a => a.id === AGENT_IDS.agentDennis)!,
    agents.find(a => a.id === AGENT_IDS.techTalent)!,
  ],
  
  // No initial tasks - they'll be created during simulation
  tasks: [],
  
  // No credit history yet
  credits: [],
  
  // No events yet
  events: [],
  
  // No messages yet
  messages: [],
};

export default freshScenario;
