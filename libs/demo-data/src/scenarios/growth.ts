import type { DemoScenario } from '../types.js';
import { agents } from '../fixtures/agents.js';
import { tasks } from '../fixtures/tasks.js';
import { creditTransactions } from '../fixtures/credits.js';
import { events } from '../fixtures/events.js';
import { generateInitialMessages } from '../fixtures/messages.js';

/**
 * Growth Scenario: Scaling team
 * - 14 agents across all levels and domains
 * - 13+ tasks in various stages
 * - Active credit economy
 * 
 * This is the default scenario matching the network visualization
 */
export const growthScenario: DemoScenario = {
  name: 'growth',
  description: 'Scaling team - 14 agents, 4 domains, active economy',
  agents: [...agents],
  tasks: [...tasks],
  credits: [...creditTransactions],
  events: [...events],
  messages: generateInitialMessages(
    agents.map(a => a.id),
    tasks.map(t => t.identifier)
  ),
};

export default growthScenario;
