import type { DemoScenario } from '../types';
import { agents } from '../fixtures/agents';
import { tasks } from '../fixtures/tasks';
import { creditTransactions } from '../fixtures/credits';
import { events } from '../fixtures/events';
import { generateInitialMessages } from '../fixtures/messages';
import { demoWebhooks } from '../fixtures/webhooks';

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
  webhooks: demoWebhooks,
};

export default growthScenario;
