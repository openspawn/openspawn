import type { DemoScenario, DemoAgent, DemoTask, DemoCreditTransaction, DemoEvent } from '../types.js';
import { agents, AGENT_IDS, generateRandomAgent } from '../fixtures/agents.js';
import { tasks, generateRandomTask } from '../fixtures/tasks.js';
import { creditTransactions, generateCreditTransaction } from '../fixtures/credits.js';
import { events, generateEvent } from '../fixtures/events.js';
import { generateInitialMessages } from '../fixtures/messages.js';

// Additional domains for enterprise scale
const ENTERPRISE_DOMAINS = ['Engineering', 'Finance', 'Marketing', 'Sales', 'Support', 'Research', 'Legal', 'HR'];

// Generate additional agents for enterprise scale
function generateEnterpriseAgents(): DemoAgent[] {
  const extraAgents: DemoAgent[] = [];
  
  // Add more talent agents
  const talentAgentNames = ['Support Talent Agent', 'Research Talent Agent', 'Legal Talent Agent', 'People Talent Agent'];
  const talentDomains = ['Support', 'Research', 'Legal', 'HR'];
  
  talentAgentNames.forEach((name, i) => {
    extraAgents.push(generateRandomAgent({
      name,
      role: 'hr',
      level: 9,
      status: 'active',
      model: i % 2 === 0 ? 'claude-sonnet-4' : 'gpt-4o',
      currentBalance: 8000 + Math.floor(Math.random() * 5000),
      lifetimeEarnings: 20000 + Math.floor(Math.random() * 15000),
      parentId: AGENT_IDS.agentDennis,
      domain: talentDomains[i],
    }));
  });
  
  // Add more seniors (2 per domain)
  ENTERPRISE_DOMAINS.forEach(domain => {
    for (let i = 0; i < 2; i++) {
      extraAgents.push(generateRandomAgent({
        name: `${domain} Senior ${i + 1}`,
        role: 'senior',
        level: 5 + Math.floor(Math.random() * 2),
        status: Math.random() > 0.9 ? 'paused' : 'active',
        model: Math.random() > 0.5 ? 'claude-sonnet-4' : 'gpt-4o',
        currentBalance: 1500 + Math.floor(Math.random() * 2000),
        lifetimeEarnings: 8000 + Math.floor(Math.random() * 8000),
        domain,
      }));
    }
  });
  
  // Add more workers (3 per domain)
  ENTERPRISE_DOMAINS.forEach(domain => {
    for (let i = 0; i < 3; i++) {
      extraAgents.push(generateRandomAgent({
        name: `${domain} Worker ${i + 1}`,
        role: 'worker',
        level: 2 + Math.floor(Math.random() * 3),
        status: Math.random() > 0.85 ? 'pending' : 'active',
        model: 'gpt-4o-mini',
        currentBalance: 500 + Math.floor(Math.random() * 1500),
        lifetimeEarnings: 2000 + Math.floor(Math.random() * 5000),
        domain,
      }));
    }
  });
  
  return extraAgents;
}

// Generate more tasks
function generateEnterpriseTasks(): DemoTask[] {
  const extraTasks: DemoTask[] = [];
  const taskTemplates = [
    { title: 'Review documentation', priority: 'normal' as const },
    { title: 'Fix critical bug', priority: 'critical' as const },
    { title: 'Implement feature', priority: 'high' as const },
    { title: 'Write tests', priority: 'normal' as const },
    { title: 'Performance optimization', priority: 'high' as const },
    { title: 'Security audit', priority: 'critical' as const },
    { title: 'User research', priority: 'normal' as const },
    { title: 'Create report', priority: 'low' as const },
  ];
  
  for (let i = 0; i < 40; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    extraTasks.push(generateRandomTask({
      title: `${template.title} #${i + 100}`,
      priority: template.priority,
    }));
  }
  
  return extraTasks;
}

// Generate enterprise-scale credit activity
function generateEnterpriseCredits(enterpriseAgents: DemoAgent[]): DemoCreditTransaction[] {
  const extraCredits: DemoCreditTransaction[] = [];
  
  enterpriseAgents.forEach(agent => {
    // Initial allocation
    extraCredits.push(generateCreditTransaction(
      agent.id,
      'CREDIT',
      agent.currentBalance + 1000,
      `Initial budget for ${agent.name}`
    ));
    
    // Some usage
    if (Math.random() > 0.3) {
      extraCredits.push(generateCreditTransaction(
        agent.id,
        'DEBIT',
        Math.floor(Math.random() * 100),
        'Model usage'
      ));
    }
  });
  
  return extraCredits;
}

// Generate enterprise events
function generateEnterpriseEvents(enterpriseAgents: DemoAgent[]): DemoEvent[] {
  const extraEvents: DemoEvent[] = [];
  
  enterpriseAgents.forEach(agent => {
    extraEvents.push(generateEvent(
      'agent.created',
      'info',
      `${agent.name} joined the organization`,
      { agentId: agent.id, metadata: { level: agent.level, domain: agent.domain } }
    ));
  });
  
  return extraEvents;
}

// Build the enterprise scenario
const enterpriseAgents = generateEnterpriseAgents();
const enterpriseTasks = generateEnterpriseTasks();
const enterpriseCredits = generateEnterpriseCredits(enterpriseAgents);
const enterpriseEvents = generateEnterpriseEvents(enterpriseAgents);

// Build combined agent and task lists
const allEnterpriseAgents = [...agents, ...enterpriseAgents];
const allEnterpriseTasks = [...tasks, ...enterpriseTasks];

/**
 * Enterprise Scenario: Large organization
 * - 50+ agents across 8 domains
 * - 50+ tasks in various stages
 * - Complex credit economy with transfers
 */
export const enterpriseScenario: DemoScenario = {
  name: 'enterprise',
  description: 'Large organization - 50+ agents, 8 domains, complex hierarchy',
  agents: allEnterpriseAgents,
  tasks: allEnterpriseTasks,
  credits: [...creditTransactions, ...enterpriseCredits],
  events: [...events, ...enterpriseEvents],
  messages: generateInitialMessages(
    allEnterpriseAgents.map(a => a.id),
    allEnterpriseTasks.map(t => t.identifier)
  ),
};

export default enterpriseScenario;
