import type { DemoScenario } from '../types';
import { agents, AGENT_IDS, generateRandomAgent } from '../fixtures/agents';
import { tasks, generateRandomTask } from '../fixtures/tasks';
import { creditTransactions } from '../fixtures/credits';
import { events } from '../fixtures/events';
import { generateInitialMessages } from '../fixtures/messages';
import { demoWebhooks } from '../fixtures/webhooks';

/**
 * Startup Scenario: Small team, early stage
 * - 5 agents (COO + 2 talent + 2 workers)
 * - 10 tasks across all stages
 * - Limited credit activity
 */
export const startupScenario: DemoScenario = {
  name: 'startup',
  description: 'Small team, early stage - 5 agents, 10 tasks',
  
  agents: [
    // Keep only core agents
    agents.find(a => a.id === AGENT_IDS.agentDennis)!,
    agents.find(a => a.id === AGENT_IDS.techTalent)!,
    agents.find(a => a.id === AGENT_IDS.marketingTalent)!,
    agents.find(a => a.id === AGENT_IDS.codeReviewer)!,
    agents.find(a => a.id === AGENT_IDS.copywriter)!,
  ],
  
  tasks: tasks.slice(0, 10),
  
  credits: creditTransactions.filter(t => 
    [AGENT_IDS.agentDennis, AGENT_IDS.techTalent, AGENT_IDS.marketingTalent, 
     AGENT_IDS.codeReviewer, AGENT_IDS.copywriter].includes(t.agentId as any)
  ),
  
  events: events.filter(e => 
    !e.agentId || 
    [AGENT_IDS.agentDennis, AGENT_IDS.techTalent, AGENT_IDS.marketingTalent,
     AGENT_IDS.codeReviewer, AGENT_IDS.copywriter].includes(e.agentId as any)
  ),
  
  messages: generateInitialMessages(
    [AGENT_IDS.agentDennis, AGENT_IDS.techTalent, AGENT_IDS.marketingTalent,
     AGENT_IDS.codeReviewer, AGENT_IDS.copywriter],
    tasks.slice(0, 10).map(t => t.identifier)
  ),
  
  // Include demo webhooks for startup scenario
  webhooks: demoWebhooks.slice(0, 3),
};

export default startupScenario;
